'use client';

/**
 * DL-196 parte B (E7 y E18) · el gráfico X/Y del editor de Entrenamiento: las semanas de la fase en X y la carga en Y.
 * Lo usan la vista previa de una progresión, la carga por semana de un ejercicio y los favoritos del plan.
 *
 * - **La forma distingue, no solo el color** (TB-03): lo planificado va punteado con puntos huecos; lo realizado, lleno;
 *   el máximo estimado, rombos (huecos si son de la banda orientativa). La descarga es un escalón con su franja de fondo.
 * - **Se lee con el teclado:** el gráfico recibe el foco; ← y → pasan de semana y la lectura de esa semana se dice en el
 *   renglón de abajo, que tiene su lugar reservado (RP-19: nada se corre). Con el puntero, lo mismo.
 * - **Tiene su tabla:** «Ver la tabla» la abre debajo, con todos los valores; el dibujo tiene su texto alternativo.
 * - Los colores son tokens de los dos temas (`--metrica-1`, `--metrica-2`, `--banda`, `--grafico-cursor`).
 */
import { numero } from '@be/domain';
import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

export interface SerieDeSemanas {
  readonly clave: string;
  readonly nombre: string;
  /** `plan`: punteado y hueco. `hecho`: lleno. `estimado`: rombos, en el segundo color. */
  readonly forma: 'plan' | 'hecho' | 'estimado';
  /** Un valor por semana (la 1 primero); `null` si esa semana no tiene. */
  readonly valores: readonly (number | null)[];
  /** Para `estimado`: las semanas cuyo valor es de la banda orientativa (rombo hueco). */
  readonly orientativas?: readonly boolean[];
}

const ANCHO = 360;
const ALTO = 172;
const M = { izq: 42, der: 10, arr: 10, aba: 24 } as const;

/** Tres o cuatro marcas «redondas» entre el mínimo y el máximo. */
function marcasDelEje(min: number, max: number): number[] {
  const rango = max - min || Math.max(1, Math.abs(max) * 0.1);
  const crudo = rango / 3;
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo) ?? crudo;
  const desde = Math.floor(min / paso) * paso;
  const marcas: number[] = [];
  for (let v = desde; v <= max + paso * 0.5 && marcas.length < 6; v += paso) marcas.push(Math.round(v * 100) / 100);
  return marcas;
}

