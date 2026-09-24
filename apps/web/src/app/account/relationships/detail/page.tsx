import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../../components/encabezado';
import { NavegacionDeCuenta } from '../../../../components/navegacion';
import { DetalleDeVinculo } from './detalle';

export const metadata: Metadata = { title: 'Vínculo · BE' };

/** Website `/account/relationships/detail?id=…` — el export estático no admite segmentos dinámicos (DL-041). */
export default function PaginaDeDetalleDeVinculo() {
  return (
    <>
      <Encabezado navegacion={<NavegacionDeCuenta />} />
      <main id="contenido" className="contenido">
        <h1>Vínculo</h1>
        <Suspense fallback={null}>
          <DetalleDeVinculo />
        </Suspense>
      </main>
    </>
  );
}
