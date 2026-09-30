/**
 * PF-09 · plantillas de plan de comidas del profesional (API-TPN-01..05 y API-NUT-07 con `fromTemplateVersionId`; DL-108).
 * El mismo molde que las de entrenamiento; lo propio de nutrición: las cantidades no se copian por defecto (D-2) y la
 * estructura se valida con los elementos del catálogo disponibles para el profesional.
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDePlantillasNutricionalesResponseSchema, PlanResponseSchema, PlantillaNutricionalResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoListoParaPlanificarEntrenamiento } from './soporte-entrenamiento';
import { activar, circuitoListoParaPlanificar, crearBorrador, estructura, type Circuito } from './soporte-nutricion';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `tpn-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const RUTA = '/api/v1/nutrition/plan-templates';
/** La estructura de prueba con una nota en un ítem, para ver qué se copia y qué no. */
function estructuraConNota(c: Circuito): Record<string, unknown> {
  const e = estructura(c.arroz, c.pollo) as { dayTypes: { meals: { options: { items: Record<string, unknown>[] }[] }[] }[] };
  e.dayTypes[0]!.meals[0]!.options[0]!.items[0]!.note = 'Cocinar con poca sal.';
  return e;
}
const crear = (c: Circuito, cuerpo: Record<string, unknown>) => conSesion(app, c.pro.token).post(RUTA, claveDeIdempotencia()).send(cuerpo);
const cantidadesDe = (s: unknown) => JSON.stringify(s).match(/"quantity":(\{[^}]*\}|null)/g) ?? [];

