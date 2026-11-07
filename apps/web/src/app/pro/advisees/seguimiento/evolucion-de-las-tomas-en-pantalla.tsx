'use client';

/**
 * La evolución de las últimas tomas, en la tarjeta de Antropometría del Resumen (WP-TABLERO-ALTA-GAMA TB-50). Las cuentas
 * son de `evolucion-de-las-tomas.ts`, sin React; acá se dibujan. Cada par de medidas, en las mismas columnas (una por
 * toma, con su fecha arriba): una fila por medida, con su línea, el valor escrito sobre cada punto y la diferencia al
 * costado. El dibujo es decorativo: lo que dice está escrito al lado y, entero, en la tabla para el lector de pantalla
 * (WCAG 1.1.1). Ninguna marca cambia de color por su valor.
 */
import { numero } from '@be/domain';
import Link from 'next/link';
import { useMemo } from 'react';
import { diaCivil, diaYMesCivil } from '../../../../lib/formato';
import type { TomaDeLaComposicion } from './composicion';
import { useAncho } from './composicion-en-pantalla';
import {
  ALTO_DE_LA_FILA,
  COMO_SE_LEE_LA_EVOLUCION,
  escalasDeLaEvolucion,
  evolucionDeLasTomas,
  geometriaDeLaFila,
  MARGEN_DE_LAS_COLUMNAS,
  MAXIMO_DE_TOMAS,
  notaDeLaFila,
  resumenDeLaEvolucion,
  textoDeLaFila,
  UNA_SOLA_TOMA_CON_MEDIDAS,
  valorEnPalabras,
  xDeLaColumna,
  type EscalaDeLaFila,
  type EvolucionDeLasTomas,
  type FilaDeLaEvolucion,
} from './evolucion-de-las-tomas';
import { LETRA_MINIMA, medidaDeMarca, RANGO_MINIMO_POR_UNIDAD } from './geometria';
import { Punto } from './marca';
import { Pieza } from './pieza-del-area';

/** Las dos filas de un par, en dos colores de métrica: se distinguen además por su nombre, escrito al lado. */
const COLOR_DE_LA_FILA = ['var(--metrica-1)', 'var(--metrica-2)'] as const;
/** El nombre y la diferencia, a los costados del dibujo (los anchos de `.evolucion-de-las-tomas__fila`, en px). */
const NOMBRE = 88;
const DIFERENCIA = 72;
const ESPACIOS = 16;
/** Lo que necesita cada columna para que su valor («100,5») no pise el de al lado; con menos, van tres tomas. */
const LUGAR_POR_COLUMNA = 36;

export function EvolucionDeLasTomasEnLaTarjeta({ tomas, plegada, href }: { tomas: readonly TomaDeLaComposicion[]; plegada: boolean; href: string }) {
  const [caja, ancho] = useAncho();
  const dibujo = Math.max(0, ancho - NOMBRE - DIFERENCIA - ESPACIOS);
  // Hasta cuatro tomas; si el dibujo no tiene lugar para cuatro valores sin pisarse, tres.
  const entran = dibujo === 0 || dibujo - 2 * MARGEN_DE_LAS_COLUMNAS >= (MAXIMO_DE_TOMAS - 1) * LUGAR_POR_COLUMNA ? MAXIMO_DE_TOMAS : MAXIMO_DE_TOMAS - 1;
  const e = useMemo(() => evolucionDeLasTomas(tomas, entran), [tomas, entran]);
  if (e.pares.length === 0) return null;
  const resumen = resumenDeLaEvolucion(e);
  const cuantas = e.columnas.length === 1 ? 'una toma' : `${numero(e.columnas.length, 0)} tomas`;
  return (
    <Pieza titulo="Evolución en las últimas tomas" plegada={plegada} aLaVista={plegada ? <span className="tenue evolucion-de-las-tomas__a-la-vista">{resumen ?? cuantas}</span> : null}>
      <div ref={caja} className="evolucion-de-las-tomas" data-pieza="evolucion" data-columnas={e.columnas.length}>
        {e.columnas.length < 2 ? (
          <p className="pieza-del-area__nota">{UNA_SOLA_TOMA_CON_MEDIDAS}</p>
        ) : dibujo > 0 ? (
          <Dibujo e={e} ancho={dibujo} />
        ) : null}
        <TablaDeLaEvolucion e={e} />
        <p className="pieza-del-area__nota">{COMO_SE_LEE_LA_EVOLUCION}</p>
        <p className="pieza-del-area__nota">
          <Link href={href}>Ver la evolución de todas las medidas</Link>
        </p>
      </div>
    </Pieza>
  );
}

