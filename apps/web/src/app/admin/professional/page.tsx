import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PuertaAdministrativa } from '../puerta';
import { FichaDelProfesional } from './ficha';

export const metadata: Metadata = { title: 'Ficha del profesional · Administración · BE' };

/** Website `/admin/professional?id=…` — la ficha de un profesional para Administración (UC-ADM-01 a 05). */
export default function PaginaDeLaFichaAdministrativa() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <Suspense fallback={null}>
          <FichaDelProfesional />
        </Suspense>
      </PuertaAdministrativa>
    </main>
  );
}
