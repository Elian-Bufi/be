/**
 * API-DSH-04 · la cartera del profesional (PF-07, propuesta del 2026-09-30).
 *
 * Lo que estas pruebas fijan:
 * - cada pendiente sale de un hecho fechado que ya existe (expectativa de revisión, borrador, ausencia de Proceso,
 *   solicitud sin respuesta, evaluación en preparación) y se clasifica por fechas civiles;
 * - un dominio que el PDP deniega no aparece ni filtra nada, y `partialView` lo avisa una sola vez;
 * - otro profesional no ve nada de estos asesorados; un asesorado como actor no ve cartera;
 * - el orden es por urgencia; los filtros y la paginación recorren la misma lista;
 * - la última actividad es un dato del ítem: nunca hay un ítem por «sin registros»;
 * - ninguna palabra que califique a la persona (09v11 §15, regla crítica; B10-08 §10).
 */
import type { INestApplication } from '@nestjs/common';
import { CarteraResponseSchema, type CarteraResponse } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { borradorSembrado, circuitoAntropometrico } from './soporte-antropometria';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoListoParaPlanificarEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { activar, circuitoListoParaPlanificar, crearBorrador, PUNTAJE_PROHIBIDO, registrarComida } from './soporte-nutricion';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `car-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const cartera = async (pro: Parte, query = ''): Promise<CarteraResponse> => CarteraResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/me/portfolio${query}`).expect(200)).body);
const de = (r: CarteraResponse, adviseeId: string) => r.data.items.filter((i) => i.advisee.identityId === adviseeId);
const enDias = (n: number): string => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

