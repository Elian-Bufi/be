/**
 * APK BE — WP-02 · WP-03 · WP-04 · WP-05.
 * - WP-02 (docs/paquetes/WP-02.md §5): Bienvenida · Crear cuenta · Iniciar sesión · Cuenta.
 * - WP-03 (docs/paquetes/WP-03.md §5): Cuenta → Vínculos (solicitudes recibidas, detalle de vínculo, pausa, reanudación
 *   y finalización) → Consentimiento; Cuenta → Privacidad (A3 y consentimientos a profesionales); Cuenta → «Tu
 *   identificador BE».
 * - WP-04 (docs/paquetes/WP-04.md §5): Cuenta → Nutrición: Hoy (registrar comidas del plan y fuera del plan) → Plan
 *   actual · Registros → Detalle de registro.
 * - WP-05 (docs/paquetes/WP-05.md §5): Cuenta → Antropometría: Mi evolución (RF-049, RF-065), de solo lectura y con
 *   los días sin medición vigente a la vista como «Sin dato».
 * - WP-NUTRICION-RECETAS (docs/paquetes/WP-NUTRICION-RECETAS.md §9): Nutrición con pestañas Hoy · Plan · Registros; en
 *   Hoy, el carrusel de opciones de cada comida → el detalle de una opción («¿Cuánto comiste?») y «Comí algo diferente».
 * Desde DL-117 (Dirección, 2026-10-04), con sesión se navega con la barra inferior: Inicio, Nutrición, Entrenamiento,
 * Evolución e Información (src/barra-de-zonas.tsx). Cuenta se abre desde el avatar de la cabecera única
 * (src/cabecera.tsx), y el menú auxiliar lleva a funciones que no tienen lugar en la barra (src/menu-auxiliar.tsx). Al
 * iniciar sesión, la APK abre en Inicio. Cada detalle recuerda de dónde se abrió, y volver lleva ahí (src/navegacion.ts).
 * La sesión (Bearer) y el identificador de la identidad viven en memoria, fuera del árbol de React
 * (src/sesion-en-memoria.ts): un cambio de tamaño de letra hace que Android recree la pantalla, y no pierde la sesión.
 * La credencial se guarda además en el almacenamiento seguro del teléfono hasta que vence (DL-012, decisión de
 * Dirección del 2026-10-03; src/sesion-persistente.ts). Si el sistema cierra el proceso o la persona cierra la app, al
 * abrirla se verifica con la API antes de mostrar nada protegido. No se guarda la contraseña ni hay renovación.
 * Mientras se verifica, la pantalla de la referencia 02 (src/pantallas/recuperacion.tsx): a los 5 s dice que está
 * tardando y ofrece reintentar; si no se pudo, dice la causa (WP-ENTRENAMIENTO-SERIES §7.6).
 * - WP-ENTRENAMIENTO-SERIES (docs/paquetes/WP-ENTRENAMIENTO-SERIES.md §7): Entrenamiento con pestañas Hoy · Plan ·
 *   Historial y la sesión enfocada, que se ve sin la barra inferior. El entrenamiento en curso se guarda en el teléfono por
 *   cuenta (src/entrenamiento-en-curso.ts): la raíz abre la cuenta con sesión y la cierra al salir.
 * Nunca se guarda un «rol autorizado» en el cliente: la API verifica la sesión y decide cada acceso en cada request;
 * ocultar un botón no concede ni quita nada.
 * Al entrar a una zona, la pantalla conserva su estructura y no muestra valores hasta que la API confirma el acceso en
 * esa entrada (src/ciclo-de-lectura.ts). Lo confirmado sigue a la vista mientras se reconfirma al volver del segundo
 * plano. Cada zona principal vuelve a la altura en que se la dejó.
 * Identidad del build visible en Bienvenida (07 §34, TEST-APK-008).
 */
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Image, KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, apiConfigurada, consultarCuentaConSenal, extra } from './src/api';
import { ProveedorDeApariencia, useApariencia, useAparienciaGuardada } from './src/apariencia';
import { BarraDeZonas, SEPARACION_DE_LA_BARRA, VeloDeLaBarra } from './src/barra-de-zonas';
import { almacenSeguro } from './src/almacen-seguro';
import { Cabecera } from './src/cabecera';
import { ProveedorDeCambios, preguntarAntesDeSalir } from './src/cambios-sin-guardar';
import { crearRegistroDeCambios, salirConCuidado } from './src/registro-de-cambios';
import { useCuentaDelEntrenamiento } from './src/entrenamiento-en-curso';
import { exigirVerificacion, memoria, useHayActualizaciones } from './src/lecturas';
import { MenuAuxiliar } from './src/menu-auxiliar';
import { alIniciarSesion, anterior, esRaiz, mismaPantalla, navegar, pestanaActiva, requiereSesion, sinBarraInferior, traePedido, type ModoDeNavegacion, type Ruta, type Salida } from './src/navegacion';
import { PantallaDeMiEvolucion } from './src/pantallas/antropometria';
import { PantallaDeComidaDiferente } from './src/pantallas/comida-diferente';
import { PantallaDeConsentimiento } from './src/pantallas/consentimiento';
import { PantallaDeCuenta } from './src/pantallas/cuenta';
import { PantallaDeEjecucionDeEntrenamiento, PantallaDeEntrenamiento, PantallaDeSesion } from './src/pantallas/entrenamiento';
import { PantallaDeFormularios, PantallaDeMiSolicitud } from './src/pantallas/formularios';
import { PantallaDeHistorial, PantallaDePlanDeEntrenamiento } from './src/pantallas/historial';
import { PantallaDeInicio } from './src/pantallas/inicio';
import { PantallaDeLogin } from './src/pantallas/login';
import { PantallaDeHoy, PantallaDePlanActual, PantallaDeRegistroNutricional, PantallaDeRegistros } from './src/pantallas/nutricion';
import { PantallaDeOpcionDeComida } from './src/pantallas/opcion-de-comida';
import { PantallaDePrivacidad } from './src/pantallas/privacidad';
import { PantallaDeRecuperacion, type FaseDeLaRecuperacion } from './src/pantallas/recuperacion';
import { PantallaDeRegistro } from './src/pantallas/registro';
import { PantallaDeVinculo } from './src/pantallas/vinculo';
import { PantallaDeVinculos } from './src/pantallas/vinculos';
import { crearRestauracionDeAltura } from './src/altura-de-las-zonas';
import { avisoDeVencimiento, crearSesion, olvidarSesion, quizasVencida, recordarSesion, restanteMs, sesionAlMontar, type Sesion } from './src/sesion-en-memoria';
import { AVISO_DE_SESION_NO_VALIDA, crearGuardaDeSesion, crearVigiaDeDemora, recuperarSesion, type CausaDeLaFalla, type CredencialGuardada, type Recuperacion, type TemporizadorDeDemora } from './src/sesion-persistente';
import { BARRA_DEL_SISTEMA } from './src/tema';
import { Aviso, Boton, Parrafo, estilosPorTema } from './src/ui';

