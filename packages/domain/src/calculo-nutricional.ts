/**
 * Energía y macros de una receta, de una opción del plan o de lo consumido (DL-119): método `SUM_SOURCE_PER_100G_V1`.
 *
 * - **La fórmula.** Para cada nutriente, la suma de (gramos ÷ 100 × valor cada 100 g del alimento). Las kcal salen de la
 *   energía de la fuente: no se reemplazan por 4/4/9. Los carbohidratos son los de la fuente («by difference» en USDA),
 *   no netos.
 * - **Aritmética exacta.** Cada valor se toma por su escritura decimal (un número JSON 28.17 es 28,17 exacto) y se opera
 *   con racionales de `BigInt`. No hay redondeo intermedio: se redondea solo al mostrar, HALF_UP, las kcal a entero y los
 *   gramos a un decimal (`redondeoDePresentacion`).
 * - **Lo que falta es desconocido, nunca cero.** Un ingrediente sin cantidad, sin composición, sin el dato de un nutriente
 *   o en una unidad sin equivalencia deja ese nutriente sin total y lo nombra en `faltan`. No hay total parcial que se
 *   pueda leer como completo.
 * - **Sin conversiones inventadas.** Gramos con una composición cada 100 g, y mililitros con una cada 100 ml. Mililitros
 *   contra gramos, o «unidad», no tienen densidad ni peso unitario identificados: quedan sin dato.
 * - **«No lo comí»** (`noConsumido`) aporta cero porque la persona lo declaró, no porque falte la cantidad.
 *
 * Es lógica pura, sin dependencias: la usan la API, que es la fuente del resultado, y las pantallas solo para mostrarlo.
 */

/** El identificador del método, que se guarda con cada resultado para poder versionar otra interpretación. */
export const METODO_DE_CALCULO_NUTRICIONAL = 'SUM_SOURCE_PER_100G_V1' as const;
export type MetodoDeCalculoNutricional = typeof METODO_DE_CALCULO_NUTRICIONAL;

/** Los nutrientes que calcula BE, con los nombres de la composición del catálogo. */
export const NUTRIENTES_CALCULADOS = ['energyKcal', 'carbohydrateG', 'fatG', 'proteinG', 'fiberG'] as const;
export type NutrienteCalculado = (typeof NUTRIENTES_CALCULADOS)[number];

/** Cuántos decimales se muestran: las kcal a entero y los gramos a un decimal. */
export const DECIMALES_DE_PRESENTACION: Readonly<Record<NutrienteCalculado, number>> = { energyKcal: 0, carbohydrateG: 1, fatG: 1, proteinG: 1, fiberG: 1 };

/** Lo mínimo de una composición del catálogo que usa el cálculo. Un nutriente ausente o `null` es desconocido. */
export interface ComposicionParaCalcular {
  readonly referenceAmount: '100g' | '100ml';
  readonly energyKcal?: number | string | null;
  readonly carbohydrateG?: number | string | null;
  readonly fatG?: number | string | null;
  readonly proteinG?: number | string | null;
  readonly fiberG?: number | string | null;
}

export interface IngredienteDelCalculo {
  /** Cómo se nombra el ingrediente en lo que falta: el ítem, el ingrediente de la receta o el alimento. */
  readonly clave: string;
  /** `null`: la cantidad no se conoce. Nunca se reemplaza por cero ni por la prevista. */
  readonly cantidad: { readonly value: number | string; readonly unit: 'g' | 'ml' | 'unit' } | null;
  readonly composicion: ComposicionParaCalcular | null;
  /** La persona declaró que no lo comió: aporta cero. */
  readonly noConsumido?: boolean;
}

export type MotivoDeFaltante = 'SIN_CANTIDAD' | 'SIN_COMPOSICION' | 'SIN_DATO_DEL_NUTRIENTE' | 'UNIDAD_SIN_EQUIVALENCIA';

export interface Faltante {
  readonly clave: string;
  readonly motivo: MotivoDeFaltante;
}

