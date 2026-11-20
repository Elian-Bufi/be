/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185) · TEST-EVF-010 a TEST-EVF-021, por la API real y contra PostgreSQL:
 *   1. vincular un formulario respondido a la evaluación de Nutrición y a la de Entrenamiento: queda la referencia a la
 *      versión vigente (no una copia), la lista la devuelve y abrirlo muestra lo respondido en esa versión;
 *   2. la persona corrige después: la evaluación conserva la vinculada y avisa la más nueva; con la versión vieja, 409 sin
 *      escribir nada; «Vincular la más nueva» reemplaza, y la fila anterior queda desvinculada;
 *   3. desvincular: sale de la lista, la fila queda con su fecha, abrirlo da 404 y repetirlo no cambia nada;
 *   4. la frontera de permisos: otro profesional (con o sin vínculo), el B2 revocado y el vínculo en pausa dan el mismo 404
 *      que lo inexistente en las cuatro operaciones; lo de otro profesional, de otra área o inexistente, el mismo 422;
 *      Administración no lee nada;
 *   5. la privacidad: vincular no escribe nada en la evaluación, ni en lo que lee la persona;
 *   6. la base repite la pertenencia, el «nace vigente», el «solo se desvincula una vez» y el solo agregar;
 *   7. en carrera (revisión del PR), sin pausas: dos pedidos sobre la misma evaluación se ordenan por su fila.
 */
import type { INestApplication } from '@nestjs/common';
import { EvaluacionResponseSchema, FormularioVinculadoConRespuestasResponseSchema, FormulariosVinculadosResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { administradorListo } from './soporte-administracion';
import { appDePrueba, conSesion } from './soporte-api';
import { circuitoV2, conAgua, fri, pedirV2, RESPUESTAS_V2, sembrarPlantillaV2, type CircuitoV2 } from './soporte-formularios-v2';
import { cuerpoDeEvaluacion } from './soporte-nutricion';
import { cuerpoDeEvaluacionDeEntrenamiento } from './soporte-entrenamiento';
import { pausar, prepararProfesional, revocarB2, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';
import { esperarQueEsperen } from './soporte-concurrencia';

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

type Area = 'nutrition' | 'training';
const base = (area: Area, evaluationId: string) => `/api/v1/${area}/evaluations/${evaluationId}/linked-forms`;
const listar = (token: string, area: Area, id: string) => conSesion(app, token).get(base(area, id));
const vincular = (token: string, area: Area, id: string, links: { formResponseId: string; expectedVersion: string }[], clave?: string) =>
  conSesion(app, token).post(base(area, id), clave).send({ links });
const desvincular = (token: string, area: Area, id: string, linkId: string, clave?: string) => conSesion(app, token).post(`${base(area, id)}/${linkId}/removal`, clave).send({});
const abrir = (token: string, area: Area, id: string, linkId: string) => conSesion(app, token).get(`${base(area, id)}/${linkId}`);
const cuerpoDel404 = (r: { body: { error: { code: string; message: string } } }) => ({ code: r.body.error.code, message: r.body.error.message });

/** Un circuito del área con la Solicitud V2 respondida y una evaluación registrada del mismo profesional. */
async function conEvaluacion(etiqueta: string, area: Area = 'nutrition'): Promise<CircuitoV2 & { formResponseId: string; evaluationId: string }> {
  const alcance = area === 'nutrition' ? 'NUTRICION' : 'ENTRENAMIENTO';
  const c = await circuitoV2(app, prisma, `evf-${etiqueta}-${++contador}`, alcance);
  const r = await fri(app, c.ase.token).responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201);
  const ruta = area === 'nutrition' ? `/api/v1/advisees/${c.ase.id}/nutrition/evaluations` : `/api/v1/advisees/${c.ase.id}/training/evaluations`;
  const ev = await conSesion(app, c.pro.token)
    .post(ruta)
    .send(area === 'nutrition' ? cuerpoDeEvaluacion() : cuerpoDeEvaluacionDeEntrenamiento())
    .expect(201);
  return { ...c, formResponseId: r.body.data.formResponseId as string, evaluationId: ev.body.data.evaluationId as string };
}

const agua = (form: { sections: { answers: { fieldCode: string; text: string }[] }[] }) => form.sections.flatMap((s) => s.answers).find((a) => a.fieldCode === 'ini_agua')?.text;

// ─── 1. Vincular y leer ─────────────────────────────────────────────────────────────────────────

describe('DL-185 · 1. vincular un formulario respondido a la evaluación inicial', () => {
  it.each<Area>(['nutrition', 'training'])('TEST-EVF-010 · %s: se vincula con la versión vista, la lista lo devuelve y abrirlo muestra lo respondido', async (area) => {
    const c = await conEvaluacion(`basico-${area}`, area);
    expect(FormulariosVinculadosResponseSchema.parse((await listar(c.pro.token, area, c.evaluationId).expect(200)).body).data.links).toEqual([]);

    const creado = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, area, c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data;
    expect(creado.evaluationId).toBe(c.evaluationId);
    expect(creado.links).toHaveLength(1);
    const v = creado.links[0]!;
    expect(v).toMatchObject({ formResponseId: c.formResponseId, formRequestId: c.formRequestId, scope: area === 'nutrition' ? 'NUTRICION' : 'ENTRENAMIENTO', linkedVersion: 'v1', laterVersion: null });
    expect(v.templateName.length).toBeGreaterThan(0);

    const leida = FormulariosVinculadosResponseSchema.parse((await listar(c.pro.token, area, c.evaluationId).expect(200)).body).data;
    expect(leida.links).toEqual(creado.links);

    const abierto = FormularioVinculadoConRespuestasResponseSchema.parse((await abrir(c.pro.token, area, c.evaluationId, v.linkId).expect(200)).body).data;
    expect(abierto.link).toEqual(v);
    expect(abierto.form).toMatchObject({ formResponseId: c.formResponseId, version: 'v1', rectified: false });
    expect(agua(abierto.form)).toBe('6 vasos');

    // Vincular lo mismo otra vez no cambia nada: 200 con la misma lista.
    const igual = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, area, c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(200)).body).data;
    expect(igual.links).toEqual(creado.links);
    expect(await prisma.vinculoDeFormularioEnEvaluacion.count({ where: { respuestaId: c.formResponseId } })).toBe(1);
  });

  it('TEST-EVF-011 · la misma clave de idempotencia devuelve lo mismo; con otro cuerpo, 409', async () => {
    const c = await conEvaluacion('idempotencia');
    const clave = `evf-${randomUUID()}`;
    const uno = await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }], clave).expect(201);
    const dos = await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }], clave).expect(201);
    expect(dos.body).toEqual(uno.body);
    const otro = await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: randomUUID(), expectedVersion: 'v1' }], clave).expect(409);
    expect(otro.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });
});

