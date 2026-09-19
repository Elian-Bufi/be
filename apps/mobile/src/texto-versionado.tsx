/**
 * Texto versionado en un modal (08 §12.2): id, vigencia y huella de la versión exacta que se acepta. Se abre sobre el
 * formulario para no perder lo cargado; navegable con encabezados y sin scroll forzado para habilitar nada (10-B10:503-512).
 */
import type { VersionDeTexto } from '@be/domain';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton, COLOR, estilos as ui } from './ui';

export function TextoVersionado({ version, visible, alCerrar }: { version: VersionDeTexto | null; visible: boolean; alCerrar: () => void }) {
  if (!version) return null;
  const [titulo, ...parrafos] = version.texto.split('\n\n');
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={alCerrar}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={ui.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        <View style={estilos.meta}>
          <Text style={ui.tenue}>Versión: {version.id}</Text>
          <Text style={ui.tenue}>Vigente desde: {version.vigenteDesde.slice(0, 10)}</Text>
          <Text style={ui.tenue} selectable>
            Huella SHA-256: {version.hash}
          </Text>
        </View>
        {parrafos.map((p, i) => (
          <Text key={i} style={ui.parrafo}>
            {p}
          </Text>
        ))}
        <Boton texto="Volver" tipo="secundario" onPress={alCerrar} />
      </ScrollView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 24, paddingTop: 48 },
  meta: { borderLeftWidth: 4, borderLeftColor: COLOR.borde, paddingLeft: 10, marginBottom: 12 },
});
