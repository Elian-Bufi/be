/**
 * APK · «Tu historia anterior» (WP-HISTORIA-ANTERIOR, DL-175): las dos piezas que la dibujan. Las decisiones están en
 * `historia-anterior-en-el-telefono.ts`, con su prueba (TEST-HA-040 a 045).
 * - `HistoriaAnteriorDelArea`, en «Quién ve qué», debajo del profesional de un área: el título, la explicación corta, el
 *   interruptor para compartirla o dejar de compartirla, el texto completo plegado y la línea de cuándo la miró.
 * - `HistoriaAnteriorAlAceptar`, al aceptar a un profesional nuevo de un área en la que ya hubo otro: la misma oferta, con
 *   «Compartir mi historia anterior» y «Ahora no». Por omisión no se comparte, y «Ahora no» no escribe nada.
 *
 * Accesibilidad: el interruptor es una fila tocable con rol de interruptor, su nombre («Compartir tu historia anterior de
 * Nutrición con …») y su estado; el `Switch` de adentro no se recorre. El texto respeta la letra grande del teléfono (no se
 * fija `allowFontScaling`), y los colores salen del tema (Claro y Azul noche), sin colores que juzguen.
 */
import { COPY_HISTORIA_ANTERIOR as C, type HistoriaAnteriorDeUnArea, type Resultado } from '@be/domain';
import { useCallback, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { api } from './api';
import { DialogoDeConfirmacion } from './dialogo';
import { fechaCivilDeUnInstante, dia } from './formato';
import { Icono } from './icono';
import { falloDe, useClaveDeIntento, type Fallo } from './intento';
import { useLecturaRecordada } from './lecturas';
import { TextoDesplegable } from './texto-versionado';
import { conLoNuevo, loQuePideElInterruptor, mensajeDelRechazo, pedidoDeAutorizar, pedidoDeRetirar, seOfreceAlAceptar, vistasDeLaHistoriaAnterior, type MiHistoriaAnterior, type VistaDeLaHistoriaAnterior } from './historia-anterior-en-el-telefono';
import { Aviso, Boton, COLOR, estilosPorTema, Parrafo, Superficie } from './ui';

type Texto = MiHistoriaAnterior['text'];
type Respuesta = Resultado<{ readonly data: HistoriaAnteriorDeUnArea }>;

/** Las vistas de la lectura, por componente de vínculo: lo que «Quién ve qué» dibuja debajo de cada área. */
export function useVistasDeLaHistoriaAnterior(mia: MiHistoriaAnterior | null): ReadonlyMap<string, VistaDeLaHistoriaAnterior> {
  return mia ? vistasDeLaHistoriaAnterior(mia, dia, fechaCivilDeUnInstante(new Date().toISOString())) : new Map();
}

/** Compartir o retirar, con la clave del intento (un resultado incierto se reintenta con la misma). */
function useCambioDeLaHistoria(token: string, alCambiar: (nuevo: HistoriaAnteriorDeUnArea) => void) {
  const intento = useClaveDeIntento();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<{ readonly mensaje: string; readonly actualizar: boolean } | null>(null);
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
        setHecho(que === 'COMPARTIR' ? C.compartida(item.professional.displayName) : C.retirada(item.professional.displayName));
        alCambiar(r.datos.data);
        return true;
      }
      setError(mensajeDelRechazo(r));
      setFallo(falloDe(r));
      return false;
    },
    [token, intento, alCambiar],
  );
  return { enviar, enviando, error, fallo, hecho, descartar: () => intento.descartar() };
}

/**
 * Debajo del profesional de un área, en «Quién ve qué». `alCambiar` recibe lo que respondió la API; `actualizar` vuelve a
 * leer (cuando algo cambió mientras se miraba).
 */
