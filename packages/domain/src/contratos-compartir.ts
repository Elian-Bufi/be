/**
 * WP-COMPARTIR (DEUDA_LEGAJO DL-176) · los contratos de la familia CMP, propia de BE (el 09 no la tiene; lo nuevo va en
 * operaciones nuevas, DL-137 D-7). Objetos estrictos: un campo no declarado es 400 UNKNOWN_FIELD (09v7 T12).
 *
 * - API-CMP-01 · `GET /me/sharing-proposal` — la persona: lo que puede compartir y lo que ya comparte, con los textos que se
 *   aceptan. Con `?relationshipId=`, solo lo que toca a ese componente de vínculo (la pantalla única al aceptar).
 * - API-CMP-02 · `POST /me/sharing-choices` — la persona: un toque escribe todo lo elegido (el A3, el B2 del área, lo de
 *   otras áreas, la historia anterior y los hábitos), en una sola transacción: todo o nada.
 * - API-CMP-03 · `POST /me/sharing-choices/withdrawal` — la persona: deja de compartir una cosa (lo de un área con un
 *   profesional, o sus hábitos con uno), desde ahora.
 *
 * Ninguna APK instalada las llama: la próxima candidata las empieza a leer y se congelan con ella (DL-152).
 */
import { z } from 'zod';
import { FORMA_DE_LA_CLAVE, FORMA_DE_LA_CLAVE_QUE_SE_RETIRA, TIPOS_DE_LO_QUE_SE_COMPARTE } from './compartir';
import { IdOpaco, Instante } from './contratos';
import { NivelDeResumenSchema } from './contratos-resumenes-compartidos';
import { AlcanceSchema, ResumenDeActorSchema, ResumenDeAlcanceSchema } from './contratos-vinculo';

export const TipoDeLoQueSeComparteSchema = z.enum(TIPOS_DE_LO_QUE_SE_COMPARTE);
/** La clave de una cosa que se comparte, como la da API-CMP-01. */
export const ClaveDeLoQueSeComparteSchema = z.string().regex(FORMA_DE_LA_CLAVE);
/** Las que se retiran con API-CMP-03: lo de un área con un profesional y los hábitos con uno. */
export const ClaveQueSeRetiraSchema = z.string().regex(FORMA_DE_LA_CLAVE_QUE_SE_RETIRA);
/** La versión de lo que se vio: opaca. */
export const VersionDeLoQueSeComparteSchema = z.string().regex(/^p[0-9a-z]{1,16}$/);

const Base = {
  key: ClaveDeLoQueSeComparteSchema,
  /** Si hoy está dada. */
  given: z.boolean(),
  /** Desde cuándo está dada; `null` si no. */
  since: Instante.nullable(),
  /** Si se puede dar ahora con API-CMP-02. */
  offered: z.boolean(),
  /** Si la pantalla única la trae marcada. Lo que la persona retiró antes no vuelve marcado (CMP-D3). */
  preselected: z.boolean(),
  /** El texto que se acepta al darla (uno de `texts`). */
  textId: IdOpaco,
};

/** Una cosa que se comparte. */
export const LoQueSeComparteSchema = z.discriminatedUnion('kind', [
  /** El tratamiento de los datos de salud por BE (A3). */
  z.strictObject({ kind: z.literal('HEALTH_DATA'), ...Base }),
  /** La autorización de acceso a un área (B2), con el aviso del perfil del profesional (08 §12.3). */
  z.strictObject({ kind: z.literal('AREA_CONSENT'), ...Base, relationshipId: IdOpaco, professional: ResumenDeActorSchema, scope: ResumenDeAlcanceSchema, profileNotice: z.string() }),
  /**
   * Lo de un área (`area`) para un profesional (`recipient`): `level`, el nivel que se da al elegirla; `givenLevel`, en el
   * que hoy lo ve (`null` si no lo ve), que puede ser menos (lo dice «Quién ve qué»); `from`, quién lleva hoy esa área.
   */
  z.strictObject({ kind: z.literal('SUMMARY'), ...Base, recipient: ResumenDeActorSchema, area: AlcanceSchema, level: NivelDeResumenSchema, givenLevel: NivelDeResumenSchema.nullable(), from: z.array(ResumenDeActorSchema).min(1) }),
  /** La historia anterior de un área, para el profesional de ese componente. */
  z.strictObject({ kind: z.literal('PREVIOUS_HISTORY'), ...Base, relationshipId: IdOpaco, professional: ResumenDeActorSchema, area: AlcanceSchema }),
  /** Los hábitos, para un profesional. */
  z.strictObject({ kind: z.literal('HABITS'), ...Base, recipient: ResumenDeActorSchema }),
]);
export type LoQueSeCompartePorApi = z.infer<typeof LoQueSeComparteSchema>;

