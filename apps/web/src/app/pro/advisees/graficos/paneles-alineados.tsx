'use client';

/**
 * Los paneles alineados (WP-GRAFICOS fase 2, DL-174; GR-26 «Alineadas»): los carriles apilados, uno arriba del otro, con
 * un solo eje de fechas escrito bajo el último. Cada carril tiene su unidad y su escala; las bandas son las versiones
 * del plan del área del gráfico; la regla del cursor cruza todos los carriles a la vez. Debajo de cada carril va la tira
 * de cobertura: el estado de cada día por la altura además del color, con una muesca arriba de los días cargados
 * después. Un carril de eventos es la cinta del tiempo (GR-23).
 *
 * La pasada visual (15/11; DISENO-VISUAL §1), para que las ramas la hereden:
 * - **Arriba,** el título (16 px) y, en una línea tenue, la unidad y el período; debajo, la leyenda como fichas cortas en
 *   una sola línea, solo con las marcas que se ven (`sentidosQueSeVen`).
 * - **El gráfico ocupa el ancho:** 240 px de alto con un carril; 140 por carril con más.
 * - **Los ejes, sobrios:** de 3 a 5 marcas redondas con una grilla muy tenue (`marcasRedondas`) y las fechas abreviadas,
 *   sin repetir el año (`textoDelEje`).
 * - **Sin rótulo en cada punto:** el número va en el último, el elegido y, con 4 o más, el máximo y el mínimo, sin
 *   pisarse (`rotulosSinPisarse`). El resto se lee al pasar el mouse, con el teclado o en la lectura.
 * - **Las versiones, discretas:** un fondo de un tono muy tenue que alterna, una línea fina en cada cambio y «v8» arriba;
 *   si cambió lo indicado, «v8 · de 4 a 3 repeticiones» (`BandaDeVersion.cambio`).
 * - **Debajo, la línea de lectura y las notas a la vista;** las aclaraciones, en «Cómo leerlo» (cerrado), junto a «Ver la
 *   tabla».
 *
 * La revisión de #283 (WP-GRAFICOS §5 manda sobre la guía visual):
 * - **Las notas se ven todas** (`notas`): la frase fija de los cruces, también con algo agregado («… Ventana: 4
 *   semanas»), lo que también cambió en esa ventana (§5.1), una media con su cantidad (§5.13), lo cargado después (§5.14)
 *   y lo que no entra en la escala, que explica la muesca. A «Cómo leerlo» va solo lo que el llamador pide (`aclaraciones`).
 * - **El método, a la vista con un solo carril:** va en la línea tenue, aunque el llamador pase la suya (§5.6).
 * - **El cambio de lo indicado, en texto** (§5.12): todos en el nombre del gráfico; a la vista, los que no entran enteros
 *   en la línea de su versión.
 * - **«Lo último» es lo último de cada carril,** con su fecha, y la región viva no sigue al mouse.
 * - **El mínimo y el máximo rotulados** son de lo registrado lleno: un subtotal o una carga rápida no se rotulan como el
 *   extremo del período (§5.5 y §5.13).
 * - **Una semana sin datos** es una columna gris de todo el alto, nunca una raya sobre el cero.
 *
 * Accesibilidad: el contenedor es un grupo con nombre y su descripción apunta al resumen en texto; el SVG no se lee. El
 * área del gráfico recibe el foco: flechas, Inicio, Fin, Mayúscula con flechas (un tramo) y Escape. Pasar el mouse mueve
 * la regla solo con un puntero fino; tocar o hacer clic la fija. La lectura de la fecha y la tabla dicen lo mismo que el
 * dibujo.
 */
