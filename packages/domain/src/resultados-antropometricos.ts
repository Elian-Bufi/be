/**
 * DL-200 · el resultado completo de cada método, encadenado y sin casilleros (WP-ANTROPOMETRIA-RESULTADOS, AR-01 a AR-06).
 *
 * El profesional elige un método («Jackson y Pollock, 7 pliegues») y BE le da todo lo que ese método da y todo lo que se
 * deriva con los datos de la toma, en el orden en que se piensa una evaluación:
 * 1. **lo medido** (la suma de los pliegues);
 * 2. **la ecuación** (la densidad, o el % de grasa si la ecuación lo da directo);
 * 3. **la conversión** (el % de grasa del peso corporal, con Siri por omisión y Brožek al lado);
 * 4. **las masas** en kg, si hay peso (modelo de dos compartimentos);
 * 5. **el fraccionamiento** en cuatro componentes (la grasa del método, el hueso de Rocha, la residual de Würch y la
 *    muscular por diferencia), si están la talla y los diámetros.
 *
 * Cada paso dice de dónde sale («De la ecuación de Jackson y Pollock (1978)», «Convertida con Siri (1961)»), su fórmula y la
 * cuenta hecha con los números de esta toma, para el «?». Lo que falta para un paso se dice en ese paso, con nombre
 * («Para la masa ósea (Rocha) falta el diámetro biestiloideo (muñeca)»); no se esconde y no se inventa.
 *
 * Reglas que esto no rompe:
 * - **Un método publicado del catálogo nunca se edita.** Las cuentas son las de `formulas-antropometricas.ts` (las mismas
 *   piezas, `PIEZAS_ANTROPOMETRICAS`, o la regla publicada por su identificador), así que un paso que tiene método en el
 *   catálogo da lo mismo que su corrida. Los pasos que el catálogo no tiene (la densidad, las masas de Jackson y Pollock, el
 *   fraccionamiento con otra grasa que la de Faulkner) son **derivaciones** con su fuente, versionadas acá (`be/derivacion/…`);
 *   no se guardan como corridas (AR-D02).
 * - **Primero lo medido, después lo inferido con su ecuación** (REG-06-157): el orden de las etapas es ese.
 * - **Ninguna cuenta califica** (TEST-PRJ-009): devuelve números, nunca categorías; el orden de los métodos es el del
 *   catálogo y el alfabeto, nunca «el mejor» (REG-06-205).
 * - **El sexo de la ecuación no es un dato de la toma** (DL-111, decisión 5): lo elige el profesional.
 *
 * Lógica pura, sin interfaz: la usan `calculos.tsx`, `eleccion-de-metodos.tsx` y `preparacion.tsx`, y la prueba
 * `resultados-antropometricos.test.ts`, con los casos de la ficha y los ejemplos publicados.
 */
import { aplicarPrecision } from './antropometria';
import { numero, numeroConPrecision } from './formato-numeros';
import {
  ENTRADAS_MUSCULARES_DE_KERR,
  PIEZAS_ANTROPOMETRICAS as P,
  PLIEGUES_DW_4,
  PLIEGUES_FAULKNER_4,
  PLIEGUES_ISAK_6,
  PLIEGUES_ISAK_8,
  PLIEGUES_JP_3_HOMBRES,
  PLIEGUES_JP_3_MUJERES,
  PLIEGUES_JP_7,
  REGLAS_ANTROPOMETRICAS,
  type ValoresDeEntrada,
} from './formulas-antropometricas';
import { nombreDeMetrica, UNIDAD_DE_METRICA } from './nombres-de-metricas';

/** El sexo de la ecuación. No es un dato de la toma: lo elige el profesional (como en `metodos-de-la-toma.ts`). */
export type SexoDeLaCadena = 'HOMBRE' | 'MUJER';
/** Cómo se pasa de la densidad al % de grasa. Siri por omisión: es la que usaron los autores de las ecuaciones. */
export type ConversionDeDensidad = 'SIRI' | 'BROZEK';

/** Las etapas de un resultado, en el orden en que se leen: primero lo medido, después lo inferido. */
export type EtapaDeLaCadena = 'MEDIDO' | 'ECUACION' | 'CONVERSION' | 'MASAS' | 'FRACCIONAMIENTO';

export const TITULO_DE_LA_ETAPA: Readonly<Record<EtapaDeLaCadena, string>> = {
  MEDIDO: 'Lo medido',
  ECUACION: 'La ecuación',
  CONVERSION: 'La conversión',
  MASAS: 'Las masas',
  FRACCIONAMIENTO: 'El fraccionamiento',
};

/** Un valor que se lee al lado del principal: el % de grasa con la otra conversión, o una masa en % del peso. */
export interface ValorAlLado {
  readonly nombre: string;
  readonly valor: number;
  readonly unidad: string;
  readonly base: string | null;
  readonly decimales: number;
  readonly formula: string | null;
}

/** Un paso de la cadena: un valor, con su origen, su fórmula, su cuenta y lo que le falta. */
export interface PasoDeLaCadena {
  /** Estable dentro del método: `suma`, `densidad`, `grasa`, `masa-grasa`, `masa-libre-de-grasa`, `masa-osea`… */
  readonly clave: string;
  readonly nombre: string;
  /** `mm`, `g/cm³`, `%`, `kg`, `kg/m²` o `''` (sin dimensión). */
  readonly unidad: string;
  /** La base de un porcentaje: «del peso corporal». Todo «%» la lleva. */
  readonly base: string | null;
  readonly decimales: number;
  /** El valor con la precisión del paso; `null` si no se pudo calcular. */
  readonly valor: number | null;
  /** Sin redondear: es lo que usa el paso siguiente (la cadena no redondea en el medio). */
  readonly crudo: number | null;
  /** De dónde sale, en una frase: «De la ecuación de Jackson y Pollock (1978), hombres». */
  readonly origen: string;
  /** La fórmula, en palabras y números. */
  readonly formula: string;
  /** La cuenta con los números de esta toma; si no se pudo calcular, `null`. */
  readonly cuenta: string | null;
  /** La cita de la fuente. */
  readonly fuente: string;
  /** El identificador versionado de la regla o de la derivación: lo vuelve reproducible (REG-06-156). */
  readonly regla: string;
  /** Las mediciones que faltan para este paso (o para los anteriores de los que depende), por clave. */
  readonly faltan: readonly string[];
  /** Por qué no se calculó, si no es por lo que falta: un cero, una edad sin coeficientes, una ecuación de un solo sexo. */
  readonly motivo: string | null;
  readonly alLado: readonly ValorAlLado[];
  /** La clave del método del catálogo que da este mismo valor, si lo hay (para guardarlo en la historia). */
  readonly metodoDelCatalogo: string | null;
}

export interface EtapaDelResultado {
  readonly etapa: EtapaDeLaCadena;
  readonly titulo: string;
  readonly pasos: readonly PasoDeLaCadena[];
  /** Lo que la etapa aclara una vez para todos sus pasos. */
  readonly nota: string | null;
}

export interface ResultadoDelMetodo {
  readonly programa: ProgramaDeResultado;
  readonly sexo: SexoDeLaCadena;
  readonly conversion: ConversionDeDensidad;
  readonly etapas: readonly EtapaDelResultado[];
  /** Los pasos que van al resumen de arriba, en el orden del método, solo los que tienen valor. */
  readonly resumen: readonly PasoDeLaCadena[];
  /** Si el método dio su primer resultado con esta toma (Kerr, las cinco masas; el somatotipo, los tres componentes). */
  readonly calculado: boolean;
}

export type CategoriaDePrograma = 'SUMAS' | 'GRASA' | 'COMPONENTES' | 'MASAS' | 'SOMATOTIPO' | 'INDICES';

export const TITULO_DE_LA_CATEGORIA: Readonly<Record<CategoriaDePrograma, string>> = {
  SUMAS: 'Sumas de pliegues',
  GRASA: 'Grasa corporal',
  COMPONENTES: 'Fraccionamiento en cinco componentes',
  MASAS: 'Masas',
  SOMATOTIPO: 'Somatotipo',
  INDICES: 'Índices',
};

/** Un método que el profesional elige, con todo lo que da. */
export interface ProgramaDeResultado {
  readonly clave: string;
  readonly nombre: string;
  readonly categoria: CategoriaDePrograma;
  /** Si la ecuación cambia con el sexo (las mediciones o los coeficientes). */
  readonly porSexo: boolean;
  /** Si tiene conversión de la densidad (Siri o Brožek). */
  readonly conConversion: boolean;
  /** Si da el fraccionamiento en cuatro componentes (Rocha y Würch) cuando están la talla y los diámetros. */
  readonly conFraccionamiento: boolean;
  /** Lo que da, en una línea, para elegir antes de medir. */
  readonly da: string;
  /** Las métricas del catálogo (DL-111) que este método da: con ellas se lee el habitual y la dirección vieja. */
  readonly metricas: readonly string[];
}

// ─── Fuentes ─────────────────────────────────────────────────────────────────────────────────────

