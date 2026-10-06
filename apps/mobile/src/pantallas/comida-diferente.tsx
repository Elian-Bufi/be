/**
 * «Comí algo diferente» (WP-NUTRICION-RECETAS §7 y §9; encargo de Dirección del 2026-10-05, §5; REG-06-133).
 *
 * - **Texto, foto o los dos, y al menos uno.** La cantidad aproximada es opcional y es texto: nada se convierte en
 *   cantidades ni se infiere de la foto o del texto. Los macros quedan «sin calcular».
 * - **La foto, con «Cámara» o «Galería»** (`expo-image-picker`). El permiso se pide al tocarlas, no antes. Cancelar no
 *   cambia nada del borrador, y antes de guardar la foto se puede quitar o reemplazar. Se valida en el teléfono con los
 *   límites de la API (`borrador-de-comida-diferente.ts`).
 * - **Guardar:** la intención de subida (API-MED-01), los bytes a la ruta firmada (API-MED-02) y el registro (API-ING-02),
 *   con el comando único. El botón dice en qué está: subiendo la foto, guardando, un error que se puede reintentar sin
 *   duplicar (la misma clave), o guardado. No se anuncia nada guardado hasta que la API lo confirma. Si la foto no sube, el
 *   texto queda y se puede guardar sin ella.
 * - **La foto es privada:** la ven la persona y el profesional que la acompaña en Nutrición. No se reusa en recetas.
 * - **Antes de la primera foto para un profesional** (`EVIDENCIA_VISUAL`, 08 §12.4 y §21.3; DL-125), si la API exige el
 *   acto, la intención de subida responde 403 con el vínculo y la versión: se muestra el texto (`InformacionDeFotos`) y,
 *   al aceptar, la subida sigue sola. «Ahora no» deja la foto y lo escrito, y la comida se puede guardar sin la foto.
 * - **Si Android cierra la app con la cámara abierta** (pasa en teléfonos con poca memoria), al volver se recupera lo
 *   escrito y la foto tomada (`getPendingResultAsync`). Lo escrito se guarda en la memoria del proceso solo mientras la
 *   cámara o la galería están abiertas; nunca va a disco.
 */
import { COPY_EVIDENCIA_VISUAL, COPY_NUTRICION, COPY_REGISTRO_DE_COMIDAS, type DetalleDeEvidenciaVisualRequerida, type Resultado } from '@be/domain';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { api } from '../api';
import {
  AVISO_DE_FOTO_INVALIDA,
  cuerpoDeLaComidaDiferente,
  EDITANDO,
  estaOcupado,
  fotoDesdeElSelector,
  hayBorrador,
  hayContenido,
  motivoDeFotoInvalida,
  pasoDeLaSubida,
  textoDelBotonDeGuardar,
  type EstadoDelGuardado,
  type FotoElegida,
  type ImagenDelSelector,
  type SubidaDeLaFoto,
} from '../borrador-de-comida-diferente';
import { preguntarAntesDeSalir, useCambiosSinGuardar } from '../cambios-sin-guardar';
import { intentoDeLaComida } from '../comando-de-registro';
import { InformacionDeFotos } from '../evidencia-visual';
import { fechaLarga } from '../formato';
import { IconoDeCamara, IconoDeGaleria } from '../iconos-de-nutricion';
import { esIncierto, useClaveDeIntento } from '../intento';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { CajaInformativa } from '../piezas-de-nutricion';
import { ahoraEnElServidor, registrarComida } from '../registro-de-comidas';
import { relojDelServidor } from '../reloj-del-servidor';
import { Aviso, Boton, Campo, COLOR, estilos as ui, estilosPorTema, Parrafo, Titulo } from '../ui';

/** Lo escrito mientras la cámara o la galería están abiertas, por si Android cierra la app (ver arriba). */
const borradoresEnElSelector = new Map<string, { readonly descripcion: string; readonly cantidad: string }>();

