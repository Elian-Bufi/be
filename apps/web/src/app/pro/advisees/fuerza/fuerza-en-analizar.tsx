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
 *   como tocarlo en el gráfico (WCAG 2.1.1); el gráfico también recibe el foco y las flechas eligen el punto anterior o
 *   el siguiente. La tabla es el texto del gráfico.
 * - Con el interruptor apagado, una sesión que solo tuvo series de más de 10 a 12 es un hueco con su fila.
 * - La columna «Sesión» de la maqueta espera que la clave traiga el nombre de la sesión (EDT-55).
 *
 * La pasada visual (WP-GRAFICOS, 15/11; DISENO-VISUAL §1 y §2): es la pieza que también usan GR-02 y GR-26.
 * - **Arriba,** «1RM estimado (Epley v1)» y, tenue, la unidad y el período; la leyenda como fichas, solo con las marcas
 *   que se ven.
 * - **Sin rótulo en cada punto:** el número va en el último, el elegido, el máximo y el mínimo, sin pisarse; el resto,
 *   al pasar el mouse, con el teclado o en la lectura del costado.
 * - **El eje,** de 3 a 5 marcas redondas, 10 kg o 22 lb como mínimo (GR-T15), y el gráfico al ancho medido: la letra
 *   no se achica en 1024 ni se agranda en 1920.
 * - **Las versiones, discretas:** un tono muy tenue que alterna, una línea fina en el cambio y «v8» arriba; si cambió lo
 *   indicado (el RIR o las repeticiones), «v8 · de 4 a 3 repeticiones», del comparador (`lectura-de-lo-indicado.ts`).
 * - **La lectura del costado,** sin «154,5 → 160,5 kg» ni flecha (§5.12): primero lo que mueve un RIR en esa estimación
 *   y después «La anterior (2 nov): ≈ 154,5 kg».
 * - **A la vista, debajo del gráfico** (revisión de #283, §5.6 y §5.12): el rango de validez («Solo series de RIR 0 a 2 y
 *   hasta 10 repeticiones equivalentes») y lo que mueve un RIR en el período; los cambios de lo indicado que no entran en
 *   la línea de su versión, en texto. La guía visual los llevaba a «Cómo leerlo»: ahí chocaba con §5, y §5 manda.
 * - **«Cómo leerlo»** (cerrado) tiene la fórmula, por qué el RIR 0 a 2, las versiones y lo que no entra, una línea por
 *   sesión.
 * - **La tabla,** una fila por renglón y sin partir un valor: con menos ancho, menos columnas, no números cortados.
 *
 * Como la composición (TA-25), la pregunta vive en el website y no se guarda como vista: su identificador no entra en
 * `ID_DE_PREGUNTAS`, que valida la API. El período es el de la ficha, que la API recorta al inicio del acompañamiento.
 */
