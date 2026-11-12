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
 * Desde DL-117 (Dirección, 2026-10-04), con sesión se navega con la barra inferior (src/barra-de-zonas.tsx). Desde
 * DL-166 (PV-1, 2026-11-07) sus destinos son Inicio, Nutrición, Entrenamiento, Evolución y Perfil: Perfil reemplaza a
 * «Información» y absorbe Cuenta y el menú auxiliar, y la cabecera única queda con la marca y Novedades
 * (src/cabecera.tsx). Perfil lleva un punto mientras haya algo para responder (src/marca-de-perfil.ts). Al iniciar
 * sesión, la APK abre en Inicio. Cada detalle recuerda de dónde se abrió, y volver lleva ahí (src/navegacion.ts).
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
 * - WP-NOVEDADES-Y-AVISOS (DL-133; RF-061 y RF-062): la campana de la cabecera abre Novedades y dice cuántas hay sin
 *   leer; tocar un aviso de BE también abre Novedades (con la sesión, o después de iniciarla: el aviso no muestra nada,
 *   UC-E08 E03). Con los avisos activos para la cuenta, al entrar se renueva el token del teléfono.
 * - WP-INVITACION (DL-136): el enlace de una invitación (App Link del website o be://) abre la pantalla de la invitación;
 *   sin sesión, queda pendiente hasta iniciarla, igual que un aviso tocado.
 * - WP-FORMULARIOS-RONDA-2 (FR-01): lo escrito en un formulario se guarda cifrado en el teléfono, por cuenta y por
 *   solicitud (src/formularios-en-el-telefono.ts). Cerrar la sesión desde Cuenta lo borra; una sesión vencida, no.
 * - WP-USO-FINAL (DL-169), UF-01: con cada sesión (al iniciarla, con Google o al recuperar la guardada), la raíz pregunta
 *   qué falta para seguir (API-ACC-07). Mientras falte algo, muestra «Antes de seguir» en lugar de la app, sin barra, sin
 *   campana y sin volver (src/nombre-obligatorio.ts, src/pantallas/antes-de-seguir.tsx). UF-08: los avisos de prueba
 *   salen del ambiente del build (src/ambiente.ts).
 * Identidad del build visible en Bienvenida (07 §34, TEST-APK-008).
 */
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { AVISOS_DE_PRUEBA, type SecretoDeInvitacionRequest } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Image, KeyboardAvoidingView, Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVISOS_DE_PRUEBA_VISIBLES } from './src/ambiente';
import { api, apiConfigurada, consultarCuentaConSenal, extra, loQueFaltaParaSeguirConTope } from './src/api';
import { ProveedorDeApariencia, useApariencia, useAparienciaGuardada } from './src/apariencia';
import { BarraDeZonas, SEPARACION_DE_LA_BARRA, VeloDeLaBarra } from './src/barra-de-zonas';
import { almacenSeguro } from './src/almacen-seguro';
import { esAvisoDeBe, renovar } from './src/avisos';
import { invitacionDelEnlace } from './src/enlace-de-invitacion';
import { PantallaDeInvitacion } from './src/pantallas/invitacion';
import { avisoQueAbrioLaApp, dependenciasDeAvisos, escucharAvisosRecibidos, escucharAvisosTocados } from './src/avisos-del-telefono';
import { Cabecera } from './src/cabecera';
import { ProveedorDeCambios, preguntarAntesDeSalir } from './src/cambios-sin-guardar';
import { crearRegistroDeCambios, salirConCuidado } from './src/registro-de-cambios';
import { useCuentaDelEntrenamiento, useHayEntrenamientoEnCurso } from './src/entrenamiento-en-curso';
import { borraLosBorradores } from './src/borrador-de-formulario';
import { borradoresDeFormularios } from './src/formularios-en-el-telefono';
import { exigirVerificacion, memoria, useHayActualizaciones } from './src/lecturas';
import { cancelarAvisoDelDescanso } from './src/avisos-del-telefono';
import { FilaFijaDeLaSesion, useFilaFija } from './src/fila-fija';
import { marcaEnPerfil, useMarcaEnPerfil } from './src/marca-de-perfil';
import {
  TOPE_DE_LO_QUE_FALTA_MS,
  compuertaAlEmpezar,
  compuertaConLaRespuesta,
  compuertaEnMemoria,
  dejaSeguir,
  vuelveAPreguntar,
  type Compuerta,
  type MomentoDeLaPregunta,
} from './src/nombre-obligatorio';
import { paraResponder } from './src/perfil';
import { alIniciarSesion, anterior, esRaiz, mismaPantalla, navegar, pestanaActiva, requiereSesion, sinBarraInferior, traePedido, type ModoDeNavegacion, type Ruta, type Salida } from './src/navegacion';
import type { AlIniciar } from './src/pantallas/acceso-con-google';
import { PantallaAntesDeSeguir } from './src/pantallas/antes-de-seguir';
import { PantallaDeMiEvolucion } from './src/pantallas/antropometria';
import { PantallaDeComidaDiferente } from './src/pantallas/comida-diferente';
import { PantallaDeConsentimiento } from './src/pantallas/consentimiento';
import { PantallaDeCuenta } from './src/pantallas/cuenta';
import { PantallaDeCorreccion } from './src/pantallas/correccion-de-entrenamiento';
import { PantallaDeEjecucionDeEntrenamiento, PantallaDeEntrenamiento, PantallaDeSesion } from './src/pantallas/entrenamiento';
import { PantallaDeFormularios, PantallaDeMiSolicitud } from './src/pantallas/formularios';
import { PantallaDeHistorial, PantallaDePlanDeEntrenamiento } from './src/pantallas/historial';
import { PantallaDeInicio } from './src/pantallas/inicio';
import { PantallaDeLogin } from './src/pantallas/login';
import { PantallaDeMisHabitos } from './src/pantallas/mis-habitos';
import { PantallaDeNovedades } from './src/pantallas/novedades';
import { PantallaDeHoy, PantallaDePlanActual, PantallaDeRegistroNutricional, PantallaDeRegistros } from './src/pantallas/nutricion';
import { PantallaDeOpcionDeComida } from './src/pantallas/opcion-de-comida';
import { PantallaDePerfil } from './src/pantallas/perfil';
import { PantallaDeQuienVeQue } from './src/pantallas/quien-ve-que';
import { PantallaDePrivacidad } from './src/pantallas/privacidad';
import { PantallaDeRecuperacion, type FaseDeLaRecuperacion } from './src/pantallas/recuperacion';
import { PantallaDeRegistro } from './src/pantallas/registro';
import { PantallaDeRegistroRapido } from './src/pantallas/registro-rapido';
import { PantallaDeRevision, PantallaDeRevisiones } from './src/pantallas/revisiones';
import { PantallaDeNotasDeCoordinacion } from './src/pantallas/notas-de-coordinacion';
import { PantallaDeVinculo } from './src/pantallas/vinculo';
import { PantallaDeVinculos } from './src/pantallas/vinculos';
import { crearRestauracionDeAltura } from './src/altura-de-las-zonas';
import { avisoDeVencimiento, crearSesion, olvidarSesion, quizasVencida, recordarSesion, restanteMs, sesionAlMontar, type Sesion } from './src/sesion-en-memoria';
import { useAltoContraste } from './src/alto-contraste';
import { FondoDeLaApp } from './src/fondo-de-la-app';
import { ProveedorDeVidrio } from './src/vidrio';
import { AVISO_DE_SESION_NO_VALIDA, crearGuardaDeSesion, crearVigiaDeDemora, recuperarSesion, type CausaDeLaFalla, type CredencialGuardada, type Recuperacion, type TemporizadorDeDemora } from './src/sesion-persistente';
import { BARRA_DEL_SISTEMA } from './src/tema';
import { Icono, type NombreDeIcono } from './src/icono';
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
  if (!apariencia.lista) return <View style={[estilos.raiz, estilos.raizLisa]} />;
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
  // DL-170: con el «Texto de alto contraste» de Android, el vidrio vuelve a ser opaco y el fondo, liso.
  const altoContraste = useAltoContraste();
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
  // UF-01 (DL-169, UF-D4): «Antes de seguir». Una sesión nueva empieza preguntando qué falta (API-ACC-07), y mientras
  // falte algo no se muestra la app. Si Android recreó la pantalla con la compuerta ya abierta, no se vuelve a preguntar.
  const [compuerta, setCompuerta] = useState<Compuerta>(() => (alMontar.estado === 'vigente' ? compuertaAlEmpezar(alMontar.sesion.token) : { tipo: 'preguntando' }));
  const compuertaActual = useRef(compuerta);
  compuertaActual.current = compuerta;
  /** La sesión con la que hay una pregunta en curso: de a una por vez. */
  const preguntandoCon = useRef<string | null>(null);
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
  // El alto real de la barra inferior, medido: el contenido deja ese espacio libre al final. 0 mientras no se ve.
  const [altoDeLaBarra, setAltoDeLaBarra] = useState(0);
  // DL-166 (PV-11): el alto de la fila fija de la sesión, que va apilada sobre la barra. 0 mientras no se ve.
  const [altoDeLaFila, setAltoDeLaFila] = useState(0);
  // DL-133: las novedades sin leer, para la campana; `null` mientras no se sabe. Y si un aviso tocado espera la sesión.
  const [sinLeer, setSinLeer] = useState<number | null>(null);
  const avisoPendiente = useRef(esAvisoDeBe(avisoQueAbrioLaApp()));
  /** DL-136: la invitación de un enlace que llegó sin sesión; se abre al iniciarla. */
  const invitacionPendiente = useRef<SecretoDeInvitacionRequest | null>(null);

  /** Muestra una pantalla ya resuelta. La usan `ir` (que resuelve el origen con `navegar`) y volver (con `anterior`). */
  const mostrar = useCallback(
    (r: Ruta) => {
      const desde = rutaActual.current;
      if (esRaiz(desde)) alturas.current.set(desde.nombre, desde.nombre === r.nombre ? 0 : alturaActual.current);
      const y = esRaiz(r) && !traePedido(r) ? (alturas.current.get(r.nombre) ?? 0) : 0;
      restauracion.pedir(y, performance.now());
      // Dos toques seguidos, antes de que la pantalla se vuelva a dibujar, parten de la pantalla nueva y no de la vieja.
      rutaActual.current = r;
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

  // Sin pérdidas silenciosas: si la pantalla tiene algo escrito sin guardar, salir por la barra, la cabecera o el botón
  // atrás pregunta antes (src/cambios-sin-guardar.tsx).
  const [registroDeCambios] = useState(crearRegistroDeCambios);
  const conCuidado = useCallback((salir: () => void) => salirConCuidado(registroDeCambios, salir, preguntarAntesDeSalir), [registroDeCambios]);
  const irConCuidado = useCallback(
    (r: Ruta) => {
      // Ir a la pantalla en la que ya se está (tocar su destino en la barra) no la desmonta ni pierde lo escrito: solo
      // sube, sin preguntar.
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
   * «Volver a Formularios y pedidos», dentro de una solicitud: va a la bandeja aunque la solicitud se haya abierto desde
   * Inicio, y pregunta si hay respuestas escritas sin enviar.
   */
  const volverAFormularios = useCallback(() => irConCuidado({ nombre: 'mis-solicitudes' }), [irConCuidado]);

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
      marcaEnPerfil.olvidar();
      // La sesión que venga vuelve a preguntar qué falta para seguir (UF-01).
      compuertaEnMemoria.olvidar();
      // Cerrar la sesión cancela el aviso de un descanso que estuviera corriendo (DL-166, AV-12).
      void cancelarAvisoDelDescanso();
      setSesion(null);
      setRecordada(null);
      setCompuerta({ tipo: 'preguntando' });
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
        // La sesión recuperada también pregunta qué falta antes de mostrar la app (UF-01): la espera sigue igual.
        setCompuerta(compuertaAlEmpezar(resultado.sesion.token));
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

  /** DL-133: cuántas novedades hay sin leer, para la campana. Una lectura liviana: una novedad y el conteo. */
  const actualizarSinLeer = useCallback(async () => {
    const actual = sesionActual.current;
    if (!actual) return;
    const r = await api.consultarNovedades(actual.token, { limit: '1' });
    if (r.ok && sesionActual.current?.token === actual.token) setSinLeer(r.datos.unreadCount);
  }, []);

  /**
   * DL-166 (PV-6): la marca de Perfil, con las mismas lecturas que «Para responder» en Inicio y en Perfil. Se pide al
   * entrar, al volver del segundo plano y al salir de una solicitud o de «Mis hábitos», donde se responde. Inicio y Perfil
   * también la fijan con sus lecturas. Una falla no cambia la marca: no se afirma nada sin saberlo.
   */
  const actualizarMarca = useCallback(async () => {
    const actual = sesionActual.current;
    if (!actual) return;
    const [f, h, p] = await Promise.all([
      api.miBandejaDeFormularios(actual.token, { status: 'PENDING', limit: '1' }),
      api.misHabitos(actual.token),
      api.pedidosDeAccesoAMisHabitos(actual.token),
    ]);
    if (!f.ok || !h.ok || !p.ok || sesionActual.current?.token !== actual.token) return;
    marcaEnPerfil.fijar(paraResponder(f.datos.data, h.datos.data, p.datos.data));
  }, []);
  const rutaAnterior = useRef(ruta.nombre);
  useEffect(() => {
    const antes = rutaAnterior.current;
    rutaAnterior.current = ruta.nombre;
    if ((antes === 'mi-solicitud' || antes === 'mis-habitos') && antes !== ruta.nombre) void actualizarMarca();
  }, [ruta.nombre, actualizarMarca]);

  // Con sesión: el número de la campana, el token del teléfono renovado si la cuenta tiene los avisos activos, y un aviso
  // tocado antes de iniciar sesión, que ahora abre Novedades. Al volver del segundo plano o al llegar un aviso, el número
  // se vuelve a pedir.
  const tokenDeLaSesion = sesion?.token ?? null;
  useEffect(() => {
    const actual = sesionActual.current;
    if (!tokenDeLaSesion || !actual) {
      setSinLeer(null);
      return;
    }
    void actualizarSinLeer();
    void actualizarMarca();
    void renovar(dependenciasDeAvisos, { token: actual.token, identidadId: actual.identidadId }).catch(() => undefined);
    if (avisoPendiente.current) {
      avisoPendiente.current = false;
      ir({ nombre: 'novedades' });
    }
    if (invitacionPendiente.current) {
      const secreto = invitacionPendiente.current;
      invitacionPendiente.current = null;
      ir({ nombre: 'invitacion', secreto });
    }
    const alVolver = AppState.addEventListener('change', (momento) => {
      if (momento === 'active') {
        void actualizarSinLeer();
        void actualizarMarca();
      }
    });
    const alLlegar = escucharAvisosRecibidos(() => void actualizarSinLeer());
    return () => {
      alVolver.remove();
      alLlegar();
    };
  }, [tokenDeLaSesion, actualizarSinLeer, actualizarMarca, ir]);

  // DL-136: el enlace de una invitación, con la app cerrada (el enlace que la abrió) o abierta. Con sesión, abre la
  // invitación; sin sesión, queda pendiente: no se interrumpe la verificación de una credencial guardada.
  useEffect(() => {
    const abrir = (url: string | null) => {
      const secreto = invitacionDelEnlace(url);
      if (!secreto) return;
      if (sesionActual.current) ir({ nombre: 'invitacion', secreto });
      else invitacionPendiente.current = secreto;
    };
    void Linking.getInitialURL().then(abrir).catch(() => undefined);
    const suscripcion = Linking.addEventListener('url', ({ url }) => abrir(url));
    return () => suscripcion.remove();
  }, [ir]);

  // Tocar un aviso de BE abre Novedades; sin sesión, queda pendiente hasta iniciarla (el aviso no muestra nada).
  useEffect(
    () =>
      escucharAvisosTocados((datos) => {
        if (!esAvisoDeBe(datos)) return;
        if (sesionActual.current) ir({ nombre: 'novedades' });
        else avisoPendiente.current = true;
      }),
    [ir],
  );

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
      // Si Cerrar mi cuenta pidió volver a entrar para confirmar el cierre, al iniciar sesión se vuelve ahí (alIniciarSesion).
      // Un SESSION_EXPIRED de la API es un vencimiento comprobado: el aviso dice cuánto duraba esa sesión, si se sabe.
      const aviso = motivo === 'sesion-vencida' ? avisoDeVencimiento(sesionActual.current) : AVISOS[motivo];
      // FR-01 · cerrar la sesión (o pedir el cierre de la cuenta) borra del teléfono lo escrito en los formularios de esa
      // cuenta. Una sesión vencida no: la persona no eligió salir, y al volver a entrar lo recupera.
      const cuenta = sesionActual.current?.identidadId;
      if (cuenta && borraLosBorradores(motivo)) void borradoresDeFormularios.borrarDeLaCuenta(cuenta);
      terminar(
        motivo === 'cierre-registrado'
          ? { nombre: 'bienvenida', aviso }
          : { nombre: 'login', aviso, ...(motivo === 'reautenticar' ? { alEntrar: 'cuenta' as const } : {}) },
      );
    },
    [terminar],
  );

  /**
   * UF-01 (DL-169, UF-D4): pregunta qué falta para seguir (API-ACC-07), de a una pregunta por vez y con tope. Lo que se
   * muestra con la respuesta lo decide `compuertaConLaRespuesta`, según el momento: al entrar, la pantalla espera; de nuevo
   * (la app ya se usa, porque no se supo) o después de guardar el nombre, la pantalla sigue como está hasta la respuesta.
   */
  const preguntar = useCallback(
    async (token: string, momento: MomentoDeLaPregunta) => {
      if (preguntandoCon.current === token) return;
      preguntandoCon.current = token;
      if (momento === 'al-entrar') setCompuerta({ tipo: 'preguntando' });
      let respuesta: Awaited<ReturnType<typeof loQueFaltaParaSeguirConTope>>;
      try {
        respuesta = await loQueFaltaParaSeguirConTope(token, TOPE_DE_LO_QUE_FALTA_MS);
      } finally {
        if (preguntandoCon.current === token) preguntandoCon.current = null;
      }
      // Si mientras tanto la sesión terminó o cambió, la respuesta ya no corresponde.
      if (sesionActual.current?.token !== token) return;
      const siguiente = compuertaConLaRespuesta(momento, respuesta);
      if (!siguiente) return;
      if (siguiente.tipo === 'sesion-perdida') return salir(siguiente.motivo);
      if (siguiente.tipo === 'abierta') compuertaEnMemoria.abrir(token);
      setCompuerta(siguiente);
    },
    [salir],
  );

  // Con cada sesión, la pregunta de «Antes de seguir»; abierta en este proceso (Android recreó la pantalla), no se repite.
  useEffect(() => {
    if (!tokenDeLaSesion || compuertaEnMemoria.abierta(tokenDeLaSesion)) return;
    void preguntar(tokenDeLaSesion, 'al-entrar');
  }, [tokenDeLaSesion, preguntar]);

  // Sin saber qué falta (no hubo respuesta al entrar), la app se usa con lo guardado y vuelve a preguntar al volver al
  // primer plano y al cambiar de pantalla: la primera respuesta de la API decide.
  useEffect(() => {
    if (!tokenDeLaSesion || !vuelveAPreguntar(compuerta)) return;
    const token = tokenDeLaSesion;
    const alVolver = AppState.addEventListener('change', (momento) => {
      if (momento === 'active') void preguntar(token, 'de-nuevo');
    });
    return () => alVolver.remove();
  }, [compuerta, tokenDeLaSesion, preguntar]);
  useEffect(() => {
    const actual = sesionActual.current;
    if (actual && vuelveAPreguntar(compuertaActual.current)) void preguntar(actual.token, 'de-nuevo');
  }, [ruta, preguntar]);

  /** «Antes de seguir» guardó el nombre: se vuelve a preguntar qué falta y, con nada, entra (UF-01). */
  const alGuardarElNombre = useCallback(async () => {
    const actual = sesionActual.current;
    if (actual) await preguntar(actual.token, 'despues-de-guardar');
  }, [preguntar]);

  // «Antes de seguir» en lugar de la app, mientras falte algo o se esté preguntando (UF-01). Es una raíz: no se saltea, y
  // no lleva volver ni la barra.
  const enAntesDeSeguir = sesion !== null && recuperacion === null && requiereSesion(ruta) && !dejaSeguir(compuerta);
  // Con sesión verificada y nada pendiente: la barra y la campana. Mientras se verifica una sesión guardada, nada de la cuenta.
  const conSesion = sesion !== null && recuperacion === null && requiereSesion(ruta) && dejaSeguir(compuerta);
  const raiz = esRaiz(ruta) || enAntesDeSeguir;
  // Desde PA-02, también la sesión de entrenamiento lleva la barra: lo escrito queda guardado en el teléfono.
  const conBarra = conSesion && !sinBarraInferior(ruta);
  const entrenamientoEnCurso = useHayEntrenamientoEnCurso();
  const conMarcaEnPerfil = useMarcaEnPerfil();
  // DL-166 (PV-11): durante la sesión en vivo, la fila de acciones y la barra van fijas, apiladas y opacas; nada flota.
  const filaDeLaSesion = useFilaFija();
  const enLaSesion = conBarra && filaDeLaSesion !== null;
  // La barra flota sobre el contenido: el contenido deja libre su alto real, el área segura y la separación. Fijas, el
  // contenido deja libre el alto de las dos (la barra fija ya incluye el área segura).
  const espacioDeLaBarra = enLaSesion
    ? altoDeLaBarra + altoDeLaFila + 16
    : conBarra && altoDeLaBarra > 0
      ? altoDeLaBarra + insets.bottom + SEPARACION_DE_LA_BARRA + 16
      : 32 + insets.bottom;
  const faseDeLaRecuperacion: FaseDeLaRecuperacion | null = !recuperacion ? null : recuperacion.tipo === 'sin-verificar' ? { tipo: 'sin-verificar', causa: recuperacion.causa } : tardando ? { tipo: 'tardando' } : { tipo: 'comprobando' };

  /**
   * La sesión nueva, de Iniciar sesión o de Google (DL-138: entrar, vincular o crear la cuenta desde Iniciar sesión o desde
   * Crear cuenta). Es la misma sesión de BE, venga de donde venga, y sigue el mismo camino.
   */
  const entrar: AlIniciar = (token, expiresAt, identidadId, fechaDelServidor) => {
    intentoDeRecuperacion.current++;
    memoria.olvidarLaSesion();
    alturas.current.clear();
    const nueva = crearSesion({ token, identidadId, expiresAt, fechaDelServidor }, performance.now(), Date.now());
    setSesion(nueva);
    setRecordada(null);
    // Antes de mostrar la app, la pregunta de «Antes de seguir» (UF-01): la sesión nueva no hereda la compuerta de otra.
    setCompuerta(compuertaAlEmpezar(token));
    // La credencial va al almacenamiento seguro. Si no se pudo guardar, Cuenta lo dice: no se promete recordarla.
    void guarda.guardar({ token, identidadId, expiresAt, vigenciaMs: nueva.vigenciaMs }).then((guardada) => {
      if (sesionActual.current?.token === token) setRecordada(guardada);
    });
    ir(alIniciarSesion(ruta));
  };

  return (
    // DL-170 (§3.3): el vidrio se prende solo en Inicio hasta el visto bueno de Dirección a la muestra (AV2-26).
    <ProveedorDeVidrio activo={ruta.nombre === 'inicio'} altoContraste={altoContraste}>
    {/* «padding» también en Android: con edge-to-edge (Expo SDK 54+) el sistema ya no achica la ventana al abrir el teclado
        (adjustResize deja de tener efecto), así que sin esto el teclado tapa los campos de abajo (validación de la 0.11.2).
        La raíz no pinta el fondo: lo dibuja FondoDeLaApp, su primer hijo, salvo con alto contraste. */}
    <KeyboardAvoidingView style={[estilos.raiz, altoContraste && estilos.raizLisa]} behavior="padding">
      <FondoDeLaApp />
      <Cabecera
        volverA={recuperacion || raiz ? null : anterior(ruta)}
        conLogo={raiz}
        conSesion={conSesion}
        actualizando={hayActualizaciones && sesion !== null}
        volver={volverConCuidado}
        sinLeer={conSesion ? sinLeer : null}
        abrirNovedades={() => irConCuidado({ nombre: 'novedades' })}
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
              {/* Las tres áreas, con los íconos de la barra: lo que hay adentro, antes de entrar. */}
              <View style={estilos.areasDeBienvenida} accessible accessibilityLabel={AREAS_DE_LA_BIENVENIDA.map((a) => a.texto).join(', ')}>
                {AREAS_DE_LA_BIENVENIDA.map((a) => (
                  <View key={a.icono} style={estilos.areaDeBienvenida}>
                    <Icono nombre={a.icono} tamano={24} tono="acento" />
                    <Text style={estilos.textoDeArea}>{a.texto}</Text>
                  </View>
                ))}
              </View>
              {ruta.aviso ? <Aviso tipo="info" titulo={ruta.aviso} /> : null}
              <Boton texto="Crear cuenta" onPress={() => ir({ nombre: 'registro' })} />
              <Boton texto="Iniciar sesión" tipo="secundario" onPress={() => ir({ nombre: 'login' })} />
              {/* UF-08: el aviso de prueba, solo en las builds que lo muestran; la identidad del build sigue siempre. */}
              {AVISOS_DE_PRUEBA_VISIBLES ? (
                <Parrafo tenue icono="info">
                  {AVISOS_DE_PRUEBA.general}
                </Parrafo>
              ) : null}
              <Text style={estilos.identidad}>
                app {version} · {extra.appEnv ?? 'ambiente no declarado'} · commit {commit}
              </Text>
            </View>
          ) : null}

          {ruta.nombre === 'registro' ? <PantallaDeRegistro irALogin={() => ir({ nombre: 'login' })} mostrarAviso={subir} alIniciar={entrar} /> : null}

          {ruta.nombre === 'login' ? <PantallaDeLogin aviso={ruta.aviso} irARegistro={() => ir({ nombre: 'registro' })} alIniciar={entrar} subir={subir} /> : null}

          {/* UF-01 (DL-169): mientras falte algo para seguir, o mientras se pregunta, «Antes de seguir» en lugar de la app. */}
          {enAntesDeSeguir && sesion ? (
            <PantallaAntesDeSeguir key={sesion.token} compuerta={compuerta} token={sesion.token} identidadId={sesion.identidadId} salir={salir} alGuardar={alGuardarElNombre} />
          ) : null}

          {requiereSesion(ruta) && sesion && dejaSeguir(compuerta) ? (
            <>
              {/* Volver, sin depender del botón ni de un gesto del sistema (10-B10 §9), está en la cabecera. */}
              {ruta.nombre === 'inicio' ? <PantallaDeInicio token={sesion.token} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'perfil' ? <PantallaDePerfil token={sesion.token} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'quien-ve-que' ? <PantallaDeQuienVeQue token={sesion.token} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'cuenta' ? (
                <PantallaDeCuenta key={ruta.seccion ?? 'datos'} token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} seccion={ruta.seccion} sesionRecordada={recordada} />
              ) : null}
              {ruta.nombre === 'novedades' ? <PantallaDeNovedades token={sesion.token} salir={salir} ir={ir} alCambiarSinLeer={setSinLeer} /> : null}
              {ruta.nombre === 'vinculos' ? <PantallaDeVinculos token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} subir={subir} /> : null}
              {ruta.nombre === 'notas-de-coordinacion' ? <PantallaDeNotasDeCoordinacion token={sesion.token} salir={salir} /> : null}
              {ruta.nombre === 'invitacion' ? (
                <PantallaDeInvitacion key={ruta.secreto ? JSON.stringify(ruta.secreto) : 'codigo'} token={sesion.token} secreto={ruta.secreto} salir={salir} ir={ir} />
              ) : null}
              {ruta.nombre === 'vinculo' ? (
                <PantallaDeVinculo key={ruta.id} token={sesion.token} identidadId={sesion.identidadId} id={ruta.id} salir={salir} ir={ir} volver={volver} subir={subir} />
              ) : null}
              {ruta.nombre === 'consentimiento' ? (
                <PantallaDeConsentimiento key={ruta.vinculoId} token={sesion.token} vinculoId={ruta.vinculoId} salir={salir} ir={ir} volver={volver} subir={subir} />
              ) : null}
              {ruta.nombre === 'hoy' ? <PantallaDeHoy token={sesion.token} salir={salir} ir={ir} subir={subir} accion={ruta.accion} comida={ruta.comida} llevarA={llevarA} /> : null}
              {ruta.nombre === 'plan-actual' ? <PantallaDePlanActual token={sesion.token} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'revisiones' ? <PantallaDeRevisiones key={ruta.area} token={sesion.token} area={ruta.area} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'revision' ? <PantallaDeRevision key={ruta.id} token={sesion.token} area={ruta.area} id={ruta.id} salir={salir} /> : null}
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
              {ruta.nombre === 'ejecucion-de-entrenamiento' ? <PantallaDeEjecucionDeEntrenamiento key={ruta.id} token={sesion.token} id={ruta.id} avisoInicial={ruta.aviso} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'corregir-ejecucion' ? <PantallaDeCorreccion key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'registro-rapido' ? (
                <PantallaDeRegistroRapido
                  key={ruta.occurrenceId}
                  token={sesion.token}
                  occurrenceId={ruta.occurrenceId}
                  fecha={ruta.fecha}
                  etiqueta={ruta.etiqueta}
                  sessionId={ruta.sessionId}
                  planId={ruta.planId}
                  salir={salir}
                  ir={ir}
                  volver={volver}
                  subir={subir}
                />
              ) : null}
              {ruta.nombre === 'historial-de-entrenamiento' ? <PantallaDeHistorial token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'plan-de-entrenamiento' ? <PantallaDePlanDeEntrenamiento key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} /> : null}
              {ruta.nombre === 'mis-solicitudes' ? <PantallaDeFormularios token={sesion.token} identidadId={sesion.identidadId} salir={salir} ir={ir} /> : null}
              {ruta.nombre === 'mi-solicitud' ? <PantallaDeMiSolicitud key={ruta.id} token={sesion.token} identidadId={sesion.identidadId} id={ruta.id} salir={salir} volver={volverAFormularios} ir={ir} subir={subir} /> : null}
              {ruta.nombre === 'mis-habitos' ? <PantallaDeMisHabitos token={sesion.token} salir={salir} ir={ir} subir={subir} /> : null}
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
          empezó el camino hasta esta pantalla; en Novedades, ninguna. */}
      {/* DL-118: un velo del color del fondo detrás de la cápsula, desde donde termina el espacio libre del contenido. Lo
          que pasa por detrás no compite con los destinos, y el último contenido queda entero por encima. */}
      {conBarra && altoDeLaBarra > 0 && !enLaSesion ? <VeloDeLaBarra alto={altoDeLaBarra + insets.bottom + SEPARACION_DE_LA_BARRA + 16} /> : null}
      {enLaSesion && filaDeLaSesion ? <FilaFijaDeLaSesion fila={filaDeLaSesion} abajo={altoDeLaBarra} alMedir={setAltoDeLaFila} /> : null}
      {conSesion ? <BarraDeZonas actual={pestanaActiva(ruta)} ir={irConCuidado} alMedir={setAltoDeLaBarra} oculta={!conBarra} entrenamientoEnCurso={entrenamientoEnCurso} marcaEnPerfil={conMarcaEnPerfil} fija={enLaSesion} /> : null}
      {/* Los íconos de la barra del sistema: claros sobre Azul noche, oscuros sobre Claro. */}
      <StatusBar style={BARRA_DEL_SISTEMA[tema]} />
    </KeyboardAvoidingView>
    </ProveedorDeVidrio>
  );
}

