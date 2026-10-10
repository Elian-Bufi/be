'use client';

/**
 * Entrar por preguntas profesionales (WP-DASHBOARD-COMPRENSION, eje 2). La pregunta y sus parámetros viven en la URL
 * (`pregunta`, `area`, `version`, `etapaA`, `etapaB`, `medida`, `ejercicio`, `serie`, `unidad`): solo identificadores.
 * - Sin pregunta ni métricas: las preguntas principales a la vista, las demás en «Más preguntas», y «Análisis
 *   personalizado» para elegir métricas a mano.
 * - Con una pregunta: lo que falta elegir se pide (nunca se elige por la persona: ni el ejercicio, ni la medida, ni la
 *   versión, ni las etapas) y lo que venía de otro asesorado se dice y se vuelve a pedir.
 * - Resuelta, la pregunta es el título de la vista, con sus parámetros y la salida para cambiarla (lo arma `analizar.tsx`);
 *   su límite de interpretación va al pie de los gráficos.
 * La resolución es la del dominio (`resolverPregunta`); acá solo se piden los datos y se dibuja.
 */
import {
  etapasDelArea,
  PREGUNTAS_PROFESIONALES,
  preguntaProfesional,
  requisitosDe,
  resolverPregunta,
  TEXTO_DE_REQUISITO,
  duracionDeLaEtapa,
  type ContextoDeLaPregunta,
  type EtapaDePlanificacion,
  type IdDePregunta,
  type ParametrosDePregunta,
  type PreguntaElegida,
  type ProyeccionResponse,
  type ResolucionDePregunta,
} from '@be/domain';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { Cargando } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { textoDeFalla, useLectura, useSeguimiento } from './contexto';
import { hoyEn, parametrosDePregunta, restarDias } from './estado';
import type { Disponibles } from './series';

/** El período más largo que lee la ficha: un año y un día (DL-126). */
const DIAS_MAXIMOS_DEL_ANALISIS_WEB = 366;