// ─── 2. Una versión más nueva ───────────────────────────────────────────────────────────────────

describe('DL-185 · 2. si la persona corrige después, la evaluación conserva la vinculada', () => {
  it('TEST-EVF-012 · avisa la más nueva, abre la vinculada; con la versión vieja, 409 sin escribir; «Vincular la más nueva» reemplaza', async () => {
    const c = await conEvaluacion('mas-nueva');
    const v = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data.links[0]!;
    await fri(app, c.ase.token).corregir(c.formResponseId, { expectedVersion: 'v1', reason: 'Tomo menos agua.', answers: conAgua(3) }).expect(201);

    const lista = FormulariosVinculadosResponseSchema.parse((await listar(c.pro.token, 'nutrition', c.evaluationId).expect(200)).body).data.links;
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ linkId: v.linkId, linkedVersion: 'v1', answeredAt: v.answeredAt, laterVersion: { version: 'v2' } });
    // Lo vinculado no cambia: sigue diciendo lo que respondió al vincular.
    const abierto = FormularioVinculadoConRespuestasResponseSchema.parse((await abrir(c.pro.token, 'nutrition', c.evaluationId, v.linkId).expect(200)).body).data;
    expect(agua(abierto.form)).toBe('6 vasos');
    expect(abierto.form.version).toBe('v1');

    // Con la versión que ya no es la vigente: 409 y nada cambia.
    const conflicto = await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(409);
    expect(conflicto.body.error.code).toBe('VERSION_CONFLICT');
    expect(conflicto.body.error.details.issues).toEqual([{ code: 'FORM_RESPONSE_VERSION_CHANGED', path: 'links[0].expectedVersion' }]);
    expect(await prisma.vinculoDeFormularioEnEvaluacion.count({ where: { respuestaId: c.formResponseId } })).toBe(1);

    // «Vincular la más nueva»: la v2 reemplaza a la v1, que queda desvinculada.
    const nueva = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v2' }]).expect(201)).body).data.links;
    expect(nueva).toHaveLength(1);
    expect(nueva[0]).toMatchObject({ linkedVersion: 'v2', laterVersion: null });
    expect(nueva[0]!.linkId).not.toBe(v.linkId);
    expect(agua(FormularioVinculadoConRespuestasResponseSchema.parse((await abrir(c.pro.token, 'nutrition', c.evaluationId, nueva[0]!.linkId).expect(200)).body).data.form)).toBe('3 vasos');
    const filas = await prisma.vinculoDeFormularioEnEvaluacion.findMany({ where: { respuestaId: c.formResponseId }, orderBy: { vinculadoEn: 'asc' } });
    expect(filas.map((f) => [f.rectificacionId === null, f.desvinculadoEn === null])).toEqual([
      [true, false],
      [false, true],
    ]);
    // La reemplazada ya no se abre.
    await abrir(c.pro.token, 'nutrition', c.evaluationId, v.linkId).expect(404);
  });
});

