'use client';

/**
 * El lienzo de los gráficos de Nutrición y Antropometría, en pantalla (WP-GRAFICOS fase 2, rama C; DL-174; GR-T40). Se
 * comporta como los paneles alineados de la base y usa sus piezas: un solo eje de fechas escrito bajo el último panel, el
 * cursor compartido de la página (`useCursorDeFechas`), el teclado de la base (`moverElCursor`: flechas, Inicio, Fin,
 * Mayúscula con flechas para un tramo y Escape), la lectura viva de la fecha y la tabla equivalente. Suma las capas que
 * estos gráficos necesitan (`lienzo.ts`): las temporadas con su rótulo y su línea de cambio, varias series con un eje,
 * las uniones, las medias de cada semana y la tira por comida.
 *
 * Accesibilidad: el contenedor es un grupo con nombre, su descripción apunta al resumen en texto y el SVG no se lee.
 * Pasar el mouse mueve la regla solo con un puntero fino; tocar o hacer clic la fija. La lectura de la fecha y la tabla
 * salen de las mismas filas, así que no pueden decir otra cosa que el dibujo. Nunca verde ni rojo: la forma dice el
 * estado además del color.
 */
import { MARCA_SEGUN_EL_DATO, type MarcaSemantica } from '@be/domain';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { useConPuntero } from '../../../../../lib/graficos';
import { LETRA_MINIMA, medidaDeMarca, type EstadoDeMarca } from '../../seguimiento/geometria';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import { useCursorDeFechas } from '../cursor-de-fechas';
import { escalaDeFechas, moverElCursor, type EscalaDeFechas, type PeriodoDelGrafico } from '../eje-de-fechas';
import { NotaDelInicio } from '../estado-del-grafico';
import { LecturaEnLaFecha } from '../lectura-en-la-fecha';
import { colorDelCarril, MarcaDelCarril } from '../marcas';
import type { DensidadDelGrafico } from '../paneles-alineados';
import { TablaEquivalente } from '../tabla-equivalente-en-pantalla';
import {
  geometriaDeTira,
  geometriaDeValores,
  temporadasUbicadas,
  type ElementoDeLaLeyenda,
  type EstadoDeLaComida,
  type FormaDeLaSerie,
  type GraficoArmado,
  type PanelDeTira,
  type PanelDeValores,
  type TemporadaUbicada,
} from './lienzo';

const MARGEN_IZQUIERDO = 88;
const MARGEN_DERECHO = 16;
const ALTO_DEL_EJE_DE_FECHAS = 24;
const ALTO_DE_LOS_ROTULOS = 18;
const ALTO_DEL_PANEL: Readonly<Record<DensidadDelGrafico, number>> = { COMPLETA: 132, COMPACTA: 92 };
const ANCHO_INICIAL = 720;
/** Con menos lugar por día, el rótulo de una unión no entra: lo dicen la lectura y la tabla. */
const LUGAR_PARA_EL_ROTULO = 40;

/** El ancho del contenedor, medido: el SVG no se estira, así la letra no baja de 12,5 px. */
export function useAncho(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const medir = () => setAncho(Math.max(300, Math.round(el.getBoundingClientRect().width)));
    medir();
    const o = new ResizeObserver(medir);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return [ref, ancho];
}

const formato = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

const tintaDe = (color: number | null): string => (color === null ? 'var(--grafico-indicado)' : colorDelCarril(color));

const ESTADO_DEL_CUADRADO: Readonly<Partial<Record<MarcaSemantica, EstadoDeMarca>>> = { LLENA: 'lleno', HUECA: 'hueco', CONTORNO_CORTADO: 'reportado', PUNTO_ADENTRO: 'calculado' };

