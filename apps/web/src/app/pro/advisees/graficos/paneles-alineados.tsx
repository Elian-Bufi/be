'use client';

/**
 * Los paneles alineados (WP-GRAFICOS fase 2, DL-174; GR-26 «Alineadas»): los carriles apilados, uno arriba del otro, con
 * un solo eje de fechas escrito bajo el último. Cada carril tiene su unidad y su escala; las bandas son las versiones
 * del plan del área del gráfico; la regla del cursor cruza todos los carriles a la vez.
 *
 * Accesibilidad: el contenedor es un grupo con nombre y su descripción apunta al resumen en texto; el SVG no se lee. El
 * área del gráfico recibe el foco: flechas, Inicio, Fin, Mayúscula con flechas (un tramo) y Escape. Pasar el mouse mueve
 * la regla solo con un puntero fino; tocar o hacer clic la fija. La lectura de la fecha y la tabla dicen lo mismo que el
 * dibujo.
 */
import type { SentidoDeLaMarca } from '@be/domain';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useConPuntero } from '../../../../lib/graficos';
import { LETRA_MINIMA } from '../seguimiento/geometria';
import { geometriaDelCarril, fechasConObservacion, lineaDeLoCargadoTarde, type BandaDeVersion, type Carril } from './carriles';
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { useCursorDeFechas } from './cursor-de-fechas';
import { escalaDeFechas, moverElCursor, type EscalaDeFechas, type PeriodoDelGrafico } from './eje-de-fechas';
import { LecturaEnLaFecha } from './lectura-en-la-fecha';
import { colorDelCarril, Leyenda, MarcaDelCarril } from './marcas';
import { NotaDelInicio } from './estado-del-grafico';
import { tablaEquivalente } from './tabla-equivalente';
import { TablaEquivalente } from './tabla-equivalente-en-pantalla';

export type DensidadDelGrafico = 'COMPLETA' | 'COMPACTA';

export interface PropsDePanelesAlineados {
  readonly titulo: string;
  readonly periodo: PeriodoDelGrafico;
  readonly carriles: readonly Carril[];
  /** Solo las del área del gráfico; las de otra, a pedido y en el caso 1. */
  readonly bandas?: readonly BandaDeVersion[];
  /** `COMPACTA` en el panel de la estación. */
  readonly densidad?: DensidadDelGrafico;
  readonly leyenda?: readonly SentidoDeLaMarca[];
  /** Una línea debajo (la frase de la coincidencia, el método, «se leyó en tramos de 92 días»). */
  readonly notas?: readonly string[];
}

/** El espacio a la izquierda para las marcas del eje vertical, y a la derecha para que la última marca no se corte. */
const MARGEN_IZQUIERDO = 56;
const MARGEN_DERECHO = 16;
const ALTO_DEL_EJE_DE_FECHAS = 24;
const ALTO_DEL_CARRIL: Readonly<Record<DensidadDelGrafico, number>> = { COMPLETA: 140, COMPACTA: 96 };
const ALTO_DE_LOS_EVENTOS = 36;
const ANCHO_INICIAL = 720;

