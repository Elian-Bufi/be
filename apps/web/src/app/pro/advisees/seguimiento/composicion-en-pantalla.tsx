'use client';

/**
 * La pieza «Composición corporal» (WP-TABLERO-ALTA-GAMA TB-24; DL-163 D-11; propuesta, §18.3), la misma en la pestaña
 * Antropometría y en la pregunta de «Analizar». Las cuentas son de `composicion.ts`, sin React; acá se lee y se dibuja.
 * - **Arriba, «De qué está hecho el peso»:** una columna por toma, en su fecha y desde cero; abajo la masa libre de grasa
 *   y arriba la masa grasa, con un corte fino entre las dos, solo cuando el método parte el peso. Las demás, en contorno.
 * - **Abajo, «Cuánto cambió cada parte»:** el peso, la masa grasa y la masa libre de grasa, cada una en su fila con las
 *   mismas fechas y la misma vara, con la primera y la última cifra y la diferencia. Lo que no suma el peso, en su fila.
 * - **La tabla,** con cada toma y cómo va en el gráfico: lo mismo que el dibujo, para el lector de pantalla.
 * Lee API-ANT-06, sin tocar la API: un período de más de 92 días se lee en tramos.
 */
import { COPY_ANTROPOMETRIA, COPY_VINCULO, numero } from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { BloqueDeEstado, Cargando } from '../../../../components/estados';
import { api, type Resultado } from '../../../../lib/api';
import { motivoDeFalla, razonDeFalla, ICONO_DE_FALLA, type MotivoDeFalla } from '../../../../lib/fallas';
import { diaCivil, diaDelAnioEnCurso } from '../../../../lib/formato';
import {
  composicionDe,
  DOS_COMPARTIMENTOS,
  escalaComun,
  METRICAS_DE_LA_COMPOSICION,
  NO_SUMA_CON_LAS_OTRAS,
  redondeoQueNoCierra,
  TEXTO_DEL_CAMBIO,
  textoDeLaParticion,
  textoSinPartir,
  tomasDeLaEvolucion,
  tramosDeLectura,
  UNA_SOLA_TOMA,
  diferenciaEnPalabras,
  type Composicion,
  type Familia,
  type FilaDelCambio,
  type TomaDeLaComposicion,
} from './composicion';
import { limitarLectura } from './contexto';
import { LETRA_MINIMA } from './geometria';

