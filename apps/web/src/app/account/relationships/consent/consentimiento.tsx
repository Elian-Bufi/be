'use client';

/**
 * Website `/account/relationships/consent?id=…` — consentimiento B2 del asesorado (CAND-10-CON-01, CON-A, CON-02;
 * 10-B04 §10-§14):
 * - Pantalla previa con la jerarquía del 10: resumen humano (quién, para qué, en qué ámbito), categorías, aclaración
 *   obligatoria y «Ver detalle completo» con la versión exacta que se acepta (id, vigencia y huella).
 * - «Autorizar acceso» es un acto explícito: sin casilla premarcada ni «Continuar = aceptar» (CAND-10-CON-A).
 * - La versión enviada es la que esta pantalla mostró; lo demás lo pone el servidor (09v8:1595-1605). Si cambió
 *   mientras se leía, se pide revisarla de nuevo.
 * Aceptar el vínculo no creó este consentimiento (TEST-AUTH-006): se otorga acá, por separado.
 */
import { COPY, COPY_VINCULO, ETIQUETA_DE_FINALIDAD, type DetalleDeVinculoResponse, type RequisitosDeConsentimientoResponse } from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useSesionRequerida } from '../../../../lib/sesion-requerida';

type Requisitos = RequisitosDeConsentimientoResponse['data'];
type Vinculo = DetalleDeVinculoResponse['data'];
type Carga = { tipo: 'cargando' } | { tipo: 'no-revelable' } | { tipo: 'error' } | { tipo: 'listo'; req: Requisitos; v: Vinculo };
type Envio =
  | { tipo: 'libre' }
  | { tipo: 'enviando' }
  | { tipo: 'error'; mensaje: string; incierto: boolean; versionVieja: boolean }
  | { tipo: 'autorizado'; acceptedAt: string };

