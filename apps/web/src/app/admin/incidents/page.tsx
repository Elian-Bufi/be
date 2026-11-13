import type { Metadata } from 'next';
import { COPY_INCIDENCIAS } from '@be/domain';
import { PuertaAdministrativa } from '../puerta';
import { Incidencias } from './incidencias';

export const metadata: Metadata = { title: 'Incidencias · Administración · BE' };

/** Website `/admin/incidents` (RF-068, DL-172): las incidencias que avisaron las personas y los profesionales. */
export default function PaginaDeIncidencias() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>{COPY_INCIDENCIAS.administracion.titulo}</h1>
        <p className="bajada">{COPY_INCIDENCIAS.administracion.bajada}</p>
        <Incidencias />
      </PuertaAdministrativa>
    </main>
  );
}
