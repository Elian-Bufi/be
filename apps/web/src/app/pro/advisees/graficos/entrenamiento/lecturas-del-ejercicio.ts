'use client';

/**
 * Las lecturas de los gráficos de Entrenamiento (WP-GRAFICOS fase 2, rama B; DL-174). Todas van a la API, que decide con
 * el PDP en cada una: no hay caché de datos de salud en el navegador. Dos gráficos que piden lo mismo a la vez comparten
 * la lectura en vuelo (`compartirLecturaEnCurso`), que se descarta al responder; todo pasa por `limitarLectura`.
 * - **El comparador** (GR-T14): las sesiones de API-TRN-21 en tramos de 92 días y los objetivos por serie de cada versión
 *   (API-SER-01), con las lecturas de la base (`leerLasSesionesEnTramos` y `leerLosObjetivosDeLasVersiones`). De ahí
 *   salen el RIR indicado (GR-03 y GR-05), las series de la persona (GR-06), lo indicado de cada versión (la primera línea
 *   de GR-02) y lo cargado después. Dentro del historial del cuadro, un proveedor lo lee una vez para todos sus gráficos.
 * - **El índice** del período: API-PRJ-01 `TRAINING_PROGRESSION_BY_EXERCISE` sin ejercicio, con las sesiones, los
 *   números de serie y las unidades de cada ejercicio, y las versiones del plan.
 * - **La serie** de GR-03: la carga, las repeticiones y el RIR de un número de serie, por `leerSerieDelCatalogo`.
 * - **El inicio del acompañamiento** (TB-16): de los vínculos de este profesional con la persona, como la ficha.
 */
import {
  todasLasPaginas,
  type EjecucionDeEntrenamiento,
  type EjercicioDelPeriodo,
  type ObjetivosDeLaVersion,
  type ReferenciaDeMetrica,
  type VigenciaDePlan,
} from '@be/domain';
import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Resultado } from '../../../../../lib/api';
import { motivoDeFalla, type MotivoDeFalla } from '../../../../../lib/fallas';
import { useSesion } from '../../../../../lib/sesion';
import { limitarLectura } from '../../seguimiento/contexto';
import { inicioDelAcompanamiento } from '../../seguimiento/estado';
import type { EstadoDeSerie } from '../../seguimiento/series';
import { inicioDelEje, type PeriodoDelGrafico } from '../eje-de-fechas';
import { compartirLecturaEnCurso, leerLasSesionesEnTramos, leerLosObjetivosDeLasVersiones, leerSerieDelCatalogo, type ParametrosDeLectura } from '../lecturas';

type Falla = { readonly tipo: 'sin-acceso' } | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/**
 * Lo que dice una respuesta que falló: «sin acceso» (un 404, como una persona inexistente) o la falla con su motivo, que
 * no es un vacío. `null` si la sesión se perdió: la pantalla ya va al ingreso.
 */
function fallaDe(r: Resultado<unknown>, sesionPerdida: (r: Resultado<unknown>) => boolean): Falla | null {
  if (sesionPerdida(r)) return null;
  return !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: motivoDeFalla(r) };
}

/**
 * Una lectura que se repite cuando cambia lo que se pide (`clave`) o con `recargar`; `null` mientras lee. Una respuesta
 * de un pedido anterior no pisa la del actual. `clave` `null`: no lee.
 */
