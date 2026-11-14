/**
 * El catálogo de series de los gráficos (WP-GRAFICOS fase 2, DL-174; GR-26 y GR-27): todo lo que se puede dibujar sobre
 * el eje de fechas común, con su área, su unidad, su eje X, de qué lectura sale, quién la puede ver y con qué método.
 *
 * **Envuelve, no reemplaza.** Las series del diccionario de «Analizar» (DL-126) entran con su `DefinicionDeMetrica` y
 * suman lo que les faltaba; las nuevas traen su propia definición con la misma forma, para que «Analizar» las dibuje sin
 * otro camino. `VERSION_DEL_DICCIONARIO` (la que devuelve API-PRJ-01) no cambia: el catálogo tiene su propia versión.
 *
 * Los identificadores tienen la forma de `ReferenciaDeMetrica.metricId` (`area.nombre`): una serie se guarda en una
 * vista de «Analizar» o en un enfoque sin cambiar ningún esquema. Las entradas viven en un archivo por área
 * (`series-disponibles-nutricion.ts`, `-entrenamiento.ts` y `-antropometria.ts`): cada rama edita solo el suyo.
 */
import type { Alcance } from './alcance';
import type { ClaveDeProyeccion, Grano } from './contratos-analisis';
import { definicionAntropometrica, type AreaDeMetrica, type DefinicionDeMetrica } from './metricas-del-analisis';
import { SERIES_DE_ANTROPOMETRIA, serieDisponibleAntropometrica } from './series-disponibles-antropometria';
import { SERIES_DE_ENTRENAMIENTO } from './series-disponibles-entrenamiento';
import { SERIES_DE_NUTRICION } from './series-disponibles-nutricion';
import { FRASE_DE_LA_COINCIDENCIA } from './vocabulario-de-los-graficos';

export const VERSION_DEL_CATALOGO_DE_SERIES = 'BE-SERIES-2026-11-v1';

/** Dónde cae cada observación sobre el eje de fechas común. Todas van en fechas reales: hay un solo eje del tiempo. */
export type EjeX =
  /** Una por día civil (Nutrición) o por toma (Antropometría), en su fecha. */
  | 'FECHA'
  /** Una por sesión registrada, en su fecha: dos sesiones el mismo día son dos puntos. */
  | 'SESION'
  /** Un balde de lunes a domingo, dibujado sobre sus siete días. */
  | 'SEMANA';

/**
 * De qué lectura sale el dato; nunca de la prescripción como si fuera de la persona. Se llama así, y no
 * `FuenteDeLaSerie`, porque ese nombre ya lo usa la estimación de fuerza (`estimacion-de-fuerza.ts`) para otra cosa
 * (GR-T20).
 */
export type FuenteDeLaSerieDisponible =
  | { readonly tipo: 'PROYECCION'; readonly operacion: 'API-PRJ-01'; readonly clave: ClaveDeProyeccion; readonly parametro: string | null }
  | { readonly tipo: 'CONTEXTO_DE_REVISION'; readonly operaciones: readonly ['API-TRN-21', 'API-SER-01']; readonly diasPorLectura: 92 }
  | { readonly tipo: 'DERIVADA'; readonly de: readonly string[]; readonly regla: string };

/** Lo que tiene que permitir el PDP para ofrecerla. Si falta un alcance, la serie no se ofrece ni aparece en gris. */
export interface AccesoDeLaSerie {
  /** Todos los que necesita: los g/kg piden NUTRICION y ANTROPOMETRIA. */
  readonly alcances: readonly Alcance[];
  /** Caso 1: los planes y las tomas del profesional que consulta. El caso 2 (otro profesional) llega con API-RES. */
  readonly caso: 'PLANES_PROPIOS';
  /** La persona no la ve en la APK (el 1RM estimado, DL-171). */
  readonly soloProfesional: boolean;
}

export interface MetodoDeLaSerie {
  /** 'Epley v1', 'SUM_SOURCE_PER_100G_V1', 'g/kg con el peso de la toma v1'. */
  readonly nombre: string;
  /** Lo que va en pantalla: «1RM estimado (Epley v1)». */
  readonly rotulo: string;
}

/** La marca de lo que se dibuja: lo indicado, hueco; lo registrado, lleno; lo medido o calculado, según su clase. */
export type MarcaDeLaSerie = 'REGISTRADO' | 'INDICADO' | 'MEDIDO_O_CALCULADO';

export type EstadoDeLaSerie =
  /** Se puede elegir en «Armá tu gráfico» y en los enfoques. */
  | 'OFRECIDA'
  /** La programa una rama de esta fase; hasta entonces no se ofrece. */
  | 'EN_PREPARACION'
  /** Ratificada o propuesta, sin método aprobado o sin programar: no se ofrece. */
  | 'PIDE_DL';

