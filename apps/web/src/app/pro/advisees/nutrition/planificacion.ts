/**
 * WP-NUTRICION-PLANIFICACION (NUP-01 a NUP-07) · Los números que se ven mientras se planifica, sin React.
 *
 * - **Lo que aporta cada alimento** (NUP-01; NUP-D01) es la cuenta del dominio (`calcularNutrientes`, por
 *   `totalDeLaOpcion`): la misma que el total de la opción, así que las filas suman el total. Lo que falta se nombra,
 *   nunca es cero (NUP-D02).
 * - **La comida plegada** (NUP-02) dice lo que aporta de la opción que menos a la que más (`rangoDeLaComida`).
 * - **Ubicar frente a un rango indicado** (NUP-04; NUP-D05): dentro, encima o debajo, con la diferencia; sin color y sin
 *   palabras de juicio. Un lado vacío del rango es «sin límite».
 * - **La suma de los rangos indicados frente al objetivo** (NUP-06; NUP-D06): es otra cuenta que la de las opciones.
 * - **El objetivo** (NUP-07; NUP-D07 y NUP-D08): las kcal que suman los gramos, con 4, 4 y 9 kcal por gramo a la vista; si
 *   no coinciden con las indicadas, se avisa sin bloquear. El porcentaje va con su base y sus gramos (decisión de
 *   Dirección del 18/11, solo en el website del profesional).
 */
import { numero, nutrienteParaMostrar, origenEnElCatalogo, MACROS_DEL_RANGO, type ComposicionParaCalcular, type MacroDelRango, type Rango as RangoIndicado, type RangoDeMacro } from '@be/domain';
import { limitesEnPalabras, NOMBRE_DEL_MACRO } from './rangos-indicados';
import { COPY_RANGOS, faltantesDeLaOpcion, NUTRIENTES_DEL_RANGO, sinDatoEnPalabras, totalDeLaOpcion, totalEnPalabras, totalEnUnaLinea, type ComposicionConocida, type ItemParaElTotal, type NutrienteDelRango, type PorQueFalta, type Rango, type RangoPorNutriente, type TotalDeLaOpcion } from './rangos';

// ─── NUP-01 · Lo que aporta un alimento ────────────────────────────────────────────────────────────────────────

/** Lo que aporta un alimento con su cantidad: sus totales, o por qué no hay ninguno. */
export type AporteDelItem = { readonly tipo: 'total'; readonly total: TotalDeLaOpcion } | { readonly tipo: 'falta'; readonly motivo: PorQueFalta };

/**
 * NUP-01: lo que aporta un alimento, con la misma cuenta que el total de la opción. Si no hay ningún nutriente (sin
 * cantidad, en unidades, sin composición o leyéndola), dice por qué; si falta uno solo (la fuente no trae las grasas),
 * los demás se ven y ese dice «Sin dato».
 */
export function aporteDelItem(item: ItemParaElTotal, composicion: ComposicionConocida | undefined): AporteDelItem {
  const composiciones = new Map<string, ComposicionConocida>(composicion === undefined ? [] : [[item.catalogItemId, composicion]]);
  const total = totalDeLaOpcion([item], composiciones);
  if (NUTRIENTES_DEL_RANGO.every((n) => total[n].exacto === null)) {
    const motivo = total.energyKcal.faltan[0]?.motivo ?? total.proteinG.faltan[0]?.motivo ?? 'SIN_COMPOSICION';
    return { tipo: 'falta', motivo };
  }
  return { tipo: 'total', total };
}

const POR_QUE_NO_APORTA: Readonly<Record<PorQueFalta, string>> = {
  SIN_CANTIDAD: 'Sin cantidad: escribila para ver lo que aporta',
  SIN_COMPOSICION: 'No se pudo leer su composición',
  SIN_DATO_DEL_NUTRIENTE: 'La fuente no trae sus datos',
  EN_UNIDADES: 'En unidades: sin estimación',
  OTRA_UNIDAD: 'La unidad no tiene equivalencia con su composición',
  LEYENDO: 'Leyendo su composición…',
  RECETA_SIN_GUARDAR: 'Se calcula cuando se guarda el plan',
  SIN_ALIMENTOS: 'Sin alimentos',
  SIN_OPCIONES: 'Sin opciones',
  SIN_COMIDAS: 'Sin comidas',
};

