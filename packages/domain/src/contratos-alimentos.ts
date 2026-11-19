/**
 * WP-NUTRICION-ALIMENTOS (DL-180; docs/paquetes/WP-NUTRICION-ALIMENTOS.md) · la familia ALI: los alimentos del catálogo
 * nutricional que carga a mano un profesional, y su revisión por Administración. Objetos estrictos, como el resto.
 *
 * - **API-ALI-01:** los alimentos propios cargados a mano (también los retirados), con su versión vigente.
 * - **API-ALI-02:** corregir uno propio: nace una versión nueva. Los planes activados, las recetas y los registros
 *   conservan la versión que citaban (REG-06-101); un borrador usa la vigente, como siempre.
 * - **API-ALI-03:** retirarlo: una versión RETIRADO. Deja de aparecer en el buscador y no se puede sumar de nuevo, pero no
 *   se borra: lo que ya lo cita sigue mostrándolo, con la marca «retirado».
 * - **API-ALI-04:** consultar alimentos por su identidad (el editor del plan, para los que ya cita), también los retirados.
 * - **Segundo tramo (decisión de Dirección del 2026-11-19, NUA-D14 a D16):** lo cargado a mano es de quien lo cargó (no
 *   se comparte con nadie); Administración ve todas las cargas, con el nombre de quien las cargó, agrupa los nombres
 *   parecidos (API-ALI-08) y suma al canon lo que conviene (API-ALI-09): un alimento verificado, con su fuente.
 * - **API-ALI-05 a 07:** Administración: los alimentos cargados a mano para revisar (solo el nombre y los valores, nunca
 *   quién los cargó ni a quién se le indicaron), la decisión (certificar con una fuente, equivalente de uno verificado o
 *   quitar lo decidido) y la búsqueda de los verificados para elegir el equivalente.
 * Corregir, retirar y decidir van contra la versión que se vio (`expectedVersion`, «v» y el número de versiones del
 * alimento): si cambió, 409 VERSION_CONFLICT, como en las recetas.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CertificacionDeAlimentoSchema, GrupoDeAlimentoSchema, MedidasCaserasSchema } from './alimentos-del-catalogo';
import { ComposicionSchema, ElementoEncontradoSchema } from './contratos-nutricion';
import { PaginaSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);

/** Lo que decidió Administración sobre la versión vigente de un alimento cargado a mano. */
export const RevisionDelAlimentoSchema = z.strictObject({
  /** PENDING: nada decidido (o lo decidido se quitó, o la certificación era de una versión anterior). */
  state: z.enum(['PENDING', 'CERTIFIED', 'EQUIVALENT']),
  /** La certificación vigente, con su fuente; solo en CERTIFIED. */
  certification: CertificacionDeAlimentoSchema.nullable(),
  /** El verificado equivalente; solo en EQUIVALENT. */
  equivalent: z.strictObject({ catalogItemId: IdOpaco, name: z.string() }).nullable(),
});
export type RevisionDelAlimento = z.infer<typeof RevisionDelAlimentoSchema>;

// ─── API-ALI-01 a 03 · los propios ─────────────────────────────────────────────────────────────────

export const AlimentoPropioSchema = z.strictObject({
  catalogItemId: IdOpaco,
  /** La versión vigente (la terminal de la cadena). */
  versionId: IdOpaco,
  /** El token para corregir o retirar: «v» y el número de versiones. */
  version: TokenDeVersionSchema,
  versionNumber: z.number().int().positive(),
  name: z.string(),
  composition: ComposicionSchema,
  foodGroup: GrupoDeAlimentoSchema.nullable(),
  /** `false`: retirado. */
  available: z.boolean(),
  /** NUA-08 (segundo tramo), opcional: sus medidas caseras; ausente o vacía, ninguna. */
  householdMeasures: MedidasCaserasSchema.optional(),
  review: RevisionDelAlimentoSchema,
  createdAt: Instante,
  updatedAt: Instante,
});
export type AlimentoPropio = z.infer<typeof AlimentoPropioSchema>;
export const ListaDeAlimentosPropiosResponseSchema = z.strictObject({ data: z.array(AlimentoPropioSchema), page: PaginaSchema });
export type ListaDeAlimentosPropiosResponse = z.infer<typeof ListaDeAlimentosPropiosResponseSchema>;
export const AlimentoPropioResponseSchema = z.strictObject({ data: AlimentoPropioSchema });
export type AlimentoPropioResponse = z.infer<typeof AlimentoPropioResponseSchema>;

