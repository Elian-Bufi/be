import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { NavegacionDeCuenta } from '../../../../components/navegacion';
import { Consentimiento } from './consentimiento';

export const metadata: Metadata = { title: 'Consentimiento · BE' };

/** Website `/account/relationships/consent?id=…` — pantalla previa y acto B2 (CAND-10-CON-01/02). */
export default function PaginaDeConsentimiento() {
  return (
    <>
      <Encabezado />
      <main className="contenido">
        <NavegacionDeCuenta />
        <h1>Revisar consentimiento</h1>
        <Suspense fallback={null}>
          <Consentimiento />
        </Suspense>
      </main>
    </>
  );
}
