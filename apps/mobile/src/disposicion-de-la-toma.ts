/**
 * «Mi evolución»: qué vistas hay, cuál se abre, qué toma muestra cada una, cuántas columnas llevan los indicadores y
 * cuándo una toma puede estar incompleta (DL-117; DL-118, Dirección 2026-10-05). Es lógica pura, sin React: la usa
 * `pantallas/antropometria.tsx`, y la prueba `scripts/selector-de-tomas.test.mjs` sin teléfono.
 */
import { FAMILIA_DE_METRICA, TARJETAS_DE_PERIMETROS, TARJETAS_DE_PLIEGUES, type MedidaDeLaToma, type TomaDelPeriodo, type UltimaToma } from '@be/domain';
import type { VistaDeEvolucion } from './navegacion';

const PERIMETROS_EN_LA_FIGURA: ReadonlySet<string> = new Set(TARJETAS_DE_PERIMETROS.ENTERO.flat());
const PLIEGUES_EN_LA_FIGURA: ReadonlySet<string> = new Set(TARJETAS_DE_PLIEGUES.ENTERO.flat());

/** La familia de un sitio de la figura, o `null` si la medida no tiene sitio (peso, IMC, un diámetro…). */
export function familiaDelSitio(metrica: string): 'PERIMETROS' | 'PLIEGUES' | null {
  if (PERIMETROS_EN_LA_FIGURA.has(metrica)) return 'PERIMETROS';
  if (PLIEGUES_EN_LA_FIGURA.has(metrica)) return 'PLIEGUES';
  return null;
}

/** Si una medida tiene sitio en la figura: un perímetro o un pliegue que la lámina ubica. */
export const esSitioDeLaFigura = (metrica: string): boolean => familiaDelSitio(metrica) !== null;

/**
 * Las vistas de la pantalla (DL-118): «Mapa corporal», «Progreso» e «Indicadores». Comparar salió como apartado: su
 * lectura queda en cada tarjeta de Progreso. `TOMA` es el pedido de Inicio («Ver la toma») y la primera visita: se
 * resuelve con los datos, una sola vez.
 */
export type Vista = 'TOMA' | 'MAPA' | 'PROGRESO' | 'INDICADORES';
export type VistaVisible = Exclude<Vista, 'TOMA'>;

/** Lo que tiene una toma para cada vista. */
export interface ContenidoDeLaToma {
  /** Perímetros o pliegues con sitio en la figura: el mapa y Progreso. */
  readonly conSitios: boolean;
  /** Medidas sin sitio (peso, talla, diámetros, edad) o resultados de fórmulas: Indicadores. */
  readonly conIndicadores: boolean;
}

export function contenidoDeLaToma(toma: Pick<UltimaToma, 'medidas' | 'derivadas'>): ContenidoDeLaToma {
  return {
    conSitios: toma.medidas.some((m) => esSitioDeLaFigura(m.metrica)),
    conIndicadores: toma.derivadas.length > 0 || toma.medidas.some((m) => !esSitioDeLaFigura(m.metrica)),
  };
}

/**
 * Las vistas que se pueden mostrar con las tomas del período: el mapa y Progreso, si alguna toma tiene sitios;
 * Indicadores, si alguna tiene indicadores. Nunca una vista vacía. Sin ninguna, el período no tiene mediciones.
 */
export function vistasDisponibles(contenidos: readonly ContenidoDeLaToma[]): readonly VistaVisible[] {
  const vistas: VistaVisible[] = [];
  if (contenidos.some((c) => c.conSitios)) vistas.push('MAPA', 'PROGRESO');
  if (contenidos.some((c) => c.conIndicadores)) vistas.push('INDICADORES');
  return vistas;
}

/**
 * La vista que se ve. `TOMA` abre el mapa si la última toma tiene sitios y, si no, Indicadores. Una vista que no está
 * disponible pasa a otra que sí, y los valores de la versión anterior (Comparar y Evolución) abren Progreso.
 */
