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
 *
 * Pasada de estética del 2026-10-15 (crítica de diseño): el período se elige con el control de las otras secciones (el de
 * Registros: atajos de 7, 30 y 90 días o un rango propio, hasta 92, lo mismo que admite la API) y vive en la dirección;
 * antes era un formulario con dos fechas vacías aunque ya hubiera un período aplicado. El encabezado es el de las demás
 * secciones: el título, una frase y el período a la derecha. Si la lectura falla, el control sigue ahí para cambiarlo
 * (B10-10:376).
 */
import { COPY_ANTROPOMETRIA, COPY_EVOLUCION, compararPorCatalogo, metricaVigente, nombreDeMetrica, type EvolucionResponse } from '@be/domain';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { ControlDePeriodo } from '../control-de-periodo';
import { ATAJOS_DE_UN_AREA, cambiosDePeriodo, MAXIMO_DE_DIAS_DE_UN_AREA, periodoALaVista, periodoPedidoEnUnArea, type PeriodoDeUnArea } from '../periodo-de-un-area';
import { hoyEn } from '../seguimiento/estado';
import { EstadoDeLectura, useAntropometria } from './antropometria';

type Datos = EvolucionResponse['data'];

// Recharts se carga solo cuando hay algo que graficar: la pestaña no paga su peso de entrada.
const EvolucionDeMetrica = dynamic(() => import('./grafico-de-evolucion').then((m) => m.EvolucionDeMetrica), { ssr: false, loading: () => <Cargando /> });

/** Sin un período pedido ni una respuesta, el control dice el de siempre: los últimos 90 días, como la API. */
const DIAS_POR_OMISION = 90;
const restarDias = (dia: string, n: number): string => new Date(Date.parse(`${dia}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

export function VistaDeEvolucion() {
  const { token, asesoradoId, sesionPerdida, irA, parametros, ir } = useAntropometria();
  const hoy = hoyEn();
  const claveDelPeriodo = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pedido = useMemo(() => periodoPedidoEnUnArea(parametros, hoy), [claveDelPeriodo, hoy]);
  const [r, setR] = useState<Resultado<{ data: Datos }> | null>(null);
  const [metricaPedida, setMetricaPedida] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.evolucionAntropometrica(token, asesoradoId, pedido ? { periodStart: pedido.desde, periodEnd: pedido.hasta } : {});
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, asesoradoId, sesionPerdida, pedido]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const datos = r?.ok ? r.datos.data : null;
  // El control dice el período que se está viendo: el pedido, el que respondió la API o, si todavía no hay respuesta,
  // el de siempre. Así nunca desaparece (si la lectura falla, sigue ahí para cambiarlo).
  const periodo =
    periodoALaVista(pedido, datos ? { start: datos.period.start, end: datos.period.end } : null, hoy) ??
    ({ preset: DIAS_POR_OMISION, desde: restarDias(hoy, DIAS_POR_OMISION - 1), hasta: hoy } as PeriodoDeUnArea);
  const elegirPeriodo = (p: PeriodoDeUnArea) => ir(cambiosDePeriodo(p));

  return (
    <section className="evolucion" aria-labelledby="titulo-evolucion">
      <div className="evolucion__encabezado">
        <h2 id="titulo-evolucion">{COPY_ANTROPOMETRIA.evolucion}</h2>
        <p className="nota evolucion__bajada">Cada medición en el tiempo, de a una métrica. Ubica cada valor: no califica ninguno.</p>
        <ControlDePeriodo periodo={periodo} atajos={ATAJOS_DE_UN_AREA} maximoDeDias={MAXIMO_DE_DIAS_DE_UN_AREA} onElegir={elegirPeriodo} />
      </div>
      <EstadoDeLectura r={r} onReintentar={cargar}>
        {datos ? <Evolucion datos={datos} metricaPedida={metricaPedida} onMetrica={setMetricaPedida} onAbrirEvaluacion={(evaluationId) => irA('evaluaciones', evaluationId)} /> : null}
      </EstadoDeLectura>
    </section>
  );
}

function Evolucion({ datos, metricaPedida, onMetrica, onAbrirEvaluacion }: { datos: Datos; metricaPedida: string | null; onMetrica: (m: string) => void; onAbrirEvaluacion: (evaluationId: string) => void }) {
  const metrica = metricaVigente(datos.metrics, metricaPedida);
  const serie = datos.metrics.find((m) => m.metricCode === metrica) ?? null;
  const cambio = metricaPedida !== null && metrica !== metricaPedida;
  return (
    <div className="evolucion__cuerpo">
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
      {serie ? <EvolucionDeMetrica key={`${serie.metricCode}|${datos.period.start}|${datos.period.end}`} serie={serie} zonaHoraria={datos.period.timeZone} periodo={datos.period} onAbrirEvaluacion={onAbrirEvaluacion} /> : null}
    </div>
  );
}
