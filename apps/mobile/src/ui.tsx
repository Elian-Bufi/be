/**
 * Piezas de interfaz del APK (10-B10 §7, §9): label persistente, error con texto (no solo color), targets táctiles de
 * 48 dp, roles y estados accesibles, sin gestos exclusivos. Botón destructivo distinguible por texto y jerarquía.
 *
 * Desde PA-06 (2026-11-02) las piezas aceptan un ícono de la familia (`icono`, de `icono.tsx`): acompaña al texto, que
 * sigue diciendo todo, y el lector de pantalla no lo recorre. Los glifos de texto (la tilde, el aviso, las flechas)
 * pasaron a ser íconos.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View, type TextInputProps } from 'react-native';
import { BotonDeIcono, Icono, type NombreDeIcono, type TonoDeIcono } from './icono';
import { COLOR, estilosPorTema } from './tema';

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

export function Parrafo({ children, tenue = false }: { children: ReactNode; tenue?: boolean }) {
  return <Text style={[estilos.parrafo, tenue && estilos.tenue]}>{children}</Text>;
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
}) {
  const textoDelBoton = <Text style={[estilos.textoBoton, estilos[`textoBoton_${tipo}`], icono ? estilos.textoConIcono : null]}>{texto}</Text>;
  const dibujo = icono ? <Icono nombre={icono} tamano={20} tono={TONO_DEL_BOTON[tipo]} /> : null;
  return (
    <Pressable
      accessibilityRole={tipo === 'enlace' ? 'link' : 'button'}
      accessibilityState={{ disabled: deshabilitado || ocupado, busy: ocupado, ...(seleccionado === undefined ? {} : { selected: seleccionado }) }}
      disabled={deshabilitado || ocupado}
      onPress={onPress}
      style={({ pressed }) => [estilos.boton, estilos[`boton_${tipo}`], (deshabilitado || ocupado) && estilos.deshabilitado, pressed && estilos.presionado]}
    >
      {dibujo ? (
        <View style={estilos.contenidoDeBoton}>
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
  return (
    <View style={[estilos.segmentos, compactos && estilos.segmentosCompactos]} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
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

/** Casilla accesible (rol checkbox con estado). Nunca premarcada: el estado lo decide quien la usa. */
export function Casilla({
  marcada,
  onCambio,
  titulo,
  texto,
  error,
  children,
}: {
  marcada: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  texto: string;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <View style={[estilos.acto, error ? estilos.actoConError : null]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcada }}
        accessibilityLabel={`${titulo}. ${texto}`}
        accessibilityHint={error ?? undefined}
        onPress={() => onCambio(!marcada)}
        style={estilos.filaDeCasilla}
      >
        {/* La tilde va solo dentro de la casilla: dice «marcada», no aprueba nada. */}
        <View style={[estilos.casilla, marcada && estilos.casillaMarcada]}>{marcada ? <Icono nombre="tilde" tamano={20} tono="botonTexto" /> : null}</View>
        <Text style={estilos.textoDeCasilla}>
          <Text style={estilos.negrita}>{titulo}</Text> — {texto}
        </Text>
      </Pressable>
      {children}
      {error ? <TextoDeError texto={error} /> : null}
    </View>
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
  const dibujo = icono === undefined ? ICONO_DEL_AVISO[tipo] : icono;
  return (
    <View accessibilityRole={tipo === 'error' ? 'alert' : 'summary'} style={[estilos.aviso, estilos[`aviso_${tipo}`], dibujo ? estilos.avisoConIcono : null]}>
      {dibujo ? (
        <View style={estilos.iconoDeAviso}>
          <Icono nombre={dibujo} tamano={20} tono={tipo === 'error' ? 'error' : tipo === 'exito' ? 'exito' : 'acento'} />
        </View>
      ) : null}
      <View style={dibujo ? estilos.cuerpoDeAviso : null}>
        {titulo ? <Text style={estilos.negrita}>{titulo}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function Seccion({ titulo, children, peligro = false, icono }: { titulo: string; children: ReactNode; peligro?: boolean; icono?: NombreDeIcono }) {
  const encabezado = (
    <Text style={[estilos.tituloDeSeccion, icono ? estilos.tituloConIcono : null]} accessibilityRole="header">
      {titulo}
    </Text>
  );
  return (
    <View style={[estilos.seccion, peligro && estilos.seccionPeligro]}>
      {icono ? (
        <View style={estilos.cabezaConIcono}>
          <Icono nombre={icono} tamano={20} tono={peligro ? 'error' : 'acento'} />
          {encabezado}
        </View>
      ) : (
        encabezado
      )}
      {children}
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

/** Un ítem de lista o un bloque autocontenido dentro de una sección. */
export function Tarjeta({ children }: { children: ReactNode }) {
  return <View style={estilos.tarjeta}>{children}</View>;
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
 */
export function Ayuda({ titulo = 'Cómo se lee', icono = 'pregunta', children }: { titulo?: string; icono?: 'informacion' | 'pregunta'; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <View style={estilos.ayuda}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        onPress={() => setAbierta((a) => !a)}
        style={({ pressed }) => [estilos.cabezaDeAyuda, pressed && estilos.presionado]}
      >
        {/* La ayuda se reconoce por el (?) (Dirección, 2026-11-02); «informacion» queda para una nota que no es ayuda. */}
        <Icono nombre={icono === 'informacion' ? 'info' : 'pregunta'} tamano={20} tono="acento" />
        <Text style={estilos.tituloDeAyuda}>{titulo}</Text>
        <Chevron abierto={abierta} />
      </Pressable>
      {abierta ? <View style={estilos.cuerpoDeAyuda}>{children}</View> : null}
    </View>
  );
}

/**
 * Contenido plegado detrás de un encabezado tocable con su título y, si hace falta, un detalle («22 medidas»): para lo
 * que no hace falta ver de entrada y no tiene que empujar hacia abajo lo principal de la pantalla.
 */
export function Desplegable({
  titulo,
  detalle,
  abiertoAlInicio = false,
  icono,
  children,
}: {
  titulo: string;
  detalle?: string;
  abiertoAlInicio?: boolean;
  icono?: NombreDeIcono;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  return (
    <View style={estilos.desplegable}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={detalle ? `${titulo}. ${detalle}` : titulo}
        onPress={() => setAbierto((a) => !a)}
        style={({ pressed }) => [estilos.cabezaDeDesplegable, pressed && estilos.presionado]}
      >
        {icono ? <Icono nombre={icono} tamano={20} tono="acento" /> : null}
        <View style={estilos.textoDeDesplegable}>
          <Text style={estilos.tituloDeDesplegable}>{titulo}</Text>
          {detalle ? <Text style={estilos.tenue}>{detalle}</Text> : null}
        </View>
        <Chevron abierto={abierto} />
      </Pressable>
      {abierto ? children : null}
    </View>
  );
}

/** La flecha de lo que se pliega: hacia abajo cerrado, hacia arriba abierto. Solo acompaña al estado que dice el lector. */
function Chevron({ abierto }: { abierto: boolean }) {
  return <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={24} tono="acento" />;
}

/** Estado en forma de insignia: el texto dice el estado; el color y el ícono solo acompañan (10-B10 §7). */
export function Insignia({ texto, positiva = false, etiqueta, icono }: { texto: string; positiva?: boolean; etiqueta?: string; icono?: NombreDeIcono }) {
  return (
    <View style={[estilos.insignia, positiva && estilos.insigniaPositiva, icono ? estilos.insigniaConIcono : null]} accessible accessibilityLabel={etiqueta ? `${etiqueta}: ${texto}` : texto}>
      {icono ? <Icono nombre={icono} tamano={15} tono={positiva ? 'exito' : 'tenue'} /> : null}
      <Text style={[estilos.textoInsignia, positiva && estilos.textoInsigniaPositiva]}>{texto}</Text>
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
  negrita: { fontWeight: '700', color: COLOR.texto },
  boton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
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
  textoBoton_enlace: { color: COLOR.acento, textDecorationLine: 'underline' },
  // Con ícono: el ícono y el texto en una línea, centrados; el texto se parte si no entra.
  contenidoDeBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: '100%' },
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
  acto: { borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie, borderRadius: 8, padding: 12, marginVertical: 6 },
  actoConError: { borderColor: COLOR.error, borderWidth: 2 },
  filaDeCasilla: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 48 },
  casilla: { width: 28, height: 28, borderWidth: 2, borderColor: COLOR.acento, borderRadius: 4, marginRight: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  casillaMarcada: { backgroundColor: COLOR.acento },
  textoDeCasilla: { flex: 1, fontSize: 16, color: COLOR.texto, lineHeight: 22 },
  aviso: { borderLeftWidth: 6, borderRadius: 8, padding: 12, marginVertical: 8 },
  aviso_error: { borderLeftColor: COLOR.error, backgroundColor: COLOR.errorFondo },
  aviso_info: { borderLeftColor: COLOR.azul, backgroundColor: COLOR.superficie },
  aviso_exito: { borderLeftColor: COLOR.exito, backgroundColor: COLOR.exitoFondo },
  avisoConIcono: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconoDeAviso: { paddingTop: 1 },
  cuerpoDeAviso: { flex: 1 },
  seccion: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8, backgroundColor: COLOR.superficie },
  seccionPeligro: { borderColor: COLOR.error },
  tituloDeSeccion: { fontSize: 19, fontWeight: '800', color: COLOR.texto, marginBottom: 6 },
  cabezaConIcono: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tituloConIcono: { flexShrink: 1, marginBottom: 0 },
  subtitulo: { fontSize: 17, fontWeight: '700', color: COLOR.texto, marginTop: 12, marginBottom: 4 },
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 12, marginVertical: 6, backgroundColor: COLOR.superficie },
  dato: { flexDirection: 'row', alignItems: 'flex-start', columnGap: 12, marginVertical: 6 },
  datoApilado: { marginVertical: 6, rowGap: 2 },
  etiquetaDeDato: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: COLOR.texto },
  etiquetaEnFila: { flex: 1 },
  valorDeDato: { fontSize: 16, lineHeight: 22, color: COLOR.texto },
  valorEnFila: { flexShrink: 0, maxWidth: '55%', textAlign: 'right' },
  insignia: { alignSelf: 'flex-start', borderWidth: 2, borderColor: COLOR.tenue, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginVertical: 6 },
  insigniaPositiva: { borderColor: COLOR.exito },
  textoInsignia: { fontWeight: '700', color: COLOR.tenue, fontSize: 15 },
  textoInsigniaPositiva: { color: COLOR.exito },
  insigniaConIcono: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ayuda: { marginTop: 4 },
  cabezaDeAyuda: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tituloDeAyuda: { flex: 1, fontSize: 15, fontWeight: '700', color: COLOR.acento },
  cuerpoDeAyuda: { borderLeftWidth: 3, borderLeftColor: COLOR.borde, paddingLeft: 10, marginBottom: 6 },
  desplegable: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 8 },
  cabezaDeDesplegable: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  textoDeDesplegable: { flexShrink: 1 },
  tituloDeDesplegable: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
}));
