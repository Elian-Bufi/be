/**
 * El entrenamiento en curso guardado en el teléfono, por cuenta (WP-ENTRENAMIENTO-SERIES §7.5 y §8 del encargo).
 *
 * **Qué se guarda.** Por cada sesión que se está registrando: el borrador (draftId), la ocurrencia, la corrida con sus
 * eventos registrados y pendientes, la sesión de API-SER-02 (para verla sin red), el último borrador leído, las series
 * pendientes de enviar y la fila o el ejercicio activo. Además, si la cuenta ya vio la explicación de los tiempos.
 *
 * **Aislado por cuenta.** Todo va en una clave con la identidad de la sesión (`claveDeLaCuenta`), y la identidad va
 * también adentro: lo de otra cuenta no se lee ni se sincroniza, aunque alguien lo copie a esta clave. Cambiar de cuenta
 * deja de mostrar lo anterior, y una respuesta que llega tarde para la cuenta anterior no se aplica.
 *
 * **Dónde está guardado cada dato** (precierre del 2026-10-06, §1). Son dos cosas distintas, y la pantalla dice cuál:
 * - **El guardado en el teléfono** (`estadoDelGuardado`): leyendo, guardando, en el teléfono, falló al guardar o sin
 *   leer. «Guardada en el teléfono» se dice solo cuando la escritura que la incluye terminó bien
 *   (`proteccionDeSerie`). Si una escritura falla, lo escrito sigue en la app, la pantalla dice que todavía no está
 *   protegido ante un cierre y se puede reintentar; cada cambio nuevo vuelve a intentar.
 * - **El envío al servicio** (`estadoDeSincronizacion`): pendiente, enviando, sincronizado, error recuperable con
 *   «Reintentar» y conflicto. Un conflicto no se pisa: se muestra y la persona decide.
 *   - Las series viajan con API-TRN-17, que reemplaza `exercises` entero con la versión que se vio. Un 409 o un 422 es
 *     conflicto: no se reintenta solo.
 *   - Los eventos viajan con API-TIE-01, en lotes de hasta 30 y en orden. `RECORDED` y `DUPLICATE` salen de pendientes;
 *     `CONFLICT` y `REJECTED` quedan y se muestran.
 *
 * **Una lectura fallida no es «no hay nada».**
 * - Si el almacenamiento no responde (después de reintentar), no se escribe encima: lo nuevo queda solo en la app
 *   (`sin-leer`) hasta que se pueda leer, y entonces se suma a lo guardado.
 * - Si hay algo guardado que no se puede leer (otra forma, otra cuenta adentro, una sesión ilegible, o cifrado sin su
 *   clave), antes de escribir encima se aparta tal cual a una clave de recuperación (`claveDeRecuperacion`) y se
 *   verifica la copia. Si no se puede apartar, tampoco se escribe. Nunca se borra en silencio ni se imprime.
 *
 * **Si el proceso murió con una medición abierta** se pregunta al volver (`medicionDeOtroProceso`): la medición la
 * abrió un evento que no creó este proceso. No depende de la base del reloj: con el reloj desde el arranque, el ancla
 * es la misma después de reabrir la app, y aun así no se puede afirmar cuándo terminó.
 *
 * Es lógica pura: el almacenamiento, la API, el reloj y los identificadores se inyectan (`entrenamiento-en-curso.ts`
 * pone AsyncStorage cifrado, la API real, el reloj del teléfono y expo-crypto). Así se prueba sin teléfono.
 */
import {
  aplicarEventos,
  BorradorDeEjecucionSchema,
  EventoDeTiempoSchema,
  mismoEvento,
  SerieEjecutadaSchema,
  SesionConObjetivosSchema,
  type BorradorDeEjecucion,
  type ClienteBe,
  type ContextoDeEventos,
  type EventoDeTiempo,
  type MedicionAbierta,
  type Resultado,
  type SesionConObjetivos,
} from '@be/domain';
import { aplicarResultadosDelLote, armarAccion, CORRIDA_VACIA, corridaAbierta, estadoLocal, loteSiguiente, type AccionDeTiempo, type Corrida, type ResultadoDeAccion } from './corrida-de-entrenamiento';
import type { RelojDeSesion } from './reloj-de-sesion';
import { conciliarSeries, ejerciciosParaGuardar, mismosDatos, type ProteccionDeSerie, type SerieLocal } from './series-de-la-sesion';

/** En vivo, con los cronómetros; otro día, sin ellos: el pasado no se cronometra. */
export type ModoDeLaSesion = 'en-vivo' | 'otro-dia';

export interface Foco {
  readonly prescriptionId: string;
  readonly setIndex: number;
}

export type ProblemaDeSincronizacion =
  /** Sin red, un 5xx, un 429: se reintenta y no se pierde nada. */
  | { readonly tipo: 'error'; readonly sinConexion: boolean }
  /** Otro dispositivo cambió el borrador o la corrida, o el servidor no aceptó un dato: decide la persona. */
  | { readonly tipo: 'conflicto'; readonly de: 'borrador' | 'tiempos'; readonly motivo: string | null };

export type EstadoDeSincronizacion = 'sincronizado' | 'pendiente' | 'enviando' | 'error' | 'conflicto';

