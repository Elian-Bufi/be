/**
 * RP-20 y RP-21 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Las franjas por comida, sin React. Dirección, al recorrer el plan
 * (22/11): «que se vea cómo, sumando alimentos, se va llegando a los macros planteados para esa comida y si entra dentro
 * del margen». Lo crítico no es la suma del día (da bien por construcción): es que cada opción o receta caiga dentro del
 * rango de su comida y que, en promedio, vaya por buen camino.
 *
 * - **Un renglón por kcal, P, C y G** (RP-D40). La banda es el rango indicado de la comida; las kcal salen de sus gramos,
 *   con 4, 4 y 9 kcal por gramo, como la suma de NUP-06: el rango del plan no tiene kcal (RP-D41).
 * - **La escala va de 0 al doble del centro del rango** (RP-D42): con el mismo margen, la banda queda en el mismo lugar y
 *   con el mismo ancho en los cuatro renglones, y adentro o afuera se lee de un vistazo. Lo que pasa del borde se fija al
 *   borde, con su flecha.
 * - **Ubica, no califica** (NUP-D05): «adentro», «por encima, 6 g», «por debajo, 4 g», en gramos o kcal, nunca un «%»
 *   suelto; sin rojo ni verde y sin bloquear nada. La cuenta de dónde queda es `ubicar` (`planificacion.ts`).
 * - **Lo que no se puede ubicar se dice una vez:** una opción sin alimentos no cuenta; una que se está leyendo (o una
 *   receta que se calcula al guardar) espera en su lugar; una con un dato que falta dice «sin dato» en el resumen.
 * - **RP-23: el promedio, y las opciones que se eligen** (Dirección, 22/11: «se ven muy sucias» con todas las opciones).
 *   La franja de la comida y la del panel muestran la banda y la raya del promedio (con una sola opción, su valor); cada
 *   opción tiene su casilla y su color (`colorDeLaOpcion`), y solo las tildadas suman su punto, en su color, lleno adentro
 *   y hueco afuera (RP-D80 a RP-D83). El lector de pantalla sigue oyendo todas las opciones, y cuáles están en las barras.
 */
import { MACROS_DEL_RANGO, numero, type MacroDelRango, type Nutrientes, type Rango as RangoIndicado } from '@be/domain';
import { cantidadAbreviada, cifraDeLosLimites, type MacroConIcono } from './abreviaturas-de-macros';
import { KCAL_POR_GRAMO, ubicar, type Limites, type Ubicacion } from './planificacion';
import type { NutrienteDelRango, PorQueFalta, Rango, RangoPorNutriente, TotalDeLaOpcion } from './rangos';

/** Los cuatro renglones de la franja, en el orden de toda la pantalla: kcal, proteínas, carbohidratos y grasas. */
export const RENGLONES_DE_LA_FRANJA = ['kcal', 'protein', 'carbohydrate', 'fat'] as const satisfies readonly MacroConIcono[];
export type RenglonDeLaFranja = (typeof RENGLONES_DE_LA_FRANJA)[number];

export const NUTRIENTE_DEL_RENGLON: Readonly<Record<RenglonDeLaFranja, NutrienteDelRango>> = { kcal: 'energyKcal', protein: 'proteinG', carbohydrate: 'carbohydrateG', fat: 'fatG' };

/** Los nombres completos, para el lector de pantalla. */
export const NOMBRE_DEL_RENGLON: Readonly<Record<RenglonDeLaFranja, string>> = { kcal: 'Energía', protein: 'Proteínas', carbohydrate: 'Carbohidratos', fat: 'Grasas' };

const aUnDecimal = (n: number): number => Math.round(n * 10) / 10;
/** Un valor como se compara y se muestra: las kcal, enteras; los gramos, a un decimal. */
const comoSeMuestra = (r: RenglonDeLaFranja, n: number): number => (r === 'kcal' ? Math.round(n) : aUnDecimal(n));
const cifra = (r: RenglonDeLaFranja, n: number): string => (r === 'kcal' ? numero(n, 0) : numero(n, 1));
/** «6 g», «120 kcal»: una diferencia, sin la letra del macro (ya la dice el renglón). */
const conSuUnidad = (r: RenglonDeLaFranja, n: number): string => `${cifra(r, n)} ${r === 'kcal' ? 'kcal' : 'g'}`;
/** «28 g P», «545 kcal»: un valor con su abreviatura. */
export const conSuMacro = (r: RenglonDeLaFranja, n: number): string => cantidadAbreviada(r, cifra(r, n));

