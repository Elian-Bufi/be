/**
 * Diccionario versionado de las métricas de «Analizar» (WP-DASHBOARD-PROFESIONAL §6; DL-126).
 *
 * Cada métrica es una **vista de una proyección del 09** (API-PRJ-01), con el cálculo canónico que ya existe en el
 * dominio: no hay un modelo paralelo ni fórmulas nuevas para obtener una curva (encargo §10 y §16).
 * - **Nutrición** suma lo conocido de los registros efectivos (`calcularNutrientes`, `SUM_SOURCE_PER_100G_V1`): es un
 *   subtotal de lo registrado, nunca «consumo total».
 * - **Entrenamiento** compara la **serie del mismo número** entre sesiones, como «Evolución de un ejercicio»
 *   (`comparacion-de-entrenamiento.ts`): no promedia, suma ni elige máximos entre series (09v10:1285-1295).
 * - **Antropometría** es la serie de API-ANT-06, con sus grupos de comparabilidad (`construirSerie`).
 *
 * Los identificadores (`nutricion.energia`, `antropometria.peso`) son opacos y estables: viajan en la URL y en las vistas
 * guardadas, y nunca llevan texto clínico. Un cambio de semántica cambia `VERSION_DEL_DICCIONARIO`.
 */
import type { Agregacion, ClaveDeProyeccion, Escala, Grano, MetricaDeEntrenamiento, MetricaNutricional, ReferenciaDeMetrica } from './contratos-analisis';
import { FAMILIA_DE_METRICA, nombreDeMetrica } from './nombres-de-metricas';

export const VERSION_DEL_DICCIONARIO = 'BE-METRICAS-2026-10-v1';

export type AreaDeMetrica = 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA';

/**
 * Clasificación del encargo (§3): disponible, derivable de forma válida, incompleta o futura. `implementada` dice si esta
 * versión la ofrece en «Analizar»: una derivable puede quedar para después sin inventarse.
 */
export type ClaseDeMetrica = 'DISPONIBLE' | 'DERIVABLE' | 'INCOMPLETA' | 'FUTURA';

/** Cómo se resume la métrica dentro de un período, para comparar dos etapas con el mismo criterio. */
export type ResumenDePeriodo = 'MEDIA_DE_DIAS_CON_DATOS' | 'MEDIANA' | 'PRIMERO_Y_ULTIMO_COMPARABLES' | 'TOTAL';

export interface DefinicionDeMetrica {
  readonly id: string;
  readonly area: AreaDeMetrica;
  readonly nombre: string;
  readonly nombreCorto: string;
  /** La unidad; en la carga es `kg` o `lb` según lo registrado (nunca mezcladas). */
  readonly unidad: string;
  readonly escala: Escala;
  readonly clase: ClaseDeMetrica;
  readonly implementada: boolean;
  readonly proyeccion: ClaveDeProyeccion;
  /** El parámetro `metric` de API-PRJ-01. */
  readonly parametro: MetricaNutricional | MetricaDeEntrenamiento | string | null;
  readonly requiereEjercicio: boolean;
  readonly requiereSerie: boolean;
  readonly granos: readonly { readonly grano: Grano; readonly agregacion: Agregacion }[];
  readonly granoPorDefecto: Grano;
  /** Dos métricas se pueden superponer en valores reales solo si comparten familia **y** unidad. */
  readonly familia: string | null;
  /** El cambio relativo exige una escala de razón y una referencia positiva. */
  readonly cambioRelativo: boolean;
  readonly decimales: number;
  readonly resumenDePeriodo: ResumenDePeriodo;
  /** Una línea: qué es. */
  readonly explicacion: string;
  /** Cómo se calcula, en detalle, con su fuente. */
  readonly comoSeCalcula: string;
  /** Qué pasa con lo que falta. */
  readonly ausencias: string;
  /** Límites de interpretación. */
  readonly limites: readonly string[];
}

const GRANO_NUTRICIONAL = [
  { grano: 'DAY', agregacion: 'SUM_OF_KNOWN' },
  { grano: 'WEEK', agregacion: 'MEAN_OF_DAYS_WITH_DATA' },
] as const;

const LIMITE_REGISTRADO = 'Es lo registrado: si una comida no se registró, o se registró sin cantidades, no está en el número. No es la ingesta total.';