import type { SentidoDeLaMarca } from '@be/domain';
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useConPuntero } from '../../../../lib/graficos';
import { LETRA_MINIMA } from '../seguimiento/geometria';
import { fechasConObservacion, geometriaDelCarril, lineaDeLoCargadoTarde, sentidosQueSeVen, type BandaDeVersion, type Carril, type CarrilDePuntos, type GeometriaDelCarril } from './carriles';
import { geometriaDeLaCinta, resumenDeLaCinta, type GeometriaDeLaCinta } from './cinta-del-tiempo';
import { ComoLeerlo, FraseDeLaCoincidencia } from './como-leerlo';
import { DibujoDeLaCinta } from './dibujo-de-la-cinta';
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { useCursorDeFechas } from './cursor-de-fechas';
import { diaYMes, escalaDeFechas, inicioDelEje, moverElCursor, type EscalaDeFechas, type PeriodoDelGrafico } from './eje-de-fechas';
import { rotulosDeLoLleno, rotulosSinPisarse, textoDeLaMarcaDelEje } from './ejes';
import { LecturaEnLaFecha } from './lectura-en-la-fecha';
import { colorDelCarril, Leyenda, MarcaDelCarril } from './marcas';
import { ALTO_DEL_EJE_DE_FECHAS, MARGEN_DERECHO, MARGEN_IZQUIERDO, useAnchoDelGrafico } from './medidas-del-grafico';
import { NotaDelInicio } from './estado-del-grafico';
import { esLaFraseFija, lineaTenueDelGrafico, notasALaVista } from './notas-del-grafico';
import { tablaEquivalente } from './tabla-equivalente';
import { TablaEquivalente } from './tabla-equivalente-en-pantalla';
import { cambiosEnTexto, cambiosQueNoEntran, versionesEnElEje } from './versiones-en-el-eje';

export type DensidadDelGrafico = 'COMPLETA' | 'COMPACTA';

export interface PropsDePanelesAlineados {
  readonly titulo: string;
  readonly periodo: PeriodoDelGrafico;
  readonly carriles: readonly Carril[];
  /** Solo las del área del gráfico; las de otra, a pedido y en el caso 1. */
  readonly bandas?: readonly BandaDeVersion[];
  /** `COMPACTA` en el panel de la estación. */
  readonly densidad?: DensidadDelGrafico;
  /** Los sentidos que puede tener el gráfico: la leyenda muestra solo los que se ven en el dibujo. */
  readonly leyenda?: readonly SentidoDeLaMarca[];
  /**
   * Las notas que se ven, debajo del gráfico: la frase fija de los cruces (en su línea tenue, también con algo agregado),
   * lo que también cambió en la ventana, una media con su cantidad. Ninguna se esconde (revisión de #283).
   */
  readonly notas?: readonly string[];
  /** Las aclaraciones que van en «Cómo leerlo» («se leyó en tramos de 92 días», la explicación fisiológica con su fuente). */
  readonly aclaraciones?: readonly string[];
  /** La línea tenue debajo del título: la unidad y qué es cada punto. Sin esto, la unidad de los carriles y el período. */
  readonly detalle?: string;
  /** Más contenido para «Cómo leerlo», después de las notas. */
  readonly comoLeerlo?: ReactNode;
}

/** El alto de un carril: un gráfico principal de un carril, 240 px (DISENO-VISUAL §1, principio 1); con más, 140 cada uno. */
export function altoDelCarril(densidad: DensidadDelGrafico, carriles: number): number {
  if (densidad === 'COMPACTA') return 96;
  return carriles <= 1 ? 240 : 140;
}

/** La franja de arriba del primer carril, para la etiqueta de cada versión del plan. */
const FRANJA_DE_ROTULOS = 18;
/** La tira de cobertura: 6 de alto, 4 por debajo del carril, y 4 de aire hasta lo que sigue. */
const SEPARACION_DE_LA_TIRA = 4;
const ALTO_DE_LA_TIRA = 6;
const ZONA_DE_LA_TIRA = SEPARACION_DE_LA_TIRA + ALTO_DE_LA_TIRA + 4;

/** Un valor de un punto, con sus decimales (hasta uno): «160,5», «1.850». */
const valorCorto = (v: number): string => v.toLocaleString('es-AR', { maximumFractionDigits: 1 });

