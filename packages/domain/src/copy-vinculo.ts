/**
 * Copy de WP-03, compartido por el website y el APK (10-B11:51). Literal de 10-B04 (vínculo y consentimiento) y 10-B02
 * (A3), con la cita al lado. Donde el 10 no tiene copy, mensajes neutrales sin códigos técnicos (DEUDA_LEGAJO DL-024).
 *
 * Prohibido (10-B04 §44-§46; 10-B02; 10-B10):
 * - «Aceptar y compartir datos» y «Ahora [Profesional] puede ver todos tus datos»;
 * - «Bloquear profesional», «Eliminar datos», «Restaurar acceso» y «Escribí FINALIZAR»;
 * - `B2=true`, `PDP=DENY`, `SCOPE_MISMATCH` y cualquier código interno;
 * - «Paciente», «modo lectura histórica» y «Datos ocultos: …».
 */
export const COPY_VINCULO = {
  // ─── Solicitud y aceptación (10-B04 §7-§9) ──────────────────────────────────────────────────
  /** 10-B04:250-251. */
  detalleDeSolicitud: 'Esta solicitud propone iniciar un vínculo profesional. Aceptar el vínculo no autoriza todavía el acceso a tus datos.',
  /** 10-B04:256-258. */
  aceptarVinculo: 'Aceptar vínculo',
  rechazarSolicitud: 'Rechazar solicitud',
  /** 10-B04:265. */
  confirmarAceptacion: (profesional: string, alcance: string) =>
    `Vas a iniciar un vínculo con ${profesional} para ${alcance}. Después podrás revisar qué datos necesita y decidir si autorizás ese acceso.`,
  /** 10-B04:294-303. */
  vinculoAceptado: 'Vínculo aceptado',
  /**
   * Pedido de Dirección del 2026-10-17: decir desde acá que el acceso necesita la autorización al profesional y, si
   * todavía no se dio, la del tratamiento de datos de salud (A3). Las dos son actos aparte; ninguna se da sola.
   */
  vinculoAceptadoDetalle:
    'Ahora revisá qué información solicita el profesional antes de autorizar el acceso. Para que pueda acompañarte también hace falta que autorices el tratamiento de tus datos de salud, si todavía no lo hiciste.',
  revisarConsentimiento: 'Revisar consentimiento',
  /** 10-B04:323. */
  solicitudRechazada: 'Solicitud rechazada',

  // ─── Consentimiento B2 (10-B04 §10-§14) ─────────────────────────────────────────────────────
  /** 10-B04:367-374, resumen humano. */
  quiereAcceder: 'quiere acceder a información necesaria para:',
  dentroDe: 'dentro de:',
  /** 10-B04:398 — aclaración obligatoria. */
  aclaracionDeConsentimiento: 'Solo podrá acceder a la información autorizada mientras el vínculo y este consentimiento sigan vigentes.',
  /** 10-B04:406. */
  verDetalleCompleto: 'Ver detalle completo',
  /** 10-B04:436 (CAND-10-CON-A: acto explícito, sin casilla premarcada). */
  autorizarAcceso: 'Autorizar acceso',
  /** 10-B04:472-486. */
  accesoAutorizado: 'Acceso autorizado',
  verVinculo: 'Ver vínculo',
  /** 08 §12.3: aviso del perfil del profesional en CON-01 (`professionalProfileDisclosure.notice`). */
  avisoDePerfil: {
    SANITARIO: 'Es un profesional de la salud: trata tu información en el marco de la relación profesional sanitaria, con deber de secreto profesional.',
    NO_SANITARIO: 'No es un profesional de la salud. Solo puede acceder a la información pertinente para esta finalidad y tiene deber de confidencialidad.',
  },
  /** Sin categorías de dominio todavía (DL-039): se dice, no se inventa una lista. */
  sinCategoriasTodavia: 'Las categorías de información se definen cuando el servicio de este alcance esté disponible.',

  // ─── Revocación de B2 (10-B04 §18-§19) ──────────────────────────────────────────────────────
  /** 10-B04:580. */
  revocarAccesoDe: (profesional: string) => `Revocar acceso de ${profesional}`,
  /** 10-B04:585 — explicación obligatoria. */
  explicacionDeRevocacion:
    'Este consentimiento dejará de habilitar el acceso futuro asociado a este alcance y finalidad. Tu historial no se borra y el vínculo no se finaliza automáticamente.',
  /** 10-B04:590-592. */
  volver: 'Volver',
  revocarAcceso: 'Revocar acceso',
  /** 10-B04:605-618. «debe» es deliberado: la UI no afirma lo que decide el servidor. */
  accesoRevocado: 'Acceso revocado',
  accesoRevocadoDetalle: 'El profesional ya no debe poder acceder mediante este consentimiento.',
  vinculoContinua: 'El vínculo continúa en su estado actual.',
  /** Reotorgar y aceptar una versión nueva: el 10-B04 no tiene copy; derivado de A3 «Autorizar nuevamente» (DL-024). */
  autorizarNuevamente: 'Autorizar nuevamente',
  versionNuevaDeConsentimiento: 'Hay una versión nueva de este consentimiento. Revisala antes de decidir: aceptar una versión no acepta las futuras.',

  // ─── Pausa, reanudación y finalización (10-B04 §22-§27) ─────────────────────────────────────
  /** 10-B04:683-688. */
  pausarVinculo: 'Pausar vínculo',
  explicacionDePausa:
    'Mientras el vínculo esté pausado, el profesional no tendrá acceso al contenido del asesorado mediante este vínculo. La historia se conserva.',
  /** 10-B04:705-714. */
  vinculoPausado: 'Vínculo pausado',
  accesoProfesionalBloqueado: 'Acceso profesional bloqueado',
  reanudarVinculo: 'Reanudar vínculo',
  finalizarVinculo: 'Finalizar vínculo',
  /** 10-B04:728. */
  explicacionDeReanudacion:
    'Reanudar el vínculo no restaura automáticamente permisos anteriores. BE volverá a comprobar el consentimiento y las condiciones vigentes cuando se intente acceder.',
  /** 10-B04 §24, «en lenguaje más simple para el usuario». */
  reanudacionSimple: 'Al reanudar, el acceso dependerá de que las autorizaciones necesarias sigan vigentes.',
  /** Éxito de la reanudación: el 10 no lo diseña (DL-024). */
  vinculoReanudado: 'Vínculo reanudado',
  /** CON-02 sobre un consentimiento vigente con la misma versión: nada que decidir (DL-024). */
  yaAutorizado: 'Ya autorizaste este acceso con la versión vigente.',
  /** Solo reanuda quien pausó (DL-033). Sin copy en el 10. */
  soloReanudaQuienPauso: 'Este vínculo lo pausó la otra parte. Solo quien lo pausó puede reanudarlo.',
  /** 10-B04:753-758. */
  finalizarVinculoCon: (profesional: string) => `Finalizar vínculo con ${profesional}`,
  consecuenciaDeFinalizar: 'El profesional perderá el acceso futuro asociado a este vínculo. Tu historial se conserva según las reglas de BE.',
  /** 10-B04:792-799. */
  vinculoFinalizado: 'Vínculo finalizado',
  vinculoFinalizadoDetalle: (profesional: string) => `${profesional} ya no tiene acceso futuro mediante este vínculo.`,
  historialDisponible: 'Tu historial continúa disponible para vos según corresponda.',
  /** Motivo (DL-033): el 10 no lo diseña; etiqueta neutral. */
  motivo: 'Motivo',

  // ─── A3 (10-B02 §7-§11) ─────────────────────────────────────────────────────────────────────
  /** 10-B02:276-280. */
  autorizarA3: 'Autorizar tratamiento de mis datos de salud',
  ahoraNo: 'Ahora no',
  /** 10-B02:392-405. */
  revocarA3: 'Revocar autorización de datos de salud',
  explicacionDeRevocacionA3:
    'Al revocar, BE deja de permitir nuevas operaciones sensibles asociadas a este consentimiento. La revocación no borra inmediatamente tu historial ni finaliza tus vínculos. El tratamiento posterior de los datos sigue la política de privacidad aplicable.',
  confirmarRevocacion: 'Confirmar revocación',
  a3Revocada: 'Autorización revocada.',
  a3RevocadaDetalle:
    'Las funciones que requieren tratamiento de datos de salud quedaron bloqueadas. Podés revisar tus opciones de privacidad y, cuando corresponda, volver a autorizar mediante un nuevo acto.',
  /** 10-B02:539. */
  historialA3Vacio: 'Todavía no hay actos registrados de autorización de datos de salud.',
  /** 10-B02 §11: reotorgar es un acto nuevo; la historia anterior permanece. */
  autorizarA3Nuevamente: 'Autorizar nuevamente',
  /** Éxito de CON-06: el 10-B02 no lo diseña (DL-024). */
  a3Otorgada: 'Autorización registrada.',

  // ─── Estados (10-B04 §28-§29, §38; H10-04-04) ───────────────────────────────────────────────
  /** 10-B04:654-668, estados de vínculo en la UI. */
  estadoDeVinculo: { ACEPTADO: 'Activo', PAUSADO: 'Pausado', FINALIZADO: 'Finalizado' },
  estadoDeSolicitud: { PENDIENTE: 'Pendiente', ACEPTADA: 'Aceptada', RECHAZADA: 'Rechazada', CADUCADA: 'Caducada', INVALIDADA: 'Sin efecto' },
  /** 10-B04:538-553. «No efectivo»: activo pero el vínculo no permite el acceso, sin sugerir revocación. */
  estadoDeConsentimiento: { ACTIVE: 'Activo', REVOKED: 'Revocado', NO_EFECTIVO: 'No efectivo', REQUIRED: 'Pendiente de tu decisión' },
  /** 10-B04:825-846; H10-04-04 (10-B04:1489-1491). */
  accesoContextual: 'Activo · acceso contextual',
  accesoPendiente: 'Acceso pendiente de autorización',
  accesoNoDisponible: 'Acceso no disponible',
  pausadoSinAcceso: 'Pausado · sin acceso',
  vinculoActivoAccesoPendiente: 'Vínculo activo',
  accesoPendienteDelAsesorado: 'Acceso pendiente de autorización del asesorado',

  // ─── El paso que falta para el acceso (pedido de Dirección del 2026-10-17) ─────────────────────
  /**
   * Asesorado: autorizó al profesional, pero sin A3 vigente el acceso no es efectivo (RF-023). Es su propio dato, así
   * que se le dice qué falta y dónde se da. A3 sigue siendo un acto aparte: el aviso no lo otorga ni lo presupone.
   */
  faltaUnPaso: 'Falta un paso',
  faltaElTratamientoDeDatos:
    'Para que tus profesionales puedan ver tus datos, falta que autorices el tratamiento de datos de salud. Es una autorización aparte, y la decidís vos.',
  irAPrivacidad: 'Ir a Privacidad',
  /** El último paso del recorrido de aceptar, con el bloque A3 de Privacidad. */
  ultimoPasoTitulo: 'Último paso: tus datos de salud',
  ultimoPasoListo: 'Listo',
  ultimoPasoListoDetalle: 'Autorizaste el tratamiento de tus datos de salud. De tu parte, ya no falta nada.',
  /** Inicio: un vínculo aceptado al que le falta un paso de la persona (su autorización, o la A3). */
  inicioAccesoIncompletoTitulo: 'Tu profesional todavía no puede ver tus datos',
  inicioFaltaAutorizar: (profesional: string, alcance: string) => `${profesional} (${alcance}): falta que autorices su acceso.`,
  inicioFaltaElTratamiento: (profesional: string, alcance: string) => `${profesional} (${alcance}): falta el tratamiento de tus datos de salud.`,
  completarElPaso: 'Completar',
  /**
   * Profesional: la ficha de alguien con un vínculo vigente que hoy no deja leer. No dice por qué (UC-I02 E05): la A3,
   * una suspensión o una habilitación retirada se ven igual. La pista es general: el caso más común es una persona que
   * recién se vinculó y no terminó sus autorizaciones (Dirección, 2026-10-17).
   */
  sinAccesoPorAhora:
    'Por ahora no tenés acceso a la información de esta persona. Si se vinculó hace poco, puede que todavía no haya completado sus autorizaciones en la app. Cuando cambie, la ficha se completa al actualizar.',

  // ─── No revelable, vista parcial y conflictos (10-B04 §40; 10-B10) ──────────────────────────
  /** 10-B04:1150-1156 (asesorado). */
  noPudimosAbrir: 'No pudimos abrir este contenido.',
  /** 10-B10:407 (profesional). No distingue inexistente, ajeno, revocado ni finalizado. */
  recursoNoDisponible: 'No encontramos un recurso disponible para esta acción.',
  /** 10-B04:1174; 10-B10:386. */
  vistaParcial: 'Vista parcial según tu acceso actual.',
  /** RF-053: los faltantes se muestran como tales (sin dominios en WP-03). */
  sinDatosTodavia: 'Sin datos registrados todavía.',
  /** 10-B10:424. */
  contenidoCambio: 'Este contenido cambió desde que lo abriste. Actualizá la vista antes de volver a intentar.',
  /** 10-B08:337 (lista mínima del profesional, sin Cartera: DL-041). */
  sinAsesorados: 'Todavía no tenés asesorados activos en este contexto.',
  sinSolicitudes: 'Todavía no hay solicitudes.',
  sinVinculos: 'Todavía no tenés vínculos.',
  sinConsentimientos: 'Todavía no otorgaste consentimientos a profesionales.',

  // ─── Solicitud desde el profesional (10-B04 §5; DL-035, DL-041) ─────────────────────────────
  solicitarVinculo: 'Solicitar vínculo',
  identificadorDelAsesorado: 'Identificador BE del asesorado',
  ayudaIdentificador: 'Pedíselo a la persona: lo ve en su cuenta, en «Tu identificador BE».',
  tuIdentificador: 'Tu identificador BE',
  ayudaTuIdentificador: 'Compartilo solo con el profesional con quien quieras iniciar un vínculo. Por sí solo no le da acceso a nada.',
  alcance: 'Alcance',
  finalidad: 'Finalidad',
  solicitudEnviada: 'Solicitud enviada. El asesorado decide si la acepta.',
  solicitudYaPendiente: 'Ya hay una solicitud pendiente igual. Te mostramos esa.',
  /** 422 de REL-01 sin copy en el 10: neutral (DL-024). */
  solicitudNoDisponible: 'No pudimos enviar la solicitud con esos datos. Revisá el identificador y el alcance.',
  /** «Guardando...» (10-B04:1125) con el verbo del efecto (patrón de WP-02, DL-024). */
  enviando: 'Enviando…',
  procesando: 'Procesando…',
} as const;

