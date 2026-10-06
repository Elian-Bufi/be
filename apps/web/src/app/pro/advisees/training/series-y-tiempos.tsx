'use client';

/**
 * Una sesión registrada, serie por serie, frente a su plan histórico, con los tiempos que se marcaron (DL-122, DL-124).
 * - El objetivo de cada serie es el de la versión del plan que rigió esa sesión (API-SER-01 de esa versión), nunca el de
 *   hoy: editar el plan después no reescribe lo registrado.
 * - La relación es descriptiva: dentro del rango, por debajo, por encima, igual. No es un puntaje ni un cumplimiento.
 * - Cada tiempo dice su certeza: medido, estimado, incompleto o no informado (API-TIE-03). Sin un par de inicio y fin, la
 *   duración de una serie es desconocida aunque la serie tenga datos.
 */
import {
  COPY_ENTRENAMIENTO_POR_SERIE,
  ETIQUETA_DE_CALIDAD_DE_TIEMPO,
  ETIQUETA_DE_RELACION,
  EXPLICACION_DE_CALIDAD,
  cantidad,
  duracionParaMostrar,
  numero,
  registroVigente,
  relacionDeCarga,
  relacionDeRepeticiones,
  relacionDeRir,
  textoDeDescanso,
  textoDeDuracion,
  textoDelPlanDeLaSerie,
  type CalidadDeTiempoApi,
  type EjecucionDeEntrenamiento,
  type ObjetivoDeSerie,
  type PlanConObjetivos,
  type RelacionConElObjetivo,
  type SerieEjecutadaApi,
  type TiemposDeSesion,
} from '@be/domain';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cargando } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { useEntrenamiento } from './entrenamiento';

type Tiempos = { tipo: 'cargando' } | { tipo: 'fallo' } | { tipo: 'listo'; datos: TiemposDeSesion };

/** La sesión de esta ejecución en la versión que rigió, con los objetivos de cada serie. */
function sesionDelPlan(plan: PlanConObjetivos | null, sessionId: string) {
  return plan?.blocks.flatMap((b) => [...b.sessions, ...b.microcycles.flatMap((m) => m.sessions)]).find((s) => s.sessionId === sessionId) ?? null;
}

/** «16 kg · 14 rep. · RIR 3», con lo que no se registró dicho como tal. */
function textoRegistrado(s: SerieEjecutadaApi): string {
  return [s.load ? cantidad(s.load.value, s.load.unit) : 'carga no registrada', s.completedRepetitions === null ? 'repeticiones no registradas' : `${numero(s.completedRepetitions)} rep.`, s.rir === null ? null : `RIR ${numero(s.rir)}`]
    .filter(Boolean)
    .join(' · ');
}

/** «Rep.: dentro del rango · RIR: igual»: solo lo que tiene objetivo. */
function textoDeRelacion(objetivo: ObjetivoDeSerie | null, s: SerieEjecutadaApi): string {
  if (!objetivo) return '—';
  const partes: [string, RelacionConElObjetivo][] = [
    ['Rep.', relacionDeRepeticiones(objetivo.repetitions, s.completedRepetitions)],
    ['RIR', relacionDeRir(objetivo.rir, s.rir)],
    ['Carga', relacionDeCarga(objetivo.suggestedLoad, s.load)],
  ];
  const texto = partes.flatMap(([etiqueta, r]) => (ETIQUETA_DE_RELACION[r] ? [`${etiqueta}: ${ETIQUETA_DE_RELACION[r]}`] : []));
  return texto.length > 0 ? texto.join(' · ') : '—';
}

/** La duración de una serie cronometrada: «Duración medida 00:40», «00:40 · estimado» o «Duración desconocida». */
function textoDeLaSerie(d: { ms: number | null; quality: CalidadDeTiempoApi } | null): string {
  if (!d || d.ms === null) return d?.quality === 'INCOMPLETE' ? 'Incompleto' : COPY_ENTRENAMIENTO_POR_SERIE.duracionDesconocida;
  return d.quality === 'MEASURED' ? `${COPY_ENTRENAMIENTO_POR_SERIE.duracionMedida} ${duracionParaMostrar(d.ms)}` : `${duracionParaMostrar(d.ms)} · ${ETIQUETA_DE_CALIDAD_DE_TIEMPO[d.quality]}`;
}