type Geometria = { readonly tipo: 'CARRIL'; readonly g: GeometriaDelCarril } | { readonly tipo: 'CINTA'; readonly g: GeometriaDeLaCinta };

/** La tira de cobertura de un carril: entera con dato, a media altura con algo que falta, una raya baja sin registros. */
function TiraDeCobertura({ carril, escala, y, color }: { carril: CarrilDePuntos; escala: EscalaDeFechas; y: number; color: string }) {
  const tarde = new Set(carril.puntos.filter((p) => p.valor !== null && p.tarde).map((p) => p.fecha));
  const ancho = Math.max(1, escala.porDia - (escala.porDia >= 4 ? 1 : 0));
  return (
    <g className="grafico-base__tira" shapeRendering={escala.porDia < 4 ? 'crispEdges' : undefined}>
      {carril.cobertura
        .filter((d) => d.fecha >= escala.desde && d.fecha <= escala.hasta)
        .map((d) => {
          const x = escala.x(d.fecha) - escala.porDia / 2;
          return (
            <g key={d.fecha} data-estado={d.estado}>
              {d.estado === 'con' ? <rect x={x} y={y} width={ancho} height={ALTO_DE_LA_TIRA} fill={color} /> : null}
              {d.estado === 'hueco' ? <rect x={x} y={y + ALTO_DE_LA_TIRA / 2} width={ancho} height={ALTO_DE_LA_TIRA / 2} fill={color} /> : null}
              {d.estado === 'sin' ? <rect x={x} y={y + ALTO_DE_LA_TIRA - 1.5} width={ancho} height={1.5} fill="var(--grafico-hueco)" /> : null}
              {tarde.has(d.fecha) ? <rect x={x + ancho / 2 - 0.75} y={y - 3} width={1.5} height={2.5} fill="var(--texto)" /> : null}
            </g>
          );
        })}
    </g>
  );
}