// ─── 3. Desvincular ─────────────────────────────────────────────────────────────────────────────

describe('DL-185 · 3. desvincular', () => {
  it('TEST-EVF-013 · sale de la lista, la fila queda con su fecha, abrirlo da 404 y repetirlo no cambia nada', async () => {
    const c = await conEvaluacion('desvincular', 'training');
    const v = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, 'training', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data.links[0]!;
    const sin = FormulariosVinculadosResponseSchema.parse((await desvincular(c.pro.token, 'training', c.evaluationId, v.linkId).expect(200)).body).data;
    expect(sin.links).toEqual([]);
    const fila = await prisma.vinculoDeFormularioEnEvaluacion.findUniqueOrThrow({ where: { id: v.linkId } });
    expect(fila.desvinculadoEn).not.toBeNull();
    await desvincular(c.pro.token, 'training', c.evaluationId, v.linkId).expect(200);
    expect((await prisma.vinculoDeFormularioEnEvaluacion.findUniqueOrThrow({ where: { id: v.linkId } })).desvinculadoEn).toEqual(fila.desvinculadoEn);
    await abrir(c.pro.token, 'training', c.evaluationId, v.linkId).expect(404);
    // Se puede volver a vincular: es una fila nueva.
    await vincular(c.pro.token, 'training', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201);
    expect(await prisma.vinculoDeFormularioEnEvaluacion.count({ where: { respuestaId: c.formResponseId } })).toBe(2);
  });

  it('TEST-EVF-014 · un vínculo de otra evaluación o del área equivocada, el mismo 404 que uno inexistente', async () => {
    const c = await conEvaluacion('otra-evaluacion');
    const v = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data.links[0]!;
    const otra = (await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(201)).body.data.evaluationId as string;
    const inexistente = await abrir(c.pro.token, 'nutrition', c.evaluationId, randomUUID()).expect(404);
    for (const r of [
      await abrir(c.pro.token, 'nutrition', otra, v.linkId).expect(404),
      await desvincular(c.pro.token, 'nutrition', otra, v.linkId).expect(404),
      await abrir(c.pro.token, 'training', c.evaluationId, v.linkId).expect(404),
      await listar(c.pro.token, 'training', c.evaluationId).expect(404),
      await conSesion(app, c.pro.token).get(`/api/v1/anthropometry/evaluations/${c.evaluationId}/linked-forms`).expect(404),
      await abrir(c.pro.token, 'nutrition', c.evaluationId, 'no-es-un-id').expect(404),
    ]) {
      expect(cuerpoDel404(r)).toEqual(cuerpoDel404(inexistente));
    }
    // Sigue vinculado.
    expect(FormulariosVinculadosResponseSchema.parse((await listar(c.pro.token, 'nutrition', c.evaluationId).expect(200)).body).data.links).toHaveLength(1);
  });
});

// ─── 4. La frontera de permisos ─────────────────────────────────────────────────────────────────