/**
 * API-ALI-02: el nombre y la composición de la versión nueva; `group`, opcional, cambia el grupo sin emitir una versión.
 */
export const CorregirAlimentoRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  name: Texto(120),
  composition: ComposicionSchema,
  group: GrupoDeAlimentoSchema.optional(),
  /**
   * NUA-08 (segundo tramo), opcional: las medidas caseras que quedan (una lista vacía las quita). Como el grupo, son un
   * hecho aparte de las versiones: cambiarlas no emite una versión, y los planes conservan la medida que eligieron.
   * Ausente, no cambian.
   */
  householdMeasures: MedidasCaserasSchema.optional(),
});
export type CorregirAlimentoRequest = z.infer<typeof CorregirAlimentoRequestSchema>;

/** API-ALI-03. */
export const RetirarAlimentoRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type RetirarAlimentoRequest = z.infer<typeof RetirarAlimentoRequestSchema>;


// ─── API-ALI-04 · por identidad ────────────────────────────────────────────────────────────────────

export const ConsultarAlimentosRequestSchema = z.strictObject({ catalogItemIds: z.array(IdOpaco).min(1).max(200) });
export type ConsultarAlimentosRequest = z.infer<typeof ConsultarAlimentosRequestSchema>;
/** Como una fila del buscador, más si se retiró. Los que no ve el profesional no vuelven. */
export const AlimentoConsultadoSchema = ElementoEncontradoSchema.extend({ retired: z.boolean() });
export type AlimentoConsultado = z.infer<typeof AlimentoConsultadoSchema>;
export const AlimentosConsultadosResponseSchema = z.strictObject({ data: z.array(AlimentoConsultadoSchema) });
export type AlimentosConsultadosResponse = z.infer<typeof AlimentosConsultadosResponseSchema>;

// ─── API-ALI-05 a 07 · Administración ──────────────────────────────────────────────────────────────

/**
 * Un alimento cargado a mano, como lo ve Administración: el nombre, los valores y, desde el segundo tramo (NUA-D15; decisión
 * de Dirección del 2026-11-19), el profesional que lo cargó, por su nombre de profesional. Nunca sus personas ni sus planes.
 */
export const AlimentoParaRevisarSchema = z.strictObject({
  catalogItemId: IdOpaco,
  versionId: IdOpaco,
  version: TokenDeVersionSchema,
  versionNumber: z.number().int().positive(),
  name: z.string(),
  composition: ComposicionSchema,
  foodGroup: GrupoDeAlimentoSchema.nullable(),
  available: z.boolean(),
  /** NUA-D15: quién lo cargó, por su nombre de profesional (un dato de un profesional, no de salud). */
  loadedBy: z.strictObject({ displayName: z.string() }),
  review: RevisionDelAlimentoSchema.extend({ decidedAt: Instante.nullable() }),
  createdAt: Instante,
  updatedAt: Instante,
});
export type AlimentoParaRevisar = z.infer<typeof AlimentoParaRevisarSchema>;

/** API-ALI-05: el texto y el estado van en el cuerpo, nunca en una URL. Sin estado: los que esperan revisión primero. */
export const ConsultarAlimentosParaRevisarRequestSchema = z.strictObject({
  q: z.string().trim().max(80).optional(),
  state: z.enum(['PENDING', 'CERTIFIED', 'EQUIVALENT']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().max(40).optional(),
});
export type ConsultarAlimentosParaRevisarRequest = z.infer<typeof ConsultarAlimentosParaRevisarRequestSchema>;
export const ListaDeAlimentosParaRevisarResponseSchema = z.strictObject({ data: z.array(AlimentoParaRevisarSchema), page: PaginaSchema });
export type ListaDeAlimentosParaRevisarResponse = z.infer<typeof ListaDeAlimentosParaRevisarResponseSchema>;
export const AlimentoParaRevisarResponseSchema = z.strictObject({ data: AlimentoParaRevisarSchema });
export type AlimentoParaRevisarResponse = z.infer<typeof AlimentoParaRevisarResponseSchema>;

/**
 * API-ALI-06: certificar (`source`, la fuente citada: una tabla, una publicación o el rótulo, de 1 a 500), marcar como
 * equivalente de un verificado (`equivalentCatalogItemId`; `source` opcional) o quitar lo decidido. Lo que falta para la
 * decisión elegida es 422 VALIDATION_FAILED con su ruta.
 */
export const DecidirSobreAlimentoRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  decision: z.enum(['CERTIFY', 'EQUIVALENT', 'CLEAR']),
  source: z.string().trim().max(500).optional(),
  equivalentCatalogItemId: IdOpaco.optional(),
});
export type DecidirSobreAlimentoRequest = z.infer<typeof DecidirSobreAlimentoRequestSchema>;

