/**
 * Entrenamiento · Plan (WP-ESCRITORIO-AREAS, parte 6; maqueta 24): cómo se lee una versión activada del plan de
 * entrenamiento en el escritorio del profesional. Son reglas de presentación, calculadas acá y con sus pruebas: la
 * pantalla no decide ninguna. Las usan la sección «Plan» de Entrenamiento y la planificación de una etapa en la ficha.
 * (Las reglas del plan mismo —qué se guarda, qué se valida, qué se activa— están en `plan-de-entrenamiento.ts`.)
 *
 * - **Se mira una sesión por vez:** la del bloque elegido y, si ese bloque los usa, del microciclo elegido. Lo que se
 *   elige vive en la dirección de la página, por su número de orden (`versiones-de-plan.ts`).
 * - **Un ejercicio plegado dice lo que pide en un renglón.** Si todas sus series piden lo mismo, «4 × 8–10 rep. · 47,5 kg
 *   · RIR 2 · descanso 02:00». Lo que cambia de una serie a otra no se resume con la primera ni con un rango: se dice
 *   «carga y RIR por serie».
 * - **Cada serie muestra el objetivo que recibe el teléfono,** el que resolvió la API (DL-122). `null` es «Sin objetivo»,
 *   nunca un cero.
 * - **Sin criterio de intensidad, se dice:** es legítimo, y el profesional tiene que verlo.
 */
import type { PlanConObjetivos, PrescripcionConObjetivos, SesionConObjetivos } from './contratos-entrenamiento-por-serie';
import { COPY_ENTRENAMIENTO, ETIQUETA_DE_CRITERIO, cantidadDeSeries } from './copy-entrenamiento';
import { ETIQUETA_DE_BASE_DE_CARGA, ETIQUETA_DE_BASE_DE_REPETICIONES, textoDeCarga, textoDeRepeticiones, textoDeRir, textoDeSegundos } from './copy-entrenamiento-por-serie';
import { numero } from './formato-numeros';
import { intensidadPlanificada } from './presentacion-de-prescripcion';
import { COPY_DE_VERSIONES, elegidoPorOrden } from './versiones-de-plan';

type Bloque = PlanConObjetivos['blocks'][number];
type Microciclo = Bloque['microcycles'][number];

// ─── Qué se mira ────────────────────────────────────────────────────────────────────────────────

/** Lo que pide la dirección de la página, por número de orden; `null`: lo primero. */
export interface PedidoDelPlanDeEntrenamiento {
  readonly bloque: string | null;
  readonly microciclo: string | null;
  readonly sesion: string | null;
}

/** Lo que se mira de una versión: un bloque, un microciclo si el bloque los usa, sus sesiones y una de ellas. */
export interface LoQueSeMiraDelPlan {
  readonly bloque: Bloque | null;
  /** `null` si el bloque organiza sus sesiones sin microciclos. */
  readonly microciclo: Microciclo | null;
  /** Las sesiones entre las que se elige: las del microciclo, o las del bloque. En su orden. */
  readonly sesiones: readonly SesionConObjetivos[];
  readonly sesion: SesionConObjetivos | null;
}

/**
 * El bloque, el microciclo y la sesión que se muestran. Un bloque organiza sus sesiones bajo microciclos o
 * directamente, nunca las dos cosas (09v10:281-283): si tiene microciclos, las sesiones son las del elegido.
 */
export function loQueSeMiraDelPlan(bloques: readonly Bloque[], pedido: PedidoDelPlanDeEntrenamiento): LoQueSeMiraDelPlan {
  const bloque = elegidoPorOrden(bloques, pedido.bloque);
  const microciclo = bloque && bloque.microcycles.length > 0 ? elegidoPorOrden(bloque.microcycles, pedido.microciclo) : null;
  const sesiones = [...(microciclo ? microciclo.sessions : (bloque?.sessions ?? []))].sort((a, b) => a.order - b.order);
  return { bloque, microciclo, sesiones, sesion: elegidoPorOrden(sesiones, pedido.sesion) };
}

/** Cuántas sesiones tiene un bloque, contando las de sus microciclos: «2 sesiones». Sin ninguna, lo dice: no un cero. */
export function sesionesDelBloque(bloque: { readonly sessions?: readonly unknown[]; readonly microcycles?: readonly { readonly sessions: readonly unknown[] }[] }): string {
  const cuantas = (bloque.sessions ?? []).length + (bloque.microcycles ?? []).reduce((n, m) => n + m.sessions.length, 0);
  if (cuantas === 0) return 'sin sesiones';
  return cuantas === 1 ? '1 sesión' : `${numero(cuantas)} sesiones`;
}

