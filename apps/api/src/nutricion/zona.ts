/**
 * Zona horaria del asesorado (WP-04 T15; RNF-DAT-005). El perfil no tiene campos aprobados (DL-009), así que rige la
 * zona por defecto de la demo. «Hoy» y la fecha local de cada ingesta se calculan siempre en el servidor (09v9:664).
 */
export const ZONA_POR_DEFECTO = 'America/Argentina/Buenos_Aires';

/** Fecha local YYYY-MM-DD de un instante en una zona horaria. */
export function fechaLocalEn(instante: Date, zona: string = ZONA_POR_DEFECTO): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instante);
}
