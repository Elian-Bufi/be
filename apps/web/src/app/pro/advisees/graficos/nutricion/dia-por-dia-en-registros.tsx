'use client';

/**
 * GR-14 en «Registros» de Nutrición (WP-GRAFICOS fase 2, rama C; DL-174): arriba de la lista, el gráfico de lo indicado y
 * lo registrado, día por día, para el mismo período que la lista y con las comidas que la vista ya leyó (API-NUT-17).
 * Arranca abierto, para que el patrón se vea de entrada, y se pliega con un botón: plegado no lee nada (GR-T49).
 */
import type { ContrasteDescriptivo } from '@be/domain';
import { useId, useState } from 'react';
import { DiaPorDia } from './indicado-y-registrado-por-dia-en-pantalla';
import type { LecturaBase } from './lecturas-de-nutricion';

export const COPY_DIA_POR_DIA = {
  ocultar: 'Ocultar el gráfico día por día',
  mostrar: 'Ver el gráfico día por día',
  nombre: 'Día por día',
} as const;

export function DiaPorDiaEnRegistros({ lectura, desde, hasta, hoy, contraste }: { lectura: LecturaBase; desde: string; hasta: string; hoy: string; contraste: ContrasteDescriptivo['days'] }) {
  const [abierto, setAbierto] = useState(true);
  const id = useId();
  return (
    <section className="dia-por-dia" aria-label={COPY_DIA_POR_DIA.nombre}>
      <div className="dia-por-dia__acciones">
        <button type="button" className="boton boton--enlace" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((a) => !a)}>
          {abierto ? COPY_DIA_POR_DIA.ocultar : COPY_DIA_POR_DIA.mostrar}
        </button>
      </div>
      <div id={id} hidden={!abierto}>
        {abierto ? <DiaPorDia lectura={lectura} desde={desde} hasta={hasta} hoy={hoy} contraste={contraste} /> : null}
      </div>
    </section>
  );
}
