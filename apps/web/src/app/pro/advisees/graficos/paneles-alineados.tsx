'use client';

/**
 * Los paneles alineados (WP-GRAFICOS fase 2, DL-174; GR-26 «Alineadas»): los carriles apilados, uno arriba del otro, con
 * un solo eje de fechas escrito bajo el último. Cada carril tiene su unidad y su escala; las bandas son las versiones
 * del plan del área del gráfico, con su etiqueta arriba del primer carril; la regla del cursor cruza todos los carriles a
 * la vez. Debajo de cada carril va la tira de cobertura: el estado de cada día por la altura además del color, con una
 * muesca arriba de los días cargados después. Un carril de eventos es la cinta del tiempo (GR-23).
 *
 * Accesibilidad: el contenedor es un grupo con nombre y su descripción apunta al resumen en texto; el SVG no se lee. El
 * área del gráfico recibe el foco: flechas, Inicio, Fin, Mayúscula con flechas (un tramo) y Escape. Pasar el mouse mueve
 * la regla solo con un puntero fino; tocar o hacer clic la fija. La lectura de la fecha y la tabla dicen lo mismo que el
 * dibujo.
 */
import type { SentidoDeLaMarca } from '@be/domain';
import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { useConPuntero } from '../../../../lib/graficos';
import { LETRA_MINIMA } from '../seguimiento/geometria';
import { geometriaDelCarril, fechasConObservacion, lineaDeLoCargadoTarde, type BandaDeVersion, type Carril, type CarrilDePuntos, type GeometriaDelCarril } from './carriles';
import { geometriaDeLaCinta, resumenDeLaCinta, type GeometriaDeLaCinta } from './cinta-del-tiempo';
import { DibujoDeLaCinta } from './dibujo-de-la-cinta';
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { useCursorDeFechas } from './cursor-de-fechas';
import { escalaDeFechas, moverElCursor, type EscalaDeFechas, type PeriodoDelGrafico } from './eje-de-fechas';
import { LecturaEnLaFecha } from './lectura-en-la-fecha';
import { colorDelCarril, Leyenda, MarcaDelCarril } from './marcas';
import { ALTO_DEL_EJE_DE_FECHAS, MARGEN_DERECHO, MARGEN_IZQUIERDO, useAnchoDelGrafico } from './medidas-del-grafico';
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

const ALTO_DEL_CARRIL: Readonly<Record<DensidadDelGrafico, number>> = { COMPLETA: 140, COMPACTA: 96 };
/** La franja de arriba del primer carril, para la etiqueta de cada versión del plan. */
const FRANJA_DE_ROTULOS = 18;
/** La tira de cobertura: 6 de alto, 4 por debajo del carril, y 4 de aire hasta lo que sigue. */
const SEPARACION_DE_LA_TIRA = 4;
const ALTO_DE_LA_TIRA = 6;
const ZONA_DE_LA_TIRA = SEPARACION_DE_LA_TIRA + ALTO_DE_LA_TIRA + 4;
/** El ancho aproximado de una letra de 12,5 px, para no escribir una etiqueta que no entra. */
const ANCHO_DE_UNA_LETRA = 7;

const formato = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

type Geometria = { readonly tipo: 'CARRIL'; readonly g: GeometriaDelCarril } | { readonly tipo: 'CINTA'; readonly g: GeometriaDeLaCinta };

/** La etiqueta de cada banda que entra en su ancho: «v3 · desde el 2/9», o solo «v3», o nada. */
function rotulosDeLasBandas(bandas: readonly BandaDeVersion[], escala: EscalaDeFechas): readonly { readonly x: number; readonly texto: string }[] {
  return bandas.flatMap((b) => {
    if ((b.hasta !== null && b.hasta < escala.desde) || b.desde > escala.hasta) return [];
    const x1 = escala.x(b.desde < escala.desde ? escala.desde : b.desde) - escala.porDia / 2;
    const x2 = escala.x(b.hasta === null || b.hasta > escala.hasta ? escala.hasta : b.hasta) + escala.porDia / 2;
    const lugar = x2 - x1 - 8;
    const corto = b.rotulo.split(' · ')[0] ?? b.rotulo;
    const texto = [b.rotulo, corto].find((t) => t.length * ANCHO_DE_UNA_LETRA <= lugar);
    return texto ? [{ x: x1 + 4, texto }] : [];
  });
}

