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
 *   chico de un nivel 1, y no queda debajo de ningún contenido. Pinta solo esa franja, sin repetirse (AV2-T22).
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
  /** El interruptor de §3.3: prendido en toda la app desde el visto bueno de Dirección a la muestra (AV2-26). */
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

/**
 * La sombra del nivel 1, {x, y, desenfoque, extensión} en dp (AV2-T24, con la vuelta de Dirección a la 0.25: «más
 * profundo»): más baja y más larga que en la muestra, recogida para que no ensucie los costados. Sigue siendo una sola
 * sombra por tarjeta: cada sombra exterior es un desenfoque más por cuadro.
 */
const SOMBRA_DEL_NIVEL_1: Readonly<Record<Tema, { readonly x: number; readonly y: number; readonly desenfoque: number; readonly extension: number }>> = {
  'azul-noche': { x: 0, y: 12, desenfoque: 32, extension: -6 },
  claro: { x: 0, y: 10, desenfoque: 28, extension: -2 },
};
/** La línea de luz bajo el borde de arriba: una sombra interior de 1 dp, sin desenfoque. */
const LINEA_DE_LUZ = { offsetX: 0, offsetY: 1, blurRadius: 0 } as const;
/** El resplandor del botón principal habilitado: quieto, sin pulso. */
const RESPLANDOR = { offsetX: 0, offsetY: 6, blurRadius: 18 } as const;

export interface EstiloDeSuperficie {
  readonly backgroundColor: string;
  readonly borderColor: string;
  /** El filo de luz del borde de arriba (AV2-T24): el mismo borde de 1 dp, más claro arriba que a los costados. */
  readonly borderTopColor?: string;
  readonly borderWidth: number;
  readonly borderRadius?: number;
  readonly boxShadow?: readonly SombraDeLaReceta[];
  readonly experimental_backgroundImage?: string;
  readonly experimental_backgroundSize?: string;
  readonly experimental_backgroundRepeat?: 'no-repeat';
}

/** El brillo de arriba de un nivel 1, o `null` si el tema no lo dibuja (en Claro, sobre blanco, no se vería). */
export function brilloDeArriba(color: Paleta): string | null {
  if (!seVe(color.vidrioBrillo)) return null;
  return `linear-gradient(to bottom, ${color.vidrioBrillo} 0px, ${sinAlfa(color.vidrioBrillo)} ${ALTO_DEL_BRILLO}px)`;
}

/**
 * El brillo pinta solo su franja (AV2-T22): a todo el ancho, `ALTO_DEL_BRILLO` de alto y sin repetirse. Sin tamaño,
 * React Native dibuja cada capa de fondo del tamaño de toda la vista (`BackgroundImageDrawable`, un `drawRect` por
 * mosaico) y la repite: el brillo, que se ve en 12 dp, se pintaba sobre toda la tarjeta, una pasada de más por cuadro.
 */
const FRANJA_DEL_BRILLO = { experimental_backgroundSize: `100% ${ALTO_DEL_BRILLO}px`, experimental_backgroundRepeat: 'no-repeat' } as const;

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
      borderTopColor: color.vidrioFiloArriba,
      borderWidth: 1,
      borderRadius: RADIO_DE_LA_TARJETA,
      boxShadow: sombras,
      ...(brillo ? { experimental_backgroundImage: brillo, ...FRANJA_DEL_BRILLO } : {}),
    };
  }
  // El nivel 2 y lo que va adentro: sin sombra. Más adentro todavía, sin relleno.
  return { backgroundColor: nivel === 2 ? color.vidrioInterior : sinAlfa(color.vidrioInterior), borderColor: color.borde, borderWidth: 1, borderRadius: RADIO_DE_LA_FICHA };
}

/**
 * La sombra de la barra flotante (AV2-06): `boxShadow` en lugar de `elevation`, que con el vidrio al 88 % se vería a
 * través como una mancha, y la línea de luz por dentro si el tema la dibuja. Fija durante la sesión no se usa: no flota.
 */
export function sombrasDeLaBarra(color: Paleta): readonly SombraDeLaReceta[] {
  const sombras: SombraDeLaReceta[] = [{ offsetX: 0, offsetY: 6, blurRadius: 18, spreadDistance: -2, color: color.sombraVidrio }];
  if (seVe(color.vidrioLuz)) sombras.push({ ...LINEA_DE_LUZ, inset: true, color: color.vidrioLuz });
  return sombras;
}

/** El borde de un botón (`ui.tsx`) y su relleno a cada costado, en dp. Con el vidrio, el principal pasa el borde a relleno. */
export const BORDE_DEL_BOTON = 2;
export const RELLENO_DEL_BOTON = 18;

/** Lo que el botón principal suma con el vidrio: el degradé, el radio, el borde pasado a relleno y, si está habilitado, el resplandor. */
export interface EstiloDelBotonPrincipal {
  readonly borderWidth: 0;
  readonly paddingVertical: number;
  readonly paddingHorizontal: number;
  readonly borderRadius: number;
  readonly experimental_backgroundImage: string;
  readonly boxShadow?: readonly SombraDeLaReceta[];
}