/** La marca de una serie con forma de cuadrado (el segundo método de GR-20): la misma gramática que el círculo. */
function Cuadrado({ marca, cx, cy, porDia, color }: { marca: MarcaSemantica; cx: number; cy: number; porDia: number; color: string }) {
  const estado = ESTADO_DEL_CUADRADO[marca] ?? 'lleno';
  const medida = medidaDeMarca(estado, porDia);
  const lado = 2 * medida.R * 0.9;
  const x = cx - lado / 2;
  const y = cy - lado / 2;
  if (estado === 'lleno') return <rect x={x} y={y} width={lado} height={lado} fill={color} data-marca={marca} />;
  return (
    <g data-marca={marca}>
      <rect x={x} y={y} width={lado} height={lado} fill="var(--superficie)" stroke={color} strokeWidth={medida.trazo} strokeDasharray={estado === 'reportado' ? '2 2' : undefined} />
      {estado === 'calculado' && medida.puntoAdentro !== null ? <rect x={cx - medida.puntoAdentro} y={cy - medida.puntoAdentro} width={2 * medida.puntoAdentro} height={2 * medida.puntoAdentro} fill={color} /> : null}
    </g>
  );
}

function Marca({ marca, forma, cx, cy, porDia, color, tarde }: { marca: MarcaSemantica; forma: FormaDeLaSerie; cx: number; cy: number; porDia: number; color: string; tarde: boolean }) {
  if (forma === 'CUADRADO' && marca !== 'ROMBO' && marca !== 'HUECA_GRIS') return <Cuadrado marca={marca} cx={cx} cy={cy} porDia={porDia} color={color} />;
  return <MarcaDelCarril marca={marca} cx={cx} cy={cy} porDia={porDia} color={color} tarde={tarde} />;
}

/** La celda de una comida en la tira: lleno con la opción del plan, con una raya si fue una comida diferente, un guion sin registro. */
function CeldaDeLaComida({ estado, x, y, ancho }: { estado: EstadoDeLaComida; x: number; y: number; ancho: number }) {
  const lado = Math.min(ancho, 10);
  if (estado === 'CON_OPCION') return <rect x={x - lado / 2} y={y - lado / 2} width={lado} height={lado} fill="var(--tenue)" data-comida={estado} />;
  if (estado === 'COMIDA_DIFERENTE')
    return (
      <g data-comida={estado}>
        <rect x={x - lado / 2} y={y - lado / 2} width={lado} height={lado} fill="var(--superficie)" stroke="var(--tenue)" strokeWidth={1.5} />
        <line x1={x - lado / 2} y1={y + lado / 2} x2={x + lado / 2} y2={y - lado / 2} stroke="var(--tenue)" strokeWidth={1.5} />
      </g>
    );
  return <line x1={x - lado / 2} x2={x + lado / 2} y1={y} y2={y} stroke="var(--tenue)" strokeWidth={2} data-comida={estado} />;
}

interface PropsDelDibujo {
  readonly escala: EscalaDeFechas;
  readonly temporadas: readonly TemporadaUbicada[];
  readonly conRotulos: boolean;
  readonly fecha: string | null;
  readonly tramo: { readonly desde: string; readonly hasta: string } | null;
  readonly ultimo: boolean;
}

/** Lo que va detrás de cada panel: las bandas del plan, el tramo elegido, las marcas de las fechas y las líneas de cambio. */
function Fondo({ escala, temporadas, alto, tramo }: Pick<PropsDelDibujo, 'escala' | 'temporadas' | 'tramo'> & { alto: number }) {
  return (
    <>
      {temporadas.map((t) => (t.banda === 0 && t.x2 > t.x1 ? <rect key={`b${t.clave}`} x={t.x1} y={0} width={t.x2 - t.x1} height={alto} fill="var(--banda)" /> : null))}
      {tramo ? <rect x={escala.x(tramo.desde) - escala.porDia / 2} y={0} width={escala.x(tramo.hasta) - escala.x(tramo.desde) + escala.porDia} height={alto} fill="var(--grafico-cursor)" opacity={0.08} /> : null}
      {escala.marcas.map((m) => (
        <line key={m.fecha} x1={m.x} x2={m.x} y1={0} y2={alto} stroke="var(--borde)" strokeWidth={1} opacity={0.5} />
      ))}
      {temporadas.map((t) =>
        t.conCambio ? <line key={`c${t.clave}`} x1={t.x1} x2={t.x1} y1={0} y2={alto} stroke="var(--tenue)" strokeWidth={1} strokeDasharray={t.tipo === 'OBJETIVO' ? '2 3' : undefined} /> : null,
      )}
    </>
  );
}

