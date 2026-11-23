'use client';

/**
 * RP-20 y RP-21 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Las franjas: cada opción de una comida frente al rango indicado de
 * su comida, un renglón por kcal, P, C y G. La lógica y los textos, en `franjas-por-comida.ts`.
 *
 * - **Una pista por renglón:** la banda del rango en el color de acento, un punto por opción (lleno adentro, hueco afuera)
 *   y una raya para el promedio. Lo que la escala no alcanza se fija al borde, con una flecha. A la derecha, en corto,
 *   «3 de 4 adentro · promedio 28 g P» (el lector de pantalla oye «opciones»).
 * - **Lo dibujado es para la vista** (`aria-hidden`): el lector de pantalla oye el texto entero, con cada opción.
 * - **Sin saltos (RP-D47):** cada renglón tiene su alto fijo, aparezcan o no sus marcas; una opción que se está leyendo
 *   queda donde estaba, punteada, hasta que llega su composición; mientras se leen los rangos, la franja guarda su lugar.
 * - **Cuatro formas, la misma pieza:** la comida (todas sus opciones), la opción abierta y su cuadro (una sola), el panel
 *   «Rangos y totales» (compacta, con lo que aportan las opciones) y la receta que se elige (una porción).
 * - **RP-23 (Dirección, 22/11: «se ven muy sucias»):** la comida y el panel dibujan la banda y la raya del promedio, y el
 *   punto de cada opción tildada, en su color (`elegidas`). La opción abierta, su cuadro y la receta, como estaban.
 *   Tildar no agrega nada que ocupe lugar: las marcas se superponen en la pista, que tiene su alto.
 */
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import { cifraDeLosLimites, ICONO_DEL_MACRO } from './abreviaturas-de-macros';
import { CantidadDelMacro } from './cantidad-del-macro';
import {
  COPY_FRANJAS,
  deCuantoACuanto,
  franjasEnPalabras,
  marcasALaVista,
  porcionEnElRenglon,
  rayaDelPromedio,
  RENGLONES_DE_LA_FRANJA,
  type BandaEnLaPista,
  type FranjaDelRenglon,
  type FranjasDeLaComida as Franjas,
  type RenglonDeLaFranja,
  type TramoDelDia,
  type VarianteDeLaFranja,
} from './franjas-por-comida';
import { COPY_RANGOS } from './rangos';

export type { VarianteDeLaFranja };

/** La letra de cada renglón, junto a su ícono. */
const LETRA: Readonly<Record<RenglonDeLaFranja, string>> = { kcal: 'kcal', protein: 'P', carbohydrate: 'C', fat: 'G' };
const UNIDAD: Readonly<Record<RenglonDeLaFranja, string>> = { kcal: 'kcal', protein: 'g', carbohydrate: 'g', fat: 'g' };

/** La posición de una marca (o el comienzo de una banda), de 0 a 100, como variable de CSS. */
const en = (desde: number, hasta?: number): CSSProperties => {
  const estilo: Record<string, number> = { '--en': desde };
  if (hasta !== undefined) estilo['--hasta'] = hasta;
  return estilo as CSSProperties;
};

/**
 * Las cuatro formas (`VarianteDeLaFranja`) están descritas en `franjas-por-comida.ts`. Con `elegidas` (RP-23, la comida y
 * el panel): la raya del promedio y solo los puntos de las opciones tildadas, en su color; `enLasBarras` es lo que oye el
 * lector de eso al final (`enLasBarrasEnPalabras`).
 */
