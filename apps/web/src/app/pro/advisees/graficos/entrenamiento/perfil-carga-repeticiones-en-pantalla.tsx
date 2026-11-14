'use client';

/**
 * GR-06 en pantalla · El perfil carga-repeticiones de la persona en el ejercicio (WP-GRAFICOS fase 2, rama B; DL-174).
 * Una dispersión en SVG propio: en X, las repeticiones equivalentes (repeticiones + RIR); en Y, la carga. Las series de
 * las últimas 4 semanas, en punto lleno; las anteriores, en cruz y con otro color: la forma lo dice además del color. En
 * los ejercicios de la lista de la v1, las curvas de igual 1RM estimado (Epley v1), rotuladas «de la fórmula».
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
import { inicioDelEje, textoDeLaMarca } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { colorDelCarril } from '../marcas';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { observacionesDelPeriodo } from './comparador';
import { COPY_PERFIL as C } from './copy';
import { ejercicioDeLaClave } from './fuerza-estimada';
import { useComparador } from './lecturas-del-ejercicio';
import { curvasDeLaFormula, enOrden, geometriaDelPerfil, puntosDelPerfil, unidadMasReciente, type PuntoDelPerfil } from './perfil-carga-repeticiones';

const MARGEN = { izquierda: 56, derecha: 52, arriba: 14, abajo: 44 } as const;
const ALTO = { COMPLETA: 300, COMPACTA: 240 } as const;
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

const formato = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

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

/** El glifo de cada marca en la leyenda, con su texto al lado. */
function Glifo({ que }: { que: 'reciente' | 'anterior' | 'curva' }) {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
      {que === 'reciente' ? <circle cx={9} cy={9} r={RADIO} fill={colorDelCarril(0)} /> : null}
      {que === 'anterior' ? (
        <g stroke={colorDelCarril(1)} strokeWidth={2} strokeLinecap="round">
          <line x1={9 - RADIO} y1={9 - RADIO} x2={9 + RADIO} y2={9 + RADIO} />
          <line x1={9 - RADIO} y1={9 + RADIO} x2={9 + RADIO} y2={9 - RADIO} />
        </g>
      ) : null}
      {que === 'curva' ? <line x1={1} x2={17} y1={9} y2={9} stroke="var(--grafico-indicado)" strokeWidth={1.5} strokeDasharray="4 3" /> : null}
    </svg>
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
  const titulo = C.titulo(unidad);
  const notas = [C.queEntra, ...(fuera > 0 ? [C.fuera(fuera)] : []), enLaLista ? C.queSonLasCurvas : C.sinCurvas];
  if (puntos.length === 0) {
    return (
      <section className="grafico-de-entrenamiento perfil-de-carga" aria-label={titulo} data-grafico="GR-06">
        <h3 className="grafico-base__titulo">{titulo}</h3>
        <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinSeries }} />
        {notas.map((n) => (
          <p key={n} className="nota">
            {n}
          </p>
        ))}
      </section>
    );
  }
  const alto = ALTO[densidad];
  const caja = { izquierda: MARGEN.izquierda, derecha: Math.max(MARGEN.izquierda + 40, ancho - MARGEN.derecha), arriba: MARGEN.arriba, abajo: alto - MARGEN.abajo };
  const g = geometriaDelPerfil(puntos, unidad, caja);
  const actual = elegido !== null && elegido < puntos.length ? puntos[elegido]! : null;
  const recientes = puntos.filter((p) => p.reciente).length;
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
  // Los rótulos de las curvas, al final de cada una y sin pisarse: uno que quedaría encima de otro no se escribe (la lista
  // de abajo los dice todos).
  const rotulos = curvas
    .map((c) => ({ valor: c.valor, y: g.y(c.puntos[c.puntos.length - 1]!.carga) }))
    .filter((r) => r.y >= caja.arriba && r.y <= caja.abajo)
    .filter((r, i, todos) => i === 0 || Math.abs(r.y - todos[i - 1]!.y) >= LETRA_MINIMA + 2);
  return (
    <section className="grafico-de-entrenamiento perfil-de-carga" aria-label={titulo} data-grafico="GR-06">
      <h3 className="grafico-base__titulo">{titulo}</h3>
      <p className="nota">{C.queEs(unidad)}</p>
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
            <g key={`y${m.valor}`}>
              <line x1={caja.izquierda} x2={caja.derecha} y1={m.y} y2={m.y} stroke="var(--borde)" strokeWidth={1} opacity={0.5} />
              <text x={caja.izquierda - 6} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                {formato(m.valor, g.extremos.decimales)}
              </text>
            </g>
          ))}
          {g.marcasX.map((m) => (
            <g key={`x${m.valor}`}>
              <line x1={m.x} x2={m.x} y1={caja.arriba} y2={caja.abajo} stroke="var(--borde)" strokeWidth={1} opacity={0.35} />
              <text x={m.x} y={caja.abajo + 16} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                {m.valor}
              </text>
            </g>
          ))}
          <text x={(caja.izquierda + caja.derecha) / 2} y={alto - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
            {C.ejeX}
          </text>
          {conCurvas
            ? curvas.map((c) => (
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
              ))
            : null}
          {conCurvas
            ? rotulos.map((r) => (
                <text key={`r${r.valor}`} x={caja.derecha + 4} y={r.y} dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                  ≈ {numero(r.valor)}
                </text>
              ))
            : null}
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
      <ul className="grafico-base__leyenda" aria-label={C.leyenda}>
        <li>
          <span className="grafico-base__glifo">
            <Glifo que="reciente" />
            {C.recientes}
          </span>
        </li>
        <li>
          <span className="grafico-base__glifo">
            <Glifo que="anterior" />
            {C.anteriores}
          </span>
        </li>
        {enLaLista && curvas.length > 0 ? (
          <li>
            <span className="grafico-base__glifo">
              <Glifo que="curva" />
              {C.curva}
            </span>
          </li>
        ) : null}
      </ul>
      {enLaLista && curvas.length > 0 ? (
        <>
          <label className="capa grafico-de-entrenamiento__interruptor">
            <input type="checkbox" role="switch" checked={conCurvas} onChange={(e) => setConCurvas(e.target.checked)} />
            <span>{C.mostrarCurvas}</span>
          </label>
          <p className="nota" data-curvas-de-la-formula>
            {C.lasCurvas(curvas.map((c) => c.rotulo))}
          </p>
        </>
      ) : null}
      {notas.map((n) => (
        <p key={n} className="nota grafico-base__nota">
          {n}
        </p>
      ))}
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
    </section>
  );
}
