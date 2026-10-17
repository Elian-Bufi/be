/**
 * WP-NOTAS-DE-COORDINACION (DEUDA_LEGAJO DL-140; aprobado por Dirección el 2026-10-16 con todas las opciones recomendadas
 * de `docs/propuestas/NOTAS-DE-COORDINACION_ficha.md`): RF-057 (P0) · UC-E07 · API-CRD-01, la nota de coordinación
 * entre los profesionales de una persona.
 * - **API-CRD-01** `POST /advisees/{adviseeId}/coordination-notes` (09 §11.6): la escribe un profesional autorizado, para
 *   todos los profesionales que acompañan a la persona o para uno en particular (CRD-D1). Se autoriza en dos tiempos: el
 *   autor en su área de origen y cada destinatario (UC-E07, pasos 3 y 5). Los destinatarios concretos quedan guardados
 *   al escribirla: la visibilidad no cambia sola si después se suma otro profesional.
 * - **El profesional la lee en la línea de tiempo** (API-DSH-04, tipo `COORDINATION_NOTE_RECORDED`): el 09 no crea un GET
 *   propio (09 §11.6, «lectura autorizada por timeline/dashboard»). La ve su autor y sus destinatarios, mientras tengan
 *   el acceso de la línea de tiempo con esa persona; con el vínculo en pausa o terminado, no (08 Q-005, §14).
 * - **API-CRD-01-LISTA** `GET /advisees/{adviseeId}/coordination-notes/recipients`: a quién se le puede escribir hoy y
 *   desde qué área. Es lo que necesita el autor para elegir (CRD-D1); no trae ninguna nota.
 * - **API-CRD-01-PROPIA** `GET /me/coordination-notes`: la persona lee todas las notas sobre ella (CRD-D2; 08 §9.15: sin
 *   notas secretas), también con el vínculo en pausa o terminado (08 §14.3). Sin el A3 vigente, 403 (08:406), como REV-A.
 * - **Texto libre acotado** (CRD-D3): hasta 600 caracteres, sin adjuntos y sin resúmenes automáticos. **Finalidad de una
 *   lista cerrada** (CRD-D4). **Referencias solo del área de origen del autor** (CRD-D5): se ve que existen, pero nombrarlas
 *   no da acceso. **Solo se agrega** (CRD-D7): para corregir, otra nota que la cita.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { AlcanceSchema, PaginaSchema, ResumenDeActorSchema, ResumenDeAlcanceSchema } from './contratos-vinculo';
import type { Alcance } from './alcance';

/** CRD-D3: el texto libre, acotado. La base no admite más (CHECK en la migración). */
export const MAXIMO_DE_CARACTERES_DE_LA_NOTA = 600;
/** CRD-D5: como mucho tres recursos citados por nota. */
export const MAXIMO_DE_REFERENCIAS_DE_LA_NOTA = 3;

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const IdDeRecurso = z.string().regex(UUID);

/**
 * CRD-D4: la finalidad de la nota, de una lista cerrada. No es la finalidad del tratamiento (la del alcance, DL-039):
 * dice para qué le escribe un profesional a otro.
 */
export const FINALIDADES_DE_NOTA = ['CONTEXT_FOR_YOUR_AREA', 'CHANGE_IN_MY_AREA', 'COORDINATION_REQUEST'] as const;
export const FinalidadDeNotaSchema = z.enum(FINALIDADES_DE_NOTA);
export type FinalidadDeNota = z.infer<typeof FinalidadDeNotaSchema>;

/**
 * CRD-D5: lo que una nota puede citar, siempre del área de origen del autor y suyo con esa persona: una versión activada de
 * su plan, una revisión registrada o una toma antropométrica registrada. Los mismos tipos de origen que la línea de tiempo.
 */
export const TIPOS_DE_REFERENCIA_DE_NOTA = ['NUTRITION_PLAN_VERSION', 'NUTRITION_REVIEW', 'TRAINING_PLAN_VERSION', 'TRAINING_REVIEW', 'ANTHROPOMETRIC_EVALUATION'] as const;
export const TipoDeReferenciaDeNotaSchema = z.enum(TIPOS_DE_REFERENCIA_DE_NOTA);
export type TipoDeReferenciaDeNota = z.infer<typeof TipoDeReferenciaDeNotaSchema>;

/** El área de cada tipo de referencia: solo se cita lo del área desde la que se escribe. */
export const ALCANCE_DE_LA_REFERENCIA: Readonly<Record<TipoDeReferenciaDeNota, Alcance>> = {
  NUTRITION_PLAN_VERSION: 'NUTRICION',
  NUTRITION_REVIEW: 'NUTRICION',
  TRAINING_PLAN_VERSION: 'ENTRENAMIENTO',
  TRAINING_REVIEW: 'ENTRENAMIENTO',
  ANTHROPOMETRIC_EVALUATION: 'ANTROPOMETRIA',
};

/** Los tipos que se pueden citar desde un área. */
export const referenciasDelArea = (alcance: Alcance): readonly TipoDeReferenciaDeNota[] => TIPOS_DE_REFERENCIA_DE_NOTA.filter((t) => ALCANCE_DE_LA_REFERENCIA[t] === alcance);

/** Un recurso citado, por su identificador. */
export const ReferenciaDeNotaRequestSchema = z.strictObject({ type: TipoDeReferenciaDeNotaSchema, id: IdDeRecurso });
export type ReferenciaDeNotaRequest = z.infer<typeof ReferenciaDeNotaRequestSchema>;

