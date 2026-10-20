'use client';

/**
 * Entrar por preguntas profesionales (WP-DASHBOARD-COMPRENSION, eje 2). La pregunta y sus parámetros viven en la URL
 * (`pregunta`, `area`, `version`, `etapaA`, `etapaB`, `medida`, `ejercicio`, `serie`, `unidad`): solo identificadores.
 * - Sin pregunta ni métricas (la entrada de Analizar, «¿Qué querés mirar?»): las preguntas principales a la vista, en
 *   filas, y las demás en «Más preguntas». Al lado, las métricas para comparar sin pregunta (`entrada.tsx`).
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
  type NombreDeIcono,
  type ParametrosDePregunta,
  type PreguntaElegida,
  type ProyeccionResponse,
  type ResolucionDePregunta,
} from '@be/domain';
import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Cargando } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { textoDeFalla, useLectura, useSeguimiento } from './contexto';
import { hoyEn, parametrosDePregunta, restarDias } from './estado';
import type { Disponibles } from './series';

/** El período más largo que lee la ficha: un año y un día (DL-126). */
const DIAS_MAXIMOS_DEL_ANALISIS_WEB = 366;

/**
 * Las etapas de los dos planes en el último año (el máximo del análisis): las versiones que se pueden elegir. Si una
 * lectura falla, se dice cuál (`falla`, `fallaDe`) y `reintentar` vuelve a pedir solo las que fallaron: un área cuyas
 * versiones no se pudieron leer no es un área sin versiones.
 */
