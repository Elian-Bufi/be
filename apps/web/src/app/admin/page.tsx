import type { Metadata } from 'next';
import { ListaDeProfesionales } from './lista';
import { PuertaAdministrativa } from './puerta';

export const metadata: Metadata = { title: 'Profesionales · Administración · BE' };

/** Website `/admin` — la entrada de la consola y, con el segundo factor vigente, la lista de profesionales (UC-ADM-01). */
export default function PaginaDeAdministracion() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <ListaDeProfesionales />
      </PuertaAdministrativa>
    </main>
  );
}
