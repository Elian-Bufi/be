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
  readonly caja: { readonly izquierda: number; readonly derecha: number; readonly arriba: number; readonly abajo: number };
}

/** El ancho estimado de una cifra del eje (letra de 12,5 px con cifras tabulares). */
const ANCHO_DE_CIFRA = 7.2;
const AIRE = 8;

/** Sin el ruido binario de una cuenta con decimales (0,95 / 0,05 no es 18,999999999999996). */
const sinRuido = (n: number): number => Number(n.toFixed(6));

/** Un paso «redondo» (1, 2 o 5 por una potencia de diez) para que dos marcas abarquen el rango. */
function pasoRedondo(rango: number): number {
  const bruto = rango / 2;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const m = sinRuido(bruto / potencia);
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * potencia;
}

/** Los dos extremos del eje vertical para un mínimo y un máximo: números redondos que encierran todos los valores. */
export function extremosDelEje(minimo: number, maximo: number): { readonly abajo: number; readonly arriba: number; readonly decimales: number } {
  // Con un solo valor (o todos iguales) no hay rango: se abre un margen alrededor, para que el punto no quede en un borde.
  const margen = maximo === minimo ? Math.abs(maximo) * 0.05 || 1 : 0;
  const paso = pasoRedondo(maximo - minimo + 2 * margen);
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
  const vacia = { puntos: [], tramos: [], sinRegistros: [], eje: [], inicioDelPlan: null, caja: { izquierda: 0, derecha: e.ancho, arriba: 0, abajo: e.alto } };
  if (dibujados.length === 0 || e.ancho <= 0 || e.alto <= 0) return vacia;

  const { abajo, arriba, decimales } = extremosDelEje(Math.min(...dibujados.map((d) => d.v)), Math.max(...dibujados.map((d) => d.v)));
  const textos = [abajo, arriba].map((v) => numeroConPrecision(v, decimales));
  const caja = {
    izquierda: Math.max(...textos.map((t) => t.length)) * ANCHO_DE_CIFRA + AIRE,
    derecha: e.ancho - AIRE,
    arriba: AIRE,
    abajo: e.alto - AIRE,
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

  return {
    puntos,
    tramos,
    sinRegistros,
    eje: [
      { y: yEn(arriba), valor: arriba, texto: textos[1] as string },
      { y: yEn(abajo), valor: abajo, texto: textos[0] as string },
    ],
    inicioDelPlan: plan !== null && plan > x0 && plan < x1 ? xEn(plan) : null,
    caja,
  };
}
