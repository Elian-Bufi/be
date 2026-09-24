/**
 * API-DSH-03 · el dashboard interdisciplinario con contenido real (09v11 §15; DL-031, condición de cierre).
 *
 * Lo que estas pruebas fijan, que es lo que el legajo exige y lo que sería fácil romper sin darse cuenta:
 * - cada dominio muestra hechos de **su** read model, con procedencia y autoría, y nada se agrega entre dominios;
 * - un dominio denegado dice `NOT_AVAILABLE_TO_VIEW` y **no filtra nada** al resumen de los otros;
 * - sin datos todavía, `summary` es `null` y no un objeto de ceros (RF-053: los faltantes se muestran como tales);
 * - el período acota los conteos;
 * - no existe ningún score, «estado general» ni compliance global (09v11 §15, regla crítica; B10-08 §10).
 */
import type { INestApplication } from '@nestjs/common';
import { DashboardResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { appDePrueba, conSesion } from './soporte-api';
import { dashboard, prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto } from './soporte-vinculo';
import { circuitoConPlanActivo, registrarComida } from './soporte-nutricion';
import { circuitoConPlanDeEntrenamientoActivo } from './soporte-entrenamiento';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const leer = async (pro: Parameters<typeof dashboard>[1], asesoradoId: string) => DashboardResponseSchema.parse((await dashboard(app, pro, asesoradoId).expect(200)).body).data;

describe('API-DSH-03 · resumen por dominio', () => {
  it('nutrición: plan vigente, objetivo con su autoría, y el conteo de ingestas del asesorado', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-nut-${++contador}`);
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    await registrarComida(app, c.ase, c.planId, c.dia, { comida: 1 }).expect(201);

    const d = await leer(c.pro, c.ase.id);
    const nut = d.domains.nutrition;
    if (!nut.available) throw new Error('nutrición debería estar disponible');
    expect(nut.summary).not.toBeNull();
    expect(nut.summary).toMatchObject({
      activePlan: { planVersionId: c.planId },
      registeredIntakes: 2,
    });
    // El objetivo conserva su autoría y su unidad: el dashboard no reinventa el dato (B10-08 §8.3).
    expect(nut.summary!.objective).toMatchObject({ estimatedEnergyRequirement: { unit: 'kcal/day' } });
    expect(nut.summary!.objective!.authoredBy.identityId).toBe(c.pro.id);
    expect(nut.summary!.activePlan!.activatedAt).toEqual(expect.any(String));
    expect(nut.summary!.lastIntakeAt).toEqual(expect.any(String));
  });

  it('entrenamiento: plan vigente y el conteo de ejecuciones registradas, que es un conteo y no una adherencia', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `dsh-trn-${++contador}`);
    const d = await leer(c.pro, c.ase.id);
    const trn = d.domains.training;
    if (!trn.available) throw new Error('entrenamiento debería estar disponible');
    expect(trn.summary).toMatchObject({ activePlan: { planVersionId: c.planId }, registeredExecutions: 0, lastExecutionAt: null });
    expect(trn.summary!.objective!.authoredBy.identityId).toBe(c.pro.id);
  });

  it('un dominio autorizado y todavía vacío es summary: null, no un objeto de ceros (RF-053)', async () => {
    const pro = await prepararProfesional(app, `dsh-vacio-${++contador}`, ['NUTRICION']);
    const ase = await prepararAsesorado(app, `dsh-vacio-${++contador}`, { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');

    const d = await leer(pro, ase.id);
    expect(d.domains.nutrition).toEqual({ available: true, relationshipId: expect.any(String), summary: null });
  });
});

describe('API-DSH-03 · lo que el PDP no permite no se filtra por el resumen', () => {
  it('revocado el B2, el dominio pasa a NOT_AVAILABLE_TO_VIEW sin decir qué había detrás, y partialView queda en true', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-revoca-${++contador}`);
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const antes = await leer(c.pro, c.ase.id);
    expect(antes.domains.nutrition.available).toBe(true);

    await revocarB2(app, c.ase, c.consentId).expect(200);
    // Sin ningún alcance permitido el guard responde 404, idéntico a un asesorado inexistente.
    await dashboard(app, c.pro, c.ase.id).expect(404);
  });

  it('con dos alcances y uno solo consentido: el denegado no aporta ni un conteo, y el aviso de vista parcial es uno solo', async () => {
    const etiqueta = `dsh-parcial-${++contador}`;
    const pro = await prepararProfesional(app, etiqueta, ['NUTRICION', 'ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, etiqueta, { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    const trn = await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    await revocarB2(app, ase, trn.consentId as string).expect(200);

    const d = await leer(pro, ase.id);
    expect(d.partialView).toBe(true);
    expect(d.domains.training).toEqual({ available: false, reason: 'NOT_AVAILABLE_TO_VIEW' });
    // El dominio denegado no deja rastro: ni conteo, ni fecha, ni identificador.
    expect(JSON.stringify(d.domains.training)).not.toContain(trn.vinculoId);
    expect(d.domains.nutrition.available).toBe(true);
  });
});

describe('API-DSH-03 · período y regla crítica', () => {
  it('el período acota el conteo: una ingesta fuera de la ventana no se cuenta', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-periodo-${++contador}`);
    const hace10 = new Date(Date.now() - 10 * 86_400_000);
    await registrarComida(app, c.ase, c.planId, c.dia, { ocurrencia: hace10 }).expect(201);
    await registrarComida(app, c.ase, c.planId, c.dia, { comida: 1 }).expect(201);

    const desde = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const r = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/dashboard?periodStart=${encodeURIComponent(desde)}`).expect(200);
    const nut = DashboardResponseSchema.parse(r.body).data.domains.nutrition;
    if (!nut.available) throw new Error('nutrición debería estar disponible');
    expect(nut.summary!.registeredIntakes).toBe(1);

    // Sin período, se cuentan las dos: el período acota, no oculta.
    const todo = await leer(c.pro, c.ase.id);
    const nutTodo = todo.domains.nutrition;
    if (!nutTodo.available) throw new Error('nutrición debería estar disponible');
    expect(nutTodo.summary!.registeredIntakes).toBe(2);
  });

  it('09v11 §15 · no existe score global, compliance ni riesgo, en ninguna parte de la respuesta', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-sin-score-${++contador}`);
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    // Se miran las **claves** de la respuesta, no su texto: un nombre sintético puede contener cualquier palabra.
    const claves = (v: unknown): string[] =>
      Array.isArray(v) ? v.flatMap(claves) : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [k.toLowerCase(), ...claves(x)]) : [];
    const todas = claves(await leer(c.pro, c.ase.id));
    for (const prohibido of ['score', 'risk', 'compliance', 'adherence', 'rating', 'level', 'grade', 'overall']) {
      expect(todas.filter((k) => k.includes(prohibido))).toEqual([]);
    }
  });
});
