/**
 * La sesión vive solo en memoria (DL-012), pero fuera del árbol de React (2026-10-03).
 *
 * Android vuelve a crear la pantalla de la app cuando cambia el tamaño de letra o de visualización, el idioma o la
 * negrita del sistema. React monta todo de nuevo y el estado de los componentes se pierde, aunque el proceso y el motor
 * de JavaScript sigan vivos. Mientras la sesión estuvo en el estado de la raíz, cambiar el tamaño de letra devolvía a la
 * bienvenida. Guardada acá sobrevive, junto con la pantalla en la que se estaba, para volver a la misma.
 *
 * Nada va a disco. Si el sistema cierra el proceso, o la persona cierra la app desde Recientes, la sesión se pierde
 * como antes (DL-012, opción A provisoria). Tampoco cambia cuánto dura: vence cuando dice la API (`expiresAt`).
 */
import type { Ruta } from './navegacion';

export interface Sesion {
  readonly token: string;
  readonly expiraEn: number;
  readonly identidadId: string;
}

let recordada: { readonly sesion: Sesion; readonly ruta: Ruta } | null = null;

export type SesionAlMontar = { readonly estado: 'vigente'; readonly sesion: Sesion; readonly ruta: Ruta } | { readonly estado: 'vencida' } | { readonly estado: 'ninguna' };

/** Lo que encuentra la raíz al montarse: la sesión que seguía viva en el proceso, una que venció mientras tanto, o nada. */
export function sesionAlMontar(ahora: number = Date.now()): SesionAlMontar {
  if (!recordada) return { estado: 'ninguna' };
  if (recordada.sesion.expiraEn <= ahora) return { estado: 'vencida' };
  return { estado: 'vigente', sesion: recordada.sesion, ruta: recordada.ruta };
}

export function recordarSesion(sesion: Sesion, ruta: Ruta): void {
  recordada = { sesion, ruta };
}

export function olvidarSesion(): void {
  recordada = null;
}
