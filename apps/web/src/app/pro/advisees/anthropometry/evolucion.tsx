'use client';

/**
 * «Evolución» (B10-07; API-ANT-06; RF-049). Es la pantalla donde el legajo es más exigente, y por eso acá no hay
 * ningún gráfico de línea continua:
 * - un tramo sin medición vigente llega como **hueco**, con su rango y su cantidad de días, y no se completa con cero
 *   ni se une con el punto anterior (REG-06-165/166; INV-06-176/177);
 * - un tramo no comparable se señala con su motivo —otro protocolo, otro método u otra unidad— en vez de
 *   convertirse en silencio (REG-06-162/163/164);
 * - cada punto conserva su clase —medido, reportado o calculado— y dice si su valor vigente viene de una corrección
 *   (INV-06-178; REG-06-16).
 *
 * La tabla es deliberada: es la forma honesta de mostrar una serie con huecos. Un gráfico de líneas tendría que
 * inventar el tramo que falta, y eso es justo lo que INV-06-177 prohíbe.
 *
 * Si el asesorado tiene evaluaciones de otro profesional en el período, la respuesta llega con `partialView` y la
 * pantalla lo dice: la serie está bien construida con lo que este profesional puede ver, y no es toda la historia
 * (09v11:786-796).
 */
import { COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, type EvolucionResponse, type SerieApi } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { EstadoDeLectura, useAntropometria } from './antropometria';

type Datos = EvolucionResponse['data'];

export function VistaDeEvolucion() {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const [periodo, setPeriodo] = useState<{ desde: string; hasta: string }>({ desde: '', hasta: '' });
  const [r, setR] = useState<Resultado<{ data: Datos }> | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.evolucionAntropometrica(token, asesoradoId, {
      periodStart: periodo.desde || undefined,
      periodEnd: periodo.hasta || undefined,
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
        {datos.partialView ? (
          <Aviso tipo="info">
            <p>{COPY_ANTROPOMETRIA.vistaParcial}</p>
          </Aviso>
        ) : null}
      </section>

      {datos.metrics.length === 0 ? (
        <section className="seccion">
          <p>{COPY_ANTROPOMETRIA.sinMediciones}</p>
        </section>
      ) : null}

      {datos.metrics.map((serie) => (
        <SerieDeLaMetrica key={serie.metricCode} serie={serie} />
      ))}
    </div>
  );
}

function SerieDeLaMetrica({ serie }: { serie: SerieApi }) {
  const diasSinDato = serie.gaps.reduce((n, g) => n + g.days, 0);
  /** Puntos y huecos, ordenados por fecha. Los huecos ya vienen agrupados en rangos desde la API. */
  const filas = [
    ...serie.series.map((punto) => ({ orden: punto.occurredAt.slice(0, 10), tipo: 'punto' as const, punto })),
    ...serie.gaps.map((hueco) => ({ orden: hueco.from, tipo: 'hueco' as const, hueco })),
  ].sort((a, b) => a.orden.localeCompare(b.orden));

  return (
    <section className="seccion" aria-labelledby={`titulo-${serie.metricCode}`}>
      <h2 id={`titulo-${serie.metricCode}`}>{serie.metricCode}</h2>
      {serie.series.length === 0 ? <p>{COPY_ANTROPOMETRIA.sinMediciones}</p> : null}
      <table className="tabla">
        <caption className="nota">
          {serie.series.length} con dato · {diasSinDato} {COPY_ANTROPOMETRIA.sinDato.toLowerCase()}
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
          {filas.map((f) =>
            f.tipo === 'hueco' ? (
              <tr key={`hueco-${f.hueco.from}`}>
                <th scope="row">{f.hueco.days === 1 ? dia(`${f.hueco.from}T12:00:00Z`) : `${dia(`${f.hueco.from}T12:00:00Z`)} — ${dia(`${f.hueco.to}T12:00:00Z`)}`}</th>
                <td>
                  <span className="insignia">{f.hueco.days === 1 ? COPY_ANTROPOMETRIA.sinDato : `${f.hueco.days} días ${COPY_ANTROPOMETRIA.sinDato.toLowerCase()}`}</span>
                </td>
                <td>—</td>
                <td>—</td>
              </tr>
            ) : (
              <tr key={f.punto.sourceId}>
                <th scope="row">{fecha(f.punto.occurredAt)}</th>
                <td>
                  {f.punto.value} {f.punto.unit}
                  {f.punto.correctionState === 'CORRECTED' ? (
                    <>
                      {' '}
                      <span className="insignia">{COPY_ANTROPOMETRIA.corregida}</span>
                    </>
                  ) : null}
                </td>
                <td>{ETIQUETA_DE_CLASE_DE_DATO[f.punto.dataClass]}</td>
                <td>
                  {f.punto.incomparableWithPrevious.length === 0
                    ? COPY_ANTROPOMETRIA.comparableConElAnterior
                    : `${COPY_ANTROPOMETRIA.noComparable}: ${f.punto.incomparableWithPrevious.map((m) => COPY_ANTROPOMETRIA.motivoNoComparable[m]).join(', ')}`}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</p>
    </section>
  );
}