/** Las etapas de los dos planes en el último año (el máximo del análisis): las versiones que se pueden elegir. */
export function useEtapasDelAno(activo: boolean): { readonly etapas: ContextoDeLaPregunta['etapas']; readonly cargando: boolean; readonly falla: string | null } {
  const { token, asesoradoId } = useSeguimiento();
  const hoy = hoyEn();
  const desde = restarDias(hoy, DIAS_MAXIMOS_DEL_ANALISIS_WEB - 1);
  const base = { periodStart: desde, periodEnd: hoy };
  const { lectura: n } = useLectura<ProyeccionResponse>(activo ? `etapas|NUT|${asesoradoId}|${hoy}` : null, () => api.proyeccion(token, asesoradoId, 'NUTRITION_PRESCRIBED_VS_RECORDED', { ...base, metric: 'RECORDS' }), 'NUTRITION');
  const { lectura: t } = useLectura<ProyeccionResponse>(activo ? `etapas|TRN|${asesoradoId}|${hoy}` : null, () => api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', base), 'TRAINING');
  return useMemo(() => {
    const vigencias = (l: typeof n) => (l.tipo === 'listo' && l.datos.data.result && l.datos.data.result.kind !== 'ANTHROPOMETRY_LONGITUDINAL' ? l.datos.data.result.planVersions : []);
    const ahora = n.tipo === 'listo' ? n.datos.data.generatedAt : t.tipo === 'listo' ? t.datos.data.generatedAt : new Date().toISOString();
    const falla = n.tipo === 'error' ? textoDeFalla(n.motivo, 'las versiones del plan de Nutrición') : t.tipo === 'error' ? textoDeFalla(t.motivo, 'las versiones del plan de Entrenamiento') : null;
    return {
      etapas: { NUTRITION: etapasDelArea(vigencias(n), 'NUTRITION', hoy, ahora), TRAINING: etapasDelArea(vigencias(t), 'TRAINING', hoy, ahora) },
      cargando: activo && (n.tipo === 'cargando' || t.tipo === 'cargando'),
      falla,
    };
  }, [n, t, hoy, activo]);
}

/** El contexto de la pregunta con lo que ya se leyó del asesorado. */
export function contextoDeLaPregunta(disponibles: Disponibles, etapas: ContextoDeLaPregunta['etapas'], areas: ReadonlySet<'NUTRICION' | 'ENTRENAMIENTO'>): ContextoDeLaPregunta {
  return {
    hoy: hoyEn(),
    maximoDeDias: DIAS_MAXIMOS_DEL_ANALISIS_WEB,
    areas,
    etapas,
    ejercicios: disponibles.ejercicios ?? [],
    medidas: new Set((disponibles.antropometria ?? []).map((m) => `antropometria.${m.metricCode}`)),
  };
}

/** Una etapa en una línea: «v3 · desde el 4 sept 2026 · vigente» o «v2 · del 12 jul al 3 sept 2026 (54 días)». */
export function etapaEnPalabras(e: EtapaDePlanificacion): string {
  if (e.abierta) return `${e.etiqueta} · desde el ${diaCivil(e.desde)} · vigente`;
  if (e.ultimoDia === null) return `${e.etiqueta} · el ${diaCivil(e.desde)} · ${duracionDeLaEtapa(e)}`;
  return `${e.etiqueta} · del ${diaCivil(e.desde)} al ${diaCivil(e.ultimoDia)} (${duracionDeLaEtapa(e)})`;
}

/** Las preguntas, cuando todavía no se eligió ninguna. */
export function ListaDePreguntas({ onPersonalizado }: { onPersonalizado: () => void }) {
  const { ir } = useSeguimiento();
  const id = useId();
  const elegir = (p: IdDePregunta) => ir(parametrosDePregunta({ id: p, params: {} }), { agregarAlHistorial: true });
  const principales = PREGUNTAS_PROFESIONALES.filter((p) => p.principal);
  const otras = PREGUNTAS_PROFESIONALES.filter((p) => !p.principal);
  return (
    <section className="preguntas-profesionales" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>Empezar por una pregunta</h3>
      <ul className="preguntas-profesionales__lista">
        {principales.map((p) => (
          <li key={p.id}>
            <button type="button" className="tarjeta-de-pregunta" onClick={() => elegir(p.id)}>
              <span className="tarjeta-de-pregunta__pregunta">{p.pregunta}</span>
              <span className="tarjeta-de-pregunta__muestra">{p.muestra}</span>
            </button>
          </li>
        ))}
      </ul>
      <details className="preguntas-profesionales__mas">
        <summary>Más preguntas</summary>
        <ul className="preguntas-profesionales__lista">
          {otras.map((p) => (
            <li key={p.id}>
              <button type="button" className="tarjeta-de-pregunta" onClick={() => elegir(p.id)}>
                <span className="tarjeta-de-pregunta__pregunta">{p.pregunta}</span>
                <span className="tarjeta-de-pregunta__muestra">{p.muestra}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
      <p>
        <button type="button" className="boton boton--enlace" onClick={onPersonalizado}>
          Análisis personalizado: elegir las métricas a mano
        </button>
      </p>
    </section>
  );
}

/**
 * Lo que falta elegir para responder. Lo que se ofrece sale de lo que hay con este asesorado; lo que venía elegido y no
 * aplica se dice. Las opciones por defecto, si las hay, quedan a la vista y se confirman con el botón.
 */
export function ElegirParametros({
  pregunta,
  resolucion,
  contexto,
  disponibles,
  cargando,
  falla,
  onListo,
}: {
  pregunta: PreguntaElegida;
  resolucion: Extract<ResolucionDePregunta, { estado: 'FALTA_ELEGIR' }> | null;
  contexto: ContextoDeLaPregunta;
  disponibles: Disponibles;
  cargando: boolean;
  falla: string | null;
  onListo?: () => void;
}) {
  const { ir } = useSeguimiento();
  const id = useId();
  const p = preguntaProfesional(pregunta.id);
  const [borrador, setBorrador] = useState<ParametrosDePregunta>(() => conSugerencias(pregunta.id, pregunta.params, contexto));
  const requisitos = requisitosDe(pregunta.id, borrador);
  const areas = [...contexto.areas];
  const etapas = borrador.area ? contexto.etapas[borrador.area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING'] : [];
  const ejercicio = contexto.ejercicios.find((e) => e.exerciseKey === borrador.exerciseKey) ?? null;
  const [error, setError] = useState<string | null>(null);
  const cambiar = (c: Partial<ParametrosDePregunta>) => setBorrador((b) => conSugerencias(pregunta.id, { ...b, ...c }, contexto));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const r = resolverPregunta(pregunta.id, borrador, contexto);
    if (r.estado === 'FALTA_ELEGIR') return setError(`Falta elegir ${r.requisitos.map((x) => TEXTO_DE_REQUISITO[x]).join(', ')}.`);
    setError(null);
    ir(parametrosDePregunta({ id: pregunta.id, params: borrador }), { agregarAlHistorial: true });
    onListo?.();
  };
  return (
    <form className="panel parametros-de-pregunta" onSubmit={enviar} aria-labelledby={`${id}-titulo`} noValidate>
      {/* La pregunta ya es el título de la vista (WP-ESCRITORIO-AMABLE): acá va qué se pide para responderla. */}
      <h3 id={`${id}-titulo`}>Datos para responder</h3>
      <p className="metadatos">{p.muestra}</p>
      {resolucion && resolucion.noAplican.length > 0 ? (
        <p className="nota" role="status">
          Lo elegido antes no aplica a este asesorado ({resolucion.noAplican.map((x) => TEXTO_DE_REQUISITO[x]).join(', ')}): elegilo de nuevo.
        </p>
      ) : null}
      {cargando ? <Cargando /> : null}
      {falla ? <p className="campo__error">{falla}</p> : null}
      {requisitos.includes('AREA') ? (
        <fieldset className="capas">
          <legend>Área</legend>
          {areas.length === 0 ? <p className="nota">No hay áreas con planificación disponibles con tu acceso actual.</p> : null}
          {areas.map((a) => (
            <label key={a} className="capa">
              <input type="radio" name={`${id}-area`} checked={borrador.area === a} onChange={() => cambiar({ area: a, planVersionId: undefined, stageA: undefined, stageB: undefined })} />
              {a === 'NUTRICION' ? 'Nutrición' : 'Entrenamiento'}
            </label>
          ))}
        </fieldset>
      ) : null}
      {requisitos.includes('VERSION') && borrador.area ? (
        <div className="campo">
          <label htmlFor={`${id}-version`}>Versión del plan (la etapa desde su activación)</label>
          <select id={`${id}-version`} value={borrador.planVersionId ?? ''} onChange={(e) => cambiar({ planVersionId: e.target.value || undefined })}>
            <option value="">Elegí una versión</option>
            {[...etapas].reverse().map((e) => (
              <option key={e.planVersionId} value={e.planVersionId}>
                {etapaEnPalabras(e)}
              </option>
            ))}
          </select>
          {!cargando && etapas.length === 0 ? <p className="nota">No hay versiones activadas en el último año.</p> : null}
        </div>
      ) : null}
      {requisitos.includes('ETAPAS') && borrador.area ? (
        <div className="fila-de-dato">
          {(['stageA', 'stageB'] as const).map((lado) => (
            <div className="campo" key={lado}>
              <label htmlFor={`${id}-${lado}`}>{lado === 'stageA' ? 'Etapa A (la anterior)' : 'Etapa B (la posterior)'}</label>
              <select id={`${id}-${lado}`} value={borrador[lado] ?? ''} onChange={(e) => cambiar({ [lado]: e.target.value || undefined })}>
                <option value="">Elegí una etapa</option>
                {[...etapas].reverse().map((e) => (
                  <option key={e.planVersionId} value={e.planVersionId}>
                    {etapaEnPalabras(e)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {!cargando && etapas.length < 2 ? <p className="nota">Hacen falta dos versiones activadas en el último año para comparar etapas.</p> : null}
        </div>
      ) : null}
      {requisitos.includes('MEDIDA_CORPORAL') || (pregunta.id === 'comparar-etapas' && borrador.area === 'NUTRICION') ? (
        <div className="campo">
          <label htmlFor={`${id}-medida`}>{pregunta.id === 'comparar-etapas' ? 'Medida corporal (opcional)' : 'Medida corporal'}</label>
          <select id={`${id}-medida`} value={borrador.bodyMetric ?? ''} onChange={(e) => cambiar({ bodyMetric: e.target.value || undefined })}>
            <option value="">{pregunta.id === 'comparar-etapas' ? 'Ninguna (se muestran los registros)' : 'Elegí una medida'}</option>
            {(disponibles.antropometria ?? []).map((m) => (
              <option key={m.metricCode} value={`antropometria.${m.metricCode}`}>
                {m.name} · {m.observations} {m.observations === 1 ? 'toma' : 'tomas'}
              </option>
            ))}
          </select>
          {!disponibles.cargando && (disponibles.antropometria ?? []).length === 0 ? <p className="nota">No hay tomas en el período elegido.</p> : null}
        </div>
      ) : null}
      {requisitos.includes('EJERCICIO') ? (
        <div className="campo">
          <label htmlFor={`${id}-ejercicio`}>Ejercicio</label>
          <select id={`${id}-ejercicio`} value={borrador.exerciseKey ?? ''} onChange={(e) => cambiar({ exerciseKey: e.target.value || undefined, setIndex: undefined, unit: undefined })}>
            <option value="">Elegí un ejercicio</option>
            {contexto.ejercicios.map((x) => (
              <option key={x.exerciseKey} value={x.exerciseKey}>
                {x.name}
                {x.homonym ? ' (otro con el mismo nombre)' : ''} · {x.sessions} {x.sessions === 1 ? 'sesión' : 'sesiones'}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {requisitos.includes('SERIE') && ejercicio ? (
        <div className="fila-de-dato">
          <div className="campo">
            <label htmlFor={`${id}-serie`}>Serie</label>
            <select id={`${id}-serie`} value={borrador.setIndex ?? ''} onChange={(e) => cambiar({ setIndex: e.target.value ? Number(e.target.value) : undefined })}>
              {ejercicio.setNumbers.map((n) => (
                <option key={n} value={n}>
                  Serie {n}
                </option>
              ))}
            </select>
          </div>
          {requisitos.includes('UNIDAD') ? (
            <div className="campo">
              <label htmlFor={`${id}-unidad`}>Unidad de carga (no se mezclan)</label>
              <select id={`${id}-unidad`} value={borrador.unit ?? ''} onChange={(e) => cambiar({ unit: (e.target.value || undefined) as 'kg' | 'lb' | undefined })}>
                {(ejercicio.loadUnits.length > 0 ? ejercicio.loadUnits : (['kg'] as const)).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="campo__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario">
          Ver la respuesta
        </button>
        <button type="button" className="boton boton--enlace" onClick={() => ir(parametrosDePregunta(null), { agregarAlHistorial: true })}>
          Elegir otra pregunta
        </button>
      </div>
    </form>
  );
}

/**
 * Sugerencias visibles que se confirman con «Ver la respuesta»: la serie y la unidad registradas del ejercicio elegido,
 * y las dos últimas etapas para comparar. El ejercicio, la medida y la versión nunca se sugieren.
 */
function conSugerencias(pregunta: IdDePregunta, p: ParametrosDePregunta, ctx: ContextoDeLaPregunta): ParametrosDePregunta {
  const areas = [...ctx.areas];
  const area = p.area && ctx.areas.has(p.area) ? p.area : areas.length === 1 ? areas[0] : p.area;
  const ejercicio = ctx.ejercicios.find((e) => e.exerciseKey === p.exerciseKey);
  const etapas = area ? ctx.etapas[area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING'] : [];
  const conEtapas =
    pregunta === 'comparar-etapas' && etapas.length >= 2 && !p.stageA && !p.stageB
      ? { stageA: etapas[etapas.length - 2]?.planVersionId, stageB: etapas[etapas.length - 1]?.planVersionId }
      : {};
  return {
    ...p,
    ...(area ? { area } : {}),
    ...conEtapas,
    ...(ejercicio && (p.setIndex === undefined || !ejercicio.setNumbers.includes(p.setIndex)) && ejercicio.setNumbers[0] !== undefined ? { setIndex: ejercicio.setNumbers[0] } : {}),
    ...(ejercicio && (p.unit === undefined || (ejercicio.loadUnits.length > 0 && !ejercicio.loadUnits.includes(p.unit))) ? { unit: ejercicio.loadUnits[0] ?? 'kg' } : {}),
  };
}
