/**
 * RP-01 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Revalidar al recuperar el foco, sin React. La cabecera de un área ya no
 * tiene «Actualizar» ni «Consultado a las»: al volver a la pestaña del navegador, el marco vuelve a leer en silencio el
 * acceso y el resumen del área (API-DSH-03), y si algo cambió lo dice con un aviso chico, «Hay datos nuevos · Ver».
 *
 * La huella es lo que se compara entre una lectura y la siguiente. Lleva:
 * - **el acceso de cada vínculo del área**, como se muestra («Activo · con acceso», «Pausado»), y si el resumen deja leer
 *   el área;
 * - **lo que llega de otros**: los registros de la persona (cuántos en el período y el último) y lo que escribió otro
 *   profesional (un objetivo, una revisión o una toma con otro autor).
 * No lleva lo que escribe quien mira (su borrador, la versión que activó, su objetivo, su revisión, su toma): eso ya lo ve
 * en la pantalla, y avisarle «datos nuevos» por lo suyo confundiría. Nunca guarda nombres: solo estados e identificadores.
 */
import type { DashboardResponse } from '@be/domain';

/** Cada cuánto, como mínimo, se vuelve a leer al volver a la pestaña: alcanza para no leer en cada cambio de ventana. */
export const VOLVER_A_LEER_AL_VOLVER_MS = 15_000;

type Dominios = DashboardResponse['data']['domains'];
type ClaveDelDominio = keyof Dominios;

/** El alcance de un área y su clave en el resumen. Información (`null`) mira las tres. */
const CLAVES: Readonly<Record<string, ClaveDelDominio>> = { NUTRICION: 'nutrition', ENTRENAMIENTO: 'training', ANTROPOMETRIA: 'anthropometry' };

/** Un identificador, solo si lo escribió otro: lo propio no es «nuevo» para quien lo escribió. */
const deOtro = (x: { readonly identityId: string } | null | undefined, id: string, yoId: string): string => (x && x.identityId !== yoId ? id : '');

function huellaDelDominio(clave: ClaveDelDominio, d: Dominios, yoId: string): string {
  const e = d[clave];
  if (!e.available) return `${clave}:no`;
  const s = e.summary;
  if (!s) return `${clave}:si:vacio`;
  if (clave === 'nutrition') {
    const n = s as NonNullable<Extract<Dominios['nutrition'], { available: true }>['summary']>;
    return [clave, n.registeredIntakes, n.lastIntakeAt ?? '', deOtro(n.objective?.authoredBy, n.objective?.objectiveVersionId ?? '', yoId), deOtro(n.lastReview?.author, n.lastReview?.reviewId ?? '', yoId)].join(':');
  }
  if (clave === 'training') {
    const t = s as NonNullable<Extract<Dominios['training'], { available: true }>['summary']>;
    return [clave, t.registeredExecutions, t.lastExecutionAt ?? '', deOtro(t.objective?.authoredBy, t.objective?.objectiveVersionId ?? '', yoId), deOtro(t.lastReview?.author, t.lastReview?.reviewId ?? '', yoId)].join(':');
  }
  const a = s as NonNullable<Extract<Dominios['anthropometry'], { available: true }>['summary']>;
  return [clave, deOtro(a.lastEvaluation?.author, a.lastEvaluation?.evaluationId ?? '', yoId)].join(':');
}

/**
 * La huella de lo que muestra un área. `estados`: el estado de cada vínculo del área, como se muestra, en cualquier orden.
 * `dominios`: lo que trajo el resumen; `null` si no se pudo leer (una falla de red no es un cambio): entonces no hay
 * huella, y no se compara.
 */
export function huellaDelArea(alcance: string | null, estados: readonly string[], dominios: Dominios | null, yoId: string): string | null {
  if (!dominios) return null;
  const claves: readonly ClaveDelDominio[] = alcance && CLAVES[alcance] ? [CLAVES[alcance]!] : ['nutrition', 'training', 'anthropometry'];
  return [[...estados].sort().join('|'), ...claves.map((c) => huellaDelDominio(c, dominios, yoId))].join('#');
}

/** Si hay algo nuevo: dos huellas que se pudieron leer y no coinciden. Sin la primera todavía, nada. */
export const hayDatosNuevos = (antes: string | null, ahora: string | null): boolean => antes !== null && ahora !== null && antes !== ahora;

export const COPY_DATOS_NUEVOS = {
  hay: 'Hay datos nuevos',
  ver: 'Ver',
  verDetalle: 'Ver los datos nuevos: la sección se vuelve a leer y quedás en la misma pestaña',
} as const;
