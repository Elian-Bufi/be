'use client';

/**
 * «Evolución» (B10-07; API-ANT-06; RF-049): el período, la métrica y, por métrica, el gráfico de puntos con su detalle y
 * su tabla (`grafico-de-evolucion.tsx`). Es la pantalla donde el legajo es más exigente:
 * - un tramo sin medición vigente llega como **hueco**, con su rango y su cantidad de días, y no se completa con cero
 *   ni se une con el punto anterior (REG-06-165/166; INV-06-176/177);
 * - un tramo no comparable se señala con su motivo —otro protocolo, otro método u otra unidad— en vez de convertirse en
 *   silencio (REG-06-162/163/164), y cada grupo tiene su propio eje;
 * - cada punto conserva su clase —medido, reportado o calculado— y dice si su valor vigente viene de una corrección
 *   (INV-06-178; REG-06-16).
 *
 * Si el asesorado tiene evaluaciones de otro profesional en el período, la respuesta llega con `partialView` y la
 * pantalla lo dice: la serie está bien construida con lo que este profesional puede ver, y no es toda la historia
 * (09v11:786-796).
 *
 * La métrica elegida vive fuera del estado de lectura: al cambiar el período, si sigue en la respuesta se conserva; si
 * no, se pasa a la primera y se dice (`metricaVigente`). Los gráficos se cargan recién cuando hay una métrica.
 */
import { compararPorCatalogo, COPY_ANTROPOMETRIA, COPY_EVOLUCION, metricaVigente, nombreDeMetrica, type EvolucionResponse } from '@be/domain';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { FiltroDePeriodo, type Periodo } from '../periodo';
import { EstadoDeLectura, useAntropometria } from './antropometria';

type Datos = EvolucionResponse['data'];

// Recharts se carga solo cuando hay algo que graficar: la pestaña no paga su peso de entrada.
const EvolucionDeMetrica = dynamic(() => import('./grafico-de-evolucion').then((m) => m.EvolucionDeMetrica), { ssr: false, loading: () => <Cargando /> });

export function VistaDeEvolucion() {
  const { token, asesoradoId, sesionPerdida, irA } = useAntropometria();
  const [periodo, setPeriodo] = useState<Periodo>({});
  const [r, setR] = useState<Resultado<{ data: Datos }> | null>(null);
  const [metricaPedida, setMetricaPedida] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.evolucionAntropometrica(token, asesoradoId, periodo);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, asesoradoId, sesionPerdida, periodo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="secciones">
      <section className="seccion" aria-labelledby="titulo-periodo">
        <h2 id="titulo-periodo">{COPY_ANTROPOMETRIA.periodo}</h2>
        {/*
          El período se elige con la misma validación previa que los otros dos dominios (B10-06 §41, §43-§44; DL-091
          punto 2), y vive fuera del estado de lectura: si el período no se puede leer, el formulario sigue ahí para
          corregirlo en vez de quedar atrapado en «Reintentar» (B10-10:376).
        */}
        <FiltroDePeriodo id="ant-evolucion-periodo" onAplicar={setPeriodo} />
      </section>
      <EstadoDeLectura r={r} onReintentar={cargar}>
        {r?.ok ? <Evolucion datos={r.datos.data} metricaPedida={metricaPedida} onMetrica={setMetricaPedida} onAbrirEvaluacion={(evaluationId) => irA('evaluaciones', evaluationId)} /> : null}
      </EstadoDeLectura>
    </div>
  );
}

function Evolucion({ datos, metricaPedida, onMetrica, onAbrirEvaluacion }: { datos: Datos; metricaPedida: string | null; onMetrica: (m: string) => void; onAbrirEvaluacion: (evaluationId: string) => void }) {
  const metrica = metricaVigente(datos.metrics, metricaPedida);
  const serie = datos.metrics.find((m) => m.metricCode === metrica) ?? null;
  const cambio = metricaPedida !== null && metrica !== metricaPedida;
  return (
    <div className="secciones">
      <section className="seccion">
        <p className="nota">
          Período: {diaCivil(datos.period.start)} a {diaCivil(datos.period.end)}
        </p>
        {datos.partialView ? (
          <Aviso tipo="info">
            <p>{COPY_ANTROPOMETRIA.vistaParcial}</p>
          </Aviso>
        ) : null}
        {datos.metrics.length === 0 ? (
          <p>{COPY_ANTROPOMETRIA.sinMediciones}</p>
        ) : (
          <div className="campo grafico__controles">
            <label htmlFor="ant-evolucion-metrica">{COPY_EVOLUCION.metrica}</label>
            <select id="ant-evolucion-metrica" value={metrica ?? ''} onChange={(e) => onMetrica(e.target.value)}>
              {[...datos.metrics]
                .sort((a, b) => compararPorCatalogo(a.metricCode, b.metricCode))
                .map((m) => (
                  <option key={m.metricCode} value={m.metricCode}>
                    {nombreDeMetrica(m.metricCode)} ({m.series.length})
                  </option>
                ))}
            </select>
          </div>
        )}
        {cambio ? <p className="nota">{COPY_EVOLUCION.metricaCambio}</p> : null}
      </section>
      {serie ? <EvolucionDeMetrica key={`${serie.metricCode}|${datos.period.start}|${datos.period.end}`} serie={serie} zonaHoraria={datos.period.timeZone} periodo={datos.period} onAbrirEvaluacion={onAbrirEvaluacion} /> : null}
    </div>
  );
}
