import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../components/encabezado';
import { Pie } from '../../components/pie';
import { FormularioDeLogin } from './formulario-de-login';

export const metadata: Metadata = { title: 'Iniciar sesión · BE' };

/** Website `/login` (10-B02:198-246). */
export default function Login() {
  return (
    <div className="tema-oscuro">
      <Encabezado />
      <main id="contenido" className="contenido acceso">
        <h1>Iniciar sesión</h1>
        <Suspense fallback={null}>
          <FormularioDeLogin />
        </Suspense>
      </main>
      <Pie />
    </div>
  );
}
