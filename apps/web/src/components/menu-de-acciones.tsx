'use client';

/**
 * Un menú de acciones: un botón que despliega una lista corta de cosas que se hacen de vez en cuando (cambiar un
 * nombre, quitar, guardar como plantilla). Saca de la vista lo que no se usa a cada rato sin esconderlo: el botón dice
 * qué tiene adentro (WP-ESCRITORIO-AREAS, parte 7).
 * - Es un botón con un panel (`aria-expanded`), no un menú de aplicación: adentro hay botones, que se recorren con Tab
 *   como cualquier otro control. Es el patrón del menú de la cuenta.
 * - Escape lo cierra y devuelve el foco al botón; tocar fuera lo cierra; salir de él con el teclado, también: abierto
 *   tapa lo que tiene debajo, y el foco no puede quedar detrás de un panel (WCAG 2.2, 2.4.11).
 * - Elegir una acción lo cierra. El foco vuelve al botón, salvo que la acción lo lleve a otro lado (un campo que se
 *   abre, un diálogo).
 * - **Una acción que no se puede usar va apagada y dice por qué,** en el mismo renglón: no desaparece.
 */
import type { NombreDeIcono } from '@be/domain';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icono } from './icono';

export interface AccionDelMenu {
  readonly clave: string;
  readonly texto: string;
  readonly icono?: ReactNode;
  readonly alElegir: () => void;
  /** Por qué no se puede usar ahora. Con un motivo, la acción va apagada y el motivo se lee debajo. */
  readonly noSePuede?: string | null;
}

export function MenuDeAcciones({
  id: idDelBoton,
  rotulo,
  texto = null,
  acciones,
  icono = 'menu',
  conFlecha = false,
  alineado = 'derecha',
}: {
  /** El identificador del botón, si hay que poder llevarle el foco desde afuera (al ir a un problema, al cerrar un nombre). */
  id?: string;
  /** El nombre accesible del botón, que dice de qué son las acciones: «Más acciones de este día tipo». */
  rotulo: string;
  /** El texto a la vista, si lleva («Más»); sin texto, el botón es solo el ícono de los tres puntos. */
  texto?: string | null;
  acciones: readonly AccionDelMenu[];
  /** El ícono del botón: los tres puntos, o el de lo que el menú hace («más», para un menú que agrega). */
  icono?: NombreDeIcono;
  /** Una flecha al final, para un botón con texto que despliega opciones («Agregar opción»). */
  conFlecha?: boolean;
  alineado?: 'derecha' | 'izquierda';
}) {
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // El menú se cierra él solo: Escape no llega a un diálogo que lo contenga.
      e.stopPropagation();
      setAbierto(false);
      boton.current?.focus();
    };
    const alTocar = (e: PointerEvent) => {
      if (raiz.current && e.target instanceof Node && !raiz.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('keydown', alTeclear, true);
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('keydown', alTeclear, true);
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [abierto]);

  return (
    <div
      ref={raiz}
      className="menu-de-acciones"
      data-abierto={abierto ? '' : undefined}
      // Al salir con el teclado, se cierra: el foco no queda detrás del panel.
      onBlur={(e) => {
        if (abierto && !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) setAbierto(false);
      }}
    >
      <button ref={boton} id={idDelBoton} type="button" className="boton boton--quieto menu-de-acciones__boton" aria-expanded={abierto} aria-controls={`${id}-panel`} aria-label={texto ? undefined : rotulo} title={texto ? undefined : rotulo} onClick={() => setAbierto((a) => !a)}>
        <Icono nombre={icono} tamano={18} />
        {texto ? <span>{texto}</span> : null}
        {texto ? <span className="visualmente-oculto">: {rotulo}</span> : null}
        {conFlecha ? <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} /> : null}
      </button>
      <div id={`${id}-panel`} className={`menu-de-acciones__panel menu-de-acciones__panel--${alineado}`} hidden={!abierto}>
        {abierto ? (
          <ul className="menu-de-acciones__lista">
            {acciones.map((a) => (
              <li key={a.clave}>
                <button
                  type="button"
                  className="menu-de-acciones__accion"
                  disabled={!!a.noSePuede}
                  aria-describedby={a.noSePuede ? `${id}-${a.clave}-motivo` : undefined}
                  onClick={() => {
                    setAbierto(false);
                    boton.current?.focus();
                    a.alElegir();
                  }}
                >
                  {a.icono ?? null}
                  <span>{a.texto}</span>
                </button>
                {a.noSePuede ? (
                  <p id={`${id}-${a.clave}-motivo`} className="nota menu-de-acciones__motivo">
                    {a.noSePuede}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
