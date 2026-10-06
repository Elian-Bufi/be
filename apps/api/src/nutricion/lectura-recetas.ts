import {
  METODO_DE_CALCULO_NUTRICIONAL,
  ValorNoCalculable,
  calcularNutrientes,
  dividirPorPorciones,
  nutrientesDelResultado,
  type CalculoDeReceta,
  type ComposicionParaCalcular,
  type ImagenDeReceta,
  type IngredienteDeReceta,
  type Receta,
  type RecetaDeOpcion,
} from '@be/domain';
import type { Prisma, Receta as FilaDeReceta, VersionDeReceta } from '@prisma/client';
import { errores } from '../http/errores';
import { PROCEDENCIA_HACIA_API } from '../medios/medios.service';
import { token } from '../vinculo/lectura';

type Tx = Prisma.TransactionClient;

/**
 * Modelos de lectura de REC (DL-119; contratos-recetas.ts). Una receta se lee de su versión vigente (la terminal de la
 * cadena) y de la última asociación de imagen. Los ingredientes y el cálculo se guardaron con la versión: no se releen del
 * catálogo, que puede haber emitido otra versión del elemento.
 */

export const RECURSO_RECETA = 'Receta';

/** Lo que una opción de un plan congela de la receta de la que nació (la instantánea; también el detalle de la APK). */
export type RecetaEnInstantanea = RecetaDeOpcion & { readonly description: string | null; readonly steps: readonly string[] };

/**
 * SUM_SOURCE_PER_100G_V1 sobre los ingredientes de una receta: el total y el de una porción. Cada faltante se nombra por
 * el número de orden del ingrediente, en base 1 («1», «2»…), el mismo `order` del contrato. El cliente no manda totales:
 * esto corre cada vez que se calcula o se guarda.
 */
export function calcularReceta(porciones: number, ingredientes: readonly { readonly quantity: { readonly value: number; readonly unit: 'g' | 'ml' }; readonly composicion: ComposicionParaCalcular | null }[]): CalculoDeReceta {
  try {
    const total = calcularNutrientes(ingredientes.map((ing, i) => ({ clave: String(i + 1), cantidad: ing.quantity, composicion: ing.composicion })));
    return { method: METODO_DE_CALCULO_NUTRICIONAL, total: nutrientesDelResultado(total), perServing: nutrientesDelResultado(dividirPorPorciones(total, porciones)) };
  } catch (e) {
    // El esquema ya rechaza cantidades negativas o no numéricas; una composición del catálogo que no se pueda calcular se
    // informa como un dato que falta corregir, nunca como un total inventado.
    if (e instanceof ValorNoCalculable) throw errores.validacionFallida([{ code: 'VALUE_NOT_CALCULABLE', path: 'ingredients' }]);
    throw e;
  }
}

/** La imagen vigente de cada receta: la última asociación, si asocia un medio; si la última retira, `null`. */
export async function imagenesVigentes(tx: Tx, recetaIds: readonly string[]): Promise<Map<string, ImagenDeReceta | null>> {
  const ids = [...new Set(recetaIds)];
  if (ids.length === 0) return new Map();
  const filas = await tx.$queryRaw<
    { recetaId: string; cambio: 'ASOCIAR' | 'RETIRAR'; medioId: string | null; momento: Date; procedencia: 'GENERADA_POR_IA' | 'APORTADA_POR_LA_PERSONA' | null; autoria: string | null; ancho: number | null; alto: number | null }[]
  >`
    SELECT DISTINCT ON (a."receta_id") a."receta_id"::text AS "recetaId", a."cambio"::text AS "cambio", a."medio_id"::text AS "medioId",
           a."momento_de_registro" AS "momento", m."procedencia_de_imagen"::text AS "procedencia", m."autoria",
           m."ancho_procesado" AS "ancho", m."alto_procesado" AS "alto"
      FROM "asociacion_de_imagen_de_receta" a
      LEFT JOIN "medio" m ON m."id" = a."medio_id"
     WHERE a."receta_id" = ANY(${ids}::uuid[])
     ORDER BY a."receta_id", a."numero" DESC`;
  const imagenes = new Map<string, ImagenDeReceta | null>(ids.map((id) => [id, null]));
  for (const f of filas) {
    if (f.cambio !== 'ASOCIAR' || !f.medioId || !f.procedencia || !f.ancho || !f.alto) continue;
    imagenes.set(f.recetaId, { mediaId: f.medioId, provenance: PROCEDENCIA_HACIA_API[f.procedencia], authorship: f.autoria, width: f.ancho, height: f.alto, attachedAt: f.momento.toISOString() });
  }
  return imagenes;
}

/** La versión vigente (terminal) de cada receta. */
export async function versionesVigentes(tx: Tx, recetaIds: readonly string[]): Promise<Map<string, VersionDeReceta>> {
  const ids = [...new Set(recetaIds)];
  if (ids.length === 0) return new Map();
  const filas = await tx.versionDeReceta.findMany({ where: { recetaId: { in: ids }, sucesora: { is: null } } });
  return new Map(filas.map((v) => [v.recetaId, v]));
}

export function recetaApi(r: FilaDeReceta, v: VersionDeReceta, imagen: ImagenDeReceta | null): Receta {
  return {
    recipeId: r.id,
    version: token(r.version),
    recipeVersionId: v.id,
    versionNumber: v.numero,
    name: v.nombre,
    description: v.descripcion,
    servings: v.porciones,
    ingredients: v.ingredientes as unknown as IngredienteDeReceta[],
    steps: v.pasos as unknown as string[],
    calculation: v.resultado as unknown as CalculoDeReceta,
    image: imagen,
    createdAt: r.momentoDeRegistro.toISOString(),
    updatedAt: r.momentoDeActualizacion.toISOString(),
  };
}

/** La receta completa por su identidad, para responder después de escribir. */
export async function leerReceta(tx: Tx, recetaId: string): Promise<Receta> {
  const r = await tx.receta.findUniqueOrThrow({ where: { id: recetaId } });
  const v = (await versionesVigentes(tx, [r.id])).get(r.id);
  if (!v) throw errores.interno();
  return recetaApi(r, v, (await imagenesVigentes(tx, [r.id])).get(r.id) ?? null);
}

/** Lo que la opción de un plan guarda de una versión de receta: la referencia, más descripción y pasos para el detalle. */
export function recetaEnInstantanea(v: VersionDeReceta): RecetaEnInstantanea {
  return {
    recipeId: v.recetaId,
    recipeVersionId: v.id,
    versionNumber: v.numero,
    name: v.nombre,
    servings: v.porciones,
    description: v.descripcion,
    steps: v.pasos as unknown as string[],
  };
}

/** La referencia del contrato (RecetaDeOpcionSchema, estricto): sin descripción ni pasos. */
export function referenciaDeReceta(r: RecetaDeOpcion): RecetaDeOpcion {
  return { recipeId: r.recipeId, recipeVersionId: r.recipeVersionId, versionNumber: r.versionNumber, name: r.name, servings: r.servings };
}
