import { COPY_FUENTES_DEL_CATALOGO as F } from '@be/domain';
import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { Pie } from '../../../components/pie';

export const metadata: Metadata = { title: 'Fuentes del catálogo · BE' };

/**
 * Website `/legal/fuentes` (DL-141 D-6): las atribuciones que piden las licencias de los catálogos base, en la cara
 * pública, junto a los textos legales. No lee datos ni pide sesión. La autoría de cada ejercicio de wger está en
 * `docs/catalogo/FUENTES.md` del repositorio público, que genera `scripts/catalogo-base/generar-migracion.mjs`: un
 * enlace a un recurso con esos datos es una forma razonable de atribuir (CC BY-SA 4.0, §3(a)(2)).
 */
export default function FuentesDelCatalogo() {
  return (
    <div className="cara-publica">
      <Encabezado />
      <main id="contenido" className="contenido fuentes-del-catalogo">
        <h1>{F.titulo}</h1>
        <p>{F.bajada}</p>

        <section aria-labelledby="fuentes-alimentos">
          <h2 id="fuentes-alimentos">{F.alimentos.titulo}</h2>
          <p>{F.alimentos.texto}</p>
          <p className="nota">{F.alimentos.cita}</p>
          <ul>
            <li>
              <a href="https://fdc.nal.usda.gov/" rel="noopener noreferrer">
                FoodData Central (fdc.nal.usda.gov)
              </a>
            </li>
            <li>
              <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.es" rel="noopener noreferrer">
                CC0 1.0 Universal (dominio público)
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="fuentes-ejercicios">
          <h2 id="fuentes-ejercicios">{F.ejercicios.titulo}</h2>
          <p>{F.ejercicios.texto}</p>
          <ul>
            <li>
              <a href="https://github.com/Elian-Bufi/be/blob/main/docs/catalogo/FUENTES.md" rel="noopener noreferrer">
                {F.ejercicios.lista}
              </a>
            </li>
            <li>
              <a href="https://wger.de/" rel="noopener noreferrer">
                wger (wger.de)
              </a>
            </li>
            <li>
              <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" rel="noopener noreferrer">
                CC BY-SA 4.0
              </a>{' '}
              ·{' '}
              <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.es" rel="noopener noreferrer">
                CC BY-SA 3.0
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="fuentes-importados">
          <h2 id="fuentes-importados">{F.importados.titulo}</h2>
          <p>{F.importados.texto}</p>
          <ul>
            <li>
              <a href="https://world.openfoodfacts.org/" rel="noopener noreferrer">
                Open Food Facts (openfoodfacts.org)
              </a>
            </li>
            <li>
              <a href="https://opendatacommons.org/licenses/odbl/1-0/" rel="noopener noreferrer">
                Open Database License (ODbL) 1.0
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="fuentes-demostracion">
          <h2 id="fuentes-demostracion">{F.demostracion.titulo}</h2>
          <p>{F.demostracion.texto}</p>
        </section>
      </main>
      <Pie />
    </div>
  );
}