// ─── Historial mínimo (10-B04:627-638) ────────────────────────────────────────────────────────
/**
 * Cada hecho del historial con una etiqueta humana: la UI nunca muestra el nombre técnico del evento. Las claves son
 * los eventos de las tres máquinas del 06 (§7.3.2, §7.5.2, §7.7.5); una prueba verifica que no falte ninguno.
 */
export const ETIQUETA_DE_EVENTO_DE_VINCULO: Readonly<Record<string, string>> = {
  SolicitudDeVinculoCreada: 'Solicitud enviada',
  SolicitudDeVinculoAceptada: 'Solicitud aceptada',
  SolicitudDeVinculoRechazada: 'Solicitud rechazada',
  SolicitudDeVinculoCaducada: 'Solicitud caducada',
  SolicitudDeVinculoInvalidada: 'Solicitud sin efecto',
  AlcanceDeVinculoAceptado: 'Vínculo iniciado',
  AlcanceDeVinculoPausado: 'Vínculo pausado',
  AlcanceDeVinculoReanudado: 'Vínculo reanudado',
  AlcanceDeVinculoFinalizado: 'Vínculo finalizado',
  ConsentimientoOtorgado: 'Acceso autorizado',
  NuevaVersionDeConsentimientoAceptada: 'Nueva versión del consentimiento aceptada',
  ConsentimientoRevocado: 'Acceso revocado',
  ConsentimientoOtorgadoNuevamente: 'Acceso autorizado nuevamente',
};

