'use client';

/**
 * RP-05 y RP-08 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Lo largo, a un toque. Un botón chico, «?» o «Fuente», que despliega
 * en su lugar la explicación o la cita: la población de una ecuación, las franjas del factor de actividad, una referencia
 * bibliográfica, la cuenta de los gramos del objetivo. La fórmula y los números quedan a la vista: el método a la vista es
 * la regla; lo que se pliega es el texto que la acompaña.
 * - Es un botón con `aria-expanded` y `aria-controls`: el lector de pantalla dice si está abierto y qué abre (el nombre
 *   completo va oculto al lado del «?»).
 * - Lo desplegado sigue en el documento con `hidden` mientras está cerrado: no se lee ni se enfoca.
 * - `como="div"` cuando lo que se despliega son párrafos; por omisión, un `span`, para ir dentro de un rótulo o una línea.
 */
import { useId, useState, type ReactNode } from 'react';

export function ExplicacionAPedido({
  boton = '?',
  nombre,
  como = 'span',
  children,
}: {
  /** Lo que dice el botón: «?» o «Fuente». */
  boton?: '?' | 'Fuente';
  /** Qué abre, en palabras, para el lector de pantalla y el título: «Para quién se publicó el método». */
  nombre: string;
  como?: 'span' | 'div';
  children: ReactNode;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  const Envoltorio = como;
  const Texto = como;
  return (
    <Envoltorio className={`a-pedido a-pedido--${boton === '?' ? 'ayuda' : 'fuente'}`} data-a-pedido>
      <button type="button" className="boton boton--quieto boton--compacto a-pedido__boton" aria-expanded={abierta} aria-controls={id} title={nombre} onClick={() => setAbierta((x) => !x)}>
        {boton === '?' ? <span aria-hidden="true">?</span> : boton}
        <span className="visualmente-oculto">{boton === '?' ? nombre : `: ${nombre}`}</span>
      </button>
      <Texto id={id} className="a-pedido__texto" hidden={!abierta}>
        {children}
      </Texto>
    </Envoltorio>
  );
}
