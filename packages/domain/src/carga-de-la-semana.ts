/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-05 y ET2-06) · la carga de cada semana, para la persona y para «Ver como
 * la persona». La progresión de una fase es una regla (EE-D30): la sesión guardada es la de la semana 1 y la regla dice
 * cómo cambia semana a semana (`progresiones.ts`). Hasta DL-198 la persona veía siempre la carga de la semana 1; desde
 * ahora, las lecturas del titular (API-TRN-09, API-TRN-14, el período y API-SER-02) entregan la de **esa** semana:
 *
 * - **La semana que rige:** la de la fecha dentro de su fase (la de la ocurrencia en la sesión para registrar; la de hoy
 *   en el detalle del plan). Antes de la fase, la primera; después, la última (ET2-D06).
 * - **Lo que cambia:** la carga de las series efectivas (lineal y doble: se corren lo mismo, así una pirámide sigue siendo
 *   pirámide; ondulante y descarga por carga: cada una por la misma parte, redondeada al paso), las repeticiones (lineal
 *   con repeticiones y doble) y, en una descarga por series, las últimas efectivas que se sacan. Las aproximaciones «Por
 *   porcentaje» se recalculan desde la carga de trabajo de esa semana; las escritas a mano quedan como están.
 * - **Sin cambiar la forma:** son los mismos campos con otros valores (ET2-D07). Un plan sin progresión, o en su semana 1,
 *   sale exactamente igual que antes.
 *
 * Sin React, sin base y sin red: lo usan la API y el website con la misma cuenta.
 */
import type { AproximacionesDelEjercicio, PlanificacionDelPlan, ProgresionDeLaFase } from './contratos-entrenamiento';
import { fechasDeLasFases, implementoDelEjercicio, pasoPorOmision, redondearAlPaso, aproximacionesAjustadas, type FaseEnElCalendario, type FaseParaPlanificar } from './planificacion-del-plan';
import { progresionDeLaFase, semanaDeLaFecha, semanasDelEjercicio, seAplicaA, type BaseDelEjercicio, type SemanaDeLaProgresion } from './progresiones';

type Unidad = 'kg' | 'lb';
type Carga = { readonly value: number; readonly unit: Unidad };
type Repeticiones = { readonly value: number } | { readonly min: number; readonly max: number };

/** Lo mínimo de una serie planificada: la guardada, la de entrada del editor y la de salida tienen esto. */
export interface SerieDeLaSemana {
  readonly repetitions?: Repeticiones | null;
  readonly suggestedLoad?: Carga | null;
  readonly setKind?: 'WORKING' | 'WARM_UP' | null;
}
/** Lo mínimo de una prescripción. */
export interface PrescripcionDeLaSemana<S extends SerieDeLaSemana = SerieDeLaSemana> {
  readonly prescriptionId?: string | null;
  readonly suggestedLoad?: Carga | null;
  readonly sets: readonly S[];
  readonly loadBasis?: string | null;
}

const esAproximacion = (s: SerieDeLaSemana): boolean => s.setKind === 'WARM_UP';
const valida = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/** La carga de trabajo: la común de las efectivas; si no hay, la de la primera efectiva que tenga una (EE-D05). */
export function cargaDeTrabajoDe(p: PrescripcionDeLaSemana): Carga | null {
  if (p.suggestedLoad && valida(p.suggestedLoad.value)) return p.suggestedLoad;
  const deUna = p.sets.find((s) => !esAproximacion(s) && s.suggestedLoad && valida(s.suggestedLoad.value))?.suggestedLoad;
  return deUna ?? null;
}

/** Lo que la regla necesita de un ejercicio (como `baseDelEjercicio` del editor). */
export function baseDeLaPrescripcion(p: PrescripcionDeLaSemana, nombre: string, aproximaciones: AproximacionesDelEjercicio | null): BaseDelEjercicio {
  const carga = cargaDeTrabajoDe(p);
  const unidad: Unidad = carga?.unit ?? p.sets.find((s) => s.suggestedLoad)?.suggestedLoad?.unit ?? 'kg';
  const r = p.sets.find((s) => !esAproximacion(s) && s.repetitions)?.repetitions ?? null;
  return {
    carga: carga?.value ?? null,
    unidad,
    repeticiones: r ? ('value' in r ? r.value : r.min) : null,
    series: p.sets.filter((s) => !esAproximacion(s)).length,
    paso: aproximaciones?.step ?? pasoPorOmision(implementoDelEjercicio(nombre, p.loadBasis ?? null), carga?.value ?? null, unidad),
  };
}

