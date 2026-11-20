/**
 * Lo indicado y lo hecho del volumen de un ejercicio (WP-GRAFICOS-POR-FASE, GPF-06 y GPF-07; DL-187): las series
 * indicadas frente a las series hechas y el volumen de carga externa indicado frente al hecho, por sesión o por semana.
 * Sale del comparador (API-TRN-21 y API-SER-01), sesión por sesión con la instantánea que rigió (REG-06-105).
 *
 * **Las series** (solo las efectivas: el calentamiento no cuenta, DL-178):
 * - indicadas: las series que la prescripción planificaba;
 * - hechas: las series con algún dato en el registro vigente. Una sesión registrada «no realizada» aporta 0, que es la
 *   única omisión declarada; un ejercicio sin registrar en la sesión, un registro resumido o una vista que no se resuelve
 *   son **sin dato**, nunca 0 (06:4661).
 *
 * **El volumen de carga externa** (GPF-D07, la convención de DL-187): Σ carga × repeticiones de las series efectivas, con
 * la carga **como se registró** (BE no multiplica ni suma implementos: con mancuernas, es por mancuerna) y en una sola
 * unidad (kg y lb nunca se mezclan). Una serie sin carga, sin repeticiones o en otra unidad no entra, y se cuenta.
 * - Lo indicado: Σ carga sugerida × repeticiones indicadas de las series planificadas. Un rango de repeticiones da un
 *   rango de volumen («de 2.400 a 3.000»). Si a alguna serie le falta la carga (o es un % RM, que no se convierte) o las
 *   repeticiones, el volumen indicado de esa sesión es «Sin indicar»: no se completa.
 * - No equivale a trabajo mecánico, gasto energético ni estímulo: el gráfico lo dice.
 *
 * Es puro: lo prueba `apps/web/test/graficos-por-fase.test.mjs`.
 */
import { MARCA_SEGUN_EL_DATO, numero, valorPlanificado, valorRegistrado, type ObservacionDeEvolucion, type PuntoAnalitico, type SerieAnalitica } from '@be/domain';
import type { CarrilDePuntos, PuntoDelCarril } from '../carriles';

export interface RangoDelVolumen {
  readonly minimo: number;
  readonly maximo: number;
}

export interface ProgramadoYHecho {
  /** `executionId|prescriptionId`, o el lunes de la semana. */
  readonly clave: string;
  readonly fecha: string;
  /** El domingo de la semana; `null` por sesión. */
  readonly hasta: string | null;
  readonly en: string | null;
  /** La versión que rigió la sesión; `null` en una semana. */
  readonly planId: string | null;
  readonly sesiones: number;
  readonly seriesIndicadas: number | null;
  readonly seriesHechas: number | null;
  readonly volumenIndicado: RangoDelVolumen | null;
  readonly volumenHecho: number | null;
  /** Series hechas que no entran en el volumen: sin carga, sin repeticiones o en otra unidad. */
  readonly seriesSinVolumen: number;
}

export type GranoDelVolumen = 'SESION' | 'SEMANA';

/** Una sesión del ejercicio: lo indicado y lo hecho. Solo lo planificado como este ejercicio (no lo sustituido). */
export function programadoYHechoDeLaSesion(o: ObservacionDeEvolucion, unidad: 'kg' | 'lb'): ProgramadoYHecho | null {
  if (o.rol !== 'planificado-y-registrado') return null;
  const c = o.comparacion;
  const planificadas = c.filas.filter((f) => f.planificada.tipo === 'planificada');
  const noRealizada = c.condicion === 'NOT_COMPLETED';
  const sinDato = c.condicion === null || (!noRealizada && c.filas.some((f) => f.registrada.tipo === 'sin-dato' && f.registrada.motivo !== 'serie-no-registrada'));
  const hechas = c.filas.filter((f) => f.registrada.tipo === 'registrada');
  let volumenHecho = 0;
  let conVolumen = 0;
  for (const f of hechas) {
    const carga = valorRegistrado(f, { variable: 'carga', unidad });
    const reps = valorRegistrado(f, { variable: 'repeticiones' });
    if (carga.tipo === 'valor' && reps.tipo === 'valor') {
      volumenHecho += carga.valor * reps.valor;
      conVolumen++;
    }
  }
  let indicado: RangoDelVolumen | null = planificadas.length > 0 ? { minimo: 0, maximo: 0 } : null;
  for (const f of planificadas) {
    if (!indicado) break;
    const carga = valorPlanificado(c, f, { variable: 'carga', unidad });
    const reps = valorPlanificado(c, f, { variable: 'repeticiones' });
    const r = reps.tipo === 'valor' ? { min: reps.valor, max: reps.valor } : reps.tipo === 'rango' ? { min: reps.min, max: reps.max } : null;
    indicado = carga.tipo === 'valor' && r ? { minimo: indicado.minimo + carga.valor * r.min, maximo: indicado.maximo + carga.valor * r.max } : null;
  }
  return {
    clave: `${c.executionId}|${c.prescriptionId}`,
    fecha: c.fecha,
    hasta: null,
    en: c.ocurrio,
    planId: c.planId,
    sesiones: 1,
    seriesIndicadas: planificadas.length,
    seriesHechas: noRealizada ? 0 : sinDato ? null : hechas.length,
    volumenIndicado: indicado,
    volumenHecho: noRealizada ? 0 : conVolumen > 0 ? volumenHecho : null,
    seriesSinVolumen: noRealizada ? 0 : hechas.length - conVolumen,
  };
}

