/**
 * Textos de «Mi evolución» (DL-117; DL-118). Los gráficos chicos por orden de toma se retiraron en DL-118: el progreso va
 * sobre fechas reales (`pantallas/progreso-de-una-medida.tsx`). Queda la lista para leer de las tomas, que usa el aviso
 * de una toma que puede estar incompleta (D-3).
 */

/** Una lista para leer: «T2», «T2 y T3», «T2, T3 y T4». */
export function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}
