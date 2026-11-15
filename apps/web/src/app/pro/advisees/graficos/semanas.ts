/**
 * Una serie diaria con huecos, por semana (WP-GRAFICOS, pasada visual del 15/11; DISENO-VISUAL §1, principio 6): una
 * barra por semana de BE (de lunes a domingo) con la media de los días con dato, y los días como puntos tenues detrás. Es
 * el grano semanal que BE ya usa en el Resumen (`geometriaDelIndicador`), no un suavizado: la media dice con cuántos días
 * se hizo.
 * - **La media es la de la tabla:** los días con valor, los subtotales incluidos (como `resumirPeriodo` del dominio), sin
 *   hoy, que sigue en curso. Así la barra y la columna de la etapa dicen lo mismo.
 * - **Cada media dice con qué días se hizo, cuántos quedaron afuera y por qué** (§5.13; revisión de #283): cuántos días
 *   con valor y cuántos de ellos son subtotales; cuántos sin registros, cuántos con registros sin valor y si hoy quedó
 *   afuera (`lecturaDeLaSemana`).
 * - **Un hueco es un hueco:** un tramo sin ningún día con dato no tiene valor (nunca un cero) y se dibuja como una
 *   columna gris de todo el alto, que no se puede leer como una barra en cero.
 * - **La barra llena solo si la semana está entera:** siete días, todos con valor, sin subtotales y sin hoy. Si no, va
 *   hueca (el contorno, sin relleno): una semana con 1 día de 7 no se dibuja igual que una con 7. Debajo, la tira de
 *   cobertura dice el estado de cada día (con valor, con algo que falta, sin registros), como en el Resumen.
 * - **Las semanas no cruzan el cambio de etapa:** con `cortes` (el primer día de cada etapa y el siguiente al último),
 *   una semana que los cruza se parte en dos tramos, cada uno con su media. En una comparación de dos etapas, ninguna
 *   barra mezcla días de A con días de B.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import { lunesDe } from '@be/domain';
import { textoDelEje } from './eje-de-fechas';
import { marcasRedondas } from './ejes';

const DIA = 86_400_000;
const mediodia = (f: string): number => Date.parse(`${f}T12:00:00Z`);
const fechaDe = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const diaSiguiente = (f: string): string => fechaDe(mediodia(f) + DIA);

export interface DiaDeLaSerie {
  readonly fecha: string;
  /** `null`: el día no tiene dato (no es un cero). */
  readonly valor: number | null;
  /** Un subtotal (le falta algo: registros sin cantidades, una comida del plan sin registro): entra en la media y se dice. */
  readonly parcial?: boolean;
  /** El día tiene registros, pero ningún valor de esta métrica (`valor: null`): no es un día sin registros. */
  readonly conRegistros?: boolean;
  /** El día sigue en curso para la API (`partialBucket`), aunque el navegador ya esté en otro: no entra, como hoy. */
  readonly enCurso?: boolean;
}

export interface SemanaDeLaSerie {
  /** El lunes de la semana (aunque caiga antes del período). */
  readonly lunes: string;
  /** El primer y el último día del tramo: la semana dentro del período y dentro de una sola etapa. */
  readonly desde: string;
  readonly hasta: string;
  /** La media de los días con valor, sin hoy; `null` si no hay ninguno (el tramo queda vacío). */
  readonly valor: number | null;
  /** Con cuántos días se hizo la media (con valor, sin hoy). */
  readonly conDato: number;
  /** De esos, cuántos son subtotales. */
  readonly subtotales: number;
  /** Los que quedaron afuera, por qué: con registros pero sin valor, y sin registros (sin contar hoy). */
  readonly sinValor: number;
  readonly sinRegistros: number;
  /** Cuántos días tiene el tramo dentro del período, con hoy si cae adentro. */
  readonly dias: number;
  /** Hoy cae en el tramo: sigue en curso y no entra en la media. */
  readonly conHoy: boolean;
  /** Hoy ya tiene un valor, que entra cuando termine el día. */
  readonly hoyConDato: boolean;
  /** El tramo tiene menos de siete días: lo corta el período o un cambio de etapa. */
  readonly cortada: boolean;
  /** Siete días, todos con valor, sin subtotales y sin hoy: la barra va llena. */
  readonly completa: boolean;
  /** Lo contrario de `completa`: la barra va hueca. */
  readonly hueca: boolean;
}

