/**
 * WP-NUTRICION-RECETAS (DL-119 a DL-121): los contratos de recetas, medios y registro v2, su copy, sus declaraciones en
 * el OpenAPI y la compatibilidad con la APK instalada. El cálculo tiene su propia prueba (`calculo-nutricional.test.ts`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { terminosProhibidosEn } from './copy-nutricion';
import { COPY_RECETAS, COPY_REGISTRO_DE_COMIDAS, ETIQUETA_DE_FALTANTE, ETIQUETA_DE_NUTRIENTE, ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN, textoDeComidaRegistrada } from './copy-recetas';
import { AccesoAMedioResponseSchema, IntencionDeSubidaRequestSchema, IntencionDeSubidaResponseSchema, LIMITES_DE_MEDIO } from './contratos-medios';
import { CalcularRecetaRequestSchema, CrearRecetaRequestSchema, nutrientesDelResultado } from './contratos-recetas';
import { ConsumoEntradaSchema, ItemInformadoSchema, RegistrarComidaRequestSchema, RegistroDiferenteRequestSchema } from './contratos-registro-de-comidas';
import { HoyResponseSchema, PlanResponseSchema } from './contratos-nutricion';
import { calcularNutrientes } from './calculo-nutricional';
import { documentoOpenApi, OPERACIONES } from './openapi';

const ID = '0b6a7f52-3c1d-4e8f-9a2b-5c6d7e8f9a01';
const OTRO_ID = '1c7b8a63-4d2e-4f9a-8b3c-6d7e8f9a0b12';
const AHORA = '2026-10-05T12:30:00.000Z';

/** Los textos de un objeto de copy, con las funciones evaluadas con argumentos de muestra. */
function textos(o: Readonly<Record<string, unknown>>): string[] {
  return Object.values(o).map((v) => (typeof v === 'function' ? String((v as (...a: string[]) => unknown)('Almuerzo', '2')) : String(v)));
}

// ─── Copy ───────────────────────────────────────────────────────────────────────────────────────

test('el copy de recetas y del registro no usa ningún término prohibido de nutrición (T13; B10-05)', () => {
  const todos = [COPY_RECETAS, COPY_REGISTRO_DE_COMIDAS, ETIQUETA_DE_NUTRIENTE, ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN, ETIQUETA_DE_FALTANTE].flatMap(textos);
  assert.ok(todos.length > 100, `se revisaron ${todos.length} textos`);
  const hallazgos = todos.flatMap((t) => terminosProhibidosEn(t).map((p) => `${p} en «${t}»`));
  assert.deepEqual(hallazgos, []);
});

test('el copy dice, literal, lo que pide el encargo del 2026-10-05', () => {
  assert.equal(COPY_REGISTRO_DE_COMIDAS.comiEstaOpcion, 'Comí esta opción');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.verDetalle, 'Ver detalle');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.comiAlgoDiferente, 'Comí algo diferente');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.estimacionDelPlan, 'Estimación para las porciones del plan');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.imagenDeReferencia, 'Imagen de referencia');
  assert.equal(COPY_RECETAS.imagenDeReferencia, 'Imagen de referencia');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.porcionesDelPlan, 'Porciones del plan');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.cuantoComiste, '¿Cuánto comiste?');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.comiLasPorcionesDelPlan, 'Comí las porciones del plan');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.cantidadesSinConfirmar, 'Cantidades sin confirmar');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.deshacer, 'Deshacer registro');
  assert.equal(COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular, 'Macros sin calcular');
  assert.deepEqual([ETIQUETA_DE_NUTRIENTE.energyKcal, ETIQUETA_DE_NUTRIENTE.carbohydrateG, ETIQUETA_DE_NUTRIENTE.fatG, ETIQUETA_DE_NUTRIENTE.proteinG], ['Calorías', 'Carbohidratos', 'Grasas', 'Proteínas']);
  assert.equal(ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN.AI_GENERATED, 'Generada por IA');
  // Lo previsto no se presenta como consumido, y una cantidad vacía no es cero.
  assert.match(COPY_REGISTRO_DE_COMIDAS.lasCantidadesDelPlan, /porciones del plan/);
  assert.match(COPY_REGISTRO_DE_COMIDAS.vacioNoEsCero, /no cuenta como cero/);
});

