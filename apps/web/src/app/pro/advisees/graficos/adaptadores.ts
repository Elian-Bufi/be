/**
 * De cada respuesta a carriles (WP-GRAFICOS fase 2, DL-174): una serie analítica de API-PRJ-01, el 1RM estimado y las
 * vigencias de los planes. Acá no se suma, promedia ni interpola nada: se cambia la forma y se decide la marca con el
 * dominio (`marcaDelPunto`), para que lo precargado del plan nunca se dibuje como dato de la persona.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`. Lo indicado del entrenamiento (API-TRN-21 y API-SER-01)
 * llega en el próximo commit de la rama base.
 */
import {
  marcaDelPunto,
  marcaDelPuntoDeFuerza,
  type AreaDeMetrica,
  type PuntoAnalitico,
  type PuntoDeFuerza,
  type ResultadoDeEstimacionDeFuerza,
  type SerieAnalitica,
  type SerieDisponible,
  type VigenciaDePlan,
} from '@be/domain';
import type { BandaDeVersion, CarrilDePuntos, EscalaDelCarril, PuntoDelCarril } from './carriles';

const AREA_DEL_DOMINIO: Readonly<Record<VigenciaDePlan['domain'], AreaDeMetrica>> = { NUTRITION: 'NUTRICION', TRAINING: 'ENTRENAMIENTO', ANTHROPOMETRY: 'ANTROPOMETRIA' };

/** Las versiones de los planes de un área como bandas de fondo: «v3 · desde el 2/9». Contexto, no «plan cumplido». */
export function bandasDeVersion(vigencias: readonly VigenciaDePlan[], area: AreaDeMetrica): BandaDeVersion[] {
  return vigencias
    .filter((v) => AREA_DEL_DOMINIO[v.domain] === area)
    .map((v) => ({ area, desde: v.from, hasta: v.to, rotulo: `${v.label} · desde el ${Number(v.from.slice(8, 10))}/${Number(v.from.slice(5, 7))}` }));
}

/** Un punto analítico como punto de un carril, con la marca del dominio y la lectura que diga la pantalla. */
export function puntoDelCarril(p: PuntoAnalitico, serie: Pick<SerieDisponible, 'marca'>, lectura: (p: PuntoAnalitico) => string, tarde = false): PuntoDelCarril {
  return { clave: p.pointId, fecha: p.date, hasta: p.dateEnd, en: p.at, valor: p.value, rango: null, tramo: p.segment, marca: marcaDelPunto(p, serie), tarde, lectura: lectura(p) };
}

export interface OpcionesDelCarril {
  readonly id: string;
  readonly nombre: string;
  readonly indice: number;
  readonly metodo: string | null;
  readonly escala: EscalaDelCarril;
  readonly descripcion: string;
  /** Lo que dice la lectura de cada punto («96 kg · 5 rep · RIR 1»). */
  readonly lectura: (p: PuntoAnalitico) => string;
  /** Las fechas con registros cargados en un día posterior (API-DSH-04 con `recordedLate`). */
  readonly cargadoTarde?: ReadonlySet<string>;
  readonly indicado?: readonly PuntoDelCarril[];
  readonly escalones?: CarrilDePuntos['escalones'];
}

/** Una serie analítica como carril de puntos. Antropometría no une sus tomas (`unirPuntos: false`). */
export function carrilDeSerie(s: SerieAnalitica, serie: SerieDisponible, o: OpcionesDelCarril): CarrilDePuntos {
  const tarde = o.cargadoTarde ?? new Set<string>();
  const sin = new Set(s.gaps.flatMap((g) => diasEntre(g.from, g.to)));
  const conDato = new Set(s.points.filter((p) => p.value !== null).map((p) => p.date));
  const hueco = new Set(s.points.filter((p) => p.value !== null && (p.quality !== 'COMPLETE' || p.partialBucket)).map((p) => p.date));
  const fechas = [...new Set([...sin, ...conDato])].sort();
  return {
    tipo: 'PUNTOS',
    id: o.id,
    nombre: o.nombre,
    unidad: s.unit,
    metodo: o.metodo,
    indice: o.indice,
    puntos: s.points.map((p) => puntoDelCarril(p, serie, o.lectura, tarde.has(p.date))),
    indicado: o.indicado ?? [],
    escalones: o.escalones ?? [],
    unir: serie.unirPuntos,
    escala: o.escala,
    cobertura: fechas.map((fecha): CarrilDePuntos['cobertura'][number] => ({ fecha, estado: sin.has(fecha) && !conDato.has(fecha) ? 'sin' : hueco.has(fecha) ? 'hueco' : 'con' })),
    descripcion: o.descripcion,
  };
}

function diasEntre(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  for (let t = Date.parse(`${desde}T12:00:00Z`); t <= Date.parse(`${hasta}T12:00:00Z`); t += 86_400_000) dias.push(new Date(t).toISOString().slice(0, 10));
  return dias;
}

/**
 * El 1RM estimado (API-PRJ-01 `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`, DL-171) con la forma de una serie analítica, para
 * que «Analizar» y los gráficos lo dibujen sin otro camino. Cada punto es una sesión (o una observación del profesional);
 * la marca la decide `marcaDelPuntoDeFuerza`, que lee la banda y la procedencia del punto. Los puntos sin la misma
 * unidad que la línea no entran: kg y lb nunca van juntas.
 */
export function serieDeLaFuerza(r: ResultadoDeEstimacionDeFuerza): SerieAnalitica | null {
  const linea = r.estimate;
  if (!linea) return null;
  const puntos = linea.points.filter((p) => p.estimate.load.unit === linea.unit);
  return {
    metricId: 'entrenamiento.1rm-estimado',
    label: '1RM estimado (Epley v1)',
    unit: linea.unit,
    scale: 'RATIO',
    grain: 'ORIGINAL',
    aggregation: 'NONE',
    points: puntos.map(
      (p): PuntoAnalitico => ({
        pointId: p.pointId,
        date: p.date,
        dateEnd: null,
        at: null,
        value: p.estimate.value,
        quality: p.estimate.band === 'CORE' ? 'COMPLETE' : 'PARTIAL',
        n: 1,
        segment: p.source === 'OBSERVED' ? `observada:${p.pointId}` : 'estimacion',
        corrected: p.origin.type === 'TRAINING_EXECUTION' && p.origin.corrected,
        partialBucket: false,
        dataClass: null,
        method: null,
        planVersionIds: [],
        coverage: null,
        missing: [],
        detail: [{ label: 'Repeticiones equivalentes', value: String(p.estimate.equivalentRepetitions) }],
        sources: [],
        sourcesTruncated: false,
      }),
    ),
    gaps: [],
    segments: [{ segment: 'estimacion', label: 'Epley v1', breakReason: null }],
    notes: [],
  };
}

/** Los puntos del 1RM estimado como puntos de un carril, con la marca de la fuerza (rombo, hueca o llena). */
export function puntosDeLaFuerza(puntos: readonly PuntoDeFuerza[], unidad: 'kg' | 'lb', lectura: (p: PuntoDeFuerza) => string): PuntoDelCarril[] {
  return puntos
    .filter((p) => p.estimate.load.unit === unidad)
    .map((p) => ({
      clave: p.pointId,
      fecha: p.date,
      hasta: null,
      en: null,
      valor: p.estimate.value,
      rango: null,
      // Lo observado no se une con lo de la persona: cada observación es su propio tramo.
      tramo: p.source === 'OBSERVED' ? `observada:${p.pointId}` : 'estimacion',
      marca: marcaDelPuntoDeFuerza(p),
      tarde: false,
      lectura: lectura(p),
    }));
}
