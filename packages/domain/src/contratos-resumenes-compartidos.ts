/**
 * Contratos HTTP de lo que la persona les comparte a sus profesionales de otras áreas (DL-163 D-13, ampliada por Dirección
 * el 2026-11-07; WP-TABLERO-ALTA-GAMA TB-52 a TB-56): la familia **API-RES**, propia de BE. El 09 no tiene estas
 * operaciones (lo nuevo va en operaciones nuevas, DL-137 D-7).
 *
 * - API-RES-01 · `GET /me/summary-sharing` — la persona: qué comparte, con quién, en qué nivel, desde cuándo y quién lo miró.
 * - API-RES-02 · `PUT /me/summary-sharing` — la persona: compartir, o cambiar con quién y en qué nivel, con el texto que
 *   acepta. La lista es completa: lo que no está, deja de compartirse.
 * - API-RES-03 · `POST /me/summary-sharing/withdrawal` — la persona: dejar de compartir todo, a la vez.
 * - API-RES-04 · `GET /advisees/{adviseeId}/shared-summaries` — el profesional: las otras áreas de la persona, quién las
 *   lleva, qué le comparte de cada una y su pedido. Lo que cuenta de quién lleva cada área es lo que ya dice API-CRD-01-LISTA.
 * - API-RES-06 · `GET /advisees/{adviseeId}/shared-summaries/{area}/plan` — el profesional: el plan vigente del área, con el
 *   nivel «resumen y plan». Si no se lo comparten, el 404 de lo inexistente.
 * - API-RES-07 · `GET /advisees/{adviseeId}/shared-summaries/outgoing` — quien lleva un área: con quién se comparte lo suyo.
 * - API-RES-08 · `POST /advisees/{adviseeId}/shared-summaries/access-requests` — el profesional pide ver el plan de otra área.
 * - API-RES-09 · `GET /me/summary-sharing/access-requests` — la persona: los pedidos que esperan su respuesta.
 * - API-RES-10 · `POST /me/summary-sharing/access-requests/{accessRequestId}/answer` — la persona responde: sí o no, por ahora.
 *
 * API-RES-05 (las series de un resumen para «Analizar», TB-29) no está en este tramo. Ninguna APK instalada lee estas
 * operaciones: lo que leen no cambia (DL-152). Objetos estrictos, como el resto de los contratos (09v7 T12).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { VersionDeObjetivoDeEntrenamientoSchema, VersionDePlanDeEntrenamientoSchema } from './contratos-entrenamiento';
import { AprobacionDelTextoSchema } from './contratos-evidencia-visual';
import { FechaLocalSchema, VersionDeObjetivoSchema, VersionDePlanSchema } from './contratos-nutricion';
import { AlcanceSchema, ResumenDeActorSchema, ResumenDeAlcanceSchema, TokenDeVersionSchema } from './contratos-vinculo';

/**
 * El nivel de lo que se comparte de un área con un profesional (TA-85): el resumen, o el resumen y el plan completo de
 * solo lectura. Antropometría no tiene plan: solo `SUMMARY`.
 */
export const NivelDeResumenSchema = z.enum(['SUMMARY', 'SUMMARY_AND_PLAN']);
export type NivelDeResumen = z.infer<typeof NivelDeResumenSchema>;

/** Las áreas que tienen plan. */
export const AREAS_CON_PLAN = ['NUTRICION', 'ENTRENAMIENTO'] as const;
export const AreaConPlanSchema = z.enum(AREAS_CON_PLAN);
export type AreaConPlan = z.infer<typeof AreaConPlanSchema>;

/**
 * La matriz del plan completo (TA-87, decidida por Dirección el 2026-11-07: «todos con todos, con permiso»): cada área ve
 * el plan de las otras dos, siempre con el nivel «resumen y plan» que elige la persona. Sin fila, es no. Un profesional
 * que ya lleva el área de origen con la persona no la recibe como compartida: la ve por su Alcance.
 */
export const MATRIZ_DEL_PLAN_COMPLETO: Readonly<Record<AreaConPlan, readonly z.infer<typeof AlcanceSchema>[]>> = {
  NUTRICION: ['ENTRENAMIENTO', 'ANTROPOMETRIA'],
  ENTRENAMIENTO: ['NUTRICION', 'ANTROPOMETRIA'],
};

/** Si la matriz deja que quien lleva `areasDelReceptor` reciba el plan de `origen`. */
export function laMatrizDejaVerElPlan(origen: AreaConPlan, areasDelReceptor: readonly z.infer<typeof AlcanceSchema>[]): boolean {
  if (areasDelReceptor.includes(origen)) return false;
  return areasDelReceptor.some((a) => MATRIZ_DEL_PLAN_COMPLETO[origen].includes(a));
}

