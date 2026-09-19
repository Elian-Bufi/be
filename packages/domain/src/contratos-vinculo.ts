/**
 * Contratos HTTP de WP-03 como schemas compartidos (09v7 T21). Familias REL (09v8 §6), CON (09v8 §7 y 09 §31-§37) y
 * API-DSH-03 mínimo (09v11 §15; DEUDA_LEGAJO DL-031). Objetos estrictos: un campo no declarado → 400 UNKNOWN_FIELD
 * (09v7 T12). Así, un `professionalId`, un `actorCapabilities` o un `scope` elevado por el cliente nunca llegan al PDP
 * (09 §20.2.2; TEST-AUTH-009).
 *
 * Tokens:
 * - la solicitud y el vínculo usan los estados del 06, porque el 09 dice `"<canonical-06>"` (09v8:207-221);
 * - B2 y A3 usan `ACTIVE`/`REVOKED`, como el 09 (09v8:1629; 09:2495) y WP-02.
 *
 * Lo que el 09 deja sin forma se define acá y figura en DEUDA_LEGAJO DL-043:
 * - el cuerpo del `201` de REL-01;
 * - los bodies de REL-04, REL-08 y REL-09, y la forma de REL-06;
 * - `initiatedBy` en la solicitud;
 * - `reason` al pausar y al finalizar (DL-033).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';

// ─── Tipos comunes ──────────────────────────────────────────────────────────────────────────────
/** T-06-45 (06:2772-2776). Mismo conjunto que `ALCANCES` de alcance.ts (lo verifica una prueba). */
export const AlcanceSchema = z.enum(['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']);
/** Finalidades sintéticas, una por alcance (DL-039). */
export const FinalidadSchema = z.enum(['ACOMPANAMIENTO_NUTRICIONAL', 'PLANIFICACION_DEL_ENTRENAMIENTO', 'EVALUACION_ANTROPOMETRICA']);
/** `version` opaca de los recursos mutables (09:255-257). */
export const TokenDeVersionSchema = z.string().regex(/^v[1-9]\d*$/);
/** ActorSummary (09v8:161-170). `displayName` sin campos de perfil aprobados: DL-040. */
export const ResumenDeActorSchema = z.strictObject({ identityId: IdOpaco, displayName: z.string() });
/** ScopeSummary (09v8:174-184) sin `scopeId`: el alcance es un valor del catálogo, no una entidad. */
export const ResumenDeAlcanceSchema = z.strictObject({ code: AlcanceSchema, label: z.string() });
/** Colecciones paginadas (09:188-189). */
export const PaginaSchema = z.strictObject({ limit: z.number().int().positive(), nextCursor: z.string().nullable(), hasMore: z.boolean() });
/** Rol de cada parte en el vínculo. */
export const RolDeParteSchema = z.enum(['PROFESSIONAL', 'ADVISEE']);
export const EstadoDeSolicitudSchema = z.enum(['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CADUCADA', 'INVALIDADA']);
export const EstadoDeVinculoSchema = z.enum(['ACEPTADO', 'PAUSADO', 'FINALIZADO']);
export const EstadoDeConsentimientoApiSchema = z.enum(['ACTIVE', 'REVOKED']);
/** Estado de B2 visto desde el vínculo: `REQUIRED` = todavía no se otorgó (10-B04:1083-1091). */
export const EstadoDeConsentimientoEnVinculoSchema = z.enum(['REQUIRED', 'ACTIVE', 'REVOKED']);
/** 09v8:1351-1358: diagnóstico first-party calculado por el PDP; nunca un permiso reusable. */
export const ModoDeAccesoSchema = z.enum(['BLOCKED', 'CONTEXTUAL']);

// ─── API-REL-01 — Crear solicitud (09v8:1108-1192) ──────────────────────────────────────────────
export const CrearSolicitudDeVinculoRequestSchema = z.strictObject({
  /** «`target.type` será la contraparte del actor autenticado» (09v8:1138). */
  target: z.strictObject({ type: RolDeParteSchema, identityId: IdOpaco }),
  /** Código validado en semántica: fuera del catálogo → 422 SCOPE_NOT_AVAILABLE. */
  scope: z.strictObject({ code: z.string() }),
  /** Vacío → 422 PURPOSE_REQUIRED; ajena al alcance → 422 VALIDATION_FAILED (REG-06-61). */
  purpose: z.string(),
});
export type CrearSolicitudDeVinculoRequest = z.infer<typeof CrearSolicitudDeVinculoRequestSchema>;

