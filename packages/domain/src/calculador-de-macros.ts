/**
 * WP-OBJETIVO-Y-CALCULADOR (DL-186; pedido de Dirección del 2026-11-19) · El calculador de macros del profesional, sin
 * base ni pantalla: la misma cuenta la hace el website, en vivo, y la API, al guardarla con el objetivo.
 *
 * - **El gasto en reposo, con su método a la vista:** cinco ecuaciones publicadas, cada una con su fórmula, los datos que
 *   usa y su cita. Si falta un dato, el método dice cuál; si la persona queda fuera de la población de la ecuación, lo
 *   dice. Nunca inventa un dato ni elige un método por su cuenta (REG-06-157: BE no impone una fórmula).
 * - **El gasto total:** el de reposo por un factor de actividad que elige el profesional, con una variante para el día de
 *   descanso; y el ajuste (déficit o superávit) que escribe él.
 * - **Los macros:** proteína y grasa en g/kg (del peso o de la masa libre de grasa, a elección), los carbohidratos por
 *   diferencia, con 4, 4 y 9 kcal por gramo. El «%» va siempre con su base: la energía del día.
 * - **La propuesta de rangos:** por día tipo, el número del día con la tolerancia que elige el profesional; por comida, el
 *   reparto que él elige. Es una propuesta: se guarda solo si el profesional la revisa y la guarda.
 * Todo es una estimación. Ubica, no califica: devuelve números, nunca categorías.
 */
import type {
  DatoDelCalculo,
  DatosUsados,
  GastoEnReposo,
  MacrosDelDia,
  MetodoDeReposo,
  ParametrosDelCalculo,
  ProblemaDelCalculo,
  ResultadoDelCalculo,
  SexoDelCalculo,
} from './contratos-objetivo-y-calculador';
import { numero } from './formato-numeros';

// ─── Los métodos del gasto en reposo ────────────────────────────────────────────────────────────

/** Lo que el profesional ve de cada método al elegirlo. */
export interface FichaDelMetodoDeReposo {
  readonly metodo: MetodoDeReposo;
  readonly nombre: string;
  readonly necesita: readonly DatoDelCalculo[];
  /** Para qué población se publicó, en una línea. */
  readonly poblacion: string;
  readonly cita: string;
}

export const FICHA_DEL_METODO_DE_REPOSO: Readonly<Record<MetodoDeReposo, FichaDelMetodoDeReposo>> = {
  MIFFLIN_ST_JEOR: {
    metodo: 'MIFFLIN_ST_JEOR',
    nombre: 'Mifflin-St Jeor (1990)',
    necesita: ['weightKg', 'heightCm', 'ageYears', 'sex'],
    poblacion: 'Adultos de 19 a 78 años, con peso habitual y con obesidad, medidos por calorimetría indirecta.',
    cita: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247. doi:10.1093/ajcn/51.2.241',
  },
  HARRIS_BENEDICT_REVISED: {
    metodo: 'HARRIS_BENEDICT_REVISED',
    nombre: 'Harris-Benedict revisada (Roza y Shizgal, 1984)',
    necesita: ['weightKg', 'heightCm', 'ageYears', 'sex'],
    poblacion: 'Adultos; los coeficientes de Harris y Benedict (1919) recalculados con sus datos y los de estudios posteriores.',
    cita: 'Roza AM, Shizgal HM. The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. Am J Clin Nutr. 1984;40(1):168-182. doi:10.1093/ajcn/40.1.168',
  },
  FAO_WHO_UNU_1985: {
    metodo: 'FAO_WHO_UNU_1985',
    nombre: 'FAO/OMS/UNU (1985), por peso y edad',
    necesita: ['weightKg', 'ageYears', 'sex'],
    poblacion: 'Ecuaciones de Schofield por sexo y franja de edad (18 a 29, 30 a 59 y 60 o más años); usan solo el peso.',
    cita: 'FAO/WHO/UNU. Energy and protein requirements. Report of a Joint FAO/WHO/UNU Expert Consultation. WHO Technical Report Series 724. Ginebra: OMS; 1985 (tabla 5).',
  },
  KATCH_MCARDLE: {
    metodo: 'KATCH_MCARDLE',
    nombre: 'Katch-McArdle',
    necesita: ['leanMassKg'],
    poblacion: 'Adultos; usa la masa libre de grasa, sin sexo ni edad. Depende de cómo se estimó la masa libre de grasa.',
    cita: 'Katch FI, McArdle WD. Nutrition, weight control, and exercise. Boston: Houghton Mifflin; 1977. McArdle WD, Katch FI, Katch VL. Exercise physiology: nutrition, energy, and human performance. 8.ª ed. Filadelfia: Wolters Kluwer; 2015.',
  },
  CUNNINGHAM_1980: {
    metodo: 'CUNNINGHAM_1980',
    nombre: 'Cunningham (1980)',
    necesita: ['leanMassKg'],
    poblacion: 'Adultos, sobre los datos de Harris y Benedict; usa la masa libre de grasa. Suele usarse en personas que entrenan.',
    cita: 'Cunningham JJ. A reanalysis of the factors influencing basal metabolic rate in normal adults. Am J Clin Nutr. 1980;33(11):2372-2374. doi:10.1093/ajcn/33.11.2372',
  },
};

