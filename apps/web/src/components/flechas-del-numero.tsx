'use client';

/**
 * RP-22 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Las flechitas de un número que se escribe como texto: un descanso «02:30»,
 * unas repeticiones «8» (o un rango «8-12», que no tiene paso) o una carga «62,5». Un `type="number"` no sirve ahí: no
 * acepta «02:30» ni un rango, y borra la coma a mitad de camino. Son las del campo numérico del navegador, dibujadas:
 * - aparecen al pasar el mouse o con el foco en el campo; el lugar está reservado siempre (el texto no se corre);
 * - no reciben el foco (`tabIndex={-1}`): con el teclado, ↑ y ↓ en el mismo campo hacen lo mismo;
 * - el toque no le saca el foco al campo (`onMouseDown`), para seguir escribiendo;
 * - el lector de pantalla no las recorre (`aria-hidden`): en una tabla de series serían dos botones más por celda, y el
 *   campo ya lo hace con ↑ y ↓, como un campo numérico del navegador, que tampoco anuncia sus flechitas.
 * Lo que vale cada paso, el mínimo y el máximo los decide quien las usa (`planilla-de-series.ts`).
 */
import type { ReactNode } from 'react';
import { Icono } from './icono';

export function ConFlechas({ que, alSubir, alBajar, children }: { que: string; alSubir: () => void; alBajar: () => void; children: ReactNode }) {
  return (
    <span className="con-flechas" data-con-flechas>
      {children}
      <span className="con-flechas__flechas" aria-hidden="true">
        <button type="button" tabIndex={-1} className="con-flechas__flecha" aria-label={`Sumar un paso a ${que}`} title={`Sumar un paso a ${que}`} onMouseDown={(e) => e.preventDefault()} onClick={alSubir} data-flecha="sube">
          <Icono nombre="arriba" tamano={15} />
        </button>
        <button type="button" tabIndex={-1} className="con-flechas__flecha" aria-label={`Restar un paso a ${que}`} title={`Restar un paso a ${que}`} onMouseDown={(e) => e.preventDefault()} onClick={alBajar} data-flecha="baja">
          <Icono nombre="abajo" tamano={15} />
        </button>
      </span>
    </span>
  );
}
