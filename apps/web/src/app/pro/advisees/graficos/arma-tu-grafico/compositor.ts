/**
 * «Armá tu gráfico» (GR-26; WP-GRAFICOS fase 2, DL-174): lo que deciden «Analizar» y el compositor de «Patrones» antes de
 * dibujar. Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs` (TEST-GRF-060 a 079).
 *
 * - **Qué se ofrece:** las series del catálogo que el PDP deja leer con esta persona (`seriesOfrecidas`), agrupadas por
 *   área y con las de los sugeridos primero. El 1RM estimado, solo con un ejercicio de la lista de la v1. Lo que no se
 *   ofrece no aparece, ni en gris ni con candado.
 * - **Los modos** se llaman como los dijo Dirección: «Alineadas» (una arriba de la otra, por defecto) y «Superpuestas»
 *   (en el mismo gráfico). En la URL y en las vistas guardadas siguen `PANELS` y `OVERLAY` (GR-T05).
 * - **«Superpuestas»** sale de `composicionPermitida` (rama A): el mismo eje X (una serie agrupada por semana va solo con
 *   otras semanales), hasta tres series y dos ejes, uno a cada lado; dos series comparten eje solo si comparten familia y
 *   unidad (DL-126, ampliada por GR-T04). Una sola serie no se superpone con nada.
 * - **El despacho:** lo que está en el diccionario de DL-126 se lee como siempre; lo que solo está en el catálogo (el 1RM
 *   estimado, y después el RIR indicado y los g/kg), con `leerSerieDelCatalogo`.
 */
import {
  COPY_FUERZA,
  COPY_REGISTRO_POR_NIVELES,
  composicionPermitida,
  definicionDeMetrica,
  entraEnLaEstimacion,
  esPuntoDeCargaRapida,
  MAXIMO_DE_SERIES_EN_UN_GRAFICO,
  serieDisponible,
  seriesOfrecidas,
  valorConUnidad,
  type AccesoDeLaPersona,
  type AreaDeMetrica,
  type ComposicionDeSeries,
  type DefinicionDeMetrica,
  type EjeX,
  type MotivoSinComposicion,
  type PuntoAnalitico,
  type ReferenciaDeMetrica,
  type SerieDisponible,
  type SerieElegida,
} from '@be/domain';
import { escalaDeLaUnidad } from '../../seguimiento/geometria';
import type { EscalaDelCarril } from '../carriles';
import { textoDeLaMarca } from '../eje-de-fechas';

/** Cómo se dibuja una serie elegida: cada registro, por día o por semana. */
export type GranoDelDibujo = 'ORIGINAL' | 'DAY' | 'WEEK';

export type ModoArmado = 'PANELS' | 'OVERLAY';

/** Los nombres de los modos en pantalla (GR-T05): las palabras de Dirección. */
export const NOMBRE_DEL_MODO: Readonly<Record<ModoArmado, string>> = { PANELS: 'Alineadas', OVERLAY: 'Superpuestas' };

/** Lo que cada modo hace, en una línea: va en «Cómo se lee» y en el compositor. */
export const QUE_HACE_EL_MODO: Readonly<Record<ModoArmado, string>> = {
  PANELS: 'Una arriba de la otra, con el mismo eje de fechas: cada serie con su unidad y su escala.',
  OVERLAY: 'En el mismo gráfico, si comparten el eje de fechas: hasta tres series y dos unidades, un eje a cada lado.',
};

const STRENGTH = 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE';

/** De dónde se lee una serie elegida: del diccionario de DL-126, como siempre, o del catálogo de los gráficos. */
export type CaminoDeLaLectura = 'DICCIONARIO' | 'CATALOGO';

export function caminoDeLaLectura(metricId: string): CaminoDeLaLectura | null {
  if (definicionDeMetrica(metricId) !== null) return 'DICCIONARIO';
  return serieDisponible(metricId) !== null ? 'CATALOGO' : null;
}