export interface ValorCalculado {
  /** El total exacto en decimal (punto como separador), o `null` si algún ingrediente no permite calcularlo. */
  readonly exacto: string | null;
  /** Qué ingredientes impiden el total, y por qué. Vacío si el total está completo. */
  readonly faltan: readonly Faltante[];
}

export interface ResultadoNutricional {
  readonly metodo: MetodoDeCalculoNutricional;
  readonly nutrientes: Readonly<Record<NutrienteCalculado, ValorCalculado>>;
}

/** Una cantidad o un valor que no es un número válido para el cálculo. La API lo rechaza antes como 400. */
export class ValorNoCalculable extends Error {
  constructor(readonly detalle: string) {
    super(detalle);
    this.name = 'ValorNoCalculable';
  }
}

// ─── Racionales exactos ─────────────────────────────────────────────────────────────────────────

/** Un racional reducido, con denominador positivo. */
export interface Racional {
  readonly n: bigint;
  readonly d: bigint;
}

const mcd = (a: bigint, b: bigint): bigint => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
};

function racional(n: bigint, d: bigint = 1n): Racional {
  if (d === 0n) throw new ValorNoCalculable('división por cero');
  const signo = d < 0n ? -1n : 1n;
  const g = mcd(n, d) || 1n;
  return { n: (signo * n) / g, d: (signo * d) / g };
}

const CERO: Racional = { n: 0n, d: 1n };
const sumar = (a: Racional, b: Racional): Racional => racional(a.n * b.d + b.n * a.d, a.d * b.d);
const multiplicar = (a: Racional, b: Racional): Racional => racional(a.n * b.n, a.d * b.d);
const dividir = (a: Racional, b: Racional): Racional => racional(a.n * b.d, a.d * b.n);

/**
 * El valor exacto de una escritura decimal («28.17», «0.5», «130.0», «1e-3») o de un número de JS por su escritura más
 * corta (`String(28.17)` es «28.17»). Devuelve `null` si no es un número finito.
 */