// ─── API-ALI-08 y 09 · los parecidos y el canon (segundo tramo, NUA-D15 y D16) ──────────────────────

/**
 * API-ALI-08: las cargas a mano agrupadas por nombre parecido (`claveDeNombreParecido`: sin tildes, sin mayúsculas, sin
 * espacios de más y sin plurales simples), con cuántos profesionales distintos cargaron algo así. Lo que más profesionales
 * cargaron va primero: es lo que conviene sumar al canon.
 */
export const ConsultarParecidosRequestSchema = z.strictObject({
  q: z.string().trim().max(80).optional(),
  /** Solo los grupos con al menos estos profesionales distintos (por defecto, 1). */
  minProfessionals: z.number().int().min(1).max(100).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type ConsultarParecidosRequest = z.infer<typeof ConsultarParecidosRequestSchema>;
export const GrupoDeParecidosSchema = z.strictObject({
  /** El nombre normalizado que los agrupa. */
  key: z.string(),
  /** Los nombres como se cargaron, distintos (hasta 5). */
  names: z.array(z.string()).max(5),
  /** Cuántos profesionales distintos cargaron algo así. */
  professionals: z.number().int().positive(),
  /** Las cargas del grupo (hasta 50), cada una con quién la cargó. */
  loads: z.array(AlimentoParaRevisarSchema).max(50),
});
export type GrupoDeParecidos = z.infer<typeof GrupoDeParecidosSchema>;
export const ListaDeParecidosResponseSchema = z.strictObject({ data: z.array(GrupoDeParecidosSchema) });
export type ListaDeParecidosResponse = z.infer<typeof ListaDeParecidosResponseSchema>;

/**
 * API-ALI-09: sumar al canon. Crea un alimento verificado de BE, de todos, con la fuente citada (obligatoria), partiendo de
 * los valores de una de las cargas (`fromCatalogItemId`) o corrigiéndolos. Puede marcar cargas a mano como equivalentes del
 * nuevo (`equivalentCatalogItemIds`): el buscador de cada autor le sugiere el verificado, y lo suyo no cambia.
 */
export const SumarAlCanonRequestSchema = z.strictObject({
  name: Texto(120),
  composition: ComposicionSchema,
  group: GrupoDeAlimentoSchema.optional(),
  source: Texto(500),
  fromCatalogItemId: IdOpaco.optional(),
  equivalentCatalogItemIds: z.array(IdOpaco).max(50).optional(),
});
export type SumarAlCanonRequest = z.infer<typeof SumarAlCanonRequestSchema>;
export const AlimentoDelCanonResponseSchema = z.strictObject({
  data: z.strictObject({
    catalogItemId: IdOpaco,
    versionId: IdOpaco,
    name: z.string(),
    composition: ComposicionSchema,
    foodGroup: GrupoDeAlimentoSchema.nullable(),
    source: z.string(),
    /** Las cargas a mano que quedaron marcadas como sus equivalentes. */
    equivalentsMarked: z.number().int().nonnegative(),
  }),
});
export type AlimentoDelCanonResponse = z.infer<typeof AlimentoDelCanonResponseSchema>;

/** API-ALI-07: los alimentos verificados de la tabla oficial y del canon, para elegir el equivalente. */
export const BuscarVerificadosRequestSchema = z.strictObject({ q: z.string().trim().min(1).max(80), limit: z.number().int().min(1).max(20).optional() });
export type BuscarVerificadosRequest = z.infer<typeof BuscarVerificadosRequestSchema>;
export const AlimentoVerificadoSchema = z.strictObject({
  catalogItemId: IdOpaco,
  versionId: IdOpaco,
  name: z.string(),
  composition: ComposicionSchema,
  foodGroup: GrupoDeAlimentoSchema.nullable(),
});
export type AlimentoVerificado = z.infer<typeof AlimentoVerificadoSchema>;
export const ListaDeVerificadosResponseSchema = z.strictObject({ data: z.array(AlimentoVerificadoSchema) });
export type ListaDeVerificadosResponse = z.infer<typeof ListaDeVerificadosResponseSchema>;
