/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION, decisión de Dirección del 2026-11-18) · el bloque dentro de la sesión.
 *
 * Un bloque agrupa ejercicios de una sesión con un título (Torso, Pierna, Core…). Hay dos tipos (`TipoDeBloqueSchema`):
 * - **«Seguido»** (`SEQUENTIAL`, el que viene por defecto): los ejercicios se hacen de a uno, como siempre;
 * - **«En vueltas»** (`ROUNDS`): dos o más ejercicios alternados, con las vueltas y el descanso al terminar cada vuelta.
 *   Cubre la superserie y el circuito sin esa jerga.
 *
 * **Es una marca sobre la lista, no un nivel que la contiene** (ENP-D02). La sesión sigue teniendo una sola lista de
 * ejercicios, en el orden en que se hacen; encima, `exerciseGroups` dice qué bloques tiene y cada ejercicio, con su
 * `exerciseGroupId`, a cuál pertenece. Así, todo lo que recorre las prescripciones (el registro, la comparación serie por
 * serie, la instantánea, «La vez pasada», Analizar, la estimación) no cambia.
 *
 * **Lo que no tiene bloques no lleva las claves** (como `setKind` en DL-178): una sesión sin bloques y un ejercicio suelto
 * se guardan idénticos a los de antes, con su huella. Este módulo es la única regla de cómo se arman las partes de una
 * sesión, qué no se puede guardar y qué falta para activar; lo usan la API, el website y la APK.
 */
import type { BloqueDeLaSesionEntrada, TipoDeBloque } from './contratos-entrenamiento';
import type { ValidationIssue } from './contratos';
import { numero } from './formato-numeros';
import { seriesEfectivas } from './tipos-de-serie';

/** El bloque como se guarda: las vueltas y el descanso, solo en uno «En vueltas» y solo si están. */
export interface BloqueDeLaSesionGuardado {
  readonly groupId: string;
  readonly label: string;
  readonly kind: TipoDeBloque;
  readonly rounds?: number;
  readonly restAfterRoundSeconds?: number;
}

/** Lo mínimo de un bloque para leerlo: lo que entra, lo que se guarda y lo que sale tienen esto. */
export interface BloqueParaLeer {
  readonly groupId: string;
  readonly label: string;
  readonly kind: TipoDeBloque;
  readonly rounds?: number | null;
  readonly restAfterRoundSeconds?: number | null;
}
/** Lo mínimo de un ejercicio para saber su bloque. */
export interface ConBloque {
  readonly exerciseGroupId?: string | null;
}
/** Lo mínimo de una sesión para armar sus partes. */
export interface SesionConBloques<P extends ConBloque = ConBloque, B extends { readonly groupId: string } = BloqueParaLeer> {
  readonly prescriptions: readonly P[];
  readonly exerciseGroups?: readonly B[] | null;
}

/** El bloque de un ejercicio, o `null` si va suelto. */
export const bloqueDe = (p: ConBloque): string | null => p.exerciseGroupId ?? null;

/**
 * La forma canónica de un bloque: la que se guarda y la que vuelve al editor. Las vueltas y el descanso, solo en uno «En
 * vueltas» y solo si tienen valor. Con esto, lo que manda el editor y lo que lee después son idénticos (ED-61).
 */
export function bloqueGuardado(g: BloqueParaLeer): BloqueDeLaSesionGuardado {
  if (g.kind !== 'ROUNDS') return { groupId: g.groupId, label: g.label, kind: g.kind };
  return {
    groupId: g.groupId,
    label: g.label,
    kind: g.kind,
    ...(typeof g.rounds === 'number' ? { rounds: g.rounds } : {}),
    ...(typeof g.restAfterRoundSeconds === 'number' ? { restAfterRoundSeconds: g.restAfterRoundSeconds } : {}),
  };
}

