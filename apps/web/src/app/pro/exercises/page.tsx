import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../components/encabezado';
import { Migas } from '../../../components/migas';
import { NavegacionProfesional } from '../../../components/navegacion';
import { MisEjercicios } from './mis-ejercicios';

export const metadata: Metadata = { title: 'Mis ejercicios · BE' };

/** Website `/pro/exercises` — los ejercicios propios del profesional de Entrenamiento y su imagen (DL-123). */
export default function PaginaDeEjercicios() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Mis ejercicios' }]} />
        <h1>Mis ejercicios</h1>
        <Suspense fallback={null}>
          <MisEjercicios />
        </Suspense>
      </main>
    </>
  );
}
