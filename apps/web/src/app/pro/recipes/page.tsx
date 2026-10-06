import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../components/encabezado';
import { Migas } from '../../../components/migas';
import { NavegacionProfesional } from '../../../components/navegacion';
import { MisRecetas } from './mis-recetas';

export const metadata: Metadata = { title: 'Mis recetas · BE' };

/** Website `/pro/recipes` — las recetas propias del profesional de Nutrición (DL-119; WP-NUTRICION-RECETAS). */
export default function PaginaDeRecetas() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Mis recetas' }]} />
        <h1>Mis recetas</h1>
        <Suspense fallback={null}>
          <MisRecetas />
        </Suspense>
      </main>
    </>
  );
}
