/**
 * DL-168 · un plan grande se guarda (arreglo del 2026-11-11).
 *
 * Hasta este arreglo, la API aceptaba 16 KB por pedido en todas las rutas (bootstrap.ts), y el editor del website manda
 * el borrador entero en cada guardado. En las capturas de los flujos de planificación (B28), el plan de Diego Sosa con un
 * día tipo duplicado y una colación pasó a pesar 16.406 bytes, y desde ahí ningún guardado llegó a la ruta: 400 en el
 * parser, en un milisegundo.
 *
 * Estas pruebas guardan, por la API real y con PostgreSQL, lo que antes no entraba:
 * - un borrador de Nutrición del tamaño realista (3 días tipo × 5 comidas × 3 opciones × 5 alimentos, cada uno con una
 *   nota): se crea con la estructura (API-NUT-07) y se vuelve a guardar con los identificadores que asignó la API, como
 *   lo hace el editor (API-NUT-10);
 * - un borrador de Entrenamiento grande (12 semanas × 5 sesiones × 8 ejercicios × 4 series, con notas y objetivos por
 *   serie: API-TRN-10);
 * - la receta más grande que admite el contrato (40 ingredientes y 20 pasos de 500 caracteres: API-REC-01 y API-REC-04).
 * Con el límite anterior fallan las tres (mutación verificada con LIMITE_DE_PLANES_Y_RECETAS = 16 * 1024).
 * - (ampliación, el mismo día) las plantillas de esos dos planes, con la estructura como la manda el editor, con sus
 *   identificadores: se crean (API-TPN-01 y API-TPL-01) y se versionan (API-TPN-04 y API-TPL-04). Sin las cuatro rutas en
 *   el límite de planes y recetas, fallan las dos (mutación verificada).
 *
 * Y lo que no cambia: cualquier otra ruta, también las vecinas (validar el plan, cambiarle el nombre a una plantilla),
 * sigue rechazando más de 16 KB, y las diez de planes y recetas rechazan más de 700 KB. Siempre con 400 INVALID_REQUEST y
 * el issue TOO_BIG en `(body)`, que el website dice como «El plan es demasiado grande para guardarlo de una vez».
 */
import type { INestApplication } from '@nestjs/common';
import { estructuraNutricionalComoEntrada, type VersionDePlan } from '@be/domain';
import { randomUUID } from 'node:crypto';
import { LIMITE_DE_PLANES_Y_RECETAS } from '../../apps/api/src/http/limite-de-cuerpo';
import { MAXIMO_DE_ELEMENTOS } from '../../apps/api/src/http/validacion';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, type CircuitoParaPlanificar } from './soporte-entrenamiento';
import { circuitoListoParaPlanificar, type Circuito } from './soporte-nutricion';
import { alimentosUsda, type AlimentoDelCatalogo } from './soporte-recetas';

/** El límite de siempre, el de `LIMITE_DE_CUERPO` en bootstrap.ts. */
const LIMITE_GENERAL = 16 * 1024;
/** Lo que pesa un cuerpo, en bytes de UTF-8: lo que mide el parser. */
const tamano = (cuerpo: unknown): number => Buffer.byteLength(JSON.stringify(cuerpo), 'utf8');
/** Los elementos de listas de un cuerpo, sumando las anidadas, como los cuenta la cota de `validacion.ts`. */
function elementos(valor: unknown): number {
  if (Array.isArray(valor)) return valor.length + valor.reduce((n: number, e) => n + elementos(e), 0);
  if (valor !== null && typeof valor === 'object') return Object.values(valor).reduce((n: number, e) => n + elementos(e), 0);
  return 0;
}
/** Lo que responde la API cuando un cuerpo no entra en el límite de su ruta. */
const NO_ENTRO = { error: { code: 'INVALID_REQUEST', message: 'La solicitud no es válida.', details: { issues: [{ code: 'TOO_BIG', path: '(body)' }] } } };

// ─── Los cuerpos ─────────────────────────────────────────────────────────────────────────────────────────────────

