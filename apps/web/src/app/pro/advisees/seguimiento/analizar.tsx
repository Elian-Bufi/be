'use client';

/**
 * Analizar («¿Cómo evolucionaron estas variables?»; encargo §8; ESPECIFICACION.md §4). Hasta tres métricas, cada una
 * vista de una proyección de API-PRJ-01 con el cálculo del dominio:
 * - tres modos: «Separadas» (por defecto, un gráfico por métrica), «Juntas» (en valores reales; misma familia y unidad)
 *   y «Cambio relativo» (contra una referencia explícita y positiva). Un modo que no corresponde se deshabilita y dice
 *   por qué. En la URL y en las vistas guardadas siguen siendo `PANELS`, `OVERLAY` y `RELATIVE`;
 * - la referencia del cambio relativo es un rango del período (los primeros N días o un rango fijo), separado del
 *   intervalo que se ve: acercar, alejar o restablecer el gráfico no la mueve; cambia solo con «Aplicar» (DL-126);
 * - los resúmenes, la comparación y la referencia usan las observaciones (días, sesiones o tomas) del rango exacto, aunque
 *   el gráfico esté agrupado por semana;
 * - un panel de lectura persistente para la fecha elegida: el valor exacto nunca depende de pasar el puntero;
 * - «Cómo se calcula», la tabla de datos, el resumen textual y la comparación de dos períodos (sin conclusiones
 *   causales: «coincidencia temporal; no indica causa»);
 * - todo el estado en la URL; un punto abre su registro de origen y al cerrarlo la vista sigue igual.
 *
 * WP-DASHBOARD-COMPRENSION (encargo del 2026-10-09):
 * - **Preguntas primero** (eje 2): sin pregunta ni métricas, se ofrecen las preguntas profesionales antes que la
 *   configuración; una pregunta arma las métricas (o abre el contraste, las etapas o la información) y su encabezado dice
 *   la pregunta, sus datos y su límite. «Análisis personalizado» sigue disponible; cambiar métricas a mano deja la pregunta.
 * - **Agrupar por** (eje 6) reemplaza «Grano»: dice qué admite cada métrica y por qué.
 * - **La referencia del cambio relativo** se muestra solo en ese modo; las bandas de los planes tienen su lista de
 *   etapas, que abre la planificación o compara con la anterior (eje 4).
 * - **La clase del dato** dice la naturaleza del método (eje 3): un índice no es una estimación.
 *
 * WP-ESCRITORIO-AMABLE (parte 2; C-08): la vista se compone como una barra corta (la pregunta, las métricas —que son la
 * leyenda— y los modos, en controles segmentados), los gráficos y la lectura. Lo que se usa de vez en cuando queda a un
 * clic: «Más acciones» (vistas guardadas, descarga, capas, intervalo con fechas, comparar dos períodos) y el pie de los
 * gráficos (tabla de datos, resumen en texto, hitos, etapas y «Cómo se calcula»), que abre una cosa a la vez debajo.
 * No se quitó ninguna función ni cambió ningún parámetro de la URL.
 */
import {
  cambioRelativo,
  claseEnPalabras,
  compararPeriodos,
  etapasDelArea,
  partesDeLaCobertura,
  partesDelResumenTextual,
  periodoDeLasEtapas,
  preguntaProfesional,
  resolverPregunta,
  type EtapaDePlanificacion,
  csvDelAnalisis,
  granoDeObservacion,
  lecturaEnFecha,
  nombreDeLaExportacion,
  textoDeFaltante,
  NOMBRE_DE_DOMINIO,
  numero,
  puntosRelativos,
  rangoDeLaReferencia,
  referenciaElegida,
  resumenTextual,
  resumirPeriodo,
  superposicionPermitida,
  valorConUnidad,
  type DefinicionDeMetrica,
  type LineaDeTiempoResponse,
  type NombreDeIcono,
  type OrigenDeDato,
  type PuntoAnalitico,
  type Referencia,
  type ReferenciaDelCambio,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useEffect, useId, useMemo, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { razonDeFalla, useLectura, useSeguimiento, type MotivoDeFalla } from './contexto';
import { codificarReferencia, hoyEn, leerAnalisis, leerPregunta, parametrosDeAnalisis, parametrosDePeriodo, parametrosDePregunta, type EstadoDeAnalisis, type GranoElegido, type Modo } from './estado';
import { mediodia, xDe, type BandaDePlan, type SerieParaDibujar } from './lienzo';
import { Marca } from './marca';
import { ElegirMetricasDeEntrada } from './entrada';
import { contextoDeLaPregunta, ElegirParametros, ListaDePreguntas, useEtapasDelAno } from './preguntas';
import { nombreDeLaReferencia, SelectorDeMetricas } from './selector';
import { leerSerie, useDisponibles, useSeriesDelAnalisis, type SerieDelAnalisis } from './series';
import { valorParaMostrar } from './valores';
import { VistasGuardadas, vistaRecienAbierta } from './vistas-guardadas';

const Lienzo = dynamic(() => import('./lienzo').then((m) => m.Lienzo), { ssr: false, loading: () => <Cargando /> });
const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });
const ComparacionDeEtapas = dynamic(() => import('./etapas').then((m) => m.ComparacionDeEtapas), { ssr: false, loading: () => <Cargando /> });
const EtapasDelPeriodo = dynamic(() => import('./etapas').then((m) => m.EtapasDelPeriodo), { ssr: false });
const ContrasteConLoIndicado = dynamic(() => import('./contraste').then((m) => m.ContrasteConLoIndicado), { ssr: false, loading: () => <Cargando /> });
const InformacionParaRevisar = dynamic(() => import('./informacion').then((m) => m.InformacionParaRevisar), { ssr: false, loading: () => <Cargando /> });

/** El máximo que lee el análisis en la web (un año, con el día de hoy): el de la comparación de etapas. */
const DIAS_MAXIMOS_DEL_ANALISIS = 366;

/** Qué es cada punto según cómo se agrupa: lo dice el título del panel. */
const AGRUPADA: Readonly<Record<GranoElegido, string>> = { ORIGINAL: 'cada registro', DAY: 'por día', WEEK: 'por semana' };

/** Por qué una métrica deja sin «Cambio relativo»: va después de su nombre («Peso no tiene observaciones…»). */
const MOTIVO_SIN_REFERENCIA: Readonly<Record<string, string>> = {
  ESCALA_NO_ADMITE: 'no admite cambio relativo (no es una escala de razón)',
  SIN_OBSERVACIONES: 'no tiene observaciones en los días de referencia',
  NO_POSITIVA: 'tiene una referencia de cero o negativa',
  FUERA_DEL_PERIODO: 'tiene el rango de referencia fuera del período leído',
};
/** Por qué «Juntas» no está disponible: la frase completa, que va al costado de los modos. */
const MOTIVO_SIN_SUPERPOSICION: Readonly<Record<string, string>> = {
  UNA_SOLA_METRICA: '«Juntas» pide más de una métrica.',
  UNIDADES_DISTINTAS: '«Juntas» pide métricas con la misma unidad.',
  FAMILIAS_DISTINTAS: '«Juntas» pide medidas de la misma clase: no alcanza con que compartan la unidad.',
  SIN_FAMILIA: '«Juntas» no admite alguna de estas métricas.',
};
const CALIDAD: Readonly<Record<PuntoAnalitico['quality'], string>> = { COMPLETE: 'sin faltantes', PARTIAL: 'subtotal de lo registrado', UNKNOWN: 'sin valor conocido' };
/** Un balde incompleto: el día de hoy, que sigue en curso, o una semana que el período corta. */
const textoDeIncompleto = (p: PuntoAnalitico): string => (p.dateEnd ? 'semana sin completar en el período' : 'día en curso: el valor todavía puede cambiar');
const calidadDelPunto = (p: PuntoAnalitico): string => (p.partialBucket ? `${CALIDAD[p.quality]} · ${textoDeIncompleto(p)}` : CALIDAD[p.quality]);
const MEDIO_DIA = 43_200_000;
const HITOS = 'NUTRITION_PLAN_ACTIVATED,TRAINING_PLAN_ACTIVATED,NUTRITION_OBJECTIVE_SET,TRAINING_OBJECTIVE_SET,NUTRITION_REVIEW_RECORDED,TRAINING_REVIEW_RECORDED,FOLLOW_UP_OPENED,FOLLOW_UP_CLOSED';

