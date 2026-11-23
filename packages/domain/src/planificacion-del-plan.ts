/**
 * WP-EDITOR-ENTRENAMIENTO (DEUDA_LEGAJO DL-196) · la planificación de una versión del plan de entrenamiento, sin React,
 * para que la usen la API (la agenda de «Hoy»), el website (el editor y el almanaque) y sus pruebas.
 *
 * - **Las fases se definen por semanas** (EE-D02, decidido por Dirección el 2026-11-23): una detrás de la otra desde el
 *   inicio del plan. Las fechas salen solas; no se guardan.
 * - **El plan tiene inicio y duración** (EE-D01): el fin sale de los dos; escribir el fin cambia la duración.
 * - **Cada sesión va en las semanas de su fase** (`ventanasDeLasSesiones`): con fechas, la agenda deja de repetir todas
 *   las sesiones todas las semanas. Sin fechas (un plan de antes), todo sigue como estaba.
 * - **El almanaque** (EE-04): un mes de lunes a domingo, con cada semana del color de su fase y las sesiones de cada día.
 * - **Las aproximaciones** (EE-07): sus cargas desde la carga de trabajo, redondeadas a un paso sin decimales raros, y sus
 *   repeticiones, que bajan.
 */
import type { AgendaDeEntrenamiento, PasoDeRedondeo, PlanificacionDelPlan } from './contratos-entrenamiento';
import { fechasPrevistas, type FechaPrevista, type VentanasDeLasSesiones } from './agenda-de-entrenamiento';
import { diaSiguiente, diasEntreFechas } from './fechas-civiles';

const DIA = 86_400_000;

/** Una fecha civil más (o menos) tantos días. Es aritmética de calendario: no depende de la zona horaria. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1) + dias * DIA).toISOString().slice(0, 10);
}

/** El último día de un plan que empieza en `inicio` y dura `semanas`: el día anterior al mismo día de la semana. */
export const finDelPlan = (inicio: string, semanas: number): string => sumarDias(inicio, semanas * 7 - 1);

/** Cuántas semanas hay de `inicio` a `fin`, los dos incluidos, contando la última aunque esté incompleta; `null` si el fin es anterior. */
export function semanasHasta(inicio: string, fin: string): number | null {
  if (fin < inicio) return null;
  return Math.ceil((diasEntreFechas(inicio, fin) + 1) / 7);
}

/** Una planificación vacía: sin fechas, sin semanas, sin objetivo ni anotaciones. */
export const PLANIFICACION_VACIA: PlanificacionDelPlan = { startDate: null, weeks: null, goal: null, phases: [] };

/** El bloque (la fase) como lo mira la planificación: su identificador y, para las ventanas, sus sesiones. */
export interface FaseParaPlanificar {
  readonly blockId?: string | null;
  readonly sessions?: readonly { readonly sessionId?: string | null }[] | null;
  readonly microcycles?: readonly { readonly sessions?: readonly { readonly sessionId?: string | null }[] | null }[] | null;
}

/** Las semanas de una fase, o `null` si no las tiene escritas. */
export const semanasDeLaFase = (planificacion: PlanificacionDelPlan | null | undefined, blockId: string | null | undefined): number | null =>
  (blockId ? planificacion?.phases.find((f) => f.blockId === blockId)?.weeks : null) ?? null;

/** Cuántas semanas suman las fases que las tienen escritas. */
export const semanasQueSumanLasFases = (planificacion: PlanificacionDelPlan | null | undefined, fases: readonly FaseParaPlanificar[]): number =>
  fases.reduce((suma, f) => suma + (semanasDeLaFase(planificacion, f.blockId) ?? 0), 0);

/** Una fase en el calendario: su posición, desde y hasta qué fecha va y cuántas semanas son. */
export interface FaseEnElCalendario {
  readonly posicion: number;
  readonly blockId: string;
  readonly desde: string;
  readonly hasta: string;
  readonly semanas: number;
}

/**
 * Las fechas de cada fase, en el orden de las fases: la primera empieza con el plan y cada una sigue a la anterior. Sin
 * inicio del plan, ninguna tiene fechas. Una fase sin semanas no tiene fechas, y las que siguen tampoco: no se sabe
 * cuándo empiezan (EE-D02).
 */
