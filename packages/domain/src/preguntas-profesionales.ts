/**
 * Entrar por preguntas profesionales (encargo del 2026-10-09, eje 2). Seis preguntas con parámetros tipados que arman la
 * misma «Analizar» de siempre (las mismas métricas, el mismo selector, las mismas referencias y vistas guardadas), o
 * abren la comparación de etapas, el contraste con lo indicado o la información disponible.
 *
 * - **Nada se elige por la persona:** el ejercicio, la medida corporal, la versión del plan y las etapas se eligen de
 *   forma explícita. Lo que falta se pide; lo que no está disponible se dice y no se reemplaza por algo «equivalente».
 * - **Hasta tres métricas:** ninguna pregunta agrega una cuarta.
 * - **Los parámetros son identificadores:** viajan en la URL y en las vistas guardadas. Los que son del asesorado (la
 *   versión, las etapas, el ejercicio) no aplican a otro: se piden de nuevo.
 * - **«Análisis personalizado»** sigue disponible: una pregunta es una forma de entrar, no la única.
 */
import type { EjercicioDelPeriodo, IdDePregunta, ParametrosDePregunta, ReferenciaDeMetrica } from './contratos-analisis';
import type { DominioConEtapas, EtapaDePlanificacion } from './etapas-de-planificacion';
import { MAXIMO_DE_METRICAS } from './metricas-del-analisis';

export type AreaDePregunta = 'NUTRICION' | 'ENTRENAMIENTO';

/** Lo que hay que elegir antes de responder. */
export type RequisitoDePregunta = 'AREA' | 'VERSION' | 'ETAPAS' | 'MEDIDA_CORPORAL' | 'EJERCICIO' | 'SERIE' | 'UNIDAD';

export const TEXTO_DE_REQUISITO: Readonly<Record<RequisitoDePregunta, string>> = {
  AREA: 'el área',
  VERSION: 'la versión del plan',
  ETAPAS: 'las dos etapas',
  MEDIDA_CORPORAL: 'la medida corporal',
  EJERCICIO: 'el ejercicio',
  SERIE: 'el número de serie',
  UNIDAD: 'la unidad de carga',
};

export interface PreguntaProfesional {
  readonly id: IdDePregunta;
  readonly pregunta: string;
  /** Qué muestra, en una línea. */
  readonly muestra: string;
  /** El límite de interpretación: qué no dice la respuesta. */
  readonly limite: string;
  /** Las principales se ven primero; las demás, en «Más preguntas». */
  readonly principal: boolean;
}

export const PREGUNTAS_PROFESIONALES: readonly PreguntaProfesional[] = [
  {
    id: 'cambio-desde-el-plan',
    pregunta: '¿Qué cambió desde que empezó este plan?',
    muestra: 'La etapa de la versión que elegís, con su banda y sus hitos, y hasta tres métricas desde la activación.',
    limite: 'Un plan activado no es un plan ejecutado, y una coincidencia en el tiempo no indica causa.',
    principal: true,
  },
  {
    id: 'registrado-vs-indicado',
    pregunta: '¿Lo registrado coincide con lo indicado?',
    muestra: 'Cada registro frente a lo que indicaba la versión del plan que ejecutó: por serie en entrenamiento, por comida en nutrición.',
    limite: 'No hay un porcentaje global. Lo indicado es lo de la versión de ese día, y una cantidad sin confirmar sigue sin confirmar.',
    principal: true,
  },
  {
    id: 'progreso-de-un-ejercicio',
    pregunta: '¿Cómo viene progresando este ejercicio?',
    muestra: 'Carga, repeticiones y RIR de una serie, cada sesión con lo que indicaba su plan.',
    limite: 'No se combinan ejercicios ni variantes, y ninguna carga se llama fuerza máxima.',
    principal: true,
  },
  {
    id: 'informacion-para-revisar',
    pregunta: '¿Con qué información cuento para revisar el objetivo?',
    muestra: 'Qué hay registrado por área, de qué fechas, qué falta y qué es comparable, con las acciones para pedir contexto o preparar la revisión.',
    limite: 'Describe la información disponible: no dice si alcanza para decidir.',
    principal: true,
  },
  {
    id: 'alimentacion-y-medidas',
    pregunta: '¿Cómo evolucionaron la alimentación y las medidas corporales?',
    muestra: 'Energía y proteínas registradas, con una medida corporal que elegís, en paneles sincronizados.',
    limite: 'La ingesta registrada no es la ingesta total, y el peso no equivale a grasa ni a músculo.',
    principal: false,
  },
  {
    id: 'comparar-etapas',
    pregunta: '¿Qué cambió entre dos etapas?',
    muestra: 'Dos etapas del plan con sus fechas, duración, observaciones y cobertura, resumidas con el mismo criterio.',
    limite: 'No se restan totales de duraciones distintas ni valores de métodos, unidades o ejercicios distintos.',
    principal: false,
  },
];

export const preguntaProfesional = (id: IdDePregunta): PreguntaProfesional => PREGUNTAS_PROFESIONALES.find((p) => p.id === id) as PreguntaProfesional;

