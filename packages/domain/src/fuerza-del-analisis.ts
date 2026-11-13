/**
 * ED-74 (WP-EDITORES-PROFESIONAL; DL-171) · La estimación de fuerza por ejercicio en «Analizar», la derivación de la clave
 * `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE` de API-PRJ-01. Se calcula al leer, con la especificación `BE-E1RM` v1
 * (`EPLEY_V1`), desde:
 * - **el registro vigente de cada sesión** (la corrección vigente o el original): solo las series que escribió la
 *   persona, con la procedencia de cada valor (ED-70). Una sesión no realizada, resumida o con una cadena de correcciones
 *   que no se resuelve no aporta series;
 * - **las observaciones del profesional** (ED-72), que ya se guardaron con su estimación.
 *
 * La regla por sesión sigue al interruptor «Incluir las de más de 10 a 12» (DL-171, ratificada el 2026-11-12): apagado,
 * elige entre las series de hasta 10 repeticiones equivalentes, y una sesión que solo tiene orientativas queda sin
 * punto; encendido, entre todas las de hasta 12. Las observaciones siguen el mismo interruptor. Nunca se calcula desde la
 * prescripción, nunca se convierte entre kg y lb y nunca se toca la clave de las marcas. Sin base ni red.
 */
import type { ResumenDeActorSchema } from './contratos-vinculo';
import type { z } from 'zod';
import type { EjecucionDeEntrenamiento } from './contratos-entrenamiento';
import type { ResultadoDeEstimacionDeFuerza, VigenciaDePlan } from './contratos-analisis';
import type { BandaDeLaEstimacionApi, EstimacionDeFuerzaApi, PuntoDeFuerza, SerieQueNoEntroSchema } from './contratos-fuerza';
import { registroVigente } from './copy-entrenamiento';
import { sesionesDelPlan, type ContenidoDePlanDeEntrenamiento } from './plan-de-entrenamiento';
import {
  EJERCICIOS_DE_LA_ESTIMACION_V1,
  entraEnLaEstimacion,
  estimarLaSerie,
  seriesElegidasDeLaSesion,
  type BandaDeLaEstimacion,
  type EstimacionDeFuerza,
  type SerieParaEstimar,
} from './estimacion-de-fuerza';

type Actor = z.infer<typeof ResumenDeActorSchema>;

/** Cómo se cuenta la carga y las repeticiones de cada prescripción de una versión del plan (DL-122), por `prescriptionId`. */
export type BasesDeLaVersion = ReadonlyMap<string, { readonly loadBasis?: SerieParaEstimar['loadBasis']; readonly repetitionBasis?: SerieParaEstimar['repetitionBasis'] }>;

/** Las bases de la carga y de las repeticiones de cada prescripción del contenido de una versión (su instantánea). */
export function basesDelPlan(contenido: ContenidoDePlanDeEntrenamiento): BasesDeLaVersion {
  const bases = new Map<string, { loadBasis?: SerieParaEstimar['loadBasis']; repetitionBasis?: SerieParaEstimar['repetitionBasis'] }>();
  for (const { sesion } of sesionesDelPlan(contenido)) for (const p of sesion.prescriptions) bases.set(p.prescriptionId, { loadBasis: p.loadBasis ?? null, repetitionBasis: p.repetitionBasis ?? null });
  return bases;
}

/** Una observación vigente del profesional (ED-72), como la lee la API. */
export interface ObservacionParaElAnalisis {
  readonly observationId: string;
  readonly exerciseId: string;
  readonly localDate: string;
  readonly estimate: EstimacionDeFuerzaApi;
  readonly observedBy: Actor;
}

export interface EntradaDeLaEstimacionDelPeriodo {
  readonly ejecuciones: readonly EjecucionDeEntrenamiento[];
  /** Por versión del plan (`planId` de la ejecución). Una versión que falta deja las bases sin declarar. */
  readonly bases: ReadonlyMap<string, BasesDeLaVersion>;
  readonly observaciones: readonly ObservacionParaElAnalisis[];
  /** La persona, con el nombre con el que la ve este profesional: quien escribió las series de la app. */
  readonly persona: Actor;
  readonly exerciseId: string | null;
  readonly unidad: 'kg' | 'lb' | null;
  readonly incluirOrientativas: boolean;
  readonly otrosProfesionales: boolean;
  readonly vigencias: readonly VigenciaDePlan[];
}

