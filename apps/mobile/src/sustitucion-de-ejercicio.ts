/**
 * Sustituir el ejercicio activo de la sesión enfocada (DL-151). Es lo que la APK 0.13.2 hacía en la tarjeta de cada
 * ejercicio y se perdió al rehacer la sesión enfocada (e6bd769, 2026-10-06), sin una decisión registrada. La sustitución
 * es legítima y no es un error (09v10:1116-1121; REG-06-130): se registra otro ejercicio en lugar del planificado, y
 * quedan las dos puntas.
 *
 * **Las reglas, que son las de la 0.13.2, dichas:**
 * - **Lo planificado no se pisa.** API-TRN-17 no deja mandarlo: la prescripción lo fija, y lo único que cambia es
 *   `performedExerciseVersionId`. La API calcula `substituted` comparando los dos, y el plan no cambia.
 * - **Un ejercicio registrado tiene un solo ejercicio realizado.** El contrato no admite uno por serie: sustituir cambia
 *   el realizado de todas sus series, las ya registradas y las que vengan. Las ya registradas no se borran, no se
 *   renumeran y no cambian sus datos: pasan a contar como el realizado. Antes de guardar se le pregunta a la persona
 *   (`textoDeLaConfirmacion`), para que no se reasignen en silencio.
 * - **Antes de la primera serie** la sustitución se guarda igual, con el ejercicio sin series, como en la 0.13.2: así la
 *   primera serie ya viaja con el realizado. API-TRN-18 no confirma un ejercicio sin series (`SET_REQUIRED`):
 *   `problemaParaConfirmar` lo dice antes de finalizar, y volver al planificado sin series lo saca del borrador.
 * - **Los tiempos no se tocan.** Los eventos de tiempo citan la prescripción, no el ejercicio. La sustitución no arma
 *   eventos, no cambia la serie enfocada ni el ejercicio activo, y no reinicia ni duplica el descanso ni la serie
 *   cronometrada.
 * - **Necesita conexión.** Buscar en el catálogo y guardar la sustitución son pedidos a la API: no queda guardada en el
 *   teléfono para mandarla después.
 *
 * No son las alternativas aprobadas por el profesional (PF-03) ni una equivalencia de carga: el plan de cada serie sigue
 * siendo el del ejercicio planificado, y BE no convierte la carga de uno en la del otro.
 *
 * Es lógica pura, sin React. La usa `PantallaDeSesion` (entrenamiento.tsx), y la prueba
 * `scripts/sustitucion-de-ejercicio.test.mjs`.
 */
import { cantidadDeSeries, COPY_ENTRENAMIENTO, numero, type BorradorDeEjecucion, type EjercicioRegistradoEntrada, type PrescripcionConObjetivos } from '@be/domain';
import { ejerciciosParaGuardar, filasDelEjercicio, guardadasDe, type SerieLocal } from './series-de-la-sesion';

export const TEXTOS_DE_LA_SUSTITUCION = {
  /**
   * El alcance va dicho antes de elegir (encargo del 2026-10-23): la sustitución vale para el ejercicio entero en esta
   * sesión, también para las series que faltan, y no hay sustitución de una serie sola (el contrato admite un realizado
   * por ejercicio).
   */
  ayuda:
    'Buscá el ejercicio que hiciste en lugar del planificado. Vale para todas las series de este ejercicio en esta sesión, las que ya registraste y las que faltan: no se puede cambiar una serie sola. Lo planificado no cambia, y el plan de cada serie sigue siendo el suyo.',
  campo: 'Buscar el ejercicio que hiciste',
  buscar: 'Buscar',
  noSePudoBuscar: 'No pudimos buscar en el catálogo. Probá de nuevo.',
  /**
   * R-5: sustituir necesita conexión (buscar y guardar son pedidos a la API). Sin conexión se dice eso, no «probá de nuevo»
   * a secas, y que lo registrado no se pierde (encargo del 2026-10-25, etapa B).
   */
  sinConexionAlBuscar: 'Sustituir un ejercicio necesita conexión, y ahora no hay. Lo que ya registraste sigue guardado en el teléfono.',
  /** Sin respuesta al guardar: no se sabe si llegó. La tarjeta, que se relee, dice lo que quedó guardado. */
  sinRespuestaAlGuardar:
    'No sabemos si la sustitución llegó: no hubo respuesta de BE. La tarjeta dice lo que quedó guardado; si sigue igual, probá de nuevo con conexión. Lo que registraste no se pierde.',
  sinResultados: 'No encontramos ejercicios con ese nombre.',
  /** Un ejercicio que el catálogo muestra pero que no se puede citar en el registro de este plan (`EXERCISE_REFERENCE_INVALID`). */
  noSePuedeRegistrar: 'Ese ejercicio no se puede registrar en esta sesión. Elegí otro.',
  /** Mientras se mandaba lo pendiente, el borrador pasó a otra forma de registro o se confirmó en otro dispositivo. */
  cambioLaSesion: 'Lo registrado de esta sesión cambió: volvé a la sesión para ver cómo quedó.',
  volverAlPlanificado: (nombre: string) => `Volver al planificado: ${nombre}`,
  yaRegistradas: (n: number) => `Ya registraste ${cantidadDeSeries(n)} de este ejercicio: ${n === 1 ? 'pasa' : 'pasan'} a contar como el que elijas.`,
  anuncio: (nombre: string, esElPlanificado: boolean) => (esElPlanificado ? `Volviste al planificado: ${nombre}` : `${COPY_ENTRENAMIENTO.sustituido}: ahora registrás ${nombre}`),
} as const;