/** Lo que se guarda de los bloques de una sesión: nada, si no tiene (la sesión queda idéntica a las de antes). */
export const bloquesGuardados = (grupos: readonly BloqueParaLeer[] | null | undefined): { readonly exerciseGroups?: BloqueDeLaSesionGuardado[] } =>
  grupos && grupos.length > 0 ? { exerciseGroups: grupos.map(bloqueGuardado) } : {};

/** Lo que se guarda del bloque de un ejercicio: nada, si va suelto. */
export const bloqueDelEjercicioGuardado = (p: ConBloque): { readonly exerciseGroupId?: string } => (p.exerciseGroupId ? { exerciseGroupId: p.exerciseGroupId } : {});

/** El ejercicio sin su bloque: al copiarlo a otra sesión, el bloque no viaja (ENP-D08). */
export function sinBloque<P extends ConBloque>(p: P): P {
  const { exerciseGroupId: _bloque, ...resto } = p;
  return resto as P;
}

// ─── Las partes de una sesión ───────────────────────────────────────────────────────────────────────────────────

/** Un ejercicio con su posición en la lista de la sesión (desde cero). */
export interface EjercicioUbicado<P> {
  readonly prescripcion: P;
  readonly posicion: number;
}
/** Lo que se ve de una sesión, en orden: ejercicios sueltos y bloques con los suyos. */
export type ParteDeLaSesion<P, B> =
  | { readonly tipo: 'suelto'; readonly ejercicio: EjercicioUbicado<P> }
  | { readonly tipo: 'bloque'; readonly bloque: B; readonly posicionDelBloque: number; readonly ejercicios: readonly EjercicioUbicado<P>[] };

/**
 * Las partes de una sesión, en el orden en que se hacen. Un bloque aparece donde está su primer ejercicio, con todos los
 * suyos; uno sin ejercicios (recién agregado en el editor) va al final, en el orden de los bloques. Un ejercicio que nombra
 * un bloque que la sesión no tiene se muestra suelto: no se esconde (la API no lo deja guardar).
 */
export function partesDeLaSesion<P extends ConBloque, B extends BloqueParaLeer>(s: SesionConBloques<P, B>): ParteDeLaSesion<P, B>[] {
  const grupos = s.exerciseGroups ?? [];
  const porId = new Map(grupos.map((g, n) => [g.groupId, n] as const));
  const partes: ParteDeLaSesion<P, B>[] = [];
  const emitidos = new Set<string>();
  s.prescriptions.forEach((prescripcion, posicion) => {
    const id = bloqueDe(prescripcion);
    const n = id !== null ? porId.get(id) : undefined;
    if (id === null || n === undefined) return partes.push({ tipo: 'suelto', ejercicio: { prescripcion, posicion } });
    if (emitidos.has(id)) return;
    emitidos.add(id);
    const ejercicios = s.prescriptions.flatMap((x, m) => (bloqueDe(x) === id ? [{ prescripcion: x, posicion: m }] : []));
    partes.push({ tipo: 'bloque', bloque: grupos[n]!, posicionDelBloque: n, ejercicios });
  });
  grupos.forEach((g, n) => {
    if (!emitidos.has(g.groupId)) partes.push({ tipo: 'bloque', bloque: g, posicionDelBloque: n, ejercicios: [] });
  });
  return partes;
}

/** Si una sesión tiene algún bloque. */
export const tieneBloques = (s: SesionConBloques): boolean => (s.exerciseGroups?.length ?? 0) > 0;

/** Los ejercicios (por posición) de un bloque. */
export const posicionesDelBloque = (s: SesionConBloques, groupId: string): number[] => s.prescriptions.flatMap((p, n) => (bloqueDe(p) === groupId ? [n] : []));

// ─── Lo que no se puede guardar y lo que falta para activar ─────────────────────────────────────────────────────

