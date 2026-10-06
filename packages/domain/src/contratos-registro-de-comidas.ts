/**
 * Registro v2 de comidas (DL-121), para la APK nueva: familia de operaciones de BE `ING` (API-ING-01 a 06). Son endpoints
 * nuevos: API-NUT-14, 15, 16 y 16-LISTA, que lee la APK instalada con esquemas estrictos, no cambian de forma (09v7 T19).
 *
 * - **«Hoy» con opciones** (API-ING-01): cada opción con su imagen de referencia, sus ingredientes con estado y los macros
 *   de las porciones del plan, calculados por la API con la instantánea del plan (`SUM_SOURCE_PER_100G_V1`).
 * - **Registrar** (API-ING-02): una opción del plan con el estado de sus cantidades, o una comida diferente con texto,
 *   fotos o ambos. Lo previsto nunca se convierte en consumido: `UNCONFIRMED` no tiene macros consumidos.
 * - **Completar o corregir** (API-ING-05) es una rectificación de solo agregar; **deshacer** (API-ING-06) es una anulación
 *   auditable que libera la comida para volver a registrarla. Nada se borra.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CantidadSchema, EstadoDePreparacionSchema, FechaLocalSchema, RecetaDeOpcionSchema, ZonaHorariaSchema } from './contratos-nutricion';
import { NutrientesSchema } from './contratos-recetas';
import { LIMITES_DE_MEDIO } from './contratos-medios';
import { PaginaSchema, TokenDeVersionSchema } from './contratos-vinculo';

const TextoOpcional = (max: number) => z.string().trim().max(max);

// ─── Lo consumido ───────────────────────────────────────────────────────────────────────────────

/**
 * El estado de las cantidades consumidas de una opción del plan:
 * - `UNCONFIRMED`: registró la opción sin decir cuánto comió (el registro rápido);
 * - `PLAN_PORTIONS`: confirmó, de forma expresa, que comió las porciones del plan;
 * - `REPORTED`: informó por ingrediente una cantidad, «no lo comí» o nada. Vacío no es cero.
 */
export const EstadoDeCantidadesSchema = z.enum(['UNCONFIRMED', 'PLAN_PORTIONS', 'REPORTED']);
export type EstadoDeCantidades = z.infer<typeof EstadoDeCantidadesSchema>;

export const ItemInformadoSchema = z
  .strictObject({
    itemId: IdOpaco,
    /** `null`: no se sabe; nunca cero ni la prevista. */
    quantity: CantidadSchema.nullable(),
    /** La persona declaró que no lo comió: aporta cero porque lo dijo. */
    notEaten: z.boolean(),
  })
  .refine((i) => !(i.notEaten && i.quantity !== null), { message: 'Un ingrediente que no se comió no lleva cantidad', path: ['quantity'] });

export const ConsumoEntradaSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('UNCONFIRMED') }),
  z.strictObject({ status: z.literal('PLAN_PORTIONS') }),
  z.strictObject({ status: z.literal('REPORTED'), items: z.array(ItemInformadoSchema).min(1).max(40) }),
]);
export type ConsumoEntrada = z.infer<typeof ConsumoEntradaSchema>;

// ─── Registrar (API-ING-02) ─────────────────────────────────────────────────────────────────────

export const RegistroDeOpcionRequestSchema = z.strictObject({
  kind: z.literal('PLAN_OPTION'),
  activePlanId: IdOpaco,
  dayTypeId: IdOpaco,
  mealId: IdOpaco,
  optionId: IdOpaco,
  occurredAt: Instante,
  consumption: ConsumoEntradaSchema,
  observation: TextoOpcional(1000).nullable(),
});

export const RegistroDiferenteRequestSchema = z
  .strictObject({
    kind: z.literal('DIFFERENT'),
    activePlanId: IdOpaco,
    /** La comida del plan en la que se comió algo diferente, como contexto; `null` si no corresponde a ninguna. */
    dayTypeId: IdOpaco.nullable(),
    mealId: IdOpaco.nullable(),
    occurredAt: Instante,
    description: TextoOpcional(500).nullable(),
    /** Texto libre: no se convierte en cantidades del catálogo. */
    approximateQuantity: TextoOpcional(200).nullable(),
    /** Fotos propias `AVAILABLE` de finalidad `MEAL_EVIDENCE` (09v9 §28: `visualEvidenceUploadIds`). */
    mediaIds: z.array(IdOpaco).max(LIMITES_DE_MEDIO.fotosPorRegistro),
  })
  .refine((r) => (r.description?.length ?? 0) > 0 || r.mediaIds.length > 0, { message: 'Hace falta una descripción, una foto o las dos', path: ['description'] })
  .refine((r) => r.mealId === null || r.dayTypeId !== null, { message: 'Una comida del plan va con su día tipo', path: ['dayTypeId'] });

export const RegistrarComidaRequestSchema = z.union([RegistroDeOpcionRequestSchema, RegistroDiferenteRequestSchema]);
export type RegistrarComidaRequest = z.infer<typeof RegistrarComidaRequestSchema>;

/** API-ING-05: una rectificación nueva de las cantidades, con la versión del registro que se vio. */
export const RectificarCantidadesRequestSchema = z.strictObject({ consumption: ConsumoEntradaSchema, expectedVersion: TokenDeVersionSchema });
export type RectificarCantidadesRequest = z.infer<typeof RectificarCantidadesRequestSchema>;

