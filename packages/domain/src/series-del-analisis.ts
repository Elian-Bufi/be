/**
 * Lo común a las series de «Analizar» (WP-DASHBOARD-PROFESIONAL §6.3; encargo §8 y §13): semanas, lectura en una fecha,
 * referencia y cambio relativo, comparación de dos períodos, resumen textual y compatibilidad para superponer.
 *
 * Es lógica pura y la usan la API y el website: el número de la tabla, el del panel de lectura y el de la comparación salen
 * de las mismas funciones, así no pueden decir cosas distintas.
 *
 * Reglas:
 * - **Nada se interpola ni se arrastra.** Una fecha sin observación es «sin dato»; el punto más cercano se ofrece solo
 *   si se pide, con su fecha y su distancia (encargo §8).
 * - **El cambio relativo** es `100 × (valor − referencia) / referencia`, con una referencia explícita (rango, regla y n),
 *   positiva, de una métrica de escala de razón. Si no, no se calcula y se dice por qué. Cambiar el zoom no cambia la
 *   referencia: la referencia es un rango de fechas, no lo que se ve.
 * - **Comparar dos períodos** usa la misma regla de resumen en los dos, dice la duración, n y la cobertura de cada uno, y
 *   no compara totales de períodos de distinta duración como si fueran equivalentes (encargo §13).
 */
import type { PuntoAnalitico, SerieAnalitica } from './contratos-analisis';
import type { DefinicionDeMetrica, ResumenDePeriodo } from './metricas-del-analisis';
import { diaSiguiente, diasEntreFechas } from './fechas-civiles';
import { numero } from './formato-numeros';

// ─── Fechas civiles y semanas ───────────────────────────────────────────────────────────────────

const aUtc = (fecha: string): number => Date.parse(`${fecha}T00:00:00Z`);
const deUtc = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const DIA = 86_400_000;

/** El lunes de la semana de una fecha civil (semana de lunes a domingo, como el calendario argentino). */
export function lunesDe(fecha: string): string {
  const ms = aUtc(fecha);
  const diaDeLaSemana = (new Date(ms).getUTCDay() + 6) % 7; // lunes = 0
  return deUtc(ms - diaDeLaSemana * DIA);
}

export const domingoDe = (fecha: string): string => deUtc(aUtc(lunesDe(fecha)) + 6 * DIA);

/** Las fechas civiles de un rango, inclusive. */
export function fechasDelRango(desde: string, hasta: string): string[] {
  const fechas: string[] = [];
  for (let f = desde; f <= hasta; f = diaSiguiente(f)) fechas.push(f);
  return fechas;
}

export interface SemanaDelPeriodo {
  readonly lunes: string;
  readonly domingo: string;
  /** Los días de la semana que caen dentro del período. */
  readonly diasEnElPeriodo: number;
  /** La semana no está entera dentro del período. */
  readonly parcial: boolean;
}

/** Las semanas (de lunes a domingo) que tocan el período, con cuántos de sus días caen adentro. */
export function semanasDelPeriodo(desde: string, hasta: string): SemanaDelPeriodo[] {
  const semanas: SemanaDelPeriodo[] = [];
  for (let lunes = lunesDe(desde); lunes <= hasta; lunes = deUtc(aUtc(lunes) + 7 * DIA)) {
    const domingo = deUtc(aUtc(lunes) + 6 * DIA);
    const inicio = lunes < desde ? desde : lunes;
    const fin = domingo > hasta ? hasta : domingo;
    const dias = diasEntreFechas(inicio, fin) + 1;
    semanas.push({ lunes, domingo, diasEnElPeriodo: dias, parcial: dias < 7 });
  }
  return semanas;
}

/** Los días del rango que no tienen ninguna fecha en `conDato`, agrupados en tramos consecutivos. */
export function huecosDelRango(desde: string, hasta: string, conDato: ReadonlySet<string>): { from: string; to: string; days: number; state: 'NO_DATA' }[] {
  const huecos: { from: string; to: string; days: number; state: 'NO_DATA' }[] = [];
  for (const f of fechasDelRango(desde, hasta)) {
    if (conDato.has(f)) continue;
    const ultimo = huecos[huecos.length - 1];
    if (ultimo && diaSiguiente(ultimo.to) === f) huecos[huecos.length - 1] = { ...ultimo, to: f, days: ultimo.days + 1 };
    else huecos.push({ from: f, to: f, days: 1, state: 'NO_DATA' });
  }
  return huecos;
}