test('el participio concuerda con la comida, que viene del plan', () => {
  assert.equal(textoDeComidaRegistrada('Almuerzo'), 'Almuerzo registrado');
  assert.equal(textoDeComidaRegistrada('Desayuno'), 'Desayuno registrado');
  assert.equal(textoDeComidaRegistrada('Merienda'), 'Merienda registrada');
  assert.equal(textoDeComidaRegistrada('Cena'), 'Cena registrada');
  assert.equal(textoDeComidaRegistrada('Colación'), 'Colación registrada');
  assert.equal(textoDeComidaRegistrada('Media mañana'), 'Media mañana registrada');
  assert.equal(textoDeComidaRegistrada('Pre entreno'), 'Pre entreno registrado');
  assert.equal(textoDeComidaRegistrada('  Almuerzo '), 'Almuerzo registrado');
});

// ─── Recetas ────────────────────────────────────────────────────────────────────────────────────

const ingrediente = { catalogItemId: ID, catalogItemVersionId: OTRO_ID, quantity: { value: 160, unit: 'g' }, preparationState: 'COOKED' };

test('una receta lleva gramos o mililitros del estado indicado; nunca «unidades», cero ni negativos', () => {
  const receta = { name: 'Arroz con pollo', description: null, servings: 1, steps: [], ingredients: [ingrediente] };
  assert.equal(CrearRecetaRequestSchema.safeParse(receta).success, true);
  for (const quantity of [{ value: 1, unit: 'unit' }, { value: 0, unit: 'g' }, { value: -5, unit: 'g' }, { value: '160', unit: 'g' }, { value: Number.NaN, unit: 'g' }]) {
    assert.equal(CrearRecetaRequestSchema.safeParse({ ...receta, ingredients: [{ ...ingrediente, quantity }] }).success, false, JSON.stringify(quantity));
  }
  assert.equal(CrearRecetaRequestSchema.safeParse({ ...receta, servings: 0 }).success, false);
  assert.equal(CrearRecetaRequestSchema.safeParse({ ...receta, ingredients: [] }).success, false);
  // Un ingrediente se identifica por elemento y versión del catálogo, nunca por nombre.
  assert.equal(CrearRecetaRequestSchema.safeParse({ ...receta, ingredients: [{ ...ingrediente, catalogItemVersionId: undefined, name: 'Arroz' }] }).success, false);
});

test('el cliente no puede mandar totales: la API calcula (§5)', () => {
  const pedido = { servings: 1, ingredients: [ingrediente] };
  assert.equal(CalcularRecetaRequestSchema.safeParse(pedido).success, true);
  assert.equal(CalcularRecetaRequestSchema.safeParse({ ...pedido, total: { energyKcal: 500 } }).success, false);
  assert.equal(CrearRecetaRequestSchema.safeParse({ ...pedido, name: 'X', description: null, steps: [], calculation: {} }).success, false);
  assert.equal(CalcularRecetaRequestSchema.safeParse({ ...pedido, ingredients: [{ ...ingrediente, energyKcal: 200 }] }).success, false);
});

test('el resultado del cálculo pasa al contrato con el valor exacto y los faltantes por nutriente', () => {
  const r = calcularNutrientes([
    { clave: 'arroz', cantidad: { value: 200, unit: 'g' }, composicion: { referenceAmount: '100g', energyKcal: 130, carbohydrateG: 28.17, fatG: 0.28, proteinG: 2.69, fiberG: 0.4 } },
    { clave: 'sin-fibra', cantidad: { value: 10, unit: 'g' }, composicion: { referenceAmount: '100g', energyKcal: 884, carbohydrateG: 0, fatG: 100, proteinG: 0, fiberG: null } },
  ]);
  const n = nutrientesDelResultado(r);
  assert.deepEqual(n.energyKcal, { value: '348.4', missing: [] });
  assert.deepEqual(n.carbohydrateG, { value: '56.34', missing: [] });
  assert.deepEqual(n.fiberG, { value: null, missing: [{ key: 'sin-fibra', reason: 'SIN_DATO_DEL_NUTRIENTE' }] });
});

// ─── Registro v2 ────────────────────────────────────────────────────────────────────────────────

const diferente = { kind: 'DIFFERENT', activePlanId: ID, dayTypeId: ID, mealId: OTRO_ID, occurredAt: AHORA, description: 'Un sándwich', approximateQuantity: null, mediaIds: [] as string[] };

test('una comida diferente lleva texto, foto o los dos; vacía no se guarda (REG-06-133)', () => {
  assert.equal(RegistroDiferenteRequestSchema.safeParse(diferente).success, true, 'solo texto');
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, description: null, mediaIds: [ID] }).success, true, 'solo foto');
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, mediaIds: [ID] }).success, true, 'los dos');
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, description: null }).success, false, 'vacía');
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, description: '   ' }).success, false, 'solo espacios');
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, mediaIds: [ID, ID, ID, ID] }).success, false, `más de ${LIMITES_DE_MEDIO.fotosPorRegistro} fotos`);
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, dayTypeId: null }).success, false, 'una comida del plan va con su día tipo');
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, dayTypeId: null, mealId: null }).success, true, 'sin comida del plan');
  // La cantidad aproximada es texto: nunca se convierte en cantidades del catálogo, y no se pueden mandar macros.
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, approximateQuantity: '1 sándwich y 1 manzana' }).success, true);
  assert.equal(RegistroDiferenteRequestSchema.safeParse({ ...diferente, consumed: { energyKcal: 300 } }).success, false);
});

