/**
 * PG-14 de WP-PULIDO-GRANDES (DL-173): las fechas, como se leen acá. Sin React, para las pruebas (TEST-PG-013).
 *
 * El campo de fecha nativo del navegador se lee como lo pide el idioma del navegador («11/27/2026» en inglés) y su
 * calendario arranca el domingo. El selector propio (`components/campo-de-fecha.tsx`) dice la fecha en palabras
 * («vie 27 nov»; con otro año, «vie 27 nov 2027»), arranca la semana el lunes y usa los nombres de acá, sin preguntarle
 * nada al navegador: los nombres están escritos acá, no salen de `Intl`.
 *
 * Todo trabaja con la fecha civil `AAAA-MM-DD`, la misma que mandaban los campos nativos: el valor enviado no cambia.
 * Las cuentas se hacen al mediodía UTC, para que ninguna zona horaria mueva el día.
 */

export const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;
export const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
/** Los encabezados de la grilla, de dos letras, del lunes al domingo. */
export const DIAS_DE_LA_GRILLA = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'] as const;
export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const;
export const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Si es una fecha civil que existe («2026-02-30» no). */
export function esFechaCivil(f: string | null | undefined): f is string {
  const m = typeof f === 'string' ? FECHA.exec(f) : null;
  if (!m) return false;
  return aFecha(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)) === f;
}

const aFecha = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const partes = (f: string): { anio: number; mes: number; dia: number } => ({ anio: Number(f.slice(0, 4)), mes: Number(f.slice(5, 7)) - 1, dia: Number(f.slice(8, 10)) });
/** 0 = lunes … 6 = domingo. */
export const diaDeLaSemana = (f: string): number => (new Date(`${f}T12:00:00Z`).getUTCDay() + 6) % 7;

export function sumarDias(f: string, dias: number): string {
  const { anio, mes, dia } = partes(f);
  return aFecha(Date.UTC(anio, mes, dia + dias, 12));
}

/** El mismo día, `meses` después (o antes); si ese mes es más corto, su último día («31 ene» + 1 → «28 feb»). */
export function sumarMeses(f: string, meses: number): string {
  const { anio, mes, dia } = partes(f);
  const ultimo = new Date(Date.UTC(anio, mes + meses + 1, 0, 12)).getUTCDate();
  return aFecha(Date.UTC(anio, mes + meses, Math.min(dia, ultimo), 12));
}

/** «vie 27 nov»; si el año no es el de hoy, «vie 27 nov 2027». */
export function fechaCorta(f: string, hoy: string): string {
  if (!esFechaCivil(f)) return '';
  const { anio, mes, dia } = partes(f);
  const base = `${DIAS_CORTOS[diaDeLaSemana(f)]} ${dia} ${MESES_CORTOS[mes]}`;
  return hoy.slice(0, 4) === f.slice(0, 4) ? base : `${base} ${anio}`;
}

/** «viernes 27 de noviembre de 2026»: lo que lee el lector de pantalla. */
export function fechaCompleta(f: string): string {
  if (!esFechaCivil(f)) return '';
  const { anio, mes, dia } = partes(f);
  return `${DIAS_LARGOS[diaDeLaSemana(f)]} ${dia} de ${MESES_LARGOS[mes]} de ${anio}`;
}

/** «noviembre de 2026»: el título del mes que se mira. `mes` va de 0 a 11. */
export const mesEnPalabras = (anio: number, mes: number): string => `${MESES_LARGOS[mes]} de ${anio}`;

/** El primer día del mes de una fecha («2026-11-01»). */
export const primeroDelMes = (f: string): string => `${f.slice(0, 7)}-01`;

/**
 * Las semanas del mes, del lunes al domingo: cada una con siete lugares, la fecha civil o `null` si ese día es de otro
 * mes. Entre cuatro y seis semanas.
 */
export function semanasDelMes(anio: number, mes: number): (string | null)[][] {
  const primero = aFecha(Date.UTC(anio, mes, 1, 12));
  const dias = new Date(Date.UTC(anio, mes + 1, 0, 12)).getUTCDate();
  const lugares: (string | null)[] = [...Array<null>(diaDeLaSemana(primero)).fill(null)];
  for (let d = 0; d < dias; d++) lugares.push(sumarDias(primero, d));
  while (lugares.length % 7 !== 0) lugares.push(null);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < lugares.length; i += 7) semanas.push(lugares.slice(i, i + 7));
  return semanas;
}

/** Si la fecha entra en los límites del campo (los mismos `min` y `max` que tenía el campo nativo). */
export function dentroDeLosLimites(f: string, min?: string | null, max?: string | null): boolean {
  return (!esFechaCivil(min) || f >= min) && (!esFechaCivil(max) || f <= max);
}

/** La fecha más cercana dentro de los límites. */
export function acotar(f: string, min?: string | null, max?: string | null): string {
  if (esFechaCivil(min) && f < min) return min;
  if (esFechaCivil(max) && f > max) return max;
  return f;
}

/** Las teclas del calendario: las del patrón de la grilla de fechas de WAI-ARIA, con los nombres del teclado. */
export type TeclaDelCalendario = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End' | 'PageUp' | 'PageDown';

/**
 * Adónde lleva una tecla desde la fecha con el foco, sin salir de los límites: flechas, un día o una semana; Inicio y
 * Fin, el lunes y el domingo de esa semana; Re Pág y Av Pág, el mes anterior y el siguiente (con Mayúscula, el año).
 * `null` si la tecla no es del calendario.
 */
export function fechaConLaTecla(f: string, tecla: string, conMayuscula: boolean, min?: string | null, max?: string | null): string | null {
  let nueva: string;
  switch (tecla) {
    case 'ArrowLeft':
      nueva = sumarDias(f, -1);
      break;
    case 'ArrowRight':
      nueva = sumarDias(f, 1);
      break;
    case 'ArrowUp':
      nueva = sumarDias(f, -7);
      break;
    case 'ArrowDown':
      nueva = sumarDias(f, 7);
      break;
    case 'Home':
      nueva = sumarDias(f, -diaDeLaSemana(f));
      break;
    case 'End':
      nueva = sumarDias(f, 6 - diaDeLaSemana(f));
      break;
    case 'PageUp':
      nueva = sumarMeses(f, conMayuscula ? -12 : -1);
      break;
    case 'PageDown':
      nueva = sumarMeses(f, conMayuscula ? 12 : 1);
      break;
    default:
      return null;
  }
  return acotar(nueva, min, max);
}

/** La fecha civil de hoy en Buenos Aires, la misma cuenta que `hoyEn` del seguimiento. */
export function hoyEnBuenosAires(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

export const COPY_CAMPO_DE_FECHA = {
  sinElegir: 'Elegir',
  sinElegirCompleto: 'sin elegir',
  elegir: (etiqueta: string) => `${etiqueta}: elegir la fecha`,
  mesAnterior: 'Mes anterior',
  mesSiguiente: 'Mes siguiente',
  hoy: 'Hoy',
  quitar: 'Quitar la fecha',
  /** Para el día de hoy en la grilla, después de la fecha completa. */
  esHoy: 'hoy',
  ayudaDelTeclado: 'Flechas para moverte, Re Pág y Av Pág para cambiar de mes, Enter para elegir y Escape para cerrar.',
} as const;
