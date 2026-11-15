/**
 * Nutrición por semana (WP-GRAFICOS fase 2, rama C; DL-174; pasada visual, GR-VC01): una serie diaria con muchos días sin
 * dato no se dibuja como un peine (DISENO-VISUAL §1, principio 6). De entrada, con más de seis semanas de período
 * (`convienePorSemana`, la misma regla que «Comparar dos etapas»), cada panel va con una barra por semana; «Día por día»
 * queda a un toque.
 *
 * La barra es la **media de la semana (v1)** de GR-12 (GR-T42), la misma en GR-12, GR-13 y GR-14:
 * - entran los días con cantidades en todos sus registros (llenos o con el contorno cortado), si son 4 o más;
 * - quedan afuera, y se cuentan por motivo, los días sin registro, los que tienen cantidades faltantes o un dato que
 *   falta y los que tienen comidas del plan sin registro: promediar solo los días cuidados es un sesgo de selección y se
 *   dice (§5.13);
 * - hoy y lo que viene no cuentan: el día sigue en curso;
 * - con menos de 4 no hay media: la semana es una columna gris, nunca una barra en cero (§5.4);
 * - la barra va llena solo si entran los siete días, todos con todo y sin hoy; si no, hueca, con su contorno.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { fechasDelRango, semanasDelPeriodo, type PuntoAnalitico } from '@be/domain';
import { cuandoEsLaSemana } from '../semanas';
import type { ElementoDeLaLeyenda, EstadoDelDiaEnLaTira, PanelDeValores, PorSemanaDelGrafico, SemanaDelPanel, TramoDeLasSemanas } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C, enumerar } from './copy';
import { faltanCantidades, puntosPorFecha, saberDelDia, valorDelDia, type MetricaDelGrafico } from './dias-de-nutricion';

/** Con menos días con cantidades en todos sus registros, una semana no tiene media (GR-T42). */
export const MINIMO_DE_DIAS_PARA_LA_MEDIA = 4;

export interface MediaDeLaSemana {
  readonly lunes: string;
  /** Los días de la semana que caen en el período: de dónde a dónde va el tramo. */
  readonly desde: string;
  readonly hasta: string;
  /** `null`: no alcanza, no hay media. */
  readonly valor: number | null;
  /** Los días que entraron en el promedio. */
  readonly incluidos: number;
  /** Los días que cuentan: los de la semana en el período, sin hoy ni los que vienen. */
  readonly dias: number;
  /** Los siete días entran, todos con todo registrado (sin días sin saber si faltan comidas) y sin hoy: la barra va llena. */
  readonly entera: boolean;
  /** «1.950 kcal por día de media · con 5 de 7 días; 1 sin registro y 1 con cantidades faltantes». */
  readonly texto: string;
}

/**
 * Las medias de las semanas que tocan [desde, hasta]. Entra cada día de la semana con un valor y cantidades en todos sus
 * registros (lleno o de contorno cortado); quedan afuera, y se cuentan, los días sin registro, los que tienen cantidades
 * faltantes o un dato que falta y los que tienen comidas del plan sin registro. Hoy y los días por venir no cuentan.
 */
