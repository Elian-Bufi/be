/**
 * «Lo que contó al empezar» (WP-TABLERO-ALTA-GAMA TB-49; DL-165 D-8), sin React, probado en
 * `apps/web/test/lo-que-conto.test.mjs` (TEST-TAG-033). La tarjeta del Resumen muestra las respuestas vigentes de los
 * formularios de inicio **que pidió este profesional**, en palabras, con su fecha y su procedencia, y abre la solicitud.
 *
 * - **Solo lo que pidió él:** las solicitudes salen de API-FRM-04, que lista las de quien consulta. «Tus hábitos»
 *   (FRM-HABITOS) entra solo si él la pidió; lo que la persona le compartió de sus hábitos sin que lo pida (HBT-05) está
 *   en la pestaña Información, en su tarjeta, y no se mezcla acá (TA-23).
 * - **La respuesta que rige**, la que elige el dominio (`loDeclaradoV2`, por la relación que da la API): una respuesta
 *   sin resolver no se muestra acá; se ve en la solicitud.
 * - **Declarado por la persona**, o cargado por un profesional y confirmado por ella: lo dice la procedencia.
 * - **Ubica, no califica:** sin cuentas de respuestas, sin puntajes y sin nada que escriba. Sin solicitudes respondidas
 *   no hay tarjeta.
 *
 * Recibe lo ya leído y ya resuelto por `loDeclaradoV2`: así no depende de otro módulo del website y se prueba sola.
 */
import type { LoDeclarado, SolicitudDeFormulario, Transcripcion } from '@be/domain';

/** Cuántas respuestas se ven por solicitud: las demás, en la solicitud. */
export const RESPUESTAS_A_LA_VISTA = 4;

/** Cuántas solicitudes respondidas se leen y se muestran con sus respuestas al abrir el Resumen (TA-23). */
export const SOLICITUDES_CON_RESPUESTAS = 2;

export interface RespuestaQueConto {
  readonly pregunta: string;
  readonly valor: string;
}

export interface SolicitudQueConto {
  readonly solicitudId: string;
  /** El nombre del formulario, como lo pidió el profesional («Tus hábitos»). */
  readonly titulo: string;
  /** El día en que respondió, y el de su última corrección si la hubo (instantes de la API). */
  readonly respondioEl: string | null;
  readonly corrigioEl: string | null;
  /** Si lo cargó un profesional y la persona lo confirmó; `null` si respondió sola. */
  readonly transcripcion: Transcripcion | null;
  /** Las primeras respuestas que rigen, en el orden del formulario, con la pregunta en palabras. */
  readonly respuestas: readonly RespuestaQueConto[];
  /** Si hay más respuestas que las que se ven: la solicitud las tiene todas. */
  readonly hayMas: boolean;
}

/** Lo que muestra la tarjeta de una solicitud respondida, o `null` si no hay una respuesta que rija para mostrar. */
export function solicitudQueConto(
  solicitud: Pick<SolicitudDeFormulario, 'formRequestId' | 'templateName' | 'status'>,
  declarado: (Pick<LoDeclarado, 'estado' | 'filas' | 'respondioEl' | 'corrigioEl'> & { readonly transcripcion: Transcripcion | null }) | null,
  tope = RESPUESTAS_A_LA_VISTA,
): SolicitudQueConto | null {
  if (solicitud.status !== 'RESPONDED' || !declarado || declarado.estado !== 'RESPONDIDA') return null;
  // La pantalla nunca muestra el código de una pregunta: sin su texto, la respuesta queda para la solicitud.
  const respondidas = declarado.filas.flatMap((f) => (f.valor !== null && f.pregunta !== null ? [{ pregunta: f.pregunta, valor: f.valor }] : []));
  if (respondidas.length === 0) return null;
  return {
    solicitudId: solicitud.formRequestId,
    titulo: solicitud.templateName,
    respondioEl: declarado.respondioEl,
    corrigioEl: declarado.corrigioEl,
    transcripcion: declarado.transcripcion,
    respuestas: respondidas.slice(0, tope),
    hayMas: respondidas.length > tope,
  };
}

/**
 * Las solicitudes respondidas que se leen con sus respuestas: las más nuevas primero (la API las lista así), hasta
 * `SOLICITUDES_CON_RESPUESTAS`. Las demás se nombran con un enlace a la pestaña Información.
 */
export function respondidasParaLeer<S extends Pick<SolicitudDeFormulario, 'status' | 'createdAt'>>(solicitudes: readonly S[], tope = SOLICITUDES_CON_RESPUESTAS): { readonly leer: readonly S[]; readonly otras: number } {
  const respondidas = [...solicitudes].filter((s) => s.status === 'RESPONDED').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { leer: respondidas.slice(0, tope), otras: Math.max(0, respondidas.length - tope) };
}