/** Un área compartida con un profesional: el área de origen, el nivel y desde cuándo. */
export const AreaCompartidaSchema = z.strictObject({
  area: AlcanceSchema,
  level: NivelDeResumenSchema,
  since: Instante,
});
export type AreaCompartida = z.infer<typeof AreaCompartidaSchema>;

/** Lo que la autorización es hoy: como la de los hábitos (API-HBT), sin un booleano. */
export const EstadoDeCompartirResumenesSchema = z.enum(['NOT_GIVEN', 'ACTIVE', 'WITHDRAWN']);
export type EstadoDeCompartirResumenes = z.infer<typeof EstadoDeCompartirResumenesSchema>;

export const CompartirResumenesSchema = z.strictObject({
  status: EstadoDeCompartirResumenesSchema,
  /** El token de la última versión (`expectedVersion` de API-RES-02 y 03); `null` si nunca la dio. */
  version: TokenDeVersionSchema.nullable(),
  activeSince: Instante.nullable(),
  withdrawnAt: Instante.nullable(),
  acceptedTextVersionId: IdOpaco.nullable(),
});
export type CompartirResumenes = z.infer<typeof CompartirResumenesSchema>;

/** Un profesional de la persona, sus áreas con ella y lo que hoy le comparte de las otras. */
export const ProfesionalParaResumenesSchema = z.strictObject({
  professional: ResumenDeActorSchema,
  scopes: z.array(ResumenDeAlcanceSchema).min(1),
  link: z.enum(['ACTIVE', 'PAUSED']),
  /** Las áreas de origen que se le pueden compartir: las de otro profesional de la persona que él no lleva. */
  shareableAreas: z.array(AlcanceSchema),
  shares: z.array(AreaCompartidaSchema),
});
export type ProfesionalParaResumenes = z.infer<typeof ProfesionalParaResumenesSchema>;

/** El texto del acto «Compartir con mis profesionales lo de otras áreas», con su aprobación (`PENDING_APPROVAL`). */
export const TextoDeCompartirResumenesSchema = z.strictObject({
  id: IdOpaco,
  title: z.string(),
  text: z.string(),
  textHash: z.string(),
  effectiveFrom: Instante,
  approval: AprobacionDelTextoSchema,
});
export type TextoDeCompartirResumenes = z.infer<typeof TextoDeCompartirResumenesSchema>;

/** Una lectura de lo compartido: quién la hizo, de qué área y cuándo. La persona ve todas (08 §19.7). */
export const AccesoALoCompartidoSchema = z.strictObject({
  professional: ResumenDeActorSchema,
  area: AlcanceSchema,
  readAt: Instante,
});
export type AccesoALoCompartido = z.infer<typeof AccesoALoCompartidoSchema>;

/** Lo que la autorización es hoy, con los profesionales: lo devuelven API-RES-01, 02 y 03. */
export const EstadoDeResumenesCompartidosSchema = z.strictObject({
  sharing: CompartirResumenesSchema,
  professionals: z.array(ProfesionalParaResumenesSchema),
});
export type EstadoDeResumenesCompartidos = z.infer<typeof EstadoDeResumenesCompartidosSchema>;

// ─── API-RES-01 ─────────────────────────────────────────────────────────────────────────────────
export const MisResumenesCompartidosResponseSchema = z.strictObject({
  data: z.strictObject({
    sharing: CompartirResumenesSchema,
    professionals: z.array(ProfesionalParaResumenesSchema),
    /** El texto vigente del acto: el que se muestra al compartir. */
    text: TextoDeCompartirResumenesSchema,
    /** Las últimas lecturas de lo compartido, de la más nueva a la más vieja (hasta 50). */
    accesses: z.array(AccesoALoCompartidoSchema),
  }),
});
export type MisResumenesCompartidosResponse = z.infer<typeof MisResumenesCompartidosResponseSchema>;

// ─── API-RES-02 ─────────────────────────────────────────────────────────────────────────────────
export const PermisoDeResumenSchema = z.strictObject({
  professionalId: IdOpaco,
  area: AlcanceSchema,
  level: NivelDeResumenSchema,
});
export type PermisoDeResumen = z.infer<typeof PermisoDeResumenSchema>;

export const CompartirResumenesRequestSchema = z
  .strictObject({
    /** El token de la última versión que se vio; `null` si nunca la dio. */
    expectedVersion: TokenDeVersionSchema.nullable(),
    /** La versión del texto que se mostró: la mostrada es la aceptada (08 §12.2). Subir de nivel la pide de nuevo. */
    textVersionId: IdOpaco,
    /** La lista completa: lo que no está deja de compartirse. Al menos uno; para no compartir nada, API-RES-03. */
    grants: z.array(PermisoDeResumenSchema).min(1).max(60),
  })
  .refine((p) => p.grants.every((g) => g.area !== 'ANTROPOMETRIA' || g.level === 'SUMMARY'), { path: ['grants'], message: 'Antropometría no tiene plan: solo SUMMARY.' })
  .refine((p) => new Set(p.grants.map((g) => `${g.professionalId}|${g.area}`)).size === p.grants.length, { path: ['grants'], message: 'Un profesional y un área, una sola vez.' });
