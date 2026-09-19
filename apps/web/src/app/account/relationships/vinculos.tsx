'use client';

/**
 * Website `/account/relationships` — Vínculos del asesorado (DL-025; 10-B04 §5-§9):
 * - «Solicitudes recibidas» (CAND-10-REL-01): cada ítem muestra solo contraparte, alcance, finalidad, estado y fecha.
 * - Detalle de solicitud (CAND-10-REL-02): «Aceptar vínculo» y «Rechazar solicitud» sin modal; botón explícito →
 *   acción → éxito → siguiente paso (CAND-10-REL-03/04). Aceptar no autoriza el acceso: el siguiente paso es revisar
 *   el consentimiento (TEST-AUTH-006).
 * - «Tus vínculos» (REL-05) y «Solicitudes anteriores».
 * Solo se listan los ítems en los que esta cuenta es el asesorado: lo profesional vive en /pro (criterio 11A n.º 1).
 */
import { COPY, COPY_VINCULO, ETIQUETA_DE_FINALIDAD, estadoParaMostrar, type SolicitudDeVinculo } from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { api } from '../../../lib/api';
import { dia, fecha } from '../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';
import { useSesionRequerida } from '../../../lib/sesion-requerida';
import type { Resultado } from '../../../lib/api';

type Decision = { tipo: 'aceptada'; vinculoId: string } | { tipo: 'rechazada' };
type Yo = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; id: string };