export const SolicitudDeVinculoSchema = z.strictObject({
  relationshipRequestId: IdOpaco,
  version: TokenDeVersionSchema,
  professional: ResumenDeActorSchema,
  advisee: ResumenDeActorSchema,
  scope: ResumenDeAlcanceSchema,
  purpose: FinalidadSchema,
  state: EstadoDeSolicitudSchema,
  /** Quién inició (06:3012 «actor iniciador»). Permite distinguir recibidas de enviadas (10-B04:216-225). */
  initiatedBy: RolDeParteSchema,
  createdAt: Instante,
  /** Caducidad (DL-037). */
  expiresAt: Instante.nullable(),
});
export type SolicitudDeVinculo = z.infer<typeof SolicitudDeVinculoSchema>;

export const CrearSolicitudDeVinculoResponseSchema = z.strictObject({ data: SolicitudDeVinculoSchema });
export type CrearSolicitudDeVinculoResponse = z.infer<typeof CrearSolicitudDeVinculoResponseSchema>;
/** Equivalente pendiente: se devuelve la existente (09v8:1165-1176; CAND-09-S03, DL-037). */
export const SolicitudDeduplicadaResponseSchema = z.strictObject({
  data: z.strictObject({ relationshipRequestId: IdOpaco, deduplicated: z.literal(true) }),
});
export type SolicitudDeduplicadaResponse = z.infer<typeof SolicitudDeduplicadaResponseSchema>;
/** Lo que puede responder REL-01 con éxito: la solicitud creada (201) o la equivalente pendiente (200). */
export const RespuestaDeCrearSolicitudSchema = z.union([CrearSolicitudDeVinculoResponseSchema, SolicitudDeduplicadaResponseSchema]);
export type RespuestaDeCrearSolicitud = z.infer<typeof RespuestaDeCrearSolicitudSchema>;

// ─── API-REL-02 — Listar solicitudes propias (09v8:1196-1224) ───────────────────────────────────
export const ListaDeSolicitudesResponseSchema = z.strictObject({ data: z.array(SolicitudDeVinculoSchema), page: PaginaSchema });
export type ListaDeSolicitudesResponse = z.infer<typeof ListaDeSolicitudesResponseSchema>;

// ─── API-REL-03 / REL-04 — Aceptar o rechazar (09v8:1228-1321) ──────────────────────────────────
export const DecidirSolicitudRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type DecidirSolicitudRequest = z.infer<typeof DecidirSolicitudRequestSchema>;

export const AceptarSolicitudResponseSchema = z.strictObject({
  data: z.strictObject({
    relationshipId: IdOpaco,
    relationshipState: EstadoDeVinculoSchema,
    scope: ResumenDeAlcanceSchema,
    purpose: FinalidadSchema,
    /** Aceptar no crea B2 (09v8:1253-1258; REG-06-59). */
    consentRequired: z.literal(true),
    accessMode: z.literal('BLOCKED_PENDING_AUTHORIZATION'),
  }),
});
export type AceptarSolicitudResponse = z.infer<typeof AceptarSolicitudResponseSchema>;

export const RechazarSolicitudResponseSchema = z.strictObject({
  data: z.strictObject({ relationshipRequestId: IdOpaco, state: z.literal('RECHAZADA'), version: TokenDeVersionSchema }),
});
export type RechazarSolicitudResponse = z.infer<typeof RechazarSolicitudResponseSchema>;

// ─── API-REL-05 / REL-06 — Vínculos propios (09v8:1325-1391) ────────────────────────────────────
/** `relationshipId` = componente de Vínculo por Alcance del 06 (DL-034). */
export const VinculoSchema = z.strictObject({
  relationshipId: IdOpaco,
  version: TokenDeVersionSchema,
  professional: ResumenDeActorSchema,
  advisee: ResumenDeActorSchema,
  scope: ResumenDeAlcanceSchema,
  purpose: FinalidadSchema,
  relationshipState: EstadoDeVinculoSchema,
  consentState: EstadoDeConsentimientoEnVinculoSchema,
  accessMode: ModoDeAccesoSchema,
  /** Quién pausó, mientras está PAUSADO: solo esa parte reanuda (DL-033). */
  pausedBy: RolDeParteSchema.nullable(),
  acceptedAt: Instante,
});
export type Vinculo = z.infer<typeof VinculoSchema>;

export const ListaDeVinculosResponseSchema = z.strictObject({ data: z.array(VinculoSchema), page: PaginaSchema });
export type ListaDeVinculosResponse = z.infer<typeof ListaDeVinculosResponseSchema>;

