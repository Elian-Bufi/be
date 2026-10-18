'use client';

/**
 * «Cómo se lee esta vista»: una sola ayuda por vista, siempre en el mismo lugar del marco (WP-ESCRITORIO-AMABLE, C-04).
 * Es el botón y su diálogo; el contenido lo escribe cada vista. La usan la ficha del asesorado (`como-se-lee.tsx`) y,
 * desde WP-ESCRITORIO-AREAS, las secciones de las pestañas de área, con las mismas clases.
 * - Se abre a pedido, toma el foco, Escape lo cierra y el foco vuelve al botón.
 * - Se abre por el principio: el foco va al título. Si fuera al primer control (el botón «Cerrar», al final), una ayuda
 *   más alta que la ventana se abriría mostrando su último renglón.
 */
import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono } from './icono';

/** Una explicación con su muestra al costado: lo que se ve en la pantalla, al lado de lo que significa. */
export function RenglonDeAyuda({ muestra, children }: { muestra: ReactNode; children: ReactNode }) {
  return (
    <li>
      <span className="como-se-lee__muestra" aria-hidden="true">
        {muestra}
      </span>
      <p>{children}</p>
    </li>
  );
}

/**
 * La Guía del espacio profesional (DL-145; Dirección, 2026-10-18): las ayudas ya no están en cada pantalla, que tiene
 * que entenderse sola. Lo que explicaban, y lo que el legajo exige poder leer (DL-113), queda junto en `/pro/guia`.
 * Adentro de `GuiaDeAyudas`, cada ayuda es una sección con su título, sin botón ni diálogo.
 */
const EnLaGuia = createContext(false);

export function GuiaDeAyudas({ children }: { children: ReactNode }) {
  return <EnLaGuia.Provider value={true}>{children}</EnLaGuia.Provider>;
}

export function AyudaDeVista({
  titulo,
  deQue,
  children,
}: {
  titulo: string;
  /** La vista de la que es la ayuda: si cambia con el diálogo abierto (Atrás del navegador), se cierra. */
  deQue: string;
  children: ReactNode;
}) {
  const enLaGuia = useContext(EnLaGuia);
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const abrir = () => {
    dialogo.current?.showModal();
    encabezado.current?.focus();
    if (dialogo.current) dialogo.current.scrollTop = 0;
  };
  useEffect(() => {
    if (dialogo.current?.open) dialogo.current.close();
  }, [deQue]);
  if (enLaGuia) {
    return (
      <section className="guia__seccion como-se-lee" aria-labelledby={`${id}-titulo`}>
        <h3 id={`${id}-titulo`}>{titulo}</h3>
        {children}
      </section>
    );
  }
  return (
    <>
      <button type="button" className="boton boton--enlace como-se-lee__boton" aria-haspopup="dialog" onClick={abrir}>
        <Icono nombre="ayuda" tamano={18} />
        <span className="como-se-lee__palabras">Cómo se lee esta vista</span>
      </button>
      <dialog ref={dialogo} className="dialogo como-se-lee" aria-labelledby={`${id}-titulo`}>
        <h2 id={`${id}-titulo`} ref={encabezado} tabIndex={-1}>
          {titulo}
        </h2>
        {children}
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => dialogo.current?.close()}>
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