test('las cantidades consumidas: vacío no es cero, «no lo comí» no lleva cantidad, y nada de lo previsto se manda', () => {
  assert.equal(ItemInformadoSchema.safeParse({ itemId: ID, quantity: null, notEaten: false }).success, true, 'vacío = sin confirmar');
  assert.equal(ItemInformadoSchema.safeParse({ itemId: ID, quantity: null, notEaten: true }).success, true, 'no lo comí');
  assert.equal(ItemInformadoSchema.safeParse({ itemId: ID, quantity: { value: 80, unit: 'g' }, notEaten: true }).success, false);
  assert.equal(ItemInformadoSchema.safeParse({ itemId: ID, quantity: { value: 0, unit: 'g' }, notEaten: false }).success, false, 'cero no: se marca «no lo comí»');
  assert.equal(ConsumoEntradaSchema.safeParse({ status: 'UNCONFIRMED' }).success, true);
  assert.equal(ConsumoEntradaSchema.safeParse({ status: 'PLAN_PORTIONS' }).success, true);
  assert.equal(ConsumoEntradaSchema.safeParse({ status: 'UNCONFIRMED', items: [] }).success, false);
  assert.equal(ConsumoEntradaSchema.safeParse({ status: 'REPORTED', items: [] }).success, false);
  const opcion = { kind: 'PLAN_OPTION', activePlanId: ID, dayTypeId: ID, mealId: ID, optionId: OTRO_ID, occurredAt: AHORA, consumption: { status: 'UNCONFIRMED' }, observation: null };
  assert.equal(RegistrarComidaRequestSchema.safeParse(opcion).success, true);
  assert.equal(RegistrarComidaRequestSchema.safeParse({ ...opcion, planned: {} }).success, false, 'los macros previstos no viajan');
  assert.equal(RegistrarComidaRequestSchema.safeParse({ ...opcion, consumption: { status: 'CONSUMED' } }).success, false);
});

// ─── Medios ─────────────────────────────────────────────────────────────────────────────────────

test('la intención de subida: JPEG, PNG o WebP de hasta 10 MB; las rutas son relativas a la API, nunca una URL de almacenamiento', () => {
  const intencion = { purpose: 'RECIPE_REFERENCE', contentType: 'image/png', byteSize: 1_500_000, provenance: 'AI_GENERATED', authorship: null };
  assert.equal(IntencionDeSubidaRequestSchema.safeParse(intencion).success, true);
  assert.equal(IntencionDeSubidaRequestSchema.safeParse({ ...intencion, contentType: 'image/gif' }).success, false);
  assert.equal(IntencionDeSubidaRequestSchema.safeParse({ ...intencion, contentType: 'image/svg+xml' }).success, false);
  assert.equal(IntencionDeSubidaRequestSchema.safeParse({ ...intencion, byteSize: LIMITES_DE_MEDIO.bytesMaximos + 1 }).success, false);
  assert.equal(IntencionDeSubidaRequestSchema.safeParse({ ...intencion, byteSize: 0 }).success, false);
  const respuesta = (uploadPath: string) => ({ data: { mediaId: ID, uploadPath, method: 'PUT', contentType: 'image/png', maxBytes: LIMITES_DE_MEDIO.bytesMaximos, expiresAt: AHORA } });
  assert.equal(IntencionDeSubidaResponseSchema.safeParse(respuesta('/media/uploads/abc.DEF_12-3')).success, true);
  for (const mala of ['https://bucket.example/abc', '//otro/abc', '/media/uploads/../../x', '/media/uploads/a?b=c']) {
    assert.equal(IntencionDeSubidaResponseSchema.safeParse(respuesta(mala)).success, false, mala);
  }
  assert.equal(AccesoAMedioResponseSchema.safeParse({ data: { mediaId: ID, path: 'https://cdn.example/foto.jpg', expiresAt: AHORA } }).success, false);
  // 15 minutos como máximo para leer (08 §21).
  assert.ok(LIMITES_DE_MEDIO.vigenciaDeLecturaSegundos <= 15 * 60);
});

// ─── OpenAPI ────────────────────────────────────────────────────────────────────────────────────

