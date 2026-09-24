/** Fechas en la zona y el idioma de la persona (es-AR), nunca en ISO crudo. */
const conHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const soloDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });

export const fecha = (iso: string) => conHora.format(new Date(iso));
export const dia = (iso: string) => soloDia.format(new Date(iso));

/**
 * Un número **dentro de un campo de entrada**: coma decimal, sin punto de miles (DL-091 punto 4). Para mostrar, se usa
 * `numero`/`cantidad` de `@be/domain`; acá no, porque el punto de miles que agregan volvería a leerse como decimal
 * («1.200» es mil doscientos al mostrarlo y sería 1,2 al releerlo con `leerNumero`). Vacío cuando no hay valor.
 */
export const numeroEnCampo = (valor: number | null | undefined): string => (valor === null || valor === undefined || !Number.isFinite(valor) ? '' : String(valor).replace('.', ','));
