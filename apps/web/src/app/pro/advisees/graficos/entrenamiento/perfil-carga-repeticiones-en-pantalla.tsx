'use client';

/**
 * GR-06 en pantalla · El perfil carga-repeticiones de la persona en el ejercicio (WP-GRAFICOS fase 2, rama B; DL-174).
 * Una dispersión en SVG propio: en X, las repeticiones equivalentes (repeticiones + RIR); en Y, la carga. Las series de
 * las últimas 4 semanas, en punto lleno; las anteriores, en cruz y con otro color: la forma lo dice además del color. En
 * los ejercicios de la lista de la v1, las curvas de igual 1RM estimado (Epley v1), rotuladas «de la fórmula».
 *
 * Con la pasada visual (DISENO-VISUAL §1 y §2 «B · Entrenamiento»; §5 manda):
 * - **arriba,** el título (16 px) y, tenue, la unidad, qué es cada marca y el período; la leyenda como fichas en una
 *   línea, solo con lo que se ve;
 * - **el dibujo** con los dos ejes ajustados a los datos, con un margen (\`geometriaDelPerfil\`): ya no un eje de 0 a 12
 *   con los puntos apiñados; de 3 a 5 marcas redondas y una grilla tenue; las curvas recortadas al dibujo, cada una con
 *   su rótulo donde sale de él, sin pisarse;
 * - **a la vista,** la línea de lectura de la serie elegida y qué entra (§5.6: el rango de validez); **en «Cómo leerlo»**,
 *   qué es cada eje, qué queda afuera, qué son las curvas y cómo se recorre con el teclado.
 *
 * Accesibilidad: el área es un grupo con nombre y su descripción; el SVG no se lee. Con el teclado, las flechas recorren
 * las series de menos a más repeticiones equivalentes, Inicio y Fin van a las puntas y Escape suelta; la lectura de la
 * elegida es una región viva cortés, y la tabla dice lo mismo que el dibujo.
 *
 * Lee el comparador (API-TRN-21 y API-SER-01): todas las series de cada sesión, con su procedencia (GR-T36).
 */
import { entraEnLaEstimacion, numero } from '@be/domain';
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { indiceConTeclado } from '../../../../../lib/graficos';
import { LETRA_MINIMA } from '../../seguimiento/geometria';
import { ComoLeerlo } from '../como-leerlo';
import { COPY_DE_LOS_GRAFICOS as G } from '../copy';
import { diaYMes, inicioDelEje, textoDeLaMarca } from '../eje-de-fechas';
import { rotulosSinPisarse, textoDeLaMarcaDelEje } from '../ejes';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { colorDelCarril } from '../marcas';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { observacionesDelPeriodo } from './comparador';
import { COPY_PERFIL as C } from './copy';
import { ejercicioDeLaClave } from './fuerza-estimada';
import { useComparador } from './lecturas-del-ejercicio';
import { curvasDeLaFormula, dondeSeRotulaLaCurva, enOrden, geometriaDelPerfil, puntosDelPerfil, unidadMasReciente, type PuntoDelPerfil } from './perfil-carga-repeticiones';

const MARGEN = { izquierda: 52, derecha: 18, arriba: 14, abajo: 44 } as const;
/** Un gráfico principal: de 240 a 280 px (DISENO-VISUAL §1, principio 1). */
const ALTO = { COMPLETA: 280, COMPACTA: 240 } as const;
const ANCHO_INICIAL = 640;
const RADIO = 4.5;

/**
 * El ancho del contenedor, medido: el SVG no se estira, así la letra no baja de 12,5 px. Con una referencia que avisa
 * cuando aparece el área: mientras se lee, el área no está, y la medida tiene que empezar cuando llega.
 */
function useAncho(): [(el: HTMLDivElement | null) => void, number] {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const medir = () => setAncho(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    medir();
    const o = new ResizeObserver(medir);
    o.observe(el);
    return () => o.disconnect();
  }, [el]);
  return [setEl, ancho];
}

/** La marca de una serie: punto lleno para las últimas 4 semanas, cruz para las anteriores. */
function MarcaDeLaSerie({ p, cx, cy }: { p: PuntoDelPerfil; cx: number; cy: number }) {
  if (p.reciente) return <circle cx={cx} cy={cy} r={RADIO} fill={colorDelCarril(0)} stroke="var(--superficie)" strokeWidth={1} data-reciente="" />;
  return (
    <g stroke={colorDelCarril(1)} strokeWidth={2} strokeLinecap="round" data-anterior="">
      <line x1={cx - RADIO} y1={cy - RADIO} x2={cx + RADIO} y2={cy + RADIO} />
      <line x1={cx - RADIO} y1={cy + RADIO} x2={cx + RADIO} y2={cy - RADIO} />
    </g>
  );
}

