'use client';

/**
 * El lienzo de «Analizar» (ESPECIFICACION.md §4; INVESTIGACION.md F-01 a F-05; WP-ESCRITORIO-AMABLE, C-16, C-17, C-20,
 * C-22 y C-33):
 * - **Separadas** (por defecto): un panel por métrica, con el mismo eje temporal, la misma fecha elegida y el mismo
 *   intervalo, cada uno con su unidad y su escala. Sin doble eje vertical (F-01). Las fechas se escriben una vez, bajo
 *   el último panel; los demás conservan las marcas del eje, para ver que están alineados.
 * - **Juntas** (misma familia y unidad) y **cambio relativo** (contra una referencia explícita) en un solo gráfico.
 * - **Todas las marcas son puntos.** La métrica se reconoce por su color **y por su nombre**: en el encabezado de su
 *   panel o, cuando comparten un gráfico, al final de su línea. El color nunca es el único medio (WCAG 1.4.1).
 * - **Lo registrado** es una línea continua con puntos. **Lo planificado** en la misma unidad (el objetivo de calorías)
 *   es una línea discontinua del mismo color, sin puntos: un escalón por cada versión del objetivo.
 * - **Puntos reales:** la línea une solo puntos del mismo tramo; los huecos y los cambios de método la cortan (F-02). Un
 *   subtotal, el día en curso y una semana sin completar son puntos huecos; lo desconocido no es un punto.
 * - **Los días sin registros** de una serie diaria llevan un sombreado gris leve: la línea sigue cortada (un hueco no se
 *   une ni se vuelve cero), pero se ve dónde no hubo carga. El día en curso no se sombrea. Si varias métricas comparten
 *   el gráfico, se sombrean los días sin registros en todas.
 * - **La clase del dato** se ve en el punto: un valor reportado por la persona tiene el contorno cortado, y uno
 *   calculado por un método, un punto adentro. Lo medido es la marca llena de siempre.
 * - **Un día o una semana sin completar no se une a la línea** (WP-DASHBOARD-COMPRENSION, eje 6): el día en curso es un
 *   punto hueco suelto, para que un subtotal de la mañana no se lea como una caída. La lectura dice que sigue en curso.
 * - **El valor exacto no depende del puntero:** el panel de lectura y la tabla lo dicen; el teclado mueve la fecha
 *   elegida (flechas, Inicio y Fin) y el arrastre sobre un panel es solo un atajo de los campos de fecha (WCAG 2.5.7).
 */
import { numero, type PuntoAnalitico, type SerieAnalitica, type VigenciaDePlan } from '@be/domain';
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { diaYMesCivil } from '../../../../lib/formato';
import type { Modo } from './estado';
// Dónde cae un punto en el eje de fechas: lo comparte con el minigráfico del Resumen, que no carga esta biblioteca.
import { DIA, fechaDeX, mediodia, xDe } from './geometria';
import { ESTILOS, Marca, Punto } from './marca';

/** La letra más chica de un gráfico (el criterio de diseño pide 12,5 px como mínimo). */
const LETRA = 12.5;

/** Una vigencia de plan que acompaña a un gráfico, con el nombre de su área. */
export type BandaDePlan = VigenciaDePlan & { readonly area: string };

/** Un escalón de lo planificado: vale `valor` desde `desde` hasta `hasta` (o hasta el final de lo que se ve). */
export interface EscalonDelPlan {
  readonly desde: string;
  readonly hasta: string | null;
  readonly valor: number;
}

