/**
 * «Armá tu gráfico» (GR-26; WP-GRAFICOS fase 2, DL-174): lo que deciden «Analizar» y el compositor de «Patrones» antes de
 * dibujar. Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs` (TEST-GRF-060 a 079).
 *
 * - **Qué se ofrece:** las series del catálogo que el PDP deja leer con esta persona (`seriesOfrecidas`), agrupadas por
 *   área y con las de los sugeridos primero. El 1RM estimado, solo con un ejercicio de la lista de la estimación. Lo que no se
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
  fraseDeLaCoincidencia,
  MAXIMO_DE_EJES_SUPERPUESTOS,
  MAXIMO_DE_SERIES_EN_UN_GRAFICO,
  serieDisponible,
  seriesOfrecidas,
  valorConUnidad,
  type AccesoDeLaPersona,
  type AreaDeMetrica,
  type ComposicionDeSeries,
  type DefinicionDeMetrica,
  type EjeX,
  type MarcaSemantica,
  type MotivoSinComposicion,
  type PuntoAnalitico,
  type ReferenciaDeMetrica,
  type SentidoDeLaMarca,
  type SerieDisponible,
  type SerieElegida,
} from '@be/domain';
import { escalaDeLaUnidad } from '../../seguimiento/geometria';
import type { CarrilDeBarrasSemanales, CarrilDePuntos, EscalaDelCarril } from '../carriles';
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

/** Si la serie es lo indicado en el plan (el RIR indicado, GR-05) y no lo registrado: se dibuja hueca y suelta. */
export const esLoIndicado = (s: Pick<SerieDisponible, 'marca'>): boolean => s.marca === 'INDICADO';

/** Lo mismo, por el identificador de una referencia elegida (la de «Analizar» o la de un enfoque). */
export const esLoIndicadoDe = (metricId: string): boolean => {
  const serie = serieDisponible(metricId);
  return serie !== null && esLoIndicado(serie);
};

/**
 * Si los puntos de una serie se unen con una línea: lo que dice el catálogo, salvo lo indicado, que va siempre suelto
 * (GR-T59, como lo indicado de Nutrición). El catálogo deja `unirPuntos` en el RIR indicado, y en un gráfico armado de
 * «Patrones» se habría visto unido, como lo registrado.
 */
export const unirLaSerie = (s: Pick<SerieDisponible, 'unirPuntos' | 'marca'>): boolean => s.unirPuntos && !esLoIndicado(s);

/**
 * Lo mismo, por el identificador de una referencia elegida en «Analizar»: Antropometría va en puntos sueltos en todos los
 * modos (GR-D5: nada une dos tomas ni las suaviza; WP-GRAFICOS §4.5, «Antropometría sigue en puntos sueltos, también
 * superpuesta»), y lo indicado también. Lo que no está en el catálogo se une como siempre.
 */
export function unirLaSerieDe(metricId: string, unidad = ''): boolean {
  const serie = serieDisponible(metricId, unidad || undefined);
  return serie === null ? true : unirLaSerie(serie);
}

/**
 * Si una serie del catálogo se puede pedir con esta persona: todos sus alcances permitidos y, si junta dos áreas (los
 * g/kg), lo propio en cada una (la regla de `seriesOfrecidas`, sin mirar su estado). Un gráfico armado guarda solo
 * referencias: una serie de un área sin acceso no se pide, no se dibuja ni deja hueco.
 */
export function serieConAcceso(s: Pick<SerieDisponible, 'acceso'>, acceso: AccesoDeLaPersona): boolean {
  if (!s.acceso.alcances.every((a) => acceso.alcances.includes(a))) return false;
  return s.acceso.alcances.length < 2 || s.acceso.alcances.every((a) => acceso.propios[a] === true);
}

/**
 * Los grupos con la regla de `composicionPermitida`, por posición: kg y lb de una misma serie son dos grupos. Y una
 * más (GR-T59): **lo indicado va en el eje de lo registrado de su misma unidad** («lo indicado y lo registrado van en el
 * mismo panel solo si comparten la unidad»). El RIR indicado y el RIR registrado no tienen familia, y cada uno sería su
 * propio eje «RIR», con otra escala: así, lo indicado se lee contra lo registrado en la misma escala. Sin lo registrado
 * de esa unidad, lo indicado va en su propio eje; con dos registrados de esa unidad (el RIR de dos ejercicios), también:
 * no se sabe de cuál es, y no se lo pone en el eje del otro.
 */
