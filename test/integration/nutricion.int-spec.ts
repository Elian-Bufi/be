/**
 * WP-04 — circuito nutricional contra PostgreSQL real (docs/paquetes/WP-04.md §6).
 * - E2E-04 y TEST-UC-P09 a P13: evaluar → objetivo → borrador → validar → activar → «Hoy» → registrar → revisar → aplicar.
 * - D1 / adversarial 8 / reapertura: una versión activada no se edita ni se reabre (INV-06-109; 06:4307).
 * - D2 / DL-047: corregir un plan activado emite una sucesora; la activada y su instantánea no cambian.
 * - D4 / TEST-RF-027: cambiar el catálogo no reescribe un plan activado (REG-06-101).
 * - D5 / TEST-NUT-002, 005 / TEST-PRJ-009: prescripto ≠ registrado, sin registro = NO_DATA, cero puntaje.
 * - D7 / TEST-NUT-006 / TEST-RF-035: revisión válida y aplicación; el evento solo con la consecuencia aplicada.
 * - D8 / TEST-RF-031 paso 3: activación atómica con capacidad.
 * - D9 / TEST-RNF-SEC-006: alcance cruzado; revocar B2 o A3 corta (TEST-AUTH-003 completo, 004, 005).
 * - D10 / TEST-RNF-REC-002: un reintento no duplica.
 */
import type { INestApplication } from '@nestjs/common';
import { serializacionCanonica } from '@be/domain';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { ProcesoService } from '../../apps/api/src/proceso/proceso.service';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import {
  activar,
  alimento,
  circuitoConPlanActivo,
  circuitoListoParaPlanificar,
  clavesProhibidas,
  crearBorrador,
  cuerpoDeEvaluacion,
  cuerpoDeObjetivo,
  cuerpoDeRevision,
  estructura,
  patchConSesion,
  registrarComida,
  registrarLibre,
} from './soporte-nutricion';
import { a3Vigente, finalizar, prepararAsesorado, prepararProfesional, revocarB2, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';

let app: INestApplication;
let prisma: PrismaService;
/** Toda respuesta de nutrición observada, para la prueba de cero puntaje. */
const cuerpos: unknown[] = [];

beforeAll(async () => {
  app = await appDePrueba({}, (a) => {
    a.use((req: { originalUrl: string }, res: { json: (c: unknown) => unknown }, next: () => void) => {
      if (req.originalUrl.includes('/nutrition')) {
        const json = res.json.bind(res);
        res.json = (c: unknown) => {
          cuerpos.push(c);
          return json(c);
        };
      }
      next();
    });
  });
  prisma = app.get(PrismaService);
});
afterAll(async () => {
  await app.close();
});

const ZONA = 'America/Argentina/Buenos_Aires';
const hoyLocal = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());

