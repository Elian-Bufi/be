/**
 * «Empezar el plan» (pedido de Dirección del 2026-10-18; DEUDA_LEGAJO DL-145). Para planificar, BE exige un objetivo
 * vigente, y el objetivo se funda en una evaluación (B10-06; 09v10:613). La regla se queda; lo que cambia es que el
 * profesional ya no tiene que descubrir el orden: el Plan vacío muestra los tres pasos, en orden, en la misma pantalla.
 * Es el mismo texto en Nutrición y en Entrenamiento.
 */
export const COPY_PRIMER_PLAN = {
  titulo: 'Empezar el plan',
  pasoEvaluacion: 'Evaluación inicial',
  pasoObjetivo: 'Objetivo',
  pasoPlan: 'Plan',
  registrarEvaluacion: 'Registrar la evaluación',
  definirObjetivo: 'Definir el objetivo',
  /** La última evaluación registrada, con su día. */
  evaluacionLista: (dia: string): string => `Registrada el ${dia}.`,
  objetivoListo: (dia: string): string => `Vigente desde el ${dia}.`,
  despuesDeLaEvaluacion: 'Después de la evaluación.',
  despuesDelObjetivo: 'Después del objetivo.',
  /** Pedirle a la persona lo que ya puede contar (RF-071): la evaluación lo cita después (DL-102). */
  pedirInformacion: 'Pedir información a la persona',
  pasoListo: 'Listo',
  /** El aviso al definir el objetivo desde «Empezar el plan»: lo que sigue está en la misma pantalla. */
  objetivoDefinido: 'Objetivo definido. Sigue el plan.',
} as const;
