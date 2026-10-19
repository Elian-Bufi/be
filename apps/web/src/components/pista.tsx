'use client';

/**
 * La pista: el texto corto que aparece al pasar el mouse por un título o una acción, o al llegarle con el teclado
 * (DL-146; Dirección, 2026-10-19: «ese pequeño texto que sale sobre la pantalla cuando el mouse pasa por arriba de algún
 * título o acción»).
 * - **Completa; no reemplaza.** Dice qué hace una acción o qué quiere decir un término en una frase. Lo imprescindible
 *   para decidir va a la vista (GUIA-UX-UI I.2), y lo largo, a la ayuda de la vista o a la Guía.
 * - **Cómo aparece.** Al pasar el mouse, con una pausa corta para no encenderse al cruzar la pantalla; al llegar con el
 *   teclado, enseguida. Se puede pasar el mouse por encima sin que se cierre, Escape la cierra, y se queda mientras el
 *   mouse o el foco sigan ahí (WCAG 2.2, 1.4.13).
 * - **El lector de pantalla** la lee como descripción del control (`aria-describedby`), aunque no esté a la vista.
 * - **No sale de la ventana:** va arriba del control y, si no entra, abajo; si se pasa de un costado, se corre. Es fija
 *   a la ventana, así que un contenedor con desplazamiento no la corta; al desplazar la página, se cierra.
 */
import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';

const PAUSA_AL_ENTRAR_MS = 350;
const PAUSA_AL_SALIR_MS = 150;
const MARGEN = 8;
const SEPARACION = 6;

type PropsDelControl = { 'aria-describedby'?: string };

export function Pista({ texto, children }: { texto: ReactNode; children: ReactElement<PropsDelControl> }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [lugar, setLugar] = useState<{ top: number; left: number } | null>(null);
  const temporizador = useRef<number | null>(null);
  const control = useRef<HTMLSpanElement>(null);
  const globo = useRef<HTMLSpanElement>(null);

  const limpiar = () => {
    if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    temporizador.current = null;
  };
  const mostrar = (pausa: number) => {
    limpiar();
    if (pausa === 0) setVisible(true);
    else temporizador.current = window.setTimeout(() => setVisible(true), pausa);
  };
  const ocultar = (pausa: number) => {
    limpiar();
    const cerrar = () => {
      setVisible(false);
      setLugar(null);
    };
    if (pausa === 0) cerrar();
    else temporizador.current = window.setTimeout(cerrar, pausa);
  };

  useEffect(() => limpiar, []);

  // Escape la cierra; desplazar o cambiar el tamaño de la ventana, también (quedaría lejos de su control).
  useEffect(() => {
    if (!visible) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ocultar(0);
    };
    const alMoverse = () => ocultar(0);
    document.addEventListener('keydown', alTeclear);
    window.addEventListener('scroll', alMoverse, true);
    window.addEventListener('resize', alMoverse);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      window.removeEventListener('scroll', alMoverse, true);
      window.removeEventListener('resize', alMoverse);
    };
    // `ocultar` no cambia nada que este efecto lea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Se mide antes de pintarse: arriba y centrada; abajo si no entra; corrida si se pasa de un costado.
  useLayoutEffect(() => {
    if (!visible || lugar !== null || !control.current || !globo.current) return;
    const c = control.current.getBoundingClientRect();
    const g = globo.current.getBoundingClientRect();
    const izquierda = Math.min(Math.max(c.left + c.width / 2 - g.width / 2, MARGEN), Math.max(MARGEN, window.innerWidth - MARGEN - g.width));
    const arriba = c.top - g.height - SEPARACION;
    setLugar({ left: izquierda, top: arriba >= MARGEN ? arriba : c.bottom + SEPARACION });
  }, [visible, lugar]);

  const hijo = isValidElement(children) ? cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' ') }) : children;
  const estilo: CSSProperties = lugar ? { top: lugar.top, left: lugar.left } : { top: 0, left: 0, visibility: 'hidden' };

  return (
    <span
      className="pista"
      ref={control}
      onMouseEnter={() => (visible ? limpiar() : mostrar(PAUSA_AL_ENTRAR_MS))}
      onMouseLeave={() => ocultar(PAUSA_AL_SALIR_MS)}
      onFocus={(e) => {
        // Con el teclado, enseguida; un clic también enfoca, y ahí la pista sobra.
        if ((e.target as HTMLElement).matches?.(':focus-visible')) mostrar(0);
      }}
      onBlur={() => ocultar(0)}
    >
      {hijo}
      <span ref={globo} id={id} role="tooltip" className="pista__globo" hidden={!visible} style={estilo}>
        {texto}
      </span>
    </span>
  );
}