export function fechasDeLasFases(planificacion: PlanificacionDelPlan | null | undefined, fases: readonly FaseParaPlanificar[]): (FaseEnElCalendario | null)[] {
  const inicio = planificacion?.startDate ?? null;
  let desde = inicio;
  return fases.map((f, posicion) => {
    const semanas = semanasDeLaFase(planificacion, f.blockId);
    if (desde === null || semanas === null || !f.blockId) {
      desde = null;
      return null;
    }
    const fase: FaseEnElCalendario = { posicion, blockId: f.blockId, desde, hasta: finDelPlan(desde, semanas), semanas };
    desde = sumarDias(fase.hasta, 1);
    return fase;
  });
}

/** Los identificadores de las sesiones de una fase, con las de sus microciclos. */
const sesionesDeLaFase = (f: FaseParaPlanificar): string[] =>
  [...(f.sessions ?? []), ...(f.microcycles ?? []).flatMap((m) => m.sessions ?? [])].map((s) => s.sessionId ?? '').filter((id) => id !== '');

/** DL-196: las semanas en que va cada sesión, las de su fase. Solo las sesiones de fases con fechas tienen ventana. */
export function ventanasDeLasSesiones(planificacion: PlanificacionDelPlan | null | undefined, fases: readonly FaseParaPlanificar[]): VentanasDeLasSesiones {
  const ventanas = new Map<string, { readonly desde: string; readonly hasta: string }>();
  fechasDeLasFases(planificacion, fases).forEach((fase, n) => {
    if (fase) for (const id of sesionesDeLaFase(fases[n]!)) ventanas.set(id, { desde: fase.desde, hasta: fase.hasta });
  });
  return ventanas;
}

/**
 * La planificación que queda después de cambiar la estructura: sin las fases ni las anotaciones de bloques que ya no
 * están, ni las aproximaciones de ejercicios que ya no están. Si no queda nada que decir, `null`.
 */
export function planificacionPodada(
  planificacion: PlanificacionDelPlan | null | undefined,
  bloques: readonly string[],
  prescripciones: readonly string[],
): PlanificacionDelPlan | null {
  if (!planificacion) return null;
  const hayBloque = new Set(bloques);
  const hayPrescripcion = new Set(prescripciones);
  const phases = planificacion.phases.filter((f) => hayBloque.has(f.blockId));
  const warmUps = (planificacion.warmUps ?? []).filter((w) => hayPrescripcion.has(w.prescriptionId));
  const notas = planificacion.privateNotes;
  const notasDeFases = (notas?.phases ?? []).filter((n) => hayBloque.has(n.blockId));
  const podada: PlanificacionDelPlan = {
    startDate: planificacion.startDate,
    weeks: planificacion.weeks,
    goal: planificacion.goal?.trim() ? planificacion.goal : null,
    phases,
    ...(warmUps.length > 0 ? { warmUps } : {}),
    ...(notas && (notas.plan?.trim() || notasDeFases.length > 0) ? { privateNotes: { plan: notas.plan?.trim() ? notas.plan : null, phases: notasDeFases } } : {}),
  };
  const vacia = podada.startDate === null && podada.weeks === null && !podada.goal && phases.length === 0 && warmUps.length === 0 && !podada.privateNotes;
  return vacia ? null : podada;
}

/** EE-D05: la planificación sin las anotaciones privadas, para lo que no es del profesional que las escribió. */
export function sinLasAnotaciones(planificacion: PlanificacionDelPlan | null | undefined): PlanificacionDelPlan | null {
  if (!planificacion) return null;
  const { privateNotes: _privadas, ...resto } = planificacion;
  return resto;
}

// ─── El almanaque (EE-04) ─────────────────────────────────────────────────────────────────────

/** Un mes, como `2026-11`. */
export type MesDelAlmanaque = string;

export const mesDe = (fecha: string): MesDelAlmanaque => fecha.slice(0, 7);

