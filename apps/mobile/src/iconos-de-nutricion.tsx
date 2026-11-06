/**
 * Los íconos del registro de comidas (WP-NUTRICION-RECETAS §9). Acompañan a un texto que dice lo mismo: el lector de
 * pantalla no los recorre.
 *
 * Desde PA-06 (2026-11-02) los que tienen par en la familia de BE se dibujan de ahí (`icono.tsx`), con el mismo nombre y
 * la misma firma: la cámara es `camara`, la galería es `imagen`, el círculo vacío es `sin-registro`, la información es
 * `info` y las flechas son `derecha` e `izquierda`. Quedan propios el plato, que es el respaldo de una imagen y lleva una
 * transparencia, y la marca «Registrado», un círculo lleno con la tilde calada: es una marca de estado, no un ícono de la
 * familia (en la familia lo único lleno son puntos), y nunca va en un botón como aprobación.
 */
import Svg, { Circle, Path } from 'react-native-svg';
import { DibujoDeIcono } from './icono';

interface PropsDeIcono {
  readonly color: string;
  readonly tamano?: number;
}

const sinLector = { accessible: false, importantForAccessibility: 'no-hide-descendants' } as const;

/** El respaldo de una imagen que no está o no se pudo mostrar: un plato con cubiertos. */
export function IconoDePlato({ color, tamano = 40, grosor = 1.6 }: PropsDeIcono & { readonly grosor?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={12.5} r={6.2} stroke={color} strokeWidth={grosor} fill="none" />
      <Circle cx={12} cy={12.5} r={3.4} stroke={color} strokeWidth={grosor} fill="none" opacity={0.6} />
      <Path d="M2.6 4.5v4.2a1.6 1.6 0 0 0 3.2 0V4.5M4.2 4.5v15" stroke={color} strokeWidth={grosor} strokeLinecap="round" fill="none" />
      <Path d="M20.4 19.5V4.5c-1.6.6-2.4 2.6-2.4 5.2 0 1.6.8 2.3 2.4 2.3" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function IconoDeCamara({ color, tamano = 24 }: PropsDeIcono) {
  return <DibujoDeIcono nombre="camara" color={color} tamano={tamano} />;
}

export function IconoDeGaleria({ color, tamano = 24 }: PropsDeIcono) {
  return <DibujoDeIcono nombre="imagen" color={color} tamano={tamano} />;
}

/**
 * La marca de lo registrado: la tilde dentro de un círculo lleno. Dice un estado («registrado»), como una casilla
 * marcada; no aprueba ni califica, y no va sola en un botón.
 */
export function IconoDeRegistrado({ color, fondo, tamano = 22 }: { readonly color: string; readonly fondo: string; readonly tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={12} r={11} fill={fondo} />
      <Path d="M7 12.5l3.2 3.2L17 9" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** El círculo vacío de lo que todavía no tiene registro. */
export function IconoSinRegistro({ color, tamano = 20 }: { readonly color: string; readonly tamano?: number }) {
  return <DibujoDeIcono nombre="sin-registro" color={color} tamano={tamano} />;
}

export function IconoDeInformacion({ color, tamano = 24 }: { readonly color: string; readonly tamano?: number }) {
  return <DibujoDeIcono nombre="info" color={color} tamano={tamano} />;
}

/** Una flecha hacia un lado: la de «Opción anterior», «Opción siguiente» y las filas que abren algo. */
export function Flecha({ color, hacia, tamano = 22 }: { readonly color: string; readonly hacia: 'izquierda' | 'derecha'; readonly tamano?: number }) {
  return <DibujoDeIcono nombre={hacia} color={color} tamano={tamano} />;
}
