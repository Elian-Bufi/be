'use client';

/**
 * Website `/account/privacy` — Privacidad del asesorado (DL-025):
 * - Tratamiento de datos de salud (A3; 10-B02 §7-§11; PROTO-10-ACC-03/04): estado, texto de la versión aplicable,
 *   «Autorizar tratamiento de mis datos de salud» / «Ahora no», revocación con «Confirmar revocación» e historial.
 *   Reotorgar es un acto nuevo («Autorizar nuevamente»): nunca se «reactiva» el revocado (10-B02 §11).
 *   Sin versión aplicable cargada no se puede otorgar (10-B02 §16).
 * - Consentimientos a profesionales (CAND-10-CON-03 y CON-04): uno por profesional, alcance y finalidad, con la
 *   revocación visible y no escondida (10-B04 §17).
 * A3 y B2 son actos distintos y no se mezclan (10-B02 §7.1; 10-B04 §13).
 */
import { COPY, COPY_VINCULO, ETIQUETA_DE_FINALIDAD, etiquetaDeConsentimiento, type RequisitoDeConsentimientoDeSaludResponse } from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { AvisoDeAccesoRevocado, RevocarConsentimiento } from '../../../components/revocacion';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';
import { useSesionRequerida } from '../../../lib/sesion-requerida';

type RequisitoA3 = RequisitoDeConsentimientoDeSaludResponse['data'];

export function Privacidad() {
  const { token, sesionPerdida } = useSesionRequerida('/account/privacy');
  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  return (
    <div className="secciones">
      <TratamientoDeDatosDeSalud token={token} sesionPerdida={sesionPerdida} />
      <ConsentimientosAProfesionales token={token} sesionPerdida={sesionPerdida} />
    </div>
  );
}

// ─── A3 ─────────────────────────────────────────────────────────────────────────────────────────

type EstadoA3 = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; datos: RequisitoA3 };
type AccionA3 =
  | { tipo: 'libre' }
  | { tipo: 'otorgando' }
  | { tipo: 'error-otorgar'; mensaje: string; incierto: boolean }
  | { tipo: 'otorgada' }
  | { tipo: 'confirmando-revocacion' }
  | { tipo: 'revocando' }
  | { tipo: 'error-revocar'; mensaje: string; incierto: boolean }
  | { tipo: 'revocada' }
  | { tipo: 'ahora-no' };

