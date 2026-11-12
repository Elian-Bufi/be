/**
 * La receta de vidrio de la APK (WP-APP-VUELTA-2 §3.2, DL-170), como lógica pura: qué estilo lleva cada superficie,
 * el botón principal, la etiqueta de estado, el enlace y el fondo de la app. No dibuja nada: devuelve estilos de la misma
 * vista, y `vidrio.tsx` y `fondo-de-la-app.tsx` los aplican. `scripts/vuelta-de-rosca.test.mjs` la prueba sin teléfono.
 *
 * - **Dos niveles** (§3.2): el nivel 1 es una tarjeta o una sección suelta (`vidrio`, el borde de luz de 1 dp, radio 20,
 *   la sombra por fuera, la línea de luz por dentro y, en Azul noche, el brillo de arriba); el nivel 2 es lo que va
 *   adentro de un nivel 1 (`vidrioInterior`, radio 14, sin sombra). Lo que va dentro de un nivel 2 no lleva relleno:
 *   vidrio dentro de vidrio, con dos sombras, se ensucia.
 * - **Ninguna vista hija** (AV2-T3): el borde de luz es el borde de 1 dp de siempre; la línea de luz y la sombra son
 *   `boxShadow`; el brillo es `experimental_backgroundImage` de la propia vista, que React Native 0.86 dibuja en esa vista
 *   y recorta a su radio. Es la intención de la excepción 13 de REFERENCIAS_VISUALES: nada adentro que pueda quedar
 *   recortado (WP-ENTRENAMIENTO-SERIES §7.7).
 * - **Sin `elevation`** en lo translúcido (AV2-T4): Android dibuja su sombra debajo de toda la vista y se vería a través
 *   del vidrio como una mancha. `boxShadow` recorta el interior. La exterior pide Android 9 y la interior Android 10:
 *   antes no se dibujan y nada se rompe.
 * - **El brillo se apaga dentro del relleno** (AV2-T14, a ratificar): con el brillo debajo, la etiqueta de estado de Azul
 *   noche bajaba a 4,00:1 y el texto del nivel 2 a 4,24 (`scripts/contraste.test.cjs`). Termina a 12 dp, el relleno más
 *   chico de un nivel 1, y no queda debajo de ningún contenido.
 * - **Apagado o con alto contraste**, la superficie es la opaca de hoy (`superficie` con su borde): el vidrio ya resuelto
 *   sobre el fondo liso (AV2-T2).
 * - **Los degradés terminan en el mismo color con alfa 00**, nunca en un transparente genérico, que en Android tiñe de gris.
 */
import type { ViewStyle } from 'react-native';
import type { Paleta, Tema } from './tema';

/** Los radios de la receta (AV2-T11): tarjeta 20, ficha y botón 14, cápsula 999. */
export const RADIO_DE_LA_TARJETA = 20;
export const RADIO_DE_LA_FICHA = 14;
export const RADIO_DE_LA_CAPSULA = 999;

/** El relleno de una tarjeta de nivel 1 (Seccion y las tarjetas de Inicio), en dp. Las cuentas de anchos lo usan. */
export const RELLENO_DE_LA_TARJETA = 16;
/** El relleno más chico de una superficie de nivel 1: la Tarjeta suelta y el aviso. */
export const RELLENO_MINIMO_DEL_NIVEL_1 = 12;
/** Hasta dónde llega el brillo de arriba, en dp: dentro del relleno, para que no quede debajo del contenido. */
export const ALTO_DEL_BRILLO = 12;

/** El nivel de una superficie: 1 suelta, 2 dentro de un nivel 1, 3 dentro de un nivel 2 (sin relleno). */
export type NivelDeLaSuperficie = 1 | 2 | 3;
/** El nivel del lugar donde se dibuja algo: 0 fuera de toda tarjeta. */
export type NivelDelContexto = 0 | NivelDeLaSuperficie;

/** El nivel que toma una superficie según dónde está: el que sigue al del contexto, hasta 3. */
export const nivelQueSigue = (contexto: NivelDelContexto): NivelDeLaSuperficie => (contexto >= 2 ? 3 : contexto === 1 ? 2 : 1);

export interface OpcionesDelVidrio {
  /** El interruptor de §3.3: App.tsx lo prende solo en Inicio hasta el visto bueno de Dirección (AV2-26). */
  readonly activo: boolean;
  /** El «Texto de alto contraste» de Android: con él, todo vuelve a ser opaco. */
  readonly altoContraste: boolean;
}

