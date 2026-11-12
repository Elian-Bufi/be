import { actuaComoProfesional, type EstadoDelSegundoFactorDelProfesional } from '@be/domain';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-D12; 08 §25): la sesión de cada pedido, para que lo profesional exija el segundo
 * factor sin que cada servicio lo tenga que recibir.
 *
 * - **Cada pedido HTTP abre su contexto** (`abrirElContextoDelPedido`, el primer middleware). `SesionGuard` anota ahí la
 *   sesión que autenticó, con el estado del segundo factor del profesional, leído de la base en ese mismo pedido.
 * - **`puedeActuarComoProfesional(identidad)`** es la única pregunta: la hacen el PDP (`aHechos`), el criterio de las
 *   áreas (`puedeOperarArea`) y las listas donde la identidad es el profesional. Si la sesión del pedido es de esa
 *   identidad, la respuesta es la de su segundo factor; si el pedido no tiene sesión (una tarea interna, una ruta
 *   firmada que emitió otra operación con sesión) o la pregunta es sobre otra identidad (la persona que mira el modo de
 *   acceso de su profesional), no hay condición: no es una acción de esa sesión.
 * - Como `PdpService.capturarDecisiones`, se apoya en AsyncLocalStorage, que acompaña al pedido por las transacciones de
 *   Prisma y los reintentos. Lo prueba la integración en cada operación profesional que recorre
 *   (test/integration/segundo-factor-del-profesional.int-spec.ts).
 */
export interface SesionDelPedido {
  readonly identidadId: string;
  readonly sesionId: string;
  readonly segundoFactor: EstadoDelSegundoFactorDelProfesional;
}

interface ContextoDelPedido {
  sesion: SesionDelPedido | null;
}

const contexto = new AsyncLocalStorage<ContextoDelPedido>();

/** El middleware que abre el contexto de cada pedido. Va primero: todo lo demás corre adentro. */
export function abrirElContextoDelPedido(_req: unknown, _res: unknown, siguiente: () => void): void {
  contexto.run({ sesion: null }, siguiente);
}

/** Lo anota `SesionGuard` al autenticar. Fuera de un pedido (una prueba unitaria) no hace nada. */
export function anotarLaSesionDelPedido(sesion: SesionDelPedido): void {
  const actual = contexto.getStore();
  if (actual) actual.sesion = sesion;
}

/** La sesión del pedido en curso, si la hay. */
export function sesionDelPedido(): SesionDelPedido | null {
  return contexto.getStore()?.sesion ?? null;
}

/**
 * Si esta identidad puede actuar como profesional en el pedido en curso: con su sesión, solo con el segundo factor
 * verificado (o sin perfil profesional, que no tiene nada que pedir); sin una sesión suya en el pedido, no hay condición.
 */
export function puedeActuarComoProfesional(identidadId: string): boolean {
  const sesion = sesionDelPedido();
  if (!sesion || sesion.identidadId.toLowerCase() !== identidadId.toLowerCase()) return true;
  return actuaComoProfesional(sesion.segundoFactor);
}
