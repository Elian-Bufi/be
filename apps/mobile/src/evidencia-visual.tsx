/**
 * `EVIDENCIA_VISUAL` en la APK (08 §12.4 y §21.3; precierre del 2026-10-06, §6; DL-125). Solo aparece cuando la API exige
 * el acto (`BE_EVIDENCIA_VISUAL_EXIGIDA`): sin la exigencia, la foto se sube como en DL-120, con el aviso de siempre.
 * - **`InformacionDeFotos`:** el texto versionado, entero y abierto, en el momento de la subida (08 §21.3: visible y
 *   específico, no enterrado). Lo pide al recibir el 403 de API-MED-01, con el vínculo y la versión que trae. «Ahora no»
 *   es tan visible como aceptar y no pierde nada: la foto y lo escrito siguen, y la comida se puede guardar sin la foto.
 *   Aceptar registra el acto con la versión mostrada (API-EVI-02, con la misma clave si la respuesta fue incierta) y la
 *   subida sigue sola. Mientras el texto sea una propuesta, la pantalla lo dice.
 * - **`FotosDeTusComidas`:** en Privacidad, los actos propios (API-EVI-03), con «Revocar fotos para …» (API-EVI-04),
 *   que no lleva clave: revocar es idempotente por semántica.
 * - **`useBorrarFoto`:** «Borrar esta foto» en el registro de una comida (API-MED-05): borra la imagen y deja la
 *   constancia; el registro sigue, sin la foto.
 */