function TratamientoDeDatosDeSalud({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const intento = useClaveDeIntento();
  const [a3, setA3] = useState<EstadoA3>({ tipo: 'cargando' });
  const [accion, setAccion] = useState<AccionA3>({ tipo: 'libre' });
  const historial = useListaPaginada(
    useMemo(() => (cursor?: string) => api.consultarHistorialA3(token, { cursor }), [token]),
    sesionPerdida,
  );

  const cargar = useCallback(async () => {
    setA3({ tipo: 'cargando' });
    const r = await api.consultarRequisitoA3(token);
    if (sesionPerdida(r)) return;
    setA3(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const recargarTodo = () => {
    void cargar();
    void historial.recargar();
  };

  async function otorgar(versionMostrada: string) {
    if (accion.tipo === 'otorgando') return;
    setAccion({ tipo: 'otorgando' });
    const r = await api.otorgarA3(token, versionMostrada, intento.actual());
    intento.registrar(r);
    if (r.ok) {
      setAccion({ tipo: 'otorgada' });
      return recargarTodo();
    }
    if (sesionPerdida(r)) return;
    setAccion({ tipo: 'error-otorgar', mensaje: mensajeDeFallo(r), incierto: esIncierto(r) });
    // Otro acto vigente o una versión que ya no aplica: se muestra lo que realmente quedó.
    if (r.tipo === 'API' && (r.codigo === 'CONSENT_ALREADY_ACTIVE' || r.codigo === 'HEALTH_DATA_CONSENT_NOT_AVAILABLE')) void cargar();
  }

  /** CON-08 es idempotente por semántica: sin Idempotency-Key, reintentar repite el POST (09:2558-2621). */
  async function revocar(consentId: string) {
    if (accion.tipo === 'revocando') return;
    setAccion({ tipo: 'revocando' });
    const r = await api.revocarA3(token, consentId);
    if (r.ok) {
      setAccion({ tipo: 'revocada' });
      return recargarTodo();
    }
    if (sesionPerdida(r)) return;
    setAccion({ tipo: 'error-revocar', mensaje: mensajeDeFallo(r), incierto: esIncierto(r) });
  }

  return (
    <section className="seccion" aria-labelledby="titulo-a3">
      <h2 id="titulo-a3">Tratamiento de datos de salud</h2>
      {a3.tipo === 'cargando' ? <Cargando /> : null}
      {a3.tipo === 'error' ? <ErrorConReintento mensaje={COPY.errorA3} onReintentar={cargar} /> : null}
      {a3.tipo === 'listo'
        ? (() => {
            const actual = a3.datos.currentConsent;
            const vigente = actual?.state === 'ACTIVE' ? actual : null;
            const version = a3.datos.consentVersion;
            const [tituloDelTexto, ...parrafos] = version.text.split('\n\n');
            return (
              <>
                {accion.tipo === 'otorgada' ? (
                  <Aviso tipo="exito" enfocar>
                    <p className="aviso__titulo">{COPY_VINCULO.a3Otorgada}</p>
                  </Aviso>
                ) : null}
                {accion.tipo === 'revocada' ? (
                  <Aviso tipo="exito" enfocar>
                    <p className="aviso__titulo">{COPY_VINCULO.a3Revocada}</p>
                    <p>{COPY_VINCULO.a3RevocadaDetalle}</p>
                  </Aviso>
                ) : null}
                <p>
                  <span className={`insignia ${vigente ? 'insignia--si' : 'insignia--no'}`}>{vigente ? 'Otorgado' : actual?.state === 'REVOKED' ? 'Revocado' : 'No otorgado'}</span>
                </p>
                {vigente ? (
                  <dl className="datos datos--compactos">
                    <div>
                      <dt>Otorgado</dt>
                      <dd>{fecha(vigente.acceptedAt)}</dd>
                    </div>
                    <div>
                      <dt>Versión</dt>
                      <dd>
                        <code>{vigente.consentVersionId}</code>
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p>{COPY.cuentaSinA3}</p>
                )}
                <details>
                  <summary>Ver el texto del tratamiento de datos de salud (versión {version.id})</summary>
                  <div className="texto-legal">
                    <h3>{tituloDelTexto}</h3>
                    <p className="nota">
                      Vigente desde {version.effectiveFrom.slice(0, 10)} · huella <code className="huella">{version.textHash}</code>
                    </p>
                    {parrafos.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </details>

                {accion.tipo === 'error-otorgar' ? (
                  <Aviso tipo="error" enfocar>
                    <p>{accion.mensaje}</p>
                  </Aviso>
                ) : null}
                {accion.tipo === 'ahora-no' ? <p className="nota">{COPY.cuentaSinA3}</p> : null}
                <div className="acciones">
                  {!vigente ? (
                    <>
                      <button
                        type="button"
                        className="boton boton--primario"
                        onClick={() => otorgar(version.id)}
                        disabled={accion.tipo === 'otorgando'}
                        aria-busy={accion.tipo === 'otorgando'}
                      >
                        {accion.tipo === 'otorgando'
                          ? 'Autorizando…'
                          : accion.tipo === 'error-otorgar' && accion.incierto
                            ? COPY.reintentar
                            : actual?.state === 'REVOKED'
                              ? COPY_VINCULO.autorizarA3Nuevamente
                              : COPY_VINCULO.autorizarA3}
                      </button>
                      <button type="button" className="boton boton--secundario" onClick={() => setAccion({ tipo: 'ahora-no' })} disabled={accion.tipo === 'otorgando'}>
                        {COPY_VINCULO.ahoraNo}
                      </button>
                    </>
                  ) : (
                    <button type="button" className="boton boton--peligro-secundario" onClick={() => setAccion({ tipo: 'confirmando-revocacion' })}>
                      {COPY_VINCULO.revocarA3}
                    </button>
                  )}
                </div>

                {vigente ? (
                  <DialogoDeConfirmacion
                    abierto={accion.tipo === 'confirmando-revocacion' || accion.tipo === 'revocando' || accion.tipo === 'error-revocar'}
                    titulo={COPY_VINCULO.revocarA3}
                    textoVolver={COPY.cancelar}
                    textoConfirmar={accion.tipo === 'error-revocar' && accion.incierto ? COPY.reintentar : COPY_VINCULO.confirmarRevocacion}
                    textoEnviando="Revocando…"
                    peligro
                    enviando={accion.tipo === 'revocando'}
                    error={accion.tipo === 'error-revocar' ? accion.mensaje : null}
                    onVolver={() => {
                      const incierto = accion.tipo === 'error-revocar' && accion.incierto;
                      setAccion({ tipo: 'libre' });
                      if (incierto) recargarTodo();
                    }}
                    onConfirmar={() => revocar(vigente.consentId)}
                  >
                    <p>{COPY_VINCULO.explicacionDeRevocacionA3}</p>
                  </DialogoDeConfirmacion>
                ) : null}
              </>
            );
          })()
        : null}

      <h3>Historial</h3>
      {historial.estado.tipo === 'cargando' ? <Cargando /> : null}
      {historial.estado.tipo === 'error' ? <ErrorConReintento onReintentar={historial.recargar} /> : null}
      {historial.estado.tipo === 'listo' ? (
        historial.estado.items.length === 0 ? (
          <p>{COPY_VINCULO.historialA3Vacio}</p>
        ) : (
          <ul className="lista">
            {historial.estado.items.map((acto) => (
              <li key={acto.consentId} className="lista__item">
                <p>
                  <span className={`insignia ${acto.state === 'ACTIVE' ? 'insignia--si' : 'insignia--no'}`}>{acto.state === 'ACTIVE' ? 'Activo' : 'Revocado'}</span>
                </p>
                <dl className="datos datos--compactos">
                  <div>
                    <dt>Versión</dt>
                    <dd>
                      <code>{acto.consentVersionId}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Otorgado</dt>
                    <dd>{fecha(acto.acceptedAt)}</dd>
                  </div>
                  {acto.revokedAt ? (
                    <div>
                      <dt>Revocado</dt>
                      <dd>{fecha(acto.revokedAt)}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        )
      ) : null}
      <VerMas estado={historial.estado} onVerMas={historial.verMas} />
    </section>
  );
}

// ─── B2 ─────────────────────────────────────────────────────────────────────────────────────────

function ConsentimientosAProfesionales({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [revocado, setRevocado] = useState<string | null>(null);
  const lista = useListaPaginada(
    useMemo(() => (cursor?: string) => api.consultarConsentimientos(token, { cursor }), [token]),
    sesionPerdida,
  );

  return (
    <section className="seccion" aria-labelledby="titulo-b2">
      <h2 id="titulo-b2">Consentimientos a profesionales</h2>
      {revocado ? <AvisoDeAccesoRevocado vinculoId={revocado} /> : null}
      {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
      {lista.estado.tipo === 'error' ? <ErrorConReintento onReintentar={lista.recargar} /> : null}
      {lista.estado.tipo === 'listo' ? (
        lista.estado.items.length === 0 ? (
          <p>{COPY_VINCULO.sinConsentimientos}</p>
        ) : (
          <ul className="lista">
            {lista.estado.items.map((c) => (
              <li key={c.consentId} className="lista__item">
                <p className="lista__titulo">{c.professional.displayName}</p>
                <p>
                  {c.scope.label} · {ETIQUETA_DE_FINALIDAD[c.purpose]}
                </p>
                <p>
                  <span className={`insignia ${c.state === 'ACTIVE' && c.accessMode === 'CONTEXTUAL' ? 'insignia--si' : 'insignia--no'}`}>
                    {etiquetaDeConsentimiento(c.state, c.accessMode)}
                  </span>
                </p>
                <dl className="datos datos--compactos">
                  <div>
                    <dt>Autorizado</dt>
                    <dd>{fecha(c.acceptedAt)}</dd>
                  </div>
                  {c.revokedAt ? (
                    <div>
                      <dt>Revocado</dt>
                      <dd>{fecha(c.revokedAt)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Vínculo</dt>
                    <dd>{COPY_VINCULO.estadoDeVinculo[c.relationshipState]}</dd>
                  </div>
                </dl>
                <div className="acciones">
                  {c.state === 'ACTIVE' ? (
                    <RevocarConsentimiento
                      token={token}
                      consentId={c.consentId}
                      profesional={c.professional.displayName}
                      sesionPerdida={sesionPerdida}
                      alRevocar={() => {
                        setRevocado(c.relationshipId);
                        void lista.recargar();
                      }}
                    />
                  ) : null}
                  <Link className="boton boton--secundario" href={`/account/relationships/detail?id=${encodeURIComponent(c.relationshipId)}`}>
                    {COPY_VINCULO.verVinculo}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
      <VerMas estado={lista.estado} onVerMas={lista.verMas} />
    </section>
  );
}
