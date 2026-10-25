import type { Metadata } from 'next';
import { PuertaAdministrativa } from '../puerta';
import { SeguridadDelAcceso } from './seguridad';

export const metadata: Metadata = { title: 'Seguridad · Administración · BE' };

/** Website `/admin/security` — la seguridad del acceso administrativo: códigos de recuperación y autenticador. */
export default function PaginaDeSeguridadAdministrativa() {
  return (
    <main id="contenido" className="contenido">
      <PuertaAdministrativa>
        <SeguridadDelAcceso />
      </PuertaAdministrativa>
    </main>
  );
}
