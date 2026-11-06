/**
 * WP-ADMINISTRACION (DL-155): los contratos de la familia ADM, API-ADM-01 a 13. Adaptan PRO-09 a 13 del 09 (09v8:930-1104)
 * a lo que existe en esta versión (D-1: profesionales ya registrados, sin presentaciones) y suman el acceso administrativo
 * con segundo factor (08 §25). IDs propios de BE, familia ADM.
 * - **Nunca un dato de salud** (D-5; 08 §28): del profesional, su identidad profesional; por área, los estados y las
 *   decisiones; de las personas vinculadas, solo cuántas recibirían un aviso.
 * - **Los secretos viajan una sola vez**: la clave del autenticador al configurarlo y los códigos de recuperación al
 *   generarlos. La API no los vuelve a mostrar y no los guarda en claro.
 * - **La búsqueda va en el cuerpo** (API-ADM-10), no en la URL (DL-127).
 */
import { z } from 'zod';
import { DECISIONES_ADMINISTRATIVAS, LARGO_MAXIMO_DEL_FUNDAMENTO, LARGO_MAXIMO_DEL_MENSAJE, SITUACIONES_DE_AREA } from './administracion';
import { AccountOperationalStateSchema, IdOpaco, Instante } from './contratos';
import { AlcanceSchema, PaginaSchema } from './contratos-vinculo';

// ─── El estado del segundo factor de la sesión ──────────────────────────────────────────────────

/**
 * Lo que el servidor dice del segundo factor de la sesión, en cada respuesta del acceso. El website no decide nada con
 * esto por su cuenta: muestra lo que falta.
 * - `VERIFIED`: vigente; `expiresAfterInactivityAt` es cuándo vence si no hay actividad (15 minutos).
 * - `REQUIRED`: falta escribir un código; `deadline`, el límite de los 10 minutos después de la contraseña, o `null` si
 *   la sesión ya lo tuvo y venció por inactividad.
 * - `ENROLLMENT_REQUIRED`: no hay autenticador activo; se configura con el código de incorporación.
 */
export const EstadoDelSegundoFactorSchema = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('VERIFIED'), method: z.enum(['TOTP', 'RECOVERY_CODE', 'ENROLLMENT']), expiresAfterInactivityAt: Instante }),
  z.strictObject({ state: z.literal('REQUIRED'), deadline: Instante.nullable() }),
  z.strictObject({ state: z.literal('ENROLLMENT_REQUIRED'), deadline: Instante }),
]);
export type EstadoDelSegundoFactorApi = z.infer<typeof EstadoDelSegundoFactorSchema>;

export const AdministradorSchema = z.strictObject({ identityId: IdOpaco, displayName: z.string().min(1) });

// ─── API-ADM-01 / ADM-02 — Abrir y reanudar la sesión administrativa ────────────────────────────

/** El primer factor: el correo y la contraseña de la cuenta administrativa. */
export const IniciarSesionAdministrativaRequestSchema = z.strictObject({
  identifier: z.string().max(320),
  credential: z.string().max(1024),
});
export type IniciarSesionAdministrativaRequest = z.infer<typeof IniciarSesionAdministrativaRequestSchema>;

export const SesionAdministrativaResponseSchema = z.strictObject({
  data: z.strictObject({
    session: z.strictObject({ id: IdOpaco, expiresAt: Instante, accessToken: z.string().min(1), tokenType: z.literal('Bearer') }),
    administrator: AdministradorSchema,
    secondFactor: EstadoDelSegundoFactorSchema,
  }),
});
export type SesionAdministrativaResponse = z.infer<typeof SesionAdministrativaResponseSchema>;

// ─── API-ADM-04 — El estado de la propia sesión ─────────────────────────────────────────────────

