/**
 * El día como unidad de la línea de tiempo (WP-ESCRITORIO-AMABLE, parte 4), como lógica pura. No cambia qué hechos hay
 * ni su orden en la API (`linea-de-tiempo.ts`): dice cómo se leen juntos los de un mismo día.
 *
 * - **Hito y lo de todos los días.** Las comidas y las sesiones son lo que la persona registra una y otra vez. Todo lo
 *   demás (un plan activado, un objetivo, una revisión, una toma, un seguimiento que se abre o se cierra) es un hito.
 * - **Los rasgos de un hecho** son datos de cómo se registró o de qué le pasó después: sin confirmar, distinto de lo
 *   indicado, cargado otro día, anulado… Ninguno califica a la persona ni al dato.
 * - **Las comidas de un día se leen en un renglón** («Comidas · 4 registradas») que dice cuántas son y cuántas tienen
 *   cada rasgo. Agrupar no esconde: un rasgo de cualquiera de ellas se anuncia en el renglón.
 * - **Un día sin novedades** tiene solo sus comidas y ningún rasgo: pesa menos en la pantalla. No dice nada del día:
 *   dice que no hay nada distinto de lo de siempre para mirar.
 * - **Las vistas con nombre** son filtros que ya existen, con el nombre de lo que se busca. La cantidad que anuncian sale
 *   de los conteos del período y es la cantidad de hechos que trae la vista.
 */
import { TIPOS_DE_EVENTO, type CalidadDeEntrada, type ConteosDelPeriodo, type DominioDeAnalisis, type EntradaDeLineaDeTiempo, type TipoDeEvento } from './contratos-analisis';
import { agruparPorDia, type FiltrosDeLineaDeTiempo } from './linea-de-tiempo';

// ─── Hitos y lo de todos los días ───────────────────────────────────────────────────────────────

/** Lo que la persona registra una y otra vez. Todo lo demás es un hito. */
const DE_TODOS_LOS_DIAS: ReadonlySet<TipoDeEvento> = new Set<TipoDeEvento>(['MEAL_RECORDED', 'TRAINING_SESSION_RECORDED']);

/** Los tipos de hecho que son hitos, en el orden del contrato. */
export const TIPOS_DE_HITO: readonly TipoDeEvento[] = TIPOS_DE_EVENTO.filter((t) => !DE_TODOS_LOS_DIAS.has(t));

export const esHito = (e: EntradaDeLineaDeTiempo): boolean => !DE_TODOS_LOS_DIAS.has(e.eventType);

/**
 * Los hitos de planificación: los que marcan un antes y un después en lo que se le indica a la persona (un plan que se
 * activa, un objetivo, una revisión, un seguimiento que se abre o se cierra). Son los hitos menos las tomas: una toma es
 * una medición, y en un gráfico ya es un punto. «Analizar» dibuja estos como líneas verticales; la línea de tiempo
 * destaca todos los hitos. Los dos conjuntos salen de acá, para que no se separen.
 */
export const TIPOS_DE_HITO_DE_PLANIFICACION: readonly TipoDeEvento[] = TIPOS_DE_HITO.filter((t) => t !== 'ANTHROPOMETRIC_EVALUATION_RECORDED');

// ─── Los rasgos de un hecho ─────────────────────────────────────────────────────────────────────

/** A qué área pertenece cada rasgo de calidad: una comida no tiene rasgos de sesión, ni una sesión rasgos de comida. */
export const DOMINIO_DE_LA_CALIDAD: Readonly<Record<CalidadDeEntrada, DominioDeAnalisis>> = {
  QUANTITIES_UNCONFIRMED: 'NUTRITION',
  QUANTITIES_FROM_PLAN: 'NUTRITION',
  QUANTITIES_REPORTED: 'NUTRITION',
  QUANTITIES_DIFFER_FROM_PLAN: 'NUTRITION',
  NUTRIENTS_INCOMPLETE: 'NUTRITION',
  DIFFERENT_MEAL: 'NUTRITION',
  SESSION_SUMMARY_ONLY: 'TRAINING',
  SESSION_NOT_COMPLETED: 'TRAINING',
  SESSION_WITH_DEVIATION: 'TRAINING',
};

