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
 * nombre: dos ejercicios distintos con el mismo nombre quedan separados. El ejercicio realizado en una sustitución se
 * identifica por su versión; si esa versión aparece prescripta en el período, se sabe a qué ejercicio pertenece.
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
  | 'campo-no-registrado';

export type SeriePlanificada = { readonly tipo: 'planificada'; readonly repeticiones: Repeticiones | null; readonly nota: string | null } | { readonly tipo: 'no-planificada' };

export type SerieRegistrada =
  | { readonly tipo: 'registrada'; readonly serie: SerieEjecutadaApi }
  | { readonly tipo: 'sin-dato'; readonly motivo: Exclude<MotivoSinDato, 'campo-no-registrado' | 'otro-ejercicio'> }
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
  /** `null` si el registro vigente no incluye esta prescripción. */
  readonly realizado: { readonly exerciseVersionId: string; readonly nombre: string } | null;
  readonly sustituido: boolean;
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

/**
 * Cada prescripción de la sesión que rigió, en su orden, con sus filas: la unión de los números planificados y
 * registrados, ordenados y sin renumerar. Un número que falta en los dos no genera fila.
 */
export function compararEjecucion(x: EjecucionDeEntrenamiento): ComparacionDeEjercicio[] {
  const fuente = fuenteDe(x);
  const vigente = fuente.tipo === 'no-resoluble' ? null : registroVigente(x);
  const condicion = vigente?.sessionCondition ?? null;
  return [...x.plannedSession.prescriptions]
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      const ejercicio = vigente?.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null;
      const enElOriginal = fuente.tipo === 'correccion' ? (x.original.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null) : undefined;
      const numeros = [...new Set([...p.sets.map((s) => s.setIndex), ...(ejercicio?.sets ?? []).map((s) => s.setIndex)])].sort((a, b) => a - b);
      const filas = numeros.map((n): FilaDeSerie => {
        const planificada = p.sets.find((s) => s.setIndex === n);
        const registrada = registradaDe(condicion, ejercicio, n);
        const original = enElOriginal === undefined ? undefined : (enElOriginal?.sets?.find((s) => s.setIndex === n) ?? null);
        return {
          numero: n,
          planificada: planificada ? { tipo: 'planificada', repeticiones: planificada.repetitions, nota: planificada.note } : { tipo: 'no-planificada' },
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
        realizado: ejercicio ? { exerciseVersionId: ejercicio.performedExerciseVersionId, nombre: ejercicio.performedExerciseName } : null,
        sustituido: ejercicio?.substituted ?? false,
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
  | { readonly tipo: 'otro-ejercicio'; readonly nombre: string };

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
  | { readonly tipo: 'igual' }
  | { readonly tipo: 'distinta'; readonly delta: number }
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
    return delta === 0 ? { tipo: 'igual' } : { tipo: 'distinta', delta };
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
}

/**
 * Las series de una prescripción para una medida: lo que dibuja el gráfico de barras agrupadas y lo que lista la tabla.
 * En una sustitución no se calcula la diferencia: lo registrado es de otro ejercicio.
 */
export function seriesParaGraficar(c: ComparacionDeEjercicio, medida: Medida): SerieParaGraficar[] {
  return c.filas.map((fila) => {
    const planificado = valorPlanificado(c, fila, medida);
    const registrado = valorRegistrado(fila, medida);
    return { numero: fila.numero, fila, planificado, registrado, diferencia: c.sustituido ? null : diferencia(planificado, registrado) };
  });
}

/** Las medidas que tienen algún dato, planificado o registrado, en estas comparaciones: repeticiones, carga por unidad y RIR. */
export function medidasDisponibles(comparaciones: readonly ComparacionDeEjercicio[]): Medida[] {
  const unidades = new Set<'kg' | 'lb'>();
  let rir = false;
  for (const c of comparaciones) {
    if (c.cargaSugerida) unidades.add(c.cargaSugerida.unit);
    if (c.rirObjetivo !== null) rir = true;
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

export const claveDeMedida = (m: Medida): string => (m.variable === 'carga' ? `carga-${m.unidad}` : m.variable);

// ─── Evolución de un ejercicio ──────────────────────────────────────────────────────────────────

export interface EjercicioComparable {
  /** `e:<exerciseId>`, o `v:<versionId>` para un realizado por sustitución cuyo ejercicio no se conoce en el período. */
  readonly clave: string;
  /** El nombre más reciente con el que aparece. */
  readonly nombre: string;
  /** Otros nombres con los que aparece en el período (una versión anterior del catálogo). */
  readonly otrosNombres: readonly string[];
  /** Hay otro ejercicio distinto con el mismo nombre: la pantalla los distingue. */
  readonly homonimo: boolean;
}

/** Versión de ejercicio → ejercicio, con lo que dicen las prescripciones del período. */
function ejercicioPorVersion(ejecuciones: readonly EjecucionDeEntrenamiento[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const x of ejecuciones) for (const p of x.plannedSession.prescriptions) m.set(p.exerciseVersionId, p.exerciseId);
  return m;
}

const claveDelPrescripto = (c: ComparacionDeEjercicio): string => `e:${c.prescripto.exerciseId}`;
function claveDelRealizado(c: ComparacionDeEjercicio, porVersion: Map<string, string>): string | null {
  if (!c.realizado) return null;
  if (!c.sustituido) return claveDelPrescripto(c);
  const id = porVersion.get(c.realizado.exerciseVersionId);
  return id ? `e:${id}` : `v:${c.realizado.exerciseVersionId}`;
}

/** Los ejercicios del período, planificados o realizados por sustitución, por identidad; ordenados por nombre. */
export function ejerciciosComparables(ejecuciones: readonly EjecucionDeEntrenamiento[]): EjercicioComparable[] {
  const porVersion = ejercicioPorVersion(ejecuciones);
  const nombres = new Map<string, string[]>();
  const anotar = (clave: string, nombre: string) => {
    const lista = nombres.get(clave) ?? [];
    lista.push(nombre);
    nombres.set(clave, lista);
  };
  for (const x of [...ejecuciones].sort(porOcurrencia)) {
    for (const c of compararEjecucion(x)) {
      anotar(claveDelPrescripto(c), c.prescripto.nombre);
      const realizado = claveDelRealizado(c, porVersion);
      if (realizado && c.sustituido && c.realizado) anotar(realizado, c.realizado.nombre);
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
 * - `planificado-y-registrado`: se prescribió este ejercicio y lo registrado es de este ejercicio (o no hay registro);
 * - `sustituido`: se prescribió este ejercicio, pero se registró otro: lo planificado vale, lo registrado no es de él;
 * - `por-sustitucion`: se registró este ejercicio en lugar de otro: lo registrado vale, lo planificado era de otro.
 */
export type RolDeLaObservacion = 'planificado-y-registrado' | 'sustituido' | 'por-sustitucion';

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

/** Las observaciones del ejercicio, en el orden en que ocurrieron las sesiones. */
export function observacionesDelEjercicio(ejecuciones: readonly EjecucionDeEntrenamiento[], claveDelEjercicio: string): ObservacionDeEvolucion[] {
  const porVersion = ejercicioPorVersion(ejecuciones);
  const sinDia: Omit<ObservacionDeEvolucion, 'delDia'>[] = [];
  for (const x of [...ejecuciones].sort(porOcurrencia)) {
    for (const c of compararEjecucion(x)) {
      const clave = `${c.executionId}|${c.prescriptionId}`;
      if (claveDelPrescripto(c) === claveDelEjercicio) sinDia.push({ clave, rol: c.sustituido ? 'sustituido' : 'planificado-y-registrado', comparacion: c });
      else if (c.sustituido && claveDelRealizado(c, porVersion) === claveDelEjercicio) sinDia.push({ clave, rol: 'por-sustitucion', comparacion: c });
    }
  }
  return sinDia.map((o) => {
    const mismoDia = sinDia.filter((y) => y.comparacion.fecha === o.comparacion.fecha);
    return { ...o, delDia: { orden: mismoDia.indexOf(o) + 1, total: mismoDia.length } };
  });
}

/** Los números de serie que aparecen, planificados o registrados, en estas observaciones. */
export function numerosDeSerie(observaciones: readonly ObservacionDeEvolucion[]): number[] {
  return [...new Set(observaciones.flatMap((o) => o.comparacion.filas.map((f) => f.numero)))].sort((a, b) => a - b);
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
    const base: Pick<FilaDeSerie, 'planificada' | 'registrada'> = fila ?? {
      planificada: { tipo: 'no-planificada' },
      registrada: c.condicion === 'NOT_COMPLETED' ? { tipo: 'no-realizada' } : sinDatoDeLaSerie(c),
    };
    const planificado: ValorPlanificado = o.rol === 'por-sustitucion' ? { tipo: 'otro-ejercicio', nombre: c.prescripto.nombre } : valorPlanificado(c, base, medida);
    const registrado: ValorRegistrado = o.rol === 'sustituido' ? { tipo: 'sin-dato', motivo: 'otro-ejercicio' } : valorRegistrado(base, medida);
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
  vistaNoResoluble: 'El registro vigente de esta sesión no se puede determinar: no se grafica.',
  sustitucion: 'Se registró otro ejercicio en lugar del planificado: se muestran los dos, pero no se calcula la diferencia entre ejercicios distintos.',
  tablaEquivalente: 'Tabla de valores',
  tablaMuestraAmbas: 'La tabla muestra siempre las dos capas, con los mismos valores del gráfico.',
  capaOculta: 'Las dos capas están ocultas. Activá al menos una para ver el gráfico; la tabla sigue abajo.',
  sinSeries: 'Esta prescripción no tiene series planificadas ni registradas.',
} as const;

const MOTIVO: Readonly<Record<Exclude<MotivoSinDato, 'campo-no-registrado'>, string>> = {
  'serie-no-registrada': 'Sin dato: la serie no está en el registro',
  'ejercicio-no-registrado': 'Sin dato: el ejercicio no está en el registro',
  'registro-resumido': 'Sin dato por serie: se registró un resumen',
  'vista-no-resoluble': 'Sin dato: el registro vigente no se puede determinar',
  'otro-ejercicio': 'Se registró otro ejercicio',
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
    case 'otro-ejercicio':
      return `${COPY_COMPARACION.otroEjercicioPlanificado}: ${v.nombre}`;
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
      return 'igual';
    case 'distinta':
      return conSigno(d.delta, m);
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
export function rotuloCorto(p: { readonly planificado: ValorPlanificado; readonly registrado: ValorRegistrado; readonly diferencia: Diferencia | null }, m: Medida): string {
  const d = p.diferencia;
  if (d) {
    if (d.tipo === 'igual') return 'igual';
    if (d.tipo === 'distinta') return conSigno(d.delta, m);
    if (d.tipo === 'dentro-del-rango') return 'en rango';
    return `${conSigno(d.delta, m)} ${d.tipo === 'bajo-el-rango' ? 'mín.' : 'máx.'}`;
  }
  const r = p.registrado;
  if (r.tipo === 'no-realizada') return COPY_COMPARACION.noRealizadaCorto;
  if (r.tipo === 'otra-unidad') return `en ${r.carga.unit}`;
  if (r.tipo === 'sin-dato') return r.motivo === 'otro-ejercicio' ? 'otro ejercicio' : COPY_COMPARACION.sinDato.toLowerCase();
  if (p.planificado.tipo === 'no-planificada') return COPY_COMPARACION.noPlanificadaCorto;
  return '';
}

/** La diferencia en palabras, para el lector de pantalla y la tabla: «1 repetición menos que lo planificado». */
export function diferenciaEnPalabras(d: Diferencia, m: Medida): string {
  if (d.tipo === 'igual') return COPY_COMPARACION.igual;
  if (d.tipo === 'dentro-del-rango') return COPY_COMPARACION.dentroDelRango;
  const n = Math.abs(d.delta);
  const cuanto =
    m.variable === 'carga' ? cantidad(n, m.unidad) : m.variable === 'rir' ? `${numero(n)} de RIR` : `${numero(n)} ${n === 1 ? 'repetición' : 'repeticiones'}`;
  const sentido = d.delta < 0 ? 'menos' : 'más';
  const referencia = d.tipo === 'distinta' ? 'que lo planificado' : d.tipo === 'bajo-el-rango' ? 'que el mínimo del rango' : 'que el máximo del rango';
  return `${cuanto} ${sentido} ${referencia}`;
}
