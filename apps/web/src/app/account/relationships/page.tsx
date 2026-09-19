import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { NavegacionDeCuenta } from '../../../components/navegacion';
import { Vinculos } from './vinculos';

export const metadata: Metadata = { title: 'Vínculos · BE' };

/** Website `/account/relationships` — vínculos del asesorado, bajo la ruta neutral de cuenta (DL-025). */
export default function PaginaDeVinculos() {
  return (
    <>
      <Encabezado />
      <main className="contenido">
        <NavegacionDeCuenta />
        <h1>Vínculos</h1>
        <Vinculos />
      </main>
    </>
  );
}
