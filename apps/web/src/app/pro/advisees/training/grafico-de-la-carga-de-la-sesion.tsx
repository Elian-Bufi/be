'use client';

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-09) · la carga de la sesión (Foster: el esfuerzo de la sesión por los
 * minutos) de cada sesión registrada del período, en barras. Una sola serie: el título la nombra, sin leyenda.
 * - **Desde 0** (GUIA-UX-UI II.16, ET1-D17): es una cantidad.
 * - **Barras finas**, con la punta redondeada y el pie en la línea de base; la grilla, apenas.
 * - **Se lee con el teclado y con el puntero:** el gráfico recibe el foco; ← y → pasan de sesión y la lectura va en el
 *   renglón de abajo, con su lugar reservado (RP-19: nada se corre). «Ver la tabla» la abre con todos los valores.
 * - Las sesiones sin minutos no tienen carga: se dicen en la tabla («sin minutos») y no dibujan barra.
 * - Los colores son tokens de los dos temas (`--metrica-1`, `--grafico-cursor`, `--borde`).
 */
import { COPY_ESFUERZO_DE_LA_SESION, diaDeLaEstimacion, esfuerzoEnUnRenglon, numero, type EsfuerzoDeLaSesion } from '@be/domain';
import { useId, useState, type KeyboardEvent } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';

const ANCHO = 520;
const ALTO = 168;
const M = { izq: 44, der: 10, arr: 10, aba: 26 } as const;

/** Tres o cuatro marcas «redondas» desde 0. */
function marcasDesdeCero(max: number): number[] {
  const tope = Math.max(1, max);
  const crudo = tope / 3;
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo) ?? crudo;
  const marcas: number[] = [];
  for (let v = 0; v <= tope + paso * 0.5 && marcas.length < 6; v += paso) marcas.push(Math.round(v * 100) / 100);
  return marcas;
}

