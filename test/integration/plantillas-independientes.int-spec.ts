/**
 * PLT · DL-182 — las plantillas de entrenamiento independientes: crearlas y editarlas sin una persona (API-TPL-06 a 14).
 *
 * Lo que estas pruebas fijan, contra PostgreSQL real:
 * - una plantilla nueva nace como preparación, en blanco o como copia de una versión propia, sin persona y sin nombre
 *   hasta guardarla; el autoguardado no toca ninguna versión y le pone identificadores a la estructura, que se conservan;
 * - la revisión dice lo que impide guardar (el nombre, ninguna sesión, el nombre tomado, un ejercicio retirado, una
 *   plantilla archivada) y lo que queda para completar al adaptarla, sin las reglas de una persona;
 * - «Guardar plantilla» crea la plantilla con su versión 1 (sin cargas salvo el interruptor, D-2 de DL-108) y «Guardar
 *   nueva versión» la versión siguiente; la preparación deja de existir; las versiones anteriores y los planes ya creados
 *   no cambian, y cada versión dice cuántos planes salieron de ella;
 * - editar abre una sola preparación por plantilla; descartarla deja las versiones como estaban;
 * - lo ajeno es 404, igual que lo inexistente; un asesorado o un profesional de otra área, 403;
 * - las escrituras simultáneas con la misma versión: una sola pasa, el resto 409, ordenadas por la base (sin pausas).
 */
import type { INestApplication } from '@nestjs/common';
import {
  ListaDePlantillasDeEntrenamientoResponseSchema,
  ListaDePreparacionesDePlantillaResponseSchema,
  PlanDeEntrenamientoResponseSchema,
  PlantillaDeEntrenamientoResponseSchema,
  PreparacionDePlantillaResponseSchema,
  RevisionDePreparacionResponseSchema,
  VersionesDePlantillaDeEntrenamientoResponseSchema,
  type PreparacionDePlantilla,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion, resumenDeRespuestas } from './soporte-api';