export const NOMBRE_DEL_DATO: Readonly<Record<DatoDelCalculo, string>> = {
  weightKg: 'el peso',
  heightCm: 'la talla',
  ageYears: 'la edad',
  sex: 'el sexo de la ecuación',
  leanMassKg: 'la masa libre de grasa',
};

/** Los factores de actividad que se ofrecen, con su franja de la FAO/OMS/UNU (2004). El profesional puede escribir otro. */
export const FACTORES_DE_ACTIVIDAD: readonly { readonly valor: number; readonly texto: string }[] = [
  { valor: 1.4, texto: '1,40 · sedentario o liviano (franja 1,40 a 1,69)' },
  { valor: 1.55, texto: '1,55 · sedentario o liviano, en el medio de la franja' },
  { valor: 1.7, texto: '1,70 · activo o moderado (franja 1,70 a 1,99)' },
  { valor: 1.85, texto: '1,85 · activo o moderado, en el medio de la franja' },
  { valor: 2, texto: '2,00 · vigoroso (franja 2,00 a 2,40)' },
  { valor: 2.2, texto: '2,20 · vigoroso, en el medio de la franja' },
];
export const CITA_DEL_FACTOR_DE_ACTIVIDAD =
  'FAO/WHO/UNU. Human energy requirements. Report of a Joint FAO/WHO/UNU Expert Consultation (Roma, 2001). FAO Food and Nutrition Technical Report Series 1. Roma: FAO; 2004 (tabla 4.1, niveles de actividad física).';

/** La mitad hacia arriba, al entero: 1.306,5 kcal es 1.307. */
const entero = (x: number): number => Math.floor(x + 0.5 + 1e-9);
const n = (x: number): string => numero(x, 3);

/** Los datos del cálculo, como números (o `null` si faltan), con el sexo elegido. */
interface Datos {
  readonly weightKg: number | null;
  readonly heightCm: number | null;
  readonly ageYears: number | null;
  readonly sex: SexoDelCalculo | null;
  readonly leanMassKg: number | null;
}

const datosDe = (d: DatosUsados, sex: SexoDelCalculo | null): Datos => ({
  weightKg: d.weightKg?.value ?? null,
  heightCm: d.heightCm?.value ?? null,
  ageYears: d.ageYears?.value ?? null,
  sex,
  leanMassKg: d.leanMassKg?.value ?? null,
});

/** Un término de la ecuación: el coeficiente, su dato y cómo se lee. */
type Termino = { readonly coef: number; readonly dato: 'weightKg' | 'heightCm' | 'ageYears' | 'leanMassKg' };
const LETRA: Readonly<Record<Termino['dato'], string>> = { weightKg: 'peso (kg)', heightCm: 'talla (cm)', ageYears: 'edad (años)', leanMassKg: 'masa libre de grasa (kg)' };

