/**
 * Las marcas de los gráficos por su sentido (DL-174): qué forma lleva cada dato, para que la forma diga el estado además
 * del color. Lo indicado por el plan va siempre hueco; lo registrado, lleno; lo precargado del plan («carga rápida»,
 * DL-161), hueco y gris, porque no es dato de la persona. El website lo dibuja con `graficos/marcas.tsx`; la APK lo puede
 * usar después del 25/11 (PG-18).
 */
import type { PuntoAnalitico } from './contratos-analisis';
import type { PuntoDeFuerza } from './contratos-fuerza';
import { esPuntoDeCargaRapida } from './series-del-analisis';
import type { SerieDisponible } from './series-disponibles';

/** La forma de una marca. El color nunca es lo único: cada una se distingue por su forma. */
export type MarcaSemantica = 'LLENA' | 'HUECA' | 'HUECA_GRIS' | 'ROMBO' | 'CONTORNO_CORTADO' | 'PUNTO_ADENTRO';

export const MARCA_SEGUN_EL_DATO = {
  REGISTRADO: 'LLENA',
  /** Lo que indica el plan: siempre hueco. */
  INDICADO: 'HUECA',
  /** Un día de Nutrición con algo que falta. */
  SUBTOTAL: 'HUECA',
  /** DL-161: los números del plan, tildados sin escribir. */
  CARGA_RAPIDA: 'HUECA_GRIS',
  /** El 1RM estimado de 10 a 12 repeticiones equivalentes. */
  ORIENTATIVA: 'HUECA',
  /** API-FZA-01: la serie que observó el profesional. */
  OBSERVADA_POR_EL_PROFESIONAL: 'ROMBO',
  REPORTADO: 'CONTORNO_CORTADO',
  CALCULADO: 'PUNTO_ADENTRO',
} as const satisfies Readonly<Record<string, MarcaSemantica>>;

export type SentidoDeLaMarca = keyof typeof MARCA_SEGUN_EL_DATO;

/**
 * La marca de un punto de una serie analítica. Lo indicado manda sobre todo; después, lo precargado del plan; después,
 * la clase del dato en Antropometría; y un subtotal o un balde sin completar van huecos.
 */
export function marcaDelPunto(p: PuntoAnalitico, serie: Pick<SerieDisponible, 'marca'>): MarcaSemantica {
  if (serie.marca === 'INDICADO') return MARCA_SEGUN_EL_DATO.INDICADO;
  if (esPuntoDeCargaRapida(p)) return MARCA_SEGUN_EL_DATO.CARGA_RAPIDA;
  if (p.dataClass === 'REPORTED') return MARCA_SEGUN_EL_DATO.REPORTADO;
  if (p.dataClass === 'DERIVED') return MARCA_SEGUN_EL_DATO.CALCULADO;
  if (p.quality === 'PARTIAL' || p.partialBucket) return MARCA_SEGUN_EL_DATO.SUBTOTAL;
  return MARCA_SEGUN_EL_DATO.REGISTRADO;
}

/** La marca de un punto del 1RM estimado: rombo para lo observado, hueca para lo orientativo, llena para el núcleo. */
export function marcaDelPuntoDeFuerza(p: Pick<PuntoDeFuerza, 'source' | 'estimate'>): MarcaSemantica {
  if (p.source === 'OBSERVED') return MARCA_SEGUN_EL_DATO.OBSERVADA_POR_EL_PROFESIONAL;
  return p.estimate.band === 'ORIENTATIVE' ? MARCA_SEGUN_EL_DATO.ORIENTATIVA : MARCA_SEGUN_EL_DATO.REGISTRADO;
}
