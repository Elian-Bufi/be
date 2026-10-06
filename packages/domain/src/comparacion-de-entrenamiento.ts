/**
 * Planificado y registrado, serie por serie y a lo largo del tiempo (website profesional; amplía «la comparación
 * legible» de DL-105).
 *
 * El gráfico y la tabla se dibujan con lo que devuelve este módulo, así no pueden decir cosas distintas. No calcula
 * volumen, marcas, promedios, máximos ni sumas (09v10:1285-1295): **cada serie se compara con la serie del mismo número
 * de la prescripción que rigió esa sesión** (su instantánea, REG-06-105), nunca con la versión vigente hoy.
 *
 * Lo que falta no se completa (B10-06; H-09-TRN-01; 06:4661):
 * - una serie registrada vale lo que dice el registro vigente: la corrección terminal o el original (`registroVigente`);
 *   si la vista vigente no se puede resolver, no se grafica nada y se dice por qué;
 * - «no realizada» solo cuando la sesión se registró así (`NOT_COMPLETED`), que es la única declaración de omisión que
 *   existe. Una serie que falta en un registro por serie es **sin dato**, no «no realizada»: el contrato no permite
 *   declarar una serie como no hecha (extensión pendiente, documentada en la evidencia);
 * - sin registro es sin dato, nunca cero;
 * - un registro resumido no tiene series y no se sintetizan (09v10:1099-1101);
 * - una serie registrada con un número que la prescripción no tiene es **adicional**: no tiene prescripción, y no se
 *   inventa una;
 * - los borradores no llegan (API-TRN-21 trae solo lo registrado, 09v10:980) y una sesión futura no aparece: no es un
 *   faltante.
 *
 * Lo planificado conserva su forma: un rango sigue siendo un rango («6-8», no 7), una serie sin repeticiones fijadas no
 * se completa, la carga sugerida es un complemento y no una obligación (09v10:391), y un %RM no se convierte a kg: BE no
 * tiene una base válida para hacerlo (09v10:356). Las unidades no se mezclan: kg y lb son medidas distintas.
 *
 * **Identidad del ejercicio.** Se sigue por `exerciseId` del catálogo, que es estable entre versiones, y nunca por el
 * nombre: dos ejercicios distintos con el mismo nombre quedan separados. Hay que distinguir dos cosas:
 * - la **sustitución de versión** (`sustituido`) es lo que informa el contrato: se registró una versión distinta de la
 *   prescripta;
 * - la **identidad** (`identidad`) es qué se sabe del ejercicio registrado. La ejecución trae solo la versión registrada,
 *   y a qué ejercicio pertenece se sabe si esa versión aparece prescripta en alguna ejecución del período
 *   (`identidadDeVersiones`). Puede ser el mismo ejercicio (otra versión), otro ejercicio, o no saberse.
 * Las dos vistas (por serie y evolución) usan la misma identidad: la diferencia se calcula solo cuando se sabe que es el
 * mismo ejercicio. Cuando no se sabe, se dice, sin afirmar que es el mismo ni que es otro.
 */
import type { EjecucionDeEntrenamiento, EjercicioRegistrado, Prescripcion, SerieEjecutadaApi } from './contratos-entrenamiento';
import { registroVigente } from './copy-entrenamiento';
import { cantidad, numero } from './formato-numeros';

type Carga = { readonly value: number; readonly unit: 'kg' | 'lb' };
type Repeticiones = NonNullable<Prescripcion['sets'][number]['repetitions']>;
type Condicion = EjecucionDeEntrenamiento['original']['sessionCondition'];

/** Lo que se grafica. Cada medida tiene su propio eje: nunca kg, repeticiones y RIR juntos, ni kg con lb. */
export type Medida = { readonly variable: 'repeticiones' } | { readonly variable: 'rir' } | { readonly variable: 'carga'; readonly unidad: 'kg' | 'lb' };

/** Por qué no hay un valor registrado. Ninguno de estos casos es cero ni «no realizada». */
export type MotivoSinDato =
  | 'serie-no-registrada'
  | 'ejercicio-no-registrado'
  | 'registro-resumido'
  | 'vista-no-resoluble'
  | 'otro-ejercicio'
  | 'identidad-desconocida'
  | 'campo-no-registrado';

/**
 * DL-122: el objetivo efectivo de una serie (de API-SER-01, para la versión que rigió), con el origen de cada valor. Solo
 * está si se pasaron los objetivos de la versión: sin ellos, el RIR y la carga planificados son los de la prescripción.
 */
export interface ObjetivoPlanificadoDeSerie {
  readonly rir: number | null;
  readonly carga: Carga | null;
  readonly origenDelRir: 'SET' | 'PRESCRIPTION' | 'NONE';
  readonly origenDeLaCarga: 'SET' | 'PRESCRIPTION' | 'NONE';
}

export type SeriePlanificada =
  | { readonly tipo: 'planificada'; readonly repeticiones: Repeticiones | null; readonly nota: string | null; readonly objetivo?: ObjetivoPlanificadoDeSerie }
  | { readonly tipo: 'no-planificada' };

/**
 * DL-122: los objetivos efectivos de una versión de plan, por prescripción, tal como los devuelve API-SER-01. Se pasan a la
 * comparación para que el RIR y la carga planificados sean los de cada serie.
 */
export type ObjetivosDeLaVersion = ReadonlyMap<string, readonly { readonly setIndex: number; readonly target: { readonly rir: number | null; readonly suggestedLoad: Carga | null }; readonly targetOrigin: { readonly rir: 'SET' | 'PRESCRIPTION' | 'NONE'; readonly suggestedLoad: 'SET' | 'PRESCRIPTION' | 'NONE' } }[]>;

export type SerieRegistrada =
  | { readonly tipo: 'registrada'; readonly serie: SerieEjecutadaApi }
  | { readonly tipo: 'sin-dato'; readonly motivo: Exclude<MotivoSinDato, 'campo-no-registrado' | 'otro-ejercicio' | 'identidad-desconocida'> }
  | { readonly tipo: 'no-realizada' };

export interface FilaDeSerie {
  /** El número real de la serie (`setIndex`): no se renumera. */
  readonly numero: number;
  readonly planificada: SeriePlanificada;
  readonly registrada: SerieRegistrada;
  /**
   * Trazabilidad: con una corrección vigente, la misma serie en el registro original (`null` si allí no estaba).
   * `undefined` cuando rige el original.
   */
  readonly enElOriginal: SerieEjecutadaApi | null | undefined;
  /** La corrección vigente cambió esta serie respecto del original. */
  readonly corregida: boolean;
}

