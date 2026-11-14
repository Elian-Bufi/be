/**
 * Fechas y horas en el idioma de la persona (es-AR), nunca en ISO crudo. Desde DL-170 (WP-APP-VUELTA-2 AV2-15) hay tres
 * formas, todas desde acá:
 * - **el título del día:** «Lunes 9 de noviembre», sin coma (`fechaLarga`);
 * - **la fecha dentro de un texto:** «9 nov», con el año solo si no es el del día de la API: «2 sept 2025» (`fechaCivil`
 *   para una fecha civil, `dia` para el día de un instante);
 * - **la hora, de 24 h:** «13:10», nunca «1:10 p. m.» (`hora`); un instante se escribe «9 nov · 13:10» (`fecha`).
 * La agenda conserva sus frases relativas («el lunes», «mañana»), que arma el dominio.
 *
 * Los nombres de los días y de los meses van escritos acá, y la hora se arma con números: el `Intl` de Hermes no es el
 * del navegador (puede abreviar «sep» o escribir «p. m.»), y la app no depende de él para lo que muestra. `Intl` queda
 * solo para saber el día y la hora en una zona dada, con el formateador que ya usa «hoy» (`formateadorDeZona`).
 */

import { numero, UNIDAD_ADIMENSIONAL } from '@be/domain';

// ─── Las medidas medidas, con un decimal (AV2-25, AV2-D9) ───────────────────────────────────────
// Una medida tomada con cinta, plicómetro o balanza (cm, mm, kg) se escribe con un decimal, como mide ISAK (0,1) y como
// pide REG-06-158: «39» se lee «39,0», y «58,8» y «58,75» quedan como están. Completa con cero y **nunca redondea**: un
// valor con más decimales los conserva. Los resultados de fórmulas no pasan por acá: siguen con su precisión
// (`numeroConPrecision`). Va en la APK y no en el dominio (AV2-T13): pasa al dominio cuando el website lo use.

/** «39,0», «58,8», «58,75»: el número de una medida medida, con al menos un decimal y sin redondear. */
export function valorConUnDecimal(valor: number): string {
  const texto = numero(valor);
  return texto === '—' || texto.includes(',') ? texto : `${texto},0`;
}

/** «39,0 cm»: la medida medida con su unidad. Sin dimensión, el número como viene. */
export function medidaConUnDecimal(valor: number, unidad: string): string {
  return unidad === UNIDAD_ADIMENSIONAL ? numero(valor) : `${valorConUnDecimal(valor)} ${unidad}`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
/** Las abreviaturas de es-AR, sin punto: «sept», no «sep». */
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const;

const dosCifras = (n: number): string => String(n).padStart(2, '0');

/** El año, el mes y el día de una fecha civil `AAAA-MM-DD`, tal cual: sin pasar por la zona del teléfono. */
function partesCiviles(fechaLocal: string): { readonly anio: number; readonly mes: number; readonly dia: number } {
  const [anio, mes, dia] = fechaLocal.slice(0, 10).split('-').map(Number);
  return { anio, mes, dia };
}

// ─── El día de referencia: el de la API ─────────────────────────────────────────────────────────
// El año se escribe solo si no es el del día de la API. `useDiaDeLaApi` lo fija con el día que estima con la hora del
// servidor; antes de eso vale el día de la API con la hora del teléfono.
let diaDeReferencia: string | null = null;
export function fijarDiaDeReferencia(dia: string): void {
  diaDeReferencia = dia.slice(0, 10);
}
/** El año contra el que se compara: el de `referencia` si se pasa una fecha (las pruebas), o el del día de la API. */
const anioDeReferencia = (referencia?: unknown): number => Number((typeof referencia === 'string' ? referencia : (diaDeReferencia ?? hoyEnZona(ZONA_DE_LA_API))).slice(0, 4));

/**
 * Una **fecha civil** (`YYYY-MM-DD`: la fecha de una sesión, una ocurrencia, una toma) dentro de un texto: «9 nov», o
 * «2 sept 2025» si es de otro año que el día de la API. Tal cual, sin desplazarla por la zona del dispositivo (al oeste
 * de UTC, anclarla a la medianoche UTC y formatearla en la zona local retrocedía un día). Los instantes reales
 * (recordedAt, occurredAt) **no** van por acá: su día depende de la zona (`dia`, `fecha`).
 */
export function fechaCivil(fechaLocal: string, referencia?: string): string {
  const { anio, mes, dia } = partesCiviles(fechaLocal);
  const base = `${dia} ${MESES_CORTOS[mes - 1]}`;
  return anio === anioDeReferencia(referencia) ? base : `${base} ${anio}`;
}

/** Una fecha civil corta, siempre sin año: «25 jul». Para el selector de tomas, donde el año ya está en el período. */
export function fechaCorta(fechaLocal: string): string {
  const { mes, dia } = partesCiviles(fechaLocal);
  return `${dia} ${MESES_CORTOS[mes - 1]}`;
}

/** El título del día: «Lunes 9 de noviembre», con el día de la semana y sin coma. Sin desplazar el día. */
export function fechaLarga(fechaLocal: string): string {
  const { anio, mes, dia } = partesCiviles(fechaLocal);
  const semana = DIAS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()];
  return `${semana.charAt(0).toLocaleUpperCase('es-AR')}${semana.slice(1)} ${dia} de ${MESES[mes - 1]}`;
}