/** El glifo de cada marca en la leyenda (14 px, como las fichas de la base), con su texto corto al lado. */
function Glifo({ que }: { que: 'reciente' | 'anterior' | 'curva' }) {
  return (
    <svg width={que === 'curva' ? 22 : 14} height={14} viewBox={que === 'curva' ? '0 0 22 14' : '0 0 14 14'} aria-hidden="true">
      {que === 'reciente' ? <circle cx={7} cy={7} r={4} fill={colorDelCarril(0)} /> : null}
      {que === 'anterior' ? (
        <g stroke={colorDelCarril(1)} strokeWidth={2} strokeLinecap="round">
          <line x1={3} y1={3} x2={11} y2={11} />
          <line x1={3} y1={11} x2={11} y2={3} />
        </g>
      ) : null}
      {que === 'curva' ? <line x1={1} x2={21} y1={7} y2={7} stroke="var(--grafico-indicado)" strokeWidth={1.5} strokeDasharray="5 4" /> : null}
    </svg>
  );
}

/** Una ficha de la leyenda: el glifo y el texto corto a la vista; el texto largo, para el lector de pantalla. */
function Ficha({ que, corto, largo }: { que: 'reciente' | 'anterior' | 'curva'; corto: string; largo: string }) {
  return (
    <li>
      <span className="grafico-base__glifo">
        <Glifo que={que} />
        <span aria-hidden="true">{corto}</span>
        <span className="visualmente-oculto">{largo}</span>
      </span>
    </li>
  );
}