/**
 * El botón principal con la receta (AV2-04): el degradé de `botonFondo` arriba a `botonFondoFin` abajo y radio 14. El
 * resplandor va solo si está habilitado, y es quieto. Con el vidrio apagado, `null`: el botón de siempre (el fondo liso de
 * `botonFondo` queda debajo del degradé, por si no se dibuja).
 *
 * **Sin borde** (revisión de la etapa A): React Native 0.86.3 ubica la imagen de fondo en la caja de relleno, la pinta en
 * la del borde y la repite (`BackgroundImageDrawable.updatePath`). Con el borde de 2 dp sin color de antes, arriba se veía
 * el final del degradé y abajo el principio: una franja invertida. Los 2 dp pasan a relleno, y el alto y el lugar del
 * texto no cambian.
 */
export function botonPrincipal(color: Paleta, opciones: OpcionesDelVidrio & { readonly habilitado: boolean }): EstiloDelBotonPrincipal | null {
  if (!vidrioPrendido(opciones)) return null;
  return {
    borderWidth: 0,
    paddingVertical: BORDE_DEL_BOTON,
    paddingHorizontal: RELLENO_DEL_BOTON + BORDE_DEL_BOTON,
    borderRadius: RADIO_DE_LA_FICHA,
    experimental_backgroundImage: `linear-gradient(to bottom, ${color.botonFondo}, ${color.botonFondoFin})`,
    ...(opciones.habilitado ? { boxShadow: [{ ...RESPLANDOR, color: color.resplandorPrimario }] } : {}),
  };
}

/** Si un color es opaco: `#rrggbb`, o `#rrggbbaa` con alfa FF. */
export const esOpaco = (color: string): boolean => color.length === 7 || color.slice(7).toLowerCase() === 'ff';

/** El relleno a los costados de la etiqueta de estado cuando va rellena, en dp. */
export const RELLENO_DE_LA_ETIQUETA = 12;

export interface EstiloDeLaEtiqueta {
  readonly backgroundColor: string;
  readonly borderWidth: 0;
  readonly paddingHorizontal: number;
}

/**
 * La etiqueta de estado neutra (AV2-04, AV2-T16; revisada por AV2-T20): sin borde, y rellena con `etiquetaFondo` solo
 * donde la prueba de contraste mide que el tenue se lee sobre el relleno:
 * - sobre lo opaco: con el vidrio apagado o con alto contraste, cualquier tarjeta es `superficie` (5,98:1 en Azul noche y
 *   4,84:1 en Claro), y con el vidrio, el nivel 2 de Claro, que es blanco opaco;
 * - sobre el vidrio de nivel 1 (4,60:1 y 4,75:1).
 * Directo sobre el fondo con los destellos (3,69:1 y 4,37:1) o dentro del nivel 2 translúcido de Azul noche (3,89:1), va
 * sin relleno y sin la sangría de 12 dp: queda alineada con el texto de al lado. Antes el relleno se sacaba en todo nivel
 * que no fuera el 1, también con el vidrio apagado, y la etiqueta quedaba como un texto gris corrido 12 dp (Tu historial,
 * Novedades, los formularios y los vínculos).
 */
