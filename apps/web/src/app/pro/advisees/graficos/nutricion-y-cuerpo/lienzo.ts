/**
 * El lienzo de los gráficos de Nutrición y Antropometría (WP-GRAFICOS fase 2, rama C; DL-174): paneles sobre el eje de
 * fechas común, con las capas que estos gráficos necesitan y los paneles alineados de la base no dibujan (GR-T40):
 * - **las temporadas** (GR-11): las versiones del plan de fondo, una línea fina donde empieza cada versión del plan o del
 *   objetivo, y su rótulo arriba del primer panel («Plan v3 · desde el 2/9» si entra; si no, «Plan v3»);
 * - **varias series en un panel con un solo eje** (GR-20: la masa grasa según cada método), cada una con su forma;
 * - **las uniones**: lo indicado y lo registrado del mismo día (GR-14), o dos métodos de la misma toma (GR-20);
 * - **por semana** (GR-12, GR-13 y GR-14; GR-VC01): una barra por semana con la media de los días que entran (GR-T42),
 *   los días como puntos tenues detrás y la tira de cobertura de cada día; una semana sin media es una columna gris;
 * - **la tira por comida** (GR-14): con la opción del plan, con una comida diferente o sin registro.
 *
 * La pasada visual de la rama C (15/11; DISENO-VISUAL §1 y §2 «C»; WP-GRAFICOS §13.4) le pone el lenguaje de la base:
 * el eje vertical con 3 a 5 marcas redondas y su grilla tenue (`extremosDelCarril`, sin un número repetido), un número
 * solo en el elegido, el último y, si suma, el mínimo y el máximo, sin pisarse (`rotulosDelPanel`), las versiones con un
 * tono tenue que alterna y la leyenda como fichas cortas, con su texto entero para el lector de pantalla. §5 manda sobre
 * la guía: lo que §5 pide a la vista va en `notas`; a «Cómo leerlo», solo `aclaraciones`.
 *
 * Usa las piezas puras de la base (`extremosDelCarril`, la escala de fechas, `rotulosDeLoLleno` y `rotulosSinPisarse`) y
 * su gramática: un hueco no es cero, la línea une solo marcas de la misma serie y del mismo tramo, y lo que no tiene
 * tramo (Antropometría, lo indicado) va suelto. Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import type { MarcaSemantica } from '@be/domain';
import { AIRE_DEL_CARRIL, extremosDelCarril, type EscalaDelCarril } from '../carriles';
import { textoDeLaMarca, type EscalaDeFechas } from '../eje-de-fechas';
import { rotulosDeLoLleno, rotulosSinPisarse, type MarcasDelEje, type RotuloCandidato, type RotuloUbicado } from '../ejes';
import { convienePorSemana } from '../semanas';
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
  /** «+18 g»: va en el dibujo solo en la fecha elegida y en la última (sin pisarse); la lectura y la tabla lo dicen siempre. */
  readonly rotulo: string | null;
  readonly forma: 'DIFERENCIA' | 'SEPARACION';
}

/** Un valor que rige de una fecha a otra: el objetivo del profesional, en escalón discontinuo. */
export interface TramoDelPanel {
  readonly clave: string;
  readonly desde: string;
  readonly hasta: string;
  readonly valor: number;
  readonly color: number;
}

/**
 * La media de una semana (GR-T42), para «Por semana»: el tramo de la semana que cae en el período, su media (o `null`: no
 * alcanza, y va una columna gris, nunca una barra en cero) y lo que dice con sus días.
 */
export interface SemanaDelPanel {
  readonly clave: string;
  readonly desde: string;
  readonly hasta: string;
  readonly valor: number | null;
  /** Los siete días entran en la media (sin subtotales, sin días sin saber si faltan comidas y sin hoy): la barra va llena. */
  readonly entera: boolean;
  /** «2.050 kcal por día de media · con 4 de 7 días; 1 sin registro…». */
  readonly texto: string;
  /**
   * Algún día de la semana (sin hoy) tiene un valor: sin media, no es un hueco, es una semana que no alcanza (un contorno
   * cortado de todo el alto); sin ningún día con valor, sí es un hueco (la columna gris de la base).
   */
  readonly conDias: boolean;
}

