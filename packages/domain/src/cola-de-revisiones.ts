/**
 * API-DSH-02 — La cola de revisiones (09 v0.11 §14; B10-08 §6; DL-163 D-6; WP-TABLERO-ALTA-GAMA TB-13 y TB-14).
 *
 * Separa «tengo trabajo pendiente» de «la persona está mal» (B10-08 §6.1). La cola **no crea una regla nueva de
 * pendiente** (09 §14): la revisión pendiente es la de `revisionPendiente` (REG-06-150), la misma que usan los
 * servicios de revisión. Lo que se suma son dos estados del trabajo del profesional, con los textos que D-6 ratificó:
 * - «Próxima acción pendiente» (`NEXT_ACTION_PENDING`), primera: la última revisión registrada del seguimiento abierto
 *   todavía no se aplicó (UC-I06). Es lo mismo que el website lee como `lastReview.application` en `null` (API-DSH-03).
 * - «Sin revisión acordada» (`ACTIVE_PLAN_WITHOUT_REVIEW`), última: hay un plan activo y ninguna revisión acordada que
 *   siga en pie, porque nunca se acordó una o porque una revisión aplicada después resolvió la que había (REG-06-150).
 *   Es el caso que más se escapa: hoy, un plan activado sin próxima revisión sale de toda cola (D-6).
 *
 * Abrir la cola no resuelve nada (B10-08 §6.3): es una lectura. Una revisión acordada a futuro no es un pendiente: es
 * «Revisión programada», y no entra. Antropometría no abre seguimiento (06 §8.9), así que no tiene cola.
 *
 * Y lo que la cartera (API-CAR-01) toma de acá, sin cambiar su forma (TB-13): una revisión que una aplicación posterior
 * resolvió no sigue como vencida, y un seguimiento que se cerró con «Finalizar» no vuelve como «Sin plan activo».
 */
import { clasificarRevision, type RevisionClasificada } from './cartera';
import { revisionPendiente } from './revision';

export const MOTIVOS_DE_LA_COLA = ['NEXT_ACTION_PENDING', 'REVIEW_DUE', 'ACTIVE_PLAN_WITHOUT_REVIEW'] as const;
export type MotivoDeLaCola = (typeof MOTIVOS_DE_LA_COLA)[number];

/** El orden de la cola: primero lo que solo falta aplicar, al final lo que nadie acordó (D-6). */
export const ORDEN_DEL_MOTIVO: Readonly<Record<MotivoDeLaCola, number>> = {
  NEXT_ACTION_PENDING: 1,
  REVIEW_DUE: 2,
  ACTIVE_PLAN_WITHOUT_REVIEW: 3,
};

/**
 * Los textos de cada motivo. «Próxima acción pendiente» y «Revisión pendiente» son de la lista permitida de B10-08
 * (§6.3); «Sin revisión acordada» es el de D-6. Ninguno dice nada de la persona.
 */
export const TEXTO_DEL_MOTIVO: Readonly<Record<MotivoDeLaCola, string>> = {
  NEXT_ACTION_PENDING: 'Próxima acción pendiente',
  REVIEW_DUE: 'Revisión pendiente',
  ACTIVE_PLAN_WITHOUT_REVIEW: 'Sin revisión acordada',
};

/** Los hechos de un seguimiento, en fechas civiles de la zona de BE. */
export interface HechosDeLaCola {
  readonly procesoAbierto: boolean;
  /** Cuándo se activó la versión efectiva del plan, o `null` si no hay ninguna activada. */
  readonly planActivadoEn: string | null;
  /** La última revisión registrada del seguimiento, con su aplicación si la tuvo. */
  readonly ultimaRevision: { readonly registradaEn: string; readonly aplicadaEn: string | null } | null;
  /** La expectativa vigente (la terminal de la cadena, REG-06-146); `undefined` si nunca se acordó una. */
  readonly expectativa: { readonly fechaObjetivo: string | null; readonly registradaEn: string } | undefined;
  /** La aplicación más reciente de una revisión registrada después de la expectativa, o `null`. */
  readonly aplicacionPosterior: { readonly aplicadaEn: string } | null;
  readonly hoy: string;
}

