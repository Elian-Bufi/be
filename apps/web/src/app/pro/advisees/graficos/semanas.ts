/**
 * Una serie diaria con huecos, por semana (WP-GRAFICOS, pasada visual del 15/11; DISENO-VISUAL §1, principio 6): una
 * barra por semana de BE (de lunes a domingo) con la media de los días con dato y su denominador («5 de 7 días»), y los
 * días como puntos tenues detrás. Es el grano semanal que BE ya usa en el Resumen (`geometriaDelIndicador`), no un
 * suavizado: la media dice con cuántos días se hizo.
 * - **Un hueco es un hueco:** una semana sin ningún día con dato no tiene valor (nunca un cero) y se dibuja vacía, con
 *   una marca fina.
 * - **Hoy sigue en curso:** no entra en la media de su semana, y esa semana va hueca, como la que el período corta.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import { lunesDe } from '@be/domain';
import { marcasRedondas } from './ejes';

const DIA = 86_400_000;
const mediodia = (f: string): number => Date.parse(`${f}T12:00:00Z`);
const fechaDe = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export interface DiaDeLaSerie {
  readonly fecha: string;
  /** `null`: el día no tiene dato (no es un cero). */
  readonly valor: number | null;
  /** Un subtotal (le falta algo): la semana que lo usa va hueca. */
  readonly parcial?: boolean;
}

export interface SemanaDeLaSerie {
  /** El lunes de la semana (aunque caiga antes del período). */
  readonly lunes: string;
  /** El primer y el último día de la semana dentro del período. */
  readonly desde: string;
  readonly hasta: string;
  /** La media de los días con dato, sin hoy; `null` si no hay ninguno (la semana queda vacía). */
  readonly valor: number | null;
  /** El denominador: con cuántos días se hizo y cuántos días de la semana caen en el período. */
  readonly conDato: number;
  readonly dias: number;
  /** Incompleta (el período la corta o tiene hoy) o con algún subtotal: va hueca. */
  readonly hueca: boolean;
}

/** Desde cuántos días de período una serie diaria va por semana por omisión; con menos, los días se leen sin peine. */
export const POR_SEMANA_CON_MAS_DE_DIAS = 42;

/** Cuántos días tiene el período, con los dos extremos. */
export const diasDelPeriodo = (desde: string, hasta: string): number => (hasta < desde ? 0 : Math.round((mediodia(hasta) - mediodia(desde)) / DIA) + 1);

/** Si una serie diaria se muestra por semana de entrada: con un período de más de seis semanas («Día por día», a un toque). */
export const convienePorSemana = (desde: string, hasta: string): boolean => diasDelPeriodo(desde, hasta) > POR_SEMANA_CON_MAS_DE_DIAS;

/**
 * Las semanas de BE que tocan el período, en orden, con la media de los días con dato (sin hoy). Una semana sin ningún
 * día con dato está, con `valor: null`: se dibuja vacía, nunca en cero.
 */
export function semanasDeLosDias(dias: readonly DiaDeLaSerie[], desde: string, hasta: string, hoy: string): SemanaDeLaSerie[] {
  if (hasta < desde) return [];
  const porFecha = new Map<string, DiaDeLaSerie>();
  for (const d of dias) if (d.fecha >= desde && d.fecha <= hasta && d.valor !== null && Number.isFinite(d.valor)) porFecha.set(d.fecha, d);
  const semanas: SemanaDeLaSerie[] = [];
  let lunes = lunesDe(desde);
  while (lunes <= hasta) {
    const delPeriodo: string[] = [];
    for (let i = 0; i < 7; i++) {
      const f = fechaDe(mediodia(lunes) + i * DIA);
      if (f >= desde && f <= hasta) delPeriodo.push(f);
    }
    const contados = delPeriodo.filter((f) => f !== hoy).flatMap((f) => (porFecha.has(f) ? [porFecha.get(f) as DiaDeLaSerie] : []));
    const valor = contados.length === 0 ? null : contados.reduce((s, d) => s + (d.valor as number), 0) / contados.length;
    semanas.push({
      lunes,
      desde: delPeriodo[0] as string,
      hasta: delPeriodo[delPeriodo.length - 1] as string,
      valor,
      conDato: contados.length,
      dias: delPeriodo.length,
      hueca: delPeriodo.length < 7 || delPeriodo.includes(hoy) || contados.some((d) => d.parcial === true),
    });
    lunes = fechaDe(mediodia(lunes) + 7 * DIA);
  }
  return semanas;
}

