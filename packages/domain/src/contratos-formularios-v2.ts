/**
 * Contratos HTTP de los formularios V2 (WP-FORMULARIOS-DE-INICIO, DL-164). Suman seis tipos de respuesta, las preguntas
 * condicionales y la carga del profesional que la persona confirma. **No tocan los contratos V1** de
 * `contratos-formularios.ts` (API-FRM-01 a 08): la APK instalada los lee con esquemas estrictos y una propiedad o un valor
 * nuevo le impediría abrir sus formularios (DL-152; DL-137 D-7, «lo nuevo va en operaciones nuevas»).
 *
 * Lo que se conserva del V1, y es lo importante (09 §22.7; REG-06-210):
 * - la Solicitud sigue con dos estados, `PENDING → RESPONDED`; la propuesta del profesional **no es un estado de la
 *   Solicitud**, es una entidad aparte que la acompaña mientras está pendiente (DL-164 D-3);
 * - la Respuesta sigue siendo `SELF_REPORTED`: lo que carga el profesional es una **transcripción** de lo que la persona
 *   le contó, y queda asociado al perfil solo cuando la persona lo confirma; el acto de responder sigue siendo de ella
 *   (DL-164 D-4). La transcripción queda escrita en la respuesta: quién la cargó, cuándo y qué corrigió la persona.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CategoriaDeDatoSchema, EstadoDeSolicitudDeFormularioSchema, LimitesDeCampoSchema, VistaEfectivaDeRespuestaSchema } from './contratos-formularios';
import { SeleccionabilidadSchema } from './contratos-calculo';
import { AlcanceSchema, PaginaSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);
const CodigoDeCampo = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/);
/** Código de una opción, una fila, una parte o un subcampo: minúsculas, dígitos y guion bajo. */
export const CodigoDeOpcionSchema = z.string().regex(/^[a-z0-9][a-z0-9_]{0,63}$/);
/** Hora del día en 24 horas, `HH:MM`. */
export const HoraDelDiaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

// ─── Los nueve tipos ────────────────────────────────────────────────────────────────────────────

/** Los tres de P0 (`TEXT`, `NUMBER`, `BOOLEAN`) y los seis nuevos de DL-164 D-1. */
export const TipoDeCampoV2Schema = z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'CHOICE', 'MULTI_CHOICE', 'LIST', 'MATRIX', 'FOODS', 'TIMES']);
export type TipoDeCampoV2 = z.infer<typeof TipoDeCampoV2Schema>;

export const OpcionDeCampoSchema = z.strictObject({ code: CodigoDeOpcionSchema, label: z.string().min(1).max(160) });
export type OpcionDeCampo = z.infer<typeof OpcionDeCampoSchema>;

/**
 * Pregunta condicional (DL-164 D-2): el campo se muestra —y solo entonces se puede responder o exigir— si el campo del
 * que depende, siempre **anterior** en el formulario, tiene alguno de estos valores: `true`/`false` en un Sí o no; códigos
 * de opción en una o varias opciones (con varias, alcanza con que incluya uno). Si el campo del que depende está oculto,
 * este también.
 */
export const CondicionDeVisibilidadSchema = z.strictObject({
  fieldCode: CodigoDeCampo,
  anyOf: z.array(z.union([CodigoDeOpcionSchema, z.boolean()])).min(1).max(24),
});
export type CondicionDeVisibilidad = z.infer<typeof CondicionDeVisibilidadSchema>;

const base = {
  fieldCode: CodigoDeCampo,
  label: z.string().min(1).max(300),
  category: CategoriaDeDatoSchema,
  helpText: z.string().nullable(),
  /** Para qué se usa el dato, en palabras de la persona: cada pregunta lo dice (minimización; legajo legal L-xx). */
  purpose: z.string().nullable(),
  showIf: CondicionDeVisibilidadSchema.nullable(),
  /** Lo que la plantilla sugiere como obligatorio al pedirla; el profesional lo puede cambiar (la minimización es suya, 09:1528). */
  requiredByDefault: z.boolean(),
};

