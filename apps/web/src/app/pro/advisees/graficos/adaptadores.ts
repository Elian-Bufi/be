/**
 * De cada respuesta a carriles (WP-GRAFICOS fase 2, DL-174): una serie analítica de API-PRJ-01, el 1RM estimado y las
 * vigencias de los planes. Acá no se suma, promedia ni interpola nada: se cambia la forma y se decide la marca con el
 * dominio (`marcaDelPunto`), para que lo precargado del plan nunca se dibuje como dato de la persona.
 *
 * Lo indicado del entrenamiento (GR-03 y GR-05; GR-T14) sale del comparador «Planificado y registrado»: las sesiones de
 * API-TRN-21 y los objetivos por serie de cada versión (API-SER-01), con `observacionesDelEjercicio` y `evolucion` del
 * dominio. Cada sesión se lee contra la prescripción de la versión que rigió ese día (REG-06-105), nunca contra la de hoy.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import {
  EJERCICIOS_DE_LA_ESTIMACION_V1,
  evolucion,
  MARCA_SEGUN_EL_DATO,
  marcaDelPunto,
  marcaDelPuntoDeFuerza,
  numero,
  observacionesDelEjercicio,
  type AreaDeMetrica,
  type EjecucionDeEntrenamiento,
  type MarcaSemantica,
  type Medida,
  type ObjetivosDeLaVersion,
  type PlanConObjetivos,
  type PuntoAnalitico,
  type PuntoDeEvolucion,
  type PuntoDeFuerza,
  type ResultadoDeEstimacionDeFuerza,
  type SerieAnalitica,
  type SerieDisponible,
  type ValorPlanificado,
  type VigenciaDePlan,
} from '@be/domain';
import { diaAnterior } from '../seguimiento/geometria';
import type { BandaDeVersion, CarrilDePuntos, EscalaDelCarril, PuntoDelCarril } from './carriles';

const AREA_DEL_DOMINIO: Readonly<Record<VigenciaDePlan['domain'], AreaDeMetrica>> = { NUTRITION: 'NUTRICION', TRAINING: 'ENTRENAMIENTO', ANTHROPOMETRY: 'ANTROPOMETRIA' };

/**
 * Las versiones de los planes de un área como bandas de fondo: «v3 · desde el 2/9». Contexto, no «plan cumplido». Cada
 * banda va del día que empezó a regir al anterior al corte (ese día ya rige la siguiente), como las barras de la cinta:
 * dos bandas seguidas no se pisan.
 */
export function bandasDeVersion(vigencias: readonly VigenciaDePlan[], area: AreaDeMetrica): BandaDeVersion[] {
  return vigencias
    .filter((v) => AREA_DEL_DOMINIO[v.domain] === area)
    .map((v) => ({ area, desde: v.from, hasta: v.to === null ? null : v.to > v.from ? diaAnterior(v.to) : v.from, rotulo: `${v.label} · desde el ${Number(v.from.slice(8, 10))}/${Number(v.from.slice(5, 7))}` }));
}

/** El prefijo del tramo de una serie observada por el profesional en el 1RM estimado (`serieDeLaFuerza`). */
const TRAMO_OBSERVADO = 'observada:';

/**
 * La marca de un punto del 1RM estimado que llega como serie analítica (`serieDeLaFuerza`): rombo lo observado por el
 * profesional, hueca lo orientativo (de 10 a 12 repeticiones equivalentes) y llena el núcleo. Lo observado nunca se
 * dibuja como dato de la persona.
 */
export function marcaDelPuntoAnaliticoDeFuerza(p: Pick<PuntoAnalitico, 'segment' | 'quality'>): MarcaSemantica {
  if (p.segment.startsWith(TRAMO_OBSERVADO)) return MARCA_SEGUN_EL_DATO.OBSERVADA_POR_EL_PROFESIONAL;
  return p.quality === 'COMPLETE' ? MARCA_SEGUN_EL_DATO.REGISTRADO : MARCA_SEGUN_EL_DATO.ORIENTATIVA;
}

const esDeLaEstimacion = (serie: Pick<SerieDisponible, 'fuente'>): boolean => serie.fuente.tipo === 'PROYECCION' && serie.fuente.clave === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE';