export function decimalExacto(valor: number | string): Racional | null {
  if (typeof valor === 'number' && !Number.isFinite(valor)) return null;
  const texto = (typeof valor === 'number' ? String(valor) : valor).trim();
  const m = /^([+-])?(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(texto) ?? /^([+-])?()\.(\d+)(?:[eE]([+-]?\d+))?$/.exec(texto);
  if (!m) return null;
  const signo = m[1] === '-' ? -1n : 1n;
  const enteros = m[2] ?? '';
  const decimales = m[3] ?? '';
  const exponente = Number(m[4] ?? '0');
  if (!Number.isInteger(exponente) || Math.abs(exponente) > 400) return null;
  let numerador = BigInt((enteros || '0') + decimales) * signo;
  let denominador = 10n ** BigInt(decimales.length);
  if (exponente > 0) numerador *= 10n ** BigInt(exponente);
  else if (exponente < 0) denominador *= 10n ** BigInt(-exponente);
  return racional(numerador, denominador);
}

/** Cuántas veces divide `p` a `x`. */
const factor = (x: bigint, p: bigint): number => {
  let k = 0;
  while (x % p === 0n) {
    x /= p;
    k++;
  }
  return k;
};

/** Cuántos decimales de precisión interna se guardan cuando la división por porciones no da un decimal finito. */
export const DECIMALES_INTERNOS_MAXIMOS = 6;

/**
 * El racional en decimal, con punto: exacto si es un decimal finito («529.22»); si no (una división por 3 porciones), con
 * `DECIMALES_INTERNOS_MAXIMOS` decimales, HALF_UP.
 */
export function aDecimal(q: Racional): string {
  let d = q.d;
  const dos = factor(d, 2n);
  const cinco = factor(d, 5n);
  d = d / (2n ** BigInt(dos)) / (5n ** BigInt(cinco));
  if (d === 1n) {
    const escala = Math.max(dos, cinco);
    const entero = (q.n * 10n ** BigInt(escala)) / q.d;
    return conDecimales(entero, escala, true);
  }
  return redondearHalfUp(q, DECIMALES_INTERNOS_MAXIMOS, true);
}

/** `valor` escalado por 10^decimales, como texto decimal; sin ceros finales si `recortar`. */
function conDecimales(valor: bigint, decimales: number, recortar: boolean): string {
  const negativo = valor < 0n;
  const absoluto = (negativo ? -valor : valor).toString().padStart(decimales + 1, '0');
  const parteEntera = absoluto.slice(0, absoluto.length - decimales);
  let parteDecimal = decimales > 0 ? absoluto.slice(absoluto.length - decimales) : '';
  if (recortar) parteDecimal = parteDecimal.replace(/0+$/, '');
  const texto = parteDecimal ? `${parteEntera}.${parteDecimal}` : parteEntera;
  return negativo && /[1-9]/.test(texto) ? `-${texto}` : texto;
}

/** HALF_UP con `decimales` decimales: la mitad se aleja del cero (529,5 → 530; 56,55 → 56,6). */
function redondearHalfUp(q: Racional, decimales: number, recortar: boolean): string {
  const escala = 10n ** BigInt(decimales);
  const negativo = q.n < 0n;
  const absoluto = negativo ? -q.n : q.n;
  const escalado = (2n * absoluto * escala + q.d) / (2n * q.d);
  return conDecimales(negativo ? -escalado : escalado, decimales, recortar);
}

/**
 * La suma exacta de valores ya calculados (decimales con punto), con la misma aritmética que el cálculo. La usa el
 * subtotal diario de «Analizar» (WP-DASHBOARD-PROFESIONAL §6): sumar lo conocido de varios registros sin pasar por
 * números de punto flotante. Una lista vacía no es «cero»: quien llama decide que no hay valor.
 */
export function sumaExacta(valores: readonly string[]): string {
  let total = CERO;
  for (const v of valores) {
    const q = decimalExacto(v);
    if (!q) throw new ValorNoCalculable(`valor no numérico: ${v}`);
    total = sumar(total, q);
  }
  return aDecimal(total);
}

/** La media exacta de valores ya calculados: su suma dividida por cuántos son. Exige al menos uno. */
export function mediaExacta(valores: readonly string[]): string {
  if (valores.length === 0) throw new ValorNoCalculable('la media de ningún valor no existe');
  const suma = decimalExacto(sumaExacta(valores)) as Racional;
  return aDecimal(dividir(suma, racional(BigInt(valores.length))));
}

/**
 * El valor para mostrar: kcal a entero y gramos a un decimal, HALF_UP, con los decimales fijos («44.0»). Se aplica una sola
 * vez, al final, sobre el exacto.
 */
export function redondeoDePresentacion(exacto: string, nutriente: NutrienteCalculado): string {
  const q = decimalExacto(exacto);
  if (!q) throw new ValorNoCalculable(`valor no numérico: ${exacto}`);
  return redondearHalfUp(q, DECIMALES_DE_PRESENTACION[nutriente], false);
}

// ─── El cálculo ─────────────────────────────────────────────────────────────────────────────────

/** La cantidad de un ingrediente como racional, o un error si es negativa o no es un número. */
function cantidadExacta(valor: number | string, clave: string): Racional {
  const q = decimalExacto(valor);
  if (!q) throw new ValorNoCalculable(`la cantidad de ${clave} no es un número`);
  if (q.n < 0n) throw new ValorNoCalculable(`la cantidad de ${clave} es negativa`);
  return q;
}

/** Si la unidad de la cantidad tiene equivalencia con la referencia de la composición, sin conversiones. */
const unidadCompatible = (unidad: 'g' | 'ml' | 'unit', referencia: '100g' | '100ml'): boolean => (unidad === 'g' && referencia === '100g') || (unidad === 'ml' && referencia === '100ml');

/**
 * Suma los aportes de los ingredientes, multiplicados por `factor` (1 por defecto). El factor sirve para la media porción
 * o la doble de los casos del paquete; no reemplaza cantidades.
 */
export function calcularNutrientes(ingredientes: readonly IngredienteDelCalculo[], factorDeEscala: number | string = 1): ResultadoNutricional {
  const escala = decimalExacto(factorDeEscala);
  if (!escala || escala.n < 0n) throw new ValorNoCalculable('el factor de escala no es un número positivo');
  const totales = new Map<NutrienteCalculado, Racional>(NUTRIENTES_CALCULADOS.map((n) => [n, CERO]));
  const faltan = new Map<NutrienteCalculado, Faltante[]>(NUTRIENTES_CALCULADOS.map((n) => [n, []]));
  const anotar = (clave: string, motivo: MotivoDeFaltante, nutrientes: readonly NutrienteCalculado[] = NUTRIENTES_CALCULADOS) => {
    for (const n of nutrientes) faltan.get(n)!.push({ clave, motivo });
  };
  for (const ing of ingredientes) {
    if (ing.noConsumido) continue;
    if (!ing.cantidad) {
      anotar(ing.clave, 'SIN_CANTIDAD');
      continue;
    }
    const cantidad = cantidadExacta(ing.cantidad.value, ing.clave);
    if (!ing.composicion) {
      anotar(ing.clave, 'SIN_COMPOSICION');
      continue;
    }
    if (!unidadCompatible(ing.cantidad.unit, ing.composicion.referenceAmount)) {
      anotar(ing.clave, 'UNIDAD_SIN_EQUIVALENCIA');
      continue;
    }
    for (const nutriente of NUTRIENTES_CALCULADOS) {
      const crudo = ing.composicion[nutriente];
      const por100 = crudo === null || crudo === undefined ? null : decimalExacto(crudo);
      if (!por100) {
        anotar(ing.clave, 'SIN_DATO_DEL_NUTRIENTE', [nutriente]);
        continue;
      }
      if (por100.n < 0n) throw new ValorNoCalculable(`el valor de ${nutriente} de ${ing.clave} es negativo`);
      const aporte = multiplicar(multiplicar(cantidad, por100), dividir(escala, racional(100n)));
      totales.set(nutriente, sumar(totales.get(nutriente)!, aporte));
    }
  }
  const nutrientes = {} as Record<NutrienteCalculado, ValorCalculado>;
  for (const n of NUTRIENTES_CALCULADOS) {
    const f = faltan.get(n)!;
    nutrientes[n] = { exacto: f.length > 0 ? null : aDecimal(totales.get(n)!), faltan: f };
  }
  return { metodo: METODO_DE_CALCULO_NUTRICIONAL, nutrientes };
}

/** El resultado dividido por un número entero positivo de porciones (la receta → una porción). */
export function dividirPorPorciones(resultado: ResultadoNutricional, porciones: number): ResultadoNutricional {
  if (!Number.isInteger(porciones) || porciones < 1) throw new ValorNoCalculable('las porciones son un entero de 1 o más');
  const divisor = racional(BigInt(porciones));
  const nutrientes = {} as Record<NutrienteCalculado, ValorCalculado>;
  for (const n of NUTRIENTES_CALCULADOS) {
    const v = resultado.nutrientes[n];
    nutrientes[n] = { exacto: v.exacto === null ? null : aDecimal(dividir(decimalExacto(v.exacto)!, divisor)), faltan: v.faltan };
  }
  return { metodo: resultado.metodo, nutrientes };
}

/**
 * La cantidad de una porción de un ingrediente de una receta con `porciones`: exacta si da un decimal de hasta 1 decimal,
 * y si no, redondeada a 0,1 g HALF_UP (el plan prescribe gramos con un decimal). Los macros de la opción se calculan
 * después con estas cantidades, así que lo que se muestra se puede rehacer a mano.
 */
export function cantidadDeUnaPorcion(cantidad: number | string, porciones: number): number {
  if (!Number.isInteger(porciones) || porciones < 1) throw new ValorNoCalculable('las porciones son un entero de 1 o más');
  const q = cantidadExacta(cantidad, 'la cantidad');
  return Number(redondearHalfUp(dividir(q, racional(BigInt(porciones))), 1, true));
}

/** Compara dos decimales exactos por su valor («529.220» y «529.22» son iguales). */
export function mismoValorExacto(a: string, b: string): boolean {
  const qa = decimalExacto(a);
  const qb = decimalExacto(b);
  return !!qa && !!qb && qa.n === qb.n && qa.d === qb.d;
}
