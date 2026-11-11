/**
 * La geometría que comparten los gráficos de la ficha, sin la biblioteca de gráficos (WP-ESCRITORIO-AMABLE, parte 3):
 * dónde cae un punto en el eje de fechas, qué días se sombrean y cómo se arma el minigráfico de un indicador del
 * Resumen. Va aparte de `lienzo.tsx` para que el Resumen, que se carga con la ficha, no arrastre esa biblioteca: la usa
 * solo «Analizar», y recién cuando se abre.
 *
 * Son funciones puras: no leen la pantalla ni la hora. Tienen su prueba en `scripts/geometria-del-minigrafico.test.mjs`.
 */
import { esPuntoDeCargaRapida, lunesDe, numeroConPrecision, type PuntoAnalitico } from '@be/domain';

export const DIA = 86_400_000;
export const mediodia = (fecha: string): number => Date.parse(`${fecha}T12:00:00Z`);
export const fechaDeX = (x: number): string => new Date(x).toISOString().slice(0, 10);

/** Dónde va un punto en el eje: la hora del hecho si la tiene (dos tomas del mismo día no se pisan); si no, el mediodía. */
export function xDe(p: PuntoAnalitico): number {
  if (p.dateEnd) return mediodia(p.date) + 3 * DIA; // la mitad de la semana
  if (p.at) {
    const x = Date.parse(p.at);
    // La hora se respeta solo si cae en el día civil del punto; si no, el mediodía de ese día.
    return Math.abs(x - mediodia(p.date)) < DIA / 2 ? x : mediodia(p.date);
  }
  return mediodia(p.date);
}

/** El día anterior a una fecha civil. */
export const diaAnterior = (fecha: string): string => fechaDeX(mediodia(fecha) - DIA);

/**
 * Los días sin registros que se sombrean en un gráfico diario: los huecos de la serie, sin el día en curso, que todavía
 * puede tener registros (el dominio también lo separa de «sin registros» al contar la cobertura).
 */
export function diasSinRegistros(huecos: readonly { readonly from: string; readonly to: string }[], hoy: string): { desde: string; hasta: string }[] {
  return huecos.flatMap((h) => {
    const hasta = h.to >= hoy ? diaAnterior(hoy) : h.to;
    return hasta >= h.from ? [{ desde: h.from, hasta }] : [];
  });
}

// ─── La gramática de las marcas (WP-TABLERO-ALTA-GAMA, TB-02; DL-163 D-3) ───────────────────────
//
// Una sola regla de tamaño para los cuatro gráficos de la ficha (el minigráfico, «Analizar», la evolución de
// Antropometría y los de Entrenamiento). Sale del lugar por día (o por observación) y del estado del dato, no de cada
// gráfico. `R` es el radio que ve el ojo, hasta el borde de afuera del trazo; en el SVG va `r = R − trazo / 2`.

/** La letra más chica de un gráfico, en px: el piso del criterio de diseño, en los cuatro gráficos. */
export const LETRA_MINIMA = 12.5;

/** Lo que dice una marca: el estado del dato. La forma lo dice además del color (WCAG 1.4.1). */
export type EstadoDeMarca = 'lleno' | 'hueco' | 'reportado' | 'calculado';

export interface MedidaDeMarca {
  readonly estado: EstadoDeMarca;
  /** El radio que ve el ojo. */
  readonly R: number;
  /** El radio que va en el SVG. Sin trazo, es `R`. */
  readonly r: number;
  /** El grueso del contorno; el lleno no lleva. */
  readonly trazo: number;
  /** Un halo de 1 en la superficie: solo con lugar de sobra, para separar el punto de la línea. */
  readonly halo: boolean;
  /** El punto del centro de lo calculado; los demás, `null`. */
  readonly puntoAdentro: number | null;
  /** El contorno cortado de lo reportado: cuatro trazos y cuatro cortes iguales (`C/8 C/8`); los demás, `null`. */
  readonly corte: readonly [number, number] | null;
}

const entre = (v: number, minimo: number, maximo: number): number => Math.min(Math.max(v, minimo), maximo);

/**
 * La medida de una marca según el lugar que le toca (`porDia`, en px) y su estado:
 * - **lleno:** `R = clamp(1,25; 0,4 · d; 3,5)`, sin trazo, con halo solo si `d ≥ 6`;
 * - **con estado** (hueco, reportado, calculado): `R = máx(R_lleno + 1; 2,75)`, y 3,25 como mínimo para lo reportado y lo
 *   calculado, que tienen que verse cortados o con su punto a densidad 1. El trazo es de 1,25, o de 1,5 si `R ≥ 4`.
 * Así el agujero del hueco mide por lo menos 1,5 de radio: lleno y hueco se distinguen sin depender de la pantalla.
 */
export function medidaDeMarca(estado: EstadoDeMarca, porDia: number): MedidaDeMarca {
  const lleno = sinRuido(entre(0.4 * porDia, 1.25, 3.5));
  if (estado === 'lleno') return { estado, R: lleno, r: lleno, trazo: 0, halo: porDia >= 6, puntoAdentro: null, corte: null };
  const R = sinRuido(Math.max(lleno + 1, 2.75, estado === 'hueco' ? 0 : 3.25));
  const trazo = R >= 4 ? 1.5 : 1.25;
  const r = sinRuido(R - trazo / 2);
  const octavo = sinRuido((2 * Math.PI * r) / 8);
  return {
    estado,
    R,
    r,
    trazo,
    halo: false,
    puntoAdentro: estado === 'calculado' ? sinRuido(Math.max(0.75, 0.35 * R)) : null,
    corte: estado === 'reportado' ? [octavo, octavo] : null,
  };
}

