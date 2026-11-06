/**
 * WP-TABLERO-ALTA-GAMA · TB-47 (DL-163 D-21): descartar un borrador de plan que nunca se activó, en Nutrición (API-PLN-07)
 * y en Entrenamiento (API-PLE-05).
 *
 * TEST-TAG-029 · una versión activada no se descarta nunca. Descartar un borrador deja su evento y su auditoría; lo
 * descartado no se lista, no se lee ni se escribe (el mismo 404 que lo inexistente); y libera «Empezar desde una
 * plantilla» (un borrador nuevo, raíz otra vez) y la aplicación de una revisión «Ajustar». La base lo exige también: si el
 * código se equivocara, igual no se podría descartar una activada ni reabrir una descartada.
 */
import type { INestApplication } from '@nestjs/common';
import { DescarteDeBorradorResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento } from './soporte-entrenamiento';
import { circuitoConPlanActivo, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, estructura, patchConSesion, PUNTAJE_PROHIBIDO } from './soporte-nutricion';
import { prepararProfesional, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `descarte-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const descartar = (pro: Parte, planId: string, expectedVersion: string, clave = claveDeIdempotencia()) =>
  conSesion(app, pro.token).post(`/api/v1/nutrition/plans/${planId}/discard`, clave).send({ expectedVersion });
const descartarEntrenamiento = (pro: Parte, planId: string, expectedVersion: string, clave = claveDeIdempotencia()) =>
  conSesion(app, pro.token).post(`/api/v1/training/plans/${planId}/discard`, clave).send({ expectedVersion });
const idsDeLaLista = async (pro: Parte, ruta: string): Promise<string[]> => ((await conSesion(app, pro.token).get(ruta).expect(200)).body.data as { planId: string }[]).map((v) => v.planId);

const REVERTIR = new Error('revertir');
/** La sentencia, en una transacción que siempre se revierte; devuelve el error de la base o «SIN ERROR». */
async function errorDeLaBase(...sentencias: string[]): Promise<string> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const s of sentencias) await tx.$executeRawUnsafe(s);
      throw REVERTIR;
    });
  } catch (e) {
    return e === REVERTIR ? 'SIN ERROR' : String((e as Error).message);
  }
  return 'SIN ERROR';
}
/** Igual, confirmando: el hecho de la transición se exige al confirmar (constraint trigger diferido). */
async function errorAlConfirmar(...sentencias: string[]): Promise<string> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const s of sentencias) await tx.$executeRawUnsafe(s);
    });
    return 'SIN ERROR';
  } catch (e) {
    return String((e as Error).message);
  }
}

describe('TEST-TAG-029 · Nutrición (API-PLN-07)', () => {
  it('un plan que nunca se activó: descartar deja evento y auditoría, la versión no existe más para nadie y el borrador nuevo vuelve a ser la raíz', async () => {
    const c = await circuitoListoParaPlanificar(app, etiqueta());
    const b = await crearBorrador(app, c);
    const contenidoAntes = (await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: b.planId } })).contenido;

    const clave = claveDeIdempotencia();
    const r = await descartar(c.pro, b.planId, b.version, clave).expect(200);
    const cuerpo = DescarteDeBorradorResponseSchema.parse(r.body);
    expect(cuerpo.data.planId).toBe(b.planId);
    expect(JSON.stringify(r.body)).not.toMatch(PUNTAJE_PROHIBIDO);

    // Repetir con la misma clave devuelve la misma respuesta; la misma clave con otro cuerpo, 409.
    expect((await descartar(c.pro, b.planId, b.version, clave).expect(200)).body).toEqual(r.body);
    expect((await descartar(c.pro, b.planId, 'v9', clave).expect(409)).body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');

    // La fila se guarda, sin cambiar: la historia es por adición (06 §4.4).
    const fila = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: b.planId } });
    expect(fila).toMatchObject({ estado: 'DESCARTADA', version: 2, momentoDeActivacion: null, predecesoraId: null });
    expect(fila.contenido).toEqual(contenidoAntes);
    // Quién y cuándo: el evento y la auditoría de la operación (TA-63).
    const eventos = await prisma.eventoDeNutricion.findMany({ where: { recursoId: b.planId, tipo: 'BorradorDePlanDescartado' } });
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ estadoPrevio: 'BORRADOR', estadoPosterior: 'DESCARTADA', actorId: c.pro.id, asesoradoId: c.ase.id });
    expect(eventos[0]!.momentoDeOcurrencia?.toISOString()).toBe(cuerpo.data.discardedAt);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-PLN-07', resultado: 'EXITO', recursoId: b.planId, actorId: c.pro.id } })).toBe(1);

    // Lo descartado no se lee, no se lista y no se escribe: el mismo 404 que lo inexistente.
    const pro = conSesion(app, c.pro.token);
    expect((await pro.get(`/api/v1/nutrition/plans/${b.planId}`).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(await idsDeLaLista(c.pro, `/api/v1/advisees/${c.ase.id}/nutrition/plans`)).not.toContain(b.planId);
    expect(await idsDeLaLista(c.pro, `/api/v1/advisees/${c.ase.id}/nutrition/plans?state=DRAFT`)).not.toContain(b.planId);
    await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: 'v2', changes: estructura(c.arroz, c.pollo) }).expect(404);
    await pro.post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: 'v2' }).expect(404);
    await pro.post(`/api/v1/nutrition/plans/${b.planId}/activate`).send({ expectedVersion: 'v2' }).expect(404);
    // Descartar dos veces: 404.
    await descartar(c.pro, b.planId, 'v2').expect(404);
    // «Guardar como plantilla» con el descartado como origen: el mismo rechazo que un origen inexistente.
    const plantilla = { name: `Desde un descartado ${randomUUID().slice(0, 6)}`, structure: estructura(c.arroz, c.pollo), origin: { planVersionId: b.planId } };
    const sinOrigen = await pro.post('/api/v1/nutrition/plan-templates').send(plantilla).expect(422);
    expect(sinOrigen.body.error.details.issues).toEqual([expect.objectContaining({ code: 'TEMPLATE_ORIGIN_NOT_OWN' })]);
    expect((await pro.post('/api/v1/nutrition/plan-templates').send({ ...plantilla, origin: { planVersionId: randomUUID() } }).expect(422)).body.error.code).toBe(sinOrigen.body.error.code);

    // Libera el lugar: el borrador nuevo vuelve a ser la raíz del plan, y se puede activar.
    const nuevo = await crearBorrador(app, c);
    expect(nuevo.body).toMatchObject({ state: 'DRAFT', predecessorPlanId: null });
    expect(await idsDeLaLista(c.pro, `/api/v1/advisees/${c.ase.id}/nutrition/plans`)).toEqual([nuevo.planId]);
    await conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${nuevo.planId}/activate`).send({ expectedVersion: nuevo.version }).expect(200);
  });

  it('un plan activado con un borrador: «Ajustar» no se aplica; descartar el borrador la libera; la versión activada nunca se descarta', async () => {
    const c = await circuitoConPlanActivo(app, etiqueta());
    const pro = conSesion(app, c.pro.token);
    const viejo = (await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201)).body.data;
    expect(viejo.predecessorPlanId).toBe(c.planId);
    const ajuste = (await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision([{ type: 'PLAN_VERSION', id: c.planId }], 'ADJUST')).expect(201)).body.data;
    const aplicar = () => pro.post(`/api/v1/nutrition/reviews/${ajuste.reviewId}/apply`).send({ expectedVersion: 'v1' });
    expect((await aplicar().expect(422)).body.error.code).toBe('CONTINUITY_ACTION_NOT_APPLICABLE');

    // Una versión esperada vieja: 409. Otro profesional: el mismo 404 que lo inexistente.
    expect((await descartar(c.pro, viejo.planId, 'v9').expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    const otro = await prepararProfesional(app, `otro-${etiqueta()}`, ['NUTRICION']);
    expect((await descartar(otro, viejo.planId, viejo.version).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect((await descartar(c.pro, randomUUID(), 'v1').expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect((await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: viejo.planId } })).estado).toBe('BORRADOR');

    // La versión activada no se descarta nunca, con la versión que sea, y la persona la sigue viendo.
    const activada = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: c.planId } });
    for (const version of [`v${activada.version}`, 'v1']) {
      const r = await descartar(c.pro, c.planId, version).expect(422);
      expect(r.body.error).toMatchObject({ code: 'PLAN_NOT_EDITABLE', message: 'Esta versión ya se activó: no se descarta nunca.' });
    }
    expect(await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: c.planId } })).toMatchObject({ estado: 'ACTIVADA', version: activada.version });
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-PLN-07', resultado: 'RECHAZO', motivo: 'PLAN_NOT_EDITABLE', recursoId: c.planId } })).toBe(2);
    const hoy = (await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200)).body.data;
    expect(hoy).toMatchObject({ planState: 'AVAILABLE', activePlan: expect.objectContaining({ planId: c.planId }) });

    // Descartar el borrador libera la revisión: se aplica y prepara la sucesora de la vigente.
    await descartar(c.pro, viejo.planId, viejo.version).expect(200);
    const aplicada = (await aplicar().expect(200)).body.data;
    const sucesora = aplicada.application.createdPlanId as string;
    expect(sucesora).not.toBe(viejo.planId);
    expect((await pro.get(`/api/v1/nutrition/plans/${sucesora}`).expect(200)).body.data).toMatchObject({ state: 'DRAFT', predecessorPlanId: c.planId });
    expect(await idsDeLaLista(c.pro, `/api/v1/advisees/${c.ase.id}/nutrition/plans?state=DRAFT`)).toEqual([sucesora]);
    // La persona sigue con el mismo plan: el borrador nunca se le presentó.
    expect((await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200)).body.data.activePlan.planId).toBe(c.planId);
    // Y el borrador descartado no es visible para ella tampoco.
    await conSesion(app, c.ase.token).get(`/api/v1/nutrition/plans/${viejo.planId}`).expect(404);
  });
});

