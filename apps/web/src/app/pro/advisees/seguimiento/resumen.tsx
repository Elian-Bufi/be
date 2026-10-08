'use client';

/**
 * Resumen («¿Qué necesito revisar?»; ESPECIFICACION.md §2; B10-08 DEC-10-UX-01: resumen ≠ análisis profundo):
 * - **Indicadores fijados** (hasta 4, guardados por cuenta con API-VAN): valor y unidad, fechas, n y cobertura, y una
 *   comparación válida —primera y última observación del mismo tramo comparable—, sin colores de juicio (PRO-02).
 * - **Cobertura operativa** por área: qué se registró y qué falta, nunca un porcentaje de adherencia.
 * - **Hechos recientes** de la línea de tiempo y **preguntas** que abren Analizar.
 */
import {
  COPY_VINCULO,
  definicionDeMetrica,
  MAXIMO_DE_METRICAS,
  METRICAS_DEL_DICCIONARIO,
  NOMBRE_DE_DOMINIO,
  numero,
  PRESETS_DE_ANALISIS,
  aplicarPreset,
  resumirPeriodo,
  type CalidadDeEntrada,
  type LineaDeTiempoResponse,
  type ReferenciaDeMetrica,
  type TipoDeEvento,
  type VistaDeAnalisis,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { api, nuevaClaveDeIdempotencia } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { valorParaMostrar } from './valores';
import { textoDeFalla, useLectura, useSeguimiento } from './contexto';
import { claveDeLaReferencia, codificarReferencia } from './estado';
import { nombreDeLaReferencia } from './selector';
import { useDisponibles, useSeriesDelAnalisis, type Disponibles } from './series';

const MAXIMO_DE_INDICADORES = 4;

/** «1 sesión registrada», «3 sesiones registradas». */
const contar = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;

/** Los indicadores por defecto, con lo que hay: energía registrada, registros, peso y las series del ejercicio más registrado. */
function indicadoresPorDefecto(d: Disponibles): ReferenciaDeMetrica[] {
  const sin = { exerciseKey: null, setIndex: null, unit: null };
  const lista: ReferenciaDeMetrica[] = [];
  if (d.nutricion) lista.push({ metricId: 'nutricion.energia', ...sin }, { metricId: 'nutricion.registros', ...sin });
  const peso = d.antropometria?.find((m) => m.metricCode === 'peso') ?? d.antropometria?.[0];
  if (peso) lista.push({ metricId: `antropometria.${peso.metricCode}`, ...sin });
  const ej = d.ejercicios?.[0];
  if (ej) lista.push({ metricId: 'entrenamiento.series-registradas', exerciseKey: ej.exerciseKey, setIndex: null, unit: null });
  return lista.slice(0, MAXIMO_DE_INDICADORES);
}

/**
 * El Resumen de escritorio: los indicadores arriba, lo que pasó en el período (cobertura y últimos hechos, lado a lado),
 * el estado por área de API-DSH-03 (planes, objetivos y revisiones) y las preguntas que abren Analizar.
 */
export function ResumenDelSeguimiento({ estadoPorArea }: { estadoPorArea: ReactNode }) {
  const disponibles = useDisponibles();
  const { token, sesionPerdida } = useSeguimiento();
  const [guardada, setGuardada] = useState<Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | null | undefined>(undefined);
  // Si no se pudo leer la elección guardada, se muestran los de por defecto y se dice: no es que se haya perdido.
  const [sinLeerLaEleccion, setSinLeerLaEleccion] = useState(false);
  const cargar = useCallback(async () => {
    const r = await api.listarVistasDeAnalisis(token);
    if (sesionPerdida(r)) return;
    setSinLeerLaEleccion(!r.ok);
    setGuardada(r.ok ? ((r.datos.data.find((v) => v.usage === 'SUMMARY_INDICATORS') as Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | undefined) ?? null) : null);
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const indicadores = guardada ? guardada.configuration.metrics : guardada === null ? indicadoresPorDefecto(disponibles) : [];

  return (
    <>
      {disponibles.falla ? <ErrorConReintento mensaje={textoDeFalla(disponibles.falla, 'qué datos hay en el período')} onReintentar={disponibles.recargar} /> : null}
      {sinLeerLaEleccion ? <p className="nota">No pudimos leer los indicadores que elegiste: se muestran los de por defecto. Tu elección sigue guardada.</p> : null}
      <Indicadores indicadores={indicadores} disponibles={disponibles} guardada={guardada ?? null} alGuardar={() => void cargar()} cargando={guardada === undefined || disponibles.cargando} />
      <DelPeriodo disponibles={disponibles} />
      {estadoPorArea}
      <Preguntas disponibles={disponibles} />
    </>
  );
}

function Indicadores({
  indicadores,
  disponibles,
  guardada,
  alGuardar,
  cargando,
}: {
  indicadores: readonly ReferenciaDeMetrica[];
  disponibles: Disponibles;
  guardada: Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | null;
  alGuardar: () => void;
  cargando: boolean;
}) {
  const id = useId();
  const { periodo, href } = useSeguimiento();
  const { series, recargar } = useSeriesDelAnalisis(cargando ? [] : indicadores, 'DAY');
  const [editando, setEditando] = useState(false);
  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Indicadores</h2>
      <p className="nota">
        Del {diaCivil(periodo.desde)} al {diaCivil(periodo.hasta)}. {guardada ? 'Los elegiste vos.' : 'Los de por defecto: podés elegir otros.'} Ningún indicador califica: describen lo registrado.
      </p>
      {cargando ? <Cargando /> : null}
      <ul className="indicadores">
        {series.map((s) => {
          const nombre = nombreDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios);
          return (
            <li key={s.clave} className="indicador">
              <h3>{nombre}</h3>
              {s.estado.tipo === 'cargando' ? <p className="nota">Cargando…</p> : null}
              {s.estado.tipo === 'sin-acceso' ? <p className="nota">No disponible con tu acceso actual.</p> : null}
              {s.estado.tipo === 'error' ? (
                <p className="campo__error">
                  {textoDeFalla(s.estado.motivo, 'este indicador')}{' '}
                  <button type="button" className="boton boton--enlace" onClick={recargar}>
                    Reintentar<span className="visualmente-oculto"> {nombre}</span>
                  </button>
                </p>
              ) : null}
              {s.estado.tipo === 'lista' ? <ValorDelIndicador serie={s.estado.observaciones} definicion={s.definicion} desde={periodo.desde} hasta={periodo.hasta} /> : null}
              <Link className="boton boton--enlace" href={href({ vista: 'analizar', m: codificarReferencia(s.ref), modo: null, f: null })}>
                Analizar<span className="visualmente-oculto"> {nombre}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {!cargando && !disponibles.falla && series.length === 0 ? <p className="nota">No hay datos de ninguna área en este período con tu acceso actual.</p> : null}
      <button type="button" className="boton boton--secundario" aria-expanded={editando} onClick={() => setEditando(!editando)}>
        {editando ? 'Cerrar' : 'Elegir indicadores'}
      </button>
      {editando ? (
        <EditorDeIndicadores
          actuales={indicadores}
          disponibles={disponibles}
          guardada={guardada}
          alGuardar={() => {
            setEditando(false);
            alGuardar();
          }}
        />
      ) : null}
    </section>
  );
}

function ValorDelIndicador({ serie, definicion, desde, hasta }: { serie: Parameters<typeof resumirPeriodo>[0]; definicion: NonNullable<ReturnType<typeof definicionDeMetrica>>; desde: string; hasta: string }) {
  const r = resumirPeriodo(serie, definicion, desde, hasta);
  if (r.valor === null) return <p>{r.incompletos > 0 ? 'Solo hay datos de hoy, que sigue en curso: todavía no hay un día completo que resumir.' : 'Sin datos en el período.'}</p>;
  if (definicion.resumenDePeriodo === 'PRIMERO_Y_ULTIMO_COMPARABLES') {
    const ultimo = r.ultimo;
    const primero = r.primero;
    return (
      <>
        <p className="indicador__valor">{valorParaMostrar(r.valor, definicion, serie.unit)}</p>
        <p className="nota">Última toma: {ultimo ? diaCivil(ultimo.date) : '—'}</p>
        {primero && ultimo && primero.pointId !== ultimo.pointId && primero.value !== null ? (
          <p className="nota">
            Primera comparable del período: {valorParaMostrar(primero.value, definicion, serie.unit)} el {diaCivil(primero.date)} · diferencia {r.valor - primero.value > 0 ? '+' : ''}
            {numero(Number((r.valor - primero.value).toFixed(definicion.decimales)))} {serie.unit} ({numero(r.n)} tomas comparables)
          </p>
        ) : (
          <p className="nota">Una sola observación comparable: no hay con qué comparar.</p>
        )}
      </>
    );
  }
  const subtotales = r.parciales ? ` (${numero(r.parciales)} ${r.parciales === 1 ? 'subtotal' : 'subtotales'})` : '';
  // El día en curso no entra en la media ni en la mediana; el total sí lo cuenta, y lo dice (DICCIONARIO §1).
  const enCurso = r.incompletos > 0 ? (definicion.resumenDePeriodo === 'TOTAL' ? ' · incluye hoy, que sigue en curso' : ' · sin contar hoy, que sigue en curso') : '';
  const texto =
    definicion.resumenDePeriodo === 'MEDIA_DE_DIAS_CON_DATOS'
      ? `media de ${numero(r.n)} de ${numero(r.duracionDias)} días con valor${subtotales}${enCurso}`
      : definicion.resumenDePeriodo === 'MEDIANA'
        ? `mediana de ${numero(r.n)} ${r.n === 1 ? 'sesión' : 'sesiones'}${enCurso}`
        : `en ${numero(r.duracionDias)} días${enCurso}`;
  return (
    <>
      <p className="indicador__valor">{valorParaMostrar(r.valor, definicion, serie.unit)}</p>
      <p className="nota">{texto}</p>
    </>
  );
}

function EditorDeIndicadores({ actuales, disponibles, guardada, alGuardar }: { actuales: readonly ReferenciaDeMetrica[]; disponibles: Disponibles; guardada: Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | null; alGuardar: () => void }) {
  const { token, sesionPerdida } = useSeguimiento();
  const id = useId();
  const candidatas = useMemo(() => {
    const sin = { exerciseKey: null, setIndex: null, unit: null };
    const lista: ReferenciaDeMetrica[] = [];
    if (disponibles.nutricion) for (const m of METRICAS_DEL_DICCIONARIO.filter((x) => x.area === 'NUTRICION' && x.implementada)) lista.push({ metricId: m.id, ...sin });
    for (const m of disponibles.antropometria ?? []) lista.push({ metricId: `antropometria.${m.metricCode}`, ...sin });
    for (const e of (disponibles.ejercicios ?? []).slice(0, 5)) lista.push({ metricId: 'entrenamiento.series-registradas', exerciseKey: e.exerciseKey, setIndex: null, unit: null });
    return lista;
  }, [disponibles]);
  const [elegidas, setElegidas] = useState<readonly ReferenciaDeMetrica[]>(actuales);
  const [error, setError] = useState<string | null>(null);
  const alternar = (r: ReferenciaDeMetrica) => {
    const clave = claveDeLaReferencia(r);
    setElegidas((e) => (e.some((x) => claveDeLaReferencia(x) === clave) ? e.filter((x) => claveDeLaReferencia(x) !== clave) : e.length >= MAXIMO_DE_INDICADORES ? e : [...e, r]));
  };
  const guardar = async () => {
    if (elegidas.length === 0) return setError('Elegí al menos uno.');
    const configuracion = { schemaVersion: 1 as const, metrics: [...elegidas] };
    const r = guardada
      ? await api.reemplazarVistaDeAnalisis(token, guardada.viewId, { expectedVersion: guardada.version, name: 'Indicadores del resumen', configuration: configuracion })
      : await api.crearVistaDeAnalisis(token, { usage: 'SUMMARY_INDICATORS', name: 'Indicadores del resumen', configuration: configuracion }, nuevaClaveDeIdempotencia());
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError('No pudimos guardar los indicadores. Probá de nuevo.');
    alGuardar();
  };
  return (
    <fieldset className="capas editor-de-indicadores">
      <legend>Hasta {MAXIMO_DE_INDICADORES} indicadores (se guardan en tu cuenta y valen para todos tus asesorados)</legend>
      {candidatas.map((r) => {
        const clave = claveDeLaReferencia(r);
        const marcada = elegidas.some((x) => claveDeLaReferencia(x) === clave);
        return (
          <label key={clave} className="capa">
            <input type="checkbox" checked={marcada} disabled={!marcada && elegidas.length >= MAXIMO_DE_INDICADORES} onChange={() => alternar(r)} />
            {nombreDeLaReferencia(r, definicionDeMetrica(r.metricId, ''), disponibles.ejercicios)}
          </label>
        );
      })}
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => void guardar()}>
          Guardar indicadores
        </button>
        <span className="nota" id={`${id}-cuantos`}>
          {elegidas.length} de {MAXIMO_DE_INDICADORES}
        </span>
      </div>
      {error ? (
        <p className="campo__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * Lo que pasó en el período: la cobertura por área —lo que se registró y lo que falta, con su denominador; nunca un
 * porcentaje global— y los últimos hechos. Una sola lectura de la línea de tiempo trae las dos cosas (sus conteos son
 * del conjunto autorizado, antes de los filtros); la cobertura nutricional ya vino con la lectura de lo disponible.
 */
function DelPeriodo({ disponibles }: { disponibles: Disponibles }) {
  const { token, asesoradoId, periodo, href } = useSeguimiento();
  const id = useId();
  const { lectura, recargar } = useLectura<LineaDeTiempoResponse>(`del-periodo|${asesoradoId}|${periodo.desde}|${periodo.hasta}`, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, limit: '6' }),
  );
  const datos = lectura.tipo === 'listo' ? lectura.datos.data : null;
  const deTipo = (tipo: TipoDeEvento) => datos?.periodCounts.byEventType.find((x) => x.eventType === tipo)?.count ?? 0;
  const conCalidad = (calidad: CalidadDeEntrada) => datos?.periodCounts.byQuality.find((x) => x.quality === calidad)?.count ?? 0;
  const c = disponibles.coberturaNutricional;
  return (
    <div className="resumen__periodo">
      <section className="seccion" aria-labelledby={`${id}-cobertura`}>
        <h2 id={`${id}-cobertura`}>Qué se registró en el período</h2>
        <p className="nota">Cobertura del registro, no adherencia: dice qué hay y qué falta, sin calificar.</p>
        {lectura.tipo === 'cargando' || disponibles.cargando ? <Cargando /> : null}
        {lectura.tipo === 'error' ? <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'lo registrado en el período')} onReintentar={recargar} /> : null}
        {lectura.tipo === 'no-disponible' ? <p>{COPY_VINCULO.recursoNoDisponible}</p> : null}
        <dl className="cobertura">
          {c ? (
            <div>
              <dt>{NOMBRE_DE_DOMINIO.NUTRITION}</dt>
              <dd>
                {contar(c.daysWithRecords, 'día', 'días')} de {numero(c.daysInPeriod)} con algún registro · {contar(c.records, 'registro', 'registros')}: {numero(c.recordsWithQuantities)} con cantidades y {numero(c.recordsWithoutQuantities)} sin cantidades
                {c.differentMealsWithoutQuantities ? ` (${contar(c.differentMealsWithoutQuantities, 'comida diferente', 'comidas diferentes')})` : ''}
                {c.annulledExcluded ? ` · ${contar(c.annulledExcluded, 'anulado', 'anulados')} fuera de los totales` : ''}
                {c.rectifiedCountedOnce ? ` · ${contar(c.rectifiedCountedOnce, 'rectificado, contado', 'rectificados, contados')} una vez` : ''}
              </dd>
            </div>
          ) : null}
          {datos?.sourceDomains.includes('TRAINING') ? (
            <div>
              <dt>{NOMBRE_DE_DOMINIO.TRAINING}</dt>
              <dd>
                {contar(deTipo('TRAINING_SESSION_RECORDED'), 'sesión registrada', 'sesiones registradas')}
                {conCalidad('SESSION_WITH_DEVIATION') ? ` · ${numero(conCalidad('SESSION_WITH_DEVIATION'))} con cambios` : ''}
                {conCalidad('SESSION_NOT_COMPLETED') ? ` · ${contar(conCalidad('SESSION_NOT_COMPLETED'), 'registrada como no realizada', 'registradas como no realizadas')}` : ''}
                {conCalidad('SESSION_SUMMARY_ONLY') ? ` · ${contar(conCalidad('SESSION_SUMMARY_ONLY'), 'resumida, sin series', 'resumidas, sin series')}` : ''}. Sin calendario prescripto, no hay «sesiones esperadas».
              </dd>
            </div>
          ) : null}
          {datos?.sourceDomains.includes('ANTHROPOMETRY') ? (
            <div>
              <dt>{NOMBRE_DE_DOMINIO.ANTHROPOMETRY}</dt>
              <dd>{contar(deTipo('ANTHROPOMETRIC_EVALUATION_RECORDED'), 'toma registrada', 'tomas registradas')}</dd>
            </div>
          ) : null}
          {datos && datos.periodCounts.recordedLate > 0 ? (
            <div>
              <dt>Cargado otro día</dt>
              <dd>
                {datos.periodCounts.recordedLate === 1
                  ? 'Un hecho se registró un día posterior al que ocurrió'
                  : `${numero(datos.periodCounts.recordedLate)} hechos se registraron un día posterior al que ocurrieron`}{' '}
                (carga tardía).
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
      <section className="seccion" aria-labelledby={`${id}-recientes`}>
        <h2 id={`${id}-recientes`}>Lo último que pasó</h2>
        {datos ? (
          datos.entries.length === 0 ? (
            <p>No hay hechos registrados en este período.</p>
          ) : (
            <ul className="recientes">
              {datos.entries.map((e) => (
                <li key={e.timelineEntryId}>
                  <span className="nota">{diaCivil(e.occurredDate)}</span> · {NOMBRE_DE_DOMINIO[e.domain]} · {e.title}
                  {e.state === 'ANNULLED' ? ' (anulado)' : ''}
                  {e.recordedLate ? ' · carga tardía' : ''}
                </li>
              ))}
            </ul>
          )
        ) : null}
        <Link href={href({ vista: 'linea' })}>Ver todo en la línea de tiempo</Link>
      </section>
    </div>
  );
}

function Preguntas({ disponibles }: { disponibles: Disponibles }) {
  const { href } = useSeguimiento();
  const id = useId();
  const ejercicio = disponibles.ejercicios?.[0] ?? null;
  const hay = new Set<string>([
    ...(disponibles.nutricion ? METRICAS_DEL_DICCIONARIO.filter((m) => m.area === 'NUTRICION' && m.implementada).map((m) => m.id) : []),
    ...(ejercicio ? METRICAS_DEL_DICCIONARIO.filter((m) => m.area === 'ENTRENAMIENTO' && m.implementada).map((m) => m.id) : []),
    ...(disponibles.antropometria ?? []).map((m) => `antropometria.${m.metricCode}`),
  ]);
  const enlace = (metricas: readonly string[]) =>
    metricas
      .slice(0, MAXIMO_DE_METRICAS)
      .map((metricId) => {
        const d = definicionDeMetrica(metricId, '');
        return codificarReferencia(
          d?.area === 'ENTRENAMIENTO' && ejercicio
            ? { metricId, exerciseKey: ejercicio.exerciseKey, setIndex: d.requiereSerie ? (ejercicio.setNumbers[0] ?? 1) : null, unit: d.parametro === 'LOAD' ? (ejercicio.loadUnits[0] ?? 'kg') : null }
            : { metricId, exerciseKey: null, setIndex: null, unit: null },
        );
      })
      .join(',');
  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Preguntas para analizar</h2>
      {disponibles.cargando ? <Cargando /> : null}
      <ul className="preguntas">
        {PRESETS_DE_ANALISIS.filter((p) => !p.comparaPeriodos).map((p) => {
          const { usables } = aplicarPreset(p, hay);
          if (usables.length === 0) return null;
          return (
            <li key={p.id}>
              <Link href={href({ vista: 'analizar', m: enlace(usables), modo: null, f: null })}>{p.pregunta}</Link>
              <span className="nota"> {p.limite}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