export const ConsentimientoDeVinculoSchema = z.strictObject({
  consentId: IdOpaco,
  state: EstadoDeConsentimientoApiSchema,
  consentVersionId: IdOpaco,
  acceptedAt: Instante,
  revokedAt: Instante.nullable(),
});

/** «Historial mínimo de estado» (10-B04:627-638): sin datos sensibles ni razones internas del PDP. */
export const EntradaDeHistorialSchema = z.strictObject({
  event: z.string(),
  occurredAt: Instante,
  actor: z.enum(['PROFESSIONAL', 'ADVISEE', 'SYSTEM']),
  reason: z.string().nullable(),
});

export const DetalleDeVinculoResponseSchema = z.strictObject({
  data: VinculoSchema.extend({
    consent: ConsentimientoDeVinculoSchema.nullable(),
    history: z.array(EntradaDeHistorialSchema),
  }),
});
export type DetalleDeVinculoResponse = z.infer<typeof DetalleDeVinculoResponseSchema>;

// ─── API-REL-07 / 08 / 09 — Pausar, reanudar, finalizar (09v8:1395-1494) ────────────────────────
export const PausarVinculoRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  reason: z.enum(['DECISION_PERSONAL', 'DISPONIBILIDAD', 'OTRO']),
});
export type PausarVinculoRequest = z.infer<typeof PausarVinculoRequestSchema>;

export const ReanudarVinculoRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type ReanudarVinculoRequest = z.infer<typeof ReanudarVinculoRequestSchema>;

export const FinalizarVinculoRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  reason: z.enum(['DECISION_PERSONAL', 'OBJETIVO_CUMPLIDO', 'CAMBIO_DE_PROFESIONAL', 'OTRO']),
});
export type FinalizarVinculoRequest = z.infer<typeof FinalizarVinculoRequestSchema>;

export const VinculoResponseSchema = z.strictObject({ data: VinculoSchema });
export type VinculoResponse = z.infer<typeof VinculoResponseSchema>;

// ─── API-CON-01 — Requisitos de B2 (09v8:1500-1566) ─────────────────────────────────────────────
export const CategoriaPertinenteSchema = z.strictObject({ code: z.string(), label: z.string(), detailLevel: z.string() });

export const RequisitosDeConsentimientoResponseSchema = z.strictObject({
  data: z.strictObject({
    relationshipId: IdOpaco,
    professional: ResumenDeActorSchema,
    scope: ResumenDeAlcanceSchema,
    purpose: FinalidadSchema,
    consentVersion: z.strictObject({ id: IdOpaco, text: z.string(), textHash: z.string(), effectiveFrom: Instante }),
    /** Sin matriz de pertinencia, vacío: «ausencia de regla = deny» (09v8:1558; DL-039). */
    pertinentCategories: z.array(CategoriaPertinenteSchema),
    /** 08 §12.3: texto diferenciado por perfil. */
    professionalProfileDisclosure: z.strictObject({
      profileType: z.enum(['HEALTH_PROFESSIONAL', 'NON_HEALTH_PROFESSIONAL']),
      notice: z.string(),
    }),
  }),
});
export type RequisitosDeConsentimientoResponse = z.infer<typeof RequisitosDeConsentimientoResponseSchema>;

// ─── API-CON-02 — Otorgar B2 (09v8:1570-1660) ───────────────────────────────────────────────────
/** El cliente no reenvía profesional, alcance, finalidad ni hash: son del servidor (09v8:1595-1605). */
export const OtorgarConsentimientoRequestSchema = z.strictObject({ consentVersionId: IdOpaco });
export type OtorgarConsentimientoRequest = z.infer<typeof OtorgarConsentimientoRequestSchema>;

export const ConsentimientoOtorgadoResponseSchema = z.strictObject({
  data: z.strictObject({
    consentId: IdOpaco,
    relationshipId: IdOpaco,
    consentVersionId: IdOpaco,
    state: z.literal('ACTIVE'),
    acceptedAt: Instante,
    scope: ResumenDeAlcanceSchema,
    purpose: FinalidadSchema,
    pertinentCategories: z.array(CategoriaPertinenteSchema),
  }),
});
export type ConsentimientoOtorgadoResponse = z.infer<typeof ConsentimientoOtorgadoResponseSchema>;