const NOTA = 'Pesar en crudo. Si no consigue, reemplazar por la misma cantidad de otra fruta de estación.';
const DIAS = ['Día de entrenamiento', 'Día de descanso', 'Día de partido'];
const COMIDAS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colación'];
const OPCIONES = ['Avena con leche, banana y nueces', 'Tostadas integrales con queso y huevo', 'Yogur con granola y fruta de estación'];

/** El plan realista del encargo: 3 días tipo × 5 comidas × 3 opciones × 5 alimentos, cada alimento con una nota. */
function planDeNutricionRealista(alimentos: readonly string[]): Record<string, unknown> {
  let n = 0;
  return {
    dayTypes: DIAS.map((label) => ({
      label,
      meals: COMIDAS.map((comida) => ({
        label: comida,
        prescriptionMode: 'DISH_OPTIONS',
        options: OPCIONES.map((opcion) => ({
          label: opcion,
          items: Array.from({ length: 5 }, () => ({ catalogItemId: alimentos[n++ % alimentos.length], quantity: { value: 150, unit: 'g' }, preparationState: 'COOKED', note: NOTA })),
        })),
      })),
    })),
  };
}

type Nodo = Record<string, unknown>;
/**
 * La estructura de comidas como la tiene el editor después de guardar, con el identificador de cada nodo: así la manda
 * «Guardar como plantilla» (el diálogo recibe la estructura del editor).
 */
function conIdentificadores(estructura: Record<string, unknown>): Record<string, unknown> {
  const dias = estructura.dayTypes as (Nodo & { meals: (Nodo & { options: (Nodo & { items: Nodo[] })[] })[] })[];
  return {
    dayTypes: dias.map((d) => ({
      dayTypeId: randomUUID(),
      ...d,
      meals: d.meals.map((m) => ({ mealId: randomUUID(), ...m, options: m.options.map((o) => ({ optionId: randomUUID(), ...o, items: o.items.map((i) => ({ itemId: randomUUID(), ...i })) })) })),
    })),
  };
}

/** Un plan de Entrenamiento grande: un mesociclo de 12 semanas, 5 sesiones por semana, 8 ejercicios y 4 series, con notas. */
function planDeEntrenamientoGrande(): Record<string, unknown> {
  const ejercicios = Object.values(CATALOGO_DE_EJERCICIOS);
  const sesion = (k: number) => ({
    sessionId: randomUUID(),
    label: `Sesión ${String.fromCharCode(65 + k)}`,
    instructions: 'Entrada en calor de 10 minutos: movilidad de cadera y hombros, y dos series de aproximación.',
    prescriptions: Array.from({ length: 8 }, (_, e) => ({
      prescriptionId: randomUUID(),
      exerciseVersionId: ejercicios[e % ejercicios.length],
      sets: Array.from({ length: 4 }, () => ({ repetitions: { min: 8, max: 10 }, note: null, rir: 2, suggestedLoad: { value: 42.5, unit: 'kg' }, restSeconds: 90 })),
      intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
      suggestedLoad: { value: 40, unit: 'kg' },
      professionalParameters: [{ label: 'Tempo', value: '3-1-1', unit: null }],
      note: 'Bajar controlado; si duele el hombro, reemplazar por la variante con mancuernas.',
      restSeconds: 90,
      loadBasis: 'TOTAL_EXTERNAL',
      repetitionBasis: 'PER_SET',
    })),
  });
  return {
    blocks: [
      {
        blockId: randomUUID(),
        label: 'Mesociclo de fuerza',
        purpose: 'Subir la fuerza en los básicos con una progresión semanal de carga.',
        microcycles: Array.from({ length: 12 }, (_, s) => ({ microcycleId: randomUUID(), label: `Semana ${s + 1}`, purpose: null, sessions: Array.from({ length: 5 }, (_, k) => sesion(k)) })),
      },
    ],
  };
}