export function useEtapasDelAno(activo: boolean): {
  readonly etapas: ContextoDeLaPregunta['etapas'];
  readonly cargando: boolean;
  readonly falla: string | null;
  readonly fallaDe: Readonly<Record<'NUTRITION' | 'TRAINING', boolean>>;
  readonly reintentar: () => void;
} {
  const { token, asesoradoId } = useSeguimiento();
  const hoy = hoyEn();
  const desde = restarDias(hoy, DIAS_MAXIMOS_DEL_ANALISIS_WEB - 1);
  const base = { periodStart: desde, periodEnd: hoy };
  const { lectura: n, recargar: recargarN } = useLectura<ProyeccionResponse>(activo ? `etapas|NUT|${asesoradoId}|${hoy}` : null, () => api.proyeccion(token, asesoradoId, 'NUTRITION_PRESCRIBED_VS_RECORDED', { ...base, metric: 'RECORDS' }), 'NUTRITION');
  const { lectura: t, recargar: recargarT } = useLectura<ProyeccionResponse>(activo ? `etapas|TRN|${asesoradoId}|${hoy}` : null, () => api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', base), 'TRAINING');
  return useMemo(() => {
    const vigencias = (l: typeof n) => (l.tipo === 'listo' && l.datos.data.result && l.datos.data.result.kind !== 'ANTHROPOMETRY_LONGITUDINAL' ? l.datos.data.result.planVersions : []);
    const ahora = n.tipo === 'listo' ? n.datos.data.generatedAt : t.tipo === 'listo' ? t.datos.data.generatedAt : new Date().toISOString();
    // Las dos, si fallaron las dos: antes se decía solo la primera.
    const falla =
      n.tipo === 'error' && t.tipo === 'error'
        ? textoDeFalla(n.motivo, 'las versiones de los planes de Nutrición y de Entrenamiento')
        : n.tipo === 'error'
          ? textoDeFalla(n.motivo, 'las versiones del plan de Nutrición')
          : t.tipo === 'error'
            ? textoDeFalla(t.motivo, 'las versiones del plan de Entrenamiento')
            : null;
    return {
      etapas: { NUTRITION: etapasDelArea(vigencias(n), 'NUTRITION', hoy, ahora), TRAINING: etapasDelArea(vigencias(t), 'TRAINING', hoy, ahora) },
      cargando: activo && (n.tipo === 'cargando' || t.tipo === 'cargando'),
      falla,
      fallaDe: { NUTRITION: n.tipo === 'error', TRAINING: t.tipo === 'error' },
      reintentar: () => {
        if (n.tipo === 'error') recargarN();
        if (t.tipo === 'error') recargarT();
      },
    };
  }, [n, t, hoy, activo, recargarN, recargarT]);
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

/** El ícono de cada pregunta: acompaña al texto, no lo reemplaza. */
const ICONO_DE_PREGUNTA: Readonly<Record<IdDePregunta, NombreDeIcono>> = {
  'cambio-desde-el-plan': 'plan',
  'registrado-vs-indicado': 'distinto',
  'progreso-de-un-ejercicio': 'carga',
  'informacion-para-revisar': 'revision',
  'alimentacion-y-medidas': 'nutricion',
  'comparar-etapas': 'comparar',
};

/**
 * Las preguntas, cuando todavía no se eligió ninguna: una fila por pregunta, con su ícono, lo que muestra y una flecha.
 * Las filas de una lista miden lo mismo (E-18).
 */
export function ListaDePreguntas() {
  const { ir } = useSeguimiento();
  const id = useId();
  const elegir = (p: IdDePregunta) => ir(parametrosDePregunta({ id: p, params: {} }), { agregarAlHistorial: true });
  const principales = PREGUNTAS_PROFESIONALES.filter((p) => p.principal);
  const otras = PREGUNTAS_PROFESIONALES.filter((p) => !p.principal);
  const fila = (p: (typeof PREGUNTAS_PROFESIONALES)[number]) => (
    <li key={p.id}>
      <button type="button" className="tarjeta-de-pregunta" onClick={() => elegir(p.id)}>
        <Icono nombre={ICONO_DE_PREGUNTA[p.id]} tamano={20} />
        <span className="tarjeta-de-pregunta__textos">
          <span className="tarjeta-de-pregunta__pregunta">{p.pregunta}</span>
          <span className="tarjeta-de-pregunta__muestra">{p.muestra}</span>
        </span>
        <Icono nombre="derecha" tamano={18} />
      </button>
    </li>
  );
  return (
    <section className="tarjeta-de-entrada preguntas-profesionales" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>
        <Icono nombre="pregunta" tamano={20} /> Empezar por una pregunta
      </h3>
      <ul className="preguntas-profesionales__lista">{principales.map(fila)}</ul>
      <details className="preguntas-profesionales__mas">
        <summary>Más preguntas ({otras.length})</summary>
        <ul className="preguntas-profesionales__lista">{otras.map(fila)}</ul>
      </details>
    </section>
  );
}

/**
 * Lo que falta elegir para responder. Lo que se ofrece sale de lo que hay con este asesorado; lo que venía elegido y no
 * aplica se dice. Las opciones por defecto, si las hay, quedan a la vista y se confirman con el botón. Lo que no se pudo
 * leer (las versiones de un plan, los datos del período) se dice arriba, con un solo «Reintentar», y nunca como «no hay».
 */
export function ElegirParametros({
  pregunta,
  resolucion,
  contexto,
  disponibles,
  cargando,
  falla,
  fallaDe,
  onReintentar,
  onListo,
}: {
  pregunta: PreguntaElegida;
  resolucion: Extract<ResolucionDePregunta, { estado: 'FALTA_ELEGIR' }> | null;
  contexto: ContextoDeLaPregunta;
  disponibles: Disponibles;
  cargando: boolean;
  /** Qué versiones de los planes no se pudieron leer, dicho para la persona. */
  falla: string | null;
  fallaDe: Readonly<Record<'NUTRITION' | 'TRAINING', boolean>>;
  /** Vuelve a pedir lo que no se pudo leer: las versiones y, si falló, qué hay en el período. */
  onReintentar: () => void;
  onListo?: () => void;
}) {
  const { ir } = useSeguimiento();
  const id = useId();
  const p = preguntaProfesional(pregunta.id);
  const [borrador, setBorrador] = useState<ParametrosDePregunta>(() => conSugerencias(pregunta.id, pregunta.params, contexto));
  const requisitos = requisitosDe(pregunta.id, borrador);
  const areas = [...contexto.areas];
  const etapas = borrador.area ? contexto.etapas[borrador.area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING'] : [];
  // Si las versiones del área elegida no se pudieron leer, no se dice que no hay: lo dice el aviso de arriba.
  const sinLeerLasVersiones = borrador.area ? fallaDe[borrador.area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING'] : false;
  const faltaLeer = [falla, disponibles.falla ? textoDeFalla(disponibles.falla, 'los datos del período de cada área (las medidas y los ejercicios)') : null].filter((x): x is string => x !== null);
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
      {faltaLeer.length > 0 ? (
        <Aviso tipo="error">
          {faltaLeer.map((texto) => (
            <p key={texto}>{texto}</p>
          ))}
          <button type="button" className="boton boton--secundario boton--compacto" onClick={onReintentar}>
            <Icono nombre="actualizar" tamano={18} />
            Reintentar lo que faltó
          </button>
        </Aviso>
      ) : null}
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
          {!cargando && !sinLeerLasVersiones && etapas.length === 0 ? <p className="nota">No hay versiones activadas en el último año.</p> : null}
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
          {!cargando && !sinLeerLasVersiones && etapas.length < 2 ? <p className="nota">Hacen falta dos versiones activadas en el último año para comparar etapas.</p> : null}
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
          {!disponibles.cargando && !disponibles.fallas.antropometria && (disponibles.antropometria ?? []).length === 0 ? <p className="nota">No hay tomas en el período elegido.</p> : null}
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
 * Los datos de «¿Cómo viene progresando este ejercicio?», en el lugar (WP-ESCRITORIO-AMABLE, C-21): el ejercicio, la
 * serie y la unidad se cambian ahí mismo, sin abrir el formulario. Ocupan el lugar de las etiquetas de las métricas,
 * que en esta pregunta son siempre las tres de esa serie.
 * - **Nada se elige por la persona** (D-13): al cambiar de ejercicio, la serie y la unidad siguen si el otro ejercicio
 *   las tiene registradas; si no, se piden con el formulario de siempre, que las sugiere a la vista para confirmar.
 * - **Un control aparece solo si hay algo para elegir:** con una sola serie o una sola unidad, el dato se escribe.
 */
export function ParametrosDelEjercicio({ pregunta, contexto }: { pregunta: PreguntaElegida; contexto: ContextoDeLaPregunta }) {
  const { ir } = useSeguimiento();
  const p = pregunta.params;
  const ejercicio = contexto.ejercicios.find((e) => e.exerciseKey === p.exerciseKey) ?? null;
  if (!ejercicio) return null;
  const unidadesDe = (e: (typeof contexto.ejercicios)[number]): readonly ('kg' | 'lb')[] => (e.loadUnits.length > 0 ? e.loadUnits : ['kg']);
  const cambiar = (c: Partial<ParametrosDePregunta>) => ir(parametrosDePregunta({ id: pregunta.id, params: { ...p, ...c } }), { agregarAlHistorial: true });
  const elegirEjercicio = (clave: string) => {
    const otro = contexto.ejercicios.find((e) => e.exerciseKey === clave);
    if (!otro) return;
    cambiar({
      exerciseKey: clave,
      setIndex: p.setIndex !== undefined && otro.setNumbers.includes(p.setIndex) ? p.setIndex : undefined,
      unit: p.unit !== undefined && unidadesDe(otro).includes(p.unit) ? p.unit : undefined,
    });
  };
  const unidades = unidadesDe(ejercicio);
  return (
    <div className="parametros-en-el-lugar" role="group" aria-label="El ejercicio, la serie y la unidad">
      <Parametro nombre="Ejercicio" icono="entrenamiento" fijo={contexto.ejercicios.length <= 1 ? ejercicio.name : null}>
        <select value={ejercicio.exerciseKey} onChange={(e) => elegirEjercicio(e.target.value)}>
          {contexto.ejercicios.map((x) => (
            <option key={x.exerciseKey} value={x.exerciseKey}>
              {x.name}
              {x.homonym ? ' (otro con el mismo nombre)' : ''} · {x.sessions} {x.sessions === 1 ? 'sesión' : 'sesiones'}
            </option>
          ))}
        </select>
      </Parametro>
      <Parametro nombre="Serie" fijo={ejercicio.setNumbers.length <= 1 ? String(p.setIndex ?? '') : null}>
        <select value={p.setIndex ?? ''} onChange={(e) => cambiar({ setIndex: Number(e.target.value) })}>
          {ejercicio.setNumbers.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </Parametro>
      <Parametro nombre="Unidad" fijo={unidades.length <= 1 ? (p.unit ?? '') : null}>
        <select value={p.unit ?? ''} onChange={(e) => cambiar({ unit: e.target.value as 'kg' | 'lb' })}>
          {unidades.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </Parametro>
      <p className="parametros-en-el-lugar__nota">Cada punto es esa serie en una sesión.</p>
    </div>
  );
}

/**
 * Un dato de la pregunta, en el lugar: su nombre y, al lado, el control para cambiarlo. Si no hay otra cosa para
 * elegir (`fijo`), va escrito: no es un control, y no lleva su rótulo.
 */
function Parametro({ nombre, icono, fijo, children }: { nombre: string; icono?: NombreDeIcono; fijo: string | null; children: ReactNode }) {
  const delante = (
    <>
      {icono ? <Icono nombre={icono} tamano={18} /> : null}
      <span className="parametro-en-el-lugar__nombre">{nombre}:</span>
    </>
  );
  return fijo !== null ? (
    <span className="parametro-en-el-lugar parametro-en-el-lugar--fijo">
      {delante}
      <strong>{fijo}</strong>
    </span>
  ) : (
    <label className="parametro-en-el-lugar">
      {delante}
      {children}
    </label>
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
