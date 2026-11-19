/**
 * WP-CONTEXTO-DE-LA-PERSONA (DEUDA_LEGAJO DL-179; decisión de Dirección del 2026-11-18): el contexto de la persona a mano
 * mientras el profesional planifica. Familia propia de BE, **CTX**, que la guardia de trazabilidad declara con DL-179 (el
 * 09 no la tiene; lo nuevo va en operaciones nuevas, DL-137 D-7).
 * - **API-CTX-01** `GET /advisees/{adviseeId}/person-context/form-answers`: lo que la persona respondió a las Solicitudes
 *   **de quien consulta**, en su versión vigente, de las áreas en que hoy la acompaña con el PDP permitido (la regla de
 *   FRM-05 y de la cita, DL-102). Cada pregunta, con su rótulo, su categoría, el valor estructurado y en palabras.
 * - **API-CTX-02** `GET /advisees/{adviseeId}/person-context/body`: la última toma registrada y la anterior, por métrica,
 *   con el cambio solo entre comparables (REG-06-162). Quien lleva Antropometría ve sus tomas enteras; quien recibe el
 *   resumen compartido de Antropometría (DL-163 D-13), el peso y la composición en kilos con su método, que es lo que
 *   promete el texto aceptado, y su lectura queda registrada (08 §19.7).
 * Sin acceso: el 404 de lo inexistente, el mismo para lo ajeno, lo pausado, lo revocado y lo que no existe. Objetos
 * estrictos, como el resto de los contratos (09v7 T12). Ninguna APK las lee.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CategoriaDeDato } from './formularios';
import { TipoDeCampoV2Schema, ValorDeRespuestaV2Schema } from './contratos-formularios-v2';
import { AlcanceSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';

// ─── API-CTX-01 ─────────────────────────────────────────────────────────────────────────────────

/** Una pregunta respondida, en la versión vigente de la Respuesta. */
export const RespuestaEnElContextoSchema = z.strictObject({
  fieldCode: z.string(),
  label: z.string(),
  category: z.enum([CategoriaDeDato.SALUD_Y_SEGURIDAD, CategoriaDeDato.HABITOS_Y_CONTEXTO, CategoriaDeDato.OBJETIVOS_Y_PREFERENCIAS, CategoriaDeDato.DATOS_GENERALES]),
  dataType: TipoDeCampoV2Schema,
  /** El valor como lo guardó la persona (V2; una respuesta de P0 se traduce como en API-FRI-03). */
  answer: ValorDeRespuestaV2Schema,
  /** El valor en palabras, con las etiquetas de la plantilla y la unidad (`resumenDeValor`). Nunca un código. */
  text: z.string(),
});
export type RespuestaEnElContexto = z.infer<typeof RespuestaEnElContextoSchema>;

export const SeccionEnElContextoSchema = z.strictObject({
  sectionCode: z.string(),
  title: z.string(),
  answers: z.array(RespuestaEnElContextoSchema),
});
export type SeccionEnElContexto = z.infer<typeof SeccionEnElContextoSchema>;

/** Un formulario respondido: la Solicitud, su versión vigente (para citar) y sus respuestas por sección. */
export const FormularioEnElContextoSchema = z.strictObject({
  formRequestId: IdOpaco,
  formResponseId: IdOpaco,
  /** El área en la que se pidió: la cita solo admite las del área de la evaluación. */
  scope: AlcanceSchema,
  /** La clave estable de la plantilla (`FRM-NUTRICION-INICIO`, `FRM-ENTRENAMIENTO`, `FRM-HABITOS`…). */
  templateKey: z.string(),
  templateName: z.string(),
  templateVersion: z.string(),
  purpose: z.string(),
  requestedAt: Instante,
  /** Cuándo se registró lo vigente: el envío, o la última rectificación. */
  answeredAt: Instante,
  /** El token de la versión vigente: la cita lo manda como `expectedVersion` (DL-102). */
  version: TokenDeVersionSchema,
  rectified: z.boolean(),
  /** Si se cargó con la persona y ella lo confirmó (DL-164 D-4): cuándo. */
  transcribedConfirmedAt: Instante.nullable(),
  sections: z.array(SeccionEnElContextoSchema),
});
export type FormularioEnElContexto = z.infer<typeof FormularioEnElContextoSchema>;