/** «420 kcal · P 38 g · C 22 g · G 18 g», o por qué no hay. */
export const aporteEnUnaLinea = (a: AporteDelItem): string => (a.tipo === 'total' ? totalEnUnaLinea(a.total) : POR_QUE_NO_APORTA[a.motivo]);
/** Lo mismo con los nombres completos, para el lector de pantalla. */
export const aporteEnPalabras = (a: AporteDelItem): string => (a.tipo === 'total' ? `Aporta ${totalEnPalabras(a.total)}` : POR_QUE_NO_APORTA[a.motivo]);

const NOMBRE_EN_LA_PISTA: Readonly<Record<NutrienteDelRango | 'fiberG', string>> = { energyKcal: '', proteinG: 'proteínas', carbohydrateG: 'carbohidratos', fatG: 'grasas', fiberG: 'fibra' };

/** Un valor de la composición, redondeado como en el resto de BE (kcal a entero, gramos a un decimal). */
function valorDeLaComposicion(c: ComposicionParaCalcular, n: NutrienteDelRango | 'fiberG'): string {
  const v = c[n];
  if (v === null || v === undefined) return 'sin dato';
  const texto = nutrienteParaMostrar({ value: String(v) }, n) ?? 'sin dato';
  return n === 'energyKcal' ? `${texto} kcal` : `${texto} g`;
}

/**
 * NUP-01 (NUP-D03): la pista de un alimento: su composición cada 100 g (o 100 ml) y de dónde sale. «Cada 100 g: 130 kcal
 * · proteínas 2,7 g · carbohidratos 28,2 g · grasas 0,3 g · fibra sin dato. De dónde sale: USDA.»
 */
export function composicionEnLaPista(c: ComposicionConocida | undefined, origen: string | null): string {
  const deDonde = origen ? ` De dónde sale: ${origen}.` : '';
  if (c === 'leyendo' || c === undefined) return `Leyendo su composición del catálogo.${deDonde}`;
  if (c === 'sin-composicion') return `No se pudo leer su composición del catálogo.${deDonde}`;
  const partes = (['energyKcal', 'proteinG', 'carbohydrateG', 'fatG', 'fiberG'] as const).map((n) => (n === 'energyKcal' ? valorDeLaComposicion(c, n) : `${NOMBRE_EN_LA_PISTA[n]} ${valorDeLaComposicion(c, n)}`));
  return `Cada ${c.referenceAmount === '100ml' ? '100 ml' : '100 g'}: ${partes.join(' · ')}.${deDonde}`;
}

/** Lo mínimo de un alimento del catálogo para decir de dónde sale. */
export interface AlimentoConOrigen {
  readonly provenance: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  readonly externalSource: { readonly provider: string } | null;
  readonly origin?: unknown;
}

/**
 * De dónde sale un alimento, breve: el del buscador (DL-141 D-6) si vino con su origen; si no (los habituales), por su
 * procedencia y su fuente externa.
 */
export function origenBreve(a: AlimentoConOrigen): string {
  if (a.origin) return origenEnElCatalogo(a as Parameters<typeof origenEnElCatalogo>[0], (s) => s).breve;
  if (a.externalSource?.provider === 'USDA_FDC_SR_LEGACY') return 'USDA';
  if (a.externalSource) return 'Open Food Facts';
  if (a.provenance === 'BE_SYNTHETIC_SEED') return 'Demostración';
  if (a.provenance === 'PROFESSIONAL_MANUAL') return 'Cargado a mano';
  return 'Importado';
}

/**
 * NUP-03: los números del renglón de una opción plegada: sus totales («703 kcal · P 45 g · …») o, si no hay ninguno, por
 * qué («Sin alimentos», «Se calcula cuando se guarda el plan»).
 */
