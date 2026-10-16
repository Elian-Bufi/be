/**
 * Cartera del profesional (PF-07, propuesta del 2026-09-30): «a quién mirar hoy», con hechos fechados y sin juicios.
 *
 * La API arma los pendientes con datos que ya existen (expectativa de revisión del Proceso, versiones de plan,
 * solicitudes de formulario, evaluaciones en preparación) y acá vive lo que comparten la API y el website:
 * - la clasificación de una expectativa de revisión en vencida, próxima o sin fecha, por fechas civiles;
 * - el orden por urgencia objetiva, con empates por antigüedad;
 * - los textos, que nunca califican a la persona (TEST-PRJ-009): no hay «inactivo», «riesgo» ni «cumplimiento».
 *
 * La última actividad registrada es un dato que acompaña a cada fila; nunca genera una fila por sí sola (D-3 de la
 * ficha): convertir «sin registros» en un pendiente es el primer paso hacia calificar a la persona.
 */
import type { DominioDeCartera } from './contratos-cartera';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { diasEntreFechas } from './fechas-civiles';
import { numero } from './formato-numeros';

export const TIPOS_DE_PENDIENTE = ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON', 'REVIEW_UNDATED', 'PLAN_DRAFT_PENDING', 'NO_ACTIVE_PLAN', 'FORM_REQUEST_OPEN', 'ANTHRO_DRAFT_PENDING'] as const;
export type TipoDePendiente = (typeof TIPOS_DE_PENDIENTE)[number];

/** Ventana de «revisión en N días» (D-2 de la ficha: 7 días fijos en el incremento 1). */
export const VENTANA_DE_REVISION_DIAS = 7;

/** Urgencia objetiva: menor es más urgente. Es el orden de la lista, no una valoración de la persona. */
export const URGENCIA_DE_PENDIENTE: Readonly<Record<TipoDePendiente, number>> = {
  REVIEW_OVERDUE: 1,
  REVIEW_DUE_SOON: 2,
  REVIEW_UNDATED: 3,
  PLAN_DRAFT_PENDING: 4,
  NO_ACTIVE_PLAN: 5,
  FORM_REQUEST_OPEN: 6,
  ANTHRO_DRAFT_PENDING: 7,
};

/** Cómo se clasifica la expectativa de revisión vigente del Proceso, por fechas civiles de la zona del profesional. */
export interface RevisionClasificada {
  readonly kind: 'REVIEW_OVERDUE' | 'REVIEW_DUE_SOON' | 'REVIEW_UNDATED' | null;
  /** Días de atraso (vencida) o días que faltan (próxima); `null` sin fecha. */
  readonly dias: number | null;
}

/**
 * Vencida si la fecha objetivo es anterior a hoy; próxima si cae entre hoy y hoy + ventana; sin fecha si la
 * expectativa existe sin fecha objetivo (REG-06-150: pendiente desde que se registró, nunca vencida). Más lejos que
 * la ventana: no es un pendiente todavía.
 */
export function clasificarRevision(fechaObjetivo: string | null, hoy: string, ventanaDias = VENTANA_DE_REVISION_DIAS): RevisionClasificada {
  if (fechaObjetivo === null) return { kind: 'REVIEW_UNDATED', dias: null };
  const faltan = diasEntreFechas(hoy, fechaObjetivo);
  if (faltan < 0) return { kind: 'REVIEW_OVERDUE', dias: -faltan };
  if (faltan <= ventanaDias) return { kind: 'REVIEW_DUE_SOON', dias: faltan };
  return { kind: null, dias: null };
}

/** Lo mínimo que el orden necesita de una fila. */
export interface PendienteOrdenable {
  readonly kind: TipoDePendiente;
  /** Fecha civil que origina el pendiente (`AAAA-MM-DD`), o `null`. */
  readonly since: string | null;
  readonly daysOverdue: number | null;
  readonly adviseeId: string;
}

/**
 * Orden de la lista: por urgencia; dentro de una vencida, más atraso primero; después, lo más antiguo primero; y un
 * desempate estable por asesorado para que dos lecturas seguidas den el mismo orden.
 */
