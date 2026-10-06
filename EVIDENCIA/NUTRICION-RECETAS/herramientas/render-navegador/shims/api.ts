// El cliente de la API en el render de Nutrición: datos SINTÉTICOS por escena (?escena=...). No hay red ni cuentas.
// - Las opciones son las tres recetas del paquete de Dirección (BE_Nutricion_Demo_2026-10-05): sus nombres, sus
//   ingredientes con los nombres de los alimentos USDA, sus pasos y sus fotos. Los macros NO se escriben a mano: los
//   calcula el dominio (`calcularNutrientes`, método SUM_SOURCE_PER_100G_V1) con los valores cada 100 g del paquete, como
//   la API.
// - Cada respuesta se valida con el esquema estricto de su contrato en @be/domain: si no cumpliera, el render falla.
// - Las fotos de las recetas son los PNG del paquete (salida/fotos). La «foto de la persona» de una comida diferente es
//   una de esas imágenes, usada como dato sintético: no hay fotos privadas reales.
import {
  AccesoAMedioResponseSchema,
  calcularNutrientes,
  cantidadDeUnaPorcion,
  HoyConOpcionesResponseSchema,
  IntencionDeSubidaResponseSchema,
  ListaDeRegistrosDeComidaResponseSchema,
  nutrientesDelResultado,
  RegistroDeComidaResponseSchema,
  type Nutrientes,
} from '@be/domain';
import alimentos from '@paquete-nutricion/alimentos_usda_100g.json';
import recetas from '@paquete-nutricion/recetas_demo.json';

const parametros = new URLSearchParams(globalThis.location?.search ?? '');
const escena = parametros.get('escena') ?? 'nutricion-hoy';

type R = Promise<any>;
const ok = (datos: unknown): R => Promise.resolve({ ok: true, datos });
const nunca = (): R => new Promise(() => undefined);
const sinRed = (): R => Promise.resolve({ ok: false, tipo: 'RED' });
const noEncontrado = (): R => Promise.resolve({ ok: false, tipo: 'API', status: 404, codigo: 'RESOURCE_NOT_FOUND', issues: [] });

const HOY = '2026-10-05';
const AYER = '2026-10-04';
const ZONA = 'America/Argentina/Buenos_Aires';
const PLAN = 'plan-sintetico-1';
const DIA = 'dia-tipo-habitual';
const en = (minutos: number) => new Date(Date.now() + minutos * 60_000).toISOString();

// ─── El cálculo, con el dominio ─────────────────────────────────────────────────────────────────

const NUTRIENTE: Record<string, string> = { energy_kcal: 'energyKcal', carbohydrate_g: 'carbohydrateG', fat_g: 'fatG', protein_g: 'proteinG', fiber_g: 'fiberG' };
type Alimento = (typeof alimentos.foods)[number];
const alimento = (id: string): Alimento => alimentos.foods.find((a) => a.id === id)!;
const composicion = (id: string) => ({
  referenceAmount: '100g' as const,
  ...Object.fromEntries(Object.entries(NUTRIENTE).map(([clave, nombre]) => [nombre, (alimento(id).nutrients_per_100g as Record<string, string>)[clave]])),
});
/** El aceite se pesa tal como se compra; lo demás, cocido (las fichas del paquete). */
const estado = (id: string) => (id === 'aceite_oliva' ? 'AS_PURCHASED' : 'COOKED');

/** Los nutrientes de unas cantidades, calculados por el dominio como en la API. Sin cantidad: desconocido. */
function macros(items: readonly { readonly alimento: string; readonly gramos: number | null; readonly noComido?: boolean }[]): Nutrientes {
  return nutrientesDelResultado(
    calcularNutrientes(items.map((i) => ({ clave: i.alimento, cantidad: i.gramos === null ? null : { value: i.gramos, unit: 'g' as const }, composicion: composicion(i.alimento), noConsumido: i.noComido }))),
  );
}

// ─── Las opciones: las tres recetas del paquete ─────────────────────────────────────────────────