function useLeido<T>(clave: string | null, leer: () => Promise<T>): { readonly leido: T | null; readonly recargar: () => void } {
  const [estado, setEstado] = useState<{ readonly pedido: string; readonly valor: T } | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const pedido = clave === null ? null : `${clave}#${vuelta}`;
  useEffect(() => {
    if (pedido === null) return;
    let vigente = true;
    void leer().then((valor) => {
      if (vigente) setEstado({ pedido, valor });
    });
    return () => {
      vigente = false;
    };
    // Lee solo cuando cambia lo que se pide: la clave dice todo lo que `leer` usa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { leido: estado !== null && estado.pedido === pedido ? estado.valor : null, recargar };
}

const claveDelPeriodo = (p: PeriodoDelGrafico): string => `${inicioDelEje(p)}|${p.hasta}`;

// ─── El comparador (API-TRN-21 y API-SER-01) ─────────────────────────────────────────────────────

export type LecturaDelComparador =
  | { readonly tipo: 'cargando' }
  | Falla
  | {
      readonly tipo: 'lista';
      readonly ejecuciones: readonly EjecucionDeEntrenamiento[];
      /** Los objetivos por serie de cada versión que ejecutaron las sesiones, por `planId` (DL-122). */
      readonly objetivosPorVersion: ReadonlyMap<string, ObjetivosDeLaVersion>;
      /** Se leyó en más de un tramo de 92 días: la pantalla lo dice. */
      readonly enTramos: boolean;
      readonly zona: string;
    };

/**
 * Las sesiones registradas del período en los planes de quien mira y los objetivos por serie de cada versión que
 * ejecutaron. Si un tramo o una versión falla, falla todo: lo que falta no es «sin datos», y lo indicado no se dibuja con
 * la prescripción de otra versión en su lugar.
 */
export async function leerElComparador(p: ParametrosDeLectura): Promise<LecturaDelComparador> {
  const sesiones = await leerLasSesionesEnTramos(p);
  if (sesiones === null) return { tipo: 'cargando' };
  if (sesiones.tipo !== 'lista') return sesiones;
  const objetivos = await leerLosObjetivosDeLasVersiones(p, sesiones.ejecuciones.map((x) => x.planId));
  if (objetivos === null) return { tipo: 'cargando' };
  if (objetivos.tipo !== 'lista') return objetivos;
  return { tipo: 'lista', ejecuciones: sesiones.ejecuciones, objetivosPorVersion: objetivos.objetivos, enTramos: sesiones.enTramos, zona: sesiones.zona };
}

interface ComparadorLeido {
  readonly comparador: LecturaDelComparador;
  readonly recargar: () => void;
}

function useComparadorPropio(lectura: Omit<ParametrosDeLectura, 'periodo'>, periodo: PeriodoDelGrafico, activo: boolean): ComparadorLeido {
  const { leido, recargar } = useLeido(activo ? `${lectura.asesoradoId}|${claveDelPeriodo(periodo)}` : null, () => leerElComparador({ ...lectura, periodo }));
  return { comparador: leido ?? { tipo: 'cargando' }, recargar };
}

const ContextoDelComparador = createContext<(ComparadorLeido & { readonly clave: string }) | null>(null);

/**
 * Una sola lectura del comparador para todos los gráficos de adentro (el historial del cuadro): con el mismo período y la
 * misma persona, `useComparador` toma esta en lugar de leer de nuevo. No guarda nada: vive mientras está el paso.
 */
export function ProveedorDelComparador({ lectura, periodo, children }: { lectura: Omit<ParametrosDeLectura, 'periodo'>; periodo: PeriodoDelGrafico; children: ReactNode }) {
  const leido = useComparadorPropio(lectura, periodo, true);
  return createElement(ContextoDelComparador.Provider, { value: { ...leido, clave: `${lectura.asesoradoId}|${claveDelPeriodo(periodo)}` } }, children);
}

/** El comparador del período, para los gráficos. `activo` en falso: no lee (el gráfico no se va a dibujar). */
export function useComparador(lectura: Omit<ParametrosDeLectura, 'periodo'>, periodo: PeriodoDelGrafico, activo = true): ComparadorLeido {
  const compartido = useContext(ContextoDelComparador);
  const delProveedor = compartido !== null && compartido.clave === `${lectura.asesoradoId}|${claveDelPeriodo(periodo)}`;
  const propio = useComparadorPropio(lectura, periodo, activo && !delProveedor);
  return delProveedor && compartido ? { comparador: compartido.comparador, recargar: compartido.recargar } : propio;
}

// ─── El índice del período (API-PRJ-01 sin ejercicio) ───────────────────────────────────────────

export type LecturaDelIndice =
  | { readonly tipo: 'cargando' }
  | Falla
  | { readonly tipo: 'lista'; readonly ejercicios: readonly EjercicioDelPeriodo[]; readonly vigencias: readonly VigenciaDePlan[] };

/** Los ejercicios con sesiones registradas en el período (con sus series y unidades) y las versiones del plan. */
export function leerElIndice(p: ParametrosDeLectura): Promise<LecturaDelIndice> {
  const desde = inicioDelEje(p.periodo);
  return compartirLecturaEnCurso(`indice-de-entrenamiento|${p.asesoradoId}|${claveDelPeriodo(p.periodo)}`, async (): Promise<LecturaDelIndice> => {
    const r = await limitarLectura(() => api.proyeccion(p.token, p.asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', { periodStart: desde, periodEnd: p.periodo.hasta }));
    if (!r.ok) return fallaDe(r, p.sesionPerdida) ?? { tipo: 'cargando' };
    const d = r.datos.data;
    if (d.dataState === 'NOT_AVAILABLE_TO_VIEW') return { tipo: 'sin-acceso' };
    const res = d.result;
    if (!res || res.kind !== 'TRAINING_PROGRESSION_BY_EXERCISE') return { tipo: 'lista', ejercicios: [], vigencias: [] };
    return { tipo: 'lista', ejercicios: res.exercises, vigencias: res.planVersions };
  });
}

export function useIndiceDelPeriodo(lectura: Omit<ParametrosDeLectura, 'periodo'>, periodo: PeriodoDelGrafico | null): { readonly indice: LecturaDelIndice; readonly recargar: () => void } {
  const { leido, recargar } = useLeido(periodo ? `${lectura.asesoradoId}|${claveDelPeriodo(periodo)}` : null, () => (periodo ? leerElIndice({ ...lectura, periodo }) : Promise.resolve<LecturaDelIndice>({ tipo: 'cargando' })));
  return { indice: leido ?? { tipo: 'cargando' }, recargar };
}

// ─── La serie de GR-03 (API-PRJ-01 por la del catálogo) ─────────────────────────────────────────

export interface LecturaDeLaSerie {
  readonly carga: EstadoDeSerie;
  readonly repeticiones: EstadoDeSerie;
  readonly rir: EstadoDeSerie;
}

/** La carga (en su unidad), las repeticiones y el RIR del número de serie elegido, con el acceso de este momento. */
export function useLecturaDeLaSerie(
  lectura: Omit<ParametrosDeLectura, 'periodo'>,
  periodo: PeriodoDelGrafico,
  exerciseKey: string | null,
  serie: number,
  unidad: 'kg' | 'lb' | null,
): { readonly serie: LecturaDeLaSerie | null; readonly recargar: () => void } {
  const clave = exerciseKey ? `${lectura.asesoradoId}|${exerciseKey}|${serie}|${unidad ?? ''}|${claveDelPeriodo(periodo)}` : null;
  const { leido, recargar } = useLeido(clave, async (): Promise<LecturaDeLaSerie> => {
    const p = { ...lectura, periodo };
    const ref = (metricId: string, conUnidad: boolean): ReferenciaDeMetrica => ({ metricId, exerciseKey, setIndex: serie, unit: conUnidad ? unidad : null });
    const [carga, repeticiones, rir] = await Promise.all([
      leerSerieDelCatalogo(p, ref('entrenamiento.carga', true), 'ORIGINAL'),
      leerSerieDelCatalogo(p, ref('entrenamiento.repeticiones', false), 'ORIGINAL'),
      leerSerieDelCatalogo(p, ref('entrenamiento.rir', false), 'ORIGINAL'),
    ]);
    return { carga, repeticiones, rir };
  });
  return { serie: leido, recargar };
}

// ─── El inicio del acompañamiento (TB-16) ───────────────────────────────────────────────────────

export type LecturaDelInicio = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly inicio: string | null; readonly fallo: boolean };

/**
 * El día en que este profesional empezó a acompañar a la persona en Entrenamiento (o, si no, el más antiguo de sus áreas),
 * de sus vínculos aceptados (`inicioDelAcompanamiento`, como la ficha). Si la lectura falla, `fallo`: el historial lo dice
 * y muestra hasta un año.
 */
export function useInicioDelAcompanamiento(token: string, asesoradoId: string, sesionPerdida: (r: Resultado<unknown>) => boolean): LecturaDelInicio {
  const yo = useSesion().sesion?.identidadId ?? null;
  const { leido } = useLeido(yo ? `inicio|${asesoradoId}|${yo}` : null, async (): Promise<LecturaDelInicio> => {
    const r = await todasLasPaginas((f) => api.consultarVinculos(token, { cursor: f.cursor }));
    if (sesionPerdida(r)) return { tipo: 'cargando' };
    if (!r.ok) return { tipo: 'listo', inicio: null, fallo: true };
    const vinculos = r.datos.data.filter((v) => v.professional.identityId === yo && v.advisee.identityId === asesoradoId);
    const a = inicioDelAcompanamiento(vinculos);
    return { tipo: 'listo', inicio: a.porArea.ENTRENAMIENTO ?? a.inicio, fallo: false };
  });
  return leido ?? { tipo: 'cargando' };
}
