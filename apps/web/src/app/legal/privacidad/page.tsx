import { VERSION_VIGENTE } from '@be/domain';
import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { Pie } from '../../../components/pie';
import { TextoVersionado } from '../../../components/texto-versionado';

export const metadata: Metadata = { title: 'Información de privacidad · BE' };

/** A2 — versión vigente de la información de privacidad (texto sintético, DEUDA_LEGAJO DL-028). */
export default function Privacidad() {
  return (
    <div className="tema-oscuro">
      <Encabezado />
      <main id="contenido" className="contenido">
        <TextoVersionado version={VERSION_VIGENTE.PRIVACIDAD_INFO} />
      </main>
      <Pie />
    </div>
  );
}