/**
 * Los límites de un renglón, desde el rango indicado de la comida (o del día). P, C y G: sus gramos. Las kcal (RP-D41):
 * las que implican los gramos, con 4, 4 y 9 kcal por gramo, solo si los tres macros tienen rango (con uno solo, el piso
 * de las kcal sería el de ese macro y casi todo quedaría «adentro»). El piso existe si algún macro tiene mínimo (un mínimo
 * que falta cuenta como cero, como en la suma de NUP-06) y el tope, si los tres tienen máximo. `null`: sin rango en ese
 * renglón.
 */
export function limitesDelRenglon(rango: RangoIndicado | null, r: RenglonDeLaFranja): Limites | null {
  if (!rango) return null;
  const delMacro = (m: MacroDelRango): Limites | null => {
    const g = rango[m]?.grams;
    return g && (g.min !== null || g.max !== null) ? { min: g.min, max: g.max } : null;
  };
  if (r !== 'kcal') return delMacro(r);
  if (MACROS_DEL_RANGO.some((m) => delMacro(m) === null)) return null;
  const conMinimo = MACROS_DEL_RANGO.some((m) => (rango[m]?.grams.min ?? null) !== null);
  const conTope = MACROS_DEL_RANGO.every((m) => (rango[m]?.grams.max ?? null) !== null);
  const min = conMinimo ? Math.round(MACROS_DEL_RANGO.reduce((s, m) => s + (rango[m]?.grams.min ?? 0) * KCAL_POR_GRAMO[m], 0)) : null;
  const max = conTope ? Math.round(MACROS_DEL_RANGO.reduce((s, m) => s + rango[m]!.grams.max! * KCAL_POR_GRAMO[m], 0)) : null;
  return min === null && max === null ? null : { min, max };
}

/**
 * RP-D42: hasta dónde llega la escala del renglón: el doble del centro del rango (con un solo lado, ese lado es el
 * centro). Un rango en cero no tiene centro: la escala llega un poco más allá del mayor de los valores.
 */
export function topeDeLaEscala(l: Limites, valores: readonly number[] = []): number {
  const centro = l.min !== null && l.max !== null ? (l.min + l.max) / 2 : (l.min ?? l.max ?? 0);
  if (centro > 0) return 2 * centro;
  return Math.max(1, ...valores) * 1.15;
}

/** Dónde va un valor en la pista, de 0 a 100, y si se fijó al borde porque la escala no le alcanza. */
export function posicionEnLaPista(valor: number, tope: number): { readonly posicion: number; readonly fijada: 'izquierda' | 'derecha' | null } {
  if (valor > tope) return { posicion: 100, fijada: 'derecha' };
  if (valor < 0) return { posicion: 0, fijada: 'izquierda' };
  return { posicion: aUnDecimal((valor / tope) * 100), fijada: null };
}

/** La banda del rango en la pista: de dónde a dónde, y si no tiene tope (se desvanece hacia la derecha). */
export interface BandaEnLaPista {
  readonly desde: number;
  readonly hasta: number;
  readonly sinTope: boolean;
}

export function bandaEnLaPista(l: Limites, tope: number): BandaEnLaPista {
  return { desde: posicionEnLaPista(l.min ?? 0, tope).posicion, hasta: l.max === null ? 100 : posicionEnLaPista(l.max, tope).posicion, sinTope: l.max === null };
}

/** «adentro», «por encima, 6 g», «por debajo, 120 kcal». */
export function ubicacionEnPalabras(u: Ubicacion, r: RenglonDeLaFranja): string {
  return u.tipo === 'dentro' ? 'adentro' : `por ${u.tipo === 'encima' ? 'encima' : 'debajo'}, ${conSuUnidad(r, u.diferencia)}`;
}

/** «25 a 31 g P», «desde 480 kcal», «hasta 20 g G». */
export const limitesConSuMacro = (l: Limites, r: RenglonDeLaFranja): string => cantidadAbreviada(r, cifraDeLosLimites(l.min, l.max));

// ─── Las opciones de una comida ──────────────────────────────────────────────────────────────────────────────────

/** Una opción, como la mira la franja: su identidad (para recordar dónde estaba), su nombre y su total. */
export interface OpcionParaLaFranja {
  /** La identidad de la opción (o su lugar, si todavía no se guardó): con ella se recuerda dónde estaba su marca. */
  readonly clave: string;
  /** «Opción 1», «2 · Pollo»: va en la pista de la marca y en el texto accesible. */
  readonly nombre: string;
  readonly total: TotalDeLaOpcion | null;
  /** RP-23: el lugar de la opción en su comida (0, 1, 2…): de ahí sale su color (`colorDeLaOpcion`). */
  readonly lugar?: number;
}

/** Una opción ubicada en un renglón. */
export interface MarcaDeLaOpcion {
  readonly clave: string;
  readonly nombre: string;
  /** RP-23: su color, de 1 a `COLORES_DE_LAS_OPCIONES` (`null` si la opción no dice su lugar: la receta que se elige). */
  readonly color: number | null;
  readonly valor: number;
  readonly posicion: number;
  readonly fijada: 'izquierda' | 'derecha' | null;
  readonly ubicacion: Ubicacion;
  /** «2 · Pollo: 34 g P · por encima, 3 g»: la pista de la marca. */
  readonly texto: string;
}