import { COPY_FUERZA, estimacionALaVista, EJERCICIOS_DE_LA_ESTIMACION_V1, numero, rotuloDeLaEstimacion, serieDisponible, type PuntoDeFuerza } from '@be/domain';
import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../../../components/estados';
import { Enlace } from '../../../../components/enlace';
import { Icono } from '../../../../components/icono';
import { ICONO_DE_FALLA } from '../../../../lib/fallas';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { ComoLeerlo } from '../graficos/como-leerlo';
import { marcasRedondas, puntosConRotulo, rotulosSinPisarse, textoDeLaMarcaDelEje } from '../graficos/ejes';
import { useLoIndicadoDelEjercicio } from '../graficos/lectura-de-lo-indicado';
import { cambiosPorVersion } from '../graficos/lo-indicado-en-el-tiempo';
import { diaYMes } from '../graficos/eje-de-fechas';
import { useAnchoDelGrafico } from '../graficos/medidas-del-grafico';
import { useSeguimiento } from '../seguimiento/contexto';
import { parametrosDePregunta } from '../seguimiento/estado';
import { ComoSeCalculo, COPY_COMO_SE_CALCULO, fechaLarga } from './como-se-calculo';
import {
  cambiosDeLoIndicadoEnPalabras,
  COPY_DEL_RUIDO,
  diaConSemana,
  diaDelPunto,
  estimacionDelPunto,
  fechasDelEje,
  filasConLosMotivosSeguidos,
  filasDeLaEvolucion,
  haciaLaSesion,
  laSerie,
  loQueHaceFalta,
  loQueMueveUnRir,
  loQueNoEntraPorFecha,
  PREGUNTA_DE_LA_FUERZA,
  rangoDeSesiones,
  textosDelEjeDeLaFuerza,
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
  leyenda: { nucleo: 'Hasta 10 rep. equivalentes', orientativa: 'De más de 10 a 12', observada: 'Observada por vos', sinEstimacion: 'Sin estimación', hoy: 'Hoy' },
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
  /** La anterior, sin flecha y sin «primero → último» (§5.12): su fecha y su valor, y el profesional compara. */
  anterior: (dia: string) => `La anterior (${dia}):`,
  // Con Epley, un RIR de diferencia mueve la cuenta la carga sobre 30: se calcula con la serie elegida y su unidad.
  diferencia: (carga: number, unidad: string) => `Una diferencia entre dos estimaciones, en su unidad. Un RIR de diferencia mueve esta cuenta ≈ ${numero(carga / 30, 1)} ${unidad}.`,
  cambiarLaPregunta: 'Cambiar la pregunta',
  deOtros: 'Hay registros con otro profesional que no ves.',
  antes: 'Lo que la persona registró antes de la app nueva no dice quién escribió cada valor: no entra. Lo que observaste vos entra si se puede estimar; las de más de 10 a 12, con el interruptor encendido.',
  limite: 'Una estimación con una serie no es una repetición máxima medida, y no es una indicación de carga.',
  /** La pasada visual (15/11): el título del gráfico lleva la marca de lo estimado; la línea tenue, la unidad y el período. */
  titulo: '1RM estimado (Epley v1)',
  detalle: (unidad: string, desde: string, hasta: string | null) => `${unidad} · una estimación por sesión · del ${desde} ${hasta === null ? 'a hoy' : `al ${hasta}`}`,
  metodo: 'Epley v1 estima la repetición máxima con una serie: la carga × (1 + repeticiones equivalentes / 30), donde las repeticiones equivalentes son las hechas más el RIR. Se usa solo con series de RIR 0 a 2 y hasta 12 repeticiones equivalentes.',
  versiones:
    'El fondo alterna con cada versión del plan; la línea fina marca el cambio. Si cambió lo indicado (el RIR o las repeticiones), lo dice el rótulo de la línea o, si no entra, la línea de debajo del gráfico: la estimación puede cambiar aunque la fuerza no cambie.',
  /** La fila que avisa que entre las recientes y la elegida hay filas que no se ven. */
  salto: (n: number) => (n === 1 ? '… 1 fila más, en «Ver las filas»' : `… ${n} filas más, en «Ver las filas»`),
  conElTeclado: 'Con el teclado, en el gráfico: las flechas eligen la estimación anterior o la siguiente; Inicio y Fin, la primera y la última. En la tabla, cada fecha elige la suya.',
  verTodas: (n: number) => `Ver las ${n} filas`,
  verMenos: 'Ver menos',
  orientativa: 'orientativa',
  laObservasteVos: 'la observaste vos',
} as const;

const C = LA_PREGUNTA_DE_LA_FUERZA;

/** Cuántas filas de la tabla de origen se ven de entrada: las más recientes. Las demás, a un toque. */
const FILAS_A_LA_VISTA = 8;

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
  // Lo que cambió en lo indicado al empezar cada versión, para su línea («v8 · de 4 a 3 repeticiones»). Si no se puede
  // leer, las versiones van sin ese rótulo: es una ayuda para leer, no un dato de la persona.
  const indicado = useLoIndicadoDelEjercicio({ token, asesoradoId, sesionPerdida }, exerciseId ? `e:${exerciseId}` : null, periodo.desde, periodo.hasta);
  const cambios = useMemo(
    () =>
      indicado.tipo === 'lista'
        ? cambiosPorVersion(
            indicado.observaciones,
            versiones.filter((v) => v.domain === 'TRAINING').map((v) => ({ clave: v.from, desde: v.from, hasta: v.to, planVersionId: v.planVersionId ?? null })),
          )
        : new Map<string, string>(),
    [indicado, versiones],
  );
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
          <div className="fuerza-en-analizar__principal">
            <Grafico
              linea={linea}
              elegido={elegido}
              onElegir={(p) => setElegidoId(p.pointId)}
              hasta={lectura.hoy}
              desde={lectura.desde}
              zona={lectura.zona}
              soloOrientativas={soloOrientativas}
              versiones={versiones}
              cambios={cambios}
              conOrientativas={encendido}
            />
            {linea && puntos.length > 0 ? <ComoLeerLaFuerza linea={linea} soloOrientativas={soloOrientativas} /> : null}
            <TablaDeOrigen linea={linea} asesoradoId={asesoradoId} onComo={setComo} elegido={elegido} onElegir={(p) => setElegidoId(p.pointId)} soloOrientativas={soloOrientativas} />
          </div>
          <Lectura linea={linea} elegido={elegido} asesoradoId={asesoradoId} onComo={setComo} versiones={versiones} cambios={cambios} />
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

