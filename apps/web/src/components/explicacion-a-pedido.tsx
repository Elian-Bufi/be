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
 *   toque al «?», tocando afuera o pasando el foco a otra cosa (así no quedan dos abiertos); en una columna
 *   angosta, lo que flota se limita al lugar que hay hasta su borde.
 * - `EncabezadoConAyuda` arma el renglón del título con el «?» a la derecha; en un grupo sin título propio (un `fieldset`,
 *   una tarjeta, un aviso), el contenedor lleva la clase `con-ayuda-en-la-esquina` y el «?» se ubica arriba a la derecha.
 * - «Fuente» sigue en la línea de lo que cita: es la referencia de un nombre, no la ayuda de una sección.
 * La guardia `scripts/acciones-y-ayudas.test.cjs` falla si en la planificación vuelve un «?» sin `lugar="esquina"`.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

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
  const elTexto = useRef<HTMLElement | null>(null);
  const flota = lugar === 'esquina';
  // Lo que flota se cierra con Escape, tocando afuera o pasando el foco a otra cosa, como cualquier panel que se abre
  // encima de la página. Así tampoco quedan dos abiertos a la vez: abrir otro «?» es tocar (o enfocar) afuera de este.
  useEffect(() => {
    if (!flota || !abierta) return;
    const adentro = (n: EventTarget | null) => !!raiz.current && n instanceof Node && raiz.current.contains(n);
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Escape cierra solo la ayuda: dentro de un cuadro o un diálogo nativo, no lo cierra a él también.
      e.preventDefault();
      e.stopPropagation();
      const conElFoco = adentro(document.activeElement);
      setAbierta(false);
      if (conElFoco) elBoton.current?.focus();
    };
    const afuera = (e: Event) => {
      if (!adentro(e.target)) setAbierta(false);
    };
    document.addEventListener('keydown', tecla, true);
    document.addEventListener('pointerdown', afuera);
    document.addEventListener('focusin', afuera);
    return () => {
      document.removeEventListener('keydown', tecla, true);
      document.removeEventListener('pointerdown', afuera);
      document.removeEventListener('focusin', afuera);
    };
  }, [flota, abierta]);
  // Lo que flota se alinea a la derecha del «?» y crece hacia la izquierda: en una columna angosta (el panel lateral, un
  // cajón) se saldría por su borde izquierdo, y un contenedor con desplazamiento lo cortaría sin poder verlo. Al abrirse,
  // se limita al lugar que hay entre el «?» y ese borde (o el de la pantalla).
  useLayoutEffect(() => {
    const texto = elTexto.current;
    if (!flota || !abierta || !texto || !elBoton.current) return;
    let borde = 0;
    for (let p = raiz.current?.parentElement ?? null; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible') {
        borde = p.getBoundingClientRect().left;
        break;
      }
    }
    const lugarDisponible = elBoton.current.getBoundingClientRect().right - Math.max(0, borde) - 8;
    texto.style.maxWidth = `min(30rem, 80vw, ${Math.max(160, Math.floor(lugarDisponible))}px)`;
  }, [flota, abierta]);
  const Envoltorio = como;
  const Texto = como;
  const guardar = (n: HTMLElement | null) => {
    raiz.current = n;
  };
  const guardarTexto = (n: HTMLElement | null) => {
    elTexto.current = n;
  };
  return (
    <Envoltorio ref={guardar} className={`a-pedido a-pedido--${boton === '?' ? 'ayuda' : 'fuente'}${flota ? ' a-pedido--esquina' : ''}`} data-a-pedido data-lugar={lugar}>
      <button ref={elBoton} type="button" className="boton boton--quieto boton--compacto a-pedido__boton" aria-expanded={abierta} aria-controls={id} title={nombre} onClick={() => setAbierta((x) => !x)}>
        {boton === '?' ? <span aria-hidden="true">?</span> : boton}
        <span className="visualmente-oculto">{boton === '?' ? nombre : `: ${nombre}`}</span>
      </button>
      <Texto ref={guardarTexto} id={id} className="a-pedido__texto" hidden={!abierta}>
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
