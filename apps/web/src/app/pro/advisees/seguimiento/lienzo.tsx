'use client';

/**
 * El lienzo de «Analizar» (ESPECIFICACION.md §4; INVESTIGACION.md F-01 a F-05):
 * - **Paneles sincronizados** por defecto: el mismo eje temporal, la misma fecha elegida y el mismo intervalo, cada uno
 *   con su unidad y su escala. Sin doble eje vertical (F-01).
 * - **Superpuestas** (misma familia y unidad) y **cambio relativo** (contra una referencia explícita) en un solo gráfico.
 * - **Puntos reales:** la línea une solo puntos del mismo tramo; los huecos y los cambios de método la cortan (F-02). Un
 *   subtotal, el día en curso y una semana sin completar son puntos huecos; lo desconocido no es un punto.
 * - **Color, forma y trazo** por métrica (círculo, cuadrado o triángulo; continuo, rayado o punteado): el color nunca es
 *   el único medio (WCAG 1.4.1). La fecha y el punto elegidos van en el color del texto, no en el del foco: no se
 *   confunden con ninguna métrica.
 * - **El valor exacto no depende del puntero:** el panel de lectura y la tabla lo dicen; el teclado mueve la fecha
 *   elegida (flechas, Inicio y Fin) y el arrastre sobre un panel es solo un atajo de los campos de fecha (WCAG 2.5.7).
 */
import { numero, type PuntoAnalitico, type SerieAnalitica, type VigenciaDePlan } from '@be/domain';
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { diaCorto } from '../../../../lib/formato';
import type { Modo } from './estado';

export const ESTILOS = [
  { color: 'var(--metrica-1)', forma: 'circulo', trazo: undefined, nombreDeLaMarca: 'círculo', nombreDelTrazo: 'línea continua' },
  { color: 'var(--metrica-2)', forma: 'cuadrado', trazo: '7 4', nombreDeLaMarca: 'cuadrado', nombreDelTrazo: 'línea rayada' },
  { color: 'var(--metrica-3)', forma: 'triangulo', trazo: '2 3', nombreDeLaMarca: 'triángulo', nombreDelTrazo: 'línea punteada' },
] as const;

const DIA = 86_400_000;
export const mediodia = (fecha: string): number => Date.parse(`${fecha}T12:00:00Z`);
export const fechaDeX = (x: number): string => new Date(x).toISOString().slice(0, 10);

/** Dónde va un punto en el eje: la hora del hecho si la tiene (dos tomas del mismo día no se pisan); si no, el mediodía. */
export function xDe(p: PuntoAnalitico): number {
  if (p.dateEnd) return mediodia(p.date) + 3 * DIA; // la mitad de la semana
  if (p.at) {
    const x = Date.parse(p.at);
    // La hora se respeta solo si cae en el día civil del punto; si no, el mediodía de ese día.
    return Math.abs(x - mediodia(p.date)) < DIA / 2 ? x : mediodia(p.date);
  }
  return mediodia(p.date);
}

/**
 * La muestra de una métrica: su color y su forma; el trazo (rayado o punteado) solo cuando las series comparten un gráfico.
 * En paneles separados cada métrica tiene su panel, y una línea rayada con un zigzag diario solo agrega ruido.
 */
export function Marca({ indice, hueco = false, tamano = 14, conTrazo = true }: { indice: number; hueco?: boolean; tamano?: number; conTrazo?: boolean }) {
  const e = ESTILOS[indice] ?? ESTILOS[0];
  const c = tamano / 2;
  return (
    <svg width={tamano * 2.2} height={tamano} viewBox={`0 0 ${tamano * 2.2} ${tamano}`} aria-hidden="true" className="marca-de-metrica">
      <line x1={1} y1={c} x2={tamano * 2.2 - 1} y2={c} stroke={e.color} strokeWidth={2} strokeDasharray={conTrazo ? e.trazo : undefined} />
      <Forma forma={e.forma} cx={tamano * 1.1} cy={c} r={tamano * 0.34} color={e.color} hueco={hueco} />
    </svg>
  );
}

