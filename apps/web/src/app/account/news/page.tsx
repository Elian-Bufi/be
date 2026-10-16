import type { Metadata } from 'next';
import { CentroDeNovedades } from '../../../components/centro-de-novedades';
import { Encabezado } from '../../../components/encabezado';
import { NavegacionDeCuenta } from '../../../components/navegacion';

export const metadata: Metadata = { title: 'Novedades · BE' };

/** Website `/account/news` — las novedades de la persona (WP-NOVEDADES-Y-AVISOS, DL-133; RF-061, UC-P30). */
export default function PaginaDeNovedadesDeCuenta() {
  return (
    <>
      <Encabezado navegacion={<NavegacionDeCuenta />} />
      <main id="contenido" className="contenido">
        <h1>Novedades</h1>
        <CentroDeNovedades espacio="cuenta" />
      </main>
    </>
  );
}