function Dibujo({ e, ancho }: { e: EvolucionDeLasTomas; ancho: number }) {
  const escalas = escalasDeLaEvolucion(e, RANGO_MINIMO_POR_UNIDAD);
  const n = e.columnas.length;
  const fecha = (i: number) => diaYMesCivil(e.columnas[i]?.fecha ?? '');
  return (
    <div aria-hidden="true">
      <div className="evolucion-de-las-tomas__fila evolucion-de-las-tomas__fechas">
        <span />
        <svg width={ancho} height={16} viewBox={`0 0 ${ancho} 16`} focusable="false">
          {e.columnas.map((c, i) => (
            <text key={c.evaluacionId} x={xDeLaColumna(i, n, ancho)} y={12} textAnchor="middle" fill="var(--tenue)" fontSize={LETRA_MINIMA}>
              {fecha(i)}
            </text>
          ))}
        </svg>
        <span />
      </div>
      {e.pares.map((p) => {
        const notas = p.filas.map((f) => notaDeLaFila(f, fecha)).filter((x): x is string => x !== null);
        return (
          <div key={p.par.clave} className="evolucion-de-las-tomas__par" data-par={p.par.clave}>
            <p className="evolucion-de-las-tomas__titulo">{p.par.titulo}</p>
            {p.filas.map((f, i) => (
              <FilaEnPantalla key={f.metrica} fila={f} escala={escalas.get(f.metrica) ?? null} ancho={ancho} color={COLOR_DE_LA_FILA[i] ?? COLOR_DE_LA_FILA[0]} />
            ))}
            {notas.map((x) => (
              <p key={x} className="pieza-del-area__nota">
                {x}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function FilaEnPantalla({ fila, escala, ancho, color }: { fila: FilaDeLaEvolucion; escala: EscalaDeLaFila | null; ancho: number; color: string }) {
  const g = escala ? geometriaDeLaFila(fila, escala, ancho) : null;
  return (
    <div className="evolucion-de-las-tomas__fila" data-metrica={fila.metrica}>
      <span className="evolucion-de-las-tomas__nombre">
        {fila.nombre}
        {fila.unidad ? <span className="tenue"> · {fila.unidad}</span> : null}
      </span>
      <svg width={ancho} height={ALTO_DE_LA_FILA} viewBox={`0 0 ${ancho} ${ALTO_DE_LA_FILA}`} focusable="false">
        {g ? (
          <>
            {g.trazos.map((d) => (
              <path key={d} d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {g.huecos.map((x) => (
              <text key={`hueco-${x}`} x={x} y={ALTO_DE_LA_FILA / 2 + 8} textAnchor="middle" fill="var(--tenue)" fontSize={LETRA_MINIMA}>
                —
              </text>
            ))}
            {g.puntos.map((p) => {
              const medida = medidaDeMarca(p.estado, g.lugar);
              return (
                <g key={p.columna} data-columna={p.columna}>
                  <Punto cx={p.x} cy={p.y} color={color} medida={medida} corregido={p.corregido} />
                  <text x={p.x} y={Math.max(LETRA_MINIMA - 1, p.y - medida.R - 3)} textAnchor="middle" fill={p.ultimo ? 'var(--texto)' : 'var(--tenue)'} fontSize={LETRA_MINIMA} fontWeight={p.ultimo ? 600 : 400} className="cifra">
                    {valorEnPalabras(p.valor)}
                  </text>
                </g>
              );
            })}
          </>
        ) : (
          <text x={ancho / 2} y={ALTO_DE_LA_FILA / 2 + 4} textAnchor="middle" fill="var(--tenue)" fontSize={LETRA_MINIMA}>
            —
          </text>
        )}
      </svg>
      <span className={fila.diferencia ? 'evolucion-de-las-tomas__diferencia cifra' : 'evolucion-de-las-tomas__diferencia tenue'}>{textoDeLaFila(fila)}</span>
    </div>
  );
}

/** Lo mismo que el dibujo, para el lector de pantalla: una fila por medida, una columna por toma y la diferencia. */
function TablaDeLaEvolucion({ e }: { e: EvolucionDeLasTomas }) {
  return (
    <table className="visualmente-oculto">
      <caption>Evolución en las últimas tomas: cada medida en su unidad, una columna por toma</caption>
      <thead>
        <tr>
          <th scope="col">Medida</th>
          {e.columnas.map((c) => (
            <th key={c.evaluacionId} scope="col">
              {diaCivil(c.fecha)}
            </th>
          ))}
          <th scope="col">Diferencia</th>
        </tr>
      </thead>
      <tbody>
        {e.pares.flatMap((p) =>
          p.filas.map((f) => (
            <tr key={f.metrica}>
              <th scope="row">{f.nombre}</th>
              {f.valores.map((v, i) => (
                <td key={e.columnas[i]?.evaluacionId ?? i}>{v ? `${valorEnPalabras(v.valor)} ${v.unidad}` : 'sin medir'}</td>
              ))}
              <td>{[textoDeLaFila(f), notaDeLaFila(f, (i) => diaCivil(e.columnas[i]?.fecha ?? ''))].filter(Boolean).join('. ')}</td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  );
}
