'use client';

/**
 * DL-204 (WP-GRAFICOS-DEL-EJERCICIO, GE-05 a GE-08) · «<Ejercicio>: serie por serie», debajo de «La carga por semana» en
 * el panel del ejercicio del editor de Entrenamiento. Solo muestra.
 *
 * - **Eje X:** las series en su orden: A1, A2… las aproximaciones y S1, S2… las efectivas. **Eje Y:** la carga, desde 0
 *   (ET1-D17).
 * - **Las barras** son la carga planificada de esa semana, con la progresión que rige al ejercicio
 *   (`prescripcionDeLaSemana`); las aproximaciones, en un tono más suave.
 * - **El 1RM de referencia,** si hay, es una línea punteada horizontal con su rótulo («1RM 101,5 kg»); cada barra dice su
 *   parte del 1RM con la base nombrada («25 kg · 25 % del 1RM»).
 * - **Lo realizado:** si esa semana tiene un registro del ejercicio, un punto lleno sobre cada serie (la vez más reciente
 *   de la semana). Ubica, no califica: no hay colores de juicio ni cuentas de logro; lo que no hay, «Sin registros todavía».
 * - **El selector de semana** (S1…Sn) muestra cómo cambia cada serie con la progresión.
 * - Se lee con el teclado (← y →), tiene su lectura en un renglón reservado (RP-19) y «Ver la tabla».
 * El cardio no lo lleva: lo decide quien lo arma (`editor.tsx`).
 */
import {
  COPY_GRAFICOS_DEL_EJERCICIO as C,
  fechaEnPocasPalabras,
  lecturaDeLaSerie,
  numero,
  prescripcionDeLaSemana,
  semanaDeLaFecha,
  seriesParaElGrafico,
  textoDeLaBarra,
  vezDeLaSemana,
  type AproximacionesDelEjercicio,
  type FaseEnElCalendario,
  type PrescripcionParaLasSeries,
  type SemanaDeLaFase,
  type VezPasada,
} from '@be/domain';
import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import type { Resultado } from '../../../../lib/api';
import { hoyEn } from '../seguimiento/estado';
import { useUnoRM } from './uno-rm-del-ejercicio';

const ANCHO = 360;
const ALTO = 172;
const M = { izq: 42, der: 10, arr: 14, aba: 24 } as const;

/** Tres o cuatro marcas «redondas» entre 0 y el máximo (como el gráfico de las semanas). */
function marcasDelEje(max: number): number[] {
  const crudo = (max || 1) / 3;
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo) ?? crudo;
  const marcas: number[] = [];
  for (let v = 0; v <= max + paso * 0.5 && marcas.length < 6; v += paso) marcas.push(Math.round(v * 100) / 100);
  return marcas.length > 1 ? marcas : [0, paso];
}

