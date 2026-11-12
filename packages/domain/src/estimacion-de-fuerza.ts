/**
 * ED-71 · El método Epley v1: la estimación de la repetición máxima, solo para el profesional (DL-171; DJ-1, aprobada
 * por Dirección el 2026-11-11 y con ED-D17 a ED-D21 decididas el 2026-11-12).
 *
 * Es la especificación `BE-E1RM`, versión 1, método `EPLEY_V1`: un método con identidad y versión inmutable (REG-06-203),
 * especialización del patrón de cálculo T-06-N12 para Entrenamiento (REG-06-202), con sus entradas admisibles
 * (REG-06-204). Enmienda 09v10:356 («No se fija fórmula propia de estimación de RM») sin tocar el legajo: la decisión
 * vive en DL-171.
 *
 * - **La cuenta.** n_eq = repeticiones + RIR. Con n_eq 1, la estimación es la carga. Si no, carga × (1 + n_eq/30), con
 *   n/30 exacto (con 0,0333, 70 × 12 con RIR 2 daría 102,6 en lugar de 102,7). El valor se calcula con una sola
 *   división, y lo que se muestra (el medio kilo, la libra, la décima) se redondea sobre la cuenta exacta, con enteros:
 *   nunca sobre un número binario que en un empate queda apenas por debajo.
 * - **Las bandas, sobre n_eq:** núcleo, hasta 10; orientativa, de más de 10 a 12; fuera, más de 12 (sin valor).
 * - **Lo que entra, todo junto:** un ejercicio de la lista cerrada de la v1, sin sustituir en esa sesión; una serie que
 *   escribió la persona (`TYPED`, con la carga, las repeticiones y el RIR de procedencia `PERSON`, ED-70) o que observó
 *   el profesional (ED-72); carga mayor que 0, en kg o en lb, sin convertir; repeticiones enteras desde 1; RIR de 0 a 2,
 *   con decimales; la carga externa total (o sin base) y las repeticiones por serie (o sin base).
 * - **La regla por sesión:** de las series que entran de un ejercicio en una ejecución, la de mayor carga, por unidad; a
 *   igual carga, la primera. Nunca «la mayor estimación», que sube sola cuando hay más series. Con «Incluir las de 11 a
 *   12» apagado, elige entre las de hasta 10 repeticiones equivalentes; encendido, entre todas las de hasta 12.
 * - **Cómo se muestra:** «≈ 98 kg», al medio kilo o a la libra entera, con «estimación · Epley v1» (de más de 10 a 12,
 *   «estimación orientativa · Epley v1»). La décima, solo en «Cómo se calculó» (REG-06-158). Sin intervalo ni «±».
 *
 * **Lo que nunca hace:** calcular desde la prescripción, avisar, celebrar, entrar en las marcas
 * (TRAINING_PERSONAL_RECORDS, B10-08: «marca observada ≠ 1RM estimado»), llegar a la persona o invitar a un máximo. Este
 * módulo no lee planes ni registros: recibe series ya armadas, y quien las arma (la API, ED-74; el cuadro, ED-72) decide
 * cuál es el registro vigente. Sin React, sin base y sin red.
 */
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { numero, numeroConPrecision } from './formato-numeros';

/** La identidad del método, que lleva cada valor (RM-14) y que una versión futura no reescribe (RM-18). */
export const ESPECIFICACION_DE_LA_ESTIMACION = { especificacion: 'BE-E1RM', version: 1, metodo: 'EPLEY_V1' } as const;

/**
 * La lista cerrada de la v1 (ED-D18, decidida el 2026-11-12): los ejercicios con barra, con carga externa total y patrón
 * bilateral, del catálogo base, por su `exerciseId` (UUID v5 de la migración 20261019120000) y con su nombre de ahí.
 * Sumar uno es una versión nueva de la especificación.
 */
