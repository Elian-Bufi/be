'use client';

/**
 * Un gráfico chico por semana (WP-GRAFICOS, pasada visual del 15/11; DISENO-VISUAL §1, principio 6): una serie diaria con
 * muchos días sin dato (la alimentación) no se dibuja como un peine. Va una barra por semana con la media de los días con
 * dato, desde cero; los días, como puntos tenues detrás. Lo usa «Comparar dos etapas» (GR-24) en Nutrición, con «Día por
 * día» a un toque. La geometría y los textos son puros (`semanas.ts`).
 *
 * La revisión del 15/11 (§5.4 y §5.13: cada media con su cantidad, lo que quedó afuera y por qué):
 * - **La lectura, a la vista:** debajo del dibujo, una línea dice el tramo elegido entero («Semana del 3 nov: 1.850 kcal,
 *   media de 5 de 7 días (1 subtotal); fuera de la media: 2 días sin registros»). De entrada, el último con valor; pasar
 *   el mouse lo cambia mientras está encima, y tocar o hacer clic lo fija. Antes, el «5 de 7 días» estaba solo en el
 *   globo nativo del navegador, que no llega con el teclado, con el dedo ni al lector de pantalla.
 * - **Con el teclado:** el gráfico recibe el foco y las flechas eligen el tramo anterior o el siguiente; la línea es una
 *   región viva cortés que cambia solo con el teclado o un toque, nunca al pasar el mouse.
 * - **El lector de pantalla** oye el nombre del gráfico con un resumen sin primero contra último, y tiene la tabla de las
 *   semanas: cada media con sus días, sus subtotales y lo que quedó afuera.
 * - **La forma dice la cobertura:** la barra va llena solo con la semana entera (siete días con valor, sin subtotales y
 *   sin hoy); si no, hueca, con su contorno. Un tramo sin días con valor es una columna gris de todo el alto, nunca una
 *   raya sobre el cero. Debajo, la tira de cobertura dice el estado de cada día.
 * - **Contraste:** el relleno de la semana entera llega a 3:1 contra la superficie y contra la hueca en los dos temas, y el
 *   contorno y el tope van enteros: las dos formas se distinguen por el contorno, no solo por un tono (DISENO-VISUAL §1,
 *   principio 10; `RELLENO_ENTERA` en `semanas.ts`).
 * - **Las etapas no se mezclan:** una semana que cruza el cambio de etapa son dos tramos, uno de cada lado de la línea.
 *
 * **Una sola media semanal (GR-VC13, rama D):** Nutrición le pasa las semanas ya calculadas con la media de GR-12
 * (`semanas`): los subtotales no entran y, con menos de 4 días sin faltantes, no hay media. Una semana con días pero sin
 * media va con su contorno cortado, sin relleno (`sinMedia`), y sus días se ven igual; la columna gris queda para la que
 * no tiene ningún día con valor. La leyenda (`LeyendaPorSemana`) muestra solo las marcas que se ven y dice cómo se arma
 * cada barra con la regla que se usó (`comoSeArma`).
 */