function nutricional(id: string, nombre: string, nombreCorto: string, parametro: MetricaNutricional, unidad: string, decimales: number, familia: string): DefinicionDeMetrica {
  return {
    id,
    area: 'NUTRICION',
    nombre,
    nombreCorto,
    unidad,
    escala: 'RATIO',
    clase: 'DERIVABLE',
    implementada: true,
    proyeccion: 'NUTRITION_PRESCRIBED_VS_RECORDED',
    parametro,
    requiereEjercicio: false,
    requiereSerie: false,
    granos: GRANO_NUTRICIONAL,
    granoPorDefecto: 'DAY',
    familia,
    cambioRelativo: true,
    decimales,
    resumenDePeriodo: 'MEDIA_DE_DIAS_CON_DATOS',
    explicacion: `${nombre} en los registros de comida con cantidades, por día.`,
    comoSeCalcula:
      'Cada registro efectivo aporta lo que calculó BE con sus cantidades confirmadas o informadas (método SUM_SOURCE_PER_100G_V1, con las kcal de la fuente: no 4/4/9). El día es la suma de lo conocido; la semana es la media de los días con valor, y dice cuántos días tuvo.',
    ausencias:
      'Un registro sin cantidades, una comida diferente con solo texto o foto, o un alimento sin el dato del nutriente no aportan número: el día queda como subtotal y dice qué falta. Lo previsto de la opción no se cuenta como consumido.',
    limites: [LIMITE_REGISTRADO, 'Un registro anulado queda en el historial y fuera del número; una rectificación cuenta una sola vez.'],
  };
}

const DE_NUTRICION: readonly DefinicionDeMetrica[] = [
  nutricional('nutricion.energia', 'Energía registrada', 'Energía', 'ENERGY', 'kcal', 0, 'energia-kcal'),
  nutricional('nutricion.proteinas', 'Proteínas registradas', 'Proteínas', 'PROTEIN', 'g', 1, 'macronutriente-g'),
  nutricional('nutricion.carbohidratos', 'Carbohidratos registrados', 'Carbohidratos', 'CARBOHYDRATE', 'g', 1, 'macronutriente-g'),
  nutricional('nutricion.grasas', 'Grasas registradas', 'Grasas', 'FAT', 'g', 1, 'macronutriente-g'),
  nutricional('nutricion.fibra', 'Fibra registrada', 'Fibra', 'FIBER', 'g', 1, 'macronutriente-g'),
  {
    id: 'nutricion.registros',
    area: 'NUTRICION',
    nombre: 'Registros de comida',
    nombreCorto: 'Registros',
    unidad: 'registros',
    escala: 'COUNT',
    clase: 'DISPONIBLE',
    implementada: true,
    proyeccion: 'NUTRITION_PRESCRIBED_VS_RECORDED',
    parametro: 'RECORDS',
    requiereEjercicio: false,
    requiereSerie: false,
    granos: [
      { grano: 'DAY', agregacion: 'COUNT' },
      { grano: 'WEEK', agregacion: 'SUM' },
    ],
    granoPorDefecto: 'DAY',
    familia: null,
    cambioRelativo: false,
    decimales: 0,
    resumenDePeriodo: 'TOTAL',
    explicacion: 'Cuántos registros de comida efectivos hay por día, con y sin cantidades.',
    comoSeCalcula: 'Se cuentan los registros de comida efectivos del día (del plan o diferentes). Los anulados no cuentan; una rectificación no suma un registro.',
    ausencias: 'Un día sin registros no es un punto en cero: es un hueco.',
    limites: ['Es cobertura del registro, no adherencia: 3 de 4 comidas registradas no dice que se registró todo lo que se comió.'],
  },
  {
    id: 'nutricion.energia-prevista-del-dia',
    area: 'NUTRICION',
    nombre: 'Energía prevista del día',
    nombreCorto: 'Energía prevista',
    unidad: 'kcal',
    escala: 'RATIO',
    clase: 'INCOMPLETA',
    implementada: false,
    proyeccion: 'NUTRITION_PRESCRIBED_VS_RECORDED',
    parametro: null,
    requiereEjercicio: false,
    requiereSerie: false,
    granos: [],
    granoPorDefecto: 'DAY',
    familia: 'energia-kcal',
    cambioRelativo: false,
    decimales: 0,
    resumenDePeriodo: 'MEDIA_DE_DIAS_CON_DATOS',
    explicacion: 'No se ofrece: el plan tiene alternativas por comida y BE no tiene una regla para sumarlas como objetivo del día.',
    comoSeCalcula: 'Lo previsto se muestra por opción en el registro de cada comida; el requerimiento energético del objetivo se muestra como escalón.',
    ausencias: '—',
    limites: ['Sumar las alternativas del carrusel inflaría el objetivo.'],
  },
];