export function mediasDeLasSemanas(puntos: readonly PuntoAnalitico[], metrica: MetricaDelGrafico, desde: string, hasta: string, hoy: string): MediaDeLaSemana[] {
  const porFecha = puntosPorFecha(puntos, desde, hasta);
  return semanasDelPeriodo(desde, hasta).map((s): MediaDeLaSemana => {
    const inicio = s.lunes < desde ? desde : s.lunes;
    const fin = s.domingo > hasta ? hasta : s.domingo;
    const cuentan = fechasDelRango(inicio, fin).filter((f) => f < hoy);
    let sinRegistro = 0;
    let conCantidadesFaltantes = 0;
    let conComidasSinRegistro = 0;
    let sinSaber = 0;
    const valores: number[] = [];
    for (const f of cuentan) {
      const p = porFecha.get(f);
      if (!p) sinRegistro++;
      else if (p.value === null) conCantidadesFaltantes++;
      else {
        const saber = saberDelDia(p);
        if (saber === 'CON_ALGO_QUE_FALTA') {
          if (faltanCantidades(p)) conCantidadesFaltantes++;
          else conComidasSinRegistro++;
        } else {
          if (saber === 'SIN_SABER_SI_FALTAN_COMIDAS') sinSaber++;
          valores.push(p.value);
        }
      }
    }
    const afuera = [
      ...(sinRegistro > 0 ? [C.media.sinRegistro(sinRegistro)] : []),
      ...(conCantidadesFaltantes > 0 ? [C.media.conCantidadesFaltantes(conCantidadesFaltantes)] : []),
      ...(conComidasSinRegistro > 0 ? [C.media.conComidasSinRegistro(conComidasSinRegistro)] : []),
    ];
    const conHoy = hoy >= inicio && hoy <= fin;
    const extras = [...(sinSaber > 0 ? [C.media.sinSaber(sinSaber)] : []), ...(conHoy ? [C.media.hoyAfuera] : [])];
    const conCuantos = [`${C.media.conDias(valores.length, cuentan.length)}${afuera.length > 0 ? `; ${enumerar(afuera)}` : ''}`, ...extras].join(' · ');
    const valor = valores.length >= MINIMO_DE_DIAS_PARA_LA_MEDIA ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
    return {
      lunes: s.lunes,
      desde: inicio,
      hasta: fin,
      valor,
      incluidos: valores.length,
      dias: cuentan.length,
      entera: valor !== null && !conHoy && cuentan.length === 7 && valores.length === 7 && sinSaber === 0,
      texto: valor === null ? C.media.sinMedia(MINIMO_DE_DIAS_PARA_LA_MEDIA, conCuantos) : C.media.valor(valorDelDia(valor, metrica), conCuantos),
    };
  });
}

/** Las semanas de un panel, para el lienzo: cada media con su tramo y lo que dice. */
export const semanasDelPanel = (medias: readonly MediaDeLaSemana[], id: string): SemanaDelPanel[] =>
  medias.map((m) => ({ clave: `${id}:${m.desde}`, desde: m.desde, hasta: m.hasta, valor: m.valor, entera: m.entera, texto: m.texto }));

/**
 * El estado de cada día del período en la tira de cobertura: entero con todo registrado, a media altura con algo que
 * falta (un subtotal, un día sin saber si faltan comidas o sin valor), una raya baja sin registros, y hoy aparte.
 */
export function coberturaDeLosDias(puntos: readonly PuntoAnalitico[], desde: string, hasta: string, hoy: string): { fecha: string; estado: EstadoDelDiaEnLaTira }[] {
  const porFecha = puntosPorFecha(puntos, desde, hasta);
  return fechasDelRango(desde, hasta)
    .filter((f) => f <= hoy)
    .map((fecha) => {
      const p = porFecha.get(fecha);
      const estado: EstadoDelDiaEnLaTira = fecha === hoy || p?.partialBucket ? 'hoy' : !p ? 'sin' : p.value !== null && saberDelDia(p) === 'CON_TODO' ? 'con' : 'hueco';
      return { fecha, estado };
    });
}

/** Las fichas de la leyenda de «Por semana»: solo las que se ven en el dibujo. */
export function leyendaPorSemana(paneles: readonly PanelDeValores[], extras: readonly ElementoDeLaLeyenda[] = []): ElementoDeLaLeyenda[] {
  const semanas = paneles.flatMap((p) => p.semanas);
  const L = C.porSemana.leyenda;
  return [
    ...(semanas.some((s) => s.valor !== null && s.entera) ? [{ clave: 'semana-entera', ...L.entera, muestra: { tipo: 'SEMANA', forma: 'ENTERA', color: 0 } } as const] : []),
    ...(semanas.some((s) => s.valor !== null && !s.entera) ? [{ clave: 'semana-hueca', ...L.hueca, muestra: { tipo: 'SEMANA', forma: 'HUECA', color: 0 } } as const] : []),
    ...(semanas.some((s) => s.valor === null) ? [{ clave: 'sin-media', ...L.sinMedia, muestra: { tipo: 'SEMANA', forma: 'SIN_MEDIA', color: 0 } } as const] : []),
    ...(paneles.some((p) => p.marcas.some((m) => m.color !== null)) ? [{ clave: 'cada-dia', ...L.cadaDia, muestra: { tipo: 'COBERTURA', color: 0 } } as const] : []),
    ...extras,
  ];
}

