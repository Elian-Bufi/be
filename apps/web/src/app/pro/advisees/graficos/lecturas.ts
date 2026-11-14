'use client';

/**
 * Las lecturas de los gráficos (WP-GRAFICOS fase 2, DL-174). Todas van a la API, que decide con el PDP en cada una: no
 * hay caché de datos de salud en el navegador. Todo pasa por `limitarLectura` (cuatro a la vez).
 *
 * - `leerSerieDelCatalogo` despacha por la fuente de la serie: una proyección (con el adaptador de la fuerza cuando la
 *   clave es la de la estimación) o el contexto de revisión (lo indicado del entrenamiento: API-TRN-21 en tramos de 92
 *   días y API-SER-01 por versión, GR-T14). Las derivadas (los g/kg, GR-T13) las lee la rama de Nutrición (C,
 *   `leerSeriePorKilo`).
 * - `leerEnTramos` parte el período en tramos de 92 días, sin días repetidos ni perdidos.
 * - `compartirLecturaEnCurso` evita pedir dos veces lo mismo mientras está en vuelo, y no guarda nada después.
 * - `leerDisponibles` es lo que hacía `useDisponibles` por dentro, sin depender del contexto de la ficha, para que el
 *   panel de la estación lo use. Suma `propios`: si hay versiones o tomas propias en el período, por área.
 * - `leerLasSesionesEnTramos` y `leerLosObjetivosDeLasVersiones`: lo que lee el comparador, para lo indicado y para las
 *   sustituciones de la cinta. `leerLaCinta`: los hechos de API-DSH-04 que van en la cinta del tiempo (GR-23).
 */
import {
  claveDeReferencia,
  definicionDeMetrica,
  serieDisponible,
  type Alcance,
  type DominioDeAnalisis,
  type EjecucionDeEntrenamiento,
  type EjercicioDelPeriodo,
  type EntradaDeLineaDeTiempo,
  type FiltroDeLineaDeTiempo,
  type Grano,
  type LineaDeTiempoResponse,
  type Medida,
  type ObjetivosDeLaVersion,
  type ReferenciaDeMetrica,
  type ResultadoDeProyeccionNutricional,
  type SerieDisponible,
  type VigenciaDePlan,
} from '@be/domain';
import { api, type Resultado } from '../../../../lib/api';
import { limitarLectura, motivoDeFalla, type MotivoDeFalla } from '../seguimiento/contexto';
import { granoPara, leerSerie, type EstadoDeSerie } from '../seguimiento/series';
import { objetivosDelPlanLeido, serieDeLaFuerza, serieDeLoIndicado } from './adaptadores';
import { ESTADOS_DE_LA_CINTA, TIPOS_DE_HITO_DE_LA_CINTA } from './cinta-del-tiempo';
import { inicioDelEje, tramosDe, type PeriodoDelGrafico } from './eje-de-fechas';
import { leerSeriePorKilo } from './nutricion/lecturas-de-nutricion';

export interface ParametrosDeLectura {
  readonly token: string;
  readonly asesoradoId: string;
  readonly periodo: PeriodoDelGrafico;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
}

/** Lo que se puede ofrecer con los datos y permisos de esta persona en el período. */
export interface Disponibles {
  readonly nutricion: boolean;
  readonly ejercicios: readonly EjercicioDelPeriodo[] | null;
  readonly antropometria: readonly { readonly metricCode: string; readonly name: string; readonly observations: number; readonly units: readonly string[]; readonly comparabilityGroups: number }[] | null;
  /** La cobertura nutricional del período, de la misma lectura: días, registros con y sin cantidades, anulados. */
  readonly coberturaNutricional: ResultadoDeProyeccionNutricional['coverage'] | null;
  /** Las vigencias de los planes que tocan el período, por área (las bandas y las etapas). */
  readonly vigencias: { readonly nutricion: readonly VigenciaDePlan[]; readonly entrenamiento: readonly VigenciaDePlan[] };
  /**
   * Caso 1 (WP-GRAFICOS): si hay versiones propias en el período (Nutrición y Entrenamiento) o tomas propias
   * (Antropometría). Las lecturas de API-PRJ-01 ya traen solo lo del profesional que consulta.
   */
  readonly propios: Readonly<Record<Alcance, boolean>>;
  /** El instante de la lectura (para la duración de una etapa abierta). */
  readonly leidoEl: string | null;
  /** Si alguna de las tres lecturas falló: lo que falta no es «sin datos», y la pantalla lo dice. */
  readonly falla: MotivoDeFalla | null;
  /** Qué lectura falló, por área: la síntesis dice qué parte no se pudo completar. */
  readonly fallas: { readonly nutricion: MotivoDeFalla | null; readonly entrenamiento: MotivoDeFalla | null; readonly antropometria: MotivoDeFalla | null };
  readonly cargando: boolean;
  readonly recargar: () => void;
}

