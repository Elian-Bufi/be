import { VERSION_VIGENTE } from '@be/domain';
import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { TextoVersionado } from '../../../components/texto-versionado';

export const metadata: Metadata = { title: 'Información de privacidad · BE' };

/** A2 — versión vigente de la información de privacidad (texto sintético, DEUDA_LEGAJO DL-028). */
export default function Privacidad() {
  return (
    <>
      <Encabezado />
      <main className="contenido">
        <TextoVersionado version={VERSION_VIGENTE.PRIVACIDAD_INFO} />
      </main>
    </>
  );
}
