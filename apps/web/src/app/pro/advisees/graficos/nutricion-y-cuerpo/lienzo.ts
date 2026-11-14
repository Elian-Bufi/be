/**
 * El lienzo de los gráficos de Nutrición y Antropometría (WP-GRAFICOS fase 2, rama C; DL-174): paneles sobre el eje de
 * fechas común, con las capas que estos gráficos necesitan y los paneles alineados de la base no dibujan (GR-T40):
 * - **las temporadas** (GR-11): las versiones del plan de fondo, una línea fina donde empieza cada versión del plan o del
 *   objetivo, y su rótulo corto arriba del primer panel («Plan v3», «Objetivo»);
 * - **varias series en un panel con un solo eje** (GR-20: la masa grasa según cada método), cada una con su forma;
 * - **las uniones**: lo indicado y lo registrado del mismo día (GR-14), o dos métodos de la misma toma (GR-20);
 * - **las medias de cada semana** (GR-12), en un tramo continuo corto, distinto del objetivo discontinuo;
 * - **la tira por comida** (GR-14): con la opción del plan, con una comida diferente o sin registro.
 *
 * Usa las piezas puras de la base (`extremosDelCarril`, la escala de fechas y su aire) y su gramática: un hueco no es
 * cero, la línea une solo marcas de la misma serie y del mismo tramo, y lo que no tiene tramo (Antropometría, lo
 * indicado) va suelto. Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import type { MarcaSemantica } from '@be/domain';
import { AIRE_DEL_CARRIL, extremosDelCarril, type EscalaDelCarril } from '../carriles';
import { textoDeLaMarca, type EscalaDeFechas } from '../eje-de-fechas';
import type { FilasDeLaTabla } from '../tabla-equivalente';

/** La forma de una serie cuando dos comparten un panel (GR-20): la marca dice el dato; la forma, de qué método es. */
export type FormaDeLaSerie = 'CIRCULO' | 'CUADRADO';

export interface MarcaDelPanel {
  readonly clave: string;
  /** La serie: las líneas unen solo marcas de la misma serie. */
  readonly serie: string;
  readonly fecha: string;
  /** La hora del hecho, si la tiene: dos tomas del mismo día no se pisan. */
  readonly en: string | null;
  readonly valor: number;
  readonly marca: MarcaSemantica;
  readonly forma: FormaDeLaSerie;
  /** El color de la serie (`--metrica-1` a `--metrica-3`, de 0 a 2), o `null` para lo indicado (`--grafico-indicado`). */
  readonly color: number | null;
  readonly tarde: boolean;
  /** Se une con la marca anterior de su serie solo si comparten tramo; `null`: va suelta. */
  readonly tramo: string | null;
}

/** Un segmento vertical en una fecha: lo indicado y lo registrado del día (GR-14) o dos métodos de una toma (GR-20). */
export interface UnionDelPanel {
  readonly clave: string;
  readonly fecha: string;
  readonly en: string | null;
  readonly desde: number;
  readonly hasta: number;
  /** «+18 g»: va en el dibujo si hay lugar; la lectura y la tabla lo dicen siempre. */
  readonly rotulo: string | null;
  readonly forma: 'DIFERENCIA' | 'SEPARACION';
}

/** Un valor que rige de una fecha a otra: el objetivo (discontinuo) o la media de una semana (continuo y corto). */
export interface TramoDelPanel {
  readonly clave: string;
  readonly desde: string;
  readonly hasta: string;
  readonly valor: number;
  readonly color: number;
}

export interface PanelDeValores {
  readonly tipo: 'VALORES';
  readonly id: string;
  /** «Calorías registradas». */
  readonly nombre: string;
  readonly unidad: string;
  /** «Suma de lo registrado con cantidades (v1)». */
  readonly metodo: string | null;
  readonly escala: EscalaDelCarril;
  readonly marcas: readonly MarcaDelPanel[];
  readonly uniones: readonly UnionDelPanel[];
  /** El objetivo del profesional, en escalón discontinuo (una proporción de las calorías no está acá: no se dibuja). */
  readonly escalones: readonly TramoDelPanel[];
  /** La media de cada semana, en un tramo continuo corto. */
  readonly medias: readonly TramoDelPanel[];
}

