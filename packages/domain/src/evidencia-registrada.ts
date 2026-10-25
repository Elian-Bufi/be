/**
 * La evidencia de una revisión registrada, en palabras (DL-154): lo que el profesional marcó al registrarla, cómo se dice
 * cada elemento y lo que cambió después. Lo usan las listas de revisiones de Nutrición y de Entrenamiento.
 *
 * - **Seleccionada, no visible:** se habla de «lo que marcaste al registrar esta revisión». Una revisión sin evidencia
 *   guardada lo dice; no se completa con el período.
 * - **El resumen sale de las referencias guardadas** (`evidenceReferences`, que ya llegan con la revisión), sin otra
 *   lectura: cuántas comidas o sesiones, cuántas versiones del plan, el objetivo.
 * - **Lo de después se dice:** una rectificación, una corrección, una anulación o una versión sucesora posterior a la
 *   revisión cambia lo que se ve al abrir el registro, y la revisión se registró antes de ese cambio.
 * - Sin valores de salud: la comida, la sesión, la versión, y cuándo.
 */
import type { CambioPosterior, EvidenciaResuelta } from './contratos-evidencia-de-revision';
import type { ReferenciaDeEvidenciaSchema } from './contratos-nutricion';
import type { z } from 'zod';
import { numero } from './formato-numeros';

type Referencia = z.infer<typeof ReferenciaDeEvidenciaSchema>;
export type AreaDeLaRevision = 'NUTRITION' | 'TRAINING';

const contar = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;

export const COPY_EVIDENCIA_REGISTRADA = {
  titulo: 'Evidencia seleccionada',
  queEs: 'Lo que marcaste al registrar esta revisión. No cambia si después cambian el período o los filtros.',
  sinEvidencia: 'Esta revisión no guardó evidencia seleccionada.',
  ver: 'Ver la evidencia',
  ocultar: 'Ocultar la evidencia',
  abrir: 'Abrir',
  noDisponible: 'No disponible con tu acceso actual: la evidencia de una revisión vuelve a pedir permiso cada vez que se abre.',
  noSePudoLeer: 'No pudimos leer la evidencia de esta revisión.',
  noEncontrada: 'Un elemento que la revisión guardó y hoy no está en este seguimiento.',
  /** DL-154, D-2 (criterios de Dirección del 2026-10-24): lo que se abre es el estado de hoy, nunca lo que se vio al revisar. */
  loDeHoy: 'Lo que ves es como está hoy, no como estaba cuando se revisó: cambió después de la revisión.',
  registros: { NUTRITION: 'Comidas', TRAINING: 'Sesiones' },
  planificacion: 'Planificación',
  evaluaciones: 'Evaluaciones',
} as const;

/** «12 comidas · 1 versión del plan · el objetivo»: lo que la revisión guardó, contado desde sus referencias. */
export function resumenDeLaEvidencia(refs: readonly Referencia[], area: AreaDeLaRevision): string[] {
  const n = (t: Referencia['type']) => refs.filter((r) => r.type === t).length;
  const registros = n('EXECUTION');
  const versiones = n('PLAN_VERSION');
  const objetivos = n('OBJECTIVE_VERSION');
  const evaluaciones = n('EVALUATION');
  return [
    ...(registros > 0 ? [area === 'NUTRITION' ? contar(registros, 'comida', 'comidas') : contar(registros, 'sesión', 'sesiones')] : []),
    ...(versiones > 0 ? [contar(versiones, 'versión del plan', 'versiones del plan')] : []),
    ...(objetivos > 0 ? [objetivos === 1 ? 'el objetivo' : contar(objetivos, 'versión del objetivo', 'versiones del objetivo')] : []),
    ...(evaluaciones > 0 ? [contar(evaluaciones, 'evaluación', 'evaluaciones')] : []),
  ];
}

/** Cómo se nombra un elemento: «Almuerzo · opción del plan», «Comida diferente», «Piernas A», «Plan v2»… */
export function nombreDeLaEvidencia(item: EvidenciaResuelta): string {
  if (item.state === 'NOT_FOUND' || item.what === null) return COPY_EVIDENCIA_REGISTRADA.noEncontrada;
  switch (item.what.kind) {
    case 'MEAL_RECORD':
      if (item.what.recordKind === 'DIFFERENT') return item.what.meal ? `${item.what.meal} · comida diferente` : 'Comida diferente, fuera de las comidas del plan';
      return item.what.meal ? `${item.what.meal} · opción del plan` : 'Opción del plan';
    case 'TRAINING_SESSION':
      return item.what.session ?? 'Sesión registrada';
    case 'PLAN_VERSION':
      return item.what.number ? `Plan v${numero(item.what.number)}` : 'Una versión del plan';
    case 'OBJECTIVE_VERSION':
      return 'Objetivo';
    case 'EVALUATION':
      return 'Evaluación';
  }
}

