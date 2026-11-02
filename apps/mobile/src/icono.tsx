/**
 * Los íconos de la familia de BE en la APK (PA-06, 2026-11-02). El dibujo es un dato del dominio
 * (`packages/domain/src/iconos.ts`), el mismo que dibuja el website (`apps/web/src/components/icono.tsx`): cada ícono está
 * escrito una sola vez para los dos productos.
 *
 * - **Se dibuja con elementos** (`Path`, `Circle`, `Rect`, `G`), no con `SvgXml`: los datos ya vienen armados, no se
 *   analiza texto en cada montaje, el nombre lo controla TypeScript y el punto lleno sale entero (con `SvgXml`,
 *   `class="lleno"` se ignora en Android y el punto queda como un aro).
 * - **El color es un token del tema** (`tono`), no un color suelto: `tema.ts` sigue siendo el único lugar donde se escribe
 *   un color, y el ícono cambia con el tema. `Icono` va con `memo`, y por eso lee el contexto de la apariencia: sin eso,
 *   al pasar de Azul noche a Claro se quedaría con el color viejo.
 * - **El lector de pantalla no lo recorre:** lo dice el texto de al lado. Cuando el ícono es todo lo que tiene un botón,
 *   el botón (`BotonDeIcono`) lleva el nombre de lo que hace («Mostrar la contraseña»), no de lo que se ve.
 * - **Tamaños de la guía:** 24 en títulos y botones solos, 20 en filas y botones, 18 en pestañas y enlaces, 15 dentro de
 *   una etiqueta, y 40 para un estado vacío.
 * - Si el dominio compilado es más viejo que este archivo y no trae un nombre, no dibuja nada: la app no se cae.
 */
import { GROSOR_DE_ICONO, ICONOS, LIENZO_DE_ICONO, type FormaDeIcono, type NombreDeIcono } from '@be/domain';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useApariencia } from './contexto-de-apariencia';
import { COLOR, type Paleta } from './tema';

export type { NombreDeIcono } from '@be/domain';

/** Los tamaños de la guía; 40 es el grande, para un estado vacío. */
export type TamanoDeIcono = 15 | 18 | 20 | 24 | 40;

/**
 * Los tokens del tema que ya se usan como color de texto o de trazo sobre las superficies, medidos por
 * `scripts/contraste.test.cjs` (un trazo necesita 3:1; estos pasan 4,5:1).
 */
export type TonoDeIcono = Extract<keyof Paleta, 'acento' | 'texto' | 'tenue' | 'botonTexto' | 'peligroTexto' | 'error' | 'exito' | 'barraTexto' | 'barraElegido'>;

/** El grosor del destino elegido de la barra: la señal de «elegido» que no es solo el color. */
const GROSOR_MARCADO = 2.1;

function Forma({ f, color }: { f: FormaDeIcono; color: string }) {
  switch (f.forma) {
    case 'trazo':
      return <Path d={f.d} strokeDasharray={f.guiones} />;
    case 'circulo':
      // Los puntos son lo único lleno de la familia: van enteros y sin trazo.
      return f.lleno ? <Circle cx={f.cx} cy={f.cy} r={f.r} fill={color} stroke="none" /> : <Circle cx={f.cx} cy={f.cy} r={f.r} strokeDasharray={f.guiones} />;
    case 'rectangulo':
      return <Rect x={f.x} y={f.y} width={f.ancho} height={f.alto} rx={f.radio} />;
    case 'elipse':
      return <Ellipse cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} transform={f.giro} />;
    case 'grupo':
      return (
        <G transform={f.giro}>
          {f.formas.map((hija, i) => (
            <Forma key={i} f={hija} color={color} />
          ))}
        </G>
      );
  }
}

/**
 * El dibujo de un ícono de la familia con un color ya resuelto. Lo usan `Icono` y los íconos propios de la APK que pasaron
 * a la familia sin cambiar su firma (`iconos-de-*.tsx`, la barra): esos reciben el color de quien los dibuja, que lo lee
 * del tema al dibujarse. No va con `memo`: se vuelve a dibujar con quien lo contiene.
 */
export function DibujoDeIcono({ nombre, color, tamano = 20, marcado = false }: { nombre: NombreDeIcono; color: string; tamano?: number; marcado?: boolean }) {
  const definicion = ICONOS[nombre];
  if (!definicion) return null;
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${LIENZO_DE_ICONO} ${LIENZO_DE_ICONO}`}
      fill="none"
      stroke={color}
      strokeWidth={marcado ? GROSOR_MARCADO : GROSOR_DE_ICONO}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {definicion.formas.map((f, i) => (
        <Forma key={i} f={f} color={color} />
      ))}
    </Svg>
  );
}

/**
 * Un ícono de la familia, en un tono del tema. Siempre decorativo: lo dice el texto que lo acompaña. `marcado` engrosa el
 * trazo, solo para lo elegido (el destino de la barra).
 */
export const Icono = memo(function Icono({ nombre, tamano = 20, tono = 'acento', marcado = false }: { nombre: NombreDeIcono; tamano?: TamanoDeIcono; tono?: TonoDeIcono; marcado?: boolean }) {
  // Con `memo`, el cambio de tema solo llega por el contexto: leerlo hace que el ícono se vuelva a dibujar con él.
  useApariencia();
  return <DibujoDeIcono nombre={nombre} color={COLOR[tono]} tamano={tamano} marcado={marcado} />;
});

/**
 * Un botón que es solo un ícono: el nombre accesible dice lo que hace («Quitar la serie 2», «Mostrar la contraseña»), y
 * el área de toque mide 48 dp. El ícono adentro sigue oculto para el lector: lo que se lee es el botón.
 */
export function BotonDeIcono({
  nombre,
  etiqueta,
  onPress,
  tono = 'acento',
  deshabilitado = false,
  seleccionado,
}: {
  nombre: NombreDeIcono;
  etiqueta: string;
  onPress: () => void;
  tono?: TonoDeIcono;
  deshabilitado?: boolean;
  /** Para un botón que alterna (mostrar u ocultar): el lector dice si está activo. */
  seleccionado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado, ...(seleccionado === undefined ? {} : { selected: seleccionado }) }}
      disabled={deshabilitado}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, deshabilitado && { opacity: 0.6 }, pressed && { opacity: 0.6 }]}
    >
      <View pointerEvents="none">
        <Icono nombre={nombre} tamano={24} tono={tono} />
      </View>
    </Pressable>
  );
}