/**
 * Una ecuación lineal: la constante y sus términos, escrita con letras y con números. Con `constanteAlFinal`, como la
 * publicó Mifflin («… − 161»); si no, adelante, como Harris-Benedict o Katch-McArdle («370 + 21,6 × …»).
 */
function lineal(metodo: MetodoDeReposo, constante: number, terminos: readonly Termino[], d: Datos, constanteAlFinal = false): { readonly gasto: GastoEnReposo; readonly exacto: number | null } {
  const escribir = (conNumeros: boolean): string => {
    const piezas: { valor: number; texto: string }[] = terminos.map((x) => ({ valor: x.coef, texto: `${n(Math.abs(x.coef))} × ${conNumeros ? n(d[x.dato] as number) : LETRA[x.dato]}` }));
    const c = { valor: constante, texto: n(Math.abs(constante)) };
    const orden = constante === 0 ? piezas : constanteAlFinal ? [...piezas, c] : [c, ...piezas];
    return orden.map((p, i) => (i === 0 ? `${p.valor < 0 ? '−' : ''}${p.texto}` : `${p.valor < 0 ? ' − ' : ' + '}${p.texto}`)).join('');
  };
  const exacto = terminos.reduce((s, x) => s + x.coef * (d[x.dato] as number), constante);
  if (!(exacto > 0)) return { gasto: { state: 'OUT_OF_RANGE', method: metodo, reason: 'Con estos datos la ecuación da cero o menos: queda fuera de su dominio.' }, exacto: null };
  return { gasto: { state: 'CALCULATED', method: metodo, kcal: entero(exacto), equation: escribir(false), applied: `${escribir(true)} = ${numero(exacto, 1)}` }, exacto };
}

/** Las franjas de edad de la FAO/OMS/UNU (1985) para adultos: kcal = a × peso + b. */
const FAO_1985: Readonly<Record<SexoDelCalculo, readonly { readonly desde: number; readonly hasta: number; readonly a: number; readonly b: number; readonly franja: string }[]>> = {
  MALE: [
    { desde: 18, hasta: 30, a: 15.3, b: 679, franja: 'hombres de 18 a 29 años' },
    { desde: 30, hasta: 60, a: 11.6, b: 879, franja: 'hombres de 30 a 59 años' },
    { desde: 60, hasta: Number.POSITIVE_INFINITY, a: 13.5, b: 487, franja: 'hombres de 60 años o más' },
  ],
  FEMALE: [
    { desde: 18, hasta: 30, a: 14.7, b: 496, franja: 'mujeres de 18 a 29 años' },
    { desde: 30, hasta: 60, a: 8.7, b: 829, franja: 'mujeres de 30 a 59 años' },
    { desde: 60, hasta: Number.POSITIVE_INFINITY, a: 10.5, b: 596, franja: 'mujeres de 60 años o más' },
  ],
};

/** Lo que falta para un método, en el orden de su ficha. */
export function datosQueFaltan(metodo: MetodoDeReposo, d: Pick<Datos, DatoDelCalculo>): DatoDelCalculo[] {
  return FICHA_DEL_METODO_DE_REPOSO[metodo].necesita.filter((x) => d[x] === null || d[x] === undefined);
}