/** Un punto analítico como punto de un carril, con la marca del dominio y la lectura que diga la pantalla. */
export function puntoDelCarril(p: PuntoAnalitico, serie: Pick<SerieDisponible, 'marca' | 'fuente'>, lectura: (p: PuntoAnalitico) => string, tarde = false): PuntoDelCarril {
  const estimacion = esDeLaEstimacion(serie);
  const marca = estimacion ? marcaDelPuntoAnaliticoDeFuerza(p) : marcaDelPunto(p, serie);
  // La forma hueca dice tres cosas: orientativa en el 1RM estimado, lo indicado en una serie de lo indicado y, en lo demás,
  // un subtotal. La leyenda pide la que es (revisión del 15/11).
  const sentido = marca !== 'HUECA' ? undefined : estimacion ? ('ORIENTATIVA' as const) : serie.marca === 'INDICADO' ? ('INDICADO' as const) : ('SUBTOTAL' as const);
  return { clave: p.pointId, fecha: p.date, hasta: p.dateEnd, en: p.at, valor: p.value, rango: null, tramo: p.segment, marca, tarde, lectura: lectura(p), ...(sentido ? { sentido } : {}) };
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
  const minimoDelCatalogo = serie.rangoMinimoDelEje ? serie.rangoMinimoDelEje[s.unit] : undefined;
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
    // El rango mínimo del catálogo manda sobre el de la unidad (el 1RM estimado, 10 kg o 22 lb: GR-T15).
    escala: o.escala.rangoMinimo === undefined && minimoDelCatalogo !== undefined ? { ...o.escala, rangoMinimo: minimoDelCatalogo } : o.escala,
    cobertura: fechas.map((fecha): CarrilDePuntos['cobertura'][number] => ({ fecha, estado: sin.has(fecha) && !conDato.has(fecha) ? 'sin' : hueco.has(fecha) ? 'hueco' : 'con' })),
    descripcion: o.descripcion,
    // El rótulo de un punto redondea como su lectura (pulido de WP-GRAFICOS-POR-FASE).
    decimales: serie.definicion.decimales,
  };
}

function diasEntre(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  for (let t = Date.parse(`${desde}T12:00:00Z`); t <= Date.parse(`${hasta}T12:00:00Z`); t += 86_400_000) dias.push(new Date(t).toISOString().slice(0, 10));
  return dias;
}

/**
 * El `exerciseId` de una clave `e:` de la lista de la estimación de la estimación, o `null` si no es una de ellas: una versión
 * suelta (`v:`) u otro ejercicio no tienen estimación (RM-16, DL-171), y no se piden.
 */