const IMAGEN = ['imagen-receta-1', 'imagen-receta-2', 'imagen-receta-3'];
function opcionDeReceta(k: number, optionId: string, order: number, imagen: string | null = IMAGEN[k]!) {
  const r = recetas.recipes[k]!;
  const porciones = Number(r.servings);
  const ingredientes = r.items.map((i) => ({ alimento: i.food_id, gramos: cantidadDeUnaPorcion(i.quantity_g, porciones) }));
  return {
    optionId,
    label: r.name,
    order,
    recipe: { recipeId: r.id, recipeVersionId: `${r.id}-v1`, versionNumber: 1, name: r.name, servings: porciones, description: r.description, steps: r.preparation },
    image: imagen ? { mediaId: imagen } : null,
    items: ingredientes.map((i) => ({
      itemId: `${optionId}-${i.alimento}`,
      catalogItemVersionId: `${i.alimento}-v1`,
      name: alimento(i.alimento).name_es,
      quantity: { value: i.gramos, unit: 'g' as const },
      preparationState: estado(i.alimento),
      note: null,
    })),
    planned: macros(ingredientes),
  };
}

const POLLO = opcionDeReceta(0, 'opcion-pollo', 1);
const SALMON = opcionDeReceta(1, 'opcion-salmon', 2, escena.startsWith('nutricion-falla-imagen') ? 'imagen-rota' : IMAGEN[1]!);
const LENTEJAS = opcionDeReceta(2, 'opcion-lentejas', 3, escena.startsWith('nutricion-sin-imagen') ? null : IMAGEN[2]!);
const CENA = opcionDeReceta(2, 'opcion-cena-lentejas', 1);

// ─── Los registros ──────────────────────────────────────────────────────────────────────────────

type Consumo = { status: 'UNCONFIRMED' | 'PLAN_PORTIONS' | 'REPORTED'; items: { itemId: string; quantity: { value: number; unit: 'g' } | null; notEaten: boolean }[] };
const alimentoDelItem = (itemId: string) => itemId.replace(/^opcion-[a-z-]+?-(?=[a-z]+_)/, '');

function deOpcion(p: { id: string; opcion: ReturnType<typeof opcionDeReceta>; comida: [string, string]; fecha: string; hora: string; consumo: Consumo; deshecho?: boolean }) {
  // Lo consumido: con las porciones del plan confirmadas o con lo informado. Sin confirmar, sin calcular.
  const consumed =
    p.consumo.status === 'UNCONFIRMED'
      ? null
      : p.consumo.status === 'PLAN_PORTIONS'
        ? p.opcion.planned
        : macros(p.consumo.items.map((i) => ({ alimento: alimentoDelItem(i.itemId), gramos: i.quantity?.value ?? null, noComido: i.notEaten })));
  const instante = `${p.fecha}T${p.hora}:00.000Z`;
  return {
    recordId: p.id,
    version: 'v1',
    kind: 'PLAN_OPTION' as const,
    planId: PLAN,
    localDate: p.fecha,
    timeZone: ZONA,
    occurredAt: instante,
    recordedAt: instante,
    dayTypeId: DIA,
    meal: { mealId: p.comida[0], label: p.comida[1] },
    option: p.opcion,
    consumption: { ...p.consumo, items: p.consumo.status === 'PLAN_PORTIONS' ? p.opcion.items.map((i) => ({ itemId: i.itemId, quantity: i.quantity, notEaten: false })) : p.consumo.items, source: 'ORIGINAL' as const, rectifiedAt: null },
    consumed,
    observation: null,
    description: null,
    approximateQuantity: null,
    evidence: [],
    annulment: p.deshecho ? { annulledAt: `${p.fecha}T${p.hora}:40.000Z`, reason: null } : null,
  };
}

