/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-07; E9 y E17 de Dirección) · las series de aproximación de un ejercicio, sin React,
 * para probarlo solo (`apps/web/test/editor-de-entrenamiento.test.mjs`). La «C» de calentamiento pasa a llamarse
 * «Aproximación»: son las series (`setKind: WARM_UP`) que van antes de las efectivas, con menos carga.
 * - **«Por %»:** BE las calcula desde la carga de trabajo (la común de las efectivas) con los porcentajes, redondeadas al
 *   paso (1, 2,5, 5 o 10), con repeticiones que bajan (8, 5, 3). La base queda a la vista.
 * - **«A mano»:** el profesional escribe cada una en la tabla.
 * - Si las cargas de la tabla ya no son las que salen de los porcentajes (cambió la carga de trabajo o se tocó una), se
 *   dice, con «Recalcular»: nada se pisa solo.
 */
import {
  DESCANSO_DE_APROXIMACION,
  aproximacionesAjustadas,
  esDeCalentamiento,
  implementoDelEjercicio,
  pasoPorOmision,
  porcentajesPara,
  seriesDeAproximacion,
  type AproximacionesDelEjercicio,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type PasoDeRedondeo,
} from '@be/domain';

type Prescripcion = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number]['prescriptions'][number];
type Serie = Prescripcion['sets'][number];

export const PASOS_DE_REDONDEO: readonly PasoDeRedondeo[] = [1, 2.5, 5, 10];

/** La unidad de las cargas de la prescripción: la de su carga común, la de alguna serie, o kg. */
export const unidadDeLaPrescripcion = (p: Prescripcion): 'kg' | 'lb' => p.suggestedLoad?.unit ?? p.sets.find((x) => x.suggestedLoad)?.suggestedLoad?.unit ?? 'kg';

/** La carga de trabajo: la común de las efectivas; si no hay, la de la primera efectiva que tenga una. */
export function cargaDeTrabajo(p: Prescripcion): number | null {
  const valida = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
  if (valida(p.suggestedLoad?.value)) return p.suggestedLoad!.value;
  const deUna = p.sets.find((s) => !esDeCalentamiento(s) && valida(s.suggestedLoad?.value))?.suggestedLoad?.value;
  return valida(deUna) ? deUna : null;
}

export const cuantasAproximaciones = (p: Prescripcion): number => p.sets.filter(esDeCalentamiento).length;

/** Cómo se arman, para un ejercicio que todavía no lo dijo: «Por %», con los porcentajes de su cantidad y el paso de su implemento. */
export function aproximacionesPorOmision(p: Prescripcion, nombre: string, prescriptionId: string): AproximacionesDelEjercicio {
  const cuantas = cuantasAproximaciones(p) || 3;
  return {
    prescriptionId,
    mode: 'FROM_WORKING_LOAD',
    workingLoadShares: [...porcentajesPara(cuantas)],
    step: pasoPorOmision(implementoDelEjercicio(nombre, p.loadBasis ?? null), cargaDeTrabajo(p), unidadDeLaPrescripcion(p)),
  };
}

/** Las series con las aproximaciones calculadas arriba (reemplazan a las que había) y las efectivas como estaban. */
export function conAproximacionesCalculadas(p: Prescripcion, a: AproximacionesDelEjercicio): readonly Serie[] | null {
  const trabajo = cargaDeTrabajo(p);
  if (trabajo === null) return null;
  const efectivas = p.sets.filter((s) => !esDeCalentamiento(s));
  return [...seriesDeAproximacion(trabajo, a.workingLoadShares, a.step, unidadDeLaPrescripcion(p)), ...efectivas];
}

/** «A mano»: tantas aproximaciones como se pidan; las que se suman copian la última (o nacen vacías), las de más se quitan. */
export function conCantidadAMano(p: Prescripcion, cuantas: number): readonly Serie[] {
  const actuales = p.sets.filter(esDeCalentamiento);
  const efectivas = p.sets.filter((s) => !esDeCalentamiento(s));
  const ultima = actuales[actuales.length - 1];
  const nuevas: Serie[] = Array.from({ length: Math.max(0, cuantas - actuales.length) }, (): Serie => (ultima ? structuredClone(ultima) : { repetitions: null, setKind: 'WARM_UP', rir: null, restSeconds: DESCANSO_DE_APROXIMACION }));
  return [...actuales.slice(0, cuantas), ...nuevas, ...efectivas];
}

