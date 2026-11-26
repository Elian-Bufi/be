/**
 * ET2-D18 (ratificada el 2026-11-26 con un matiz) · el 1RM de las cargas en % RM, del borrador a la versión activa.
 *
 * - **En preparación (borrador),** las cargas en % RM siguen al 1RM: si cambia, se recalculan todas las del borrador, también
 *   las de los ejercicios plegados, en un solo cambio que se puede deshacer (`cargasConElUnoRM`).
 * - **Al activar, el 1RM queda congelado en la versión:** cada ejercicio en % RM guarda el 1RM con el que se calcularon sus
 *   cargas, con su origen, su fecha y el día de la activación (`unoRMDeLaActivacion`, que usa la API en API-TRN-12). Un 1RM
 *   posterior no cambia las cargas de la versión activa ni su vista.
 * - **La versión siguiente** parte de la activa con ese 1RM: el editor lo compara con el vigente y, si difiere, recalcula y
 *   avisa (`cambiosDesdeLaActivacion`).
 * Sin React, sin base y sin red.
 */
import type { PlanificacionDelPlan, RedondeoDeLasCargas, UnoRMDeLaActivacion } from './contratos-entrenamiento';
import { diaDeLaEstimacion } from './estimacion-de-fuerza';
import { numero } from './formato-numeros';
import type { Implemento } from './planificacion-del-plan';
import { cargaAtadaAlPorcentaje, type CargaDelUnoRM, type UnoRMVigente } from './repeticion-maxima';

/** Lo que hace falta de una prescripción: su ejercicio, su criterio con el %, su carga común y su base de carga. */
export interface PrescripcionConElUnoRM {
  readonly prescriptionId?: string | null;
  readonly exerciseVersionId: string;
  readonly intensity?: { readonly criterion: string; readonly target: { readonly value: number } } | null;
  readonly suggestedLoad?: CargaDelUnoRM | null;
  readonly loadBasis?: string | null;
}

interface SesionConElUnoRM<P> {
  readonly prescriptions: readonly P[];
}
interface BloqueConElUnoRM<P> {
  readonly sessions?: readonly SesionConElUnoRM<P>[] | null;
  readonly microcycles?: readonly { readonly sessions: readonly SesionConElUnoRM<P>[] }[] | null;
}

const prescripcionesDe = <P>(bloques: readonly BloqueConElUnoRM<P>[]): P[] =>
  bloques.flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)]).flatMap((s) => [...s.prescriptions]);

/** El % RM de una prescripción, si es su criterio y está escrito. */
export const porcentajeDeLaPrescripcion = (p: PrescripcionConElUnoRM): number | null =>
  p.intensity && p.intensity.criterion === 'PERCENT_RM' && Number.isFinite(p.intensity.target.value) && p.intensity.target.value > 0 ? p.intensity.target.value : null;

/**
 * Al activar (API-TRN-12): el 1RM vigente de cada ejercicio en % RM, congelado con su origen, su fecha y el día de la
 * activación. Sin 1RM, el ejercicio no lleva nada (su carga se escribió aparte).
 */
export function unoRMDeLaActivacion(
  bloques: readonly BloqueConElUnoRM<PrescripcionConElUnoRM>[],
  ejercicioDe: (exerciseVersionId: string) => string | null,
  vigentes: ReadonlyMap<string, UnoRMVigente | null>,
  activadaEl: string,
): UnoRMDeLaActivacion[] {
  return prescripcionesDe(bloques).flatMap((p) => {
    const exerciseId = ejercicioDe(p.exerciseVersionId);
    const vigente = exerciseId ? (vigentes.get(exerciseId) ?? null) : null;
    if (!p.prescriptionId || !exerciseId || !vigente || porcentajeDeLaPrescripcion(p) === null || !(vigente.valor.value > 0)) return [];
    return [{ prescriptionId: p.prescriptionId, exerciseId, value: { value: vigente.valor.value, unit: vigente.valor.unit }, origin: vigente.origen, localDate: vigente.fecha, activatedOn: activadaEl }];
  });
}

/** La planificación con el 1RM congelado (o sin el campo, si no hay ninguno). */
export function conElUnoRMDeLaActivacion(planificacion: PlanificacionDelPlan | null | undefined, congelados: readonly UnoRMDeLaActivacion[]): PlanificacionDelPlan | null {
  const { oneRepMaxAtActivation: _antes, ...resto } = planificacion ?? { startDate: null, weeks: null, phases: [] };
  if (congelados.length === 0) return planificacion ? resto : null;
  return { ...resto, oneRepMaxAtActivation: [...congelados] };
}