export type MotivoCalculado = { readonly motivo: MotivoDeLaCola; readonly desde: string } | null;

/**
 * El motivo por el que un seguimiento está en la cola, o `null`. Uno por seguimiento: si la última revisión espera su
 * aplicación, ese es el trabajo que queda, aunque la revisión acordada siga pendiente hasta aplicarla (TA-57).
 */
export function motivoDeLaCola(h: HechosDeLaCola): MotivoCalculado {
  if (!h.procesoAbierto) return null;
  if (h.ultimaRevision && h.ultimaRevision.aplicadaEn === null) return { motivo: 'NEXT_ACTION_PENDING', desde: h.ultimaRevision.registradaEn };
  const pendiente = revisionPendiente({ procesoAbierto: true, expectativa: h.expectativa, revisionAplicadaPosterior: h.aplicacionPosterior !== null, ahora: h.hoy });
  if (pendiente.pendiente) return { motivo: 'REVIEW_DUE', desde: pendiente.desde };
  if (h.planActivadoEn === null) return null;
  if (h.expectativa === undefined) return { motivo: 'ACTIVE_PLAN_WITHOUT_REVIEW', desde: h.planActivadoEn };
  if (h.aplicacionPosterior) {
    const desde = h.aplicacionPosterior.aplicadaEn > h.planActivadoEn ? h.aplicacionPosterior.aplicadaEn : h.planActivadoEn;
    return { motivo: 'ACTIVE_PLAN_WITHOUT_REVIEW', desde };
  }
  // Una revisión acordada a futuro: «Revisión programada», que no es un pendiente.
  return null;
}

/** Lo mínimo que el orden de la cola necesita de una fila. */
export interface FilaOrdenableDeLaCola {
  readonly motivo: MotivoDeLaCola;
  readonly desde: string;
  readonly adviseeId: string;
  readonly domain: string;
}

/** Por motivo; dentro de un motivo, lo más antiguo primero; y un desempate estable por persona y área. */
export function compararFilasDeLaCola(a: FilaOrdenableDeLaCola, b: FilaOrdenableDeLaCola): number {
  const porMotivo = ORDEN_DEL_MOTIVO[a.motivo] - ORDEN_DEL_MOTIVO[b.motivo];
  if (porMotivo !== 0) return porMotivo;
  if (a.desde !== b.desde) return a.desde < b.desde ? -1 : 1;
  if (a.adviseeId !== b.adviseeId) return a.adviseeId < b.adviseeId ? -1 : 1;
  return a.domain < b.domain ? -1 : a.domain > b.domain ? 1 : 0;
}

/**
 * TB-13 · La revisión de la cartera, con la definición del dominio: si una revisión aplicada después de la
 * expectativa la resolvió (REG-06-150), no hay revisión vencida, próxima ni sin fecha. Si no, la clasificación de
 * siempre (`clasificarRevision`). `fechaObjetivo` en `undefined`: no hay expectativa.
 */
export function revisionEnLaCartera(fechaObjetivo: string | null | undefined, resueltaPorUnaRevisionAplicada: boolean, hoy: string): RevisionClasificada {
  if (fechaObjetivo === undefined || resueltaPorUnaRevisionAplicada) return { kind: null, dias: null };
  return clasificarRevision(fechaObjetivo, hoy);
}

/**
 * TB-13 · «Sin plan activo» en la cartera: sin seguimiento abierto y sin borrador, salvo que el último seguimiento se
 * haya cerrado con una revisión «Finalizar». Ese cierre es una decisión del profesional, no algo que falta hacer: si
 * volviera como «Empezar el plan», el renglón quedaría para siempre (TA-56).
 */
export function sinPlanActivoEnLaCartera(h: { readonly procesoAbierto: boolean; readonly borrador: boolean; readonly cerradoConFinalizar: boolean }): boolean {
  return !h.procesoAbierto && !h.borrador && !h.cerradoConFinalizar;
}