export function estiloDeLaEtiqueta(color: Paleta, contexto: NivelDelContexto, prendido: boolean): EstiloDeLaEtiqueta {
  const rellena = contexto !== 0 && (contexto === 1 || !prendido || esOpaco(color.vidrioInterior));
  return rellena
    ? { backgroundColor: color.etiquetaFondo, borderWidth: 0, paddingHorizontal: RELLENO_DE_LA_ETIQUETA }
    : { backgroundColor: sinAlfa(color.etiquetaFondo), borderWidth: 0, paddingHorizontal: 0 };
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

interface Destello {
  readonly token: 'destello' | 'destelloAzul';
  readonly centroX: number;
  readonly centroY: number;
  readonly radioX: number;
  readonly radioY: number;
}

/**
 * Los dos destellos, en proporción de la ventana. Son quietos: no marcan nada que se toque (GUIA I.6).
 * - **Azul noche:** dos luces, la celeste arriba a la derecha y la azul a media altura del otro lado.
 * - **Claro** (AV2-T25, con la vuelta de Dirección a la 0.25): dos barridos celestes muy suaves en las esquinas, arriba
 *   a la izquierda y abajo a la derecha, como en su referencia. Lo que pueden oscurecer el fondo lo fija la prueba de
 *   contraste: por eso el acento, el éxito, el error y el borde de los campos de Claro bajaron un tono.
 */
const DESTELLOS: Readonly<Record<Tema, readonly [Destello, Destello]>> = {
  'azul-noche': [
    { token: 'destello', centroX: 0.84, centroY: 0.05, radioX: 0.95, radioY: 0.3 },
    { token: 'destelloAzul', centroX: 0.08, centroY: 0.46, radioX: 0.85, radioY: 0.26 },
  ],
  claro: [
    { token: 'destello', centroX: 0, centroY: 0, radioX: 0.9, radioY: 0.32 },
    { token: 'destelloAzul', centroX: 1, centroY: 1, radioX: 0.95, radioY: 0.34 },
  ],
};

/**
 * El fondo de la app (AV2-03, AV2-T1): los dos destellos radiales encima y el degradé lineal debajo, desde los tokens.
 * Las posiciones y los tamaños son dp calculados con la ventana, nunca porcentajes: al abrir el teclado el fondo no salta.
 * Sin mapa de bits: lo dibuja Android.
 */
export function recetaDelFondo(color: Paleta, tema: Tema, ancho: number, alto: number): NonNullable<Exclude<ViewStyle['experimental_backgroundImage'], string>> {
  const destellos = DESTELLOS[tema].map((d) => ({
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

// ─── La vuelta de Dirección a la 0.25 (2026-11-12): el grano y la cabecera que responde al desplazamiento ───────────

/** El lado de la imagen del grano, en píxeles del teléfono (`assets/grano.png`, `scripts/generar-grano.cjs`). */
export const LADO_DEL_GRANO = 512;

export interface MosaicoDelGrano {
  /** El lado de cada pieza, en dp: la imagen, píxel a píxel, sin escalar. */
  readonly lado: number;
  readonly piezas: readonly { readonly left: number; readonly top: number }[];
}

/**
 * El grano de Azul noche (AV2-T23): una imagen chica que se repite en mosaico sobre el degradé y las luces, cada pieza
 * píxel a píxel (con la densidad del teléfono), para que sea un grano muy fino y no una trama agrandada.
 * - **Liviano:** una sola imagen decodificada (1 MB) que todas las piezas comparten, y una pieza cada 512 píxeles: unas
 *   quince en un teléfono de 1080 × 2400. Es quieto: está debajo del desplazamiento y no se vuelve a armar al desplazar.
 *   Un mosaico con `resizeMode="repeat"` armaría en Android un mapa de bits del tamaño de la vista, unos 10 MB (AV2-T1).
 * - **Sin grano** (`null`) si el tema no lo dibuja (Claro: los dos tokens con alfa 00).
 */
export function mosaicoDelGrano(color: Paleta, ancho: number, alto: number, densidad: number): MosaicoDelGrano | null {
  if (!seVe(color.granoLuz) && !seVe(color.granoSombra)) return null;
  const lado = LADO_DEL_GRANO / densidad;
  const columnas = Math.ceil(ancho / lado);
  const filas = Math.ceil(alto / lado);
  const piezas: { left: number; top: number }[] = [];
  for (let f = 0; f < filas; f++) for (let c = 0; c < columnas; c++) piezas.push({ left: c * lado, top: f * lado });
  return { lado, piezas };
}

/** Desde cuántos dp desplazados hay contenido detrás de la cabecera (AV2-T26). */
export const UMBRAL_DE_LA_CABECERA = 4;
/** El alto del desvanecido debajo de la cabecera, en dp: el contenido se apaga ahí en lugar de cortarse de golpe. */
export const ALTO_DEL_DESVANECIDO = 20;
/** Cuánto tarda la cabecera en tomar o soltar su fondo, en ms: un fundido corto, sin rebote (Material 3). */
export const FUNDIDO_DE_LA_CABECERA = 160;

/** Si hay contenido detrás de la cabecera: arriba de todo, no. */
export const cabeceraCubierta = (desplazamiento: number): boolean => desplazamiento > UMBRAL_DE_LA_CABECERA;

export interface CapaDeLaCabecera {
  readonly backgroundColor: string;
  readonly borderBottomColor: string;
  readonly borderBottomWidth: number;
}

/**
 * El fondo de la cabecera con contenido detrás (AV2-T26): un tenue con su línea abajo. Arriba de todo la cabecera es
 * transparente (AV2-05) y esta capa no se ve. Con el «Texto de alto contraste», el fondo liso.
 */
export const capaDeLaCabecera = (color: Paleta, altoContraste: boolean): CapaDeLaCabecera => ({
  backgroundColor: altoContraste ? color.fondo : color.cabeceraFondo,
  borderBottomColor: color.borde,
  borderBottomWidth: 1,
});

/**
 * El desvanecido debajo de la línea: el mismo tenue de la cabecera, que se apaga en `ALTO_DEL_DESVANECIDO`. Con el alto
 * contraste no hay desvanecido (`null`): el contenido se corta en la línea, que se ve más clara.
 */
export const desvanecidoDeLaCabecera = (color: Paleta, altoContraste: boolean): string | null =>
  altoContraste ? null : `linear-gradient(to bottom, ${color.cabeceraFondo}, ${sinAlfa(color.cabeceraFondo)})`;
