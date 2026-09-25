/**
 * Copy de entrenamiento para el website y el APK (B10-06; B10-10). Lo literal del 10 va tal cual; lo que el 10 no
 * escribe sigue su criterio: describir, no calificar, y no decir nunca lo que BE no hace (BE no calcula volumen,
 * marcas ni progresiones, no diagnostica y no puntúa).
 *
 * **Léxico** (DL-085, opción A): el del B10-10, por ser el más tardío y el transversal —`Planificado`, `Ejecutado`,
 * `Sustituido`, `Sin registro` (B10-10:457-461)—, en lugar del `Prescripto:` / `Realizado:` del B10-06:773-776.
 *
 * **La garantía central del dominio no se puede verificar con una lista negra.** «No realizada» es copy legítimo
 * cuando viene de un acto del asesorado y prohibido cuando se deriva de la ausencia (B10-06:794-796): la misma cadena,
 * las dos cosas. Por eso el texto de una sesión sale **solo** de `vistaDeOcurrencia`, que llega a la condición
 * únicamente a través de una ejecución registrada; y la prueba de pantallas verifica que ninguna pantalla escriba
 * «No realizada» por su cuenta ni lea la etiqueta de la condición sin pasar por acá (docs/paquetes/WP-06.md §9.2).
 * Lo mismo con `%`: es legítimo en `% RM` (B10-06:418-423) y prohibido como cumplimiento.
 */
import type { CondicionDeSesionApiSchema, EjecucionDeEntrenamiento, Ocurrencia, RegistroDeEjecucion } from './contratos-entrenamiento';
import type { z } from 'zod';

type CondicionApi = z.infer<typeof CondicionDeSesionApiSchema>;

/**
 * Lo que hoy rige de una ejecución: la corrección vigente, o el original si no hay (06:5253). Toda pantalla que muestra
 * la condición o las series de una ejecución en una lista la lee de acá: si no, una sesión corregida seguiría
 * mostrando lo que se corrigió (auditoría del cierre de WP-06).
 */
export function registroVigente(x: Pick<EjecucionDeEntrenamiento, 'original' | 'corrections' | 'effectiveView'>): RegistroDeEjecucion {
  const vista = x.effectiveView;
  if (vista.kind !== 'CORRECTED') return x.original;
  return x.corrections.find((c) => c.correctionId === vista.correctionId)?.correction ?? x.original;
}

/** REG-06-131 con las palabras del B10-06:786-792. Solo se muestran para una sesión **registrada** así. */
const ETIQUETA_DE_CONDICION: Readonly<Record<CondicionApi, string>> = {
  COMPLETED: 'Realizada',
  COMPLETED_WITH_DEVIATION: 'Realizada con desvío',
  NOT_COMPLETED: 'No realizada',
};

/**
 * La etiqueta de una condición **registrada**. Recibe la ejecución, no la condición suelta: así no hay manera de
 * pedir «No realizada» para una sesión que nadie registró.
 */
export function etiquetaDeCondicionRegistrada(ejecucion: { readonly sessionCondition: CondicionApi }): string {
  return ETIQUETA_DE_CONDICION[ejecucion.sessionCondition];
}

export const ETIQUETA_DE_CRITERIO: Readonly<Record<'PERCENT_RM' | 'RIR', string>> = { PERCENT_RM: '% RM', RIR: 'RIR' };

/** «1 serie», «3 series». Lo usan el website y la APK: la concordancia no se resuelve en cada pantalla. */
export const cantidadDeSeries = (n: number): string => `${n} ${n === 1 ? 'serie' : 'series'}`;
export const ETIQUETA_DE_GRANULARIDAD: Readonly<Record<'SET' | 'EXERCISE_OR_SESSION', string>> = {
  SET: 'Por serie',
  EXERCISE_OR_SESSION: 'Por ejercicio o sesión',
};

/** Qué pasa al aplicar cada resultado, en lenguaje llano, para un plan de entrenamiento (REG-06-117, 147). */
export const EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO: Readonly<Record<'MAINTAIN' | 'ADJUST' | 'REPLACE' | 'RESCHEDULE_REVIEW' | 'CHANGE_OBJECTIVE' | 'FINALIZE', string>> = {
  MAINTAIN: 'El plan sigue igual. Se registra la próxima acción.',
  ADJUST: 'Se prepara una nueva versión del plan en borrador, con la misma estructura, para ajustarla. La versión activa no cambia hasta que actives la nueva.',
  REPLACE: 'Se prepara una versión sucesora en borrador. La versión actual se conserva en el historial.',
  RESCHEDULE_REVIEW: 'Se fija una nueva fecha de revisión. El plan no cambia.',
  CHANGE_OBJECTIVE: 'Se emite una nueva versión del objetivo. El plan se ajusta aparte, con un borrador nuevo.',
  FINALIZE: 'Se cierra el seguimiento de entrenamiento. La historia se conserva; no es «Eliminar plan».',
};

