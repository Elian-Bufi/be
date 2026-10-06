import {
  CodigoDeError,
  ValorNoCalculable,
  cantidadDeUnaPorcion,
  type ContenidoDeInstantanea,
  type ContenidoDePlan,
  type EstructuraDePlanEntrada,
  type IngredienteDeReceta,
  type RecetaDeOpcion,
  type ValidationIssue,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { ErrorDeApi } from '../http/errores';
import type { CatalogoService } from './catalogo.service';
import { recetaEnInstantanea, referenciaDeReceta, type RecetaEnInstantanea } from './lectura-recetas';

type Tx = Prisma.TransactionClient;

/**
 * DL-119 · una opción de una comida del plan que nace de una versión de receta propia (API-NUT-07 y 10).
 * - La entrada trae `{ label, items: [], recipeVersionId }`. Los ítems los arma el servidor: los ingredientes de esa versión
 *   escalados a **una porción** (`cantidadDeUnaPorcion`), con su elemento, la versión del catálogo que cita la receta, la
 *   unidad y el estado. Si la entrada trae ítems, se rechaza: no se descartan en silencio.
 * - El contenido del borrador guarda la referencia (`recipeVersionId`) y, en cada ítem, la versión del catálogo de la
 *   receta. Al activar, la instantánea congela la receta y las composiciones de esas versiones, no las vigentes.
 * - «Hoy» (API-NUT-14) no muestra nada de esto: la APK instalada valida con un esquema estricto (DL-121).
 */

/** Lo que una opción nacida de una receta suma al contenido del borrador. */
type OpcionDeContenido = ContenidoDePlan['dayTypes'][number]['meals'][number]['options'][number] & { readonly recipeVersionId?: string };
type ItemDeContenido = OpcionDeContenido['items'][number] & { readonly catalogItemVersionId?: string; readonly name?: string };
/** Lo que una opción nacida de una receta suma a la instantánea. */
type OpcionDeInstantanea = ContenidoDeInstantanea['dayTypes'][number]['meals'][number]['options'][number] & { readonly recipe?: RecetaEnInstantanea };

/** La versión de receta citada por una opción del contenido, si la hay. */
export function recetaDeLaOpcion(o: unknown): string | null {
  const id = (o as { recipeVersionId?: unknown }).recipeVersionId;
  return typeof id === 'string' ? id : null;
}

/** La receta que congeló una opción de la instantánea, si nació de una. */
export const recetaCongelada = (o: unknown): RecetaEnInstantanea | null => (o as OpcionDeInstantanea).recipe ?? null;

/**
 * Identificador estable de un ítem nacido de una receta: el mismo para la misma opción, versión de receta y lugar. Guardar
 * el borrador otra vez con la misma receta no cambia los ítems; la forma es la de un UUID (v5 sobre SHA-1).
 */
function idDeItem(opcionId: string, versionDeRecetaId: string, orden: number): string {
  const h = createHash('sha1').update(`be-opcion-de-receta|${opcionId}|${versionDeRecetaId}|${orden}`).digest();
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

/**
 * El contenido normalizado con las opciones de receta resueltas. `entrada` y `contenido` tienen la misma forma (el
 * contenido es la entrada con identificadores): las opciones se corresponden por posición.
 */
export async function conOpcionesDeReceta(tx: Tx, profesionalId: string, entrada: EstructuraDePlanEntrada, contenido: ContenidoDePlan): Promise<ContenidoDePlan> {
  const citadas = entrada.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => (o.recipeVersionId ? [o.recipeVersionId] : []))));
  if (citadas.length === 0) return contenido;
  const validas = [...new Set(citadas)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  // Solo una receta propia: la de otro profesional (o una versión inexistente) es una referencia inválida, sin distinguir.
  const versiones = new Map(
    (validas.length ? await tx.versionDeReceta.findMany({ where: { id: { in: validas }, receta: { profesionalId } } }) : []).map((v) => [v.id, v]),
  );
  const issues: ValidationIssue[] = [];
  const resuelto: ContenidoDePlan = {
    dayTypes: contenido.dayTypes.map((d, i) => ({
      ...d,
      meals: d.meals.map((m, j) => ({
        ...m,
        options: m.options.map((o, k) => {
          const citada = entrada.dayTypes[i]?.meals[j]?.options[k];
          if (!citada?.recipeVersionId) return o;
          const ruta = `dayTypes[${i}].meals[${j}].options[${k}]`;
          if (citada.items.length > 0) issues.push({ code: 'RECIPE_OPTION_ITEMS_FROM_RECIPE', path: `${ruta}.items` });
          const v = versiones.get(citada.recipeVersionId);
          if (!v) {
            issues.push({ code: 'RECIPE_REFERENCE_INVALID', path: `${ruta}.recipeVersionId` });
            return o;
          }
          const items: ItemDeContenido[] = (v.ingredientes as unknown as IngredienteDeReceta[]).map((ing, l) => {
            let valor: number;
            try {
              valor = cantidadDeUnaPorcion(ing.quantity.value, v.porciones);
            } catch (e) {
              if (!(e instanceof ValorNoCalculable)) throw e;
              valor = 0;
            }
            // Una porción que redondeada a 0,1 da cero no se puede prescribir (el plan exige cantidades positivas).
            if (valor <= 0) issues.push({ code: 'RECIPE_PORTION_NOT_REPRESENTABLE', path: `${ruta}.recipeVersionId` });
            return {
              itemId: idDeItem(o.optionId, v.id, l + 1),
              catalogItemId: ing.catalogItemId,
              catalogItemVersionId: ing.catalogItemVersionId,
              name: ing.name,
              quantity: { value: valor, unit: ing.quantity.unit },
              preparationState: ing.preparationState,
              note: null,
            };
          });
          const opcion: OpcionDeContenido = { optionId: o.optionId, label: o.label, items, recipeVersionId: v.id };
          return opcion;
        }),
      })),
    })),
  };
  if (issues.length > 0) throw new ErrorDeApi(422, CodigoDeError.NUTRITION_PLAN_STRUCTURE_INVALID, 'Hay opciones de receta que no se pueden agregar al plan.', { issues });
  return resuelto;
}