export function numerosDeLaOpcion(total: TotalDeLaOpcion): { readonly linea: string; readonly palabras: string } {
  if (NUTRIENTES_DEL_RANGO.every((n) => total[n].exacto === null)) {
    const faltan = faltantesDeLaOpcion(total);
    const motivo = faltan[0]?.motivo;
    // Sin alimentos o una receta sin guardar: eso. Si no, qué lo impide: «Sin dato: Arroz sin cantidad».
    const texto = motivo === 'SIN_ALIMENTOS' || motivo === 'RECETA_SIN_GUARDAR' ? POR_QUE_NO_APORTA[motivo] : sinDatoEnPalabras(faltan);
    return { linea: texto, palabras: texto };
  }
  return { linea: totalEnUnaLinea(total), palabras: totalEnPalabras(total) };
}

// ─── NUP-02 · Lo que aporta una comida, de la opción que menos a la que más ──────────────────────────────────────

const INICIAL: Readonly<Record<NutrienteDelRango, string>> = { energyKcal: '', proteinG: 'P', carbohydrateG: 'C', fatG: 'G' };
const NOMBRE: Readonly<Record<NutrienteDelRango, string>> = { energyKcal: 'Energía', proteinG: 'Proteínas', carbohydrateG: 'Carbohidratos', fatG: 'Grasas' };
const UNIDAD: Readonly<Record<NutrienteDelRango, string>> = { energyKcal: 'kcal', proteinG: 'g', carbohydrateG: 'g', fatG: 'g' };

const mostrar = (exacto: string, n: NutrienteDelRango): string => nutrienteParaMostrar({ value: exacto }, n) ?? COPY_RANGOS.sinDato;

/** «520–700», o «520» si todas las opciones aportan lo mismo; `null` sin dato. */
function deCuantoACuanto(r: Rango, n: NutrienteDelRango): string | null {
  if (r.tipo === 'sin-dato') return null;
  const min = mostrar(r.min, n);
  const max = mostrar(r.max, n);
  return min === max ? min : `${min}–${max}`;
}

/**
 * NUP-02: «520–700 kcal · P 30–52 g · C 40–80 g · G 10–20 g», de la opción que menos aporta a la que más. Lo que no se
 * puede sumar dice «Sin dato». `null` si la comida no tiene opciones.
 */
export function loQueAportaLaComida(rango: RangoPorNutriente, opciones: number): string | null {
  if (opciones === 0) return null;
  return NUTRIENTES_DEL_RANGO.map((n) => {
    const v = deCuantoACuanto(rango[n], n);
    if (n === 'energyKcal') return v === null ? `kcal ${COPY_RANGOS.sinDato.toLowerCase()}` : `${v} kcal`;
    return `${INICIAL[n]} ${v === null ? COPY_RANGOS.sinDato : `${v} g`}`;
  }).join(' · ');
}

/** Lo mismo con los nombres completos, para el lector de pantalla: «Energía de 520 a 700 kcal · Proteínas …». */
export function loQueAportaLaComidaEnPalabras(rango: RangoPorNutriente, opciones: number): string | null {
  if (opciones === 0) return null;
  const unaSola = opciones === 1;
  return `${unaSola ? 'Aporta' : 'Según la opción, aporta'} ${NUTRIENTES_DEL_RANGO.map((n) => {
    const r = rango[n];
    if (r.tipo === 'sin-dato') return `${NOMBRE[n]} sin dato`;
    const min = mostrar(r.min, n);
    const max = mostrar(r.max, n);
    return min === max ? `${NOMBRE[n]} ${min} ${UNIDAD[n]}` : `${NOMBRE[n]} de ${min} a ${max} ${UNIDAD[n]}`;
  }).join(' · ')}`;
}

// ─── NUP-12 · La comida vacía ────────────────────────────────────────────────────────────────────────────────────

