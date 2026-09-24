/**
 * Copy de nutrición para el website y el APK (B10-05; adenda de formularios). Lo literal de B10-05 va tal cual; lo que
 * B10-05 no escribe sigue su criterio: describir, no calificar, y nunca decir lo que BE no hace (BE no calcula, no
 * diagnostica y no puntúa).
 *
 * `TERMINOS_PROHIBIDOS_DE_NUTRICION` es la lista que verifica una prueba sobre todo el copy (T13; REG-06-125;
 * B05:171-177, 900-903, 1102, 1120, 1539; B01:441).
 */
import type { EstadoDePreparacion } from './nutricion';

export const ETIQUETA_DE_PREPARACION: Readonly<Record<EstadoDePreparacion, string>> = {
  RAW: 'Crudo',
  COOKED: 'Cocido',
  AS_PURCHASED: 'Tal como se adquiere',
};

export const ETIQUETA_DE_UNIDAD: Readonly<Record<'g' | 'ml' | 'unit', string>> = { g: 'g', ml: 'ml', unit: 'unidad' };

export const ETIQUETA_DE_FUENTE: Readonly<Record<'REPORTED' | 'OBSERVED' | 'CALCULATED', string>> = {
  REPORTED: 'Informado por el asesorado',
  OBSERVED: 'Observado por el profesional',
  CALCULATED: 'Calculado (con método declarado)',
};

/** B05:1197-1204. */
export const ETIQUETA_DE_RESULTADO: Readonly<Record<'MAINTAIN' | 'ADJUST' | 'REPLACE' | 'RESCHEDULE_REVIEW' | 'CHANGE_OBJECTIVE' | 'FINALIZE', string>> = {
  MAINTAIN: 'Mantener',
  ADJUST: 'Ajustar',
  REPLACE: 'Sustituir',
  RESCHEDULE_REVIEW: 'Reprogramar revisión',
  CHANGE_OBJECTIVE: 'Cambiar objetivo',
  FINALIZE: 'Finalizar',
};

/** Qué pasa al aplicar cada resultado, en lenguaje llano (REG-06-147; B05:1240-1295). */
export const EFECTO_VISIBLE_DE_RESULTADO: Readonly<Record<keyof typeof ETIQUETA_DE_RESULTADO, string>> = {
  MAINTAIN: 'El plan sigue igual. Se registra la próxima acción.',
  ADJUST: 'Se prepara una nueva versión del plan en borrador. La versión activa no cambia hasta que actives la nueva.',
  REPLACE: 'Se prepara una versión sucesora en borrador. La versión actual se conserva en el historial.',
  RESCHEDULE_REVIEW: 'Se fija una nueva fecha de revisión. El plan no cambia.',
  CHANGE_OBJECTIVE: 'Se emite una nueva versión del objetivo. El plan se ajusta aparte, con un borrador nuevo.',
  FINALIZE: 'Se cierra el seguimiento nutricional. La historia se conserva; no es «Eliminar plan».',
};