const LIMITES_DE_LA_SERIE = [
  'Cada punto es la serie del número elegido en una sesión registrada: no se promedian, suman ni eligen máximos entre series.',
  'Se compara con el objetivo histórico de esa serie (el de la versión del plan que rigió ese día).',
];

const DE_ENTRENAMIENTO: readonly DefinicionDeMetrica[] = [
  {
    id: 'entrenamiento.carga',
    area: 'ENTRENAMIENTO',
    nombre: 'Carga registrada en la serie',
    nombreCorto: 'Carga',
    unidad: 'kg',
    escala: 'RATIO',
    clase: 'DISPONIBLE',
    implementada: true,
    proyeccion: 'TRAINING_PROGRESSION_BY_EXERCISE',
    parametro: 'LOAD',
    requiereEjercicio: true,
    requiereSerie: true,
    granos: [{ grano: 'ORIGINAL', agregacion: 'NONE' }],
    granoPorDefecto: 'ORIGINAL',
    familia: 'carga',
    cambioRelativo: true,
    decimales: 1,
    resumenDePeriodo: 'MEDIANA',
    explicacion: 'La carga registrada en la serie elegida del ejercicio, sesión por sesión.',
    comoSeCalcula: 'Sale del registro vigente de cada sesión (la corrección vigente o el original), con la identidad del ejercicio del catálogo. kg y lb son series distintas.',
    ausencias: 'Una serie sin carga, un registro resumido u otro ejercicio no son un punto: son «sin dato».',
    limites: [...LIMITES_DE_LA_SERIE, 'No es 1RM ni fuerza máxima, y no es una marca personal.'],
  },
  {
    id: 'entrenamiento.repeticiones',
    area: 'ENTRENAMIENTO',
    nombre: 'Repeticiones registradas en la serie',
    nombreCorto: 'Repeticiones',
    unidad: 'rep',
    escala: 'RATIO',
    clase: 'DISPONIBLE',
    implementada: true,
    proyeccion: 'TRAINING_PROGRESSION_BY_EXERCISE',
    parametro: 'REPETITIONS',
    requiereEjercicio: true,
    requiereSerie: true,
    granos: [{ grano: 'ORIGINAL', agregacion: 'NONE' }],
    granoPorDefecto: 'ORIGINAL',
    familia: null,
    cambioRelativo: true,
    decimales: 0,
    resumenDePeriodo: 'MEDIANA',
    explicacion: 'Las repeticiones registradas en la serie elegida, sesión por sesión, con la carga de esa misma serie.',
    comoSeCalcula: 'Del registro vigente de cada sesión. Una serie con 0 repeticiones es un dato (lo intentó y no salió ninguna).',
    ausencias: 'Una serie sin repeticiones registradas es «sin dato», no cero.',
    limites: LIMITES_DE_LA_SERIE,
  },
  {
    id: 'entrenamiento.rir',
    area: 'ENTRENAMIENTO',
    nombre: 'RIR declarado en la serie',
    nombreCorto: 'RIR',
    unidad: 'RIR',
    escala: 'ORDINAL',
    clase: 'DISPONIBLE',
    implementada: true,
    proyeccion: 'TRAINING_PROGRESSION_BY_EXERCISE',
    parametro: 'RIR',
    requiereEjercicio: true,
    requiereSerie: true,
    granos: [{ grano: 'ORIGINAL', agregacion: 'NONE' }],
    granoPorDefecto: 'ORIGINAL',
    familia: null,
    cambioRelativo: false,
    decimales: 0,
    resumenDePeriodo: 'MEDIANA',
    explicacion: 'Las repeticiones en reserva que declaró la persona al terminar la serie elegida.',
    comoSeCalcula: 'Del registro vigente de cada sesión. Es una estimación subjetiva y ordinal: se resume con la mediana, nunca con un promedio ni un porcentaje.',
    ausencias: 'Sin informar es «sin dato»; RIR 0 es una respuesta válida (a fallo o casi).',
    limites: [...LIMITES_DE_LA_SERIE, 'El RIR no es una escala de razones: no admite cambio relativo.'],
  },
  {
    id: 'entrenamiento.series-registradas',
    area: 'ENTRENAMIENTO',
    nombre: 'Series registradas del ejercicio',
    nombreCorto: 'Series registradas',
    unidad: 'series',
    escala: 'COUNT',
    clase: 'DERIVABLE',
    implementada: true,
    proyeccion: 'TRAINING_PROGRESSION_BY_EXERCISE',
    parametro: 'SETS_RECORDED',
    requiereEjercicio: true,
    requiereSerie: false,
    granos: [
      { grano: 'ORIGINAL', agregacion: 'COUNT' },
      { grano: 'WEEK', agregacion: 'SUM' },
    ],
    granoPorDefecto: 'ORIGINAL',
    familia: null,
    cambioRelativo: false,
    decimales: 0,
    resumenDePeriodo: 'TOTAL',
    explicacion: 'Cuántas series del ejercicio tienen algún dato en el registro vigente de cada sesión.',
    comoSeCalcula: 'Se cuentan las series del ejercicio con carga, repeticiones o RIR en el registro vigente. Una sesión registrada como «no realizada» aporta 0 series, y lo dice.',
    ausencias: 'Un registro resumido no tiene series: no se sintetizan.',
    limites: ['Plan activado no implica ejecución. Más series no prueban mayor estímulo ni se convierten en volumen.'],
  },
  {
    id: 'entrenamiento.volumen-carga-externa',
    area: 'ENTRENAMIENTO',
    nombre: 'Volumen de carga externa (carga × repeticiones)',
    nombreCorto: 'Volumen',
    unidad: 'kg·rep',
    escala: 'RATIO',
    clase: 'FUTURA',
    implementada: false,
    proyeccion: 'TRAINING_VOLUME_BY_EXERCISE',
    parametro: null,
    requiereEjercicio: true,
    requiereSerie: false,
    granos: [],
    granoPorDefecto: 'ORIGINAL',
    familia: null,
    cambioRelativo: false,
    decimales: 0,
    resumenDePeriodo: 'TOTAL',
    explicacion: 'No se ofrece todavía: falta una convención para mancuerna única, carga por implemento, unilateralidad y peso corporal.',
    comoSeCalcula: 'Con una convención aprobada, sería Σ carga externa × repeticiones de series compatibles (50 kg × 8 = 400 kg·rep).',
    ausencias: '—',
    limites: ['No equivale a trabajo mecánico, gasto energético, hipertrofia ni volumen muscular.'],
  },
  {
    id: 'entrenamiento.descanso-registrado',
    area: 'ENTRENAMIENTO',
    nombre: 'Descanso registrado entre series',
    nombreCorto: 'Descanso',
    unidad: 's',
    escala: 'RATIO',
    clase: 'DERIVABLE',
    implementada: false,
    proyeccion: 'TRAINING_PROGRESSION_BY_EXERCISE',
    parametro: null,
    requiereEjercicio: true,
    requiereSerie: true,
    granos: [],
    granoPorDefecto: 'ORIGINAL',
    familia: 'tiempo-s',
    cambioRelativo: false,
    decimales: 0,
    resumenDePeriodo: 'MEDIANA',
    explicacion: 'Derivable de los tiempos de la sesión (API-TIE-03) con su calidad; no se incluye en esta versión.',
    comoSeCalcula: 'Duración de cada descanso medido, estimado o incompleto, junto al descanso objetivo de esa serie.',
    ausencias: 'Duración desconocida no es cero.',
    limites: ['Comparar solo pares de la misma serie; la calidad del reloj viaja con cada valor.'],
  },
];

