'use client';

/**
 * Website `/pro` — espacio profesional mínimo, sin Cartera (DL-041 A):
 * - «Solicitar vínculo» (REL-01): el asesorado se identifica por su identificador BE (DL-035) y la finalidad es la del
 *   alcance (DL-039). Cualquier rechazo semántico se muestra con el mismo mensaje neutral: la pantalla no revela si el
 *   identificador existe ni por qué no es elegible (09v7:151-157).
 * - «Tus asesorados» (REL-05) con el estado mínimo de 10-B04 §28-§29, y «Solicitudes enviadas» (REL-02).
 * Solo cuentas con la capacidad PROFESSIONAL_WORKSPACE que informa la API entran a este espacio (criterio 11A n.º 1);
 * la capacidad no autoriza nada: cada operación la decide la API.
 */
import {
  ALCANCES,
  COPY,
  COPY_VINCULO,
  ETIQUETA_DE_ALCANCE,
  ETIQUETA_DE_FINALIDAD,
  FINALIDAD_DE_ALCANCE,
  estadoParaMostrar,
  type Alcance,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Cargando, ErrorConReintento, VerMas } from '../../components/estados';
import { Aviso, Campo } from '../../components/formulario';
import { api, type Resultado } from '../../lib/api';
import { dia, fecha } from '../../lib/formato';
import { esIncierto, useClaveDeIntento } from '../../lib/intento';
import { useListaPaginada } from '../../lib/lista';
import { useSesionRequerida } from '../../lib/sesion-requerida';

type Yo = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'sin-espacio' } | { tipo: 'listo'; id: string };

/** Carga la cuenta y confirma que la API le informa el espacio profesional. Compartido con el workspace. */
export function useEspacioProfesional(volver: string) {
  const sesion = useSesionRequerida(volver);
  const { token, sesionPerdida } = sesion;
  const [yo, setYo] = useState<Yo>({ tipo: 'cargando' });
  const cargarYo = useCallback(async () => {
    if (!token) return;
    setYo({ tipo: 'cargando' });
    const r = await api.consultarCuenta(token);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setYo({ tipo: 'error' });
    setYo(r.datos.data.actorCapabilities.includes('PROFESSIONAL_WORKSPACE') ? { tipo: 'listo', id: r.datos.data.identityId } : { tipo: 'sin-espacio' });
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargarYo();
  }, [cargarYo]);
  return { ...sesion, yo, cargarYo };
}

export function SinEspacioProfesional() {
  return (
    <Aviso tipo="info">
      <p>{COPY_VINCULO.recursoNoDisponible}</p>
      <p>
        <Link href="/account">Ir a tu cuenta</Link>
      </p>
    </Aviso>
  );
}

