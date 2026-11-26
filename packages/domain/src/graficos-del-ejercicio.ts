/**
 * DL-204 (WP-GRAFICOS-DEL-EJERCICIO) · las cuentas de los gráficos de un ejercicio en el panel del editor de Entrenamiento:
 *
 * - **«La carga por semana» con su historia:** hacia atrás, las semanas antes del inicio de la fase (hasta
 *   `SEMANAS_HACIA_ATRAS`), con lo planificado antes (lo que indicaba el plan ese día, de la instantánea de cada sesión
 *   registrada: la versión o el plan que regía, con la carga de esa semana) y lo realizado (lo más alto registrado de cada
 *   semana, el mismo criterio que el gráfico de la fase). Después, las semanas de la fase con la regla aplicada.
 * - **«Serie por serie»:** las series de una semana en orden (A1, A2… las aproximaciones; S1, S2… las efectivas), con la
 *   carga planificada de esa semana, la realizada si hay registro y la parte del 1RM de referencia, siempre con su base.
 * - **La regla que rige, en palabras:** «Lineal · +2,5 kg/sem · descarga S4», con su origen (la propia o la de la fase).
 *
 * Ubica, no califica: no compara lo realizado con lo planificado, no dice cuánto se logró y lo que no hay queda sin dato.
 * Sin React, sin red: lo usa el website y tiene sus pruebas acá.
 */
import type { EjecucionDeEntrenamiento, ProgresionDeLaFase } from './contratos-entrenamiento';
import { diasEntreFechas } from './fechas-civiles';
import { numero } from './formato-numeros';
import { objetivosEfectivos, type PrescripcionParaResolver } from './objetivos-por-serie';
import { COPY_PROGRESIONES, semanaDeLaFecha, type OrigenDeLaProgresion } from './progresiones';
import type { VezPasada } from './la-vez-pasada';

type Unidad = 'kg' | 'lb';

/** Cuántas semanas hacia atrás mira «La carga por semana» antes del inicio de la fase (GE-D03). */
export const SEMANAS_HACIA_ATRAS = 12;

export const COPY_GRAFICOS_DEL_EJERCICIO = {
  planificadoAntes: 'Planificado antes',
  realizado: 'Realizado',
  estePlan: 'Este plan',
  inicioDelPlan: 'Inicio del plan',
  inicioDeLaFase: 'Inicio de la fase',
  sinRegistros: 'Sin registros todavía',
  leyendo: 'Leyendo los registros…',
  cambiarProgresion: 'Cambiar progresión…',
  laDeLaFase: 'la de la fase',
  propia: 'propia',
  rigeLaRegla: 'Progresión',
  seriePorSerie: (nombre: string) => `${nombre}: serie por serie`,
  semana: 'Semana',
  aproximacion: 'Aproximación',
  efectiva: 'Efectiva',
  planificada: 'Planificada',
  sinCargas: 'Este ejercicio no tiene cargas escritas en sus series: no hay nada que dibujar todavía.',
  formasDeLasSeries: 'Cada barra es la carga planificada de una serie, en su orden; las aproximaciones van en un tono más suave. Lo realizado va en un punto lleno sobre su serie.',
  formasDeLaHistoria:
    'Antes de la línea «Inicio», lo planificado antes es lo que indicaba el plan ese día (punteado y tenue) y lo realizado, lo más alto registrado de cada semana (puntos llenos). Después, este plan con su progresión.',
  ejemploDeLasSeries: 'Ejemplo: con el foco en el gráfico, → dos veces lleva a la serie S1 y abajo se lee «S1: Planificada 60 kg · 59 % del 1RM».',
  /** «1RM 101,5 kg». */
  unoRM: (valor: number, unidad: Unidad) => `1RM ${numero(valor, 2)} ${unidad}`,
  /** «25 % del 1RM»: el porcentaje siempre con su base. */
  delUnoRM: (porcentaje: number) => `${numero(porcentaje)} % del 1RM`,
  /** «3 semanas antes» / «1 semana antes». */
  semanasAntes: (n: number) => (n === 1 ? '1 semana antes' : `${n} semanas antes`),
  realizadoEl: (fecha: string) => `Realizado (${fecha})`,
} as const;

// ─── La regla en palabras ─────────────────────────────────────────────────────────────────────

/**
 * La regla que rige al ejercicio para la cabecera del gráfico: «Lineal · +2,5 kg/sem · descarga S4», «Doble progresión ·
 * 8-12 reps, +2,5 kg», «Ondulante · 90, 100, 105 %», «Descarga S4» o «Sin progresión». El origen va aparte (`origenEnPalabras`).
 */