/** Desde cuántos días de período una serie diaria va por semana por omisión; con menos, los días se leen sin peine. */
export const POR_SEMANA_CON_MAS_DE_DIAS = 42;

/** Cuántos días tiene el período, con los dos extremos. */
export const diasDelPeriodo = (desde: string, hasta: string): number => (hasta < desde ? 0 : Math.round((mediodia(hasta) - mediodia(desde)) / DIA) + 1);

/** Si una serie diaria se muestra por semana de entrada: con un período de más de seis semanas («Día por día», a un toque). */
export const convienePorSemana = (desde: string, hasta: string): boolean => diasDelPeriodo(desde, hasta) > POR_SEMANA_CON_MAS_DE_DIAS;

/** Los días donde empieza un tramo nuevo, para unas etapas: el primero de cada una y el siguiente a su último. */
export const cortesDeLasEtapas = (etapas: readonly { readonly desde: string; readonly hasta: string }[]): string[] =>
  [...new Set(etapas.flatMap((e) => [e.desde, diaSiguiente(e.hasta)]))].sort();

/**
 * Los tramos semanales que tocan el período, en orden: cada semana de BE, partida donde empieza un tramo nuevo (`cortes`),
 * con la media de los días con valor (sin hoy) y lo que quedó afuera. Un tramo sin ningún día con valor está, con
 * `valor: null`: se dibuja vacío, nunca en cero.
 */
export function semanasDeLosDias(dias: readonly DiaDeLaSerie[], desde: string, hasta: string, hoy: string, cortes: readonly string[] = []): SemanaDeLaSerie[] {
  if (hasta < desde) return [];
  const porFecha = new Map<string, DiaDeLaSerie>();
  for (const d of dias) if (d.fecha >= desde && d.fecha <= hasta) porFecha.set(d.fecha, d);
  const conValor = (f: string): DiaDeLaSerie | null => {
    const d = porFecha.get(f);
    return d && d.valor !== null && Number.isFinite(d.valor) ? d : null;
  };
  const enCurso = (f: string): boolean => f === hoy || porFecha.get(f)?.enCurso === true;
  const empiezaTramo = new Set(cortes);
  const semanas: SemanaDeLaSerie[] = [];
  let lunes = lunesDe(desde);
  while (lunes <= hasta) {
    const delPeriodo: string[] = [];
    for (let i = 0; i < 7; i++) {
      const f = fechaDe(mediodia(lunes) + i * DIA);
      if (f >= desde && f <= hasta) delPeriodo.push(f);
    }
    // La semana, partida donde empieza un tramo nuevo (el cambio de etapa).
    const tramos: string[][] = [];
    for (const f of delPeriodo) {
      if (tramos.length === 0 || empiezaTramo.has(f)) tramos.push([f]);
      else (tramos[tramos.length - 1] as string[]).push(f);
    }
    for (const tramo of tramos) {
      const cerrados = tramo.filter((f) => !enCurso(f));
      const contados = cerrados.flatMap((f) => {
        const d = conValor(f);
        return d ? [d] : [];
      });
      const sinValor = cerrados.filter((f) => conValor(f) === null && porFecha.get(f)?.conRegistros === true).length;
      const conHoy = tramo.some(enCurso);
      const subtotales = contados.filter((d) => d.parcial === true).length;
      const valor = contados.length === 0 ? null : contados.reduce((s, d) => s + (d.valor as number), 0) / contados.length;
      const completa = tramo.length === 7 && !conHoy && contados.length === 7 && subtotales === 0;
      semanas.push({
        lunes,
        desde: tramo[0] as string,
        hasta: tramo[tramo.length - 1] as string,
        valor,
        conDato: contados.length,
        subtotales,
        sinValor,
        sinRegistros: cerrados.length - contados.length - sinValor,
        dias: tramo.length,
        conHoy,
        hoyConDato: tramo.some((f) => enCurso(f) && conValor(f) !== null),
        cortada: tramo.length < 7,
        completa,
        hueca: !completa,
      });
    }
    lunes = fechaDe(mediodia(lunes) + 7 * DIA);
  }
  return semanas;
}

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** El denominador de un tramo: «5 de 7 días» (los días cerrados: sin hoy), o «ningún día con valor». */
export const denominadorDeLaSemana = (s: Pick<SemanaDeLaSerie, 'conDato' | 'dias' | 'conHoy'>): string => {
  const cerrados = s.dias - (s.conHoy ? 1 : 0);
  return s.conDato === 0 ? 'ningún día con valor' : `${s.conDato} de ${plural(cerrados, 'día', 'días')}`;
};

