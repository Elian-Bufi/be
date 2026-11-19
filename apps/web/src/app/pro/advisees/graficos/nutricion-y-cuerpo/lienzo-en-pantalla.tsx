'use client';

/**
 * El lienzo de los gráficos de Nutrición y Antropometría, en pantalla (WP-GRAFICOS fase 2, rama C; DL-174; GR-T40). Se
 * comporta como los paneles alineados de la base y usa sus piezas: un solo eje de fechas escrito bajo el último panel, el
 * cursor compartido de la página (`useCursorDeFechas`), el teclado de la base (`moverElCursor`: flechas, Inicio, Fin,
 * Mayúscula con flechas para un tramo y Escape), la lectura viva de la fecha, la tabla equivalente y «Cómo leerlo».
 *
 * La pasada visual de la rama C (15/11; DISENO-VISUAL §1 y §2 «C»), con el lenguaje que la pasada visual le dio a la base:
 * - **Arriba,** el título (16 px) y una línea tenue con la unidad, cómo se agrupa, el período y el método (§5.6: a la
 *   vista); debajo, «Por semana | Día por día» si el gráfico los tiene, y la leyenda como fichas cortas, solo con lo que
 *   se ve (el lector de pantalla oye el texto entero de cada una).
 * - **El gráfico ocupa el ancho:** 240 px con un panel; 140 con más. Con tres paneles o más, las fechas van también
 *   arriba, para que se lean sin bajar hasta el final.
 * - **Los ejes, sobrios:** de 3 a 5 marcas redondas con su grilla tenue; las versiones del plan con un tono tenue que
 *   alterna y una línea fina en el cambio.
 * - **Sin rótulo en cada punto:** el elegido, el último y, si suma, el mínimo y el máximo, sin pisarse (`rotulosDelPanel`).
 * - **Por semana** (GR-VC01): una barra por semana (llena con los siete días, hueca si no), una columna gris sin media,
 *   los días como puntos tenues detrás y la tira de cada día; la lectura de la semana elegida, a la vista y con el
 *   teclado (las flechas eligen la semana), y su tabla.
 * - **Debajo,** una línea de lectura, las notas que §5 pide a la vista, y al pie «Ver la tabla» y «Cómo leerlo».
 *
 * Accesibilidad: el contenedor es un grupo con nombre, su descripción apunta al resumen en texto y el SVG no se lee.
 * Pasar el mouse mueve la regla solo con un puntero fino; tocar o hacer clic la fija; la región viva cambia solo con un
 * clic, un toque o el teclado. La lectura y la tabla salen de las mismas filas, así que no dicen otra cosa que el dibujo.
 * Nunca verde ni rojo: la forma dice el estado además del color.
 */
import { MARCA_SEGUN_EL_DATO, type MarcaSemantica } from '@be/domain';
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useConPuntero } from '../../../../../lib/graficos';
import { LETRA_MINIMA, medidaDeMarca, type EstadoDeMarca } from '../../seguimiento/geometria';
import { ComoLeerlo } from '../como-leerlo';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import { useCursorDeFechas } from '../cursor-de-fechas';
import { diaYMes as diaYMesDelEje, escalaDeFechas, fechaCorta, inicioDelEje, moverElCursor, type EscalaDeFechas, type PeriodoDelGrafico } from '../eje-de-fechas';
import { textoDeLaMarcaDelEje } from '../ejes';
import { NotaDelInicio } from '../estado-del-grafico';
import { LecturaEnLaFecha } from '../lectura-en-la-fecha';
import { colorDelCarril, MarcaDelCarril } from '../marcas';
import { ALTO_DEL_EJE_DE_FECHAS, MARGEN_DERECHO, MARGEN_IZQUIERDO, useAnchoDelGrafico } from '../medidas-del-grafico';
import { COPY_NUTRICION_EN_GRAFICOS } from '../nutricion/copy';
import { nombreDelTramo } from '../nutricion/por-semana';
import { altoDelCarril, type DensidadDelGrafico } from '../paneles-alineados';
import { OPACIDAD_DE_LOS_DIAS, RELLENO_ENTERA, RELLENO_HUECA } from '../semanas';
import { TablaEquivalente } from '../tabla-equivalente-en-pantalla';
import {
  geometriaDeTira,
  geometriaDeValores,
  modoDeEntrada,
  rotulosDelPanel,
  semanaDeLaFecha,
  temporadasUbicadas,
  tramoDeEntrada,
  type ElementoDeLaLeyenda,
  type EstadoDeLaComida,
  type FormaDeLaSerie,
  type GraficoArmado,
  type ModoDelLienzo,
  type PanelDeTira,
  type PanelDeValores,
  type PorSemanaDelGrafico,
  type TemporadaUbicada,
  type TramoDeLasSemanas,
} from './lienzo';

