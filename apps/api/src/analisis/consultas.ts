import {
  CalidadDeEntradaSchema,
  ClaveDeProyeccionSchema,
  decodificarCursor,
  DominioDeAnalisisSchema,
  EstadoDeEntradaSchema,
  MetricaDeEntrenamientoSchema,
  MetricaNutricionalSchema,
  TipoDeEventoSchema,
  type CalidadDeEntrada,
  type ClaveDeOrden,
  type ClaveDeProyeccion,
  type DominioDeAnalisis,
  type EstadoDeEntrada,
  type MetricaDeEntrenamiento,
  type MetricaNutricional,
  type TipoDeEvento,
  type ValidationIssue,
} from '@be/domain';
import { errores } from '../http/errores';
import { ZONA_POR_DEFECTO, fechaLocalEn } from '../nutricion/zona';

/**
 * Las consultas de API-DSH-04 y API-PRJ-01, validadas en el guard **antes** del PDP (09 §3): un 400 no depende del
 * titular, no es un oráculo y no deja decisiones registradas. Parámetro desconocido o no aplicable a la clave → 400
 * (09 v0.11 §19). Los valores van solo como identificadores y enumerados: ningún texto clínico viaja en la URL, salvo `q`,
 * que es la búsqueda del propio profesional y no se registra.
 */

/** Hasta un año y un día: el período más largo que lee el entorno profesional (DL-126 y DL-127). */
export const DIAS_MAXIMOS_DEL_ANALISIS = 366;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAVE_DE_EJERCICIO = /^[ev]:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODIGO_ANTROPOMETRICO = /^[a-z0-9-]{1,80}$/;

export interface PeriodoDelAnalisis {
  readonly desde: string;
  readonly hasta: string;
}

const invalida = (code: string, path: string): never => {
  throw errores.solicitudInvalida([{ code, path }]);
};

function sinDesconocidos(query: Record<string, unknown>, permitidos: readonly string[], codigo = 'UNKNOWN_QUERY_PARAMETER'): void {
  const conocidos = new Set(permitidos);
  const issues: ValidationIssue[] = Object.keys(query ?? {})
    .filter((k) => !conocidos.has(k))
    .map((path) => ({ code: codigo, path }));
  if (issues.length > 0) throw errores.solicitudInvalida(issues);
}

/** Un valor de texto simple: un parámetro repetido (`?a=1&a=2`) llega como arreglo y no se acepta. */
function texto(query: Record<string, unknown>, clave: string): string | undefined {
  const v = query[clave];
  if (v === undefined) return undefined;
  if (typeof v !== 'string') return invalida('INVALID_VALUE', clave);
  return v;
}

const fechaReal = (f: string): boolean => FECHA.test(f) && new Date(`${f}T00:00:00Z`).toISOString().slice(0, 10) === f;

const restarDias = (fecha: string, dias: number): string => {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
};

const diasEntre = (desde: string, hasta: string): number => Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000) + 1;

/**
 * El período en fechas civiles del asesorado, inclusive. Sin fechas, los últimos `diasPorDefecto` hasta hoy. Con solo
 * el inicio, llega hasta hoy (o es ese único día, si es futuro); con solo el fin, empieza `diasPorDefecto` antes. Hasta
 * 366 días; el inicio no puede ser posterior al fin.
 */
export function leerPeriodo(query: Record<string, unknown>, diasPorDefecto: number, hoy: string = fechaLocalEn(new Date(), ZONA_POR_DEFECTO)): PeriodoDelAnalisis {
  const inicio = texto(query, 'periodStart');
  const fin = texto(query, 'periodEnd');
  if (inicio !== undefined && !fechaReal(inicio)) invalida('INVALID_DATE', 'periodStart');
  if (fin !== undefined && !fechaReal(fin)) invalida('INVALID_DATE', 'periodEnd');
  const hasta = fin ?? (inicio && inicio > hoy ? inicio : hoy);
  const desde = inicio ?? restarDias(hasta, diasPorDefecto - 1);
  if (desde > hasta) invalida('INVALID_PERIOD', 'periodStart');
  if (diasEntre(desde, hasta) > DIAS_MAXIMOS_DEL_ANALISIS) invalida('PERIOD_TOO_LONG', 'periodEnd');
  return { desde, hasta };
}

/** Una lista separada por comas de un enumerado, sin repetidos. */
function lista<T extends string>(query: Record<string, unknown>, clave: string, valida: (v: string) => v is T): T[] | null {
  const v = texto(query, clave);
  if (v === undefined) return null;
  const partes = v.split(',').map((p) => p.trim());
  if (partes.length === 0 || partes.length > 20 || partes.some((p) => !valida(p))) invalida('INVALID_FILTER', clave);
  return [...new Set(partes as T[])];
}

const de =
  <T extends string>(schema: { safeParse: (v: unknown) => { success: boolean } }) =>
  (v: string): v is T =>
    schema.safeParse(v).success;

// ─── API-DSH-04 ─────────────────────────────────────────────────────────────────────────────────

