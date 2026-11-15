/**
 * APK · «Tu historia anterior» (WP-HISTORIA-ANTERIOR, DL-175): las piezas que la dibujan. Las decisiones están en
 * `historia-anterior-en-el-telefono.ts`, con su prueba (TEST-HA-040 a 046).
 * - `HistoriaAnteriorDelArea`, en «Quién ve qué», debajo del profesional de un área: el título, la explicación corta, el
 *   interruptor para compartirla o dejar de compartirla, el texto completo plegado y la línea de cuándo la miró. Con el
 *   vínculo terminado, solo el estado y cuándo la miró.
 * - Al aceptar a un profesional nuevo, desde WP-COMPARTIR (DL-176) la historia anterior es una de las cosas de la pantalla
 *   única de consentimiento (`pantallas/consentimiento.tsx`), preseleccionada si antes hubo otro profesional en esa área:
 *   la tarjeta opcional que vivía acá (HA-T01, «por omisión, no se comparte») ya no se dibuja.
 * - `DialogoParaCompartir`: compartirla desde «Quién ve qué» abre **el texto entero a la vista** (como los hábitos:
 *   lo que se acepta no se pliega, 08 §12.2) con dos respuestas del mismo peso. Recién al confirmar sale API-HIA-02.
 *
 * Accesibilidad: el interruptor es una fila tocable con rol de interruptor; su etiqueta dice qué hace, con quién y el estado
 * que se ve (también «Compartiendo…»), y la sugerencia, qué pasa al tocarlo; el `Switch` de adentro no se recorre. El texto
 * respeta la letra grande del teléfono (no se fija `allowFontScaling`), y los colores salen del tema (Claro y Azul noche),
 * sin colores que juzguen.
 */
import { COPY_HISTORIA_ANTERIOR as C, type HistoriaAnteriorDeUnArea, type Resultado } from '@be/domain';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { api } from './api';
import { DialogoDeConfirmacion } from './dialogo';
import { fechaCivilDeUnInstante, dia } from './formato';
import { Icono } from './icono';
import { falloDe, useClaveDeIntento, type Fallo } from './intento';
import { TextoDesplegable } from './texto-versionado';
import {
  etiquetaDelInterruptor,
  exitoAlCompartir,
  loQuePideElInterruptor,
  mensajeDelRechazo,
  partesDelTexto,
  pedidoDeAutorizar,
  pedidoDeRetirar,
  vistasDeLaHistoriaAnterior,
  type MiHistoriaAnterior,
  type VistaDeLaHistoriaAnterior,
} from './historia-anterior-en-el-telefono';
import { Aviso, Boton, COLOR, estilos as ui, estilosPorTema, Parrafo, Superficie } from './ui';

type Texto = MiHistoriaAnterior['text'];
type Respuesta = Resultado<{ readonly data: HistoriaAnteriorDeUnArea }>;
type Rechazo = ReturnType<typeof mensajeDelRechazo>;

/** Las vistas de la lectura, por componente de vínculo: lo que «Quién ve qué» dibuja debajo de cada área. */
export function useVistasDeLaHistoriaAnterior(mia: MiHistoriaAnterior | null): ReadonlyMap<string, VistaDeLaHistoriaAnterior> {
  return mia ? vistasDeLaHistoriaAnterior(mia, dia, fechaCivilDeUnInstante(new Date().toISOString())) : new Map();
}

/** Compartir o retirar, con la clave del intento (un resultado incierto se reintenta con la misma). */
function useCambioDeLaHistoria(token: string, alCambiar: (nuevo: HistoriaAnteriorDeUnArea) => void) {
  const intento = useClaveDeIntento();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<Rechazo | null>(null);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const enviar = useCallback(
    async (item: HistoriaAnteriorDeUnArea, que: 'COMPARTIR' | 'RETIRAR', texto: Texto): Promise<boolean> => {
      setEnviando(true);
      setError(null);
      setFallo(null);
      setHecho(null);
      const retiro = pedidoDeRetirar(item);
      const r: Respuesta =
        que === 'COMPARTIR'
          ? await api.autorizarHistoriaAnterior(token, item.relationshipId, pedidoDeAutorizar(item, texto.id), intento.actual())
          : retiro
            ? await api.retirarHistoriaAnterior(token, item.relationshipId, retiro, intento.actual())
            : { ok: false, tipo: 'API', status: 409, codigo: 'VERSION_CONFLICT', issues: [] };
      intento.registrar(r);
      setEnviando(false);
      if (r.ok) {
        // El éxito dice lo mismo que el estado (HA-T15): «puede verla» solo si hoy tiene acceso a esa área.
        setHecho(que === 'COMPARTIR' ? exitoAlCompartir(r.datos.data) : C.retirada(item.professional.displayName));
        alCambiar(r.datos.data);
        return true;
      }
      setError(mensajeDelRechazo(r));
      setFallo(falloDe(r));
      return false;
    },
    [token, intento, alCambiar],
  );
  const limpiar = useCallback(() => {
    intento.descartar();
    setError(null);
    setFallo(null);
  }, [intento]);
  return { enviar, enviando, error, fallo, hecho, limpiar };
}

