/**
 * Copy de la información profesional pertinente (WP-07; RF-071; 10 Adenda v0.5), compartido por el website y el APK.
 *
 * Tres prohibiciones mandan sobre todo el texto, y son las que el paquete defiende:
 * - **solicitar ≠ consentir, y solicitar ≠ obtener acceso** (05:15098-15099): ninguna pantalla puede sugerir que
 *   pedir algo ya lo concede, ni que el asesorado «debe» responder;
 * - **autoinformado ≠ medición ni diagnóstico** (09 §22.7): lo que responde el asesorado se rotula como declarado
 *   por él, nunca como un dato tomado o interpretado por el profesional;
 * - **no responder es una respuesta legítima**: la ausencia no se muestra como incumplimiento, ni con un cero, ni
 *   con un porcentaje de completitud.
 *
 * `TERMINOS_PROHIBIDOS_DE_FORMULARIOS` lo verifica una prueba sobre este copy y sobre el texto de las pantallas,
 * igual que en nutrición (T13 de WP-04) y en entrenamiento (WP-06).
 */

export const COPY_FORMULARIOS = {
  // ─── Pestaña y navegación ─────────────────────────────────────────────────────────────────────
  pestana: 'Información',
  solicitudes: 'Solicitudes',
  pedirInformacion: 'Pedir información',
  volverAlWorkspace: 'Volver al workspace del asesorado',

  // ─── Catálogo de plantillas ───────────────────────────────────────────────────────────────────
  catalogo: 'Formularios disponibles',
  sinPlantillas: 'Todavía no hay formularios disponibles.',
  plantillaDemostracion: 'Catálogo de demostración: no es un catálogo clínico.',
  campos: 'Campos',
  elegirCampos: 'Elegí qué campos pedir',
  marcarRequerido: 'Requerido',
  ayudaRequerido: 'Un campo requerido igual puede quedar sin responder: el asesorado decide.',
  sinCamposElegidos: 'Elegí al menos un campo para pedir.',

  // ─── Crear la solicitud ───────────────────────────────────────────────────────────────────────
  proposito: 'Para qué lo necesitás',
  ayudaProposito: 'Queda registrado y el asesorado lo ve. Explicá para qué vas a usar esta información.',
  alcance: 'Alcance',
  enviarSolicitud: 'Enviar solicitud',
  solicitudEnviada: 'Solicitud enviada.',
  solicitarNoEsAcceder: 'Pedir información no amplía tu acceso ni el consentimiento: hasta que el asesorado responda, no hay dato nuevo.',

  // ─── Lista y estados ──────────────────────────────────────────────────────────────────────────
  sinSolicitudes: 'Todavía no le pediste información a esta persona.',
  sinSolicitudesPropias: 'No tenés información pendiente de completar.',
  pendiente: 'Sin responder',
  respondida: 'Respondida',
  pedidoEl: 'Pedido el',
  respondidoEl: 'Respondido el',
  pedidoPor: 'Pedido por',
  sinRespuestaTodavia: 'Todavía sin responder. No responder también es una opción.',
  yaNoSePuedeResponder: 'Esta solicitud ya no se puede responder.',

  // ─── Responder (APK) ──────────────────────────────────────────────────────────────────────────
  responder: 'Responder',
  completar: 'Completar',
  opcional: 'Opcional',
  omitirCampo: 'Podés dejarlo en blanco.',
  // Sí/No se elige, no se escribe: lo escrito habría que interpretarlo, y lo mal interpretado queda como declarado
  // por la persona (09 §22.7). Las dos opciones se ven juntas y ninguna viene marcada.
  si: 'Sí',
  no: 'No',
  elegiSiONo: 'Elegí una opción. Podés dejarlo sin responder.',
  volverASinResponder: 'Tocá de nuevo la opción elegida para dejar el campo sin responder.',
  enviarRespuesta: 'Enviar respuesta',
  respuestaEnviada: 'Respuesta enviada.',
  loQueRespondesEsTuyo: 'Lo que respondas queda registrado como declarado por vos.',
  podesNoResponder: 'Podés no responder. No pasa nada si dejás esta solicitud sin completar.',
  faltaRequerido: 'Falta responder un campo marcado como requerido por el profesional.',

  // ─── Rectificar ───────────────────────────────────────────────────────────────────────────────
  rectificar: 'Corregir mi respuesta',
  motivoDeRectificacion: 'Por qué lo corregís',
  rectificacionEnviada: 'Corrección enviada.',
  rectificarConservaHistoria: 'La respuesta anterior se conserva: la corrección se agrega, no la reemplaza.',
  respuestaOriginal: 'Respuesta original',
  correccion: 'Corrección',
  vigente: 'Vigente',

  // ─── Procedencia ──────────────────────────────────────────────────────────────────────────────
  declaradoPorLaPersona: 'Declarado por la persona',
  noEsMedicion: 'Esta información la declaró el asesorado. No es una medición ni un diagnóstico.',
} as const;

/**
 * Lo que este copy no puede decir. `cumplimiento`, `completitud` y `%` porque la ausencia de respuesta no es un
 * incumplimiento que se mida; `obligatorio` porque ningún campo obliga a nadie (el profesional marca lo que le
 * importa, pero el titular decide); `debe responder` por lo mismo; `diagnóstico` y `medición` porque lo
 * autoinformado no es ninguna de las dos (09 §22.7).
 */
export const TERMINOS_PROHIBIDOS_DE_FORMULARIOS: readonly string[] = [
  'cumplimiento',
  'completitud',
  'obligatorio',
  'debe responder',
  'tenés que responder',
  'incumplió',
  'pendiente de cumplir',
];

/**
 * `diagnóstico` y `medición` son el caso interesante: **negarlos es justamente lo que el paquete exige** («no es
 * una medición ni un diagnóstico», 09 §22.7), así que solo cuentan como falta cuando se afirman. Es el mismo
 * tratamiento contextual que `% RM` en entrenamiento.
 */
export function terminosProhibidosDeFormulariosEn(texto: string): string[] {
  const t = texto.toLowerCase();
  const hallados = TERMINOS_PROHIBIDOS_DE_FORMULARIOS.filter((p) => t.includes(p));
  // Cualquier porcentaje: la ausencia de respuesta no se mide.
  if (t.includes('%')) hallados.push('%');
  // «Es un diagnóstico» sí; «no es … un diagnóstico» no.
  for (const palabra of ['diagnóstico', 'medición']) {
    if (t.includes(palabra) && !new RegExp(`\\bno es\\b[^.]*\\b${palabra}`).test(t)) hallados.push(palabra);
  }
  return hallados;
}