describe('E2E-04 · el circuito nutricional completo', () => {
  it('evaluar, fijar objetivo, planificar, activar, ver en «Hoy», registrar, revisar y aplicar', async () => {
    const c = await circuitoListoParaPlanificar(app, 'e2e');

    // TEST-RF-029: el objetivo es una versión con fundamento; una nueva no pisa la anterior y la efectiva sale de la relación.
    const efectivo1 = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/objectives/effective`).expect(200);
    expect(efectivo1.body.data.objective.versionId).toBe(c.objectiveVersionId);

    // TEST-RF-030 / TEST-NUT-001: el borrador no es vigente y validar no activa.
    const borrador = await crearBorrador(app, c);
    expect(borrador.body.state).toBe('DRAFT');
    expect(borrador.body.isEffective).toBe(false);
    const hoyAntes = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    expect(hoyAntes.body.data.planState).toBe('NO_ACTIVE_PLAN');
    await conSesion(app, c.ase.token).get(`/api/v1/nutrition/plans/${borrador.planId}`).expect(404);
    const validado = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${borrador.planId}/validate`).send({ expectedVersion: borrador.version }).expect(200);
    expect(validado.body.data).toEqual({ valid: true, version: borrador.version, issues: [] });
    const trasValidar = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${borrador.planId}`).expect(200);
    expect(trasValidar.body.data.state).toBe('DRAFT');

    // TEST-RF-031: activar deja la instantánea, la vigencia única y abre el Proceso.
    const act = await activar(app, c.pro, borrador.planId, borrador.version).expect(200);
    expect(act.body.data).toMatchObject({ planId: borrador.planId, state: 'ACTIVATED', processOpened: true, supersededPlanId: null });
    expect(act.body.data.snapshotDigest).toMatch(/^[0-9a-f]{64}$/);

    // TEST-RF-032: el asesorado ve exactamente la versión activada, desde la instantánea.
    const hoy = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    expect(hoy.body.data.planState).toBe('AVAILABLE');
    expect(hoy.body.data.dataState).toBe('NO_DATA');
    expect(hoy.body.data.activePlan.planId).toBe(borrador.planId);
    expect(hoy.body.data.selectedDayTypeId).toBe(hoy.body.data.activePlan.dayTypes[0].dayTypeId);
    const almuerzo = hoy.body.data.activePlan.dayTypes[0].meals[0];
    expect(almuerzo.options[0].items.map((i: { name: string }) => i.name)).toEqual(['Arroz blanco', 'Pechuga de pollo']);
    expect(almuerzo.options[0].items[0].catalogItemVersionId).toBeTruthy();

    // TEST-RF-033: registrar el almuerzo con 80 g de arroz (100 g prescriptos) y dos comidas fuera del plan (TEST-NUT-004).
    const dia = hoy.body.data.activePlan.dayTypes[0];
    const reg = await registrarComida(app, c.ase, borrador.planId, dia, { gramos: 80 }).expect(201);
    expect(reg.body.data).toMatchObject({ origin: 'PRESCRIBED', mealId: almuerzo.mealId, localDate: hoyLocal() });
    const libre1 = await registrarLibre(app, c.ase, borrador.planId, 'Milanesa con puré y una gaseosa.').expect(201);
    await registrarLibre(app, c.ase, borrador.planId, 'Un alfajor a la tarde.').expect(201);
    // TEST-NUT-003: la descripción original se conserva tal cual.
    expect(libre1.body.data.description).toBe('Milanesa con puré y una gaseosa.');

    // TEST-RF-034: el contexto describe; ver no es revisar.
    const ctx = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/review-context`).expect(200);
    const dias = ctx.body.data.descriptiveContrast.days as { date: string; dataState: string; meals: { label: string; state: string; quantityDifferences: { difference: number }[] }[]; outsidePrescription: unknown[] }[];
    const deHoy = dias.find((d) => d.date === hoyLocal())!;
    expect(deHoy.dataState).toBe('HAS_DATA');
    expect(deHoy.meals.find((m) => m.label === 'Almuerzo')).toMatchObject({ state: 'REGISTERED' });
    expect(deHoy.meals.find((m) => m.label === 'Almuerzo')!.quantityDifferences[0]!.difference).toBe(-20);
    // TEST-NUT-005: la cena sin registro es NO_DATA, no incumplimiento; la comida libre no marca ninguna comida.
    expect(deHoy.meals.find((m) => m.label === 'Cena')).toMatchObject({ state: 'NO_DATA' });
    expect(deHoy.outsidePrescription).toHaveLength(2);
    // Los días anteriores del período, sin ningún registro, son «sin dato».
    expect(ctx.body.data.missingData.length).toBe(dias.length - 1);
    expect(await prisma.revisionNutricional.count({ where: { proceso: { asesoradoId: c.ase.id } } })).toBe(0);

    // TEST-NUT-006: la revisión exige todos sus componentes y la taxonomía cerrada.
    const evidencia = [{ type: 'EXECUTION', id: reg.body.data.executionId as string }];
    const incompleta = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`)
      .send({ ...cuerpoDeRevision(evidencia, 'MAINTAIN'), interpretation: ' ', rationale: '' })
      .expect(422);
    expect(incompleta.body.error.code).toBe('REVIEW_COMPONENT_REQUIRED');
    const fueraDeTaxonomia = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'PROGRESS')).expect(422);
    expect(fueraDeTaxonomia.body.error.code).toBe('REVIEW_RESULT_INVALID');

    // AJUSTAR: registrar no aplica nada; aplicar crea el borrador sucesor y recién entonces emite el evento.
    const revision = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'ADJUST')).expect(201);
    const reviewId = revision.body.data.reviewId as string;
    expect(revision.body.data.application).toBeNull();
    expect(await prisma.eventoDeProceso.count({ where: { revisionId: reviewId } })).toBe(0);
    const aplicada = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/reviews/${reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
    const app1 = aplicada.body.data.application;
    expect(app1).toMatchObject({ type: 'CONTINUIDAD', processStateAfter: 'ABIERTO' });
    expect(app1.createdPlanId).toBeTruthy();
    expect(await prisma.eventoDeProceso.count({ where: { revisionId: reviewId, tipo: 'ContinuidadOCierreAplicado' } })).toBe(1);
    // Aplicar dos veces no aplica dos veces.
    const otra = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/reviews/${reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(409);
    expect(otra.body.error.code).toBe('REVIEW_ALREADY_APPLIED');

    // La sucesora se activa como continuidad: no abre otro Proceso ni pasa por capacidad.
    const sucesora = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${app1.createdPlanId}`).expect(200);
    expect(sucesora.body.data).toMatchObject({ state: 'DRAFT', predecessorPlanId: borrador.planId });
    const act2 = await activar(app, c.pro, app1.createdPlanId, sucesora.body.data.version).expect(200);
    expect(act2.body.data).toMatchObject({ processOpened: false, processId: act.body.data.processId, supersededPlanId: borrador.planId });

    // FINALIZAR cierra el Proceso y bloquea nuevos registros (UC-I06 V05).
    const cierre = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'FINALIZE')).expect(201);
    const cerrada = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/reviews/${cierre.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
    expect(cerrada.body.data.application).toMatchObject({ type: 'CIERRE_PROCESO', processStateAfter: 'CERRADO' });
    const hoyCerrado = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    expect(hoyCerrado.body.data.planState).toBe('NO_ACTIVE_PLAN');
    const trasCierre = await registrarLibre(app, c.ase, app1.createdPlanId, 'Después del cierre.').expect(422);
    expect(trasCierre.body.error.code).toBe('ACTIVE_PLAN_REQUIRED');
    const tipos = await prisma.eventoDeProceso.findMany({ where: { procesoId: act.body.data.processId }, orderBy: { secuencia: 'asc' }, select: { tipo: true } });
    expect(tipos.map((t) => t.tipo)).toEqual(['ProcesoOperativoAbierto', 'ContinuidadOCierreAplicado', 'ContinuidadOCierreAplicado', 'ProcesoOperativoCerrado']);
  });
});

