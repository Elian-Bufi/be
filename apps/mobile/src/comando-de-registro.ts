/**
 * El comando único de las escrituras del registro de comidas (WP-NUTRICION-RECETAS §7; DL-121): registrar una opción
 * desde el carrusel o desde el detalle (API-ING-02), completar sus cantidades (API-ING-05) y guardar una comida
 * diferente. Es lógica pura, sin React ni red: quien lo usa le pasa cómo llamar a la API, y
 * `scripts/registro-de-comidas.test.mjs` lo prueba con respuestas controladas.
 *
 * Idempotencia por intento (09:253-262; el mismo criterio de `intento.ts`), con un intento por comida y día:
 * - **Doble toque.** Mientras hay un pedido en vuelo para ese intento, otro toque recibe el mismo pedido: no sale un
 *   segundo.
 * - **Reintento.** Si la respuesta fue incierta (sin red, o una que no se reconoce), el próximo pedido equivalente reusa
 *   la misma clave **y el mismo cuerpo**, con su `occurredAt`: la API compara la huella del pedido y devuelve lo que
 *   guardó, sin registrar dos veces. Vale también si el reintento llega desde la otra pantalla (del carrusel al detalle):
 *   el comando vive fuera de React.
 * - **Otro pedido.** Si lo que se manda es distinto (otra opción, otras cantidades), es otro intento, con clave nueva. Si
 *   la comida ya quedó registrada, la API lo dice (409) y la pantalla también.
 * - **Una respuesta definitiva**, buena o mala, cierra el intento: el próximo es otro.
 */
import type { Resultado } from '@be/domain';

export interface DependenciasDelComando<C> {
  readonly nuevaClave: () => string;
  readonly esIncierto: (r: Resultado<unknown>) => boolean;
  /** Lo que identifica el pedido sin lo que cambia en cada toque (la hora): dos pedidos con la misma huella son el mismo intento. */
  readonly huella: (cuerpo: C) => string;
}

interface Intento<C, R> {
  readonly clave: string;
  readonly huella: string;
  /** El cuerpo tal como salió la primera vez: el reintento lo repite igual. */
  readonly cuerpo: C;
  readonly enVuelo: Promise<Resultado<R>> | null;
}

export interface ComandoDeRegistro<C, R> {
  /**
   * Manda el pedido del intento (`intento` nombra la comida y el día). `llamar` hace el pedido con el cuerpo y la clave
   * que decide el comando.
   */
  enviar(intento: string, cuerpo: C, llamar: (cuerpo: C, clave: string) => Promise<Resultado<R>>): Promise<Resultado<R>>;
  /** Si el intento quedó incierto y espera un reintento. */
  pendiente(intento: string): boolean;
  /** Si hay un pedido en vuelo para el intento. */
  enVuelo(intento: string): boolean;
  /** Quien usa la pantalla abandona el intento (por ejemplo, porque cambió de opción). No corta un pedido en vuelo. */
  descartar(intento: string): void;
}

export function crearComandoDeRegistro<C, R>(dependencias: DependenciasDelComando<C>): ComandoDeRegistro<C, R> {
  const intentos = new Map<string, Intento<C, R>>();
  return {
    enviar(intento, cuerpo, llamar) {
      const previo = intentos.get(intento);
      if (previo?.enVuelo) return previo.enVuelo;
      const huella = dependencias.huella(cuerpo);
      const mismo = previo !== undefined && previo.huella === huella;
      const clave = mismo ? previo.clave : dependencias.nuevaClave();
      const enviado = mismo ? previo.cuerpo : cuerpo;
      const quedaPendiente = () => intentos.set(intento, { clave, huella, cuerpo: enviado, enVuelo: null });
      const enVuelo = llamar(enviado, clave).then(
        (r) => {
          if (dependencias.esIncierto(r)) quedaPendiente();
          else intentos.delete(intento);
          return r;
        },
        (error: unknown) => {
          // Una falla del propio teléfono: no se sabe si el pedido salió, así que se trata como incierta.
          quedaPendiente();
          throw error;
        },
      );
      intentos.set(intento, { clave, huella, cuerpo: enviado, enVuelo });
      return enVuelo;
    },
    pendiente: (intento) => {
      const i = intentos.get(intento);
      return i !== undefined && i.enVuelo === null;
    },
    enVuelo: (intento) => intentos.get(intento)?.enVuelo != null,
    descartar(intento) {
      if (!intentos.get(intento)?.enVuelo) intentos.delete(intento);
    },
  };
}

/** Un objeto con sus claves ordenadas, en todos los niveles: la misma huella sin importar el orden en que se armó. */
function ordenado(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenado);
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((k) => [k, ordenado((valor as Record<string, unknown>)[k])]),
    );
  }
  return valor;
}

/** La huella de un pedido de registro: todo menos la hora en que se tocó (`occurredAt`). */
export function huellaDelPedido(cuerpo: unknown): string {
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return JSON.stringify(ordenado(cuerpo));
  const { occurredAt: _hora, ...resto } = cuerpo as Record<string, unknown>;
  return JSON.stringify(ordenado(resto));
}

/** El intento del registro de una comida en un día, para una sesión. */
export const intentoDeLaComida = (token: string, fecha: string, comidaId: string): string => `${token}|${fecha}|${comidaId}`;