/** El mes siguiente (`+1`) o el anterior (`-1`). */
export function otroMes(mes: MesDelAlmanaque, cuantos: number): MesDelAlmanaque {
  const [a, m] = mes.split('-').map(Number);
  const total = (a ?? 1970) * 12 + ((m ?? 1) - 1) + cuantos;
  return `${String(Math.floor(total / 12)).padStart(4, '0')}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export interface DiaDelAlmanaque {
  readonly fecha: string;
  /** Si es del mes que se mira (los de los bordes completan la semana y se leen más tenues). */
  readonly delMes: boolean;
  /** La posición de la fase que cubre ese día, o `null` si ninguna (antes o después del plan, o una fase sin fechas). */
  readonly fase: number | null;
  /** Las sesiones previstas ese día, en el orden de la agenda. */
  readonly sesiones: readonly string[];
  readonly hoy: boolean;
}

export interface SemanaDelAlmanaque {
  readonly dias: readonly DiaDelAlmanaque[];
  /**
   * La fase de la semana, que pinta el renglón entero: la que cubre más días de esa semana (en un empate, la primera).
   * Si el plan empieza un lunes, cada semana es de una sola fase.
   */
  readonly fase: number | null;
}

/**
 * Un mes del almanaque, de lunes a domingo: desde el lunes de la semana del día 1 hasta el domingo de la semana del último
 * día. Cada día dice su fase y sus sesiones previstas (con las ventanas de las fases y los movimientos de la agenda).
 */
export function mesDelAlmanaque(
  mes: MesDelAlmanaque,
  fases: readonly (FaseEnElCalendario | null)[],
  agenda: AgendaDeEntrenamiento | null,
  ventanas: VentanasDeLasSesiones,
  hoy: string,
): SemanaDelAlmanaque[] {
  const primero = `${mes}-01`;
  const ultimo = sumarDias(`${otroMes(mes, 1)}-01`, -1);
  // El lunes de la semana del 1 (el domingo es 0 en `getUTCDay`).
  const desde = sumarDias(primero, -((new Date(`${primero}T12:00:00Z`).getUTCDay() + 6) % 7));
  const hasta = sumarDias(ultimo, (7 - new Date(`${ultimo}T12:00:00Z`).getUTCDay()) % 7);
  const previstas: readonly FechaPrevista[] = agenda ? fechasPrevistas(agenda, desde, hasta, ventanas) : [];
  const conFechas = fases.filter((f): f is FaseEnElCalendario => f !== null);
  const faseDe = (fecha: string): number | null => conFechas.find((f) => fecha >= f.desde && fecha <= f.hasta)?.posicion ?? null;
  const semanas: SemanaDelAlmanaque[] = [];
  for (let lunes = desde; lunes <= hasta; lunes = sumarDias(lunes, 7)) {
    const dias: DiaDelAlmanaque[] = [];
    for (let d = 0, fecha = lunes; d < 7; d += 1, fecha = diaSiguiente(fecha)) {
      dias.push({ fecha, delMes: fecha.startsWith(mes), fase: faseDe(fecha), sesiones: previstas.filter((p) => p.date === fecha).map((p) => p.sessionId), hoy: fecha === hoy });
    }
    semanas.push({ dias, fase: faseQueMasCubre(dias) });
  }
  return semanas;
}

function faseQueMasCubre(dias: readonly DiaDelAlmanaque[]): number | null {
  const cuenta = new Map<number, number>();
  for (const d of dias) if (d.fase !== null) cuenta.set(d.fase, (cuenta.get(d.fase) ?? 0) + 1);
  let mejor: number | null = null;
  for (const [fase, n] of cuenta) if (mejor === null || n > cuenta.get(mejor)! || (n === cuenta.get(mejor)! && fase < mejor)) mejor = fase;
  return mejor;
}

/** El mes en que conviene abrir el almanaque: el de hoy si cae dentro del plan; si no, el del inicio; sin inicio, el de hoy. */
export function mesParaAbrir(planificacion: PlanificacionDelPlan | null | undefined, hoy: string): MesDelAlmanaque {
  const inicio = planificacion?.startDate ?? null;
  if (!inicio) return mesDe(hoy);
  const fin = planificacion?.weeks ? finDelPlan(inicio, planificacion.weeks) : null;
  return hoy >= inicio && (fin === null || hoy <= fin) ? mesDe(hoy) : mesDe(inicio);
}

// ─── Las aproximaciones (EE-07) ───────────────────────────────────────────────────────────────

/** Cuántas aproximaciones se ofrecen, como mucho. */
export const MAXIMO_DE_APROXIMACIONES = 6;

/** Los porcentajes de la carga de trabajo que se proponen, según cuántas aproximaciones son. */
export const PORCENTAJES_DE_APROXIMACION: Readonly<Record<number, readonly number[]>> = {
  1: [60],
  2: [50, 75],
  3: [40, 60, 80],
  4: [40, 55, 70, 85],
  5: [35, 50, 65, 75, 85],
  6: [30, 45, 55, 65, 75, 85],
};

/** Las repeticiones de cada aproximación, que bajan a medida que la carga sube (con tres: 8, 5 y 3). */
export const REPETICIONES_DE_APROXIMACION: Readonly<Record<number, readonly number[]>> = {
  1: [5],
  2: [6, 3],
  3: [8, 5, 3],
  4: [8, 5, 3, 2],
  5: [10, 8, 5, 3, 2],
  6: [10, 8, 6, 4, 3, 2],
};

/** Con qué se hace el ejercicio, para el paso del redondeo. La v1 del catálogo no lo dice: se deduce del nombre. */
export type Implemento = 'MAQUINA' | 'BARRA' | 'MANCUERNA' | 'OTRO';

const sinTildes = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** EE-D03: el implemento, deducido del nombre del ejercicio y de cómo se cuenta la carga («por mancuerna»). */
export function implementoDelEjercicio(nombre: string, baseDeCarga?: string | null): Implemento {
  const n = sinTildes(nombre);
  if (/maquina|polea|prensa|smith|cable|jalon|hack|extension de piernas|curl femoral/.test(n)) return 'MAQUINA';
  if (/mancuerna|kettlebell|pesa rusa/.test(n) || baseDeCarga === 'PER_IMPLEMENT') return 'MANCUERNA';
  if (/barra|disco|sentadilla|peso muerto|press de banca|press banca|press militar|hip thrust|remo con barra/.test(n)) return 'BARRA';
  return 'OTRO';
}

/**
 * EE-D03: el paso del redondeo por omisión. En kg: máquina de placas, 5; barra o discos, 2,5; mancuernas de hasta unos
 * 10 kg, 1 (las más pesadas, 2,5). En libras: máquina, 10; mancuernas de hasta 25 lb, 2,5; lo demás, 5.
 */
export function pasoPorOmision(implemento: Implemento, cargaDeTrabajo: number | null, unidad: 'kg' | 'lb' = 'kg'): PasoDeRedondeo {
  if (unidad === 'lb') return implemento === 'MAQUINA' ? 10 : implemento === 'MANCUERNA' && (cargaDeTrabajo ?? 0) <= 25 ? 2.5 : 5;
  if (implemento === 'MAQUINA') return 5;
  if (implemento === 'MANCUERNA' && (cargaDeTrabajo ?? 0) <= 10) return 1;
  return 2.5;
}

/** Redondea al múltiplo más cercano del paso, sin restos de coma flotante (62,5 y no 62,50000001). */
export function redondearAlPaso(valor: number, paso: number): number {
  const n = Math.round(valor / paso) * paso;
  return Math.round(n * 100) / 100;
}

/**
 * Las cargas de las aproximaciones: cada porcentaje de la carga de trabajo, redondeado al paso. Ninguna llega a la carga
 * de trabajo ni baja de un paso, y no bajan de una a la siguiente: con cargas chicas, dos pueden quedar iguales.
 */
export function cargasDeAproximacion(cargaDeTrabajo: number, porcentajes: readonly number[], paso: number): number[] {
  const tope = redondearAlPaso(cargaDeTrabajo - paso, paso);
  let anterior = 0;
  return porcentajes.map((p) => {
    let c = redondearAlPaso((cargaDeTrabajo * p) / 100, paso);
    if (c >= cargaDeTrabajo) c = tope;
    if (c < paso) c = paso;
    if (c < anterior) c = anterior;
    anterior = c;
    return Math.max(0, c);
  });
}

/** Una serie de aproximación como entra al plan: de calentamiento, con sus repeticiones y su carga. */
export interface SerieDeAproximacion {
  readonly setKind: 'WARM_UP';
  readonly repetitions: { readonly value: number };
  readonly suggestedLoad: { readonly value: number; readonly unit: 'kg' | 'lb' };
}

/** Las aproximaciones «Por %», listas para ir arriba de las series efectivas. */
export function seriesDeAproximacion(cargaDeTrabajo: number, porcentajes: readonly number[], paso: number, unidad: 'kg' | 'lb'): SerieDeAproximacion[] {
  const cargas = cargasDeAproximacion(cargaDeTrabajo, porcentajes, paso);
  const repeticiones = REPETICIONES_DE_APROXIMACION[porcentajes.length] ?? [];
  return cargas.map((c, n) => ({ setKind: 'WARM_UP', repetitions: { value: repeticiones[n] ?? 3 }, suggestedLoad: { value: c, unit: unidad } }));
}

/** Los porcentajes que se proponen para esa cantidad (entre 1 y 6). */
export const porcentajesPara = (cuantas: number): readonly number[] => PORCENTAJES_DE_APROXIMACION[Math.min(MAXIMO_DE_APROXIMACIONES, Math.max(1, Math.round(cuantas)))] ?? [];