// ─── Lectura en una fecha ───────────────────────────────────────────────────────────────────────

/** Si un punto cubre una fecha: el día del punto, o cualquier día de su semana en el grano semanal. */
export const puntoCubreLaFecha = (p: PuntoAnalitico, fecha: string): boolean => (p.dateEnd ? p.date <= fecha && fecha <= p.dateEnd : p.date === fecha);

export type LecturaEnFecha =
  | { readonly tipo: 'valores'; readonly puntos: readonly PuntoAnalitico[] }
  /** No hay observación en esa fecha. `masCercano` solo está si se pidió, con su fecha y la distancia en días. */
  | { readonly tipo: 'sin-dato'; readonly masCercano: { readonly punto: PuntoAnalitico; readonly distanciaDias: number } | null };

/**
 * Lo que la serie dice en una fecha. Dos observaciones del mismo día son dos (dos tomas siguen siendo dos tomas). Nunca
 * devuelve el punto más cercano como si fuera simultáneo: si se pide, va aparte, con su distancia (PRO-09).
 */
export function lecturaEnFecha(serie: SerieAnalitica, fecha: string, ofrecerMasCercano = false): LecturaEnFecha {
  const puntos = serie.points.filter((p) => puntoCubreLaFecha(p, fecha));
  if (puntos.length > 0) return { tipo: 'valores', puntos };
  if (!ofrecerMasCercano) return { tipo: 'sin-dato', masCercano: null };
  let mejor: { punto: PuntoAnalitico; distanciaDias: number } | null = null;
  for (const p of serie.points) {
    if (p.value === null) continue;
    const distancia = Math.abs(diasEntreFechas(fecha, p.date));
    if (!mejor || distancia < mejor.distanciaDias) mejor = { punto: p, distanciaDias: distancia };
  }
  return { tipo: 'sin-dato', masCercano: mejor };
}

// ─── Referencia y cambio relativo ───────────────────────────────────────────────────────────────

export type MotivoSinReferencia =
  /** La métrica no es de razón (RIR, porcentajes, índices, conteos): el cambio relativo no tiene sentido. */
  | 'ESCALA_NO_ADMITE'
  /** No hay observaciones con valor en el rango de referencia. */
  | 'SIN_OBSERVACIONES'
  /** La referencia es cero o negativa: el cambio relativo no se puede calcular. */
  | 'NO_POSITIVA';

export type Referencia =
  | {
      readonly tipo: 'valida';
      readonly valor: number;
      readonly n: number;
      readonly desde: string;
      readonly hasta: string;
      /** Las fechas efectivas de las observaciones usadas. */
      readonly fechas: readonly string[];
      readonly regla: 'MEDIA' | 'MEDIANA' | 'PRIMERA';
      /** El tramo de la referencia: solo se compara contra puntos del mismo tramo comparable (antropometría). */
      readonly tramo: string | null;
      /** Cuántas observaciones de la referencia son subtotales (nutrición). */
      readonly parciales: number;
      /** Cuántos baldes incompletos del rango quedaron fuera (el día en curso, o una semana que el período corta). */
      readonly incompletos: number;
    }
  | { readonly tipo: 'invalida'; readonly motivo: MotivoSinReferencia; readonly desde: string; readonly hasta: string };

export function mediana(valores: readonly number[]): number {
  const v = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? (v[medio] as number) : ((v[medio - 1] as number) + (v[medio] as number)) / 2;
}

const media = (valores: readonly number[]): number => valores.reduce((s, v) => s + v, 0) / valores.length;

/**
 * La referencia de una serie en un rango, con la regla de la métrica:
 * - nutrición: la media de los días con valor (dice cuántos son subtotales);
 * - entrenamiento: la mediana de las sesiones con valor;
 * - antropometría: la primera observación del rango, y solo se comparan contra ella los puntos de su mismo tramo.
 * Un balde incompleto (el día en curso, o una semana que el período corta) no entra en la media ni en la mediana: su
 * valor todavía no es el de un día o una semana completos. La referencia dice cuántos quedaron fuera.
 */
