import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { NavegacionDeCuenta } from '../../../components/navegacion';
import { Privacidad } from './privacidad';

export const metadata: Metadata = { title: 'Privacidad · BE' };

/** Website `/account/privacy` — A3 y consentimientos a profesionales, bajo la ruta neutral de cuenta (DL-025). */
export default function PaginaDePrivacidad() {
  return (
    <>
      <Encabezado navegacion={<NavegacionDeCuenta />} />
      <main id="contenido" className="contenido">
        <h1>Privacidad</h1>
        <Privacidad />
      </main>
    </>
  );
}
