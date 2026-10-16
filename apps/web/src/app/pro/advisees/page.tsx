import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../components/encabezado';
import { NavegacionProfesional } from '../../../components/navegacion';
import { Workspace } from './workspace';

export const metadata: Metadata = { title: 'Ficha del asesorado · BE' };

/**
 * Website `/pro/advisees?id=…` — el export estático no prerenderiza `/pro/advisees/:adviseeId` (DL-041). El título de la
 * página es el nombre visible del asesorado, que pone la ficha (WP-DASHBOARD-COMPRENSION, eje 6).
 *
 * WP-ESCRITORIO-AMABLE: la ficha ocupa el ancho de la ventana (`contenido--ficha`) y no lleva miga: su marco va pegado a la
 * barra de marca, que ya vuelve al Espacio profesional.
 */
export default function PaginaDelAsesorado() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ficha">
        <Suspense fallback={null}>
          <Workspace />
        </Suspense>
      </main>
    </>
  );
}