/** Cuándo es un tramo: «Semana del 3 nov» si es la semana entera; «Del 4 al 8 mar», «Del 30 nov al 2 dic» o «El 2 mar» si está cortado. */
export function cuandoEsLaSemana(s: Pick<SemanaDeLaSerie, 'lunes' | 'desde' | 'hasta' | 'cortada'>): string {
  if (!s.cortada) return `Semana del ${textoDelEje(s.lunes, false)}`;
  if (s.desde === s.hasta) return `El ${textoDelEje(s.desde, false)}`;
  // «Del 2 al 3 nov» si es el mismo mes; «Del 30 nov al 2 dic» si no.
  const desde = s.desde.slice(0, 7) === s.hasta.slice(0, 7) ? String(Number(s.desde.slice(8, 10))) : textoDelEje(s.desde, false);
  return `Del ${desde} al ${textoDelEje(s.hasta, false)}`;
}

/** Un número de la lectura: sin decimales desde 100, con uno por debajo («1.850», «3,8»). */
const valorEnPocas = (v: number): string => v.toLocaleString('es-AR', { maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 1 });

/**
 * Lo que dice un tramo, entero (§5.13): la media con cuántos días se hizo y cuántos son subtotales, y lo que quedó afuera
 * con su motivo. «Semana del 3 nov: 1.850 kcal, media de 5 de 7 días (1 subtotal); fuera de la media: 2 días sin
 * registros». Lo usan la lectura debajo del gráfico, el globo y la tabla de las semanas.
 */
export function lecturaDeLaSemana(s: SemanaDeLaSerie, unidad: string): string {
  const afuera = [
    ...(s.sinRegistros > 0 ? [plural(s.sinRegistros, 'día sin registros', 'días sin registros')] : []),
    ...(s.sinValor > 0 ? [plural(s.sinValor, 'día con registros sin este valor', 'días con registros sin este valor')] : []),
    ...(s.conHoy ? [s.hoyConDato ? 'hoy, que sigue en curso (entra cuando termine)' : 'hoy, que sigue en curso'] : []),
  ];
  const resto = afuera.length > 0 ? `; fuera de la media: ${afuera.join(', ')}` : '';
  if (s.valor === null) return `${cuandoEsLaSemana(s)}: ningún día con valor${resto}`;
  const subtotales = s.subtotales > 0 ? ` (${plural(s.subtotales, 'subtotal', 'subtotales')})` : '';
  return `${cuandoEsLaSemana(s)}: ${valorEnPocas(s.valor)} ${unidad}, media de ${denominadorDeLaSemana(s)}${subtotales}${resto}`;
}

