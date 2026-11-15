'use client';

/**
 * Las lecturas de los gráficos de Antropometría (WP-GRAFICOS fase 2, rama C; DL-174): API-ANT-06, la misma de
 * «Evolución», en tramos de 92 días que cubren el período (`leerEnTramos`), con el acceso de ese momento. Trae solo las
 * tomas del profesional que consulta (caso 1); si hay de otro, la respuesta lo dice (`partialView`) y el gráfico también.
 */
import type { EvolucionResponse } from '@be/domain';
import { api } from '../../../../../lib/api';
import { motivoDeFalla } from '../../seguimiento/contexto';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import { leerEnTramos, type ParametrosDeLectura } from '../lecturas';
import type { Leido } from '../nutricion-y-cuerpo/leido';

export interface TomasLeidas {
  readonly respuestas: readonly EvolucionResponse['data'][];
  readonly enTramos: boolean;
}

/** Las tomas del período, de todas las medidas o solo de `medidas`. */
export async function leerTomasDelPeriodo(l: Omit<ParametrosDeLectura, 'periodo'>, periodo: PeriodoDelGrafico, medidas: readonly string[] | null = null): Promise<Leido<TomasLeidas>> {
  const { partes, enTramos, falla } = await leerEnTramos(periodo, 92, (desde, hasta) =>
    api.evolucionAntropometrica(l.token, l.asesoradoId, { periodStart: desde, periodEnd: hasta, ...(medidas ? { metric: medidas.join(',') } : {}) }),
  );
  if (falla) {
    if (l.sesionPerdida(falla)) return { tipo: 'SESION' };
    if (!falla.ok && falla.tipo === 'API' && falla.codigo === 'RESOURCE_NOT_FOUND') return { tipo: 'SIN_ACCESO' };
    return { tipo: 'ERROR', motivo: motivoDeFalla(falla) };
  }
  return { tipo: 'LISTO', datos: { respuestas: partes.map((p) => p.data), enTramos } };
}
