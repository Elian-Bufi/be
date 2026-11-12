/**
 * Piezas de interfaz del APK (10-B10 §7, §9): label persistente, error con texto (no solo color), targets táctiles de
 * 48 dp, roles y estados accesibles, sin gestos exclusivos. Botón destructivo distinguible por texto y jerarquía.
 *
 * Desde PA-06 (2026-11-02) las piezas aceptan un ícono de la familia (`icono`, de `icono.tsx`): acompaña al texto, que
 * sigue diciendo todo, y el lector de pantalla no lo recorre. Los glifos de texto (la tilde, el aviso, las flechas)
 * pasaron a ser íconos.
 *
 * Desde DL-170 (WP-APP-VUELTA-2, AV2-04):
 * - Seccion, Tarjeta y el aviso informativo son de vidrio por nivel (`vidrio.tsx`), y proveen su nivel a lo de adentro;
 *   el botón secundario y los Segmentos, dentro de una tarjeta, son de nivel 2. Con el vidrio apagado, como siempre.
 * - El botón principal, con el vidrio, va en degradé con un resplandor quieto, solo si está habilitado.
 * - El cian, solo para lo que se toca: los íconos decorativos de Parrafo, Seccion, Desplegable y Aviso van en `tenue`;
 *   la etiqueta de estado es neutra, rellena y sin borde (no parece un botón), y la tilde en `exito` va solo con lo que
 *   la persona hizo (`hecha`); el enlace con flecha no lleva subrayado.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View, type PressableProps, type StyleProp, type TextInputProps, type ViewProps, type ViewStyle } from 'react-native';
import { BotonDeIcono, CajaDelIcono, Icono, type NombreDeIcono, type TonoDeIcono } from './icono';
import { accesibilidadDelDesplegable } from './desplegable';
import { useMovimientoReducido } from './movimiento-reducido';
import { BORDE_DEL_BOTON, estiloDeLaEtiqueta, RELLENO_DEL_BOTON, subrayadoDelEnlace } from './receta-de-vidrio';
import { COLOR, estilosPorTema, PALETAS } from './tema';
import { DentroDelNivel, useBotonPrincipal, useSuperficie, useSuperficieDeControl, useVidrio } from './vidrio';

// Los colores viven en tema.ts, donde los verifica la prueba de contraste; se reexportan para las pantallas.
export { COLOR, estilosPorTema } from './tema';

export function Titulo({ children }: { children: ReactNode }) {
  return (
    <Text style={estilos.titulo} accessibilityRole="header">
      {children}
    </Text>
  );
}

/**
 * El rótulo de un grupo, en versalitas con aire entre letras: «PERÍMETROS», «DIÁMETROS ÓSEOS» (referencia estética de
 * Dirección, 2026-10-03). Ordena una lista sin agregar otro título grande.
 */
export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <Text style={estilos.rotulo} accessibilityRole="header">
      {typeof children === 'string' ? children.toLocaleUpperCase('es-AR') : children}
    </Text>
  );
}

/**
 * Una cifra con su unidad: el valor en negrita y con dígitos de ancho fijo, y la unidad más chica y tenue, para que las
 * columnas de valores se alineen y la unidad no compita con el número. El lector de pantalla lee «86,5 cm».
 */
export function Cifra({ valor, unidad, tamano = 18 }: { valor: string; unidad?: string | null; tamano?: number }) {
  return (
    <Text style={estilos.cifra} accessibilityLabel={unidad ? `${valor} ${unidad}` : valor}>
      <Text style={[estilos.valorDeCifra, { fontSize: tamano }]}>{valor}</Text>
      {unidad ? <Text style={[estilos.unidadDeCifra, { fontSize: Math.round(tamano * 0.72) }]}>{` ${unidad}`}</Text> : null}
    </Text>
  );
}

/**
 * Un párrafo. Con `icono`, el ícono de la familia va antes del texto y solo acompaña: la fecha con el calendario, un
 * aviso de ambiente con la «i». Es decorativo: va en `tenue` (DL-170: el cian, solo para lo que se toca). El lector lee
 * el texto, no el ícono.
 */
export function Parrafo({ children, tenue = false, icono }: { children: ReactNode; tenue?: boolean; icono?: NombreDeIcono }) {
  const texto = <Text style={[estilos.parrafo, tenue && estilos.tenue, icono ? estilos.textoConIconoAlLado : null]}>{children}</Text>;
  if (!icono) return texto;
  return (
    <View style={estilos.parrafoConIcono}>
      <View style={estilos.iconoDelParrafo}>
        <Icono nombre={icono} tamano={18} tono="tenue" />
      </View>
      {texto}
    </View>
  );
}

type TipoDeBoton = 'primario' | 'secundario' | 'peligro' | 'peligroSecundario' | 'enlace';

/** El tono del ícono de cada tipo de botón: el mismo del texto (`textoBoton_*`), que ya mide la prueba de contraste. */
const TONO_DEL_BOTON: Readonly<Record<TipoDeBoton, TonoDeIcono>> = {
  primario: 'botonTexto',
  secundario: 'acento',
  peligro: 'peligroTexto',
  peligroSecundario: 'error',
  enlace: 'acento',
};

/**
 * Un botón con su texto y, si hace falta, un ícono de la familia antes del texto (o después, con `iconoAlFinal`: la
 * flecha de «Siguiente»). Nunca una tilde de aprobado: un botón hace algo, no califica.
 * - Con el vidrio (DL-170), el principal va en degradé, con radio 14 y un resplandor quieto solo si está habilitado; el
 *   secundario, dentro de una tarjeta, es de nivel 2.
 * - Un enlace con flecha (`icono="derecha"` al final) no lleva subrayado: el chevron de 18 dp va pegado al texto y ya
 *   dice «enlace». Sin flecha, dentro de un texto, sí. El lector lo lee como enlace en los dos casos.
 */