describe('DL-185 · 4. la frontera de permisos es la de la evaluación y la de los formularios', () => {
  it('TEST-EVF-015 · otro profesional, con o sin vínculo con la persona: el mismo 404 en las cuatro operaciones', async () => {
    const c = await conEvaluacion('ajeno');
    const v = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data.links[0]!;
    const conVinculo = await prepararProfesional(app, `evf-con-${++contador}`, ['NUTRICION']);
    await vinculoCompleto(app, conVinculo, c.ase, 'NUTRICION');
    const sinVinculo = await prepararProfesional(app, `evf-sin-${contador}`, ['NUTRICION']);
    const inexistente = await listar(c.pro.token, 'nutrition', randomUUID()).expect(404);
    for (const otro of [conVinculo, sinVinculo]) {
      for (const r of [
        await listar(otro.token, 'nutrition', c.evaluationId).expect(404),
        await vincular(otro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(404),
        await desvincular(otro.token, 'nutrition', c.evaluationId, v.linkId).expect(404),
        await abrir(otro.token, 'nutrition', c.evaluationId, v.linkId).expect(404),
      ]) {
        expect(cuerpoDel404(r)).toEqual(cuerpoDel404(inexistente));
      }
    }
    // La persona tampoco: la evaluación es del profesional.
    expect(cuerpoDel404(await listar(c.ase.token, 'nutrition', c.evaluationId).expect(404))).toEqual(cuerpoDel404(inexistente));
    expect(await prisma.vinculoDeFormularioEnEvaluacion.count({ where: { respuestaId: c.formResponseId, desvinculadoEn: null } })).toBe(1);
  });

  it('TEST-EVF-016 · con el B2 revocado o el vínculo en pausa, el mismo 404; Administración no lee nada', async () => {
    const c = await conEvaluacion('b2');
    const v = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data.links[0]!;
    const inexistente = await listar(c.pro.token, 'nutrition', randomUUID()).expect(404);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    for (const r of [await listar(c.pro.token, 'nutrition', c.evaluationId).expect(404), await abrir(c.pro.token, 'nutrition', c.evaluationId, v.linkId).expect(404)]) {
      expect(cuerpoDel404(r)).toEqual(cuerpoDel404(inexistente));
    }

    const p = await conEvaluacion('pausa', 'training');
    const w = FormulariosVinculadosResponseSchema.parse((await vincular(p.pro.token, 'training', p.evaluationId, [{ formResponseId: p.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data.links[0]!;
    await pausar(app, p.pro.token, p.vinculoId, await versionDeVinculo(app, p.pro.token, p.vinculoId)).expect(200);
    for (const r of [
      await listar(p.pro.token, 'training', p.evaluationId).expect(404),
      await abrir(p.pro.token, 'training', p.evaluationId, w.linkId).expect(404),
      await desvincular(p.pro.token, 'training', p.evaluationId, w.linkId).expect(404),
    ]) {
      expect(cuerpoDel404(r)).toEqual(cuerpoDel404(inexistente));
    }

    const a = await administradorListo(app, prisma, `evf-${++contador}`);
    for (const r of [await listar(a.token, 'training', p.evaluationId), await abrir(a.token, 'training', p.evaluationId, w.linkId)]) {
      expect([401, 403, 404]).toContain(r.status);
      expect(r.body.data).toBeUndefined();
    }
  });

  it('TEST-EVF-017 · lo de otro profesional, de otra área del mismo profesional o inexistente: el mismo 422 neutral, sin escribir', async () => {
    const c = await conEvaluacion('422');
    // Otro profesional de Nutrición con la misma persona: su Solicitud, respondida.
    const otro = await prepararProfesional(app, `evf-422-${++contador}`, ['NUTRICION']);
    await vinculoCompleto(app, otro, c.ase, 'NUTRICION');
    const { versionId } = await sembrarPlantillaV2(prisma, `evf-otro-${contador}`, 'NUTRICION');
    const suya = await pedirV2(app, otro, c.ase.id, versionId, 'NUTRICION');
    const respuestaAjena = (await fri(app, c.ase.token).responder(suya, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201)).body.data.formResponseId as string;
    // Un profesional de las dos áreas: su respuesta de Entrenamiento no se vincula a su evaluación de Nutrición.
    const dos = await prepararProfesional(app, `evf-dos-${contador}`, ['NUTRICION', 'ENTRENAMIENTO']);
    await vinculoCompleto(app, dos, c.ase, 'NUTRICION');
    await vinculoCompleto(app, dos, c.ase, 'ENTRENAMIENTO');
    const deEntrenamiento = await pedirV2(app, dos, c.ase.id, (await sembrarPlantillaV2(prisma, `evf-trn-${contador}`, 'ENTRENAMIENTO')).versionId, 'ENTRENAMIENTO');
    const respuestaDeEntrenamiento = (await fri(app, c.ase.token).responder(deEntrenamiento, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201)).body.data.formResponseId as string;
    const evaluacionDeDos = (await conSesion(app, dos.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(201)).body.data.evaluationId as string;

    const cuerpos = [];
    for (const [pro, evaluacion, formResponseId] of [
      [c.pro, c.evaluationId, respuestaAjena],
      [c.pro, c.evaluationId, randomUUID()],
      [dos, evaluacionDeDos, respuestaDeEntrenamiento],
      [c.pro, c.evaluationId, 'no-es-un-id'],
    ] as const) {
      const r = await vincular(pro.token, 'nutrition', evaluacion, [{ formResponseId, expectedVersion: 'v1' }]).expect(422);
      cuerpos.push({ code: r.body.error.code, issues: r.body.error.details.issues });
    }
    expect(cuerpos[0]).toEqual({ code: 'NUTRITION_EVALUATION_INVALID', issues: [{ code: 'FORM_RESPONSE_LINK_INVALID', path: 'links[0].formResponseId' }] });
    for (const x of cuerpos.slice(1)) expect(x).toEqual(cuerpos[0]);
    // Todos o ninguno: con uno inválido en el medio, no se vincula ni el válido.
    await vincular(c.pro.token, 'nutrition', c.evaluationId, [
      { formResponseId: c.formResponseId, expectedVersion: 'v1' },
      { formResponseId: respuestaAjena, expectedVersion: 'v1' },
    ]).expect(422);
    expect(await prisma.vinculoDeFormularioEnEvaluacion.count({ where: { evaluacionNutricionalId: { in: [c.evaluationId, evaluacionDeDos] } } })).toBe(0);
  });
});

// ─── 5. La privacidad ───────────────────────────────────────────────────────────────────────────

describe('DL-185 · 5. vincular no copia las respuestas a nada que lea otra persona', () => {
  it('TEST-EVF-018 · la evaluación no cambia de forma ni de contenido, y la persona no ve nada nuevo', async () => {
    const c = await conEvaluacion('privacidad');
    const antes = EvaluacionResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/nutrition/evaluations/${c.evaluationId}`).expect(200)).body).data;
    const bandejaAntes = (await fri(app, c.ase.token).bandeja().expect(200)).body;
    await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201);
    const despues = EvaluacionResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/nutrition/evaluations/${c.evaluationId}`).expect(200)).body).data;
    expect(despues).toEqual(antes);
    expect(JSON.stringify(despues)).not.toContain('6 vasos');
    expect((await fri(app, c.ase.token).bandeja().expect(200)).body).toEqual(bandejaAntes);
    // Lo único que se escribió es la referencia: ni el texto ni el valor de una respuesta.
    const filas = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM "vinculo_de_formulario_en_evaluacion" WHERE "respuesta_id" = '${c.formResponseId}'`);
    expect(Object.keys(filas[0]!).sort()).toEqual(['alcance', 'desvinculado_en', 'evaluacion_de_entrenamiento_id', 'evaluacion_nutricional_id', 'id', 'rectificacion_id', 'respuesta_id', 'vinculado_en']);
  });

  it('TEST-EVF-019 · hasta 20 vinculados por evaluación', async () => {
    const c = await conEvaluacion('tope');
    const respuestas = [c.formResponseId];
    for (let i = 0; i < 20; i++) {
      const s = await pedirV2(app, c.pro, c.ase.id, c.versionId, 'NUTRICION');
      respuestas.push((await fri(app, c.ase.token).responder(s, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201)).body.data.formResponseId as string);
    }
    await vincular(c.pro.token, 'nutrition', c.evaluationId, respuestas.slice(0, 20).map((formResponseId) => ({ formResponseId, expectedVersion: 'v1' }))).expect(201);
    const r = await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: respuestas[20]!, expectedVersion: 'v1' }]).expect(422);
    expect(r.body.error.details.issues).toEqual([{ code: 'TOO_MANY_LINKED_FORMS', path: 'links' }]);
  }, 180_000);
});

// ─── 6. La base ─────────────────────────────────────────────────────────────────────────────────

describe('DL-185 · 6. la base repite las reglas aunque el código se equivoque', () => {
  it('TEST-EVF-020 · la pertenencia, el área y el «nace vigente»', async () => {
    const c = await conEvaluacion('base');
    const otra = await conEvaluacion('base-otra');
    const tabla = '"vinculo_de_formulario_en_evaluacion"';
    const insertar = (columnas: Record<string, string | null>) => {
      const ks = Object.keys(columnas);
      return prisma.$executeRawUnsafe(`INSERT INTO ${tabla} (${ks.map((k) => `"${k}"`).join(',')}) VALUES (${ks.map((k) => (columnas[k] === null ? 'NULL' : `'${columnas[k]}'`)).join(',')})`);
    };
    // Una respuesta de otra persona.
    await expect(insertar({ alcance: 'NUTRICION', evaluacion_nutricional_id: c.evaluationId, respuesta_id: otra.formResponseId })).rejects.toThrow(/misma persona/);
    // La evaluación del área que no es, o las dos a la vez.
    await expect(insertar({ alcance: 'ENTRENAMIENTO', evaluacion_nutricional_id: c.evaluationId, respuesta_id: c.formResponseId })).rejects.toThrow(/alcance ENTRENAMIENTO/);
    await expect(insertar({ alcance: 'NUTRICION', evaluacion_nutricional_id: c.evaluationId, evaluacion_de_entrenamiento_id: randomUUID(), respuesta_id: c.formResponseId })).rejects.toThrow(/una_evaluacion_del_alcance/);
    // Nace vigente.
    await expect(insertar({ alcance: 'NUTRICION', evaluacion_nutricional_id: c.evaluationId, respuesta_id: c.formResponseId, desvinculado_en: '2026-11-19T12:00:00Z' })).rejects.toThrow(/nace vigente/);
    // Un solo vínculo vigente por respuesta.
    await insertar({ alcance: 'NUTRICION', evaluacion_nutricional_id: c.evaluationId, respuesta_id: c.formResponseId });
    await expect(insertar({ alcance: 'NUTRICION', evaluacion_nutricional_id: c.evaluationId, respuesta_id: c.formResponseId })).rejects.toThrow(/23505|already exists|vinculo_de_formulario_nutricional_vigente/);
  });

  it('TEST-EVF-021 · solo se desvincula, una vez; no se borra ni se trunca', async () => {
    const c = await conEvaluacion('solo-agregar');
    const v = FormulariosVinculadosResponseSchema.parse((await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201)).body).data.links[0]!;
    const tabla = '"vinculo_de_formulario_en_evaluacion"';
    await expect(prisma.$executeRawUnsafe(`UPDATE ${tabla} SET "vinculado_en" = now() - interval '1 day' WHERE "id" = '${v.linkId}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM ${tabla} WHERE "id" = '${v.linkId}'`)).rejects.toThrow(/append-only/);
    await prisma.$executeRawUnsafe(`UPDATE ${tabla} SET "desvinculado_en" = now() WHERE "id" = '${v.linkId}'`);
    await expect(prisma.$executeRawUnsafe(`UPDATE ${tabla} SET "desvinculado_en" = now() + interval '1 hour' WHERE "id" = '${v.linkId}'`)).rejects.toThrow(/append-only/);
  });
});

// ─── 7. En carrera (revisión del PR) ────────────────────────────────────────────────────────────

type RespuestaHttp = Awaited<ReturnType<typeof listar>>;

/**
 * Sin pausas (`soporte-concurrencia.ts`): una transacción de la prueba retiene la fila de la evaluación, dispara los pedidos
 * y los suelta recién cuando la base dice que todos esperan ese cerrojo (`pg_stat_activity`). Si las escrituras no tomaran
 * la fila de la evaluación, terminarían sin esperar y la prueba queda en rojo; sin el control dentro de la transacción, el
 * segundo chocaría con el índice parcial o con el trigger (500).
 */
async function enCarrera(area: Area, evaluationId: string, pedidos: (() => PromiseLike<RespuestaHttp>)[], que: string): Promise<RespuestaHttp[]> {
  let enCurso: Promise<RespuestaHttp>[] = [];
  let terminados = 0;
  await prisma.$transaction(
    async (tx) => {
      if (area === 'nutrition') await tx.$queryRaw`SELECT 1 FROM "evaluacion_nutricional" WHERE "id" = ${evaluationId}::uuid FOR UPDATE`;
      else await tx.$queryRaw`SELECT 1 FROM "evaluacion_de_entrenamiento" WHERE "id" = ${evaluationId}::uuid FOR UPDATE`;
      enCurso = pedidos.map((p) =>
        new Promise<RespuestaHttp>((resolver, rechazar) => {
          p().then(resolver, rechazar);
        }).finally(() => {
          terminados++;
        }),
      );
      // Sin `bloqueadoPor`: el segundo que espera una fila queda detrás del primero que la espera, no del que la tiene.
      await esperarQueEsperen(prisma, pedidos.length, { yaPaso: () => terminados > 0, que });
      expect(terminados).toBe(0);
    },
    { timeout: 40_000, maxWait: 10_000 },
  );
  return Promise.all(enCurso);
}

describe('DL-185 · 7. revisión del PR: en carrera, un solo vínculo vigente y un solo desvincular', () => {
  it.each<Area>(['nutrition', 'training'])('TEST-EVF-022 · %s: dos «vincular» del mismo formulario a la vez dejan uno (201 y 200); dos «desvincular», una sola fecha', async (area) => {
    const c = await conEvaluacion(`carrera-${area}`, area);
    const links = [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }];
    const vinculados = await enCarrera(
      area,
      c.evaluationId,
      [() => vincular(c.pro.token, area, c.evaluationId, links), () => vincular(c.pro.token, area, c.evaluationId, links)],
      'dos «vincular» esperando la evaluación',
    );
    expect(vinculados.map((r) => r.status).sort()).toEqual([200, 201]);
    const filas = await prisma.vinculoDeFormularioEnEvaluacion.findMany({ where: { respuestaId: c.formResponseId } });
    expect(filas).toHaveLength(1);
    const [uno, dos] = vinculados.map((r) => FormulariosVinculadosResponseSchema.parse(r.body).data.links);
    expect(uno).toEqual(dos);

    const linkId = filas[0]!.id;
    const desvinculados = await enCarrera(
      area,
      c.evaluationId,
      [() => desvincular(c.pro.token, area, c.evaluationId, linkId), () => desvincular(c.pro.token, area, c.evaluationId, linkId)],
      'dos «desvincular» esperando la evaluación',
    );
    expect(desvinculados.map((r) => r.status)).toEqual([200, 200]);
    for (const r of desvinculados) expect(FormulariosVinculadosResponseSchema.parse(r.body).data.links).toEqual([]);
    expect((await prisma.vinculoDeFormularioEnEvaluacion.findUniqueOrThrow({ where: { id: linkId } })).desvinculadoEn).not.toBeNull();
    expect(await prisma.vinculoDeFormularioEnEvaluacion.count({ where: { respuestaId: c.formResponseId, desvinculadoEn: null } })).toBe(0);
  });

  it('TEST-EVF-023 · «Vincular la más nueva» dos veces a la vez: la anterior se desvincula una vez y la nueva queda una vez', async () => {
    const c = await conEvaluacion('carrera-mas-nueva');
    await vincular(c.pro.token, 'nutrition', c.evaluationId, [{ formResponseId: c.formResponseId, expectedVersion: 'v1' }]).expect(201);
    await fri(app, c.ase.token).corregir(c.formResponseId, { expectedVersion: 'v1', reason: 'Tomo menos agua.', answers: conAgua(3) }).expect(201);
    const links = [{ formResponseId: c.formResponseId, expectedVersion: 'v2' }];
    const r = await enCarrera(
      'nutrition',
      c.evaluationId,
      [() => vincular(c.pro.token, 'nutrition', c.evaluationId, links), () => vincular(c.pro.token, 'nutrition', c.evaluationId, links)],
      'dos «vincular la más nueva» esperando la evaluación',
    );
    expect(r.map((x) => x.status).sort()).toEqual([200, 201]);
    const filas = await prisma.vinculoDeFormularioEnEvaluacion.findMany({ where: { respuestaId: c.formResponseId }, orderBy: { vinculadoEn: 'asc' } });
    expect(filas.map((f) => [f.rectificacionId === null, f.desvinculadoEn === null])).toEqual([
      [true, false],
      [false, true],
    ]);
  });
});
