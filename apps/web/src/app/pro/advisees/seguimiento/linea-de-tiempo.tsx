'use client';

/**
 * Línea de tiempo («¿Qué pasó y cuándo?»; API-DSH-04; ESPECIFICACION.md §3):
 * - **Una entrada por hecho,** agrupada por el día civil del hecho, con lo que ocurrió y lo que se registró por separado
 *   y la carga tardía dicha (T-06-24; PRO-03).
 * - **Una rectificación es una relación** de la entrada original, no un consumo nuevo; una anulación deja la entrada,
 *   marcada (PRO-16).
 * - **Filtros en la URL** (área, tipo, estado, calidad, carga tardía, plan y ejercicio); la búsqueda libre, no: la
 *   escribe el profesional y puede nombrar algo de salud (DL-127). Tampoco viaja en la URL de la API: va en el cuerpo de
 *   un POST (API-DSH-04-BUSQUEDA), con los mismos filtros, el mismo PDP y la misma paginación. La búsqueda y los conteos
 *   recorren el período completo del conjunto autorizado, no solo lo cargado (PRO-04).
 * - **Paginación con cursor estable** y «Ver más»; un cambio de filtro descarta las páginas viejas, y una respuesta
 *   tardía de otro filtro no se pinta (PRO-21).
 * - **Estados distintos:** sin datos en el período, sin coincidencias y error (no se ve como vacío).
 * - **Desde la síntesis del Resumen** (WP-DASHBOARD-COMPRENSION, eje 6): `novedades=<instante>` muestra solo lo nuevo
 *   desde la última revisión de un área (lo que ocurrió después, lo cargado después y lo corregido después), con la misma
 *   ventana que contó el Resumen (hasta un año) y un aviso que lo explica y se puede quitar.
 */
import {
  COPY_VINCULO,
  DOMINIO_DE_TIPO_DE_EVENTO,
  NOMBRE_DE_DOMINIO,
  NOMBRE_DE_TIPO_DE_EVENTO,
  TIPOS_DE_EVENTO,
  agruparPorDia,
  type BusquedaEnLineaDeTiempoRequest,
  type CalidadDeEntrada,
  type DominioDeAnalisis,
  type EntradaDeLineaDeTiempo,
  type EstadoDeEntrada,
  type LineaDeTiempoResponse,
  type OrigenDeDato,
  type ProyeccionResponse,
  type TipoDeEvento,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { diaCivil, fechaEnZona } from '../../../../lib/formato';
import { motivoDeFalla, textoDeFalla, useLectura, useSeguimiento, type MotivoDeFalla } from './contexto';
import { hoyEn, leerCorte, leerFiltrosDeLaLinea, parametrosDeFiltros, restarDias, SIN_FILTROS, type FiltrosDeLaLinea } from './estado';

const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });

const POR_PAGINA = 50;

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