/** La receta más grande que admite el contrato: 40 ingredientes y 20 pasos de 500 caracteres. */
function recetaMaxima(alimentos: readonly AlimentoDelCatalogo[]): Record<string, unknown> {
  const paso = 'Cortar la cebolla en pluma y rehogarla a fuego bajo con el aceite, sin que tome color.'.padEnd(500, ' Revolver.').slice(0, 500);
  return {
    name: 'Guiso de lentejas con calabaza y arroz integral, para toda la semana',
    description: 'Rinde ocho porciones y se conserva cuatro días en la heladera. '.repeat(8).slice(0, 500).trim(),
    servings: 8,
    ingredients: Array.from({ length: 40 }, (_, i) => {
      const a = alimentos[i % alimentos.length]!;
      return { catalogItemId: a.catalogItemId, catalogItemVersionId: a.versionId, quantity: { value: 50, unit: 'g' }, preparationState: 'COOKED' };
    }),
    steps: Array.from({ length: 20 }, () => paso),
  };
}

// ─── Las pruebas ─────────────────────────────────────────────────────────────────────────────────────────────────

let app: INestApplication;
let nut: Circuito;
let usda: AlimentoDelCatalogo[];
let trn: CircuitoParaPlanificar;

beforeAll(async () => {
  app = await appDePrueba();
  nut = await circuitoListoParaPlanificar(app, 'planes-grandes');
  usda = [...(await alimentosUsda(app, nut.pro)).values()];
  trn = await circuitoListoParaPlanificarEntrenamiento(app, 'planes-grandes');
});
afterAll(async () => {
  await app.close();
});

const alimentosDelPlan = (): string[] => [nut.arroz, nut.pollo, ...usda.map((a) => a.catalogItemId)];