import { esperarQueEsperen, pidDeLaTransaccion } from './soporte-concurrencia';
import { CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, estructuraDeEntrenamiento, type CircuitoParaPlanificar } from './soporte-entrenamiento';
import { prepararProfesional } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `plt-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const PREPARACIONES = '/api/v1/training/plan-template-drafts';
const PLANTILLAS = '/api/v1/training/plan-templates';
const leida = (body: unknown): PreparacionDePlantilla => PreparacionDePlantillaResponseSchema.parse(body).data;

/** Una estructura con una carga sugerida en lo general y en una serie, para ver qué guarda la versión. */
function estructuraConCargas(): Record<string, unknown> {
  const e = estructuraDeEntrenamiento() as { blocks: { sessions: { prescriptions: Record<string, unknown>[] }[] }[] };
  const rx = e.blocks[0]!.sessions[1]!.prescriptions[0]!;
  rx.sets = [{ repetitions: { value: 6 }, suggestedLoad: { value: 10, unit: 'kg' } }];
  return e;
}
const prescripcionesDe = (estructura: { blocks: readonly { sessions?: readonly { prescriptions: readonly Record<string, unknown>[] }[] }[] }) =>
  estructura.blocks.flatMap((b) => (b.sessions ?? []).flatMap((s) => s.prescriptions));

async function nueva(c: CircuitoParaPlanificar, cuerpo: Record<string, unknown> = {}): Promise<PreparacionDePlantilla> {
  return leida((await conSesion(app, c.pro.token).post(PREPARACIONES, claveDeIdempotencia()).send(cuerpo).expect(201)).body);
}
const guardar = (c: CircuitoParaPlanificar, p: { draftId: string; version: string }, cuerpo: Record<string, unknown>) =>
  conSesion(app, c.pro.token).patch(`${PREPARACIONES}/${p.draftId}`).send({ expectedVersion: p.version, ...cuerpo });
const revisar = (c: CircuitoParaPlanificar, p: { draftId: string; version: string }) => conSesion(app, c.pro.token).post(`${PREPARACIONES}/${p.draftId}/review`).send({ expectedVersion: p.version });
const publicar = (c: CircuitoParaPlanificar, p: { draftId: string; version: string }) =>
  conSesion(app, c.pro.token).post(`${PREPARACIONES}/${p.draftId}/publish`, claveDeIdempotencia()).send({ expectedVersion: p.version });

/** Una plantilla guardada desde una preparación nueva, con la estructura de siempre. */
async function plantillaGuardada(c: CircuitoParaPlanificar, nombre: string, extra: Record<string, unknown> = {}) {
  const p = await nueva(c);
  const g = leida((await guardar(c, p, { structure: estructuraDeEntrenamiento(), name: nombre, ...extra }).expect(200)).body);
  return PlantillaDeEntrenamientoResponseSchema.parse((await publicar(c, g).expect(201)).body).data;
}

describe('API-TPL-06, 09, 10 y 11 · una plantilla nueva, sin persona', () => {
  it('nace en blanco, sin nombre ni plantilla; el autoguardado no crea ninguna versión y conserva los identificadores', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const p = await nueva(c);
    expect(p).toMatchObject({ templateId: null, baseVersionId: null, baseVersionNumber: null, version: 'v1', name: '', description: null, templateState: null, copySuggestedLoads: false, sessionCount: 0 });
    expect(p.structure.blocks).toHaveLength(1);
    expect(p.structure.blocks[0]).toMatchObject({ label: 'Fase 1', sessions: [], microcycles: [] });
    // La fase nace con su identificador: el editor lo conserva desde el primer guardado.
    expect(p.structure.blocks[0]!.blockId).toEqual(expect.any(String));
    // Nada de una persona.
    expect(JSON.stringify(p)).not.toContain(c.ase.id);
    expect(JSON.stringify(p)).not.toMatch(/objective|nextReview|agenda|advisee/i);

    const g = leida((await guardar(c, p, { structure: estructuraDeEntrenamiento(), name: 'Fuerza en preparación', description: 'Tres días' }).expect(200)).body);
    expect(g).toMatchObject({ version: 'v2', name: 'Fuerza en preparación', description: 'Tres días', sessionCount: 2 });
    const ids = prescripcionesDe(g.structure).map((x) => x.prescriptionId);
    expect(ids).toEqual(['rx-banca', 'rx-sentadilla', 'rx-dominadas']);
    // Cada ejercicio con su nombre vigente, su disponibilidad y su imagen (null: el catálogo sintético no tiene).
    expect(g.exercises[CATALOGO_DE_EJERCICIOS.pressDeBanca]).toMatchObject({ available: true, image: null });
    // Un ejercicio sin identificador lo recibe del servidor, y el siguiente guardado lo conserva.
    const sinId = structuredClone(g.structure) as { blocks: { sessions: { prescriptions: Record<string, unknown>[] }[] }[] };
    sinId.blocks[0]!.sessions[1]!.prescriptions.push({ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [{ repetitions: { value: 5 } }], intensity: null });
    const g2 = leida((await guardar(c, g, { structure: sinId }).expect(200)).body);
    const nuevoId = prescripcionesDe(g2.structure)[3]!.prescriptionId;
    expect(nuevoId).toEqual(expect.any(String));
    const g3 = leida((await guardar(c, g2, { structure: g2.structure }).expect(200)).body);
    expect(prescripcionesDe(g3.structure)[3]!.prescriptionId).toBe(nuevoId);
    // El nombre, guardado, no es una plantilla: no aparece en «Mis plantillas» hasta guardarla.
    expect(ListaDePlantillasDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(PLANTILLAS).expect(200)).body).data).toEqual([]);
    const lista = ListaDePreparacionesDePlantillaResponseSchema.parse((await conSesion(app, c.pro.token).get(PREPARACIONES).expect(200)).body).data;
    expect(lista.map((x) => [x.draftId, x.name, x.templateId])).toEqual([[p.draftId, 'Fuerza en preparación', null]]);
    expect(await prisma.plantillaDePlanDeEntrenamiento.count({ where: { profesionalId: c.pro.id } })).toBe(0);
  });

  it('el autoguardado rechaza lo que no se guarda ni en un borrador y lo de otro, con su lugar; 409 con una versión vieja', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const p = await nueva(c);
    const ajeno = { blocks: [{ label: 'F', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: randomUUID(), sets: [{ repetitions: { value: 8 } }], intensity: null }] }] }] };
    const r = await guardar(c, p, { structure: ajeno }).expect(422);
    expect(r.body.error).toMatchObject({ code: 'EXERCISE_REFERENCE_INVALID', details: { issues: [{ code: 'EXERCISE_REFERENCE_INVALID', path: 'blocks[0].sessions[0].prescriptions[0].exerciseVersionId' }] } });
    const rpe = { blocks: [{ label: 'F', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [{ repetitions: { value: 8 } }], intensity: { criterion: 'RPE', target: { value: 8 } } }] }] }] };
    expect((await guardar(c, p, { structure: rpe }).expect(422)).body.error.code).toBe('INTENSITY_CRITERION_INVALID');
    await guardar(c, { ...p, version: 'v9' }, { structure: estructuraDeEntrenamiento() }).expect(409);
    await guardar(c, p, { structure: estructuraDeEntrenamiento(), objectiveVersionId: c.objectiveVersionId }).expect(400);
    // Nada de lo rechazado quedó: la preparación sigue en su versión.
    expect(leida((await conSesion(app, c.pro.token).get(`${PREPARACIONES}/${p.draftId}`).expect(200)).body).version).toBe('v1');
  });

  it('la revisión: lo que impide guardar y lo que queda para completar al adaptarla, sin reglas de una persona', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const p = await nueva(c);
    const vacia = RevisionDePreparacionResponseSchema.parse((await revisar(c, p).expect(200)).body).data;
    expect(vacia).toEqual({
      valid: false,
      version: 'v1',
      issues: [
        { code: 'TEMPLATE_NAME_REQUIRED', path: 'name' },
        { code: 'TEMPLATE_SESSION_REQUIRED', path: 'blocks' },
      ],
      toComplete: [],
    });
    const conSesionVacia = { blocks: [{ label: 'Fase 1', sessions: [{ label: 'Sesión A', prescriptions: [] }, { label: 'Sesión B', prescriptions: [{ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [{ repetitions: null }], intensity: null }] }] }] };
    const g = leida((await guardar(c, p, { structure: conSesionVacia, name: 'Base' }).expect(200)).body);
    const lista = RevisionDePreparacionResponseSchema.parse((await revisar(c, g).expect(200)).body).data;
    // Una sesión sin ejercicios no impide guardar una plantilla: queda para completar al adaptarla (PLT-D09).
    expect(lista).toEqual({ valid: true, version: 'v2', issues: [], toComplete: [{ code: 'PRESCRIPTION_REQUIRED', path: 'blocks[0].sessions[0].prescriptions' }] });
    await revisar(c, { ...g, version: 'v1' }).expect(409);
  });
});

describe('API-TPL-12 · guardar la plantilla y sus versiones', () => {
  it('«Guardar plantilla»: la versión 1, sin cargas salvo el interruptor; la preparación deja de existir', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const p = await nueva(c);
    const g = leida((await guardar(c, p, { structure: estructuraConCargas(), name: 'Fuerza 3 días', description: 'Inicial' }).expect(200)).body);
    // La preparación conserva lo escrito: el interruptor decide qué va a la versión.
    expect(prescripcionesDe(g.structure)[0]!.suggestedLoad).toEqual({ value: 60, unit: 'kg' });
    const t = PlantillaDeEntrenamientoResponseSchema.parse((await publicar(c, g).expect(201)).body).data;
    expect(t).toMatchObject({ name: 'Fuerza 3 días', description: 'Inicial', state: 'ACTIVE', versionNumber: 1, copiedLoads: false, origin: null, sessionCount: 2 });
    const rx = prescripcionesDe(t.structure);
    expect(rx[0]!.suggestedLoad).toBeUndefined();
    expect((rx[2]!.sets as Record<string, unknown>[])[0]!.suggestedLoad).toBeUndefined();
    // Los identificadores de la preparación pasan a la versión.
    expect(rx.map((x) => x.prescriptionId)).toEqual(prescripcionesDe(g.structure).map((x) => x.prescriptionId));
    await conSesion(app, c.pro.token).get(`${PREPARACIONES}/${p.draftId}`).expect(404);
    await publicar(c, { draftId: p.draftId, version: 'v3' }).expect(404);
    expect(await prisma.preparacionDePlantillaDeEntrenamiento.count({ where: { profesionalId: c.pro.id } })).toBe(0);

    // Con el interruptor, las cargas quedan como referencia.
    const otra = await nueva(c);
    const conCargas = leida((await guardar(c, otra, { structure: estructuraConCargas(), name: 'Con cargas', copySuggestedLoads: true }).expect(200)).body);
    expect(conCargas.copySuggestedLoads).toBe(true);
    const t2 = PlantillaDeEntrenamientoResponseSchema.parse((await publicar(c, conCargas).expect(201)).body).data;
    expect(t2.copiedLoads).toBe(true);
    expect(prescripcionesDe(t2.structure)[0]!.suggestedLoad).toEqual({ value: 60, unit: 'kg' });
  });

  it('lo que impide guardar es 422 con su lugar; el nombre tomado, 409, sin distinguir mayúsculas ni acentos', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    await plantillaGuardada(c, 'Básico');
    const p = await nueva(c);
    const r = await publicar(c, p).expect(422);
    expect(r.body.error).toMatchObject({ code: 'OPERATION_NOT_READY', details: { issues: [{ code: 'TEMPLATE_NAME_REQUIRED', path: 'name' }, { code: 'TEMPLATE_SESSION_REQUIRED', path: 'blocks' }] } });
    // El 422 no consumió la preparación: sigue en su versión.
    const g = leida((await guardar(c, p, { structure: estructuraDeEntrenamiento(), name: '  BASICO ' }).expect(200)).body);
    const revision = RevisionDePreparacionResponseSchema.parse((await revisar(c, g).expect(200)).body).data;
    expect(revision.issues).toEqual([{ code: 'TEMPLATE_NAME_TAKEN', path: 'name' }]);
    expect((await publicar(c, g).expect(409)).body.error.code).toBe('TEMPLATE_NAME_TAKEN');
    const otroNombre = leida((await guardar(c, g, { structure: g.structure, name: 'Básico 2' }).expect(200)).body);
    await publicar(c, otroNombre).expect(201);
  });

  it('un ejercicio que se retiró se conserva en la preparación, lo dice la revisión y no se guarda como versión', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const propio = (await conSesion(app, c.pro.token).post('/api/v1/training/exercises', claveDeIdempotencia()).send({ name: `Remo propio ${etiqueta()}`, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data as {
      exerciseId: string;
      versionId: string;
    };
    const retirada = await prisma.versionDeEjercicio.create({ data: { ejercicioId: propio.exerciseId, predecesoraId: propio.versionId, nombre: 'Remo propio', disponibilidad: 'RETIRADO', procedencia: { prueba: 'PLT-D06' } } });
    const p = await nueva(c);
    const conRetirado = { blocks: [{ label: 'F', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: retirada.id, sets: [{ repetitions: { value: 8 } }], intensity: null }] }] }] };
    const g = leida((await guardar(c, p, { structure: conRetirado, name: 'Con un retirado' }).expect(200)).body);
    expect(g.exercises[retirada.id]).toMatchObject({ available: false });
    const revision = RevisionDePreparacionResponseSchema.parse((await revisar(c, g).expect(200)).body).data;
    expect(revision.issues).toEqual([{ code: 'EXERCISE_NOT_AVAILABLE', path: 'blocks[0].sessions[0].prescriptions[0].exerciseVersionId' }]);
    expect((await publicar(c, g).expect(422)).body.error.code).toBe('OPERATION_NOT_READY');
  });
});

describe('API-TPL-07, 13 y 14 · editar una plantilla existente sin tocar lo ya creado', () => {
  it('abre una sola preparación por plantilla; «Guardar nueva versión» crea la 2; la 1 y el plan ya creado no cambian', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = await plantillaGuardada(c, 'Evoluciona', { description: 'Primera' });
    // Un plan creado desde la versión 1, antes de editarla.
    const plan = PlanDeEntrenamientoResponseSchema.parse(
      (await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`, claveDeIdempotencia()).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: t.versionId }).expect(201)).body,
    ).data;

    const abierta = await conSesion(app, c.pro.token).put(`${PLANTILLAS}/${t.templateId}/draft`).send({}).expect(201);
    const p = leida(abierta.body);
    expect(p).toMatchObject({ templateId: t.templateId, baseVersionId: t.versionId, baseVersionNumber: 1, name: 'Evoluciona', description: 'Primera', templateState: 'ACTIVE', copySuggestedLoads: false });
    expect(prescripcionesDe(p.structure).map((x) => x.prescriptionId)).toEqual(prescripcionesDe(t.structure).map((x) => x.prescriptionId));
    // Tocar «Editar» otra vez retoma la misma.
    const otraVez = await conSesion(app, c.pro.token).put(`${PLANTILLAS}/${t.templateId}/draft`).expect(200);
    expect(leida(otraVez.body).draftId).toBe(p.draftId);
    // Sin cambios, no se guarda una versión igual a la 1 (PLT-D10).
    expect(RevisionDePreparacionResponseSchema.parse((await revisar(c, p).expect(200)).body).data.issues).toEqual([{ code: 'TEMPLATE_UNCHANGED', path: 'blocks' }]);
    expect((await publicar(c, p).expect(422)).body.error.details.issues).toEqual([{ code: 'TEMPLATE_UNCHANGED', path: 'blocks' }]);
    // El nombre y la descripción de una existente se cambian en la plantilla (PLT-D05).
    expect((await guardar(c, p, { structure: p.structure, name: 'Otro' }).expect(422)).body.error.code).toBe('VALIDATION_FAILED');

    const cambiada = structuredClone(p.structure) as { blocks: { sessions: { label: string }[] }[] };
    cambiada.blocks[0]!.sessions[1]!.label = 'Sesión B cambiada';
    const g = leida((await guardar(c, p, { structure: cambiada }).expect(200)).body);
    // Mientras se prepara, la plantilla sigue en la versión 1.
    expect(PlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`${PLANTILLAS}/${t.templateId}`).expect(200)).body).data.versionNumber).toBe(1);
    const v2 = PlantillaDeEntrenamientoResponseSchema.parse((await publicar(c, g).expect(201)).body).data;
    expect(v2).toMatchObject({ templateId: t.templateId, versionNumber: 2, name: 'Evoluciona', description: 'Primera' });
    expect(v2.structure.blocks[0]!.sessions![1]!.label).toBe('Sesión B cambiada');

    // La versión 1 sigue igual en la base, y el plan que salió de ella también, con su origen.
    const v1 = await prisma.versionDePlantillaDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: t.versionId } });
    expect((v1.estructura as { blocks: { sessions: { label: string }[] }[] }).blocks[0]!.sessions[1]!.label).toBe('Sesión B');
    const elPlan = PlanDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body).data;
    expect(elPlan.templateOrigin).toEqual({ templateId: t.templateId, templateVersionId: t.versionId });
    expect(elPlan.blocks[0]!.sessions[1]!.label).toBe('Sesión B');

    // Las versiones: de la más nueva a la primera, con cuántos planes salieron de cada una (sin nombrar a nadie).
    const versiones = VersionesDePlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`${PLANTILLAS}/${t.templateId}/versions`).expect(200)).body).data;
    expect(versiones.map((v) => [v.versionNumber, v.versionId, v.plansCreated, v.sessionCount])).toEqual([
      [2, v2.versionId, 0, 2],
      [1, t.versionId, 1, 2],
    ]);
    expect(JSON.stringify(versiones)).not.toContain(c.ase.id);
    // Un plan descartado ya no cuenta.
    await conSesion(app, c.pro.token).post(`/api/v1/training/plans/${plan.planId}/discard`, claveDeIdempotencia()).send({ expectedVersion: plan.version }).expect(200);
    const despues = VersionesDePlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`${PLANTILLAS}/${t.templateId}/versions`).expect(200)).body).data;
    expect(despues.map((v) => v.plansCreated)).toEqual([0, 0]);
  });

  it('descartar deja las versiones como estaban; «desde una existente» es otra plantilla, con su nombre de copia', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = await plantillaGuardada(c, 'Original');
    const p = leida((await conSesion(app, c.pro.token).put(`${PLANTILLAS}/${t.templateId}/draft`).send({}).expect(201)).body);
    const g = leida((await guardar(c, p, { structure: { blocks: [{ label: 'Otra', sessions: [{ label: 'X', prescriptions: [] }] }] } }).expect(200)).body);
    await conSesion(app, c.pro.token).post(`${PREPARACIONES}/${p.draftId}/discard`, claveDeIdempotencia()).send({ expectedVersion: 'v1' }).expect(409);
    const descarte = await conSesion(app, c.pro.token).post(`${PREPARACIONES}/${p.draftId}/discard`, claveDeIdempotencia()).send({ expectedVersion: g.version }).expect(200);
    expect(descarte.body.data).toMatchObject({ draftId: p.draftId, discardedAt: expect.any(String) });
    await conSesion(app, c.pro.token).get(`${PREPARACIONES}/${p.draftId}`).expect(404);
    const igual = PlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`${PLANTILLAS}/${t.templateId}`).expect(200)).body).data;
    expect(igual).toMatchObject({ versionNumber: 1, structure: t.structure });

    const copia = await nueva(c, { fromTemplateVersionId: t.versionId });
    expect(copia).toMatchObject({ templateId: null, baseVersionId: null, name: 'Original · copia', sessionCount: 2 });
    const guardada = PlantillaDeEntrenamientoResponseSchema.parse((await publicar(c, copia).expect(201)).body).data;
    expect(guardada.templateId).not.toBe(t.templateId);
    expect(guardada.name).toBe('Original · copia');
    expect(PlantillaDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`${PLANTILLAS}/${t.templateId}`).expect(200)).body).data.versionNumber).toBe(1);
  });

  it('archivada: no se edita (422) ni se guarda su versión nueva; se copia; si cambió la versión de base, 409', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = await plantillaGuardada(c, 'Para archivar');
    const p = leida((await conSesion(app, c.pro.token).put(`${PLANTILLAS}/${t.templateId}/draft`).expect(201)).body);
    await conSesion(app, c.pro.token).patch(`${PLANTILLAS}/${t.templateId}`).send({ expectedVersion: t.version, state: 'ARCHIVED' }).expect(200);
    const revision = RevisionDePreparacionResponseSchema.parse((await revisar(c, p).expect(200)).body).data;
    expect(revision.issues).toEqual([
      { code: 'TEMPLATE_UNCHANGED', path: 'blocks' },
      { code: 'TEMPLATE_ARCHIVED', path: 'templateId' },
    ]);
    expect((await publicar(c, p).expect(422)).body.error.code).toBe('TEMPLATE_ARCHIVED');
    // La que ya estaba se retoma (200); abrir otra no se puede mientras esté archivada.
    await conSesion(app, c.pro.token).post(`${PREPARACIONES}/${p.draftId}/discard`, claveDeIdempotencia()).send({ expectedVersion: p.version }).expect(200);
    expect((await conSesion(app, c.pro.token).put(`${PLANTILLAS}/${t.templateId}/draft`).expect(422)).body.error.code).toBe('TEMPLATE_ARCHIVED');
    await nueva(c, { fromTemplateVersionId: t.versionId });

    // Una versión nueva por otro camino (API-TPL-04) deja vieja la base de la preparación.
    const u = await plantillaGuardada(c, 'Base que cambia');
    const q = leida((await conSesion(app, c.pro.token).put(`${PLANTILLAS}/${u.templateId}/draft`).expect(201)).body);
    await conSesion(app, c.pro.token).post(`${PLANTILLAS}/${u.templateId}/versions`, claveDeIdempotencia()).send({ expectedVersion: u.version, structure: estructuraDeEntrenamiento() }).expect(201);
    expect((await publicar(c, q).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
  });
});

