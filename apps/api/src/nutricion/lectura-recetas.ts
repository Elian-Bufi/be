import {
  METODO_DE_CALCULO_NUTRICIONAL,
  ValorNoCalculable,
  calcularNutrientes,
  dividirPorPorciones,
  nutrientesDelResultado,
  type CalculoDeReceta,
  type ComposicionParaCalcular,
  type ImagenDeReceta,
  type EstadoDePropuesta,
  type IngredienteDeReceta,
  type PropuestaDeLaReceta,
  type Receta,
  type RecetaDeOpcion,
  type RutasDeLaImagen,
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

/** DL-191: lo que el Recetario de BE suma a una receta: de quién es, de cuál se copió y su última propuesta. */
export interface DatosDelRecetario {
  readonly origen: Receta['origin'];
  readonly copiaDe: Receta['copiedFrom'];
  readonly propuesta: PropuestaDeLaReceta | null;
}

const SIN_RECETARIO: DatosDelRecetario = { origen: 'OWN', copiaDe: null, propuesta: null };
const ESTADO_DE_LA_DECISION: Readonly<Record<'SUMADA' | 'RECHAZADA', EstadoDePropuesta>> = { SUMADA: 'ADDED', RECHAZADA: 'REJECTED' };

/** DL-191 · de cada receta: si es del recetario, de cuál se copió (con el nombre de su versión vigente) y su última propuesta. */
export async function datosDelRecetario(tx: Tx, recetaIds: readonly string[]): Promise<Map<string, DatosDelRecetario>> {
  const ids = [...new Set(recetaIds)];
  if (ids.length === 0) return new Map();
  // Una consulta después de la otra: van por la conexión de la transacción.
  const delRecetario = await tx.recetaDelRecetario.findMany({ where: { recetaId: { in: ids } }, select: { recetaId: true } });
  const copias = await tx.$queryRaw<{ recetaId: string; origenId: string; nombre: string }[]>`
      SELECT c."receta_id"::text AS "recetaId", c."origen_id"::text AS "origenId", v."nombre"
        FROM "copia_de_receta_del_recetario" c
        JOIN "version_de_receta" v ON v."receta_id" = c."origen_id"
       WHERE c."receta_id" = ANY(${ids}::uuid[])
         AND NOT EXISTS (SELECT 1 FROM "version_de_receta" s WHERE s."predecesora_id" = v."id")`;
  const propuestas = await tx.$queryRaw<{ recetaId: string; propuestaId: string; numero: number; propuesta: Date; resultado: 'SUMADA' | 'RECHAZADA' | null; decidida: Date | null; motivo: string | null }[]>`
      SELECT DISTINCT ON (p."receta_id") p."receta_id"::text AS "recetaId", p."id"::text AS "propuestaId", v."numero",
             p."momento_de_registro" AS "propuesta", d."resultado"::text AS "resultado", d."momento_de_registro" AS "decidida", d."motivo"
        FROM "propuesta_al_recetario" p
        JOIN "version_de_receta" v ON v."id" = p."version_de_receta_id"
        LEFT JOIN "decision_sobre_propuesta_al_recetario" d ON d."propuesta_id" = p."id"
       WHERE p."receta_id" = ANY(${ids}::uuid[])
       ORDER BY p."receta_id", p."momento_de_registro" DESC, p."id" DESC`;
  const canon = new Set(delRecetario.map((f) => f.recetaId));
  const copiaDe = new Map(copias.map((c) => [c.recetaId, { recipeId: c.origenId, name: c.nombre }]));
  const ultima = new Map(
    propuestas.map((p) => [
      p.recetaId,
      {
        proposalId: p.propuestaId,
        status: p.resultado ? ESTADO_DE_LA_DECISION[p.resultado] : ('PENDING' as const),
        versionNumber: p.numero,
        proposedAt: p.propuesta.toISOString(),
        decidedAt: p.decidida?.toISOString() ?? null,
        reason: p.motivo,
      } satisfies PropuestaDeLaReceta,
    ]),
  );
  return new Map<string, DatosDelRecetario>(ids.map((id) => [id, { origen: canon.has(id) ? 'BE_RECIPE_BOOK' : 'OWN', copiaDe: copiaDe.get(id) ?? null, propuesta: ultima.get(id) ?? null }]));
}

/**
 * Las recetas completas, en el orden de `filas`: versión vigente, imagen y lo del recetario. `rutasDelRecetario`, si se
 * pasa, firma la miniatura y la grande de la imagen de las recetas del recetario (DL-191, REC-D10).
 */
export async function leerRecetas(tx: Tx, filas: readonly FilaDeReceta[], rutasDelRecetario?: (medioId: string) => RutasDeLaImagen): Promise<Receta[]> {
  const ids = filas.map((r) => r.id);
  const versiones = await versionesVigentes(tx, ids);
  const imagenes = await imagenesVigentes(tx, ids);
  const datos = await datosDelRecetario(tx, ids);
  return filas.map((r) => {
    const v = versiones.get(r.id);
    if (!v) throw errores.interno();
    const d = datos.get(r.id) ?? SIN_RECETARIO;
    const imagen = imagenes.get(r.id) ?? null;
    const conRutas = imagen && rutasDelRecetario && d.origen === 'BE_RECIPE_BOOK' ? { ...imagen, paths: rutasDelRecetario(imagen.mediaId) } : imagen;
    return recetaApi(r, v, conRutas, d);
  });
}

export function recetaApi(r: FilaDeReceta, v: VersionDeReceta, imagen: ImagenDeReceta | null, datos: DatosDelRecetario = SIN_RECETARIO): Receta {
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
    origin: datos.origen,
    copiedFrom: datos.copiaDe,
    proposal: datos.propuesta,
  };
}

/** La receta completa por su identidad, para responder después de escribir. */
export async function leerReceta(tx: Tx, recetaId: string, rutasDelRecetario?: (medioId: string) => RutasDeLaImagen): Promise<Receta> {
  const r = await tx.receta.findUniqueOrThrow({ where: { id: recetaId } });
  const [receta] = await leerRecetas(tx, [r], rutasDelRecetario);
  return receta!;
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
