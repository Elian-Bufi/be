/**
 * APK BE — WP-02: Bienvenida · Crear cuenta · Iniciar sesión · Cuenta (docs/paquetes/WP-02.md §5).
 * La sesión (Bearer) vive solo en memoria (DL-012, T5): cerrar la app exige volver a iniciar sesión. Nunca se guarda un
 * «rol autorizado» en el cliente: la API verifica la sesión en cada request.
 * Identidad del build visible en Bienvenida (07 §34, TEST-APK-008).
 */
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiConfigurada, extra } from './src/api';
import { PantallaDeCuenta, type Salida } from './src/pantallas/cuenta';
import { PantallaDeLogin } from './src/pantallas/login';
import { PantallaDeRegistro } from './src/pantallas/registro';
import { Aviso, Boton, COLOR, Parrafo } from './src/ui';

type Ruta = { nombre: 'bienvenida'; aviso?: string } | { nombre: 'registro' } | { nombre: 'login'; aviso?: string } | { nombre: 'cuenta' };

const AVISOS: Record<Salida, string> = {
  'sesion-cerrada': 'Cerraste la sesión.',
  'sesiones-cerradas': 'Cerraste todas tus sesiones.',
  'sesion-no-valida': 'La sesión ya no es válida. Iniciá sesión para continuar.',
  reautenticar: 'Por seguridad, volvé a iniciar sesión para confirmar esta acción.',
  'cierre-registrado': 'Solicitud de cierre registrada.',
};

const version = Constants.expoConfig?.version ?? 'no declarada';
const commit = extra.commit ? extra.commit.slice(0, 7) : 'no declarado';

export default function App() {
  const [ruta, setRuta] = useState<Ruta>({ nombre: 'bienvenida' });
  const [sesion, setSesion] = useState<{ token: string; expiraEn: number } | null>(null);
  const desplazamiento = useRef<ScrollView>(null);

  const ir = useCallback((r: Ruta) => {
    setRuta(r);
    desplazamiento.current?.scrollTo({ y: 0, animated: false });
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

  // Botón «atrás» de Android: vuelve a Bienvenida desde las pantallas públicas; en Cuenta no cierra la sesión.
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ruta.nombre === 'registro' || ruta.nombre === 'login') {
        ir({ nombre: 'bienvenida' });
        return true;
      }
      return false;
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

        {ruta.nombre === 'registro' ? (
          <PantallaDeRegistro irALogin={() => ir({ nombre: 'login' })} mostrarAviso={() => desplazamiento.current?.scrollTo({ y: 0, animated: true })} />
        ) : null}

        {ruta.nombre === 'login' ? (
          <PantallaDeLogin
            aviso={ruta.aviso}
            irARegistro={() => ir({ nombre: 'registro' })}
            alIniciar={(token, expiresAt) => {
              setSesion({ token, expiraEn: new Date(expiresAt).getTime() });
              ir({ nombre: 'cuenta' });
            }}
          />
        ) : null}

        {ruta.nombre === 'cuenta' && sesion ? <PantallaDeCuenta token={sesion.token} salir={salir} /> : null}
        {ruta.nombre === 'cuenta' && !sesion ? (
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