export const CodigoDeProblemaDeBloque = {
  /** Al guardar: el ejercicio nombra un bloque que su sesión no tiene. */
  EXERCISE_GROUP_UNKNOWN: 'EXERCISE_GROUP_UNKNOWN',
  /** Al guardar: los ejercicios de un bloque no van seguidos. */
  EXERCISE_GROUP_NOT_CONTIGUOUS: 'EXERCISE_GROUP_NOT_CONTIGUOUS',
  /** Para activar: un bloque sin ejercicios. */
  EXERCISE_GROUP_EMPTY: 'EXERCISE_GROUP_EMPTY',
  /** Para activar: un bloque «En vueltas» con menos de dos ejercicios. */
  ROUNDS_GROUP_NEEDS_TWO_EXERCISES: 'ROUNDS_GROUP_NEEDS_TWO_EXERCISES',
} as const;
const B = CodigoDeProblemaDeBloque;

/**
 * Lo que no deja guardar los bloques de una sesión (`ruta`: la de la sesión). Un identificador repetido es
 * `DUPLICATE_NODE_ID`, como cualquier nodo; un ejercicio que nombra un bloque que la sesión no tiene, o que deja un hueco
 * en su bloque (otro ejercicio en el medio), se rechaza: el bloque no se reordena ni se inventa en silencio.
 */
export function problemasDeLosBloquesAlGuardar(s: SesionConBloques<ConBloque, { readonly groupId: string }>, ruta: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  (s.exerciseGroups ?? []).forEach((g, n) => {
    if (ids.has(g.groupId)) issues.push({ code: 'DUPLICATE_NODE_ID', path: `${ruta}.exerciseGroups[${n}].groupId` });
    ids.add(g.groupId);
  });
  const cerrados = new Set<string>();
  let anterior: string | null = null;
  s.prescriptions.forEach((p, n) => {
    const id = bloqueDe(p);
    if (id !== anterior && anterior !== null) cerrados.add(anterior);
    if (id !== null) {
      if (!ids.has(id)) issues.push({ code: B.EXERCISE_GROUP_UNKNOWN, path: `${ruta}.prescriptions[${n}].exerciseGroupId` });
      else if (cerrados.has(id)) issues.push({ code: B.EXERCISE_GROUP_NOT_CONTIGUOUS, path: `${ruta}.prescriptions[${n}].exerciseGroupId` });
    }
    anterior = id;
  });
  return issues;
}

/** Lo que falta en los bloques de una sesión para activar: ninguno vacío, y los «En vueltas» con dos ejercicios o más. */
export function problemasDeLosBloquesParaActivar(s: SesionConBloques, ruta: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  (s.exerciseGroups ?? []).forEach((g, n) => {
    const cuantos = posicionesDelBloque(s, g.groupId).length;
    if (cuantos === 0) issues.push({ code: B.EXERCISE_GROUP_EMPTY, path: `${ruta}.exerciseGroups[${n}]` });
    else if (g.kind === 'ROUNDS' && cuantos < 2) issues.push({ code: B.ROUNDS_GROUP_NEEDS_TWO_EXERCISES, path: `${ruta}.exerciseGroups[${n}]` });
  });
  return issues;
}

/**
 * ENP-D05: los ejercicios de los bloques «En vueltas» cuyas series efectivas no son tantas como las vueltas. No impide
 * activar: el editor lo dice en «Queda sin completar», con su lugar.
 */
export function seriesQueNoSonLasVueltas(s: SesionConBloques<ConBloque & { readonly sets: readonly { readonly setKind?: 'WORKING' | 'WARM_UP' | null }[] }>): {
  readonly posicion: number;
  readonly vueltas: number;
  readonly series: number;
}[] {
  const vueltas = new Map((s.exerciseGroups ?? []).flatMap((g) => (g.kind === 'ROUNDS' && typeof g.rounds === 'number' ? [[g.groupId, g.rounds] as const] : [])));
  return s.prescriptions.flatMap((p, posicion) => {
    const id = bloqueDe(p);
    const v = id !== null ? vueltas.get(id) : undefined;
    const series = seriesEfectivas(p.sets).length;
    return v !== undefined && series !== v ? [{ posicion, vueltas: v, series }] : [];
  });
}

