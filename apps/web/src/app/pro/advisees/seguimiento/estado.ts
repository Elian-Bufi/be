/**
 * El estado del entorno profesional de seguimiento en la URL (ESPECIFICACION.md §1): volver con el navegador o con
 * «Volver al análisis» recupera la misma selección. En la URL solo hay identificadores opacos, enumerados y fechas:
 * nunca un texto clínico. La búsqueda libre de la línea de tiempo NO viaja en la URL de la página (DL-127).
 */
import {
  CalidadDeEntradaSchema,
  DominioDeAnalisisSchema,
  EstadoDeEntradaSchema,
  TipoDeEventoSchema,
  type CalidadDeEntrada,
  type DominioDeAnalisis,
  type EstadoDeEntrada,
  type ReferenciaDeMetrica,
  type TipoDeEvento,
} from '@be/domain';

export const VISTAS_DEL_SEGUIMIENTO = [
  { clave: 'resumen', texto: 'Resumen' },
  { clave: 'linea', texto: 'Línea de tiempo' },
  { clave: 'analizar', texto: 'Analizar' },
] as const;
export type VistaDelSeguimiento = (typeof VISTAS_DEL_SEGUIMIENTO)[number]['clave'];

export const leerVista = (v: string | null): VistaDelSeguimiento => (VISTAS_DEL_SEGUIMIENTO.some((x) => x.clave === v) ? (v as VistaDelSeguimiento) : 'resumen');

// ─── Período compartido ─────────────────────────────────────────────────────────────────────────

export const PRESETS_DE_PERIODO = [
  { dias: 7, texto: '7 días' },
  { dias: 30, texto: '30 días' },
  { dias: 90, texto: '90 días' },
  { dias: 365, texto: '1 año' },
] as const;
export type DiasDePreset = (typeof PRESETS_DE_PERIODO)[number]['dias'];
export const PRESET_POR_DEFECTO: DiasDePreset = 90;