export const EstadoDeSesionAdministrativaResponseSchema = z.strictObject({
  data: z.strictObject({
    session: z.strictObject({ id: IdOpaco, expiresAt: Instante }),
    administrator: AdministradorSchema,
    secondFactor: EstadoDelSegundoFactorSchema,
    /** Cuántos códigos de recuperación quedan sin usar. `null` mientras el segundo factor no está vigente. */
    recoveryCodesRemaining: z.number().int().nonnegative().nullable(),
  }),
});
export type EstadoDeSesionAdministrativaResponse = z.infer<typeof EstadoDeSesionAdministrativaResponseSchema>;

// ─── API-ADM-05 / ADM-06 — Verificar el segundo factor ──────────────────────────────────────────

/** Los seis dígitos del autenticador; se toleran espacios. */
export const VerificarSegundoFactorRequestSchema = z.strictObject({ code: z.string().max(16) });
export type VerificarSegundoFactorRequest = z.infer<typeof VerificarSegundoFactorRequestSchema>;

/** Un código de recuperación (12 caracteres; se toleran guiones, espacios y minúsculas). */
export const UsarCodigoDeRecuperacionRequestSchema = z.strictObject({ recoveryCode: z.string().max(32) });
export type UsarCodigoDeRecuperacionRequest = z.infer<typeof UsarCodigoDeRecuperacionRequestSchema>;

export const SegundoFactorVerificadoResponseSchema = z.strictObject({
  data: z.strictObject({ secondFactor: EstadoDelSegundoFactorSchema, recoveryCodesRemaining: z.number().int().nonnegative() }),
});
export type SegundoFactorVerificadoResponse = z.infer<typeof SegundoFactorVerificadoResponseSchema>;

/** El 422 de un código que no vale (incorrecto, vencido o ya usado): cuántos intentos le quedan a la sesión. */
export const DetalleDeCodigoInvalidoSchema = z.strictObject({ attemptsRemaining: z.number().int().nonnegative() });

// ─── API-ADM-07 / ADM-08 — Configurar el autenticador ───────────────────────────────────────────

/**
 * Empezar la configuración del autenticador:
 * - la primera vez, o después de un restablecimiento del operador, con el código de incorporación;
 * - para reemplazarlo, con el segundo factor vigente y la contraseña otra vez (08 §25).
 */
export const IniciarConfiguracionRequestSchema = z.strictObject({
  incorporationCode: z.string().max(40).optional(),
  credential: z.string().max(1024).optional(),
});
export type IniciarConfiguracionRequest = z.infer<typeof IniciarConfiguracionRequestSchema>;

/** Lo que se carga en la aplicación de códigos, una sola vez. `otpauthUri` es lo que lleva el QR. */
export const ConfiguracionDelAutenticadorResponseSchema = z.strictObject({
  data: z.strictObject({
    otpauthUri: z.string().startsWith('otpauth://totp/'),
    secret: z.string().regex(/^[A-Z2-7]+=*$/),
    issuer: z.string().min(1),
    accountName: z.string().min(1),
    algorithm: z.literal('SHA1'),
    digits: z.literal(6),
    periodSeconds: z.literal(30),
    expiresAt: Instante,
  }),
});
export type ConfiguracionDelAutenticadorResponse = z.infer<typeof ConfiguracionDelAutenticadorResponseSchema>;

export const ConfirmarConfiguracionRequestSchema = z.strictObject({ code: z.string().max(16) });
export type ConfirmarConfiguracionRequest = z.infer<typeof ConfirmarConfiguracionRequestSchema>;

/** Los diez códigos de recuperación, que se muestran una sola vez. */
export const CodigosDeRecuperacionSchema = z.array(z.string().regex(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/)).length(10);

export const ConfiguracionConfirmadaResponseSchema = z.strictObject({
  data: z.strictObject({ recoveryCodes: CodigosDeRecuperacionSchema, secondFactor: EstadoDelSegundoFactorSchema }),
});
export type ConfiguracionConfirmadaResponse = z.infer<typeof ConfiguracionConfirmadaResponseSchema>;

