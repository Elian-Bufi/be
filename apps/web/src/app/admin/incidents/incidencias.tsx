'use client';

/**
 * RF-068 (DEUDA_LEGAJO DL-172; 05 UC-P28) · Las incidencias, para Administración (API-INC-03 a 05):
 * - **La lista** con los filtros de estado (las pendientes por omisión) y de categoría: las pendientes, de la más vieja a la
 *   más nueva; las resueltas, de la más nueva a la más vieja. De quien la avisó, su correo de acceso; nada de salud.
 * - **El detalle** de una, con su historia entera (cada cambio con su motivo, su respuesta y quién lo hizo).
 * - **Cambiar el estado** con el motivo (lo ve solo Administración) y la respuesta para quien la avisó, obligatoria al
 *   resolverla. Contra la versión que se vio: si alguien la cambió mientras tanto, la vuelve a traer y lo dice.
 */
import {
  CATEGORIAS_DE_INCIDENCIA,
  COPY,
  COPY_INCIDENCIAS,
  ESTADOS_DE_INCIDENCIA,
  LARGO_MAXIMO_DE_LA_RESPUESTA_DE_INCIDENCIA,
  LARGO_MAXIMO_DEL_MOTIVO_DE_INCIDENCIA,
  type CategoriaDeIncidencia,
  type DetalleDeIncidenciaResponse,
  type EstadoDeIncidencia,
  type ListaAdministrativaDeIncidenciasResponse,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Aviso } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { dia } from '../../../lib/formato';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';

const C = COPY_INCIDENCIAS;
const A = COPY_INCIDENCIAS.administracion;
type Incidencia = ListaAdministrativaDeIncidenciasResponse['data'][number];
type Detalle = DetalleDeIncidenciaResponse['data'];

/** Los filtros de estado que ofrece la pantalla: las pendientes (abiertas y en curso), cada estado o todas. */
const FILTROS_DE_ESTADO = ['PENDIENTES', ...ESTADOS_DE_INCIDENCIA, 'TODAS'] as const;
type FiltroDeEstado = (typeof FILTROS_DE_ESTADO)[number];
const ESTADOS_DEL_FILTRO = (f: FiltroDeEstado): EstadoDeIncidencia[] | undefined =>
  f === 'PENDIENTES' ? ['OPEN', 'IN_PROGRESS'] : f === 'TODAS' ? undefined : [f];
const NOMBRE_DEL_FILTRO = (f: FiltroDeEstado): string => (f === 'PENDIENTES' ? A.pendientes : f === 'TODAS' ? A.todas : A.estado[f]);