/** Un evento que esta versión de la UI no conoce se muestra sin su nombre técnico. */
export function etiquetaDeEvento(evento: string): string {
  return Object.hasOwn(ETIQUETA_DE_EVENTO_DE_VINCULO, evento) ? (ETIQUETA_DE_EVENTO_DE_VINCULO[evento] as string) : 'Cambio registrado';
}

export type ParteQueMira = 'PROFESSIONAL' | 'ADVISEE';

/** Quién hizo cada cambio, dicho desde la parte que mira. `SYSTEM` es BE (vencimiento, cierre de cuenta). */
export function etiquetaDeActor(actor: 'PROFESSIONAL' | 'ADVISEE' | 'SYSTEM', quienMira: ParteQueMira): string {
  if (actor === 'SYSTEM') return 'BE';
  if (actor === quienMira) return 'Vos';
  return actor === 'PROFESSIONAL' ? 'El profesional' : 'El asesorado';
}

// ─── Estado de acceso para mostrar (10-B04 §28-§29, §15; H10-04-04) ─────────────────────────
export interface EstadoParaMostrar {
  readonly estado: string;
  readonly detalle: string | null;
}

interface EstadoDeUnVinculo {
  readonly relationshipState: 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO';
  readonly consentState: 'REQUIRED' | 'ACTIVE' | 'REVOKED';
  readonly accessMode: 'BLOCKED' | 'CONTEXTUAL';
}

