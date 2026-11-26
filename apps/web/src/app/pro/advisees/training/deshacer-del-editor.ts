/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-20 y ET3-21) · «Deshacer» del editor de Entrenamiento, sin React, para
 * probarlo solo (`apps/web/test/editor-de-entrenamiento-tanda-3-a.test.mjs`).
 *
 * - Una **pila corta** de instantáneas de lo que se edita (la estructura, la planificación y la agenda): cada cambio apila
 *   cómo estaba antes; deshacer saca la última y la vuelve a poner. A lo sumo `MAXIMO_DE_LA_PILA` (ET3-D20).
 * - Lo que se escribe seguido en un campo es **un solo cambio**: si el anterior fue hace menos de `JUNTAR_MS`, no se apila
 *   otro (queda la instantánea de antes de empezar a escribir).
 * - Un **cambio grande** (quitar un ejercicio, una sesión o una fase, pasar los ejercicios a la intensidad del plan, aplicar
 *   una progresión) se apila siempre aparte y lleva su texto, que ofrece «Deshacer» unos segundos (ET3-D21).
 * - Ctrl+Z (Cmd+Z en Mac) deshace fuera de los campos de texto: adentro de uno, el navegador deshace lo escrito (ET3-D22).
 */

export const MAXIMO_DE_LA_PILA = 20;
export const JUNTAR_MS = 1000;
/** Lo que el aviso con «Deshacer» queda a la vista después de un cambio grande (ET3-D21). */
export const DESHACER_A_LA_VISTA_MS = 8000;

export interface Instantanea<T> {
  readonly estado: T;
  /** Cuándo se apiló (ms). */
  readonly momento: number;
  /** El texto del cambio grande («Quitaste «Sentadilla»»), o `null` en un cambio común. */
  readonly grande: string | null;
  /** Un cambio que no se junta con otros (ni se le juntan): mover un ejercicio. */
  readonly aparte?: boolean;
}

/**
 * La pila con lo de antes de un cambio. `antes` es el estado previo al cambio. Un cambio común muy seguido del anterior
 * (común también) no apila: se junta con él. `aparte` (mover un ejercicio, por ejemplo) se apila siempre solo, aunque sea
 * seguido: cada paso se deshace de a uno.
 */
export function apilar<T>(pila: readonly Instantanea<T>[], antes: T, ahora: number, grande: string | null = null, aparte = false, maximo = MAXIMO_DE_LA_PILA): Instantanea<T>[] {
  const ultima = pila[pila.length - 1];
  if (!grande && !aparte && ultima && !ultima.grande && !ultima.aparte && ahora - ultima.momento < JUNTAR_MS) {
    // Se junta: se conserva la instantánea de antes del primer cambio de la tanda, con el reloj al día.
    return [...pila.slice(0, -1), { ...ultima, momento: ahora }];
  }
  const nueva = [...pila, { estado: antes, momento: ahora, grande, ...(aparte ? { aparte } : {}) }];
  return nueva.length > maximo ? nueva.slice(nueva.length - maximo) : nueva;
}

/** Saca la última: lo que hay que volver a poner y la pila que queda. `null` si no hay nada para deshacer. */
export function desapilar<T>(pila: readonly Instantanea<T>[]): { readonly estado: T; readonly grande: string | null; readonly pila: Instantanea<T>[] } | null {
  const ultima = pila[pila.length - 1];
  if (!ultima) return null;
  return { estado: ultima.estado, grande: ultima.grande, pila: pila.slice(0, -1) };
}

/** Lo mínimo de un elemento del DOM para decidir si es un campo de texto. */
export interface ElementoQueRecibe {
  readonly tagName?: string;
  readonly isContentEditable?: boolean;
  readonly type?: string;
}

const NO_SON_DE_TEXTO = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file']);

/** Si el foco está en un campo donde Ctrl+Z es del navegador (deshace lo escrito). */
export function esCampoDeTexto(e: ElementoQueRecibe | null | undefined): boolean {
  if (!e) return false;
  if (e.isContentEditable) return true;
  const tag = (e.tagName ?? '').toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return tag === 'INPUT' && !NO_SON_DE_TEXTO.has((e.type ?? 'text').toLowerCase());
}

/** Si la tecla es «deshacer»: Ctrl+Z o Cmd+Z, sin Mayúsculas (Ctrl+Mayús+Z es rehacer) ni Alt. */
export const esDeshacer = (t: { readonly key: string; readonly ctrlKey: boolean; readonly metaKey: boolean; readonly shiftKey: boolean; readonly altKey: boolean }): boolean =>
  (t.ctrlKey || t.metaKey) && !t.shiftKey && !t.altKey && t.key.toLowerCase() === 'z';

/** Los textos de los cambios grandes y del aviso. */
export const COPY_DESHACER = {
  deshacer: 'Deshacer',
  quitasteElEjercicio: (nombre: string) => `Quitaste «${nombre}».`,
  quitasteLaSesion: (nombre: string) => `Quitaste la sesión «${nombre}».`,
  quitasteLaFase: (nombre: string) => `Quitaste la fase «${nombre}».`,
  quitasteLaSemana: (nombre: string) => `Quitaste «${nombre}».`,
  pasasteALaIntensidad: (cuantos: number) => (cuantos === 1 ? 'Pasaste 1 ejercicio a la intensidad del plan.' : `Pasaste ${cuantos} ejercicios a la intensidad del plan.`),
  aplicasteLaProgresion: (fase: string) => `Aplicaste la progresión en «${fase}».`,
  // DL-203: aplicar un preset de sesión o de fase es un cambio grande, con su «Deshacer».
  aplicasteElPreset: (nombre: string) => `Aplicaste el preset «${nombre}».`,
  deshecho: (grande: string | null) => (grande ? `Se deshizo: ${grande.charAt(0).toLowerCase()}${grande.slice(1)}` : 'Se deshizo el último cambio.'),
  nadaParaDeshacer: 'No hay cambios para deshacer.',
  ayudaDelAtajo: 'Ctrl+Z deshace el último cambio (fuera de un campo de texto).',
} as const;