/** La tira de cobertura de un carril: entera con dato, a media altura con algo que falta, una raya baja sin registros. */
function TiraDeCobertura({ carril, escala, y, color }: { carril: CarrilDePuntos; escala: EscalaDeFechas; y: number; color: string }) {
  const tarde = new Set(carril.puntos.filter((p) => p.valor !== null && p.tarde).map((p) => p.fecha));
  const ancho = Math.max(1, escala.porDia - (escala.porDia >= 4 ? 1 : 0));
  return (
    <g className="grafico-base__tira" shapeRendering={escala.porDia < 4 ? 'crispEdges' : undefined}>
      {carril.cobertura
        .filter((d) => d.fecha >= escala.desde && d.fecha <= escala.hasta)
        .map((d) => {
          const x = escala.x(d.fecha) - escala.porDia / 2;
          return (
            <g key={d.fecha} data-estado={d.estado}>
              {d.estado === 'con' ? <rect x={x} y={y} width={ancho} height={ALTO_DE_LA_TIRA} fill={color} /> : null}
              {d.estado === 'hueco' ? <rect x={x} y={y + ALTO_DE_LA_TIRA / 2} width={ancho} height={ALTO_DE_LA_TIRA / 2} fill={color} /> : null}
              {d.estado === 'sin' ? <rect x={x} y={y + ALTO_DE_LA_TIRA - 1.5} width={ancho} height={1.5} fill="var(--grafico-hueco)" /> : null}
              {tarde.has(d.fecha) ? <rect x={x + ancho / 2 - 0.75} y={y - 3} width={1.5} height={2.5} fill="var(--texto)" /> : null}
            </g>
          );
        })}
    </g>
  );
}