export function HistoriaAnteriorDelArea({
  token,
  item,
  vista,
  texto,
  alCambiar,
  actualizar,
}: {
  token: string;
  item: HistoriaAnteriorDeUnArea;
  vista: VistaDeLaHistoriaAnterior;
  texto: Texto;
  alCambiar: (nuevo: HistoriaAnteriorDeUnArea) => void;
  actualizar: () => void;
}) {
  const cambio = useCambioDeLaHistoria(token, alCambiar);
  const [confirmando, setConfirmando] = useState(false);
  const tocar = () => {
    if (cambio.enviando) return;
    if (loQuePideElInterruptor(item) === 'RETIRAR') setConfirmando(true);
    else void cambio.enviar(item, 'COMPARTIR', texto);
  };
  return (
    <View style={estilos.bloque}>
      <View style={estilos.cabeza}>
        <Icono nombre="linea-de-tiempo" tamano={18} tono="acento" />
        <Text style={estilos.titulo} accessibilityRole="header">
          {vista.titulo}
        </Text>
      </View>
      <Text style={estilos.texto}>{vista.explicacion}</Text>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={vista.paraLeer}
        accessibilityHint={vista.estado}
        accessibilityState={{ checked: vista.compartida, disabled: cambio.enviando, busy: cambio.enviando }}
        onPress={tocar}
        style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
      >
        <View style={estilos.textosDeLaFila}>
          <Text style={estilos.rotulo}>{C.interruptor}</Text>
          <Text style={[estilos.texto, estilos.tenue]}>{cambio.enviando ? (vista.compartida ? C.retirando : C.compartiendo) : vista.estado}</Text>
        </View>
        <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
          <Switch value={vista.compartida} disabled={cambio.enviando} trackColor={{ false: COLOR.borde, true: COLOR.acento }} />
        </View>
      </Pressable>
      {vista.miro ? (
        <View style={estilos.linea} accessible accessibilityLabel={vista.miro}>
          <Icono nombre="reloj" tamano={18} tono="tenue" />
          <Text style={[estilos.texto, estilos.tenue]}>{vista.miro}</Text>
        </View>
      ) : null}
      <TextoDesplegable version={{ id: texto.id, text: texto.text, textHash: texto.textHash, effectiveFrom: texto.effectiveFrom }} textoDelBoton={C.leerElTexto} />
      {texto.approval === 'PENDING_APPROVAL' ? <Parrafo tenue>{C.propuesta}</Parrafo> : null}
      {cambio.hecho ? <Aviso tipo="exito" titulo={cambio.hecho} /> : null}
      {cambio.error && !confirmando ? (
        <Aviso tipo="error" titulo={cambio.error.mensaje}>
          {cambio.error.actualizar ? <Boton texto="Actualizar" tipo="secundario" onPress={actualizar} /> : null}
        </Aviso>
      ) : null}
      <DialogoDeConfirmacion
        visible={confirmando}
        titulo={C.confirmarRetiro.titulo}
        textoConfirmar={C.confirmarRetiro.confirmar}
        textoEnviando={C.retirando}
        enviando={cambio.enviando}
        fallo={confirmando ? cambio.fallo : null}
        onVolver={() => {
          cambio.descartar();
          setConfirmando(false);
        }}
        onConfirmar={() => {
          void cambio.enviar(item, 'RETIRAR', texto).then((ok) => ok && setConfirmando(false));
        }}
        onActualizar={() => {
          setConfirmando(false);
          actualizar();
        }}
      >
        <Parrafo>{C.confirmarRetiro.cuerpo(item.professional.displayName)}</Parrafo>
      </DialogoDeConfirmacion>
    </View>
  );
}

/**
 * Al aceptar a un profesional nuevo (Vínculos): si en esa área ya hubo otro, una tarjeta opcional que ofrece compartir la
 * historia anterior. Lee API-HIA-01 aparte: si falla, la tarjeta no se dibuja y el resto sigue igual.
 */
export function HistoriaAnteriorAlAceptar({ token, relationshipId, sesionPerdida }: { token: string; relationshipId: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const lectura = useLecturaRecordada(token, `historia-anterior-al-aceptar-${relationshipId}`, useCallback(() => api.miHistoriaAnterior(token), [token]), sesionPerdida);
  const [ahoraNo, setAhoraNo] = useState(false);
  const [compartida, setCompartida] = useState<HistoriaAnteriorDeUnArea | null>(null);
  const cambio = useCambioDeLaHistoria(token, setCompartida);
  const mia = lectura.r?.ok ? lectura.r.datos.data : null;
  const item = mia ? seOfreceAlAceptar(compartida ? conLoNuevo(mia, compartida) : mia, relationshipId) : null;
  if (ahoraNo || !mia) return null;
  if (compartida) return <Aviso tipo="exito" titulo={C.compartida(compartida.professional.displayName)} />;
  if (!item) return null;
  return (
    <Superficie style={estilos.tarjeta}>
      <View style={estilos.cabeza}>
        <Icono nombre="linea-de-tiempo" tamano={20} tono="acento" />
        <Text style={estilos.titulo} accessibilityRole="header">
          {C.alAceptar.titulo(item.professional.displayName, item.area)}
        </Text>
      </View>
      <Text style={estilos.texto}>{C.explicacion(item.professional.displayName, item.area)}</Text>
      <Text style={[estilos.texto, estilos.tenue]}>{C.alAceptar.opcional}</Text>
      <TextoDesplegable version={{ id: mia.text.id, text: mia.text.text, textHash: mia.text.textHash, effectiveFrom: mia.text.effectiveFrom }} textoDelBoton={C.leerElTexto} />
      {mia.text.approval === 'PENDING_APPROVAL' ? <Parrafo tenue>{C.propuesta}</Parrafo> : null}
      {cambio.error ? <Aviso tipo="error" titulo={cambio.error.mensaje} /> : null}
      {/* Las dos respuestas, del mismo peso: ninguna es la «correcta». */}
      <Boton texto={cambio.enviando ? C.compartiendo : C.alAceptar.compartir} tipo="secundario" ocupado={cambio.enviando} deshabilitado={cambio.enviando} onPress={() => void cambio.enviar(item, 'COMPARTIR', mia.text)} />
      <Boton texto={C.alAceptar.ahoraNo} tipo="secundario" deshabilitado={cambio.enviando} onPress={() => setAhoraNo(true)} />
    </Superficie>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  bloque: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 8, paddingTop: 8, gap: 6 },
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8, gap: 8 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 17, fontWeight: '800', color: COLOR.texto, flexShrink: 1 },
  texto: { fontSize: 16, lineHeight: 23, color: COLOR.texto, flexShrink: 1 },
  tenue: { color: COLOR.tenue },
  rotulo: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48, paddingVertical: 6 },
  presionada: { opacity: 0.7 },
  textosDeLaFila: { flexShrink: 1, gap: 2 },
  linea: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
}));
