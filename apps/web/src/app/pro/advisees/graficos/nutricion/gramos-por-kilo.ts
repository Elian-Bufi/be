/**
 * GR-13 · Los gramos por kilo de lo registrado (WP-GRAFICOS fase 2, rama C; DL-174; GR-T13). Se derivan en el website,
 * sin una lectura nueva, con dos lecturas que ya decide el PDP: los gramos del día (API-PRJ-01 de Nutrición) y el peso
 * de las tomas (API-PRJ-01 de Antropometría), las dos del profesional que consulta (caso 1).
 *
 * - **El peso de cada día es el de la última toma propia en ese día o antes.** No es la regla de API-PLN-03 (el último
 *   peso al guardar el plan): una serie del pasado no puede usar un peso posterior.
 * - **Solo el peso medido, en kg** (GR-T43): un peso reportado por la persona o en otra unidad no se usa.
 * - Sin una toma anterior, el día no tiene valor: no se inventa ni se arrastra un peso posterior.
 * - Cada punto dice la fecha del peso que usó, y la línea se corta donde cambia el peso usado: el g/kg cambia aunque no
 *   cambie lo registrado, y eso se tiene que ver.
 * - La calidad del día no cambia: un subtotal en gramos es un subtotal en g/kg.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { numero, type PuntoAnalitico, type SerieAnalitica } from '@be/domain';
import { diaYMes } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C } from './copy';

/** Un peso medido en una toma propia, en kg. */
export interface PesoDeLaToma {
  readonly clave: string;
  readonly fecha: string;
  /** La hora de la toma: dos el mismo día se ordenan por ella. */
  readonly en: string | null;
  readonly valor: number;
}

/** El motivo que lleva un día sin una toma anterior (en `missing`): la lectura lo dice. */
export const SIN_TOMA_ANTERIOR = 'SIN_TOMA_ANTERIOR';

/** La unidad de un tramo de Antropometría: la última parte de su rótulo («Protocolo · método · kg»). */
const unidadDelTramo = (serie: SerieAnalitica, tramo: string): string | null => {
  const t = serie.segments.find((s) => s.segment === tramo);
  return t ? (t.label.split(' · ').pop() ?? null) : null;
};

/** Los pesos medidos en kg de una serie de Antropometría (`antropometria.peso`), del más viejo al más nuevo. */
export function pesosMedidos(serie: SerieAnalitica | null): PesoDeLaToma[] {
  if (!serie) return [];
  return serie.points
    .filter((p) => p.value !== null && Number.isFinite(p.value) && p.value > 0 && p.dataClass === 'MEASURED' && (unidadDelTramo(serie, p.segment) ?? serie.unit) === 'kg')
    .map((p) => ({ clave: p.pointId, fecha: p.date, en: p.at, valor: p.value as number }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.en ?? '').localeCompare(b.en ?? '') || a.clave.localeCompare(b.clave));
}

/** El peso de un día: el de la última toma en ese día o antes; `null` si no hay ninguna anterior. */
export function pesoDelDia(pesos: readonly PesoDeLaToma[], fecha: string): PesoDeLaToma | null {
  let elegido: PesoDeLaToma | null = null;
  for (const p of pesos) {
    if (p.fecha > fecha) break;
    elegido = p;
  }
  return elegido;
}

/** «peso del 3/11: 72,4 kg»: lo que dice cada punto del peso que usó. */
export const pesoEnPalabras = (p: PesoDeLaToma): string => C.porKilo.pesoUsado(`${numero(p.valor)} kg`, diaYMes(p.fecha));

/**
 * La serie en g/kg de una serie de gramos por día: el mismo punto, dividido por el peso de su día, con la fecha del peso
 * en el detalle. Un día sin peso anterior queda sin valor, con su motivo. El tramo se corta donde cambia el peso usado.
 */
export function serieAnaliticaPorKilo(gramos: SerieAnalitica, pesos: readonly PesoDeLaToma[], metricId: string, nombre: string): SerieAnalitica {
  const tramos = new Map<string, { label: string; peso: string | null }>();
  const puntos = gramos.points.map((p): PuntoAnalitico => {
    const peso = p.dateEnd === null ? pesoDelDia(pesos, p.date) : null;
    const pointId = `${p.pointId}|kg`;
    if (peso === null) {
      const segment = `${p.segment}|sin-peso`;
      if (!tramos.has(segment)) tramos.set(segment, { label: C.porKilo.sinPesoAnterior, peso: null });
      return {
        ...p,
        pointId,
        value: null,
        quality: 'UNKNOWN',
        segment,
        missing: [...p.missing, { reason: SIN_TOMA_ANTERIOR, count: 1 }],
        detail: [...p.detail, { label: 'Peso usado', value: C.porKilo.sinPesoAnterior }],
      };
    }
    const segment = `${p.segment}|${peso.clave}`;
    if (!tramos.has(segment)) tramos.set(segment, { label: pesoEnPalabras(peso), peso: peso.clave });
    return {
      ...p,
      pointId,
      value: p.value === null ? null : p.value / peso.valor,
      segment,
      detail: [...p.detail, { label: 'Peso usado', value: pesoEnPalabras(peso) }],
    };
  });
  let anterior: string | null | undefined;
  const segments = [...tramos.entries()].map(([segment, t], i) => {
    const corte = i > 0 && t.peso !== anterior ? 'Cambió el peso usado: es de otra toma.' : null;
    anterior = t.peso;
    return { segment, label: t.label, breakReason: i === 0 ? null : (corte ?? 'Un día sin registros, o sin valor conocido, corta la línea.') };
  });
  return {
    metricId,
    label: nombre,
    unit: 'g/kg',
    scale: 'RATIO',
    grain: 'DAY',
    aggregation: 'SUM_OF_KNOWN',
    points: puntos,
    gaps: gramos.gaps,
    segments,
    notes: [C.porKilo.reglaDelPeso, C.porKilo.pesoViejo],
  };
}

/** Los pesos que usó una serie en g/kg, sin repetir, en el orden en que rigen. */
export function pesosUsados(pesos: readonly PesoDeLaToma[], fechas: readonly string[]): PesoDeLaToma[] {
  const usados = new Map<string, PesoDeLaToma>();
  for (const f of fechas) {
    const p = pesoDelDia(pesos, f);
    if (p && !usados.has(p.clave)) usados.set(p.clave, p);
  }
  return [...usados.values()];
}

/**
 * Desde cuándo buscar el peso anterior al período (GR-T44): hasta un año antes de su primer día, sin pasar del inicio del
 * vínculo (TB-16: lo anterior al acompañamiento no se lee). `null` si no hay nada que buscar antes.
 */
export function inicioDeLaBusquedaDelPeso(desde: string, desdeElVinculo: string | null): { readonly desde: string; readonly hasta: string } | null {
  const unAnio = new Date(Date.parse(`${desde}T12:00:00Z`) - 365 * 86_400_000).toISOString().slice(0, 10);
  const inicio = desdeElVinculo !== null && desdeElVinculo > unAnio ? desdeElVinculo : unAnio;
  const hasta = new Date(Date.parse(`${desde}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return inicio <= hasta ? { desde: inicio, hasta } : null;
}