/**
 * Lo que se lee «Por semana»: una fila por tramo con lo que dice cada panel (y lo que el llamador sume, como lo indicado
 * de GR-14), la leyenda y el resumen para el lector de pantalla (cuántas semanas tienen media y entre qué valores, sin
 * primero contra último).
 */
export function porSemanaDelGrafico(e: {
  readonly paneles: readonly PanelDeValores[];
  /** Lo que se suma a cada columna en cada tramo (lo indicado de GR-14), en el orden de los paneles. */
  readonly sumar?: (panel: number, tramo: SemanaDelPanel) => string | null;
  readonly leyendaExtra?: readonly ElementoDeLaLeyenda[];
  readonly aclaraciones?: readonly string[];
}): PorSemanaDelGrafico | null {
  const conSemanas = e.paneles.filter((p) => p.semanas.length > 0);
  const primero = conSemanas[0];
  if (!primero) return null;
  const tramos = primero.semanas.map((s, i): TramoDeLasSemanas => {
    const lunes = semanasDelPeriodo(s.desde, s.desde)[0]?.lunes ?? s.desde;
    return {
      lunes,
      desde: s.desde,
      hasta: s.hasta,
      textos: conSemanas.map((p) => {
        const deEste = p.semanas[i] as SemanaDelPanel;
        const extra = e.sumar?.(e.paneles.indexOf(p), deEste) ?? null;
        return extra ? `${deEste.texto} · ${extra}` : deEste.texto;
      }),
      conMedia: conSemanas.some((p) => p.semanas[i]?.valor !== null && p.semanas[i] !== undefined),
    };
  });
  const resumen = conSemanas.map((p) => {
    const con = p.semanas.filter((s) => s.valor !== null);
    if (con.length === 0) return C.porSemana.resumenSinMedia(p.nombre, p.semanas.length);
    const valores = con.map((s) => s.valor as number);
    return C.porSemana.resumen(p.nombre, con.length, p.semanas.length, valorDelDia(Math.min(...valores), metricaDeLaUnidad(p.unidad)), valorDelDia(Math.max(...valores), metricaDeLaUnidad(p.unidad)), con.filter((s) => s.entera).length);
  });
  return {
    detalle: C.porSemana.detalle,
    leyenda: leyendaPorSemana(conSemanas, e.leyendaExtra),
    descripcion: `${resumen.join(' ')} ${C.porSemana.cadaMediaEnLaTabla}`,
    columnas: conSemanas.map((p) => ({ id: p.id, nombre: p.nombre, unidad: C.porSemana.unidadDeLaColumna(p.unidad) })),
    tramos,
    aclaraciones: [...C.porSemana.comoSeArma(MINIMO_DE_DIAS_PARA_LA_MEDIA), ...(e.aclaraciones ?? [])],
  };
}

/** Para escribir un valor con los decimales de su unidad (kcal enteras, gramos con uno). */
const metricaDeLaUnidad = (unidad: string): MetricaDelGrafico => (unidad === 'kcal' ? 'ENERGY' : 'PROTEIN');

/** «Semana del 3 nov», «Del 4 al 8 nov»: cuándo es un tramo, con las palabras de la base. */
export const nombreDelTramo = (t: Pick<TramoDeLasSemanas, 'lunes' | 'desde' | 'hasta'>): string =>
  cuandoEsLaSemana({ lunes: t.lunes, desde: t.desde, hasta: t.hasta, cortada: t.desde !== t.lunes || fechasDelRango(t.desde, t.hasta).length < 7 });

/** «3 de 21 días con registros cargados después»: a la vista (§5.14), o nada. */
export function loCargadoDespuesEnElPeriodo(marcas: readonly { readonly fecha: string; readonly tarde: boolean }[]): string[] {
  const dias = new Set(marcas.map((m) => m.fecha));
  const tarde = new Set(marcas.filter((m) => m.tarde).map((m) => m.fecha));
  return tarde.size === 0 ? [] : [C.tardeEnElPeriodo(tarde.size, dias.size)];
}

