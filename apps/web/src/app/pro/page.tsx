import type { Metadata } from 'next';
import { Encabezado } from '../../components/encabezado';
import { NavegacionProfesional } from '../../components/navegacion';
import { EspacioProfesional } from './espacio-profesional';

export const metadata: Metadata = { title: 'Espacio profesional · BE' };

/** Website `/pro` — lista mínima de vínculos y solicitudes enviadas, sin Cartera (DL-041 A). */
export default function PaginaProfesional() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <h1>Espacio profesional</h1>
        <EspacioProfesional />
      </main>
    </>
  );
}