/**
 * Un subcampo de una lista que se repite: una comida, un deporte, una cirugía.
 *
 * **Formato 3** (DL-165, WP-FORMULARIOS-RONDA-2): un subcampo de varias opciones (`MULTI_CHOICE`, «Qué días», D-6) y el
 * ejemplo de un subcampo de texto (`helpText`, su texto de muestra, D-2). Una versión que los usa es de formato 3 y solo
 * se le entrega a un cliente que lo declara (`forms-format-3`): la APK 0.20 lee esta forma con el esquema estricto del
 * formato 2 y no abriría el formulario (DL-152).
 */
export const SubcampoDeListaSchema = z.discriminatedUnion('dataType', [
  z.strictObject({
    code: CodigoDeOpcionSchema,
    label: z.string().min(1).max(160),
    required: z.boolean(),
    dataType: z.literal('TEXT'),
    maxLength: z.number().int().positive().max(300),
    /** Formato 3: el ejemplo, como texto de muestra del renglón. */
    helpText: z.string().min(1).max(160).optional(),
  }),
  z.strictObject({ code: CodigoDeOpcionSchema, label: z.string().min(1).max(160), required: z.boolean(), dataType: z.literal('NUMBER'), unit: z.string().nullable(), limits: LimitesDeCampoSchema.nullable() }),
  z.strictObject({ code: CodigoDeOpcionSchema, label: z.string().min(1).max(160), required: z.boolean(), dataType: z.literal('CHOICE'), options: z.array(OpcionDeCampoSchema).min(2).max(24) }),
  z.strictObject({ code: CodigoDeOpcionSchema, label: z.string().min(1).max(160), required: z.boolean(), dataType: z.literal('BOOLEAN') }),
  /** Formato 3: varias opciones dentro del renglón («Qué días»); el valor es la lista de códigos elegidos. */
  z.strictObject({ code: CodigoDeOpcionSchema, label: z.string().min(1).max(160), required: z.boolean(), dataType: z.literal('MULTI_CHOICE'), options: z.array(OpcionDeCampoSchema).min(2).max(24) }),
]);
export type SubcampoDeLista = z.infer<typeof SubcampoDeListaSchema>;

export const CampoDePlantillaV2Schema = z.discriminatedUnion('dataType', [
  z.strictObject({ ...base, dataType: z.literal('TEXT'), multiline: z.boolean(), maxLength: z.number().int().positive().max(2000) }),
  z.strictObject({ ...base, dataType: z.literal('NUMBER'), unit: z.string().nullable(), limits: LimitesDeCampoSchema.nullable() }),
  z.strictObject({ ...base, dataType: z.literal('BOOLEAN') }),
  /** Una opción. Si `otherOptionCode` no es `null`, elegir esa opción deja escribir cuál (`otherText`). */
  z.strictObject({ ...base, dataType: z.literal('CHOICE'), options: z.array(OpcionDeCampoSchema).min(2).max(24), otherOptionCode: CodigoDeOpcionSchema.nullable() }),
  /** Varias opciones. Las de `exclusiveOptionCodes` («Ninguna») van solas. */
  z.strictObject({ ...base, dataType: z.literal('MULTI_CHOICE'), options: z.array(OpcionDeCampoSchema).min(2).max(40), maxSelected: z.number().int().min(1).nullable(), exclusiveOptionCodes: z.array(CodigoDeOpcionSchema), otherOptionCode: CodigoDeOpcionSchema.nullable() }),
  /** Una lista que se repite, con sus subcampos. `itemLabel` nombra cada renglón («comida», «deporte»). */
  z.strictObject({ ...base, dataType: z.literal('LIST'), itemLabel: z.string().min(1).max(40), itemFields: z.array(SubcampoDeListaSchema).min(1).max(10), minItems: z.number().int().min(0).max(30), maxItems: z.number().int().min(1).max(30) }),
  /** Una tabla: una sola columna por fila; las filas se pueden dejar sin responder. */
  z.strictObject({ ...base, dataType: z.literal('MATRIX'), rows: z.array(OpcionDeCampoSchema).min(1).max(20), columns: z.array(OpcionDeCampoSchema).min(2).max(8) }),
  /** Alimentos: los sugeridos se tocan y se pueden sumar otros escritos. `reasons` vacío: sin motivo. */
  z.strictObject({ ...base, dataType: z.literal('FOODS'), suggestions: z.array(z.string().min(1).max(80)).max(80), reasons: z.array(OpcionDeCampoSchema).max(8), maxItems: z.number().int().min(1).max(60) }),
  /** Horarios: una hora por parte («Entre semana · me levanto»). */
  z.strictObject({ ...base, dataType: z.literal('TIMES'), parts: z.array(OpcionDeCampoSchema).min(1).max(12) }),
]);
export type CampoDePlantillaV2 = z.infer<typeof CampoDePlantillaV2Schema>;

