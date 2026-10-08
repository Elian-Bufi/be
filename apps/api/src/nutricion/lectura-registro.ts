import {
  calcularNutrientes,
  nutrientesDelResultado,
  type ContenidoDeInstantanea,
  type Nutrientes,
  type OpcionConMacros,
  type RegistroDeComida,
} from '@be/domain';
import type {
  AnulacionDeIngesta,
  CorreccionDeIngesta,
  EvidenciaVisualDeIngesta,
  IngestaNutricional,
  Medio,
  Prisma,
  RectificacionDeCantidades,
} from '@prisma/client';
import { token } from '../vinculo/lectura';
import { cantidadesEfectivas, type CantidadesConsumidas } from './cantidades-consumidas';
import { imagenesVigentes } from './lectura-recetas';
import { recetaCongelada } from './opciones-de-receta';

type Tx = Prisma.TransactionClient;

/**
 * Modelos de lectura del registro v2 de comidas (DL-121; contratos-registro-de-comidas.ts). Todo sale de la instantánea de
 * la versión que el registro referencia, nunca del plan vigente ni de la receta actual: si la receta o el plan cambian
 * después, el registro conserva su significado (REG-06-105).
 */

export const INCLUIR_REGISTRO = { correcciones: true, anulacion: true, rectificaciones: true, evidencias: { include: { medio: true } } } as const;
/** Lo que necesita la forma v1 (`IngestaSchema`): las correcciones y las rectificaciones, para la vista efectiva. */
export const INCLUIR_PARA_V1 = { correcciones: true, rectificaciones: true } as const;

export type IngestaConTodo = IngestaNutricional & {
  correcciones: CorreccionDeIngesta[];
  anulacion: AnulacionDeIngesta | null;
  rectificaciones: RectificacionDeCantidades[];
  evidencias: (EvidenciaVisualDeIngesta & { medio: Medio })[];
};

/** La versión de un registro, para `expectedVersion`: avanza con cada rectificación y con la anulación. */
export const versionDelRegistro = (i: Pick<IngestaConTodo, 'rectificaciones' | 'anulacion'>): number => 1 + i.rectificaciones.length + (i.anulacion ? 1 : 0);

type DiaDeInstantanea = ContenidoDeInstantanea['dayTypes'][number];
type ComidaDeInstantanea = DiaDeInstantanea['meals'][number];
export type OpcionDeInstantanea = ComidaDeInstantanea['options'][number];

/** La comida de una instantánea por su identificador, en el día tipo indicado o en cualquiera. */
export function comidaDe(instantanea: ContenidoDeInstantanea, mealId: string, dayTypeId?: string | null): ComidaDeInstantanea | null {
  for (const d of instantanea.dayTypes) {
    if (dayTypeId && d.dayTypeId !== dayTypeId) continue;
    const m = d.meals.find((x) => x.mealId === mealId);
    if (m) return m;
  }
  return null;
}

/**
 * Los macros ya calculados, por opción congelada y por cantidades. El cálculo es puro y exacto (racionales), y en una
 * lectura larga cientos de registros repiten la misma opción con las mismas cantidades: un año de comidas pasaba de
 * calcularlo 2.900 veces a una decena (PRO-24). La clave es el objeto de la opción de la instantánea leída en esa
 * consulta; una lectura nueva trae objetos nuevos, así que nada se comparte entre consultas ni sobrevive a ellas.
 */
const macrosCalculados = new WeakMap<OpcionDeInstantanea, Map<string, Nutrientes>>();

/**
 * Los macros de los ítems de una opción con las composiciones congeladas: SUM_SOURCE_PER_100G_V1. Cada faltante se nombra
 * por el `itemId`. Sin cantidad, sin dato o en una unidad sin equivalencia, el nutriente queda sin total.
 */
function macros(opcion: OpcionDeInstantanea, cantidades?: CantidadesConsumidas): Nutrientes {
  let calculados = macrosCalculados.get(opcion);
  if (!calculados) {
    calculados = new Map();
    macrosCalculados.set(opcion, calculados);
  }
  const clave = cantidades ? JSON.stringify(cantidades.items) : '';
  const hecho = calculados.get(clave);
  if (hecho) return hecho;
  const informados = new Map((cantidades?.items ?? []).map((i) => [i.itemId, i]));
  const resultado = nutrientesDelResultado(
    calcularNutrientes(
      opcion.items.map((it) => {
        if (!cantidades) return { clave: it.itemId, cantidad: it.quantity, composicion: it.composition };
        const c = informados.get(it.itemId);
        return { clave: it.itemId, cantidad: c && !c.notEaten ? c.quantity : null, composicion: it.composition, noConsumido: c?.notEaten ?? false };
      }),
    ),
  );
  calculados.set(clave, resultado);
  return resultado;
}

/**
 * Una opción con sus macros previstos: los de las cantidades de una porción del plan, calculados con las composiciones
 * de la instantánea («Estimación para las porciones del plan»), no lo consumido.
 */
