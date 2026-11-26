/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO) · el plan y sus fases en el editor, sin React, para probarlo solo
 * (`apps/web/test/editor-de-entrenamiento.test.mjs`). Lo de fechas y semanas es del dominio (`planificacion-del-plan.ts`);
 * acá, lo que cambia el editor:
 * - **El nombre de una fase nueva** (E6): el primer «Fase N» libre después de las que hay. Antes se numeraba por la
 *   cantidad: con tres fases y la segunda quitada, la nueva repetía «Fase 3».
 * - **Copiar la fase anterior** (EE-02, E19): la fase con sus sesiones, ejercicios y series, con identificadores nuevos,
 *   sus semanas, sus aproximaciones y los días de sus sesiones. Las anotaciones privadas de la fase no se copian.
 * - **Lo que se escribe del plan y de cada fase**: inicio, semanas o fin, objetivo y anotaciones.
 */
import {
  COPY_ENTRENAMIENTO,
  nombreDeLaFase,
  PLANIFICACION_VACIA,
  reglasPropiasParaLaCopia,
  semanasHasta,
  type AgendaDeEntrenamiento,
  type AproximacionesDelEjercicio,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type PlanificacionDelPlan,
} from '@be/domain';

type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];
type Bloque = Bloques[number];
type Sesion = NonNullable<Bloque['sessions']>[number];

/** El nombre de una fase nueva: «Fase N», con N el primero libre desde la cantidad de fases más uno. */
export function nombreDeFaseNueva(bloques: readonly { readonly label: string }[]): string {
  const usados = new Set(bloques.map((b, n) => nombreDeLaFase(b.label, n).trim().toLowerCase()));
  let n = bloques.length + 1;
  while (usados.has(`${COPY_ENTRENAMIENTO.bloque} ${n}`.toLowerCase())) n += 1;
  return `${COPY_ENTRENAMIENTO.bloque} ${n}`;
}

/** La planificación para editar: la guardada, o una vacía. */
export const planificacionParaEditar = (p: PlanificacionDelPlan | null | undefined): PlanificacionDelPlan => p ?? PLANIFICACION_VACIA;

export const conInicio = (p: PlanificacionDelPlan, fecha: string | null): PlanificacionDelPlan => ({ ...p, startDate: fecha || null });
export const conSemanasDelPlan = (p: PlanificacionDelPlan, semanas: number | null): PlanificacionDelPlan => ({ ...p, weeks: semanas });
/** EE-D01: escribir el fin cambia la duración (en semanas, contando la última aunque esté incompleta). */
export const conFin = (p: PlanificacionDelPlan, fin: string): PlanificacionDelPlan => (p.startDate ? { ...p, weeks: semanasHasta(p.startDate, fin) } : p);
export const conObjetivo = (p: PlanificacionDelPlan, texto: string | null): PlanificacionDelPlan => ({ ...p, goal: texto && texto.trim() ? texto : null });

const notas = (p: PlanificacionDelPlan) => p.privateNotes ?? { plan: null, phases: [] };
export const conAnotacionesDelPlan = (p: PlanificacionDelPlan, texto: string | null): PlanificacionDelPlan => ({ ...p, privateNotes: { ...notas(p), plan: texto && texto.trim() ? texto : null } });

/** Las semanas de una fase (`null`: sin escribir). */
export function conSemanasDeLaFase(p: PlanificacionDelPlan, blockId: string, semanas: number | null): PlanificacionDelPlan {
  const resto = p.phases.filter((f) => f.blockId !== blockId);
  return { ...p, phases: [...resto, { blockId, weeks: semanas }] };
}

export const anotacionesDeLaFase = (p: PlanificacionDelPlan, blockId: string | null | undefined): string | null => (blockId ? (notas(p).phases.find((n) => n.blockId === blockId)?.text ?? null) : null);

export function conAnotacionesDeLaFase(p: PlanificacionDelPlan, blockId: string, texto: string | null): PlanificacionDelPlan {
  const n = notas(p);
  const resto = n.phases.filter((x) => x.blockId !== blockId);
  return { ...p, privateNotes: { ...n, phases: texto && texto.trim() ? [...resto, { blockId, text: texto }] : resto } };
}

/** Cómo se armaron las aproximaciones de un ejercicio, si se dijo. */
export const aproximacionesDe = (p: PlanificacionDelPlan, prescriptionId: string | null | undefined): AproximacionesDelEjercicio | null =>
  (prescriptionId ? (p.warmUps ?? []).find((w) => w.prescriptionId === prescriptionId) : undefined) ?? null;

export function conAproximaciones(p: PlanificacionDelPlan, a: AproximacionesDelEjercicio): PlanificacionDelPlan {
  return { ...p, warmUps: [...(p.warmUps ?? []).filter((w) => w.prescriptionId !== a.prescriptionId), a] };
}