const CS = COPY_NUTRICION_EN_GRAFICOS.porSemana;

/** La franja de arriba del primer panel, para el rótulo de cada versión del plan (la de la base). */
const FRANJA_DE_ROTULOS = 18;
/** La tira de cobertura de «Por semana»: 5 de alto, 4 de aire arriba y 4 abajo (la del gráfico chico de la base). */
const ALTO_DE_LA_TIRA = 5;
const ZONA_DE_LA_TIRA = ALTO_DE_LA_TIRA + 8;

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
  /** El primer panel lleva la franja de los rótulos de las temporadas (si alguno entra) y, con 3 paneles o más, las fechas. */
  readonly primero: boolean;
  readonly conRotulos: boolean;
  readonly ejeArriba: boolean;
  readonly ultimo: boolean;
  readonly fecha: string | null;
  readonly tramo: { readonly desde: string; readonly hasta: string } | null;
  readonly modo: ModoDelLienzo;
  /** «Por semana»: la semana que se lee, con un fondo apenas marcado. */
  readonly semana: { readonly desde: string; readonly hasta: string } | null;
}

/** Lo que va arriba del primer panel: las fechas (con 3 paneles o más) y la franja de los rótulos de las temporadas. */
function alturaDeArriba(d: PropsDelDibujo): number {
  return (d.primero && d.ejeArriba ? ALTO_DEL_EJE_DE_FECHAS - 4 : 0) + (d.primero && d.conRotulos ? FRANJA_DE_ROTULOS : 0);
}

/** Lo que va detrás de cada panel: las versiones del plan (tenues, alternadas), lo elegido y las líneas de cambio. */
function Fondo({ escala, temporadas, alto, tramo, semana, modo }: Pick<PropsDelDibujo, 'escala' | 'temporadas' | 'tramo' | 'semana' | 'modo'> & { alto: number }) {
  const elegido = modo === 'SEMANA' ? semana : tramo;
  return (
    <>
      {temporadas.map((t) => (t.tenue && t.x2 > t.x1 ? <rect key={`b${t.clave}`} className="grafico-capas__temporada" x={t.x1} y={0} width={t.x2 - t.x1} height={alto} fill="var(--banda)" fillOpacity={0.35} /> : null))}
      {elegido ? <rect x={escala.x(elegido.desde) - escala.porDia / 2} y={0} width={escala.x(elegido.hasta) - escala.x(elegido.desde) + escala.porDia} height={alto} fill="var(--grafico-cursor)" opacity={modo === 'SEMANA' ? 0.1 : 0.08} /> : null}
      {temporadas.map((t) =>
        t.conCambio ? <line key={`c${t.clave}`} x1={t.x1} x2={t.x1} y1={0} y2={alto} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray={t.tipo === 'OBJETIVO' ? '2 3' : undefined} /> : null,
      )}
    </>
  );
}