export const COPY_NUTRICION = {
  // Profesional (B10-05 NUT-01 a NUT-16)
  pestana: 'Nutrición',
  resumen: 'Resumen',
  planActivo: 'Plan activo',
  sinPlanActivo: 'Todavía no hay un plan activo.',
  sinObjetivo: 'Todavía no hay un objetivo definido.',
  objetivoDeclarado: 'Objetivo declarado por el profesional',
  noCalcula: 'BE no calcula requerimientos: el objetivo es una decisión profesional con su fundamento.',
  nuevaEvaluacion: 'Nueva evaluación',
  evaluacionRegistrada: 'Evaluación registrada',
  definirObjetivo: 'Definir objetivo',
  nuevaVersionDeObjetivo: 'Nueva versión de objetivo',
  borrador: 'Borrador',
  crearNuevoPlan: 'Crear nuevo plan',
  borradorCreado: 'Borrador creado',
  guardarCambios: 'Guardar cambios',
  guardado: 'Guardado',
  cambiosSinGuardar: 'Cambios sin guardar',
  guardando: 'Guardando…',
  errorAlGuardar: 'Error al guardar',
  validarPlan: 'Validar plan',
  planValido: 'Plan válido',
  hayElementosPorCorregir: 'Hay elementos por corregir',
  activarPlan: 'Activar plan',
  confirmarActivacion:
    'Estás por activar esta versión. El asesorado pasará a consultar esta planificación como vigente. La versión anterior se conservará en el historial.',
  noPudimosActivar: 'No pudimos activar esta versión. Revisá el estado actual antes de volver a intentarlo.',
  soloLectura: 'Solo lectura',
  crearNuevaVersion: 'Crear nueva versión a partir de esta',
  sinCapacidad: 'No hay capacidad disponible para iniciar un nuevo seguimiento. Los seguimientos vigentes no se modifican.',
  estadoDePreparacion: 'Estado de preparación',
  registros: 'Registros',
  prescripto: 'Prescripto',
  registrado: 'Registrado',
  diferenciaObservada: 'Diferencia observada',
  datosFaltantes: 'Datos faltantes',
  sinRegistro: 'Sin registro',
  fueraDelPlan: 'Fuera del plan',
  delPlan: 'Del plan',
  estimacionProfesional: 'Estimación profesional',
  registroOriginal: 'Registro original',
  agregarEstimacion: 'Agregar estimación',
  revisiones: 'Revisiones',
  nuevaRevision: 'Nueva revisión',
  revisionPendiente: 'Revisión pendiente',
  registrarRevision: 'Registrar revisión',
  verNoEsRevisar: 'Abrir esta pantalla no cuenta como revisión: la revisión se registra con «Registrar revisión».',
  interpretacionNoDiagnostica: 'La interpretación describe lo observado. No es un diagnóstico.',
  revisionRegistrada: 'Revisión registrada',
  aplicarContinuidad: 'Aplicar continuidad',
  continuidadAplicada: 'Continuidad aplicada',
  catalogoSintetico: 'Catálogo BE con valores sintéticos de demostración.',
  crearManualmente: 'Crear manualmente',
  // Asesorado (B10-05 NUT-08 a NUT-11)
  tuPlanDeHoy: 'Tu plan de hoy',
  comidasDelPlan: 'Comidas del plan',
  agregarComidaFueraDelPlan: 'Agregar comida fuera del plan',
  registrosDeHoy: 'Registros de hoy',
  sinPlanAsesorado: 'Actualmente no tenés un plan activo de Nutrición.',
  planNoDisponible: 'Tu plan de Nutrición no está disponible en este momento. Revisá el estado del vínculo y de tus autorizaciones en Cuenta.',
  elegiDiaTipo: 'Elegí qué día del plan corresponde hoy',
  registrarComida: 'Registrar comida',
  comidaRegistrada: 'Comida registrada',
  contanosQueComiste: 'Contanos qué comiste.',
  podesDescribirlo: 'Podés describirlo con tus palabras. No hace falta que sea una medición exacta.',
  queComiste: '¿Qué comiste?',
  porcionAproximada: 'Porción aproximada (opcional)',
  noPudimosConfirmar: 'No pudimos confirmar si se guardó. Revisá tus registros antes de volver a intentar.',
  tuDescripcionOriginal: 'Tu descripción original',
  planActual: 'Plan actual',
  sinRegistrosHoy: 'Todavía no registraste comidas hoy.',
  yaRegistrada: 'Esa comida ya está registrada para hoy.',
  planCambio: 'Tu plan se actualizó. Volvé a abrir «Hoy» para ver el vigente.',
  // Error asociado a su campo, además del resumen (B10-10:36, 164-165). El ejemplo lleva coma: acá los números se
  // escriben y se leen como en el país (DL-091 punto 4), y el punto también se acepta.
  cantidadNoEsUnNumero: 'Escribí la cantidad con números, por ejemplo 150 o 12,5.',
  revisaLasCantidades: 'Hay una cantidad que no pudimos leer. Revisá los campos señalados.',
  elegiQueOpcionComiste: 'Elegí qué opción comiste.',
} as const;

/**
 * Términos que no pueden aparecer en ningún texto de nutrición (B05:142, 171-177, 804, 900-903, 959, 1102, 1120, 1539,
 * 1689; B01:441). La comparación es sin mayúsculas.
 */
export const TERMINOS_PROHIBIDOS_DE_NUTRICION: readonly string[] = [
  'adherencia',
  'cumplido',
  'incumplido',
  'cumplimiento',
  '%',
  'puntaje',
  'score',
  'comida trampa',
  'desvío',
  'nutricionalmente correcto',
  'plan saludable',
  'el plan cumple',
  'be recomienda',
  'paciente en riesgo',
  'bien',
  'mal',
];

/** Devuelve los términos prohibidos que aparecen en un texto (palabras completas para las cortas). */
export function terminosProhibidosEn(texto: string): string[] {
  const t = texto.toLowerCase();
  return TERMINOS_PROHIBIDOS_DE_NUTRICION.filter((p) => (p.length <= 4 && /^[a-záéíóúñ]+$/.test(p) ? new RegExp(`(^|[^a-záéíóúñ])${p}([^a-záéíóúñ]|$)`).test(t) : t.includes(p)));
}