/** La definición de una serie elegida: la del diccionario o, si solo está en el catálogo, la suya (con la misma forma). */
export function definicionDeLaSerie(metricId: string, unidad = ''): DefinicionDeMetrica | null {
  return definicionDeMetrica(metricId, unidad) ?? serieDisponible(metricId, unidad || undefined)?.definicion ?? null;
}

/**
 * La serie del catálogo de una referencia elegida, con su unidad y con el eje X de cómo se dibuja: agrupada por semana
 * va sobre semanas, y entonces solo se superpone con otras semanales (GR-T03).
 */
export function serieElegidaDe(metricId: string, unidad: string, grano: GranoDelDibujo): SerieElegida | null {
  const serie = serieDisponible(metricId, unidad || undefined);
  if (!serie) return null;
  const ejeX: EjeX = grano === 'WEEK' ? 'SEMANA' : serie.ejeX;
  return { serie: ejeX === serie.ejeX ? serie : { ...serie, ejeX }, unidad };
}

export type Lado = 'IZQUIERDA' | 'DERECHA';

/** Un grupo de series que comparten un eje: misma familia y misma unidad. Sin familia, cada serie es su propio grupo. */
export interface GrupoDeSeries {
  readonly unidad: string;
  readonly familia: string | null;
  /** Las posiciones de las series del grupo, en el orden de las elegidas. */
  readonly indices: readonly number[];
}

/** Los grupos con la regla de `composicionPermitida`, por posición: kg y lb de una misma serie son dos grupos. */
export function gruposDeLasSeries(elegidas: readonly SerieElegida[]): GrupoDeSeries[] {
  const grupos: { clave: string; unidad: string; familia: string | null; indices: number[] }[] = [];
  elegidas.forEach((s, i) => {
    const familia = s.serie.definicion.familia;
    const clave = familia === null ? `sola:${i}` : `${familia}|${s.unidad}`;
    const grupo = grupos.find((g) => g.clave === clave);
    if (grupo) grupo.indices.push(i);
    else grupos.push({ clave, unidad: s.unidad, familia, indices: [i] });
  });
  return grupos.map(({ unidad, familia, indices }) => ({ unidad, familia, indices }));
}

/** Por qué «Superpuestas» no se puede usar: los motivos del dominio y uno propio, una sola serie. */
export type MotivoSinSuperponer = MotivoSinComposicion | 'UNA_SOLA';

export interface SuperposicionDeLasElegidas {
  readonly permitida: boolean;
  readonly motivo: MotivoSinSuperponer | null;
  /** La composición del dominio, con sus ejes y su frase; `null` si no se superponen. */
  readonly composicion: ComposicionDeSeries | null;
  /** El lado del eje de cada serie, en el orden de las elegidas. Con un solo eje, todas a la izquierda. */
  readonly lados: readonly Lado[];
  readonly grupos: readonly GrupoDeSeries[];
}

/** Si las series elegidas se pueden superponer, con qué ejes y de qué lado va cada una. */
export function superposicionDeLasElegidas(elegidas: readonly SerieElegida[]): SuperposicionDeLasElegidas {
  const grupos = gruposDeLasSeries(elegidas);
  if (elegidas.length === 1) return { permitida: false, motivo: 'UNA_SOLA', composicion: null, lados: [], grupos };
  const composicion = composicionPermitida(elegidas, 'OVERLAY');
  if (!composicion.permitida) return { permitida: false, motivo: composicion.motivo, composicion: null, lados: [], grupos };
  const ladoDelGrupo = (i: number): Lado => (grupos.findIndex((g) => g.indices.includes(i)) === 0 ? 'IZQUIERDA' : 'DERECHA');
  return { permitida: true, motivo: null, composicion, lados: elegidas.map((_, i) => ladoDelGrupo(i)), grupos };
}

/** «A, B y C». */
export function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/**
 * Por qué «Superpuestas» está apagada, en una frase que va al costado de los modos y dice qué hacer. `nombres` son los
 * nombres cortos de las series elegidas, en su orden.
 */