/** El tramo que se lee de entrada: el último con valor (o el último, si ninguno tiene). */
export const tramoDeEntrada = (semanas: readonly SemanaDeLaSerie[]): number => {
  for (let i = semanas.length - 1; i >= 0; i--) if (semanas[i]?.valor !== null) return i;
  return semanas.length - 1;
};

/**
 * Lo que dice el gráfico entero al lector de pantalla, sin primero contra último: cuántos tramos tienen media, entre qué
 * valores van, cuántos tienen todos sus días y cuántos ninguno.
 */
export function resumenDeLasSemanas(semanas: readonly SemanaDeLaSerie[], unidad: string): string {
  const conValor = semanas.filter((s) => s.valor !== null);
  const vacias = semanas.length - conValor.length;
  if (conValor.length === 0) return `Ningún tramo con valor: ${plural(semanas.length, 'tramo', 'tramos')} sin días con valor.`;
  const valores = conValor.map((s) => s.valor as number);
  const bajo = valorEnPocas(Math.min(...valores));
  const alto = valorEnPocas(Math.max(...valores));
  const enteras = conValor.filter((s) => s.completa).length;
  return `${[
    `${plural(conValor.length, 'tramo con media', 'tramos con media')}${bajo === alto ? `, de ${bajo} ${unidad}` : `, entre ${bajo} y ${alto} ${unidad}`}`,
    `${enteras} con todos sus días con valor`,
    ...(vacias > 0 ? [plural(vacias, 'tramo sin días con valor', 'tramos sin días con valor')] : []),
  ].join('; ')}. Cada media, con sus días, está en la tabla de las semanas.`;
}

// ─── El dibujo por semana de un gráfico chico (GR-24 y los que lo usen) ──────────────────────────

export interface EntradaPorSemana {
  readonly dias: readonly DiaDeLaSerie[];
  readonly desde: string;
  readonly hasta: string;
  readonly hoy: string;
  readonly ancho: number;
  readonly alto: number;
  /** Tramos rotulados del eje (las etapas A y B): su letra va en una franja propia, arriba, y cortan las semanas. */
  readonly bandas?: readonly { readonly desde: string; readonly hasta: string; readonly rotulo: string }[];
  /** Lo planificado en la misma unidad (el objetivo), un escalón por versión: entra en el eje. */
  readonly plan?: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
  /** Las fechas del pie. */
  readonly fechas?: readonly string[];
  /** Cómo se escribe una fecha del pie, para medir su ancho («15 nov 2025» mide más que «2 mar»). */
  readonly textoDeLaFecha?: (f: string) => string;
}

/** El estado de un día en la tira de cobertura: con valor, con algo que falta (subtotal o sin valor), sin registros u hoy. */
export type EstadoDelDiaPorSemana = 'con' | 'hueco' | 'sin' | 'hoy';

export interface GeometriaPorSemana {
  readonly caja: { readonly izquierda: number; readonly derecha: number; readonly arriba: number; readonly abajo: number };
  readonly semanas: readonly SemanaDeLaSerie[];
  /** Un lugar por tramo: su barra (si tiene valor) o su columna vacía, y dónde está para elegirlo. */
  readonly tramos: readonly { readonly indice: number; readonly x: number; readonly ancho: number; readonly y: number | null; readonly semana: SemanaDeLaSerie }[];
  /** Una barra por tramo con dato, desde cero (las barras son lo único que arranca en cero). */
  readonly barras: readonly { readonly lunes: string; readonly x: number; readonly ancho: number; readonly y: number; readonly hueca: boolean; readonly semana: SemanaDeLaSerie }[];
  /** Los tramos sin ningún día con dato: una columna gris de todo el alto, nunca una barra en cero. */
  readonly vacias: readonly { readonly lunes: string; readonly x: number; readonly ancho: number; readonly semana: SemanaDeLaSerie }[];
  /** Los días con dato (sin hoy, que no entra en la media), como puntos tenues detrás. */
  readonly dias: readonly { readonly fecha: string; readonly x: number; readonly y: number }[];
  /** La tira de cobertura, debajo del dibujo: un rectángulo por día, con su estado. */
  readonly tira: readonly { readonly fecha: string; readonly x: number; readonly ancho: number; readonly estado: EstadoDelDiaPorSemana }[];
  readonly yDeLaTira: number;
  /** De 3 a 5 marcas redondas, con su grilla. */
  readonly eje: readonly { readonly y: number; readonly valor: number; readonly texto: string }[];
  readonly bandas: readonly { readonly x: number; readonly ancho: number; readonly rotulo: string }[];
  readonly plan: readonly { readonly x1: number; readonly x2: number; readonly y: number }[];
  readonly fechas: readonly { readonly x: number; readonly fecha: string; readonly ancla: 'start' | 'middle' | 'end' }[];
}

