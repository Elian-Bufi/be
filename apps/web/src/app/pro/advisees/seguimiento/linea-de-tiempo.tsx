'use client';

/**
 * Línea de tiempo («¿Qué pasó y cuándo?»; API-DSH-04; ESPECIFICACION.md §3):
 * - **Una entrada por hecho,** en el día civil en que ocurrió, con lo que ocurrió y lo que se registró por separado y la
 *   carga tardía dicha (T-06-24; PRO-03).
 * - **Una rectificación es una relación** de la entrada original, no un consumo nuevo; una anulación deja la entrada,
 *   marcada (PRO-16).
 * - **Filtros en la URL** (área, tipo, estado, calidad, carga tardía, plan y ejercicio); la búsqueda libre, no: la
 *   escribe el profesional y puede nombrar algo de salud (DL-127). Tampoco viaja en la URL de la API: va en el cuerpo de
 *   un POST (API-DSH-04-BUSQUEDA), con los mismos filtros, el mismo PDP y la misma paginación. La búsqueda y los conteos
 *   recorren el período completo del conjunto autorizado, no solo lo cargado (PRO-04).
 * - **Paginación con cursor estable;** un cambio de filtro descarta las páginas viejas, y una respuesta tardía de otro
 *   filtro no se pinta (PRO-21).
 * - **Estados distintos:** sin datos en el período, sin coincidencias y error (no se ve como vacío).
 * - **Desde la síntesis del Resumen** (WP-DASHBOARD-COMPRENSION, eje 6): `novedades=<instante>` muestra solo lo nuevo
 *   desde la última revisión de un área (lo que ocurrió después, lo cargado después y lo corregido después), con la misma
 *   ventana que contó el Resumen (hasta un año) y un aviso que lo explica y se puede quitar.
 *
 * WP-ESCRITORIO-AMABLE, parte 4 (C-06, C-07 y C-25): **el día es la unidad.** Los hechos son los mismos; cambia cómo se
 * leen juntos (`dia-de-la-linea.ts`, del dominio):
 * - Cada hecho es un renglón que se abre entero. Los hitos van primero y pesan más; las comidas de un día van en un
 *   renglón («Comidas · 4 registradas») que dice cuántas tienen algo distinto de lo de siempre, y se abre en el lugar.
 * - Un día que solo tiene sus comidas, sin nada distinto, va en un renglón liso; la tarjeta queda para los días con una
 *   sesión, un hito o un rasgo para mirar.
 * - Las vistas con nombre («Hitos», «Sin confirmar»…) son los filtros de siempre, con el nombre de lo que se busca y la
 *   cantidad de hechos que traen. La combinación libre sigue entera en «Más filtros».
 * - El detalle se abre al costado, sin tapar la lista; en una ventana angosta, encima, como un panel que se cierra.
 * - Se muestran días enteros: si quedan hechos por leer, el último día leído espera a «Ver días anteriores».
 * Lo que cada renglón ya no repite («Registrado el…», quién lo cargó, la versión del plan) está en el detalle.
 */
import {
  componerLosDias,
  COPY_VINCULO,
  cuentaDeLaVista,
  diasSinHechosEntre,
  DOMINIO_DE_LA_CALIDAD,
  DOMINIO_DE_TIPO_DE_EVENTO,
  esHito,
  fechaCivil,
  NOMBRE_DE_DOMINIO,
  NOMBRE_DE_TIPO_DE_EVENTO,
  NOMBRE_DEL_RASGO,
  numero,
  rasgoDeVariasComidas,
  rasgosDeUnHecho,
  TIPOS_DE_EVENTO,
  TIPOS_DE_HITO,
  vistaDeLosFiltros,
  VISTAS_DE_LA_LINEA,
  type BusquedaEnLineaDeTiempoRequest,
  type CalidadDeEntrada,
  type ConteosDelPeriodo,
  type DiaDeLaLinea,
  type DominioDeAnalisis,
  type EntradaDeLineaDeTiempo,
  type EstadoDeEntrada,
  type GrupoDeComidas,
  type LineaDeTiempoResponse,
  type NombreDeIcono,
  type ProyeccionResponse,
  type RasgoDeUnHecho,
  type TipoDeEvento,
  type VistaDeLaLinea,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaCivil, diaDelAnioEnCurso, fechaEnZona, horaEnZona } from '../../../../lib/formato';
import { motivoDeFalla, razonDeFalla, textoDeFalla, useLectura, useSeguimiento, type MotivoDeFalla } from './contexto';
import { hoyEn, leerCorte, leerFiltrosDeLaLinea, parametrosDeFiltros, restarDias, SIN_FILTROS, type FiltrosDeLaLinea } from './estado';
import { cambiosDelRegistro, dondeCoincide, frenteALoIndicadoDe, ICONO_DEL_RASGO, numeroDeVersionDe, relacionesEnPalabras, renglonDelHecho, textoDelHueco, tituloDelHecho } from './hecho-en-un-renglon';
import { ICONO_DE_FALLA } from './iconos-de-metrica';

const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });
const ContenidoDelRegistro = dynamic(() => import('./registro-original').then((m) => m.ContenidoDelRegistro), { ssr: false, loading: () => <Cargando /> });
const EnlaceAlArea = dynamic(() => import('./registro-original').then((m) => m.EnlaceAlArea), { ssr: false });

const POR_PAGINA = 50;
const ZONA = 'America/Argentina/Buenos_Aires';
/** Desde este ancho (1200 px) el detalle entra al costado de la lista: vale para 1280 y más. Más angosto, se abre encima. */
const DETALLE_AL_COSTADO = '(min-width: 75rem)';

type ConsultaDeLaLinea = {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly domain?: string;
  readonly type?: string;
  readonly state?: string;
  readonly quality?: string;
  readonly late?: 'true';
  readonly planVersionId?: string;
  readonly exerciseId?: string;
  readonly since?: string;
  readonly limit: string;
};

/** El cuerpo de API-DSH-04-BUSQUEDA: el texto y los mismos filtros de la consulta, con sus tipos (no como texto de URL). */
function cuerpoDeBusqueda(c: ConsultaDeLaLinea, q: string, cursor: string | null): BusquedaEnLineaDeTiempoRequest {
  return {
    q,
    periodStart: c.periodStart,
    periodEnd: c.periodEnd,
    ...(c.domain ? { domain: c.domain } : {}),
    ...(c.type ? { type: c.type } : {}),
    ...(c.state ? { state: c.state } : {}),
    ...(c.quality ? { quality: c.quality } : {}),
    ...(c.late ? { late: true } : {}),
    ...(c.planVersionId ? { planVersionId: c.planVersionId } : {}),
    ...(c.exerciseId ? { exerciseId: c.exerciseId } : {}),
    ...(c.since ? { since: c.since } : {}),
    limit: Number(c.limit),
    ...(cursor ? { cursor } : {}),
  };
}

