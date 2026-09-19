import type { Metadata } from 'next';
import { Encabezado } from '../../components/encabezado';
import { NavegacionDeCuenta } from '../../components/navegacion';
import { Cuenta } from './cuenta';

export const metadata: Metadata = { title: 'Cuenta · BE' };

/** Website `/account` — ruta neutral de identidad y sesión (DEUDA_LEGAJO DL-025, opción A). */
export default function PaginaDeCuenta() {
  return (
    <>
      <Encabezado />
      <main className="contenido">
        <NavegacionDeCuenta />
        <h1>Cuenta</h1>
        <Cuenta />
      </main>
    </>
  );
}
