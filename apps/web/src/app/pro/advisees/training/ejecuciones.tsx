'use client';

/**
 * Registros de Entrenamiento (B10-06 §41): las sesiones registradas del período, con su detalle.
 * - Solo lo registrado: el borrador del asesorado no es evidencia y no aparece (09v10:980).
 * - Los días sin nada registrado se dicen «sin sesión registrada», nunca como sesiones que faltaron: el plan no fija qué
 *   días se entrena (H-09-TRN-01; DL-088).
 * - Sin «disciplinado», «mal rendimiento» ni porcentajes (B10-06:963-966).
 * - Una carga que no se registró dice eso, «carga no registrada»: no es «sin carga» ni peso corporal (06:5675).
 * - Lo indicado de cada serie es el de la versión del plan que rigió ese día (API-SER-01 de esa versión; DL-122).
 *
 * WP-ESCRITORIO-AREAS (parte 2; maqueta 25): **una fila por sesión, y el detalle es una tabla.**
 * - Las sesiones van de la más nueva a la más vieja (C-68). Cada fila dice el día, la sesión y su condición, cuántas
 *   series se registraron y cómo quedaron frente a lo indicado. La fila entera abre el detalle.
 * - Cuatro vistas con nombre dicen cuántas sesiones trae cada una. Los filtros de siempre (versión del plan y
 *   ejercicio) están en «Más filtros».
 * - El detalle se abre al costado, sin tapar la lista: cada serie una sola vez, con lo indicado, lo registrado y cómo
 *   quedó (C-66). Lo demás que se veía (los descansos y la duración de cada serie, la sesión en el plan, el gráfico por
 *   serie, el registro original y las correcciones) sigue ahí, a un clic.
 * - La evolución de un ejercicio queda en Analizar (C-67): acá hay un enlace que lleva.
 * - Las reglas (qué es una serie con diferencias, qué dice cada fila, qué trae cada vista) están en el dominio
 *   (`registros-de-entrenamiento.ts`), con sus pruebas. Esta pantalla no calcula.
 * - Si los objetivos de una versión del plan no se pueden leer, sus sesiones se ven igual y lo dicen: una falla no es
 *   una ausencia de diferencias.
 * - El período, la vista, los filtros y la sesión abierta viven en la dirección: «Actualizar» y volver atrás los
 *   conservan.
 */
import {
  cantidad,
  componerLasSesiones,
  contarLasVistasDeSesiones,
  COPY_COMPARACION,
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  ejerciciosComparables,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  identidadDeVersiones,
  numero,
  observacionesDelEjercicio,
  repeticionesPlanificadas,
  sesionEnLaVista,
  VISTAS_DE_SESIONES,
  type ClaveDeVistaDeSesiones,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EjecucionDeEntrenamiento,
  type EjercicioDeSesion,
  type FilaDeSesion,
  type IdentidadDeVersiones,
  type ObjetivosDeLaVersion,
  type PlanConObjetivos,
  type Prescripcion,
  type RegistroDeEjecucion,
} from '@be/domain';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { Panel } from '../../../../components/panel';
import { BotonDeVista } from '../../../../components/vista-con-nombre';
import { api, type Resultado } from '../../../../lib/api';
import { dia, diaDelAnioEnCurso, fecha, horaEnZona, nombreDelDiaDeLaSemana } from '../../../../lib/formato';
import { ControlDePeriodo } from '../control-de-periodo';
import { ATAJOS_DE_UN_AREA, cambiosDePeriodo, MAXIMO_DE_DIAS_DE_UN_AREA, periodoALaVista, periodoPedidoEnUnArea, type PeriodoDeUnArea } from '../periodo-de-un-area';
import { useDetalleAlCostado } from '../seguimiento/al-costado';
import { hoyEn } from '../seguimiento/estado';
import { ICONO_DEL_RASGO } from '../seguimiento/hecho-en-un-renglon';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';
import { LineasDePrescripcion, numerosDeVersion } from './plan';
import { DescansosYDuracion, TiemposDeLaSesion, useTiemposDeLaSesion } from './series-y-tiempos';

type Contexto = ContextoDeRevisionDeEntrenamientoResponse['data'];

// El gráfico por serie (Recharts) se carga cuando se lo pide: la lista no paga su peso de entrada.
const ComparacionPorSerie = dynamic(() => import('./comparacion').then((m) => m.ComparacionPorSerie), { ssr: false, loading: () => <Cargando /> });

