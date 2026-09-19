/**
 * Piezas de interfaz del APK (10-B10 §7, §9): label persistente, error con texto (no solo color), targets táctiles de
 * 48 dp, roles y estados accesibles, sin gestos exclusivos. Botón destructivo distinguible por texto y jerarquía.
 */
import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

export const COLOR = {
  azul: '#1F5BC4',
  azulOscuro: '#17459A',
  texto: '#111827',
  tenue: '#4B5563',
  borde: '#D1D5DB',
  fondoSuave: '#F3F6FB',
  error: '#B42318',
  errorFondo: '#FEF3F2',
  exito: '#067647',
  exitoFondo: '#ECFDF3',
};

export function Titulo({ children }: { children: ReactNode }) {
  return (
    <Text style={estilos.titulo} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Parrafo({ children, tenue = false }: { children: ReactNode; tenue?: boolean }) {
  return <Text style={[estilos.parrafo, tenue && estilos.tenue]}>{children}</Text>;
}

type TipoDeBoton = 'primario' | 'secundario' | 'peligro' | 'peligroSecundario' | 'enlace';

export function Boton({
  texto,
  onPress,
  tipo = 'primario',
  deshabilitado = false,
  ocupado = false,
}: {
  texto: string;
  onPress: () => void;
  tipo?: TipoDeBoton;
  deshabilitado?: boolean;
  ocupado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={tipo === 'enlace' ? 'link' : 'button'}
      accessibilityState={{ disabled: deshabilitado || ocupado, busy: ocupado }}
      disabled={deshabilitado || ocupado}
      onPress={onPress}
      style={({ pressed }) => [estilos.boton, estilos[`boton_${tipo}`], (deshabilitado || ocupado) && estilos.deshabilitado, pressed && estilos.presionado]}
    >
      <Text style={[estilos.textoBoton, estilos[`textoBoton_${tipo}`]]}>{texto}</Text>
    </Pressable>
  );
}

export function Campo({ etiqueta, ayuda, error, ...resto }: TextInputProps & { etiqueta: string; ayuda?: string; error?: string | null }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      {ayuda ? <Text style={estilos.tenue}>{ayuda}</Text> : null}
      <TextInput
        accessibilityLabel={etiqueta}
        accessibilityHint={[ayuda, error].filter(Boolean).join('. ') || undefined}
        style={[estilos.entrada, error ? estilos.entradaConError : null]}
        placeholderTextColor={COLOR.tenue}
        {...resto}
      />
      {error ? <Text style={estilos.error}>⚠ {error}</Text> : null}
    </View>
  );
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
        <View style={[estilos.casilla, marcada && estilos.casillaMarcada]}>{marcada ? <Text style={estilos.tilde}>✓</Text> : null}</View>
        <Text style={estilos.textoDeCasilla}>
          <Text style={estilos.negrita}>{titulo}</Text> — {texto}
        </Text>
      </Pressable>
      {children}
      {error ? <Text style={estilos.error}>⚠ {error}</Text> : null}
    </View>
  );
}

/** Aviso con rol de alerta; se anuncia al lector de pantalla al aparecer (10-B10:160-174). */
export function Aviso({ tipo, titulo, children }: { tipo: 'error' | 'info' | 'exito'; titulo?: string; children?: ReactNode }) {
  useEffect(() => {
    if (titulo) AccessibilityInfo.announceForAccessibility(titulo);
  }, [titulo]);
  return (
    <View accessibilityRole={tipo === 'error' ? 'alert' : 'summary'} style={[estilos.aviso, estilos[`aviso_${tipo}`]]}>
      {titulo ? <Text style={estilos.negrita}>{titulo}</Text> : null}
      {children}
    </View>
  );
}

export function Seccion({ titulo, children, peligro = false }: { titulo: string; children: ReactNode; peligro?: boolean }) {
  return (
    <View style={[estilos.seccion, peligro && estilos.seccionPeligro]}>
      <Text style={estilos.tituloDeSeccion} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

export const estilos = StyleSheet.create({
  titulo: { fontSize: 28, fontWeight: '700', color: COLOR.texto, marginBottom: 12 },
  parrafo: { fontSize: 16, color: COLOR.texto, lineHeight: 23, marginVertical: 4 },
  tenue: { color: COLOR.tenue, fontSize: 14 },
  negrita: { fontWeight: '700', color: COLOR.texto },
  boton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  boton_primario: { backgroundColor: COLOR.azul, borderColor: COLOR.azul },
  boton_secundario: { backgroundColor: '#fff', borderColor: COLOR.azul },
  boton_peligro: { backgroundColor: COLOR.error, borderColor: COLOR.error },
  boton_peligroSecundario: { backgroundColor: '#fff', borderColor: COLOR.error },
  boton_enlace: { backgroundColor: 'transparent', borderColor: 'transparent', alignItems: 'flex-start', paddingHorizontal: 0 },
  textoBoton: { fontSize: 16, fontWeight: '700' },
  textoBoton_primario: { color: '#fff' },
  textoBoton_secundario: { color: COLOR.azulOscuro },
  textoBoton_peligro: { color: '#fff' },
  textoBoton_peligroSecundario: { color: COLOR.error },
  textoBoton_enlace: { color: COLOR.azulOscuro, textDecorationLine: 'underline' },
  deshabilitado: { opacity: 0.6 },
  presionado: { opacity: 0.8 },
  campo: { marginVertical: 8 },
  etiqueta: { fontSize: 16, fontWeight: '600', color: COLOR.texto, marginBottom: 4 },
  entrada: { minHeight: 48, borderWidth: 1, borderColor: COLOR.borde, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: COLOR.texto },
  entradaConError: { borderColor: COLOR.error, borderWidth: 2 },
  error: { color: COLOR.error, fontWeight: '600', marginTop: 4, fontSize: 15 },
  acto: { borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.fondoSuave, borderRadius: 8, padding: 12, marginVertical: 6 },
  actoConError: { borderColor: COLOR.error, borderWidth: 2 },
  filaDeCasilla: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 48 },
  casilla: { width: 28, height: 28, borderWidth: 2, borderColor: COLOR.azul, borderRadius: 4, marginRight: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  casillaMarcada: { backgroundColor: COLOR.azul },
  tilde: { color: '#fff', fontWeight: '800', fontSize: 18 },
  textoDeCasilla: { flex: 1, fontSize: 16, color: COLOR.texto, lineHeight: 22 },
  aviso: { borderLeftWidth: 6, borderRadius: 8, padding: 12, marginVertical: 8 },
  aviso_error: { borderLeftColor: COLOR.error, backgroundColor: COLOR.errorFondo },
  aviso_info: { borderLeftColor: COLOR.azul, backgroundColor: COLOR.fondoSuave },
  aviso_exito: { borderLeftColor: COLOR.exito, backgroundColor: COLOR.exitoFondo },
  seccion: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 10, padding: 16, marginVertical: 8 },
  seccionPeligro: { borderColor: COLOR.error },
  tituloDeSeccion: { fontSize: 20, fontWeight: '700', color: COLOR.texto, marginBottom: 6 },
});