/** El gasto en reposo con un método, con el valor sin redondear (para el gasto total, que se redondea una sola vez). */
function gastoEnReposoExacto(metodo: MetodoDeReposo, d: Datos): { readonly gasto: GastoEnReposo; readonly exacto: number | null } {
  const faltan = datosQueFaltan(metodo, d);
  if (faltan.length > 0) return { gasto: { state: 'MISSING_DATA', method: metodo, missing: faltan }, exacto: null };
  const necesita = FICHA_DEL_METODO_DE_REPOSO[metodo].necesita;
  if (d.ageYears !== null && necesita.includes('ageYears') && d.ageYears < 18) {
    return { gasto: { state: 'OUT_OF_RANGE', method: metodo, reason: 'La ecuación de adultos no se aplica antes de los 18 años.' }, exacto: null };
  }
  if (d.leanMassKg !== null && d.weightKg !== null && necesita.includes('leanMassKg') && d.leanMassKg >= d.weightKg) {
    return { gasto: { state: 'OUT_OF_RANGE', method: metodo, reason: 'La masa libre de grasa no puede ser igual o mayor que el peso: revisá la toma o lo escrito.' }, exacto: null };
  }
  const masculino = d.sex === 'MALE';
  switch (metodo) {
    case 'MIFFLIN_ST_JEOR':
      return lineal(metodo, masculino ? 5 : -161, [{ coef: 10, dato: 'weightKg' }, { coef: 6.25, dato: 'heightCm' }, { coef: -5, dato: 'ageYears' }], d, true);
    case 'HARRIS_BENEDICT_REVISED':
      return masculino
        ? lineal(metodo, 88.362, [{ coef: 13.397, dato: 'weightKg' }, { coef: 4.799, dato: 'heightCm' }, { coef: -5.677, dato: 'ageYears' }], d)
        : lineal(metodo, 447.593, [{ coef: 9.247, dato: 'weightKg' }, { coef: 3.098, dato: 'heightCm' }, { coef: -4.33, dato: 'ageYears' }], d);
    case 'FAO_WHO_UNU_1985': {
      const f = FAO_1985[d.sex as SexoDelCalculo].find((x) => (d.ageYears as number) >= x.desde && (d.ageYears as number) < x.hasta)!;
      const r = lineal(metodo, f.b, [{ coef: f.a, dato: 'weightKg' }], d, true);
      return r.gasto.state === 'CALCULATED' ? { gasto: { ...r.gasto, equation: `${r.gasto.equation} (${f.franja})` }, exacto: r.exacto } : r;
    }
    case 'KATCH_MCARDLE':
      return lineal(metodo, 370, [{ coef: 21.6, dato: 'leanMassKg' }], d);
    case 'CUNNINGHAM_1980':
      return lineal(metodo, 500, [{ coef: 22, dato: 'leanMassKg' }], d);
  }
}

/** El gasto en reposo con un método: calculado, con su fórmula y sus números; o lo que falta; o por qué no se aplica. */
export function gastoEnReposo(metodo: MetodoDeReposo, d: Datos): GastoEnReposo {
  return gastoEnReposoExacto(metodo, d).gasto;
}

// ─── Gasto total, ajuste y macros ───────────────────────────────────────────────────────────────

const conAjuste = (total: number, a: ParametrosDelCalculo['adjustment']): number => {
  if (!a) return total;
  return a.kind === 'KCAL' ? entero(total + a.value) : entero(total * (1 + a.value / 100));
};

const unDecimal = (x: number): number => entero(x * 10) / 10;
const dosDecimales = (x: number): number => entero(x * 100) / 100;

/** Los macros de un día con su energía: proteína y grasa por kilo de la base, los carbohidratos por diferencia. */
export function macrosDelDia(energia: number, baseKg: number, proteinaPorKg: number, grasaPorKg: number): { readonly macros: MacrosDelDia; readonly negativo: boolean } {
  const p = entero(proteinaPorKg * baseKg);
  const g = entero(grasaPorKg * baseKg);
  const resto = energia - 4 * p - 9 * g;
  const c = resto > 0 ? entero(resto / 4) : 0;
  const parte = (kcal: number) => (energia > 0 ? unDecimal((kcal / energia) * 100) : 0);
  return {
    negativo: resto < 0,
    macros: {
      energyKcal: energia,
      protein: { grams: p, perKg: proteinaPorKg, kcal: 4 * p, energyShare: parte(4 * p) },
      carbohydrate: { grams: c, perKg: dosDecimales(c / baseKg), kcal: 4 * c, energyShare: parte(4 * c) },
      fat: { grams: g, perKg: grasaPorKg, kcal: 9 * g, energyShare: parte(9 * g) },
    },
  };
}

/**
 * El cálculo entero, con los datos usados y lo que eligió el profesional. Es lo que la API guarda con el objetivo: la
 * misma función en las dos puntas, así la pantalla y lo guardado no pueden decir cosas distintas.
 */
