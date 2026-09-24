import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { NavegacionProfesional } from '../../../../components/navegacion';
import { Antropometria } from './antropometria';

export const metadata: Metadata = { title: 'Antropometría · BE' };

/**
 * Website `/pro/advisees/anthropometry?id=…&vista=…` — pestaña Antropometría del workspace (B10-07). El asesorado va
 * por query, como en Nutrición (DL-041).
 */
export default function PaginaDeAntropometria() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Suspense fallback={null}>
          <Antropometria />
        </Suspense>
      </main>
    </>
  );
}