describe('API-TPL-06 a 14 · la plantilla es del profesional', () => {
  it('lo ajeno es 404 neutral, como lo inexistente; un asesorado o un profesional sin Entrenamiento, 403', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = await plantillaGuardada(c, 'Mía');
    const p = await nueva(c);
    const otro = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const ajeno = conSesion(app, otro.pro.token);
    const inexistente = randomUUID();
    for (const id of [p.draftId, inexistente]) {
      await ajeno.get(`${PREPARACIONES}/${id}`).expect(404);
      await ajeno.patch(`${PREPARACIONES}/${id}`).send({ expectedVersion: 'v1', structure: estructuraDeEntrenamiento() }).expect(404);
      await ajeno.post(`${PREPARACIONES}/${id}/review`).send({ expectedVersion: 'v1' }).expect(404);
      await ajeno.post(`${PREPARACIONES}/${id}/publish`, claveDeIdempotencia()).send({ expectedVersion: 'v1' }).expect(404);
      await ajeno.post(`${PREPARACIONES}/${id}/discard`, claveDeIdempotencia()).send({ expectedVersion: 'v1' }).expect(404);
    }
    for (const id of [t.templateId, inexistente]) {
      await ajeno.put(`${PLANTILLAS}/${id}/draft`).send({}).expect(404);
      await ajeno.get(`${PLANTILLAS}/${id}/versions`).expect(404);
    }
    await ajeno.post(PREPARACIONES, claveDeIdempotencia()).send({ fromTemplateVersionId: t.versionId }).expect(404);
    expect(ListaDePreparacionesDePlantillaResponseSchema.parse((await ajeno.get(PREPARACIONES).expect(200)).body).data).toEqual([]);
    // El 404 de lo ajeno y el de lo inexistente son el mismo cuerpo.
    const a = await ajeno.get(`${PREPARACIONES}/${p.draftId}`).expect(404);
    const b = await ajeno.get(`${PREPARACIONES}/${inexistente}`).expect(404);
    expect(a.body).toEqual(b.body);
    // Nada cambió.
    expect(leida((await conSesion(app, c.pro.token).get(`${PREPARACIONES}/${p.draftId}`).expect(200)).body).version).toBe('v1');

    // La persona no llega a las plantillas por ningún lado.
    await conSesion(app, c.ase.token).get(PREPARACIONES).expect(403);
    await conSesion(app, c.ase.token).post(PREPARACIONES, claveDeIdempotencia()).send({}).expect(403);
    await conSesion(app, c.ase.token).get(`${PLANTILLAS}/${t.templateId}/versions`).expect(403);
    const nutricionista = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    await conSesion(app, nutricionista.token).post(PREPARACIONES, claveDeIdempotencia()).send({}).expect(403);
  });
});