/** Cómo quedó una comida del plan en un día con registros (API-NUT-17): cada una en un solo estado. */
export type EstadoDeLaComida = 'CON_OPCION' | 'COMIDA_DIFERENTE' | 'SIN_REGISTRO';

export interface FilaDeLaTira {
  readonly clave: string;
  /** El nombre de la comida del plan: «Desayuno». */
  readonly nombre: string;
  readonly celdas: readonly { readonly fecha: string; readonly estado: EstadoDeLaComida }[];
}

/** La tira por comida (GR-14): una fila por comida del plan, una celda por día con registros y comidas conocidas. */
export interface PanelDeTira {
  readonly tipo: 'TIRA';
  readonly id: string;
  readonly nombre: string;
  readonly filas: readonly FilaDeLaTira[];
}

export type PanelDelLienzo = PanelDeValores | PanelDeTira;

/** Una temporada (GR-11): una versión del plan (de fondo) o del objetivo, con una línea fina donde empieza. */
export interface TemporadaDelLienzo {
  readonly clave: string;
  readonly tipo: 'PLAN' | 'OBJETIVO';
  readonly desde: string;
  readonly hasta: string | null;
  /** «Plan v3 · desde el 2/9»: el texto entero, en la lista de temporadas. */
  readonly rotulo: string;
  /** «Plan v3»: lo que entra arriba del dibujo, si hay lugar. */
  readonly corto: string;
}

/** Lo que muestra cada renglón de la leyenda: la forma dice el estado además del color. */
export type MuestraDeLaLeyenda =
  | { readonly tipo: 'MARCA'; readonly marca: MarcaSemantica; readonly forma: FormaDeLaSerie; readonly color: number | null }
  | { readonly tipo: 'ESCALON'; readonly color: number }
  | { readonly tipo: 'MEDIA'; readonly color: number }
  | { readonly tipo: 'UNION'; readonly forma: UnionDelPanel['forma'] }
  | { readonly tipo: 'COMIDA'; readonly estado: EstadoDeLaComida }
  | { readonly tipo: 'TEMPORADA' }
  | { readonly tipo: 'TARDE' };

export interface ElementoDeLaLeyenda {
  readonly clave: string;
  readonly texto: string;
  readonly muestra: MuestraDeLaLeyenda;
}

/** Un gráfico armado, listo para el lienzo: lo que dibuja, lo que dice la tabla (y la lectura) y su texto. */
export interface GraficoArmado {
  readonly paneles: readonly PanelDelLienzo[];
  readonly temporadas: readonly TemporadaDelLienzo[];
  readonly tabla: FilasDeLaTabla;
  /** El resumen en texto, para el lector de pantalla. */
  readonly descripcion: string;
  readonly leyenda: readonly ElementoDeLaLeyenda[];
  readonly notas: readonly string[];
}

/** Los tramos sin registros de una lectura, recortados al período y dichos como texto («del 3/11 al 7/11, sin registros»). */
export function huecosEnTexto(huecos: readonly { readonly from: string; readonly to: string }[], desde: string, hasta: string): string[] {
  return huecos.flatMap((h) => {
    const inicio = h.from < desde ? desde : h.from;
    const fin = h.to > hasta ? hasta : h.to;
    if (inicio > fin) return [];
    return [inicio === fin ? `el ${textoDeLaMarca(inicio)}, sin registros` : `del ${textoDeLaMarca(inicio)} al ${textoDeLaMarca(fin)}, sin registros`];
  });
}

// ─── La geometría ───────────────────────────────────────────────────────────────────────────────

export interface PuntoUbicado {
  readonly x: number;
  readonly y: number;
}