export function Incidencias() {
  const id = useId();
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [estado, setEstado] = useState<FiltroDeEstado>('PENDIENTES');
  const [categoria, setCategoria] = useState<CategoriaDeIncidencia | ''>('');
  const [lista, setLista] = useState<{ readonly filas: readonly Incidencia[]; readonly siguiente: string | null } | 'falla' | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  const leer = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      if (!cursor) setLista(null);
      const estados = ESTADOS_DEL_FILTRO(estado);
      const r = await apiAdministrativa.incidencias(token, { ...(estados ? { states: estados } : {}), ...(categoria ? { category: categoria } : {}), limit: 20, ...(cursor ? { cursor } : {}) });
      if (r.ok) {
        return setLista((antes) => ({
          filas: [...(cursor && antes && antes !== 'falla' ? antes.filas : []), ...r.datos.data],
          siguiente: r.datos.page.nextCursor,
        }));
      }
      if (!revisar(r)) setLista('falla');
    },
    [token, revisar, estado, categoria],
  );
  useEffect(() => {
    void leer();
  }, [leer]);

  return (
    <>
      <form className="formulario filtros" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor={`${id}-estado`}>{A.filtroEstado}</label>
          <select id={`${id}-estado`} value={estado} onChange={(ev) => setEstado(ev.target.value as FiltroDeEstado)}>
            {FILTROS_DE_ESTADO.map((f) => (
              <option key={f} value={f}>
                {NOMBRE_DEL_FILTRO(f)}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-categoria`}>{A.filtroCategoria}</label>
          <select id={`${id}-categoria`} value={categoria} onChange={(ev) => setCategoria(ev.target.value as CategoriaDeIncidencia | '')}>
            <option value="">{A.todasLasCategorias}</option>
            {CATEGORIAS_DE_INCIDENCIA.map((c) => (
              <option key={c} value={c}>
                {C.categorias[c]}
              </option>
            ))}
          </select>
        </div>
      </form>
      {lista === 'falla' ? <p role="alert">{COPY.noDisponible}</p> : null}
      {lista === null ? <p aria-busy="true">Cargando…</p> : null}
      {lista && lista !== 'falla' && lista.filas.length === 0 ? <p>{A.vacio}</p> : null}
      {lista && lista !== 'falla' && lista.filas.length > 0 ? (
        <ul className="lista-simple incidencias">
          {lista.filas.map((i) => (
            <li key={i.incidentId}>
              <p>
                <strong>{C.categorias[i.category]}</strong> · {A.estado[i.state]} · {A.reporto} el {dia(i.createdAt)}
              </p>
              <p className="nota">
                {i.reporter.email ?? i.reporter.identityId} · {A.aCargo}: {i.assignee?.name ?? A.sinAsignar}
              </p>
              <p>«{i.description}»</p>
              <div className="acciones">
                <button type="button" className="boton boton--secundario" aria-expanded={abierta === i.incidentId} onClick={() => setAbierta(abierta === i.incidentId ? null : i.incidentId)}>
                  {abierta === i.incidentId ? A.cerrarDetalle : A.verDetalle}
                </button>
              </div>
              {abierta === i.incidentId && token ? <DetalleDeIncidencia token={token} incidenciaId={i.incidentId} alCambiar={() => void leer()} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {lista && lista !== 'falla' && lista.siguiente ? (
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => void leer(lista.siguiente ?? undefined)}>
            {A.cargarMas}
          </button>
        </div>
      ) : null}
    </>
  );
}

function DetalleDeIncidencia({ token, incidenciaId, alCambiar }: { token: string; incidenciaId: string; alCambiar: () => void }) {
  const { revisar } = useAdministracion();
  const [detalle, setDetalle] = useState<Detalle | 'falla' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const leer = useCallback(async () => {
    const r = await apiAdministrativa.incidencia(token, incidenciaId);
    if (r.ok) return setDetalle(r.datos.data);
    if (!revisar(r)) setDetalle('falla');
  }, [token, incidenciaId, revisar]);
  useEffect(() => {
    void leer();
  }, [leer]);

  if (detalle === 'falla') return <p role="alert">{COPY.noDisponible}</p>;
  if (!detalle) return <p aria-busy="true">Cargando…</p>;
  return (
    <div className="detalle-de-incidencia">
      {aviso ? (
        <Aviso tipo="info" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      <h3>{A.historia}</h3>
      {detalle.history.length === 0 ? <p>{A.sinHistoria}</p> : null}
      {detalle.history.length > 0 ? (
        <ol className="lista-simple">
          {detalle.history.map((c) => (
            <li key={c.number}>
              <p>
                <strong>
                  {A.estado[c.from]} → {A.estado[c.to]}
                </strong>{' '}
                · {c.administrator.name} · {dia(c.at)}
              </p>
              <p>{c.reason}</p>
              {c.response ? (
                <p className="nota">
                  {C.propias.respuesta}: {c.response}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      <CambiarEstado
        token={token}
        detalle={detalle}
        alCambiar={(nuevo, mensaje) => {
          setDetalle(nuevo);
          setAviso(mensaje);
          alCambiar();
        }}
        alDesactualizarse={() => {
          setAviso(A.cambio);
          void leer();
        }}
      />
    </div>
  );
}

function CambiarEstado({ token, detalle, alCambiar, alDesactualizarse }: { token: string; detalle: Detalle; alCambiar: (d: Detalle, mensaje: string | null) => void; alDesactualizarse: () => void }) {
  const id = useId();
  const { revisar } = useAdministracion();
  const siguiente: EstadoDeIncidencia = detalle.state === 'OPEN' ? 'IN_PROGRESS' : detalle.state === 'IN_PROGRESS' ? 'RESOLVED' : 'IN_PROGRESS';
  const [estado, setEstado] = useState<EstadoDeIncidencia>(siguiente);
  const [motivo, setMotivo] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const clave = useRef<string | null>(null);
  useEffect(() => {
    setEstado(siguiente);
    clave.current = null;
  }, [detalle.version, siguiente]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!motivo.trim()) return setFalla(A.motivoRequerido);
    if (estado === 'RESOLVED' && !respuesta.trim()) return setFalla(A.respuestaRequerida);
    if (estado === detalle.state) return setFalla(A.mismoEstado);
    setFalla(null);
    setEnviando(true);
    clave.current ??= nuevaClaveAdministrativa();
    const r = await apiAdministrativa.cambiarEstadoDeIncidencia(
      token,
      detalle.incidentId,
      { state: estado, reason: motivo, ...(respuesta.trim() ? { response: respuesta } : {}), expectedVersion: detalle.version },
      clave.current,
    );
    setEnviando(false);
    if (r.ok) {
      clave.current = null;
      setMotivo('');
      setRespuesta('');
      return alCambiar(r.datos.data, null);
    }
    if (r.tipo === 'RED') return setFalla(COPY.resultadoIncierto);
    clave.current = null;
    if (revisar(r)) return;
    if (r.codigo === 'VERSION_CONFLICT') return alDesactualizarse();
    if (r.codigo === 'INVALID_STATE_TRANSITION') return setFalla(A.mismoEstado);
    if (r.codigo === 'VALIDATION_FAILED') return setFalla(r.issues.some((i) => i.path === 'response') ? A.respuestaRequerida : A.motivoRequerido);
    setFalla(COPY.noDisponible);
  }

  return (
    <form className="formulario" onSubmit={guardar} noValidate>
      <h3>{A.cambiar}</h3>
      {falla ? (
        <Aviso tipo="error" enfocar>
          <p>{falla}</p>
        </Aviso>
      ) : null}
      <fieldset className="campo">
        <legend>{A.estadoNuevo}</legend>
        {ESTADOS_DE_INCIDENCIA.filter((s) => s !== detalle.state).map((s) => (
          <label key={s} className="opcion">
            <input
              type="radio"
              name={`${id}-estado`}
              checked={estado === s}
              onChange={() => {
                clave.current = null;
                setEstado(s);
              }}
            />{' '}
            {A.estado[s]}
          </label>
        ))}
      </fieldset>
      <div className="campo">
        <label htmlFor={`${id}-motivo`}>{A.motivo}</label>
        <textarea
          id={`${id}-motivo`}
          rows={2}
          maxLength={LARGO_MAXIMO_DEL_MOTIVO_DE_INCIDENCIA}
          value={motivo}
          onChange={(ev) => {
            clave.current = null;
            setMotivo(ev.target.value);
          }}
        />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-respuesta`}>{A.respuesta}</label>
        <p id={`${id}-respuesta-ayuda`} className="campo__ayuda">
          {A.respuestaAyuda}
        </p>
        <textarea
          id={`${id}-respuesta`}
          rows={3}
          maxLength={LARGO_MAXIMO_DE_LA_RESPUESTA_DE_INCIDENCIA}
          aria-describedby={`${id}-respuesta-ayuda`}
          value={respuesta}
          onChange={(ev) => {
            clave.current = null;
            setRespuesta(ev.target.value);
          }}
        />
      </div>
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? A.guardando : A.guardar}
        </button>
      </div>
    </form>
  );
}