export function FranjasDeLaComida({ franjas, comida, variante = 'comida', elegidas, enLasBarras }: { franjas: Franjas; comida: string; variante?: VarianteDeLaFranja; elegidas?: ReadonlySet<string>; enLasBarras?: string }) {
  // Dónde estaba la marca de cada opción, por renglón y por su identidad: una opción que se vuelve a leer no salta.
  const recordadas = useRef(new Map<string, number>());
  for (const r of franjas.renglones) for (const m of r.marcas) recordadas.current.set(`${r.renglon}|${m.clave}`, m.posicion);
  return (
    <div className="franjas" data-variante={variante} data-franjas={variante} data-sin-alimentos={franjas.sinAlimentos ? '' : undefined}>
      <p className="visualmente-oculto">{franjasEnPalabras(franjas, comida, variante, enLasBarras)}</p>
      <div className="franjas__renglones" aria-hidden="true">
        {franjas.renglones.map((r, i) => {
          const limites = r.limites ? `${cifraDeLosLimites(r.limites.min, r.limites.max)} ${UNIDAD[r.renglon]}` : 'sin rango';
          const porcion = variante === 'receta' ? porcionEnElRenglon(r) : null;
          const cifra = variante === 'panel' ? deCuantoACuanto(r) : null;
          const izquierda: ReactNode =
            variante === 'panel' ? <CifraConIcono macro={r.renglon} cifra={cifra} /> : porcion ? porcion.valor : limites;
          // Sin alimentos: una sola indicación, en el primer renglón; los demás muestran la banda, sin texto.
          const derecha = variante === 'panel' ? null : franjas.sinAlimentos ? (i === 0 ? (variante === 'opcion' ? COPY_FRANJAS.sinAlimentosLaOpcion : COPY_FRANJAS.sinAlimentos) : '') : porcion ? porcion.ubicacion : r.resumen;
          return (
            <div key={r.renglon} className="franja" data-renglon={r.renglon} data-sin-rango={r.limites ? undefined : ''}>
              <span className="franja__rotulo" title={r.renglon === 'kcal' && r.limites ? COPY_FRANJAS.kcalDeLosGramos : undefined}>
                {variante === 'panel' ? null : (
                  <>
                    <Icono nombre={ICONO_DEL_MACRO[r.renglon]} tamano={15} />
                    {LETRA[r.renglon]}
                  </>
                )}
              </span>
              <span className="franja__izquierda" title={variante === 'comida' || variante === 'opcion' ? `Rango indicado: ${limites}` : undefined}>
                {izquierda}
              </span>
              <Pista r={r} recordadas={recordadas.current} elegidas={elegidas} />
              {derecha === null ? null : (
                <span className="franja__derecha" title={derecha || undefined} data-resumen-de-la-franja={r.renglon}>
                  {derecha}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Mientras se leen los rangos indicados (RP-D47): los cuatro renglones, con su alto, sin banda ni marcas. */
export function FranjasQueSeLeen({ variante = 'comida' }: { variante?: VarianteDeLaFranja }) {
  return (
    <div className="franjas" data-variante={variante} data-franjas={variante} data-leyendo aria-hidden="true">
      <div className="franjas__renglones">
        {RENGLONES_DE_LA_FRANJA.map((r) => (
          <div key={r} className="franja" data-renglon={r}>
            <span className="franja__rotulo">
              <Icono nombre={ICONO_DEL_MACRO[r]} tamano={15} />
              {LETRA[r]}
            </span>
            <span className="franja__izquierda" />
            <span className="franja__pista" />
            <span className="franja__derecha" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Una cantidad con su ícono («[ícono] 520–700 kcal»); sin cifra, «Sin dato» (o «—»), sin la unidad. */
function CifraConIcono({ macro, cifra, sinDato = COPY_RANGOS.sinDato }: { macro: RenglonDeLaFranja; cifra: string | null; sinDato?: string }) {
  if (cifra !== null) return <CantidadDelMacro macro={macro} cifra={cifra} />;
  return (
    <span className="cantidad-del-macro" data-sin-dato>
      <Icono nombre={ICONO_DEL_MACRO[macro]} tamano={15} />
      {sinDato}
    </span>
  );
}

function Banda({ b }: { b: BandaEnLaPista }) {
  return <span className="franja__banda" data-sin-tope={b.sinTope ? '' : undefined} style={en(b.desde, b.hasta)} />;
}

/**
 * La pista de un renglón: la banda, una marca por opción y la del promedio. Con `elegidas` (RP-23): la raya del promedio
 * (con una sola opción, su valor) y solo las marcas tildadas, cada una con su color.
 */
function Pista({ r, recordadas, elegidas }: { r: FranjaDelRenglon; recordadas: ReadonlyMap<string, number>; elegidas?: ReadonlySet<string> }) {
  const raya = elegidas ? rayaDelPromedio(r) : r.promedio;
  const marcas = elegidas ? marcasALaVista(r, elegidas) : r.marcas;
  return (
    <span className="franja__pista" data-pista={r.renglon}>
      {r.banda ? <Banda b={r.banda} /> : null}
      {raya ? (
        <span
          className="franja__promedio"
          data-promedio
          data-adentro={raya.ubicacion.tipo === 'dentro' ? '' : undefined}
          data-fijada={raya.fijada ?? undefined}
          style={en(raya.posicion)}
          title={r.promedio ? COPY_FRANJAS.promedio : COPY_FRANJAS.laUnicaOpcion}
        />
      ) : null}
      {marcas.map((m) => (
        <span
          key={m.clave}
          className="franja__marca"
          data-marca={m.clave}
          data-color-de-la-opcion={elegidas && m.color !== null ? m.color : undefined}
          data-adentro={m.ubicacion.tipo === 'dentro' ? '' : undefined}
          data-afuera={m.ubicacion.tipo === 'dentro' ? undefined : m.ubicacion.tipo}
          data-fijada={m.fijada ?? undefined}
          style={en(m.posicion)}
          title={m.texto}
        />
      ))}
      {/* Lo que se está leyendo queda donde estaba, punteado; sin un lugar conocido no se dibuja (el resumen lo cuenta). */}
      {r.banda
        ? r.esperan.flatMap((e) => {
            if (elegidas && !elegidas.has(e.clave)) return [];
            const antes = recordadas.get(`${r.renglon}|${e.clave}`);
            return antes === undefined
              ? []
              : [<span key={`espera-${e.clave}`} className="franja__marca" data-marca={e.clave} data-espera={e.motivo} style={en(antes)} title={`${e.nombre}: ${e.motivo === 'leyendo' ? 'leyendo su composición' : 'se calcula cuando se guarda el plan'}`} />];
          })
        : null}
    </span>
  );
}

/**
 * RP-21: el día en el panel: lo que va según lo que se elija, con su tramo frente al rango del día si lo hay. Los cuatro
 * renglones están siempre: sin dato, «—» y la banda sola (el porqué lo dice el renglón de arriba, una vez).
 */
export function TramosDelDia({ tramos }: { tramos: readonly TramoDelDia[] }) {
  return (
    <div className="franjas" data-variante="panel" data-franjas="dia">
      <p className="visualmente-oculto">{tramos.map((t) => t.enPalabras).join('. ')}.</p>
      <div className="franjas__renglones" aria-hidden="true">
        {tramos.map((t) => (
          <div key={t.renglon} className="franja" data-renglon={t.renglon} data-sin-rango={t.limites ? undefined : ''}>
            <span className="franja__rotulo" />
            <span className="franja__izquierda">
              <CifraConIcono macro={t.renglon} cifra={t.cifra} sinDato="—" />
            </span>
            {/* RP-D84: sin dato, la pista vacía, con su alto: ni la banda sola ni un punto. */}
            <span className="franja__pista" data-pista={t.renglon} data-sin-dato={t.sinDato ? '' : undefined}>
              {t.banda ? <Banda b={t.banda} /> : null}
              {t.tramo ? (
                <span
                  className="franja__tramo"
                  data-adentro={t.tramo.minimo.tipo === 'dentro' && t.tramo.maximo.tipo === 'dentro' ? '' : undefined}
                  data-fijado={t.tramo.fijado ? '' : undefined}
                  style={en(t.tramo.desde, t.tramo.hasta)}
                  title={t.enPalabras}
                />
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