/** Una opción que todavía no se puede ubicar y va a llegar: se está leyendo su composición, o es una receta sin guardar. */
export interface OpcionQueEspera {
  readonly clave: string;
  readonly nombre: string;
  readonly motivo: 'leyendo' | 'al-guardar';
}

export interface FranjaDelRenglon {
  readonly renglon: RenglonDeLaFranja;
  /** `null`: el rango indicado no tiene este renglón; no se dibuja banda ni marcas. */
  readonly limites: Limites | null;
  readonly tope: number | null;
  readonly banda: BandaEnLaPista | null;
  readonly marcas: readonly MarcaDeLaOpcion[];
  /** Las opciones que tienen el dato, con su valor como se muestra (también sin rango en el renglón). */
  readonly valores: readonly { readonly clave: string; readonly nombre: string; readonly valor: number }[];
  readonly esperan: readonly OpcionQueEspera[];
  /** Las opciones con alimentos a las que les falta este dato (sin cantidad, en unidades, sin composición). */
  readonly sinDato: readonly string[];
  /** El promedio de las opciones ubicadas, con dos o más. */
  readonly promedio: { readonly valor: number; readonly posicion: number; readonly fijada: 'izquierda' | 'derecha' | null; readonly ubicacion: Ubicacion } | null;
  readonly adentro: number;
  /** Lo que se ve a la derecha: «3 de 4 adentro · promedio 28 g P». */
  readonly resumen: string;
  /** Lo mismo, con cada opción y los nombres completos, para el lector de pantalla. */
  readonly enPalabras: string;
}

export interface FranjasDeLaComida {
  readonly renglones: readonly FranjaDelRenglon[];
  /** Ninguna opción tiene alimentos ni receta: una sola indicación neutra, no un «Sin dato» por renglón. */
  readonly sinAlimentos: boolean;
}

/** Qué le pasa a una opción en un nutriente: su valor, que espera, que le falta el dato, o que no tiene alimentos. */
function estadoDe(total: TotalDeLaOpcion | null, n: NutrienteDelRango): { readonly tipo: 'valor'; readonly valor: number } | { readonly tipo: 'espera'; readonly motivo: OpcionQueEspera['motivo'] } | { readonly tipo: 'sin-dato' } | { readonly tipo: 'vacia' } {
  if (!total) return { tipo: 'vacia' };
  const v = total[n];
  if (v.exacto !== null) {
    // Un total que no es un número (no debería llegar) no queda «adentro» por descarte: es un dato que falta.
    const valor = Number(v.exacto);
    return Number.isFinite(valor) ? { tipo: 'valor', valor } : { tipo: 'sin-dato' };
  }
  const motivos = new Set<PorQueFalta>(v.faltan.map((f) => f.motivo));
  if (motivos.has('SIN_ALIMENTOS') || motivos.size === 0) return { tipo: 'vacia' };
  if (motivos.has('LEYENDO')) return { tipo: 'espera', motivo: 'leyendo' };
  if (motivos.has('RECETA_SIN_GUARDAR')) return { tipo: 'espera', motivo: 'al-guardar' };
  return { tipo: 'sin-dato' };
}

const cuantas = (n: number, una: string, varias: string): string => (n === 1 ? `1 ${una}` : `${n} ${varias}`);

/**
 * RP-20: un renglón de la franja de una comida. Ubica cada opción que tiene el dato frente a los límites del renglón,
 * con su promedio si son dos o más, y dice cuántas quedan adentro.
 */
