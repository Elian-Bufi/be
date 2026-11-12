/**
 * La barra inferior de la APK (DL-117, decisión de Dirección del 2026-10-04): una cápsula flotante con los cinco destinos
 * siempre a la vista, en este orden: Inicio, Nutrición, Entrenamiento, Evolución y Perfil (desde DL-166, Perfil reemplaza a
 * «Información»).
 * - **Forma.** Una sola cápsula, con los extremos redondeados del todo, márgenes a los costados y un vidrio ahumado al
 *   88 %, sin desenfoque (`barraVidrio` en tema.ts). Desde DL-170 lleva la receta de vidrio: el borde de luz, la línea de
 *   luz por dentro y una sombra con `boxShadow`, sin `elevation` (que a través del vidrio se vería como una mancha).
 * - **El destino elegido** se marca con el ícono en cian, la etiqueta en negrita y cian, y una iluminación suave detrás del
 *   ícono, que es un degradé radial sin borde. No hay puntito, recuadro ni aro, y no hay botón central. El lector de
 *   pantalla dice cuál está elegido (rol `tab`, estado `selected`): el color nunca es la única señal (10-B10 §7).
 * - **Las cinco etiquetas, siempre, y con la letra de la persona** (cierre del 2026-10-04: antes crecían hasta 1,15
 *   veces y después se achicaban). Ninguna se oculta ni se corta. Para que entren, primero se reparte el ancho (cada
 *   destino mide su texto más una parte igual del resto), después la cápsula se acerca a los bordes, y si las cinco no
 *   entran en una fila con su tamaño entero (DL-166), **la cápsula pasa a dos filas**: Inicio, Nutrición y
 *   Entrenamiento arriba; Evolución y Perfil abajo. Es una adaptación excepcional y explícita: la píldora queda
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
 * - **Una sesión de entrenamiento en curso** (PA-02, 2026-11-02): la barra ya no se oculta en la sesión, y Entrenamiento
 *   lleva una marca chica junto al ícono mientras hay una corrida abierta en el teléfono. El lector de pantalla lo dice
 *   en el nombre del destino: la marca no es la única señal.
 * - **La marca de Perfil** (PV-6, DL-166): un punto sin número mientras haya algo para responder. El lector dice
 *   «Perfil, hay algo para responder»; sin nada pendiente, no dice nada de más.
 * - **Fija durante la sesión** (PV-11, DL-166): en la sesión de entrenamiento la barra deja de flotar. Va pegada abajo,
 *   opaca y de lado a lado, con la fila fija de acciones de la sesión apilada encima (App.tsx). Nada se ve a través de
 *   ella. Con letra grande pasa a dos filas igual que la cápsula (PV-13).
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useApariencia } from './apariencia';
import { DibujoDeIcono, type NombreDeIcono, type TamanoDeIcono } from './icono';
import { disposicionDeLaBarra, tokenDelFondoDeLaBarra } from './disposicion-de-la-barra';
import { sombrasDeLaBarra } from './receta-de-vidrio';
import { ZONAS, type Ruta, type Zona } from './navegacion';
import { TEXTOS_DE_LA_SESION } from './textos-de-la-sesion';
import { TEXTOS_DE_LA_VUELTA } from './textos-de-la-vuelta';
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

export function BarraDeZonas({
  actual,
  ir,
  alMedir,
  oculta = false,
  entrenamientoEnCurso = false,
  marcaEnPerfil = false,
  fija = false,
}: {
  actual: Zona | null;
  ir: (r: Ruta) => void;
  alMedir: (alto: number) => void;
  oculta?: boolean;
  /** Si hay una sesión de entrenamiento en curso en el teléfono: Entrenamiento lo marca. */
  entrenamientoEnCurso?: boolean;
  /** Si hay algo para responder: Perfil lleva un punto (PV-6). */
  marcaEnPerfil?: boolean;
  /** Durante la sesión de entrenamiento: pegada abajo y opaca, sin flotar (PV-11). */
  fija?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const tecladoAbierto = useTecladoAbierto();
  // Mientras está oculta (con el teclado abierto, o en la sesión enfocada de entrenamiento, WP-ENTRENAMIENTO-SERIES §7.2)
  // no ocupa lugar: el contenido recupera ese espacio.
  useEffect(() => {
    if (tecladoAbierto || oculta) alMedir(0);
  }, [tecladoAbierto, oculta, alMedir]);
  if (tecladoAbierto) return null;
  if (oculta) return null;
  // Una fila o dos, y el margen: según el ancho del teléfono y la letra de la persona.
  const { filas, margen } = disposicionDeLaBarra({ anchoDePantalla: width, escalaDeLetra: fontScale, zonas: ZONAS.map((z) => z.zona) });
  // Flotante, el vidrio; fija durante la sesión, opaca (PV-11).
  const fondo = COLOR[tokenDelFondoDeLaBarra(fija)];
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => alMedir(Math.ceil(e.nativeEvent.layout.height))}
      style={
        fija
          ? [estilos.fija, { paddingBottom: insets.bottom + 4, backgroundColor: fondo }]
          : [estilos.capsula, filas.length > 1 && estilos.capsulaEnDosFilas, { left: margen, right: margen, bottom: insets.bottom + SEPARACION_DE_LA_BARRA, backgroundColor: fondo }]
      }
    >
      {filas.map((fila) => (
        <View key={fila.join('-')} style={estilos.fila}>
          {ZONAS.filter((z) => fila.includes(z.zona)).map((z) => {
            const elegida = z.zona === actual;
            const enCurso = entrenamientoEnCurso && z.zona === 'entrenamiento';
            const conMarca = marcaEnPerfil && z.zona === 'perfil';
            return (
              <Pressable
                key={z.zona}
                accessibilityRole="tab"
                accessibilityState={{ selected: elegida }}
                accessibilityLabel={enCurso ? `${z.texto}, ${TEXTOS_DE_LA_SESION.conSesionEnCurso}` : conMarca ? `${z.texto}, ${TEXTOS_DE_LA_VUELTA.hayAlgoParaResponder}` : z.texto}
                onPress={() => ir(z.ruta)}
                style={({ pressed }) => [estilos.destino, pressed && estilos.presionado]}
              >
                <View style={estilos.lugarDelIcono}>
                  {elegida ? <Brillo zona={z.zona} /> : null}
                  <IconoDeZona zona={z.zona} color={elegida ? COLOR.barraElegido : COLOR.barraTexto} marcado={elegida} />
                  {enCurso || conMarca ? <View style={estilos.marcaEnCurso} /> : null}
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
 * El velo detrás de la barra: del color de abajo del fondo (`fondoAbajo`, DL-170: con `fondo` quedaba una franja sobre
 * el degradé), transparente arriba y casi opaco abajo. App.tsx lo dibuja antes de la cápsula, desde donde termina el
 * espacio libre del contenido. No recibe toques ni lo recorre el lector de pantalla.
 */
export function VeloDeLaBarra({ alto }: { alto: number }) {
  useApariencia();
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: alto }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="velo-de-la-barra" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR.fondoAbajo.slice(0, 7)} stopOpacity={0} />
            <Stop offset="0.4" stopColor={COLOR.fondoAbajo.slice(0, 7)} stopOpacity={0.9} />
            <Stop offset="1" stopColor={COLOR.fondoAbajo.slice(0, 7)} stopOpacity={0.97} />
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

/** El ícono de la familia de cada destino: la casa, la manzana, la mancuerna, la cinta métrica y la persona (DL-166). */
const ICONO_DE_LA_ZONA: Readonly<Record<Zona, NombreDeIcono>> = {
  inicio: 'inicio',
  nutricion: 'nutricion',
  entrenamiento: 'entrenamiento',
  evolucion: 'antropometria',
  perfil: 'persona',
};

/**
 * El ícono de un destino, de la familia de BE (PA-06): solo acompaña al texto, y el lector de pantalla no lo recorre.
 * Inicio lo usa también en el encabezado de cada tarjeta, para que el módulo se reconozca igual que en la barra.
 * `marcado` engrosa el trazo del destino elegido: es la señal que no depende del color.
 */
export function IconoDeZona({ zona, color, marcado = false, tamano = 24 }: { zona: Zona; color: string; marcado?: boolean; tamano?: TamanoDeIcono }) {
  return <DibujoDeIcono nombre={ICONO_DE_LA_ZONA[zona]} color={color} tamano={tamano} marcado={marcado} />;
}

const estilos = estilosPorTema((COLOR) => ({
  capsula: {
    position: 'absolute',
    paddingHorizontal: 3,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    // DL-170 (AV2-06): el borde y la línea de luz de la receta, y la sombra con `boxShadow`: con el vidrio al 88 %, la de
    // `elevation` se vería a través como una mancha.
    borderColor: COLOR.vidrioFilo,
    boxShadow: sombrasDeLaBarra(COLOR),
  },
  // Fija (la sesión, PV-11): de lado a lado, pegada abajo, opaca y con una línea arriba. Sin sombra: no flota.
  fija: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 4, paddingHorizontal: 4, borderTopWidth: 1, borderColor: COLOR.borde, rowGap: 2 },
  // Dos filas: la píldora pasa a un rectángulo de esquinas redondeadas, con la misma separación del borde.
  capsulaEnDosFilas: { borderRadius: 28, paddingVertical: 6, rowGap: 2 },
  fila: { flexDirection: 'row' },
  // Cada destino mide lo que su texto más una parte igual del resto: con anchos iguales, «Entrenamiento» no entraba. Los
  // 2 dp a cada lado separan dos etiquetas vecinas cuando la letra es grande y la barra va justa. Desde DL-170, un destino
  // de 52 dp (ALTO_DEL_DESTINO): más fino, y por encima de los 48 del objetivo táctil.
  destino: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: 48, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 2, borderRadius: 999 },
  presionado: { opacity: 0.7 },
  // El lugar del ícono es más angosto que el destino más chico (48): el brillo lo desborda apenas, ya transparente.
  lugarDelIcono: { width: 40, height: 28, alignItems: 'center', justifyContent: 'center' },
  // La marca de la sesión en curso, y la de Perfil con algo para responder: un punto del color de lo elegido, arriba a la
  // derecha del ícono, sin número.
  marcaEnCurso: { position: 'absolute', top: 1, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.barraElegido },
  brillo: { position: 'absolute', left: -8, top: -6 },
  // Medio y negrita (500 y 700): la diferencia se ve, y las cinco etiquetas ocupan menos que con 600 y 800.
  texto: { fontSize: 12, lineHeight: 16, marginTop: 1, fontWeight: '500', color: COLOR.barraTexto, textAlign: 'center' },
  textoElegido: { fontWeight: '700', color: COLOR.barraElegido },
}));
