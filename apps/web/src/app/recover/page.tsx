import type { Metadata } from 'next';
import { COPY_RECUPERACION } from '@be/domain';
import { Encabezado } from '../../components/encabezado';
import { Pie } from '../../components/pie';
import { FormularioDeRecuperacion } from './formulario-de-recuperacion';

export const metadata: Metadata = { title: 'Recuperar el acceso · BE' };

/** Website `/recover` (UF-03 de WP-USO-FINAL, DL-169; 04 RF-005): «¿Olvidaste tu contraseña?». */
export default function RecuperarElAcceso() {
  return (
    <div className="cara-publica">
      <Encabezado />
      <main id="contenido" className="contenido acceso">
        <h1>{COPY_RECUPERACION.titulo}</h1>
        <FormularioDeRecuperacion />
      </main>
      <Pie />
    </div>
  );
}
