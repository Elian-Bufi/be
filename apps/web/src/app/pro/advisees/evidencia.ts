/**
 * La lógica de la evidencia de una revisión (pasada del 2026-10-09), sin interfaz: agrupar por día, marcar un grupo
 * registro por registro y decir lo marcado. La usa `evidencia-de-revision.tsx`; la prueba
 * `scripts/evidencia-de-revision.test.mjs`.
 */

export interface CandidataDeEvidencia {
  readonly tipo: 'EXECUTION' | 'PLAN_VERSION' | 'OBJECTIVE_VERSION';
  readonly id: string;
  /** El día civil del registro; `null` para la planificación y el objetivo, que no son de un día. */
  readonly dia: string | null;
  /** Qué es, sin la fecha (la dice su grupo): «08:10 · Comida del plan». */
  readonly texto: string;
}

/** El nombre de los registros, en singular y plural: «comida» y «comidas», «sesión» y «sesiones» (los dos, femeninos). */
export type NombresDeLosRegistros = readonly [string, string];

/** Los registros por día civil, del primero al último; la planificación y el objetivo quedan fuera. */
export function porDia(candidatas: readonly CandidataDeEvidencia[]): [string, CandidataDeEvidencia[]][] {
  const grupos = new Map<string, CandidataDeEvidencia[]>();
  for (const c of candidatas) {
    if (c.dia === null) continue;
    grupos.set(c.dia, [...(grupos.get(c.dia) ?? []), c]);
  }
  return [...grupos].sort(([a], [b]) => a.localeCompare(b));
}

/** Marcar o desmarcar un grupo es marcar o desmarcar cada uno de sus registros: lo demás no cambia. */
export function marcar(elegidas: ReadonlySet<string>, ids: readonly string[], si: boolean): Set<string> {
  const siguiente = new Set(elegidas);
  for (const x of ids) {
    if (si) siguiente.add(x);
    else siguiente.delete(x);
  }
  return siguiente;
}

/** Cuántos de un grupo están marcados: ninguno, todos o una parte (para la casilla en estado mixto). */
export function estadoDelGrupo(ids: readonly string[], elegidas: ReadonlySet<string>): { readonly marcadas: number; readonly todas: boolean; readonly mixto: boolean } {
  const marcadas = ids.filter((x) => elegidas.has(x)).length;
  const todas = ids.length > 0 && marcadas === ids.length;
  return { marcadas, todas, mixto: marcadas > 0 && !todas };
}

/** «la comida» o «las 4 comidas». */
export const cuantas = (n: number, [uno, varios]: NombresDeLosRegistros): string => (n === 1 ? `la ${uno}` : `las ${n} ${varios}`);

/**
 * «Marcaste 12 de 73: 10 comidas de 3 días, 1 versión del plan y el objetivo.» Dice lo marcado, no lo examinado: la
 * casilla es la declaración del profesional.
 */
export function resumenDeLoMarcado(candidatas: readonly CandidataDeEvidencia[], elegidas: ReadonlySet<string>, [uno, varios]: NombresDeLosRegistros): string {
  const marcadas = candidatas.filter((c) => elegidas.has(c.id));
  if (marcadas.length === 0) return 'Todavía no marcaste nada.';
  const registros = marcadas.filter((c) => c.tipo === 'EXECUTION');
  const dias = new Set(registros.map((c) => c.dia)).size;
  const planes = marcadas.filter((c) => c.tipo === 'PLAN_VERSION').length;
  const partes = [
    ...(registros.length ? [`${registros.length} ${registros.length === 1 ? uno : varios} de ${dias} ${dias === 1 ? 'día' : 'días'}`] : []),
    ...(planes ? [`${planes} ${planes === 1 ? 'versión del plan' : 'versiones del plan'}`] : []),
    ...(marcadas.some((c) => c.tipo === 'OBJECTIVE_VERSION') ? ['el objetivo'] : []),
  ];
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0];
  return `Marcaste ${marcadas.length} de ${candidatas.length}: ${lista}.`;
}

/** Lo que viaja en la revisión: una referencia por registro marcado, como siempre (el contrato no cambia). */
export const referenciasMarcadas = (candidatas: readonly CandidataDeEvidencia[], elegidas: ReadonlySet<string>): { type: CandidataDeEvidencia['tipo']; id: string }[] =>
  candidatas.filter((c) => elegidas.has(c.id)).map((c) => ({ type: c.tipo, id: c.id }));