/** NUP-12: una comida está vacía si ninguna de sus opciones tiene alimentos ni receta: dice por dónde empezar. */
export const comidaVacia = (c: { readonly options: readonly { readonly items: readonly unknown[]; readonly recipeVersionId?: string | undefined }[] }): boolean =>
  c.options.every((o) => o.items.length === 0 && !o.recipeVersionId);

// ─── NUP-04 · Ubicar frente a un rango indicado ──────────────────────────────────────────────────────────────────

export interface Limites {
  readonly min: number | null;
  readonly max: number | null;
}
export type Ubicacion = { readonly tipo: 'dentro' } | { readonly tipo: 'encima' | 'debajo'; readonly diferencia: number };

/** Un número como se compara y se muestra: a lo sumo un decimal (los gramos de BE), así nunca dice «0 g por encima». */
const aUnDecimal = (n: number): number => Math.round(n * 10) / 10;

/** NUP-D05: dónde queda un valor frente a un rango. Un lado vacío es sin límite. */
export function ubicar(valor: number, rango: Limites): Ubicacion {
  const v = aUnDecimal(valor);
  if (rango.min !== null && v < rango.min) return { tipo: 'debajo', diferencia: aUnDecimal(rango.min - v) };
  if (rango.max !== null && v > rango.max) return { tipo: 'encima', diferencia: aUnDecimal(v - rango.max) };
  return { tipo: 'dentro' };
}

const gramos = (n: number): string => `${numero(n, 1)} g`;

/** Los gramos indicados de un macro, si tiene algún límite. */
const limitesDe = (r: RangoDeMacro | undefined): Limites | null => (r && (r.grams.min !== null || r.grams.max !== null) ? r.grams : null);

/** Una línea del rango en vivo: el texto y si queda afuera (para el lector, que la oye igual: no hay color que la marque). */
export interface LineaFrenteAlRango {
  readonly macro: MacroDelRango;
  readonly texto: string;
  readonly afuera: boolean;
}

const NUTRIENTE_DEL_MACRO: Readonly<Record<MacroDelRango, NutrienteDelRango>> = { protein: 'proteinG', carbohydrate: 'carbohydrateG', fat: 'fatG' };

/**
 * NUP-04: la opción frente al rango indicado de su comida, macro por macro: «Proteínas: 52 g · 12 g por encima del rango
 * de Almuerzo (30 a 40 g)». Solo los macros que tienen rango. Un total sin dato lo dice.
 */
export function opcionFrenteAlRango(total: TotalDeLaOpcion, rango: RangoIndicado | null, comida: string): readonly LineaFrenteAlRango[] {
  if (!rango) return [];
  return MACROS_DEL_RANGO.flatMap((m) => {
    const limites = limitesDe(rango[m]);
    if (!limites) return [];
    const deQue = `del rango de ${comida} (${limitesEnPalabras(limites.min, limites.max, 'g')})`;
    const exacto = total[NUTRIENTE_DEL_MACRO[m]].exacto;
    if (exacto === null) return [{ macro: m, texto: `${NOMBRE_DEL_MACRO[m]}: sin dato · no se puede ubicar frente ${deQue}`, afuera: false }];
    const valor = Number(exacto);
    const u = ubicar(valor, limites);
    const queda = u.tipo === 'dentro' ? `dentro ${deQue}` : `${gramos(u.diferencia)} por ${u.tipo === 'encima' ? 'encima' : 'debajo'} ${deQue}`;
    return [{ macro: m, texto: `${NOMBRE_DEL_MACRO[m]}: ${gramos(aUnDecimal(valor))} · ${queda}`, afuera: u.tipo !== 'dentro' }];
  });
}

/**
 * NUP-04: el día frente a su rango indicado. El día va de la opción que menos a la que más aporta en cada comida: se
 * ubican sus dos puntas. «Proteínas del día: de 95 a 130 g según lo que elija · el máximo queda 10 g por encima del rango
 * del día (90 a 120 g)».
 */
