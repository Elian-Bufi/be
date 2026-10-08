/**
 * La línea de tiempo (API-DSH-04; 09 v0.11 §16; B10-08 §11-§12; DL-127), como lógica pura: el orden, el cursor, los filtros
 * y la búsqueda. La API compone las entradas desde las fuentes autorizadas y usa estas funciones; el website las usa para
 * agrupar por día. Así el orden y el filtro son los mismos en los dos lados.
 *
 * - **El orden representa la fecha del hecho**, no la llegada al servidor (encargo §7): fecha civil del hecho
 *   descendente; dentro del día, los hechos con hora por su hora y después los que solo tienen fecha; los empates, por
 *   el momento de registro y por el identificador. Es un orden total, así la paginación es estable.
 * - **Una carga tardía** (registrada en un día civil posterior al del hecho) se marca y se ordena por su hecho.
 * - **La búsqueda** recorre todo el conjunto autorizado del período: título y detalles visibles, sin distinguir
 *   mayúsculas ni acentos.
 */
import { CalidadDeEntradaSchema, TIPOS_DE_EVENTO, type CalidadDeEntrada, type ConteosDelPeriodo, type DominioDeAnalisis, type EntradaDeLineaDeTiempo, type EstadoDeEntrada, type TipoDeEvento } from './contratos-analisis';
import { fechaCivil } from './fechas-civiles';

/** Compara dos entradas en el orden de la línea de tiempo (la primera del resultado es la más reciente). */
export function compararEntradas(a: EntradaDeLineaDeTiempo, b: EntradaDeLineaDeTiempo): number {
  if (a.occurredDate !== b.occurredDate) return a.occurredDate < b.occurredDate ? 1 : -1;
  // Dentro del día: primero los que tienen hora (por hora, de la más reciente), después los que solo tienen fecha.
  if (a.occurredAt !== b.occurredAt) {
    if (a.occurredAt === null) return 1;
    if (b.occurredAt === null) return -1;
    const ta = Date.parse(a.occurredAt);
    const tb = Date.parse(b.occurredAt);
    if (ta !== tb) return ta < tb ? 1 : -1;
  }
  if (a.recordedAt !== b.recordedAt) {
    if (a.recordedAt === null) return 1;
    if (b.recordedAt === null) return -1;
    const ra = Date.parse(a.recordedAt);
    const rb = Date.parse(b.recordedAt);
    if (ra !== rb) return ra < rb ? 1 : -1;
  }
  return a.timelineEntryId < b.timelineEntryId ? -1 : a.timelineEntryId > b.timelineEntryId ? 1 : 0;
}

export const ordenarEntradas = (entradas: readonly EntradaDeLineaDeTiempo[]): EntradaDeLineaDeTiempo[] => [...entradas].sort(compararEntradas);

/** La clave de orden de una entrada: es lo único que lleva el cursor (nada de su contenido). */
export interface ClaveDeOrden {
  readonly d: string;
  readonly t: string | null;
  readonly r: string | null;
  readonly i: string;
}

export const claveDeOrden = (e: EntradaDeLineaDeTiempo): ClaveDeOrden => ({ d: e.occurredDate, t: e.occurredAt, r: e.recordedAt, i: e.timelineEntryId });