/**
 * El relleno de la semana entera y el de la hueca, y el de los puntos de los días (revisión de #283; DISENO-VISUAL §1,
 * principio 10): la entera llega a 3:1 contra la superficie en los dos temas (y contra la hueca), y la hueca se distingue
 * además por su contorno entero. Los puntos de los días, también a 3:1 donde no los tapa una barra. Lo mide
 * TEST-GRV-013 con los colores de `tokens.css`.
 */
export const RELLENO_ENTERA = 0.72;
export const RELLENO_HUECA = 0.06;
export const OPACIDAD_DE_LOS_DIAS = 0.72;

const FRANJA_DE_LETRAS = 14;
const PIE = 18;
const AIRE = 8;
/** La tira de cobertura: 5 de alto y 4 de aire arriba. */
export const ALTO_DE_LA_TIRA = 5;
const ZONA_DE_LA_TIRA = ALTO_DE_LA_TIRA + 4;
/** El ancho de una letra de 12,5 px, para que dos fechas del pie no se peguen. */
const ANCHO_DE_UNA_LETRA = 7;

/**
 * La geometría de un gráfico chico por semana: las barras con la media de cada tramo (desde cero), los tramos sin dato
 * como una columna gris, los días como puntos tenues detrás, la tira de cobertura y el eje de 3 a 5 marcas redondas.
 */