describe('TEST-TAG-029 · Entrenamiento (API-PLE-05)', () => {
  it('descartar un borrador deja su evento; después no existe; el borrador nuevo vuelve a ser la raíz; una activada no se descarta nunca', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const b = await crearBorradorDeEntrenamiento(app, c);
    const r = await descartarEntrenamiento(c.pro, b.planId, b.version).expect(200);
    expect(DescarteDeBorradorResponseSchema.parse(r.body).data.planId).toBe(b.planId);
    expect(await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: b.planId } })).toMatchObject({ estado: 'DESCARTADA', momentoDeActivacion: null });
    const eventos = await prisma.eventoDeEntrenamiento.findMany({ where: { recursoId: b.planId, tipo: 'BorradorDePlanDeEntrenamientoDescartado' } });
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ estadoPrevio: 'BORRADOR', estadoPosterior: 'DESCARTADA', actorId: c.pro.id });
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-PLE-05', resultado: 'EXITO', recursoId: b.planId } })).toBe(1);

    const pro = conSesion(app, c.pro.token);
    await pro.get(`/api/v1/training/plans/${b.planId}`).expect(404);
    await pro.get(`/api/v1/training/plans/${b.planId}/detail`).expect(404); // API-SER-01
    expect(await idsDeLaLista(c.pro, `/api/v1/advisees/${c.ase.id}/training/plans`)).not.toContain(b.planId);
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, 'v2').expect(404);
    await descartarEntrenamiento(c.pro, b.planId, 'v2').expect(404);

    const nuevo = await crearBorradorDeEntrenamiento(app, c);
    expect(nuevo.body).toMatchObject({ state: 'DRAFT', predecessorPlanId: null });
    const act = await activarPlanDeEntrenamiento(app, c.pro, nuevo.planId, nuevo.version).expect(200);
    const r422 = await descartarEntrenamiento(c.pro, nuevo.planId, act.body.data.version as string).expect(422);
    expect(r422.body.error).toMatchObject({ code: 'PLAN_NOT_EDITABLE', message: 'Esta versión ya se activó: no se descarta nunca.' });
    expect((await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: nuevo.planId } })).estado).toBe('ACTIVADA');
  });
});

