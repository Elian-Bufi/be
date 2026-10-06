/**
 * La cabecera única de la APK (DL-117, decisión de Dirección del 2026-10-04), la misma en todas las pantallas:
 * - **a la izquierda**, volver en un detalle, que tiene prioridad; el menú auxiliar en una raíz con sesión; o nada;
 * - **al centro**, la marca: el isotipo y «BE», con un brillo contenido detrás;
 * - **a la derecha**, el avatar, que abre Cuenta. Es un ícono neutro de persona: el perfil no tiene nombre ni foto
 *   (`MeResponse.profile` es `{}`, DL-009), y no se deriva uno del correo ni de un identificador (D-2);
 * - **debajo**, la franja del ambiente de prueba, siempre a la vista (08 §33), y la línea de actualización.
 *
 * Volver no depende del botón ni de un gesto del sistema (10-B10 §9). El botón dice adónde vuelve al lector de pantalla
 * («Volver a Inicio») y a la vista muestra «Volver», que está contenido en ese nombre (WCAG 2.5.3).
 * Los textos crecen con la letra hasta 1,15 veces: la cabecera queda compacta, y el contenido de cada pantalla crece sin
 * tope (prueba de la 0.13.1).
 */
import Constants from 'expo-constants';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { useApariencia } from './apariencia';
import { LineaDeActualizacion } from './estados';
import { textoDeVolverA, type Ruta } from './navegacion';
import { COLOR, estilosPorTema } from './tema';

const ISOTIPO = require('../assets/isotipo.png');

export function Cabecera({
  volverA,
  conMenu,
  conAvatar,
  actualizando,
  volver,
  abrirMenu,
  abrirCuenta,
}: {
  /** Adónde vuelve el botón de volver. `null`: la pantalla no lo lleva (una raíz, Bienvenida). */
  volverA: Ruta | null;
  conMenu: boolean;
  conAvatar: boolean;
  actualizando: boolean;
  volver: () => void;
  abrirMenu: () => void;
  abrirCuenta: () => void;
}) {
  return (
    <View style={estilos.cabecera}>
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
              <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
                <Path d="M15 5l-7 7 7 7" stroke={COLOR.acento} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
              <Text style={estilos.textoVolver} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                Volver
              </Text>
            </Pressable>
          ) : conMenu ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir el menú" onPress={abrirMenu} style={({ pressed }) => [estilos.botonRedondo, pressed && estilos.presionado]}>
              <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
                <Path d="M4 7h16M4 12h16M4 17h16" stroke={COLOR.texto} strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
            </Pressable>
          ) : null}
        </View>
        <Marca />
        <View style={[estilos.lado, estilos.derecha]}>
          {conAvatar ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Cuenta" onPress={abrirCuenta} style={({ pressed }) => [estilos.botonRedondo, pressed && estilos.presionado]}>
              <View style={estilos.avatar}>
                <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
                  <Circle cx={12} cy={8.5} r={3.8} stroke={COLOR.texto} strokeWidth={1.8} fill="none" />
                  <Path d="M4.8 20c0-3.9 3.2-6.6 7.2-6.6s7.2 2.7 7.2 6.6" stroke={COLOR.texto} strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
      <Text style={estilos.ambiente} numberOfLines={2} maxFontSizeMultiplier={1.15}>
        Ambiente de prueba · solo datos sintéticos
      </Text>
      <LineaDeActualizacion activa={actualizando} />
    </View>
  );
}

/** El isotipo y «BE», con un brillo suave detrás que no sale de la cabecera. El isotipo es decorativo: la marca la dice el texto. */
function Marca() {
  const { tema } = useApariencia();
  return (
    <View style={estilos.marca}>
      <Svg width={132} height={44} style={estilos.brillo} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Defs>
          <RadialGradient id="brillo-de-la-marca" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={COLOR.acento} stopOpacity={tema === 'claro' ? 0.1 : 0.2} />
            <Stop offset="1" stopColor={COLOR.acento} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={66} cy={22} rx={66} ry={22} fill="url(#brillo-de-la-marca)" />
      </Svg>
      <Image source={ISOTIPO} style={estilos.isotipo} accessible={false} />
      <Text style={estilos.textoMarca} accessibilityLabel="BE" maxFontSizeMultiplier={1.15}>
        BE
      </Text>
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  cabecera: { paddingTop: Constants.statusBarHeight + 2, backgroundColor: COLOR.fondo, borderBottomWidth: 1, borderBottomColor: COLOR.borde },
  // Los dos lados miden lo mismo, así la marca queda en el centro aunque solo haya algo de un lado.
  fila: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 6 },
  lado: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  izquierda: { justifyContent: 'flex-start' },
  derecha: { justifyContent: 'flex-end' },
  presionado: { opacity: 0.6 },
  botonRedondo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  volver: { flexDirection: 'row', alignItems: 'center', minHeight: 48, minWidth: 48, paddingLeft: 6, paddingRight: 10 },
  textoVolver: { fontSize: 15, fontWeight: '700', color: COLOR.acento, marginLeft: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.superficieElevada, borderWidth: 1, borderColor: COLOR.bordeControl },
  // La marca ocupa todo su brillo: así el brillo no depende de que Android dibuje fuera de una vista.
  marca: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 132, minHeight: 44 },
  brillo: { position: 'absolute', left: 0, top: 0 },
  isotipo: { width: 26, height: 26, marginRight: 6 },
  textoMarca: { fontSize: 20, fontWeight: '800', color: COLOR.texto, letterSpacing: 1 },
  ambiente: { fontSize: 12, lineHeight: 15, color: COLOR.tenue, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 6 },
}));
