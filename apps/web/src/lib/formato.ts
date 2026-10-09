/** Fechas en la zona y el idioma de la persona (es-AR), nunca en ISO crudo. */
const conHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const soloDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });

export const fecha = (iso: string) => conHora.format(new Date(iso));
export const dia = (iso: string) => soloDia.format(new Date(iso));

/** «08/09»: una fecha civil (`AAAA-MM-DD`) corta, para el eje de un gráfico. La fecha civil no cambia con la zona. */
const diaYMes = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
export const diaCorto = (fechaCivil: string) => diaYMes.format(new Date(`${fechaCivil}T12:00:00Z`));

/** «8 sept 2026»: una fecha civil (`AAAA-MM-DD`) del período, tal cual, sin pasarla por la zona del navegador. */
const diaEnUtc = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'UTC' });
export const diaCivil = (fechaCivil: string) => (fechaCivil ? diaEnUtc.format(new Date(`${fechaCivil}T12:00:00Z`)) : '');

/**
 * Fecha y hora de un instante en una zona dada (la del período de una evolución): así la hora de una toma, los huecos
 * y las marcas del eje hablan del mismo día aunque el navegador esté en otra zona. Si la zona no se reconoce, en la
 * del navegador.
 */
export function fechaEnZona(iso: string, zonaHoraria: string): string {
  try {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: zonaHoraria }).format(new Date(iso));
  } catch {
    return fecha(iso);
  }
}

/** Solo la hora de un instante en una zona dada, cuando el día ya lo dice su grupo. Si la zona no se reconoce, la del navegador. */
export function horaEnZona(iso: string, zonaHoraria: string): string {
  try {
    return new Intl.DateTimeFormat('es-AR', { timeStyle: 'short', timeZone: zonaHoraria }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat('es-AR', { timeStyle: 'short' }).format(new Date(iso));
  }
}

/**
 * Un número **dentro de un campo de entrada**: coma decimal, sin punto de miles (DL-091 punto 4). Para mostrar, se usa
 * `numero`/`cantidad` de `@be/domain`; acá no, porque el punto de miles que agregan volvería a leerse como decimal
 * («1.200» es mil doscientos al mostrarlo y sería 1,2 al releerlo con `leerNumero`). Vacío cuando no hay valor.
 */
export const numeroEnCampo = (valor: number | null | undefined): string => (valor === null || valor === undefined || !Number.isFinite(valor) ? '' : String(valor).replace('.', ','));
