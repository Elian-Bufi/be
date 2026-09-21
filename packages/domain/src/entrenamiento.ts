/**
 * B-08 — Circuito de entrenamiento (06:4947-5786). Reglas puras que comparten la API, el website y el APK.
 *
 * Lo que este bloque garantiza, y que ninguna capa de arriba puede aflojar:
 * - **lo planificado y lo ejecutado son dos estructuras distintas**, y registrar una ejecución no modifica la
 *   prescripción ni la instantánea (REG-06-113; INV-06-120);
 * - la ejecución cuelga de la **versión activada**, nunca de un borrador (INV-06-121);
 * - **una sola ejecución registrada por ocurrencia**, y la ocurrencia no se inventa por timestamp (REG-06-115);
 * - una ejecución registrada **no se edita**: se corrige por el patrón B-06 (REG-06-116; INV-06-124/125);
 * - el criterio de intensidad es **exactamente uno** de porcentaje de RM o RIR, y el esfuerzo percibido y la carga
 *   absoluta **nunca** son un tercer criterio (REG-06-128/129; INV-06-138/139);
 * - **`NO_REALIZADA` registrada no es lo mismo que una sesión sin registro**, y no se infiere condición cuando no
 *   hay registro (REG-06-131; INV-06-141);
 * - la sustitución conserva lo prescripto y lo realizado, y **no se clasifica por sí misma como error**
 *   (REG-06-130; INV-06-140);
 * - la progresión mapea a AJUSTAR o SUSTITUIR: **no hay un séptimo resultado** (REG-06-117; INV-06-126).
 *
 * **B-08 no calcula.** No hay fórmula de repetición máxima, no hay conversión entre criterios de intensidad, y no se
 * calcula volumen, volumen efectivo, progresiones ni marcas personales: «únicamente habilita captura suficiente para
 * la derivación posterior de B-11» (06:5677; INV-06-153). Si alguna vez hace falta un valor derivado, el único canal
 * admitido es el patrón transversal de cálculo T-06-N12, ya implementado en `calculo.ts` (REG-06-202).
 *
 * Las estructuras de plan y de versión reutilizan el patrón común de B-07 sin renombrarlo (06:4956-4965): por eso
 * las transiciones de la versión de plan son literalmente las mismas que las de nutrición. REG-06-07 lo autoriza —
 * «conceptos homólogos […] comparten patrón estructural y taxonomías comunes […] **sin fusionar dominios ni crear
 * vocabularios paralelos**» (06:431)— y por eso cada dominio conserva el suyo.
 */
import type { TransicionDeMaquina } from './maquina';
import type { ResultadoDeRevision } from './revision';
import { transicionDe } from './maquina';

// ─── Versión de plan de entrenamiento (06:5147-5162, instanciando 06:4292-4305) ─────────────────

/**
 * Dos estados, no tres. **No existe `VALIDADO`**: la palabra no aparece en el 06. Validar es una *condición* de
 * `ActivarVersion` (REG-06-104, 06:4330), no un estado por el que la versión pase.
 */
export const EstadoDeVersionDePlanDeEntrenamiento = { BORRADOR: 'BORRADOR', ACTIVADA: 'ACTIVADA' } as const;
export type EstadoDeVersionDePlanDeEntrenamiento =
  (typeof EstadoDeVersionDePlanDeEntrenamiento)[keyof typeof EstadoDeVersionDePlanDeEntrenamiento];

/**
 * El 09 **no separa** los borradores de plan en su propia colección: el borrador es el mismo recurso con
 * `state: "DRAFT"` (09v10:238-245, 682) y se edita por `PATCH /training/plans/{planId}` (09v10:713). Es la asimetría
 * deliberada del contrato: la ejecución sí se separa en dos colecciones, el plan no.
 */
export const ESTADO_DE_PLAN_DE_ENTRENAMIENTO_API: Readonly<Record<EstadoDeVersionDePlanDeEntrenamiento, 'DRAFT' | 'ACTIVATED'>> = {
  BORRADOR: 'DRAFT',
  ACTIVADA: 'ACTIVATED',
};

export type TransicionDeVersionDePlanDeEntrenamiento = 'CrearBorrador' | 'GuardarBorrador' | 'ActivarVersion';

