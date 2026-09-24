import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { NavegacionProfesional } from '../../../../components/navegacion';
import { Entrenamiento } from './entrenamiento';

export const metadata: Metadata = { title: 'Entrenamiento · BE' };

/**
 * Website `/pro/advisees/training?id=…&vista=…` — pestaña Entrenamiento del workspace del asesorado (B10-06 §1).
 * El export estático no prerenderiza `/pro/advisees/:adviseeId/training`: el asesorado va por query (DL-041).
 */
export default function PaginaDeEntrenamiento() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Suspense fallback={null}>
          <Entrenamiento />
        </Suspense>
      </main>
    </>
  );
}
