'use client';

/**
 * «Superpuestas» en SVG propio (GR-26; WP-GRAFICOS fase 2, DL-174): hasta tres series en el mismo gráfico, sobre el eje
 * de fechas común, con uno o dos ejes verticales. Cada eje tiene su rótulo con el nombre corto de sus series, la unidad y
 * su glifo; el nombre de cada serie va además al final de su línea. La escala de cada eje es la de «Alineadas»
 * (`superpuestas.ts`). Con dos ejes, «Cómo leerlo» dice que un cruce de líneas no quiere decir nada, y va la frase.
 *
 * Accesibilidad, como `PanelesAlineados`: el área es un grupo con nombre que recibe el foco (flechas, Inicio, Fin,
 * Mayúscula con flechas y Escape), el SVG no se lee, la lectura de la fecha es una región viva y la tabla dice lo mismo
 * que el dibujo, con una columna por serie y su unidad.
 */
import type { SentidoDeLaMarca } from '@be/domain';
import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { useConPuntero } from '../../../../../lib/graficos';
import { LETRA_MINIMA } from '../../seguimiento/geometria';
import { fechasConObservacion, type BandaDeVersion, type CarrilDePuntos } from '../carriles';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import { useCursorDeFechas } from '../cursor-de-fechas';
import { escalaDeFechas, moverElCursor, type PeriodoDelGrafico } from '../eje-de-fechas';
import { NotaDelInicio } from '../estado-del-grafico';
import { LecturaEnLaFecha } from '../lectura-en-la-fecha';
import { colorDelCarril, Leyenda, MarcaDelCarril } from '../marcas';
import { ALTO_DEL_EJE_DE_FECHAS, MARGEN_IZQUIERDO, useAnchoDelGrafico } from '../medidas-del-grafico';
import type { DensidadDelGrafico } from '../paneles-alineados';
import { tablaEquivalente } from '../tabla-equivalente';
import { TablaEquivalente } from '../tabla-equivalente-en-pantalla';
import { COMO_LEER_DOS_EJES, type Lado } from './compositor';
import { geometriaSuperpuesta, type EjeSuperpuesto } from './superpuestas';

export interface PropsDeSuperpuestas {
  readonly titulo: string;
  readonly periodo: PeriodoDelGrafico;
  readonly carriles: readonly CarrilDePuntos[];
  /** El lado del eje de cada carril, en su orden (de `superposicionDeLasElegidas`). */
  readonly lados: readonly Lado[];
  /** El nombre corto de cada carril: va en el rótulo de su eje y al final de su línea. */
  readonly nombresCortos: readonly string[];
  readonly bandas?: readonly BandaDeVersion[];
  readonly densidad?: DensidadDelGrafico;
  readonly leyenda?: readonly SentidoDeLaMarca[];
  /** La frase de la coincidencia, cuando corresponde (dos áreas o dos ejes); `null` si no. */
  readonly frase: string | null;
}

const EJE_DERECHO = 52;
const LUGAR_DE_LOS_NOMBRES = 128;
const ALTO: Readonly<Record<DensidadDelGrafico, number>> = { COMPLETA: 240, COMPACTA: 160 };

const formato = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/** El glifo de un eje: una raya con un punto por cada serie, del color de cada una. */
function GlifoDelEje({ eje }: { eje: EjeSuperpuesto }) {
  return (
    <svg width={18 * eje.indices.length + 4} height={14} viewBox={`0 0 ${18 * eje.indices.length + 4} 14`} aria-hidden="true">
      {eje.indices.map((indice, i) => (
        <g key={`${indice}-${i}`}>
          <line x1={2 + 18 * i} x2={18 + 18 * i} y1={7} y2={7} stroke={colorDelCarril(indice)} strokeWidth={1.5} />
          <circle cx={10 + 18 * i} cy={7} r={3.5} fill={colorDelCarril(indice)} />
        </g>
      ))}
    </svg>
  );
}

