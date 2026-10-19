/**
 * Las pistas del espacio profesional (DL-146; Dirección, 2026-10-19): el texto corto que aparece al pasar el mouse por un
 * título o una acción, o al llegarle con el teclado (`apps/web/src/components/pista.tsx`).
 * - Una frase cada una, con las palabras de la pantalla.
 * - Dicen qué hace una acción o qué quiere decir un término. Nada de lo que hace falta para decidir va solo acá: eso está
 *   en la vista (GUIA-UX-UI I.2). Lo largo va a la ayuda de la vista o a la Guía.
 * - El acceso se dice sin la causa cuando BE no la muestra (UC-I02 E05; 10-B04 §41).
 */
export const COPY_PISTAS = {
  ficha: {
    pedirInformacion: 'Le pedís que complete un formulario, para un fin que elegís. Responder es decisión de la persona.',
    notaDeCoordinacion: 'Un mensaje para los otros profesionales que acompañan a esta persona.',
    actualizar: 'Vuelve a leer todo lo que muestra esta pantalla.',
  },
  /** Las vistas de la ficha. */
  vistas: {
    resumen: 'Lo pendiente con esta persona y los indicadores del período.',
    linea: 'Qué pasó y cuándo, día por día.',
    analizar: 'Gráficos de hasta tres métricas en el mismo tiempo.',
  },
  /** Las secciones de cada área. */
  secciones: {
    resumen: 'El objetivo, el plan vigente y lo pendiente de esta área.',
    plan: 'Lo indicado: el plan vigente, sus versiones y la que estés preparando.',
    registrosDeComidas: 'Lo que registró la persona, comida por comida, frente a lo indicado.',
    registrosDeSesiones: 'Las sesiones que registró la persona, serie por serie, frente a lo indicado.',
    revisiones: 'Tus revisiones: qué miraste, qué observaste y qué decidiste.',
    tomas: 'Las tomas registradas, con sus mediciones y sus resultados.',
    evolucion: 'Cada medición en el tiempo, una métrica por vez.',
    lamina: 'Una imagen con las medidas sobre la figura, para compartir.',
    solicitudes: 'Lo que le pediste a la persona y lo que respondió.',
  },
  /** El estado del acceso de un área, en el encabezado. */
  acceso: {
    conAcceso: 'Ves lo que la persona registra en esta área mientras el vínculo y su autorización sigan vigentes.',
    pendiente: 'La persona todavía no autorizó que veas sus datos de esta área.',
    noDisponible: 'Por ahora no podés ver los datos de esta área.',
    pausado: 'El vínculo está en pausa: mientras tanto no ves sus datos.',
    revocado: 'La persona retiró su autorización para esta área.',
    finalizado: 'El vínculo terminó.',
  },
  plan: {
    nuevaVersion: 'La versión activa no se edita: la nueva parte de ella y rige recién cuando la actives.',
  },
  revision: {
    preparar: 'Abre la revisión con el período desde la última. No registra nada hasta que lo confirmes.',
    registrar: 'Queda registrada. El plan no cambia hasta que la apliques.',
  },
  resumen: {
    elegirIndicadores: 'Elegí hasta cuatro. Valen para todas las personas que acompañás.',
  },
} as const;
