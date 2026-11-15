'use client';

/**
 * «Cómo leerlo» (WP-GRAFICOS, pasada visual del 15/11; DISENO-VISUAL §1, principio 2): el método y las aclaraciones de
 * un gráfico, a un toque. Es un `<details>` cerrado de entrada, con su ícono «i»: se abre con el teclado (Enter o
 * Espacio sobre su resumen) y el lector de pantalla dice si está abierto o cerrado. Ahí van el método (Epley v1), por qué
 * una diferencia de RIR mueve la estimación, qué cuenta como subtotal y qué no entra.
 *
 * Siempre a la vista, afuera de «Cómo leerlo»: la frase fija de los cruces (`FraseDeLaCoincidencia`) y la marca de lo
 * estimado en el título. Las reglas de honestidad (§5) no cambian: cambia dónde se dicen, no qué se dice.
 */
import { FRASE_DE_LA_COINCIDENCIA } from '@be/domain';
import type { ReactNode } from 'react';
import { Icono } from '../../../../components/icono';

export const COPY_COMO_LEERLO = {
  titulo: 'Cómo leerlo',
} as const;

/**
 * `soloIcono`: el resumen es solo la «i», con su nombre para el lector de pantalla (sin `title`: algunos lectores lo
 * leían dos veces). Se ve solo la «i», así que úsese solo donde el nombre se entienda sin leerlo.
 * `de`: de qué gráfico es, para el lector de pantalla (revisión de #283): con varios gráficos en una página, la lista de
 * controles no muestra varios «Cómo leerlo» iguales («Cómo leerlo: Peso y calorías»).
 */
export function ComoLeerlo({
  children,
  titulo = COPY_COMO_LEERLO.titulo,
  className = '',
  soloIcono = false,
  de,
}: {
  children: ReactNode;
  titulo?: string;
  className?: string;
  soloIcono?: boolean;
  de?: string;
}) {
  return (
    <details className={['grafico-base__como-leerlo', soloIcono ? 'grafico-base__como-leerlo--icono' : '', className].filter(Boolean).join(' ')} data-como-leerlo>
      <summary>
        <Icono nombre="info" tamano={15} />
        {soloIcono ? <span className="visualmente-oculto">{titulo}</span> : titulo}
        {de ? <span className="visualmente-oculto">{`: ${de}`}</span> : null}
      </summary>
      <div className="grafico-base__como-leerlo-cuerpo">{children}</div>
    </details>
  );
}

/** La frase fija de los cruces, en una línea tenue y siempre a la vista (§5.1). */
export function FraseDeLaCoincidencia({ texto = FRASE_DE_LA_COINCIDENCIA }: { texto?: string }) {
  return (
    <p className="grafico-base__frase" data-frase-de-la-coincidencia>
      {texto}
    </p>
  );
}
