import type { Metadata } from 'next';
import { Encabezado } from '../../components/encabezado';
import { FormularioDeRegistro } from './formulario-de-registro';

export const metadata: Metadata = { title: 'Crear cuenta · BE' };

/** Website `/register` (10-B02:110-166). */
export default function Registro() {
  return (
    <>
      <Encabezado />
      <main className="contenido">
        <h1>Crear cuenta</h1>
        <FormularioDeRegistro />
      </main>
    </>
  );
}