export type FuenteDelRegistro =
  | { readonly tipo: 'original'; readonly registradoEl: string }
  | {
      readonly tipo: 'correccion';
      readonly correctionId: string;
      readonly autor: string;
      readonly rolDelAutor: 'ADVISEE' | 'PROFESSIONAL';
      readonly registradaEl: string;
      readonly motivo: string;
    }
  | { readonly tipo: 'no-resoluble' };

/**
 * Qué se sabe del ejercicio registrado respecto del prescripto:
 * - `misma-version`: se registró la versión prescripta;
 * - `mismo-ejercicio`: otra versión del mismo ejercicio del catálogo (el contrato la informa como sustitución);
 * - `otro-ejercicio`: una versión de otro ejercicio;
 * - `desconocida`: la versión registrada no aparece prescripta en el período, y no se sabe a qué ejercicio pertenece;
 * - `sin-registro`: el registro vigente no incluye esta prescripción, o no se puede resolver.
 */
export type IdentidadDelRegistro = 'misma-version' | 'mismo-ejercicio' | 'otro-ejercicio' | 'desconocida' | 'sin-registro';

/** Versión del catálogo → ejercicio (`exerciseId`), según las prescripciones de un conjunto de ejecuciones. */
export type IdentidadDeVersiones = ReadonlyMap<string, string>;

/**
 * Lo que las ejecuciones dicen de la identidad de cada versión: cada prescripción trae su versión y su ejercicio. Se arma
 * con **todas** las ejecuciones del período, así las dos vistas y cualquier filtro usan la misma información.
 */
export function identidadDeVersiones(ejecuciones: readonly EjecucionDeEntrenamiento[]): IdentidadDeVersiones {
  const m = new Map<string, string>();
  for (const x of ejecuciones) for (const p of x.plannedSession.prescriptions) m.set(p.exerciseVersionId, p.exerciseId);
  return m;
}

/** Se sabe que lo registrado es el ejercicio prescripto (la misma versión u otra del mismo ejercicio). */
export const esElMismoEjercicio = (identidad: IdentidadDelRegistro): boolean => identidad === 'misma-version' || identidad === 'mismo-ejercicio';

/** Una prescripción de una ejecución registrada, con lo planificado y lo registrado serie por serie. */
export interface ComparacionDeEjercicio {
  readonly executionId: string;
  readonly fecha: string;
  readonly ocurrio: string;
  readonly registradoEl: string;
  readonly planId: string;
  readonly sesion: string;
  readonly prescriptionId: string;
  readonly orden: number;
  readonly prescripto: { readonly exerciseId: string; readonly exerciseVersionId: string; readonly nombre: string };
  /**
   * `null` si el registro vigente no incluye esta prescripción. `exerciseId` es el ejercicio de la versión registrada si
   * se sabe (ver `identidad`), y `null` si no.
   */
  readonly realizado: { readonly exerciseVersionId: string; readonly exerciseId: string | null; readonly nombre: string } | null;
  /** Lo que informa el contrato: se registró una versión distinta de la prescripta. No dice si es otro ejercicio. */
  readonly sustituido: boolean;
  /** Qué se sabe del ejercicio registrado. La diferencia se calcula solo si es el mismo (`esElMismoEjercicio`). */
  readonly identidad: IdentidadDelRegistro;
  /** La condición del registro vigente; `null` si la vista vigente no se puede resolver. */
  readonly condicion: Condicion | null;
  readonly resumen: string | null;
  readonly fuente: FuenteDelRegistro;
  /** El criterio de intensidad de la prescripción: rige para todas sus series, no es un valor por serie. */
  readonly rirObjetivo: number | null;
  readonly porcentajeRm: { readonly valor: number; readonly referencia: string | null } | null;
  readonly cargaSugerida: Carga | null;
  readonly nota: string | null;
  /** La prescripción completa de la instantánea, para mostrarla tal como se escribió. */
  readonly prescripcion: Prescripcion;
  readonly filas: readonly FilaDeSerie[];
}

const porOcurrencia = (a: EjecucionDeEntrenamiento, b: EjecucionDeEntrenamiento): number =>
  a.occurredAt.localeCompare(b.occurredAt) || a.recordedAt.localeCompare(b.recordedAt) || a.executionId.localeCompare(b.executionId);

function fuenteDe(x: EjecucionDeEntrenamiento): FuenteDelRegistro {
  const vista = x.effectiveView;
  if (vista.kind === 'NOT_RESOLVABLE') return { tipo: 'no-resoluble' };
  if (vista.kind === 'ORIGINAL') return { tipo: 'original', registradoEl: x.recordedAt };
  const c = x.corrections.find((y) => y.correctionId === vista.correctionId);
  if (!c) return { tipo: 'original', registradoEl: x.recordedAt };
  return { tipo: 'correccion', correctionId: c.correctionId, autor: c.author.displayName, rolDelAutor: c.authorRole, registradaEl: c.recordedAt, motivo: c.reason };
}

const mismaSerie = (a: SerieEjecutadaApi | null | undefined, b: SerieEjecutadaApi | null | undefined): boolean =>
  (a ?? null) === (b ?? null) ||
  (!!a &&
    !!b &&
    a.completedRepetitions === b.completedRepetitions &&
    a.rir === b.rir &&
    a.perceivedExertion === b.perceivedExertion &&
    (a.load?.value ?? null) === (b.load?.value ?? null) &&
    (a.load?.unit ?? null) === (b.load?.unit ?? null));

function registradaDe(
  condicion: Condicion | null,
  ejercicio: EjercicioRegistrado | null,
  numeroDeSerie: number,
): SerieRegistrada {
  if (condicion === null) return { tipo: 'sin-dato', motivo: 'vista-no-resoluble' };
  // La única omisión declarada que existe es la de la sesión entera.
  if (condicion === 'NOT_COMPLETED') return { tipo: 'no-realizada' };
  if (!ejercicio) return { tipo: 'sin-dato', motivo: 'ejercicio-no-registrado' };
  if (!ejercicio.sets) return { tipo: 'sin-dato', motivo: 'registro-resumido' };
  const serie = ejercicio.sets.find((s) => s.setIndex === numeroDeSerie);
  return serie ? { tipo: 'registrada', serie } : { tipo: 'sin-dato', motivo: 'serie-no-registrada' };
}

