'use client';

/**
 * Las series de «Analizar»: una lectura de API-PRJ-01 por métrica elegida, con la clave de su proyección y sus
 * parámetros (DL-126). El cálculo es del servidor y del dominio; acá no se suma, promedia ni interpola nada.
 *
 * Cada serie trae también sus **observaciones** (el día en nutrición, la sesión o la toma): los resúmenes, la
 * comparación de períodos y la referencia del cambio relativo se calculan sobre ellas, en el rango exacto. Si el gráfico
 * se agrupa por semana, las observaciones se piden aparte (una segunda lectura, con el mismo PDP): agrupar el dibujo no
 * cambia el significado de un resumen, y una semana que un rango corta no se puede recortar.
 *
 * GR-26 (WP-GRAFICOS fase 2, DL-174): una serie que no está en el diccionario de DL-126 pero sí en el catálogo de los
 * gráficos (el 1RM estimado; después, el RIR indicado y los g/kg) se lee por su camino (`leerSerieDelAnalisis`): el
 * 1RM estimado con sus puntos (para la mediana del RIR y el rango de repeticiones de «Dos etapas») y lo demás con
 * `leerSerieDelCatalogo`. Lo del diccionario se lee como siempre.
 */
import {
  agregacionPara,
  definicionDeMetrica,
  granoDeObservacion,
  type DefinicionDeMetrica,
  type DominioDeAnalisis,
  type EjercicioDelPeriodo,
  type EscalonDelObjetivoApi,
  type FiltroDeProyeccion,
  type IndicadoDeLaComidaApi,
  type IndicadoDelDiaApi,
  type ProyeccionResponse,
  type PuntoDeFuerza,
  type ReferenciaDeMetrica,
  type ResultadoDeProyeccionNutricional,
  type SerieAnalitica,
  type VigenciaDePlan,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type Resultado } from '../../../../lib/api';
import { limitarLectura, motivoDeFalla, useSeguimiento, type MotivoDeFalla } from './contexto';
import { claveDeLaReferencia, type GranoElegido, type Periodo } from './estado';
import { caminoDeLaLectura, definicionDeLaSerie, ejercicioDeLaClave } from '../graficos/arma-tu-grafico/compositor';
import { leerLaFuerza } from '../graficos/cruces/lecturas-de-los-cruces';
import { leerDisponibles, leerSerieDelCatalogo, type Disponibles } from '../graficos/lecturas';