export function gruposDeLasSeries(elegidas: readonly SerieElegida[]): GrupoDeSeries[] {
  const grupos: { clave: string; unidad: string; familia: string | null; indices: number[] }[] = [];
  elegidas.forEach((s, i) => {
    const familia = s.serie.definicion.familia;
    const clave = familia === null ? `sola:${i}` : `${familia}|${s.unidad}`;
    const grupo = grupos.find((g) => g.clave === clave);
    if (grupo) grupo.indices.push(i);
    else grupos.push({ clave, unidad: s.unidad, familia, indices: [i] });
  });
  const soloLoIndicado = (g: { readonly indices: readonly number[] }): boolean => g.indices.every((i) => esLoIndicado((elegidas[i] as SerieElegida).serie));
  const unidos = grupos.filter((g) => {
    if (!soloLoIndicado(g)) return true;
    const deSuUnidad = grupos.filter((h) => h !== g && h.unidad === g.unidad && !soloLoIndicado(h));
    if (deSuUnidad.length !== 1) return true;
    const registrado = deSuUnidad[0] as (typeof grupos)[number];
    registrado.indices.push(...g.indices);
    registrado.indices.sort((a, b) => a - b);
    return false;
  });
  return unidos.map(({ unidad, familia, indices }) => ({ unidad, familia, indices }));
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

/**
 * Si las series elegidas se pueden superponer, con qué ejes y de qué lado va cada una. Decide el dominio
 * (`composicionPermitida`), con una salvedad: lo indicado que va en el eje de lo registrado no suma un eje (el dominio lo
 * cuenta aparte), así que con el RIR registrado, el RIR indicado y la carga quedan dos ejes y se puede. Los demás motivos
 * (más de tres series, otro eje de fechas) siguen igual.
 */
export function superposicionDeLasElegidas(elegidas: readonly SerieElegida[]): SuperposicionDeLasElegidas {
  const grupos = gruposDeLasSeries(elegidas);
  if (elegidas.length === 1) return { permitida: false, motivo: 'UNA_SOLA', composicion: null, lados: [], grupos };
  const delDominio = composicionPermitida(elegidas, 'OVERLAY');
  const permitida = delDominio.permitida || (delDominio.motivo === 'MAS_DE_DOS_UNIDADES' && grupos.length <= MAXIMO_DE_EJES_SUPERPUESTOS);
  if (!permitida) return { permitida: false, motivo: delDominio.motivo, composicion: null, lados: [], grupos };
  const ladoDelIndice = (i: number): Lado => (i === 0 ? 'IZQUIERDA' : 'DERECHA');
  // Sin lo indicado unido a lo registrado, los ejes son los del dominio, tal cual.
  const composicion: ComposicionDeSeries =
    delDominio.permitida && delDominio.ejesY.length === grupos.length
      ? delDominio
      : {
          permitida: true,
          motivo: null,
          ejesY: grupos.map((g, i) => ({ lado: ladoDelIndice(i), unidad: g.unidad, familia: g.familia, series: g.indices.map((j) => (elegidas[j] as SerieElegida).serie.id) })),
          frase: fraseDeLaCoincidencia(elegidas, 'OVERLAY', grupos.length),
        };
  const ladoDelGrupo = (i: number): Lado => ladoDelIndice(grupos.findIndex((g) => g.indices.includes(i)));
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

/**
 * El modo con que se guarda el gráfico del compositor y si «Agregar al enfoque» está apagado. Si «Superpuestas» no se
 * puede (quedó una sola serie, o tres unidades), el gráfico se ve y se guarda en «Alineadas», que es lo que muestra el
 * modo elegido: el botón no se apaga por eso. Si se apagaba con el motivo, tocar «Alineadas», que ya se veía marcada, no
 * cambiaba nada, y el compositor quedaba trabado hasta sumar otra serie.
 */
export function modoDelCompositor(o: { readonly modo: ModoArmado; readonly series: number; readonly titulo: string; readonly motivo: string | null }): {
  readonly modo: ModoArmado;
  readonly apagado: 'FALTA_SERIE' | 'FALTA_NOMBRE' | null;
} {
  const modo: ModoArmado = o.modo === 'OVERLAY' && o.motivo === null ? 'OVERLAY' : 'PANELS';
  return { modo, apagado: o.series === 0 ? 'FALTA_SERIE' : o.titulo.trim() === '' ? 'FALTA_NOMBRE' : null };
}

/** El orden de la leyenda de un gráfico armado: lo registrado, lo indicado y después lo que se lee distinto. */
const ORDEN_DE_LA_LEYENDA: readonly SentidoDeLaMarca[] = ['REGISTRADO', 'INDICADO', 'SUBTOTAL', 'ORIENTATIVA', 'CARGA_RAPIDA', 'OBSERVADA_POR_EL_PROFESIONAL', 'REPORTADO', 'CALCULADO'];

/**
 * La leyenda de un gráfico armado: solo lo que está dibujado, con lo que quiere decir cada marca en su serie (una marca
 * hueca es lo indicado en el RIR indicado, una estimación orientativa en el 1RM estimado y un subtotal en lo demás). La
 * forma dice el estado además del color, y la leyenda dice qué forma es cuál.
 */
export function leyendaDeLasSeries(series: readonly { readonly id: string; readonly indicada: boolean; readonly marcas: readonly MarcaSemantica[] }[]): SentidoDeLaMarca[] {
  const sentidos = new Set<SentidoDeLaMarca>();
  for (const s of series) {
    for (const m of s.marcas) {
      if (m === 'LLENA') sentidos.add('REGISTRADO');
      else if (m === 'HUECA') sentidos.add(s.indicada ? 'INDICADO' : s.id === 'entrenamiento.1rm-estimado' ? 'ORIENTATIVA' : 'SUBTOTAL');
      else if (m === 'HUECA_GRIS') sentidos.add('CARGA_RAPIDA');
      else if (m === 'ROMBO') sentidos.add('OBSERVADA_POR_EL_PROFESIONAL');
      else if (m === 'CONTORNO_CORTADO') sentidos.add('REPORTADO');
      else sentidos.add('CALCULADO');
    }
  }
  return ORDEN_DE_LA_LEYENDA.filter((s) => sentidos.has(s));
}

/**
 * La leyenda de unos carriles ya armados (SP-01, SP-02): la de `leyendaDeLasSeries` con las marcas de sus puntos con
 * valor. Una forma que no está dibujada no va en la leyenda (antes iba una lista fija, con lo reportado o lo observado
 * aunque no hubiera ninguno).
 */
export function leyendaDeLosCarriles(carriles: readonly (CarrilDePuntos | CarrilDeBarrasSemanales)[]): SentidoDeLaMarca[] {
  return leyendaDeLasSeries(
    carriles.flatMap((c) => {
      if (c.tipo !== 'PUNTOS') return [];
      const id = c.id.includes('|') ? c.id.slice(0, c.id.indexOf('|')) : c.id;
      return [{ id, indicada: esLoIndicadoDe(id), marcas: c.puntos.filter((p) => p.valor !== null).map((p) => p.marca) }];
    }),
  );
}

/** El rango mínimo del eje que fija el catálogo para una serie elegida, en la unidad de sus datos (`undefined` si no). */
export function rangoMinimoDelCatalogo(metricId: string, unidad: string): number | undefined {
  return serieDisponible(metricId, unidad || undefined)?.rangoMinimoDelEje?.[unidad];
}

/**
 * El dominio vertical de un eje de «Analizar» con el rango mínimo del catálogo (GR-T15: el 1RM estimado abarca 10 kg o
 * 22 lb, para que el ruido de un RIR no parezca un salto). `null` si no hace falta (sin rango mínimo, sin valores, o si
 * los valores ya lo abarcan): entonces el eje queda como siempre. Si hace falta, el rango centrado en los valores, en
 * enteros y conteniéndolos a todos. Es la misma regla en «Alineadas» y en «Superpuestas».
 */
export function dominioConRangoMinimo(valores: readonly number[], rangoMinimo: number | undefined): readonly [number, number] | null {
  if (rangoMinimo === undefined || !(rangoMinimo > 0)) return null;
  const finitos = valores.filter((v) => Number.isFinite(v));
  if (finitos.length === 0) return null;
  const minimo = Math.min(...finitos);
  const maximo = Math.max(...finitos);
  if (maximo - minimo >= rangoMinimo) return null;
  const centro = (minimo + maximo) / 2;
  return [Math.floor(centro - rangoMinimo / 2), Math.ceil(centro + rangoMinimo / 2)];
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

/** Las series de Entrenamiento que se pueden elegir con un ejercicio: el 1RM estimado, solo en la lista de la estimación (RM-16). */
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

// ─── Lo indicado y lo hecho en un solo panel (WP-GRAFICOS-POR-FASE, pulido) ───────────────────────

/**
 * Las parejas de lo indicado y lo hecho del catálogo: la serie indicada y la registrada que se leen juntas, como en el
 * historial del ejercicio (GPF-06). Con las dos elegidas, del mismo ejercicio, la misma serie y la misma unidad, van en
 * **un solo panel**, con la misma escala: hueco lo indicado y lleno lo hecho (también en «Alineadas»).
 */
export const LO_HECHO_DE_LO_INDICADO: Readonly<Record<string, string>> = {
  'entrenamiento.series-indicadas': 'entrenamiento.series-registradas',
  'entrenamiento.carga-por-repeticiones-indicada': 'entrenamiento.carga-por-repeticiones-hecha',
  'entrenamiento.rir-indicado': 'entrenamiento.rir',
};

/** El nombre del panel de una pareja, por la serie indicada. */
export const NOMBRE_DE_LA_PAREJA: Readonly<Record<string, string>> = {
  'entrenamiento.series-indicadas': 'Series indicadas y hechas',
  'entrenamiento.carga-por-repeticiones-indicada': 'Carga × repeticiones indicada y hecha',
  'entrenamiento.rir-indicado': 'RIR indicado y registrado',
};

/** El botón de un clic del selector: suma la pareja entera. */
export const COPY_DE_LA_PAREJA = {
  boton: 'Indicado y hecho',
  pista: 'Suma las dos series de este ejercicio en un solo panel: hueco lo indicado, lleno lo hecho.',
  sinLugar: 'Para sumar lo indicado y lo hecho hacen falta dos lugares: quitá una serie.',
} as const;

/** La pareja de una serie (la indicada o la hecha): `[indicada, hecha]`, o `null` si no tiene. */
export function parejaDeLaSerie(metricId: string): readonly [string, string] | null {
  if (LO_HECHO_DE_LO_INDICADO[metricId]) return [metricId, LO_HECHO_DE_LO_INDICADO[metricId] as string];
  const indicada = Object.keys(LO_HECHO_DE_LO_INDICADO).find((k) => LO_HECHO_DE_LO_INDICADO[k] === metricId);
  return indicada ? [indicada, metricId] : null;
}

/**
 * Qué serie indicada va en el panel de qué serie hecha: posición de la indicada → posición de la hecha. Se unen si son
 * pareja, del mismo ejercicio, de la misma serie (si la piden) y con la misma unidad de los datos; cada hecha recibe una
 * sola indicada. Si no, cada una sigue en su panel.
 */
export function parejasDeLasElegidas(series: readonly { readonly ref: ReferenciaDeMetrica; readonly unidad: string }[]): ReadonlyMap<number, number> {
  const parejas = new Map<number, number>();
  const usadas = new Set<number>();
  series.forEach((s, i) => {
    const hecha = LO_HECHO_DE_LO_INDICADO[s.ref.metricId];
    if (!hecha) return;
    const j = series.findIndex(
      (h, k) =>
        !usadas.has(k) &&
        h.ref.metricId === hecha &&
        h.ref.exerciseKey === s.ref.exerciseKey &&
        (h.ref.setIndex === null || s.ref.setIndex === null || h.ref.setIndex === s.ref.setIndex) &&
        h.unidad === s.unidad,
    );
    if (j < 0) return;
    usadas.add(j);
    parejas.set(i, j);
  });
  return parejas;
}

/**
 * Los carriles de «Alineadas» con cada pareja en un solo panel: el de lo hecho lleva lo indicado como marcas huecas (el
 * campo `indicado` del carril, el mismo de GR-03 y GPF-06), con su nombre de pareja; el de lo indicado no se dibuja
 * aparte. La tabla y «Lo último» lo leen como «4 series · indicado: 4 series».
 */
export function carrilesConLasParejas(
  series: readonly { readonly ref: ReferenciaDeMetrica; readonly carril: CarrilDePuntos }[],
  nombreDeLaPareja: (indicada: ReferenciaDeMetrica, hecha: ReferenciaDeMetrica) => string,
): CarrilDePuntos[] {
  const parejas = parejasDeLasElegidas(series.map((s) => ({ ref: s.ref, unidad: s.carril.unidad })));
  const indicadaDe = new Map([...parejas].map(([i, j]) => [j, i] as const));
  return series.flatMap((s, j) => {
    if (parejas.has(j)) return [];
    const i = indicadaDe.get(j);
    if (i === undefined) return [s.carril];
    const indicada = series[i] as (typeof series)[number];
    return [
      {
        ...s.carril,
        nombre: nombreDeLaPareja(indicada.ref, s.ref),
        indicado: indicada.carril.puntos.map((p) => ({ ...p, marca: 'HUECA' as const, sentido: 'INDICADO' as const, tarde: false })),
        descripcion: `${s.carril.descripcion} Lo indicado, en marcas huecas: ${indicada.carril.descripcion.charAt(0).toLowerCase()}${indicada.carril.descripcion.slice(1)}`,
      },
    ];
  });
}
