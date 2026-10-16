'use client';

/**
 * La muestra de una métrica y sus puntos (WP-ESCRITORIO-AMABLE): lo que comparten el gráfico, la lectura, la leyenda,
 * las etiquetas de las métricas elegidas y «Cómo se lee esta vista». Va aparte de `lienzo.tsx` para no arrastrar la
 * biblioteca de gráficos a donde solo hace falta una muestra.
 */

/** El color de cada métrica elegida. Ni rojo ni verde, que se leerían como juicio (`tokens.css`). */
export const ESTILOS = [{ color: 'var(--metrica-1)' }, { color: 'var(--metrica-2)' }, { color: 'var(--metrica-3)' }] as const;

/** La clase de un dato que se dibuja distinto: reportado por la persona o calculado por un método (lo medido, no). */
export type ClaseDibujada = 'REPORTED' | 'DERIVED';

/**
 * La muestra de una métrica, para un encabezado, una leyenda o la lectura: una línea de su color con un punto. Con
 * `plan`, la de lo planificado: la misma línea, discontinua y sin punto.
 */
export function Marca({ indice, hueco = false, tamano = 14, clase = null, plan = false }: { indice: number; hueco?: boolean; tamano?: number; clase?: ClaseDibujada | null; plan?: boolean }) {
  const e = ESTILOS[indice] ?? ESTILOS[0];
  const c = tamano / 2;
  const ancho = tamano * 2.2;
  return (
    <svg width={ancho} height={tamano} viewBox={`0 0 ${ancho} ${tamano}`} aria-hidden="true" className="marca-de-metrica">
      <line x1={1} y1={c} x2={ancho - 1} y2={c} stroke={e.color} strokeWidth={2} strokeDasharray={plan ? '5 4' : undefined} />
      {plan ? null : <Punto cx={ancho / 2} cy={c} r={tamano * (clase ? 0.42 : 0.34)} color={e.color} hueco={hueco} clase={clase} />}
    </svg>
  );
}

/** Un punto: lleno (medido y completo), hueco (subtotal o sin completar), de contorno cortado (reportado) o con un punto adentro (calculado). */
export function Punto({ cx, cy, r, color, hueco, trazo = 2, clase = null }: { cx: number; cy: number; r: number; color: string; hueco: boolean; trazo?: number; clase?: ClaseDibujada | null }) {
  const relleno = hueco || clase ? 'var(--superficie)' : color;
  const corte = clase === 'REPORTED' ? `${Math.max(1.5, r * 0.55)} ${Math.max(1.2, r * 0.4)}` : undefined;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={relleno} stroke={color} strokeWidth={trazo} strokeDasharray={corte} />
      {clase === 'DERIVED' ? <circle cx={cx} cy={cy} r={Math.max(1.2, r * 0.38)} fill={color} /> : null}
    </g>
  );
}