const F = {
  JP78: 'Jackson AS, Pollock ML. Generalized equations for predicting body density of men. Br J Nutr. 1978;40(3):497-504 (tabla 4).',
  JPW80: 'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175-181.',
  DW: 'Durnin JVGA, Womersley J. Body fat assessed from total body density and its estimation from skinfold thickness. Br J Nutr. 1974;32(1):77-97 (tabla 5).',
  SIRI: 'Siri WE. Body composition from fluid spaces and density: analysis of methods. En: Brozek J, Henschel A, eds. Techniques for measuring body composition. Washington: National Academy of Sciences; 1961.',
  BROZEK: 'Brožek J, Grande F, Anderson JT, Keys A. Densitometric analysis of body composition: revision of some quantitative assumptions. Ann N Y Acad Sci. 1963;110:113-140.',
  DOS_C: 'Modelo de dos compartimentos: peso = masa grasa + masa libre de grasa (Durnin y Womersley, 1974, introducción).',
  ISAK: 'Stewart A, Marfell-Jones M, Olds T, de Ridder H. International Standards for Anthropometric Assessment. ISAK; 2011.',
  YUHASZ: 'Yuhasz MS. Physical fitness manual. University of Western Ontario; 1974. Carter JEL. Physical structure of Olympic athletes, part I. Karger; 1982.',
  FAULKNER: 'Faulkner JA. Physiology of swimming and diving. En: Falls HB, ed. Exercise physiology. Academic Press; 1968. p. 417.',
  ROCHA: 'Rocha MSL. Peso ósseo do brasileiro de ambos os sexos de 17 a 25 anos. Río de Janeiro; 1975. Fórmula del consenso del GREC (Alvero-Cruz y col., 2009 y 2010).',
  WURCH: 'Würch A. La femme et le sport. Médecine Sportive Française; 1974. Constantes en Gris GM. Apunts Med Esport. 2001;36(137):5-16.',
  DE_ROSE: 'De Rose EH, Guimarães ACA. A model for optimization of somatotype in young athletes. En: Ostyn M y col., eds. Kinanthropometry II. University Park Press; 1980. p. 77-80.',
  KERR: 'Kerr DA. An anthropometric method for fractionation of skin, adipose, bone, muscle and residual tissue masses, in males and females age 6 to 77 years [tesis de maestría]. Simon Fraser University; 1988 (tabla 4.3).',
  HEATH_CARTER: 'Carter JEL. The Heath-Carter anthropometric somatotype: instruction manual. San Diego State University; 2002.',
  LEE: 'Lee RC, Wang Z, Heo M, Ross R, Janssen I, Heymsfield SB. Am J Clin Nutr. 2000;72(3):796-803.',
  RFM: 'Woolcott OO, Bergman RN. Relative fat mass (RFM) as a new estimator of whole-body fat percentage. Sci Rep. 2018;8:10980.',
  BAI: 'Bergman RN y col. A better index of body adiposity. Obesity (Silver Spring). 2011;19(5):1083-1089.',
  DEURENBERG: 'Deurenberg P, Weststrate JA, Seidell JC. Body mass index as a measure of body fatness. Br J Nutr. 1991;65(2):105-114.',
  KEYS: 'Keys A y col. Indices of relative weight and obesity. J Chronic Dis. 1972;25(6):329-343 (índice de Quetelet).',
  OMS: 'Organización Mundial de la Salud. Waist circumference and waist-hip ratio: report of a WHO expert consultation. Ginebra; 2008.',
  ASHWELL: 'Ashwell M, Hsieh SD. Int J Food Sci Nutr. 2005;56(5):303-307.',
  VALDEZ: 'Valdez R. A simple model-based index of abdominal adiposity. J Clin Epidemiol. 1991;44(9):955-956.',
} as const;

/** El % de grasa, la masa ósea y las demás proporciones se leen siempre con su base. */
export const BASE_DEL_PESO = 'del peso corporal';
const KG = 'kg';
const SIN_DIMENSION = '';

// ─── Utilidades ──────────────────────────────────────────────────────────────────────────────────

type Calculo = number | { error: string };
const n = (x: number, decimales = 4): string => numero(x, decimales);
const conUnidad = (x: number, decimales: number, unidad: string): string => `${numeroConPrecision(x, decimales)}${unidad ? ` ${unidad}` : ''}`;
const sinRepetir = <T>(xs: readonly T[]): T[] => [...new Set(xs)];

/** «el pliegue pectoral», «la talla»: el nombre de una medición con su artículo, en minúscula. */
export function medicionConArticulo(clave: string): string {
  const nombre = nombreDeMetrica(clave);
  const minuscula = nombre.charAt(0).toLocaleLowerCase('es-AR') + nombre.slice(1);
  return `${/^(Talla|Edad)/.test(nombre) ? 'la' : 'el'} ${minuscula}`;
}

/** «el A», «el A y la B», «el A, el B y la C». */
function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/** «Para la masa ósea (Rocha) faltan el diámetro biestiloideo (muñeca) y el diámetro bicondíleo del fémur (rodilla).» */
export function textoDeLoQueFalta(paso: Pick<PasoDeLaCadena, 'nombre' | 'faltan'>): string {
  const para = paso.nombre.charAt(0).toLocaleLowerCase('es-AR') + paso.nombre.slice(1);
  const articulo = /^(masa|suma|densidad|grasa|diferencia|endomorfia|mesomorfia|ectomorfia|coordenada)/i.test(paso.nombre) ? 'la' : 'el';
  return `Para ${articulo} ${para} ${paso.faltan.length === 1 ? 'falta' : 'faltan'} ${enumerar(paso.faltan.map(medicionConArticulo))}.`;
}

/** La primera letra en mayúscula: los errores del dominio empiezan en minúscula para ir dentro de otra frase. */
const comoFrase = (t: string): string => `${t.charAt(0).toLocaleUpperCase('es-AR')}${t.slice(1)}${/[.!?]$/.test(t) ? '' : '.'}`;

interface DefinicionDePaso {
  readonly clave: string;
  readonly nombre: string;
  readonly unidad: string;
  readonly base?: string | null;
  readonly decimales: number;
  readonly origen: string;
  readonly formula: string;
  readonly fuente: string;
  readonly regla: string;
  /** Las mediciones que pide el paso mismo, por clave. */
  readonly mediciones: readonly string[];
  /** Los pasos de los que depende. */
  readonly antes?: readonly PasoDeLaCadena[];
  /** La cuenta, con todo presente. */
  readonly calcular: () => Calculo;
  /** La cuenta en texto, con los números de esta toma y el resultado sin redondear. */
  readonly cuenta?: (crudo: number) => string;
  readonly alLado?: (crudo: number) => readonly ValorAlLado[];
  readonly metodoDelCatalogo?: string | null;
  /** Si este método no tiene ecuación para el sexo elegido, por qué. */
  readonly sinEcuacion?: string | null;
}

/** Arma un paso: dice qué le falta, por qué no se calculó o su valor, sin redondear en el medio. */
function paso(v: ValoresDeEntrada, d: DefinicionDePaso): PasoDeLaCadena {
  const antes = d.antes ?? [];
  const faltan = sinRepetir([...antes.flatMap((a) => a.faltan), ...d.mediciones.filter((c) => !Object.hasOwn(v, c))]);
  const base = {
    clave: d.clave,
    nombre: d.nombre,
    unidad: d.unidad,
    base: d.base ?? null,
    decimales: d.decimales,
    origen: d.origen,
    formula: d.formula,
    fuente: d.fuente,
    regla: d.regla,
    faltan,
    metodoDelCatalogo: d.metodoDelCatalogo ?? null,
  };
  const vacio = (motivo: string | null): PasoDeLaCadena => ({ ...base, valor: null, crudo: null, cuenta: null, motivo, alLado: [] });
  if (d.sinEcuacion) return vacio(d.sinEcuacion);
  if (faltan.length > 0) return vacio(null);
  const enCero = d.mediciones.find((c) => !((v[c] ?? 0) > 0));
  if (enCero) return vacio(comoFrase(`${medicionConArticulo(enCero)} tiene que ser mayor que cero para esta ecuación`));
  const bloqueado = antes.find((a) => a.crudo === null);
  if (bloqueado) return vacio(bloqueado.motivo ?? `Falta ${bloqueado.nombre.toLocaleLowerCase('es-AR')}.`);
  const r = d.calcular();
  if (typeof r !== 'number' || !Number.isFinite(r)) return vacio(comoFrase(typeof r === 'number' ? 'la cuenta no da un número con estos datos' : r.error));
  return {
    ...base,
    valor: aplicarPrecision(r, { decimales: d.decimales, modo: 'MEDIO_ARRIBA' }),
    crudo: r,
    cuenta: d.cuenta ? d.cuenta(r) : null,
    motivo: null,
    alLado: d.alLado ? d.alLado(r) : [],
  };
}

/** Un valor de un paso como número (la cadena se arma solo con pasos que ya tienen valor). */
const de = (p: PasoDeLaCadena): number => p.crudo ?? Number.NaN;
const regla = (id: string, v: ValoresDeEntrada): Calculo => {
  const r = REGLAS_ANTROPOMETRICAS[id];
  return r ? r(v) : { error: `la regla ${id} no está en el catálogo` };
};
const sumaDe = (v: ValoresDeEntrada, claves: readonly string[]): number => claves.reduce((t, c) => t + (v[c] ?? 0), 0);
const sexoDeLaFormula = (s: SexoDeLaCadena) => (s === 'HOMBRE' ? 'HOMBRES' : 'MUJERES') as 'HOMBRES' | 'MUJERES';
const deSexo = (s: SexoDeLaCadena, h: string, m: string) => (s === 'HOMBRE' ? h : m);
const sufijo = (s: SexoDeLaCadena) => (s === 'HOMBRE' ? 'H' : 'M');

/** Un valor en % del peso corporal, al lado de una masa en kg. */
function enPorcentajeDelPeso(v: ValoresDeEntrada, nombre = 'En % del peso corporal') {
  return (kg: number): readonly ValorAlLado[] =>
    (v.peso ?? 0) > 0 ? [{ nombre, valor: aplicarPrecision((kg / v.peso!) * 100, { decimales: 1, modo: 'MEDIO_ARRIBA' }), unidad: '%', base: BASE_DEL_PESO, decimales: 1, formula: `${n(kg, 2)} kg ÷ ${n(v.peso!)} kg × 100` }] : [];
}

// ─── Lo medido: las sumas ────────────────────────────────────────────────────────────────────────

function pasoDeSuma(v: ValoresDeEntrada, o: { clave?: string; nombre: string; pliegues: readonly string[]; origen: string; fuente: string; regla: string; metodo?: string | null }): PasoDeLaCadena {
  return paso(v, {
    clave: o.clave ?? 'suma',
    nombre: o.nombre,
    unidad: 'mm',
    decimales: 1,
    origen: o.origen,
    formula: `La suma de ${enumerar(o.pliegues.map(medicionConArticulo))}, en mm.`,
    fuente: o.fuente,
    regla: o.regla,
    mediciones: o.pliegues,
    calcular: () => sumaDe(v, o.pliegues),
    cuenta: (s) => `${o.pliegues.map((c) => n(v[c]!)).join(' + ')} = ${n(s, 2)} mm`,
    metodoDelCatalogo: o.metodo ?? null,
  });
}