export const SeccionDePlantillaV2Schema = z.strictObject({
  sectionCode: z.string(),
  title: z.string(),
  /** Una o dos frases que abren la sección; `null` si no hace falta. */
  intro: z.string().nullable(),
  fields: z.array(CampoDePlantillaV2Schema).min(1),
});
export type SeccionDePlantillaV2 = z.infer<typeof SeccionDePlantillaV2Schema>;

/**
 * El formato de una versión: 2 es el de DL-164; 3 suma lo de la ronda 2 (DL-165). Una de formato 3 solo se le entrega a
 * un cliente que declara `forms-format-3` (`X-BE-Capabilities`, como DL-122): para los demás es el 404 de lo inexistente.
 */
export const FormatoDeVersionV2Schema = z.union([z.literal(2), z.literal(3)]);
export type FormatoDeVersionV2 = z.infer<typeof FormatoDeVersionV2Schema>;

/**
 * API-FRM-02b · la estructura de cualquier versión en formato V2 (también las de P0, traducidas). `usesNewTypes` dice si
 * la versión necesita la app nueva: si es `true`, FRM-02 (V1) no la sirve y FRM-06 no la lista (DL-164 D-5).
 */
export const VersionDePlantillaV2Schema = z.strictObject({
  templateId: IdOpaco,
  templateVersionId: IdOpaco,
  key: z.string(),
  name: z.string(),
  purpose: z.string(),
  domain: AlcanceSchema.nullable(),
  version: z.string(),
  status: SeleccionabilidadSchema,
  format: FormatoDeVersionV2Schema,
  usesNewTypes: z.boolean(),
  /** Minutos que lleva responderlo, para decírselo a la persona; `null` si no se estimó. */
  estimatedMinutes: z.number().int().positive().nullable(),
  sections: z.array(SeccionDePlantillaV2Schema).min(1),
  supersededByVersionId: IdOpaco.nullable(),
  effectiveSince: Instante,
  provenanceNote: z.string(),
});
export type VersionDePlantillaV2 = z.infer<typeof VersionDePlantillaV2Schema>;
export const VersionDePlantillaV2ResponseSchema = z.strictObject({ data: VersionDePlantillaV2Schema });

// ─── Respuestas V2 ──────────────────────────────────────────────────────────────────────────────

/**
 * El valor de un renglón de una lista: un valor por subcampo respondido (los opcionales sin responder se omiten). Un
 * subcampo de varias opciones (formato 3) lleva la lista de códigos elegidos.
 */
export const ValorDeSubcampoSchema = z.union([z.string(), z.number(), z.boolean(), z.array(CodigoDeOpcionSchema).min(1).max(24)]);
export type ValorDeSubcampo = z.infer<typeof ValorDeSubcampoSchema>;
export const RenglonDeListaSchema = z.record(CodigoDeOpcionSchema, ValorDeSubcampoSchema);

/** Cada valor dice su tipo, que tiene que coincidir con el del campo (lo valida `validarRespuestasV2`). */
export const ValorDeRespuestaV2Schema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('TEXT'), text: z.string() }),
  z.strictObject({ type: z.literal('NUMBER'), number: z.number(), unit: z.string().nullable() }),
  z.strictObject({ type: z.literal('BOOLEAN'), yes: z.boolean() }),
  z.strictObject({ type: z.literal('CHOICE'), option: CodigoDeOpcionSchema, otherText: z.string().nullable() }),
  z.strictObject({ type: z.literal('MULTI_CHOICE'), options: z.array(CodigoDeOpcionSchema).min(1).max(40), otherText: z.string().nullable() }),
  z.strictObject({ type: z.literal('LIST'), items: z.array(RenglonDeListaSchema).min(1).max(30) }),
  z.strictObject({ type: z.literal('MATRIX'), cells: z.array(z.strictObject({ row: CodigoDeOpcionSchema, column: CodigoDeOpcionSchema })).min(1).max(20) }),
  z.strictObject({ type: z.literal('FOODS'), foods: z.array(z.strictObject({ name: z.string(), reason: CodigoDeOpcionSchema.nullable() })).min(1).max(60) }),
  z.strictObject({ type: z.literal('TIMES'), times: z.array(z.strictObject({ part: CodigoDeOpcionSchema, time: HoraDelDiaSchema })).min(1).max(12) }),
]);
export type ValorDeRespuestaV2 = z.infer<typeof ValorDeRespuestaV2Schema>;

