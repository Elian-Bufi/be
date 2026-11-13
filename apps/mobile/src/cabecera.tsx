/**
 * La cabecera única de la APK (DL-117, decisión de Dirección del 2026-10-04), la misma en todas las pantallas. Desde
 * DL-166 (PV-1, 2026-11-07) queda con la marca y Novedades: el menú auxiliar y el avatar se fueron a Perfil. Desde DL-170
 * (WP-APP-VUELTA-2 AV2-05, con AV2-D7 y AV2-D8) es transparente sobre el fondo de la app, sin la línea de abajo, y la fila
 * mide 48 dp:
 * - **a la izquierda**, en las cinco raíces, el logo redondo con su brillo y sin el texto «BE»: es accesible y el lector
 *   dice «BE» una vez; en un detalle, «Volver»; nada al centro;
 * - **a la derecha**, la campana de las novedades (DL-133) con un punto de 8 dp en el acento mientras haya algo sin leer,
 *   sin número ni animación. El número sigue en su nombre para el lector: «Novedades, 47 sin leer»;
 * - **debajo**, la línea fina del aviso de prueba, en `tenue` (08 §33), y la línea de actualización. Desde UF-08 de
 *   WP-USO-FINAL (DL-169) esa línea sale del ambiente: va solo en las builds que muestran los avisos de prueba
 *   (`ambiente.ts`), con el texto del dominio. Sin ella no queda lugar reservado: la fila de la marca cierra la cabecera.
 *
 * - **Responde al desplazamiento** (AV2-T26, con la vuelta de Dirección a la 0.25): arriba de todo es transparente; con
 *   contenido detrás toma un fondo tenue con su línea (`capaDeLaCabecera`), en un fundido corto, y debajo de la línea el
 *   contenido se desvanece (`DesvanecidoDeLaCabecera`, en App.tsx) en lugar de cortarse de golpe. La capa es una vista
 *   aparte, debajo de la fila, y solo cambia su opacidad: la cabecera no se vuelve a dibujar.
 *
 * Volver no depende del botón ni de un gesto del sistema (10-B10 §9). El botón dice adónde vuelve al lector de pantalla
 * («Volver a Inicio») y a la vista muestra «Volver», que está contenido en ese nombre (WCAG 2.5.3).
 * Los textos crecen con la letra hasta 1,15 veces: la cabecera queda compacta, y el contenido de cada pantalla crece sin
 * tope (prueba de la 0.13.1).
 */
import { AVISOS_DE_PRUEBA } from '@be/domain';
import Constants from 'expo-constants';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { AVISOS_DE_PRUEBA_VISIBLES } from './ambiente';
import { useApariencia } from './apariencia';
import { Icono } from './icono';
import { LineaDeActualizacion } from './estados';
import { textoDeVolverA, type Ruta } from './navegacion';
import { ALTO_DEL_DESVANECIDO, capaDeLaCabecera, desvanecidoDeLaCabecera } from './receta-de-vidrio';
import { COLOR, estilosPorTema, PALETAS } from './tema';

const ISOTIPO = require('../assets/isotipo.png');