export function referenciaDeLaSerie(serie: SerieAnalitica, definicion: DefinicionDeMetrica, desde: string, hasta: string): Referencia {
  if (!definicion.cambioRelativo || serie.scale !== 'RATIO') return { tipo: 'invalida', motivo: 'ESCALA_NO_ADMITE', desde, hasta };
  const conValor = serie.points.filter((p) => p.value !== null && p.date >= desde && p.date <= hasta);
  const enRango = conValor.filter((p) => !p.partialBucket);
  const incompletos = conValor.length - enRango.length;
  if (enRango.length === 0) return { tipo: 'invalida', motivo: 'SIN_OBSERVACIONES', desde, hasta };
  let valor: number;
  let usados: readonly PuntoAnalitico[] = enRango;
  let regla: 'MEDIA' | 'MEDIANA' | 'PRIMERA';
  let tramo: string | null = null;
  if (definicion.resumenDePeriodo === 'PRIMERO_Y_ULTIMO_COMPARABLES') {
    const primera = enRango[0] as PuntoAnalitico;
    usados = [primera];
    valor = primera.value as number;
    regla = 'PRIMERA';
    tramo = primera.segment;
  } else if (definicion.resumenDePeriodo === 'MEDIANA') {
    valor = mediana(enRango.map((p) => p.value as number));
    regla = 'MEDIANA';
  } else {
    valor = media(enRango.map((p) => p.value as number));
    regla = 'MEDIA';
  }
  if (!(valor > 0)) return { tipo: 'invalida', motivo: 'NO_POSITIVA', desde, hasta };
  return { tipo: 'valida', valor, n: usados.length, desde, hasta, fechas: usados.map((p) => p.date), regla, tramo, parciales: usados.filter((p) => p.quality === 'PARTIAL').length, incompletos };
}

/** `100 × (valor − referencia) / referencia`. La referencia ya es válida (positiva). */
export const cambioRelativo = (valor: number, referencia: number): number => (100 * (valor - referencia)) / referencia;

export type PuntoRelativo = PuntoAnalitico & {
  /** El cambio relativo, en %; `null` si no se puede calcular para este punto (y `motivoSinRelativo` dice por qué). */
  readonly relativo: number | null;
  readonly motivoSinRelativo: 'SIN_VALOR' | 'OTRO_TRAMO' | null;
};

/** Los puntos con su cambio relativo contra la referencia. Conservan su valor original, su unidad y su fecha. */
export function puntosRelativos(serie: SerieAnalitica, referencia: Extract<Referencia, { tipo: 'valida' }>): PuntoRelativo[] {
  return serie.points.map((p) => {
    if (p.value === null) return { ...p, relativo: null, motivoSinRelativo: 'SIN_VALOR' };
    if (referencia.tramo !== null && p.segment !== referencia.tramo) return { ...p, relativo: null, motivoSinRelativo: 'OTRO_TRAMO' };
    return { ...p, relativo: cambioRelativo(p.value, referencia.valor), motivoSinRelativo: null };
  });
}

// ─── Superposición ──────────────────────────────────────────────────────────────────────────────

export type MotivoSinSuperposicion = 'UNA_SOLA_METRICA' | 'UNIDADES_DISTINTAS' | 'FAMILIAS_DISTINTAS' | 'SIN_FAMILIA';

/**
 * Si las métricas se pueden superponer en valores reales: misma familia de medida **y** misma unidad. Compartir la unidad
 * no alcanza (proteínas y carbohidratos se superponen; un perímetro y un pliegue en cm, no).
 */
export function superposicionPermitida(series: readonly { readonly definicion: DefinicionDeMetrica; readonly unidad: string }[]): { readonly permitida: boolean; readonly motivo: MotivoSinSuperposicion | null } {
  if (series.length < 2) return { permitida: false, motivo: 'UNA_SOLA_METRICA' };
  const familias = series.map((s) => s.definicion.familia);
  if (familias.some((f) => f === null)) return { permitida: false, motivo: 'SIN_FAMILIA' };
  if (new Set(series.map((s) => s.unidad)).size > 1) return { permitida: false, motivo: 'UNIDADES_DISTINTAS' };
  if (new Set(familias).size > 1) return { permitida: false, motivo: 'FAMILIAS_DISTINTAS' };
  return { permitida: true, motivo: null };
}