describe('API-TPN · plantillas de comidas propias', () => {
  it('guarda sin cantidades por defecto y con ellas si se pide; conserva la nota; cuenta comidas; nombres del catálogo en el detalle', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    const r = await crear(c, { name: 'Semana tipo', description: 'Cuatro comidas', structure: estructuraConNota(c) }).expect(201);
    const t = PlantillaNutricionalResponseSchema.parse(r.body).data;
    expect(t).toMatchObject({ name: 'Semana tipo', state: 'ACTIVE', copiedQuantities: false, versionNumber: 1, version: 'v1', origin: null });
    expect(t.mealCount).toBeGreaterThan(0);
    expect(cantidadesDe(t.structure).every((q) => q === '"quantity":null')).toBe(true);
    expect(JSON.stringify(t.structure)).toContain('Cocinar con poca sal.');
    expect(JSON.stringify(r.body)).not.toContain(c.ase.id);
    expect(Object.values(t.items).map((i) => i.name).sort()).toEqual(['Arroz blanco', 'Pechuga de pollo']);

    const con = PlantillaNutricionalResponseSchema.parse((await crear(c, { name: 'Con cantidades', structure: estructuraConNota(c), copyQuantities: true }).expect(201)).body).data;
    expect(con.copiedQuantities).toBe(true);
    expect(cantidadesDe(con.structure).some((q) => q !== '"quantity":null')).toBe(true);

    const lista = ListaDePlantillasNutricionalesResponseSchema.parse((await conSesion(app, c.pro.token).get(RUTA).expect(200)).body);
    expect(lista.data.map((p) => p.name)).toEqual(['Con cantidades', 'Semana tipo']);
  });

  it('lo ajeno es 404 neutral; un asesorado o un entrenador, 403; nombre repetido 409; elemento ajeno 422', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    const t = PlantillaNutricionalResponseSchema.parse((await crear(c, { name: 'Mía', structure: estructura(c.arroz, c.pollo) }).expect(201)).body).data;
    const otro = await circuitoListoParaPlanificar(app, etiqueta());
    await conSesion(app, otro.pro.token).get(`${RUTA}/${t.templateId}`).expect(404);
    await conSesion(app, otro.pro.token).patch(`${RUTA}/${t.templateId}`).send({ expectedVersion: 'v1', state: 'ARCHIVED' }).expect(404);
    await conSesion(app, c.ase.token).get(RUTA).expect(403);
    const entrenador = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    await conSesion(app, entrenador.pro.token).get(RUTA).expect(403);
    expect((await crear(c, { name: 'MÍA', structure: estructura(c.arroz, c.pollo) }).expect(409)).body.error.code).toBe('TEMPLATE_NAME_TAKEN');
    // Un alimento cargado a mano por otro profesional no está disponible para este: la plantilla no se guarda.
    const ajeno = (
      await conSesion(app, otro.pro.token)
        .post('/api/v1/nutrition/catalog-items', claveDeIdempotencia())
        .send({ name: `Quinoa ajena ${randomUUID().slice(0, 6)}`, itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 368, proteinG: 14, carbohydrateG: 64, fatG: 6 } })
        .expect(201)
    ).body.data.catalogItemId as string;
    expect((await crear(c, { name: 'Ajeno', structure: estructura(ajeno, c.pollo) }).expect(422)).body.error.code).toBe('VALIDATION_FAILED');
  });

  it('aplicar: el borrador nace con origen (que el titular no ve), la plantilla no ata al plan; archivada y fuentes excluyentes', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    const t = PlantillaNutricionalResponseSchema.parse((await crear(c, { name: 'Molde', structure: estructuraConNota(c), copyQuantities: true }).expect(201)).body).data;
    const planes = `/api/v1/advisees/${c.ase.id}/nutrition/plans`;
    const creado = await conSesion(app, c.pro.token).post(planes, claveDeIdempotencia()).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: t.versionId }).expect(201);
    const plan = PlanResponseSchema.parse(creado.body).data;
    expect(plan.state).toBe('DRAFT');
    expect(plan.templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    expect(plan.dayTypes.length).toBeGreaterThan(0);
    expect(JSON.stringify(plan)).toContain('Cocinar con poca sal.');
    await activar(app, c.pro, plan.planId, plan.version).expect(200);
    const comoTitular = (await conSesion(app, c.ase.token).get(`/api/v1/nutrition/plans/${plan.planId}`).expect(200)).body.data as Record<string, unknown>;
    expect('templateOrigin' in comoTitular).toBe(false);
    const comoProfesional = (await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${plan.planId}`).expect(200)).body.data as Record<string, unknown>;
    expect(comoProfesional.templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    // Una versión nueva de la plantilla no toca el plan; archivada no se aplica; dos fuentes son 422.
    await conSesion(app, c.pro.token).post(`${RUTA}/${t.templateId}/versions`, claveDeIdempotencia()).send({ expectedVersion: 'v1', structure: estructura(c.arroz, c.pollo) }).expect(201);
    expect(((await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${plan.planId}`).expect(200)).body.data as { templateOrigin: unknown }).templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    await conSesion(app, c.pro.token).patch(`${RUTA}/${t.templateId}`).send({ expectedVersion: 'v2', state: 'ARCHIVED' }).expect(200);
    const b = await crearBorrador(app, c);
    expect(b.planId).toBeTruthy();
    const d = await circuitoListoParaPlanificar(app, etiqueta(), c.pro);
    expect((await conSesion(app, c.pro.token).post(`/api/v1/advisees/${d.ase.id}/nutrition/plans`, claveDeIdempotencia()).send({ objectiveVersionId: d.objectiveVersionId, fromTemplateVersionId: t.versionId }).expect(422)).body.error.code).toBe('TEMPLATE_ARCHIVED');
    expect((await conSesion(app, c.pro.token).post(`/api/v1/advisees/${d.ase.id}/nutrition/plans`, claveDeIdempotencia()).send({ objectiveVersionId: d.objectiveVersionId, fromTemplateVersionId: t.versionId, initialStructure: estructura(c.arroz, c.pollo) }).expect(422)).body.error.code).toBe('VALIDATION_FAILED');
    await conSesion(app, c.pro.token).post(`/api/v1/advisees/${d.ase.id}/nutrition/plans`, claveDeIdempotencia()).send({ objectiveVersionId: d.objectiveVersionId, fromTemplateVersionId: randomUUID() }).expect(404);
  });
});