/** Un ejercicio del catálogo, por su versión y su nombre: el planificado o el realizado. */
export interface EjercicioNombrado {
  readonly versionId: string;
  readonly nombre: string;
}

export interface SustitucionDelEjercicio {
  readonly prescriptionId: string;
  /** El ejercicio que indicó el profesional: el de la prescripción. La sustitución nunca lo cambia. */
  readonly planificado: EjercicioNombrado;
  /** El ejercicio del catálogo del planificado: otra versión suya no se ofrece como sustituto de sí mismo. */
  readonly ejercicioDelPlanificado: string;
  /** El que se registra en su lugar, si es otro; `null` sin sustitución. */
  readonly ejecutado: EjercicioNombrado | null;
  /** Las series de este ejercicio que ya tienen registro, en el borrador o en el teléfono: las que pasarían a contar como otro. */
  readonly registradas: number;
}

type LaPrescripcion = Pick<PrescripcionConObjetivos, 'prescriptionId' | 'exerciseId' | 'exerciseVersionId' | 'exerciseName' | 'sets'>;

/**
 * Lo planificado y lo realizado de una prescripción, tal como lo dice el borrador. `substituted` lo calcula la API:
 * la APK no lo deduce.
 */
export function sustitucionDe(p: LaPrescripcion, borrador: Pick<BorradorDeEjecucion, 'exercises'> | null, locales: readonly SerieLocal[]): SustitucionDelEjercicio {
  const registrado = borrador?.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null;
  return {
    prescriptionId: p.prescriptionId,
    planificado: { versionId: registrado?.prescribedExerciseVersionId ?? p.exerciseVersionId, nombre: p.exerciseName },
    ejercicioDelPlanificado: p.exerciseId,
    ejecutado: registrado?.substituted ? { versionId: registrado.performedExerciseVersionId, nombre: registrado.performedExerciseName } : null,
    // Las mismas filas que ve la persona: lo guardado en el servidor y lo pendiente del teléfono, una vez cada serie.
    registradas: filasDelEjercicio(p, guardadasDe(borrador, p.prescriptionId), locales).filter((f) => f.estado !== 'sin-registrar').length,
  };
}

/** El ejercicio con el que se registra una serie nueva: el realizado del borrador, que respeta una sustitución ya hecha. */
export function ejercicioRealizadoDe(borrador: Pick<BorradorDeEjecucion, 'exercises'> | null, p: Pick<PrescripcionConObjetivos, 'prescriptionId' | 'exerciseVersionId'>): string {
  return borrador?.exercises.find((e) => e.prescriptionId === p.prescriptionId)?.performedExerciseVersionId ?? p.exerciseVersionId;
}

/**
 * Si se ofrece «Sustituir ejercicio». Hace falta el borrador leído (la versión con la que se guarda), y que la sesión se
 * registre por serie: registrada por ejercicio o sesión, la pantalla ya ofrece pasar a registrar por serie.
 */