function Forma({ forma, cx, cy, r, color, hueco, trazo = 2 }: { forma: string; cx: number; cy: number; r: number; color: string; hueco: boolean; trazo?: number }) {
  const relleno = hueco ? 'var(--superficie)' : color;
  if (forma === 'cuadrado') return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={relleno} stroke={color} strokeWidth={trazo} />;
  if (forma === 'triangulo') return <polygon points={`${cx},${cy - r * 1.15} ${cx + r * 1.1},${cy + r * 0.85} ${cx - r * 1.1},${cy + r * 0.85}`} fill={relleno} stroke={color} strokeWidth={trazo} />;
  return <circle cx={cx} cy={cy} r={r} fill={relleno} stroke={color} strokeWidth={trazo} />;
}

export interface SerieParaDibujar {
  readonly indice: number;
  readonly nombre: string;
  readonly unidad: string;
  readonly serie: SerieAnalitica;
  /** El valor que se dibuja de cada punto (el real o el cambio relativo); `null` no se dibuja. */
  readonly valor: (p: PuntoAnalitico) => number | null;
  readonly decimales: number;
}

export interface Hito {
  readonly fecha: string;
  readonly texto: string;
}

interface PropsDelLienzo {
  readonly modo: Modo;
  readonly series: readonly SerieParaDibujar[];
  readonly desde: string;
  readonly hasta: string;
  readonly fecha: string | null;
  readonly fechasConDato: readonly string[];
  readonly onFecha: (fecha: string) => void;
  readonly onPunto: (indice: number, punto: PuntoAnalitico) => void;
  readonly onIntervalo: (desde: string, hasta: string) => void;
  readonly bandas: readonly (VigenciaDePlan & { readonly area: string })[];
  readonly hitos: readonly Hito[];
  readonly referencia: { readonly desde: string; readonly hasta: string } | null;
  readonly descripcion: string;
}

export function Lienzo(p: PropsDelLienzo) {
  if (p.modo === 'PANELS') {
    return (
      <div className="paneles-sincronizados">
        {p.series.map((s) => (
          <Panel key={s.indice} {...p} series={[s]} titulo={`${s.nombre} (${s.unidad})`} unidad={s.unidad} alto={190} />
        ))}
      </div>
    );
  }
  const unidad = p.modo === 'RELATIVE' ? '%' : (p.series[0]?.unidad ?? '');
  return <Panel {...p} titulo={p.modo === 'RELATIVE' ? 'Cambio relativo contra la referencia (%)' : `Superpuestas en valores reales (${unidad})`} unidad={unidad} alto={300} />;
}

