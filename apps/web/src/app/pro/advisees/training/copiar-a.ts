/**
 * ED-23 y ED-24 (WP-EDITORES-PROFESIONAL; V3 E-01, E-02 y E-03) · Copiar en la estación de Entrenamiento, sin React:
 * «Copiar la sesión a…» y «Copiar a otra semana», con destino y vista previa, y los tres verbos de copia de un
 * ejercicio: «Copiar el ejercicio a…», «Copiar la prescripción a…» y «Copiar estas series a…».
 *
 * - **Una copia es del plan, no del original** (como TB-48): va al final del destino, sin identificadores de nodo (el
 *   servidor los asigna al guardar). Una sesión copiada a otra semana conserva su nombre: es la misma sesión en otra
 *   semana. No entra en la agenda hasta tener días: los chips de DL-137 no cambian.
 * - **Lo que se reemplaza se dice antes:** copiar la prescripción o las series sobre otro ejercicio pisa lo suyo, y la
 *   vista previa lo nombra.
 * - **Los topes del contrato se respetan:** 30 sesiones en un bloque, 14 en un microciclo y 40 ejercicios en una sesión.
 * - Nada de esto cambia el borrador que recibe: cada función devuelve la estructura nueva.
 */
import { sinIdentificadoresDeSesion, type EstructuraDePlanDeEntrenamientoEntrada } from '@be/domain';

type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];
type Sesion = NonNullable<Bloques[number]['sessions']>[number];
type Prescripcion = Sesion['prescriptions'][number];

/** Un lugar con sesiones: un bloque sin microciclos (`j` en `null`) o un microciclo. */
export interface Grupo {
  readonly i: number;
  readonly j: number | null;
  readonly nombre: string;
}
export interface LugarDeLaSesion {
  readonly i: number;
  readonly j: number | null;
  readonly k: number;
}

const TOPE = { delBloque: 30, delMicrociclo: 14, ejercicios: 40 } as const;

const nombreDelBloque = (b: { readonly label: string }, i: number) => b.label.trim() || `Bloque ${i + 1}`;
const nombreDelMicrociclo = (m: { readonly label: string }, j: number) => m.label.trim() || `Semana ${j + 1}`;
const nombreDeLaSesion = (s: { readonly label: string }, k: number) => s.label.trim() || `Sesión ${k + 1}`;

/** Los lugares con sesiones del plan, en orden: «Bloque 1» o «Bloque 1 · Semana 2». */
export function gruposDelPlan(b: Bloques): Grupo[] {
  return b.flatMap((bloque, i): Grupo[] =>
    (bloque.microcycles?.length ?? 0) > 0
      ? bloque.microcycles!.map((m, j) => ({ i, j, nombre: `${nombreDelBloque(bloque, i)} · ${nombreDelMicrociclo(m, j)}` }))
      : [{ i, j: null, nombre: nombreDelBloque(bloque, i) }],
  );
}

const mismoGrupo = (a: { readonly i: number; readonly j: number | null }, b: { readonly i: number; readonly j: number | null }) => a.i === b.i && a.j === b.j;

/** Adónde se puede copiar una sesión: los otros lugares; con `soloOtrasSemanas`, las otras semanas del mismo bloque. */
export function destinosDeLaSesion(b: Bloques, desde: { readonly i: number; readonly j: number | null }, soloOtrasSemanas = false): Grupo[] {
  return gruposDelPlan(b).filter((g) => !mismoGrupo(g, desde) && (!soloOtrasSemanas || (g.i === desde.i && g.j !== null)));
}

function sesionesDe(b: Bloques, g: { readonly i: number; readonly j: number | null }): Sesion[] | null {
  const bloque = b[g.i];
  if (!bloque) return null;
  if (g.j === null) return (bloque.microcycles?.length ?? 0) > 0 ? null : (bloque.sessions ?? []);
  return bloque.microcycles?.[g.j]?.sessions ?? null;
}

const tope = (g: { readonly j: number | null }) => (g.j === null ? TOPE.delBloque : TOPE.delMicrociclo);
const series = (s: Sesion) => s.prescriptions.reduce((n, p) => n + p.sets.length, 0);

export type ResultadoDeCopiar = { readonly tipo: 'copiada'; readonly bloques: Bloques; readonly posicion: number } | { readonly tipo: 'no-se-puede'; readonly motivo: 'NO_ESTA' | 'TOPE' | 'MISMO_LUGAR' };