export interface Periodo {
  /** El preset elegido, o `null` si es un rango propio. */
  readonly preset: DiasDePreset | null;
  readonly desde: string;
  readonly hasta: string;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaValida = (f: string | null): f is string => !!f && FECHA.test(f) && new Date(`${f}T00:00:00Z`).toISOString().slice(0, 10) === f;

/** La fecha civil de hoy en la zona del asesorado (la de la demostración, DL-009). */
export function hoyEn(zona = 'America/Argentina/Buenos_Aires'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function restarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

export const diasEntre = (desde: string, hasta: string): number => Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000) + 1;

/** El período de la URL: `p=7|30|90|365`, o un rango propio `desde`/`hasta` (hasta 366 días). Si algo no vale, el preset. */
export function leerPeriodo(params: URLSearchParams, hoy: string = hoyEn()): Periodo {
  const desde = params.get('desde');
  const hasta = params.get('hasta');
  if (fechaValida(desde) && fechaValida(hasta) && desde <= hasta && diasEntre(desde, hasta) <= 366) return { preset: null, desde, hasta };
  const p = Number(params.get('p'));
  const preset = (PRESETS_DE_PERIODO.find((x) => x.dias === p)?.dias ?? PRESET_POR_DEFECTO) as DiasDePreset;
  return { preset, desde: restarDias(hoy, preset - 1), hasta: hoy };
}

export function parametrosDePeriodo(p: Periodo): Record<string, string | null> {
  return p.preset ? { p: String(p.preset), desde: null, hasta: null } : { p: null, desde: p.desde, hasta: p.hasta };
}

/** El período como instantes para API-DSH-03, que lee `momento_de_ocurrencia` (UTC−3 en la demostración). */
export const periodoEnInstantes = (p: Periodo) => ({ periodStart: `${p.desde}T00:00:00.000-03:00`, periodEnd: `${p.hasta}T23:59:59.999-03:00` });

/** La URL de la ficha con cambios: `null` quita el parámetro; lo demás se conserva. */
export function hrefConCambios(ruta: string, actuales: URLSearchParams, cambios: Readonly<Record<string, string | null>>): string {
  const p = new URLSearchParams(actuales.toString());
  for (const [k, v] of Object.entries(cambios)) {
    if (v === null || v === '') p.delete(k);
    else p.set(k, v);
  }
  // `id` primero: es la ruta que reconoce el retorno seguro (destinoSeguro).
  const id = p.get('id');
  p.delete('id');
  const resto = p.toString();
  return `${ruta}?id=${encodeURIComponent(id ?? '')}${resto ? `&${resto}` : ''}`;
}

// ─── Línea de tiempo ────────────────────────────────────────────────────────────────────────────

export interface FiltrosDeLaLinea {
  readonly dominios: readonly DominioDeAnalisis[];
  readonly tipos: readonly TipoDeEvento[];
  readonly estados: readonly EstadoDeEntrada[];
  readonly calidades: readonly CalidadDeEntrada[];
  readonly soloTardias: boolean;
  readonly planVersionId: string | null;
  readonly exerciseKey: string | null;
}

const lista = <T extends string>(valor: string | null, valida: (v: string) => boolean): T[] => (valor ? [...new Set(valor.split(','))].filter(valida) as T[] : []);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAVE_DE_EJERCICIO = /^[ev]:[0-9a-f-]{36}$/i;

export function leerFiltrosDeLaLinea(params: URLSearchParams): FiltrosDeLaLinea {
  return {
    dominios: lista<DominioDeAnalisis>(params.get('areas'), (v) => DominioDeAnalisisSchema.safeParse(v).success),
    tipos: lista<TipoDeEvento>(params.get('tipos'), (v) => TipoDeEventoSchema.safeParse(v).success),
    estados: lista<EstadoDeEntrada>(params.get('estados'), (v) => EstadoDeEntradaSchema.safeParse(v).success),
    calidades: lista<CalidadDeEntrada>(params.get('calidad'), (v) => CalidadDeEntradaSchema.safeParse(v).success),
    soloTardias: params.get('tardias') === '1',
    planVersionId: UUID.test(params.get('plan') ?? '') ? params.get('plan') : null,
    exerciseKey: CLAVE_DE_EJERCICIO.test(params.get('ej') ?? '') ? params.get('ej') : null,
  };
}

export function parametrosDeFiltros(f: FiltrosDeLaLinea): Record<string, string | null> {
  return {
    areas: f.dominios.length ? f.dominios.join(',') : null,
    tipos: f.tipos.length ? f.tipos.join(',') : null,
    estados: f.estados.length ? f.estados.join(',') : null,
    calidad: f.calidades.length ? f.calidades.join(',') : null,
    tardias: f.soloTardias ? '1' : null,
    plan: f.planVersionId,
    ej: f.exerciseKey,
  };
}

export const SIN_FILTROS: FiltrosDeLaLinea = { dominios: [], tipos: [], estados: [], calidades: [], soloTardias: false, planVersionId: null, exerciseKey: null };

// ─── Analizar ───────────────────────────────────────────────────────────────────────────────────

export type Modo = 'PANELS' | 'OVERLAY' | 'RELATIVE';
export type GranoElegido = 'ORIGINAL' | 'DAY' | 'WEEK';

export interface EstadoDeAnalisis {
  readonly metricas: readonly ReferenciaDeMetrica[];
  readonly modo: Modo;
  /** El grano pedido; cada métrica usa el que admite (el original para tomas y sesiones). */
  readonly grano: GranoElegido;
  readonly bandas: boolean;
  readonly eventos: boolean;
  /** La referencia del cambio relativo: los primeros N días del período. */
  readonly diasDeReferencia: number;
  readonly fecha: string | null;
  readonly comparacion: { readonly a: { readonly desde: string; readonly hasta: string }; readonly b: { readonly desde: string; readonly hasta: string } } | null;
}

const MODOS: Readonly<Record<string, Modo>> = { P: 'PANELS', S: 'OVERLAY', R: 'RELATIVE' };
const LETRA_DE_MODO: Readonly<Record<Modo, string>> = { PANELS: 'P', OVERLAY: 'S', RELATIVE: 'R' };
const GRANOS: Readonly<Record<string, GranoElegido>> = { O: 'ORIGINAL', D: 'DAY', W: 'WEEK' };
const LETRA_DE_GRANO: Readonly<Record<GranoElegido, string>> = { ORIGINAL: 'O', DAY: 'D', WEEK: 'W' };
const METRICA = /^(nutricion|entrenamiento|antropometria)\.[a-z0-9-]+$/;

/** `metricId~exerciseKey~serie~unidad`, con los vacíos sin escribir: `nutricion.energia`, `entrenamiento.carga~e:…~2~kg`. */
export function codificarReferencia(r: ReferenciaDeMetrica): string {
  const partes = [r.metricId, r.exerciseKey ?? '', r.setIndex === null ? '' : String(r.setIndex), r.unit ?? ''];
  while (partes.length > 1 && partes[partes.length - 1] === '') partes.pop();
  return partes.join('~');
}

export function decodificarReferencia(s: string): ReferenciaDeMetrica | null {
  const [metricId = '', exerciseKey = '', serie = '', unidad = ''] = s.split('~');
  if (!METRICA.test(metricId)) return null;
  if (exerciseKey && !CLAVE_DE_EJERCICIO.test(exerciseKey)) return null;
  const setIndex = serie === '' ? null : Number(serie);
  if (setIndex !== null && (!Number.isInteger(setIndex) || setIndex < 1 || setIndex > 30)) return null;
  if (unidad && unidad !== 'kg' && unidad !== 'lb') return null;
  return { metricId, exerciseKey: exerciseKey || null, setIndex, unit: (unidad || null) as 'kg' | 'lb' | null };
}

export function leerAnalisis(params: URLSearchParams): EstadoDeAnalisis {
  const metricas = (params.get('m') ?? '')
    .split(',')
    .filter(Boolean)
    .map(decodificarReferencia)
    .filter((r): r is ReferenciaDeMetrica => r !== null)
    .slice(0, 3);
  const ref = Number(params.get('ref'));
  const cmp = (params.get('cmp') ?? '').split('_');
  const comparacion = cmp.length === 4 && cmp.every(fechaValida) && cmp[0]! <= cmp[1]! && cmp[2]! <= cmp[3]! ? { a: { desde: cmp[0]!, hasta: cmp[1]! }, b: { desde: cmp[2]!, hasta: cmp[3]! } } : null;
  const capas = params.get('capas');
  return {
    metricas,
    modo: MODOS[params.get('modo') ?? ''] ?? 'PANELS',
    grano: GRANOS[params.get('g') ?? ''] ?? 'DAY',
    bandas: capas === null ? true : capas.includes('b'),
    eventos: capas === null ? true : capas.includes('e'),
    diasDeReferencia: Number.isInteger(ref) && ref >= 1 && ref <= 31 ? ref : 7,
    fecha: fechaValida(params.get('f')) ? params.get('f') : null,
    comparacion,
  };
}

export function parametrosDeAnalisis(a: EstadoDeAnalisis): Record<string, string | null> {
  return {
    m: a.metricas.length ? a.metricas.map(codificarReferencia).join(',') : null,
    modo: a.modo === 'PANELS' ? null : LETRA_DE_MODO[a.modo],
    g: a.grano === 'DAY' ? null : LETRA_DE_GRANO[a.grano],
    capas: a.bandas && a.eventos ? null : `${a.bandas ? 'b' : ''}${a.eventos ? 'e' : ''}` || '-',
    ref: a.diasDeReferencia === 7 ? null : String(a.diasDeReferencia),
    f: a.fecha,
    cmp: a.comparacion ? [a.comparacion.a.desde, a.comparacion.a.hasta, a.comparacion.b.desde, a.comparacion.b.hasta].join('_') : null,
  };
}

/** La clave estable de una referencia elegida (colores, claves de React y comparar selecciones). */
export const claveDeLaReferencia = (r: ReferenciaDeMetrica): string => codificarReferencia(r);
