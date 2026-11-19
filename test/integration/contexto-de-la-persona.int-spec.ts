/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179) · TEST-CTX-030 a TEST-CTX-041, por la API real y contra PostgreSQL:
 *   1. API-CTX-01: lo que la persona respondió a las Solicitudes propias, vigente y por sección, en palabras; nunca lo de
 *      otro profesional ni lo pendiente; la rectificación cambia la versión;
 *   2. los 404 de lo inexistente: otra persona, un id malformado, el B2 revocado y el vínculo en pausa, con el mismo cuerpo;
 *      Administración no lee nada;
 *   3. la cita en la evaluación de Nutrición (como DL-102): con la versión vista, lo citado en la lectura, el 409 sin
 *      escribir nada, el 422 neutral para lo ajeno y para lo de otra área, y la base que lo repite;
 *   4. API-CTX-02: el cuerpo entero por el área propia (sin borradores, con el cambio entre comparables); por el resumen
 *      compartido, solo el peso y la composición en kilos, sin el contexto, y la lectura en «Quién miró»; sin compartir, 404.
 */
import type { INestApplication } from '@nestjs/common';
import {
  CuerpoDelContextoResponseSchema,
  EvaluacionResponseSchema,
  ListaDeEvaluacionesResponseSchema,
  MisResumenesCompartidosResponseSchema,
  RespuestasDelContextoResponseSchema,
  VERSION_VIGENTE,
} from '@be/domain';
import { PrismaClient, type Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { administradorListo } from './soporte-administracion';
import { borradorSembrado, circuitoAntropometrico, medicionSembrada, registrarBorrador, type CircuitoAntropometrico } from './soporte-antropometria';
import { appDePrueba, conSesion } from './soporte-api';
import { esperarQueEsperen, pidDeLaTransaccion } from './soporte-concurrencia';
import { circuitoV2, fri, pedirV2, RESPUESTAS_V2, conAgua, sembrarPlantillaV2, type CircuitoV2 } from './soporte-formularios-v2';
import { cuerpoDeEvaluacion } from './soporte-nutricion';
import { pausar, prepararProfesional, revocarB2, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

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

const respuestas = (token: string, adviseeId: string) => conSesion(app, token).get(`/api/v1/advisees/${adviseeId}/person-context/answers`);
const cuerpo = (token: string, adviseeId: string) => conSesion(app, token).get(`/api/v1/advisees/${adviseeId}/person-context/body`);
const evaluaciones = (adviseeId: string) => `/api/v1/advisees/${adviseeId}/nutrition/evaluations`;

/** Un circuito de Nutrición con la Solicitud V2 respondida por la persona: devuelve la Respuesta. */
async function respondido(etiqueta: string): Promise<CircuitoV2 & { formResponseId: string }> {
  const c = await circuitoV2(app, prisma, `ctx-${etiqueta}-${++contador}`, 'NUTRICION');
  const r = await fri(app, c.ase.token).responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201);
  return { ...c, formResponseId: r.body.data.formResponseId as string };
}

const cuerpoDel404 = (r: { body: { error: { code: string; message: string } } }) => ({ code: r.body.error.code, message: r.body.error.message });

// ─── 1. API-CTX-01 ──────────────────────────────────────────────────────────────────────────────

describe('DL-179 · 1. API-CTX-01, las respuestas propias, vigentes y en palabras', () => {
  it('TEST-CTX-030 · la Solicitud respondida, por sección, con el valor estructurado y en palabras, y la versión para citar', async () => {
    const c = await respondido('basico');
    const data = RespuestasDelContextoResponseSchema.parse((await respuestas(c.pro.token, c.ase.id).expect(200)).body).data;
    expect(data.scopes).toEqual(['NUTRICION']);
    expect(data.forms).toHaveLength(1);
    const f = data.forms[0]!;
    expect(f).toMatchObject({ formRequestId: c.formRequestId, formResponseId: c.formResponseId, scope: 'NUTRICION', version: 'v1', rectified: false, transcribedConfirmedAt: null });
    const agua = f.sections.flatMap((s) => s.answers).find((a) => a.fieldCode === 'ini_agua')!;
    expect(agua).toMatchObject({ label: '¿Cuántos vasos de agua tomás por día?', category: 'HABITOS_Y_CONTEXTO', dataType: 'NUMBER', text: '6 vasos' });
    // Una pregunta respondida con una opción va en palabras, nunca con su código.
    for (const a of f.sections.flatMap((s) => s.answers)) expect(a.text).not.toMatch(/^[a-z]+(_[a-z0-9]+)+$/);
  });

  it('TEST-CTX-031 · lo pendiente no sale, ni lo que la persona le contó a otro profesional', async () => {
    const c = await respondido('ajeno');
    // Otra Solicitud del mismo profesional, sin responder.
    await pedirV2(app, c.pro, c.ase.id, c.versionId, 'NUTRICION');
    // Otro profesional de Nutrición con la misma persona, con su Solicitud respondida.
    const otro = await prepararProfesional(app, `ctx-otro-${++contador}`, ['NUTRICION']);
    await vinculoCompleto(app, otro, c.ase, 'NUTRICION');
    const { versionId } = await sembrarPlantillaV2(prisma, `ctx-otro-${contador}`, 'NUTRICION');
    const suya = await pedirV2(app, otro, c.ase.id, versionId, 'NUTRICION');
    await fri(app, c.ase.token).responder(suya, { answers: conAgua(2), fromProposal: null }).expect(201);
    const mias = RespuestasDelContextoResponseSchema.parse((await respuestas(c.pro.token, c.ase.id).expect(200)).body).data.forms;
    expect(mias.map((f) => f.formRequestId)).toEqual([c.formRequestId]);
    const deEl = RespuestasDelContextoResponseSchema.parse((await respuestas(otro.token, c.ase.id).expect(200)).body).data.forms;
    expect(deEl.map((f) => f.formRequestId)).toEqual([suya]);
  });

  it('TEST-CTX-032 · una corrección de la persona cambia lo vigente y su versión', async () => {
    const c = await respondido('corregida');
    await fri(app, c.ase.token).corregir(c.formResponseId, { expectedVersion: 'v1', reason: 'Tomo menos agua.', answers: conAgua(3) }).expect(201);
    const f = RespuestasDelContextoResponseSchema.parse((await respuestas(c.pro.token, c.ase.id).expect(200)).body).data.forms[0]!;
    expect(f.version).toBe('v2');
    expect(f.rectified).toBe(true);
    expect(f.sections.flatMap((s) => s.answers).find((a) => a.fieldCode === 'ini_agua')!.text).toBe('3 vasos');
  });
});

// ─── 2. Los 404 ─────────────────────────────────────────────────────────────────────────────────

describe('DL-179 · 2. lo ajeno o no autorizado responde igual que lo inexistente', () => {
  it('TEST-CTX-033 · otra persona, un id malformado, el B2 revocado y el vínculo en pausa: el mismo 404, en las dos lecturas', async () => {
    const c = await respondido('404');
    const inexistente = await respuestas(c.pro.token, randomUUID()).expect(404);
    const malformado = await respuestas(c.pro.token, 'no-es-un-id').expect(404);
    const otro = await prepararProfesional(app, `ctx-sin-${++contador}`, ['NUTRICION']);
    const ajeno = await respuestas(otro.token, c.ase.id).expect(404);
    const ajenoCuerpo = await cuerpo(otro.token, c.ase.id).expect(404);
    for (const r of [malformado, ajeno, ajenoCuerpo]) expect(cuerpoDel404(r)).toEqual(cuerpoDel404(inexistente));

    // En pausa: no se lee nada; reanudar no es parte de esta prueba.
    const pausada = await respondido('pausa');
    await pausar(app, pausada.pro.token, pausada.vinculoId, await versionDeVinculo(app, pausada.pro.token, pausada.vinculoId)).expect(200);
    expect(cuerpoDel404(await respuestas(pausada.pro.token, pausada.ase.id).expect(404))).toEqual(cuerpoDel404(inexistente));

    // Con el B2 revocado por la persona.
    await revocarB2(app, c.ase, c.consentId).expect(200);
    expect(cuerpoDel404(await respuestas(c.pro.token, c.ase.id).expect(404))).toEqual(cuerpoDel404(inexistente));
  });

  it('TEST-CTX-034 · Administración no lee datos de salud por estas lecturas', async () => {
    const c = await respondido('adm');
    const a = await administradorListo(app, prisma, `ctx-${++contador}`);
    for (const r of [await respuestas(a.token, c.ase.id), await cuerpo(a.token, c.ase.id)]) {
      expect([401, 403, 404]).toContain(r.status);
      expect(r.body.data).toBeUndefined();
    }
  });
});

// ─── 3. La cita en la evaluación de Nutrición ────────────────────────────────────────────────────

describe('DL-179 · 3. la evaluación de Nutrición cita respuestas, como DL-102', () => {
  it('TEST-CTX-035 · cita con la versión vista y la lectura la devuelve, con rótulo y valor; sin citas, la lista vacía', async () => {
    const c = await respondido('cita');
    const creada = await conSesion(app, c.pro.token)
      .post(evaluaciones(c.ase.id))
      .send({ ...cuerpoDeEvaluacion(), formResponseReferences: [{ formResponseId: c.formResponseId, fieldCode: 'ini_agua', expectedVersion: 'v1' }] })
      .expect(201);
    const id = creada.body.data.evaluationId as string;
    const leida = EvaluacionResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/nutrition/evaluations/${id}`).expect(200)).body).data;
    expect(leida.formResponseReferences).toEqual([
      expect.objectContaining({ formResponseId: c.formResponseId, fieldCode: 'ini_agua', label: '¿Cuántos vasos de agua tomás por día?', value: 6, unit: 'vasos', citedVersion: 'v1', laterVersionExists: false, provenance: 'SELF_REPORTED' }),
    ]);
    const sinCitas = await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacion()).expect(201);
    const lista = ListaDeEvaluacionesResponseSchema.parse((await conSesion(app, c.pro.token).get(evaluaciones(c.ase.id)).expect(200)).body).data;
    expect(lista.find((e) => e.evaluationId === sinCitas.body.data.evaluationId)!.formResponseReferences).toEqual([]);
    expect(lista.find((e) => e.evaluationId === id)!.formResponseReferences).toHaveLength(1);
  });

  it('TEST-CTX-036 · si la persona corrigió después de verla: 409 VERSION_CONFLICT y no se escribe nada', async () => {
    const c = await respondido('conflicto');
    await fri(app, c.ase.token).corregir(c.formResponseId, { expectedVersion: 'v1', reason: 'Corrijo.', answers: conAgua(4) }).expect(201);
    const antes = await prisma.evaluacionNutricional.count({ where: { asesoradoId: c.ase.id } });
    const r = await conSesion(app, c.pro.token)
      .post(evaluaciones(c.ase.id))
      .send({ ...cuerpoDeEvaluacion(), formResponseReferences: [{ formResponseId: c.formResponseId, fieldCode: 'ini_agua', expectedVersion: 'v1' }] })
      .expect(409);
    expect(r.body.error.code).toBe('VERSION_CONFLICT');
    expect(await prisma.evaluacionNutricional.count({ where: { asesoradoId: c.ase.id } })).toBe(antes);
  });

  it('TEST-CTX-037 · lo de otro profesional, un id inexistente y lo de otra área: el mismo 422 neutral', async () => {
    const c = await respondido('invalida');
    const otro = await prepararProfesional(app, `ctx-422-${++contador}`, ['NUTRICION']);
    await vinculoCompleto(app, otro, c.ase, 'NUTRICION');
    // Un profesional de Nutrición y Entrenamiento: su respuesta de Entrenamiento no se cita en una evaluación de Nutrición.
    const dos = await prepararProfesional(app, `ctx-dos-${contador}`, ['NUTRICION', 'ENTRENAMIENTO']);
    await vinculoCompleto(app, dos, c.ase, 'NUTRICION');
    await vinculoCompleto(app, dos, c.ase, 'ENTRENAMIENTO');
    const { versionId } = await sembrarPlantillaV2(prisma, `ctx-trn-${contador}`, 'ENTRENAMIENTO');
    const deEntrenamiento = await pedirV2(app, dos, c.ase.id, versionId, 'ENTRENAMIENTO');
    const respuestaDeEntrenamiento = (await fri(app, c.ase.token).responder(deEntrenamiento, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201)).body.data.formResponseId as string;
    const cuerpos = [];
    for (const [pro, formResponseId] of [
      [otro, c.formResponseId],
      [c.pro, randomUUID()],
      [dos, respuestaDeEntrenamiento],
    ] as const) {
      const r = await conSesion(app, pro.token).post(evaluaciones(c.ase.id)).send({ ...cuerpoDeEvaluacion(), formResponseReferences: [{ formResponseId, fieldCode: 'ini_agua' }] }).expect(422);
      cuerpos.push({ code: r.body.error.code, issues: r.body.error.details.issues });
    }
    expect(cuerpos[0]).toEqual({ code: 'NUTRITION_EVALUATION_INVALID', issues: [{ code: 'FORM_RESPONSE_REFERENCE_INVALID', path: 'formResponseReferences[0]' }] });
    expect(cuerpos[1]).toEqual(cuerpos[0]);
    expect(cuerpos[2]).toEqual(cuerpos[0]);
  });

  it('TEST-CTX-038 · la base repite la pertenencia y el solo agregar de la tabla nueva', async () => {
    const c = await respondido('base');
    const id = (await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send({ ...cuerpoDeEvaluacion(), formResponseReferences: [{ formResponseId: c.formResponseId, fieldCode: 'ini_agua' }] }).expect(201)).body.data.evaluationId as string;
    const tabla = '"cita_de_respuesta_en_evaluacion_nutricional"';
    await expect(prisma.$executeRawUnsafe(`UPDATE ${tabla} SET "orden" = 5 WHERE "evaluacion_id" = '${id}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM ${tabla} WHERE "evaluacion_id" = '${id}'`)).rejects.toThrow(/append-only/);
    // Fuera de la transacción de su evaluación, la base no deja agregar una cita.
    await expect(
      prisma.$executeRawUnsafe(`INSERT INTO ${tabla} ("evaluacion_id","respuesta_id","codigo_de_campo","orden") VALUES ('${id}','${c.formResponseId}','ini_jornada',1)`),
    ).rejects.toThrow(/misma transacción/);
  });
});

// ─── 4. API-CTX-02 ──────────────────────────────────────────────────────────────────────────────

/**
 * Una toma registrada con esas mediciones, sembrada por SQL como en WP-05. Cada toma nace con la hora de la base: la que se
 * siembra después es la más nueva. El contexto se escribe mientras está en preparación, como lo hace API-ANT-04.
 */
async function toma(c: CircuitoAntropometrico, medidas: { metrica: string; valor: number; unidad: string }[], contexto: string | null = null): Promise<string> {
  const id = await borradorSembrado(prisma, c);
  for (const m of medidas) await medicionSembrada(prisma, c, id, m);
  if (contexto) await prisma.$executeRawUnsafe(`UPDATE "evaluacion_antropometrica" SET "contexto" = '${contexto}', "version" = "version" + 1 WHERE "id" = '${id}'`);
  await registrarBorrador(prisma, id);
  return id;
}

describe('DL-179 · 4. API-CTX-02, el cuerpo', () => {
  it('TEST-CTX-039 · por el área propia: las dos últimas tomas registradas, enteras, con el cambio y su base; el borrador no cuenta', async () => {
    const c = await circuitoAntropometrico(app, prisma, `ctx-cuerpo-${++contador}`);
    await toma(c, [{ metrica: 'peso', valor: 80, unidad: 'kg' }, { metrica: 'pliegue-triceps', valor: 12, unidad: 'mm' }]);
    const ultima = await toma(c, [{ metrica: 'peso', valor: 78.8, unidad: 'kg' }, { metrica: 'pliegue-triceps', valor: 11, unidad: 'mm' }], 'En ayunas');
    const borrador = await borradorSembrado(prisma, c);
    await medicionSembrada(prisma, c, borrador, { metrica: 'peso', valor: 60, unidad: 'kg' });
    const data = CuerpoDelContextoResponseSchema.parse((await cuerpo(c.pro.token, c.ase.id).expect(200)).body).data;
    expect(data.access).toBe('OWN_AREA');
    expect(data.latest).toMatchObject({ evaluationId: ultima, context: 'En ayunas', origins: ['DIRECT_CAPTURE'] });
    const peso = data.metrics.find((m) => m.metricCode === 'peso')!;
    expect(peso.latest).toMatchObject({ value: 78.8, unit: 'kg', dataClass: 'MEASURED' });
    expect(peso.change).toEqual({ value: -1.2, unit: 'kg', percent: -1.5, base: 80 });
    expect(data.metrics.map((m) => m.metricCode)).toContain('pliegue-triceps');
  });

  it('TEST-CTX-040 · por el resumen compartido: solo peso y composición en kilos, sin contexto, y la lectura queda en «Quién miró»; sin compartir, 404', async () => {
    const c = await circuitoAntropometrico(app, prisma, `ctx-compartido-${++contador}`);
    await toma(c, [{ metrica: 'peso', valor: 70, unidad: 'kg' }, { metrica: 'pliegue-triceps', valor: 12, unidad: 'mm' }], 'Después de entrenar');
    const nutri: Parte = await prepararProfesional(app, `ctx-nutri-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, nutri, c.ase, 'NUTRICION');
    // Sin compartir: el 404 de lo inexistente.
    await cuerpo(nutri.token, c.ase.id).expect(404);
    // La persona le comparte el resumen de Antropometría.
    const s = conSesion(app, c.ase.token);
    const yo = MisResumenesCompartidosResponseSchema.parse((await s.get('/api/v1/me/summary-sharing').expect(200)).body).data;
    await s
      .put('/api/v1/me/summary-sharing')
      .send({ expectedVersion: yo.sharing.version, acceptedTexts: { summary: VERSION_VIGENTE.RESUMENES_COMPARTIDOS.id, summaryAndPlan: null }, grants: [{ professionalId: nutri.id, area: 'ANTROPOMETRIA', level: 'SUMMARY' }] })
      .expect(200);
    const data = CuerpoDelContextoResponseSchema.parse((await cuerpo(nutri.token, c.ase.id).expect(200)).body).data;
    expect(data.access).toBe('SHARED_SUMMARY');
    expect(data.metrics.map((m) => m.metricCode)).toEqual(['peso']);
    expect(data.latest?.context).toBeNull();
    expect(data.latest?.author.identityId).toBe(c.pro.id);
    const vistas = MisResumenesCompartidosResponseSchema.parse((await s.get('/api/v1/me/summary-sharing').expect(200)).body).data.accesses;
    // Una sola lectura: la del 404 de antes de compartir no quedó (su transacción no se confirmó).
    expect(vistas.filter((v) => v.professional.identityId === nutri.id && v.area === 'ANTROPOMETRIA')).toHaveLength(1);
  });

  it('TEST-CTX-041 · quien lleva el área ve solo sus tomas; sin tomas, null y ninguna métrica', async () => {
    const c = await circuitoAntropometrico(app, prisma, `ctx-vacio-${++contador}`);
    const data = CuerpoDelContextoResponseSchema.parse((await cuerpo(c.pro.token, c.ase.id).expect(200)).body).data;
    expect(data).toEqual({ access: 'OWN_AREA', latest: null, previous: null, metrics: [] });
  });
});

// ─── 5. Revisión del PR: los cortes, también en carrera ───────────────────────────────────────────

/** La persona le comparte a `quien` el resumen de Antropometría (DL-163 D-13), con el texto de «resumen». */
async function compartirElCuerpo(ase: Parte, quien: Parte): Promise<void> {
  const s = conSesion(app, ase.token);
  const yo = MisResumenesCompartidosResponseSchema.parse((await s.get('/api/v1/me/summary-sharing').expect(200)).body).data;
  await s
    .put('/api/v1/me/summary-sharing')
    .send({ expectedVersion: yo.sharing.version, acceptedTexts: { summary: VERSION_VIGENTE.RESUMENES_COMPARTIDOS.id, summaryAndPlan: null }, grants: [{ professionalId: quien.id, area: 'ANTROPOMETRIA', level: 'SUMMARY' }] })
    .expect(200);
}

type Respuesta = Awaited<ReturnType<typeof respuestas>>;

/**
 * Un corte en curso, sin pausas: una transacción de la prueba retiene lo que retiene el corte (`retener`), dispara la lectura y
 * la suelta recién cuando la base dice que la lectura la espera (`pg_stat_activity`). Si la lectura no tomara ese cerrojo,
 * terminaría sin esperar y la prueba queda en rojo.
 */
async function laLecturaEspera(retener: (tx: Prisma.TransactionClient) => Promise<unknown>, leer: () => Promise<Respuesta>, que: string): Promise<Respuesta> {
  let respuesta: Promise<Respuesta> | undefined;
  let termino = false;
  await prisma.$transaction(
    async (tx) => {
      await retener(tx);
      const pid = await pidDeLaTransaccion(tx);
      respuesta = leer().finally(() => {
        termino = true;
      });
      await esperarQueEsperen(prisma, 1, { bloqueadoPor: pid, yaPaso: () => termino, que });
      expect(termino).toBe(false);
    },
    { timeout: 40_000, maxWait: 10_000 },
  );
  return respuesta as Promise<Respuesta>;
}

describe('DL-179 · 5. revisión del PR: retirar un permiso corta, también en carrera', () => {
  it('TEST-CTX-042 · el cuerpo compartido, retirado o con el vínculo de quien lo recibe en pausa: el mismo 404 de lo inexistente', async () => {
    const c = await circuitoAntropometrico(app, prisma, `ctx-corta-${++contador}`);
    await toma(c, [{ metrica: 'peso', valor: 70, unidad: 'kg' }]);
    const inexistente = cuerpoDel404(await cuerpo(c.pro.token, randomUUID()).expect(404));
    // Retirar lo compartido (API-RES-03) corta desde ese momento.
    const nutri = await prepararProfesional(app, `ctx-corta-n-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, nutri, c.ase, 'NUTRICION');
    await compartirElCuerpo(c.ase, nutri);
    await cuerpo(nutri.token, c.ase.id).expect(200);
    const s = conSesion(app, c.ase.token);
    const yo = MisResumenesCompartidosResponseSchema.parse((await s.get('/api/v1/me/summary-sharing').expect(200)).body).data;
    await s.post('/api/v1/me/summary-sharing/withdrawal').send({ expectedVersion: yo.sharing.version }).expect(200);
    expect(cuerpoDel404(await cuerpo(nutri.token, c.ase.id).expect(404))).toEqual(inexistente);
    // Con el vínculo de quien lo recibe en pausa, tampoco, aunque siga compartido.
    const otro = await prepararProfesional(app, `ctx-corta-o-${contador}`, ['ENTRENAMIENTO']);
    const { vinculoId } = await vinculoCompleto(app, otro, c.ase, 'ENTRENAMIENTO');
    await compartirElCuerpo(c.ase, otro);
    await cuerpo(otro.token, c.ase.id).expect(200);
    await pausar(app, otro.token, vinculoId, await versionDeVinculo(app, otro.token, vinculoId)).expect(200);
    expect(cuerpoDel404(await cuerpo(otro.token, c.ase.id).expect(404))).toEqual(inexistente);
  });

  it('TEST-CTX-043 · con dos áreas, revocar el B2 de una saca sus formularios y deja los de la otra', async () => {
    const c = await respondido('dos-areas');
    const dos = await prepararProfesional(app, `ctx-dos-areas-${++contador}`, ['NUTRICION', 'ENTRENAMIENTO']);
    await vinculoCompleto(app, dos, c.ase, 'NUTRICION');
    const trn = await vinculoCompleto(app, dos, c.ase, 'ENTRENAMIENTO');
    const nut = await sembrarPlantillaV2(prisma, `ctx-dos-n-${contador}`, 'NUTRICION');
    const ent = await sembrarPlantillaV2(prisma, `ctx-dos-e-${contador}`, 'ENTRENAMIENTO');
    const deNutricion = await pedirV2(app, dos, c.ase.id, nut.versionId, 'NUTRICION');
    const deEntrenamiento = await pedirV2(app, dos, c.ase.id, ent.versionId, 'ENTRENAMIENTO');
    for (const s of [deNutricion, deEntrenamiento]) await fri(app, c.ase.token).responder(s, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201);
    const antes = RespuestasDelContextoResponseSchema.parse((await respuestas(dos.token, c.ase.id).expect(200)).body).data;
    expect([...antes.scopes].sort()).toEqual(['ENTRENAMIENTO', 'NUTRICION']);
    expect(antes.forms.map((f) => f.formRequestId).sort()).toEqual([deEntrenamiento, deNutricion].sort());
    await revocarB2(app, c.ase, trn.consentId as string).expect(200);
    const despues = RespuestasDelContextoResponseSchema.parse((await respuestas(dos.token, c.ase.id).expect(200)).body).data;
    expect(despues.scopes).toEqual(['NUTRICION']);
    expect(despues.forms.map((f) => f.formRequestId)).toEqual([deNutricion]);
  });

  it('TEST-CTX-044 · un corte en curso hace esperar a las dos lecturas: toman los mismos cerrojos que las demás (el PDP y el de la autorización de resúmenes)', async () => {
    // Mutación verificada: sacar `tomarLaAutorizacionDeResumenes` de API-CTX-02 pone en rojo el tercer caso (no espera).
    // API-CTX-01: una revocación del B2 en curso retiene el consentimiento; el PDP de la lectura lo pide en modo compartido.
    const c = await respondido('carrera');
    const r1 = await laLecturaEspera(
      (tx) => tx.$queryRaw`SELECT 1 FROM "consentimiento" WHERE "id" = ${c.consentId}::uuid FOR UPDATE`,
      () => respuestas(c.pro.token, c.ase.id).then((r) => r),
      'API-CTX-01 esperando el consentimiento',
    );
    expect(r1.status).toBe(200);
    // API-CTX-02 por el área propia: lo mismo, con el consentimiento de Antropometría.
    const a = await circuitoAntropometrico(app, prisma, `ctx-carrera-${++contador}`);
    const r2 = await laLecturaEspera(
      (tx) => tx.$queryRaw`SELECT 1 FROM "consentimiento" WHERE "id" = ${a.consentId}::uuid FOR UPDATE`,
      () => cuerpo(a.pro.token, a.ase.id).then((r) => r),
      'API-CTX-02 (área propia) esperando el consentimiento',
    );
    expect(r2.status).toBe(200);
    // API-CTX-02 por lo compartido: un retiro en curso (API-RES-03) tiene el cerrojo de la autorización en modo exclusivo.
    const nutri = await prepararProfesional(app, `ctx-carrera-n-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, nutri, a.ase, 'NUTRICION');
    await compartirElCuerpo(a.ase, nutri);
    const cerrojo = `autorizacion-de-resumenes|${a.ase.id}`;
    const r3 = await laLecturaEspera(
      (tx) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${cerrojo}, 0))`,
      () => cuerpo(nutri.token, a.ase.id).then((r) => r),
      'API-CTX-02 (compartido) esperando la autorización',
    );
    expect(r3.status).toBe(200);
  });

  it('TEST-CTX-045 · quien lleva Antropometría (aunque sin su B2) no la ve por lo compartido: la ve por su Alcance, como API-RES-06', async () => {
    // Mutación verificada: sin la guardia, X ve el peso de la toma de otro profesional sin haber recibido su B2 de Antropometría.
    const c = await circuitoAntropometrico(app, prisma, `ctx-lleva-${++contador}`);
    await toma(c, [{ metrica: 'peso', valor: 70, unidad: 'kg' }]);
    const x = await prepararProfesional(app, `ctx-lleva-x-${contador}`, ['NUTRICION', 'ANTROPOMETRIA']);
    await vinculoCompleto(app, x, c.ase, 'NUTRICION');
    await compartirElCuerpo(c.ase, x);
    expect(CuerpoDelContextoResponseSchema.parse((await cuerpo(x.token, c.ase.id).expect(200)).body).data.access).toBe('SHARED_SUMMARY');
    // Empieza a llevar Antropometría con la persona, todavía sin su B2.
    await vinculoCompleto(app, x, c.ase, 'ANTROPOMETRIA', { b2: false });
    const inexistente = cuerpoDel404(await cuerpo(x.token, randomUUID()).expect(404));
    expect(cuerpoDel404(await cuerpo(x.token, c.ase.id).expect(404))).toEqual(inexistente);
  });
});
