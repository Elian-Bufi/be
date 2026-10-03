/**
 * La barra inferior de la APK, como en las apps (Dirección, 2026-10-01): las cinco zonas siempre a la vista mientras hay
 * sesión, en vez de entrar a cada una desde botones en Cuenta.
 * - Cada destino tiene su texto visible, un ícono simple que solo acompaña y 56 dp de alto (el mínimo táctil es 48).
 * - Rol `tab` con su estado `selected`: el lector de pantalla dice cuál está elegida, no solo el color. La elegida
 *   además lleva una marca arriba y el texto en negrita (10-B10 §7: el color nunca es la única señal).
 * - Respeta el área segura de abajo: con Android edge-to-edge, la barra del sistema queda debajo y no la tapa.
 * - Se oculta mientras el teclado está abierto, para que no quede encima del campo que se está escribiendo; al cerrarse
 *   el teclado vuelve.
 * - Tocar una zona abre su pantalla principal (la de `ZONAS`), también desde una subpantalla de esa misma zona.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { ZONAS, type Ruta, type Zona } from './navegacion';
import { COLOR, estilosPorTema } from './tema';

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

export function BarraDeZonas({ actual, ir }: { actual: Zona; ir: (r: Ruta) => void }) {
  const insets = useSafeAreaInsets();
  const tecladoAbierto = useTecladoAbierto();
  if (tecladoAbierto) return null;
  return (
    <View accessibilityRole="tablist" style={[estilos.barra, { paddingBottom: insets.bottom }]}>
      {ZONAS.map((z) => {
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
            <View style={[estilos.marca, elegida && estilos.marcaElegida]} />
            <Icono zona={z.zona} color={elegida ? COLOR.acento : COLOR.tenue} />
            {/* Las etiquetas crecen hasta 1,15 veces: con 1,3 y la letra al máximo, los cinco textos se achicaban hasta
                quedar pegados (prueba de la 0.13.1). Si aun así no entran, se achican un poco en vez de cortarse. El
                ícono acompaña y el lector de pantalla dice el nombre completo. */}
            <Text style={[estilos.texto, elegida && estilos.textoElegido]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} maxFontSizeMultiplier={1.15}>
              {z.texto}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Íconos de trazo, en una grilla de 24: solo acompañan al texto, y el lector de pantalla no los recorre. */
function Icono({ zona, color }: { zona: Zona; color: string }) {
  const trazo = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
      {zona === 'nutricion' ? (
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
      ) : zona === 'informacion' ? (
        // Un formulario sobre su tabla.
        <>
          <Path d="M7.5 4.5h9a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5V6a1.5 1.5 0 0 1 1.5-1.5Z" {...trazo} />
          <Path d="M9.5 3h5v3h-5Z" {...trazo} />
          <Path d="M9 11h6M9 14.5h6M9 18h3.5" {...trazo} />
        </>
      ) : (
        // Una persona: la cabeza y los hombros.
        <>
          <Circle cx={12} cy={8} r={3.8} {...trazo} />
          <Path d="M4.5 20.5c0-4 3.4-6.8 7.5-6.8s7.5 2.8 7.5 6.8" {...trazo} />
        </>
      )}
    </Svg>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  barra: { flexDirection: 'row', backgroundColor: COLOR.superficie, borderTopWidth: 1, borderTopColor: COLOR.borde },
  // Cada destino mide lo que su texto más una parte igual del resto: con anchos iguales, «Entrenamiento» no entraba en
  // un teléfono de 360 dp y había que achicarlo; así los cinco textos van a 12 sp (medido con Roboto en una maqueta).
  destino: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingTop: 7, paddingBottom: 6, paddingHorizontal: 3 },
  presionado: { opacity: 0.7 },
  // La marca de la zona elegida: una barrita arriba del ícono, del color del acento.
  marca: { position: 'absolute', top: 0, left: '50%', marginLeft: -18, width: 36, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: 'transparent' },
  marcaElegida: { backgroundColor: COLOR.acento },
  texto: { fontSize: 12, lineHeight: 16, marginTop: 2, fontWeight: '600', color: COLOR.tenue, textAlign: 'center' },
  textoElegido: { fontWeight: '800', color: COLOR.acento },
}));