describe('D1 · una versión activada no se reabre (INV-06-109; adversarial 8)', () => {
  it('editar, validar o volver a activar una versión activada falla, y su contenido no cambia', async () => {
    const c = await circuitoConPlanActivo(app, 'inmutable');
    const antes = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(200);
    const editar = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${c.planId}`)
      .send({ expectedVersion: antes.body.data.version, changes: estructura(c.pollo, c.arroz) })
      .expect(422);
    expect(editar.body.error.code).toBe('PLAN_NOT_EDITABLE');
    const validar = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${c.planId}/validate`).send({ expectedVersion: antes.body.data.version }).expect(422);
    expect(validar.body.error.code).toBe('PLAN_NOT_EDITABLE');
    const reactivar = await activar(app, c.pro, c.planId, antes.body.data.version).expect(422);
    expect(reactivar.body.error.code).toBe('OPERATION_NOT_READY');
    const despues = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(200);
    expect(despues.body.data).toEqual(antes.body.data);
  });
});

describe('D2 · corregir un plan activado emite una sucesora (DL-047; UC-P10 V07)', () => {
  it('«Crear nueva versión a partir de esta» copia la estructura sin tocar la activada; un solo borrador por plan', async () => {
    const c = await circuitoConPlanActivo(app, 'sucesora');
    const sucesora = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201);
    expect(sucesora.body.data).toMatchObject({ state: 'DRAFT', predecessorPlanId: c.planId });
    // Los nodos conservan su identificador: la ingesta registrada contra la versión anterior sigue siendo reconstruible.
    expect(sucesora.body.data.dayTypes[0].meals[0].mealId).toBe(c.dia.meals[0].mealId);
    const segundo = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(409);
    expect(segundo.body.error.code).toBe('RESOURCE_CONFLICT');
    // Corregir la sucesora (el error del profesional) y activarla: el asesorado pasa a ver la nueva y la anterior queda intacta.
    const corregida = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${sucesora.body.data.planId}`)
      .send({ expectedVersion: sucesora.body.data.version, changes: { dayTypes: [{ ...sucesora.body.data.dayTypes[0], order: undefined, meals: sucesora.body.data.dayTypes[0].meals.map(sinSalida) }] } })
      .expect(200);
    await activar(app, c.pro, corregida.body.data.planId, corregida.body.data.version).expect(200);
    const anterior = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: c.planId }, include: { instantanea: true } });
    expect(anterior.estado).toBe('ACTIVADA');
    // INV-06-13: la huella de la instantánea anterior se recalcula igual.
    expect(createHash('sha256').update(serializacionCanonica(anterior.instantanea!.contenido)).digest('hex')).toBe(c.activacion.snapshotDigest);
    const hoy = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    expect(hoy.body.data.activePlan.planId).toBe(corregida.body.data.planId);
  });
});

describe('INV-06-13 · el contraste lee cada registro contra la versión que referencia (adversarial 7)', () => {
  it('una sucesora activada el mismo día, con la estructura reescrita, no convierte lo registrado en «sin dato»', async () => {
    const c = await circuitoConPlanActivo(app, 'contraste-sucesora');
    const reg = await registrarComida(app, c.ase, c.planId, c.dia, { gramos: 80 }).expect(201);
    const sucesora = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201);
    // El profesional reescribe la estructura entera: los nodos nuevos no conservan los identificadores anteriores.
    const reescrita = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${sucesora.body.data.planId}`)
      .send({ expectedVersion: sucesora.body.data.version, changes: estructura(c.arroz, c.pollo) })
      .expect(200);
    expect(reescrita.body.data.dayTypes[0].meals[0].mealId).not.toBe(c.dia.meals[0].mealId);
    await activar(app, c.pro, reescrita.body.data.planId, reescrita.body.data.version).expect(200);

    const ctx = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/review-context`).expect(200);
    const deHoy = (ctx.body.data.descriptiveContrast.days as { date: string; planId: string; meals: { executionId: string | null; state: string; quantityDifferences: { difference: number }[] }[] }[]).find((d) => d.date === hoyLocal())!;
    expect(deHoy.planId).toBe(c.planId);
    const almuerzo = deHoy.meals.find((m) => m.executionId === reg.body.data.executionId);
    expect(almuerzo).toMatchObject({ state: 'REGISTERED' });
    expect(almuerzo!.quantityDifferences[0]!.difference).toBe(-20);
  });
});

describe('D4 · cambiar el catálogo no reescribe un plan activado (REG-06-101; TEST-RF-027)', () => {
  it('una versión nueva de un alimento no toca la instantánea; un borrador nuevo sí la usa', async () => {
    const c = await circuitoConPlanActivo(app, 'catalogo');
    const vigente = await prisma.versionDeElementoNutricional.findFirstOrThrow({ where: { elementoId: c.arroz, sucesora: null } });
    await prisma.versionDeElementoNutricional.create({
      data: { elementoId: c.arroz, predecesoraId: vigente.id, nombre: 'Arroz blanco (renombrado sintético)', composicion: vigente.composicion as object, disponibilidad: 'DISPONIBLE', procedencia: { prueba: 'D4' } },
    });
    try {
      const plan = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(200);
      const item = plan.body.data.dayTypes[0].meals[0].options[0].items[0];
      expect(item).toMatchObject({ name: 'Arroz blanco', catalogItemVersionId: vigente.id });
      expect(plan.body.data.snapshotDigest).toBe(c.activacion.snapshotDigest);
    } finally {
      // La siembra es compartida por las pruebas: no se deja el renombre como vigente para otras suites.
      const renombre = await prisma.versionDeElementoNutricional.findFirstOrThrow({ where: { elementoId: c.arroz, sucesora: null } });
      await prisma.versionDeElementoNutricional.create({ data: { elementoId: c.arroz, predecesoraId: renombre.id, nombre: 'Arroz blanco', composicion: vigente.composicion as object, disponibilidad: 'DISPONIBLE', procedencia: { prueba: 'D4-restituye' } } });
    }
  });
});

describe('D9 · el PDP custodia datos de salud (TEST-RNF-SEC-006)', () => {
  it('un profesional de Entrenamiento con vínculo y B2 vigentes con el mismo asesorado recibe el mismo 404 que ante lo inexistente, en las 18 operaciones sobre un asesorado', async () => {
    const c = await circuitoConPlanActivo(app, 'cruzado');
    const reg = await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const libre = await registrarLibre(app, c.ase, c.planId, 'Una empanada.').expect(201);
    const revision = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`)
      .send(cuerpoDeRevision([{ type: 'EXECUTION', id: reg.body.data.executionId as string }], 'MAINTAIN'))
      .expect(201);
    const pt = await prepararProfesional(app, 'pt-cruzado', ['ENTRENAMIENTO']);
    await vinculoCompleto(app, pt, c.ase, 'ENTRENAMIENTO');
    const x = randomUUID();
    const a = c.ase.id;
    const correccion = { reason: 'STRUCTURE_FREE_DESCRIPTION', structuredEstimate: { items: [{ catalogItemId: c.pollo, description: 'Empanada', quantity: { value: 90, unit: 'g' } }] }, estimationStatement: 'Estimación.' };
    // [método, ruta real, ruta con un identificador inexistente, cuerpo válido]: las 18 operaciones NUT del profesional
    // sobre un asesorado. Las del catálogo no son de un asesorado (403 por especialidad, abajo) y las /me son del titular.
    const pares: ['get' | 'post' | 'patch', string, string, Record<string, unknown>?][] = [
      ['post', `/api/v1/advisees/${a}/nutrition/evaluations`, `/api/v1/advisees/${x}/nutrition/evaluations`, cuerpoDeEvaluacion()],
      ['get', `/api/v1/advisees/${a}/nutrition/evaluations`, `/api/v1/advisees/${x}/nutrition/evaluations`],
      ['get', `/api/v1/nutrition/evaluations/${c.evaluationId}`, `/api/v1/nutrition/evaluations/${x}`],
      ['post', `/api/v1/advisees/${a}/nutrition/objectives`, `/api/v1/advisees/${x}/nutrition/objectives`, cuerpoDeObjetivo(c.evaluationId)],
      ['get', `/api/v1/advisees/${a}/nutrition/objectives/effective`, `/api/v1/advisees/${x}/nutrition/objectives/effective`],
      ['get', `/api/v1/advisees/${a}/nutrition/objectives`, `/api/v1/advisees/${x}/nutrition/objectives`],
      ['post', `/api/v1/advisees/${a}/nutrition/plans`, `/api/v1/advisees/${x}/nutrition/plans`, { objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }],
      ['get', `/api/v1/advisees/${a}/nutrition/plans`, `/api/v1/advisees/${x}/nutrition/plans`],
      ['get', `/api/v1/nutrition/plans/${c.planId}`, `/api/v1/nutrition/plans/${x}`],
      ['patch', `/api/v1/nutrition/plans/${c.planId}`, `/api/v1/nutrition/plans/${x}`, { expectedVersion: 'v2', changes: estructura(c.arroz, c.pollo) }],
      ['post', `/api/v1/nutrition/plans/${c.planId}/validate`, `/api/v1/nutrition/plans/${x}/validate`, { expectedVersion: 'v2' }],
      ['post', `/api/v1/nutrition/plans/${c.planId}/activate`, `/api/v1/nutrition/plans/${x}/activate`, { expectedVersion: 'v2' }],
      ['get', `/api/v1/nutrition/executions/${reg.body.data.executionId}`, `/api/v1/nutrition/executions/${x}`],
      ['post', `/api/v1/nutrition/executions/${libre.body.data.executionId}/corrections`, `/api/v1/nutrition/executions/${x}/corrections`, correccion],
      ['get', `/api/v1/advisees/${a}/nutrition/review-context`, `/api/v1/advisees/${x}/nutrition/review-context`],
      ['post', `/api/v1/advisees/${a}/nutrition/reviews`, `/api/v1/advisees/${x}/nutrition/reviews`, cuerpoDeRevision([], 'MAINTAIN')],
      ['get', `/api/v1/nutrition/reviews/${revision.body.data.reviewId}`, `/api/v1/nutrition/reviews/${x}`],
      ['post', `/api/v1/nutrition/reviews/${revision.body.data.reviewId}/apply`, `/api/v1/nutrition/reviews/${x}/apply`, { expectedVersion: 'v1' }],
    ];
    const pedir = (metodo: 'get' | 'post' | 'patch', ruta: string, cuerpo?: Record<string, unknown>) =>
      metodo === 'get' ? conSesion(app, pt.token).get(ruta) : metodo === 'patch' ? patchConSesion(app, pt.token, ruta).send(cuerpo) : conSesion(app, pt.token).post(ruta).send(cuerpo);
    for (const [metodo, real, falso, cuerpo] of pares) {
      const r = await pedir(metodo, real, cuerpo);
      const f = await pedir(metodo, falso, cuerpo);
      expect({ ruta: real, status: r.status, body: r.body }).toEqual({ ruta: real, status: 404, body: f.body });
    }
    // Nada cambió del lado del asesorado ni del profesional de Nutrición.
    const plan = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(200);
    expect(plan.body.data.snapshotDigest).toBe(c.activacion.snapshotDigest);
    const rev = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/reviews/${revision.body.data.reviewId}`).expect(200);
    expect(rev.body.data.application).toBeNull();
    // Las denegaciones quedan auditadas con la dimensión desfavorable, que nunca sale en la respuesta.
    const denegadas = await prisma.decisionDeAcceso.findMany({ where: { actorId: pt.id, sujetoId: c.ase.id, resultado: 'DENEGADA' } });
    // Todas las rutas reales dejan su decisión con el titular, también las de un recurso por id (08:491).
    expect(denegadas.length).toBe(pares.length);
    expect(denegadas.every((d) => d.dimensionesDesfavorables.includes('ALCANCE') || d.dimensionesDesfavorables.includes('VINCULO'))).toBe(true);
    // El catálogo nutricional (buscar y cargar, API-NUT-13 e INT-NUT-01) no es de su especialidad.
    await conSesion(app, pt.token).get('/api/v1/nutrition/catalog-items').expect(403);
    await conSesion(app, pt.token).post('/api/v1/nutrition/catalog-items').send({ name: 'Alimento sintético', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 100, proteinG: 1, carbohydrateG: 1, fatG: 1 } }).expect(403);
  });

  it('otro nutricionista con vínculo propio con el mismo asesorado no ve el plan, la evaluación ni la ingesta del primero (DL-057)', async () => {
    const c = await circuitoConPlanActivo(app, 'otro-nut');
    const reg = await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const otro = await prepararProfesional(app, 'otro-nut-2', ['NUTRICION']);
    await vinculoCompleto(app, otro, c.ase, 'NUTRICION');
    await conSesion(app, otro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(404);
    await conSesion(app, otro.token).get(`/api/v1/nutrition/evaluations/${c.evaluationId}`).expect(404);
    await conSesion(app, otro.token).get(`/api/v1/nutrition/executions/${reg.body.data.executionId}`).expect(404);
    const lista = await conSesion(app, otro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).expect(200);
    expect(lista.body.data).toEqual([]);
  });

  it('TEST-AUTH-004/005 y UC-P12 E06: revocar B2 o A3 corta al profesional y al asesorado en la operación siguiente', async () => {
    const c = await circuitoConPlanActivo(app, 'revoca');
    await revocarB2(app, c.ase, c.consentId).expect(200);
    await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(404);
    const hoy = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    expect(hoy.body.data).toMatchObject({ planState: 'NOT_AVAILABLE', activePlan: null });
    await registrarComida(app, c.ase, c.planId, c.dia).expect(404);
    // Reotorgar B2 restituye; revocar A3 vuelve a cortar todo (08:406).
    const req = await conSesion(app, c.ase.token).get(`/api/v1/relationships/${c.vinculoId}/consent-requirements`).expect(200);
    const reotorgado = await conSesion(app, c.ase.token).post(`/api/v1/relationships/${c.vinculoId}/consents`).send({ consentVersionId: req.body.data.consentVersion.id });
    expect([200, 201]).toContain(reotorgado.status);
    await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(200);
    const a3 = await a3Vigente(app, c.ase.token);
    await conSesion(app, c.ase.token).post(`/api/v1/me/health-data-consents/${a3}/revoke`).send({}).expect(200);
    await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${c.planId}`).expect(404);
    await registrarComida(app, c.ase, c.planId, c.dia).expect(404);
    await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/executions').expect(403);
  });

  it('TEST-AUTH-003 (completo): un asesorado sin A3 nunca ve ni registra su plan, aunque el B2 esté vigente', async () => {
    const pro = await prepararProfesional(app, 'sin-a3', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'sin-a3', { a3: false });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    // Sin A3 el profesional tampoco puede evaluar: el PDP deniega por SITUACION.
    await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(404);
    const d = await prisma.decisionDeAcceso.findFirstOrThrow({ where: { actorId: pro.id, sujetoId: ase.id, operacion: 'API-NUT-01' } });
    expect(d.dimensionesDesfavorables).toEqual(['SITUACION']);
  });
});

