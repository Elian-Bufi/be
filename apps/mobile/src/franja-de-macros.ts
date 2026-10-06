/**
 * La franja de macros de una opción del plan o de lo consumido (WP-NUTRICION-RECETAS §9): Calorías, Carbohidratos,
 * Grasas y Proteínas. Es lógica pura: `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **El valor sale del dominio** (`nutrienteParaMostrar`): se redondea HALF_UP solo al mostrar, las kcal a entero y los
 *   gramos a un decimal, con coma decimal. La APK no calcula: muestra lo que calculó la API.
 * - **Lo desconocido dice «Sin dato», nunca 0.** Un nutriente sin total (un ingrediente sin el dato, una cantidad sin
 *   confirmar) no se completa con cero.
 * - **Sin recortar.** Cuatro columnas si entran; si no, dos por dos; y con la letra desde ×1,3, dos por dos como mucho. Si
 *   ni así entran (letra ×2 en un teléfono), una sola columna. Las etiquetas son las del dominio, completas: no se
 *   abrevian. El ancho de cada texto se estima con lo medido de Roboto en el render del navegador, con margen
 *   («Carbohidratos» a 12 sp en negrita media: 75 dp; la estimación da 80).
 */
import { COPY_RECETAS, ETIQUETA_DE_NUTRIENTE, nutrienteParaMostrar, UNIDAD_DE_NUTRIENTE, type NutrienteCalculado, type Nutrientes } from '@be/domain';

/** Los cuatro de la franja, en su orden. La fibra va aparte, en el detalle. */
export const NUTRIENTES_DE_LA_FRANJA: readonly NutrienteCalculado[] = ['energyKcal', 'carbohydrateG', 'fatG', 'proteinG'];

export interface CeldaDeMacro {
  readonly nutriente: NutrienteCalculado;
  readonly etiqueta: string;
  /** El valor para mostrar («529», «44,0»), o `null` si no se conoce. */
  readonly valor: string | null;
  readonly unidad: string;
  /** Lo que se lee en la celda: «529 kcal», o «Sin dato». */
  readonly texto: string;
  /** Para el lector de pantalla, en una sola frase: «Calorías: 529 kcal». */
  readonly paraLeer: string;
}

export function celdaDeMacro(nutrientes: Nutrientes, nutriente: NutrienteCalculado): CeldaDeMacro {
  const valor = nutrienteParaMostrar(nutrientes[nutriente], nutriente);
  const unidad = UNIDAD_DE_NUTRIENTE[nutriente];
  const texto = valor === null ? COPY_RECETAS.sinDato : `${valor} ${unidad}`;
  const etiqueta = ETIQUETA_DE_NUTRIENTE[nutriente];
  return { nutriente, etiqueta, valor, unidad, texto, paraLeer: `${etiqueta}: ${texto}` };
}

export function celdasDeLaFranja(nutrientes: Nutrientes): CeldaDeMacro[] {
  return NUTRIENTES_DE_LA_FRANJA.map((n) => celdaDeMacro(nutrientes, n));
}

/** La letra de la etiqueta y la del valor, en sp: las mismas que usa la pantalla. */
export const LETRA_DE_LA_ETIQUETA = 12;
export const LETRA_DEL_VALOR = 16;
/** El relleno horizontal de una celda, de los dos lados, en dp. */
export const RELLENO_DE_LA_CELDA = 8;
/** Desde esta escala de letra, la franja va de a dos columnas como mucho (el encargo: «dos por dos con letra grande»). */
export const ESCALA_PARA_DOS_POR_DOS = 1.3;
/**
 * El ancho de un carácter, en proporción a su letra: algo más que lo medido de Roboto («Carbohidratos» a 12 sp en negrita
 * media da 0,483; las cifras en negrita, de 0,44 a 0,50). Más holgado, a 360 dp con letra ×1,3 la franja caía a una
 * columna aunque dos por dos entraba. Si en un teléfono una etiqueta no entra igual, se achica hasta un 10 % en vez de
 * partirse (`minimumFontScale`, en la pantalla).
 */
const ANCHO_POR_CARACTER = 0.51;

/** El ancho que pide la celda más ancha, con la escala de letra del sistema. */
export function anchoDeLaCelda(celdas: readonly CeldaDeMacro[], escala: number): number {
  const e = Math.max(1, Number.isFinite(escala) ? escala : 1);
  const ancho = (texto: string, letra: number) => texto.length * letra * e * ANCHO_POR_CARACTER;
  return Math.max(0, ...celdas.map((c) => Math.max(ancho(c.etiqueta, LETRA_DE_LA_ETIQUETA), ancho(c.texto, LETRA_DEL_VALOR)))) + RELLENO_DE_LA_CELDA;
}

/** Cuántas columnas lleva la franja en este ancho, con esta escala de letra: 4, 2 o 1. */
export function columnasDeLaFranja(anchoDisponible: number, escala: number, celdas: readonly CeldaDeMacro[]): 1 | 2 | 4 {
  const necesario = anchoDeLaCelda(celdas, escala);
  const candidatas: readonly (1 | 2 | 4)[] = escala >= ESCALA_PARA_DOS_POR_DOS ? [2, 1] : [4, 2, 1];
  return candidatas.find((c) => c * necesario <= anchoDisponible) ?? 1;
}
