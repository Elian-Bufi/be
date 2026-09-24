import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { NavegacionProfesional } from '../../../../components/navegacion';
import { Formularios } from './formularios';

export const metadata: Metadata = { title: 'Información · BE' };

/**
 * Website `/pro/advisees/forms?id=…&vista=…` — pestaña Información del workspace (WP-07; RF-071). El asesorado va
 * por query, como en los demás dominios (DL-041). Es transversal: no cuelga de ningún alcance.
 */
export default function PaginaDeFormularios() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Suspense fallback={null}>
          <Formularios />
        </Suspense>
      </main>
    </>
  );
}
