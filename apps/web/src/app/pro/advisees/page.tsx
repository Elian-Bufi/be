import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Encabezado } from '../../../components/encabezado';
import { NavegacionProfesional } from '../../../components/navegacion';
import { Workspace } from './workspace';

export const metadata: Metadata = { title: 'Asesorado · BE' };

/** Website `/pro/advisees?id=…` — el export estático no prerenderiza `/pro/advisees/:adviseeId` (DL-041). */
export default function PaginaDelAsesorado() {
  return (
    <>
      <Encabezado />
      <main className="contenido">
        <NavegacionProfesional />
        <h1>Workspace del asesorado</h1>
        <Suspense fallback={null}>
          <Workspace />
        </Suspense>
      </main>
    </>
  );
}