function identidadDe(p: Prescripcion, ejercicio: EjercicioRegistrado | null, versiones: IdentidadDeVersiones): { identidad: IdentidadDelRegistro; exerciseId: string | null } {
  if (!ejercicio) return { identidad: 'sin-registro', exerciseId: null };
  if (ejercicio.performedExerciseVersionId === p.exerciseVersionId) return { identidad: 'misma-version', exerciseId: p.exerciseId };
  const exerciseId = versiones.get(ejercicio.performedExerciseVersionId) ?? null;
  if (exerciseId === null) return { identidad: 'desconocida', exerciseId: null };
  return { identidad: exerciseId === p.exerciseId ? 'mismo-ejercicio' : 'otro-ejercicio', exerciseId };
}

/**
 * Cada prescripción de la sesión que rigió, en su orden, con sus filas: la unión de los números planificados y
 * registrados, ordenados y sin renumerar. Un número que falta en los dos no genera fila.
 *
 * `versiones` es la identidad de las versiones del período (`identidadDeVersiones`). Sin ella, se usa lo que dice esta
 * sola ejecución, y una versión que no esté prescripta acá queda como identidad desconocida.
 */
export function compararEjecucion(x: EjecucionDeEntrenamiento, versiones: IdentidadDeVersiones = identidadDeVersiones([x]), objetivos?: ObjetivosDeLaVersion): ComparacionDeEjercicio[] {
  const fuente = fuenteDe(x);
  const vigente = fuente.tipo === 'no-resoluble' ? null : registroVigente(x);
  const condicion = vigente?.sessionCondition ?? null;
  return [...x.plannedSession.prescriptions]
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      const ejercicio = vigente?.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null;
      const { identidad, exerciseId } = identidadDe(p, ejercicio, versiones);
      const enElOriginal = fuente.tipo === 'correccion' ? (x.original.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null) : undefined;
      const numeros = [...new Set([...p.sets.map((s) => s.setIndex), ...(ejercicio?.sets ?? []).map((s) => s.setIndex)])].sort((a, b) => a - b);
      const filas = numeros.map((n): FilaDeSerie => {
        const planificada = p.sets.find((s) => s.setIndex === n);
        const objetivo = objetivos?.get(p.prescriptionId)?.find((s) => s.setIndex === n);
        const registrada = registradaDe(condicion, ejercicio, n);
        const original = enElOriginal === undefined ? undefined : (enElOriginal?.sets?.find((s) => s.setIndex === n) ?? null);
        return {
          numero: n,
          planificada: planificada
            ? {
                tipo: 'planificada',
                repeticiones: planificada.repetitions,
                nota: planificada.note,
                ...(objetivo ? { objetivo: { rir: objetivo.target.rir, carga: objetivo.target.suggestedLoad, origenDelRir: objetivo.targetOrigin.rir, origenDeLaCarga: objetivo.targetOrigin.suggestedLoad } } : {}),
              }
            : { tipo: 'no-planificada' },
          registrada,
          enElOriginal: original,
          corregida: original !== undefined && !mismaSerie(registrada.tipo === 'registrada' ? registrada.serie : null, original),
        };
      });
      return {
        executionId: x.executionId,
        fecha: x.date,
        ocurrio: x.occurredAt,
        registradoEl: x.recordedAt,
        planId: x.planId,
        sesion: x.plannedSession.label,
        prescriptionId: p.prescriptionId,
        orden: p.order,
        prescripto: { exerciseId: p.exerciseId, exerciseVersionId: p.exerciseVersionId, nombre: p.exerciseName },
        realizado: ejercicio ? { exerciseVersionId: ejercicio.performedExerciseVersionId, exerciseId, nombre: ejercicio.performedExerciseName } : null,
        sustituido: ejercicio?.substituted ?? false,
        identidad,
        condicion,
        resumen: ejercicio?.executionSummary?.description ?? null,
        fuente,
        rirObjetivo: p.intensity?.criterion === 'RIR' ? p.intensity.target.value : null,
        porcentajeRm: p.intensity?.criterion === 'PERCENT_RM' ? { valor: p.intensity.target.value, referencia: p.intensity.target.reference?.description ?? null } : null,
        cargaSugerida: p.suggestedLoad,
        nota: p.note,
        prescripcion: p,
        filas,
      };
    });
}

// ─── Valores de una medida ──────────────────────────────────────────────────────────────────────

export type ValorPlanificado =
  /** Repeticiones de la serie, o el RIR objetivo o la carga sugerida de la prescripción (`sugerida`). */
  | { readonly tipo: 'valor'; readonly valor: number; readonly origen: 'serie' | 'prescripcion'; readonly sugerida: boolean }
  | { readonly tipo: 'rango'; readonly min: number; readonly max: number }
  | { readonly tipo: 'sin-fijar' }
  | { readonly tipo: 'porcentaje-rm'; readonly valor: number; readonly referencia: string | null }
  | { readonly tipo: 'otra-unidad'; readonly carga: Carga }
  | { readonly tipo: 'no-planificada' }
  /** En la evolución: la prescripción no tiene la serie elegida y tampoco se registró. No es «adicional». */
  | { readonly tipo: 'sin-serie' }
  /** En la evolución de un ejercicio registrado por sustitución: lo planificado era de otro ejercicio. */
  | { readonly tipo: 'otro-ejercicio'; readonly nombre: string }
  /** Como el anterior, pero no se sabe si lo planificado es el mismo ejercicio o uno distinto. */
  | { readonly tipo: 'identidad-desconocida'; readonly nombre: string };

export type ValorRegistrado =
  | { readonly tipo: 'valor'; readonly valor: number }
  | { readonly tipo: 'sin-dato'; readonly motivo: MotivoSinDato }
  | { readonly tipo: 'otra-unidad'; readonly carga: Carga }
  | { readonly tipo: 'no-realizada' };