// ─── API-ADM-09 — Regenerar los códigos de recuperación ─────────────────────────────────────────

export const RegenerarCodigosDeRecuperacionRequestSchema = z.strictObject({ credential: z.string().max(1024) });
export type RegenerarCodigosDeRecuperacionRequest = z.infer<typeof RegenerarCodigosDeRecuperacionRequestSchema>;

export const CodigosDeRecuperacionResponseSchema = z.strictObject({ data: z.strictObject({ recoveryCodes: CodigosDeRecuperacionSchema }) });
export type CodigosDeRecuperacionResponse = z.infer<typeof CodigosDeRecuperacionResponseSchema>;

// ─── Profesionales: lista, ficha e historial ────────────────────────────────────────────────────

export const SituacionDeAreaSchema = z.enum(SITUACIONES_DE_AREA);
export const EstadoDeVerificacionApiSchema = z.enum(['PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'SUSPENDIDO']);
export const EstadoDeHabilitacionApiSchema = z.enum(['CONCEDIDA', 'RETIRADA']);
export const DecisionAdministrativaSchema = z.enum(DECISIONES_ADMINISTRATIVAS);
export const TipoDePerfilApiSchema = z.enum(['HEALTH_PROFESSIONAL', 'NON_HEALTH_PROFESSIONAL']);

/** Un área de un profesional, como se ve en la lista. */
export const AreaDelProfesionalSchema = z.strictObject({
  scope: AlcanceSchema,
  situation: SituacionDeAreaSchema,
  verification: z.strictObject({ state: EstadoDeVerificacionApiSchema.nullable(), since: Instante.nullable() }),
  enablement: z.strictObject({ state: EstadoDeHabilitacionApiSchema.nullable(), since: Instante.nullable() }),
  canOperate: z.boolean(),
});
export type AreaDelProfesional = z.infer<typeof AreaDelProfesionalSchema>;

export const ProfesionalDeLaListaSchema = z.strictObject({
  professionalId: IdOpaco,
  displayName: z.string(),
  profileType: TipoDePerfilApiSchema,
  /** El correo de acceso: identifica a la cuenta (D-5). `null` si la cuenta no tiene acceso local. */
  email: z.string().nullable(),
  accountState: AccountOperationalStateSchema,
  scopes: z.array(AreaDelProfesionalSchema),
});
export type ProfesionalDeLaLista = z.infer<typeof ProfesionalDeLaListaSchema>;

/** API-ADM-10: el texto busca en el nombre visible y en el correo, sin tildes ni mayúsculas. */
export const ConsultarProfesionalesRequestSchema = z.strictObject({
  text: z.string().max(100).optional(),
  scope: AlcanceSchema.optional(),
  situation: SituacionDeAreaSchema.optional(),
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type ConsultarProfesionalesRequest = z.infer<typeof ConsultarProfesionalesRequestSchema>;

export const ListaDeProfesionalesResponseSchema = z.strictObject({
  data: z.array(ProfesionalDeLaListaSchema),
  page: PaginaSchema,
  /** Cuántos coinciden con la consulta, y las áreas pendientes de revisión de todo BE (no solo de esta página). */
  totals: z.strictObject({ matching: z.number().int().nonnegative(), pendingReview: z.number().int().nonnegative() }),
});
export type ListaDeProfesionalesResponse = z.infer<typeof ListaDeProfesionalesResponseSchema>;

/** Un área en la ficha: lo de la lista más su versión, lo que admite hoy y cuántas personas recibirían un aviso. */
export const AreaDeLaFichaSchema = AreaDelProfesionalSchema.extend({
  /** La versión del área para `expectedVersion` (`a<verificación>-<habilitación>`). */
  version: z.string().regex(/^a\d{1,9}-\d{1,9}$/),
  availableDecisions: z.array(DecisionAdministrativaSchema),
  /** Las personas con un vínculo ACEPTADO o PAUSADO con el profesional en esa área: solo cuántas, nunca quiénes. */
  linkedPeople: z.strictObject({ active: z.number().int().nonnegative(), paused: z.number().int().nonnegative() }),
  /** La última observación registrada, mientras el área sigue pendiente. */
  lastObservation: z.strictObject({ at: Instante, messageToProfessional: z.string().nullable() }).nullable(),
});
export type AreaDeLaFicha = z.infer<typeof AreaDeLaFichaSchema>;

export const FichaDeProfesionalResponseSchema = z.strictObject({
  data: z.strictObject({
    professional: ProfesionalDeLaListaSchema.omit({ scopes: true }).extend({ profileSince: Instante.nullable() }),
    scopes: z.array(AreaDeLaFichaSchema),
  }),
});
export type FichaDeProfesionalResponse = z.infer<typeof FichaDeProfesionalResponseSchema>;

/** Quién hizo un hecho de la historia: un administrador (con su nombre de la administración) o el servicio interno. */
export const ActorDelHistorialSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('ADMINISTRATOR'), identityId: IdOpaco, displayName: z.string() }),
  z.strictObject({ type: z.literal('INTERNAL_SERVICE') }),
]);

