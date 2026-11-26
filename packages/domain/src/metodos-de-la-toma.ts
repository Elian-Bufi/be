/**
 * RP-18 (DL-190) · elegir el método **antes** de medir. El profesional elige uno o varios métodos al empezar la toma, y
 * la figura y la lista marcan solo lo que piden esos métodos (la unión), más peso, talla y edad. Lo demás del protocolo
 * sigue a mano con «+ Otra medición». Viene elegido el método habitual del profesional: el que usó para calcular en su
 * última toma, con cualquier persona (API-MHA-01); si no hay, nada elegido, y la toma muestra el protocolo entero, como
 * antes.
 *
 * Se elige por **familia**: las variantes por sexo de un método dan la misma métrica (DL-112) y piden las mismas
 * mediciones, así que para saber qué medir alcanza con la familia. La variante se elige al calcular, con el sexo de la
 * figura de la toma (que no es un dato y no se guarda).
 *
 * Lógica pura, sin interfaz: la usan `preparacion.tsx` y `calculos.tsx`, y la prueba `metodos-de-la-toma.test.ts`.
 * Nada de este módulo conoce un valor: decide qué se pide, nunca qué es «mejor» (REG-06-205).
 */
import type { CategoriaDeMetodo } from './calculo';
import type { MetodoApi } from './contratos-calculo';
import type { MetricaDelProtocolo } from './figura-antropometrica';
import { FAMILIA_DE_METRICA, NOMBRE_DE_METRICA, UNIDAD_DE_METRICA, nombreDeMetrica } from './nombres-de-metricas';

/** Lo que la toma pide siempre, elija el método que elija. */
export const MEDICIONES_DE_BASE: readonly string[] = ['peso', 'talla', 'edad'];

/** El sexo de la ecuación: el de la figura de la toma. No es un dato de la toma (DL-111, decisión 5). */
export type SexoDeLaEcuacion = 'HOMBRE' | 'MUJER';

/** Una variante de la familia: el método, y el sexo de su ecuación si la ecuación es por sexo. */
export interface VarianteDeMetodo {
  readonly sexo: SexoDeLaEcuacion | null;
  readonly metodo: MetodoApi;
}

/** Un método para elegir antes de medir: sus variantes por sexo juntas, con lo que piden. */
export interface FamiliaDeMetodo {
  /** La métrica que da (la comparten sus variantes por sexo). */
  readonly clave: string;
  readonly nombre: string;
  readonly categoria: CategoriaDeMetodo | null;
  readonly variantes: readonly VarianteDeMetodo[];
  /** Las mediciones que pide, en el orden de su ecuación (la unión de las de sus variantes). */
  readonly mediciones: readonly string[];
  readonly porSexo: boolean;
}

/** El sexo de la ecuación, por la clave del método del catálogo de BE: `…-H` hombres, `…-M` mujeres. */
export function sexoDelMetodo(m: Pick<MetodoApi, 'key'>): SexoDeLaEcuacion | null {
  if (/-H$/.test(m.key)) return 'HOMBRE';
  if (/-M$/.test(m.key)) return 'MUJER';
  return null;
}

const ORDEN_DE_CATEGORIA: readonly (CategoriaDeMetodo | null)[] = ['INDICES', 'SUMAS_DE_PLIEGUES', 'GRASA_CORPORAL', 'MASAS', 'SOMATOTIPO', null];

/**
 * Los métodos seleccionables, por familia, en el orden neutral del catálogo: por categoría y, adentro, por nombre. Nunca
 * por «mejor». Un método histórico no se ofrece para elegir.
 */