export function franjaDelRenglon(r: RenglonDeLaFranja, limites: Limites | null, opciones: readonly OpcionParaLaFranja[]): FranjaDelRenglon {
  const n = NUTRIENTE_DEL_RENGLON[r];
  const conValor: { clave: string; nombre: string; valor: number }[] = [];
  const colores = new Map<string, number | null>();
  const esperan: OpcionQueEspera[] = [];
  const sinDato: string[] = [];
  for (const o of opciones) {
    const e = estadoDe(o.total, n);
    colores.set(o.clave, o.lugar === undefined ? null : colorDeLaOpcion(o.lugar));
    if (e.tipo === 'valor') conValor.push({ clave: o.clave, nombre: o.nombre, valor: comoSeMuestra(r, e.valor) });
    else if (e.tipo === 'espera') esperan.push({ clave: o.clave, nombre: o.nombre, motivo: e.motivo });
    else if (e.tipo === 'sin-dato') sinDato.push(o.nombre);
  }
  const tope = limites ? topeDeLaEscala(limites, conValor.map((o) => o.valor)) : null;
  const marcas: MarcaDeLaOpcion[] =
    limites && tope !== null
      ? conValor.map((o) => {
          const u = ubicar(o.valor, limites);
          return { ...o, color: colores.get(o.clave) ?? null, ...posicionEnLaPista(o.valor, tope), ubicacion: u, texto:`${o.nombre}: ${conSuMacro(r, o.valor)} · ${ubicacionEnPalabras(u, r)}` };
        })
      : [];
  const valorPromedio = conValor.length >= 2 ? comoSeMuestra(r, conValor.reduce((s, o) => s + o.valor, 0) / conValor.length) : null;
  const promedio = valorPromedio !== null && limites && tope !== null ? { valor: valorPromedio, ...posicionEnLaPista(valorPromedio, tope), ubicacion: ubicar(valorPromedio, limites) } : null;
  const adentro = marcas.filter((m) => m.ubicacion.tipo === 'dentro').length;

  // Lo que se ve, corto.
  const partes: string[] = [];
  if (!limites) {
    partes.push('Sin rango indicado');
    if (valorPromedio !== null) partes.push(`promedio ${conSuMacro(r, valorPromedio)}`);
    else if (conValor.length === 1) partes.push(conSuMacro(r, conValor[0]!.valor));
  } else if (marcas.length >= 2) {
    // Sin «opciones» (las marcas son las opciones): así el resumen entra entero a 1440 y a 1536 aunque el promedio quede
    // afuera. El lector de pantalla oye «opciones».
    partes.push(`${adentro} de ${marcas.length} adentro`);
    partes.push(`promedio ${conSuMacro(r, promedio!.valor)}${promedio!.ubicacion.tipo === 'dentro' ? '' : ` (${ubicacionEnPalabras(promedio!.ubicacion, r)})`}`);
  } else if (marcas.length === 1) {
    partes.push(`${conSuMacro(r, marcas[0]!.valor)} · ${ubicacionEnPalabras(marcas[0]!.ubicacion, r)}`);
  }
  const leyendo = esperan.filter((e) => e.motivo === 'leyendo').length;
  const alGuardar = esperan.length - leyendo;
  if (conValor.length === 0) {
    if (leyendo > 0) partes.push('Leyendo…');
    else if (alGuardar > 0) partes.push('Se calcula al guardar');
    else if (sinDato.length > 0) partes.push('Sin dato');
  } else {
    if (leyendo > 0) partes.push(`${leyendo} leyendo`);
    if (alGuardar > 0) partes.push(`${alGuardar} al guardar`);
    if (sinDato.length > 0) partes.push(`${sinDato.length} sin dato`);
  }

  // Lo que oye el lector de pantalla: el rango y cada opción.
  // RP-D41: la banda de las kcal sale de los gramos. A la vista lo explica el «?» del panel; el lector lo oye acá.
  const deDondeSale = r === 'kcal' ? `, ${COPY_FRANJAS.kcalDeLosGramosCorto}` : '';
  const oido: string[] = [`${NOMBRE_DEL_RENGLON[r]}: ${limites ? `rango indicado ${limitesConSuMacro(limites, r)}${deDondeSale}` : 'sin rango indicado'}`];
  if (limites) {
    // RP-23: el promedio primero, como se ve; después cada opción, esté o no en las barras.
    if (promedio) oido.push(`promedio ${conSuMacro(r, promedio.valor)}, ${ubicacionEnPalabras(promedio.ubicacion, r)}`);
    for (const m of marcas) oido.push(m.texto);
    if (marcas.length >= 2) oido.push(`${adentro} de ${marcas.length} opciones adentro`);
  } else if (conValor.length > 0) for (const o of conValor) oido.push(`${o.nombre}: ${conSuMacro(r, o.valor)}`);
  for (const e of esperan) oido.push(`${e.nombre}: ${e.motivo === 'leyendo' ? 'leyendo su composición' : 'se calcula cuando se guarda el plan'}`);
  if (sinDato.length > 0) oido.push(`${cuantas(sinDato.length, 'opción', 'opciones')} sin dato: ${sinDato.join(', ')}`);

  return { renglon: r, limites, tope, banda: limites && tope !== null ? bandaEnLaPista(limites, tope) : null, marcas, valores: conValor, esperan, sinDato, promedio, adentro, resumen: partes.join(' · '), enPalabras: oido.join('. ') };
}

/** Las cuatro franjas de una comida, tenga o no rango indicado (el panel las usa también sin rango, por lo que aportan). */
export function armarFranjas(rango: RangoIndicado | null, opciones: readonly OpcionParaLaFranja[]): FranjasDeLaComida {
  const renglones = RENGLONES_DE_LA_FRANJA.map((r) => franjaDelRenglon(r, limitesDelRenglon(rango, r), opciones));
  const sinAlimentos = opciones.every((o) => estadoDe(o.total, 'energyKcal').tipo === 'vacia');
  return { renglones, sinAlimentos };
}

