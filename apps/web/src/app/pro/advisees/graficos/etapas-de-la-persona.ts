'use client';

/**
 * Las versiones activadas de los planes de la persona en el último año, para elegir el período «Por versión del plan»
 * (WP-GRAFICOS-POR-FASE, GPF-03) fuera de la ficha: en el cuadro del ejercicio y en «Patrones» del plan. Las lee como
 * «Comparar etapas» en la ficha (`useEtapasDelAno`): las vigencias de API-PRJ-01 para Nutrición y para Entrenamiento,
 * en un año que termina hoy (el tope de la operación). La API decide con el acceso de este momento: un área que no
 * acompaña este profesional responde «no disponible» y no ofrece versiones. Nada se guarda en el navegador.
 */
import { etapasDelArea, type EtapaDePlanificacion, type ProyeccionResponse } from '@be/domain';
import { api, type Resultado } from '../../../../lib/api';
import { limitarLectura } from '../seguimiento/contexto';
import { restarDias } from '../seguimiento/estado';
import { useLeido } from './entrenamiento/lecturas-del-ejercicio';
import { DIAS_MAXIMOS_DE_LOS_GRAFICOS, type DominioDeLaEtapa } from './periodo-de-los-graficos';

export type LecturaDeLasEtapas =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly etapas: Readonly<Record<DominioDeLaEtapa, readonly EtapaDePlanificacion[]>>; readonly fallo: boolean };

/** Cuánto se reutiliza en memoria una lectura de las versiones del año: lo que tarda en armarse una pantalla. */
const REUTILIZAR_MS = 30_000;
const versionesLeidas = new Map<string, { readonly en: number; readonly respuesta: Promise<Resultado<ProyeccionResponse>> }>();

/**
 * Las versiones de un área en el último año (API-PRJ-01): la misma lectura para el selector de período de la ficha y
 * para «Comparar etapas» y «Cambio desde el plan» en «Analizar» (pulido de WP-GRAFICOS-POR-FASE: antes se pedía dos
 * veces). Se comparte la respuesta en vuelo y se reutiliza en memoria hasta 30 segundos; nada se guarda en el navegador.
 * Una falla no se reutiliza (reintentar pide de nuevo), y la clave lleva la sesión y la versión del acceso: si cambió un
 * permiso, se pide de nuevo y la API vuelve a decidir.
 */
export function leerLasVersionesDelAno(token: string, asesoradoId: string, dominio: DominioDeLaEtapa, hoy: string, versionDeAcceso = 0): Promise<Resultado<ProyeccionResponse>> {
  const clave = `${token}|${asesoradoId}|${hoy}|${dominio}|${versionDeAcceso}`;
  const ahora = Date.now();
  for (const [k, v] of versionesLeidas) if (ahora - v.en >= REUTILIZAR_MS) versionesLeidas.delete(k);
  const ya = versionesLeidas.get(clave);
  if (ya) return ya.respuesta;
  const base = { periodStart: restarDias(hoy, DIAS_MAXIMOS_DE_LOS_GRAFICOS - 1), periodEnd: hoy };
  const respuesta = dominio === 'TRAINING' ? api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', base) : api.proyeccion(token, asesoradoId, 'NUTRITION_PRESCRIBED_VS_RECORDED', { ...base, metric: 'RECORDS' });
  const entrada = { en: ahora, respuesta };
  versionesLeidas.set(clave, entrada);
  void respuesta.then(
    (r) => {
      if (!r.ok && versionesLeidas.get(clave) === entrada) versionesLeidas.delete(clave);
    },
    () => {
      if (versionesLeidas.get(clave) === entrada) versionesLeidas.delete(clave);
    },
  );
  return respuesta;
}

export const SIN_ETAPAS: Readonly<Record<DominioDeLaEtapa, readonly EtapaDePlanificacion[]>> = { TRAINING: [], NUTRITION: [] };

export function useEtapasDeLaPersona(
  token: string,
  asesoradoId: string,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
  hoy: string,
  areas: readonly DominioDeLaEtapa[] = ['TRAINING', 'NUTRITION'],
  versionDeAcceso = 0,
): LecturaDeLasEtapas {
  const { leido } = useLeido(`etapas-de-la-persona|${asesoradoId}|${hoy}|${areas.join(',')}|${versionDeAcceso}`, async (): Promise<LecturaDeLasEtapas> => {
    const leer = (d: DominioDeLaEtapa) => limitarLectura(() => leerLasVersionesDelAno(token, asesoradoId, d, hoy, versionDeAcceso));
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