/** El texto que se acepta, con su id y su hash (08 §12.2). `kind` dice de qué acto es. */
export const TextoDeLoQueSeComparteSchema = z.strictObject({
  id: IdOpaco,
  kind: z.enum(['HEALTH_DATA', 'AREA_CONSENT', 'SUMMARY', 'SUMMARY_AND_PLAN', 'PREVIOUS_HISTORY', 'HABITS']),
  title: z.string(),
  text: z.string(),
  textHash: z.string().regex(/^[0-9a-f]{64}$/),
  effectiveFrom: Instante,
  approval: z.enum(['PENDING_APPROVAL', 'APPROVED']),
});
export type TextoDeLoQueSeComparte = z.infer<typeof TextoDeLoQueSeComparteSchema>;

// ─── API-CMP-01 ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const LoQueSePuedeCompartirResponseSchema = z.strictObject({
  data: z.strictObject({
    /** El componente de la pantalla al aceptar; `null`, todo. */
    relationshipId: IdOpaco.nullable(),
    /** La versión de lo que se ve: va en API-CMP-02 (`expectedVersion`). */
    version: VersionDeLoQueSeComparteSchema,
    items: z.array(LoQueSeComparteSchema),
    /** Los textos de lo que se ofrece, uno por id. */
    texts: z.array(TextoDeLoQueSeComparteSchema),
  }),
});
export type LoQueSePuedeCompartirResponse = z.infer<typeof LoQueSePuedeCompartirResponseSchema>;

// ─── API-CMP-02 ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const CompartirLoElegidoRequestSchema = z
  .strictObject({
    /** El componente de la pantalla al aceptar (el mismo de API-CMP-01); `null`, todo. */
    relationshipId: IdOpaco.nullable(),
    /** La versión que se vio (API-CMP-01): si cambió algo, 409 VERSION_CONFLICT. */
    expectedVersion: VersionDeLoQueSeComparteSchema,
    /** Los textos que se mostraron y la persona acepta (la mostrada es la aceptada, 08 §12.2). */
    acceptedTextIds: z.array(IdOpaco).max(12),
    /** Lo elegido: las claves de API-CMP-01. Al menos una. */
    choices: z.array(ClaveDeLoQueSeComparteSchema).min(1).max(80),
  })
  .refine((p) => new Set(p.choices).size === p.choices.length, { path: ['choices'], message: 'Cada cosa, una sola vez.' });
export type CompartirLoElegidoRequest = z.infer<typeof CompartirLoElegidoRequestSchema>;

export const LoElegidoCompartidoResponseSchema = z.strictObject({
  data: z.strictObject({
    /** Cuándo quedó registrado (la hora de la base, con los cerrojos tomados). */
    recordedAt: Instante,
    /** Lo que se dio, en el orden en que se escribió. */
    given: z.array(z.strictObject({ key: ClaveDeLoQueSeComparteSchema, kind: TipoDeLoQueSeComparteSchema })),
  }),
});
export type LoElegidoCompartidoResponse = z.infer<typeof LoElegidoCompartidoResponseSchema>;

// ─── API-CMP-03 ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const DejarDeCompartirUnaCosaRequestSchema = z.strictObject({ key: ClaveQueSeRetiraSchema });
export type DejarDeCompartirUnaCosaRequest = z.infer<typeof DejarDeCompartirUnaCosaRequestSchema>;

export const UnaCosaRetiradaResponseSchema = z.strictObject({
  data: z.strictObject({
    key: ClaveQueSeRetiraSchema,
    /** `false` si ya no se compartía: retirar dos veces no escribe dos veces. */
    withdrawn: z.boolean(),
    withdrawnAt: Instante.nullable(),
  }),
});
export type UnaCosaRetiradaResponse = z.infer<typeof UnaCosaRetiradaResponseSchema>;
