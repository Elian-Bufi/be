/**
 * WP-HISTORIA-ANTERIOR (DEUDA_LEGAJO DL-175) · los contratos de la familia HIA, propia de BE (el 09 no la tiene; lo nuevo va
 * en operaciones nuevas, DL-137 D-7). Objetos estrictos: un campo no declarado es 400 UNKNOWN_FIELD (09v7 T12).
 * - API-HIA-01 a 03 son de la persona: qué profesionales de hoy pueden ver su historia anterior de su área, autorizarlo y
 *   retirarlo.
 * - API-HIA-04 es del profesional: la historia anterior de un área, por tramos de fechas.
 *
 * **Lo que el contrato no puede llevar** (TEST-HA-010): el nombre o el identificador del profesional anterior (cada cosa va
 * con `author: { kind: 'OTHER_PROFESSIONAL', ordinal }`), una nota propia, un borrador, la interpretación ni las evidencias de
 * una revisión, el contexto de una toma, las fotos de una comida, las correcciones con su autor, ni nada de otra área.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { MagnitudSchema, OrigenDeMedicionSchema } from './contratos-antropometria';
import { BloqueSchema, CondicionDeSesionApiSchema } from './contratos-entrenamiento';
import { DiaTipoSchema, FechaLocalSchema, ResultadoDeRevisionApiSchema } from './contratos-nutricion';
import { AlcanceSchema, EstadoDeVinculoSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';
import { PARTES_DE_LA_HISTORIA_ANTERIOR } from './historia-anterior';

export const ParteDeLaHistoriaAnteriorSchema = z.enum(PARTES_DE_LA_HISTORIA_ANTERIOR);

/** El autor, sin nombrarlo: de otro profesional, con su orden (1 = el que empezó antes). */
export const AutorDeLaHistoriaAnteriorSchema = z.strictObject({ kind: z.literal('OTHER_PROFESSIONAL'), ordinal: z.number().int().positive() });

// ─── API-HIA-01 a 03 · lo de la persona ─────────────────────────────────────────────────────────────────────────────

/** El texto que se acepta al autorizar, con su hash (08 §12.2). Hoy, una propuesta. */
export const TextoDeLaHistoriaAnteriorSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  textHash: z.string().regex(/^[0-9a-f]{64}$/),
  effectiveFrom: Instante,
  approval: z.enum(['PENDING_APPROVAL', 'APPROVED']),
});

/** La última versión de la autorización de un componente. Sin decidir, `null` (no es lo mismo que retirada). */
export const AutorizacionDeHistoriaAnteriorSchema = z.strictObject({
  state: z.enum(['GRANTED', 'WITHDRAWN']),
  version: TokenDeVersionSchema,
  /** Desde cuándo rige este estado: cuándo la dio o cuándo la retiró. */
  since: Instante,
});

/** Un profesional de hoy en un área: si hubo otro antes en esa área, qué vería, lo que decidió la persona y cuándo la miró. */
export const HistoriaAnteriorDeUnAreaSchema = z.strictObject({
  /** El componente de vínculo de ese profesional en esa área (DL-034). */
  relationshipId: IdOpaco,
  area: AlcanceSchema,
  professional: ResumenDeActorSchema,
  /**
   * En API-HIA-01, ACEPTADO o PAUSADO; FINALIZADO solo si ese profesional la miró alguna vez con ese componente (para que la
   * persona siga viendo cuándo, HA-T08) y en la respuesta de un retiro sobre un vínculo ya terminado.
   */
  relationshipState: EstadoDeVinculoSchema,
  /** Si antes hubo otro profesional en esta área (HA-T06). No dice si dejó datos. */
  hadEarlierProfessional: z.boolean(),
  includes: z.array(ParteDeLaHistoriaAnteriorSchema),
  authorization: AutorizacionDeHistoriaAnteriorSchema.nullable(),
  /**
   * Si hoy ese profesional ve los datos de esta área: el PDP de ese componente, sin registrar (vínculo aceptado, B2
   * vigente, las cuentas y el A3). Compartida y con esto en `false`, no la ve (HA-T15): la app no dice «La ve».
   */
  accessInEffect: z.boolean(),
  /** La última vez que este profesional la miró **con este componente** (HA-T08); `null` si nunca. */
  lastReadAt: Instante.nullable(),
});
export type HistoriaAnteriorDeUnArea = z.infer<typeof HistoriaAnteriorDeUnAreaSchema>;

/** Una lectura de la historia anterior, como la ve la persona (08 §19.7). */
export const LecturaDeLaHistoriaAnteriorSchema = z.strictObject({ professional: ResumenDeActorSchema, area: AlcanceSchema, readAt: Instante });

/** API-HIA-01. */
export const MiHistoriaAnteriorResponseSchema = z.strictObject({
  data: z.strictObject({
    text: TextoDeLaHistoriaAnteriorSchema,
    items: z.array(HistoriaAnteriorDeUnAreaSchema),
    /** Las últimas 50 lecturas, de la más nueva a la más vieja (el registro crudo; la app muestra `lastReadAt` por componente). */
    accesses: z.array(LecturaDeLaHistoriaAnteriorSchema),
  }),
});
export type MiHistoriaAnteriorResponse = z.infer<typeof MiHistoriaAnteriorResponseSchema>;

/** API-HIA-02. La versión que se vio (`null` si nunca se decidió) y el texto que se muestra al autorizar. */
export const AutorizarHistoriaAnteriorRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema.nullable(), textVersionId: z.string().min(1).max(120) });
export type AutorizarHistoriaAnteriorRequest = z.infer<typeof AutorizarHistoriaAnteriorRequestSchema>;