/** Las métricas fijas del diccionario, en el orden del selector (las antropométricas salen de los datos). */
export const METRICAS_DEL_DICCIONARIO: readonly DefinicionDeMetrica[] = [...DE_NUTRICION, ...DE_ENTRENAMIENTO];

const PREFIJO_ANTROPOMETRICO = 'antropometria.';

/** Si el código es un porcentaje o un índice: no admiten cambio relativo (se habla de puntos porcentuales). */
const esPorcentajeOIndice = (codigo: string, unidad: string): boolean => unidad === '%' || codigo.startsWith('grasa-') || codigo.startsWith('indice-') || codigo === 'imc';

/** La familia de superposición de una métrica antropométrica: misma clase de medida **y** misma unidad. */
function familiaAntropometrica(codigo: string, unidad: string): string | null {
  if (esPorcentajeOIndice(codigo, unidad)) return null;
  if (codigo.startsWith('suma-')) return `sumatoria-${unidad}`;
  const familia = FAMILIA_DE_METRICA[codigo];
  if (familia === 'PLIEGUES') return `pliegue-${unidad}`;
  if (familia === 'PERIMETROS') return `perimetro-${unidad}`;
  if (familia === 'DIAMETROS') return `diametro-${unidad}`;
  if (codigo === 'peso' || codigo.startsWith('masa-')) return `masa-${unidad}`;
  return null;
}