export function geometriaPorSemana(e: EntradaPorSemana): GeometriaPorSemana {
  const cortes = cortesDeLasEtapas(e.bandas ?? []).filter((f) => f > e.desde && f <= e.hasta);
  const semanas = semanasDeLosDias(e.dias, e.desde, e.hasta, e.hoy, cortes);
  const diasConDato = e.dias.filter((d) => d.valor !== null && Number.isFinite(d.valor) && d.fecha >= e.desde && d.fecha <= e.hasta && d.fecha !== e.hoy && d.enCurso !== true);
  const valores = [0, ...semanas.flatMap((s) => (s.valor === null ? [] : [s.valor])), ...diasConDato.map((d) => d.valor as number), ...(e.plan ?? []).map((p) => p.valor)];
  const eje = marcasRedondas(0, Math.max(...valores, 1));
  const textos = eje.valores.map((v) => v.toLocaleString('es-AR', { minimumFractionDigits: eje.decimales, maximumFractionDigits: eje.decimales }));
  const conFechas = (e.fechas ?? []).length > 0;
  const caja = {
    izquierda: Math.max(...textos.map((t) => t.length)) * 7.2 + AIRE,
    derecha: e.ancho - AIRE,
    arriba: AIRE + ((e.bandas ?? []).length > 0 ? FRANJA_DE_LETRAS : 0),
    abajo: e.alto - AIRE - (conFechas ? PIE : 0) - ZONA_DE_LA_TIRA,
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
  const tramos = semanas.map((s, indice) => ({ indice, ...lugar(s), y: s.valor === null ? null : yEn(s.valor), semana: s }));
  const barras = semanas.flatMap((s) => (s.valor === null ? [] : [{ lunes: s.lunes, ...lugar(s), y: yEn(s.valor), hueca: s.hueca, semana: s }]));
  const vacias = semanas.filter((s) => s.valor === null).map((s) => ({ lunes: s.lunes, ...lugar(s), semana: s }));
  const dias = diasConDato.map((d) => ({ fecha: d.fecha, x: xEn(mediodia(d.fecha)), y: yEn(d.valor as number) }));
  const porFecha = new Map(e.dias.map((d) => [d.fecha, d] as const));
  const porDia = anchoUtil / Math.max(1, diasDelPeriodo(e.desde, e.hasta));
  const tira: { fecha: string; x: number; ancho: number; estado: EstadoDelDiaPorSemana }[] = [];
  for (let f = e.desde; f <= e.hasta; f = diaSiguiente(f)) {
    const d = porFecha.get(f);
    const conValor = d !== undefined && d.valor !== null && Number.isFinite(d.valor);
    const estado: EstadoDelDiaPorSemana = f === e.hoy || d?.enCurso === true ? 'hoy' : conValor && d?.parcial !== true ? 'con' : conValor || d?.conRegistros === true ? 'hueco' : 'sin';
    tira.push({ fecha: f, x: xEn(mediodia(f) - DIA / 2), ancho: Math.max(0.5, porDia - (porDia >= 4 ? 1 : 0)), estado });
  }
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
  // La primera y la última van siempre, alineadas hacia adentro; una del medio, solo si no pisa a otra. El ancho de
  // cada una es el de su texto: con un ancho fijo, «15 nov 2025» y «2 mar» quedaban pegadas.
  const anchoDe = (f: string): number => (e.textoDeLaFecha ? e.textoDeLaFecha(f) : textoDelEje(f, false)).length * ANCHO_DE_UNA_LETRA;
  const candidatas = delPie.map((f, i) => ({ fecha: f, x: xEn(mediodia(f)), ancla: i === 0 ? ('start' as const) : i === delPie.length - 1 ? ('end' as const) : ('middle' as const) }));
  const lugarDe = (c: { fecha: string; x: number; ancla: 'start' | 'middle' | 'end' }): [number, number] => {
    const w = anchoDe(c.fecha);
    return c.ancla === 'start' ? [c.x, c.x + w] : c.ancla === 'end' ? [c.x - w, c.x] : [c.x - w / 2, c.x + w / 2];
  };
  const ocupadas = candidatas.filter((c) => c.ancla !== 'middle').map(lugarDe);
  const fechas = candidatas.filter((c) => {
    if (c.ancla !== 'middle') return true;
    const [x, y] = lugarDe(c);
    const libre = ocupadas.every(([oa, ob]) => y + 2 * AIRE <= oa || x - 2 * AIRE >= ob);
    if (libre) ocupadas.push([x, y]);
    return libre;
  });
  return {
    caja,
    semanas,
    tramos,
    barras,
    vacias,
    dias,
    tira,
    yDeLaTira: caja.abajo + 4,
    eje: eje.valores.map((valor, i) => ({ valor, y: yEn(valor), texto: textos[i] as string })),
    bandas,
    plan,
    fechas,
  };
}

/** El tramo que queda bajo una x del dibujo (para el mouse y el toque), o `null` si ninguno queda cerca. */
export function tramoEnX(g: Pick<GeometriaPorSemana, 'tramos'>, x: number): number | null {
  let mejor: { indice: number; distancia: number } | null = null;
  for (const t of g.tramos) {
    const distancia = x < t.x ? t.x - x : x > t.x + t.ancho ? x - (t.x + t.ancho) : 0;
    if (mejor === null || distancia < mejor.distancia) mejor = { indice: t.indice, distancia };
  }
  return mejor && mejor.distancia <= 6 ? mejor.indice : null;
}