/** «3 ejercicios · 12 series»: lo que tiene una sesión. Una cuenta de lo indicado, no de lo hecho. */
export function cuentaDeLaSesion(sesion: { readonly prescriptions: readonly { readonly sets: readonly unknown[] }[] }): string {
  const ejercicios = sesion.prescriptions.length;
  const series = sesion.prescriptions.reduce((n, p) => n + p.sets.length, 0);
  return `${ejercicios === 1 ? '1 ejercicio' : `${numero(ejercicios)} ejercicios`} · ${cantidadDeSeries(series)}`;
}

// ─── Un ejercicio ───────────────────────────────────────────────────────────────────────────────

const SIN_CRITERIO = COPY_ENTRENAMIENTO.sinCriterio.toLowerCase();
const enumerar = (nombres: readonly string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`);
const todasIguales = (valores: readonly (string | null)[]): boolean => valores.every((v) => v === valores[0]);

/** La cabecera de un ejercicio abierto: «4 series · criterio de intensidad: RIR». Sin criterio, lo dice. */
export function encabezadoDelEjercicio(p: Pick<PrescripcionConObjetivos, 'sets' | 'intensity'>): string {
  return `${cantidadDeSeries(p.sets.length)} · ${p.intensity ? `criterio de intensidad: ${ETIQUETA_DE_CRITERIO[p.intensity.criterion]}` : SIN_CRITERIO}`;
}

/**
 * El renglón de un ejercicio plegado: lo que piden sus series, con el objetivo que recibe el teléfono.
 * - Todas iguales: «4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00».
 * - Si algo cambia de una serie a otra, eso no se resume: «4 series · 6–8 rep. · carga y RIR por serie · descanso 02:30».
 *   Nunca la primera serie por todas, ni un rango de RIR.
 * - Sin criterio de intensidad, lo dice. Con % RM, la intensidad es la general: no hay un % RM por serie.
 */
export function renglonDelEjercicio(p: Pick<PrescripcionConObjetivos, 'sets' | 'intensity'>): string {
  const cuantas = p.sets.length;
  if (cuantas === 0) return COPY_DEL_PLAN_DE_ENTRENAMIENTO.sinSeries;
  const repeticiones = p.sets.map((s) => textoDeRepeticiones(s.target.repetitions));
  const cargas = p.sets.map((s) => textoDeCarga(s.target.suggestedLoad));
  const rires = p.sets.map((s) => textoDeRir(s.target.rir));
  const descansos = p.sets.map((s) => textoDeSegundos(s.target.restSeconds));
  const conRir = p.intensity?.criterion === 'RIR';
  const todoIgual = todasIguales(repeticiones) && todasIguales(cargas) && todasIguales(descansos) && (!conRir || todasIguales(rires));
  const partes: string[] = [];
  const porSerie: string[] = [];
  if (todoIgual) partes.push(repeticiones[0] ? `${numero(cuantas)} × ${repeticiones[0]}` : `${cantidadDeSeries(cuantas)} ${COPY_ENTRENAMIENTO.sinRepeticionesFijadas}`);
  else {
    partes.push(cantidadDeSeries(cuantas));
    if (!todasIguales(repeticiones)) porSerie.push('repeticiones');
    else partes.push(repeticiones[0] ?? COPY_ENTRENAMIENTO.sinRepeticionesFijadas);
  }
  if (!todasIguales(cargas)) porSerie.push('carga');
  else if (cargas[0]) partes.push(cargas[0]);
  if (!p.intensity) partes.push(SIN_CRITERIO);
  else if (!conRir) partes.push(`${numero(p.intensity.target.value)} ${ETIQUETA_DE_CRITERIO.PERCENT_RM}`);
  else if (!todasIguales(rires)) porSerie.push('RIR');
  else if (rires[0]) partes.push(rires[0]);
  const descansoIgual = todasIguales(descansos);
  if (!descansoIgual) porSerie.push('descanso');
  if (porSerie.length > 0) partes.push(`${enumerar(porSerie)} por serie`);
  if (descansoIgual && descansos[0]) partes.push(`descanso ${descansos[0]}`);
  return partes.join(' · ');
}

/** Una fila de «Lo que recibe tu asesorado»: el objetivo de una serie. `null`: sin objetivo. */
export interface SerieDelPlan {
  readonly serie: number;
  readonly carga: string | null;
  readonly repeticiones: string | null;
  readonly rir: string | null;
  readonly descanso: string | null;
  readonly nota: string | null;
}

/**
 * Las series de un ejercicio, con el objetivo que resolvió la API para cada una. La columna del RIR va si el criterio es
 * RIR o alguna serie tiene uno; la de la nota, si alguna serie la tiene.
 */
export function seriesDelEjercicio(p: Pick<PrescripcionConObjetivos, 'sets' | 'intensity'>): { readonly filas: readonly SerieDelPlan[]; readonly conRir: boolean; readonly conNota: boolean } {
  const filas = [...p.sets]
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((s) => ({
      serie: s.setIndex,
      carga: textoDeCarga(s.target.suggestedLoad),
      repeticiones: textoDeRepeticiones(s.target.repetitions),
      rir: textoDeRir(s.target.rir),
      descanso: textoDeSegundos(s.target.restSeconds),
      nota: s.note && s.note.trim() !== '' ? s.note : null,
    }));
  return { filas, conRir: p.intensity?.criterion === 'RIR' || filas.some((f) => f.rir !== null), conNota: filas.some((f) => f.nota !== null) };
}

/** Un dato de «Lo general del ejercicio». */
export interface DatoGeneralDelEjercicio {
  readonly rotulo: string;
  readonly valor: string;
}

/**
 * Lo general de un ejercicio, aparte de sus series: la intensidad con su referencia (o que no tiene criterio), cómo se
 * cuenta la carga y qué cuentan las repeticiones, si se declararon, cada parámetro del profesional con su unidad, y la
 * nota. Lo que no se declaró no ocupa un renglón.
 */
export function loGeneralDelEjercicio(p: Pick<PrescripcionConObjetivos, 'intensity' | 'loadBasis' | 'repetitionBasis' | 'professionalParameters' | 'note'>): readonly DatoGeneralDelEjercicio[] {
  const C = COPY_DEL_PLAN_DE_ENTRENAMIENTO;
  return [
    { rotulo: C.intensidad, valor: intensidadPlanificada(p) ?? COPY_ENTRENAMIENTO.sinCriterio },
    ...(p.loadBasis ? [{ rotulo: C.laCargaSeCuenta, valor: ETIQUETA_DE_BASE_DE_CARGA[p.loadBasis] }] : []),
    ...(p.repetitionBasis ? [{ rotulo: C.lasRepeticiones, valor: ETIQUETA_DE_BASE_DE_REPETICIONES[p.repetitionBasis] }] : []),
    ...p.professionalParameters.map((q) => ({ rotulo: q.label, valor: `${typeof q.value === 'number' ? numero(q.value) : q.value}${q.unit ? ` ${q.unit}` : ''}` })),
    ...(p.note ? [{ rotulo: COPY_ENTRENAMIENTO.notas, valor: p.note }] : []),
  ];
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/** En la dirección, «todos plegados». Sin nada escrito, el primer ejercicio está abierto. */
export const NINGUN_EJERCICIO = 'ninguno';

/**
 * Los textos de «Plan», de Entrenamiento, que no comparte la APK. Los de las versiones son los de los dos planes. Los
 * verifica la prueba de palabras de Entrenamiento: describen, no califican.
 */
export const COPY_DEL_PLAN_DE_ENTRENAMIENTO = {
  ...COPY_DE_VERSIONES,
  bloque: COPY_ENTRENAMIENTO.bloque,
  microciclo: COPY_ENTRENAMIENTO.microciclo,
  sesion: 'Sesión',
  /** «Propósito: más carga, menos repeticiones». */
  proposito: 'Propósito',
  /** El plan no asigna días: el teléfono muestra todas las sesiones y la persona elige cuál hace. */
  sinDiaAsignado: 'Sin día asignado: tu asesorado elige cuál hace.',
  loQueRecibe: 'Lo que recibe tu asesorado',
  loGeneral: 'Lo general del ejercicio',
  intensidad: 'Intensidad',
  laCargaSeCuenta: 'La carga se cuenta',
  lasRepeticiones: 'Las repeticiones',
  cargaSugerida: COPY_ENTRENAMIENTO.cargaSugerida,
  nota: 'Nota',
  abrirTodos: 'Abrir todos los ejercicios',
  plegarTodos: 'Plegar todos',
  sinSeries: 'Sin series',
  sinBloques: 'Esta versión no tiene bloques.',
  sinSesiones: 'Acá no hay sesiones.',
  sinEjercicios: 'Esta sesión no tiene ejercicios.',
  /** Con cinco o más para elegir, una lista, que dice cuántas hay. */
  deCuantas: (cuantas: number): string => `de ${numero(cuantas)}`,
} as const;