export const RespuestasDelContextoResponseSchema = z.strictObject({
  data: z.strictObject({
    /** Las áreas en que hoy la acompaña con el PDP permitido: de ahí salen los formularios. */
    scopes: z.array(AlcanceSchema).min(1),
    /** Del más nuevo al más viejo, por `answeredAt`. Las pendientes no están: todavía no hay nada que leer. */
    forms: z.array(FormularioEnElContextoSchema),
  }),
});
export type RespuestasDelContextoResponse = z.infer<typeof RespuestasDelContextoResponseSchema>;

// ─── API-CTX-02 ─────────────────────────────────────────────────────────────────────────────────

/** Cómo llega el cuerpo: por el área propia (todas las métricas) o por el resumen compartido (peso y composición en kg). */
export const AccesoAlCuerpoSchema = z.enum(['OWN_AREA', 'SHARED_SUMMARY']);
export type AccesoAlCuerpo = z.infer<typeof AccesoAlCuerpoSchema>;

/** Las condiciones de una toma, las que BE registra hoy (CTX-P05 propone las demás). */
export const TomaEnElContextoSchema = z.strictObject({
  evaluationId: IdOpaco,
  occurredAt: Instante,
  registeredAt: Instante,
  author: ResumenDeActorSchema,
  /** Los protocolos de sus mediciones (casi siempre uno). */
  protocols: z.array(z.string()),
  /** La procedencia de sus mediciones: medida, informada por la persona o importada. */
  origins: z.array(z.enum(['DIRECT_CAPTURE', 'SELF_REPORTED', 'CONTROLLED_IMPORT'])),
  /** El contexto que escribió quien midió; `null` sin texto, y siempre `null` en lo compartido (no es parte del resumen). */
  context: z.string().nullable(),
});
export type TomaEnElContexto = z.infer<typeof TomaEnElContextoSchema>;

export const ValorDeLaTomaSchema = z.strictObject({
  value: z.number().finite(),
  unit: z.string(),
  dataClass: z.enum(['MEASURED', 'REPORTED', 'DERIVED']),
  /** El método de un resultado calculado; `null` en una medición directa. */
  methodName: z.string().nullable(),
  protocolName: z.string(),
});
export type ValorDeLaToma = z.infer<typeof ValorDeLaTomaSchema>;

/**
 * Una métrica en las dos tomas. `change` solo si las dos tienen valor y son comparables (mismo protocolo, método y
 * unidad): la diferencia con su signo, y el «%» con su base (Dirección, 2026-11-18: «%» con su base y su número). Si no se
 * comparan, `notComparableBecause` dice por qué. Sin colores ni juicios: ubicar, nunca calificar.
 */
export const MetricaDelCuerpoSchema = z.strictObject({
  metricCode: z.string(),
  latest: ValorDeLaTomaSchema.nullable(),
  previous: ValorDeLaTomaSchema.nullable(),
  change: z.strictObject({ value: z.number().finite(), unit: z.string(), percent: z.number().finite().nullable(), base: z.number().finite() }).nullable(),
  notComparableBecause: z.array(z.enum(['PROTOCOL', 'METHOD', 'UNIT'])),
});
export type MetricaDelCuerpo = z.infer<typeof MetricaDelCuerpoSchema>;

export const CuerpoDelContextoResponseSchema = z.strictObject({
  data: z.strictObject({
    access: AccesoAlCuerpoSchema,
    /** `null`: todavía no hay ninguna toma registrada. */
    latest: TomaEnElContextoSchema.nullable(),
    previous: TomaEnElContextoSchema.nullable(),
    metrics: z.array(MetricaDelCuerpoSchema),
  }),
});
export type CuerpoDelContextoResponse = z.infer<typeof CuerpoDelContextoResponseSchema>;

/**
 * Lo que entra en el cuerpo compartido: lo que promete el texto de «resumen» que aceptó la persona («de Antropometría, el
 * peso y la composición en kilos, con su método»). Ni pliegues, ni perímetros, ni diámetros, ni el contexto de la toma.
 */
export function entraEnElCuerpoCompartido(metrica: string, unidad: string): boolean {
  if (metrica === 'peso') return true;
  return metrica.startsWith('masa-') && unidad.trim().toLowerCase() === 'kg';
}

/** Cuántas citas admite una evaluación (el mismo tope de DL-102). */
export const MAXIMO_DE_CITAS_POR_EVALUACION = 20;
