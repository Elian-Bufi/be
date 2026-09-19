'use client';

/**
 * Website `/account/relationships/detail?id=…` — Detalle de vínculo del asesorado (CAND-10-REL-05; 10-B04 §20-§27).
 * Bloques: profesional, alcance, finalidad, estado del vínculo, consentimiento, acceso actual resumido, historial
 * mínimo de estado y acciones. Sin razones internas de autorización, gates técnicos ni metadata de sesión.
 * - Pausar, reanudar y finalizar: confirmación contextual + CTA explícito (§22, §24, §25-§26), con motivo de una lista
 *   cerrada (DL-033). Solo reanuda quien pausó; si pausó la otra parte, se dice (DL-033).
 * - `expectedVersion` es la versión que esta pantalla mostró; si cambió, «Actualizá la vista» (09:255-257).
 */
import {
  COPY,
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
  type MotivoDeFinalizacion,
} from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DialogoDeConfirmacion, SelectorDeMotivo } from '../../../../components/dialogo';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { AvisoDeAccesoRevocado, RevocarConsentimiento } from '../../../../components/revocacion';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useSesionRequerida } from '../../../../lib/sesion-requerida';

type Detalle = DetalleDeVinculoResponse['data'];
type Carga = { tipo: 'cargando' } | { tipo: 'no-revelable' } | { tipo: 'error' } | { tipo: 'listo'; v: Detalle };
type Exito = 'pausado' | 'reanudado' | 'finalizado' | 'revocado' | null;

const MOTIVOS_DE_PAUSA = Object.values(MotivoDePausa);

