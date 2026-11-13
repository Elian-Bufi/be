/**
 * PG-09 de WP-PULIDO-GRANDES (DL-173, con PG-D15 a ratificar): tirar la pantalla hacia abajo vuelve a leer, y debajo del
 * título, chiquito y siempre, la hora de lo que se ve: «Al día, 10:42»; si la lectura falla, «Ves lo de las 9:15». Es
 * lógica pura: la usan `lecturas.ts`, la pantalla de Novedades y App.tsx, y la prueba `hora-de-lo-que-ves.test.ts`
 * (TEST-PG-008).
 *
 * - **La hora es la de lo confirmado por el servidor** (B10-01 §36): pedir no la mueve; una respuesta que confirma la
 *   pone en el momento en que llegó; una falla la deja donde estaba y cambia el texto.
 * - **De toda la pantalla:** cada lectura tiene su marca, y la pantalla dice la más vieja de lo que muestra: si una parte
 *   es de las 9:15, no dice «Al día, 10:42». Una falla de cualquiera cambia el texto.
 * - **Sin nada a la vista, sin hora:** mientras se verifica la entrada, o si no hay nada confirmado, no se dibuja; la
 *   pantalla ya dice «Reintentar». La hora no esconde un error.
 * - No actualiza sola cada tantos minutos ni cuenta cuántos datos cambiaron.
 */
import { TEXTOS_DEL_PULIDO as T } from './textos-del-pulido';

/** La marca de una lectura: cuándo la confirmó el servidor por última vez y si el último intento falló. */
export interface MarcaDeLectura {
  readonly confirmada: number | null;
  readonly fallo: boolean;
}

export const SIN_MARCA: MarcaDeLectura = { confirmada: null, fallo: false };

/**
 * Lo que le pasó a una lectura:
 * - `pedido`: salió un pedido y lo confirmado sigue a la vista;
 * - `confirmado`: el servidor respondió (con datos, o negando el acceso: también es su respuesta);
 * - `fallo`: no hubo respuesta que valga y quedó a la vista lo de antes;
 * - `vacio`: no hay nada a la vista (entrando, o empezando de cero);
 * - `perdido`: falló sin nada a la vista.
 */
export type EventoDeLectura = 'pedido' | 'confirmado' | 'fallo' | 'vacio' | 'perdido';

export function marcaTrasEvento(previa: MarcaDeLectura, evento: EventoDeLectura, ahora: number): MarcaDeLectura {
  switch (evento) {
    case 'pedido':
      return previa;
    case 'confirmado':
      return { confirmada: ahora, fallo: false };
    case 'fallo':
      return { confirmada: previa.confirmada, fallo: true };
    case 'vacio':
      return SIN_MARCA;
    case 'perdido':
      return { confirmada: null, fallo: true };
  }
}

/** El evento de una lectura con su ciclo (`ciclo-de-lectura.ts`). */
export function eventoDelCiclo(estado: { readonly tipo: 'verificando' | 'listo' | 'sin-confirmar' | 'rechazado'; readonly actualizando?: boolean; readonly sinActualizar?: boolean }): EventoDeLectura {
  switch (estado.tipo) {
    case 'verificando':
      return 'vacio';
    case 'listo':
      return estado.actualizando ? 'pedido' : estado.sinActualizar ? 'fallo' : 'confirmado';
    case 'sin-confirmar':
      return 'perdido';
    case 'rechazado':
      return 'confirmado';
  }
}

/** El evento de una lista paginada (`lista.ts`): al recargar se vacía, así que una falla no deja nada a la vista. */
export function eventoDeLaLista(tipo: 'cargando' | 'error' | 'listo'): EventoDeLectura {
  return tipo === 'listo' ? 'confirmado' : tipo === 'error' ? 'perdido' : 'pedido';
}

/** La hora de la pantalla: la más vieja de lo confirmado a la vista, y si alguna lectura falló. */
export interface HoraDeLaPantalla {
  readonly hora: number | null;
  readonly fallo: boolean;
}

export function horaDeLaPantalla(marcas: Iterable<MarcaDeLectura>): HoraDeLaPantalla {
  let hora: number | null = null;
  let fallo = false;
  for (const m of marcas) {
    if (m.fallo) fallo = true;
    if (m.confirmada !== null && (hora === null || m.confirmada < hora)) hora = m.confirmada;
  }
  return { hora, fallo };
}

/** El texto debajo del título; `null` si no hay nada confirmado a la vista. `formatear` escribe la hora de 24 h. */
export function textoDeLaHora(h: HoraDeLaPantalla, formatear: (ms: number) => string): string | null {
  if (h.hora === null) return null;
  return h.fallo ? T.vesLoDeLas(formatear(h.hora)) : T.alDia(formatear(h.hora));
}

/** Lo que anuncia el lector al terminar de tirar: «Actualizado, 10:42», o que no se pudo y de cuándo es lo que se ve. */
export function anuncioAlActualizar(h: HoraDeLaPantalla, formatear: (ms: number) => string): string | null {
  if (h.hora === null) return null;
  return h.fallo ? T.noSePudoActualizar(formatear(h.hora)) : T.actualizado(formatear(h.hora));
}

/** Las cuatro pantallas con «tirar para actualizar» (PG-09): Inicio, Nutrición (Hoy), Entrenamiento (Hoy) y Novedades. */
export const PANTALLAS_PARA_TIRAR: readonly string[] = ['inicio', 'hoy', 'entrenamiento', 'novedades'];

export const admiteTirarParaActualizar = (pantalla: string): boolean => PANTALLAS_PARA_TIRAR.includes(pantalla);
