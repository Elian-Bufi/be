'use client';

/**
 * El campo de un nombre que se cambia a pedido (WP-ESCRITORIO-AREAS, partes 7 y 8): el de un día tipo, una comida o
 * una opción, en el plan de comidas; el de un bloque, un microciclo o una sesión, en el de entrenamiento.
 * - Se muestra cuando se pide («Cambiar el nombre») y entonces toma el foco, con el texto seleccionado: lo que se
 *   escribe lo reemplaza. Enter o salir de él lo cierra.
 * - **Lo que no tiene nombre lo muestra siempre** (sin nombre no se puede guardar), y ahí no toma el foco: abrir algo
 *   no lo saca de donde estaba. Al entrar a escribir en él pasa a ser el nombre que se está cambiando: si no,
 *   desaparecería con la primera letra.
 * - Vacío, Enter no lo cierra: no hay nada que confirmar.
 * - Al confirmar con Enter el campo deja de estar: el foco va a `despues` (lo que ahora muestra ese nombre), para no
 *   perderse al principio de la página.
 */
import { useEffect, useRef } from 'react';
import { Campo } from './formulario';

export function CampoDeNombre({
  id,
  etiqueta,
  valor,
  maximo,
  enfocar,
  despues,
  alEmpezar,
  alCambiar,
  alTerminar,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  maximo: number;
  /** Es el nombre que se está cambiando: toma el foco. */
  enfocar: boolean;
  /** El identificador de lo que recibe el foco al confirmar con Enter: el control que muestra ese nombre. */
  despues?: string;
  alEmpezar: () => void;
  alCambiar: (v: string) => void;
  alTerminar: () => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!enfocar || document.activeElement === campo.current) return;
    campo.current?.focus();
    campo.current?.select();
  }, [enfocar]);
  return (
    <div className="nombre-a-pedido">
      <Campo
        ref={campo}
        id={id}
        etiqueta={etiqueta}
        value={valor}
        maxLength={maximo}
        onChange={(e) => {
          // Si se escribe en un campo que estaba a la vista por estar vacío, pasa a ser el que se está cambiando.
          if (!enfocar) alEmpezar();
          alCambiar(e.target.value);
        }}
        onFocus={() => {
          if (!enfocar) alEmpezar();
        }}
        onBlur={alTerminar}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          // Enter confirma el nombre; vacío no hay nada que confirmar, y el campo sigue ahí para escribirlo.
          if (valor.trim() === '') return;
          // El foco se va antes de que el campo deje de estar (salir de él ya lo cierra).
          if (despues) document.getElementById(despues)?.focus();
          alTerminar();
        }}
      />
    </div>
  );
}