/** El alto del dibujo: la franja de las versiones arriba, el lienzo (240 px) y el renglón de las fechas. */
const ALTO = 296;
const MARGEN = { izq: 52, der: 18, arr: 30, abj: 26 };
/** El ancho aproximado de una letra de 12 px, para que un rótulo no se pise con otro. */
const LETRA = 6.6;

/** El día de hoy en la zona de la lectura, como fecha civil. */
function hoyEn(zona: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** El rango mínimo del eje del 1RM estimado, del catálogo (GR-T15): 10 kg o 22 lb. */
const rangoMinimo = (unidad: string): number => serieDisponible('entrenamiento.1rm-estimado')?.rangoMinimoDelEje?.[unidad === 'lb' ? 'lb' : 'kg'] ?? 0;

/** El número de un punto, sin el «≈» ni la unidad: «160,5». */
const numeroDelPunto = (p: PuntoDeFuerza): string => estimacionALaVista(estimacionDelPunto(p, '')).replace('≈ ', '').replace(` ${p.estimate.load.unit}`, '');

/** Lo que dice un punto al pasar el mouse o con el teclado: «lun 9 nov · ≈ 160,5 kg», y si es orientativa u observada. */
function globoDelPunto(p: PuntoDeFuerza): string {
  const partes = [diaConSemana(p.date), estimacionALaVista(estimacionDelPunto(p, ''))];
  if (p.source === 'OBSERVED') partes.push(C.laObservasteVos);
  else if (p.estimate.band === 'ORIENTATIVE') partes.push(C.orientativa);
  return partes.join(' · ');
}

/**
 * El gráfico: un punto por sesión (lleno, hueco u observado), sin línea a través de un hueco; el eje de fechas, la
 * línea de hoy, una marca por sesión sin estimación y las franjas de las versiones del plan (maqueta 15), con la
 * pasada visual del 15/11.
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
  cambios,
  conOrientativas,
}: {
  linea: LineaDeFuerza | null;
  elegido: PuntoDeFuerza | null;
  onElegir: (p: PuntoDeFuerza) => void;
  desde: string;
  hasta: string;
  zona: string;
  soloOrientativas: readonly PuntoDeFuerza[];
  versiones: readonly VersionDelPlanEnElPeriodo[];
  /** El cambio de lo indicado al empezar cada versión, por su primer día. */
  cambios: ReadonlyMap<string, string>;
  /** El interruptor de las de más de 10 a 12: cambia el rango de validez que se dice. */
  conOrientativas: boolean;
}) {
  const [ref, ancho] = useAnchoDelGrafico();
  const [encima, setEncima] = useState<string | null>(null);
  const puntos = linea?.puntos ?? [];
  const unidad = linea?.unidad ?? 'kg';
  const geo = useMemo(() => {
    const valores = puntos.map((p) => p.estimate.value);
    let min = Math.min(...valores);
    let max = Math.max(...valores);
    // GR-T15 (WP-GRAFICOS, DL-174): el eje abarca 10 kg o 22 lb como mínimo, para que el ruido de un RIR no parezca un salto.
    const rango = rangoMinimo(unidad);
    if (max - min < rango) {
      const centro = (min + max) / 2;
      min = Math.max(0, centro - rango / 2);
      max = min + rango;
    }
    const eje = marcasRedondas(min, max);
    const t0 = Date.parse(`${desde}T12:00:00Z`);
    const t1 = Math.max(Date.parse(`${hasta}T12:00:00Z`), t0 + 86_400_000);
    const derecha = Math.max(MARGEN.izq + 40, ancho - MARGEN.der);
    const x = (fecha: string) => MARGEN.izq + ((Date.parse(`${fecha}T12:00:00Z`) - t0) / (t1 - t0)) * (derecha - MARGEN.izq);
    const y = (v: number) => MARGEN.arr + (1 - (v - eje.abajo) / Math.max(eje.arriba - eje.abajo, 1)) * (ALTO - MARGEN.arr - MARGEN.abj);
    return { x, y, eje, derecha };
  }, [puntos, unidad, desde, hasta, ancho]);
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
  const conHoy = hoy >= desde && hoy <= hasta;
  const abajo = ALTO - MARGEN.abj;
  const franjas = versiones
    .filter((v) => v.domain === 'TRAINING' && (v.to === null || v.to > desde) && v.from <= hasta)
    .sort((a, b) => (a.from < b.from ? -1 : 1))
    .map((v) => ({ v, x0: geo.x(v.from < desde ? desde : v.from), x1: geo.x(v.to === null || v.to > hasta ? hasta : v.to) }))
    .filter((f) => f.x1 > f.x0);
  // El rótulo de cada versión: «v8 · de 4 a 3 repeticiones» si entra hasta la siguiente (o hasta «hoy»); si no, «v8».
  const rotulosDeVersion = franjas.map((f, i) => {
    const tope = (franjas[i + 1]?.x0 ?? (conHoy ? geo.x(hoy) - 34 : geo.derecha)) - 8;
    const corto = f.v.label;
    const cambio = f.v.from > desde ? cambios.get(f.v.from) : undefined;
    const largo = cambio ? `${corto} · ${cambio}` : corto;
    const texto = [largo, corto].find((t) => t.length * LETRA <= tope - f.x0 - 6) ?? null;
    return { ...f, texto, conCambio: Boolean(cambio && texto === largo) };
  });
  const ordenados = [...puntos].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const conValor = ordenados.map((p) => ({ clave: p.pointId, valor: p.estimate.value }));
  const claves = puntosConRotulo(conValor, elegido?.pointId ?? null);
  const ultimo = ordenados[ordenados.length - 1]?.pointId ?? null;
  // El mínimo va abajo de su punto: arriba suele pasar la línea.
  const minimo = [...conValor].sort((a, b) => a.valor - b.valor)[0]?.clave ?? null;
  const ejeY = geo.eje.valores.map((v) => ({ x1: 0, x2: MARGEN.izq - 4, y1: geo.y(v) - 8, y2: geo.y(v) + 8 }));
  const rotulos = rotulosSinPisarse(
    claves.flatMap((c) => {
      const p = puntos.find((x) => x.pointId === c);
      return p ? [{ clave: c, x: geo.x(p.date), y: geo.y(p.estimate.value), texto: numeroDelPunto(p), abajo: c === minimo && c !== ultimo }] : [];
    }),
    { izquierda: MARGEN.izq, derecha: geo.derecha + MARGEN.der - 2, arriba: MARGEN.arr - 4, abajo },
    ejeY,
    13,
  );
  const sobre = puntos.find((p) => p.pointId === encima) ?? null;
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ordenados.findIndex((p) => p.pointId === elegido?.pointId);
    const destino = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? i - 1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? i + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? ordenados.length - 1 : null;
    if (destino === null) return;
    e.preventDefault();
    const p = ordenados[Math.min(Math.max(destino, 0), ordenados.length - 1)];
    if (p) onElegir(p);
  };
  const hayNucleo = puntos.some((p) => p.source !== 'OBSERVED' && p.estimate.band !== 'ORIENTATIVE');
  const hayOrientativas = puntos.some((p) => p.source !== 'OBSERVED' && p.estimate.band === 'ORIENTATIVE');
  const hayObservadas = puntos.some((p) => p.source === 'OBSERVED');
  // §5.12: el cambio de lo indicado, en texto. Todos van en el nombre del gráfico (el SVG no se lee); a la vista, los que
  // no entraron enteros en la línea de su versión.
  const cambiosEnTexto = cambiosDeLoIndicadoEnPalabras(versiones, cambios, desde);
  const recortados = cambiosDeLoIndicadoEnPalabras(
    rotulosDeVersion.filter((f) => !f.conCambio).map((f) => f.v),
    cambios,
    desde,
  );
  const ruido = loQueMueveUnRir(
    puntos.map((p) => p.estimate.load.value),
    linea.unidad,
  );
  return (
    <figure className="fuerza-en-analizar__grafico">
      <figcaption className="fuerza-en-analizar__cabecera">
        <strong className="fuerza-en-analizar__titulo">{C.titulo}</strong>
        <span className="fuerza-en-analizar__detalle">{C.detalle(linea.unidad, diaYMes(desde, hoy), hasta >= hoy ? null : diaYMes(hasta, hoy))}</span>
        {/* La leyenda: fichas cortas, solo con las marcas que se ven en este gráfico. */}
        <span className="fuerza-en-analizar__leyenda">
          {hayNucleo ? <span data-forma="lleno">{C.leyenda.nucleo}</span> : null}
          {hayOrientativas ? <span data-forma="hueco">{C.leyenda.orientativa}</span> : null}
          {hayObservadas ? <span data-forma="rombo">{C.leyenda.observada}</span> : null}
          {sinEstimacion.length > 0 ? <span data-forma="marca">{C.leyenda.sinEstimacion}</span> : null}
          {conHoy ? <span data-forma="hoy">{C.leyenda.hoy}</span> : null}
        </span>
      </figcaption>
      <div
        ref={ref}
        className="fuerza-en-analizar__lienzo"
        tabIndex={0}
        role="group"
        aria-roledescription="gráfico"
        aria-label={`Evolución de la fuerza estimada, en ${linea.unidad}: ${puntos.length} ${puntos.length === 1 ? 'estimación' : 'estimaciones'}. ${cambiosEnTexto.length > 0 ? `${COPY_DEL_RUIDO.cambios(cambiosEnTexto)} ` : ''}${C.conElTeclado}`}
        onKeyDown={alTeclear}
      >
        <svg width={ancho} height={ALTO} viewBox={`0 0 ${ancho} ${ALTO}`} aria-hidden="true" focusable="false">
          {rotulosDeVersion.map(({ v, x0, x1, texto, conCambio }, i) => (
            <g key={`${v.label}-${v.from}`} className="fuerza-en-analizar__franja" data-par={(i & 1) === 1 ? '' : undefined} data-con-cambio={conCambio ? '' : undefined}>
              <rect x={x0} y={MARGEN.arr - 6} width={x1 - x0} height={abajo - MARGEN.arr + 6} />
              {v.from > desde ? <line x1={x0} x2={x0} y1={4} y2={abajo} className="fuerza-en-analizar__cambio" /> : null}
              {texto ? (
                <text x={x0 + 6} y={14} className="fuerza-en-analizar__eje fuerza-en-analizar__version">
                  {texto}
                </text>
              ) : null}
            </g>
          ))}
          {geo.eje.valores.map((v) => (
            <g key={v}>
              <line x1={MARGEN.izq} x2={geo.derecha} y1={Math.round(geo.y(v)) + 0.5} y2={Math.round(geo.y(v)) + 0.5} className="fuerza-en-analizar__guia" />
              <text x={MARGEN.izq - 8} y={geo.y(v) + 4} textAnchor="end" className="fuerza-en-analizar__eje">
                {textoDeLaMarcaDelEje(v, geo.eje.decimales)}
              </text>
            </g>
          ))}
          {fechasDelEje(desde, hasta).map((f, i, todas) => (
            <text key={f} x={geo.x(f)} y={ALTO - 6} textAnchor={i === 0 ? 'start' : i === todas.length - 1 ? 'end' : 'middle'} className="fuerza-en-analizar__eje">
              {textosDelEjeDeLaFuerza(todas)[i]}
            </text>
          ))}
          {sinEstimacion.map((f) => (
            <line key={`sin-${f}`} x1={geo.x(f)} x2={geo.x(f)} y1={abajo - 10} y2={abajo} className="fuerza-en-analizar__sin-estimacion" />
          ))}
          {conHoy ? (
            <g className="fuerza-en-analizar__hoy">
              <line x1={geo.x(hoy)} x2={geo.x(hoy)} y1={MARGEN.arr - 6} y2={abajo} />
              <text x={geo.x(hoy) - 4} y={14} textAnchor="end" className="fuerza-en-analizar__eje">
                {C.leyenda.hoy.toLowerCase()}
              </text>
            </g>
          ) : null}
          {tramos.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={geo.x(puntos[a]!.date)} y1={geo.y(puntos[a]!.estimate.value)} x2={geo.x(puntos[b]!.date)} y2={geo.y(puntos[b]!.estimate.value)} className="fuerza-en-analizar__linea" />
          ))}
          {puntos.map((p) => {
            const cx = geo.x(p.date);
            const cy = geo.y(p.estimate.value);
            const forma = p.source === 'OBSERVED' ? 'rombo' : p.estimate.band === 'ORIENTATIVE' ? 'hueco' : 'lleno';
            const elegidoEste = elegido?.pointId === p.pointId;
            return (
              <g
                key={p.pointId}
                className="fuerza-en-analizar__punto"
                data-forma={forma}
                data-elegido={elegidoEste ? '' : undefined}
                onClick={() => onElegir(p)}
                onMouseEnter={() => setEncima(p.pointId)}
                onMouseLeave={() => setEncima((x) => (x === p.pointId ? null : x))}
              >
                <circle cx={cx} cy={cy} r={11} className="fuerza-en-analizar__toque" />
                {elegidoEste ? <circle cx={cx} cy={cy} r={9} className="fuerza-en-analizar__aro" /> : null}
                {forma === 'rombo' ? <rect x={cx - 4.5} y={cy - 4.5} width={9} height={9} transform={`rotate(45 ${cx} ${cy})`} /> : <circle cx={cx} cy={cy} r={4.5} />}
              </g>
            );
          })}
          {rotulos.map((r) => (
            <text key={`r${r.clave}`} x={r.tx} y={r.ty} textAnchor={r.ancla} className="fuerza-en-analizar__valor" data-fuerte={r.clave === elegido?.pointId || r.clave === ultimo ? '' : undefined}>
              {r.texto}
            </text>
          ))}
          {sobre ? <Globo x={geo.x(sobre.date)} y={geo.y(sobre.estimate.value)} texto={globoDelPunto(sobre)} ancho={ancho} /> : null}
        </svg>
      </div>
      {/* Debajo, a la vista (revisión de #283): el rango de validez (§5.6) y lo que mueve un RIR (§5.12), antes que cualquier
          comparación. Ya no va «la más baja… la más alta…»: con la estimación que sube, se leía como primero → último. */}
      <p className="fuerza-en-analizar__linea-de-lectura" data-ruido-y-validez>
        {COPY_DEL_RUIDO.validez(conOrientativas)}
        {ruido ? ` ${COPY_DEL_RUIDO.ruido(ruido)}` : ''}
      </p>
      {recortados.length > 0 ? (
        <p className="fuerza-en-analizar__linea-de-lectura" data-cambios-de-lo-indicado>
          {COPY_DEL_RUIDO.cambios(recortados)}
        </p>
      ) : null}
    </figure>
  );
}