import {
  COPY_EVIDENCIA_VISUAL,
  type ActoDeEvidenciaVisual,
  type DetalleDeEvidenciaVisualRequerida,
  type RequisitoDeEvidenciaVisualResponse,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { api } from './api';
import { DialogoDeConfirmacion, useAccionConfirmada } from './dialogo';
import { Cargando, ErrorConReintento, EstadoDeCarga, VerMas } from './estados';
import { dia, fecha } from './formato';
import { falloDe, useClaveDeIntento, type Fallo } from './intento';
import { useListaPaginada } from './lista';
import { Aviso, Boton, Dato, Insignia, Parrafo, Tarjeta, estilos as ui, estilosPorTema } from './ui';

type Requisito = RequisitoDeEvidenciaVisualResponse['data'];
type Carga = { readonly tipo: 'cargando' } | { readonly tipo: 'error'; readonly sinConexion: boolean } | { readonly tipo: 'listo'; readonly datos: Requisito };

/** La información destacada antes de la primera foto para un profesional. */
export function InformacionDeFotos({
  token,
  detalle,
  sesionPerdida,
  alAceptar,
  alCerrar,
}: {
  token: string;
  /** Lo que trajo el 403 de API-MED-01: el vínculo de Nutrición y la versión a mostrar. */
  detalle: DetalleDeEvidenciaVisualRequerida;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** El acto quedó registrado: la subida puede seguir. */
  alAceptar: () => void;
  /** «Ahora no»: no se registra nada, y la foto y lo escrito siguen en la pantalla. */
  alCerrar: () => void;
}) {
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const intento = useClaveDeIntento();
  const generacion = useRef(0);
  const enCurso = useRef(false);

  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setCarga({ tipo: 'cargando' });
    setFallo(null);
    const r = await api.consultarRequisitoDeEvidenciaVisual(token, detalle.relationshipId);
    if (esta !== generacion.current || sesionPerdida(r)) return;
    setCarga(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, detalle.relationshipId, sesionPerdida]);

  useEffect(() => {
    void cargar();
    // Una respuesta que llega con el diálogo cerrado no se muestra.
    return () => {
      generacion.current++;
    };
  }, [cargar]);

  async function aceptar(version: string) {
    if (enCurso.current) return;
    enCurso.current = true;
    setEnviando(true);
    setFallo(null);
    const r = await api.otorgarEvidenciaVisual(token, detalle.relationshipId, version, intento.actual());
    enCurso.current = false;
    intento.registrar(r);
    setEnviando(false);
    // Registrado ahora o ya vigente desde otro intento: la subida sigue.
    if (r.ok || (r.tipo === 'API' && r.codigo === 'CONSENT_ALREADY_ACTIVE')) return alAceptar();
    if (sesionPerdida(r)) return;
    // La versión cambió mientras se leía: se vuelve a cargar el texto, que es lo que se acepta.
    if (r.tipo === 'API' && r.codigo === 'CONSENT_VERSION_STALE') return void cargar();
    setFallo(falloDe(r, { RELATIONSHIP_NOT_READY_FOR_CONSENT: { mensaje: COPY_EVIDENCIA_VISUAL.noSeRegistro, tipo: 'otro' } }));
  }

  const datos = carga.tipo === 'listo' ? carga.datos : null;
  const [titulo, ...parrafos] = datos ? datos.consentVersion.text.split('\n\n') : [''];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => (enviando ? undefined : alCerrar())}>
      <View style={estilos.fondo}>
        <ScrollView contentContainerStyle={estilos.centrado}>
          <View style={estilos.dialogo} accessibilityViewIsModal>
            <Text style={ui.tituloDeSeccion} accessibilityRole="header">
              {COPY_EVIDENCIA_VISUAL.antesDeTuPrimeraFoto}
            </Text>
            {carga.tipo === 'cargando' ? <Cargando /> : null}
            {carga.tipo === 'error' ? <ErrorConReintento mensaje={COPY_EVIDENCIA_VISUAL.noSeCargo} sinConexion={carga.sinConexion} onReintentar={() => void cargar()} /> : null}
            {datos ? (
              <>
                <Parrafo>{COPY_EVIDENCIA_VISUAL.paraQuien(datos.professional.displayName)}</Parrafo>
                {datos.textApproval === 'PENDING_APPROVAL' ? <Aviso tipo="info" titulo={COPY_EVIDENCIA_VISUAL.propuesta} /> : null}
                <View style={estilos.texto}>
                  <Text style={[ui.parrafo, ui.negrita]} accessibilityRole="header">
                    {titulo}
                  </Text>
                  <Text style={ui.tenue}>{COPY_EVIDENCIA_VISUAL.version(datos.consentVersion.id)}</Text>
                  <Text style={ui.tenue}>Vigente desde: {dia(datos.consentVersion.effectiveFrom)}</Text>
                  <Text style={ui.tenue} selectable>
                    Huella SHA-256: {datos.consentVersion.textHash}
                  </Text>
                  {parrafos.map((p, i) => (
                    <Text key={i} style={ui.parrafo}>
                      {p}
                    </Text>
                  ))}
                </View>
              </>
            ) : null}
            {fallo ? <Aviso tipo="error" titulo={fallo.tipo === 'incierto' ? fallo.mensaje : COPY_EVIDENCIA_VISUAL.noSeRegistro} /> : null}
            <Boton texto={COPY_EVIDENCIA_VISUAL.ahoraNo} tipo="secundario" onPress={alCerrar} deshabilitado={enviando} />
            {datos ? (
              <Boton
                texto={enviando ? COPY_EVIDENCIA_VISUAL.aceptando : COPY_EVIDENCIA_VISUAL.aceptar}
                onPress={() => void aceptar(datos.consentVersion.id)}
                ocupado={enviando}
              />
            ) : null}
            <Parrafo tenue>{COPY_EVIDENCIA_VISUAL.sinLaFoto}</Parrafo>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Cuenta → Privacidad: lo que la persona aceptó antes de subir fotos, por profesional, con su revocación. */