/** El estado de un día en la tira de cobertura de «Por semana»: con todo, con algo que falta, sin registros u hoy. */
export type EstadoDelDiaEnLaTira = 'con' | 'hueco' | 'sin' | 'hoy';

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
  /** La media de cada semana, para «Por semana»; vacío si el panel va solo día por día. */
  readonly semanas: readonly SemanaDelPanel[];
  /** Cada día del período, para la tira de cobertura de «Por semana». */
  readonly cobertura: readonly { readonly fecha: string; readonly estado: EstadoDelDiaEnLaTira }[];
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
  /** «Plan v3 · desde el 2/9»: el texto entero, en el dibujo si entra, en la descripción y en «Cómo leerlo». */
  readonly rotulo: string;
  /** «Plan v3»: lo que entra arriba del dibujo si el entero no entra. */
  readonly corto: string;
}

/** Lo que muestra cada ficha de la leyenda: la forma dice el estado además del color. */
export type MuestraDeLaLeyenda =
  | { readonly tipo: 'MARCA'; readonly marca: MarcaSemantica; readonly forma: FormaDeLaSerie; readonly color: number | null }
  | { readonly tipo: 'ESCALON'; readonly color: number }
  | { readonly tipo: 'UNION'; readonly forma: UnionDelPanel['forma'] }
  | { readonly tipo: 'COMIDA'; readonly estado: EstadoDeLaComida }
  | { readonly tipo: 'TEMPORADA' }
  | { readonly tipo: 'TARDE' }
  | { readonly tipo: 'SEMANA'; readonly forma: 'ENTERA' | 'HUECA' | 'SIN_MEDIA' | 'SIN_DIAS'; readonly color: number }
  | { readonly tipo: 'DIA_TENUE'; readonly color: number }
  | { readonly tipo: 'COBERTURA'; readonly color: number };

export interface ElementoDeLaLeyenda {
  readonly clave: string;
  /** La ficha corta, a la vista: «Subtotal». */
  readonly texto: string;
  /** Lo que oye el lector de pantalla, entero, con la forma: «Subtotal, con algo que falta: hueco». */
  readonly largo: string;
  readonly muestra: MuestraDeLaLeyenda;
}

/** Una fila de la tabla de las semanas: el tramo y lo que dice cada panel de esa semana. */
export interface TramoDeLasSemanas {
  readonly lunes: string;
  readonly desde: string;
  readonly hasta: string;
  /** Uno por columna de `PorSemanaDelGrafico.columnas`. */
  readonly textos: readonly string[];
  /** Algún panel tiene media esta semana: la lectura de entrada es la última así. */
  readonly conMedia: boolean;
}

/** «Por semana» de un gráfico (GR-VC01): lo que dibuja cada panel está en `PanelDeValores.semanas`; acá, lo que se lee. */
export interface PorSemanaDelGrafico {
  /** La línea tenue en «Por semana»: «media de la semana (v1)». */
  readonly detalle: string;
  readonly leyenda: readonly ElementoDeLaLeyenda[];
  /** El resumen para el lector de pantalla, sin primero contra último. */
  readonly descripcion: string;
  readonly columnas: readonly { readonly id: string; readonly nombre: string; readonly unidad: string }[];
  readonly tramos: readonly TramoDeLasSemanas[];
  /** Lo que «Cómo leerlo» suma en «Por semana»: cómo se arma cada barra. */
  readonly aclaraciones: readonly string[];
}

