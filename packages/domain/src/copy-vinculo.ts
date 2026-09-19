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
  vinculoAceptadoDetalle: 'Ahora revisá qué información solicita el profesional antes de autorizar el acceso.',
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
