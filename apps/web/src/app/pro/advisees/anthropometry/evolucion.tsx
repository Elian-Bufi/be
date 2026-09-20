'use client';

/**
 * «Evolución» (B10-07; API-ANT-06; RF-049). Es la pantalla donde el legajo es más exigente, y por eso acá no hay
 * ningún gráfico de línea continua:
 * - un punto sin medición vigente se muestra como **«Sin dato»**, y no se completa con cero ni se une con el
 *   anterior (REG-06-166; INV-06-176/177);
 * - un tramo no comparable se señala con su motivo —otro protocolo, otro método u otra unidad— en vez de
 *   convertirse en silencio (REG-06-162/163/164);
 * - cada punto conserva su clase: medido, reportado o calculado (INV-06-178).
 *
 * La tabla es deliberada: es la forma honesta de mostrar una serie con huecos. Un gráfico de líneas tendría que
 * inventar el tramo que falta, y eso es justo lo que INV-06-177 prohíbe.
 */
import { COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, type EvolucionResponse } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia } from '../../../../lib/formato';
import { EstadoDeLectura, useAntropometria } from './antropometria';

type Datos = EvolucionResponse['data'];

export function VistaDeEvolucion() {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const [periodo, setPeriodo] = useState<{ desde: string; hasta: string }>({ desde: '', hasta: '' });
  const [r, setR] = useState<Resultado<{ data: Datos }> | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.evolucionAntropometrica(token, asesoradoId, {
      from: periodo.desde || undefined,
      to: periodo.hasta || undefined,
    });
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, asesoradoId, sesionPerdida, periodo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? <Evolucion datos={r.datos.data} periodo={periodo} onPeriodo={setPeriodo} /> : null}
    </EstadoDeLectura>
  );
}

function Evolucion({ datos, periodo, onPeriodo }: { datos: Datos; periodo: { desde: string; hasta: string }; onPeriodo: (p: { desde: string; hasta: string }) => void }) {
  return (
    <div className="secciones">
      <section className="seccion" aria-labelledby="titulo-periodo">
        <h2 id="titulo-periodo">{COPY_ANTROPOMETRIA.periodo}</h2>
        <div className="campos-en-linea">
          <Campo id="evo-desde" etiqueta="Desde" type="date" value={periodo.desde || datos.period.start} onChange={(e) => onPeriodo({ ...periodo, desde: e.target.value })} />
          <Campo id="evo-hasta" etiqueta="Hasta" type="date" value={periodo.hasta || datos.period.end} onChange={(e) => onPeriodo({ ...periodo, hasta: e.target.value })} />
        </div>
        <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeSinDato}</p>
      </section>

      {datos.series.length === 0 ? (
        <section className="seccion">
          <p>{COPY_ANTROPOMETRIA.sinMediciones}</p>
        </section>
      ) : null}

      {datos.series.map((serie) => {
        const disponibles = serie.points.filter((p) => p.availability === 'AVAILABLE');
        return (
          <section key={serie.metric} className="seccion" aria-labelledby={`titulo-${serie.metric}`}>
            <h2 id={`titulo-${serie.metric}`}>{serie.metric}</h2>
            {disponibles.length === 0 ? <p>{COPY_ANTROPOMETRIA.sinMediciones}</p> : null}
            <table className="tabla">
              <caption className="nota">
                {disponibles.length} con dato · {serie.missingData.length} {COPY_ANTROPOMETRIA.sinDato.toLowerCase()}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">{COPY_ANTROPOMETRIA.valor}</th>
                  <th scope="col">Cómo se obtuvo</th>
                  <th scope="col">Comparabilidad</th>
                </tr>
              </thead>
              <tbody>
                {serie.points
                  .filter((p) => p.availability === 'AVAILABLE' || serie.missingData.includes(p.date))
                  .map((p) =>
                    p.availability === 'NO_DATA' ? (
                      <tr key={p.date}>
                        <th scope="row">{dia(`${p.date}T12:00:00Z`)}</th>
                        <td>
                          <span className="insignia">{COPY_ANTROPOMETRIA.sinDato}</span>
                        </td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    ) : (
                      <tr key={p.date}>
                        <th scope="row">{dia(`${p.date}T12:00:00Z`)}</th>
                        <td>
                          {p.magnitude.value} {p.magnitude.unit}
                        </td>
                        <td>{ETIQUETA_DE_CLASE_DE_DATO[p.dataClass]}</td>
                        <td>
                          {p.incomparableWithPrevious.length === 0
                            ? '—'
                            : `${COPY_ANTROPOMETRIA.noComparable}: ${p.incomparableWithPrevious.map((m) => COPY_ANTROPOMETRIA.motivoNoComparable[m]).join(', ')}`}
                        </td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
            <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</p>
          </section>
        );
      })}
    </div>
  );
}