export type LecturaDeLaComposicion =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly tomas: readonly TomaDeLaComposicion[]; readonly parcial: boolean }
  | { readonly tipo: 'no-disponible' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/**
 * Lee la composición de un período con API-ANT-06, en tramos de 92 días (su tope), pidiendo solo el peso y las masas.
 * Si un tramo no está disponible (404, sin acceso), la pieza entera tampoco; si un tramo falla, se dice y se reintenta.
 */
export function useLecturaDeLaComposicion(
  token: string,
  asesoradoId: string,
  desde: string | null,
  hasta: string | null,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
): { readonly lectura: LecturaDeLaComposicion; readonly recargar: () => void } {
  const [lectura, setLectura] = useState<LecturaDeLaComposicion>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    if (!desde || !hasta) return;
    let vigente = true;
    setLectura({ tipo: 'cargando' });
    const metric = METRICAS_DE_LA_COMPOSICION.join(',');
    void Promise.all(tramosDeLectura(desde, hasta).map((t) => limitarLectura(() => api.evolucionAntropometrica(token, asesoradoId, { periodStart: t.desde, periodEnd: t.hasta, metric })))).then((rs) => {
      if (!vigente || rs.some((r) => sesionPerdida(r))) return;
      if (rs.some((r) => !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND')) return setLectura({ tipo: 'no-disponible' });
      const fallida = rs.find((r) => !r.ok);
      if (fallida) return setLectura({ tipo: 'error', motivo: motivoDeFalla(fallida) });
      const { tomas, parcial } = tomasDeLaEvolucion(rs.flatMap((r) => (r.ok ? [r.datos.data] : [])));
      setLectura({ tipo: 'lista', tomas, parcial });
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, desde, hasta, sesionPerdida, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { lectura, recargar };
}

/** La pieza leída: los estados de la lectura y, lista, la composición. */
export function LecturaDeLaPieza({ lectura, recargar, desde, hasta, hoy }: { lectura: LecturaDeLaComposicion; recargar: () => void; desde: string; hasta: string; hoy: string }) {
  if (lectura.tipo === 'cargando') return <Cargando />;
  if (lectura.tipo === 'no-disponible') return <p className="nota">{COPY_VINCULO.recursoNoDisponible}</p>;
  if (lectura.tipo === 'error')
    return (
      <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} titulo="No pudimos leer las tomas del período" onReintentar={recargar} deQue="la composición corporal">
        {razonDeFalla(lectura.motivo)}
      </BloqueDeEstado>
    );
  return <ComposicionCorporal tomas={lectura.tomas} parcial={lectura.parcial} desde={desde} hasta={hasta} hoy={hoy} />;
}

const COLOR = { libre: 'var(--composicion-libre)', grasa: 'var(--composicion-grasa)', peso: 'var(--tenue)', otra: 'var(--metrica-2)' } as const;

export function ComposicionCorporal({ tomas, parcial, desde, hasta, hoy }: { tomas: readonly TomaDeLaComposicion[]; parcial: boolean; desde: string; hasta: string; hoy: string }) {
  const id = useId();
  const [pedida, setPedida] = useState<Familia | null>(null);
  const c = useMemo(() => composicionDe(tomas, pedida), [tomas, pedida]);
  const fecha = (civil: string) => diaDelAnioEnCurso(civil, hoy);
  const metodo = c.familia ? DOS_COMPARTIMENTOS[c.familia].nombre : null;
  const ultima = [...c.columnas].reverse().find((x) => x.particion !== null) ?? null;
  if (c.columnas.length === 0 && c.filas.length === 0) {
    return (
      <div className="composicion">
        {parcial ? <p className="nota">{COPY_ANTROPOMETRIA.vistaParcial}</p> : null}
        <p className="nota">{COPY_ANTROPOMETRIA.sinMediciones}</p>
      </div>
    );
  }
  const sinPartir = c.columnas.some((x) => x.particion === null);
  const extremos = ultimaYPrimera(c);
  return (
    <div className="composicion">
      {parcial ? <p className="nota">{COPY_ANTROPOMETRIA.vistaParcial}</p> : null}
      {c.familias.length > 1 ? (
        <fieldset className="composicion__metodos">
          <legend>Método · uno por gráfico</legend>
          {c.familias.map((f) => (
            <label key={f}>
              <input type="radio" name={`${id}-metodo`} value={f} checked={c.familia === f} onChange={() => setPedida(f)} />
              {DOS_COMPARTIMENTOS[f].nombre}
            </label>
          ))}
        </fieldset>
      ) : null}
      <section className="composicion__parte" aria-labelledby={`${id}-peso`}>
        <h3 id={`${id}-peso`} className="composicion__titulo">
          De qué está hecho el peso{metodo ? <span className="tenue"> · {metodo}</span> : null}
        </h3>
        <p className="composicion__resumen">
          {ultima && ultima.particion ? (
            <>
              La última toma partida, el {fecha(ultima.fecha)}: <strong className="cifra">{textoDeLaParticion(ultima.particion)}</strong>
            </>
          ) : (
            'Ninguna toma del período tiene un método de dos compartimentos (Durnin y Womersley o Faulkner): cada columna es el peso, sin partir.'
          )}
        </p>
        <Leyenda conPartidas={c.familia !== null} sinPartir={sinPartir} conCambios={c.cambios.length > 0} />
        <ColumnasDeLaComposicion c={c} desde={desde} hasta={hasta} fecha={fecha} descripcion={descripcionDeLasColumnas(c, fecha)} />
      </section>
      {c.familia !== null ? (
        <section className="composicion__parte" aria-labelledby={`${id}-cambio`}>
          <h3 id={`${id}-cambio`} className="composicion__titulo">
            Cuánto cambió cada parte
            {c.entre ? (
              <span className="tenue">
                {' '}
                · del {fecha(c.entre.desde)} al {fecha(c.entre.hasta)}
                {c.cambios.length > 0 ? ', desde el último cambio de método' : ''}
              </span>
            ) : null}
          </h3>
          {c.unaSola ? <p className="nota">{UNA_SOLA_TOMA}</p> : null}
          <FilasDelCambio filas={c.unaSola ? c.filas.filter((f) => !f.suma) : c.filas} c={c} desde={desde} hasta={hasta} />
          {extremos && redondeoQueNoCierra(extremos[0], extremos[1]) ? (
            <p className="nota">Cada masa viene redondeada a 0,1 kg: las diferencias de las dos partes pueden no sumar exacto la del peso.</p>
          ) : null}
        </section>
      ) : null}
      <details className="composicion__tabla">
        <summary>
          Ver la tabla ({numero(c.columnas.length, 0)} {c.columnas.length === 1 ? 'toma' : 'tomas'})
        </summary>
        <TablaDeLaComposicion c={c} />
      </details>
      <p className="nota composicion__limite">
        Las masas son una estimación con una ecuación de predicción, no una medición: la masa libre de grasa no es la masa muscular, y dos ecuaciones dan valores distintos sobre la misma toma.
      </p>
    </div>
  );
}

const ultimaYPrimera = (c: Composicion) => {
  if (!c.entre) return null;
  const a = c.columnas.find((x) => x.fecha === c.entre?.desde && x.particion)?.particion;
  const b = [...c.columnas].reverse().find((x) => x.fecha === c.entre?.hasta && x.particion)?.particion;
  return a && b ? ([a, b] as const) : null;
};

function Leyenda({ conPartidas, sinPartir, conCambios }: { conPartidas: boolean; sinPartir: boolean; conCambios: boolean }) {
  return (
    <ul className="composicion__leyenda" aria-hidden="true">
      {conPartidas ? (
        <>
          <li>
            <span className="composicion__muestra" data-parte="grasa" />
            Masa grasa
          </li>
          <li>
            <span className="composicion__muestra" data-parte="libre" />
            Masa libre de grasa
          </li>
        </>
      ) : null}
      {sinPartir ? (
        <li>
          <span className="composicion__muestra" data-parte="contorno" />
          Sin partir (el peso)
        </li>
      ) : null}
      {conCambios ? (
        <li>
          <span className="composicion__muestra" data-parte="cambio" />
          Cambio de método
        </li>
      ) : null}
    </ul>
  );
}

/** El ancho del contenedor, para dibujar en píxeles reales (como el minigráfico). */
function useAncho(): [(e: HTMLDivElement | null) => void, number] {
  const [caja, setCaja] = useState<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!caja) return;
    setAncho(caja.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(() => setAncho(caja.clientWidth));
    o.observe(caja);
    return () => o.disconnect();
  }, [caja]);
  return [setCaja, ancho];
}

const mediodia = (f: string): number => Date.parse(`${f}T12:00:00Z`);
const IZQUIERDA = 40;
const DERECHA = 10;

function xDeLaFecha(desde: string, hasta: string, ancho: number): (f: string) => number {
  const a = mediodia(desde);
  const b = Math.max(mediodia(hasta), a + 1);
  return (f: string) => IZQUIERDA + ((mediodia(f) - a) / (b - a)) * Math.max(1, ancho - IZQUIERDA - DERECHA);
}

/** Un tope redondo para el eje de las columnas, desde cero. */
function topeRedondo(maximo: number): number {
  const paso = maximo > 60 ? 20 : 10;
  return Math.max(paso, Math.ceil(maximo / paso) * paso);
}

function descripcionDeLasColumnas(c: Composicion, fecha: (civil: string) => string): string {
  const n = c.columnas.length;
  const partidas = c.columnas.filter((x) => x.particion).length;
  const ultima = [...c.columnas].reverse().find((x) => x.particion);
  const partes = [
    `${numero(n, 0)} ${n === 1 ? 'toma' : 'tomas'} con peso`,
    c.familia ? `${numero(partidas, 0)} partidas con ${DOS_COMPARTIMENTOS[c.familia].nombre}` : 'ninguna partida por un método',
    ultima?.particion ? `la última partida, el ${fecha(ultima.fecha)}: ${textoDeLaParticion(ultima.particion)}` : null,
    c.cambios.length ? `${numero(c.cambios.length, 0)} ${c.cambios.length === 1 ? 'cambio' : 'cambios'} de método o de protocolo` : null,
    'cada toma está en la tabla',
  ];
  return `De qué está hecho el peso: ${partes.filter(Boolean).join('; ')}.`;
}

const ALTO_DE_LAS_COLUMNAS = 190;
const ARRIBA = 20;
const ABAJO = 22;

function ColumnasDeLaComposicion({ c, desde, hasta, fecha, descripcion }: { c: Composicion; desde: string; hasta: string; fecha: (civil: string) => string; descripcion: string }) {
  const [caja, ancho] = useAncho();
  const lienzo = ALTO_DE_LAS_COLUMNAS - ARRIBA - ABAJO;
  const tope = topeRedondo(Math.max(...c.columnas.map((x) => x.peso), 1));
  const y = (v: number) => ARRIBA + lienzo - (v / tope) * lienzo;
  const x = xDeLaFecha(desde, hasta, ancho);
  const xs = c.columnas.map((col) => x(col.fecha));
  const separacion = xs.length > 1 ? Math.min(...xs.slice(1).map((v, i) => v - (xs[i] as number))) : ancho;
  const grueso = Math.max(4, Math.min(16, separacion * 0.6));
  const rotuladas = new Set([c.columnas[0]?.evaluacionId, c.columnas[c.columnas.length - 1]?.evaluacionId]);
  return (
    <div ref={caja} className="composicion__columnas" role="img" aria-label={descripcion} style={{ height: ALTO_DE_LAS_COLUMNAS }}>
      {ancho > 0 ? (
        <svg width={ancho} height={ALTO_DE_LAS_COLUMNAS} viewBox={`0 0 ${ancho} ${ALTO_DE_LAS_COLUMNAS}`} aria-hidden="true" focusable="false">
          {[0, tope / 2, tope].map((v) => (
            <g key={v}>
              <line x1={IZQUIERDA} x2={ancho - DERECHA} y1={y(v)} y2={y(v)} stroke="var(--borde)" strokeWidth={1} />
              <text x={IZQUIERDA - 6} y={y(v) + 4} textAnchor="end" fill="var(--tenue)" fontSize={LETRA_MINIMA}>
                {v === tope ? `${numero(v, 0)} kg` : numero(v, 0)}
              </text>
            </g>
          ))}
          {c.cambios.map((m) => {
            const xm = x(m.fecha) - grueso / 2 - 3;
            const alFinal = xm > ancho - 150;
            return (
              <g key={`cambio-${m.fecha}`} className="composicion__cambio">
                <line x1={xm} x2={xm} y1={ARRIBA - 4} y2={ARRIBA + lienzo} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="2 3" />
                <text x={alFinal ? xm - 4 : xm + 4} y={ARRIBA - 8} textAnchor={alFinal ? 'end' : 'start'} fill="var(--tenue)" fontSize={LETRA_MINIMA}>
                  {TEXTO_DEL_CAMBIO[m.motivo]} · {fecha(m.fecha)}
                </text>
              </g>
            );
          })}
          {c.columnas.map((col, i) => {
            const cx = xs[i] as number;
            const izq = cx - grueso / 2;
            const p = col.particion;
            return (
              <g key={col.evaluacionId} className="composicion__columna" data-partida={p ? 'si' : 'no'}>
                {p ? (
                  <>
                    <rect x={izq} y={y(p.libre)} width={grueso} height={Math.max(0, y(0) - y(p.libre))} fill={COLOR.libre} />
                    {/* El corte fino entre las dos partes deja ver la superficie: las partes nunca se tocan. */}
                    <rect x={izq} y={y(p.peso)} width={grueso} height={Math.max(0, y(p.libre) - y(p.peso) - 1.5)} fill={COLOR.grasa} />
                  </>
                ) : (
                  <rect x={izq + 0.625} y={y(col.peso) + 0.625} width={Math.max(1, grueso - 1.25)} height={Math.max(0, y(0) - y(col.peso) - 0.625)} fill="none" stroke="var(--tenue)" strokeWidth={1.25} />
                )}
                {rotuladas.has(col.evaluacionId) && ancho > 260 ? (
                  <text x={cx} y={y(col.peso) - 5} textAnchor={i === 0 ? 'start' : 'end'} fill="var(--texto)" fontSize={LETRA_MINIMA} fontWeight={600}>
                    {numero(col.peso, 1)}
                  </text>
                ) : null}
              </g>
            );
          })}
          <text x={IZQUIERDA} y={ALTO_DE_LAS_COLUMNAS - 5} fill="var(--tenue)" fontSize={LETRA_MINIMA}>
            {fecha(desde)}
          </text>
          <text x={ancho - DERECHA} y={ALTO_DE_LAS_COLUMNAS - 5} textAnchor="end" fill="var(--tenue)" fontSize={LETRA_MINIMA}>
            {fecha(hasta)}
          </text>
        </svg>
      ) : null}
    </div>
  );
}

const ALTO_DE_LA_FILA = 44;

function FilasDelCambio({ filas, c, desde, hasta }: { filas: readonly FilaDelCambio[]; c: Composicion; desde: string; hasta: string }) {
  const escalas = escalaComun(filas);
  if (filas.length === 0) return null;
  return (
    <ul className="composicion__filas">
      {filas.map((f, i) => (
        <li key={f.clave} className="composicion__fila" data-fila={f.clave}>
          <span className="composicion__nombre">
            {f.nombre}
            {f.suma ? null : <span className="tenue"> · {NO_SUMA_CON_LAS_OTRAS}</span>}
          </span>
          <LineaDeLaFila fila={f} escala={escalas[i] as { abajo: number; arriba: number }} color={f.clave === 'grasa' ? COLOR.grasa : f.clave === 'libre' ? COLOR.libre : f.clave === 'peso' ? COLOR.peso : COLOR.otra} cambios={f.suma ? c.cambios.map((m) => m.fecha) : []} desde={desde} hasta={hasta} />
          <span className="composicion__cifras">
            {f.desde && f.hasta && f.diferencia !== null ? (
              <>
                <span className="cifra">{numero(f.desde.valor, 1)}</span> → <span className="cifra">{numero(f.hasta.valor, 1)}</span> kg ·{' '}
                <strong className="cifra">{diferenciaEnPalabras(f.diferencia)}</strong>
              </>
            ) : f.puntos.length > 0 ? (
              <>
                <span className="cifra">{numero((f.puntos[f.puntos.length - 1] as FilaDelCambio['puntos'][number]).valor, 1)}</span> kg
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function LineaDeLaFila({ fila, escala, color, cambios, desde, hasta }: { fila: FilaDelCambio; escala: { abajo: number; arriba: number }; color: string; cambios: readonly string[]; desde: string; hasta: string }) {
  const [caja, ancho] = useAncho();
  const x = xDeLaFecha(desde, hasta, ancho);
  const y = (v: number) => 6 + (ALTO_DE_LA_FILA - 12) * (1 - (v - escala.abajo) / Math.max(escala.arriba - escala.abajo, 0.001));
  const tramos = new Map<string, { x: number; y: number }[]>();
  for (const p of fila.puntos) tramos.set(p.tramo, [...(tramos.get(p.tramo) ?? []), { x: x(p.fecha), y: y(p.valor) }]);
  return (
    <div ref={caja} className="composicion__linea" aria-hidden="true" style={{ height: ALTO_DE_LA_FILA }}>
      {ancho > 0 ? (
        <svg width={ancho} height={ALTO_DE_LA_FILA} viewBox={`0 0 ${ancho} ${ALTO_DE_LA_FILA}`} focusable="false">
          {cambios.map((f) => (
            <line key={f} x1={x(f) - 6} x2={x(f) - 6} y1={0} y2={ALTO_DE_LA_FILA} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="2 3" />
          ))}
          {[...tramos.values()].map((ps, i) =>
            ps.length > 1 ? <path key={i} d={ps.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" /> : null,
          )}
          {fila.puntos.map((p) => (
            <circle key={`${p.fecha}-${p.valor}`} cx={x(p.fecha)} cy={y(p.valor)} r={3} fill={color} />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

function TablaDeLaComposicion({ c }: { c: Composicion }) {
  return (
    <div className="desplazable-x">
      <table className="tabla">
        <caption className="visualmente-oculto">Cada toma del período, con su peso y, si el método lo parte, sus dos masas</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Peso</th>
            <th scope="col">Masa libre de grasa</th>
            <th scope="col">Masa grasa</th>
            <th scope="col">En el gráfico</th>
          </tr>
        </thead>
        <tbody>
          {c.columnas.map((col) => (
            <tr key={col.evaluacionId}>
              <th scope="row">{diaCivil(col.fecha)}</th>
              <td className="cifra">
                {numero(col.peso, 1)} kg{col.pesoReportado ? ' · reportado por la persona' : ''}
              </td>
              <td className="cifra">{col.particion ? `${numero(col.particion.libre, 1)} kg` : '—'}</td>
              <td className="cifra">{col.particion ? `${numero(col.particion.grasa, 1)} kg` : '—'}</td>
              <td>{col.particion ? `Partida con ${DOS_COMPARTIMENTOS[col.particion.familia].nombre}` : textoSinPartir(col)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {c.cambios.length > 0 ? (
        <p className="nota">
          {c.cambios.map((m) => `${TEXTO_DEL_CAMBIO[m.motivo]} el ${diaCivil(m.fecha)}`).join(' · ')}: las diferencias no cruzan esas fechas.
        </p>
      ) : null}
    </div>
  );
}

const ALTO_DE_LOS_PESOS = 40;

/**
 * La línea de los pesos de las tomas, en la tarjeta del Resumen, cuando ninguna toma tiene un método que parta el peso
 * (R-6). Une solo las tomas comparables (el mismo protocolo y la misma unidad) y no completa los días sin toma. Es
 * decorativa: lo que dice va escrito al lado.
 */
export function LineaDeLosPesos({ pesos, desde, hasta }: { pesos: readonly { readonly fecha: string; readonly valor: number; readonly tramo: string }[]; desde: string; hasta: string }) {
  const [caja, ancho] = useAncho();
  const primera = pesos[0]?.fecha ?? desde;
  const a = mediodia(primera < desde ? primera : desde);
  const b = Math.max(mediodia(hasta), a + 1);
  const x = (f: string) => 6 + ((mediodia(f) - a) / (b - a)) * Math.max(1, ancho - 12);
  const [escala] = escalaComun([{ puntos: pesos }]);
  const y = (v: number) => 5 + (ALTO_DE_LOS_PESOS - 10) * (1 - (v - (escala?.abajo ?? 0)) / Math.max((escala?.arriba ?? 1) - (escala?.abajo ?? 0), 0.001));
  const tramos = new Map<string, { x: number; y: number }[]>();
  for (const p of pesos) tramos.set(p.tramo, [...(tramos.get(p.tramo) ?? []), { x: x(p.fecha), y: y(p.valor) }]);
  return (
    <div ref={caja} className="composicion__linea" aria-hidden="true" style={{ height: ALTO_DE_LOS_PESOS }}>
      {ancho > 0 ? (
        <svg width={ancho} height={ALTO_DE_LOS_PESOS} viewBox={`0 0 ${ancho} ${ALTO_DE_LOS_PESOS}`} focusable="false">
          {[...tramos.values()].map((ps, i) =>
            ps.length > 1 ? <path key={i} d={ps.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--metrica-1)" strokeWidth={1.5} strokeLinejoin="round" /> : null,
          )}
          {pesos.map((p) => (
            <circle key={`${p.fecha}-${p.valor}`} cx={x(p.fecha)} cy={y(p.valor)} r={3} fill="var(--metrica-1)" />
          ))}
        </svg>
      ) : null}
    </div>
  );
}