/** La planificación de un borrador sin el 1RM de la activación anterior: ya se comparó y no vale para este borrador. */
export function sinElUnoRMDeLaActivacion(planificacion: PlanificacionDelPlan): PlanificacionDelPlan {
  const { oneRepMaxAtActivation: _antes, ...resto } = planificacion;
  return resto;
}

/**
 * En el borrador: las cargas comunes de todos los ejercicios en % RM con el 1RM de cada uno (los plegados también). Las
 * aproximaciones y las cargas propias de cada serie no cambian. Devuelve las prescripciones nuevas y cuántas cargas cambiaron.
 */
export function cargasConElUnoRM<P extends PrescripcionConElUnoRM, B extends BloqueConElUnoRM<P>>(
  bloques: readonly B[],
  unoRMDe: (p: P) => CargaDelUnoRM | null,
  implementoDe: (p: P) => Implemento,
  redondeoDe: (p: P) => RedondeoDeLasCargas,
): { readonly bloques: B[]; readonly cuantas: number } {
  let cuantas = 0;
  const ejercicio = (p: P): P => {
    const pct = porcentajeDeLaPrescripcion(p);
    const unoRM = pct === null ? null : unoRMDe(p);
    if (pct === null || !unoRM || pct > 100) return p;
    const unidad = p.suggestedLoad?.unit ?? unoRM.unit;
    if (unidad !== unoRM.unit) return p;
    const carga = cargaAtadaAlPorcentaje(pct, unoRM, implementoDe(p), redondeoDe(p));
    if (p.suggestedLoad && p.suggestedLoad.value === carga.value && p.suggestedLoad.unit === carga.unit) return p;
    cuantas += 1;
    return { ...p, suggestedLoad: carga };
  };
  const sesion = <S extends SesionConElUnoRM<P>>(s: S): S => ({ ...s, prescriptions: s.prescriptions.map(ejercicio) });
  const nuevos = bloques.map((b) => ({
    ...b,
    ...(b.sessions ? { sessions: b.sessions.map(sesion) } : {}),
    ...(b.microcycles ? { microcycles: b.microcycles.map((m) => ({ ...m, sessions: m.sessions.map(sesion) })) } : {}),
  })) as B[];
  return { bloques: nuevos, cuantas };
}

/** Un 1RM que cambió desde la activación de la versión de la que parte el borrador. */
export interface CambioDelUnoRM {
  readonly exerciseId: string;
  readonly antes: CargaDelUnoRM;
  readonly despues: CargaDelUnoRM;
}

/** Los 1RM congelados en la versión anterior que hoy son otros (en la misma unidad), uno por ejercicio. */
export function cambiosDesdeLaActivacion(congelados: readonly UnoRMDeLaActivacion[] | null | undefined, vigentes: ReadonlyMap<string, UnoRMVigente | null>): CambioDelUnoRM[] {
  const vistos = new Set<string>();
  return (congelados ?? []).flatMap((u) => {
    const v = vigentes.get(u.exerciseId) ?? null;
    if (vistos.has(u.exerciseId) || !v || v.valor.unit !== u.value.unit || v.valor.value === u.value.value) return [];
    vistos.add(u.exerciseId);
    return [{ exerciseId: u.exerciseId, antes: u.value, despues: v.valor }];
  });
}

const enKilos = (c: CargaDelUnoRM): string => `${numero(c.value, 2)} ${c.unit}`;

/** «1RM 101,5 kg · el de la activación (26 nov)»: lo que muestra la versión activa. */
export const unoRMDeLaActivacionEnUnRenglon = (u: UnoRMDeLaActivacion): string => `1RM ${enKilos(u.value)} · el de la activación (${diaDeLaEstimacion(u.activatedOn)})`;

export const COPY_UNO_RM_DE_LA_ACTIVACION = {
  /** Borrador: el 1RM cambió y se recalcularon las cargas (también las de los plegados). */
  recalculadas: (n: number): string => (n === 1 ? 'Se recalculó 1 carga con el 1RM nuevo.' : `Se recalcularon ${n} cargas con el 1RM nuevo.`),
  /** Versión nueva: el 1RM de un ejercicio no es el de la activación anterior. */
  cambio: (nombre: string, c: CambioDelUnoRM): string =>
    c.antes.unit === c.despues.unit
      ? `El 1RM de ${nombre} cambió de ${numero(c.antes.value, 2)} a ${enKilos(c.despues)}: las cargas se recalcularon.`
      : `El 1RM de ${nombre} cambió de ${enKilos(c.antes)} a ${enKilos(c.despues)}: las cargas se recalcularon.`,
  varios: (n: number): string => `Cambió el 1RM de ${n} ejercicios desde la activación anterior: las cargas se recalcularon.`,
} as const;