export function GraficoDeLaCargaDeLaSesion({ esfuerzos }: { esfuerzos: readonly EsfuerzoDeLaSesion[] }) {
  const T = COPY_ESFUERZO_DE_LA_SESION;
  const id = useId();
  const [foco, setFoco] = useState<number | null>(null);
  const [tabla, setTabla] = useState(false);
  if (esfuerzos.length === 0) return <p className="nota">{T.sinDatos}</p>;
  const cargas = esfuerzos.map((e) => e.sessionLoad);
  const max = Math.max(0, ...cargas.map((c) => c ?? 0));
  const marcas = marcasDesdeCero(max);
  const tope = marcas[marcas.length - 1]!;
  const ancho = ANCHO - M.izq - M.der;
  const alto = ALTO - M.arr - M.aba;
  const columna = ancho / esfuerzos.length;
  const barra = Math.max(4, Math.min(22, columna - 2));
  const y = (v: number) => M.arr + alto - (v / tope) * alto;
  const leido = foco === null ? null : esfuerzos[foco]!;
  const teclas = (e: KeyboardEvent<SVGSVGElement>) => {
    const n = foco ?? -1;
    const otro = e.key === 'ArrowRight' ? Math.min(esfuerzos.length - 1, n + 1) : e.key === 'ArrowLeft' ? Math.max(0, n < 0 ? 0 : n - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? esfuerzos.length - 1 : null;
    if (otro === null) return;
    e.preventDefault();
    setFoco(otro);
  };
  // Las fechas del eje: la primera, la última y, si entran, algunas del medio (sin pisarse).
  const cadaCuanto = Math.max(1, Math.ceil(esfuerzos.length / Math.floor(ancho / 56)));
  return (
    <figure className="grafico-de-la-carga-de-la-sesion con-ayuda-en-la-esquina" data-grafico-carga-de-la-sesion={esfuerzos.length}>
      <figcaption className="grafico-de-la-carga-de-la-sesion__titulo">
        <span id={`${id}-titulo`}>{T.ejeDelGrafico}</span>
        <ExplicacionAPedido nombre={`Qué es la ${T.cargaDeLaSesion.toLowerCase()}`} como="span" lugar="esquina">
          <span className="ayuda-del-editor">
            <span>{T.queEs}</span> <span className="ayuda-del-editor__ejemplo">{T.ejemplo}</span>
          </span>
        </ExplicacionAPedido>
      </figcaption>
      <svg
        className="grafico-de-la-carga-de-la-sesion__dibujo"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        tabIndex={0}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-lectura`}
        onKeyDown={teclas}
        onBlur={() => setFoco(null)}
        onMouseLeave={() => setFoco(null)}
      >
        {marcas.map((m) => (
          <g key={m} className="grafico-de-la-carga-de-la-sesion__marca">
            <line x1={M.izq} x2={ANCHO - M.der} y1={y(m)} y2={y(m)} />
            <text x={M.izq - 6} y={y(m)} dy="0.32em" textAnchor="end">
              {numero(m)}
            </text>
          </g>
        ))}
        {esfuerzos.map((e, n) => {
          const x = M.izq + columna * n + columna / 2;
          const c = e.sessionLoad;
          const alta = c === null ? 0 : Math.max(0, y(0) - y(c));
          const r = Math.min(4, barra / 2, alta);
          return (
            <g key={e.executionId} onMouseEnter={() => setFoco(n)} data-elegida={foco === n ? '' : undefined}>
              {/* El lugar para el puntero, más grande que la barra. */}
              <rect className="grafico-de-la-carga-de-la-sesion__blanco" x={M.izq + columna * n} y={M.arr} width={columna} height={alto} />
              {foco === n ? <line className="grafico-de-la-carga-de-la-sesion__cursor" x1={x} x2={x} y1={M.arr} y2={y(0)} /> : null}
              {c !== null && alta > 0 ? (
                <path
                  className="grafico-de-la-carga-de-la-sesion__barra"
                  d={`M${x - barra / 2},${y(0)} V${y(0) - alta + r} Q${x - barra / 2},${y(0) - alta} ${x - barra / 2 + r},${y(0) - alta} H${x + barra / 2 - r} Q${x + barra / 2},${y(0) - alta} ${x + barra / 2},${y(0) - alta + r} V${y(0)} Z`}
                />
              ) : null}
              {n % cadaCuanto === 0 || n === esfuerzos.length - 1 ? (
                <text className="grafico-de-la-carga-de-la-sesion__fecha" x={x} y={ALTO - 6} textAnchor="middle">
                  {diaDeLaEstimacion(e.date)}
                </text>
              ) : null}
            </g>
          );
        })}
        <line className="grafico-de-la-carga-de-la-sesion__base" x1={M.izq} x2={ANCHO - M.der} y1={y(0)} y2={y(0)} />
      </svg>
      {/* RP-19: el renglón de la lectura está siempre. */}
      <p id={`${id}-lectura`} className="nota grafico-de-la-carga-de-la-sesion__lectura" aria-live="polite" data-lectura-carga-de-la-sesion>
        {leido ? `${diaDeLaEstimacion(leido.date)} · ${leido.sessionLabel || 'Sesión'} · ${esfuerzoEnUnRenglon(leido)}` : 'Tocá una barra o usá ← y → para leer cada sesión.'}
      </p>
      <button type="button" className="boton boton--discreto boton--compacto" aria-expanded={tabla} aria-controls={`${id}-tabla`} onClick={() => setTabla((t) => !t)}>
        {tabla ? 'Ocultar la tabla' : 'Ver la tabla'}
      </button>
      <div id={`${id}-tabla`} hidden={!tabla}>
        {tabla ? (
          <table className="tabla tabla--compacta">
            <caption className="visualmente-oculto">{T.titulo}</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Sesión</th>
                <th scope="col">Esfuerzo</th>
                <th scope="col">Minutos</th>
                <th scope="col">{T.cargaDeLaSesion}</th>
              </tr>
            </thead>
            <tbody>
              {esfuerzos.map((e) => (
                <tr key={e.executionId}>
                  <td>{diaDeLaEstimacion(e.date)}</td>
                  <td>{e.sessionLabel || 'Sesión'}</td>
                  <td>{numero(e.rating)}</td>
                  <td>{e.durationMinutes === null ? 'Sin indicar' : numero(e.durationMinutes)}</td>
                  <td>{e.sessionLoad === null ? T.sinMinutos : numero(e.sessionLoad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </figure>
  );
}