describe('DL-168 · lo que antes no entraba se guarda', () => {
  it('un borrador de Nutrición del tamaño realista: se crea con la estructura (API-NUT-07) y se vuelve a guardar con sus identificadores, como el editor (API-NUT-10)', async () => {
    const creacion = { objectiveVersionId: nut.objectiveVersionId, initialStructure: planDeNutricionRealista(alimentosDelPlan()) };
    expect(tamano(creacion)).toBeGreaterThan(LIMITE_GENERAL);
    const creado = (await conSesion(app, nut.pro.token).post(`/api/v1/advisees/${nut.ase.id}/nutrition/plans`).send(creacion).expect(201)).body.data as VersionDePlan;

    // El editor reenvía todo, con el identificador que la API le dio a cada nodo: es el pedido que creció en B28.
    const pedido = { expectedVersion: creado.version, changes: estructuraNutricionalComoEntrada(creado), nextReviewAt: null };
    const bytes = tamano(pedido);
    expect(bytes).toBeGreaterThan(LIMITE_GENERAL);
    // El porqué del límite: es al menos diez veces este plan (DL-168).
    expect(10 * bytes).toBeLessThanOrEqual(LIMITE_DE_PLANES_Y_RECETAS);
    // La cota de elementos sigue igual para todas las rutas, y un plan así queda muy lejos de su techo.
    expect(elementos(pedido)).toBeLessThan(MAXIMO_DE_ELEMENTOS / 10);
    const guardado = (await conSesion(app, nut.pro.token).patch(`/api/v1/nutrition/plans/${creado.planId}`).send(pedido).expect(200)).body.data as VersionDePlan;

    const leido = (await conSesion(app, nut.pro.token).get(`/api/v1/nutrition/plans/${creado.planId}`).expect(200)).body.data as VersionDePlan;
    expect(leido.version).toBe(guardado.version);
    const items = leido.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => o.items)));
    expect([leido.dayTypes.length, leido.dayTypes.flatMap((d) => d.meals).length, items.length]).toEqual([3, 15, 225]);
    expect(items.every((i) => i.note === NOTA)).toBe(true);
  });

  it('un borrador de Entrenamiento grande: 12 semanas × 5 sesiones × 8 ejercicios × 4 series, con notas y objetivos por serie (API-TRN-10)', async () => {
    const borrador = await crearBorradorDeEntrenamiento(app, trn);
    const pedido = { expectedVersion: borrador.version, changes: planDeEntrenamientoGrande(), nextReviewAt: null };
    const bytes = tamano(pedido);
    expect(bytes).toBeGreaterThan(20 * LIMITE_GENERAL);
    expect(bytes).toBeLessThanOrEqual(LIMITE_DE_PLANES_Y_RECETAS);
    expect(elementos(pedido)).toBeLessThan(MAXIMO_DE_ELEMENTOS);
    await conSesion(app, trn.pro.token).patch(`/api/v1/training/plans/${borrador.planId}`).send(pedido).expect(200);

    const leido = (await conSesion(app, trn.pro.token).get(`/api/v1/training/plans/${borrador.planId}`).expect(200)).body.data as {
      blocks: { microcycles: { sessions: { prescriptions: { sets: unknown[] }[] }[] }[] }[];
    };
    const sesiones = leido.blocks.flatMap((b) => b.microcycles.flatMap((m) => m.sessions));
    const prescripciones = sesiones.flatMap((s) => s.prescriptions);
    expect([leido.blocks[0]!.microcycles.length, sesiones.length, prescripciones.length, prescripciones.flatMap((p) => p.sets).length]).toEqual([12, 60, 480, 1920]);
  });

  it('la receta más grande que admite el contrato: se crea (API-REC-01) y se edita (API-REC-04)', async () => {
    const receta = recetaMaxima(usda);
    expect(tamano(receta)).toBeGreaterThan(LIMITE_GENERAL);
    const v1 = (await conSesion(app, nut.pro.token).post('/api/v1/nutrition/recipes').send(receta).expect(201)).body.data as { recipeId: string; version: string };
    const v2 = (
      await conSesion(app, nut.pro.token)
        .patch(`/api/v1/nutrition/recipes/${v1.recipeId}`)
        .set('Idempotency-Key', claveDeIdempotencia())
        .send({ ...receta, servings: 10, expectedVersion: v1.version })
        .expect(200)
    ).body.data as { versionNumber: number; servings: number; ingredients: unknown[]; steps: string[] };
    expect([v2.versionNumber, v2.servings, v2.ingredients.length, v2.steps.length]).toEqual([2, 10, 40, 20]);
  });

  it('las plantillas de esos planes, como las manda «Guardar como plantilla»: se crean (API-TPN-01 y API-TPL-01) y se versionan (API-TPN-04 y API-TPL-04)', async () => {
    // Nutrición: el plan realista con el identificador de cada nodo, como lo tiene el editor después de guardar.
    const estructura = conIdentificadores(planDeNutricionRealista(alimentosDelPlan()));
    const deNutricion = { name: `Plan realista ${randomUUID().slice(0, 8)}`, description: null, structure: estructura, copyQuantities: false };
    expect(tamano(deNutricion)).toBeGreaterThan(LIMITE_GENERAL);
    expect(10 * tamano(deNutricion)).toBeLessThanOrEqual(LIMITE_DE_PLANES_Y_RECETAS);
    const n1 = (await conSesion(app, nut.pro.token).post('/api/v1/nutrition/plan-templates').send(deNutricion).expect(201)).body.data as { templateId: string; version: string; versionNumber: number; mealCount: number };
    const n2 = (
      await conSesion(app, nut.pro.token).post(`/api/v1/nutrition/plan-templates/${n1.templateId}/versions`).send({ expectedVersion: n1.version, structure: estructura, copyQuantities: true }).expect(201)
    ).body.data as { versionNumber: number; mealCount: number };
    expect([n1.versionNumber, n1.mealCount, n2.versionNumber, n2.mealCount]).toEqual([1, 15, 2, 15]);

    // Entrenamiento: el mesociclo de 12 semanas.
    const deEntrenamiento = { name: `Mesociclo de 12 semanas ${randomUUID().slice(0, 8)}`, structure: planDeEntrenamientoGrande(), copySuggestedLoads: true };
    expect(tamano(deEntrenamiento)).toBeGreaterThan(20 * LIMITE_GENERAL);
    expect(tamano(deEntrenamiento)).toBeLessThanOrEqual(LIMITE_DE_PLANES_Y_RECETAS);
    const e1 = (await conSesion(app, trn.pro.token).post('/api/v1/training/plan-templates').send(deEntrenamiento).expect(201)).body.data as { templateId: string; version: string; versionNumber: number; sessionCount: number };
    const e2 = (
      await conSesion(app, trn.pro.token).post(`/api/v1/training/plan-templates/${e1.templateId}/versions`).send({ expectedVersion: e1.version, structure: planDeEntrenamientoGrande() }).expect(201)
    ).body.data as { versionNumber: number; sessionCount: number };
    expect([e1.versionNumber, e1.sessionCount, e2.versionNumber, e2.sessionCount]).toEqual([1, 60, 2, 60]);
  });
});