describe('D8 · activación atómica con capacidad (TEST-RF-031 paso 3; REG-06-91, 93)', () => {
  it('con capacidad 1 ocupada, activar para otro asesorado se rechaza y no cambia nada; la continuidad no consulta capacidad', async () => {
    const pro = await prepararProfesional(app, 'capacidad', ['NUTRICION']);
    await prisma.$transaction((tx) =>
      app.get(ProcesoService).configurarCapacidad(tx, { profesionalId: pro.id, capacidad: { modo: 'LIMITADA', limite: 1 }, actorServicio: 'PRUEBA', procedencia: { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'CAPACIDAD', superficie: null, requestId: null } }),
    );
    const primero = await circuitoConPlanActivo(app, 'capacidad-1', pro);
    expect(primero.activacion.processOpened).toBe(true);
    const segundo = await circuitoListoParaPlanificar(app, 'capacidad-2', pro);
    const borrador = await crearBorrador(app, segundo);
    const rechazo = await activar(app, pro, borrador.planId, borrador.version).expect(422);
    expect(rechazo.body.error.code).toBe('CAPACITY_NOT_AVAILABLE');
    const v = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: borrador.planId }, include: { instantanea: true } });
    expect(v.estado).toBe('BORRADOR');
    expect(v.instantanea).toBeNull();
    expect(await prisma.procesoOperativo.count({ where: { profesionalId: pro.id, asesoradoId: segundo.ase.id } })).toBe(0);
    // Continuidad con el primero: no pasa por capacidad.
    const sucesora = await conSesion(app, pro.token).post(`/api/v1/advisees/${primero.ase.id}/nutrition/plans`).send({ objectiveVersionId: primero.objectiveVersionId, basedOnPlanId: primero.planId }).expect(201);
    const cont = await activar(app, pro, sucesora.body.data.planId, sucesora.body.data.version).expect(200);
    expect(cont.body.data.processOpened).toBe(false);
  });

  it('RF-031: otro nutricionista no puede activar mientras el asesorado tiene un seguimiento nutricional abierto (ACTIVE_PLAN_CONFLICT)', async () => {
    const c = await circuitoConPlanActivo(app, 'conflicto');
    const otro = await circuitoListoParaPlanificar(app, 'conflicto-otro');
    // El asesorado de `otro` es distinto: se arma con el mismo asesorado para forzar el conflicto.
    const pro2 = otro.pro;
    await vinculoCompleto(app, pro2, c.ase, 'NUTRICION');
    const ev = await conSesion(app, pro2.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(201);
    const ob = await conSesion(app, pro2.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(ev.body.data.evaluationId)).expect(201);
    const b = await conSesion(app, pro2.token)
      .post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`)
      .send({ objectiveVersionId: ob.body.data.versionId, initialStructure: estructura(otro.arroz, otro.pollo) })
      .expect(201);
    const r = await activar(app, pro2, b.body.data.planId, b.body.data.version).expect(409);
    expect(r.body.error.code).toBe('ACTIVE_PLAN_CONFLICT');
  });
});

describe('REG-06-70 · finalizar el vínculo cierra el Proceso', () => {
  it('el Proceso queda CERRADO con su motivo y el asesorado deja de ver el plan', async () => {
    const c = await circuitoConPlanActivo(app, 'finaliza');
    const version = await versionDeVinculo(app, c.ase.token, c.vinculoId);
    await finalizar(app, c.ase.token, c.vinculoId, version).expect(200);
    const p = await prisma.procesoOperativo.findUniqueOrThrow({ where: { id: c.activacion.processId } });
    expect(p).toMatchObject({ estado: 'CERRADO', motivoDeCierre: 'FINALIZACION_DE_VINCULO' });
    const hoy = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    expect(hoy.body.data.planState).toBe('NO_ACTIVE_PLAN');
  });
});

describe('API-NUT-21 · corrección trazable de una ingesta libre (REG-06-14 a 16, 121)', () => {
  it('estructura como estimación, conserva el original y resuelve la vista efectiva por relación', async () => {
    const c = await circuitoConPlanActivo(app, 'correccion');
    const libre = await registrarLibre(app, c.ase, c.planId, 'Dos porciones de tarta de verdura.').expect(201);
    const executionId = libre.body.data.executionId as string;
    const verdura = await alimento(app, c.pro, 'Espinaca');
    const cuerpo = (desc: string) => ({
      reason: 'STRUCTURE_FREE_DESCRIPTION',
      structuredEstimate: { items: [{ catalogItemId: verdura, description: desc, quantity: { value: 150, unit: 'g' } }] },
      estimationStatement: 'Estimación profesional a partir del registro descriptivo.',
    });
    const k1 = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/executions/${executionId}/corrections`).send(cuerpo('Tarta de verdura')).expect(201);
    const k2 = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/executions/${executionId}/corrections`).send(cuerpo('Tarta de espinaca')).expect(201);
    const [c1, c2] = k2.body.data.corrections;
    expect(c1.previousCorrectionId).toBeNull();
    expect(c2.previousCorrectionId).toBe(c1.correctionId);
    expect(k2.body.data.effectiveView).toEqual({ kind: 'CORRECTED', correctionId: c2.correctionId });
    expect(k2.body.data.description).toBe('Dos porciones de tarta de verdura.');
    expect(k1.body.data.corrections[0].nature).toBe('ESTIMATE');
    // El asesorado ve su texto original y la estimación marcada.
    const propia = await conSesion(app, c.ase.token).get(`/api/v1/nutrition/executions/${executionId}`).expect(200);
    expect(propia.body.data.description).toBe('Dos porciones de tarta de verdura.');
    // Una ingesta prescripta no se estructura.
    const reg = await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const r = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/executions/${reg.body.data.executionId}/corrections`).send(cuerpo('x')).expect(422);
    expect(r.body.error.code).toBe('NUTRITION_FREE_DESCRIPTION_REQUIRED');
  });
});

