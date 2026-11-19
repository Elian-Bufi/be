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
 * - Una acción puede llevar, debajo del nombre, una línea que dice qué hace (`detalle`): en una lista no hay un «pasar el
 *   mouse» que sirva, así que la pista va a la vista. El nombre accesible sigue siendo el de la acción; la línea es su
 *   descripción.
 * - **Sale entero, por encima de los paneles** (ENP-D11, la prueba de Elián del 18/11: el «⋯» de la fase quedaba cortado por
 *   el panel izquierdo, que desplaza su contenido y recorta lo que sobresale). El panel del menú se ubica respecto de la
 *   ventana, no del panel que lo contiene: debajo del botón, o arriba si abajo no entra, y sin salirse por los costados.
 *   Sigue al botón si la página o un panel se desplazan. En el DOM queda donde estaba: el orden del foco no cambia.
 */
import type { NombreDeIcono } from '@be/domain';
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icono } from './icono';

export interface AccionDelMenu {
  readonly clave: string;
  readonly texto: string;
  readonly icono?: ReactNode;
  /** Qué hace, en una línea chica debajo del nombre (la pista de la acción). */
  readonly detalle?: string | null;
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
  const panel = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [lugar, setLugar] = useState<CSSProperties | null>(null);

  // ENP-D11: el lugar del panel, respecto de la ventana. Si algún contenedor arma su propio marco para lo fijo (un
  // `backdrop-filter`, como el vidrio de la barra), se corrige con lo que se midió: el panel queda donde se pidió.
  useLayoutEffect(() => {
    if (!abierto) {
      setLugar(null);
      return;
    }
    const ubicar = () => {
      const b = boton.current?.getBoundingClientRect();
      const p = panel.current;
      if (!b || !p) return;
      const margen = 8;
      const ancho = p.offsetWidth;
      const alto = p.offsetHeight;
      const abajo = window.innerHeight - b.bottom - margen;
      const arriba = b.top - margen;
      const haciaArriba = alto > abajo && arriba > abajo;
      const top = haciaArriba ? Math.max(margen, b.top - 6 - alto) : b.bottom + 6;
      const deseadaIzquierda = alineado === 'izquierda' ? b.left : b.right - ancho;
      const left = Math.min(Math.max(margen, deseadaIzquierda), Math.max(margen, window.innerWidth - margen - ancho));
      const maxHeight = Math.max(160, (haciaArriba ? arriba : abajo) - 6);
      // Primero se pide el lugar y después se mide: si un contenedor corre lo fijo, se compensa la diferencia.
      p.style.top = `${top}px`;
      p.style.left = `${left}px`;
      const medido = p.getBoundingClientRect();
      setLugar({ top: top + (top - medido.top), left: left + (left - medido.left), maxHeight });
    };
    ubicar();
    window.addEventListener('resize', ubicar);
    window.addEventListener('scroll', ubicar, true);
    return () => {
      window.removeEventListener('resize', ubicar);
      window.removeEventListener('scroll', ubicar, true);
    };
  }, [abierto, alineado]);

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
      <div
        ref={panel}
        id={`${id}-panel`}
        className={`menu-de-acciones__panel menu-de-acciones__panel--${alineado}`}
        data-ubicado={lugar ? '' : undefined}
        style={lugar ?? undefined}
        hidden={!abierto}
      >
        {abierto ? (
          <ul className="menu-de-acciones__lista">
            {acciones.map((a) => (
              <li key={a.clave}>
                <button
                  type="button"
                  className="menu-de-acciones__accion"
                  disabled={!!a.noSePuede}
                  aria-labelledby={a.detalle ? `${id}-${a.clave}-texto` : undefined}
                  aria-describedby={[a.detalle ? `${id}-${a.clave}-detalle` : null, a.noSePuede ? `${id}-${a.clave}-motivo` : null].filter(Boolean).join(' ') || undefined}
                  onClick={() => {
                    setAbierto(false);
                    boton.current?.focus();
                    a.alElegir();
                  }}
                >
                  {a.icono ?? null}
                  {a.detalle ? (
                    <span className="menu-de-acciones__textos">
                      <span id={`${id}-${a.clave}-texto`}>{a.texto}</span>
                      <span id={`${id}-${a.clave}-detalle`} className="menu-de-acciones__detalle">
                        {a.detalle}
                      </span>
                    </span>
                  ) : (
                    <span>{a.texto}</span>
                  )}
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
