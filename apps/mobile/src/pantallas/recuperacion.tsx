/**
 * APK · La recuperación de la sesión al abrir la app (WP-ENTRENAMIENTO-SERIES §7.6; referencia
 * `02_carga_y_reintento.png`). Reemplaza a «Verificando tu sesión guardada…» con tres bloques vacíos.
 *
 * - **Mientras comprueba:** la identidad real de BE (el isotipo del repositorio y «BE»; la cabecera dice «Ambiente de
 *   prueba»), «Preparando tu espacio», «Comprobando tu sesión», un indicador de actividad y «Un momento, por favor.». Sin
 *   porcentajes ni mensajes de éxito antes de confirmar. Con movimiento reducido, el indicador queda quieto.
 * - **A los 5 s** (`UMBRAL_DE_DEMORA_MS`): «Está tardando más de lo habitual» y que sigue esperando el mismo pedido,
 *   que puede tardar alrededor de un minuto si el servicio estaba en reposo (`ESPERA_MAXIMA_DE_VERIFICACION_MS`). Sin
 *   «Reintentar»: mientras hay un pedido en curso, otro se le superpondría (precierre del 2026-10-06, §5).
 * - **Si no se pudo comprobar,** la causa con su texto: sin conexión, tiempo agotado, servicio no disponible u otra
 *   respuesta (`causaDeLaFalla`). La credencial sigue guardada: ninguna de esas causas cierra la sesión. Solo la
 *   credencial inválida o vencida lleva a Iniciar sesión (la raíz, con `decidirRecuperacion`).
 *
 * No muestra nada de la cuenta: hasta que la API confirma, no hay contenido protegido.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { useApariencia } from '../apariencia';
import { useMovimientoReducido } from '../estados';
import { IconoDeNubeConAviso } from '../iconos-de-entrenamiento';
import type { CausaDeLaFalla } from '../sesion-persistente';
import { Boton, COLOR, estilosPorTema } from '../ui';

const ISOTIPO = require('../../assets/isotipo.png');

export type FaseDeLaRecuperacion = { readonly tipo: 'comprobando' } | { readonly tipo: 'tardando' } | { readonly tipo: 'sin-verificar'; readonly causa: CausaDeLaFalla };

export const TEXTOS_DE_LA_RECUPERACION = {
  preparando: 'Preparando tu espacio',
  comprobando: 'Comprobando tu sesión',
  unMomento: 'Un momento, por favor.',
  tardando: 'Está tardando más de lo habitual',
  todaviaNo: 'Si el servicio estaba en reposo, puede tardar alrededor de un minuto en responder.',
  seguimosEsperando: 'Seguimos esperando la respuesta: no hace falta que hagas nada.',
  podesReintentar: 'Podés volver a intentarlo sin cerrar la app.',
  siContinua: 'Si continúa, revisá tu conexión.',
  noPudimos: 'No pudimos comprobar tu sesión',
  sigueGuardada: 'Tu sesión sigue guardada en este teléfono: podés volver a intentarlo sin cerrar la app.',
  reintentar: 'Reintentar',
  iniciarDeNuevo: 'Iniciar sesión de nuevo',
} as const;

/** La causa, dicha para la persona. Ninguna es «la sesión no sirve»: esa va a Iniciar sesión con su propio aviso. */
export const TEXTO_DE_LA_CAUSA: Readonly<Record<CausaDeLaFalla, string>> = {
  'sin-conexion': 'Parece que no hay conexión.',
  'tiempo-agotado': 'El servicio no respondió en más de un minuto.',
  'servicio-no-disponible': 'El servicio no está disponible en este momento.',
  otra: 'El servicio no respondió como esperábamos.',
};