/** Un hecho de la verificación o de la habilitación de un profesional, tal como quedó registrado. */
export const EntradaDelHistorialAdministrativoSchema = z.strictObject({
  eventId: IdOpaco,
  scope: AlcanceSchema.nullable(),
  /** El tipo del hecho del 06 (`AlcanceSuspendido`, `HabilitacionConcedida`…); texto, para no romper con uno nuevo. */
  kind: z.string().min(1),
  previousState: z.string().nullable(),
  newState: z.string().nullable(),
  actor: ActorDelHistorialSchema,
  rationale: z.string().nullable(),
  messageToProfessional: z.string().nullable(),
  /** La versión de la trayectoria que se revisó al decidir (DL-156); `null` en los hechos anteriores a este paquete. */
  reviewedVersion: z.number().int().positive().nullable(),
  occurredAt: Instante.nullable(),
  recordedAt: Instante,
});
export type EntradaDelHistorialAdministrativo = z.infer<typeof EntradaDelHistorialAdministrativoSchema>;

export const HistorialAdministrativoResponseSchema = z.strictObject({ data: z.array(EntradaDelHistorialAdministrativoSchema), page: PaginaSchema });
export type HistorialAdministrativoResponse = z.infer<typeof HistorialAdministrativoResponseSchema>;

// ─── API-ADM-13 — Decidir sobre un área ─────────────────────────────────────────────────────────

/**
 * Una decisión sobre un área. `rationale` es el fundamento interno (lo ve Administración, nunca el profesional ni las
 * personas); `messageToProfessional`, lo que se le comunica. Un fundamento vacío no es un 400 de forma sino el 422
 * `RATIONALE_REQUIRED` del 09 (PRO-11).
 */
export const DecidirSobreAreaRequestSchema = z.strictObject({
  expectedVersion: z.string().regex(/^a\d{1,9}-\d{1,9}$/),
  decision: DecisionAdministrativaSchema,
  rationale: z.string().max(LARGO_MAXIMO_DEL_FUNDAMENTO),
  messageToProfessional: z.string().max(LARGO_MAXIMO_DEL_MENSAJE).optional(),
});
export type DecidirSobreAreaRequest = z.infer<typeof DecidirSobreAreaRequestSchema>;

export const DecisionRegistradaResponseSchema = z.strictObject({
  data: z.strictObject({
    eventId: IdOpaco,
    scope: AreaDeLaFichaSchema,
    /** A quiénes se avisó: al profesional siempre; a las personas, cuántas, si cambió que pueda operar el área. */
    notified: z.strictObject({ professional: z.boolean(), linkedPeople: z.number().int().nonnegative() }),
  }),
});
export type DecisionRegistradaResponse = z.infer<typeof DecisionRegistradaResponseSchema>;