/** Un campo opcional que no se quiere responder se **omite** del arreglo; nunca viaja vacío (09:1586-1587, igual que V1). */
export const RespuestaDeCampoV2EntradaSchema = z.strictObject({ fieldCode: z.string(), answer: ValorDeRespuestaV2Schema });
export type RespuestaDeCampoV2Entrada = z.infer<typeof RespuestaDeCampoV2EntradaSchema>;

export const RespuestaDeCampoV2Schema = z.strictObject({
  fieldCode: z.string(),
  answer: ValorDeRespuestaV2Schema,
  /** Igual que en V1: invariante (09:1581). Lo que transcribe el profesional y la persona confirma sigue siendo de ella. */
  provenance: z.literal('SELF_REPORTED'),
});
export type RespuestaDeCampoV2 = z.infer<typeof RespuestaDeCampoV2Schema>;

/** La transcripción (DL-164 D-4): quién cargó las respuestas con la persona, cuándo, y qué cambió ella antes de confirmar. */
export const TranscripcionSchema = z.strictObject({
  professional: ResumenDeActorSchema,
  loadedAt: Instante,
  confirmedAt: Instante,
  /** Los campos que la persona cambió, sumó o quitó antes de confirmar; vacío si confirmó tal cual. */
  correctedFieldCodes: z.array(z.string()),
});
export type Transcripcion = z.infer<typeof TranscripcionSchema>;

export const RectificacionDeRespuestaV2Schema = z.strictObject({
  rectificationId: IdOpaco,
  previousRectificationId: IdOpaco.nullable(),
  reason: z.string(),
  answers: z.array(RespuestaDeCampoV2Schema),
  version: TokenDeVersionSchema,
  recordedAt: Instante,
});

export const RespuestaDeFormularioV2Schema = z.strictObject({
  formResponseId: IdOpaco,
  formRequestId: IdOpaco,
  adviseeId: IdOpaco,
  templateVersionId: IdOpaco,
  original: z.strictObject({ answers: z.array(RespuestaDeCampoV2Schema) }),
  rectifications: z.array(RectificacionDeRespuestaV2Schema),
  effectiveView: VistaEfectivaDeRespuestaSchema,
  /** `null` si la persona respondió sola, desde la app. */
  transcription: TranscripcionSchema.nullable(),
  version: TokenDeVersionSchema,
  submittedAt: Instante,
});
export type RespuestaDeFormularioV2 = z.infer<typeof RespuestaDeFormularioV2Schema>;

// ─── La propuesta del profesional (DL-164 D-3) ──────────────────────────────────────────────────

/**
 * Lo que el profesional cargó con la persona y espera su confirmación. Solo la ven quien la cargó y la persona; no queda
 * asociada al perfil ni la ve nadie más hasta que la persona la confirma. Si la persona la rechaza o el profesional la
 * retira, sus respuestas se borran: no queda dato de salud sin confirmar (DL-164 D-6).
 */
export const PropuestaDeRespuestaSchema = z.strictObject({
  proposalId: IdOpaco,
  formRequestId: IdOpaco,
  professional: ResumenDeActorSchema,
  answers: z.array(RespuestaDeCampoV2EntradaSchema),
  loadedAt: Instante,
  version: TokenDeVersionSchema,
});
export type PropuestaDeRespuesta = z.infer<typeof PropuestaDeRespuestaSchema>;

/** Lo que queda de una propuesta que no se confirmó: cuándo y por qué, sin sus respuestas. Lo ve solo quien la cargó. */
export const DesenlaceDePropuestaSchema = z.strictObject({
  outcome: z.enum(['REJECTED', 'WITHDRAWN']),
  loadedAt: Instante,
  resolvedAt: Instante,
});

export const ResumenDePropuestaSchema = z.strictObject({
  proposalId: IdOpaco,
  professional: ResumenDeActorSchema,
  loadedAt: Instante,
  version: TokenDeVersionSchema,
});