/** Los rótulos de las temporadas, en su franja: el entero si entra, si no el corto, si no nada. */
function RotulosDeLasTemporadas({ escala, temporadas, y }: { escala: EscalaDeFechas; temporadas: readonly TemporadaUbicada[]; y: number }) {
  return (
    <>
      {temporadas.map((t) =>
        t.texto ? (
          <text key={`r${t.clave}`} className="grafico-base__rotulo-de-version" x={Math.max(t.x1, escala.izquierda) + 4} y={y + FRANJA_DE_ROTULOS / 2} dominantBaseline="middle" fontSize={12} fill="var(--tenue)">
            {t.texto}
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

/** Lo de arriba del primer panel: las fechas (con 3 paneles o más) y, debajo, la franja de los rótulos de las temporadas. */
function Arriba({ d }: { d: PropsDelDibujo }) {
  if (!d.primero) return null;
  return (
    <>
      {d.ejeArriba ? <EjeDeFechas escala={d.escala} y={-6} /> : null}
      {d.conRotulos ? <RotulosDeLasTemporadas escala={d.escala} temporadas={d.temporadas} y={d.ejeArriba ? ALTO_DEL_EJE_DE_FECHAS - 4 : 0} /> : null}
    </>
  );
}

/** La tira de cobertura de «Por semana»: el alto dice el estado del día además del color. */
function TiraDeCobertura({ panel, escala, y }: { panel: PanelDeValores; escala: EscalaDeFechas; y: number }) {
  const ancho = Math.max(0.5, escala.porDia - (escala.porDia >= 4 ? 1 : 0));
  const color = colorDelCarril(0);
  // Lo cargado después lleva su muesca arriba del día (§5.14): por semana, los puntos tenues no la llevan.
  const tarde = new Set(panel.marcas.filter((m) => m.tarde && m.color !== null).map((m) => m.fecha));
  return (
    <g className="grafico-capas__tira" shapeRendering="crispEdges">
      {[...tarde]
        .filter((f) => f >= escala.desde && f <= escala.hasta)
        .map((f) => (
          <rect key={`t${f}`} x={escala.x(f) - 0.75} y={y - 3.5} width={1.5} height={2.5} fill="var(--texto)" data-tarde />
        ))}
      {panel.cobertura
        .filter((d) => d.fecha >= escala.desde && d.fecha <= escala.hasta)
        .map((d) => {
          const x = escala.x(d.fecha) - escala.porDia / 2;
          if (d.estado === 'con') return <rect key={d.fecha} x={x} y={y} width={ancho} height={ALTO_DE_LA_TIRA} fill={color} data-estado="con" />;
          if (d.estado === 'hueco') return <rect key={d.fecha} x={x} y={y + ALTO_DE_LA_TIRA / 2} width={ancho} height={ALTO_DE_LA_TIRA / 2} fill={color} data-estado="hueco" />;
          if (d.estado === 'hoy') return <rect key={d.fecha} x={x} y={y + ALTO_DE_LA_TIRA - 2} width={Math.max(2, ancho)} height={2} fill="var(--ahora)" data-estado="hoy" />;
          return <rect key={d.fecha} x={x} y={y + ALTO_DE_LA_TIRA - 1.5} width={ancho} height={1.5} fill="var(--grafico-hueco)" data-estado="sin" />;
        })}
    </g>
  );
}

function DibujoDeValores({ panel, alto, ...d }: PropsDelDibujo & { panel: PanelDeValores; alto: number }) {
  const { escala } = d;
  const semanal = d.modo === 'SEMANA' && panel.semanas.length > 0;
  const g = geometriaDeValores(panel, escala, alto, d.modo);
  const arriba = alturaDeArriba(d);
  const conTira = semanal && panel.cobertura.length > 0;
  const total = arriba + alto + (conTira ? ZONA_DE_LA_TIRA : 0) + (d.ultimo ? ALTO_DEL_EJE_DE_FECHAS : 0);
  // Los números del dibujo con los decimales de la lectura: las kcal enteras.
  const rotulos = rotulosDelPanel(g, escala, alto, d.fecha, d.modo, MARGEN_DERECHO, panel.escala.enteros ? 0 : 1);
  // Lo indicado va primero: lo registrado del mismo día se ve encima.
  const marcas = [...g.marcas].sort((a, b) => (a.color === null ? 0 : 1) - (b.color === null ? 0 : 1));
  const color = colorDelCarril(0);
  return (
    <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
      <Arriba d={d} />
      <g transform={`translate(0 ${arriba})`}>
        <Fondo escala={escala} temporadas={d.temporadas} alto={alto} tramo={d.tramo} semana={d.semana} modo={d.modo} />
        {/* Una semana sin ningún día con valor: una columna gris de todo el alto, que no se lee como una barra en cero. */}
        {g.vacias.map((v) => (
          <rect key={`v${v.clave}`} className="grafico-capas__sin-dias" x={v.x1} y={0} width={Math.max(1, v.x2 - v.x1)} height={alto} fill="var(--grafico-hueco)" fillOpacity={0.18} />
        ))}
        {/* Una semana con días pero sin media (no llega a 4 sin faltantes): una raya cortada y baja sobre el eje, que no tapa
            los días (GR-VD10: la caja punteada de todo el alto enrejaba el año y tapaba los puntos). */}
        {g.sinMedia.map((v) => (
          <line key={`s${v.clave}`} className="grafico-capas__sin-media" x1={v.x1 + 1} x2={Math.max(v.x1 + 2, v.x2 - 1)} y1={alto - 1.5} y2={alto - 1.5} stroke="var(--grafico-hueco)" strokeWidth={2} strokeDasharray="3 2" />
        ))}
        {g.marcasY.map((m) => (
          <g key={`y${m.valor}`} className="grafico-base__grilla">
            <line x1={MARGEN_IZQUIERDO} x2={escala.derecha} y1={Math.round(m.y) + 0.5} y2={Math.round(m.y) + 0.5} stroke="var(--borde)" strokeWidth={1} />
            <text x={MARGEN_IZQUIERDO - 8} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {textoDeLaMarcaDelEje(m.valor, g.extremos.decimales)}
            </text>
          </g>
        ))}
        {semanal ? (
          <>
            {/* Los días, como puntos tenues detrás de las barras: se ve de qué sale cada media; lo indicado, rombos tenues. */}
            {marcas.map((m) =>
              m.color === null ? (
                <g key={m.clave} opacity={OPACIDAD_DE_LOS_DIAS}>
                  <MarcaDelCarril marca="ROMBO" cx={m.x} cy={m.y} porDia={Math.min(escala.porDia, 6)} color={tintaDe(null)} />
                </g>
              ) : (
                <circle key={m.clave} className="grafico-capas__dia" cx={m.x} cy={m.y} r={1.75} fill={tintaDe(m.color)} opacity={OPACIDAD_DE_LOS_DIAS} />
              ),
            )}
            {g.barras.map((b) => (
              <g key={b.clave} className="grafico-capas__semana" data-entera={b.entera ? '' : undefined}>
                <rect x={b.x1} y={b.y} width={Math.max(1, b.x2 - b.x1)} height={Math.max(0, b.base - b.y)} fill={color} fillOpacity={b.entera ? RELLENO_ENTERA : RELLENO_HUECA} />
                {b.entera ? (
                  <line x1={b.x1} x2={b.x2} y1={b.y + 1} y2={b.y + 1} stroke={color} strokeWidth={2} />
                ) : (
                  <path d={`M ${b.x1 + 0.5} ${b.base} V ${b.y + 0.5} H ${b.x2 - 0.5} V ${b.base}`} fill="none" stroke={color} strokeWidth={1} />
                )}
              </g>
            ))}
          </>
        ) : null}
        {g.escalones.map((t) => (
          <line key={t.clave} x1={t.x1} x2={t.x2} y1={t.y} y2={t.y} stroke={tintaDe(t.color)} strokeWidth={1.5} strokeDasharray="6 4" />
        ))}
        {semanal ? null : (
          <>
            {g.uniones.map((u) => (
              <line key={u.clave} x1={u.x} x2={u.x} y1={u.y1} y2={u.y2} stroke="var(--tenue)" strokeWidth={u.forma === 'DIFERENCIA' ? 1.5 : 1} strokeDasharray={u.forma === 'SEPARACION' ? '2 2' : undefined} />
            ))}
            {g.lineas.map((l, i) => (
              <polyline key={`l${l.serie}${i}`} points={l.puntos.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={tintaDe(l.color)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {marcas.map((m) => (
              <Marca key={m.clave} marca={m.marca} forma={m.forma} cx={m.x} cy={m.y} porDia={escala.porDia} color={tintaDe(m.color)} tarde={m.tarde} />
            ))}
          </>
        )}
        {rotulos.map((r) => (
          <text key={`r${r.clave}`} className="grafico-base__rotulo-del-punto" x={r.tx} y={r.ty} textAnchor={r.ancla} fontSize={12} fontWeight={r.fuerte ? 600 : 400} fill={r.fuerte ? 'var(--texto)' : 'var(--tenue)'}>
            {r.texto}
          </text>
        ))}
        {!semanal && d.fecha ? <line x1={escala.x(d.fecha)} x2={escala.x(d.fecha)} y1={0} y2={alto} stroke="var(--grafico-cursor)" strokeWidth={1} opacity={0.7} /> : null}
        {conTira ? <TiraDeCobertura panel={panel} escala={escala} y={alto + 4} /> : null}
        {d.ultimo ? <EjeDeFechas escala={escala} y={alto + (conTira ? ZONA_DE_LA_TIRA : 0)} /> : null}
      </g>
    </svg>
  );
}

function DibujoDeTira({ panel, ...d }: PropsDelDibujo & { panel: PanelDeTira }) {
  const { escala } = d;
  const g = geometriaDeTira(panel, escala);
  const arriba = alturaDeArriba(d);
  const total = arriba + g.alto + (d.ultimo ? ALTO_DEL_EJE_DE_FECHAS : 0);
  return (
    <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
      <Arriba d={d} />
      <g transform={`translate(0 ${arriba})`}>
        <Fondo escala={escala} temporadas={d.temporadas} alto={g.alto} tramo={d.tramo} semana={d.semana} modo={d.modo} />
        {g.filas.map((f) => (
          <g key={f.clave}>
            <text x={escala.izquierda + 2} y={f.yDelNombre} dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)" stroke="var(--superficie)" strokeWidth={3} paintOrder="stroke">
              {f.nombre}
            </text>
            {f.celdas.map((c) => (
              <CeldaDeLaComida key={c.fecha} estado={c.estado} x={c.x} y={f.y} ancho={c.ancho} />
            ))}
          </g>
        ))}
        {d.modo === 'DIA' && d.fecha ? <line x1={escala.x(d.fecha)} x2={escala.x(d.fecha)} y1={0} y2={g.alto} stroke="var(--grafico-cursor)" strokeWidth={1} opacity={0.7} /> : null}
        {d.ultimo ? <EjeDeFechas escala={escala} y={g.alto} /> : null}
      </g>
    </svg>
  );
}

/** La muestra de una ficha de la leyenda, con la misma tinta y la misma forma que el dibujo. */
function Muestra({ e }: { e: ElementoDeLaLeyenda }) {
  const m = e.muestra;
  return (
    <svg width={18} height={14} viewBox="0 0 18 14" aria-hidden="true">
      {m.tipo === 'MARCA' ? <Marca marca={m.marca} forma={m.forma} cx={9} cy={7} porDia={10} color={tintaDe(m.color)} tarde={false} /> : null}
      {m.tipo === 'TARDE' ? <MarcaDelCarril marca={MARCA_SEGUN_EL_DATO.REGISTRADO} cx={9} cy={9} porDia={10} color={colorDelCarril(0)} tarde /> : null}
      {m.tipo === 'ESCALON' ? <line x1={1} x2={17} y1={7} y2={7} stroke={tintaDe(m.color)} strokeWidth={1.5} strokeDasharray="5 3" /> : null}
      {m.tipo === 'UNION' ? <line x1={9} x2={9} y1={1} y2={13} stroke="var(--tenue)" strokeWidth={1.5} strokeDasharray={m.forma === 'SEPARACION' ? '2 2' : undefined} /> : null}
      {m.tipo === 'COMIDA' ? <CeldaDeLaComida estado={m.estado} x={9} y={7} ancho={10} /> : null}
      {m.tipo === 'TEMPORADA' ? (
        <>
          <rect x={2} y={1} width={8} height={12} fill="var(--banda)" fillOpacity={0.6} />
          <line x1={10} x2={10} y1={1} y2={13} stroke="var(--borde-control)" strokeWidth={1} />
        </>
      ) : null}
      {m.tipo === 'SEMANA' && m.forma === 'ENTERA' ? (
        <>
          <rect x={4} y={3} width={10} height={10} fill={colorDelCarril(m.color)} fillOpacity={RELLENO_ENTERA} />
          <line x1={4} x2={14} y1={3.75} y2={3.75} stroke={colorDelCarril(m.color)} strokeWidth={1.5} />
        </>
      ) : null}
      {m.tipo === 'SEMANA' && m.forma === 'HUECA' ? <path d="M 4.5 13 V 3.5 H 13.5 V 13" fill="none" stroke={colorDelCarril(m.color)} strokeWidth={1} /> : null}
      {m.tipo === 'SEMANA' && m.forma === 'SIN_MEDIA' ? <line x1={3} x2={15} y1={12} y2={12} stroke="var(--grafico-hueco)" strokeWidth={2} strokeDasharray="3 2" /> : null}
      {m.tipo === 'SEMANA' && m.forma === 'SIN_DIAS' ? <rect x={4} y={1} width={10} height={12} fill="var(--grafico-hueco)" fillOpacity={0.3} /> : null}
      {m.tipo === 'DIA_TENUE' ? <circle cx={9} cy={7} r={2} fill={colorDelCarril(m.color)} opacity={OPACIDAD_DE_LOS_DIAS} /> : null}
      {m.tipo === 'COBERTURA' ? (
        <>
          <circle cx={9} cy={4} r={1.75} fill={colorDelCarril(m.color)} opacity={OPACIDAD_DE_LOS_DIAS} />
          <rect x={1} y={8} width={4} height={5} fill={colorDelCarril(m.color)} />
          <rect x={7} y={10.5} width={4} height={2.5} fill={colorDelCarril(m.color)} />
          <rect x={13} y={11.5} width={4} height={1.5} fill="var(--grafico-hueco)" />
        </>
      ) : null}
    </svg>
  );
}

/** La leyenda: fichas cortas en una línea, arriba del gráfico; el lector de pantalla oye el texto entero de cada una. */
export function LeyendaDelLienzo({ elementos }: { elementos: readonly ElementoDeLaLeyenda[] }) {
  if (elementos.length === 0) return null;
  return (
    <ul className="grafico-base__leyenda" aria-label={COPY_DE_LOS_GRAFICOS.leyenda}>
      {elementos.map((e) => (
        <li key={e.clave}>
          <span className="grafico-base__glifo">
            <Muestra e={e} />
            <span aria-hidden="true">{e.texto}</span>
            <span className="visualmente-oculto">{e.largo}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Lo que dice una semana, en una línea: «Semana del 3 nov · Calorías registradas: 1.950 kcal por día de media · con…». */
function LineaDeLaSemana({ s, t }: { s: PorSemanaDelGrafico; t: TramoDeLasSemanas }) {
  return (
    <p className="grafico-base__lectura-linea">
      <span className="grafico-base__lectura-fecha">{nombreDelTramo(t)}</span>
      {s.columnas.map((c, i) => (
        <span key={c.id} className="grafico-base__lectura-valor">
          {s.columnas.length > 1 ? <span className="grafico-base__lectura-nombre">{c.nombre}: </span> : null}
          {t.textos[i]}
        </span>
      ))}
    </p>
  );
}

/**
 * La lectura de «Por semana», a la vista (§5.13: cada media con sus días): la semana elegida o, sin elegir, la última con
 * media. La región viva cambia con el teclado, un clic o un toque; al pasar el mouse se ve la de abajo del puntero en un
 * renglón que el lector de pantalla no oye.
 */
function LecturaDeLaSemana({ s, tramos, fecha, encima }: { s: PorSemanaDelGrafico; tramos: readonly TramoDeLasSemanas[]; fecha: string | null; encima: string | null }) {
  const elegida = semanaDeLaFecha(tramos, fecha) ?? tramoDeEntrada(tramos);
  const bajo = semanaDeLaFecha(tramos, encima);
  return (
    <>
      <div className={bajo ? 'grafico-base__lectura visualmente-oculto' : 'grafico-base__lectura'} aria-live="polite" data-lectura-de-la-semana>
        {elegida ? <LineaDeLaSemana s={s} t={elegida} /> : <p className="nota">{CS.sinElegir}</p>}
      </div>
      {bajo ? (
        <div className="grafico-base__lectura" aria-hidden="true" data-lectura-bajo-el-mouse>
          <LineaDeLaSemana s={s} t={bajo} />
        </div>
      ) : null}
    </>
  );
}

/** «Ver la tabla» de «Por semana»: una fila por semana, una columna por panel, con lo que dice cada media. */
function TablaDeLasSemanas({ titulo, s }: { titulo: string; s: PorSemanaDelGrafico }) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  return (
    <div className="grafico-base__tabla">
      <button type="button" className="boton boton--enlace" aria-expanded={abierta} aria-controls={id} onClick={() => setAbierta((a) => !a)}>
        {abierta ? COPY_DE_LOS_GRAFICOS.ocultarLaTabla : COPY_DE_LOS_GRAFICOS.verLaTabla}
      </button>
      <div id={id} hidden={!abierta}>
        {abierta ? (
          <div className="grafico-base__tabla-desplazable">
            <table data-tabla-de-las-semanas>
              <caption>{CS.tabla(titulo)}</caption>
              <thead>
                <tr>
                  <th scope="col">{CS.semana}</th>
                  {s.columnas.map((c) => (
                    <th key={c.id} scope="col">
                      {c.nombre} ({c.unidad})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.tramos.map((t) => (
                  <tr key={t.desde}>
                    <th scope="row">{nombreDelTramo(t)}</th>
                    {t.textos.map((x, i) => (
                      <td key={s.columnas[i]?.id ?? i}>{x}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Un gráfico que va como tabla a la vista (GR-20 con menos de 4 tomas): la misma tabla equivalente, abierta y sin botón. */
function TablaALaVista({ titulo, grafico, hoy }: { titulo: string; grafico: GraficoArmado; hoy: string }) {
  const t = grafico.tabla;
  return (
    <div className="grafico-base__tabla grafico-capas__tabla-a-la-vista">
      <div className="grafico-base__tabla-desplazable">
        <table data-como-tabla>
          <caption className="visualmente-oculto">{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">{COPY_DE_LOS_GRAFICOS.fecha}</th>
              {t.columnas.map((c) => (
                <th key={c.id} scope="col">
                  {c.nombre} ({c.unidad})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.filas.map((f) => (
              <tr key={f.fecha}>
                <th scope="row">{fechaCorta(f.fecha, hoy)}</th>
                {f.celdas.map((c, i) => (
                  <td key={t.columnas[i]?.id ?? i} data-marca={c?.marca ?? undefined}>
                    {c ? c.texto : COPY_DE_LOS_GRAFICOS.sinDato}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

/** La línea tenue de debajo del título: las unidades, cómo se agrupa, el período y el método (§5.6, a la vista). */
export function lineaTenueDelLienzo(grafico: GraficoArmado, periodo: PeriodoDelGrafico, modo: ModoDelLienzo): string {
  const unidades = [...new Set(grafico.paneles.flatMap((p) => (p.tipo === 'VALORES' ? [p.unidad] : [])))].join(' y ');
  const desde = inicioDelEje(periodo);
  const hasta = periodo.hasta >= periodo.hoy ? null : diaYMesDelEje(periodo.hasta, periodo.hoy);
  const agrupado = grafico.porSemana === null ? null : modo === 'SEMANA' ? grafico.porSemana.detalle : CS.detalleDiaPorDia;
  return [unidades, agrupado, COPY_DE_LOS_GRAFICOS.periodo(diaYMesDelEje(desde, periodo.hoy), hasta), grafico.metodo].filter((x): x is string => Boolean(x)).join(' · ');
}

export function LienzoDeNutricionYCuerpo({ titulo, periodo, grafico, densidad = 'COMPLETA', antes = null }: PropsDelLienzo) {
  const [ref, ancho] = useAnchoDelGrafico();
  const conPuntero = useConPuntero();
  const cursor = useCursorDeFechas();
  const idDelResumen = useId();
  const desde = inicioDelEje(periodo);
  const porSemana = grafico.porSemana;
  // Por semana de entrada con más de seis semanas (GR-V01, como «Comparar dos etapas») y si alguna semana tiene media
  // (GR-VC12); el pedido vale para su período.
  const deEntrada: ModoDelLienzo = modoDeEntrada(grafico, desde, periodo.hasta);
  const clave = `${desde}|${periodo.hasta}`;
  const [pedido, setPedido] = useState<{ readonly modo: ModoDelLienzo; readonly para: string } | null>(null);
  const modo: ModoDelLienzo = porSemana === null ? 'DIA' : pedido !== null && pedido.para === clave ? pedido.modo : deEntrada;
  const semanal = modo === 'SEMANA' && porSemana !== null;
  const escala = useMemo(() => escalaDeFechas(periodo, { izquierda: MARGEN_IZQUIERDO, derecha: ancho - MARGEN_DERECHO }), [periodo, ancho]);
  const temporadas = useMemo(() => temporadasUbicadas(grafico.temporadas, escala), [grafico.temporadas, escala]);
  const tramos = useMemo(() => (porSemana?.tramos ?? []).filter((t) => t.hasta >= escala.desde && t.desde <= escala.hasta), [porSemana, escala]);
  const fechas = useMemo(
    () => (semanal ? tramos.map((t) => t.desde) : grafico.tabla.filas.map((f) => f.fecha).filter((f) => f >= escala.desde && f <= escala.hasta)),
    [semanal, tramos, grafico.tabla, escala],
  );
  const [encima, setEncima] = useState<string | null>(null);
  const fecha = encima ?? cursor.fecha;
  const deValores = grafico.paneles.filter((p) => p.tipo === 'VALORES').length;
  const alto = altoDelCarril(densidad, deValores);
  const conRotulos = temporadas.some((t) => t.texto !== null);
  const ejeArriba = grafico.paneles.length >= 3;
  const unSolo = grafico.paneles.length === 1;
  const semanaElegida = semanal ? (semanaDeLaFecha(tramos, fecha) ?? (fecha === null ? tramoDeEntrada(tramos) : null)) : null;

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    // Por semana, las flechas eligen la semana: se parte de la semana elegida (o de la que se lee de entrada).
    const actual = semanal ? { fecha: (semanaDeLaFecha(tramos, cursor.fecha) ?? tramoDeEntrada(tramos))?.desde ?? null, tramo: null } : { fecha: cursor.fecha, tramo: cursor.tramo };
    const nuevo = moverElCursor(fechas, actual, e.key, semanal ? false : e.shiftKey);
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
      </>
    ) : (
      p.nombre
    );
  const elegir = (m: ModoDelLienzo) => setPedido({ modo: m, para: clave });
  const comoSeUsa = semanal ? CS.comoSeUsa : COPY_DE_LOS_GRAFICOS.comoSeUsa;
  const aclaraciones = [...grafico.aclaraciones, ...(semanal && porSemana ? porSemana.aclaraciones : [])];

  return (
    <div className={`grafico-base grafico-capas grafico-base--${densidad.toLowerCase()}`} data-modo={grafico.comoTabla ? 'TABLA' : modo}>
      <div className="grafico-base__cabecera">
        <h3 className="grafico-base__titulo">{titulo}</h3>
        <p className="grafico-base__detalle">{lineaTenueDelLienzo(grafico, periodo, modo)}</p>
      </div>
      <NotaDelInicio periodo={periodo} />
      {porSemana !== null || antes !== null ? (
        <div className="grafico-capas__controles">
          {porSemana !== null ? (
            <div className="grafico-capas__modo" role="group" aria-label={CS.comoSeAgrupa}>
              <button type="button" className="chip-de-zona" aria-pressed={modo === 'SEMANA'} onClick={() => elegir('SEMANA')} data-por-semana>
                {CS.porSemana}
              </button>
              <button type="button" className="chip-de-zona" aria-pressed={modo === 'DIA'} onClick={() => elegir('DIA')} data-dia-por-dia>
                {CS.diaPorDia}
              </button>
            </div>
          ) : null}
          {antes}
        </div>
      ) : null}
      {grafico.comoTabla ? (
        <TablaALaVista titulo={titulo} grafico={grafico} hoy={periodo.hoy} />
      ) : (
        <>
          <LeyendaDelLienzo elementos={semanal && porSemana ? porSemana.leyenda : grafico.leyenda} />
          <div
            ref={ref}
            className="grafico-base__area"
            tabIndex={0}
            role="group"
            aria-roledescription="gráfico"
            aria-label={`${titulo}${semanal ? `, ${CS.porSemana.toLowerCase()}` : ''}. ${comoSeUsa}`}
            aria-describedby={idDelResumen}
            onKeyDown={alTeclear}
            onPointerMove={(e) => {
              if (conPuntero && e.pointerType === 'mouse') setEncima(fechaDelPuntero(e));
            }}
            onPointerLeave={() => setEncima(null)}
            onClick={(e) => cursor.elegir(fechaDelPuntero(e))}
          >
            {grafico.paneles.map((p, i) => {
              const comun: PropsDelDibujo = {
                escala,
                temporadas,
                primero: i === 0,
                conRotulos,
                ejeArriba,
                ultimo: i === grafico.paneles.length - 1,
                fecha,
                tramo: cursor.tramo,
                modo: semanal ? 'SEMANA' : 'DIA',
                semana: semanaElegida,
              };
              return (
                <div key={p.id} className="grafico-base__carril">
                  {/* Con un solo panel, el título y la línea tenue ya dicen qué es: el nombre del panel no se repite. */}
                  {unSolo ? null : <p className="grafico-base__carril-nombre">{nombreDelPanel(p)}</p>}
                  {p.tipo === 'VALORES' ? <DibujoDeValores panel={p} alto={alto} {...comun} /> : <DibujoDeTira panel={p} {...comun} />}
                </div>
              );
            })}
          </div>
          <p id={idDelResumen} className="visualmente-oculto">
            {semanal && porSemana ? `${grafico.descripcion} ${porSemana.descripcion}` : grafico.descripcion}
          </p>
          {semanal && porSemana ? (
            <LecturaDeLaSemana s={porSemana} tramos={tramos} fecha={cursor.fecha} encima={encima} />
          ) : (
            <LecturaEnLaFecha tabla={grafico.tabla} fecha={cursor.fecha} encima={encima} tramo={cursor.tramo} hoy={periodo.hoy} />
          )}
        </>
      )}
      {grafico.notas.map((n) => (
        <p key={n} className="nota grafico-base__nota">
          {n}
        </p>
      ))}
      <div className="grafico-base__pie">
        {grafico.comoTabla ? null : semanal && porSemana ? <TablaDeLasSemanas titulo={titulo} s={porSemana} /> : <TablaEquivalente titulo={titulo} tabla={grafico.tabla} hoy={periodo.hoy} />}
        <ComoLeerlo de={titulo}>
          {aclaraciones.map((n) => (
            <p key={n}>{n}</p>
          ))}
          {grafico.comoTabla ? null : <p>{comoSeUsa}</p>}
        </ComoLeerlo>
      </div>
    </div>
  );
}