export const COPY_ENTRENAMIENTO = {
  // Profesional (B10-06 §1-§24, §41-§47)
  pestana: 'Entrenamiento',
  resumen: 'Resumen',
  plan: 'Plan',
  ejecuciones: 'Ejecuciones',
  revisiones: 'Revisiones',
  sinEvaluacion: 'Todavía no hay una evaluación de entrenamiento.',
  sinObjetivo: 'Todavía no hay un objetivo de entrenamiento.',
  sinPlanActivo: 'Todavía no hay un plan activo.',
  objetivoVigente: 'Objetivo vigente',
  nuevaEvaluacion: 'Nueva evaluación',
  nuevaVersionDeObjetivo: 'Nueva versión de objetivo',
  crearPlan: 'Crear plan',
  crearNuevaVersion: 'Crear nueva versión a partir de esta',
  borrador: 'Borrador',
  activo: 'Activo',
  anterior: 'Anterior',
  bloque: 'Bloque',
  microciclo: 'Microciclo',
  agregarBloque: 'Agregar bloque',
  agregarMicrociclo: 'Agregar microciclo',
  agregarSesion: 'Agregar sesión',
  agregarEjercicio: 'Agregar ejercicio',
  proposito: 'Propósito profesional',
  indicaciones: 'Indicaciones',
  series: 'Series',
  repeticiones: 'Repeticiones',
  intensidad: 'Criterio de intensidad',
  sinCriterio: 'Sin criterio de intensidad',
  objetivoDeIntensidad: 'Objetivo',
  referenciaDeRm: 'Referencia de la repetición máxima',
  explicacionRir: 'RIR = repeticiones en reserva',
  cargaSugerida: 'Carga sugerida',
  cargaNoEsIntensidad: 'La carga sugerida es un complemento: no es el criterio de intensidad.',
  parametros: 'Descanso / parámetros',
  notas: 'Notas',
  buscarEjercicio: 'Buscar en el catálogo BE',
  crearManualmente: 'Crear manualmente',
  catalogoSintetico: 'Catálogo de demostración: no es una recomendación.',
  guardarBorrador: 'Guardar borrador',
  validarPlan: 'Validar plan',
  sinProblemas: 'El borrador no tiene problemas de estructura.',
  noJuzga: 'Validar revisa la forma del plan, no su calidad: no juzga el programa, la frecuencia ni la selección de ejercicios.',
  activarPlan: 'Activar plan',
  consecuenciaDeActivar: 'Esta versión pasará a ser la planificación vigente del asesorado y la anterior se conservará.',
  planActivado: 'Plan activado',
  sinEjecuciones: 'Todavía no hay sesiones registradas en este período.',
  diasSinRegistro: 'Días sin registro',
  contextoNoEsRevision: 'Ver el contexto no registra una revisión.',
  registrarRevision: 'Registrar revisión',
  aplicarProximaAccion: 'Aplicar próxima acción',
  progresionComoAjuste: 'Una progresión que conserva la estructura se registra como «Ajustar»; una que requiere una planificación sucesora, como «Sustituir».',

  // Asesorado (B10-06 §25-§38)
  entrenamientoDeHoy: 'Entrenamiento de hoy',
  sinPlanAsesorado: 'Todavía no tenés un plan de entrenamiento activo.',
  planNoDisponible: 'Tu plan de entrenamiento no está disponible en este momento.',
  // «Tu historial» (DL-096)
  tuHistorial: 'Tu historial',
  historialIntro: 'Tus planes y las sesiones que registraste. Lo tenés acá aunque no haya un plan activo.',
  tusPlanes: 'Tus planes',
  sesionesRegistradas: 'Sesiones registradas',
  sinPlanesEnHistorial: 'Todavía no tenés planes de entrenamiento.',
  sinSesionesEnPeriodo: 'No registraste sesiones en este período.',
  verLaSesion: 'Ver la sesión',
  verElPlan: 'Ver el plan',
  ultimos90Dias: 'Últimos 90 días',
  historialNoDisponible: 'No pudimos mostrar tu historial ahora. Volvé a intentar.',
  planHistoricoTitulo: 'Plan de entrenamiento',
  corregida: 'Corregida',
  vigente: 'Vigente',
  historialNecesitaA3: 'Para ver tu historial necesitás tener activo el consentimiento de datos de salud.',
  irAPrivacidad: 'Ir a Privacidad y consentimientos',
  sinPrescripciones: 'Esta sesión no tiene ejercicios prescriptos.',
  planSinSesiones: 'Este plan no tiene sesiones cargadas.',
  noIniciada: 'No iniciada',
  enCurso: 'En curso',
  registrada: 'Registrada',
  sinRegistro: 'Sin registro',
  comenzarSesion: 'Comenzar sesión',
  continuarSesion: 'Continuar sesión',
  registrarSerie: '+ Registrar serie',
  serie: 'Serie',
  carga: 'Carga',
  reps: 'Reps',
  rir: 'RIR',
  esfuerzoPercibido: 'Esfuerzo percibido (opcional)',
  pendiente: 'Pendiente',
  registradaEnBorrador: 'Registrada en borrador',
  granularidad: 'Cómo querés registrar',
  resumenDelEjercicio: 'Resumen del ejercicio',
  resumenDeLaSesion: 'Resumen de la sesión',
  sustituirEjercicio: 'Sustituir ejercicio',
  confirmarSustitucion: 'Confirmar sustitución',
  planificado: 'Planificado',
  ejecutado: 'Ejecutado',
  sustituido: 'Sustituido',
  condicionDeLaSesion: 'Condición de la sesión',
  noPudeRealizarla: 'No pude realizarla',
  motivoOpcional: 'Motivo (opcional)',
  revisarSesion: 'Revisar sesión',
  confirmarSesion: 'Confirmar sesión',
  sesionRegistrada: 'Sesión registrada',
  confirmarEsDefinitivo: 'Al confirmar, la sesión queda registrada. Si después detectás un error, se corrige sin borrar el registro original.',
  registrarOtroDia: 'Registrar otro día',
  horaDeLaSesion: 'Hora de la sesión',
  horaRequerida: 'Para una sesión de otro día, indicá a qué hora la hiciste.',
  corregirRegistro: 'Corregir registro',
  motivoDeLaCorreccion: 'Motivo de la corrección',
  registroOriginal: 'Registro original',
  correccionVigente: 'Corrección vigente',
  historialDeCorrecciones: 'Historial de correcciones',
  corregidoPorElProfesional: 'Corregido por el profesional',
  corregidoPorVos: 'Corregido por vos',
} as const;