/**
 * 06:5157-5159, literal. «No se agregan estados de Entrenamiento» (06:5162): son las mismas tres transiciones del
 * patrón común, sin agregados. Los nombres de evento son derivados, como en WP-03 (DL-033) y WP-04.
 */
export const TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO: readonly TransicionDeMaquina<
  EstadoDeVersionDePlanDeEntrenamiento,
  TransicionDeVersionDePlanDeEntrenamiento,
  'PROFESIONAL'
>[] = [
  { transicion: 'CrearBorrador', origen: null, destino: 'BORRADOR', actores: ['PROFESIONAL'], evento: 'BorradorDePlanDeEntrenamientoCreado' },
  { transicion: 'GuardarBorrador', origen: 'BORRADOR', destino: 'BORRADOR', actores: ['PROFESIONAL'], evento: 'BorradorDePlanDeEntrenamientoGuardado' },
  { transicion: 'ActivarVersion', origen: 'BORRADOR', destino: 'ACTIVADA', actores: ['PROFESIONAL'], evento: 'VersionDePlanDeEntrenamientoActivada' },
];

export type ContextoDeTransicionDePlanDeEntrenamiento =
  | {
      readonly transicion: 'CrearBorrador';
      /** «evaluación/objetivo identificables cuando corresponda» (06:4303). */
      readonly evaluacionYObjetivoIdentificables: boolean;
    }
  | { readonly transicion: 'GuardarBorrador'; readonly cambiosValidosComoBorrador: boolean }
  /**
   * La lista blanca del 06 escribe las condiciones de activar como «§§8–9» (06:4305), una referencia interna que
   * tras el ensamblado apunta a otro lado. Para una lista blanca implementada en código eso no sirve: las
   * condiciones son **REG-06-104 y REG-06-105** (06:4326, 06:4347), y así quedan fijadas acá.
   */
  | { readonly transicion: 'ActivarVersion'; readonly borradorValido: boolean; readonly instantaneaPreservable: boolean };

export type EvaluacionDeTransicionDePlanDeEntrenamiento =
  | { readonly permitida: true; readonly transicion: TransicionDeMaquina<EstadoDeVersionDePlanDeEntrenamiento, TransicionDeVersionDePlanDeEntrenamiento, 'PROFESIONAL'> }
  | { readonly permitida: false; readonly motivo: 'TRANSICION_NO_DECLARADA' | 'CONDICION_NO_CUMPLIDA' };

export function evaluarTransicionDePlanDeEntrenamiento(
  estado: EstadoDeVersionDePlanDeEntrenamiento | null,
  c: ContextoDeTransicionDePlanDeEntrenamiento,
): EvaluacionDeTransicionDePlanDeEntrenamiento {
  const t = transicionDe(TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO, c.transicion, estado);
  if (!t) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };

  // REG-06-104: «Si no puede preservarse la instantánea, el plan no se activa» (05:8878).
  if (c.transicion === 'ActivarVersion' && !(c.borradorValido && c.instantaneaPreservable)) {
    return { permitida: false, motivo: 'CONDICION_NO_CUMPLIDA' };
  }
  if (c.transicion === 'CrearBorrador' && !c.evaluacionYObjetivoIdentificables) return { permitida: false, motivo: 'CONDICION_NO_CUMPLIDA' };
  if (c.transicion === 'GuardarBorrador' && !c.cambiosValidosComoBorrador) return { permitida: false, motivo: 'CONDICION_NO_CUMPLIDA' };
  return { permitida: true, transicion: t };
}

// ─── Ejecución real (06:5202-5223) ──────────────────────────────────────────────────────────────

/**
 * A diferencia del plan, el 09 **sí** separa estas dos en colecciones distintas, con prefijos de identificador
 * propios: `tdraft_` para el borrador y `texec_` para la ejecución registrada (09v10:950, 1176). Confirmar **crea un
 * recurso nuevo**; no cambia un campo del mismo documento.
 */
export const EstadoDeEjecucion = { BORRADOR: 'BORRADOR', REGISTRADA: 'REGISTRADA' } as const;
export type EstadoDeEjecucion = (typeof EstadoDeEjecucion)[keyof typeof EstadoDeEjecucion];
export const ESTADO_DE_EJECUCION_API: Readonly<Record<EstadoDeEjecucion, 'DRAFT' | 'REGISTERED'>> = { BORRADOR: 'DRAFT', REGISTRADA: 'REGISTERED' };