/** Lo planificado de una fila para una medida. */
export function valorPlanificado(c: ComparacionDeEjercicio, fila: Pick<FilaDeSerie, 'planificada'>, medida: Medida): ValorPlanificado {
  if (fila.planificada.tipo === 'no-planificada') return { tipo: 'no-planificada' };
  if (medida.variable === 'repeticiones') {
    const r = fila.planificada.repeticiones;
    if (!r) return { tipo: 'sin-fijar' };
    return 'value' in r ? { tipo: 'valor', valor: r.value, origen: 'serie', sugerida: false } : { tipo: 'rango', min: r.min, max: r.max };
  }
  // DL-122: con el objetivo efectivo de la serie, el RIR y la carga son los de esa serie (heredados o propios).
  const objetivo = fila.planificada.objetivo;
  if (objetivo && medida.variable === 'rir') {
    return objetivo.rir === null ? { tipo: 'sin-fijar' } : { tipo: 'valor', valor: objetivo.rir, origen: objetivo.origenDelRir === 'SET' ? 'serie' : 'prescripcion', sugerida: false };
  }
  if (objetivo && medida.variable === 'carga') {
    if (objetivo.carga) {
      return objetivo.carga.unit === medida.unidad ? { tipo: 'valor', valor: objetivo.carga.value, origen: objetivo.origenDeLaCarga === 'SET' ? 'serie' : 'prescripcion', sugerida: true } : { tipo: 'otra-unidad', carga: objetivo.carga };
    }
    return c.porcentajeRm ? { tipo: 'porcentaje-rm', valor: c.porcentajeRm.valor, referencia: c.porcentajeRm.referencia } : { tipo: 'sin-fijar' };
  }
  if (medida.variable === 'rir') return c.rirObjetivo === null ? { tipo: 'sin-fijar' } : { tipo: 'valor', valor: c.rirObjetivo, origen: 'prescripcion', sugerida: false };
  if (c.cargaSugerida) {
    return c.cargaSugerida.unit === medida.unidad ? { tipo: 'valor', valor: c.cargaSugerida.value, origen: 'prescripcion', sugerida: true } : { tipo: 'otra-unidad', carga: c.cargaSugerida };
  }
  if (c.porcentajeRm) return { tipo: 'porcentaje-rm', valor: c.porcentajeRm.valor, referencia: c.porcentajeRm.referencia };
  return { tipo: 'sin-fijar' };
}

/** Lo registrado de una fila para una medida. Un campo que no se registró es sin dato, nunca cero. */
export function valorRegistrado(fila: Pick<FilaDeSerie, 'registrada'>, medida: Medida): ValorRegistrado {
  const r = fila.registrada;
  if (r.tipo !== 'registrada') return r;
  const s = r.serie;
  if (medida.variable === 'repeticiones') return s.completedRepetitions === null ? { tipo: 'sin-dato', motivo: 'campo-no-registrado' } : { tipo: 'valor', valor: s.completedRepetitions };
  if (medida.variable === 'rir') return s.rir === null ? { tipo: 'sin-dato', motivo: 'campo-no-registrado' } : { tipo: 'valor', valor: s.rir };
  if (!s.load) return { tipo: 'sin-dato', motivo: 'campo-no-registrado' };
  return s.load.unit === medida.unidad ? { tipo: 'valor', valor: s.load.value } : { tipo: 'otra-unidad', carga: s.load };
}

export type Diferencia =
  /** `respectoDeLaSugerida`: lo planificado es la carga sugerida, un complemento y no una obligación (09v10:391). */
  | { readonly tipo: 'igual'; readonly respectoDeLaSugerida: boolean }
  | { readonly tipo: 'distinta'; readonly delta: number; readonly respectoDeLaSugerida: boolean }
  | { readonly tipo: 'dentro-del-rango' }
  | { readonly tipo: 'bajo-el-rango'; readonly delta: number }
  | { readonly tipo: 'sobre-el-rango'; readonly delta: number };

/**
 * La diferencia entre lo registrado y lo planificado, en la unidad de la medida. Es un dato, no un juicio: no hay
 * «mejor» ni «peor». `null` cuando no hay dos valores comparables (sin dato, sin fijar, adicional, otra unidad, %RM u
 * otro ejercicio).
 */
export function diferencia(planificado: ValorPlanificado, registrado: ValorRegistrado): Diferencia | null {
  if (registrado.tipo !== 'valor') return null;
  const r = registrado.valor;
  if (planificado.tipo === 'valor') {
    const delta = Number((r - planificado.valor).toPrecision(12));
    const respectoDeLaSugerida = planificado.sugerida;
    return delta === 0 ? { tipo: 'igual', respectoDeLaSugerida } : { tipo: 'distinta', delta, respectoDeLaSugerida };
  }
  if (planificado.tipo === 'rango') {
    if (r < planificado.min) return { tipo: 'bajo-el-rango', delta: r - planificado.min };
    if (r > planificado.max) return { tipo: 'sobre-el-rango', delta: r - planificado.max };
    return { tipo: 'dentro-del-rango' };
  }
  return null;
}

export interface SerieParaGraficar {
  readonly numero: number;
  readonly fila: FilaDeSerie;
  readonly planificado: ValorPlanificado;
  readonly registrado: ValorRegistrado;
  readonly diferencia: Diferencia | null;
  /** Qué se sabe de lo registrado: con otro ejercicio o una identidad desconocida, el rótulo dice por qué no se compara. */
  readonly identidad: IdentidadDelRegistro;
}

/**
 * Las series de una prescripción para una medida: lo que dibuja el gráfico de barras agrupadas y lo que lista la tabla.
 * La diferencia se calcula solo si se sabe que lo registrado es el mismo ejercicio (`identidad`), con el mismo criterio
 * que la evolución: otra versión del mismo ejercicio se compara; otro ejercicio o una identidad desconocida, no.
 */
export function seriesParaGraficar(c: ComparacionDeEjercicio, medida: Medida): SerieParaGraficar[] {
  return c.filas.map((fila) => {
    const planificado = valorPlanificado(c, fila, medida);
    const registrado = valorRegistrado(fila, medida);
    const comparable = c.identidad === 'sin-registro' || esElMismoEjercicio(c.identidad);
    return { numero: fila.numero, fila, planificado, registrado, diferencia: comparable ? diferencia(planificado, registrado) : null, identidad: c.identidad };
  });
}

/** Lo que aporta cada lado de una comparación a las medidas: lo planificado, lo registrado, o los dos. */
function medidasDe(partes: readonly { readonly c: ComparacionDeEjercicio; readonly plan: boolean; readonly registro: boolean }[]): Medida[] {
  const unidades = new Set<'kg' | 'lb'>();
  let rir = false;
  for (const { c, plan, registro } of partes) {
    if (plan && c.cargaSugerida) unidades.add(c.cargaSugerida.unit);
    if (plan && c.rirObjetivo !== null) rir = true;
    if (!registro) continue;
    for (const f of c.filas) {
      if (f.registrada.tipo !== 'registrada') continue;
      if (f.registrada.serie.load) unidades.add(f.registrada.serie.load.unit);
      if (f.registrada.serie.rir !== null) rir = true;
    }
  }
  return [
    { variable: 'repeticiones' },
    ...(['kg', 'lb'] as const).filter((u) => unidades.has(u)).map((unidad): Medida => ({ variable: 'carga', unidad })),
    ...(rir ? [{ variable: 'rir' } as const] : []),
  ];
}

