/**
 * El entrenamiento en curso, cifrado en reposo en el teléfono (precierre del 2026-10-06, §4).
 *
 * El encargo del 2026-10-06 pedía guardar por cuenta; no pedía guardar sin cifrar. Aislar por cuenta, cifrar en reposo y
 * excluir del respaldo son tres controles distintos, y la app tiene los tres:
 * - **Aislado por cuenta:** una clave de AsyncStorage por cuenta, con la identidad adentro (`almacen-de-entrenamiento.ts`).
 * - **Cifrado en reposo:** AES-256-GCM de expo-crypto (`aesEncryptAsync`), una implementación mantenida: acá no hay
 *   criptografía propia. Los datos asociados (AAD) son la clave de AsyncStorage, así que lo de una cuenta copiado a la
 *   clave de otra no descifra.
 * - **Fuera del respaldo y de las transferencias de Android:** las reglas de `plugins/respaldo-de-android.js`.
 *
 * **La clave de cifrado** es aleatoria, una por cuenta, y vive en el almacenamiento seguro del sistema (expo-secure-store:
 * cifrada con una clave del Keystore de Android, fuera del respaldo). Ahí va solo la clave, de 44 caracteres: el
 * historial nunca entra en el almacenamiento seguro. En AsyncStorage queda solo lo cifrado.
 *
 * **Los casos difíciles:**
 * - **Lo que guardó una versión anterior sin cifrar** se lee igual (`enClaro`), y la próxima escritura lo cifra: la
 *   migración no pierde nada. Ninguna APK publicada guardó el entrenamiento en curso: esto cubre las de prueba.
 * - **La clave no está** (se borraron los datos del almacenamiento seguro, o se restauró un respaldo que la dejó afuera):
 *   lo cifrado no se puede leer y se informa como ilegible. El almacén lo aparta tal cual antes de escribir encima, y la
 *   próxima escritura crea una clave nueva. Lo que se había enviado se recupera del servicio.
 * - **El almacenamiento seguro no responde:** es una lectura (o una escritura) fallida. Nunca se crea una clave nueva por
 *   un error que puede ser pasajero: eso dejaría ilegible lo guardado.
 *
 * Es lógica pura: el cifrador y los almacenamientos se inyectan (`entrenamiento-en-curso.ts` pone expo-crypto,
 * expo-secure-store y AsyncStorage). Las pruebas usan AES-GCM de Node, el mismo algoritmo.
 */
import { apartarTalCual, type AlmacenDeLaCuenta, type AlmacenPlano, type LecturaGuardada } from './almacen-de-entrenamiento';

/** Así empieza un valor cifrado por esta versión: el prefijo dice el formato, para poder cambiarlo sin adivinar. */
export const PREFIJO_CIFRADO = 'be-cifrado-1:';

/** AES-GCM, con la clave en base64. */
export interface CifradorAes {
  /** Una clave nueva de 256 bits, en base64. */
  nuevaClave(): Promise<string>;
  /** Cifra: devuelve el vector inicial, lo cifrado y la etiqueta, juntos y en base64. */
  cifrar(claveB64: string, datos: Uint8Array, asociados: Uint8Array): Promise<string>;
  /** Descifra. Lanza si los datos, la etiqueta o los datos asociados no corresponden. */
  descifrar(claveB64: string, combinadoB64: string, asociados: Uint8Array): Promise<Uint8Array>;
}

