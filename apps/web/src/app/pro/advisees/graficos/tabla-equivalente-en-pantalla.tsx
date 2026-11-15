'use client';

/**
 * «Ver la tabla» (WP-GRAFICOS fase 2, DL-174): la tabla equivalente de un gráfico, con su título, encabezados con
 * alcance y los tramos sin registros dichos como texto. Es la misma información que el dibujo (`tablaEquivalente`).
 */
import { useId, useState } from 'react';
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { textoDeLaMarca } from './eje-de-fechas';
import type { FilasDeLaTabla } from './tabla-equivalente';

export function TablaEquivalente({ titulo, tabla, abiertaDeEntrada = false }: { titulo: string; tabla: FilasDeLaTabla; abiertaDeEntrada?: boolean }) {
  const [abierta, setAbierta] = useState(abiertaDeEntrada);
  const id = useId();
  return (
    <div className="grafico-base__tabla">
      <button type="button" className="boton boton--enlace" aria-expanded={abierta} aria-controls={id} onClick={() => setAbierta((a) => !a)}>
        {abierta ? COPY_DE_LOS_GRAFICOS.ocultarLaTabla : COPY_DE_LOS_GRAFICOS.verLaTabla}
      </button>
      <div id={id} hidden={!abierta}>
        {abierta ? (
          <>
            <div className="grafico-base__tabla-desplazable">
              <table>
                <caption>{titulo}</caption>
                <thead>
                  <tr>
                    <th scope="col">{COPY_DE_LOS_GRAFICOS.fecha}</th>
                    {tabla.columnas.map((c) => (
                      <th key={c.id} scope="col">
                        {c.nombre} ({c.unidad})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabla.filas.map((f) => (
                    <tr key={f.fecha}>
                      <th scope="row">{textoDeLaMarca(f.fecha)}</th>
                      {f.celdas.map((c, i) => (
                        <td key={tabla.columnas[i].id} data-marca={c?.marca ?? undefined}>
                          {c ? c.texto : COPY_DE_LOS_GRAFICOS.sinDato}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tabla.sinRegistros.length > 0 ? (
              <ul className="grafico-base__sin-registros">
                {tabla.sinRegistros.map((t) => (
                  <li key={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
