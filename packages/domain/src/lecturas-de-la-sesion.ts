/**
 * Lo que la APK recuerda mientras dura una sesión (navegación, 2026-10-03; revisado en la etapa A de la tanda siguiente).
 * No sirve para mostrar antes de que la API confirme: sirve para reusar lo ya calculado cuando la respuesta dice lo mismo
 * (`apps/mobile/src/ciclo-de-lectura.ts`). Es lógica pura, sin React ni almacenamiento: la APK la usa en `apps/mobile/src/lecturas.ts`
 * y las pruebas (`lecturas-de-la-sesion.test.ts`) ejercitan esta misma lógica. Reglas:
 * - **Solo en memoria.** Nada va a disco (DL-012; son datos de salud).
 * - **Es de una sesión.** Todo se guarda con el token que lo leyó. Antes de leer con otro token se olvida lo anterior:
 *   una sesión nunca ve lo de otra. Al cerrar, vencer o perder la sesión se olvida todo.
 * - **No reemplaza a la API.** Nada recordado se muestra sin que la API lo confirme en esa entrada, y la respuesta nueva
 *   manda: si la API niega el acceso, lo recordado se borra.
 * - **Escribir olvida las lecturas.** Una comida, una respuesta, el A3, un consentimiento o un vínculo pueden cambiar lo
 *   que se ve o lo que se puede ver. Por eso cualquier escritura, aunque falle, olvida todo lo leído.
 * - **Una respuesta tardía no repuebla.** Cada pedido sale con una marca. Si mientras tanto se olvidó algo (una
 *   escritura, un cierre de sesión), la respuesta no se guarda.
 * - **Tiene un tope:** cuando se llena, sale primero lo que se guardó hace más tiempo.
 *
 * Las selecciones (qué familia de medidas, qué día del plan) se recuerdan aparte. Escribir no las olvida; cerrar la
 * sesión, sí.
 */
import { CODIGOS_DE_SESION_NO_VALIDA, type Resultado } from './cliente-http';

/** Qué hace una pantalla con una lectura que no salió. Solo `sesion` cierra la sesión. */
export type FallaDeLectura = 'sesion' | 'pasajera' | 'acceso' | 'otra';

/**
 * - `sesion`: la sesión ya no sirve (un código de sesión: requerida, inválida, vencida o revocada). Se vuelve a Iniciar
 *   sesión.
 * - `pasajera`: no hubo respuesta, hubo demasiados pedidos (429) o la API no pudo responder (5xx, también la página de
 *   error de un proxy). La sesión sigue; lo recordado también, con un aviso.
 * - `acceso`: la API niega el acceso o no revela el recurso (403, 404). La sesión sigue y lo recordado se borra.
 * - `otra`: cualquier otro rechazo. La sesión sigue y lo recordado se borra.
 */
export function clasificarFalla(r: Exclude<Resultado<unknown>, { ok: true }>): FallaDeLectura {
  if (r.tipo === 'RED') return 'pasajera';
  if (CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) return 'sesion';
  if (r.status === 429 || r.status >= 500) return 'pasajera';
  if (r.status === 403 || r.status === 404) return 'acceso';
  return 'otra';
}

export interface MemoriaDeLecturas {
  /** Lo recordado para esta clave en esta sesión, o `undefined`. */
  leer<T>(token: string, clave: string): T | undefined;
  /** La marca con la que sale un pedido. Cambia cada vez que se olvida algo. */
  marca(token: string): number;
  /** Guarda lo leído si la sesión es la misma y no se olvidó nada desde `marca`. Devuelve si lo guardó. */
  guardar<T>(token: string, marca: number, clave: string, datos: T): boolean;
  /** Borra una lectura; por ejemplo, porque la API negó el acceso. */
  olvidar(clave: string): void;
  /** Después de cualquier escritura. */
  olvidarLecturas(): void;
  /** Al cerrar, vencer o perder la sesión. */
  olvidarLaSesion(): void;
  leerSeleccion<T>(token: string, clave: string): T | undefined;
  recordarSeleccion<T>(token: string, clave: string, valor: T): void;
}

export function crearMemoriaDeLecturas(tope = 12): MemoriaDeLecturas {
  let duenio: string | null = null;
  let marca = 0;
  const lecturas = new Map<string, unknown>();
  const selecciones = new Map<string, unknown>();

  function olvidarLecturas(): void {
    marca++;
    lecturas.clear();
  }
  function olvidarLaSesion(): void {
    olvidarLecturas();
    selecciones.clear();
    duenio = null;
  }
  /** Con otro token, primero se olvida todo lo de la sesión anterior. */
  function deLaSesion(token: string): void {
    if (duenio === token) return;
    olvidarLaSesion();
    duenio = token;
  }

  return {
    leer<T>(token: string, clave: string): T | undefined {
      deLaSesion(token);
      return lecturas.get(clave) as T | undefined;
    },
    marca(token: string): number {
      deLaSesion(token);
      return marca;
    },
    guardar<T>(token: string, conMarca: number, clave: string, datos: T): boolean {
      if (conMarca !== marca || duenio !== token) return false;
      // Se borra y se vuelve a poner para que quede al final: el orden del Map es el de antigüedad.
      lecturas.delete(clave);
      lecturas.set(clave, datos);
      while (lecturas.size > tope) lecturas.delete(lecturas.keys().next().value as string);
      return true;
    },
    olvidar(clave: string): void {
      lecturas.delete(clave);
    },
    olvidarLecturas,
    olvidarLaSesion,
    leerSeleccion<T>(token: string, clave: string): T | undefined {
      deLaSesion(token);
      return selecciones.get(clave) as T | undefined;
    },
    recordarSeleccion<T>(token: string, clave: string, valor: T): void {
      deLaSesion(token);
      selecciones.set(clave, valor);
    },
  };
}
