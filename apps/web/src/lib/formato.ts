/**
 * Fechas en la zona y el idioma de la persona (es-AR), nunca en ISO crudo. Las horas van en 24 horas («18:10»), sin
 * «a. m.» ni «p. m.» (WP-ESCRITORIO-AMABLE, C-10). El día y la hora se arman por separado: pedirle a `Intl` un estilo de
 * fecha junto con el ciclo de 24 horas le cambia el formato del día («8 de oct de 2026»).
 */
const HORA = { timeStyle: 'short', hourCycle: 'h23' } as const;
const soloDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });
const soloHora = new Intl.DateTimeFormat('es-AR', HORA);

/** «8 oct 2026, 08:00». */
export const fecha = (iso: string) => `${soloDia.format(new Date(iso))}, ${soloHora.format(new Date(iso))}`;
export const dia = (iso: string) => soloDia.format(new Date(iso));
/** «13:15»: la hora de un momento de esta visita (por ejemplo, cuándo se consultaron los datos), en la zona del navegador. */
export const horaDelDia = (momento: Date) => soloHora.format(momento);

/** «08/09»: una fecha civil (`AAAA-MM-DD`) corta, para el eje de un gráfico. La fecha civil no cambia con la zona. */
const diaYMes = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
export const diaCorto = (fechaCivil: string) => diaYMes.format(new Date(`${fechaCivil}T12:00:00Z`));

/** «8 sept 2026»: una fecha civil (`AAAA-MM-DD`) del período, tal cual, sin pasarla por la zona del navegador. */
const diaEnUtc = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'UTC' });
export const diaCivil = (fechaCivil: string) => (fechaCivil ? diaEnUtc.format(new Date(`${fechaCivil}T12:00:00Z`)) : '');

/**
 * «13 jul – 10 oct 2026»: un período entre dos fechas civiles, con el año una sola vez si es el mismo. Con años
 * distintos, cada fecha lleva el suyo («20 dic 2025 – 10 ene 2026»).
 */
const diaYMesCortos = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export function rangoCivil(desde: string, hasta: string): string {
  if (!desde || !hasta) return '';
  if (desde.slice(0, 4) !== hasta.slice(0, 4)) return `${diaCivil(desde)} – ${diaCivil(hasta)}`;
  return `${diaYMesCortos.format(new Date(`${desde}T12:00:00Z`))} – ${diaCivil(hasta)}`;
}

/**
 * Fecha y hora de un instante en una zona dada (la del período de una evolución): así la hora de una toma, los huecos
 * y las marcas del eje hablan del mismo día aunque el navegador esté en otra zona. Si la zona no se reconoce, en la
 * del navegador.
 */
export function fechaEnZona(iso: string, zonaHoraria: string): string {
  try {
    const momento = new Date(iso);
    const elDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: zonaHoraria }).format(momento);
    return `${elDia}, ${new Intl.DateTimeFormat('es-AR', { ...HORA, timeZone: zonaHoraria }).format(momento)}`;
  } catch {
    return fecha(iso);
  }
}

/** Solo la hora de un instante en una zona dada, cuando el día ya lo dice su grupo. Si la zona no se reconoce, la del navegador. */
export function horaEnZona(iso: string, zonaHoraria: string): string {
  try {
    return new Intl.DateTimeFormat('es-AR', { ...HORA, timeZone: zonaHoraria }).format(new Date(iso));
  } catch {
    return soloHora.format(new Date(iso));
  }
}

/**
 * Un número **dentro de un campo de entrada**: coma decimal, sin punto de miles (DL-091 punto 4). Para mostrar, se usa
 * `numero`/`cantidad` de `@be/domain`; acá no, porque el punto de miles que agregan volvería a leerse como decimal
 * («1.200» es mil doscientos al mostrarlo y sería 1,2 al releerlo con `leerNumero`). Vacío cuando no hay valor.
 */
export const numeroEnCampo = (valor: number | null | undefined): string => (valor === null || valor === undefined || !Number.isFinite(valor) ? '' : String(valor).replace('.', ','));