const AVISOS: Record<Salida, string> = {
  'sesion-cerrada': 'Cerraste la sesión.',
  'sesiones-cerradas': 'Cerraste todas tus sesiones.',
  'sesion-no-valida': AVISO_DE_SESION_NO_VALIDA,
  // El de una sesión vencida se arma con la vigencia de esa sesión (avisoDeVencimiento, en sesion-en-memoria.ts).
  'sesion-vencida': avisoDeVencimiento(null),
  reautenticar: 'Por seguridad, volvé a iniciar sesión para confirmar esta acción.',
  'cierre-registrado': 'Solicitud de cierre registrada.',
};

/**
 * La credencial de la sesión en el almacenamiento seguro (DL-012). Vive fuera del árbol de React, como la sesión en
 * memoria: si Android recrea la pantalla, la fila de operaciones sigue siendo la misma.
 */
const guarda = crearGuardaDeSesion(almacenSeguro);

/** Mientras no se sabe si la credencial guardada sirve, no se muestra nada de la cuenta. */
type EstadoDeRecuperacion = { readonly tipo: 'verificando' } | { readonly tipo: 'sin-verificar'; readonly credencial: CredencialGuardada; readonly causa: CausaDeLaFalla };

/** El temporizador del umbral de demora de la recuperación (5 s): el de la plataforma. */
const TEMPORIZADOR_DE_DEMORA: TemporizadorDeDemora = {
  esperar(ms, alCumplirse) {
    const espera = setTimeout(alCumplirse, ms);
    return () => clearTimeout(espera);
  },
};