const lunesDe = (fecha: string): string => {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const sumar = (fecha: string, dias: number): string => new Date(Date.parse(`${fecha}T12:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);

/**
 * Por semana (lunes a domingo): la suma de las sesiones. Una semana con una sesión sin dato no tiene total de lo hecho,
 * y una con una sesión «Sin indicar» no tiene total de lo indicado: no se completa con lo que falta.
 *
 * Con `limites` (el eje del gráfico), una semana partida por el borde del período va de su primer a su último día dentro
 * del período: sin eso, la primera semana (con su lunes antes del eje) no se dibujaba, y la última decía días que no
 * entran.
 */
export function porSemana(sesiones: readonly ProgramadoYHecho[], limites?: { readonly desde: string; readonly hasta: string }): ProgramadoYHecho[] {
  const semanas = new Map<string, ProgramadoYHecho[]>();
  for (const s of sesiones) semanas.set(lunesDe(s.fecha), [...(semanas.get(lunesDe(s.fecha)) ?? []), s]);
  const total = (xs: readonly (number | null)[]): number | null => (xs.some((x) => x === null) ? null : xs.reduce<number>((a, b) => a + (b ?? 0), 0));
  return [...semanas.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([lunes, xs]) => ({
      clave: lunes,
      fecha: limites && limites.desde > lunes ? limites.desde : lunes,
      hasta: limites && limites.hasta < sumar(lunes, 6) ? limites.hasta : sumar(lunes, 6),
      en: null,
      planId: null,
      sesiones: xs.length,
      seriesIndicadas: total(xs.map((x) => x.seriesIndicadas)),
      seriesHechas: total(xs.map((x) => x.seriesHechas)),
      volumenIndicado: xs.some((x) => x.volumenIndicado === null)
        ? null
        : { minimo: xs.reduce((a, x) => a + x.volumenIndicado!.minimo, 0), maximo: xs.reduce((a, x) => a + x.volumenIndicado!.maximo, 0) },
      volumenHecho: total(xs.map((x) => x.volumenHecho)),
      seriesSinVolumen: xs.reduce((a, x) => a + x.seriesSinVolumen, 0),
    }));
}

export function programadoYHecho(observaciones: readonly ObservacionDeEvolucion[], unidad: 'kg' | 'lb', grano: GranoDelVolumen, limites?: { readonly desde: string; readonly hasta: string }): ProgramadoYHecho[] {
  const sesiones = observaciones.flatMap((o) => programadoYHechoDeLaSesion(o, unidad) ?? []);
  return grano === 'SEMANA' ? porSemana(sesiones, limites) : sesiones;
}

const enteros = (v: number): string => numero(Math.round(v));
const rangoEnTexto = (r: RangoDelVolumen, unidad: string): string => (r.minimo === r.maximo ? `${enteros(r.minimo)} ${unidad}` : `de ${enteros(r.minimo)} a ${enteros(r.maximo)} ${unidad}`);
const seriesEnTexto = (n: number): string => (n === 1 ? '1 serie' : `${n} series`);

/** Lo hecho respecto de lo indicado, sin calificar: «1 serie menos que lo indicado (5)», «igual a lo indicado (5)». */
export function diferenciaDeSeries(hechas: number, indicadas: number): string {
  if (hechas === indicadas) return `igual a lo indicado (${indicadas})`;
  const d = Math.abs(hechas - indicadas);
  return `${seriesEnTexto(d)} ${hechas > indicadas ? 'más' : 'menos'} que lo indicado (${indicadas})`;
}

export const COPY_PROGRAMADO_Y_HECHO = {
  titulo: (nombre: string) => `Series y carga × repeticiones: lo indicado y lo hecho · ${nombre}`,
  series: 'Series',
  volumen: (unidad: string) => `Carga × repeticiones (${unidad}·rep)`,
  grano: 'Cada punto',
  granos: { SESION: 'Cada sesión', SEMANA: 'Por semana' } satisfies Record<GranoDelVolumen, string>,
  detalle: (grano: GranoDelVolumen, periodo: string) => `${grano === 'SESION' ? 'un punto por sesión' : 'un punto por semana, lunes a domingo'} · lleno lo hecho, hueco lo indicado · ${periodo}`,
  sinIndicar: 'Sin indicar',
  sinDatos: 'Sin sesiones de este ejercicio planificadas y registradas en el período.',
  queEs: 'Lleno, lo hecho; hueco, lo que indicaba la versión del plan que rigió esa sesión. Las series de calentamiento no cuentan.',
  convencion:
    'Carga × repeticiones suma, serie efectiva por serie efectiva, la carga por las repeticiones, con la carga como se registró: con mancuernas, es por mancuerna. Una serie sin carga o sin repeticiones no entra. No equivale a trabajo mecánico ni a gasto energético.',
  rangoDelVolumen: 'Si el plan indica un rango de repeticiones, lo indicado es un rango (un segmento hueco).',
  volumenSinIndicar: 'Donde a una serie le falta la carga sugerida (o se indica respecto del RM, que no se convierte a kg) o las repeticiones, lo indicado queda sin indicar.',
} as const;

/** Los dos carriles del gráfico: las series (hechas llenas, indicadas huecas) y el volumen (hecho lleno, indicado hueco). */
export function carrilesDeProgramadoYHecho(filas: readonly ProgramadoYHecho[], unidad: 'kg' | 'lb'): CarrilDePuntos[] {
  const punto = (f: ProgramadoYHecho, id: string, valor: number | null, lectura: string): PuntoDelCarril => ({
    clave: `${id}:${f.clave}`,
    fecha: f.fecha,
    hasta: f.hasta,
    en: f.en,
    valor,
    rango: null,
    tramo: id,
    marca: MARCA_SEGUN_EL_DATO.REGISTRADO,
    tarde: false,
    lectura,
  });
  const indicadoDe = (f: ProgramadoYHecho, id: string, valor: number | null, rango: RangoDelVolumen | null, lectura: string): PuntoDelCarril[] =>
    valor === null && rango === null
      ? []
      : [
          {
            ...punto(f, `${id}-indicado`, rango && rango.minimo !== rango.maximo ? null : (rango?.minimo ?? valor), lectura),
            rango: rango && rango.minimo !== rango.maximo ? { desde: rango.minimo, hasta: rango.maximo } : null,
            marca: MARCA_SEGUN_EL_DATO.INDICADO,
            sentido: 'INDICADO',
          },
        ];
  const cuantas = (f: ProgramadoYHecho) => (f.sesiones > 1 ? ` · ${f.sesiones} sesiones` : '');
  const series: CarrilDePuntos = {
    tipo: 'PUNTOS',
    id: 'series',
    nombre: COPY_PROGRAMADO_Y_HECHO.series,
    unidad: 'series',
    metodo: null,
    indice: 0,
    puntos: filas.map((f) =>
      punto(
        f,
        'series',
        f.seriesHechas,
        f.seriesHechas === null
          ? `sin dato de lo hecho · indicadas: ${f.seriesIndicadas ?? COPY_PROGRAMADO_Y_HECHO.sinIndicar}${cuantas(f)}`
          : `${seriesEnTexto(f.seriesHechas)} hechas · ${f.seriesIndicadas === null ? `indicadas: ${COPY_PROGRAMADO_Y_HECHO.sinIndicar}` : diferenciaDeSeries(f.seriesHechas, f.seriesIndicadas)}${cuantas(f)}`,
      ),
    ),
    indicado: filas.flatMap((f) => indicadoDe(f, 'series', f.seriesIndicadas, null, f.seriesIndicadas === null ? COPY_PROGRAMADO_Y_HECHO.sinIndicar : `${seriesEnTexto(f.seriesIndicadas)} indicadas`)),
    escalones: [],
    unir: true,
    escala: { enteros: true, desdeCero: true, minimoDelMaximo: 4 },
    cobertura: [],
    descripcion: `Series hechas e indicadas en ${filas.length === 1 ? '1 punto' : `${filas.length} puntos`}.`,
    porSesion: true,
  };
  const u = `${unidad}·rep`;
  const volumen: CarrilDePuntos = {
    tipo: 'PUNTOS',
    id: 'volumen',
    nombre: COPY_PROGRAMADO_Y_HECHO.volumen(unidad),
    unidad: u,
    metodo: null,
    indice: 1,
    puntos: filas.map((f) => {
      const indicado = f.volumenIndicado === null ? `indicado: ${COPY_PROGRAMADO_Y_HECHO.sinIndicar}` : `indicado: ${rangoEnTexto(f.volumenIndicado, u)}`;
      const fuera = f.seriesSinVolumen > 0 ? ` · ${seriesEnTexto(f.seriesSinVolumen)} sin carga o sin repeticiones, no entran` : '';
      return punto(f, 'volumen', f.volumenHecho, `${f.volumenHecho === null ? 'sin dato de lo hecho' : `${enteros(f.volumenHecho)} ${u} hechos`} · ${indicado}${fuera}${cuantas(f)}`);
    }),
    indicado: filas.flatMap((f) => indicadoDe(f, 'volumen', null, f.volumenIndicado, f.volumenIndicado === null ? COPY_PROGRAMADO_Y_HECHO.sinIndicar : `indicado: ${rangoEnTexto(f.volumenIndicado, u)}`)),
    escalones: [],
    unir: true,
    escala: { enteros: true, desdeCero: true },
    cobertura: [],
    descripcion: `Carga × repeticiones, hecha e indicada, en ${filas.length === 1 ? '1 punto' : `${filas.length} puntos`}.`,
    porSesion: true,
  };
  return [series, volumen];
}

// ─── Para «Armá tu gráfico» (GPF-07) ─────────────────────────────────────────────────────────────

export type SerieDelVolumen = 'entrenamiento.series-indicadas' | 'entrenamiento.carga-por-repeticiones-hecha' | 'entrenamiento.carga-por-repeticiones-indicada';
export const SERIES_DEL_VOLUMEN: readonly SerieDelVolumen[] = ['entrenamiento.series-indicadas', 'entrenamiento.carga-por-repeticiones-hecha', 'entrenamiento.carga-por-repeticiones-indicada'];
export const esSerieDelVolumen = (id: string): id is SerieDelVolumen => (SERIES_DEL_VOLUMEN as readonly string[]).includes(id);

/**
 * Una de las tres como serie analítica, sesión por sesión, para el catálogo de los gráficos. Lo que no tiene un número
 * (sin dato, sin indicar, un rango de volumen) no es un punto, y la nota lo dice: un rango no se vuelve un número.
 */
export function serieDelVolumen(observaciones: readonly ObservacionDeEvolucion[], o: { readonly metricId: SerieDelVolumen; readonly nombre: string; readonly unidad: 'kg' | 'lb' }): SerieAnalitica {
  const filas = programadoYHecho(observaciones, o.unidad, 'SESION');
  const puntos: PuntoAnalitico[] = [];
  let conRango = 0;
  for (const f of filas) {
    const r = f.volumenIndicado;
    const valor = o.metricId === 'entrenamiento.series-indicadas' ? f.seriesIndicadas : o.metricId === 'entrenamiento.carga-por-repeticiones-hecha' ? f.volumenHecho : r && r.minimo === r.maximo ? r.minimo : null;
    if (o.metricId === 'entrenamiento.carga-por-repeticiones-indicada' && r && r.minimo !== r.maximo) conRango++;
    if (valor === null) continue;
    puntos.push({
      pointId: `${o.metricId}:${f.clave}`,
      date: f.fecha,
      dateEnd: null,
      at: f.en,
      value: valor,
      quality: 'COMPLETE',
      n: 1,
      segment: o.metricId,
      corrected: false,
      partialBucket: false,
      dataClass: null,
      method: null,
      planVersionIds: f.planId ? [f.planId] : [],
      coverage: null,
      missing: [],
      detail: f.seriesSinVolumen > 0 && o.metricId === 'entrenamiento.carga-por-repeticiones-hecha' ? [{ label: 'No entran', value: seriesEnTexto(f.seriesSinVolumen) + ' sin carga o sin repeticiones' }] : [],
      sources: f.planId ? [{ type: 'TRAINING_PLAN_VERSION', id: f.planId }] : [],
      sourcesTruncated: false,
    });
  }
  return {
    metricId: o.metricId,
    label: o.nombre,
    unit: o.metricId === 'entrenamiento.series-indicadas' ? 'series' : `${o.unidad}·rep`,
    scale: o.metricId === 'entrenamiento.series-indicadas' ? 'COUNT' : 'RATIO',
    grain: 'ORIGINAL',
    aggregation: 'NONE',
    points: puntos,
    gaps: [],
    segments: [{ segment: o.metricId, label: o.nombre, breakReason: null }],
    notes: [
      ...(o.metricId === 'entrenamiento.carga-por-repeticiones-hecha' ? [COPY_PROGRAMADO_Y_HECHO.convencion] : o.metricId === 'entrenamiento.carga-por-repeticiones-indicada' ? [COPY_PROGRAMADO_Y_HECHO.volumenSinIndicar] : []),
      ...(conRango > 0 ? [`${conRango === 1 ? '1 sesión indicaba' : `${conRango} sesiones indicaban`} un rango de repeticiones: lo indicado es un rango y no se dibuja como un número.`] : []),
    ],
  };
}
