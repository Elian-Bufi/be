import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../components/encabezado';
import { Migas } from '../../../components/migas';
import { NavegacionProfesional } from '../../../components/navegacion';
import { Workspace } from './workspace';

export const metadata: Metadata = { title: 'Ficha del asesorado · BE' };

/**
 * Website `/pro/advisees?id=…` — el export estático no prerenderiza `/pro/advisees/:adviseeId` (DL-041). El título de la
 * página es el nombre visible del asesorado, que pone la ficha (WP-DASHBOARD-COMPRENSION, eje 6).
 */
export default function PaginaDelAsesorado() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho contenido--seguimiento">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Ficha del asesorado' }]} />
        <Suspense fallback={null}>
          <Workspace />
        </Suspense>
      </main>
    </>
  );
}