// ─── Masas del modelo de dos compartimentos ──────────────────────────────────────────────────────

function etapaDeMasas(v: ValoresDeEntrada, grasa: PasoDeLaCadena, deDonde: string, catalogo: { grasa?: string | null; libre?: string | null } = {}): EtapaDelResultado {
  const masaGrasa = paso(v, {
    clave: 'masa-grasa',
    nombre: 'Masa grasa',
    unidad: KG,
    decimales: 1,
    origen: `Del peso y el % de grasa ${deDonde}`,
    formula: 'Masa grasa = peso × % de grasa ÷ 100.',
    fuente: F.DOS_C,
    regla: 'be/derivacion/masa-grasa@1',
    mediciones: ['peso'],
    antes: [grasa],
    calcular: () => (v.peso! * de(grasa)) / 100,
    cuenta: (x) => `${n(v.peso!)} kg × ${n(de(grasa), 2)} % ÷ 100 = ${n(x, 2)} kg`,
    metodoDelCatalogo: catalogo.grasa ?? null,
  });
  const masaLibre = paso(v, {
    clave: 'masa-libre-de-grasa',
    nombre: 'Masa libre de grasa',
    unidad: KG,
    decimales: 1,
    origen: 'El peso menos la masa grasa',
    formula: 'Masa libre de grasa = peso − masa grasa: el músculo, el hueso, los órganos y el agua juntos.',
    fuente: F.DOS_C,
    regla: 'be/derivacion/masa-libre-de-grasa@1',
    mediciones: ['peso'],
    antes: [masaGrasa],
    calcular: () => v.peso! - de(masaGrasa),
    cuenta: (x) => `${n(v.peso!)} kg − ${n(de(masaGrasa), 2)} kg = ${n(x, 2)} kg`,
    metodoDelCatalogo: catalogo.libre ?? null,
  });
  return { etapa: 'MASAS', titulo: TITULO_DE_LA_ETAPA.MASAS, pasos: [masaGrasa, masaLibre], nota: null };
}

// ─── El fraccionamiento en cuatro componentes ────────────────────────────────────────────────────

/** Las mediciones que agrega el fraccionamiento en cuatro componentes a las del método de grasa. */
export const MEDICIONES_DEL_FRACCIONAMIENTO: readonly string[] = ['peso', 'talla', 'diametro-biestiloideo', 'diametro-femur'];

function pasoDeRocha(v: ValoresDeEntrada): PasoDeLaCadena {
  return paso(v, {
    clave: 'masa-osea',
    nombre: 'Masa ósea (Rocha)',
    unidad: KG,
    decimales: 1,
    origen: 'De la ecuación de Von Döbeln modificada por Rocha (1975)',
    formula: 'Masa ósea = 3,02 × (talla² × diámetro biestiloideo × diámetro del fémur × 400)^0,712, con las tres longitudes en metros.',
    fuente: F.ROCHA,
    regla: 'be/masa-osea-rocha@1',
    mediciones: ['talla', 'diametro-biestiloideo', 'diametro-femur'],
    calcular: () => P.masaOseaRocha(v),
    cuenta: (x) => `3,02 × (${n(v.talla! / 100)}² × ${n(v['diametro-biestiloideo']! / 100)} × ${n(v['diametro-femur']! / 100)} × 400)^0,712 = ${n(x, 2)} kg`,
    alLado: enPorcentajeDelPeso(v),
    metodoDelCatalogo: 'MET-MASA-OSEA-ROCHA',
  });
}

function pasoDeWurch(v: ValoresDeEntrada, sexo: SexoDeLaCadena): PasoDeLaCadena {
  const fraccion = P.fraccionResidual[sexoDeLaFormula(sexo)];
  return paso(v, {
    clave: 'masa-residual',
    nombre: 'Masa residual (Würch)',
    unidad: KG,
    decimales: 1,
    origen: `Würch (1974): el ${n(fraccion * 100, 1)} % del peso ${deSexo(sexo, 'en hombres', 'en mujeres')}`,
    formula: `Masa residual = peso × ${n(fraccion, 3)}: órganos, vísceras y líquidos, como proporción fija del peso.`,
    fuente: F.WURCH,
    regla: deSexo(sexo, 'be/masa-residual-wurch-hombres@1', 'be/masa-residual-wurch-mujeres@1'),
    mediciones: ['peso'],
    calcular: () => v.peso! * fraccion,
    cuenta: (x) => `${n(v.peso!)} kg × ${n(fraccion, 3)} = ${n(x, 3)} kg`,
    alLado: enPorcentajeDelPeso(v),
    metodoDelCatalogo: `MET-MASA-RESIDUAL-${sufijo(sexo)}`,
  });
}

/**
 * La grasa del método, el hueso de Rocha y la residual de Würch, y la muscular por diferencia (De Rose y Guimarães, 1980).
 * Con la grasa de Faulkner es el modelo publicado (y su método del catálogo, solo hombres); con otra grasa es la misma
 * estrategia, con la grasa del método a la vista (AR-D05).
 */
function etapaDeFraccionamiento(v: ValoresDeEntrada, sexo: SexoDeLaCadena, masaGrasa: PasoDeLaCadena, nombreDeLaGrasa: string, muscularDelCatalogo: string | null): EtapaDelResultado {
  const grasa: PasoDeLaCadena = { ...masaGrasa, clave: 'fraccion-grasa', nombre: `Masa grasa (${nombreDeLaGrasa})`, origen: `La masa grasa de arriba, de ${nombreDeLaGrasa}`, alLado: masaGrasa.crudo !== null ? enPorcentajeDelPeso(v)(masaGrasa.crudo) : [], metodoDelCatalogo: null };
  const osea = pasoDeRocha(v);
  const residual = pasoDeWurch(v, sexo);
  const muscular = paso(v, {
    clave: 'masa-muscular',
    nombre: 'Masa muscular',
    unidad: KG,
    decimales: 1,
    origen: 'Por diferencia: el peso menos la grasa, el hueso y la residual (De Rose y Guimarães, 1980)',
    formula: 'Masa muscular = peso − (masa grasa + masa ósea + masa residual). Es lo que queda: arrastra los errores de las otras tres.',
    fuente: F.DE_ROSE,
    regla: muscularDelCatalogo ? 'be/masa-muscular-4c-hombres@1' : 'be/derivacion/masa-muscular-cuatro-componentes@1',
    mediciones: ['peso'],
    antes: [grasa, osea, residual],
    calcular: () => {
      const x = v.peso! - de(grasa) - de(osea) - de(residual);
      return x > 0 ? x : { error: 'la diferencia da cero o menos con estos datos: queda fuera del dominio del modelo' };
    },
    cuenta: (x) => `${n(v.peso!)} − (${n(de(grasa), 2)} + ${n(de(osea), 2)} + ${n(de(residual), 2)}) = ${n(x, 2)} kg`,
    alLado: enPorcentajeDelPeso(v),
    metodoDelCatalogo: muscularDelCatalogo,
  });
  return {
    etapa: 'FRACCIONAMIENTO',
    titulo: 'En cuatro componentes',
    pasos: [grasa, osea, residual, muscular],
    nota: 'Las cuatro masas suman el peso de la balanza: la muscular es lo que queda.',
  };
}

// ─── La conversión de la densidad ────────────────────────────────────────────────────────────────

const CONVERSIONES = {
  SIRI: { nombre: 'Siri', origen: 'Convertida con Siri (1961)', formula: '% de grasa = 495 ÷ densidad − 450', a: 495, b: 450, fuente: F.SIRI, f: P.siri },
  BROZEK: { nombre: 'Brožek', origen: 'Convertida con Brožek y col. (1963)', formula: '% de grasa = 457 ÷ densidad − 414,2', a: 457, b: 414.2, fuente: F.BROZEK, f: P.brozek },
} as const;

function pasoDeConversion(v: ValoresDeEntrada, densidad: PasoDeLaCadena, conversion: ConversionDeDensidad, catalogo: Readonly<Record<ConversionDeDensidad, string | null>>, regla: string): PasoDeLaCadena {
  const c = CONVERSIONES[conversion];
  const otra = CONVERSIONES[conversion === 'SIRI' ? 'BROZEK' : 'SIRI'];
  return paso(v, {
    clave: 'grasa',
    nombre: '% de grasa',
    unidad: '%',
    base: BASE_DEL_PESO,
    decimales: 1,
    origen: c.origen,
    formula: `${c.formula}. Modelo de dos compartimentos: grasa de 0,90 g/cm³ y masa libre de grasa de 1,10 g/cm³.`,
    fuente: c.fuente,
    regla,
    mediciones: [],
    antes: [densidad],
    calcular: () => c.f(de(densidad)),
    cuenta: (x) => `${c.a} ÷ ${n(de(densidad), 5)} − ${numero(c.b)} = ${n(x, 2)} %`,
    alLado: () => {
      const r = otra.f(de(densidad));
      return typeof r === 'number' ? [{ nombre: `Con ${otra.nombre}`, valor: aplicarPrecision(r, { decimales: 1, modo: 'MEDIO_ARRIBA' }), unidad: '%', base: BASE_DEL_PESO, decimales: 1, formula: `${otra.a} ÷ ${n(de(densidad), 5)} − ${numero(otra.b)}` }] : [];
    },
    metodoDelCatalogo: catalogo[conversion],
  });
}

// ─── Los métodos ─────────────────────────────────────────────────────────────────────────────────

/** Las etapas, los pasos del resumen y, si no alcanza con el primero, los pasos que tienen que tener valor para mostrar el método. */
type Armado = { etapas: EtapaDelResultado[]; resumen: string[]; minimo?: string[] };
type Armador = (v: ValoresDeEntrada, sexo: SexoDeLaCadena, conversion: ConversionDeDensidad) => Armado;
interface Definicion extends ProgramaDeResultado {
  /** Lo que pide, por sexo, para su primer resultado (sin las masas ni el fraccionamiento). */
  readonly pide: (sexo: SexoDeLaCadena) => readonly string[];
  readonly armar: Armador;
}

