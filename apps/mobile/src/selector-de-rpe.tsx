/**
 * DL-192 en la APK (DL-194): el esfuerzo de una serie en un plan en RPE se elige, no se escribe. El campo se ve como los
 * demás de la fila (con el plan en gris mientras está vacío) y al tocarlo abre las opciones del dominio
 * (`OPCIONES_DE_RPE`: 10, 9,5 … 6,5 y «6 o menos»), con «Sin anotar» para dejarlo vacío. Lo elegido vuelve a la fila como
 * su texto («8,5», «6 o menos»), y `leerEsfuerzo` lo lee como el RIR que se manda.
 *
 * - Con teclado numérico no se puede escribir «6 o menos», y un «8,3» no es de la escala: con las opciones no hay nada
 *   que corregir.
 * - **Lectores de pantalla:** el campo es un botón con su nombre («RPE de la serie 2, opcional. Plan: 8»), lo elegido y el
 *   error si lo hay. Las opciones son un grupo de radio, con la elegida marcada; «Volver» cierra sin cambiar nada, y el
 *   botón «atrás» de Android también.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { COPY_ENTRENAMIENTO_POR_SERIE } from '@be/domain';
import { OPCIONES_DEL_RPE, opcionDelTexto, textosDelEsfuerzo } from './esfuerzo-en-la-app';
import { estilosPorTema } from './tema';
import { Boton, estilos as ui } from './ui';

export const TEXTOS_DEL_SELECTOR_DE_RPE = {
  pista: 'Abre las opciones del RPE',
  sinAnotar: 'Sin anotar',
  volver: 'Volver',
  /** Debajo del título de las opciones: qué es cada número, con el ejemplo de la ayuda. */
  queEs: 'RPE 10 es que no podías hacer otra repetición; RPE 9, que te quedaba una; RPE 8, que te quedaban dos.',
} as const;

export function SelectorDeRpe({
  valor,
  placeholder,
  etiqueta,
  titulo,
  error,
  forma,
  rotuloVisible,
  onCambiar,
}: {
  /** Lo que tiene la fila: el texto de una opción, o vacío. */
  valor: string;
  /** El plan de esa serie, en gris mientras está vacío. Vacío: nada. */
  placeholder: string;
  /** El nombre accesible del campo, con el plan y el error (lo arma quien lo usa, como el de los otros campos). */
  etiqueta: string;
  /** El título de las opciones: «RPE de la serie 2». */
  titulo: string;
  error: string | undefined | null;
  /** `celda`: en la tabla, del tamaño de una celda. `campo`: con su rótulo arriba, como un `Campo` de ui.tsx. */
  forma: 'celda' | 'campo';
  /** Con `forma="campo"`, el rótulo visible de arriba. */
  rotuloVisible?: string;
  onCambiar: (texto: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const elegida = opcionDelTexto(valor);
  const sinObjetivo = placeholder === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo;
  const elegir = (texto: string) => {
    setAbierto(false);
    onCambiar(texto);
  };
  const boton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={valor !== '' ? `${etiqueta}. Elegido: ${valor}` : etiqueta}
      accessibilityHint={TEXTOS_DEL_SELECTOR_DE_RPE.pista}
      onPress={() => setAbierto(true)}
      style={({ pressed }) => [forma === 'celda' ? estilos.celda : ui.entrada, estilos.centrado, error ? estilos.conError : null, pressed && ui.presionado]}
    >
      {valor !== '' ? (
        <Text style={forma === 'celda' ? estilos.valorDeCelda : estilos.valorDeCampo} numberOfLines={2}>
          {valor}
        </Text>
      ) : placeholder !== '' ? (
        <Text style={[estilos.placeholder, sinObjetivo && estilos.placeholderSinObjetivo]} numberOfLines={2}>
          {placeholder}
        </Text>
      ) : null}
    </Pressable>
  );
  return (
    <>
      {forma === 'campo' ? (
        <View style={ui.campo}>
          {rotuloVisible ? <Text style={ui.etiqueta}>{rotuloVisible}</Text> : null}
          {boton}
          {error ? <Text style={ui.error}>{error}</Text> : null}
        </View>
      ) : (
        boton
      )}
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <View style={estilos.fondo}>
          <ScrollView contentContainerStyle={estilos.centradoDelDialogo}>
            <View style={estilos.dialogo} accessibilityViewIsModal>
              <Text style={ui.tituloDeSeccion} accessibilityRole="header">
                {titulo}
              </Text>
              <Text style={estilos.queEs}>{TEXTOS_DEL_SELECTOR_DE_RPE.queEs}</Text>
              {placeholder !== '' && !sinObjetivo ? <Text style={estilos.queEs}>{`Plan: ${placeholder}`}</Text> : null}
              <View accessibilityRole="radiogroup" accessibilityLabel={titulo} style={estilos.opciones}>
                {OPCIONES_DEL_RPE.map((o) => {
                  const marcada = elegida?.rir === o.rir;
                  return (
                    <Pressable
                      key={o.texto}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: marcada }}
                      accessibilityLabel={`${textosDelEsfuerzo('RPE').columna} ${o.texto}`}
                      onPress={() => elegir(o.texto)}
                      style={({ pressed }) => [estilos.opcion, marcada && estilos.opcionElegida, pressed && ui.presionado]}
                    >
                      <Text style={[estilos.textoDeOpcion, marcada && estilos.textoDeOpcionElegida]}>{o.texto}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {valor !== '' ? <Boton texto={TEXTOS_DEL_SELECTOR_DE_RPE.sinAnotar} tipo="enlace" onPress={() => elegir('')} /> : null}
              <Boton texto={TEXTOS_DEL_SELECTOR_DE_RPE.volver} tipo="secundario" onPress={() => setAbierto(false)} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // Como `celda` y `celdaEditable` de la tabla de la sesión (sesion-enfocada.tsx).
  celda: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: COLOR.bordeControl, backgroundColor: COLOR.fondo, paddingHorizontal: 2 },
  centrado: { alignItems: 'center', justifyContent: 'center' },
  conError: { borderColor: COLOR.error, borderWidth: 2 },
  valorDeCelda: { fontSize: 18, fontWeight: '800', color: COLOR.texto, textAlign: 'center' },
  valorDeCampo: { fontSize: 16, fontWeight: '700', color: COLOR.texto, alignSelf: 'stretch' },
  placeholder: { fontSize: 16, color: COLOR.tenue, textAlign: 'center' },
  placeholderSinObjetivo: { fontSize: 13, lineHeight: 16 },
  fondo: { flex: 1, backgroundColor: COLOR.velo },
  centradoDelDialogo: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  dialogo: { backgroundColor: COLOR.superficie, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLOR.borde },
  queEs: { fontSize: 15, lineHeight: 21, color: COLOR.tenue, marginBottom: 6 },
  // Tres o cuatro por fila con letra normal; con letra grande, las que entren: cada una mide al menos 48 dp de alto.
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  opcion: { flexGrow: 1, flexBasis: 76, minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: COLOR.bordeControl, backgroundColor: COLOR.fondo, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  opcionElegida: { borderColor: COLOR.acento, borderWidth: 2, backgroundColor: COLOR.superficie },
  textoDeOpcion: { fontSize: 18, fontWeight: '700', color: COLOR.texto, textAlign: 'center' },
  textoDeOpcionElegida: { color: COLOR.acento },
}));