/** Si las aproximaciones de la tabla son las que salen de los porcentajes (las mismas cargas y repeticiones). */
export function coincidenConLosPorcentajes(p: Prescripcion, a: AproximacionesDelEjercicio): boolean {
  const calculadas = conAproximacionesCalculadas(p, a);
  if (!calculadas) return true;
  const deLaTabla = p.sets.filter(esDeCalentamiento);
  const esperadas = calculadas.filter(esDeCalentamiento);
  return (
    deLaTabla.length === esperadas.length &&
    deLaTabla.every((s, n) => s.suggestedLoad?.value === esperadas[n]!.suggestedLoad?.value && JSON.stringify(s.repetitions) === JSON.stringify(esperadas[n]!.repetitions))
  );
}

/** El rótulo de cada serie: las aproximaciones «A1», «A2»…; las efectivas, 1, 2, 3 como siempre. */
export function rotulosConAproximaciones(series: readonly Serie[]): { readonly corto: string; readonly largo: string; readonly numero: number | null }[] {
  let efectiva = 0;
  let aproximacion = 0;
  return series.map((s) => {
    if (esDeCalentamiento(s)) {
      aproximacion += 1;
      return { corto: `A${aproximacion}`, largo: `Aproximación ${aproximacion}`, numero: null };
    }
    efectiva += 1;
    return { corto: String(efectiva), largo: `Serie ${efectiva}`, numero: efectiva };
  });
}

const coma = (n: number): string => String(n).replace('.', ',');

/** DL-197 (ET1-D07): lo que hubo que ajustar para que ninguna aproximación repita la anterior, en una frase; `null` si nada. */
export function ajusteDeLasAproximaciones(p: Prescripcion, a: AproximacionesDelEjercicio): string | null {
  const trabajo = cargaDeTrabajo(p);
  if (trabajo === null || a.mode !== 'FROM_WORKING_LOAD') return null;
  const r = aproximacionesAjustadas(trabajo, a.workingLoadShares, a.step);
  if (r.ajuste === 'MENOS') return `De a ${coma(a.step)}, con ${coma(trabajo)} de trabajo entran ${r.cargas.length} de ${a.workingLoadShares.length} sin repetir una carga. Con un paso más fino entran todas.`;
  if (r.ajuste === 'BAJADAS') return `Para no repetir una carga, alguna quedó un paso (${coma(a.step)}) más abajo que su porcentaje.`;
  return null;
}

/** «8 × 40 · 5 × 60 · 3 × 80 kg»: las aproximaciones de la tabla, en un renglón (F16). Sin aproximaciones, `null`. */
export function resumenDeLasAproximaciones(p: Prescripcion): string | null {
  const unidad = unidadDeLaPrescripcion(p);
  const partes = p.sets.filter(esDeCalentamiento).map((x) => {
    const reps = x.repetitions && 'value' in x.repetitions ? String(x.repetitions.value) : x.repetitions ? `${x.repetitions.min}-${x.repetitions.max}` : '—';
    const carga = x.suggestedLoad && Number.isFinite(x.suggestedLoad.value) ? coma(x.suggestedLoad.value) : '—';
    return `${reps} × ${carga}`;
  });
  return partes.length > 0 ? `${partes.join(' · ')} ${unidad}` : null;
}

/**
 * DL-197 (ET1-D08, F15): las aproximaciones no toman el RIR común. Con el criterio RIR, cada una lleva `rir: null` («sin
 * objetivo en esta serie»); sin él, ninguna lleva la clave (el contrato no acepta un RIR por serie sin el criterio). Se aplica
 * a cada cambio del ejercicio: también cuando el criterio aparece después (al escribir el objetivo común heredado del plan).
 */
export function conLasAproximacionesSinRir(p: Prescripcion, c: Partial<Prescripcion>): Partial<Prescripcion> {
  const intensidad = 'intensity' in c ? c.intensity : p.intensity;
  const conRir = !!intensidad && intensidad.criterion === 'RIR';
  const series = c.sets ?? p.sets;
  let cambio = false;
  const nuevas = series.map((x): Serie => {
    if (!esDeCalentamiento(x)) return x;
    if (conRir && x.rir === undefined) {
      cambio = true;
      return { ...x, rir: null };
    }
    if (!conRir && x.rir === null) {
      cambio = true;
      const { rir: _sin, ...resto } = x;
      return resto as Serie;
    }
    return x;
  });
  return cambio ? { ...c, sets: nuevas } : c;
}

/**
 * DL-199 (ET3-26, BAJA de la tanda 1) · una aproximación que se desmarca vuelve a ser efectiva **con lo común**: sin el RIR
 * vacío que llevaba (hereda el de las efectivas) y sin su descanso propio (hereda el común, no los 60 s de ET1-D08). La
 * carga y las repeticiones que tenía quedan: son lo que el profesional escribió (ET3-D26).
 */
export function serieAlDesmarcarLaAproximacion(s: Serie): Serie {
  const { setKind: _tipo, restSeconds: _descanso, rir, ...resto } = s;
  return (rir === null || rir === undefined ? resto : { ...resto, rir }) as Serie;
}
