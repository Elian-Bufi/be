import type { Metadata } from 'next';
import { PuertaAdministrativa } from '../puerta';
import { RecuperacionAsistida } from './recuperacion-asistida';

export const metadata: Metadata = { title: 'Recuperar el acceso · Administración · BE' };

/** Website `/admin/access` (UF-03 de WP-USO-FINAL, DL-169; UF-D9): la recuperación asistida del acceso de una persona. */
export default function PaginaDeRecuperacionAsistida() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>Recuperar el acceso</h1>
        <RecuperacionAsistida />
      </PuertaAdministrativa>
    </main>
  );
}