/** Los botones que siguen a un rechazo: «Actualizar» si algo cambió; «Ir a Privacidad» si falta el A3 y hay a dónde ir. */
function SalidasDelRechazo({ error, actualizar, irAPrivacidad }: { error: Rechazo; actualizar: () => void; irAPrivacidad?: () => void }) {
  return (
    <>
      {error.actualizar ? <Boton texto={C.actualizar} tipo="secundario" onPress={actualizar} /> : null}
      {error.privacidad && irAPrivacidad ? <Boton texto={C.irAPrivacidad} tipo="secundario" icono="derecha" iconoAlFinal onPress={irAPrivacidad} /> : null}
    </>
  );
}

/**
 * Compartirla: el texto entero, a la vista, y dos respuestas del mismo peso. Recién «Compartir mi historia anterior» manda
 * API-HIA-02; «Ahora no» (o el «atrás» de Android) cierra sin escribir nada.
 */
function DialogoParaCompartir({
  visible,
  item,
  texto,
  enviando,
  error,
  onCompartir,
  onAhoraNo,
  actualizar,
  irAPrivacidad,
}: {
  visible: boolean;
  item: HistoriaAnteriorDeUnArea;
  texto: Texto;
  enviando: boolean;
  error: Rechazo | null;
  onCompartir: () => void;
  onAhoraNo: () => void;
  actualizar: () => void;
  irAPrivacidad?: () => void;
}) {
  const { titulo, parrafos } = partesDelTexto(texto.text);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!enviando) onAhoraNo();
      }}
    >
      <View style={estilos.velo}>
        <ScrollView contentContainerStyle={estilos.centrado}>
          <View style={estilos.dialogo} accessibilityViewIsModal>
            <Text style={ui.tituloDeSeccion} accessibilityRole="header">
              {C.alAceptar.titulo(item.professional.displayName, item.area)}
            </Text>
            <Parrafo>{C.explicacion(item.professional.displayName, item.area)}</Parrafo>
            <Parrafo tenue>{C.leeAntes}</Parrafo>
            {texto.approval === 'PENDING_APPROVAL' ? <Aviso tipo="info" titulo={C.propuesta} /> : null}
            <Superficie style={estilos.textoDelActo}>
              <Text style={[ui.parrafo, ui.negrita]} accessibilityRole="header">
                {titulo}
              </Text>
              {parrafos.map((p, i) => (
                <Text key={i} style={ui.parrafo}>
                  {p}
                </Text>
              ))}
            </Superficie>
            {error ? (
              <Aviso tipo="error" titulo={error.mensaje}>
                <SalidasDelRechazo error={error} actualizar={actualizar} irAPrivacidad={irAPrivacidad} />
              </Aviso>
            ) : null}
            {/* Las dos respuestas, del mismo peso: ninguna es la «correcta». */}
            <Boton texto={enviando ? C.compartiendo : C.alAceptar.compartir} tipo="secundario" ocupado={enviando} deshabilitado={enviando || error?.actualizar === true} onPress={onCompartir} />
            <Boton texto={C.alAceptar.ahoraNo} tipo="secundario" deshabilitado={enviando} onPress={onAhoraNo} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Debajo del profesional de un área, en «Quién ve qué». `alCambiar` recibe lo que respondió la API; `actualizar` vuelve a
 * leer (cuando algo cambió mientras se miraba); `irAPrivacidad`, cuando falta el A3.
 */