export function Boton({
  texto,
  onPress,
  tipo = 'primario',
  deshabilitado = false,
  ocupado = false,
  seleccionado,
  icono,
  iconoAlFinal = false,
  etiqueta,
}: {
  texto: string;
  onPress: () => void;
  tipo?: TipoDeBoton;
  deshabilitado?: boolean;
  ocupado?: boolean;
  /** Para una opción de un grupo: el lector de pantalla dice si está elegida, no solo el color (B10-10:36). */
  seleccionado?: boolean;
  icono?: NombreDeIcono;
  iconoAlFinal?: boolean;
  /** El nombre para el lector cuando el texto solo no alcanza: «Cambiar» se lee «Cambiar Sentadilla goblet». */
  etiqueta?: string;
}) {
  const conFlecha = tipo === 'enlace' && icono === 'derecha' && iconoAlFinal;
  const subrayado = tipo === 'enlace' && subrayadoDelEnlace(conFlecha) === 'underline';
  const habilitado = !(deshabilitado || ocupado);
  // Con el vidrio apagado, los dos son `null` y el botón es el de siempre.
  const principal = useBotonPrincipal(habilitado);
  const control = useSuperficieDeControl();
  const textoDelBoton = <Text style={[estilos.textoBoton, estilos[`textoBoton_${tipo}`], subrayado && estilos.subrayado, icono ? estilos.textoConIcono : null]}>{texto}</Text>;
  const dibujo = icono ? <Icono nombre={icono} tamano={conFlecha ? 18 : 20} tono={TONO_DEL_BOTON[tipo]} /> : null;
  return (
    <Pressable
      accessibilityRole={tipo === 'enlace' ? 'link' : 'button'}
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado || ocupado, busy: ocupado, ...(seleccionado === undefined ? {} : { selected: seleccionado }) }}
      disabled={deshabilitado || ocupado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        estilos[`boton_${tipo}`],
        tipo === 'primario' ? principal : null,
        tipo === 'secundario' ? control : null,
        (deshabilitado || ocupado) && estilos.deshabilitado,
        pressed && estilos.presionado,
      ]}
    >
      {dibujo ? (
        <View style={[estilos.contenidoDeBoton, conFlecha && estilos.contenidoDeEnlace]}>
          {iconoAlFinal ? null : dibujo}
          {textoDelBoton}
          {iconoAlFinal ? dibujo : null}
        </View>
      ) : (
        textoDelBoton
      )}
    </Pressable>
  );
}

/** Un error dicho con texto y el ícono de aviso, que solo acompaña: el color nunca es la única señal. */
function TextoDeError({ texto, paraElLector = true }: { texto: string; paraElLector?: boolean }) {
  return (
    <View style={estilos.lineaDeError} {...(paraElLector ? {} : { importantForAccessibility: 'no-hide-descendants' as const, accessibilityElementsHidden: true })}>
      <View style={estilos.iconoDeError}>
        <Icono nombre="aviso" tamano={18} tono="error" />
      </View>
      <Text style={[estilos.error, estilos.textoDeError]}>{texto}</Text>
    </View>
  );
}

/**
 * Campo con label persistente y, si hay error, el texto **debajo del campo y asociado a él**, no solo en el resumen y
 * no solo con color (B10-10:36, 164-165). React Native no tiene `accessibilityState.invalid` ni `aria-invalid` —el
 * website sí—, así que la asociación se hace con lo que el lector de pantalla del APK sí lee: el error entra en el
 * `accessibilityLabel` del propio campo, una sola vez (el texto visible no se repite en voz). El borde rojo solo acompaña.
 */
export function Campo({ etiqueta, ayuda, error, icono, ...resto }: TextInputProps & { etiqueta: string; ayuda?: string; error?: string | null; icono?: NombreDeIcono }) {
  // Una contraseña se puede mostrar con el ojo, para revisarla antes de entrar (PA-06): empieza oculta.
  const esSecreto = resto.secureTextEntry === true;
  const [visible, setVisible] = useState(false);
  const compuesto = icono !== undefined || esSecreto;
  const entrada = (
    <TextInput
      accessibilityLabel={error ? `${etiqueta}. Revisá este campo: ${error}` : etiqueta}
      accessibilityHint={ayuda || undefined}
      style={compuesto ? estilos.entradaInterna : [estilos.entrada, error ? estilos.entradaConError : null]}
      placeholderTextColor={COLOR.tenue}
      {...resto}
      secureTextEntry={esSecreto ? !visible : resto.secureTextEntry}
    />
  );
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      {ayuda ? <Text style={estilos.tenue}>{ayuda}</Text> : null}
      {compuesto ? (
        // El borde pasa al contenedor: el ícono y el ojo quedan dentro del campo, y el texto ocupa el resto.
        <View style={[estilos.entrada, estilos.entradaCompuesta, error ? estilos.entradaConError : null]}>
          {icono ? <Icono nombre={icono} tamano={20} tono="tenue" /> : null}
          {entrada}
          {esSecreto ? (
            <BotonDeIcono nombre={visible ? 'oculto' : 'ver'} etiqueta={visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} onPress={() => setVisible((v) => !v)} tono="tenue" />
          ) : null}
        </View>
      ) : (
        entrada
      )}
      {/* El lector ya lo dijo en el nombre del campo: el texto visible no se repite en voz. */}
      {error ? <TextoDeError texto={error} paraElLector={false} /> : null}
    </View>
  );
}

/**
 * Campo de dos opciones excluyentes (Sí/No) que **nace sin ninguna elegida**, y en el que volver a tocar lo elegido
 * devuelve el campo a «sin responder». Ese tercer estado es el motivo de que esto no sea una casilla: una casilla
 * desmarcada no distingue «No» de «no contesté», y acá la diferencia es el dato (09:1586-1587).
 *
 * Rol `radiogroup` con `radio` adentro, no botones: el lector de pantalla dice cuántas opciones hay y cuál está
 * elegida, sin depender del color (B10-10:36). El aspecto es el mismo grupo de opciones que usa el resto del APK.
 */
