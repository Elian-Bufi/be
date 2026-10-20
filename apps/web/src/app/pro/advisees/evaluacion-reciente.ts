/**
 * La evaluación de referencia que el objetivo propone de entrada: la más reciente (bloque 5 del encargo de
 * consolidación, 2026-10-19). En el primer plan, el formulario del objetivo se abre apenas se registra la evaluación,
 * antes de que la lista vuelva a leerse: si todavía no hay una elegida, se toma la más reciente cuando llega. El
 * profesional la puede cambiar.
 */
export const evaluacionMasReciente = (evaluaciones: readonly { readonly evaluationId: string; readonly occurredAt: string }[]): string =>
  [...evaluaciones].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0]?.evaluationId ?? '';
