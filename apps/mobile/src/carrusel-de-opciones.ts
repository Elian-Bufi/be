/**
 * El carrusel de las opciones de una comida en Nutrición · Hoy (DL-194, A32-01; vuelve sobre AV2-21 de DL-170). Es la
 * lógica pura, sin React ni React Native: `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * Dirección (2026-11-22) prefiere el carrusel a los segmentos «Opción 1 | 2 | 3»: deslizar con imán y **también** flechas,
 * «por si no se entiende», con los puntitos y «Opción n de m».
 * - **Sin la tarjeta vecina asomando** (la queja del 2026-10-29): cada tarjeta ocupa todo el ancho y se detiene entera;
 *   entre dos tarjetas hay una separación que solo se ve mientras se desliza (`medidasDelCarrusel`).
 * - **Manual.** Cambia con el gesto o con las flechas, nunca solo. Deslizar no registra ni cambia el plan: registrar es
 *   «Comí esta opción».
 * - **«Opción n de m»** se ve entre las flechas y se anuncia al cambiar, para TalkBack, una sola vez (sin región viva:
 *   el anuncio y la región dirían lo mismo dos veces). Las flechas dicen «Opción anterior» y «Opción siguiente» y se
 *   deshabilitan en los extremos. **Con una sola opción no hay ningún control**: ni flechas, ni contador, ni puntitos.
 * - **La posición se recuerda por la opción, no por el índice.** Si el plan cambia el orden o saca una opción, se vuelve a
 *   la misma opción si sigue, o a la primera.
 * - **La imagen se pide solo para la opción a la vista** (cada acceso queda registrado en la API). Una que ya estuvo a la
 *   vista conserva la suya: volver a ella no pide otro acceso (`opcionesVistas`).
 */
import { COPY_REGISTRO_DE_COMIDAS } from '@be/domain';

/** El espacio entre dos tarjetas, en dp: solo se ve mientras se desliza. */
export const SEPARACION_ENTRE_TARJETAS = 12;

export interface MedidasDelCarrusel {
  /** El ancho de cada tarjeta: todo el ancho disponible, sin asomo de la siguiente. */
  readonly anchoDeTarjeta: number;
  /** Cuánto se desplaza el carrusel de una tarjeta a la siguiente: el ancho más la separación. */
  readonly paso: number;
}

/** Las medidas para un ancho disponible y una cantidad de opciones: cada tarjeta, a todo el ancho. */
export function medidasDelCarrusel(anchoDisponible: number, total: number): MedidasDelCarrusel {
  const ancho = Number.isFinite(anchoDisponible) && anchoDisponible > 0 ? Math.floor(anchoDisponible) : 0;
  return { anchoDeTarjeta: ancho, paso: total > 1 && ancho > 0 ? ancho + SEPARACION_ENTRE_TARJETAS : ancho };
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

/** Cuánto hay que desplazar el carrusel para mostrar una tarjeta entera. */
export function desplazamientoDe(indice: number, paso: number, total: number): number {
  return indiceValido(indice, total) * (paso > 0 ? paso : 0);
}

export interface ControlesDelCarrusel {
  /** «Opción n de m», o `null` con una sola opción: entonces no hay ningún control. */
  readonly contador: string | null;
  readonly anterior: { readonly etiqueta: string; readonly habilitada: boolean } | null;
  readonly siguiente: { readonly etiqueta: string; readonly habilitada: boolean } | null;
  /** Los puntitos: cuántos y cuál va lleno. Vacío con una sola opción. Son decoración: el lector lee el contador. */
  readonly puntos: readonly boolean[];
}

export function controlesDelCarrusel(indice: number, total: number): ControlesDelCarrusel {
  if (total <= 1) return { contador: null, anterior: null, siguiente: null, puntos: [] };
  const i = indiceValido(indice, total);
  return {
    contador: COPY_REGISTRO_DE_COMIDAS.opcionDe(i + 1, total),
    anterior: { etiqueta: COPY_REGISTRO_DE_COMIDAS.opcionAnterior, habilitada: i > 0 },
    siguiente: { etiqueta: COPY_REGISTRO_DE_COMIDAS.opcionSiguiente, habilitada: i < total - 1 },
    puntos: Array.from({ length: total }, (_, k) => k === i),
  };
}

/** «Opción 2 de 3», lo que se anuncia al cambiar; `null` con una sola opción. */
export function anuncioDeLaOpcion(indice: number, total: number): string | null {
  return total <= 1 ? null : COPY_REGISTRO_DE_COMIDAS.opcionDe(indiceValido(indice, total) + 1, total);
}

/** La posición de la opción recordada; si ya no está en el plan, la primera. */
export function indiceDeLaOpcion(opciones: readonly { readonly optionId: string }[], opcionRecordada: string | null | undefined): number {
  if (!opcionRecordada) return 0;
  const i = opciones.findIndex((o) => o.optionId === opcionRecordada);
  return i >= 0 ? i : 0;
}

/**
 * Las opciones que ya estuvieron a la vista, con la de ahora: solo esas piden su imagen. Devuelve el mismo conjunto si
 * no cambia nada (React no vuelve a dibujar).
 */
export function opcionesVistas(vistas: ReadonlySet<string>, aLaVista: string | null | undefined): ReadonlySet<string> {
  if (!aLaVista || vistas.has(aLaVista)) return vistas;
  return new Set([...vistas, aLaVista]);
}