const etapa = (e: EtapaDeLaCadena, pasos: PasoDeLaCadena[], nota: string | null = null, titulo?: string): EtapaDelResultado => ({ etapa: e, titulo: titulo ?? TITULO_DE_LA_ETAPA[e], pasos, nota });

/** Jackson y Pollock, de 7 o de 3 pliegues: suma → densidad → % de grasa → masas → cuatro componentes. */
function jacksonPollock(siete: boolean): Armador {
  return (v, sexo, conversion) => {
    const pliegues = siete ? PLIEGUES_JP_7 : sexo === 'HOMBRE' ? PLIEGUES_JP_3_HOMBRES : PLIEGUES_JP_3_MUJERES;
    const ecuacion = siete ? (sexo === 'HOMBRE' ? 'SIETE_HOMBRES' : 'SIETE_MUJERES') : sexo === 'HOMBRE' ? 'TRES_HOMBRES' : 'TRES_MUJERES';
    const k = P.coeficientesJacksonPollock[ecuacion];
    const autores = sexo === 'HOMBRE' ? 'Jackson y Pollock (1978)' : 'Jackson, Pollock y Ward (1980)';
    const fuente = sexo === 'HOMBRE' ? F.JP78 : F.JPW80;
    const cuantos = siete ? 7 : 3;
    const suma = pasoDeSuma(v, {
      nombre: `Suma de ${cuantos} pliegues`,
      pliegues,
      origen: `Lo medido: los ${cuantos} pliegues de ${autores}`,
      fuente,
      regla: siete ? 'be/suma-7-pliegues-jackson-pollock@1' : `be/derivacion/suma-3-pliegues-jackson-pollock-${deSexo(sexo, 'hombres', 'mujeres')}@1`,
      metodo: siete ? 'MET-SUMA-7-JP' : null,
    });
    const densidad = paso(v, {
      clave: 'densidad',
      nombre: 'Densidad corporal',
      unidad: 'g/cm³',
      decimales: 4,
      origen: `De la ecuación de ${autores}, ${deSexo(sexo, 'hombres', 'mujeres')}`,
      formula: `Densidad = ${numero(k.a)} − ${numero(k.b)} × S + ${numero(k.c)} × S² − ${numero(k.d)} × edad, con S la suma de ${cuantos} pliegues en mm y la edad en años.`,
      fuente,
      regla: `be/derivacion/densidad-jackson-pollock-${cuantos}-${deSexo(sexo, 'hombres', 'mujeres')}@1`,
      mediciones: ['edad'],
      antes: [suma],
      calcular: () => P.densidadJacksonPollock(ecuacion, v),
      cuenta: (x) => `${numero(k.a)} − ${numero(k.b)} × ${n(de(suma))} + ${numero(k.c)} × ${n(de(suma))}² − ${numero(k.d)} × ${n(v.edad!)} = ${n(x, 6)} g/cm³`,
    });
    const tipo = siete ? '7' : '3';
    const grasa = pasoDeConversion(
      v,
      densidad,
      conversion,
      { SIRI: `MET-GRASA-JP${tipo}-${sufijo(sexo)}`, BROZEK: `MET-GRASA-JP${tipo}-BROZEK-${sufijo(sexo)}` },
      `be/grasa-jackson-pollock-${tipo}${conversion === 'BROZEK' ? '-brozek' : ''}-${deSexo(sexo, 'hombres', 'mujeres')}@1`,
    );
    const masas = etapaDeMasas(v, grasa, `de ${autores}, ${CONVERSIONES[conversion].nombre}`);
    return {
      etapas: [
        etapa('MEDIDO', [suma]),
        etapa('ECUACION', [densidad]),
        etapa('CONVERSION', [grasa]),
        masas,
        etapaDeFraccionamiento(v, sexo, masas.pasos[0]!, `Jackson y Pollock ${cuantos}`, null),
      ],
      resumen: ['grasa', 'masa-grasa', 'masa-libre-de-grasa', 'suma'],
    };
  };
}

const durninWomersley: Armador = (v, sexo, conversion) => {
  const s = sexoDeLaFormula(sexo);
  const suma = pasoDeSuma(v, { nombre: 'Suma de 4 pliegues', pliegues: PLIEGUES_DW_4, origen: 'Lo medido: los 4 pliegues de Durnin y Womersley (1974)', fuente: F.DW, regla: 'be/derivacion/suma-4-pliegues-durnin-womersley@1' });
  const franja = P.coeficientesDurninWomersley[s].find((f) => (v.edad ?? -1) >= f.desde && (v.edad ?? -1) < f.hasta);
  const densidad = paso(v, {
    clave: 'densidad',
    nombre: 'Densidad corporal',
    unidad: 'g/cm³',
    decimales: 4,
    origen: `De la ecuación de Durnin y Womersley (1974), ${deSexo(sexo, 'hombres', 'mujeres')}${franja ? `, de ${franja.desde}${Number.isFinite(franja.hasta) ? ` a ${franja.hasta - 1}` : ' o más'} años` : ''}`,
    formula: `Densidad = c − m × log10(S), con S la suma de 4 pliegues en mm y c y m de la franja de edad (tabla 5 del original)${franja ? `: c = ${numero(franja.c)} y m = ${numero(franja.m)}` : ''}.`,
    fuente: F.DW,
    regla: `be/derivacion/densidad-durnin-womersley-${deSexo(sexo, 'hombres', 'mujeres')}@1`,
    mediciones: ['edad'],
    antes: [suma],
    calcular: () => P.densidadDurninWomersley(s, v),
    cuenta: (x) => (franja ? `${numero(franja.c)} − ${numero(franja.m)} × log10(${n(de(suma))}) = ${numero(franja.c)} − ${numero(franja.m)} × ${n(Math.log10(de(suma)), 5)} = ${n(x, 6)} g/cm³` : n(x, 6)),
  });
  const grasa = pasoDeConversion(
    v,
    densidad,
    conversion,
    { SIRI: `MET-GRASA-DW-${sufijo(sexo)}`, BROZEK: `MET-GRASA-DW-BROZEK-${sufijo(sexo)}` },
    `be/grasa-durnin-womersley${conversion === 'BROZEK' ? '-brozek' : ''}-${deSexo(sexo, 'hombres', 'mujeres')}@1`,
  );
  // Las masas de Durnin y Womersley del catálogo (DL-112) son con Siri: con Brožek, la cuenta es una derivación.
  const masas = etapaDeMasas(v, grasa, `de Durnin y Womersley, ${CONVERSIONES[conversion].nombre}`, conversion === 'SIRI' ? { grasa: `MET-MASA-GRASA-DW-${sufijo(sexo)}`, libre: `MET-MASA-LIBRE-DW-${sufijo(sexo)}` } : {});
  return {
    etapas: [etapa('MEDIDO', [suma]), etapa('ECUACION', [densidad]), etapa('CONVERSION', [grasa]), masas, etapaDeFraccionamiento(v, sexo, masas.pasos[0]!, 'Durnin y Womersley', null)],
    resumen: ['grasa', 'masa-grasa', 'masa-libre-de-grasa', 'suma'],
  };
};

/** Un % de grasa que la ecuación da directo (sin densidad), con sus masas y, si es de pliegues, el fraccionamiento. */
function grasaDirecta(o: {
  suma?: { nombre: string; pliegues: readonly string[]; origen: string; fuente: string; regla: string; metodo?: string | null };
  origen: (sexo: SexoDeLaCadena) => string;
  formula: (sexo: SexoDeLaCadena) => string;
  fuente: string;
  regla: (sexo: SexoDeLaCadena) => string;
  mediciones: readonly string[];
  calcular: (v: ValoresDeEntrada, sexo: SexoDeLaCadena) => Calculo;
  cuenta: (v: ValoresDeEntrada, sexo: SexoDeLaCadena, x: number) => string;
  metodo: (sexo: SexoDeLaCadena) => string | null;
  masas?: (sexo: SexoDeLaCadena) => { grasa?: string | null; libre?: string | null };
  sinEcuacion?: (sexo: SexoDeLaCadena) => string | null;
  fraccionamiento?: { nombre: string; muscular: (sexo: SexoDeLaCadena) => string | null };
  nota?: string;
}): Armador {
  return (v, sexo) => {
    const suma = o.suma ? pasoDeSuma(v, o.suma) : null;
    const grasa = paso(v, {
      clave: 'grasa',
      nombre: '% de grasa',
      unidad: '%',
      base: BASE_DEL_PESO,
      decimales: 1,
      origen: o.origen(sexo),
      formula: o.formula(sexo),
      fuente: o.fuente,
      regla: o.regla(sexo),
      mediciones: o.mediciones,
      antes: suma ? [suma] : [],
      calcular: () => o.calcular(v, sexo),
      cuenta: (x) => o.cuenta(v, sexo, x),
      metodoDelCatalogo: o.metodo(sexo),
      sinEcuacion: o.sinEcuacion?.(sexo) ?? null,
    });
    const masas = etapaDeMasas(v, grasa, `de ${o.origen(sexo).replace(/^De la ecuación de /, '')}`, o.masas?.(sexo) ?? {});
    const etapas: EtapaDelResultado[] = [...(suma ? [etapa('MEDIDO', [suma])] : []), etapa('ECUACION', [grasa], o.nota ?? null), masas];
    if (o.fraccionamiento) etapas.push(etapaDeFraccionamiento(v, sexo, masas.pasos[0]!, o.fraccionamiento.nombre, o.fraccionamiento.muscular(sexo)));
    return { etapas, resumen: ['grasa', 'masa-grasa', 'masa-libre-de-grasa', ...(suma ? ['suma'] : [])] };
  };
}