// ─── Comparación de dos períodos ────────────────────────────────────────────────────────────────

export interface ResumenDeUnPeriodo {
  readonly desde: string;
  readonly hasta: string;
  readonly duracionDias: number;
  readonly regla: ResumenDePeriodo;
  /** El valor resumen con la regla; `null` si no hay observaciones con valor. */
  readonly valor: number | null;
  /** Observaciones con valor que sostienen el resumen (días, sesiones o tomas). */
  readonly n: number;
  /** Observaciones del período (con o sin valor): la cobertura es `n` de `observaciones`. */
  readonly observaciones: number;
  /** Cuántas de las observaciones con valor son subtotales (nutrición). */
  readonly parciales: number;
  /**
   * Baldes incompletos con valor en el rango: el día en curso, o una semana que el período corta. La media y la mediana
   * los dejan fuera (no son días o semanas completos); el total los incluye, porque lo registrado es real, y lo dice.
   */
  readonly incompletos: number;
  /** En antropometría: la primera y la última observación del tramo usado. */
  readonly primero: PuntoAnalitico | null;
  readonly ultimo: PuntoAnalitico | null;
  readonly tramo: string | null;
}

/** El resumen de la serie en un rango, con la regla de la métrica (la misma para los dos períodos). */
export function resumirPeriodo(serie: SerieAnalitica, definicion: DefinicionDeMetrica, desde: string, hasta: string): ResumenDeUnPeriodo {
  const delRango = serie.points.filter((p) => p.date >= desde && p.date <= hasta);
  const conValor = delRango.filter((p) => p.value !== null);
  // La media y la mediana son de días, sesiones o semanas completos: un balde incompleto queda fuera, y se cuenta.
  const completos = conValor.filter((p) => !p.partialBucket);
  const base = {
    desde,
    hasta,
    duracionDias: diasEntreFechas(desde, hasta) + 1,
    regla: definicion.resumenDePeriodo,
    observaciones: delRango.length,
    incompletos: conValor.length - completos.length,
  };
  const vacio = { valor: null, n: 0, parciales: 0, primero: null, ultimo: null, tramo: null };
  if (conValor.length === 0) return { ...base, ...vacio };
  const deCompletos = { parciales: completos.filter((p) => p.quality === 'PARTIAL').length, primero: null, ultimo: null, tramo: null };
  switch (definicion.resumenDePeriodo) {
    case 'MEDIA_DE_DIAS_CON_DATOS':
      if (completos.length === 0) return { ...base, ...vacio };
      return { ...base, ...deCompletos, valor: media(completos.map((p) => p.value as number)), n: completos.length };
    case 'MEDIANA':
      if (completos.length === 0) return { ...base, ...vacio };
      return { ...base, ...deCompletos, valor: mediana(completos.map((p) => p.value as number)), n: completos.length };
    case 'TOTAL':
      return { ...base, valor: conValor.reduce((s, p) => s + (p.value as number), 0), n: conValor.length, parciales: conValor.filter((p) => p.quality === 'PARTIAL').length, primero: null, ultimo: null, tramo: null };
    case 'PRIMERO_Y_ULTIMO_COMPARABLES': {
      // El último tramo con observaciones en el rango: la diferencia se dice solo dentro de un mismo tramo comparable.
      const ultimo = conValor[conValor.length - 1] as PuntoAnalitico;
      const delTramo = conValor.filter((p) => p.segment === ultimo.segment);
      return { ...base, valor: ultimo.value, n: delTramo.length, parciales: 0, primero: delTramo[0] ?? null, ultimo, tramo: ultimo.segment };
    }
  }
}

export type MotivoSinDiferencia = 'SIN_VALOR_EN_ALGUNO' | 'DURACIONES_DISTINTAS' | 'TRAMOS_NO_COMPARABLES' | 'PERIODO_INCOMPLETO';

export interface ComparacionDePeriodos {
  readonly a: ResumenDeUnPeriodo;
  readonly b: ResumenDeUnPeriodo;
  /** B − A, descriptiva y en la unidad de la métrica; `null` con su motivo cuando no corresponde calcularla. */
  readonly diferencia: number | null;
  readonly motivoSinDiferencia: MotivoSinDiferencia | null;
}

