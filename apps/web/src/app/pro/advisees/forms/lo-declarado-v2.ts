/**
 * «Lo que declaró» para una respuesta en formato V2 (API-FRI-03; DL-164), sin React, probado en
 * `apps/web/test/lo-declarado-v2.test.mjs`. Las reglas de siempre —qué versión rige, qué fila está corregida y qué
 * había antes— son las de `loDeclarado` del dominio, que compara **textos**: acá cada valor V2 se traduce a su texto con
 * `resumenDeValor` (las etiquetas de la plantilla, nunca los códigos) y se delega. Lo que esta lectura suma:
 * - las respuestas **crudas** de la versión que rige (`queRige`), para dibujar una lista o una tabla por renglón;
 * - la transcripción (DL-164 D-4): quién cargó, cuándo confirmó la persona y qué corrigió antes de confirmar.
 */
import { camposEnOrden, loDeclarado, resumenDeValor, type LoDeclarado, type RespuestaDeCampoV2, type RespuestaDeFormulario, type RespuestaDeFormularioV2, type SeccionDePlantillaV2, type SolicitudDeFormulario, type Transcripcion, type VersionDePlantilla } from '@be/domain';

export interface LoDeclaradoV2 extends LoDeclarado {
  /** Las respuestas de la versión que rige, con sus valores V2; `null` si no respondió o si ninguna versión rige. */
  readonly queRige: readonly RespuestaDeCampoV2[] | null;
  /** La transcripción, si lo cargó un profesional y la persona lo confirmó; `null` si respondió sola. */
  readonly transcripcion: Transcripcion | null;
  /** Los campos que la persona corrigió antes de confirmar lo cargado (vacío si confirmó tal cual, o si respondió sola). */
  readonly corregidasAntesDeConfirmar: ReadonlySet<string>;
}

export function loDeclaradoV2(
  solicitud: Pick<SolicitudDeFormulario, 'requestedFieldCodes' | 'requiredFieldCodes'>,
  respuesta: RespuestaDeFormularioV2 | null,
  formulario: { readonly sections: readonly SeccionDePlantillaV2[] } | null,
): LoDeclaradoV2 {
  const campos = new Map(camposEnOrden(formulario?.sections ?? []).map((c) => [c.fieldCode, c] as const));
  // En la forma V1, cada valor ya es su texto: `loDeclarado` lo muestra tal cual y compara versiones por ese texto.
  const enTexto = (answers: readonly RespuestaDeCampoV2[]): RespuestaDeFormulario['original']['answers'] =>
    answers.map((a) => ({ fieldCode: a.fieldCode, value: resumenDeValor(campos.get(a.fieldCode), a.answer), unit: null, profileSourceRef: null, provenance: a.provenance }));
  const formularioEnTexto: Pick<VersionDePlantilla, 'sections'> | null = formulario
    ? { sections: formulario.sections.map((s) => ({ sectionCode: s.sectionCode, title: s.title, fields: s.fields.map((c) => ({ fieldCode: c.fieldCode, label: c.label, dataType: 'TEXT' as const, unit: null, category: c.category, helpText: c.helpText })) })) }
    : null;
  const respuestaEnTexto: RespuestaDeFormulario | null = respuesta
    ? {
        formResponseId: respuesta.formResponseId,
        formRequestId: respuesta.formRequestId,
        adviseeId: respuesta.adviseeId,
        templateVersionId: respuesta.templateVersionId,
        original: { answers: enTexto(respuesta.original.answers) },
        rectifications: respuesta.rectifications.map((r) => ({ ...r, answers: enTexto(r.answers) })),
        effectiveView: respuesta.effectiveView,
        version: respuesta.version,
        submittedAt: respuesta.submittedAt,
      }
    : null;
  const base = loDeclarado(solicitud, respuestaEnTexto, formularioEnTexto);
  const rige = base.historia.find((v) => v.rige);
  const queRige = !respuesta || !rige ? null : rige.tipo === 'ORIGINAL' ? respuesta.original.answers : (respuesta.rectifications.find((r) => r.rectificationId === rige.id)?.answers ?? null);
  return {
    ...base,
    queRige,
    transcripcion: respuesta?.transcription ?? null,
    corregidasAntesDeConfirmar: new Set(respuesta?.transcription?.correctedFieldCodes ?? []),
  };
}
