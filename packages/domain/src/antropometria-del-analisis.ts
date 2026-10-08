/**
 * Antropometría en «Analizar» (WP-DASHBOARD-PROFESIONAL §6; encargo §12): la serie de API-ANT-06 en la forma común, sin
 * otro método de comparabilidad (encargo §3: «no reemplaces el método canónico por otro ad hoc»).
 *
 * - **Un punto por medición vigente:** dos tomas del mismo día son dos puntos, cada uno con su hora y su evaluación.
 * - **Un tramo por grupo de comparabilidad** (protocolo, método y unidad, REG-06-162), que además se corta donde la API
 *   dice que un punto no es comparable con el anterior (REG-06-164). La línea nunca une tramos.
 * - Sin el error técnico de medición documentado no hay intervalos ni «cambio significativo» (Perini 2005; encargo §12).
 */
import type { PuntoAnalitico, SerieAnalitica } from './contratos-analisis';
import type { SerieApi } from './contratos-antropometria';
import { fechaCivil } from './fechas-civiles';
import type { DefinicionDeMetrica } from './metricas-del-analisis';
import { nombreDeMetodo } from './nombres-de-metricas';

const MOTIVO_DE_CORTE: Readonly<Record<string, string>> = {
  PROTOCOL: 'Cambió el protocolo de medición.',
  METHOD: 'Cambió el método de cálculo.',
  UNIT: 'Cambió la unidad.',
};

export function serieAntropometrica(serie: SerieApi, definicion: DefinicionDeMetrica, zonaHoraria: string): SerieAnalitica {
  const grupos = new Map(serie.comparability.groups.map((g) => [g.comparabilityGroup, g] as const));
  const puntos: PuntoAnalitico[] = [];
  const tramos: SerieAnalitica['segments'] = [];
  let tramoActual: string | null = null;
  let contador = 0;
  for (const p of [...serie.series].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.sourceId.localeCompare(b.sourceId))) {
    const cambiaDeGrupo = tramoActual === null || !tramoActual.startsWith(`${p.comparabilityGroup}#`);
    if (cambiaDeGrupo || p.incomparableWithPrevious.length > 0) {
      contador++;
      tramoActual = `${p.comparabilityGroup}#${contador}`;
      const g = grupos.get(p.comparabilityGroup);
      const metodo = g?.methodVersionId ? (nombreDeMetodo(g.methodVersionId) ?? 'método identificado') : null;
      tramos.push({
        segment: tramoActual,
        label: [g?.protocolName ?? 'Protocolo', metodo, g?.unit ?? p.unit].filter(Boolean).join(' · '),
        breakReason: tramos.length === 0 ? null : p.incomparableWithPrevious.map((m) => MOTIVO_DE_CORTE[m] ?? m).join(' ') || 'Otro grupo comparable.',
      });
    }
    puntos.push({
      pointId: `m:${p.sourceId}`,
      date: fechaCivil(p.occurredAt, zonaHoraria),
      dateEnd: null,
      at: p.occurredAt,
      value: p.value,
      quality: 'COMPLETE',
      n: 1,
      segment: tramoActual as string,
      corrected: p.correctionState === 'CORRECTED',
      partialBucket: false,
      coverage: null,
      missing: [],
      detail: [
        { label: 'Clase de dato', value: p.dataClass === 'DERIVED' ? 'Resultado de un método' : p.dataClass === 'REPORTED' ? 'Informado por la persona' : 'Medición directa' },
        ...(p.correctionState === 'CORRECTED' ? [{ label: 'Valor vigente', value: 'Corregido' }] : []),
      ],
      sources: [{ type: 'ANTHROPOMETRIC_EVALUATION', id: p.sourceEvaluationId }],
      sourcesTruncated: false,
    });
  }
  // Dos tomas del mismo día: cada una dice cuál es («1 de 2»).
  const porDia = new Map<string, number>();
  for (const p of puntos) porDia.set(p.date, (porDia.get(p.date) ?? 0) + 1);
  const orden = new Map<string, number>();
  const conOrden = puntos.map((p) => {
    const total = porDia.get(p.date) ?? 1;
    if (total === 1) return p;
    const n = (orden.get(p.date) ?? 0) + 1;
    orden.set(p.date, n);
    return { ...p, detail: [...p.detail, { label: 'Toma del día', value: `${n} de ${total}` }] };
  });
  return {
    metricId: definicion.id,
    label: definicion.nombre,
    unit: puntos[0] ? (grupos.get(serie.series[0]?.comparabilityGroup ?? '')?.unit ?? definicion.unidad) : definicion.unidad,
    scale: definicion.escala,
    grain: 'ORIGINAL',
    aggregation: 'NONE',
    points: conOrden,
    gaps: serie.gaps.map((g) => ({ from: g.from, to: g.to, days: g.days, state: 'NO_DATA' as const })),
    segments: tramos,
    notes: [...definicion.limites, ...(tramos.length > 1 ? ['La línea se corta donde cambia el protocolo, el método o la unidad: los tramos no se unen.'] : [])],
  };
}
