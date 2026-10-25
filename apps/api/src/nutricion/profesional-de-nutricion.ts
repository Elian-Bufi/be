import type { Prisma } from '@prisma/client';
import { errores } from '../http/errores';
import { puedeOperarArea } from '../profesional/area-operable';

type Cliente = Pick<Prisma.TransactionClient, '$queryRaw'>;

/**
 * Si la identidad tiene Nutrición verificada y habilitada (sin lanzar). Toma las filas del área en modo compartido
 * (WP-ADMINISTRACION): una suspensión simultánea queda antes o después de la operación, nunca en el medio.
 */
export async function esProfesionalDeNutricion(cliente: Cliente, identidadId: string): Promise<boolean> {
  return puedeOperarArea(cliente, identidadId, 'NUTRICION');
}

/**
 * Solo un profesional con Nutrición verificada y habilitada usa el catálogo nutricional, importa, arma plantillas,
 * recetas y sus imágenes (WP-04, WP-08, DL-108, DL-119). Otro actor: 403.
 */
export async function exigirProfesionalDeNutricion(cliente: Cliente, identidadId: string): Promise<void> {
  if (!(await esProfesionalDeNutricion(cliente, identidadId))) throw errores.accionNoPermitida();
}
