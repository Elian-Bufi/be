'use client';

/**
 * «Cómo se lee esta vista»: una sola ayuda por vista, siempre en el mismo lugar del marco (WP-ESCRITORIO-AMABLE, C-04).
 * Es el botón y su diálogo; el contenido lo escribe cada vista. La usan la ficha del asesorado (`como-se-lee.tsx`) y,
 * desde WP-ESCRITORIO-AREAS, las secciones de las pestañas de área, con las mismas clases.
 * - Se abre a pedido, toma el foco, Escape lo cierra y el foco vuelve al botón.
 * - Se abre por el principio: el foco va al título. Si fuera al primer control (el botón «Cerrar», al final), una ayuda
 *   más alta que la ventana se abriría mostrando su último renglón.
 *
 * **Dos medidas de la misma ayuda (DL-146; Dirección, 2026-10-19: «no sacaría la ficha de ayuda… dejar conceptos complejos
 * únicamente»).** En la pantalla, el diálogo trae solo lo que no se deduce mirando: los renglones marcados `esencial`
 * (qué quiere decir una marca, «registrar no es aplicar», «sin dato no es cero»). Lo demás, y los detalles que se leen con
 * tiempo, quedan en la Guía del espacio profesional (`/pro/guia`), a un clic desde el mismo diálogo. Adentro de
 * `GuiaDeAyudas`, cada ayuda es una sección entera, con su título, sin botón ni diálogo.
 */
import Link from 'next/link';
import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono } from './icono';

const EnLaGuia = createContext(false);

/**
 * Una explicación con su muestra al costado: lo que se ve en la pantalla, al lado de lo que significa.
 * `esencial`: va también en el diálogo de la pantalla. Sin esa marca, se lee solo en la Guía.
 */
export function RenglonDeAyuda({ muestra, esencial = false, children }: { muestra: ReactNode; esencial?: boolean; children: ReactNode }) {
  const enLaGuia = useContext(EnLaGuia);
  if (!enLaGuia && !esencial) return null;
  return (
    <li>
      <span className="como-se-lee__muestra" aria-hidden="true">
        {muestra}
      </span>
      <p>{children}</p>
    </li>
  );
}

/** Lo que va solo en la Guía: los detalles que el diálogo de la pantalla deja para leer con tiempo. */
export function SoloEnLaGuia({ children }: { children: ReactNode }) {
  return useContext(EnLaGuia) ? <>{children}</> : null;
}

/** La Guía del espacio profesional (DL-145): las ayudas enteras, juntas y como texto corrido. */
export function GuiaDeAyudas({ children }: { children: ReactNode }) {
  return <EnLaGuia.Provider value={true}>{children}</EnLaGuia.Provider>;
}

/** El ancla de cada ayuda en la Guía: el diálogo de la pantalla lleva directo a su sección. */
export const anclaDeLaAyuda = (deQue: string): string => `ayuda-${deQue}`;

export function AyudaDeVista({
  titulo,
  deQue,
  children,
}: {
  titulo: string;
  /** La vista de la que es la ayuda: si cambia con el diálogo abierto (Atrás del navegador), se cierra. Es también su ancla en la Guía. */
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
      <section className="guia__seccion como-se-lee" id={anclaDeLaAyuda(deQue)} aria-labelledby={`${id}-titulo`}>
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
        <div className="acciones como-se-lee__acciones">
          <Link className="boton boton--enlace" href={`/pro/guia#${anclaDeLaAyuda(deQue)}`}>
            Todo el detalle, en la Guía
          </Link>
          <button type="button" className="boton boton--secundario" onClick={() => dialogo.current?.close()}>
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