export function Vinculos() {
  const { token, sesionPerdida } = useSesionRequerida('/account/relationships');
  const [yo, setYo] = useState<Yo>({ tipo: 'cargando' });
  const [abierta, setAbierta] = useState<SolicitudDeVinculo | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);

  const cargarYo = useCallback(async () => {
    if (!token) return;
    setYo({ tipo: 'cargando' });
    const r = await api.consultarCuenta(token);
    if (sesionPerdida(r)) return;
    setYo(r.ok ? { tipo: 'listo', id: r.datos.data.identityId } : { tipo: 'error' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargarYo();
  }, [cargarYo]);

  const id = yo.tipo === 'listo' ? yo.id : null;
  const pendientes = useListaPaginada(
    useMemo(() => (token && id ? (cursor?: string) => api.consultarSolicitudes(token, { state: 'PENDIENTE', cursor }) : null), [token, id]),
    sesionPerdida,
  );
  const vinculos = useListaPaginada(
    useMemo(() => (token && id ? (cursor?: string) => api.consultarVinculos(token, { cursor }) : null), [token, id]),
    sesionPerdida,
  );
  const anteriores = useListaPaginada(
    useMemo(() => (token && id ? (cursor?: string) => api.consultarSolicitudes(token, { cursor }) : null), [token, id]),
    sesionPerdida,
  );

  const recargarTodo = useCallback(() => {
    void pendientes.recargar();
    void vinculos.recargar();
    void anteriores.recargar();
  }, [pendientes, vinculos, anteriores]);

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;

  if (abierta) {
    return (
      <DetalleDeSolicitud
        s={abierta}
        token={token}
        sesionPerdida={sesionPerdida}
        onVolver={() => {
          setAbierta(null);
          recargarTodo();
        }}
        alDecidir={(d) => {
          setDecision(d);
          setAbierta(null);
          recargarTodo();
        }}
      />
    );
  }

  const soyAsesorado = (p: { advisee: { identityId: string } }) => p.advisee.identityId === yo.id;

  return (
    <div className="secciones">
      {decision?.tipo === 'aceptada' ? (
        <Aviso tipo="exito" enfocar>
          <p className="aviso__titulo">{COPY_VINCULO.vinculoAceptado}</p>
          <p>{COPY_VINCULO.vinculoAceptadoDetalle}</p>
          <p>
            <Link className="boton boton--primario" href={`/account/relationships/consent?id=${encodeURIComponent(decision.vinculoId)}`}>
              {COPY_VINCULO.revisarConsentimiento}
            </Link>
          </p>
        </Aviso>
      ) : null}
      {decision?.tipo === 'rechazada' ? (
        <Aviso tipo="exito" enfocar>
          <p className="aviso__titulo">{COPY_VINCULO.solicitudRechazada}</p>
        </Aviso>
      ) : null}

      <section className="seccion" aria-labelledby="titulo-recibidas">
        <h2 id="titulo-recibidas">Solicitudes recibidas</h2>
        {pendientes.estado.tipo === 'cargando' ? <Cargando /> : null}
        {pendientes.estado.tipo === 'error' ? <ErrorConReintento onReintentar={pendientes.recargar} /> : null}
        {pendientes.estado.tipo === 'listo' ? (
          <ListaDeSolicitudes
            items={pendientes.estado.items.filter((s) => soyAsesorado(s) && s.initiatedBy === 'PROFESSIONAL')}
            vacia={COPY_VINCULO.sinSolicitudes}
            onRevisar={(s) => {
              setDecision(null);
              setAbierta(s);
            }}
          />
        ) : null}
        <VerMas estado={pendientes.estado} onVerMas={pendientes.verMas} />
      </section>

      <section className="seccion" aria-labelledby="titulo-vinculos">
        <h2 id="titulo-vinculos">Tus vínculos</h2>
        {vinculos.estado.tipo === 'cargando' ? <Cargando /> : null}
        {vinculos.estado.tipo === 'error' ? <ErrorConReintento onReintentar={vinculos.recargar} /> : null}
        {vinculos.estado.tipo === 'listo'
          ? (() => {
              const propios = vinculos.estado.items.filter(soyAsesorado);
              if (propios.length === 0) return <p>{COPY_VINCULO.sinVinculos}</p>;
              return (
                <ul className="lista">
                  {propios.map((v) => {
                    const e = estadoParaMostrar(v, 'ADVISEE');
                    return (
                      <li key={v.relationshipId} className="lista__item">
                        <p className="lista__titulo">{v.professional.displayName}</p>
                        <p>
                          {v.scope.label} · {ETIQUETA_DE_FINALIDAD[v.purpose]}
                        </p>
                        <p>
                          <span className="insignia">{e.estado}</span> {e.detalle}
                        </p>
                        <p className="nota">Desde el {dia(v.acceptedAt)}</p>
                        <Link className="boton boton--secundario" href={`/account/relationships/detail?id=${encodeURIComponent(v.relationshipId)}`}>
                          {COPY_VINCULO.verVinculo}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              );
            })()
          : null}
        <VerMas estado={vinculos.estado} onVerMas={vinculos.verMas} />
      </section>

      <section className="seccion" aria-labelledby="titulo-anteriores">
        <h2 id="titulo-anteriores">Solicitudes anteriores</h2>
        {anteriores.estado.tipo === 'cargando' ? <Cargando /> : null}
        {anteriores.estado.tipo === 'error' ? <ErrorConReintento onReintentar={anteriores.recargar} /> : null}
        {anteriores.estado.tipo === 'listo' ? (
          <ListaDeSolicitudes items={anteriores.estado.items.filter((s) => soyAsesorado(s) && s.state !== 'PENDIENTE')} vacia={COPY_VINCULO.sinSolicitudes} />
        ) : null}
        <VerMas estado={anteriores.estado} onVerMas={anteriores.verMas} />
      </section>
    </div>
  );
}

/** Ítem de solicitud (CAND-10-REL-01): contraparte, alcance, finalidad, estado y fecha; nada más. */
function ListaDeSolicitudes({ items, vacia, onRevisar }: { items: readonly SolicitudDeVinculo[]; vacia: string; onRevisar?: (s: SolicitudDeVinculo) => void }) {
  if (items.length === 0) return <p>{vacia}</p>;
  return (
    <ul className="lista">
      {items.map((s) => (
        <li key={s.relationshipRequestId} className="lista__item">
          <p className="lista__titulo">{s.professional.displayName}</p>
          <p>
            {s.scope.label} · {ETIQUETA_DE_FINALIDAD[s.purpose]}
          </p>
          <p className="nota">
            {COPY_VINCULO.estadoDeSolicitud[s.state]} · {fecha(s.createdAt)}
          </p>
          {onRevisar ? (
            <button type="button" className="boton boton--secundario" onClick={() => onRevisar(s)}>
              Revisar solicitud
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type EstadoDeDecision =
  | { tipo: 'libre' }
  | { tipo: 'enviando'; que: 'aceptar' | 'rechazar' }
  | { tipo: 'error'; que: 'aceptar' | 'rechazar'; mensaje: string; incierto: boolean };

/**
 * Detalle de solicitud (CAND-10-REL-02) para el asesorado. `expectedVersion` es la versión que esta pantalla mostró
 * (09:255-257). Un resultado incierto se reintenta con la misma Idempotency-Key; cambiar de decisión usa otra.
 */
function DetalleDeSolicitud({
  s,
  token,
  sesionPerdida,
  onVolver,
  alDecidir,
}: {
  s: SolicitudDeVinculo;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onVolver: () => void;
  alDecidir: (d: Decision) => void;
}) {
  const intento = useClaveDeIntento();
  const [estado, setEstado] = useState<EstadoDeDecision>({ tipo: 'libre' });

  async function decidir(que: 'aceptar' | 'rechazar') {
    if (estado.tipo === 'enviando') return;
    if (estado.tipo === 'error' && estado.que !== que) intento.descartar();
    setEstado({ tipo: 'enviando', que });
    const clave = intento.actual();
    if (que === 'aceptar') {
      const r = await api.aceptarSolicitud(token, s.relationshipRequestId, s.version, clave);
      intento.registrar(r);
      if (r.ok) return alDecidir({ tipo: 'aceptada', vinculoId: r.datos.data.relationshipId });
      if (sesionPerdida(r)) return;
      return setEstado({ tipo: 'error', que, mensaje: mensajeDeFallo(r), incierto: esIncierto(r) });
    }
    const r = await api.rechazarSolicitud(token, s.relationshipRequestId, s.version, clave);
    intento.registrar(r);
    if (r.ok) return alDecidir({ tipo: 'rechazada' });
    if (sesionPerdida(r)) return;
    setEstado({ tipo: 'error', que, mensaje: mensajeDeFallo(r), incierto: esIncierto(r) });
  }

  const nombre = s.professional.displayName;
  const enviando = estado.tipo === 'enviando';
  const texto = (que: 'aceptar' | 'rechazar', normal: string, enCurso: string) =>
    estado.tipo === 'enviando' && estado.que === que ? enCurso : estado.tipo === 'error' && estado.que === que && estado.incierto ? COPY.reintentar : normal;

  return (
    <section className="seccion" aria-labelledby="titulo-solicitud">
      <h2 id="titulo-solicitud">Solicitud de vínculo</h2>
      <dl className="datos">
        <div>
          <dt>Profesional</dt>
          <dd>{nombre}</dd>
        </div>
        <div>
          <dt>{COPY_VINCULO.alcance}</dt>
          <dd>{s.scope.label}</dd>
        </div>
        <div>
          <dt>{COPY_VINCULO.finalidad}</dt>
          <dd>{ETIQUETA_DE_FINALIDAD[s.purpose]}</dd>
        </div>
        <div>
          <dt>Recibida</dt>
          <dd>{fecha(s.createdAt)}</dd>
        </div>
        {s.expiresAt ? (
          <div>
            <dt>Vence</dt>
            <dd>{dia(s.expiresAt)}</dd>
          </div>
        ) : null}
      </dl>
      <p>{COPY_VINCULO.detalleDeSolicitud}</p>
      <p>{COPY_VINCULO.confirmarAceptacion(nombre, s.scope.label)}</p>
      {estado.tipo === 'error' ? (
        <Aviso tipo="error" enfocar>
          <p>{estado.mensaje}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => decidir('aceptar')} disabled={enviando} aria-busy={enviando}>
          {texto('aceptar', COPY_VINCULO.aceptarVinculo, 'Aceptando…')}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => decidir('rechazar')} disabled={enviando}>
          {texto('rechazar', COPY_VINCULO.rechazarSolicitud, 'Rechazando…')}
        </button>
      </div>
      <p>
        <button type="button" className="boton boton--enlace" onClick={onVolver} disabled={enviando}>
          {COPY_VINCULO.volver}
        </button>
      </p>
    </section>
  );
}