/** El día de la semana de una fecha civil, en minúscula: «lunes». */
export function diaDeLaSemana(fechaLocal: string): string {
  const { anio, mes, dia } = partesCiviles(fechaLocal);
  return DIAS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()];
}

/** El día y el mes de una fecha civil, para leer: «9 de noviembre». */
export function diaYMes(fechaLocal: string): string {
  const { mes, dia } = partesCiviles(fechaLocal);
  return `${dia} de ${MESES[mes - 1]}`;
}

/**
 * La fecha civil y la hora de un instante: en `zona` si se pasa (las pruebas, con la zona fija), o en la del teléfono.
 * La de la persona es la que importa: a qué hora comió, según su reloj.
 */
function partesDelInstante(iso: string, zona?: string): { readonly fecha: string; readonly horas: number; readonly minutos: number } {
  const instante = new Date(iso);
  // Una zona tiene que ser un texto: usada en un `map`, la función recibe el índice como segundo argumento.
  if (typeof zona === 'string' && zona !== '') {
    const m = /(\d{1,2})\D(\d{2})/.exec(formateadorDeZona(zona, 'hora').format(instante));
    return { fecha: formateadorDeZona(zona, 'dia').format(instante), horas: Number(m?.[1] ?? 0) % 24, minutos: Number(m?.[2] ?? 0) };
  }
  return {
    fecha: `${instante.getFullYear()}-${dosCifras(instante.getMonth() + 1)}-${dosCifras(instante.getDate())}`,
    horas: instante.getHours(),
    minutos: instante.getMinutes(),
  };
}

/**
 * La fecha civil (`AAAA-MM-DD`) de un instante real: en `zona` si se pasa (las pruebas), o en la del teléfono. Para
 * decir de qué día es algo con las palabras de acá («hoy», «ayer», «el martes 10»), no para mostrarla así.
 */
export function fechaCivilDeUnInstante(iso: string, zona?: string): string {
  return partesDelInstante(iso, zona).fecha;
}

/** La hora de un instante real, de 24 h: «13:10», «00:05». Para una lista que ya dice el día. */
export function hora(iso: string, zona?: string): string {
  const p = partesDelInstante(iso, zona);
  return `${dosCifras(p.horas)}:${dosCifras(p.minutos)}`;
}

/** El día de un instante real, dentro de un texto: «9 nov». No usar para fechas civiles `YYYY-MM-DD` (ver `fechaCivil`). */
export function dia(iso: string, zona?: string): string {
  return fechaCivil(partesDelInstante(iso, zona).fecha);
}

/** Un instante real (recordedAt, activatedAt, occurredAt), con su hora: «9 nov · 13:10». */
export function fecha(iso: string, zona?: string): string {
  const p = partesDelInstante(iso, zona);
  return `${fechaCivil(p.fecha)} · ${dosCifras(p.horas)}:${dosCifras(p.minutos)}`;
}

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