/** Un gráfico armado, listo para el lienzo: lo que dibuja, lo que dice la tabla (y la lectura) y su texto. */
export interface GraficoArmado {
  readonly paneles: readonly PanelDelLienzo[];
  readonly temporadas: readonly TemporadaDelLienzo[];
  readonly tabla: FilasDeLaTabla;
  /** El resumen en texto, para el lector de pantalla. */
  readonly descripcion: string;
  readonly leyenda: readonly ElementoDeLaLeyenda[];
  /**
   * Lo que se ve debajo del gráfico (§5 manda sobre la guía visual): lo cargado después (§5.14), lo de otro profesional,
   * lo que no se dibuja (una proporción del objetivo), el error de medición (§5.7), los pesos usados en los g/kg.
   */
  readonly notas: readonly string[];
  /** Lo que aclara, en «Cómo leerlo» (cerrado): el método entero, por qué un hueco no es cero, la fuente. */
  readonly aclaraciones: readonly string[];
  /** El método, para la línea tenue de debajo del título (§5.6: a la vista). `null` si no hay un cálculo. */
  readonly metodo: string | null;
  /** «Por semana», si el gráfico lo tiene; `null` si va solo día por día (los g/kg, Antropometría). */
  readonly porSemana: PorSemanaDelGrafico | null;
  /** Va como tabla a la vista, no como dibujo (GR-20 con menos de 4 tomas: dos puntos parecen estables o un salto). */
  readonly comoTabla: boolean;
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

/** Cómo se agrupa un gráfico de Nutrición: por semana (de entrada con más de seis semanas) o día por día. */
export type ModoDelLienzo = 'SEMANA' | 'DIA';

export interface GeometriaDeValores {
  /** De 3 a 5 marcas redondas, con los extremos en la primera y la última (la regla de la base: ningún número repetido). */
  readonly extremos: MarcasDelEje;
  readonly marcasY: readonly { readonly valor: number; readonly y: number }[];
  readonly marcas: readonly (MarcaDelPanel & PuntoUbicado)[];
  readonly lineas: readonly { readonly serie: string; readonly color: number | null; readonly puntos: readonly PuntoUbicado[] }[];
  readonly uniones: readonly { readonly clave: string; readonly fecha: string; readonly x: number; readonly y1: number; readonly y2: number; readonly rotulo: string | null; readonly forma: UnionDelPanel['forma'] }[];
  readonly escalones: readonly { readonly clave: string; readonly x1: number; readonly x2: number; readonly y: number; readonly color: number }[];
  /** «Por semana»: una barra por semana con media, desde cero (`y` es su tope). */
  readonly barras: readonly { readonly clave: string; readonly desde: string; readonly hasta: string; readonly x1: number; readonly x2: number; readonly y: number; readonly base: number; readonly entera: boolean; readonly valor: number }[];
  /** «Por semana»: las semanas sin ningún día con valor, una columna gris de todo el alto (nunca una barra en cero). */
  readonly vacias: readonly { readonly clave: string; readonly desde: string; readonly hasta: string; readonly x1: number; readonly x2: number }[];
  /** «Por semana»: las semanas con días pero sin media (no alcanzan): un contorno cortado de todo el alto, sin relleno. */
  readonly sinMedia: readonly { readonly clave: string; readonly desde: string; readonly hasta: string; readonly x1: number; readonly x2: number }[];
}

const dentro = (fecha: string, e: Pick<EscalaDeFechas, 'desde' | 'hasta'>): boolean => fecha >= e.desde && fecha <= e.hasta;

/**
 * La geometría de un panel de valores en una caja de `alto` píxeles. Lo anterior al vínculo y lo de fuera del período no
 * se dibuja (TB-16). El eje vertical abarca todo lo que se dibuja en el panel (las marcas, las uniones, el objetivo y, por
 * semana, las medias): dos series del mismo panel comparten el eje, que es lo que pide GR-20 (uno por método agrandaría
 * cualquier diferencia chica). «Por semana», las barras arrancan en cero, como las de la base, y los días van detrás sin
 * líneas ni uniones.
 */
export function geometriaDeValores(p: PanelDeValores, escala: EscalaDeFechas, alto: number, modo: ModoDelLienzo = 'DIA'): GeometriaDeValores {
  const semanal = modo === 'SEMANA' && p.semanas.length > 0;
  const marcas = p.marcas.filter((m) => dentro(m.fecha, escala) && Number.isFinite(m.valor));
  const uniones = semanal ? [] : p.uniones.filter((u) => dentro(u.fecha, escala) && Number.isFinite(u.desde) && Number.isFinite(u.hasta));
  const recortar = (t: { readonly desde: string; readonly hasta: string }) => ({ desde: t.desde < escala.desde ? escala.desde : t.desde, hasta: t.hasta > escala.hasta ? escala.hasta : t.hasta });
  const escalones = p.escalones.map((t) => ({ ...t, ...recortar(t) })).filter((t) => t.desde <= t.hasta);
  const semanas = semanal ? p.semanas.map((s) => ({ ...s, ...recortar(s) })).filter((s) => s.desde <= s.hasta) : [];
  const valores = [
    ...marcas.map((m) => m.valor),
    ...uniones.flatMap((u) => [u.desde, u.hasta]),
    ...escalones.map((t) => t.valor),
    ...semanas.flatMap((s) => (s.valor === null ? [] : [s.valor])),
    ...(semanal ? [0] : []),
  ];
  const extremos = extremosDelCarril(valores, p.unidad, semanal ? { ...p.escala, desdeCero: true } : p.escala);
  const util = Math.max(1, alto - 2 * AIRE_DEL_CARRIL);
  const y = (v: number): number => AIRE_DEL_CARRIL + util - ((v - extremos.abajo) / (extremos.arriba - extremos.abajo || 1)) * util;
  const xDe = (fecha: string, en: string | null): number => escala.xDePunto({ fecha, hasta: null, en });
  const ubicadas = marcas.map((m) => ({ ...m, x: xDe(m.fecha, m.en), y: y(m.valor) }));
  const lineas: { serie: string; color: number | null; puntos: PuntoUbicado[] }[] = [];
  for (const serie of semanal ? [] : [...new Set(ubicadas.map((m) => m.serie))]) {
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
  const horizontal = (t: { readonly desde: string; readonly hasta: string }) => ({ x1: escala.x(t.desde) - escala.porDia / 2, x2: escala.x(t.hasta) + escala.porDia / 2 });
  // Una columna por semana, con un píxel de aire a cada lado para que dos semanas seguidas no se peguen.
  const columna = (t: { readonly desde: string; readonly hasta: string }) => {
    const h = horizontal(t);
    return { x1: h.x1 + 1, x2: Math.max(h.x1 + 2, h.x2 - 1) };
  };
  const base = y(Math.max(0, extremos.abajo));
  return {
    extremos,
    marcasY: extremos.valores.map((valor) => ({ valor, y: y(valor) })),
    marcas: ubicadas,
    lineas,
    uniones: uniones.map((u) => ({ clave: u.clave, fecha: u.fecha, x: xDe(u.fecha, u.en), y1: y(u.desde), y2: y(u.hasta), rotulo: u.rotulo, forma: u.forma })),
    escalones: escalones.map((t) => ({ clave: t.clave, ...horizontal(t), y: y(t.valor), color: t.color })),
    barras: semanas.flatMap((s) => (s.valor === null ? [] : [{ clave: s.clave, desde: s.desde, hasta: s.hasta, ...columna(s), y: y(s.valor), base, entera: s.entera, valor: s.valor }])),
    vacias: semanas.filter((s) => s.valor === null && !s.conDias).map((s) => ({ clave: s.clave, desde: s.desde, hasta: s.hasta, ...columna(s) })),
    sinMedia: semanas.filter((s) => s.valor === null && s.conDias).map((s) => ({ clave: s.clave, desde: s.desde, hasta: s.hasta, ...columna(s) })),
  };
}

/** Un número de un rótulo, como lo escribe la lectura: las kcal enteras («2.461»), lo demás con hasta un decimal («160,5»). */
export const valorDelRotuloEn = (v: number, decimales = 1): string => v.toLocaleString('es-AR', { maximumFractionDigits: decimales });

/**
 * Los números que se escriben en el dibujo de un panel (DISENO-VISUAL §1, principio 3; GR-VC03): nunca uno en cada punto.
 * - **Día por día:** con una sola serie, el elegido, el último y, con 4 o más llenos, el mínimo y el máximo de lo
 *   registrado lleno (`rotulosDeLoLleno`: un subtotal no se rotula como el extremo, y un número ya escrito no se repite).
 *   Con dos series (los dos métodos de GR-20), el elegido y el último de cada una, sin extremos: el máximo de dos métodos
 *   juntos no ubica nada. La diferencia de una unión («+18 g»), solo en la fecha elegida y en la última.
 * - **Por semana:** la media de la semana elegida o, sin elegir, la de la última con media.
 * Lo indicado no lleva número: lo dicen la lectura y la tabla. Dos rótulos nunca se pisan, ni pisan un número del eje.
 * `fuerte`: el elegido, el último y la diferencia van marcados; el mínimo y el máximo, discretos (como en la base).
 */
export function rotulosDelPanel(
  g: GeometriaDeValores,
  escala: Pick<EscalaDeFechas, 'izquierda' | 'derecha'>,
  alto: number,
  fecha: string | null,
  modo: ModoDelLienzo,
  margenDerecho: number,
  decimales = 1,
): (RotuloUbicado & { readonly fuerte: boolean })[] {
  const valorDelRotulo = (v: number) => valorDelRotuloEn(v, decimales);
  const caja = { izquierda: escala.izquierda, derecha: escala.derecha + margenDerecho - 2, arriba: 0, abajo: alto };
  const ejeY = g.marcasY.map((m) => ({ x1: 0, x2: escala.izquierda - 4, y1: m.y - 8, y2: m.y + 8 }));
  if (modo === 'SEMANA' && (g.barras.length > 0 || g.vacias.length > 0 || g.sinMedia.length > 0)) {
    const elegida = fecha === null ? null : (g.barras.find((b) => fecha >= b.desde && fecha <= b.hasta) ?? null);
    const sinElegir = fecha === null || (elegida === null && ![...g.vacias, ...g.sinMedia].some((v) => fecha >= v.desde && fecha <= v.hasta));
    const barra = elegida ?? (sinElegir ? (g.barras[g.barras.length - 1] ?? null) : null);
    return barra ? rotulosSinPisarse([{ clave: barra.clave, x: (barra.x1 + barra.x2) / 2, y: barra.y, texto: valorDelRotulo(barra.valor) }], caja, ejeY).map((r) => ({ ...r, fuerte: true })) : [];
  }
  const registradas = g.marcas.filter((m) => m.color !== null).sort((a, b) => a.x - b.x);
  const series = [...new Set(registradas.map((m) => m.serie))];
  const candidatos: RotuloCandidato[] = [];
  const unionDe = (f: string | null) => (f === null ? undefined : g.uniones.find((u) => u.fecha === f && u.rotulo !== null));
  const comoRotulo = (u: GeometriaDeValores['uniones'][number]): RotuloCandidato => ({ clave: `u:${u.clave}`, x: u.x + 4 + ((u.rotulo ?? '').length * 7) / 2, y: (u.y1 + u.y2) / 2 + 4, texto: u.rotulo ?? '' });
  const elegidaUnion = unionDe(fecha);
  const discretos = new Set<string>();
  if (series.length <= 1) {
    const elegida = fecha === null ? null : (registradas.find((m) => m.fecha === fecha)?.clave ?? null);
    const { claves, minimo } = rotulosDeLoLleno(registradas, elegida);
    const ultima = registradas[registradas.length - 1]?.clave ?? null;
    for (const c of claves) {
      const m = registradas.find((x) => x.clave === c);
      if (m) candidatos.push({ clave: m.clave, x: m.x, y: m.y, texto: valorDelRotulo(m.valor), abajo: c === minimo && c !== ultima });
      if (m && c !== elegida && c !== ultima) discretos.add(c);
      // La diferencia del día elegido va enseguida de su valor; la del último día, enseguida del último.
      if (m && elegidaUnion && m.fecha === fecha) candidatos.push(comoRotulo(elegidaUnion));
    }
    const ultimaUnion = [...g.uniones].filter((u) => u.rotulo !== null).sort((a, b) => a.x - b.x).pop();
    if (ultimaUnion) candidatos.push(comoRotulo(ultimaUnion));
  } else {
    for (const serie of series) {
      const deLaSerie = registradas.filter((m) => m.serie === serie);
      const elegida = fecha === null ? undefined : deLaSerie.find((m) => m.fecha === fecha);
      for (const m of [elegida, deLaSerie[deLaSerie.length - 1]]) if (m) candidatos.push({ clave: m.clave, x: m.x, y: m.y, texto: valorDelRotulo(m.valor) });
    }
  }
  return rotulosSinPisarse(candidatos, caja, ejeY).map((r) => ({ ...r, fuerte: !discretos.has(r.clave) }));
}

/** El alto de cada fila de la tira por comida: el nombre de la comida arriba y sus celdas debajo. */
export const ALTO_DE_LA_FILA_DE_LA_TIRA = 30;

export interface GeometriaDeTira {
  readonly alto: number;
  readonly filas: readonly {
    readonly clave: string;
    readonly nombre: string;
    /** Donde va el nombre de la comida, adentro del dibujo y arriba de sus celdas. */
    readonly yDelNombre: number;
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
      yDelNombre: 2 + i * ALTO_DE_LA_FILA_DE_LA_TIRA + 8,
      y: 2 + i * ALTO_DE_LA_FILA_DE_LA_TIRA + 21,
      celdas: f.celdas.filter((c) => dentro(c.fecha, escala)).map((c) => ({ fecha: c.fecha, estado: c.estado, x: escala.x(c.fecha), ancho })),
    })),
  };
}