export function Cabecera({
  volverA,
  conLogo,
  conSesion,
  actualizando,
  volver,
  sinLeer = null,
  abrirNovedades,
  cubierta,
  altoContraste = false,
}: {
  /** Adónde vuelve el botón de volver. `null`: la pantalla no lo lleva (una raíz, Bienvenida). */
  volverA: Ruta | null;
  /** En las cinco raíces de la barra, el logo a la izquierda (AV2-D8). */
  conLogo: boolean;
  /** Con sesión verificada, la campana de Novedades. */
  conSesion: boolean;
  actualizando: boolean;
  volver: () => void;
  /** Las novedades sin leer (DL-133); `null` mientras no se sabe. Es un dato, no una alerta: un punto, sin número. */
  sinLeer?: number | null;
  abrirNovedades?: () => void;
  /** De 0 a 1: si hay contenido detrás (AV2-T26). Lo mueve App.tsx al desplazar. */
  cubierta?: Animated.Value;
  altoContraste?: boolean;
}) {
  const { tema } = useApariencia();
  return (
    <View style={estilos.cabecera}>
      {cubierta ? (
        <Animated.View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={[estilos.capa, capaDeLaCabecera(PALETAS[tema], altoContraste), { opacity: cubierta }]} />
      ) : null}
      <View style={estilos.fila}>
        <View style={[estilos.lado, estilos.izquierda]}>
          {volverA ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={textoDeVolverA(volverA)}
              onPress={volver}
              hitSlop={4}
              style={({ pressed }) => [estilos.volver, pressed && estilos.presionado]}
            >
              <Icono nombre="izquierda" tamano={24} tono="acento" />
              <Text style={estilos.textoVolver} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                Volver
              </Text>
            </Pressable>
          ) : conLogo ? (
            <Logo />
          ) : null}
        </View>
        <View style={[estilos.lado, estilos.derecha]}>
          {conSesion && abrirNovedades ? (
            <Pressable accessibilityRole="button" accessibilityLabel={sinLeer ? `Novedades, ${sinLeer} sin leer` : 'Novedades'} onPress={abrirNovedades} style={({ pressed }) => [estilos.botonRedondo, pressed && estilos.presionado]}>
              <Icono nombre="novedades" tamano={24} tono="texto" />
              {sinLeer ? <View style={estilos.punto} accessible={false} importantForAccessibility="no-hide-descendants" /> : null}
            </Pressable>
          ) : null}
        </View>
      </View>
      {AVISOS_DE_PRUEBA_VISIBLES ? (
        <Text style={estilos.ambiente} numberOfLines={2} maxFontSizeMultiplier={1.15}>
          {AVISOS_DE_PRUEBA.franja}
        </Text>
      ) : null}
      <LineaDeActualizacion activa={actualizando} />
    </View>
  );
}

/**
 * El desvanecido debajo de la cabecera (AV2-T26): el contenido se apaga al pasar por debajo de la línea, en lugar de
 * cortarse de golpe. Va encima del desplazamiento, sin toques ni lector, y se ve solo con contenido detrás. Con el alto
 * contraste no se dibuja: el contenido se corta en la línea.
 */
export function DesvanecidoDeLaCabecera({ cubierta, altoContraste }: { cubierta: Animated.Value; altoContraste: boolean }) {
  const { tema } = useApariencia();
  const degrade = desvanecidoDeLaCabecera(PALETAS[tema], altoContraste);
  if (!degrade) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[estilos.desvanecido, { experimental_backgroundImage: degrade, opacity: cubierta }]}
    />
  );
}

/**
 * El logo redondo de BE con un brillo suave detrás, sin el texto «BE» a la vista. Es accesible con el nombre «BE»: el
 * lector lo dice una vez, y el brillo y el dibujo no se recorren.
 */
function Logo() {
  const { tema } = useApariencia();
  return (
    <View style={estilos.logo} accessible accessibilityLabel="BE">
      <Svg width={48} height={48} style={estilos.brillo} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Defs>
          <RadialGradient id="brillo-del-logo" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={COLOR.acento} stopOpacity={tema === 'claro' ? 0.14 : 0.28} />
            <Stop offset="1" stopColor={COLOR.acento} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={24} cy={24} rx={24} ry={24} fill="url(#brillo-del-logo)" />
      </Svg>
      <Image source={ISOTIPO} style={estilos.isotipo} accessible={false} />
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // Transparente sobre el fondo de la app, sin línea abajo (DL-170).
  cabecera: { paddingTop: Constants.statusBarHeight + 2 },
  fila: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 6 },
  lado: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  izquierda: { justifyContent: 'flex-start' },
  derecha: { justifyContent: 'flex-end' },
  presionado: { opacity: 0.6 },
  botonRedondo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  volver: { flexDirection: 'row', alignItems: 'center', minHeight: 48, minWidth: 48, paddingLeft: 6, paddingRight: 10 },
  textoVolver: { fontSize: 15, fontWeight: '700', color: COLOR.acento, marginLeft: 2 },
  // El logo ocupa todo su brillo: así el brillo no depende de que Android dibuje fuera de una vista.
  logo: { width: 48, height: 48, marginLeft: 4, alignItems: 'center', justifyContent: 'center' },
  brillo: { position: 'absolute', left: 0, top: 0 },
  isotipo: { width: 30, height: 30 },
  // El punto de lo sin leer: 8 dp en el acento, arriba a la derecha de la campana, sin número ni animación (AV2-D7).
  punto: { position: 'absolute', top: 11, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.acento },
  // La capa de la cabecera con contenido detrás y el desvanecido de abajo (AV2-T26).
  capa: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  desvanecido: { position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_DEL_DESVANECIDO },
  ambiente: { fontSize: 12, lineHeight: 15, color: COLOR.tenue, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 6 },
}));
