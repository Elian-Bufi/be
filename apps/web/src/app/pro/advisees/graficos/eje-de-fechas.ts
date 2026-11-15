/**
 * El eje de fechas común de los gráficos (WP-GRAFICOS fase 2, DL-174): una sola escala del tiempo para todos los
 * carriles de un gráfico y, con el cursor compartido, para todos los gráficos de una página. Cada día ocupa su lugar y
 * una fecha cae en su mediodía (`mediodia`), como en el minigráfico y en «Analizar»; un punto con hora va a su hora si
 * cae en su día, y una semana, a su mitad (`xDe`).
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import { DIA, mediodia } from '../seguimiento/geometria';
import type { PuntoDelCarril } from './carriles';

export interface PeriodoDelGrafico {
  readonly desde: string;
  readonly hasta: string;
  readonly hoy: string;
  /** El primer día del acompañamiento (TB-16): lo anterior no se dibuja. `null` si no se sabe. */
  readonly desdeElVinculo: string | null;
}

export interface MarcaDeFecha {
  readonly fecha: string;
  readonly x: number;
  readonly texto: string;
}

export interface EscalaDeFechas {
  /** El primer día que se dibuja: el del período o, si es posterior, el del vínculo. */
  readonly desde: string;
  readonly hasta: string;
  /** El mediodía de la fecha. */
  readonly x: (fecha: string) => number;
  /** La hora si la tiene y cae en su día; la semana, a su mitad (como `xDe`). */
  readonly xDePunto: (p: Pick<PuntoDelCarril, 'fecha' | 'hasta' | 'en'>) => number;
  readonly fechaDeX: (x: number) => string;
  /** Las marcas del eje, sin pisarse. */
  readonly marcas: readonly MarcaDeFecha[];
  /** Píxeles por día: decide el tamaño de las marcas (`medidaDeMarca`). */
  readonly porDia: number;
  readonly izquierda: number;
  readonly derecha: number;
}

const fechaDe = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** El primer día que se dibuja: lo anterior al vínculo no se dibuja (TB-16; GR-D6). */
export function inicioDelEje(p: Pick<PeriodoDelGrafico, 'desde' | 'desdeElVinculo'>): string {
  return p.desdeElVinculo !== null && p.desdeElVinculo > p.desde ? p.desdeElVinculo : p.desde;
}

/** Si el período pedido empieza antes del vínculo: la pantalla lo dice («La historia empieza el día que…»). */
export const empiezaAntesDelVinculo = (p: Pick<PeriodoDelGrafico, 'desde' | 'desdeElVinculo'>): boolean => p.desdeElVinculo !== null && p.desdeElVinculo > p.desde;

/** Lo que separa dos marcas del eje, como mínimo: con la letra de 12,5 px, «30/12» entra holgado. */
export const SEPARACION_MINIMA_DE_MARCAS = 56;

const PASOS_EN_DIAS = [1, 2, 7, 14] as const;

/** Las fechas que llevan marca: cada 1, 2, 7 o 14 días (los lunes desde la semana) o el primero de cada mes o trimestre. */
function fechasDeLasMarcas(desde: string, hasta: string, porDia: number): string[] {
  const dias = Math.round((mediodia(hasta) - mediodia(desde)) / DIA) + 1;
  const todas = Array.from({ length: dias }, (_, i) => fechaDe(mediodia(desde) + i * DIA));
  const paso = PASOS_EN_DIAS.find((n) => n * porDia >= SEPARACION_MINIMA_DE_MARCAS);
  if (paso === 1 || paso === 2) return todas.filter((_, i) => i % paso === 0);
  if (paso !== undefined) {
    const lunes = todas.filter((f) => new Date(`${f}T12:00:00Z`).getUTCDay() === 1);
    return paso === 7 ? lunes : lunes.filter((_, i) => i % 2 === 0);
  }
  const primeros = todas.filter((f) => f.endsWith('-01'));
  return 30 * porDia >= SEPARACION_MINIMA_DE_MARCAS ? primeros : primeros.filter((f) => (Number(f.slice(5, 7)) - 1) % 3 === 0);
}

