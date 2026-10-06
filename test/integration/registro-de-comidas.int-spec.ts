/**
 * WP-NUTRICION-RECETAS · la receta como opción del plan (DL-119) y el registro v2 de comidas (DL-121) contra PostgreSQL
 * real (docs/paquetes/WP-NUTRICION-RECETAS.md §10.3).
 * - D4: API-NUT-10 arma la opción con una porción de la receta; el plan activado congela la versión de la receta y sus
 *   versiones del catálogo, y cambiar la receta después no reescribe el plan ni los registros.
 * - API-ING-01: las opciones con su receta, su imagen y los macros de las porciones del plan, exactos (el oráculo es el
 *   paquete de Dirección).
 * - D6: «Comí esta opción» en sus tres formas, sin duplicar por doble envío; nunca convierte lo previsto en consumido.
 * - D7: deshacer anula de forma auditable y libera la comida; completar cantidades rectifica sin reescribir el original.
 * - D8: la comida diferente con texto, foto o los dos, y nunca vacía.
 * - D10: lo que lee la APK instalada (API-NUT-14, 16 y 16-LISTA) no cambia de forma, y lo anulado deja de contar ahí, en
 *   el contexto de revisión, en la cartera y en el tablero.
 */
import type { INestApplication } from '@nestjs/common';
import {
  HoyConOpcionesResponseSchema,
  HoyResponseSchema,
  IngestaResponseSchema,
  ListaDeIngestasResponseSchema,
  ListaDeRegistrosDeComidaResponseSchema,
  mismoValorExacto,
  PlanResponseSchema,
  RegistroDeComidaResponseSchema,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activar, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, patchConSesion, type Circuito } from './soporte-nutricion';
import {
  alimentosUsda,
  CASOS,
  crearReceta,
  cuerpoDeReceta,
  estructuraConRecetas,
  FOTOS,
  NUTRIENTE_DEL_PAQUETE,
  RECETAS,
  subirImagen,
  type AlimentoDelCatalogo,
} from './soporte-recetas';
import { dashboard, prepararAsesorado, prepararProfesional } from './soporte-vinculo';

let app: INestApplication;
beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
});

type Nutrientes = Record<string, { value: string | null; missing: { key: string; reason: string }[] }>;
const caso = (id: string) => CASOS.find((c) => c.id === id)!;
function exigirCaso(n: Nutrientes, esperado: Record<string, string>, etiqueta: string): void {
  for (const [clave, valor] of Object.entries(esperado)) {
    const v = n[NUTRIENTE_DEL_PAQUETE[clave]!]!;
    expect({ etiqueta, clave, iguales: v.value !== null && mismoValorExacto(v.value, valor), missing: v.missing }).toEqual({ etiqueta, clave, iguales: true, missing: [] });
  }
}
const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000);

interface Escenario {
  c: Circuito;
  alimentos: Map<string, AlimentoDelCatalogo>;
  recetas: { recipeId: string; recipeVersionId: string; version: string; name: string }[];
  /** El pollo en dos porciones: la opción lleva la mitad de cada ingrediente. */
  dosPorciones: { recipeId: string; recipeVersionId: string; name: string };
  imagenDelPollo: string;
  planId: string;
}

/** Un plan activado con un almuerzo de cuatro opciones de receta (las tres del paquete y el pollo en dos porciones) y una cena a mano. */
async function escenario(etiqueta: string): Promise<Escenario> {
  const c = await circuitoListoParaPlanificar(app, etiqueta);
  const alimentos = await alimentosUsda(app, c.pro);
  const recetas = [];
  for (const r of RECETAS) recetas.push((await crearReceta(app, c.pro, cuerpoDeReceta(r, alimentos)).expect(201)).body.data);
  const dosPorciones = (await crearReceta(app, c.pro, { ...cuerpoDeReceta(RECETAS[0]!, alimentos, { servings: 2 }), name: 'Pollo con arroz y verduras (dos porciones)' }).expect(201)).body.data;
  const imagen = await subirImagen(app, c.pro, FOTOS[0]!);
  await conSesion(app, c.pro.token).put(`/api/v1/nutrition/recipes/${recetas[0].recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: recetas[0].version }).expect(200);
  const borrador = await crearBorrador(app, c);
  const opciones = [...recetas, dosPorciones].map((r) => ({ label: r.name as string, recipeVersionId: r.recipeVersionId as string }));
  const guardado = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${borrador.planId}`).send({ expectedVersion: borrador.version, changes: estructuraConRecetas(opciones, c.pollo) }).expect(200);
  await activar(app, c.pro, borrador.planId, guardado.body.data.version).expect(200);
  return { c, alimentos, recetas, dosPorciones, imagenDelPollo: imagen.mediaId, planId: borrador.planId };
}

