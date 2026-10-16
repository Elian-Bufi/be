/**
 * Antropometría en «Analizar» (WP-DASHBOARD-PROFESIONAL §6; encargo §12): la serie de API-ANT-06 en la forma común, sin
 * otro método de comparabilidad (encargo §3: «no reemplaces el método canónico por otro ad hoc»).
 *
 * - **Un punto por medición vigente:** dos tomas del mismo día son dos puntos, cada uno con su hora y su evaluación.
 * - **Un tramo por grupo de comparabilidad** (protocolo, método y unidad, REG-06-162), que además se corta donde la API
 *   dice que un punto no es comparable con el anterior (REG-06-164). La línea nunca une tramos.
 * - Sin el error técnico de medición documentado no hay intervalos ni «cambio significativo» (Perini 2005; encargo §12).
 */
import type { MetodoDelPunto, NaturalezaDelMetodo, PuntoAnalitico, SerieAnalitica } from './contratos-analisis';
import type { CategoriaDeMetodo } from './calculo';
import type { SerieApi } from './contratos-antropometria';
import { fechaCivil } from './fechas-civiles';
import type { DefinicionDeMetrica } from './metricas-del-analisis';
import { CATEGORIA_DE_METODO, nombreDeMetodo } from './nombres-de-metricas';

/**
 * Medido, reportado por la persona o calculado por un método: la frontera que no se borra (04:1090), con las palabras de
 * la pestaña de Antropometría (`ETIQUETA_DE_CLASE_DE_DATO`: Medido, Reportado, Calculado) y lo que hace falta aclarar.
 * «Calculado» no dice por sí solo si es una estimación: lo dice la naturaleza del método (`claseEnPalabras`).
 */
export const TEXTO_DE_CLASE: Readonly<Record<'MEASURED' | 'REPORTED' | 'DERIVED', string>> = {
  MEASURED: 'Medido',
  REPORTED: 'Reportado por la persona, no medido',
  DERIVED: 'Calculado por un método',
};

const NATURALEZA_DE_LA_CATEGORIA: Readonly<Record<CategoriaDeMetodo, NaturalezaDelMetodo>> = {
  INDICES: 'INDEX',
  SUMAS_DE_PLIEGUES: 'SKINFOLD_SUM',
  GRASA_CORPORAL: 'ESTIMATE',
  MASAS: 'ESTIMATE',
  SOMATOTIPO: 'SOMATOTYPE_RATING',
};

/** La naturaleza de una versión de método, desde la categoría de su ficha; `UNSPECIFIED` si el catálogo no la dice. */
export function naturalezaDelMetodo(methodVersionId: string | null): NaturalezaDelMetodo {
  const categoria = methodVersionId ? CATEGORIA_DE_METODO[methodVersionId] : undefined;
  return categoria ? NATURALEZA_DE_LA_CATEGORIA[categoria] : 'UNSPECIFIED';
}

/** El método de un valor calculado, con su nombre y su naturaleza, o `null` si no hay versión identificada. */
export function metodoDelPunto(methodVersionId: string | null): MetodoDelPunto | null {
  return methodVersionId ? { methodVersionId, name: nombreDeMetodo(methodVersionId), nature: naturalezaDelMetodo(methodVersionId) } : null;
}

/** Qué es un valor calculado, según la naturaleza del método. Nunca dice «estimación» de un índice ni de una suma. */
export const TEXTO_DE_NATURALEZA: Readonly<Record<NaturalezaDelMetodo, string>> = {
  INDEX: 'un índice calculado sobre medidas, no una estimación',
  SKINFOLD_SUM: 'una suma de pliegues medidos, no una estimación',
  ESTIMATE: 'una estimación con una ecuación de predicción',
  SOMATOTYPE_RATING: 'un componente del somatotipo (una calificación calculada)',
  UNSPECIFIED: 'calculado por un método',
};

/**
 * La clase de un dato en palabras, con la naturaleza del método cuando es calculado: «Calculado: un índice calculado
 * sobre medidas, no una estimación». Sin método identificado queda «Calculado por un método», sin afirmar que estima.
 */
export function claseEnPalabras(dataClass: 'MEASURED' | 'REPORTED' | 'DERIVED', metodo: MetodoDelPunto | null): string {
  if (dataClass !== 'DERIVED' || metodo === null || metodo.nature === 'UNSPECIFIED') return TEXTO_DE_CLASE[dataClass];
  return `Calculado: ${TEXTO_DE_NATURALEZA[metodo.nature]}`;
}

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
    const metodo = p.dataClass === 'DERIVED' ? metodoDelPunto(grupos.get(p.comparabilityGroup)?.methodVersionId ?? null) : null;
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
      dataClass: p.dataClass,
      method: metodo,
      planVersionIds: [],
      coverage: null,
      missing: [],
      detail: [
        { label: 'Clase de dato', value: claseEnPalabras(p.dataClass, metodo) },
        ...(metodo ? [{ label: 'Método', value: metodo.name ?? 'Método identificado, sin nombre en BE' }] : []),
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
