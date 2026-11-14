'use client';

/**
 * ED-74 · La evolución de fuerza por ejercicio en «Analizar» (WP-EDITORES-PROFESIONAL §5.8; V3 F-01; maqueta 15). La
 * métrica «1RM estimado (Epley v1)», de la familia «estimación» y no de «carga», por ejercicio y por unidad: se abre ya
 * filtrada desde la tarjeta del ejercicio (`pregunta=fuerza-estimada&ejercicio=…&unidad=…`).
 * - El punto lleno, hasta 10 repeticiones equivalentes; hueco, de más de 10 a 12, con «Incluir…» apagado de entrada; la
 *   observación del profesional, un rombo, con su leyenda.
 * - Sin línea a través de un hueco (una sesión del ejercicio sin estimación); kg y lb, aparte.
 * - La diferencia entre dos estimaciones, en kg, nunca un porcentaje (RM-12).
 * - La tabla de origen, con «Cómo se calculó» en cada valor, y lo que no entra en palabras, una línea por sesión.
 * - El eje de fechas, la línea de hoy, una marca por sesión sin estimación y las franjas de las versiones del plan.
 * - **Con el teclado:** cada fecha de la tabla elige su punto (la lectura del costado y la diferencia con el anterior),
 *   como tocarlo en el gráfico (WCAG 2.1.1). La tabla es el texto del gráfico.
 * - Con el interruptor apagado, una sesión que solo tuvo series de más de 10 a 12 es un hueco con su fila.
 * - La columna «Sesión» de la maqueta espera que la clave traiga el nombre de la sesión (EDT-55).
 *
 * WP-GRAFICOS GR-02 (fase 2, rama B; DL-174): el ruido antes que el cambio. Arriba del gráfico, la primera línea dice si
 * lo indicado cambió entre versiones (del comparador, GR-T14); debajo, cada versión con la mediana del RIR registrado,
 * las repeticiones de la serie usada y el ruido propio (GR-T16); en la lectura, el de la versión del punto elegido. El
 * eje abarca 10 kg o 22 lb como mínimo (GR-T15).
 *
 * Como la composición (TA-25), la pregunta vive en el website y no se guarda como vista: su identificador no entra en
 * `ID_DE_PREGUNTAS`, que valida la API. El período es el de la ficha, que la API recorta al inicio del acompañamiento.
 */
import { COPY_FUERZA, diaDeLaEstimacion, diferenciaEntreEstimaciones, estimacionALaVista, EJERCICIOS_DE_LA_ESTIMACION_V1, numero, rotuloDeLaEstimacion, type PuntoDeFuerza } from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../../../components/estados';
import { Enlace } from '../../../../components/enlace';
import { Icono } from '../../../../components/icono';
import { ICONO_DE_FALLA } from '../../../../lib/fallas';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { useSeguimiento } from '../seguimiento/contexto';
import { parametrosDePregunta } from '../seguimiento/estado';
import { observacionesDelPeriodo } from '../graficos/entrenamiento/comparador';
import { COPY_FUERZA_ESTIMADA } from '../graficos/entrenamiento/copy';
import { cambiosDeLoIndicado, lecturaDeLaVersionEn, lecturasPorVersion, objetivosDeLasVersiones, rangoMinimoDeLaFuerza, type LecturaDeLaVersion } from '../graficos/entrenamiento/fuerza-estimada';
import { useComparador } from '../graficos/entrenamiento/lecturas-del-ejercicio';
import { ComoSeCalculo, COPY_COMO_SE_CALCULO, fechaLarga } from './como-se-calculo';
import {
  diaConSemana,
  diaDelPunto,
  estimacionDelPunto,
  fechasDelEje,
  filasConLosMotivosSeguidos,
  filasDeLaEvolucion,
  haciaLaSesion,
  laSerie,
  loQueHaceFalta,
  loQueNoEntraPorFecha,
  PREGUNTA_DE_LA_FUERZA,
  rangoDeSesiones,
  sesionesSoloOrientativas,
  tramosDeLaLinea,
  versionDelPlanEn,
  type VersionDelPlanEnElPeriodo,
} from './fuerza';
import { useLecturaDeFuerza, type LineaDeFuerza } from './lectura-de-fuerza';