const yuhasz = grasaDirecta({
  suma: { nombre: 'Suma de 6 pliegues', pliegues: PLIEGUES_ISAK_6, origen: 'Lo medido: los 6 pliegues de ISAK', fuente: F.ISAK, regla: 'be/suma-6-pliegues-isak@1', metodo: 'MET-SUMA-6-ISAK' },
  origen: (s) => `De la ecuación de Yuhasz modificada por Carter (1982), ${deSexo(s, 'hombres', 'mujeres')}`,
  formula: (s) => {
    const k = P.yuhaszCarter[sexoDeLaFormula(s)];
    return `% de grasa = ${numero(k.pendiente)} × suma de 6 pliegues + ${numero(k.constante)}.`;
  },
  fuente: F.YUHASZ,
  regla: (s) => deSexo(s, 'be/grasa-yuhasz-carter-hombres@1', 'be/grasa-yuhasz-carter-mujeres@1'),
  mediciones: [],
  calcular: (v, s) => regla(deSexo(s, 'be/grasa-yuhasz-carter-hombres@1', 'be/grasa-yuhasz-carter-mujeres@1'), v),
  cuenta: (v, s, x) => {
    const k = P.yuhaszCarter[sexoDeLaFormula(s)];
    return `${numero(k.pendiente)} × ${n(sumaDe(v, PLIEGUES_ISAK_6))} + ${numero(k.constante)} = ${n(x, 2)} %`;
  },
  metodo: (s) => `MET-GRASA-YUHASZ-CARTER-${sufijo(s)}`,
  fraccionamiento: { nombre: 'Yuhasz-Carter', muscular: () => null },
});

const faulkner = grasaDirecta({
  suma: { nombre: 'Suma de 4 pliegues', pliegues: PLIEGUES_FAULKNER_4, origen: 'Lo medido: los 4 pliegues de Faulkner (1968)', fuente: F.FAULKNER, regla: 'be/derivacion/suma-4-pliegues-faulkner@1' },
  origen: () => 'De la ecuación de Faulkner (1968), hombres',
  formula: () => '% de grasa = 0,153 × (tríceps + subescapular + supraespinal + abdominal) + 5,783.',
  fuente: F.FAULKNER,
  regla: () => 'be/grasa-faulkner@1',
  mediciones: [],
  calcular: (v) => regla('be/grasa-faulkner@1', v),
  cuenta: (v, _s, x) => `0,153 × ${n(sumaDe(v, PLIEGUES_FAULKNER_4))} + 5,783 = ${n(x, 2)} %`,
  metodo: () => 'MET-GRASA-FAULKNER',
  masas: () => ({ grasa: 'MET-MASA-GRASA-FAULKNER', libre: 'MET-MASA-LIBRE-FAULKNER' }),
  sinEcuacion: (s) => (s === 'MUJER' ? 'Faulkner no tiene ecuación para mujeres con fuente (D-11 de la ficha de métodos).' : null),
  // Con la grasa de Faulkner, el fraccionamiento es el modelo publicado de De Rose y Guimarães (y su método del catálogo).
  fraccionamiento: { nombre: 'Faulkner', muscular: (s) => (s === 'HOMBRE' ? 'MET-MASA-MUSCULAR-4C-H' : null) },
});

const rfm = grasaDirecta({
  origen: (s) => `De la ecuación de la masa grasa relativa (RFM) de Woolcott y Bergman (2018), ${deSexo(s, 'hombres', 'mujeres')}`,
  formula: (s) => `% de grasa = ${P.rfm[sexoDeLaFormula(s)]} − 20 × talla ÷ cintura, las dos en cm.`,
  fuente: F.RFM,
  regla: (s) => deSexo(s, 'be/grasa-rfm-hombres@1', 'be/grasa-rfm-mujeres@1'),
  mediciones: ['talla', 'perimetro-cintura'],
  calcular: (v, s) => regla(deSexo(s, 'be/grasa-rfm-hombres@1', 'be/grasa-rfm-mujeres@1'), v),
  cuenta: (v, s, x) => `${P.rfm[sexoDeLaFormula(s)]} − 20 × ${n(v.talla!)} ÷ ${n(v['perimetro-cintura']!)} = ${n(x, 2)} %`,
  metodo: (s) => `MET-GRASA-RFM-${sufijo(s)}`,
});

const bai = grasaDirecta({
  origen: () => 'De la ecuación del índice de adiposidad corporal (BAI) de Bergman y col. (2011)',
  formula: () => '% de grasa = cadera ÷ talla^1,5 − 18, con la cadera en cm y la talla en m. No usa el peso.',
  fuente: F.BAI,
  regla: () => 'be/grasa-bai@1',
  mediciones: ['perimetro-cadera', 'talla'],
  calcular: (v) => regla('be/grasa-bai@1', v),
  cuenta: (v, _s, x) => `${n(v['perimetro-cadera']!)} ÷ ${n(v.talla! / 100)}^1,5 − 18 = ${n(x, 2)} %`,
  metodo: () => 'MET-GRASA-BAI',
});

const deurenberg = grasaDirecta({
  origen: (s) => `De la ecuación de Deurenberg y col. (1991), desde el IMC, ${deSexo(s, 'hombres', 'mujeres')}`,
  formula: (s) => `% de grasa = 1,2 × IMC + 0,23 × edad − ${numero(P.deurenberg[sexoDeLaFormula(s)])}.`,
  fuente: F.DEURENBERG,
  regla: (s) => deSexo(s, 'be/grasa-deurenberg-hombres@1', 'be/grasa-deurenberg-mujeres@1'),
  mediciones: ['peso', 'talla', 'edad'],
  calcular: (v, s) => regla(deSexo(s, 'be/grasa-deurenberg-hombres@1', 'be/grasa-deurenberg-mujeres@1'), v),
  cuenta: (v, s, x) => `1,2 × ${n(P.imc(v), 2)} + 0,23 × ${n(v.edad!)} − ${numero(P.deurenberg[sexoDeLaFormula(s)])} = ${n(x, 2)} %`,
  metodo: (s) => `MET-GRASA-DEURENBERG-${sufijo(s)}`,
});

const sumaSola =
  (o: { nombre: string; pliegues: readonly string[]; regla: string; metodo: string }): Armador =>
  (v) => ({
    etapas: [
      etapa(
        'MEDIDO',
        [pasoDeSuma(v, { nombre: o.nombre, pliegues: o.pliegues, origen: 'Lo medido: los pliegues de ISAK, sumados', fuente: F.ISAK, regla: o.regla, metodo: o.metodo })],
        'No es una ecuación de predicción: se compara con las tomas anteriores de la misma persona, con el mismo protocolo y, si se puede, el mismo calibre.',
      ),
    ],
    resumen: ['suma'],
  });

/** Kerr (1988): las cinco masas, su suma (el peso estructurado) y la diferencia con el peso de la balanza. */
const kerr: Armador = (v, sexo) => {
  const masa = (clave: string, nombre: string, id: string, mediciones: readonly string[], metodo: string, formula: string): PasoDeLaCadena =>
    paso(v, {
      clave,
      nombre,
      unidad: KG,
      decimales: 1,
      origen: `De la ecuación de Kerr (1988)${clave === 'masa-piel' ? `, ${deSexo(sexo, 'hombres', 'mujeres')}` : ''}`,
      formula,
      fuente: F.KERR,
      regla: id,
      mediciones,
      calcular: () => regla(id, v),
      cuenta: (x) => `${n(x, 3)} kg`,
      metodoDelCatalogo: metodo,
    });
  const escala = 'Escala la suma al humano de referencia de Ross y Wilson (talla 170,18 cm) y la vuelve a la persona con el cubo del factor de talla: Z = (Σ × k − media) ÷ desvío; masa = (Z × desvío de la masa + masa de referencia) ÷ k³.';
  const pasos = [
    masa('masa-piel', 'Masa de la piel', deSexo(sexo, 'be/kerr-masa-piel-hombres@1', 'be/kerr-masa-piel-mujeres@1'), ['peso', 'talla', 'edad'], `MET-KERR-PIEL-${sufijo(sexo)}`, `Superficie corporal (${deSexo(sexo, '68,308', '73,074')} × peso^0,425 × talla^0,725 ÷ 10 000, en m²) × espesor de la piel (${deSexo(sexo, '2,07', '1,96')} mm) × 1,05.`),
    masa('masa-adiposa', 'Masa adiposa', 'be/kerr-masa-adiposa@1', ['talla', ...PLIEGUES_ISAK_6], 'MET-KERR-ADIPOSA', `Con la suma de 6 pliegues de ISAK. ${escala}`),
    masa('masa-muscular', 'Masa muscular', 'be/kerr-masa-muscular@1', ENTRADAS_MUSCULARES_DE_KERR, 'MET-KERR-MUSCULAR', `Con los perímetros de brazo, muslo a 1 cm del pliegue glúteo, pantorrilla y pecho corregidos por su pliegue (perímetro − π × pliegue ÷ 10), más el antebrazo. ${escala}`),
    masa('masa-osea', 'Masa ósea', 'be/kerr-masa-osea@1', ['talla', 'perimetro-cabeza', 'diametro-biacromial', 'diametro-biiliocrestal', 'diametro-humero', 'diametro-femur'], 'MET-KERR-OSEA', `La de la cabeza, por su perímetro, más la del cuerpo, con los diámetros biacromial, biiliocrestal y dos veces los del húmero y el fémur. ${escala}`),
    masa('masa-residual', 'Masa residual', 'be/kerr-masa-residual@1', ['talla-sentado', 'diametro-torax-transverso', 'diametro-torax-anteroposterior', 'perimetro-cintura', 'pliegue-abdominal'], 'MET-KERR-RESIDUAL', `Con la talla sentado, los diámetros del tórax y la cintura mínima corregida por el pliegue abdominal. ${escala}`),
  ];
  const estructurado = paso(v, {
    clave: 'peso-estructurado',
    nombre: 'Peso estructurado',
    unidad: KG,
    decimales: 1,
    origen: 'La suma de las cinco masas',
    formula: 'Peso estructurado = piel + adiposa + muscular + ósea + residual.',
    fuente: F.KERR,
    regla: 'be/derivacion/peso-estructurado-kerr@1',
    mediciones: [],
    antes: pasos,
    calcular: () => pasos.reduce((t, p) => t + de(p), 0),
    cuenta: (x) => `${pasos.map((p) => n(de(p), 2)).join(' + ')} = ${n(x, 2)} kg`,
  });
  const diferencia = paso(v, {
    clave: 'diferencia',
    nombre: 'Diferencia con el peso medido',
    unidad: KG,
    decimales: 1,
    origen: 'El peso estructurado menos el de la balanza: así valida Kerr el modelo',
    formula: 'Diferencia = peso estructurado − peso medido. En 1669 personas dio en promedio 1,1 kg (1,6 %) más que el peso medido.',
    fuente: F.KERR,
    regla: 'be/derivacion/diferencia-kerr@1',
    mediciones: ['peso'],
    antes: [estructurado],
    calcular: () => de(estructurado) - v.peso!,
    cuenta: (x) => `${n(de(estructurado), 2)} − ${n(v.peso!)} = ${n(x, 2)} kg`,
    alLado: (x) => (v.peso! > 0 ? [{ nombre: 'En % del peso medido', valor: aplicarPrecision((x / v.peso!) * 100, { decimales: 1, modo: 'MEDIO_ARRIBA' }), unidad: '%', base: 'del peso medido', decimales: 1, formula: null }] : []),
  });
  // Cada masa en % del peso estructurado: así se lee la composición de Kerr, que suma 100 %.
  const conProporcion = pasos.map((p): PasoDeLaCadena =>
    p.crudo !== null && estructurado.crudo !== null
      ? { ...p, alLado: [{ nombre: 'En % del peso estructurado', valor: aplicarPrecision((p.crudo / estructurado.crudo) * 100, { decimales: 1, modo: 'MEDIO_ARRIBA' }), unidad: '%', base: 'del peso estructurado', decimales: 1, formula: null }] }
      : p,
  );
  return {
    etapas: [etapa('ECUACION', conProporcion, null, 'Las cinco masas'), etapa('FRACCIONAMIENTO', [estructurado, diferencia], 'La suma frente a la balanza: una diferencia no califica, ubica el modelo.', 'La suma frente al peso')],
    resumen: ['masa-muscular', 'masa-adiposa', 'peso-estructurado', 'diferencia'],
    minimo: ['peso-estructurado'],
  };
};