export function HistoriaAnteriorDelArea({
  token,
  item,
  vista,
  texto,
  alCambiar,
  actualizar,
  irAPrivacidad,
}: {
  token: string;
  item: HistoriaAnteriorDeUnArea;
  vista: VistaDeLaHistoriaAnterior;
  texto: Texto;
  alCambiar: (nuevo: HistoriaAnteriorDeUnArea) => void;
  actualizar: () => void;
  irAPrivacidad?: () => void;
}) {
  const cambio = useCambioDeLaHistoria(token, alCambiar);
  const [dialogo, setDialogo] = useState<'compartir' | 'retirar' | null>(null);
  const cerrar = () => {
    cambio.limpiar();
    setDialogo(null);
  };
  const actualizarYCerrar = () => {
    cerrar();
    actualizar();
  };
  const tocar = () => {
    if (cambio.enviando) return;
    cambio.limpiar();
    setDialogo(loQuePideElInterruptor(item) === 'RETIRAR' ? 'retirar' : 'compartir');
  };
  const estadoVisible = cambio.enviando ? (vista.compartida ? C.retirando : C.compartiendo) : vista.estado;
  const cabeza = (
    <View style={estilos.cabeza}>
      <Icono nombre="linea-de-tiempo" tamano={18} tono="acento" />
      <Text style={estilos.titulo} accessibilityRole="header">
        {vista.titulo}
      </Text>
    </View>
  );
  const miro = vista.miro ? (
    <View style={estilos.linea} accessible accessibilityLabel={vista.miro}>
      <Icono nombre="reloj" tamano={18} tono="tenue" />
      <Text style={[estilos.texto, estilos.tenue]}>{vista.miro}</Text>
    </View>
  ) : null;
  // Un vínculo terminado: ya no la ve, y queda cuándo la miró (HA-T08). Sin interruptor ni texto que aceptar.
  if (vista.soloLectura) {
    return (
      <View style={estilos.bloque}>
        {cabeza}
        <Text style={[estilos.texto, estilos.tenue]}>{vista.estado}</Text>
        {miro}
      </View>
    );
  }
  return (
    <View style={estilos.bloque}>
      {cabeza}
      <Text style={estilos.texto}>{vista.explicacion}</Text>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={etiquetaDelInterruptor(vista, estadoVisible)}
        accessibilityHint={vista.sugerencia}
        accessibilityState={{ checked: vista.compartida, disabled: cambio.enviando, busy: cambio.enviando }}
        onPress={tocar}
        style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
      >
        <View style={estilos.textosDeLaFila}>
          <Text style={estilos.rotulo}>{C.interruptor}</Text>
          <Text style={[estilos.texto, estilos.tenue]}>{estadoVisible}</Text>
        </View>
        <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
          <Switch value={vista.compartida} disabled={cambio.enviando} trackColor={{ false: COLOR.borde, true: COLOR.acento }} />
        </View>
      </Pressable>
      {miro}
      <TextoDesplegable version={{ id: texto.id, text: texto.text, textHash: texto.textHash, effectiveFrom: texto.effectiveFrom }} textoDelBoton={C.leerElTexto} />
      {texto.approval === 'PENDING_APPROVAL' ? <Parrafo tenue>{C.propuesta}</Parrafo> : null}
      {cambio.hecho ? <Aviso tipo="exito" titulo={cambio.hecho} /> : null}
      <DialogoParaCompartir
        visible={dialogo === 'compartir'}
        item={item}
        texto={texto}
        enviando={cambio.enviando}
        error={dialogo === 'compartir' ? cambio.error : null}
        onCompartir={() => {
          void cambio.enviar(item, 'COMPARTIR', texto).then((ok) => ok && setDialogo(null));
        }}
        onAhoraNo={cerrar}
        actualizar={actualizarYCerrar}
        irAPrivacidad={irAPrivacidad}
      />
      <DialogoDeConfirmacion
        visible={dialogo === 'retirar'}
        titulo={C.confirmarRetiro.titulo}
        textoConfirmar={C.confirmarRetiro.confirmar}
        textoEnviando={C.retirando}
        enviando={cambio.enviando}
        fallo={dialogo === 'retirar' ? cambio.fallo : null}
        onVolver={cerrar}
        onConfirmar={() => {
          void cambio.enviar(item, 'RETIRAR', texto).then((ok) => ok && setDialogo(null));
        }}
        onActualizar={actualizarYCerrar}
      >
        <Parrafo>{C.confirmarRetiro.cuerpo(item.professional.displayName)}</Parrafo>
      </DialogoDeConfirmacion>
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  bloque: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 8, paddingTop: 8, gap: 6 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 17, fontWeight: '800', color: COLOR.texto, flexShrink: 1 },
  texto: { fontSize: 16, lineHeight: 23, color: COLOR.texto, flexShrink: 1 },
  tenue: { color: COLOR.tenue },
  rotulo: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48, paddingVertical: 6 },
  presionada: { opacity: 0.7 },
  textosDeLaFila: { flexShrink: 1, gap: 2 },
  linea: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  velo: { flex: 1, backgroundColor: COLOR.velo },
  centrado: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  dialogo: { backgroundColor: COLOR.superficie, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLOR.borde, gap: 8 },
  textoDelActo: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 12, gap: 4 },
}));
