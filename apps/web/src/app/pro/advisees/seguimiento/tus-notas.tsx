'use client';

/**
 * PG-16 (WP-PULIDO-GRANDES; DL-173, PG-D11, aprobada por Dirección el 2026-11-14) · «Tus notas» en el Resumen de la ficha:
 * lo que el profesional necesita recordar de esta persona, con su fecha («le molesta la rodilla izquierda en la sentadilla
 * profunda»). Como un bloc, no como un chat:
 * - **Solo las ve quien las escribe**, y lo dice arriba, con lo que pasa si la persona pide sus datos (PG-D11).
 * - **Escribir es un campo y un botón**; la nota nueva queda primera. Las atadas a un ejercicio o a una comida dicen dónde
 *   (y «que ya no está en el plan», si ya no está); se atan desde los editores, al lado de ese ejercicio o esa comida.
 * - **Archivar no borra:** la nota pasa a «Archivadas», plegado, con su fecha. Un aviso lo dice en voz para el lector.
 * - **Sin vínculo vigente** (el 404 de la lectura), se dice que quedan guardadas y que hoy no se pueden leer ni agregar.
 * - **Con «Ocultar nombres»** (PG-T73), el texto no se ve hasta «Mostrar en esta pantalla».
 * Las reglas (activas, archivadas, el ancla en palabras) están en el dominio (`notas-propias.ts`), con su prueba.
 */
import {
  COPY_NOTAS_PROPIAS as T,
  MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA,
  notasActivas,
  notasArchivadas,
  rotuloDelAncla,
  type ListaDeNotasPropiasDelProfesionalResponse,
  type NotaPropia,
} from '@be/domain';
import { useId, useMemo, useRef, useState } from 'react';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaSinElAnioEnCurso } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useNombresOcultos } from '../../../../lib/nombres-ocultos';
import { razonDeFalla, useLectura, useSeguimiento } from './contexto';