/** Los rótulos cortos de las temporadas, arriba del primer panel. */
function RotulosDeLasTemporadas({ escala, temporadas }: { escala: EscalaDeFechas; temporadas: readonly TemporadaUbicada[] }) {
  return (
    <>
      {temporadas.map((t) =>
        t.conRotulo ? (
          <text key={`r${t.clave}`} x={Math.max(t.x1, escala.izquierda) + 3} y={ALTO_DE_LOS_ROTULOS - 5} fontSize={LETRA_MINIMA} fill="var(--tenue)">
            {t.corto}
          </text>
        ) : null,
      )}
    </>
  );
}

function EjeDeFechas({ escala, y }: { escala: EscalaDeFechas; y: number }) {
  return (
    <>
      {escala.marcas.map((m) => (
        <text key={`t${m.fecha}`} x={m.x} y={y + ALTO_DEL_EJE_DE_FECHAS - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
          {m.texto}
        </text>
      ))}
    </>
  );
}

function DibujoDeValores({ panel, alto, ...d }: PropsDelDibujo & { panel: PanelDeValores; alto: number }) {
  const { escala } = d;
  const g = geometriaDeValores(panel, escala, alto);
  const arriba = d.conRotulos ? ALTO_DE_LOS_ROTULOS : 0;
  const total = arriba + alto + (d.ultimo ? ALTO_DEL_EJE_DE_FECHAS : 0);
  const conRotulo = escala.porDia >= LUGAR_PARA_EL_ROTULO;
  // Lo indicado va primero: lo registrado del mismo día se ve encima.
  const marcas = [...g.marcas].sort((a, b) => (a.color === null ? 0 : 1) - (b.color === null ? 0 : 1));
  return (
    <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
      {d.conRotulos ? <RotulosDeLasTemporadas escala={escala} temporadas={d.temporadas} /> : null}
      <g transform={`translate(0 ${arriba})`}>
        <Fondo escala={escala} temporadas={d.temporadas} alto={alto} tramo={d.tramo} />
        {g.marcasY.map((m) => (
          <text key={m.valor} x={MARGEN_IZQUIERDO - 6} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
            {formato(m.valor, g.extremos.decimales)}
          </text>
        ))}
        {g.medias.map((t) => (
          <line key={t.clave} x1={t.x1} x2={t.x2} y1={t.y} y2={t.y} stroke={tintaDe(t.color)} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
        ))}
        {g.escalones.map((t) => (
          <line key={t.clave} x1={t.x1} x2={t.x2} y1={t.y} y2={t.y} stroke={tintaDe(t.color)} strokeWidth={1.5} strokeDasharray="6 4" />
        ))}
        {g.uniones.map((u) => (
          <line key={u.clave} x1={u.x} x2={u.x} y1={u.y1} y2={u.y2} stroke="var(--tenue)" strokeWidth={u.forma === 'DIFERENCIA' ? 1.5 : 1} strokeDasharray={u.forma === 'SEPARACION' ? '2 2' : undefined} />
        ))}
        {g.lineas.map((l, i) => (
          <polyline key={`l${l.serie}${i}`} points={l.puntos.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={tintaDe(l.color)} strokeWidth={1.5} />
        ))}
        {marcas.map((m) => (
          <Marca key={m.clave} marca={m.marca} forma={m.forma} cx={m.x} cy={m.y} porDia={escala.porDia} color={tintaDe(m.color)} tarde={m.tarde} />
        ))}
        {conRotulo
          ? g.uniones.map((u) =>
              u.rotulo ? (
                <text key={`r${u.clave}`} x={u.x + 6} y={Math.min(u.y1, u.y2) - 6} fontSize={LETRA_MINIMA} fill="var(--texto)">
                  {u.rotulo}
                </text>
              ) : null,
            )
          : null}
        {d.fecha ? <line x1={escala.x(d.fecha)} x2={escala.x(d.fecha)} y1={0} y2={alto} stroke="var(--grafico-cursor)" strokeWidth={1.5} /> : null}
        {d.ultimo ? <EjeDeFechas escala={escala} y={alto} /> : null}
      </g>
    </svg>
  );
}

function DibujoDeTira({ panel, ...d }: PropsDelDibujo & { panel: PanelDeTira }) {
  const { escala } = d;
  const g = geometriaDeTira(panel, escala);
  const arriba = d.conRotulos ? ALTO_DE_LOS_ROTULOS : 0;
  const total = arriba + g.alto + (d.ultimo ? ALTO_DEL_EJE_DE_FECHAS : 0);
  const recortar = (nombre: string) => (nombre.length > 11 ? `${nombre.slice(0, 10)}…` : nombre);
  return (
    <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
      {d.conRotulos ? <RotulosDeLasTemporadas escala={escala} temporadas={d.temporadas} /> : null}
      <g transform={`translate(0 ${arriba})`}>
        <Fondo escala={escala} temporadas={d.temporadas} alto={g.alto} tramo={d.tramo} />
        {g.filas.map((f) => (
          <g key={f.clave}>
            <text x={MARGEN_IZQUIERDO - 6} y={f.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {recortar(f.nombre)}
            </text>
            {f.celdas.map((c) => (
              <CeldaDeLaComida key={c.fecha} estado={c.estado} x={c.x} y={f.y} ancho={c.ancho} />
            ))}
          </g>
        ))}
        {d.fecha ? <line x1={escala.x(d.fecha)} x2={escala.x(d.fecha)} y1={0} y2={g.alto} stroke="var(--grafico-cursor)" strokeWidth={1.5} /> : null}
        {d.ultimo ? <EjeDeFechas escala={escala} y={g.alto} /> : null}
      </g>
    </svg>
  );
}

/** La muestra de un renglón de la leyenda, con la misma tinta y la misma forma que el dibujo. */
function Muestra({ e }: { e: ElementoDeLaLeyenda }) {
  const m = e.muestra;
  return (
    <svg width={28} height={18} viewBox="0 0 28 18" aria-hidden="true">
      {m.tipo === 'MARCA' ? <Marca marca={m.marca} forma={m.forma} cx={14} cy={9} porDia={10} color={tintaDe(m.color)} tarde={false} /> : null}
      {m.tipo === 'TARDE' ? <MarcaDelCarril marca={MARCA_SEGUN_EL_DATO.REGISTRADO} cx={14} cy={11} porDia={10} color={colorDelCarril(0)} tarde /> : null}
      {m.tipo === 'ESCALON' ? <line x1={2} x2={26} y1={9} y2={9} stroke={tintaDe(m.color)} strokeWidth={1.5} strokeDasharray="6 4" /> : null}
      {m.tipo === 'MEDIA' ? <line x1={4} x2={24} y1={9} y2={9} stroke={tintaDe(m.color)} strokeWidth={4} strokeLinecap="round" opacity={0.55} /> : null}
      {m.tipo === 'UNION' ? <line x1={14} x2={14} y1={2} y2={16} stroke="var(--tenue)" strokeWidth={1.5} strokeDasharray={m.forma === 'SEPARACION' ? '2 2' : undefined} /> : null}
      {m.tipo === 'COMIDA' ? <CeldaDeLaComida estado={m.estado} x={14} y={9} ancho={10} /> : null}
      {m.tipo === 'TEMPORADA' ? (
        <>
          <rect x={2} y={2} width={12} height={14} fill="var(--banda)" />
          <line x1={14} x2={14} y1={2} y2={16} stroke="var(--tenue)" strokeWidth={1} />
        </>
      ) : null}
    </svg>
  );
}

export function LeyendaDelLienzo({ elementos }: { elementos: readonly ElementoDeLaLeyenda[] }) {
  if (elementos.length === 0) return null;
  return (
    <ul className="grafico-base__leyenda" aria-label={COPY_DE_LOS_GRAFICOS.leyenda}>
      {elementos.map((e) => (
        <li key={e.clave}>
          <span className="grafico-base__glifo">
            <Muestra e={e} />
            {e.texto}
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface PropsDelLienzo {
  readonly titulo: string;
  readonly periodo: PeriodoDelGrafico;
  readonly grafico: GraficoArmado;
  readonly densidad?: DensidadDelGrafico;
  /** Lo que va entre el título y el dibujo: un control (el método, la toma), una nota. */
  readonly antes?: ReactNode;
}

export function LienzoDeNutricionYCuerpo({ titulo, periodo, grafico, densidad = 'COMPLETA', antes = null }: PropsDelLienzo) {
  const [ref, ancho] = useAncho();
  const conPuntero = useConPuntero();
  const cursor = useCursorDeFechas();
  const idDelResumen = useId();
  const escala = useMemo(() => escalaDeFechas(periodo, { izquierda: MARGEN_IZQUIERDO, derecha: ancho - MARGEN_DERECHO }), [periodo, ancho]);
  const temporadas = useMemo(() => temporadasUbicadas(grafico.temporadas, escala), [grafico.temporadas, escala]);
  const fechas = useMemo(() => grafico.tabla.filas.map((f) => f.fecha).filter((f) => f >= escala.desde && f <= escala.hasta), [grafico.tabla, escala]);
  const [encima, setEncima] = useState<string | null>(null);
  const fecha = encima ?? cursor.fecha;
  const alto = ALTO_DEL_PANEL[densidad];
  const conRotulos = temporadas.some((t) => t.conRotulo);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const nuevo = moverElCursor(fechas, { fecha: cursor.fecha, tramo: cursor.tramo }, e.key, e.shiftKey);
    if (nuevo === null) return;
    e.preventDefault();
    cursor.fijar(nuevo);
  };
  const fechaDelPuntero = (e: { readonly clientX: number; readonly currentTarget: HTMLDivElement }): string => {
    const caja = e.currentTarget.getBoundingClientRect();
    const escalaX = (escala.derecha + MARGEN_DERECHO) / Math.max(1, caja.width);
    return escala.fechaDeX((e.clientX - caja.left) * escalaX);
  };
  const nombreDelPanel = (p: PanelDeValores | PanelDeTira) =>
    p.tipo === 'VALORES' ? (
      <>
        {p.nombre}
        <span className="grafico-base__unidad"> · {p.unidad}</span>
        {p.metodo ? <span className="grafico-base__metodo"> · {p.metodo}</span> : null}
      </>
    ) : (
      p.nombre
    );

  return (
    <div className={`grafico-base grafico-capas grafico-base--${densidad.toLowerCase()}`}>
      <h3 className="grafico-base__titulo">{titulo}</h3>
      <NotaDelInicio periodo={periodo} />
      {antes}
      {grafico.temporadas.length > 0 ? (
        <p className="nota grafico-capas__temporadas">
          <span className="grafico-capas__rotulo">Temporadas: </span>
          {grafico.temporadas.map((t) => t.rotulo).join(' · ')}
        </p>
      ) : null}
      <div
        ref={ref}
        className="grafico-base__area"
        tabIndex={0}
        role="group"
        aria-roledescription="gráfico"
        aria-label={`${titulo}. ${COPY_DE_LOS_GRAFICOS.comoSeUsa}`}
        aria-describedby={idDelResumen}
        onKeyDown={alTeclear}
        onPointerMove={(e) => {
          if (conPuntero && e.pointerType === 'mouse') setEncima(fechaDelPuntero(e));
        }}
        onPointerLeave={() => setEncima(null)}
        onClick={(e) => cursor.elegir(fechaDelPuntero(e))}
      >
        {grafico.paneles.map((p, i) => {
          const comun: PropsDelDibujo = { escala, temporadas, conRotulos: conRotulos && i === 0, fecha, tramo: cursor.tramo, ultimo: i === grafico.paneles.length - 1 };
          return (
            <div key={p.id} className="grafico-base__carril">
              <p className="grafico-base__carril-nombre">{nombreDelPanel(p)}</p>
              {p.tipo === 'VALORES' ? <DibujoDeValores panel={p} alto={alto} {...comun} /> : <DibujoDeTira panel={p} {...comun} />}
            </div>
          );
        })}
      </div>
      <p id={idDelResumen} className="visualmente-oculto">
        {grafico.descripcion}
      </p>
      <LecturaEnLaFecha tabla={grafico.tabla} fecha={cursor.fecha} tramo={cursor.tramo} />
      <LeyendaDelLienzo elementos={grafico.leyenda} />
      {grafico.notas.map((n) => (
        <p key={n} className="nota grafico-base__nota">
          {n}
        </p>
      ))}
      <TablaEquivalente titulo={titulo} tabla={grafico.tabla} />
    </div>
  );
}