export const LA_PREGUNTA_DE_LA_FUERZA = {
  pregunta: '¿Cómo evolucionó la fuerza estimada en un ejercicio?',
  muestra: '1RM estimado (Epley v1), una estimación por sesión hecha con una serie, y las series que observaste vos.',
  subtitulo: '1RM estimado (Epley v1): una estimación hecha con una serie, que solo ves vos.',
  ejercicio: 'Ejercicio',
  unidad: 'Unidad',
  orientativas: 'Incluir las de más de 10 a 12 repeticiones equivalentes',
  leyenda: { nucleo: 'hasta 10 repeticiones equivalentes', orientativa: 'de más de 10 a 12', observada: 'observada por vos', sinEstimacion: 'sin estimación', hoy: 'hoy' },
  elegirEjercicio: 'Elegí un ejercicio de la lista de Epley v1.',
  sinNada: 'En este período no hay series de los ejercicios de la lista que permitan estimar.',
  sinPuntos: 'En este período no hay estimaciones de este ejercicio en esta unidad.',
  soloOrientativas: 'Hay sesiones con solo series de más de 10 a 12 repeticiones equivalentes: encendé «Incluir las de más de 10 a 12» para verlas.',
  elegirEnLaTabla: 'Elegí una fecha de la tabla para leer esa estimación al costado.',
  /** PG-10: las sesiones seguidas sin estimación con el mismo motivo van en una fila, que se abre para ver cada una. */
  verLasSesiones: (n: number) => `Ver las ${n} sesiones`,
  leerEsta: 'leer esta estimación',
  plan: (version: string) => `Plan · ${version}`,
  planDeLaLectura: (version: string) => `plan ${version}`,
  quedan: (n: number) => (n === 1 ? 'Y 1 sesión más, en la tabla.' : `Y ${n} sesiones más, en la tabla.`),
  loQueNoEntra: 'Lo que no entra',
  lectura: (dia: string) => `Lectura del ${dia}`,
  frente: (dia: string) => `Frente a la del ${dia}:`,
  // Con Epley, un RIR de diferencia mueve la cuenta la carga sobre 30: se calcula con la serie elegida y su unidad.
  diferencia: (carga: number, unidad: string) => `Una diferencia entre dos estimaciones, en su unidad. Un RIR de diferencia mueve esta cuenta ≈ ${numero(carga / 30, 1)} ${unidad}.`,
  cambiarLaPregunta: 'Cambiar la pregunta',
  deOtros: 'Hay registros con otro profesional que no ves.',
  antes: 'Lo que la persona registró antes de la app nueva no dice quién escribió cada valor: no entra. Lo que observaste vos entra si se puede estimar; las de más de 10 a 12, con el interruptor encendido.',
  limite: 'Una estimación con una serie no es una repetición máxima medida, y no es una indicación de carga.',
} as const;

const C = LA_PREGUNTA_DE_LA_FUERZA;