export function Consentimiento() {
  const id = useSearchParams().get('id') ?? '';
  const { token, sesionPerdida } = useSesionRequerida(`/account/relationships/consent?id=${id}`);
  const intento = useClaveDeIntento();
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [envio, setEnvio] = useState<Envio>({ tipo: 'libre' });

  const cargar = useCallback(async () => {
    if (!token) return;
    if (!id) return setCarga({ tipo: 'no-revelable' });
    setCarga({ tipo: 'cargando' });
    const [req, v] = await Promise.all([api.consultarRequisitosDeConsentimiento(token, id), api.consultarVinculo(token, id)]);
    if (sesionPerdida(req) || sesionPerdida(v)) return;
    const noRevelable = (r: typeof req | typeof v) => !r.ok && r.tipo === 'API' && (r.codigo === 'RESOURCE_NOT_FOUND' || r.codigo === 'RELATIONSHIP_NOT_READY_FOR_CONSENT');
    if (noRevelable(req) || noRevelable(v)) return setCarga({ tipo: 'no-revelable' });
    if (!req.ok || !v.ok) return setCarga({ tipo: 'error' });
    setCarga({ tipo: 'listo', req: req.datos.data, v: v.datos.data });
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (carga.tipo === 'cargando') return <Cargando />;
  if (carga.tipo === 'error') return <ErrorConReintento onReintentar={cargar} />;
  if (carga.tipo === 'no-revelable') {
    return (
      <Aviso tipo="info">
        <p>{COPY_VINCULO.noPudimosAbrir}</p>
        <p>
          <Link href="/account/relationships">{COPY_VINCULO.volver}</Link>
        </p>
      </Aviso>
    );
  }

  const { req, v } = carga;
  const enlaceAlVinculo = `/account/relationships/detail?id=${encodeURIComponent(v.relationshipId)}`;
  const profesional = req.professional.displayName;
  const finalidad = ETIQUETA_DE_FINALIDAD[req.purpose];

  // 10-B04 §14: éxito con profesional, alcance, finalidad, fecha y estado; nunca «puede ver todos tus datos».
  if (envio.tipo === 'autorizado') {
    return (
      <Aviso tipo="exito" enfocar>
        <p className="aviso__titulo">{COPY_VINCULO.accesoAutorizado}</p>
        <dl className="datos">
          <div>
            <dt>Profesional</dt>
            <dd>{profesional}</dd>
          </div>
          <div>
            <dt>{COPY_VINCULO.alcance}</dt>
            <dd>{req.scope.label}</dd>
          </div>
          <div>
            <dt>{COPY_VINCULO.finalidad}</dt>
            <dd>{finalidad}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{fecha(envio.acceptedAt)}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{COPY_VINCULO.estadoDeConsentimiento.ACTIVE}</dd>
          </div>
        </dl>
        <p>
          <Link className="boton boton--primario" href={enlaceAlVinculo}>
            {COPY_VINCULO.verVinculo}
          </Link>
        </p>
      </Aviso>
    );
  }

  const vigenteConEstaVersion = v.consent?.state === 'ACTIVE' && v.consent.consentVersionId === req.consentVersion.id;
  const vigenteConOtraVersion = v.consent?.state === 'ACTIVE' && v.consent.consentVersionId !== req.consentVersion.id;

  async function autorizar() {
    if (!token || carga.tipo !== 'listo' || envio.tipo === 'enviando') return;
    setEnvio({ tipo: 'enviando' });
    const r = await api.otorgarConsentimiento(token, carga.v.relationshipId, carga.req.consentVersion.id, intento.actual());
    intento.registrar(r);
    if (r.ok) return setEnvio({ tipo: 'autorizado', acceptedAt: r.datos.data.acceptedAt });
    if (sesionPerdida(r)) return;
    const versionVieja = r.tipo === 'API' && (r.codigo === 'CONSENT_VERSION_STALE' || r.codigo === 'VERSION_CONFLICT');
    setEnvio({ tipo: 'error', mensaje: mensajeDeFallo(r), incierto: esIncierto(r), versionVieja });
  }

  const [titulo, ...parrafos] = req.consentVersion.text.split('\n\n');
  const enviando = envio.tipo === 'enviando';

  return (
    <div className="secciones">
      <section className="seccion" aria-labelledby="titulo-resumen">
        <h2 id="titulo-resumen">
          {profesional} {COPY_VINCULO.quiereAcceder}
        </h2>
        <p className="destacado">{finalidad}</p>
        <p>{COPY_VINCULO.dentroDe}</p>
        <p className="destacado">{req.scope.label}</p>
        <p>{req.professionalProfileDisclosure.notice}</p>
      </section>

      <section className="seccion" aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias">Qué información</h2>
        {req.pertinentCategories.length === 0 ? (
          <p>{COPY_VINCULO.sinCategoriasTodavia}</p>
        ) : (
          <ul>
            {req.pertinentCategories.map((c) => (
              <li key={c.code}>{c.label}</li>
            ))}
          </ul>
        )}
      </section>

      <Aviso tipo="info">
        <p className="aviso__titulo">{COPY_VINCULO.aclaracionDeConsentimiento}</p>
      </Aviso>

      <details className="seccion">
        <summary>{COPY_VINCULO.verDetalleCompleto}</summary>
        <article className="texto-legal" aria-label={titulo}>
          <h3>{titulo}</h3>
          <dl className="datos datos--compactos">
            <div>
              <dt>Versión</dt>
              <dd>
                <code>{req.consentVersion.id}</code>
              </dd>
            </div>
            <div>
              <dt>Vigente desde</dt>
              <dd>{req.consentVersion.effectiveFrom.slice(0, 10)}</dd>
            </div>
            <div>
              <dt>Huella SHA-256</dt>
              <dd>
                <code className="huella">{req.consentVersion.textHash}</code>
              </dd>
            </div>
          </dl>
          {parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>
      </details>

      {vigenteConEstaVersion ? (
        <Aviso tipo="info">
          <p>{COPY_VINCULO.yaAutorizado}</p>
          <p>
            <Link href={enlaceAlVinculo}>{COPY_VINCULO.verVinculo}</Link>
          </p>
        </Aviso>
      ) : (
        <section className="seccion" aria-labelledby="titulo-decision">
          <h2 id="titulo-decision">Tu decisión</h2>
          {vigenteConOtraVersion ? <p>{COPY_VINCULO.versionNuevaDeConsentimiento}</p> : null}
          <p className="nota">
            Vas a aceptar la versión <code>{req.consentVersion.id}</code>.
          </p>
          {envio.tipo === 'error' ? (
            <Aviso tipo="error" enfocar>
              <p>{envio.mensaje}</p>
              {envio.versionVieja ? (
                <p>
                  <button
                    type="button"
                    className="boton boton--enlace"
                    onClick={() => {
                      setEnvio({ tipo: 'libre' });
                      void cargar();
                    }}
                  >
                    Actualizar la vista
                  </button>
                </p>
              ) : null}
            </Aviso>
          ) : null}
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={autorizar} disabled={enviando} aria-busy={enviando}>
              {enviando ? 'Autorizando…' : envio.tipo === 'error' && envio.incierto ? COPY.reintentar : COPY_VINCULO.autorizarAcceso}
            </button>
            <Link className="boton boton--secundario" href={enlaceAlVinculo}>
              {COPY_VINCULO.volver}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