export type TransicionDeEjecucion = 'CrearBorradorEjecucion' | 'GuardarBorradorEjecucion' | 'ConfirmarEjecucion';

/**
 * 06:5217-5219, literal. **No existe transición de `REGISTRADA` a `BORRADOR`** (06:5221): después de confirmar, la
 * única vía de cambio es la corrección trazable de B-06, que no es una transición de esta máquina — «B-08 no crea
 * una máquina paralela de correcciones» (06:5259).
 */
export const TRANSICIONES_DE_EJECUCION: readonly TransicionDeMaquina<EstadoDeEjecucion, TransicionDeEjecucion, 'ASESORADO'>[] = [
  { transicion: 'CrearBorradorEjecucion', origen: null, destino: 'BORRADOR', actores: ['ASESORADO'], evento: 'BorradorDeEjecucionCreado' },
  { transicion: 'GuardarBorradorEjecucion', origen: 'BORRADOR', destino: 'BORRADOR', actores: ['ASESORADO'], evento: 'BorradorDeEjecucionGuardado' },
  { transicion: 'ConfirmarEjecucion', origen: 'BORRADOR', destino: 'REGISTRADA', actores: ['ASESORADO'], evento: 'EjecucionRegistrada' },
];

export type ContextoDeTransicionDeEjecucion =
  | { readonly transicion: 'CrearBorradorEjecucion'; readonly sesionYVersionIdentificables: boolean }
  | { readonly transicion: 'GuardarBorradorEjecucion' }
  | { readonly transicion: 'ConfirmarEjecucion'; readonly contenidoMinimoCoherente: boolean };

export type EvaluacionDeTransicionDeEjecucion =
  | { readonly permitida: true; readonly transicion: TransicionDeMaquina<EstadoDeEjecucion, TransicionDeEjecucion, 'ASESORADO'> }
  | { readonly permitida: false; readonly motivo: 'TRANSICION_NO_DECLARADA' | 'CONDICION_NO_CUMPLIDA' };

export function evaluarTransicionDeEjecucion(estado: EstadoDeEjecucion | null, c: ContextoDeTransicionDeEjecucion): EvaluacionDeTransicionDeEjecucion {
  const t = transicionDe(TRANSICIONES_DE_EJECUCION, c.transicion, estado);
  if (!t) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (c.transicion === 'CrearBorradorEjecucion' && !c.sesionYVersionIdentificables) return { permitida: false, motivo: 'CONDICION_NO_CUMPLIDA' };
  if (c.transicion === 'ConfirmarEjecucion' && !c.contenidoMinimoCoherente) return { permitida: false, motivo: 'CONDICION_NO_CUMPLIDA' };
  return { permitida: true, transicion: t };
}

// ─── Criterio de intensidad (REG-06-128/129; INV-06-138/139) ────────────────────────────────────

/** Conjunto cerrado de dos. **Sin tercer valor** y sin valor cuantitativo fijado por el 06 (06:5411-5420). */
export const CriterioDeIntensidad = { PORCENTAJE_RM: 'PORCENTAJE_RM', RIR: 'RIR' } as const;
export type CriterioDeIntensidad = (typeof CriterioDeIntensidad)[keyof typeof CriterioDeIntensidad];
export const CRITERIO_DE_INTENSIDAD_API: Readonly<Record<CriterioDeIntensidad, 'PERCENT_RM' | 'RIR'>> = {
  PORCENTAJE_RM: 'PERCENT_RM',
  RIR: 'RIR',
};

export type MotivoDeIntensidadInvalida = 'DOS_CRITERIOS' | 'CRITERIO_DESCONOCIDO' | 'VALOR_SIN_CRITERIO' | 'ESFUERZO_COMO_CRITERIO';

/**
 * REG-06-128 es **condicional**: «Cada Prescripción **que declare** criterio de intensidad identifica exactamente
 * uno» (06:5413), e INV-06-138 se viola con «ninguno **cuando se declaró criterio**» (06:5496). O sea que el enum
 * efectivo de persistencia es `PORCENTAJE_RM | RIR | null`, no dos valores: una prescripción puede no declarar
 * criterio, y eso es legítimo. Implementarlo como `NOT NULL` sería inventar una exigencia que el 06 no hace.
 *
 * Lo que sí es inadmisible: declarar los dos, declarar un tercero, poner un valor sin criterio, o usar el esfuerzo
 * percibido como criterio — que es dato **de la ejecución**, nunca de la prescripción (REG-06-129; INV-06-139).
 */
