/**
 * El período de una revisión en preparación (WP-DASHBOARD-COMPRENSION, eje 5; WP-ESCRITORIO-AREAS, parte 10, DEC-20),
 * sin interfaz: el que BE propone y de dónde salió el que se está mirando. La prueba es
 * `scripts/periodo-de-la-revision.test.mjs`, que carga este archivo sin empaquetador: por eso no importa otros módulos de
 * la web (la fecha la dice quien llama, con `diaDelAnioEnCurso`).
 * - **Lo propone BE:** desde el día de la última revisión hasta hoy, con el máximo de 92 días que admite el contexto de
 *   revisión. Sin revisiones, el que propone la API.
 * - **Se dice de dónde salió:** «Preparado por BE» solo si el período es ese; si el profesional eligió otro, lo dice, con
 *   la fecha de la última revisión como referencia. Lo demás (la evidencia, la interpretación, el resultado) lo elige él.
 */
import { fechaCivil } from '@be/domain';

const ZONA = 'America/Argentina/Buenos_Aires';
/** Lo que abarca un contexto de revisión: hasta 92 días inclusivos. */
export const DIAS_DE_UNA_REVISION = 92;

/** El período que BE preparó y el día civil de la última revisión, que es de donde sale. */
export interface PeriodoPreparado {
  readonly desde: string;
  readonly hasta: string;
  readonly ultimaRevision: string;
}

function diasAntes(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/**
 * El período que BE propone para preparar una revisión: desde el día civil de la última (si hay), hasta hoy, con el
 * máximo de 92 días que admite el contexto de revisión. Sin revisiones, `null`: queda el período que propone la API.
 */
export function periodoPreparado(revisiones: readonly { readonly recordedAt: string }[], hoy: string): PeriodoPreparado | null {
  if (revisiones.length === 0) return null;
  const ultima = [...revisiones].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] as { recordedAt: string };
  const minimo = diasAntes(hoy, DIAS_DE_UNA_REVISION - 1);
  const ultimaRevision = fechaCivil(ultima.recordedAt, ZONA);
  return { desde: ultimaRevision < minimo ? minimo : ultimaRevision, hasta: hoy, ultimaRevision };
}

/**
 * De dónde salió el período que se está mirando, en una frase que va junto a él.
 * @param elegido si el período lo pide la dirección de la página (el profesional, o BE al prepararlo); sin pedido, es el
 * que propuso la API.
 * @param decirElDia cómo se dice una fecha civil («27 sept»; con el año, si no es el de hoy).
 */
export function procedenciaDelPeriodo(
  periodo: { readonly start: string; readonly end: string },
  preparado: PeriodoPreparado | null,
  elegido: boolean,
  decirElDia: (fechaCivil: string) => string,
): string {
  if (!preparado) return elegido ? 'Lo elegiste vos. Todavía no hay revisiones registradas.' : 'Preparado por BE: todavía no hay revisiones registradas, así que es el período que propone BE.';
  const ultima = decirElDia(preparado.ultimaRevision);
  if (periodo.start !== preparado.desde || periodo.end !== preparado.hasta) return `Lo elegiste vos. Tu última revisión fue el ${ultima}.`;
  if (preparado.desde === preparado.ultimaRevision) return `Preparado por BE: desde tu última revisión, del ${ultima}, hasta hoy.`;
  return `Preparado por BE: los últimos ${DIAS_DE_UNA_REVISION} días, lo más largo que abarca una revisión. Tu última revisión fue el ${ultima}.`;
}
