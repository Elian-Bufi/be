/**
 * GR-24 · Dos etapas lado a lado, con todas las observaciones (WP-GRAFICOS fase 2, DL-174). Sobre «Comparar dos etapas»
 * (C-12) de «Analizar», en «Patrones» y dentro de SP-01.
 *
 * - **Todas las observaciones, no solo un resumen:** cada día, sesión o toma de cada etapa es un punto, en su lugar
 *   dentro de la etapa; la mediana es una marca, y la cantidad va escrita («7 sesiones» y «9 sesiones»).
 * - **Con menos de 5 de un lado no se dibuja** y se dice cuánto hay de cada lado (regla de honestidad 8).
 * - **Lo que no entra en la mediana se ve y se cuenta:** un día con algún dato faltante, una serie de carga rápida, el día
 *   en curso, una estimación orientativa o una serie observada por el profesional van huecos (o en rombo) y fuera de la
 *   mediana, con su motivo.
 * - **Con el 1RM estimado,** debajo de cada etapa, la mediana del RIR registrado y el rango de repeticiones.
 * - Sin ordenar las etapas por mejor o peor: A es la anterior y B la siguiente. Sin restas en porcentaje. No es un
 *   experimento: el aprendizaje técnico, otro cambio del plan o el peso pueden explicar la diferencia.
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs`.
 */
import {
  esPuntoDeCargaRapida,
  marcaDelPunto,
  numero,
  valorConUnidad,
  type AreaDeMetrica,
  type DefinicionDeMetrica,
  type EtapaDePlanificacion,
  type MarcaSemantica,
  type PuntoAnalitico,
  type PuntoDeFuerza,
  type SerieAnalitica,
} from '@be/domain';
import { extremosDelCarril, type EscalaDelCarril } from '../carriles';
import { diaYMes, mediana } from './ventanas';

/** Con menos observaciones de un lado, dos etapas no se dibujan como patrón (Bearable y WHOOP; Kravitz y Duan 2014). */
export const MINIMO_POR_LADO = 5;

/** Cómo se cuenta una observación de cada área. */
export const CUENTA_DEL_AREA: Readonly<Record<AreaDeMetrica, readonly [string, string]>> = {
  NUTRICION: ['día', 'días'],
  ENTRENAMIENTO: ['sesión', 'sesiones'],
  ANTROPOMETRIA: ['toma', 'tomas'],
};

export const cantidadEnPalabras = (n: number, area: AreaDeMetrica): string => `${numero(n, 0)} ${n === 1 ? CUENTA_DEL_AREA[area][0] : CUENTA_DEL_AREA[area][1]}`;

/** Una etapa que se compara: una versión del plan (GR-24) o una etapa del objetivo nutricional (SP-01). */
export interface EtapaDeLaComparacion {
  readonly letra: 'A' | 'B';
  /** «versión 3», «objetivo desde el 2/9». */
  readonly rotulo: string;
  readonly desde: string;
  /** El último día entero de la etapa; `null` si no tiene ninguno (se activó otra versión el mismo día). */
  readonly ultimoDia: string | null;
  /** Con versión, las sesiones de Entrenamiento se asignan por la versión que ejecutaron; si no, por las fechas. */
  readonly planVersionId: string | null;
}

export const etapaDeLaPlanificacion = (e: EtapaDePlanificacion, letra: 'A' | 'B'): EtapaDeLaComparacion => ({
  letra,
  rotulo: `versión ${e.etiqueta.replace(/^v/, '')}`,
  desde: e.desde,
  ultimoDia: e.ultimoDia,
  planVersionId: e.planVersionId,
});

/** Las fechas de una etapa, en palabras: «del 2/9 al 6/10». */
export const fechasDeLaEtapa = (e: Pick<EtapaDeLaComparacion, 'desde' | 'ultimoDia'>): string => (e.ultimoDia === null ? `el ${diaYMes(e.desde)}, menos de un día` : `del ${diaYMes(e.desde)} al ${diaYMes(e.ultimoDia)}`);

