/**
 * Texto versionado (08 §12.2): id, vigencia y huella de la versión exacta que se acepta.
 * - `TextoVersionado`: en un modal, sobre el formulario de registro, para no perder lo cargado.
 * - `TextoDesplegable`: dentro de la pantalla, para las versiones que entrega la API (B2 en CON-01, A3 en CON-05).
 * Navegables con encabezados y sin scroll forzado para habilitar nada (10-B10:503-512).
 */
import type { VersionDeTexto } from '@be/domain';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dia } from './formato';
import { Boton, COLOR, estilos as ui } from './ui';

/** Versión tal como la entrega la API: lo que la pantalla muestra es lo que se envía al aceptar. */
export interface VersionDeLaApi {
  readonly id: string;
  readonly text: string;
  readonly textHash: string;
  readonly effectiveFrom: string;
}

export function TextoDesplegable({
  version,
  textoDelBoton,
  abiertoAlInicio = false,
}: {
  version: VersionDeLaApi;
  textoDelBoton: string;
  /** Visible de entrada cuando no hay un resumen propio que lo reemplace (A3, 10-B02 §7.1). */
  abiertoAlInicio?: boolean;
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  const [titulo, ...parrafos] = version.text.split('\n\n');
  return (
    <View>
      <Boton texto={abierto ? 'Ocultar el texto' : textoDelBoton} tipo="enlace" onPress={() => setAbierto(!abierto)} />
      {abierto ? (
        <View style={estilos.desplegado}>
          <Text style={[ui.parrafo, ui.negrita]} accessibilityRole="header">
            {titulo}
          </Text>
          <View style={estilos.meta}>
            <Text style={ui.tenue}>Versión: {version.id}</Text>
            <Text style={ui.tenue}>Vigente desde: {dia(version.effectiveFrom)}</Text>
            <Text style={ui.tenue} selectable>
              Huella SHA-256: {version.textHash}
            </Text>
          </View>
          {parrafos.map((p, i) => (
            <Text key={i} style={ui.parrafo}>
              {p}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

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
  desplegado: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 8, padding: 12, marginVertical: 6, backgroundColor: COLOR.fondoSuave },
});
