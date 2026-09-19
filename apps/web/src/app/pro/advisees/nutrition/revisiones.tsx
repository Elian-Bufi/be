'use client';

/**
 * NUT-14 Contexto, NUT-15 Registrar revisión y NUT-16 Aplicar continuidad (B05:1134-1295).
 * - Abrir esta pantalla no es revisar (RF-034; 06:5881): hace falta «Registrar revisión» con todos sus componentes.
 * - Resultados: Mantener / Ajustar / Sustituir / Reprogramar revisión / Cambiar objetivo / Finalizar (B05:1197-1204).
 *   Sin «Recomendación BE: ajustar» (B05:1162-1176): BE no sugiere un resultado.
 * - Aplicar es un paso aparte (B05:1240-1261): la revisión queda registrada aunque todavía no se aplique.
 * - «Finalizar» no es «Eliminar plan»: la historia se conserva (B05:1283-1295).
 */
import {
  COPY_NUTRICION,
  EFECTO_VISIBLE_DE_RESULTADO,
  ETIQUETA_DE_RESULTADO,
  type ContextoDeRevisionResponse,
  type EvaluacionNutricional,
  type Revision,
} from '@be/domain';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { CamposDeObjetivo, aObjetivo, erroresDeObjetivo, objetivoVacio } from './formularios';
import { EstadoDeLectura, useNutricion } from './nutricion';

type Contexto = ContextoDeRevisionResponse['data'];
type ResultadoApi = keyof typeof ETIQUETA_DE_RESULTADO;
const RESULTADOS = Object.keys(ETIQUETA_DE_RESULTADO) as ResultadoApi[];

