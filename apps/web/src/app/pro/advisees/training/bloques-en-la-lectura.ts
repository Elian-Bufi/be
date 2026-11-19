/**
 * WP-ENTRENAMIENTO-PLANIFICACION (§7 de la revisión adversaria) · los bloques de la sesión en las lecturas del website:
 * la versión activa (`estructura-del-plan.tsx`) y el plan que la persona comparte con otro profesional
 * (`seguimiento/plan-compartido.tsx`). Antes, las dos listaban los ejercicios sueltos: el profesional no veía ahí lo que la
 * persona ve agrupado en la APK nueva. Es lógica pura, sin React, con su prueba en `entrenamiento-planificacion.test.mjs`.
 *
 * - **Las partes salen de `partesDeLaSesion` del dominio,** la misma regla que usan el editor y la APK: un bloque aparece
 *   donde está su primer ejercicio, con todos los suyos; un ejercicio que nombra un bloque que la sesión no tiene va
 *   suelto, a la vista.
 * - **Un bloque sin ejercicios no se muestra** (la API no deja activarlo): no hay nada que ubicar en él.
 * - **El encabezado describe, no le indica a nadie:** quien lee es un profesional (el que armó el plan u otro, en lo
 *   compartido), no la persona que lo hace. En uno «En vueltas»: «En vueltas · se alternan 2 ejercicios · 3 vueltas · 90 s
 *   de descanso al terminar cada vuelta». Uno «Seguido» lleva solo su nombre.
 * - Sin bloques (o con una APK que no los declara, que igual no pasa por acá), la lista de siempre.
 */
import { COPY_BLOQUES_DE_LA_SESION, descansoEnPalabras, nombreDelBloqueDeLaSesion, numero, partesDeLaSesion, type BloqueParaLeer } from '@be/domain';

/** Lo mínimo de un ejercicio leído: su orden y, si lo tiene, su bloque. */
export interface EjercicioLeido {
  readonly order: number;
  readonly exerciseGroupId?: string | null;
}

/** Lo que se dibuja arriba de los ejercicios de un bloque. */
export interface EncabezadoLeido {
  readonly groupId: string;
  /** El nombre del bloque, o «Bloque N». */
  readonly nombre: string;
  /** En uno «En vueltas», cómo se hace; `null` en uno «Seguido». */
  readonly detalle: string | null;
  /** Lo que lee el lector de pantalla: «Bloque Pierna, en vueltas: …, 2 ejercicios». */
  readonly etiqueta: string;
}

export type ParteLeida<P> = { readonly tipo: 'suelto'; readonly ejercicio: P } | { readonly tipo: 'bloque'; readonly encabezado: EncabezadoLeido; readonly ejercicios: readonly P[] };

const ejercicios = (n: number): string => (n === 1 ? '1 ejercicio' : `${numero(n)} ejercicios`);

/** «En vueltas · se alternan 2 ejercicios · 3 vueltas · 90 s de descanso al terminar cada vuelta». */
export function detalleDelBloqueLeido(g: BloqueParaLeer, cuantos: number): string | null {
  if (g.kind !== 'ROUNDS') return null;
  const partes: string[] = [COPY_BLOQUES_DE_LA_SESION.tipo.ROUNDS, cuantos === 1 ? 'un ejercicio' : `se alternan ${numero(cuantos)} ejercicios`];
  if (typeof g.rounds === 'number') partes.push(g.rounds === 1 ? '1 vuelta' : `${numero(g.rounds)} vueltas`);
  if (typeof g.restAfterRoundSeconds === 'number') {
    partes.push(g.restAfterRoundSeconds === 0 ? 'sin pausa al terminar cada vuelta' : `${descansoEnPalabras(g.restAfterRoundSeconds)} de descanso al terminar cada vuelta`);
  }
  return partes.join(' · ');
}

/** El encabezado de un bloque con `cuantos` ejercicios; `posicion` (desde cero) le da «Bloque N» a uno sin nombre. */
export function encabezadoLeido(g: BloqueParaLeer, posicion: number, cuantos: number): EncabezadoLeido {
  const nombre = nombreDelBloqueDeLaSesion(g, posicion);
  const detalle = detalleDelBloqueLeido(g, cuantos);
  const leido = /^bloque(\s|$)/i.test(nombre) ? nombre : `${COPY_BLOQUES_DE_LA_SESION.bloque} ${nombre}`;
  return { groupId: g.groupId, nombre, detalle, etiqueta: `${leido}${detalle ? `, ${detalle.charAt(0).toLowerCase()}${detalle.slice(1).split(' · ').join(', ')}` : ''}, ${ejercicios(cuantos)}.` };
}

/**
 * Las partes de una sesión leída, en el orden en que se hacen: los ejercicios ordenados por su `order` y los bloques por el
 * suyo (si lo traen). Un bloque vacío no aparece.
 */
export function partesParaLeer<P extends EjercicioLeido, B extends BloqueParaLeer & { readonly order?: number }>(s: { readonly prescriptions: readonly P[]; readonly exerciseGroups?: readonly B[] | null }): ParteLeida<P>[] {
  const lista = [...s.prescriptions].sort((a, b) => a.order - b.order);
  const grupos = [...(s.exerciseGroups ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return partesDeLaSesion({ prescriptions: lista, exerciseGroups: grupos }).flatMap((parte): ParteLeida<P>[] => {
    if (parte.tipo === 'suelto') return [{ tipo: 'suelto', ejercicio: parte.ejercicio.prescripcion }];
    if (parte.ejercicios.length === 0) return [];
    return [{ tipo: 'bloque', encabezado: encabezadoLeido(parte.bloque, parte.posicionDelBloque, parte.ejercicios.length), ejercicios: parte.ejercicios.map((e) => e.prescripcion) }];
  });
}