// ─── API-CON-03 — Consentimientos propios (09v8:1664-1695) ──────────────────────────────────────
export const ConsentimientoPropioSchema = z.strictObject({
  consentId: IdOpaco,
  professional: ResumenDeActorSchema,
  scope: ResumenDeAlcanceSchema,
  purpose: FinalidadSchema,
  consentVersionId: IdOpaco,
  state: EstadoDeConsentimientoApiSchema,
  acceptedAt: Instante,
  revokedAt: Instante.nullable(),
  relationshipId: IdOpaco,
  relationshipState: EstadoDeVinculoSchema,
  /** «La pantalla propia puede mostrar por qué su autorización ya no es efectiva» (09v8:1691). */
  accessMode: ModoDeAccesoSchema,
});
export type ConsentimientoPropio = z.infer<typeof ConsentimientoPropioSchema>;

export const ListaDeConsentimientosResponseSchema = z.strictObject({ data: z.array(ConsentimientoPropioSchema), page: PaginaSchema });
export type ListaDeConsentimientosResponse = z.infer<typeof ListaDeConsentimientosResponseSchema>;

// ─── API-CON-04 / CON-08 — Revocar (09v8:1699-1758; 09:2558-2621) ───────────────────────────────
/** «Request: Vacío» (09v8:1711; 09:2578). Cualquier campo → 400 UNKNOWN_FIELD. */
export const CuerpoVacioSchema = z.strictObject({});

export const ConsentimientoRevocadoResponseSchema = z.strictObject({
  data: z.strictObject({ consentId: IdOpaco, state: z.literal('REVOKED'), revokedAt: Instante }),
});
export type ConsentimientoRevocadoResponse = z.infer<typeof ConsentimientoRevocadoResponseSchema>;

// ─── API-CON-06 / CON-07 — A3: otorgar e historial (09:2437-2554) ───────────────────────────────
export const OtorgarConsentimientoDeSaludRequestSchema = z.strictObject({ consentVersionId: IdOpaco });
export type OtorgarConsentimientoDeSaludRequest = z.infer<typeof OtorgarConsentimientoDeSaludRequestSchema>;

export const ConsentimientoDeSaludOtorgadoResponseSchema = z.strictObject({
  data: z.strictObject({
    consentId: IdOpaco,
    type: z.literal('HEALTH_DATA_BE'),
    consentVersionId: IdOpaco,
    state: z.literal('ACTIVE'),
    acceptedAt: Instante,
  }),
});
export type ConsentimientoDeSaludOtorgadoResponse = z.infer<typeof ConsentimientoDeSaludOtorgadoResponseSchema>;

export const ActoDeConsentimientoDeSaludSchema = z.strictObject({
  consentId: IdOpaco,
  type: z.literal('HEALTH_DATA_BE'),
  consentVersionId: IdOpaco,
  state: EstadoDeConsentimientoApiSchema,
  acceptedAt: Instante,
  revokedAt: Instante.nullable(),
});
export const HistorialDeConsentimientoDeSaludResponseSchema = z.strictObject({
  data: z.array(ActoDeConsentimientoDeSaludSchema),
  page: PaginaSchema,
});
export type HistorialDeConsentimientoDeSaludResponse = z.infer<typeof HistorialDeConsentimientoDeSaludResponseSchema>;

// ─── API-DSH-03 mínimo — Dashboard del asesorado (09v11:895-950; DL-031) ────────────────────────
/** Por dominio: disponible según el PDP, con el resumen `null` = «sin datos todavía» (RF-053: faltantes como tales). */
export const EntradaDeDominioSchema = z.union([
  z.strictObject({ available: z.literal(true), relationshipId: IdOpaco, summary: z.null() }),
  z.strictObject({ available: z.literal(false), reason: z.literal('NOT_AVAILABLE_TO_VIEW') }),
]);

export const DashboardResponseSchema = z.strictObject({
  data: z.strictObject({
    advisee: ResumenDeActorSchema,
    period: z.strictObject({ start: Instante.nullable(), end: Instante.nullable() }),
    /** Algún dominio no está disponible para este profesional (10-B04:1171-1176). */
    partialView: z.boolean(),
    domains: z.strictObject({
      nutrition: EntradaDeDominioSchema,
      training: EntradaDeDominioSchema,
      anthropometry: EntradaDeDominioSchema,
    }),
  }),
});
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

/** Clave del dashboard por alcance (09v11: `nutrition`, `training`, `anthropometry`). */
export const CLAVE_DE_DOMINIO = {
  NUTRICION: 'nutrition',
  ENTRENAMIENTO: 'training',
  ANTROPOMETRIA: 'anthropometry',
} as const;