/** El almacenamiento seguro del sistema, para la clave de cifrado de cada cuenta. */
export interface AlmacenDeClaves {
  leer(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
}

/** Dónde vive, en el almacenamiento seguro, la clave de cifrado de un valor (solo letras, números, puntos y guiones). */
export const claveDeCifrado = (claveDelValor: string): string => `be.clave.${claveDelValor.replace(/[^A-Za-z0-9._-]/g, '_')}`;

// ─── UTF-8 ──────────────────────────────────────────────────────────────────────────────────────

/** El texto en UTF-8. Sin depender de TextEncoder, que no todos los motores de JavaScript del teléfono tienen. */
export function aUtf8(texto: string): Uint8Array {
  const bytes: number[] = [];
  for (const caracter of texto) {
    const c = caracter.codePointAt(0)!;
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    else bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return Uint8Array.from(bytes);
}

/** El texto de unos bytes UTF-8. Lanza si no son UTF-8 válido: lo descifrado tiene que ser exactamente lo cifrado. */
export function desdeUtf8(bytes: Uint8Array): string {
  let texto = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i]!;
    const largo = b < 0x80 ? 1 : b >> 5 === 0x6 ? 2 : b >> 4 === 0xe ? 3 : b >> 3 === 0x1e ? 4 : 0;
    if (largo === 0 || i + largo > bytes.length) throw new Error('No es UTF-8.');
    let c = largo === 1 ? b : b & (0xff >> (largo + 1));
    for (let j = 1; j < largo; j++) {
      const sig = bytes[i + j]!;
      if (sig >> 6 !== 0x2) throw new Error('No es UTF-8.');
      c = (c << 6) | (sig & 0x3f);
    }
    texto += String.fromCodePoint(c);
    i += largo;
  }
  return texto;
}

// ─── El almacén cifrado ─────────────────────────────────────────────────────────────────────────

export function crearAlmacenCifrado(o: { readonly plano: AlmacenPlano; readonly claves: AlmacenDeClaves; readonly aes: CifradorAes }): AlmacenDeLaCuenta {
  /** La clave de cada valor, ya leída o creada en este proceso: no se pide al almacenamiento seguro en cada escritura. */
  const enMemoria = new Map<string, string>();
  /** Una creación de clave a la vez por valor: dos escrituras seguidas no crean dos claves. */
  const creando = new Map<string, Promise<string>>();

  /** La clave guardada, o `null` si no hay. Lanza si el almacenamiento seguro no respondió. */
  async function claveGuardada(claveDelValor: string): Promise<string | null> {
    const recordada = enMemoria.get(claveDelValor);
    if (recordada) return recordada;
    const leida = await o.claves.leer(claveDeCifrado(claveDelValor));
    if (leida) enMemoria.set(claveDelValor, leida);
    return leida;
  }

  /** La clave para escribir: la guardada, o una nueva, guardada antes de usarla. */
  function claveParaEscribir(claveDelValor: string): Promise<string> {
    const enCurso = creando.get(claveDelValor);
    if (enCurso) return enCurso;
    const pedido = (async () => {
      const guardada = await claveGuardada(claveDelValor);
      if (guardada) return guardada;
      const nueva = await o.aes.nuevaClave();
      await o.claves.guardar(claveDeCifrado(claveDelValor), nueva);
      enMemoria.set(claveDelValor, nueva);
      return nueva;
    })().finally(() => creando.delete(claveDelValor));
    creando.set(claveDelValor, pedido);
    return pedido;
  }

  return {
    async leer(clave): Promise<LecturaGuardada> {
      const crudo = await o.plano.leer(clave);
      if (crudo === null) return { tipo: 'nada' };
      if (!crudo.startsWith(PREFIJO_CIFRADO)) return { tipo: 'texto', texto: crudo, enClaro: true };
      const claveB64 = await claveGuardada(clave);
      if (!claveB64) return { tipo: 'ilegible', motivo: 'sin-clave' };
      try {
        const bytes = await o.aes.descifrar(claveB64, crudo.slice(PREFIJO_CIFRADO.length), aUtf8(clave));
        return { tipo: 'texto', texto: desdeUtf8(bytes), enClaro: false };
      } catch {
        return { tipo: 'ilegible', motivo: 'no-descifra' };
      }
    },
    async guardar(clave, texto) {
      const claveB64 = await claveParaEscribir(clave);
      const cifrado = await o.aes.cifrar(claveB64, aUtf8(texto), aUtf8(clave));
      await o.plano.guardar(clave, `${PREFIJO_CIFRADO}${cifrado}`);
    },
    apartar: (clave, destino) => apartarTalCual(o.plano, clave, destino),
  };
}