export function Analizar() {
  const { token, asesoradoId, periodo, parametros, ir, panel } = useSeguimiento();
  const id = useId();
  const estado = useMemo(() => leerAnalisis(parametros), [parametros]);
  const cambiar = (c: Partial<EstadoDeAnalisis>) => ir(parametrosDeAnalisis({ ...estado, ...c }));
  const disponibles = useDisponibles();

  // La pregunta (eje 2): se resuelve con el dominio y con lo que hay de este asesorado.
  const pregunta = useMemo(() => leerPregunta(parametros), [parametros]);
  const necesitaEtapas = pregunta?.id === 'cambio-desde-el-plan' || pregunta?.id === 'comparar-etapas' || estado.bandas;
  const etapasDelAno = useEtapasDelAno(necesitaEtapas);
  const areasConPlan = useMemo(() => {
    if (panel.tipo !== 'listo') return new Set<'NUTRICION' | 'ENTRENAMIENTO'>();
    const d = panel.datos.domains;
    return new Set([...(d.nutrition.available ? (['NUTRICION'] as const) : []), ...(d.training.available ? (['ENTRENAMIENTO'] as const) : [])]);
  }, [panel]);
  const contexto = useMemo(() => contextoDeLaPregunta(disponibles, etapasDelAno.etapas, areasConPlan), [disponibles, etapasDelAno.etapas, areasConPlan]);
  const resolucion = pregunta && !disponibles.cargando && !etapasDelAno.cargando && panel.tipo === 'listo' ? resolverPregunta(pregunta.id, pregunta.params, contexto) : null;
  const destino = resolucion?.estado === 'LISTA' ? resolucion.destino : null;
  const [cambiandoPregunta, setCambiandoPregunta] = useState(false);
  useEffect(() => setCambiandoPregunta(false), [pregunta?.id]);
  // Una pregunta que arma métricas las pone en la URL (y, si fija la etapa, su período): así el resto de «Analizar», la
  // vuelta atrás y las vistas guardadas funcionan igual que con una selección a mano. Comparar dos etapas también: debajo
  // de la tabla A/B quedan sus gráficos, con el período que cubre las dos (encargo §8, recorrido 4). Agrupar, acercar o
  // cambiar la referencia mueven el gráfico, no la tabla: la tabla resume las observaciones originales.
  const etapaA = destino?.tipo === 'ETAPAS' ? destino.a : null;
  const etapaB = destino?.tipo === 'ETAPAS' ? destino.b : null;
  const periodoDeLasDosEtapas = useMemo(() => (etapaA && etapaB ? periodoDeLasEtapas(etapaA, etapaB, hoyEn(), DIAS_MAXIMOS_DEL_ANALISIS) : null), [etapaA, etapaB]);
  const metricasDeLaPregunta = destino?.tipo === 'ANALIZAR' || destino?.tipo === 'ETAPAS' ? destino.metricas.map(codificarReferencia).join(',') : null;
  const periodoDeLaPregunta = destino?.tipo === 'ANALIZAR' ? destino.periodo : periodoDeLasDosEtapas;
  useEffect(() => {
    if (metricasDeLaPregunta === null) return;
    const cambios: Record<string, string | null> = {};
    if (parametros.get('m') !== metricasDeLaPregunta) cambios.m = metricasDeLaPregunta;
    if (periodoDeLaPregunta && (periodo.desde !== periodoDeLaPregunta.desde || periodo.hasta !== periodoDeLaPregunta.hasta))
      Object.assign(cambios, parametrosDePeriodo({ preset: null, desde: periodoDeLaPregunta.desde, hasta: periodoDeLaPregunta.hasta }));
    if (Object.keys(cambios).length > 0) ir({ ...cambios, f: null });
  }, [metricasDeLaPregunta, periodoDeLaPregunta, parametros, periodo.desde, periodo.hasta, ir]);
  /** Cambiar las métricas a mano deja la pregunta: pasa a ser un análisis personalizado. */
  const cambiarMetricas = (metricas: EstadoDeAnalisis['metricas']) => ir({ ...parametrosDeAnalisis({ ...estado, metricas, fecha: null }), ...parametrosDePregunta(null) });
  const mostrarVista =
    !destino || destino.tipo === 'ANALIZAR' || destino.tipo === 'ETAPAS'
      ? (pregunta !== null && (destino?.tipo === 'ANALIZAR' || destino?.tipo === 'ETAPAS')) || estado.metricas.length > 0
      : false;
  // La entrada de Analizar: sin pregunta ni métricas. Quitar la última métrica de una comparación libre vuelve acá.
  const sinEntrada = pregunta === null && estado.metricas.length === 0;
  const { series, recargar } = useSeriesDelAnalisis(estado.metricas, estado.grano);
  const [intervalo, setIntervalo] = useState<{ desde: string; hasta: string } | null>(null);
  const desde = intervalo && intervalo.desde >= periodo.desde ? intervalo.desde : periodo.desde;
  const hasta = intervalo && intervalo.hasta <= periodo.hasta ? intervalo.hasta : periodo.hasta;
  // El resultado de la última exportación vive acá y no en su botón: si la exportación descubre que un permiso cambió, las
  // series se vuelven a pedir, el bloque de la descarga se va con ellas y el aviso tiene que seguir diciendo por qué.
  // `sinArchivo`: no salió ningún archivo. Solo ese aviso sigue a la vista sin series: «Descargado» habla de datos que
  // ya no están en pantalla.
  const [avisoDeExportacion, setAvisoDeExportacion] = useState<AvisoDeExportacion | null>(null);
  const seleccion = `${JSON.stringify(estado.metricas)}|${periodo.desde}|${periodo.hasta}`;
  // Otra selección u otro período: el resultado de la exportación anterior ya no habla de lo que se ve, y el acercamiento
  // se suelta. El intervalo no está en la URL: si sobreviviera a otro análisis, la pantalla mostraría un recorte que nada
  // dice (pasaba al ir de una comparación de etapas acercada al IMC: no se veía ningún punto). Agrupar no lo suelta.
  useEffect(() => {
    setAvisoDeExportacion(null);
    setIntervalo(null);
  }, [seleccion, pregunta?.id]);
  /** Un solo «Reintentar» trae todo lo que falló: las series y, si falló, qué hay en el período. */
  const reintentar = () => {
    recargar();
    if (disponibles.falla) disponibles.recargar();
  };
  // La planificación de una etapa abierta desde la lista de etapas del gráfico (eje 4).
  const [planAbierto, setPlanAbierto] = useState<EtapaDePlanificacion | null>(null);
  // `sinAcceso`: el origen ya no se puede leer con el acceso de ahora; el valor que quedó en pantalla no se repite.
  const [puntoAbierto, setPuntoAbierto] = useState<{ indice: number; punto: PuntoAnalitico; origen: OrigenDeDato | null; sinAcceso?: boolean } | null>(null);

  const listas = series.filter((s): s is SerieDelAnalisis & { estado: Extract<SerieDelAnalisis['estado'], { tipo: 'lista' }> } => s.estado.tipo === 'lista');
  const nombres = series.map((s) => nombreDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios));

  // La referencia del cambio relativo: un rango explícito del período leído (los primeros N días o un rango fijo),
  // calculado sobre las observaciones. No depende del intervalo que se ve: acercar, alejar o restablecer el gráfico no la
  // mueve; solo «Aplicar» la cambia (DL-126).
  const rangoDeReferencia = rangoDeLaReferencia(estado.referencia, periodo);
  const referencias = new Map<string, Referencia>(listas.map((s) => [s.clave, referenciaElegida(s.estado.observaciones, s.definicion, estado.referencia, periodo)]));
  const referenciaFueraDeLoVisible = rangoDeReferencia.hasta < desde || rangoDeReferencia.desde > hasta;
  const clases = new Set(listas.flatMap((s) => s.estado.serie.points.filter((p) => p.value !== null).map((p) => p.dataClass)));
  const superposicion = superposicionPermitida(listas.map((s) => ({ definicion: s.definicion, unidad: s.estado.serie.unit })));
  const sinReferencia = listas.filter((s) => referencias.get(s.clave)?.tipo !== 'valida');
  const relativoPosible = listas.length > 0 && sinReferencia.length === 0;
  const modo: Modo = estado.modo === 'OVERLAY' && !superposicion.permitida ? 'PANELS' : estado.modo === 'RELATIVE' && !relativoPosible ? 'PANELS' : estado.modo;

  // Las etapas de los planes que acompañan a cada panel (WP-ESCRITORIO-AMABLE): cada métrica de un área con plan lleva
  // las de su área. Una medida corporal no ejecuta un plan: lleva las de las otras métricas si son todas de una misma
  // área, para leerse junto a ellas; con dos áreas a la vista, ninguna. El rótulo va una vez por área.
  const hoy = hoyEn();
  const bandasDe = (s: Lista): BandaDePlan[] => s.estado.bandas.map((b) => ({ ...b, area: b.domain === 'NUTRITION' ? 'Nutrición' : 'Entrenamiento' }));
  const conPlan = listas.filter((s) => s.definicion.area !== 'ANTROPOMETRIA');
  const bandasPrestadas = new Set(conPlan.map((s) => s.definicion.area)).size === 1 && conPlan[0] ? bandasDe(conPlan[0]) : [];
  const areasRotuladas = new Set<string>();
  // Una métrica sin ningún punto en las fechas a la vista no se dibuja como un gráfico vacío: lo dice un bloque, en su
  // lugar («no es un cero»). Sigue en la lectura, en la tabla y en la descarga, que dicen lo mismo.
  const tienePuntos = (s: Lista): boolean => s.estado.serie.points.some((p) => p.value !== null && xDe(p) >= mediodia(desde) - MEDIO_DIA && xDe(p) <= mediodia(hasta) + MEDIO_DIA);
  const dibujables: SerieParaDibujar[] = listas.filter(tienePuntos).map((s) => {
    const indice = series.indexOf(s);
    const ref = referencias.get(s.clave);
    const relativos = modo === 'RELATIVE' && ref?.tipo === 'valida' ? new Map(puntosRelativos(s.estado.serie, ref).map((p) => [p.pointId, p.relativo])) : null;
    const deSuPanel = !estado.bandas ? [] : s.definicion.area === 'ANTROPOMETRIA' ? bandasPrestadas : bandasDe(s);
    const areaDeSusBandas = deSuPanel[0]?.area ?? null;
    const rotularBandas = areaDeSusBandas !== null && !areasRotuladas.has(areaDeSusBandas);
    if (areaDeSusBandas !== null) areasRotuladas.add(areaDeSusBandas);
    return {
      indice,
      nombre: tituloDeLaMetrica(nombres[indice] ?? s.definicion.nombre, s.definicion.nombre, s.definicion.nombreCorto),
      nombreCorto: nombres[indice] ?? s.definicion.nombreCorto,
      cadaPunto: AGRUPADA[s.grano] === 'cada registro' ? (s.definicion.area === 'ANTROPOMETRIA' ? 'cada toma' : 'cada sesión') : AGRUPADA[s.grano],
      unidad: s.estado.serie.unit,
      serie: s.estado.serie,
      valor: (p) => (relativos ? (relativos.get(p.pointId) ?? null) : p.value),
      decimales: s.definicion.decimales,
      // Lo planificado que llega en la misma unidad: el objetivo de calorías, un escalón por versión.
      plan: s.estado.objetivo.length > 0 ? { nombre: 'Objetivo', escalones: s.estado.objetivo } : null,
      sinRegistros: s.estado.serie.grain === 'DAY' ? diasSinRegistros(s.estado.serie.gaps, hoy) : [],
      bandas: deSuPanel,
      rotularBandas,
      // Un tramo nuevo que no se compara con el anterior (otro protocolo, método o unidad): dónde empieza y por qué.
      // En Nutrición y Entrenamiento un tramo nuevo es solo un hueco, que ya se ve: no lleva rótulo.
      cortes: (s.definicion.area === 'ANTROPOMETRIA' ? s.estado.serie.segments : []).flatMap((t) => {
        const primero = t.breakReason ? s.estado.serie.points.find((p) => p.segment === t.segment) : undefined;
        return primero && t.breakReason ? [{ fecha: primero.date, texto: t.breakReason.replace(/\.$/, '') }] : [];
      }),
      // La cobertura de lo que se ve, con las partes que escribe el dominio (las mismas de los indicadores y de las
      // comparaciones). En el encabezado van las que el gráfico dibuja: cuántos días, sesiones o tomas tienen valor y
      // cuántos días no tienen registros (lo gris). Los subtotales y el día en curso se ven como puntos huecos, con su
      // leyenda; la cobertura entera está en «Resumen en texto» y en las comparaciones.
      cobertura: partesDeLaCobertura(resumirPeriodo(s.estado.observaciones, s.definicion, desde, hasta, hoy)).filter((parte, i) => i === 0 || /sin registros$/.test(parte)),
    };
  });
  const fechasConDato = useMemo(
    () => [...new Set(listas.flatMap((s) => s.estado.serie.points.filter((p) => p.value !== null && p.date >= desde && p.date <= hasta).map((p) => p.date)))].sort(),
    [listas, desde, hasta],
  );
  const fecha = estado.fecha && estado.fecha >= desde && estado.fecha <= hasta ? estado.fecha : (fechasConDato[fechasConDato.length - 1] ?? null);

  const bandas = estado.bandas
    ? [...new Map(listas.flatMap((s) => s.estado.bandas.map((b) => [b.planVersionId, { ...b, area: b.domain === 'NUTRITION' ? 'Nutrición' : 'Entrenamiento' }] as const))).values()]
    : [];
  const { lectura: hitosLeidos } = useLectura<LineaDeTiempoResponse>(estado.eventos ? `hitos|${asesoradoId}|${periodo.desde}|${periodo.hasta}` : null, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, type: HITOS, limit: '50' }),
  );
  const hitos = estado.eventos && hitosLeidos.tipo === 'listo' ? hitosLeidos.datos.data.entries.map((e) => ({ fecha: e.occurredDate, texto: e.title })) : [];

  // Lo que el gráfico dibuja se puede leer sin verlo: el objetivo de calorías va también en la descripción, en el resumen
  // en texto y en la tabla de datos.
  const descripcion = listas.map((s) => [resumenTextual(s.estado.serie, s.definicion, desde, hasta), objetivoEnTexto(s.estado.objetivo, desde, hasta)].filter(Boolean).join(' ')).join(' ');
  const marcas = estado.metricas.map((_, i) => <Marca key={i} indice={i} />);
  // Con la pregunta de etapas, lo principal es la tabla A/B: la comparación a mano pasa a ser una opción secundaria
  // (plegada, debajo de la tabla), el resumen en texto se pliega como la tabla de datos y no se repiten las acciones de
  // las tarjetas de las etapas. Resultados, cobertura y límites de interpretación quedan a la vista.
  const conEtapas = destino?.tipo === 'ETAPAS' && !cambiandoPregunta;
  const resumenEnTexto = listas.map((s) => {
    const r = partesDelResumenTextual(s.estado.serie, s.definicion, desde, hasta);
    return (
      <div key={s.clave}>
        <p>
          <strong>{r.encabezado}</strong>
          {r.partes.length === 0 ? ': no hay datos en este rango.' : null}
        </p>
        {r.partes.length > 0 ? (
          <ul>
            {r.partes.map((x) => (
              <li key={x}>{x.charAt(0).toUpperCase() + x.slice(1)}.</li>
            ))}
          </ul>
        ) : null}
        {objetivoEnTexto(s.estado.objetivo, desde, hasta) ? <p>{objetivoEnTexto(s.estado.objetivo, desde, hasta)}</p> : null}
      </div>
    );
  });

  // ─── La composición (WP-ESCRITORIO-AMABLE, parte 2; C-08) ───────────────────────────────────────
  // Arriba, una barra corta: la pregunta, las métricas (que son la leyenda) y los modos. Debajo, los gráficos y la
  // lectura. Lo que se usa de vez en cuando queda a un clic: «Más acciones» y el pie de los gráficos, que abre una cosa a
  // la vez debajo de ellos. Son estado de esta visita, no de la URL; la comparación de dos períodos se abre sola si la
  // URL ya trae una, y «Más acciones», si se acaba de abrir una vista guardada (su aviso tiene que verse).
  const [masAcciones, setMasAcciones] = useState(false);
  const [abajo, setAbajo] = useState<DebajoDeLosGraficos | null>(estado.comparacion ? 'comparar' : null);
  const hayComparacion = estado.comparacion !== null;
  // Lo desplegado es del análisis que se está mirando: al volver a la entrada, a elegir otra pregunta, se cierra (si no,
  // la tabla abierta en un análisis aparecía abierta en el siguiente). Cambiar una métrica o el período no lo cierra.
  useEffect(() => {
    if (!sinEntrada) return;
    setMasAcciones(false);
    setAbajo(null);
  }, [sinEntrada]);
  useEffect(() => {
    if (hayComparacion) setAbajo('comparar');
  }, [hayComparacion]);
  useEffect(() => {
    if (!sinEntrada && vistaRecienAbierta()) setMasAcciones(true);
  }, [sinEntrada]);
  // Lo abierto cuenta solo si existe en este análisis: los hitos pueden no haber llegado, y con la pregunta de etapas no
  // están, abajo, ni la lista de etapas ni la comparación a mano. Una región vacía no se dibuja.
  const abierto: DebajoDeLosGraficos | null =
    (abajo === 'hitos' && hitos.length === 0) || (abajo === 'etapas' && (!estado.bandas || bandas.length === 0 || conEtapas)) || (abajo === 'comparar' && conEtapas) ? null : abajo;
  const alternar = (que: DebajoDeLosGraficos) => setAbajo(abierto === que ? null : que);

  // Lo que una métrica elegida muestra cuando no es un gráfico, en su lugar (pantalla 15 del diseño).
  const bloques = series.flatMap((s, i) => {
    const sinPuntos = { tipo: 'sin-puntos', area: s.definicion.area, desde, hasta } as const;
    const sinGrafico: EstadoSinGrafico | null = s.estado.tipo === 'sin-datos' ? sinPuntos : s.estado.tipo !== 'lista' ? s.estado : tienePuntos(s as Lista) ? null : sinPuntos;
    return sinGrafico ? [{ indice: i, nodo: <EstadoDeUnaSerie indice={i} nombre={nombres[i] ?? s.definicion.nombre} estado={sinGrafico} onReintentar={reintentar} /> }] : [];
  });
  const laPregunta = pregunta ? preguntaProfesional(pregunta.id) : null;
  const enCurso = pregunta !== null && destino !== null && !cambiandoPregunta;
  const conGraficos = mostrarVista && dibujables.length > 0;
  // Con la composición de gráficos y lectura, la vista no es una tarjeta: son dos, sobre el fondo de la página (y, en la
  // comparación de etapas, una más arriba, con las dos etapas y su tabla). La entrada tampoco: son tres tarjetas, una
  // por camino. Las respuestas sin gráficos siguen en la suya.
  const sinTarjeta = mostrarVista || sinEntrada;
  /** Vuelve a la entrada de Analizar, a elegir otra pregunta o las métricas a mano. Atrás recupera lo que había. */
  const volverALaEntrada = () => {
    ir({ ...parametrosDeAnalisis({ ...estado, metricas: [], fecha: null, comparacion: null }), ...parametrosDePregunta(null) }, { agregarAlHistorial: true });
  };
  const motivoDeJuntas = superposicion.permitida ? null : (MOTIVO_SIN_SUPERPOSICION[superposicion.motivo ?? ''] ?? null);
  const motivoDeRelativo = relativoPosible
    ? null
    : listas.length === 0
      ? '«Cambio relativo» pide al menos una métrica cargada.'
      : `«Cambio relativo»: ${sinReferencia.map((s) => `${nombres[series.indexOf(s)]} ${MOTIVO_SIN_REFERENCIA[(referencias.get(s.clave) as { motivo?: string } | undefined)?.motivo ?? ''] ?? 'no lo admite'}`).join('; ')}.`;
  // Con la agrupación de siempre (por día), que el peso vaya «cada toma» ya lo dice el encabezado de su gráfico.
  const sinAgrupar = estado.grano === 'DAY' ? [] : series.filter((s) => s.grano !== estado.grano);
  const hayAvisoDeModo = motivoDeJuntas !== null || motivoDeRelativo !== null || sinAgrupar.length > 0;
  // La leyenda dice solo lo que hay dibujado: un estado que no aparece no ocupa lugar.
  const puntosDibujados = dibujables.flatMap((d) => d.serie.points.filter((p) => p.value !== null && p.date >= desde && p.date <= hasta));
  const hayHuecos = puntosDibujados.some((p) => p.quality === 'PARTIAL' || p.partialBucket);
  // Varios cortes en un gráfico llevan un número (el motivo escrito se pisaba): acá, cuál es cada uno. Con uno solo, el
  // gráfico ya lo dice.
  const cortesNumerados =
    modo === 'PANELS'
      ? dibujables.flatMap((d) => {
          const visibles = [...(d.cortes ?? [])].sort((a, b) => a.fecha.localeCompare(b.fecha)).filter((c) => c.fecha > desde && c.fecha <= hasta);
          return visibles.length > 1 ? visibles.map((c, i) => ({ ...c, numero: i + 1 })) : [];
        })
      : [];
  const fechasDeLaTabla = new Set(listas.flatMap((s) => s.estado.serie.points.filter((p) => p.date >= desde && p.date <= hasta).map((p) => p.date))).size;

  return (
    <section className={sinTarjeta ? 'seccion analizar analizar--sin-tarjeta' : 'seccion analizar'} aria-labelledby={`${id}-titulo`}>
      <div className={enCurso ? 'pregunta-en-curso pregunta-activa' : 'pregunta-en-curso'}>
        <h2 id={`${id}-titulo`}>{laPregunta ? laPregunta.pregunta : sinEntrada ? '¿Qué querés mirar?' : 'Comparación libre'}</h2>
        {sinEntrada ? <p className="pregunta-en-curso__detalle">Dos caminos para lo mismo: una pregunta que ya trae los gráficos armados, o las métricas que elijas.</p> : null}
        {!sinEntrada && !laPregunta ? <p className="pregunta-en-curso__detalle">Sin pregunta: las métricas las elegís vos, de cualquier área.</p> : null}
        {enCurso && pregunta && destino ? (
          <p className="pregunta-en-curso__detalle">
            {parametrosEnPalabras(pregunta.params, destino, disponibles)}{' '}
            <button type="button" className="boton boton--enlace" onClick={() => setCambiandoPregunta(true)}>
              Cambiar los datos
            </button>
          </p>
        ) : null}
        {sinEntrada ? null : (
          <div className="pregunta-en-curso__acciones">
            <button type="button" className="boton boton--secundario boton--compacto" onClick={volverALaEntrada}>
              <Icono nombre="pregunta" tamano={18} />
              {laPregunta ? 'Cambiar la pregunta' : 'Empezar por una pregunta'}
            </button>
            {mostrarVista ? (
              <button type="button" className="boton boton--quieto boton--compacto" aria-expanded={masAcciones} aria-controls={`${id}-mas`} onClick={() => setMasAcciones(!masAcciones)}>
                <Icono nombre="menu" tamano={18} />
                Más acciones
              </button>
            ) : null}
          </div>
        )}
      </div>
      {sinEntrada ? (
        <div className="entrada-de-analizar">
          <div className="entrada-de-analizar__columna">
            <ListaDePreguntas />
            {/* Retomar una vista guardada también desde el comienzo: antes había que armar un análisis cualquiera para verlas. */}
            <VistasGuardadas estado={estado} pregunta={null} soloAbrir />
          </div>
          <ElegirMetricasDeEntrada
            disponibles={disponibles}
            onVer={(metricas) => ir({ ...parametrosDeAnalisis({ ...estado, metricas, fecha: null, comparacion: null }), ...parametrosDePregunta(null) }, { agregarAlHistorial: true })}
          />
        </div>
      ) : null}
      {pregunta && resolucion === null ? <Cargando /> : null}
      {pregunta && resolucion && (resolucion.estado === 'FALTA_ELEGIR' || cambiandoPregunta) ? (
        <ElegirParametros
          key={JSON.stringify(pregunta)}
          pregunta={pregunta}
          resolucion={resolucion.estado === 'FALTA_ELEGIR' ? resolucion : null}
          contexto={contexto}
          disponibles={disponibles}
          cargando={etapasDelAno.cargando}
          falla={etapasDelAno.falla}
          onListo={() => setCambiandoPregunta(false)}
        />
      ) : null}
      {/* El límite de la pregunta va, una sola vez, al pie de los gráficos; si la respuesta no tiene gráficos, acá. */}
      {enCurso && laPregunta && !conGraficos ? <p className="nota pregunta-en-curso__limite">{laPregunta.limite}</p> : null}
      {destino?.tipo === 'CONTRASTE' && !cambiandoPregunta ? <ContrasteConLoIndicado area={destino.area} exerciseKey={destino.exerciseKey} /> : null}
      {destino?.tipo === 'ETAPAS' && !cambiandoPregunta ? (
        <div className="tarjeta-de-respuesta">
          <ComparacionDeEtapas area={destino.area} a={destino.a} b={destino.b} metricas={destino.metricas} etapas={etapasDelAno.etapas[destino.area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING']} disponibles={disponibles} />
          {listas.length > 0 ? (
            <ComparacionDePeriodos series={listas} nombres={nombres} todas={series} estado={estado} cambiar={cambiar} minimo={periodo.desde} maximo={periodo.hasta} secundaria />
          ) : null}
        </div>
      ) : null}
      {destino?.tipo === 'INFORMACION' && !cambiandoPregunta ? <InformacionParaRevisar area={destino.area} disponibles={disponibles} /> : null}
      {mostrarVista ? (
        <>
          <div className="barra-de-analizar">
            <SelectorDeMetricas elegidas={estado.metricas} disponibles={disponibles} onCambiar={cambiarMetricas} marcas={marcas} />
            <div className="modos-de-analizar">
              <fieldset className="segmentos">
                <legend>Ver como</legend>
                <div className="segmentos__fila">
                  <ModoElegible modo="PANELS" actual={modo} cambiar={(m) => cambiar({ modo: m })} icono="separadas" texto="Separadas" motivo={null} idDelAviso={`${id}-aviso`} />
                  <ModoElegible modo="OVERLAY" actual={modo} cambiar={(m) => cambiar({ modo: m })} icono="juntas" texto="Juntas" motivo={motivoDeJuntas} idDelAviso={`${id}-aviso`} />
                  <ModoElegible modo="RELATIVE" actual={modo} cambiar={(m) => cambiar({ modo: m })} icono="cambio-relativo" texto="Cambio relativo" motivo={motivoDeRelativo} idDelAviso={`${id}-aviso`} />
                </div>
              </fieldset>
              <fieldset className="segmentos">
                <legend>Agrupar por</legend>
                <div className="segmentos__fila">
                  {(['ORIGINAL', 'DAY', 'WEEK'] as const).map((g) => (
                    <label key={g} className="segmento">
                      <input type="radio" name={`${id}-grano`} checked={estado.grano === g} aria-describedby={sinAgrupar.length > 0 ? `${id}-aviso` : undefined} onChange={() => cambiar({ grano: g as GranoElegido })} />
                      {g === 'ORIGINAL' ? 'Registro' : g === 'DAY' ? 'Día' : 'Semana'}
                    </label>
                  ))}
                </div>
              </fieldset>
              {/* Por qué un modo no está disponible, o qué métrica no admite la agrupación elegida: dicho al lado. */}
              {hayAvisoDeModo ? (
                <ul id={`${id}-aviso`} className="modos-de-analizar__aviso">
                  {motivoDeJuntas !== null ? <li className="modo-no-disponible">{motivoDeJuntas}</li> : null}
                  {motivoDeRelativo !== null ? <li className="modo-no-disponible">{motivoDeRelativo}</li> : null}
                  {sinAgrupar.map((s) => (
                    <li key={s.clave} className="agrupar-por__motivo">
                      {nombres[series.indexOf(s)]}: {s.grano === 'ORIGINAL' ? (s.definicion.area === 'ANTROPOMETRIA' ? 'cada toma (las tomas no se agrupan)' : 'cada sesión (las series no se agrupan entre sesiones)') : s.grano === 'DAY' ? 'por día' : 'por semana'}.
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {modo === 'RELATIVE' ? (
              <ElegirReferencia
                // Se rearma si cambia la referencia o su rango (otro período): el editor arranca de lo vigente.
                key={`${JSON.stringify(estado.referencia)}|${rangoDeReferencia.desde}|${rangoDeReferencia.hasta}`}
                referencia={estado.referencia}
                rango={rangoDeReferencia}
                periodo={periodo}
                visible={intervalo ? { desde, hasta } : null}
                fueraDeLoVisible={referenciaFueraDeLoVisible}
                onAplicar={(referencia) => cambiar({ referencia })}
              />
            ) : null}
          </div>

          {masAcciones ? (
            <div id={`${id}-mas`} className="mas-acciones" role="group" aria-label="Más acciones">
              <VistasGuardadas estado={estado} pregunta={pregunta} />
              {listas.length > 0 ? (
                <ExportarCsv series={listas} nombres={nombres} todas={series} desde={desde} hasta={hasta} aviso={avisoDeExportacion?.texto ?? null} onAviso={setAvisoDeExportacion} onAccesoCambiado={recargar} />
              ) : null}
              <fieldset className="capas">
                <legend>Capas de los gráficos</legend>
                <label className="capa">
                  <input type="checkbox" checked={estado.bandas} onChange={() => cambiar({ bandas: !estado.bandas })} />
                  Etapas de los planes
                </label>
                <label className="capa">
                  <input type="checkbox" checked={estado.eventos} onChange={() => cambiar({ eventos: !estado.eventos })} />
                  Hitos (activaciones, objetivos, revisiones)
                </label>
              </fieldset>
              <div>
                <SeleccionDeIntervalo desde={desde} hasta={hasta} minimo={periodo.desde} maximo={periodo.hasta} onCambiar={(d, h) => setIntervalo({ desde: d, hasta: h })} />
                {listas.length > 0 && !conEtapas ? (
                  <p>
                    <button type="button" className="boton boton--enlace" aria-expanded={abierto === 'comparar'} aria-controls={`${id}-abajo`} onClick={() => alternar('comparar')}>
                      Comparar dos períodos, con fechas elegidas a mano
                    </button>
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="analizar__dos-columnas">
            <div className="tarjeta-de-graficos analizar__lienzo">
              {intervalo ? (
                <p className="nota">
                  Intervalo: {diaCivil(desde)} al {diaCivil(hasta)}.{' '}
                  <button type="button" className="boton boton--enlace" onClick={() => setIntervalo(null)}>
                    Restablecer vista
                  </button>
                </p>
              ) : null}
              {estado.metricas.length === 0 ? <p>Elegí una métrica o una pregunta para empezar.</p> : null}
              {/* En «Separadas», cada bloque va entre los gráficos, en su lugar (lo acomoda el lienzo). Con las métricas en
                  un solo gráfico, o sin ninguno todavía, van acá arriba. */}
              {modo === 'PANELS' && dibujables.length > 0
                ? null
                : bloques.map((b) => (
                    <div key={b.indice} className="grafico grafico--sin-dibujo">
                      {b.nodo}
                    </div>
                  ))}
              {listas.some((s) => s.estado.parcial) ? <p className="nota">Vista parcial: hay datos de esta área que no ves (los de otro profesional).</p> : null}
              {dibujables.length > 0 ? (
                <>
                  <Lienzo
                    modo={modo}
                    series={dibujables}
                    desde={desde}
                    hasta={hasta}
                    fecha={fecha}
                    fechasConDato={fechasConDato}
                    onFecha={(f) => cambiar({ fecha: f })}
                    onPunto={(indice, punto) => {
                      cambiar({ fecha: punto.date });
                      setPuntoAbierto({ indice, punto, origen: null });
                    }}
                    onIntervalo={(d, h) => setIntervalo({ desde: d, hasta: h })}
                    bandas={bandas}
                    hitos={abierto === 'hitos' ? hitos : []}
                    referencia={modo === 'RELATIVE' ? { desde: rangoDeReferencia.desde, hasta: rangoDeReferencia.hasta } : null}
                    tituloCompartido={modo === 'OVERLAY' ? tituloConjunto(dibujables.map((d) => d.nombre)) : undefined}
                    descripcion={descripcion}
                    estados={modo === 'PANELS' ? bloques : undefined}
                  />
                  {/* La base de cada métrica en el cambio relativo: su regla, su rango, su valor y cuántas observaciones tiene. */}
                  {modo === 'RELATIVE' ? (
                    <ul className="referencias" aria-label="El cero de cada métrica">
                      {listas.map((s) => {
                        const r = referencias.get(s.clave);
                        const indice = series.indexOf(s);
                        return r?.tipo === 'valida' ? (
                          <li key={s.clave}>
                            <Marca indice={indice} /> <strong>{nombres[indice]}</strong>: el cero es la {textoDeReferencia(r, s)}
                          </li>
                        ) : null;
                      })}
                    </ul>
                  ) : null}
                  {/* Cómo se lee una marca: solo lo que está dibujado. La métrica no va acá: la nombran su gráfico y su línea. */}
                  {hayHuecos || clases.has('REPORTED') || clases.has('DERIVED') || cortesNumerados.length > 0 ? (
                    <ul className="leyenda" aria-label="Cómo se lee cada marca">
                      {hayHuecos ? (
                        <li>
                          <Marca indice={0} hueco /> Hueco: subtotal (falta algún dato), o día o semana sin completar
                        </li>
                      ) : null}
                      {cortesNumerados.map((c) => (
                        <li key={`${c.numero}-${c.fecha}`}>
                          <strong>{c.numero}</strong> {diaCivil(c.fecha)}: {c.texto.charAt(0).toLowerCase() + c.texto.slice(1)} (no se compara con lo anterior)
                        </li>
                      ))}
                      {clases.has('REPORTED') ? (
                        <li>
                          <Marca indice={0} clase="REPORTED" /> Contorno cortado: reportado por la persona, no medido
                        </li>
                      ) : null}
                      {clases.has('DERIVED') ? (
                        <li>
                          <Marca indice={0} clase="DERIVED" /> Con un punto adentro: calculado por un método (la lectura dice si es un índice, una suma o una estimación)
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                  <div className="pie-de-graficos">
                    <BotonDelPie que="tabla" abierto={abierto} alternar={alternar} controla={`${id}-abajo`} icono="tabla" texto={`Tabla de datos (${numero(fechasDeLaTabla)} ${fechasDeLaTabla === 1 ? 'fecha' : 'fechas'})`} />
                    <BotonDelPie que="texto" abierto={abierto} alternar={alternar} controla={`${id}-abajo`} icono="texto" texto="Resumen en texto" />
                    {hitos.length > 0 ? <BotonDelPie que="hitos" abierto={abierto} alternar={alternar} controla={`${id}-abajo`} icono="hito" texto={`Hitos (${numero(hitos.length)})`} /> : null}
                    {/* Con la pregunta de etapas, las tarjetas A y B ya abren cada planificación y «Cambiar los datos» elige otras. */}
                    {estado.bandas && bandas.length > 0 && !conEtapas ? <BotonDelPie que="etapas" abierto={abierto} alternar={alternar} controla={`${id}-abajo`} icono="comparar" texto="Comparar etapas" /> : null}
                    <BotonDelPie que="calculo" abierto={abierto} alternar={alternar} controla={`${id}-abajo`} icono="info" texto="Cómo se calcula" />
                  </div>
                  <p className="pie-de-graficos__limite">
                    {enCurso && laPregunta ? `${laPregunta.limite} ` : ''}Coincidencia temporal: no indica causa.
                  </p>
                </>
              ) : null}
            </div>

            {/* La lectura queda al costado de los gráficos mientras se recorren las fechas. Sin ningún gráfico todavía,
                dice para qué sirve: la columna no aparece y desaparece. */}
            {dibujables.length === 0 && estado.metricas.length > 0 ? (
              <div className="tarjeta-de-lectura analizar__lectura">
                <section className="panel-de-lectura" aria-label="Lectura">
                  <h3>Lectura</h3>
                  <p className="nota">Cuando un gráfico tenga datos, elegí una fecha y sus valores se leen acá.</p>
                </section>
              </div>
            ) : null}
            {dibujables.length > 0 ? (
              <div className="tarjeta-de-lectura analizar__lectura">
                <PanelDeLectura
                  fecha={fecha}
                  fechasConDato={fechasConDato}
                  series={listas}
                  nombres={nombres}
                  todas={series}
                  referencias={modo === 'RELATIVE' ? referencias : null}
                  onFecha={(f) => cambiar({ fecha: f })}
                  onAbrir={(indice, punto) => setPuntoAbierto({ indice, punto, origen: null })}
                />
              </div>
            ) : null}
          </div>

          {/* Lo que abre el pie de los gráficos (o «Más acciones», para comparar a mano): una cosa a la vez. */}
          {listas.length > 0 && abierto !== null ? (
            <div id={`${id}-abajo`} className="bajo-los-graficos">
              {abierto === 'tabla' ? <TablaDeDatos series={listas} nombres={nombres} todas={series} desde={desde} hasta={hasta} /> : null}
              {abierto === 'texto' ? (
                <section aria-labelledby={`${id}-resumen`} className="resumen-en-texto">
                  <h3 id={`${id}-resumen`}>Resumen en texto de lo que se ve</h3>
                  {resumenEnTexto}
                </section>
              ) : null}
              {abierto === 'hitos' ? (
                <section aria-labelledby={`${id}-hitos`} className="hitos">
                  <h3 id={`${id}-hitos`}>Hitos del período ({numero(hitos.length)}): las líneas verticales punteadas</h3>
                  <ul>
                    {hitos.map((h, i) => (
                      <li key={`${h.fecha}-${i}`}>
                        {diaCivil(h.fecha)} · {h.texto}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {abierto === 'etapas' ? (
                <section aria-labelledby={`${id}-etapas`} className="etapas-del-grafico">
                  <h3 id={`${id}-etapas`}>Etapas de los planes en el período: abrir la planificación o comparar</h3>
                  {(['NUTRICION', 'ENTRENAMIENTO'] as const).map((area) => {
                    const dominio = area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING';
                    const deLasBandas = etapasDelArea(
                      bandas.filter((b) => b.domain === dominio),
                      dominio,
                      hoyEn(),
                      listas[0]?.estado.generada ?? new Date().toISOString(),
                    );
                    return (
                      <EtapasDelPeriodo
                        key={area}
                        etapas={deLasBandas}
                        area={area}
                        onVerPlan={(e: EtapaDePlanificacion) => setPlanAbierto(e)}
                        onComparar={(a: EtapaDePlanificacion, b: EtapaDePlanificacion) => {
                          // La respuesta trae sus dos etapas arriba: la lista de abajo se cierra.
                          setAbajo(null);
                          ir(parametrosDePregunta({ id: 'comparar-etapas', params: { area, stageA: a.planVersionId, stageB: b.planVersionId } }), { agregarAlHistorial: true });
                        }}
                      />
                    );
                  })}
                </section>
              ) : null}
              {abierto === 'calculo' ? <ComoSeCalcula series={listas} nombres={nombres} todas={series} /> : null}
              {abierto === 'comparar' ? <ComparacionDePeriodos series={listas} nombres={nombres} todas={series} estado={estado} cambiar={cambiar} minimo={periodo.desde} maximo={periodo.hasta} /> : null}
            </div>
          ) : null}
          {/* Si la descarga descubrió que un permiso cambió y ya no hay series, su aviso sigue a la vista. */}
          {listas.length === 0 && avisoDeExportacion?.sinArchivo ? (
            <div className="exportar">
              <p className="nota" role="status">
                {avisoDeExportacion.texto}
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      <PanelDeRegistro
        origen={planAbierto ? { type: planAbierto.dominio === 'NUTRITION' ? 'NUTRITION_PLAN_VERSION' : 'TRAINING_PLAN_VERSION', id: planAbierto.planVersionId } : null}
        titulo={planAbierto ? `${planAbierto.dominio === 'NUTRITION' ? 'Nutrición' : 'Entrenamiento'} · versión ${planAbierto.etiqueta.replace(/^v/, '')}` : ''}
        numeroDeVersion={planAbierto ? Number(planAbierto.etiqueta.replace(/^v/, '')) || undefined : undefined}
        onCerrar={() => setPlanAbierto(null)}
      />
      <PanelDeRegistro
        origen={puntoAbierto ? (puntoAbierto.origen ?? puntoAbierto.punto.sources[0] ?? null) : null}
        titulo={puntoAbierto ? `${nombres[puntoAbierto.indice] ?? ''} · ${diaCivil(puntoAbierto.punto.date)}` : ''}
        onCerrar={() => setPuntoAbierto(null)}
        onNoDisponible={() => {
          // Un permiso cambió desde que se cargó la pantalla: el punto no se vuelve a mostrar y las series se piden de nuevo.
          setPuntoAbierto((p) => (p ? { ...p, sinAcceso: true } : p));
          recargar();
        }}
      >
        {puntoAbierto && !puntoAbierto.sinAcceso ? <DetalleDelPunto abierto={puntoAbierto} serie={series[puntoAbierto.indice]} onOrigen={(o) => setPuntoAbierto({ ...puntoAbierto, origen: o })} /> : null}
      </PanelDeRegistro>
    </section>
  );
}

/** Lo que el pie de los gráficos (o «Más acciones») abre debajo de ellos. */
type DebajoDeLosGraficos = 'tabla' | 'texto' | 'hitos' | 'etapas' | 'calculo' | 'comparar';

/** Un enlace del pie de los gráficos: abre o cierra su parte debajo de ellos, y dice si está abierta. */
function BotonDelPie({
  que,
  abierto,
  alternar,
  controla,
  icono,
  texto,
}: {
  que: DebajoDeLosGraficos;
  abierto: DebajoDeLosGraficos | null;
  alternar: (que: DebajoDeLosGraficos) => void;
  controla: string;
  icono: NombreDeIcono;
  texto: string;
}) {
  return (
    <button type="button" className="boton boton--enlace" aria-expanded={abierto === que} aria-controls={abierto === que ? controla : undefined} onClick={() => alternar(que)}>
      <Icono nombre={icono} tamano={18} />
      {texto}
    </button>
  );
}

/**
 * Un modo de «Ver como», como segmento de un control segmentado: la opción nativa sigue adentro (el teclado, el lector
 * de pantalla y el clic son los de siempre). Si no está disponible se apaga, y el motivo se dice al lado de la barra.
 */
function ModoElegible({ modo, actual, cambiar, icono, texto, motivo, idDelAviso }: { modo: Modo; actual: Modo; cambiar: (m: Modo) => void; icono: NombreDeIcono; texto: string; motivo: string | null; idDelAviso: string }) {
  return (
    <label className="segmento modo-elegible">
      <input type="radio" name="modo-de-lectura" checked={actual === modo} disabled={motivo !== null} aria-describedby={motivo ? idDelAviso : undefined} onChange={() => cambiar(modo)} />
      <Icono nombre={icono} tamano={18} />
      {texto}
    </label>
  );
}

function SeleccionDeIntervalo({ desde, hasta, minimo, maximo, onCambiar }: { desde: string; hasta: string; minimo: string; maximo: string; onCambiar: (d: string, h: string) => void }) {
  const id = useId();
  return (
    <details className="intervalo">
      <summary>Elegir un intervalo con fechas (también se puede arrastrar sobre un gráfico)</summary>
      <div className="acciones">
        <div className="campo">
          <label htmlFor={`${id}-d`}>Desde</label>
          <input id={`${id}-d`} type="date" min={minimo} max={hasta} value={desde} onChange={(e) => e.target.value && onCambiar(e.target.value, hasta)} />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-h`}>Hasta</label>
          <input id={`${id}-h`} type="date" min={desde} max={maximo} value={hasta} onChange={(e) => e.target.value && onCambiar(desde, e.target.value)} />
        </div>
      </div>
    </details>
  );
}

/** La referencia en palabras, con su rango efectivo. */
function descripcionDeLaReferencia(r: ReferenciaDelCambio, rango: { readonly desde: string; readonly hasta: string; readonly dentroDelPeriodo: boolean }): string {
  if (r.kind === 'FIRST_DAYS') return `los primeros ${numero(r.days)} ${r.days === 1 ? 'día' : 'días'} del período, del ${diaCivil(rango.desde)} al ${diaCivil(rango.hasta)}.`;
  return `rango fijo, del ${diaCivil(rango.desde)} al ${diaCivil(rango.hasta)}${rango.dentroDelPeriodo ? '' : ' (fuera del período leído: ampliá el período o elegí otra referencia)'}.`;
}

/**
 * La referencia del cambio relativo (DL-126): explícita y separada del intervalo que se ve. Se elige en un borrador y se
 * aplica con un botón; acercar, alejar o restablecer el gráfico no la toca. Queda en la URL y en las vistas guardadas.
 */
function ElegirReferencia({
  referencia,
  rango,
  periodo,
  visible,
  fueraDeLoVisible,
  onAplicar,
}: {
  referencia: ReferenciaDelCambio;
  rango: { readonly desde: string; readonly hasta: string; readonly dentroDelPeriodo: boolean };
  periodo: { readonly desde: string; readonly hasta: string };
  /** El intervalo visible, si se acercó el gráfico: se puede copiar como rango, y aun así hay que aplicarlo. */
  visible: { readonly desde: string; readonly hasta: string } | null;
  /** La referencia quedó fuera de lo que se ve (el gráfico está acercado): se dice, porque los porcentajes siguen siendo contra ella. */
  fueraDeLoVisible: boolean;
  onAplicar: (r: ReferenciaDelCambio) => void;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  const [tipo, setTipo] = useState<ReferenciaDelCambio['kind']>(referencia.kind);
  const [dias, setDias] = useState(referencia.kind === 'FIRST_DAYS' ? referencia.days : 7);
  const [inicio, setInicio] = useState(rango.desde);
  const [fin, setFin] = useState(rango.hasta);
  const diasValidos = Number.isInteger(dias) && dias >= 1 && dias <= 31;
  const rangoValido = !!inicio && !!fin && inicio <= fin && inicio >= periodo.desde && fin <= periodo.hasta;
  const valida = tipo === 'FIRST_DAYS' ? diasValidos : rangoValido;
  return (
    <fieldset className="referencia-del-cambio">
      <legend className="visualmente-oculto">Referencia del cambio relativo</legend>
      <p className="referencia-vigente">
        <strong>Referencia:</strong> {descripcionDeLaReferencia(referencia, rango)} No cambia al acercar, alejar o restablecer el gráfico
        {fueraDeLoVisible ? '; ahora queda fuera del intervalo visible, y los porcentajes siguen siendo contra ella' : ''}.
      </p>
      {abierta ? (
        <div className="referencia-del-cambio__editor">
          <label className="capa">
            <input type="radio" name={`${id}-tipo`} checked={tipo === 'FIRST_DAYS'} onChange={() => setTipo('FIRST_DAYS')} />
            Los primeros días del período
          </label>
          {tipo === 'FIRST_DAYS' ? (
            <div className="campo">
              <label htmlFor={`${id}-dias`}>Cantidad de días (de 1 a 31)</label>
              <input id={`${id}-dias`} type="number" min={1} max={31} value={Number.isFinite(dias) ? dias : ''} onChange={(e) => setDias(Number(e.target.value))} />
            </div>
          ) : null}
          <label className="capa">
            <input type="radio" name={`${id}-tipo`} checked={tipo === 'RANGE'} onChange={() => setTipo('RANGE')} />
            Un rango de fechas fijo
          </label>
          {tipo === 'RANGE' ? (
            <div className="acciones">
              <div className="campo">
                <label htmlFor={`${id}-desde`}>Desde</label>
                <input id={`${id}-desde`} type="date" min={periodo.desde} max={periodo.hasta} value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor={`${id}-hasta`}>Hasta</label>
                <input id={`${id}-hasta`} type="date" min={periodo.desde} max={periodo.hasta} value={fin} onChange={(e) => setFin(e.target.value)} />
              </div>
              {visible ? (
                <button
                  type="button"
                  className="boton boton--enlace"
                  onClick={() => {
                    setInicio(visible.desde);
                    setFin(visible.hasta);
                  }}
                >
                  Copiar el intervalo visible
                </button>
              ) : null}
            </div>
          ) : null}
          {!valida ? (
            <p className="campo__error">{tipo === 'FIRST_DAYS' ? 'Elegí entre 1 y 31 días.' : 'Elegí un rango dentro del período, con el inicio antes del final.'}</p>
          ) : null}
          <div className="acciones">
            <button
              type="button"
              className="boton boton--secundario"
              disabled={!valida}
              onClick={() => {
                onAplicar(tipo === 'FIRST_DAYS' ? { kind: 'FIRST_DAYS', days: dias } : { kind: 'RANGE', start: inicio, end: fin });
                setAbierta(false);
              }}
            >
              Aplicar la referencia
            </button>
            <button type="button" className="boton boton--enlace" onClick={() => setAbierta(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="boton boton--enlace" onClick={() => setAbierta(true)}>
          Cambiar la referencia
        </button>
      )}
    </fieldset>
  );
}

/** `sin-puntos`: una métrica que se leyó bien y no tiene ningún punto en las fechas a la vista (o no tiene nada en el período). */
type EstadoSinGrafico = Exclude<SerieDelAnalisis['estado'], { tipo: 'lista' } | { tipo: 'sin-datos' }> | { readonly tipo: 'sin-puntos'; readonly area: DefinicionDeMetrica['area']; readonly desde: string; readonly hasta: string };

/** Qué es lo que no hay cuando una métrica no tiene puntos, según su área. */
const SIN_PUNTOS: Readonly<Record<DefinicionDeMetrica['area'], { readonly titulo: string; readonly que: string }>> = {
  NUTRICION: { titulo: 'Sin registros de comida en estas fechas', que: 'registros de comida' },
  ENTRENAMIENTO: { titulo: 'Sin sesiones en estas fechas', que: 'sesiones registradas con este ejercicio' },
  ANTROPOMETRIA: { titulo: 'Sin tomas en estas fechas', que: 'tomas registradas con esta medida' },
};
const ICONO_DE_FALLA: Readonly<Record<MotivoDeFalla, NombreDeIcono>> = { LIMITE: 'espera', RED: 'sin-conexion', SERVICIO: 'servicio', OTRO: 'aviso' };

/**
 * Lo que una métrica elegida muestra cuando no es un gráfico (WP-ESCRITORIO-AMABLE, pantalla 15): va en el lugar de su
 * gráfico, con su nombre y su color, y dice qué pasa y qué se puede hacer. El estado se reconoce por su ícono y por su
 * título, no por un color. Una falla nunca se presenta como ausencia de datos, y una ausencia nunca como un cero.
 */
function EstadoDeUnaSerie({ indice, nombre, estado, onReintentar }: { indice: number; nombre: string; estado: EstadoSinGrafico; onReintentar: () => void }) {
  const c: { readonly icono: NombreDeIcono; readonly titulo: string | null; readonly texto: string } =
    estado.tipo === 'cargando'
      ? { icono: 'cargando', titulo: null, texto: `Cargando ${nombre}…` }
      : estado.tipo === 'sin-acceso'
        ? { icono: 'candado', titulo: 'No se puede ver', texto: `${nombre}: no está disponible con tu acceso actual.` }
        : estado.tipo === 'sin-especificacion'
          ? { icono: 'info', titulo: 'Todavía no se calcula', texto: `${nombre}: BE no tiene todavía una especificación para calcularla.` }
          : estado.tipo === 'sin-puntos'
            ? { icono: 'sin-datos', titulo: SIN_PUNTOS[estado.area].titulo, texto: `No es un cero: no hay ${SIN_PUNTOS[estado.area].que} del ${diaCivil(estado.desde)} al ${diaCivil(estado.hasta)}. Probá con un período más largo.` }
            : { icono: ICONO_DE_FALLA[estado.motivo], titulo: 'No pudimos completar esta parte', texto: `${razonDeFalla(estado.motivo)} Las otras métricas siguen.` };
  return (
    <>
      <p className="grafico__encabezado">
        <span className="grafico__titulo">
          <Marca indice={indice} /> <strong>{nombre}</strong>
        </span>
      </p>
      <div className={`estado-de-grafico estado-de-grafico--${estado.tipo}`} role={estado.tipo === 'cargando' ? 'status' : undefined}>
        <Icono nombre={c.icono} tamano={24} />
        <div className="estado-de-grafico__texto">
          {c.titulo ? <p className="estado-de-grafico__titulo">{c.titulo}</p> : null}
          <p className="nota">{c.texto}</p>
        </div>
        {estado.tipo === 'error' ? (
          <button type="button" className="boton boton--secundario boton--compacto" onClick={onReintentar}>
            <Icono nombre="actualizar" tamano={18} />
            Reintentar
          </button>
        ) : null}
      </div>
    </>
  );
}

type Lista = SerieDelAnalisis & { estado: Extract<SerieDelAnalisis['estado'], { tipo: 'lista' }> };

const REGLA_DE_REFERENCIA: Readonly<Record<Extract<Referencia, { tipo: 'valida' }>['regla'], string>> = {
  MEDIA: 'media de los días con valor',
  MEDIANA: 'mediana de las sesiones',
  PRIMERA: 'primera toma del rango',
};

/** La referencia explícita del cambio relativo: regla, rango, valor y n (encargo §12; DICCIONARIO §1). */
function textoDeReferencia(r: Extract<Referencia, { tipo: 'valida' }>, s: Lista): string {
  const extras = [
    // Con menos de 3 observaciones la referencia es frágil (un día atípico mueve todo el cambio relativo): se dice, sin
    // bloquear. La primera toma de antropometría es una sola por definición.
    `n = ${numero(r.n)}${r.regla !== 'PRIMERA' && r.n < 3 ? ': pocas observaciones, la referencia es frágil' : ''}`,
    ...(r.parciales ? [`${numero(r.parciales)} ${r.parciales === 1 ? 'subtotal' : 'subtotales'}`] : []),
    ...(r.incompletos ? [`${numero(r.incompletos)} sin completar, fuera de la referencia`] : []),
    ...(r.tramo !== null ? ['solo se compara con su mismo tramo comparable'] : []),
  ];
  return `${REGLA_DE_REFERENCIA[r.regla]} del ${diaCivil(r.desde)} al ${diaCivil(r.hasta)}, ${valorParaMostrar(r.valor, s.definicion, s.estado.serie.unit)} (${extras.join('; ')})`;
}

/** El cambio relativo de un punto contra su referencia, dicho en palabras; `null` si no corresponde. */
function relativoDelPunto(p: PuntoAnalitico, r: Referencia | undefined): string | null {
  if (!r || r.tipo !== 'valida' || p.value === null) return null;
  if (r.tramo !== null && p.segment !== r.tramo) return 'sin cambio relativo: es de otro tramo comparable que la referencia';
  const v = cambioRelativo(p.value, r.valor);
  return `${v > 0 ? '+' : ''}${numero(Number(v.toFixed(1)))} % contra la referencia`;
}

/** El ícono de la clase de un dato: medido, reportado por la persona o calculado por un método. */
const ICONO_DE_CLASE: Readonly<Record<'MEASURED' | 'REPORTED' | 'DERIVED', NombreDeIcono>> = { MEASURED: 'medido', REPORTED: 'reportado', DERIVED: 'calculado' };

/**
 * La lectura de la fecha elegida (WP-ESCRITORIO-AMABLE, parte 2): un bloque por métrica, con el valor grande y, debajo,
 * lo que hace falta para leerlo —la calidad, cuántos registros lo sostienen, lo planificado en la misma unidad, la clase
 * del dato y el origen—. Los textos son los de siempre; cambia el orden de lectura. El valor exacto nunca depende de
 * pasar el puntero por un gráfico.
 */
function PanelDeLectura({
  fecha,
  fechasConDato,
  series,
  nombres,
  todas,
  referencias,
  onFecha,
  onAbrir,
}: {
  fecha: string | null;
  fechasConDato: readonly string[];
  series: readonly Lista[];
  nombres: readonly string[];
  todas: readonly SerieDelAnalisis[];
  /** En el modo de cambio relativo: la referencia de cada serie; la lectura dice el cambio y el valor real. */
  referencias: ReadonlyMap<string, Referencia> | null;
  onFecha: (f: string) => void;
  onAbrir: (indice: number, punto: PuntoAnalitico) => void;
}) {
  const id = useId();
  const i = fecha ? fechasConDato.indexOf(fecha) : -1;
  return (
    <section className="panel-de-lectura" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>{fecha ? `Lectura del ${diaCivil(fecha)}` : 'Lectura'}</h3>
      <div className="lectura__paso">
        <button type="button" className="boton boton--quieto boton--compacto" disabled={i <= 0} onClick={() => onFecha(fechasConDato[i - 1]!)}>
          <Icono nombre="izquierda" tamano={18} />
          Fecha anterior<span className="visualmente-oculto"> con datos</span>
        </button>
        <button type="button" className="boton boton--quieto boton--compacto" disabled={i < 0 || i >= fechasConDato.length - 1} onClick={() => onFecha(fechasConDato[i + 1]!)}>
          Fecha siguiente<span className="visualmente-oculto"> con datos</span>
          <Icono nombre="derecha" tamano={18} />
        </button>
      </div>
      <div className="campo lectura__fecha">
        <label htmlFor={`${id}-fecha`}>Ir a una fecha</label>
        <input id={`${id}-fecha`} type="date" value={fecha ?? ''} onChange={(e) => e.target.value && onFecha(e.target.value)} />
      </div>
      <div aria-live="polite">
        {fecha ? (
          series.map((s) => {
            const indice = todas.indexOf(s);
            const l = lecturaEnFecha(s.estado.serie, fecha, true);
            return (
              <div key={s.clave} className="panel-de-lectura__metrica dato-de-lectura">
                <p className="dato-de-lectura__nombre">
                  <Marca indice={indice} /> <strong>{nombres[indice]}</strong>
                </p>
                {l.tipo === 'valores' ? (
                  l.puntos.map((p) => {
                    const relativo = referencias ? relativoDelPunto(p, referencias.get(s.clave)) : null;
                    // «+1,7 % contra la referencia» se parte en el número, que va grande, y el resto de la frase.
                    const cambio = relativo ? /^([+\-−]?[\d.,]+ %) (.*)$/.exec(relativo) : null;
                    const valor = p.value === null ? null : valorParaMostrar(p.value, s.definicion, s.estado.serie.unit);
                    const corte = valor ? valor.lastIndexOf(' ') : -1;
                    const clase = p.detail.find((d) => d.label === 'Clase de dato');
                    const otros = p.detail.filter((d) => d !== clase);
                    const objetivos = valor !== null ? objetivosVigentes(s.estado.objetivo, p.date, p.dateEnd ?? p.date) : [];
                    return (
                      <div key={p.pointId} className="dato-de-lectura__punto">
                        {relativo ? (
                          <>
                            <p className="dato-de-lectura__valor">{cambio ? cambio[1] : 'No se compara'}</p>
                            <p className="dato-de-lectura__nota">
                              {cambio ? cambio[2] : relativo.replace(/^sin cambio relativo: /, '')} · valor real {valor ?? 'sin valor conocido'} · {calidadDelPunto(p)} · n = {numero(p.n)}
                              {p.dateEnd ? ` · semana del ${diaCivil(p.date)} al ${diaCivil(p.dateEnd)}` : ''}
                              {p.corrected ? ' · con una corrección vigente' : ''}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="dato-de-lectura__valor">
                              {valor === null ? (
                                'Sin valor conocido'
                              ) : corte > 0 ? (
                                <>
                                  {valor.slice(0, corte)} <small>{valor.slice(corte + 1)}</small>
                                </>
                              ) : (
                                valor
                              )}
                            </p>
                            <p className="dato-de-lectura__nota">
                              {/* La calidad empieza el renglón: con mayúscula («Sin faltantes · n = 1»). */}
                              {calidadDelPunto(p).replace(/^./, (c) => c.toUpperCase())} · n = {numero(p.n)}
                              {p.dateEnd ? ` · semana del ${diaCivil(p.date)} al ${diaCivil(p.dateEnd)}` : ''}
                              {p.corrected ? ' · con una corrección vigente' : ''}
                            </p>
                          </>
                        )}
                        {/* Lo planificado en la misma unidad: el objetivo que regía ese día (o esa semana). Sin restas ni porcentajes. */}
                        {objetivos.length > 0 ? <p className="dato-de-lectura__nota">Objetivo: {objetivos.map((o) => numero(o)).join(' y ')} kcal por día</p> : null}
                        {otros.length > 0 ? <p className="dato-de-lectura__nota">{otros.map((d) => `${d.label}: ${d.value}`).join(' · ')}</p> : null}
                        {p.missing.length > 0 ? <p className="dato-de-lectura__nota">Falta: {p.missing.map((m) => `${numero(m.count)} ${textoDeFaltante(m.reason)}`).join(', ')}</p> : null}
                        <p className="dato-de-lectura__pie">
                          {clase ? (
                            <span className="dato-de-lectura__clase">
                              <span className="etiqueta-de-dato">
                                {p.dataClass ? <Icono nombre={ICONO_DE_CLASE[p.dataClass]} tamano={15} /> : null}
                                <span className="visualmente-oculto">Clase de dato: </span>
                                {/^\S+?(?=[\s:,]|$)/.exec(clase.value)?.[0] ?? clase.value}
                              </span>
                              {clase.value.replace(/^\S+?(?=[\s:,]|$)/, '')}
                            </span>
                          ) : null}
                          <button type="button" className="boton boton--enlace" onClick={() => onAbrir(indice, p)}>
                            <Icono nombre="origen" tamano={18} />
                            Ver origen<span className="visualmente-oculto"> de {nombres[indice]}</span>
                          </button>
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="dato-de-lectura__nota">
                    Sin dato en esta fecha.
                    {l.masCercano
                      ? ` El más cercano: ${diaCivil(l.masCercano.punto.date)}, a ${numero(l.masCercano.distanciaDias)} ${l.masCercano.distanciaDias === 1 ? 'día' : 'días'}: ${valorParaMostrar(l.masCercano.punto.value as number, s.definicion, s.estado.serie.unit)}. No es simultáneo.`
                      : ''}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p className="dato-de-lectura__nota">Cuando un gráfico tenga datos, elegí una fecha y sus valores se leen acá.</p>
        )}
      </div>
    </section>
  );
}

function DetalleDelPunto({ abierto, serie, onOrigen }: { abierto: { indice: number; punto: PuntoAnalitico; origen: OrigenDeDato | null }; serie: SerieDelAnalisis | undefined; onOrigen: (o: OrigenDeDato) => void }) {
  const p = abierto.punto;
  const actual = abierto.origen ?? p.sources[0] ?? null;
  return (
    <div>
      <p>
        {p.value === null || !serie ? 'Sin valor conocido' : valorParaMostrar(p.value, serie.definicion, serie.estado.tipo === 'lista' ? serie.estado.serie.unit : serie.definicion.unidad)} · {calidadDelPunto(p)} · n = {numero(p.n)}
      </p>
      {p.sources.length > 1 ? (
        <>
          <p className="nota">
            Este dato sale de {numero(p.sources.length)} registros{p.sourcesTruncated ? ' (y más, que no se listan)' : ''}. Elegí cuál abrir:
          </p>
          <ul className="selector-de-series">
            {p.sources.map((o, i) => (
              <li key={o.id}>
                <button type="button" className="chip" aria-pressed={actual?.id === o.id} onClick={() => onOrigen(o)}>
                  Registro {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** Lo que es cada punto cuando el gráfico se agrupa por semana. */
const PUNTO_SEMANAL: Readonly<Record<string, string>> = {
  MEAN_OF_DAYS_WITH_DATA: 'la media de los días con valor de su semana',
  SUM: 'la suma de su semana',
};

function ComoSeCalcula({ series, nombres, todas }: { series: readonly Lista[]; nombres: readonly string[]; todas: readonly SerieDelAnalisis[] }) {
  return (
    <section className="como-se-calcula" aria-label="Cómo se calcula">
      <h3>Cómo se calcula</h3>
      {series.map((s) => (
        <div key={s.clave}>
          <h4>{nombres[todas.indexOf(s)]}</h4>
          <p>{s.definicion.explicacion}</p>
          <p>{s.definicion.comoSeCalcula}</p>
          {s.grano !== granoDeObservacion(s.definicion) ? (
            <p>
              Agrupada por semana para dibujar: cada punto es {PUNTO_SEMANAL[s.estado.serie.aggregation] ?? 'el resumen de su semana'}. Los resúmenes, la comparación de períodos y la referencia
              usan {s.definicion.area === 'NUTRICION' ? 'los días' : 'las sesiones'} del rango exacto, no las semanas: agrupar el dibujo no cambia lo que significan.
            </p>
          ) : null}
          {s.estado.objetivo.length > 0 ? (
            <p>
              La línea discontinua es el objetivo de calorías por día (el requerimiento energético estimado): un escalón por cada versión del objetivo. Lo gris son los días sin registros: la línea se corta, no
              es un cero.
            </p>
          ) : null}
          <p className="nota">{s.definicion.ausencias}</p>
          <ul>
            {[...new Set([...s.definicion.limites, ...s.estado.serie.notes])].map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="nota">
            Área: {NOMBRE_DE_DOMINIO[s.definicion.area === 'NUTRICION' ? 'NUTRITION' : s.definicion.area === 'ENTRENAMIENTO' ? 'TRAINING' : 'ANTHROPOMETRY']} · generada el {new Date(s.estado.generada).toLocaleString('es-AR')}
          </p>
        </div>
      ))}
    </section>
  );
}

function TablaDeDatos({ series, nombres, todas, desde, hasta }: { series: readonly Lista[]; nombres: readonly string[]; todas: readonly SerieDelAnalisis[]; desde: string; hasta: string }) {
  const fechas = [...new Set(series.flatMap((s) => s.estado.serie.points.filter((p) => p.date >= desde && p.date <= hasta).map((p) => p.date)))].sort().reverse();
  return (
    <section className="tabla-de-datos" aria-label="Tabla de datos">
      <h3>
        Tabla de datos ({numero(fechas.length)} {fechas.length === 1 ? 'fecha' : 'fechas'})
      </h3>
      <div className="desplazable-x">
        <table className="tabla tabla--numeros">
          <caption className="visualmente-oculto">Valores por fecha de las métricas elegidas</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              {series.flatMap((s) => [
                <th key={s.clave} scope="col">
                  {nombres[todas.indexOf(s)]} ({s.estado.serie.unit})
                </th>,
                // Lo planificado que el gráfico dibuja junto a esta métrica: su columna, al lado.
                ...(s.estado.objetivo.length > 0
                  ? [
                      <th key={`${s.clave}-objetivo`} scope="col">
                        Objetivo de calorías (kcal por día)
                      </th>,
                    ]
                  : []),
              ])}
            </tr>
          </thead>
          <tbody>
            {fechas.map((f) => (
              <tr key={f}>
                <th scope="row">{diaCivil(f)}</th>
                {series.flatMap((s) => {
                  const del = s.estado.serie.points.filter((p) => p.date === f);
                  // El objetivo de la fila: el del día, o los de la semana si cambió dentro de ella.
                  const vigentes = s.estado.objetivo.length > 0 ? objetivosVigentes(s.estado.objetivo, f, del.find((p) => p.dateEnd)?.dateEnd ?? f) : null;
                  return [
                    <td key={s.clave}>
                      {del.length === 0
                        ? 'Sin dato'
                        : del
                            .map((p) =>
                              p.value === null
                                ? 'Sin valor conocido'
                                : `${valorParaMostrar(p.value, s.definicion, s.estado.serie.unit)}${p.quality === 'PARTIAL' ? ' (subtotal)' : ''}${p.partialBucket ? (p.dateEnd ? ' (semana sin completar)' : ' (día en curso)') : ''}${
                                    p.dataClass === 'REPORTED' || p.dataClass === 'DERIVED' ? ` (${claseEnPalabras(p.dataClass, p.method).replace(/^./, (c) => c.toLowerCase())})` : ''
                                  }`,
                            )
                            .join(' · ')}
                    </td>,
                    ...(vigentes !== null ? [<td key={`${s.clave}-objetivo`}>{vigentes.length === 0 ? 'Sin objetivo' : vigentes.map((v) => numero(v)).join(' y ')}</td>] : []),
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** El resultado de la última exportación: su texto y si salió un archivo. */
interface AvisoDeExportacion {
  readonly texto: string;
  readonly sinArchivo: boolean;
}

/**
 * Descargar lo que se ve (encargo §16): los puntos de la tabla, en CSV, armados en el navegador. Antes de armar el archivo
 * se vuelve a preguntar a la API con el acceso de este momento: si un permiso se revocó después de cargar la pantalla, lo
 * revocado no entra (lo que hay en pantalla puede ser viejo) y la pantalla se vuelve a pedir. Sin operación nueva ni
 * enlace público; el archivo no lleva el nombre de nadie.
 */
function ExportarCsv({
  series,
  nombres,
  todas,
  desde,
  hasta,
  aviso,
  onAviso: setAviso,
  onAccesoCambiado,
}: {
  series: readonly Lista[];
  nombres: readonly string[];
  todas: readonly SerieDelAnalisis[];
  desde: string;
  hasta: string;
  aviso: string | null;
  onAviso: (aviso: AvisoDeExportacion | null) => void;
  onAccesoCambiado: () => void;
}) {
  const { token, asesoradoId, periodo, nombreDelAsesorado, sesionPerdida } = useSeguimiento();
  const [ocupado, setOcupado] = useState(false);
  const nombreDe = (s: Lista) => nombres[todas.indexOf(s)] ?? s.definicion.nombre;
  const descargar = async () => {
    setOcupado(true);
    setAviso(null);
    const leidas = await Promise.all(series.map((s) => leerSerie(token, asesoradoId, s, periodo)));
    setOcupado(false);
    if (leidas.some((l) => l.respuestas.some((r) => sesionPerdida(r)))) return;
    const incluidas = series.flatMap((s, i) => {
      const e = leidas[i]?.estado;
      return e?.tipo === 'lista' ? [{ s, serie: e.serie, zona: e.zona }] : [];
    });
    const afuera = series.flatMap((s, i) => {
      const e = leidas[i]?.estado;
      return !e || e.tipo === 'lista' ? [] : [`${nombreDe(s)} (${e.tipo === 'sin-acceso' ? 'no está disponible con tu acceso actual' : e.tipo === 'sin-especificacion' ? 'sin especificación' : 'no se pudo leer ahora'})`];
    });
    if (incluidas.length === 0) {
      setAviso({ texto: `No se descargó ningún archivo: ${afuera.join('; ')}.`, sinArchivo: true });
      onAccesoCambiado();
      return;
    }
    const csv = csvDelAnalisis({
      asesorado: nombreDelAsesorado ?? 'Asesorado',
      desde,
      hasta,
      zona: incluidas[0]?.zona ?? 'America/Argentina/Buenos_Aires',
      generadoEl: new Date().toISOString(),
      series: incluidas.map(({ s, serie }) => ({ nombre: nombreDe(s), definicion: s.definicion, serie })),
    });
    // Con BOM, para que una planilla lea los acentos como UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreDeLaExportacion(desde, hasta);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAviso({ texto: `Descargado: ${a.download}.${afuera.length > 0 ? ` No se incluyó: ${afuera.join('; ')}.` : ''}`, sinArchivo: false });
    if (afuera.length > 0) onAccesoCambiado();
  };
  return (
    <div className="exportar">
      <button type="button" className="boton boton--secundario" disabled={ocupado} onClick={() => void descargar()}>
        {ocupado ? 'Consultando con tu acceso actual…' : 'Descargar los datos (CSV)'}
      </button>
      <p className="nota">
        Lo que ves, del {diaCivil(desde)} al {diaCivil(hasta)}: valores, calidad, clase de dato, cobertura, método y fecha de generación. Antes de descargar se vuelve a consultar con tu acceso actual. El
        archivo queda en tu equipo: cuidalo como un dato de salud.
      </p>
      {aviso ? (
        <p className="nota" role="status">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}

function ComparacionDePeriodos({
  series,
  nombres,
  todas,
  estado,
  cambiar,
  minimo,
  maximo,
  secundaria = false,
}: {
  series: readonly Lista[];
  nombres: readonly string[];
  todas: readonly SerieDelAnalisis[];
  estado: EstadoDeAnalisis;
  cambiar: (c: Partial<EstadoDeAnalisis>) => void;
  minimo: string;
  maximo: string;
  /**
   * Con la pregunta de etapas, la comparación a mano es una opción secundaria: plegada debajo de la tabla de etapas (abierta
   * si ya hay una comparación en la URL), sin un segundo título que repita su rótulo.
   */
  secundaria?: boolean;
}) {
  const id = useId();
  const c = estado.comparacion;
  const poner = (lado: 'a' | 'b', campo: 'desde' | 'hasta', valor: string) => {
    if (!valor) return;
    const base = c ?? { a: { desde: minimo, hasta: minimo }, b: { desde: maximo, hasta: maximo } };
    cambiar({ comparacion: { ...base, [lado]: { ...base[lado], [campo]: valor } } });
  };
  const contenido = (
    <>
      {/* «Coincidencia temporal: no indica causa» ya está, una vez, en el encabezado de Analizar. */}
      <p className="nota">El mismo criterio de resumen en los dos, con la cobertura de cada uno.</p>
      <ContenidoDeLaComparacion id={id} series={series} nombres={nombres} todas={todas} c={c} cambiar={cambiar} poner={poner} minimo={minimo} maximo={maximo} />
    </>
  );
  if (secundaria) {
    return (
      <details className="comparar-a-mano" open={c !== null}>
        <summary>Comparar otros dos períodos, con fechas elegidas a mano</summary>
        {contenido}
      </details>
    );
  }
  return (
    <section aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>Comparar dos períodos</h3>
      {contenido}
    </section>
  );
}

function ContenidoDeLaComparacion({
  id,
  series,
  nombres,
  todas,
  c,
  cambiar,
  poner,
  minimo,
  maximo,
}: {
  id: string;
  series: readonly Lista[];
  nombres: readonly string[];
  todas: readonly SerieDelAnalisis[];
  c: EstadoDeAnalisis['comparacion'];
  cambiar: (c: Partial<EstadoDeAnalisis>) => void;
  poner: (lado: 'a' | 'b', campo: 'desde' | 'hasta', valor: string) => void;
  minimo: string;
  maximo: string;
}) {
  return (
    <>
      <div className="acciones">
        {(['a', 'b'] as const).map((lado) => (
          <fieldset key={lado} className="capas">
            <legend>Período {lado.toUpperCase()}</legend>
            <div className="campo">
              <label htmlFor={`${id}-${lado}-d`}>Desde</label>
              <input id={`${id}-${lado}-d`} type="date" min={minimo} max={maximo} value={c?.[lado].desde ?? ''} onChange={(e) => poner(lado, 'desde', e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor={`${id}-${lado}-h`}>Hasta</label>
              <input id={`${id}-${lado}-h`} type="date" min={minimo} max={maximo} value={c?.[lado].hasta ?? ''} onChange={(e) => poner(lado, 'hasta', e.target.value)} />
            </div>
          </fieldset>
        ))}
        {c ? (
          <button type="button" className="boton boton--enlace" onClick={() => cambiar({ comparacion: null })}>
            Quitar la comparación
          </button>
        ) : null}
      </div>
      {c && c.a.desde <= c.a.hasta && c.b.desde <= c.b.hasta ? (
        <div className="desplazable-x">
          <table className="tabla tabla--numeros">
            <caption className="visualmente-oculto">Comparación de los dos períodos por métrica</caption>
            <thead>
              <tr>
                <th scope="col">Métrica</th>
                <th scope="col">Criterio</th>
                <th scope="col">
                  A · {diaCivil(c.a.desde)} al {diaCivil(c.a.hasta)}
                </th>
                <th scope="col">
                  B · {diaCivil(c.b.desde)} al {diaCivil(c.b.hasta)}
                </th>
                <th scope="col">B − A</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                // Sobre las observaciones del rango exacto de cada período, no sobre los puntos que se dibujan. La
                // cobertura es la misma de la tabla de etapas: en nutrición, los días del rango por categoría.
                const r = compararPeriodos(s.estado.observaciones, s.definicion, c.a, c.b, hoyEn());
                const unidad = s.estado.serie.unit;
                const celda = (x: typeof r.a) => (
                  <>
                    <strong>{x.valor === null ? 'Sin valor' : valorParaMostrar(x.valor, s.definicion, unidad)}</strong>
                    <span className="celda__detalle">{partesDeLaCobertura(x).join(' · ')}</span>
                  </>
                );
                return (
                  <tr key={s.clave}>
                    <th scope="row">{nombres[todas.indexOf(s)]}</th>
                    <td>{CRITERIO[s.definicion.resumenDePeriodo]}</td>
                    <td>{celda(r.a)}</td>
                    <td>{celda(r.b)}</td>
                    <td>{r.diferencia === null ? (MOTIVO_SIN_DIFERENCIA[r.motivoSinDiferencia ?? ''] ?? '—') : `${r.diferencia > 0 ? '+' : ''}${valorConUnidad(r.diferencia, unidad, s.definicion.decimales)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

const CRITERIO: Readonly<Record<string, string>> = {
  MEDIA_DE_DIAS_CON_DATOS: 'Media de los días con valor',
  MEDIANA: 'Mediana de las sesiones',
  PRIMERO_Y_ULTIMO_COMPARABLES: 'Última toma del tramo comparable',
  TOTAL: 'Total',
};
const MOTIVO_SIN_DIFERENCIA: Readonly<Record<string, string>> = {
  SIN_VALOR_EN_ALGUNO: 'No se calcula: un período no tiene valores',
  DURACIONES_DISTINTAS: 'No se calcula: totales de períodos de distinta duración',
  TRAMOS_NO_COMPARABLES: 'No se calcula: cambió el método o el protocolo entre los dos',
  PERIODO_INCOMPLETO: 'No se calcula: un total incluye el día en curso o una semana sin completar',
};

/** El nombre completo de la métrica para el título de su panel: «Calorías registradas» en vez de «Calorías». */
function tituloDeLaMetrica(nombreElegido: string, nombre: string, nombreCorto: string): string {
  return nombreElegido.startsWith(nombreCorto) ? `${nombre}${nombreElegido.slice(nombreCorto.length)}` : nombreElegido;
}

/**
 * El título de un gráfico con varias métricas juntas, con su concordancia: «Carbohidratos, grasas y proteínas
 * registrados». Si alguna no es «registrada», van los nombres tal cual.
 */
function tituloConjunto(nombres: readonly string[]): string {
  const enLista = (xs: readonly string[]): string => {
    const minusculas = xs.map((x, i) => (i === 0 ? x : x.charAt(0).toLowerCase() + x.slice(1)));
    return minusculas.length <= 1 ? (minusculas[0] ?? '') : `${minusculas.slice(0, -1).join(', ')} y ${minusculas[minusculas.length - 1]}`;
  };
  const partes = nombres.map((n) => /^(.*) registrad([oa])s?$/.exec(n));
  if (partes.length > 0 && partes.every((p) => p !== null)) return `${enLista(partes.map((p) => p?.[1] ?? ''))} registrad${partes.some((p) => p?.[2] === 'o') ? 'o' : 'a'}s`;
  return enLista(nombres);
}

type EscalonDelObjetivo = { readonly desde: string; readonly hasta: string | null; readonly valor: number };

/** Los escalones del objetivo que tocan un rango, en orden; cada uno rige hasta que empieza el siguiente. */
function escalonesEn(escalones: readonly EscalonDelObjetivo[], desde: string, hasta: string): { desde: string; valor: number }[] {
  const ordenados = [...escalones].sort((a, b) => a.desde.localeCompare(b.desde));
  return ordenados.flatMap((e, i) => {
    const siguiente = ordenados[i + 1];
    // El día en que empieza el siguiente ya vale el nuevo: este termina el día anterior.
    const fin = siguiente ? diaAnterior(siguiente.desde) : (e.hasta ?? hasta);
    const inicio = e.desde < desde ? desde : e.desde;
    return inicio <= hasta && fin >= desde && inicio <= fin ? [{ desde: inicio, valor: e.valor }] : [];
  });
}

/** Los valores del objetivo que rigen en un rango (uno, o más si cambió adentro), sin repetir. */
const objetivosVigentes = (escalones: readonly EscalonDelObjetivo[], desde: string, hasta: string): number[] => [...new Set(escalonesEn(escalones, desde, hasta).map((e) => e.valor))];

/** El objetivo de calorías del rango, en una frase: lo que el gráfico dibuja con la línea discontinua. Vacío si no hay. */
function objetivoEnTexto(escalones: readonly EscalonDelObjetivo[], desde: string, hasta: string): string {
  const tramos = escalonesEn(escalones, desde, hasta);
  if (tramos.length === 0) return '';
  return `Objetivo de calorías (requerimiento energético estimado): ${tramos.map((e) => `${numero(e.valor)} kcal por día desde el ${diaCivil(e.desde)}`).join('; ')}.`;
}

/** El día anterior a una fecha civil. */
const diaAnterior = (fecha: string): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * Los días sin registros que se sombrean en un gráfico diario: los huecos de la serie, sin el día en curso, que todavía
 * puede tener registros (el dominio también lo separa de «sin registros» al contar la cobertura).
 */
function diasSinRegistros(huecos: readonly { readonly from: string; readonly to: string }[], hoy: string): { desde: string; hasta: string }[] {
  return huecos.flatMap((h) => {
    const hasta = h.to >= hoy ? diaAnterior(hoy) : h.to;
    return hasta >= h.from ? [{ desde: h.from, hasta }] : [];
  });
}

/** Los datos de una pregunta resuelta, en una línea: «Nutrición · versión 3 (desde el 4 sept 2026)», «Sentadilla · serie 1 · kg». */
function parametrosEnPalabras(p: import('@be/domain').ParametrosDePregunta, destino: import('@be/domain').DestinoDePregunta, disponibles: { readonly ejercicios: readonly { exerciseKey: string; name: string }[] | null; readonly antropometria: readonly { metricCode: string; name: string }[] | null }): string {
  const partes: string[] = [];
  if (p.area) partes.push(p.area === 'NUTRICION' ? 'Nutrición' : 'Entrenamiento');
  if (destino.tipo === 'ANALIZAR' && destino.etapa) partes.push(`versión ${destino.etapa.etiqueta.replace(/^v/, '')} (${destino.periodo ? `del ${diaCivil(destino.periodo.desde)} al ${diaCivil(destino.periodo.hasta)}` : ''}${destino.periodo?.recortado ? ', recortada al máximo de un año' : ''})`);
  if (destino.tipo === 'ETAPAS') partes.push(`${destino.a.etiqueta} y ${destino.b.etiqueta}`);
  if (p.bodyMetric) partes.push(disponibles.antropometria?.find((m) => `antropometria.${m.metricCode}` === p.bodyMetric)?.name ?? 'medida corporal');
  if (p.exerciseKey) partes.push(disponibles.ejercicios?.find((e) => e.exerciseKey === p.exerciseKey)?.name ?? 'ejercicio');
  if (p.setIndex) partes.push(`serie ${p.setIndex}`);
  if (p.unit) partes.push(p.unit);
  return partes.join(' · ');
}
