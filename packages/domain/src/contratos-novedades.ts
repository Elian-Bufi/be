/**
 * WP-NOVEDADES-Y-AVISOS (DEUDA_LEGAJO DL-133; pedido de Dirección del 2026-10-16): el centro de novedades (RF-061, P1;
 * UC-P30) y los avisos push no sensibles (RF-062, P2; UC-E08), con el contrato que bosqueja el 09v12 §20-21
 * (`GET /me/news`, `GET /me/news/{newsId}`, `PUT|DELETE /me/push-subscriptions/{deviceId}`) y las preferencias de los
 * recordatorios. IDs propios de BE, familia NOV.
 * - **La novedad es la fuente de verdad** (06 §5.11; REG-06-29): nace en la misma transacción que el hecho que cuenta;
 *   el aviso push sale después, lo mejor posible, y si falla la novedad queda (07 §23-24).
 * - **El texto lo arma BE** con el tipo y lo que este actor puede ver: nunca datos de salud, mediciones, planes ni notas
 *   (UC-P30; INV-06-32). El nombre de la contraparte sigue la regla de DL-040.
 * - **`kind` y `open.view` son texto, no enumeraciones estrictas:** la APK instalada valida las respuestas con objetos
 *   estrictos, y un tipo nuevo de novedad no puede dejarla sin leer el centro. Los valores conocidos están en
 *   `TIPOS_DE_NOVEDAD` y `VISTAS_DE_NOVEDAD`; uno desconocido se muestra con su texto y abre el centro.
 * - **El aviso push no lleva contenido** (REG-06-30; UC-E08): el título es «BE» y el texto dice solo que hay una novedad
 *   o un recordatorio. Sus datos son `{ type: "NEW_INTERNAL_UPDATE", referenceId }` (09v12 §21): la APK autenticada
 *   consulta BE.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { FechaLocalSchema } from './contratos-nutricion';
import { AlcanceSchema, PaginaSchema, ResumenDeActorSchema } from './contratos-vinculo';

/** Los tipos de novedad que BE emite hoy. */
export const TIPOS_DE_NOVEDAD = [
  /** Al asesorado: su profesional activó una versión nueva de su plan (Nutrición o Entrenamiento). */
  'PLAN_ACTIVATED',
  /** Al asesorado: su profesional registró una revisión. */
  'REVIEW_RECORDED',
  /** A la contraparte de una solicitud de vínculo nueva (B10-04 §42). */
  'RELATIONSHIP_REQUEST_RECEIVED',
  /** A quien envió la solicitud, cuando la otra parte la acepta o la rechaza (B10-04 §42). */
  'RELATIONSHIP_REQUEST_ACCEPTED',
  'RELATIONSHIP_REQUEST_REJECTED',
  /** A la otra parte, cuando una pausa, reanuda o finaliza un alcance del vínculo (B10-04 §42). */
  'RELATIONSHIP_PAUSED',
  'RELATIONSHIP_RESUMED',
  'RELATIONSHIP_ENDED',
  /** Al profesional: la persona revocó el consentimiento de datos de salud de un alcance (B10-04 §42). */
  'CONSENT_REVOKED',
  /** Al asesorado, con el recordatorio activo: hoy todavía no registró comidas (15:00 y 22:00). */
  'MEAL_LOG_REMINDER',
  /**
   * Al asesorado, con el recordatorio activo: hoy tenía una sesión prevista en su agenda y todavía no la registró ni la
   * salteó (22:00). Desde DL-137, solo los días planificados: un plan sin agenda no avisa.
   */
  'TRAINING_LOG_REMINDER',
  /** DL-137: a la mañana (10:00), hoy hay una sesión prevista en la agenda. */
  'TRAINING_SESSION_TODAY_REMINDER',
  /** DL-137: a la mañana (10:00), le quedó pendiente una sesión de los dos días anteriores; la fecha es la prevista. */
  'TRAINING_SESSION_PENDING_REMINDER',
  /**
   * DL-140 (CRD-D6): a cada profesional que recibe una nota de coordinación, de quién es y sobre qué persona. Nunca el
   * texto de la nota: se lee en la línea de tiempo de la ficha, que vuelve a autorizar.
   */
  'COORDINATION_NOTE_RECEIVED',
] as const;
export type TipoDeNovedad = (typeof TIPOS_DE_NOVEDAD)[number];

