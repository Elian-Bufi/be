'use client';

/**
 * Los tiempos de una sesión registrada (DL-124), en el detalle de Registros (WP-ESCRITORIO-AREAS, parte 2).
 * - Cada tiempo dice su certeza: medido, estimado, incompleto o no informado (API-TIE-03). Sin un par de inicio y fin, la
 *   duración de una serie es desconocida aunque la serie tenga datos.
 * - A la vista van los tres tiempos de la sesión, en un renglón. El descanso y la duración de cada serie, y el tiempo de
 *   cada ejercicio, se abren a pedido: son otra lectura de la misma sesión, no otra sesión.
 * - Una falla de esta lectura se dice, con «Reintentar»: no es «sin tiempos».
 * La tabla de cada serie frente a su plan, que vivía acá, es ahora la tabla del detalle (`TablaDeSeries`, en
 * `ejecuciones.tsx`), con sus reglas en el dominio.
 */
import {
  COPY_ENTRENAMIENTO_POR_SERIE,
  ETIQUETA_DE_CALIDAD_DE_TIEMPO,
  EXPLICACION_DE_CALIDAD,
  duracionParaMostrar,
  numero,
  registroVigente,
  textoDeDescanso,
  textoDeDuracion,
  type CalidadDeTiempoApi,
  type EjecucionDeEntrenamiento,
  type TiemposDeSesion,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { useEntrenamiento } from './entrenamiento';

export type Tiempos = { readonly tipo: 'cargando' } | { readonly tipo: 'fallo'; readonly reintentar: () => void } | { readonly tipo: 'listo'; readonly datos: TiemposDeSesion };

/** Los tiempos de una sesión: una lectura por sesión abierta. */
export function useTiemposDeLaSesion(executionId: string): Tiempos {
  const { token, sesionPerdida } = useEntrenamiento();
  const [estado, setEstado] = useState<{ tipo: 'cargando' } | { tipo: 'fallo' } | { tipo: 'listo'; datos: TiemposDeSesion }>({ tipo: 'cargando' });
  const cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const r = await api.tiemposDeLaEjecucion(token, executionId);
    if (sesionPerdida(r)) return;
    setEstado(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'fallo' });
  }, [token, executionId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  return estado.tipo === 'fallo' ? { tipo: 'fallo', reintentar: () => void cargar() } : estado;
}

/** La duración de una serie cronometrada: «Duración medida 00:40», «00:40 · estimado» o «Duración desconocida». */
function textoDeLaSerie(d: { ms: number | null; quality: CalidadDeTiempoApi } | null): string {
  if (!d || d.ms === null) return d?.quality === 'INCOMPLETE' ? 'Incompleto' : COPY_ENTRENAMIENTO_POR_SERIE.duracionDesconocida;
  return d.quality === 'MEASURED' ? `${COPY_ENTRENAMIENTO_POR_SERIE.duracionMedida} ${duracionParaMostrar(d.ms)}` : `${duracionParaMostrar(d.ms)} · ${ETIQUETA_DE_CALIDAD_DE_TIEMPO[d.quality]}`;
}

function FallaDeLosTiempos({ reintentar }: { reintentar: () => void }) {
  return (
    <p className="nota">
      No pudimos leer los tiempos de esta sesión.{' '}
      <button type="button" className="boton boton--enlace" onClick={reintentar}>
        Reintentar
      </button>
    </p>
  );
}

/** Los tres tiempos de la sesión, en un renglón, cada uno con su certeza. */
export function TiemposDeLaSesion({ tiempos }: { tiempos: Tiempos }) {
  return (
    <div className="detalle-de-sesion__tiempos">
      <p className="lista__titulo">{COPY_ENTRENAMIENTO_POR_SERIE.tiemposDeLaSesion}</p>
      {tiempos.tipo === 'cargando' ? <Cargando /> : null}
      {tiempos.tipo === 'fallo' ? <FallaDeLosTiempos reintentar={tiempos.reintentar} /> : null}
      {tiempos.tipo === 'listo' && tiempos.datos.state === 'NOT_STARTED' ? <p className="nota">Esta sesión no tiene tiempos marcados en la app.</p> : null}
      {tiempos.tipo === 'listo' && tiempos.datos.state !== 'NOT_STARTED' ? (
        <dl className="datos-de-tiempo datos-de-tiempo--en-un-renglon">
          <div>
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.transcurrido}</dt>
            <dd>{textoDeDuracion(tiempos.datos.session.elapsed)}</dd>
          </div>
          <div>
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.pausas}</dt>
            <dd>{textoDeDuracion(tiempos.datos.session.pauses)}</dd>
          </div>
          <div>
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.sinPausas}</dt>
            <dd>{textoDeDuracion(tiempos.datos.session.withoutPauses)}</dd>
          </div>
        </dl>
      ) : null}
      {tiempos.tipo === 'listo' && tiempos.datos.state === 'LEFT_INCOMPLETE' ? <p className="nota">La sesión se cerró sin afirmar cuándo terminó: su total queda incompleto.</p> : null}
    </div>
  );
}