export function FuerzaEnAnalizar({ tituloId }: { tituloId: string }) {
  const { token, asesoradoId, periodo, parametros, sesionPerdida, ir } = useSeguimiento();
  const id = useId();
  const ejercicio = parametros.get('ejercicio');
  const exerciseId = EJERCICIOS_DE_LA_ESTIMACION_V1.some((e) => e.exerciseId === ejercicio) ? ejercicio : null;
  const unidadPedida = parametros.get('unidad') === 'lb' ? 'lb' : parametros.get('unidad') === 'kg' ? 'kg' : null;
  const encendido = parametros.get('orientativas') === '1';
  const { lectura, recargar } = useLecturaDeFuerza(token, asesoradoId, exerciseId, { unidad: exerciseId ? unidadPedida : null, desde: periodo.desde, hasta: periodo.hasta, sesionPerdida });
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const [como, setComo] = useState<PuntoDeFuerza | null>(null);
  const nombre = EJERCICIOS_DE_LA_ESTIMACION_V1.find((e) => e.exerciseId === exerciseId)?.nombre ?? null;
  const linea: LineaDeFuerza | null = lectura.tipo === 'lista' ? (encendido ? lectura.encendido : lectura.apagado) : null;
  // Apagado, las sesiones que solo tuvieron orientativas: sin punto y sin fila entre las que no entraron, son un hueco.
  const soloOrientativas = useMemo(
    () => (lectura.tipo === 'lista' && !encendido ? sesionesSoloOrientativas(lectura.apagado?.puntos ?? [], lectura.encendido?.unidad === lectura.apagado?.unidad ? (lectura.encendido?.puntos ?? []) : []) : []),
    [lectura, encendido],
  );
  const versiones = lectura.tipo === 'lista' ? lectura.versiones : [];
  const puntos = linea?.puntos ?? [];
  const elegido = puntos.find((p) => p.pointId === elegidoId) ?? puntos[puntos.length - 1] ?? null;
  const unidades = lectura.tipo === 'lista' ? (lectura.ejercicios.find((e) => e.exerciseId === exerciseId)?.units ?? []) : [];
  // GR-02 (WP-GRAFICOS, DL-174): cada versión, con su ruido, y lo que cambió en lo indicado entre versiones, del comparador.
  const delPeriodo = useMemo(() => ({ desde: periodo.desde, hasta: periodo.hasta, hoy: periodo.hasta, desdeElVinculo: null }), [periodo.desde, periodo.hasta]);
  const { comparador } = useComparador({ token, asesoradoId, sesionPerdida }, delPeriodo, exerciseId !== null);
  const porVersion = useMemo(() => (linea ? lecturasPorVersion(linea.puntos, versiones, linea.unidad) : []), [linea, versiones]);
  const cambios = useMemo(() => {
    if (!linea || !exerciseId || comparador.tipo !== 'lista') return [];
    const observaciones = observacionesDelPeriodo(comparador.ejecuciones, `e:${exerciseId}`, comparador.objetivosPorVersion, delPeriodo.desde, delPeriodo.hasta);
    return cambiosDeLoIndicado(versiones, objetivosDeLasVersiones(linea.puntos, observaciones, versiones));
  }, [linea, exerciseId, comparador, versiones, delPeriodo]);
  const cambiar = (c: Record<string, string | null>) => {
    setElegidoId(null);
    ir(c);
  };

  return (
    <section className="seccion analizar fuerza-en-analizar" aria-labelledby={tituloId} data-fuerza-en-analizar>
      <div className="pregunta-en-curso pregunta-activa">
        <h2 id={tituloId}>{nombre ? `${COPY_FUERZA.titulo} · ${nombre}` : C.pregunta}</h2>
        <p className="pregunta-en-curso__detalle">{C.subtitulo}</p>
        <div className="pregunta-en-curso__acciones">
          <button type="button" className="boton boton--secundario boton--compacto" onClick={() => ir({ ...parametrosDePregunta(null), orientativas: null, m: null, f: null }, { agregarAlHistorial: true })}>
            <Icono nombre="pregunta" tamano={18} />
            {C.cambiarLaPregunta}
          </button>
        </div>
      </div>
      <div className="fuerza-en-analizar__controles">
        <div className="campo">
          <label htmlFor={`${id}-ejercicio`}>{C.ejercicio}</label>
          <select id={`${id}-ejercicio`} value={exerciseId ?? ''} onChange={(e) => cambiar({ ejercicio: e.target.value || null, unidad: null })}>
            <option value="">Elegí un ejercicio</option>
            {EJERCICIOS_DE_LA_ESTIMACION_V1.map((e) => (
              <option key={e.exerciseId} value={e.exerciseId}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        {unidades.length > 1 ? (
          <div className="campo">
            <label htmlFor={`${id}-unidad`}>{C.unidad}</label>
            <select id={`${id}-unidad`} value={linea?.unidad ?? unidades[0]} onChange={(e) => cambiar({ unidad: e.target.value })}>
              {unidades.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <label className="capa fuerza-en-analizar__interruptor" data-interruptor-orientativas>
          <input type="checkbox" role="switch" checked={encendido} onChange={(e) => cambiar({ orientativas: e.target.checked ? '1' : null })} />
          <span>{C.orientativas}</span>
        </label>
      </div>
      {!exerciseId ? (
        <EjerciciosConDatos lectura={lectura} onElegir={(x) => cambiar({ ejercicio: x, unidad: null })} />
      ) : lectura.tipo === 'cargando' ? (
        <Cargando />
      ) : lectura.tipo === 'no-disponible' ? (
        <EstadoVacio titulo="No disponible">Con el acceso de ahora no podés ver los registros de Entrenamiento de esta persona.</EstadoVacio>
      ) : lectura.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} onReintentar={recargar} deQue="la fuerza estimada">
          No pudimos leer la fuerza estimada.
        </BloqueDeEstado>
      ) : (
        <div className="fuerza-en-analizar__zonas">
          <div>
            {cambios.length > 0 ? (
              <ul className="grafico-de-entrenamiento__primera-linea" data-cambio-de-lo-indicado>
                {cambios.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : null}
            {comparador.tipo === 'error' ? <p className="nota">{COPY_FUERZA_ESTIMADA.sinIndicado}</p> : null}
            <Grafico linea={linea} elegido={elegido} onElegir={(p) => setElegidoId(p.pointId)} hasta={lectura.hoy} desde={lectura.desde} zona={lectura.zona} soloOrientativas={soloOrientativas} versiones={versiones} />
            <PorVersion lecturas={porVersion} />
            <TablaDeOrigen linea={linea} asesoradoId={asesoradoId} onComo={setComo} elegido={elegido} onElegir={(p) => setElegidoId(p.pointId)} soloOrientativas={soloOrientativas} />
          </div>
          <Lectura linea={linea} elegido={elegido} asesoradoId={asesoradoId} onComo={setComo} soloOrientativas={soloOrientativas} versiones={versiones} porVersion={porVersion} />
        </div>
      )}
      {lectura.tipo === 'lista' && lectura.deOtros ? <p className="nota">{C.deOtros}</p> : null}
      <p className="nota pregunta-en-curso__limite">{C.limite}</p>
      <CuadroEnfocado abierto={como !== null} forma="dialogo" ancho titulo={COPY_COMO_SE_CALCULO.titulo} onCerrar={() => setComo(null)}>
        {como && nombre ? <ComoSeCalculo punto={como} nombre={nombre} asesoradoId={asesoradoId} noEntraron={linea?.noEntraron ?? []} /> : null}
      </CuadroEnfocado>
    </section>
  );
}

function EjerciciosConDatos({ lectura, onElegir }: { lectura: ReturnType<typeof useLecturaDeFuerza>['lectura']; onElegir: (exerciseId: string) => void }) {
  if (lectura.tipo === 'cargando') return <Cargando />;
  if (lectura.tipo !== 'lista') return <p>{C.elegirEjercicio}</p>;
  const con = lectura.ejercicios.filter((e) => e.units.length > 0);
  if (con.length === 0) return <p>{C.sinNada}</p>;
  return (
    <ul className="lista-de-ejercicios-con-fuerza">
      {con.map((e) => (
        <li key={e.exerciseId}>
          <button type="button" className="boton boton--quieto" onClick={() => onElegir(e.exerciseId)}>
            <Icono nombre="estimado" tamano={18} />
            {e.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

const ANCHO = 720;
const ALTO = 260;
const MARGEN = { izq: 48, der: 16, arr: 40, abj: 28 };

/** El día de hoy en la zona de la lectura, como fecha civil. */
function hoyEn(zona: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * El gráfico: un punto por sesión (lleno, hueco u observado), sin línea a través de un hueco; el eje de fechas, la
 * línea de hoy, una marca por sesión sin estimación y las franjas de las versiones del plan (maqueta 15).
 */
function Grafico({
  linea,
  elegido,
  onElegir,
  desde,
  hasta,
  zona,
  soloOrientativas,
  versiones,
}: {
  linea: LineaDeFuerza | null;
  elegido: PuntoDeFuerza | null;
  onElegir: (p: PuntoDeFuerza) => void;
  desde: string;
  hasta: string;
  zona: string;
  soloOrientativas: readonly PuntoDeFuerza[];
  versiones: readonly VersionDelPlanEnElPeriodo[];
}) {
  const puntos = linea?.puntos ?? [];
  const unidad = linea?.unidad ?? 'kg';
  const geo = useMemo(() => {
    const valores = puntos.map((p) => p.estimate.value);
    let min = Math.floor(Math.min(...valores) - 2);
    let max = Math.ceil(Math.max(...valores) + 2);
    // GR-T15 (WP-GRAFICOS, DL-174): el eje abarca 10 kg o 22 lb como mínimo, para que el ruido de un RIR no parezca un salto.
    const rango = rangoMinimoDeLaFuerza(unidad) ?? 0;
    if (max - min < rango) {
      const centro = (min + max) / 2;
      min = Math.floor(centro - rango / 2);
      max = Math.ceil(centro + rango / 2);
      if (min < 0) {
        max -= min;
        min = 0;
      }
    }
    const t0 = Date.parse(`${desde}T12:00:00Z`);
    const t1 = Math.max(Date.parse(`${hasta}T12:00:00Z`), t0 + 86_400_000);
    const x = (fecha: string) => MARGEN.izq + ((Date.parse(`${fecha}T12:00:00Z`) - t0) / (t1 - t0)) * (ANCHO - MARGEN.izq - MARGEN.der);
    const y = (v: number) => MARGEN.arr + (1 - (v - min) / Math.max(max - min, 1)) * (ALTO - MARGEN.arr - MARGEN.abj);
    return { x, y, min, max };
  }, [puntos, unidad, desde, hasta]);
  if (!linea || puntos.length === 0) {
    const falta = loQueHaceFalta(linea?.noEntraron ?? []);
    return (
      <div className="fuerza-en-analizar__vacio">
        <p>
          <strong>{C.sinPuntos}</strong>
        </p>
        {falta.motivos ? <p>{falta.motivos}</p> : null}
        {soloOrientativas.length > 0 ? <p data-solo-orientativas>{C.soloOrientativas}</p> : null}
        <p className="nota">{falta.regla}</p>
      </div>
    );
  }
  const tramos = tramosDeLaLinea(puntos, linea.noEntraron, soloOrientativas);
  const sinEstimacion = [...new Set(filasDeLaEvolucion(puntos, linea.noEntraron, soloOrientativas).flatMap((f) => (f.tipo === 'sin-estimacion' ? [f.fecha] : [])))];
  const hoy = hoyEn(zona);
  const abajo = ALTO - MARGEN.abj;
  const franjas = versiones
    .filter((v) => v.domain === 'TRAINING' && (v.to === null || v.to > desde) && v.from <= hasta)
    .map((v) => ({ v, x0: geo.x(v.from < desde ? desde : v.from), x1: geo.x(v.to === null || v.to > hasta ? hasta : v.to) }))
    .filter((f) => f.x1 > f.x0);
  return (
    <figure className="fuerza-en-analizar__grafico">
      <figcaption>
        <strong>{linea.unidad} · una estimación por sesión</strong>
        <span className="fuerza-en-analizar__leyenda">
          <span data-forma="lleno">{C.leyenda.nucleo}</span>
          <span data-forma="hueco">{C.leyenda.orientativa}</span>
          <span data-forma="rombo">{C.leyenda.observada}</span>
          <span data-forma="marca">{C.leyenda.sinEstimacion}</span>
          <span data-forma="hoy">{C.leyenda.hoy}</span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={`Evolución de la fuerza estimada, en ${linea.unidad}: ${puntos.length} ${puntos.length === 1 ? 'estimación' : 'estimaciones'}. La tabla de abajo tiene cada valor, y cada fecha elige su lectura.`}>
        {franjas.map(({ v, x0, x1 }, i) => (
          <g key={`${v.label}-${v.from}`} className="fuerza-en-analizar__franja" data-par={(i & 1) === 0 ? '' : undefined}>
            <rect x={x0} y={0} width={x1 - x0} height={abajo} />
            {x1 - x0 > 96 ? (
              <text x={x0 + 6} y={12} className="fuerza-en-analizar__eje">
                {C.plan(v.label.replace(/^v/, 'versión '))}
              </text>
            ) : null}
          </g>
        ))}
        {fechasDelEje(desde, hasta).map((f, i, todas) => (
          <text key={f} x={geo.x(f)} y={ALTO - 8} textAnchor={i === 0 ? 'start' : i === todas.length - 1 ? 'end' : 'middle'} className="fuerza-en-analizar__eje">
            {diaDeLaEstimacion(f)}
          </text>
        ))}
        {sinEstimacion.map((f) => (
          <line key={`sin-${f}`} x1={geo.x(f)} x2={geo.x(f)} y1={abajo - 12} y2={abajo} className="fuerza-en-analizar__sin-estimacion" />
        ))}
        {hoy >= desde && hoy <= hasta ? (
          <g className="fuerza-en-analizar__hoy">
            <line x1={geo.x(hoy)} x2={geo.x(hoy)} y1={0} y2={abajo} />
            <text x={geo.x(hoy) - 4} y={12} textAnchor="end" className="fuerza-en-analizar__eje">
              {C.leyenda.hoy}
            </text>
          </g>
        ) : null}
        {[geo.min, (geo.min + geo.max) / 2, geo.max].map((v) => (
          <g key={v}>
            <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={geo.y(v)} y2={geo.y(v)} className="fuerza-en-analizar__guia" />
            <text x={MARGEN.izq - 6} y={geo.y(v) + 4} textAnchor="end" className="fuerza-en-analizar__eje">
              {String(Math.round(v)).replace('.', ',')}
            </text>
          </g>
        ))}
        {tramos.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={geo.x(puntos[a]!.date)} y1={geo.y(puntos[a]!.estimate.value)} x2={geo.x(puntos[b]!.date)} y2={geo.y(puntos[b]!.estimate.value)} className="fuerza-en-analizar__linea" />
        ))}
        {puntos.map((p) => {
          const cx = geo.x(p.date);
          const cy = geo.y(p.estimate.value);
          const forma = p.source === 'OBSERVED' ? 'rombo' : p.estimate.band === 'ORIENTATIVE' ? 'hueco' : 'lleno';
          const elegidoEste = elegido?.pointId === p.pointId;
          return (
            <g key={p.pointId} className="fuerza-en-analizar__punto" data-forma={forma} data-elegido={elegidoEste ? '' : undefined} onClick={() => onElegir(p)}>
              {elegidoEste ? <circle cx={cx} cy={cy} r={11} className="fuerza-en-analizar__aro" /> : null}
              {forma === 'rombo' ? <rect x={cx - 6} y={cy - 6} width={12} height={12} transform={`rotate(45 ${cx} ${cy})`} /> : <circle cx={cx} cy={cy} r={6} />}
              <text x={cx} y={cy - 12} textAnchor="middle" className="fuerza-en-analizar__valor">
                {estimacionALaVista(estimacionDelPunto(p, '')).replace('≈ ', '').replace(` ${p.estimate.load.unit}`, '')}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/**
 * La tabla de origen: la fecha, la serie que entra, quién la escribió, la banda, el valor y «Cómo se calculó». Cada fecha
 * de un punto es un botón que lo elige, como tocarlo en el gráfico: así se llega con el teclado y con un lector de
 * pantalla a la lectura del costado (WCAG 2.1.1).
 */
function TablaDeOrigen({
  linea,
  asesoradoId,
  onComo,
  elegido,
  onElegir,
  soloOrientativas,
}: {
  linea: LineaDeFuerza | null;
  asesoradoId: string;
  onComo: (p: PuntoDeFuerza) => void;
  elegido: PuntoDeFuerza | null;
  onElegir: (p: PuntoDeFuerza) => void;
  soloOrientativas: readonly PuntoDeFuerza[];
}) {
  const nombres = useNombres();
  if (!linea) return null;
  const filas = filasConLosMotivosSeguidos(filasDeLaEvolucion(linea.puntos, linea.noEntraron, soloOrientativas));
  if (filas.length === 0) return null;
  const verLaSesion = (f: { readonly fecha: string; readonly executionId: string }) =>
    `/pro/advisees/training?id=${encodeURIComponent(asesoradoId)}&vista=ejecuciones&desde=${f.fecha}&hasta=${f.fecha}&sesion=${encodeURIComponent(f.executionId)}`;
  return (
    <div className="grafico__desplazable">
      {linea.puntos.length > 1 ? <p className="nota">{C.elegirEnLaTabla}</p> : null}
      <table className="tabla fuerza-en-analizar__tabla" data-tabla-de-origen>
        <caption className="visualmente-oculto">Cada estimación con su serie de origen, y las sesiones sin estimación</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Serie que entra</th>
            <th scope="col">Quién la escribió</th>
            <th scope="col">Repeticiones equivalentes</th>
            <th scope="col">Banda</th>
            <th scope="col">Estimación</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            if (f.tipo === 'sin-estimacion-seguidas') {
              // PG-10: el mismo motivo en sesiones seguidas, en una fila con el rango; se abre para ver cada una.
              return (
                <tr key={f.filas[0]!.executionId} data-sin-estimacion data-seguidas={f.filas.length}>
                  <th scope="row">{rangoDeSesiones(f.filas.map((x) => x.fecha))}</th>
                  <td colSpan={4}>{f.motivo}</td>
                  <td>
                    sin estimación ·{' '}
                    <details className="fuerza-en-analizar__seguidas">
                      <summary>{C.verLasSesiones(f.filas.length)}</summary>
                      <ul>
                        {f.filas.map((x) => (
                          <li key={x.executionId}>
                            {diaConSemana(x.fecha)}: <Enlace href={verLaSesion(x)}>Ver la sesión</Enlace>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                </tr>
              );
            }
            if (f.tipo === 'sin-estimacion') {
              return (
                <tr key={f.executionId} data-sin-estimacion>
                  <th scope="row">{diaConSemana(f.fecha)}</th>
                  <td colSpan={4}>{f.motivo}</td>
                  <td>
                    sin estimación · <Enlace href={verLaSesion(f)}>Ver la sesión</Enlace>
                  </td>
                </tr>
              );
            }
            const p = f.punto;
            const e = estimacionDelPunto(p, '');
            const esLaElegida = elegido?.pointId === p.pointId;
            return (
              <tr key={p.pointId} data-elegida={esLaElegida ? '' : undefined}>
                <th scope="row">
                  <button type="button" className="boton boton--enlace" aria-pressed={esLaElegida} data-elegir-punto onClick={() => onElegir(p)}>
                    {diaConSemana(p.date)}
                    <span className="visualmente-oculto">: {C.leerEsta}</span>
                  </button>
                </th>
                <td>{laSerie(p)}</td>
                <td>{p.source === 'OBSERVED' ? 'La observaste vos' : `${nombres.deQuien(p.writtenBy, asesoradoId)}, en la app`}</td>
                <td>
                  {String(e.repeticiones)} + {String(e.rir).replace('.', ',')} = {String(e.repeticionesEquivalentes).replace('.', ',')}
                </td>
                <td>{e.banda === 'ORIENTATIVA' ? 'de más de 10 a 12 · orientativa' : 'hasta 10'}</td>
                <td>
                  <strong>{estimacionALaVista(e)}</strong>{' '}
                  <button type="button" className="boton boton--enlace" onClick={() => onComo(p)}>
                    {COPY_COMO_SE_CALCULO.titulo}
                    <span className="visualmente-oculto"> del {diaDelPunto(p)}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * GR-02 (WP-GRAFICOS, DL-174): cada versión del plan con estimaciones de la persona, con la mediana del RIR registrado,
 * las repeticiones de la serie usada y el ruido propio, en texto (sin el signo más-menos ni porcentajes).
 */
function PorVersion({ lecturas }: { lecturas: readonly LecturaDeLaVersion[] }) {
  if (lecturas.length === 0) return null;
  return (
    <div className="grafico-de-entrenamiento__por-version">
      <p className="grafico-de-entrenamiento__subtitulo">{COPY_FUERZA_ESTIMADA.porVersion}</p>
      <ul data-lectura-por-version>
        {lecturas.map((v) => (
          <li key={v.planVersionId}>
            <strong>{v.rotulo}:</strong> {v.texto}.
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * La lectura al costado: el punto elegido (el último, de entrada), con la versión del plan que regía ese día y su ruido
 * (GR-02: antes que la diferencia), la diferencia con el anterior y lo que no entra, una línea por sesión.
 */
function Lectura({
  linea,
  elegido,
  asesoradoId,
  onComo,
  soloOrientativas,
  versiones,
  porVersion,
}: {
  linea: LineaDeFuerza | null;
  elegido: PuntoDeFuerza | null;
  asesoradoId: string;
  onComo: (p: PuntoDeFuerza) => void;
  soloOrientativas: readonly PuntoDeFuerza[];
  versiones: readonly VersionDelPlanEnElPeriodo[];
  porVersion: readonly LecturaDeLaVersion[];
}) {
  const nombres = useNombres();
  if (!linea || !elegido) return null;
  const puntos = linea.puntos;
  const i = puntos.findIndex((p) => p.pointId === elegido.pointId);
  const anterior = i > 0 ? puntos[i - 1]! : null;
  const e = estimacionDelPunto(elegido, '');
  const diferencia = anterior ? diferenciaEntreEstimaciones(estimacionDelPunto(anterior, ''), e) : null;
  const sesion = haciaLaSesion(asesoradoId, elegido);
  const version = elegido.source === 'PERSON' ? versionDelPlanEn(elegido.date, versiones) : null;
  const ruido = elegido.source === 'PERSON' ? lecturaDeLaVersionEn(elegido.date, porVersion) : null;
  const noEntra = loQueNoEntraPorFecha(puntos, linea.noEntraron, soloOrientativas);
  return (
    <aside className="fuerza-en-analizar__lectura" aria-live="polite" data-lectura-de-fuerza>
      <h3>{C.lectura(fechaLarga(elegido.date))}</h3>
      {version ? <p className="nota">{C.planDeLaLectura(version)}</p> : null}
      <p className="tarjeta-de-fuerza__valor">
        <span className="tarjeta-de-fuerza__numero">{estimacionALaVista(e)}</span>
      </p>
      <p className="nota">{rotuloDeLaEstimacion(e.banda)}</p>
      <p>
        {laSerie(elegido)}
        <br />
        <span className="nota">{elegido.source === 'OBSERVED' ? 'la observaste vos' : `la escribió ${nombres.deQuien(elegido.writtenBy, asesoradoId)} en la app`}</span>
      </p>
      <p className="tarjeta-de-fuerza__acciones">
        <button type="button" className="boton boton--enlace" onClick={() => onComo(elegido)}>
          {COPY_COMO_SE_CALCULO.titulo}
        </button>
        {sesion ? <Enlace href={sesion}>Ver la sesión</Enlace> : null}
      </p>
      {ruido ? (
        <p className="nota" data-ruido-de-la-version>
          {ruido.rotulo}: {ruido.texto}.
        </p>
      ) : null}
      {anterior && diferencia ? (
        <div className="fuerza-en-analizar__diferencia">
          <p>
            {C.frente(diaDelPunto(anterior))} <strong>{diferencia}</strong>
          </p>
          <p className="nota">{C.diferencia(elegido.estimate.load.value, elegido.estimate.load.unit)}</p>
        </div>
      ) : null}
      <div>
        <h4>{C.loQueNoEntra}</h4>
        {noEntra.lineas.length > 0 ? (
          <ul className="fuerza-en-analizar__no-entra" data-no-entra-por-fecha>
            {noEntra.lineas.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
        {noEntra.quedan > 0 ? <p className="nota">{C.quedan(noEntra.quedan)}</p> : null}
        <p className="nota">{C.antes}</p>
        <p className="nota">{COPY_FUERZA.reglaDelRir}</p>
      </div>
    </aside>
  );
}

export { PREGUNTA_DE_LA_FUERZA };