/** API-ING-06: deshacer, con un motivo opcional. */
export const AnularRegistroRequestSchema = z.strictObject({ reason: TextoOpcional(200).nullable(), expectedVersion: TokenDeVersionSchema });
export type AnularRegistroRequest = z.infer<typeof AnularRegistroRequestSchema>;

// ─── Salida ─────────────────────────────────────────────────────────────────────────────────────

export const ItemDeOpcionSchema = z.strictObject({
  itemId: IdOpaco,
  catalogItemVersionId: IdOpaco,
  name: z.string(),
  /** La porción del plan: lectura, no algo que la persona completó. */
  quantity: CantidadSchema.nullable(),
  preparationState: EstadoDePreparacionSchema.nullable(),
  note: z.string().nullable(),
});
export type ItemDeOpcion = z.infer<typeof ItemDeOpcionSchema>;

export const OpcionConMacrosSchema = z.strictObject({
  optionId: IdOpaco,
  label: z.string(),
  order: z.number().int().positive(),
  /** La receta de la que nació la opción, con su versión, o `null` si se armó a mano. */
  recipe: RecetaDeOpcionSchema.extend({ description: z.string().nullable(), steps: z.array(z.string()) }).nullable(),
  /** La imagen de referencia vigente de la receta; se pide su acceso con API-MED-03. */
  image: z.strictObject({ mediaId: IdOpaco }).nullable(),
  items: z.array(ItemDeOpcionSchema),
  /** Los macros de las porciones del plan: una estimación, no lo consumido. */
  planned: NutrientesSchema,
});
export type OpcionConMacros = z.infer<typeof OpcionConMacrosSchema>;

export const ConsumoSchema = z.strictObject({
  status: EstadoDeCantidadesSchema,
  /** Lo informado por ingrediente (`REPORTED`) o las porciones del plan confirmadas (`PLAN_PORTIONS`). Vacío si `UNCONFIRMED`. */
  items: z.array(z.strictObject({ itemId: IdOpaco, quantity: CantidadSchema.nullable(), notEaten: z.boolean() })),
  /** `ORIGINAL`, o `RECTIFIED` si la vista efectiva es una rectificación. */
  source: z.enum(['ORIGINAL', 'RECTIFIED']),
  rectifiedAt: Instante.nullable(),
});

export const RegistroDeComidaSchema = z.strictObject({
  recordId: IdOpaco,
  /** La versión del registro, para `expectedVersion`: cambia con cada rectificación y con la anulación. */
  version: TokenDeVersionSchema,
  kind: z.enum(['PLAN_OPTION', 'DIFFERENT']),
  planId: IdOpaco,
  localDate: FechaLocalSchema,
  timeZone: ZonaHorariaSchema,
  occurredAt: Instante,
  recordedAt: Instante,
  dayTypeId: IdOpaco.nullable(),
  meal: z.strictObject({ mealId: IdOpaco, label: z.string() }).nullable(),
  /** La opción registrada, tal como estaba en la versión del plan: si la receta cambia después, esto no cambia. */
  option: OpcionConMacrosSchema.nullable(),
  consumption: ConsumoSchema.nullable(),
  /** Lo consumido, calculado con las cantidades confirmadas o informadas; `null` sin cantidades («Macros sin calcular»). */
  consumed: NutrientesSchema.nullable(),
  observation: z.string().nullable(),
  description: z.string().nullable(),
  approximateQuantity: z.string().nullable(),
  /** Las fotos del registro (REG-06-133). Una suprimida a pedido no figura. */
  evidence: z.array(z.strictObject({ mediaId: IdOpaco, recordedAt: Instante })),
  annulment: z.strictObject({ annulledAt: Instante, reason: z.string().nullable() }).nullable(),
});
export type RegistroDeComida = z.infer<typeof RegistroDeComidaSchema>;
export const RegistroDeComidaResponseSchema = z.strictObject({ data: RegistroDeComidaSchema });
export const ListaDeRegistrosDeComidaResponseSchema = z.strictObject({ data: z.array(RegistroDeComidaSchema), page: PaginaSchema });

/** API-ING-01. El servidor fija la fecha civil y la zona; el día tipo lo elige el asesorado si hay más de uno. */
export const HoyConOpcionesResponseSchema = z.strictObject({
  data: z.strictObject({
    date: FechaLocalSchema,
    timeZone: ZonaHorariaSchema,
    planState: z.enum(['AVAILABLE', 'NO_ACTIVE_PLAN', 'NOT_AVAILABLE']),
    plan: z.strictObject({ planId: IdOpaco, version: TokenDeVersionSchema, activatedAt: Instante }).nullable(),
    dayTypes: z.array(z.strictObject({ dayTypeId: IdOpaco, label: z.string(), order: z.number().int().positive() })),
    selectedDayTypeId: IdOpaco.nullable(),
    /** Las comidas del día tipo elegido, en el orden del plan: sus categorías salen del plan, no de una lista fija. */
    meals: z.array(
      z.strictObject({
        mealId: IdOpaco,
        label: z.string(),
        order: z.number().int().positive(),
        options: z.array(OpcionConMacrosSchema),
        /** El registro efectivo de una opción de esta comida hoy, si lo hay. */
        recordId: IdOpaco.nullable(),
      }),
    ),
    /** Los registros de hoy que no están anulados, de las dos clases. */
    records: z.array(RegistroDeComidaSchema),
  }),
});
export type HoyConOpcionesResponse = z.infer<typeof HoyConOpcionesResponseSchema>;