export function FotosDeTusComidas({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const actos = useListaPaginada(
    useCallback((cursor?: string) => api.consultarEvidenciasVisuales(token, { cursor }), [token]),
    sesionPerdida,
  );
  const [revocada, setRevocada] = useState(false);
  return (
    <>
      <Parrafo>{COPY_EVIDENCIA_VISUAL.explicacion}</Parrafo>
      {revocada ? <Aviso tipo="exito" titulo={COPY_EVIDENCIA_VISUAL.revocadaListo} /> : null}
      <EstadoDeCarga estado={actos.estado} onReintentar={actos.recargar} />
      {actos.estado.tipo === 'listo' && actos.estado.items.length === 0 ? <Parrafo>{COPY_EVIDENCIA_VISUAL.ninguna}</Parrafo> : null}
      {actos.estado.tipo === 'listo'
        ? actos.estado.items.map((acto) => (
            <ActoDeFotos
              key={acto.consentId}
              acto={acto}
              token={token}
              sesionPerdida={sesionPerdida}
              alRecargar={() => void actos.recargar()}
              alRevocar={() => {
                setRevocada(true);
                void actos.recargar();
              }}
            />
          ))
        : null}
      <VerMas estado={actos.estado} onVerMas={actos.verMas} />
    </>
  );
}

function ActoDeFotos({
  acto,
  token,
  sesionPerdida,
  alRecargar,
  alRevocar,
}: {
  acto: ActoDeEvidenciaVisual;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alRecargar: () => void;
  alRevocar: () => void;
}) {
  const revocar = useAccionConfirmada({ sesionPerdida, alTerminar: alRevocar, alRecargar });
  const titulo = COPY_EVIDENCIA_VISUAL.revocarPara(acto.professional.displayName);
  const vigente = acto.state === 'ACTIVE';
  return (
    <Tarjeta>
      <Text style={[ui.parrafo, ui.negrita]}>{acto.professional.displayName}</Text>
      <Insignia texto={vigente ? COPY_EVIDENCIA_VISUAL.vigente : COPY_EVIDENCIA_VISUAL.revocada} positiva={vigente} etiqueta={COPY_EVIDENCIA_VISUAL.titulo} />
      <Dato etiqueta="Aceptada" valor={fecha(acto.acceptedAt)} />
      {acto.revokedAt ? <Dato etiqueta="Revocada" valor={fecha(acto.revokedAt)} /> : null}
      <Dato etiqueta="Versión" valor={acto.consentVersionId} />
      {vigente ? (
        <>
          <Boton texto={titulo} tipo="peligroSecundario" onPress={revocar.abrir} />
          <DialogoDeConfirmacion
            visible={revocar.visible}
            titulo={titulo}
            textoConfirmar={COPY_EVIDENCIA_VISUAL.revocar}
            textoEnviando={COPY_EVIDENCIA_VISUAL.revocando}
            peligro
            enviando={revocar.enviando}
            fallo={revocar.fallo}
            onVolver={revocar.volver}
            onActualizar={revocar.actualizar}
            onConfirmar={() => void revocar.ejecutar(() => api.revocarEvidenciaVisual(token, acto.consentId))}
          >
            <Parrafo>{COPY_EVIDENCIA_VISUAL.queImplicaRevocar}</Parrafo>
          </DialogoDeConfirmacion>
        </>
      ) : null}
    </Tarjeta>
  );
}

/** «Borrar esta foto» (API-MED-05), con su confirmación: se borra la imagen y queda la constancia. */
export function useBorrarFoto({
  token,
  sesionPerdida,
  alBorrar,
  alActualizar,
}: {
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alBorrar: () => void;
  alActualizar: () => void;
}) {
  const [mediaId, setMediaId] = useState<string | null>(null);
  const accion = useAccionConfirmada({ sesionPerdida, alTerminar: alBorrar, alRecargar: alActualizar });
  const dialogo = mediaId ? (
    <DialogoDeConfirmacion
      visible={accion.visible}
      titulo={COPY_EVIDENCIA_VISUAL.borrarFoto}
      textoConfirmar={COPY_EVIDENCIA_VISUAL.borrar}
      textoEnviando={COPY_EVIDENCIA_VISUAL.borrando}
      peligro
      enviando={accion.enviando}
      fallo={accion.fallo}
      onVolver={accion.volver}
      onActualizar={accion.actualizar}
      onConfirmar={() => void accion.ejecutar((clave) => api.suprimirMedio(token, mediaId, clave))}
    >
      <Parrafo>{COPY_EVIDENCIA_VISUAL.queImplicaBorrar}</Parrafo>
    </DialogoDeConfirmacion>
  ) : null;
  return {
    abrir: (id: string) => {
      setMediaId(id);
      accion.abrir();
    },
    dialogo,
  };
}

const estilos = estilosPorTema((COLOR) => ({
  fondo: { flex: 1, backgroundColor: COLOR.velo },
  centrado: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  // Como el de `DialogoDeConfirmacion`.
  dialogo: { backgroundColor: COLOR.superficie, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLOR.borde },
  texto: { gap: 6, paddingVertical: 4 },
}));