export interface SesionLocal {
  readonly draftId: string;
  readonly occurrenceId: string;
  /** La fecha civil de la ocurrencia. */
  readonly fecha: string;
  readonly modo: ModoDeLaSesion;
  /** El nombre de la sesión, para mostrarlo antes de leer nada. */
  readonly etiqueta: string;
  /** La sesión de API-SER-02 (o la general de «Hoy», si SER-02 no se pudo leer). */
  readonly sesion: SesionConObjetivos | null;
  /** Si los objetivos son los generales de cada prescripción y no los de cada serie. La pantalla lo avisa. */
  readonly objetivosGenerales: boolean;
  /** El último borrador leído o guardado (API-TRN-16 y 17). */
  readonly borrador: BorradorDeEjecucion | null;
  readonly corrida: Corrida;
  /** Las series registradas en el teléfono que todavía no están en el borrador de la API. */
  readonly series: readonly SerieLocal[];
  /** La fila activa: el ejercicio y la serie que se están registrando. */
  readonly foco: Foco | null;
  readonly problema: ProblemaDeSincronizacion | null;
}

/** Lo mínimo que se le pide a un almacenamiento plano (AsyncStorage en el teléfono). */
export interface AlmacenPlano {
  leer(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
  borrar(clave: string): Promise<void>;
}

/** Lo que se lee de la clave de una cuenta. */
export type LecturaGuardada =
  | { readonly tipo: 'nada' }
  /** El texto guardado. `enClaro`: lo escribió una versión sin cifrar; la próxima escritura lo cifra (la migración). */
  | { readonly tipo: 'texto'; readonly texto: string; readonly enClaro: boolean }
  /** Hay algo guardado que no se puede leer: la clave de cifrado no está, o los bytes no descifran con ella. */
  | { readonly tipo: 'ilegible'; readonly motivo: 'sin-clave' | 'no-descifra' };

/**
 * El almacenamiento de la cuenta, como lo usa el almacén (`almacen-cifrado.ts` en el teléfono; `almacenEnClaro` en las
 * pruebas). `leer` lanza si el almacenamiento no respondió: eso no es «no hay nada».
 */
export interface AlmacenDeLaCuenta {
  leer(clave: string): Promise<LecturaGuardada>;
  guardar(clave: string, texto: string): Promise<void>;
  /** Copia lo guardado en `clave`, tal cual (sin descifrarlo), a `destino`, y verifica la copia. Lanza si no pudo. */
  apartar(clave: string, destino: string): Promise<void>;
}

/** Un almacenamiento plano usado sin cifrar, en las pruebas: no hay nada que migrar, así que nada es «en claro». */
export function almacenEnClaro(plano: AlmacenPlano): AlmacenDeLaCuenta {
  return {
    async leer(clave) {
      const texto = await plano.leer(clave);
      return texto === null ? { tipo: 'nada' } : { tipo: 'texto', texto, enClaro: false };
    },
    guardar: (clave, texto) => plano.guardar(clave, texto),
    apartar: (clave, destino) => apartarTalCual(plano, clave, destino),
  };
}

/** Copia el valor crudo de una clave a otra y verifica que la copia sea idéntica. */
export async function apartarTalCual(plano: AlmacenPlano, clave: string, destino: string): Promise<void> {
  const crudo = await plano.leer(clave);
  if (crudo === null) return;
  await plano.guardar(destino, crudo);
  if ((await plano.leer(destino)) !== crudo) throw new Error('La copia de recuperación no quedó igual.');
}

export type ApiDelEntrenamiento = Pick<ClienteBe, 'consultarBorradorDeEjecucion' | 'guardarBorradorDeEjecucion' | 'registrarEventosDeTiempo' | 'tiemposDelBorrador'>;

export interface DependenciasDelAlmacen {
  /** El de la cuenta; uno plano se usa sin cifrar (`almacenEnClaro`). */
  readonly almacen: AlmacenDeLaCuenta | AlmacenPlano;
  readonly api: ApiDelEntrenamiento;
  readonly reloj: RelojDeSesion;
  readonly nuevoId: (prefijo: string) => string;
  /** Espera entre los reintentos de una lectura que falló. Las pruebas pasan una que no espera. */
  readonly esperar?: (ms: number) => Promise<void>;
}

/**
 * Dónde está lo de la cuenta, además de la memoria de la app:
 * - `leyendo`: todavía se está leyendo lo guardado;
 * - `guardando`: hay un cambio que todavía no se confirmó en el teléfono;
 * - `en-el-telefono`: todo lo que se ve está guardado en el teléfono;
 * - `fallo-al-guardar`: la última escritura falló. Lo escrito sigue en la app, pero un cierre lo perdería;
 * - `sin-leer`: no se pudo leer lo guardado, y no se escribe encima. Lo nuevo queda solo en la app.
 */
export type EstadoDelGuardado = 'leyendo' | 'guardando' | 'en-el-telefono' | 'fallo-al-guardar' | 'sin-leer';

export type { ProteccionDeSerie };

/** Cuántas veces se intenta leer lo guardado antes de darlo por no leído, y cuánto se espera entre intentos. */
export const INTENTOS_DE_LECTURA = 3;
export const ESPERA_ENTRE_LECTURAS_MS = 400;

// ─── Lo guardado ────────────────────────────────────────────────────────────────────────────────

const VERSION = 1;
export const PREFIJO_DE_LA_CLAVE = 'be-entrenamiento-en-curso:';
/** La clave de una cuenta: la identidad de la sesión. */
export const claveDeLaCuenta = (identidadId: string): string => `${PREFIJO_DE_LA_CLAVE}${identidadId}`;
export const PREFIJO_DE_RECUPERACION = 'be-entrenamiento-recuperacion:';
/** Adonde se aparta, tal cual, lo guardado que no se pudo leer, antes de escribir encima. Nunca se borra solo. */
export const claveDeRecuperacion = (identidadId: string, marca: string): string => `${PREFIJO_DE_RECUPERACION}${identidadId}:${marca}`;

export interface DatosDeLaCuenta {
  readonly explicacionVista: boolean;
  readonly sesiones: readonly SesionLocal[];
}

export function serializarCuenta(cuenta: string, datos: DatosDeLaCuenta): string {
  return JSON.stringify({ v: VERSION, cuenta, explicacionVista: datos.explicacionVista, sesiones: datos.sesiones });
}

const texto = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

function eventosValidos(v: unknown): EventoDeTiempo[] | null {
  if (!Array.isArray(v)) return null;
  const leidos: EventoDeTiempo[] = [];
  for (const e of v) {
    const r = EventoDeTiempoSchema.safeParse(e);
    if (!r.success) return null;
    leidos.push(r.data);
  }
  return leidos;
}

function leerProblema(v: unknown): ProblemaDeSincronizacion | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Record<string, unknown>;
  if (p.tipo === 'error') return { tipo: 'error', sinConexion: p.sinConexion === true };
  if (p.tipo === 'conflicto' && (p.de === 'borrador' || p.de === 'tiempos')) return { tipo: 'conflicto', de: p.de, motivo: typeof p.motivo === 'string' ? p.motivo : null };
  return null;
}

