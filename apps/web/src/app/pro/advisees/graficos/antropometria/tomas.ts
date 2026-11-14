/**
 * Las observaciones de las tomas para GR-18 y GR-20 (WP-GRAFICOS fase 2, rama C; DL-174), de una o más respuestas de
 * API-ANT-06 (la de «Evolución» o las de los tramos de 92 días), sin repetir una observación. Como GR-16, los grupos de
 * comparabilidad se juntan **por lo que son** (protocolo, método y unidad): cada respuesta los nombra a su manera
 * (`cmp-1`…), así que entre tramos no se comparan por el nombre.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { fechaCivil, type EvolucionResponse } from '@be/domain';

type DatosDeLaEvolucion = EvolucionResponse['data'];

export interface ObservacionDeLaToma {
  readonly metrica: string;
  readonly sourceId: string;
  readonly evaluacionId: string;
  /** La fecha civil de la toma, en la zona de la respuesta. */
  readonly fecha: string;
  /** El instante de la toma, para ordenar y ubicar en el eje. */
  readonly en: string;
  readonly registrado: string;
  readonly valor: number;
  readonly unidad: string;
  readonly clase: 'MEASURED' | 'REPORTED' | 'DERIVED';
  /** Protocolo, método y unidad: dos observaciones se comparan solo si comparten esta clave. */
  readonly comparable: string;
  readonly metodoVersionId: string | null;
  readonly corregido: boolean;
}

/** Todas las observaciones de las respuestas, una vez cada una, en el orden en que ocurrieron. */
export function observacionesDeLasTomas(respuestas: readonly DatosDeLaEvolucion[]): ObservacionDeLaToma[] {
  const vistas = new Set<string>();
  const salida: ObservacionDeLaToma[] = [];
  for (const r of respuestas) {
    for (const serie of r.metrics) {
      const grupos = new Map(serie.comparability.groups.map((g) => [g.comparabilityGroup, g] as const));
      for (const p of serie.series) {
        const clave = `${serie.metricCode}|${p.sourceId}`;
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        const g = grupos.get(p.comparabilityGroup);
        salida.push({
          metrica: serie.metricCode,
          sourceId: p.sourceId,
          evaluacionId: p.sourceEvaluationId,
          fecha: fechaCivil(p.occurredAt, r.period.timeZone),
          en: new Date(p.occurredAt).toISOString(),
          registrado: new Date(p.recordedAt).toISOString(),
          valor: p.value,
          unidad: g?.unit ?? p.unit,
          clase: p.dataClass,
          // Sin su grupo no se sabe con qué se compara: no se compara con nada.
          comparable: g ? `${g.protocolVersionId}|${g.methodVersionId ?? ''}|${g.unit}` : `sin-grupo|${p.sourceId}`,
          metodoVersionId: g?.methodVersionId ?? null,
          corregido: p.correctionState === 'CORRECTED',
        });
      }
    }
  }
  return salida.sort((a, b) => a.en.localeCompare(b.en) || a.registrado.localeCompare(b.registrado) || a.sourceId.localeCompare(b.sourceId));
}

/** Si alguna respuesta dice que hay tomas de otro profesional que no se muestran (`partialView`). */
export const conTomasDeOtros = (respuestas: readonly DatosDeLaEvolucion[]): boolean => respuestas.some((r) => r.partialView);
