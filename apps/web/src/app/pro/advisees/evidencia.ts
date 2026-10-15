/**
 * La lógica de la evidencia de una revisión (pasada del 2026-10-09), sin interfaz: agrupar por día, marcar un grupo
 * registro por registro y decir lo marcado. Con la parte 10 de WP-ESCRITORIO-AREAS, también los días del período (la
 * grilla), lo que dice cada día y qué pasa con lo marcado al cambiar el período. La usa `evidencia-de-revision.tsx`; la
 * prueba `scripts/evidencia-de-revision.test.mjs`.
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
 * Los días civiles de un período, del primero al último, contando los dos extremos (WP-ESCRITORIO-AREAS, parte 10): en
 * Nutrición, la grilla muestra también los días sin registros, a la vista y sin casilla (DEC-18).
 */
export function diasDelPeriodo(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  if (!desde || !hasta || desde > hasta) return dias;
  const un = new Date(`${desde}T12:00:00Z`);
  // El tope es el de un período de revisión (92 días) con margen: una fecha mal escrita no arma una grilla sin fin.
  for (let i = 0; i < 400; i += 1) {
    const dia = un.toISOString().slice(0, 10);
    if (dia > hasta) break;
    dias.push(dia);
    un.setUTCDate(un.getUTCDate() + 1);
  }
  return dias;
}

/** Lo que dice un día de la grilla: «3 comidas», «1 comida» o, con una parte marcada, «2 de 4 comidas». */
export function cuentaDelDia(total: number, marcadas: number, [uno, varios]: NombresDeLosRegistros): string {
  if (marcadas > 0 && marcadas < total) return `${marcadas} de ${total} ${varios}`;
  return `${total} ${total === 1 ? uno : varios}`;
}

/** El estado de un grupo dicho en palabras, para quien no ve la casilla: «sin marcar», «todas marcadas», «2 de 4 marcadas». */
export function estadoDichoDelGrupo(marcadas: number, total: number): string {
  if (marcadas === 0) return 'sin marcar';
  return marcadas === total ? 'todas marcadas' : `${marcadas} de ${total} marcadas`;
}

/**
 * Al cambiar el período (DEC-20), lo marcado que ya no está entre las candidatas se quita, y nada más: lo que sigue en el
 * período queda marcado. Devuelve lo que queda y cuántas marcas se quitaron.
 */
export function marcasDelPeriodoNuevo(elegidas: ReadonlySet<string>, candidatas: readonly CandidataDeEvidencia[]): { readonly quedan: Set<string>; readonly quitadas: number } {
  const ids = new Set(candidatas.map((c) => c.id));
  const quedan = new Set([...elegidas].filter((x) => ids.has(x)));
  return { quedan, quitadas: elegidas.size - quedan.size };
}

/** Lo que se dice cuando el período nuevo dejó afuera algo marcado. */
export const avisoDeMarcasQuitadas = (quitadas: number): string =>
  `Con el período nuevo ${quitadas === 1 ? 'se quitó 1 marca' : `se quitaron ${quitadas} marcas`} de lo que quedó afuera. Lo demás sigue marcado y lo que escribiste no cambió.`;

/**
 * Las versiones del plan que rigieron en el período, como casillas de la evidencia: por su fecha de activación («Plan
 * activado el 7 sept»; el contexto de la revisión no trae su número, F-123). Si dos se activaron el mismo día, van con
 * la hora, para que se distingan («Plan activado el 15 oct, 10:32»).
 * @param versiones el día ya dicho como lo dice la pantalla y la hora en la zona del período.
 */
export function versionesDelPlan(versiones: readonly { readonly planId: string; readonly dia: string; readonly hora: string }[]): CandidataDeEvidencia[] {
  const delMismoDia = new Map<string, number>();
  for (const v of versiones) delMismoDia.set(v.dia, (delMismoDia.get(v.dia) ?? 0) + 1);
  return versiones.map((v) => ({ tipo: 'PLAN_VERSION', id: v.planId, dia: null, texto: `Plan activado el ${v.dia}${(delMismoDia.get(v.dia) ?? 0) > 1 ? `, ${v.hora}` : ''}` }));
}

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