/** Una sesión guardada, o `null` si no tiene la forma esperada: lo que no se puede leer no se usa. */
function leerSesion(v: unknown): SesionLocal | null {
  if (!v || typeof v !== 'object') return null;
  const x = v as Record<string, unknown>;
  if (!texto(x.draftId) || !texto(x.occurrenceId) || !texto(x.fecha) || (x.modo !== 'en-vivo' && x.modo !== 'otro-dia') || typeof x.etiqueta !== 'string') return null;
  const sesion = x.sesion === null || x.sesion === undefined ? null : SesionConObjetivosSchema.safeParse(x.sesion);
  if (sesion && !sesion.success) return null;
  const borrador = x.borrador === null || x.borrador === undefined ? null : BorradorDeEjecucionSchema.safeParse(x.borrador);
  if (borrador && !borrador.success) return null;
  const corrida = (x.corrida ?? {}) as Record<string, unknown>;
  const registrados = eventosValidos(corrida.registrados);
  const pendientes = eventosValidos(corrida.pendientes);
  if (!registrados || !pendientes || !Array.isArray(x.series)) return null;
  const series: SerieLocal[] = [];
  for (const s of x.series as unknown[]) {
    const l = (s ?? {}) as Record<string, unknown>;
    const serie = SerieEjecutadaSchema.safeParse(l.serie);
    if (!texto(l.prescriptionId) || !texto(l.performedExerciseVersionId) || !serie.success) return null;
    series.push({ prescriptionId: l.prescriptionId, performedExerciseVersionId: l.performedExerciseVersionId, serie: serie.data, enConflicto: l.enConflicto === true });
  }
  const f = (x.foco ?? null) as Record<string, unknown> | null;
  const foco = f && texto(f.prescriptionId) && Number.isInteger(f.setIndex) ? { prescriptionId: f.prescriptionId, setIndex: f.setIndex as number } : null;
  return {
    draftId: x.draftId,
    occurrenceId: x.occurrenceId,
    fecha: x.fecha,
    modo: x.modo,
    etiqueta: x.etiqueta,
    sesion: sesion?.data ?? null,
    objetivosGenerales: x.objetivosGenerales === true,
    borrador: borrador?.data ?? null,
    corrida: { registrados, pendientes },
    series,
    foco,
    problema: leerProblema(x.problema),
  };
}

/**
 * Lo guardado de una cuenta, o `null` si no se puede leer: otra forma, otra versión u otra cuenta adentro. Lo de otra
 * cuenta no se lee aunque esté en esta clave: la identidad va adentro y tiene que coincidir. Una sesión que no se puede
 * leer no se usa a medias, y `completa` lo dice: el almacén aparta lo guardado antes de escribir encima.
 */
export function interpretarCuenta(guardado: string, cuenta: string): { readonly datos: DatosDeLaCuenta; readonly completa: boolean } | null {
  try {
    const o = JSON.parse(guardado) as Record<string, unknown>;
    if (o?.v !== VERSION || o.cuenta !== cuenta || !Array.isArray(o.sesiones)) return null;
    const leidas = (o.sesiones as unknown[]).map(leerSesion);
    const sesiones = leidas.filter((s): s is SesionLocal => s !== null);
    return { datos: { explicacionVista: o.explicacionVista === true, sesiones }, completa: sesiones.length === leidas.length };
  } catch {
    return null;
  }
}

/** Lo guardado de una cuenta que se puede usar, o `null` (ver `interpretarCuenta`). */
export function leerCuenta(guardado: string | null, cuenta: string): DatosDeLaCuenta | null {
  return guardado === null ? null : (interpretarCuenta(guardado, cuenta)?.datos ?? null);
}

/** El estado que se le muestra a la persona. Un conflicto se muestra antes que cualquier otra cosa. */
export function estadoDeSincronizacion(s: SesionLocal, enviando: boolean): EstadoDeSincronizacion {
  if (s.problema?.tipo === 'conflicto' || s.series.some((l) => l.enConflicto)) return 'conflicto';
  if (s.series.length === 0 && s.corrida.pendientes.length === 0) return 'sincronizado';
  if (enviando) return 'enviando';
  return s.problema?.tipo === 'error' ? 'error' : 'pendiente';
}