export function diaFrenteAlRango(dia: RangoPorNutriente, rango: RangoIndicado | null): readonly LineaFrenteAlRango[] {
  if (!rango) return [];
  return MACROS_DEL_RANGO.flatMap((m) => {
    const limites = limitesDe(rango[m]);
    if (!limites) return [];
    const deQue = `del rango del día (${limitesEnPalabras(limites.min, limites.max, 'g')})`;
    const r = dia[NUTRIENTE_DEL_MACRO[m]];
    if (r.tipo === 'sin-dato') return [{ macro: m, texto: `${NOMBRE_DEL_MACRO[m]} del día: sin dato · no se puede ubicar frente ${deQue}`, afuera: false }];
    const min = aUnDecimal(Number(r.min));
    const max = aUnDecimal(Number(r.max));
    const va = min === max ? gramos(min) : `de ${numero(min, 1)} a ${gramos(max)} según lo que elija`;
    const abajo = ubicar(min, limites);
    const arriba = ubicar(max, limites);
    const partes: string[] = [];
    if (abajo.tipo === 'debajo') partes.push(`${min === max ? 'queda' : 'el mínimo queda'} ${gramos(abajo.diferencia)} por debajo`);
    if (arriba.tipo === 'encima') partes.push(`${min === max ? 'queda' : 'el máximo queda'} ${gramos(arriba.diferencia)} por encima`);
    const queda = partes.length === 0 ? `dentro ${deQue}` : `${partes.join(' y ')} ${deQue}`;
    return [{ macro: m, texto: `${NOMBRE_DEL_MACRO[m]} del día: ${va} · ${queda}`, afuera: partes.length > 0 }];
  });
}

// ─── NUP-06 · La suma de los rangos indicados de las comidas, frente al objetivo ─────────────────────────────────

/** Las kcal por gramo de cada macro (Atwater): a la vista donde se usan. */
export const KCAL_POR_GRAMO: Readonly<Record<MacroDelRango, number>> = { protein: 4, carbohydrate: 4, fat: 9 };

/** Una fila de la suma: lo que suman los mínimos y los máximos, y las comidas que dejan un lado sin límite. */
export interface FilaDeLaSuma {
  readonly min: number;
  /** `null`: alguna comida no tiene máximo (o no tiene rango), y la suma no tiene tope. */
  readonly max: number | null;
  /** Las comidas sin rango de este macro. */
  readonly sinRango: readonly string[];
  /** Las comidas con rango pero sin máximo. */
  readonly sinMaximo: readonly string[];
  /** Cuántas comidas tienen rango de este macro. */
  readonly conRango: number;
}

export interface SumaDeLosRangos {
  readonly macros: Readonly<Record<MacroDelRango, FilaDeLaSuma>>;
  /** Las kcal de la suma, con 4, 4 y 9 kcal por gramo. */
  readonly kcal: { readonly min: number; readonly max: number | null; readonly conRango: number };
}

/**
 * NUP-06 (NUP-D06): la suma de los rangos indicados de las comidas, macro por macro. Un mínimo vacío cuenta como cero; si
 * alguna comida no tiene máximo (o no tiene rango de ese macro), la suma no tiene tope.
 */
export function sumaDeLosRangos(comidas: readonly { readonly nombre: string; readonly rango: RangoIndicado | null }[]): SumaDeLosRangos {
  const fila = (m: MacroDelRango): FilaDeLaSuma => {
    let min = 0;
    let max: number | null = 0;
    const sinRango: string[] = [];
    const sinMaximo: string[] = [];
    let conRango = 0;
    for (const c of comidas) {
      const l = limitesDe(c.rango?.[m]);
      if (!l) {
        sinRango.push(c.nombre);
        max = null;
        continue;
      }
      conRango += 1;
      min += l.min ?? 0;
      if (l.max === null) {
        sinMaximo.push(c.nombre);
        max = null;
      } else if (max !== null) max += l.max;
    }
    return { min: aUnDecimal(min), max: max === null ? null : aUnDecimal(max), sinRango, sinMaximo, conRango };
  };
  const macros = { protein: fila('protein'), carbohydrate: fila('carbohydrate'), fat: fila('fat') };
  const kcalMin = MACROS_DEL_RANGO.reduce((s, m) => s + macros[m].min * KCAL_POR_GRAMO[m], 0);
  const kcalMax = MACROS_DEL_RANGO.every((m) => macros[m].max !== null) ? MACROS_DEL_RANGO.reduce((s, m) => s + macros[m].max! * KCAL_POR_GRAMO[m], 0) : null;
  return { macros, kcal: { min: Math.round(kcalMin), max: kcalMax === null ? null : Math.round(kcalMax), conRango: Math.max(...MACROS_DEL_RANGO.map((m) => macros[m].conRango)) } };
}

