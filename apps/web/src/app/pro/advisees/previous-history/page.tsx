import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { NavegacionProfesional } from '../../../../components/navegacion';
import { PorAsesorado } from '../por-asesorado';
import { HistoriaAnteriorDeLaPersona } from './historia-anterior-en-pantalla';

export const metadata: Metadata = { title: 'Historia anterior · BE' };

/**
 * Website `/pro/advisees/previous-history?id=…&area=…` — «Historia anterior» (WP-HISTORIA-ANTERIOR, DL-175): lo que pasó
 * en un área de la persona con otro profesional, antes del acompañamiento de quien lee, si la persona lo autorizó desde su
 * app. La persona va por query, como en las demás pestañas de la ficha (DL-041). Se abre desde el menú «Más» de la ficha.
 */
export default function PaginaDeLaHistoriaAnterior() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ficha">
        <Suspense fallback={null}>
          <PorAsesorado>
            <HistoriaAnteriorDeLaPersona />
          </PorAsesorado>
        </Suspense>
      </main>
    </>
  );
}
