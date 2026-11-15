/**
 * WP-PULIDO-GRANDES PG-15 (DL-173; PG-D10): la nota para el profe, como la ve el profesional en Registros de
 * Entrenamiento, y cómo se agrupan las que trae API-TRN-25-LISTA. Sin color de alarma ni contador: la fila dice que hay
 * una nota, y el detalle de la sesión la muestra con su hora, como contexto. BE no interpreta lo que dice.
 */
import type { NotaDeLaSesion } from './contratos-notas-de-la-sesion';

export const COPY_NOTAS_DE_LA_SESION = {
  enLaFila: 'Con nota',
  enLaFilaParaElLector: 'Con una nota de la persona',
  tituloEnElDetalle: 'Lo que contó la persona al terminar',
  ayudaEnElDetalle: 'La escribió para vos desde la app. Se lee acá; no se responde desde esta pantalla.',
  aLas: (hora: string) => `a las ${hora}`,
  elDia: (fecha: string, hora: string) => `el ${fecha} a las ${hora}`,
  noSePudoLeer: 'No pudimos leer las notas de las sesiones.',
} as const;

/** Las notas de cada sesión, de la más vieja a la más nueva (una nueva queda debajo). */
export function notasPorSesion<T extends Pick<NotaDeLaSesion, 'executionId' | 'recordedAt' | 'noteId'>>(notas: readonly T[]): ReadonlyMap<string, readonly T[]> {
  const porSesion = new Map<string, T[]>();
  for (const n of notas) {
    const lista = porSesion.get(n.executionId) ?? [];
    lista.push(n);
    porSesion.set(n.executionId, lista);
  }
  for (const lista of porSesion.values()) lista.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.noteId.localeCompare(b.noteId));
  return porSesion;
}