export function compararPendientes(a: PendienteOrdenable, b: PendienteOrdenable): number {
  const porUrgencia = URGENCIA_DE_PENDIENTE[a.kind] - URGENCIA_DE_PENDIENTE[b.kind];
  if (porUrgencia !== 0) return porUrgencia;
  const porAtraso = (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0);
  if (porAtraso !== 0) return porAtraso;
  const porAntiguedad = (a.since ?? '9999-12-31').localeCompare(b.since ?? '9999-12-31');
  if (porAntiguedad !== 0) return porAntiguedad;
  return a.adviseeId.localeCompare(b.adviseeId);
}

export const ordenarPendientes = <T extends PendienteOrdenable>(items: readonly T[]): T[] => [...items].sort(compararPendientes);

// ─── Las vistas con nombre de «Pendientes» (WP-ESCRITORIO-AMABLE, parte 5) ─────────────────────────────

/** Las vistas con nombre, en el orden en que se ofrecen. */
export const VISTAS_DE_PENDIENTES = ['TODO', 'REVISIONES', 'PLANES', 'FORMULARIOS', 'EVALUACIONES'] as const;
export type VistaDePendientes = (typeof VISTAS_DE_PENDIENTES)[number];

/**
 * Qué tipos junta cada vista. Fuera de «Todo», cada tipo está en una vista y en una sola: las cantidades de las cuatro
 * suman la de «Todo» (lo comprueba una prueba). Juntar no reordena: el orden sigue siendo el de la urgencia.
 */
export const TIPOS_DE_LA_VISTA_DE_PENDIENTES: Readonly<Record<VistaDePendientes, readonly TipoDePendiente[]>> = {
  TODO: TIPOS_DE_PENDIENTE,
  REVISIONES: ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON', 'REVIEW_UNDATED'],
  PLANES: ['PLAN_DRAFT_PENDING', 'NO_ACTIVE_PLAN'],
  FORMULARIOS: ['FORM_REQUEST_OPEN'],
  EVALUACIONES: ['ANTHRO_DRAFT_PENDING'],
};

/**
 * Lo que se eligió ver: los tipos (ninguno = todos) y, si se acotó, un área. El período no está acá: no saca ni suma
 * filas, solo acota el último registro de cada una, y eso lo resuelve la API.
 */
export interface FiltroDePendientes {
  readonly tipos: readonly TipoDePendiente[];
  readonly area: DominioDeCartera | null;
}

/** Una vista con nombre es una selección completa: sus tipos y ningún área. */
export const filtroDeLaVistaDePendientes = (vista: VistaDePendientes): FiltroDePendientes => ({ tipos: vista === 'TODO' ? [] : TIPOS_DE_LA_VISTA_DE_PENDIENTES[vista], area: null });

/** La vista con nombre que coincide con lo elegido, o `null` si es una combinación a medida (un área, un tipo suelto). */
export function vistaDeLosFiltrosDePendientes(filtro: FiltroDePendientes): VistaDePendientes | null {
  if (filtro.area !== null) return null;
  const elegidos = new Set(filtro.tipos);
  if (elegidos.size === 0 || elegidos.size === TIPOS_DE_PENDIENTE.length) return 'TODO';
  return VISTAS_DE_PENDIENTES.find((v) => v !== 'TODO' && TIPOS_DE_LA_VISTA_DE_PENDIENTES[v].length === elegidos.size && TIPOS_DE_LA_VISTA_DE_PENDIENTES[v].every((t) => elegidos.has(t))) ?? null;
}

/** Lo mínimo que hace falta de una fila para filtrarla y contarla. */
export interface PendienteFiltrable {
  readonly kind: TipoDePendiente;
  readonly domain: DominioDeCartera;
}

/** Las filas que coinciden con lo elegido, en el orden en que llegaron (el de la urgencia, que fija la API). */
export function filtrarPendientes<T extends PendienteFiltrable>(items: readonly T[], filtro: FiltroDePendientes): T[] {
  return items.filter((p) => (filtro.tipos.length === 0 || filtro.tipos.includes(p.kind)) && (filtro.area === null || p.domain === filtro.area));
}

