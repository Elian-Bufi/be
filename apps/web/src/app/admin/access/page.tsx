import { SEGUNDO_FACTOR_DEL_PROFESIONAL_EXIGIDO } from '@be/domain';
import type { Metadata } from 'next';
import { PuertaAdministrativa } from '../puerta';
import { RecuperacionAsistida } from './recuperacion-asistida';
import { RestablecerSegundoFactor } from './restablecer-segundo-factor';

export const metadata: Metadata = { title: 'Recuperar el acceso · Administración · BE' };

/**
 * Website `/admin/access` (UF-03 de WP-USO-FINAL, DL-169; UF-D9): la recuperación asistida del acceso de una persona y,
 * desde UF-T56, el restablecimiento del segundo factor de un profesional (API-ADM-19).
 *
 * DL-177 (2026-11-18): el profesional ya no usa el autenticador, así que la consola no ofrece restablecerlo mientras la
 * política no lo exija. API-ADM-19 sigue en el contrato y funcionando; para un profesional que perdió el acceso, la
 * recuperación asistida de arriba es el camino (revoca las sesiones y emite un código de un solo uso).
 */
export default function PaginaDeRecuperacionAsistida() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>Recuperar el acceso</h1>
        <RecuperacionAsistida />
        {SEGUNDO_FACTOR_DEL_PROFESIONAL_EXIGIDO ? <RestablecerSegundoFactor /> : null}
      </PuertaAdministrativa>
    </main>
  );
}
