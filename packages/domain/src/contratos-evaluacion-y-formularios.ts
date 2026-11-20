/**
 * WP-EVALUACION-Y-FORMULARIOS (DEUDA_LEGAJO DL-185; pedido de Dirección del 2026-11-19: «En la evaluación inicial: poder
 * vincular los formularios que la persona ya respondió»). Familia propia de BE, **EVF**, que la guardia de trazabilidad
 * declara con DL-185 (el 09 no la tiene; lo nuevo va en operaciones nuevas, DL-137 D-7). Ninguna operación de antes cambia
 * de forma y ninguna APK lee estas.
 *
 * Un formulario vinculado es una **referencia**, no una copia (EVF-D02): queda el id de la respuesta y la versión vigente
 * al vincular, con su fecha. Las respuestas se leen al abrirlo, con los mismos permisos con que se leen los formularios
 * (EVF-D03): el profesional que pidió el formulario, en el área de la evaluación, con el PDP de esa área permitido. Nada de
 * lo respondido se escribe en la evaluación, ni en el objetivo, ni en el plan que la persona comparte (EVF-D06).
 *
 * - **API-EVF-01** `GET /{area}/evaluations/{evaluationId}/linked-forms`: los formularios vinculados a una evaluación propia.
 * - **API-EVF-02** `POST /{area}/evaluations/{evaluationId}/linked-forms`: vincular uno o varios, con la versión que se vio.
 * - **API-EVF-03** `POST /{area}/evaluations/{evaluationId}/linked-forms/{linkId}/removal`: desvincular uno.
 * - **API-EVF-04** `GET /{area}/evaluations/{evaluationId}/linked-forms/{linkId}`: abrir uno, con las respuestas de la
 *   versión vinculada.
 * `{area}` es `nutrition` o `training`. Lo ajeno, lo inexistente y lo no autorizado: el mismo 404. Objetos estrictos, como
 * el resto de los contratos (09v7 T12).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { FormularioEnElContextoSchema } from './contratos-contexto-de-la-persona';
import { AlcanceSchema, TokenDeVersionSchema } from './contratos-vinculo';

/** Las áreas con «Evaluación inicial» (EVF-D01): Antropometría no tiene un paso equivalente. */
export const AREAS_DE_LA_EVALUACION = ['nutrition', 'training'] as const;
export const AreaDeLaEvaluacionSchema = z.enum(AREAS_DE_LA_EVALUACION);
export type AreaDeLaEvaluacion = z.infer<typeof AreaDeLaEvaluacionSchema>;

/** El Alcance de cada área: los formularios que se vinculan son de ese Alcance (EVF-D03). */
export const ALCANCE_DE_LA_EVALUACION: Readonly<Record<AreaDeLaEvaluacion, 'NUTRICION' | 'ENTRENAMIENTO'>> = {
  nutrition: 'NUTRICION',
  training: 'ENTRENAMIENTO',
};

/** EVF-D05: el mismo tope que las citas de una evaluación (DL-102). */
export const MAXIMO_DE_FORMULARIOS_VINCULADOS = 20;

/** Un formulario vinculado a una evaluación: la referencia a una versión de la respuesta, nunca sus respuestas. */
export const FormularioVinculadoSchema = z.strictObject({
  linkId: IdOpaco,
  formResponseId: IdOpaco,
  formRequestId: IdOpaco,
  scope: AlcanceSchema,
  /** La clave estable de la plantilla (`FRM-NUTRICION-INICIO`, `FRM-ENTRENAMIENTO`, `FRM-HABITOS`…). */
  templateKey: z.string(),
  templateName: z.string(),
  templateVersion: z.string(),
  purpose: z.string(),
  /** La versión de la respuesta que quedó vinculada: la vigente al vincular. No cambia si la persona corrige después. */
  linkedVersion: TokenDeVersionSchema,
  /** Cuándo registró la persona la versión vinculada: el envío, o la corrección vinculada. */
  answeredAt: Instante,
  linkedAt: Instante,
  /**
   * Si la persona registró una versión posterior (EVF-D04): cuál y cuándo. La evaluación conserva la vinculada; esto solo
   * ubica que hay una más nueva, sin calificarla. `null` si la vinculada sigue siendo la vigente.
   */
  laterVersion: z.strictObject({ version: TokenDeVersionSchema, answeredAt: Instante }).nullable(),
});
export type FormularioVinculado = z.infer<typeof FormularioVinculadoSchema>;

/** API-EVF-01, y la respuesta de EVF-02 y EVF-03: los vinculados hoy, en el orden en que se vincularon. */
export const FormulariosVinculadosResponseSchema = z.strictObject({
  data: z.strictObject({
    evaluationId: IdOpaco,
    links: z.array(FormularioVinculadoSchema).max(MAXIMO_DE_FORMULARIOS_VINCULADOS),
  }),
});
export type FormulariosVinculadosResponse = z.infer<typeof FormulariosVinculadosResponseSchema>;

/**
 * API-EVF-02. Cada formulario, con la versión **que el profesional vio** al elegirlo (el `version` de API-CTX-01). Si la
 * persona corrigió en el medio, 409 `VERSION_CONFLICT` y no se vincula ninguno: todos o ninguno. Si ya estaba vinculado en
 * esa versión, queda como estaba; si estaba en una anterior, la nueva la reemplaza (EVF-D04, «Vincular la más nueva»).
 */
export const VincularFormulariosRequestSchema = z.strictObject({
  links: z
    .array(z.strictObject({ formResponseId: IdOpaco, expectedVersion: TokenDeVersionSchema }))
    .min(1)
    .max(MAXIMO_DE_FORMULARIOS_VINCULADOS),
});
export type VincularFormulariosRequest = z.infer<typeof VincularFormulariosRequestSchema>;

/**
 * API-EVF-04: el vínculo y lo que respondió la persona **en la versión vinculada**, por sección, con la misma forma que el
 * panel del contexto (API-CTX-01), para dibujarlo igual. `form.version` es la versión vinculada.
 */
export const FormularioVinculadoConRespuestasResponseSchema = z.strictObject({
  data: z.strictObject({
    link: FormularioVinculadoSchema,
    form: FormularioEnElContextoSchema,
  }),
});
export type FormularioVinculadoConRespuestasResponse = z.infer<typeof FormularioVinculadoConRespuestasResponseSchema>;