const ESTADOS: readonly { readonly clave: EstadoDeEntrada; readonly texto: string }[] = [
  { clave: 'EFFECTIVE', texto: 'Vigente' },
  { clave: 'RECTIFIED', texto: 'Rectificado' },
  { clave: 'CORRECTED', texto: 'Corregido' },
  { clave: 'ANNULLED', texto: 'Anulado' },
];
const CALIDADES: readonly { readonly clave: CalidadDeEntrada; readonly texto: string }[] = [
  // El modo de registro de las cantidades, y aparte una diferencia comprobada: informadas a mano no es «distintas».
  { clave: 'QUANTITIES_UNCONFIRMED', texto: 'Cantidades sin confirmar' },
  { clave: 'QUANTITIES_FROM_PLAN', texto: 'Porciones del plan, confirmadas' },
  { clave: 'QUANTITIES_REPORTED', texto: 'Cantidades informadas a mano' },
  { clave: 'QUANTITIES_DIFFER_FROM_PLAN', texto: 'Distintas de lo indicado (comprobado)' },
  { clave: 'NUTRIENTS_INCOMPLETE', texto: 'Falta algún nutriente' },
  { clave: 'DIFFERENT_MEAL', texto: 'Comida diferente' },
  { clave: 'SESSION_SUMMARY_ONLY', texto: 'Sesión resumida, sin series' },
  { clave: 'SESSION_NOT_COMPLETED', texto: 'Sesión no realizada' },
  { clave: 'SESSION_WITH_DEVIATION', texto: 'Sesión con cambios' },
];
const NOMBRE_DE_ESTADO: Readonly<Record<EstadoDeEntrada, string>> = { EFFECTIVE: 'Vigente', RECTIFIED: 'Rectificado', CORRECTED: 'Corregido', ANNULLED: 'Anulado' };
const ICONO_DE_LA_VISTA: Readonly<Record<VistaDeLaLinea['clave'], NombreDeIcono | null>> = { TODO: null, HITOS: 'hito', DISTINTO_DE_LO_INDICADO: 'distinto', SIN_CONFIRMAR: 'sin-confirmar' };
const ICONO_DEL_DOMINIO: Readonly<Record<DominioDeAnalisis, NombreDeIcono>> = { NUTRITION: 'nutricion', TRAINING: 'entrenamiento', ANTHROPOMETRY: 'antropometria' };

