/**
 * La franja de macros de una opción del plan o de lo consumido (WP-NUTRICION-RECETAS §9). Es lógica pura:
 * `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **Desde DL-194 (A32-04, RP-07 en la app), cada cantidad con su ícono, su número y su abreviatura**, como en las vistas
 *   de Nutrición del website (`apps/web/src/app/pro/advisees/nutrition/abreviaturas-de-macros.ts`): el rayo y «529 kcal»,
 *   y el ícono de cada macro con «30,0 g P», «44,0 g C» y «12,0 g G». En el mismo orden que el website: kcal, proteínas,
 *   carbohidratos y grasas. El ícono va arriba del número: así entran las cuatro en una fila en un teléfono de 390 dp. El
 *   lector de pantalla lee la palabra entera, «Proteínas: 30,0 g», no la abreviatura.
 * - **El valor sale del dominio** (`nutrienteParaMostrar`): se redondea HALF_UP solo al mostrar, las kcal a entero y los
 *   gramos a un decimal, con coma decimal. La APK no calcula: muestra lo que calculó la API.
 * - **Lo desconocido dice «Sin dato», nunca 0.** Un nutriente sin total (un ingrediente sin el dato, una cantidad sin
 *   confirmar) no se completa con cero.
 * - **Sin recortar.** Cuatro columnas si entran; si no, dos por dos; y con la letra desde ×1,3, dos por dos como mucho. Si
 *   ni así entran (letra ×2 en un teléfono), una sola columna, con la etiqueta entera al lado. El ancho de cada texto se
 *   estima con lo medido de Roboto en el render del navegador, con margen.
 */
import { COPY_RECETAS, ETIQUETA_DE_NUTRIENTE, nutrienteParaMostrar, UNIDAD_DE_NUTRIENTE, type NombreDeIcono, type NutrienteCalculado, type Nutrientes } from '@be/domain';

/** Los cuatro de la franja, en el orden del website (RP-07): kcal, proteínas, carbohidratos y grasas. La fibra va aparte. */
export const NUTRIENTES_DE_LA_FRANJA = ['energyKcal', 'proteinG', 'carbohydrateG', 'fatG'] as const satisfies readonly NutrienteCalculado[];
export type NutrienteDeLaFranja = (typeof NUTRIENTES_DE_LA_FRANJA)[number];

/** El ícono de cada uno: los de «Objetivo del día» del website, de la familia de BE (`iconos.ts` del dominio). */
export const ICONO_DEL_NUTRIENTE: Readonly<Record<NutrienteDeLaFranja, NombreDeIcono>> = { energyKcal: 'calorias', proteinG: 'proteinas', carbohydrateG: 'carbohidratos', fatG: 'grasas' };

/** La abreviatura que va después del número, la misma del website: «kcal», «g P», «g C», «g G». */
export const ABREVIATURA_DEL_NUTRIENTE: Readonly<Record<NutrienteDeLaFranja, string>> = { energyKcal: 'kcal', proteinG: 'g P', carbohydrateG: 'g C', fatG: 'g G' };

export interface CeldaDeMacro {
  readonly nutriente: NutrienteCalculado;
  readonly etiqueta: string;
  /** El valor para mostrar («529», «44,0»), o `null` si no se conoce. */
  readonly valor: string | null;
  readonly unidad: string;
  /** Lo que va después del número en la franja: «kcal», «g P». Para la fibra, la unidad. */
  readonly abreviatura: string;
  /** El ícono de la familia, o `null` (la fibra, que no va en la franja). */
  readonly icono: NombreDeIcono | null;
  /** Lo que se lee en una línea con la etiqueta: «529 kcal», o «Sin dato». */
  readonly texto: string;
  /** Lo que se ve debajo del ícono: «529 kcal», «44,0 g C», o «Sin dato». */
  readonly abreviado: string;
  /** Para el lector de pantalla, en una sola frase y con la palabra entera: «Calorías: 529 kcal». */
  readonly paraLeer: string;
}

const deLaFranja = (n: NutrienteCalculado): n is NutrienteDeLaFranja => (NUTRIENTES_DE_LA_FRANJA as readonly NutrienteCalculado[]).includes(n);

