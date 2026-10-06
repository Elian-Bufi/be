/**
 * El menú auxiliar (DL-117, decisión de Dirección del 2026-10-04): funciones que ya existen y no tienen lugar en la barra.
 * Se abre desde la cabecera, en una raíz. No repite los destinos de la barra ni lo que está en Cuenta (privacidad,
 * seguridad, apariencia, identificador), y no tiene opciones sin destino. Cada opción sigue también donde estaba:
 * - Vínculos, en Cuenta;
 * - Tu historial de entrenamiento, en Entrenamiento de hoy;
 * - Registros nutricionales, en Nutrición.
 *
 * Es un `Modal`: el botón «atrás» de Android lo cierra antes de navegar, y tocar fuera de él también. Lo que se abre
 * desde acá vuelve a la raíz donde se abrió el menú (`navegar`, en navegacion.ts).
 */
import Constants from 'expo-constants';
import { Modal, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Ruta } from './navegacion';
import { COLOR, estilosPorTema } from './tema';

/** Las opciones del menú, en orden. Exportadas para la prueba: ninguna repite un destino de la barra. */
export const OPCIONES_DEL_MENU: readonly { readonly texto: string; readonly detalle: string; readonly ruta: Ruta }[] = [
  { texto: 'Vínculos', detalle: 'Tus profesionales y sus solicitudes', ruta: { nombre: 'vinculos' } },
  { texto: 'Tu historial de entrenamiento', detalle: 'Tus planes y las sesiones de los últimos 90 días', ruta: { nombre: 'historial-de-entrenamiento' } },
  { texto: 'Registros nutricionales', detalle: 'Todas las comidas que registraste', ruta: { nombre: 'registros-nutricionales' } },
];

export function MenuAuxiliar({ visible, cerrar, elegir }: { visible: boolean; cerrar: () => void; elegir: (ruta: Ruta) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar} statusBarTranslucent>
      <View style={estilos.fondo}>
        <View style={estilos.panel} accessibilityViewIsModal>
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              Menú
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar el menú" onPress={cerrar} style={({ pressed }) => [estilos.cerrar, pressed && estilos.presionado]}>
              <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
                <Path d="M6 6l12 12M18 6L6 18" stroke={COLOR.texto} strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
            </Pressable>
          </View>
          {OPCIONES_DEL_MENU.map((o) => (
            <Pressable
              key={o.ruta.nombre}
              accessibilityRole="button"
              accessibilityLabel={`${o.texto}. ${o.detalle}`}
              onPress={() => elegir(o.ruta)}
              style={({ pressed }) => [estilos.opcion, pressed && estilos.presionado]}
            >
              <View style={estilos.textos}>
                <Text style={estilos.textoOpcion}>{o.texto}</Text>
                <Text style={estilos.detalle}>{o.detalle}</Text>
              </View>
              <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
                <Path d="M9 5l7 7-7 7" stroke={COLOR.tenue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </Pressable>
          ))}
        </View>
        {/* Tocar fuera del panel lo cierra; el lector de pantalla usa «Cerrar el menú» o el botón atrás. */}
        <Pressable style={estilos.afuera} onPress={cerrar} accessible={false} importantForAccessibility="no" />
      </View>
    </Modal>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  fondo: { flex: 1, flexDirection: 'row', backgroundColor: COLOR.velo },
  panel: {
    width: '84%',
    maxWidth: 340,
    backgroundColor: COLOR.superficie,
    paddingTop: Constants.statusBarHeight + 8,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: COLOR.borde,
    shadowColor: COLOR.sombra,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 12,
  },
  afuera: { flex: 1 },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, marginBottom: 8 },
  titulo: { fontSize: 20, fontWeight: '800', color: COLOR.texto },
  cerrar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  presionado: { opacity: 0.6 },
  opcion: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, gap: 8 },
  textos: { flex: 1 },
  textoOpcion: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  detalle: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, marginTop: 2 },
}));
