/**
 * Los íconos del registro de comidas (WP-NUTRICION-RECETAS §9), dibujados con trazos como los de la barra y la cabecera.
 * Acompañan a un texto que dice lo mismo: el lector de pantalla no los recorre.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface PropsDeIcono {
  readonly color: string;
  readonly tamano?: number;
  readonly grosor?: number;
}

const sinLector = { accessible: false, importantForAccessibility: 'no-hide-descendants' } as const;

/** El respaldo de una imagen que no está o no se pudo mostrar: un plato con cubiertos. */
export function IconoDePlato({ color, tamano = 40, grosor = 1.6 }: PropsDeIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={12.5} r={6.2} stroke={color} strokeWidth={grosor} fill="none" />
      <Circle cx={12} cy={12.5} r={3.4} stroke={color} strokeWidth={grosor} fill="none" opacity={0.6} />
      <Path d="M2.6 4.5v4.2a1.6 1.6 0 0 0 3.2 0V4.5M4.2 4.5v15" stroke={color} strokeWidth={grosor} strokeLinecap="round" fill="none" />
      <Path d="M20.4 19.5V4.5c-1.6.6-2.4 2.6-2.4 5.2 0 1.6.8 2.3 2.4 2.3" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function IconoDeCamara({ color, tamano = 24, grosor = 1.8 }: PropsDeIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.3-2h6l1.3 2h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" stroke={color} strokeWidth={grosor} strokeLinejoin="round" fill="none" />
      <Circle cx={12} cy={12.8} r={3.3} stroke={color} strokeWidth={grosor} fill="none" />
    </Svg>
  );
}

export function IconoDeGaleria({ color, tamano = 24, grosor = 1.8 }: PropsDeIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Rect x={4} y={5} width={16} height={14} rx={2} stroke={color} strokeWidth={grosor} fill="none" />
      <Circle cx={9} cy={10} r={1.5} stroke={color} strokeWidth={grosor} fill="none" />
      <Path d="M5 17l4.5-4.5 3 3 2.5-2.5L19 17" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** El tilde de lo registrado, dentro de un círculo lleno. */
export function IconoDeRegistrado({ color, fondo, tamano = 22 }: { readonly color: string; readonly fondo: string; readonly tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={12} r={11} fill={fondo} />
      <Path d="M7 12.5l3.2 3.2L17 9" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** El círculo vacío de una comida sin registro. */
export function IconoSinRegistro({ color, tamano = 20 }: { readonly color: string; readonly tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

export function IconoDeInformacion({ color, tamano = 24 }: { readonly color: string; readonly tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M12 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={7.6} r={1.2} fill={color} />
    </Svg>
  );
}

/** Una flecha hacia un lado: la de «Opción anterior», «Opción siguiente» y las filas que abren algo. */
export function Flecha({ color, hacia, tamano = 22 }: { readonly color: string; readonly hacia: 'izquierda' | 'derecha'; readonly tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Path d={hacia === 'izquierda' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