/**
 * RP-20: las cuatro franjas de una comida frente a su rango indicado, con todas sus opciones. `null` si la comida no tiene
 * rango indicado: no se dibuja nada (el renglón para indicarlo es `RangoEnUnRenglon`).
 */
export function franjasDeLaComida(rango: RangoIndicado | null, opciones: readonly OpcionParaLaFranja[]): FranjasDeLaComida | null {
  const f = armarFranjas(rango, opciones);
  return f.renglones.every((r) => r.limites === null) ? null : f;
}

// ─── RP-23 · El promedio, y las opciones que se eligen ───────────────────────────────────────────────────────────

/**
 * RP-D81: cuántos colores tiene la paleta de las opciones (`--opcion-1` a `--opcion-5` en tokens.css, medidos en los dos
 * temas). Desde la sexta, los colores vuelven a empezar: la casilla y el texto siguen diciendo de qué opción es cada punto.
 */
export const COLORES_DE_LAS_OPCIONES = 5;

/** El color de la opción en ese lugar de su comida (0, 1, 2…): de 1 a `COLORES_DE_LAS_OPCIONES`, por posición. */
export const colorDeLaOpcion = (lugar: number): number => (((Math.trunc(lugar) % COLORES_DE_LAS_OPCIONES) + COLORES_DE_LAS_OPCIONES) % COLORES_DE_LAS_OPCIONES) + 1;

/** El nombre de cada color, para el lector de pantalla y la pista del punto: el color no es la única vía (WCAG 1.4.1). */
export const NOMBRE_DEL_COLOR: Readonly<Record<number, string>> = { 1: 'azul', 2: 'violeta', 3: 'verde azulado', 4: 'magenta', 5: 'gris pizarra' };

/**
 * RP-D80: la raya de la comida. Con dos opciones o más, su promedio; con una sola, su valor (el promedio de una), para
 * que la comida plegada no quede con la banda sola. `null` si ninguna opción tiene el dato o el renglón no tiene rango.
 */
export function rayaDelPromedio(r: FranjaDelRenglon): { readonly valor: number; readonly posicion: number; readonly fijada: 'izquierda' | 'derecha' | null; readonly ubicacion: Ubicacion } | null {
  if (r.promedio) return r.promedio;
  const una = r.marcas.length === 1 ? r.marcas[0]! : null;
  return una ? { valor: una.valor, posicion: una.posicion, fijada: una.fijada, ubicacion: una.ubicacion } : null;
}

/** RP-D80: las marcas que se dibujan en la franja de la comida y del panel: solo las de las opciones tildadas. */
export const marcasALaVista = (r: FranjaDelRenglon, elegidas: ReadonlySet<string>): readonly MarcaDeLaOpcion[] => r.marcas.filter((m) => elegidas.has(m.clave));

/**
 * RP-23: lo que oye el lector de pantalla al final de la franja de la comida: qué hay en las barras. La franja entera
 * (el promedio y cada opción, con dónde queda) se oye igual, haya o no casillas tildadas.
 */
export function enLasBarrasEnPalabras(opciones: readonly OpcionParaLaFranja[], elegidas: ReadonlySet<string>): string {
  const tildadas = opciones.filter((o) => elegidas.has(o.clave)).map((o) => (o.lugar === undefined ? o.nombre : `${o.nombre} (${NOMBRE_DEL_COLOR[colorDeLaOpcion(o.lugar)]})`));
  return tildadas.length === 0 ? COPY_FRANJAS.enLasBarrasSoloElPromedio : COPY_FRANJAS.enLasBarras(listaEnPalabras(tildadas));
}

/** RP-21: lo que aportan las opciones con el dato, de la que menos a la que más, sin la unidad: «520–700», «28». */
export function deCuantoACuanto(r: FranjaDelRenglon): string | null {
  if (r.valores.length === 0) return null;
  const vs = r.valores.map((v) => v.valor);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  return min === max ? cifra(r.renglon, min) : `${cifra(r.renglon, min)}–${cifra(r.renglon, max)}`;
}

/** C: la porción de una receta en su renglón: su valor («32 g P» o «Sin dato») y dónde queda («por encima, 6 g»). */
export function porcionEnElRenglon(r: FranjaDelRenglon): { readonly valor: string; readonly ubicacion: string } {
  const v = r.valores[0];
  const m = r.marcas[0];
  return { valor: v ? conSuMacro(r.renglon, v.valor) : 'Sin dato', ubicacion: m ? ubicacionEnPalabras(m.ubicacion, r.renglon) : r.limites ? '' : 'sin rango' };
}

