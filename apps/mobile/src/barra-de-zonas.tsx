/**
 * La barra inferior de la APK (DL-117, decisión de Dirección del 2026-10-04): una cápsula flotante con los cinco destinos
 * siempre a la vista, en este orden: Inicio, Nutrición, Entrenamiento, Evolución e Información.
 * - **Forma.** Una sola cápsula, con los extremos redondeados del todo, márgenes a los costados, un borde fino y un vidrio
 *   ahumado moderado y sin desenfoque (`barraVidrio` en tema.ts). La sombra la separa del contenido.
 * - **El destino elegido** se marca con el ícono en cian, la etiqueta en negrita y cian, y una iluminación suave detrás del
 *   ícono, que es un degradé radial sin borde. No hay puntito, recuadro ni aro, y no hay botón central. El lector de
 *   pantalla dice cuál está elegido (rol `tab`, estado `selected`): el color nunca es la única señal (10-B10 §7).
 * - **Las cinco etiquetas, siempre, y con la letra de la persona** (cierre del 2026-10-04: antes crecían hasta 1,15
 *   veces y después se achicaban). Ninguna se oculta ni se corta. Para que entren, primero se reparte el ancho (cada
 *   destino mide su texto más una parte igual del resto), después la cápsula se acerca a los bordes, y si las cinco no
 *   entran en una fila con al menos el 90 % de su tamaño, **la cápsula pasa a dos filas**: Inicio, Nutrición y
 *   Entrenamiento arriba; Evolución e Información abajo. Es una adaptación excepcional y explícita: la píldora queda
 *   como un rectángulo de esquinas redondeadas. Solo si aun así no entran, la letra baja lo justo
 *   (`disposicion-de-la-barra.ts`; el tamaño efectivo, medido, en EVIDENCIA/INICIO-Y-NAVEGACION).
 * - **La altura sale del contenido**, no de un número fijo. La barra informa la suya (`alMedir`) para que el contenido
 *   deje ese espacio libre al final y nada quede tapado.
 * - Respeta el área segura de abajo: flota por encima de la barra del sistema, con gestos o con botones.
 * - **Un velo detrás** (DL-118): un degradé del color del fondo, desde el final del espacio libre del contenido hasta el
 *   borde de la pantalla, cubre lo que pasa por detrás de la cápsula y de la barra del sistema. Las cifras y los trazos
 *   ya no compiten con los destinos, y el último contenido, al final del desplazamiento, queda entero por encima.
 * - Se oculta mientras el teclado está abierto, para no tapar el campo que se escribe.
 * - Tocar un destino abre su raíz, también desde un detalle de ese mismo destino.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useApariencia } from './apariencia';
import { disposicionDeLaBarra } from './disposicion-de-la-barra';
import { ZONAS, type Ruta, type Zona } from './navegacion';
import { COLOR, estilosPorTema } from './tema';

/** Lo que la cápsula flota por encima del área segura de abajo, en dp. */
export const SEPARACION_DE_LA_BARRA = 10;

/** Si el teclado está abierto. En Android solo existen los eventos «Did»; en iOS, «Will» evita el salto. */
export function useTecladoAbierto(): boolean {
  // Si la barra aparece con el teclado ya abierto (por ejemplo, al iniciar sesión), arranca oculta.
  const [abierto, setAbierto] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const alAbrir = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setAbierto(true));
    const alCerrar = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setAbierto(false));
    return () => {
      alAbrir.remove();
      alCerrar.remove();
    };
  }, []);
  return abierto;
}

