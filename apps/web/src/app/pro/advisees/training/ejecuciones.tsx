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
 * - Objetivos por serie y tiempos (DL-122, DL-124): cada versión del período se lee con API-SER-01, así el gráfico y la
 *   tabla comparan contra el objetivo histórico de cada serie; y cada sesión abierta muestra sus tiempos con su certeza.
 * - Planificado y registrado (amplía DL-105): cada ejecución compara sus series con las de la prescripción que rigió, y
 *   un ejercicio elegido muestra su evolución en el período (`comparacion.tsx`). El ejercicio se elige por identidad del
 *   catálogo, no por nombre: dos ejercicios con el mismo nombre no se mezclan.
 */
import {
  cantidad,
  COPY_COMPARACION,
  COPY_ENTRENAMIENTO,
  ejerciciosComparables,
  identidadDeVersiones,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  numero,
  observacionesDelEjercicio,
  registroVigente,
  repeticionesPlanificadas,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EjecucionDeEntrenamiento,
  type IdentidadDeVersiones,
  type ObjetivosDeLaVersion,
  type PlanConObjetivos,
  type Prescripcion,
  type RegistroDeEjecucion,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cargando } from '../../../../components/estados';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';
import { LineasDePrescripcion } from './plan';
import { FiltroDePeriodo, type Periodo } from '../periodo';
import { SeriesYTiempos } from './series-y-tiempos';

type Contexto = ContextoDeRevisionDeEntrenamientoResponse['data'];

