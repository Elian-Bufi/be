'use client';

/**
 * «Escribir una nota de coordinación» (WP-NOTAS-DE-COORDINACION; DEUDA_LEGAJO DL-140; RF-057 · UC-E07), un diálogo de la
 * ficha del asesorado. Se abre desde el marco de la ficha, desde «Notas recientes del equipo» del Resumen y, para corregir
 * una nota propia, desde su detalle en la Línea de tiempo.
 * - **Los cuatro límites a la vista** (UC-E07, paso 6), siempre, arriba: no prescribir, no modificar, no decidir sobre otra
 *   área y no transferir responsabilidad.
 * - **Para** (CRD-D1): todos los que hoy acompañan a la persona, con sus nombres, o uno en particular. La lista es la de
 *   API-CRD-01-LISTA; la API vuelve a decidir al enviar.
 * - **Desde tu área** (CRD-D4): si el profesional acompaña a la persona en dos áreas, elige una; con una, se dice cuál.
 * - **Para qué** (CRD-D4): de la lista cerrada, elegida a propósito: no viene marcada.
 * - **La nota** (CRD-D3): hasta 600 caracteres, con «escribí solo lo que el otro profesional necesita para su trabajo».
 * - **Citar algo de tu área** (CRD-D5): planes activados, revisiones o tomas propias de esa área, hasta tres. Quien la recibe
 *   ve que están citados; los abre solo si ya tenía acceso.
 * - **«La persona también la lee»** (CRD-D2), junto al botón de enviar.
 * El mismo patrón de diálogo que «Invitar a una persona»: `<dialog>` modal, el foco adentro, Escape cierra salvo mientras se
 * envía, y una Idempotency-Key por intento (un resultado incierto se reintenta con la misma).
 */
import {
  COPY,
  COPY_NOTAS_DE_COORDINACION as T,
  COPY_VINCULO,
  ETIQUETA_DE_ALCANCE,
  ETIQUETA_DE_FINALIDAD_DE_NOTA,
  FINALIDADES_DE_NOTA,
  LIMITES_DE_LA_NOTA,
  MAXIMO_DE_CARACTERES_DE_LA_NOTA,
  MAXIMO_DE_REFERENCIAS_DE_LA_NOTA,
  nombresEnUnaFrase,
  TIPOS_DE_REFERENCIA_DE_NOTA,
  type Alcance,
  type DestinatariosPosiblesResponse,
  type DominioDeAnalisis,
  type FinalidadDeNota,
  type ReferenciaDeNotaRequest,
  type TipoDeEvento,
  type TipoDeReferenciaDeNota,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api, type Resultado } from '../../../lib/api';
import { diaDelAnioEnCurso } from '../../../lib/formato';
import { esIncierto, useClaveDeIntento } from '../../../lib/intento';
import type { PedidoDeNota } from './seguimiento/contexto';
import { hoyEn, restarDias } from './seguimiento/estado';

type Destinatarios = DestinatariosPosiblesResponse['data'];
type Carga = { tipo: 'cargando' } | { tipo: 'no-disponible' } | { tipo: 'error' } | { tipo: 'listo'; datos: Destinatarios };
type Envio = { tipo: 'escribiendo' } | { tipo: 'enviando' } | { tipo: 'error'; texto: string; incierto: boolean } | { tipo: 'enviada' };

/** Lo que se puede citar desde cada área: los hitos propios de esa área en la línea de tiempo, que son de quien la mira. */
const HITOS_CITABLES: Readonly<Record<Alcance, readonly TipoDeEvento[]>> = {
  NUTRICION: ['NUTRITION_PLAN_ACTIVATED', 'NUTRITION_REVIEW_RECORDED'],
  ENTRENAMIENTO: ['TRAINING_PLAN_ACTIVATED', 'TRAINING_REVIEW_RECORDED'],
  ANTROPOMETRIA: ['ANTHROPOMETRIC_EVALUATION_RECORDED'],
};
const DOMINIO: Readonly<Record<Alcance, DominioDeAnalisis>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING', ANTROPOMETRIA: 'ANTHROPOMETRY' };
const ALCANCE_DEL_DOMINIO: Readonly<Record<DominioDeAnalisis, Alcance>> = { NUTRITION: 'NUTRICION', TRAINING: 'ENTRENAMIENTO', ANTHROPOMETRY: 'ANTROPOMETRIA' };

