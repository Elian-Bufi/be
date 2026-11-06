'use client';

/**
 * El gráfico chico de la ficha (WP-ESCRITORIO-AMABLE): los mismos puntos, los mismos cortes y el mismo gris de los días
 * sin registros que el gráfico de «Analizar», en chico y sin interacción. Lo usan los indicadores del Resumen (parte 3)
 * y la comparación de dos etapas (C-12), que le suma las dos etapas como bandas con su letra, las fechas al pie y, en
 * las calorías, el objetivo. Es un dibujo propio, sin la biblioteca de gráficos: el Resumen se carga con la ficha y esa
 * biblioteca pesa más que todo lo demás junto.
 *
 * No recibe el foco ni tiene nada para tocar: el valor, la regla y la cobertura están escritos al lado, y «Analizar»
 * abre el gráfico grande. Para el lector de pantalla es una imagen con su descripción (el resumen en texto del dominio).
 * En el Resumen va en un solo color, porque cada tarjeta dice su métrica; en la comparación de etapas, con el color de
 * cada métrica, el mismo que tiene en los gráficos grandes.
 */
import type { SerieAnalitica } from '@be/domain';
import { useEffect, useMemo, useState } from 'react';
import { diaYMesCivil } from '../../../../lib/formato';
import { diasSinRegistros, FRANJA_DE_ROTULOS, geometriaDelIndicador, geometriaDelMinigrafico, LETRA_MINIMA, LUGAR_PARA_MARCAR_CADA_DIA, RANGO_MINIMO_POR_UNIDAD } from './geometria';
import { ESTILOS, Punto } from './marca';

const ALTO = 60;
/** La letra más chica de un gráfico (el criterio de diseño pide 12,5 px como mínimo). */
const LETRA = LETRA_MINIMA;