// Los gráficos (Recharts) se cargan cuando hacen falta: al elegir un ejercicio o al abrir una ejecución. Así la vista
// de Ejecuciones no paga su peso de entrada.
const EvolucionDelEjercicio = dynamic(() => import('./comparacion').then((m) => m.EvolucionDelEjercicio), { ssr: false, loading: () => <Cargando /> });
const ComparacionPorSerie = dynamic(() => import('./comparacion').then((m) => m.ComparacionPorSerie), { ssr: false, loading: () => <Cargando /> });

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

  // Los ejercicios que aparecen en el período, planificados o realizados por sustitución, por su identidad en el
  // catálogo: el filtro no ofrece lo que no hay, y dos ejercicios con el mismo nombre no se mezclan.
  const ejecuciones = useMemo(() => (r?.ok ? r.datos.registeredExecutions : []), [r]);
  const ejercicios = useMemo(() => ejerciciosComparables(ejecuciones), [ejecuciones]);
  const ejercicioVigente = ejercicios.some((x) => x.clave === ejercicio) ? ejercicio : '';
  const deLaVersion = useMemo(() => ejecuciones.filter((x) => !version || x.planId === version), [ejecuciones, version]);
  const conElEjercicio = useMemo(
    () => (ejercicioVigente ? new Set(observacionesDelEjercicio(deLaVersion, ejercicioVigente, ejecuciones).map((o) => o.comparacion.executionId)) : null),
    [deLaVersion, ejercicioVigente, ejecuciones],
  );
  const visibles = deLaVersion.filter((x) => !conElEjercicio || conElEjercicio.has(x.executionId));
  const elegido = ejercicios.find((x) => x.clave === ejercicioVigente);
  // La identidad de las versiones sale de todo el período, para la evolución y para el detalle por serie: la misma.
  const identidadDelPeriodo = useMemo(() => identidadDeVersiones(ejecuciones), [ejecuciones]);
  const versiones = useMemo(() => new Map((r?.ok ? r.datos.activePlanVersions : []).map((v) => [v.planId, fecha(v.activatedAt as string)])), [r]);
  // DL-122: el plan de cada versión del período, con sus objetivos por serie. Una versión que no se puede leer queda
  // sin objetivos por serie: la comparación usa entonces los de la prescripción, como antes.
  const [planes, setPlanes] = useState<ReadonlyMap<string, PlanConObjetivos>>(new Map());
  useEffect(() => {
    let vigente = true;
    const ids = [...new Set(ejecuciones.map((x) => x.planId))];
    void Promise.all(ids.map((planId) => api.planConObjetivos(token, planId))).then((rs) => {
      if (!vigente || rs.some((x) => sesionPerdida(x))) return;
      setPlanes(new Map(rs.flatMap((x) => (x.ok ? [[x.datos.data.planId, x.datos.data] as const] : []))));
    });
    return () => {
      vigente = false;
    };
  }, [ejecuciones, token, sesionPerdida]);
  const objetivosPorVersion = useMemo(() => new Map([...planes].map(([planId, plan]) => [planId, objetivosDe(plan)] as const)), [planes]);
  /** La ejecución que se pidió abrir desde la evolución: se despliega, muestra la prescripción del punto y recibe el foco. */
  const [pedido, setPedido] = useState<{ executionId: string; prescriptionId: string; vez: number } | null>(null);
  const abrir = useCallback((executionId: string, prescriptionId: string) => setPedido((p) => ({ executionId, prescriptionId, vez: (p?.vez ?? 0) + 1 })), []);
  const atendido = useCallback(() => setPedido(null), []);
  useEffect(() => setPedido(null), [periodo, version, ejercicioVigente]);

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
              <select id="trn-filtro-ejercicio" value={ejercicioVigente} onChange={(e) => setEjercicio(e.target.value)}>
                <option value="">Todos</option>
                {ejercicios.map((e) => (
                  <option key={e.clave} value={e.clave}>
                    {nombreParaElegir(e, ejercicios)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="nota">
            Período: {dia(`${r.datos.period.start}T12:00:00Z`)} a {dia(`${r.datos.period.end}T12:00:00Z`)}
          </p>

          <section className="seccion" aria-labelledby="titulo-evolucion">
            <h2 id="titulo-evolucion">{COPY_COMPARACION.titulo}</h2>
            {/* DL-113: qué entra en la comparación, plegado. Cómo se lee el gráfico va en su propia ayuda, junto a él. */}
            <Ayuda titulo="Qué entra en la comparación">
              <p>{COPY_COMPARACION.soloRegistradas}</p>
              {ejercicios.some((e) => e.homonimo) ? <p>Hay ejercicios con el mismo nombre que no se pueden identificar como el mismo (otro ejercicio del catálogo, o una versión registrada por sustitución que no está prescripta en el período): se listan por separado.</p> : null}
            </Ayuda>
            {!elegido ? (
              <p>{r.datos.registeredExecutions.length === 0 ? COPY_ENTRENAMIENTO.sinEjecuciones : COPY_COMPARACION.elegiUnEjercicio}</p>
            ) : (
              <>
                <h3>
                  {COPY_COMPARACION.evolucion}: {nombreParaElegir(elegido, ejercicios)}
                </h3>
                <EvolucionDelEjercicio
                  key={`${elegido.clave}|${version}`}
                  ejecuciones={deLaVersion}
                  periodo={ejecuciones}
                  clave={elegido.clave}
                  nombre={nombreParaElegir(elegido, ejercicios)}
                  versiones={versiones}
                  onAbrir={abrir}
                  objetivosPorVersion={objetivosPorVersion}
                />
              </>
            )}
          </section>

          <section className="seccion" aria-labelledby="titulo-ejecuciones">
            <h2 id="titulo-ejecuciones">Sesiones registradas</h2>
            {r.datos.registeredExecutions.length === 0 ? <p>{COPY_ENTRENAMIENTO.sinEjecuciones}</p> : null}
            {r.datos.registeredExecutions.length > 0 && visibles.length === 0 ? <p>Ninguna sesión registrada del período coincide con el filtro.</p> : null}
            <ul className="lista">
              {visibles.map((x) => (
                <DetalleDeEjecucion
                  key={x.executionId}
                  ejecucion={x}
                  identidad={identidadDelPeriodo}
                  pedido={pedido?.executionId === x.executionId ? pedido : null}
                  onAtendido={atendido}
                  plan={planes.get(x.planId) ?? null}
                  objetivos={objetivosPorVersion.get(x.planId)}
                />
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

/**
 * Lo registrado de una sesión, ejercicio por ejercicio, sin reinterpretar un registro agregado como series. Con
 * `planificado` (las prescripciones de la versión que rigió esa sesión), cada serie registrada dice también lo
 * planificado para ella: «· planificadas 8». Sin porcentajes ni colores: comparar no es calificar (DL-105).
 */
export function Registro({ registro, planificado = [] }: { registro: RegistroDeEjecucion; planificado?: readonly Prescripcion[] }) {
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
                    {/* La serie planificada con el mismo número, de la prescripción que rigió (no de la versión vigente hoy). */}
                    {COPY_ENTRENAMIENTO.serie} {numero(s.setIndex)}: {s.load ? cantidad(s.load.value, s.load.unit) : 'carga no registrada'} ×{' '}
                    {s.completedRepetitions === null ? '—' : numero(s.completedRepetitions)} {COPY_ENTRENAMIENTO.reps.toLowerCase()}
                    {s.rir !== null ? ` · ${COPY_ENTRENAMIENTO.rir} ${numero(s.rir)}` : ''}
                    {s.perceivedExertion !== null ? ` · esfuerzo percibido ${numero(s.perceivedExertion)}` : ''}
                    {planificadasPara(planificado, e.prescriptionId, s.setIndex)}
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

/** Los objetivos por serie de una versión, por prescripción: lo que necesita la comparación del dominio. */
export function objetivosDe(plan: PlanConObjetivos): ObjetivosDeLaVersion {
  return new Map(plan.blocks.flatMap((b) => [...b.sessions, ...b.microcycles.flatMap((m) => m.sessions)]).flatMap((s) => s.prescriptions.map((p) => [p.prescriptionId, p.sets] as const)));
}

/** Cómo se ofrece un ejercicio para elegir: su nombre y, si otra entrada que no se puede identificar como la misma se llama igual, cuál es. */
export function nombreParaElegir(e: { clave: string; nombre: string; homonimo: boolean }, todos: readonly { clave: string; nombre: string }[]): string {
  if (!e.homonimo) return e.nombre;
  const iguales = todos.filter((o) => o.nombre === e.nombre);
  return `${e.nombre} (${iguales.findIndex((o) => o.clave === e.clave) + 1} de ${iguales.length} con este nombre)`;
}

function DetalleDeEjecucion({
  ejecucion: x,
  identidad,
  pedido,
  onAtendido,
  plan,
  objetivos,
}: {
  ejecucion: EjecucionDeEntrenamiento;
  identidad: IdentidadDeVersiones;
  pedido: { prescriptionId: string; vez: number } | null;
  onAtendido: () => void;
  plan: PlanConObjetivos | null;
  objetivos: ObjetivosDeLaVersion | undefined;
}) {
  const vigente = x.effectiveView.kind === 'CORRECTED' ? x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId) : null;
  const rige = registroVigente(x);
  const [abierta, setAbierta] = useState(false);
  /** La prescripción pedida desde la evolución: queda acá, porque el pedido se descarta apenas se atiende. */
  const [pedida, setPedida] = useState<{ prescriptionId: string; vez: number } | null>(null);
  const resumen = useRef<HTMLElement>(null);
  // Abrir desde un punto de la evolución: se despliega, se ve la prescripción de ese punto y el foco llega acá. El pedido
  // se atiende una sola vez: si la ejecución se vuelve a mostrar después, no se abre sola.
  useEffect(() => {
    if (!pedido) return;
    setAbierta(true);
    setPedida(pedido);
    onAtendido();
    requestAnimationFrame(() => {
      resumen.current?.scrollIntoView({ block: 'start' });
      resumen.current?.focus();
    });
  }, [pedido, onAtendido]);
  return (
    <li className="lista__item" id={`ejecucion-${x.executionId}`}>
      <p className="lista__titulo">
        {x.plannedSession.label} · {dia(`${x.date}T12:00:00Z`)} · {etiquetaDeCondicionRegistrada(rige)}
      </p>
      <details open={abierta} onToggle={(e) => setAbierta((e.currentTarget as HTMLDetailsElement).open)}>
        <summary ref={resumen}>Ver detalle</summary>
        {/* Se dibuja solo abierta: un gráfico dentro de un bloque cerrado no tiene medidas. */}
        {abierta ? (
          <>
            <SeriesYTiempos ejecucion={x} plan={plan} />
            <h4>{COPY_COMPARACION.porSerie}</h4>
            <ComparacionPorSerie key={pedida ? `${pedida.prescriptionId}-${pedida.vez}` : 'inicial'} ejecucion={x} prescriptionId={pedida?.prescriptionId} identidad={identidad} objetivos={objetivos} />
          </>
        ) : null}
        <h4>{COPY_ENTRENAMIENTO.planificado}</h4>
        {/* DL-122: estas líneas dicen lo general de cada prescripción; con objetivos por serie, una serie puede tener los
            suyos, y la tabla de arriba dice el de cada una. */}
        {plan ? <p className="nota">Lo general de cada prescripción. El objetivo de cada serie, heredado o propio, está en «Planificado frente a registrado».</p> : null}
        {/* La prescripción de la versión que rigió esta sesión (su instantánea), completa: no la de la versión vigente hoy. */}
        {x.plannedSession.instructions ? (
          <p className="nota">
            {COPY_ENTRENAMIENTO.indicacionesDeLaSesion}: {x.plannedSession.instructions}
          </p>
        ) : null}
        <ul>
          {x.plannedSession.prescriptions.map((p) => (
            <li key={p.prescriptionId}>
              <strong>{p.exerciseName}</strong>
              <LineasDePrescripcion prescripcion={p} />
            </li>
          ))}
        </ul>
        {vigente ? (
          <>
            <h4>{COPY_ENTRENAMIENTO.correccionVigente}</h4>
            <p className="nota">
              {vigente.authorRole === 'PROFESSIONAL' ? COPY_ENTRENAMIENTO.corregidoPorElProfesional : 'Corregido por el asesorado'} · {fecha(vigente.recordedAt)} · Motivo: {vigente.reason}
            </p>
            <Registro registro={vigente.correction} planificado={x.plannedSession.prescriptions} />
          </>
        ) : null}
        <h4>{COPY_ENTRENAMIENTO.registroOriginal}</h4>
        <p className="nota">Registrado el {fecha(x.recordedAt)}</p>
        <Registro registro={x.original} planificado={x.plannedSession.prescriptions} />
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

/** « · planificadas 8» para una serie registrada, o nada si esa serie no estaba planificada o no fijaba repeticiones. */
function planificadasPara(planificado: readonly Prescripcion[], prescriptionId: string, setIndex: number): string {
  const serie = planificado.find((p) => p.prescriptionId === prescriptionId)?.sets.find((s) => s.setIndex === setIndex);
  const reps = serie ? repeticionesPlanificadas(serie) : null;
  if (reps === null) return '';
  return ` · ${reps === '1' ? COPY_ENTRENAMIENTO.planificada : COPY_ENTRENAMIENTO.planificadas} ${reps}`;
}