export function evaluarCriterioDeIntensidad(p: {
  readonly criterio: CriterioDeIntensidad | null;
  readonly valor: number | null;
  readonly esfuerzoPercibidoComoCriterio?: boolean;
}): { readonly valido: true } | { readonly valido: false; readonly motivo: MotivoDeIntensidadInvalida } {
  if (p.esfuerzoPercibidoComoCriterio) return { valido: false, motivo: 'ESFUERZO_COMO_CRITERIO' };
  if (p.criterio !== null && !(p.criterio in CriterioDeIntensidad)) return { valido: false, motivo: 'CRITERIO_DESCONOCIDO' };
  // Sin criterio no puede haber objetivo cuantitativo: el número quedaría sin significado declarado.
  if (p.criterio === null && p.valor !== null) return { valido: false, motivo: 'VALOR_SIN_CRITERIO' };
  return { valido: true };
}

// ─── Condición de sesión (REG-06-131; INV-06-141) ───────────────────────────────────────────────

/** Conjunto cerrado de tres, con motivo opcional (06:5450-5456). */
export const CondicionDeSesion = {
  REALIZADA: 'REALIZADA',
  REALIZADA_CON_DESVIO: 'REALIZADA_CON_DESVIO',
  NO_REALIZADA: 'NO_REALIZADA',
} as const;
export type CondicionDeSesion = (typeof CondicionDeSesion)[keyof typeof CondicionDeSesion];
export const CONDICION_DE_SESION_API: Readonly<Record<CondicionDeSesion, 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED'>> = {
  REALIZADA: 'COMPLETED',
  REALIZADA_CON_DESVIO: 'COMPLETED_WITH_DEVIATION',
  NO_REALIZADA: 'NOT_COMPLETED',
};

/**
 * La garantía central del dominio, declarada siete veces entre el 06 y el 10: **una sesión sin registro no es una
 * sesión no realizada.**
 *
 * `NO_REALIZADA` es un **acto explícito** del asesorado —apretó «No pude realizarla»— y produce un registro con su
 * motivo. La ausencia de registro no produce nada: «B-08 no infiere condición cuando no existe registro» (06:5458).
 *
 * Esta función existe para que la diferencia sea inexpresable por accidente: devuelve `SIN_REGISTRO` cuando no hay
 * ejecución registrada, que es un valor **distinto** de los tres de la condición y que ninguna pantalla puede
 * confundir con `NO_REALIZADA` sin escribir la confusión a propósito.
 */
export const SIN_REGISTRO = 'SIN_REGISTRO' as const;
export type VistaDeSesion = CondicionDeSesion | typeof SIN_REGISTRO;

export function vistaDeSesion(ejecucionRegistrada: { readonly condicion: CondicionDeSesion } | null): VistaDeSesion {
  return ejecucionRegistrada === null ? SIN_REGISTRO : ejecucionRegistrada.condicion;
}

// ─── Granularidad del registro (REG-06-132; INV-06-142) ─────────────────────────────────────────

/** Por serie, o por ejercicio/sesión. Se conserva **cuál se usó**: no se descompone retrospectivamente (06:5464). */
export const GranularidadDeRegistro = { SERIE: 'SERIE', EJERCICIO_O_SESION: 'EJERCICIO_O_SESION' } as const;
export type GranularidadDeRegistro = (typeof GranularidadDeRegistro)[keyof typeof GranularidadDeRegistro];
export const GRANULARIDAD_API: Readonly<Record<GranularidadDeRegistro, 'SET' | 'EXERCISE_OR_SESSION'>> = {
  SERIE: 'SET',
  EJERCICIO_O_SESION: 'EXERCISE_OR_SESSION',
};

export interface SerieEjecutada {
  readonly indice: number;
  readonly carga: { readonly valor: number; readonly unidad: string } | null;
  readonly repeticiones: number | null;
  /** Opcionales y **nunca inferidos**: una serie sin RIR no se clasifica (INV-06-152; TEST-PRJ-004). */
  readonly rir: number | null;
  readonly esfuerzoPercibido: number | null;
}

