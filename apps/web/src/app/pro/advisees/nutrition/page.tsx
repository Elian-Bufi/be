import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { NavegacionProfesional } from '../../../../components/navegacion';
import { Nutricion } from './nutricion';

export const metadata: Metadata = { title: 'Nutrición · BE' };

/**
 * Website `/pro/advisees/nutrition?id=…&vista=…` — pestaña Nutrición del workspace del asesorado (B10-05; 10-B01:748).
 * El export estático no prerenderiza `/pro/advisees/:adviseeId/nutrition`: el asesorado va por query (DL-041).
 */
export default function PaginaDeNutricion() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Suspense fallback={null}>
          <Nutricion />
        </Suspense>
      </main>
    </>
  );
}
