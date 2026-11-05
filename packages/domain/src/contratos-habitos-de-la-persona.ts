/**
 * Contratos HTTP de los hábitos de la persona (DL-165 D-9; WP-FORMULARIOS-RONDA-2, FR-10): la familia **API-HBT**, propia
 * de BE. El 09 no tiene estas operaciones (lo nuevo va en operaciones nuevas, DL-137 D-7), y el diseño las llamaba
 * API-HAB, que ya es «Mis habituales» de entrenamiento (DL-109): repetir un ID es lo que DL-116 prohíbe (D-14).
 *
 * - API-HBT-01 · `GET /me/habits` — la persona: lo vigente, su historia, la autorización y quiénes son sus profesionales.
 * - API-HBT-02 · `POST /me/habits` — la persona: una versión nueva desde «Mis hábitos».
 * - API-HBT-03 · `PUT /me/habits/sharing` — la persona: compartirlos, o cambiar con quiénes, con el texto que acepta.
 * - API-HBT-04 · `POST /me/habits/sharing/withdrawal` — la persona: dejar de compartirlos, para todos a la vez.
 * - API-HBT-05 · `GET /advisees/{adviseeId}/habits` — el profesional: lo vigente, si la persona se los comparte a él y el
 *   PDP lo permite. Si no, el 404 de lo inexistente: no se entera de que hay hábitos.
 *
 * Ninguna APK publicada las lee (la 0.20 no las conoce): su forma se congela cuando se publique la que las use (DL-152).
 * Objetos estrictos, como el resto de los contratos (09v7 T12).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { AprobacionDelTextoSchema } from './contratos-evidencia-visual';
import { RespuestaDeCampoV2EntradaSchema, RespuestaDeCampoV2Schema, SeccionDePlantillaV2Schema } from './contratos-formularios-v2';
import { ResumenDeActorSchema, ResumenDeAlcanceSchema, TokenDeVersionSchema } from './contratos-vinculo';

/** De dónde salió una versión: un formulario respondido o confirmado, o «Mis hábitos». Nunca de qué formulario ni de qué área. */
export const OrigenDeHabitosSchema = z.enum(['FORM', 'MY_HABITS']);
export type OrigenDeHabitos = z.infer<typeof OrigenDeHabitosSchema>;

/** Una versión de los hábitos: las respuestas de la parte «Tus hábitos», siempre declaradas por la persona. */
export const VersionDeHabitosSchema = z.strictObject({
  habitsVersionId: IdOpaco,
  /** El token de la versión: `expectedVersion` de API-HBT-02. */
  version: TokenDeVersionSchema,
  answers: z.array(RespuestaDeCampoV2Schema),
  origin: OrigenDeHabitosSchema,
  recordedAt: Instante,
});
export type VersionDeHabitos = z.infer<typeof VersionDeHabitosSchema>;

/** La autorización: nunca dada, activa o retirada. */
export const EstadoDeCompartirHabitosSchema = z.enum(['NOT_GIVEN', 'ACTIVE', 'WITHDRAWN']);
export type EstadoDeCompartirHabitos = z.infer<typeof EstadoDeCompartirHabitosSchema>;

export const CompartirHabitosSchema = z.strictObject({
  status: EstadoDeCompartirHabitosSchema,
  /** El token de la última versión (`expectedVersion` de API-HBT-03 y 04); `null` si nunca la dio. */
  version: TokenDeVersionSchema.nullable(),
  /** Cuándo la dio, si está activa: la versión activa más antigua sin un retiro en el medio. */
  activeSince: Instante.nullable(),
  /** Cuándo la retiró, si está retirada. */
  withdrawnAt: Instante.nullable(),
  /** La versión del texto que aceptó en la vigente; `null` si no está activa. */
  acceptedTextVersionId: IdOpaco.nullable(),
});
export type CompartirHabitos = z.infer<typeof CompartirHabitosSchema>;

/**
 * Un profesional de la persona (con un componente de vínculo sin terminar), y lo que la autorización dice de él:
 * - `RECEIVES`: los recibe desde `sharedSince` (mientras su vínculo esté aceptado; en pausa, no los ve);
 * - `DOES_NOT_RECEIVE`: no los recibe (la persona dijo que no, o la autorización no está activa);
 * - `NOT_ASKED`: empezó a acompañarla después de la versión vigente: no los recibe solo, y la app le pregunta a la persona.
 */
export const ProfesionalParaHabitosSchema = z.strictObject({
  professional: ResumenDeActorSchema,
  scopes: z.array(ResumenDeAlcanceSchema).min(1),
  link: z.enum(['ACTIVE', 'PAUSED']),
  sharing: z.enum(['RECEIVES', 'DOES_NOT_RECEIVE', 'NOT_ASKED']),
  sharedSince: Instante.nullable(),
});
export type ProfesionalParaHabitos = z.infer<typeof ProfesionalParaHabitosSchema>;

