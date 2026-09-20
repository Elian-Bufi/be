/**
 * Zona horaria del asesorado (WP-04 T15; RNF-DAT-005). El perfil no tiene campos aprobados (DL-009), así que rige la
 * zona por defecto de la demo. «Hoy» y la fecha local de cada ingesta se calculan siempre en el servidor (09v9:664).
 */
export const ZONA_POR_DEFECTO = 'America/Argentina/Buenos_Aires';

/** Fecha local YYYY-MM-DD de un instante en una zona horaria. */
export function fechaLocalEn(instante: Date, zona: string = ZONA_POR_DEFECTO): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instante);
}

/**
 * El instante en el que empieza una fecha local, en una zona. Se resuelve por búsqueda del desplazamiento real de esa
 * fecha —no por una constante— para que un cambio de huso no corra la ventana: un período local recortado en UTC deja
 * afuera las horas de la tarde del último día, y en la evolución eso se vería como «sin dato» (INV-06-177).
 */
export function inicioDelDiaLocal(fecha: string, zona: string = ZONA_POR_DEFECTO): Date {
  const tentativa = new Date(`${fecha}T00:00:00.000Z`);
  // Dos pasadas alcanzan: la primera corrige el desplazamiento, la segunda lo confirma si la primera cruzó el cambio.
  let instante = tentativa;
  for (let i = 0; i < 2; i++) {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: zona,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(instante);
    const v = (t: Intl.DateTimeFormatPartTypes) => Number(partes.find((x) => x.type === t)?.value ?? 0);
    const comoUtc = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour') % 24, v('minute'), v('second'));
    instante = new Date(instante.getTime() + (tentativa.getTime() - comoUtc));
  }
  return instante;
}

/** El instante en el que termina una fecha local: el comienzo del día siguiente, exclusivo. */
export function finDelDiaLocal(fecha: string, zona: string = ZONA_POR_DEFECTO): Date {
  const siguiente = new Date(`${fecha}T00:00:00.000Z`);
  siguiente.setUTCDate(siguiente.getUTCDate() + 1);
  return inicioDelDiaLocal(siguiente.toISOString().slice(0, 10), zona);
}
