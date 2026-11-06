/**
 * DL-165 D-1 · el formulario, una parte por pantalla (WP-FORMULARIOS-RONDA-2, FR-03 y FR-04). Lo comparten la APK y
 * «Cargar con la persona» del website, para que las dos cuenten y avisen igual:
 * - **una parte es una sección de la plantilla con alguna pregunta pedida**, en el orden del formulario. El total no
 *   cambia mientras se responde: si una condición ocultó todas las preguntas de una parte, la parte sigue y lo dice;
 * - **pasar de parte no exige nada.** Si quedó una obligatoria sin responder, la parte siguiente lo avisa y deja volver;
 *   lo que frena es el envío, como siempre (`validarRespuestasV2`);
 * - **el repaso es un paso más**, después de la última parte: lo respondido por parte, lo que falta y el envío;
 * - un problema al enviar lleva a la parte donde está la primera pregunta con problema.
 */
import type { RespuestaDeCampoV2Entrada, SeccionDePlantillaV2 } from './contratos-formularios-v2';
import { obligatoriosSinResponder, type SolicitudAValidar } from './formularios-v2';

export interface ParteDelFormulario {
  /** La posición de la parte, desde 0. «Parte 1 de 6» es la de índice 0. */
  readonly indice: number;
  readonly sectionCode: string;
  readonly titulo: string;
  readonly intro: string | null;
  /** Las preguntas pedidas de la parte, en el orden del formulario, se vean o no con lo respondido. */
  readonly pedidas: readonly string[];
}

/** Las partes de una solicitud: las secciones con alguna pregunta pedida. */
export function partesDelFormulario(secciones: readonly SeccionDePlantillaV2[], solicitud: Pick<SolicitudAValidar, 'requestedFieldCodes'>): ParteDelFormulario[] {
  const pedidas = new Set(solicitud.requestedFieldCodes);
  return secciones
    .map((s) => ({ s, codigos: s.fields.map((c) => c.fieldCode).filter((c) => pedidas.has(c)) }))
    .filter((x) => x.codigos.length > 0)
    .map((x, indice) => ({ indice, sectionCode: x.s.sectionCode, titulo: x.s.title, intro: x.s.intro, pedidas: x.codigos }));
}

/** El paso del repaso: uno después de la última parte. */
export const pasoDelRepaso = (partes: readonly ParteDelFormulario[]): number => partes.length;

/** Un paso válido: entre la primera parte y el repaso. */
export const pasoAcotado = (partes: readonly ParteDelFormulario[], paso: number): number => Math.min(Math.max(0, Math.trunc(paso)), pasoDelRepaso(partes));

/** Las preguntas de la parte que se ven con lo respondido (las que se dibujan). */
export function preguntasQueSeVen(parte: ParteDelFormulario, visibles: ReadonlySet<string>): string[] {
  return parte.pedidas.filter((c) => visibles.has(c));
}

/** Las obligatorias pedidas de la parte que se ven y todavía no tienen respuesta. */
export function obligatoriasSinResponderDeLaParte(
  parte: ParteDelFormulario,
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: SolicitudAValidar,
  respuestas: readonly RespuestaDeCampoV2Entrada[],
): string[] {
  const deLaParte = new Set(parte.pedidas);
  return obligatoriosSinResponder(secciones, solicitud, respuestas).filter((c) => deLaParte.has(c));
}

/** La parte que tiene esta pregunta, o `null` si no es de ninguna (no se pidió o no está en la versión). */
export function parteDeLaPregunta(partes: readonly ParteDelFormulario[], fieldCode: string): number | null {
  return partes.find((p) => p.pedidas.includes(fieldCode))?.indice ?? null;
}

/** La primera parte, en el orden del formulario, con alguna de estas preguntas: adonde lleva un problema al enviar. */
export function primeraParteCon(partes: readonly ParteDelFormulario[], fieldCodes: Iterable<string>): number | null {
  const indices = [...fieldCodes].map((c) => parteDeLaPregunta(partes, c)).filter((i): i is number => i !== null);
  return indices.length > 0 ? Math.min(...indices) : null;
}