export function DetalleDeVinculo() {
  const id = useSearchParams().get('id') ?? '';
  const { token, sesionPerdida } = useSesionRequerida(`/account/relationships/detail?id=${id}`);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [exito, setExito] = useState<Exito>(null);

  const cargar = useCallback(async () => {
    if (!token) return;
    if (!id) return setCarga({ tipo: 'no-revelable' });
    setCarga({ tipo: 'cargando' });
    const [yo, r] = await Promise.all([api.consultarCuenta(token), api.consultarVinculo(token, id)]);
    if (sesionPerdida(yo) || sesionPerdida(r)) return;
    if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return setCarga({ tipo: 'no-revelable' });
    if (!yo.ok || !r.ok) return setCarga({ tipo: 'error' });
    // Esta ruta es del asesorado: el profesional mira sus vínculos en /pro.
    if (r.datos.data.advisee.identityId !== yo.datos.data.identityId) return setCarga({ tipo: 'no-revelable' });
    setCarga({ tipo: 'listo', v: r.datos.data });
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (carga.tipo === 'cargando') return <Cargando />;
  if (carga.tipo === 'error') return <ErrorConReintento onReintentar={cargar} />;
  if (carga.tipo === 'no-revelable') {
    // 10-B04 §40: error neutral con «Volver», sin decir si existe ni por qué no se puede abrir.
    return (
      <Aviso tipo="info">
        <p>{COPY_VINCULO.noPudimosAbrir}</p>
        <p>
          <Link href="/account/relationships">{COPY_VINCULO.volver}</Link>
        </p>
      </Aviso>
    );
  }

  const v = carga.v;
  const profesional = v.professional.displayName;
  const e = estadoParaMostrar(v, 'ADVISEE');
  const accesoActual =
    v.accessMode === 'CONTEXTUAL' ? COPY_VINCULO.accesoContextual : v.consentState === 'REQUIRED' && v.relationshipState === 'ACEPTADO' ? COPY_VINCULO.accesoPendiente : COPY_VINCULO.accesoProfesionalBloqueado;
  const tras = (x: Exito) => {
    setExito(x);
    void cargar();
  };

  return (
    <div className="secciones">
      {exito === 'pausado' ? (
        <Aviso tipo="exito" enfocar>
          <p className="aviso__titulo">{COPY_VINCULO.vinculoPausado}</p>
          <p>{COPY_VINCULO.accesoProfesionalBloqueado}</p>
        </Aviso>
      ) : null}
      {exito === 'reanudado' ? (
        <Aviso tipo="exito" enfocar>
          <p className="aviso__titulo">{COPY_VINCULO.vinculoReanudado}</p>
          <p>{COPY_VINCULO.reanudacionSimple}</p>
        </Aviso>
      ) : null}
      {exito === 'finalizado' ? (
        <Aviso tipo="exito" enfocar>
          <p className="aviso__titulo">{COPY_VINCULO.vinculoFinalizado}</p>
          <p>{COPY_VINCULO.vinculoFinalizadoDetalle(profesional)}</p>
          <p>{COPY_VINCULO.historialDisponible}</p>
        </Aviso>
      ) : null}
      {exito === 'revocado' ? <AvisoDeAccesoRevocado /> : null}

      <section className="seccion" aria-labelledby="titulo-vinculo">
        <h2 id="titulo-vinculo">{profesional}</h2>
        <dl className="datos">
          <div>
            <dt>{COPY_VINCULO.alcance}</dt>
            <dd>{v.scope.label}</dd>
          </div>
          <div>
            <dt>{COPY_VINCULO.finalidad}</dt>
            <dd>{ETIQUETA_DE_FINALIDAD[v.purpose]}</dd>
          </div>
          <div>
            <dt>Estado del vínculo</dt>
            <dd>
              <span className="insignia">{e.estado}</span>
            </dd>
          </div>
          <div>
            <dt>Acceso actual</dt>
            <dd>{accesoActual}</dd>
          </div>
          <div>
            <dt>Vínculo desde</dt>
            <dd>{fecha(v.acceptedAt)}</dd>
          </div>
        </dl>
        {v.relationshipState === 'PAUSADO' ? (
          <Aviso tipo="info">
            <p className="aviso__titulo">{COPY_VINCULO.vinculoPausado}</p>
            <p>{COPY_VINCULO.accesoProfesionalBloqueado}</p>
            {v.pausedBy !== 'ADVISEE' ? <p>{COPY_VINCULO.soloReanudaQuienPauso}</p> : null}
          </Aviso>
        ) : null}
        {v.relationshipState === 'FINALIZADO' ? <p className="nota">{COPY_VINCULO.historialDisponible}</p> : null}
      </section>

      <section className="seccion" aria-labelledby="titulo-consentimiento">
        <h2 id="titulo-consentimiento">Consentimiento</h2>
        <p>
          <span className={`insignia ${v.consentState === 'ACTIVE' && v.accessMode === 'CONTEXTUAL' ? 'insignia--si' : 'insignia--no'}`}>
            {etiquetaDeConsentimiento(v.consentState, v.accessMode)}
          </span>
        </p>
        {v.consent ? (
          <dl className="datos datos--compactos">
            <div>
              <dt>Autorizado</dt>
              <dd>{fecha(v.consent.acceptedAt)}</dd>
            </div>
            {v.consent.revokedAt ? (
              <div>
                <dt>Revocado</dt>
                <dd>{fecha(v.consent.revokedAt)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Versión aceptada</dt>
              <dd>
                <code>{v.consent.consentVersionId}</code>
              </dd>
            </div>
          </dl>
        ) : null}
        <div className="acciones">
          {v.relationshipState === 'ACEPTADO' && v.consentState !== 'ACTIVE' ? (
            <Link className="boton boton--primario" href={`/account/relationships/consent?id=${encodeURIComponent(v.relationshipId)}`}>
              {v.consentState === 'REVOKED' ? COPY_VINCULO.autorizarNuevamente : COPY_VINCULO.revisarConsentimiento}
            </Link>
          ) : null}
          {v.relationshipState === 'ACEPTADO' && v.consentState === 'ACTIVE' ? (
            <Link className="boton boton--secundario" href={`/account/relationships/consent?id=${encodeURIComponent(v.relationshipId)}`}>
              {COPY_VINCULO.revisarConsentimiento}
            </Link>
          ) : null}
          {v.consent && v.consent.state === 'ACTIVE' ? (
            <RevocarConsentimiento token={token} consentId={v.consent.consentId} profesional={profesional} sesionPerdida={sesionPerdida} alRevocar={() => tras('revocado')} />
          ) : null}
        </div>
      </section>

      {v.relationshipState !== 'FINALIZADO' ? (
        <section className="seccion" aria-labelledby="titulo-acciones">
          <h2 id="titulo-acciones">Acciones</h2>
          <div className="acciones">
            {v.relationshipState === 'ACEPTADO' ? <Pausar v={v} token={token} sesionPerdida={sesionPerdida} alTerminar={() => tras('pausado')} alRecargar={cargar} /> : null}
            {v.relationshipState === 'PAUSADO' && v.pausedBy === 'ADVISEE' ? (
              <Reanudar v={v} token={token} sesionPerdida={sesionPerdida} alTerminar={() => tras('reanudado')} alRecargar={cargar} />
            ) : null}
            <Finalizar v={v} token={token} sesionPerdida={sesionPerdida} alTerminar={() => tras('finalizado')} alRecargar={cargar} />
          </div>
        </section>
      ) : null}

      <section className="seccion" aria-labelledby="titulo-historial">
        <h2 id="titulo-historial">Historial</h2>
        <ol className="historial">
          {v.history.map((h, i) => (
            <li key={i}>
              <span className="historial__evento">{etiquetaDeEvento(h.event)}</span>
              <span className="nota">
                {' '}
                · {fecha(h.occurredAt)} · {etiquetaDeActor(h.actor, 'ADVISEE')}
                {h.reason && Object.hasOwn(ETIQUETA_DE_MOTIVO, h.reason) ? ` · ${ETIQUETA_DE_MOTIVO[h.reason as keyof typeof ETIQUETA_DE_MOTIVO]}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p>
        <Link href="/account/relationships">Volver a Vínculos</Link>
      </p>
    </div>
  );
}

// ─── Pausar, reanudar y finalizar ───────────────────────────────────────────────────────────────

interface PropsDeAccion {
  v: Detalle;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alTerminar: () => void;
  alRecargar: () => void;
}

type EstadoDeAccion = { tipo: 'cerrado' } | { tipo: 'abierto' } | { tipo: 'enviando' } | { tipo: 'error'; mensaje: string; incierto: boolean };

/**
 * Estado y key de una acción con confirmación. Cada apertura es un intento lógico nuevo. Con resultado incierto, el
 * diálogo ofrece «Reintentar» con la misma key; «Volver» abandona el intento y recarga el vínculo para mostrar lo que
 * realmente quedó (10-B10:430-438).
 */
function useAccionConfirmada(sesionPerdida: (r: Resultado<unknown>) => boolean, alTerminar: () => void, alAbandonarIncierto: () => void) {
  const intento = useClaveDeIntento();
  const [estado, setEstado] = useState<EstadoDeAccion>({ tipo: 'cerrado' });
  const incierto = estado.tipo === 'error' && estado.incierto;
  return {
    estado,
    incierto,
    abrir() {
      intento.descartar();
      setEstado({ tipo: 'abierto' });
    },
    volver() {
      if (estado.tipo === 'enviando') return;
      intento.descartar();
      setEstado({ tipo: 'cerrado' });
      if (incierto) alAbandonarIncierto();
    },
    async ejecutar(llamada: (clave: string) => Promise<Resultado<unknown>>) {
      if (estado.tipo === 'enviando') return;
      setEstado({ tipo: 'enviando' });
      const r = await llamada(intento.actual());
      intento.registrar(r);
      if (r.ok) {
        setEstado({ tipo: 'cerrado' });
        alTerminar();
        return;
      }
      if (sesionPerdida(r)) return;
      setEstado({ tipo: 'error', mensaje: mensajeDeFallo(r), incierto: esIncierto(r) });
    },
  };
}

function Pausar({ v, token, sesionPerdida, alTerminar, alRecargar }: PropsDeAccion) {
  const a = useAccionConfirmada(sesionPerdida, alTerminar, alRecargar);
  const [motivo, setMotivo] = useState<MotivoDePausa | ''>('');
  return (
    <>
      <button type="button" className="boton boton--secundario" onClick={a.abrir}>
        {COPY_VINCULO.pausarVinculo}
      </button>
      <DialogoDeConfirmacion
        abierto={a.estado.tipo !== 'cerrado'}
        titulo={COPY_VINCULO.pausarVinculo}
        textoVolver={COPY_VINCULO.volver}
        textoConfirmar={a.incierto ? COPY.reintentar : COPY_VINCULO.pausarVinculo}
        textoEnviando="Pausando…"
        enviando={a.estado.tipo === 'enviando'}
        error={a.estado.tipo === 'error' ? a.estado.mensaje : null}
        confirmarDeshabilitado={!motivo}
        onVolver={a.volver}
        onConfirmar={() => motivo && a.ejecutar((clave) => api.pausarVinculo(token, v.relationshipId, v.version, motivo, clave))}
      >
        <p>{COPY_VINCULO.explicacionDePausa}</p>
        <SelectorDeMotivo motivos={MOTIVOS_DE_PAUSA} etiquetas={ETIQUETA_DE_MOTIVO} valor={motivo} onCambio={setMotivo} />
      </DialogoDeConfirmacion>
    </>
  );
}

function Reanudar({ v, token, sesionPerdida, alTerminar, alRecargar }: PropsDeAccion) {
  const a = useAccionConfirmada(sesionPerdida, alTerminar, alRecargar);
  return (
    <>
      <button type="button" className="boton boton--primario" onClick={a.abrir}>
        {COPY_VINCULO.reanudarVinculo}
      </button>
      <DialogoDeConfirmacion
        abierto={a.estado.tipo !== 'cerrado'}
        titulo={COPY_VINCULO.reanudarVinculo}
        textoVolver={COPY_VINCULO.volver}
        textoConfirmar={a.incierto ? COPY.reintentar : COPY_VINCULO.reanudarVinculo}
        textoEnviando="Reanudando…"
        enviando={a.estado.tipo === 'enviando'}
        error={a.estado.tipo === 'error' ? a.estado.mensaje : null}
        onVolver={a.volver}
        onConfirmar={() => a.ejecutar((clave) => api.reanudarVinculo(token, v.relationshipId, v.version, clave))}
      >
        <p>{COPY_VINCULO.explicacionDeReanudacion}</p>
        <p>{COPY_VINCULO.reanudacionSimple}</p>
      </DialogoDeConfirmacion>
    </>
  );
}

function Finalizar({ v, token, sesionPerdida, alTerminar, alRecargar }: PropsDeAccion) {
  const a = useAccionConfirmada(sesionPerdida, alTerminar, alRecargar);
  const [motivo, setMotivo] = useState<Exclude<MotivoDeFinalizacion, 'CIERRE_DE_CUENTA'> | ''>('');
  const titulo = COPY_VINCULO.finalizarVinculoCon(v.professional.displayName);
  return (
    <>
      <button type="button" className="boton boton--peligro-secundario" onClick={a.abrir}>
        {COPY_VINCULO.finalizarVinculo}
      </button>
      <DialogoDeConfirmacion
        abierto={a.estado.tipo !== 'cerrado'}
        titulo={titulo}
        textoVolver={COPY_VINCULO.volver}
        textoConfirmar={a.incierto ? COPY.reintentar : COPY_VINCULO.finalizarVinculo}
        textoEnviando="Finalizando…"
        peligro
        enviando={a.estado.tipo === 'enviando'}
        error={a.estado.tipo === 'error' ? a.estado.mensaje : null}
        confirmarDeshabilitado={!motivo}
        onVolver={a.volver}
        onConfirmar={() => motivo && a.ejecutar((clave) => api.finalizarVinculo(token, v.relationshipId, v.version, motivo, clave))}
      >
        <p>{COPY_VINCULO.consecuenciaDeFinalizar}</p>
        <SelectorDeMotivo
          motivos={MOTIVOS_DE_FINALIZACION_DE_PARTICIPANTE as readonly Exclude<MotivoDeFinalizacion, 'CIERRE_DE_CUENTA'>[]}
          etiquetas={ETIQUETA_DE_MOTIVO}
          valor={motivo}
          onCambio={setMotivo}
        />
      </DialogoDeConfirmacion>
    </>
  );
}