export function VistaDeRevisiones() {
  const { token, asesoradoId, sesionPerdida, irA } = useNutricion();
  const [r, setR] = useState<Resultado<{ contexto: Contexto; evaluaciones: EvaluacionNutricional[] }> | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'info'; texto: string; alPlan?: boolean } | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const [cx, ev] = await Promise.all([api.contextoDeRevision(token, asesoradoId), api.listarEvaluaciones(token, asesoradoId)]);
    if (sesionPerdida(cx) || sesionPerdida(ev)) return;
    if (!cx.ok) return setR(cx as Resultado<never>);
    if (!ev.ok) return setR(ev as Resultado<never>);
    setR({ ok: true, datos: { contexto: cx.datos.data, evaluaciones: ev.datos.data } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          <p className="nota">{COPY_NUTRICION.verNoEsRevisar}</p>
          {aviso ? (
            <Aviso tipo={aviso.tipo} enfocar>
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
              <p>
                {COPY_NUTRICION.revisionPendiente} desde el {dia(`${r.datos.contexto.pendingReview.since}T12:00:00Z`)}.
              </p>
            </Aviso>
          ) : null}
          {r.datos.contexto.process?.state === 'ABIERTO' ? (
            <FormularioDeRevision
              contexto={r.datos.contexto}
              evaluaciones={r.datos.evaluaciones}
              onRegistrada={() => {
                setAviso({ tipo: 'exito', texto: `${COPY_NUTRICION.revisionRegistrada}. Todavía no se aplicó: aplicala desde la lista.` });
                void cargar();
              }}
            />
          ) : (
            <Aviso tipo="info">
              <p>{r.datos.contexto.process ? 'El seguimiento nutricional está cerrado. La historia se conserva.' : 'El seguimiento empieza al activar el primer plan.'}</p>
            </Aviso>
          )}
          <section className="seccion" aria-labelledby="titulo-revisiones">
            <h2 id="titulo-revisiones">Revisiones registradas</h2>
            {r.datos.contexto.previousReviews.length === 0 ? <p>Todavía no hay revisiones registradas.</p> : null}
            <ul className="lista">
              {r.datos.contexto.previousReviews.map((rev) => (
                <ItemDeRevision
                  key={rev.reviewId}
                  revision={rev}
                  onAplicada={(texto, alPlan) => {
                    setAviso({ tipo: 'exito', texto, alPlan });
                    void cargar();
                  }}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

function FormularioDeRevision({ contexto, evaluaciones, onRegistrada }: { contexto: Contexto; evaluaciones: readonly EvaluacionNutricional[]; onRegistrada: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const intento = useClaveDeIntento();
  const [abierto, setAbierto] = useState(false);
  const [evidencia, setEvidencia] = useState<Set<string>>(new Set());
  const [interpretacion, setInterpretacion] = useState('');
  const [resultado, setResultado] = useState<ResultadoApi | ''>('');
  const [fundamento, setFundamento] = useState('');
  const [accion, setAccion] = useState('');
  const [proxima, setProxima] = useState('');
  const [objetivo, setObjetivo] = useState(objetivoVacio(evaluaciones[0]?.evaluationId ?? ''));
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const candidatas = [
    ...contexto.registeredIntakes.map((i) => ({
      tipo: 'EXECUTION',
      id: i.executionId,
      texto: `${i.origin === 'PRESCRIBED' ? 'Comida del plan' : 'Comida fuera del plan'} · ${fecha(i.occurredAt)}${i.description ? ` · «${i.description}»` : ''}`,
    })),
    ...contexto.activePlanVersions.map((v) => ({ tipo: 'PLAN_VERSION', id: v.planId, texto: `Plan activado el ${fecha(v.activatedAt as string)}` })),
    ...(contexto.objective ? [{ tipo: 'OBJECTIVE_VERSION', id: contexto.objective.versionId, texto: 'Objetivo vigente' }] : []),
  ];

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas: { id: string; texto: string }[] = [];
    if (evidencia.size === 0) problemas.push({ id: 'revision-evidencia', texto: 'Elegí la evidencia que examinaste.' });
    if (!interpretacion.trim()) problemas.push({ id: 'revision-interpretacion', texto: 'Falta la interpretación.' });
    if (!resultado) problemas.push({ id: 'revision-resultado', texto: 'Elegí un resultado.' });
    if (!fundamento.trim()) problemas.push({ id: 'revision-fundamento', texto: 'Falta el fundamento.' });
    if (!accion.trim()) problemas.push({ id: 'revision-accion', texto: resultado === 'FINALIZE' ? 'Describí el cierre.' : 'Falta la próxima acción.' });
    if (resultado === 'RESCHEDULE_REVIEW' && !proxima) problemas.push({ id: 'revision-proxima', texto: 'Para reprogramar, indicá la fecha de la próxima revisión.' });
    if (resultado === 'CHANGE_OBJECTIVE') problemas.push(...erroresDeObjetivo(objetivo, 'revision-objetivo'));
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0 || !resultado) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.registrarRevision(
      token,
      asesoradoId,
      {
        period: contexto.period,
        evidenceReferences: candidatas.filter((c) => evidencia.has(c.id)).map((c) => ({ type: c.tipo as 'EXECUTION', id: c.id })),
        interpretation: interpretacion.trim(),
        result: resultado,
        rationale: fundamento.trim(),
        nextAction: {
          description: accion.trim(),
          ...(proxima && resultado !== 'FINALIZE' ? { nextReviewAt: proxima } : {}),
          ...(resultado === 'CHANGE_OBJECTIVE' ? { objective: aObjetivo(objetivo) } : {}),
        },
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    setAbierto(false);
    onRegistrada();
  }

  if (!abierto) {
    return (
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => setAbierto(true)}>
          {COPY_NUTRICION.nuevaRevision}
        </button>
      </div>
    );
  }
  return (
    <form className="formulario seccion" onSubmit={enviar} noValidate>
      <h2>{COPY_NUTRICION.nuevaRevision}</h2>
      <p>
        Período: {dia(`${contexto.period.start}T12:00:00Z`)} a {dia(`${contexto.period.end}T12:00:00Z`)}
      </p>
      <ResumenDeErrores titulo="Para registrar la revisión falta:" errores={errores} intento={envios} />
      <fieldset className="grupo" id="revision-evidencia" tabIndex={-1}>
        <legend>Evidencia que examinaste</legend>
        {candidatas.length === 0 ? <p>No hay registros en el período.</p> : null}
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
      </fieldset>
      <div className="campo">
        <label htmlFor="revision-interpretacion">Interpretación</label>
        <p className="campo__ayuda">{COPY_NUTRICION.interpretacionNoDiagnostica}</p>
        <textarea id="revision-interpretacion" rows={3} value={interpretacion} onChange={(e) => setInterpretacion(e.target.value)} maxLength={4000} />
      </div>
      <fieldset className="grupo" id="revision-resultado" tabIndex={-1}>
        <legend>Resultado</legend>
        {RESULTADOS.map((res) => (
          <label key={res} className="acto">
            <input type="radio" name="resultado" value={res} checked={resultado === res} onChange={() => setResultado(res)} /> <strong>{ETIQUETA_DE_RESULTADO[res]}</strong>
            <span className="campo__ayuda">{EFECTO_VISIBLE_DE_RESULTADO[res]}</span>
          </label>
        ))}
      </fieldset>
      <div className="campo">
        <label htmlFor="revision-fundamento">Fundamento</label>
        <textarea id="revision-fundamento" rows={3} value={fundamento} onChange={(e) => setFundamento(e.target.value)} maxLength={4000} />
      </div>
      <div className="campo">
        <label htmlFor="revision-accion">{resultado === 'FINALIZE' ? 'Cierre' : 'Próxima acción'}</label>
        <textarea id="revision-accion" rows={2} value={accion} onChange={(e) => setAccion(e.target.value)} maxLength={2000} />
      </div>
      {resultado !== 'FINALIZE' ? (
        <Campo
          id="revision-proxima"
          etiqueta={resultado === 'RESCHEDULE_REVIEW' ? 'Fecha de la próxima revisión' : 'Próxima revisión (opcional)'}
          type="date"
          value={proxima}
          onChange={(e) => setProxima(e.target.value)}
        />
      ) : null}
      {resultado === 'CHANGE_OBJECTIVE' ? (
        <fieldset className="grupo">
          <legend>Nuevo objetivo</legend>
          <CamposDeObjetivo valores={objetivo} onCambiar={setObjetivo} evaluaciones={evaluaciones} prefijo="revision-objetivo" />
        </fieldset>
      ) : null}
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Registrando…' : COPY_NUTRICION.registrarRevision}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => setAbierto(false)} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ItemDeRevision({ revision, onAplicada }: { revision: Revision; onAplicada: (texto: string, alPlan: boolean) => void }) {
  const { token, sesionPerdida } = useNutricion();
  const intento = useClaveDeIntento();
  const [aplicando, setAplicando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function aplicar() {
    setAplicando(true);
    setFallo(null);
    const r = await api.aplicarRevision(token, revision.reviewId, intento.actual());
    intento.registrar(r);
    setAplicando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'CONTINUITY_ACTION_NOT_APPLICABLE') return setFallo('No se puede aplicar ahora: revisá si ya hay un borrador del plan o si el seguimiento cambió.');
      return setFallo(mensajeDeFallo(r));
    }
    const a = r.datos.data.application;
    const texto =
      a.processStateAfter === 'CERRADO'
        ? 'Seguimiento cerrado. La historia se conserva.'
        : a.createdPlanId
          ? 'Continuidad aplicada: se preparó una nueva versión del plan en borrador. La versión activa no cambió.'
          : a.createdObjectiveVersionId
            ? 'Continuidad aplicada: se emitió una nueva versión del objetivo.'
            : COPY_NUTRICION.continuidadAplicada;
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
          <p className="nota">{EFECTO_VISIBLE_DE_RESULTADO[revision.result]}</p>
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <button type="button" className="boton boton--primario" onClick={() => void aplicar()} disabled={aplicando} aria-busy={aplicando}>
            {aplicando ? 'Aplicando…' : COPY_NUTRICION.aplicarContinuidad}
          </button>
        </>
      )}
    </li>
  );
}
