/**
 * RP-25 (WP-RECORRIDO-PLAN-PULIDO; DL-188, DL-191) · «Guardar como receta»: una opción de alimentos del plan pasa a ser
 * una receta propia, sin React.
 *
 * Dirección (23/11): una opción armada con alimentos sueltos («Galletas de arroz con huevo») no podía tener foto, porque
 * la foto es de la receta (RP-24, RP-D92). Ahora se guarda como receta desde el editor y ahí mismo se le carga la foto:
 * «una vez que carga una foto es porque se vuelve una de sus recetas».
 *
 * - **La receta** (API-REC-01, la operación de siempre): el nombre de la opción, sus alimentos con sus cantidades y su
 *   estado, para **una porción**. Así la porción que arma el servidor para el plan (DL-119, `cantidadDeUnaPorcion`) es la
 *   misma que la persona ya tenía. Las notas de los alimentos pasan a la descripción, que la persona lee junto a la receta.
 * - **Lo que una receta no admite** se dice antes, alimento por alimento, y no se guarda nada: un alimento sin cantidad o
 *   sin estado, una cantidad en unidades (una receta va en gramos o mililitros) o de más de 5000, más de 40 alimentos o
 *   notas que no entran en los 500 caracteres de la descripción.
 * - **La opción pasa a ser esa receta** en el borrador, como si se la hubiera agregado desde el cajón: conserva su
 *   identidad (`optionId`) y su nombre, y cita la versión 1 (`recipeVersionId`, `items: []`). Viaja con el autoguardado.
 *   Son dos escrituras sin transacción conjunta, como en ED-32: si la opción ya no está, la receta igual quedó en Mis
 *   recetas y se dice.
 */
import { ETIQUETA_DE_PREPARACION, type CrearRecetaRequest, type EstructuraDePlanEntrada } from '@be/domain';

type Estructura = EstructuraDePlanEntrada['dayTypes'];
type Opcion = Estructura[number]['meals'][number]['options'][number];
type Item = Opcion['items'][number];

/** Lo que admite una receta (`CalcularRecetaRequestSchema` y `CrearRecetaRequestSchema`). */
export const TOPES_DE_LA_RECETA = { alimentos: 40, cantidad: 5000, descripcion: 500, nombre: 120 } as const;

/** Dónde está la opción que se guarda: su identidad, si la tiene, y si no, su lugar y su nombre. */
export interface LugarDeLaOpcion {
  readonly i: number;
  readonly j: number;
  readonly k: number;
  readonly optionId: string | null;
  readonly label: string;
}

const nombreDe = (it: Pick<Item, 'catalogItemId'>, nombres: Readonly<Record<string, string>>): string => nombres[it.catalogItemId] ?? 'Un alimento';

/** El nombre con el que se guarda la receta: el de la opción, o «Opción 2» si no tiene. */
export const nombreDeLaReceta = (o: Pick<Opcion, 'label'>, k: number): string => (o.label.trim() || `Opción ${k + 1}`).slice(0, TOPES_DE_LA_RECETA.nombre);

/** Las notas de los alimentos, una por renglón («Huevo: bien cocido»), para la descripción; `null` si no hay. */
export function descripcionConLasNotas(items: readonly Item[], nombres: Readonly<Record<string, string>>): string | null {
  const lineas = items.filter((it) => (it.note ?? '').trim() !== '').map((it) => `${nombreDe(it, nombres)}: ${it.note!.trim()}`);
  return lineas.length > 0 ? lineas.join('\n') : null;
}

/** Lo que impide guardar la opción como receta, en renglones; vacío si se puede. */
export function loQueImpide(o: Pick<Opcion, 'items' | 'recipeVersionId'>, nombres: Readonly<Record<string, string>>): string[] {
  if (o.recipeVersionId) return [COPY_OPCION_COMO_RECETA.yaEsReceta];
  if (o.items.length === 0) return [COPY_OPCION_COMO_RECETA.sinAlimentos];
  const lineas: string[] = [];
  if (o.items.length > TOPES_DE_LA_RECETA.alimentos) lineas.push(COPY_OPCION_COMO_RECETA.demasiados(o.items.length));
  for (const it of o.items) {
    const nombre = nombreDe(it, nombres);
    if (!it.quantity) lineas.push(COPY_OPCION_COMO_RECETA.sinCantidad(nombre));
    else if (it.quantity.unit === 'unit') lineas.push(COPY_OPCION_COMO_RECETA.enUnidades(nombre));
    else if (it.quantity.value > TOPES_DE_LA_RECETA.cantidad) lineas.push(COPY_OPCION_COMO_RECETA.demasiadaCantidad(nombre, it.quantity.unit));
    if (!it.preparationState) lineas.push(COPY_OPCION_COMO_RECETA.sinEstado(nombre));
  }
  const notas = descripcionConLasNotas(o.items, nombres);
  if (notas && notas.length > TOPES_DE_LA_RECETA.descripcion) lineas.push(COPY_OPCION_COMO_RECETA.notasLargas(notas.length));
  return lineas;
}