const porSecuencia = (a: EventoDeTiempo, b: EventoDeTiempo) => a.sequence - b.sequence;
const mismaFila = (a: SerieLocal, b: SerieLocal) => a.prescriptionId === b.prescriptionId && a.serie.setIndex === b.serie.setIndex;
/** Una serie del teléfono con sus datos: si cambia lo registrado, ya no es la que se guardó. */
const huellaDeSerie = (l: SerieLocal): string => JSON.stringify([l.prescriptionId, l.performedExerciseVersionId, l.serie]);
/** Las series del teléfono de cada sesión, como quedaron en una escritura. */
const huellasDe = (sesiones: readonly SesionLocal[]): ReadonlyMap<string, ReadonlySet<string>> => new Map(sesiones.map((s) => [s.draftId, new Set(s.series.map(huellaDeSerie))] as const));
const esperarDeVerdad = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

type Falla = Extract<Resultado<unknown>, { readonly ok: false }>;

/** Lo que significa una falla al enviar: la red y el servicio se reintentan; un 409 o un 422 es un conflicto. */
function problemaDe(r: Falla, de: 'borrador' | 'tiempos'): ProblemaDeSincronizacion {
  if (r.tipo === 'RED') return { tipo: 'error', sinConexion: true };
  if (r.status === 409 || r.status === 422) return { tipo: 'conflicto', de, motivo: r.codigo };
  return { tipo: 'error', sinConexion: false };
}

// ─── El almacén ─────────────────────────────────────────────────────────────────────────────────