/** La definición de una métrica antropométrica, a partir de su código del catálogo y de la unidad de los datos. */
export function definicionAntropometrica(codigo: string, unidad: string): DefinicionDeMetrica {
  const derivada = codigo.startsWith('suma-') || codigo.startsWith('grasa-') || codigo.startsWith('masa-') || codigo.startsWith('indice-') || codigo === 'imc' || /morfia$/.test(codigo);
  const porcentaje = esPorcentajeOIndice(codigo, unidad);
  return {
    id: `${PREFIJO_ANTROPOMETRICO}${codigo}`,
    area: 'ANTROPOMETRIA',
    nombre: nombreDeMetrica(codigo),
    nombreCorto: nombreDeMetrica(codigo),
    unidad,
    escala: porcentaje ? 'INTERVAL' : 'RATIO',
    clase: 'DISPONIBLE',
    implementada: true,
    proyeccion: 'ANTHROPOMETRY_LONGITUDINAL',
    parametro: codigo,
    requiereEjercicio: false,
    requiereSerie: false,
    granos: [{ grano: 'ORIGINAL', agregacion: 'NONE' }],
    granoPorDefecto: 'ORIGINAL',
    familia: familiaAntropometrica(codigo, unidad),
    cambioRelativo: !porcentaje,
    decimales: unidad === 'kg' || unidad === 'cm' || unidad === 'mm' ? 1 : 2,
    resumenDePeriodo: 'PRIMERO_Y_ULTIMO_COMPARABLES',
    explicacion: derivada ? `${nombreDeMetrica(codigo)}: resultado de un método identificado, con sus entradas.` : `${nombreDeMetrica(codigo)}: medición directa de cada toma.`,
    comoSeCalcula: derivada
      ? 'Es el resultado vigente del método sobre las mediciones de la toma (API-ANT-06). Si falta un sitio, el método no produce resultado: un sitio ausente no es cero.'
      : 'Es la medición vigente de cada toma registrada (la corrección vigente o el original). Dos tomas del mismo día son dos puntos.',
    ausencias: 'Los días sin toma son huecos; la línea se corta en los huecos y cuando cambia el protocolo, el método o la unidad.',
    limites: [
      'Sin un error de medición documentado no se dibujan intervalos ni se califica un cambio como significativo.',
      'Un punto describe un estado; dos, una diferencia con sus fechas; no una tendencia estable.',
      ...(codigo === 'peso' ? ['El peso no distingue grasa de músculo: no es composición corporal.'] : []),
      ...(derivada && !porcentaje ? ['Una estimación de composición depende de su método: masa libre de grasa, masa magra y masa muscular no son sinónimos.'] : []),
      ...(porcentaje ? ['Un porcentaje se compara en puntos porcentuales, no como cambio relativo.'] : []),
    ],
  };
}

/** La definición de cualquier métrica por su identificador, o `null` si no existe. La unidad antropométrica se informa. */
export function definicionDeMetrica(metricId: string, unidadAntropometrica = ''): DefinicionDeMetrica | null {
  if (metricId.startsWith(PREFIJO_ANTROPOMETRICO)) {
    const codigo = metricId.slice(PREFIJO_ANTROPOMETRICO.length);
    return /^[a-z0-9-]+$/.test(codigo) ? definicionAntropometrica(codigo, unidadAntropometrica) : null;
  }
  return METRICAS_DEL_DICCIONARIO.find((m) => m.id === metricId) ?? null;
}

/** Las agregaciones válidas de una métrica para un grano, o `null` si el grano no se admite (se deshabilita y explica). */
export function agregacionPara(definicion: DefinicionDeMetrica, grano: Grano): Agregacion | null {
  return definicion.granos.find((g) => g.grano === grano)?.agregacion ?? null;
}

/** Hasta tres métricas. Este número no es negociable: un preset no puede esconder una cuarta (encargo §8). */
export const MAXIMO_DE_METRICAS = 3;