export type MotivoDeSerieInvalida = 'CARGA_SIN_UNIDAD' | 'INDICE_INVALIDO';

/**
 * REG-06-140 dice «puede conservar» e INV-06-152 dice «conserva» y se viola «si falta unidad para una carga
 * registrada» (06:5710). La lectura conciliada, y la que se implementa: **los campos son opcionales, pero si hay
 * carga tiene que haber unidad.** Un número sin unidad no es una carga, es un número.
 */
export function evaluarSerieEjecutada(s: SerieEjecutada): { readonly valida: true } | { readonly valida: false; readonly motivo: MotivoDeSerieInvalida } {
  if (!Number.isInteger(s.indice) || s.indice < 1) return { valida: false, motivo: 'INDICE_INVALIDO' };
  if (s.carga !== null && s.carga.unidad.trim() === '') return { valida: false, motivo: 'CARGA_SIN_UNIDAD' };
  return { valida: true };
}

// ─── Sustitución de ejercicio (REG-06-130; INV-06-140) ──────────────────────────────────────────

export interface EjercicioEjecutado {
  readonly prescripcionId: string;
  /** Lo que efectivamente se hizo. Si difiere de lo prescripto, es una sustitución — y eso no es un error. */
  readonly ejercicioRealizadoVersionId: string;
}

/**
 * Sustituir conserva **las dos puntas y la referencia entre ellas**: la prescripción original, el ejercicio
 * realizado, y el vínculo. No modifica la prescripción ni la instantánea, y «no se clasifica por sí misma como
 * error» (06:5446).
 *
 * Colapsar los dos campos en uno solo destruye el hecho de la sustitución: se perdería qué se había indicado.
 */
export function huboSustitucion(e: EjercicioEjecutado, prescripcionEjercicioVersionId: string): boolean {
  return e.ejercicioRealizadoVersionId !== prescripcionEjercicioVersionId;
}

// ─── Progresión (REG-06-117; INV-06-126) ────────────────────────────────────────────────────────

/**
 * Los seis resultados semánticos de DEC-043 **no se redefinen acá**: se importan de `revision.ts`, que es donde ya
 * viven para nutrición. Es REG-06-07 aplicado —patrón común sin vocabularios paralelos (06:431)— y es lo que el 05
 * exige cuando dice que UC-P18 «no redefine DEC-043» (05:9437).
 *
 * La progresión **no es un resultado**: es una intención profesional que se mapea a uno de los seis según su efecto
 * sobre el versionado.
 */
export type IntencionDeProgresion = 'PROGRESAR_CONSERVANDO_ESTRUCTURA' | 'REQUERIR_PLANIFICACION_SUCESORA';

/**
 * 06:5267-5271. «Iniciar un nuevo bloque» no aparece acá como tercera intención porque el 06 lo mapea «según su
 * efecto sobre la planificación/versionado» — o sea que se expresa con una de las dos de arriba, no con una propia.
 *
 * **No se introduce token `PROGRESAR`** (06:5273): esta función existe justamente para que la intención de progresar
 * tenga que pasar por el mapeo antes de poder registrarse.
 */
export function resultadoDeProgresion(intencion: IntencionDeProgresion): Extract<ResultadoDeRevision, 'AJUSTAR' | 'SUSTITUIR'> {
  return intencion === 'PROGRESAR_CONSERVANDO_ESTRUCTURA' ? 'AJUSTAR' : 'SUSTITUIR';
}

// ─── Ocurrencia planificada (REG-06-115; DL-077) ────────────────────────────────────────────────

/**
 * El 06 exige unicidad por ocurrencia identificable y aclara que **no la inventa por timestamp** (06:5235), pero
 * nunca define qué constituye una ocurrencia. DL-077 lo declara y fija el provisorio: la ocurrencia es
 * **(sesión planificada + fecha local de ejecución)**.
 *
 * La fecha es local, no UTC, por la misma razón que la evolución antropométrica se corta en hora local: una sesión
 * de las 21:41 en Buenos Aires pertenece a ese día, no al siguiente. Es la lección de WP-05.
 */
export function claveDeOcurrencia(sesionPlanificadaId: string, fechaLocal: string): string {
  return `${sesionPlanificadaId}:${fechaLocal}`;
}