/** Las medidas que tienen algún dato, planificado o registrado, en estas comparaciones: repeticiones, carga por unidad y RIR. */
export function medidasDisponibles(comparaciones: readonly ComparacionDeEjercicio[]): Medida[] {
  return medidasDe(comparaciones.map((c) => ({ c, plan: true, registro: true })));
}

export const claveDeMedida = (m: Medida): string => (m.variable === 'carga' ? `carga-${m.unidad}` : m.variable);

// ─── Evolución de un ejercicio ──────────────────────────────────────────────────────────────────

export interface EjercicioComparable {
  /** `e:<exerciseId>`, o `v:<versionId>` para un realizado por sustitución cuyo ejercicio no se conoce en el período. */
  readonly clave: string;
  /** El nombre más reciente con el que aparece. */
  readonly nombre: string;
  /** Otros nombres con los que aparece en el período (una versión anterior del catálogo). */
  readonly otrosNombres: readonly string[];
  /**
   * Hay otra entrada con el mismo nombre que no se puede identificar como el mismo ejercicio: otro ejercicio del catálogo,
   * o una versión realizada por sustitución que no está prescripta en el período. La pantalla las lista por separado.
   */
  readonly homonimo: boolean;
}

const claveDelPrescripto = (c: ComparacionDeEjercicio): string => `e:${c.prescripto.exerciseId}`;
/** La clave del ejercicio registrado, según su identidad: la del prescripto, la de otro ejercicio, o la de su versión. */
function claveDelRealizado(c: ComparacionDeEjercicio): string | null {
  if (!c.realizado) return null;
  if (esElMismoEjercicio(c.identidad)) return claveDelPrescripto(c);
  if (c.identidad === 'otro-ejercicio' && c.realizado.exerciseId) return `e:${c.realizado.exerciseId}`;
  return `v:${c.realizado.exerciseVersionId}`;
}

