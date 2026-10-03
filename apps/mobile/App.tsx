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
 * Desde la etapa de UI y UX (Dirección, 2026-10-01), con sesión se navega con la barra inferior: Nutrición,
 * Entrenamiento, Evolución, Información y Cuenta (src/barra-de-zonas.tsx). Al iniciar sesión, la APK abre en Nutrición.
 * La sesión (Bearer) y el identificador de la identidad viven en memoria, fuera del árbol de React
 * (src/sesion-en-memoria.ts): un cambio de tamaño de letra hace que Android recree la pantalla, y no pierde la sesión.
 * La credencial se guarda además en el almacenamiento seguro del teléfono hasta que vence (DL-012, decisión de
 * Dirección del 2026-10-03; src/sesion-persistente.ts). Si el sistema cierra el proceso o la persona cierra la app, al
 * abrirla se verifica con la API antes de mostrar nada protegido. No se guarda la contraseña ni hay renovación.
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
import { api, apiConfigurada, extra } from './src/api';
import { ProveedorDeApariencia, useApariencia, useAparienciaGuardada } from './src/apariencia';
import { BarraDeZonas } from './src/barra-de-zonas';
import { almacenSeguro } from './src/almacen-seguro';
import { Cargando, LineaDeActualizacion } from './src/estados';
import { exigirVerificacion, memoria, useHayActualizaciones } from './src/lecturas';
import { alIniciarSesion, anterior, esPrincipal, requiereSesion, textoDeVolverA, zonaDe, type Ruta, type Salida } from './src/navegacion';
import { PantallaDeMiEvolucion } from './src/pantallas/antropometria';
import { PantallaDeConsentimiento } from './src/pantallas/consentimiento';
import { PantallaDeCuenta } from './src/pantallas/cuenta';
import { PantallaDeEjecucionDeEntrenamiento, PantallaDeEntrenamiento, PantallaDeSesion } from './src/pantallas/entrenamiento';
import { PantallaDeFormularios, PantallaDeMiSolicitud } from './src/pantallas/formularios';
import { PantallaDeHistorial, PantallaDePlanDeEntrenamiento } from './src/pantallas/historial';
import { PantallaDeLogin } from './src/pantallas/login';
import { PantallaDeHoy, PantallaDePlanActual, PantallaDeRegistroNutricional, PantallaDeRegistros } from './src/pantallas/nutricion';
import { PantallaDePrivacidad } from './src/pantallas/privacidad';
import { PantallaDeRegistro } from './src/pantallas/registro';
import { PantallaDeVinculo } from './src/pantallas/vinculo';
import { PantallaDeVinculos } from './src/pantallas/vinculos';
import { crearRestauracionDeAltura } from './src/altura-de-las-zonas';
import { avisoDeVencimiento, crearSesion, olvidarSesion, quizasVencida, recordarSesion, restanteMs, sesionAlMontar, type Sesion } from './src/sesion-en-memoria';
import { AVISO_DE_SESION_NO_VALIDA, crearGuardaDeSesion, recuperarSesion, type CredencialGuardada, type Recuperacion } from './src/sesion-persistente';
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
type EstadoDeRecuperacion = { readonly tipo: 'verificando' } | { readonly tipo: 'sin-verificar'; readonly credencial: CredencialGuardada; readonly sinConexion: boolean };

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
  // Si la sesión quedó guardada en el teléfono: Cuenta lo dice, y no promete recordarla si no se pudo guardar.
  const [recordada, setRecordada] = useState<boolean | null>(() => (alMontar.estado === 'vigente' ? guarda.recordada(alMontar.sesion.token) : null));
  const desplazamiento = useRef<ScrollView>(null);
  const hayActualizaciones = useHayActualizaciones();

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

  // Cada zona principal vuelve a la altura en que se la dejó; las demás pantallas abren arriba. Tocar la zona en la que
  // ya se está lleva al principio, como en las apps.
  const rutaActual = useRef(ruta);
  rutaActual.current = ruta;
  const alturaActual = useRef(0);
  const alturas = useRef(new Map<string, number>());
  const [restauracion] = useState(() => crearRestauracionDeAltura());

  const ir = useCallback((r: Ruta) => {
    const desde = rutaActual.current;
    if (esPrincipal(desde)) alturas.current.set(desde.nombre, desde.nombre === r.nombre ? 0 : alturaActual.current);
    const y = esPrincipal(r) ? (alturas.current.get(r.nombre) ?? 0) : 0;
    restauracion.pedir(y, performance.now());
    setRuta(r);
    desplazamiento.current?.scrollTo({ y: 0, animated: false });
  }, [restauracion]);

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
      ir(destino);
    },
    [ir],
  );

  /**
   * Al abrir la app sin sesión en el proceso: la credencial guardada se verifica con la API (src/sesion-persistente.ts).
   * Hasta saberlo no se muestra nada de la cuenta. Si la persona eligió otra cosa mientras tanto, la respuesta se ignora.
   */
  const recuperar = useCallback(
    async (credencial?: CredencialGuardada) => {
      const intento = ++intentoDeRecuperacion.current;
      setRecuperacion({ tipo: 'verificando' });
      const resultado: Recuperacion | null = await recuperarSesion({
        guarda,
        verificar: (token) => api.consultarCuenta(token),
        credencial,
        ahora: () => ({ monotono: performance.now(), reloj: Date.now() }),
        sigueVigente: () => intento === intentoDeRecuperacion.current,
      });
      if (!resultado || intento !== intentoDeRecuperacion.current) return;
      if (resultado.tipo === 'sin-verificar') {
        setRecuperacion({ tipo: 'sin-verificar', credencial: resultado.credencial, sinConexion: resultado.sinConexion });
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
    [ir],
  );

  useEffect(() => {
    if (alMontar.estado === 'ninguna') void recuperar();
  }, [alMontar, recuperar]);

  /** «Iniciar sesión de nuevo» cuando no se pudo verificar: la persona elige no esperar, y la credencial se borra. */
  const iniciarDeNuevo = useCallback(() => {
    intentoDeRecuperacion.current++;
    void guarda.borrar();
    setRecuperacion(null);
    ir({ nombre: 'login' });
  }, [ir]);

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

  // Botón «atrás» de Android: vuelve a la pantalla lógica anterior (src/navegacion.ts) y nunca cierra la sesión. Desde
  // una zona principal de la barra lleva a Nutrición; en Nutrición y en Bienvenida no hay anterior y decide el sistema.
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      const destino = anterior(ruta);
      if (!destino) return false;
      ir(destino);
      return true;
    });
    return () => suscripcion.remove();
  }, [ruta, ir]);

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

  const destinoAnterior = anterior(ruta);
  const volver = () => {
    if (destinoAnterior) ir(destinoAnterior);
  };
  // La barra inferior, solo con sesión: resalta la zona de la pantalla, también en sus subpantallas.
  const zona = sesion ? zonaDe(ruta) : null;

  return (
    // «padding» también en Android: con edge-to-edge (Expo SDK 54+) el sistema ya no achica la ventana al abrir el teclado
    // (adjustResize deja de tener efecto), así que sin esto el teclado tapa los campos de abajo (validación de la 0.11.2).
    <KeyboardAvoidingView style={estilos.raiz} behavior="padding">
      <View style={estilos.barra}>
        {/* El isotipo es decorativo: la marca ya la dice el texto «BE». */}
        {/* Compacto: con la letra al máximo, el encabezado ocupaba mucho (prueba de la 0.13.1). La marca y el aviso del
            ambiente crecen hasta 1,15 veces, y el aviso usa dos líneas a la derecha en vez de bajar debajo de la marca.
            El contenido de cada pantalla crece sin tope. */}
        <View style={estilos.marcaConIsotipo}>
          <Image source={ISOTIPO} style={estilos.isotipoChico} accessible={false} />
          <Text style={estilos.marca} accessibilityLabel="BE" maxFontSizeMultiplier={1.15}>
            BE
          </Text>
        </View>
        <Text style={estilos.ambiente} numberOfLines={2} maxFontSizeMultiplier={1.15}>
          Ambiente de prueba · solo datos sintéticos
        </Text>
        <LineaDeActualizacion activa={hayActualizaciones && sesion !== null} />
      </View>
      {/* Con la barra inferior, el área segura de abajo la cubre la barra; sin ella, el contenido deja ese margen. */}
      <ScrollView
        ref={desplazamiento}
        contentContainerStyle={[estilos.contenido, { paddingBottom: zona ? 24 : 32 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          alturaActual.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={100}
        onScrollBeginDrag={restauracion.alArrastrar}
        onContentSizeChange={alCambiarElContenido}
      >
        {!apiConfigurada ? <Aviso tipo="error" titulo="Este build no tiene una API configurada." /> : null}

        {recuperacion ? (
          <PantallaDeRecuperacion
            estado={recuperacion}
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
            {/* Volver sin depender del botón ni de un gesto del sistema (10-B10 §9). Las zonas principales no lo llevan:
                se llega a ellas desde la barra. */}
            {destinoAnterior && !esPrincipal(ruta) ? <Boton texto={textoDeVolverA(destinoAnterior)} tipo="enlace" onPress={volver} /> : null}
            {ruta.nombre === 'cuenta' ? <PantallaDeCuenta token={sesion.token} salir={salir} ir={ir} sesionRecordada={recordada} /> : null}
            {ruta.nombre === 'vinculos' ? <PantallaDeVinculos token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} subir={subir} /> : null}
            {ruta.nombre === 'vinculo' ? (
              <PantallaDeVinculo key={ruta.id} token={sesion.token} identidadId={sesion.identidadId} id={ruta.id} salir={salir} ir={ir} volver={volver} subir={subir} />
            ) : null}
            {ruta.nombre === 'consentimiento' ? (
              <PantallaDeConsentimiento key={ruta.vinculoId} token={sesion.token} vinculoId={ruta.vinculoId} salir={salir} ir={ir} volver={volver} subir={subir} />
            ) : null}
            {ruta.nombre === 'hoy' ? <PantallaDeHoy token={sesion.token} salir={salir} ir={ir} subir={subir} /> : null}
            {ruta.nombre === 'plan-actual' ? <PantallaDePlanActual token={sesion.token} salir={salir} /> : null}
            {ruta.nombre === 'registros-nutricionales' ? <PantallaDeRegistros token={sesion.token} salir={salir} ir={ir} /> : null}
            {ruta.nombre === 'registro-nutricional' ? <PantallaDeRegistroNutricional key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} /> : null}
            {ruta.nombre === 'mi-evolucion' ? <PantallaDeMiEvolucion token={sesion.token} salir={salir} ir={ir} /> : null}
            {ruta.nombre === 'entrenamiento' ? <PantallaDeEntrenamiento token={sesion.token} salir={salir} ir={ir} /> : null}
            {ruta.nombre === 'sesion-de-entrenamiento' ? (
              <PantallaDeSesion key={ruta.draftId} token={sesion.token} draftId={ruta.draftId} sesion={ruta.sesion} fechaDeLaSesion={ruta.fecha} salir={salir} ir={ir} subir={subir} />
            ) : null}
            {ruta.nombre === 'ejecucion-de-entrenamiento' ? <PantallaDeEjecucionDeEntrenamiento key={ruta.id} token={sesion.token} id={ruta.id} avisoInicial={ruta.aviso} salir={salir} /> : null}
            {ruta.nombre === 'historial-de-entrenamiento' ? <PantallaDeHistorial token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} /> : null}
            {ruta.nombre === 'plan-de-entrenamiento' ? <PantallaDePlanDeEntrenamiento key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} /> : null}
            {ruta.nombre === 'mis-solicitudes' ? <PantallaDeFormularios token={sesion.token} salir={salir} ir={ir} /> : null}
            {ruta.nombre === 'mi-solicitud' ? <PantallaDeMiSolicitud key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} volver={volver} ir={ir} /> : null}
            {ruta.nombre === 'privacidad' ? <PantallaDePrivacidad token={sesion.token} salir={salir} ir={ir} volver={volver} /> : null}
          </>
        ) : null}
        {requiereSesion(ruta) && !sesion ? (
          <Aviso tipo="info" titulo={AVISOS['sesion-no-valida']}>
            <Boton texto="Iniciar sesión" onPress={() => ir({ nombre: 'login' })} />
          </Aviso>
        ) : null}
      </ScrollView>
      {/* Fuera del ScrollView: queda fija abajo y no tapa contenido, porque el ScrollView termina donde ella empieza. */}
      {zona ? <BarraDeZonas actual={zona} ir={ir} /> : null}
      {/* Los íconos de la barra del sistema: claros sobre Azul noche, oscuros sobre Claro. */}
      <StatusBar style={BARRA_DEL_SISTEMA[tema]} />
    </KeyboardAvoidingView>
  );
}