const somatotipo: Armador = (v) => {
  const componente = (clave: string, nombre: string, id: string, mediciones: readonly string[], metodo: string, formula: string) =>
    paso(v, { clave, nombre, unidad: SIN_DIMENSION, decimales: 1, origen: 'De la ecuación de Heath y Carter (manual de Carter, 2002)', formula, fuente: F.HEATH_CARTER, regla: id, mediciones, calcular: () => regla(id, v), cuenta: (x) => n(x, 3), metodoDelCatalogo: metodo });
  const endo = componente('endomorfia', 'Endomorfia', 'be/somatotipo-endomorfia@1', ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'talla'], 'MET-SOMATOTIPO-ENDO', 'X = (tríceps + subescapular + supraespinal) × 170,18 ÷ talla; endomorfia = −0,7182 + 0,1451 X − 0,00068 X² + 0,0000014 X³.');
  const meso = componente('mesomorfia', 'Mesomorfia', 'be/somatotipo-mesomorfia@1', ['diametro-humero', 'diametro-femur', 'perimetro-brazo-flexionado', 'pliegue-triceps', 'perimetro-pantorrilla', 'pliegue-pantorrilla', 'talla'], 'MET-SOMATOTIPO-MESO', '0,858 × húmero + 0,601 × fémur + 0,188 × brazo corregido + 0,161 × pantorrilla corregida − 0,131 × talla + 4,5.');
  const ecto = componente('ectomorfia', 'Ectomorfia', 'be/somatotipo-ectomorfia@1', ['talla', 'peso'], 'MET-SOMATOTIPO-ECTO', 'Con el índice ponderal recíproco (talla ÷ raíz cúbica del peso): 0,732 × IPR − 28,58 si es 40,75 o más; 0,463 × IPR − 17,63 entre 38,25 y 40,75; 0,1 debajo.');
  const coordenada = (clave: string, nombre: string, formula: string, f: () => number, cuenta: (x: number) => string) =>
    paso(v, { clave, nombre, unidad: SIN_DIMENSION, decimales: 1, origen: 'La somatocarta (Carter, 2002)', formula, fuente: F.HEATH_CARTER, regla: `be/derivacion/somatocarta-${clave}@1`, mediciones: [], antes: [endo, meso, ecto], calcular: f, cuenta });
  // La somatocarta usa los componentes como se informan (al décimo), como el manual.
  const r = (p: PasoDeLaCadena) => p.valor ?? Number.NaN;
  const x = coordenada('coordenada-x', 'Coordenada X de la somatocarta', 'X = ectomorfia − endomorfia.', () => r(ecto) - r(endo), (c) => `${n(r(ecto), 1)} − ${n(r(endo), 1)} = ${n(c, 1)}`);
  const y = coordenada('coordenada-y', 'Coordenada Y de la somatocarta', 'Y = 2 × mesomorfia − (endomorfia + ectomorfia).', () => 2 * r(meso) - (r(endo) + r(ecto)), (c) => `2 × ${n(r(meso), 1)} − (${n(r(endo), 1)} + ${n(r(ecto), 1)}) = ${n(c, 1)}`);
  return { etapas: [etapa('ECUACION', [endo, meso, ecto], null, 'Los tres componentes'), etapa('FRACCIONAMIENTO', [x, y], null, 'En la somatocarta')], resumen: ['endomorfia', 'mesomorfia', 'ectomorfia'], minimo: ['endomorfia', 'mesomorfia', 'ectomorfia'] };
};

function masaSola(o: { clave: string; nombre: string; origen: (s: SexoDeLaCadena) => string; formula: string; fuente: string; regla: (s: SexoDeLaCadena) => string; mediciones: readonly string[]; metodo: (s: SexoDeLaCadena) => string; cuenta?: (v: ValoresDeEntrada, x: number) => string }): Armador {
  return (v, sexo) => ({
    etapas: [
      etapa('ECUACION', [
        paso(v, {
          clave: o.clave,
          nombre: o.nombre,
          unidad: KG,
          decimales: 1,
          origen: o.origen(sexo),
          formula: o.formula,
          fuente: o.fuente,
          regla: o.regla(sexo),
          mediciones: o.mediciones,
          calcular: () => regla(o.regla(sexo), v),
          cuenta: (x) => (o.cuenta ? o.cuenta(v, x) : `${n(x, 3)} kg`),
          alLado: enPorcentajeDelPeso(v),
          metodoDelCatalogo: o.metodo(sexo),
        }),
      ]),
    ],
    resumen: [o.clave],
  });
}

function indice(o: { clave: string; nombre: string; unidad: string; decimales: number; origen: string; formula: string; fuente: string; regla: string; mediciones: readonly string[]; metodo: string; cuenta: (v: ValoresDeEntrada, x: number) => string }): Armador {
  return (v) => ({
    etapas: [etapa('ECUACION', [paso(v, { ...o, calcular: () => regla(o.regla, v), cuenta: (x) => o.cuenta(v, x), metodoDelCatalogo: o.metodo })], null, 'El índice')],
    resumen: [o.clave],
  });
}

const LEE_PERIMETROS = ['talla', 'edad', 'perimetro-brazo-relajado', 'pliegue-triceps', 'perimetro-muslo', 'pliegue-muslo-frontal', 'perimetro-pantorrilla', 'pliegue-pantorrilla'] as const;
const GRASA_DE_PLIEGUES = 'Suma de pliegues, % de grasa, masa grasa y masa libre de grasa; con la talla y dos diámetros, el fraccionamiento en cuatro componentes';