/** La semana que rige para una fecha en una fase con fechas: dentro, la suya; antes, la primera; después, la última. */
export function semanaQueRige(fase: FaseEnElCalendario, fecha: string): number {
  // Una fase cortada por el fin del plan (ET1-D03) termina antes: su última semana es la última que entra.
  const ultima = Math.max(1, fase.semanas - (fase.semanasFuera ?? 0));
  const dentro = semanaDeLaFecha(fase, fecha);
  if (dentro !== null) return Math.min(dentro, ultima);
  return fecha < fase.desde ? 1 : ultima;
}

/** Una fase con su progresión y la semana que rige. `null`: la fase no tiene fechas, o no tiene progresión. */
export interface SemanaDeLaFase {
  readonly progresion: ProgresionDeLaFase;
  readonly semana: number;
  readonly semanas: number;
  /**
   * Las semanas de la fase que entran en el plan: en una fase cortada por su fin (ET1-D03), menos que `semanas`. Es la «M»
   * del rótulo «Semana N de M» que ve la persona, que nunca llega a las de afuera. Ausente: todas (`semanas`).
   */
  readonly semanasQueEntran?: number;
}

/** La semana de la fase `blockId` en esa fecha, con su progresión, si la tiene. */
export function semanaDeLaFase(planificacion: PlanificacionDelPlan | null | undefined, fases: readonly FaseParaPlanificar[], blockId: string, fecha: string): SemanaDeLaFase | null {
  const progresion = progresionDeLaFase(planificacion, blockId);
  if (!progresion) return null;
  const fase = fechasDeLasFases(planificacion, fases).find((f) => f?.blockId === blockId) ?? null;
  if (!fase) return null;
  // Una fase cortada por el fin del plan (ET1-D03) tiene sus semanas enteras para la regla: la descarga sigue en la suya.
  return { progresion, semana: semanaQueRige(fase, fecha), semanas: fase.semanas, semanasQueEntran: Math.max(1, fase.semanas - (fase.semanasFuera ?? 0)) };
}

const conCarga = <S extends SerieDeLaSemana>(s: S, carga: Carga | null): S => ({ ...s, suggestedLoad: carga });

/**
 * La prescripción en la semana `semana` de su fase, con la regla aplicada. La semana 1 sin cambios (o una regla que no
 * la toca) devuelve la misma prescripción.
 */
export function prescripcionDeLaSemana<S extends SerieDeLaSemana, P extends PrescripcionDeLaSemana<S>>(
  p: P,
  s: SemanaDeLaFase,
  nombre: string,
  aproximaciones: AproximacionesDelEjercicio | null,
): P {
  if (!seAplicaA(s.progresion, p.prescriptionId)) return p;
  const base = baseDeLaPrescripcion(p, nombre, aproximaciones);
  const filas = semanasDelEjercicio(s.progresion, base, s.semanas);
  const fila: SemanaDeLaProgresion | undefined = filas[s.semana - 1];
  if (!fila) return p;
  const mismaCarga = fila.carga === base.carga;
  const mismasReps = fila.repeticiones === base.repeticiones;
  const mismasSeries = fila.series === base.series;
  if (mismaCarga && mismasReps && mismasSeries) return p;

  // Cómo se lleva la carga de trabajo a la de la semana: lo mismo (lineal y doble) o por la misma parte (ondulante y descarga).
  const porParte = s.progresion.model === 'UNDULATING' || (fila.descarga && s.progresion.deload?.mode === 'LOAD');
  const llevar = (c: Carga | null | undefined): Carga | null | undefined => {
    if (!c || mismaCarga || base.carga === null || fila.carga === null) return c;
    if (porParte) return { ...c, value: Math.max(base.paso, redondearAlPaso((c.value * fila.carga) / base.carga, base.paso)) };
    return { ...c, value: Math.max(0, Math.round((c.value + (fila.carga - base.carga)) * 100) / 100) };
  };

  // Las efectivas que quedan: en una descarga por series, se van las últimas (nunca todas: al menos una).
  const efectivas = p.sets.filter((x) => !esAproximacion(x)).length;
  const sacar = Math.max(0, efectivas - fila.series);
  let vistas = 0;
  const series: S[] = [];
  for (const x of p.sets) {
    if (esAproximacion(x)) {
      series.push(x);
      continue;
    }
    vistas += 1;
    if (vistas > efectivas - sacar) continue;
    let nueva: S = x;
    if (x.suggestedLoad) nueva = conCarga(nueva, llevar(x.suggestedLoad) ?? null);
    if (!mismasReps && fila.repeticiones !== null && x.repetitions) nueva = { ...nueva, repetitions: { value: fila.repeticiones } };
    series.push(nueva);
  }

  // Las aproximaciones «Por porcentaje», desde la carga de trabajo de la semana (EE-D05); a mano, quedan.
  const cargaDeLaSemana = llevar(cargaDeTrabajoDe(p));
  if (aproximaciones?.mode === 'FROM_WORKING_LOAD' && cargaDeLaSemana && !mismaCarga) {
    const { cargas } = aproximacionesAjustadas(cargaDeLaSemana.value, aproximaciones.workingLoadShares, aproximaciones.step);
    const indices = series.map((x, n) => (esAproximacion(x) ? n : -1)).filter((n) => n >= 0);
    // Solo si salen tantas como hay: si no, quedan las guardadas (no se inventa ni se borra una aproximación).
    if (cargas.length === indices.length) indices.forEach((n, k) => (series[n] = conCarga(series[n]!, { value: cargas[k]!, unit: cargaDeLaSemana.unit })));
  }

  return { ...p, ...(p.suggestedLoad ? { suggestedLoad: llevar(p.suggestedLoad) } : {}), sets: series };
}