/** Los ejercicios del período, planificados o realizados por sustitución, por identidad; ordenados por nombre. */
export function ejerciciosComparables(ejecuciones: readonly EjecucionDeEntrenamiento[]): EjercicioComparable[] {
  const versiones = identidadDeVersiones(ejecuciones);
  const nombres = new Map<string, string[]>();
  const anotar = (clave: string, nombre: string) => {
    const lista = nombres.get(clave) ?? [];
    lista.push(nombre);
    nombres.set(clave, lista);
  };
  for (const x of [...ejecuciones].sort(porOcurrencia)) {
    for (const c of compararEjecucion(x, versiones)) {
      anotar(claveDelPrescripto(c), c.prescripto.nombre);
      // Otra versión del mismo ejercicio suma su nombre al del ejercicio; otro ejercicio o uno sin identificar, su entrada.
      const realizado = claveDelRealizado(c);
      if (realizado && c.realizado && c.identidad !== 'misma-version') anotar(realizado, c.realizado.nombre);
    }
  }
  const lista = [...nombres].map(([clave, vistos]) => {
    const nombre = vistos[vistos.length - 1] as string;
    return { clave, nombre, otrosNombres: [...new Set(vistos)].filter((n) => n !== nombre) };
  });
  return lista
    .map((e) => ({ ...e, homonimo: lista.some((o) => o.clave !== e.clave && o.nombre === e.nombre) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || a.clave.localeCompare(b.clave));
}

/**
 * - `planificado-y-registrado`: se prescribió este ejercicio y lo registrado es de este ejercicio, en la misma versión o
 *   en otra (o no hay registro);
 * - `sustituido`: se prescribió este ejercicio, pero se registró otro: lo planificado vale, lo registrado no es de él;
 * - `por-sustitucion`: se registró este ejercicio en lugar de otro: lo registrado vale, lo planificado era de otro;
 * - `registrado-sin-identidad`: se prescribió este ejercicio y se registró una versión que no se puede identificar: lo
 *   planificado vale, y de lo registrado no se sabe si es este ejercicio;
 * - `planificado-sin-identidad`: esta entrada es una versión registrada sin identificar: lo registrado vale, y de lo
 *   planificado no se sabe si era el mismo ejercicio.
 */
export type RolDeLaObservacion = 'planificado-y-registrado' | 'sustituido' | 'por-sustitucion' | 'registrado-sin-identidad' | 'planificado-sin-identidad';

/** Lo planificado de la observación es de este ejercicio. */
const elPlanEsDelEjercicio = (rol: RolDeLaObservacion): boolean => rol === 'planificado-y-registrado' || rol === 'sustituido' || rol === 'registrado-sin-identidad';
/** Lo registrado de la observación es de este ejercicio. */
const elRegistroEsDelEjercicio = (rol: RolDeLaObservacion): boolean => rol === 'planificado-y-registrado' || rol === 'por-sustitucion' || rol === 'planificado-sin-identidad';

/**
 * La unidad de observación de la evolución: **una prescripción de una ejecución registrada** en la que aparece el
 * ejercicio. Dos ejecuciones del mismo día son dos observaciones; la misma sesión nunca se funde con otra.
 */
export interface ObservacionDeEvolucion {
  readonly clave: string;
  readonly rol: RolDeLaObservacion;
  readonly comparacion: ComparacionDeEjercicio;
  /** Posición entre las observaciones de la misma fecha: «2 de 3». */
  readonly delDia: { readonly orden: number; readonly total: number };
}

/**
 * Las observaciones del ejercicio, en el orden en que ocurrieron las sesiones. `periodo` son todas las ejecuciones del
 * período: de ahí sale a qué ejercicio pertenece cada versión, así un filtro (por ejemplo, por versión del plan) no cambia
 * a qué ejercicio se atribuye una sustitución.
 */
export function observacionesDelEjercicio(
  ejecuciones: readonly EjecucionDeEntrenamiento[],
  claveDelEjercicio: string,
  periodo: readonly EjecucionDeEntrenamiento[] = ejecuciones,
  /** DL-122: los objetivos por serie de cada versión del período, por `planId`. */
  objetivosPorVersion?: ReadonlyMap<string, ObjetivosDeLaVersion>,
): ObservacionDeEvolucion[] {
  const versiones = identidadDeVersiones(periodo);
  const sinDia: Omit<ObservacionDeEvolucion, 'delDia'>[] = [];
  for (const x of [...ejecuciones].sort(porOcurrencia)) {
    // La misma identidad que usa la vista por serie: la de todo el período.
    for (const c of compararEjecucion(x, versiones, objetivosPorVersion?.get(x.planId))) {
      const clave = `${c.executionId}|${c.prescriptionId}`;
      if (claveDelPrescripto(c) === claveDelEjercicio) {
        const rol = c.identidad === 'otro-ejercicio' ? 'sustituido' : c.identidad === 'desconocida' ? 'registrado-sin-identidad' : 'planificado-y-registrado';
        sinDia.push({ clave, rol, comparacion: c });
      } else if (claveDelRealizado(c) === claveDelEjercicio) {
        sinDia.push({ clave, rol: c.identidad === 'desconocida' ? 'planificado-sin-identidad' : 'por-sustitucion', comparacion: c });
      }
    }
  }
  return sinDia.map((o) => {
    const mismoDia = sinDia.filter((y) => y.comparacion.fecha === o.comparacion.fecha);
    return { ...o, delDia: { orden: mismoDia.indexOf(o) + 1, total: mismoDia.length } };
  });
}

/**
 * Los números de serie de este ejercicio en estas observaciones: los planificados de sus prescripciones y los registrados
 * de sus registros. Una serie que solo tiene el registro de otro ejercicio (o de uno sin identificar) no es de este.
 */
export function numerosDeSerie(observaciones: readonly ObservacionDeEvolucion[]): number[] {
  const numeros = observaciones.flatMap((o) =>
    o.comparacion.filas
      .filter(
        (f) =>
          o.rol === 'planificado-y-registrado' ||
          (elPlanEsDelEjercicio(o.rol) && f.planificada.tipo === 'planificada') ||
          (elRegistroEsDelEjercicio(o.rol) && f.registrada.tipo === 'registrada'),
      )
      .map((f) => f.numero),
  );
  return [...new Set(numeros)].sort((a, b) => a - b);
}

/** Las medidas de la evolución, con el mismo criterio: de cada observación, solo el lado que es de este ejercicio. */
export function medidasDeLaEvolucion(observaciones: readonly ObservacionDeEvolucion[]): Medida[] {
  return medidasDe(observaciones.map((o) => ({ c: o.comparacion, plan: elPlanEsDelEjercicio(o.rol), registro: elRegistroEsDelEjercicio(o.rol) })));
}

export interface PuntoDeEvolucion {
  readonly indice: number;
  readonly observacion: ObservacionDeEvolucion;
  /** La fila del número elegido; `null` si ese número no está ni planificado ni registrado en esta observación. */
  readonly fila: FilaDeSerie | null;
  readonly planificado: ValorPlanificado;
  readonly registrado: ValorRegistrado;
  readonly diferencia: Diferencia | null;
  /**
   * Tramo de la línea de cada capa. Dos puntos seguidos se unen solo si están en el mismo tramo; `null` si el punto no
   * tiene valor en esa capa. Lo registrado se corta en cada punto sin valor; lo planificado, además, cuando cambia la
   * prescripción (otra versión del plan u otra sesión) o el valor es un rango, que se dibuja como franja.
   */
  readonly tramoPlanificado: number | null;
  readonly tramoRegistrado: number | null;
}

/**
 * La evolución de una serie elegida (por su número) para una medida. Nunca se promedian, suman ni eligen máximos entre
 * series: cada punto es la serie de ese número en una observación.
 */
export function evolucion(observaciones: readonly ObservacionDeEvolucion[], medida: Medida, numeroDeSerie: number): PuntoDeEvolucion[] {
  const puntos: PuntoDeEvolucion[] = [];
  let tramo = 0;
  for (const [indice, o] of observaciones.entries()) {
    const c = o.comparacion;
    const fila = c.filas.find((f) => f.numero === numeroDeSerie) ?? null;
    // Sin fila, la serie no estaba planificada ni se registró: no es «adicional», y la declaración «no realizada» de la
    // sesión no la abarca (solo cubre lo planificado).
    const base: Pick<FilaDeSerie, 'planificada' | 'registrada'> = fila ?? {
      planificada: { tipo: 'no-planificada' },
      registrada: c.condicion === 'NOT_COMPLETED' ? { tipo: 'sin-dato', motivo: 'serie-no-registrada' } : sinDatoDeLaSerie(c),
    };
    // Una serie que existe solo en el registro de otro ejercicio (o de uno sin identificar) no es «adicional» de este:
    // la prescripción de este ejercicio no la tiene.
    const soloDeOtroRegistro = fila?.planificada.tipo === 'no-planificada' && !elRegistroEsDelEjercicio(o.rol);
    const planificado: ValorPlanificado =
      o.rol === 'por-sustitucion'
        ? { tipo: 'otro-ejercicio', nombre: c.prescripto.nombre }
        : o.rol === 'planificado-sin-identidad'
          ? { tipo: 'identidad-desconocida', nombre: c.prescripto.nombre }
          : fila && !soloDeOtroRegistro
            ? valorPlanificado(c, base, medida)
            : { tipo: 'sin-serie' };
    const registrado: ValorRegistrado =
      o.rol === 'sustituido'
        ? { tipo: 'sin-dato', motivo: 'otro-ejercicio' }
        : o.rol === 'registrado-sin-identidad'
          ? { tipo: 'sin-dato', motivo: 'identidad-desconocida' }
          : valorRegistrado(base, medida);
    const anterior = puntos[puntos.length - 1];
    const tramoRegistrado = registrado.tipo !== 'valor' ? null : anterior?.tramoRegistrado != null ? anterior.tramoRegistrado : ++tramo;
    // Lo planificado se une solo entre ocurrencias de la misma prescripción de la misma versión: es la línea de una
    // prescripción en el tiempo. Otra versión u otra sesión con el mismo ejercicio es otra prescripción, y se corta.
    const continuaPlan =
      planificado.tipo === 'valor' &&
      anterior?.tramoPlanificado != null &&
      anterior.observacion.comparacion.planId === c.planId &&
      anterior.observacion.comparacion.prescriptionId === c.prescriptionId &&
      anterior.planificado.tipo === 'valor' &&
      anterior.planificado.origen === planificado.origen;
    const tramoPlanificado = planificado.tipo !== 'valor' ? null : continuaPlan ? (anterior!.tramoPlanificado as number) : ++tramo;
    puntos.push({
      indice,
      observacion: o,
      fila,
      planificado,
      registrado,
      diferencia: o.rol === 'planificado-y-registrado' ? diferencia(planificado, registrado) : null,
      tramoPlanificado,
      tramoRegistrado,
    });
  }
  return puntos;
}

function sinDatoDeLaSerie(c: ComparacionDeEjercicio): SerieRegistrada {
  if (c.condicion === null) return { tipo: 'sin-dato', motivo: 'vista-no-resoluble' };
  if (!c.realizado) return { tipo: 'sin-dato', motivo: 'ejercicio-no-registrado' };
  if (c.resumen !== null) return { tipo: 'sin-dato', motivo: 'registro-resumido' };
  return { tipo: 'sin-dato', motivo: 'serie-no-registrada' };
}

// ─── Textos ─────────────────────────────────────────────────────────────────────────────────────

export const COPY_COMPARACION = {
  titulo: 'Planificado y registrado',
  porSerie: 'Planificado y registrado, serie por serie',
  evolucion: 'Evolución de un ejercicio',
  capaPlanificado: 'Planificado',
  capaRegistrado: 'Registrado',
  capas: 'Capas',
  medida: 'Variable',
  serieElegida: 'Serie',
  ejercicio: 'Ejercicio',
  elegiUnEjercicio: 'Elegí un ejercicio para ver cómo se compara lo planificado con lo registrado en el período.',
  sinObservaciones: 'Este ejercicio no aparece en las sesiones registradas del período.',
  sinObservacionesEnLaVersion: 'Este ejercicio no aparece en las sesiones registradas de la versión del plan elegida: está en otra versión del período.',
  soloRegistradas: 'Solo sesiones registradas: los borradores y las sesiones que todavía no ocurrieron no aparecen.',
  unidadDeObservacion:
    'Cada punto es una sesión registrada en la que aparece el ejercicio, en el orden en que ocurrió; la distancia entre puntos no es proporcional al tiempo. Se compara la serie del número elegido: las series no se promedian ni se suman.',
  comparaConSuPrescripcion: 'Cada sesión se compara con la prescripción de la versión del plan que rigió ese día, no con la vigente hoy.',
  lineasSeCortan: 'Las líneas se cortan donde no hay dato. Lo planificado, además, se corta cuando cambia la prescripción: otra versión del plan u otra sesión.',
  ausenciaNoEsCero: 'Sin dato no es cero ni «no realizada»: no hay registro de esa serie.',
  sinDeclaracionPorSerie: 'Una serie que falta no se puede declarar como no realizada: se muestra sin dato.',
  sugeridaNoEsObligacion: 'La carga sugerida es un complemento de la prescripción, no una obligación.',
  rmNoSeConvierte: 'Un % RM no se convierte a kg: no hay una base registrada para hacerlo.',
  rirDeLaPrescripcion: 'El RIR planificado es el objetivo de la prescripción y rige para todas sus series.',
  sinFijar: 'Sin fijar',
  noPlanificada: 'Adicional: sin prescripción para esta serie',
  noPlanificadaCorto: 'adicional',
  sinSerieEnLaPrescripcion: 'La prescripción no tiene esta serie',
  otroEjercicioPlanificado: 'Se planificó otro ejercicio',
  noRealizada: 'No realizada: la sesión se registró así',
  noRealizadaCorto: 'no realizada',
  sinDato: 'Sin dato',
  sugerida: 'sugerida',
  igual: 'igual a lo planificado',
  dentroDelRango: 'dentro del rango',
  diferencia: 'Diferencia',
  verLaEjecucion: 'Abrir la ejecución',
  valoresExactos: 'Valores de la serie',
  registroOriginal: 'Registro original',
  correccionVigente: 'Corrección vigente',
  enElOriginal: 'En el registro original',
  noEstabaEnElOriginal: 'No estaba en el registro original',
  vistaNoResoluble: 'El registro vigente de esta sesión no se puede determinar: lo registrado no se grafica.',
  sustitucion: 'Se registró otro ejercicio en lugar del planificado: se muestran los dos, pero no se calcula la diferencia entre ejercicios distintos.',
  otraVersionDelMismo: 'El registro indica una sustitución de versión, pero las dos versiones son del mismo ejercicio del catálogo: se compara como el mismo ejercicio.',
  identidadSinResolver:
    'El registro indica una sustitución, y con las sesiones del período no se puede saber si lo registrado es el mismo ejercicio o uno distinto: se muestran los dos, sin calcular la diferencia.',
  noSeSabeSiEsElMismo: 'no se puede saber si es el mismo ejercicio',
  tablaEquivalente: 'Tabla de valores',
  tablaMuestraAmbas: 'La tabla muestra siempre las dos capas, con los mismos valores del gráfico.',
  capaOculta: 'Las dos capas están ocultas. Activá al menos una para ver el gráfico; la tabla sigue abajo.',
  /** Solo cuando de verdad hay grupos fuera del marco: cuántos y de qué tipo, sin afirmar de más. */
  fueraDeLaVista: (cantidad: number, tipo: 'series' | 'sesiones'): string =>
    `${numero(cantidad)} ${cantidad === 1 ? SINGULAR[tipo] : tipo} ${cantidad === 1 ? 'queda' : 'quedan'} fuera de la vista: desplazá el gráfico o recorrelo con las flechas. La tabla tiene todas.`,
  sinSeries: 'Esta prescripción no tiene series planificadas ni registradas.',
} as const;

const SINGULAR = { series: 'serie', sesiones: 'sesión' } as const;

const MOTIVO: Readonly<Record<Exclude<MotivoSinDato, 'campo-no-registrado'>, string>> = {
  'serie-no-registrada': 'Sin dato: la serie no está en el registro',
  'ejercicio-no-registrado': 'Sin dato: el ejercicio no está en el registro',
  'registro-resumido': 'Sin dato por serie: se registró un resumen',
  'vista-no-resoluble': 'Sin dato: el registro vigente no se puede determinar',
  'otro-ejercicio': 'Se registró otro ejercicio',
  'identidad-desconocida': 'Se registró una versión que no se puede identificar: no se sabe si es este ejercicio',
};

const NO_REGISTRADO: Readonly<Record<Medida['variable'], string>> = {
  repeticiones: 'Sin dato: repeticiones no registradas',
  carga: 'Sin dato: carga no registrada',
  rir: 'Sin dato: RIR no registrado',
};

export function etiquetaDeMedida(m: Medida): string {
  if (m.variable === 'repeticiones') return 'Repeticiones';
  if (m.variable === 'rir') return 'RIR';
  return `Carga (${m.unidad})`;
}

/** La unidad del eje: «reps», «kg», «lb» o «RIR». */
export function unidadDeMedida(m: Medida): string {
  if (m.variable === 'repeticiones') return 'reps';
  if (m.variable === 'rir') return 'RIR';
  return m.unidad;
}

const conUnidad = (valor: number, m: Medida): string => (m.variable === 'carga' ? cantidad(valor, m.unidad) : m.variable === 'rir' ? `RIR ${numero(valor)}` : numero(valor));

/** Lo planificado en palabras, tal como se prescribió: «10», «6-8», «60 kg (sugerida)», «75 % RM». */
export function textoPlanificado(v: ValorPlanificado, m: Medida): string {
  switch (v.tipo) {
    case 'valor':
      return v.sugerida ? `${conUnidad(v.valor, m)} (${COPY_COMPARACION.sugerida})` : conUnidad(v.valor, m);
    case 'rango':
      return `${numero(v.min)}-${numero(v.max)}`;
    case 'sin-fijar':
      return COPY_COMPARACION.sinFijar;
    case 'porcentaje-rm':
      return `${numero(v.valor)} % RM${v.referencia ? ` (${v.referencia})` : ''}`;
    case 'otra-unidad':
      return `${cantidad(v.carga.value, v.carga.unit)} (${COPY_COMPARACION.sugerida}, otra unidad)`;
    case 'no-planificada':
      return COPY_COMPARACION.noPlanificada;
    case 'sin-serie':
      return COPY_COMPARACION.sinSerieEnLaPrescripcion;
    case 'otro-ejercicio':
      return `${COPY_COMPARACION.otroEjercicioPlanificado}: ${v.nombre}`;
    case 'identidad-desconocida':
      return `Se planificó ${v.nombre}: ${COPY_COMPARACION.noSeSabeSiEsElMismo}`;
  }
}

/** Lo registrado en palabras: el valor, o por qué no lo hay. */
export function textoRegistrado(v: ValorRegistrado, m: Medida): string {
  switch (v.tipo) {
    case 'valor':
      return conUnidad(v.valor, m);
    case 'otra-unidad':
      return `${cantidad(v.carga.value, v.carga.unit)} (otra unidad)`;
    case 'no-realizada':
      return COPY_COMPARACION.noRealizada;
    case 'sin-dato':
      return v.motivo === 'campo-no-registrado' ? NO_REGISTRADO[m.variable] : MOTIVO[v.motivo];
  }
}

const conSigno = (delta: number, m: Medida): string => {
  const texto = m.variable === 'carga' ? cantidad(Math.abs(delta), m.unidad) : numero(Math.abs(delta));
  return `${delta < 0 ? '−' : '+'}${texto}`;
};

/** La diferencia corta, para el gráfico: «−1», «igual», «dentro del rango», «−1 del mínimo», «+2 del máximo». */
export function textoDeDiferencia(d: Diferencia, m: Medida): string {
  switch (d.tipo) {
    case 'igual':
      return d.respectoDeLaSugerida ? 'igual a la sugerida' : 'igual';
    case 'distinta':
      return d.respectoDeLaSugerida ? `${conSigno(d.delta, m)} respecto de la sugerida` : conSigno(d.delta, m);
    case 'dentro-del-rango':
      return COPY_COMPARACION.dentroDelRango;
    case 'bajo-el-rango':
      return `${conSigno(d.delta, m)} del mínimo`;
    case 'sobre-el-rango':
      return `${conSigno(d.delta, m)} del máximo`;
  }
}

/**
 * El rótulo corto de una serie o un punto, debajo del eje: la diferencia («−1», «igual», «en rango», «−1 mín.») o, si no
 * hay dos valores comparables, qué pasa con lo registrado («sin dato», «no realizada», «adicional», «en lb»). Así el
 * estado se lee en el gráfico sin depender del color ni del puntero.
 */
export function rotuloCorto(
  p: { readonly planificado: ValorPlanificado; readonly registrado: ValorRegistrado; readonly diferencia: Diferencia | null; readonly identidad?: IdentidadDelRegistro },
  m: Medida,
): string {
  const d = p.diferencia;
  if (d) {
    if (d.tipo === 'igual') return d.respectoDeLaSugerida ? 'igual sug.' : 'igual';
    if (d.tipo === 'distinta') return d.respectoDeLaSugerida ? `${conSigno(d.delta, m)} sug.` : conSigno(d.delta, m);
    if (d.tipo === 'dentro-del-rango') return 'en rango';
    return `${conSigno(d.delta, m)} ${d.tipo === 'bajo-el-rango' ? 'mín.' : 'máx.'}`;
  }
  if (p.planificado.tipo === 'sin-serie') return 'sin serie';
  if (p.planificado.tipo === 'identidad-desconocida') return 'sin identificar';
  if (p.planificado.tipo === 'otro-ejercicio') return 'por sustitución';
  if (p.registrado.tipo === 'valor' && p.identidad === 'otro-ejercicio') return 'otro ejercicio';
  if (p.registrado.tipo === 'valor' && p.identidad === 'desconocida') return 'sin identificar';
  const r = p.registrado;
  if (r.tipo === 'no-realizada') return COPY_COMPARACION.noRealizadaCorto;
  if (r.tipo === 'otra-unidad') return `en ${r.carga.unit}`;
  if (r.tipo === 'sin-dato') return r.motivo === 'otro-ejercicio' ? 'otro ejercicio' : r.motivo === 'identidad-desconocida' ? 'sin identificar' : COPY_COMPARACION.sinDato.toLowerCase();
  if (p.planificado.tipo === 'no-planificada') return COPY_COMPARACION.noPlanificadaCorto;
  return '';
}

/** La diferencia en palabras, para el lector de pantalla y la tabla: «1 repetición menos que lo planificado». */
export function diferenciaEnPalabras(d: Diferencia, m: Medida): string {
  if (d.tipo === 'igual') return d.respectoDeLaSugerida ? 'igual a la carga sugerida' : COPY_COMPARACION.igual;
  if (d.tipo === 'dentro-del-rango') return COPY_COMPARACION.dentroDelRango;
  const n = Math.abs(d.delta);
  const cuanto =
    m.variable === 'carga' ? cantidad(n, m.unidad) : m.variable === 'rir' ? `${numero(n)} de RIR` : `${numero(n)} ${n === 1 ? 'repetición' : 'repeticiones'}`;
  const sentido = d.delta < 0 ? 'menos' : 'más';
  const referencia =
    d.tipo === 'distinta' ? (d.respectoDeLaSugerida ? 'que la carga sugerida' : 'que lo planificado') : d.tipo === 'bajo-el-rango' ? 'que el mínimo del rango' : 'que el máximo del rango';
  return `${cuanto} ${sentido} ${referencia}`;
}
