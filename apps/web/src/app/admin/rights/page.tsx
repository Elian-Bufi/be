import type { Metadata } from 'next';
import { PuertaAdministrativa } from '../puerta';
import { PedidosDeDerechos } from './pedidos';

export const metadata: Metadata = { title: 'Pedidos de derechos · Administración · BE' };

/** Website `/admin/rights` (UF-06 de WP-USO-FINAL, DL-169): los pedidos de acceso, rectificación y supresión. */
export default function PaginaDePedidosDeDerechos() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>Pedidos de derechos</h1>
        <p className="bajada">Acceso, rectificación y supresión de las personas, con su plazo. Los plazos de la Ley 25.326 están a confirmar con la asesoría jurídica.</p>
        <PedidosDeDerechos />
      </PuertaAdministrativa>
    </main>
  );
}
