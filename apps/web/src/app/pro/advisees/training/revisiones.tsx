'use client';

/**
 * Revisiones de entrenamiento (B10-06 §42-§47).
 * - Ver el contexto no es revisar: hace falta «Registrar revisión» con todos sus componentes.
 * - Seis resultados, ninguno más: no hay un séptimo «Progresar». Una progresión se registra como «Ajustar» o
 *   «Sustituir» según su efecto sobre el plan, y la decide el profesional (B10-06:1053-1073; REG-06-117).
 * - El contexto no muestra volumen, marcas, mapa ni puntaje: esas proyecciones no existen en P0 (09v10 §40).
 * - Aplicar es un paso aparte: la revisión queda registrada aunque todavía no se aplique (B10-06:1077-1093).
 * - El período se elige (B10-06:1027-1036): al cerrar un bloque de cuatro semanas, la evidencia es de cuatro semanas.
 */
import {
  COPY_ENTRENAMIENTO,
  EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO,
  ETIQUETA_DE_RESULTADO,
  etiquetaDeCondicionRegistrada,
  registroVigente,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EvaluacionDeEntrenamiento,
  type RevisionDeEntrenamiento,
} from '@be/domain';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';
import { FiltroDePeriodo, type Periodo } from '../periodo';

type Contexto = ContextoDeRevisionDeEntrenamientoResponse['data'];
type ResultadoApi = keyof typeof ETIQUETA_DE_RESULTADO;
const RESULTADOS = Object.keys(ETIQUETA_DE_RESULTADO) as ResultadoApi[];