const diaLargo = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
/** «Jueves, 8 de octubre de 2026»: mayúscula solo al principio, como se escribe en castellano. */
const fechaLarga = (civil: string) => {
  const texto = diaLargo.format(new Date(`${civil}T12:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};
const horaEnZona = (iso: string, zona: string) => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: zona }).format(new Date(iso));

export function LineaDeTiempo() {
  const { token, asesoradoId, periodo, parametros, ir, sesionPerdida } = useSeguimiento();
  const id = useId();
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

  // Las páginas siguientes: se descartan si la clave cambió mientras llegaban.
  const [mas, setMas] = useState<{ clave: string; entradas: EntradaDeLineaDeTiempo[]; cursor: string | null; cargando: boolean; error: MotivoDeFalla | null }>({ clave, entradas: [], cursor: null, cargando: false, error: null });
  const claveActual = useRef(clave);
  claveActual.current = clave;
  const extras = mas.clave === clave ? mas : { clave, entradas: [], cursor: null, cargando: false, error: null };
  const primera = lectura.tipo === 'listo' ? lectura.datos : null;
  const cursor = extras.entradas.length > 0 ? extras.cursor : (primera?.page.nextCursor ?? null);
  const verMas = useCallback(async () => {
    if (!cursor) return;
    const pedida = clave;
    setMas((m) => ({ ...(m.clave === pedida ? m : { clave: pedida, entradas: [], cursor: null }), cargando: true, error: null }));
    const r = await leerPagina(cursor);
    if (claveActual.current !== pedida || sesionPerdida(r)) return;
    if (!r.ok) return setMas((m) => ({ ...m, cargando: false, error: motivoDeFalla(r) }));
    setMas((m) => ({ clave: pedida, entradas: [...(m.clave === pedida ? m.entradas : []), ...r.datos.data.entries], cursor: r.datos.page.nextCursor, cargando: false, error: null }));
  }, [cursor, clave, leerPagina, sesionPerdida]);

  const [abierta, setAbierta] = useState<{ origen: OrigenDeDato; titulo: string } | null>(null);
  const cambiar = (f: FiltrosDeLaLinea) => ir(parametrosDeFiltros(f));
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS) || busqueda !== '';

  const entradas = primera ? [...primera.data.entries, ...extras.entradas] : [];
  const dominios = primera?.data.sourceDomains ?? [];

  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Línea de tiempo</h2>
      <p className="nota">Cada hecho una vez, en el día en que ocurrió. Lo que se cargó otro día lo dice; una corrección no es un registro nuevo.</p>
      {corte ? (
        <div className="aviso-de-filtro" role="status">
          <p>
            <strong>Lo nuevo desde la revisión del {fechaEnZona(corte, 'America/Argentina/Buenos_Aires')}</strong>
            {filtros.dominios.length === 1 ? ` (${NOMBRE_DE_DOMINIO[filtros.dominios[0] as DominioDeAnalisis]})` : ''}: lo que ocurrió después, lo que se cargó después sobre días anteriores y lo que se corrigió
            después. Se lee del {diaCivil(periodoDeLaConsulta.desde)} a hoy, como la cuenta del Resumen.
          </p>
          <button type="button" className="boton boton--enlace" onClick={() => ir({ novedades: null })}>
            Ver todo el período elegido
          </button>
        </div>
      ) : null}

      <form
        className="filtros-de-linea"
        role="search"
        aria-label="Buscar en la línea de tiempo"
        onSubmit={(e) => {
          e.preventDefault();
          setBusqueda(q.trim());
        }}
      >
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
            value={filtros.tipos.length === 1 ? filtros.tipos[0] : ''}
            onChange={(e) => cambiar({ ...filtros, tipos: e.target.value ? [e.target.value as TipoDeEvento] : [] })}
          >
            <option value="">Todos</option>
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
        <div className="campo campo--busqueda">
          <label htmlFor={`${id}-q`}>Buscar en el período</label>
          <input id={`${id}-q`} type="search" value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: cena o sentadilla" />
        </div>
        <button type="submit" className="boton boton--secundario">
          Buscar
        </button>
        <FiltrosAvanzados filtros={filtros} cambiar={cambiar} dominios={dominios} />
      </form>

      <FiltrosActivos
        filtros={filtros}
        busqueda={busqueda}
        cambiar={cambiar}
        quitarBusqueda={() => {
          setQ('');
          setBusqueda('');
        }}
        limpiar={() => {
          setQ('');
          setBusqueda('');
          cambiar(SIN_FILTROS);
        }}
      />

      <p role="status" className="nota">
        {lectura.tipo === 'listo'
          ? `${lectura.datos.data.totalMatching === 1 ? 'Un hecho coincide' : `${lectura.datos.data.totalMatching} hechos coinciden`} en todo el período${entradas.length < lectura.datos.data.totalMatching ? `; se ven ${entradas.length}` : ''}.`
          : ''}
      </p>

      {lectura.tipo === 'cargando' ? <Cargando /> : null}
      {lectura.tipo === 'error' ? <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'la línea de tiempo')} onReintentar={recargar} /> : null}
      {lectura.tipo === 'no-disponible' ? <p>{COPY_VINCULO.recursoNoDisponible}</p> : null}
      {primera ? (
        <>
          {primera.data.partialView ? <p className="nota">{COPY_VINCULO.vistaParcial}</p> : null}
          {entradas.length === 0 ? (
            hayFiltros ? (
              <p>
                Ningún hecho coincide con los filtros.{' '}
                <button
                  type="button"
                  className="boton boton--enlace"
                  onClick={() => {
                    setQ('');
                    setBusqueda('');
                    cambiar(SIN_FILTROS);
                  }}
                >
                  Limpiar filtros
                </button>
              </p>
            ) : (
              <p>No hay hechos registrados en este período.</p>
            )
          ) : (
            <Dias entradas={entradas} zona={primera.data.period.timeZone} onAbrir={(origen, titulo) => setAbierta({ origen, titulo })} />
          )}
          {cursor ? (
            <div className="acciones">
              <button type="button" className="boton boton--secundario" onClick={() => void verMas()} disabled={extras.cargando} aria-busy={extras.cargando}>
                {extras.cargando ? 'Cargando…' : `Ver más (${primera.data.totalMatching - entradas.length} restantes)`}
              </button>
              {extras.error ? <span className="campo__error">{textoDeFalla(extras.error, 'más hechos')}</span> : null}
            </div>
          ) : null}
        </>
      ) : null}
      <PanelDeRegistro origen={abierta?.origen ?? null} titulo={abierta?.titulo ?? ''} onCerrar={() => setAbierta(null)} />
    </section>
  );
}

function Dias({ entradas, zona, onAbrir }: { entradas: readonly EntradaDeLineaDeTiempo[]; zona: string; onAbrir: (o: OrigenDeDato, titulo: string) => void }) {
  return (
    <div className="linea-de-tiempo">
      {agruparPorDia(entradas).map((d) => (
        <section key={d.fecha} className="linea-de-tiempo__dia" aria-label={fechaLarga(d.fecha)} data-fecha={d.fecha}>
          <h3>{fechaLarga(d.fecha)}</h3>
          <ul className="linea-de-tiempo__entradas">
            {d.entradas.map((e) => (
              <Entrada key={e.timelineEntryId} e={e} zona={zona} onAbrir={onAbrir} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Entrada({ e, zona, onAbrir }: { e: EntradaDeLineaDeTiempo; zona: string; onAbrir: (o: OrigenDeDato, titulo: string) => void }) {
  const anulada = e.state === 'ANNULLED';
  return (
    <li className={`entrada${anulada ? ' entrada--anulada' : ''}`} data-id={e.timelineEntryId}>
      <p className="entrada__cabecera">
        <span className="entrada__area">{NOMBRE_DE_DOMINIO[e.domain]}</span>
        <span className="entrada__hora">{e.occurredAt ? horaEnZona(e.occurredAt, zona) : 'sin hora'}</span>
        <strong className="entrada__titulo">{e.title}</strong>
        {e.state !== 'EFFECTIVE' ? <span className="insignia">{NOMBRE_DE_ESTADO[e.state]}</span> : null}
        {e.recordedLate ? <span className="insignia insignia--no">Carga tardía</span> : null}
      </p>
      {e.details.length > 0 ? (
        <dl className="entrada__detalles">
          {e.details.map((d, i) => (
            <div key={`${d.label}-${i}`}>
              <dt>{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="nota">
        {e.recordedAt ? `Registrado el ${fechaEnZona(e.recordedAt, zona)}` : 'Sin fecha de registro'}
        {e.author ? ` · ${e.author.displayName}` : ''}
      </p>
      {e.relations.length > 0 ? (
        <ul className="entrada__relaciones">
          {e.relations.map((r, i) => (
            <li key={`${r.kind}-${i}`}>
              {r.label}
              {r.at ? ` (${fechaEnZona(r.at, zona)})` : ''}
            </li>
          ))}
        </ul>
      ) : null}
      <button type="button" className="boton boton--enlace" onClick={() => onAbrir(e.source, e.title)}>
        Abrir registro<span className="visualmente-oculto">: {e.title}</span>
      </button>
    </li>
  );
}

function FiltrosAvanzados({ filtros, cambiar, dominios }: { filtros: FiltrosDeLaLinea; cambiar: (f: FiltrosDeLaLinea) => void; dominios: readonly DominioDeAnalisis[] }) {
  const { token, asesoradoId, periodo } = useSeguimiento();
  const id = useId();
  const [abierto, setAbierto] = useState(filtros.estados.length + filtros.calidades.length > 0 || filtros.soloTardias || !!filtros.planVersionId || !!filtros.exerciseKey);
  const conEntrenamiento = dominios.includes('TRAINING');
  const { lectura: ejercicios } = useLectura<ProyeccionResponse>(
    abierto && conEntrenamiento ? `ejercicios|${asesoradoId}|${periodo.desde}|${periodo.hasta}` : null,
    () => api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', { periodStart: periodo.desde, periodEnd: periodo.hasta }),
  );
  const lista = ejercicios.tipo === 'listo' && ejercicios.datos.data.result?.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? ejercicios.datos.data.result.exercises : [];
  useEffect(() => {
    if (filtros.exerciseKey || filtros.planVersionId) setAbierto(true);
  }, [filtros.exerciseKey, filtros.planVersionId]);
  return (
    <details className="filtros-avanzados" open={abierto} onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}>
      <summary>Más filtros</summary>
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
        {CALIDADES.filter((c) => (c.clave.startsWith('SESSION') ? dominios.includes('TRAINING') : dominios.includes('NUTRITION'))).map((c) => (
          <label key={c.clave} className="capa">
            <input
              type="checkbox"
              checked={filtros.calidades.includes(c.clave)}
              onChange={() => cambiar({ ...filtros, calidades: filtros.calidades.includes(c.clave) ? filtros.calidades.filter((x) => x !== c.clave) : [...filtros.calidades, c.clave] })}
            />
            {c.texto}
          </label>
        ))}
      </fieldset>
      <label className="capa">
        <input type="checkbox" checked={filtros.soloTardias} onChange={() => cambiar({ ...filtros, soloTardias: !filtros.soloTardias })} />
        Solo lo cargado otro día (carga tardía)
      </label>
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
    </details>
  );
}

function FiltrosActivos({ filtros, busqueda, cambiar, quitarBusqueda, limpiar }: { filtros: FiltrosDeLaLinea; busqueda: string; cambiar: (f: FiltrosDeLaLinea) => void; quitarBusqueda: () => void; limpiar: () => void }) {
  const chips: { texto: string; quitar: () => void }[] = [
    ...filtros.dominios.map((d) => ({ texto: `Área: ${NOMBRE_DE_DOMINIO[d]}`, quitar: () => cambiar({ ...filtros, dominios: filtros.dominios.filter((x) => x !== d) }) })),
    ...filtros.tipos.map((t) => ({ texto: `Tipo: ${NOMBRE_DE_TIPO_DE_EVENTO[t]}`, quitar: () => cambiar({ ...filtros, tipos: filtros.tipos.filter((x) => x !== t) }) })),
    ...filtros.estados.map((s) => ({ texto: `Estado: ${NOMBRE_DE_ESTADO[s]}`, quitar: () => cambiar({ ...filtros, estados: filtros.estados.filter((x) => x !== s) }) })),
    ...filtros.calidades.map((c) => ({ texto: CALIDADES.find((x) => x.clave === c)?.texto ?? c, quitar: () => cambiar({ ...filtros, calidades: filtros.calidades.filter((x) => x !== c) }) })),
    ...(filtros.soloTardias ? [{ texto: 'Carga tardía', quitar: () => cambiar({ ...filtros, soloTardias: false }) }] : []),
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
