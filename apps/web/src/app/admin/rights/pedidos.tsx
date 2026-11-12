'use client';

/**
 * UF-06 de WP-USO-FINAL (DL-169; 08 §19) · los pedidos de derechos de las personas, para Administración (API-ADM-16 y 17):
 * los pendientes primero, por plazo, con la cuenta (su correo, para responder por el canal) y nada de salud. Cada uno se
 * resuelve una sola vez: hecho o no se pudo, con la respuesta que ve la persona y el fundamento, que ve solo Administración.
 */
import { COPY, COPY_DERECHOS, type ListaAdministrativaDePedidosDeDerechoResponse } from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Aviso } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { dia } from '../../../lib/formato';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';

const D = COPY_DERECHOS;
type Pedido = ListaAdministrativaDePedidosDeDerechoResponse['data'][number];

export function PedidosDeDerechos() {
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [pedidos, setPedidos] = useState<readonly Pedido[] | null>(null);
  const [falla, setFalla] = useState(false);

  const leer = useCallback(async () => {
    if (!token) return;
    const r = await apiAdministrativa.pedidosDeDerechos(token, { limit: 50 });
    if (r.ok) return setPedidos(r.datos.data);
    if (!revisar(r)) setFalla(true);
  }, [token, revisar]);
  useEffect(() => {
    void leer();
  }, [leer]);

  if (falla) return <p role="alert">{COPY.noDisponible}</p>;
  if (!pedidos) return <p aria-busy="true">Cargando…</p>;
  if (pedidos.length === 0) return <p>Todavía no hay pedidos.</p>;
  return (
    <ul className="lista-simple pedidos-de-derechos">
      {pedidos.map((p) => (
        <li key={p.requestId}>
          <p>
            <strong>{D.pedir.tipos[p.type]}</strong> · {D.pedidos.estado[p.state]} · {D.pedidos.plazo(dia(`${p.deadline}T12:00:00.000Z`))}
          </p>
          <p className="nota">
            {p.subject.email ?? p.subject.identityId} · pedido el {dia(p.createdAt)}
          </p>
          {p.note ? <p>«{p.note}»</p> : null}
          {p.state === 'RECEIVED' && token ? <Resolver token={token} pedido={p} alResolver={() => void leer()} /> : null}
          {p.response ? (
            <p>
              {D.pedidos.respuesta}: {p.response}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Resolver({ token, pedido, alResolver }: { token: string; pedido: Pedido; alResolver: () => void }) {
  const id = useId();
  const { revisar } = useAdministracion();
  const [hecho, setHecho] = useState(true);
  const [respuesta, setRespuesta] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const clave = useRef<string | null>(null);

  async function resolver(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!respuesta.trim() || !fundamento.trim()) return setFalla('Escribí la respuesta para la persona y el fundamento.');
    setFalla(null);
    setEnviando(true);
    clave.current ??= nuevaClaveAdministrativa();
    const r = await apiAdministrativa.resolverPedidoDeDerecho(token, pedido.requestId, { outcome: hecho ? 'RESOLVED' : 'REJECTED', response: respuesta, rationale: fundamento }, clave.current);
    setEnviando(false);
    if (r.ok) {
      clave.current = null;
      return alResolver();
    }
    if (r.tipo === 'RED') return setFalla(COPY.resultadoIncierto);
    clave.current = null;
    if (revisar(r)) return;
    setFalla(r.codigo === 'INVALID_STATE_TRANSITION' ? 'Este pedido ya se resolvió.' : COPY.noDisponible);
  }

  return (
    <form className="formulario" onSubmit={resolver} noValidate>
      {falla ? (
        <Aviso tipo="error" enfocar>
          <p>{falla}</p>
        </Aviso>
      ) : null}
      <fieldset className="campo">
        <legend>Resolución</legend>
        <label className="opcion">
          <input type="radio" name={`${id}-resultado`} checked={hecho} onChange={() => setHecho(true)} /> Hecho
        </label>
        <label className="opcion">
          <input type="radio" name={`${id}-resultado`} checked={!hecho} onChange={() => setHecho(false)} /> No se pudo
        </label>
      </fieldset>
      <div className="campo">
        <label htmlFor={`${id}-respuesta`}>Respuesta para la persona</label>
        <textarea id={`${id}-respuesta`} rows={3} maxLength={2000} value={respuesta} onChange={(ev) => setRespuesta(ev.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-fundamento`}>Fundamento interno (lo ve solo Administración)</label>
        <textarea id={`${id}-fundamento`} rows={2} maxLength={1000} value={fundamento} onChange={(ev) => setFundamento(ev.target.value)} />
      </div>
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Resolviendo…' : 'Resolver'}
        </button>
      </div>
    </form>
  );
}
