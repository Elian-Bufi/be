/**
 * Las lecturas propias de los cruces y de «Dos etapas» (WP-GRAFICOS fase 2, DL-174). Van a la API con el acceso de este
 * momento, como todas: no hay caché de datos de salud en el navegador. Todo pasa por `limitarLectura`.
 *
 * - `leerLaFuerza`: el 1RM estimado de un ejercicio (API-PRJ-01 `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`) con sus puntos
 *   tal como llegan, porque la mediana del RIR y el rango de repeticiones de cada etapa salen de ahí, y con las versiones
 *   del plan de entrenamiento de la misma respuesta.
 * - `leerLoIndicado`: lo indicado para el ejercicio en cada versión, de las sesiones registradas (API-TRN-21, en tramos
 *   de 92 días; GR-T54). Si una lectura falla, `null`: la pantalla dice que no se sabe, no que no cambió.
 */
import { type ObjetivoDeLaSerie, type PuntoDeFuerza, type ResultadoDeEstimacionDeFuerza, type SerieAnalitica, type VigenciaDePlan } from '@be/domain';
import { api } from '../../../../../lib/api';
import { limitarLectura, motivoDeFalla, type MotivoDeFalla } from '../../seguimiento/contexto';
import { serieDeLaFuerza } from '../adaptadores';
import { inicioDelEje } from '../eje-de-fechas';
import { leerEnTramos, type ParametrosDeLectura } from '../lecturas';
import { objetivosPorVersion } from './lo-que-tambien-cambio';

export type LecturaDeLaFuerza =
  | { readonly tipo: 'lista'; readonly serie: SerieAnalitica; readonly puntos: readonly PuntoDeFuerza[]; readonly bandas: readonly VigenciaDePlan[]; readonly generada: string; readonly zona: string; readonly parcial: boolean }
  | { readonly tipo: 'sin-datos' }
  | { readonly tipo: 'sin-acceso' }
  | { readonly tipo: 'sin-especificacion' }
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/** El 1RM estimado de un ejercicio de la lista de la v1, en una unidad, con sus puntos y las versiones del plan. */
export async function leerLaFuerza(p: ParametrosDeLectura, exerciseId: string, unidad: 'kg' | 'lb', incluirOrientativas: boolean): Promise<LecturaDeLaFuerza> {
  const r = await limitarLectura(() =>
    api.proyeccion(p.token, p.asesoradoId, 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE', {
      periodStart: inicioDelEje(p.periodo),
      periodEnd: p.periodo.hasta,
      exerciseId,
      unit: unidad,
      includeOrientative: incluirOrientativas ? 'true' : 'false',
    }),
  );
  if (p.sesionPerdida(r)) return { tipo: 'cargando' };
  if (!r.ok) return r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: motivoDeFalla(r) };
  const d = r.datos.data;
  if (d.dataState === 'NOT_AVAILABLE_TO_VIEW') return { tipo: 'sin-acceso' };
  if (d.dataState === 'INSUFFICIENT_INFORMATION') return { tipo: 'sin-especificacion' };
  const res = d.result;
  if (!res || res.kind !== 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' || !res.estimate) return { tipo: 'sin-datos' };
  const serie = serieDeLaFuerza(res as ResultadoDeEstimacionDeFuerza);
  const puntos = res.estimate.points.filter((x) => x.estimate.load.unit === unidad);
  if (!serie || puntos.length === 0) return { tipo: 'sin-datos' };
  return { tipo: 'lista', serie, puntos, bandas: res.planVersions, generada: d.generatedAt, zona: d.period.timeZone, parcial: d.partialView };
}

/** Lo indicado para el ejercicio en cada versión del plan de entrenamiento; `null` si alguna lectura no se pudo hacer. */
export async function leerLoIndicado(p: ParametrosDeLectura, exerciseId: string, bandas: readonly VigenciaDePlan[]): Promise<ReadonlyMap<string, ObjetivoDeLaSerie> | null> {
  const { partes, falla } = await leerEnTramos(p.periodo, 92, (desde, hasta) => api.contextoDeRevisionDeEntrenamiento(p.token, p.asesoradoId, { periodStart: desde, periodEnd: hasta }));
  if (falla !== null) return null;
  return objetivosPorVersion(
    partes.flatMap((x) => x.data.registeredExecutions),
    exerciseId,
    bandas,
  );
}
