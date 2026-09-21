'use client';

/**
 * Resumen de Entrenamiento (B10-06 §2, §3, §7): estado del seguimiento, objetivo vigente, plan activo, última
 * evaluación, última sesión registrada, última revisión y próxima acción.
 * - Sin puntaje general, sin «fatiga» inferida, sin «riesgo» automático y sin progresión recomendada (B10-06:110-115).
 * - La evaluación marca la fuente de cada dato; el self-reported no se presenta como diagnóstico (B10-06:132-145).
 * - El objetivo es «Nueva versión de objetivo», nunca «Editar objetivo actual» (B10-06:253-259).
 */
import {
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_FUENTE,
  ETIQUETA_DE_RESULTADO,
  etiquetaDeCondicionRegistrada,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EvaluacionDeEntrenamiento,
  type ResumenDeVersionDePlanDeEntrenamiento,
  type VersionDeObjetivoDeEntrenamiento,
} from '@be/domain';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';

interface Datos {
  readonly evaluaciones: readonly EvaluacionDeEntrenamiento[];
  readonly objetivo: VersionDeObjetivoDeEntrenamiento | null;
  readonly historia: readonly VersionDeObjetivoDeEntrenamiento[];
  readonly planes: readonly ResumenDeVersionDePlanDeEntrenamiento[];
  readonly contexto: ContextoDeRevisionDeEntrenamientoResponse['data'];
}