/**
 * La pantalla que resuelve la novedad. La abre el cliente y esa pantalla vuelve a autorizar: la novedad no concede nada
 * (INV-06-33). `referenceId` es lo que esa pantalla necesita (el asesorado en `ADVISEE`, la revisión en `NUTRITION_REVIEW`
 * y `TRAINING_REVIEW`, que la persona lee completa desde REV-A), o `null`. `PRO_HOME` es el espacio profesional (las
 * solicitudes), para el profesional que lee una novedad de una solicitud. Una nota de coordinación (DL-140) abre la ficha
 * de la persona sobre la que trata, en `ADVISEE`.
 */
export const VISTAS_DE_NOVEDAD = ['NEWS', 'NUTRITION', 'TRAINING', 'RELATIONSHIPS', 'ADVISEE', 'NUTRITION_REVIEW', 'TRAINING_REVIEW', 'PRO_HOME'] as const;
export type VistaDeNovedad = (typeof VISTAS_DE_NOVEDAD)[number];

export const NovedadSchema = z.strictObject({
  newsId: IdOpaco,
  /** Uno de `TIPOS_DE_NOVEDAD`; texto para que un tipo nuevo no deje sin leer a un cliente viejo. */
  kind: z.string().min(1),
  /** El área a la que se refiere, o `null` (un aviso general). */
  scope: AlcanceSchema.nullable(),
  /** Quién la originó, con el nombre que este actor puede ver (DL-040); `null` cuando la emite BE (un recordatorio). */
  source: ResumenDeActorSchema.nullable(),
  title: z.string().min(1),
  body: z.string().min(1),
  /** El día civil al que se refiere un recordatorio; `null` en las demás. */
  date: FechaLocalSchema.nullable(),
  /** Cuándo ocurrió el hecho que cuenta (06 §5.11.1). */
  occurredAt: Instante.nullable(),
  recordedAt: Instante,
  /** La primera vez que este actor la abrió (UC-P30, paso 6), o `null` si todavía no. */
  readAt: Instante.nullable(),
  open: z.strictObject({ view: z.string().min(1), referenceId: IdOpaco.nullable() }),
});
export type Novedad = z.infer<typeof NovedadSchema>;

/** API-NOV-01: de la más nueva a la más vieja, con las no leídas contadas sobre todas, no solo sobre la página. */
export const ListaDeNovedadesResponseSchema = z.strictObject({
  data: z.array(NovedadSchema),
  page: PaginaSchema,
  unreadCount: z.number().int().nonnegative(),
});
export type ListaDeNovedadesResponse = z.infer<typeof ListaDeNovedadesResponseSchema>;

/** API-NOV-02: la novedad, que queda leída (la primera lectura se registra). */
export const NovedadResponseSchema = z.strictObject({ data: NovedadSchema });
export type NovedadResponse = z.infer<typeof NovedadResponseSchema>;

// ─── Avisos push (RF-062) ─────────────────────────────────────────────────────────────────────

/** El token que entrega Expo para un teléfono (`ExponentPushToken[…]`). Es C3 (08 §52, proveedor Expo): no se registra en logs. */
export const TokenDeExpoSchema = z
  .string()
  .max(200)
  .regex(/^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,190}\]$/);

/** API-NOV-03: este teléfono recibe los avisos de esta cuenta. El identificador del dispositivo lo genera la APK. */
export const RegistrarSuscripcionPushRequestSchema = z.strictObject({
  expoPushToken: TokenDeExpoSchema,
  platform: z.literal('ANDROID'),
});
export type RegistrarSuscripcionPushRequest = z.infer<typeof RegistrarSuscripcionPushRequestSchema>;

export const SuscripcionPushResponseSchema = z.strictObject({
  data: z.strictObject({ deviceId: IdOpaco, platform: z.literal('ANDROID'), registeredAt: Instante }),
});
export type SuscripcionPushResponse = z.infer<typeof SuscripcionPushResponseSchema>;