export function PantallaDeRecuperacion({ fase, reintentar, iniciarDeNuevo }: { fase: FaseDeLaRecuperacion; reintentar: () => void; iniciarDeNuevo: () => void }) {
  const t = TEXTOS_DE_LA_RECUPERACION;
  if (fase.tipo === 'comprobando') {
    return (
      <View style={estilos.centro}>
        <Emblema />
        <Text style={estilos.titulo} accessibilityRole="header">
          {t.preparando}
        </Text>
        <Text style={estilos.subtitulo}>{t.comprobando}</Text>
        <Indicador />
        <Text style={estilos.nota}>{t.unMomento}</Text>
      </View>
    );
  }
  // Esperar no es fallar: mientras el pedido sigue en curso no se ofrece otro, y el indicador sigue girando.
  if (fase.tipo === 'tardando') {
    return (
      <View style={estilos.centro} accessibilityLiveRegion="polite">
        <Emblema />
        <Text style={estilos.titulo} accessibilityRole="header">
          {t.tardando}
        </Text>
        <Text style={estilos.subtitulo}>{t.todaviaNo}</Text>
        <Indicador />
        <Text style={estilos.nota}>{t.seguimosEsperando}</Text>
      </View>
    );
  }
  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite">
      <View style={estilos.circuloDeLaNube}>
        <IconoDeNubeConAviso color={COLOR.acento} aviso={COLOR.peligroFondo} textoDelAviso={COLOR.peligroTexto} />
      </View>
      <Text style={estilos.titulo} accessibilityRole="header">
        {t.noPudimos}
      </Text>
      <Text style={estilos.subtitulo}>{TEXTO_DE_LA_CAUSA[fase.causa]}</Text>
      <Text style={estilos.nota}>{t.sigueGuardada}</Text>
      <View style={estilos.acciones}>
        <Boton texto={t.reintentar} onPress={reintentar} />
        <Text style={estilos.nota}>{t.siContinua}</Text>
        {/* Una elección de la persona, después de una falla: borra la credencial guardada y va a Iniciar sesión. */}
        <Boton texto={t.iniciarDeNuevo} tipo="secundario" onPress={iniciarDeNuevo} />
      </View>
    </View>
  );
}

/** El isotipo real de BE y «BE» dentro de un aro con un brillo suave y circular (no una placa recortada). */
function Emblema() {
  const { tema } = useApariencia();
  return (
    <View style={estilos.emblema} accessible accessibilityLabel="BE">
      <Svg width={168} height={168} style={estilos.aro} accessible={false} importantForAccessibility="no-hide-descendants">
        <Defs>
          {/* En coordenadas del dibujo (el centro y el radio del aro de 168 dp), sin porcentajes. */}
          <RadialGradient id="brillo-del-emblema" gradientUnits="userSpaceOnUse" cx={84} cy={84} r={84}>
            <Stop offset="0.55" stopColor={COLOR.acento} stopOpacity={tema === 'claro' ? 0.08 : 0.16} />
            <Stop offset="1" stopColor={COLOR.acento} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={84} cy={84} r={84} fill="url(#brillo-del-emblema)" />
        <Circle cx={84} cy={84} r={66} stroke={COLOR.acento} strokeWidth={2} fill="none" />
      </Svg>
      <Image source={ISOTIPO} style={estilos.isotipo} accessible={false} />
      <Text style={estilos.marca} importantForAccessibility="no">
        BE
      </Text>
    </View>
  );
}

/** Un indicador de actividad sin porcentaje: gira; con movimiento reducido, queda quieto. */
function Indicador() {
  const reducido = useMovimientoReducido();
  const giro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducido) return;
    giro.setValue(0);
    const vuelta = Animated.loop(Animated.timing(giro, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }));
    vuelta.start();
    return () => vuelta.stop();
  }, [reducido, giro]);
  const arco = (
    <Svg width={44} height={44} accessible={false} importantForAccessibility="no-hide-descendants">
      <Circle cx={22} cy={22} r={18} stroke={COLOR.borde} strokeWidth={4} fill="none" />
      <Path d="M22 4a18 18 0 0 1 18 18" stroke={COLOR.acento} strokeWidth={4} strokeLinecap="round" fill="none" />
    </Svg>
  );
  return (
    <View style={estilos.indicador} accessible accessibilityRole="progressbar" accessibilityLabel={TEXTOS_DE_LA_RECUPERACION.comprobando}>
      {reducido ? arco : <Animated.View style={{ transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>{arco}</Animated.View>}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  centro: { alignItems: 'center', paddingTop: 32, paddingBottom: 16 },
  emblema: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  aro: { position: 'absolute', left: 0, top: 0 },
  isotipo: { width: 64, height: 64 },
  marca: { fontSize: 26, fontWeight: '800', color: COLOR.texto, letterSpacing: 1, marginTop: 4 },
  titulo: { fontSize: 25, fontWeight: '800', color: COLOR.texto, textAlign: 'center', marginTop: 8 },
  subtitulo: { fontSize: 18, lineHeight: 25, color: COLOR.tenue, textAlign: 'center', marginTop: 8 },
  nota: { fontSize: 15, lineHeight: 22, color: COLOR.tenue, textAlign: 'center', marginTop: 16 },
  indicador: { marginTop: 32, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  circuloDeLaNube: { width: 168, height: 168, borderRadius: 84, backgroundColor: COLOR.superficie, borderWidth: 1, borderColor: COLOR.borde, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  acciones: { alignSelf: 'stretch', marginTop: 16 },
}));