test('las 18 operaciones nuevas están declaradas, cada una con su DL', () => {
  const nuevas = OPERACIONES.filter((o) => /^API-(REC|MED|ING)-\d{2}$/.test(o.id));
  assert.equal(nuevas.length, 18);
  for (const o of nuevas) {
    const dl = { REC: 'DL-119', MED: 'DL-120', ING: 'DL-121' }[o.id.slice(4, 7)]!;
    assert.match(o.fuente, new RegExp(dl), `${o.id} cita ${dl}`);
    // Toda escritura con sesión lleva Idempotency-Key, salvo el cálculo, que no escribe.
    if (o.metodo !== 'get' && o.autenticacion === 'SESSION' && o.id !== 'API-REC-07') assert.equal(o.idempotencia, true, o.id);
  }
  const doc = documentoOpenApi() as { paths: Record<string, Record<string, { security: unknown[]; requestBody?: { content: Record<string, unknown> }; responses: Record<string, { content?: Record<string, unknown> }> }>> };
  const subida = doc.paths['/media/uploads/{token}']!.put!;
  assert.deepEqual(subida.security, []);
  assert.deepEqual(Object.keys(subida.requestBody!.content).sort(), ['image/jpeg', 'image/png', 'image/webp']);
  const lectura = doc.paths['/media/content/{token}']!.get!;
  assert.deepEqual(Object.keys(lectura.responses['200']!.content!), ['image/jpeg']);
  assert.deepEqual(doc.paths['/media/{mediaId}/access']!.get!.security, [{ sesion: [] }]);
});

// ─── Compatibilidad (D10) ───────────────────────────────────────────────────────────────────────

test('D10 · las respuestas de nutrición que lee la APK instalada no cambian de forma (09v7 T19)', () => {
  const congeladas = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json'), 'utf8')) as {
    operaciones: Record<string, { metodo: string; ruta: string; pedido: unknown; respuestas: Record<string, unknown> }>;
  };
  assert.deepEqual(Object.keys(congeladas.operaciones).sort(), ['API-NUT-14', 'API-NUT-15', 'API-NUT-16', 'API-NUT-16-LISTA']);
  for (const [id, congelada] of Object.entries(congeladas.operaciones)) {
    const op = OPERACIONES.find((o) => o.id === id)!;
    assert.equal(op.metodo, congelada.metodo, id);
    assert.equal(op.ruta, congelada.ruta, id);
    assert.deepEqual(op.request ? z.toJSONSchema(op.request, { target: 'draft-2020-12', io: 'input' }) : null, congelada.pedido, `${id}: el pedido`);
    for (const exito of op.exitos) {
      assert.deepEqual(exito.schema ? z.toJSONSchema(exito.schema, { target: 'draft-2020-12', io: 'output' }) : null, congelada.respuestas[exito.status], `${id}: la respuesta ${exito.status}`);
    }
  }
});

test('D10 · «Hoy» de la APK instalada rechaza una opción con receta; la versión de plan del profesional la acepta', () => {
  const opcion = { optionId: ID, label: 'Bowl', order: 1, items: [] as unknown[] };
  const receta = { recipeId: ID, recipeVersionId: OTRO_ID, versionNumber: 2, name: 'Bowl', servings: 1 };
  const comida = (o: object) => ({ mealId: ID, label: 'Almuerzo', order: 1, prescriptionMode: 'DISH_OPTIONS', options: [o] });
  const dia = (o: object) => ({ dayTypeId: ID, label: 'Día', order: 1, meals: [comida(o)] });
  const hoy = (o: object) => ({
    data: {
      date: '2026-10-05',
      timeZone: 'America/Argentina/Buenos_Aires',
      planState: 'AVAILABLE',
      activePlan: { planId: ID, version: 'v1', activatedAt: AHORA, objective: null, dayTypes: [dia(o)] },
      selectedDayTypeId: ID,
      registeredIntake: [],
      dataState: 'NO_DATA',
    },
  });
  const forma = (r: { success: boolean; error?: { issues: readonly { code: string }[] } }) => (r.success ? [] : (r.error?.issues ?? []).map((i) => i.code));
  // Sin receta, el día pasa la parte de las opciones; con receta, la clave desconocida la rechaza.
  assert.ok(!forma(HoyResponseSchema.safeParse(hoy(opcion))).includes('unrecognized_keys'));
  assert.ok(forma(HoyResponseSchema.safeParse(hoy({ ...opcion, recipe: receta }))).includes('unrecognized_keys'));
  const plan = PlanResponseSchema.shape.data.shape.dayTypes;
  assert.equal(plan.safeParse([dia({ ...opcion, recipe: receta })]).success, true);
});