export function SeriesYTiempos({ ejecucion: x, plan }: { ejecucion: EjecucionDeEntrenamiento; plan: PlanConObjetivos | null }) {
  const { token, sesionPerdida } = useEntrenamiento();
  const [tiempos, setTiempos] = useState<Tiempos>({ tipo: 'cargando' });
  const cargar = useCallback(async () => {
    setTiempos({ tipo: 'cargando' });
    const r = await api.tiemposDeLaEjecucion(token, x.executionId);
    if (sesionPerdida(r)) return;
    setTiempos(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'fallo' });
  }, [token, x.executionId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const registro = registroVigente(x);
  const sesion = sesionDelPlan(plan, x.plannedSession.sessionId);
  const t = tiempos.tipo === 'listo' ? tiempos.datos : null;
  const nombreDe = (prescriptionId: string) => x.plannedSession.prescriptions.find((p) => p.prescriptionId === prescriptionId)?.exerciseName ?? 'Ejercicio';

  return (
    <div className="secciones">
      <section aria-labelledby={`plan-${x.executionId}`}>
        <h4 id={`plan-${x.executionId}`}>{COPY_ENTRENAMIENTO_POR_SERIE.planificadoFrenteARegistrado}</h4>
        {!sesion ? <p className="nota">No se pudo leer el plan de cada serie de esa versión: se muestra lo general de la prescripción más abajo.</p> : null}
        {x.plannedSession.prescriptions.map((p) => {
          const objetivos = sesion?.prescriptions.find((q) => q.prescriptionId === p.prescriptionId)?.sets ?? [];
          const registrado = registro?.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null;
          const numeros = [...new Set([...p.sets.map((s) => s.setIndex), ...(registrado?.sets ?? []).map((s) => s.setIndex)])].sort((a, b) => a - b);
          if (numeros.length === 0) return null;
          return (
            <div key={p.prescriptionId} className="desplazable-x">
              <table className="tabla tabla--objetivos">
                <caption>{p.exerciseName}</caption>
                <thead>
                  <tr>
                    <th scope="col">Serie</th>
                    <th scope="col">Plan de la serie</th>
                    <th scope="col">Registrado</th>
                    <th scope="col">Frente al plan</th>
                    <th scope="col">Descanso</th>
                    <th scope="col">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {numeros.map((n) => {
                    const objetivo = objetivos.find((s) => s.setIndex === n)?.target ?? null;
                    const serie = registrado?.sets?.find((s) => s.setIndex === n) ?? null;
                    const descanso = t?.rests.find((r) => r.prescriptionId === p.prescriptionId && r.setIndex === n) ?? null;
                    const cronometrada = t?.timedSets.find((s) => s.prescriptionId === p.prescriptionId && s.setIndex === n) ?? null;
                    return (
                      <tr key={n}>
                        <th scope="row">{n}</th>
                        <td>{objetivo ? textoDelPlanDeLaSerie(objetivo) : p.sets.some((s) => s.setIndex === n) ? '—' : 'No planificada'}</td>
                        <td>{serie ? textoRegistrado(serie) : registrado?.executionSummary ? 'Registro resumido' : COPY_ENTRENAMIENTO_POR_SERIE.sinRegistrar}</td>
                        <td>{serie ? textoDeRelacion(objetivo, serie) : '—'}</td>
                        <td>{descanso ? textoDeDescanso(descanso) : '—'}</td>
                        <td>{cronometrada ? textoDeLaSerie(cronometrada.duration) : serie && t ? COPY_ENTRENAMIENTO_POR_SERIE.duracionDesconocida : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>
      <section aria-labelledby={`tiempos-${x.executionId}`}>
        <h4 id={`tiempos-${x.executionId}`}>{COPY_ENTRENAMIENTO_POR_SERIE.tiemposDeLaSesion}</h4>
        <Ayuda titulo="Qué dice cada tiempo">
          <p>{COPY_ENTRENAMIENTO_POR_SERIE.noSonMinutosDeEsfuerzo}</p>
          <ul>
            {(Object.keys(EXPLICACION_DE_CALIDAD) as CalidadDeTiempoApi[]).map((c) => (
              <li key={c}>
                <strong>{ETIQUETA_DE_CALIDAD_DE_TIEMPO[c]}</strong>: {EXPLICACION_DE_CALIDAD[c]}
              </li>
            ))}
          </ul>
        </Ayuda>
        {tiempos.tipo === 'cargando' ? <Cargando /> : null}
        {tiempos.tipo === 'fallo' ? (
          <p className="nota">
            No pudimos leer los tiempos de esta sesión.{' '}
            <button type="button" className="boton boton--enlace" onClick={() => void cargar()}>
              Reintentar
            </button>
          </p>
        ) : null}
        {t && t.state === 'NOT_STARTED' ? <p>Esta sesión no tiene tiempos marcados en la app.</p> : null}
        {t && t.state !== 'NOT_STARTED' ? (
          <dl className="datos-de-tiempo">
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.transcurrido}</dt>
            <dd>{textoDeDuracion(t.session.elapsed)}</dd>
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.pausas}</dt>
            <dd>{textoDeDuracion(t.session.pauses)}</dd>
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.sinPausas}</dt>
            <dd>{textoDeDuracion(t.session.withoutPauses)}</dd>
            {t.exercises.map((e) => (
              <Fragment key={e.prescriptionId}>
                <dt>{nombreDe(e.prescriptionId)}</dt>
                <dd>{textoDeDuracion(e.duration)}</dd>
              </Fragment>
            ))}
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.sinEjercicioAsignado}</dt>
            <dd>{textoDeDuracion(t.unassigned)}</dd>
          </dl>
        ) : null}
        {t && t.state === 'LEFT_INCOMPLETE' ? <p className="nota">La sesión se cerró sin afirmar cuándo terminó: su total queda incompleto.</p> : null}
      </section>
    </div>
  );
}
