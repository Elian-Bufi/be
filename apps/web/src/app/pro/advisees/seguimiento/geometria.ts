/**
 * La geometría que comparten los gráficos de la ficha, sin la biblioteca de gráficos (WP-ESCRITORIO-AMABLE, parte 3):
 * dónde cae un punto en el eje de fechas, qué días se sombrean y cómo se arma el minigráfico de un indicador del
 * Resumen. Va aparte de `lienzo.tsx` para que el Resumen, que se carga con la ficha, no arrastre esa biblioteca: la usa
 * solo «Analizar», y recién cuando se abre.
 *
 * Son funciones puras: no leen la pantalla ni la hora. Tienen su prueba en `scripts/geometria-del-minigrafico.test.mjs`.
 */
import { numeroConPrecision, type PuntoAnalitico } from '@be/domain';

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
}

export interface PuntoDelMinigrafico {
  readonly clave: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Un subtotal, o un día o una semana sin completar: se dibuja hueco. */
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

/** Los dos extremos del eje vertical para un mínimo y un máximo: números redondos que encierran todos los valores. */
export function extremosDelEje(minimo: number, maximo: number, divisiones = 2): { readonly abajo: number; readonly arriba: number; readonly decimales: number } {
  // Con un solo valor (o todos iguales) no hay rango: se abre un margen alrededor, para que el punto no quede en un borde.
  const margen = maximo === minimo ? Math.abs(maximo) * 0.05 || 1 : 0;
  const paso = pasoRedondo(maximo - minimo + 2 * margen, divisiones);
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
 * - **No se quita ningún punto:** con muchos días en poco ancho se achica la marca.
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
  const { abajo, arriba, decimales } = extremosDelEje(Math.min(...valores), Math.max(...valores), e.divisionesDelEje ?? 2);
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

  // El tamaño de la marca sale del lugar que hay por día (la misma regla de «Analizar», más chica).
  const porDia = anchoUtil / Math.max(1, Math.round((x1 - x0) / DIA));
  const radio = porDia >= 9 ? 3 : porDia >= 5 ? 2.5 : porDia >= 2.5 ? 2 : 1.6;
  const puntos = dibujados.map(({ p, x, v }) => {
    const hueco = p.quality === 'PARTIAL' || p.partialBucket;
    const clase = p.dataClass === 'REPORTED' || p.dataClass === 'DERIVED' ? p.dataClass : null;
    // Una marca hueca, cortada o con un punto adentro necesita un mínimo para verse como tal.
    return { clave: p.pointId, x: xEn(x), y: yEn(v), r: hueco || clase ? Math.max(radio + 0.8, clase ? 3.6 : 2.6) : radio, hueco, clase };
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