export interface SerieParaDibujar {
  readonly indice: number;
  /** El nombre de la métrica, como va en el encabezado de su panel («Calorías registradas»). */
  readonly nombre: string;
  /** El nombre corto, para el final de su línea cuando comparte un gráfico («Calorías»). */
  readonly nombreCorto?: string;
  /** Qué es cada punto: «por día», «cada sesión», «cada toma». */
  readonly cadaPunto?: string;
  readonly unidad: string;
  readonly serie: SerieAnalitica;
  /** El valor que se dibuja de cada punto (el real o el cambio relativo); `null` no se dibuja. */
  readonly valor: (p: PuntoAnalitico) => number | null;
  readonly decimales: number;
  /** Lo planificado en la misma unidad, si llega con la serie: se dibuja solo en su propio panel. */
  readonly plan?: { readonly nombre: string; readonly escalones: readonly EscalonDelPlan[] } | null;
  /** Los días sin registros de una serie diaria (rangos de fechas, sin el día en curso). */
  readonly sinRegistros?: readonly { readonly desde: string; readonly hasta: string }[];
  /** Las vigencias de plan que acompañan a su panel y si llevan su rótulo (se rotulan una vez por área). */
  readonly bandas?: readonly BandaDePlan[];
  readonly rotularBandas?: boolean;
  /** Dónde empieza un tramo que no se compara con el anterior, y por qué («Cambio de protocolo»). */
  readonly cortes?: readonly { readonly fecha: string; readonly texto: string }[];
  /** La cobertura del panel, en partes cortas (el texto es del dominio). */
  readonly cobertura?: readonly string[];
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
  /** Las vigencias de plan de un gráfico compartido (en paneles separados, cada serie trae las suyas). */
  readonly bandas: readonly BandaDePlan[];
  readonly hitos: readonly Hito[];
  readonly referencia: { readonly desde: string; readonly hasta: string } | null;
  /** El título de un gráfico compartido («Carbohidratos, grasas y proteínas registrados»). */
  readonly tituloCompartido?: string;
  readonly descripcion: string;
  /**
   * En «Separadas»: lo que una métrica elegida muestra cuando todavía no es un gráfico (cargando, sin acceso, una falla,
   * sin puntos). Va en el lugar de su gráfico, según el orden de las métricas (`indice`).
   */
  readonly estados?: readonly { readonly indice: number; readonly nodo: ReactNode }[];
}

/**
 * La marca del eje de fechas de un panel que no las escribe (van una sola vez, bajo el último): queda la rayita, que
 * muestra que los paneles están alineados, sin el texto. Con `tick={false}` la biblioteca tampoco dibuja la rayita.
 */
const MarcaSinFecha = (): ReactNode => <g />;

/**
 * El alto del área de dibujo de cada panel: con menos paneles, cada uno aprovecha el lugar. Con tres, los tres y la
 * lectura entran en una ventana de 1440 × 900 sin desplazarse.
 */
const ALTO_DEL_PANEL = [260, 260, 184, 118] as const;
const ALTO_COMPARTIDO = 300;

export function Lienzo(p: PropsDelLienzo) {
  if (p.modo === 'PANELS') {
    // Cada métrica elegida tiene su lugar, sea un gráfico o un bloque de estado: el alto se reparte entre todos, así
    // nada salta cuando lo que estaba cargando pasa a ser un gráfico. Las fechas van bajo el último gráfico.
    const lugares = [...p.series.map((serie) => ({ indice: serie.indice, serie, nodo: null as ReactNode })), ...(p.estados ?? []).map((e) => ({ indice: e.indice, serie: null, nodo: e.nodo }))].sort((a, b) => a.indice - b.indice);
    const alto = ALTO_DEL_PANEL[Math.min(lugares.length, 3)] ?? 136;
    const ultimo = p.series[p.series.length - 1]?.indice;
    return (
      <div className="paneles-sincronizados">
        {lugares.map((l) =>
          l.serie ? (
            <Panel key={l.indice} {...p} series={[l.serie]} bandas={l.serie.bandas ?? p.bandas} rotularBandas={l.serie.rotularBandas ?? true} unidad={l.serie.unidad} alto={alto} conFechas={l.indice === ultimo} />
          ) : (
            <div key={`estado-${l.indice}`} className="grafico grafico--sin-dibujo" style={{ minHeight: alto }}>
              {l.nodo}
            </div>
          ),
        )}
      </div>
    );
  }
  const unidad = p.modo === 'RELATIVE' ? '%' : (p.series[0]?.unidad ?? '');
  return <Panel {...p} rotularBandas unidad={unidad} alto={ALTO_COMPARTIDO} conFechas />;
}

