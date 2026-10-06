/**
 * Las tarjetas «de vidrio» de la APK (pulido del 2026-10-04; WP-ENTRENAMIENTO-SERIES §7.7): una superficie mate y
 * uniforme, un filo finísimo y la sombra.
 * - **Sin brillo interno.** Hasta el 2026-10-06 había un degradé translúcido arriba (`BrilloDeVidrio`): un SVG de 100 %
 *   que React Native 0.86 mide contra el contenido sin el relleno (`AbsolutePercentAgainstInnerSize`, incluido en
 *   `YGErrataAll`). Quedaba una placa luminosa recortada de 16 a 24 dp antes del borde derecho, como una segunda tarjeta.
 *   Se reemplazó por la superficie mate que pide la excepción 13 de `REFERENCIAS_VISUALES.md`: no hay nada adentro que
 *   pueda quedar recortado.
 * - **Filo:** una línea finísima, apenas más clara (o más oscura en Claro), en lugar del borde.
 * - **Profundidad:** la sombra, suave y corrida hacia abajo.
 * La verificación en Android queda pendiente del teléfono: el render del navegador no usa Yoga.
 */

/** La sombra de una tarjeta de vidrio: suave, corrida hacia abajo. `sombra` es el token del tema. */
export const sombraDeVidrio = (sombra: string) => ({ shadowColor: sombra, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }) as const;
