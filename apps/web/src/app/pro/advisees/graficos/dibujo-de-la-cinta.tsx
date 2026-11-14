'use client';

/**
 * El dibujo de la cinta del tiempo (GR-23; WP-GRAFICOS fase 2, DL-174), sin el SVG de afuera: una fila por área (con el
 * ícono de su área en el margen) y una para las notas; las versiones de los planes como barras, con su etiqueta si entra;
 * cada hecho con su ícono de la familia de BE y lo que cae junto en un círculo con la cantidad. Lo usan la cinta
 * (`cinta-del-tiempo-en-pantalla.tsx`) y los carriles de eventos de `PanelesAlineados`. No lee nada: dibuja la geometría.
 */
import { Icono } from '../../../../components/icono';
import { LETRA_MINIMA } from '../seguimiento/geometria';
import { ALTO_DE_LA_BARRA, ALTO_DE_LA_FILA_DE_LA_CINTA, BARRA_DESDE, CENTRO_DEL_ICONO, ICONO_DE_LA_FILA, ICONO_DEL_HECHO, type ElegibleDeLaCinta, type EventoDeLaCinta, type GeometriaDeLaCinta } from './cinta-del-tiempo';
import type { EscalaDeFechas } from './eje-de-fechas';
import { MARGEN_IZQUIERDO } from './medidas-del-grafico';

/** El ícono de un hecho, o `null` para lo que no se dibuja como ícono (las barras y los hábitos reservados). */
export const iconoDelHecho = (e: EventoDeLaCinta) => (e.tipo === 'VERSION_DE_PLAN' || e.tipo === 'HABITO' ? null : ICONO_DEL_HECHO[e.tipo]);

/** El aro de lo elegido: un círculo alrededor de un hecho, un rectángulo alrededor de una barra. */
function AroDeLoElegido({ elegido }: { elegido: ElegibleDeLaCinta }) {
  if (elegido.barra) {
    return <rect className="grafico-cinta__aro" x={elegido.barra.x1 - 3} y={elegido.y - ALTO_DE_LA_BARRA / 2 - 3} width={elegido.barra.x2 - elegido.barra.x1 + 6} height={ALTO_DE_LA_BARRA + 6} rx={3} fill="none" stroke="var(--grafico-cursor)" strokeWidth={2} />;
  }
  return <circle className="grafico-cinta__aro" cx={elegido.x} cy={elegido.y} r={12} fill="none" stroke="var(--grafico-cursor)" strokeWidth={2} />;
}

export function DibujoDeLaCinta({ g, escala, elegido = null }: { g: GeometriaDeLaCinta; escala: EscalaDeFechas; elegido?: ElegibleDeLaCinta | null }) {
  return (
    <g className="grafico-cinta__dibujo">
      {g.filas.map((f) => (
        <g key={f.fila} data-fila={f.fila}>
          <line x1={escala.izquierda} x2={escala.derecha} y1={f.y + ALTO_DE_LA_FILA_DE_LA_CINTA - 0.5} y2={f.y + ALTO_DE_LA_FILA_DE_LA_CINTA - 0.5} stroke="var(--borde)" strokeWidth={1} opacity={0.6} />
          <g transform={`translate(${MARGEN_IZQUIERDO - 15 - 14} ${f.y + CENTRO_DEL_ICONO - 7.5})`} style={{ color: 'var(--tenue)' }}>
            <Icono nombre={ICONO_DE_LA_FILA[f.fila]} tamano={15} />
          </g>
          {f.barras.map((b, i) => (
            <g key={b.clave} data-tipo="VERSION_DE_PLAN">
              <rect x={b.x1} y={f.y + BARRA_DESDE} width={b.x2 - b.x1} height={ALTO_DE_LA_BARRA} rx={1} fill={i % 2 === 0 ? 'var(--grafico-indicado)' : 'var(--borde-control)'} />
              <line x1={b.x1} x2={b.x1} y1={f.y + 3} y2={f.y + BARRA_DESDE + ALTO_DE_LA_BARRA} stroke="var(--grafico-indicado)" strokeWidth={1} />
              {b.texto ? (
                <text x={b.x1 + 4} y={f.y + CENTRO_DEL_ICONO} dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--texto)">
                  {b.texto}
                </text>
              ) : null}
            </g>
          ))}
          {f.hechos.map((h) => {
            const icono = iconoDelHecho(h.evento);
            if (h.hechos.length > 1 || icono === null) {
              return (
                <g key={h.clave} data-tipo="GRUPO">
                  <circle cx={h.x} cy={f.y + CENTRO_DEL_ICONO} r={h.evento.agrupados > 9 ? 9.5 : 8.5} fill="var(--superficie)" stroke="var(--texto)" strokeWidth={1.5} />
                  <text x={h.x} y={f.y + CENTRO_DEL_ICONO} textAnchor="middle" dominantBaseline="central" fontSize={LETRA_MINIMA} fill="var(--texto)">
                    {h.evento.agrupados}
                  </text>
                </g>
              );
            }
            return (
              <g key={h.clave} data-tipo={h.evento.tipo} transform={`translate(${h.x - 7.5} ${f.y + CENTRO_DEL_ICONO - 7.5})`} style={{ color: 'var(--texto)' }}>
                <rect x={-1.5} y={-1.5} width={18} height={18} rx={4} fill="var(--superficie)" />
                <Icono nombre={icono} tamano={15} />
              </g>
            );
          })}
        </g>
      ))}
      {elegido ? <AroDeLoElegido elegido={elegido} /> : null}
    </g>
  );
}