/** «Copiar la sesión a…»: la copia, sin identificadores y con su nombre, al final del destino. */
export function copiarLaSesion(b: Bloques, desde: LugarDeLaSesion, hacia: { readonly i: number; readonly j: number | null }): ResultadoDeCopiar {
  if (mismoGrupo(desde, hacia)) return { tipo: 'no-se-puede', motivo: 'MISMO_LUGAR' };
  const origen = sesionesDe(b, desde)?.[desde.k];
  const destino = sesionesDe(b, hacia);
  if (!origen || !destino) return { tipo: 'no-se-puede', motivo: 'NO_ESTA' };
  if (destino.length >= tope(hacia)) return { tipo: 'no-se-puede', motivo: 'TOPE' };
  const nuevos = structuredClone(b) as Bloques;
  const lista = sesionesDe(nuevos, hacia)!;
  // Un bloque sin microciclos que todavía no tenía la lista: se crea en la copia.
  if (hacia.j === null) nuevos[hacia.i]!.sessions = lista;
  lista.push(sinIdentificadoresDeSesion(structuredClone(origen)) as Sesion);
  return { tipo: 'copiada', bloques: nuevos, posicion: lista.length - 1 };
}

/** La vista previa: «Se suma «Piernas A» (5 ejercicios, 17 series) al final de Bloque 1 · Semana 2, como su sesión 4.» */
export function vistaPreviaDeLaSesion(b: Bloques, desde: LugarDeLaSesion, hacia: Grupo): string {
  const s = sesionesDe(b, desde)?.[desde.k];
  const destino = sesionesDe(b, hacia);
  if (!s || !destino) return 'Esa sesión o ese lugar ya no están.';
  if (destino.length >= tope(hacia)) return `${hacia.nombre} ya tiene ${destino.length} sesiones, el máximo.`;
  const ejercicios = s.prescriptions.length;
  return `Se suma «${nombreDeLaSesion(s, desde.k)}» (${ejercicios === 1 ? '1 ejercicio' : `${ejercicios} ejercicios`}, ${series(s) === 1 ? '1 serie' : `${series(s)} series`}) al final de ${hacia.nombre}, como su sesión ${destino.length + 1}. Sin días: los elegís con los chips.`;
}

// ─── ED-23: los tres verbos de copia de un ejercicio ─────────────────────────────────────────────────────────────

export interface LugarDelEjercicio extends LugarDeLaSesion {
  readonly l: number;
}

/** «Copiar el ejercicio a…»: el ejercicio con todo lo suyo, sin su identificador, al final de otra sesión. */
export function copiarElEjercicio(b: Bloques, desde: LugarDelEjercicio, hacia: LugarDeLaSesion): ResultadoDeCopiar {
  if (mismoGrupo(desde, hacia) && desde.k === hacia.k) return { tipo: 'no-se-puede', motivo: 'MISMO_LUGAR' };
  const p = sesionesDe(b, desde)?.[desde.k]?.prescriptions[desde.l];
  const destino = sesionesDe(b, hacia)?.[hacia.k];
  if (!p || !destino) return { tipo: 'no-se-puede', motivo: 'NO_ESTA' };
  if (destino.prescriptions.length >= TOPE.ejercicios) return { tipo: 'no-se-puede', motivo: 'TOPE' };
  const nuevos = structuredClone(b) as Bloques;
  const lista = sesionesDe(nuevos, hacia)![hacia.k]!.prescriptions;
  const { prescriptionId: _id, ...copia } = structuredClone(p);
  lista.push(copia as Prescripcion);
  return { tipo: 'copiada', bloques: nuevos, posicion: lista.length - 1 };
}

/** Qué copia cada verbo: la prescripción es todo menos el ejercicio, su identificador y su nota; las series, solo las series. */
export type QueSeCopia = 'prescripcion' | 'series';

function conLoCopiado(destino: Prescripcion, origen: Prescripcion, que: QueSeCopia): Prescripcion {
  const o = structuredClone(origen);
  if (que === 'series') return { ...destino, sets: o.sets };
  const { prescriptionId: _id, exerciseVersionId: _ej, note: _nota, ...prescripcion } = o;
  const { prescriptionId, exerciseVersionId, note } = destino;
  // Lo que el original no declara tampoco queda en el destino: la copia es la misma prescripción.
  return { ...(prescriptionId ? { prescriptionId } : {}), exerciseVersionId, ...(note !== undefined ? { note } : {}), ...prescripcion } as Prescripcion;
}

/** «Copiar la prescripción a…» o «Copiar estas series a…»: sobre otros ejercicios de la misma sesión. */
export function copiarSobre(b: Bloques, desde: LugarDelEjercicio, a: readonly number[], que: QueSeCopia): Bloques {
  const nuevos = structuredClone(b) as Bloques;
  const sesion = sesionesDe(nuevos, desde)?.[desde.k];
  const origen = sesionesDe(b, desde)?.[desde.k]?.prescriptions[desde.l];
  if (!sesion || !origen) return nuevos;
  for (const l of a) if (l !== desde.l && sesion.prescriptions[l]) sesion.prescriptions[l] = conLoCopiado(sesion.prescriptions[l]!, origen, que);
  return nuevos;
}