/**
 * «Header → estado de vínculo → estado mínimo de autorización» (10-B04 §28), igual en el website y en el APK.
 * - Profesional: los estados de H10-04-04. «Acceso no disponible» no dice por qué: una suspensión, la A3 revocada o
 *   una habilitación retirada se ven igual (UC-I02 E05). Nunca `B2=true` ni `PDP=DENY`.
 * - Asesorado: el estado del vínculo y el de su consentimiento. «No efectivo» es un consentimiento activo que hoy no
 *   habilita el acceso, sin sugerir que fue revocado (10-B04:538-553).
 */
export function estadoParaMostrar(v: EstadoDeUnVinculo, quienMira: ParteQueMira): EstadoParaMostrar {
  if (quienMira === 'PROFESSIONAL') {
    if (v.relationshipState === 'FINALIZADO') return { estado: COPY_VINCULO.estadoDeVinculo.FINALIZADO, detalle: null };
    if (v.relationshipState === 'PAUSADO') return { estado: COPY_VINCULO.pausadoSinAcceso, detalle: null };
    if (v.consentState === 'REQUIRED') return { estado: COPY_VINCULO.vinculoActivoAccesoPendiente, detalle: COPY_VINCULO.accesoPendienteDelAsesorado };
    if (v.consentState === 'REVOKED') return { estado: 'Consentimiento revocado', detalle: COPY_VINCULO.accesoNoDisponible };
    if (v.accessMode === 'CONTEXTUAL') return { estado: COPY_VINCULO.accesoContextual, detalle: null };
    return { estado: COPY_VINCULO.vinculoActivoAccesoPendiente, detalle: COPY_VINCULO.accesoNoDisponible };
  }
  return { estado: COPY_VINCULO.estadoDeVinculo[v.relationshipState], detalle: `Consentimiento: ${etiquetaDeConsentimiento(v.consentState, v.accessMode).toLowerCase()}` };
}