function diferente(p: { id: string; comida: [string, string] | null; fecha: string; hora: string; descripcion: string | null; cantidad: string | null; fotos: string[] }) {
  const instante = `${p.fecha}T${p.hora}:00.000Z`;
  return {
    recordId: p.id,
    version: 'v1',
    kind: 'DIFFERENT' as const,
    planId: PLAN,
    localDate: p.fecha,
    timeZone: ZONA,
    occurredAt: instante,
    recordedAt: instante,
    dayTypeId: p.comida ? DIA : null,
    meal: p.comida ? { mealId: p.comida[0], label: p.comida[1] } : null,
    option: null,
    consumption: null,
    consumed: null,
    observation: null,
    description: p.descripcion,
    approximateQuantity: p.cantidad,
    evidence: p.fotos.map((mediaId) => ({ mediaId, recordedAt: instante })),
    annulment: null,
  };
}

const DESAYUNO_DIFERENTE = diferente({ id: 'registro-desayuno', comida: ['desayuno', 'Desayuno'], fecha: HOY, hora: '11:10', descripcion: 'Café con leche y dos tostadas con queso.', cantidad: null, fotos: [] });
const ALMUERZO_SIN_CONFIRMAR = deOpcion({ id: 'registro-almuerzo', opcion: POLLO, comida: ['almuerzo', 'Almuerzo'], fecha: HOY, hora: '15:42', consumo: { status: 'UNCONFIRMED', items: [] } });
const MERIENDA_CON_FOTO = diferente({ id: 'registro-merienda', comida: ['merienda', 'Merienda'], fecha: HOY, hora: '19:05', descripcion: 'Un plato de salmón con papa que me convidaron.', cantidad: 'Medio plato', fotos: ['foto-de-la-persona-1'] });
const it = (opcion: ReturnType<typeof opcionDeReceta>, alimentoId: string) => `${opcion.optionId}-${alimentoId}`;
/** Lo informado: el pollo y el arroz, el brócoli sin confirmar, la zanahoria, y «No lo comí» en el aceite. */
const ALMUERZO_INFORMADO = deOpcion({
  id: 'registro-almuerzo-informado',
  opcion: POLLO,
  comida: ['almuerzo', 'Almuerzo'],
  fecha: HOY,
  hora: '15:42',
  consumo: {
    status: 'REPORTED',
    items: [
      { itemId: it(POLLO, 'pollo_asado'), quantity: { value: 100, unit: 'g' }, notEaten: false },
      { itemId: it(POLLO, 'arroz_cocido'), quantity: { value: 160, unit: 'g' }, notEaten: false },
      { itemId: it(POLLO, 'brocoli_cocido'), quantity: { value: 80, unit: 'g' }, notEaten: false },
      { itemId: it(POLLO, 'zanahoria_cocida'), quantity: { value: 70, unit: 'g' }, notEaten: false },
      { itemId: it(POLLO, 'aceite_oliva'), quantity: null, notEaten: true },
    ],
  },
});
const CENA_DE_AYER = deOpcion({ id: 'registro-cena-ayer', opcion: CENA, comida: ['cena', 'Cena'], fecha: AYER, hora: '23:30', consumo: { status: 'PLAN_PORTIONS', items: [] } });
const ALMUERZO_DE_AYER_DESHECHO = deOpcion({ id: 'registro-almuerzo-ayer', opcion: SALMON, comida: ['almuerzo', 'Almuerzo'], fecha: AYER, hora: '15:20', consumo: { status: 'UNCONFIRMED', items: [] }, deshecho: true });

const REGISTROS = [ALMUERZO_INFORMADO, DESAYUNO_DIFERENTE, CENA_DE_AYER, ALMUERZO_DE_AYER_DESHECHO, ALMUERZO_SIN_CONFIRMAR, MERIENDA_CON_FOTO];

// ─── «Hoy» con opciones, por escena ─────────────────────────────────────────────────────────────

