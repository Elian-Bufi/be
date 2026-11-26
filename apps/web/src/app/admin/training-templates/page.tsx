import type { Metadata } from 'next';
import { COPY_PLANTILLAS_DE_BE_EN_ADMINISTRACION as C } from '@be/domain';
import { PuertaAdministrativa } from '../puerta';
import { PlantillasDeBeEnAdministracion } from './plantillas-de-be';

export const metadata: Metadata = { title: 'Plantillas de BE · Administración · BE' };

/**
 * Website `/admin/training-templates` (DL-199, ET3-05): las Plantillas de BE de Entrenamiento, con su estado y su
 * historia, para ofrecerlas o retirarlas.
 */
export default function PaginaDeLasPlantillasDeBe() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>{C.titulo}</h1>
        <p className="bajada">{C.bajada}</p>
        <PlantillasDeBeEnAdministracion />
      </PuertaAdministrativa>
    </main>
  );
}