/** Lo indicado en el plan: un rombo hueco del tamaño del hueco, no del doble (media diagonal `R_hueco + 1`, trazo 1,25). */
export function medidaDelRombo(porDia: number): { readonly mediaDiagonal: number; readonly trazo: number } {
  return { mediaDiagonal: sinRuido(medidaDeMarca('hueco', porDia).R + 1), trazo: 1.25 };
}

/**
 * Lo elegido: un aro fino del color de la métrica alrededor de la marca, sin taparla (radio `R_hueco + 3`, trazo 1,5),
 * separado de lo que tiene detrás por 1,5 de superficie. Es la misma forma en los cuatro gráficos; con el foco del
 * teclado en el gráfico, el aro pasa al color del foco (globals.css, `.grafico__aro`).
 */
export function medidaDelAro(porDia: number): { readonly r: number; readonly trazo: number; readonly separacion: number } {
  return { r: sinRuido(medidaDeMarca('hueco', porDia).R + 3), trazo: 1.5, separacion: 1.5 };
}

/**
 * Lo corregido: una raya de 1,25 de grueso y `2 · R` de largo, a `R + 2` por encima del centro. No es un centro claro,
 * que se confundiría con el hueco.
 */
export function rayaDeCorregido(medida: MedidaDeMarca): { readonly ancho: number; readonly grueso: number; readonly arriba: number } {
  return { ancho: sinRuido(2 * medida.R), grueso: 1.25, arriba: sinRuido(medida.R + 2) };
}

/**
 * El estado de un punto de «Analizar» o del minigráfico. Lo reportado y lo calculado se dibujan con su forma aunque sean
 * subtotales; un subtotal, un día o una semana sin completar y una serie de carga rápida (DL-161), huecos.
 */
export function estadoDeMarca(p: PuntoAnalitico): EstadoDeMarca {
  if (p.dataClass === 'REPORTED') return 'reportado';
  if (p.dataClass === 'DERIVED') return 'calculado';
  return p.quality === 'PARTIAL' || p.partialBucket || esPuntoDeCargaRapida(p) ? 'hueco' : 'lleno';
}

// ─── El minigráfico de un indicador ─────────────────────────────────────────────────────────────

export interface EntradaDelMinigrafico {
  /** Las observaciones de la métrica (el día, la sesión o la toma). Lo que no tiene valor no se dibuja. */
  readonly puntos: readonly PuntoAnalitico[];
  /** Los días sin registros que se sombrean (`diasSinRegistros`); vacío si la serie no es diaria. */
  readonly sinRegistros: readonly { readonly desde: string; readonly hasta: string }[];
  readonly desde: string;
  readonly hasta: string;
  /** El tamaño del dibujo, en píxeles. */
  readonly ancho: number;
  readonly alto: number;
  /** El día desde el que rige el primer plan del período, si empezó adentro (`primerPlanDelPeriodo`). */
  readonly inicioDelPlan: string | null;
  /** Tramos del eje de fechas que llevan un rótulo (las dos etapas de una comparación): del primer día al último. */
  readonly bandas?: readonly { readonly desde: string; readonly hasta: string; readonly rotulo: string }[];
  /** Fechas que se escriben debajo del dibujo: para eso se reserva un renglón. */
  readonly fechas?: readonly string[];
  /** Lo planificado en la unidad de la métrica (el objetivo de calorías), un escalón por versión. Entra en el eje. */
  readonly plan?: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
  /**
   * En cuántas partes, por lo menos, se piensa el eje vertical para elegir su paso redondo. Con 2 (lo de siempre), un
   * gráfico de 60 px de alto tiene dos marcas bien separadas; uno más alto admite 4, que ajusta más el eje a los datos.
   */
  readonly divisionesDelEje?: number;
  /** TA-72: la métrica se cuenta entera (`escalaDeLaUnidad`): el eje va en enteros. */
  readonly enteros?: boolean;
}

export interface PuntoDelMinigrafico {
  readonly clave: string;
  readonly x: number;
  readonly y: number;
  /** El radio que ve el ojo (`medida.R`). */
  readonly r: number;
  /** Cómo se dibuja la marca: su estado, su radio y su trazo (`medidaDeMarca`). */
  readonly medida: MedidaDeMarca;
  /** Un subtotal, un día o una semana sin completar, o una serie de carga rápida (DL-161): se dibuja hueco. */
  readonly hueco: boolean;
  /** Reportado por la persona o calculado por un método: se dibuja distinto (lo medido, no). */
  readonly clase: 'REPORTED' | 'DERIVED' | null;
}

export interface GeometriaDelMinigrafico {
  readonly puntos: readonly PuntoDelMinigrafico[];
  /** Un trazo por tramo con dos puntos o más («M x y L x y…»): la línea une solo puntos del mismo tramo. */
  readonly tramos: readonly string[];
  readonly sinRegistros: readonly { readonly x: number; readonly ancho: number }[];
  /** Las dos marcas del eje vertical: abajo y arriba de todo lo dibujado, en números redondos. */
  readonly eje: readonly { readonly y: number; readonly valor: number; readonly texto: string }[];
  /** Dónde empieza a regir el primer plan del período, si empezó adentro. */
  readonly inicioDelPlan: number | null;
  /** Los tramos rotulados que caen en el período, recortados a él. */
  readonly bandas: readonly { readonly x: number; readonly ancho: number; readonly rotulo: string }[];
  /** Dónde va cada fecha del pie: la primera se alinea a la izquierda y la última a la derecha, para que no se corten. */
  readonly fechas: readonly { readonly x: number; readonly fecha: string; readonly ancla: 'start' | 'middle' | 'end' }[];
  /** Un tramo horizontal por escalón de lo planificado: cada uno termina donde empieza el siguiente. */
  readonly plan: readonly { readonly x1: number; readonly x2: number; readonly y: number }[];
  readonly caja: { readonly izquierda: number; readonly derecha: number; readonly arriba: number; readonly abajo: number };
}