export function celdaDeMacro(nutrientes: Nutrientes, nutriente: NutrienteCalculado): CeldaDeMacro {
  const valor = nutrienteParaMostrar(nutrientes[nutriente], nutriente);
  const unidad = UNIDAD_DE_NUTRIENTE[nutriente];
  const abreviatura = deLaFranja(nutriente) ? ABREVIATURA_DEL_NUTRIENTE[nutriente] : unidad;
  const texto = valor === null ? COPY_RECETAS.sinDato : `${valor} ${unidad}`;
  const etiqueta = ETIQUETA_DE_NUTRIENTE[nutriente];
  return {
    nutriente,
    etiqueta,
    valor,
    unidad,
    abreviatura,
    icono: deLaFranja(nutriente) ? ICONO_DEL_NUTRIENTE[nutriente] : null,
    texto,
    abreviado: valor === null ? COPY_RECETAS.sinDato : `${valor} ${abreviatura}`,
    paraLeer: `${etiqueta}: ${texto}`,
  };
}

export function celdasDeLaFranja(nutrientes: Nutrientes): CeldaDeMacro[] {
  return NUTRIENTES_DE_LA_FRANJA.map((n) => celdaDeMacro(nutrientes, n));
}

/** La letra de la etiqueta (la de una sola columna) y la del valor, en sp: las mismas que usa la pantalla. */
export const LETRA_DE_LA_ETIQUETA = 12;
export const LETRA_DEL_VALOR = 16;
/** La abreviatura va más chica que el número, como toda unidad de una `Cifra` (`ui.tsx`: 0,72 del valor). */
export const PROPORCION_DE_LA_ABREVIATURA = 0.72;
/** El lado del ícono de cada celda, en dp (un tamaño de la guía de íconos). */
export const LADO_DEL_ICONO_DEL_MACRO = 18;
/** El relleno horizontal de una celda, de los dos lados, en dp. */
export const RELLENO_DE_LA_CELDA = 8;
/** Desde esta escala de letra, la franja va de a dos columnas como mucho (el encargo: «dos por dos con letra grande»). */
export const ESCALA_PARA_DOS_POR_DOS = 1.3;
/**
 * El ancho de un carácter, en proporción a su letra: algo más que lo medido de Roboto («Carbohidratos» a 12 sp en negrita
 * media da 0,483; las cifras en negrita, de 0,44 a 0,50). Si en un teléfono un texto no entra igual, se achica hasta un
 * 10 % en vez de partirse (`minimumFontScale`, en la pantalla).
 */
const ANCHO_POR_CARACTER = 0.51;

/** El ancho que pide la celda más ancha, con la escala de letra del sistema: el número con su abreviatura, o el ícono. */
export function anchoDeLaCelda(celdas: readonly CeldaDeMacro[], escala: number): number {
  const e = Math.max(1, Number.isFinite(escala) ? escala : 1);
  const ancho = (texto: string, letra: number) => texto.length * letra * e * ANCHO_POR_CARACTER;
  const deLaCelda = (c: CeldaDeMacro) =>
    c.valor === null ? ancho(c.abreviado, LETRA_DEL_VALOR) : ancho(c.valor, LETRA_DEL_VALOR) + ancho(` ${c.abreviatura}`, LETRA_DEL_VALOR * PROPORCION_DE_LA_ABREVIATURA);
  return Math.max(LADO_DEL_ICONO_DEL_MACRO, ...celdas.map(deLaCelda)) + RELLENO_DE_LA_CELDA;
}

/** Cuántas columnas lleva la franja en este ancho, con esta escala de letra: 4, 2 o 1. */
export function columnasDeLaFranja(anchoDisponible: number, escala: number, celdas: readonly CeldaDeMacro[]): 1 | 2 | 4 {
  const necesario = anchoDeLaCelda(celdas, escala);
  const candidatas: readonly (1 | 2 | 4)[] = escala >= ESCALA_PARA_DOS_POR_DOS ? [2, 1] : [4, 2, 1];
  return candidatas.find((c) => c * necesario <= anchoDisponible) ?? 1;
}
