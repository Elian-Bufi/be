'use client';

/**
 * Un cajón: un formulario que se abre al costado, encima de la vista, que sigue a la vista por detrás (el velo la
 * atenúa, no la tapa). Lo usa «Pedir información» (WP-ESCRITORIO-AREAS, parte 4).
 *
 * Desde ED-10 (WP-EDITORES-PROFESIONAL) es la forma «panel» del cuadro enfocado (`cuadro-enfocado.tsx`), que tiene las
 * reglas: el foco va al título (o a `focoInicial`), Escape y «Cerrar» no escriben, y mientras está `ocupado` no se
 * cierra. La cabecera y el pie quedan fijos; el cuerpo se desplaza adentro.
 */
import type { ReactNode, RefObject } from 'react';
import { CuadroEnfocado } from './cuadro-enfocado';

export function Cajon(props: {
  abierto: boolean;
  titulo: string;
  /** De quién es lo que se va a hacer: el cajón tapa el marco de la página, que lo decía. */
  sobretitulo?: string | null;
  /** Hay algo elegido o escrito sin aplicar: cerrar (Escape o «Cerrar») pregunta antes de perderlo. */
  conCambios?: boolean;
  /** Hay un envío en curso: no se cierra hasta que termine. */
  ocupado?: boolean;
  /** Dónde va el foco al abrirse, si no es el título: algo de adentro del cajón. */
  focoInicial?: RefObject<HTMLElement | null>;
  onCerrar: () => void;
  /** Lo que queda fijo abajo: la acción y lo que hay que saber antes de hacerla. */
  pie?: ReactNode;
  children?: ReactNode;
}) {
  return <CuadroEnfocado forma="panel" {...props} />;
}
