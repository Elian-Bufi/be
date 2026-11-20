'use client';

/**
 * Las versiones activadas de los planes de la persona en el último año, para elegir el período «Por versión del plan»
 * (WP-GRAFICOS-POR-FASE, GPF-03) fuera de la ficha: en el cuadro del ejercicio y en «Patrones» del plan. Las lee como
 * «Comparar etapas» en la ficha (`useEtapasDelAno`): las vigencias de API-PRJ-01 para Nutrición y para Entrenamiento,
 * en un año que termina hoy (el tope de la operación). La API decide con el acceso de este momento: un área que no
 * acompaña este profesional responde «no disponible» y no ofrece versiones. Nada se guarda en el navegador.
 */
import { etapasDelArea, type EtapaDePlanificacion } from '@be/domain';
import { api, type Resultado } from '../../../../lib/api';
import { limitarLectura } from '../seguimiento/contexto';
import { restarDias } from '../seguimiento/estado';
import { useLeido } from './entrenamiento/lecturas-del-ejercicio';
import { DIAS_MAXIMOS_DE_LOS_GRAFICOS, type DominioDeLaEtapa } from './periodo-de-los-graficos';

export type LecturaDeLasEtapas =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly etapas: Readonly<Record<DominioDeLaEtapa, readonly EtapaDePlanificacion[]>>; readonly fallo: boolean };

export const SIN_ETAPAS: Readonly<Record<DominioDeLaEtapa, readonly EtapaDePlanificacion[]>> = { TRAINING: [], NUTRITION: [] };

export function useEtapasDeLaPersona(token: string, asesoradoId: string, sesionPerdida: (r: Resultado<unknown>) => boolean, hoy: string, areas: readonly DominioDeLaEtapa[] = ['TRAINING', 'NUTRITION']): LecturaDeLasEtapas {
  const { leido } = useLeido(`etapas-de-la-persona|${asesoradoId}|${hoy}|${areas.join(',')}`, async (): Promise<LecturaDeLasEtapas> => {
    const base = { periodStart: restarDias(hoy, DIAS_MAXIMOS_DE_LOS_GRAFICOS - 1), periodEnd: hoy };
    const leer = (d: DominioDeLaEtapa) =>
      limitarLectura(() => (d === 'TRAINING' ? api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', base) : api.proyeccion(token, asesoradoId, 'NUTRITION_PRESCRIBED_VS_RECORDED', { ...base, metric: 'RECORDS' })));
    const respuestas = await Promise.all(areas.map(async (d) => [d, await leer(d)] as const));
    if (respuestas.some(([, r]) => sesionPerdida(r))) return { tipo: 'cargando' };
    const ahora = new Date().toISOString();
    const etapas: Record<DominioDeLaEtapa, EtapaDePlanificacion[]> = { TRAINING: [], NUTRITION: [] };
    let fallo = false;
    for (const [d, r] of respuestas) {
      // Un 404 es un área que este profesional no acompaña: no ofrece versiones, y no es una falla.
      if (!r.ok) {
        if (!(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND')) fallo = true;
        continue;
      }
      const res = r.datos.data.result;
      if (r.datos.data.dataState === 'NOT_AVAILABLE_TO_VIEW' || !res || res.kind === 'ANTHROPOMETRY_LONGITUDINAL') continue;
      etapas[d] = etapasDelArea(res.planVersions, d, hoy, r.datos.data.generatedAt ?? ahora);
    }
    return { tipo: 'lista', etapas, fallo };
  });
  return leido ?? { tipo: 'cargando' };
}