/** El denominador de una semana: «5 de 7 días», «1 de 3 días», «sin días con dato». */
export const denominadorDeLaSemana = (s: Pick<SemanaDeLaSerie, 'conDato' | 'dias'>): string => (s.conDato === 0 ? 'sin días con dato' : `${s.conDato} de ${s.dias} ${s.dias === 1 ? 'día' : 'días'}`);

// ─── El dibujo por semana de un gráfico chico (GR-24 y los que lo usen) ──────────────────────────

export interface EntradaPorSemana {
  readonly dias: readonly DiaDeLaSerie[];
  readonly desde: string;
  readonly hasta: string;
  readonly hoy: string;
  readonly ancho: number;
  readonly alto: number;
  /** Tramos rotulados del eje (las etapas A y B): su letra va en una franja propia, arriba. */
  readonly bandas?: readonly { readonly desde: string; readonly hasta: string; readonly rotulo: string }[];
  /** Lo planificado en la misma unidad (el objetivo), un escalón por versión: entra en el eje. */
  readonly plan?: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
  /** Las fechas del pie. */
  readonly fechas?: readonly string[];
}

export interface GeometriaPorSemana {
  readonly caja: { readonly izquierda: number; readonly derecha: number; readonly arriba: number; readonly abajo: number };
  /** Una barra por semana con dato, desde cero (las barras son lo único que arranca en cero). */
  readonly barras: readonly { readonly lunes: string; readonly x: number; readonly ancho: number; readonly y: number; readonly hueca: boolean; readonly semana: SemanaDeLaSerie }[];
  /** Las semanas sin ningún día con dato: una marca fina en la base, nunca una barra en cero. */
  readonly vacias: readonly { readonly lunes: string; readonly x: number; readonly ancho: number; readonly semana: SemanaDeLaSerie }[];
  /** Los días con dato, como puntos tenues detrás. */
  readonly dias: readonly { readonly fecha: string; readonly x: number; readonly y: number }[];
  /** De 3 a 5 marcas redondas, con su grilla. */
  readonly eje: readonly { readonly y: number; readonly valor: number; readonly texto: string }[];
  readonly bandas: readonly { readonly x: number; readonly ancho: number; readonly rotulo: string }[];
  readonly plan: readonly { readonly x1: number; readonly x2: number; readonly y: number }[];
  readonly fechas: readonly { readonly x: number; readonly fecha: string; readonly ancla: 'start' | 'middle' | 'end' }[];
}

const FRANJA_DE_LETRAS = 14;
const PIE = 18;
const AIRE = 8;
const ANCHO_DE_FECHA = 52;

/**
 * La geometría de un gráfico chico por semana: las barras con la media de cada semana (desde cero), las semanas sin dato
 * como una marca fina, los días como puntos tenues detrás y el eje de 3 a 5 marcas redondas. Es puro.
 */
