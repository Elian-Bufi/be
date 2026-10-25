import type { Prisma } from '@prisma/client';
import { errores } from '../http/errores';
import { puedeOperarArea } from '../profesional/area-operable';

type Cliente = Pick<Prisma.TransactionClient, '$queryRaw'>;

/**
 * Si la identidad tiene Entrenamiento verificado y habilitado (sin lanzar). Es el criterio del catálogo propio (RF-037):
 * lo usan el catálogo, las plantillas, los habituales, los ejercicios propios con su imagen (DL-123) y la intención de
 * subida de una imagen de ejercicio (API-MED-01 con EXERCISE_REFERENCE), que vive en el módulo de medios.
 */
export async function esProfesionalDeEntrenamiento(cliente: Cliente, identidadId: string): Promise<boolean> {
  // WP-ADMINISTRACION: con las filas del área en modo compartido, como el PDP (profesional/area-operable.ts).
  return puedeOperarArea(cliente, identidadId, 'ENTRENAMIENTO');
}

/** Solo un profesional de Entrenamiento verificado y habilitado. Otro actor: 403 (ya es participante: no filtra nada). */
export async function exigirProfesionalDeEntrenamiento(cliente: Cliente, identidadId: string): Promise<void> {
  if (!(await esProfesionalDeEntrenamiento(cliente, identidadId))) throw errores.accionNoPermitida();
}
