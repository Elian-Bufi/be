'use client';

/**
 * RF-068 (DEUDA_LEGAJO DL-172; 05 UC-P28) · «Avisar un problema» en la cuenta: la persona o el profesional reporta una
 * incidencia con su categoría y su descripción (API-INC-01), y ve lo que avisó con su estado y la respuesta de
 * Administración (API-INC-02). No es un chat: para lo urgente o si no puede entrar, sigue el canal de ayuda.
 * - **Un intento, una clave de idempotencia:** el reintento de un resultado incierto la reusa; cambiar el texto la renueva.
 * - **Una lectura que falla no es una lista vacía:** lo dice y ofrece reintentar.
 */
import { CATEGORIAS_DE_INCIDENCIA, COPY, COPY_INCIDENCIAS as C, LARGO_MAXIMO_DE_LA_DESCRIPCION_DE_INCIDENCIA, type CategoriaDeIncidencia, type IncidenciaPropia } from '@be/domain';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ErrorConReintento } from '../../components/estados';
import { Aviso } from '../../components/formulario';
import { api, nuevaClaveDeIdempotencia } from '../../lib/api';
import { dia } from '../../lib/formato';
import { useSesionPerdida } from '../../lib/sesion-requerida';

export function AvisarUnProblema({ token }: { token: string }) {
  const id = useId();
  const { sesionPerdida } = useSesionPerdida(usePathname() ?? '/account');
  const [avisos, setAvisos] = useState<readonly IncidenciaPropia[] | 'falla' | null>(null);
  const [categoria, setCategoria] = useState<CategoriaDeIncidencia>('APP_FUNCTIONING');
  const [descripcion, setDescripcion] = useState('');
  const [errorDeDescripcion, setErrorDeDescripcion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ readonly tipo: 'info' | 'error'; readonly texto: string } | null>(null);
  const clave = useRef<string | null>(null);

  const leer = useCallback(async () => {
    setAvisos(null);
    const r = await api.incidenciasPropias(token);
    if (!r.ok && sesionPerdida(r)) return;
    setAvisos(r.ok ? r.datos.data : 'falla');
  }, [token, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setAviso(null);
    if (!descripcion.trim()) return setErrorDeDescripcion(C.descripcionRequerida);
    setErrorDeDescripcion(null);
    setEnviando(true);
    clave.current ??= nuevaClaveDeIdempotencia();
    const r = await api.reportarIncidencia(token, { category: categoria, description: descripcion.trim() }, clave.current);
    setEnviando(false);
    if (r.ok) {
      clave.current = null;
      setDescripcion('');
      setAviso({ tipo: 'info', texto: C.enviado });
      return void leer();
    }
    if (r.tipo === 'RED') return setAviso({ tipo: 'error', texto: COPY.resultadoIncierto });
    clave.current = null;
    if (sesionPerdida(r)) return;
    if (r.codigo === 'RATE_LIMITED') return setAviso({ tipo: 'error', texto: COPY.demasiadosIntentos });
    if (r.codigo === 'VALIDATION_FAILED' && r.issues.some((i) => i.path === 'description')) {
      return setErrorDeDescripcion(r.issues.some((i) => i.code === 'DESCRIPTION_TOO_LONG') ? C.descripcionLarga : C.descripcionRequerida);
    }
    setAviso({ tipo: 'error', texto: COPY.noDisponible });
  }

  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{C.titulo}</h2>
      <p>{C.queEs}</p>
      {aviso ? (
        <Aviso tipo={aviso.tipo} enfocar>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : null}
      <form className="formulario" onSubmit={enviar} noValidate>
        <div className="campo">
          <label htmlFor={`${id}-categoria`}>{C.categoria}</label>
          <select
            id={`${id}-categoria`}
            value={categoria}
            onChange={(ev) => {
              clave.current = null;
              setCategoria(ev.target.value as CategoriaDeIncidencia);
            }}
          >
            {CATEGORIAS_DE_INCIDENCIA.map((c) => (
              <option key={c} value={c}>
                {C.categorias[c]}
              </option>
            ))}
          </select>
        </div>
        <div className={`campo${errorDeDescripcion ? ' campo--error' : ''}`}>
          <label htmlFor={`${id}-descripcion`}>{C.descripcion}</label>
          <p id={`${id}-descripcion-ayuda`} className="campo__ayuda">
            {C.descripcionAyuda}
          </p>
          <textarea
            id={`${id}-descripcion`}
            rows={4}
            maxLength={LARGO_MAXIMO_DE_LA_DESCRIPCION_DE_INCIDENCIA}
            value={descripcion}
            aria-invalid={errorDeDescripcion ? true : undefined}
            aria-describedby={errorDeDescripcion ? `${id}-descripcion-ayuda ${id}-descripcion-error` : `${id}-descripcion-ayuda`}
            onChange={(ev) => {
              clave.current = null;
              setErrorDeDescripcion(null);
              setDescripcion(ev.target.value);
            }}
          />
          {errorDeDescripcion ? (
            <p id={`${id}-descripcion-error`} className="campo__error">
              {errorDeDescripcion}
            </p>
          ) : null}
        </div>
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
            {enviando ? C.enviando : C.enviar}
          </button>
        </div>
      </form>
      <p className="nota">{C.noEs}</p>
      <h3>{C.propias.titulo}</h3>
      {avisos === null ? <p aria-busy="true">Cargando…</p> : null}
      {avisos === 'falla' ? <ErrorConReintento mensaje={C.propias.sinLeer} onReintentar={() => void leer()} /> : null}
      {Array.isArray(avisos) && avisos.length === 0 ? <p>{C.propias.vacio}</p> : null}
      {Array.isArray(avisos) && avisos.length > 0 ? (
        <ul className="lista-simple">
          {(avisos as readonly IncidenciaPropia[]).map((a) => (
            <li key={a.incidentId}>
              <p>
                <strong>{C.categorias[a.category]}</strong> · {C.propias.estado[a.state]} · {C.propias.avisado(dia(a.createdAt))}
              </p>
              <p className="nota">«{a.description}»</p>
              {a.response ? (
                <p>
                  {C.propias.respuesta}: {a.response}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