export interface FaseCopiada {
  readonly bloque: Bloque;
  /** Los identificadores de antes y los de la copia, de las sesiones y de los ejercicios. */
  readonly sesiones: ReadonlyMap<string, string>;
  readonly prescripciones: ReadonlyMap<string, string>;
}

/**
 * EE-02 (E19): la copia de una fase, con identificadores nuevos para todo lo que los lleva (la fase, sus microciclos, sus
 * sesiones, sus ejercicios y sus bloques de la sesión): una ejecución registrada contra la original no se confunde con
 * la copia. Lo demás, igual.
 */
export function copiarLaFase(bloque: Bloque, nombre: string, nuevoId: () => string): FaseCopiada {
  const sesiones = new Map<string, string>();
  const prescripciones = new Map<string, string>();
  const copiarSesion = (s: Sesion): Sesion => {
    const sessionId = nuevoId();
    if (s.sessionId) sesiones.set(s.sessionId, sessionId);
    const grupos = new Map((s.exerciseGroups ?? []).map((g) => [g.groupId, nuevoId()] as const));
    return {
      ...structuredClone(s),
      sessionId,
      prescriptions: s.prescriptions.map((p) => {
        const prescriptionId = nuevoId();
        if (p.prescriptionId) prescripciones.set(p.prescriptionId, prescriptionId);
        return { ...structuredClone(p), prescriptionId, ...(p.exerciseGroupId ? { exerciseGroupId: grupos.get(p.exerciseGroupId) ?? p.exerciseGroupId } : {}) };
      }),
      ...(s.exerciseGroups ? { exerciseGroups: s.exerciseGroups.map((g) => ({ ...g, groupId: grupos.get(g.groupId)! })) } : {}),
    };
  };
  const copia: Bloque = {
    ...structuredClone(bloque),
    blockId: nuevoId(),
    label: nombre,
    ...(bloque.sessions ? { sessions: bloque.sessions.map(copiarSesion) } : {}),
    ...(bloque.microcycles ? { microcycles: bloque.microcycles.map((m) => ({ ...structuredClone(m), microcycleId: nuevoId(), sessions: m.sessions.map(copiarSesion) })) } : {}),
  };
  return { bloque: copia, sesiones, prescripciones };
}

/**
 * La planificación con la copia: las mismas semanas que la original, sus aproximaciones y las progresiones propias de sus
 * ejercicios (DL-201), con los ejercicios nuevos.
 */
export function planificacionConLaCopia(p: PlanificacionDelPlan, original: string | null | undefined, copia: FaseCopiada): PlanificacionDelPlan {
  const semanas = original ? (p.phases.find((f) => f.blockId === original)?.weeks ?? null) : null;
  const conSemanas = conSemanasDeLaFase(p, copia.bloque.blockId!, semanas);
  const copiadas = (p.warmUps ?? []).flatMap((w) => {
    const nuevo = copia.prescripciones.get(w.prescriptionId);
    return nuevo ? [{ ...w, prescriptionId: nuevo }] : [];
  });
  const conAproximaciones = copiadas.length > 0 ? { ...conSemanas, warmUps: [...(conSemanas.warmUps ?? []), ...copiadas] } : conSemanas;
  // DL-201 (PE-D08): las reglas propias de los ejercicios van con sus copias; la de la fase se elige al copiar (E19).
  const propias = original ? reglasPropiasParaLaCopia(p, original, copia.bloque.blockId!, copia.prescripciones) : [];
  return propias.length > 0 ? { ...conAproximaciones, progressions: [...(conAproximaciones.progressions ?? []), ...propias] } : conAproximaciones;
}

/** La agenda con la copia: cada sesión copiada, los mismos días que su original. Los movimientos no se copian. */
export function agendaConLaCopia(agenda: AgendaDeEntrenamiento | null, copia: FaseCopiada): AgendaDeEntrenamiento | null {
  if (!agenda) return null;
  const nuevas = agenda.sessions.flatMap((s) => {
    const id = copia.sesiones.get(s.sessionId);
    return id ? [{ sessionId: id, weekdays: [...s.weekdays] }] : [];
  });
  return nuevas.length > 0 ? { ...agenda, sessions: [...agenda.sessions, ...nuevas] } : agenda;
}

/** Cuántos colores de fase hay (`--fase-1` a `--fase-6`, en `tokens.css`); después se repiten. */
export const COLORES_DE_FASE = 6;
/** El número de color de una fase por su posición: 1 a 6. */
export const colorDeLaFase = (posicion: number): number => (posicion % COLORES_DE_FASE) + 1;