/**
 * Lo que un renglón dice de su hecho además del nombre. Quedan afuera, a propósito, los modos de registro de siempre
 * (porciones del plan confirmadas, cantidades informadas) y «falta algún nutriente», que depende del alimento y no de
 * cómo se registró: se ven en el detalle.
 */
export const RASGOS_DE_UN_HECHO = [
  'SIN_CONFIRMAR',
  'DISTINTO_DE_LO_INDICADO',
  'COMIDA_DIFERENTE',
  'SESION_CON_CAMBIOS',
  'SESION_NO_REALIZADA',
  'SESION_RESUMIDA',
  'ANULADO',
  'RECTIFICADO',
  'CORREGIDO',
  'CARGADO_OTRO_DIA',
] as const;
export type RasgoDeUnHecho = (typeof RASGOS_DE_UN_HECHO)[number];

const RASGO_DE_LA_CALIDAD: Readonly<Partial<Record<CalidadDeEntrada, RasgoDeUnHecho>>> = {
  QUANTITIES_UNCONFIRMED: 'SIN_CONFIRMAR',
  QUANTITIES_DIFFER_FROM_PLAN: 'DISTINTO_DE_LO_INDICADO',
  DIFFERENT_MEAL: 'COMIDA_DIFERENTE',
  SESSION_WITH_DEVIATION: 'SESION_CON_CAMBIOS',
  SESSION_NOT_COMPLETED: 'SESION_NO_REALIZADA',
  SESSION_SUMMARY_ONLY: 'SESION_RESUMIDA',
};
const RASGO_DEL_ESTADO: Readonly<Partial<Record<EntradaDeLineaDeTiempo['state'], RasgoDeUnHecho>>> = { ANNULLED: 'ANULADO', RECTIFIED: 'RECTIFICADO', CORRECTED: 'CORREGIDO' };

/** Los rasgos de un hecho, en el orden de `RASGOS_DE_UN_HECHO`. Vacío: nada distinto de lo de siempre. */
export function rasgosDeUnHecho(e: EntradaDeLineaDeTiempo): RasgoDeUnHecho[] {
  const presentes = new Set<RasgoDeUnHecho>();
  for (const q of e.quality) {
    const r = RASGO_DE_LA_CALIDAD[q];
    if (r) presentes.add(r);
  }
  const delEstado = RASGO_DEL_ESTADO[e.state];
  if (delEstado) presentes.add(delEstado);
  if (e.recordedLate) presentes.add('CARGADO_OTRO_DIA');
  return RASGOS_DE_UN_HECHO.filter((r) => presentes.has(r));
}

/** El rasgo, como va en el renglón de su hecho. Los estados conservan sus nombres de siempre. */
export const NOMBRE_DEL_RASGO: Readonly<Record<RasgoDeUnHecho, string>> = {
  SIN_CONFIRMAR: 'Sin confirmar',
  DISTINTO_DE_LO_INDICADO: 'Distinta de lo indicado',
  COMIDA_DIFERENTE: 'Comida diferente',
  SESION_CON_CAMBIOS: 'Con cambios',
  SESION_NO_REALIZADA: 'No realizada',
  SESION_RESUMIDA: 'Resumida, sin series',
  ANULADO: 'Anulado',
  RECTIFICADO: 'Rectificado',
  CORREGIDO: 'Corregido',
  CARGADO_OTRO_DIA: 'Cargado otro día',
};