export function TusNotas() {
  const { token, asesoradoId, sesionPerdida } = useSeguimiento();
  const id = useId();
  const ocultos = useNombresOcultos();
  const [ver, setVer] = useState(false);
  const { lectura, recargar } = useLectura<ListaDeNotasPropiasDelProfesionalResponse>(`tus-notas|${asesoradoId}`, () => api.notasPropias(token, asesoradoId));
  // Lo escrito y archivado en esta pantalla, sobre lo leído: sin volver a pedir la lista después de cada cambio.
  const [propias, setPropias] = useState<readonly NotaPropia[]>([]);
  const todas = useMemo(() => {
    const porId = new Map((lectura.tipo === 'listo' ? lectura.datos.data : []).map((n) => [n.noteId, n] as const));
    for (const n of propias) porId.set(n.noteId, n);
    return [...porId.values()];
  }, [lectura, propias]);
  const activas = notasActivas(todas);
  const archivadas = notasArchivadas(todas);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [archivando, setArchivando] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const intento = useClaveDeIntento();
  const intentoDeArchivar = useClaveDeIntento();
  const titulo = useRef<HTMLHeadingElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const limpio = texto.trim();

  const cambiada = (n: NotaPropia) => setPropias((anteriores) => [...anteriores.filter((x) => x.noteId !== n.noteId), n]);
  const guardar = async () => {
    if (enviando) return;
    if (limpio === '') {
      setFallo(T.faltaElTexto);
      campo.current?.focus();
      return;
    }
    setEnviando(true);
    setFallo(null);
    const cuerpo = { text: limpio };
    const r = await api.agregarNotaPropia(token, asesoradoId, cuerpo, intento.actual(JSON.stringify(cuerpo)));
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    cambiada(r.datos.data);
    setTexto('');
    setAviso(T.guardada);
  };
  const archivar = async (n: NotaPropia) => {
    if (archivando) return;
    setArchivando(n.noteId);
    setFallo(null);
    const r = await api.archivarNotaPropia(token, n.noteId, intentoDeArchivar.actual(n.noteId));
    intentoDeArchivar.registrar(r);
    setArchivando(null);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    cambiada(r.datos.data);
    setAviso(T.archivadaAviso);
    // La nota sale de la lista que tenía el foco: el foco vuelve al título del bloc.
    titulo.current?.focus({ preventScroll: true });
  };

  const textoVisible = !ocultos || ver;
  return (
    <section className="notas-del-equipo tus-notas" aria-labelledby={`${id}-titulo`}>
      <div className="notas-del-equipo__caja">
        <div className="notas-del-equipo__cabecera">
          <h2 id={`${id}-titulo`} ref={titulo} tabIndex={-1}>
            <Icono nombre="candado" tamano={20} />
            {T.titulo}
          </h2>
        </div>
        <p className="nota">{T.queSon}</p>
        <p className="visualmente-oculto" role="status">
          {aviso}
        </p>
        {lectura.tipo === 'cargando' ? <p className="nota">Cargando…</p> : null}
        {lectura.tipo === 'error' ? (
          <p className="nota">
            {T.noSePudoLeer} {razonDeFalla(lectura.motivo)}{' '}
            <button type="button" className="boton boton--enlace" onClick={recargar}>
              Reintentar
            </button>
          </p>
        ) : null}
        {lectura.tipo === 'no-disponible' ? <p className="nota">{T.sinAcceso}</p> : null}
        {lectura.tipo === 'listo' ? (
          <form
            className="tus-notas__escribir"
            onSubmit={(e) => {
              e.preventDefault();
              void guardar();
            }}
          >
            <div className="campo">
              <label htmlFor={`${id}-texto`}>{T.escribir}</label>
              <textarea
                ref={campo}
                id={`${id}-texto`}
                rows={2}
                value={texto}
                maxLength={MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA}
                aria-describedby={`${id}-ayuda`}
                onChange={(e) => setTexto(e.target.value)}
              />
              <p id={`${id}-ayuda`} className="campo__ayuda">
                {texto.length > 0 ? T.quedan(MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA - texto.length) : T.ayudaDelCampo}
              </p>
            </div>
            <button type="submit" className="boton boton--secundario boton--compacto" aria-disabled={limpio === '' || undefined} aria-busy={enviando || undefined} disabled={enviando}>
              {enviando ? T.guardando : T.guardar}
            </button>
          </form>
        ) : null}
        {fallo ? (
          <p className="campo__error" role="alert">
            {fallo}
          </p>
        ) : null}
        {lectura.tipo === 'listo' && activas.length === 0 ? <p className="nota">{T.vacio}</p> : null}
        {activas.length > 0 && !textoVisible ? (
          <p className="nota">
            {T.tusNotas(activas.length)}. {T.ocultas}{' '}
            <button type="button" className="boton boton--enlace" onClick={() => setVer(true)}>
              {T.mostrar}
            </button>
          </p>
        ) : null}
        {activas.length > 0 && textoVisible ? (
          <ul className="notas-del-equipo__lista tus-notas__lista">
            {activas.map((n) => (
              <li key={n.noteId} className="tus-notas__nota">
                <p className="notas-del-equipo__texto">{n.text}</p>
                <p className="nota tus-notas__datos">
                  <span>{T.delDia(diaSinElAnioEnCurso(n.recordedAt))}</span>
                  {rotuloDelAncla(n.anchor) ? <span>{rotuloDelAncla(n.anchor)}</span> : null}
                  <button type="button" className="boton boton--enlace" aria-busy={archivando === n.noteId || undefined} disabled={archivando !== null} onClick={() => void archivar(n)}>
                    {archivando === n.noteId ? T.archivando : T.archivar}
                    <span className="visualmente-oculto"> {T.delDia(diaSinElAnioEnCurso(n.recordedAt)).toLowerCase()}</span>
                  </button>
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        {archivadas.length > 0 && textoVisible ? (
          <details className="tus-notas__archivadas">
            <summary>{T.archivadas(archivadas.length)}</summary>
            <ul className="notas-del-equipo__lista">
              {archivadas.map((n) => (
                <li key={n.noteId} className="tus-notas__nota">
                  <p className="notas-del-equipo__texto">{n.text}</p>
                  <p className="nota tus-notas__datos">
                    <span>{T.delDia(diaSinElAnioEnCurso(n.recordedAt))}</span>
                    {rotuloDelAncla(n.anchor) ? <span>{rotuloDelAncla(n.anchor)}</span> : null}
                    <span>{T.archivada(diaSinElAnioEnCurso(n.archivedAt as string))}</span>
                  </p>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {ocultos && ver ? (
          <button type="button" className="boton boton--enlace tus-notas__ocultar" onClick={() => setVer(false)}>
            {T.volverAOcultar}
          </button>
        ) : null}
        {lectura.tipo === 'listo' && lectura.datos.page.hasMore ? <p className="nota">{T.hayMas(lectura.datos.page.limit)}</p> : null}
      </div>
    </section>
  );
}
