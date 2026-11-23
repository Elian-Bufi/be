'use client';

/**
 * RP-05 y RP-08 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Lo largo, a un toque. Un botón chico, «?» o «Fuente», que despliega
 * la explicación o la cita: la población de una ecuación, las franjas del factor de actividad, una referencia
 * bibliográfica, la cuenta de los gramos del objetivo. La fórmula y los números quedan a la vista: el método a la vista es
 * la regla; lo que se pliega es el texto que la acompaña.
 * - Es un botón con `aria-expanded` y `aria-controls`: el lector de pantalla dice si está abierto y qué abre (el nombre
 *   completo va oculto al lado del «?»).
 * - Lo desplegado sigue en el documento con `hidden` mientras está cerrado: no se lee ni se enfoca.
 * - `como="div"` cuando lo que se despliega son párrafos; por omisión, un `span`, para ir dentro de un rótulo o una línea.
 *
 * RP-24 (RP-D91) · El «?» va en la esquina superior derecha de su sección, tarjeta o grupo, no al lado del título:
 * - `lugar="esquina"`: lo desplegado flota debajo del botón, alineado a la derecha, encima de lo que sigue. No ocupa lugar
 *   en la página: abrirlo no corre lo que se está editando (RP-19). Se cierra con Escape (el foco vuelve al «?»), con otro
 *   toque al «?» o tocando afuera.
 * - `EncabezadoConAyuda` arma el renglón del título con el «?» a la derecha; en un grupo sin título propio (un `fieldset`,
 *   una tarjeta, un aviso), el contenedor lleva la clase `con-ayuda-en-la-esquina` y el «?» se ubica arriba a la derecha.
 * - «Fuente» sigue en la línea de lo que cita: es la referencia de un nombre, no la ayuda de una sección.
 * La guardia `scripts/acciones-y-ayudas.test.cjs` falla si en la planificación vuelve un «?» sin `lugar="esquina"`.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export function ExplicacionAPedido({
  boton = '?',
  nombre,
  como = 'span',
  lugar = 'en-la-linea',
  children,
}: {
  /** Lo que dice el botón: «?» o «Fuente». */
  boton?: '?' | 'Fuente';
  /** Qué abre, en palabras, para el lector de pantalla y el título: «Para quién se publicó el método». */
  nombre: string;
  como?: 'span' | 'div';
  /** `esquina`: arriba a la derecha de su contenedor, con lo desplegado flotando (RP-24). */
  lugar?: 'en-la-linea' | 'esquina';
  children: ReactNode;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  const raiz = useRef<HTMLElement | null>(null);
  const elBoton = useRef<HTMLButtonElement>(null);
  const flota = lugar === 'esquina';
  // Lo que flota se cierra con Escape o tocando afuera, como cualquier panel que se abre encima de la página.
  useEffect(() => {
    if (!flota || !abierta) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierta(false);
      elBoton.current?.focus();
    };
    const afuera = (e: PointerEvent) => {
      if (raiz.current && e.target instanceof Node && !raiz.current.contains(e.target)) setAbierta(false);
    };
    document.addEventListener('keydown', tecla);
    document.addEventListener('pointerdown', afuera);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.removeEventListener('pointerdown', afuera);
    };
  }, [flota, abierta]);
  const Envoltorio = como;
  const Texto = como;
  const guardar = (n: HTMLElement | null) => {
    raiz.current = n;
  };
  return (
    <Envoltorio ref={guardar} className={`a-pedido a-pedido--${boton === '?' ? 'ayuda' : 'fuente'}${flota ? ' a-pedido--esquina' : ''}`} data-a-pedido data-lugar={lugar}>
      <button ref={elBoton} type="button" className="boton boton--quieto boton--compacto a-pedido__boton" aria-expanded={abierta} aria-controls={id} title={nombre} onClick={() => setAbierta((x) => !x)}>
        {boton === '?' ? <span aria-hidden="true">?</span> : boton}
        <span className="visualmente-oculto">{boton === '?' ? nombre : `: ${nombre}`}</span>
      </button>
      <Texto id={id} className="a-pedido__texto" hidden={!abierta}>
        {children}
      </Texto>
    </Envoltorio>
  );
}

/**
 * RP-24 (RP-D91) · El título de una sección o tarjeta con su «?» en la esquina superior derecha. El título queda a la
 * izquierda (con su ícono, si lo trae) y el «?» a la derecha, en el mismo renglón; lo que despliega flota debajo, sin
 * correr la sección.
 */
export function EncabezadoConAyuda({
  nivel = 3,
  id,
  titulo,
  nombre,
  como = 'div',
  ayuda,
  className,
  claseDelTitulo,
}: {
  nivel?: 2 | 3 | 4;
  id?: string;
  titulo: ReactNode;
  /** Qué abre el «?», en palabras. */
  nombre: string;
  /** `div` si la ayuda son párrafos. */
  como?: 'span' | 'div';
  ayuda: ReactNode;
  className?: string;
  claseDelTitulo?: string;
}) {
  const Titulo = `h${nivel}` as 'h2' | 'h3' | 'h4';
  return (
    <div className={`encabezado-con-ayuda${className ? ` ${className}` : ''}`} data-encabezado-con-ayuda>
      <Titulo id={id} className={`encabezado-con-ayuda__titulo${claseDelTitulo ? ` ${claseDelTitulo}` : ''}`}>
        {titulo}
      </Titulo>
      <ExplicacionAPedido nombre={nombre} como={como} lugar="esquina">
        {ayuda}
      </ExplicacionAPedido>
    </div>
  );
}