/** API-HIA-03. La versión vigente que se vio. */
export const RetirarHistoriaAnteriorRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type RetirarHistoriaAnteriorRequest = z.infer<typeof RetirarHistoriaAnteriorRequestSchema>;

/** La respuesta de API-HIA-02 y 03: cómo queda ese profesional en esa área. */
export const HistoriaAnteriorDeUnAreaResponseSchema = z.strictObject({ data: HistoriaAnteriorDeUnAreaSchema });

// ─── API-HIA-04 · lo que lee el profesional ─────────────────────────────────────────────────────────────────────────

export const TramoSchema = z.strictObject({ from: FechaLocalSchema, to: FechaLocalSchema });

/** Una versión ACTIVADA de un plan de otro profesional, con su vigencia hasta el corte y su contenido como lo vio la persona. */
export const VersionAnteriorDePlanSchema = z.strictObject({
  planVersionId: IdOpaco,
  author: AutorDeLaHistoriaAnteriorSchema,
  /** El orden de activación dentro del plan de ese profesional: 1, 2, 3… */
  number: z.number().int().positive(),
  activatedAt: Instante,
  from: FechaLocalSchema,
  /** `null` si seguía vigente cuando empezó el acompañamiento de quien lee (`inEffectAtYourStart`). */
  to: FechaLocalSchema.nullable(),
  endReason: z.enum(['SUCCESSOR_ACTIVATED', 'FOLLOW_UP_CLOSED']).nullable(),
  inEffectAtYourStart: z.boolean(),
  content: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('NUTRITION'), dayTypes: z.array(DiaTipoSchema) }),
    z.strictObject({ kind: z.literal('TRAINING'), blocks: z.array(BloqueSchema) }),
  ]),
});
export type VersionAnteriorDePlan = z.infer<typeof VersionAnteriorDePlanSchema>;

/** Lo que registró la persona bajo esos planes: una comida o una sesión. */
export const RegistroAnteriorSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('MEAL'),
    recordId: IdOpaco,
    author: AutorDeLaHistoriaAnteriorSchema,
    planVersionId: IdOpaco,
    date: FechaLocalSchema,
    type: z.enum(['PLAN_OPTION', 'DIFFERENT']),
    meal: z.string().nullable(),
    option: z.string().nullable(),
    /** Lo que escribió la persona, si lo describió. */
    description: z.string().nullable(),
    annulled: z.boolean(),
  }),
  z.strictObject({
    kind: z.literal('SESSION'),
    recordId: IdOpaco,
    author: AutorDeLaHistoriaAnteriorSchema,
    planVersionId: IdOpaco,
    date: FechaLocalSchema,
    session: z.string(),
    /** La condición vigente (la corregida, si se corrigió). */
    condition: CondicionDeSesionApiSchema,
    corrected: z.boolean(),
    exercises: z.number().int().nonnegative(),
  }),
]);
export type RegistroAnterior = z.infer<typeof RegistroAnteriorSchema>;

/** Una toma registrada (nunca una en preparación): cada medición vigente con su protocolo y lo que calculó BE con su método. */
export const TomaAnteriorSchema = z.strictObject({
  evaluationId: IdOpaco,
  author: AutorDeLaHistoriaAnteriorSchema,
  takenAt: Instante,
  date: FechaLocalSchema,
  measurements: z.array(
    z.strictObject({
      metric: z.string(),
      /** La vista efectiva (la corregida, si se corrigió); `null` si la cadena no se puede resolver. */
      magnitude: MagnitudSchema.nullable(),
      protocolName: z.string(),
      origin: OrigenDeMedicionSchema,
      corrected: z.boolean(),
    }),
  ),
  derivedResults: z.array(z.strictObject({ metric: z.string(), magnitude: MagnitudSchema, methodName: z.string() })),
});
export type TomaAnterior = z.infer<typeof TomaAnteriorSchema>;

/** La decisión de una revisión: el resultado, el fundamento y la próxima acción. Ni la interpretación ni las evidencias. */
export const DecisionAnteriorSchema = z.strictObject({
  reviewId: IdOpaco,
  author: AutorDeLaHistoriaAnteriorSchema,
  recordedAt: Instante,
  date: FechaLocalSchema,
  reviewedPeriod: TramoSchema,
  result: ResultadoDeRevisionApiSchema,
  rationale: z.string(),
  nextAction: z.strictObject({ description: z.string(), nextReviewAt: FechaLocalSchema.nullable() }),
});
export type DecisionAnterior = z.infer<typeof DecisionAnteriorSchema>;

/** API-HIA-04. */
export const HistoriaAnteriorResponseSchema = z.strictObject({
  data: z.strictObject({
    area: AlcanceSchema,
    /** Todo es de otro profesional y de antes de este día: el comienzo del acompañamiento de quien lee. */
    beforeYourStart: FechaLocalSchema,
    period: TramoSchema,
    /** De la fecha más vieja a la más nueva de la historia anterior; `null` si no hay nada. */
    extent: TramoSchema.nullable(),
    /** Cuántos otros profesionales hubo en el área antes (los números de `author.ordinal` van de 1 a este). */
    otherProfessionals: z.number().int().nonnegative(),
    includes: z.array(ParteDeLaHistoriaAnteriorSchema),
    planVersions: z.array(VersionAnteriorDePlanSchema),
    records: z.array(RegistroAnteriorSchema),
    measurements: z.array(TomaAnteriorSchema),
    decisions: z.array(DecisionAnteriorSchema),
  }),
});
export type HistoriaAnteriorResponse = z.infer<typeof HistoriaAnteriorResponseSchema>;
export type HistoriaAnterior = HistoriaAnteriorResponse['data'];