export interface PuntoDeLaEtapa {
  readonly clave: string;
  readonly fecha: string;
  readonly valor: number;
  readonly marca: MarcaSemantica;
  readonly enLaMediana: boolean;
  readonly lectura: string;
}

/** Lo que se lee de la fuerza debajo de cada etapa: el ruido antes que el cambio (regla de honestidad 12). */
export interface FuerzaDeLaEtapa {
  readonly sesiones: number;
  readonly medianaDelRir: number | null;
  readonly repeticiones: { readonly desde: number; readonly hasta: number } | null;
}

export interface LadoDeLaComparacion {
  readonly etapa: EtapaDeLaComparacion;
  readonly puntos: readonly PuntoDeLaEtapa[];
  /** Las observaciones que entran en la mediana. */
  readonly n: number;
  readonly mediana: number | null;
  /** «2 con algún dato faltante», «1 de carga rápida»: lo que se ve y no entra en la mediana. */
  readonly afuera: readonly string[];
  /** «7 sesiones». */
  readonly cantidad: string;
  readonly fuerza: FuerzaDeLaEtapa | null;
}

export interface DosEtapasLadoALado {
  readonly unidad: string;
  readonly area: AreaDeMetrica;
  readonly lados: readonly [LadoDeLaComparacion, LadoDeLaComparacion];
  /** Con 5 o más de cada lado. */
  readonly dibujable: boolean;
  /** Cuánto hay de cada lado, si no alcanza. */
  readonly falta: { readonly hacen: number; readonly hay: readonly [number, number]; readonly unidad: string } | null;
  readonly extremos: { readonly abajo: number; readonly arriba: number; readonly decimales: number };
  /** El resumen en texto, para el lector de pantalla y para quien no mira el dibujo. */
  readonly descripcion: string;
}

export interface EntradaDeDosEtapas {
  /** Las observaciones (el día, la sesión o la toma), no un agrupado por semana. */
  readonly serie: SerieAnalitica;
  readonly definicion: Pick<DefinicionDeMetrica, 'id' | 'area' | 'decimales'>;
  readonly a: EtapaDeLaComparacion;
  readonly b: EtapaDeLaComparacion;
  /** Lo que se leyó: lo de afuera no entra. */
  readonly leido: { readonly desde: string; readonly hasta: string };
  readonly escala: EscalaDelCarril;
  readonly lectura: (p: PuntoAnalitico) => string;
  /** Con el 1RM estimado: sus puntos, para la mediana del RIR y el rango de repeticiones de cada etapa. */
  readonly fuerza?: readonly PuntoDeFuerza[] | null;
}

const ES_FUERZA = 'entrenamiento.1rm-estimado';

/** Por qué una observación se ve y no entra en la mediana; `null` si entra. */
function motivoAfuera(p: PuntoAnalitico, d: EntradaDeDosEtapas['definicion']): string | null {
  if (p.partialBucket) return p.dateEnd ? 'semana sin completar' : 'el día en curso';
  if (esPuntoDeCargaRapida(p)) return 'de carga rápida';
  if (d.id === ES_FUERZA && p.segment.startsWith('observada:')) return 'observada por el profesional';
  if (d.id === ES_FUERZA && p.quality === 'PARTIAL') return 'orientativa';
  if (d.area === 'NUTRICION' && p.quality !== 'COMPLETE') return 'con algún dato faltante';
  return null;
}

function marcaDe(p: PuntoAnalitico, d: EntradaDeDosEtapas['definicion']): MarcaSemantica {
  if (d.id === ES_FUERZA && p.segment.startsWith('observada:')) return 'ROMBO';
  return marcaDelPunto(p, { marca: d.area === 'ANTROPOMETRIA' ? 'MEDIDO_O_CALCULADO' : 'REGISTRADO' });
}