const version = Constants.expoConfig?.version ?? 'no declarada';
const commit = extra.commit ? extra.commit.slice(0, 7) : 'no declarado';

/**
 * La raíz guarda la apariencia: al cambiarla se vuelve a dibujar y con ella toda la app, con los colores del tema nuevo
 * y sin perder la pantalla ni la sesión. Hasta leer la preferencia guardada muestra solo el fondo, para que la app no
 * aparezca en un tema y cambie al otro.
 */
export default function App() {
  const apariencia = useAparienciaGuardada();
  if (!apariencia.lista) return <View style={estilos.raiz} />;
  return (
    <ProveedorDeApariencia value={apariencia}>
      <SafeAreaProvider>
        <Contenido />
      </SafeAreaProvider>
    </ProveedorDeApariencia>
  );
}

function Contenido() {
  const { tema } = useApariencia();
  // Inset inferior real del sistema (barra de navegación de Android edge-to-edge / home indicator de iOS).
  const insets = useSafeAreaInsets();
  // Si Android recreó la pantalla (por ejemplo, al cambiar el tamaño de letra), la sesión y la pantalla siguen en el
  // proceso: se vuelve a la misma. Si la sesión venció mientras tanto, se dice.
  const [alMontar] = useState(() => sesionAlMontar(performance.now(), Date.now()));
  const [ruta, setRuta] = useState<Ruta>(() =>
    alMontar.estado === 'vigente' ? alMontar.ruta : alMontar.estado === 'vencida' ? { nombre: 'login', aviso: avisoDeVencimiento(alMontar.sesion) } : { nombre: 'bienvenida' },
  );
  const [sesion, setSesion] = useState<Sesion | null>(alMontar.estado === 'vigente' ? alMontar.sesion : null);
  // Sin sesión en el proceso, se busca la credencial guardada y se verifica con la API antes de mostrar nada (DL-012).
  const [recuperacion, setRecuperacion] = useState<EstadoDeRecuperacion | null>(() => (alMontar.estado === 'ninguna' ? { tipo: 'verificando' } : null));
  const intentoDeRecuperacion = useRef(0);
  /** Si hay una verificación de la credencial en curso: no se lanza otra encima. */
  const verificando = useRef(false);
  // A los 5 s de comprobar sin respuesta, la pantalla dice que está tardando y ofrece reintentar. El pedido sigue.
  const [tardando, setTardando] = useState(false);
  const [vigiaDeDemora] = useState(() => crearVigiaDeDemora(TEMPORIZADOR_DE_DEMORA, () => setTardando(true)));
  // Si la sesión quedó guardada en el teléfono: Cuenta lo dice, y no promete recordarla si no se pudo guardar.
  const [recordada, setRecordada] = useState<boolean | null>(() => (alMontar.estado === 'vigente' ? guarda.recordada(alMontar.sesion.token) : null));
  const desplazamiento = useRef<ScrollView>(null);
  const hayActualizaciones = useHayActualizaciones();
  // El entrenamiento en curso guardado en el teléfono es de la cuenta con sesión: se abre con ella y se cierra al salir.
  useCuentaDelEntrenamiento(sesion);

  useEffect(() => {
    if (sesion) recordarSesion(sesion, ruta);
    else olvidarSesion();
  }, [sesion, ruta]);
  // Si al montar la sesión ya había vencido, también se olvida lo leído y lo elegido, y se borra la credencial guardada.
  useEffect(() => {
    if (alMontar.estado !== 'vigente') memoria.olvidarLaSesion();
    if (alMontar.estado === 'vencida') void guarda.borrar();
  }, [alMontar]);
  const sesionActual = useRef(sesion);
  sesionActual.current = sesion;

  // Cada raíz de la barra vuelve a la altura en que se la dejó; las demás pantallas abren arriba. Tocar la raíz en la que
  // ya se está lleva al principio, como en las apps. Una raíz que trae un pedido (registrar, una medida) abre arriba.
  const rutaActual = useRef(ruta);
  rutaActual.current = ruta;
  const alturaActual = useRef(0);
  const alturas = useRef(new Map<string, number>());
  const [restauracion] = useState(() => crearRestauracionDeAltura());
  const [menuAbierto, setMenuAbierto] = useState(false);
  // El alto real de la barra inferior, medido: el contenido deja ese espacio libre al final. 0 mientras no se ve.
  const [altoDeLaBarra, setAltoDeLaBarra] = useState(0);

  /** Muestra una pantalla ya resuelta. La usan `ir` (que resuelve el origen con `navegar`) y volver (con `anterior`). */
  const mostrar = useCallback(
    (r: Ruta) => {
      const desde = rutaActual.current;
      if (esRaiz(desde)) alturas.current.set(desde.nombre, desde.nombre === r.nombre ? 0 : alturaActual.current);
      const y = esRaiz(r) && !traePedido(r) ? (alturas.current.get(r.nombre) ?? 0) : 0;
      restauracion.pedir(y, performance.now());
      // Dos toques seguidos, antes de que la pantalla se vuelva a dibujar, parten de la pantalla nueva y no de la vieja.
      rutaActual.current = r;
      setMenuAbierto(false);
      setRuta(r);
      desplazamiento.current?.scrollTo({ y: 0, animated: false });
    },
    [restauracion],
  );

  /** Navegar: el destino recuerda de dónde se abrió, o hereda ese origen al reemplazar (src/navegacion.ts). */
  const ir = useCallback((destino: Ruta, modo: ModoDeNavegacion = 'ir') => mostrar(navegar(rutaActual.current, destino, modo)), [mostrar]);

  /** Volver a la pantalla anterior: la de origen o la madre de siempre. `false` si no hay, y decide el sistema. */
  const volver = useCallback(() => {
    const destino = anterior(rutaActual.current);
    if (!destino) return false;
    mostrar(destino);
    return true;
  }, [mostrar]);

  // Sin pérdidas silenciosas: si la pantalla tiene algo escrito sin guardar, salir por la barra, la cabecera, el avatar,
  // el menú o el botón atrás pregunta antes (src/cambios-sin-guardar.tsx).
  const [registroDeCambios] = useState(crearRegistroDeCambios);
  const conCuidado = useCallback((salir: () => void) => salirConCuidado(registroDeCambios, salir, preguntarAntesDeSalir), [registroDeCambios]);
  const irConCuidado = useCallback(
    (r: Ruta) => {
      // Ir a la pantalla en la que ya se está (tocar su destino en la barra, o el avatar en Cuenta) no la desmonta ni
      // pierde lo escrito: solo sube, sin preguntar.
      if (mismaPantalla(navegar(rutaActual.current, r), rutaActual.current)) return ir(r);
      conCuidado(() => ir(r));
    },
    [conCuidado, ir],
  );
  const volverConCuidado = useCallback(() => conCuidado(volver), [conCuidado, volver]);
  /** El botón atrás de Android: si hay adónde volver, lo consume, aunque la persona elija quedarse. */
  const atras = useCallback(() => {
    if (!anterior(rutaActual.current)) return false;
    volverConCuidado();
    return true;
  }, [volverConCuidado]);
  /**
   * «Volver a Información», dentro de una solicitud: va a Información aunque la solicitud se haya abierto desde Inicio
   * (antes llevaba al origen y el texto no coincidía), y pregunta si hay respuestas escritas sin enviar.
   */
  const volverAInformacion = useCallback(() => irConCuidado({ nombre: 'mis-solicitudes' }), [irConCuidado]);

  /**
   * Devuelve la zona a su altura cuando el contenido verificado ya alcanza, aunque la API tarde. Si la persona arrastra
   * la pantalla mientras tanto, o pasaron 10 s, se queda donde está (src/altura-de-las-zonas.ts).
   */
  const alCambiarElContenido = useCallback(
    (_ancho: number, alto: number) => {
      const y = restauracion.alCambiarElAlto(alto, performance.now());
      if (y !== null) desplazamiento.current?.scrollTo({ y, animated: false });
    },
    [restauracion],
  );

  /** Lleva la pantalla al principio, donde cada pantalla deja el resultado de una acción. */
  const subir = useCallback(() => {
    desplazamiento.current?.scrollTo({ y: 0, animated: true });
  }, []);

  /** Lleva la pantalla a una altura del contenido: por ejemplo, a las comidas cuando se llega desde «Registrar» en Inicio. */
  const llevarA = useCallback((y: number) => {
    desplazamiento.current?.scrollTo({ y: Math.max(0, y), animated: true });
  }, []);

  /**
   * Termina la sesión en la app: se olvidan el token, lo leído y lo elegido, y se borra la credencial guardada, antes de
   * cambiar de pantalla. Una recuperación que todavía estuviera en curso ya no cuenta.
   */
  const terminar = useCallback(
    (destino: Ruta) => {
      intentoDeRecuperacion.current++;
      void guarda.borrar();
      olvidarSesion();
      memoria.olvidarLaSesion();
      setSesion(null);
      setRecordada(null);
      registroDeCambios.olvidar();
      ir(destino);
    },
    [ir, registroDeCambios],
  );

  /**
   * Al abrir la app sin sesión en el proceso: la credencial guardada se verifica con la API (src/sesion-persistente.ts).
   * Hasta saberlo no se muestra nada de la cuenta. Si la persona eligió otra cosa mientras tanto, la respuesta se ignora.
   */
  const recuperar = useCallback(
    async (credencial?: CredencialGuardada) => {
      // Un solo pedido a la vez (precierre del 2026-10-06, §5): mientras una verificación sigue en curso, no se lanza otra.
      if (verificando.current) return;
      verificando.current = true;
      const intento = ++intentoDeRecuperacion.current;
      setRecuperacion({ tipo: 'verificando' });
      // Cada intento vuelve a contar los 5 s del aviso.
      setTardando(false);
      vigiaDeDemora.reiniciar();
      let resultado: Recuperacion | null;
      try {
        resultado = await recuperarSesion({
          guarda,
          verificar: (token, senal) => consultarCuentaConSenal(token, senal),
          credencial,
          ahora: () => ({ monotono: performance.now(), reloj: Date.now() }),
          sigueVigente: () => intento === intentoDeRecuperacion.current,
        });
      } finally {
        verificando.current = false;
      }
      if (!resultado || intento !== intentoDeRecuperacion.current) return;
      vigiaDeDemora.parar();
      setTardando(false);
      if (resultado.tipo === 'sin-verificar') {
        setRecuperacion({ tipo: 'sin-verificar', credencial: resultado.credencial, causa: resultado.causa });
        return;
      }
      setRecuperacion(null);
      if (resultado.tipo === 'recuperada') {
        memoria.olvidarLaSesion();
        alturas.current.clear();
        setSesion(resultado.sesion);
        setRecordada(true);
        ir(alIniciarSesion({ nombre: 'bienvenida' }));
      } else if (resultado.tipo === 'vencida') {
        ir({ nombre: 'login', aviso: avisoDeVencimiento({ vigenciaMs: resultado.vigenciaMs }) });
      } else if (resultado.tipo === 'no-valida') {
        ir({ nombre: 'login', aviso: resultado.aviso });
      }
    },
    [ir, vigiaDeDemora],
  );

  useEffect(() => {
    if (alMontar.estado === 'ninguna') void recuperar();
  }, [alMontar, recuperar]);

  /** «Iniciar sesión de nuevo» cuando no se pudo verificar: la persona elige no esperar, y la credencial se borra. */
  const iniciarDeNuevo = useCallback(() => {
    intentoDeRecuperacion.current++;
    vigiaDeDemora.parar();
    void guarda.borrar();
    setRecuperacion(null);
    ir({ nombre: 'login' });
  }, [ir, vigiaDeDemora]);

  // Al vencer, el token se descarta (la API lo rechazaría igual). Con la app en segundo plano el temporizador puede no
  // correr: al volver, si ya venció, se dice en ese momento y no recién con el primer pedido.
  useEffect(() => {
    if (!sesion) return;
    const vencer = () => terminar({ nombre: 'login', aviso: avisoDeVencimiento(sesion) });
    const t = setTimeout(vencer, Math.max(0, Math.min(restanteMs(sesion, performance.now(), Date.now()), 2_147_000_000)));
    const suscripcion = AppState.addEventListener('change', (momento) => {
      if (momento !== 'active') return;
      if (restanteMs(sesion, performance.now(), Date.now()) <= 0) vencer();
      // El teléfono durmió y el reloj de pared dice que la sesión pudo vencer: no se declara, pero ninguna pantalla
      // muestra lo confirmado sin volver a preguntar. La API decide (SESSION_EXPIRED) o, sin red, no se ve nada.
      else if (quizasVencida(sesion, Date.now())) exigirVerificacion();
    });
    return () => {
      clearTimeout(t);
      suscripcion.remove();
    };
  }, [sesion, terminar]);

  // Botón «atrás» de Android: vuelve a la pantalla de origen, o a la madre de siempre, y nunca cierra la sesión. Desde una
  // raíz de la barra lleva a Inicio; en Inicio y en Bienvenida no hay anterior y decide el sistema. Un menú, un diálogo
  // o un visor abiertos son `Modal` y se cierran antes, con su `onRequestClose`. Con algo escrito sin guardar, pregunta.
  // Se registra una sola vez: `atras` lee la pantalla actual de una referencia.
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', atras);
    return () => suscripcion.remove();
  }, [atras]);

  const salir = useCallback(
    (motivo: Salida) => {
      // Si Cuenta pidió volver a entrar para confirmar una acción, al iniciar sesión se vuelve a Cuenta (alIniciarSesion).
      // Un SESSION_EXPIRED de la API es un vencimiento comprobado: el aviso dice cuánto duraba esa sesión, si se sabe.
      const aviso = motivo === 'sesion-vencida' ? avisoDeVencimiento(sesionActual.current) : AVISOS[motivo];
      terminar(
        motivo === 'cierre-registrado'
          ? { nombre: 'bienvenida', aviso }
          : { nombre: 'login', aviso, ...(motivo === 'reautenticar' ? { alEntrar: 'cuenta' as const } : {}) },
      );
    },
    [terminar],
  );

  // Con sesión verificada: la barra, el avatar y el menú. Mientras se verifica una sesión guardada, nada de la cuenta.
  const conSesion = sesion !== null && recuperacion === null && requiereSesion(ruta);
  const raiz = esRaiz(ruta);
  // La sesión enfocada de entrenamiento va sin la barra (WP-ENTRENAMIENTO-SERIES §7.2); se sale con Volver o con atrás.
  const conBarra = conSesion && !sinBarraInferior(ruta);
  // La barra flota sobre el contenido: el contenido deja libre su alto real, el área segura y la separación.
  const espacioDeLaBarra = conBarra && altoDeLaBarra > 0 ? altoDeLaBarra + insets.bottom + SEPARACION_DE_LA_BARRA + 16 : 32 + insets.bottom;
  const faseDeLaRecuperacion: FaseDeLaRecuperacion | null = !recuperacion ? null : recuperacion.tipo === 'sin-verificar' ? { tipo: 'sin-verificar', causa: recuperacion.causa } : tardando ? { tipo: 'tardando' } : { tipo: 'comprobando' };

  return (
    // «padding» también en Android: con edge-to-edge (Expo SDK 54+) el sistema ya no achica la ventana al abrir el teclado
    // (adjustResize deja de tener efecto), así que sin esto el teclado tapa los campos de abajo (validación de la 0.11.2).
    <KeyboardAvoidingView style={estilos.raiz} behavior="padding">
      <Cabecera
        volverA={recuperacion || raiz ? null : anterior(ruta)}
        conMenu={conSesion && raiz}
        conAvatar={conSesion}
        actualizando={hayActualizaciones && sesion !== null}
        volver={volverConCuidado}
        abrirMenu={() => setMenuAbierto(true)}
        abrirCuenta={() => irConCuidado({ nombre: 'cuenta' })}
      />
      <ScrollView
        ref={desplazamiento}
        contentContainerStyle={[estilos.contenido, { paddingBottom: espacioDeLaBarra }]}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          alturaActual.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={100}
        onScrollBeginDrag={restauracion.alArrastrar}
        onContentSizeChange={alCambiarElContenido}
      >
        <ProveedorDeCambios registro={registroDeCambios}>
          {!apiConfigurada ? <Aviso tipo="error" titulo="Este build no tiene una API configurada." /> : null}

          {recuperacion && faseDeLaRecuperacion ? (
            <PantallaDeRecuperacion
              fase={faseDeLaRecuperacion}
              reintentar={() => void recuperar(recuperacion.tipo === 'sin-verificar' ? recuperacion.credencial : undefined)}
              iniciarDeNuevo={iniciarDeNuevo}
            />
          ) : null}

          {!recuperacion && ruta.nombre === 'bienvenida' ? (
            <View>
              <Image source={ISOTIPO} style={estilos.isotipoGrande} accessible={false} />
              <Text style={estilos.lema}>BE · Better Everyday</Text>
              <Text style={estilos.tituloBienvenida} accessibilityRole="header">
                Plataforma integrada de inteligencia en salud
              </Text>
              {ruta.aviso ? <Aviso tipo="info" titulo={ruta.aviso} /> : null}
              <Boton texto="Crear cuenta" onPress={() => ir({ nombre: 'registro' })} />
              <Boton texto="Iniciar sesión" tipo="secundario" onPress={() => ir({ nombre: 'login' })} />
              <Parrafo tenue>Ambiente de prueba: usá solo datos sintéticos. No ingreses datos reales de personas.</Parrafo>
              <Text style={estilos.identidad}>
                app {version} · {extra.appEnv ?? 'ambiente no declarado'} · commit {commit}
              </Text>
            </View>
          ) : null}

          {ruta.nombre === 'registro' ? <PantallaDeRegistro irALogin={() => ir({ nombre: 'login' })} mostrarAviso={subir} /> : null}

          {ruta.nombre === 'login' ? (
            <PantallaDeLogin
              aviso={ruta.aviso}
              irARegistro={() => ir({ nombre: 'registro' })}
              alIniciar={(token, expiresAt, identidadId, fechaDelServidor) => {
                intentoDeRecuperacion.current++;
                memoria.olvidarLaSesion();
                alturas.current.clear();
                const nueva = crearSesion({ token, identidadId, expiresAt, fechaDelServidor }, performance.now(), Date.now());
                setSesion(nueva);
                setRecordada(null);
                // La credencial va al almacenamiento seguro. Si no se pudo guardar, Cuenta lo dice: no se promete recordarla.
                void guarda.guardar({ token, identidadId, expiresAt, vigenciaMs: nueva.vigenciaMs }).then((guardada) => {
                  if (sesionActual.current?.token === token) setRecordada(guardada);
                });
                ir(alIniciarSesion(ruta));
              }}
            />
          ) : null}

          {requiereSesion(ruta) && sesion ? (
            <>
              {/* Volver, sin depender del botón ni de un gesto del sistema (10-B10 §9), está en la cabecera. */}
              {ruta.nombre === 'inicio' ? <PantallaDeInicio token={sesion.token} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'cuenta' ? <PantallaDeCuenta token={sesion.token} salir={salir} ir={ir} sesionRecordada={recordada} /> : null}
              {ruta.nombre === 'vinculos' ? <PantallaDeVinculos token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} subir={subir} /> : null}
              {ruta.nombre === 'vinculo' ? (
                <PantallaDeVinculo key={ruta.id} token={sesion.token} identidadId={sesion.identidadId} id={ruta.id} salir={salir} ir={ir} volver={volver} subir={subir} />
              ) : null}
              {ruta.nombre === 'consentimiento' ? (
                <PantallaDeConsentimiento key={ruta.vinculoId} token={sesion.token} vinculoId={ruta.vinculoId} salir={salir} ir={ir} volver={volver} subir={subir} />
              ) : null}
              {ruta.nombre === 'hoy' ? <PantallaDeHoy token={sesion.token} salir={salir} ir={ir} subir={subir} accion={ruta.accion} llevarA={llevarA} /> : null}
              {ruta.nombre === 'plan-actual' ? <PantallaDePlanActual token={sesion.token} salir={salir} /> : null}
              {ruta.nombre === 'registros-nutricionales' ? <PantallaDeRegistros token={sesion.token} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'registro-nutricional' ? <PantallaDeRegistroNutricional key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'opcion-de-comida' ? (
                <PantallaDeOpcionDeComida
                  key={`${ruta.id}:${ruta.registroId ?? ''}`}
                  token={sesion.token}
                  opcionId={ruta.id}
                  comidaId={ruta.comidaId}
                  registroId={ruta.registroId}
                  salir={salir}
                  ir={ir}
                  volver={volver}
                />
              ) : null}
              {ruta.nombre === 'comida-diferente' ? (
                <PantallaDeComidaDiferente
                  key={ruta.comidaId}
                  token={sesion.token}
                  planId={ruta.planId}
                  diaTipoId={ruta.diaTipoId}
                  comidaId={ruta.comidaId}
                  comida={ruta.comida}
                  fecha={ruta.fecha}
                  salir={salir}
                  ir={ir}
                  volver={volver}
                />
              ) : null}
              {ruta.nombre === 'mi-evolucion' ? <PantallaDeMiEvolucion token={sesion.token} salir={salir} ir={ir} vista={ruta.vista} metrica={ruta.metrica} /> : null}
              {ruta.nombre === 'entrenamiento' ? <PantallaDeEntrenamiento token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'sesion-de-entrenamiento' ? (
                <PantallaDeSesion
                  key={ruta.draftId}
                  token={sesion.token}
                  draftId={ruta.draftId}
                  occurrenceId={ruta.occurrenceId}
                  sesion={ruta.sesion}
                  fechaDeLaSesion={ruta.fecha}
                  modo={ruta.modo}
                  etiqueta={ruta.etiqueta}
                  salir={salir}
                  ir={ir}
                  subir={subir}
                />
              ) : null}
              {ruta.nombre === 'ejecucion-de-entrenamiento' ? <PantallaDeEjecucionDeEntrenamiento key={ruta.id} token={sesion.token} id={ruta.id} avisoInicial={ruta.aviso} salir={salir} /> : null}
              {ruta.nombre === 'historial-de-entrenamiento' ? <PantallaDeHistorial token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'plan-de-entrenamiento' ? <PantallaDePlanDeEntrenamiento key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} /> : null}
              {ruta.nombre === 'mis-solicitudes' ? <PantallaDeFormularios token={sesion.token} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'mi-solicitud' ? <PantallaDeMiSolicitud key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} volver={volverAInformacion} ir={ir} /> : null}
              {ruta.nombre === 'privacidad' ? <PantallaDePrivacidad token={sesion.token} salir={salir} ir={ir} volver={volver} /> : null}
            </>
          ) : null}
          {requiereSesion(ruta) && !sesion ? (
            <Aviso tipo="info" titulo={AVISOS['sesion-no-valida']}>
              <Boton texto="Iniciar sesión" onPress={() => ir({ nombre: 'login' })} />
            </Aviso>
          ) : null}
        </ProveedorDeCambios>
      </ScrollView>
      {/* La barra flota sobre el final del contenido, que deja libre su alto (espacioDeLaBarra). Resalta la raíz donde
          empezó el camino hasta esta pantalla; en Cuenta, ninguna. */}
      {/* DL-118: un velo del color del fondo detrás de la cápsula, desde donde termina el espacio libre del contenido. Lo
          que pasa por detrás no compite con los destinos, y el último contenido queda entero por encima. */}
      {conBarra && altoDeLaBarra > 0 ? <VeloDeLaBarra alto={altoDeLaBarra + insets.bottom + SEPARACION_DE_LA_BARRA + 16} /> : null}
      {conSesion ? <BarraDeZonas actual={pestanaActiva(ruta)} ir={irConCuidado} alMedir={setAltoDeLaBarra} oculta={!conBarra} /> : null}
      <MenuAuxiliar
        visible={menuAbierto && conSesion && raiz}
        cerrar={() => setMenuAbierto(false)}
        elegir={(r) => {
          // El menú se cierra antes de preguntar: si la persona elige quedarse, queda en la pantalla, sin el menú encima.
          setMenuAbierto(false);
          irConCuidado(r);
        }}
      />
      {/* Los íconos de la barra del sistema: claros sobre Azul noche, oscuros sobre Claro. */}
      <StatusBar style={BARRA_DEL_SISTEMA[tema]} />
    </KeyboardAvoidingView>
  );
}

const ISOTIPO = require('./assets/isotipo.png');

const estilos = estilosPorTema((COLOR) => ({
  raiz: { flex: 1, backgroundColor: COLOR.fondo },
  // El margen inferior se completa en el contentContainerStyle con el alto de la barra y el inset real del sistema
  // (safe-area-context): Android es edge-to-edge desde Expo SDK 54 y el ScrollView llega por detrás de la barra de
  // navegación.
  contenido: { padding: 20 },
  isotipoGrande: { width: 180, height: 180, alignSelf: 'center', marginTop: 16 },
  lema: { fontSize: 14, fontWeight: '800', letterSpacing: 3, color: COLOR.acento, textAlign: 'center', marginTop: 12 },
  tituloBienvenida: { fontSize: 26, fontWeight: '700', color: COLOR.texto, marginVertical: 12, textAlign: 'center' },
  identidad: { fontSize: 12, color: COLOR.tenue, marginTop: 32 },
}));
