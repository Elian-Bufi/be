/**
 * La cabecera única de la APK (DL-117, decisión de Dirección del 2026-10-04), la misma en todas las pantallas:
 * - **a la izquierda**, volver en un detalle; en una raíz, nada;
 * - **al centro**, la marca: el isotipo y «BE», con un brillo contenido detrás;
 * - **a la derecha**, la campana de las novedades, con cuántas hay sin leer (DL-133).
 * Desde DL-166 (PV-1, 2026-11-07) la cabecera queda con la marca y Novedades: el menú auxiliar y el avatar se fueron, y lo
 * que abrían está en Perfil, el quinto destino de la barra;
 * - **debajo**, la franja con el aviso de prueba (08 §33) y la línea de actualización. Desde UF-08 de WP-USO-FINAL
 *   (DL-169) la franja sale del ambiente: va solo en las builds que muestran los avisos de prueba (`ambiente.ts`), con el
 *   texto del dominio. Sin ella no queda lugar reservado: la fila de la marca cierra la cabecera.
 *
 * Volver no depende del botón ni de un gesto del sistema (10-B10 §9). El botón dice adónde vuelve al lector de pantalla
 * («Volver a Inicio») y a la vista muestra «Volver», que está contenido en ese nombre (WCAG 2.5.3).
 * Los textos crecen con la letra hasta 1,15 veces: la cabecera queda compacta, y el contenido de cada pantalla crece sin
 * tope (prueba de la 0.13.1).
 */
import { AVISOS_DE_PRUEBA } from '@be/domain';
import Constants from 'expo-constants';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { AVISOS_DE_PRUEBA_VISIBLES } from './ambiente';
import { useApariencia } from './apariencia';
import { Icono } from './icono';
import { LineaDeActualizacion } from './estados';
import { textoDeVolverA, type Ruta } from './navegacion';
import { COLOR, estilosPorTema } from './tema';

const ISOTIPO = require('../assets/isotipo.png');

export function Cabecera({
  volverA,
  conSesion,
  actualizando,
  volver,
  sinLeer = null,
  abrirNovedades,
}: {
  /** Adónde vuelve el botón de volver. `null`: la pantalla no lo lleva (una raíz, Bienvenida). */
  volverA: Ruta | null;
  /** Con sesión verificada, la campana de Novedades. */
  conSesion: boolean;
  actualizando: boolean;
  volver: () => void;
  /** Las novedades sin leer (DL-133); `null` mientras no se sabe. El número es un dato, no una alerta. */
  sinLeer?: number | null;
  abrirNovedades?: () => void;
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
              <Icono nombre="izquierda" tamano={24} tono="acento" />
              <Text style={estilos.textoVolver} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                Volver
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Marca />
        <View style={[estilos.lado, estilos.derecha]}>
          {conSesion && abrirNovedades ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sinLeer ? `Novedades, ${sinLeer} sin leer` : 'Novedades'}
              onPress={abrirNovedades}
              style={({ pressed }) => [estilos.botonRedondo, pressed && estilos.presionado]}
            >
              <Icono nombre="novedades" tamano={24} tono="texto" />
              {sinLeer ? (
                <View style={estilos.cuenta} accessible={false} importantForAccessibility="no-hide-descendants">
                  <Text style={estilos.textoCuenta} maxFontSizeMultiplier={1.15}>
                    {sinLeer > 99 ? '99+' : sinLeer}
                  </Text>
                </View>
              ) : null}
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
  // La marca ocupa todo su brillo: así el brillo no depende de que Android dibuje fuera de una vista.
  marca: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 132, minHeight: 44 },
  brillo: { position: 'absolute', left: 0, top: 0 },
  isotipo: { width: 26, height: 26, marginRight: 6 },
  textoMarca: { fontSize: 20, fontWeight: '800', color: COLOR.texto, letterSpacing: 1 },
  // El número sin leer: un dato con el color del acento, sin animación (UC-P30: no es una alerta clínica).
  cuenta: { position: 'absolute', top: 6, right: 4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.fondo, borderWidth: 1, borderColor: COLOR.acento },
  textoCuenta: { fontSize: 11, fontWeight: '700', color: COLOR.acento },
  ambiente: { fontSize: 12, lineHeight: 15, color: COLOR.tenue, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 6 },
}));
