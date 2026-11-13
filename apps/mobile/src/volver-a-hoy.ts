import type { Ruta } from './navegacion';

/**
 * «Ir a Entrenamiento» e «Ir a Hoy» de las pantallas vacías (vuelta 2). El historial y los registros se ven en dos
 * lugares: como pestaña de su zona y como pantalla propia. En la pestaña, `ir` a la misma zona no cambia nada: la pestaña
 * elegida se recuerda y la pantalla sigue en la misma lista vacía. Por eso la acción la resuelve el contenedor: en la
 * pestaña, elige Hoy; en la pantalla propia, deja Hoy recordado antes de ir, así la zona abre ahí.
 */
export type Zona = 'entrenamiento' | 'nutricion';

/** La clave con la que cada zona recuerda su pestaña (useSeleccionRecordada). */
export const VISTA_RECORDADA: Readonly<Record<Zona, string>> = { entrenamiento: 'entrenamiento:vista', nutricion: 'nutricion:vista' };

const RUTA_DE_LA_ZONA: Readonly<Record<Zona, Ruta>> = { entrenamiento: { nombre: 'entrenamiento' }, nutricion: { nombre: 'hoy' } };

export type DondeSeVe =
  | { readonly en: 'pestana'; readonly elegir: (vista: 'HOY') => void }
  | { readonly en: 'pantalla'; readonly recordar: (clave: string, vista: 'HOY') => void; readonly ir: (ruta: Ruta) => void };

export function volverAHoy(zona: Zona, donde: DondeSeVe): void {
  if (donde.en === 'pestana') {
    donde.elegir('HOY');
    return;
  }
  donde.recordar(VISTA_RECORDADA[zona], 'HOY');
  donde.ir(RUTA_DE_LA_ZONA[zona]);
}