/** Lo que pide cada pregunta, según lo ya elegido (el ejercicio solo hace falta en entrenamiento). */
export function requisitosDe(id: IdDePregunta, p: ParametrosDePregunta): RequisitoDePregunta[] {
  switch (id) {
    case 'cambio-desde-el-plan':
      return ['AREA', 'VERSION', ...(p.area === 'ENTRENAMIENTO' ? (['EJERCICIO', 'SERIE', 'UNIDAD'] as const) : [])];
    case 'registrado-vs-indicado':
      return ['AREA', ...(p.area === 'ENTRENAMIENTO' ? (['EJERCICIO'] as const) : [])];
    case 'alimentacion-y-medidas':
      return ['MEDIDA_CORPORAL'];
    case 'progreso-de-un-ejercicio':
      return ['EJERCICIO', 'SERIE', 'UNIDAD'];
    case 'comparar-etapas':
      return ['AREA', 'ETAPAS'];
    case 'informacion-para-revisar':
      return [];
  }
}

/** Lo que la pregunta necesita saber del asesorado, ya leído y autorizado. */
export interface ContextoDeLaPregunta {
  readonly hoy: string;
  readonly maximoDeDias: number;
  readonly areas: ReadonlySet<AreaDePregunta>;
  readonly etapas: Readonly<Record<DominioConEtapas, readonly EtapaDePlanificacion[]>>;
  /** Los ejercicios con sesiones registradas en el período (API-PRJ-01 de entrenamiento). */
  readonly ejercicios: readonly EjercicioDelPeriodo[];
  /** Las medidas corporales con tomas en el período (`antropometria.<código>`). */
  readonly medidas: ReadonlySet<string>;
}

export type DestinoDePregunta =
  | {
      readonly tipo: 'ANALIZAR';
      readonly metricas: readonly ReferenciaDeMetrica[];
      /** El período de la etapa, si la pregunta lo fija; `null` usa el período elegido. */
      readonly periodo: { readonly desde: string; readonly hasta: string; readonly recortado: boolean } | null;
      readonly etapa: EtapaDePlanificacion | null;
    }
  | { readonly tipo: 'CONTRASTE'; readonly area: AreaDePregunta; readonly exerciseKey: string | null }
  | { readonly tipo: 'ETAPAS'; readonly area: AreaDePregunta; readonly a: EtapaDePlanificacion; readonly b: EtapaDePlanificacion }
  | { readonly tipo: 'INFORMACION'; readonly area: AreaDePregunta | null };

export type ResolucionDePregunta =
  | {
      readonly estado: 'FALTA_ELEGIR';
      /** Todo lo que falta elegir, en el orden en que se pide. */
      readonly requisitos: readonly RequisitoDePregunta[];
      /** De lo que venía elegido, lo que no aplica a este asesorado (otra persona, o sin datos en el período). */
      readonly noAplican: readonly RequisitoDePregunta[];
    }
  | { readonly estado: 'LISTA'; readonly destino: DestinoDePregunta };

const DOMINIO: Readonly<Record<AreaDePregunta, DominioConEtapas>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING' };

const metrica = (metricId: string, extra: Partial<Omit<ReferenciaDeMetrica, 'metricId'>> = {}): ReferenciaDeMetrica => ({ metricId, exerciseKey: null, setIndex: null, unit: null, ...extra });

/**
 * Resuelve una pregunta con sus parámetros en un asesorado: qué falta elegir, o adónde lleva. Lo elegido que no aplica a
 * este asesorado se dice y se vuelve a pedir; nunca se reemplaza por otra cosa.
 */
