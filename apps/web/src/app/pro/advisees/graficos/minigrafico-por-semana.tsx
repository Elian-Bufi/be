'use client';

/**
 * Un gráfico chico por semana (WP-GRAFICOS, pasada visual del 15/11; DISENO-VISUAL §1, principio 6): una serie diaria con
 * muchos días sin dato (la alimentación) no se dibuja como un peine. Va una barra por semana con la media de los días con
 * dato, desde cero, con su «5 de 7 días» al pasar el mouse; los días, como puntos tenues detrás; una semana sin ningún
 * dato queda vacía, con una marca fina en la base, nunca en cero. Lo usa «Comparar dos etapas» (GR-24) en Nutrición, con
 * «Día por día» a un toque. La geometría es pura (`geometriaPorSemana`).
 *
 * No recibe el foco: para el lector de pantalla es una imagen con su descripción; la tabla de datos tiene cada día.
 */
import { useEffect, useMemo, useState } from 'react';
import { ESTILOS } from '../seguimiento/marca';
import { diaYMes, textoDelEje } from './eje-de-fechas';
import { denominadorDeLaSemana, geometriaPorSemana, type DiaDeLaSerie } from './semanas';

const LETRA = 12.5;

/** «Semana del 3 nov: 1.850 kcal, media de 5 de 7 días». */
function lecturaDeLaSemana(lunes: string, valor: number | null, unidad: string, s: { readonly conDato: number; readonly dias: number }): string {
  const cuando = `Semana del ${textoDelEje(lunes, false)}`;
  if (valor === null) return `${cuando}: ${denominadorDeLaSemana(s)}`;
  const numero = valor.toLocaleString('es-AR', { maximumFractionDigits: Math.abs(valor) >= 100 ? 0 : 1 });
  return `${cuando}: ${numero} ${unidad}, media de ${denominadorDeLaSemana(s)}`;
}

export function MinigraficoPorSemana({
  dias,
  unidad,
  desde,
  hasta,
  hoy,
  alto,
  indice = 0,
  bandas,
  plan,
  fechas,
  descripcion,
}: {
  dias: readonly DiaDeLaSerie[];
  unidad: string;
  desde: string;
  hasta: string;
  hoy: string;
  alto: number;
  indice?: number;
  bandas?: readonly { readonly desde: string; readonly hasta: string; readonly rotulo: string }[];
  plan?: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
  fechas?: readonly string[];
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
  const g = useMemo(() => geometriaPorSemana({ dias, desde, hasta, hoy, ancho, alto, bandas, plan, fechas }), [dias, desde, hasta, hoy, ancho, alto, bandas, plan, fechas]);
  const color = (ESTILOS[indice] ?? ESTILOS[0]).color;
  return (
    <div ref={setCaja} className="minigrafico minigrafico-por-semana" role="img" aria-label={descripcion} style={{ height: alto }}>
      {ancho > 0 ? (
        <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" focusable="false">
          {g.bandas.map((b, i) => (
            <g key={`banda-${b.rotulo}`} className="minigrafico__banda" data-rotulo={b.rotulo}>
              <rect x={b.x} y={12} width={b.ancho} height={3} fill="var(--banda)" />
              {i > 0 ? <line x1={b.x} x2={b.x} y1={2} y2={g.caja.abajo + 4} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="1 3" /> : null}
              <text x={b.x + 6} y={9} dominantBaseline="central" fill="var(--texto)" fontSize={LETRA} fontWeight={600}>
                {b.rotulo}
              </text>
            </g>
          ))}
          {g.eje.map((m) => (
            <g key={m.valor} className="minigrafico__marca">
              <line x1={g.caja.izquierda} x2={g.caja.derecha} y1={Math.round(m.y) + 0.5} y2={Math.round(m.y) + 0.5} stroke="var(--borde)" strokeWidth={1} opacity={0.7} />
              <text x={g.caja.izquierda - 6} y={m.y} textAnchor="end" dominantBaseline="central" fill="var(--tenue)" fontSize={LETRA}>
                {m.texto}
              </text>
            </g>
          ))}
          {/* Los días, como puntos tenues detrás de las barras: se ve de qué sale cada media. */}
          {g.dias.map((d) => (
            <circle key={`dia-${d.fecha}`} className="minigrafico-por-semana__dia" cx={d.x} cy={d.y} r={1.5} fill={color} opacity={0.3} />
          ))}
          {/* Cada semana, una barra de un tono con su tope marcado; la que no está completa (la corta el período, tiene
              hoy o algún subtotal) va más clara: la forma lo dice además del texto del globo. */}
          {g.barras.map((b) => (
            <g key={b.lunes} className="minigrafico-por-semana__semana" data-hueca={b.hueca ? '' : undefined} data-dias={b.semana.conDato}>
              <title>{lecturaDeLaSemana(b.lunes, b.semana.valor, unidad, b.semana)}</title>
              <rect x={b.x} y={b.y} width={b.ancho} height={Math.max(0, g.caja.abajo - b.y)} fill={color} fillOpacity={b.hueca ? 0.16 : 0.34} />
              <line x1={b.x} x2={b.x + b.ancho} y1={b.y + 1} y2={b.y + 1} stroke={color} strokeWidth={2} />
            </g>
          ))}
          {g.vacias.map((b) => (
            <g key={`vacia-${b.lunes}`} className="minigrafico-por-semana__vacia">
              <title>{lecturaDeLaSemana(b.lunes, null, unidad, b.semana)}</title>
              <line x1={b.x + 1} x2={b.x + Math.max(2, b.ancho - 1)} y1={g.caja.abajo - 1} y2={g.caja.abajo - 1} stroke="var(--grafico-hueco)" strokeWidth={1.5} strokeDasharray="2 2" />
            </g>
          ))}
          {g.plan.map((s) => (
            <line key={`objetivo-${s.x1}`} className="minigrafico__objetivo" x1={s.x1} x2={s.x2} y1={s.y} y2={s.y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
          ))}
          {g.fechas.map((f) => (
            <text key={f.fecha} className="minigrafico__fecha" x={f.x} y={alto - 4} textAnchor={f.ancla} fill="var(--tenue)" fontSize={LETRA}>
              {diaYMes(f.fecha, hoy)}
            </text>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
