'use client';

/**
 * Ejecuciones (B10-06 §41): período, sesión, condición y detalle. Filtro por período.
 * - Solo lo registrado: el borrador del asesorado no es evidencia y no aparece (09v10:980).
 * - Los días sin nada registrado se muestran como «Sin registro», nunca como sesiones no realizadas: el plan no fija
 *   qué días se entrena (H-09-TRN-01; DL-088).
 * - Cada ejecución muestra lo planificado y lo ejecutado por separado, la sustitución con sus dos puntas, y las
 *   correcciones con su autor real: «Registro original / Corrección vigente / Historial» (B10-06:890-900).
 * - Sin «disciplinado», «mal rendimiento» ni porcentajes (B10-06:963-966).
 * - Filtros por período, versión del plan y ejercicio (B10-06:956-961). El período vive fuera del estado de lectura.
 * - Una carga que no se registró dice eso, «carga no registrada»: no es «sin carga» ni peso corporal (06:5675).
 */
import {
  cantidad,
  cantidadDeSeries,
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  numero,
  registroVigente,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EjecucionDeEntrenamiento,
  type RegistroDeEjecucion,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';
import { FiltroDePeriodo, type Periodo } from '../periodo';

type Contexto = ContextoDeRevisionDeEntrenamientoResponse['data'];

export function VistaDeEjecuciones() {
  const { token, asesoradoId, sesionPerdida } = useEntrenamiento();
  const [periodo, setPeriodo] = useState<Periodo>({});
  const [r, setR] = useState<Resultado<Contexto> | null>(null);
  const [version, setVersion] = useState('');
  const [ejercicio, setEjercicio] = useState('');

  const cargar = useCallback(async () => {
    setR(null);
    const cx = await api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, periodo);
    if (sesionPerdida(cx)) return;
    setR(cx.ok ? { ok: true, datos: cx.datos.data } : (cx as Resultado<never>));
  }, [token, asesoradoId, periodo, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Los ejercicios que aparecen en el período, planificados o ejecutados: el filtro no ofrece lo que no hay.
  const ejercicios = useMemo(() => {
    if (!r?.ok) return [];
    const nombres = new Set<string>();
    for (const x of r.datos.registeredExecutions) {
      for (const p of x.plannedSession.prescriptions) nombres.add(p.exerciseName);
      for (const e of registroVigente(x).exercises) nombres.add(e.performedExerciseName);
    }
    return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
  }, [r]);
  const visibles = r?.ok
    ? r.datos.registeredExecutions.filter(
        (x) =>
          (!version || x.planId === version) &&
          (!ejercicio || x.plannedSession.prescriptions.some((p) => p.exerciseName === ejercicio) || registroVigente(x).exercises.some((e) => e.performedExerciseName === ejercicio)),
      )
    : [];

  return (
    <div className="secciones">
      <FiltroDePeriodo id="trn-periodo" onAplicar={setPeriodo} />
      <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          <div className="fila-de-dato">
            <div className="campo">
              <label htmlFor="trn-filtro-version">Versión del plan</label>
              <select id="trn-filtro-version" value={version} onChange={(e) => setVersion(e.target.value)}>
                <option value="">Todas</option>
                {r.datos.activePlanVersions.map((v) => (
                  <option key={v.planId} value={v.planId}>
                    Activada el {fecha(v.activatedAt as string)}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="trn-filtro-ejercicio">Ejercicio</label>
              <select id="trn-filtro-ejercicio" value={ejercicio} onChange={(e) => setEjercicio(e.target.value)}>
                <option value="">Todos</option>
                {ejercicios.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="nota">
            Período: {dia(`${r.datos.period.start}T12:00:00Z`)} a {dia(`${r.datos.period.end}T12:00:00Z`)}
          </p>

          <section className="seccion" aria-labelledby="titulo-ejecuciones">
            <h2 id="titulo-ejecuciones">Sesiones registradas</h2>
            {r.datos.registeredExecutions.length === 0 ? <p>{COPY_ENTRENAMIENTO.sinEjecuciones}</p> : null}
            {r.datos.registeredExecutions.length > 0 && visibles.length === 0 ? <p>Ninguna sesión registrada del período coincide con el filtro.</p> : null}
            <ul className="lista">
              {visibles.map((x) => (
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
    </div>
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
                    {COPY_ENTRENAMIENTO.serie} {numero(s.setIndex)}: {s.load ? cantidad(s.load.value, s.load.unit) : 'carga no registrada'} ×{' '}
                    {s.completedRepetitions === null ? '—' : numero(s.completedRepetitions)} {COPY_ENTRENAMIENTO.reps.toLowerCase()}
                    {s.rir !== null ? ` · ${COPY_ENTRENAMIENTO.rir} ${numero(s.rir)}` : ''}
                    {s.perceivedExertion !== null ? ` · esfuerzo percibido ${numero(s.perceivedExertion)}` : ''}
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
  const rige = registroVigente(x);
  return (
    <li className="lista__item">
      <p className="lista__titulo">
        {x.plannedSession.label} · {dia(`${x.date}T12:00:00Z`)} · {etiquetaDeCondicionRegistrada(rige)}
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