export function CampoSiONo({
  etiqueta,
  ayuda,
  opciones,
  valor,
  onCambio,
  pista,
}: {
  etiqueta: string;
  ayuda?: string;
  /** El texto de cada opción y lo que vale: el copy vive en el dominio, no acá. */
  opciones: readonly { readonly valor: string; readonly texto: string }[];
  /** `''` = sin responder. */
  valor: string;
  onCambio: (v: string) => void;
  /** Se muestra solo cuando hay algo elegido: cómo volver a dejar el campo sin responder. */
  pista?: string;
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      {ayuda ? <Text style={estilos.tenue}>{ayuda}</Text> : null}
      <View style={estilos.grupoDeOpciones} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
        {opciones.map((o) => {
          const elegida = valor === o.valor;
          return (
            <Pressable
              key={o.valor}
              accessibilityRole="radio"
              accessibilityState={{ checked: elegida }}
              accessibilityLabel={o.texto}
              // Tocar lo ya elegido lo suelta: sin esto, una elección por error no tendría vuelta atrás.
              onPress={() => onCambio(elegida ? '' : o.valor)}
              style={({ pressed }) => [estilos.boton, estilos.opcion, elegida ? estilos.boton_primario : estilos.boton_secundario, pressed && estilos.presionado]}
            >
              <Text style={[estilos.textoBoton, elegida ? estilos.textoBoton_primario : estilos.textoBoton_secundario]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </View>
      {pista && valor !== '' ? <Text style={estilos.tenue}>{pista}</Text> : null}
    </View>
  );
}

/**
 * Opciones excluyentes en píldoras: qué familia de medidas o qué figura (referencia estética de Dirección, 2026-10-03).
 * - Con letra grande, una píldora que no entra pasa a la línea siguiente en vez de cortar una palabra. En la 0.13.1,
 *   «Perímetros» y «Pliegues» se partían al medio con la letra al máximo.
 * - La elegida va llena y en negrita: el color no es la única señal.
 * - Rol `radiogroup` con `radio` adentro: el lector de pantalla dice cuántas opciones hay y cuál está elegida.
 * - Cada píldora mide al menos 48 dp de alto. Las compactas (`compactos`, para una elección secundaria dentro de una
 *   tarjeta, como la familia del mapa) dibujan 40 dp y suman 4 de cada lado al área de toque: siguen siendo 48.
 */
export function Segmentos<T extends string>({
  etiqueta,
  opciones,
  valor,
  alElegir,
  compactos = false,
}: {
  /** El nombre del grupo para el lector de pantalla. */
  etiqueta: string;
  opciones: readonly { readonly valor: T; readonly texto: string; readonly icono?: NombreDeIcono }[];
  valor: T;
  alElegir: (valor: T) => void;
  compactos?: boolean;
}) {
  // DL-170: dentro de una tarjeta con el vidrio, el contenedor es de nivel 2; la cápsula conserva su radio.
  const control = useSuperficieDeControl();
  return (
    <View style={[estilos.segmentos, compactos && estilos.segmentosCompactos, control, control && (compactos ? estilos.radioCompacto : estilos.radioDeSegmentos)]} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      {opciones.map((o) => {
        const elegida = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegida }}
            accessibilityLabel={o.texto}
            onPress={() => alElegir(o.valor)}
            hitSlop={compactos ? { top: 4, bottom: 4 } : undefined}
            style={({ pressed }) => [estilos.segmento, compactos && estilos.segmentoCompacto, elegida && estilos.segmentoElegido, pressed && estilos.presionado]}
          >
            {o.icono ? (
              <View style={estilos.contenidoDeOpcion}>
                <Icono nombre={o.icono} tamano={18} tono={elegida ? 'botonTexto' : 'texto'} />
                <Text style={[estilos.textoDeSegmento, compactos && estilos.textoDeSegmentoCompacto, elegida && estilos.textoDeSegmentoElegido, estilos.textoConIcono]}>{o.texto}</Text>
              </View>
            ) : (
              <Text style={[estilos.textoDeSegmento, compactos && estilos.textoDeSegmentoCompacto, elegida && estilos.textoDeSegmentoElegido]}>{o.texto}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Las vistas de una pantalla en pestañas (pulido del 2026-10-04): el texto de cada vista y una raya debajo de la elegida.
 * Se distinguen de las píldoras, que eligen entre opciones dentro de una vista.
 * - Van de borde a borde de la pantalla. Si la palabra más larga de cada una entra, van todas en una fila: una pestaña
 *   de dos palabras («Mapa corporal») cede ancho y pasa a dos líneas; las de una palabra no se achican. Si no entran, por
 *   ejemplo con letra grande, bajan a otra fila, enteras.
 * - La elegida va en negrita y con la raya: el color no es la única señal. Rol `tablist` con `tab` adentro.
 * - Cada pestaña mide al menos 48 dp de alto.
 */
export function Pestanas<T extends string>({
  etiqueta,
  opciones,
  valor,
  alElegir,
}: {
  etiqueta: string;
  opciones: readonly { readonly valor: T; readonly texto: string; readonly icono?: NombreDeIcono }[];
  valor: T;
  alElegir: (valor: T) => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const unaFila = entranEnUnaFila(opciones, width - 2 * RELLENO_DE_LAS_PESTANAS, Math.max(1, fontScale));
  return (
    <View style={[estilos.pestanas, { flexWrap: unaFila ? 'nowrap' : 'wrap' }]} accessibilityRole="tablist" accessibilityLabel={etiqueta}>
      {opciones.map((o) => {
        const elegida = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="tab"
            accessibilityState={{ selected: elegida }}
            accessibilityLabel={o.texto}
            onPress={() => alElegir(o.valor)}
            style={({ pressed }) => [estilos.pestana, { flexShrink: o.texto.includes(' ') ? 1 : 0 }, pressed && estilos.presionado]}
          >
            {o.icono ? (
              <View style={estilos.contenidoDeOpcion}>
                <Icono nombre={o.icono} tamano={18} tono={elegida ? 'texto' : 'tenue'} />
                <Text style={[estilos.textoDePestana, elegida && estilos.textoDePestanaElegida, estilos.textoConIcono]} numberOfLines={2}>
                  {o.texto}
                </Text>
              </View>
            ) : (
              <Text style={[estilos.textoDePestana, elegida && estilos.textoDePestanaElegida]} numberOfLines={2}>
                {o.texto}
              </Text>
            )}
            <View style={[estilos.rayaDePestana, elegida && estilos.rayaDePestanaElegida]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** El relleno de cada lado de la fila de pestañas, que va de borde a borde de la pantalla. */
const RELLENO_DE_LAS_PESTANAS = 8;
/** El tamaño del texto de una pestaña, en sp. */
const LETRA_DE_LA_PESTANA = 14;

/** Lo que suma el ícono de una pestaña: su lado y la separación con el texto. */
const ANCHO_DEL_ICONO_DE_PESTANA = 18 + 6;

/**
 * Si las pestañas entran en una fila: la palabra más larga de cada una, estimada holgada en negrita, más su relleno y,
 * si lo tiene, su ícono. Sin contar el ícono, la cuenta diría «una fila» cuando ya no entra.
 */
function entranEnUnaFila(opciones: readonly { readonly texto: string; readonly icono?: NombreDeIcono }[], ancho: number, escala: number): boolean {
  const total = opciones.reduce((suma, o) => suma + Math.max(...o.texto.split(' ').map((p) => p.length)) * LETRA_DE_LA_PESTANA * escala * 0.6 + 8 + (o.icono ? ANCHO_DEL_ICONO_DE_PESTANA : 0), 0);
  return total <= ancho;
}

/** El lado de la caja de una casilla, en dp, y el área de toque mínima de la casilla sola (la guía pide 44 o más). */
export const LADO_DE_LA_CASILLA = 26;
export const TOQUE_DE_LA_CASILLA = 44;

/**
 * La caja de una casilla (Dirección, 2026-11-02: «tiene que ser una casilla linda»): cuadrada de 26 dp, con esquinas de 7
 * y un borde de 2 dp del acento. Marcada, se llena del acento con la tilde de la familia en el color de contraste del
 * botón (`botonTexto`, medido sobre el acento). Al tocarla se aclara; al marcarse crece apenas y vuelve, en unos 150 ms,
 * y con «reducir movimiento» cambia sin moverse. La tilde va solo acá adentro: dice «marcada», no aprueba nada.
 *
 * Solo dibuja: el toque, el rol y el nombre los pone quien la usa (`Casilla`, `CasillaSola` o una casilla propia).
 */
export function CajaDeCasilla({ marcada, presionada = false, deshabilitada = false }: { marcada: boolean; presionada?: boolean; deshabilitada?: boolean }) {
  const reducido = useMovimientoReducido();
  const escala = useRef(new Animated.Value(1)).current;
  const anterior = useRef(marcada);
  useEffect(() => {
    if (anterior.current === marcada) return;
    anterior.current = marcada;
    if (!marcada || reducido) {
      escala.setValue(1);
      return;
    }
    // Un pulso corto al marcarse: arranca un poco más chica y vuelve a su tamaño con un rebote leve.
    escala.setValue(0.8);
    const pulso = Animated.spring(escala, { toValue: 1, speed: 28, bounciness: 10, useNativeDriver: true });
    pulso.start();
    return () => pulso.stop();
  }, [marcada, reducido, escala]);
  return (
    <Animated.View
      style={[estilos.cajaDeCasilla, marcada && estilos.cajaMarcada, presionada && (marcada ? estilos.cajaMarcadaPresionada : estilos.cajaPresionada), deshabilitada && estilos.deshabilitado, { transform: [{ scale: escala }] }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {marcada ? <Icono nombre="tilde" tamano={20} tono="botonTexto" marcado /> : null}
    </Animated.View>
  );
}

/**
 * La casilla sola, sin texto al lado: la de cada serie, al final de la fila (la sesión, la corrección). Su nombre dice lo
 * que hace («Registrar la serie 2») y el lector agrega si está marcada. El área de toque es de 44 dp o más aunque la caja
 * mida 26. Nunca premarcada: el estado lo decide quien la usa.
 */
export function CasillaSola({
  marcada,
  onCambio,
  etiqueta,
  pista,
  deshabilitada = false,
}: {
  marcada: boolean;
  onCambio: (v: boolean) => void;
  etiqueta: string;
  pista?: string;
  deshabilitada?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada, disabled: deshabilitada }}
      accessibilityLabel={etiqueta}
      accessibilityHint={pista}
      disabled={deshabilitada}
      onPress={() => onCambio(!marcada)}
      hitSlop={4}
      style={estilos.casillaSola}
    >
      {({ pressed }) => <CajaDeCasilla marcada={marcada} presionada={pressed} deshabilitada={deshabilitada} />}
    </Pressable>
  );
}

/** Casilla accesible con su texto (rol checkbox con estado). Nunca premarcada: el estado lo decide quien la usa. */
export function Casilla({
  marcada,
  onCambio,
  titulo,
  texto,
  error,
  deshabilitada = false,
  children,
}: {
  marcada: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  texto: string;
  error?: string | null;
  deshabilitada?: boolean;
  children?: ReactNode;
}) {
  return (
    <Superficie style={estilos.acto} encima={error ? estilos.actoConError : null}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcada, disabled: deshabilitada }}
        accessibilityLabel={`${titulo}. ${texto}`}
        accessibilityHint={error ?? undefined}
        disabled={deshabilitada}
        onPress={() => onCambio(!marcada)}
        style={estilos.filaDeCasilla}
      >
        {({ pressed }) => (
          <>
            <View style={estilos.lugarDeLaCaja}>
              <CajaDeCasilla marcada={marcada} presionada={pressed} deshabilitada={deshabilitada} />
            </View>
            <Text style={estilos.textoDeCasilla}>
              <Text style={estilos.negrita}>{titulo}</Text> — {texto}
            </Text>
          </>
        )}
      </Pressable>
      {children}
      {error ? <TextoDeError texto={error} /> : null}
    </Superficie>
  );
}

type TipoDeAviso = 'error' | 'info' | 'exito';

/**
 * El ícono de cada tipo de aviso. El de éxito va sin ícono: una tilde se leería como «aprobado», y lo que se guardó ya
 * lo dice el texto.
 */
const ICONO_DEL_AVISO: Readonly<Record<TipoDeAviso, NombreDeIcono | null>> = { error: 'aviso', info: 'info', exito: null };

/**
 * Aviso con rol de alerta; se anuncia al lector de pantalla al aparecer (10-B10:160-174). Lleva el ícono de su tipo
 * (`icono` lo cambia, y `null` lo saca), que solo acompaña al texto.
 */
export function Aviso({ tipo, titulo, icono, children }: { tipo: TipoDeAviso; titulo?: string; icono?: NombreDeIcono | null; children?: ReactNode }) {
  useEffect(() => {
    if (titulo) AccessibilityInfo.announceForAccessibility(titulo);
  }, [titulo]);
  // DL-170: el aviso informativo es de vidrio (nivel 1 suelto, nivel 2 dentro de una tarjeta); el de error y el de éxito
  // conservan su fondo, que dice qué son.
  const { estilo: superficie, nivel, prendido } = useSuperficie();
  const dibujo = icono === undefined ? ICONO_DEL_AVISO[tipo] : icono;
  const cuerpo = (
    <>
      {titulo ? <Text style={estilos.negrita}>{titulo}</Text> : null}
      {children}
    </>
  );
  return (
    <View accessibilityRole={tipo === 'error' ? 'alert' : 'summary'} style={[estilos.aviso, estilos[`aviso_${tipo}`], tipo === 'info' && prendido ? superficie : null, dibujo ? estilos.avisoConIcono : null]}>
      {dibujo ? (
        <View style={estilos.iconoDeAviso}>
          <Icono nombre={dibujo} tamano={20} tono={tipo === 'error' ? 'error' : tipo === 'exito' ? 'exito' : 'tenue'} />
        </View>
      ) : null}
      <View style={dibujo ? estilos.cuerpoDeAviso : null}>{tipo === 'info' ? <DentroDelNivel nivel={nivel}>{cuerpo}</DentroDelNivel> : cuerpo}</View>
    </View>
  );
}

export function Seccion({ titulo, children, peligro = false, icono }: { titulo: string; children: ReactNode; peligro?: boolean; icono?: NombreDeIcono }) {
  // DL-170: de vidrio, del nivel que le toca; lo de adentro baja un nivel. Con el vidrio apagado, la superficie de siempre.
  const { estilo, nivel } = useSuperficie();
  const encabezado = (
    <Text style={[estilos.tituloDeSeccion, icono ? estilos.tituloConIcono : null]} accessibilityRole="header">
      {titulo}
    </Text>
  );
  return (
    <View style={[estilos.seccion, estilo, peligro && estilos.seccionPeligro]}>
      {icono ? (
        <View style={estilos.cabezaConIcono}>
          {peligro ? <Icono nombre={icono} tamano={20} tono="error" /> : <CajaDelIcono><Icono nombre={icono} tamano={20} tono="azul" /></CajaDelIcono>}
          {encabezado}
        </View>
      ) : (
        encabezado
      )}
      <DentroDelNivel nivel={nivel}>{children}</DentroDelNivel>
    </View>
  );
}

/** Encabezado de una parte dentro de una sección. */
export function Subtitulo({ children }: { children: ReactNode }) {
  return (
    <Text style={estilos.subtitulo} accessibilityRole="header">
      {children}
    </Text>
  );
}

/**
 * Una superficie propia de una pantalla, con la receta de vidrio (AV2-24): una tarjeta, un grupo de filas o un bloque que
 * la pantalla arma a mano. Es la misma regla que `Tarjeta`, sin su relleno ni su margen:
 * - `style` va debajo de la receta: el relleno, el margen, el borde de 1 dp y lo que la pieza necesita. La receta pone el
 *   fondo, el borde de luz, el radio y la sombra del nivel que le toca; con el vidrio apagado, la superficie opaca.
 * - `encima` va arriba de la receta: un borde de estado (un error, lo elegido) que tiene que verse igual con el vidrio.
 * Lo de adentro baja un nivel. Una pieza que se toca entera (un `Pressable`) usa `useSuperficie` con la misma regla.
 */
export function Superficie({ style, encima, children, ...resto }: ViewProps & { encima?: StyleProp<ViewStyle> }) {
  const { estilo, nivel } = useSuperficie();
  return (
    <View {...resto} style={[style, estilo, encima]}>
      <DentroDelNivel nivel={nivel}>{children}</DentroDelNivel>
    </View>
  );
}

/** Lo mismo que `Superficie`, para una pieza que se toca entera (una fila de una lista, una baldosa). */
export function SuperficieTocable({
  style,
  encima,
  children,
  ...resto
}: Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; encima?: (presionada: boolean) => StyleProp<ViewStyle>; children: ReactNode }) {
  const { estilo, nivel } = useSuperficie();
  return (
    <Pressable {...resto} style={({ pressed }) => [style, estilo, encima?.(pressed)]}>
      <DentroDelNivel nivel={nivel}>{children}</DentroDelNivel>
    </Pressable>
  );
}

/**
 * Un ítem de lista o un bloque autocontenido. Suelta es de nivel 1; dentro de una sección, de nivel 2, sin sombra
 * (DL-170). Con el vidrio apagado, la superficie de siempre.
 */
export function Tarjeta({ children }: { children: ReactNode }) {
  const { estilo, nivel } = useSuperficie();
  return (
    <View style={[estilos.tarjeta, estilo]}>
      <DentroDelNivel nivel={nivel}>{children}</DentroDelNivel>
    </View>
  );
}

/**
 * Par etiqueta/valor, leído como una sola frase por el lector de pantalla (D-C4, 2026-11-02).
 * - **En fila**, la etiqueta ocupa lo que sobra y se parte en renglones si es larga; el valor va a la derecha, con un
 *   tope del 55 % del ancho, y se parte dentro de su lugar. Antes, una etiqueta larga mandaba el valor al renglón de
 *   abajo y a la izquierda, y parecía otra etiqueta.
 * - **Apilado** (`apilado`), el valor va debajo de la etiqueta, a todo el ancho: para un texto libre o largo (un motivo,
 *   una observación, un identificador). Se elige en cada uso, no por la cantidad de letras, para que se vea siempre igual.
 * - Las dos piezas van con la misma altura de renglón, para que queden alineadas. Sin valor, queda solo la etiqueta.
 */
export function Dato({ etiqueta, valor, apilado = false }: { etiqueta: string; valor: string; apilado?: boolean }) {
  return (
    <View style={apilado ? estilos.datoApilado : estilos.dato} accessible accessibilityLabel={valor ? `${etiqueta}: ${valor}` : etiqueta}>
      <Text style={[estilos.etiquetaDeDato, !apilado && estilos.etiquetaEnFila]}>{etiqueta}</Text>
      {valor ? <Text style={[estilos.valorDeDato, !apilado && estilos.valorEnFila]}>{valor}</Text> : null}
    </View>
  );
}

/**
 * Las explicaciones largas, plegadas (Dirección, 2026-10-01: que la pantalla se lea de un vistazo). Un encabezado
 * tocable, «Cómo se lee», que despliega el texto; empieza cerrado. El texto no se borra: se pliega, y el lector de
 * pantalla dice si está abierto. No va acá lo que la persona tiene que leer antes de aceptar algo (consentimientos,
 * privacidad, consecuencias de un acto): eso queda siempre a la vista. El ícono es el (?) de la familia (Dirección,
 * 2026-11-02: la ayuda se reconoce por el (?)); `icono="informacion"` deja la «i» para una nota que no es ayuda.
 * Desde DL-166 (AV-01) es la variante «ayuda» del desplegable común: la APK tiene una sola pieza para plegar.
 */
export function Ayuda({ titulo = 'Cómo se lee', icono = 'pregunta', children }: { titulo?: string; icono?: 'informacion' | 'pregunta'; children: ReactNode }) {
  return (
    <Desplegable titulo={titulo} variante="ayuda" icono={icono === 'informacion' ? 'info' : 'pregunta'}>
      {children}
    </Desplegable>
  );
}

/**
 * El desplegable común de la APK (PV-4 y AV-01, DL-166; GUIA-UX-UI III.7): contenido plegado detrás de un encabezado
 * tocable con su título y, si hace falta, un detalle («22 medidas»). Se pliega lo que explica, nunca lo que hace falta
 * para decidir (`desplegable.ts`). El lector de pantalla lo anuncia como botón con su estado, y abrirlo no escribe nada:
 * solo guarda, en la pantalla, si está abierto. Lo plegado va debajo del encabezado: abrirlo no mueve lo de arriba.
 * Tres variantes con la misma conducta: `seccion` (con su línea arriba), `ayuda` (el (?) y el texto con su borde) y
 * `enlace` (una fila en el color del acento, para «Comí otra cantidad» o «Para qué lo pide»).
 */
export function Desplegable({
  titulo,
  detalle,
  abiertoAlInicio = false,
  icono,
  variante = 'seccion',
  children,
}: {
  titulo: string;
  detalle?: string;
  abiertoAlInicio?: boolean;
  icono?: NombreDeIcono;
  variante?: 'seccion' | 'ayuda' | 'enlace';
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  // DL-170: con el vidrio, el separador es el borde de luz; los íconos, en `tenue`.
  const { prendido } = useVidrio();
  const seccion = variante === 'seccion';
  let plegado: ReactNode = null;
  if (abierto) plegado = variante === 'ayuda' ? <View style={estilos.cuerpoDeAyuda}>{children}</View> : children;
  return (
    <View style={seccion ? [estilos.desplegable, prendido && estilos.desplegableConVidrio] : estilos.ayuda}>
      <Pressable
        {...accesibilidadDelDesplegable(abierto, detalle ? `${titulo}. ${detalle}` : titulo)}
        onPress={() => setAbierto((a) => !a)}
        style={({ pressed }) => [seccion ? estilos.cabezaDeDesplegable : estilos.cabezaDeAyuda, pressed && estilos.presionado]}
      >
        {icono ? <Icono nombre={icono} tamano={20} tono="tenue" /> : null}
        <View style={estilos.textoDeDesplegable}>
          <Text style={seccion ? estilos.tituloDeDesplegable : estilos.tituloDeAyuda}>{titulo}</Text>
          {detalle ? <Text style={estilos.tenue}>{detalle}</Text> : null}
        </View>
        <Chevron abierto={abierto} />
      </Pressable>
      {plegado}
    </View>
  );
}

/** La flecha de lo que se pliega: hacia abajo cerrado, hacia arriba abierto. Solo acompaña al estado que dice el lector. */
function Chevron({ abierto }: { abierto: boolean }) {
  return <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={24} tono="tenue" />;
}

/**
 * La etiqueta de un estado (10-B10 §7; DL-170): el texto dice el estado, en `tenue`, y el ícono de 15 dp solo acompaña.
 * Es neutra y sin borde, para que no se confunda con un botón. Va rellena donde el tenue se lee sobre el relleno (sobre lo
 * opaco y sobre el vidrio de nivel 1), y sin relleno ni sangría, alineada con el texto de al lado, directo sobre el fondo
 * o dentro del nivel 2 translúcido de Azul noche (`estiloDeLaEtiqueta`). Lo que la persona hizo («Realizada»,
 * «Registrado», «Respondida») lleva la tilde en `exito` (`hecha`): se celebra lo hecho, y lo no hecho queda neutro, nunca
 * en rojo. La tilde nunca va con un número ni con una medida del cuerpo (GUIA I.8).
 */
export function Insignia({ texto, hecha = false, etiqueta, icono }: { texto: string; hecha?: boolean; etiqueta?: string; icono?: NombreDeIcono }) {
  const { tema, nivel, prendido } = useVidrio();
  const dibujo: NombreDeIcono | undefined = hecha ? 'tilde' : icono;
  return (
    <View style={[estilos.insignia, estiloDeLaEtiqueta(PALETAS[tema], nivel, prendido), dibujo ? estilos.insigniaConIcono : null]} accessible accessibilityLabel={etiqueta ? `${etiqueta}: ${texto}` : texto}>
      {dibujo ? <Icono nombre={dibujo} tamano={15} tono={hecha ? 'exito' : 'tenue'} /> : null}
      <Text style={estilos.textoInsignia}>{texto}</Text>
    </View>
  );
}

export const estilos = estilosPorTema((COLOR) => ({
  // Escala tipográfica (tanda del 2026-10-03): título 26, sección 19, subtítulo 17, cuerpo 16, detalle 14, rótulo 12.
  titulo: { fontSize: 26, fontWeight: '800', letterSpacing: -0.2, color: COLOR.texto, marginBottom: 10 },
  rotulo: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: COLOR.tenue, marginTop: 14, marginBottom: 6 },
  cifra: { color: COLOR.texto },
  valorDeCifra: { fontWeight: '800', color: COLOR.texto, fontVariant: ['tabular-nums'] },
  unidadDeCifra: { fontWeight: '600', color: COLOR.tenue },
  parrafo: { fontSize: 16, color: COLOR.texto, lineHeight: 23, marginVertical: 4 },
  tenue: { color: COLOR.tenue, fontSize: 14 },
  // Un párrafo con ícono: el ícono arriba, alineado con el primer renglón; el texto ocupa el resto y se parte.
  parrafoConIcono: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 4 },
  iconoDelParrafo: { paddingTop: 2 },
  textoConIconoAlLado: { flex: 1, marginVertical: 0 },
  negrita: { fontWeight: '700', color: COLOR.texto },
  // El borde y el relleno de la receta: con el vidrio, el principal pasa el borde a relleno (`botonPrincipal`).
  boton: { minHeight: 48, paddingHorizontal: RELLENO_DEL_BOTON, borderRadius: 8, borderWidth: BORDE_DEL_BOTON, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  boton_primario: { backgroundColor: COLOR.botonFondo, borderColor: COLOR.botonFondo },
  // Secundario tonal: relleno apenas más claro y borde fino. El cian queda en el texto: orienta sin competir.
  boton_secundario: { backgroundColor: COLOR.superficieElevada, borderColor: COLOR.borde, borderWidth: 1 },
  boton_peligro: { backgroundColor: COLOR.peligroFondo, borderColor: COLOR.peligroFondo },
  boton_peligroSecundario: { backgroundColor: 'transparent', borderColor: COLOR.error },
  boton_enlace: { backgroundColor: 'transparent', borderColor: 'transparent', alignItems: 'flex-start', paddingHorizontal: 0 },
  // Centrado también cuando la letra grande lo parte en dos líneas (render de Nutrición con letra ×2, 2026-10-05).
  textoBoton: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  textoBoton_primario: { color: COLOR.botonTexto },
  textoBoton_secundario: { color: COLOR.acento },
  textoBoton_peligro: { color: COLOR.peligroTexto },
  textoBoton_peligroSecundario: { color: COLOR.error },
  textoBoton_enlace: { color: COLOR.acento },
  // El subrayado, solo en un enlace sin flecha (DL-170): con la flecha, dos señales sobran.
  subrayado: { textDecorationLine: 'underline' },
  // Con ícono: el ícono y el texto en una línea, centrados; el texto se parte si no entra.
  contenidoDeBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: '100%' },
  // El chevron del enlace, pegado al texto.
  contenidoDeEnlace: { gap: 2, justifyContent: 'flex-start' },
  textoConIcono: { flexShrink: 1 },
  contenidoDeOpcion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, maxWidth: '100%' },
  deshabilitado: { opacity: 0.6 },
  presionado: { opacity: 0.8 },
  campo: { marginVertical: 8 },
  grupoDeOpciones: { flexDirection: 'row', gap: 12 },
  opcion: { flex: 1 },
  segmentos: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 3, marginVertical: 6, borderRadius: 27, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie },
  // Cada píldora crece para llenar su línea; si no entra junto a la otra, baja entera a la siguiente.
  // Relleno lateral de 10: con letra normal, tres opciones entran en una línea en un teléfono de 360 dp.
  segmento: { flexGrow: 1, flexBasis: 'auto', minHeight: 48, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  segmentoElegido: { backgroundColor: COLOR.botonFondo },
  textoDeSegmento: { fontSize: 16, fontWeight: '600', color: COLOR.texto, textAlign: 'center' },
  textoDeSegmentoElegido: { fontWeight: '800', color: COLOR.botonTexto },
  // Compactas: del ancho de sus opciones, más chicas y sin margen propio; el área de toque llega a 48 con `hitSlop`.
  segmentosCompactos: { alignSelf: 'flex-start', gap: 2, marginVertical: 0, borderRadius: 23 },
  // Con el vidrio, el contenedor toma la superficie de nivel 2 y conserva su forma de cápsula.
  radioDeSegmentos: { borderRadius: 27 },
  radioCompacto: { borderRadius: 23 },
  segmentoCompacto: { flexGrow: 0, minHeight: 40, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  textoDeSegmentoCompacto: { fontSize: 14 },
  // De borde a borde: la pantalla tiene 20 dp de relleno a cada lado (App.tsx), y la fila lo ocupa.
  pestanas: { flexDirection: 'row', marginTop: 2, marginBottom: 2, marginHorizontal: -20, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLOR.borde },
  pestana: { flexGrow: 1, flexBasis: 'auto', minHeight: 48, paddingHorizontal: 4, paddingTop: 8, alignItems: 'center', justifyContent: 'space-between' },
  textoDePestana: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: COLOR.tenue, textAlign: 'center' },
  textoDePestanaElegida: { fontWeight: '800', color: COLOR.texto },
  rayaDePestana: { alignSelf: 'stretch', height: 3, marginTop: 6, borderRadius: 2, backgroundColor: 'transparent' },
  rayaDePestanaElegida: { backgroundColor: COLOR.acento },
  etiqueta: { fontSize: 16, fontWeight: '600', color: COLOR.texto, marginBottom: 4 },
  entrada: { minHeight: 48, borderWidth: 1, borderColor: COLOR.bordeControl, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: COLOR.texto, backgroundColor: COLOR.superficie },
  entradaConError: { borderColor: COLOR.error, borderWidth: 2 },
  // Con ícono o con el ojo: el borde es del contenedor, y el texto ocupa lo que queda.
  entradaCompuesta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 0 },
  entradaInterna: { flex: 1, minHeight: 46, fontSize: 16, color: COLOR.texto, paddingVertical: 0 },
  error: { color: COLOR.error, fontWeight: '600', marginTop: 4, fontSize: 15 },
  lineaDeError: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  iconoDeError: { paddingTop: 1 },
  textoDeError: { flex: 1, marginTop: 0 },
  acto: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 8, padding: 12, marginVertical: 6 },
  actoConError: { borderColor: COLOR.error, borderWidth: 2 },
  filaDeCasilla: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 48 },
  // La casilla (2026-11-02): 26 dp, esquinas de 7 y borde de 2 dp del acento; marcada, llena del acento.
  cajaDeCasilla: { width: LADO_DE_LA_CASILLA, height: LADO_DE_LA_CASILLA, borderWidth: 2, borderColor: COLOR.acento, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  cajaMarcada: { backgroundColor: COLOR.acento },
  // Al tocarla: la vacía toma el escalón elevado; la marcada se aclara apenas.
  cajaPresionada: { backgroundColor: COLOR.superficieElevada },
  cajaMarcadaPresionada: { opacity: 0.8 },
  // La caja junto a su texto: alineada con la primera línea, con aire hasta el texto.
  lugarDeLaCaja: { marginRight: 12, marginTop: 1 },
  casillaSola: { minWidth: TOQUE_DE_LA_CASILLA, minHeight: TOQUE_DE_LA_CASILLA, alignItems: 'center', justifyContent: 'center' },
  textoDeCasilla: { flex: 1, fontSize: 16, color: COLOR.texto, lineHeight: 22 },
  aviso: { borderLeftWidth: 6, borderRadius: 8, padding: 12, marginVertical: 8 },
  aviso_error: { borderLeftColor: COLOR.error, backgroundColor: COLOR.errorFondo },
  aviso_info: { borderLeftColor: COLOR.azul, backgroundColor: COLOR.superficie },
  aviso_exito: { borderLeftColor: COLOR.exito, backgroundColor: COLOR.exitoFondo },
  avisoConIcono: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconoDeAviso: { paddingTop: 1 },
  cuerpoDeAviso: { flex: 1 },
  // El fondo, el borde y el radio de la sección y de la tarjeta los pone la receta (`useSuperficie`), con el vidrio o sin él.
  seccion: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8 },
  seccionPeligro: { borderColor: COLOR.error },
  tituloDeSeccion: { fontSize: 19, fontWeight: '800', color: COLOR.texto, marginBottom: 6 },
  cabezaConIcono: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  tituloConIcono: { flexShrink: 1, marginBottom: 0 },
  subtitulo: { fontSize: 17, fontWeight: '700', color: COLOR.texto, marginTop: 12, marginBottom: 4 },
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 12, marginVertical: 6 },
  dato: { flexDirection: 'row', alignItems: 'flex-start', columnGap: 12, marginVertical: 6 },
  datoApilado: { marginVertical: 6, rowGap: 2 },
  etiquetaDeDato: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: COLOR.texto },
  etiquetaEnFila: { flex: 1 },
  valorDeDato: { fontSize: 16, lineHeight: 22, color: COLOR.texto },
  valorEnFila: { flexShrink: 0, maxWidth: '55%', textAlign: 'right' },
  // La etiqueta de estado (DL-170): sin borde; el relleno y su sangría los pone `estiloDeLaEtiqueta`, según dónde está.
  insignia: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 4, marginVertical: 6 },
  textoInsignia: { fontWeight: '700', color: COLOR.tenue, fontSize: 15 },
  insigniaConIcono: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ayuda: { marginTop: 4 },
  cabezaDeAyuda: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Sin `flex` (DL-170, AV2-11): el ancho ya lo toma `textoDeDesplegable`. Con `flex: 1` dentro de esa columna, y las
  // erratas de Yoga de React Native 0.86, el texto se estiraba al alto de la fila (48 dp) y quedaba pegado arriba del (?).
  tituloDeAyuda: { fontSize: 15, fontWeight: '700', color: COLOR.acento },
  cuerpoDeAyuda: { borderLeftWidth: 3, borderLeftColor: COLOR.borde, paddingLeft: 10, marginBottom: 6 },
  desplegable: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 8 },
  desplegableConVidrio: { borderTopColor: COLOR.vidrioFilo },
  cabezaDeDesplegable: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  textoDeDesplegable: { flex: 1 },
  tituloDeDesplegable: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
}));