/** Lo de la fuerza en una etapa, por fechas (el punto de fuerza no trae su versión): solo lo escrito por la persona. */
function fuerzaDe(puntos: readonly PuntoDeFuerza[], e: EtapaDeLaComparacion): FuerzaDeLaEtapa {
  const propios = e.ultimoDia === null ? [] : puntos.filter((p) => p.source === 'PERSON' && p.date >= e.desde && p.date <= (e.ultimoDia as string));
  const reps = propios.map((p) => p.estimate.completedRepetitions);
  return {
    sesiones: propios.length,
    medianaDelRir: mediana(propios.map((p) => p.estimate.rir)),
    repeticiones: reps.length === 0 ? null : { desde: Math.min(...reps), hasta: Math.max(...reps) },
  };
}

/** Las dos etapas lado a lado, con todas sus observaciones, la mediana de cada una y lo que no entra en ella. */
export function dosEtapasLadoALado(e: EntradaDeDosEtapas): DosEtapasLadoALado {
  const { serie, definicion, leido } = e;
  const porVersion = definicion.area === 'ENTRENAMIENTO' && serie.points.some((p) => p.planVersionIds.length > 0);
  const deLaEtapa = (p: PuntoAnalitico, etapa: EtapaDeLaComparacion): boolean => {
    if (p.date < leido.desde || p.date > leido.hasta) return false;
    if (porVersion && etapa.planVersionId !== null) return p.planVersionIds.includes(etapa.planVersionId);
    return etapa.ultimoDia !== null && p.date >= etapa.desde && p.date <= etapa.ultimoDia;
  };
  const lado = (etapa: EtapaDeLaComparacion): LadoDeLaComparacion => {
    const propios = serie.points.filter((p): p is PuntoAnalitico & { value: number } => p.value !== null && deLaEtapa(p, etapa)).sort((x, y) => x.date.localeCompare(y.date));
    const motivos = new Map<string, number>();
    const puntos = propios.map((p): PuntoDeLaEtapa => {
      const motivo = motivoAfuera(p, definicion);
      if (motivo) motivos.set(motivo, (motivos.get(motivo) ?? 0) + 1);
      return { clave: p.pointId, fecha: p.date, valor: p.value, marca: marcaDe(p, definicion), enLaMediana: motivo === null, lectura: e.lectura(p) };
    });
    const enLaMediana = puntos.filter((p) => p.enLaMediana);
    return {
      etapa,
      puntos,
      n: enLaMediana.length,
      mediana: mediana(enLaMediana.map((p) => p.valor)),
      afuera: [...motivos.entries()].map(([motivo, n]) => `${numero(n, 0)} ${motivo}`),
      cantidad: cantidadEnPalabras(enLaMediana.length, definicion.area),
      fuerza: e.fuerza ? fuerzaDe(e.fuerza, etapa) : null,
    };
  };
  const a = lado(e.a);
  const b = lado(e.b);
  const dibujable = a.n >= MINIMO_POR_LADO && b.n >= MINIMO_POR_LADO;
  const unidad = serie.unit;
  const extremos = extremosDelCarril([...a.puntos, ...b.puntos].map((p) => p.valor), unidad, e.escala);
  const enPalabras = (l: LadoDeLaComparacion): string =>
    `Etapa ${l.etapa.letra} (${l.etapa.rotulo}, ${fechasDeLaEtapa(l.etapa)}): ${l.cantidad}${l.mediana === null ? ', sin mediana' : `, mediana ${valorConUnidad(l.mediana, unidad, definicion.decimales)}`}${l.afuera.length > 0 ? `; fuera de la mediana: ${l.afuera.join(', ')}` : ''}.`;
  return {
    unidad,
    area: definicion.area,
    lados: [a, b],
    dibujable,
    falta: dibujable ? null : { hacen: MINIMO_POR_LADO, hay: [a.n, b.n], unidad: CUENTA_DEL_AREA[definicion.area][1] },
    extremos,
    descripcion: `${enPalabras(a)} ${enPalabras(b)}`,
  };
}

