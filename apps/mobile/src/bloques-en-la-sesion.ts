/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION, decisión de Dirección del 2026-11-18) · los bloques de la sesión, como los
 * muestra la APK. Es lógica pura: la usan las listas de ejercicios de una sesión planificada (`bloques-en-pantalla.tsx`)
 * y su prueba (`bloques-en-la-sesion.test.ts`).
 *
 * - **Solo agrupa lo que se ve.** Las partes salen de `partesDeLaSesion` del dominio, en el orden de la lista: el registro,
 *   el orden de las series, la franja de progreso y la navegación siguen recorriendo las prescripciones como siempre.
 * - **Sin bloques, la lista de siempre:** cada ejercicio es una parte suelta, en su lugar, y la pantalla queda igual.
 * - **El encabezado:** el nombre del bloque y, en uno «En vueltas», la indicación para hacerlo («Alterná estos 2
 *   ejercicios · 3 vueltas · descansá 90 s al terminar cada vuelta»). Donde la sesión ya se hizo («Ya la hice»), en vez
 *   de la indicación va su resumen («En vueltas · 3 vueltas»): no se le indica a nadie lo que ya hizo. Uno «Seguido» lleva
 *   solo el título.
 * - **Para el lector de pantalla,** el encabezado se lee entero: «Bloque Torso. Alterná estos 2 ejercicios, 3 vueltas,
 *   descansá 90 segundos al terminar cada vuelta.», con el descanso en palabras y sin los «·».
 * - Un bloque sin ejercicios (la API no deja activarlo) no se muestra: no hay nada que ubicar en él.
 *
 * Describe, no califica (B05): ubica cada ejercicio en su bloque.
 */
import { COPY_BLOQUES_DE_LA_SESION, descansoEnPalabras, indicacionDeVueltas, nombreDelBloqueDeLaSesion, numero, partesDeLaSesion, resumenDelBloque, type BloqueParaLeer, type ConBloque, type SesionConBloques } from '@be/domain';

/** Cómo se dice un bloque «En vueltas»: con la indicación para hacerlo o, en lo que ya se hizo, con su resumen. */
export type ComoSeDiceElBloque = 'indicacion' | 'resumen';

/** Lo que se dibuja arriba de los ejercicios de un bloque. */
export interface EncabezadoDelBloque {
  readonly groupId: string;
  /** El nombre del bloque o «Bloque N». */
  readonly nombre: string;
  /** Debajo del nombre: la indicación (o el resumen) de uno «En vueltas»; `null` en uno «Seguido». */
  readonly detalle: string | null;
  /** Lo que lee el lector de pantalla del encabezado. */
  readonly etiqueta: string;
}

/** Un ejercicio con su lugar en la lista de la sesión (desde cero). */
export interface EjercicioEnLaLista<P> {
  readonly prescripcion: P;
  readonly posicion: number;
}

/** Lo que se ve de la lista de ejercicios, en orden: ejercicios sueltos y bloques con su encabezado y los suyos. */
export type ParteDeLaLista<P> =
  | { readonly tipo: 'suelto'; readonly ejercicio: EjercicioEnLaLista<P> }
  | { readonly tipo: 'bloque'; readonly encabezado: EncabezadoDelBloque; readonly ejercicios: readonly EjercicioEnLaLista<P>[] };

/** «1 ejercicio», «3 ejercicios». */
const ejercicios = (n: number): string => (n === 1 ? '1 ejercicio' : `${numero(n)} ejercicios`);

/** El descanso como lo dice el lector: «90 segundos», «2 minutos», «2 minutos 30 segundos». */
export function descansoParaLeer(segundos: number): string {
  const s = (n: number) => (n === 1 ? '1 segundo' : `${numero(n)} segundos`);
  const m = (n: number) => (n === 1 ? '1 minuto' : `${numero(n)} minutos`);
  // La misma regla que `descansoEnPalabras`: menos de dos minutos que no son justos, en segundos.
  if (segundos < 120 && segundos % 60 !== 0) return s(segundos);
  const resto = segundos % 60;
  return resto === 0 ? m(Math.floor(segundos / 60)) : `${m(Math.floor(segundos / 60))} ${s(resto)}`;
}

/** Lo que va en el renglón de abajo, para el lector: el descanso en palabras y comas en lugar de «·». */
function detalleParaLeer(detalle: string, bloque: BloqueParaLeer): string {
  const descanso = bloque.restAfterRoundSeconds;
  const conPalabras = typeof descanso === 'number' && descanso > 0 ? detalle.replace(`descansá ${descansoEnPalabras(descanso)}`, () => `descansá ${descansoParaLeer(descanso)}`) : detalle;
  return conPalabras.split(' · ').join(', ');
}

/** «Bloque Torso», o el nombre solo si ya empieza con la palabra «Bloque» («Bloque 2», «Bloque A»). */
const nombreParaLeer = (nombre: string): string => (/^bloque(\s|$)/i.test(nombre) ? nombre : `${COPY_BLOQUES_DE_LA_SESION.bloque} ${nombre}`);

/**
 * El encabezado de un bloque con `cuantos` ejercicios. `posicionDelBloque` (desde cero) da «Bloque N» a uno sin nombre.
 * Con `como: 'resumen'`, uno «En vueltas» dice «En vueltas · 3 vueltas» en lugar de la indicación.
 */
export function encabezadoDelBloque(bloque: BloqueParaLeer, posicionDelBloque: number, cuantos: number, como: ComoSeDiceElBloque = 'indicacion'): EncabezadoDelBloque {
  const nombre = nombreDelBloqueDeLaSesion(bloque, posicionDelBloque);
  const leido = nombreParaLeer(nombre);
  if (bloque.kind !== 'ROUNDS') return { groupId: bloque.groupId, nombre, detalle: null, etiqueta: `${leido}, ${ejercicios(cuantos)}.` };
  if (como === 'resumen') {
    const detalle = resumenDelBloque(bloque);
    return { groupId: bloque.groupId, nombre, detalle, etiqueta: `${leido}. ${detalleParaLeer(detalle, bloque)}, ${ejercicios(cuantos)}.` };
  }
  // La indicación ya dice cuántos ejercicios se alternan.
  const detalle = indicacionDeVueltas(bloque, cuantos);
  return { groupId: bloque.groupId, nombre, detalle, etiqueta: `${leido}. ${detalleParaLeer(detalle, bloque)}.` };
}

/**
 * Las partes de la lista de ejercicios de una sesión, en el orden en que se hacen. Sin bloques, una parte suelta por
 * ejercicio, en el orden de siempre. Los bloques sin ejercicios no se muestran.
 */
export function partesParaMostrar<P extends ConBloque>(sesion: SesionConBloques<P, BloqueParaLeer>, como: ComoSeDiceElBloque = 'indicacion'): ParteDeLaLista<P>[] {
  return partesDeLaSesion(sesion).flatMap((parte): ParteDeLaLista<P>[] => {
    if (parte.tipo === 'suelto') return [parte];
    if (parte.ejercicios.length === 0) return [];
    return [{ tipo: 'bloque', encabezado: encabezadoDelBloque(parte.bloque, parte.posicionDelBloque, parte.ejercicios.length, como), ejercicios: parte.ejercicios }];
  });
}