export function SeriePorSerie({
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  nombre,
  unidad,
  prescripcion,
  aproximaciones,
  reglas,
  semanas,
  descargas,
  fase,
  veces,
}: {
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  exerciseId: string;
  nombre: string;
  unidad: 'kg' | 'lb';
  /** La prescripción del borrador (la de la semana 1). */
  prescripcion: PrescripcionParaLasSeries & { readonly prescriptionId?: string | null; readonly loadBasis?: string | null };
  aproximaciones: AproximacionesDelEjercicio | null;
  /** Las reglas de la fase (la de la fase y las propias), o `null` si no tiene ninguna. */
  reglas: Pick<SemanaDeLaFase, 'progresion' | 'propias'> | null;
  semanas: number;
  /** Las semanas de descarga del ejercicio (1 es la primera), para nombrarlas en el selector. */
  descargas: readonly number[];
  /** La fase en el calendario; sin fechas, lo realizado no se ubica. */
  fase: FaseEnElCalendario | null;
  veces: readonly VezPasada[] | null;
}) {
  const id = useId();
  const n = Math.max(1, semanas);
  const deHoy = fase ? semanaDeLaFecha(fase, hoyEn()) : null;
  const [semana, setSemana] = useState(() => Math.min(n, deHoy ?? 1));
  const [cursor, setCursor] = useState<number | null>(null);
  const [tabla, setTabla] = useState(false);
  const { datos } = useUnoRM({ token, asesoradoId, exerciseId, sesionPerdida });
  const unoRM = datos?.current && datos.current.value.unit === unidad ? datos.current.value.value : null;

  const elegida = Math.min(semana, n);
  const deLaSemana = reglas ? prescripcionDeLaSemana(prescripcion, { ...reglas, semana: elegida, semanas: n }, nombre, aproximaciones) : prescripcion;
  const vez = fase && veces ? vezDeLaSemana(veces, fase, elegida) : null;
  const barras = seriesParaElGrafico(deLaSemana, unidad, unoRM, vez && vez.como.tipo === 'series' ? vez.como.series : []);
  const conRealizado = vez !== null;

  const valores = barras.flatMap((b) => [b.planificada, b.realizada].filter((v): v is number => v !== null));
  const titulo = C.seriePorSerie(nombre);
  if (barras.length === 0 || (valores.length === 0 && unoRM === null)) {
    return (
      <p className="nota serie-por-serie__vacia" data-serie-por-serie="sin-datos">
        {C.sinCargas}
      </p>
    );
  }
  const marcas = marcasDelEje(Math.max(...valores, unoRM ?? 0));
  const yMax = marcas[marcas.length - 1]!;
  const ancho = ANCHO - M.izq - M.der;
  const alto = ALTO - M.arr - M.aba;
  const columna = ancho / barras.length;
  const x = (k: number) => M.izq + columna * (k + 0.5);
  const y = (v: number) => M.arr + alto - (v / (yMax || 1)) * alto;
  const anchoDeBarra = Math.min(28, columna * 0.55);
  const pie = !fase ? 'La fase no tiene fechas: lo realizado no se ubica en sus semanas.' : veces === null ? C.leyendo : vez ? `${C.realizado}: ${fechaEnPocasPalabras(vez.fecha, hoyEn())}${vez.sesion ? ` · ${vez.sesion}` : ''}.` : C.sinRegistros;

  const alTeclado = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      setCursor((c) => Math.min(barras.length - 1, Math.max(0, (c ?? (d > 0 ? -1 : barras.length)) + d)));
    } else if (e.key === 'Home') setCursor(0);
    else if (e.key === 'End') setCursor(barras.length - 1);
  };
  const alMover = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const enX = ((e.clientX - r.left) / r.width) * ANCHO;
    const k = Math.floor((enX - M.izq) / columna);
    setCursor(k >= 0 && k < barras.length ? k : null);
  };
  const resumen = `${titulo}. Semana ${elegida} de ${n}${descargas.includes(elegida) ? ' (descarga)' : ''}: ${barras.length} ${barras.length === 1 ? 'serie' : 'series'}, de 0 a ${numero(yMax, 2)} ${unidad}${unoRM !== null ? `. ${C.unoRM(unoRM, unidad)}` : ''}.`;

  return (
    <figure className="grafico-de-semanas serie-por-serie" aria-labelledby={`${id}-titulo`} data-serie-por-serie={conRealizado ? 'con-realizado' : 'planificado'}>
      <figcaption className="grafico-de-semanas__cabecera">
        <span id={`${id}-titulo`} className="grafico-de-semanas__titulo">
          {titulo}
        </span>
        <span className="grafico-de-semanas__acciones">
          <ExplicacionAPedido nombre="Cómo se lee el gráfico" como="div" lugar="esquina">
            <p>Pasá el puntero, o enfocá el gráfico y usá ← y →, para leer cada serie. Con «Semana» elegís la semana de la fase.</p>
            <p>{C.formasDeLasSeries}</p>
            <p>Si hay un 1RM de referencia, la línea punteada lo marca y cada serie dice su parte del 1RM.</p>
            <p className="ayuda-con-ejemplo__ejemplo" data-ejemplo-resuelto>
              {C.ejemploDeLasSeries}
            </p>
          </ExplicacionAPedido>
        </span>
      </figcaption>
      <div className="serie-por-serie__controles">
        <label className="serie-por-serie__semana">
          {C.semana}
          <select value={elegida} onChange={(e) => setSemana(Number(e.target.value))} data-semana-de-las-series>
            {Array.from({ length: n }, (_, k) => k + 1).map((s) => (
              <option key={s} value={s}>
                {`S${s}${descargas.includes(s) ? ' · descarga' : ''}${s === deHoy ? ' · esta semana' : ''}`}
              </option>
            ))}
          </select>
        </label>
        <ul className="grafico-de-semanas__leyenda" aria-hidden="true">
          <li>
            <span className="serie-por-serie__muestra serie-por-serie__muestra--efectiva" />
            {C.planificada}
          </li>
          <li>
            <span className="serie-por-serie__muestra serie-por-serie__muestra--aproximacion" />
            {C.aproximacion}
          </li>
          <li>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="3.5" className="serie-por-serie__hecho" />
            </svg>
            {C.realizado}
          </li>
        </ul>
      </div>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="grafico-de-semanas__dibujo"
        role="img"
        aria-label={resumen}
        aria-describedby={`${id}-lectura`}
        tabIndex={0}
        onKeyDown={alTeclado}
        onPointerMove={alMover}
        onPointerLeave={() => setCursor(null)}
        onBlur={() => setCursor(null)}
        data-cursor={cursor ?? undefined}
      >
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.izq} x2={ANCHO - M.der} y1={y(m)} y2={y(m)} className="grafico-de-semanas__guia" />
            <text x={M.izq - 6} y={y(m)} className="grafico-de-semanas__eje grafico-de-semanas__eje--y">
              {numero(m, 2)}
            </text>
          </g>
        ))}
        <text x={4} y={M.arr - 3} className="grafico-de-semanas__eje grafico-de-semanas__eje--unidad">
          {unidad}
        </text>
        {cursor !== null ? <rect x={x(cursor) - columna / 2} y={M.arr} width={columna} height={alto} className="serie-por-serie__cursor" /> : null}
        {barras.map((b, k) => (
          <g key={`${b.rotulo}-${b.setIndex}`} data-serie={b.rotulo}>
            {b.planificada !== null ? (
              <rect
                x={x(k) - anchoDeBarra / 2}
                y={y(b.planificada)}
                width={anchoDeBarra}
                height={Math.max(0, M.arr + alto - y(b.planificada))}
                rx={2}
                className={b.aproximacion ? 'serie-por-serie__barra serie-por-serie__barra--aproximacion' : 'serie-por-serie__barra'}
              >
                <title>{textoDeLaBarra(b, unidad)}</title>
              </rect>
            ) : null}
            {b.realizada !== null ? (
              <circle cx={x(k)} cy={y(b.realizada)} r={cursor === k ? 5 : 4} className="serie-por-serie__hecho">
                <title>{`${C.realizado} ${numero(b.realizada, 2)} ${unidad}`}</title>
              </circle>
            ) : null}
            <text x={x(k)} y={ALTO - 6} className="grafico-de-semanas__eje grafico-de-semanas__eje--x">
              {b.rotulo}
            </text>
          </g>
        ))}
        {unoRM !== null ? (
          <g className="serie-por-serie__uno-rm" data-uno-rm={unoRM}>
            <line x1={M.izq} x2={ANCHO - M.der} y1={y(unoRM)} y2={y(unoRM)} />
            <text x={ANCHO - M.der - 2} y={y(unoRM) - 3} className="grafico-de-semanas__eje serie-por-serie__uno-rm-rotulo">
              {C.unoRM(unoRM, unidad)}
            </text>
          </g>
        ) : null}
      </svg>
      {/* RP-19: la lectura y el renglón de lo realizado tienen su lugar; cambian de texto sin mover nada. */}
      <p id={`${id}-lectura`} className="grafico-de-semanas__lectura nota" aria-live="polite">
        {cursor !== null && barras[cursor] ? lecturaDeLaSerie(barras[cursor]!, unidad, conRealizado) : <span className="visualmente-oculto">Pasá el puntero, o enfocá el gráfico y usá ← y →, para leer cada serie.</span>}
      </p>
      <p className="nota carga-por-semana__registros" data-registros={vez ? 'hay' : 'sin-registros'}>
        {pie}
      </p>
      <button type="button" className="boton boton--discreto boton--compacto grafico-de-semanas__ver-tabla" aria-expanded={tabla} aria-controls={`${id}-tabla`} onClick={() => setTabla((t) => !t)} data-ver-tabla>
        {tabla ? 'Ocultar la tabla' : 'Ver la tabla'}
      </button>
      <div id={`${id}-tabla`} hidden={!tabla} className="grafico-de-semanas__tabla desplazable-x">
        {tabla ? (
          <table className="tabla tabla--compacta">
            <caption className="visualmente-oculto">{`${titulo}, semana ${elegida}`}</caption>
            <thead>
              <tr>
                <th scope="col">Serie</th>
                <th scope="col">{C.planificada}</th>
                {unoRM !== null ? <th scope="col">Parte del 1RM ({numero(unoRM, 2)} {unidad})</th> : null}
                <th scope="col">{C.realizado}</th>
              </tr>
            </thead>
            <tbody>
              {barras.map((b) => (
                <tr key={`${b.rotulo}-${b.setIndex}`} data-aproximacion={b.aproximacion ? '' : undefined}>
                  <th scope="row">{b.rotulo}</th>
                  <td>{b.planificada === null ? '—' : `${numero(b.planificada, 2)} ${unidad}`}</td>
                  {unoRM !== null ? <td>{b.delUnoRM === null ? '—' : C.delUnoRM(b.delUnoRM)}</td> : null}
                  <td>{b.realizada === null ? (conRealizado ? '—' : C.sinRegistros) : `${numero(b.realizada, 2)} ${unidad}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </figure>
  );
}
