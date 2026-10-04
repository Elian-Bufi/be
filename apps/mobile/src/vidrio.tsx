/**
 * El vidrio de las tarjetas de la APK (pulido del 2026-10-04): separación y profundidad con un brillo contenido, en lugar
 * de un borde fuerte en cada tarjeta.
 * - **Brillo:** un degradé translúcido arriba, que se apaga antes de la mitad (`laminaBrillo` y `vidrioBrillo` en
 *   tema.ts). En Claro no hay brillo: sobre blanco no se vería.
 * - **Filo:** una línea finísima, apenas más clara (o más oscura en Claro), en lugar del borde.
 * - **Profundidad:** la sombra, suave y corrida hacia abajo.
 * El texto se mide sobre la mezcla del brillo con la tarjeta (`scripts/contraste.test.cjs`). El brillo no recibe toques
 * ni lo recorre el lector de pantalla.
 */
import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * El brillo de arriba de una tarjeta, del tamaño de la tarjeta que lo contiene (que recorta sus esquinas con
 * `overflow: hidden`). `color` es un token `#rrggbbaa`; con alfa cero no se dibuja.
 */
export function BrilloDeVidrio({ color, radio }: { color: string; radio: number }) {
  const id = `brillo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const alfa = color.length === 9 ? parseInt(color.slice(7), 16) / 255 : 1;
  if (alfa === 0) return null;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color.slice(0, 7)} stopOpacity={alfa} />
          <Stop offset="0.45" stopColor={color.slice(0, 7)} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={radio} ry={radio} fill={`url(#${id})`} />
    </Svg>
  );
}

/** La sombra de una tarjeta de vidrio: suave, corrida hacia abajo. `sombra` es el token del tema. */
export const sombraDeVidrio = (sombra: string) => ({ shadowColor: sombra, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }) as const;
