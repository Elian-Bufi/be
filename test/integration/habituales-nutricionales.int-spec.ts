/**
 * PF-09 bis · «Mis habituales» de nutrición (API-HAN-01..05; DL-109): los alimentos que el profesional marca y las
 * comidas que guarda con nombre. Lo propio del área: la comida se valida con los elementos disponibles para el
 * profesional, se guarda sin identificadores de nodo y sin cantidades salvo pedido, y se inserta en un borrador real
 * tantas veces como haga falta.
 */
import type { INestApplication } from '@nestjs/common';
import { ComidaHabitualResponseSchema, ListaDeAlimentosHabitualesResponseSchema, ListaDeComidasHabitualesResponseSchema, MarcaDeAlimentoResponseSchema, PlanResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion, resumenDeRespuestas, simultaneos } from './soporte-api';
import { circuitoListoParaPlanificarEntrenamiento } from './soporte-entrenamiento';
import { circuitoListoParaPlanificar, crearBorrador, type Circuito } from './soporte-nutricion';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `han-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const ALIMENTOS = '/api/v1/nutrition/favorite-items';
const COMIDAS = '/api/v1/nutrition/meal-presets';
const PLANES = '/api/v1/nutrition/plans';

/** Una comida tal como sale del editor: con identificadores, cantidades y una nota, para ver qué se copia y qué no. */
function comida(c: Circuito, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    mealId: randomUUID(),
    label: 'Almuerzo',
    prescriptionMode: 'DISH_OPTIONS',
    options: [
      {
        optionId: randomUUID(),
        label: 'Arroz con pollo',
        items: [
          { itemId: randomUUID(), catalogItemId: c.arroz, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED', note: 'Cocinar con poca sal.' },
          { catalogItemId: c.pollo, quantity: { value: 120, unit: 'g' }, preparationState: 'COOKED' },
        ],
      },
    ],
    ...extra,
  };
}
const marcar = (c: Circuito, id: string, state: string) => conSesion(app, c.pro.token).patch(`${ALIMENTOS}/${id}`).send({ state });
const guardar = (c: Circuito, cuerpo: Record<string, unknown>) => conSesion(app, c.pro.token).post(COMIDAS, claveDeIdempotencia()).send(cuerpo);
const editar = (c: Circuito, presetId: string, cuerpo: Record<string, unknown>) => conSesion(app, c.pro.token).patch(`${COMIDAS}/${presetId}`).send(cuerpo);
const comidasDe = async (c: Circuito) => ListaDeComidasHabitualesResponseSchema.parse((await conSesion(app, c.pro.token).get(COMIDAS).expect(200)).body).data;
const alimentosDe = async (c: Circuito) => ListaDeAlimentosHabitualesResponseSchema.parse((await conSesion(app, c.pro.token).get(ALIMENTOS).expect(200)).body).data;
const cantidadesDe = (s: unknown) => JSON.stringify(s).match(/"quantity":(\{[^}]*\}|null)/g) ?? [];
const conIdentificadores = (s: unknown) => /"(mealId|optionId|itemId)"/.test(JSON.stringify(s));
const alimentoAjeno = async (otro: Circuito): Promise<string> =>
  (
    await conSesion(app, otro.pro.token)
      .post('/api/v1/nutrition/catalog-items', claveDeIdempotencia())
      .send({ name: `Quinoa ajena ${randomUUID().slice(0, 6)}`, itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 368, proteinG: 14, carbohydrateG: 64, fatG: 6 } })
      .expect(201)
  ).body.data.catalogItemId as string;

describe('API-HAN · alimentos habituales', () => {
  it('marca y lista con la forma del buscador (la más reciente primero); quita y vuelve a marcar sin duplicar; lo no disponible es 422; ajeno, asesorado y entrenador', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    expect(MarcaDeAlimentoResponseSchema.parse((await marcar(c, c.arroz, 'MARKED').expect(200)).body).data).toEqual({ catalogItemId: c.arroz, state: 'MARKED' });
    await marcar(c, c.pollo, 'MARKED').expect(200);
    const lista = await alimentosDe(c);
    expect(lista.map((e) => e.name)).toEqual(['Pechuga de pollo', 'Arroz blanco']);
    expect(lista[0]).toMatchObject({ catalogItemId: c.pollo, itemType: 'FOOD', available: true, provenance: 'BE_SYNTHETIC_SEED' });
    expect(lista[0]!.versionId).toBeTruthy();
    // Marcar de nuevo no duplica; quitar es idempotente; volver a marcar la pone primera.
    await marcar(c, c.arroz, 'MARKED').expect(200);
    expect((await alimentosDe(c)).map((e) => e.name)).toEqual(['Pechuga de pollo', 'Arroz blanco']);
    expect((await marcar(c, c.pollo, 'REMOVED').expect(200)).body.data).toEqual({ catalogItemId: c.pollo, state: 'REMOVED' });
    await marcar(c, c.pollo, 'REMOVED').expect(200);
    expect((await alimentosDe(c)).map((e) => e.name)).toEqual(['Arroz blanco']);
    await marcar(c, c.pollo, 'MARKED').expect(200);
    expect((await alimentosDe(c)).map((e) => e.name)).toEqual(['Pechuga de pollo', 'Arroz blanco']);
    // Solo lo que este profesional puede prescribir: inexistente, con forma inválida o cargado a mano por otro, 422 con el ítem señalado.
    const otro = await circuitoListoParaPlanificar(app, etiqueta());
    const ajeno = await alimentoAjeno(otro);
    for (const id of [randomUUID(), 'no-es-un-identificador', ajeno]) {
      const r = await marcar(c, id, 'MARKED').expect(422);
      expect(r.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
      expect(JSON.stringify(r.body)).toContain('"path":"catalogItemId"');
    }
    // Quitar lo que nunca se marcó no falla; las marcas son de cada profesional.
    await marcar(c, randomUUID(), 'REMOVED').expect(200);
    expect(await alimentosDe(otro)).toEqual([]);
    await conSesion(app, c.ase.token).get(ALIMENTOS).expect(403);
    await conSesion(app, c.ase.token).patch(`${ALIMENTOS}/${c.arroz}`).send({ state: 'MARKED' }).expect(403);
    const entrenador = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    await conSesion(app, entrenador.pro.token).get(ALIMENTOS).expect(403);
    // Estado desconocido, campo de más o parámetro de query: 400.
    await marcar(c, c.arroz, 'FAVORITE').expect(400);
    await conSesion(app, c.pro.token).patch(`${ALIMENTOS}/${c.arroz}`).send({ state: 'MARKED', extra: 1 }).expect(400);
    await conSesion(app, c.pro.token).get(`${ALIMENTOS}?limit=5`).expect(400);
  });
});

describe('API-HAN · comidas habituales', () => {
  it('guarda sin identificadores ni cantidades (con ellas si se pide) y conserva la nota y los nombres; reemplaza con `replaces` y 409 sin él; renombra; quita; el nombre de una quitada la reactiva', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    const r = await guardar(c, { name: 'Almuerzo base', structure: comida(c) }).expect(201);
    const h = ComidaHabitualResponseSchema.parse(r.body).data;
    expect(h).toMatchObject({ name: 'Almuerzo base', version: 'v1', copiedQuantities: false, itemCount: 2 });
    expect(conIdentificadores(h.structure)).toBe(false);
    expect(cantidadesDe(h.structure)).toEqual(['"quantity":null', '"quantity":null']);
    expect(JSON.stringify(h.structure)).toContain('Cocinar con poca sal.');
    expect(Object.values(h.items).map((i) => i.name).sort()).toEqual(['Arroz blanco', 'Pechuga de pollo']);
    expect(JSON.stringify(r.body)).not.toContain(c.ase.id);
    const con = ComidaHabitualResponseSchema.parse((await guardar(c, { name: 'Con cantidades', structure: comida(c), copyQuantities: true }).expect(201)).body).data;
    expect(con.copiedQuantities).toBe(true);
    expect(cantidadesDe(con.structure).every((q) => q !== '"quantity":null')).toBe(true);
    expect((await comidasDe(c)).map((x) => x.name)).toEqual(['Con cantidades', 'Almuerzo base']);
    // El mismo nombre (con mayúsculas) sin `replaces` es 409; con `replaces` reemplaza nombre, contenido y cantidades, y la versión sube.
    expect((await guardar(c, { name: 'ALMUERZO BASE', structure: comida(c) }).expect(409)).body.error.code).toBe('PRESET_NAME_TAKEN');
    const liviana = comida(c, { label: 'Almuerzo liviano', options: [{ label: 'Pollo solo', items: [{ catalogItemId: c.pollo, quantity: { value: 150, unit: 'g' }, preparationState: 'COOKED' }] }] });
    const reemplazada = ComidaHabitualResponseSchema.parse((await guardar(c, { name: 'Almuerzo liviano', structure: liviana, copyQuantities: true, replaces: h.presetId }).expect(201)).body).data;
    expect(reemplazada).toMatchObject({ presetId: h.presetId, name: 'Almuerzo liviano', version: 'v2', copiedQuantities: true, itemCount: 1 });
    expect(reemplazada.structure.label).toBe('Almuerzo liviano');
    expect((await comidasDe(c)).map((x) => x.name)).toEqual(['Almuerzo liviano', 'Con cantidades']);
    // Reemplazar con el nombre de otra activa es 409; `replaces` inexistente, 404.
    expect((await guardar(c, { name: 'Con cantidades', structure: liviana, replaces: h.presetId }).expect(409)).body.error.code).toBe('PRESET_NAME_TAKEN');
    await guardar(c, { name: 'Otra', structure: liviana, replaces: randomUUID() }).expect(404);
    // Renombrar exige la versión vigente y un nombre libre; quitar la saca de la lista y ya no se edita.
    expect((await editar(c, h.presetId, { expectedVersion: 'v1', name: 'Almuerzo A' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    expect((await editar(c, h.presetId, { expectedVersion: 'v2', name: 'con cantidades' }).expect(409)).body.error.code).toBe('PRESET_NAME_TAKEN');
    const renombrada = ComidaHabitualResponseSchema.parse((await editar(c, h.presetId, { expectedVersion: 'v2', name: 'Almuerzo A' }).expect(200)).body).data;
    expect(renombrada).toMatchObject({ presetId: h.presetId, name: 'Almuerzo A', version: 'v3', itemCount: 1 });
    await editar(c, h.presetId, { expectedVersion: 'v3', state: 'REMOVED' }).expect(200);
    expect((await comidasDe(c)).map((x) => x.name)).toEqual(['Con cantidades']);
    await editar(c, h.presetId, { expectedVersion: 'v4', name: 'Almuerzo B' }).expect(404);
    // Guardar con el nombre de la quitada la reactiva con el contenido nuevo, sin 409 y con el mismo identificador.
    const vuelta = ComidaHabitualResponseSchema.parse((await guardar(c, { name: 'almuerzo a', structure: comida(c) }).expect(201)).body).data;
    expect(vuelta).toMatchObject({ presetId: h.presetId, name: 'almuerzo a', version: 'v5', itemCount: 2, copiedQuantities: false });
    expect((await comidasDe(c)).map((x) => x.name)).toEqual(['almuerzo a', 'Con cantidades']);
    // Renombrar una activa al nombre de una quitada libera ese nombre: la quitada desaparece.
    await editar(c, vuelta.presetId, { expectedVersion: 'v5', state: 'REMOVED' }).expect(200);
    const otraActiva = ComidaHabitualResponseSchema.parse((await editar(c, con.presetId, { expectedVersion: 'v1', name: 'Almuerzo A' }).expect(200)).body).data;
    expect(otraActiva).toMatchObject({ presetId: con.presetId, name: 'Almuerzo A', version: 'v2' });
    expect((await comidasDe(c)).map((x) => x.presetId)).toEqual([con.presetId]);
    // Nada que cambiar o un campo de más: 400.
    await editar(c, con.presetId, { expectedVersion: 'v2' }).expect(400);
    await guardar(c, { name: 'Con campo de más', structure: comida(c), extra: true }).expect(400);
  });

  it('lo ajeno es 404 neutral y no se lista; asesorado y entrenador 403; elemento ajeno o modalidad no habilitada 422; la comida se inserta dos veces en un borrador real con identificadores nuevos', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    const h = ComidaHabitualResponseSchema.parse((await guardar(c, { name: 'Cena tipo', structure: comida(c) }).expect(201)).body).data;
    const otro = await circuitoListoParaPlanificar(app, etiqueta());
    expect(await comidasDe(otro)).toEqual([]);
    await editar(otro, h.presetId, { expectedVersion: 'v1', name: 'Mía' }).expect(404);
    await guardar(otro, { name: 'Mía', structure: comida(otro), replaces: h.presetId }).expect(404);
    await conSesion(app, c.ase.token).get(COMIDAS).expect(403);
    await conSesion(app, c.ase.token).post(COMIDAS, claveDeIdempotencia()).send({ name: 'Mía', structure: comida(c) }).expect(403);
    const entrenador = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    await conSesion(app, entrenador.pro.token).get(COMIDAS).expect(403);
    // Un alimento cargado a mano por otro profesional no está disponible para este: no se guarda, y el problema señala el ítem dentro de la comida.
    const ajeno = await alimentoAjeno(otro);
    const invalida = await guardar(c, { name: 'Ajena', structure: comida(c, { options: [{ label: 'Quinoa', items: [{ catalogItemId: ajeno, quantity: null, preparationState: null }] }] }) }).expect(422);
    expect(invalida.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
    expect(JSON.stringify(invalida.body)).toContain('"path":"options[0].items[0].catalogItemId"');
    // La modalidad por intercambios no está habilitada, como en un borrador.
    expect((await guardar(c, { name: 'Intercambios', structure: comida(c, { prescriptionMode: 'EXCHANGE_PORTIONS' }) }).expect(422)).body.error.code).toBe('EXCHANGE_MODE_NOT_AVAILABLE');
    // Insertada dos veces en un borrador real: cada nodo recibe su identificador, distinto del otro; las cantidades quedan por completar.
    const borrador = await crearBorrador(app, c);
    const editado = await conSesion(app, c.pro.token)
      .patch(`${PLANES}/${borrador.planId}`)
      .send({ expectedVersion: borrador.version, changes: { dayTypes: [{ label: 'Día habitual', meals: [h.structure, h.structure] }] } })
      .expect(200);
    const comidas = PlanResponseSchema.parse(editado.body).data.dayTypes[0]!.meals;
    expect(comidas.map((m) => m.label)).toEqual(['Almuerzo', 'Almuerzo']);
    const ids = comidas.flatMap((m) => [m.mealId, ...m.options.flatMap((o) => [o.optionId, ...o.items.map((i) => i.itemId)])]);
    expect(ids).toHaveLength(8);
    expect(new Set(ids).size).toBe(ids.length);
    expect(comidas.every((m) => m.options[0]!.items.every((i) => i.quantity === null))).toBe(true);
    expect(JSON.stringify(comidas)).toContain('Cocinar con poca sal.');
  });
});

describe('API-HAN · escrituras simultáneas (la base decide; nunca un 500)', () => {
  const N = 6;
  const repetido = (codigo: string) => Array<string>(N - 1).fill(codigo);

  it('marcar a la vez es idempotente con un solo evento; guardar con el mismo nombre y editar con la misma versión: un solo éxito y el resto 409', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    const marcas = await simultaneos(N, () => marcar(c, c.arroz, 'MARKED'));
    expect(resumenDeRespuestas(marcas)).toEqual(Array<string>(N).fill('200'));
    expect(await prisma.alimentoHabitual.count({ where: { profesionalId: c.pro.id } })).toBe(1);
    expect(await prisma.eventoDeNutricion.count({ where: { actorId: c.pro.id, tipo: 'AlimentoHabitualMarcado' } })).toBe(1);
    const quitas = await simultaneos(N, () => marcar(c, c.arroz, 'REMOVED'));
    expect(resumenDeRespuestas(quitas)).toEqual(Array<string>(N).fill('200'));
    expect(await prisma.eventoDeNutricion.count({ where: { actorId: c.pro.id, tipo: 'AlimentoHabitualQuitado' } })).toBe(1);

    const guardados = await simultaneos(N, () => guardar(c, { name: 'Almuerzo simultáneo', structure: comida(c) }));
    expect(resumenDeRespuestas(guardados)).toEqual(['201', ...repetido('409 PRESET_NAME_TAKEN')]);
    const h = ComidaHabitualResponseSchema.parse(guardados.find((r) => r.status === 201)!.body).data;

    const ediciones = await simultaneos(N, (i) => editar(c, h.presetId, { expectedVersion: h.version, name: `Almuerzo ${i}` }));
    expect(resumenDeRespuestas(ediciones)).toEqual(['200', ...repetido('409 VERSION_CONFLICT')]);
    expect((await comidasDe(c)).map((m) => m.version)).toEqual(['v2']);
  });
});
