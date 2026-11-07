'use client';

/**
 * La muestra de una métrica y sus puntos (WP-ESCRITORIO-AMABLE): lo que comparten el gráfico, la lectura, la leyenda,
 * las etiquetas de las métricas elegidas y «Cómo se lee esta vista». Va aparte de `lienzo.tsx` para no arrastrar la
 * biblioteca de gráficos a donde solo hace falta una muestra.
 *
 * Desde WP-TABLERO-ALTA-GAMA (TB-02; DL-163 D-3), cada marca se dibuja con la medida de `geometria.ts`
 * (`medidaDeMarca`, `medidaDelRombo` y `medidaDelAro`): la misma regla en los cuatro gráficos de la ficha.
 */
import { medidaDeMarca, medidaDelAro, medidaDelRombo, rayaDeCorregido, type EstadoDeMarca, type MedidaDeMarca } from './geometria';

/** El color de cada métrica elegida. Ni rojo ni verde, que se leerían como juicio (`tokens.css`). */
export const ESTILOS = [{ color: 'var(--metrica-1)' }, { color: 'var(--metrica-2)' }, { color: 'var(--metrica-3)' }] as const;

/** La clase de un dato que se dibuja distinto: reportado por la persona o calculado por un método (lo medido, no). */
export type ClaseDibujada = 'REPORTED' | 'DERIVED';

/** El lugar por día con el que se dibujan las muestras de las leyendas: el de «Analizar» a 90 días, a 1440. */
const LUGAR_DE_LA_MUESTRA = 10;

/** El estado de la muestra de una leyenda, con lo que dice cada una. */
function estadoDeLaMuestra(hueco: boolean, clase: ClaseDibujada | null): EstadoDeMarca {
  if (clase === 'REPORTED') return 'reportado';
  if (clase === 'DERIVED') return 'calculado';
  return hueco ? 'hueco' : 'lleno';
}

/**
 * La muestra de una métrica, para un encabezado, una leyenda o la lectura: una línea de su color con un punto. Con
 * `plan`, la del objetivo del profesional: la misma línea, discontinua y sin punto. Con `indicado`, la de lo indicado
 * en el plan: un rombo hueco, sin línea (WP-NUTRICION-COMPARACION). Las tres se distinguen por la forma, no solo por el color.
 */
export function Marca({ indice, hueco = false, tamano = 14, clase = null, plan = false, indicado = false }: { indice: number; hueco?: boolean; tamano?: number; clase?: ClaseDibujada | null; plan?: boolean; indicado?: boolean }) {
  const e = ESTILOS[indice] ?? ESTILOS[0];
  const c = tamano / 2;
  const ancho = tamano * 2.2;
  return (
    <svg width={ancho} height={tamano} viewBox={`0 0 ${ancho} ${tamano}`} aria-hidden="true" className="marca-de-metrica">
      {indicado ? (
        <Rombo cx={ancho / 2} cy={c} porDia={LUGAR_DE_LA_MUESTRA} color={e.color} />
      ) : (
        <>
          <line x1={1} y1={c} x2={ancho - 1} y2={c} stroke={e.color} strokeWidth={1.5} strokeDasharray={plan ? '4 3' : undefined} />
          {plan ? null : <Punto cx={ancho / 2} cy={c} color={e.color} medida={medidaDeMarca(estadoDeLaMuestra(hueco, clase), LUGAR_DE_LA_MUESTRA)} />}
        </>
      )}
    </svg>
  );
}

/**
 * Lo indicado en el plan para un día: un rombo hueco del color de la métrica, suelto (no se une con nada), del tamaño
 * del hueco. Sin relleno: un punto registrado del mismo día se sigue viendo adentro, dibuje la biblioteca una capa u otra
 * arriba.
 */
export function Rombo({ cx, cy, porDia, color }: { cx: number; cy: number; porDia: number; color: string }) {
  const { mediaDiagonal: m, trazo } = medidaDelRombo(porDia);
  return <path d={`M ${cx} ${cy - m} L ${cx + m} ${cy} L ${cx} ${cy + m} L ${cx - m} ${cy} Z`} fill="none" stroke={color} strokeWidth={trazo} strokeLinejoin="round" />;
}

/**
 * Un punto, con la medida de su estado: lleno (medido y completo), hueco (subtotal o sin completar), de contorno
 * cortado (reportado) o con un punto adentro (calculado). Con `corregido`, una raya fina encima.
 */
export function Punto({ cx, cy, color, medida, corregido = false }: { cx: number; cy: number; color: string; medida: MedidaDeMarca; corregido?: boolean }) {
  const raya = corregido ? rayaDeCorregido(medida) : null;
  return (
    <g data-estado={medida.estado}>
      {medida.estado === 'lleno' ? (
        <>
          {medida.halo ? <circle cx={cx} cy={cy} r={medida.R + 1} fill="var(--superficie)" /> : null}
          <circle cx={cx} cy={cy} r={medida.R} fill={color} />
        </>
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={medida.r}
          fill="var(--superficie)"
          stroke={color}
          strokeWidth={medida.trazo}
          strokeDasharray={medida.corte ? medida.corte.join(' ') : undefined}
          transform={medida.corte ? `rotate(-22.5 ${cx} ${cy})` : undefined}
        />
      )}
      {medida.puntoAdentro !== null ? <circle cx={cx} cy={cy} r={medida.puntoAdentro} fill={color} /> : null}
      {raya ? <rect x={cx - raya.ancho / 2} y={cy - raya.arriba - raya.grueso / 2} width={raya.ancho} height={raya.grueso} fill={color} /> : null}
    </g>
  );
}

/**
 * Lo elegido: un aro fino del color de la métrica alrededor de la marca, separado de lo de atrás por la superficie. Con
 * el foco del teclado en el gráfico, pasa al color del foco (globals.css). No recibe el puntero: se toca la marca.
 */
export function Aro({ cx, cy, porDia, color }: { cx: number; cy: number; porDia: number; color: string }) {
  const { r, trazo, separacion } = medidaDelAro(porDia);
  return (
    <g className="grafico__aro" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--superficie)" strokeWidth={trazo + 2 * separacion} />
      <circle className="grafico__aro-trazo" cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={trazo} />
    </g>
  );
}
