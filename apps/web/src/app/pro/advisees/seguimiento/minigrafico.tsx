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
import { diasSinRegistros, FRANJA_DE_ROTULOS, geometriaDelMinigrafico } from './geometria';
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
          {/* Las etapas: un fondo por etapa y su letra arriba. Entre dos, la línea punteada del cambio. */}
          {g.bandas.map((b, i) => (
            <g key={`banda-${b.rotulo}`} className="minigrafico__banda" data-rotulo={b.rotulo}>
              <rect x={b.x} y={2} width={b.ancho} height={g.caja.abajo + 6 - 2} fill="var(--fondo-suave)" fillOpacity={i % 2 === 0 ? 0.9 : 0.45} />
              {i > 0 ? <line x1={b.x} x2={b.x} y1={2} y2={g.caja.abajo + 6} stroke="var(--borde-control)" strokeWidth={1.5} strokeDasharray="2 3" /> : null}
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
              <line x1={g.caja.izquierda} x2={g.caja.derecha} y1={m.y} y2={m.y} stroke="var(--borde)" />
              <text x={g.caja.izquierda - 6} y={m.y} textAnchor="end" dominantBaseline="central" fill="var(--tenue)" fontSize={LETRA}>
                {m.texto}
              </text>
            </g>
          ))}
          {g.inicioDelPlan !== null ? <line className="minigrafico__plan" x1={g.inicioDelPlan} x2={g.inicioDelPlan} y1={2} y2={alto - 2} stroke="var(--borde-control)" strokeWidth={1.5} strokeDasharray="3 3" /> : null}
          {/* Lo planificado: un tramo horizontal por escalón, discontinuo y sin puntos, como en el gráfico grande. */}
          {g.plan.map((s) => (
            <line key={`objetivo-${s.x1}`} className="minigrafico__objetivo" x1={s.x1} x2={s.x2} y1={s.y} y2={s.y} stroke={color} strokeWidth={1.75} strokeDasharray="6 4" />
          ))}
          {g.tramos.map((d) => (
            <path key={d} className="minigrafico__tramo" d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {g.puntos.map((p) => (
            <g key={p.clave} className="minigrafico__punto" data-hueco={p.hueco ? 'si' : undefined} data-clase={p.clase ?? undefined}>
              <Punto cx={p.x} cy={p.y} r={p.r} color={color} hueco={p.hueco} trazo={1.5} clase={p.clase} />
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