export function VistaDeResumen() {
  const { token, asesoradoId, sesionPerdida, irA } = useEntrenamiento();
  const [r, setR] = useState<Resultado<Datos> | null>(null);
  const [formulario, setFormulario] = useState<'evaluacion' | 'objetivo' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const [ev, ob, hi, pl, cx] = await Promise.all([
      api.listarEvaluacionesDeEntrenamiento(token, asesoradoId),
      api.objetivoDeEntrenamientoEfectivo(token, asesoradoId),
      api.listarObjetivosDeEntrenamiento(token, asesoradoId),
      api.listarPlanesDeEntrenamiento(token, asesoradoId),
      api.contextoDeRevisionDeEntrenamiento(token, asesoradoId),
    ]);
    for (const x of [ev, ob, hi, pl, cx]) if (sesionPerdida(x)) return;
    for (const x of [ev, ob, hi, pl, cx]) if (!x.ok) return setR(x as Resultado<never>);
    if (!ev.ok || !ob.ok || !hi.ok || !pl.ok || !cx.ok) return;
    setR({ ok: true, datos: { evaluaciones: ev.datos.data, objetivo: ob.datos.data.objective, historia: hi.datos.data, planes: pl.datos.data, contexto: cx.datos.data } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          {aviso ? (
            <Aviso tipo="exito" enfocar>
              <p>{aviso}</p>
            </Aviso>
          ) : null}
          <Estado datos={r.datos} onIrA={irA} />

          <section className="seccion" aria-labelledby="titulo-objetivo">
            <h2 id="titulo-objetivo">{COPY_ENTRENAMIENTO.objetivoVigente}</h2>
            {r.datos.objetivo ? (
              <>
                <p>{r.datos.objetivo.objective.statement}</p>
                <p className="nota">
                  Fundamento: {r.datos.objetivo.rationale} · vigente desde el {fecha(r.datos.objetivo.effectiveFrom)}
                </p>
              </>
            ) : (
              <p>{COPY_ENTRENAMIENTO.sinObjetivo}</p>
            )}
            {r.datos.historia.length > 1 ? (
              <details>
                <summary>Historial del objetivo ({r.datos.historia.length} versiones)</summary>
                <ol className="historial">
                  {r.datos.historia.map((v) => (
                    <li key={v.versionId}>
                      {fecha(v.createdAt)} · {v.objective.statement} {v.isEffective ? <span className="insignia">vigente</span> : null}
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
            {formulario === 'objetivo' ? (
              <FormularioDeObjetivo
                evaluaciones={r.datos.evaluaciones}
                onEmitido={() => {
                  setFormulario(null);
                  setAviso('Nueva versión del objetivo emitida. La anterior se conserva en el historial.');
                  void cargar();
                }}
                onCancelar={() => setFormulario(null)}
              />
            ) : (
              <div className="acciones">
                <button type="button" className="boton boton--secundario" onClick={() => setFormulario('objetivo')} disabled={r.datos.evaluaciones.length === 0}>
                  {COPY_ENTRENAMIENTO.nuevaVersionDeObjetivo}
                </button>
              </div>
            )}
            {r.datos.evaluaciones.length === 0 ? <p className="nota">El objetivo se funda en una evaluación: registrá una primero.</p> : null}
          </section>

          <section className="seccion" aria-labelledby="titulo-evaluacion">
            <h2 id="titulo-evaluacion">Evaluaciones</h2>
            {r.datos.evaluaciones.length === 0 ? <p>{COPY_ENTRENAMIENTO.sinEvaluacion}</p> : null}
            <ul className="lista">
              {r.datos.evaluaciones.map((e) => (
                <li key={e.evaluationId} className="lista__item">
                  <p className="lista__titulo">Evaluación del {fecha(e.occurredAt)}</p>
                  <dl className="datos">
                    {e.assessment.entries.map((d, i) => (
                      <div key={i}>
                        <dt>{d.concept}</dt>
                        <dd>
                          {String(d.value)}
                          {d.unit ? ` ${d.unit}` : ''} <span className="nota">· {ETIQUETA_DE_FUENTE[d.source]}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {e.professionalNotes ? <p className="nota">{e.professionalNotes}</p> : null}
                </li>
              ))}
            </ul>
            {formulario === 'evaluacion' ? (
              <FormularioDeEvaluacion
                onRegistrada={() => {
                  setFormulario(null);
                  setAviso('Evaluación registrada.');
                  void cargar();
                }}
                onCancelar={() => setFormulario(null)}
              />
            ) : (
              <div className="acciones">
                <button type="button" className="boton boton--secundario" onClick={() => setFormulario('evaluacion')}>
                  {COPY_ENTRENAMIENTO.nuevaEvaluacion}
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

/** Estado del seguimiento, plan activo, última sesión registrada, última revisión y próxima acción. */
function Estado({ datos, onIrA }: { datos: Datos; onIrA: (v: 'plan' | 'ejecuciones' | 'revisiones') => void }) {
  const activo = datos.planes.find((p) => p.isEffective) ?? null;
  const ultima = [...datos.contexto.registeredExecutions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
  const revision = datos.contexto.previousReviews[0] ?? null;
  const proceso = datos.contexto.process;
  return (
    <section className="seccion" aria-labelledby="titulo-estado">
      <h2 id="titulo-estado">Estado del seguimiento</h2>
      <dl className="datos">
        <div>
          <dt>Seguimiento</dt>
          <dd>{proceso ? (proceso.state === 'ABIERTO' ? 'Abierto' : 'Cerrado') : 'Empieza al activar el primer plan'}</dd>
        </div>
        <div>
          <dt>Plan activo</dt>
          <dd>
            {activo ? `Activado el ${fecha(activo.activatedAt as string)}` : COPY_ENTRENAMIENTO.sinPlanActivo}{' '}
            <button type="button" className="boton boton--enlace" onClick={() => onIrA('plan')}>
              Ver plan
            </button>
          </dd>
        </div>
        <div>
          <dt>Última sesión registrada (últimos 7 días)</dt>
          <dd>
            {ultima ? `${ultima.plannedSession.label} · ${dia(`${ultima.date}T12:00:00Z`)} · ${etiquetaDeCondicionRegistrada(ultima.original)}` : COPY_ENTRENAMIENTO.sinEjecuciones}{' '}
            <button type="button" className="boton boton--enlace" onClick={() => onIrA('ejecuciones')}>
              Ver ejecuciones
            </button>
          </dd>
        </div>
        <div>
          <dt>Última revisión</dt>
          <dd>
            {revision ? `${ETIQUETA_DE_RESULTADO[revision.result]} · ${fecha(revision.recordedAt)} · Próxima acción: ${revision.nextAction.description}` : 'Todavía no hay revisiones.'}{' '}
            <button type="button" className="boton boton--enlace" onClick={() => onIrA('revisiones')}>
              Ver revisiones
            </button>
          </dd>
        </div>
      </dl>
      {datos.contexto.pendingReview.pending ? (
        <Aviso tipo="info">
          <p>Revisión pendiente desde el {dia(`${datos.contexto.pendingReview.since}T12:00:00Z`)}.</p>
        </Aviso>
      ) : null}
    </section>
  );
}

type Fuente = 'REPORTED' | 'OBSERVED' | 'CALCULATED';
interface Dato {
  concepto: string;
  valor: string;
  unidad: string;
  fuente: Fuente;
  metodo: string;
}
const datoVacio = (): Dato => ({ concepto: '', valor: '', unidad: '', fuente: 'REPORTED', metodo: '' });
const ahoraLocal = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/** Evaluación: datos previos con su fuente (B10-06 §3). Un dato calculado declara su método: BE no calcula. */
function FormularioDeEvaluacion({ onRegistrada, onCancelar }: { onRegistrada: () => void; onCancelar: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [datos, setDatos] = useState<Dato[]>([datoVacio()]);
  const [notas, setNotas] = useState('');
  const [ocurrencia, setOcurrencia] = useState(ahoraLocal());
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const cambiar = (i: number, cambio: Partial<Dato>) => setDatos((ds) => ds.map((d, j) => (j === i ? { ...d, ...cambio } : d)));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas: { id: string; texto: string }[] = [];
    datos.forEach((d, i) => {
      if (!d.concepto.trim()) problemas.push({ id: `trn-dato-${i}-concepto`, texto: `Dato ${i + 1}: falta el concepto.` });
      if (!d.valor.trim()) problemas.push({ id: `trn-dato-${i}-valor`, texto: `Dato ${i + 1}: falta el valor.` });
      if (d.fuente === 'CALCULATED' && !d.metodo.trim()) problemas.push({ id: `trn-dato-${i}-metodo`, texto: `Dato ${i + 1}: un dato calculado declara su método.` });
    });
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.crearEvaluacionDeEntrenamiento(
      token,
      asesoradoId,
      {
        occurredAt: new Date(ocurrencia).toISOString(),
        assessment: {
          entries: datos.map((d) => ({
            concept: d.concepto.trim(),
            value: /^-?\d+(\.\d+)?$/.test(d.valor.trim()) ? Number(d.valor.trim()) : d.valor.trim(),
            unit: d.unidad.trim() || null,
            source: d.fuente,
            methodStatement: d.fuente === 'CALCULATED' ? d.metodo.trim() : null,
          })),
        },
        evidenceReferences: [],
        professionalNotes: notas.trim() || null,
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onRegistrada();
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h3>{COPY_ENTRENAMIENTO.nuevaEvaluacion}</h3>
      <ResumenDeErrores titulo="Revisá estos datos:" errores={errores} intento={envios} />
      <Campo id="trn-evaluacion-ocurrencia" etiqueta="Fecha y hora de la evaluación" type="datetime-local" value={ocurrencia} onChange={(e) => setOcurrencia(e.target.value)} required />
      <fieldset className="grupo">
        <legend>Datos de la evaluación</legend>
        <p className="campo__ayuda">Cada dato indica de dónde sale: lo informado por el asesorado no es un diagnóstico.</p>
        {datos.map((d, i) => (
          <div key={i} className="fila-de-dato">
            <Campo id={`trn-dato-${i}-concepto`} etiqueta="Concepto" value={d.concepto} onChange={(e) => cambiar(i, { concepto: e.target.value })} maxLength={120} />
            <Campo id={`trn-dato-${i}-valor`} etiqueta="Valor" value={d.valor} onChange={(e) => cambiar(i, { valor: e.target.value })} maxLength={500} />
            <Campo id={`trn-dato-${i}-unidad`} etiqueta="Unidad (opcional)" value={d.unidad} onChange={(e) => cambiar(i, { unidad: e.target.value })} maxLength={30} />
            <div className="campo">
              <label htmlFor={`trn-dato-${i}-fuente`}>Fuente</label>
              <select id={`trn-dato-${i}-fuente`} value={d.fuente} onChange={(e) => cambiar(i, { fuente: e.target.value as Fuente })}>
                {(Object.keys(ETIQUETA_DE_FUENTE) as Fuente[]).map((f) => (
                  <option key={f} value={f}>
                    {ETIQUETA_DE_FUENTE[f]}
                  </option>
                ))}
              </select>
            </div>
            {d.fuente === 'CALCULATED' ? <Campo id={`trn-dato-${i}-metodo`} etiqueta="Método declarado" value={d.metodo} onChange={(e) => cambiar(i, { metodo: e.target.value })} maxLength={500} /> : null}
            {datos.length > 1 ? (
              <button type="button" className="boton boton--enlace" onClick={() => setDatos((ds) => ds.filter((_, j) => j !== i))}>
                Quitar dato {i + 1}
              </button>
            ) : null}
          </div>
        ))}
        <button type="button" className="boton boton--secundario" onClick={() => setDatos((ds) => [...ds, datoVacio()])}>
          Agregar dato
        </button>
      </fieldset>
      <div className="campo">
        <label htmlFor="trn-evaluacion-notas">Notas del profesional (opcional)</label>
        <textarea id="trn-evaluacion-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={4000} />
      </div>
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Registrando…' : 'Registrar evaluación'}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Objetivo: un enunciado con fundamento, fundado en una evaluación. El 09 no fija su contenido (09v10:228). */
function FormularioDeObjetivo({ evaluaciones, onEmitido, onCancelar }: { evaluaciones: readonly EvaluacionDeEntrenamiento[]; onEmitido: () => void; onCancelar: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [evaluacion, setEvaluacion] = useState(evaluaciones[0]?.evaluationId ?? '');
  const [enunciado, setEnunciado] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [desde, setDesde] = useState(ahoraLocal());
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas: { id: string; texto: string }[] = [];
    if (!enunciado.trim()) problemas.push({ id: 'trn-objetivo-enunciado', texto: 'Falta el objetivo.' });
    if (!fundamento.trim()) problemas.push({ id: 'trn-objetivo-fundamento', texto: 'Falta el fundamento.' });
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.crearObjetivoDeEntrenamiento(
      token,
      asesoradoId,
      { evaluationId: evaluacion, effectiveFrom: new Date(desde).toISOString(), effectiveUntil: null, objective: { statement: enunciado.trim() }, rationale: fundamento.trim() },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onEmitido();
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h3>{COPY_ENTRENAMIENTO.nuevaVersionDeObjetivo}</h3>
      <ResumenDeErrores titulo="Para emitir el objetivo falta:" errores={errores} intento={envios} />
      <div className="campo">
        <label htmlFor="trn-objetivo-evaluacion">Evaluación de referencia</label>
        <select id="trn-objetivo-evaluacion" value={evaluacion} onChange={(e) => setEvaluacion(e.target.value)}>
          {evaluaciones.map((ev) => (
            <option key={ev.evaluationId} value={ev.evaluationId}>
              Evaluación del {fecha(ev.occurredAt)}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="trn-objetivo-enunciado">Objetivo</label>
        <textarea id="trn-objetivo-enunciado" rows={2} value={enunciado} onChange={(e) => setEnunciado(e.target.value)} maxLength={2000} />
      </div>
      <div className="campo">
        <label htmlFor="trn-objetivo-fundamento">Fundamento</label>
        <textarea id="trn-objetivo-fundamento" rows={3} value={fundamento} onChange={(e) => setFundamento(e.target.value)} maxLength={4000} />
      </div>
      <Campo id="trn-objetivo-desde" etiqueta="Vigente desde" type="datetime-local" value={desde} onChange={(e) => setDesde(e.target.value)} />
      <p className="nota">La versión anterior no se edita: queda en el historial.</p>
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Emitiendo…' : 'Emitir nueva versión'}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