export function BarraDeZonas({ actual, ir, alMedir }: { actual: Zona | null; ir: (r: Ruta) => void; alMedir: (alto: number) => void }) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const tecladoAbierto = useTecladoAbierto();
  // Mientras está oculta no ocupa lugar: el contenido recupera ese espacio.
  useEffect(() => {
    if (tecladoAbierto) alMedir(0);
  }, [tecladoAbierto, alMedir]);
  if (tecladoAbierto) return null;
  // Una fila o dos, y el margen: según el ancho del teléfono y la letra de la persona.
  const { filas, margen } = disposicionDeLaBarra({ anchoDePantalla: width, escalaDeLetra: fontScale, zonas: ZONAS.map((z) => z.zona) });
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => alMedir(Math.ceil(e.nativeEvent.layout.height))}
      style={[estilos.capsula, filas.length > 1 && estilos.capsulaEnDosFilas, { left: margen, right: margen, bottom: insets.bottom + SEPARACION_DE_LA_BARRA, backgroundColor: COLOR.barraVidrio }]}
    >
      {filas.map((fila) => (
        <View key={fila.join('-')} style={estilos.fila}>
          {ZONAS.filter((z) => fila.includes(z.zona)).map((z) => {
            const elegida = z.zona === actual;
            return (
              <Pressable
                key={z.zona}
                accessibilityRole="tab"
                accessibilityState={{ selected: elegida }}
                accessibilityLabel={z.texto}
                onPress={() => ir(z.ruta)}
                style={({ pressed }) => [estilos.destino, pressed && estilos.presionado]}
              >
                <View style={estilos.lugarDelIcono}>
                  {elegida ? <Brillo zona={z.zona} /> : null}
                  <IconoDeZona zona={z.zona} color={elegida ? COLOR.barraElegido : COLOR.barraTexto} grosor={elegida ? 2.1 : 1.8} />
                </View>
                {/* Sin tope: crece con la letra. Achicarse es el último recurso, para no cortarse. */}
                <Text style={[estilos.texto, elegida && estilos.textoElegido]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {z.texto}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * El velo detrás de la barra: del color del fondo, transparente arriba y casi opaco abajo. App.tsx lo dibuja antes de la
 * cápsula, desde donde termina el espacio libre del contenido. No recibe toques ni lo recorre el lector de pantalla.
 */
export function VeloDeLaBarra({ alto }: { alto: number }) {
  useApariencia();
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: alto }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="velo-de-la-barra" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR.fondo.slice(0, 7)} stopOpacity={0} />
            <Stop offset="0.4" stopColor={COLOR.fondo.slice(0, 7)} stopOpacity={0.9} />
            <Stop offset="1" stopColor={COLOR.fondo.slice(0, 7)} stopOpacity={0.97} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#velo-de-la-barra)" />
      </Svg>
    </View>
  );
}

/** La iluminación suave detrás del ícono elegido: un degradé radial que se apaga hacia el borde, sin línea. */
function Brillo({ zona }: { zona: Zona }) {
  const { tema } = useApariencia();
  const intensidad = tema === 'claro' ? 0.16 : 0.3;
  const id = `brillo-${zona}`;
  return (
    <Svg width={56} height={40} style={estilos.brillo} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={COLOR.barraElegido} stopOpacity={intensidad} />
          <Stop offset="1" stopColor={COLOR.barraElegido} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={28} cy={20} rx={28} ry={20} fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * Íconos de trazo, en una grilla de 24: solo acompañan al texto, y el lector de pantalla no los recorre. Inicio los usa
 * también en el encabezado de cada tarjeta, para que el módulo se reconozca igual que en la barra.
 */
export function IconoDeZona({ zona, color, grosor }: { zona: Zona; color: string; grosor: number }) {
  const trazo = { stroke: color, strokeWidth: grosor, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
      {zona === 'inicio' ? (
        // Una casa: el techo y el cuerpo con su puerta.
        <>
          <Path d="M3.5 11.2 12 4l8.5 7.2" {...trazo} />
          <Path d="M5.8 9.6V20h12.4V9.6" {...trazo} />
          <Path d="M10 20v-5.2h4V20" {...trazo} />
        </>
      ) : zona === 'nutricion' ? (
        // Una manzana: el cuerpo, el cabo y la hoja.
        <>
          <Path d="M12 8.2c-1.6-1.4-4.4-1.6-6 .2-2 2.2-1.5 6.4.6 9.4 1.5 2.1 3.3 3.1 5.4 2.1 2.1 1 3.9 0 5.4-2.1 2.1-3 2.6-7.2.6-9.4-1.6-1.8-4.4-1.6-6-.2Z" {...trazo} />
          <Path d="M12 8.2c0-2 .6-3.6 1.8-4.7" {...trazo} />
          <Path d="M13.4 5.6c1.6-.9 3.4-.8 4.4.2-1.2 1.2-3 1.4-4.4.6" {...trazo} />
        </>
      ) : zona === 'entrenamiento' ? (
        // Una mancuerna: la barra y dos discos de cada lado.
        <>
          <Path d="M8 12h8" {...trazo} />
          <Path d="M6.5 7.5v9M17.5 7.5v9" {...trazo} />
          <Path d="M3.5 9.5v5M20.5 9.5v5" {...trazo} />
        </>
      ) : zona === 'evolucion' ? (
        // Una cinta métrica: la regla con sus marcas.
        <>
          <Path d="M3 8.5h18v7H3Z" {...trazo} />
          <Path d="M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v2" {...trazo} />
        </>
      ) : (
        // Un formulario sobre su tabla.
        <>
          <Path d="M7.5 4.5h9a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5V6a1.5 1.5 0 0 1 1.5-1.5Z" {...trazo} />
          <Path d="M9.5 3h5v3h-5Z" {...trazo} />
          <Path d="M9 11h6M9 14.5h6M9 18h3.5" {...trazo} />
        </>
      )}
    </Svg>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  capsula: {
    position: 'absolute',
    paddingHorizontal: 3,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.barraBorde,
    shadowColor: COLOR.sombra,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  // Dos filas: la píldora pasa a un rectángulo de esquinas redondeadas, con la misma separación del borde.
  capsulaEnDosFilas: { borderRadius: 28, paddingVertical: 6, rowGap: 2 },
  fila: { flexDirection: 'row' },
  // Cada destino mide lo que su texto más una parte igual del resto: con anchos iguales, «Entrenamiento» no entraba. Los
  // 2 dp a cada lado separan dos etiquetas vecinas cuando la letra es grande y la barra va justa.
  destino: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 2, borderRadius: 999 },
  presionado: { opacity: 0.7 },
  // El lugar del ícono es más angosto que el destino más chico (48): el brillo lo desborda apenas, ya transparente.
  lugarDelIcono: { width: 40, height: 28, alignItems: 'center', justifyContent: 'center' },
  brillo: { position: 'absolute', left: -8, top: -6 },
  // Medio y negrita (500 y 700): la diferencia se ve, y las cinco etiquetas ocupan menos que con 600 y 800.
  texto: { fontSize: 12, lineHeight: 16, marginTop: 1, fontWeight: '500', color: COLOR.barraTexto, textAlign: 'center' },
  textoElegido: { fontWeight: '700', color: COLOR.barraElegido },
}));