describe('D10 · un reintento no duplica (REG-06-107; TEST-RNF-REC-002)', () => {
  it('replay con la misma clave, reintento equivalente con otra clave y registro incompatible', async () => {
    const c = await circuitoConPlanActivo(app, 'reintento');
    const clave = claveDeIdempotencia();
    // El replay es el mismo pedido: misma clave y mismo cuerpo, hora de ocurrencia incluida.
    const ocurrencia = new Date(Date.now() - 60_000);
    const a = await registrarComida(app, c.ase, c.planId, c.dia, { gramos: 90, clave, ocurrencia }).expect(201);
    const b = await registrarComida(app, c.ase, c.planId, c.dia, { gramos: 90, clave, ocurrencia }).expect(201);
    expect(b.body).toEqual(a.body);
    const equivalente = await registrarComida(app, c.ase, c.planId, c.dia, { gramos: 90 }).expect(200);
    expect(equivalente.body.data.executionId).toBe(a.body.data.executionId);
    const incompatible = await registrarComida(app, c.ase, c.planId, c.dia, { gramos: 50 }).expect(409);
    expect(incompatible.body.error.code).toBe('EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY');
    expect(await prisma.ingestaNutricional.count({ where: { asesoradoId: c.ase.id, origen: 'PRESCRIPTA' } })).toBe(1);
    // Misma clave con otro cuerpo: 409 IDEMPOTENCY_KEY_REUSED.
    const reusada = await registrarComida(app, c.ase, c.planId, c.dia, { gramos: 70, clave, ocurrencia }).expect(409);
    expect(reusada.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('REG-06-12: diez borradores simultáneos del mismo plan dejan uno solo', async () => {
    const c = await circuitoListoParaPlanificar(app, 'borradores-concurrentes');
    const r = await Promise.all(
      Array.from({ length: 10 }, () =>
        conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructura(c.arroz, c.pollo) }),
      ),
    );
    expect(r.filter((x) => x.status === 201)).toHaveLength(1);
    expect(r.filter((x) => x.status !== 201).every((x) => x.status === 409)).toBe(true);
    expect(await prisma.versionDePlanNutricional.count({ where: { plan: { asesoradoId: c.ase.id } } })).toBe(1);
  });
});

describe('Validación estructural del plan (RF-030; REG-06-118, 122)', () => {
  it('un borrador incompleto se guarda; validar informa cada problema con su ruta; activar no pasa', async () => {
    const c = await circuitoListoParaPlanificar(app, 'estructura');
    const b = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`)
      .send({
        objectiveVersionId: c.objectiveVersionId,
        initialStructure: {
          dayTypes: [
            {
              label: 'Día habitual',
              meals: [
                { label: 'Desayuno', prescriptionMode: 'DISH_OPTIONS', options: [] },
                { label: 'Almuerzo', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Arroz', items: [{ catalogItemId: c.arroz, quantity: { value: 100, unit: 'g' }, preparationState: null }] }] },
              ],
            },
          ],
        },
      })
      .expect(201);
    const v = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${b.body.data.planId}/validate`).send({ expectedVersion: b.body.data.version }).expect(200);
    expect(v.body.data.valid).toBe(false);
    expect(v.body.data.issues).toEqual([
      { code: 'MEAL_OPTION_REQUIRED', path: 'dayTypes[0].meals[0]' },
      { code: 'PREPARATION_STATE_REQUIRED', path: 'dayTypes[0].meals[1].options[0].items[0].preparationState' },
    ]);
    const a = await activar(app, c.pro, b.body.data.planId, b.body.data.version).expect(422);
    expect(a.body.error.code).toBe('OPERATION_NOT_READY');
    // La modalidad B está modelada y no habilitada; un alimento inexistente no se guarda.
    const modalidadB = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.body.data.planId}`)
      .send({ expectedVersion: b.body.data.version, changes: { dayTypes: [{ label: 'D', meals: [{ label: 'M', prescriptionMode: 'EXCHANGE_PORTIONS', options: [] }] }] } })
      .expect(422);
    expect(modalidadB.body.error.code).toBe('EXCHANGE_MODE_NOT_AVAILABLE');
    const ajeno = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.body.data.planId}`)
      .send({ expectedVersion: b.body.data.version, changes: { dayTypes: [{ label: 'D', meals: [{ label: 'M', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'O', items: [{ catalogItemId: randomUUID(), quantity: null, preparationState: null }] }] }] }] } })
      .expect(422);
    expect(ajeno.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
    // Una versión vieja del borrador choca (09:255-257).
    const vieja = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.body.data.planId}`).send({ expectedVersion: 'v9', changes: estructura(c.arroz, c.pollo) }).expect(409);
    expect(vieja.body.error.code).toBe('VERSION_CONFLICT');
  });

  it('INV-06-133: el objetivo exige fundamento y BE no calcula nada', async () => {
    const c = await circuitoListoParaPlanificar(app, 'objetivo');
    const sinFundamento = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).send({ ...cuerpoDeObjetivo(c.evaluationId), rationale: '' }).expect(400);
    expect(sinFundamento.body.error.code).toBe('INVALID_REQUEST');
    // Una segunda versión sucede a la primera; la efectiva es la terminal, no «la última por fecha».
    const v2 = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(c.evaluationId, 2000)).expect(201);
    expect(v2.body.data.predecessorVersionId).toBe(c.objectiveVersionId);
    const lista = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).expect(200);
    expect(lista.body.data.map((o: { isEffective: boolean }) => o.isEffective).sort()).toEqual([false, true]);
    // Una evaluación de otro asesorado no sirve de referencia.
    const otro = await circuitoListoParaPlanificar(app, 'objetivo-otro');
    const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(otro.evaluationId)).expect(422);
    expect(r.body.error.code).toBe('EVALUATION_NOT_COMPATIBLE');
  });
});

describe('TEST-PRJ-009 · cero puntaje de adherencia en las respuestas', () => {
  it('ninguna respuesta de nutrición observada en esta suite tiene puntaje, porcentaje de cumplimiento ni calificación', () => {
    expect(cuerpos.length).toBeGreaterThan(50);
    expect(cuerpos.flatMap((c) => clavesProhibidas(c))).toEqual([]);
  });
});

/** Quita los campos de salida (orden, nombres, versión de catálogo) para reenviar una jerarquía como entrada. */
function sinSalida(m: { mealId: string; label: string; prescriptionMode: string; options: { optionId: string; label: string; items: { itemId: string; catalogItemId: string; quantity: unknown; preparationState: unknown; note: unknown }[] }[] }) {
  return {
    mealId: m.mealId,
    label: m.label,
    prescriptionMode: m.prescriptionMode,
    options: m.options.map((o) => ({
      optionId: o.optionId,
      label: o.label,
      items: o.items.map((i) => ({ itemId: i.itemId, catalogItemId: i.catalogItemId, quantity: i.quantity, preparationState: i.preparationState, note: i.note })),
    })),
  };
}
