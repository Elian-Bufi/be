/**
 * DL-102 y DL-179: la cita de una respuesta de formulario en una evaluación, y lo citado al leerla. La usan la evaluación
 * de Entrenamiento (DL-102) y, desde WP-CONTEXTO-DE-LA-PERSONA, la de Nutrición, con el mismo contrato y las mismas
 * reglas, cada una con su alcance. Vive aparte porque `contratos-entrenamiento.ts` importa de `contratos-nutricion.ts`.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { TokenDeVersionSchema } from './contratos-vinculo';

/**
 * DL-102 (PF-02): una respuesta de formulario citada como evidencia de la evaluación. Es una **referencia**, no una
 * copia: la declaración de la persona no se convierte en observación del profesional (CA-FOR-04 del Plan Funcional).
 * El servidor la valida al crear la evaluación: tiene que ser una respuesta del mismo asesorado, a una Solicitud de
 * del área de la evaluación (ENTRENAMIENTO o NUTRICION) del mismo profesional, con el campo respondido en la versión vigente, que es la que queda citada.
 *
 * `expectedVersion` (auditoría del #102): la versión de la respuesta **que el profesional vio** al elegirla (el `version`
 * de FRM-05). Si la persona rectificó en el medio, la API responde 409 `VERSION_CONFLICT` y no registra nada, en vez
 * de citar en silencio un valor distinto del elegido. Es opcional para los clientes anteriores; el website lo envía
 * siempre que cita.
 */
export const CitaDeRespuestaDeFormularioSchema = z.strictObject({
  formResponseId: IdOpaco,
  fieldCode: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
  expectedVersion: TokenDeVersionSchema.optional(),
});
export type CitaDeRespuestaDeFormulario = z.infer<typeof CitaDeRespuestaDeFormularioSchema>;

/**
 * Lo citado, resuelto al leer la evaluación.
 * - `value` y `unit` son los de la versión de la respuesta **vigente al citar** (`citedVersion`). `unit` es la que declaró
 *   la persona o, si no declaró ninguna, la del campo de la plantilla. `label` sale de la versión de plantilla de la
 *   Solicitud, que no cambia.
 * - `answeredAt`: cuándo se registró la versión citada. Es el envío original si `citedVersion` es la primera, o la
 *   rectificación citada.
 * - `laterVersionExists`: la persona rectificó después; el valor citado no cambia, porque la evaluación se fundó en lo
 *   que había.
 * Se lee exactamente cuando se lee la evaluación: si se revoca el acceso, la evaluación entera da 404 (no hay aviso por
 * cita).
 */
export const RespuestaCitadaSchema = z.strictObject({
  formResponseId: IdOpaco,
  formRequestId: IdOpaco,
  fieldCode: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().nullable(),
  provenance: z.literal('SELF_REPORTED'),
  citedVersion: TokenDeVersionSchema,
  answeredAt: Instante,
  laterVersionExists: z.boolean(),
});
export type RespuestaCitada = z.infer<typeof RespuestaCitadaSchema>;
