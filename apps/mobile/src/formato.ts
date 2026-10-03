/** Fechas en el idioma y la zona de la persona (es-AR), nunca en ISO crudo. */
const conHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const soloDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });
/** Formateador de fecha civil: fija la zona en UTC para que el día no se corra según la del dispositivo. */
const soloDiaCivil = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'UTC' });

/** Un instante real (recordedAt, activatedAt, occurredAt): se muestra con hora, en la zona de la persona. */
export const fecha = (iso: string) => conHora.format(new Date(iso));
/** El día de un instante real, en la zona de la persona. No usar para fechas civiles `YYYY-MM-DD` (ver `fechaCivil`). */
export const dia = (iso: string) => soloDia.format(new Date(iso));

/**
 * Una **fecha civil** (`YYYY-MM-DD`: la fecha de una sesión, una ocurrencia, un tramo), tal cual, sin desplazarla por la
 * zona del dispositivo. Se ancla y se formatea en UTC, así el día/mes/año se conservan en cualquier zona —al oeste de
 * UTC `dia("2026-09-25")` retrocedía a 24; en zonas muy al este, anclar a mediodía UTC avanzaba a 26—. Los timestamps
 * reales (recordedAt, activatedAt) **no** van por acá: su presentación sí depende de la zona (`fecha`/`dia`).
 */
export const fechaCivil = (fechaLocal: string) => soloDiaCivil.format(new Date(`${fechaLocal.slice(0, 10)}T00:00:00Z`));

/**
 * La fecha civil de hoy (`YYYY-MM-DD`) **en una zona dada**, no en UTC ni en la del dispositivo. `toISOString()` da la
 * fecha UTC: de 21 a 24 h en Buenos Aires ya es «mañana», y la API rechaza ese día como futuro (`PERIOD_IN_FUTURE`).
 */
export const hoyEnZona = (zona: string, ahora: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);

/** La zona con la que la API resuelve «hoy» (`ZONA_POR_DEFECTO` de la API). */
export const ZONA_DE_LA_API = 'America/Argentina/Buenos_Aires';

/** Los últimos `dias` días civiles hasta hoy inclusive, en la zona dada: `{ periodStart, periodEnd }` para la API. */
export function ultimosDiasEnZona(dias: number, zona: string, ahora: Date = new Date()): { periodStart: string; periodEnd: string } {
  const periodEnd = hoyEnZona(zona, ahora);
  const inicio = new Date(`${periodEnd}T00:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - (dias - 1));
  return { periodStart: inicio.toISOString().slice(0, 10), periodEnd };
}