export function ejercicioDeLaEstimacion(exerciseKey: string | null): string | null {
  if (exerciseKey === null || !exerciseKey.startsWith('e:')) return null;
  const id = exerciseKey.slice(2);
  return EJERCICIOS_DE_LA_ESTIMACION_V1.some((e) => e.exerciseId === id) ? id : null;
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
    label: '1RM estimado (Epley)',
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
    segments: [{ segment: 'estimacion', label: 'Epley', breakReason: null }],
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

// ─── Lo indicado del entrenamiento (GR-03 y GR-05; GR-T14) ──────────────────────────────────────

/**
 * Los objetivos por serie de una versión leída con API-SER-01, por prescripción: lo que pide la comparación del dominio.
 * Es lo mismo que arma `objetivosDe` en `training/ejecuciones.tsx`, sin la pantalla.
 */
export function objetivosDelPlanLeido(plan: PlanConObjetivos): ObjetivosDeLaVersion {
  return new Map(plan.blocks.flatMap((b) => [...b.sessions, ...b.microcycles.flatMap((m) => m.sessions)]).flatMap((s) => s.prescriptions.map((p) => [p.prescriptionId, p.sets] as const)));
}

export interface OpcionesDeLoIndicado {
  /** `e:<exerciseId>` o `v:<versionId>`, como en el selector de «Analizar». */
  readonly exerciseKey: string;
  /** El número de la serie (`setIndex`): lo indicado es el de esa serie, nunca un promedio entre series. */
  readonly serie: number;
  readonly medida: Medida;
  readonly desde: string;
  readonly hasta: string;
}

/** Cada sesión del ejercicio en el período, con lo que indicaba para esa serie la versión que la rigió. */
function loIndicadoEnCadaSesion(ejecuciones: readonly EjecucionDeEntrenamiento[], objetivosPorVersion: ReadonlyMap<string, ObjetivosDeLaVersion>, o: OpcionesDeLoIndicado): PuntoDeEvolucion[] {
  // La identidad del ejercicio sale de todas las sesiones leídas, como en el comparador; después se recorta al período.
  const observaciones = observacionesDelEjercicio(ejecuciones, o.exerciseKey, ejecuciones, objetivosPorVersion).filter((x) => x.comparacion.fecha >= o.desde && x.comparacion.fecha <= o.hasta);
  return evolucion(observaciones, o.medida, o.serie);
}

/**
 * Lo indicado en palabras («RIR 2», «8 a 10 rep», «40 kg (sugerida)»), o `null` si no hay un número que dibujar: sin
 * fijar, un % RM (no se convierte a kg), otra unidad (kg y lb nunca van juntas), una serie que la versión no tenía o lo
 * indicado para otro ejercicio (una sustitución).
 */
export function lecturaDeLoIndicado(v: ValorPlanificado, medida: Medida): string | null {
  const unidad = medida.variable === 'carga' ? medida.unidad : 'rep';
  if (v.tipo === 'valor') return medida.variable === 'rir' ? `RIR ${numero(v.valor)}` : `${numero(v.valor)} ${unidad}${v.sugerida ? ' (sugerida)' : ''}`;
  if (v.tipo === 'rango') return medida.variable === 'rir' ? `RIR ${numero(v.min)} a ${numero(v.max)}` : `${numero(v.min)} a ${numero(v.max)} ${unidad}`;
  return null;
}

/**
 * Lo indicado como puntos huecos de un carril, en la fecha (y la hora) de cada sesión: el mismo lugar que lo registrado
 * de esa sesión. Un valor es un punto; un rango («8 a 10 rep»), un segmento hueco sin valor del medio. La línea une solo
 * las sesiones de la misma prescripción de la misma versión: otra versión u otra sesión del plan la corta (GR-T27).
 */
export function puntosDeLoIndicado(ejecuciones: readonly EjecucionDeEntrenamiento[], objetivosPorVersion: ReadonlyMap<string, ObjetivosDeLaVersion>, o: OpcionesDeLoIndicado): PuntoDelCarril[] {
  return loIndicadoEnCadaSesion(ejecuciones, objetivosPorVersion, o).flatMap((p): PuntoDelCarril[] => {
    const v = p.planificado;
    if (v.tipo !== 'valor' && v.tipo !== 'rango') return [];
    const lectura = lecturaDeLoIndicado(v, o.medida);
    if (lectura === null) return [];
    const c = p.observacion.comparacion;
    const base = { clave: `indicado:${c.executionId}:${c.prescriptionId}:${o.serie}`, fecha: c.fecha, hasta: null, en: c.ocurrio, marca: MARCA_SEGUN_EL_DATO.INDICADO, tarde: false, lectura };
    return v.tipo === 'rango'
      ? [{ ...base, valor: null, rango: { desde: v.min, hasta: v.max }, tramo: `indicado-rango:${c.executionId}:${c.prescriptionId}` }]
      : [{ ...base, valor: v.valor, rango: null, tramo: `indicado:${p.tramoPlanificado ?? c.executionId}` }];
  });
}

/**
 * Lo indicado como serie analítica, para «Analizar» y para `leerSerieDelCatalogo` (`entrenamiento.rir-indicado`). Solo
 * los valores: un rango no se vuelve un número (la nota lo dice) y lo que no está fijado no es un punto.
 */
export function serieDeLoIndicado(
  ejecuciones: readonly EjecucionDeEntrenamiento[],
  objetivosPorVersion: ReadonlyMap<string, ObjetivosDeLaVersion>,
  o: OpcionesDeLoIndicado & { readonly metricId: string; readonly nombre: string; readonly escala: SerieAnalitica['scale'] },
): SerieAnalitica {
  const puntos: PuntoAnalitico[] = [];
  let conRango = 0;
  for (const p of loIndicadoEnCadaSesion(ejecuciones, objetivosPorVersion, o)) {
    const v = p.planificado;
    if (v.tipo === 'rango') conRango++;
    if (v.tipo !== 'valor') continue;
    const c = p.observacion.comparacion;
    puntos.push({
      pointId: `indicado:${c.executionId}:${c.prescriptionId}:${o.serie}`,
      date: c.fecha,
      dateEnd: null,
      at: c.ocurrio,
      value: v.valor,
      quality: 'COMPLETE',
      n: 1,
      segment: `indicado:${p.tramoPlanificado ?? c.executionId}`,
      corrected: false,
      partialBucket: false,
      dataClass: null,
      method: null,
      planVersionIds: [c.planId],
      coverage: null,
      missing: [],
      detail: [
        { label: 'Sesión', value: c.sesion },
        { label: 'De dónde sale', value: v.origen === 'serie' ? 'El objetivo de esta serie en la versión que rigió' : 'Lo indicado para toda la prescripción en la versión que rigió' },
      ],
      sources: [{ type: 'TRAINING_PLAN_VERSION', id: c.planId }],
      sourcesTruncated: false,
    });
  }
  const tramos = [...new Set(puntos.map((p) => p.segment))];
  return {
    metricId: o.metricId,
    label: o.nombre,
    unit: o.medida.variable === 'carga' ? o.medida.unidad : o.medida.variable === 'rir' ? 'RIR' : 'rep',
    scale: o.escala,
    grain: 'ORIGINAL',
    aggregation: 'NONE',
    points: puntos,
    gaps: [],
    segments: tramos.map((segment, i) => ({ segment, label: 'Lo indicado por una misma prescripción de una misma versión', breakReason: i === 0 ? null : 'Otra versión del plan u otra prescripción' })),
    notes: [
      'Es lo que indicaba el plan para esa serie, no lo que hizo la persona.',
      ...(conRango > 0 ? [`${conRango === 1 ? '1 sesión indicaba' : `${conRango} sesiones indicaban`} un rango: no se dibuja como un número.`] : []),
    ],
  };
}