describe('API-TPL-07, 10 y 12 · escrituras simultáneas (la base las ordena; nunca un 500)', () => {
  // Cuatro a la vez: menos que las conexiones de la app con la base, así todos llegan a esperar la fila (con más, el resto
  // espera una conexión, que la base no muestra como un bloqueo).
  const N = 4;
  const repetido = (codigo: string, n = N - 1) => Array<string>(n).fill(codigo);

  /**
   * Una transacción de la prueba retiene una fila; los pedidos llegan y quedan esperándola; se suelta recién cuando la
   * base dice que esperan todos (`pg_stat_activity`). El primero que esperó sigue primero. Sin pausas.
   */
  async function conLaFila<T>(tabla: 'preparacion_de_plantilla_de_entrenamiento' | 'plantilla_de_plan_de_entrenamiento', id: string, esperan: number, pedidos: () => Promise<T>[]): Promise<T[]> {
    let enviados: Promise<T[]> | undefined;
    await prisma.$transaction(
      async (tx) => {
        if (tabla === 'preparacion_de_plantilla_de_entrenamiento') await tx.$queryRaw`SELECT 1 FROM "preparacion_de_plantilla_de_entrenamiento" WHERE "id" = ${id}::uuid FOR UPDATE`;
        else await tx.$queryRaw`SELECT 1 FROM "plantilla_de_plan_de_entrenamiento" WHERE "id" = ${id}::uuid FOR UPDATE`;
        const pid = await pidDeLaTransaccion(tx);
        enviados = Promise.all(pedidos());
        // Esperan en fila: el primero, a esta transacción; los demás, al de adelante (el cerrojo de la tupla). Se cuentan todos.
        await esperarQueEsperen(prisma, esperan, { que: `${esperan} pedidos esperando la fila de ${tabla} (la retiene el proceso ${pid})` });
      },
      { timeout: 40_000, maxWait: 10_000 },
    );
    return enviados as Promise<T[]>;
  }

  it('cuatro autoguardados con la misma versión: uno solo; cuatro «Guardar» a la vez: una sola versión', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const p = await nueva(c);
    const guardados = await conLaFila('preparacion_de_plantilla_de_entrenamiento', p.draftId, N, () =>
      Array.from({ length: N }, (_, i) => guardar(c, p, { structure: estructuraDeEntrenamiento(), name: `Simultánea ${i}` }).then((r) => r)),
    );
    expect(resumenDeRespuestas(guardados)).toEqual(['200', ...repetido('409 VERSION_CONFLICT')]);
    const g = leida((await conSesion(app, c.pro.token).get(`${PREPARACIONES}/${p.draftId}`).expect(200)).body);
    expect(g.version).toBe('v2');

    const publicaciones = await conLaFila('preparacion_de_plantilla_de_entrenamiento', p.draftId, N, () =>
      Array.from({ length: N }, () => conSesion(app, c.pro.token).post(`${PREPARACIONES}/${p.draftId}/publish`).send({ expectedVersion: g.version }).then((r) => r)),
    );
    expect(resumenDeRespuestas(publicaciones)).toEqual(['201', ...repetido('409 VERSION_CONFLICT')]);
    expect(await prisma.plantillaDePlanDeEntrenamiento.count({ where: { profesionalId: c.pro.id } })).toBe(1);
    expect(await prisma.versionDePlantillaDePlanDeEntrenamiento.count({ where: { plantilla: { profesionalId: c.pro.id } } })).toBe(1);
  });

  it('dos «Editar» a la vez dan la misma preparación: la plantilla las ordena', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const t = await plantillaGuardada(c, 'Dos pestañas');
    const aperturas = await conLaFila('plantilla_de_plan_de_entrenamiento', t.templateId, 2, () => [1, 2].map(() => conSesion(app, c.pro.token).put(`${PLANTILLAS}/${t.templateId}/draft`).send({}).then((r) => r)));
    expect(aperturas.map((r) => r.status).sort()).toEqual([200, 201]);
    expect(new Set(aperturas.map((r) => leida(r.body).draftId)).size).toBe(1);
    expect(await prisma.preparacionDePlantillaDeEntrenamiento.count({ where: { plantillaId: t.templateId } })).toBe(1);
  });
});
