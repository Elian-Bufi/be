/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185): los textos de los formularios vinculados a la evaluación inicial, iguales en
 * Nutrición y en Entrenamiento. Ubicar, nunca calificar: la fecha de lo que respondió la persona y si hay una versión más
 * nueva, sin colores de alerta ni juicios. Nunca «asesorado» (la persona).
 */
export const COPY_EVALUACION_Y_FORMULARIOS = {
  /** Al registrar la evaluación: los formularios que se pueden vincular. */
  paraVincular: 'Formularios que respondió (opcional)',
  ayudaParaVincular:
    'Vinculá los que usás para esta evaluación. Queda la referencia a lo que respondió, con su fecha: sus respuestas no se copian y la persona no ve nada nuevo en su app.',
  ningunoParaVincular: 'Todavía no respondió ningún formulario que le hayas pedido en esta área.',
  noSePudieronLeer: 'No se pudieron leer sus formularios. La evaluación se puede registrar igual.',
  volverALeer: 'Volver a leer',
  vincularEste: (nombre: string): string => `Vincular «${nombre}»`,
  /** En la evaluación registrada. */
  vinculados: 'Formularios vinculados',
  sinVinculados: 'Ninguno vinculado.',
  vincularOtro: 'Vincular un formulario',
  vincular: 'Vincular',
  vincularElegidos: (n: number): string => (n === 1 ? 'Vincular el elegido' : `Vincular los ${n} elegidos`),
  cancelar: 'Cancelar',
  desvincular: 'Desvincular',
  desvincularEste: (nombre: string): string => `Desvincular «${nombre}»`,
  verRespuestas: 'Ver respuestas',
  ocultarRespuestas: 'Ocultar respuestas',
  respondido: (dia: string): string => `Respondido el ${dia}`,
  corregido: (dia: string): string => `Corregido por la persona el ${dia}`,
  vinculadoEl: (dia: string): string => `vinculado el ${dia}`,
  /** EVF-D04: la persona respondió una versión más nueva después de vincular. */
  hayUnaMasNueva: (dia: string): string => `La persona registró una versión más nueva el ${dia}. La evaluación conserva la que vinculaste.`,
  vincularLaMasNueva: 'Vincular la más nueva',
  respuestasDeLaVersion: (dia: string): string => `Lo que respondió, en la versión vinculada (${dia}). Declarado por la persona.`,
  cargando: 'Cargando…',
  /** Avisos. */
  vinculado: 'Formulario vinculado.',
  vinculadosVarios: (n: number): string => `${n} formularios vinculados.`,
  desvinculado: 'Formulario desvinculado. La evaluación ya no lo cita.',
  versionCambiada: 'Un formulario cambió desde que lo viste: volvé a leer la lista y elegilo de nuevo. No se vinculó ninguno.',
  noSeVincularon: 'La evaluación quedó registrada, pero los formularios no se vincularon. Podés vincularlos desde acá.',
  tope: (n: number): string => `Se pueden vincular hasta ${n} formularios por evaluación.`,
  todosVinculados: 'Ya vinculaste todos los formularios que respondió en esta área.',
} as const;