/** Una clave legible y estable de una referencia elegida (para colores, URL y comparar selecciones). */
export const claveDeReferencia = (r: ReferenciaDeMetrica): string => [r.metricId, r.exerciseKey ?? '', r.setIndex ?? '', r.unit ?? ''].join('|');

// ─── Presets por pregunta profesional (encargo §9) ──────────────────────────────────────────────

export interface PresetDeAnalisis {
  readonly id: string;
  readonly pregunta: string;
  /** Las métricas del preset; las de entrenamiento se completan con el ejercicio elegido. */
  readonly metricas: readonly string[];
  readonly contexto: string;
  readonly limite: string;
  /** Si el preset abre la comparación de dos períodos. */
  readonly comparaPeriodos: boolean;
}

export const PRESETS_DE_ANALISIS: readonly PresetDeAnalisis[] = [
  {
    id: 'peso-y-alimentacion',
    pregunta: '¿Cómo evoluciona el peso junto con la alimentación registrada?',
    metricas: ['nutricion.energia', 'nutricion.proteinas', 'antropometria.peso'],
    contexto: 'Plan nutricional vigente y cobertura del registro.',
    limite: 'La ingesta registrada no garantiza la ingesta total, y el peso no equivale a grasa ni a músculo.',
    comparaPeriodos: false,
  },
  {
    id: 'medidas-corporales',
    pregunta: '¿Cómo cambian las medidas corporales?',
    metricas: ['antropometria.peso', 'antropometria.perimetro-cintura', 'antropometria.suma-6-pliegues-isak'],
    contexto: 'Tomas y cambios de método.',
    limite: 'No se suman sitios diferentes ni se deduce composición desde el peso.',
    comparaPeriodos: false,
  },
  {
    id: 'rendimiento-de-un-ejercicio',
    pregunta: '¿Cómo evoluciona el rendimiento de este ejercicio?',
    metricas: ['entrenamiento.carga', 'entrenamiento.repeticiones', 'entrenamiento.rir'],
    contexto: 'Plan y versiones del ejercicio; cada sesión con el objetivo de esa serie.',
    limite: 'No se combinan ejercicios ni variantes, y ninguna carga se llama fuerza máxima.',
    comparaPeriodos: false,
  },
  {
    id: 'bloque-de-entrenamiento',
    pregunta: '¿Qué pasó durante este bloque de entrenamiento?',
    metricas: ['entrenamiento.series-registradas', 'entrenamiento.carga', 'entrenamiento.rir'],
    contexto: 'Activación del plan y sesiones registradas.',
    limite: 'Plan activado no implica ejecución; más series no prueban mayor estímulo.',
    comparaPeriodos: false,
  },
  {
    id: 'nutricion-y-rendimiento',
    pregunta: '¿Qué se observa entre nutrición y rendimiento?',
    metricas: ['nutricion.carbohidratos', 'entrenamiento.carga', 'antropometria.peso'],
    contexto: 'Cobertura del registro y planificación.',
    limite: 'Es coincidencia temporal: no indica causa.',
    comparaPeriodos: false,
  },
  {
    id: 'dos-etapas',
    pregunta: '¿Qué cambió entre dos etapas?',
    metricas: [],
    contexto: 'Períodos y versiones del plan.',
    limite: 'Cada período dice su duración, n y cobertura; no se comparan sumas de períodos de distinta duración.',
    comparaPeriodos: true,
  },
  {
    id: 'senales-de-tejido',
    pregunta: '¿Hay señales compatibles con cambios de tejido corporal?',
    metricas: ['antropometria.masa-libre-de-grasa-durnin-womersley', 'antropometria.perimetro-brazo-flexionado', 'entrenamiento.carga'],
    contexto: 'Método, fechas y condiciones de cada toma.',
    limite: 'Masa libre de grasa, masa muscular y rendimiento son conceptos distintos; una coincidencia no es una ganancia muscular.',
    comparaPeriodos: false,
  },
];

/**
 * Qué métricas de un preset se pueden usar con lo disponible para este asesorado, y cuáles faltan (se dice cuáles; no se
 * reemplazan por un sustituto «equivalente»).
 */
export function aplicarPreset(preset: PresetDeAnalisis, disponibles: ReadonlySet<string>): { readonly usables: readonly string[]; readonly faltantes: readonly string[] } {
  const usables: string[] = [];
  const faltantes: string[] = [];
  for (const m of preset.metricas.slice(0, MAXIMO_DE_METRICAS)) (disponibles.has(m) ? usables : faltantes).push(m);
  return { usables, faltantes };
}