/**
 * Dónde se dibuja la franja:
 * - `comida`: todas sus opciones, con los límites a la izquierda y el resumen a la derecha.
 * - `opcion`: una sola opción (la abierta o la del cuadro), igual.
 * - `panel`: compacta, con lo que aportan las opciones a la izquierda y sin resumen.
 * - `receta`: una porción, con su valor a la izquierda y dónde queda a la derecha.
 */
export type VarianteDeLaFranja = 'comida' | 'opcion' | 'panel' | 'receta';

/** Cómo empieza lo que oye el lector, según dónde está la franja: una sola opción no es «las opciones». */
const TITULO_EN_PALABRAS: Readonly<Record<VarianteDeLaFranja, (comida: string) => string>> = {
  comida: (c) => COPY_FRANJAS.titulo(c),
  opcion: (c) => COPY_FRANJAS.laOpcionFrenteAlRangoDe(c),
  panel: (c) => COPY_FRANJAS.loQueAportan(c),
  receta: (c) => COPY_FRANJAS.unaPorcionFrenteAlRangoDe(c),
};

/**
 * El texto entero de la franja para el lector de pantalla: un renglón por oración. Con `enLasBarras` (RP-23, la comida y
 * el panel), al final dice qué hay dibujado: el promedio solo o, además, las opciones tildadas.
 */
export function franjasEnPalabras(f: FranjasDeLaComida, comida: string, variante: VarianteDeLaFranja = 'comida', enLasBarras?: string): string {
  const titulo = TITULO_EN_PALABRAS[variante](comida);
  if (f.sinAlimentos) return `${titulo}. ${variante === 'comida' ? COPY_FRANJAS.sinAlimentos : COPY_FRANJAS.sinAlimentosLaOpcion}`;
  return `${titulo}. ${f.renglones.map((r) => r.enPalabras).join('. ')}.${enLasBarras ? ` ${enLasBarras}` : ''}`;
}

// ─── El día (RP-21) ─────────────────────────────────────────────────────────────────────────────────────────────

/** Un renglón del día: de la opción que menos suma a la que más, como un tramo, frente al rango indicado del día. */
export interface TramoDelDia {
  readonly renglon: RenglonDeLaFranja;
  readonly limites: Limites | null;
  /** RP-D84: sin dato no hay banda: sola, en el medio de la escala, se veía como un punto que no decía nada. */
  readonly banda: BandaEnLaPista | null;
  /** RP-D84: el día todavía no se suma en este renglón: la pista queda vacía, con su alto. */
  readonly sinDato: boolean;
  /** El tramo en la pista; `null` sin dato o sin rango del día. */
  readonly tramo: { readonly desde: number; readonly hasta: number; readonly minimo: Ubicacion; readonly maximo: Ubicacion; readonly fijado: boolean } | null;
  /** «1.850 a 2.420», «1.850», sin la unidad (la pone `CantidadDelMacro`); `null` sin dato. */
  readonly cifra: string | null;
  readonly enPalabras: string;
}

/** RP-21: el día, renglón por renglón: lo que va según lo que se elija y, si hay rango del día, dónde quedan sus puntas. */
export function tramosDelDia(dia: RangoPorNutriente, rango: RangoIndicado | null): readonly TramoDelDia[] {
  return RENGLONES_DE_LA_FRANJA.map((r): TramoDelDia => {
    const v: Rango = dia[NUTRIENTE_DEL_RENGLON[r]];
    const limites = limitesDelRenglon(rango, r);
    // Sin dato, el renglón sigue en su lugar con su pista vacía: el bloque del día no se achica cada vez que una cantidad
    // queda vacía mientras se escribe. RP-D84: sin la banda, que sola (la escala la centra siempre) era un punto en el
    // medio de cada barra que no decía nada.
    const sinDato = (): TramoDelDia => ({ renglon: r, limites, banda: null, sinDato: true, tramo: null, cifra: null, enPalabras: `${NOMBRE_DEL_RENGLON[r]} del día: sin dato` });
    if (v.tipo === 'sin-dato') return sinDato();
    if (!Number.isFinite(Number(v.min)) || !Number.isFinite(Number(v.max))) return sinDato();
    const min = comoSeMuestra(r, Number(v.min));
    const max = comoSeMuestra(r, Number(v.max));
    const cifraDelTramo = min === max ? cifra(r, min) : `${cifra(r, min)} a ${cifra(r, max)}`;
    const visible = cantidadAbreviada(r, cifraDelTramo);
    if (!limites) return { renglon: r, limites, banda: null, sinDato: false, tramo: null, cifra: cifraDelTramo, enPalabras: `${NOMBRE_DEL_RENGLON[r]} del día: ${visible}` };
    const tope = topeDeLaEscala(limites, [max]);
    const a = posicionEnLaPista(min, tope);
    const b = posicionEnLaPista(max, tope);
    const minimo = ubicar(min, limites);
    const maximo = ubicar(max, limites);
    const queda = min === max ? ubicacionEnPalabras(minimo, r) : minimo.tipo === 'dentro' && maximo.tipo === 'dentro' ? 'adentro' : [minimo.tipo === 'dentro' ? null : `el mínimo ${ubicacionEnPalabras(minimo, r)}`, maximo.tipo === 'dentro' ? null : `el máximo ${ubicacionEnPalabras(maximo, r)}`].filter(Boolean).join('; ');
    return {
      renglon: r,
      limites,
      banda: bandaEnLaPista(limites, tope),
      sinDato: false,
      tramo: { desde: a.posicion, hasta: b.posicion, minimo, maximo, fijado: b.fijada !== null || a.fijada !== null },
      cifra: cifraDelTramo,
      enPalabras: `${NOMBRE_DEL_RENGLON[r]} del día: ${visible}, frente al rango del día ${limitesConSuMacro(limites, r)}: ${queda}`,
    };
  });
}