export function geometriaPorSemana(e: EntradaPorSemana): GeometriaPorSemana {
  const semanas = semanasDeLosDias(e.dias, e.desde, e.hasta, e.hoy);
  const diasConDato = e.dias.filter((d) => d.valor !== null && Number.isFinite(d.valor) && d.fecha >= e.desde && d.fecha <= e.hasta);
  const valores = [0, ...semanas.flatMap((s) => (s.valor === null ? [] : [s.valor])), ...diasConDato.map((d) => d.valor as number), ...(e.plan ?? []).map((p) => p.valor)];
  const eje = marcasRedondas(0, Math.max(...valores, 1));
  const textos = eje.valores.map((v) => v.toLocaleString('es-AR', { minimumFractionDigits: eje.decimales, maximumFractionDigits: eje.decimales }));
  const conFechas = (e.fechas ?? []).length > 0;
  const caja = {
    izquierda: Math.max(...textos.map((t) => t.length)) * 7.2 + AIRE,
    derecha: e.ancho - AIRE,
    arriba: AIRE + ((e.bandas ?? []).length > 0 ? FRANJA_DE_LETRAS : 0),
    abajo: e.alto - AIRE - (conFechas ? PIE : 0),
  };
  const x0 = mediodia(e.desde) - DIA / 2;
  const x1 = mediodia(e.hasta) + DIA / 2;
  const anchoUtil = Math.max(1, caja.derecha - caja.izquierda);
  const altoUtil = Math.max(1, caja.abajo - caja.arriba);
  const xEn = (ms: number): number => caja.izquierda + ((ms - x0) / (x1 - x0)) * anchoUtil;
  const yEn = (v: number): number => caja.abajo - ((v - eje.abajo) / (eje.arriba - eje.abajo || 1)) * altoUtil;
  const lugar = (s: SemanaDeLaSerie) => {
    const a = xEn(mediodia(s.desde) - DIA / 2);
    const b = xEn(mediodia(s.hasta) + DIA / 2);
    return { x: a + 1, ancho: Math.max(1, b - a - 2) };
  };
  const barras = semanas.flatMap((s) => (s.valor === null ? [] : [{ lunes: s.lunes, ...lugar(s), y: yEn(s.valor), hueca: s.hueca, semana: s }]));
  const vacias = semanas.filter((s) => s.valor === null).map((s) => ({ lunes: s.lunes, ...lugar(s), semana: s }));
  const dias = diasConDato.map((d) => ({ fecha: d.fecha, x: xEn(mediodia(d.fecha)), y: yEn(d.valor as number) }));
  const bandas = (e.bandas ?? []).flatMap((b) => {
    const a = Math.max(x0, mediodia(b.desde) - DIA / 2);
    const z = Math.min(x1, mediodia(b.hasta) + DIA / 2);
    return z > a ? [{ x: xEn(a), ancho: xEn(z) - xEn(a), rotulo: b.rotulo }] : [];
  });
  const plan = [...(e.plan ?? [])]
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .flatMap((s, i, todos) => {
      const siguiente = todos[i + 1];
      const a = Math.max(x0, mediodia(s.desde) - DIA / 2);
      const b = Math.min(x1, s.hasta ? mediodia(s.hasta) + DIA / 2 : x1, siguiente ? mediodia(siguiente.desde) - DIA / 2 : x1);
      return b > a ? [{ x1: xEn(a), x2: xEn(b), y: yEn(s.valor) }] : [];
    });
  const delPie = [...new Set(e.fechas ?? [])].filter((f) => f >= e.desde && f <= e.hasta).sort();
  // La primera y la última van siempre, alineadas hacia adentro; una del medio, solo si no pisa a otra.
  const candidatas = delPie.map((f, i) => ({ fecha: f, x: xEn(mediodia(f)), ancla: i === 0 ? ('start' as const) : i === delPie.length - 1 ? ('end' as const) : ('middle' as const) }));
  const lugarDe = (c: { x: number; ancla: 'start' | 'middle' | 'end' }): [number, number] => (c.ancla === 'start' ? [c.x, c.x + ANCHO_DE_FECHA] : c.ancla === 'end' ? [c.x - ANCHO_DE_FECHA, c.x] : [c.x - ANCHO_DE_FECHA / 2, c.x + ANCHO_DE_FECHA / 2]);
  const ocupadas = candidatas.filter((c) => c.ancla !== 'middle').map(lugarDe);
  const fechas = candidatas.filter((c) => {
    if (c.ancla !== 'middle') return true;
    const [x, y] = lugarDe(c);
    const libre = ocupadas.every(([oa, ob]) => y + AIRE <= oa || x - AIRE >= ob);
    if (libre) ocupadas.push([x, y]);
    return libre;
  });
  return {
    caja,
    barras,
    vacias,
    dias,
    eje: eje.valores.map((valor, i) => ({ valor, y: yEn(valor), texto: textos[i] as string })),
    bandas,
    plan,
    fechas,
  };
}
