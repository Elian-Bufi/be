'use client';

/**
 * Las marcas por su sentido (WP-GRAFICOS fase 2, DL-174), dibujadas con las piezas de «Analizar» (`seguimiento/marca.tsx`):
 * lleno lo registrado, hueco lo indicado y el subtotal, hueco y gris lo precargado del plan, rombo lo observado por el
 * profesional, contorno cortado lo reportado y un punto adentro lo calculado. Lo cargado tarde lleva una muesca chica
 * arriba. Nunca verde ni rojo: la forma dice el estado además del color.
 */
import { MARCA_SEGUN_EL_DATO, type MarcaSemantica, type SentidoDeLaMarca } from '@be/domain';
import { medidaDeMarca, type EstadoDeMarca } from '../seguimiento/geometria';
import { ESTILOS, Punto, Rombo } from '../seguimiento/marca';
import { SENTIDO_CORTO, SENTIDO_EN_LA_LEYENDA } from './copy';

const ESTADO_DE_LA_MARCA: Readonly<Record<Exclude<MarcaSemantica, 'ROMBO'>, EstadoDeMarca>> = {
  LLENA: 'lleno',
  HUECA: 'hueco',
  HUECA_GRIS: 'hueco',
  CONTORNO_CORTADO: 'reportado',
  PUNTO_ADENTRO: 'calculado',
};

/** El color de un carril por su índice (`--metrica-1` a `--metrica-3`). */
export const colorDelCarril = (indice: number): string => (ESTILOS[indice] ?? ESTILOS[0]).color;

export function MarcaDelCarril({ marca, cx, cy, porDia, color, tarde = false, yHasta = null }: { marca: MarcaSemantica; cx: number; cy: number; porDia: number; color: string; tarde?: boolean; yHasta?: number | null }) {
  const tinta = marca === 'HUECA_GRIS' ? 'var(--grafico-carga-rapida)' : color;
  const medida = marca === 'ROMBO' ? null : medidaDeMarca(ESTADO_DE_LA_MARCA[marca], porDia);
  const arriba = medida ? medida.R : 6;
  return (
    <g data-marca={marca}>
      {yHasta !== null && yHasta !== cy ? <line x1={cx} x2={cx} y1={cy} y2={yHasta} stroke={tinta} strokeWidth={2} strokeDasharray="3 2" /> : null}
      {marca === 'ROMBO' ? <Rombo cx={cx} cy={cy} porDia={porDia} color={tinta} /> : medida ? <Punto cx={cx} cy={cy} color={tinta} medida={medida} /> : null}
      {yHasta !== null && yHasta !== cy && medida ? <Punto cx={cx} cy={yHasta} color={tinta} medida={medida} /> : null}
      {tarde ? <line className="grafico-base__tarde" x1={cx} x2={cx} y1={cy - arriba - 2} y2={cy - arriba - 6} stroke={tinta} strokeWidth={1.5} /> : null}
    </g>
  );
}

/**
 * El glifo de la leyenda de un sentido, con su texto corto al lado (la pasada visual del 15/11: fichas cortas en una
 * línea). El lector de pantalla oye el sentido entero («Registrado: lleno»), que dice también la forma.
 */
export function GlifoDeLaLeyenda({ sentido, indice = 0 }: { sentido: SentidoDeLaMarca; indice?: number }) {
  const marca = MARCA_SEGUN_EL_DATO[sentido];
  return (
    <span className="grafico-base__glifo">
      <svg width={14} height={14} viewBox="0 0 18 18" aria-hidden="true">
        <MarcaDelCarril marca={marca} cx={9} cy={9} porDia={10} color={colorDelCarril(indice)} />
      </svg>
      <span aria-hidden="true">{SENTIDO_CORTO[sentido]}</span>
      <span className="visualmente-oculto">{SENTIDO_EN_LA_LEYENDA[sentido]}</span>
    </span>
  );
}

/**
 * Una ficha más de la leyenda, para una marca del dibujo que no es un punto (rama B, con la pasada visual): la tira de
 * cobertura de abajo de cada carril y la línea cortada de lo indicado por versión. Va solo si se ve en el dibujo: quien
 * la pide lo sabe. `corto` se ve; `largo`, el lector de pantalla.
 */
export interface FichaDeLaLeyenda {
  readonly glifo: 'TIRA' | 'LINEA_CORTADA';
  readonly corto: string;
  readonly largo: string;
  /** El color del carril de la marca (la línea cortada va en el color de su carril). */
  readonly indice?: number;
}

/** El glifo de una ficha que no es un punto: la tira (entera, a media altura y una raya baja) o la línea cortada. */
function GlifoDeLaFicha({ ficha, indice }: { ficha: FichaDeLaLeyenda; indice: number }) {
  return (
    <span className="grafico-base__glifo">
      {ficha.glifo === 'TIRA' ? (
        <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
          <rect x={1} y={5} width={5} height={6} fill="var(--tenue)" />
          <rect x={8} y={8} width={5} height={3} fill="var(--tenue)" />
          <rect x={15} y={9.5} width={5} height={1.5} fill="var(--grafico-hueco)" />
        </svg>
      ) : (
        <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
          <line x1={1} x2={21} y1={7} y2={7} stroke={colorDelCarril(ficha.indice ?? indice)} strokeWidth={1.5} strokeDasharray="6 4" />
        </svg>
      )}
      <span aria-hidden="true">{ficha.corto}</span>
      <span className="visualmente-oculto">{ficha.largo}</span>
    </span>
  );
}

/**
 * La leyenda: fichas cortas en una línea, arriba del gráfico, solo con las marcas que se ven (`sentidosQueSeVen`) y, al
 * final, las fichas de lo que no es un punto (la tira, la línea cortada), si se ven.
 */
export function Leyenda({ sentidos, indice = 0, fichas = [] }: { sentidos: readonly SentidoDeLaMarca[]; indice?: number; fichas?: readonly FichaDeLaLeyenda[] }) {
  if (sentidos.length === 0 && fichas.length === 0) return null;
  return (
    <ul className="grafico-base__leyenda" aria-label="Cómo se leen las marcas">
      {sentidos.map((s) => (
        <li key={s}>
          <GlifoDeLaLeyenda sentido={s} indice={indice} />
        </li>
      ))}
      {fichas.map((f) => (
        <li key={`${f.glifo}-${f.corto}`} data-ficha={f.glifo}>
          <GlifoDeLaFicha ficha={f} indice={indice} />
        </li>
      ))}
    </ul>
  );
}