export interface FormatoDeLaEvidencia {
  /** «13 oct» desde una fecha civil `AAAA-MM-DD`. */
  readonly dia: (fecha: string) => string;
  /** «13 oct, 10:20» desde un instante. */
  readonly momento: (instante: string) => string;
}

/** Lo que cambió después de la revisión, en una frase por cambio. */
export function cambioEnPalabras(c: CambioPosterior, item: EvidenciaResuelta, f: FormatoDeLaEvidencia): string {
  const cuando = f.momento(c.at);
  switch (c.kind) {
    case 'RECTIFIED':
      return `Se rectificaron las cantidades después de esta revisión (${cuando}).`;
    case 'CORRECTED':
      return `Se corrigió después de esta revisión (${cuando}).`;
    case 'ANNULLED':
      return `Se deshizo después de esta revisión (${cuando}): quedó fuera de los totales.`;
    case 'SUCCEEDED':
      return item.what?.kind === 'OBJECTIVE_VERSION' ? `Después se registró otro objetivo (${cuando}).` : `Después se activó otra versión del plan (${cuando}).`;
  }
}

/** Cuándo, en un renglón: el día del hecho (y para la planificación, desde cuándo). */
export function cuandoDeLaEvidencia(item: EvidenciaResuelta, f: FormatoDeLaEvidencia): string | null {
  if (item.occurredDate === null) return null;
  if (item.what?.kind === 'PLAN_VERSION') return `activada el ${f.dia(item.occurredDate)}`;
  if (item.what?.kind === 'OBJECTIVE_VERSION') return `rige desde el ${f.dia(item.occurredDate)}`;
  return f.dia(item.occurredDate);
}

export interface GrupoDeEvidencia {
  readonly clave: 'REGISTROS' | 'PLANIFICACION' | 'EVALUACIONES' | 'NO_ENCONTRADOS';
  readonly titulo: string;
  readonly items: readonly EvidenciaResuelta[];
}

/**
 * Los elementos en grupos, en el orden en que se leen: los registros por fecha (los de un mismo día, por hora), la
 * planificación, las evaluaciones y, al final, lo que hoy no se encuentra. Nada se agrega: son los que llegaron.
 */
export function gruposDeLaEvidencia(items: readonly EvidenciaResuelta[], area: AreaDeLaRevision): GrupoDeEvidencia[] {
  const disponibles = items.filter((i) => i.state === 'AVAILABLE' && i.what !== null);
  const porFecha = (a: EvidenciaResuelta, b: EvidenciaResuelta) =>
    (a.occurredDate ?? '').localeCompare(b.occurredDate ?? '') || (a.occurredAt ?? '').localeCompare(b.occurredAt ?? '') || a.reference.id.localeCompare(b.reference.id);
  const registros = disponibles.filter((i) => i.what?.kind === 'MEAL_RECORD' || i.what?.kind === 'TRAINING_SESSION').sort(porFecha);
  const planificacion = disponibles.filter((i) => i.what?.kind === 'PLAN_VERSION' || i.what?.kind === 'OBJECTIVE_VERSION').sort(porFecha);
  const evaluaciones = disponibles.filter((i) => i.what?.kind === 'EVALUATION').sort(porFecha);
  const noEncontrados = items.filter((i) => i.state === 'NOT_FOUND' || i.what === null);
  const grupos: GrupoDeEvidencia[] = [
    { clave: 'REGISTROS', titulo: COPY_EVIDENCIA_REGISTRADA.registros[area], items: registros },
    { clave: 'PLANIFICACION', titulo: COPY_EVIDENCIA_REGISTRADA.planificacion, items: planificacion },
    { clave: 'EVALUACIONES', titulo: COPY_EVIDENCIA_REGISTRADA.evaluaciones, items: evaluaciones },
    { clave: 'NO_ENCONTRADOS', titulo: 'Ya no está en este seguimiento', items: noEncontrados },
  ];
  return grupos.filter((g) => g.items.length > 0);
}
