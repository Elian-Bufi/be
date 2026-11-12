import type { Metadata } from 'next';
import { PuertaAdministrativa } from '../puerta';
import { RecuperacionAsistida } from './recuperacion-asistida';
import { RestablecerSegundoFactor } from './restablecer-segundo-factor';

export const metadata: Metadata = { title: 'Recuperar el acceso · Administración · BE' };

/**
 * Website `/admin/access` (UF-03 de WP-USO-FINAL, DL-169; UF-D9): la recuperación asistida del acceso de una persona y,
 * desde UF-T56, el restablecimiento del segundo factor de un profesional (API-ADM-19).
 */
export default function PaginaDeRecuperacionAsistida() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>Recuperar el acceso</h1>
        <RecuperacionAsistida />
        <RestablecerSegundoFactor />
      </PuertaAdministrativa>
    </main>
  );
}