/**
 * Mientras se verifica la credencial guardada: no se muestra nada de la cuenta, ni de la anterior. Si no se pudo
 * verificar (sin red, 429, 5xx), la credencial sigue guardada y se puede reintentar.
 */
function PantallaDeRecuperacion({ estado, reintentar, iniciarDeNuevo }: { estado: EstadoDeRecuperacion; reintentar: () => void; iniciarDeNuevo: () => void }) {
  if (estado.tipo === 'verificando') {
    return (
      <View accessibilityLiveRegion="polite">
        <Parrafo tenue>Verificando tu sesión guardada…</Parrafo>
        <Cargando forma="lista" />
      </View>
    );
  }
  return (
    <Aviso tipo="info" titulo="No pudimos verificar tu sesión">
      <Parrafo>{`${estado.sinConexion ? 'Parece que no hay conexión.' : 'El servicio no respondió.'} Tu sesión sigue guardada en este teléfono: probá de nuevo en un momento.`}</Parrafo>
      <Boton texto="Reintentar" onPress={reintentar} />
      <Boton texto="Iniciar sesión de nuevo" tipo="secundario" onPress={iniciarDeNuevo} />
    </Aviso>
  );
}

const ISOTIPO = require('./assets/isotipo.png');

const estilos = estilosPorTema((COLOR) => ({
  raiz: { flex: 1, backgroundColor: COLOR.fondo },
  barra: {
    paddingTop: Constants.statusBarHeight + 6,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: COLOR.fondo,
    borderBottomWidth: 2,
    borderBottomColor: COLOR.acento,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  marcaConIsotipo: { flexDirection: 'row', alignItems: 'center' },
  isotipoChico: { width: 26, height: 26, marginRight: 6 },
  marca: { fontSize: 20, fontWeight: '800', color: COLOR.texto, letterSpacing: 1 },
  ambiente: { flex: 1, fontSize: 12, lineHeight: 15, color: COLOR.tenue, textAlign: 'right' },
  // El margen inferior se completa con el inset real del sistema (safe-area-context) en el contentContainerStyle:
  // Android es edge-to-edge desde Expo SDK 54 y el ScrollView llega por detrás de la barra de navegación.
  contenido: { padding: 20 },
  isotipoGrande: { width: 180, height: 180, alignSelf: 'center', marginTop: 16 },
  lema: { fontSize: 14, fontWeight: '800', letterSpacing: 3, color: COLOR.acento, textAlign: 'center', marginTop: 12 },
  tituloBienvenida: { fontSize: 26, fontWeight: '700', color: COLOR.texto, marginVertical: 12, textAlign: 'center' },
  identidad: { fontSize: 12, color: COLOR.tenue, marginTop: 32 },
}));
