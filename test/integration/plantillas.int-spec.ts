/**
 * PF-09 · plantillas de plan de entrenamiento del profesional (API-TPL-01..05 y API-TRN-07 con `fromTemplateVersionId`; DL-108).
 *
 * Lo que estas pruebas fijan:
 * - la plantilla es un molde propio: sin cargas sugeridas por defecto (D-2), sin nada del asesorado (D-5), de un solo
 *   profesional (D-1: lo ajeno es 404 neutral; un asesorado o un profesional de otra área, 403);
 * - aplicarla crea un borrador con identificadores nuevos y con su origen registrado; el origen lo ve el profesional
 *   y no el titular; cambiar la plantilla después no toca el plan;
 * - versiones inmutables, nombre único, concurrencia por expectedVersion, archivada no se aplica ni se versiona;
 * - una plantilla no puede combinarse con otra fuente al crear el plan.
 */
import type { INestApplication } from '@nestjs/common';
import { PlanDeEntrenamientoResponseSchema, PlantillaDeEntrenamientoResponseSchema, ListaDePlantillasDeEntrenamientoResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoListoParaPlanificarEntrenamiento, estructuraDeEntrenamiento, type CircuitoParaPlanificar } from './soporte-entrenamiento';
import { prepararProfesional } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `tpl-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const RUTA = '/api/v1/training/plan-templates';
/** Una estructura con carga sugerida y nota en una prescripción, para ver qué se copia y qué no. */
function estructuraConCarga(): Record<string, unknown> {
  const e = estructuraDeEntrenamiento() as { blocks: { sessions: { prescriptions: Record<string, unknown>[] }[] }[] };
  const rx = e.blocks[0]!.sessions[0]!.prescriptions[0]!;
  rx.suggestedLoad = { value: 60, unit: 'kg' };
  rx.note = 'Técnica antes que carga.';
  return e;
}
const crear = (c: CircuitoParaPlanificar, cuerpo: Record<string, unknown>) => conSesion(app, c.pro.token).post(RUTA, claveDeIdempotencia()).send(cuerpo);

describe('API-TPL · guardar y leer plantillas propias', () => {
  it('guarda la estructura sin cargas sugeridas por defecto, conserva las notas, cuenta sesiones; con el interruptor conserva las cargas', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const r = await crear(c, { name: 'Fuerza 3 días', description: 'Nivel inicial', structure: estructuraConCarga() }).expect(201);
    const t = PlantillaDeEntrenamientoResponseSchema.parse(r.body).data;
    expect(t).toMatchObject({ name: 'Fuerza 3 días', description: 'Nivel inicial', state: 'ACTIVE', copiedLoads: false, versionNumber: 1, version: 'v1', origin: null, sessionCount: 2 });
    const rx = (t.structure.blocks[0]!.sessions![0]!.prescriptions[0]! as Record<string, unknown>);
    expect(rx.suggestedLoad).toBeUndefined();
    expect(rx.note).toBe('Técnica antes que carga.');
    // Nada del asesorado: el JSON de la plantilla no lleva su identidad ni objetivo.
    expect(JSON.stringify(r.body)).not.toContain(c.ase.id);
    expect(JSON.stringify(r.body)).not.toContain('objective');

    const conCargas = await crear(c, { name: 'Fuerza con cargas', structure: estructuraConCarga(), copySuggestedLoads: true }).expect(201);
    const t2 = PlantillaDeEntrenamientoResponseSchema.parse(conCargas.body).data;
    expect(t2.copiedLoads).toBe(true);
    expect((t2.structure.blocks[0]!.sessions![0]!.prescriptions[0]! as Record<string, unknown>).suggestedLoad).toEqual({ value: 60, unit: 'kg' });

    const lista = ListaDePlantillasDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(RUTA).expect(200)).body);
    expect(lista.data.map((p) => p.name)).toEqual(['Fuerza con cargas', 'Fuerza 3 días']);
    expect(lista.data.every((p) => !('structure' in p))).toBe(true);
    const detalle = PlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`${RUTA}/${t.templateId}`).expect(200)).body).data;
    expect(detalle.templateId).toBe(t.templateId);
    // Los ejercicios referenciados vienen con su nombre vigente y su disponibilidad, para mostrarlos sin otra consulta.
    const referenciados = detalle.structure.blocks.flatMap((b) => (b.sessions ?? []).flatMap((s) => s.prescriptions.map((p) => p.exerciseVersionId)));
    expect(referenciados.length).toBeGreaterThan(0);
    for (const id of referenciados) expect(detalle.exercises[id]).toMatchObject({ available: true });
    expect(Object.values(detalle.exercises).every((e) => e.exerciseName.length > 0)).toBe(true);
  });

  it('nombre único por profesional (sin distinguir mayúsculas ni acentos); estructura inválida o ejercicio ajeno, 422', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    await crear(c, { name: 'Básico', structure: estructuraDeEntrenamiento() }).expect(201);
    expect((await crear(c, { name: '  BASICO ', structure: estructuraDeEntrenamiento() }).expect(409)).body.error.code).toBe('TEMPLATE_NAME_TAKEN');
    expect((await crear(c, { name: 'Vacía', structure: { blocks: [{ label: 'B', sessions: [{ label: 'S', prescriptions: [{ exerciseVersionId: randomUUID(), sets: [{ repetitions: { value: 8 } }], intensity: null }] }] }] } }).expect(422)).body.error.code).toBe('EXERCISE_REFERENCE_INVALID');
    await crear(c, { name: 'Sin nombre', structure: estructuraDeEntrenamiento(), extra: 1 }).expect(400);
  });

  it('lo ajeno es 404 neutral; un asesorado o un profesional sin Entrenamiento, 403', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = PlantillaDeEntrenamientoResponseSchema.parse((await crear(c, { name: 'Mía', structure: estructuraDeEntrenamiento() }).expect(201)).body).data;
    const otro = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    await conSesion(app, otro.pro.token).get(`${RUTA}/${t.templateId}`).expect(404);
    await conSesion(app, otro.pro.token).post(`${RUTA}/${t.templateId}/versions`, claveDeIdempotencia()).send({ expectedVersion: 'v1', structure: estructuraDeEntrenamiento() }).expect(404);
    await conSesion(app, otro.pro.token).patch(`${RUTA}/${t.templateId}`).send({ expectedVersion: 'v1', name: 'Robada' }).expect(404);
    expect((await conSesion(app, otro.pro.token).get(RUTA).expect(200)).body.data).toEqual([]);
    await conSesion(app, c.ase.token).get(RUTA).expect(403);
    await conSesion(app, c.ase.token).post(RUTA, claveDeIdempotencia()).send({ name: 'x', structure: estructuraDeEntrenamiento() }).expect(403);
    const nutricionista = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    await conSesion(app, nutricionista.token).get(RUTA).expect(403);
  });

  it('nueva versión inmutable con expectedVersion; renombrar y archivar; archivada no se versiona; nombre tomado al renombrar', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = PlantillaDeEntrenamientoResponseSchema.parse((await crear(c, { name: 'Evoluciona', structure: estructuraDeEntrenamiento() }).expect(201)).body).data;
    await crear(c, { name: 'Ocupado', structure: estructuraDeEntrenamiento() }).expect(201);
    await conSesion(app, c.pro.token).post(`${RUTA}/${t.templateId}/versions`, claveDeIdempotencia()).send({ expectedVersion: 'v9', structure: estructuraConCarga() }).expect(409);
    const v2 = PlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).post(`${RUTA}/${t.templateId}/versions`, claveDeIdempotencia()).send({ expectedVersion: 'v1', structure: estructuraConCarga(), copySuggestedLoads: true }).expect(201)).body).data;
    expect(v2).toMatchObject({ versionNumber: 2, version: 'v2', copiedLoads: true });
    expect(v2.versionId).not.toBe(t.versionId);
    // La versión 1 sigue tal cual en la base (inmutable), y la plantilla apunta a la 2.
    expect(await prisma.versionDePlantillaDePlanDeEntrenamiento.count({ where: { plantillaId: t.templateId } })).toBe(2);
    expect((await conSesion(app, c.pro.token).patch(`${RUTA}/${t.templateId}`).send({ expectedVersion: 'v2', name: 'ocupado' }).expect(409)).body.error.code).toBe('TEMPLATE_NAME_TAKEN');
    const renombrada = PlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).patch(`${RUTA}/${t.templateId}`).send({ expectedVersion: 'v2', name: 'Evoluciona 2', description: null }).expect(200)).body).data;
    expect(renombrada).toMatchObject({ name: 'Evoluciona 2', description: null, version: 'v3', versionNumber: 2 });
    const archivada = PlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).patch(`${RUTA}/${t.templateId}`).send({ expectedVersion: 'v3', state: 'ARCHIVED' }).expect(200)).body).data;
    expect(archivada.state).toBe('ARCHIVED');
    expect((await conSesion(app, c.pro.token).post(`${RUTA}/${t.templateId}/versions`, claveDeIdempotencia()).send({ expectedVersion: 'v4', structure: estructuraDeEntrenamiento() }).expect(422)).body.error.code).toBe('TEMPLATE_ARCHIVED');
    const activas = (await conSesion(app, c.pro.token).get(`${RUTA}?state=ACTIVE`).expect(200)).body.data as { name: string }[];
    expect(activas.map((p) => p.name)).toEqual(['Ocupado']);
  });
});

describe('API-TRN-07 con fromTemplateVersionId · aplicar una plantilla', () => {
  it('nace un borrador con identificadores nuevos y origen registrado; el origen lo ve el profesional y no el titular; la plantilla no ata al plan', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = PlantillaDeEntrenamientoResponseSchema.parse((await crear(c, { name: 'Molde', structure: estructuraConCarga(), copySuggestedLoads: true }).expect(201)).body).data;
    const creado = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`, claveDeIdempotencia()).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: t.versionId }).expect(201);
    const plan = PlanDeEntrenamientoResponseSchema.parse(creado.body).data;
    expect(plan.state).toBe('DRAFT');
    expect(plan.templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0]!.sessions).toHaveLength(2);
    // Los identificadores de nodo que la estructura declara se conservan (REG-06-111: son por plan, y una ejecución los
    // referencia); dentro del plan son únicos. La carga de referencia y la nota vienen del molde.
    const sesionIds = plan.blocks[0]!.sessions!.map((s) => s.sessionId);
    expect(new Set(sesionIds).size).toBe(2);
    expect(plan.blocks[0]!.sessions![0]!.prescriptions[0]!.suggestedLoad).toEqual({ value: 60, unit: 'kg' });
    // El profesional lo ve en su lista; el asesorado no ve el origen (esquema estricto de la APK).
    const lista = (await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/training/plans`).expect(200)).body.data as { templateOrigin?: unknown }[];
    expect(lista[0]!.templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    await conSesion(app, c.pro.token).post(`/api/v1/training/plans/${plan.planId}/activate`, claveDeIdempotencia()).send({ expectedVersion: plan.version }).expect(200);
    const comoTitular = (await conSesion(app, c.ase.token).get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body.data as Record<string, unknown>;
    expect('templateOrigin' in comoTitular).toBe(false);
    const comoProfesional = (await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body.data as Record<string, unknown>;
    expect(comoProfesional.templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    // Una versión nueva de la plantilla no toca el plan.
    await conSesion(app, c.pro.token).post(`${RUTA}/${t.templateId}/versions`, claveDeIdempotencia()).send({ expectedVersion: 'v1', structure: estructuraDeEntrenamiento() }).expect(201);
    const despues = (await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body.data as { templateOrigin: unknown; blocks: { sessions: unknown[] }[] };
    expect(despues.templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    expect(despues.blocks[0]!.sessions).toHaveLength(2);
  });

  it('fuentes excluyentes, plantilla ajena o inexistente, y archivada', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = PlantillaDeEntrenamientoResponseSchema.parse((await crear(c, { name: 'Molde', structure: estructuraDeEntrenamiento() }).expect(201)).body).data;
    const planes = `/api/v1/advisees/${c.ase.id}/training/plans`;
    expect((await conSesion(app, c.pro.token).post(planes, claveDeIdempotencia()).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: t.versionId, initialStructure: estructuraDeEntrenamiento() }).expect(422)).body.error.code).toBe('VALIDATION_FAILED');
    await conSesion(app, c.pro.token).post(planes, claveDeIdempotencia()).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: randomUUID() }).expect(404);
    const otro = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    await conSesion(app, otro.pro.token).post(`/api/v1/advisees/${otro.ase.id}/training/plans`, claveDeIdempotencia()).send({ objectiveVersionId: otro.objectiveVersionId, fromTemplateVersionId: t.versionId }).expect(404);
    await conSesion(app, c.pro.token).patch(`${RUTA}/${t.templateId}`).send({ expectedVersion: 'v1', state: 'ARCHIVED' }).expect(200);
    expect((await conSesion(app, c.pro.token).post(planes, claveDeIdempotencia()).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: t.versionId }).expect(422)).body.error.code).toBe('TEMPLATE_ARCHIVED');
  });
});