/**
 * El descanso y la duración de cada serie, y el tiempo de cada ejercicio. Las series son las del registro que rige y las
 * del plan de ese día, con su número real.
 */
export function DescansosYDuracion({ ejecucion: x, tiempos }: { ejecucion: EjecucionDeEntrenamiento; tiempos: Tiempos }) {
  if (tiempos.tipo === 'cargando') return <Cargando />;
  if (tiempos.tipo === 'fallo') return <FallaDeLosTiempos reintentar={tiempos.reintentar} />;
  const t = tiempos.datos;
  if (t.state === 'NOT_STARTED') return <p className="nota">Esta sesión no tiene tiempos marcados en la app: no hay descansos ni duraciones que mostrar.</p>;
  const registro = x.effectiveView.kind === 'NOT_RESOLVABLE' ? null : registroVigente(x);
  return (
    <>
      <p className="nota">{COPY_ENTRENAMIENTO_POR_SERIE.noSonMinutosDeEsfuerzo}</p>
      <div className="desplazable-x">
        <table className="tabla tabla--compacta tabla-de-series">
          <caption className="visualmente-oculto">El descanso y la duración de cada serie</caption>
          <thead>
            <tr>
              <th scope="col">Serie</th>
              <th scope="col">Descanso</th>
              <th scope="col">Duración</th>
            </tr>
          </thead>
          {x.plannedSession.prescriptions.map((p) => {
            const registrado = registro?.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null;
            const numeros = [...new Set([...p.sets.map((s) => s.setIndex), ...(registrado?.sets ?? []).map((s) => s.setIndex)])].sort((a, b) => a - b);
            if (numeros.length === 0) return null;
            const delEjercicio = t.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null;
            return (
              <tbody key={p.prescriptionId}>
                <tr className="tabla-de-series__ejercicio">
                  <th colSpan={3} scope="rowgroup">
                    <strong>{registrado?.performedExerciseName ?? p.exerciseName}</strong>
                    {delEjercicio ? <span className="tabla-de-series__cuenta"> {textoDeDuracion(delEjercicio.duration)}</span> : null}
                  </th>
                </tr>
                {numeros.map((n) => {
                  const serie = registrado?.sets?.find((s) => s.setIndex === n) ?? null;
                  const descanso = t.rests.find((r) => r.prescriptionId === p.prescriptionId && r.setIndex === n) ?? null;
                  const cronometrada = t.timedSets.find((s) => s.prescriptionId === p.prescriptionId && s.setIndex === n) ?? null;
                  return (
                    <tr key={n}>
                      <th scope="row">{numero(n)}</th>
                      <td>{descanso ? textoDeDescanso(descanso) : 'Sin descanso marcado'}</td>
                      <td>{cronometrada ? textoDeLaSerie(cronometrada.duration) : serie ? COPY_ENTRENAMIENTO_POR_SERIE.duracionDesconocida : COPY_ENTRENAMIENTO_POR_SERIE.sinRegistrar}</td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
      <p className="nota">
        {COPY_ENTRENAMIENTO_POR_SERIE.sinEjercicioAsignado}: {textoDeDuracion(t.unassigned)}
      </p>
      <p className="lista__titulo">Qué dice cada tiempo</p>
      <ul className="lista-compacta">
        {(Object.keys(EXPLICACION_DE_CALIDAD) as CalidadDeTiempoApi[]).map((c) => (
          <li key={c}>
            <strong>{ETIQUETA_DE_CALIDAD_DE_TIEMPO[c]}</strong>: {EXPLICACION_DE_CALIDAD[c]}
          </li>
        ))}
      </ul>
    </>
  );
}
