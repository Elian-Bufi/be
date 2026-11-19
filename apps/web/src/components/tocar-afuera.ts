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
 */
import { useRef, type MouseEvent, type PointerEvent } from 'react';

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
