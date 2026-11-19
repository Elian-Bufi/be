/**
 * NUP-11 (WP-NUTRICION-PLANIFICACION; NUP-D10) · Tocar afuera de un cuadro lo cierra, como Escape.
 *
 * Un `<dialog>` modal ocupa toda la pantalla con su fondo (`::backdrop`): un toque en el fondo llega al propio `<dialog>`,
 * con las coordenadas fuera de su caja. Un toque en el relleno del cuadro también llega al `<dialog>`, pero adentro de la
 * caja: ese no cierra.
 * - **El toque tiene que empezar y terminar afuera.** Si empieza adentro (al seleccionar un texto y soltar afuera), no
 *   cierra: perder lo escrito por arrastrar el mouse sería peor que tener que tocar «Cerrar».
 * - **Lo que pasa al cerrar lo decide el cuadro**, con la misma salida que Escape: si hay algo sin guardar, pregunta.
 * - Un «clic» del teclado (Enter o Espacio sobre un botón) llega al botón, nunca al `<dialog>`: no cierra nada.
 * - **«Seguir editando» devuelve el foco adonde se estaba** (`useSeguirEditando`): la pregunta se va con el botón que lo
 *   tenía, y el foco no queda en el documento.
 */
import { useLayoutEffect, useRef, type FocusEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react';

export interface Caja {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** ¿El punto queda fuera de la caja del cuadro? */
export const fueraDeLaCaja = (caja: Caja, x: number, y: number): boolean => x < caja.left || x > caja.right || y < caja.top || y > caja.bottom;

/** ¿El toque fue en el fondo? Llegó al `<dialog>` mismo (no a algo de adentro) y fuera de su caja. */
export const esElFondo = (objetivo: unknown, cuadro: unknown, caja: Caja, x: number, y: number): boolean => objetivo === cuadro && fueraDeLaCaja(caja, x, y);

/**
 * Las propiedades que van en el `<dialog>`: `alTocarAfuera` corre cuando un toque empieza y termina en el fondo. Con
 * `activo` en falso (un envío en curso), no hace nada.
 */
export function useTocarAfuera(alTocarAfuera: () => void, activo = true) {
  const empezoAfuera = useRef(false);
  const enElFondo = (e: PointerEvent<HTMLDialogElement> | MouseEvent<HTMLDialogElement>) => esElFondo(e.target, e.currentTarget, e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY);
  return {
    onPointerDown: (e: PointerEvent<HTMLDialogElement>) => {
      empezoAfuera.current = enElFondo(e);
    },
    onClick: (e: MouseEvent<HTMLDialogElement>) => {
      const afuera = empezoAfuera.current && enElFondo(e);
      empezoAfuera.current = false;
      if (afuera && activo) alTocarAfuera();
    },
  };
}

// ─── «Seguir editando» ───────────────────────────────────────────────────────────────────────────────────────────

/** Lo que no cuenta como «donde se estaba»: la pregunta de cerrar y los botones que piden cerrar. */
export const NO_ES_DONDE_SE_ESTABA = '[data-pregunta-al-cerrar], [data-pide-cerrar]';

/**
 * «Seguir editando» (NUP-11): adónde vuelve el foco cuando la pregunta de cerrar se va (y con ella el botón que lo tenía).
 * Al último lugar enfocado adentro del cuadro, si sigue ahí; si no, a `siNo` (el título del cuadro o su primer control).
 * Nunca queda en el documento, fuera del cuadro.
 */
export function dondeSigueElFoco<E>(cuadro: { contains(e: E): boolean } | null, ultimo: (E & { readonly isConnected: boolean }) | null, siNo: E | null): E | null {
  return cuadro && ultimo && ultimo.isConnected && cuadro.contains(ultimo) ? ultimo : siNo;
}

/**
 * La pieza común del cuadro enfocado y del diálogo de confirmación: anota dónde se estaba (en el `onFocus` del
 * `<dialog>`) y, al tocar «Seguir editando», devuelve el foco ahí apenas la pregunta se va (`dondeSigueElFoco`).
 */
export function useSeguirEditando(cuadro: RefObject<HTMLElement | null>, siNo: () => HTMLElement | null, preguntando: boolean) {
  const ultimo = useRef<HTMLElement | null>(null);
  const volver = useRef(false);
  useLayoutEffect(() => {
    if (preguntando || !volver.current) return;
    volver.current = false;
    dondeSigueElFoco<HTMLElement>(cuadro.current, ultimo.current, siNo())?.focus();
    // La referencia y `siNo` se leen al volver: no hace falta correr el efecto cuando cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preguntando]);
  return {
    alEnfocar: (e: FocusEvent<HTMLElement>) => {
      const t = e.target;
      if (t !== e.currentTarget && t instanceof HTMLElement && !t.closest(NO_ES_DONDE_SE_ESTABA)) ultimo.current = t;
    },
    /** «Seguir editando»: `cerrarLaPregunta` saca la pregunta y el foco vuelve adonde se estaba. */
    seguir: (cerrarLaPregunta: () => void) => {
      volver.current = true;
      cerrarLaPregunta();
    },
  };
}