export type EstadoDeSerie =
  | { readonly tipo: 'cargando' }
  | {
      readonly tipo: 'lista';
      /** Lo que se dibuja, en el grano elegido. */
      readonly serie: SerieAnalitica;
      /** Las observaciones de la métrica (grano DAY u ORIGINAL), para resumir, comparar y referenciar. */
      readonly observaciones: SerieAnalitica;
      readonly bandas: readonly VigenciaDePlan[];
      /**
       * Lo que se dibuja del objetivo del profesional, en la unidad de la serie: un escalón por versión del objetivo
       * vigente en el período, con cantidad (las calorías y, desde DL-158, los macros en gramos). Vacío si no hay.
       */
      readonly objetivo: readonly { readonly desde: string; readonly hasta: string | null; readonly valor: number }[];
      /** DL-158: los escalones del objetivo tal como llegan, también los que son una proporción de las calorías (no se dibujan). */
      readonly escalones: readonly EscalonDelObjetivoApi[];
      /**
       * DL-158: lo indicado en el plan, por día (cada día del período hasta hoy) y por comida registrada. `null` si la
       * métrica no lo tiene (Entrenamiento, Antropometría y la cuenta de registros).
       */
      readonly indicado: { readonly dias: readonly IndicadoDelDiaApi[]; readonly comidas: readonly IndicadoDeLaComidaApi[] } | null;
      readonly parcial: boolean;
      readonly generada: string;
      readonly zona: string;
      /** El 1RM estimado (GR-26): sus puntos tal como llegan, para la mediana del RIR y las repeticiones de cada etapa. */
      readonly fuerza?: readonly PuntoDeFuerza[];
    }
  | { readonly tipo: 'sin-acceso' }
  | { readonly tipo: 'sin-especificacion' }
  /** La lectura respondió bien y no trae serie: en el período no hay tomas de esa medida ni sesiones de ese ejercicio. */
  | { readonly tipo: 'sin-datos' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

export interface SerieDelAnalisis {
  readonly ref: ReferenciaDeMetrica;
  readonly clave: string;
  readonly definicion: DefinicionDeMetrica;
  /** El grano que se usó: el pedido si la métrica lo admite; si no, el suyo por defecto. */
  readonly grano: GranoElegido;
  readonly estado: EstadoDeSerie;
}

/**
 * La definición de una referencia elegida: la del diccionario o, si la serie solo está en el catálogo de los gráficos
 * (GR-26), la suya. La unidad antropométrica no se conoce hasta leer la serie.
 */
export function definicionDe(ref: ReferenciaDeMetrica, unidad = ''): DefinicionDeMetrica | null {
  return definicionDeMetrica(ref.metricId, unidad) ?? definicionDeLaSerie(ref.metricId, unidad);
}

/** El grano que se usa para una métrica: el pedido si lo admite, si no el suyo (y la pantalla lo dice). */
export function granoPara(definicion: DefinicionDeMetrica, pedido: GranoElegido): GranoElegido {
  return agregacionPara(definicion, pedido) !== null ? pedido : (definicion.granoPorDefecto as GranoElegido);
}

function pedidoDe(ref: ReferenciaDeMetrica, definicion: DefinicionDeMetrica, grano: GranoElegido, periodo: Periodo): { clave: ProyeccionResponse['data']['projectionKey']; filtro: FiltroDeProyeccion } | null {
  const base = { periodStart: periodo.desde, periodEnd: periodo.hasta };
  if (definicion.area === 'NUTRICION') return { clave: 'NUTRITION_PRESCRIBED_VS_RECORDED', filtro: { ...base, metric: String(definicion.parametro), grain: grano === 'WEEK' ? 'WEEK' : 'DAY' } };
  if (definicion.area === 'ENTRENAMIENTO') {
    if (!ref.exerciseKey) return null;
    const metrica = String(definicion.parametro);
    return {
      clave: 'TRAINING_PROGRESSION_BY_EXERCISE',
      filtro: {
        ...base,
        exerciseId: ref.exerciseKey,
        metric: metrica,
        ...(metrica !== 'SETS_RECORDED' ? { setIndex: String(ref.setIndex ?? 1) } : {}),
        ...(metrica === 'LOAD' && ref.unit ? { unit: ref.unit } : {}),
        grain: metrica === 'SETS_RECORDED' && grano === 'WEEK' ? 'WEEK' : 'ORIGINAL',
      },
    };
  }
  return { clave: 'ANTHROPOMETRY_LONGITUDINAL', filtro: { ...base, metric: String(definicion.parametro) } };
}

type Respuesta = Awaited<ReturnType<typeof api.proyeccion>>;

/** La serie que trae una respuesta de API-PRJ-01, si la trae. */
function serieDe(r: Respuesta): SerieAnalitica | null {
  if (!r.ok || !r.datos.data.result) return null;
  const res = r.datos.data.result;
  // La estimación de fuerza (ED-74) no es una serie analítica: tiene su propia lectura, con la cuenta de cada punto.
  if (res.kind === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE') return null;
  return res.kind === 'NUTRITION_PRESCRIBED_VS_RECORDED' ? res.recorded : res.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? (res.progression?.series ?? null) : (res.series[0] ?? null);
}

/** El estado de una serie a partir de sus respuestas: la del dibujo y, si el grano es otro, la de las observaciones. */
function estadoDe(r: Respuesta, deObservaciones: Respuesta | null): EstadoDeSerie {
  // Las dos lecturas pasan por el mismo PDP: si una no está disponible o falla, la serie entera tampoco.
  for (const x of deObservaciones ? [r, deObservaciones] : [r]) {
    if (!x.ok) return x.tipo === 'API' && x.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: motivoDeFalla(x) };
    if (x.datos.data.dataState === 'NOT_AVAILABLE_TO_VIEW') return { tipo: 'sin-acceso' };
    if (x.datos.data.dataState === 'INSUFFICIENT_INFORMATION') return { tipo: 'sin-especificacion' };
  }
  const serie = serieDe(r);
  const observaciones = deObservaciones ? serieDe(deObservaciones) : serie;
  if (!r.ok) return { tipo: 'error', motivo: 'OTRO' };
  // Respondió bien y sin serie: no hay nada de esa métrica en el período. Es una ausencia, no una falla.
  if (!serie || !observaciones) return { tipo: 'sin-datos' };
  const d = r.datos.data;
  const res = d.result;
  const bandas = !res || res.kind === 'ANTHROPOMETRY_LONGITUDINAL' ? [] : res.planVersions;
  // DL-158: el objetivo de la métrica (las calorías o un macro en gramos) y lo indicado en el plan. Lo indicado es por
  // día: con la vista por semana se lee igual (la API lo arma por día en las dos lecturas) y la pantalla no lo dibuja.
  const prescripto = res?.kind === 'NUTRITION_PRESCRIBED_VS_RECORDED' ? res.prescribed : null;
  const escalones = prescripto?.objectiveSteps ?? [];
  const objetivo = escalones.flatMap((e) => (e.amount ? [{ desde: e.from, hasta: e.to, valor: e.amount.value }] : []));
  const indicado = prescripto && res?.kind === 'NUTRITION_PRESCRIBED_VS_RECORDED' && res.metric !== 'RECORDS' ? { dias: prescripto.planned.days, comidas: prescripto.planned.meals } : null;
  return { tipo: 'lista', serie, observaciones, bandas, objetivo, escalones, indicado, parcial: d.partialView, generada: d.generatedAt, zona: d.period.timeZone };
}

export interface SeriePedida {
  readonly ref: ReferenciaDeMetrica;
  readonly clave: string;
  readonly definicion: DefinicionDeMetrica;
  readonly grano: GranoElegido;
}

/**
 * Lee una serie ahora, con el acceso de este momento: la del dibujo y, si el grano no es el de las observaciones, también
 * las observaciones. La usan la pantalla y la exportación, que vuelve a preguntar antes de armar el archivo.
 */
export async function leerSerie(token: string, asesoradoId: string, p: SeriePedida, periodo: Periodo): Promise<{ readonly estado: EstadoDeSerie; readonly respuestas: readonly Respuesta[] }> {
  const pedido = pedidoDe(p.ref, p.definicion, p.grano, periodo);
  if (!pedido) return { estado: { tipo: 'error', motivo: 'OTRO' }, respuestas: [] };
  const grano = granoDeObservacion(p.definicion);
  const deObservaciones = p.grano !== grano ? pedidoDe(p.ref, p.definicion, grano, periodo) : null;
  const [r, o] = await Promise.all([
    limitarLectura(() => api.proyeccion(token, asesoradoId, pedido.clave, pedido.filtro)),
    deObservaciones ? limitarLectura(() => api.proyeccion(token, asesoradoId, deObservaciones.clave, deObservaciones.filtro)) : Promise.resolve(null),
  ]);
  return { estado: estadoDe(r, o), respuestas: o ? [r, o] : [r] };
}

/**
 * Lee una serie elegida por su camino (GR-26): lo del diccionario, con `leerSerie`; el 1RM estimado, con sus puntos
 * (sin las orientativas, como «Fuerza» en «Analizar»); lo demás del catálogo, con `leerSerieDelCatalogo`. Las dos
 * últimas ya dicen «cargando» si la sesión se perdió: no devuelven respuestas.
 */
export async function leerSerieDelAnalisis(
  token: string,
  asesoradoId: string,
  p: SeriePedida,
  periodo: Periodo,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
): Promise<{ readonly estado: EstadoDeSerie; readonly respuestas: readonly Respuesta[] }> {
  if (caminoDeLaLectura(p.ref.metricId) !== 'CATALOGO') return leerSerie(token, asesoradoId, p, periodo);
  const lectura = { token, asesoradoId, periodo: { desde: periodo.desde, hasta: periodo.hasta, hoy: periodo.hasta, desdeElVinculo: null }, sesionPerdida };
  if (p.ref.metricId === 'entrenamiento.1rm-estimado') {
    const exerciseId = p.ref.exerciseKey ? ejercicioDeLaClave(p.ref.exerciseKey) : null;
    if (!exerciseId) return { estado: { tipo: 'sin-datos' }, respuestas: [] };
    const f = await leerLaFuerza(lectura, exerciseId, p.ref.unit ?? 'kg', false);
    if (f.tipo !== 'lista') return { estado: f, respuestas: [] };
    return { estado: { tipo: 'lista', serie: f.serie, observaciones: f.serie, bandas: f.bandas, objetivo: [], escalones: [], indicado: null, parcial: f.parcial, generada: f.generada, zona: f.zona, fuerza: f.puntos }, respuestas: [] };
  }
  return { estado: await leerSerieDelCatalogo(lectura, p.ref, p.grano), respuestas: [] };
}

/**
 * Las series de las métricas elegidas. Una respuesta tardía de otra selección se descarta. `recargar` vuelve a leer todas
 * (un permiso que cambió); `reintentarFallidas`, solo las que fallaron: es el único «Reintentar» de la vista, y las que se
 * leyeron bien no vuelven a «cargando» (encargo de consolidación, bloque 5).
 */
export function useSeriesDelAnalisis(
  metricas: readonly ReferenciaDeMetrica[],
  grano: GranoElegido,
  /** Otro período que el de la ficha (por ejemplo, el que cubre dos etapas). */
  periodoPropio?: Periodo,
): { readonly series: readonly SerieDelAnalisis[]; readonly recargar: () => void; readonly reintentarFallidas: () => void } {
  const { token, asesoradoId, periodo: periodoDeLaFicha, sesionPerdida, avisarSinAcceso, versionDeAcceso } = useSeguimiento();
  const periodo = periodoPropio ?? periodoDeLaFicha;
  const [estados, setEstados] = useState<Readonly<Record<string, EstadoDeSerie>>>({});
  const [vuelta, setVuelta] = useState(0);
  const generacion = useRef(0);
  const pedidas = useMemo<readonly SeriePedida[]>(
    () =>
      metricas.flatMap((ref) => {
        const definicion = definicionDe(ref);
        if (!definicion) return [];
        return [{ ref, clave: claveDeLaReferencia(ref), definicion, grano: granoPara(definicion, grano) }];
      }),
    [metricas, grano],
  );
  const clave = `${asesoradoId}|${periodo.desde}|${periodo.hasta}|${pedidas.map((p) => `${p.clave}@${p.grano}`).join(',')}|${vuelta}|${versionDeAcceso}`;
  /** Lee una serie y la guarda, si la lectura sigue siendo la vigente (`esta`). */
  const leerUna = (p: SeriePedida, esta: number) => {
    void leerSerieDelAnalisis(token, asesoradoId, p, periodo, sesionPerdida).then(({ estado, respuestas }) => {
      if (esta !== generacion.current || respuestas.some((r) => sesionPerdida(r))) return;
      setEstados((e) => ({ ...e, [p.clave]: estado }));
      // §3.A: el encabezado no puede seguir diciendo «Activo» si la serie dice que el área no está disponible.
      if (estado.tipo === 'sin-acceso') avisarSinAcceso(DOMINIO_DEL_AREA[p.definicion.area]);
    });
  };
  useEffect(() => {
    const esta = ++generacion.current;
    setEstados({});
    for (const p of pedidas) leerUna(p, esta);
    // `clave` resume lo que cambia la lectura; `pedidas` y `periodo` están dentro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  // Las fallidas vuelven a «cargando» y se leen otra vez dentro de la misma lectura: otra selección las descarta.
  const reintentarFallidas = () => {
    const fallidas = pedidas.filter((p) => estados[p.clave]?.tipo === 'error');
    if (fallidas.length === 0) return;
    setEstados((e) => Object.fromEntries(Object.entries(e).filter(([c]) => !fallidas.some((p) => p.clave === c))));
    for (const p of fallidas) leerUna(p, generacion.current);
  };
  const series = pedidas.map((p) => {
    const estado = estados[p.clave] ?? { tipo: 'cargando' as const };
    // La unidad antropométrica sale de los datos: la definición se rehace con ella.
    const definicion = estado.tipo === 'lista' && p.definicion.area === 'ANTROPOMETRIA' ? (definicionDe(p.ref, estado.serie.unit) ?? p.definicion) : p.definicion;
    return { ref: p.ref, clave: p.clave, definicion, grano: p.grano, estado };
  });
  return { series, recargar: () => setVuelta((v) => v + 1), reintentarFallidas };
}

const DOMINIO_DEL_AREA: Readonly<Record<DefinicionDeMetrica['area'], DominioDeAnalisis>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING', ANTROPOMETRIA: 'ANTHROPOMETRY' };

/** Lo que el selector puede ofrecer con los datos y permisos de esta persona en el período (WP-GRAFICOS: la lectura vive en `graficos/lecturas.ts`). */
export type { Disponibles } from '../graficos/lecturas';

const SIN_DISPONIBLES = {
  nutricion: false,
  ejercicios: null,
  antropometria: null,
  coberturaNutricional: null,
  vigencias: { nutricion: [], entrenamiento: [] },
  propios: { NUTRICION: false, ENTRENAMIENTO: false, ANTROPOMETRIA: false },
  leidoEl: null,
  falla: null,
  fallas: { nutricion: null, entrenamiento: null, antropometria: null },
  cargando: true,
} as const;

export function useDisponibles(): Disponibles {
  const { token, asesoradoId, periodo, sesionPerdida, avisarSinAcceso, versionDeAcceso } = useSeguimiento();
  const [d, setD] = useState<Omit<Disponibles, 'recargar'>>(SIN_DISPONIBLES);
  const [vuelta, setVuelta] = useState(0);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  const generacion = useRef(0);
  useEffect(() => {
    const esta = ++generacion.current;
    setD(SIN_DISPONIBLES);
    void leerDisponibles({ token, asesoradoId, periodo: { desde: periodo.desde, hasta: periodo.hasta, hoy: periodo.hasta, desdeElVinculo: null }, sesionPerdida }).then((r) => {
      if (esta !== generacion.current || r === null) return;
      // Un área que dice «no disponible» se avisa: si el encabezado la mostraba activa, se vuelve a preguntar el acceso.
      for (const dominio of r.sinAcceso) avisarSinAcceso(dominio);
      setD({ ...r.disponibles, cargando: false });
    });
    // `avisarSinAcceso` no cambia la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, asesoradoId, periodo.desde, periodo.hasta, sesionPerdida, vuelta, versionDeAcceso]);
  return useMemo(() => ({ ...d, recargar }), [d, recargar]);
}