/** PUT · API-FRM-09: cargar o reemplazar la propuesta. `expectedVersion: null` la crea; si ya hay una, es la de esa. */
export const CargarPropuestaRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema.nullable(),
  answers: z.array(RespuestaDeCampoV2EntradaSchema).min(1).max(80),
});
export type CargarPropuestaRequest = z.infer<typeof CargarPropuestaRequestSchema>;
export const PropuestaCargadaResponseSchema = z.strictObject({ data: z.strictObject({ proposalId: IdOpaco, version: TokenDeVersionSchema, loadedAt: Instante }) });

/** API-FRM-10 (retirar, el profesional) y API-FRM-11 (rechazar, la persona): solo con la versión que se vio. */
export const ResolverPropuestaRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type ResolverPropuestaRequest = z.infer<typeof ResolverPropuestaRequestSchema>;
export const PropuestaResueltaResponseSchema = z.strictObject({ data: z.strictObject({ proposalId: IdOpaco, outcome: z.enum(['REJECTED', 'WITHDRAWN']), resolvedAt: Instante }) });

// ─── La bandeja de la persona y el detalle V2 ───────────────────────────────────────────────────

/** API-FRM-06b · lo que FRM-06 lista, más el formato de la versión y la propuesta que espera confirmación. */
export const SolicitudPropiaV2Schema = z.strictObject({
  formRequestId: IdOpaco,
  professional: ResumenDeActorSchema,
  advisee: ResumenDeActorSchema,
  relationshipId: IdOpaco,
  purpose: z.string(),
  scope: AlcanceSchema,
  templateId: IdOpaco,
  templateVersionId: IdOpaco,
  templateName: z.string(),
  requestedFieldCodes: z.array(z.string()),
  requiredFieldCodes: z.array(z.string()),
  status: EstadoDeSolicitudDeFormularioSchema,
  createdAt: Instante,
  respondable: z.boolean(),
  usesNewTypes: z.boolean(),
  estimatedMinutes: z.number().int().positive().nullable(),
  pendingProposal: ResumenDePropuestaSchema.nullable(),
});
export type SolicitudPropiaV2 = z.infer<typeof SolicitudPropiaV2Schema>;
export const ListaDeSolicitudesPropiasV2ResponseSchema = z.strictObject({ data: z.array(SolicitudPropiaV2Schema), page: PaginaSchema });
export type ListaDeSolicitudesPropiasV2Response = z.infer<typeof ListaDeSolicitudesPropiasV2ResponseSchema>;

/**
 * API-FRM-05b · el detalle para los dos actores, con la misma forma (09:1543-1565). `proposal` es la que espera
 * confirmación (la ven quien la cargó y la persona); `lastProposalOutcome`, lo que pasó con la última que no se
 * confirmó (solo para quien la cargó). Para cualquier otro actor, los dos van en `null`.
 */
export const DetalleDeSolicitudV2Schema = z.strictObject({
  request: SolicitudPropiaV2Schema.omit({ respondable: true, pendingProposal: true }),
  respondable: z.boolean(),
  response: RespuestaDeFormularioV2Schema.nullable(),
  proposal: PropuestaDeRespuestaSchema.nullable(),
  lastProposalOutcome: DesenlaceDePropuestaSchema.nullable(),
});
export type DetalleDeSolicitudV2 = z.infer<typeof DetalleDeSolicitudV2Schema>;
export const DetalleDeSolicitudV2ResponseSchema = z.strictObject({ data: DetalleDeSolicitudV2Schema });

/** API-FRM-07b · responder (la persona), sola o confirmando la propuesta, con correcciones si hizo falta. */
export const EnviarRespuestaV2RequestSchema = z.strictObject({
  answers: z.array(RespuestaDeCampoV2EntradaSchema).min(1).max(80),
  fromProposal: z.strictObject({ proposalId: IdOpaco, expectedVersion: TokenDeVersionSchema }).nullable(),
});
export type EnviarRespuestaV2Request = z.infer<typeof EnviarRespuestaV2RequestSchema>;

/** API-FRM-08b · rectificar una respuesta V2 propia: la original no se toca (09:1618). */
export const RectificarRespuestaV2RequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  reason: Texto(1000),
  answers: z.array(RespuestaDeCampoV2EntradaSchema).min(1).max(80),
});
export type RectificarRespuestaV2Request = z.infer<typeof RectificarRespuestaV2RequestSchema>;