export function EspacioProfesional() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro');
  const id = yo.tipo === 'listo' ? yo.id : null;
  const vinculos = useListaPaginada(
    useMemo(() => (token && id ? (cursor?: string) => api.consultarVinculos(token, { cursor }) : null), [token, id]),
    sesionPerdida,
  );
  const enviadas = useListaPaginada(
    useMemo(() => (token && id ? (cursor?: string) => api.consultarSolicitudes(token, { cursor }) : null), [token, id]),
    sesionPerdida,
  );

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  const esMio = (p: { professional: { identityId: string } }) => p.professional.identityId === yo.id;

  return (
    <div className="espacio">
      <div className="espacio__principal secciones">
        <section className="seccion" aria-labelledby="titulo-asesorados">
          <h2 id="titulo-asesorados">Tus asesorados</h2>
          {vinculos.estado.tipo === 'cargando' ? <Cargando /> : null}
          {vinculos.estado.tipo === 'error' ? <ErrorConReintento onReintentar={vinculos.recargar} /> : null}
          {vinculos.estado.tipo === 'listo'
            ? (() => {
                const propios = vinculos.estado.items.filter(esMio);
                if (propios.length === 0) return <p>{COPY_VINCULO.sinAsesorados}</p>;
                // Una persona, una tarjeta: el vínculo es por alcance (DL-039), pero el workspace es uno por asesorado.
                const porAsesorado = new Map<string, typeof propios>();
                for (const v of propios) porAsesorado.set(v.advisee.identityId, [...(porAsesorado.get(v.advisee.identityId) ?? []), v]);
                return (
                  <ul className="lista">
                    {[...porAsesorado.entries()].map(([asesoradoId, deLaPersona]) => {
                      const nombre = deLaPersona[0]!.advisee.displayName;
                      return (
                        <li key={asesoradoId} className="lista__item asesorado">
                          <div className="asesorado__cabecera">
                            <p className="lista__titulo">{nombre}</p>
                            <Link className="boton boton--secundario" href={`/pro/advisees?id=${encodeURIComponent(asesoradoId)}`} aria-label={`Abrir el workspace de ${nombre}`}>
                              Abrir
                            </Link>
                          </div>
                          <ul className="alcances">
                            {deLaPersona.map((v) => {
                              const e = estadoParaMostrar(v, 'PROFESSIONAL');
                              return (
                                <li key={v.relationshipId}>
                                  <span className="alcances__nombre">
                                    {v.scope.label} · {ETIQUETA_DE_FINALIDAD[v.purpose]}
                                  </span>
                                  <span>
                                    <span className="insignia">{e.estado}</span> {e.detalle}
                                  </span>
                                  <span className="nota">Desde el {dia(v.acceptedAt)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()
            : null}
          <VerMas estado={vinculos.estado} onVerMas={vinculos.verMas} />
          <p>
            <button type="button" className="boton boton--enlace" onClick={() => void vinculos.recargar()}>
              Actualizar
            </button>
          </p>
        </section>

        <section className="seccion" aria-labelledby="titulo-enviadas">
          <h2 id="titulo-enviadas">Solicitudes enviadas</h2>
          {enviadas.estado.tipo === 'cargando' ? <Cargando /> : null}
          {enviadas.estado.tipo === 'error' ? <ErrorConReintento onReintentar={enviadas.recargar} /> : null}
          {enviadas.estado.tipo === 'listo'
            ? (() => {
                const propias = enviadas.estado.items.filter((s) => esMio(s) && s.initiatedBy === 'PROFESSIONAL');
                if (propias.length === 0) return <p>{COPY_VINCULO.sinSolicitudes}</p>;
                return (
                  <table className="tabla">
                    <caption className="visualmente-oculto">Solicitudes de vínculo que enviaste</caption>
                    <thead>
                      <tr>
                        <th scope="col">Asesorado</th>
                        <th scope="col">Alcance</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Enviada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propias.map((s) => (
                        <tr key={s.relationshipRequestId}>
                          <td data-etiqueta="Asesorado">{s.advisee.displayName}</td>
                          <td data-etiqueta="Alcance">
                            {s.scope.label} · {ETIQUETA_DE_FINALIDAD[s.purpose]}
                          </td>
                          <td data-etiqueta="Estado">{COPY_VINCULO.estadoDeSolicitud[s.state]}</td>
                          <td data-etiqueta="Enviada">{fecha(s.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()
            : null}
          <VerMas estado={enviadas.estado} onVerMas={enviadas.verMas} />
        </section>
      </div>

      <div className="espacio__lateral">
        <SolicitarVinculo token={token} sesionPerdida={sesionPerdida} alEnviar={() => void enviadas.recargar()} />
      </div>
    </div>
  );
}

type Envio = { tipo: 'editando' } | { tipo: 'enviando' } | { tipo: 'enviada'; texto: string } | { tipo: 'error'; texto: string; incierto: boolean };

function SolicitarVinculo({ token, sesionPerdida, alEnviar }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean; alEnviar: () => void }) {
  const intento = useClaveDeIntento();
  const [asesorado, setAsesorado] = useState('');
  const [alcance, setAlcance] = useState<Alcance | ''>('');
  const [errores, setErrores] = useState<{ asesorado?: string; alcance?: string }>({});
  const [envio, setEnvio] = useState<Envio>({ tipo: 'editando' });

  // Cambiar los datos es otro intento lógico: la key de un intento incierto no se reusa con datos distintos.
  function editar(cambio: () => void) {
    cambio();
    intento.descartar();
    if (envio.tipo !== 'enviando') setEnvio({ tipo: 'editando' });
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (envio.tipo === 'enviando') return;
    const encontrados: typeof errores = {};
    if (!asesorado.trim()) encontrados.asesorado = 'Ingresá el identificador BE del asesorado.';
    if (!alcance) encontrados.alcance = 'Elegí un alcance.';
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0 || !alcance) return;

    setEnvio({ tipo: 'enviando' });
    const r = await api.solicitarVinculo(token, { asesoradoId: asesorado.trim(), alcance }, intento.actual());
    intento.registrar(r);
    if (r.ok) {
      const deduplicada = 'deduplicated' in r.datos.data;
      setEnvio({ tipo: 'enviada', texto: deduplicada ? COPY_VINCULO.solicitudYaPendiente : COPY_VINCULO.solicitudEnviada });
      if (!deduplicada) setAsesorado('');
      alEnviar();
      return;
    }
    if (sesionPerdida(r)) return;
    if (esIncierto(r)) return setEnvio({ tipo: 'error', texto: COPY.resultadoIncierto, incierto: true });
    if (r.tipo === 'API' && r.codigo === 'RESOURCE_CONFLICT') {
      return setEnvio({ tipo: 'error', texto: 'Ya tenés un vínculo vigente con esta persona para ese alcance.', incierto: false });
    }
    // 404, 422 y validación: el mismo mensaje, sin revelar existencia ni elegibilidad (09v7:151-157; RF-015).
    const neutral = r.tipo === 'API' && r.status >= 400 && r.status < 500;
    setEnvio({ tipo: 'error', texto: neutral ? COPY_VINCULO.solicitudNoDisponible : COPY.noDisponible, incierto: false });
  }

  const finalidad = alcance ? ETIQUETA_DE_FINALIDAD[FINALIDAD_DE_ALCANCE[alcance]] : '—';
  const enviando = envio.tipo === 'enviando';

  return (
    <section className="seccion" aria-labelledby="titulo-solicitar">
      <h2 id="titulo-solicitar">{COPY_VINCULO.solicitarVinculo}</h2>
      <form className="formulario" onSubmit={enviar} noValidate>
        {envio.tipo === 'enviada' ? (
          <Aviso tipo="exito" enfocar>
            <p>{envio.texto}</p>
          </Aviso>
        ) : null}
        {envio.tipo === 'error' ? (
          <Aviso tipo="error" enfocar>
            <p>{envio.texto}</p>
          </Aviso>
        ) : null}
        <Campo
          id="asesorado"
          etiqueta={COPY_VINCULO.identificadorDelAsesorado}
          ayuda={COPY_VINCULO.ayudaIdentificador}
          error={errores.asesorado}
          value={asesorado}
          onChange={(e) => editar(() => setAsesorado(e.target.value))}
          autoComplete="off"
          spellCheck={false}
        />
        <div className={`campo${errores.alcance ? ' campo--error' : ''}`}>
          <label htmlFor="alcance">{COPY_VINCULO.alcance}</label>
          <select
            id="alcance"
            value={alcance}
            aria-invalid={errores.alcance ? true : undefined}
            aria-describedby={errores.alcance ? 'alcance-error' : undefined}
            onChange={(e) => editar(() => setAlcance(e.target.value as Alcance | ''))}
          >
            <option value="">Elegí un alcance</option>
            {ALCANCES.map((a) => (
              <option key={a} value={a}>
                {ETIQUETA_DE_ALCANCE[a]}
              </option>
            ))}
          </select>
          {errores.alcance ? (
            <p id="alcance-error" className="campo__error">
              <span aria-hidden="true">⚠ </span>
              {errores.alcance}
            </p>
          ) : null}
        </div>
        <p>
          <strong>{COPY_VINCULO.finalidad}:</strong> {finalidad}
        </p>
        <p className="nota">La finalidad es la del alcance. El asesorado decide si acepta el vínculo y, por separado, si autoriza el acceso.</p>
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
            {enviando ? COPY_VINCULO.enviando : envio.tipo === 'error' && envio.incierto ? COPY.reintentar : COPY_VINCULO.solicitarVinculo}
          </button>
        </div>
      </form>
    </section>
  );
}