export interface GeometriaDeValores {
  readonly extremos: { readonly abajo: number; readonly arriba: number; readonly decimales: number };
  readonly marcasY: readonly { readonly valor: number; readonly y: number }[];
  readonly marcas: readonly (MarcaDelPanel & PuntoUbicado)[];
  readonly lineas: readonly { readonly serie: string; readonly color: number | null; readonly puntos: readonly PuntoUbicado[] }[];
  readonly uniones: readonly { readonly clave: string; readonly x: number; readonly y1: number; readonly y2: number; readonly rotulo: string | null; readonly forma: UnionDelPanel['forma'] }[];
  readonly escalones: readonly { readonly clave: string; readonly x1: number; readonly x2: number; readonly y: number; readonly color: number }[];
  readonly medias: readonly { readonly clave: string; readonly x1: number; readonly x2: number; readonly y: number; readonly color: number }[];
}

const dentro = (fecha: string, e: Pick<EscalaDeFechas, 'desde' | 'hasta'>): boolean => fecha >= e.desde && fecha <= e.hasta;

/**
 * La geometría de un panel de valores en una caja de `alto` píxeles. Lo anterior al vínculo y lo de fuera del período no
 * se dibuja (TB-16). El eje vertical abarca todo lo que se dibuja en el panel (las marcas, las uniones, el objetivo y las
 * medias): dos series del mismo panel comparten el eje, que es lo que pide GR-20 (uno por método agrandaría cualquier
 * diferencia chica).
 */
export function geometriaDeValores(p: PanelDeValores, escala: EscalaDeFechas, alto: number): GeometriaDeValores {
  const marcas = p.marcas.filter((m) => dentro(m.fecha, escala) && Number.isFinite(m.valor));
  const uniones = p.uniones.filter((u) => dentro(u.fecha, escala) && Number.isFinite(u.desde) && Number.isFinite(u.hasta));
  const recortar = (t: TramoDelPanel): TramoDelPanel => ({ ...t, desde: t.desde < escala.desde ? escala.desde : t.desde, hasta: t.hasta > escala.hasta ? escala.hasta : t.hasta });
  const escalones = p.escalones.map(recortar).filter((t) => t.desde <= t.hasta);
  const medias = p.medias.map(recortar).filter((t) => t.desde <= t.hasta);
  const valores = [...marcas.map((m) => m.valor), ...uniones.flatMap((u) => [u.desde, u.hasta]), ...escalones.map((t) => t.valor), ...medias.map((t) => t.valor)];
  const extremos = extremosDelCarril(valores, p.unidad, p.escala);
  const util = Math.max(1, alto - 2 * AIRE_DEL_CARRIL);
  const y = (v: number): number => AIRE_DEL_CARRIL + util - ((v - extremos.abajo) / (extremos.arriba - extremos.abajo || 1)) * util;
  const xDe = (fecha: string, en: string | null): number => escala.xDePunto({ fecha, hasta: null, en });
  const ubicadas = marcas.map((m) => ({ ...m, x: xDe(m.fecha, m.en), y: y(m.valor) }));
  const lineas: { serie: string; color: number | null; puntos: PuntoUbicado[] }[] = [];
  const series = [...new Set(ubicadas.map((m) => m.serie))];
  for (const serie of series) {
    const deLaSerie = ubicadas.filter((m) => m.serie === serie).sort((a, b) => a.x - b.x);
    let actual: (typeof deLaSerie)[number][] = [];
    const cerrar = () => {
      if (actual.length > 1) lineas.push({ serie, color: actual[0]!.color, puntos: actual.map((m) => ({ x: m.x, y: m.y })) });
      actual = [];
    };
    for (const m of deLaSerie) {
      const anterior = actual[actual.length - 1];
      if (m.tramo === null || (anterior && anterior.tramo !== m.tramo)) cerrar();
      if (m.tramo !== null) actual.push(m);
    }
    cerrar();
  }
  const horizontal = (t: TramoDelPanel) => ({ clave: t.clave, x1: escala.x(t.desde) - escala.porDia / 2, x2: escala.x(t.hasta) + escala.porDia / 2, y: y(t.valor), color: t.color });
  const paso = (extremos.arriba - extremos.abajo) / 2;
  return {
    extremos,
    marcasY: [extremos.abajo, extremos.abajo + paso, extremos.arriba].map((valor) => ({ valor, y: y(valor) })),
    marcas: ubicadas,
    lineas,
    uniones: uniones.map((u) => ({ clave: u.clave, x: xDe(u.fecha, u.en), y1: y(u.desde), y2: y(u.hasta), rotulo: u.rotulo, forma: u.forma })),
    escalones: escalones.map(horizontal),
    medias: medias.map(horizontal),
  };
}