/** El ancho estimado de una cifra del eje (letra de 12,5 px con cifras tabulares). */
const ANCHO_DE_CIFRA = 7.2;
const AIRE = 8;
/** El renglón de las fechas, debajo del dibujo: la letra y su aire. */
export const PIE_DE_FECHAS = 18;
/** El ancho que se le reserva a una fecha corta del pie («17 sept»), para saber si dos se pisan. */
const ANCHO_DE_FECHA = 52;
/** La franja de arriba donde va la letra de cada etapa: ahí no se dibuja ningún punto, así la letra no pisa a ninguno. */
export const FRANJA_DE_ROTULOS = 14;

/** Sin el ruido binario de una cuenta con decimales (0,95 / 0,05 no es 18,999999999999996). */
const sinRuido = (n: number): number => Number(n.toFixed(6));

/** Un paso «redondo» (1, 2 o 5 por una potencia de diez) para que dos marcas abarquen el rango. */
function pasoRedondo(rango: number, divisiones: number): number {
  const bruto = rango / divisiones;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const m = sinRuido(bruto / potencia);
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * potencia;
}

/**
 * Los dos extremos del eje vertical para un mínimo y un máximo: números redondos que encierran todos los valores. Con
 * `enteros` (lo que se cuenta, TA-72), el paso es 1 como mínimo: 4 series iguales van entre 3 y 5, no entre 3,8 y 4,2.
 */
export function extremosDelEje(minimo: number, maximo: number, divisiones = 2, enteros = false): { readonly abajo: number; readonly arriba: number; readonly decimales: number } {
  // Con un solo valor (o todos iguales) no hay rango: se abre un margen alrededor, para que el punto no quede en un borde.
  const margen = maximo === minimo ? Math.abs(maximo) * 0.05 || 1 : 0;
  const redondo = pasoRedondo(maximo - minimo + 2 * margen, divisiones);
  const paso = enteros ? Math.max(1, redondo) : redondo;
  let abajo = sinRuido(Math.floor(sinRuido((minimo - margen) / paso)) * paso);
  const arriba = sinRuido(Math.ceil(sinRuido((maximo + margen) / paso)) * paso);
  // Una métrica que no baja de cero no muestra una marca negativa.
  if (minimo >= 0 && abajo < 0) abajo = 0;
  // Los decimales que hacen falta para escribir las dos marcas sin redondearlas (las dos con los mismos).
  const decimalesDe = (v: number): number => (Number.isInteger(v) ? 0 : Number.isInteger(sinRuido(v * 10)) ? 1 : 2);
  return { abajo, arriba, decimales: Math.max(decimalesDe(abajo), decimalesDe(arriba)) };
}

/**
 * El minigráfico de un indicador: los mismos puntos y los mismos cortes que el gráfico de «Analizar», en chico.
 * - **Un punto por observación con valor.** Lo que no tiene valor (un día con registros sin cantidades) no es un punto;
 *   tampoco se sombrea, porque no es un día sin registros.
 * - **La línea une solo puntos del mismo tramo.** Lo que está sin completar (el día en curso) va suelto.
 * - **No se quita ningún punto:** con muchos días en poco ancho se achica la marca, hasta el mínimo de su estado
 *   (`medidaDeMarca`).
 * - **Dos marcas en el eje vertical,** en números redondos: ubican el valor sin dibujar una grilla.
 */