// ─── RP-21 · «Rangos y totales»: lo que falta, una sola vez ──────────────────────────────────────────────────────

/** Las opciones del día sin alimentos («Merienda · Opción 1») y lo demás que impide sumar, cada cosa una vez. */
export function loQueFaltaEnElDia(comidas: readonly { readonly nombre: string; readonly opciones: readonly { readonly nombre: string; readonly total: TotalDeLaOpcion }[] }[]): { readonly sinAlimentos: readonly string[]; readonly otros: readonly { readonly donde: string; readonly nombre: string; readonly motivo: PorQueFalta }[] } {
  const sinAlimentos: string[] = [];
  const otros: { donde: string; nombre: string; motivo: PorQueFalta }[] = [];
  const vistos = new Set<string>();
  for (const c of comidas) {
    if (c.opciones.length === 0) {
      sinAlimentos.push(`${c.nombre} (sin opciones)`);
      continue;
    }
    for (const o of c.opciones) {
      const faltan = (['energyKcal', 'proteinG', 'carbohydrateG', 'fatG'] as const).flatMap((n) => o.total[n].faltan);
      if (faltan.some((f) => f.motivo === 'SIN_ALIMENTOS')) {
        sinAlimentos.push(`${c.nombre} · ${o.nombre}`);
        continue;
      }
      for (const f of faltan) {
        const clave = `${c.nombre}|${o.nombre}|${f.nombre}|${f.motivo}`;
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        otros.push({ donde: `${c.nombre} · ${o.nombre}`, nombre: f.nombre, motivo: f.motivo });
      }
    }
  }
  return { sinAlimentos, otros };
}

/** «Merienda · Opción 1 y Cena · Opción 1». */
export const listaEnPalabras = (ns: readonly string[]): string => (ns.length <= 1 ? (ns[0] ?? '') : `${ns.slice(0, -1).join(', ')} y ${ns[ns.length - 1]}`);

// ─── C · Al elegir una receta ────────────────────────────────────────────────────────────────────────────────────

/**
 * Una porción de la receta como total de una opción: la opción que suma una receta lleva una porción (DL-119), y su
 * cálculo ya viene con la lista de «Mis recetas» (API-REC-02, `calculation.perServing`): no se pide nada por receta.
 */
export function totalDeUnaPorcion(porcion: Nutrientes): TotalDeLaOpcion {
  const valor = (n: NutrienteDelRango) => ({ exacto: porcion[n].value, faltan: porcion[n].value === null ? [{ donde: '', nombre: '', motivo: 'SIN_DATO_DEL_NUTRIENTE' as const }] : [] });
  return { energyKcal: valor('energyKcal'), proteinG: valor('proteinG'), carbohydrateG: valor('carbohydrateG'), fatG: valor('fatG') };
}

/** C: una receta frente al rango de la comida donde se suma, renglón por renglón; `null` si la comida no tiene rango. */
export function recetaFrenteAlRango(porcion: Nutrientes, rango: RangoIndicado | null, nombre: string): FranjasDeLaComida | null {
  return franjasDeLaComida(rango, [{ clave: nombre, nombre: 'Una porción', total: totalDeUnaPorcion(porcion) }]);
}

/** Cuántos renglones de una receta quedan adentro, y qué tan lejos queda lo demás (en partes del centro de cada rango). */
function cercania(f: FranjasDeLaComida | null): { readonly adentro: number; readonly lejos: number } {
  if (!f) return { adentro: 0, lejos: Number.POSITIVE_INFINITY };
  let adentro = 0;
  let lejos = 0;
  for (const r of f.renglones) {
    if (!r.limites || r.tope === null) continue;
    const m = r.marcas[0];
    // Un dato que falta no la acerca: cuenta como si quedara a un centro de distancia.
    if (!m) lejos += 1;
    else if (m.ubicacion.tipo === 'dentro') adentro += 1;
    else lejos += m.ubicacion.diferencia / (r.tope / 2);
  }
  return { adentro, lejos };
}