/** El objetivo del día, como lo compara la suma: kcal y los macros en gramos (los de proporción no se comparan). */
export interface ObjetivoDelDia {
  readonly kcal: number;
  readonly macros: Readonly<Record<MacroDelRango, number | null>>;
}

/** Del objetivo vigente: los macros en g/día; uno en proporción de las kcal no tiene gramos que comparar. */
export function objetivoDelDia(o: { readonly estimatedEnergyRequirement: { readonly value: number }; readonly macronutrientDistribution: Readonly<Record<MacroDelRango, { readonly value: number; readonly unit: string }>> }): ObjetivoDelDia {
  const g = (m: MacroDelRango) => (o.macronutrientDistribution[m].unit === 'g/day' ? o.macronutrientDistribution[m].value : null);
  return { kcal: o.estimatedEnergyRequirement.value, macros: { protein: g('protein'), carbohydrate: g('carbohydrate'), fat: g('fat') } };
}

/** NUP-07: los gramos del objetivo vigente (un macro en proporción de las kcal no tiene gramos: `null`). */
export const gramosDelObjetivo = (o: Parameters<typeof objetivoDelDia>[0]): GramosDelObjetivo => objetivoDelDia(o).macros;

/** Una fila de la tabla de la suma, lista para mostrar. */
export interface FilaFrenteAlObjetivo {
  readonly clave: 'kcal' | MacroDelRango;
  readonly nombre: string;
  /** «95–130 g», «desde 95 g», o «Sin rangos indicados». */
  readonly suma: string;
  /** «objetivo 112 g», o `null` si el objetivo no tiene ese dato en gramos. */
  readonly objetivo: string | null;
  /** «adentro», «260 g por encima del máximo», «20 g por debajo del mínimo»; `null` sin objetivo o sin rangos. */
  readonly ubicacion: string | null;
  /** Por qué la suma no tiene tope o tiene huecos: «Cena sin rango». */
  readonly nota: string | null;
  /** La franja (NUP-06): dónde van la suma y la marca del objetivo, de 0 a 100. `null` si no hay qué dibujar. */
  readonly franja: { readonly desde: number; readonly hasta: number; readonly abierta: boolean; readonly objetivo: number | null } | null;
}

const listaDeNombres = (ns: readonly string[]): string => (ns.length <= 1 ? (ns[0] ?? '') : `${ns.slice(0, -1).join(', ')} y ${ns[ns.length - 1]}`);