const ISOTIPO = require('./assets/isotipo.png');

/** Las áreas de BE en la bienvenida, con el ícono y el nombre de la barra. */
const AREAS_DE_LA_BIENVENIDA: readonly { readonly icono: NombreDeIcono; readonly texto: string }[] = [
  { icono: 'nutricion', texto: 'Nutrición' },
  { icono: 'entrenamiento', texto: 'Entrenamiento' },
  { icono: 'antropometria', texto: 'Evolución' },
];

const estilos = estilosPorTema((COLOR) => ({
  // Sin fondo propio: lo dibuja FondoDeLaApp (DL-170). Liso solo mientras se lee la apariencia y con alto contraste.
  raiz: { flex: 1 },
  raizLisa: { backgroundColor: COLOR.fondo },
  // El margen inferior se completa en el contentContainerStyle con el alto de la barra y el inset real del sistema
  // (safe-area-context): Android es edge-to-edge desde Expo SDK 54 y el ScrollView llega por detrás de la barra de
  // navegación.
  contenido: { padding: 20 },
  isotipoGrande: { width: 180, height: 180, alignSelf: 'center', marginTop: 16 },
  lema: { fontSize: 14, fontWeight: '800', letterSpacing: 3, color: COLOR.acento, textAlign: 'center', marginTop: 12 },
  areasDeBienvenida: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: 20, rowGap: 8, marginBottom: 12 },
  areaDeBienvenida: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoDeArea: { fontSize: 15, fontWeight: '600', color: COLOR.texto },
  tituloBienvenida: { fontSize: 26, fontWeight: '700', color: COLOR.texto, marginVertical: 12, textAlign: 'center' },
  identidad: { fontSize: 12, color: COLOR.tenue, marginTop: 32 },
}));
