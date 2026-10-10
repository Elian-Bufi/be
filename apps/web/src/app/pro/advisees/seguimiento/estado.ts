/**
 * El estado del entorno profesional de seguimiento en la URL (ESPECIFICACION.md §1): volver con el navegador o con
 * «Volver al análisis» recupera la misma selección. En la URL solo hay identificadores opacos, enumerados y fechas:
 * nunca un texto clínico. La búsqueda libre de la línea de tiempo NO viaja en la URL de la página (DL-127).
 */
import {
  CalidadDeEntradaSchema,
  DominioDeAnalisisSchema,
  EstadoDeEntradaSchema,
  PreguntaElegidaSchema,
  TipoDeEventoSchema,
  type CalidadDeEntrada,
  type DominioDeAnalisis,
  type EstadoDeEntrada,
  type PreguntaElegida,
  type ReferenciaDeMetrica,
  type ReferenciaDelCambio,
  type TipoDeEvento,
} from '@be/domain';

export const VISTAS_DEL_SEGUIMIENTO = [
  { clave: 'resumen', texto: 'Resumen', icono: 'resumen' },
  { clave: 'linea', texto: 'Línea de tiempo', icono: 'linea-de-tiempo' },
  { clave: 'analizar', texto: 'Analizar', icono: 'analizar' },
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
  /**
   * La referencia del cambio relativo, explícita: los primeros N días del **período** o un rango fijo de fechas. No
   * depende del intervalo que se ve: acercar, alejar o restablecer el gráfico no la cambia (DL-126). Solo cambia con
   * una acción explícita («Aplicar» en la referencia), y queda en la URL y en las vistas guardadas.
   */
  readonly referencia: ReferenciaDelCambio;
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
  const cmp = (params.get('cmp') ?? '').split('_');
  const comparacion = cmp.length === 4 && cmp.every(fechaValida) && cmp[0]! <= cmp[1]! && cmp[2]! <= cmp[3]! ? { a: { desde: cmp[0]!, hasta: cmp[1]! }, b: { desde: cmp[2]!, hasta: cmp[3]! } } : null;
  const capas = params.get('capas');
  return {
    metricas,
    modo: MODOS[params.get('modo') ?? ''] ?? 'PANELS',
    grano: GRANOS[params.get('g') ?? ''] ?? 'DAY',
    bandas: capas === null ? true : capas.includes('b'),
    eventos: capas === null ? true : capas.includes('e'),
    referencia: leerReferenciaDelCambio(params.get('ref')),
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
    ref: parametroDeReferenciaDelCambio(a.referencia),
    f: a.fecha,
    cmp: a.comparacion ? [a.comparacion.a.desde, a.comparacion.a.hasta, a.comparacion.b.desde, a.comparacion.b.hasta].join('_') : null,
  };
}

/** La referencia por defecto: los primeros 7 días del período. */
export const REFERENCIA_POR_DEFECTO: ReferenciaDelCambio = { kind: 'FIRST_DAYS', days: 7 };

/** `ref=N` (los primeros N días, de 1 a 31) o `ref=AAAA-MM-DD_AAAA-MM-DD` (un rango fijo). Si no vale, la de por defecto. */
export function leerReferenciaDelCambio(v: string | null): ReferenciaDelCambio {
  if (v === null) return REFERENCIA_POR_DEFECTO;
  if (/^[0-9]{1,2}$/.test(v)) {
    const dias = Number(v);
    return dias >= 1 && dias <= 31 ? { kind: 'FIRST_DAYS', days: dias } : REFERENCIA_POR_DEFECTO;
  }
  const partes = v.split('_');
  const [inicio = null, fin = null] = partes;
  return partes.length === 2 && fechaValida(inicio) && fechaValida(fin) && inicio <= fin ? { kind: 'RANGE', start: inicio, end: fin } : REFERENCIA_POR_DEFECTO;
}

export function parametroDeReferenciaDelCambio(r: ReferenciaDelCambio): string | null {
  if (r.kind === 'RANGE') return `${r.start}_${r.end}`;
  return r.days === 7 ? null : String(r.days);
}

/** La clave estable de una referencia elegida (colores, claves de React y comparar selecciones). */
export const claveDeLaReferencia = (r: ReferenciaDeMetrica): string => codificarReferencia(r);

// ─── Pregunta profesional (encargo del 2026-10-09, eje 2) ───────────────────────────────────────