/** Dos períodos explícitos con el mismo criterio de resumen. No produce conclusiones causales. */
export function compararPeriodos(serie: SerieAnalitica, definicion: DefinicionDeMetrica, a: { desde: string; hasta: string }, b: { desde: string; hasta: string }): ComparacionDePeriodos {
  const ra = resumirPeriodo(serie, definicion, a.desde, a.hasta);
  const rb = resumirPeriodo(serie, definicion, b.desde, b.hasta);
  if (ra.valor === null || rb.valor === null) return { a: ra, b: rb, diferencia: null, motivoSinDiferencia: 'SIN_VALOR_EN_ALGUNO' };
  // Dos totales de períodos de distinta duración no se restan como si fueran equivalentes (encargo §13).
  if (definicion.resumenDePeriodo === 'TOTAL' && ra.duracionDias !== rb.duracionDias) return { a: ra, b: rb, diferencia: null, motivoSinDiferencia: 'DURACIONES_DISTINTAS' };
  // Un total que incluye el día en curso (o una semana cortada) todavía no es el total de su duración.
  if (definicion.resumenDePeriodo === 'TOTAL' && (ra.incompletos > 0 || rb.incompletos > 0)) return { a: ra, b: rb, diferencia: null, motivoSinDiferencia: 'PERIODO_INCOMPLETO' };
  if (definicion.resumenDePeriodo === 'PRIMERO_Y_ULTIMO_COMPARABLES' && ra.tramo !== rb.tramo) return { a: ra, b: rb, diferencia: null, motivoSinDiferencia: 'TRAMOS_NO_COMPARABLES' };
  return { a: ra, b: rb, diferencia: rb.valor - ra.valor, motivoSinDiferencia: null };
}

// ─── Resumen textual (alternativa al gráfico) ───────────────────────────────────────────────────

const fechaCorta = (f: string): string => `${Number(f.slice(8, 10))}/${Number(f.slice(5, 7))}/${f.slice(0, 4)}`;

/** Un número con la unidad de la métrica y sus decimales. */
export const valorConUnidad = (valor: number, unidad: string, decimales: number): string => `${numero(Number(valor.toFixed(decimales)))} ${unidad}`;

/**
 * El resumen textual de una serie (W3C, imágenes complejas): qué mide, en qué período, cuántas observaciones, la primera
 * y la última con sus fechas, cuántos subtotales y cuántos tramos. No interpreta ni califica.
 */
export function resumenTextual(serie: SerieAnalitica, definicion: DefinicionDeMetrica, desde: string, hasta: string): string {
  const conValor = serie.points.filter((p) => p.value !== null);
  const encabezado = `${serie.label} (${serie.unit}), del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`;
  if (conValor.length === 0) return `${encabezado}: no hay datos en este período.`;
  const primero = conValor[0] as PuntoAnalitico;
  const ultimo = conValor[conValor.length - 1] as PuntoAnalitico;
  const partes = [
    `${numero(conValor.length)} ${conValor.length === 1 ? 'observación con valor' : 'observaciones con valor'}`,
    `la primera, ${valorConUnidad(primero.value as number, serie.unit, definicion.decimales)} el ${fechaCorta(primero.date)}`,
    ...(conValor.length > 1 ? [`la última, ${valorConUnidad(ultimo.value as number, serie.unit, definicion.decimales)} el ${fechaCorta(ultimo.date)}`] : []),
  ];
  const parciales = conValor.filter((p) => p.quality === 'PARTIAL').length;
  if (parciales > 0) partes.push(`${numero(parciales)} ${parciales === 1 ? 'es un subtotal' : 'son subtotales'} de lo registrado`);
  const incompletos = conValor.filter((p) => p.partialBucket).length;
  if (incompletos > 0) partes.push(`${numero(incompletos)} ${incompletos === 1 ? 'es de un día o una semana sin completar' : 'son de días o semanas sin completar'} (el día en curso, o una semana que el período corta)`);
  const sinValor = serie.points.length - conValor.length;
  if (sinValor > 0) partes.push(`${numero(sinValor)} sin valor conocido`);
  const tramos = new Set(conValor.map((p) => p.segment)).size;
  if (tramos > 1) partes.push(`la línea se corta en ${numero(tramos)} tramos`);
  return `${encabezado}: ${partes.join('; ')}.`;
}