const diaLargo = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
/** «Jueves, 8 de octubre de 2026»: mayúscula solo al principio, como se escribe en castellano. */
const fechaLarga = (civil: string) => {
  const texto = diaLargo.format(new Date(`${civil}T12:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};
const soloDiaDeLaSemana = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' });
const diaDeLaSemana = (civil: string) => soloDiaDeLaSemana.format(new Date(`${civil}T12:00:00Z`));
/** «24 sept, 13:30»: un instante en la zona del hecho, sin el año si es el año en curso. */
const momento = (instante: string, zona: string, hoy: string) => `${diaDelAnioEnCurso(fechaCivil(instante, zona), hoy)}, ${horaEnZona(instante, zona)}`;
const mismosTipos = (a: readonly TipoDeEvento[], b: readonly TipoDeEvento[]) => a.length === b.length && b.every((t) => a.includes(t));

/** Si la ventana tiene lugar para el detalle al costado. En el primer dibujo no se sabe: se supone que no. */
function useDetalleAlCostado(): boolean {
  const [entra, setEntra] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia(DETALLE_AL_COSTADO);
    const actualizar = () => setEntra(consulta.matches);
    actualizar();
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);
  return entra;
}

interface Revision {
  readonly dominio: 'NUTRITION' | 'TRAINING';
  readonly instante: string;
}

export function LineaDeTiempo() {
  const { token, asesoradoId, periodo, parametros, ir, sesionPerdida, panel } = useSeguimiento();
  const id = useId();
  const raiz = useRef<HTMLElement>(null);
  const filtros = useMemo(() => leerFiltrosDeLaLinea(parametros), [parametros]);
  const corte = useMemo(() => leerCorte(parametros), [parametros]);
  // Con un corte, la ventana es la del Resumen (hasta un año hacia atrás): así el conteo es el mismo que se vio allí.
  const hoy = hoyEn();
  const periodoDeLaConsulta = corte ? { desde: restarDias(hoy, 365), hasta: hoy } : { desde: periodo.desde, hasta: periodo.hasta };
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const consulta = useMemo<ConsultaDeLaLinea>(
    () => ({
      periodStart: periodoDeLaConsulta.desde,
      periodEnd: periodoDeLaConsulta.hasta,
      domain: filtros.dominios.length ? filtros.dominios.join(',') : undefined,
      type: filtros.tipos.length ? filtros.tipos.join(',') : undefined,
      state: filtros.estados.length ? filtros.estados.join(',') : undefined,
      quality: filtros.calidades.length ? filtros.calidades.join(',') : undefined,
      late: filtros.soloTardias ? ('true' as const) : undefined,
      planVersionId: filtros.planVersionId ?? undefined,
      exerciseId: filtros.exerciseKey ?? undefined,
      since: corte ?? undefined,
      limit: String(POR_PAGINA),
    }),
    [periodoDeLaConsulta.desde, periodoDeLaConsulta.hasta, filtros, corte],
  );
  // Con texto, la lectura es API-DSH-04-BUSQUEDA (el texto en el cuerpo); sin texto, API-DSH-04. La clave es solo de memoria.
  const leerPagina = useCallback(
    (cursor: string | null) =>
      busqueda ? api.buscarEnLineaDeTiempo(token, asesoradoId, cuerpoDeBusqueda(consulta, busqueda, cursor)) : api.lineaDeTiempo(token, asesoradoId, cursor ? { ...consulta, cursor } : consulta),
    [token, asesoradoId, consulta, busqueda],
  );
  const clave = `${asesoradoId}|${JSON.stringify(consulta)}|${busqueda}`;
  const { lectura, recargar } = useLectura<LineaDeTiempoResponse>(clave, () => leerPagina(null));
  const primera = lectura.tipo === 'listo' ? lectura.datos : null;

  // Las tandas siguientes siguen a una primera lectura: llevan su clave y el instante en que se armó. Se descartan si la
  // consulta cambió mientras llegaban, y también si la primera se volvió a leer («Actualizar»): pegarle a una lectura
  // nueva las tandas de la anterior podía repetir o perder un hecho que entró en el medio (E-58).
  const tanda = `${clave}|${primera?.data.generatedAt ?? ''}`;
  const [mas, setMas] = useState<{ clave: string; entradas: EntradaDeLineaDeTiempo[]; cursor: string | null; cargando: boolean; error: MotivoDeFalla | null }>({ clave: tanda, entradas: [], cursor: null, cargando: false, error: null });
  const tandaActual = useRef(tanda);
  tandaActual.current = tanda;
  const extras = mas.clave === tanda ? mas : { clave: tanda, entradas: [], cursor: null, cargando: false, error: null };
  const cursor = extras.entradas.length > 0 ? extras.cursor : (primera?.page.nextCursor ?? null);
  const verMas = useCallback(async () => {
    if (!cursor) return;
    const pedida = tanda;
    setMas((m) => ({ ...(m.clave === pedida ? m : { clave: pedida, entradas: [], cursor: null }), cargando: true, error: null }));
    const r = await leerPagina(cursor);
    if (tandaActual.current !== pedida || sesionPerdida(r)) return;
    if (!r.ok) return setMas((m) => ({ ...m, cargando: false, error: motivoDeFalla(r) }));
    setMas((m) => ({ clave: pedida, entradas: [...(m.clave === pedida ? m.entradas : []), ...r.datos.data.entries], cursor: r.datos.page.nextCursor, cargando: false, error: null }));
  }, [cursor, tanda, leerPagina, sesionPerdida]);

  // Lo que se sabe del período elegido, antes de los filtros: cuántos hechos hay de cada clase (las cantidades de las
  // vistas) y qué áreas se pueden leer. Sale de cualquier respuesta del período; con un corte la consulta mira otra
  // ventana (hasta un año), así que se pide aparte. Se conserva mientras cambian los filtros: no titila.
  const clavePeriodo = `${asesoradoId}|${periodo.desde}|${periodo.hasta}`;
  const { lectura: aparte } = useLectura<LineaDeTiempoResponse>(corte ? `conteos|${clavePeriodo}` : null, () => api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, limit: '1' }));
  const leidoDelPeriodo = corte ? (aparte.tipo === 'listo' ? aparte.datos.data : null) : (primera?.data ?? null);
  const [conocido, setConocido] = useState<{ clave: string; conteos: ConteosDelPeriodo; dominios: readonly DominioDeAnalisis[] } | null>(null);
  useEffect(() => {
    if (leidoDelPeriodo) setConocido({ clave: clavePeriodo, conteos: leidoDelPeriodo.periodCounts, dominios: leidoDelPeriodo.sourceDomains });
  }, [leidoDelPeriodo, clavePeriodo]);
  const delPeriodo = conocido?.clave === clavePeriodo ? conocido : null;
  const dominios = primera?.data.sourceDomains ?? delPeriodo?.dominios ?? [];
  const todoElPeriodo = delPeriodo ? cuentaDeLaVista(VISTAS_DE_LA_LINEA[0]!, delPeriodo.conteos) : null;

  // Las revisiones que sirven de corte: la última registrada de cada área con plan que se puede leer.
  const revisiones = useMemo<Revision[]>(() => {
    if (panel.tipo !== 'listo') return [];
    const d = panel.datos.domains;
    const de = (dominio: Revision['dominio'], e: typeof d.nutrition | typeof d.training): Revision[] => (e.available && e.summary?.lastReview?.recordedAt ? [{ dominio, instante: e.summary.lastReview.recordedAt }] : []);
    return [...de('NUTRITION', d.nutrition), ...de('TRAINING', d.training)];
  }, [panel]);

  const soloFiltros = { tipos: filtros.tipos, estados: filtros.estados, calidades: filtros.calidades, planVersionId: filtros.planVersionId ?? undefined, exerciseKey: filtros.exerciseKey ?? undefined, soloTardias: filtros.soloTardias };
  const vistaElegida = vistaDeLosFiltros({ ...soloFiltros, dominios: filtros.dominios, q: busqueda || undefined, novedadesDesde: corte ?? undefined });
  // «Lo nuevo desde la revisión» de un área: su corte, esa área y nada más.
  const nuevoElegido =
    corte !== null && !busqueda && filtros.dominios.length === 1 && vistaDeLosFiltros(soloFiltros) === 'TODO'
      ? (revisiones.find((r) => r.dominio === filtros.dominios[0] && Date.parse(r.instante) === Date.parse(corte)) ?? null)
      : null;
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS) || busqueda !== '';
  const aMedida = hayFiltros && vistaElegida === null && nuevoElegido === null;
  // Las comidas de un día van en un renglón solo si la consulta las trae todas: el área y el tipo no recortan dentro
  // del día; una calidad, un estado, la carga tardía, una versión del plan, la búsqueda y el corte, sí.
  const agrupar = !busqueda && !corte && filtros.estados.length === 0 && filtros.calidades.length === 0 && !filtros.soloTardias && !filtros.planVersionId && !filtros.exerciseKey;

  const cambiar = (f: FiltrosDeLaLinea) => ir(parametrosDeFiltros(f));
  const sinBusqueda = () => {
    setQ('');
    setBusqueda('');
  };
  /** Una vista con nombre reemplaza todo lo elegido: lo que se ve es lo que su nombre y su cantidad anuncian. */
  const elegirVista = (v: VistaDeLaLinea) => {
    sinBusqueda();
    ir({ ...parametrosDeFiltros({ ...SIN_FILTROS, tipos: v.clave === vistaElegida ? [] : v.tipos, calidades: v.clave === vistaElegida ? [] : v.calidades }), novedades: null });
  };
  const elegirLoNuevo = (r: Revision | null) => {
    sinBusqueda();
    ir({ ...parametrosDeFiltros({ ...SIN_FILTROS, dominios: r ? [r.dominio] : [] }), novedades: r ? r.instante : null });
  };
  const limpiar = () => {
    sinBusqueda();
    ir({ ...parametrosDeFiltros(SIN_FILTROS), novedades: null });
  };

  const entradas = useMemo(() => (primera ? [...primera.data.entries, ...extras.entradas] : []), [primera, extras.entradas]);
  const { dias, hechos: aLaVista } = useMemo(() => componerLosDias(entradas, { agrupar, hayMas: cursor !== null }), [entradas, agrupar, cursor]);
  const total = primera?.data.totalMatching ?? 0;
  const zona = primera?.data.period.timeZone ?? ZONA;
  // Los días sin ningún hecho se dicen solo cuando se mira todo: con un filtro, un día sin coincidencias no es un hueco.
  const conHuecos = vistaElegida === 'TODO';

  // Los grupos abiertos (por día) y el hecho cuyo detalle está a la vista. Otra consulta trae otra lista: el detalle de
  // un hecho que ya no está en ella se cierra.
  const [abiertos, setAbiertos] = useState<ReadonlySet<string>>(new Set());
  const [elegido, setElegido] = useState<EntradaDeLineaDeTiempo | null>(null);
  useEffect(() => setElegido(null), [clave]);
  const alCostado = useDetalleAlCostado();
  const titulo = useRef<HTMLHeadingElement>(null);
  const idDelElegido = elegido?.timelineEntryId ?? null;
  // Al abrir el detalle al costado, el foco va a su título: con el teclado o un lector de pantalla, el detalle está
  // después de toda la lista. «Cerrar» y Escape lo devuelven al renglón.
  useEffect(() => {
    if (idDelElegido !== null && alCostado) titulo.current?.focus({ preventScroll: true });
  }, [idDelElegido, alCostado]);
  /**
   * Cierra el detalle al costado. Si el foco estaba adentro, vuelve al renglón del hecho; si ese renglón quedó dentro de
   * un grupo que se cerró, al renglón del grupo. Si el foco estaba en la lista, se queda donde está.
   */
  const cerrar = useCallback(
    (devolverElFoco: boolean) => {
      const anterior = idDelElegido;
      setElegido(null);
      if (anterior === null || !devolverElFoco) return;
      const fila = raiz.current?.querySelector<HTMLElement>(`.entrada[data-id="${CSS.escape(anterior)}"] .entrada__fila`);
      const destino = fila && fila.getClientRects().length > 0 ? fila : fila?.closest('.grupo-de-hechos')?.querySelector<HTMLElement>('.grupo-de-hechos__cabecera');
      destino?.focus({ preventScroll: true });
    },
    [idDelElegido],
  );
  // Escape cierra el detalle al costado desde el detalle o desde la lista (no desde otro lugar de la ficha: el período
  // y la ayuda tienen su propio Escape).
  const cuerpo = useRef<HTMLDivElement>(null);
  const detalle = useRef<HTMLElement>(null);
  const conDetalleAlCostado = idDelElegido !== null && alCostado;
  useEffect(() => {
    if (!conDetalleAlCostado) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !(e.target instanceof Node) || !cuerpo.current?.contains(e.target)) return;
      cerrar(detalle.current?.contains(e.target) ?? false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [conDetalleAlCostado, cerrar]);
  const alternar = (fecha: string) =>
    setAbiertos((a) => {
      const b = new Set(a);
      if (b.has(fecha)) b.delete(fecha);
      else b.add(fecha);
      return b;
    });

  // Una combinación a medida que llega en la URL (un ejercicio desde «Analizar», lo cargado otro día desde el Resumen)
  // abre «Más filtros», para que se vea de dónde sale lo que se ve. El área que acompaña a un corte no cuenta: es la de
  // «Lo nuevo desde la revisión».
  const [masFiltros, setMasFiltros] = useState(() => vistaDeLosFiltros({ ...soloFiltros, dominios: corte ? [] : filtros.dominios }) === null);
  const cuantosFiltros = aMedida ? filtros.dominios.length + (filtros.tipos.length > 0 ? 1 : 0) + filtros.estados.length + filtros.calidades.length + (filtros.soloTardias ? 1 : 0) + (filtros.exerciseKey ? 1 : 0) + (filtros.planVersionId ? 1 : 0) : 0;

  // Sin ningún hecho, la cuenta no dice «0»: lo dice el estado de abajo, que explica que no es un cero.
  const cuenta =
    lectura.tipo !== 'listo' || total === 0
      ? ''
      : vistaElegida === 'TODO'
        ? `${total === 1 ? 'Un hecho' : `${numero(total)} hechos`} en el período. Cada uno está en el día en que ocurrió.`
        : `${total === 1 ? 'Un hecho coincide' : `${numero(total)} hechos coinciden`}${!corte && todoElPeriodo !== null ? `, de ${numero(todoElPeriodo)} del período` : ''}.`;
  const ultimoDia = dias[dias.length - 1]?.fecha ?? null;

  return (
    <section ref={raiz} className="linea" aria-labelledby={`${id}-titulo`}>
      <div className="linea__cabecera">
        <h2 id={`${id}-titulo`}>Línea de tiempo</h2>
        <p role="status" className="linea__cuenta">
          {cuenta}
        </p>
      </div>

      <div className="vistas-de-la-linea">
        <div className="vistas-de-la-linea__vistas" role="group" aria-labelledby={`${id}-ver`}>
          <span id={`${id}-ver`} className="vistas-de-la-linea__rotulo">
            Ver
          </span>
          {VISTAS_DE_LA_LINEA.slice(0, 2).map((v) => (
            <BotonDeVista key={v.clave} vista={v} elegida={vistaElegida === v.clave} cuenta={delPeriodo ? cuentaDeLaVista(v, delPeriodo.conteos) : null} onElegir={() => elegirVista(v)} />
          ))}
          <LoNuevoDesdeLaRevision revisiones={revisiones} elegida={nuevoElegido} hoy={hoy} onElegir={elegirLoNuevo} />
          {VISTAS_DE_LA_LINEA.slice(2).map((v) => (
            <BotonDeVista key={v.clave} vista={v} elegida={vistaElegida === v.clave} cuenta={delPeriodo ? cuentaDeLaVista(v, delPeriodo.conteos) : null} onElegir={() => elegirVista(v)} />
          ))}
        </div>
        {/* El buscador y «Más filtros» van juntos: si no entran al lado de las vistas, bajan los dos a su renglón. */}
        <div className="vistas-de-la-linea__buscar">
          <form
            className="buscador-de-la-linea"
            role="search"
            aria-label="Buscar en la línea de tiempo"
            onSubmit={(e) => {
              e.preventDefault();
              setBusqueda(q.trim());
            }}
          >
            <label htmlFor={`${id}-q`} className="visualmente-oculto">
              Buscar en el período
            </label>
            <input id={`${id}-q`} type="search" value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en el período" />
            <button type="submit" className="buscador-de-la-linea__boton">
              <Icono nombre="buscar" etiqueta="Buscar" />
            </button>
          </form>
          <button type="button" className="boton boton--quieto boton--compacto vistas-de-la-linea__mas" aria-expanded={masFiltros} aria-controls={`${id}-filtros`} onClick={() => setMasFiltros(!masFiltros)}>
            <Icono nombre="filtros" tamano={18} />
            Más filtros{cuantosFiltros > 0 ? ` (${cuantosFiltros})` : ''}
          </button>
        </div>
      </div>
      <div id={`${id}-filtros`} className="filtros-de-linea" hidden={!masFiltros}>
        {masFiltros ? <MasFiltros filtros={filtros} cambiar={cambiar} dominios={dominios} /> : null}
      </div>

      {corte ? (
        <div className="aviso-de-filtro" role="status">
          <p>
            <strong>Lo nuevo desde la revisión del {fechaEnZona(corte, ZONA)}</strong>
            {filtros.dominios.length === 1 ? ` (${NOMBRE_DE_DOMINIO[filtros.dominios[0] as DominioDeAnalisis]})` : ''}: lo que ocurrió después, lo que se cargó después sobre días anteriores y lo que se corrigió
            después. Se lee del {diaCivil(periodoDeLaConsulta.desde)} a hoy, como la cuenta del Resumen.
          </p>
          <button type="button" className="boton boton--enlace" onClick={() => ir({ novedades: null })}>
            Ver todo el período elegido
          </button>
        </div>
      ) : null}

      {aMedida ? <FiltrosActivos filtros={filtros} busqueda={busqueda} cambiar={cambiar} quitarBusqueda={sinBusqueda} limpiar={limpiar} /> : null}

      {lectura.tipo === 'cargando' ? <Cargando /> : null}
      {lectura.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} titulo="No pudimos cargar la línea de tiempo" onReintentar={recargar}>
          {razonDeFalla(lectura.motivo)}
        </BloqueDeEstado>
      ) : null}
      {lectura.tipo === 'no-disponible' ? <p>{COPY_VINCULO.recursoNoDisponible}</p> : null}
      {/* La vista parcial se avisa una sola vez, en el marco de la ficha: acá no se repite. */}
      {primera ? (
        <>
          {entradas.length === 0 ? (
            hayFiltros || corte ? (
              <EstadoVacio
                titulo="Ningún hecho coincide con los filtros."
                accion={
                  <button type="button" className="boton boton--secundario" onClick={limpiar}>
                    Limpiar filtros
                  </button>
                }
              >
                {todoElPeriodo !== null ? <p className="nota">{todoElPeriodo === 1 ? 'Hay un hecho' : `Hay ${numero(todoElPeriodo)} hechos`} en el período elegido.</p> : null}
              </EstadoVacio>
            ) : (
              <EstadoVacio titulo="No hay hechos registrados en este período.">
                <p className="nota">No es un cero: BE no tiene comidas, sesiones, tomas ni cambios de planificación de estas fechas. Probá con un período más largo.</p>
              </EstadoVacio>
            )
          ) : (
            <div ref={cuerpo} className="linea__cuerpo" data-con-detalle={elegido && alCostado ? 'si' : undefined}>
              <div className="linea-de-tiempo">
                {dias.map((d, i) => {
                  const anterior = dias[i - 1];
                  const hueco = conHuecos && anterior ? diasSinHechosEntre(anterior.fecha, d.fecha) : null;
                  return (
                    <Dia
                      key={d.fecha}
                      dia={d}
                      hueco={hueco}
                      zona={zona}
                      hoy={hoy}
                      buscado={busqueda}
                      abierto={abiertos.has(d.fecha)}
                      onAlternar={() => alternar(d.fecha)}
                      elegido={idDelElegido}
                      onAbrir={setElegido}
                    />
                  );
                })}
                {cursor ? (
                  <div className="acciones linea__mas">
                    <button type="button" className="boton boton--secundario" onClick={() => void verMas()} disabled={extras.cargando} aria-busy={extras.cargando}>
                      {extras.cargando ? 'Cargando…' : 'Ver días anteriores'}
                    </button>
                    <span className="nota">
                      Se ven {numero(aLaVista)} de {numero(total)} hechos{ultimoDia ? `, hasta el ${diaDelAnioEnCurso(ultimoDia, hoy)}` : ''}.
                    </span>
                    {extras.error ? <span className="campo__error">{textoDeFalla(extras.error, 'los días anteriores')}</span> : null}
                  </div>
                ) : null}
              </div>
              {elegido && alCostado ? (
                <aside ref={detalle} className="detalle-del-hecho" aria-labelledby={`${id}-detalle`}>
                  <div className="detalle-del-hecho__cabecera">
                    <p className="detalle-del-hecho__rotulo">Detalle del registro</p>
                    <button type="button" className="boton boton--enlace" onClick={() => cerrar(true)}>
                      <Icono nombre="cerrar" tamano={18} />
                      Cerrar
                    </button>
                  </div>
                  <h3 id={`${id}-detalle`} ref={titulo} tabIndex={-1}>
                    {tituloDelHecho(elegido)}
                  </h3>
                  <DatosDelHecho e={elegido} zona={zona} hoy={hoy} />
                  {/* La clave hace que cada hecho monte su registro de cero: una respuesta lenta de otro no lo pinta. */}
                  <ContenidoDelRegistro key={elegido.timelineEntryId} origen={elegido.source} numeroDeVersion={numeroDeVersionDe(elegido)} />
                  <EnlaceAlArea origen={elegido.source} />
                </aside>
              ) : null}
            </div>
          )}
        </>
      ) : null}
      {/* En una ventana angosta el detalle no entra al costado: se abre encima, como un panel que retiene el foco. */}
      <PanelDeRegistro
        origen={elegido && !alCostado ? elegido.source : null}
        titulo={elegido ? tituloDelHecho(elegido) : ''}
        onCerrar={() => setElegido(null)}
        numeroDeVersion={elegido ? numeroDeVersionDe(elegido) : undefined}
      >
        {elegido && !alCostado ? <DatosDelHecho e={elegido} zona={zona} hoy={hoy} /> : null}
      </PanelDeRegistro>
    </section>
  );
}

// ─── Las vistas con nombre ──────────────────────────────────────────────────────────────────────

function BotonDeVista({ vista, elegida, cuenta, onElegir }: { vista: VistaDeLaLinea; elegida: boolean; cuenta: number | null; onElegir: () => void }) {
  const icono = ICONO_DE_LA_VISTA[vista.clave];
  return (
    <button type="button" className="vista-de-la-linea" data-vista={vista.clave} aria-pressed={elegida} onClick={onElegir}>
      {icono ? <Icono nombre={icono} tamano={18} /> : null}
      {vista.nombre}
      {cuenta !== null ? (
        <span className="vista-de-la-linea__cuenta">
          {numero(cuenta)}
          <span className="visualmente-oculto"> {cuenta === 1 ? 'hecho' : 'hechos'}</span>
        </span>
      ) : null}
    </button>
  );
}

/**
 * «Lo nuevo desde la revisión»: cada área con plan tiene su propia revisión, así que con dos se elige de cuál. Sin
 * ninguna revisión registrada no hay corte, y el botón no está: no habría qué elegir.
 */
function LoNuevoDesdeLaRevision({ revisiones, elegida, hoy, onElegir }: { revisiones: readonly Revision[]; elegida: Revision | null; hoy: string; onElegir: (r: Revision | null) => void }) {
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  // Abierto, se cierra con Escape (el foco vuelve al botón) o al tocar fuera de él: el mismo trato que el período.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      boton.current?.focus();
    };
    const alTocar = (e: PointerEvent) => {
      if (raiz.current && e.target instanceof Node && !raiz.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [abierto]);
  const unica = revisiones.length === 1 ? revisiones[0] : undefined;
  if (revisiones.length === 0) return null;
  if (unica) {
    return (
      <button type="button" className="vista-de-la-linea" data-vista="LO_NUEVO" aria-pressed={elegida !== null} onClick={() => onElegir(elegida ? null : unica)}>
        <Icono nombre="revision" tamano={18} />
        Lo nuevo desde la revisión<span className="visualmente-oculto"> de {NOMBRE_DE_DOMINIO[unica.dominio]}</span>
      </button>
    );
  }
  return (
    <div
      ref={raiz}
      className="vista-de-la-linea__menu"
      onBlur={(e) => {
        if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
      }}
    >
      <button ref={boton} type="button" className="vista-de-la-linea" data-vista="LO_NUEVO" data-elegida={elegida ? 'si' : undefined} aria-expanded={abierto} aria-controls={`${id}-areas`} onClick={() => setAbierto(!abierto)}>
        <Icono nombre="revision" tamano={18} />
        {/* Elegida, dice de qué área y deja «desde la revisión» para quien no ve la pantalla: el aviso de abajo lo dice
            entero, con su fecha, y así el renglón no se alarga al elegir. */}
        <span>
          Lo nuevo
          {elegida ? (
            <>
              <span className="visualmente-oculto"> desde la revisión</span> · {NOMBRE_DE_DOMINIO[elegida.dominio]}
            </>
          ) : (
            ' desde la revisión'
          )}
        </span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      {abierto ? (
        <ul id={`${id}-areas`} className="vista-de-la-linea__areas" aria-label="De qué área">
          {revisiones.map((r) => (
            <li key={r.dominio}>
              <button
                type="button"
                className="vista-de-la-linea__area"
                aria-pressed={elegida?.dominio === r.dominio}
                onClick={() => {
                  setAbierto(false);
                  onElegir(elegida?.dominio === r.dominio ? null : r);
                  boton.current?.focus();
                }}
              >
                <Icono nombre={ICONO_DEL_DOMINIO[r.dominio]} />
                <span>
                  <strong>{NOMBRE_DE_DOMINIO[r.dominio]}</strong> · revisión del {diaDelAnioEnCurso(fechaCivil(r.instante, ZONA), hoy)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ─── Los días ───────────────────────────────────────────────────────────────────────────────────

function Dia({
  dia,
  hueco,
  zona,
  hoy,
  buscado,
  abierto,
  onAlternar,
  elegido,
  onAbrir,
}: {
  dia: DiaDeLaLinea;
  hueco: ReturnType<typeof diasSinHechosEntre>;
  zona: string;
  hoy: string;
  /** El texto buscado, o vacío: con texto, cada renglón dice por qué coincide si no está a la vista. */
  buscado: string;
  abierto: boolean;
  onAlternar: () => void;
  elegido: string | null;
  onAbrir: (e: EntradaDeLineaDeTiempo) => void;
}) {
  return (
    <>
      {hueco ? (
        <p className="linea-de-tiempo__hueco" data-dias={hueco.dias}>
          <span className="muestra-de-hueco" aria-hidden="true" />
          {textoDelHueco(hueco, (f) => diaDelAnioEnCurso(f, hoy))}
        </p>
      ) : null}
      <div className="linea-de-tiempo__dia" data-fecha={dia.fecha} data-novedades={dia.conNovedades ? 'si' : 'no'}>
        <h3 className="linea-de-tiempo__fecha">
          <span aria-hidden="true">
            <span className="linea-de-tiempo__numero">{diaDelAnioEnCurso(dia.fecha, hoy)}</span>
            <span className="linea-de-tiempo__semana">{diaDeLaSemana(dia.fecha)}</span>
          </span>
          <span className="visualmente-oculto">{fechaLarga(dia.fecha)}</span>
        </h3>
        <ul className="linea-de-tiempo__hechos">
          {dia.hechos.map((e) => (
            <Hecho key={e.timelineEntryId} e={e} zona={zona} enGrupo={false} buscado={buscado} elegido={elegido === e.timelineEntryId} onAbrir={onAbrir} />
          ))}
          {dia.grupo ? <Comidas grupo={dia.grupo} zona={zona} abierto={abierto} onAlternar={onAlternar} elegido={elegido} onAbrir={onAbrir} /> : null}
          {dia.incompleto ? <li className="nota linea-de-tiempo__sigue">Este día sigue: quedan hechos por leer.</li> : null}
        </ul>
      </div>
    </>
  );
}

function Rasgo({ rasgo, children }: { rasgo: RasgoDeUnHecho; children: ReactNode }) {
  return (
    <span className="etiqueta-de-dato" data-rasgo={rasgo}>
      <Icono nombre={ICONO_DEL_RASGO[rasgo]} tamano={15} />
      {children}
    </span>
  );
}

/** Un hecho en su renglón. El renglón entero abre el detalle: no hay un «Abrir registro» aparte. */
function Hecho({ e, zona, enGrupo, buscado = '', elegido, onAbrir }: { e: EntradaDeLineaDeTiempo; zona: string; enGrupo: boolean; buscado?: string; elegido: boolean; onAbrir: (e: EntradaDeLineaDeTiempo) => void }) {
  const r = renglonDelHecho(e);
  const rasgos = rasgosDeUnHecho(e);
  // La búsqueda mira también los datos que el renglón no muestra: si coincide ahí, se dice dónde.
  const coincide = buscado ? dondeCoincide(e, buscado) : null;
  const hora = <span className="entrada__hora">{e.occurredAt ? horaEnZona(e.occurredAt, zona) : 'sin hora'}</span>;
  return (
    <li className="entrada" data-id={e.timelineEntryId} data-area={e.domain} data-hito={esHito(e) ? 'si' : undefined} data-anulada={e.state === 'ANNULLED' ? 'si' : undefined}>
      <button type="button" className="entrada__fila" aria-current={elegido ? 'true' : undefined} onClick={() => onAbrir(e)}>
        {enGrupo ? hora : <Icono nombre={r.icono} />}
        <span className="entrada__principal">
          <span className="entrada__cuerpo">
            {/* Dentro de «Comidas» el área ya está dicha; afuera la dice el ícono, y el lector de pantalla, estas palabras. */}
            {enGrupo ? null : <span className="visualmente-oculto entrada__area">{NOMBRE_DE_DOMINIO[e.domain]}: </span>}
            <strong className="entrada__titulo">{r.nombre}</strong>
            {r.dato ? <span className="entrada__dato">{r.dato}</span> : null}
            {coincide ? (
              <span className="entrada__coincide">
                <span className="visualmente-oculto">Coincide en: </span>
                {coincide}
              </span>
            ) : null}
          </span>
          {rasgos.length > 0 ? (
            <span className="entrada__rasgos">
              {rasgos.map((x) => (
                <Rasgo key={x} rasgo={x}>
                  {NOMBRE_DEL_RASGO[x]}
                </Rasgo>
              ))}
            </span>
          ) : null}
          {r.modo ? (
            <span className="entrada__modo">
              <Icono nombre={r.modo.icono} tamano={18} />
              {r.modo.texto}
            </span>
          ) : null}
        </span>
        {enGrupo ? null : hora}
        <Icono nombre="derecha" tamano={18} />
      </button>
    </li>
  );
}

/** Las comidas de un día en un renglón: cuántas son y cuántas tienen cada rasgo. Se abre en el lugar. */
function Comidas({ grupo, zona, abierto, onAlternar, elegido, onAbrir }: { grupo: GrupoDeComidas; zona: string; abierto: boolean; onAlternar: () => void; elegido: string | null; onAbrir: (e: EntradaDeLineaDeTiempo) => void }) {
  const id = useId();
  return (
    <li className="grupo-de-hechos" data-cuenta={grupo.comidas.length} data-abierto={abierto ? 'si' : undefined}>
      <button type="button" className="grupo-de-hechos__cabecera" aria-expanded={abierto} aria-controls={`${id}-hechos`} onClick={onAlternar}>
        <Icono nombre="nutricion" />
        <span className="entrada__principal">
          <span className="entrada__cuerpo">
            <strong className="grupo-de-hechos__nombre">Comidas</strong>
            <span className="grupo-de-hechos__cuenta">{numero(grupo.comidas.length)} registradas</span>
          </span>
          {grupo.rasgos.length > 0 ? (
            <span className="entrada__rasgos">
              {grupo.rasgos.map((x) => (
                <Rasgo key={x.rasgo} rasgo={x.rasgo}>
                  {rasgoDeVariasComidas(x.rasgo, x.cuenta)}
                </Rasgo>
              ))}
            </span>
          ) : null}
        </span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      {/* Cerradas siguen en el documento, ocultas: abrir no vuelve a leer nada. */}
      <ul id={`${id}-hechos`} className="grupo-de-hechos__hechos" hidden={!abierto}>
        {grupo.comidas.map((e) => (
          <Hecho key={e.timelineEntryId} e={e} zona={zona} enGrupo elegido={elegido === e.timelineEntryId} onAbrir={onAbrir} />
        ))}
      </ul>
    </li>
  );
}

// ─── El detalle de un hecho ─────────────────────────────────────────────────────────────────────

/** Los tipos de hecho que tienen su registro para abrir (una comida, una sesión, una toma, una versión de plan). */
const CON_REGISTRO_PROPIO: ReadonlySet<EntradaDeLineaDeTiempo['source']['type']> = new Set(['MEAL_RECORD', 'TRAINING_EXECUTION', 'ANTHROPOMETRIC_EVALUATION', 'NUTRITION_PLAN_VERSION', 'TRAINING_PLAN_VERSION']);

/**
 * Lo que la línea de tiempo sabe del hecho y el renglón ya no repite: cuándo ocurrió, cuándo se cargó y quién, qué le
 * pasó después (con su fecha), sus relaciones y sus datos. Nada de lo que decía la entrada se pierde: un hecho sin
 * registro propio muestra sus datos a la vista; uno con registro propio (que debajo dice casi lo mismo, completo) los
 * tiene a un clic, y a la vista queda lo que el registro no dice en una frase: «Frente a lo indicado».
 */
function DatosDelHecho({ e, zona, hoy }: { e: EntradaDeLineaDeTiempo; zona: string; hoy: string }) {
  const rasgos = rasgosDeUnHecho(e);
  const cambios = cambiosDelRegistro(e);
  const relaciones = relacionesEnPalabras(e);
  const movido = e.recordedLate || cambios.length > 0;
  const frente = frenteALoIndicadoDe(e);
  const datos = (
    <dl className="datos-del-hecho__datos">
      {e.details.map((d, i) => (
        <div key={`${d.label}-${i}`}>
          <dt>{d.label}</dt>
          <dd>{d.value}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <div className="datos-del-hecho">
      <p className="datos-del-hecho__rasgos">
        <span className="etiqueta-de-dato">
          <Icono nombre={ICONO_DEL_DOMINIO[e.domain]} tamano={15} />
          {NOMBRE_DE_DOMINIO[e.domain]}
        </span>
        {rasgos.map((x) => (
          <Rasgo key={x} rasgo={x}>
            {NOMBRE_DEL_RASGO[x]}
          </Rasgo>
        ))}
      </p>
      <dl className="datos-del-hecho__tiempos">
        <div>
          <dt>
            <Icono nombre="calendario" tamano={18} />
            Ocurrió
          </dt>
          <dd>{e.occurredAt ? momento(e.occurredAt, zona, hoy) : `${diaDelAnioEnCurso(e.occurredDate, hoy)}, sin hora`}</dd>
        </div>
        <div>
          <dt>
            <Icono nombre="cargado-otro-dia" tamano={18} />
            Se cargó
          </dt>
          <dd>
            {e.recordedAt ? momento(e.recordedAt, zona, hoy) : 'Sin fecha de registro'}
            {e.author ? ` · ${e.author.displayName}` : ''}
          </dd>
        </div>
        {/* Una vez por clase de cambio: una toma puede traer decenas de mediciones corregidas. */}
        {cambios.map((c) => (
          <div key={c.clase}>
            <dt>
              <Icono nombre={c.clase === 'ANNULLED' || c.clase === 'MEASUREMENT_ANNULLED' ? 'anulado' : 'corregido'} tamano={18} />
              {c.verbo}
            </dt>
            <dd>
              {c.cuantos > 1 ? 'la última, el ' : ''}
              {momento(c.instante, zona, hoy)}
            </dd>
          </div>
        ))}
      </dl>
      {relaciones.length > 0 ? (
        <ul className="datos-del-hecho__relaciones">
          {relaciones.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      ) : null}
      {movido ? <p className="nota">Lo que se cargó o se corrigió después no mueve el hecho: sigue en el {diaDelAnioEnCurso(e.occurredDate, hoy)}.</p> : null}
      {frente ? (
        <p className="datos-del-hecho__frente">
          <strong>Frente a lo indicado:</strong> {frente}.
        </p>
      ) : null}
      {e.details.length === 0 ? null : CON_REGISTRO_PROPIO.has(e.source.type) ? (
        <details className="datos-del-hecho__todos">
          <summary>Los datos de este hecho en la línea de tiempo ({e.details.length})</summary>
          {datos}
        </details>
      ) : (
        datos
      )}
    </div>
  );
}

// ─── Más filtros ────────────────────────────────────────────────────────────────────────────────

/** La combinación libre de los filtros de API-DSH-04: lo que las vistas con nombre no cubren. */
function MasFiltros({ filtros, cambiar, dominios }: { filtros: FiltrosDeLaLinea; cambiar: (f: FiltrosDeLaLinea) => void; dominios: readonly DominioDeAnalisis[] }) {
  const { token, asesoradoId, periodo } = useSeguimiento();
  const id = useId();
  const conEntrenamiento = dominios.includes('TRAINING');
  const { lectura: ejercicios } = useLectura<ProyeccionResponse>(
    conEntrenamiento ? `ejercicios|${asesoradoId}|${periodo.desde}|${periodo.hasta}` : null,
    () => api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', { periodStart: periodo.desde, periodEnd: periodo.hasta }),
  );
  const lista = ejercicios.tipo === 'listo' && ejercicios.datos.data.result?.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? ejercicios.datos.data.result.exercises : [];
  const variosTipos = filtros.tipos.length > 1;
  return (
    <>
      <fieldset className="capas">
        <legend>Áreas</legend>
        {(['NUTRITION', 'TRAINING', 'ANTHROPOMETRY'] as const)
          .filter((d) => dominios.includes(d) || filtros.dominios.includes(d))
          .map((d) => (
            <button
              key={d}
              type="button"
              className="chip"
              aria-pressed={filtros.dominios.includes(d)}
              onClick={() => cambiar({ ...filtros, dominios: filtros.dominios.includes(d) ? filtros.dominios.filter((x) => x !== d) : [...filtros.dominios, d] })}
            >
              {NOMBRE_DE_DOMINIO[d]}
            </button>
          ))}
      </fieldset>
      <div className="campo">
        <label htmlFor={`${id}-tipo`}>Tipo de hecho</label>
        <select
          id={`${id}-tipo`}
          value={variosTipos ? 'VARIOS' : (filtros.tipos[0] ?? '')}
          onChange={(e) => {
            const elegido = e.target.value;
            if (elegido !== 'VARIOS') cambiar({ ...filtros, tipos: elegido ? [elegido as TipoDeEvento] : [] });
          }}
        >
          <option value="">Todos</option>
          {/* Varios tipos a la vez llegan de una vista con nombre o de un enlace: se dicen, no se muestran como «Todos». */}
          {variosTipos ? <option value="VARIOS">{mismosTipos(filtros.tipos, TIPOS_DE_HITO) ? 'Hitos (todos sus tipos)' : `Varios tipos (${filtros.tipos.length})`}</option> : null}
          {TIPOS_DE_EVENTO.filter((t) => {
            const d = DOMINIO_DE_TIPO_DE_EVENTO[t];
            return d === null || dominios.includes(d);
          }).map((t) => (
            <option key={t} value={t}>
              {NOMBRE_DE_TIPO_DE_EVENTO[t]}
            </option>
          ))}
        </select>
      </div>
      {conEntrenamiento ? (
        <div className="campo">
          <label htmlFor={`${id}-ejercicio`}>Ejercicio</label>
          <select id={`${id}-ejercicio`} value={filtros.exerciseKey ?? ''} onChange={(e) => cambiar({ ...filtros, exerciseKey: e.target.value || null })}>
            <option value="">Todos</option>
            {lista.map((x) => (
              <option key={x.exerciseKey} value={x.exerciseKey}>
                {x.name} ({x.sessions} {x.sessions === 1 ? 'sesión' : 'sesiones'})
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <fieldset className="capas">
        <legend>Estado</legend>
        {ESTADOS.map((s) => (
          <label key={s.clave} className="capa">
            <input
              type="checkbox"
              checked={filtros.estados.includes(s.clave)}
              onChange={() => cambiar({ ...filtros, estados: filtros.estados.includes(s.clave) ? filtros.estados.filter((x) => x !== s.clave) : [...filtros.estados, s.clave] })}
            />
            {s.texto}
          </label>
        ))}
      </fieldset>
      <fieldset className="capas">
        <legend>Calidad del dato</legend>
        {CALIDADES.filter((c) => dominios.includes(DOMINIO_DE_LA_CALIDAD[c.clave]) || filtros.calidades.includes(c.clave)).map((c) => (
          <label key={c.clave} className="capa">
            <input
              type="checkbox"
              checked={filtros.calidades.includes(c.clave)}
              onChange={() => cambiar({ ...filtros, calidades: filtros.calidades.includes(c.clave) ? filtros.calidades.filter((x) => x !== c.clave) : [...filtros.calidades, c.clave] })}
            />
            {c.texto}
          </label>
        ))}
        <label className="capa">
          <input type="checkbox" checked={filtros.soloTardias} onChange={() => cambiar({ ...filtros, soloTardias: !filtros.soloTardias })} />
          Solo lo cargado otro día (carga tardía)
        </label>
      </fieldset>
    </>
  );
}

function FiltrosActivos({ filtros, busqueda, cambiar, quitarBusqueda, limpiar }: { filtros: FiltrosDeLaLinea; busqueda: string; cambiar: (f: FiltrosDeLaLinea) => void; quitarBusqueda: () => void; limpiar: () => void }) {
  const hitos = mismosTipos(filtros.tipos, TIPOS_DE_HITO);
  const chips: { texto: string; quitar: () => void }[] = [
    ...filtros.dominios.map((d) => ({ texto: `Área: ${NOMBRE_DE_DOMINIO[d]}`, quitar: () => cambiar({ ...filtros, dominios: filtros.dominios.filter((x) => x !== d) }) })),
    // Los tipos de la vista «Hitos» son nueve: se dicen con su nombre, no uno por uno.
    ...(hitos ? [{ texto: 'Tipo: hitos', quitar: () => cambiar({ ...filtros, tipos: [] }) }] : filtros.tipos.map((t) => ({ texto: `Tipo: ${NOMBRE_DE_TIPO_DE_EVENTO[t]}`, quitar: () => cambiar({ ...filtros, tipos: filtros.tipos.filter((x) => x !== t) }) }))),
    ...filtros.estados.map((s) => ({ texto: `Estado: ${NOMBRE_DE_ESTADO[s]}`, quitar: () => cambiar({ ...filtros, estados: filtros.estados.filter((x) => x !== s) }) })),
    ...filtros.calidades.map((c) => ({ texto: CALIDADES.find((x) => x.clave === c)?.texto ?? c, quitar: () => cambiar({ ...filtros, calidades: filtros.calidades.filter((x) => x !== c) }) })),
    ...(filtros.soloTardias ? [{ texto: 'Cargado otro día', quitar: () => cambiar({ ...filtros, soloTardias: false }) }] : []),
    ...(filtros.exerciseKey ? [{ texto: 'Un ejercicio', quitar: () => cambiar({ ...filtros, exerciseKey: null }) }] : []),
    ...(filtros.planVersionId ? [{ texto: 'Una versión de plan', quitar: () => cambiar({ ...filtros, planVersionId: null }) }] : []),
    ...(busqueda ? [{ texto: `Búsqueda: «${busqueda}»`, quitar: quitarBusqueda }] : []),
  ];
  if (chips.length === 0) return null;
  return (
    <div className="filtros-activos">
      <p className="visualmente-oculto">Filtros activos</p>
      <ul>
        {chips.map((c) => (
          <li key={c.texto}>
            <button type="button" className="chip" onClick={c.quitar}>
              {c.texto} <span aria-hidden="true">×</span>
              <span className="visualmente-oculto"> (quitar)</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="boton boton--enlace" onClick={limpiar}>
        Limpiar filtros
      </button>
    </div>
  );
}