interface Citable {
  readonly type: TipoDeReferenciaDeNota;
  readonly id: string;
  readonly texto: string;
}

export function DialogoDeNota({
  pedido,
  token,
  asesoradoId,
  nombreDelAsesorado,
  sesionPerdida,
  onCerrar,
  onEnviada,
}: {
  /** `null`: cerrado. */
  pedido: PedidoDeNota | null;
  token: string;
  asesoradoId: string;
  nombreDelAsesorado: string | null;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCerrar: () => void;
  /** La nota quedó registrada: la ficha vuelve a leer lo que la muestra. */
  onEnviada: () => void;
}) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const intento = useClaveDeIntento();
  const abierto = pedido !== null;
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [origen, setOrigen] = useState<Alcance | ''>('');
  const [modo, setModo] = useState<'ALL' | 'ONE'>('ALL');
  const [elegido, setElegido] = useState('');
  const [finalidad, setFinalidad] = useState<FinalidadDeNota | ''>('');
  const [texto, setTexto] = useState('');
  const [citables, setCitables] = useState<readonly Citable[] | null>(null);
  // Si lo citable no se pudo leer, se dice y se vuelve a pedir: no es «no hay nada tuyo para citar» (bloque 5).
  const [falloLoCitable, setFalloLoCitable] = useState(false);
  const [vueltaDeLoCitable, setVueltaDeLoCitable] = useState(0);
  const [citadas, setCitadas] = useState<readonly string[]>([]);
  const [errores, setErrores] = useState<Readonly<Record<string, string>>>({});
  const [envio, setEnvio] = useState<Envio>({ tipo: 'escribiendo' });
  const enviando = envio.tipo === 'enviando';
  const persona = nombreDelAsesorado ?? 'esta persona';
  const corrige = pedido?.corrige ?? null;

  const cargar = useCallback(async () => {
    setCarga({ tipo: 'cargando' });
    const r = await api.destinatariosDeNota(token, asesoradoId);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setCarga(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'no-disponible' } : { tipo: 'error' });
    setCarga({ tipo: 'listo', datos: r.datos.data });
    // El área de la nota que se corrige, si sigue siendo una de las suyas; si no, la primera.
    const deLaCorreccion = corrige ? ALCANCE_DEL_DOMINIO[corrige.origen] : null;
    const areas = r.datos.data.origins.map((o) => o.code);
    setOrigen(deLaCorreccion && areas.includes(deLaCorreccion) ? deLaCorreccion : (areas[0] ?? ''));
  }, [token, asesoradoId, sesionPerdida, corrige]);

  // Al abrirse: un formulario limpio y la lista de hoy. Al cerrarse, nada queda escrito para la próxima vez.
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      setModo('ALL');
      setElegido('');
      setFinalidad('');
      setTexto('');
      setCitadas([]);
      setErrores({});
      setEnvio({ tipo: 'escribiendo' });
      intento.descartar();
      d.showModal();
      void cargar();
    }
    if (!abierto && d.open) d.close();
  }, [abierto, cargar, intento]);

  // Lo citable depende del área de origen: los hitos propios de esa área en el último año.
  useEffect(() => {
    if (!abierto || !origen) return;
    let vigente = true;
    setCitables(null);
    setFalloLoCitable(false);
    setCitadas([]);
    const hoy = hoyEn();
    void api
      .lineaDeTiempo(token, asesoradoId, { periodStart: restarDias(hoy, 365), periodEnd: hoy, domain: DOMINIO[origen], type: HITOS_CITABLES[origen].join(','), limit: '50' })
      .then((r) => {
        if (!vigente) return;
        if (!r.ok) {
          // Un «no disponible» es neutral: desde acá no hay nada que citar. Cualquier otra falla se dice.
          setFalloLoCitable(!(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND'));
          return setCitables([]);
        }
        const tipos: readonly string[] = TIPOS_DE_REFERENCIA_DE_NOTA;
        setCitables(
          r.datos.data.entries
            .filter((e) => tipos.includes(e.source.type))
            .map((e) => ({ type: e.source.type as TipoDeReferenciaDeNota, id: e.source.id, texto: `${e.title} · ${diaDelAnioEnCurso(e.occurredDate, hoy)}` })),
        );
      });
    return () => {
      vigente = false;
    };
  }, [abierto, origen, token, asesoradoId, vueltaDeLoCitable]);

  const destinatarios = carga.tipo === 'listo' ? carga.datos.recipients : [];
  const origenes = carga.tipo === 'listo' ? carga.datos.origins : [];
  const sinDestinatarios = carga.tipo === 'listo' && destinatarios.length === 0;

  function alternarCita(clave: string) {
    setCitadas((c) => (c.includes(clave) ? c.filter((x) => x !== clave) : c.length >= MAXIMO_DE_REFERENCIAS_DE_LA_NOTA ? c : [...c, clave]));
    intento.descartar();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando || carga.tipo !== 'listo') return;
    const faltan: Record<string, string> = {};
    if (!origen) faltan.origen = 'Elegí desde qué área escribís.';
    if (modo === 'ONE' && !elegido) faltan.para = 'Elegí a quién.';
    if (!finalidad) faltan.finalidad = 'Elegí para qué es la nota.';
    if (!texto.trim()) faltan.texto = 'Escribí la nota.';
    setErrores(faltan);
    if (Object.keys(faltan).length > 0 || !origen || !finalidad) return;
    const referencias: ReferenciaDeNotaRequest[] = (citables ?? []).filter((c) => citadas.includes(`${c.type}|${c.id}`)).map((c) => ({ type: c.type, id: c.id }));
    setEnvio({ tipo: 'enviando' });
    const r = await api.crearNotaDeCoordinacion(
      token,
      asesoradoId,
      {
        originScope: origen,
        purpose: finalidad,
        recipients: modo === 'ONE' ? { mode: 'ONE', identityId: elegido } : { mode: 'ALL' },
        text: texto.trim(),
        ...(referencias.length > 0 ? { references: referencias } : {}),
        ...(corrige ? { correctsNoteId: corrige.noteId } : {}),
      },
      intento.actual(),
    );
    intento.registrar(r);
    if (r.ok) {
      setEnvio({ tipo: 'enviada' });
      onEnviada();
      return;
    }
    if (sesionPerdida(r)) return;
    if (esIncierto(r)) return setEnvio({ tipo: 'error', texto: COPY.resultadoIncierto, incierto: true });
    const codigo = r.tipo === 'API' ? r.codigo : '';
    if (codigo === 'COORDINATION_RECIPIENT_NOT_AVAILABLE') void cargar();
    setEnvio({
      tipo: 'error',
      incierto: false,
      texto:
        codigo === 'COORDINATION_RECIPIENT_NOT_AVAILABLE'
          ? modo === 'ONE'
            ? T.destinatarioNoDisponible
            : T.sinDestinatarios
          : codigo === 'COORDINATION_REFERENCE_INVALID'
            ? T.referenciaNoDisponible
            : codigo === 'RESOURCE_NOT_FOUND'
              ? COPY_VINCULO.recursoNoDisponible
              : COPY.noDisponible,
    });
  }

  const cambio = () => {
    intento.descartar();
    if (envio.tipo === 'error') setEnvio({ tipo: 'escribiendo' });
  };

  return (
    <dialog
      ref={dialogo}
      className="dialogo dialogo--formulario nota-coord"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        if (enviando) e.preventDefault();
      }}
      onClose={onCerrar}
    >
      <h2 id={`${id}-titulo`}>{T.tituloDelDialogo}</h2>
      <p className="nota">{T.queEs}</p>
      <section className="nota-coord__limites" aria-labelledby={`${id}-limites`}>
        <h3 id={`${id}-limites`}>{T.limitesTitulo}</h3>
        <ul>
          {LIMITES_DE_LA_NOTA.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      {envio.tipo === 'enviada' ? (
        <>
          <Aviso tipo="exito" enfocar>
            <p>{T.enviada}</p>
          </Aviso>
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={onCerrar}>
              Listo
            </button>
          </div>
        </>
      ) : (
        <form className="formulario" onSubmit={enviar} noValidate>
          {corrige ? (
            <Aviso tipo="info">
              <p>
                <strong>{T.corrige(corrige.fecha)}.</strong> {T.corregirAyuda}
              </p>
            </Aviso>
          ) : null}
          {carga.tipo === 'cargando' ? <p className="nota">Cargando…</p> : null}
          {carga.tipo === 'error' ? (
            <p className="campo__error">
              {COPY.noDisponible}{' '}
              <button type="button" className="boton boton--enlace" onClick={() => void cargar()}>
                {COPY.reintentar}
              </button>
            </p>
          ) : null}
          {carga.tipo === 'no-disponible' ? (
            <Aviso tipo="info">
              <p>{COPY_VINCULO.recursoNoDisponible}</p>
            </Aviso>
          ) : null}
          {carga.tipo === 'listo' ? (
            <>
              {origenes.length > 1 ? (
                <div className={`campo${errores.origen ? ' campo--error' : ''}`}>
                  <label htmlFor={`${id}-origen`}>{T.desde}</label>
                  <select
                    id={`${id}-origen`}
                    value={origen}
                    onChange={(e) => {
                      setOrigen(e.target.value as Alcance);
                      cambio();
                    }}
                  >
                    {origenes.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : origen ? (
                <p className="nota-coord__desde">
                  {T.desde}: <strong>{ETIQUETA_DE_ALCANCE[origen]}</strong>
                </p>
              ) : null}

              <fieldset className="capas capas--en-columna nota-coord__para">
                <legend>{T.para}</legend>
                <label className="capa">
                  <input
                    type="radio"
                    name={`${id}-para`}
                    checked={modo === 'ALL'}
                    onChange={() => {
                      setModo('ALL');
                      cambio();
                    }}
                  />
                  {T.paraTodos(persona)}
                </label>
                {destinatarios.length > 0 ? (
                  <p className="nota nota-coord__quienes">Hoy: {nombresEnUnaFrase(destinatarios.map((d) => `${d.displayName} (${d.scopes.map((s) => s.label).join(' y ')})`))}.</p>
                ) : null}
                <label className="capa">
                  <input
                    type="radio"
                    name={`${id}-para`}
                    checked={modo === 'ONE'}
                    onChange={() => {
                      setModo('ONE');
                      cambio();
                    }}
                    disabled={destinatarios.length === 0}
                  />
                  {T.paraUno}
                </label>
                {modo === 'ONE' ? (
                  <div className={`campo${errores.para ? ' campo--error' : ''}`}>
                    <label htmlFor={`${id}-uno`}>{T.elegirUno}</label>
                    <select
                      id={`${id}-uno`}
                      value={elegido}
                      aria-invalid={errores.para ? true : undefined}
                      aria-describedby={errores.para ? `${id}-uno-error` : undefined}
                      onChange={(e) => {
                        setElegido(e.target.value);
                        cambio();
                      }}
                    >
                      <option value="">{T.elegirUno}</option>
                      {destinatarios.map((d) => (
                        <option key={d.identityId} value={d.identityId}>
                          {d.displayName} · {d.scopes.map((s) => s.label).join(' y ')}
                        </option>
                      ))}
                    </select>
                    {errores.para ? (
                      <p id={`${id}-uno-error`} className="campo__error">
                        {errores.para}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </fieldset>
              {sinDestinatarios ? (
                <Aviso tipo="info">
                  <p>{T.sinDestinatarios}</p>
                </Aviso>
              ) : null}

              <div className={`campo${errores.finalidad ? ' campo--error' : ''}`}>
                <label htmlFor={`${id}-finalidad`}>{T.finalidad}</label>
                <select
                  id={`${id}-finalidad`}
                  value={finalidad}
                  aria-invalid={errores.finalidad ? true : undefined}
                  aria-describedby={errores.finalidad ? `${id}-finalidad-error` : undefined}
                  onChange={(e) => {
                    setFinalidad(e.target.value as FinalidadDeNota | '');
                    cambio();
                  }}
                >
                  <option value="">Elegí para qué</option>
                  {FINALIDADES_DE_NOTA.map((f) => (
                    <option key={f} value={f}>
                      {ETIQUETA_DE_FINALIDAD_DE_NOTA[f]}
                    </option>
                  ))}
                </select>
                {errores.finalidad ? (
                  <p id={`${id}-finalidad-error`} className="campo__error">
                    {errores.finalidad}
                  </p>
                ) : null}
              </div>

              <div className={`campo${errores.texto ? ' campo--error' : ''}`}>
                <label htmlFor={`${id}-texto`}>{T.texto}</label>
                <textarea
                  id={`${id}-texto`}
                  rows={5}
                  maxLength={MAXIMO_DE_CARACTERES_DE_LA_NOTA}
                  value={texto}
                  aria-invalid={errores.texto ? true : undefined}
                  aria-describedby={`${id}-texto-ayuda${errores.texto ? ` ${id}-texto-error` : ''}`}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    cambio();
                  }}
                />
                <p id={`${id}-texto-ayuda`} className="campo__ayuda nota-coord__ayuda-del-texto">
                  <span>{T.soloLoNecesario}</span>
                  <span aria-live="polite">{T.caracteres(texto.length, MAXIMO_DE_CARACTERES_DE_LA_NOTA)}</span>
                </p>
                {errores.texto ? (
                  <p id={`${id}-texto-error`} className="campo__error">
                    {errores.texto}
                  </p>
                ) : null}
              </div>

              <fieldset className="capas capas--en-columna nota-coord__citas">
                <legend>{T.referencias}</legend>
                <p className="nota">{T.referenciasAyuda}</p>
                {citables === null ? <p className="nota">Cargando…</p> : null}
                {falloLoCitable ? (
                  <p className="campo__error" role="alert">
                    {T.referenciasNoSeLeyeron}{' '}
                    <button type="button" className="boton boton--enlace" onClick={() => setVueltaDeLoCitable((v) => v + 1)}>
                      {COPY.reintentar}
                      <span className="visualmente-oculto"> {T.referenciasDeQue}</span>
                    </button>
                  </p>
                ) : citables !== null && citables.length === 0 ? (
                  <p className="nota">{T.sinReferencias}</p>
                ) : null}
                {(citables ?? []).map((c) => {
                  const clave = `${c.type}|${c.id}`;
                  const marcada = citadas.includes(clave);
                  return (
                    <label key={clave} className="capa">
                      <input type="checkbox" checked={marcada} disabled={!marcada && citadas.length >= MAXIMO_DE_REFERENCIAS_DE_LA_NOTA} onChange={() => alternarCita(clave)} />
                      {c.texto}
                    </label>
                  );
                })}
              </fieldset>

              <p className="nota-coord__la-lee">
                <Icono nombre="ver" tamano={18} />
                <strong>{T.laPersonaLaLee}</strong>
              </p>
              <p className="nota">{T.sinAdjuntos}</p>
              {envio.tipo === 'error' ? (
                <Aviso tipo="error" enfocar>
                  <p>{envio.texto}</p>
                </Aviso>
              ) : null}
            </>
          ) : null}
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>
              {T.volver}
            </button>
            {carga.tipo === 'listo' ? (
              <button type="submit" className="boton boton--primario" disabled={enviando || sinDestinatarios} aria-busy={enviando}>
                {enviando ? T.enviando : envio.tipo === 'error' && envio.incierto ? COPY.reintentar : T.enviar}
              </button>
            ) : null}
          </div>
        </form>
      )}
    </dialog>
  );
}