export function vistaQueSeVe(vista: string, disponibles: readonly VistaVisible[], ultimaConSitios: boolean): VistaVisible | null {
  if (disponibles.length === 0) return null;
  const alternativa = disponibles.includes('INDICADORES') ? 'INDICADORES' : disponibles[0]!;
  if (vista === 'TOMA') return ultimaConSitios && disponibles.includes('MAPA') ? 'MAPA' : alternativa;
  const pedida = vista === 'COMPARAR' || vista === 'EVOLUCION' ? 'PROGRESO' : vista;
  return disponibles.find((v) => v === pedida) ?? alternativa;
}

/** Si la toma tiene datos para la vista: sitios para el mapa y Progreso, indicadores para Indicadores. */
export const tieneDatosPara = (vista: VistaVisible, contenido: ContenidoDeLaToma): boolean => (vista === 'INDICADORES' ? contenido.conIndicadores : contenido.conSitios);

/**
 * La toma que muestra una vista: la elegida, si tiene datos para ella; si no, la más cercana anterior que los tiene; si
 * no hay anterior, la primera posterior. Sin elegida, la última con datos. `null` si ninguna toma los tiene.
 */
export function tomaDeLaVista<T extends { readonly evaluacionId: string }>(tomas: readonly T[], elegida: string | null, tieneDatos: (t: T) => boolean): T | null {
  const i = elegida === null ? -1 : tomas.findIndex((t) => t.evaluacionId === elegida);
  if (i < 0) {
    for (let j = tomas.length - 1; j >= 0; j--) if (tieneDatos(tomas[j]!)) return tomas[j]!;
    return null;
  }
  if (tieneDatos(tomas[i]!)) return tomas[i]!;
  for (let j = i - 1; j >= 0; j--) if (tieneDatos(tomas[j]!)) return tomas[j]!;
  for (let j = i + 1; j < tomas.length; j++) if (tieneDatos(tomas[j]!)) return tomas[j]!;
  return null;
}

/** El selector de tomas va cuando la vista tiene más de una toma para mostrar. */
export const seVeElSelectorDeTomas = (cantidadDeTomasDeLaVista: number): boolean => cantidadDeTomasDeLaVista > 1;

/**
 * Lo que un pedido deja elegido antes del primer dibujo; después manda lo que elija la persona.
 * - «Ver la toma» abre la última toma, la que nombra la tarjeta de Inicio, aunque antes se haya elegido otra.
 * - La ruta vieja a Comparar abre Progreso.
 * - «Ver su evolución» abre la medida: un sitio de la figura en Progreso, con su familia y el panel que lo tiene;
 *   cualquier otra medida en Indicadores, con su detalle.
 */
export function eleccionesDelPedido({ vista, metrica }: { vista?: VistaDeEvolucion; metrica?: string }): readonly (readonly [clave: string, valor: string | null])[] {
  const elecciones: (readonly [string, string | null])[] = [];
  const familia = metrica ? familiaDelSitio(metrica) : null;
  if (vista === 'ultima') elecciones.push(['mi-evolucion:vista', 'TOMA'], ['mi-evolucion:toma', null]);
  if (vista === 'comparar') elecciones.push(['mi-evolucion:vista', 'PROGRESO']);
  if (vista === 'evolucion') elecciones.push(['mi-evolucion:vista', metrica && !familia ? 'INDICADORES' : 'PROGRESO']);
  if (metrica) elecciones.push(['mi-evolucion:medida', metrica]);
  // Un sitio: su familia, y el panel lo decide la medida (`panelQueSeVe`).
  if (familia) elecciones.push(['mi-evolucion:familia', familia], ['mi-evolucion:panel', null]);
  return elecciones;
}

/**
 * Los indicadores de una toma en cuatro bloques (DL-118):
 * - **mediciones**: peso y talla;
 * - **resultados**: los de las fórmulas, que son estimaciones, en el orden del catálogo;
 * - **contexto**: la edad al momento de la toma, que es un dato de la evaluación y no un progreso corporal;
 * - **más datos**: los diámetros y lo que BE no clasifica, que van plegados.
 * Nada se descarta: cada medida sin sitio en la figura va en un bloque.
 */
export interface BloquesDeIndicadores {
  readonly mediciones: readonly MedidaDeLaToma[];
  readonly resultados: readonly MedidaDeLaToma[];
  readonly contexto: readonly MedidaDeLaToma[];
  readonly masDatos: readonly MedidaDeLaToma[];
}

