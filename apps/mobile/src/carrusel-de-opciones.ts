/**
 * El carrusel de las opciones de una comida (WP-NUTRICION-RECETAS §9; encargo de Dirección del 2026-10-05, §3). Es la
 * lógica pura, sin React ni React Native: `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **Manual.** Cambia con un gesto o con las flechas, nunca solo. Deslizar no registra ni cambia el plan: registrar es
 *   «Comí esta opción».
 * - **Se ve una parte de la tarjeta siguiente** (`ASOMO_DE_LA_SIGUIENTE`): así se nota que hay más opciones. Cada tarjeta
 *   se detiene alineada a la izquierda: el contenido deja libre a la derecha el ancho del asomo.
 * - **El contador dice «Opción n de m»**, y las flechas se deshabilitan en los extremos. Con una sola opción no hay
 *   contador ni flechas, y la tarjeta ocupa todo el ancho.
 * - **La posición se recuerda por la opción, no por el índice.** Si el plan cambia el orden o saca una opción, se vuelve a
 *   la misma opción si sigue, o a la primera.
 */
import { COPY_REGISTRO_DE_COMIDAS } from '@be/domain';

/** Cuánto se ve de la tarjeta siguiente, en dp. */
export const ASOMO_DE_LA_SIGUIENTE = 24;
/** El espacio entre dos tarjetas, en dp. */
export const SEPARACION_ENTRE_TARJETAS = 10;

export interface MedidasDelCarrusel {
  /** El ancho de cada tarjeta. */
  readonly anchoDeTarjeta: number;
  /** Cuánto se desplaza el carrusel de una tarjeta a la siguiente: el ancho más la separación. */
  readonly paso: number;
  /** El espacio libre al final del contenido, para que la última tarjeta también se detenga alineada a la izquierda. */
  readonly rellenoFinal: number;
}

/** Las medidas para un ancho disponible y una cantidad de opciones. Con una sola, la tarjeta ocupa todo el ancho. */
export function medidasDelCarrusel(anchoDisponible: number, total: number): MedidasDelCarrusel {
  const ancho = Number.isFinite(anchoDisponible) && anchoDisponible > 0 ? anchoDisponible : 0;
  if (total <= 1) return { anchoDeTarjeta: ancho, paso: ancho, rellenoFinal: 0 };
  const anchoDeTarjeta = Math.max(1, Math.round(ancho - ASOMO_DE_LA_SIGUIENTE - SEPARACION_ENTRE_TARJETAS));
  return { anchoDeTarjeta, paso: anchoDeTarjeta + SEPARACION_ENTRE_TARJETAS, rellenoFinal: Math.max(0, ancho - anchoDeTarjeta) };
}

/** Un índice dentro de las opciones: lo que no es un número va a la primera, y lo que se pasa, al extremo. */
export function indiceValido(indice: number, total: number): number {
  if (total <= 0 || !Number.isFinite(indice)) return 0;
  return Math.min(Math.max(Math.round(indice), 0), total - 1);
}

/** La tarjeta que quedó a la vista después de un gesto: la más cercana al desplazamiento. */
export function indiceDesdeDesplazamiento(x: number, paso: number, total: number): number {
  if (total <= 1 || !(paso > 0)) return 0;
  return indiceValido(x / paso, total);
}

/** Cuánto hay que desplazar el carrusel para mostrar una tarjeta. */
export function desplazamientoDe(indice: number, paso: number, total: number): number {
  return indiceValido(indice, total) * (paso > 0 ? paso : 0);
}

export interface ControlesDelCarrusel {
  /** «Opción n de m», o `null` con una sola opción: sin contador ni flechas. */
  readonly contador: string | null;
  readonly anteriorHabilitada: boolean;
  readonly siguienteHabilitada: boolean;
}

export function controlesDelCarrusel(indice: number, total: number): ControlesDelCarrusel {
  if (total <= 1) return { contador: null, anteriorHabilitada: false, siguienteHabilitada: false };
  const i = indiceValido(indice, total);
  return { contador: COPY_REGISTRO_DE_COMIDAS.opcionDe(i + 1, total), anteriorHabilitada: i > 0, siguienteHabilitada: i < total - 1 };
}

/** La posición de la opción recordada; si ya no está en el plan, la primera. */
export function indiceDeLaOpcion(opciones: readonly { readonly optionId: string }[], opcionRecordada: string | null | undefined): number {
  if (!opcionRecordada) return 0;
  const i = opciones.findIndex((o) => o.optionId === opcionRecordada);
  return i >= 0 ? i : 0;
}