/** Cuántas comidas de un grupo tienen el rasgo, como va en el renglón del grupo: «1 sin confirmar», «2 anuladas». */
export function rasgoDeVariasComidas(rasgo: RasgoDeUnHecho, cuenta: number): string {
  const una = cuenta === 1;
  switch (rasgo) {
    case 'SIN_CONFIRMAR':
      return `${cuenta} sin confirmar`;
    case 'DISTINTO_DE_LO_INDICADO':
      return `${cuenta} ${una ? 'distinta' : 'distintas'} de lo indicado`;
    case 'COMIDA_DIFERENTE':
      return `${cuenta} ${una ? 'comida diferente' : 'comidas diferentes'}`;
    case 'ANULADO':
      return `${cuenta} ${una ? 'anulada' : 'anuladas'}`;
    case 'RECTIFICADO':
      return `${cuenta} ${una ? 'rectificada' : 'rectificadas'}`;
    case 'CORREGIDO':
      return `${cuenta} ${una ? 'corregida' : 'corregidas'}`;
    case 'CARGADO_OTRO_DIA':
      return `${cuenta} ${una ? 'cargada' : 'cargadas'} otro día`;
    default:
      // Los rasgos de una sesión no son de una comida: si llegaran, se dicen con su nombre.
      return `${cuenta}: ${NOMBRE_DEL_RASGO[rasgo].toLowerCase()}`;
  }
}

// ─── El día ─────────────────────────────────────────────────────────────────────────────────────

export interface GrupoDeComidas {
  /** Las comidas del día, en el orden en que ocurrieron. */
  readonly comidas: readonly EntradaDeLineaDeTiempo[];
  /** Cuántas tienen cada rasgo: solo los presentes, en el orden de `RASGOS_DE_UN_HECHO`. */
  readonly rasgos: readonly { readonly rasgo: RasgoDeUnHecho; readonly cuenta: number }[];
}

export interface DiaDeLaLinea {
  readonly fecha: string;
  /** Los hechos que van cada uno en su renglón: los hitos, las sesiones y, si no van agrupadas, las comidas. */
  readonly hechos: readonly EntradaDeLineaDeTiempo[];
  /** Las comidas del día en un solo renglón; `null` si no hay o si van cada una en el suyo. */
  readonly grupo: GrupoDeComidas | null;
  /** Hay algo más que lo de siempre: un hito, una sesión o un hecho con algún rasgo. */
  readonly conNovedades: boolean;
  /** Los hechos leídos no alcanzan a completar el día (quedan más por leer): no se agrupa ni se cuenta. */
  readonly incompleto: boolean;
}

/** Los hechos de un día en el orden en que ocurrieron; los que solo tienen fecha, al final. Un orden total. */
function enElOrdenDelDia(a: EntradaDeLineaDeTiempo, b: EntradaDeLineaDeTiempo): number {
  if (a.occurredAt !== b.occurredAt) {
    if (a.occurredAt === null) return 1;
    if (b.occurredAt === null) return -1;
    const ta = Date.parse(a.occurredAt);
    const tb = Date.parse(b.occurredAt);
    if (ta !== tb) return ta - tb;
  }
  if (a.recordedAt !== b.recordedAt) {
    if (a.recordedAt === null) return 1;
    if (b.recordedAt === null) return -1;
    const ra = Date.parse(a.recordedAt);
    const rb = Date.parse(b.recordedAt);
    if (ra !== rb) return ra - rb;
  }
  return a.timelineEntryId < b.timelineEntryId ? -1 : a.timelineEntryId > b.timelineEntryId ? 1 : 0;
}

function rasgosDelGrupo(comidas: readonly EntradaDeLineaDeTiempo[]): GrupoDeComidas['rasgos'] {
  const cuenta = new Map<RasgoDeUnHecho, number>();
  for (const c of comidas) for (const r of rasgosDeUnHecho(c)) cuenta.set(r, (cuenta.get(r) ?? 0) + 1);
  return RASGOS_DE_UN_HECHO.filter((r) => cuenta.has(r)).map((rasgo) => ({ rasgo, cuenta: cuenta.get(rasgo) ?? 0 }));
}