export function GraficoDeSemanas({
  titulo,
  semanas,
  series,
  descargas = [],
  unidad,
  rotuloDeSemana = (n) => `S${n}`,
  pie = null,
  acciones = null,
}: {
  titulo: string;
  semanas: number;
  series: readonly SerieDeSemanas[];
  /** Las semanas de descarga (1 es la primera). */
  descargas?: readonly number[];
  unidad: 'kg' | 'lb';
  rotuloDeSemana?: (n: number) => string;
  /** Lo que va debajo de la lectura (una nota sobre los límites, por ejemplo). */
  pie?: ReactNode;
  /** Lo que va a la derecha del título (la estrella de favoritos). */
  acciones?: ReactNode;
}) {
  const id = useId();
  const [cursor, setCursor] = useState<number | null>(null);
  const [tabla, setTabla] = useState(false);
  const todos = series.flatMap((s) => s.valores.filter((v): v is number => v !== null));
  const n = Math.max(1, semanas);
  // DL-197 (F8, GUIA-UX-UI): la carga y las cantidades se leen desde 0; acercar el eje agranda las diferencias.
  const marcas = todos.length > 0 ? marcasDelEje(0, Math.max(...todos)) : [0, 1];
  const yMin = marcas[0]!;
  const yMax = marcas[marcas.length - 1]!;
  const ancho = ANCHO - M.izq - M.der;
  const alto = ALTO - M.arr - M.aba;
  const columna = ancho / n;
  const x = (semana: number) => M.izq + columna * (semana - 0.5);
  const y = (v: number) => M.arr + alto - ((v - yMin) / (yMax - yMin || 1)) * alto;
  const valor = (v: number | null) => (v === null ? '—' : `${numero(v, 2)} ${unidad}`);
  const lecturaDe = (s: number) =>
    `${rotuloDeSemana(s).replace(/^S/, 'Semana ')}${descargas.includes(s) ? ' (descarga)' : ''}: ${series.map((x) => `${x.nombre} ${valor(x.valores[s - 1] ?? null)}`).join(' · ')}`;
  const alTeclado = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      setCursor((c) => Math.min(n, Math.max(1, (c ?? (d > 0 ? 0 : n + 1)) + d)));
    } else if (e.key === 'Home') setCursor(1);
    else if (e.key === 'End') setCursor(n);
  };
  const alMover = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const enX = ((e.clientX - r.left) / r.width) * ANCHO;
    const s = Math.floor((enX - M.izq) / columna) + 1;
    setCursor(s >= 1 && s <= n ? s : null);
  };
  // Una etiqueta de semana cada tanto, para que no se encimen.
  const cadaCuanto = n <= 8 ? 1 : n <= 16 ? 2 : 4;
  const resumen = `${titulo}. ${n} ${n === 1 ? 'semana' : 'semanas'}, de ${numero(yMin, 2)} a ${numero(yMax, 2)} ${unidad}. ${series.map((s) => s.nombre).join(', ')}.`;

  return (
    <figure className="grafico-de-semanas" aria-labelledby={`${id}-titulo`} data-grafico-de-semanas={series.map((s) => s.clave).join(' ')}>
      <figcaption className="grafico-de-semanas__cabecera">
        <span id={`${id}-titulo`} className="grafico-de-semanas__titulo">
          {titulo}
        </span>
        {acciones}
      </figcaption>
      <ul className="grafico-de-semanas__leyenda" aria-hidden="true">
        {series.map((s) => (
          <li key={s.clave}>
            <svg width="22" height="10" viewBox="0 0 22 10">
              <line x1="1" x2="21" y1="5" y2="5" className={`grafico-de-semanas__linea grafico-de-semanas__linea--${s.forma}`} />
              {s.forma === 'estimado' ? <path d="M11 1 L15 5 L11 9 L7 5 Z" className="grafico-de-semanas__rombo" /> : <circle cx="11" cy="5" r="3" className={`grafico-de-semanas__punto grafico-de-semanas__punto--${s.forma}`} />}
            </svg>
            {s.nombre}
          </li>
        ))}
        {descargas.length > 0 ? (
          <li>
            <span className="grafico-de-semanas__muestra-descarga" />
            Descarga
          </li>
        ) : null}
      </ul>
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
        {descargas
          .filter((s) => s >= 1 && s <= n)
          .map((s) => (
            <rect key={`d${s}`} x={x(s) - columna / 2} y={M.arr} width={columna} height={alto} className="grafico-de-semanas__descarga" />
          ))}
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.izq} x2={ANCHO - M.der} y1={y(m)} y2={y(m)} className="grafico-de-semanas__guia" />
            <text x={M.izq - 6} y={y(m)} className="grafico-de-semanas__eje grafico-de-semanas__eje--y">
              {numero(m, 2)}
            </text>
          </g>
        ))}
        <text x={4} y={M.arr - 1} className="grafico-de-semanas__eje grafico-de-semanas__eje--unidad">
          {unidad}
        </text>
        {Array.from({ length: n }, (_, k) => k + 1)
          .filter((s) => (s - 1) % cadaCuanto === 0 || s === n)
          .map((s) => (
            <text key={s} x={x(s)} y={ALTO - 6} className="grafico-de-semanas__eje grafico-de-semanas__eje--x">
              {rotuloDeSemana(s)}
            </text>
          ))}
        {cursor !== null ? <line x1={x(cursor)} x2={x(cursor)} y1={M.arr} y2={M.arr + alto} className="grafico-de-semanas__cursor" /> : null}
        {series.map((s) => {
          // Los tramos se cortan donde falta un valor: una semana sin dato no se une con la siguiente.
          const tramos: string[][] = [[]];
          s.valores.slice(0, n).forEach((v, k) => {
            if (v === null) tramos.push([]);
            else tramos[tramos.length - 1]!.push(`${x(k + 1)},${y(v)}`);
          });
          return (
            <g key={s.clave} data-serie={s.clave}>
              {tramos
                .filter((t) => t.length > 1)
                .map((t, k) => (
                  <polyline key={k} points={t.join(' ')} className={`grafico-de-semanas__linea grafico-de-semanas__linea--${s.forma}`} fill="none" />
                ))}
              {s.valores.slice(0, n).map((v, k) =>
                v === null ? null : s.forma === 'estimado' ? (
                  <path
                    key={k}
                    d={`M${x(k + 1)} ${y(v) - 4.5} L${x(k + 1) + 4.5} ${y(v)} L${x(k + 1)} ${y(v) + 4.5} L${x(k + 1) - 4.5} ${y(v)} Z`}
                    className={`grafico-de-semanas__rombo${s.orientativas?.[k] ? ' grafico-de-semanas__rombo--orientativo' : ''}`}
                  />
                ) : (
                  <circle key={k} cx={x(k + 1)} cy={y(v)} r={cursor === k + 1 ? 4.5 : 3.25} className={`grafico-de-semanas__punto grafico-de-semanas__punto--${s.forma}`} />
                ),
              )}
            </g>
          );
        })}
      </svg>
      {/* RP-19: la lectura tiene su renglón reservado; aparece y desaparece sin mover nada. */}
      <p id={`${id}-lectura`} className="grafico-de-semanas__lectura nota" aria-live="polite">
        {cursor !== null ? lecturaDe(cursor) : 'Pasá el puntero, o enfocá el gráfico y usá ← y →, para leer cada semana.'}
      </p>
      {pie}
      <button type="button" className="boton boton--discreto boton--compacto grafico-de-semanas__ver-tabla" aria-expanded={tabla} aria-controls={`${id}-tabla`} onClick={() => setTabla((t) => !t)} data-ver-tabla>
        {tabla ? 'Ocultar la tabla' : 'Ver la tabla'}
      </button>
      <div id={`${id}-tabla`} hidden={!tabla} className="grafico-de-semanas__tabla desplazable-x">
        {tabla ? (
          <table className="tabla tabla--compacta">
            <caption className="visualmente-oculto">{titulo}</caption>
            <thead>
              <tr>
                <th scope="col">Semana</th>
                {series.map((s) => (
                  <th key={s.clave} scope="col">
                    {s.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, k) => k + 1).map((s) => (
                <tr key={s} data-descarga={descargas.includes(s) ? '' : undefined}>
                  <th scope="row">
                    {s}
                    {descargas.includes(s) ? ' · descarga' : ''}
                  </th>
                  {series.map((x) => (
                    <td key={x.clave}>
                      {valor(x.valores[s - 1] ?? null)}
                      {x.orientativas?.[s - 1] ? ' (orientativa)' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </figure>
  );
}
