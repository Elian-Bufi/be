/**
 * El fondo de la app (WP-APP-VUELTA-2 AV2-03, DL-170): un degradé con dos destellos de luz, quietos, debajo de todo.
 *
 * - Es el primer hijo de la raíz (App.tsx), absoluto y fuera del desplazamiento: al desplazar, el contenido pasa por
 *   encima y el fondo no se vuelve a dibujar.
 * - No recibe toques (`pointerEvents="none"`) y el lector de pantalla no lo recorre, como el velo de la barra.
 * - Lo dibuja Android con `experimental_backgroundImage`, desde los tokens (`recetaDelFondo`): sin SVG ni mapa de bits,
 *   que a pantalla completa costarían unos 10 MB (AV2-T1).
 * - Sus medidas salen de la ventana, nunca en porcentajes: al abrir el teclado no cambia de tamaño ni salta.
 * - Con el «Texto de alto contraste» no dibuja nada, y la raíz pinta `fondo` liso.
 * - **El grano de Azul noche** (AV2-T23, con la vuelta de Dirección a la 0.25): una imagen chica en mosaico encima de las
 *   luces, píxel a píxel (`mosaicoDelGrano`). Suma una pasada sobre la pantalla; a cambio, el fondo ya no pinta `fondo`
 *   liso debajo del degradé, que es opaco y se vio en el teléfono con la 0.25 (el plan B de §3.2 ya no hace falta): la
 *   cantidad de pasadas queda igual que en la muestra.
 */
import { useContext } from 'react';
import { Dimensions, Image, PixelRatio, useWindowDimensions, View } from 'react-native';
import { useApariencia } from './contexto-de-apariencia';
import { mosaicoDelGrano, recetaDelFondo } from './receta-de-vidrio';
import { estilosPorTema, PALETAS } from './tema';
import { NivelDeVidrio } from './vidrio';

const GRANO = require('../assets/grano.png');

export function FondoDeLaApp() {
  const { width, height } = useWindowDimensions();
  const { tema } = useApariencia();
  const { altoContraste } = useContext(NivelDeVidrio);
  if (altoContraste) return null;
  // La ventana puede no contar la barra del sistema: el fondo cubre la pantalla entera.
  const alto = Math.max(height, Dimensions.get('screen').height);
  const grano = mosaicoDelGrano(PALETAS[tema], width, alto, PixelRatio.get());
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[estilos.fondo, { width, height: alto, experimental_backgroundImage: recetaDelFondo(PALETAS[tema], tema, width, alto) }]}
    >
      {grano?.piezas.map((p) => (
        <Image key={`${p.left}-${p.top}`} source={GRANO} fadeDuration={0} style={[estilos.grano, { left: p.left, top: p.top, width: grano.lado, height: grano.lado }]} />
      ))}
    </View>
  );
}

const estilos = estilosPorTema(() => ({
  fondo: { position: 'absolute', top: 0, left: 0 },
  grano: { position: 'absolute' },
}));
