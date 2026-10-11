'use client';

/**
 * El minigráfico de un indicador del Resumen (WP-ESCRITORIO-AMABLE, parte 3): los mismos puntos, los mismos cortes y el
 * mismo gris de los días sin registros que el gráfico de «Analizar», en chico y sin interacción. Es un dibujo propio,
 * sin la biblioteca de gráficos: el Resumen se carga con la ficha y esa biblioteca pesa más que todo lo demás junto.
 *
 * No recibe el foco ni tiene nada para tocar: el valor, la regla y la cobertura están escritos al lado, y «Analizar»
 * abre el gráfico grande. Para el lector de pantalla es una imagen con su descripción (el resumen en texto del dominio).
 * Un solo color: acá no distingue nada, porque cada tarjeta dice su métrica.
 */
import type { SerieAnalitica } from '@be/domain';
import { useEffect, useMemo, useState } from 'react';
import { diasSinRegistros, geometriaDelMinigrafico } from './geometria';
import { ESTILOS, Punto } from './marca';

const ALTO = 60;
/** La letra más chica de un gráfico (el criterio de diseño pide 12,5 px como mínimo). */
const LETRA = 12.5;

export function Minigrafico({
  serie,
  desde,
  hasta,
  hoy,
  inicioDelPlan,
  descripcion,
}: {
  /** Las observaciones de la métrica en el período (el día, la sesión o la toma). */
  serie: SerieAnalitica;
  desde: string;
  hasta: string;
  hoy: string;
  /** El día desde el que rige el primer plan del período, si empezó adentro: se marca con una línea punteada. */
  inicioDelPlan: string | null;
  descripcion: string;
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
  const g = useMemo(() => geometriaDelMinigrafico({ puntos: serie.points, sinRegistros: sombreados, desde, hasta, ancho, alto: ALTO, inicioDelPlan }), [serie, sombreados, desde, hasta, ancho, inicioDelPlan]);
  const color = ESTILOS[0].color;
  return (
    <div ref={setCaja} className="minigrafico" role="img" aria-label={descripcion} style={{ height: ALTO }}>
      {ancho > 0 && g.puntos.length > 0 ? (
        <svg width={ancho} height={ALTO} viewBox={`0 0 ${ancho} ${ALTO}`} aria-hidden="true" focusable="false">
          {/* Los días sin registros: el mismo gris leve de «Analizar», debajo de todo lo demás. */}
          {g.sinRegistros.map((h) => (
            <rect key={`sin-${h.x}`} className="minigrafico__sin-registros" x={h.x} y={2} width={h.ancho} height={ALTO - 4} fill="var(--grafico-hueco)" fillOpacity={0.2} />
          ))}
          {g.eje.map((m) => (
            <g key={m.valor} className="minigrafico__marca">
              <line x1={g.caja.izquierda} x2={g.caja.derecha} y1={m.y} y2={m.y} stroke="var(--borde)" />
              <text x={g.caja.izquierda - 6} y={m.y} textAnchor="end" dominantBaseline="central" fill="var(--tenue)" fontSize={LETRA}>
                {m.texto}
              </text>
            </g>
          ))}
          {g.inicioDelPlan !== null ? <line className="minigrafico__plan" x1={g.inicioDelPlan} x2={g.inicioDelPlan} y1={2} y2={ALTO - 2} stroke="var(--borde-control)" strokeWidth={1.5} strokeDasharray="3 3" /> : null}
          {g.tramos.map((d) => (
            <path key={d} className="minigrafico__tramo" d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {g.puntos.map((p) => (
            <g key={p.clave} className="minigrafico__punto" data-hueco={p.hueco ? 'si' : undefined} data-clase={p.clase ?? undefined}>
              <Punto cx={p.x} cy={p.y} r={p.r} color={color} hueco={p.hueco} trazo={1.5} clase={p.clase} />
            </g>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