export function calcularObjetivo(datos: DatosUsados, p: ParametrosDelCalculo): ResultadoDelCalculo {
  const d = datosDe(datos, p.sex);
  const { gasto: resting, exacto } = gastoEnReposoExacto(p.restingMethod, d);
  const issues: ProblemaDelCalculo[] = [];
  if (resting.state !== 'CALCULATED' || exacto === null) return { resting, totals: null, energy: null, macros: null, issues };
  // El exacto, no el redondeado: el gasto total sale de la ecuación, y se redondea una sola vez.
  const reposo = exacto;
  const totals = { day: entero(reposo * p.activity.factor), restDay: p.activity.restDayFactor === null ? null : entero(reposo * p.activity.restDayFactor) };
  const energy = { day: conAjuste(totals.day, p.adjustment), restDay: totals.restDay === null ? null : conAjuste(totals.restDay, p.adjustment) };
  let macros: ResultadoDelCalculo['macros'] = null;
  // Un déficit mayor que el gasto total deja la energía en cero o menos: se dice, y no se reparten macros sobre eso.
  if (!(energy.day > 0) || (energy.restDay !== null && !(energy.restDay > 0))) return { resting, totals, energy, macros: null, issues: ['ENERGY_NOT_POSITIVE'] };
  if (p.macros) {
    const baseKg = p.macros.base === 'LEAN_MASS' ? d.leanMassKg : d.weightKg;
    if (baseKg === null || !(baseKg > 0)) issues.push(p.macros.base === 'LEAN_MASS' ? 'LEAN_MASS_MISSING' : 'WEIGHT_MISSING');
    else {
      const dia = macrosDelDia(energy.day, baseKg, p.macros.proteinPerKg, p.macros.fatPerKg);
      const descanso = energy.restDay === null ? null : macrosDelDia(energy.restDay, baseKg, p.macros.proteinPerKg, p.macros.fatPerKg);
      if (dia.negativo || descanso?.negativo) issues.push('CARBOHYDRATE_NEGATIVE');
      macros = { base: p.macros.base, baseKg, day: dia.macros, restDay: descanso?.macros ?? null };
    }
  }
  return { resting, totals, energy, macros, issues };
}

/**
 * La declaración del método para el objetivo, en una línea, para que quede con la versión: «Mifflin-St Jeor (1990) con la
 * toma del 10/11 · factor 1,55 · −300 kcal · proteína 1,8 g/kg y grasa 0,9 g/kg del peso».
 */
export function declaracionDelCalculo(p: ParametrosDelCalculo, fuente: string, resultado: ResultadoDelCalculo | null = null): string {
  const partes = [`${FICHA_DEL_METODO_DE_REPOSO[p.restingMethod].nombre} ${fuente}`, `factor de actividad ${numero(p.activity.factor, 2)}${p.activity.restDayFactor === null ? '' : ` (descanso ${numero(p.activity.restDayFactor, 2)})`}`];
  if (p.adjustment?.kind === 'KCAL') partes.push(`ajuste ${p.adjustment.value > 0 ? '+' : ''}${numero(p.adjustment.value, 0)} kcal`);
  // El «%» con su base y su número: de las kcal del gasto total del día.
  if (p.adjustment?.kind === 'PERCENT') {
    const base = resultado?.totals?.day;
    partes.push(`ajuste ${p.adjustment.value > 0 ? '+' : ''}${numero(p.adjustment.value, 1)} %${base ? ` de las ${numero(base, 0)} kcal del gasto total` : ' del gasto total'}`);
  }
  if (p.macros) partes.push(`proteína ${numero(p.macros.proteinPerKg, 2)} g/kg y grasa ${numero(p.macros.fatPerKg, 2)} g/kg ${p.macros.base === 'LEAN_MASS' ? 'de la masa libre de grasa' : 'del peso'}, carbohidratos por diferencia`);
  return `Estimación: ${partes.join(' · ')}.`.slice(0, 1000);
}

