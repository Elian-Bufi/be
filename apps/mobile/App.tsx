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
 * La sesión (Bearer) y el identificador de la identidad viven solo en memoria (DL-012, T5): cerrar la app exige volver a
 * iniciar sesión. Nunca se guarda un «rol autorizado» en el cliente: la API verifica la sesión y decide cada acceso en
 * cada request; ocultar un botón no concede ni quita nada.
 * Identidad del build visible en Bienvenida (07 §34, TEST-APK-008).
 */
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiConfigurada, extra } from './src/api';
import { anterior, requiereSesion, textoDeVolverA, type Ruta, type Salida } from './src/navegacion';
import { PantallaDeMiEvolucion } from './src/pantallas/antropometria';
import { PantallaDeConsentimiento } from './src/pantallas/consentimiento';
import { PantallaDeCuenta } from './src/pantallas/cuenta';
import { PantallaDeEjecucionDeEntrenamiento, PantallaDeEntrenamiento, PantallaDeSesion } from './src/pantallas/entrenamiento';
import { PantallaDeFormularios, PantallaDeMiSolicitud } from './src/pantallas/formularios';
import { PantallaDeLogin } from './src/pantallas/login';
import { PantallaDeHoy, PantallaDePlanActual, PantallaDeRegistroNutricional, PantallaDeRegistros } from './src/pantallas/nutricion';
import { PantallaDePrivacidad } from './src/pantallas/privacidad';
import { PantallaDeRegistro } from './src/pantallas/registro';
import { PantallaDeVinculo } from './src/pantallas/vinculo';
import { PantallaDeVinculos } from './src/pantallas/vinculos';
import { Aviso, Boton, COLOR, Parrafo } from './src/ui';

const AVISOS: Record<Salida, string> = {
  'sesion-cerrada': 'Cerraste la sesión.',
  'sesiones-cerradas': 'Cerraste todas tus sesiones.',
  'sesion-no-valida': 'La sesión ya no es válida. Iniciá sesión para continuar.',
  reautenticar: 'Por seguridad, volvé a iniciar sesión para confirmar esta acción.',
  'cierre-registrado': 'Solicitud de cierre registrada.',
};

const version = Constants.expoConfig?.version ?? 'no declarada';
const commit = extra.commit ? extra.commit.slice(0, 7) : 'no declarado';

interface Sesion {
  readonly token: string;
  readonly expiraEn: number;
  readonly identidadId: string;
}

export default function App() {
  const [ruta, setRuta] = useState<Ruta>({ nombre: 'bienvenida' });
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const desplazamiento = useRef<ScrollView>(null);

  const ir = useCallback((r: Ruta) => {
    setRuta(r);
    desplazamiento.current?.scrollTo({ y: 0, animated: false });
  }, []);

  /** Lleva la pantalla al principio, donde cada pantalla deja el resultado de una acción. */
  const subir = useCallback(() => {
    desplazamiento.current?.scrollTo({ y: 0, animated: true });
  }, []);

  // Al vencer, el token se descarta (la API lo rechazaría igual).
  useEffect(() => {
    if (!sesion) return;
    const t = setTimeout(() => {
      setSesion(null);
      ir({ nombre: 'login', aviso: AVISOS['sesion-no-valida'] });
    }, Math.max(0, Math.min(sesion.expiraEn - Date.now(), 2_147_000_000)));
    return () => clearTimeout(t);
  }, [sesion, ir]);

  // Botón «atrás» de Android: vuelve a la pantalla lógica anterior (src/navegacion.ts) y nunca cierra la sesión. En
  // Bienvenida y en Cuenta no hay anterior y decide el sistema.
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
      setSesion(null);
      ir(motivo === 'cierre-registrado' ? { nombre: 'bienvenida', aviso: AVISOS[motivo] } : { nombre: 'login', aviso: AVISOS[motivo] });
    },
    [ir],
  );

  const destinoAnterior = anterior(ruta);
  const volver = () => {
    if (destinoAnterior) ir(destinoAnterior);
  };

  return (
    <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.barra}>
        <Text style={estilos.marca} accessibilityLabel="BE">
          BE
        </Text>
        <Text style={estilos.ambiente}>Ambiente de prueba · solo datos sintéticos</Text>
      </View>
      <ScrollView ref={desplazamiento} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        {!apiConfigurada ? <Aviso tipo="error" titulo="Este build no tiene una API configurada." /> : null}

        {ruta.nombre === 'bienvenida' ? (
          <View>
            <Text style={estilos.wordmark} accessibilityLabel="BE">
              BE
            </Text>
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
            alIniciar={(token, expiresAt, identidadId) => {
              setSesion({ token, expiraEn: new Date(expiresAt).getTime(), identidadId });
              ir({ nombre: 'cuenta' });
            }}
          />
        ) : null}

        {requiereSesion(ruta) && sesion ? (
          <>
            {/* Volver sin depender del botón ni de un gesto del sistema (10-B10 §9). */}
            {destinoAnterior ? <Boton texto={textoDeVolverA(destinoAnterior)} tipo="enlace" onPress={volver} /> : null}
            {ruta.nombre === 'cuenta' ? <PantallaDeCuenta token={sesion.token} salir={salir} ir={ir} /> : null}
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
            {ruta.nombre === 'mi-evolucion' ? <PantallaDeMiEvolucion token={sesion.token} salir={salir} /> : null}
            {ruta.nombre === 'entrenamiento' ? <PantallaDeEntrenamiento token={sesion.token} salir={salir} ir={ir} /> : null}
            {ruta.nombre === 'sesion-de-entrenamiento' ? (
              <PantallaDeSesion key={ruta.draftId} token={sesion.token} draftId={ruta.draftId} sesion={ruta.sesion} fechaDeLaSesion={ruta.fecha} salir={salir} ir={ir} subir={subir} />
            ) : null}
            {ruta.nombre === 'ejecucion-de-entrenamiento' ? <PantallaDeEjecucionDeEntrenamiento key={ruta.id} token={sesion.token} id={ruta.id} avisoInicial={ruta.aviso} salir={salir} /> : null}
            {ruta.nombre === 'mis-solicitudes' ? <PantallaDeFormularios token={sesion.token} salir={salir} ir={ir} /> : null}
            {ruta.nombre === 'mi-solicitud' ? <PantallaDeMiSolicitud key={ruta.id} token={sesion.token} id={ruta.id} salir={salir} /> : null}
            {ruta.nombre === 'privacidad' ? <PantallaDePrivacidad token={sesion.token} salir={salir} ir={ir} volver={volver} /> : null}
          </>
        ) : null}
        {requiereSesion(ruta) && !sesion ? (
          <Aviso tipo="info" titulo={AVISOS['sesion-no-valida']}>
            <Boton texto="Iniciar sesión" onPress={() => ir({ nombre: 'login' })} />
          </Aviso>
        ) : null}
      </ScrollView>
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#ffffff' },
  barra: {
    paddingTop: Constants.statusBarHeight + 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderTopWidth: 6,
    borderTopColor: COLOR.azul,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.borde,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  marca: { fontSize: 24, fontWeight: '800', color: COLOR.azul },
  ambiente: { fontSize: 12, color: COLOR.tenue },
  contenido: { padding: 20, paddingBottom: 48 },
  wordmark: { fontSize: 88, fontWeight: '800', color: COLOR.azul, letterSpacing: -2, marginTop: 24 },
  tituloBienvenida: { fontSize: 24, fontWeight: '700', color: COLOR.texto, marginVertical: 12 },
  identidad: { fontSize: 12, color: COLOR.tenue, marginTop: 32 },
});
