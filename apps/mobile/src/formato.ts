/** Fechas en el idioma y la zona de la persona (es-AR), nunca en ISO crudo. */
const conHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const soloDia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });
/** Formateador de fecha civil: fija la zona en UTC para que el día no se corra según la del dispositivo. */
const soloDiaCivil = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'UTC' });

/** Un instante real (recordedAt, activatedAt, occurredAt): se muestra con hora, en la zona de la persona. */
export const fecha = (iso: string) => conHora.format(new Date(iso));
/** El día de un instante real, en la zona de la persona. No usar para fechas civiles `YYYY-MM-DD` (ver `fechaCivil`). */
export const dia = (iso: string) => soloDia.format(new Date(iso));
/** La hora de un instante real, en la zona de la persona: para una lista que ya está agrupada por día. */
const soloHora = new Intl.DateTimeFormat('es-AR', { timeStyle: 'short' });
export const hora = (iso: string) => soloHora.format(new Date(iso));

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
export const hoyEnZona = (zona: string, ahora: Date = new Date()): string => formateadorDeZona(zona, 'dia').format(ahora);

/**
 * Un formateador por zona y por uso, creado una vez: crear un `Intl.DateTimeFormat` cuesta, y «hoy» se calcula en cada
 * dibujo de las pantallas del día.
 */
const formateadores = new Map<string, Intl.DateTimeFormat>();
function formateadorDeZona(zona: string, uso: 'dia' | 'hora'): Intl.DateTimeFormat {
  const clave = `${uso}|${zona}`;
  let f = formateadores.get(clave);
  if (!f) {
    f =
      uso === 'dia'
        ? new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' })
        : new Intl.DateTimeFormat('en-GB', { timeZone: zona, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    formateadores.set(clave, f);
  }
  return f;
}

/** La zona con la que la API resuelve «hoy» (`ZONA_POR_DEFECTO` de la API). */
export const ZONA_DE_LA_API = 'America/Argentina/Buenos_Aires';

/**
 * Cuánto falta para que cambie el día civil en una zona, en milisegundos, con medio segundo de margen y nunca menos de
 * uno. Lo usa `useDiaDeLaApi` para volver a leer «hoy» a la medianoche con la app abierta. Se calcula con la hora de
 * pared de esa zona: si un cambio de horario lo adelanta o lo atrasa, quien lo usa vuelve a mirar el día al despertar.
 */
export function msHastaElProximoDia(zona: string, ahora: Date = new Date()): number {
  const hora = formateadorDeZona(zona, 'hora').format(ahora);
  const m = /(\d{1,2})\D(\d{2})\D(\d{2})/.exec(hora);
  if (!m) return 60_000;
  const transcurrido = (((Number(m[1]) % 24) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000 + ahora.getMilliseconds();
  return Math.max(1000, 86_400_000 - transcurrido + 500);
}

/** El día de la API (`AAAA-MM-DD`) a una hora del servidor, en ms. La hora la estima `reloj-del-servidor.ts`. */
export const diaDeLaApi = (horaDelServidor: number): string => hoyEnZona(ZONA_DE_LA_API, new Date(horaDelServidor));

/** Cuánto falta, desde una hora del servidor, para la medianoche de la API: cuándo cambia `diaDeLaApi`. */
export const msHastaLaMedianocheDeLaApi = (horaDelServidor: number): number => msHastaElProximoDia(ZONA_DE_LA_API, new Date(horaDelServidor));

const diaCortoCivil = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Una fecha civil corta, sin año ni punto: «25 jul». Para el selector de tomas, donde el año ya está en el período. */
export const fechaCorta = (fechaLocal: string): string => diaCortoCivil.format(new Date(`${fechaLocal.slice(0, 10)}T00:00:00Z`)).replace(/\./g, '');

const diaLargoCivil = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Una fecha civil con el día de la semana, para el saludo de Inicio: «Domingo, 4 de octubre». Sin desplazar el día. */
export function fechaLarga(fechaLocal: string): string {
  const texto = diaLargoCivil.format(new Date(`${fechaLocal.slice(0, 10)}T00:00:00Z`));
  return texto.charAt(0).toLocaleUpperCase('es-AR') + texto.slice(1);
}

/** Los `dias` días civiles que terminan en `fin` (`AAAA-MM-DD`), inclusive: `{ periodStart, periodEnd }` para la API. */
export function ultimosDiasHasta(fin: string, dias: number): { periodStart: string; periodEnd: string } {
  const inicio = new Date(`${fin.slice(0, 10)}T00:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - (dias - 1));
  return { periodStart: inicio.toISOString().slice(0, 10), periodEnd: fin.slice(0, 10) };
}

/** Los últimos `dias` días civiles hasta hoy inclusive, en la zona dada: `{ periodStart, periodEnd }` para la API. */
export function ultimosDiasEnZona(dias: number, zona: string, ahora: Date = new Date()): { periodStart: string; periodEnd: string } {
  const periodEnd = hoyEnZona(zona, ahora);
  const inicio = new Date(`${periodEnd}T00:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - (dias - 1));
  return { periodStart: inicio.toISOString().slice(0, 10), periodEnd };
}