export function opcionConMacros(opcion: OpcionDeInstantanea, orden: number, imagenes: ReadonlyMap<string, { mediaId: string } | null>): OpcionConMacros {
  const receta = recetaCongelada(opcion);
  return {
    optionId: opcion.optionId,
    label: opcion.label,
    order: orden,
    recipe: receta
      ? { recipeId: receta.recipeId, recipeVersionId: receta.recipeVersionId, versionNumber: receta.versionNumber, name: receta.name, servings: receta.servings, description: receta.description, steps: [...receta.steps] }
      : null,
    image: receta ? (imagenes.get(receta.recipeId) ?? null) : null,
    items: opcion.items.map((it) => ({
      itemId: it.itemId,
      catalogItemVersionId: it.catalogItemVersionId,
      name: it.name,
      quantity: it.quantity,
      preparationState: it.preparationState,
      note: it.note,
    })),
    planned: macros(opcion),
  };
}

/** Las imágenes vigentes de las recetas de las opciones de varias instantáneas: solo el medio (se pide con API-MED-03). */
export async function imagenesDeLasOpciones(tx: Tx, instantaneas: Iterable<ContenidoDeInstantanea>): Promise<Map<string, { mediaId: string } | null>> {
  const ids = [...instantaneas].flatMap((i) => i.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => recetaCongelada(o)?.recipeId ?? []))));
  const imagenes = await imagenesVigentes(tx, ids);
  return new Map([...imagenes].map(([id, img]) => [id, img ? { mediaId: img.mediaId } : null]));
}

/** Las instantáneas de las versiones que referencian unos registros, una vez por versión. */
export async function instantaneasDe(tx: Tx, versionIds: readonly string[]): Promise<Map<string, ContenidoDeInstantanea>> {
  const ids = [...new Set(versionIds)];
  if (ids.length === 0) return new Map();
  const filas = await tx.instantaneaDePlanNutricional.findMany({ where: { versionDePlanId: { in: ids } }, select: { versionDePlanId: true, contenido: true } });
  return new Map(filas.map((f) => [f.versionDePlanId, f.contenido as unknown as ContenidoDeInstantanea]));
}

/**
 * Un registro en la forma v2. La versión del registro avanza con cada rectificación y con la anulación. Una foto
 * suprimida a pedido no figura (08:451). Lo consumido se calcula solo con cantidades confirmadas o informadas: sin
 * confirmar, o una comida diferente, no tiene macros («Macros sin calcular»).
 */
export function registroApi(i: IngestaConTodo, instantanea: ContenidoDeInstantanea | undefined, imagenes: ReadonlyMap<string, { mediaId: string } | null>): RegistroDeComida {
  const prescripta = i.origen === 'PRESCRIPTA';
  const mealId = prescripta ? i.comidaId : i.comidaDeContextoId;
  const dayTypeId = prescripta ? i.diaTipoId : i.diaTipoDeContextoId;
  const comida = instantanea && mealId ? comidaDe(instantanea, mealId, dayTypeId) : null;
  const opcionDelPlan = prescripta ? comida?.options.find((o) => o.optionId === i.opcionId) ?? null : null;
  const orden = opcionDelPlan && comida ? comida.options.indexOf(opcionDelPlan) + 1 : 1;
  const efectivas = cantidadesEfectivas(i);
  const consumido = efectivas && opcionDelPlan && efectivas.cantidades.status !== 'UNCONFIRMED' ? macros(opcionDelPlan, efectivas.cantidades) : null;
  return {
    recordId: i.id,
    version: token(versionDelRegistro(i)),
    kind: prescripta ? 'PLAN_OPTION' : 'DIFFERENT',
    planId: i.versionDePlanId,
    localDate: i.fechaLocal.toISOString().slice(0, 10),
    timeZone: i.zonaHoraria,
    occurredAt: i.momentoDeOcurrencia.toISOString(),
    recordedAt: i.momentoDeRegistro.toISOString(),
    dayTypeId,
    meal: mealId ? { mealId, label: comida?.label ?? '' } : null,
    option: opcionDelPlan ? opcionConMacros(opcionDelPlan, orden, imagenes) : null,
    consumption: efectivas
      ? {
          status: efectivas.cantidades.status,
          items: efectivas.cantidades.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, notEaten: it.notEaten })),
          source: efectivas.fuente,
          rectifiedAt: efectivas.rectificadaEn?.toISOString() ?? null,
        }
      : null,
    consumed: consumido,
    observation: i.observacion,
    description: i.descripcion,
    approximateQuantity: i.descripcionDePorcion,
    evidence: [...i.evidencias]
      .filter((e) => e.medio.estado !== 'SUPRIMIDO')
      .sort((a, b) => a.momentoDeRegistro.getTime() - b.momentoDeRegistro.getTime() || a.id.localeCompare(b.id))
      .map((e) => ({ mediaId: e.medioId, recordedAt: e.momentoDeRegistro.toISOString() })),
    annulment: i.anulacion ? { annulledAt: i.anulacion.momentoDeRegistro.toISOString(), reason: i.anulacion.motivo } : null,
  };
}

/** Varios registros, con las instantáneas y las imágenes que necesitan leídas una sola vez. */
export async function registrosApi(tx: Tx, filas: readonly IngestaConTodo[]): Promise<RegistroDeComida[]> {
  const instantaneas = await instantaneasDe(tx, filas.map((f) => f.versionDePlanId));
  const imagenes = await imagenesDeLasOpciones(tx, instantaneas.values());
  return filas.map((f) => registroApi(f, instantaneas.get(f.versionDePlanId), imagenes));
}
