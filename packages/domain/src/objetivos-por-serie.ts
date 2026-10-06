/**
 * Los objetivos efectivos de cada serie planificada (WP-ENTRENAMIENTO-SERIES; DL-122). Es la única resolución: la usan
 * la API al responder, la vista previa del editor del profesional y la APK. Así, la web y el teléfono muestran el mismo
 * objetivo para la misma serie.
 *
 * **Tres estados por campo de la serie** (RIR objetivo, carga sugerida, descanso recomendado):
 * - **ausente:** la serie hereda el valor de la prescripción;
 * - **`null`:** la serie no tiene ese objetivo, aunque la prescripción lo tenga (por ejemplo, una serie de aproximación
 *   sin RIR);
 * - **un valor:** la serie lo sobrescribe.
 *
 * Las repeticiones ya eran de cada serie y no heredan nada.
 *
 * **El RIR objetivo de una serie solo existe si el criterio de la prescripción es RIR.** Con %RM sería un segundo
 * criterio, que REG-06-128 no admite. El %RM rige para todas las series y conserva su referencia. La carga sugerida es
 * informativa y no reemplaza al criterio. Nada se convierte: ni RIR en RPE, ni %RM en kilos, ni kilos en libras.
 */
import type { z } from 'zod';
import type { CargaSchema } from './contratos-entrenamiento';

type Carga = z.infer<typeof CargaSchema>;

/** El RIR objetivo admitido, el mismo que el de la prescripción: de 0 a 10, con decimales. El realizado admite hasta 20. */
export const RIR_OBJETIVO_MINIMO = 0;
export const RIR_OBJETIVO_MAXIMO = 10;

/** De dónde sale el objetivo efectivo de una serie. */
export type OrigenDelObjetivo = 'SET' | 'PRESCRIPTION' | 'NONE';

type RepeticionesPlanificadas = { readonly value: number } | { readonly min: number; readonly max: number };

/** Lo mínimo de una serie planificada para resolver su objetivo. Sirve para la entrada del editor y para lo guardado. */
export interface SerieParaResolver {
  readonly repetitions: RepeticionesPlanificadas | null;
  readonly rir?: number | null;
  readonly suggestedLoad?: Carga | null;
  readonly restSeconds?: number | null;
}

/** Lo mínimo de una prescripción para resolver los objetivos de sus series. */
export interface PrescripcionParaResolver {
  /** En la entrada, el criterio viaja como texto; se compara sin espacios y en mayúsculas, como al normalizar. */
  readonly intensity: { readonly criterion: string; readonly target: { readonly value: number } } | null;
  readonly suggestedLoad?: Carga | null;
  readonly restSeconds?: number | null;
  readonly sets: readonly SerieParaResolver[];
}

export interface ObjetivoEfectivoDeSerie {
  readonly setIndex: number;
  readonly repetitions: RepeticionesPlanificadas | null;
  readonly rir: number | null;
  readonly suggestedLoad: Carga | null;
  readonly restSeconds: number | null;
  readonly origin: { readonly rir: OrigenDelObjetivo; readonly suggestedLoad: OrigenDelObjetivo; readonly restSeconds: OrigenDelObjetivo };
}

/** Si la serie trae el campo, aunque sea `null`. Un `undefined` explícito cuenta como ausente: JSON no lo transporta. */
const trae = <K extends 'rir' | 'suggestedLoad' | 'restSeconds'>(serie: SerieParaResolver, campo: K): boolean =>
  Object.prototype.hasOwnProperty.call(serie, campo) && serie[campo] !== undefined;

export const esCriterioRir = (intensity: PrescripcionParaResolver['intensity']): boolean => intensity !== null && intensity.criterion.trim().toUpperCase() === 'RIR';

function resolver<T>(propio: boolean, valorPropio: T | null | undefined, heredado: T | null | undefined): { valor: T | null; origen: OrigenDelObjetivo } {
  if (propio) return { valor: valorPropio ?? null, origen: 'SET' };
  if (heredado !== null && heredado !== undefined) return { valor: heredado, origen: 'PRESCRIPTION' };
  return { valor: null, origen: 'NONE' };
}

/**
 * El objetivo efectivo de cada serie, en orden. La serie N es la posición N: el índice no se guarda (como en la
 * lectura vigente), y por eso la identidad histórica de un objetivo es la versión del plan, la prescripción y el índice.
 */
export function objetivosEfectivos(prescripcion: PrescripcionParaResolver): ObjetivoEfectivoDeSerie[] {
  const rirDeLaPrescripcion = esCriterioRir(prescripcion.intensity) ? prescripcion.intensity!.target.value : null;
  return prescripcion.sets.map((serie, i) => {
    const rir = resolver(trae(serie, 'rir'), serie.rir, rirDeLaPrescripcion);
    const carga = resolver(trae(serie, 'suggestedLoad'), serie.suggestedLoad, prescripcion.suggestedLoad);
    const descanso = resolver(trae(serie, 'restSeconds'), serie.restSeconds, prescripcion.restSeconds);
    return {
      setIndex: i + 1,
      repetitions: serie.repetitions,
      rir: rir.valor,
      suggestedLoad: carga.valor,
      restSeconds: descanso.valor,
      origin: { rir: rir.origen, suggestedLoad: carga.origen, restSeconds: descanso.origen },
    };
  });
}

export type ProblemaDeObjetivoPorSerie = 'SET_RIR_WITHOUT_RIR_CRITERION' | 'SET_RIR_OUT_OF_RANGE';

/**
 * Lo que una prescripción no puede guardar en sus series. Al guardar, la API lo responde como
 * `422 INTENSITY_CRITERION_INVALID` con estos motivos; el editor lo muestra antes de guardar.
 * - Un RIR por serie (o su quita explícita) sin criterio RIR en la prescripción sería un segundo criterio.
 * - Un RIR objetivo fuera de 0 a 10.
 */
export function problemasDeObjetivosPorSerie(prescripcion: PrescripcionParaResolver): { readonly setIndex: number; readonly motivo: ProblemaDeObjetivoPorSerie }[] {
  const conRir = esCriterioRir(prescripcion.intensity);
  const problemas: { setIndex: number; motivo: ProblemaDeObjetivoPorSerie }[] = [];
  prescripcion.sets.forEach((serie, i) => {
    if (!trae(serie, 'rir')) return;
    if (!conRir) problemas.push({ setIndex: i + 1, motivo: 'SET_RIR_WITHOUT_RIR_CRITERION' });
    else if (serie.rir !== null && (!Number.isFinite(serie.rir) || serie.rir! < RIR_OBJETIVO_MINIMO || serie.rir! > RIR_OBJETIVO_MAXIMO)) problemas.push({ setIndex: i + 1, motivo: 'SET_RIR_OUT_OF_RANGE' });
  });
  return problemas;
}