export function bloquesDeIndicadores(toma: Pick<UltimaToma, 'medidas' | 'derivadas'>): BloquesDeIndicadores {
  const sinSitio = toma.medidas.filter((m) => !esSitioDeLaFigura(m.metrica));
  return {
    mediciones: sinSitio.filter((m) => FAMILIA_DE_METRICA[m.metrica] === 'MASA_Y_ESTATURA'),
    resultados: toma.derivadas,
    contexto: sinSitio.filter((m) => m.metrica === 'edad'),
    masDatos: sinSitio.filter((m) => m.metrica !== 'edad' && FAMILIA_DE_METRICA[m.metrica] !== 'MASA_Y_ESTATURA'),
  };
}

/** El ancho mínimo de una tarjeta de indicador con la letra de siempre, en dp; crece con la letra de la persona. */
export const ANCHO_MINIMO_DE_INDICADOR = 130;
/** Lo que separa dos tarjetas de indicador. */
export const SEPARACION_DE_INDICADORES = 8;
/** El relleno y el borde de una tarjeta de indicador, de cada lado. */
export const RELLENO_DE_INDICADOR = 12;

/**
 * El ancho de cada carácter de un valor en «em», medido con Roboto 800 (la letra del valor) en el render del navegador.
 * Los dígitos tienen todos el mismo ancho. Lo que no está en la tabla cuenta como una letra ancha.
 */
const ANCHO_DEL_CARACTER_EN_EM: Readonly<Record<string, number>> = {
  ...Object.fromEntries([...'0123456789'].map((d) => [d, 0.5767])),
  ',': 0.2578,
  '.': 0.2964,
  ' ': 0.25,
  '%': 0.7413,
  k: 0.5406,
  g: 0.5733,
  c: 0.5206,
  m: 0.8639,
  '/': 0.3609,
  '²': 0.3736,
  '+': 0.5397,
  '−': 0.5508,
};
const LETRA_ANCHA_EN_EM = 0.62;
/** Lo que se suma a la medida por si la letra del teléfono es un poco más ancha que la del navegador. */
const HOLGURA_DEL_VALOR = 1.06;

/** El ancho estimado de un valor («78,4 kg») escrito a `tamano` dp, con la tabla medida y su holgura. */
export function anchoDelValorEstimado(texto: string, tamano: number): number {
  return [...texto].reduce((total, c) => total + (ANCHO_DEL_CARACTER_EN_EM[c] ?? LETRA_ANCHA_EN_EM), 0) * tamano * HOLGURA_DEL_VALOR;
}

/**
 * Dos columnas si en cada una entran su ancho mínimo, que crece con la letra, y el valor más largo de la toma sin partirse
 * (`anchoDelValorMasLargo`, ya estimado con la letra de la persona). Si no, una: la letra o el ancho lo piden.
 */
export function columnasDeIndicadores({ ancho, escalaDeLetra, anchoDelValorMasLargo }: { ancho: number; escalaDeLetra: number; anchoDelValorMasLargo: number }): 1 | 2 {
  const escala = Math.min(Math.max(escalaDeLetra, 1), 2.2);
  const columna = (ancho - SEPARACION_DE_INDICADORES) / 2;
  const necesario = Math.max(ANCHO_MINIMO_DE_INDICADOR * escala, anchoDelValorMasLargo + 2 * RELLENO_DE_INDICADOR + 2);
  return columna >= necesario ? 2 : 1;
}

/**
 * Las otras tomas del mismo día civil que la elegida. Si las hay, esta toma puede estar incompleta: la API muestra una
 * sola medición por día y por medida (D-3), y si dos evaluaciones del mismo día tomaron la misma medida, se ve una.
 */
export function otrasTomasDelDia(tomas: readonly TomaDelPeriodo[], evaluacionId: string): readonly TomaDelPeriodo[] {
  const esta = tomas.find((t) => t.evaluacionId === evaluacionId);
  return esta ? tomas.filter((t) => t.evaluacionId !== evaluacionId && t.fecha === esta.fecha) : [];
}