/** Si la prescripción declara algo de lo general, que «Copiar la prescripción» pisa (todo menos las series y la nota). */
function tieneLoGeneral(p: Prescripcion): boolean {
  return !!(p.intensity || p.suggestedLoad || p.restSeconds || p.loadBasis || p.repetitionBasis || (p.professionalParameters?.length ?? 0) > 0);
}

/** Lo que se reemplaza en los elegidos: «Se reemplazan las 4 series de Sentadilla y las 3 de Remo.» `null` si no pisa nada. */
export function loQueSeReemplaza(b: Bloques, desde: LugarDelEjercicio, a: readonly number[], que: QueSeCopia, nombreDe: (p: Prescripcion) => string): string | null {
  const sesion = sesionesDe(b, desde)?.[desde.k];
  if (!sesion) return null;
  const pisados = a.filter((l) => l !== desde.l).flatMap((l) => {
    const p = sesion.prescriptions[l];
    return p && (p.sets.length > 0 || (que === 'prescripcion' && tieneLoGeneral(p))) ? [p] : [];
  });
  if (pisados.length === 0) return null;
  // Sin series, lo que se pisa es solo lo general: «lo general de Remo», no «las 0 series y lo general».
  const series = (p: Prescripcion) => (p.sets.length === 0 ? null : p.sets.length === 1 ? 'la serie' : `las ${p.sets.length} series`);
  const partes = pisados.map((p) => `${[series(p), que === 'prescripcion' ? 'lo general' : null].filter(Boolean).join(' y ')} de ${nombreDe(p)}`);
  const lista = partes.length === 1 ? partes[0]! : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
  // Una sola cosa en singular («Se reemplaza lo general de Remo», «Se reemplaza la serie de Remo»).
  const una = pisados.length === 1 && pisados[0]!.sets.length <= 1 && (pisados[0]!.sets.length === 0) !== (que === 'series');
  return `${una ? 'Se reemplaza' : 'Se reemplazan'} ${lista}.`;
}

export const COPY_COPIAR = {
  copiarLaSesion: 'Copiar la sesión a…',
  copiarAOtraSemana: 'Copiar a otra semana',
  sinOtraSemana: 'Este bloque no tiene otra semana.',
  sinOtroLugar: 'El plan no tiene otro bloque ni otra semana.',
  copiarElEjercicio: 'Copiar el ejercicio a…',
  copiarLaPrescripcion: 'Copiar la prescripción a…',
  copiarLasSeries: 'Copiar estas series a…',
  sinOtrosEjercicios: 'La sesión no tiene otro ejercicio.',
  sinOtraSesion: 'El plan no tiene otra sesión.',
  tituloDeLaSesion: (sesion: string) => `Copiar «${sesion}» a…`,
  tituloDelEjercicio: (ejercicio: string, que: 'ejercicio' | QueSeCopia) =>
    que === 'ejercicio' ? `Copiar «${ejercicio}» a otra sesión` : que === 'prescripcion' ? `Copiar la prescripción de «${ejercicio}» a…` : `Copiar las series de «${ejercicio}» a…`,
  destino: 'Destino',
  elegidos: 'Ejercicios de esta sesión',
  copiar: 'Copiar',
  copiarA: (destino: string) => `Copiar a ${destino}`,
  copiarAEstos: (n: number) => (n === 1 ? 'Copiar a 1 ejercicio' : `Copiar a ${n} ejercicios`),
  elegiUnDestino: 'Elegí adónde copiar.',
  elegiAlMenosUno: 'Elegí al menos un ejercicio.',
  queSeCopiaDeLaPrescripcion: 'Se copian las series y lo general (intensidad, carga sugerida, descanso, parámetros y cómo se cuentan); el ejercicio y su nota no cambian.',
  queSeCopiaDeLasSeries: 'Se copian solo las series, con sus valores propios; lo general de cada ejercicio no cambia.',
  copiada: (destino: string) => `Se copió a ${destino}. Se guarda sola.`,
  topeDeEjercicios: 'Esa sesión ya tiene 40 ejercicios, el máximo.',
} as const;

/** Las sesiones del plan, cada una con su lugar y su nombre: «Fuerza · Semana 2 · Piernas A». */
export function sesionesDelPlan(b: Bloques): (LugarDeLaSesion & { readonly nombre: string })[] {
  return gruposDelPlan(b).flatMap((g) => (sesionesDe(b, g) ?? []).map((s, k) => ({ i: g.i, j: g.j, k, nombre: `${g.nombre} · ${nombreDeLaSesion(s, k)}` })));
}
