'use client';

/**
 * Analizar («¿Cómo evolucionaron estas variables?»; encargo §8; ESPECIFICACION.md §4). Hasta tres métricas, cada una
 * vista de una proyección de API-PRJ-01 con el cálculo del dominio:
 * - tres modos: paneles sincronizados (por defecto), superpuestas en valores reales (misma familia y unidad) y cambio
 *   relativo (contra una referencia explícita y positiva). Un modo que no corresponde se deshabilita y dice por qué;
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
 */
import {
  cambioRelativo,
  claseEnPalabras,
  compararPeriodos,
  etapasDelArea,
  partesDeLaCobertura,
  partesDelResumenTextual,
  periodoDeLasEtapas,
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
  superposicionPermitida,
  valorConUnidad,
  type LineaDeTiempoResponse,
  type OrigenDeDato,
  type PuntoAnalitico,
  type Referencia,
  type ReferenciaDelCambio,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useEffect, useId, useMemo, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { textoDeFalla, useLectura, useSeguimiento } from './contexto';
import { codificarReferencia, hoyEn, leerAnalisis, leerPregunta, parametrosDeAnalisis, parametrosDePeriodo, parametrosDePregunta, type EstadoDeAnalisis, type GranoElegido, type Modo } from './estado';
import { ESTILOS, Marca, type SerieParaDibujar } from './lienzo';
import { contextoDeLaPregunta, ElegirParametros, ListaDePreguntas, PreguntaActiva, useEtapasDelAno } from './preguntas';
import { nombreDeLaReferencia, SelectorDeMetricas } from './selector';
import { leerSerie, useDisponibles, useSeriesDelAnalisis, type SerieDelAnalisis } from './series';
import { valorParaMostrar } from './valores';
import { VistasGuardadas } from './vistas-guardadas';

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

const MOTIVO_SIN_REFERENCIA: Readonly<Record<string, string>> = {
  ESCALA_NO_ADMITE: 'no admite cambio relativo (no es una escala de razón)',
  SIN_OBSERVACIONES: 'no tiene observaciones en los días de referencia',
  NO_POSITIVA: 'su referencia es cero o negativa',
  FUERA_DEL_PERIODO: 'el rango de referencia no está dentro del período leído',
};
const MOTIVO_SIN_SUPERPOSICION: Readonly<Record<string, string>> = {
  UNA_SOLA_METRICA: 'hace falta más de una métrica',
  UNIDADES_DISTINTAS: 'las métricas tienen unidades distintas',
  FAMILIAS_DISTINTAS: 'son medidas de distinta clase, aunque compartan unidad',
  SIN_FAMILIA: 'alguna métrica no se puede superponer con otras',
};
const CALIDAD: Readonly<Record<PuntoAnalitico['quality'], string>> = { COMPLETE: 'sin faltantes', PARTIAL: 'subtotal de lo registrado', UNKNOWN: 'sin valor conocido' };
/** Un balde incompleto: el día de hoy, que sigue en curso, o una semana que el período corta. */
const textoDeIncompleto = (p: PuntoAnalitico): string => (p.dateEnd ? 'semana sin completar en el período' : 'día en curso: el valor todavía puede cambiar');
const calidadDelPunto = (p: PuntoAnalitico): string => (p.partialBucket ? `${CALIDAD[p.quality]} · ${textoDeIncompleto(p)}` : CALIDAD[p.quality]);
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
  const [personalizado, setPersonalizado] = useState(false);
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
      ? (pregunta !== null && (destino?.tipo === 'ANALIZAR' || destino?.tipo === 'ETAPAS')) || estado.metricas.length > 0 || personalizado
      : false;
  const sinEntrada = pregunta === null && estado.metricas.length === 0 && !personalizado;
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

  const dibujables: SerieParaDibujar[] = listas.map((s) => {
    const indice = series.indexOf(s);
    const ref = referencias.get(s.clave);
    const relativos = modo === 'RELATIVE' && ref?.tipo === 'valida' ? new Map(puntosRelativos(s.estado.serie, ref).map((p) => [p.pointId, p.relativo])) : null;
    return {
      indice,
      nombre: nombres[indice] ?? s.definicion.nombre,
      titulo: `${tituloDeLaMetrica(nombres[indice] ?? s.definicion.nombre, s.definicion.nombre, s.definicion.nombreCorto)} · ${AGRUPADA[s.grano] === 'cada registro' ? (s.definicion.area === 'ANTROPOMETRIA' ? 'cada toma' : 'cada sesión') : AGRUPADA[s.grano]}`,
      unidad: s.estado.serie.unit,
      serie: s.estado.serie,
      valor: (p) => (relativos ? (relativos.get(p.pointId) ?? null) : p.value),
      decimales: s.definicion.decimales,
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

  const descripcion = listas.map((s) => resumenTextual(s.estado.serie, s.definicion, desde, hasta)).join(' ');
  const marcas = estado.metricas.map((_, i) => <Marca key={i} indice={i} conTrazo={modo !== 'PANELS'} />);
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
      </div>
    );
  });

  return (
    <section className="seccion analizar" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Analizar</h2>
      <p className="metadatos">Hasta tres métricas en el mismo tiempo. Coincidencia temporal: no indica causa.</p>
      {sinEntrada ? <ListaDePreguntas onPersonalizado={() => setPersonalizado(true)} /> : null}
      {/* Retomar una vista guardada también desde el comienzo: antes había que armar un análisis cualquiera para verlas. */}
      {sinEntrada ? <VistasGuardadas estado={estado} pregunta={null} soloAbrir /> : null}
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
      {pregunta && destino && !cambiandoPregunta ? <PreguntaActiva pregunta={pregunta} parametros={parametrosEnPalabras(pregunta.params, destino, disponibles)} onCambiar={() => setCambiandoPregunta(true)} /> : null}
      {destino?.tipo === 'CONTRASTE' && !cambiandoPregunta ? <ContrasteConLoIndicado area={destino.area} exerciseKey={destino.exerciseKey} /> : null}
      {destino?.tipo === 'ETAPAS' && !cambiandoPregunta ? (
        <ComparacionDeEtapas area={destino.area} a={destino.a} b={destino.b} metricas={destino.metricas} etapas={etapasDelAno.etapas[destino.area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING']} disponibles={disponibles} />
      ) : null}
      {conEtapas && listas.length > 0 ? (
        <ComparacionDePeriodos series={listas} nombres={nombres} todas={series} estado={estado} cambiar={cambiar} minimo={periodo.desde} maximo={periodo.hasta} secundaria />
      ) : null}
      {destino?.tipo === 'INFORMACION' && !cambiandoPregunta ? <InformacionParaRevisar area={destino.area} disponibles={disponibles} /> : null}
      {mostrarVista ? (
      <>
      <div className="analizar__cuerpo">
        <div className="analizar__seleccion">
          <SelectorDeMetricas elegidas={estado.metricas} disponibles={disponibles} onCambiar={cambiarMetricas} marcas={marcas} />
          {pregunta === null ? (
            <p>
              <button type="button" className="boton boton--enlace" onClick={() => ir(parametrosDePregunta({ id: 'cambio-desde-el-plan', params: {} }), { agregarAlHistorial: true })}>
                Empezar por una pregunta
              </button>
            </p>
          ) : null}
        </div>

        <div className="analizar__lienzo">
          {intervalo ? (
            <p className="nota">
              Intervalo: {diaCivil(desde)} al {diaCivil(hasta)}.{' '}
              <button type="button" className="boton boton--enlace" onClick={() => setIntervalo(null)}>
                Restablecer vista
              </button>
            </p>
          ) : null}
          <SeleccionDeIntervalo desde={desde} hasta={hasta} minimo={periodo.desde} maximo={periodo.hasta} onCambiar={(d, h) => setIntervalo({ desde: d, hasta: h })} />
          {estado.metricas.length === 0 ? <p>Elegí una métrica o una pregunta para empezar.</p> : null}
          {series.map((s, i) =>
            s.estado.tipo === 'lista' ? null : (
              <EstadoDeUnaSerie key={s.clave} nombre={nombres[i] ?? s.definicion.nombre} estado={s.estado} onReintentar={reintentar} />
            ),
          )}
          {listas.some((s) => s.estado.parcial) ? <p className="nota">Vista parcial: hay datos de esta área que no ves (los de otro profesional).</p> : null}
          {dibujables.length > 0 ? (
            <>
              <ul className="leyenda" aria-label="Leyenda">
                {dibujables.map((d) => (
                  <li key={d.indice}>
                    <Marca indice={d.indice} conTrazo={modo !== 'PANELS'} /> {d.nombre} · {modo === 'PANELS' ? ESTILOS[d.indice]?.nombreDeLaMarca : `${ESTILOS[d.indice]?.nombreDeLaMarca}, ${ESTILOS[d.indice]?.nombreDelTrazo}`}
                  </li>
                ))}
                <li>
                  <Marca indice={0} hueco /> Hueco: subtotal (falta algún dato), o día o semana sin completar
                </li>
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
              {modo === 'RELATIVE' ? (
                <p className="nota referencia-vigente">
                  <strong>Referencia:</strong> {descripcionDeLaReferencia(estado.referencia, rangoDeReferencia)} No cambia al acercar, alejar o restablecer el gráfico
                  {referenciaFueraDeLoVisible ? '; ahora queda fuera del intervalo visible, y los porcentajes siguen siendo contra ella' : ''}.
                </p>
              ) : null}
              {modo === 'RELATIVE' ? (
                <ul className="referencias" aria-label="Referencias del cambio relativo">
                  {listas.map((s) => {
                    const r = referencias.get(s.clave);
                    const indice = series.indexOf(s);
                    return r?.tipo === 'valida' ? (
                      <li key={s.clave}>
                        <Marca indice={indice} /> <strong>{nombres[indice]}</strong>: {textoDeReferencia(r, s)}
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : null}
              {hitos.length > 0 ? (
                <details className="hitos">
                  <summary>Hitos del período ({numero(hitos.length)}): las líneas verticales punteadas</summary>
                  <ul>
                    {hitos.map((h, i) => (
                      <li key={`${h.fecha}-${i}`}>
                        {diaCivil(h.fecha)} · {h.texto}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
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
                hitos={hitos}
                referencia={modo === 'RELATIVE' ? { desde: rangoDeReferencia.desde, hasta: rangoDeReferencia.hasta } : null}
                descripcion={descripcion}
              />
              {/* Con la pregunta de etapas, las tarjetas A y B ya abren cada planificación y «Cambiar los datos» elige otras. */}
              {estado.bandas && bandas.length > 0 && !conEtapas ? (
                <details className="etapas-del-grafico">
                  <summary>Etapas de los planes en el período: abrir la planificación o comparar</summary>
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
                        onComparar={(a: EtapaDePlanificacion, b: EtapaDePlanificacion) =>
                          ir(parametrosDePregunta({ id: 'comparar-etapas', params: { area, stageA: a.planVersionId, stageB: b.planVersionId } }), { agregarAlHistorial: true })
                        }
                      />
                    );
                  })}
                </details>
              ) : null}
            </>
          ) : null}
        </div>

        {/* En escritorio ancho, la lectura queda fija al costado de los gráficos mientras se recorren las fechas. */}
        {dibujables.length > 0 ? (
          <div className="analizar__lectura">
            <PanelDeLectura
              fecha={fecha}
              fechasConDato={fechasConDato}
              series={listas}
              nombres={nombres}
              todas={series}
              referencias={modo === 'RELATIVE' ? referencias : null}
              conTrazo={modo !== 'PANELS'}
              onFecha={(f) => cambiar({ fecha: f })}
              onAbrir={(indice, punto) => setPuntoAbierto({ indice, punto, origen: null })}
            />
          </div>
        ) : null}

        <div className="analizar__opciones">
          <fieldset className="capas">
            <legend>Cómo se leen</legend>
            <ModoElegible modo="PANELS" actual={modo} cambiar={(m) => cambiar({ modo: m })} texto="Paneles sincronizados" motivo={null} />
            <ModoElegible modo="OVERLAY" actual={modo} cambiar={(m) => cambiar({ modo: m })} texto="Superpuestas en valores reales" motivo={superposicion.permitida ? null : (MOTIVO_SIN_SUPERPOSICION[superposicion.motivo ?? ''] ?? null)} />
            <ModoElegible
              modo="RELATIVE"
              actual={modo}
              cambiar={(m) => cambiar({ modo: m })}
              texto="Cambio relativo"
              motivo={
                relativoPosible
                  ? null
                  : listas.length === 0
                    ? 'no hay series cargadas'
                    : sinReferencia.map((s) => `${nombres[series.indexOf(s)]}: ${MOTIVO_SIN_REFERENCIA[(referencias.get(s.clave) as { motivo?: string } | undefined)?.motivo ?? ''] ?? ''}`).join('; ')
              }
            />
          </fieldset>
          <fieldset className="capas">
            <legend>Agrupar por</legend>
            {(['ORIGINAL', 'DAY', 'WEEK'] as const).map((g) => (
              <label key={g} className="capa">
                <input type="radio" name={`${id}-grano`} checked={estado.grano === g} onChange={() => cambiar({ grano: g as GranoElegido })} />
                {g === 'ORIGINAL' ? 'Cada registro' : g === 'DAY' ? 'Día' : 'Semana'}
              </label>
            ))}
            {series.some((s) => s.grano !== estado.grano) ? (
              <ul className="nota agrupar-por__motivos">
                {series
                  .filter((s) => s.grano !== estado.grano)
                  .map((s) => (
                    <li key={s.clave}>
                      {nombres[series.indexOf(s)]}: {s.grano === 'ORIGINAL' ? (s.definicion.area === 'ANTROPOMETRIA' ? 'cada toma (las tomas no se agrupan)' : 'cada sesión (las series no se agrupan entre sesiones)') : s.grano === 'DAY' ? 'por día' : 'por semana'}.
                    </li>
                  ))}
              </ul>
            ) : null}
          </fieldset>
          <fieldset className="capas">
            <legend>Capas</legend>
            <label className="capa">
              <input type="checkbox" checked={estado.bandas} onChange={() => cambiar({ bandas: !estado.bandas })} />
              Vigencia de planes
            </label>
            <label className="capa">
              <input type="checkbox" checked={estado.eventos} onChange={() => cambiar({ eventos: !estado.eventos })} />
              Hitos (activaciones, objetivos, revisiones)
            </label>
          </fieldset>
          {modo === 'RELATIVE' ? (
          <ElegirReferencia
            // Se rearma si cambia la referencia o su rango (otro período): el editor arranca de lo vigente.
            key={`${JSON.stringify(estado.referencia)}|${rangoDeReferencia.desde}|${rangoDeReferencia.hasta}`}
            referencia={estado.referencia}
            rango={rangoDeReferencia}
            periodo={periodo}
            visible={intervalo ? { desde, hasta } : null}
            onAplicar={(referencia) => cambiar({ referencia })}
          />
          ) : null}
          <VistasGuardadas estado={estado} pregunta={pregunta} />
        </div>
      </div>

      {listas.length > 0 ? (
        <>
          <ComoSeCalcula series={listas} nombres={nombres} todas={series} />
          <TablaDeDatos series={listas} nombres={nombres} todas={series} desde={desde} hasta={hasta} />
          <ExportarCsv series={listas} nombres={nombres} todas={series} desde={desde} hasta={hasta} aviso={avisoDeExportacion?.texto ?? null} onAviso={setAvisoDeExportacion} onAccesoCambiado={recargar} />
          {conEtapas ? (
            <details className="resumen-en-texto resumen-en-texto--plegado">
              <summary>Resumen en texto de los gráficos</summary>
              {resumenEnTexto}
            </details>
          ) : (
            <section aria-labelledby={`${id}-resumen`} className="resumen-en-texto">
              <h3 id={`${id}-resumen`}>Resumen en texto de lo que se ve</h3>
              {resumenEnTexto}
            </section>
          )}
          {conEtapas ? null : <ComparacionDePeriodos series={listas} nombres={nombres} todas={series} estado={estado} cambiar={cambiar} minimo={periodo.desde} maximo={periodo.hasta} />}
        </>
      ) : avisoDeExportacion?.sinArchivo ? (
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

function ModoElegible({ modo, actual, cambiar, texto, motivo }: { modo: Modo; actual: Modo; cambiar: (m: Modo) => void; texto: string; motivo: string | null }) {
  const id = useId();
  return (
    <div className="modo-elegible">
      <label className="capa">
        <input type="radio" name="modo-de-lectura" checked={actual === modo} disabled={motivo !== null} aria-describedby={motivo ? `${id}-motivo` : undefined} onChange={() => cambiar(modo)} />
        {texto}
      </label>
      {motivo ? (
        <p id={`${id}-motivo`} className="nota">
          No disponible: {motivo}.
        </p>
      ) : null}
    </div>
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
  onAplicar,
}: {
  referencia: ReferenciaDelCambio;
  rango: { readonly desde: string; readonly hasta: string; readonly dentroDelPeriodo: boolean };
  periodo: { readonly desde: string; readonly hasta: string };
  /** El intervalo visible, si se acercó el gráfico: se puede copiar como rango, y aun así hay que aplicarlo. */
  visible: { readonly desde: string; readonly hasta: string } | null;
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
    <fieldset className="capas referencia-del-cambio">
      <legend>Referencia del cambio relativo</legend>
      <p>{descripcionDeLaReferencia(referencia, rango).replace(/^./, (c) => c.toUpperCase())}</p>
      <p className="nota">La usa «Cambio relativo». Acercar, alejar o restablecer el gráfico no la cambia: solo «Aplicar».</p>
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

function EstadoDeUnaSerie({ nombre, estado, onReintentar }: { nombre: string; estado: Exclude<SerieDelAnalisis['estado'], { tipo: 'lista' }>; onReintentar: () => void }) {
  if (estado.tipo === 'cargando') return <p className="nota">Cargando {nombre}…</p>;
  if (estado.tipo === 'sin-acceso') return <p className="nota">{nombre}: no está disponible con tu acceso actual.</p>;
  if (estado.tipo === 'sin-especificacion') return <p className="nota">{nombre}: BE no tiene todavía una especificación para calcularla.</p>;
  return (
    <p className="campo__error">
      {textoDeFalla(estado.motivo, nombre)} Las otras métricas siguen.{' '}
      <button type="button" className="boton boton--enlace" onClick={onReintentar}>
        Reintentar
      </button>
    </p>
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

function PanelDeLectura({
  fecha,
  fechasConDato,
  series,
  nombres,
  todas,
  referencias,
  conTrazo,
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
  /** Si la muestra lleva el trazo de la línea (solo cuando las series comparten un gráfico). */
  conTrazo: boolean;
  onFecha: (f: string) => void;
  onAbrir: (indice: number, punto: PuntoAnalitico) => void;
}) {
  const id = useId();
  const i = fecha ? fechasConDato.indexOf(fecha) : -1;
  return (
    <section className="detalle-de-valores panel-de-lectura" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>{fecha ? `Lectura del ${diaCivil(fecha)}` : 'Lectura'}</h3>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" disabled={i <= 0} onClick={() => onFecha(fechasConDato[i - 1]!)}>
          Fecha anterior con datos
        </button>
        <div className="campo">
          <label htmlFor={`${id}-fecha`}>Fecha elegida</label>
          <input id={`${id}-fecha`} type="date" value={fecha ?? ''} onChange={(e) => e.target.value && onFecha(e.target.value)} />
        </div>
        <button type="button" className="boton boton--secundario" disabled={i < 0 || i >= fechasConDato.length - 1} onClick={() => onFecha(fechasConDato[i + 1]!)}>
          Fecha siguiente con datos
        </button>
      </div>
      <div aria-live="polite">
        {fecha
          ? series.map((s) => {
              const indice = todas.indexOf(s);
              const l = lecturaEnFecha(s.estado.serie, fecha, true);
              return (
                <div key={s.clave} className="panel-de-lectura__metrica">
                  <p>
                    <Marca indice={indice} conTrazo={conTrazo} /> <strong>{nombres[indice]}</strong>
                  </p>
                  {l.tipo === 'valores' ? (
                    l.puntos.map((p) => (
                      <div key={p.pointId}>
                        <p>
                          {referencias && relativoDelPunto(p, referencias.get(s.clave)) ? <strong>{relativoDelPunto(p, referencias.get(s.clave))} · valor real </strong> : null}
                          {p.value === null ? 'Sin valor conocido' : valorParaMostrar(p.value, s.definicion, s.estado.serie.unit)} · {calidadDelPunto(p)} · n = {numero(p.n)}
                          {p.dateEnd ? ` · semana del ${diaCivil(p.date)} al ${diaCivil(p.dateEnd)}` : ''}
                          {p.corrected ? ' · con una corrección vigente' : ''}
                        </p>
                        {p.detail.length > 0 ? <p className="nota">{p.detail.map((d) => `${d.label}: ${d.value}`).join(' · ')}</p> : null}
                        {p.missing.length > 0 ? <p className="nota">Falta: {p.missing.map((m) => `${numero(m.count)} ${textoDeFaltante(m.reason)}`).join(', ')}</p> : null}
                        <button type="button" className="boton boton--enlace" onClick={() => onAbrir(indice, p)}>
                          Ver el origen de este dato
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="nota">
                      Sin dato en esta fecha.
                      {l.masCercano
                        ? ` El más cercano: ${diaCivil(l.masCercano.punto.date)}, a ${numero(l.masCercano.distanciaDias)} ${l.masCercano.distanciaDias === 1 ? 'día' : 'días'}: ${valorParaMostrar(l.masCercano.punto.value as number, s.definicion, s.estado.serie.unit)}. No es simultáneo.`
                        : ''}
                    </p>
                  )}
                </div>
              );
            })
          : null}
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
    <details className="como-se-calcula">
      <summary>Cómo se calcula</summary>
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
    </details>
  );
}

function TablaDeDatos({ series, nombres, todas, desde, hasta }: { series: readonly Lista[]; nombres: readonly string[]; todas: readonly SerieDelAnalisis[]; desde: string; hasta: string }) {
  const fechas = [...new Set(series.flatMap((s) => s.estado.serie.points.filter((p) => p.date >= desde && p.date <= hasta).map((p) => p.date)))].sort().reverse();
  return (
    <details className="tabla-de-datos">
      <summary>Tabla de datos ({numero(fechas.length)} fechas)</summary>
      <div className="desplazable-x">
        <table className="tabla tabla--numeros">
          <caption className="visualmente-oculto">Valores por fecha de las métricas elegidas</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              {series.map((s) => (
                <th key={s.clave} scope="col">
                  {nombres[todas.indexOf(s)]} ({s.estado.serie.unit})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fechas.map((f) => (
              <tr key={f}>
                <th scope="row">{diaCivil(f)}</th>
                {series.map((s) => {
                  const del = s.estado.serie.points.filter((p) => p.date === f);
                  return (
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
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
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

/** El nombre completo de la métrica para el título de su panel: «Energía registrada» en vez de «Energía». */
function tituloDeLaMetrica(nombreElegido: string, nombre: string, nombreCorto: string): string {
  return nombreElegido.startsWith(nombreCorto) ? `${nombre}${nombreElegido.slice(nombreCorto.length)}` : nombreElegido;
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