const BANDA_API: Readonly<Record<BandaDeLaEstimacion, BandaDeLaEstimacionApi>> = { NUCLEO: 'CORE', ORIENTATIVA: 'ORIENTATIVE' };

/** Un valor del método en la forma de la API (la misma que guarda la observación, ED-72). */
export function estimacionApi(e: EstimacionDeFuerza): EstimacionDeFuerzaApi {
  return {
    specification: e.especificacion,
    version: e.version,
    method: e.metodo,
    band: BANDA_API[e.banda],
    load: { value: e.carga, unit: e.unidad },
    completedRepetitions: e.repeticiones,
    rir: e.rir,
    equivalentRepetitions: e.repeticionesEquivalentes,
    value: e.valor,
  };
}

interface SeriesDeLaSesion {
  readonly ejecucion: EjecucionDeEntrenamiento;
  readonly exerciseId: string;
  /** Dónde está cada serie del registro: su prescripción y su número, en el mismo orden que `series`. */
  readonly ubicaciones: readonly { readonly prescriptionId: string; readonly setIndex: number }[];
  readonly series: readonly SerieParaEstimar[];
}

/**
 * Las series de los ejercicios de la lista en el registro vigente de cada sesión, con lo que necesita el método: un
 * grupo por ejercicio y ejecución. Una sesión puede tener dos prescripciones del mismo ejercicio (una principal y una
 * descarga): sus series se juntan, en orden de prescripción y de serie, antes de elegir, porque la regla por sesión de
 * DL-171 da un punto por ejercicio, ejecución y unidad, no por prescripción.
 */
export function seriesDeLasSesiones(ejecuciones: readonly EjecucionDeEntrenamiento[], bases: ReadonlyMap<string, BasesDeLaVersion>): SeriesDeLaSesion[] {
  const resultado: SeriesDeLaSesion[] = [];
  for (const x of ejecuciones) {
    if (x.effectiveView.kind === 'NOT_RESOLVABLE') continue;
    const r = registroVigente(x);
    if (r.sessionCondition === 'NOT_COMPLETED' || r.granularity !== 'SET') continue;
    const porEjercicio = new Map<string, { ubicaciones: { prescriptionId: string; setIndex: number }[]; series: SerieParaEstimar[] }>();
    const registrados = r.exercises
      .map((e) => ({ e, prescripcion: x.plannedSession.prescriptions.find((p) => p.prescriptionId === e.prescriptionId) }))
      .sort((a, b) => (a.prescripcion?.order ?? 0) - (b.prescripcion?.order ?? 0));
    for (const { e, prescripcion } of registrados) {
      if (!prescripcion || !e.sets || e.sets.length === 0 || !entraEnLaEstimacion(prescripcion.exerciseId)) continue;
      const base = bases.get(x.planId)?.get(e.prescriptionId);
      const grupo = porEjercicio.get(prescripcion.exerciseId) ?? { ubicaciones: [], series: [] };
      porEjercicio.set(prescripcion.exerciseId, grupo);
      grupo.ubicaciones.push(...e.sets.map((s) => ({ prescriptionId: e.prescriptionId, setIndex: s.setIndex })));
      grupo.series.push(
        ...e.sets.map((s) => ({
          exerciseId: prescripcion.exerciseId,
          fuente: 'PERSONA' as const,
          ...(s.recordedAs ? { recordedAs: s.recordedAs } : {}),
          ...(s.fieldOrigins ? { fieldOrigins: s.fieldOrigins } : {}),
          load: s.load,
          loadBasis: base?.loadBasis ?? null,
          completedRepetitions: s.completedRepetitions,
          repetitionBasis: base?.repetitionBasis ?? null,
          rir: s.rir,
          sustituido: e.substituted,
          fechaCivil: x.date,
        })),
      );
    }
    for (const [exerciseId, grupo] of porEjercicio) resultado.push({ ejecucion: x, exerciseId, ...grupo });
  }
  return resultado;
}