/** Rechaza las opciones de receta donde no se admiten (plantillas TPN y comidas habituales HAN): no se descartan en silencio. */
export function opcionesDeRecetaNoAdmitidas(opciones: readonly { readonly options: readonly { readonly recipeVersionId?: string }[]; readonly ruta: string }[]): ValidationIssue[] {
  return opciones.flatMap((m) => m.options.flatMap((o, k) => (o.recipeVersionId !== undefined ? [{ code: 'RECIPE_OPTION_NOT_ALLOWED', path: `${m.ruta}.options[${k}].recipeVersionId` }] : [])));
}

/** La referencia a la receta de cada opción de un borrador, por versión de receta (las lecturas del profesional). */
export async function recetasDelBorrador(tx: Tx, contenido: ContenidoDePlan): Promise<Map<string, RecetaDeOpcion>> {
  const ids = [...new Set(contenido.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => recetaDeLaOpcion(o) ?? []))))];
  if (ids.length === 0) return new Map();
  const versiones = await tx.versionDeReceta.findMany({ where: { id: { in: ids } } });
  return new Map(versiones.map((v) => [v.id, referenciaDeReceta(recetaEnInstantanea(v))]));
}

/**
 * La instantánea con las recetas congeladas (REG-06-105): cada opción nacida de una receta guarda su referencia (con
 * descripción y pasos) y sus ítems llevan la versión del catálogo **que cita la receta**, con su nombre y su composición,
 * no la vigente del elemento. La activación la guarda así, y la huella se calcula sobre esto.
 */
export async function instantaneaConRecetas(tx: Tx, catalogo: CatalogoService, contenido: ContenidoDePlan, instantanea: ContenidoDeInstantanea): Promise<ContenidoDeInstantanea> {
  const opciones = contenido.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options));
  const ids = [...new Set(opciones.flatMap((o) => recetaDeLaOpcion(o) ?? []))];
  if (ids.length === 0) return instantanea;
  const recetas = new Map((await tx.versionDeReceta.findMany({ where: { id: { in: ids } } })).map((v) => [v.id, recetaEnInstantanea(v)]));
  const versionesDelCatalogo = await catalogo.versionesPorId(
    tx,
    opciones.flatMap((o) => (recetaDeLaOpcion(o) ? o.items.flatMap((it) => (it as ItemDeContenido).catalogItemVersionId ?? []) : [])),
  );
  return {
    dayTypes: instantanea.dayTypes.map((d, i) => ({
      ...d,
      meals: d.meals.map((m, j) => ({
        ...m,
        options: m.options.map((o, k) => {
          const deContenido = contenido.dayTypes[i]?.meals[j]?.options[k];
          const receta = deContenido ? recetas.get(recetaDeLaOpcion(deContenido) ?? '') : undefined;
          if (!deContenido || !receta) return o;
          const opcion: OpcionDeInstantanea = {
            ...o,
            recipe: receta,
            items: o.items.map((it, l) => {
              const citada = versionesDelCatalogo.get((deContenido.items[l] as ItemDeContenido | undefined)?.catalogItemVersionId ?? '');
              return citada ? { ...it, catalogItemVersionId: citada.versionId, name: citada.nombre, composition: citada.composicion } : it;
            }),
          };
          return opcion;
        }),
      })),
    })),
  };
}

/** El nombre y la versión del catálogo que congela un ítem nacido de una receta, para leer un borrador. */
export function versionCitadaDelItem(it: unknown): { readonly catalogItemVersionId: string; readonly name: string } | null {
  const item = it as ItemDeContenido;
  return item.catalogItemVersionId && item.name ? { catalogItemVersionId: item.catalogItemVersionId, name: item.name } : null;
}
