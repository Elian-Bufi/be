/**
 * EDC-12 · El número de la versión del objetivo y cómo se dice, sin React. Vivía en el asistente de Nutrición (ED-30,
 * paso 2); con DL-193 (WP-SIN-ASISTENTE-DE-NUTRICION, SAN-04) lo usan el cuadro de la opción y el objetivo del editor.
 */

/**
 * El número de una versión del objetivo: su lugar, de la más vieja a la más nueva, entre las versiones de su mismo
 * objetivo. `null` si no está en la lista.
 */
export function numeroDeLaVersionDelObjetivo(versiones: readonly { readonly objectiveId: string; readonly versionId: string; readonly createdAt: string }[], versionId: string): number | null {
  const esta = versiones.find((v) => v.versionId === versionId);
  if (!esta) return null;
  const delMismo = versiones.filter((v) => v.objectiveId === esta.objectiveId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return delMismo.findIndex((v) => v.versionId === versionId) + 1;
}

export const COPY_VERSION_DEL_OBJETIVO = {
  versionYFecha: (n: number | null, desde: string) => (n ? `Versión ${n}, vigente desde el ${desde}.` : `Vigente desde el ${desde}.`),
  // SAN-05: la versión en preparación cita un objetivo anterior; se pasa a usar el vigente con un toque (antes, solo el
  // asistente lo hacía al escribir el objetivo desde su paso 2).
  hayUnoMasNuevo: 'Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.',
  usarlaAhora: 'Usarla ahora',
} as const;