/** El globo de un punto al pasar el mouse: su fecha y su estimación, arriba del punto y adentro del dibujo. */
function Globo({ x, y, texto, ancho }: { x: number; y: number; texto: string; ancho: number }) {
  const w = texto.length * LETRA + 16;
  const h = 24;
  const gx = Math.min(Math.max(x - w / 2, 2), ancho - w - 2);
  const gy = y - h - 14 >= 2 ? y - h - 14 : y + 14;
  return (
    <g className="fuerza-en-analizar__globo" pointerEvents="none">
      <rect x={gx} y={gy} width={w} height={h} rx={6} />
      <text x={gx + 8} y={gy + 16}>
        {texto}
      </text>
    </g>
  );
}

/**
 * «Cómo leerlo», debajo del gráfico y cerrado: la fórmula, por qué solo el RIR 0 a 2, las versiones y lo que no entra,
 * una línea por sesión (DISENO-VISUAL §2: «Lo que no entra», a «Cómo leerlo»). El rango de validez y lo que mueve un RIR
 * quedan a la vista, debajo del gráfico y en la lectura del costado (§5.6 y §5.12).
 */
function ComoLeerLaFuerza({ linea, soloOrientativas }: { linea: LineaDeFuerza; soloOrientativas: readonly PuntoDeFuerza[] }) {
  const noEntra = loQueNoEntraPorFecha(linea.puntos, linea.noEntraron, soloOrientativas);
  return (
    <ComoLeerlo className="fuerza-en-analizar__como-leerlo">
      <p>{C.metodo}</p>
      <p>{COPY_FUERZA.reglaDelRir}</p>
      <p>{C.versiones}</p>
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
      <p className="nota">{C.conElTeclado}</p>
    </ComoLeerlo>
  );
}

