'use client';

/**
 * UF-06 de WP-USO-FINAL (DL-169; 08 §19) · «Tus datos» en la cuenta: descargar lo propio (API-EXP-01 y 02, y la descarga
 * por la ruta firmada) y pedir el acceso, la rectificación o la supresión (API-RGT-01 y 03), con el plazo de cada pedido y
 * la respuesta de Administración.
 * - **Descargar:** pide la exportación de los tres dominios y abre la ruta firmada (vence a los 15 minutos); el archivo no
 *   pasa por el almacenamiento del navegador.
 * - **Pedir:** un intento, una clave de idempotencia (el reintento de un resultado incierto la reusa).
 */
import { COPY, COPY_DERECHOS, TIPOS_DE_PEDIDO_DE_DERECHO, type PedidoDeDerecho, type TipoDePedidoDeDerecho } from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Aviso } from '../../components/formulario';
import { api, nuevaClaveDeIdempotencia } from '../../lib/api';
import { dia } from '../../lib/formato';

const D = COPY_DERECHOS;
const fechaCivilEnPalabras = (civil: string): string => dia(`${civil}T12:00:00.000Z`);

export function TusDatos({ token }: { token: string }) {
  const id = useId();
  const [pedidos, setPedidos] = useState<readonly PedidoDeDerecho[] | null>(null);
  const [tipo, setTipo] = useState<TipoDePedidoDeDerecho>('ACCESS');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [aviso, setAviso] = useState<{ readonly tipo: 'info' | 'error'; readonly texto: string } | null>(null);
  const clave = useRef<string | null>(null);

  const leer = useCallback(async () => {
    const r = await api.pedidosDeDerechos(token);
    setPedidos(r.ok ? r.datos.data : []);
  }, [token]);
  useEffect(() => {
    void leer();
  }, [leer]);

  async function descargar() {
    if (descargando) return;
    setAviso(null);
    setDescargando(true);
    try {
      const pedida = await api.exportarMisDatos(token, { scope: { domains: ['NUTRITION', 'TRAINING', 'ANTHROPOMETRY'], period: null } }, nuevaClaveDeIdempotencia());
      const estado = pedida.ok ? await api.exportacionPropia(token, pedida.datos.data.exportId) : null;
      if (!estado?.ok || !estado.datos.data.download) return setAviso({ tipo: 'error', texto: COPY.noDisponible });
      // La ruta firmada abre la descarga (Content-Disposition: attachment); la página no cambia.
      window.location.assign(api.direccionDeDescarga(estado.datos.data.download.path));
      setAviso({ tipo: 'info', texto: D.descargar.listo });
    } finally {
      setDescargando(false);
    }
  }

  async function pedir(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setAviso(null);
    setEnviando(true);
    clave.current ??= nuevaClaveDeIdempotencia();
    const r = await api.pedirUnDerecho(token, { type: tipo, scope: nota.trim() ? { note: nota.trim() } : {} }, clave.current);
    setEnviando(false);
    if (r.ok) {
      clave.current = null;
      setNota('');
      setAviso({ tipo: 'info', texto: D.pedir.enviado(fechaCivilEnPalabras(r.datos.data.deadline)) });
      return void leer();
    }
    if (r.tipo === 'RED') return setAviso({ tipo: 'error', texto: COPY.resultadoIncierto });
    clave.current = null;
    setAviso({ tipo: 'error', texto: COPY.noDisponible });
  }

  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{D.titulo}</h2>
      <p>{D.queEs}</p>
      {aviso ? (
        <Aviso tipo={aviso.tipo} enfocar>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : null}
      <h3>{D.descargar.titulo}</h3>
      <p>{D.descargar.texto}</p>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={() => void descargar()} disabled={descargando} aria-busy={descargando}>
          {descargando ? D.descargar.preparando : D.descargar.boton}
        </button>
      </div>
      <h3>{D.pedir.titulo}</h3>
      <form className="formulario" onSubmit={pedir} noValidate>
        <fieldset className="campo">
          <legend>{D.pedir.tipo}</legend>
          {TIPOS_DE_PEDIDO_DE_DERECHO.map((t) => (
            <label key={t} className="opcion">
              <input
                type="radio"
                name={`${id}-tipo`}
                checked={tipo === t}
                onChange={() => {
                  clave.current = null;
                  setTipo(t);
                }}
              />{' '}
              {D.pedir.tipos[t]}
            </label>
          ))}
        </fieldset>
        {tipo === 'SUPPRESSION' ? <p className="nota">{D.pedir.supresionAyuda}</p> : null}
        <div className="campo">
          <label htmlFor={`${id}-nota`}>{D.pedir.nota}</label>
          <p id={`${id}-nota-ayuda`} className="campo__ayuda">
            {D.pedir.notaAyuda}
          </p>
          <textarea
            id={`${id}-nota`}
            rows={3}
            maxLength={1000}
            value={nota}
            aria-describedby={`${id}-nota-ayuda`}
            onChange={(ev) => {
              clave.current = null;
              setNota(ev.target.value);
            }}
          />
        </div>
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
            {enviando ? D.pedir.enviando : D.pedir.enviar}
          </button>
        </div>
      </form>
      <p className="nota">{D.plazosAConfirmar}</p>
      <h3>{D.pedidos.titulo}</h3>
      {pedidos === null ? <p aria-busy="true">Cargando…</p> : null}
      {pedidos && pedidos.length === 0 ? <p>{D.pedidos.vacio}</p> : null}
      {pedidos && pedidos.length > 0 ? (
        <ul className="lista-simple">
          {pedidos.map((p) => (
            <li key={p.requestId}>
              <strong>{D.pedir.tipos[p.type]}</strong> · {D.pedidos.estado[p.state]} · {D.pedidos.plazo(fechaCivilEnPalabras(p.deadline))}
              {p.response ? (
                <p>
                  {D.pedidos.respuesta}: {p.response}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