function DibujoDelCarril({
  carril,
  geometria,
  escala,
  alto,
  bandas,
  fecha,
  tramo,
  primero,
  ultimo,
}: {
  carril: Carril;
  geometria: Geometria;
  escala: EscalaDeFechas;
  alto: number;
  bandas: readonly BandaDeVersion[];
  fecha: string | null;
  tramo: { readonly desde: string; readonly hasta: string } | null;
  primero: boolean;
  ultimo: boolean;
}) {
  const color = carril.tipo === 'PUNTOS' ? colorDelCarril(carril.indice) : 'var(--grafico-hueco)';
  const conTira = carril.tipo === 'PUNTOS' && carril.cobertura.length > 0;
  const arriba = primero && bandas.length > 0 ? FRANJA_DE_ROTULOS : 0;
  const total = arriba + alto + (conTira ? ZONA_DE_LA_TIRA : 0) + (ultimo ? ALTO_DEL_EJE_DE_FECHAS : 0);
  const xDe = (f: string) => escala.x(f);
  const g = geometria.tipo === 'CARRIL' ? geometria.g : null;
  const versiones = versionesEnElEje(bandas, escala);
  // Los números de los puntos: el elegido, el último y, con 4 o más, el máximo y el mínimo, sin pisarse.
  const rotulos = useMemo(() => {
    if (!g || g.tipo !== 'PUNTOS' || carril.tipo !== 'PUNTOS') return [];
    const conValor = g.marcas
      .flatMap((m) => {
        const p = carril.puntos.find((x) => x.clave === m.clave);
        return p && p.valor !== null ? [{ clave: m.clave, valor: p.valor, x: m.x, y: m.y, fecha: p.fecha, marca: m.marca }] : [];
      })
      .sort((a, b) => a.x - b.x);
    const elegido = fecha === null ? null : (conValor.find((p) => p.fecha === fecha)?.clave ?? null);
    const ultimoPunto = conValor[conValor.length - 1]?.clave ?? null;
    // El mínimo y el máximo del período, solo entre lo registrado sin hueco: un subtotal (le falta algo) o una carga rápida
    // (los números del plan) no se rotulan como el extremo (revisión de #283). El elegido y el último, siempre.
    const { claves, minimo } = rotulosDeLoLleno(conValor, elegido);
    const candidatos = claves.flatMap((c) => {
      const p = conValor.find((x) => x.clave === c);
      return p ? [{ clave: c, x: p.x, y: p.y, texto: valorCorto(p.valor), abajo: c === minimo && c !== ultimoPunto }] : [];
    });
    const ejeY = g.marcasY.map((m) => ({ x1: 0, x2: MARGEN_IZQUIERDO - 4, y1: m.y - 8, y2: m.y + 8 }));
    return rotulosSinPisarse(candidatos, { izquierda: MARGEN_IZQUIERDO, derecha: escala.derecha + MARGEN_DERECHO - 2, arriba: 0, abajo: alto }, ejeY).map((r) => ({ ...r, fuerte: r.clave === elegido || r.clave === ultimoPunto }));
  }, [g, carril, fecha, escala, alto]);
  return (
    <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
      {versiones.map((v) => (
        <g key={v.clave} className="grafico-base__version" data-con-cambio={v.conCambio ? '' : undefined}>
          {v.tenue && v.x2 > v.x1 ? <rect x={v.x1} y={arriba} width={v.x2 - v.x1} height={alto} fill="var(--banda)" fillOpacity={0.35} /> : null}
          {v.conLinea ? <line x1={v.x1} x2={v.x1} y1={arriba > 0 ? 2 : 0} y2={arriba + alto} stroke="var(--borde-control)" strokeWidth={1} /> : null}
          {arriba > 0 && v.texto ? (
            <text className="grafico-base__rotulo-de-version" x={v.x1 + 4} y={FRANJA_DE_ROTULOS / 2} dominantBaseline="middle" fontSize={12} fill="var(--tenue)">
              {v.texto}
            </text>
          ) : null}
        </g>
      ))}
      <g transform={`translate(0 ${arriba})`}>
        {tramo ? <rect x={xDe(tramo.desde) - escala.porDia / 2} y={0} width={xDe(tramo.hasta) - xDe(tramo.desde) + escala.porDia} height={alto} fill="var(--grafico-cursor)" opacity={0.08} /> : null}
        {g && (g.tipo === 'PUNTOS' || g.tipo === 'BARRAS_SEMANALES')
          ? g.marcasY.map((m) => (
              <g key={`y${m.valor}`} className="grafico-base__grilla">
                <line x1={MARGEN_IZQUIERDO} x2={escala.derecha} y1={Math.round(m.y) + 0.5} y2={Math.round(m.y) + 0.5} stroke="var(--borde)" strokeWidth={1} />
                <text x={MARGEN_IZQUIERDO - 8} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                  {textoDeLaMarcaDelEje(m.valor, g.extremos.decimales)}
                </text>
              </g>
            ))
          : null}
        {g && g.tipo === 'PUNTOS' ? (
          <>
            {g.escalones.map((e, i) => (
              <line key={`e${i}`} x1={e.x1} x2={e.x2} y1={e.y} y2={e.y} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />
            ))}
            {g.lineas.map((l, i) => (
              <polyline key={`l${i}`} points={l.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {g.indicado.map((m) => (
              <MarcaDelCarril key={`i${m.clave}`} marca={m.marca} cx={m.x} cy={m.y} yHasta={m.yHasta} porDia={escala.porDia} color={color} />
            ))}
            {g.marcas.map((m) => (
              <MarcaDelCarril key={m.clave} marca={m.marca} cx={m.x} cy={m.y} porDia={escala.porDia} color={color} tarde={m.tarde} />
            ))}
            {rotulos.map((r) => (
              <text key={`r${r.clave}`} className="grafico-base__rotulo-del-punto" x={r.tx} y={r.ty} textAnchor={r.ancla} fontSize={12} fontWeight={r.fuerte ? 600 : 400} fill={r.fuerte ? 'var(--texto)' : 'var(--tenue)'}>
                {r.texto}
              </text>
            ))}
          </>
        ) : null}
        {g && g.tipo === 'BARRAS_SEMANALES' ? (
          <>
            {g.barras.map((b) => (
              <rect key={b.lunes} x={b.x1 + 1} y={b.y} width={Math.max(1, b.x2 - b.x1 - 2)} height={Math.max(0, b.base - b.y)} rx={2} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={1} />
            ))}
            {/* Una semana sin días con dato: una columna gris de todo el alto, que no se lee como una barra en cero. */}
            {g.vacias.map((b) => (
              <rect key={`v${b.lunes}`} className="grafico-base__semana-vacia" x={b.x1 + 1} y={0} width={Math.max(1, b.x2 - b.x1 - 2)} height={b.base} fill="var(--grafico-hueco)" fillOpacity={0.18} />
            ))}
          </>
        ) : null}
        {geometria.tipo === 'CINTA' ? <DibujoDeLaCinta g={geometria.g} escala={escala} /> : null}
        {fecha ? <line x1={xDe(fecha)} x2={xDe(fecha)} y1={0} y2={alto} stroke="var(--grafico-cursor)" strokeWidth={1} opacity={0.7} /> : null}
        {conTira && carril.tipo === 'PUNTOS' ? <TiraDeCobertura carril={carril} escala={escala} y={alto + SEPARACION_DE_LA_TIRA} color={color} /> : null}
      </g>
      {ultimo
        ? escala.marcas.map((m) => (
            <text key={`t${m.fecha}`} x={m.x} y={total - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {m.texto}
            </text>
          ))
        : null}
    </svg>
  );
}

export function PanelesAlineados({ titulo, periodo, carriles, bandas = [], densidad = 'COMPLETA', leyenda = [], notas = [], aclaraciones = [], detalle, comoLeerlo }: PropsDePanelesAlineados) {
  const [ref, ancho] = useAnchoDelGrafico();
  const conPuntero = useConPuntero();
  const cursor = useCursorDeFechas();
  const idDelResumen = useId();
  const escala = useMemo(() => escalaDeFechas(periodo, { izquierda: MARGEN_IZQUIERDO, derecha: ancho - MARGEN_DERECHO }), [periodo, ancho]);
  const fechas = useMemo(() => fechasConObservacion(carriles), [carriles]);
  const tabla = useMemo(() => tablaEquivalente(carriles), [carriles]);
  const conDatos = carriles.filter((c) => c.tipo !== 'EVENTOS');
  const alto = altoDelCarril(densidad, conDatos.length);
  const geometrias = useMemo(
    () => carriles.map((c): Geometria => (c.tipo === 'EVENTOS' ? { tipo: 'CINTA', g: geometriaDeLaCinta(c.eventos, escala) } : { tipo: 'CARRIL', g: geometriaDelCarril(c, escala, alto) })),
    [carriles, escala, alto],
  );
  const [encima, setEncima] = useState<string | null>(null);
  // El dibujo sigue al mouse (la regla); la región viva de la lectura, no: solo el clic, el toque y el teclado.
  const fecha = encima ?? cursor.fecha;
  const versiones = useMemo(() => versionesEnElEje(bandas, escala), [bandas, escala]);
  const cambios = cambiosEnTexto(versiones, periodo.hoy);
  const cambiosRecortados = cambiosQueNoEntran(versiones, periodo.hoy);

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
  const descripcion = [
    ...carriles.map((c) => (c.tipo === 'EVENTOS' ? `${c.nombre}: ${resumenDeLaCinta(c.eventos)}` : `${c.nombre} (${c.unidad}): ${c.descripcion}`)),
    ...(cambios.length > 0 ? [COPY_DE_LOS_GRAFICOS.cambiosDeLoIndicado(cambios)] : []),
  ].join(' ');
  const tarde = carriles.flatMap((c) => (c.tipo === 'PUNTOS' ? [lineaDeLoCargadoTarde(c)] : [])).filter((t): t is string => t !== null);
  const fueraDeLaEscala = geometrias.reduce((n, x) => n + (x.tipo === 'CARRIL' && x.g.tipo === 'PUNTOS' ? x.g.fueraDeLaEscala : 0), 0);
  const unSoloCarril = conDatos.length === 1;
  // Todas las notas se ven (revisión de #283): la frase fija (también con algo agregado) en su línea tenue, las demás
  // como notas; lo cargado después (§5.14) y lo que no entra en la escala (la muesca) también.
  const visiblesAbajo = notasALaVista({ notas, tarde, fueraDeLaEscala, cambiosRecortados });
  const visibles = sentidosQueSeVen(leyenda, carriles);
  const unidades = [...new Set(conDatos.map((c) => c.unidad))].join(' y ');
  const hasta = periodo.hasta >= periodo.hoy ? null : diaYMes(periodo.hasta, periodo.hoy);
  // Con un solo carril no se dibuja su renglón: el método va en la línea tenue, aunque el llamador pase la suya (§5.6).
  const metodo = unSoloCarril && conDatos[0]?.tipo === 'PUNTOS' ? conDatos[0].metodo : null;
  const lineaTenue = lineaTenueDelGrafico({
    detalle,
    porDefecto: [unidades, COPY_DE_LOS_GRAFICOS.periodo(diaYMes(inicioDelEje(periodo), periodo.hoy), hasta)].filter(Boolean).join(' · '),
    metodo,
  });

  return (
    <div className={`grafico-base grafico-base--${densidad.toLowerCase()}`}>
      <div className="grafico-base__cabecera">
        <h3 className="grafico-base__titulo">{titulo}</h3>
        <p className="grafico-base__detalle">{lineaTenue}</p>
      </div>
      <NotaDelInicio periodo={periodo} />
      <Leyenda sentidos={visibles} />
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
        {carriles.map((c, i) => {
          const geometria = geometrias[i] as Geometria;
          return (
            <div key={c.id} className="grafico-base__carril">
              {/* Con un solo carril, el título y la línea tenue ya dicen qué es: el nombre del carril no se repite. */}
              {unSoloCarril && c.tipo !== 'EVENTOS' ? null : (
                <p className="grafico-base__carril-nombre">
                  {c.nombre}
                  {c.tipo !== 'EVENTOS' ? <span className="grafico-base__unidad"> · {c.unidad}</span> : null}
                  {c.tipo === 'PUNTOS' && c.metodo ? <span className="grafico-base__metodo"> · {c.metodo}</span> : null}
                </p>
              )}
              <DibujoDelCarril
                carril={c}
                geometria={geometria}
                escala={escala}
                alto={geometria.tipo === 'CINTA' ? Math.max(geometria.g.alto, 1) : alto}
                bandas={c.tipo === 'EVENTOS' ? [] : bandas}
                fecha={fecha}
                tramo={cursor.tramo}
                primero={i === carriles.findIndex((x) => x.tipo !== 'EVENTOS')}
                ultimo={i === carriles.length - 1}
              />
            </div>
          );
        })}
      </div>
      <p id={idDelResumen} className="visualmente-oculto">
        {descripcion}
      </p>
      <LecturaEnLaFecha tabla={tabla} fecha={cursor.fecha} encima={encima} tramo={cursor.tramo} hoy={periodo.hoy} />
      {visiblesAbajo.map((n) =>
        esLaFraseFija(n) ? (
          <FraseDeLaCoincidencia key={n} texto={n} />
        ) : (
          <p key={n} className="nota grafico-base__nota">
            {n}
          </p>
        ),
      )}
      <div className="grafico-base__pie">
        <TablaEquivalente titulo={titulo} tabla={tabla} hoy={periodo.hoy} />
        <ComoLeerlo de={titulo}>
          {aclaraciones.map((n) => (
            <p key={n}>{n}</p>
          ))}
          {comoLeerlo}
          <p>{COPY_DE_LOS_GRAFICOS.comoSeUsa}</p>
        </ComoLeerlo>
      </div>
    </div>
  );
}