export interface OpcionesDeLosDias {
  /**
   * Las comidas de un día van en un renglón. Solo vale si lo leído trae **todas** las comidas del día: con un filtro que
   * recorta dentro del día (una calidad, un estado, la búsqueda, lo nuevo desde un corte), cada hecho va en su renglón.
   */
  readonly agrupar: boolean;
  /** Quedan hechos más viejos por leer: el último día leído puede estar incompleto. */
  readonly hayMas: boolean;
}

export interface DiasDeLaLinea {
  readonly dias: readonly DiaDeLaLinea[];
  /** Cuántos de los hechos leídos están en los días que se devuelven. */
  readonly hechos: number;
}

/**
 * Los días de la línea de tiempo, del más nuevo al más viejo, a partir de las entradas en el orden de la API.
 * - Dentro del día: primero los hitos, después las sesiones y al final las comidas; cada clase, en el orden en que ocurrió.
 * - Con `agrupar`, dos comidas o más van en un grupo. Una sola va en su renglón: abrir un grupo de una no ahorra nada.
 * - Con `hayMas`, el último día leído se guarda hasta leer más: mostrarlo sería contar un día por la mitad. Si es el
 *   único día leído, se devuelve marcado `incompleto`, con cada hecho en su renglón.
 */
export function componerLosDias(entradas: readonly EntradaDeLineaDeTiempo[], opciones: OpcionesDeLosDias): DiasDeLaLinea {
  const porDia = agruparPorDia(entradas);
  const leidos = opciones.hayMas && porDia.length > 1 ? porDia.slice(0, -1) : porDia;
  const dias = leidos.map((d, i): DiaDeLaLinea => {
    const incompleto = opciones.hayMas && i === leidos.length - 1 && porDia.length === 1;
    const hitos = d.entradas.filter(esHito).sort(enElOrdenDelDia);
    const sesiones = d.entradas.filter((e) => e.eventType === 'TRAINING_SESSION_RECORDED').sort(enElOrdenDelDia);
    const comidas = d.entradas.filter((e) => e.eventType === 'MEAL_RECORDED').sort(enElOrdenDelDia);
    const agrupadas = opciones.agrupar && !incompleto && comidas.length >= 2;
    return {
      fecha: d.fecha,
      hechos: agrupadas ? [...hitos, ...sesiones] : [...hitos, ...sesiones, ...comidas],
      grupo: agrupadas ? { comidas, rasgos: rasgosDelGrupo(comidas) } : null,
      conNovedades: hitos.length > 0 || sesiones.length > 0 || comidas.some((c) => rasgosDeUnHecho(c).length > 0),
      incompleto,
    };
  });
  return { dias, hechos: leidos.reduce((n, d) => n + d.entradas.length, 0) };
}

const MS_POR_DIA = 86_400_000;
const aMediodia = (fecha: string): number => Date.parse(`${fecha}T12:00:00Z`);
const diaCivilDe = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/**
 * Los días civiles sin ningún hecho entre dos días consecutivos de la lista (`nueva` es el más reciente). `null` si son
 * días seguidos. Es un hueco, no un cero: solo dice que BE no tiene hechos de esos días en lo que se está mirando.
 */
export function diasSinHechosEntre(nueva: string, vieja: string): { readonly desde: string; readonly hasta: string; readonly dias: number } | null {
  const dias = Math.round((aMediodia(nueva) - aMediodia(vieja)) / MS_POR_DIA) - 1;
  if (!(dias >= 1)) return null;
  return { desde: diaCivilDe(aMediodia(vieja) + MS_POR_DIA), hasta: diaCivilDe(aMediodia(nueva) - MS_POR_DIA), dias };
}

// ─── Las vistas con nombre ──────────────────────────────────────────────────────────────────────

export type ClaveDeVistaDeLaLinea = 'TODO' | 'HITOS' | 'DISTINTO_DE_LO_INDICADO' | 'SIN_CONFIRMAR';