export function geometriaDelMinigrafico(e: EntradaDelMinigrafico): GeometriaDelMinigrafico {
  const x0 = mediodia(e.desde) - DIA / 2;
  const x1 = mediodia(e.hasta) + DIA / 2;
  const dibujados = e.puntos.filter((p) => p.value !== null).map((p) => ({ p, x: xDe(p), v: p.value as number })).filter((d) => d.x >= x0 && d.x <= x1);
  const vacia = { puntos: [], tramos: [], sinRegistros: [], eje: [], inicioDelPlan: null, bandas: [], fechas: [], plan: [], caja: { izquierda: 0, derecha: e.ancho, arriba: 0, abajo: e.alto } };
  if (dibujados.length === 0 || e.ancho <= 0 || e.alto <= 0) return vacia;

  // Lo planificado que se ve en el período: cada escalón termina donde empieza el siguiente (el día del cambio tiene un
  // solo valor, el nuevo). Sus valores entran en el eje, para que la línea no quede afuera del dibujo.
  const escalones = [...(e.plan ?? [])]
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .flatMap((s, i, todos) => {
      const siguiente = todos[i + 1];
      const a = Math.max(x0, mediodia(s.desde) - DIA / 2);
      const b = Math.min(x1, s.hasta ? mediodia(s.hasta) + DIA / 2 : x1, siguiente ? mediodia(siguiente.desde) - DIA / 2 : x1);
      return b > a ? [{ a, b, valor: s.valor }] : [];
    });
  const valores = [...dibujados.map((d) => d.v), ...escalones.map((s) => s.valor)];
  const { abajo, arriba, decimales } = extremosDelEje(Math.min(...valores), Math.max(...valores), e.divisionesDelEje ?? 2, e.enteros ?? false);
  const textos = [abajo, arriba].map((v) => numeroConPrecision(v, decimales));
  const conFechas = (e.fechas ?? []).length > 0;
  const caja = {
    izquierda: Math.max(...textos.map((t) => t.length)) * ANCHO_DE_CIFRA + AIRE,
    derecha: e.ancho - AIRE,
    arriba: AIRE + ((e.bandas ?? []).length > 0 ? FRANJA_DE_ROTULOS : 0),
    abajo: e.alto - AIRE - (conFechas ? PIE_DE_FECHAS : 0),
  };
  const anchoUtil = Math.max(1, caja.derecha - caja.izquierda);
  const altoUtil = Math.max(1, caja.abajo - caja.arriba);
  const xEn = (x: number): number => sinRuido(caja.izquierda + ((x - x0) / (x1 - x0)) * anchoUtil);
  const yEn = (v: number): number => sinRuido(caja.abajo - ((v - abajo) / (arriba - abajo)) * altoUtil);

  // El tamaño de la marca sale del lugar que hay por día, con la misma regla de los cuatro gráficos (TB-02).
  const porDia = anchoUtil / Math.max(1, Math.round((x1 - x0) / DIA));
  const puntos = dibujados.map(({ p, x, v }) => {
    // DL-161: una serie de carga rápida (tildada sin escribir) es hueca, como en «Analizar».
    const hueco = p.quality === 'PARTIAL' || p.partialBucket || esPuntoDeCargaRapida(p);
    const clase = p.dataClass === 'REPORTED' || p.dataClass === 'DERIVED' ? p.dataClass : null;
    // Una marca hueca, cortada o con un punto adentro tiene su mínimo, que la separa del lleno.
    const medida = medidaDeMarca(estadoDeMarca(p), porDia);
    return { clave: p.pointId, x: xEn(x), y: yEn(v), r: medida.R, hueco, clase, medida };
  });

  // Un trazo por tramo, con sus puntos en orden. Lo que está sin completar no se une a nada.
  const porTramo = new Map<string, { x: number; y: number }[]>();
  dibujados.forEach(({ p }, i) => {
    if (p.partialBucket) return;
    const lista = porTramo.get(p.segment) ?? [];
    lista.push({ x: (puntos[i] as PuntoDelMinigrafico).x, y: (puntos[i] as PuntoDelMinigrafico).y });
    porTramo.set(p.segment, lista);
  });
  const tramos = [...porTramo.values()].filter((t) => t.length >= 2).map((t) => [...t].sort((a, b) => a.x - b.x).map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x} ${q.y}`).join(' '));

  const sinRegistros = e.sinRegistros.flatMap((h) => {
    const a = Math.max(x0, mediodia(h.desde) - DIA / 2);
    const b = Math.min(x1, mediodia(h.hasta) + DIA / 2);
    return b > a ? [{ x: xEn(a), ancho: sinRuido(xEn(b) - xEn(a)) }] : [];
  });
  const plan = e.inicioDelPlan ? mediodia(e.inicioDelPlan) - DIA / 2 : null;
  const bandas = (e.bandas ?? []).flatMap((b) => {
    const a = Math.max(x0, mediodia(b.desde) - DIA / 2);
    const z = Math.min(x1, mediodia(b.hasta) + DIA / 2);
    return z > a ? [{ x: xEn(a), ancho: sinRuido(xEn(z) - xEn(a)), rotulo: b.rotulo }] : [];
  });
  // Cada fecha va en el mediodía de su día. La primera y la última se alinean hacia adentro (centradas, se cortarían) y
  // van siempre; una del medio va solo si no pisa a otra.
  const delPie = [...new Set(e.fechas ?? [])].filter((f) => f >= e.desde && f <= e.hasta).sort();
  const lugarDe = (x: number, ancla: 'start' | 'middle' | 'end'): readonly [number, number] => (ancla === 'start' ? [x, x + ANCHO_DE_FECHA] : ancla === 'end' ? [x - ANCHO_DE_FECHA, x] : [x - ANCHO_DE_FECHA / 2, x + ANCHO_DE_FECHA / 2]);
  const candidatas = delPie.map((f, i) => {
    const ancla = i === 0 ? ('start' as const) : i === delPie.length - 1 ? ('end' as const) : ('middle' as const);
    return { x: xEn(mediodia(f)), fecha: f, ancla };
  });
  const fijas = candidatas.filter((c) => c.ancla !== 'middle').map((c) => lugarDe(c.x, c.ancla));
  const fechas = candidatas.filter((c) => {
    if (c.ancla !== 'middle') return true;
    const [a, b] = lugarDe(c.x, 'middle');
    const libre = fijas.every(([fa, fb]) => b + AIRE <= fa || a - AIRE >= fb);
    if (libre) fijas.push([a, b]);
    return libre;
  });

  return {
    puntos,
    tramos,
    sinRegistros,
    eje: [
      { y: yEn(arriba), valor: arriba, texto: textos[1] as string },
      { y: yEn(abajo), valor: abajo, texto: textos[0] as string },
    ],
    inicioDelPlan: plan !== null && plan > x0 && plan < x1 ? xEn(plan) : null,
    bandas,
    fechas,
    plan: escalones.map((s) => ({ x1: xEn(s.a), x2: xEn(s.b), y: yEn(s.valor) })),
    caja,
  };
}

// ─── El minigráfico de un indicador del Resumen (WP-TABLERO-ALTA-GAMA, TB-04; DL-163 D-5) ───────
//
// Más alto que el de la comparación de etapas, sin canal de eje (el tope y la base de la grilla van rotulados adentro)
// y con la tira de cobertura debajo, que lleva el estado de cada día. Según el lugar que le toca a cada día:
// - **con 4 px o más,** todas las marcas, y la línea une los días completos seguidos;
// - **con menos, en una serie diaria de más de ocho semanas** (los 90 días del Resumen), la línea es la media de cada
//   semana de BE (de lunes a domingo), con su denominador, y los días van como puntos claros detrás: es el grano
//   semanal que BE ya tiene, no un suavizado;
// - **con menos, en un período más corto o en sesiones o tomas,** la línea une lo completo y seguido, y llevan marca la
//   última y las aisladas; lo sin completar, en la tira (o con su marca, donde no hay tira).
// La línea se corta en los días sin registros, en lo que está sin completar y entre tramos no comparables. Lo que cae
// fuera de la escala (un subtotal muy bajo, el día en curso) va con una muesca en la base o en el tope, en su día, y su
// cuenta, sin ubicarlo en una altura que no es la suya. En una serie diaria con uno a tres días con valor no hay línea
// ni media: van los puntos sueltos (las tomas sí se unen, como la línea de las tomas de la propuesta).

/** El estado de un día en la tira: con valor, sin completar, sin registros, o nada que decir (sin cantidades, hoy). */
export type EstadoDelDia = 'con' | 'hueco' | 'sin' | 'nada';

export interface EntradaDelIndicador {
  readonly puntos: readonly PuntoAnalitico[];
  /** Los días sin registros (`diasSinRegistros`); vacío si la serie no es diaria. */
  readonly sinRegistros: readonly { readonly desde: string; readonly hasta: string }[];
  readonly desde: string;
  readonly hasta: string;
  /** El día en curso: queda fuera de la media semanal y se marca debajo de la tira. */
  readonly hoy: string;
  /** Si la serie tiene un valor por día (Nutrición): lleva tira y, con poco lugar, la media semanal. */
  readonly diaria: boolean;
  readonly ancho: number;
  /** El alto del lienzo, sin la franja de rótulos, la tira ni las fechas (A13: 72; 64 si no entra). */
  readonly lienzo: number;
  readonly inicioDelPlan: string | null;
  /** Lo planificado en la unidad de la métrica (el objetivo), un escalón por versión. Entra en el eje. */
  readonly plan?: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
  /**
   * El rango vertical más angosto que se dibuja, en la unidad de la métrica (`RANGO_MINIMO_POR_UNIDAD`): así −0,4 kg no
   * parece un precipicio. Sin él, el rango sale solo de los valores.
   */
  readonly rangoMinimo?: number;
  /**
   * TA-72: la métrica se cuenta entera (series, repeticiones, RIR, registros o sesiones; `escalaDeLaUnidad`). La grilla
   * va en enteros y, con todos los valores iguales, se abre uno de cada lado: 4 series se leen entre 3 y 5.
   */
  readonly enteros?: boolean;
  /**
   * TB-16 (DL-163 D-7): el día en que empezó el vínculo de esta área, si es posterior al inicio del período. Lo anterior
   * no se dibuja, ni en el lienzo ni en la tira: no es «sin registros», es antes del acompañamiento. La escala de fechas
   * sigue siendo la del período, la misma de los demás indicadores.
   */
  readonly desdeElVinculo?: string | null;
}

/** La escala mínima de cada unidad (la propuesta, A9): 2 kg, 2 cm o 4 mm, centrada en los valores. */
export const RANGO_MINIMO_POR_UNIDAD: Readonly<Record<string, number>> = { kg: 2, cm: 2, mm: 4 };

/**
 * TA-72: las unidades de lo que se cuenta entero, con las que salen las series del análisis (`metricas-del-analisis.ts`
 * y `entrenamiento-del-analisis.ts`): las series registradas, las repeticiones, el RIR y los registros de comida. Las
 * sesiones todavía no tienen una serie propia en un minigráfico; si la tienen, entran con su unidad. Las calorías no
 * son una cuenta, aunque se escriban sin decimales: su escala sigue siendo la de una medida.
 */
export const UNIDADES_QUE_SE_CUENTAN: ReadonlySet<string> = new Set(['series', 'rep', 'RIR', 'registros', 'sesiones']);

/**
 * Lo que la unidad decide de la escala de un minigráfico, en un solo lugar: su rango mínimo (2 kg, 2 cm o 4 mm, TB-04) y
 * si va en enteros (TA-72). Lo usan los dos minigráficos (`minigrafico.tsx`).
 */
export function escalaDeLaUnidad(unidad: string): { readonly rangoMinimo: number | undefined; readonly enteros: boolean } {
  return { rangoMinimo: RANGO_MINIMO_POR_UNIDAD[unidad], enteros: UNIDADES_QUE_SE_CUENTAN.has(unidad) };
}

export interface PuntoDelIndicador {
  readonly clave: string;
  readonly x: number;
  readonly y: number;
  readonly medida: MedidaDeMarca;
  /** Un día como punto claro detrás de la media semanal: sin trazo y a media tinta. */
  readonly claro: boolean;
}

export interface SemanaDelIndicador {
  readonly lunes: string;
  readonly x: number;
  readonly y: number;
  readonly valor: number;
  /** El denominador: los días con valor y los días de la semana dentro del período. */
  readonly conValor: number;
  readonly dias: number;
  readonly medida: MedidaDeMarca;
}

export interface GeometriaDelIndicador {
  readonly modo: 'todos' | 'pocos' | 'semanal' | 'sueltos';
  /** El lugar por día del período, en px. */
  readonly porDia: number;
  readonly puntos: readonly PuntoDelIndicador[];
  readonly semanas: readonly SemanaDelIndicador[];
  /** Un trazo por tramo de la línea («M x y L x y…»): días seguidos completos, observaciones o semanas con valor. */
  readonly tramos: readonly string[];
  /** La grilla, en números redondos: 4 divisiones con 72 px de lienzo o más, 2 con menos. */
  readonly grilla: readonly { readonly y: number; readonly valor: number; readonly texto: string }[];
  /** Los dos rótulos de la grilla, adentro del lienzo: el tope y la base. */
  readonly rotulos: readonly { readonly y: number; readonly texto: string }[];
  readonly muescas: readonly { readonly x: number; readonly abajo: boolean }[];
  readonly fuera: { readonly abajo: number; readonly arriba: number };
  readonly tira: readonly { readonly x: number; readonly ancho: number; readonly estado: Exclude<EstadoDelDia, 'nada'> }[];
  /** La raya de hoy, debajo de la tira, si hoy está en el período. */
  readonly hoy: { readonly x: number; readonly ancho: number } | null;
  readonly inicioDelPlan: number | null;
  readonly plan: readonly { readonly x1: number; readonly x2: number; readonly y: number }[];
}

/** La media semanal se dibuja con menos de este lugar por día; las marcas de cada observación, desde acá. */
export const LUGAR_PARA_MARCAR_CADA_DIA = 4;
/** La media semanal, solo en un período de más de ocho semanas: con menos, la línea de los días, cortada. */
export const SEMANAL_CON_MAS_DE_DIAS = 56;
/** Con hasta tantos días con valor no se dibuja línea ni media: van los puntos sueltos. */
export const SOLO_PUNTOS_HASTA = 3;

/**
 * El paso redondo de la grilla del indicador: 1, 2, 2,5, 5 o 10 por una potencia de diez (A14). Lo que se cuenta
 * (TA-72) va en enteros: el paso es 1 como mínimo y, donde tocaría 2,5, es 2.
 */
function pasoDeLaGrilla(rango: number, divisiones: number, enteros = false): number {
  const bruto = rango / divisiones;
  if (enteros && bruto <= 1) return 1;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const m = sinRuido(bruto / potencia);
  const dosYMedio = enteros && potencia === 1 ? 2 : 2.5;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? dosYMedio : m <= 5 ? 5 : 10) * potencia;
}

const fechasEntre = (desde: string, hasta: string): string[] => {
  const lista: string[] = [];
  for (let x = mediodia(desde); x <= mediodia(hasta); x += DIA) lista.push(fechaDeX(x));
  return lista;
};

export function geometriaDelIndicador(entrada: EntradaDelIndicador): GeometriaDelIndicador {
  const e = recortadaAlVinculo(entrada);
  const dias = fechasEntre(e.desde, e.hasta);
  const porDia = e.ancho / Math.max(1, dias.length);
  const indiceDe = new Map(dias.map((f, i) => [f, i]));
  const xDelDia = (fecha: string): number => sinRuido(porDia * ((indiceDe.get(fecha) ?? 0) + 0.5));
  const conValor = e.puntos.filter((p) => p.value !== null && indiceDe.has(p.date));
  const firmes = conValor.filter((p) => estadoDeMarca(p) !== 'hueco');
  const vacia: GeometriaDelIndicador = { modo: 'todos', porDia, puntos: [], semanas: [], tramos: [], grilla: [], rotulos: [], muescas: [], fuera: { abajo: 0, arriba: 0 }, tira: [], hoy: null, inicioDelPlan: null, plan: [] };
  if (dias.length === 0 || e.ancho <= 0 || e.lienzo <= 0) return vacia;

  // El modo, según el lugar y la cantidad de observaciones.
  const porObservacion = e.ancho / Math.max(1, conValor.length);
  const lugar = e.diaria ? porDia : porObservacion;
  const modo: GeometriaDelIndicador['modo'] =
    e.diaria && firmes.length <= SOLO_PUNTOS_HASTA
      ? 'sueltos'
      : lugar >= LUGAR_PARA_MARCAR_CADA_DIA
        ? 'todos'
        : e.diaria && dias.length > SEMANAL_CON_MAS_DE_DIAS
          ? 'semanal'
          : 'pocos';

  // Las semanas de BE dentro del período, con la media de los días con valor (sin hoy, que sigue en curso).
  const semanasCrudas =
    modo === 'semanal'
      ? [...new Set(dias.map((f) => lunesDe(f)))].flatMap((lunes) => {
          const delBalde = dias.filter((f) => lunesDe(f) === lunes);
          const contados = conValor.filter((p) => lunesDe(p.date) === lunes && p.date !== e.hoy);
          if (contados.length === 0) return [];
          const valor = contados.reduce((s, p) => s + (p.value as number), 0) / contados.length;
          const hueca = delBalde.length < 7 || delBalde.includes(e.hoy) || contados.some((p) => estadoDeMarca(p) === 'hueco');
          const centro = (mediodia(delBalde[0] as string) + mediodia(delBalde[delBalde.length - 1] as string)) / 2;
          return [{ lunes, valor, conValor: contados.length, dias: delBalde.length, hueca, centro }];
        })
      : [];

  // El dominio: los días completos (o las semanas) y el objetivo, con un 8 % de margen. Sin forzar el cero.
  const x0 = mediodia(e.desde) - DIA / 2;
  const x1 = mediodia(e.hasta) + DIA / 2;
  const escalones = [...(e.plan ?? [])]
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .flatMap((s, i, todos) => {
      const siguiente = todos[i + 1];
      const a = Math.max(x0, mediodia(s.desde) - DIA / 2);
      const b = Math.min(x1, s.hasta ? mediodia(s.hasta) + DIA / 2 : x1, siguiente ? mediodia(siguiente.desde) - DIA / 2 : x1);
      return b > a ? [{ a, b, valor: s.valor }] : [];
    });
  const base = [...(firmes.length > 0 ? firmes : conValor).map((p) => p.value as number), ...semanasCrudas.map((s) => s.valor), ...escalones.map((s) => s.valor)];
  if (base.length === 0) return { ...vacia, modo, tira: e.diaria ? tiraDe(e, dias, porDia) : [], hoy: hoyDe(e, indiceDe, porDia) };
  let lo = Math.min(...base);
  let hi = Math.max(...base);
  if (e.rangoMinimo !== undefined && hi - lo < e.rangoMinimo) {
    const centro = (hi + lo) / 2;
    lo = centro - e.rangoMinimo / 2;
    hi = centro + e.rangoMinimo / 2;
  }
  // TA-72: lo que se cuenta, con todos los valores iguales, se abre uno de cada lado: un margen entero (4 series se leen
  // entre 3 y 5, no entre 3,99 y 4,01).
  if (e.enteros && hi === lo) {
    lo -= 1;
    hi += 1;
  }
  const margen = (hi - lo || Math.abs(hi) * 0.05 || 1) * 0.08;
  lo -= margen;
  hi += margen;
  if (Math.min(...base) >= 0 && lo < 0) lo = 0;
  const arriba = 6;
  const abajo = e.lienzo - 4;
  const yEn = (v: number): number => sinRuido(arriba + (1 - (v - lo) / (hi - lo)) * (abajo - arriba));
  const xEn = (x: number): number => sinRuido(((x - x0) / (x1 - x0)) * e.ancho);
  const fueraDeEscala = (v: number): boolean => v < lo || v > hi;

  // La grilla y sus dos rótulos, adentro: el tope por encima de su línea y la base por debajo, para que no se pisen.
  const divisiones = e.lienzo >= 72 ? 4 : 2;
  const paso = pasoDeLaGrilla(hi - lo, divisiones, e.enteros ?? false);
  const decimales = Number.isInteger(sinRuido(paso)) ? 0 : Number.isInteger(sinRuido(paso * 10)) ? 1 : 2;
  const grilla: { y: number; valor: number; texto: string }[] = [];
  for (let v = Math.ceil(sinRuido(lo / paso)) * paso; v <= hi + 1e-9; v = sinRuido(v + paso)) grilla.push({ y: Math.round(yEn(v)) + 0.5, valor: sinRuido(v), texto: numeroConPrecision(sinRuido(v), decimales) });
  const rotulos: { y: number; texto: string }[] = [];
  const tope = grilla[grilla.length - 1];
  const piso = grilla[0];
  if (tope) rotulos.push({ y: tope.y - 4 >= 10 ? tope.y - 4 : tope.y + 13, texto: tope.texto });
  if (piso && piso !== tope && piso.y + 13 <= e.lienzo && piso.y - (tope?.y ?? 0) >= 18) rotulos.push({ y: piso.y + 13, texto: piso.texto });

  // Los puntos: lo que cae fuera de la escala no es un punto, es una muesca.
  const muescas: { x: number; abajo: boolean }[] = [];
  const fuera = { abajo: 0, arriba: 0 };
  const dibujables = conValor.filter((p) => {
    const v = p.value as number;
    if (!fueraDeEscala(v)) return true;
    muescas.push({ x: e.diaria ? xDelDia(p.date) : xEn(xDe(p)), abajo: v < lo });
    if (v < lo) fuera.abajo += 1;
    else fuera.arriba += 1;
    return false;
  });
  const xDelPunto = (p: PuntoAnalitico): number => (e.diaria ? xDelDia(p.date) : xEn(xDe(p)));
  const ultimoFirme = [...firmes].filter((p) => !fueraDeEscala(p.value as number)).sort((a, b) => xDe(a) - xDe(b)).at(-1) ?? null;
  // Los grupos de la línea: lo completo y dentro de la escala, seguido (en una serie diaria, días consecutivos) y del
  // mismo tramo. Un punto completo que queda solo en su grupo es una aislada: lleva marca aunque haya poco lugar.
  const grupos: PuntoAnalitico[][] = [];
  {
    let anterior: PuntoAnalitico | null = null;
    for (const p of [...dibujables].filter((q) => estadoDeMarca(q) !== 'hueco').sort((a, b) => xDe(a) - xDe(b))) {
      const seguido = anterior !== null && anterior.segment === p.segment && (!e.diaria || mediodia(p.date) - mediodia(anterior.date) === DIA);
      if (seguido) grupos[grupos.length - 1]?.push(p);
      else grupos.push([p]);
      anterior = p;
    }
  }
  const enUnTramo = new Set(grupos.filter((gr) => gr.length >= 2).flatMap((gr) => gr.map((p) => p.pointId)));
  const puntos = dibujables.flatMap<PuntoDelIndicador>((p) => {
    const estado = estadoDeMarca(p);
    const x = xDelPunto(p);
    const y = yEn(p.value as number);
    if (modo === 'semanal') return [{ clave: p.pointId, x, y, medida: medidaDeMarca('lleno', 3.4), claro: true }];
    if (modo === 'pocos') {
      // Solo la última, las aisladas y lo que no es completo (que no va en la línea), con los mínimos de su estado.
      // Con la tira, lo sin completar ya dice su estado ahí; en sesiones o tomas, que no llevan tira, lleva su marca.
      const aislada = estado !== 'hueco' && !enUnTramo.has(p.pointId);
      if ((estado === 'hueco' && !e.diaria) || aislada || p === ultimoFirme) return [{ clave: p.pointId, x, y, medida: estado === 'lleno' ? medidaDeMarca('lleno', 5) : medidaDeMarca(estado, lugar), claro: false }];
      return [];
    }
    return [{ clave: p.pointId, x, y, medida: medidaDeMarca(estado, lugar), claro: false }];
  });
  const semanas: SemanaDelIndicador[] = semanasCrudas
    .filter((s) => !fueraDeEscala(s.valor))
    .map((s) => ({ lunes: s.lunes, x: xEn(s.centro), y: yEn(s.valor), valor: sinRuido(s.valor), conValor: s.conValor, dias: s.dias, medida: medidaDeMarca(s.hueca ? 'hueco' : 'lleno', porDia * 7) }));

  // La línea: se corta en los días sin registros, en lo que está sin completar y entre tramos.
  const tramos: string[] = [];
  const trazar = (lista: readonly { x: number; y: number }[]): void => {
    if (lista.length >= 2) tramos.push(lista.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x} ${q.y}`).join(' '));
  };
  if (modo === 'semanal') {
    let actual: { x: number; y: number }[] = [];
    let lunesAnterior: string | null = null;
    for (const s of semanas) {
      const seguida = lunesAnterior !== null && mediodia(s.lunes) - mediodia(lunesAnterior) === 7 * DIA;
      if (!seguida) {
        trazar(actual);
        actual = [];
      }
      actual.push({ x: s.x, y: s.y });
      lunesAnterior = s.lunes;
    }
    trazar(actual);
  } else if (modo !== 'sueltos') {
    for (const gr of grupos) trazar(gr.map((p) => ({ x: xDelPunto(p), y: yEn(p.value as number) })));
  }

  const inicio = e.inicioDelPlan ? mediodia(e.inicioDelPlan) - DIA / 2 : null;
  return {
    modo,
    porDia: sinRuido(porDia),
    puntos,
    semanas,
    tramos,
    grilla,
    rotulos,
    muescas,
    fuera,
    tira: e.diaria ? tiraDe(e, dias, porDia) : [],
    hoy: hoyDe(e, indiceDe, porDia),
    inicioDelPlan: inicio !== null && inicio > x0 && inicio < x1 ? Math.round(xEn(inicio)) + 0.5 : null,
    plan: escalones.map((s) => ({ x1: xEn(s.a), x2: xEn(s.b), y: yEn(s.valor) })),
  };
}