/** El nombre al final de una línea: el corto si alcanza para distinguirla; si no, el completo, acortado. */
function rotulosDeLinea(series: readonly SerieParaDibujar[]): ReadonlyMap<number, string> {
  const cortos = series.map((s) => s.nombreCorto ?? s.nombre);
  const repetido = new Set(cortos.filter((c, i) => cortos.indexOf(c) !== i));
  return new Map(
    series.map((s, i) => {
      const elegido = repetido.has(cortos[i]!) ? s.nombre : cortos[i]!;
      return [s.indice, elegido.length > 26 ? `${elegido.slice(0, 25).trimEnd()}…` : elegido];
    }),
  );
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
  rotularBandas,
  hitos,
  referencia,
  tituloCompartido,
  unidad,
  alto,
  conFechas,
  descripcion,
}: PropsDelLienzo & { rotularBandas: boolean; unidad: string; alto: number; conFechas: boolean }) {
  const x0 = mediodia(desde) - DIA / 2;
  const x1 = mediodia(hasta) + DIA / 2;
  const compartido = modo !== 'PANELS';
  const unica = compartido ? null : (series[0] ?? null);
  // Una fila por instante con algún punto; una columna por tramo de cada serie (la línea une solo su tramo).
  const { filas, tramos, puntosPorFila, ultimos } = useMemo(() => {
    const mapa = new Map<number, Record<string, number | null>>();
    const puntos = new Map<string, { indice: number; punto: PuntoAnalitico }>();
    const columnas: { clave: string; indice: number }[] = [];
    // El último punto dibujado de cada serie: ahí va su nombre cuando comparten el gráfico.
    const finales = new Map<number, { clave: string; x: number; valor: number }>();
    for (const s of series) {
      const segmentos = [...new Set(s.serie.points.map((pt) => pt.segment))];
      segmentos.forEach((_, j) => columnas.push({ clave: `s${s.indice}_${j}`, indice: s.indice }));
      // Lo que todavía no se completó va en una columna propia: un punto suelto, sin línea que lo una.
      if (s.serie.points.some((pt) => pt.partialBucket)) columnas.push({ clave: `s${s.indice}_curso`, indice: s.indice });
      for (const pt of s.serie.points) {
        const v = s.valor(pt);
        if (v === null) continue;
        const x = xDe(pt);
        if (x < x0 || x > x1) continue;
        const clave = pt.partialBucket ? `s${s.indice}_curso` : `s${s.indice}_${segmentos.indexOf(pt.segment)}`;
        const fila = mapa.get(x) ?? { x };
        fila[clave] = v;
        mapa.set(x, fila);
        puntos.set(`${clave}|${x}`, { indice: s.indice, punto: pt });
        const final = finales.get(s.indice);
        if (!final || x >= final.x) finales.set(s.indice, { clave, x, valor: v });
      }
    }
    return { filas: [...mapa.values()].sort((a, b) => (a.x as number) - (b.x as number)), tramos: columnas, puntosPorFila: puntos, ultimos: finales };
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

  // El nombre de cada línea cuando comparten el gráfico, y cuánto lugar necesita a la derecha.
  const rotulos = useMemo(() => (compartido ? rotulosDeLinea(series) : new Map<number, string>()), [compartido, series]);
  const margenDerecho = compartido ? Math.min(190, 22 + Math.max(0, ...[...rotulos.values()].map((t) => t.length)) * 7.4) : 16;
  const altoDelEje = conFechas ? 28 : 8;
  // Dos líneas que terminan cerca: sus nombres se separan en vertical, con una estimación de dónde cae cada final (el
  // dominio real del eje es un poco más ancho que los datos, así que las distancias reales son algo menores).
  const corrimientos = useMemo(() => {
    const finales = [...ultimos.entries()];
    if (!compartido || finales.length < 2) return new Map<number, number>();
    const valores = filas.flatMap((f) => Object.entries(f).filter(([k, v]) => k !== 'x' && v !== null).map(([, v]) => v as number));
    const minimo = Math.min(...valores);
    const rango = Math.max(...valores) - minimo || 1;
    const altoUtil = alto - 16;
    const estimados = finales.map(([indice, f]) => ({ indice, y: (1 - (f.valor - minimo) / rango) * altoUtil })).sort((a, b) => a.y - b.y);
    const separacion = 17;
    const corridos = new Map<number, number>();
    let anterior = -Infinity;
    for (const e of estimados) {
      const y = Math.max(e.y, anterior + separacion);
      corridos.set(e.indice, y - e.y);
      anterior = y;
    }
    return corridos;
  }, [compartido, ultimos, filas, alto]);

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
  const espacioPorDia = ancho > 0 ? (ancho - 62 - margenDerecho) / Math.max(1, Math.round((x1 - x0) / DIA)) : 12;
  const radio = espacioPorDia >= 12 ? 4.5 : espacioPorDia >= 7 ? 3.5 : 2.5;
  /** El radio de la marca de un punto: una hueca, cortada o con un punto adentro necesita un mínimo para verse como tal. */
  const radioDe = (pt: PuntoAnalitico): number => {
    const conClase = pt.dataClass === 'REPORTED' || pt.dataClass === 'DERIVED';
    return pt.quality === 'PARTIAL' || pt.partialBucket || conClase ? Math.max(radio + 1.5, conClase ? 5 : 3.5) : radio;
  };
  const esElegido = (pt: PuntoAnalitico): boolean => fecha !== null && pt.date <= fecha && fecha <= (pt.dateEnd ?? pt.date);
  // El aro de la fecha elegida, alrededor de cada marca de esa fecha. Va en una capa aparte de las líneas: sus puntos se
  // recortan al área de dibujo, y el aro del último día quedaba cortado contra el borde derecho.
  const aros = [...puntosPorFila.entries()].flatMap(([clave, info]) => {
    if (!esElegido(info.punto)) return [];
    const y = series.find((s) => s.indice === info.indice)?.valor(info.punto) ?? null;
    return y === null ? [] : [{ clave, x: Number(clave.slice(clave.lastIndexOf('|') + 1)), y, r: Math.max(radioDe(info.punto) * 2, 8) }];
  });

  const punto = (clave: string) =>
    function PuntoDibujado(props: { cx?: number; cy?: number; payload?: Record<string, number> }): ReactNode {
      const { cx, cy, payload } = props;
      if (cx === undefined || cy === undefined || !payload || payload[clave] === undefined || payload[clave] === null) return <g />;
      const info = puntosPorFila.get(`${clave}|${payload.x}`);
      if (!info) return <g />;
      const e = ESTILOS[info.indice] ?? ESTILOS[0];
      const hueco = info.punto.quality === 'PARTIAL' || info.punto.partialBucket;
      const clase = info.punto.dataClass === 'REPORTED' || info.punto.dataClass === 'DERIVED' ? info.punto.dataClass : null;
      return (
        <g className="grafico__elegible" data-clase={clase ?? undefined} data-elegido={esElegido(info.punto) ? 'si' : undefined} onClick={() => onPunto(info.indice, info.punto)}>
          <Punto cx={cx} cy={cy} r={radioDe(info.punto)} color={e.color} hueco={hueco} trazo={radio < 4.5 ? 1.5 : 2} clase={clase} />
        </g>
      );
    };

  const fechaX = fecha ? mediodia(fecha) : null;
  const escalones = [...(unica?.plan?.escalones ?? [])].sort((a, b) => a.desde.localeCompare(b.desde));
  // Los días sin registros que se sombrean. Cuando varias métricas comparten el gráfico, los que no tienen registros en
  // ninguna (en las de Nutrición son los mismos días: salen de los mismos registros).
  const sinRegistros = useMemo(() => {
    if (series.length === 1) return series[0]?.sinRegistros ?? [];
    const dias = series.map((s) => {
      const deLaSerie = new Set<string>();
      for (const h of s.sinRegistros ?? []) for (let x = mediodia(h.desde); x <= mediodia(h.hasta); x += DIA) deLaSerie.add(fechaDeX(x));
      return deLaSerie;
    });
    const comunes = [...(dias[0] ?? [])].filter((d) => dias.every((c) => c.has(d))).sort();
    // Días seguidos, en un solo tramo.
    const tramos: { desde: string; hasta: string }[] = [];
    for (const d of comunes) {
      const ultimo = tramos[tramos.length - 1];
      if (ultimo && mediodia(d) - mediodia(ultimo.hasta) === DIA) ultimo.hasta = d;
      else tramos.push({ desde: d, hasta: d });
    }
    return tramos;
  }, [series]);
  // El rótulo de cada etapa va arriba de su banda, fuera del dibujo: adentro lo cruzaban la línea del objetivo y los puntos.
  // Va entero si entra en el ancho de su banda («Nutrición · versión 2»); si la banda es angosta, corto («v2»); y si ni
  // eso entra (una etapa que apenas asoma en el período), no va: un rótulo sin banda debajo no dice dónde está.
  const pxPorMs = ancho > 0 ? (ancho - 62 - margenDerecho) / (x1 - x0) : 0;
  const bandasDibujadas = bandas.map((b) => {
    const xa = Math.max(x0, mediodia(b.from) - DIA / 2);
    const xb = Math.min(x1, b.to ? mediodia(b.to) - DIA / 2 : x1);
    const lugar = (xb - xa) * pxPorMs;
    const entero = `${b.area} · ${b.label.replace(/^v(\d+)$/, 'versión $1')}`;
    const rotulo = !rotularBandas ? null : lugar >= entero.length * LETRA * 0.56 ? entero : lugar >= b.label.length * LETRA * 0.62 + 6 ? b.label : null;
    return { b, xa, xb, rotulo };
  });
  // Antes de conocer el ancho se reserva el lugar de los rótulos, para que el dibujo no salte al medirlo.
  const conRotulosDeBanda = rotularBandas && bandas.length > 0 && (ancho === 0 || bandasDibujadas.some((x) => x.rotulo !== null));
  // Los cortes (otro protocolo, método o unidad): uno solo lleva su motivo escrito; con varios, cada uno lleva un número
  // y el motivo se lee en la leyenda, debajo del gráfico (escritos, se pisaban).
  const cortes = [...(unica?.cortes ?? [])].sort((a, b) => a.fecha.localeCompare(b.fecha)).filter((c) => mediodia(c.fecha) - DIA / 2 > x0 && mediodia(c.fecha) - DIA / 2 < x1);
  const nombre = unica ? unica.nombre : (tituloCompartido ?? (modo === 'RELATIVE' ? 'Cambio frente a la referencia' : 'Juntas'));
  // Qué es cada punto y en qué unidad: «por día · kcal». En un gráfico compartido, lo primero solo si vale para todas.
  const cadaPunto = series.every((s) => s.cadaPunto === series[0]?.cadaPunto) ? series[0]?.cadaPunto : undefined;
  const detalle = [cadaPunto, unidad].filter(Boolean).join(' · ');
  const titulo = `${nombre} · ${detalle}`;
  return (
    <figure className="grafico grafico__figura">
      <figcaption className="grafico__encabezado">
        <span className="grafico__titulo">
          {unica ? <Marca indice={unica.indice} /> : null}
          <strong>{nombre}</strong> <span className="grafico__detalle">{detalle}</span>
        </span>
        {unica?.plan && unica.plan.escalones.length > 0 ? (
          <span className="grafico__muestra">
            <Marca indice={unica.indice} plan /> {unica.plan.nombre}
          </span>
        ) : null}
        {compartido ? (
          <span className="grafico__muestras">
            {series.map((s) => (
              <span key={s.indice} className="grafico__muestra">
                <Marca indice={s.indice} /> {rotulos.get(s.indice)}
              </span>
            ))}
          </span>
        ) : null}
        {unica?.cobertura && unica.cobertura.length > 0 ? (
          <span className="grafico__cobertura">
            {unica.cobertura.map((parte, i) => (
              <span key={parte}>
                {i > 0 ? ' · ' : ''}
                {/* La muestra gris acompaña a la cuenta solo si el gráfico sombrea esos días (por semana no lo hace). */}
                {/sin registros$/.test(parte) && (unica.sinRegistros?.length ?? 0) > 0 ? <span className="muestra-de-hueco" aria-hidden="true" /> : null}
                {parte}
              </span>
            ))}
          </span>
        ) : null}
      </figcaption>
      {/* El nombre es corto; la descripción (el resumen en texto) va aparte, para no leerla entera en cada foco. */}
      <p id={idDeDescripcion} className="visualmente-oculto">
        {descripcion}
      </p>
      <div ref={setLienzo} className="grafico__lienzo" tabIndex={0} role="group" aria-label={`${titulo}. Flechas: cambiar la fecha elegida; sus valores están en «Lectura».`} aria-describedby={idDeDescripcion} onKeyDown={conTeclado}>
        <ResponsiveContainer width="100%" height={alto + altoDelEje}>
          <LineChart
            data={filas}
            margin={{ top: conRotulosDeBanda ? 24 : 10, right: margenDerecho, bottom: 4, left: 4 }}
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
            {bandasDibujadas.map(({ b, xa, xb, rotulo }, i) => (
              <ReferenceArea
                key={`${b.planVersionId}-${i}`}
                className="grafico__banda"
                x1={xa}
                x2={xb}
                fill="var(--fondo-suave)"
                fillOpacity={i % 2 === 0 ? 0.9 : 0.45}
                stroke="var(--borde)"
                ifOverflow="hidden"
                label={rotulo ? { value: rotulo, position: 'top', offset: 7, fill: 'var(--tenue)', fontSize: LETRA } : undefined}
              />
            ))}
            {/* Los días sin registros: un gris leve sobre la banda, debajo de todo lo demás. */}
            {sinRegistros.map((h) => (
              <ReferenceArea key={`sin-${h.desde}`} className="grafico__sin-registros" x1={Math.max(x0, mediodia(h.desde) - DIA / 2)} x2={Math.min(x1, mediodia(h.hasta) + DIA / 2)} fill="var(--grafico-hueco)" fillOpacity={0.2} stroke="none" ifOverflow="hidden" />
            ))}
            {referencia ? (
              <ReferenceArea x1={mediodia(referencia.desde) - DIA / 2} x2={mediodia(referencia.hasta) + DIA / 2} fill="var(--fondo-suave)" fillOpacity={0.35} stroke="var(--borde-control)" strokeDasharray="3 3" ifOverflow="hidden" label={{ value: 'Referencia', position: 'insideBottomLeft', fill: 'var(--tenue)', fontSize: LETRA }} />
            ) : null}
            {hitos.map((h, i) => (
              <ReferenceLine key={`${h.fecha}-${i}`} x={mediodia(h.fecha)} stroke="var(--tenue)" strokeDasharray="2 4" ifOverflow="hidden" />
            ))}
            {cortes.map((c, i) => {
              const x = mediodia(c.fecha) - DIA / 2;
              // El rótulo va a la derecha de la línea; cerca del final del gráfico, a la izquierda, para que entre.
              const alFinal = (x - x0) / (x1 - x0) > 0.6;
              return (
                <ReferenceLine
                  key={`corte-${c.fecha}-${i}`}
                  className="grafico__corte"
                  x={x}
                  stroke="var(--borde-control)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  ifOverflow="hidden"
                  label={{
                    value: cortes.length === 1 ? `${c.texto} · ${diaYMesCivil(c.fecha)}` : String(i + 1),
                    position: alFinal ? 'insideTopRight' : 'insideTopLeft',
                    fill: 'var(--texto)',
                    fontSize: LETRA,
                    fontWeight: cortes.length === 1 ? 400 : 700,
                  }}
                />
              );
            })}
            {modo === 'RELATIVE' ? <ReferenceLine y={0} stroke="var(--texto)" strokeWidth={1.25} /> : null}
            <XAxis
              dataKey="x"
              type="number"
              scale="time"
              domain={[x0, x1]}
              ticks={marcas}
              allowDataOverflow
              height={altoDelEje}
              tickSize={conFechas ? 6 : 4}
              tickFormatter={(x: number) => diaYMesCivil(fechaDeX(x))}
              tick={conFechas ? { fill: 'var(--tenue)', fontSize: LETRA } : MarcaSinFecha}
              axisLine={{ stroke: 'var(--borde-control)' }}
            />
            {/* Una métrica entera (repeticiones, RIR, conteos) no tiene marcas como «5,25 rep». La unidad va en el encabezado. */}
            <YAxis width={58} domain={['auto', 'auto']} allowDecimals={modo === 'RELATIVE' || series.some((s) => s.decimales > 0)} tickFormatter={(v: number) => (modo === 'RELATIVE' ? `${v > 0 ? '+' : ''}${numero(v)} %` : numero(v))} tick={{ fill: 'var(--tenue)', fontSize: LETRA }} axisLine={{ stroke: 'var(--borde-control)' }} />
            {/* Lo planificado: un tramo horizontal por escalón, discontinuo y sin puntos. El eje vertical lo incluye. */}
            {escalones.map((e, i) => {
              const xa = Math.max(x0, mediodia(e.desde) - DIA / 2);
              // Cada escalón termina donde empieza el siguiente: el día del cambio tiene un solo valor, el nuevo.
              const siguiente = escalones[i + 1];
              const xb = Math.min(x1, e.hasta ? mediodia(e.hasta) + DIA / 2 : x1, siguiente ? mediodia(siguiente.desde) - DIA / 2 : x1);
              if (xb <= xa) return null;
              return (
                <ReferenceLine
                  key={`plan-${e.desde}`}
                  className="grafico__plan"
                  segment={[
                    { x: xa, y: e.valor },
                    { x: xb, y: e.valor },
                  ]}
                  stroke={(ESTILOS[unica?.indice ?? 0] ?? ESTILOS[0]).color}
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  ifOverflow="extendDomain"
                />
              );
            })}
            {tramos.map((t) => {
              const e = ESTILOS[t.indice] ?? ESTILOS[0];
              return <Line key={t.clave} dataKey={t.clave} type="linear" stroke={e.color} strokeWidth={2} connectNulls isAnimationActive={false} dot={punto(t.clave)} activeDot={false} />;
            })}
            {/* El nombre de cada línea, a la derecha de su último punto, en el margen: va en una capa aparte, porque los
                puntos de una línea se recortan al área de dibujo. */}
            {compartido
              ? [...ultimos.entries()].map(([indice, final]) => (
                  <ReferenceDot
                    key={`nombre-${indice}`}
                    x={final.x}
                    y={final.valor}
                    r={0}
                    ifOverflow="visible"
                    label={(p: unknown) => {
                      const caja = (p as { viewBox?: { x?: number; y?: number; width?: number; height?: number } } | null)?.viewBox ?? {};
                      return (
                        <text className="grafico__nombre-de-linea" x={(caja.x ?? 0) + (caja.width ?? 0) / 2 + 16} y={(caja.y ?? 0) + (caja.height ?? 0) / 2 + (corrimientos.get(indice) ?? 0)} dominantBaseline="central" fill="var(--texto)" fontSize={LETRA} fontWeight={600}>
                          {rotulos.get(indice)}
                        </text>
                      );
                    }}
                  />
                ))
              : null}
            {fechaX !== null ? <ReferenceLine x={fechaX} stroke="var(--texto)" strokeWidth={1.5} strokeDasharray="6 3" ifOverflow="hidden" /> : null}
            {aros.map((a) => (
              <ReferenceDot key={`aro-${a.clave}`} className="grafico__aro" x={a.x} y={a.y} r={a.r} fill="none" stroke="var(--texto)" strokeWidth={2} ifOverflow="visible" />
            ))}
            {arrastre && Math.abs(arrastre.hasta - arrastre.desde) >= DIA ? <ReferenceArea x1={arrastre.desde} x2={arrastre.hasta} fill="var(--fondo-suave)" fillOpacity={0.6} stroke="var(--texto)" /> : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {filas.length === 0 ? <p className="nota">Sin puntos para dibujar en este período.</p> : null}
    </figure>
  );
}