export function Minigrafico({
  serie,
  desde,
  hasta,
  hoy,
  inicioDelPlan,
  descripcion,
  alto = ALTO,
  indice = 0,
  bandas,
  fechas,
  plan,
  ejeFino = false,
}: {
  /** Las observaciones de la métrica en el período (el día, la sesión o la toma). */
  serie: SerieAnalitica;
  desde: string;
  hasta: string;
  hoy: string;
  /** El día desde el que rige el primer plan del período, si empezó adentro: se marca con una línea punteada. */
  inicioDelPlan: string | null;
  descripcion: string;
  alto?: number;
  /** El lugar de la métrica entre las elegidas: de ahí sale su color. */
  indice?: number;
  /** Las etapas que se comparan, con su letra. */
  bandas?: readonly { readonly desde: string; readonly hasta: string; readonly rotulo: string }[];
  /** Las fechas del pie. */
  fechas?: readonly string[];
  /** Lo planificado en la misma unidad (el objetivo de calorías): línea discontinua, sin puntos. */
  plan?: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
  /** Un eje más ajustado a los datos: para un gráfico con alto de sobra (el de la comparación de etapas). */
  ejeFino?: boolean;
}) {
  const [caja, setCaja] = useState<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!caja) return;
    setAncho(caja.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(() => setAncho(caja.clientWidth));
    observador.observe(caja);
    return () => observador.disconnect();
  }, [caja]);
  const sombreados = useMemo(() => (serie.grain === 'DAY' ? diasSinRegistros(serie.gaps, hoy) : []), [serie, hoy]);
  const g = useMemo(
    () => geometriaDelMinigrafico({ puntos: serie.points, sinRegistros: sombreados, desde, hasta, ancho, alto, inicioDelPlan, bandas, fechas, plan, divisionesDelEje: ejeFino ? 4 : 2 }),
    [serie, sombreados, desde, hasta, ancho, alto, inicioDelPlan, bandas, fechas, plan, ejeFino],
  );
  const color = (ESTILOS[indice] ?? ESTILOS[0]).color;
  return (
    <div ref={setCaja} className="minigrafico" role="img" aria-label={descripcion} style={{ height: alto }}>
      {ancho > 0 && g.puntos.length > 0 ? (
        <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" focusable="false">
          {/* Las etapas (TB-03): su letra arriba, una franja de --banda debajo de la letra y, entre dos, la vertical fina y
              punteada del cambio, que es la que lleva la vigencia. Ya no son columnas de todo el alto. */}
          {g.bandas.map((b, i) => (
            <g key={`banda-${b.rotulo}`} className="minigrafico__banda" data-rotulo={b.rotulo}>
              <rect x={b.x} y={FRANJA_DE_ROTULOS - 2} width={b.ancho} height={4} fill="var(--banda)" />
              {i > 0 ? <line x1={b.x} x2={b.x} y1={2} y2={g.caja.abajo + 6} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="1 3" /> : null}
              {/* La letra va en una franja propia, arriba: ningún punto se dibuja ahí. */}
              <text x={b.x + 6} y={2 + FRANJA_DE_ROTULOS / 2} dominantBaseline="central" fill="var(--texto)" fontSize={LETRA} fontWeight={600}>
                {b.rotulo}
              </text>
            </g>
          ))}
          {/* Los días sin registros: el mismo gris leve de «Analizar», debajo de todo lo demás. */}
          {g.sinRegistros.map((h) => (
            <rect key={`sin-${h.x}`} className="minigrafico__sin-registros" x={h.x} y={2} width={h.ancho} height={g.caja.abajo + 6 - 2} fill="var(--grafico-hueco)" fillOpacity={0.2} />
          ))}
          {g.eje.map((m) => (
            <g key={m.valor} className="minigrafico__marca">
              {/* La grilla, solo horizontal y alineada al medio píxel (TB-03). */}
              <line x1={g.caja.izquierda} x2={g.caja.derecha} y1={Math.round(m.y) + 0.5} y2={Math.round(m.y) + 0.5} stroke="var(--borde)" strokeWidth={1} />
              <text x={g.caja.izquierda - 6} y={m.y} textAnchor="end" dominantBaseline="central" fill="var(--tenue)" fontSize={LETRA}>
                {m.texto}
              </text>
            </g>
          ))}
          {g.inicioDelPlan !== null ? <line className="minigrafico__plan" x1={g.inicioDelPlan} x2={g.inicioDelPlan} y1={2} y2={alto - 2} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="1 3" /> : null}
          {/* Lo planificado: un tramo horizontal por escalón, discontinuo y sin puntos, como en el gráfico grande. */}
          {g.plan.map((s) => (
            <line key={`objetivo-${s.x1}`} className="minigrafico__objetivo" x1={s.x1} x2={s.x2} y1={s.y} y2={s.y} stroke={color} strokeWidth={1.25} strokeDasharray="3 2" />
          ))}
          {g.tramos.map((d) => (
            <path key={d} className="minigrafico__tramo" d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {g.puntos.map((p) => (
            <g key={p.clave} className="minigrafico__punto" data-hueco={p.hueco ? 'si' : undefined} data-clase={p.clase ?? undefined}>
              <Punto cx={p.x} cy={p.y} color={color} medida={p.medida} />
            </g>
          ))}
          {g.fechas.map((f) => (
            <text key={f.fecha} className="minigrafico__fecha" x={f.x} y={alto - 6} textAnchor={f.ancla} fill="var(--tenue)" fontSize={LETRA}>
              {diaYMesCivil(f.fecha)}
            </text>
          ))}
        </svg>
      ) : null}
    </div>
  );
}

// ─── El minigráfico de un indicador del Resumen (WP-TABLERO-ALTA-GAMA, TB-04; DL-163 D-5) ───────

/** La franja de arriba, reservada siempre para que los minigráficos de una fila queden alineados. */
const FRANJA_DE_ARRIBA = 14;
/** La tira: 6 de alto, 6 por debajo del lienzo; la raya de hoy, 2 por debajo de la tira. */
const SEPARACION_DE_LA_TIRA = 6;
const ALTO_DE_LA_TIRA = 6;
const ZONA_DE_LA_TIRA = SEPARACION_DE_LA_TIRA + ALTO_DE_LA_TIRA + 4;
const ALTO_DE_LAS_FECHAS = 16;

/** El alto total del minigráfico del indicador, con su franja de arriba, la tira y las fechas. */
export const altoDelIndicador = (lienzo: number): number => FRANJA_DE_ARRIBA + lienzo + ZONA_DE_LA_TIRA + ALTO_DE_LAS_FECHAS;

/**
 * El minigráfico de un indicador del Resumen: más alto, sin canal de eje y con la tira de cobertura, que lleva el estado
 * de cada día (D-5). Con poco lugar por día, la línea de una serie diaria es la media de cada semana de BE y los días van
 * como puntos claros; en sesiones o tomas, la línea une las observaciones y llevan marca la última y las aisladas. La
 * descripción para el lector de pantalla es la de siempre (el resumen en texto del dominio).
 */
export function MinigraficoDelIndicador({
  serie,
  desde,
  hasta,
  hoy,
  inicioDelPlan,
  descripcion,
  lienzo = 72,
}: {
  serie: SerieAnalitica;
  desde: string;
  hasta: string;
  hoy: string;
  inicioDelPlan: string | null;
  descripcion: string;
  lienzo?: number;
}) {
  const [caja, setCaja] = useState<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!caja) return;
    setAncho(caja.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(() => setAncho(caja.clientWidth));
    observador.observe(caja);
    return () => observador.disconnect();
  }, [caja]);
  const diaria = serie.grain === 'DAY';
  const sinRegistros = useMemo(() => (diaria ? diasSinRegistros(serie.gaps, hoy) : []), [serie, diaria, hoy]);
  const g = useMemo(
    () => geometriaDelIndicador({ puntos: serie.points, sinRegistros, desde, hasta, hoy, diaria, ancho, lienzo, inicioDelPlan, rangoMinimo: RANGO_MINIMO_POR_UNIDAD[serie.unit] }),
    [serie, sinRegistros, desde, hasta, hoy, diaria, ancho, lienzo, inicioDelPlan],
  );
  const color = ESTILOS[0].color;
  const alto = altoDelIndicador(lienzo);
  const yDeLaTira = FRANJA_DE_ARRIBA + lienzo + SEPARACION_DE_LA_TIRA;
  const nitida = g.porDia < LUGAR_PARA_MARCAR_CADA_DIA ? 'crispEdges' : undefined;
  const hayAlgo = g.puntos.length > 0 || g.semanas.length > 0 || g.tira.length > 0;
  return (
    <div className="minigrafico-del-indicador">
      <div ref={setCaja} className="minigrafico" role="img" aria-label={descripcion} style={{ height: alto }} data-modo={g.modo}>
        {ancho > 0 && hayAlgo ? (
          <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" focusable="false">
            <g transform={`translate(0 ${FRANJA_DE_ARRIBA})`}>
              {g.grilla.map((m) => (
                <line key={`grilla-${m.valor}`} className="minigrafico__grilla" x1={0} x2={ancho} y1={m.y} y2={m.y} stroke="var(--borde)" strokeWidth={1} />
              ))}
              {g.inicioDelPlan !== null ? (
                <line className="minigrafico__plan" x1={g.inicioDelPlan} x2={g.inicioDelPlan} y1={0} y2={lienzo} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="1 3" />
              ) : null}
              {g.plan.map((s) => (
                <line key={`objetivo-${s.x1}`} className="minigrafico__objetivo" x1={s.x1} x2={s.x2} y1={s.y} y2={s.y} stroke={color} strokeWidth={1.25} strokeDasharray="3 2" />
              ))}
              {g.modo === 'semanal' ? g.puntos.map((p) => <circle key={p.clave} className="minigrafico__dia" cx={p.x} cy={p.y} r={p.medida.R} fill={color} opacity={0.45} />) : null}
              {g.tramos.map((d) => (
                <path key={d} className="minigrafico__tramo" d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
              ))}
              {g.semanas.map((s) => (
                <g key={s.lunes} className="minigrafico__semana" data-con-valor={s.conValor} data-dias={s.dias}>
                  <Punto cx={s.x} cy={s.y} color={color} medida={s.medida} />
                </g>
              ))}
              {g.modo === 'semanal'
                ? null
                : g.puntos.map((p) => (
                    <g key={p.clave} className="minigrafico__punto" data-estado={p.medida.estado}>
                      <Punto cx={p.x} cy={p.y} color={color} medida={p.medida} />
                    </g>
                  ))}
              {g.muescas.map((m, i) => (
                <rect key={`muesca-${i}`} className="minigrafico__muesca" x={m.x - 0.75} y={m.abajo ? lienzo - 3 : 0} width={1.5} height={3} fill="var(--tenue)" />
              ))}
              {g.rotulos.map((r) => (
                <text key={`rotulo-${r.texto}`} className="minigrafico__rotulo" x={2} y={r.y} fill="var(--tenue)" fontSize={LETRA} fontWeight={500}>
                  {r.texto}
                </text>
              ))}
            </g>
            {/* La tira: el alto dice el estado del día además del color (entera, a media altura o una raya baja). */}
            <g className="minigrafico__tira" shapeRendering={nitida}>
              {g.tira.map((c) =>
                c.estado === 'con' ? (
                  <rect key={`tira-${c.x}`} x={c.x} y={yDeLaTira} width={c.ancho} height={ALTO_DE_LA_TIRA} rx={nitida ? 0 : 1} fill={color} data-estado="con" />
                ) : c.estado === 'hueco' ? (
                  c.ancho >= 5 && !nitida ? (
                    <rect key={`tira-${c.x}`} x={c.x + 0.5} y={yDeLaTira + 0.5} width={c.ancho - 1} height={ALTO_DE_LA_TIRA - 1} rx={1} fill="none" stroke={color} strokeWidth={1} data-estado="hueco" />
                  ) : (
                    <rect key={`tira-${c.x}`} x={c.x} y={yDeLaTira + ALTO_DE_LA_TIRA / 2} width={c.ancho} height={ALTO_DE_LA_TIRA / 2} fill={color} data-estado="hueco" />
                  )
                ) : (
                  <rect key={`tira-${c.x}`} x={c.x} y={yDeLaTira + ALTO_DE_LA_TIRA - 1.5} width={c.ancho} height={1.5} fill="var(--grafico-hueco)" data-estado="sin" />
                ),
              )}
              {g.hoy ? <rect className="minigrafico__hoy" x={g.hoy.x} y={yDeLaTira + ALTO_DE_LA_TIRA + 2} width={g.hoy.ancho} height={2} fill="var(--ahora)" /> : null}
            </g>
            <text className="minigrafico__fecha" x={0} y={alto - 3} fill="var(--tenue)" fontSize={LETRA}>
              {diaYMesCivil(desde)}
            </text>
            <text className="minigrafico__fecha" x={ancho} y={alto - 3} textAnchor="end" fill="var(--tenue)" fontSize={LETRA}>
              {hasta === hoy ? 'hoy' : diaYMesCivil(hasta)}
            </text>
          </svg>
        ) : null}
      </div>
      {g.fuera.abajo + g.fuera.arriba > 0 ? <p className="indicador__nota">{fueraDeLaEscala(g.fuera)}</p> : null}
    </div>
  );
}

/** La cuenta de lo que cae fuera de la escala, escrita en el pie: la muesca dice que existe y cuándo; la tabla, su valor. */
export function fueraDeLaEscala({ abajo, arriba }: { readonly abajo: number; readonly arriba: number }): string {
  const parte = (n: number, donde: string): string => `${n} ${n === 1 ? 'dato' : 'datos'} sin completar ${donde} de la escala`;
  return [abajo > 0 ? parte(abajo, 'debajo') : null, arriba > 0 ? parte(arriba, 'encima') : null].filter(Boolean).join(' · ');
}