export function PerfilCargaRepeticiones({ lectura, periodo, densidad, ejercicio }: PropsDelGrafico) {
  const id = useId();
  const recorte = `perfil-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const exerciseKey = ejercicio?.exerciseKey ?? null;
  const exerciseId = ejercicioDeLaClave(exerciseKey);
  const enLaLista = exerciseId !== null && entraEnLaEstimacion(exerciseId);
  const { comparador, recargar } = useComparador(lectura, periodo, exerciseKey !== null);
  const [ref, ancho] = useAncho();
  const [elegido, setElegido] = useState<number | null>(null);
  const [conCurvas, setConCurvas] = useState(true);
  const [conTabla, setConTabla] = useState(false);

  const datos = useMemo(() => {
    if (comparador.tipo !== 'lista' || !exerciseKey) return null;
    const observaciones = observacionesDelPeriodo(comparador.ejecuciones, exerciseKey, comparador.objetivosPorVersion, inicioDelEje(periodo), periodo.hasta);
    const unidad = ejercicio?.unidad ?? unidadMasReciente(observaciones) ?? 'kg';
    const { puntos, fuera } = puntosDelPerfil(observaciones, unidad, periodo.hoy);
    return { unidad, puntos: enOrden(puntos), fuera, curvas: enLaLista ? curvasDeLaFormula(puntos, unidad) : [] };
  }, [comparador, exerciseKey, ejercicio?.unidad, periodo, enLaLista]);

  if (!exerciseKey) return null;
  if (comparador.tipo === 'cargando') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'CARGANDO' }} />;
  if (comparador.tipo === 'sin-acceso') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_ACCESO' }} />;
  if (comparador.tipo === 'error') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'ERROR', motivo: comparador.motivo }} onReintentar={recargar} />;
  if (!datos) return null;
  const { unidad, puntos, fuera, curvas } = datos;
  const titulo = C.titulo;
  const hasta = periodo.hasta >= periodo.hoy ? null : diaYMes(periodo.hasta, periodo.hoy);
  const detalle = C.detalle(unidad, G.periodo(diaYMes(inicioDelEje(periodo), periodo.hoy), hasta));
  // §5.6: qué entra, a la vista, en una línea; el detalle, en «Cómo leerlo».
  const validez = [C.validez, ...(fuera > 0 ? [C.fuera(fuera)] : [])].join(' ');
  const aclaraciones = [C.queEs(unidad), C.queEntra, enLaLista ? C.queSonLasCurvas : C.sinCurvas, ...(curvas.length > 0 ? [C.lasCurvas(curvas.map((c) => c.rotulo))] : []), C.elegir];
  const pie = (
    <ComoLeerlo de={titulo}>
      {aclaraciones.map((n) => (
        <p key={n}>{n}</p>
      ))}
    </ComoLeerlo>
  );
  if (puntos.length === 0) {
    return (
      <section className="grafico-de-entrenamiento perfil-de-carga" aria-label={titulo} data-grafico="GR-06">
        <div className="grafico-base__cabecera">
          <h3 className="grafico-base__titulo">{titulo}</h3>
          <p className="grafico-base__detalle">{detalle}</p>
        </div>
        <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinSeries }} />
        <p className="nota grafico-base__nota">{validez}</p>
        <div className="grafico-base__pie">{pie}</div>
      </section>
    );
  }
  const alto = ALTO[densidad];
  const caja = { izquierda: MARGEN.izquierda, derecha: Math.max(MARGEN.izquierda + 40, ancho - MARGEN.derecha), arriba: MARGEN.arriba, abajo: alto - MARGEN.abajo };
  const g = geometriaDelPerfil(puntos, unidad, caja);
  const actual = elegido !== null && elegido < puntos.length ? puntos[elegido]! : null;
  const recientes = puntos.filter((p) => p.reciente).length;
  const anteriores = puntos.length - recientes;
  const curvasALaVista = conCurvas ? curvas : [];
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (elegido === null) return;
      e.preventDefault();
      setElegido(null);
      return;
    }
    const nuevo = indiceConTeclado(e, elegido, puntos.length);
    if (nuevo === null) return;
    e.preventDefault();
    setElegido(nuevo);
  };
  // Los rótulos de las curvas, donde cada una sale del dibujo y sin pisarse entre sí ni con los puntos: el que no entra no
  // se escribe (están todos en «Cómo leerlo»).
  const ocupadas = puntos.map((p) => ({ x1: g.x(p.equivalentes) - RADIO - 1, x2: g.x(p.equivalentes) + RADIO + 1, y1: g.y(p.carga) - RADIO - 1, y2: g.y(p.carga) + RADIO + 1 }));
  const rotulos = rotulosSinPisarse(
    [...curvasALaVista].reverse().flatMap((c) => {
      const lugar = dondeSeRotulaLaCurva(c, g, caja);
      return lugar ? [{ clave: `c${c.valor}`, x: lugar.x, y: lugar.y, texto: C.rotuloCortoDeLaCurva(numero(c.valor)) }] : [];
    }),
    caja,
    ocupadas,
    8,
  );
  return (
    <section className="grafico-de-entrenamiento perfil-de-carga" aria-label={titulo} data-grafico="GR-06">
      <div className="grafico-base__cabecera">
        <h3 className="grafico-base__titulo">{titulo}</h3>
        <p className="grafico-base__detalle">{detalle}</p>
      </div>
      {/* La leyenda: fichas cortas en una línea, solo con lo que se ve en el dibujo. */}
      <ul className="grafico-base__leyenda" aria-label={C.leyenda}>
        {recientes > 0 ? <Ficha que="reciente" corto={C.leyendaCorta.recientes} largo={C.recientes} /> : null}
        {anteriores > 0 ? <Ficha que="anterior" corto={C.leyendaCorta.anteriores} largo={C.anteriores} /> : null}
        {enLaLista && curvasALaVista.length > 0 ? <Ficha que="curva" corto={C.leyendaCorta.curva} largo={C.curva} /> : null}
      </ul>
      <div
        ref={ref}
        className="grafico-base__area perfil-de-carga__area"
        tabIndex={0}
        role="group"
        aria-roledescription="gráfico"
        aria-label={`${titulo}. ${C.elegir}`}
        aria-describedby={`${id}-resumen`}
        onKeyDown={alTeclear}
      >
        <svg width="100%" height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" className="grafico-base__svg">
          <defs>
            <clipPath id={recorte}>
              <rect x={caja.izquierda} y={caja.arriba} width={caja.derecha - caja.izquierda} height={caja.abajo - caja.arriba} />
            </clipPath>
          </defs>
          {g.marcasY.map((m) => (
            <g key={`y${m.valor}`} className="grafico-base__grilla">
              <line x1={caja.izquierda} x2={caja.derecha} y1={Math.round(m.y) + 0.5} y2={Math.round(m.y) + 0.5} stroke="var(--borde)" strokeWidth={1} />
              <text x={caja.izquierda - 8} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                {textoDeLaMarcaDelEje(m.valor, g.extremos.decimales)}
              </text>
            </g>
          ))}
          {g.marcasX.map((m) => (
            <g key={`x${m.valor}`}>
              <line x1={Math.round(m.x) + 0.5} x2={Math.round(m.x) + 0.5} y1={caja.arriba} y2={caja.abajo} stroke="var(--borde)" strokeWidth={1} opacity={0.45} />
              <text x={m.x} y={caja.abajo + 16} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                {textoDeLaMarcaDelEje(m.valor, g.ejeX.decimales)}
              </text>
            </g>
          ))}
          <text x={(caja.izquierda + caja.derecha) / 2} y={alto - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
            {C.ejeX}
          </text>
          {curvasALaVista.map((c) => (
            <polyline
              key={`c${c.valor}`}
              clipPath={`url(#${recorte})`}
              points={c.puntos.map((p) => `${g.x(p.equivalentes)},${g.y(p.carga)}`).join(' ')}
              fill="none"
              stroke="var(--grafico-indicado)"
              strokeWidth={1.25}
              strokeDasharray="5 4"
              data-curva-de-la-formula=""
            />
          ))}
          {rotulos.map((r) => (
            <text key={r.clave} x={r.tx} y={r.ty} textAnchor={r.ancla} fontSize={12} fill="var(--tenue)" data-rotulo-de-la-curva="">
              {r.texto}
            </text>
          ))}
          {[...puntos.filter((p) => !p.reciente), ...puntos.filter((p) => p.reciente)].map((p) => (
            <MarcaDeLaSerie key={p.clave} p={p} cx={g.x(p.equivalentes)} cy={g.y(p.carga)} />
          ))}
          {actual ? <circle cx={g.x(actual.equivalentes)} cy={g.y(actual.carga)} r={RADIO + 4} fill="none" stroke="var(--grafico-cursor)" strokeWidth={1.5} /> : null}
          {puntos.map((p, i) => (
            <circle key={`t${p.clave}`} cx={g.x(p.equivalentes)} cy={g.y(p.carga)} r={10} fill="transparent" onClick={() => setElegido(i)} />
          ))}
        </svg>
      </div>
      <p id={`${id}-resumen`} className="visualmente-oculto">
        {C.descripcion(puntos.length, recientes)}
      </p>
      <div className="grafico-base__lectura" aria-live="polite">
        <p className="nota">{actual ? actual.lectura : C.sinElegir}</p>
      </div>
      <p className="nota grafico-base__nota" data-validez-del-perfil>
        {validez}
      </p>
      {enLaLista && curvas.length > 0 ? (
        <label className="capa grafico-de-entrenamiento__interruptor">
          <input type="checkbox" role="switch" checked={conCurvas} onChange={(e) => setConCurvas(e.target.checked)} />
          <span>{C.mostrarCurvas}</span>
        </label>
      ) : null}
      <div className="grafico-base__pie">
        <div className="grafico-base__tabla">
          <button type="button" className="boton boton--enlace" aria-expanded={conTabla} aria-controls={`${id}-tabla`} onClick={() => setConTabla((a) => !a)}>
            {conTabla ? C.ocultarTabla : C.tabla}
          </button>
          <div id={`${id}-tabla`} hidden={!conTabla}>
            {conTabla ? (
              <div className="grafico-base__tabla-desplazable">
                <table>
                  <caption>{titulo}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{C.columnas.fecha}</th>
                      <th scope="col">{C.columnas.carga}</th>
                      <th scope="col">{C.columnas.repeticiones}</th>
                      <th scope="col">{C.columnas.rir}</th>
                      <th scope="col">{C.columnas.equivalentes}</th>
                      <th scope="col">{C.columnas.cuando}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puntos.map((p) => (
                      <tr key={p.clave}>
                        <th scope="row">{textoDeLaMarca(p.fecha)}</th>
                        <td>
                          {numero(p.carga)} {p.unidad}
                        </td>
                        <td>{p.repeticiones}</td>
                        <td>{numero(p.rir)}</td>
                        <td>{numero(p.equivalentes)}</td>
                        <td>{p.reciente ? C.recientesCorto : C.anterioresCorto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
        {pie}
      </div>
    </section>
  );
}
