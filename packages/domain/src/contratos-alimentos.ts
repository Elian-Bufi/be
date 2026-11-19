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
 * - **API-ALI-08 (segundo tramo, NUA-D14 a D16):** compartirlo con los demás profesionales de Nutrición o dejar de
 *   compartirlo. Cada vez es un hecho nuevo, de solo agregar; lo que ya lo cita (planes activados, recetas, registros) lo
 *   conserva. Para los demás, lo que no se comparte es el mismo 404 que lo inexistente por todos los caminos.
 * - **API-ALI-05 a 07:** Administración: los alimentos cargados a mano para revisar (solo el nombre y los valores, nunca
 *   quién los cargó ni a quién se le indicaron), la decisión (certificar con una fuente, equivalente de uno verificado o
 *   quitar lo decidido) y la búsqueda de los verificados para elegir el equivalente.
 * Corregir, retirar y decidir van contra la versión que se vio (`expectedVersion`, «v» y el número de versiones del
 * alimento): si cambió, 409 VERSION_CONFLICT, como en las recetas.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CertificacionDeAlimentoSchema, GrupoDeAlimentoSchema } from './alimentos-del-catalogo';
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
  /** Si lo ven los demás profesionales (NUA-D05). */
  shared: z.boolean(),
  /**
   * Segundo tramo (NUA-D15), opcional: `true` si su autor lo compartió y después dejó de compartirlo. Ausente o `false`
   * con `shared: false`: nunca se compartió (lo cargado antes de DL-180, o sin el interruptor).
   */
  stoppedSharing: z.boolean().optional(),
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
 * `share` (segundo tramo, NUA-D14), opcional: `true` lo comparte si no se compartía (es una elección aparte, apagada por
 * defecto en el formulario); ausente o `false` no cambia lo compartido. Guardar una corrección nunca comparte solo, y
 * dejar de compartir es API-ALI-08.
 */
export const CorregirAlimentoRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  name: Texto(120),
  composition: ComposicionSchema,
  group: GrupoDeAlimentoSchema.optional(),
  share: z.boolean().optional(),
});
export type CorregirAlimentoRequest = z.infer<typeof CorregirAlimentoRequestSchema>;

/** API-ALI-03. */
export const RetirarAlimentoRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type RetirarAlimentoRequest = z.infer<typeof RetirarAlimentoRequestSchema>;

/**
 * API-ALI-08 (segundo tramo, NUA-D14 a D16): compartirlo (`true`) o dejar de compartirlo (`false`). Si ya está así, no
 * agrega nada. No va contra la versión: compartir no cambia el alimento, y se decide sobre la vigente.
 */
export const CompartirAlimentoRequestSchema = z.strictObject({ shared: z.boolean() });
export type CompartirAlimentoRequest = z.infer<typeof CompartirAlimentoRequestSchema>;

// ─── API-ALI-04 · por identidad ────────────────────────────────────────────────────────────────────

export const ConsultarAlimentosRequestSchema = z.strictObject({ catalogItemIds: z.array(IdOpaco).min(1).max(200) });
export type ConsultarAlimentosRequest = z.infer<typeof ConsultarAlimentosRequestSchema>;
/** Como una fila del buscador, más si se retiró. Los que no ve el profesional no vuelven. */
export const AlimentoConsultadoSchema = ElementoEncontradoSchema.extend({ retired: z.boolean() });
export type AlimentoConsultado = z.infer<typeof AlimentoConsultadoSchema>;
export const AlimentosConsultadosResponseSchema = z.strictObject({ data: z.array(AlimentoConsultadoSchema) });
export type AlimentosConsultadosResponse = z.infer<typeof AlimentosConsultadosResponseSchema>;

// ─── API-ALI-05 a 07 · Administración ──────────────────────────────────────────────────────────────

/** Un alimento cargado a mano, como lo ve Administración: el nombre y los valores. Nada de quién lo cargó ni de personas. */
export const AlimentoParaRevisarSchema = z.strictObject({
  catalogItemId: IdOpaco,
  versionId: IdOpaco,
  version: TokenDeVersionSchema,
  versionNumber: z.number().int().positive(),
  name: z.string(),
  composition: ComposicionSchema,
  foodGroup: GrupoDeAlimentoSchema.nullable(),
  available: z.boolean(),
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

/** API-ALI-07: los alimentos verificados de la tabla oficial, para elegir el equivalente. */
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