import { useCallback, useEffect, useId, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { ESTILOS } from '../seguimiento/marca';
import { ComoLeerlo } from './como-leerlo';
import { diaYMes } from './eje-de-fechas';
import {
  ALTO_DE_LA_TIRA,
  cuandoEsLaSemana,
  geometriaPorSemana,
  lecturaDeLaSemana,
  OPACIDAD_DE_LOS_DIAS,
  RELLENO_ENTERA,
  RELLENO_HUECA,
  resumenDeLasSemanas,
  tramoDeEntrada,
  tramoEnX,
  type DiaDeLaSerie,
  type MarcasPorSemanaQueSeVen,
  type SemanaDeLaSerie,
} from './semanas';

const LETRA = 12.5;

export const COPY_POR_SEMANA = {
  grafico: (titulo: string) => `${titulo}, por semana, con las etapas A y B`,
  comoSeUsa: 'Flechas: el tramo anterior o el siguiente; Inicio y Fin: el primero y el último.',
  tabla: (titulo: string) => `${titulo}: la media de cada semana, con sus días`,
  tramo: 'Semana',
  media: 'Media, con sus días',
  leyenda: {
    entera: 'Semana entera',
    hueca: 'Con días afuera',
    vacia: 'Sin días con valor',
    sinMedia: 'Sin media',
    tira: 'Cada día',
  },
  leyendaLarga: {
    entera: 'Barra llena: los siete días de la semana tienen valor, sin subtotales y sin hoy',
    hueca: 'Barra hueca: a la semana le falta algún día, tiene un subtotal o tiene hoy, o el período o el cambio de etapa la cortan',
    vacia: 'Columna gris: ningún día del tramo tiene valor; no es un cero',
    sinMedia: 'Raya cortada sobre el eje: el tramo tiene días con valor, pero no los que hacen falta para la media; no es un cero',
    tira: 'La tira de abajo, un día por lugar: entera con valor, a media altura con algo que falta, una raya baja sin registros',
  },
  comoSeArma: [
    'Cada barra es la media de los días con valor de esa semana, de lunes a domingo, con el mismo criterio que la tabla: los subtotales entran (son un piso: al día le falta algo) y se cuentan; hoy no entra hasta que termine.',
    'La línea de debajo de cada gráfico dice con cuántos días se hizo la media, cuántos son subtotales y cuántos quedaron afuera y por qué. Pasá el mouse, tocá una barra o usá las flechas para leer otra semana.',
    'Una semana que cruza el cambio de etapa se parte en dos tramos, uno de cada lado: ninguna media mezcla días de A con días de B.',
  ],
  titulo: 'Cómo se arma cada barra',
} as const;

/** El glifo del título de un gráfico por semana: una barra, no una línea con un punto (la marca que no se dibuja, no va). */
export function MarcaDeBarra({ indice }: { indice: number }) {
  const color = (ESTILOS[indice] ?? ESTILOS[0]).color;
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" className="marca-de-metrica">
      <rect x={3} y={4} width={8} height={9} fill={color} fillOpacity={RELLENO_ENTERA} />
      <line x1={3} x2={11} y1={4.75} y2={4.75} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

const TODAS_LAS_MARCAS: MarcasPorSemanaQueSeVen = { entera: true, hueca: true, sinMedia: false, vacia: true };

/**
 * Las marcas del dibujo por semana, como fichas, y cómo se arma cada barra: una vez, arriba de los gráficos. `que`: las
 * que se ven (sin él, las de la media de la tabla); `comoSeArma`: la regla de la media que se usó.
 */
export function LeyendaPorSemana({ que = TODAS_LAS_MARCAS, comoSeArma = COPY_POR_SEMANA.comoSeArma }: { que?: MarcasPorSemanaQueSeVen; comoSeArma?: readonly string[] } = {}) {
  const C = COPY_POR_SEMANA;
  return (
    <div className="leyenda-por-semana" data-leyenda-por-semana>
      <ul className="leyenda-por-semana__fichas">
        {que.entera ? (
          <li>
            <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
              <rect x={2} y={3} width={10} height={10} fill="var(--tenue)" fillOpacity={RELLENO_ENTERA} />
              <line x1={2} x2={12} y1={3.75} y2={3.75} stroke="var(--tenue)" strokeWidth={1.5} />
            </svg>
            <span aria-hidden="true">{C.leyenda.entera}</span>
            <span className="visualmente-oculto">{C.leyendaLarga.entera}</span>
          </li>
        ) : null}
        {que.hueca ? (
          <li>
            <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
              <path d="M 2.5 13 V 3.5 H 11.5 V 13" fill="none" stroke="var(--tenue)" strokeWidth={1} />
            </svg>
            <span aria-hidden="true">{C.leyenda.hueca}</span>
            <span className="visualmente-oculto">{C.leyendaLarga.hueca}</span>
          </li>
        ) : null}
        {que.sinMedia ? (
          <li data-ficha="sin-media">
            <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
              <line x1={1} x2={13} y1={12} y2={12} stroke="var(--grafico-hueco)" strokeWidth={2} strokeDasharray="3 2" />
            </svg>
            <span aria-hidden="true">{C.leyenda.sinMedia}</span>
            <span className="visualmente-oculto">{C.leyendaLarga.sinMedia}</span>
          </li>
        ) : null}
        {que.vacia ? (
          <li>
            <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
              <rect x={2} y={1} width={10} height={12} fill="var(--grafico-hueco)" fillOpacity={0.3} />
            </svg>
            <span aria-hidden="true">{C.leyenda.vacia}</span>
            <span className="visualmente-oculto">{C.leyendaLarga.vacia}</span>
          </li>
        ) : null}
        <li>
          <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
            <rect x={1} y={5} width={5} height={6} fill="var(--tenue)" />
            <rect x={8} y={8} width={5} height={3} fill="var(--tenue)" />
            <rect x={15} y={9.5} width={5} height={1.5} fill="var(--grafico-hueco)" />
          </svg>
          <span aria-hidden="true">{C.leyenda.tira}</span>
          <span className="visualmente-oculto">{C.leyendaLarga.tira}</span>
        </li>
      </ul>
      <ComoLeerlo titulo={C.titulo} className="leyenda-por-semana__como-leerlo">
        {comoSeArma.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </ComoLeerlo>
    </div>
  );
}

export function MinigraficoPorSemana({
  dias,
  unidad,
  desde,
  hasta,
  hoy,
  alto,
  indice = 0,
  bandas,
  plan,
  fechas,
  titulo,
  semanas,
}: {
  dias: readonly DiaDeLaSerie[];
  unidad: string;
  desde: string;
  hasta: string;
  hoy: string;
  alto: number;
  indice?: number;
  bandas?: readonly { readonly desde: string; readonly hasta: string; readonly rotulo: string }[];
  plan?: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
  fechas?: readonly string[];
  /** El nombre de la métrica: el del gráfico y el de su tabla. */
  titulo: string;
  /** Los tramos ya calculados con la regla de su área (Nutrición: la media de GR-12, GR-VC13); sin ellos, la de la tabla. */
  semanas?: readonly SemanaDeLaSerie[];
}) {
  const id = useId();
  const [caja, setCaja] = useState<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!caja) return;
    setAncho(caja.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(() => setAncho(caja.clientWidth));
    observador.observe(caja);
    return () => observador.disconnect();
  }, [caja]);
  const textoDeLaFecha = useCallback((f: string) => diaYMes(f, hoy), [hoy]);
  const g = useMemo(() => geometriaPorSemana({ dias, desde, hasta, hoy, ancho, alto, bandas, plan, fechas, textoDeLaFecha, semanas }), [dias, desde, hasta, hoy, ancho, alto, bandas, plan, fechas, textoDeLaFecha, semanas]);
  // El tramo elegido (con el teclado o un toque) y el que está bajo el mouse. La región viva sigue solo al elegido.
  const [elegido, setElegido] = useState<number | null>(null);
  const [encima, setEncima] = useState<number | null>(null);
  const deEntrada = tramoDeEntrada(g.semanas);
  const indiceElegido = elegido !== null && elegido < g.semanas.length ? elegido : deEntrada;
  const semanaElegida = g.semanas[indiceElegido] ?? null;
  const semanaEncima = encima !== null ? (g.semanas[encima] ?? null) : null;
  const activo = encima ?? indiceElegido;
  const color = (ESTILOS[indice] ?? ESTILOS[0]).color;
  const resumen = useMemo(() => resumenDeLasSemanas(g.semanas, unidad), [g.semanas, unidad]);
  const xDelPuntero = (e: MouseEvent<HTMLDivElement>): number => {
    const r = e.currentTarget.getBoundingClientRect();
    return (e.clientX - r.left) * (ancho / Math.max(1, r.width));
  };
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const ultimo = g.semanas.length - 1;
    const destino = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? indiceElegido - 1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? indiceElegido + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? ultimo : null;
    if (destino === null || ultimo < 0) return;
    e.preventDefault();
    setEncima(null);
    setElegido(Math.min(Math.max(destino, 0), ultimo));
  };
  const lugarActivo = g.tramos[activo];
  return (
    <div className="minigrafico-por-semana" data-minigrafico-por-semana>
      <div
        ref={setCaja}
        className="minigrafico minigrafico-por-semana__lienzo"
        tabIndex={0}
        role="group"
        aria-roledescription="gráfico"
        aria-label={`${COPY_POR_SEMANA.grafico(titulo)}. ${resumen} ${COPY_POR_SEMANA.comoSeUsa}`}
        aria-describedby={`${id}-lectura`}
        onKeyDown={alTeclear}
        onPointerMove={(e) => {
          if (e.pointerType === 'mouse') setEncima(tramoEnX(g, xDelPuntero(e)));
        }}
        onPointerLeave={() => setEncima(null)}
        onClick={(e) => {
          const i = tramoEnX(g, xDelPuntero(e));
          if (i !== null) setElegido(i);
        }}
        style={{ height: alto }}
      >
        {ancho > 0 ? (
          <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" focusable="false">
            {/* El tramo que se lee: un fondo apenas marcado, detrás de todo. */}
            {lugarActivo ? <rect className="minigrafico-por-semana__activo" x={lugarActivo.x - 1} y={g.caja.arriba} width={lugarActivo.ancho + 2} height={g.yDeLaTira + ALTO_DE_LA_TIRA - g.caja.arriba} fill="var(--grafico-cursor)" opacity={0.1} /> : null}
            {g.bandas.map((b, i) => (
              <g key={`banda-${b.rotulo}`} className="minigrafico__banda" data-rotulo={b.rotulo}>
                <rect x={b.x} y={12} width={b.ancho} height={3} fill="var(--banda)" />
                {i > 0 ? <line x1={b.x} x2={b.x} y1={2} y2={g.yDeLaTira + ALTO_DE_LA_TIRA} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="1 3" /> : null}
                <text x={b.x + 6} y={9} dominantBaseline="central" fill="var(--texto)" fontSize={LETRA} fontWeight={600}>
                  {b.rotulo}
                </text>
              </g>
            ))}
            {/* Un tramo sin días con valor: una columna gris de todo el alto, que no se lee como una barra en cero. */}
            {g.vacias.map((b) => (
              <rect key={`vacia-${b.semana.desde}`} className="minigrafico-por-semana__vacia" x={b.x} y={g.caja.arriba} width={b.ancho} height={g.caja.abajo - g.caja.arriba} fill="var(--grafico-hueco)" fillOpacity={0.18} />
            ))}
            {/* Un tramo con días pero sin media: una raya cortada y baja sobre el eje, que no tapa los días (GR-VD10). */}
            {g.sinMedia.map((b) => (
              <line key={`sin-media-${b.semana.desde}`} className="minigrafico-por-semana__sin-media" x1={b.x} x2={b.x + Math.max(1, b.ancho)} y1={g.caja.abajo - 1} y2={g.caja.abajo - 1} stroke="var(--grafico-hueco)" strokeWidth={2} strokeDasharray="3 2" />
            ))}
            {g.eje.map((m) => (
              <g key={m.valor} className="minigrafico__marca">
                <line x1={g.caja.izquierda} x2={g.caja.derecha} y1={Math.round(m.y) + 0.5} y2={Math.round(m.y) + 0.5} stroke="var(--borde)" strokeWidth={1} opacity={0.7} />
                <text x={g.caja.izquierda - 6} y={m.y} textAnchor="end" dominantBaseline="central" fill="var(--tenue)" fontSize={LETRA}>
                  {m.texto}
                </text>
              </g>
            ))}
            {/* Los días, como puntos tenues detrás de las barras: se ve de qué sale cada media. Hoy no va: no entra. */}
            {g.dias.map((d) => (
              <circle key={`dia-${d.fecha}`} className="minigrafico-por-semana__dia" cx={d.x} cy={d.y} r={1.5} fill={color} opacity={OPACIDAD_DE_LOS_DIAS} />
            ))}
            {/* Cada tramo con valor, una barra con su tope: llena si la semana está entera; si no, hueca, con su contorno. */}
            {g.barras.map((b) => (
              <g key={b.semana.desde} className="minigrafico-por-semana__semana" data-hueca={b.hueca ? '' : undefined} data-dias={b.semana.conDato}>
                <rect x={b.x} y={b.y} width={b.ancho} height={Math.max(0, g.caja.abajo - b.y)} fill={color} fillOpacity={b.hueca ? RELLENO_HUECA : RELLENO_ENTERA} />
                {b.hueca ? (
                  <path d={`M ${b.x + 0.5} ${g.caja.abajo} V ${b.y + 0.5} H ${b.x + b.ancho - 0.5} V ${g.caja.abajo}`} fill="none" stroke={color} strokeWidth={1} />
                ) : (
                  <line x1={b.x} x2={b.x + b.ancho} y1={b.y + 1} y2={b.y + 1} stroke={color} strokeWidth={2} />
                )}
              </g>
            ))}
            {g.plan.map((s) => (
              <line key={`objetivo-${s.x1}`} className="minigrafico__objetivo" x1={s.x1} x2={s.x2} y1={s.y} y2={s.y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
            ))}
            {/* La tira de cobertura: el alto dice el estado del día además del color (entera, a media altura o una raya baja). */}
            <g className="minigrafico-por-semana__tira" shapeRendering="crispEdges">
              {g.tira.map((d) =>
                d.estado === 'con' ? (
                  <rect key={d.fecha} x={d.x} y={g.yDeLaTira} width={d.ancho} height={ALTO_DE_LA_TIRA} fill={color} data-estado="con" />
                ) : d.estado === 'hueco' ? (
                  <rect key={d.fecha} x={d.x} y={g.yDeLaTira + ALTO_DE_LA_TIRA / 2} width={d.ancho} height={ALTO_DE_LA_TIRA / 2} fill={color} data-estado="hueco" />
                ) : d.estado === 'hoy' ? (
                  <rect key={d.fecha} x={d.x} y={g.yDeLaTira + ALTO_DE_LA_TIRA - 2} width={Math.max(2, d.ancho)} height={2} fill="var(--ahora)" data-estado="hoy" />
                ) : (
                  <rect key={d.fecha} x={d.x} y={g.yDeLaTira + ALTO_DE_LA_TIRA - 1.5} width={d.ancho} height={1.5} fill="var(--grafico-hueco)" data-estado="sin" />
                ),
              )}
            </g>
            {g.fechas.map((f) => (
              <text key={f.fecha} className="minigrafico__fecha" x={f.x} y={alto - 4} textAnchor={f.ancla} fill="var(--tenue)" fontSize={LETRA}>
                {diaYMes(f.fecha, hoy)}
              </text>
            ))}
          </svg>
        ) : null}
      </div>
      {/* La lectura del tramo, a la vista. La región viva cambia con el teclado o un toque; al pasar el mouse se ve la del
          tramo de abajo del puntero, en un renglón que el lector de pantalla no oye. */}
      <p id={`${id}-lectura`} className={semanaEncima ? 'minigrafico-por-semana__lectura visualmente-oculto' : 'minigrafico-por-semana__lectura'} aria-live="polite" data-lectura-de-la-semana>
        {semanaElegida ? lecturaDeLaSemana(semanaElegida, unidad) : null}
      </p>
      {semanaEncima ? (
        <p className="minigrafico-por-semana__lectura" aria-hidden="true" data-lectura-bajo-el-mouse>
          {lecturaDeLaSemana(semanaEncima, unidad)}
        </p>
      ) : null}
      {/* Oculta en un div: una tabla no se achica a 1 px y, con las medias largas, desbordaba la página a lo ancho. */}
      <div className="visualmente-oculto">
        <table data-tabla-de-las-semanas>
          <caption>{COPY_POR_SEMANA.tabla(titulo)}</caption>
          <thead>
            <tr>
              <th scope="col">{COPY_POR_SEMANA.tramo}</th>
              <th scope="col">{COPY_POR_SEMANA.media}</th>
            </tr>
          </thead>
          <tbody>
            {g.semanas.map((s) => (
              <tr key={s.desde}>
                <th scope="row">{cuandoEsLaSemana(s)}</th>
                <td>{lecturaDeLaSemana(s, unidad).slice(cuandoEsLaSemana(s).length + 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
