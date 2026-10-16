import type { Metadata } from 'next';
import { CentroDeNovedades } from '../../../components/centro-de-novedades';
import { Encabezado } from '../../../components/encabezado';
import { NavegacionProfesional } from '../../../components/navegacion';

export const metadata: Metadata = { title: 'Novedades · BE' };

/** Website `/pro/news` — las novedades del profesional (WP-NOVEDADES-Y-AVISOS, DL-133; RF-061, UC-P30). */
export default function PaginaDeNovedadesProfesional() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido">
        <h1>Novedades</h1>
        <CentroDeNovedades espacio="pro" />
      </main>
    </>
  );
}