function hoyConOpciones() {
  const exito = escena.startsWith('nutricion-exito') && !escena.startsWith('nutricion-exito-diferente');
  const conMerienda = escena.startsWith('nutricion-exito-diferente');
  const records = [DESAYUNO_DIFERENTE, ...(exito ? [ALMUERZO_SIN_CONFIRMAR] : []), ...(conMerienda ? [MERIENDA_CON_FOTO] : [])];
  return HoyConOpcionesResponseSchema.parse({
    data: {
      date: HOY,
      timeZone: ZONA,
      planState: 'AVAILABLE',
      plan: { planId: PLAN, version: 'v3', activatedAt: '2026-10-01T12:00:00.000Z' },
      dayTypes: [{ dayTypeId: DIA, label: 'Día habitual', order: 1 }],
      selectedDayTypeId: DIA,
      meals: [
        { mealId: 'desayuno', label: 'Desayuno', order: 1, options: [], recordId: null },
        { mealId: 'almuerzo', label: 'Almuerzo', order: 2, options: [POLLO, SALMON, LENTEJAS], recordId: exito ? ALMUERZO_SIN_CONFIRMAR.recordId : null },
        { mealId: 'merienda', label: 'Merienda', order: 3, options: [], recordId: null },
        { mealId: 'cena', label: 'Cena', order: 4, options: [CENA], recordId: null },
      ],
      records,
    },
  });
}

/** Cada medio, con el archivo que lo dibuja en el render. La ruta firmada es sintética. */
const ARCHIVO: Record<string, string> = {
  'imagen-receta-1': 'fotos/01_pollo_arroz_verduras.png',
  'imagen-receta-2': 'fotos/02_salmon_papa_brocoli.png',
  'imagen-receta-3': 'fotos/03_lentejas_arroz_verduras.png',
  // La descarga falla: el archivo no existe.
  'imagen-rota': 'fotos/no-existe.png',
  'foto-de-la-persona-1': 'fotos/02_salmon_papa_brocoli.png',
};

export const api = {
  urlDe: (ruta: string): string => ARCHIVO[ruta.replace('/media/content/', '')] ?? 'fotos/no-existe.png',
  accederAMedio: (_t: string, mediaId: string): R => ok(AccesoAMedioResponseSchema.parse({ data: { mediaId, path: `/media/content/${mediaId}`, expiresAt: en(15) } })),
  hoyConOpciones: (): R => (escena === 'nutricion-cargando' ? nunca() : ok(hoyConOpciones())),
  // Registrar queda en vuelo: ninguna escena lo completa (el éxito se muestra con la respuesta de «Hoy»).
  registrarComida: (): R => nunca(),
  rectificarCantidades: (): R => nunca(),
  deshacerRegistroDeComida: (): R => nunca(),
  consultarRegistroDeComida: (_t: string, id: string): R => {
    const r = REGISTROS.find((x) => x.recordId === id);
    return r ? ok(RegistroDeComidaResponseSchema.parse({ data: r })) : noEncontrado();
  },
  listarMisRegistrosDeComida: (): R =>
    ok(ListaDeRegistrosDeComidaResponseSchema.parse({ data: [ALMUERZO_INFORMADO, DESAYUNO_DIFERENTE, CENA_DE_AYER, ALMUERZO_DE_AYER_DESHECHO], page: { limit: 20, nextCursor: null, hasMore: false } })),
  crearIntencionDeSubida: (_t: string, cuerpo: { contentType: string }): R =>
    ok(
      IntencionDeSubidaResponseSchema.parse({
        data: { mediaId: 'foto-nueva', uploadPath: '/media/uploads/ruta-sintetica', method: 'PUT', contentType: cuerpo.contentType, maxBytes: 10 * 1024 * 1024, expiresAt: en(10) },
      }),
    ),
  // La subida de la foto no llega: sin red.
  subirMedio: (): R => sinRed(),
  // La estimación del profesional (API-NUT-16): en estas escenas no hay.
  consultarIngesta: (): R => noEncontrado(),
  hoyNutricional: (): R => nunca(),
  consultarCuenta: (): R => nunca(),
};
export const apiConfigurada = true;
export const extra = {};
export const nuevaClaveDeIdempotencia = () => `apk-render-${Math.random().toString(36).slice(2, 10)}`;