/** El estado de cada día del período, para la tira. */
export function estadosDeLosDias(e: Pick<EntradaDelIndicador, 'puntos' | 'sinRegistros' | 'desde' | 'hasta'>): readonly { readonly fecha: string; readonly estado: EstadoDelDia }[] {
  const conValor = new Map<string, PuntoAnalitico>();
  for (const p of e.puntos) if (p.value !== null) conValor.set(p.date, p);
  const sin = new Set(e.sinRegistros.flatMap((h) => fechasEntre(h.desde, h.hasta)));
  return fechasEntre(e.desde, e.hasta).map((fecha) => {
    const p = conValor.get(fecha);
    const estado: EstadoDelDia = p ? (estadoDeMarca(p) === 'hueco' ? 'hueco' : 'con') : sin.has(fecha) ? 'sin' : 'nada';
    return { fecha, estado };
  });
}

/**
 * TB-16: la entrada sin lo anterior al vínculo del área: sin sus puntos y sin sus días sin registros. Los días que quedan
 * antes del vínculo no tienen estado («nada»), así que la tira no los dibuja.
 */
export function recortadaAlVinculo(e: EntradaDelIndicador): EntradaDelIndicador {
  const corte = e.desdeElVinculo;
  if (!corte || corte <= e.desde) return e;
  return {
    ...e,
    puntos: e.puntos.filter((p) => p.date >= corte),
    sinRegistros: e.sinRegistros.filter((h) => h.hasta >= corte).map((h) => (h.desde < corte ? { desde: corte, hasta: h.hasta } : h)),
  };
}