export interface SerieDisponible {
  /** El mismo valor que `ReferenciaDeMetrica.metricId`. */
  readonly id: string;
  /** La del diccionario o la propia, con la misma forma. */
  readonly definicion: DefinicionDeMetrica;
  readonly ejeX: EjeX;
  readonly granos: readonly Grano[];
  /** `false` en Antropometría: solo puntos, nada une dos tomas (B10-07; GR-D5). */
  readonly unirPuntos: boolean;
  readonly fuente: FuenteDeLaSerieDisponible;
  readonly acceso: AccesoDeLaSerie;
  readonly metodo: MetodoDeLaSerie | null;
  readonly marca: MarcaDeLaSerie;
  readonly requiere: { readonly ejercicio: boolean; readonly serie: boolean; readonly listaV1: boolean };
  /** Por unidad, y manda sobre el de la unidad: `{ kg: 10, lb: 22 }` en el 1RM estimado (GR-T15). */
  readonly rangoMinimoDelEje: Readonly<Partial<Record<string, number>>> | null;
  readonly estado: EstadoDeLaSerie;
  /** Los GR y SP que la usan (trazabilidad). */
  readonly graficos: readonly string[];
}

/** Las tres áreas, en el orden del selector: Nutrición, Entrenamiento y Antropometría. */
export const SERIES_DISPONIBLES: readonly SerieDisponible[] = [...SERIES_DE_NUTRICION, ...SERIES_DE_ENTRENAMIENTO, ...SERIES_DE_ANTROPOMETRIA];

const PREFIJO_ANTROPOMETRICO = 'antropometria.';

/**
 * La serie de un identificador, o `null` si no existe. `antropometria.<código>` se resuelve como hoy
 * (`definicionAntropometrica`): la unidad sale de los datos, y con ella se rehace la definición.
 */
export function serieDisponible(id: string, unidadDeLosDatos?: string): SerieDisponible | null {
  if (id.startsWith(PREFIJO_ANTROPOMETRICO)) {
    const codigo = id.slice(PREFIJO_ANTROPOMETRICO.length);
    if (!/^[a-z0-9-]+$/.test(codigo)) return null;
    const fija = SERIES_DE_ANTROPOMETRIA.find((s) => s.id === id);
    if (!fija) return serieDisponibleAntropometrica(codigo, unidadDeLosDatos ?? '');
    if (unidadDeLosDatos === undefined || unidadDeLosDatos === fija.definicion.unidad) return fija;
    const definicion = definicionAntropometrica(codigo, unidadDeLosDatos);
    return { ...fija, definicion: { ...definicion, nombre: fija.definicion.nombre, nombreCorto: fija.definicion.nombreCorto, implementada: fija.definicion.implementada, clase: fija.definicion.clase } };
  }
  return SERIES_DISPONIBLES.find((s) => s.id === id) ?? null;
}

/** Lo que el PDP dejó leer con esta persona, y si hay planes o tomas propios en cada área (caso 1). */
export interface AccesoDeLaPersona {
  readonly alcances: readonly Alcance[];
  readonly propios: Readonly<Record<Alcance, boolean>>;
}

/**
 * Las series que se pueden elegir con esta persona: solo las OFRECIDAS y con todos sus alcances permitidos. Una serie de
 * dos áreas (los g/kg) pide además planes o tomas propios en cada una, porque en el caso 1 se arma con lo del
 * profesional que consulta (GR-T21). Lo demás no aparece: ni en gris ni con candado.
 *
 * `catalogo` es el de BE salvo en las pruebas, que así prueban la regla de dos áreas con una serie ya ofrecida.
 */
export function seriesOfrecidas(acceso: AccesoDeLaPersona, catalogo: readonly SerieDisponible[] = SERIES_DISPONIBLES): SerieDisponible[] {
  return catalogo.filter((s) => {
    if (s.estado !== 'OFRECIDA') return false;
    if (!s.acceso.alcances.every((a) => acceso.alcances.includes(a))) return false;
    return s.acceso.alcances.length < 2 || s.acceso.alcances.every((a) => acceso.propios[a] === true);
  });
}

/** «Comparten la x» (GR-T03): las de día, sesión o toma entre sí; las semanales, solo con otras semanales. */
export function ejesCompatibles(a: EjeX, b: EjeX): boolean {
  return a === 'SEMANA' || b === 'SEMANA' ? a === b : true;
}