export function sePuedeSustituir(borrador: Pick<BorradorDeEjecucion, 'granularity' | 'state'> | null): boolean {
  return borrador !== null && borrador.state === 'DRAFT' && borrador.granularity !== 'EXERCISE_OR_SESSION';
}

export interface CambiosDeLaSustitucion {
  readonly granularity?: 'SET';
  readonly exercises: EjercicioRegistradoEntrada[];
}

/**
 * Los cambios de API-TRN-17 para que la prescripción se registre con `versionId`. API-TRN-17 reemplaza `exercises`
 * entero, así que va todo lo que el borrador ya tiene, tal cual (`ejerciciosParaGuardar`, sin series del teléfono:
 * las pendientes viajan después, con el envío de siempre, y se suman al ejercicio con su realizado).
 * - Sin nada registrado de la prescripción, se suma con `sets: []`.
 * - Con algo registrado, cambia solo el realizado: las series quedan iguales, en su orden.
 * - Volver al planificado sin series saca el ejercicio del borrador, que queda como antes de sustituir.
 * - Sin elegir la forma de registro, se elige por serie: es la de la sesión enfocada.
 * `null` si no hay nada que cambiar: se eligió el que ya figura.
 */
export function cambiosParaSustituir(
  borrador: Pick<BorradorDeEjecucion, 'exercises' | 'granularity'>,
  p: Pick<PrescripcionConObjetivos, 'prescriptionId' | 'exerciseVersionId'>,
  versionId: string,
): CambiosDeLaSustitucion | null {
  const { exercises } = ejerciciosParaGuardar(borrador, []);
  const indice = exercises.findIndex((e) => e.prescriptionId === p.prescriptionId);
  const previo = indice >= 0 ? exercises[indice] : null;
  const planificado = borrador.exercises.find((e) => e.prescriptionId === p.prescriptionId)?.prescribedExerciseVersionId ?? p.exerciseVersionId;
  if ((previo?.performedExerciseVersionId ?? planificado) === versionId) return null;
  let nuevos: EjercicioRegistradoEntrada[];
  if (!previo) nuevos = [...exercises, { prescriptionId: p.prescriptionId, performedExerciseVersionId: versionId, sets: [] }];
  else if (versionId === planificado && 'sets' in previo && previo.sets.length === 0) nuevos = exercises.filter((_, i) => i !== indice);
  else nuevos = exercises.map((e, i) => (i === indice ? { ...e, performedExerciseVersionId: versionId } : e));
  return borrador.granularity === 'SET' ? { exercises: nuevos } : { granularity: 'SET', exercises: nuevos };
}

/**
 * Los resultados de la búsqueda que se ofrecen como sustitutos: ni el que ya figura, ni el planificado (volver a él tiene
 * su propio botón), ni otra versión del planificado, que es el mismo ejercicio.
 */
export function sustitutosPosibles<E extends { readonly exerciseId: string; readonly versionId: string }>(s: SustitucionDelEjercicio, encontrados: readonly E[]): E[] {
  const actual = (s.ejecutado ?? s.planificado).versionId;
  return encontrados.filter((e) => e.versionId !== actual && e.versionId !== s.planificado.versionId && e.exerciseId !== s.ejercicioDelPlanificado);
}

/**
 * Lo que se le pregunta antes de sustituir un ejercicio que ya tiene series: cuáles pasan a contar como el elegido, y que
 * las que registre después también (un ejercicio, un realizado). `null` si no hay series registradas (no hay nada que
 * reasignar; el alcance lo dice la ayuda del diálogo) o si se eligió el que ya figura.
 */
export function textoDeLaConfirmacion(s: SustitucionDelEjercicio, elegido: EjercicioNombrado): string | null {
  const actual = s.ejecutado ?? s.planificado;
  if (s.registradas === 0 || actual.versionId === elegido.versionId) return null;
  const cuantas = s.registradas === 1 ? 'La serie que ya registraste' : `Las ${numero(s.registradas, 0)} series que ya registraste`;
  const pasan = s.registradas === 1 ? 'pasa' : 'pasan';
  const destino = elegido.versionId === s.planificado.versionId ? `«${elegido.nombre}», el ejercicio planificado` : `«${elegido.nombre}»`;
  return `${cuantas} de «${actual.nombre}» ${pasan} a contar como ${destino}, y las que registres después también. Sus datos no cambian, y lo planificado por tu profesional tampoco.`;
}
