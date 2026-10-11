import type { Metadata } from 'next';
import { Encabezado } from '../../components/encabezado';
import { NavegacionProfesional } from '../../components/navegacion';
import { EspacioProfesional } from './espacio-profesional';

export const metadata: Metadata = { title: 'Espacio profesional · BE' };

/**
 * Website `/pro` — el Espacio profesional: los pendientes de la cartera (DL-107) y el directorio de asesorados. El
 * título de la página lo escribe el componente, junto a «hoy» y a «Solicitar vínculo».
 */
export default function PaginaProfesional() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--espacio">
        <EspacioProfesional />
      </main>
    </>
  );
}