function filaFrenteAlObjetivo(clave: FilaFrenteAlObjetivo['clave'], nombre: string, unidad: string, s: { min: number; max: number | null; conRango: number }, objetivo: number | null, nota: string | null): FilaFrenteAlObjetivo {
  const cifra = (n: number) => (unidad === 'kcal' ? numero(n, 0) : numero(n, 1));
  if (s.conRango === 0) return { clave, nombre, suma: 'Sin rangos indicados', objetivo: objetivo === null ? null : `objetivo ${cifra(objetivo)} ${unidad}`, ubicacion: null, nota: null, franja: null };
  const suma = s.max === null ? `desde ${cifra(s.min)} ${unidad}` : s.min === s.max ? `${cifra(s.min)} ${unidad}` : `${cifra(s.min)}–${cifra(s.max)} ${unidad}`;
  let ubicacion: string | null = null;
  if (objetivo !== null) {
    const u = ubicar(objetivo, { min: s.min, max: s.max });
    ubicacion = u.tipo === 'dentro' ? 'adentro' : u.tipo === 'encima' ? `${cifra(u.diferencia)} ${unidad} por encima del máximo` : `${cifra(u.diferencia)} ${unidad} por debajo del mínimo`;
  }
  // La franja: la escala llega un poco más allá del mayor de los números, para que la marca no quede en el borde.
  const tope = Math.max(s.min, s.max ?? 0, objetivo ?? 0) * 1.15 || 1;
  const a = (n: number) => Math.round((n / tope) * 1000) / 10;
  const franja = { desde: a(s.min), hasta: s.max === null ? 100 : a(s.max), abierta: s.max === null, objetivo: objetivo === null ? null : a(objetivo) };
  return { clave, nombre, suma, objetivo: objetivo === null ? null : `objetivo ${cifra(objetivo)} ${unidad}`, ubicacion, nota, franja };
}

/**
 * NUP-06: la tabla chica de la suma frente al objetivo del día. «Proteínas · 95–130 g · objetivo 112 g · adentro»;
 * «Grasas · 50–75 g · objetivo 335 g · 260 g por encima del máximo». Las kcal salen de los gramos con 4, 4 y 9.
 */
export function sumaFrenteAlObjetivo(suma: SumaDeLosRangos, objetivo: ObjetivoDelDia | null): readonly FilaFrenteAlObjetivo[] {
  const notaDe = (f: FilaDeLaSuma): string | null => {
    if (f.conRango === 0) return null;
    const partes = [...(f.sinRango.length > 0 ? [`${listaDeNombres(f.sinRango)} sin rango`] : []), ...(f.sinMaximo.length > 0 ? [`${listaDeNombres(f.sinMaximo)} sin máximo`] : [])];
    return partes.length > 0 ? `${partes.join(' · ')}: la suma no tiene tope` : null;
  };
  const kcalNota = suma.kcal.conRango > 0 ? `De los gramos, con ${KCAL_POR_GRAMO.protein}, ${KCAL_POR_GRAMO.carbohydrate} y ${KCAL_POR_GRAMO.fat} kcal por gramo${suma.kcal.max === null ? '; algún macro no tiene tope' : ''}` : null;
  return [
    filaFrenteAlObjetivo('kcal', 'kcal', 'kcal', suma.kcal, objetivo?.kcal ?? null, kcalNota),
    ...MACROS_DEL_RANGO.map((m) => filaFrenteAlObjetivo(m, NOMBRE_DEL_MACRO[m], 'g', suma.macros[m], objetivo?.macros[m] ?? null, notaDe(suma.macros[m]))),
  ];
}

/** Una fila en una línea, para el lector de pantalla y las pruebas: «Proteínas · 95–130 g · objetivo 112 g · adentro». */
export const filaEnUnaLinea = (f: FilaFrenteAlObjetivo): string => [f.nombre, f.suma, f.objetivo, f.ubicacion].filter(Boolean).join(' · ');

// ─── NUP-07 · El objetivo: las kcal de los gramos y el porcentaje con su base ────────────────────────────────────

export interface GramosDelObjetivo {
  readonly protein: number | null;
  readonly carbohydrate: number | null;
  readonly fat: number | null;
}

/** NUP-D07: hasta esta parte de las kcal indicadas, las kcal de los gramos «coinciden» (los factores son redondeos). */
export const TOLERANCIA_DE_LAS_KCAL = 0.05;

export interface KcalDeLosGramos {
  /** Las kcal que suman los gramos, con 4, 4 y 9 kcal por gramo. */
  readonly kcal: number;
  /** «112 g × 4 + 80 g × 4 + 335 g × 9». */
  readonly cuenta: string;
  /** Con las kcal indicadas: la diferencia (positiva si los gramos suman más) y si coinciden; `null` sin kcal. */
  readonly frente: { readonly diferencia: number; readonly coinciden: boolean } | null;
}