export type DisponiblesLeidos = Omit<Disponibles, 'cargando' | 'recargar'>;

/** Lo leído y las áreas que respondieron «sin acceso» (para volver a preguntar el acceso del encabezado). */
export interface LecturaDeDisponibles {
  readonly disponibles: DisponiblesLeidos;
  readonly sinAcceso: readonly DominioDeAnalisis[];
}

/** Las tres lecturas de lo disponible. `null` si la sesión se perdió (la pantalla ya va al ingreso). */
export async function leerDisponibles(p: ParametrosDeLectura): Promise<LecturaDeDisponibles | null> {
  const base = { periodStart: inicioDelEje(p.periodo), periodEnd: p.periodo.hasta };
  const [n, t, a] = await Promise.all([
    limitarLectura(() => api.proyeccion(p.token, p.asesoradoId, 'NUTRITION_PRESCRIBED_VS_RECORDED', { ...base, metric: 'RECORDS' })),
    limitarLectura(() => api.proyeccion(p.token, p.asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', base)),
    limitarLectura(() => api.proyeccion(p.token, p.asesoradoId, 'ANTHROPOMETRY_LONGITUDINAL', base)),
  ]);
  if (p.sesionPerdida(n) || p.sesionPerdida(t) || p.sesionPerdida(a)) return null;
  const visible = (r: typeof n) => r.ok && r.datos.data.dataState !== 'NOT_AVAILABLE_TO_VIEW';
  // Un 404 es «sin acceso» (anti-enumeración); cualquier otra falla se declara.
  const fallo = (r: typeof n): MotivoDeFalla | null => (!r.ok && !(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') ? motivoDeFalla(r) : null);
  const fallida = [n, t, a].find((r) => fallo(r) !== null);
  const sinAcceso = (r: typeof n) => (r.ok ? r.datos.data.dataState === 'NOT_AVAILABLE_TO_VIEW' : r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND');
  const vigencias = (r: typeof n): readonly VigenciaDePlan[] =>
    visible(r) && r.ok && r.datos.data.result && r.datos.data.result.kind !== 'ANTHROPOMETRY_LONGITUDINAL' ? r.datos.data.result.planVersions : [];
  const leida = [n, t, a].find((r): r is Extract<typeof n, { ok: true }> => r.ok);
  const antropometria = visible(a) && a.ok && a.datos.data.result?.kind === 'ANTHROPOMETRY_LONGITUDINAL' ? a.datos.data.result.available : null;
  const deNutricion = vigencias(n);
  const deEntrenamiento = vigencias(t);
  return {
    sinAcceso: ([
      [n, 'NUTRITION'],
      [t, 'TRAINING'],
      [a, 'ANTHROPOMETRY'],
    ] as const).flatMap(([r, dominio]) => (sinAcceso(r) ? [dominio] : [])),
    disponibles: {
      falla: fallida ? motivoDeFalla(fallida) : null,
      fallas: { nutricion: fallo(n), entrenamiento: fallo(t), antropometria: fallo(a) },
      vigencias: { nutricion: deNutricion, entrenamiento: deEntrenamiento },
      propios: { NUTRICION: deNutricion.length > 0, ENTRENAMIENTO: deEntrenamiento.length > 0, ANTROPOMETRIA: (antropometria ?? []).some((m) => m.observations > 0) },
      leidoEl: leida ? leida.datos.data.generatedAt : null,
      nutricion: visible(n),
      ejercicios: visible(t) && t.ok && t.datos.data.result?.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? [...t.datos.data.result.exercises].sort((x, y) => y.sessions - x.sessions) : null,
      antropometria,
      coberturaNutricional: visible(n) && n.ok && n.datos.data.result?.kind === 'NUTRITION_PRESCRIBED_VS_RECORDED' ? n.datos.data.result.coverage : null,
    },
  };
}

const enVuelo = new Map<string, Promise<unknown>>();

/**
 * Comparte una lectura que está en vuelo con la misma clave (dos gráficos con las calorías). No guarda nada: se descarta
 * al responder, y la clave lleva el período y la versión del acceso, así que cambiarlos pide de nuevo.
 */
export function compartirLecturaEnCurso<T>(clave: string, leer: () => Promise<T>): Promise<T> {
  const ya = enVuelo.get(clave) as Promise<T> | undefined;
  if (ya) return ya;
  const nueva = leer().finally(() => enVuelo.delete(clave));
  enVuelo.set(clave, nueva);
  return nueva;
}

/** Una lectura larga en tramos de 92 días; si un tramo falla, falla todo (lo que falta no es «sin datos»). */
export async function leerEnTramos<T>(
  periodo: PeriodoDelGrafico,
  diasPorLectura: 92,
  leer: (desde: string, hasta: string) => Promise<Resultado<T>>,
): Promise<{ readonly partes: readonly T[]; readonly enTramos: boolean; readonly falla: Resultado<T> | null }> {
  const tramos = tramosDe(inicioDelEje(periodo), periodo.hasta, diasPorLectura);
  const respuestas = await Promise.all(tramos.map((t) => limitarLectura(() => leer(t.desde, t.hasta))));
  const falla = respuestas.find((r) => !r.ok) ?? null;
  return { partes: respuestas.flatMap((r) => (r.ok ? [r.datos] : [])), enTramos: tramos.length > 1, falla };
}

// ─── Lo que lee el comparador: las sesiones y los objetivos por serie (GR-T14) ─────────────────

/** Un 404 es «sin acceso» (anti-enumeración): el área no está, como si no existiera. */
const sinAcceso = (r: Resultado<unknown>): boolean => !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';

/** API-TRN-21 admite hasta 92 días por lectura (`DIAS_MAXIMOS` en la API). */
export const DIAS_POR_LECTURA_DE_LAS_SESIONES = 92;

export type LecturaDeLasSesiones =
  | { readonly tipo: 'lista'; readonly ejecuciones: readonly EjecucionDeEntrenamiento[]; readonly enTramos: boolean; readonly zona: string }
  | { readonly tipo: 'sin-acceso' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/**
 * Las sesiones registradas de los planes propios en el período (API-TRN-21, caso 1), en tramos de 92 días y sin
 * repetirlas. Es la lectura del comparador «Planificado y registrado»: trae solo lo registrado (nunca un borrador) y cada
 * sesión con la instantánea de la prescripción que la rigió. `null` si la sesión se perdió.
 */
export function leerLasSesionesEnTramos(p: ParametrosDeLectura): Promise<LecturaDeLasSesiones | null> {
  const desde = inicioDelEje(p.periodo);
  return compartirLecturaEnCurso(`sesiones|${p.asesoradoId}|${desde}|${p.periodo.hasta}`, async (): Promise<LecturaDeLasSesiones | null> => {
    const r = await leerEnTramos(p.periodo, DIAS_POR_LECTURA_DE_LAS_SESIONES, (d, h) => api.contextoDeRevisionDeEntrenamiento(p.token, p.asesoradoId, { periodStart: d, periodEnd: h }));
    if (r.falla) {
      if (p.sesionPerdida(r.falla)) return null;
      return sinAcceso(r.falla) ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: motivoDeFalla(r.falla) };
    }
    const vistas = new Set<string>();
    const ejecuciones = r.partes.flatMap((x) => x.data.registeredExecutions).filter((x) => !vistas.has(x.executionId) && Boolean(vistas.add(x.executionId)));
    return { tipo: 'lista', ejecuciones, enTramos: r.enTramos, zona: r.partes[0]?.data.period.timeZone ?? 'America/Argentina/Buenos_Aires' };
  });
}

export type LecturaDeLosObjetivos = { readonly tipo: 'lista'; readonly objetivos: ReadonlyMap<string, ObjetivosDeLaVersion> } | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/**
 * Los objetivos por serie de cada versión (API-SER-01, una lectura por versión): lo indicado para **esa** serie en la
 * versión que rigió (DL-122). Si una versión no se pudo leer, no se dibuja lo indicado con la de la prescripción en su
 * lugar: es una falla, con «Reintentar» (GR-T27). `null` si la sesión se perdió.
 */
export async function leerLosObjetivosDeLasVersiones(p: Omit<ParametrosDeLectura, 'periodo'>, planIds: readonly string[]): Promise<LecturaDeLosObjetivos | null> {
  const ids = [...new Set(planIds)];
  const respuestas = await Promise.all(ids.map((planId) => compartirLecturaEnCurso(`objetivos|${planId}`, () => limitarLectura(() => api.planConObjetivos(p.token, planId)))));
  if (respuestas.some((r) => p.sesionPerdida(r))) return null;
  const falla = respuestas.find((r) => !r.ok);
  if (falla) return { tipo: 'error', motivo: motivoDeFalla(falla) };
  return { tipo: 'lista', objetivos: new Map(respuestas.flatMap((r) => (r.ok ? [[r.datos.data.planId, objetivosDelPlanLeido(r.datos.data)] as const] : []))) };
}

/** Qué medida del comparador lee una serie de lo indicado: el RIR, las repeticiones o la carga (con su unidad). */
function medidaDeLoIndicado(serie: SerieDisponible, ref: ReferenciaDeMetrica): Medida | null {
  if (serie.definicion.unidad === 'RIR') return { variable: 'rir' };
  if (serie.definicion.unidad === 'rep') return { variable: 'repeticiones' };
  return ref.unit ? { variable: 'carga', unidad: ref.unit } : null;
}

/** Lo indicado del entrenamiento como serie del catálogo (fuente CONTEXTO_DE_REVISION): GR-03 y GR-05. */
async function leerLoIndicado(p: ParametrosDeLectura, ref: ReferenciaDeMetrica, serie: SerieDisponible): Promise<EstadoDeSerie> {
  const medida = medidaDeLoIndicado(serie, ref);
  if (!ref.exerciseKey || ref.setIndex === null || medida === null) return { tipo: 'error', motivo: 'OTRO' };
  const sesiones = await leerLasSesionesEnTramos(p);
  if (sesiones === null) return { tipo: 'cargando' };
  if (sesiones.tipo !== 'lista') return sesiones;
  const objetivos = await leerLosObjetivosDeLasVersiones(p, sesiones.ejecuciones.map((x) => x.planId));
  if (objetivos === null) return { tipo: 'cargando' };
  if (objetivos.tipo === 'error') return objetivos;
  const s = serieDeLoIndicado(sesiones.ejecuciones, objetivos.objetivos, {
    exerciseKey: ref.exerciseKey,
    serie: ref.setIndex,
    medida,
    desde: inicioDelEje(p.periodo),
    hasta: p.periodo.hasta,
    metricId: serie.id,
    nombre: serie.definicion.nombre,
    escala: serie.definicion.escala,
  });
  if (s.points.length === 0) return { tipo: 'sin-datos' };
  return { tipo: 'lista', serie: s, observaciones: s, bandas: [], objetivo: [], escalones: [], indicado: null, parcial: false, generada: new Date().toISOString(), zona: sesiones.zona };
}

// ─── La cinta del tiempo (GR-23) ────────────────────────────────────────────────────────────────

/** Cuántas páginas de 50 se leen por pedido de la cinta, como mucho: lo que no entra se dice en pantalla (GR-T29). */
export const PAGINAS_DE_LA_CINTA = 4;
const POR_PAGINA = 50;

export type LecturaDeLaCinta =
  | { readonly tipo: 'lista'; readonly entradas: readonly EntradaDeLineaDeTiempo[]; readonly truncada: boolean }
  | { readonly tipo: 'sin-acceso' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/** Todas las páginas de un pedido a API-DSH-04, hasta el tope; la primera falla corta. */
async function leerLasPaginas(p: ParametrosDeLectura, filtro: FiltroDeLineaDeTiempo): Promise<{ readonly entradas: readonly EntradaDeLineaDeTiempo[]; readonly truncada: boolean } | { readonly falla: Resultado<unknown> }> {
  const entradas: EntradaDeLineaDeTiempo[] = [];
  let cursor: string | null = null;
  for (let pagina = 0; pagina < PAGINAS_DE_LA_CINTA; pagina++) {
    const desde: string | null = cursor;
    const r: Resultado<LineaDeTiempoResponse> = await limitarLectura(() => api.lineaDeTiempo(p.token, p.asesoradoId, { ...filtro, limit: String(POR_PAGINA), ...(desde ? { cursor: desde } : {}) }));
    if (!r.ok) return { falla: r };
    entradas.push(...r.datos.data.entries);
    if (!r.datos.page.hasMore || r.datos.page.nextCursor === null) return { entradas, truncada: false };
    cursor = r.datos.page.nextCursor;
  }
  return { entradas, truncada: true };
}

/**
 * Los hechos de la cinta en el período (API-DSH-04, con el PDP de hoy): los hitos de `TIPOS_DE_HITO_DE_LA_CINTA` y, si
 * Entrenamiento está permitido, las sesiones con cambios. Sin lo anulado. Las versiones de los planes no se leen acá: son
 * las vigencias que ya trae `leerDisponibles` (GR-T28). `null` si la sesión se perdió.
 */
export function leerLaCinta(p: ParametrosDeLectura, alcances: readonly Alcance[]): Promise<LecturaDeLaCinta | null> {
  const desde = inicioDelEje(p.periodo);
  const conSesiones = alcances.includes('ENTRENAMIENTO');
  return compartirLecturaEnCurso(`cinta|${p.asesoradoId}|${desde}|${p.periodo.hasta}|${conSesiones}`, async (): Promise<LecturaDeLaCinta | null> => {
    if (p.periodo.hasta < desde) return { tipo: 'lista', entradas: [], truncada: false };
    const base: FiltroDeLineaDeTiempo = { periodStart: desde, periodEnd: p.periodo.hasta, state: ESTADOS_DE_LA_CINTA.join(',') };
    const [hitos, sesiones] = await Promise.all([
      leerLasPaginas(p, { ...base, type: TIPOS_DE_HITO_DE_LA_CINTA.join(',') }),
      conSesiones ? leerLasPaginas(p, { ...base, type: 'TRAINING_SESSION_RECORDED', quality: 'SESSION_WITH_DEVIATION' }) : Promise.resolve({ entradas: [], truncada: false }),
    ]);
    for (const parte of [hitos, sesiones]) {
      if (!('falla' in parte)) continue;
      if (p.sesionPerdida(parte.falla)) return null;
      return sinAcceso(parte.falla) ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: motivoDeFalla(parte.falla) };
    }
    const leidas = [hitos, sesiones].flatMap((parte) => ('falla' in parte ? [] : [parte]));
    return { tipo: 'lista', entradas: leidas.flatMap((parte) => parte.entradas), truncada: leidas.some((parte) => parte.truncada) };
  });
}

/** Lee una serie del catálogo, con el acceso de este momento. */
export async function leerSerieDelCatalogo(p: ParametrosDeLectura, ref: ReferenciaDeMetrica, grano: Grano): Promise<EstadoDeSerie> {
  const serie = serieDisponible(ref.metricId, ref.unit ?? undefined);
  if (!serie) return { tipo: 'error', motivo: 'OTRO' };
  const periodo = { preset: null, desde: inicioDelEje(p.periodo), hasta: p.periodo.hasta } as const;
  if (serie.fuente.tipo === 'CONTEXTO_DE_REVISION') return leerLoIndicado(p, ref, serie);
  if (serie.fuente.tipo === 'DERIVADA') return leerSeriePorKilo(p, serie);
  if (serie.fuente.tipo !== 'PROYECCION') return { tipo: 'sin-especificacion' };
  if (serie.fuente.clave === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE') {
    const exerciseId = ref.exerciseKey ? ref.exerciseKey.replace(/^e:/, '') : null;
    const r = await limitarLectura(() =>
      api.proyeccion(p.token, p.asesoradoId, 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE', {
        periodStart: periodo.desde,
        periodEnd: periodo.hasta,
        ...(exerciseId ? { exerciseId } : {}),
        ...(ref.unit ? { unit: ref.unit } : {}),
        includeOrientative: 'false',
      }),
    );
    if (p.sesionPerdida(r)) return { tipo: 'cargando' };
    if (!r.ok) return r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: motivoDeFalla(r) };
    const d = r.datos.data;
    if (d.dataState === 'NOT_AVAILABLE_TO_VIEW') return { tipo: 'sin-acceso' };
    if (d.dataState === 'INSUFFICIENT_INFORMATION') return { tipo: 'sin-especificacion' };
    const res = d.result;
    const s = res && res.kind === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' ? serieDeLaFuerza(res) : null;
    if (!res || res.kind !== 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' || !s || s.points.length === 0) return { tipo: 'sin-datos' };
    return { tipo: 'lista', serie: s, observaciones: s, bandas: res.planVersions, objetivo: [], escalones: [], indicado: null, parcial: d.partialView, generada: d.generatedAt, zona: d.period.timeZone };
  }
  const definicion = definicionDeMetrica(ref.metricId, ref.unit ?? '') ?? serie.definicion;
  const { estado, respuestas } = await leerSerie(p.token, p.asesoradoId, { ref, clave: claveDeReferencia(ref), definicion, grano: granoPara(definicion, grano) }, periodo);
  return respuestas.some((r) => p.sesionPerdida(r)) ? { tipo: 'cargando' } : estado;
}
