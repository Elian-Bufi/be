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