describe('TEST-TAG-029 · la base lo exige aunque el código se equivoque', () => {
  it('una activada no pasa a DESCARTADA; una descartada es terminal y no se borra; descartar no cambia el borrador y deja su hecho', async () => {
    const c = await circuitoConPlanActivo(app, etiqueta());
    const borrador = (await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201)).body.data;
    const n = 'version_de_plan_nutricional';
    expect(await errorDeLaBase(`UPDATE ${n} SET estado = 'DESCARTADA', version = version + 1 WHERE id = '${c.planId}'`)).toMatch(/ACTIVADA es inmutable/);
    expect(await errorDeLaBase(`UPDATE ${n} SET estado = 'DESCARTADA', contenido = '{"dayTypes":[]}', version = version + 1 WHERE id = '${borrador.planId}'`)).toMatch(/descartar no cambia el borrador/);
    expect(await errorAlConfirmar(`UPDATE ${n} SET estado = 'DESCARTADA', version = version + 1 WHERE id = '${borrador.planId}'`)).toMatch(/no registró su hecho/);

    await descartar(c.pro, borrador.planId, borrador.version).expect(200);
    expect(await errorDeLaBase(`UPDATE ${n} SET estado = 'BORRADOR', version = version + 1 WHERE id = '${borrador.planId}'`)).toMatch(/DESCARTADA es terminal/);
    expect(await errorDeLaBase(`UPDATE ${n} SET estado = 'ACTIVADA', version = version + 1, momento_de_activacion = now() WHERE id = '${borrador.planId}'`)).toMatch(/DESCARTADA es terminal/);
    expect(await errorDeLaBase(`DELETE FROM ${n} WHERE id = '${borrador.planId}'`)).toMatch(/no se elimina/);
    // Una sola sucesora viva por versión: el descartado no cuenta, pero dos vivas siguen sin poder convivir.
    const fila = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: c.planId } });
    const sucesora = () =>
      `INSERT INTO ${n} (id, plan_id, predecesora_id, version_de_objetivo_id, contenido, autor_id, procedencia)
       VALUES ('${randomUUID()}', '${fila.planId}', '${c.planId}', '${fila.versionDeObjetivoId}', '{"dayTypes":[]}', '${c.pro.id}', '{}')`;
    expect(await errorDeLaBase(sucesora())).toBe('SIN ERROR');
    expect(await errorDeLaBase(sucesora(), sucesora())).toMatch(/23505|unique|duplicate|already exists/i);

    // En Entrenamiento, lo mismo: una activada no se descarta.
    const e = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const be = await crearBorradorDeEntrenamiento(app, e);
    await activarPlanDeEntrenamiento(app, e.pro, be.planId, be.version).expect(200);
    expect(await errorDeLaBase(`UPDATE version_de_plan_de_entrenamiento SET estado = 'DESCARTADA', version = version + 1 WHERE id = '${be.planId}'`)).toMatch(/ACTIVADA es inmutable/);
  });
});