export function reglaEnPalabras(regla: ProgresionDeLaFase | null, unidad: Unidad): string {
  if (!regla) return COPY_PROGRESIONES.sinModelo;
  const partes: string[] = [];
  if (regla.model === 'LINEAR') {
    const pasos = [regla.loadStep ? `+${numero(regla.loadStep, 2)} ${unidad}/sem` : null, regla.repStep ? `+${regla.repStep} rep/sem` : null].filter((x): x is string => !!x);
    partes.push(COPY_PROGRESIONES.modelos.LINEAR, ...pasos);
  } else if (regla.model === 'DOUBLE' && regla.repRange) {
    partes.push(COPY_PROGRESIONES.modelos.DOUBLE, `${regla.repRange.min}-${regla.repRange.max} reps, +${numero(regla.loadStep ?? 0, 2)} ${unidad}`);
  } else if (regla.model === 'UNDULATING') {
    partes.push(COPY_PROGRESIONES.modelos.UNDULATING, ...(regla.waves ? [`${regla.waves.join(', ')} % de la carga de trabajo`] : []));
  }
  if (regla.deload) partes.push(partes.length > 0 ? `descarga S${regla.deload.week}` : `Descarga S${regla.deload.week}`);
  return partes.join(' · ') || COPY_PROGRESIONES.sinModelo;
}

/** «la de la fase», «propia» o nada (sin regla). */
export function origenEnPalabras(origen: OrigenDeLaProgresion): string | null {
  if (origen === 'FASE') return COPY_GRAFICOS_DEL_EJERCICIO.laDeLaFase;
  if (origen === 'PROPIA') return COPY_GRAFICOS_DEL_EJERCICIO.propia;
  return null;
}

// ─── Lo de antes de la fase ───────────────────────────────────────────────────────────────────

/** Un valor con su fecha civil. */
export interface PuntoConFecha {
  readonly fecha: string;
  readonly valor: number;
}

/**
 * Lo que indicaba el plan cada día que la persona registró una sesión con ese ejercicio: la carga de trabajo de la
 * prescripción en la instantánea de esa sesión (la API ya la entrega con la carga de esa semana, DL-198). Es lo que regía
 * ese día, del plan o la versión que fuera. Sin carga indicada, o en otra unidad, no hay punto (no se inventa).
 */
export function cargasPlanificadasDelEjercicio(ejecuciones: readonly EjecucionDeEntrenamiento[], exerciseId: string, unidad: Unidad): PuntoConFecha[] {
  const id = exerciseId.toLowerCase();
  return ejecuciones.flatMap((x) => {
    const cargas = x.plannedSession.prescriptions.flatMap((p) => (p.exerciseId.toLowerCase() === id && p.suggestedLoad && p.suggestedLoad.unit === unidad && p.suggestedLoad.value > 0 ? [p.suggestedLoad.value] : []));
    return cargas.length > 0 ? [{ fecha: x.date, valor: Math.max(...cargas) }] : [];
  });
}

/** Lo más alto registrado de cada vez, en la unidad pedida (el criterio del gráfico de la fase y de Fuerza). */
export function cargasRealizadas(veces: readonly VezPasada[], unidad: Unidad): PuntoConFecha[] {
  return veces.flatMap((v) => {
    if (v.como.tipo !== 'series') return [];
    const cargas = v.como.series.flatMap((s) => (s.carga && s.carga.unit === unidad && s.carga.value > 0 ? [s.carga.value] : []));
    return cargas.length > 0 ? [{ fecha: v.fecha, valor: Math.max(...cargas) }] : [];
  });
}

/** Cuántas semanas antes del inicio cae una fecha (1: la semana justo antes), o `null` si no es de antes o pasa del tope. */
export function semanaAntesDelInicio(desde: string, fecha: string, tope = SEMANAS_HACIA_ATRAS): number | null {
  if (fecha >= desde) return null;
  const k = Math.floor((diasEntreFechas(fecha, desde) - 1) / 7) + 1;
  return k >= 1 && k <= tope ? k : null;
}

/** La historia hacia atrás, con una columna por semana: la más vieja primero y la de justo antes del inicio, última. */
export interface HistoriaAntesDelInicio {
  /** Cuántas semanas se muestran antes del inicio: desde la más vieja con algún dato; 0 si no hay ninguno. */
  readonly semanas: number;
  readonly planificadoAntes: readonly (number | null)[];
  readonly realizado: readonly (number | null)[];
}

/**
 * Las semanas antes del inicio de la fase que tienen algo para mostrar, hasta el tope. Un ejercicio nuevo, sin historia,
 * no suma ninguna (el gráfico queda como el de la fase sola).
 */
export function historiaAntesDelInicio(desde: string, planificados: readonly PuntoConFecha[], realizados: readonly PuntoConFecha[], tope = SEMANAS_HACIA_ATRAS): HistoriaAntesDelInicio {
  const porSemana = (puntos: readonly PuntoConFecha[]) => {
    const r = new Map<number, number>();
    for (const p of puntos) {
      const k = semanaAntesDelInicio(desde, p.fecha, tope);
      if (k !== null) r.set(k, Math.max(r.get(k) ?? Number.NEGATIVE_INFINITY, p.valor));
    }
    return r;
  };
  const plan = porSemana(planificados);
  const hecho = porSemana(realizados);
  const semanas = Math.max(0, ...plan.keys(), ...hecho.keys());
  // La columna 0 es la más vieja (`semanas` antes); la última, la semana justo antes del inicio.
  const columna = (m: Map<number, number>) => Array.from({ length: semanas }, (_, c) => m.get(semanas - c) ?? null);
  return { semanas, planificadoAntes: columna(plan), realizado: columna(hecho) };
}