/** Los alimentos como se van a guardar, en renglones: «Huevo, 50 g, Cocido». */
export function loQueLleva(items: readonly Item[], nombres: Readonly<Record<string, string>>): string[] {
  return items.map((it) => {
    const cantidad = it.quantity ? `${String(it.quantity.value).replace('.', ',')} ${it.quantity.unit === 'unit' ? 'u.' : it.quantity.unit}` : 'sin cantidad';
    const estado = it.preparationState ? ETIQUETA_DE_PREPARACION[it.preparationState] : 'sin estado';
    return `${nombreDe(it, nombres)}, ${cantidad}, ${estado}`;
  });
}

/** Si algún alimento se escribió con una medida casera («2 cucharadas»): la receta la guarda en gramos. */
export const conMedidasCaseras = (items: readonly Item[]): boolean => items.some((it) => !!it.householdMeasure);

export type CuerpoDeLaReceta =
  | { readonly tipo: 'listo'; readonly cuerpo: CrearRecetaRequest }
  | { readonly tipo: 'no-se-puede'; readonly lineas: readonly string[] }
  /** Alimentos que el catálogo ya no devuelve (retirados o fuera de lo que se ve): sin su versión no se pueden citar. */
  | { readonly tipo: 'sin-version'; readonly nombres: readonly string[] };

/**
 * El cuerpo de API-REC-01 para la opción `k`, con la versión vigente de cada alimento (API-ALI-04, por identidad). Una
 * porción: las cantidades de la opción, tal cual.
 */
export function cuerpoDeLaReceta(o: Opcion, k: number, nombres: Readonly<Record<string, string>>, versiones: ReadonlyMap<string, string>): CuerpoDeLaReceta {
  const impide = loQueImpide(o, nombres);
  if (impide.length > 0) return { tipo: 'no-se-puede', lineas: impide };
  const sinVersion = [...new Set(o.items.filter((it) => !versiones.has(it.catalogItemId)).map((it) => nombreDe(it, nombres)))];
  if (sinVersion.length > 0) return { tipo: 'sin-version', nombres: sinVersion };
  return {
    tipo: 'listo',
    cuerpo: {
      name: nombreDeLaReceta(o, k),
      servings: 1,
      description: descripcionConLasNotas(o.items, nombres),
      steps: [],
      ingredients: o.items.map((it) => ({
        catalogItemId: it.catalogItemId,
        catalogItemVersionId: versiones.get(it.catalogItemId)!,
        quantity: { value: it.quantity!.value, unit: it.quantity!.unit as 'g' | 'ml' },
        preparationState: it.preparationState!,
      })),
    },
  };
}

/**
 * Un 422 de API-REC-01 (`CATALOG_REFERENCE_INVALID`) dice la ruta de cada ingrediente que no se pudo citar
 * (`ingredients[2].catalogItemVersionId`): los nombres de esos alimentos, sin repetir.
 */
export function alimentosQueNoSePudieron(issues: readonly { readonly path?: string | null }[], o: Pick<Opcion, 'items'>, nombres: Readonly<Record<string, string>>): string[] {
  const nombresVistos = new Set<string>();
  for (const issue of issues) {
    const m = /^ingredients\[(\d+)\]/.exec(issue.path ?? '');
    const it = m ? o.items[Number(m[1])] : undefined;
    if (it) nombresVistos.add(nombreDe(it, nombres));
  }
  return [...nombresVistos];
}

/** Dónde está hoy la opción del lugar: por su identidad o, si es nueva, en su lugar y con su nombre. */
export function dondeEstaLaOpcion(e: Estructura, lugar: LugarDeLaOpcion): { readonly i: number; readonly j: number; readonly k: number } | null {
  if (lugar.optionId) {
    for (let i = 0; i < e.length; i++)
      for (let j = 0; j < e[i]!.meals.length; j++) {
        const k = e[i]!.meals[j]!.options.findIndex((o) => o.optionId === lugar.optionId);
        if (k >= 0) return { i, j, k };
      }
  }
  // Una opción nueva no tiene identidad cuando se abre el cuadro, pero el autoguardado se la puede dar mientras tanto.
  const o = e[lugar.i]?.meals[lugar.j]?.options[lugar.k];
  return o && o.label === lugar.label ? { i: lugar.i, j: lugar.j, k: lugar.k } : null;
}