export function motivoDeSuperpuestas(motivo: MotivoSinSuperponer, grupos: readonly GrupoDeSeries[], nombres: readonly string[]): string {
  switch (motivo) {
    case 'UNA_SOLA':
    case 'NINGUNA':
      return '«Superpuestas» pide dos series o tres.';
    case 'MAS_DE_TRES':
      return `«Superpuestas» admite hasta ${MAXIMO_DE_SERIES_EN_UN_GRAFICO} series.`;
    case 'EJE_X_DISTINTO':
      return '«Superpuestas» pide el mismo eje de fechas: una serie agrupada por semana va solo con otras semanales. Agrupalas igual o miralas alineadas.';
    case 'MAS_DE_DOS_UNIDADES': {
      const unidades = grupos.map((g) => g.unidad);
      if (new Set(unidades).size === unidades.length) return `«Superpuestas» admite dos unidades, una a cada lado. Con ${enumerar(unidades)}, miralas alineadas.`;
      const medidas = grupos.map((g) => `${nombres[g.indices[0] ?? 0] ?? 'una serie'} (${g.unidad})`);
      return `«Superpuestas» admite dos ejes, uno a cada lado. ${enumerar(medidas)} son medidas distintas: miralas alineadas.`;
    }
  }
}

/** Con dos ejes, «Cómo leerlo» lo dice debajo del gráfico (Few 2008): un cruce de líneas no quiere decir nada. */
export const COMO_LEER_DOS_EJES =
  'Con dos ejes, cada lado tiene su escala: que dos líneas se crucen o se separen no quiere decir nada. La escala de cada serie es la misma que en «Alineadas»: no se estira para que coincidan.';

// ─── El selector: qué se puede elegir ─────────────────────────────────────────────────────────────

/** Las áreas en el orden del selector. */
export const AREAS_DEL_SELECTOR: readonly AreaDeMetrica[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];

export const NOMBRE_DEL_AREA: Readonly<Record<AreaDeMetrica, string>> = { NUTRICION: 'Nutrición', ENTRENAMIENTO: 'Entrenamiento', ANTROPOMETRIA: 'Antropometría' };

/**
 * Las series que se pueden elegir con esta persona, por área: las OFRECIDAS con todos sus alcances (`seriesOfrecidas`),
 * con las que usan los gráficos sugeridos primero. Un área sin acceso no tiene lista. En Antropometría el catálogo dice
 * las de los sugeridos; el selector ofrece además cualquier medida con tomas (`antropometria.<código>`).
 */
export function seriesParaElegir(acceso: AccesoDeLaPersona): Readonly<Record<AreaDeMetrica, readonly SerieDisponible[]>> {
  const ofrecidas = seriesOfrecidas(acceso);
  const deLaArea = (area: AreaDeMetrica): SerieDisponible[] => {
    const propias = ofrecidas.filter((s) => s.definicion.area === area);
    return [...propias.filter((s) => s.graficos.length > 0), ...propias.filter((s) => s.graficos.length === 0)];
  };
  return { NUTRICION: deLaArea('NUTRICION'), ENTRENAMIENTO: deLaArea('ENTRENAMIENTO'), ANTROPOMETRIA: deLaArea('ANTROPOMETRIA') };
}

/** El ejercicio del catálogo de una clave del período (`e:<id>`); `null` si es una versión sin ejercicio conocido (`v:`). */
export const ejercicioDeLaClave = (exerciseKey: string): string | null => (exerciseKey.startsWith('e:') ? exerciseKey.slice(2) : null);

/** Las series de Entrenamiento que se pueden elegir con un ejercicio: el 1RM estimado, solo en la lista de la v1 (RM-16). */
export function seriesDelEjercicio(deEntrenamiento: readonly SerieDisponible[], exerciseKey: string | null): SerieDisponible[] {
  const ejercicio = exerciseKey ? ejercicioDeLaClave(exerciseKey) : null;
  return deEntrenamiento.filter((s) => !s.requiere.listaV1 || (ejercicio !== null && entraEnLaEstimacion(ejercicio)));
}