/** Lo mínimo de una sesión y de un bloque para aplicar la semana. */
interface SesionMinima<P> {
  readonly sessionId?: string | null;
  readonly prescriptions: readonly P[];
}
interface BloqueMinimo<Ses> {
  readonly blockId: string;
  readonly sessions: readonly Ses[];
  readonly microcycles: readonly { readonly sessions: readonly Ses[] }[];
}

/** Las aproximaciones guardadas de una prescripción. */
const aproximacionesDe = (planificacion: PlanificacionDelPlan | null | undefined, prescriptionId: string | null | undefined): AproximacionesDelEjercicio | null =>
  (prescriptionId ? planificacion?.warmUps?.find((w) => w.prescriptionId === prescriptionId) : undefined) ?? null;

/** Una sesión en la semana que rige en esa fecha: cada prescripción con la regla de su fase. */
export function sesionDeLaSemana<S extends SerieDeLaSemana, P extends PrescripcionDeLaSemana<S>, Ses extends SesionMinima<P>>(
  sesion: Ses,
  semana: SemanaDeLaFase | null,
  planificacion: PlanificacionDelPlan | null | undefined,
  nombreDe: (p: P) => string,
): Ses {
  if (!semana) return sesion;
  return { ...sesion, prescriptions: sesion.prescriptions.map((p) => prescripcionDeLaSemana<S, P>(p, semana, nombreDe(p), aproximacionesDe(planificacion, p.prescriptionId))) };
}

/**
 * El contenido de una versión con cada sesión en la semana que rige en esa fecha (el detalle del plan del titular, con
 * la fecha de hoy). Sin planificación o sin progresiones, el mismo contenido.
 */
export function bloquesDeLaSemana<S extends SerieDeLaSemana, P extends PrescripcionDeLaSemana<S>, Ses extends SesionMinima<P>, B extends BloqueMinimo<Ses>>(
  bloques: readonly B[],
  planificacion: PlanificacionDelPlan | null | undefined,
  fecha: string,
  nombreDe: (p: P) => string,
): B[] {
  if (!planificacion?.progressions?.length) return [...bloques];
  return bloques.map((b) => {
    const semana = semanaDeLaFase(planificacion, bloques, b.blockId, fecha);
    if (!semana) return b;
    const llevar = (s: Ses): Ses => sesionDeLaSemana<S, P, Ses>(s, semana, planificacion, nombreDe);
    return { ...b, sessions: b.sessions.map(llevar), microcycles: b.microcycles.map((m) => ({ ...m, sessions: m.sessions.map(llevar) })) };
  });
}

/** «Semana 3 de 6 · descarga»: la semana de la fase, para «Ver como la persona» y la app. */
export function semanaEnPalabras(s: { readonly semana: number; readonly semanas: number; readonly descarga?: boolean }): string {
  return `Semana ${s.semana} de ${s.semanas}${s.descarga ? ' · descarga' : ''}`;
}

/** Si en esa semana toca la descarga. */
export const esSemanaDeDescarga = (s: SemanaDeLaFase): boolean => !!s.progresion.deload && s.progresion.deload.week === s.semana && s.progresion.deload.week <= s.semanas;