export const LIMITE_DE_LINEA_DE_TIEMPO = { porDefecto: 20, maximo: 50 } as const;

export interface ConsultaDeLineaDeTiempo {
  readonly periodo: PeriodoDelAnalisis;
  readonly dominios: readonly DominioDeAnalisis[] | null;
  readonly tipos: readonly TipoDeEvento[] | null;
  readonly estados: readonly EstadoDeEntrada[] | null;
  readonly calidades: readonly CalidadDeEntrada[] | null;
  readonly soloTardias: boolean;
  readonly planVersionId: string | null;
  readonly exerciseKey: string | null;
  readonly q: string | null;
  readonly limite: number;
  readonly cursor: ClaveDeOrden | null;
}

const PARAMETROS_DE_LINEA_DE_TIEMPO = ['periodStart', 'periodEnd', 'domain', 'type', 'state', 'quality', 'late', 'planVersionId', 'exerciseId', 'q', 'limit', 'cursor'] as const;

/** La consulta de la línea de tiempo (09 v0.11 §16 y las extensiones de DL-127). Sin período: los últimos 30 días. */
export function leerConsultaDeLineaDeTiempo(query: Record<string, unknown>): ConsultaDeLineaDeTiempo {
  sinDesconocidos(query, PARAMETROS_DE_LINEA_DE_TIEMPO);
  const periodo = leerPeriodo(query, 30);
  const late = texto(query, 'late');
  if (late !== undefined && late !== 'true') invalida('INVALID_FILTER', 'late');
  const planVersionId = texto(query, 'planVersionId') ?? null;
  if (planVersionId !== null && !UUID.test(planVersionId)) invalida('INVALID_FILTER', 'planVersionId');
  const exerciseKey = texto(query, 'exerciseId') ?? null;
  if (exerciseKey !== null && !CLAVE_DE_EJERCICIO.test(exerciseKey)) invalida('INVALID_FILTER', 'exerciseId');
  const q = texto(query, 'q');
  if (q !== undefined && (q.trim().length === 0 || q.length > 100)) invalida('INVALID_FILTER', 'q');
  let limite: number = LIMITE_DE_LINEA_DE_TIEMPO.porDefecto;
  const l = texto(query, 'limit');
  if (l !== undefined) {
    const n = /^\d{1,3}$/.test(l) ? Number(l) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > LIMITE_DE_LINEA_DE_TIEMPO.maximo) invalida('INVALID_LIMIT', 'limit');
    limite = n;
  }
  const c = texto(query, 'cursor');
  const cursor = c === undefined ? null : decodificarCursor(c);
  if (c !== undefined && !cursor) throw errores.cursorInvalido();
  return {
    periodo,
    dominios: lista(query, 'domain', de<DominioDeAnalisis>(DominioDeAnalisisSchema)),
    tipos: lista(query, 'type', de<TipoDeEvento>(TipoDeEventoSchema)),
    estados: lista(query, 'state', de<EstadoDeEntrada>(EstadoDeEntradaSchema)),
    calidades: lista(query, 'quality', de<CalidadDeEntrada>(CalidadDeEntradaSchema)),
    soloTardias: late === 'true',
    planVersionId: planVersionId?.toLowerCase() ?? null,
    exerciseKey: exerciseKey ? `${exerciseKey[0]}:${exerciseKey.slice(2).toLowerCase()}` : null,
    q: q?.trim() ?? null,
    limite,
    cursor,
  };
}

// ─── API-PRJ-01 ─────────────────────────────────────────────────────────────────────────────────

export type ConsultaDeProyeccion =
  | { readonly clave: 'NUTRITION_PRESCRIBED_VS_RECORDED'; readonly periodo: PeriodoDelAnalisis; readonly metrica: MetricaNutricional; readonly grano: 'DAY' | 'WEEK' }
  | {
      readonly clave: 'TRAINING_PROGRESSION_BY_EXERCISE';
      readonly periodo: PeriodoDelAnalisis;
      readonly exerciseKey: string | null;
      readonly metrica: MetricaDeEntrenamiento;
      readonly serie: number | null;
      readonly unidad: 'kg' | 'lb' | null;
      readonly grano: 'ORIGINAL' | 'WEEK';
    }
  | { readonly clave: 'ANTHROPOMETRY_LONGITUDINAL'; readonly periodo: PeriodoDelAnalisis; readonly metricas: readonly string[] | null }
  | { readonly clave: Exclude<ClaveDeProyeccion, 'NUTRITION_PRESCRIBED_VS_RECORDED' | 'TRAINING_PROGRESSION_BY_EXERCISE' | 'ANTHROPOMETRY_LONGITUDINAL'>; readonly periodo: PeriodoDelAnalisis };

/** El período por defecto de una proyección: 12 semanas, el horizonte del encargo. */
export const DIAS_POR_DEFECTO_DE_PROYECCION = 84;

