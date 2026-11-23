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
    mode: 'PERCENT',
    percents: [...porcentajesPara(cuantas)],
    step: pasoPorOmision(implementoDelEjercicio(nombre, p.loadBasis ?? null), cargaDeTrabajo(p), unidadDeLaPrescripcion(p)),
  };
}

/** Las series con las aproximaciones calculadas arriba (reemplazan a las que había) y las efectivas como estaban. */
export function conAproximacionesCalculadas(p: Prescripcion, a: AproximacionesDelEjercicio): readonly Serie[] | null {
  const trabajo = cargaDeTrabajo(p);
  if (trabajo === null) return null;
  const efectivas = p.sets.filter((s) => !esDeCalentamiento(s));
  return [...seriesDeAproximacion(trabajo, a.percents, a.step, unidadDeLaPrescripcion(p)), ...efectivas];
}

/** «A mano»: tantas aproximaciones como se pidan; las que se suman copian la última (o nacen vacías), las de más se quitan. */
export function conCantidadAMano(p: Prescripcion, cuantas: number): readonly Serie[] {
  const actuales = p.sets.filter(esDeCalentamiento);
  const efectivas = p.sets.filter((s) => !esDeCalentamiento(s));
  const ultima = actuales[actuales.length - 1];
  const nuevas: Serie[] = Array.from({ length: Math.max(0, cuantas - actuales.length) }, (): Serie => (ultima ? structuredClone(ultima) : { repetitions: null, setKind: 'WARM_UP' }));
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