export function familiasDeMetodos(metodos: readonly MetodoApi[]): FamiliaDeMetodo[] {
  const porClave = new Map<string, { categoria: CategoriaDeMetodo | null; variantes: VarianteDeMetodo[] }>();
  for (const metodo of metodos) {
    if (metodo.status !== 'SELECTABLE') continue;
    const clave = metodo.output.metric;
    const familia = porClave.get(clave) ?? { categoria: metodo.category, variantes: [] };
    familia.variantes.push({ sexo: sexoDelMetodo(metodo), metodo });
    porClave.set(clave, familia);
  }
  return [...porClave]
    .map(([clave, f]) => {
      const mediciones: string[] = [];
      for (const v of f.variantes) for (const e of v.metodo.requiredInputs) if (!mediciones.includes(e.metric)) mediciones.push(e.metric);
      const variantes = [...f.variantes].sort((a, b) => (a.sexo ?? '').localeCompare(b.sexo ?? ''));
      return { clave, nombre: nombreDeMetrica(clave), categoria: f.categoria, variantes, mediciones, porSexo: variantes.some((v) => v.sexo !== null) };
    })
    .sort((a, b) => ORDEN_DE_CATEGORIA.indexOf(a.categoria) - ORDEN_DE_CATEGORIA.indexOf(b.categoria) || a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Los conjuntos que se eligen de un toque: varias familias que se usan juntas. Elegir el conjunto elige sus familias; cada
 * una sigue siendo un método aparte, con su resultado y su fuente.
 */
export const CONJUNTOS_DE_METODOS: readonly { readonly clave: string; readonly nombre: string; readonly familias: readonly string[] }[] = [
  { clave: 'kerr-cinco-componentes', nombre: 'Kerr (1988), cinco componentes', familias: ['masa-piel-kerr', 'masa-adiposa-kerr', 'masa-muscular-kerr', 'masa-osea-kerr', 'masa-residual-kerr'] },
  { clave: 'somatotipo-heath-carter', nombre: 'Somatotipo de Heath y Carter', familias: ['endomorfia', 'mesomorfia', 'ectomorfia'] },
];

/**
 * Dónde mide BE un sitio que las fuentes nombran distinto, para que el profesional sepa si coincide con su práctica antes
 * de medir. Por familia; sale de la ficha de métodos (§2 y §15.2) y de DL-190.
 */
export const NOTA_DEL_SITIO: Readonly<Record<string, string>> = {
  'grasa-jackson-pollock-7':
    'El «suprailíaco» de Jackson y Pollock BE lo toma en la cresta ilíaca: inmediatamente por encima de la cresta, como el consenso del GREC (D-1 de la ficha). El supraespinal queda unos centímetros más arriba y daría entre 1 y 2 puntos menos de grasa.',
  'suma-7-pliegues-jackson-pollock': 'El «suprailíaco» de Jackson y Pollock BE lo toma en la cresta ilíaca, inmediatamente por encima de la cresta (D-1 de la ficha), no en el supraespinal.',
  'masa-muscular-esqueletica-lee': 'Lee y col. miden el perímetro del muslo medio, a mitad de camino entre el pliegue inguinal y el borde de arriba de la rótula.',
  'masa-muscular-kerr':
    'Kerr corrige el perímetro del muslo tomado a 1 cm del pliegue glúteo (no el muslo medio de Lee) y el del pecho a nivel mesoesternal, como ISAK (D-3, DL-190).',
  'masa-residual-kerr': 'Kerr usa la talla sentado, los diámetros transverso y anteroposterior del tórax y la cintura mínima («31. Waist girth (min.)»), corregida por el pliegue abdominal.',
};

/** Las familias que se ven elegidas al empezar: las de los métodos que el profesional usó en su última toma. */
export function familiasHabituales(familias: readonly FamiliaDeMetodo[], methodIds: readonly string[]): string[] {
  const usados = new Set(methodIds);
  return familias.filter((f) => f.variantes.some((v) => usados.has(v.metodo.methodId))).map((f) => f.clave);
}

/**
 * Las mediciones que pide la elección, sin repetir: peso, talla y edad; después lo que piden las familias elegidas, en el
 * orden del catálogo; al final, los puntos sueltos que agregó el profesional. Lo que ya tiene dato en la toma también
 * va, aunque ningún método lo pida: elegir no esconde lo medido.
 */
export function medicionesDeLaEleccion(
  familias: readonly FamiliaDeMetodo[],
  elegidas: ReadonlySet<string>,
  extra: { readonly sueltas?: readonly string[]; readonly conDato?: readonly string[] } = {},
): string[] {
  return medicionesPedidas(familias.filter((f) => elegidas.has(f.clave)).flatMap((f) => f.mediciones), extra);
}

/**
 * DL-200 · lo mismo para cualquier lista de mediciones pedidas (las de los métodos de `resultados-antropometricos.ts`): peso,
 * talla y edad; después lo pedido, en el orden del catálogo; al final, los puntos sueltos y lo que ya tiene dato.
 */
export function medicionesPedidas(pedidasPorLosMetodos: Iterable<string>, extra: { readonly sueltas?: readonly string[]; readonly conDato?: readonly string[] } = {}): string[] {
  const pedidas = new Set<string>(MEDICIONES_DE_BASE);
  for (const m of pedidasPorLosMetodos) pedidas.add(m);
  const catalogo = Object.keys(NOMBRE_DE_METRICA).filter((c) => c in FAMILIA_DE_METRICA);
  const enOrden = [...catalogo.filter((c) => pedidas.has(c)), ...[...pedidas].filter((c) => !catalogo.includes(c))];
  for (const c of [...(extra.sueltas ?? []), ...(extra.conDato ?? [])]) if (!enOrden.includes(c)) enOrden.push(c);
  return enOrden;
}

/**
 * Las métricas que muestra la toma para unas claves: la definición del protocolo si la declara; si no, la del catálogo de
 * mediciones de BE (las de Kerr que el perfil completo no tiene, DL-190 AK-D03). Una clave que BE no conoce no se
 * inventa: queda para la carga libre. Las claves llegan también de la dirección (`sueltas=`): se miran solo las propias
 * del catálogo, para que `__proto__` o `constructor` no se lean como una medición con la familia de un objeto.
 */
export function metricasDeLaToma(protocolo: readonly MetricaDelProtocolo[], claves: readonly string[]): MetricaDelProtocolo[] {
  const delProtocolo = new Map(protocolo.map((m) => [m.clave, m]));
  return claves.flatMap((clave): MetricaDelProtocolo[] => {
    const declarada = delProtocolo.get(clave);
    if (declarada) return [declarada];
    if (!Object.hasOwn(FAMILIA_DE_METRICA, clave) || !Object.hasOwn(UNIDAD_DE_METRICA, clave)) return [];
    const familia = FAMILIA_DE_METRICA[clave];
    const unidad = UNIDAD_DE_METRICA[clave];
    return familia && unidad ? [{ clave, nombre: nombreDeMetrica(clave), familia, unidades: [unidad] }] : [];
  });
}

/**
 * Lo que se puede sumar con «+ Otra medición»: lo que el protocolo declara y el catálogo de BE conoce, menos lo que la toma
 * ya muestra, en el orden del catálogo.
 */
export function otrasMediciones(protocolo: readonly MetricaDelProtocolo[], visibles: readonly string[]): MetricaDelProtocolo[] {
  const ya = new Set(visibles);
  const delCatalogo = Object.keys(FAMILIA_DE_METRICA).filter((c) => !ya.has(c));
  const declaradas = protocolo.filter((m) => !ya.has(m.clave));
  return [...declaradas, ...metricasDeLaToma([], delCatalogo.filter((c) => !declaradas.some((m) => m.clave === c)))];
}

/** La variante de la familia para calcular con el sexo de la figura; si la ecuación no es por sexo, la única. */
export function varianteParaCalcular(familia: FamiliaDeMetodo, sexo: SexoDeLaEcuacion): MetodoApi | null {
  const unica = familia.variantes.find((v) => v.sexo === null);
  if (unica) return unica.metodo;
  return familia.variantes.find((v) => v.sexo === sexo)?.metodo ?? null;
}

/** La elección en la dirección de la página: las familias separadas por coma, sin repetir y solo las que existen. */
export function leerEleccion(texto: string | null, familias: readonly FamiliaDeMetodo[]): string[] {
  if (!texto) return [];
  const conocidas = new Set(familias.map((f) => f.clave));
  return [...new Set(texto.split(',').map((c) => c.trim()))].filter((c) => conocidas.has(c));
}