/** El ancho del contenedor, medido: el SVG no se estira, así la letra no baja de 12,5 px. */
function useAncho(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const medir = () => setAncho(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    medir();
    const o = new ResizeObserver(medir);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return [ref, ancho];
}

const formato = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

function DibujoDelCarril({ carril, escala, alto, bandas, fecha, tramo, ultimo }: { carril: Carril; escala: EscalaDeFechas; alto: number; bandas: readonly BandaDeVersion[]; fecha: string | null; tramo: { readonly desde: string; readonly hasta: string } | null; ultimo: boolean }) {
  const g = geometriaDelCarril(carril, escala, alto);
  const color = carril.tipo === 'PUNTOS' ? colorDelCarril(carril.indice) : 'var(--grafico-hueco)';
  const total = alto + (ultimo ? ALTO_DEL_EJE_DE_FECHAS : 0);
  const xDe = (f: string) => escala.x(f);
  return (
    <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
      {bandas.map((b, i) => {
        const x1 = xDe(b.desde < escala.desde ? escala.desde : b.desde) - escala.porDia / 2;
        const x2 = xDe(b.hasta === null || b.hasta > escala.hasta ? escala.hasta : b.hasta) + escala.porDia / 2;
        return x2 > x1 ? <rect key={`${b.desde}-${i}`} x={x1} y={0} width={x2 - x1} height={alto} fill={i % 2 === 0 ? 'var(--banda)' : 'transparent'} /> : null;
      })}
      {tramo ? <rect x={xDe(tramo.desde) - escala.porDia / 2} y={0} width={xDe(tramo.hasta) - xDe(tramo.desde) + escala.porDia} height={alto} fill="var(--grafico-cursor)" opacity={0.08} /> : null}
      {escala.marcas.map((m) => (
        <line key={m.fecha} x1={m.x} x2={m.x} y1={0} y2={alto} stroke="var(--borde)" strokeWidth={1} opacity={0.5} />
      ))}
      {g.tipo === 'PUNTOS' ? (
        <>
          {g.marcasY.map((m) => (
            <text key={m.valor} x={MARGEN_IZQUIERDO - 6} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {formato(m.valor, g.extremos.decimales)}
            </text>
          ))}
          {g.escalones.map((e, i) => (
            <line key={`e${i}`} x1={e.x1} x2={e.x2} y1={e.y} y2={e.y} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />
          ))}
          {g.lineas.map((l, i) => (
            <polyline key={`l${i}`} points={l.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={1.5} />
          ))}
          {g.indicado.map((m) => (
            <MarcaDelCarril key={`i${m.clave}`} marca={m.marca} cx={m.x} cy={m.y} yHasta={m.yHasta} porDia={escala.porDia} color={color} />
          ))}
          {g.marcas.map((m) => (
            <MarcaDelCarril key={m.clave} marca={m.marca} cx={m.x} cy={m.y} porDia={escala.porDia} color={color} tarde={m.tarde} />
          ))}
        </>
      ) : null}
      {g.tipo === 'BARRAS_SEMANALES'
        ? g.barras.map((b) => <rect key={b.lunes} x={b.x1 + 1} y={b.y} width={Math.max(1, b.x2 - b.x1 - 2)} height={Math.max(0, b.base - b.y)} fill="none" stroke={color} strokeWidth={1.5} />)
        : null}
      {g.tipo === 'EVENTOS'
        ? g.eventos.map((e) => (e.x2 === null ? <circle key={e.clave} cx={e.x1} cy={alto / 2} r={5} fill="var(--superficie)" stroke={color} strokeWidth={2} /> : <rect key={e.clave} x={e.x1} y={alto / 2 - 4} width={Math.max(2, e.x2 - e.x1)} height={8} fill={color} opacity={0.6} />))
        : null}
      {fecha ? <line x1={xDe(fecha)} x2={xDe(fecha)} y1={0} y2={alto} stroke="var(--grafico-cursor)" strokeWidth={1.5} /> : null}
      {ultimo
        ? escala.marcas.map((m) => (
            <text key={`t${m.fecha}`} x={m.x} y={alto + ALTO_DEL_EJE_DE_FECHAS - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {m.texto}
            </text>
          ))
        : null}
    </svg>
  );
}

export function PanelesAlineados({ titulo, periodo, carriles, bandas = [], densidad = 'COMPLETA', leyenda = [], notas = [] }: PropsDePanelesAlineados) {
  const [ref, ancho] = useAncho();
  const conPuntero = useConPuntero();
  const cursor = useCursorDeFechas();
  const idDelResumen = useId();
  const escala = useMemo(() => escalaDeFechas(periodo, { izquierda: MARGEN_IZQUIERDO, derecha: ancho - MARGEN_DERECHO }), [periodo, ancho]);
  const fechas = useMemo(() => fechasConObservacion(carriles), [carriles]);
  const tabla = useMemo(() => tablaEquivalente(carriles), [carriles]);
  const [encima, setEncima] = useState<string | null>(null);
  const fecha = encima ?? cursor.fecha;
  const alto = ALTO_DEL_CARRIL[densidad];

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const nuevo = moverElCursor(fechas, { fecha: cursor.fecha, tramo: cursor.tramo }, e.key, e.shiftKey);
    if (nuevo === null) return;
    e.preventDefault();
    cursor.fijar(nuevo);
  };
  const fechaDelPuntero = (e: { readonly clientX: number; readonly currentTarget: HTMLDivElement }): string => {
    const caja = e.currentTarget.getBoundingClientRect();
    const escalaX = (escala.derecha + MARGEN_DERECHO) / Math.max(1, caja.width);
    return escala.fechaDeX((e.clientX - caja.left) * escalaX);
  };
  const descripcion = carriles
    .map((c) => (c.tipo === 'EVENTOS' ? `${c.nombre}: ${c.eventos.length} hechos.` : `${c.nombre} (${c.unidad}): ${c.descripcion}`))
    .join(' ');
  const tarde = carriles.flatMap((c) => (c.tipo === 'PUNTOS' ? [lineaDeLoCargadoTarde(c)] : [])).filter((t): t is string => t !== null);

  return (
    <div className={`grafico-base grafico-base--${densidad.toLowerCase()}`}>
      <h3 className="grafico-base__titulo">{titulo}</h3>
      <NotaDelInicio periodo={periodo} />
      <div
        ref={ref}
        className="grafico-base__area"
        tabIndex={0}
        role="group"
        aria-roledescription="gráfico"
        aria-label={`${titulo}. ${COPY_DE_LOS_GRAFICOS.comoSeUsa}`}
        aria-describedby={idDelResumen}
        onKeyDown={alTeclear}
        onPointerMove={(e) => {
          if (conPuntero && e.pointerType === 'mouse') setEncima(fechaDelPuntero(e));
        }}
        onPointerLeave={() => setEncima(null)}
        onClick={(e) => cursor.elegir(fechaDelPuntero(e))}
      >
        {carriles.map((c, i) => (
          <div key={c.id} className="grafico-base__carril">
            <p className="grafico-base__carril-nombre">
              {c.nombre}
              {c.tipo !== 'EVENTOS' ? <span className="grafico-base__unidad"> · {c.unidad}</span> : null}
              {c.tipo === 'PUNTOS' && c.metodo ? <span className="grafico-base__metodo"> · {c.metodo}</span> : null}
            </p>
            <DibujoDelCarril carril={c} escala={escala} alto={c.tipo === 'EVENTOS' ? ALTO_DE_LOS_EVENTOS : alto} bandas={c.tipo === 'EVENTOS' ? [] : bandas} fecha={fecha} tramo={cursor.tramo} ultimo={i === carriles.length - 1} />
          </div>
        ))}
      </div>
      <p id={idDelResumen} className="visualmente-oculto">
        {descripcion}
      </p>
      <LecturaEnLaFecha tabla={tabla} fecha={cursor.fecha} tramo={cursor.tramo} />
      {tarde.map((t) => (
        <p key={t} className="nota">
          {t.charAt(0).toUpperCase() + t.slice(1)}.
        </p>
      ))}
      <Leyenda sentidos={leyenda} />
      {notas.map((n) => (
        <p key={n} className="nota grafico-base__nota">
          {n}
        </p>
      ))}
      <TablaEquivalente titulo={titulo} tabla={tabla} />
    </div>
  );
}