/**
 * C (RP-D46): «Primero las que entran»: las recetas con más renglones adentro van primero; entre las que tienen los mismos,
 * la que queda más cerca. No esconde ninguna, y sin rango deja el orden como estaba.
 */
export function primeroLasQueEntran<R extends { readonly calculation: { readonly perServing: Nutrientes }; readonly name: string }>(recetas: readonly R[], rango: RangoIndicado | null): R[] {
  if (!rango) return [...recetas];
  const conCercania = recetas.map((r, i) => ({ r, i, c: cercania(recetaFrenteAlRango(r.calculation.perServing, rango, r.name)) }));
  conCercania.sort((a, b) => b.c.adentro - a.c.adentro || a.c.lejos - b.c.lejos || a.i - b.i);
  return conCercania.map((x) => x.r);
}

export const COPY_FRANJAS = {
  titulo: (comida: string) => `Las opciones de ${comida} frente a su rango indicado`,
  tituloDeLaOpcion: 'Esta opción frente al rango de su comida',
  /** Lo que oye el lector en la franja de la opción abierta, del cuadro o del panel. */
  laOpcionFrenteAlRangoDe: (comida: string) => `Esta opción frente al rango de ${comida}`,
  loQueAportan: (comida: string) => `Lo que aportan las opciones de ${comida}`,
  /** Corto: va en el renglón de las kcal, que no se parte (entra entero a 1440). */
  sinAlimentos: 'Cada opción se ubica cuando sume su primer alimento.',
  sinAlimentosLaOpcion: 'Todavía no tiene alimentos: se ubica cuando sumes el primero.',
  elDiaFrenteAlSuyo: 'El día, con esta opción, frente a su rango',
  /** RP-D41: de dónde sale la banda de las kcal (en el «?» del panel). */
  kcalDeLosGramos: 'Las kcal del rango salen de sus gramos, con 4, 4 y 9 kcal por gramo.',
  /** Lo mismo, para el lector, en el renglón de las kcal. */
  kcalDeLosGramosCorto: 'sale de los gramos, con 4, 4 y 9 kcal por gramo',
  /** Cómo se lee una franja (en el «?» del panel): no hay otra leyenda a la vista. */
  comoSeLeeLaFranja: 'En cada franja, la banda es el rango indicado de la comida y la raya, el promedio de sus opciones (con una sola, su valor). Al tildar una opción, su punto aparece en su color: lleno si queda adentro, hueco si queda afuera. Lo que no entra en la escala va en el borde, con una flecha.',
  // RP-23
  /** La etiqueta de la casilla de cada opción (la oye el lector; a la vista, la casilla y el punto). */
  mostrarEnLasBarras: (n: number, color: string) => `Mostrar la opción ${n} en las barras de la comida (su punto es ${color})`,
  /** La pista del punto de color, al pasar el puntero. */
  suPunto: (n: number, color: string) => `Opción ${n}: su punto en las barras es ${color}`,
  enLasBarrasSoloElPromedio: 'En las barras, solo el promedio.',
  enLasBarras: (lista: string) => `En las barras, el promedio y ${lista}.`,
  /** La nota corta de las recetas: se cuentan con su porción guardada. */
  recetasGuardadas: 'Una opción de receta se ubica con la porción de la versión guardada.',
  promedio: 'Promedio de las opciones',
  /** RP-D80: con una sola opción, la raya es su valor. */
  laUnicaOpcion: 'El valor de la única opción',
  ubicaNoCalifica: 'Ubica, no corrige: podés dejarla así.',
  // RP-21
  segunLoQueElija: 'Según la opción que elija en cada comida',
  /** El nombre del «?» de «Rangos y totales»: lo largo va ahí (pedido de Dirección para todo el recorrido). */
  comoSeLeeElPanel: 'Cómo se leen los rangos y totales',
  opciones: (n: number) => (n === 1 ? '1 opción' : `${n} opciones`),
  sinOpciones: 'Sin opciones',
  // C
  frenteAlRangoDe: (comida: string) => `Frente al rango de ${comida}`,
  unaPorcionFrenteAlRangoDe: (comida: string) => `Una porción, frente al rango de ${comida}`,
  primeroLasQueEntran: (comida: string) => `Primero las que entran en el rango de ${comida}`,
  sinRangoParaComparar: (comida: string) => `${comida} todavía no tiene un rango indicado: las recetas se ven sin compararlas.`,
} as const;