/**
 * La pregunta elegida y sus parámetros en la URL, solo identificadores: `pregunta`, `area`, `version`, `etapaA`, `etapaB`,
 * `medida`, `ejercicio`, `serie` y `unidad`. Lo que no valida con el esquema del dominio se descarta entero.
 */
export function leerPregunta(params: URLSearchParams): PreguntaElegida | null {
  const id = params.get('pregunta');
  if (!id) return null;
  const serie = params.get('serie');
  const candidato = {
    id,
    params: Object.fromEntries(
      Object.entries({
        area: params.get('area'),
        planVersionId: params.get('version'),
        stageA: params.get('etapaA'),
        stageB: params.get('etapaB'),
        bodyMetric: params.get('medida'),
        exerciseKey: params.get('ejercicio'),
        setIndex: serie && /^[0-9]{1,2}$/.test(serie) ? Number(serie) : serie,
        unit: params.get('unidad'),
      }).filter(([, v]) => v !== null && v !== ''),
    ),
  };
  const r = PreguntaElegidaSchema.safeParse(candidato);
  return r.success ? r.data : null;
}

export function parametrosDePregunta(p: PreguntaElegida | null): Record<string, string | null> {
  const x = p?.params ?? {};
  return {
    pregunta: p?.id ?? null,
    area: x.area ?? null,
    version: x.planVersionId ?? null,
    etapaA: x.stageA ?? null,
    etapaB: x.stageB ?? null,
    medida: x.bodyMetric ?? null,
    ejercicio: x.exerciseKey ?? null,
    serie: x.setIndex === undefined ? null : String(x.setIndex),
    unidad: x.unit ?? null,
  };
}

// ─── Novedades desde un corte en la línea de tiempo (eje 1) ─────────────────────────────────────

const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

/** `novedades=<instante>`: el corte de una revisión (lo que trae algo nuevo desde entonces). No es texto: es un instante. */
export function leerCorte(params: URLSearchParams): string | null {
  const v = params.get('novedades');
  return v && INSTANTE.test(v) && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;
}

// ─── Retorno a la ficha desde otra pantalla (eje 5) ─────────────────────────────────────────────

/**
 * El valor de `volver` para salir de la ficha hacia una pestaña de área y regresar al mismo lugar: la query de la ficha
 * sin el `id` (que ya va en la URL de destino). Solo identificadores, enumerados y fechas: nada escrito por la persona.
 * Nunca vacío: la ficha en su estado inicial también es un lugar al que volver (`vista=resumen`), y sin `volver` la pestaña
 * de área no ofrecía «Volver a la ficha, donde estabas».
 */
export function valorDeRetorno(params: URLSearchParams): string {
  const p = new URLSearchParams(params.toString());
  p.delete('id');
  p.delete('volver');
  if (!p.has('vista')) p.set('vista', 'resumen');
  return p.toString();
}

/**
 * La URL de regreso a la ficha a partir de `volver`, reconstruida con los mismos lectores de la ficha: lo que no valida se
 * descarta y nunca se sale de `/pro/advisees` del mismo asesorado (la misma idea que el retorno seguro del login).
 */
export function retornoALaFicha(valor: string | null, id: string): string | null {
  if (valor === null || !UUID.test(id) || valor.length > 2000) return null;
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(valor);
  } catch {
    return null;
  }
  const vista = leerVista(p.get('vista'));
  const periodo = p.get('p') || p.get('desde') ? parametrosDePeriodo(leerPeriodo(p)) : {};
  const corte = leerCorte(p);
  const cambios: Record<string, string | null> = {
    vista: vista === 'resumen' ? null : vista,
    ...periodo,
    ...(vista === 'linea' ? { ...parametrosDeFiltros(leerFiltrosDeLaLinea(p)), novedades: corte } : {}),
    ...(vista === 'analizar' ? { ...parametrosDeAnalisis(leerAnalisis(p)), ...parametrosDePregunta(leerPregunta(p)), vista: 'analizar' } : {}),
  };
  return hrefConCambios('/pro/advisees', new URLSearchParams({ id }), cambios);
}

/** Agrega `volver` a una URL interna (la de una pestaña de área), si hay a dónde volver. */
export const conRetorno = (href: string, volver: string | null): string => (volver ? `${href}${href.includes('?') ? '&' : '?'}volver=${encodeURIComponent(volver)}` : href);
