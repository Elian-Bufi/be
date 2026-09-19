import { VERSION_VIGENTE } from '@be/domain';
import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { TextoVersionado } from '../../../components/texto-versionado';

export const metadata: Metadata = { title: 'Términos de uso · BE' };

/** A1 — versión vigente de los términos (texto sintético, DEUDA_LEGAJO DL-028). */
export default function Terminos() {
  return (
    <>
      <Encabezado />
      <main className="contenido">
        <TextoVersionado version={VERSION_VIGENTE.TERMINOS} />
      </main>
    </>
  );
}