/** La vista elegida, como va en la dirección (`ver=`). Sin el parámetro, «Todas las sesiones». */
const VISTA_DEL_PARAMETRO: Readonly<Record<string, ClaveDeVistaDeSesiones>> = { 'con-diferencias': 'CON_DIFERENCIAS', 'con-desvio': 'CON_DESVIO_O_NO_REALIZADA', 'sin-registrar': 'SIN_REGISTRAR' };
const PARAMETRO_DE_LA_VISTA = Object.fromEntries(Object.entries(VISTA_DEL_PARAMETRO).map(([k, v]) => [v, k])) as Partial<Record<ClaveDeVistaDeSesiones, string>>;
const UNIDAD: readonly [string, string] = ['sesión', 'sesiones'];
/** Cuántas sesiones se muestran de una vez; «Ver sesiones anteriores» suma otras tantas. La lectura trae el período entero. */
const SESIONES_DE_UNA_VEZ = 15;

/** Los objetivos por serie de cada versión del plan que aparece en el período; `null`: esa versión no se pudo leer. */
type Planes = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly porVersion: ReadonlyMap<string, PlanConObjetivos | null> };

export function VistaDeEjecuciones() {
  const { token, asesoradoId, sesionPerdida, parametros, ir } = useEntrenamiento();
  const hoy = hoyEn();
  const claveDelPeriodo = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pedido = useMemo(() => periodoPedidoEnUnArea(parametros, hoy), [claveDelPeriodo, hoy]);
  const [r, setR] = useState<Resultado<Contexto> | null>(null);
  const [planes, setPlanes] = useState<Planes>({ tipo: 'cargando' });
  /** El número de cada versión (su orden de activación), si la lista de versiones se pudo leer. */
  const [numeros, setNumeros] = useState<ReadonlyMap<string, number>>(new Map());
  const generacion = useRef(0);

  /** Lee los objetivos por serie de las versiones que se le piden y los suma a los que ya hay. */
  const leerLosPlanes = useCallback(
    async (ids: readonly string[], anteriores: ReadonlyMap<string, PlanConObjetivos | null>, esta: number) => {
      const respuestas = await Promise.all(ids.map((planId) => api.planConObjetivos(token, planId)));
      if (esta !== generacion.current || respuestas.some((x) => sesionPerdida(x))) return;
      setPlanes({ tipo: 'listo', porVersion: new Map([...anteriores, ...ids.map((planId, i) => [planId, respuestas[i]!.ok ? (respuestas[i] as { datos: { data: PlanConObjetivos } }).datos.data : null] as const)]) });
    },
    [token, sesionPerdida],
  );

  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setR(null);
    setPlanes({ tipo: 'cargando' });
    const cx = await api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, pedido ? { periodStart: pedido.desde, periodEnd: pedido.hasta } : {});
    if (esta !== generacion.current || sesionPerdida(cx)) return;
    setR(cx.ok ? { ok: true, datos: cx.datos.data } : (cx as Resultado<never>));
    if (!cx.ok) return;
    await leerLosPlanes([...new Set(cx.datos.data.registeredExecutions.map((x) => x.planId))], new Map(), esta);
  }, [token, asesoradoId, sesionPerdida, pedido, leerLosPlanes]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  // El número de versión no es necesario para leer la lista: si no llega, la versión se nombra por su fecha.
  useEffect(() => {
    let vigente = true;
    void api.listarPlanesDeEntrenamiento(token, asesoradoId).then((lista) => {
      if (vigente && lista.ok) setNumeros(numerosDeVersion(lista.datos.data));
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId]);

  const contexto = r?.ok ? r.datos : null;
  const reintentarLosPlanes = () => {
    if (planes.tipo !== 'listo') return;
    const sinLeer = [...planes.porVersion].filter(([, plan]) => plan === null).map(([planId]) => planId);
    const leidos = new Map([...planes.porVersion].filter(([, plan]) => plan !== null));
    setPlanes({ tipo: 'cargando' });
    void leerLosPlanes(sinLeer, leidos, generacion.current);
  };
  const periodo = periodoALaVista(pedido, contexto?.period ?? null, hoy);
  const elegirPeriodo = (p: PeriodoDeUnArea) => ir({ ...cambiosDePeriodo(p), sesion: null }, { agregarAlHistorial: true });

  return (
    <section className="registros sesiones" aria-labelledby="titulo-sesiones">
      <div className="registros__encabezado">
        <h2 id="titulo-sesiones">Sesiones registradas</h2>
        <p className="nota registros__bajada">
          Lo indicado y lo registrado, serie por serie. Lo que no se registró dice «{COPY_ENTRENAMIENTO_POR_SERIE.sinRegistrar}»: no se interpreta.
        </p>
        {/* El período queda fuera del estado de lectura: si no se puede leer, sigue ahí para cambiarlo (B10-06:956-961). */}
        {periodo ? <ControlDePeriodo periodo={periodo} atajos={ATAJOS_DE_UN_AREA} maximoDeDias={MAXIMO_DE_DIAS_DE_UN_AREA} onElegir={elegirPeriodo} /> : null}
      </div>
      <EstadoDeLectura r={r} onReintentar={() => void cargar()}>
        {contexto ? planes.tipo === 'cargando' ? <Cargando /> : <Sesiones contexto={contexto} planes={planes.porVersion} numeros={numeros} hoy={hoy} pedido={pedido} onReintentarLosPlanes={reintentarLosPlanes} /> : null}
      </EstadoDeLectura>
    </section>
  );
}

function Sesiones({
  contexto,
  planes,
  numeros,
  hoy,
  pedido,
  onReintentarLosPlanes,
}: {
  contexto: Contexto;
  planes: ReadonlyMap<string, PlanConObjetivos | null>;
  numeros: ReadonlyMap<string, number>;
  hoy: string;
  pedido: PeriodoDeUnArea | null;
  onReintentarLosPlanes: () => void;
}) {
  const { asesoradoId, parametros, ir } = useEntrenamiento();
  const id = useId();
  const ejecuciones = contexto.registeredExecutions;
  const objetivosPorVersion = useMemo(() => new Map([...planes].map(([planId, plan]) => [planId, plan ? objetivosDe(plan) : null] as const)), [planes]);
  const identidad = useMemo(() => identidadDeVersiones(ejecuciones), [ejecuciones]);
  const todas = useMemo(() => componerLasSesiones(ejecuciones, objetivosPorVersion), [ejecuciones, objetivosPorVersion]);
  const sinLeer = [...planes].filter(([, plan]) => plan === null).length;

  // Los filtros de siempre. El ejercicio se elige por su identidad en el catálogo, no por su nombre: dos ejercicios con
  // el mismo nombre no se mezclan, y el filtro no ofrece lo que no hay en el período.
  const ejercicios = useMemo(() => ejerciciosComparables(ejecuciones), [ejecuciones]);
  const version = contexto.activePlanVersions.some((v) => v.planId === parametros.get('version')) ? (parametros.get('version') as string) : '';
  const ejercicio = ejercicios.some((e) => e.clave === parametros.get('ejercicio')) ? (parametros.get('ejercicio') as string) : '';
  const filtradas = useMemo(() => {
    const deLaVersion = ejecuciones.filter((x) => !version || x.planId === version);
    const conElEjercicio = ejercicio ? new Set(observacionesDelEjercicio(deLaVersion, ejercicio, ejecuciones).map((o) => o.comparacion.executionId)) : null;
    const quedan = new Set(deLaVersion.filter((x) => !conElEjercicio || conElEjercicio.has(x.executionId)).map((x) => x.executionId));
    return todas.filter((f) => quedan.has(f.id));
  }, [todas, ejecuciones, version, ejercicio]);
  const conFiltros = (version ? 1 : 0) + (ejercicio ? 1 : 0);
  const [masFiltros, setMasFiltros] = useState(conFiltros > 0);

  const cuentas = useMemo(() => contarLasVistasDeSesiones(filtradas), [filtradas]);
  const vista: ClaveDeVistaDeSesiones = VISTA_DEL_PARAMETRO[parametros.get('ver') ?? ''] ?? 'TODAS';
  const definicion = VISTAS_DE_SESIONES.find((v) => v.clave === vista)!;
  const aLaVista = useMemo(() => filtradas.filter((f) => sesionEnLaVista(f, vista)), [filtradas, vista]);
  // Un período largo no se muestra entero de una vez: las más nuevas, y las anteriores a pedido (la lectura ya las trajo).
  const [hasta, setHasta] = useState(SESIONES_DE_UNA_VEZ);
  useEffect(() => setHasta(SESIONES_DE_UNA_VEZ), [vista, version, ejercicio, contexto.period.start, contexto.period.end]);

  // La sesión abierta.
  const sesionId = parametros.get('sesion');
  const abierta = useMemo(() => todas.find((f) => f.id === sesionId) ?? null, [todas, sesionId]);
  const ejecucionAbierta = abierta ? (ejecuciones.find((x) => x.executionId === abierta.id) ?? null) : null;
  const alCostado = useDetalleAlCostado();
  const raiz = useRef<HTMLDivElement>(null);
  const detalle = useRef<HTMLElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const idDeLaAbierta = abierta?.id ?? null;
  // Al abrir el detalle al costado, el foco va a su título: con el teclado, el detalle está después de toda la lista.
  useEffect(() => {
    if (idDeLaAbierta !== null && alCostado) titulo.current?.focus({ preventScroll: true });
  }, [idDeLaAbierta, alCostado]);
  /** Cierra el detalle. Si el foco estaba adentro, vuelve a la fila de esa sesión. */
  const cerrar = useCallback(
    (devolverElFoco: boolean) => {
      const anterior = idDeLaAbierta;
      ir({ sesion: null });
      if (anterior === null || !devolverElFoco) return;
      // La dirección cambia en el próximo dibujo: el foco se devuelve después.
      requestAnimationFrame(() => raiz.current?.querySelector<HTMLElement>(`[data-sesion="${CSS.escape(anterior)}"]`)?.focus({ preventScroll: true }));
    },
    [idDeLaAbierta, ir],
  );
  const conDetalleAlCostado = abierta !== null && alCostado;
  useEffect(() => {
    if (!conDetalleAlCostado) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !(e.target instanceof Node) || !raiz.current?.contains(e.target)) return;
      cerrar(detalle.current?.contains(e.target) ?? false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [conDetalleAlCostado, cerrar]);

  const total = cuentas.TODAS ?? 0;
  const deLaVista = cuentas[vista];
  const versionDe = (planId: string): string => {
    const n = numeros.get(planId);
    const activada = contexto.activePlanVersions.find((v) => v.planId === planId)?.activatedAt ?? planes.get(planId)?.activatedAt ?? null;
    return n ? `versión ${n}` : activada ? `activado el ${dia(activada)}` : 'de ese día';
  };
  const tituloDeLaAbierta = abierta ? tituloDeLaSesion(abierta.sesion) : '';
  const contenidoDeLaAbierta =
    abierta && ejecucionAbierta ? (
      <DetalleDeLaSesion key={abierta.id} fila={abierta} ejecucion={ejecucionAbierta} identidad={identidad} objetivos={objetivosPorVersion.get(abierta.planId) ?? null} version={versionDe(abierta.planId)} onReintentarLosPlanes={onReintentarLosPlanes} />
    ) : null;

  // A Analizar va con el período que se está mirando, si es uno elegido: allá el ejercicio se elige de nuevo.
  const haciaAnalizar = `/pro/advisees?id=${encodeURIComponent(asesoradoId)}&vista=analizar&pregunta=progreso-de-un-ejercicio${pedido ? (pedido.preset ? `&p=${pedido.preset}` : `&desde=${pedido.desde}&hasta=${pedido.hasta}`) : ''}`;

  return (
    <>
      <div className="vistas-de-la-linea registros__vistas">
        <div className="vistas-de-la-linea__vistas" role="group" aria-labelledby={`${id}-ver`}>
          <span id={`${id}-ver`} className="vistas-de-la-linea__rotulo">
            Ver
          </span>
          {VISTAS_DE_SESIONES.map((v) => (
            <BotonDeVista
              key={v.clave}
              clave={v.clave}
              nombre={v.nombre}
              icono={v.icono}
              elegida={vista === v.clave}
              cuenta={cuentas[v.clave]}
              unidad={UNIDAD}
              // Elegir una vista reemplaza a la que estaba; volver a tocarla deja «Todas las sesiones». No le pide nada a la API.
              onElegir={() => ir({ ver: vista === v.clave ? null : (PARAMETRO_DE_LA_VISTA[v.clave] ?? null), sesion: null }, { agregarAlHistorial: true })}
            />
          ))}
        </div>
        <button type="button" className="boton boton--secundario boton--compacto sesiones__mas-filtros" aria-expanded={masFiltros} aria-controls={`${id}-filtros`} onClick={() => setMasFiltros(!masFiltros)}>
          <Icono nombre="filtros" tamano={18} />
          Más filtros{conFiltros > 0 ? ` · ${conFiltros}` : ''}
        </button>
      </div>
      {masFiltros ? (
        <div id={`${id}-filtros`} className="fila-de-dato sesiones__filtros">
          <div className="campo">
            <label htmlFor={`${id}-version`}>Versión del plan</label>
            <select id={`${id}-version`} value={version} onChange={(e) => ir({ version: e.target.value || null, sesion: null })}>
              <option value="">Todas</option>
              {contexto.activePlanVersions.map((v) => (
                <option key={v.planId} value={v.planId}>
                  {numeros.get(v.planId) ? `Versión ${numeros.get(v.planId)} · activada` : 'Activada'} el {fecha(v.activatedAt as string)}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor={`${id}-ejercicio`}>Ejercicio</label>
            <select id={`${id}-ejercicio`} value={ejercicio} onChange={(e) => ir({ ejercicio: e.target.value || null, sesion: null })}>
              <option value="">Todos</option>
              {ejercicios.map((e) => (
                <option key={e.clave} value={e.clave}>
                  {nombreParaElegir(e, ejercicios)}
                </option>
              ))}
            </select>
            {ejercicios.some((e) => e.homonimo) ? <p className="campo__ayuda">Hay ejercicios con el mismo nombre que no se pueden identificar como el mismo: se listan por separado.</p> : null}
          </div>
        </div>
      ) : null}

      {sinLeer > 0 ? (
        <BloqueDeEstado tipo="error" icono="servicio" titulo="No pudimos leer lo indicado de algunas sesiones" onReintentar={onReintentarLosPlanes} deQue="la lectura de lo indicado">
          {sinLeer === 1 ? 'Una versión del plan no se pudo leer' : `${numero(sinLeer)} versiones del plan no se pudieron leer`}. Sus sesiones están abajo, con lo registrado; falta saber lo indicado de cada serie: por eso «{VISTAS_DE_SESIONES[1]!.nombre}» no
          tiene cantidad.
        </BloqueDeEstado>
      ) : null}

      {/* Con «Todas las sesiones» y sin filtros, la cantidad ya está en la vista: a la vista no se repite. */}
      <p className={vista === 'TODAS' && conFiltros === 0 ? 'visualmente-oculto' : 'nota registros__cuenta'} role="status">
        {vista === 'TODAS'
          ? `${numero(total)} ${total === 1 ? UNIDAD[0] : UNIDAD[1]}`
          : deLaVista === null
            ? `«${definicion.nombre}» no se puede contar sin esa lectura`
            : `${numero(deLaVista)} de ${numero(total)} ${total === 1 ? UNIDAD[0] : UNIDAD[1]}: ${definicion.nombre.toLowerCase()}`}
        {conFiltros > 0 ? ` · con ${conFiltros === 1 ? 'un filtro' : 'dos filtros'} de «Más filtros» (de ${numero(todas.length)} en el período)` : ''}
      </p>

      {aLaVista.length === 0 ? (
        <EstadoVacio
          titulo={
            todas.length === 0
              ? COPY_ENTRENAMIENTO.sinEjecuciones
              : vista !== 'TODAS' && deLaVista === null
                ? `No se puede saber qué sesiones trae «${definicion.nombre}».`
                : vista !== 'TODAS'
                  ? `Ninguna sesión coincide con «${definicion.nombre}».`
                  : 'Ninguna sesión registrada del período coincide con los filtros.'
          }
          accion={
            todas.length === 0 ? undefined : (
              <button type="button" className="boton boton--secundario" onClick={() => ir({ ver: null, version: null, ejercicio: null }, { agregarAlHistorial: true })}>
                Ver todas las sesiones
              </button>
            )
          }
        >
          {todas.length > 0 ? <p className="nota">{todas.length === 1 ? 'Hay una sesión registrada' : `Hay ${numero(todas.length)} sesiones registradas`} en el período elegido.</p> : null}
        </EstadoVacio>
      ) : (
        <div ref={raiz} className="linea__cuerpo sesiones__cuerpo" data-con-detalle={conDetalleAlCostado ? 'si' : undefined}>
          <div className="registros__lista sesiones__lista">
            {/* Los nombres de las columnas, una vez. Para el lector de pantalla, cada dato lleva su rótulo en la fila. */}
            <div className="registros__columnas sesiones__columnas" aria-hidden="true">
              <span>Día</span>
              <span>Sesión y condición</span>
              <span>Series</span>
              <span>Frente a lo indicado</span>
            </div>
            <ul className="sesiones__filas">
              {aLaVista.slice(0, hasta).map((f) => (
                <Fila key={f.id} fila={f} hoy={hoy} elegida={f.id === idDeLaAbierta} onAbrir={() => ir({ sesion: f.id })} />
              ))}
            </ul>
            {aLaVista.length > hasta ? (
              <div className="acciones linea__mas">
                <button type="button" className="boton boton--secundario" onClick={() => setHasta(hasta + SESIONES_DE_UNA_VEZ)}>
                  Ver sesiones anteriores
                </button>
                <span className="nota">
                  Se ven {numero(Math.min(hasta, aLaVista.length))} de {numero(aLaVista.length)} sesiones, hasta la del {diaDelAnioEnCurso(aLaVista[Math.min(hasta, aLaVista.length) - 1]!.fecha, hoy)}.
                </span>
              </div>
            ) : null}
          </div>
          {abierta && alCostado ? (
            <aside ref={detalle} className="detalle-del-hecho detalle-de-sesion" aria-labelledby={`${id}-detalle`}>
              <div className="detalle-del-hecho__cabecera">
                <p className="detalle-del-hecho__rotulo">Detalle del registro</p>
                <button type="button" className="boton boton--enlace" onClick={() => cerrar(true)}>
                  <Icono nombre="cerrar" tamano={18} />
                  Cerrar
                </button>
              </div>
              <h3 id={`${id}-detalle`} ref={titulo} tabIndex={-1}>
                {tituloDeLaAbierta}
              </h3>
              {contenidoDeLaAbierta}
            </aside>
          ) : null}
        </div>
      )}

      <DiasSinSesion dias={contexto.missingData} />
      <p className="sesiones__a-analizar">
        <Icono nombre="analizar" tamano={18} />
        <Link href={haciaAnalizar}>¿Cómo viene progresando un ejercicio? Verlo en Analizar</Link>
      </p>

      {/* En una ventana angosta el detalle no entra al costado: se abre encima, en un panel que retiene el foco. */}
      <Panel abierto={abierta !== null && !alCostado} titulo={tituloDeLaAbierta} onCerrar={() => ir({ sesion: null })}>
        {abierta && !alCostado ? contenidoDeLaAbierta : null}
      </Panel>
    </>
  );
}

/** «Sesión B · Tren superior»: la palabra no se antepone si el nombre ya empieza con ella (los nombres por omisión son «Sesión A»). */
const tituloDeLaSesion = (nombre: string): string => (/^sesi[oó]n\b/i.test(nombre.trim()) ? nombre : `Sesión ${nombre}`);

/** Un dato de la fila con su rótulo para el lector de pantalla (a la vista, el rótulo está una vez, arriba de la lista). */
function Dato({ rotulo, className, children }: { rotulo: string; className?: string; children: ReactNode }) {
  return (
    <span className={className}>
      <span className="visualmente-oculto">{rotulo}: </span>
      {children}
    </span>
  );
}

/**
 * Una frase hecha de partes separadas por « · » («3 series sin registrar · 1 serie con diferencias»), en la fila de una
 * sesión. Las partes son largas y en una lista angosta no entran en un renglón: el texto corre como cualquier otro, pero
 * el número no se separa de lo que cuenta («1» arriba y «serie con diferencias» abajo) y el separador queda al final del
 * renglón de arriba, nunca al principio del de abajo. Son espacios que no se parten: el texto que se lee es el mismo.
 */
function FraseEnPartes({ texto }: { texto: string }) {
  return (
    <>
      {texto
        .split(' · ')
        .map((parte) => parte.replace(/^(\d+) /, '$1 '))
        .join(' · ')}
    </>
  );
}

/**
 * Un dato hecho de partes cortas separadas por « · » («77,5 kg · 6 rep. · RIR 1»), en la tabla del detalle. Si no entra
 * en un renglón, baja una parte entera, con el separador al final del renglón de arriba: no queda «RIR» en un renglón y
 * su número en el otro. Una parte más ancha que su columna se parte adentro, como cualquier texto. El texto que se lee
 * es el mismo.
 */
function EnPartes({ texto }: { texto: string }) {
  const partes = texto.split(' · ');
  if (partes.length === 1) return <>{texto}</>;
  return (
    <>
      {partes.map((parte, i) => (
        <Fragment key={i}>
          <span className="parte-de-dato">{i < partes.length - 1 ? `${parte} ·` : parte}</span>
          {i < partes.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

/** La condición con que quedó registrada la sesión. Lo de siempre va en texto; lo que se sale, con su ícono. */
function Condicion({ fila }: { fila: FilaDeSesion }) {
  if (!fila.condicion) return null;
  if (!fila.conDesvioONoRealizada) return <span className="sesion-registrada__tenue">{fila.condicion}</span>;
  return (
    <span className="etiqueta-de-dato">
      <Icono nombre={ICONO_DEL_RASGO[fila.clase === 'POR_SERIE' || fila.clase === 'RESUMIDA' ? 'SESION_CON_CAMBIOS' : 'SESION_NO_REALIZADA']} tamano={15} />
      {fila.condicion}
    </span>
  );
}

const Corregida = () => (
  <span className="etiqueta-de-dato">
    <Icono nombre={ICONO_DEL_RASGO.CORREGIDO} tamano={15} />
    Corregida
  </span>
);

function Fila({ fila, hoy, elegida, onAbrir }: { fila: FilaDeSesion; hoy: string; elegida: boolean; onAbrir: () => void }) {
  return (
    <li className="sesion-registrada" data-clase={fila.clase}>
      <button type="button" className="sesion-registrada__fila" data-sesion={fila.id} aria-current={elegida ? 'true' : undefined} onClick={onAbrir}>
        <Dato rotulo="Día" className="sesion-registrada__dia">
          <strong>{diaDelAnioEnCurso(fila.fecha, hoy)}</strong>
          <span className="sesion-registrada__tenue">{nombreDelDiaDeLaSemana(fila.fecha)}</span>
        </Dato>
        <Dato rotulo="Sesión y condición" className="sesion-registrada__sesion">
          <strong>{fila.sesion}</strong>
          <Condicion fila={fila} />
          {fila.fuente.tipo === 'correccion' ? <Corregida /> : null}
        </Dato>
        <Dato rotulo="Series" className="sesion-registrada__series">
          <FraseEnPartes texto={fila.series} />
        </Dato>
        <Dato rotulo="Frente a lo indicado" className="sesion-registrada__frente">
          <FraseEnPartes texto={fila.frente} />
        </Dato>
        <Icono nombre="derecha" tamano={18} />
      </button>
    </li>
  );
}

/** Los días del período sin ninguna sesión registrada: cuántos son y, a pedido, cuáles. Sin dato no es «no entrenó». */
function DiasSinSesion({ dias }: { dias: readonly string[] }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  if (dias.length === 0) return <p className="nota sesiones__sin-sesion">Todos los días del período tienen una sesión registrada.</p>;
  return (
    <div className="sesiones__sin-sesion">
      <p>
        <strong>{dias.length === 1 ? 'Un día del período' : `${numero(dias.length)} días del período`} sin sesión registrada.</strong> Sin registro no quiere decir que no haya entrenado: no hay dato.{' '}
        <button type="button" className="boton boton--enlace" aria-expanded={abierto} aria-controls={`${id}-dias`} onClick={() => setAbierto(!abierto)}>
          {abierto ? 'Ocultar los días' : 'Ver los días'}
        </button>
      </p>
      {abierto ? (
        <p id={`${id}-dias`} className="nota">
          {dias.map((f) => dia(`${f}T12:00:00Z`)).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}

// ─── El detalle de una sesión ───────────────────────────────────────────────────────────────────────────────

/** «a las 19:22» si se registró el mismo día en que ocurrió (en la zona de la sesión); si no, con su fecha. */
function seRegistro(x: EjecucionDeEntrenamiento): string {
  let elMismoDia = false;
  try {
    elMismoDia = new Intl.DateTimeFormat('en-CA', { timeZone: x.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(x.recordedAt)) === x.date;
  } catch {
    elMismoDia = false;
  }
  return elMismoDia ? `a las ${horaEnZona(x.recordedAt, x.timeZone)}` : `el ${fecha(x.recordedAt)}`;
}

function DetalleDeLaSesion({
  fila,
  ejecucion: x,
  identidad,
  objetivos,
  version,
  onReintentarLosPlanes,
}: {
  fila: FilaDeSesion;
  ejecucion: EjecucionDeEntrenamiento;
  identidad: IdentidadDeVersiones;
  objetivos: ObjetivosDeLaVersion | null;
  /** «versión 3», o «activado el 3 ago» si el número no se pudo saber. */
  version: string;
  onReintentarLosPlanes: () => void;
}) {
  const tiempos = useTiemposDeLaSesion(x.executionId);
  const vigente = x.effectiveView.kind === 'CORRECTED' ? (x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId) ?? null) : null;
  const [grafico, setGrafico] = useState(false);
  return (
    <>
      <p className="datos-del-hecho__rasgos">
        <Condicion fila={fila} />
        {fila.comoSeRegistro ? <span className="etiqueta-de-dato">{fila.comoSeRegistro}</span> : null}
        {fila.fuente.tipo === 'correccion' ? <Corregida /> : null}
      </p>
      <p className="nota detalle-de-sesion__cuando">
        Ocurrió el {diaDelAnioEnCurso(x.date, hoyEn())} a las {horaEnZona(x.occurredAt, x.timeZone)} · se registró {seRegistro(x)} · frente al plan {version}, el de ese día
      </p>
      {fila.motivo ? (
        <p>
          <strong>Motivo que escribió la persona:</strong> «{fila.motivo}»
        </p>
      ) : null}
      {fila.resumenDeLaSesion ? (
        <p>
          <strong>Resumen de la sesión:</strong> «{fila.resumenDeLaSesion}»
        </p>
      ) : null}
      {fila.fuente.tipo === 'correccion' ? (
        <p className="nota">
          Rige una corrección: {fila.fuente.rolDelAutor === 'PROFESSIONAL' ? COPY_ENTRENAMIENTO.corregidoPorElProfesional : 'Corregido por el asesorado'} ({fila.fuente.autor}), el {fecha(fila.fuente.registradaEl)}. Motivo: {fila.fuente.motivo}
        </p>
      ) : null}
      {fila.fuente.tipo === 'no-resoluble' ? <p>{COPY_COMPARACION.vistaNoResoluble}</p> : null}
      {fila.clase === 'NO_REALIZADA' ? <p className="nota">{fila.series}. {fila.frente}.</p> : null}
      {!fila.seLeyoLoIndicado && fila.ejercicios.length > 0 ? (
        <BloqueDeEstado tipo="error" icono="servicio" titulo="No pudimos leer lo indicado de esta sesión" onReintentar={onReintentarLosPlanes} deQue="la lectura de lo indicado">
          Lo registrado está abajo. De lo indicado se ven las repeticiones; faltan la carga y el RIR de cada serie, y por eso no se compara.
        </BloqueDeEstado>
      ) : null}

      {fila.ejercicios.length > 0 ? <TablaDeSeries ejercicios={fila.ejercicios} /> : null}

      <TiemposDeLaSesion tiempos={tiempos} />

      <div className="detalle-de-sesion__mas">
        {/* Sin tiempos marcados no hay descansos ni duraciones que abrir: ya lo dice el renglón de arriba. */}
        {tiempos.tipo === 'listo' && tiempos.datos.state === 'NOT_STARTED' ? null : (
          <details>
            <summary>
              <Icono nombre="descanso" tamano={18} />
              Descansos y duración de cada serie
            </summary>
            <DescansosYDuracion ejecucion={x} tiempos={tiempos} />
          </details>
        )}
        <details>
          <summary>
            <Icono nombre="plan" tamano={18} />
            Ver la sesión en el plan
          </summary>
          <SesionEnElPlan ejecucion={x} version={version} />
        </details>
        {fila.clase === 'POR_SERIE' ? (
          <details onToggle={(e) => setGrafico((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>
              <Icono nombre="analizar" tamano={18} />
              Ver en un gráfico
            </summary>
            {/* Se dibuja solo abierto: un gráfico dentro de un bloque cerrado no tiene medidas. */}
            {grafico ? <ComparacionPorSerie ejecucion={x} identidad={identidad} objetivos={objetivos ?? undefined} /> : null}
          </details>
        ) : null}
        <details>
          <summary>
            <Icono nombre="origen" tamano={18} />
            {x.corrections.length > 0 ? 'Registro original y correcciones' : 'Registro original'}
          </summary>
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
      </div>
    </>
  );
}

/**
 * Cada serie una sola vez (C-66): lo indicado, lo registrado y cómo quedó frente a lo indicado. Un renglón por
 * ejercicio dice cuántas series se registraron. La serie con una diferencia va en negrita, y además lo dice su texto.
 */
function TablaDeSeries({ ejercicios }: { ejercicios: readonly EjercicioDeSesion[] }) {
  return (
    <div className="desplazable-x">
      <table className="tabla tabla--compacta tabla-de-series tabla-de-series--frente-a-lo-indicado">
        <caption className="visualmente-oculto">Lo indicado y lo registrado, serie por serie</caption>
        <thead>
          <tr>
            <th scope="col">Serie</th>
            <th scope="col">Indicado</th>
            <th scope="col">Registrado</th>
            <th scope="col">Frente a lo indicado</th>
          </tr>
        </thead>
        {ejercicios.map((e) => (
          <tbody key={e.prescriptionId} data-ejercicio={e.prescriptionId}>
            <tr className="tabla-de-series__ejercicio">
              <th colSpan={4} scope="rowgroup">
                <strong>{e.nombre}</strong>
                {e.enLugarDe ? (
                  <>
                    {' '}
                    <span className="etiqueta-de-dato">{COPY_ENTRENAMIENTO.sustituido}</span> <span className="tabla-de-series__cuenta">en lugar de {e.enLugarDe}</span>
                  </>
                ) : null}{' '}
                <span className="tabla-de-series__cuenta">
                  {e.cuenta}
                  {e.notaDeLoIndicado ? ` · ${e.notaDeLoIndicado}` : ''}
                </span>
                {e.aviso ? <span className="tabla-de-series__aviso">{e.aviso}</span> : null}
                {e.resumen ? <span className="tabla-de-series__aviso">«{e.resumen}»</span> : null}
              </th>
            </tr>
            {e.series.map((s) => (
              <tr key={s.numero} data-estado={s.estado} data-con-diferencia={s.conDiferencia ? 'si' : undefined}>
                <th scope="row">{numero(s.numero)}</th>
                <td>
                  <EnPartes texto={s.indicado} />
                  {s.nota ? <span className="tabla-de-series__nota">Nota: {s.nota}</span> : null}
                </td>
                <td>
                  <EnPartes texto={s.registrado} />
                  {s.corregida ? (
                    <>
                      {' '}
                      <Corregida />
                    </>
                  ) : null}
                </td>
                <td>
                  <EnPartes texto={s.frente} />
                  {/* Lo de la carga va aparte y sin negrita: se dice, y no cuenta como diferencia. */}
                  {s.frenteDeLaCarga ? <span className="tabla-de-series__nota">{s.frenteDeLaCarga}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** La sesión tal como estaba en el plan de ese día (su instantánea): no la de la versión vigente hoy. Solo lectura. */
function SesionEnElPlan({ ejecucion: x, version }: { ejecucion: EjecucionDeEntrenamiento; version: string }) {
  return (
    <>
      <p className="nota">
        {tituloDeLaSesion(x.plannedSession.label)}, en el plan {version}: lo general de cada ejercicio. El objetivo de cada serie está en la tabla de arriba.
      </p>
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
    </>
  );
}

/**
 * Lo registrado de una sesión, ejercicio por ejercicio, sin reinterpretar un registro agregado como series. Con
 * `planificado` (las prescripciones de la versión que rigió esa sesión), cada serie registrada dice también lo
 * planificado para ella: «· planificadas 8». Sin porcentajes ni colores: comparar no es calificar (DL-105). Lo usa
 * también la ficha, para mostrar el registro original de una sesión.
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

/** « · planificadas 8» para una serie registrada, o nada si esa serie no estaba planificada o no fijaba repeticiones. */
function planificadasPara(planificado: readonly Prescripcion[], prescriptionId: string, setIndex: number): string {
  const serie = planificado.find((p) => p.prescriptionId === prescriptionId)?.sets.find((s) => s.setIndex === setIndex);
  const reps = serie ? repeticionesPlanificadas(serie) : null;
  if (reps === null) return '';
  return ` · ${reps === '1' ? COPY_ENTRENAMIENTO.planificada : COPY_ENTRENAMIENTO.planificadas} ${reps}`;
}