function Panel({
  modo,
  series,
  desde,
  hasta,
  fecha,
  fechasConDato,
  onFecha,
  onPunto,
  onIntervalo,
  bandas,
  hitos,
  referencia,
  titulo,
  unidad,
  alto,
  descripcion,
}: PropsDelLienzo & { titulo: string; unidad: string; alto: number }) {
  const x0 = mediodia(desde) - DIA / 2;
  const x1 = mediodia(hasta) + DIA / 2;
  // Una fila por instante con algún punto; una columna por tramo de cada serie (la línea une solo su tramo).
  const { filas, tramos, puntosPorFila } = useMemo(() => {
    const mapa = new Map<number, Record<string, number | null>>();
    const puntos = new Map<string, { indice: number; punto: PuntoAnalitico }>();
    const columnas: { clave: string; indice: number }[] = [];
    for (const s of series) {
      const segmentos = [...new Set(s.serie.points.map((pt) => pt.segment))];
      segmentos.forEach((seg, j) => columnas.push({ clave: `s${s.indice}_${j}`, indice: s.indice }));
      for (const pt of s.serie.points) {
        const v = s.valor(pt);
        if (v === null) continue;
        const x = xDe(pt);
        if (x < x0 || x > x1) continue;
        const clave = `s${s.indice}_${segmentos.indexOf(pt.segment)}`;
        const fila = mapa.get(x) ?? { x };
        fila[clave] = v;
        mapa.set(x, fila);
        puntos.set(`${clave}|${x}`, { indice: s.indice, punto: pt });
      }
    }
    return { filas: [...mapa.values()].sort((a, b) => (a.x as number) - (b.x as number)), tramos: columnas, puntosPorFila: puntos };
  }, [series, x0, x1]);

  const marcas = useMemo(() => {
    const dias = Math.max(1, Math.round((x1 - x0) / DIA));
    const paso = Math.max(1, Math.round(dias / 7));
    const lista: number[] = [];
    for (let x = mediodia(desde); x <= mediodia(hasta); x += paso * DIA) lista.push(x);
    return lista;
  }, [x0, x1, desde, hasta]);

  const idDeDescripcion = useId();
  const [arrastre, setArrastre] = useState<{ desde: number; hasta: number } | null>(null);
  const xActivo = (e: unknown): number | null => {
    const v = (e as { activeLabel?: unknown } | null)?.activeLabel;
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const alSoltar = () => {
    if (arrastre && Math.abs(arrastre.hasta - arrastre.desde) >= DIA) {
      const [a, b] = [arrastre.desde, arrastre.hasta].sort((m, n) => m - n) as [number, number];
      onIntervalo(fechaDeX(a), fechaDeX(b));
    } else if (arrastre) {
      // Un clic sin arrastre elige la fecha de la fila más cercana.
      onFecha(fechaDeX(arrastre.desde));
    }
    setArrastre(null);
  };
  const conTeclado = (e: KeyboardEvent) => {
    if (fechasConDato.length === 0) return;
    const i = fecha ? fechasConDato.indexOf(fecha) : -1;
    let n: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = i < 0 ? 0 : Math.min(i + 1, fechasConDato.length - 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = i < 0 ? fechasConDato.length - 1 : Math.max(i - 1, 0);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = fechasConDato.length - 1;
    if (n === null) return;
    e.preventDefault();
    onFecha(fechasConDato[n]!);
  };

  // El tamaño de la marca depende de cuánto lugar hay por día: con 90 días en un teléfono, marcas grandes se pisan y la
  // serie se vuelve una mancha. No se quita ningún punto (ni los extremos ni los cortes): solo se achica la marca. El
  // hueco (subtotal o día sin completar) conserva un tamaño en el que se ve hueco.
  const [lienzo, setLienzo] = useState<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!lienzo) return;
    setAncho(lienzo.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(() => setAncho(lienzo.clientWidth));
    observador.observe(lienzo);
    return () => observador.disconnect();
  }, [lienzo]);
  const espacioPorDia = ancho > 0 ? (ancho - 78) / Math.max(1, Math.round((x1 - x0) / DIA)) : 12;
  const radio = espacioPorDia >= 12 ? 5 : espacioPorDia >= 7 ? 3.5 : 2.5;
  // La altura acompaña el ancho (en escritorio hay lugar para leer mejor las diferencias), con un mínimo y un máximo.
  const altoReal = ancho > 0 ? Math.round(Math.min(alto * 1.4, Math.max(alto * 0.9, ancho * (alto >= 300 ? 0.42 : 0.3)))) : alto;

  const punto = (clave: string) =>
    function PuntoDibujado(props: { cx?: number; cy?: number; payload?: Record<string, number> }): ReactNode {
      const { cx, cy, payload } = props;
      if (cx === undefined || cy === undefined || !payload || payload[clave] === undefined || payload[clave] === null) return <g />;
      const info = puntosPorFila.get(`${clave}|${payload.x}`);
      if (!info) return <g />;
      const e = ESTILOS[info.indice] ?? ESTILOS[0];
      const elegido = fecha !== null && info.punto.date <= fecha && fecha <= (info.punto.dateEnd ?? info.punto.date);
      const hueco = info.punto.quality === 'PARTIAL' || info.punto.partialBucket;
      const r = hueco ? Math.max(radio + 1, 3.5) : radio;
      return (
        <g className="grafico__elegible" onClick={() => onPunto(info.indice, info.punto)}>
          {elegido ? <circle cx={cx} cy={cy} r={Math.max(r * 2, 8)} fill="none" stroke="var(--texto)" strokeWidth={2} /> : null}
          <Forma forma={e.forma} cx={cx} cy={cy} r={r} color={e.color} hueco={hueco} trazo={radio < 5 ? 1.5 : 2} />
        </g>
      );
    };

  const fechaX = fecha ? mediodia(fecha) : null;
  return (
    <figure className="grafico grafico__figura">
      <figcaption className="grafico__titulo">{titulo}</figcaption>
      {/* El nombre es corto; la descripción (el resumen en texto) va aparte, para no leerla entera en cada foco. */}
      <p id={idDeDescripcion} className="visualmente-oculto">
        {descripcion}
      </p>
      <div ref={setLienzo} className="grafico__lienzo" tabIndex={0} role="group" aria-label={`${titulo}. Flechas: cambiar la fecha elegida; la lectura está debajo.`} aria-describedby={idDeDescripcion} onKeyDown={conTeclado}>
        <ResponsiveContainer width="100%" height={altoReal}>
          <LineChart
            data={filas}
            margin={{ top: 12, right: 16, bottom: 4, left: 4 }}
            onMouseDown={(e) => {
              const x = xActivo(e);
              if (x !== null) setArrastre({ desde: x, hasta: x });
            }}
            onMouseMove={(e) => {
              const x = xActivo(e);
              if (arrastre && x !== null) setArrastre({ ...arrastre, hasta: x });
            }}
            onMouseUp={alSoltar}
            onMouseLeave={() => setArrastre(null)}
          >
            <CartesianGrid stroke="var(--borde)" vertical={false} />
            {bandas.map((b, i) => (
              <ReferenceArea
                key={`${b.planVersionId}-${i}`}
                x1={Math.max(x0, mediodia(b.from) - DIA / 2)}
                x2={Math.min(x1, b.to ? mediodia(b.to) - DIA / 2 : x1)}
                fill="var(--fondo-suave)"
                fillOpacity={i % 2 === 0 ? 0.9 : 0.5}
                stroke="var(--borde)"
                ifOverflow="hidden"
                label={{ value: `${b.area} ${b.label}`, position: 'insideTopLeft', fill: 'var(--tenue)', fontSize: 11 }}
              />
            ))}
            {referencia ? (
              <ReferenceArea x1={mediodia(referencia.desde) - DIA / 2} x2={mediodia(referencia.hasta) + DIA / 2} fill="var(--fondo-suave)" stroke="var(--borde-control)" strokeDasharray="3 3" ifOverflow="hidden" label={{ value: 'Referencia', position: 'insideBottomLeft', fill: 'var(--tenue)', fontSize: 11 }} />
            ) : null}
            {hitos.map((h, i) => (
              <ReferenceLine key={`${h.fecha}-${i}`} x={mediodia(h.fecha)} stroke="var(--tenue)" strokeDasharray="2 4" ifOverflow="hidden" />
            ))}
            {modo === 'RELATIVE' ? <ReferenceLine y={0} stroke="var(--borde-control)" /> : null}
            <XAxis
              dataKey="x"
              type="number"
              scale="time"
              domain={[x0, x1]}
              ticks={marcas}
              allowDataOverflow
              tickFormatter={(x: number) => diaCorto(fechaDeX(x))}
              tick={{ fill: 'var(--tenue)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--borde-control)' }}
            />
            <YAxis width={58} domain={['auto', 'auto']} tickFormatter={(v: number) => numero(v)} tick={{ fill: 'var(--tenue)', fontSize: 12 }} axisLine={{ stroke: 'var(--borde-control)' }} label={{ value: unidad, angle: -90, position: 'insideLeft', fill: 'var(--tenue)', fontSize: 12 }} />
            {tramos.map((t) => {
              const e = ESTILOS[t.indice] ?? ESTILOS[0];
              return <Line key={t.clave} dataKey={t.clave} type="linear" stroke={e.color} strokeWidth={2} strokeDasharray={modo === 'PANELS' ? undefined : e.trazo} connectNulls isAnimationActive={false} dot={punto(t.clave)} activeDot={false} />;
            })}
            {fechaX !== null ? <ReferenceLine x={fechaX} stroke="var(--texto)" strokeWidth={1.5} strokeDasharray="6 3" ifOverflow="hidden" /> : null}
            {arrastre && Math.abs(arrastre.hasta - arrastre.desde) >= DIA ? <ReferenceArea x1={arrastre.desde} x2={arrastre.hasta} fill="var(--fondo-suave)" fillOpacity={0.6} stroke="var(--texto)" /> : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {filas.length === 0 ? <p className="nota">Sin puntos para dibujar en este período.</p> : null}
    </figure>
  );
}