export type CompartirResumenesRequest = z.infer<typeof CompartirResumenesRequestSchema>;

export const ResumenesCompartidosEstadoResponseSchema = z.strictObject({ data: EstadoDeResumenesCompartidosSchema });
export type ResumenesCompartidosEstadoResponse = z.infer<typeof ResumenesCompartidosEstadoResponseSchema>;

// ─── API-RES-03 ─────────────────────────────────────────────────────────────────────────────────
export const DejarDeCompartirResumenesRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type DejarDeCompartirResumenesRequest = z.infer<typeof DejarDeCompartirResumenesRequestSchema>;

// ─── Los pedidos (TB-56) ────────────────────────────────────────────────────────────────────────
export const EstadoDelPedidoDePlanSchema = z.enum(['PENDING', 'ANSWERED']);
export type EstadoDelPedidoDePlan = z.infer<typeof EstadoDelPedidoDePlanSchema>;

/** Un pedido de ver el plan, como lo ve el profesional que lo hizo: respondido, sin decir qué (lo dice API-RES-04). */
export const PedidoDePlanDelProfesionalSchema = z.strictObject({
  accessRequestId: IdOpaco,
  /** El área desde la que lo pidió: es el «para qué» de la novedad. */
  scope: AlcanceSchema,
  /** El área cuyo plan pide ver. */
  area: AreaConPlanSchema,
  status: EstadoDelPedidoDePlanSchema,
  requestedAt: Instante,
});
export type PedidoDePlanDelProfesional = z.infer<typeof PedidoDePlanDelProfesionalSchema>;

// ─── API-RES-04 ─────────────────────────────────────────────────────────────────────────────────
/** Otra área de la persona, para un profesional que no la lleva. */
export const OtraAreaSchema = z.strictObject({
  area: AlcanceSchema,
  /** Quien la lleva hoy (lo que ya dice API-CRD-01-LISTA); `null` si nadie. */
  professional: ResumenDeActorSchema.nullable(),
  /** Lo que la persona le comparte de esta área; `null` si nada. */
  shared: z.strictObject({ level: NivelDeResumenSchema, since: Instante }).nullable(),
  /** Su último pedido de ver el plan de esta área, o `null`. */
  accessRequest: PedidoDePlanDelProfesionalSchema.nullable(),
  /** Si hoy puede pedir ver el plan: tiene plan, la matriz lo deja, no lo ve, y pasaron 7 días del último sin respuesta. */
  canRequestPlan: z.boolean(),
  canRequestPlanFrom: Instante.nullable(),
});
export type OtraArea = z.infer<typeof OtraAreaSchema>;

export const ResumenesParaElProfesionalResponseSchema = z.strictObject({
  data: z.strictObject({
    /** Las áreas en las que hoy la acompaña con el acceso vigente: desde ahí puede pedir. */
    scopes: z.array(AlcanceSchema).min(1),
    areas: z.array(OtraAreaSchema),
  }),
});
export type ResumenesParaElProfesionalResponse = z.infer<typeof ResumenesParaElProfesionalResponseSchema>;

// ─── API-RES-06 ─────────────────────────────────────────────────────────────────────────────────
/**
 * Lo avanzado desde que rige el plan, en cifras (TA-86): lo registrado por semana de BE (lunes a domingo, en la zona de la
 * persona), hasta 12 semanas. En Entrenamiento son sesiones; en Nutrición, registros de comida. `plannedPerWeek` son las
 * sesiones por semana que fija la agenda del plan, o `null` si no tiene agenda (o es Nutrición). Sin «%».
 */
export const AvanceDelPlanSchema = z.strictObject({
  unit: z.enum(['SESSIONS', 'MEAL_RECORDS']),
  plannedPerWeek: z.number().int().nonnegative().nullable(),
  weeks: z.array(z.strictObject({ weekStart: FechaLocalSchema, recorded: z.number().int().nonnegative() })),
});
export type AvanceDelPlan = z.infer<typeof AvanceDelPlanSchema>;

const PlanCompartidoBase = {
  author: ResumenDeActorSchema,
  level: z.literal('SUMMARY_AND_PLAN'),
  sharedSince: Instante,
  activatedAt: Instante,
  /** La fecha de la próxima revisión acordada, sin su contenido; `null` si no hay. */
  nextReviewAt: FechaLocalSchema.nullable(),
  progress: AvanceDelPlanSchema,
};

