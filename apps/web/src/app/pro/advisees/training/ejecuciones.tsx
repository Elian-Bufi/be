'use client';

/**
 * Ejecuciones (B10-06 §41): período, sesión, condición y detalle. Filtro por período.
 * - Solo lo registrado: el borrador del asesorado no es evidencia y no aparece (09v10:980).
 * - Los días sin nada registrado se muestran como «Sin registro», nunca como sesiones no realizadas: el plan no fija
 *   qué días se entrena (H-09-TRN-01; DL-088).
 * - Cada ejecución muestra lo planificado y lo ejecutado por separado, la sustitución con sus dos puntas, y las
 *   correcciones con su autor real: «Registro original / Corrección vigente / Historial» (B10-06:890-900).
 * - Sin «disciplinado», «mal rendimiento» ni porcentajes (B10-06:963-966).
 */
import {
  cantidadDeSeries,
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EjecucionDeEntrenamiento,
  type RegistroDeEjecucion,
} from '@be/domain';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';

type Contexto = ContextoDeRevisionDeEntrenamientoResponse['data'];

export function VistaDeEjecuciones() {
  const { token, asesoradoId, sesionPerdida } = useEntrenamiento();
  const [periodo, setPeriodo] = useState<{ periodStart?: string; periodEnd?: string }>({});
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [r, setR] = useState<Resultado<Contexto> | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const cx = await api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, periodo);
    if (sesionPerdida(cx)) return;
    setR(cx.ok ? { ok: true, datos: cx.datos.data } : (cx as Resultado<never>));
  }, [token, asesoradoId, periodo, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function filtrar(e: FormEvent) {
    e.preventDefault();
    setPeriodo({ ...(desde ? { periodStart: desde } : {}), ...(hasta ? { periodEnd: hasta } : {}) });
  }

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          <form className="fila-de-dato" onSubmit={filtrar}>
            <Campo id="trn-periodo-desde" etiqueta="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <Campo id="trn-periodo-hasta" etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            <button type="submit" className="boton boton--secundario">
              Ver período
            </button>
          </form>
          <p className="nota">
            Período: {dia(`${r.datos.period.start}T12:00:00Z`)} a {dia(`${r.datos.period.end}T12:00:00Z`)}
          </p>

          <section className="seccion" aria-labelledby="titulo-ejecuciones">
            <h2 id="titulo-ejecuciones">Sesiones registradas</h2>
            {r.datos.registeredExecutions.length === 0 ? <p>{COPY_ENTRENAMIENTO.sinEjecuciones}</p> : null}
            <ul className="lista">
              {r.datos.registeredExecutions.map((x) => (
                <DetalleDeEjecucion key={x.executionId} ejecucion={x} />
              ))}
            </ul>
          </section>

          <section className="seccion" aria-labelledby="titulo-sin-registro">
            <h2 id="titulo-sin-registro">{COPY_ENTRENAMIENTO.diasSinRegistro}</h2>
            <p className="nota">Días del período sin ninguna sesión registrada. Sin registro no quiere decir que no haya entrenado: no hay dato.</p>
            {r.datos.missingData.length === 0 ? <p>Ninguno.</p> : <p>{r.datos.missingData.map((f) => dia(`${f}T12:00:00Z`)).join(' · ')}</p>}
          </section>
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

/** Lo registrado de una sesión, ejercicio por ejercicio, sin reinterpretar un registro agregado como series. */
export function Registro({ registro }: { registro: RegistroDeEjecucion }) {
  return (
    <>
      <p className="nota">
        {COPY_ENTRENAMIENTO.condicionDeLaSesion}: {etiquetaDeCondicionRegistrada(registro)}
        {registro.granularity ? ` · ${ETIQUETA_DE_GRANULARIDAD[registro.granularity]}` : ''}
        {registro.reason ? ` · Motivo: ${registro.reason}` : ''}
      </p>
      <ul>
        {registro.exercises.map((e) => (
          <li key={e.prescriptionId}>
            {e.substituted ? (
              <>
                {COPY_ENTRENAMIENTO.planificado}: {e.prescribedExerciseName} · {COPY_ENTRENAMIENTO.ejecutado}: {e.performedExerciseName}{' '}
                <span className="insignia">{COPY_ENTRENAMIENTO.sustituido}</span>
              </>
            ) : (
              <strong>{e.performedExerciseName}</strong>
            )}
            {e.sets ? (
              <ol>
                {e.sets.map((s) => (
                  <li key={s.setIndex}>
                    {COPY_ENTRENAMIENTO.serie} {s.setIndex}: {s.load ? `${s.load.value} ${s.load.unit}` : 'sin carga'} × {s.completedRepetitions ?? '—'} {COPY_ENTRENAMIENTO.reps.toLowerCase()}
                    {s.rir !== null ? ` · ${COPY_ENTRENAMIENTO.rir} ${s.rir}` : ''}
                    {s.perceivedExertion !== null ? ` · esfuerzo percibido ${s.perceivedExertion}` : ''}
                  </li>
                ))}
              </ol>
            ) : null}
            {e.executionSummary ? <p>{e.executionSummary.description}</p> : null}
          </li>
        ))}
      </ul>
      {registro.sessionSummary ? <p>{registro.sessionSummary.description}</p> : null}
    </>
  );
}

function DetalleDeEjecucion({ ejecucion: x }: { ejecucion: EjecucionDeEntrenamiento }) {
  const vigente = x.effectiveView.kind === 'CORRECTED' ? x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId) : null;
  return (
    <li className="lista__item">
      <p className="lista__titulo">
        {x.plannedSession.label} · {dia(`${x.date}T12:00:00Z`)} · {etiquetaDeCondicionRegistrada(vigente ? vigente.correction : x.original)}
      </p>
      <details>
        <summary>Ver detalle</summary>
        <h4>{COPY_ENTRENAMIENTO.planificado}</h4>
        <ul>
          {x.plannedSession.prescriptions.map((p) => (
            <li key={p.prescriptionId}>
              {p.exerciseName} · {cantidadDeSeries(p.sets.length)}
            </li>
          ))}
        </ul>
        {vigente ? (
          <>
            <h4>{COPY_ENTRENAMIENTO.correccionVigente}</h4>
            <p className="nota">
              {vigente.authorRole === 'PROFESSIONAL' ? COPY_ENTRENAMIENTO.corregidoPorElProfesional : 'Corregido por el asesorado'} · {fecha(vigente.recordedAt)} · Motivo: {vigente.reason}
            </p>
            <Registro registro={vigente.correction} />
          </>
        ) : null}
        <h4>{COPY_ENTRENAMIENTO.registroOriginal}</h4>
        <p className="nota">Registrado el {fecha(x.recordedAt)}</p>
        <Registro registro={x.original} />
        {x.corrections.length > 1 ? (
          <>
            <h4>{COPY_ENTRENAMIENTO.historialDeCorrecciones}</h4>
            <ol className="historial">
              {x.corrections.map((c) => (
                <li key={c.correctionId}>
                  {fecha(c.recordedAt)} · {c.author.displayName} · {c.reason}
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </details>
    </li>
  );
}