/** Si la serie pide elegir kg o lb: la carga y el 1RM estimado (nunca van juntas). */
export const pideUnidad = (s: Pick<SerieDisponible, 'definicion' | 'fuente'>): boolean =>
  s.definicion.parametro === 'LOAD' || (s.fuente.tipo === 'PROYECCION' && s.fuente.clave === STRENGTH);

/** La referencia que se guarda (en la URL, en una vista o en un enfoque) para una serie de Entrenamiento elegida. */
export function referenciaDeEntrenamiento(s: Pick<SerieDisponible, 'id' | 'requiere' | 'definicion' | 'fuente'>, exerciseKey: string, setIndex: number, unidad: 'kg' | 'lb'): ReferenciaDeMetrica {
  return { metricId: s.id, exerciseKey, setIndex: s.requiere.serie ? setIndex : null, unit: pideUnidad(s) ? unidad : null };
}

// ─── Cómo se dibuja cada serie ────────────────────────────────────────────────────────────────────

/**
 * La escala de una serie: la de su unidad (enteros para lo que se cuenta), con el rango mínimo del catálogo, que manda
 * (el 1RM estimado abarca 10 kg o 22 lb: GR-T15). El RIR va de 0 a 5 como mínimo. Es la misma en «Alineadas» y en
 * «Superpuestas»: no se elige a mano ni se estira.
 */
export function escalaDeLaSerie(s: Pick<SerieDisponible, 'rangoMinimoDelEje'>, unidad: string): EscalaDelCarril {
  if (unidad === 'RIR') return { enteros: true, desdeCero: true, minimoDelMaximo: 5 };
  const deLaUnidad = escalaDeLaUnidad(unidad);
  const minimo = s.rangoMinimoDelEje?.[unidad];
  return minimo === undefined ? { enteros: deLaUnidad.enteros } : { enteros: deLaUnidad.enteros, rangoMinimo: minimo };
}

const ES_FUERZA = (d: Pick<DefinicionDeMetrica, 'id'>): boolean => d.id === 'entrenamiento.1rm-estimado';

/**
 * Lo que dicen la lectura y la tabla de un punto: el valor con su unidad y lo que hace falta para leerlo (un subtotal,
 * la carga rápida, una estimación orientativa, una observación del profesional, lo reportado o calculado).
 */
export function lecturaDelPunto(p: PuntoAnalitico, definicion: Pick<DefinicionDeMetrica, 'id' | 'area' | 'decimales'>, unidad: string): string {
  if (p.value === null) return 'sin valor conocido';
  const partes = [valorConUnidad(p.value, unidad, definicion.decimales)];
  if (ES_FUERZA(definicion)) {
    if (p.segment.startsWith('observada:')) partes.push('observada por el profesional');
    else if (p.quality === 'PARTIAL') partes.push(COPY_FUERZA.estimacionOrientativa);
  } else if (esPuntoDeCargaRapida(p)) partes.push(`${COPY_REGISTRO_POR_NIVELES.cargaRapida}: tildada sin escribir, con los números del plan`);
  else if (p.quality === 'PARTIAL') partes.push(definicion.area === 'NUTRICION' ? 'subtotal: falta algún dato' : 'con algún dato que falta');
  if (p.partialBucket) partes.push(p.dateEnd ? 'semana sin completar' : 'día en curso');
  if (p.dataClass === 'REPORTED') partes.push('reportado por la persona');
  if (p.dataClass === 'DERIVED') partes.push('calculado con un método');
  if (p.dateEnd) partes.push(`semana del ${textoDeLaMarca(p.date)} al ${textoDeLaMarca(p.dateEnd)}`);
  return partes.join(' · ');
}