/**
 * El plan vigente de un área compartida, como lo ve la persona (TA-86): la versión activada (su instantánea), nunca un
 * borrador, una versión anterior, una revisión, una nota interna ni una evaluación.
 */
export const PlanCompartidoSchema = z.discriminatedUnion('area', [
  z.strictObject({ area: z.literal('NUTRICION'), ...PlanCompartidoBase, plan: VersionDePlanSchema, objective: VersionDeObjetivoSchema.nullable() }),
  z.strictObject({ area: z.literal('ENTRENAMIENTO'), ...PlanCompartidoBase, plan: VersionDePlanDeEntrenamientoSchema, objective: VersionDeObjetivoDeEntrenamientoSchema.nullable() }),
]);
export type PlanCompartido = z.infer<typeof PlanCompartidoSchema>;

/** `data: null`: se lo comparten, pero el área no tiene un plan vigente (TA-92). */
export const PlanCompartidoResponseSchema = z.strictObject({ data: PlanCompartidoSchema.nullable() });
export type PlanCompartidoResponse = z.infer<typeof PlanCompartidoResponseSchema>;

// ─── API-RES-07 ─────────────────────────────────────────────────────────────────────────────────
export const LoQueSeComparteDeMiAreaResponseSchema = z.strictObject({
  data: z.array(
    z.strictObject({
      /** Mi área con la persona, la que se comparte. */
      area: AlcanceSchema,
      professional: ResumenDeActorSchema,
      level: NivelDeResumenSchema,
      since: Instante,
    }),
  ),
});
export type LoQueSeComparteDeMiAreaResponse = z.infer<typeof LoQueSeComparteDeMiAreaResponseSchema>;

// ─── API-RES-08 ─────────────────────────────────────────────────────────────────────────────────
export const PedirVerElPlanRequestSchema = z
  .strictObject({
    /** El área desde la que lo pide: tiene que tener el vínculo vigente con la persona en esa área. */
    scope: AlcanceSchema,
    /** El área cuyo plan pide ver: otra. */
    area: AreaConPlanSchema,
  })
  .refine((p) => p.scope !== p.area, { path: ['area'], message: 'El plan de otra área.' });
export type PedirVerElPlanRequest = z.infer<typeof PedirVerElPlanRequestSchema>;
export const PedidoDePlanCreadoResponseSchema = z.strictObject({ data: PedidoDePlanDelProfesionalSchema });
export type PedidoDePlanCreadoResponse = z.infer<typeof PedidoDePlanCreadoResponseSchema>;

// ─── API-RES-09 ─────────────────────────────────────────────────────────────────────────────────
export const PedidoDePlanParaLaPersonaSchema = z.strictObject({
  accessRequestId: IdOpaco,
  version: TokenDeVersionSchema,
  professional: ResumenDeActorSchema,
  /** El área desde la que se lo piden: con ella, la app dice para qué. */
  scope: ResumenDeAlcanceSchema,
  /** El área cuyo plan le piden ver. */
  area: AreaConPlanSchema,
  requestedAt: Instante,
});
export type PedidoDePlanParaLaPersona = z.infer<typeof PedidoDePlanParaLaPersonaSchema>;
export const PedidosDePlanResponseSchema = z.strictObject({ data: z.array(PedidoDePlanParaLaPersonaSchema) });
export type PedidosDePlanResponse = z.infer<typeof PedidosDePlanResponseSchema>;

// ─── API-RES-10 ─────────────────────────────────────────────────────────────────────────────────
/**
 * «Sí, que lo vea» (`SHARE`: comparte esa área con ese profesional en el nivel «resumen y plan», con la versión de la
 * autorización que se vio y el texto que se mostró) o «No, por ahora» (`NOT_NOW`, sin `sharing`). Las dos, con el mismo peso.
 */
export const ResponderPedidoDePlanRequestSchema = z
  .strictObject({
    expectedVersion: TokenDeVersionSchema,
    answer: z.enum(['SHARE', 'NOT_NOW']),
    sharing: z.strictObject({ expectedVersion: TokenDeVersionSchema.nullable(), textVersionId: IdOpaco }).nullable(),
  })
  .refine((p) => (p.answer === 'SHARE') === (p.sharing !== null), { path: ['sharing'], message: 'SHARE lleva sharing; NOT_NOW, null.' });
export type ResponderPedidoDePlanRequest = z.infer<typeof ResponderPedidoDePlanRequestSchema>;

export const PedidoDePlanRespondidoResponseSchema = z.strictObject({
  data: z.strictObject({ accessRequestId: IdOpaco, answer: z.enum(['SHARE', 'NOT_NOW']), answeredAt: Instante }),
});
export type PedidoDePlanRespondidoResponse = z.infer<typeof PedidoDePlanRespondidoResponseSchema>;