/** Estado del consentimiento en la pantalla del asesorado (10-B04:538-553). */
export function etiquetaDeConsentimiento(estado: 'REQUIRED' | 'ACTIVE' | 'REVOKED', accessMode: 'BLOCKED' | 'CONTEXTUAL'): string {
  if (estado === 'ACTIVE') return accessMode === 'CONTEXTUAL' ? COPY_VINCULO.estadoDeConsentimiento.ACTIVE : COPY_VINCULO.estadoDeConsentimiento.NO_EFECTIVO;
  return COPY_VINCULO.estadoDeConsentimiento[estado];
}

/**
 * WP-INVITACION (DEUDA_LEGAJO DL-136): la invitación del profesional por enlace, QR o código, decidida por Dirección el
 * 2026-10-16. Acorta el camino hasta la pregunta del 10-B04, no la reemplaza: la persona igual ve `confirmarAceptacion`
 * y decide, y el acceso a sus datos sigue siendo el consentimiento aparte.
 */
export const COPY_INVITACION = {
  // ─── El profesional, en el website ─────────────────────────────────────────────────────────
  invitar: 'Invitar a una persona',
  ayuda: 'Creá una invitación y mandásela por WhatsApp, mostrale el QR o pasale el código. Es para una sola persona y vence a los 7 días.',
  area: 'Área',
  elegirArea: 'Elegí un área',
  crear: 'Crear invitación',
  creando: 'Creando la invitación…',
  lista: 'La invitación está lista',
  soloAhora: 'El enlace y el código se muestran solo ahora. Si los perdés, creá otra invitación y anulá esta.',
  enlace: 'Enlace',
  copiarEnlace: 'Copiar enlace',
  copiarMensaje: 'Copiar mensaje',
  copiado: 'Copiado',
  compartirPorWhatsApp: 'Compartir por WhatsApp',
  compartir: 'Compartir…',
  qr: 'Código QR',
  qrAyuda: 'Que lo escanee con la cámara del teléfono.',
  codigo: 'Código',
  codigoAyuda: 'Si el enlace no abre la app: en BE, Cuenta → «Tengo un código».',
  vence: (fecha: string) => `Vence el ${fecha}.`,
  mensaje: (area: string, enlace: string, codigo: string, vence: string) =>
    `Hola. Te invito a hacer tu seguimiento de ${area} en BE. Abrí este enlace desde tu teléfono: ${enlace}\nSi la app te pide un código, es ${codigo}. La invitación vence el ${vence}.`,
  otraInvitacion: 'Crear otra',
  tusInvitaciones: 'Tus invitaciones',
  sinInvitaciones: 'Todavía no creaste invitaciones.',
  estado: { PENDING: 'Pendiente', USED: 'Usada', EXPIRED: 'Vencida', REVOKED: 'Anulada' },
  anular: 'Anular',
  anulada: 'La invitación quedó anulada: el enlace y el código ya no sirven.',
  conElIdentificador: '¿Ya tenés su identificador BE? Solicitá el vínculo directo.',

  // ─── La persona que recibe el enlace, en el website (/invitacion) ──────────────────────────
  paginaTitulo: 'Te invitaron a BE',
  paginaTexto: 'Un profesional te invitó a hacer tu seguimiento en BE. Para ver quién es y responder, abrí la invitación en la app.',
  abrirEnLaApp: 'Abrir en la app BE',
  descargar: 'Descargar BE para Android',
  despuesDeInstalar: 'Después de instalarla, volvé a tocar el enlace de la invitación.',
  desdeLaComputadora: 'Si estás en una computadora, abrí este enlace desde el teléfono donde tenés BE, o escaneá este código con su cámara.',
  sinInvitacion: 'Este enlace no trae una invitación. Pedile al profesional que te la mande de nuevo, o escribí el código en la app: Cuenta → «Tengo un código».',

  // ─── La persona, en la APK ─────────────────────────────────────────────────────────────────
  tengoUnCodigo: 'Tengo un código',
  escribirCodigo: 'Código de la invitación',
  codigoEjemplo: 'Por ejemplo, ABCD-2345.',
  verInvitacion: 'Ver invitación',
  buscando: 'Buscando la invitación…',
  teInvita: (profesional: string, area: string) => `${profesional} te invita a acompañarte en ${area}.`,
  queSigue: 'Si aceptás, empieza el vínculo. Después vas a ver qué información necesita y vas a decidir si autorizás el acceso.',
  aceptar: 'Aceptar invitación',
  ahoraNo: 'Ahora no',
  noEncontrada: 'No encontramos esa invitación. Revisá el código o pedile al profesional que te mande otra.',
  vencida: 'Esta invitación venció. Pedile al profesional que te mande otra.',
  usada: 'Esta invitación ya se usó. Pedile al profesional que te mande otra.',
  anuladaParaLaPersona: 'El profesional anuló esta invitación.',
  propia: 'Esta invitación es tuya: mandásela a la persona que querés acompañar.',
  yaVinculados: 'Ya tenés un vínculo vigente con este profesional para esa área.',
  muchosIntentos: 'Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.',
  despuesDeEntrar: 'Iniciá sesión o creá tu cuenta para ver la invitación.',
} as const;