/** El alto de cada fila de la tira por comida. */
export const ALTO_DE_LA_FILA_DE_LA_TIRA = 16;

export interface GeometriaDeTira {
  readonly alto: number;
  readonly filas: readonly {
    readonly clave: string;
    readonly nombre: string;
    readonly y: number;
    readonly celdas: readonly { readonly fecha: string; readonly estado: EstadoDeLaComida; readonly x: number; readonly ancho: number }[];
  }[];
}

/** La tira por comida: cada celda centrada en su día, con un ancho que no pisa la del día siguiente. */
export function geometriaDeTira(p: PanelDeTira, escala: EscalaDeFechas): GeometriaDeTira {
  const ancho = Math.max(3, Math.min(escala.porDia - 2, 12));
  return {
    alto: p.filas.length * ALTO_DE_LA_FILA_DE_LA_TIRA + 4,
    filas: p.filas.map((f, i) => ({
      clave: f.clave,
      nombre: f.nombre,
      y: 2 + i * ALTO_DE_LA_FILA_DE_LA_TIRA + ALTO_DE_LA_FILA_DE_LA_TIRA / 2,
      celdas: f.celdas.filter((c) => dentro(c.fecha, escala)).map((c) => ({ fecha: c.fecha, estado: c.estado, x: escala.x(c.fecha), ancho })),
    })),
  };
}

/** Lo que ocupa una letra de 12,5 px, de promedio, para que dos rótulos de temporada no se pisen. */
const ANCHO_DE_UNA_LETRA = 7;

export interface TemporadaUbicada extends TemporadaDelLienzo {
  /** De dónde a dónde va su banda (el día entero de cada borde). */
  readonly x1: number;
  readonly x2: number;
  /** Las bandas del plan se alternan: 0 lleva el tono de fondo, 1 no. Las del objetivo no tienen banda. */
  readonly banda: 0 | 1 | null;
  /** Empieza adentro del período: lleva la línea fina del cambio. */
  readonly conCambio: boolean;
  /** Entra su rótulo corto sin pisar el anterior. */
  readonly conRotulo: boolean;
}

/**
 * Las temporadas que tocan el período, ubicadas: las bandas del plan alternadas, la línea de cada cambio que cae adentro y
 * los rótulos que entran sin pisarse (los que no entran están en la lista de temporadas, en texto).
 */
export function temporadasUbicadas(temporadas: readonly TemporadaDelLienzo[], escala: EscalaDeFechas): TemporadaUbicada[] {
  const visibles = temporadas.filter((t) => t.desde <= escala.hasta && (t.hasta === null || t.hasta >= escala.desde)).sort((a, b) => a.desde.localeCompare(b.desde) || (a.tipo === b.tipo ? 0 : a.tipo === 'PLAN' ? -1 : 1));
  let bandas = 0;
  let finDelUltimoRotulo = -Infinity;
  return visibles.map((t) => {
    const x1 = escala.x(t.desde < escala.desde ? escala.desde : t.desde) - escala.porDia / 2;
    const x2 = escala.x(t.hasta === null || t.hasta > escala.hasta ? escala.hasta : t.hasta) + escala.porDia / 2;
    const banda = t.tipo === 'PLAN' ? ((bandas++ % 2) as 0 | 1) : null;
    const inicioDelRotulo = Math.max(x1, escala.izquierda) + 3;
    const conRotulo = inicioDelRotulo >= finDelUltimoRotulo + 8 && inicioDelRotulo + t.corto.length * ANCHO_DE_UNA_LETRA <= escala.derecha + 8;
    if (conRotulo) finDelUltimoRotulo = inicioDelRotulo + t.corto.length * ANCHO_DE_UNA_LETRA;
    return { ...t, x1, x2, banda, conCambio: t.desde > escala.desde, conRotulo };
  });
}

/** El mismo día y mes de la base («3/11»), para los rótulos de las temporadas. */
export const diaYMes = (fecha: string): string => `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;