describe('API-DSH-04 · pendientes por hechos fechados', () => {
  it('nutrición: revisión vencida (desde la expectativa del Proceso), plan en borrador, y sin plan activo; orden por urgencia', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    // A: plan activado con próxima revisión en el pasado → REVIEW_OVERDUE con días de atraso.
    const a = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    const bA = await crearBorrador(app, a, { nextReviewAt: '2026-01-15' });
    await activar(app, pro, bA.planId, bA.version).expect(200);
    await registrarComida(app, a.ase, bA.planId, (await conSesion(app, a.ase.token).get('/api/v1/me/nutrition/today').expect(200)).body.data.activePlan.dayTypes[0]).expect(201);
    // B: solo un borrador → PLAN_DRAFT_PENDING (y no NO_ACTIVE_PLAN: hay trabajo empezado).
    const b = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    await crearBorrador(app, b);
    // C: vínculo sin plan → NO_ACTIVE_PLAN.
    const cAse = await prepararAsesorado(app, etiqueta(), { a3: true });
    await vinculoCompleto(app, pro, cAse, 'NUTRICION');

    const r = await cartera(pro);
    expect(r.data.partialView).toBe(false);
    expect(r.data.timeZone).toBe('America/Argentina/Buenos_Aires');
    const deA = de(r, a.ase.id);
    expect(deA.map((i) => i.kind)).toEqual(['REVIEW_OVERDUE']);
    expect(deA[0]).toMatchObject({ domain: 'nutrition', since: '2026-01-15', daysUntil: null, activityCount: 1, open: { view: 'revisiones' } });
    expect(deA[0]!.daysOverdue).toBeGreaterThan(200);
    expect(deA[0]!.lastActivityAt).not.toBeNull();
    expect(de(r, b.ase.id).map((i) => [i.kind, i.open.view, i.activityCount])).toEqual([['PLAN_DRAFT_PENDING', 'plan', 0]]);
    expect(de(r, b.ase.id)[0]!.since).toBe(r.data.today);
    expect(de(r, cAse.id).map((i) => [i.kind, i.since])).toEqual([['NO_ACTIVE_PLAN', null]]);
    // Orden: vencida, borrador, sin plan.
    expect(r.data.items.map((i) => i.kind)).toEqual(['REVIEW_OVERDUE', 'PLAN_DRAFT_PENDING', 'NO_ACTIVE_PLAN']);
    // Nada califica a nadie.
    expect(JSON.stringify(r)).not.toMatch(PUNTAJE_PROHIBIDO);
  });

  it('entrenamiento: revisión próxima dentro de la ventana de 7 días, y formulario sin responder como pendiente aparte', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const creado = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/training/plans`)
      .send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraDeEntrenamiento(), nextReviewAt: enDias(3) })
      .expect(201);
    await conSesion(app, c.pro.token).post(`/api/v1/training/plans/${creado.body.data.planId}/activate`, claveDeIdempotencia()).send({ expectedVersion: creado.body.data.version }).expect(200);
    await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/form-requests`, claveDeIdempotencia())
      .send({ templateVersionId: '349161b3-b831-4df1-896f-484517393a57', purpose: 'Seguridad del entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: ['condiciones_declaradas'], requiredFieldCodes: [] })
      .expect(201);

    const r = await cartera(c.pro);
    const items = de(r, c.ase.id);
    expect(items.map((i) => [i.kind, i.domain, i.open.view])).toEqual([
      ['REVIEW_DUE_SOON', 'training', 'revisiones'],
      ['FORM_REQUEST_OPEN', 'training', 'solicitudes'],
    ]);
    expect(items[0]!.daysUntil).toBeGreaterThanOrEqual(2);
    expect(items[0]!.daysUntil).toBeLessThanOrEqual(4);
    expect(items[0]!.daysOverdue).toBeNull();
    expect(items[1]!.since).toBe(r.data.today);
    // Más allá de la ventana no es un pendiente todavía: otro asesorado con revisión a 30 días.
    const lejos = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta(), c.pro);
    const cr = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${lejos.ase.id}/training/plans`)
      .send({ objectiveVersionId: lejos.objectiveVersionId, initialStructure: estructuraDeEntrenamiento(), nextReviewAt: enDias(30) })
      .expect(201);
    await conSesion(app, c.pro.token).post(`/api/v1/training/plans/${cr.body.data.planId}/activate`, claveDeIdempotencia()).send({ expectedVersion: cr.body.data.version }).expect(200);
    expect(de(await cartera(c.pro), lejos.ase.id)).toEqual([]);
  });

  it('antropometría: una evaluación en preparación es un pendiente; las registradas son actividad, no pendiente', async () => {
    const c = await circuitoAntropometrico(app, prisma, etiqueta());
    expect(de(await cartera(c.pro), c.ase.id)).toEqual([]);
    await borradorSembrado(prisma, c);
    const items = de(await cartera(c.pro), c.ase.id);
    expect(items.map((i) => [i.kind, i.domain, i.open.view, i.activityCount])).toEqual([['ANTHRO_DRAFT_PENDING', 'anthropometry', 'preparacion', 0]]);
  });
});

describe('API-DSH-04 · acceso', () => {
  it('un alcance con vínculo aceptado que el PDP deniega desaparece y deja partialView; otro profesional no ve nada; un asesorado no tiene cartera', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const a = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    await crearBorrador(app, a);
    const b = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    await crearBorrador(app, b);
    expect((await cartera(pro)).data.items).toHaveLength(2);

    await revocarB2(app, a.ase, a.consentId).expect(200);
    const r = await cartera(pro);
    expect(r.data.partialView).toBe(true);
    expect(r.data.items.map((i) => i.advisee.identityId)).toEqual([b.ase.id]);
    expect(JSON.stringify(r)).not.toContain(a.ase.id);

    const otro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const ajena = await cartera(otro);
    expect(ajena.data.items).toEqual([]);
    expect(ajena.data.partialView).toBe(false);

    const comoAsesorado = await cartera(b.ase);
    expect(comoAsesorado.data.items).toEqual([]);
  });

  it('sin sesión, 401; la query se valida antes de leer', async () => {
    await conSesion(app, 'token-invalido').get('/api/v1/me/portfolio').expect(401);
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const s = conSesion(app, pro.token);
    expect((await s.get('/api/v1/me/portfolio?foo=1').expect(400)).body.error.code).toBe('INVALID_REQUEST');
    await s.get('/api/v1/me/portfolio?domain=sleep').expect(400);
    await s.get('/api/v1/me/portfolio?kind=SCORE').expect(400);
    await s.get('/api/v1/me/portfolio?periodStart=ayer').expect(400);
    await s.get('/api/v1/me/portfolio?limit=0').expect(400);
    expect((await s.get('/api/v1/me/portfolio?cursor=%3F%3F').expect(400)).body.error.code).toBe('INVALID_CURSOR');
  });
});

describe('API-DSH-04 · filtros, período y paginación', () => {
  it('domain y kind acotan; el período solo cambia la actividad; la paginación recorre la lista ordenada sin repetir', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const a = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    const bA = await crearBorrador(app, a, { nextReviewAt: '2026-02-01' });
    await activar(app, pro, bA.planId, bA.version).expect(200);
    const dia = (await conSesion(app, a.ase.token).get('/api/v1/me/nutrition/today').expect(200)).body.data.activePlan.dayTypes[0];
    await registrarComida(app, a.ase, bA.planId, dia).expect(201);
    const b = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    await crearBorrador(app, b);
    const cAse = await prepararAsesorado(app, etiqueta(), { a3: true });
    await vinculoCompleto(app, pro, cAse, 'NUTRICION');

    expect((await cartera(pro, '?domain=training')).data.items).toEqual([]);
    expect((await cartera(pro, '?kind=PLAN_DRAFT_PENDING')).data.items.map((i) => i.advisee.identityId)).toEqual([b.ase.id]);
    // Un período futuro deja la actividad en cero, pero la revisión vencida sigue siendo un pendiente.
    const futuro = await cartera(pro, '?periodStart=2099-01-01');
    expect(de(futuro, a.ase.id)[0]).toMatchObject({ kind: 'REVIEW_OVERDUE', activityCount: 0, lastActivityAt: null });
    expect(futuro.data.period.start).toBe('2099-01-01');
    await conSesion(app, pro.token).get('/api/v1/me/portfolio?periodStart=2026-02-30').expect(400);
    await conSesion(app, pro.token).get('/api/v1/me/portfolio?periodStart=2026-03-02&periodEnd=2026-03-01').expect(400);

    const p1 = await cartera(pro, '?limit=2');
    expect(p1.data.items).toHaveLength(2);
    expect(p1.page).toMatchObject({ limit: 2, hasMore: true });
    const p2 = await cartera(pro, `?limit=2&cursor=${encodeURIComponent(p1.page.nextCursor as string)}`);
    expect(p2.data.items).toHaveLength(1);
    expect(p2.page.hasMore).toBe(false);
    const todos = [...p1.data.items, ...p2.data.items].map((i) => i.kind);
    expect(todos).toEqual(['REVIEW_OVERDUE', 'PLAN_DRAFT_PENDING', 'NO_ACTIVE_PLAN']);
  });
});