/** Las columnas de la tabla según el ancho: con menos lugar, menos detalle, nunca un número partido. */
type Columnas = 'TODAS' | 'MEDIA' | 'CORTA';
const columnasPara = (ancho: number): Columnas => (ancho >= 900 ? 'TODAS' : ancho >= 600 ? 'MEDIA' : 'CORTA');

/**
 * La tabla de origen: la fecha, la serie que entra, quién la escribió, la banda, el valor y «Cómo se calculó». Cada fecha
 * de un punto es un botón que lo elige, como tocarlo en el gráfico: así se llega con el teclado y con un lector de
 * pantalla a la lectura del costado (WCAG 2.1.1). Se ven las filas más recientes; las demás, a un toque.
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
  const [ref, ancho] = useAnchoDelGrafico();
  const [todas, setTodas] = useState(false);
  if (!linea) return null;
  const filas = filasConLosMotivosSeguidos(filasDeLaEvolucion(linea.puntos, linea.noEntraron, soloOrientativas));
  if (filas.length === 0) return null;
  const columnas = columnasPara(ancho);
  const conQuien = columnas === 'TODAS';
  const conEquivalentes = columnas !== 'CORTA';
  const cuantas = 3 + (conQuien ? 2 : 0) + (conEquivalentes ? 1 : 0);
  // La fila elegida se ve aunque sea vieja: elegirla desde el gráfico no la deja escondida.
  const indiceElegida = filas.findIndex((f) => f.tipo === 'punto' && f.punto.pointId === elegido?.pointId);
  const aLaVista = todas ? filas : filas.filter((_, i) => i < FILAS_A_LA_VISTA || i === indiceElegida);
  // Si la elegida es más vieja que las recientes, una fila dice cuántas quedan entre medio: no se lee como la siguiente.
  const salto = !todas && indiceElegida >= FILAS_A_LA_VISTA ? indiceElegida - FILAS_A_LA_VISTA : 0;
  const verLaSesion = (f: { readonly fecha: string; readonly executionId: string }) =>
    `/pro/advisees/training?id=${encodeURIComponent(asesoradoId)}&vista=ejecuciones&desde=${f.fecha}&hasta=${f.fecha}&sesion=${encodeURIComponent(f.executionId)}`;
  return (
    <div ref={ref} className="grafico__desplazable fuerza-en-analizar__tabla-caja" data-columnas={columnas}>
      {linea.puntos.length > 1 ? <p className="nota">{C.elegirEnLaTabla}</p> : null}
      <table className="tabla fuerza-en-analizar__tabla" data-tabla-de-origen>
        <caption className="visualmente-oculto">Cada estimación con su serie de origen, y las sesiones sin estimación</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Serie que entra</th>
            {conQuien ? <th scope="col">Quién la escribió</th> : null}
            {conEquivalentes ? <th scope="col">Repeticiones equivalentes</th> : null}
            {conQuien ? <th scope="col">Banda</th> : null}
            <th scope="col">Estimación</th>
          </tr>
        </thead>
        <tbody>
          {aLaVista.flatMap((f, i) => {
            const fila = filaDeOrigen(f);
            if (salto > 0 && i === FILAS_A_LA_VISTA) {
              return [
                <tr key="salto" className="fuerza-en-analizar__salto" data-salto>
                  <td colSpan={cuantas} className="nota">
                    {C.salto(salto)}
                  </td>
                </tr>,
                fila,
              ];
            }
            return [fila];
          })}
        </tbody>
      </table>
      {filas.length > FILAS_A_LA_VISTA ? (
        <button type="button" className="boton boton--enlace fuerza-en-analizar__ver-todas" aria-expanded={todas} onClick={() => setTodas((t) => !t)}>
          {todas ? C.verMenos : C.verTodas(filas.length)}
        </button>
      ) : null}
    </div>
  );

  function filaDeOrigen(f: (typeof filas)[number]) {
            if (f.tipo === 'sin-estimacion-seguidas') {
              // PG-10: el mismo motivo en sesiones seguidas, en una fila con el rango; se abre para ver cada una.
              return (
                <tr key={f.filas[0]!.executionId} data-sin-estimacion data-seguidas={f.filas.length}>
                  <th scope="row">{rangoDeSesiones(f.filas.map((x) => x.fecha))}</th>
                  <td colSpan={cuantas - 2} className="fuerza-en-analizar__motivo">
                    {f.motivo}
                  </td>
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
                  <td colSpan={cuantas - 2} className="fuerza-en-analizar__motivo">
                    {f.motivo}
                  </td>
                  <td>
                    sin estimación · <Enlace href={verLaSesion(f)}>Ver la sesión</Enlace>
                  </td>
                </tr>
              );
            }
            const p = f.punto;
            const e = estimacionDelPunto(p, '');
            const esLaElegida = elegido?.pointId === p.pointId;
            // Sin las columnas de quién y de la banda, lo que dicen va junto al valor: nada se pierde, se acorta.
            const aclaracion = conQuien ? null : p.source === 'OBSERVED' ? C.laObservasteVos : e.banda === 'ORIENTATIVA' ? C.orientativa : null;
            return (
              <tr key={p.pointId} data-elegida={esLaElegida ? '' : undefined}>
                <th scope="row">
                  <button type="button" className="boton boton--enlace" aria-pressed={esLaElegida} data-elegir-punto onClick={() => onElegir(p)}>
                    {diaConSemana(p.date)}
                    <span className="visualmente-oculto">: {C.leerEsta}</span>
                  </button>
                </th>
                <td>{laSerie(p)}</td>
                {conQuien ? <td>{p.source === 'OBSERVED' ? 'La observaste vos' : `${nombres.deQuien(p.writtenBy, asesoradoId)}, en la app`}</td> : null}
                {conEquivalentes ? (
                  <td>
                    {String(e.repeticiones)} + {String(e.rir).replace('.', ',')} = {String(e.repeticionesEquivalentes).replace('.', ',')}
                  </td>
                ) : null}
                {conQuien ? <td>{e.banda === 'ORIENTATIVA' ? 'de más de 10 a 12 · orientativa' : 'hasta 10'}</td> : null}
                <td>
                  <strong>{estimacionALaVista(e)}</strong>
                  {aclaracion ? <span className="nota"> · {aclaracion}</span> : null}{' '}
                  <button type="button" className="boton boton--enlace" onClick={() => onComo(p)}>
                    {COPY_COMO_SE_CALCULO.titulo}
                    <span className="visualmente-oculto"> del {diaDelPunto(p)}</span>
                  </button>
                </td>
              </tr>
            );
  }
}

/**
 * La lectura al costado: el punto elegido (el último, de entrada), con la versión del plan que regía ese día (y lo que
 * cambió en lo indicado al empezar), lo que mueve un RIR en esa estimación y, después, la anterior con su fecha y su
 * valor: sin flecha y sin «primero → último» (§5.12). Lo que no entra y la fórmula están en «Cómo leerlo».
 */
