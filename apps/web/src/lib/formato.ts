/** Fechas en la zona y el idioma de la persona (es-AR), nunca en ISO crudo. */
const conHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const soloDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });

export const fecha = (iso: string) => conHora.format(new Date(iso));
export const dia = (iso: string) => soloDia.format(new Date(iso));

/** «08/09»: una fecha civil (`AAAA-MM-DD`) corta, para el eje de un gráfico. La fecha civil no cambia con la zona. */
const diaYMes = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
export const diaCorto = (fechaCivil: string) => diaYMes.format(new Date(`${fechaCivil}T12:00:00Z`));

/**
 * Un número **dentro de un campo de entrada**: coma decimal, sin punto de miles (DL-091 punto 4). Para mostrar, se usa
 * `numero`/`cantidad` de `@be/domain`; acá no, porque el punto de miles que agregan volvería a leerse como decimal
 * («1.200» es mil doscientos al mostrarlo y sería 1,2 al releerlo con `leerNumero`). Vacío cuando no hay valor.
 */
export const numeroEnCampo = (valor: number | null | undefined): string => (valor === null || valor === undefined || !Number.isFinite(valor) ? '' : String(valor).replace('.', ','));
