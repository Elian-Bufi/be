/**
 * APK · Detalle de vínculo del asesorado (CAND-10-REL-05; 10-B04 §17-§27).
 * Bloques: profesional, alcance, finalidad, estado del vínculo y de tu consentimiento, consentimiento, acciones e
 * historial mínimo de estado. Sin razones internas de autorización, gates técnicos ni metadata de sesión (10-B04 §20).
 * - Consentimiento: «Revisar consentimiento» o «Autorizar nuevamente» solo con el vínculo activo (en pausa o finalizado
 *   la API no admite consentir); «Revocar acceso de [Profesional]» mientras esté activo (CAND-10-CON-B).
 * - Pausar, reanudar y finalizar: confirmación contextual + CTA explícito, con motivo de una lista cerrada y sin
 *   preselección (DL-033). Solo reanuda quien pausó; si pausó la otra parte, se dice. Finalizar no pide escribir nada
 *   (CAND-10-REL-B).
 * - `expectedVersion` es la versión que esta pantalla mostró; si cambió, «Actualizá la vista» (09:255-257).
 * Ocultar un botón no es un control: la API decide cada acción y la pantalla muestra lo que responde.
 */
import {
  COPY_VINCULO,
  ETIQUETA_DE_FINALIDAD,
  ETIQUETA_DE_MOTIVO,
  MOTIVOS_DE_FINALIZACION_DE_PARTICIPANTE,
  MotivoDePausa,
  estadoParaMostrar,
  etiquetaDeActor,
  etiquetaDeConsentimiento,
  etiquetaDeEvento,
  type DetalleDeVinculoResponse,
  type FinalizarVinculoRequest,
  type PausarVinculoRequest,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { DialogoDeConfirmacion, SelectorDeMotivo, useAccionConfirmada } from '../dialogo';
import { Cargando, ErrorConReintento } from '../estados';
import { fecha } from '../formato';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { AvisoDeAccesoRevocado, RevocarConsentimiento } from '../revocacion';
import { Aviso, Boton, COLOR, Dato, Insignia, Parrafo, Seccion, Titulo, estilos as ui } from '../ui';

type Detalle = DetalleDeVinculoResponse['data'];
type Carga = { readonly tipo: 'cargando' } | { readonly tipo: 'no-revelable' } | { readonly tipo: 'error'; readonly sinConexion: boolean } | { readonly tipo: 'listo'; readonly v: Detalle };
type Exito = { readonly tipo: 'pausado' | 'reanudado' | 'finalizado' | 'revocado'; readonly profesional: string };

const MOTIVOS_DE_PAUSA: readonly PausarVinculoRequest['reason'][] = Object.values(MotivoDePausa);
/** `CIERRE_DE_CUENTA` es del sistema: una parte nunca lo elige (DL-033). */
const MOTIVOS_DE_FINALIZACION = MOTIVOS_DE_FINALIZACION_DE_PARTICIPANTE.filter((m): m is FinalizarVinculoRequest['reason'] => m !== 'CIERRE_DE_CUENTA');

export function PantallaDeVinculo({
  token,
  identidadId,
  id,
  salir,
  ir,
  volver,
  subir,
}: {
  token: string;
  identidadId: string;
  id: string;
  salir: (motivo: Salida) => void;
  ir: (r: Ruta) => void;
  volver: () => void;
  /** Lleva la pantalla al principio, donde queda el resultado de cada acción. */
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [exito, setExito] = useState<Exito | null>(null);
  // Una respuesta vieja no pisa una recarga posterior.
  const generacion = useRef(0);

  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setCarga({ tipo: 'cargando' });
    const r = await api.consultarVinculo(token, id);
    if (esta !== generacion.current || sesionPerdida(r)) return;
    if (!r.ok) {
      // 404 idéntico para inexistente, ajeno o no visible: no se distingue (10-B04 §40).
      return setCarga(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'no-revelable' } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
    }
    // Esta pantalla es del asesorado: un vínculo donde esta cuenta es el profesional no se muestra acá.
    setCarga(r.datos.data.advisee.identityId === identidadId ? { tipo: 'listo', v: r.datos.data } : { tipo: 'no-revelable' });
  }, [token, id, identidadId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const recargar = () => void cargar();

  const contenido = () => {
    if (carga.tipo === 'cargando') return <Cargando />;
    if (carga.tipo === 'error') return <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={recargar} />;
    if (carga.tipo === 'no-revelable') {
      return (
        <Aviso tipo="info" titulo={COPY_VINCULO.noPudimosAbrir}>
          <Boton texto={COPY_VINCULO.volver} tipo="secundario" onPress={volver} />
        </Aviso>
      );
    }

    const v = carga.v;
    const profesional = v.professional.displayName;
    const e = estadoParaMostrar(v, 'ADVISEE');
    const activo = v.relationshipState === 'ACEPTADO';
    const irAConsentimiento = () => ir({ nombre: 'consentimiento', vinculoId: v.relationshipId });
    const tras = (tipo: Exito['tipo']) => () => {
      setExito({ tipo, profesional });
      subir();
      recargar();
    };
    const acciones = { v, token, sesionPerdida, alRecargar: recargar };

    return (
      <>
        <Seccion titulo={profesional}>
          <Dato etiqueta={COPY_VINCULO.alcance} valor={v.scope.label} />
          <Dato etiqueta={COPY_VINCULO.finalidad} valor={ETIQUETA_DE_FINALIDAD[v.purpose]} />
          <Insignia texto={e.estado} positiva={activo} etiqueta="Estado del vínculo" />
          {e.detalle ? <Parrafo>{e.detalle}</Parrafo> : null}
          <Dato etiqueta="Desde" valor={fecha(v.acceptedAt)} />
          {v.relationshipState === 'FINALIZADO' && exito?.tipo !== 'finalizado' ? <Parrafo tenue>{COPY_VINCULO.historialDisponible}</Parrafo> : null}
        </Seccion>

        <Seccion titulo="Consentimiento">
          <Insignia
            texto={etiquetaDeConsentimiento(v.consentState, v.accessMode)}
            positiva={v.consentState === 'ACTIVE' && v.accessMode === 'CONTEXTUAL'}
            etiqueta="Consentimiento"
          />
          {v.consent ? (
            <>
              <Dato etiqueta="Autorizado" valor={fecha(v.consent.acceptedAt)} />
              {v.consent.revokedAt ? <Dato etiqueta="Revocado" valor={fecha(v.consent.revokedAt)} /> : null}
            </>
          ) : null}
          {activo && v.consentState === 'REQUIRED' ? <Boton texto={COPY_VINCULO.revisarConsentimiento} onPress={irAConsentimiento} /> : null}
          {activo && v.consentState === 'REVOKED' ? <Boton texto={COPY_VINCULO.autorizarNuevamente} onPress={irAConsentimiento} /> : null}
          {/* Con el consentimiento vigente, la pantalla del acto dice si hay una versión nueva para revisar. */}
          {activo && v.consentState === 'ACTIVE' ? <Boton texto={COPY_VINCULO.revisarConsentimiento} tipo="secundario" onPress={irAConsentimiento} /> : null}
          {v.consent?.state === 'ACTIVE' ? (
            <RevocarConsentimiento
              token={token}
              consentId={v.consent.consentId}
              profesional={profesional}
              sesionPerdida={sesionPerdida}
              alRevocar={tras('revocado')}
              alRecargar={recargar}
            />
          ) : null}
        </Seccion>

        {v.relationshipState !== 'FINALIZADO' ? (
          <Seccion titulo="Acciones">
            {v.relationshipState === 'PAUSADO' ? (
              <Aviso tipo="info" titulo={COPY_VINCULO.vinculoPausado}>
                <Parrafo>{COPY_VINCULO.accesoProfesionalBloqueado}</Parrafo>
                {v.pausedBy !== 'ADVISEE' ? <Parrafo>{COPY_VINCULO.soloReanudaQuienPauso}</Parrafo> : null}
              </Aviso>
            ) : null}
            {activo ? <Pausar {...acciones} alTerminar={tras('pausado')} /> : null}
            {v.relationshipState === 'PAUSADO' && v.pausedBy === 'ADVISEE' ? <Reanudar {...acciones} alTerminar={tras('reanudado')} /> : null}
            <Finalizar {...acciones} alTerminar={tras('finalizado')} />
          </Seccion>
        ) : null}

        <Seccion titulo="Historial">
          {v.history.length === 0 ? <Parrafo tenue>{COPY_VINCULO.sinDatosTodavia}</Parrafo> : null}
          {v.history.map((h, i) => {
            const motivo = h.reason !== null && Object.hasOwn(ETIQUETA_DE_MOTIVO, h.reason) ? ETIQUETA_DE_MOTIVO[h.reason as keyof typeof ETIQUETA_DE_MOTIVO] : null;
            return (
              <View key={i} style={estilos.entrada} accessible>
                <Text style={ui.negrita}>{etiquetaDeEvento(h.event)}</Text>
                <Text style={ui.tenue}>
                  {fecha(h.occurredAt)} · {etiquetaDeActor(h.actor, 'ADVISEE')}
                </Text>
                {motivo ? (
                  <Text style={ui.tenue}>
                    {COPY_VINCULO.motivo}: {motivo}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </Seccion>
      </>
    );
  };

  return (
    <>
      <Titulo>Vínculo</Titulo>
      {exito ? <AvisoDeExito exito={exito} /> : null}
      {contenido()}
    </>
  );
}

function AvisoDeExito({ exito }: { exito: Exito }) {
  switch (exito.tipo) {
    case 'pausado':
      return (
        <Aviso tipo="exito" titulo={COPY_VINCULO.vinculoPausado}>
          <Parrafo>{COPY_VINCULO.accesoProfesionalBloqueado}</Parrafo>
        </Aviso>
      );
    case 'reanudado':
      return (
        <Aviso tipo="exito" titulo={COPY_VINCULO.vinculoReanudado}>
          <Parrafo>{COPY_VINCULO.reanudacionSimple}</Parrafo>
        </Aviso>
      );
    case 'finalizado':
      return (
        <Aviso tipo="exito" titulo={COPY_VINCULO.vinculoFinalizado}>
          <Parrafo>{COPY_VINCULO.vinculoFinalizadoDetalle(exito.profesional)}</Parrafo>
          <Parrafo>{COPY_VINCULO.historialDisponible}</Parrafo>
        </Aviso>
      );
    case 'revocado':
      return <AvisoDeAccesoRevocado />;
  }
}

// ─── Pausar, reanudar y finalizar ───────────────────────────────────────────────────────────────

interface PropsDeAccion {
  v: Detalle;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alTerminar: () => void;
  alRecargar: () => void;
}

function Pausar({ v, token, sesionPerdida, alTerminar, alRecargar }: PropsDeAccion) {
  const a = useAccionConfirmada({ sesionPerdida, alTerminar, alRecargar });
  const [motivo, setMotivo] = useState<PausarVinculoRequest['reason'] | null>(null);
  return (
    <>
      <Boton
        texto={COPY_VINCULO.pausarVinculo}
        tipo="secundario"
        onPress={() => {
          setMotivo(null);
          a.abrir();
        }}
      />
      <DialogoDeConfirmacion
        visible={a.visible}
        titulo={COPY_VINCULO.pausarVinculo}
        textoConfirmar={COPY_VINCULO.pausarVinculo}
        textoEnviando="Pausando…"
        enviando={a.enviando}
        fallo={a.fallo}
        confirmarDeshabilitado={!motivo}
        onVolver={a.volver}
        onActualizar={a.actualizar}
        onConfirmar={() => {
          if (motivo) void a.ejecutar((clave) => api.pausarVinculo(token, v.relationshipId, v.version, motivo, clave));
        }}
      >
        <Parrafo>{COPY_VINCULO.explicacionDePausa}</Parrafo>
        <SelectorDeMotivo motivos={MOTIVOS_DE_PAUSA} valor={motivo} onCambio={setMotivo} deshabilitado={a.congelado} />
      </DialogoDeConfirmacion>
    </>
  );
}

function Reanudar({ v, token, sesionPerdida, alTerminar, alRecargar }: PropsDeAccion) {
  const a = useAccionConfirmada({
    sesionPerdida,
    alTerminar,
    alRecargar,
    // 403 solo cuando revelar la prohibición no filtra nada (09v7:151-157): la otra parte pausó (DL-033).
    propios: { ACTION_FORBIDDEN: { mensaje: COPY_VINCULO.soloReanudaQuienPauso, tipo: 'actualizar' } },
  });
  return (
    <>
      <Boton texto={COPY_VINCULO.reanudarVinculo} onPress={a.abrir} />
      <DialogoDeConfirmacion
        visible={a.visible}
        titulo={COPY_VINCULO.reanudarVinculo}
        textoConfirmar={COPY_VINCULO.reanudarVinculo}
        textoEnviando="Reanudando…"
        enviando={a.enviando}
        fallo={a.fallo}
        onVolver={a.volver}
        onActualizar={a.actualizar}
        onConfirmar={() => void a.ejecutar((clave) => api.reanudarVinculo(token, v.relationshipId, v.version, clave))}
      >
        <Parrafo>{COPY_VINCULO.explicacionDeReanudacion}</Parrafo>
        <Parrafo>{COPY_VINCULO.reanudacionSimple}</Parrafo>
      </DialogoDeConfirmacion>
    </>
  );
}

function Finalizar({ v, token, sesionPerdida, alTerminar, alRecargar }: PropsDeAccion) {
  const a = useAccionConfirmada({ sesionPerdida, alTerminar, alRecargar });
  const [motivo, setMotivo] = useState<FinalizarVinculoRequest['reason'] | null>(null);
  return (
    <>
      <Boton
        texto={COPY_VINCULO.finalizarVinculo}
        tipo="peligroSecundario"
        onPress={() => {
          setMotivo(null);
          a.abrir();
        }}
      />
      <DialogoDeConfirmacion
        visible={a.visible}
        titulo={COPY_VINCULO.finalizarVinculoCon(v.professional.displayName)}
        textoConfirmar={COPY_VINCULO.finalizarVinculo}
        textoEnviando="Finalizando…"
        peligro
        enviando={a.enviando}
        fallo={a.fallo}
        confirmarDeshabilitado={!motivo}
        onVolver={a.volver}
        onActualizar={a.actualizar}
        onConfirmar={() => {
          if (motivo) void a.ejecutar((clave) => api.finalizarVinculo(token, v.relationshipId, v.version, motivo, clave));
        }}
      >
        <Parrafo>{COPY_VINCULO.consecuenciaDeFinalizar}</Parrafo>
        <SelectorDeMotivo motivos={MOTIVOS_DE_FINALIZACION} valor={motivo} onCambio={setMotivo} deshabilitado={a.congelado} />
      </DialogoDeConfirmacion>
    </>
  );
}

const estilos = StyleSheet.create({
  entrada: { borderLeftWidth: 3, borderLeftColor: COLOR.borde, paddingLeft: 10, marginVertical: 6 },
});