/** «3/11»: el día y el mes, como el resto del espacio profesional. */
export const textoDeLaMarca = (fecha: string): string => `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;

/** La escala de un período en una caja horizontal (en píxeles, de `izquierda` a `derecha`). */
export function escalaDeFechas(p: PeriodoDelGrafico, caja: { readonly izquierda: number; readonly derecha: number }): EscalaDeFechas {
  const desde = inicioDelEje(p);
  const hasta = p.hasta < desde ? desde : p.hasta;
  const inicio = mediodia(desde) - DIA / 2;
  const fin = mediodia(hasta) + DIA / 2;
  const ancho = Math.max(1, caja.derecha - caja.izquierda);
  const deMs = (ms: number): number => caja.izquierda + ((ms - inicio) / (fin - inicio)) * ancho;
  const porDia = ancho / ((fin - inicio) / DIA);
  const x = (fecha: string): number => deMs(mediodia(fecha));
  const xDePunto = (q: Pick<PuntoDelCarril, 'fecha' | 'hasta' | 'en'>): number => {
    if (q.hasta) return deMs(mediodia(q.fecha) + 3 * DIA);
    if (q.en) {
      const ms = Date.parse(q.en);
      if (Number.isFinite(ms) && Math.abs(ms - mediodia(q.fecha)) < DIA / 2) return deMs(ms);
    }
    return x(q.fecha);
  };
  const fechaDeX = (px: number): string => {
    const ms = inicio + ((px - caja.izquierda) / ancho) * (fin - inicio);
    const acotado = Math.min(Math.max(ms, inicio), fin - 1);
    return fechaDe(mediodia(fechaDe(acotado)));
  };
  const marcas = fechasDeLasMarcas(desde, hasta, porDia).map((fecha) => ({ fecha, x: x(fecha), texto: textoDeLaMarca(fecha) }));
  return { desde, hasta, x, xDePunto, fechaDeX, marcas, porDia, izquierda: caja.izquierda, derecha: caja.derecha };
}

/**
 * Los tramos de una lectura larga (`leerEnTramos`): el período partido en tramos de hasta `diasPorLectura` días, sin días
 * repetidos ni perdidos.
 */
export function tramosDe(desde: string, hasta: string, diasPorLectura: number): readonly { readonly desde: string; readonly hasta: string }[] {
  if (hasta < desde || diasPorLectura < 1) return [];
  const tramos: { desde: string; hasta: string }[] = [];
  for (let inicio = mediodia(desde); inicio <= mediodia(hasta); inicio += diasPorLectura * DIA) {
    const fin = Math.min(inicio + (diasPorLectura - 1) * DIA, mediodia(hasta));
    tramos.push({ desde: fechaDe(inicio), hasta: fechaDe(fin) });
  }
  return tramos;
}

/** Lo que elige el cursor: una fecha, o un tramo (con Mayúscula y flechas). */
export interface CursorDeFechas {
  readonly fecha: string | null;
  readonly tramo: { readonly desde: string; readonly hasta: string } | null;
}

/**
 * El cursor con el teclado, sobre las fechas con alguna observación en algún carril: flechas, la anterior o la
 * siguiente; Inicio y Fin; Mayúscula con flechas arma un tramo desde la fecha elegida; Escape lo suelta. `null` si la
 * tecla no es del cursor.
 */
export function moverElCursor(fechas: readonly string[], cursor: CursorDeFechas, tecla: string, conMayuscula: boolean): CursorDeFechas | null {
  if (tecla === 'Escape') return cursor.fecha === null && cursor.tramo === null ? null : { fecha: cursor.tramo ? cursor.fecha : null, tramo: null };
  if (fechas.length === 0) return null;
  const actual = cursor.fecha === null ? -1 : fechas.indexOf(cursor.fecha);
  let indice: number;
  if (tecla === 'Home') indice = 0;
  else if (tecla === 'End') indice = fechas.length - 1;
  else if (tecla === 'ArrowRight' || tecla === 'ArrowDown') indice = actual < 0 ? 0 : Math.min(actual + 1, fechas.length - 1);
  else if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') indice = actual < 0 ? fechas.length - 1 : Math.max(actual - 1, 0);
  else return null;
  const fecha = fechas[indice];
  if (!conMayuscula || cursor.fecha === null) return { fecha, tramo: null };
  const ancla = cursor.tramo ? (cursor.tramo.desde === cursor.fecha ? cursor.tramo.hasta : cursor.tramo.desde) : cursor.fecha;
  return { fecha, tramo: ancla <= fecha ? { desde: ancla, hasta: fecha } : { desde: fecha, hasta: ancla } };
}
