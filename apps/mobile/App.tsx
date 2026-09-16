import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

interface IdentidadBuild {
  appEnv?: string;
  commit?: string | null;
  construidoEn?: string | null;
}

const extra = (Constants.expoConfig?.extra ?? {}) as IdentidadBuild;
const version = Constants.expoConfig?.version ?? 'no declarada';
const commit = extra.commit ? extra.commit.slice(0, 7) : 'no declarado';

export default function App() {
  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.wordmark} accessibilityLabel="BE">
        BE
      </Text>
      <Text style={estilos.titulo}>BE — en construcción</Text>
      <Text style={estilos.bajada}>Plataforma integrada de inteligencia en salud</Text>
      <Text style={estilos.identidad}>
        app {version} · {extra.appEnv ?? 'ambiente no declarado'} · commit {commit}
      </Text>
      <StatusBar style="dark" />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderTopWidth: 6,
    borderTopColor: '#1F5BC4',
  },
  wordmark: { fontSize: 88, fontWeight: '800', color: '#1F5BC4', letterSpacing: -2 },
  titulo: { fontSize: 26, fontWeight: '700', color: '#111827', marginTop: 8 },
  bajada: { fontSize: 16, color: '#6B7280', marginTop: 6 },
  identidad: { fontSize: 12, color: '#6B7280', marginTop: 48 },
});