describe('D4 · una receta como opción de una comida del plan', () => {
  let e: Escenario;
  beforeAll(async () => {
    e = await escenario('rec-plan');
  });

  it('API-NUT-10 arma los ítems con una porción de la versión citada; el profesional ve la receta y el asesorado no', async () => {
    const delProfesional = await conSesion(app, e.c.pro.token).get(`/api/v1/nutrition/plans/${e.planId}`).expect(200);
    PlanResponseSchema.parse(delProfesional.body);
    const almuerzo = delProfesional.body.data.dayTypes[0].meals[0];
    expect(almuerzo.options).toHaveLength(4);
    const [pollo, , , dos] = almuerzo.options;
    expect(pollo.recipe).toEqual({ recipeId: e.recetas[0]!.recipeId, recipeVersionId: e.recetas[0]!.recipeVersionId, versionNumber: 1, name: RECETAS[0]!.name, servings: 1 });
    // La instantánea congela las versiones del catálogo que cita la receta.
    expect(pollo.items.map((i: { catalogItemVersionId: string }) => i.catalogItemVersionId)).toEqual(RECETAS[0]!.items.map((it) => e.alimentos.get(it.food_id)!.versionId));
    expect(pollo.items.map((i: { quantity: { value: number } }) => i.quantity.value)).toEqual([120, 160, 80, 70, 8]);
    // Dos porciones: la opción lleva la mitad de cada ingrediente.
    expect(dos.recipe.servings).toBe(2);
    expect(dos.items.map((i: { quantity: { value: number } }) => i.quantity.value)).toEqual([60, 80, 40, 35, 4]);
    // La cena, a mano, no tiene receta.
    expect(delProfesional.body.data.dayTypes[0].meals[1].options[0].recipe).toBeUndefined();

    // El asesorado lee su plan (API-NUT-09) y «Hoy» (API-NUT-14) sin la receta: la APK instalada valida con esquemas estrictos.
    const delAsesorado = await conSesion(app, e.c.ase.token).get(`/api/v1/nutrition/plans/${e.planId}`).expect(200);
    expect(JSON.stringify(delAsesorado.body)).not.toContain('recipe');
    const hoy = await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    HoyResponseSchema.parse(hoy.body);
    expect(JSON.stringify(hoy.body)).not.toContain('recipe');
    expect(hoy.body.data.activePlan.dayTypes[0].meals[0].options[0].items).toHaveLength(5);
  });

  it('una opción de receta no lleva ítems de la entrada, cita una receta propia y no entra en plantillas ni habituales', async () => {
    const c = await circuitoListoParaPlanificar(app, 'rec-plan-errores');
    const alimentos = await alimentosUsda(app, c.pro);
    const propia = (await crearReceta(app, c.pro, cuerpoDeReceta(RECETAS[2]!, alimentos)).expect(201)).body.data;
    const borrador = await crearBorrador(app, c);
    const guardar = (changes: Record<string, unknown>) => patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${borrador.planId}`).send({ expectedVersion: borrador.version, changes });
    const conItems = estructuraConRecetas([{ label: 'Lentejas', recipeVersionId: propia.recipeVersionId }], c.pollo);
    (conItems.dayTypes[0]!.meals[0]!.options[0] as { items: unknown[] }).items = [{ catalogItemId: c.arroz, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED' }];
    const r1 = await guardar(conItems).expect(422);
    expect(r1.body.error).toMatchObject({ code: 'NUTRITION_PLAN_STRUCTURE_INVALID', details: { issues: [{ code: 'RECIPE_OPTION_ITEMS_FROM_RECIPE', path: 'dayTypes[0].meals[0].options[0].items' }] } });
    // La receta de otro profesional (o una versión inexistente) es una referencia inválida.
    const ajena = (await crearReceta(app, (e.c.pro), cuerpoDeReceta(RECETAS[2]!, e.alimentos)).expect(201)).body.data;
    for (const recipeVersionId of [ajena.recipeVersionId, randomUUID()]) {
      const r = await guardar(estructuraConRecetas([{ label: 'Ajena', recipeVersionId }], c.pollo)).expect(422);
      expect(r.body.error.details.issues).toEqual([{ code: 'RECIPE_REFERENCE_INVALID', path: 'dayTypes[0].meals[0].options[0].recipeVersionId' }]);
    }
    // Plantillas (TPN) y comidas habituales (HAN): 422 explícito, no se descarta la referencia en silencio.
    const estructura = estructuraConRecetas([{ label: 'Lentejas', recipeVersionId: propia.recipeVersionId }], c.pollo);
    const plantilla = await conSesion(app, c.pro.token).post('/api/v1/nutrition/plan-templates').send({ name: 'Con receta', structure: estructura }).expect(422);
    expect(plantilla.body.error).toMatchObject({ code: 'VALIDATION_FAILED', details: { issues: [{ code: 'RECIPE_OPTION_NOT_ALLOWED', path: 'structure.dayTypes[0].meals[0].options[0].recipeVersionId' }] } });
    const habitual = await conSesion(app, c.pro.token).post('/api/v1/nutrition/meal-presets').send({ name: 'Almuerzo con receta', structure: estructura.dayTypes[0]!.meals[0] }).expect(422);
    expect(habitual.body.error).toMatchObject({ code: 'VALIDATION_FAILED', details: { issues: [{ code: 'RECIPE_OPTION_NOT_ALLOWED', path: 'structure.options[0].recipeVersionId' }] } });
    // Con la receta propia y sin ítems, se guarda; un borrador sucesor conserva la referencia.
    const ok = await guardar(estructuraConRecetas([{ label: 'Lentejas', recipeVersionId: propia.recipeVersionId }], c.pollo)).expect(200);
    expect(ok.body.data.dayTypes[0].meals[0].options[0].recipe.recipeVersionId).toBe(propia.recipeVersionId);
    await activar(app, c.pro, borrador.planId, ok.body.data.version).expect(200);
    const sucesor = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: borrador.planId }).expect(201);
    expect(sucesor.body.data.dayTypes[0].meals[0].options[0].recipe.recipeVersionId).toBe(propia.recipeVersionId);
  });

  it('API-ING-01: cada opción con su receta, su imagen y los macros de las porciones del plan, exactos', async () => {
    const r = await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200);
    HoyConOpcionesResponseSchema.parse(r.body);
    expect(r.body.data.planState).toBe('AVAILABLE');
    const [almuerzo, cena] = r.body.data.meals;
    expect(almuerzo.label).toBe('Almuerzo');
    expect(almuerzo.recordId).toBeNull();
    RECETAS.forEach((receta, i) => {
      const opcion = almuerzo.options[i];
      expect(opcion.recipe).toMatchObject({ recipeId: e.recetas[i]!.recipeId, name: receta.name, servings: 1, description: receta.description, steps: receta.preparation });
      exigirCaso(opcion.planned, receta.expected_nutrients_unrounded, `${receta.id} previsto`);
    });
    expect(almuerzo.options[0].image).toEqual({ mediaId: e.imagenDelPollo });
    expect(almuerzo.options[1].image).toBeNull();
    // Dos porciones: la mitad de la receta, el caso «mitad» del paquete.
    exigirCaso(almuerzo.options[3].planned, caso('BE-DEMO-NUT-001-mitad').expected, 'pollo en dos porciones, previsto');
    // La opción a mano sale del catálogo sintético, sin fibra: desconocida, no cero.
    expect(cena.options[0].recipe).toBeNull();
    expect(cena.options[0].planned.fiberG.value).toBeNull();
    expect(cena.options[0].planned.fiberG.missing[0].reason).toBe('SIN_DATO_DEL_NUTRIENTE');
  });

  it('la receta editada después del plan no cambia el plan activado, «Hoy» con opciones ni los registros', async () => {
    const opcion = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data.meals[0].options[0];
    const registrado = await conSesion(app, e.c.ase.token)
      .post('/api/v1/me/nutrition/meal-records')
      .send({ kind: 'PLAN_OPTION', activePlanId: e.planId, dayTypeId: (await diaTipo(e)), mealId: (await almuerzoId(e)), optionId: opcion.optionId, occurredAt: haceDias(3).toISOString(), consumption: { status: 'PLAN_PORTIONS' }, observation: null })
      .expect(201);
    const editada = await conSesion(app, e.c.pro.token)
      .patch(`/api/v1/nutrition/recipes/${e.recetas[0]!.recipeId}`)
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({ ...cuerpoDeReceta(RECETAS[0]!, e.alimentos, { cambios: { arroz_cocido: '200' } }), expectedVersion: (await conSesion(app, e.c.pro.token).get(`/api/v1/nutrition/recipes/${e.recetas[0]!.recipeId}`).expect(200)).body.data.version })
      .expect(200);
    exigirCaso(editada.body.data.calculation.total, caso('BE-DEMO-NUT-001-arroz-200g').expected, 'receta editada');
    const despues = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data.meals[0].options[0];
    expect(despues.recipe.recipeVersionId).toBe(e.recetas[0]!.recipeVersionId);
    expect(despues.planned).toEqual(opcion.planned);
    const plan = await conSesion(app, e.c.pro.token).get(`/api/v1/nutrition/plans/${e.planId}`).expect(200);
    expect(plan.body.data.dayTypes[0].meals[0].options[0].recipe.versionNumber).toBe(1);
    const leido = await conSesion(app, e.c.ase.token).get(`/api/v1/nutrition/meal-records/${registrado.body.data.recordId}`).expect(200);
    expect(leido.body.data.option.recipe.recipeVersionId).toBe(e.recetas[0]!.recipeVersionId);
    exigirCaso(leido.body.data.consumed, RECETAS[0]!.expected_nutrients_unrounded, 'consumo con las porciones del plan, después de editar la receta');
    expect((await app.get(PrismaService).ingestaNutricional.findUniqueOrThrow({ where: { id: registrado.body.data.recordId } })).versionDeRecetaId).toBe(e.recetas[0]!.recipeVersionId);
  });
});

async function diaTipo(e: Escenario): Promise<string> {
  return (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data.dayTypes[0].dayTypeId as string;
}
async function almuerzoId(e: Escenario): Promise<string> {
  return (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data.meals[0].mealId as string;
}

describe('D6 y D7 · «Comí esta opción», deshacer y completar cantidades', () => {
  let e: Escenario;
  let dia: string;
  let comida: string;
  let cena: string;
  let opciones: { optionId: string; items: { itemId: string }[] }[];
  beforeAll(async () => {
    e = await escenario('rec-registro');
    const hoy = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    dia = hoy.dayTypes[0].dayTypeId;
    comida = hoy.meals[0].mealId;
    cena = hoy.meals[1].mealId;
    opciones = hoy.meals[0].options;
  });
  const registrar = (cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) =>
    conSesion(app, e.c.ase.token).post('/api/v1/me/nutrition/meal-records', clave).send({ kind: 'PLAN_OPTION', activePlanId: e.planId, dayTypeId: dia, mealId: comida, occurredAt: new Date().toISOString(), observation: null, ...cuerpo });

  it('sin confirmar: queda la opción, sin macros consumidos; un doble envío no duplica', async () => {
    const clave = claveDeIdempotencia();
    // El mismo pedido completo: un reintento con la misma clave repite el cuerpo, momento incluido.
    const cuerpo = { optionId: opciones[0]!.optionId, consumption: { status: 'UNCONFIRMED' }, occurredAt: new Date().toISOString() };
    const primero = await registrar(cuerpo, clave).expect(201);
    RegistroDeComidaResponseSchema.parse(primero.body);
    expect(primero.body.data).toMatchObject({ kind: 'PLAN_OPTION', consumption: { status: 'UNCONFIRMED', items: [], source: 'ORIGINAL' }, consumed: null, annulment: null, version: 'v1' });
    // Lo previsto viaja aparte, como estimación: nunca como consumo.
    exigirCaso(primero.body.data.option.planned, RECETAS[0]!.expected_nutrients_unrounded, 'previsto del registro');
    // La misma clave: la misma respuesta. Otra clave con el mismo pedido (otro toque): la existente, con 200.
    expect((await registrar(cuerpo, clave).expect(201)).body).toEqual(primero.body);
    expect((await registrar(cuerpo).expect(200)).body.data.recordId).toBe(primero.body.data.recordId);
    // Otro pedido para la misma comida ese día: 409.
    const otro = await registrar({ optionId: opciones[1]!.optionId, consumption: { status: 'UNCONFIRMED' } }).expect(409);
    expect(otro.body.error).toMatchObject({ code: 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY', details: { recordId: primero.body.data.recordId } });
    // La misma clave con otro pedido: 409 de clave reutilizada.
    expect((await registrar({ optionId: opciones[1]!.optionId, consumption: { status: 'UNCONFIRMED' } }, clave).expect(409)).body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await app.get(PrismaService).ingestaNutricional.count({ where: { asesoradoId: e.c.ase.id } })).toBe(1);
    // «Hoy» marca la comida con su registro; v1 lo ve como una ingesta prescripta sin cantidades.
    const hoy = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    expect(hoy.meals[0].recordId).toBe(primero.body.data.recordId);
    expect(hoy.records.map((r: { recordId: string }) => r.recordId)).toEqual([primero.body.data.recordId]);
    const v1 = await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    HoyResponseSchema.parse(v1.body);
    expect(v1.body.data.registeredIntake).toHaveLength(1);
    expect(v1.body.data.registeredIntake[0]).toMatchObject({ origin: 'PRESCRIBED', mealId: comida, optionId: opciones[0]!.optionId, consumedItems: [] });
  });

  it('deshacer anula sin borrar; deja de contar en «Hoy», NUT-16, la lista, el contexto, la cartera y el tablero; se vuelve a registrar', async () => {
    const hoy = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    const registro = hoy.records[0];
    const contarEnTablero = async () => (await dashboard(app, e.c.pro, e.c.ase.id).expect(200)).body.data.domains.nutrition.summary.registeredIntakes as number;
    const antes = await contarEnTablero();
    // Un profesional no deshace por el asesorado; otra persona tampoco: 404.
    await conSesion(app, e.c.pro.token).post(`/api/v1/nutrition/meal-records/${registro.recordId}/annulment`).send({ reason: null, expectedVersion: registro.version }).expect(404);
    expect((await conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${registro.recordId}/annulment`).send({ reason: null, expectedVersion: 'v9' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    const anulado = await conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${registro.recordId}/annulment`).send({ reason: 'Me equivoqué de opción', expectedVersion: registro.version }).expect(201);
    expect(anulado.body.data.annulment).toMatchObject({ reason: 'Me equivoqué de opción' });
    expect(anulado.body.data.version).toBe('v2');
    // Anular dos veces y rectificar lo anulado: 409 INVALID_STATE_TRANSITION.
    expect((await conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${registro.recordId}/annulment`).send({ reason: null, expectedVersion: 'v2' }).expect(409)).body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect((await conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${registro.recordId}/consumed-quantities`).send({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: 'v2' }).expect(409)).body.error.code).toBe('INVALID_STATE_TRANSITION');

    // La ingesta sigue en la base, anulada; las rutas de la APK instalada no la devuelven.
    expect(await app.get(PrismaService).anulacionDeIngesta.count({ where: { ingestaId: registro.recordId } })).toBe(1);
    expect((await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today').expect(200)).body.data.registeredIntake).toEqual([]);
    await conSesion(app, e.c.ase.token).get(`/api/v1/nutrition/executions/${registro.recordId}`).expect(404);
    const lista = await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/executions').expect(200);
    ListaDeIngestasResponseSchema.parse(lista.body);
    expect(lista.body.data.map((i: { executionId: string }) => i.executionId)).not.toContain(registro.recordId);
    const contexto = await conSesion(app, e.c.pro.token).get(`/api/v1/advisees/${e.c.ase.id}/nutrition/review-context`).expect(200);
    expect(contexto.body.data.registeredIntakes).toEqual([]);
    expect(JSON.stringify(contexto.body.data.descriptiveContrast)).not.toContain(registro.recordId);
    expect(await contarEnTablero()).toBe(antes - 1);
    // Tampoco es evidencia de una revisión nueva.
    const revision = await conSesion(app, e.c.pro.token).post(`/api/v1/advisees/${e.c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision([{ type: 'EXECUTION', id: registro.recordId }], 'MAINTAIN')).expect(422);
    expect(revision.body.error.code).toBe('REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE');
    // La lista v2 lo muestra marcado; «Hoy» con opciones, no; la comida queda libre.
    const propios = await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/meal-records').expect(200);
    ListaDeRegistrosDeComidaResponseSchema.parse(propios.body);
    expect(propios.body.data.find((r: { recordId: string }) => r.recordId === registro.recordId).annulment).not.toBeNull();
    const despues = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    expect(despues.records).toEqual([]);
    expect(despues.meals[0].recordId).toBeNull();

    // Volver a registrar: la secuencia siguiente.
    const nuevo = await registrar({ optionId: opciones[1]!.optionId, consumption: { status: 'PLAN_PORTIONS' } }).expect(201);
    expect(nuevo.body.data.recordId).not.toBe(registro.recordId);
    exigirCaso(nuevo.body.data.consumed, RECETAS[1]!.expected_nutrients_unrounded, 'porciones del plan confirmadas');
    expect(nuevo.body.data.consumption.items.map((i: { quantity: { value: number } }) => i.quantity.value)).toEqual([150, 220, 100, 5]);
    expect((await app.get(PrismaService).ingestaNutricional.findUniqueOrThrow({ where: { id: nuevo.body.data.recordId } })).secuencia).toBe(1);
    expect(await contarEnTablero()).toBe(antes);
  });

  it('informadas: «no lo comí» aporta cero (el caso sin aceite del paquete); un ingrediente vacío deja el nutriente sin total', async () => {
    const pollo = opciones[0]!;
    const plan = [120, 160, 80, 70];
    const informado = await registrar({
      optionId: pollo.optionId,
      occurredAt: haceDias(1).toISOString(),
      consumption: { status: 'REPORTED', items: [...plan.map((g, i) => ({ itemId: pollo.items[i]!.itemId, quantity: { value: g, unit: 'g' }, notEaten: false })), { itemId: pollo.items[4]!.itemId, quantity: null, notEaten: true }] },
    }).expect(201);
    exigirCaso(informado.body.data.consumed, caso('BE-DEMO-NUT-001-sin-aceite').expected, 'informado sin aceite');
    // Vacío no es cero: el arroz sin cantidad deja cada nutriente sin total, y lo nombra.
    const conVacio = await registrar({
      optionId: pollo.optionId,
      occurredAt: haceDias(2).toISOString(),
      consumption: { status: 'REPORTED', items: [{ itemId: pollo.items[1]!.itemId, quantity: null, notEaten: false }] },
    }).expect(201);
    expect(conVacio.body.data.consumed.energyKcal.value).toBeNull();
    expect(conVacio.body.data.consumed.energyKcal.missing).toEqual(expect.arrayContaining([{ key: pollo.items[1]!.itemId, reason: 'SIN_CANTIDAD' }]));
    // Ítems ajenos, repetidos o en otra unidad: 422.
    for (const items of [
      [{ itemId: randomUUID(), quantity: { value: 10, unit: 'g' }, notEaten: false }],
      [{ itemId: pollo.items[0]!.itemId, quantity: { value: 10, unit: 'g' }, notEaten: false }, { itemId: pollo.items[0]!.itemId, quantity: null, notEaten: true }],
      [{ itemId: pollo.items[0]!.itemId, quantity: { value: 1, unit: 'unit' }, notEaten: false }],
    ]) {
      expect((await registrar({ optionId: pollo.optionId, occurredAt: haceDias(4).toISOString(), consumption: { status: 'REPORTED', items } }).expect(422)).body.error.code).toBe('NUTRITION_EXECUTION_INVALID');
    }
    // «No lo comí» no lleva cantidad (contrato).
    await registrar({ optionId: pollo.optionId, occurredAt: haceDias(4).toISOString(), consumption: { status: 'REPORTED', items: [{ itemId: pollo.items[0]!.itemId, quantity: { value: 10, unit: 'g' }, notEaten: true }] } }).expect(400);
  });

  it('completar cantidades rectifica sin reescribir el original; la vista efectiva es la última, también en v1', async () => {
    const pollo = opciones[0]!;
    const original = await registrar({ optionId: pollo.optionId, occurredAt: haceDias(5).toISOString(), consumption: { status: 'UNCONFIRMED' } }).expect(201);
    const id = original.body.data.recordId as string;
    const rectificar = (cuerpo: Record<string, unknown>) => conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${id}/consumed-quantities`).send(cuerpo);
    expect((await rectificar({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: 'v2' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    await conSesion(app, e.c.pro.token).post(`/api/v1/nutrition/meal-records/${id}/consumed-quantities`).send({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: 'v1' }).expect(404);
    const r1 = await rectificar({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: 'v1' }).expect(201);
    expect(r1.body.data).toMatchObject({ version: 'v2', consumption: { status: 'PLAN_PORTIONS', source: 'RECTIFIED' } });
    exigirCaso(r1.body.data.consumed, RECETAS[0]!.expected_nutrients_unrounded, 'rectificado a porciones del plan');
    const r2 = await rectificar({ consumption: { status: 'REPORTED', items: [{ itemId: pollo.items[1]!.itemId, quantity: { value: 200, unit: 'g' }, notEaten: false }] }, expectedVersion: 'v2' }).expect(201);
    expect(r2.body.data).toMatchObject({ version: 'v3', consumption: { status: 'REPORTED', source: 'RECTIFIED' } });
    // El original no cambió: la ingesta guarda «sin confirmar», y las rectificaciones son una cadena.
    const prisma = app.get(PrismaService);
    expect((await prisma.ingestaNutricional.findUniqueOrThrow({ where: { id } })).cantidadesConsumidas).toEqual({ status: 'UNCONFIRMED', items: [] });
    const cadena = await prisma.rectificacionDeCantidades.findMany({ where: { ingestaId: id }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(cadena).toHaveLength(2);
    expect(cadena[1]!.predecesoraId).toBe(cadena[0]!.id);
    // La forma v1 (API-NUT-16) proyecta la vista efectiva: lo informado.
    const v1 = await conSesion(app, e.c.ase.token).get(`/api/v1/nutrition/executions/${id}`).expect(200);
    IngestaResponseSchema.parse(v1.body);
    expect(v1.body.data.consumedItems).toEqual([{ itemId: pollo.items[1]!.itemId, quantity: { value: 200, unit: 'g' } }]);
    // El profesional del plan lee el registro (API-ING-03); otro asesorado, no.
    expect((await conSesion(app, e.c.pro.token).get(`/api/v1/nutrition/meal-records/${id}`).expect(200)).body.data.version).toBe('v3');
    const otro = await prepararAsesorado(app, 'rec-registro-otro', { a3: true });
    await conSesion(app, otro.token).get(`/api/v1/nutrition/meal-records/${id}`).expect(404);
  });
});

describe('D8 · «Comí algo diferente»: texto, foto o los dos; nunca vacía; sin macros', () => {
  let e: Escenario;
  let dia: string;
  let cena: string;
  beforeAll(async () => {
    e = await escenario('rec-diferente');
    const hoy = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    dia = hoy.dayTypes[0].dayTypeId;
    cena = hoy.meals[1].mealId;
  });
  const foto = async () => (await subirImagen(app, e.c.ase, await sharp({ create: { width: 300, height: 200, channels: 3, background: { r: 10, g: 200, b: 90 } } }).jpeg().toBuffer(), { contentType: 'image/jpeg', purpose: 'MEAL_EVIDENCE' })).mediaId;
  const diferente = (cuerpo: Record<string, unknown>) =>
    conSesion(app, e.c.ase.token).post('/api/v1/me/nutrition/meal-records').send({ kind: 'DIFFERENT', activePlanId: e.planId, dayTypeId: null, mealId: null, occurredAt: new Date().toISOString(), description: null, approximateQuantity: null, mediaIds: [], ...cuerpo });

  it('solo texto, solo foto y los dos; vacía es 400; la foto no agrega macros; v1 lo ve como una comida fuera del plan', async () => {
    const texto = await diferente({ description: 'Un sándwich de queso', approximateQuantity: '1 sándwich' }).expect(201);
    expect(texto.body.data).toMatchObject({ kind: 'DIFFERENT', option: null, consumption: null, consumed: null, description: 'Un sándwich de queso', approximateQuantity: '1 sándwich', evidence: [] });
    const unaFoto = await foto();
    const soloFoto = await diferente({ mediaIds: [unaFoto] }).expect(201);
    expect(soloFoto.body.data).toMatchObject({ description: null, consumed: null });
    expect(soloFoto.body.data.evidence.map((x: { mediaId: string }) => x.mediaId)).toEqual([unaFoto]);
    const ambos = await diferente({ description: 'Fruta', mediaIds: [await foto(), await foto()] }).expect(201);
    expect(ambos.body.data.evidence).toHaveLength(2);
    await diferente({}).expect(400);
    await diferente({ description: '   ' }).expect(400);
    await diferente({ description: 'x', mediaIds: [await foto(), await foto(), await foto(), await foto()] }).expect(400);
    // En v1 (API-NUT-16) es una ingesta fuera del plan; con solo foto, sin descripción.
    const v1 = await conSesion(app, e.c.ase.token).get(`/api/v1/nutrition/executions/${soloFoto.body.data.recordId}`).expect(200);
    IngestaResponseSchema.parse(v1.body);
    expect(v1.body.data).toMatchObject({ origin: 'OUTSIDE_PRESCRIPTION', mode: 'FREE_DESCRIPTION', description: null, mealId: null });
    // El titular y el profesional del plan leen la foto; otro profesional sin vínculo, no.
    await conSesion(app, e.c.ase.token).get(`/api/v1/media/${unaFoto}/access`).expect(200);
    await conSesion(app, e.c.pro.token).get(`/api/v1/media/${unaFoto}/access`).expect(200);
    const otroPro = await prepararProfesional(app, 'rec-diferente-otro', ['NUTRICION']);
    await conSesion(app, otroPro.token).get(`/api/v1/media/${unaFoto}/access`).expect(404);
    const otroAse = await prepararAsesorado(app, 'rec-diferente-otro', { a3: true });
    await conSesion(app, otroAse.token).get(`/api/v1/media/${unaFoto}/access`).expect(404);
    // Suprimida a pedido, el registro deja de mostrarla y queda igual.
    await conSesion(app, e.c.ase.token).delete(`/api/v1/me/media/${unaFoto}`).set('Idempotency-Key', claveDeIdempotencia()).expect(200);
    expect((await conSesion(app, e.c.ase.token).get(`/api/v1/nutrition/meal-records/${soloFoto.body.data.recordId}`).expect(200)).body.data.evidence).toEqual([]);
  });

  it('una foto ajena, ya unida a otro registro, de receta o inexistente es 422 MEDIA_REFERENCE_INVALID', async () => {
    const otro = await prepararAsesorado(app, 'rec-diferente-ajena', { a3: true });
    const ajena = (await subirImagen(app, otro, FOTOS[0]!, { contentType: 'image/png', purpose: 'MEAL_EVIDENCE' })).mediaId;
    const unida = await foto();
    await diferente({ description: 'Primero', mediaIds: [unida] }).expect(201);
    const deReceta = (await subirImagen(app, e.c.pro, FOTOS[1]!)).mediaId;
    for (const mediaId of [ajena, unida, deReceta, randomUUID()]) {
      const r = await diferente({ description: 'Con foto inválida', mediaIds: [mediaId] }).expect(422);
      expect(r.body.error).toMatchObject({ code: 'MEDIA_REFERENCE_INVALID', details: { issues: [{ path: 'mediaIds[0]' }] } });
    }
  });

  it('con la comida del plan como contexto, ocupa esa comida: una opción o una ingesta v1 para la misma comida son 409', async () => {
    const r = await diferente({ dayTypeId: dia, mealId: cena, description: 'Pizza en vez de la cena' }).expect(201);
    expect(r.body.data.meal).toMatchObject({ mealId: cena, label: 'Cena' });
    const hoy = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    expect(hoy.meals[1].recordId).toBe(r.body.data.recordId);
    const opcion = hoy.meals[1].options[0].optionId;
    await conSesion(app, e.c.ase.token)
      .post('/api/v1/me/nutrition/meal-records')
      .send({ kind: 'PLAN_OPTION', activePlanId: e.planId, dayTypeId: dia, mealId: cena, optionId: opcion, occurredAt: new Date().toISOString(), consumption: { status: 'UNCONFIRMED' }, observation: null })
      .expect(409);
    await conSesion(app, e.c.ase.token)
      .post('/api/v1/me/nutrition/executions')
      .send({ activePlanId: e.planId, dayTypeId: dia, occurredAt: new Date().toISOString(), recording: { origin: 'PRESCRIBED', mode: 'DISH_OPTIONS', mealId: cena, optionId: opcion } })
      .expect(409);
    // La misma comida diferente otra vez (otro toque): la existente.
    expect((await diferente({ dayTypeId: dia, mealId: cena, description: 'Pizza en vez de la cena' }).expect(200)).body.data.recordId).toBe(r.body.data.recordId);
    // Una comida que no está en el plan: 422.
    expect((await diferente({ dayTypeId: dia, mealId: randomUUID(), description: 'x' }).expect(422)).body.error.code).toBe('NUTRITION_EXECUTION_INVALID');
    // v1 no ve la comida como registrada: la diferente es un dato aparte, sin comida (CONS:599-612).
    const v1 = (await conSesion(app, e.c.ase.token).get('/api/v1/me/nutrition/today').expect(200)).body;
    HoyResponseSchema.parse(v1);
    expect(v1.data.registeredIntake.find((i: { executionId: string }) => i.executionId === r.body.data.recordId).mealId).toBeNull();
    // El contraste del profesional (API-NUT-17) dice los dos hechos: la cena sigue sin opción del plan (NO_DATA) y nombra
    // la comida diferente registrada en su contexto, que sigue fuera de la prescripción (CONS:599-612; DL-121).
    const contexto = (await conSesion(app, e.c.pro.token).get(`/api/v1/advisees/${e.c.ase.id}/nutrition/review-context`).expect(200)).body.data;
    const dias = contexto.descriptiveContrast.days as { meals: { mealId: string; state: string; registeredOptionId: string | null; differentMealExecutionIds: string[] }[]; outsidePrescription: { executionId: string }[] }[];
    const diaDelRegistro = dias.find((d) => d.outsidePrescription.some((o) => o.executionId === r.body.data.recordId))!;
    expect(diaDelRegistro.meals.find((m) => m.mealId === cena)).toMatchObject({ state: 'NO_DATA', registeredOptionId: null, differentMealExecutionIds: [r.body.data.recordId] });
    expect(diaDelRegistro.meals.filter((m) => m.mealId !== cena).every((m) => !m.differentMealExecutionIds.includes(r.body.data.recordId))).toBe(true);
  });

  it('la base sostiene la comida diferente: sin texto ni foto no se confirma; la foto unida y la anulación no se editan', async () => {
    const prisma = app.get(PrismaService);
    await expect(
      prisma.$transaction((tx) =>
        tx.$executeRawUnsafe(
          `INSERT INTO ingesta_nutricional (id, version_de_plan_id, asesorado_id, origen, modo, fecha_local, zona_horaria, procedencia, momento_de_ocurrencia)
           VALUES ('${randomUUID()}', '${e.planId}', '${e.c.ase.id}', 'FUERA_DE_PRESCRIPCION', 'DESCRIPCION_LIBRE', '2026-01-01', 'UTC', '{}', now())`,
        ),
      ),
    ).rejects.toThrow(/descripción, una foto o las dos/);
    const r = (await diferente({ description: 'Para deshacer', mediaIds: [await foto()] }).expect(201)).body.data;
    await conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${r.recordId}/annulment`).send({ reason: null, expectedVersion: r.version }).expect(201);
    await expect(prisma.$executeRawUnsafe(`UPDATE evidencia_visual_de_ingesta SET autor_id = gen_random_uuid() WHERE ingesta_id = '${r.recordId}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM anulacion_de_ingesta WHERE ingesta_id = '${r.recordId}'`)).rejects.toThrow(/append-only/);
    // Una segunda anulación, aunque se escriba por fuera de la API, choca con la única por ingesta.
    await expect(
      prisma.$executeRawUnsafe(`INSERT INTO anulacion_de_ingesta (id, ingesta_id, autor_id, procedencia, momento_de_ocurrencia) VALUES ('${randomUUID()}', '${r.recordId}', '${e.c.ase.id}', '{}', now())`),
    ).rejects.toThrow(/23505|unique|duplicate/i);
  });
});