/** La fuerza de una etapa, en palabras: «RIR registrado de mediana 1; series de 5 a 6 repeticiones». */
export function fuerzaEnPalabras(f: FuerzaDeLaEtapa): string {
  if (f.sesiones === 0) return 'Sin sesiones de la persona en esta etapa.';
  const rir = f.medianaDelRir === null ? 'sin RIR registrado' : `RIR registrado de mediana ${numero(f.medianaDelRir, 1)}`;
  const reps = f.repeticiones === null ? '' : f.repeticiones.desde === f.repeticiones.hasta ? `; series de ${f.repeticiones.desde} repeticiones` : `; series de ${f.repeticiones.desde} a ${f.repeticiones.hasta} repeticiones`;
  return `${rir}${reps}.`;
}

// ─── La geometría del dibujo ──────────────────────────────────────────────────────────────────────

export interface GeometriaDeDosEtapas {
  readonly columnas: readonly {
    readonly letra: 'A' | 'B';
    readonly x1: number;
    readonly x2: number;
    readonly marcas: readonly { readonly clave: string; readonly x: number; readonly y: number; readonly marca: MarcaSemantica }[];
    /** La mediana, como una raya a lo ancho de la columna; `null` sin mediana. */
    readonly mediana: { readonly y: number } | null;
  }[];
  readonly marcasY: readonly { readonly valor: number; readonly y: number }[];
}

/** El aire arriba y abajo, y el lugar para las marcas del eje vertical. */
export const MARGEN_DE_DOS_ETAPAS = { izquierda: 56, derecha: 12, aire: 12, entreColumnas: 28 } as const;

/**
 * Dónde va cada punto: cada etapa en su columna, cada observación en su fecha dentro de la etapa (para que se lea como la
 * etapa en el tiempo), y la misma escala vertical para las dos.
 */
export function geometriaDeDosEtapas(d: DosEtapasLadoALado, ancho: number, alto: number): GeometriaDeDosEtapas {
  const m = MARGEN_DE_DOS_ETAPAS;
  const util = Math.max(1, alto - 2 * m.aire);
  const y = (v: number): number => m.aire + util - ((v - d.extremos.abajo) / (d.extremos.arriba - d.extremos.abajo || 1)) * util;
  const anchoDeColumna = Math.max(40, (ancho - m.izquierda - m.derecha - m.entreColumnas) / 2);
  const columnas = d.lados.map((l, i) => {
    const x1 = m.izquierda + i * (anchoDeColumna + m.entreColumnas);
    const x2 = x1 + anchoDeColumna;
    const desde = Date.parse(`${l.etapa.desde}T12:00:00Z`);
    const hasta = Date.parse(`${l.etapa.ultimoDia ?? l.etapa.desde}T12:00:00Z`);
    const relleno = 10;
    const x = (fecha: string): number => {
      const t = Date.parse(`${fecha}T12:00:00Z`);
      const parte = hasta > desde ? (t - desde) / (hasta - desde) : 0.5;
      return x1 + relleno + Math.min(Math.max(parte, 0), 1) * (anchoDeColumna - 2 * relleno);
    };
    return {
      letra: l.etapa.letra,
      x1,
      x2,
      marcas: l.puntos.map((p) => ({ clave: p.clave, x: x(p.fecha), y: y(Math.min(Math.max(p.valor, d.extremos.abajo), d.extremos.arriba)), marca: p.marca })),
      mediana: l.mediana === null ? null : { y: y(l.mediana) },
    };
  });
  const paso = (d.extremos.arriba - d.extremos.abajo) / 2;
  return { columnas, marcasY: [d.extremos.abajo, d.extremos.abajo + paso, d.extremos.arriba].map((valor) => ({ valor, y: y(valor) })) };
}
