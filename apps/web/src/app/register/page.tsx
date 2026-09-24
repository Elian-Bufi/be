import type { Metadata } from 'next';
import { Encabezado } from '../../components/encabezado';
import { Pie } from '../../components/pie';
import { FormularioDeRegistro } from './formulario-de-registro';

export const metadata: Metadata = { title: 'Crear cuenta · BE' };

/** Website `/register` (10-B02:110-166). */
export default function Registro() {
  return (
    <div className="tema-oscuro">
      <Encabezado />
      <main id="contenido" className="contenido acceso">
        <h1>Crear cuenta</h1>
        <FormularioDeRegistro />
      </main>
      <Pie />
    </div>
  );
}