/** Si el vidrio se dibuja: prendido y sin alto contraste. */
export const vidrioPrendido = (o: OpcionesDelVidrio): boolean => o.activo && !o.altoContraste;

/** Si un color se ve: un opaco siempre; un translúcido, si su alfa no es 00. */
export const seVe = (color: string): boolean => !(color.length === 9 && color.slice(7).toLowerCase() === '00');

/** El mismo color con alfa 00: el final de un degradé que se apaga. */
export const sinAlfa = (color: string): string => `${color.slice(0, 7)}00`;

/** Una sombra de la receta, en el formato de `boxShadow`. La geometría vive acá; el color es un token. */
export interface SombraDeLaReceta {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blurRadius: number;
  readonly spreadDistance?: number;
  readonly inset?: boolean;
  readonly color: string;
}

/** La sombra del nivel 1, {x, y, desenfoque, extensión} en dp: en Azul noche se recoge 4 dp; en Claro, no. */
const SOMBRA_DEL_NIVEL_1: Readonly<Record<Tema, { readonly x: number; readonly y: number; readonly desenfoque: number; readonly extension: number }>> = {
  'azul-noche': { x: 0, y: 8, desenfoque: 24, extension: -4 },
  claro: { x: 0, y: 8, desenfoque: 24, extension: 0 },
};
/** La línea de luz bajo el borde de arriba: una sombra interior de 1 dp, sin desenfoque. */
const LINEA_DE_LUZ = { offsetX: 0, offsetY: 1, blurRadius: 0 } as const;
/** El resplandor del botón principal habilitado: quieto, sin pulso. */
const RESPLANDOR = { offsetX: 0, offsetY: 6, blurRadius: 18 } as const;

export interface EstiloDeSuperficie {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly borderRadius?: number;
  readonly boxShadow?: readonly SombraDeLaReceta[];
  readonly experimental_backgroundImage?: string;
}

/** El brillo de arriba de un nivel 1, o `null` si el tema no lo dibuja (en Claro, sobre blanco, no se vería). */
export function brilloDeArriba(color: Paleta): string | null {
  if (!seVe(color.vidrioBrillo)) return null;
  return `linear-gradient(to bottom, ${color.vidrioBrillo} 0px, ${sinAlfa(color.vidrioBrillo)} ${ALTO_DEL_BRILLO}px)`;
}

/**
 * La superficie de una tarjeta, una sección, una ficha o un aviso, según su nivel. Con el vidrio apagado o con alto
 * contraste, la opaca de hoy: `superficie` y el borde de siempre, con el radio de cada pieza.
 */
export function superficieDeVidrio(color: Paleta, tema: Tema, nivel: NivelDeLaSuperficie, opciones: OpcionesDelVidrio): EstiloDeSuperficie {
  if (!vidrioPrendido(opciones)) return { backgroundColor: color.superficie, borderColor: color.borde, borderWidth: 1 };
  if (nivel === 1) {
    const s = SOMBRA_DEL_NIVEL_1[tema];
    const sombras: SombraDeLaReceta[] = [{ offsetX: s.x, offsetY: s.y, blurRadius: s.desenfoque, spreadDistance: s.extension, color: color.sombraVidrio }];
    if (seVe(color.vidrioLuz)) sombras.push({ ...LINEA_DE_LUZ, inset: true, color: color.vidrioLuz });
    const brillo = brilloDeArriba(color);
    return {
      backgroundColor: color.vidrio,
      borderColor: color.vidrioFilo,
      borderWidth: 1,
      borderRadius: RADIO_DE_LA_TARJETA,
      boxShadow: sombras,
      ...(brillo ? { experimental_backgroundImage: brillo } : {}),
    };
  }
  // El nivel 2 y lo que va adentro: sin sombra. Más adentro todavía, sin relleno.
  return { backgroundColor: nivel === 2 ? color.vidrioInterior : sinAlfa(color.vidrioInterior), borderColor: color.borde, borderWidth: 1, borderRadius: RADIO_DE_LA_FICHA };
}

/** Lo que el botón principal suma con el vidrio: el degradé, el radio, el borde sin color y, si está habilitado, el resplandor. */
export interface EstiloDelBotonPrincipal {
  readonly borderColor: string;
  readonly borderRadius: number;
  readonly experimental_backgroundImage: string;
  readonly boxShadow?: readonly SombraDeLaReceta[];
}

