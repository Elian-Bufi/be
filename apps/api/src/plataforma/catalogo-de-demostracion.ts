import { ofreceElCatalogoDeDemostracion, PROCEDENCIA_DE_DEMOSTRACION } from '@be/domain';
import { Prisma } from '@prisma/client';
import type { Entorno } from '../config/entorno';

/**
 * UF-09 de WP-USO-FINAL (DL-169; UF-D10): el catálogo de demostración, según el ambiente de la API.
 *
 * Las migraciones de WP-04 y de WP-05 siembran alimentos con valores sintéticos y ejercicios de ejemplo (procedencia
 * `BE_SYNTHETIC_SEED`). En producción no se ofrecen ni se aceptan en nada nuevo; en `test` y en desarrollo, todo sigue
 * igual. La regla vive en el dominio (`ofreceElCatalogoDeDemostracion`) y se aplica en un solo lugar de cada catálogo: el
 * criterio de lo que un actor ve (`alimentoVisible` y `ejercicioVisible`). Así alcanza a los buscadores, a las fichas
 * visuales, a los habituales y a cada validación de lo que se cita (un plan, una plantilla, una receta, una comida
 * habitual o un registro). Lo que ya está citado se lee sin este filtro: la historia no se borra.
 */
export function ofreceDemostracion(entorno: Pick<Entorno, 'appEnv'>): boolean {
  return ofreceElCatalogoDeDemostracion(entorno.appEnv);
}

/**
 * La condición sobre el elemento o el ejercicio `e` (la consulta tiene que llamarlo así): en `test` y en desarrollo no
 * deja nada afuera; en producción, deja afuera lo sembrado como demostración.
 */
export function sinLoDeDemostracion(ofrece: boolean): Prisma.Sql {
  return ofrece ? Prisma.sql`TRUE` : Prisma.sql`e."procedencia" <> ${PROCEDENCIA_DE_DEMOSTRACION}::"ProcedenciaDeCatalogo"`;
}