/** Las celdas de la tira: una por día con lugar de sobra; con poco, los días seguidos del mismo estado, juntos. */
function tiraDe(e: EntradaDelIndicador, dias: readonly string[], porDia: number): GeometriaDelIndicador['tira'] {
  const estados = estadosDeLosDias(e);
  const celdas: { x: number; ancho: number; estado: Exclude<EstadoDelDia, 'nada'> }[] = [];
  if (porDia < LUGAR_PARA_MARCAR_CADA_DIA) {
    for (let i = 0; i < estados.length; ) {
      let j = i;
      while (j + 1 < estados.length && estados[j + 1]?.estado === estados[i]?.estado) j += 1;
      const estado = estados[i]?.estado ?? 'nada';
      const a = Math.round(porDia * i);
      const b = Math.round(porDia * (j + 1)) - (j + 1 < dias.length ? 1 : 0);
      if (estado !== 'nada') celdas.push({ x: a, ancho: Math.max(b - a, 1), estado });
      i = j + 1;
    }
    return celdas;
  }
  const ancho = Math.max(porDia - (porDia >= 6 ? 2 : 1), 1);
  estados.forEach(({ estado }, i) => {
    if (estado !== 'nada') celdas.push({ x: sinRuido(porDia * i + (porDia - ancho) / 2), ancho: sinRuido(ancho), estado });
  });
  return celdas;
}

function hoyDe(e: EntradaDelIndicador, indiceDe: ReadonlyMap<string, number>, porDia: number): GeometriaDelIndicador['hoy'] {
  const i = indiceDe.get(e.hoy);
  return i === undefined ? null : { x: Math.round(porDia * i), ancho: Math.max(Math.round(porDia), 3) };
}