export function resolverPregunta(id: IdDePregunta, p: ParametrosDePregunta, ctx: ContextoDeLaPregunta): ResolucionDePregunta {
  const faltan: RequisitoDePregunta[] = [];
  const noAplican: RequisitoDePregunta[] = [];
  const pedir = (r: RequisitoDePregunta, venia: boolean) => {
    faltan.push(r);
    if (venia) noAplican.push(r);
  };

  const area = p.area && ctx.areas.has(p.area) ? p.area : null;
  // Lo que depende del área (el ejercicio en entrenamiento) se pide después de tener un área que se pueda ver.
  const requisitos = requisitosDe(id, { ...p, area: area ?? undefined });
  if (requisitos.includes('AREA') && area === null) pedir('AREA', p.area !== undefined);

  const etapas = area ? ctx.etapas[DOMINIO[area]] : [];
  const etapa = (planVersionId: string | undefined) => (planVersionId ? (etapas.find((e) => e.planVersionId === planVersionId) ?? null) : null);
  const version = etapa(p.planVersionId);
  if (requisitos.includes('VERSION') && area !== null && version === null) pedir('VERSION', p.planVersionId !== undefined);

  const a = etapa(p.stageA);
  const b = etapa(p.stageB);
  if (requisitos.includes('ETAPAS') && area !== null && (a === null || b === null || a.planVersionId === b.planVersionId))
    pedir('ETAPAS', p.stageA !== undefined || p.stageB !== undefined);

  if (requisitos.includes('MEDIDA_CORPORAL') && (p.bodyMetric === undefined || !ctx.medidas.has(p.bodyMetric))) pedir('MEDIDA_CORPORAL', p.bodyMetric !== undefined);

  const ejercicio = p.exerciseKey ? (ctx.ejercicios.find((e) => e.exerciseKey === p.exerciseKey) ?? null) : null;
  if (requisitos.includes('EJERCICIO') && ejercicio === null) pedir('EJERCICIO', p.exerciseKey !== undefined);
  if (requisitos.includes('SERIE') && ejercicio !== null && (p.setIndex === undefined || !ejercicio.setNumbers.includes(p.setIndex))) pedir('SERIE', p.setIndex !== undefined);
  // Sin cargas registradas, la carga se lee en kg y la serie lo dice; con cargas, la unidad tiene que ser una registrada.
  const unidadValida = (u: 'kg' | 'lb') => ejercicio !== null && (ejercicio.loadUnits.length === 0 ? u === 'kg' : ejercicio.loadUnits.includes(u));
  if (requisitos.includes('UNIDAD') && ejercicio !== null && (p.unit === undefined || !unidadValida(p.unit))) pedir('UNIDAD', p.unit !== undefined);

  if (faltan.length > 0) return { estado: 'FALTA_ELEGIR', requisitos: faltan, noAplican };

  const delEjercicio = { exerciseKey: p.exerciseKey ?? null };
  const conSerie = { ...delEjercicio, setIndex: p.setIndex ?? null };
  switch (id) {
    case 'cambio-desde-el-plan': {
      const e = version as EtapaDePlanificacion;
      const hasta = e.ultimoDia ?? e.desde;
      const minimo = new Date(Date.parse(`${hasta}T12:00:00Z`) - (ctx.maximoDeDias - 1) * 86_400_000).toISOString().slice(0, 10);
      const periodo = e.desde < minimo ? { desde: minimo, hasta, recortado: true } : { desde: e.desde, hasta, recortado: false };
      const metricas =
        area === 'NUTRICION'
          ? [metrica('nutricion.energia'), metrica('nutricion.proteinas'), metrica('nutricion.registros')]
          : [metrica('entrenamiento.series-registradas', delEjercicio), metrica('entrenamiento.carga', { ...conSerie, unit: p.unit ?? null }), metrica('entrenamiento.repeticiones', conSerie)];
      return { estado: 'LISTA', destino: { tipo: 'ANALIZAR', metricas: metricas.slice(0, MAXIMO_DE_METRICAS), periodo, etapa: e } };
    }
    case 'registrado-vs-indicado':
      return { estado: 'LISTA', destino: { tipo: 'CONTRASTE', area: area as AreaDePregunta, exerciseKey: area === 'ENTRENAMIENTO' ? (p.exerciseKey ?? null) : null } };
    case 'alimentacion-y-medidas':
      return { estado: 'LISTA', destino: { tipo: 'ANALIZAR', metricas: [metrica('nutricion.energia'), metrica('nutricion.proteinas'), metrica(p.bodyMetric as string)], periodo: null, etapa: null } };
    case 'progreso-de-un-ejercicio':
      return {
        estado: 'LISTA',
        destino: {
          tipo: 'ANALIZAR',
          metricas: [metrica('entrenamiento.carga', { ...conSerie, unit: p.unit ?? null }), metrica('entrenamiento.repeticiones', conSerie), metrica('entrenamiento.rir', conSerie)],
          periodo: null,
          etapa: null,
        },
      };
    case 'comparar-etapas': {
      // A es la más antigua de las dos: la diferencia se lee siempre como «la etapa posterior menos la anterior».
      const [primera, segunda] = [a as EtapaDePlanificacion, b as EtapaDePlanificacion].sort((x, y) => x.activadaEl.localeCompare(y.activadaEl));
      return { estado: 'LISTA', destino: { tipo: 'ETAPAS', area: area as AreaDePregunta, a: primera as EtapaDePlanificacion, b: segunda as EtapaDePlanificacion } };
    }
    case 'informacion-para-revisar':
      return { estado: 'LISTA', destino: { tipo: 'INFORMACION', area: p.area && ctx.areas.has(p.area) ? p.area : null } };
  }
}

/**
 * Los parámetros que una vista guardada puede reutilizar en otro asesorado: el área, la medida, la serie y la unidad son
 * configuración; la versión, las etapas y el ejercicio son selecciones de un asesorado y se validan contra el actual.
 */
export const PARAMETROS_DEL_ASESORADO: readonly (keyof ParametrosDePregunta)[] = ['planVersionId', 'stageA', 'stageB', 'exerciseKey'];

/** Si una pregunta guardada trae selecciones de un asesorado (para avisarlo al guardar). */
export const traeSeleccionesDelAsesorado = (p: ParametrosDePregunta): boolean => PARAMETROS_DEL_ASESORADO.some((k) => p[k] !== undefined);
