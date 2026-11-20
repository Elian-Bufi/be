/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185) · la parte pura de los formularios vinculados a la evaluación inicial, sin React,
 * para probarla sin navegador (`apps/web/test/evaluacion-y-formularios.test.mjs`):
 * - qué se ofrece para vincular: los formularios que la persona respondió a mis Solicitudes **del área de la evaluación**
 *   (API-CTX-01 ya trae solo los propios, de las áreas permitidas), sin los que ya están vinculados, del más nuevo al más
 *   viejo (EVF-D03);
 * - qué se manda: cada elegido con la versión que se vio (`expectedVersion`, EVF-D02);
 * - el aviso que queda para la evaluación recién registrada si los vínculos no se pudieron guardar (EVF-D08). Vive en la
 *   memoria de la pestaña, nunca en el almacenamiento del navegador: no se guarda nada de la persona.
 */
import { ALCANCE_DE_LA_EVALUACION, MAXIMO_DE_FORMULARIOS_VINCULADOS, type AreaDeLaEvaluacion, type FormularioEnElContexto, type FormularioVinculado } from '@be/domain';

/** Los formularios que se pueden vincular a una evaluación del área, sin los ya vinculados, del más nuevo al más viejo. */
export function formulariosParaVincular(forms: readonly FormularioEnElContexto[], area: AreaDeLaEvaluacion, vinculados: readonly Pick<FormularioVinculado, 'formResponseId'>[] = []): FormularioEnElContexto[] {
  const alcance = ALCANCE_DE_LA_EVALUACION[area];
  const ya = new Set(vinculados.map((v) => v.formResponseId));
  return forms
    .filter((f) => f.scope === alcance && !ya.has(f.formResponseId))
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt) || b.formResponseId.localeCompare(a.formResponseId));
}

/** Marca o desmarca un formulario; no pasa del tope (el que sobra no se marca y se avisa). */
export function alternarElegido(elegidos: readonly string[], formResponseId: string, yaVinculados = 0): { readonly elegidos: readonly string[]; readonly tope: boolean } {
  if (elegidos.includes(formResponseId)) return { elegidos: elegidos.filter((x) => x !== formResponseId), tope: false };
  if (elegidos.length + yaVinculados >= MAXIMO_DE_FORMULARIOS_VINCULADOS) return { elegidos, tope: true };
  return { elegidos: [...elegidos, formResponseId], tope: false };
}

/** Lo que se manda a API-EVF-02: cada elegido que sigue en la lista, con la versión que se vio, en el orden de la lista. */
export function vinculosAEnviar(forms: readonly FormularioEnElContexto[], elegidos: readonly string[]): { formResponseId: string; expectedVersion: string }[] {
  const marcados = new Set(elegidos);
  return forms.filter((f) => marcados.has(f.formResponseId)).map((f) => ({ formResponseId: f.formResponseId, expectedVersion: f.version }));
}

/** Los vinculados que tienen una versión más nueva de la persona (EVF-D04): para ofrecer «Vincular la más nueva». */
export function conVersionMasNueva(links: readonly FormularioVinculado[]): FormularioVinculado[] {
  return links.filter((l) => l.laterVersion !== null);
}

// ─── El aviso para la evaluación recién registrada (EVF-D08) ─────────────────────────────────────

const avisosPendientes = new Map<string, string>();

/** Deja dicho, para la evaluación recién registrada, que sus vínculos no se guardaron. Solo en memoria. */
export function dejarAvisoDeVinculos(evaluationId: string, texto: string): void {
  avisosPendientes.set(evaluationId, texto);
}

/** Toma (una sola vez) el aviso que quedó para esa evaluación. */
export function tomarAvisoDeVinculos(evaluationId: string): string | null {
  const t = avisosPendientes.get(evaluationId) ?? null;
  avisosPendientes.delete(evaluationId);
  return t;
}