export const EJERCICIOS_DE_LA_ESTIMACION_V1: readonly { readonly exerciseId: string; readonly nombre: string }[] = [
  { exerciseId: '2aba46d7-c2d9-539c-847f-dc13a4322e18', nombre: 'Sentadilla trasera con barra' },
  { exerciseId: 'a3983149-c76c-56de-bfa6-9b6ecce54d4a', nombre: 'Sentadilla frontal con barra' },
  { exerciseId: 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7', nombre: 'Press de banca plano con barra' },
  { exerciseId: 'a8cfec3f-6cca-577d-8dba-a5732f87881a', nombre: 'Peso muerto convencional' },
  { exerciseId: '656754be-2a9f-575f-a9d5-529db4ce2d31', nombre: 'Press de hombros con barra' },
  { exerciseId: 'b30c4bbb-0dcc-5f95-8b38-4e58ff20196b', nombre: 'Remo inclinado con barra, agarre prono' },
];

/** Si un ejercicio del catálogo entra en la v1. Fuera de la lista, no hay valor ni tarjeta (RM-16). */
export const entraEnLaEstimacion = (exerciseId: string): boolean => EJERCICIOS_DE_LA_ESTIMACION_V1.some((e) => e.exerciseId === exerciseId);

/** El RIR máximo que entra: más lejos del fallo, el RIR que se escribe es menos confiable (DL-171; R3). */
export const RIR_MAXIMO_DE_LA_ESTIMACION = 2;
/** El tope del núcleo y el de la banda orientativa, en repeticiones equivalentes. */
export const TOPE_DEL_NUCLEO = 10;
export const TOPE_DE_LA_ESTIMACION = 12;

/** De dónde viene la serie: la escribió la persona, la observó el profesional, o es lo indicado (que nunca entra). */
export type FuenteDeLaSerie = 'PERSONA' | 'OBSERVADA' | 'PLAN';
/** La procedencia de un valor de una serie de la persona (ED-70, `fieldOrigins`): la escribió ella o vino del plan. */
export type ProcedenciaDelValor = 'PERSON' | 'PLAN';
export type UnidadDeLaCarga = 'kg' | 'lb';
/** Los tres valores que usa el método, con los nombres del contrato de la serie ejecutada. */
export type CampoDeLaSerie = 'load' | 'completedRepetitions' | 'rir';

/** Una serie como la recibe el método: ya armada por quien lee el registro vigente o la observación. */
export interface SerieParaEstimar {
  /** El ejercicio del catálogo: la identidad de la línea (RM-10). */
  readonly exerciseId: string;
  readonly fuente: FuenteDeLaSerie;
  /** Cómo se cargó (DL-161); ausente es `TYPED`. Solo cuenta para la fuente `PERSONA`. */
  readonly recordedAs?: 'TYPED' | 'AS_PLANNED';
  /**
   * La procedencia por campo (ED-70). Ausente: la serie se registró antes de la procedencia. Una clave que falta es
   * «sin saber quién lo escribió» (por ejemplo, un valor que corrigió el profesional). Solo cuenta para `PERSONA`.
   */
  readonly fieldOrigins?: Readonly<Partial<Record<CampoDeLaSerie, ProcedenciaDelValor>>>;
  readonly load: { readonly value: number; readonly unit: UnidadDeLaCarga } | null;
  /** La base de la carga de la prescripción (DL-122); ausente o `TOTAL_EXTERNAL` entra. */
  readonly loadBasis?: 'SINGLE_IMPLEMENT' | 'PER_IMPLEMENT' | 'TOTAL_EXTERNAL' | null;
  readonly completedRepetitions: number | null;
  /** La base de las repeticiones (DL-122); ausente o `PER_SET` entra. */
  readonly repetitionBasis?: 'PER_SET' | 'PER_SIDE' | null;
  readonly rir: number | null;
  /** En esa sesión se hizo otro ejercicio que el prescripto (09v10:1116-1121). */
  readonly sustituido?: boolean;
  /** La fecha civil de la ejecución o de la observación, en la zona de la persona: AAAA-MM-DD (RM-15). */
  readonly fechaCivil: string;
}

export type BandaDeLaEstimacion = 'NUCLEO' | 'ORIENTATIVA';

/** Un valor del método, con su identidad, sus entradas y su banda. `valor` lleva todos sus decimales. */
export interface EstimacionDeFuerza {
  readonly especificacion: 'BE-E1RM';
  readonly version: 1;
  readonly metodo: 'EPLEY_V1';
  readonly exerciseId: string;
  readonly fechaCivil: string;
  readonly fuente: 'PERSONA' | 'OBSERVADA';
  readonly unidad: UnidadDeLaCarga;
  readonly carga: number;
  readonly repeticiones: number;
  readonly rir: number;
  readonly repeticionesEquivalentes: number;
  readonly banda: BandaDeLaEstimacion;
  readonly valor: number;
}

/** Por qué una serie no entra, en el orden en que se mira. */
export type MotivoFueraDeLaEstimacion =
  | 'LO_INDICADO'
  | 'FUERA_DE_LA_LISTA'
  | 'SUSTITUIDO'
  | 'CARGA_RAPIDA'
  | 'SIN_PROCEDENCIA'
  | 'VALOR_DEL_PLAN'
  | 'SIN_CARGA'
  | 'CARGA_NO_TOTAL'
  | 'REPETICIONES_POR_LADO'
  | 'SIN_REPETICIONES'
  | 'SIN_RIR'
  | 'RIR_MAYOR_QUE_2'
  | 'MAS_DE_12';

export type ResultadoDeLaSerie =
  | { readonly entra: true; readonly estimacion: EstimacionDeFuerza }
  | {
      readonly entra: false;
      readonly motivo: MotivoFueraDeLaEstimacion;
      /** Para la procedencia: qué valores vinieron del plan o no dicen quién los escribió. */
      readonly campos?: readonly CampoDeLaSerie[];
    };

const CAMPOS: readonly CampoDeLaSerie[] = ['load', 'completedRepetitions', 'rir'];

/**
 * Epley con n/30 exacto; con una sola repetición equivalente, la carga (RM-06). Va con una sola división: `carga × (1 +
 * n/30)` redondeaba dos veces en binario (n/30 y el producto), y en un empate quedaba apenas por debajo: 41,25 × 12 con
 * RIR 0 daba 57,749999… en lugar de 57,75. Lo que se muestra no sale de este número sino de la cuenta exacta
 * (`redondeoDeLaCuenta`).
 */
export function epley(carga: number, repeticionesEquivalentes: number): number {
  return repeticionesEquivalentes === 1 ? carga : (carga * (30 + repeticionesEquivalentes)) / 30;
}

/** La banda de unas repeticiones equivalentes; `null` cuando pasan de 12 (fuera, sin valor). */
export function bandaDe(repeticionesEquivalentes: number): BandaDeLaEstimacion | null {
  if (repeticionesEquivalentes <= TOPE_DEL_NUCLEO) return 'NUCLEO';
  if (repeticionesEquivalentes <= TOPE_DE_LA_ESTIMACION) return 'ORIENTATIVA';
  return null;
}

/**
 * Si la serie entra en la estimación y, si entra, su valor. Nunca supone un dato que falta: sin RIR no hay valor
 * (RM-08), y lo que vino del plan no es fuerza (RM-01, RM-23, RM-24).
 */
export function estimarLaSerie(serie: SerieParaEstimar): ResultadoDeLaSerie {
  const fuera = (motivo: MotivoFueraDeLaEstimacion, campos?: readonly CampoDeLaSerie[]): ResultadoDeLaSerie => ({ entra: false, motivo, ...(campos ? { campos } : {}) });
  if (serie.fuente !== 'PERSONA' && serie.fuente !== 'OBSERVADA') return fuera('LO_INDICADO');
  if (!entraEnLaEstimacion(serie.exerciseId)) return fuera('FUERA_DE_LA_LISTA');
  if (serie.sustituido) return fuera('SUSTITUIDO');
  if (serie.fuente === 'PERSONA') {
    if (serie.recordedAs === 'AS_PLANNED') return fuera('CARGA_RAPIDA');
    const origenes = serie.fieldOrigins;
    if (!origenes) return fuera('SIN_PROCEDENCIA');
    const conValor = CAMPOS.filter((c) => serie[c] !== null);
    const delPlan = conValor.filter((c) => origenes[c] === 'PLAN');
    if (delPlan.length > 0) return fuera('VALOR_DEL_PLAN', delPlan);
    const sinSaber = conValor.filter((c) => origenes[c] !== 'PERSON');
    if (sinSaber.length > 0) return fuera('SIN_PROCEDENCIA', sinSaber);
  }
  if (!serie.load || !(serie.load.value > 0) || !Number.isFinite(serie.load.value)) return fuera('SIN_CARGA');
  if (serie.loadBasis && serie.loadBasis !== 'TOTAL_EXTERNAL') return fuera('CARGA_NO_TOTAL');
  if (serie.repetitionBasis && serie.repetitionBasis !== 'PER_SET') return fuera('REPETICIONES_POR_LADO');
  const repeticiones = serie.completedRepetitions;
  if (repeticiones === null || !Number.isInteger(repeticiones) || repeticiones < 1) return fuera('SIN_REPETICIONES');
  if (serie.rir === null || !Number.isFinite(serie.rir) || serie.rir < 0) return fuera('SIN_RIR');
  if (serie.rir > RIR_MAXIMO_DE_LA_ESTIMACION) return fuera('RIR_MAYOR_QUE_2');
  const repeticionesEquivalentes = repeticiones + serie.rir;
  const banda = bandaDe(repeticionesEquivalentes);
  if (!banda) return fuera('MAS_DE_12');
  return {
    entra: true,
    estimacion: {
      ...ESPECIFICACION_DE_LA_ESTIMACION,
      exerciseId: serie.exerciseId,
      fechaCivil: serie.fechaCivil,
      fuente: serie.fuente,
      unidad: serie.load.unit,
      carga: serie.load.value,
      repeticiones,
      rir: serie.rir,
      repeticionesEquivalentes,
      banda,
      valor: epley(serie.load.value, repeticionesEquivalentes),
    },
  };
}

/** La serie que vale para una sesión, por ejercicio y por unidad: su posición entre las series recibidas y su valor. */
export interface SerieElegidaDeLaSesion {
  readonly exerciseId: string;
  readonly unidad: UnidadDeLaCarga;
  /** La posición de la serie elegida entre las recibidas (desde 0). */
  readonly posicion: number;
  readonly estimacion: EstimacionDeFuerza;
}

export interface OpcionesDeLaSesion {
  /**
   * «Incluir las de más de 10 a 12» (ED-74): apagado de entrada. La banda orientativa empieza apenas pasa de 10 (10 con
   * RIR 0,5 son 10,5); la maqueta la llamaba «las de 11 a 12» (DL-171, precisión del 2026-11-12).
   */
  readonly incluirOrientativas: boolean;
  /**
   * La tarjeta del ejercicio (ED-75): con el interruptor apagado, si la sesión solo tiene orientativas, muestra la
   * de mayor carga de ellas como «estimación orientativa».
   */
  readonly respaldoOrientativo?: boolean;
}

/**
 * La regla por sesión: de las series que entran de un ejercicio en una ejecución, la de mayor carga, por unidad; a igual
 * carga, la primera (RM-34, RM-35). Nunca se comparan kg con lb (RM-29) ni dos ejercicios distintos (RM-10).
 */
export function seriesElegidasDeLaSesion(series: readonly SerieParaEstimar[], opciones: OpcionesDeLaSesion): readonly SerieElegidaDeLaSesion[] {
  const elegir = (permitidas: (e: EstimacionDeFuerza) => boolean): Map<string, SerieElegidaDeLaSesion> => {
    const porLinea = new Map<string, SerieElegidaDeLaSesion>();
    series.forEach((serie, posicion) => {
      const r = estimarLaSerie(serie);
      if (!r.entra || !permitidas(r.estimacion)) return;
      const clave = `${r.estimacion.exerciseId}|${r.estimacion.unidad}`;
      const antes = porLinea.get(clave);
      // Estrictamente mayor: a igual carga, queda la primera de la sesión.
      if (!antes || r.estimacion.carga > antes.estimacion.carga) porLinea.set(clave, { exerciseId: r.estimacion.exerciseId, unidad: r.estimacion.unidad, posicion, estimacion: r.estimacion });
    });
    return porLinea;
  };
  const elegidas = elegir((e) => opciones.incluirOrientativas || e.banda === 'NUCLEO');
  if (!opciones.incluirOrientativas && opciones.respaldoOrientativo) {
    for (const [clave, orientativa] of elegir((e) => e.banda === 'ORIENTATIVA')) if (!elegidas.has(clave)) elegidas.set(clave, orientativa);
  }
  return [...elegidas.values()].sort((a, b) => a.posicion - b.posicion);
}

// ─── Cómo se muestra ─────────────────────────────────────────────────────────────────────────────────────────────────

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «11 nov»: la fecha civil tal como vino, sin pasar por UTC ni por una zona fija (RM-15). */
export function diaDeLaEstimacion(fechaCivil: string): string {
  const [, mes, dia] = fechaCivil.split('-').map(Number);
  return `${dia} ${MESES[(mes ?? 1) - 1]}`;
}

/** Lo que hace falta para mostrar una estimación: sus entradas, de las que sale la cuenta exacta, y la unidad. */
export type EntradasDeLaEstimacion = Pick<EstimacionDeFuerza, 'carga' | 'repeticiones' | 'rir' | 'unidad'>;

/** Un número tal como se escribió, en enteros: 20,25 son 2025 centésimas (cifras 2025, escala 2). */
function enDecimal(x: number): { readonly cifras: bigint; readonly escala: number } {
  // La representación más corta de JavaScript es la del número escrito («20.25», «61.2»); con exponente, se lo aplica.
  const [mantisa = '0', exponente = '0'] = Math.abs(x).toString().split('e');
  const [enteros = '0', decimales = ''] = mantisa.split('.');
  const escala = decimales.length - Number(exponente);
  const cifras = BigInt(`${enteros}${decimales}`);
  return escala >= 0 ? { cifras, escala } : { cifras: cifras * 10n ** BigInt(-escala), escala: 0 };
}

/**
 * La cuenta de Epley redondeada al múltiplo de `decimasDelPaso` décimas (5: medio kilo; 10: una libra; 1: una décima),
 * mitad hacia arriba, hecha con enteros: carga × (30 + n_eq) / 30, sin pasar por binario. Así un empate exacto (57,75
 * al medio kilo; 22,95 a la décima) redondea como en la cuenta a mano, aunque el número binario más cercano quede
 * apenas por debajo.
 */
function redondeoDeLaCuenta(e: EntradasDeLaEstimacion, decimasDelPaso: bigint): number {
  const carga = enDecimal(e.carga);
  const rir = enDecimal(e.rir);
  const escalaDeLaCarga = 10n ** BigInt(carga.escala);
  const escalaDelRir = 10n ** BigInt(rir.escala);
  // n_eq en la escala del RIR: repeticiones + RIR.
  const equivalentes = BigInt(e.repeticiones) * escalaDelRir + rir.cifras;
  // El valor exacto, como fracción: con n_eq 1 es la carga (RM-06).
  const [numerador, denominador] =
    equivalentes === escalaDelRir ? [carga.cifras, escalaDeLaCarga] : [carga.cifras * (30n * escalaDelRir + equivalentes), 30n * escalaDeLaCarga * escalaDelRir];
  // Cuántos pasos entran (en décimas), mitad hacia arriba: ⌊(2·n·10 + d·p) / (2·d·p)⌋.
  const pasos = (2n * numerador * 10n + denominador * decimasDelPaso) / (2n * denominador * decimasDelPaso);
  return Number(pasos * decimasDelPaso) / 10;
}

/** «≈ 98 kg» o «≈ 86,5 kg» (al medio kilo); «≈ 216 lb» (a la libra entera). Nunca un intervalo ni «±» (RM-22). */
export function estimacionALaVista(e: EntradasDeLaEstimacion): string {
  return `≈ ${numero(redondeoDeLaCuenta(e, e.unidad === 'kg' ? 5n : 10n), 1)} ${e.unidad}`;
}

/** Con la décima, solo para «Cómo se calculó» (REG-06-158): «106,7 kg», «98,0 kg». */
export function estimacionConLaDecima(e: EntradasDeLaEstimacion): string {
  return `${numeroConPrecision(redondeoDeLaCuenta(e, 1n), 1)} ${e.unidad}`;
}

/** El rótulo de cada valor, con el método y la versión (RM-14): «estimación · Epley v1» o «estimación orientativa · Epley v1». */
export function rotuloDeLaEstimacion(banda: BandaDeLaEstimacion): string {
  return `${banda === 'ORIENTATIVA' ? COPY_FUERZA.estimacionOrientativa : COPY_FUERZA.estimacion} · ${COPY_FUERZA.metodo}`;
}

/** «8 + 2 = 10 repeticiones equivalentes · 80 × (1 + 10/30) = 106,7 kg», con los números de la serie (ED-73). */
export function laCuentaDeLaEstimacion(e: EstimacionDeFuerza): string {
  const n = numero(e.repeticionesEquivalentes);
  const suma = `${numero(e.repeticiones)} + ${numero(e.rir)} = ${n} ${e.repeticionesEquivalentes === 1 ? 'repetición equivalente' : 'repeticiones equivalentes'}`;
  if (e.repeticionesEquivalentes === 1) return `${suma} · con una sola, la estimación es la carga: ${estimacionConLaDecima(e)}`;
  return `${suma} · ${numero(e.carga)} × (1 + ${n}/30) = ${estimacionConLaDecima(e)}`;
}

/** Entre dos estimaciones de la misma línea, la diferencia en su unidad, nunca un % (RM-12); con una sola, ninguna. */
export function diferenciaEntreEstimaciones(anterior: EstimacionDeFuerza | null, actual: EstimacionDeFuerza): string | null {
  if (!anterior || anterior.unidad !== actual.unidad || anterior.exerciseId !== actual.exerciseId) return null;
  const a = estimacionALaVista(anterior).replace('≈ ', '').replace(` ${anterior.unidad}`, '');
  return `${COPY_FUERZA.estimacion}: ${a} → ${estimacionALaVista(actual).replace('≈ ', '')}`;
}

/** De dónde sale cada valor (RM-21): «la escribió Diego en la app» o «la observó Martín». Nunca «validado». */
export function origenDeLaEstimacion(fuente: 'PERSONA' | 'OBSERVADA', nombre: string): string {
  return fuente === 'PERSONA' ? `la escribió ${nombre} en la app` : `la observó ${nombre}`;
}

const NOMBRE_DEL_CAMPO: Readonly<Record<CampoDeLaSerie, string>> = { load: 'la carga', completedRepetitions: 'las repeticiones', rir: 'el RIR' };

function enLista(campos: readonly CampoDeLaSerie[]): string {
  const nombres = campos.map((c) => NOMBRE_DEL_CAMPO[c]);
  return nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}

/** Por qué una serie no entra, en palabras, para «Cómo se calculó» y la tarjeta («Serie 3: el RIR es el del plan»). */
export function motivoEnPalabras(r: Extract<ResultadoDeLaSerie, { entra: false }>): string {
  switch (r.motivo) {
    case 'VALOR_DEL_PLAN': {
      const campos = r.campos ?? [];
      if (campos.length === 0) return COPY_FUERZA.motivo.VALOR_DEL_PLAN;
      if (campos.length > 1) return `${enLista(campos)} son los del plan`;
      return { load: 'la carga es la del plan', completedRepetitions: 'las repeticiones son las del plan', rir: 'el RIR es el del plan' }[campos[0]!];
    }
    case 'SIN_PROCEDENCIA':
      return r.campos && r.campos.length > 0 ? `no se sabe quién escribió ${enLista(r.campos)}` : COPY_FUERZA.motivo.SIN_PROCEDENCIA;
    default:
      return COPY_FUERZA.motivo[r.motivo];
  }
}

/**
 * Los textos de la fuerza. Solo los ve el profesional, en el website (DJ-1; ED-D21): la persona no ve nada de esto en
 * la v1. Pasan la guardia de Entrenamiento y la de fuerza (`terminosProhibidosDeFuerzaEn`).
 */
export const COPY_FUERZA = {
  titulo: 'Fuerza estimada',
  nombreDeLaMetrica: '1RM estimado (Epley v1)',
  metodo: 'Epley v1',
  estimacion: 'estimación',
  estimacionOrientativa: 'estimación orientativa',
  queEs: 'Una estimación de la carga para una repetición, hecha con una serie. No es una repetición máxima medida.',
  /**
   * La regla del RIR, explicada al profesional (Dirección, 2026-11-12, sobre R3: «aclarémoselo a los profesionales
   * nomás»). La misma en el cuadro de la serie observada (ED-72), en «Cómo se calculó» (ED-73) y en el estado vacío de
   * la tarjeta (ED-75).
   */
  reglaDelRir: 'BE estima solo con series de RIR 0 a 2: más lejos del fallo, el RIR que se escribe es menos confiable.',
  campoDelRir: 'De 0 a 2',
  sinEstimacion: 'Todavía no hay series que permitan estimar',
  sinRir: 'Sin RIR no se puede estimar',
  rirMayorQue2: 'Con un RIR mayor que 2 no se estima',
  masDe12: 'Con más de 12 repeticiones equivalentes no se estima',
  banda: {
    NUCLEO: 'hasta 10 repeticiones equivalentes',
    // El RIR admite decimales: 10 con RIR 0,5 son 10,5, y ya es orientativa. «De 11 a 12» lo dejaba afuera del texto.
    ORIENTATIVA: 'de más de 10 a 12 repeticiones equivalentes: estimación orientativa',
  } satisfies Record<BandaDeLaEstimacion, string>,
  /** Qué no significa el valor (ED-73), con la carga a la décima. */
  queNoSignifica: (valorConLaDecima: string): string =>
    `No se levantaron ${valorConLaDecima}. No es una marca. No es una indicación de carga: la carga la elegís vos con un % RM.`,
  motivo: {
    LO_INDICADO: 'es lo que indica el plan, no lo que se hizo',
    FUERA_DE_LA_LISTA: 'el ejercicio no está en la lista de la v1',
    SUSTITUIDO: 'en esa sesión se hizo otro ejercicio',
    CARGA_RAPIDA: 'se tildó sin escribir: los valores son los del plan',
    SIN_PROCEDENCIA: 'se registró antes de que la app guardara quién escribió cada dato',
    VALOR_DEL_PLAN: 'tiene valores del plan',
    SIN_CARGA: 'no tiene carga',
    CARGA_NO_TOTAL: 'la carga no es la externa total',
    REPETICIONES_POR_LADO: 'las repeticiones son por lado',
    SIN_REPETICIONES: 'no tiene repeticiones',
    SIN_RIR: 'no tiene RIR',
    RIR_MAYOR_QUE_2: 'el RIR es mayor que 2',
    MAS_DE_12: 'tiene más de 12 repeticiones equivalentes',
  } satisfies Record<MotivoFueraDeLaEstimacion, string>,
} as const;

/**
 * Lo que ningún texto de fuerza dice, tampoco en negación, además de lo prohibido en Entrenamiento (DL-171, «Los
 * textos»): ninguno presenta una estimación como marca ni invita a un máximo.
 */
export const TERMINOS_PROHIBIDOS_DE_FUERZA: readonly string[] = ['1rm real', 'máximo real', 'récord', 'marca personal', 'nuevo máximo', 'test de 1rm', 'probá tu máximo', 'fuerza real', '±'];

export function terminosProhibidosDeFuerzaEn(texto: string): string[] {
  const t = texto.toLowerCase();
  return [...new Set([...terminosProhibidosDeEntrenamientoEn(texto), ...TERMINOS_PROHIBIDOS_DE_FUERZA.filter((p) => t.includes(p))])];
}