/**
 * Lo que «Usar estos valores» escribe en la declaración del método del objetivo: solo el método, sin la toma, su fecha,
 * el factor, el ajuste ni los g/kg. La versión del objetivo la leen también los profesionales con los que la persona
 * comparte Nutrición (API-RES-06), que pueden no tener Antropometría: con los g/kg y los gramos del objetivo se deduce el
 * peso (o la masa libre de grasa), y con el factor y el ajuste, el gasto en reposo de una ecuación de un solo dato. El
 * detalle queda con el cálculo (API-OBC-03), detrás del permiso de Antropometría.
 */
export function declaracionCompartible(p: Pick<ParametrosDelCalculo, 'restingMethod' | 'macros'>): string {
  return `Estimación de partida con el calculador de BE: gasto en reposo por ${FICHA_DEL_METODO_DE_REPOSO[p.restingMethod].nombre}${p.macros ? ', carbohidratos por diferencia' : ''}.`;
}

// ─── La propuesta de rangos ─────────────────────────────────────────────────────────────────────

export const MACROS_DE_LA_PROPUESTA = ['protein', 'carbohydrate', 'fat'] as const;
export type MacroDeLaPropuesta = (typeof MACROS_DE_LA_PROPUESTA)[number];
export type GramosDelDia = Readonly<Record<MacroDeLaPropuesta, number>>;
/** El reparto de una comida: qué parte del día lleva de cada macro, en porcentaje. */
export type RepartoDeUnaComida = Readonly<Record<MacroDeLaPropuesta, number>>;
export type RangoPropuesto = Readonly<Record<MacroDeLaPropuesta, { readonly min: number; readonly max: number }>>;

/** La tolerancia de la propuesta, en ± % del número central. */
export const TOPES_DE_LA_TOLERANCIA = { minimo: 0, maximo: 50 } as const;

/** Un número con su tolerancia: el mínimo y el máximo al gramo (la mitad hacia arriba), nunca negativos. */
function alrededor(g: number, tolerancia: number): { min: number; max: number } {
  return { min: Math.max(0, entero(g * (1 - tolerancia / 100))), max: entero(g * (1 + tolerancia / 100)) };
}

/**
 * Lo que tiene de malo un reparto, si algo: cada macro tiene que sumar 100 % entre las comidas (con medio punto de
 * redondeo), y ningún porcentaje puede ser negativo.
 */
export function problemasDelReparto(reparto: readonly RepartoDeUnaComida[]): { readonly macro: MacroDeLaPropuesta; readonly suma: number }[] {
  return MACROS_DE_LA_PROPUESTA.flatMap((m) => {
    const suma = reparto.reduce((s, c) => s + c[m], 0);
    return Math.abs(suma - 100) > 0.5 || reparto.some((c) => !(c[m] >= 0)) ? [{ macro: m, suma: unDecimal(suma) }] : [];
  });
}

/**
 * Un total entero repartido en enteros según los pesos, por el resto mayor: la suma da exactamente el total (con pesos
 * 1, 1 y 1, 10 g son 4, 3 y 3). Sin pesos positivos, todo en cero.
 */
export function repartirEnteros(total: number, pesos: readonly number[]): number[] {
  const suma = pesos.reduce((s, x) => s + Math.max(0, x), 0);
  if (!(suma > 0) || pesos.length === 0) return pesos.map(() => 0);
  const crudos = pesos.map((x) => (Math.max(0, x) / suma) * total);
  const base = crudos.map((x) => Math.floor(x + 1e-9));
  let falta = total - base.reduce((s, x) => s + x, 0);
  const orden = crudos.map((x, i) => ({ i, resto: x - Math.floor(x + 1e-9) })).sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (const { i } of orden) {
    if (falta <= 0) break;
    base[i] = base[i]! + 1;
    falta -= 1;
  }
  return base;
}

/**
 * La propuesta para un día tipo: el rango del día y el de cada comida, en gramos. `null` si el reparto no suma 100 %.
 * Los mínimos y los máximos de las comidas salen de repartir los del día por el resto mayor: sumados, dan exactamente el
 * rango del día (lo que se ve por comida y lo que se ve por día no se contradicen por un redondeo).
 */