/** Lo que ocupa una letra de 12 px, de promedio, para que dos rótulos de temporada no se pisen (el de la base). */
const ANCHO_DE_UNA_LETRA = 6.6;

export interface TemporadaUbicada extends TemporadaDelLienzo {
  /** De dónde a dónde va su fondo (el día entero de cada borde). */
  readonly x1: number;
  readonly x2: number;
  /**
   * Las versiones del plan alternan, como en la base (`versionesEnElEje`): la primera sin fondo, la siguiente con el tono
   * tenue. Las del objetivo no tienen fondo (`null`): solo su línea.
   */
  readonly tenue: boolean | null;
  /** Empieza adentro del período: lleva la línea fina del cambio. */
  readonly conCambio: boolean;
  /** Lo que entra arriba sin pisar el rótulo anterior: el entero, el corto o nada (está en la descripción y en «Cómo leerlo»). */
  readonly texto: string | null;
}

/**
 * Las temporadas que tocan el período, ubicadas: el fondo tenue que alterna entre versiones del plan, la línea de cada
 * cambio que cae adentro y el rótulo que entra sin pisarse («Plan v3 · desde el 2/9», si no «Plan v3», si no nada).
 */
export function temporadasUbicadas(temporadas: readonly TemporadaDelLienzo[], escala: EscalaDeFechas): TemporadaUbicada[] {
  const visibles = temporadas.filter((t) => t.desde <= escala.hasta && (t.hasta === null || t.hasta >= escala.desde)).sort((a, b) => a.desde.localeCompare(b.desde) || (a.tipo === b.tipo ? 0 : a.tipo === 'PLAN' ? -1 : 1));
  let planes = 0;
  let finDelUltimoRotulo = -Infinity;
  return visibles.map((t, i) => {
    const x1 = escala.x(t.desde < escala.desde ? escala.desde : t.desde) - escala.porDia / 2;
    const x2 = escala.x(t.hasta === null || t.hasta > escala.hasta ? escala.hasta : t.hasta) + escala.porDia / 2;
    const tenue = t.tipo === 'PLAN' ? planes++ % 2 === 1 : null;
    // El rótulo entra hasta la temporada siguiente (o el final del dibujo), sin pisar el anterior.
    const siguiente = visibles.slice(i + 1).find((s) => s.desde > t.desde);
    const tope = siguiente ? escala.x(siguiente.desde) - escala.porDia / 2 : escala.derecha + 8;
    const inicio = Math.max(x1, escala.izquierda) + 4;
    const entra = (texto: string) => inicio >= finDelUltimoRotulo + 8 && inicio + texto.length * ANCHO_DE_UNA_LETRA <= tope - 4;
    const texto = [t.rotulo, t.corto].find(entra) ?? null;
    if (texto !== null) finDelUltimoRotulo = inicio + texto.length * ANCHO_DE_UNA_LETRA;
    return { ...t, x1, x2, tenue, conCambio: t.desde > escala.desde, texto };
  });
}