export interface SerieElegida {
  readonly serie: SerieDisponible;
  /** La unidad de los datos (kg o lb en la carga; la de la toma en Antropometría). */
  readonly unidad: string;
}

export type MotivoSinComposicion = 'NINGUNA' | 'MAS_DE_TRES' | 'EJE_X_DISTINTO' | 'MAS_DE_DOS_UNIDADES';

export interface EjeYDeLaComposicion {
  readonly lado: 'IZQUIERDA' | 'DERECHA';
  readonly unidad: string;
  readonly familia: string | null;
  readonly series: readonly string[];
}

export interface ComposicionDeSeries {
  readonly permitida: boolean;
  readonly motivo: MotivoSinComposicion | null;
  /** En superpuestas: uno o dos ejes, cada uno con su unidad y las series que lo usan. En alineadas: uno por serie. */
  readonly ejesY: readonly EjeYDeLaComposicion[];
  /** `FRASE_DE_LA_COINCIDENCIA`, cuando corresponde. */
  readonly frase: string | null;
}

/** Hasta tres series, como en «Analizar» (`MAXIMO_DE_METRICAS`): un preset no puede esconder una cuarta. */
export const MAXIMO_DE_SERIES_EN_UN_GRAFICO = 3;
/** «Superpuestas» admite dos unidades: un eje a cada lado (GR-T02). */
export const MAXIMO_DE_EJES_SUPERPUESTOS = 2;

const areasDe = (series: readonly SerieElegida[]): Set<AreaDeMetrica> => new Set(series.map((s) => s.serie.definicion.area));

/**
 * La frase va con dos áreas o más (en cualquier modo) o superpuestas con dos ejes (GR-T06). Un gráfico de una sola área
 * y un solo eje no la lleva.
 */
export function fraseDeLaCoincidencia(series: readonly SerieElegida[], modo: 'PANELS' | 'OVERLAY', ejesY: number): string | null {
  if (areasDe(series).size >= 2) return FRASE_DE_LA_COINCIDENCIA;
  return modo === 'OVERLAY' && ejesY >= 2 ? FRASE_DE_LA_COINCIDENCIA : null;
}

/**
 * Si un conjunto de series se puede dibujar en el modo pedido, y con qué ejes. «Alineadas» admite cualquier mezcla de
 * hasta tres; «Superpuestas», solo con el mismo eje X y hasta dos ejes Y. Dos series comparten un eje Y solo si comparten
 * familia **y** unidad (la regla de DL-126, que se amplía y no se cambia: GR-T04); sin familia, cada una es su grupo.
 */
export function composicionPermitida(series: readonly SerieElegida[], modo: 'PANELS' | 'OVERLAY'): ComposicionDeSeries {
  const negada = (motivo: MotivoSinComposicion): ComposicionDeSeries => ({ permitida: false, motivo, ejesY: [], frase: null });
  if (series.length === 0) return negada('NINGUNA');
  if (series.length > MAXIMO_DE_SERIES_EN_UN_GRAFICO) return negada('MAS_DE_TRES');
  if (modo === 'PANELS') {
    const ejesY = series.map((s): EjeYDeLaComposicion => ({ lado: 'IZQUIERDA', unidad: s.unidad, familia: s.serie.definicion.familia, series: [s.serie.id] }));
    return { permitida: true, motivo: null, ejesY, frase: fraseDeLaCoincidencia(series, modo, ejesY.length) };
  }
  for (let i = 0; i < series.length; i++) {
    for (let j = i + 1; j < series.length; j++) if (!ejesCompatibles(series[i].serie.ejeX, series[j].serie.ejeX)) return negada('EJE_X_DISTINTO');
  }
  const grupos: { clave: string; unidad: string; familia: string | null; series: string[] }[] = [];
  for (const s of series) {
    const familia = s.serie.definicion.familia;
    const clave = familia === null ? `sola:${s.serie.id}:${grupos.length}` : `${familia}|${s.unidad}`;
    const grupo = grupos.find((g) => g.clave === clave);
    if (grupo) grupo.series.push(s.serie.id);
    else grupos.push({ clave, unidad: s.unidad, familia, series: [s.serie.id] });
  }
  if (grupos.length > MAXIMO_DE_EJES_SUPERPUESTOS) return negada('MAS_DE_DOS_UNIDADES');
  const ejesY = grupos.map((g, i): EjeYDeLaComposicion => ({ lado: i === 0 ? 'IZQUIERDA' : 'DERECHA', unidad: g.unidad, familia: g.familia, series: g.series }));
  return { permitida: true, motivo: null, ejesY, frase: fraseDeLaCoincidencia(series, modo, ejesY.length) };
}