export interface VistaDeLaLinea {
  readonly clave: ClaveDeVistaDeLaLinea;
  readonly nombre: string;
  /** Qué hechos trae, para la ayuda de la vista. */
  readonly queTrae: string;
  readonly tipos: readonly TipoDeEvento[];
  /** Si hay más de una, son de áreas distintas: un hecho no puede tener dos, y la cuenta no lo cuenta dos veces. */
  readonly calidades: readonly CalidadDeEntrada[];
}

/**
 * Las vistas con nombre de la línea de tiempo: cada una es una combinación de los filtros de API-DSH-04, no un dato
 * nuevo. «Distinto de lo indicado» conserva el sentido que ya tiene en BE: una diferencia comprobada, ingrediente por
 * ingrediente, o una sesión que la persona registró como realizada con cambios. Una comida diferente y una sesión no
 * realizada son otra cosa (no hay con qué comparar): tienen su filtro en «Más filtros».
 */
export const VISTAS_DE_LA_LINEA: readonly VistaDeLaLinea[] = [
  { clave: 'TODO', nombre: 'Todo', queTrae: 'Todos los hechos del período.', tipos: [], calidades: [] },
  {
    clave: 'HITOS',
    nombre: 'Hitos',
    queTrae: 'Lo que no es el registro de todos los días: planes activados, objetivos, revisiones, tomas antropométricas y seguimientos que se abren o se cierran.',
    tipos: TIPOS_DE_HITO,
    calidades: [],
  },
  {
    clave: 'DISTINTO_DE_LO_INDICADO',
    nombre: 'Distinto de lo indicado',
    queTrae: 'Las comidas con cantidades informadas que no coinciden con su opción del plan, comprobado ingrediente por ingrediente, y las sesiones registradas como realizadas con cambios.',
    tipos: [],
    calidades: ['QUANTITIES_DIFFER_FROM_PLAN', 'SESSION_WITH_DEVIATION'],
  },
  { clave: 'SIN_CONFIRMAR', nombre: 'Sin confirmar', queTrae: 'Las comidas registradas sin confirmar las cantidades: no se completan con las porciones del plan.', tipos: [], calidades: ['QUANTITIES_UNCONFIRMED'] },
];

/** Los filtros de API-DSH-04 que arman la vista. */
export const filtrosDeLaVista = (v: VistaDeLaLinea): FiltrosDeLineaDeTiempo => ({ tipos: v.tipos, calidades: v.calidades });

/**
 * Cuántos hechos del período trae la vista, a partir de los conteos de API-DSH-04 (que son del conjunto autorizado, antes
 * de los filtros). Es la misma cantidad que devuelve la consulta con los filtros de la vista.
 */
export function cuentaDeLaVista(v: VistaDeLaLinea, conteos: ConteosDelPeriodo): number {
  if (v.calidades.length > 0) return conteos.byQuality.filter((q) => v.calidades.includes(q.quality)).reduce((n, q) => n + q.count, 0);
  return conteos.byEventType.filter((t) => v.tipos.length === 0 || v.tipos.includes(t.eventType)).reduce((n, t) => n + t.count, 0);
}

const mismoConjunto = <T>(a: readonly T[] | undefined, b: readonly T[]): boolean => (a ?? []).length === b.length && b.every((x) => (a ?? []).includes(x));

/** La vista con nombre que corresponde exactamente a estos filtros; `null` si es una combinación a medida. */
export function vistaDeLosFiltros(f: FiltrosDeLineaDeTiempo): ClaveDeVistaDeLaLinea | null {
  if ((f.dominios ?? []).length > 0 || (f.estados ?? []).length > 0 || f.planVersionId || f.exerciseKey || f.q || f.soloTardias || f.novedadesDesde) return null;
  return VISTAS_DE_LA_LINEA.find((v) => mismoConjunto(f.tipos, v.tipos) && mismoConjunto(f.calidades, v.calidades))?.clave ?? null;
}
