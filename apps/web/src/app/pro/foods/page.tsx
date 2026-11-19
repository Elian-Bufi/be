import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../components/encabezado';
import { Migas } from '../../../components/migas';
import { NavegacionProfesional } from '../../../components/navegacion';
import { MisAlimentos } from './mis-alimentos';

export const metadata: Metadata = { title: 'Mis alimentos · BE' };

/** Website `/pro/foods` — los alimentos que el profesional de Nutrición cargó a mano (DL-180; WP-NUTRICION-ALIMENTOS). */
export default function PaginaDeAlimentos() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Plantillas y habituales', href: '/pro/templates' }, { texto: 'Mis alimentos' }]} />
        <h1>Mis alimentos</h1>
        <Suspense fallback={null}>
          <MisAlimentos />
        </Suspense>
      </main>
    </>
  );
}