describe('DL-168 · el resto sigue igual', () => {
  // Otra persona del mismo profesional, con su propio borrador vacío: un plan admite un solo borrador a la vez.
  let otra: Circuito;
  let borrador: VersionDePlan;
  beforeAll(async () => {
    otra = await circuitoListoParaPlanificar(app, 'planes-grandes-resto', nut.pro);
    borrador = (await conSesion(app, nut.pro.token).post(`/api/v1/advisees/${otra.ase.id}/nutrition/plans`).send({ objectiveVersionId: otra.objectiveVersionId }).expect(201)).body
      .data as VersionDePlan;
  });

  it('una ruta cualquiera y las vecinas de los planes (validar, cambiarle el nombre a una plantilla) siguen rechazando más de 16 KB', async () => {
    const pro = conSesion(app, nut.pro.token);
    const relleno = 'x'.repeat(LIMITE_GENERAL);
    // Una ruta cualquiera: una evaluación.
    expect((await pro.post(`/api/v1/advisees/${otra.ase.id}/nutrition/evaluations`).send({ relleno }).expect(400)).body).toEqual(NO_ENTRO);
    // Validar un borrador lleva solo la versión: sigue con 16 KB.
    expect((await pro.post(`/api/v1/nutrition/plans/${borrador.planId}/validate`).send({ expectedVersion: borrador.version, relleno }).expect(400)).body).toEqual(NO_ENTRO);
    // Cambiarle el nombre, la descripción o el estado a una plantilla (API-TPN-05) no lleva la estructura: sigue con 16 KB.
    expect((await pro.patch(`/api/v1/nutrition/plan-templates/${randomUUID()}`).send({ expectedVersion: 'v1', name: 'Otro nombre', relleno }).expect(400)).body).toEqual(NO_ENTRO);
  });

  it('las de planes y recetas rechazan más de 700 KB, con el mismo 400, y el borrador no cambia', async () => {
    const pro = conSesion(app, nut.pro.token);
    const enorme = { expectedVersion: borrador.version, changes: { dayTypes: [] }, relleno: 'x'.repeat(LIMITE_DE_PLANES_Y_RECETAS) };
    expect(tamano(enorme)).toBeGreaterThan(LIMITE_DE_PLANES_Y_RECETAS);
    expect((await pro.patch(`/api/v1/nutrition/plans/${borrador.planId}`).send(enorme).expect(400)).body).toEqual(NO_ENTRO);
    expect((await pro.get(`/api/v1/nutrition/plans/${borrador.planId}`).expect(200)).body.data.version).toBe(borrador.version);
    expect((await pro.post('/api/v1/nutrition/recipes').send({ relleno: 'x'.repeat(LIMITE_DE_PLANES_Y_RECETAS) }).expect(400)).body).toEqual(NO_ENTRO);
    expect((await pro.post('/api/v1/nutrition/plan-templates').send({ relleno: 'x'.repeat(LIMITE_DE_PLANES_Y_RECETAS) }).expect(400)).body).toEqual(NO_ENTRO);
  });
});
