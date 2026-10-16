import type { Metadata } from 'next';
import { Encabezado } from '../../components/encabezado';
import { Pie } from '../../components/pie';
import { AbrirInvitacion } from './abrir-invitacion';

export const metadata: Metadata = { title: 'Te invitaron a BE · BE', robots: { index: false, follow: false } };

/**
 * Website `/invitacion` (WP-INVITACION; DEUDA_LEGAJO DL-136): donde cae el enlace de una invitación si el teléfono no lo
 * abrió directo en la APK, o si se abrió en una computadora. El token viaja en el fragmento (`#t=`), que el navegador no
 * manda al servidor, y esta página no llama a la API: solo ofrece abrir la app, descargarla o escanear el QR.
 */
export default function Invitacion() {
  return (
    <div className="cara-publica">
      <Encabezado />
      <main id="contenido" className="contenido acceso">
        <AbrirInvitacion />
      </main>
      <Pie />
    </div>
  );
}