/**
 * La consulta de una proyección. Cada clave acepta solo sus filtros: los demás son «no aplicables» (400, 09 v0.11 §19).
 * Las cinco claves sin especificación aceptan solo el período: no hay derivación a la que aplicar un filtro.
 */
export function leerConsultaDeProyeccion(query: Record<string, unknown>, parametros: Record<string, unknown>): ConsultaDeProyeccion {
  const clave = ClaveDeProyeccionSchema.safeParse(parametros.projectionKey);
  if (!clave.success) invalida('UNKNOWN_PROJECTION_KEY', 'projectionKey');
  const k = clave.data as ClaveDeProyeccion;
  switch (k) {
    case 'NUTRITION_PRESCRIBED_VS_RECORDED': {
      sinDesconocidos(query, ['periodStart', 'periodEnd', 'metric', 'grain'], 'NOT_APPLICABLE_QUERY_PARAMETER');
      const metrica = texto(query, 'metric') ?? 'ENERGY';
      if (!MetricaNutricionalSchema.safeParse(metrica).success) invalida('INVALID_FILTER', 'metric');
      const grano = texto(query, 'grain') ?? 'DAY';
      if (grano !== 'DAY' && grano !== 'WEEK') invalida('INVALID_FILTER', 'grain');
      return { clave: k, periodo: leerPeriodo(query, DIAS_POR_DEFECTO_DE_PROYECCION), metrica: metrica as MetricaNutricional, grano: grano as 'DAY' | 'WEEK' };
    }
    case 'TRAINING_PROGRESSION_BY_EXERCISE': {
      sinDesconocidos(query, ['periodStart', 'periodEnd', 'exerciseId', 'metric', 'setIndex', 'unit', 'grain'], 'NOT_APPLICABLE_QUERY_PARAMETER');
      const exerciseKey = texto(query, 'exerciseId') ?? null;
      if (exerciseKey !== null && !CLAVE_DE_EJERCICIO.test(exerciseKey)) invalida('INVALID_FILTER', 'exerciseId');
      const metrica = texto(query, 'metric') ?? 'LOAD';
      if (!MetricaDeEntrenamientoSchema.safeParse(metrica).success) invalida('INVALID_FILTER', 'metric');
      const s = texto(query, 'setIndex');
      const serie = s === undefined ? null : /^\d{1,2}$/.test(s) && Number(s) >= 1 && Number(s) <= 30 ? Number(s) : invalida('INVALID_FILTER', 'setIndex');
      const unidad = texto(query, 'unit') ?? null;
      if (unidad !== null && unidad !== 'kg' && unidad !== 'lb') invalida('INVALID_FILTER', 'unit');
      const grano = texto(query, 'grain') ?? 'ORIGINAL';
      if (grano !== 'ORIGINAL' && grano !== 'WEEK') invalida('INVALID_FILTER', 'grain');
      // La semana solo agrega conteos: la carga, las repeticiones y el RIR de una serie no se suman ni se promedian.
      if (grano === 'WEEK' && metrica !== 'SETS_RECORDED') invalida('GRAIN_NOT_ALLOWED', 'grain');
      if (metrica === 'SETS_RECORDED' && serie !== null) invalida('NOT_APPLICABLE_QUERY_PARAMETER', 'setIndex');
      if (metrica !== 'LOAD' && unidad !== null) invalida('NOT_APPLICABLE_QUERY_PARAMETER', 'unit');
      if (exerciseKey === null && (s !== undefined || unidad !== null)) invalida('EXERCISE_REQUIRED', 'exerciseId');
      return {
        clave: k,
        periodo: leerPeriodo(query, DIAS_POR_DEFECTO_DE_PROYECCION),
        exerciseKey: exerciseKey ? `${exerciseKey[0]}:${exerciseKey.slice(2).toLowerCase()}` : null,
        metrica: metrica as MetricaDeEntrenamiento,
        serie: metrica === 'SETS_RECORDED' ? null : (serie ?? 1),
        unidad: unidad as 'kg' | 'lb' | null,
        grano: grano as 'ORIGINAL' | 'WEEK',
      };
    }
    case 'ANTHROPOMETRY_LONGITUDINAL': {
      sinDesconocidos(query, ['periodStart', 'periodEnd', 'metric'], 'NOT_APPLICABLE_QUERY_PARAMETER');
      const m = texto(query, 'metric');
      const metricas = m === undefined ? null : [...new Set(m.split(',').map((x) => x.trim()))];
      if (metricas && (metricas.length === 0 || metricas.length > 3 || metricas.some((x) => !CODIGO_ANTROPOMETRICO.test(x)))) invalida('INVALID_FILTER', 'metric');
      return { clave: k, periodo: leerPeriodo(query, DIAS_POR_DEFECTO_DE_PROYECCION), metricas };
    }
    default:
      sinDesconocidos(query, ['periodStart', 'periodEnd'], 'NOT_APPLICABLE_QUERY_PARAMETER');
      return { clave: k, periodo: leerPeriodo(query, DIAS_POR_DEFECTO_DE_PROYECCION) };
  }
}