/** Los datos que viajan con el aviso: ninguno de salud (09v12 §21). */
export const DatosDelAvisoPushSchema = z.strictObject({ type: z.literal('NEW_INTERNAL_UPDATE'), referenceId: IdOpaco });
export type DatosDelAvisoPush = z.infer<typeof DatosDelAvisoPushSchema>;

// ─── Preferencias de los recordatorios (DL-133) ───────────────────────────────────────────────

/** API-NOV-05 y API-NOV-06. Apagados mientras la persona no los encienda. */
export const PreferenciasDeAvisosSchema = z.strictObject({
  /** El recordatorio de comidas: a las 15:00 y a las 22:00, si ese día todavía no hay ninguna registrada. */
  mealLogReminder: z.boolean(),
  /**
   * El recordatorio de entrenamiento, según la agenda del plan (DL-137): a las 10:00, si hoy toca una sesión o quedó una
   * pendiente de los dos días anteriores; a las 22:00, si la de hoy sigue sin registrar. Un plan sin agenda no avisa.
   */
  trainingLogReminder: z.boolean(),
});
export type PreferenciasDeAvisos = z.infer<typeof PreferenciasDeAvisosSchema>;

export const PreferenciasDeAvisosResponseSchema = z.strictObject({
  data: PreferenciasDeAvisosSchema.extend({ updatedAt: Instante.nullable() }),
});
export type PreferenciasDeAvisosResponse = z.infer<typeof PreferenciasDeAvisosResponseSchema>;

export const ReemplazarPreferenciasDeAvisosRequestSchema = PreferenciasDeAvisosSchema;
export type ReemplazarPreferenciasDeAvisosRequest = z.infer<typeof ReemplazarPreferenciasDeAvisosRequestSchema>;

// ─── La tarea programada de los recordatorios (07 §24) ────────────────────────────────────────

/**
 * Las franjas del día en que corre la tarea: la de la mañana (10:00) recuerda solo el entrenamiento según la agenda
 * (DL-137); la de la tarde (15:00), solo las comidas; la de la noche (22:00), las comidas y la sesión de hoy (DL-133).
 */
export const FRANJAS_DE_RECORDATORIO = ['MORNING', 'AFTERNOON', 'NIGHT'] as const;
export type FranjaDeRecordatorio = (typeof FRANJAS_DE_RECORDATORIO)[number];
export const FranjaDeRecordatorioSchema = z.enum(FRANJAS_DE_RECORDATORIO);

/** El cuerpo de la corrida: la franja, si no se elige por la hora (la usa la tarea programada y las pruebas). */
export const CorridaDeRecordatoriosRequestSchema = z.strictObject({ slot: FranjaDeRecordatorioSchema.optional() });

export const CorridaDeRecordatoriosResponseSchema = z.strictObject({
  data: z.strictObject({
    date: FechaLocalSchema,
    slot: FranjaDeRecordatorioSchema,
    /** Novedades de recordatorio creadas en esta corrida (las que ya existían para ese día no se repiten). */
    reminders: z.number().int().nonnegative(),
    /** Avisos push: enviados, rechazados por el canal y sin respuesta. */
    pushes: z.strictObject({ sent: z.number().int().nonnegative(), rejected: z.number().int().nonnegative(), unanswered: z.number().int().nonnegative() }),
  }),
});
export type CorridaDeRecordatoriosResponse = z.infer<typeof CorridaDeRecordatoriosResponseSchema>;

/** La hora civil (en la zona de BE) a la que pertenece cada franja: la tarea corre a las 10:00, a las 15:00 y a las 22:00. */
export function franjaDeLaHora(hora: number): FranjaDeRecordatorio | null {
  // DL-137: la mañana es solo del entrenamiento (la tarea corre a las 10:00).
  if (hora >= 9 && hora < 13) return 'MORNING';
  if (hora >= 14 && hora < 19) return 'AFTERNOON';
  if (hora >= 21 && hora <= 23) return 'NIGHT';
  return null;
}