/**
 * CRD-D1: todos los profesionales que hoy acompañan a la persona, o uno en particular. En los dos casos, solo los que ese
 * día tienen con ella un vínculo aceptado y el B2 vigente, en cualquier alcance (lo decide el PDP).
 */
export const DestinatariosDeNotaRequestSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('ALL') }),
  z.strictObject({ mode: z.literal('ONE'), identityId: IdDeRecurso }),
]);
export type DestinatariosDeNotaRequest = z.infer<typeof DestinatariosDeNotaRequestSchema>;

/**
 * API-CRD-01. El texto llega recortado en sus bordes (los saltos de línea de adentro quedan). `correctsNoteId` cita una nota
 * anterior del mismo autor sobre la misma persona: es la única forma de corregir, porque una nota no se edita (CRD-D7).
 */
export const CrearNotaDeCoordinacionRequestSchema = z
  .strictObject({
    originScope: AlcanceSchema,
    purpose: FinalidadDeNotaSchema,
    recipients: DestinatariosDeNotaRequestSchema,
    text: z.string().trim().min(1).max(MAXIMO_DE_CARACTERES_DE_LA_NOTA),
    references: z.array(ReferenciaDeNotaRequestSchema).max(MAXIMO_DE_REFERENCIAS_DE_LA_NOTA).optional(),
    correctsNoteId: IdDeRecurso.optional(),
  })
  .superRefine((p, ctx) => {
    const vistas = new Set<string>();
    (p.references ?? []).forEach((r, i) => {
      const clave = `${r.type}|${r.id.toLowerCase()}`;
      if (vistas.has(clave)) ctx.addIssue({ code: 'custom', path: ['references', i], message: 'referencia repetida' });
      vistas.add(clave);
    });
  });
export type CrearNotaDeCoordinacionRequest = z.infer<typeof CrearNotaDeCoordinacionRequestSchema>;

/**
 * Un recurso citado, como lo lee cualquiera que lee la nota: el tipo, su identificador y un rótulo («Plan de Nutrición,
 * versión 3, activada el 10/10/2026»). Ver la referencia no la abre: se abre con el permiso que ya se tenía (CRD-D5).
 */
export const ReferenciaDeNotaSchema = z.strictObject({ type: TipoDeReferenciaDeNotaSchema, id: IdOpaco, label: z.string().min(1) });
export type ReferenciaDeNota = z.infer<typeof ReferenciaDeNotaSchema>;

/** Otra nota, citada por su identificador y su fecha de registro. */
export const NotaCitadaSchema = z.strictObject({ noteId: IdOpaco, recordedAt: Instante });

/**
 * Una nota de coordinación como la lee quien puede leerla (su autor en la respuesta de API-CRD-01, la persona en
 * API-CRD-01-PROPIA). Sin campos de más: lo que guarda BE es esto.
 * - `recipients`: el modo que eligió el autor y las personas concretas que la recibieron al escribirla.
 * - `corrects`: la nota anterior que corrige, o `null`. `correctedBy`: las notas que la corrigen después, de las que este
 *   lector puede leer.
 */
export const NotaDeCoordinacionSchema = z.strictObject({
  noteId: IdOpaco,
  adviseeId: IdOpaco,
  author: ResumenDeActorSchema,
  originScope: ResumenDeAlcanceSchema,
  purpose: FinalidadDeNotaSchema,
  recipients: z.strictObject({ mode: z.enum(['ALL', 'ONE']), people: z.array(ResumenDeActorSchema).min(1) }),
  text: z.string().min(1).max(MAXIMO_DE_CARACTERES_DE_LA_NOTA),
  references: z.array(ReferenciaDeNotaSchema).max(MAXIMO_DE_REFERENCIAS_DE_LA_NOTA),
  corrects: NotaCitadaSchema.nullable(),
  correctedBy: z.array(NotaCitadaSchema),
  recordedAt: Instante,
});
export type NotaDeCoordinacion = z.infer<typeof NotaDeCoordinacionSchema>;

/** API-CRD-01: 201 con la nota registrada. */
export const NotaDeCoordinacionResponseSchema = z.strictObject({ data: NotaDeCoordinacionSchema });
export type NotaDeCoordinacionResponse = z.infer<typeof NotaDeCoordinacionResponseSchema>;

/** API-CRD-01-PROPIA: las notas sobre la persona, de la más nueva a la más vieja. */
export const ListaDeNotasPropiasResponseSchema = z.strictObject({ data: z.array(NotaDeCoordinacionSchema), page: PaginaSchema });
export type ListaDeNotasPropiasResponse = z.infer<typeof ListaDeNotasPropiasResponseSchema>;

/**
 * API-CRD-01-LISTA: lo que el autor necesita para escribir.
 * - `origins`: las áreas desde las que hoy puede escribir sobre esta persona (las suyas con ella, que el PDP permite).
 * - `recipients`: los otros profesionales que hoy la acompañan (vínculo aceptado y B2 vigente en algún alcance, según el
 *   PDP), con las áreas en que la acompañan. Es la lista de «todos» y de donde se elige «uno en particular».
 */
export const DestinatariosPosiblesResponseSchema = z.strictObject({
  data: z.strictObject({
    origins: z.array(ResumenDeAlcanceSchema),
    recipients: z.array(z.strictObject({ identityId: IdOpaco, displayName: z.string(), scopes: z.array(ResumenDeAlcanceSchema).min(1) })),
  }),
});
export type DestinatariosPosiblesResponse = z.infer<typeof DestinatariosPosiblesResponseSchema>;