export type ResultadoDeConvertir =
  | { readonly tipo: 'convertida'; readonly estructura: Estructura; readonly i: number; readonly j: number; readonly k: number }
  | { readonly tipo: 'ya-estaba'; readonly i: number; readonly j: number; readonly k: number }
  | { readonly tipo: 'no-se-pudo' };

/**
 * La opción del lugar pasa a citar la receta: conserva su identidad y su nombre; los ítems los arma el servidor al
 * guardar (DL-119). No toca `e`. Si ya cita esa versión (un reintento), no hace nada.
 */
export function opcionComoReceta(e: Estructura, lugar: LugarDeLaOpcion, receta: { readonly recipeVersionId: string }): ResultadoDeConvertir {
  const donde = dondeEstaLaOpcion(e, lugar);
  if (!donde) return { tipo: 'no-se-pudo' };
  const o = e[donde.i]!.meals[donde.j]!.options[donde.k]!;
  if (o.recipeVersionId === receta.recipeVersionId) return { tipo: 'ya-estaba', ...donde };
  if (o.recipeVersionId) return { tipo: 'no-se-pudo' };
  const nueva = structuredClone(e) as Estructura;
  const { optionId, label } = o;
  nueva[donde.i]!.meals[donde.j]!.options[donde.k] = { ...(optionId ? { optionId } : {}), label, items: [], recipeVersionId: receta.recipeVersionId };
  return { tipo: 'convertida', estructura: nueva, ...donde };
}

export const COPY_OPCION_COMO_RECETA = {
  guardarComoReceta: 'Guardar como receta',
  agregarFoto: 'Agregar foto',
  /** El nombre accesible del acceso de la cabecera: qué hace, completo. */
  agregarFotoA: (opcion: string) => `Agregar foto a ${opcion}: se guarda como receta`,
  titulo: (opcion: string) => `Guardar «${opcion}» como receta`,
  /** La línea de arriba cuando se llegó por la foto. */
  laFotoEsDeLaReceta: 'Una foto es de una receta. Para sumarla, esta opción se guarda en Mis recetas y pasa a ser esa receta.',
  queHace: 'Se guarda en Mis recetas y esta opción pasa a ser esa receta. Después le podés sumar una foto.',
  loQueLleva: 'Lo que lleva, para una porción:',
  laPersonaVeLoMismo: 'La persona ve los mismos alimentos y cantidades.',
  notasALaDescripcion: 'Las notas de los alimentos pasan a la descripción de la receta: la persona las sigue leyendo.',
  medidasEnGramos: 'Las medidas caseras quedan en gramos en la receta.',
  noSePuedeTodavia: 'Antes de guardarla como receta:',
  apagado: 'Primero, lo que falta arriba.',
  guardando: 'Guardando…',
  sinAlimentos: 'La opción todavía no tiene alimentos.',
  yaEsReceta: 'Esta opción ya es una receta.',
  demasiados: (n: number) => `Una receta lleva hasta ${TOPES_DE_LA_RECETA.alimentos} alimentos; esta opción tiene ${n}.`,
  sinCantidad: (alimento: string) => `${alimento}: falta la cantidad.`,
  enUnidades: (alimento: string) => `${alimento}: está en unidades; una receta va en gramos o mililitros.`,
  demasiadaCantidad: (alimento: string, unidad: string) => `${alimento}: una receta admite hasta ${TOPES_DE_LA_RECETA.cantidad} ${unidad} por alimento.`,
  sinEstado: (alimento: string) => `${alimento}: falta el estado de preparación.`,
  notasLargas: (n: number) => `Las notas de los alimentos suman ${n} caracteres y la descripción de una receta admite ${TOPES_DE_LA_RECETA.descripcion}. Acortalas.`,
  sinVersion: (alimentos: readonly string[]) => `No pudimos usar ${alimentos.join(', ')}: ya no ${alimentos.length === 1 ? 'está' : 'están'} en el catálogo. Cambialo en la opción y volvé a intentar.`,
  noSePudieron: (alimentos: readonly string[]) => `La receta no se guardó: ${alimentos.join(', ')} no se ${alimentos.length === 1 ? 'puede' : 'pueden'} usar en una receta.`,
  guardada: (receta: string) => `«${receta}» quedó en Mis recetas (versión 1) y la opción ahora es esa receta.`,
  guardadaSinOpcion: (receta: string) => `«${receta}» quedó en Mis recetas (versión 1), pero la opción ya no está en la versión en preparación: no se cambió.`,
  fotoTitulo: 'La foto de la receta (opcional)',
  fotoQueEs: 'Es una referencia del plato: no mide la porción. Aparece en la cabecera de la opción y en la app de la persona.',
  volver: 'Volver al plan',
} as const;
