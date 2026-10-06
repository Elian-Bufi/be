/**
 * Los íconos de la sesión de entrenamiento (WP-ENTRENAMIENTO-SERIES §7), dibujados con trazos como los de la barra y la
 * cabecera. La mancuerna es la misma del destino Entrenamiento de la barra (`IconoDeZona`): son los íconos de la app, no
 * los de las láminas de referencia. Acompañan a un texto que dice lo mismo: el lector de pantalla no los recorre.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface PropsDeIcono {
  readonly color: string;
  readonly tamano?: number;
  readonly grosor?: number;
}

const sinLector = { accessible: false, importantForAccessibility: 'no-hide-descendants' } as const;
const trazo = (color: string, grosor: number) => ({ stroke: color, strokeWidth: grosor, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }) as const;

/** La mancuerna del destino Entrenamiento: el respaldo de un ejercicio sin imagen. */
export function IconoDeEjercicio({ color, tamano = 40, grosor = 1.6 }: PropsDeIcono) {
  const t = trazo(color, grosor);
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Path d="M8 12h8" {...t} />
      <Path d="M6.5 7.5v9M17.5 7.5v9" {...t} />
      <Path d="M3.5 9.5v5M20.5 9.5v5" {...t} />
    </Svg>
  );
}

/** Un cronómetro: el temporizador de la sesión, el descanso y «Cronometrar serie». */
export function IconoDeCronometro({ color, tamano = 22, grosor = 1.8 }: PropsDeIcono) {
  const t = trazo(color, grosor);
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={13.5} r={7.5} {...t} />
      <Path d="M12 13.5V9.6M10 2.8h4M12 2.8v3.2M18.2 6.6l1.4-1.4" {...t} />
    </Svg>
  );
}

/** Una lista: «Ver rutina». */
export function IconoDeRutina({ color, tamano = 22, grosor = 1.8 }: PropsDeIcono) {
  const t = trazo(color, grosor);
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Path d="M9 6.5h11M9 12h11M9 17.5h11" {...t} />
      <Circle cx={4.6} cy={6.5} r={1.1} fill={color} />
      <Circle cx={4.6} cy={12} r={1.1} fill={color} />
      <Circle cx={4.6} cy={17.5} r={1.1} fill={color} />
    </Svg>
  );
}

/** Una hoja con renglones: la banda «Plan de la serie N». */
export function IconoDePlan({ color, tamano = 24, grosor = 1.7 }: PropsDeIcono) {
  const t = trazo(color, grosor);
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Rect x={5} y={3.5} width={14} height={17} rx={2} {...t} />
      <Path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" {...t} />
    </Svg>
  );
}

/** Una nube: lo que está guardado en el teléfono y todavía falta enviar. */
export function IconoDeNube({ color, tamano = 20, grosor = 1.7 }: PropsDeIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Path d="M7.2 18.5h10a4 4 0 0 0 .6-7.95A5.6 5.6 0 0 0 7 9.3a4.6 4.6 0 0 0 .2 9.2Z" {...trazo(color, grosor)} />
    </Svg>
  );
}

/**
 * La nube con un aviso: la comprobación de la sesión está tardando (referencia 02). El aviso va en el color de las
 * acciones destructivas, con su texto, que es un par medido por la prueba de contraste.
 */
export function IconoDeNubeConAviso({ color, aviso, textoDelAviso, tamano = 96 }: { readonly color: string; readonly aviso: string; readonly textoDelAviso: string; readonly tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 48 48" {...sinLector}>
      <Path d="M14 35h19.5a7.6 7.6 0 0 0 1.1-15.1A10.6 10.6 0 0 0 14.2 17.4 8.8 8.8 0 0 0 14 35Z" {...trazo(color, 2.4)} />
      <Circle cx={35} cy={34} r={7.5} fill={aviso} />
      <Path d="M35 30v4.6" stroke={textoDelAviso} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={35} cy={38} r={1.4} fill={textoDelAviso} />
    </Svg>
  );
}
