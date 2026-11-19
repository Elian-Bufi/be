import type { Metadata } from 'next';
import { COPY_REVISION_DE_ALIMENTOS } from '@be/domain';
import { PuertaAdministrativa } from '../puerta';
import { ConsolaDeAlimentos } from './alimentos-para-revisar';

export const metadata: Metadata = { title: 'Alimentos · Administración · BE' };

/**
 * Website `/admin/foods` (DL-180, NUA-04): los alimentos que los profesionales cargaron a mano, para revisarlos; desde el
 * segundo tramo (NUA-D15 y D16), agrupados por nombre parecido y con «Sumar al canon».
 */
export default function PaginaDeAlimentos() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>{COPY_REVISION_DE_ALIMENTOS.titulo}</h1>
        <p className="bajada">{COPY_REVISION_DE_ALIMENTOS.queVe}</p>
        <ConsolaDeAlimentos />
      </PuertaAdministrativa>
    </main>
  );
}