/** Los métodos para elegir, en el orden neutral del catálogo: por categoría y, adentro, por nombre. Nunca por «mejor». */
const DEFINICIONES: readonly Definicion[] = [
  // ─── Sumas de pliegues ───
  { clave: 'isak-6', nombre: 'Suma de 6 pliegues (ISAK)', categoria: 'SUMAS', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'La suma de los 6 pliegues, en mm', metricas: ['suma-6-pliegues-isak'], pide: () => PLIEGUES_ISAK_6, armar: sumaSola({ nombre: 'Suma de 6 pliegues', pliegues: PLIEGUES_ISAK_6, regla: 'be/suma-6-pliegues-isak@1', metodo: 'MET-SUMA-6-ISAK' }) },
  { clave: 'isak-8', nombre: 'Suma de 8 pliegues (ISAK)', categoria: 'SUMAS', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'La suma de los 8 pliegues, en mm', metricas: ['suma-8-pliegues-isak'], pide: () => PLIEGUES_ISAK_8, armar: sumaSola({ nombre: 'Suma de 8 pliegues', pliegues: PLIEGUES_ISAK_8, regla: 'be/suma-8-pliegues-isak@1', metodo: 'MET-SUMA-8-ISAK' }) },
  // ─── Grasa corporal ───
  { clave: 'durnin-womersley', nombre: 'Durnin y Womersley, 4 pliegues', categoria: 'GRASA', porSexo: true, conConversion: true, conFraccionamiento: true, da: `${GRASA_DE_PLIEGUES}; la densidad en el medio`, metricas: ['grasa-durnin-womersley', 'grasa-durnin-womersley-brozek', 'masa-grasa-durnin-womersley', 'masa-libre-de-grasa-durnin-womersley'], pide: () => [...PLIEGUES_DW_4, 'edad'], armar: durninWomersley },
  { clave: 'faulkner', nombre: 'Faulkner, 4 pliegues (hombres)', categoria: 'GRASA', porSexo: true, conConversion: false, conFraccionamiento: true, da: `${GRASA_DE_PLIEGUES} (el modelo de De Rose y Guimarães)`, metricas: ['grasa-faulkner', 'masa-grasa-faulkner', 'masa-libre-de-grasa-faulkner', 'masa-muscular-cuatro-componentes'], pide: () => PLIEGUES_FAULKNER_4, armar: faulkner },
  { clave: 'jackson-pollock-3', nombre: 'Jackson y Pollock, 3 pliegues', categoria: 'GRASA', porSexo: true, conConversion: true, conFraccionamiento: true, da: `${GRASA_DE_PLIEGUES}; la densidad en el medio`, metricas: ['grasa-jackson-pollock-3', 'grasa-jackson-pollock-3-brozek'], pide: (s) => [...(s === 'HOMBRE' ? PLIEGUES_JP_3_HOMBRES : PLIEGUES_JP_3_MUJERES), 'edad'], armar: jacksonPollock(false) },
  { clave: 'jackson-pollock-7', nombre: 'Jackson y Pollock, 7 pliegues', categoria: 'GRASA', porSexo: true, conConversion: true, conFraccionamiento: true, da: `${GRASA_DE_PLIEGUES}; la densidad en el medio`, metricas: ['suma-7-pliegues-jackson-pollock', 'grasa-jackson-pollock-7', 'grasa-jackson-pollock-7-brozek'], pide: () => [...PLIEGUES_JP_7, 'edad'], armar: jacksonPollock(true) },
  { clave: 'yuhasz-carter', nombre: 'Yuhasz-Carter, 6 pliegues', categoria: 'GRASA', porSexo: true, conConversion: false, conFraccionamiento: true, da: GRASA_DE_PLIEGUES, metricas: ['grasa-yuhasz-carter'], pide: () => PLIEGUES_ISAK_6, armar: yuhasz },
  { clave: 'bai', nombre: 'Índice de adiposidad corporal (BAI)', categoria: 'GRASA', porSexo: false, conConversion: false, conFraccionamiento: false, da: '% de grasa, masa grasa y masa libre de grasa, con la cadera y la talla', metricas: ['grasa-bai'], pide: () => ['perimetro-cadera', 'talla'], armar: bai },
  { clave: 'deurenberg', nombre: 'Deurenberg, desde el IMC', categoria: 'GRASA', porSexo: true, conConversion: false, conFraccionamiento: false, da: '% de grasa, masa grasa y masa libre de grasa, con peso, talla y edad', metricas: ['grasa-deurenberg'], pide: () => ['peso', 'talla', 'edad'], armar: deurenberg },
  { clave: 'rfm', nombre: 'Masa grasa relativa (RFM)', categoria: 'GRASA', porSexo: true, conConversion: false, conFraccionamiento: false, da: '% de grasa, masa grasa y masa libre de grasa, con la cintura y la talla', metricas: ['grasa-rfm'], pide: () => ['talla', 'perimetro-cintura'], armar: rfm },
  // ─── Cinco componentes ───
  { clave: 'kerr-5c', nombre: 'Kerr (1988), cinco componentes', categoria: 'COMPONENTES', porSexo: true, conConversion: false, conFraccionamiento: false, da: 'Las masas de piel, adiposa, muscular, ósea y residual, su suma y la diferencia con el peso', metricas: ['masa-piel-kerr', 'masa-adiposa-kerr', 'masa-muscular-kerr', 'masa-osea-kerr', 'masa-residual-kerr'], pide: () => sinRepetir(['peso', 'talla', 'edad', 'talla-sentado', ...PLIEGUES_ISAK_6, ...ENTRADAS_MUSCULARES_DE_KERR, 'perimetro-cabeza', 'diametro-biacromial', 'diametro-biiliocrestal', 'diametro-humero', 'diametro-femur', 'diametro-torax-transverso', 'diametro-torax-anteroposterior', 'perimetro-cintura']), armar: kerr },
  // ─── Masas ───
  {
    clave: 'lee-perimetros',
    nombre: 'Masa muscular esquelética (Lee, perímetros)',
    categoria: 'MASAS',
    porSexo: true,
    conConversion: false,
    conFraccionamiento: false,
    da: 'La masa muscular esquelética en kg y en % del peso',
    metricas: ['masa-muscular-esqueletica-lee'],
    pide: () => LEE_PERIMETROS,
    armar: masaSola({
      clave: 'masa-muscular-esqueletica',
      nombre: 'Masa muscular esquelética',
      origen: (s) => `De la ecuación de Lee y col. (2000), con perímetros, ${deSexo(s, 'hombres', 'mujeres')}`,
      formula: 'Talla (m) × (0,00744 × brazo² + 0,00088 × muslo² + 0,00441 × pantorrilla²) + 2,4 × sexo − 0,048 × edad + 7,8, con cada perímetro corregido por su pliegue (perímetro − π × pliegue en cm) y el término de etnia de la muestra blanca e hispana (0).',
      fuente: F.LEE,
      regla: (s) => deSexo(s, 'be/masa-muscular-esqueletica-lee-hombres@1', 'be/masa-muscular-esqueletica-lee-mujeres@1'),
      mediciones: LEE_PERIMETROS,
      metodo: (s) => `MET-MME-LEE-${sufijo(s)}`,
    }),
  },
  {
    clave: 'lee-peso',
    nombre: 'Masa muscular esquelética (Lee, peso y talla)',
    categoria: 'MASAS',
    porSexo: true,
    conConversion: false,
    conFraccionamiento: false,
    da: 'La masa muscular esquelética en kg y en % del peso, con peso, talla y edad',
    metricas: ['masa-muscular-esqueletica-lee-peso'],
    pide: () => ['peso', 'talla', 'edad'],
    armar: masaSola({
      clave: 'masa-muscular-esqueletica',
      nombre: 'Masa muscular esquelética',
      origen: (s) => `De la ecuación de Lee y col. (2000), con peso y talla, ${deSexo(s, 'hombres', 'mujeres')}`,
      formula: '0,244 × peso + 7,80 × talla (m) + 6,6 × sexo − 0,098 × edad − 3,3.',
      fuente: F.LEE,
      regla: (s) => deSexo(s, 'be/masa-muscular-esqueletica-lee-peso-hombres@1', 'be/masa-muscular-esqueletica-lee-peso-mujeres@1'),
      mediciones: ['peso', 'talla', 'edad'],
      metodo: (s) => `MET-MME-LEE-PESO-${sufijo(s)}`,
    }),
  },
  { clave: 'rocha', nombre: 'Masa ósea (Rocha)', categoria: 'MASAS', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'La masa ósea en kg y en % del peso', metricas: ['masa-osea-rocha'], pide: () => ['talla', 'diametro-biestiloideo', 'diametro-femur'], armar: (v) => ({ etapas: [etapa('ECUACION', [pasoDeRocha(v)])], resumen: ['masa-osea'] }) },
  { clave: 'wurch', nombre: 'Masa residual (Würch)', categoria: 'MASAS', porSexo: true, conConversion: false, conFraccionamiento: false, da: 'La masa residual en kg, una proporción fija del peso', metricas: ['masa-residual-wurch'], pide: () => ['peso'], armar: (v, s) => ({ etapas: [etapa('ECUACION', [pasoDeWurch(v, s)])], resumen: ['masa-residual'] }) },
  // ─── Somatotipo ───
  { clave: 'somatotipo', nombre: 'Somatotipo de Heath y Carter', categoria: 'SOMATOTIPO', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'Endomorfia, mesomorfia y ectomorfia, y el punto en la somatocarta', metricas: ['endomorfia', 'mesomorfia', 'ectomorfia'], pide: () => ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-pantorrilla', 'diametro-humero', 'diametro-femur', 'perimetro-brazo-flexionado', 'perimetro-pantorrilla', 'talla', 'peso'], armar: somatotipo },
  // ─── Índices ───
  { clave: 'imc', nombre: 'Índice de masa corporal (IMC)', categoria: 'INDICES', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'El peso dividido por la talla al cuadrado', metricas: ['imc'], pide: () => ['peso', 'talla'], armar: indice({ clave: 'imc', nombre: 'Índice de masa corporal', unidad: 'kg/m²', decimales: 1, origen: 'Del peso y la talla (índice de Quetelet)', formula: 'IMC = peso ÷ talla², con la talla en metros.', fuente: F.KEYS, regla: 'be/imc@1', mediciones: ['peso', 'talla'], metodo: 'MET-IMC', cuenta: (v, x) => `${n(v.peso!)} ÷ ${n(v.talla! / 100)}² = ${n(x, 2)} kg/m²` }) },
  { clave: 'cintura-cadera', nombre: 'Índice cintura/cadera', categoria: 'INDICES', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'La cintura dividida por la cadera', metricas: ['indice-cintura-cadera'], pide: () => ['perimetro-cintura', 'perimetro-cadera'], armar: indice({ clave: 'indice-cintura-cadera', nombre: 'Índice cintura/cadera', unidad: SIN_DIMENSION, decimales: 2, origen: 'Del perímetro de cintura y el de cadera', formula: 'Cintura ÷ cadera, las dos en cm. Depende del sitio donde se toma la cintura.', fuente: F.OMS, regla: 'be/indice-cintura-cadera@1', mediciones: ['perimetro-cintura', 'perimetro-cadera'], metodo: 'MET-ICC', cuenta: (v, x) => `${n(v['perimetro-cintura']!)} ÷ ${n(v['perimetro-cadera']!)} = ${n(x, 3)}` }) },
  { clave: 'cintura-talla', nombre: 'Índice cintura/talla', categoria: 'INDICES', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'La cintura dividida por la talla', metricas: ['indice-cintura-talla'], pide: () => ['perimetro-cintura', 'talla'], armar: indice({ clave: 'indice-cintura-talla', nombre: 'Índice cintura/talla', unidad: SIN_DIMENSION, decimales: 2, origen: 'Del perímetro de cintura y la talla', formula: 'Cintura ÷ talla, las dos en cm.', fuente: F.ASHWELL, regla: 'be/indice-cintura-talla@1', mediciones: ['perimetro-cintura', 'talla'], metodo: 'MET-ICT', cuenta: (v, x) => `${n(v['perimetro-cintura']!)} ÷ ${n(v.talla!)} = ${n(x, 3)}` }) },
  { clave: 'conicidad', nombre: 'Índice de conicidad (Valdez)', categoria: 'INDICES', porSexo: false, conConversion: false, conFraccionamiento: false, da: 'La cintura frente a la de un cilindro del mismo peso y talla', metricas: ['indice-conicidad'], pide: () => ['perimetro-cintura', 'peso', 'talla'], armar: indice({ clave: 'indice-conicidad', nombre: 'Índice de conicidad', unidad: SIN_DIMENSION, decimales: 2, origen: 'De la cintura, el peso y la talla (Valdez, 1991)', formula: 'Cintura (m) ÷ (0,109 × √(peso ÷ talla en m)).', fuente: F.VALDEZ, regla: 'be/indice-conicidad@1', mediciones: ['perimetro-cintura', 'peso', 'talla'], metodo: 'MET-CONICIDAD', cuenta: (v, x) => `${n(v['perimetro-cintura']! / 100)} ÷ (0,109 × √(${n(v.peso!)} ÷ ${n(v.talla! / 100)})) = ${n(x, 3)}` }) },
];

const ORDEN_DE_CATEGORIA: readonly CategoriaDePrograma[] = ['SUMAS', 'GRASA', 'COMPONENTES', 'MASAS', 'SOMATOTIPO', 'INDICES'];

/** Los métodos para elegir, por categoría y, adentro, por nombre (el orden de `DEFINICIONES`). */
export const PROGRAMAS_DE_RESULTADO: readonly ProgramaDeResultado[] = DEFINICIONES.map(({ pide: _pide, armar: _armar, ...p }) => p);
const POR_CLAVE = new Map(DEFINICIONES.map((d) => [d.clave, d]));

export function programaDeResultado(clave: string): ProgramaDeResultado | null {
  return POR_CLAVE.get(clave) ?? null;
}

/** En la dirección (`metodos=`), pedir el fraccionamiento en cuatro componentes de los métodos de grasa elegidos. */
export const CLAVE_DEL_FRACCIONAMIENTO = 'fraccionamiento-4c';

// ─── Lo que se pide antes de medir ───────────────────────────────────────────────────────────────

/**
 * Lo que pide un método para dar todo lo suyo: lo de su ecuación, el peso para las masas y, si se pide el
 * fraccionamiento, la talla y los dos diámetros de Rocha. En el orden de la ecuación.
 */
export function medicionesDelPrograma(clave: string, sexo: SexoDeLaCadena, conFraccionamiento = false): string[] {
  const d = POR_CLAVE.get(clave);
  if (!d) return [];
  const masas = d.categoria === 'GRASA' ? ['peso'] : [];
  return sinRepetir([...d.pide(sexo), ...masas, ...(conFraccionamiento && d.conFraccionamiento ? MEDICIONES_DEL_FRACCIONAMIENTO : [])]);
}

/** Lo que va a dar un método con lo que se eligió, en palabras, para verlo antes de medir. */
export function loQueVaADar(clave: string, conFraccionamiento: boolean): string[] {
  const d = POR_CLAVE.get(clave);
  if (!d) return [];
  switch (d.categoria) {
    case 'SUMAS':
      return ['Suma de pliegues'];
    case 'GRASA':
      return [
        ...(d.clave === 'bai' || d.clave === 'rfm' || d.clave === 'deurenberg' ? [] : ['Suma de pliegues']),
        ...(d.conConversion ? ['Densidad corporal'] : []),
        d.conConversion ? '% de grasa (Siri y Brožek)' : '% de grasa',
        'Masa grasa y masa libre de grasa',
        ...(conFraccionamiento && d.conFraccionamiento ? ['Masas ósea, residual y muscular'] : []),
      ];
    case 'COMPONENTES':
      return ['Piel, adiposa, muscular, ósea y residual', 'Peso estructurado y diferencia con el peso'];
    case 'SOMATOTIPO':
      return ['Endomorfia, mesomorfia y ectomorfia', 'Punto en la somatocarta'];
    case 'MASAS':
      return [d.nombre.replace(/ \(.*\)$/, ''), ...(d.clave === 'wurch' ? [] : ['En % del peso corporal'])];
    case 'INDICES':
      return [d.nombre];
  }
}

/** Los métodos que el profesional usó (por las métricas de sus corridas o de su última toma), en el orden del catálogo. */
export function programasDeLasMetricas(metricas: Iterable<string>): string[] {
  const usadas = new Set(metricas);
  return DEFINICIONES.filter((d) => d.metricas.some((m) => usadas.has(m))).map((d) => d.clave);
}

/**
 * La elección en la dirección (`metodos=`): métodos de DL-200 y, si llegan, las familias de DL-190 (una dirección guardada
 * antes de este cambio), traducidas al método que las da. Más `fraccionamiento-4c`, si se pidió. Sin repetir.
 */
export function leerProgramas(texto: string | null): { programas: string[]; conFraccionamiento: boolean } {
  if (!texto) return { programas: [], conFraccionamiento: false };
  const partes = texto.split(',').map((c) => c.trim()).filter(Boolean);
  const programas = sinRepetir(partes.flatMap((c) => (POR_CLAVE.has(c) ? [c] : programasDeLasMetricas([c]))));
  return { programas: DEFINICIONES.map((d) => d.clave).filter((c) => programas.includes(c)), conFraccionamiento: partes.includes(CLAVE_DEL_FRACCIONAMIENTO) };
}

// ─── El resultado de una toma ────────────────────────────────────────────────────────────────────

type MedicionDeLaToma = { readonly metric: string; readonly condition: string; readonly effectiveMagnitude: { readonly value: number; readonly unit: string } | null };

/**
 * Los valores de una toma con los que calcula la cadena: las mediciones vigentes, en la unidad del catálogo. Una medición
 * en otra unidad no se convierte en silencio: queda en `enOtraUnidad` y su paso dice que falta.
 */
export function valoresParaLaCadena(mediciones: readonly MedicionDeLaToma[]): { valores: ValoresDeEntrada; enOtraUnidad: readonly string[] } {
  const valores: Record<string, number> = {};
  const enOtraUnidad: string[] = [];
  for (const m of mediciones) {
    if (m.condition !== 'EFFECTIVE' || !m.effectiveMagnitude || !Object.hasOwn(UNIDAD_DE_METRICA, m.metric)) continue;
    if (m.effectiveMagnitude.unit !== UNIDAD_DE_METRICA[m.metric]) {
      enOtraUnidad.push(m.metric);
      continue;
    }
    // Si una métrica está dos veces, vale la primera, como la asignación automática de un cálculo (`datosDelMetodo`).
    if (!Object.hasOwn(valores, m.metric)) valores[m.metric] = m.effectiveMagnitude.value;
  }
  return { valores, enOtraUnidad: enOtraUnidad.filter((c) => !Object.hasOwn(valores, c)) };
}

/** El resultado completo de un método con los valores de una toma. */
export function resultadoDelMetodo(clave: string, valores: ValoresDeEntrada, sexo: SexoDeLaCadena, conversion: ConversionDeDensidad = 'SIRI'): ResultadoDelMetodo | null {
  const d = POR_CLAVE.get(clave);
  if (!d) return null;
  const { armar, pide: _pide, ...programa } = d;
  const { etapas, resumen, minimo } = armar(valores, sexo, conversion);
  const pasos = etapas.flatMap((e) => e.pasos);
  const primero = pasos[0];
  return {
    programa,
    sexo,
    conversion: d.conConversion ? conversion : 'SIRI',
    etapas,
    resumen: resumen.map((c) => pasos.find((p) => p.clave === c)).filter((p): p is PasoDeLaCadena => !!p && p.valor !== null),
    calculado: minimo ? minimo.every((c) => pasos.some((p) => p.clave === c && p.valor !== null)) : primero?.valor !== null && primero?.valor !== undefined,
  };
}

/**
 * Los métodos que se pueden mostrar con una toma: los que dan al menos su primer resultado. El orden es el del catálogo.
 * Un método que no da nada no se ofrece en los resultados (sí al elegir antes de medir).
 */
export function metodosConResultado(valores: ValoresDeEntrada, sexo: SexoDeLaCadena): string[] {
  return DEFINICIONES.filter((d) => resultadoDelMetodo(d.clave, valores, sexo)?.calculado).map((d) => d.clave);
}

/** Todos los pasos de un resultado, en orden. */
export const pasosDelResultado = (r: ResultadoDelMetodo): PasoDeLaCadena[] => r.etapas.flatMap((e) => e.pasos);

// ─── Para leer ───────────────────────────────────────────────────────────────────────────────────

/** «14,8 % del peso corporal», «1,0612 g/cm³», «82,0 mm», «2,4»: el valor de un paso con su unidad y su base. */
export function textoDelPasoDeLaCadena(p: Pick<PasoDeLaCadena, 'valor' | 'decimales' | 'unidad' | 'base'>): string {
  if (p.valor === null) return 'Sin calcular';
  return `${conUnidad(p.valor, p.decimales, p.unidad)}${p.base ? ` ${p.base}` : ''}`;
}

/** Lo mismo para un valor al lado. */
export const textoDelValorAlLado = (v: ValorAlLado): string => `${conUnidad(v.valor, v.decimales, v.unidad)}${v.base ? ` ${v.base}` : ''}`;

/**
 * La diferencia de un paso con el mismo paso de otra toma: una resta con signo, que no califica. Un % de grasa cambia en
 * **puntos** («−0,6 puntos»), no en %, que se leería como un porcentaje del valor.
 */
export function diferenciaDelPaso(ahora: Pick<PasoDeLaCadena, 'valor' | 'decimales' | 'unidad'>, antes: Pick<PasoDeLaCadena, 'valor'> | null | undefined): string | null {
  if (ahora.valor === null || !antes || antes.valor === null) return null;
  const delta = aplicarPrecision(ahora.valor - antes.valor, { decimales: ahora.decimales, modo: 'MEDIO_ARRIBA' });
  const signo = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const absoluto = numeroConPrecision(Math.abs(delta), ahora.decimales);
  if (ahora.unidad === '%') return `${signo}${absoluto} ${Math.abs(delta) === 1 ? 'punto' : 'puntos'}`;
  return `${signo}${absoluto}${ahora.unidad ? ` ${ahora.unidad}` : ''}`;
}