/** La semana (de las de un panel) que contiene una fecha, o `null`. */
export const semanaDeLaFecha = <T extends { readonly desde: string; readonly hasta: string }>(semanas: readonly T[], fecha: string | null): T | null =>
  fecha === null ? null : (semanas.find((s) => fecha >= s.desde && fecha <= s.hasta) ?? null);

/**
 * Cómo arranca un gráfico de Nutrición (GR-VC01 y GR-VC12): por semana con más de seis semanas (`convienePorSemana`, la
 * regla de la base) **y si alguna semana tiene media**; si ninguna llega, por semana se vería solo «sin media» y de entrada
 * va día por día (por semana sigue a un toque, y dice por qué no hay media).
 */
export function modoDeEntrada(grafico: Pick<GraficoArmado, 'porSemana' | 'paneles'>, desde: string, hasta: string): ModoDelLienzo {
  if (grafico.porSemana === null || !convienePorSemana(desde, hasta)) return 'DIA';
  return grafico.paneles.some((p) => p.tipo === 'VALORES' && p.semanas.some((s) => s.valor !== null)) ? 'SEMANA' : 'DIA';
}

/** El tramo que se lee de entrada en «Por semana»: el último con alguna media (o el último, si ninguno tiene). */
export function tramoDeEntrada(tramos: readonly TramoDeLasSemanas[]): TramoDeLasSemanas | null {
  for (let i = tramos.length - 1; i >= 0; i--) if (tramos[i]?.conMedia) return tramos[i] as TramoDeLasSemanas;
  return tramos[tramos.length - 1] ?? null;
}

/**
 * El mismo día y mes de la base («3/11»), para los textos. Con una `referencia` de otro año (el último día del gráfico o
 * la toma más nueva), lleva el año («3/11/2025»): el peso de una toma de hace casi un año, o una versión que rige desde el
 * año pasado, no se leen como de este año.
 */
export const diaYMes = (fecha: string, referencia?: string): string => {
  const corto = `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;
  return referencia !== undefined && referencia.slice(0, 4) !== fecha.slice(0, 4) ? `${corto}/${fecha.slice(0, 4)}` : corto;
};