/** NUP-07: las kcal de los gramos del objetivo. `null` si falta algún macro (no se suma a medias). */
export function kcalDeLosGramos(g: GramosDelObjetivo, kcalIndicadas: number | null): KcalDeLosGramos | null {
  if (MACROS_DEL_RANGO.some((m) => g[m] === null || !Number.isFinite(g[m]!) || g[m]! < 0)) return null;
  const kcal = Math.round(MACROS_DEL_RANGO.reduce((s, m) => s + g[m]! * KCAL_POR_GRAMO[m], 0));
  const cuenta = MACROS_DEL_RANGO.map((m) => `${NOMBRE_DEL_MACRO[m].toLowerCase()} ${numero(g[m]!, 1)} g × ${KCAL_POR_GRAMO[m]}`).join(' + ');
  const frente = kcalIndicadas !== null && kcalIndicadas > 0 ? { diferencia: kcal - Math.round(kcalIndicadas), coinciden: Math.abs(kcal - kcalIndicadas) <= kcalIndicadas * TOLERANCIA_DE_LAS_KCAL } : null;
  return { kcal, cuenta, frente };
}

/**
 * NUP-D08: el porcentaje de las kcal de un macro, con su base y sus gramos: «18 % de las 2.500 kcal · 112 g · 448 kcal».
 * `null` sin kcal indicadas o sin gramos.
 */
export function porcentajeDeLasKcal(macro: MacroDelRango, gramosDelMacro: number | null, kcalIndicadas: number | null): string | null {
  if (gramosDelMacro === null || !Number.isFinite(gramosDelMacro) || gramosDelMacro < 0 || kcalIndicadas === null || !(kcalIndicadas > 0)) return null;
  const kcal = gramosDelMacro * KCAL_POR_GRAMO[macro];
  return `${numero((kcal / kcalIndicadas) * 100, 0)} % de las ${numero(kcalIndicadas, 0)} kcal · ${numero(gramosDelMacro, 1)} g · ${numero(kcal, 0)} kcal`;
}

export const COPY_PLANIFICACION = {
  // NUP-02
  indicado: 'Indicado',
  // NUP-04
  frenteAlRango: 'Frente a los rangos indicados',
  frenteAlRangoAyuda: 'Ubica, no corrige: podés dejarla así.',
  // NUP-05
  rangoDeLaComida: (comida: string) => `Rango indicado de ${comida}`,
  // NUP-06
  sumaTitulo: 'Los rangos de las comidas frente al objetivo del día',
  sumaAyuda: 'Suma lo que indicaste para cada comida. Es otra cuenta que «Rangos y totales», que suma lo que aportan las opciones armadas.',
  sumaSinObjetivo: 'Esta versión todavía no tiene un objetivo general: la suma se ve sin compararla.',
  sumaSinRangos: 'Todavía no indicaste rangos en las comidas de este día tipo.',
  columnaSuma: 'Suma de los rangos',
  columnaObjetivo: 'Objetivo del día',
  columnaUbicacion: 'Dónde queda el objetivo',
  // NUP-07
  kcalDeLosGramos: (k: KcalDeLosGramos) => `Los gramos suman ${numero(k.kcal, 0)} kcal (${k.cuenta}).`,
  noCoinciden: (k: KcalDeLosGramos, indicadas: number) =>
    `No coinciden con las ${numero(indicadas, 0)} kcal indicadas: los gramos suman ${numero(Math.abs(k.frente!.diferencia), 0)} kcal ${k.frente!.diferencia > 0 ? 'más' : 'menos'}. Revisá los gramos o las kcal; se puede guardar igual.`,
  coinciden: (indicadas: number) => `Coinciden con las ${numero(indicadas, 0)} kcal indicadas.`,
  // NUP-12
  empezaCon: 'Empezá con:',
  unaHabitual: 'una comida habitual',
  copiarDeOtra: 'copiar de otra comida',
  unaReceta: 'una receta',
  alimentos: 'alimentos',
} as const;
