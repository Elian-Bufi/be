/** Fechas en el idioma y la zona de la persona (es-AR), nunca en ISO crudo. */
const conHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const soloDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });

export const fecha = (iso: string) => conHora.format(new Date(iso));
export const dia = (iso: string) => soloDia.format(new Date(iso));
