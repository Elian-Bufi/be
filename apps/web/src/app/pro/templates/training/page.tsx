import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { Migas } from '../../../../components/migas';
import { NavegacionProfesional } from '../../../../components/navegacion';
import { EditorDeLaPlantillaEnSuPagina } from './editor-de-la-plantilla';

export const metadata: Metadata = { title: 'Plantilla de entrenamiento · BE' };

/**
 * Website `/pro/templates/training?preparacion=…` — el editor de una plantilla de entrenamiento, sin persona (PLT;
 * DL-182). El export estático no prerenderiza segmentos dinámicos: la preparación va por query (DL-041).
 */
export default function PaginaDeLaPlantilla() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ficha">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Plantillas y habituales', href: '/pro/templates' }, { texto: 'Plantilla de entrenamiento' }]} />
        <Suspense fallback={null}>
          <EditorDeLaPlantillaEnSuPagina />
        </Suspense>
      </main>
    </>
  );
}
