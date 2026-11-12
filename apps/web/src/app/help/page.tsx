import type { Metadata } from 'next';
import { COPY_AYUDA } from '@be/domain';
import { CanalDeContacto } from '../../components/canal-de-contacto';
import { Encabezado } from '../../components/encabezado';
import { Pie } from '../../components/pie';

export const metadata: Metadata = { title: 'Ayuda y contacto · BE' };

/**
 * Website `/help` (UF-07 de WP-USO-FINAL, DL-169): el canal de ayuda y contacto, a un toque desde el pie de cada página
 * pública. Las direcciones llegan de la API; los casos comunes dicen qué conviene escribir.
 */
export default function AyudaYContacto() {
  return (
    <div className="cara-publica">
      <Encabezado />
      <main id="contenido" className="contenido acceso">
        <h1>{COPY_AYUDA.titulo}</h1>
        <p className="bajada">{COPY_AYUDA.queEs}</p>
        <CanalDeContacto />
        <h2>Lo más común</h2>
        <ul className="lista-simple">
          {COPY_AYUDA.casos.map((c) => (
            <li key={c.titulo}>
              <p>
                <strong>{c.titulo}</strong>
              </p>
              <p>{c.texto}</p>
            </li>
          ))}
        </ul>
      </main>
      <Pie />
    </div>
  );
}