export function crearAlmacenDeEntrenamiento(deps: DependenciasDelAlmacen) {
  const almacen: AlmacenDeLaCuenta = 'apartar' in deps.almacen ? deps.almacen : almacenEnClaro(deps.almacen);
  const esperar = deps.esperar ?? esperarDeVerdad;
  let cuenta: string | null = null;
  let token: string | null = null;
  let lista = false;
  let generacion = 0;
  let explicacionVista = false;
  let sesiones = new Map<string, SesionLocal>();
  /** Los envíos en curso, por sesión: uno a la vez. */
  const enVuelo = new Map<string, Promise<Resultado<unknown> | null>>();
  const otraVuelta = new Set<string>();
  const oyentes = new Set<() => void>();
  let version = 0;
  let escritura: Promise<unknown> = Promise.resolve();
  /** Se cumple cuando terminó de leerse lo guardado de la cuenta abierta. */
  let lectura: Promise<void> = Promise.resolve();
  /**
   * Quienes esperan a que se abra una cuenta: una pantalla puede montarse antes que el efecto de la raíz que la abre (los
   * efectos de los hijos corren primero), por ejemplo si Android recreó la actividad en la sesión enfocada.
   */
  let esperandoCuenta: (() => void)[] = [];

  // ─── El guardado en el teléfono ───
  /** Cuántos cambios hubo desde que se abrió la cuenta, y hasta cuál confirmó una escritura. */
  let cambios = 0;
  let confirmado = 0;
  /** La última escritura falló y no hubo una posterior que la cubriera. */
  let falloAlGuardar = false;
  /** No se pudo leer lo guardado ni apartarlo: no se escribe encima. Lo nuevo queda solo en la app. */
  let sinLeer = false;
  /** Las series del teléfono, por sesión, que están en la última escritura confirmada. */
  let enElTelefono: ReadonlyMap<string, ReadonlySet<string>> = new Map();
  /** Los eventos que creó este proceso. Una medición abierta por otro (la app se cerró) se pregunta al volver. */
  const eventosDelProceso = new Set<string>();
  /** Lo leído hay que reescribirlo en cuanto la cuenta quede lista (lo sumado, lo apartado, una versión sin cifrar). */
  let hayQueReescribir = false;

  const avisar = () => {
    version++;
    for (const oyente of [...oyentes]) oyente();
  };

  /**
   * Escribe todo lo de la cuenta, en orden: la última escritura es la del último cambio. Nunca antes de haber leído, y
   * nunca encima de lo que no se pudo leer. El resultado de cada escritura queda en el estado: una que falla no se
   * esconde, y la siguiente que termina bien la cubre.
   */
  function persistir(): void {
    if (!cuenta || !lista) return;
    cambios++;
    if (sinLeer) return;
    const clave = claveDeLaCuenta(cuenta);
    const gen = generacion;
    const esteCambio = cambios;
    const instantanea = [...sesiones.values()];
    const guardado = serializarCuenta(cuenta, { explicacionVista, sesiones: instantanea });
    escritura = escritura
      .then(() => almacen.guardar(clave, guardado))
      .then(
        () => {
          if (gen !== generacion) return;
          if (esteCambio > confirmado) {
            confirmado = esteCambio;
            enElTelefono = huellasDe(instantanea);
          }
          if (confirmado === cambios) falloAlGuardar = false;
          avisar();
        },
        () => {
          if (gen !== generacion) return;
          if (esteCambio > confirmado) falloAlGuardar = true;
          avisar();
        },
      );
  }

  function estadoDelGuardado(): EstadoDelGuardado {
    if (!cuenta || !lista) return 'leyendo';
    if (sinLeer) return 'sin-leer';
    if (confirmado < cambios) return falloAlGuardar ? 'fallo-al-guardar' : 'guardando';
    return 'en-el-telefono';
  }

  /** Lee lo guardado, con reintentos: un almacenamiento que no responde tres veces es una lectura fallida. */
  async function leerConReintentos(clave: string): Promise<LecturaGuardada | null> {
    for (let intento = 1; ; intento++) {
      try {
        return await almacen.leer(clave);
      } catch {
        if (intento >= INTENTOS_DE_LECTURA) return null;
        await esperar(ESPERA_ENTRE_LECTURAS_MS);
      }
    }
  }

  /**
   * Lee y aplica lo guardado de la cuenta. Lo que no se puede leer se aparta antes de permitir una escritura; si no se
   * puede leer ni apartar, la cuenta queda `sin-leer`. Con sesiones ya en la app (las de un `sin-leer` anterior), lo
   * guardado se suma: lo que está en la app gana, porque es lo último que hizo la persona, y lo guardado queda apartado.
   */
  async function cargar(identidadId: string, gen: number): Promise<void> {
    const clave = claveDeLaCuenta(identidadId);
    const leido = await leerConReintentos(clave);
    if (gen !== generacion) return;
    if (leido === null) {
      sinLeer = true;
      return;
    }
    const interpretado = leido.tipo === 'texto' ? interpretarCuenta(leido.texto, identidadId) : null;
    const enLaApp = sesiones.size > 0;
    const hayQueApartar = leido.tipo === 'ilegible' || (leido.tipo === 'texto' && (interpretado === null || !interpretado.completa || enLaApp));
    if (hayQueApartar) {
      try {
        await almacen.apartar(clave, claveDeRecuperacion(identidadId, deps.nuevoId('recuperacion')));
      } catch {
        if (gen !== generacion) return;
        sinLeer = true;
        return;
      }
      if (gen !== generacion) return;
    }
    const datos = interpretado?.datos ?? { explicacionVista: false, sesiones: [] };
    const guardadas = new Map(datos.sesiones.map((s) => [s.draftId, s] as const));
    for (const [draftId, s] of sesiones) guardadas.set(draftId, s);
    sesiones = guardadas;
    explicacionVista = explicacionVista || datos.explicacionVista;
    sinLeer = false;
    // Lo leído ya está en el teléfono. Si hay que reescribirlo (lo que se sumó, lo apartado o una versión sin cifrar),
    // se escribe en cuanto la cuenta queda lista.
    enElTelefono = huellasDe(datos.sesiones);
    hayQueReescribir = enLaApp || hayQueApartar || (leido.tipo === 'texto' && leido.enClaro);
  }

  function cambiar(draftId: string, cambio: (s: SesionLocal) => SesionLocal): SesionLocal | null {
    const s = sesiones.get(draftId);
    if (!s) return null;
    const nueva = cambio(s);
    sesiones.set(draftId, nueva);
    persistir();
    avisar();
    return nueva;
  }

  function contextoDe(s: SesionLocal, iniciando: boolean): ContextoDeEventos {
    return {
      prescripciones: new Set(s.sesion?.prescriptions.map((p) => p.prescriptionId) ?? []),
      // Una sola sesión en curso por titular: la que ya corre en este teléfono cuenta.
      otraSesionEnCurso: iniciando && [...sesiones.values()].some((o) => o.draftId !== s.draftId && corridaAbierta(o.corrida)),
    };
  }

  /** Lo de la cuenta en memoria, en blanco: al abrir otra cuenta o al cerrar la sesión. */
  function enBlanco(): void {
    lista = false;
    explicacionVista = false;
    sesiones = new Map();
    enVuelo.clear();
    otraVuelta.clear();
    cambios = 0;
    confirmado = 0;
    falloAlGuardar = false;
    sinLeer = false;
    hayQueReescribir = false;
    enElTelefono = new Map();
  }

  function abrirCuenta(identidadId: string, nuevoToken: string): Promise<void> {
    if (cuenta === identidadId) {
      token = nuevoToken;
      return lectura;
    }
    const gen = ++generacion;
    cuenta = identidadId;
    token = nuevoToken;
    enBlanco();
    avisar();
    // Hasta leer lo guardado no se crea ni se escribe nada (`preparar` y `persistir` lo esperan): así una sesión nueva no
    // pisa la que estaba guardada. El reloj del teléfono también tiene que estar listo antes del primer evento.
    lectura = (async () => {
      await Promise.all([cargar(identidadId, gen), deps.reloj.listo?.().catch(() => undefined)]);
      if (gen !== generacion) return;
      lista = true;
      if (hayQueReescribir) persistir();
      hayQueReescribir = false;
      avisar();
      const esperando = esperandoCuenta;
      esperandoCuenta = [];
      for (const listo of esperando) listo();
    })();
    return lectura;
  }

  /**
   * «Reintentar» cuando no se pudo leer lo guardado: si ahora se lee, se suma a lo que está en la app (lo guardado queda
   * apartado antes de escribir) y se vuelve a guardar todo.
   */
  async function reintentarLectura(): Promise<void> {
    if (!cuenta || !lista || !sinLeer) return;
    const gen = generacion;
    await cargar(cuenta, gen);
    if (gen !== generacion) return;
    if (hayQueReescribir) persistir();
    hayQueReescribir = false;
    avisar();
  }

  /** «Reintentar» cuando falló el guardado en el teléfono: se vuelve a escribir todo lo de la cuenta. */
  function reintentarGuardado(): Promise<unknown> {
    if (cuenta && lista && !sinLeer && confirmado < cambios) persistir();
    return escritura;
  }

  /** Al cerrar la sesión o cambiar de cuenta: se deja de mostrar y de sincronizar. Lo guardado queda en su clave. */
  function cerrarCuenta(): void {
    generacion++;
    cuenta = null;
    token = null;
    enBlanco();
    avisar();
  }

  async function enviar(draftId: string, t: string, vigente: () => boolean): Promise<Resultado<unknown> | null> {
    // 1. Las series pendientes, con API-TRN-17 y la versión que se vio.
    let s = sesiones.get(draftId);
    if (!s) return null;
    if (s.series.some((l) => !l.enConflicto)) {
      let borrador = s.borrador;
      if (!borrador) {
        const r = await deps.api.consultarBorradorDeEjecucion(t, draftId);
        if (!vigente()) return null;
        if (!r.ok) {
          cambiar(draftId, (x) => ({ ...x, problema: problemaDe(r, 'borrador') }));
          return r;
        }
        const leido = r.datos.data;
        borrador = leido;
        const conciliada = cambiar(draftId, (x) => ({ ...x, borrador: leido, series: conciliarSeries(x.series, leido) }));
        if (!conciliada) return null;
        s = conciliada;
      }
      const armado = ejerciciosParaGuardar(borrador, s.series);
      if (armado.ocupadas.length > 0) {
        cambiar(draftId, (x) => ({
          ...x,
          series: x.series.map((l) => (armado.ocupadas.some((o) => mismaFila(o, l)) ? { ...l, enConflicto: true } : l)),
          problema: { tipo: 'conflicto', de: 'borrador', motivo: 'SET_ALREADY_REGISTERED' },
        }));
      }
      if (armado.incluidas.length > 0) {
        const r = await deps.api.guardarBorradorDeEjecucion(t, draftId, {
          expectedVersion: borrador.version,
          changes: { ...(borrador.granularity === 'SET' ? {} : { granularity: 'SET' }), exercises: armado.exercises },
        });
        if (!vigente()) return null;
        if (!r.ok) {
          cambiar(draftId, (x) => ({ ...x, problema: problemaDe(r, 'borrador') }));
          return r;
        }
        const guardado = r.datos.data;
        // Salen las que viajaron, tal como viajaron; lo que se registró mientras tanto sigue pendiente.
        cambiar(draftId, (x) => ({ ...x, borrador: guardado, series: x.series.filter((l) => !armado.incluidas.some((i) => mismaFila(i, l) && mismosDatos(i.serie, l.serie))) }));
      }
    }
    // 2. Los eventos, en lotes de hasta 30 y en orden. Con un conflicto de tiempos sin resolver, no se manda nada más.
    for (;;) {
      s = sesiones.get(draftId);
      if (!s || (s.problema?.tipo === 'conflicto' && s.problema.de === 'tiempos')) return null;
      const lote = loteSiguiente(s.corrida);
      if (lote.length === 0) break;
      const r = await deps.api.registrarEventosDeTiempo(t, draftId, { events: lote });
      if (!vigente()) return null;
      if (!r.ok) {
        cambiar(draftId, (x) => ({ ...x, problema: problemaDe(r, 'tiempos') }));
        return r;
      }
      const { results, timing } = r.datos.data;
      // Sobre la corrida vigente: lo que la persona sumó mientras viajaba el pedido sigue pendiente.
      const vigenteAhora = sesiones.get(draftId);
      if (!vigenteAhora) return null;
      const aplicado = aplicarResultadosDelLote(vigenteAhora.corrida, lote, results, timing.events.map((e) => e.event));
      const rechazo = aplicado.rechazo;
      cambiar(draftId, (x) => ({ ...x, corrida: aplicado.corrida, problema: rechazo ? { tipo: 'conflicto', de: 'tiempos', motivo: rechazo.reason } : x.problema }));
      if (rechazo) return null;
      // Una respuesta que no registra nada ni rechaza nada no se repite en un bucle: queda como error para reintentar.
      if (aplicado.corrida.pendientes.length >= vigenteAhora.corrida.pendientes.length) {
        cambiar(draftId, (x) => ({ ...x, problema: { tipo: 'error', sinConexion: false } }));
        return null;
      }
    }
    // 3. Todo enviado: el error anterior ya no vale. Un conflicto de series sigue hasta que la persona decida.
    cambiar(draftId, (x) => ({ ...x, problema: x.series.some((l) => l.enConflicto) ? x.problema : null }));
    return null;
  }

  /**
   * Manda lo pendiente de una sesión: primero las series, después los eventos. Uno a la vez por sesión: un segundo pedido
   * mientras corre el primero recibe el mismo envío, y al terminar se hace otra vuelta con lo que se haya sumado.
   * Devuelve la falla de la API, si la hubo, para que la pantalla decida (sesión vencida, acceso retirado); el estado
   * queda guardado en la sesión.
   */
  function sincronizar(draftId: string): Promise<Resultado<unknown> | null> {
    if (!cuenta || !token || !lista) return Promise.resolve(null);
    const previo = enVuelo.get(draftId);
    if (previo) {
      otraVuelta.add(draftId);
      return previo;
    }
    const gen = generacion;
    const t = token;
    const envio = (async () => {
      try {
        return await enviar(draftId, t, () => gen === generacion);
      } finally {
        if (gen === generacion) {
          enVuelo.delete(draftId);
          avisar();
          if (otraVuelta.delete(draftId)) void sincronizar(draftId);
        }
      }
    })();
    enVuelo.set(draftId, envio);
    avisar();
    return envio;
  }

  /**
   * Espera los envíos en curso y manda todo lo pendiente, hasta que no quede ningún envío en vuelo. Lo usa la pantalla
   * antes de escribir en el borrador por su cuenta (la condición, la confirmación): así no compite con un envío.
   */
  async function sincronizarYEsperar(draftId: string): Promise<Resultado<unknown> | null> {
    for (let vuelta = 0; vuelta < 10; vuelta++) {
      const enCurso = enVuelo.get(draftId);
      if (!enCurso) break;
      await enCurso;
    }
    const r = await sincronizar(draftId);
    for (let vuelta = 0; vuelta < 10; vuelta++) {
      const enCurso = enVuelo.get(draftId);
      if (!enCurso) break;
      await enCurso;
    }
    return r;
  }

  return {
    abrirCuenta,
    cerrarCuenta,
    sincronizar,
    sincronizarYEsperar,
    reintentarLectura,
    reintentarGuardado,
    /** El reloj con el que se marcan los eventos: el conteo en vivo usa el mismo, para no mezclar bases. */
    reloj: deps.reloj,
    /** Dónde está lo de la cuenta además de la memoria: lo que la pantalla dice del guardado en el teléfono. */
    estadoDelGuardado,
    /**
     * Dónde está una serie registrada que todavía no se envió. «En el teléfono» solo si está en la última escritura
     * confirmada, con los mismos datos.
     */
    proteccionDeSerie(draftId: string, serie: SerieLocal): ProteccionDeSerie {
      if (enElTelefono.get(draftId)?.has(huellaDeSerie(serie))) return 'en-el-telefono';
      return sinLeer || falloAlGuardar ? 'solo-en-la-app' : 'guardando';
    },
    /**
     * La medición abierta que no abrió este proceso: la app se cerró (o el sistema la cerró) con un descanso o una serie
     * cronometrada en curso, o la abrió otro dispositivo. `null` si no hay ninguna abierta o si se abrió acá. La app
     * pregunta y nunca la cierra sola.
     */
    medicionDeOtroProceso(draftId: string): MedicionAbierta | null {
      const s = sesiones.get(draftId);
      if (!s) return null;
      const abierta = estadoLocal(s.corrida).medicionAbierta;
      return abierta && !eventosDelProceso.has(abierta.inicio.eventId) ? abierta : null;
    },
    lista: (): boolean => lista,
    /** Se cumple cuando hay una cuenta abierta y lo guardado ya se leyó. Sin cuenta, espera a que se abra una. */
    listo: (): Promise<void> => (cuenta ? lectura : new Promise<void>((resolver) => esperandoCuenta.push(resolver))),
    cuenta: (): string | null => cuenta,
    sesion: (draftId: string): SesionLocal | null => sesiones.get(draftId) ?? null,
    sesiones: (): SesionLocal[] => [...sesiones.values()],
    enviando: (draftId: string): boolean => enVuelo.has(draftId),
    explicacionVista: (): boolean => explicacionVista,
    marcarExplicacionVista(): void {
      explicacionVista = true;
      persistir();
      avisar();
    },
    /** La sesión local de un borrador; si no había, la crea. No pisa una que ya existe. */
    preparar(datos: { draftId: string; occurrenceId: string; fecha: string; modo: ModoDeLaSesion; etiqueta: string; sesion?: SesionConObjetivos | null; objetivosGenerales?: boolean }): SesionLocal | null {
      if (!cuenta || !lista) return null;
      const previa = sesiones.get(datos.draftId);
      if (previa) return previa;
      const nueva: SesionLocal = {
        draftId: datos.draftId,
        occurrenceId: datos.occurrenceId,
        fecha: datos.fecha,
        modo: datos.modo,
        etiqueta: datos.etiqueta,
        sesion: datos.sesion ?? null,
        objetivosGenerales: datos.objetivosGenerales ?? false,
        borrador: null,
        corrida: CORRIDA_VACIA,
        series: [],
        foco: null,
        problema: null,
      };
      sesiones.set(datos.draftId, nueva);
      persistir();
      avisar();
      return nueva;
    },
    /** La sesión de API-SER-02. Los objetivos generales nunca reemplazan a los de cada serie. */
    fijarSesionDelPlan(draftId: string, sesion: SesionConObjetivos, objetivosGenerales: boolean): void {
      cambiar(draftId, (x) => (objetivosGenerales && x.sesion && !x.objetivosGenerales ? x : { ...x, sesion, objetivosGenerales }));
    },
    /** El borrador recién leído o guardado: las series del teléfono se concilian con él. */
    fijarBorrador(draftId: string, borrador: BorradorDeEjecucion): void {
      cambiar(draftId, (x) => ({ ...x, borrador, series: conciliarSeries(x.series, borrador) }));
    },
    /**
     * Los eventos que la API tiene de este borrador (API-TIE-02), al abrir la sesión. Los pendientes que ya llegaron
     * salen; si los pendientes ya no pueden seguir a lo registrado (otro dispositivo siguió la corrida), es un conflicto.
     */
    fijarTiemposDelServidor(draftId: string, eventos: readonly EventoDeTiempo[]): void {
      cambiar(draftId, (x) => {
        const porId = new Map(eventos.map((e) => [e.eventId, e] as const));
        const pendientes = x.corrida.pendientes.filter((p) => {
          const delServidor = porId.get(p.eventId);
          return !(delServidor && mismoEvento(delServidor, p));
        });
        const corrida: Corrida = { registrados: [...eventos].sort(porSecuencia), pendientes };
        let problema = x.problema;
        if (pendientes.some((p) => porId.has(p.eventId))) problema = { tipo: 'conflicto', de: 'tiempos', motivo: 'EVENT_ID_REUSED' };
        else if (pendientes.length > 0 && x.sesion) {
          const { resultados } = aplicarEventos(corrida.registrados, [...pendientes].sort(porSecuencia), contextoDe(x, false));
          const mal = resultados.find((r) => r.status === 'CONFLICT' || r.status === 'REJECTED');
          if (mal) problema = { tipo: 'conflicto', de: 'tiempos', motivo: mal.reason };
        }
        return { ...x, corrida, problema };
      });
    },
    enfocar(draftId: string, foco: Foco): void {
      const s = sesiones.get(draftId);
      if (s?.foco?.prescriptionId === foco.prescriptionId && s.foco.setIndex === foco.setIndex) return;
      cambiar(draftId, (x) => ({ ...x, foco }));
    },
    /** Una acción de tiempo: arma los eventos, los valida con el dominio y los deja pendientes. */
    accion(draftId: string, accion: AccionDeTiempo): ResultadoDeAccion {
      const s = sesiones.get(draftId);
      if (!s) return { ok: false, motivo: 'SIN_SESION' };
      if (s.modo !== 'en-vivo') return { ok: false, motivo: 'SIN_CRONOMETROS' };
      const r = armarAccion(s.corrida, accion, contextoDe(s, accion.tipo === 'iniciar'), { reloj: deps.reloj, nuevoId: deps.nuevoId });
      if (r.ok) {
        const nuevos = r.eventos;
        for (const e of nuevos) eventosDelProceso.add(e.eventId);
        cambiar(draftId, (x) => ({ ...x, corrida: { registrados: x.corrida.registrados, pendientes: [...x.corrida.pendientes, ...nuevos] } }));
      }
      return r;
    },
    /**
     * Registra una serie en el teléfono. Si esa fila ya tiene una serie (pendiente o en el servidor), no hace nada: un
     * doble toque es una sola operación.
     */
    registrarSerie(draftId: string, serie: Omit<SerieLocal, 'enConflicto'>): 'registrada' | 'repetida' | 'sin-sesion' {
      const s = sesiones.get(draftId);
      if (!s) return 'sin-sesion';
      const local: SerieLocal = { ...serie, enConflicto: false };
      const delServidor = s.borrador?.exercises.find((e) => e.prescriptionId === serie.prescriptionId)?.sets ?? [];
      if (s.series.some((l) => mismaFila(l, local)) || delServidor.some((x) => x.setIndex === serie.serie.setIndex)) return 'repetida';
      cambiar(draftId, (x) => ({ ...x, series: [...x.series, local] }));
      return 'registrada';
    },
    /** Descarta una serie del teléfono que quedó en conflicto con la del servidor. */
    descartarSerie(draftId: string, prescriptionId: string, setIndex: number): void {
      cambiar(draftId, (x) => {
        const series = x.series.filter((l) => !(l.prescriptionId === prescriptionId && l.serie.setIndex === setIndex));
        const sigue = series.some((l) => l.enConflicto) || (x.problema?.tipo === 'conflicto' && x.problema.de === 'tiempos');
        return { ...x, series, problema: sigue ? x.problema : null };
      });
    },
    /** «No pude realizarla», confirmado por la persona: las series del teléfono se descartan junto con las del borrador. */
    descartarSeries(draftId: string): void {
      cambiar(draftId, (x) => ({ ...x, series: [], problema: x.problema?.tipo === 'conflicto' && x.problema.de === 'borrador' ? null : x.problema }));
    },
    /** «Reintentar»: se olvida el error (o el conflicto de tiempos, si la persona lo resolvió) y se vuelve a mandar. */
    reintentar(draftId: string): Promise<Resultado<unknown> | null> {
      cambiar(draftId, (x) => ({ ...x, problema: x.series.some((l) => l.enConflicto) ? x.problema : null }));
      return sincronizar(draftId);
    },
    /** Ante un conflicto del borrador: se lee el vigente (API-TRN-16) y se concilian las series del teléfono con él. */
    async actualizarBorrador(draftId: string): Promise<Resultado<unknown> | null> {
      if (!token || !sesiones.has(draftId)) return null;
      const gen = generacion;
      const r = await deps.api.consultarBorradorDeEjecucion(token, draftId);
      if (gen !== generacion) return null;
      if (!r.ok) return r;
      const leido = r.datos.data;
      cambiar(draftId, (x) => {
        const series = conciliarSeries(x.series, leido);
        const sigueTiempos = x.problema?.tipo === 'conflicto' && x.problema.de === 'tiempos';
        return { ...x, borrador: leido, series, problema: series.some((l) => l.enConflicto) ? { tipo: 'conflicto', de: 'borrador', motivo: 'SET_ALREADY_REGISTERED' } : sigueTiempos ? x.problema : null };
      });
      return sincronizar(draftId);
    },
    /**
     * Ante un conflicto de tiempos, si la persona lo elige: se descartan los eventos pendientes del teléfono y se toma lo
     * que la API tiene (API-TIE-02). Lo registrado no se toca.
     */
    async usarLosTiemposDelServidor(draftId: string): Promise<Resultado<unknown> | null> {
      if (!token || !sesiones.has(draftId)) return null;
      const gen = generacion;
      const r = await deps.api.tiemposDelBorrador(token, draftId);
      if (gen !== generacion) return null;
      if (!r.ok) return r;
      const eventos = r.datos.data.events.map((e) => e.event).sort(porSecuencia);
      cambiar(draftId, (x) => ({ ...x, corrida: { registrados: eventos, pendientes: [] }, problema: x.series.some((l) => l.enConflicto) ? x.problema : null }));
      return null;
    },
    /** Después de confirmar la ejecución, o si la persona descarta el registro del teléfono. */
    descartar(draftId: string): void {
      if (!sesiones.delete(draftId)) return;
      persistir();
      avisar();
    },
    suscribir(oyente: () => void): () => void {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    /** Cambia con cada cambio: para `useSyncExternalStore`. */
    instantanea: (): number => version,
    /** Para las pruebas: espera a que terminen las escrituras encoladas. */
    escrituras: (): Promise<unknown> => escritura,
  };
}

export type AlmacenDeEntrenamiento = ReturnType<typeof crearAlmacenDeEntrenamiento>;
