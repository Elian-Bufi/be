/**
 * WP-PULIDO-GRANDES (DEUDA_LEGAJO DL-173) · las dos notas, por la API real y contra PostgreSQL:
 * - **TEST-PG-014 (PG-15, PG-D10):** la nota para tu profe. Va aparte de confirmar (API-TRN-18 no cambia), solo agrega,
 *   hasta 280 caracteres, con Idempotency-Key, la escribe solo la persona de la sesión y la lee el profesional de
 *   Entrenamiento que ya ve esa sesión. Otra área, el 404 de lo inexistente.
 * - **TEST-PG-015 (PG-16, PG-D11):** las notas propias del profesional. Solo su autor las lee y las archiva (otro
 *   profesional, aunque sea del mismo área, no); archivar no borra; sin vínculo vigente no se agregan ni se leen, y las de
 *   antes quedan; el ancla pide su área; y entran en la exportación de la persona.
 *
 * Mutaciones que estas pruebas matan (descritas; quedan para correrlas con la base de la CI, no se corrieron en esta rama):
 * dejar leer las notas de las sesiones a otra área (decidir con cualquier alcance en API-TRN-25-LISTA); dejar que otro
 * profesional lea las notas propias (filtrar por la persona y no por el autor); permitir que el profesional del plan
 * escriba la nota por la persona; borrar la nota al archivarla.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS, circuitoConPlanDeEntrenamientoActivo } from './soporte-entrenamiento';
import { circuitoConPlanActivo } from './soporte-nutricion';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const notas = (executionId: string) => `/api/v1/training/executions/${executionId}/notes`;
const misNotas = (executionId: string) => `/api/v1/me/training/executions/${executionId}/notes`;
const notasDelPeriodo = (adviseeId: string, desde: string, hasta: string) => `/api/v1/advisees/${adviseeId}/training/execution-notes?periodStart=${desde}&periodEnd=${hasta}`;
const propias = (adviseeId: string) => `/api/v1/advisees/${adviseeId}/professional-notes`;
const archivar = (noteId: string) => `/api/v1/professional-notes/${noteId}/archive`;
const diasAntes = (fecha: string, dias: number) => new Date(new Date(`${fecha}T00:00:00.000Z`).getTime() - dias * 86_400_000).toISOString().slice(0, 10);

/** Un plan de Entrenamiento activo y una sesión de hoy registrada por la API: «Hoy», el borrador, una serie y confirmar. */
async function conSesionRegistrada(etiqueta: string) {
  const c = await circuitoConPlanDeEntrenamientoActivo(app, `${etiqueta}-${++contador}`);
  const ase = conSesion(app, c.ase.token);
  const hoy = (await ase.get('/api/v1/me/training/today').expect(200)).body.data;
  const ocurrencia = hoy.occurrences[0] as { occurrenceId: string };
  const borrador = (await ase.put(`/api/v1/training/occurrences/${ocurrencia.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  const serie = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 2, perceivedExertion: null };
  const guardado = (
    await ase
      .patch(`/api/v1/training/execution-drafts/${borrador.draftId}`)
      .send({ expectedVersion: borrador.version, changes: { granularity: 'SET', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie] }], sessionCondition: 'COMPLETED' } })
      .expect(200)
  ).body.data;
  const registrada = (await ase.post(`/api/v1/training/execution-drafts/${borrador.draftId}/confirm`).send({ expectedVersion: guardado.version }).expect(201)).body.data;
  return { ...c, executionId: registrada.executionId as string, fecha: hoy.date as string };
}

/** El ejercicio del catálogo de una versión sembrada (las prescripciones citan versiones). */
const ejercicioDe = async (versionId: string): Promise<string> => (await prisma.versionDeEjercicio.findUniqueOrThrow({ where: { id: versionId }, select: { ejercicioId: true } })).ejercicioId;

// ─── TEST-PG-014 · la nota para tu profe (PG-15) ─────────────────────────────────────────────────────────────

describe('TEST-PG-014 · la nota para tu profe: aparte de confirmar, solo agrega y con su permiso (API-TRN-25)', () => {
  it('se agrega a la sesión ya registrada sin cambiarla; el reintento con la misma clave no duplica', async () => {
    const c = await conSesionRegistrada('nota-agrega');
    const antes = (await conSesion(app, c.ase.token).get(`/api/v1/training/executions/${c.executionId}`).expect(200)).body;
    const clave = claveDeIdempotencia();
    const primera = await conSesion(app, c.ase.token).post(notas(c.executionId), clave).send({ text: '  Algo me molestó. Tuve poco tiempo.  ' }).expect(201);
    expect(primera.body.data).toMatchObject({ executionId: c.executionId, text: 'Algo me molestó. Tuve poco tiempo.' });
    const repetida = await conSesion(app, c.ase.token).post(notas(c.executionId), clave).send({ text: '  Algo me molestó. Tuve poco tiempo.  ' }).expect(201);
    expect(repetida.body.data.noteId).toBe(primera.body.data.noteId);
    const otroCuerpo = await conSesion(app, c.ase.token).post(notas(c.executionId), clave).send({ text: 'Otra cosa' }).expect(409);
    expect(otroCuerpo.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await prisma.notaDeEjecucion.count({ where: { ejecucionId: c.executionId } })).toBe(1);
    // La sesión registrada no cambia: la nota no es parte de la ejecución (API-TRN-18 y 19 siguen iguales).
    const despues = (await conSesion(app, c.ase.token).get(`/api/v1/training/executions/${c.executionId}`).expect(200)).body;
    expect(despues).toEqual(antes);
  });

  it('solo agrega: una nueva queda debajo, con su hora, y la base no deja cambiarla ni borrarla', async () => {
    const c = await conSesionRegistrada('nota-debajo');
    const a = (await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Cambié de máquina' }).expect(201)).body.data;
    const b = (await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Y la rodilla, mejor después' }).expect(201)).body.data;
    const leidas = (await conSesion(app, c.ase.token).get(misNotas(c.executionId)).expect(200)).body.data as { noteId: string; recordedAt: string }[];
    expect(leidas.map((n) => n.noteId)).toEqual([a.noteId, b.noteId]);
    expect(Date.parse(leidas[0]!.recordedAt)).toBeLessThanOrEqual(Date.parse(leidas[1]!.recordedAt));
    await expect(prisma.$executeRaw`UPDATE "nota_de_ejecucion" SET "texto" = 'otra' WHERE "id" = ${a.noteId}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`DELETE FROM "nota_de_ejecucion" WHERE "id" = ${a.noteId}::uuid`).rejects.toThrow(/append-only/);
  });

  it('el largo: hasta 280 caracteres; más, o vacía, no se guarda; y hasta 20 notas por sesión', async () => {
    const c = await conSesionRegistrada('nota-largo');
    await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'x'.repeat(281) }).expect(400);
    await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: '   ' }).expect(400);
    await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'ok', sessionCondition: 'COMPLETED' }).expect(400);
    for (let i = 0; i < 20; i++) await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: i === 0 ? 'x'.repeat(280) : `Nota ${i}` }).expect(201);
    const tope = await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Una más' }).expect(422);
    expect(tope.body.error).toMatchObject({ code: 'VALIDATION_FAILED', details: { issues: [{ code: 'NOTE_LIMIT_REACHED', path: 'text' }] } });
    // La base tampoco admite más de 280 caracteres, aunque el servicio se equivocara.
    await expect(
      prisma.$executeRaw`INSERT INTO "nota_de_ejecucion" ("ejecucion_id","asesorado_id","texto","procedencia") VALUES (${c.executionId}::uuid, ${c.ase.id}::uuid, ${'x'.repeat(281)}, '{}'::jsonb)`,
    ).rejects.toThrow(/nota_de_ejecucion_coherente/);
  });

  it('la escribe solo la persona de la sesión: el profesional del plan, otra persona y una inexistente reciben el mismo 404', async () => {
    const c = await conSesionRegistrada('nota-quien');
    const otra = await prepararAsesorado(app, `nota-otra-${contador}`, { a3: true });
    const delPro = await conSesion(app, c.pro.token).post(notas(c.executionId)).send({ text: 'Por ella' }).expect(404);
    const deOtra = await conSesion(app, otra.token).post(notas(c.executionId)).send({ text: 'Ajena' }).expect(404);
    const inexistente = await conSesion(app, c.ase.token).post(notas(randomUUID())).send({ text: 'Nada' }).expect(404);
    expect(delPro.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(deOtra.body).toEqual(inexistente.body);
    await conSesion(app, otra.token).get(misNotas(c.executionId)).expect(404);
    expect(await prisma.notaDeEjecucion.count({ where: { ejecucionId: c.executionId } })).toBe(0);
    // Y la base: la nota es de la persona de la ejecución, aunque el servicio se equivocara.
    await expect(
      prisma.$executeRaw`INSERT INTO "nota_de_ejecucion" ("ejecucion_id","asesorado_id","texto","procedencia") VALUES (${c.executionId}::uuid, ${otra.id}::uuid, 'Ajena', '{}'::jsonb)`,
    ).rejects.toThrow(/la nota de una sesión es de la persona/);
  });

  it('el profesional de Entrenamiento la lee junto a esa sesión; uno de Nutrición de la misma persona, no (404)', async () => {
    const c = await conSesionRegistrada('nota-lee');
    const nota = (await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Tuve poco tiempo' }).expect(201)).body.data;
    const leida = (await conSesion(app, c.pro.token).get(notasDelPeriodo(c.ase.id, diasAntes(c.fecha, 7), c.fecha)).expect(200)).body.data;
    expect(leida.period).toMatchObject({ start: diasAntes(c.fecha, 7), end: c.fecha });
    expect(leida.notes).toEqual([{ ...nota, executionDate: c.fecha }]);
    // Fuera del período, no está.
    expect((await conSesion(app, c.pro.token).get(notasDelPeriodo(c.ase.id, diasAntes(c.fecha, 30), diasAntes(c.fecha, 1))).expect(200)).body.data.notes).toEqual([]);
    // Otra área con la misma persona: el 404 de lo inexistente (mutación: decidir con cualquier alcance).
    const nutri = await prepararProfesional(app, `nota-nutri-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, nutri, c.ase, 'NUTRICION');
    const deOtraArea = await conSesion(app, nutri.token).get(notasDelPeriodo(c.ase.id, c.fecha, c.fecha)).expect(404);
    const deNadie = await conSesion(app, nutri.token).get(notasDelPeriodo(randomUUID(), c.fecha, c.fecha)).expect(404);
    expect(deOtraArea.body).toEqual(deNadie.body);
    // El período es obligatorio y llega hasta 92 días.
    await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/training/execution-notes`).expect(400);
    await conSesion(app, c.pro.token).get(notasDelPeriodo(c.ase.id, diasAntes(c.fecha, 92), c.fecha)).expect(400);
    await conSesion(app, c.pro.token).get(notasDelPeriodo(c.ase.id, diasAntes(c.fecha, 91), c.fecha)).expect(200);
  });

  it('otro profesional de Entrenamiento de la misma persona no ve las notas de sesiones que no son de sus planes', async () => {
    const c = await conSesionRegistrada('nota-otro');
    await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Para mi profe' }).expect(201);
    const otro = await prepararProfesional(app, `nota-otro-pro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, c.ase, 'ENTRENAMIENTO');
    expect((await conSesion(app, otro.token).get(notasDelPeriodo(c.ase.id, c.fecha, c.fecha)).expect(200)).body.data.notes).toEqual([]);
  });

  it('revocado el consentimiento: la persona ya no la manda y el profesional ya no la lee; la sesión y lo escrito siguen', async () => {
    const c = await conSesionRegistrada('nota-revocada');
    await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Antes de revocar' }).expect(201);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Después' }).expect(404);
    await conSesion(app, c.pro.token).get(notasDelPeriodo(c.ase.id, c.fecha, c.fecha)).expect(404);
    // Es su historia: la sigue leyendo con su A3.
    expect((await conSesion(app, c.ase.token).get(misNotas(c.executionId)).expect(200)).body.data.map((n: { text: string }) => n.text)).toEqual(['Antes de revocar']);
    await conSesion(app, c.ase.token).get(`/api/v1/training/executions/${c.executionId}`).expect(200);
  });
});

// ─── TEST-PG-015 · las notas propias del profesional (PG-16) ─────────────────────────────────────────────────

describe('TEST-PG-015 · las notas propias: solo el autor las lee; archivar no borra (API-NPP-01 a 03)', () => {
  it('el autor agrega y lee las suyas, sin ancla o atadas a un ejercicio, con lo que hay hoy en su plan', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `npp-lee-${++contador}`);
    const pro = conSesion(app, c.pro.token);
    const clave = claveDeIdempotencia();
    const libre = (await pro.post(propias(c.ase.id), clave).send({ text: '  Le molesta la rodilla izquierda en la sentadilla profunda.  ' }).expect(201)).body.data;
    expect(libre).toMatchObject({ adviseeId: c.ase.id, text: 'Le molesta la rodilla izquierda en la sentadilla profunda.', anchor: null, archivedAt: null });
    expect((await pro.post(propias(c.ase.id), clave).send({ text: '  Le molesta la rodilla izquierda en la sentadilla profunda.  ' }).expect(201)).body.data.noteId).toBe(libre.noteId);
    const sentadilla = await ejercicioDe(CATALOGO_DE_EJERCICIOS.sentadilla);
    const enElPlan = (await pro.post(propias(c.ase.id)).send({ text: 'Bajar hasta el cajón', anchor: { type: 'EXERCISE', exerciseId: sentadilla } }).expect(201)).body.data;
    expect(enElPlan.anchor).toEqual({ type: 'EXERCISE', exerciseId: sentadilla, exerciseName: expect.any(String), inPlan: true });
    const mancuernas = await ejercicioDe(CATALOGO_DE_EJERCICIOS.pressConMancuernas);
    const fuera = (await pro.post(propias(c.ase.id)).send({ text: 'Probar con mancuernas', anchor: { type: 'EXERCISE', exerciseId: mancuernas } }).expect(201)).body.data;
    expect(fuera.anchor).toMatchObject({ type: 'EXERCISE', exerciseId: mancuernas, inPlan: false });
    const lista = (await pro.get(propias(c.ase.id)).expect(200)).body;
    expect(lista.data.map((n: { noteId: string }) => n.noteId)).toEqual([fuera.noteId, enElPlan.noteId, libre.noteId]);
    expect(lista.page).toEqual({ limit: 200, nextCursor: null, hasMore: false });
    // Un ejercicio que no existe no se cita.
    const inexistente = await pro.post(propias(c.ase.id)).send({ text: 'x', anchor: { type: 'EXERCISE', exerciseId: randomUUID() } }).expect(422);
    expect(inexistente.body.error).toMatchObject({ code: 'VALIDATION_FAILED', details: { issues: [{ code: 'ANCHOR_NOT_AVAILABLE', path: 'anchor.exerciseId' }] } });
    // Más de 1000 caracteres, no.
    await pro.post(propias(c.ase.id)).send({ text: 'x'.repeat(1001) }).expect(400);
  });

  it('otro profesional, aunque sea del mismo área, no las ve ni las archiva; la persona tampoco (404)', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `npp-otro-${++contador}`);
    const nota = (await conSesion(app, c.pro.token).post(propias(c.ase.id)).send({ text: 'Solo para mí' }).expect(201)).body.data;
    const otro = await prepararProfesional(app, `npp-otro-pro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, c.ase, 'ENTRENAMIENTO');
    // Mutación: filtrar por la persona y no por el autor.
    expect((await conSesion(app, otro.token).get(propias(c.ase.id)).expect(200)).body.data).toEqual([]);
    const ajena = await conSesion(app, otro.token).post(archivar(nota.noteId)).send({}).expect(404);
    const inexistente = await conSesion(app, otro.token).post(archivar(randomUUID())).send({}).expect(404);
    expect(ajena.body).toEqual(inexistente.body);
    await conSesion(app, c.ase.token).get(propias(c.ase.id)).expect(404);
    await conSesion(app, c.ase.token).post(archivar(nota.noteId)).send({}).expect(404);
    expect((await prisma.archivoDeNotaPropia.count({ where: { notaId: nota.noteId } }))).toBe(0);
  });

  it('archivar no borra: sigue en la lista con su fecha; archivar otra vez responde lo mismo; la base no deja borrarla', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `npp-archivo-${++contador}`);
    const pro = conSesion(app, c.pro.token);
    const nota = (await pro.post(propias(c.ase.id)).send({ text: 'Ya no aplica' }).expect(201)).body.data;
    const archivada = (await pro.post(archivar(nota.noteId)).send({}).expect(200)).body.data;
    expect(archivada).toMatchObject({ noteId: nota.noteId, text: 'Ya no aplica', archivedAt: expect.any(String) });
    const otraVez = (await pro.post(archivar(nota.noteId)).send({}).expect(200)).body.data;
    expect(otraVez.archivedAt).toBe(archivada.archivedAt);
    expect((await pro.get(propias(c.ase.id)).expect(200)).body.data).toEqual([archivada]);
    await pro.post(archivar(nota.noteId)).send({ motivo: 'x' }).expect(400);
    await expect(prisma.$executeRaw`DELETE FROM "nota_propia" WHERE "id" = ${nota.noteId}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`DELETE FROM "archivo_de_nota_propia" WHERE "nota_id" = ${nota.noteId}::uuid`).rejects.toThrow(/append-only/);
  });

  it('sin vínculo vigente no se agregan ni se leen; las de antes quedan guardadas', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `npp-sin-${++contador}`);
    const nota = (await conSesion(app, c.pro.token).post(propias(c.ase.id)).send({ text: 'Antes de revocar' }).expect(201)).body.data;
    await revocarB2(app, c.ase, c.consentId).expect(200);
    await conSesion(app, c.pro.token).post(propias(c.ase.id)).send({ text: 'Después' }).expect(404);
    await conSesion(app, c.pro.token).get(propias(c.ase.id)).expect(404);
    await conSesion(app, c.pro.token).post(archivar(nota.noteId)).send({}).expect(404);
    expect(await prisma.notaPropia.count({ where: { profesionalId: c.pro.id, asesoradoId: c.ase.id } })).toBe(1);
  });

  it('atar a una comida pide Nutrición; la comida se reconoce por su nombre, sin tildes ni mayúsculas', async () => {
    const n = await circuitoConPlanActivo(app, `npp-comida-${++contador}`);
    const pro = conSesion(app, n.pro.token);
    const almuerzo = (await pro.post(propias(n.ase.id)).send({ text: 'Come fuera de casa', anchor: { type: 'MEAL', mealLabel: '  ALMUERZO ' } }).expect(201)).body.data;
    expect(almuerzo.anchor).toEqual({ type: 'MEAL', mealLabel: 'ALMUERZO', inPlan: true });
    const desayuno = (await pro.post(propias(n.ase.id)).send({ text: 'No desayuna', anchor: { type: 'MEAL', mealLabel: 'Desayuno' } }).expect(201)).body.data;
    expect(desayuno.anchor).toEqual({ type: 'MEAL', mealLabel: 'Desayuno', inPlan: false });
    // Un ejercicio pide Entrenamiento: este profesional es de Nutrición.
    const sentadilla = await ejercicioDe(CATALOGO_DE_EJERCICIOS.sentadilla);
    await pro.post(propias(n.ase.id)).send({ text: 'x', anchor: { type: 'EXERCISE', exerciseId: sentadilla } }).expect(404);
    // Y uno de Entrenamiento no ata a una comida.
    const t = await circuitoConPlanDeEntrenamientoActivo(app, `npp-comida-trn-${contador}`);
    await conSesion(app, t.pro.token).post(propias(t.ase.id)).send({ text: 'x', anchor: { type: 'MEAL', mealLabel: 'Cena' } }).expect(404);
  });

  it('entran en la exportación de la persona, con su autor y su archivo; las notas de sus sesiones también', async () => {
    const c = await conSesionRegistrada('npp-exportacion');
    await conSesion(app, c.ase.token).post(notas(c.executionId)).send({ text: 'Algo me molestó' }).expect(201);
    const nota = (await conSesion(app, c.pro.token).post(propias(c.ase.id)).send({ text: 'Revisar la técnica del press' }).expect(201)).body.data;
    await conSesion(app, c.pro.token).post(archivar(nota.noteId)).send({}).expect(200);
    const pedida = await conSesion(app, c.ase.token).post('/api/v1/me/exports').send({ scope: { domains: ['TRAINING'], period: null } }).expect(201);
    const ruta = (await conSesion(app, c.ase.token).get(`/api/v1/me/exports/${pedida.body.data.exportId}`).expect(200)).body.data.download.path as string;
    const texto = (await request(app.getHttpServer()).get(`/api/v1${ruta}`).expect(200)).text;
    const archivo = JSON.parse(texto);
    expect(archivo.notasPropiasDeSusProfesionales).toHaveLength(1);
    expect(archivo.notasPropiasDeSusProfesionales[0]).toMatchObject({
      nota: { id: nota.noteId, texto: 'Revisar la técnica del press' },
      autor: { identidad: c.pro.id, nombreProfesional: expect.any(String) },
      archivada: true,
    });
    expect(archivo.entrenamiento.notasParaSuProfesional.map((n: { texto: string }) => n.texto)).toEqual(['Algo me molestó']);
    expect(texto).not.toContain('"procedencia"');
    expect(texto).not.toContain(c.pro.correo);
  });
});
