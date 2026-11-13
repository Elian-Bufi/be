/**
 * La escala de letra de la persona, comparada como la manda Android (WP-APP-VUELTA-2, revisión de la etapa A; DL-170).
 *
 * Android guarda la escala como `float` (`Configuration.fontScale`), y React Native 0.86 la pasa a JS con
 * `fontScale.toDouble()` (`DeviceInfoModule.kt`). Así, «×1,3» de los ajustes llega como 1,2999999523…, que es menor que
 * 1,3, y «×1,15» como 1,1499999761…. Una comparación con el literal (`fontScale >= 1.3`) deja la composición de la letra
 * de siempre justo en la escala para la que se pensó la otra, y las pruebas con el literal pasan igual. Por eso la escala
 * se compara acá, en centésimos, y en ningún otro lugar con un número escrito a mano.
 *
 * Es lógica pura, sin React Native: la prueban `scripts/vuelta-de-rosca.test.mjs` (TEST-AV2-008) y `inicio.test.mjs`.
 */

/** Desde esta escala la letra es grande, y Inicio va en una columna (AV2-07): el «×1,3» de los ajustes de Android. */
export const ESCALA_DE_LA_LETRA_GRANDE = 1.3;

/** Si la escala llega a `umbral`, comparadas en centésimos: 1,2999999523… llega a 1,3; 1,29, no. Sin escala, no llega. */
export const alcanzaLaEscala = (escala: number, umbral: number): boolean => Math.round(escala * 100) >= Math.round(umbral * 100);

/** Si la letra es grande (×1,3 o más), con la escala como la manda Android. */
export const esLetraGrande = (escala: number): boolean => alcanzaLaEscala(escala, ESCALA_DE_LA_LETRA_GRANDE);