export function propuestaDeRangos(gramos: GramosDelDia, tolerancia: number, reparto: readonly RepartoDeUnaComida[]): { readonly dia: RangoPropuesto; readonly comidas: readonly RangoPropuesto[] } | null {
  if (reparto.length > 0 && problemasDelReparto(reparto).length > 0) return null;
  const t = Math.min(TOPES_DE_LA_TOLERANCIA.maximo, Math.max(TOPES_DE_LA_TOLERANCIA.minimo, tolerancia));
  const dia: RangoPropuesto = { protein: alrededor(gramos.protein, t), carbohydrate: alrededor(gramos.carbohydrate, t), fat: alrededor(gramos.fat, t) };
  const columnas = Object.fromEntries(
    MACROS_DE_LA_PROPUESTA.map((m) => {
      const pesos = reparto.map((c) => c[m]);
      const minimos = repartirEnteros(dia[m].min, pesos);
      const maximos = repartirEnteros(dia[m].max, pesos);
      return [m, minimos.map((min, i) => ({ min, max: Math.max(min, maximos[i]!) }))];
    }),
  ) as Record<MacroDeLaPropuesta, { min: number; max: number }[]>;
  return { dia, comidas: reparto.map((_, i) => ({ protein: columnas.protein[i]!, carbohydrate: columnas.carbohydrate[i]!, fat: columnas.fat[i]! })) };
}

/** Enteros que suman exactamente 100, por el resto mayor: [1, 1, 1] es 34, 33 y 33. */
export function porcentajesQueSuman100(pesos: readonly number[]): number[] {
  const total = pesos.reduce((s, x) => s + Math.max(0, x), 0);
  if (pesos.length === 0) return [];
  if (!(total > 0)) return porcentajesQueSuman100(pesos.map(() => 1));
  const crudos = pesos.map((x) => (Math.max(0, x) / total) * 100);
  const base = crudos.map((x) => Math.floor(x));
  let falta = 100 - base.reduce((s, x) => s + x, 0);
  const orden = crudos.map((x, i) => ({ i, resto: x - Math.floor(x) })).sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (const { i } of orden) {
    if (falta <= 0) break;
    base[i] = base[i]! + 1;
    falta -= 1;
  }
  return base;
}

/** Repartir parejo: cada comida, la misma parte de cada macro. */
export function repartoParejo(comidas: number): RepartoDeUnaComida[] {
  const p = porcentajesQueSuman100(Array.from({ length: comidas }, () => 1));
  return p.map((x) => ({ protein: x, carbohydrate: x, fat: x }));
}

/**
 * Un punto de partida por el nombre de cada comida, como el ejemplo de Dirección: más carbohidratos en el desayuno y el
 * almuerzo; la merienda, con más proteína y grasa; las colaciones, más chicas. Lo que no se reconoce va parejo. El
 * profesional lo cambia: es una sugerencia, no una regla.
 */
export function repartoSugerido(nombres: readonly string[]): RepartoDeUnaComida[] {
  const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const peso = (nombre: string): RepartoDeUnaComida => {
    const t = sinTildes(nombre);
    if (/colacion|snack|media manana|pre ?entreno|post ?entreno/.test(t)) return { protein: 0.6, carbohydrate: 0.5, fat: 0.5 };
    if (/desayuno/.test(t)) return { protein: 1, carbohydrate: 1.4, fat: 0.8 };
    if (/almuerzo/.test(t)) return { protein: 1.2, carbohydrate: 1.5, fat: 1 };
    if (/merienda/.test(t)) return { protein: 1.2, carbohydrate: 0.6, fat: 1.3 };
    if (/cena/.test(t)) return { protein: 1.2, carbohydrate: 0.8, fat: 1 };
    return { protein: 1, carbohydrate: 1, fat: 1 };
  };
  const pesos = nombres.map(peso);
  const columnas = Object.fromEntries(MACROS_DE_LA_PROPUESTA.map((m) => [m, porcentajesQueSuman100(pesos.map((x) => x[m]))])) as Record<MacroDeLaPropuesta, number[]>;
  return nombres.map((_, i) => ({ protein: columnas.protein[i]!, carbohydrate: columnas.carbohydrate[i]!, fat: columnas.fat[i]! }));
}