const OPCIONES_DEL_SELECTOR: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Una sola foto, sin recortar. La calidad baja el peso de la subida; la API la recodifica igual, sin metadatos.
  allowsEditing: false,
  allowsMultipleSelection: false,
  quality: 0.8,
  exif: false,
};

type ResultadoDeLaSubida =
  | { readonly ok: true; readonly mediaId: string }
  | { readonly ok: false; readonly invalida: boolean; readonly evidenciaVisual?: DetalleDeEvidenciaVisualRequerida };

export function PantallaDeComidaDiferente({
  token,
  planId,
  diaTipoId,
  comidaId,
  comida,
  fecha,
  salir,
  ir,
  volver,
}: {
  token: string;
  planId: string;
  diaTipoId: string;
  comidaId: string;
  /** El nombre de la comida, como lo dice el plan. */
  comida: string;
  /** La fecha civil de «Hoy», la de la API. */
  fecha: string;
  salir: (m: Salida) => void;
  ir: Ir;
  /** Vuelve a «Hoy» sin preguntar: después de guardar no queda nada sin guardar. */
  volver: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  // Los botones de la foto piden un ancho que crece con la letra: con letra grande, cada uno baja a su línea entero.
  // «Cámara» y «Galería» son cortos y van lado a lado a 360 dp; «Reemplazar foto» y «Quitar foto» piden más.
  const { fontScale } = useWindowDimensions();
  const escala = Math.min(Math.max(fontScale, 1), 2.2);
  const anchoDeOrigen = 120 * escala;
  const anchoDeAccion = 150 * escala;
  const claveDelBorrador = `${token}|${fecha}|${comidaId}`;
  const [descripcion, setDescripcion] = useState(() => borradoresEnElSelector.get(claveDelBorrador)?.descripcion ?? '');
  const [cantidadAproximada, setCantidadAproximada] = useState(() => borradoresEnElSelector.get(claveDelBorrador)?.cantidad ?? '');
  const [foto, setFoto] = useState<FotoElegida | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [reemplazando, setReemplazando] = useState(false);
  const [avisoDeFoto, setAvisoDeFoto] = useState<string | null>(null);
  const [faltaContenido, setFaltaContenido] = useState(false);
  const [estado, setEstado] = useState<EstadoDelGuardado>(EDITANDO);
  // DL-125: el texto de las fotos, mientras se muestra; y si la persona eligió «Ahora no».
  const [informacionDeFotos, setInformacionDeFotos] = useState<DetalleDeEvidenciaVisualRequerida | null>(null);
  const [sinAceptarFotos, setSinAceptarFotos] = useState(false);
  const subida = useRef<SubidaDeLaFoto | null>(null);
  const claveDeLaRuta = useClaveDeIntento();
  const montada = useRef(true);
  useEffect(
    () => () => {
      montada.current = false;
    },
    [],
  );
  const ocupado = estaOcupado(estado) || eligiendo;
  const queSePierde = `lo que comiste en «${comida}»`;
  useCambiosSinGuardar(estado.tipo !== 'guardado' && hayBorrador(descripcion, cantidadAproximada, foto) ? queSePierde : null);

  /** Una imagen del selector: si no se puede usar, se dice por qué y queda la foto que había. */
  const usarImagen = (imagen: ImagenDelSelector) => {
    const elegida = fotoDesdeElSelector(imagen);
    if (elegida.foto === null) return setAvisoDeFoto(AVISO_DE_FOTO_INVALIDA[elegida.motivo]);
    setFoto(elegida.foto);
    // Otra foto es otra subida: otra ruta y otra clave.
    subida.current = null;
    claveDeLaRuta.descartar();
    setReemplazando(false);
    setFaltaContenido(false);
    setEstado((e) => (e.tipo === 'error-de-la-foto' ? EDITANDO : e));
  };

  // Si Android cerró la app con la cámara abierta, lo escrito volvió de la memoria del proceso; la foto, del selector.
  useEffect(() => {
    if (!borradoresEnElSelector.has(claveDelBorrador)) return;
    borradoresEnElSelector.delete(claveDelBorrador);
    void ImagePicker.getPendingResultAsync()
      .then((r) => {
        if (!montada.current || !r || !('canceled' in r) || r.canceled) return;
        const imagen = r.assets[0];
        if (imagen) usarImagen(imagen);
      })
      .catch(() => undefined);
    // Solo al abrir la pantalla: después, la foto la elige la persona.
  }, []);

  async function elegir(origen: 'camara' | 'galeria') {
    setAvisoDeFoto(null);
    setEligiendo(true);
    try {
      // El permiso se pide al usarla, no antes.
      const permiso = origen === 'camara' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!montada.current) return;
      if (!permiso.granted) return setAvisoDeFoto(origen === 'camara' ? COPY_REGISTRO_DE_COMIDAS.permisoDeCamara : COPY_REGISTRO_DE_COMIDAS.permisoDeGaleria);
      borradoresEnElSelector.set(claveDelBorrador, { descripcion, cantidad: cantidadAproximada });
      const r = origen === 'camara' ? await ImagePicker.launchCameraAsync(OPCIONES_DEL_SELECTOR) : await ImagePicker.launchImageLibraryAsync(OPCIONES_DEL_SELECTOR);
      borradoresEnElSelector.delete(claveDelBorrador);
      if (!montada.current) return;
      // Cancelar no cambia nada: el texto y la foto que había siguen.
      if (r.canceled) return;
      const imagen = r.assets[0];
      if (imagen) usarImagen(imagen);
    } catch {
      borradoresEnElSelector.delete(claveDelBorrador);
      if (montada.current) setAvisoDeFoto(COPY_REGISTRO_DE_COMIDAS.fotoNoSeAbrio);
    } finally {
      if (montada.current) setEligiendo(false);
    }
  }

  const quitarFoto = () => {
    setFoto(null);
    setSinAceptarFotos(false);
    subida.current = null;
    claveDeLaRuta.descartar();
    setReemplazando(false);
    setAvisoDeFoto(null);
    setEstado((e) => (e.tipo === 'error-de-la-foto' ? EDITANDO : e));
  };

  /** Los bytes de la foto, desde el archivo del teléfono. `null` si no se pudieron leer. */
  async function leerBytes(uri: string): Promise<Blob | null> {
    try {
      const respuesta = await fetch(uri);
      return await respuesta.blob();
    } catch {
      return null;
    }
  }

  /**
   * Si la API rechazó la foto por lo que es (422: tipo, tamaño o contenido que no se decodifica o se pasa de las
   * medidas), lo dice y la foto queda para reemplazarla o quitarla. Otra falla se puede reintentar.
   */
  function fotoRechazada(r: Resultado<unknown>): boolean {
    if (r.ok || r.tipo !== 'API' || !/^FILE_/.test(r.codigo)) return false;
    setAvisoDeFoto(r.codigo === 'FILE_CONTENT_INVALID' ? AVISO_DE_FOTO_INVALIDA.DIMENSIONES : AVISO_DE_FOTO_INVALIDA.TIPO);
    return true;
  }

  /** Deja la foto disponible en la API: pide la ruta si hace falta y sube los bytes. Devuelve el medio. */
  async function subirLaFoto(elegida: FotoElegida): Promise<ResultadoDeLaSubida> {
    const paso = pasoDeLaSubida(subida.current, elegida, relojDelServidor.ahora());
    if (paso === 'lista' && subida.current) return { ok: true, mediaId: subida.current.mediaId };
    const bytes = await leerBytes(elegida.uri);
    if (!bytes) return { ok: false, invalida: false };
    // Lo que el selector no dijo (el tamaño, a veces) se valida con los bytes, antes de pedir la ruta.
    const motivo = motivoDeFotoInvalida({ ...elegida, bytes: bytes.size });
    if (motivo) {
      setAvisoDeFoto(AVISO_DE_FOTO_INVALIDA[motivo]);
      return { ok: false, invalida: true };
    }
    if (paso === 'pedir-ruta') {
      const r = await api.crearIntencionDeSubida(
        token,
        { purpose: 'MEAL_EVIDENCE', contentType: elegida.tipo, byteSize: bytes.size, provenance: 'PERSON_PROVIDED', authorship: null },
        claveDeLaRuta.actual(),
      );
      claveDeLaRuta.registrar(r);
      if (sesionPerdida(r)) return { ok: false, invalida: false };
      // DL-125: falta la información destacada para el profesional de Nutrición. No es un error de la foto.
      if (!r.ok && r.tipo === 'API' && r.codigo === 'VISUAL_EVIDENCE_ACT_REQUIRED' && r.evidenciaVisual) return { ok: false, invalida: false, evidenciaVisual: r.evidenciaVisual };
      if (!r.ok) return { ok: false, invalida: fotoRechazada(r) };
      const venceMs = Date.parse(r.datos.data.expiresAt);
      subida.current = { uri: elegida.uri, mediaId: r.datos.data.mediaId, uploadPath: r.datos.data.uploadPath, venceMs: Number.isFinite(venceMs) ? venceMs : 0, subida: false };
    }
    const ruta = subida.current;
    if (!ruta) return { ok: false, invalida: false };
    const r = await api.subirMedio(ruta.uploadPath, bytes, elegida.tipo);
    if (!r.ok) {
      // Una respuesta de la API cierra esa ruta: el próximo intento pide otra. Sin respuesta, se vuelve a subir ahí.
      if (r.tipo === 'API') subida.current = null;
      return { ok: false, invalida: fotoRechazada(r) };
    }
    subida.current = { ...ruta, subida: true };
    return { ok: true, mediaId: ruta.mediaId };
  }

  /** Un doble toque, antes de que la pantalla se vuelva a dibujar, no sube ni registra dos veces. */
  const guardando = useRef(false);

  async function guardar(conFoto: boolean) {
    if (guardando.current || estaOcupado(estado)) return;
    guardando.current = true;
    try {
      await guardarUnaVez(conFoto);
    } finally {
      guardando.current = false;
    }
  }

  async function guardarUnaVez(conFoto: boolean) {
    const fotoQueVa = conFoto ? foto : null;
    if (!hayContenido(descripcion, fotoQueVa)) return setFaltaContenido(true);
    setFaltaContenido(false);
    let mediaIds: string[] = [];
    if (fotoQueVa) {
      setEstado({ tipo: 'subiendo' });
      const s = await subirLaFoto(fotoQueVa);
      if (!montada.current) return;
      if (!s.ok && s.evidenciaVisual) {
        setSinAceptarFotos(false);
        setInformacionDeFotos(s.evidenciaVisual);
        return setEstado(EDITANDO);
      }
      if (!s.ok) return setEstado(s.invalida ? EDITANDO : { tipo: 'error-de-la-foto' });
      mediaIds = [s.mediaId];
    }
    setEstado({ tipo: 'guardando' });
    const cuerpo = cuerpoDeLaComidaDiferente(
      { activePlanId: planId, dayTypeId: diaTipoId, mealId: comidaId },
      { descripcion, cantidad: cantidadAproximada, mediaIds, occurredAt: ahoraEnElServidor() },
    );
    const r: Resultado<unknown> = await registrarComida(token, `${intentoDeLaComida(token, fecha, comidaId)}|diferente`, cuerpo);
    if (!montada.current) return;
    if (sesionPerdida(r)) return;
    if (r.ok) {
      setEstado({ tipo: 'guardado' });
      return volver();
    }
    // 404 no revelador a una escritura: la pantalla retira el contenido.
    if (accesoRetirado(r)) return;
    if (esIncierto(r)) return setEstado({ tipo: 'error-al-guardar', incierto: true, mensaje: COPY_NUTRICION.noPudimosConfirmar });
    if (r.tipo === 'API' && r.codigo === 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY') return setEstado({ tipo: 'error-al-guardar', incierto: false, mensaje: COPY_NUTRICION.yaRegistrada });
    if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_REQUIRED') return setEstado({ tipo: 'error-al-guardar', incierto: false, mensaje: COPY_NUTRICION.planCambio });
    if (r.tipo === 'API' && r.codigo === 'MEDIA_REFERENCE_INVALID') {
      subida.current = null;
      return setEstado({ tipo: 'error-de-la-foto' });
    }
    setEstado({ tipo: 'error-al-guardar', incierto: false, mensaje: COPY_REGISTRO_DE_COMIDAS.noSePudoGuardar });
  }

  const volverAlPlan = () => (hayBorrador(descripcion, cantidadAproximada, foto) ? preguntarAntesDeSalir(queSePierde, volver) : volver());

  if (retirado) {
    return (
      <Aviso tipo="info" titulo={COPY_NUTRICION.planNoDisponible}>
        <Boton texto={COPY_REGISTRO_DE_COMIDAS.irAVinculos} tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
      </Aviso>
    );
  }
  const origenes = (
    <View style={estilos.origenes}>
      <BotonDeOrigen texto={COPY_REGISTRO_DE_COMIDAS.camara} icono={<IconoDeCamara color={COLOR.acento} />} onPress={() => void elegir('camara')} deshabilitado={ocupado} anchoBase={anchoDeOrigen} />
      <BotonDeOrigen texto={COPY_REGISTRO_DE_COMIDAS.galeria} icono={<IconoDeGaleria color={COLOR.acento} />} onPress={() => void elegir('galeria')} deshabilitado={ocupado} anchoBase={anchoDeOrigen} />
    </View>
  );
  return (
    <View>
      <Titulo>{COPY_REGISTRO_DE_COMIDAS.comiAlgoDiferente}</Titulo>
      <Text style={estilos.contexto}>{`${comida} · ${fechaLarga(fecha)}`}</Text>
      <Parrafo>{COPY_REGISTRO_DE_COMIDAS.podesAgregar}</Parrafo>

      <View style={[estilos.cajaDeFoto, foto ? estilos.cajaConFoto : null]}>
        {foto ? (
          <>
            <Image source={{ uri: foto.uri }} style={estilos.vistaPrevia} resizeMode="cover" accessible accessibilityRole="image" accessibilityLabel={COPY_REGISTRO_DE_COMIDAS.tuFoto} />
            {reemplazando ? (
              <>
                <Text style={estilos.rotuloDeFoto}>{COPY_REGISTRO_DE_COMIDAS.reemplazarFoto}</Text>
                {origenes}
              </>
            ) : (
              <View style={estilos.origenes}>
                <View style={[estilos.accionDeFoto, { flexBasis: anchoDeAccion }]}>
                  <Boton texto={COPY_REGISTRO_DE_COMIDAS.reemplazarFoto} tipo="secundario" onPress={() => setReemplazando(true)} deshabilitado={ocupado} />
                </View>
                <View style={[estilos.accionDeFoto, { flexBasis: anchoDeAccion }]}>
                  <Boton texto={COPY_REGISTRO_DE_COMIDAS.quitarFoto} tipo="peligroSecundario" onPress={quitarFoto} deshabilitado={ocupado} />
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <IconoDeCamara color={COLOR.acento} tamano={44} grosor={1.6} />
            <Text style={estilos.agregarFoto}>{COPY_REGISTRO_DE_COMIDAS.agregarFoto}</Text>
            {origenes}
          </>
        )}
      </View>
      {avisoDeFoto ? <Aviso tipo="error" titulo={avisoDeFoto} /> : null}
      <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.fotoPrivada}</Parrafo>

      <Campo
        etiqueta={COPY_REGISTRO_DE_COMIDAS.queComiste}
        value={descripcion}
        onChangeText={(t) => {
          setDescripcion(t);
          if (t.trim()) setFaltaContenido(false);
        }}
        multiline
        maxLength={500}
        editable={!estaOcupado(estado)}
        error={faltaContenido ? COPY_REGISTRO_DE_COMIDAS.hacenFaltaDatos : null}
        // Un cuadro de varias líneas, con el texto arriba: el estilo del campo, más alto.
        style={[ui.entrada, estilos.textoLargo, faltaContenido ? ui.entradaConError : null]}
      />
      <Campo
        etiqueta={COPY_REGISTRO_DE_COMIDAS.cantidadAproximada}
        placeholder={COPY_REGISTRO_DE_COMIDAS.ejemploDeCantidad}
        value={cantidadAproximada}
        onChangeText={setCantidadAproximada}
        maxLength={200}
        editable={!estaOcupado(estado)}
        // De varias líneas: con letra grande, el ejemplo y lo escrito bajan de línea en vez de cortarse.
        multiline
        style={[ui.entrada, estilos.textoMedio]}
      />
      <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular} texto={COPY_REGISTRO_DE_COMIDAS.macrosSinCalcularDetalle} />

      {estado.tipo === 'error-de-la-foto' ? <Aviso tipo="error" titulo={COPY_REGISTRO_DE_COMIDAS.fotoNoSubio} /> : null}
      {sinAceptarFotos && foto ? <Aviso tipo="info" titulo={COPY_EVIDENCIA_VISUAL.sinLaFoto} /> : null}
      {estado.tipo === 'error-al-guardar' ? <Aviso tipo="error" titulo={estado.mensaje} /> : null}
      <Boton texto={textoDelBotonDeGuardar(estado, comida)} onPress={() => void guardar(true)} ocupado={estaOcupado(estado)} deshabilitado={eligiendo} />
      {(estado.tipo === 'error-de-la-foto' || (sinAceptarFotos && foto)) && descripcion.trim() ? <Boton texto={COPY_REGISTRO_DE_COMIDAS.guardarSinLaFoto} tipo="secundario" onPress={() => void guardar(false)} /> : null}
      <Boton texto={COPY_REGISTRO_DE_COMIDAS.volverAlPlan} tipo="secundario" onPress={volverAlPlan} deshabilitado={estaOcupado(estado)} />
      {informacionDeFotos ? (
        <InformacionDeFotos
          token={token}
          detalle={informacionDeFotos}
          sesionPerdida={sesionPerdida}
          alAceptar={() => {
            setInformacionDeFotos(null);
            void guardar(true);
          }}
          alCerrar={() => {
            setInformacionDeFotos(null);
            setSinAceptarFotos(true);
          }}
        />
      ) : null}
    </View>
  );
}

/** «Cámara» o «Galería»: un botón con su ícono, de 48 dp, que baja de línea entero con letra grande. */
function BotonDeOrigen({ texto, icono, onPress, deshabilitado, anchoBase }: { texto: string; icono: ReactNode; onPress: () => void; deshabilitado: boolean; anchoBase: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [estilos.origen, { flexBasis: anchoBase }, deshabilitado && estilos.deshabilitado, pressed && estilos.presionado]}
    >
      {icono}
      <Text style={estilos.textoDeOrigen}>{texto}</Text>
    </Pressable>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  contexto: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: COLOR.acento, marginTop: -6, marginBottom: 4 },
  textoLargo: { minHeight: 96, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
  textoMedio: { paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
  cajaDeFoto: {
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLOR.acento,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    backgroundColor: COLOR.superficie,
  },
  cajaConFoto: { borderStyle: 'solid', borderColor: COLOR.borde, alignItems: 'stretch' },
  agregarFoto: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: COLOR.acento },
  rotuloDeFoto: { fontSize: 15, fontWeight: '700', color: COLOR.texto, marginTop: 4 },
  vistaPrevia: { alignSelf: 'stretch', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: COLOR.superficieElevada },
  origenes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, alignSelf: 'stretch' },
  accionDeFoto: { flexGrow: 1 },
  origen: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLOR.borde,
    backgroundColor: COLOR.superficieElevada,
  },
  textoDeOrigen: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  deshabilitado: { opacity: 0.6 },
  presionado: { opacity: 0.8 },
}));