function Lectura({
  linea,
  elegido,
  asesoradoId,
  onComo,
  versiones,
  cambios,
}: {
  linea: LineaDeFuerza | null;
  elegido: PuntoDeFuerza | null;
  asesoradoId: string;
  onComo: (p: PuntoDeFuerza) => void;
  versiones: readonly VersionDelPlanEnElPeriodo[];
  cambios: ReadonlyMap<string, string>;
}) {
  const nombres = useNombres();
  if (!linea || !elegido) return null;
  const puntos = linea.puntos;
  const i = puntos.findIndex((p) => p.pointId === elegido.pointId);
  const anterior = i > 0 ? puntos[i - 1]! : null;
  const e = estimacionDelPunto(elegido, '');
  const sesion = haciaLaSesion(asesoradoId, elegido);
  const version = elegido.source === 'PERSON' ? versionDelPlanEn(elegido.date, versiones) : null;
  // El cambio de lo indicado al empezar la versión de esta estimación (§5.12): en la primera línea, con la versión.
  const deLaVersion = version
    ? versiones.filter((v) => v.domain === 'TRAINING' && v.from <= elegido.date && (v.to === null || elegido.date < v.to)).sort((a, b) => (a.from < b.from ? 1 : -1))[0]
    : undefined;
  const cambio = deLaVersion ? cambios.get(deLaVersion.from) : undefined;
  const ruido = loQueMueveUnRir([elegido.estimate.load.value], elegido.estimate.load.unit);
  const aclaracionDeLaAnterior = anterior ? (anterior.source === 'OBSERVED' ? C.laObservasteVos : anterior.estimate.band === 'ORIENTATIVE' ? C.orientativa : null) : null;
  return (
    <aside className="fuerza-en-analizar__lectura" aria-live="polite" data-lectura-de-fuerza>
      <h3>{C.lectura(fechaLarga(elegido.date))}</h3>
      {version ? (
        <p className="nota" data-version-de-la-lectura>
          {C.planDeLaLectura(version)}
          {cambio && deLaVersion ? ` · desde el ${diaConSemana(deLaVersion.from)}: ${cambio}` : ''}
        </p>
      ) : null}
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
      {/* §5.12: el ruido antes que el cambio. Primero lo que mueve un RIR en esta estimación; después, la anterior. */}
      {ruido ? (
        <p className="nota fuerza-en-analizar__ruido" data-ruido-de-la-lectura>
          {COPY_DEL_RUIDO.ruidoDeLaElegida(ruido)}
        </p>
      ) : null}
      {anterior ? (
        <p className="fuerza-en-analizar__anterior" data-la-anterior>
          {C.anterior(diaDelPunto(anterior))} <strong>{estimacionALaVista(estimacionDelPunto(anterior, ''))}</strong>
          {aclaracionDeLaAnterior ? <span className="nota"> · {aclaracionDeLaAnterior}</span> : null}
        </p>
      ) : null}
    </aside>
  );
}

export { PREGUNTA_DE_LA_FUERZA };