function DibujoDelCarril({
  carril,
  geometria,
  escala,
  alto,
  bandas,
  fecha,
  tramo,
  primero,
  ultimo,
}: {
  carril: Carril;
  geometria: Geometria;
  escala: EscalaDeFechas;
  alto: number;
  bandas: readonly BandaDeVersion[];
  fecha: string | null;
  tramo: { readonly desde: string; readonly hasta: string } | null;
  primero: boolean;
  ultimo: boolean;
}) {
  const color = carril.tipo === 'PUNTOS' ? colorDelCarril(carril.indice) : 'var(--grafico-hueco)';
  const conTira = carril.tipo === 'PUNTOS' && carril.cobertura.length > 0;
  const arriba = primero && bandas.length > 0 ? FRANJA_DE_ROTULOS : 0;
  const total = arriba + alto + (conTira ? ZONA_DE_LA_TIRA : 0) + (ultimo ? ALTO_DEL_EJE_DE_FECHAS : 0);
  const xDe = (f: string) => escala.x(f);
  const g = geometria.tipo === 'CARRIL' ? geometria.g : null;
  return (
    <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
      {bandas.map((b, i) => {
        const x1 = xDe(b.desde < escala.desde ? escala.desde : b.desde) - escala.porDia / 2;
        const x2 = xDe(b.hasta === null || b.hasta > escala.hasta ? escala.hasta : b.hasta) + escala.porDia / 2;
        return x2 > x1 ? <rect key={`${b.desde}-${i}`} x={x1} y={0} width={x2 - x1} height={arriba + alto} fill={i % 2 === 0 ? 'var(--banda)' : 'transparent'} /> : null;
      })}
      {arriba > 0
        ? rotulosDeLasBandas(bandas, escala).map((r) => (
            <text key={`r${r.x}`} className="grafico-base__rotulo-de-version" x={r.x} y={FRANJA_DE_ROTULOS / 2} dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {r.texto}
            </text>
          ))
        : null}
      <g transform={`translate(0 ${arriba})`}>
        {tramo ? <rect x={xDe(tramo.desde) - escala.porDia / 2} y={0} width={xDe(tramo.hasta) - xDe(tramo.desde) + escala.porDia} height={alto} fill="var(--grafico-cursor)" opacity={0.08} /> : null}
        {escala.marcas.map((m) => (
          <line key={m.fecha} x1={m.x} x2={m.x} y1={0} y2={alto} stroke="var(--borde)" strokeWidth={1} opacity={0.5} />
        ))}
        {g && g.tipo === 'PUNTOS' ? (
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
        {g && g.tipo === 'BARRAS_SEMANALES'
          ? g.barras.map((b) => <rect key={b.lunes} x={b.x1 + 1} y={b.y} width={Math.max(1, b.x2 - b.x1 - 2)} height={Math.max(0, b.base - b.y)} fill="none" stroke={color} strokeWidth={1.5} />)
          : null}
        {geometria.tipo === 'CINTA' ? <DibujoDeLaCinta g={geometria.g} escala={escala} /> : null}
        {fecha ? <line x1={xDe(fecha)} x2={xDe(fecha)} y1={0} y2={alto} stroke="var(--grafico-cursor)" strokeWidth={1.5} /> : null}
        {conTira && carril.tipo === 'PUNTOS' ? <TiraDeCobertura carril={carril} escala={escala} y={alto + SEPARACION_DE_LA_TIRA} color={color} /> : null}
      </g>
      {ultimo
        ? escala.marcas.map((m) => (
            <text key={`t${m.fecha}`} x={m.x} y={total - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {m.texto}
            </text>
          ))
        : null}
    </svg>
  );
}

export function PanelesAlineados({ titulo, periodo, carriles, bandas = [], densidad = 'COMPLETA', leyenda = [], notas = [] }: PropsDePanelesAlineados) {
  const [ref, ancho] = useAnchoDelGrafico();
  const conPuntero = useConPuntero();
  const cursor = useCursorDeFechas();
  const idDelResumen = useId();
  const escala = useMemo(() => escalaDeFechas(periodo, { izquierda: MARGEN_IZQUIERDO, derecha: ancho - MARGEN_DERECHO }), [periodo, ancho]);
  const fechas = useMemo(() => fechasConObservacion(carriles), [carriles]);
  const tabla = useMemo(() => tablaEquivalente(carriles), [carriles]);
  const alto = ALTO_DEL_CARRIL[densidad];
  const geometrias = useMemo(
    () => carriles.map((c): Geometria => (c.tipo === 'EVENTOS' ? { tipo: 'CINTA', g: geometriaDeLaCinta(c.eventos, escala) } : { tipo: 'CARRIL', g: geometriaDelCarril(c, escala, alto) })),
    [carriles, escala, alto],
  );
  const [encima, setEncima] = useState<string | null>(null);
  const fecha = encima ?? cursor.fecha;

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
    .map((c) => (c.tipo === 'EVENTOS' ? `${c.nombre}: ${resumenDeLaCinta(c.eventos)}` : `${c.nombre} (${c.unidad}): ${c.descripcion}`))
    .join(' ');
  const tarde = carriles.flatMap((c) => (c.tipo === 'PUNTOS' ? [lineaDeLoCargadoTarde(c)] : [])).filter((t): t is string => t !== null);
  const fueraDeLaEscala = geometrias.reduce((n, x) => n + (x.tipo === 'CARRIL' && x.g.tipo === 'PUNTOS' ? x.g.fueraDeLaEscala : 0), 0);

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
        {carriles.map((c, i) => {
          const geometria = geometrias[i] as Geometria;
          return (
            <div key={c.id} className="grafico-base__carril">
              <p className="grafico-base__carril-nombre">
                {c.nombre}
                {c.tipo !== 'EVENTOS' ? <span className="grafico-base__unidad"> · {c.unidad}</span> : null}
                {c.tipo === 'PUNTOS' && c.metodo ? <span className="grafico-base__metodo"> · {c.metodo}</span> : null}
              </p>
              <DibujoDelCarril
                carril={c}
                geometria={geometria}
                escala={escala}
                alto={geometria.tipo === 'CINTA' ? Math.max(geometria.g.alto, 1) : alto}
                bandas={c.tipo === 'EVENTOS' ? [] : bandas}
                fecha={fecha}
                tramo={cursor.tramo}
                primero={i === carriles.findIndex((x) => x.tipo !== 'EVENTOS')}
                ultimo={i === carriles.length - 1}
              />
            </div>
          );
        })}
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
      {fueraDeLaEscala > 0 ? <p className="nota grafico-base__nota">{COPY_DE_LOS_GRAFICOS.fueraDeLaEscala(fueraDeLaEscala)}</p> : null}
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
