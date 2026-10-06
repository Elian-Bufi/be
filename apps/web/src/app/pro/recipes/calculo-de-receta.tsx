'use client';

/**
 * El cálculo de una receta (DL-119; `SUM_SOURCE_PER_100G_V1`): la receta completa y una porción, por nutriente.
 * - El número es el exacto de la API redondeado solo para mostrar (`nutrienteParaMostrar`).
 * - Lo desconocido dice «Sin dato» y nombra qué ingrediente lo impide y por qué: nunca se muestra como cero.
 */
import { COPY_RECETAS, ETIQUETA_DE_FALTANTE, ETIQUETA_DE_NUTRIENTE, NUTRIENTES_CALCULADOS, UNIDAD_DE_NUTRIENTE, nutrienteParaMostrar, type CalculoDeReceta } from '@be/domain';

/** `nombres`: el nombre de cada ingrediente por su clave en el cálculo, el número de orden («1», «2», …). */
export function TablaDeCalculo({ calculo, nombres }: { calculo: CalculoDeReceta; nombres: Readonly<Record<string, string>> }) {
  const faltantes = new Map<string, string>();
  for (const n of NUTRIENTES_CALCULADOS) {
    for (const f of calculo.total[n].missing) {
      const texto = `${nombres[f.key] ?? `Ingrediente ${f.key}`}: ${ETIQUETA_DE_FALTANTE[f.reason]}`;
      faltantes.set(texto, [faltantes.get(texto), ETIQUETA_DE_NUTRIENTE[n].toLowerCase()].filter(Boolean).join(', '));
    }
  }
  const valor = (v: CalculoDeReceta['total'][keyof CalculoDeReceta['total']], n: (typeof NUTRIENTES_CALCULADOS)[number]) => {
    const texto = nutrienteParaMostrar(v, n);
    return texto === null ? <span className="nota">{COPY_RECETAS.sinDato}</span> : `${texto} ${UNIDAD_DE_NUTRIENTE[n]}`;
  };
  return (
    <>
      <table className="tabla tabla--calculo">
        <caption className="nota">{COPY_RECETAS.calculo}</caption>
        <thead>
          <tr>
            <th scope="col">{COPY_RECETAS.nutriente}</th>
            <th scope="col">{COPY_RECETAS.recetaCompleta}</th>
            <th scope="col">{COPY_RECETAS.porPorcion}</th>
          </tr>
        </thead>
        <tbody>
          {NUTRIENTES_CALCULADOS.map((n) => (
            <tr key={n}>
              <th scope="row">{ETIQUETA_DE_NUTRIENTE[n]}</th>
              <td data-etiqueta={COPY_RECETAS.recetaCompleta}>{valor(calculo.total[n], n)}</td>
              <td data-etiqueta={COPY_RECETAS.porPorcion}>{valor(calculo.perServing[n], n)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {faltantes.size > 0 ? (
        <div className="aviso aviso--info" role="status">
          <p className="aviso__titulo">{COPY_RECETAS.faltanDatos}</p>
          <ul>
            {[...faltantes].map(([texto, nutrientes]) => (
              <li key={texto}>
                {texto} ({nutrientes})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="nota">{COPY_RECETAS.metodo}</p>
    </>
  );
}