// ─── Serie por serie ──────────────────────────────────────────────────────────────────────────

/** Una serie de la semana elegida: su rótulo, si es aproximación, la carga planificada y la realizada, si hay. */
export interface BarraDeLaSerie {
  /** El número de la serie en la prescripción (1 es la primera, aproximaciones incluidas): el `setIndex` del registro. */
  readonly setIndex: number;
  /** «A1», «A2»… las aproximaciones; «S1», «S2»… las efectivas. */
  readonly rotulo: string;
  readonly aproximacion: boolean;
  readonly planificada: number | null;
  readonly realizada: number | null;
  /** La planificada como parte del 1RM de referencia, redondeada al entero; `null` sin 1RM o sin carga. */
  readonly delUnoRM: number | null;
}

/** Lo mínimo de una prescripción para dibujar sus series: sus series con su tipo y su carga (DL-122 hereda la común). */
export type PrescripcionParaLasSeries = Omit<PrescripcionParaResolver, 'sets'> & { readonly sets: readonly (PrescripcionParaResolver['sets'][number] & { readonly setKind?: 'WORKING' | 'WARM_UP' | null })[] };

/**
 * Las series de la prescripción (ya llevada a la semana elegida, `prescripcionDeLaSemana`), en orden, con su carga
 * efectiva (la propia de la serie o la común) y, si se pasa, lo realizado de una vez de esa semana (por `setIndex`). Una
 * serie realizada de más, que no está en el plan, se suma al final como efectiva, sin carga planificada.
 */
export function seriesParaElGrafico(p: PrescripcionParaLasSeries, unidad: Unidad, unoRM: number | null, realizadas: readonly { readonly numero: number; readonly carga: { readonly value: number; readonly unit: Unidad } | null }[] = []): BarraDeLaSerie[] {
  const efectivos = objetivosEfectivos(p);
  const hecho = new Map(realizadas.flatMap((s) => (s.carga && s.carga.unit === unidad && s.carga.value > 0 ? [[s.numero, s.carga.value] as const] : [])));
  let a = 0;
  let e = 0;
  const pct = (v: number | null) => (v !== null && unoRM !== null && unoRM > 0 ? Math.round((v / unoRM) * 100) : null);
  const barras: BarraDeLaSerie[] = p.sets.map((s, i) => {
    const aproximacion = s.setKind === 'WARM_UP';
    const rotulo = aproximacion ? `A${(a += 1)}` : `S${(e += 1)}`;
    const carga = efectivos[i]?.suggestedLoad;
    const planificada = carga && carga.unit === unidad && carga.value > 0 ? carga.value : null;
    return { setIndex: i + 1, rotulo, aproximacion, planificada, realizada: hecho.get(i + 1) ?? null, delUnoRM: pct(planificada) };
  });
  for (const [n, v] of [...hecho].filter(([n]) => n > p.sets.length).sort((x, y) => x[0] - y[0])) {
    barras.push({ setIndex: n, rotulo: `S${(e += 1)}`, aproximacion: false, planificada: null, realizada: v, delUnoRM: null });
  }
  return barras;
}

/** La vez de esa semana de la fase que se superpone: la más reciente con series de este ejercicio. */
export function vezDeLaSemana(veces: readonly VezPasada[], fase: { readonly desde: string; readonly hasta: string }, semana: number): VezPasada | null {
  return (
    [...veces]
      .filter((v) => v.comparable && v.como.tipo === 'series' && semanaDeLaFecha(fase, v.fecha) === semana)
      .sort((x, y) => (x.fecha < y.fecha ? 1 : x.fecha > y.fecha ? -1 : 0))[0] ?? null
  );
}

/** La lectura de una serie: «S1: Planificada 25 kg · 25 % del 1RM · Realizado 25 kg». Lo que falta, «—». */
export function lecturaDeLaSerie(b: BarraDeLaSerie, unidad: Unidad, conRealizado: boolean): string {
  const C = COPY_GRAFICOS_DEL_EJERCICIO;
  const plan = b.planificada === null ? '—' : `${numero(b.planificada, 2)} ${unidad}${b.delUnoRM !== null ? ` · ${C.delUnoRM(b.delUnoRM)}` : ''}`;
  const hecho = conRealizado ? ` · ${C.realizado} ${b.realizada === null ? '—' : `${numero(b.realizada, 2)} ${unidad}`}` : '';
  return `${b.rotulo}${b.aproximacion ? ` (${C.aproximacion.toLowerCase()})` : ''}: ${C.planificada} ${plan}${hecho}`;
}

/** El tooltip de la barra: «25 kg · 25 % del 1RM» (sin 1RM, solo la carga). */
export function textoDeLaBarra(b: BarraDeLaSerie, unidad: Unidad): string {
  if (b.planificada === null) return '—';
  return `${numero(b.planificada, 2)} ${unidad}${b.delUnoRM !== null ? ` · ${COPY_GRAFICOS_DEL_EJERCICIO.delUnoRM(b.delUnoRM)}` : ''}`;
}
