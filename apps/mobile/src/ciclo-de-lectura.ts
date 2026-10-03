/**
 * El ciclo de una lectura protegida en una pantalla de la APK (tanda del 2026-10-03, etapa A). Es lógica pura, sin
 * React: la usa `useLecturaRecordada` (src/lecturas.ts), y `scripts/ciclo-de-lectura.test.mjs` la prueba con
 * respuestas controladas, sin esperas.
 *
 * Qué garantiza (DL-115; 08:406):
 * - **G1.** Una sesión no ve nada de otra: la memoria tiene dueño (`lecturas-de-la-sesion.ts`, en @be/domain).
 * - **G2.** Al entrar a una pantalla no se muestra ningún dato protegido hasta que la API confirma el acceso en esa
 *   entrada. Mientras tanto la pantalla está «verificando» y dibuja su estructura, sin valores. Lo recordado sirve para
 *   no recalcular ni redibujar si la respuesta dice lo mismo, no para mostrar antes.
 * - **G3.** Con la pantalla abierta, lo confirmado en esta entrada queda a la vista mientras se vuelve a confirmar: al
 *   volver del segundo plano y después de una escritura de la misma pantalla. Si la API niega el acceso, se retira.
 * - **G4.** Una respuesta pedida antes de que se olvidara algo (una escritura, el cierre de la sesión, otra sesión), o
 *   reemplazada por un pedido más nuevo, no se guarda ni se muestra.
 * - **G5.** Un error pasajero (sin red, 429, 5xx) no cierra la sesión. Si hay algo confirmado en esta entrada, queda con
 *   un aviso. Si no, se dice que no se pudo confirmar y se ofrece reintentar: lo recordado no se muestra.
 *
 * **Lo que no se puede garantizar:** una revocación hecha en otro dispositivo se conoce recién en el próximo contacto
 * con la API: al entrar, al volver del segundo plano o al escribir. No hay un canal que la avise antes.
 */
import { clasificarFalla, type MemoriaDeLecturas, type Resultado } from '@be/domain';

export type Falla = Exclude<Resultado<unknown>, { ok: true }>;

export type EstadoDeLectura<T> =
  /** Entrando: todavía no hay nada confirmado en esta entrada. La pantalla dibuja su estructura sin valores. */
  | { readonly tipo: 'verificando' }
  /** Confirmado por la API en esta entrada. */
  | { readonly tipo: 'listo'; readonly datos: T; readonly actualizando: boolean; readonly sinActualizar: boolean }
  /** Una falla pasajera, o algo que se olvidó en cada intento, sin nada confirmado en esta entrada. */
  | { readonly tipo: 'sin-confirmar'; readonly falla: Falla | null }
  /** La API negó el acceso (403, 404) o rechazó el pedido: la pantalla muestra lo que corresponde. */
  | { readonly tipo: 'rechazado'; readonly falla: Falla };

export interface OpcionesDelCiclo<T> {
  readonly memoria: MemoriaDeLecturas;
  readonly token: string;
  readonly clave: string;
  readonly pedir: () => Promise<Resultado<T>>;
  /** Si la sesión ya no sirve, la app sale de ella y esto devuelve `true`: el ciclo no toca nada más. */
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  readonly alCambiar: (estado: EstadoDeLectura<T>) => void;
  /** Cuántas veces se pide si algo se olvidó mientras tanto. */
  readonly intentos?: number;
}

export interface CicloDeLectura<T> {
  readonly estado: () => EstadoDeLectura<T>;
  /** Al entrar, al reintentar, al volver del segundo plano o después de escribir. */
  readonly cargar: () => Promise<void>;
  /** La pantalla se fue: nada de lo que llegue después la toca. */
  readonly terminar: () => void;
}

/** Dos respuestas que dicen lo mismo. Comparar cuesta mucho menos que redibujar la figura de «Mi evolución». */
const mismoContenido = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b);

export function crearCicloDeLectura<T>(o: OpcionesDelCiclo<T>): CicloDeLectura<T> {
  let estado: EstadoDeLectura<T> = { tipo: 'verificando' };
  let ultimoPedido = 0;
  let terminado = false;
  const poner = (nuevo: EstadoDeLectura<T>) => {
    if (terminado) return;
    estado = nuevo;
    o.alCambiar(nuevo);
  };

  async function cargar(): Promise<void> {
    if (terminado) return;
    const pedido = ++ultimoPedido;
    const confirmado = estado.tipo === 'listo' ? estado.datos : null;
    poner(confirmado === null ? { tipo: 'verificando' } : { tipo: 'listo', datos: confirmado, actualizando: true, sinActualizar: false });

    for (let intento = 0; intento < (o.intentos ?? 3); intento++) {
      const marca = o.memoria.marca(o.token);
      const res = await o.pedir();
      // La pantalla se fue, o hay un pedido más nuevo: esta respuesta no toca nada.
      if (terminado || pedido !== ultimoPedido) return;
      if (o.sesionPerdida(res)) {
        terminado = true;
        return;
      }
      // Se pidió antes de que algo se olvidara: no vale ni para guardar ni para mostrar. Se pide de nuevo.
      if (marca !== o.memoria.marca(o.token)) continue;
      if (res.ok) {
        const recordado = o.memoria.leer<T>(o.token, o.clave);
        const datos = confirmado !== null && mismoContenido(confirmado, res.datos) ? confirmado : recordado !== undefined && mismoContenido(recordado, res.datos) ? recordado : res.datos;
        o.memoria.guardar(o.token, marca, o.clave, datos);
        poner({ tipo: 'listo', datos, actualizando: false, sinActualizar: false });
        return;
      }
      if (clasificarFalla(res) === 'pasajera') {
        poner(confirmado !== null ? { tipo: 'listo', datos: confirmado, actualizando: false, sinActualizar: true } : { tipo: 'sin-confirmar', falla: res });
        return;
      }
      o.memoria.olvidar(o.clave);
      poner({ tipo: 'rechazado', falla: res });
      return;
    }
    // Algo se olvidó en cada intento: no hay una respuesta que valga, y no se muestra nada sin confirmar.
    poner({ tipo: 'sin-confirmar', falla: null });
  }

  return {
    estado: () => estado,
    cargar,
    terminar: () => {
      terminado = true;
    },
  };
}