export function GraficoSuperpuesto({ titulo, periodo, carriles, lados, nombresCortos, bandas = [], densidad = 'COMPLETA', leyenda = [], frase }: PropsDeSuperpuestas) {
  const [ref, ancho] = useAnchoDelGrafico();
  const conPuntero = useConPuntero();
  const cursor = useCursorDeFechas();
  const idDelResumen = useId();
  const dosEjes = new Set(lados).size > 1;
  const derecha = ancho - LUGAR_DE_LOS_NOMBRES - (dosEjes ? EJE_DERECHO : 0);
  const escala = useMemo(() => escalaDeFechas(periodo, { izquierda: MARGEN_IZQUIERDO, derecha }), [periodo, derecha]);
  const alto = ALTO[densidad];
  const g = useMemo(() => geometriaSuperpuesta(carriles, lados, nombresCortos, escala, alto, escala.derecha + (dosEjes ? EJE_DERECHO : 0) + 10), [carriles, lados, nombresCortos, escala, alto, dosEjes]);
  const fechas = useMemo(() => fechasConObservacion(carriles), [carriles]);
  const tabla = useMemo(() => tablaEquivalente(carriles), [carriles]);
  const [encima, setEncima] = useState<string | null>(null);
  const fecha = encima ?? cursor.fecha;
  const total = alto + ALTO_DEL_EJE_DE_FECHAS;
  const izquierdo = g.ejes.find((e) => e.lado === 'IZQUIERDA') ?? null;
  const derecho = g.ejes.find((e) => e.lado === 'DERECHA') ?? null;
  const fuera = g.series.reduce((n, s) => n + s.fueraDeLaEscala, 0);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const nuevo = moverElCursor(fechas, { fecha: cursor.fecha, tramo: cursor.tramo }, e.key, e.shiftKey);
    if (nuevo === null) return;
    e.preventDefault();
    cursor.fijar(nuevo);
  };
  const fechaDelPuntero = (e: { readonly clientX: number; readonly currentTarget: HTMLDivElement }): string => {
    const caja = e.currentTarget.getBoundingClientRect();
    return escala.fechaDeX(((e.clientX - caja.left) * ancho) / Math.max(1, caja.width));
  };
  const descripcion = carriles.map((c, i) => `${c.nombre} (${c.unidad}, eje ${lados[i] === 'DERECHA' ? 'derecho' : 'izquierdo'}): ${c.descripcion}`).join(' ');
  const notas = [...(frase ? [frase] : []), ...(dosEjes ? [COMO_LEER_DOS_EJES] : []), ...(fuera > 0 ? [COPY_DE_LOS_GRAFICOS.fueraDeLaEscala(fuera)] : [])];

  return (
    <div className={`grafico-base superpuestas grafico-base--${densidad.toLowerCase()}`}>
      <h3 className="grafico-base__titulo">{titulo}</h3>
      <NotaDelInicio periodo={periodo} />
      <div className="superpuestas__ejes">
        {izquierdo ? (
          <p className="superpuestas__eje" data-lado="IZQUIERDA">
            <GlifoDelEje eje={izquierdo} />
            <span>
              <span className="visualmente-oculto">Eje izquierdo: </span>
              {izquierdo.rotulo}
            </span>
          </p>
        ) : null}
        {derecho ? (
          <p className="superpuestas__eje superpuestas__eje--derecho" data-lado="DERECHA">
            <span>
              <span className="visualmente-oculto">Eje derecho: </span>
              {derecho.rotulo}
            </span>
            <GlifoDelEje eje={derecho} />
          </p>
        ) : null}
      </div>
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
        <svg width="100%" height={total} viewBox={`0 0 ${ancho} ${total}`} aria-hidden="true" className="grafico-base__svg">
          {bandas.map((b, i) => {
            const x1 = escala.x(b.desde < escala.desde ? escala.desde : b.desde) - escala.porDia / 2;
            const x2 = escala.x(b.hasta === null || b.hasta > escala.hasta ? escala.hasta : b.hasta) + escala.porDia / 2;
            return x2 > x1 ? <rect key={`${b.desde}-${i}`} x={x1} y={0} width={x2 - x1} height={alto} fill={i % 2 === 0 ? 'var(--banda)' : 'transparent'} /> : null;
          })}
          {escala.marcas.map((m) => (
            <g key={m.fecha}>
              <line x1={m.x} x2={m.x} y1={0} y2={alto} stroke="var(--borde)" strokeWidth={1} opacity={0.5} />
              <text x={m.x} y={alto + ALTO_DEL_EJE_DE_FECHAS - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                {m.texto}
              </text>
            </g>
          ))}
          {izquierdo?.marcas.map((m) => (
            <text key={`i${m.valor}`} x={MARGEN_IZQUIERDO - 6} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {formato(m.valor, izquierdo.extremos.decimales)}
            </text>
          ))}
          {derecho?.marcas.map((m) => (
            <text key={`d${m.valor}`} x={escala.derecha + 6} y={m.y} textAnchor="start" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {formato(m.valor, derecho.extremos.decimales)}
            </text>
          ))}
          {g.series.map((s) => {
            const color = colorDelCarril(s.indice);
            return (
              <g key={s.id} data-lado={s.lado}>
                {s.lineas.map((l, i) => (
                  <polyline key={`l${i}`} points={l.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={1.5} />
                ))}
                {s.marcas.map((m) => (
                  <MarcaDelCarril key={m.clave} marca={m.marca} cx={m.x} cy={m.y} porDia={escala.porDia} color={color} tarde={m.tarde} />
                ))}
                {s.rotulo ? (
                  <text x={s.rotulo.x} y={s.rotulo.y} dominantBaseline="central" fontSize={LETRA_MINIMA} fontWeight={600} fill="var(--texto)">
                    {s.rotulo.texto.length > 18 ? `${s.rotulo.texto.slice(0, 17).trimEnd()}…` : s.rotulo.texto}
                  </text>
                ) : null}
              </g>
            );
          })}
          {fecha ? <line x1={escala.x(fecha)} x2={escala.x(fecha)} y1={0} y2={alto} stroke="var(--grafico-cursor)" strokeWidth={1.5} /> : null}
        </svg>
      </div>
      <p id={idDelResumen} className="visualmente-oculto">
        {descripcion}
      </p>
      <LecturaEnLaFecha tabla={tabla} fecha={cursor.fecha} tramo={cursor.tramo} />
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