/** El texto del acto «Compartir mis hábitos con mis profesionales», con su aprobación (`PENDING_APPROVAL`: una propuesta). */
export const TextoDeCompartirHabitosSchema = z.strictObject({
  id: IdOpaco,
  title: z.string(),
  text: z.string(),
  textHash: z.string(),
  effectiveFrom: Instante,
  approval: AprobacionDelTextoSchema,
});
export type TextoDeCompartirHabitos = z.infer<typeof TextoDeCompartirHabitosSchema>;

/** Lo que la autorización es hoy, con los profesionales: lo devuelven API-HBT-01, 03 y 04. */
export const EstadoDeHabitosCompartidosSchema = z.strictObject({
  sharing: CompartirHabitosSchema,
  professionals: z.array(ProfesionalParaHabitosSchema),
});

// ─── API-HBT-01 — Mis hábitos ───────────────────────────────────────────────────────────────────
export const MisHabitosResponseSchema = z.strictObject({
  data: z.strictObject({
    /** La parte «Tus hábitos», para dibujarla y validarla igual que la API. */
    section: SeccionDePlantillaV2Schema,
    current: VersionDeHabitosSchema.nullable(),
    /** Las anteriores, de la más nueva a la más vieja (sin la vigente). */
    history: z.array(VersionDeHabitosSchema),
    sharing: CompartirHabitosSchema,
    professionals: z.array(ProfesionalParaHabitosSchema),
    /** El texto que hay que mostrar para compartir o sumar a alguien. */
    text: TextoDeCompartirHabitosSchema,
  }),
});
export type MisHabitosResponse = z.infer<typeof MisHabitosResponseSchema>;

// ─── API-HBT-02 — Una versión nueva desde «Mis hábitos» ─────────────────────────────────────────
export const RegistrarHabitosRequestSchema = z.strictObject({
  /** La vigente que se vio (`null` si no había): una versión que entró en el medio (otro formulario) no se pisa en silencio. */
  expectedVersion: TokenDeVersionSchema.nullable(),
  /** Las respuestas de la parte. Ninguna es obligatoria; dejarla vacía declara que no quiere contar nada. */
  answers: z.array(RespuestaDeCampoV2EntradaSchema).max(20),
});
export type RegistrarHabitosRequest = z.infer<typeof RegistrarHabitosRequestSchema>;
export const HabitosRegistradosResponseSchema = z.strictObject({ data: VersionDeHabitosSchema });
export type HabitosRegistradosResponse = z.infer<typeof HabitosRegistradosResponseSchema>;

// ─── API-HBT-03 — Compartirlos, o cambiar con quiénes ───────────────────────────────────────────
export const CompartirHabitosRequestSchema = z.strictObject({
  /** El token de la última versión que se vio; `null` si nunca la dio. */
  expectedVersion: TokenDeVersionSchema.nullable(),
  /** La versión del texto que se mostró: la mostrada es la aceptada (08 §12.2). */
  textVersionId: IdOpaco,
  /** La lista completa de quiénes los reciben: al menos uno. Quien estaba y no está, deja de recibirlos. */
  professionalIds: z.array(IdOpaco).min(1).max(30),
  /** A quiénes se les preguntó en este acto y la persona dijo que no (los desmarcados, o el «No» a uno nuevo). */
  declinedProfessionalIds: z.array(IdOpaco).max(30),
});
export type CompartirHabitosRequest = z.infer<typeof CompartirHabitosRequestSchema>;

// ─── API-HBT-04 — Dejar de compartirlos ─────────────────────────────────────────────────────────
export const DejarDeCompartirHabitosRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type DejarDeCompartirHabitosRequest = z.infer<typeof DejarDeCompartirHabitosRequestSchema>;

/** API-HBT-03 y 04: cómo queda la autorización. */
export const HabitosCompartidosEstadoResponseSchema = z.strictObject({ data: EstadoDeHabitosCompartidosSchema });
export type HabitosCompartidosEstadoResponse = z.infer<typeof HabitosCompartidosEstadoResponseSchema>;

// ─── API-HBT-05 — Lo que ve el profesional ──────────────────────────────────────────────────────
/**
 * Lo vigente, «Declarado por la persona», con su fecha y de dónde salió dicho como «en un formulario» o «en Mis
 * hábitos»: nunca de qué formulario ni el área de otro profesional, y sin la historia, que es de la persona (§4.4).
 */
export const HabitosCompartidosResponseSchema = z.strictObject({
  data: z.strictObject({
    section: SeccionDePlantillaV2Schema,
    /** Desde cuándo este profesional los recibe. */
    sharedSince: Instante,
    current: z.strictObject({ answers: z.array(RespuestaDeCampoV2Schema), recordedAt: Instante, origin: OrigenDeHabitosSchema }).nullable(),
  }),
});
export type HabitosCompartidosResponse = z.infer<typeof HabitosCompartidosResponseSchema>;