/**
 * El texto de una ocurrencia, **la única vía** por la que una pantalla muestra el estado de una sesión. Sin registro,
 * es «No iniciada» si es de hoy y «Sin registro» si ya pasó: nunca «No realizada» (H-09-TRN-01; B10-10:461). La
 * condición aparece solo cuando hay una ejecución registrada, y es la que el asesorado declaró.
 */
export function vistaDeOcurrencia(o: Pick<Ocurrencia, 'date' | 'execution'>, hoy: string): { readonly texto: string; readonly registrada: boolean } {
  if (o.execution.state === 'DRAFT_IN_PROGRESS') return { texto: COPY_ENTRENAMIENTO.enCurso, registrada: false };
  const condicion = o.execution.state === 'REGISTERED' ? o.execution.sessionCondition : null;
  // Sin ejecución registrada no hay condición que mostrar: la ausencia no se infiere como condición (06:5458).
  if (!condicion) return { texto: o.date === hoy ? COPY_ENTRENAMIENTO.noIniciada : COPY_ENTRENAMIENTO.sinRegistro, registrada: false };
  return { texto: `${COPY_ENTRENAMIENTO.registrada} · ${etiquetaDeCondicionRegistrada({ sessionCondition: condicion })}`, registrada: true };
}

/**
 * Términos que ninguna pantalla de entrenamiento puede mostrar (B10-06:110-115, 587-591, 917-921, 963-966,
 * 1196-1204; B10-10:56, 134). Los inequívocos van como lista; los dos casos ambiguos —«No realizada» y `%`— los
 * resuelven `vistaDeOcurrencia` y la regla de abajo.
 */
export const TERMINOS_PROHIBIDOS_DE_ENTRENAMIENTO: readonly string[] = [
  'score',
  'puntaje',
  'cumplimiento',
  'incumplimiento',
  'adherencia',
  'fallaste',
  'incumplidor',
  'disciplinado',
  'mal rendimiento',
  'riesgo alto',
  'fatiga',
  'programa óptimo',
  'mejor ejercicio',
  'recomendación be',
  'progresar',
  'rpe prescripto',
  'volumen',
  'marca personal',
  'efectividad',
];

export function terminosProhibidosDeEntrenamientoEn(texto: string): string[] {
  const t = texto.toLowerCase();
  const hallados = TERMINOS_PROHIBIDOS_DE_ENTRENAMIENTO.filter((p) => t.includes(p));
  // `%` solo como criterio de prescripción: «% RM» (B10-06:418-423). Cualquier otro porcentaje es cumplimiento.
  if (/%(?!\s*rm)/.test(t)) hallados.push('%');
  // «Intensidad 80 kg»: la carga rotulada como intensidad (B10-06:1202).
  if (/intensidad\s*:?\s*\d+([.,]\d+)?\s*(kg|lb)/.test(t)) hallados.push('carga como intensidad');
  return hallados;
}
