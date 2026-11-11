/**
 * Aplicar una revisión registrada (API-NUT-20 y API-TRN-24; UC-I06): lo que comparten la lista de Revisiones de cada
 * área y el cajón «De a una» (WP-TABLERO-ALTA-GAMA TB-15; DL-163 D-6). Es la misma operación con los mismos textos en
 * los dos lugares: aplicar desde el cajón es aplicar.
 * - **Antes del botón,** el resultado, el fundamento, la próxima acción y lo que pasa al aplicar: el efecto del resultado
 *   (`EFECTO_VISIBLE_DE_RESULTADO`) y, si la revisión acordó una fecha, que la próxima queda para ese día.
 * - **Después,** lo que hizo la aplicación, con las palabras de cada área.
 * - **Los conflictos de siempre:** ya aplicada (`REVIEW_ALREADY_APPLIED`), no aplicable ahora
 *   (`CONTINUITY_ACTION_NOT_APPLICABLE`, por ejemplo con un borrador ya abierto) y los de cualquier escritura. La clave
 *   de idempotencia es la del intento (`useClaveDeIntento`): un reintento de un resultado incierto no aplica dos veces.
 */
import { COPY_ENTRENAMIENTO, COPY_NUTRICION, EFECTO_VISIBLE_DE_RESULTADO, EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO, ETIQUETA_DE_RESULTADO, type Resultado } from '@be/domain';

export type AreaQueSeRevisa = 'nutrition' | 'training';
type ResultadoDeRevision = keyof typeof ETIQUETA_DE_RESULTADO;

/** El verbo de cada área, el mismo que en su lista de Revisiones. */
export const VERBO_DE_APLICAR: Readonly<Record<AreaQueSeRevisa, string>> = { nutrition: COPY_NUTRICION.aplicarContinuidad, training: COPY_ENTRENAMIENTO.aplicarProximaAccion };

/** Qué pasa al aplicar cada resultado, con las palabras de cada área. */
export const efectoDelResultado = (area: AreaQueSeRevisa, resultado: ResultadoDeRevision): string =>
  (area === 'nutrition' ? EFECTO_VISIBLE_DE_RESULTADO : EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO)[resultado];

/**
 * La fecha que deja la aplicación, dicha como el efecto de la fecha de «¿Cuándo la revisás?». Sin fecha, no se acuerda
 * una nueva y la que estaba no cambia (lo que hace BE hoy, TA-41). «Finalizar» cierra: no hay próxima.
 */
export function efectoDeLaFecha(resultado: ResultadoDeRevision, fecha: string | null | undefined, enPalabras: (f: string) => string): string | null {
  if (resultado === 'FINALIZE') return null;
  return fecha ? `La próxima revisión queda para el ${enPalabras(fecha.slice(0, 10))}.` : 'No se acuerda una fecha nueva: la revisión que ya estaba acordada no cambia.';
}

interface Aplicacion {
  readonly processStateAfter: 'ABIERTO' | 'CERRADO';
  readonly createdPlanId: string | null;
  readonly createdObjectiveVersionId: string | null;
}

/** Lo que hizo la aplicación, como lo dice la lista de Revisiones de cada área. */
export function textoDeLaAplicacion(area: AreaQueSeRevisa, a: Aplicacion): string {
  const hecho = area === 'nutrition' ? 'Continuidad aplicada' : 'Próxima acción aplicada';
  if (a.processStateAfter === 'CERRADO') return 'Seguimiento cerrado. La historia se conserva.';
  if (a.createdPlanId) return `${hecho}: se preparó una nueva versión del plan en borrador. La versión activa no cambió.`;
  if (a.createdObjectiveVersionId) return `${hecho}: se emitió una nueva versión del objetivo.`;
  return area === 'nutrition' ? COPY_NUTRICION.continuidadAplicada : 'Próxima acción aplicada.';
}

export const COPY_APLICAR = {
  noAplicableAhora: 'No se puede aplicar ahora: revisá si ya hay un borrador del plan o si el seguimiento cambió.',
  yaAplicada: 'Esta revisión ya se aplicó.',
  aplicando: 'Aplicando…',
} as const;

/**
 * El texto de los dos conflictos propios de aplicar, o `null`: los demás los dice `mensajeDeFallo`, como cualquier
 * escritura (`falloPropioDeAplicar(r) ?? mensajeDeFallo(r)`).
 */
export function falloPropioDeAplicar(r: Resultado<unknown>): string | null {
  if (!r.ok && r.tipo === 'API' && r.codigo === 'CONTINUITY_ACTION_NOT_APPLICABLE') return COPY_APLICAR.noAplicableAhora;
  if (!r.ok && r.tipo === 'API' && r.codigo === 'REVIEW_ALREADY_APPLIED') return COPY_APLICAR.yaAplicada;
  return null;
}