const aBase64Url = (texto: string): string => {
  const b64 = typeof Buffer !== 'undefined' ? Buffer.from(texto, 'utf8').toString('base64') : btoa(unescape(encodeURIComponent(texto)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const deBase64Url = (texto: string): string => {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  return typeof Buffer !== 'undefined' ? Buffer.from(b64, 'base64').toString('utf8') : decodeURIComponent(escape(atob(b64)));
};

export const codificarCursor = (c: ClaveDeOrden): string => aBase64Url(JSON.stringify([c.d, c.t, c.r, c.i]));

/** El cursor leído, o `null` si no es uno válido (la API responde 400 INVALID_CURSOR). */
export function decodificarCursor(cursor: string): ClaveDeOrden | null {
  if (!/^[A-Za-z0-9_-]{1,400}$/.test(cursor)) return null;
  try {
    const v: unknown = JSON.parse(deBase64Url(cursor));
    if (!Array.isArray(v) || v.length !== 4) return null;
    const [d, t, r, i] = v as unknown[];
    const fechaOk = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const instanteOk = (x: unknown) => x === null || (typeof x === 'string' && !Number.isNaN(Date.parse(x)));
    if (!fechaOk || !instanteOk(t) || !instanteOk(r) || typeof i !== 'string' || i.length === 0) return null;
    return { d: d as string, t: t as string | null, r: r as string | null, i };
  } catch {
    return null;
  }
}

/** Si la entrada va después de la posición del cursor (es decir, en la página siguiente). */
export function despuesDe(e: EntradaDeLineaDeTiempo, c: ClaveDeOrden): boolean {
  const marca = { ...e, occurredDate: c.d, occurredAt: c.t, recordedAt: c.r, timelineEntryId: c.i };
  return compararEntradas(marca, e) < 0;
}

export interface FiltrosDeLineaDeTiempo {
  readonly dominios?: readonly DominioDeAnalisis[];
  readonly tipos?: readonly TipoDeEvento[];
  readonly estados?: readonly EstadoDeEntrada[];
  readonly calidades?: readonly CalidadDeEntrada[];
  readonly planVersionId?: string;
  readonly exerciseKey?: string;
  readonly q?: string;
  /** Solo las registradas en un día posterior al del hecho. */
  readonly soloTardias?: boolean;
}

/** Minúsculas y sin acentos: «Almuerzo» y «almuérzo» coinciden. */
export const normalizarTexto = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** El texto visible de una entrada, que es lo único sobre lo que se busca. */
const textoBuscable = (e: EntradaDeLineaDeTiempo): string => normalizarTexto([e.title, ...e.details.flatMap((d) => [d.label, d.value]), ...e.relations.map((r) => r.label)].join(' '));

export function cumpleFiltros(e: EntradaDeLineaDeTiempo, f: FiltrosDeLineaDeTiempo): boolean {
  if (f.dominios && f.dominios.length > 0 && !f.dominios.includes(e.domain)) return false;
  if (f.tipos && f.tipos.length > 0 && !f.tipos.includes(e.eventType)) return false;
  if (f.estados && f.estados.length > 0 && !f.estados.includes(e.state)) return false;
  if (f.calidades && f.calidades.length > 0 && !f.calidades.some((c) => e.quality.includes(c))) return false;
  if (f.planVersionId && e.planVersionId !== f.planVersionId) return false;
  if (f.exerciseKey && !e.exerciseKeys.includes(f.exerciseKey)) return false;
  if (f.soloTardias && !e.recordedLate) return false;
  if (f.q) {
    const palabras = normalizarTexto(f.q).split(' ').filter(Boolean);
    const texto = textoBuscable(e);
    if (!palabras.every((p) => texto.includes(p))) return false;
  }
  return true;
}

export interface PaginaDeEntradas {
  readonly entradas: readonly EntradaDeLineaDeTiempo[];
  readonly siguiente: string | null;
  readonly hayMas: boolean;
}

/** Una página de entradas ya ordenadas, a partir del cursor. El cursor de la siguiente es la clave de la última. */
export function paginarEntradas(ordenadas: readonly EntradaDeLineaDeTiempo[], cursor: ClaveDeOrden | null, limite: number): PaginaDeEntradas {
  const desde = cursor ? ordenadas.filter((e) => despuesDe(e, cursor)) : ordenadas;
  const pagina = desde.slice(0, limite);
  const hayMas = desde.length > limite;
  const ultima = pagina[pagina.length - 1];
  return { entradas: pagina, siguiente: hayMas && ultima ? codificarCursor(claveDeOrden(ultima)) : null, hayMas };
}

/** Si se registró en un día civil posterior al del hecho (en la zona del asesorado). */
export function registradoTarde(fechaDelHecho: string, registradoEl: string | null, zonaHoraria: string): boolean {
  if (!registradoEl) return false;
  return fechaCivil(registradoEl, zonaHoraria) > fechaDelHecho;
}

/** Las entradas agrupadas por día civil del hecho, en el orden de la línea de tiempo. */
export function agruparPorDia(entradas: readonly EntradaDeLineaDeTiempo[]): { readonly fecha: string; readonly entradas: readonly EntradaDeLineaDeTiempo[] }[] {
  const grupos: { fecha: string; entradas: EntradaDeLineaDeTiempo[] }[] = [];
  for (const e of entradas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === e.occurredDate) ultimo.entradas.push(e);
    else grupos.push({ fecha: e.occurredDate, entradas: [e] });
  }
  return grupos;
}

/** Los nombres de los tipos de evento, para filtros y entradas. Describen el hecho, no lo califican. */
export const NOMBRE_DE_TIPO_DE_EVENTO: Readonly<Record<TipoDeEvento, string>> = {
  NUTRITION_PLAN_ACTIVATED: 'Plan nutricional activado',
  NUTRITION_OBJECTIVE_SET: 'Objetivo nutricional',
  MEAL_RECORDED: 'Registro de comida',
  NUTRITION_REVIEW_RECORDED: 'Revisión de nutrición',
  TRAINING_PLAN_ACTIVATED: 'Plan de entrenamiento activado',
  TRAINING_OBJECTIVE_SET: 'Objetivo de entrenamiento',
  TRAINING_SESSION_RECORDED: 'Sesión registrada',
  TRAINING_REVIEW_RECORDED: 'Revisión de entrenamiento',
  ANTHROPOMETRIC_EVALUATION_RECORDED: 'Toma antropométrica',
  FOLLOW_UP_OPENED: 'Seguimiento abierto',
  FOLLOW_UP_CLOSED: 'Seguimiento cerrado',
};

export const DOMINIO_DE_TIPO_DE_EVENTO: Readonly<Record<TipoDeEvento, DominioDeAnalisis | null>> = {
  NUTRITION_PLAN_ACTIVATED: 'NUTRITION',
  NUTRITION_OBJECTIVE_SET: 'NUTRITION',
  MEAL_RECORDED: 'NUTRITION',
  NUTRITION_REVIEW_RECORDED: 'NUTRITION',
  TRAINING_PLAN_ACTIVATED: 'TRAINING',
  TRAINING_OBJECTIVE_SET: 'TRAINING',
  TRAINING_SESSION_RECORDED: 'TRAINING',
  TRAINING_REVIEW_RECORDED: 'TRAINING',
  ANTHROPOMETRIC_EVALUATION_RECORDED: 'ANTHROPOMETRY',
  FOLLOW_UP_OPENED: null,
  FOLLOW_UP_CLOSED: null,
};

export const NOMBRE_DE_DOMINIO: Readonly<Record<DominioDeAnalisis, string>> = { NUTRITION: 'Nutrición', TRAINING: 'Entrenamiento', ANTHROPOMETRY: 'Antropometría' };

/**
 * Los conteos del período, antes de los filtros: por tipo, por rasgo de calidad y cuántas se cargaron otro día. Solo
 * figuran los tipos y rasgos presentes, en el orden del contrato (no en el de aparición), para que la respuesta sea estable.
 */
export function conteosDelPeriodo(entradas: readonly EntradaDeLineaDeTiempo[]): ConteosDelPeriodo {
  const porTipo = new Map<TipoDeEvento, number>();
  const porCalidad = new Map<CalidadDeEntrada, number>();
  let tardias = 0;
  for (const e of entradas) {
    porTipo.set(e.eventType, (porTipo.get(e.eventType) ?? 0) + 1);
    for (const q of e.quality) porCalidad.set(q, (porCalidad.get(q) ?? 0) + 1);
    if (e.recordedLate) tardias++;
  }
  return {
    byEventType: TIPOS_DE_EVENTO.filter((t) => porTipo.has(t)).map((eventType) => ({ eventType, count: porTipo.get(eventType) ?? 0 })),
    byQuality: CalidadDeEntradaSchema.options.filter((q) => porCalidad.has(q)).map((quality) => ({ quality, count: porCalidad.get(quality) ?? 0 })),
    recordedLate: tardias,
  };
}
