import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../components/encabezado';
import { Migas } from '../../../components/migas';
import { NavegacionProfesional } from '../../../components/navegacion';
import { MisPlantillas } from './mis-plantillas';

export const metadata: Metadata = { title: 'Mis plantillas · BE' };

/** Website `/pro/templates` — las plantillas de plan del profesional (PF-09; DL-108). */
export default function PaginaDePlantillas() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Mis plantillas' }]} />
        <h1>Mis plantillas</h1>
        <Suspense fallback={null}>
          <MisPlantillas />
        </Suspense>
      </main>
    </>
  );
}