/** Cuántas filas trae cada vista con nombre: la cantidad que anuncia su botón es la que se ve al elegirla. */
export function contarPendientesPorVista(items: readonly PendienteFiltrable[]): Record<VistaDePendientes, number> {
  const cuenta = (vista: VistaDePendientes): number => filtrarPendientes(items, filtroDeLaVistaDePendientes(vista)).length;
  return { TODO: cuenta('TODO'), REVISIONES: cuenta('REVISIONES'), PLANES: cuenta('PLANES'), FORMULARIOS: cuenta('FORMULARIOS'), EVALUACIONES: cuenta('EVALUACIONES') };
}

const dias = (n: number): string => `${numero(n)} ${n === 1 ? 'día' : 'días'}`;

/** Textos de la cartera. Las fechas llegan ya formateadas por la pantalla. */
export const COPY_CARTERA = {
  titulo: 'Pendientes',
  subtitulo: 'Lo que BE puede saber con lo registrado. No es una evaluación de nadie.',
  vacio: 'Nada pendiente con lo que BE puede saber. Lo que no está registrado, no está acá.',
  vistaParcial: 'Hay datos de algún asesorado que no podés ver desde tu alcance: no se cuentan acá.',
  dominio: { nutrition: 'Nutrición', training: 'Entrenamiento', anthropometry: 'Antropometría' } as const,
  pendiente: {
    REVIEW_OVERDUE: (diasDeAtraso: number): string => `Revisión vencida hace ${dias(diasDeAtraso)}`,
    REVIEW_DUE_SOON: (diasQueFaltan: number): string => (diasQueFaltan === 0 ? 'Revisión hoy' : `Revisión en ${dias(diasQueFaltan)}`),
    REVIEW_UNDATED: (desde: string): string => `Revisión pendiente desde el ${desde}`,
    PLAN_DRAFT_PENDING: (desde: string): string => `Plan en borrador desde el ${desde}`,
    NO_ACTIVE_PLAN: (): string => 'Sin plan activo',
    FORM_REQUEST_OPEN: (desde: string): string => `Formulario sin responder desde el ${desde}`,
    ANTHRO_DRAFT_PENDING: (desde: string): string => `Toma en preparación desde el ${desde}`,
  },
  ultimoRegistro: (fecha: string): string => `Último registro: ${fecha}`,
  sinRegistros: 'Sin registros en el período',
  /** Sin período elegido se mira toda la historia: decir «en el período» sería hablar de uno que no hay. */
  sinRegistrosTodavia: 'Sin registros todavía',
  abrir: 'Abrir',
  filtroDominio: 'Área',
  filtroTipo: 'Tipo de pendiente',
  todos: 'Todos',
  /** Las vistas con nombre (`VISTAS_DE_PENDIENTES`). */
  vista: { TODO: 'Todo', REVISIONES: 'Revisiones', PLANES: 'Planes', FORMULARIOS: 'Formularios', EVALUACIONES: 'Tomas' } as const,
  masFiltros: 'Más filtros',
  /** Una vista o un filtro sin filas no es «nada pendiente»: hay pendientes, y ninguno coincide con lo elegido. */
  sinCoincidencias: 'Ningún pendiente coincide con lo elegido.',
  /** El período no cambia qué está pendiente: se dice al lado de sus fechas. */
  periodoDelUltimoRegistro: 'Período del último registro',
  ayudaDelPeriodo: 'Acota solo el último registro de cada fila. Los pendientes no cambian.',
  tipo: {
    REVIEW_OVERDUE: 'Revisión vencida',
    REVIEW_DUE_SOON: 'Revisión próxima',
    REVIEW_UNDATED: 'Revisión sin fecha',
    PLAN_DRAFT_PENDING: 'Plan en borrador',
    NO_ACTIVE_PLAN: 'Sin plan activo',
    FORM_REQUEST_OPEN: 'Formulario sin responder',
    ANTHRO_DRAFT_PENDING: 'Toma en preparación',
  } as const,
} as const;

/** Los términos que ningún texto de la cartera puede usar: los de los tres dominios, más los propios de una lista de personas. */
export function terminosProhibidosDeCarteraEn(texto: string): string[] {
  const propios = ['inactivo', 'inactiva', 'abandon', 'riesgo', 'alerta', 'semáforo', 'ranking', 'racha'].filter((t) => texto.toLowerCase().includes(t));
  return [...new Set([...terminosProhibidosDeEntrenamientoEn(texto), ...terminosProhibidosDeAntropometriaEn(texto), ...terminosProhibidosDeFormulariosEn(texto), ...propios])];
}