/**
 * El botón principal con la receta (AV2-04): el degradé de `botonFondo` arriba a `botonFondoFin` abajo, radio 14 y el
 * borde de 2 dp sin color, para que el alto no cambie. El resplandor va solo si está habilitado, y es quieto. Con el
 * vidrio apagado, `null`: el botón de siempre (el fondo liso de `botonFondo` queda debajo del degradé, por si no se dibuja).
 */
export function botonPrincipal(color: Paleta, opciones: OpcionesDelVidrio & { readonly habilitado: boolean }): EstiloDelBotonPrincipal | null {
  if (!vidrioPrendido(opciones)) return null;
  return {
    borderColor: sinAlfa(color.botonFondo),
    borderRadius: RADIO_DE_LA_FICHA,
    experimental_backgroundImage: `linear-gradient(to bottom, ${color.botonFondo}, ${color.botonFondoFin})`,
    ...(opciones.habilitado ? { boxShadow: [{ ...RESPLANDOR, color: color.resplandorPrimario }] } : {}),
  };
}

/**
 * La etiqueta de estado neutra (AV2-04): rellena, sin borde. El relleno va solo sobre una tarjeta de nivel 1 (vidrio o
 * `superficie`), donde lo mide la prueba de contraste; directo sobre el fondo o dentro de un nivel 2, sin relleno.
 */
export function estiloDeLaEtiqueta(color: Paleta, contexto: NivelDelContexto): { readonly backgroundColor: string; readonly borderWidth: 0 } {
  return { backgroundColor: contexto === 1 ? color.etiquetaFondo : sinAlfa(color.etiquetaFondo), borderWidth: 0 };
}

/**
 * El nivel de un control con superficie (el botón secundario, los Segmentos): dentro de una tarjeta, el que sigue; fuera
 * de toda tarjeta, ninguno (`null`): un control suelto sobre el fondo no se vuelve una tarjeta con sombra, y se queda
 * con su superficie opaca de siempre.
 */
export const nivelDelControl = (contexto: NivelDelContexto): NivelDeLaSuperficie | null => (contexto === 0 ? null : nivelQueSigue(contexto));

/** El enlace con flecha no lleva subrayado (la flecha ya dice «enlace»: dos señales sobran); sin flecha, dentro de un texto, sí. */
export const subrayadoDelEnlace = (conFlecha: boolean): 'none' | 'underline' => (conFlecha ? 'none' : 'underline');

/** Dónde está el fondo liso a lo largo del alto: en Azul noche, un poco más abajo del medio. */
const PARADA_DEL_FONDO: Readonly<Record<Tema, string>> = { 'azul-noche': '55%', claro: '50%' };

/**
 * Los dos destellos, en proporción de la ventana: el cian arriba a la derecha y el azul a media altura del otro lado.
 * Son quietos: no marcan nada que se toque (GUIA I.6).
 */
const DESTELLOS = [
  { token: 'destello', centroX: 0.84, centroY: 0.05, radioX: 0.95, radioY: 0.3 },
  { token: 'destelloAzul', centroX: 0.08, centroY: 0.46, radioX: 0.85, radioY: 0.26 },
] as const;

/**
 * El fondo de la app (AV2-03, AV2-T1): los dos destellos radiales encima y el degradé lineal debajo, desde los tokens.
 * Las posiciones y los tamaños son dp calculados con la ventana, nunca porcentajes: al abrir el teclado el fondo no salta.
 * Sin mapa de bits: lo dibuja Android.
 */
export function recetaDelFondo(color: Paleta, tema: Tema, ancho: number, alto: number): NonNullable<Exclude<ViewStyle['experimental_backgroundImage'], string>> {
  const destellos = DESTELLOS.map((d) => ({
    type: 'radial-gradient' as const,
    shape: 'ellipse' as const,
    size: { x: Math.round(ancho * d.radioX), y: Math.round(alto * d.radioY) },
    position: { top: Math.round(alto * d.centroY), left: Math.round(ancho * d.centroX) },
    colorStops: [
      { color: color[d.token], positions: ['0%'] },
      { color: sinAlfa(color[d.token]), positions: ['100%'] },
    ],
  }));
  const degrade = {
    type: 'linear-gradient' as const,
    direction: 'to bottom',
    colorStops: [
      { color: color.fondoArriba, positions: ['0%'] },
      { color: color.fondo, positions: [PARADA_DEL_FONDO[tema]] },
      { color: color.fondoAbajo, positions: ['100%'] },
    ],
  };
  return [...destellos, degrade];
}
