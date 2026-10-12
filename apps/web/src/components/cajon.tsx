'use client';

/**
 * Un cajón: un formulario que se abre al costado, encima de la vista, que sigue a la vista por detrás (el velo la
 * atenúa, no la tapa). Es un `<dialog>` nativo en modo modal: retiene el foco y, al cerrarse, el navegador se lo
 * devuelve a lo que lo abrió. Lo usa «Pedir información» (WP-ESCRITORIO-AREAS, parte 4).
 * - **Tres zonas.** La cabecera (de quién es, el título y «Cerrar») y el pie quedan fijos; el cuerpo se desplaza adentro.
 *   Lo que hay que leer antes de un acto que no se deshace va en el pie, junto al botón, y está siempre a la vista.
 * - **Al abrirse, el foco va al título:** con el teclado, lo primero que se puede accionar no es «Cerrar» por accidente.
 * - **Escape y «Cerrar» lo cierran, salvo mientras está `ocupado`:** un envío en curso no se corta, porque su resultado
 *   tiene que poder leerse. Si el navegador lo cierra igual (un segundo Escape seguido no se puede frenar), avisa con
 *   `onCerrar` para que quien lo abrió no quede creyéndolo abierto.
 * - Hasta 64 rem de ventana ocupa todo el ancho.
 * Lo que tiene adentro lo decide quien lo abre: el cajón es solo el marco, y dibuja su contenido solo mientras está
 * abierto. Si ese contenido tiene que sobrevivir al cierre (un pedido a medio armar), su estado va en quien lo abre.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono } from './icono';

export function Cajon({
  abierto,
  titulo,
  sobretitulo = null,
  ocupado = false,
  onCerrar,
  pie = null,
  children,
}: {
  abierto: boolean;
  titulo: string;
  /** De quién es lo que se va a hacer («Asesorado · d21da6»): el cajón tapa el marco de la página, que lo decía. */
  sobretitulo?: string | null;
  /** Hay un envío en curso: no se cierra hasta que termine. */
  ocupado?: boolean;
  onCerrar: () => void;
  /** Lo que queda fijo abajo: la acción y lo que hay que saber antes de hacerla. */
  pie?: ReactNode;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const id = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      tituloRef.current?.focus({ preventScroll: true });
    }
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      className="dialogo cajon"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) onCerrar();
      }}
      onClose={() => {
        if (abierto) onCerrar();
      }}
    >
      <div className="cajon__cabecera">
        <div>
          {sobretitulo ? <p className="cajon__sobretitulo">{sobretitulo}</p> : null}
          <h2 id={`${id}-titulo`} ref={tituloRef} tabIndex={-1}>
            {titulo}
          </h2>
        </div>
        <button type="button" className="boton boton--enlace cajon__cerrar" onClick={onCerrar} disabled={ocupado}>
          <Icono nombre="cerrar" tamano={18} />
          Cerrar
        </button>
      </div>
      {/* Cerrado, no tiene nada adentro: lo que su contenido muestre mientras espera («Cargando…») no queda en la página. */}
      <div className="cajon__cuerpo">{abierto ? children : null}</div>
      {abierto && pie ? <div className="cajon__pie">{pie}</div> : null}
    </dialog>
  );
}