/**
 * ENP-D05: las series de un ejercicio con tantas efectivas como vueltas. Si faltan, se copia la última efectiva (o una
 * vacía); si sobran, se quitan las de abajo. El calentamiento (DL-178) queda arriba, como estaba.
 */
export function seriesParaLasVueltas<S extends { readonly setKind?: 'WORKING' | 'WARM_UP' | null }>(series: readonly S[], vueltas: number, vacia: S): S[] {
  const efectivas = seriesEfectivas(series);
  const calentamiento = series.filter((x) => !efectivas.includes(x));
  const ultima = efectivas.at(-1) ?? vacia;
  const nuevas = efectivas.length >= vueltas ? efectivas.slice(0, vueltas) : [...efectivas, ...Array.from({ length: vueltas - efectivas.length }, () => structuredClone(ultima))];
  return [...calentamiento, ...nuevas];
}

/** Un identificador de bloque que la sesión todavía no usa: `g-1`, `g-2`… (ENP-D09). */
export function nuevoIdDeBloque(s: SesionConBloques<ConBloque, { readonly groupId: string }>): string {
  const usados = new Set((s.exerciseGroups ?? []).map((g) => g.groupId));
  let n = (s.exerciseGroups?.length ?? 0) + 1;
  while (usados.has(`g-${n}`)) n++;
  return `g-${n}`;
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────────────────────

/** «90 s», «2 min», «2 min 30 s». */
export function descansoEnPalabras(segundos: number): string {
  if (segundos < 120 && segundos % 60 !== 0) return `${numero(segundos)} s`;
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return resto === 0 ? `${numero(minutos)} min` : `${numero(minutos)} min ${numero(resto)} s`;
}

/**
 * La indicación de un bloque «En vueltas», en una línea: «Alterná estos 2 ejercicios · 3 vueltas · descansá 90 s al
 * terminar cada vuelta». Sin descanso indicado, no se dice nada de él; con cero, «sin pausa al terminar cada vuelta».
 */
export function indicacionDeVueltas(g: BloqueParaLeer, ejercicios: number): string {
  const partes = [ejercicios === 1 ? 'Alterná este ejercicio' : `Alterná estos ${numero(ejercicios)} ejercicios`];
  if (typeof g.rounds === 'number') partes.push(g.rounds === 1 ? '1 vuelta' : `${numero(g.rounds)} vueltas`);
  if (typeof g.restAfterRoundSeconds === 'number') {
    partes.push(g.restAfterRoundSeconds === 0 ? 'sin pausa al terminar cada vuelta' : `descansá ${descansoEnPalabras(g.restAfterRoundSeconds)} al terminar cada vuelta`);
  }
  return partes.join(' · ');
}

/** «Bloque · En vueltas · 3 vueltas» o «Bloque · Seguido»: lo que se dice de un bloque en un renglón. */
export function resumenDelBloque(g: BloqueParaLeer): string {
  if (g.kind !== 'ROUNDS') return COPY_BLOQUES_DE_LA_SESION.tipo.SEQUENTIAL;
  return [COPY_BLOQUES_DE_LA_SESION.tipo.ROUNDS, ...(typeof g.rounds === 'number' ? [g.rounds === 1 ? '1 vuelta' : `${numero(g.rounds)} vueltas`] : [])].join(' · ');
}

/** El nombre de un bloque para mostrar: el suyo o «Bloque N». */
export const nombreDelBloqueDeLaSesion = (g: { readonly label: string }, n: number): string => g.label.trim() || `${COPY_BLOQUES_DE_LA_SESION.bloque} ${numero(n + 1)}`;

/** Un bloque nuevo, como lo arma el editor: «Seguido», con el nombre que le toca. */
export function bloqueNuevo(s: SesionConBloques<ConBloque, { readonly groupId: string }>): BloqueDeLaSesionEntrada {
  const n = (s.exerciseGroups?.length ?? 0) + 1;
  return { groupId: nuevoIdDeBloque(s), label: `${COPY_BLOQUES_DE_LA_SESION.bloque} ${numero(n)}`, kind: 'SEQUENTIAL' };
}

/** Las vueltas con las que nace un bloque que pasa a «En vueltas». */
export const VUELTAS_POR_OMISION = 3;

/** Los textos de DL-181. Describen, no califican. */
export const COPY_BLOQUES_DE_LA_SESION = {
  bloque: 'Bloque',
  bloques: 'Bloques',
  tipo: { SEQUENTIAL: 'Seguido', ROUNDS: 'En vueltas' } satisfies Record<TipoDeBloque, string>,
  tipoDelBloque: 'Cómo se hacen',
  vueltas: 'Vueltas',
  descansoAlTerminarLaVuelta: 'Descanso al terminar cada vuelta',
  descansoAyuda: 'Como 01:30, o en segundos. Vacío: sin indicar.',
  queEs: 'Un bloque agrupa ejercicios de la sesión con un título, como Torso, Pierna o Core.',
  ayudaSeguido: '«Seguido»: los ejercicios se hacen de a uno, como siempre. El bloque les pone un título.',
  ayudaEnVueltas:
    '«En vueltas»: se alternan dos o más ejercicios. Por ejemplo, 3 vueltas de sentadilla y remo: sentadilla, remo y el descanso; otra vez; y una tercera. Cada vuelta es una serie de cada ejercicio.',
  laAppAnterior: 'Con una versión anterior de BE, la persona ve los mismos ejercicios en orden, sin el bloque.',
  sinEjercicios: 'Este bloque todavía no tiene ejercicios.',
  enVueltasPideDos: 'Un bloque «En vueltas» alterna dos ejercicios o más.',
  agregarBloque: 'Agregar bloque',
  agregarEjerciciosAlBloque: (nombre: string) => `Agregar ejercicios a ${nombre}`,
  quitarBloque: 'Quitar el bloque',
  quitarBloqueDetalle: 'Sus ejercicios quedan en la sesión, sueltos.',
  cambiarNombre: 'Cambiar el nombre',
  subirBloque: 'Subir el bloque',
  bajarBloque: 'Bajar el bloque',
  moverAlBloque: (nombre: string) => `Pasar a ${nombre}`,
  sacarDelBloque: 'Sacar del bloque',
  nombreDelBloque: 'Nombre del bloque',
  seriesYVueltas: (vueltas: number, series: number) =>
    `va en ${vueltas === 1 ? '1 vuelta' : `${numero(vueltas)} vueltas`} y tiene ${series === 1 ? '1 serie efectiva' : `${numero(series)} series efectivas`}`,
  igualadas: (vueltas: number) => `Cada ejercicio del bloque quedó con ${vueltas === 1 ? '1 serie efectiva' : `${numero(vueltas)} series efectivas`}, una por vuelta.`,
} as const;

/** Los textos de los problemas de los bloques, para el editor (lo que sigue al lugar: «Sesión A → Bloque Torso: …»). */
export const PROBLEMA_DE_BLOQUES: Readonly<Record<string, string>> = {
  [B.EXERCISE_GROUP_UNKNOWN]: 'el ejercicio nombra un bloque que la sesión no tiene',
  [B.EXERCISE_GROUP_NOT_CONTIGUOUS]: 'los ejercicios de un bloque van seguidos, sin otros en el medio',
  [B.EXERCISE_GROUP_EMPTY]: 'no tiene ejercicios',
  [B.ROUNDS_GROUP_NEEDS_TWO_EXERCISES]: 'un bloque «En vueltas» alterna dos ejercicios o más',
};