const porFecha = (a: PuntoDeFuerza, b: PuntoDeFuerza): number => a.date.localeCompare(b.date) || a.pointId.localeCompare(b.pointId);

/** La derivación completa de la clave: los ejercicios del período y, si se pidió uno, su línea en una unidad. */
export function estimacionDeFuerzaDelPeriodo(d: EntradaDeLaEstimacionDelPeriodo): ResultadoDeEstimacionDeFuerza {
  const sesiones = seriesDeLasSesiones(d.ejecuciones, d.bases);
  const exercises = EJERCICIOS_DE_LA_ESTIMACION_V1.flatMap((ej) => {
    const deSesiones = sesiones.filter((s) => s.exerciseId === ej.exerciseId);
    const observaciones = d.observaciones.filter((o) => o.exerciseId === ej.exerciseId);
    if (deSesiones.length === 0 && observaciones.length === 0) return [];
    const unidades = new Set<'kg' | 'lb'>();
    for (const s of deSesiones) for (const elegida of seriesElegidasDeLaSesion(s.series, { incluirOrientativas: true })) unidades.add(elegida.unidad);
    for (const o of observaciones) unidades.add(o.estimate.load.unit);
    return [
      {
        exerciseId: ej.exerciseId,
        name: ej.nombre,
        sessions: new Set(deSesiones.map((s) => s.ejecucion.executionId)).size,
        observations: observaciones.length,
        units: (['kg', 'lb'] as const).filter((u) => unidades.has(u)),
      },
    ];
  });
  if (!d.exerciseId) return { kind: 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE', exercises, estimate: null, otherProfessionalRecords: d.otrosProfesionales, planVersions: [...d.vigencias] };

  const exerciseId = d.exerciseId;
  const unit = d.unidad ?? exercises.find((e) => e.exerciseId === exerciseId)?.units[0] ?? 'kg';
  const points: PuntoDeFuerza[] = [];
  const notIncluded: z.infer<typeof SerieQueNoEntroSchema>[] = [];
  for (const s of sesiones.filter((x) => x.exerciseId === exerciseId)) {
    const x = s.ejecucion;
    s.series.forEach((serie, i) => {
      const r = estimarLaSerie(serie);
      const donde = s.ubicaciones[i]!;
      if (!r.entra) notIncluded.push({ executionId: x.executionId, date: x.date, prescriptionId: donde.prescriptionId, setIndex: donde.setIndex, reason: r.motivo, fields: [...(r.campos ?? [])] });
    });
    for (const elegida of seriesElegidasDeLaSesion(s.series, { incluirOrientativas: d.incluirOrientativas })) {
      if (elegida.unidad !== unit) continue;
      const { prescriptionId, setIndex } = s.ubicaciones[elegida.posicion]!;
      points.push({
        pointId: `x:${x.executionId}:${prescriptionId}:${setIndex}`,
        date: x.date,
        source: 'PERSON',
        origin: { type: 'TRAINING_EXECUTION', id: x.executionId, prescriptionId, setIndex, corrected: x.effectiveView.kind === 'CORRECTED' },
        writtenBy: d.persona,
        estimate: estimacionApi(elegida.estimacion),
      });
    }
  }
  for (const o of d.observaciones) {
    if (o.exerciseId !== exerciseId || o.estimate.load.unit !== unit) continue;
    if (!d.incluirOrientativas && o.estimate.band === 'ORIENTATIVE') continue;
    points.push({ pointId: `o:${o.observationId}`, date: o.localDate, source: 'OBSERVED', origin: { type: 'STRENGTH_OBSERVATION', id: o.observationId }, writtenBy: o.observedBy, estimate: o.estimate });
  }
  return {
    kind: 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE',
    exercises,
    estimate: { exerciseId, unit, includeOrientative: d.incluirOrientativas, points: points.sort(porFecha), notIncluded },
    otherProfessionalRecords: d.otrosProfesionales,
    planVersions: [...d.vigencias],
  };
}
