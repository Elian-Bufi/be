'use client';

/**
 * Las lecturas de los gráficos (WP-GRAFICOS fase 2, DL-174). Todas van a la API, que decide con el PDP en cada una: no
 * hay caché de datos de salud en el navegador. Todo pasa por `limitarLectura` (cuatro a la vez).
 *
 * - `leerSerieDelCatalogo` despacha por la fuente de la serie: una proyección (con el adaptador de la fuerza cuando la
 *   clave es la de la estimación); las derivadas (los g/kg) las lee la rama de Nutrición (C, `leerSeriePorKilo`); el
 *   contexto de revisión responde «sin especificación» hasta que lo programe la rama de Entrenamiento (B).
 * - `leerEnTramos` parte el período en tramos de 92 días, sin días repetidos ni perdidos.
 * - `compartirLecturaEnCurso` evita pedir dos veces lo mismo mientras está en vuelo, y no guarda nada después.
 * - `leerDisponibles` es lo que hacía `useDisponibles` por dentro, sin depender del contexto de la ficha, para que el
 *   panel de la estación lo use. Suma `propios`: si hay versiones o tomas propias en el período, por área.
 */
import {
  claveDeReferencia,
  definicionDeMetrica,
  serieDisponible,
  type Alcance,
  type DominioDeAnalisis,
  type EjercicioDelPeriodo,
  type Grano,
  type ReferenciaDeMetrica,
  type ResultadoDeProyeccionNutricional,
  type VigenciaDePlan,
} from '@be/domain';
import { api, type Resultado } from '../../../../lib/api';
import { limitarLectura, motivoDeFalla, type MotivoDeFalla } from '../seguimiento/contexto';
import { granoPara, leerSerie, type EstadoDeSerie } from '../seguimiento/series';
import { serieDeLaFuerza } from './adaptadores';
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

/** Lee una serie del catálogo, con el acceso de este momento. */
export async function leerSerieDelCatalogo(p: ParametrosDeLectura, ref: ReferenciaDeMetrica, grano: Grano): Promise<EstadoDeSerie> {
  const serie = serieDisponible(ref.metricId, ref.unit ?? undefined);
  if (!serie) return { tipo: 'error', motivo: 'OTRO' };
  const periodo = { preset: null, desde: inicioDelEje(p.periodo), hasta: p.periodo.hasta } as const;
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