export function VistaDeRevisiones() {
  const { token, asesoradoId, sesionPerdida, irA } = useEntrenamiento();
  const [r, setR] = useState<Resultado<{ contexto: Contexto; evaluaciones: EvaluacionDeEntrenamiento[] }> | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; alPlan?: boolean } | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>({});

  const cargar = useCallback(async () => {
    setR(null);
    const [cx, ev] = await Promise.all([api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, periodo), api.listarEvaluacionesDeEntrenamiento(token, asesoradoId)]);
    if (sesionPerdida(cx) || sesionPerdida(ev)) return;
    if (!cx.ok) return setR(cx as Resultado<never>);
    if (!ev.ok) return setR(ev as Resultado<never>);
    setR({ ok: true, datos: { contexto: cx.datos.data, evaluaciones: ev.datos.data } });
  }, [token, asesoradoId, periodo, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="secciones">
    <FiltroDePeriodo id="trn-revision-periodo" onAplicar={setPeriodo} />
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          <p className="nota">{COPY_ENTRENAMIENTO.contextoNoEsRevision}</p>
          {aviso ? (
            <Aviso tipo="exito" enfocar>
              <p>{aviso.texto}</p>
              {aviso.alPlan ? (
                <p>
                  <button type="button" className="boton boton--enlace" onClick={() => irA('plan')}>
                    Abrir el borrador en Plan
                  </button>
                </p>
              ) : null}
            </Aviso>
          ) : null}
          {r.datos.contexto.pendingReview.pending ? (
            <Aviso tipo="info">
              <p>Revisión pendiente desde el {dia(`${r.datos.contexto.pendingReview.since}T12:00:00Z`)}.</p>
            </Aviso>
          ) : null}
          {r.datos.contexto.process?.state === 'ABIERTO' ? (
            <FormularioDeRevision
              contexto={r.datos.contexto}
              evaluaciones={r.datos.evaluaciones}
              onRegistrada={() => {
                setAviso({ texto: 'Revisión registrada. Todavía no se aplicó: aplicala desde la lista.' });
                void cargar();
              }}
            />
          ) : (
            <Aviso tipo="info">
              <p>{r.datos.contexto.process ? 'El seguimiento de entrenamiento está cerrado. La historia se conserva.' : 'El seguimiento empieza al activar el primer plan.'}</p>
            </Aviso>
          )}
          <section className="seccion" aria-labelledby="titulo-revisiones-trn">
            <h2 id="titulo-revisiones-trn">Revisiones registradas</h2>
            {r.datos.contexto.previousReviews.length === 0 ? <p>Todavía no hay revisiones registradas.</p> : null}
            <ul className="lista">
              {r.datos.contexto.previousReviews.map((rev) => (
                <ItemDeRevision
                  key={rev.reviewId}
                  revision={rev}
                  onAplicada={(texto, alPlan) => {
                    setAviso({ texto, alPlan });
                    void cargar();
                  }}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </EstadoDeLectura>
    </div>
  );
}

function FormularioDeRevision({ contexto, evaluaciones, onRegistrada }: { contexto: Contexto; evaluaciones: readonly EvaluacionDeEntrenamiento[]; onRegistrada: () => void }) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [abierto, setAbierto] = useState(false);
  const [evidencia, setEvidencia] = useState<Set<string>>(new Set());
  const [interpretacion, setInterpretacion] = useState('');
  const [resultado, setResultado] = useState<ResultadoApi | ''>('');
  const [fundamento, setFundamento] = useState('');
  const [accion, setAccion] = useState('');
  const [proxima, setProxima] = useState('');
  const [nuevoObjetivo, setNuevoObjetivo] = useState('');
  const [fundamentoDelObjetivo, setFundamentoDelObjetivo] = useState('');
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const candidatas = [
    ...contexto.registeredExecutions.map((x) => ({
      tipo: 'EXECUTION' as const,
      id: x.executionId,
      texto: `${x.plannedSession.label} · ${dia(`${x.date}T12:00:00Z`)} · ${etiquetaDeCondicionRegistrada(registroVigente(x))}`,
    })),
    ...contexto.activePlanVersions.map((v) => ({ tipo: 'PLAN_VERSION' as const, id: v.planId, texto: `Plan activado el ${fecha(v.activatedAt as string)}` })),
    ...(contexto.objective ? [{ tipo: 'OBJECTIVE_VERSION' as const, id: contexto.objective.versionId, texto: 'Objetivo vigente' }] : []),
  ];

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas: { id: string; texto: string }[] = [];
    if (evidencia.size === 0) problemas.push({ id: 'trn-revision-evidencia', texto: 'Elegí la evidencia que examinaste.' });
    if (!interpretacion.trim()) problemas.push({ id: 'trn-revision-interpretacion', texto: 'Falta la interpretación.' });
    if (!resultado) problemas.push({ id: 'trn-revision-resultado', texto: 'Elegí un resultado.' });
    if (!fundamento.trim()) problemas.push({ id: 'trn-revision-fundamento', texto: 'Falta el fundamento.' });
    if (!accion.trim()) problemas.push({ id: 'trn-revision-accion', texto: resultado === 'FINALIZE' ? 'Describí el cierre.' : 'Falta la próxima acción.' });
    if (resultado === 'RESCHEDULE_REVIEW' && !proxima) problemas.push({ id: 'trn-revision-proxima', texto: 'Para reprogramar, indicá la fecha de la próxima revisión.' });
    if (resultado === 'CHANGE_OBJECTIVE' && (!nuevoObjetivo.trim() || !fundamentoDelObjetivo.trim() || !evaluaciones[0])) {
      problemas.push({ id: 'trn-revision-objetivo', texto: 'Para cambiar el objetivo, escribí el nuevo y su fundamento (hace falta una evaluación).' });
    }
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0 || !resultado) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.registrarRevisionDeEntrenamiento(
      token,
      asesoradoId,
      {
        period: contexto.period,
        evidenceReferences: candidatas.filter((c) => evidencia.has(c.id)).map((c) => ({ type: c.tipo, id: c.id })),
        interpretation: interpretacion.trim(),
        result: resultado,
        rationale: fundamento.trim(),
        nextAction: {
          description: accion.trim(),
          ...(proxima && resultado !== 'FINALIZE' ? { nextReviewAt: proxima } : {}),
          ...(resultado === 'CHANGE_OBJECTIVE' && evaluaciones[0]
            ? {
                objective: {
                  evaluationId: evaluaciones[0].evaluationId,
                  effectiveFrom: new Date().toISOString(),
                  effectiveUntil: null,
                  objective: { statement: nuevoObjetivo.trim() },
                  rationale: fundamentoDelObjetivo.trim(),
                },
              }
            : {}),
        },
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    setAbierto(false);
    onRegistrada();
  }

  if (!abierto) {
    return (
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => setAbierto(true)}>
          {COPY_ENTRENAMIENTO.registrarRevision}
        </button>
      </div>
    );
  }
  return (
    <form className="formulario seccion" onSubmit={enviar} noValidate>
      <h2>{COPY_ENTRENAMIENTO.registrarRevision}</h2>
      <p>
        Período: {dia(`${contexto.period.start}T12:00:00Z`)} a {dia(`${contexto.period.end}T12:00:00Z`)}
      </p>
      <ResumenDeErrores titulo="Para registrar la revisión falta:" errores={errores} intento={envios} />
      <fieldset className="grupo" id="trn-revision-evidencia" tabIndex={-1}>
        <legend>Evidencia que examinaste</legend>
        {candidatas.length === 0 ? <p>No hay sesiones registradas en el período.</p> : null}
        {candidatas.map((c) => (
          <label key={c.id} className="acto">
            <input
              type="checkbox"
              checked={evidencia.has(c.id)}
              onChange={(e) =>
                setEvidencia((s) => {
                  const n = new Set(s);
                  if (e.target.checked) n.add(c.id);
                  else n.delete(c.id);
                  return n;
                })
              }
            />{' '}
            {c.texto}
          </label>
        ))}
        {contexto.missingData.length > 0 ? <p className="nota">Días sin registro en el período: {contexto.missingData.length}. No hay dato de esos días.</p> : null}
      </fieldset>
      <div className="campo">
        <label htmlFor="trn-revision-interpretacion">Interpretación</label>
        <textarea id="trn-revision-interpretacion" rows={3} value={interpretacion} onChange={(e) => setInterpretacion(e.target.value)} maxLength={4000} />
      </div>
      <fieldset className="grupo" id="trn-revision-resultado" tabIndex={-1}>
        <legend>Resultado</legend>
        <p className="campo__ayuda">{COPY_ENTRENAMIENTO.progresionComoAjuste}</p>
        {RESULTADOS.map((res) => (
          <label key={res} className="acto">
            <input type="radio" name="trn-resultado" value={res} checked={resultado === res} onChange={() => setResultado(res)} /> <strong>{ETIQUETA_DE_RESULTADO[res]}</strong>
            <span className="campo__ayuda">{EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO[res]}</span>
          </label>
        ))}
      </fieldset>
      <div className="campo">
        <label htmlFor="trn-revision-fundamento">Fundamento</label>
        <textarea id="trn-revision-fundamento" rows={3} value={fundamento} onChange={(e) => setFundamento(e.target.value)} maxLength={4000} />
      </div>
      <div className="campo">
        <label htmlFor="trn-revision-accion">{resultado === 'FINALIZE' ? 'Cierre' : 'Próxima acción'}</label>
        <textarea id="trn-revision-accion" rows={2} value={accion} onChange={(e) => setAccion(e.target.value)} maxLength={2000} />
      </div>
      {resultado !== 'FINALIZE' ? (
        <Campo
          id="trn-revision-proxima"
          etiqueta={resultado === 'RESCHEDULE_REVIEW' ? 'Fecha de la próxima revisión' : 'Próxima revisión (opcional)'}
          type="date"
          value={proxima}
          onChange={(e) => setProxima(e.target.value)}
        />
      ) : null}
      {resultado === 'CHANGE_OBJECTIVE' ? (
        <fieldset className="grupo" id="trn-revision-objetivo" tabIndex={-1}>
          <legend>Nuevo objetivo</legend>
          <div className="campo">
            <label htmlFor="trn-revision-objetivo-enunciado">Objetivo</label>
            <textarea id="trn-revision-objetivo-enunciado" rows={2} value={nuevoObjetivo} onChange={(e) => setNuevoObjetivo(e.target.value)} maxLength={2000} />
          </div>
          <div className="campo">
            <label htmlFor="trn-revision-objetivo-fundamento">Fundamento del objetivo</label>
            <textarea id="trn-revision-objetivo-fundamento" rows={2} value={fundamentoDelObjetivo} onChange={(e) => setFundamentoDelObjetivo(e.target.value)} maxLength={4000} />
          </div>
        </fieldset>
      ) : null}
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Registrando…' : COPY_ENTRENAMIENTO.registrarRevision}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => setAbierto(false)} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ItemDeRevision({ revision, onAplicada }: { revision: RevisionDeEntrenamiento; onAplicada: (texto: string, alPlan: boolean) => void }) {
  const { token, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [aplicando, setAplicando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function aplicar() {
    setAplicando(true);
    setFallo(null);
    const r = await api.aplicarRevisionDeEntrenamiento(token, revision.reviewId, intento.actual());
    intento.registrar(r);
    setAplicando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'CONTINUITY_ACTION_NOT_APPLICABLE') return setFallo('No se puede aplicar ahora: revisá si ya hay un borrador del plan o si el seguimiento cambió.');
      return setFallo(mensajeDeFallo(r));
    }
    const a = r.datos.data.application;
    const texto =
      a.processStateAfter === 'CERRADO'
        ? 'Seguimiento cerrado. La historia se conserva.'
        : a.createdPlanId
          ? 'Próxima acción aplicada: se preparó una nueva versión del plan en borrador. La versión activa no cambió.'
          : a.createdObjectiveVersionId
            ? 'Próxima acción aplicada: se emitió una nueva versión del objetivo.'
            : 'Próxima acción aplicada.';
    onAplicada(texto, Boolean(a.createdPlanId));
  }

  return (
    <li className="lista__item">
      <p className="lista__titulo">
        {ETIQUETA_DE_RESULTADO[revision.result]} · {fecha(revision.recordedAt)}
      </p>
      <p>{revision.interpretation}</p>
      <p className="nota">
        Fundamento: {revision.rationale} · {revision.result === 'FINALIZE' ? 'Cierre' : 'Próxima acción'}: {revision.nextAction.description}
      </p>
      {revision.application ? (
        <p>
          <span className="insignia insignia--si">Aplicada</span> {fecha(revision.application.appliedAt)}
        </p>
      ) : (
        <>
          <p className="nota">{EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO[revision.result]}</p>
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <button type="button" className="boton boton--primario" onClick={() => void aplicar()} disabled={aplicando} aria-busy={aplicando}>
            {aplicando ? 'Aplicando…' : COPY_ENTRENAMIENTO.aplicarProximaAccion}
          </button>
        </>
      )}
    </li>
  );
}
