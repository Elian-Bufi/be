/**
 * WP-FORMULARIOS-DE-INICIO (DEUDA_LEGAJO DL-164) · los oráculos TEST-FRI-001 a 006 del paquete, por la API real y contra
 * PostgreSQL, con una plantilla V2 sintética (`soporte-formularios-v2.ts`):
 * - 001 · las APK instaladas no ven lo nuevo: FRM-06 no lista la Solicitud V2; FRM-02, 05, 07 y 08 responden el 404 de
 *   lo inexistente; FRI-01 y FRI-02 sí la sirven, y FRI-01 traduce una versión de P0;
 * - 002 · lo oculto no se guarda: FORM_ANSWER_NOT_VISIBLE; el obligatorio oculto no se exige; una versión de P0
 *   respondida por FRI-04 se guarda en la forma V1 y FRM-05 la sigue leyendo; con una propuesta esperando sobre una
 *   versión de P0, FRM-06 la lista como no respondable y FRM-07 no la pisa (422); un número que la APK instalada guardó
 *   sin unidad (FRM-07) sale por FRI-03 con la de su campo;
 * - 003 · la propuesta no es del perfil: otro profesional con acceso no la ve; la persona la ve solo en su bandeja y en su
 *   vista; nada en sus respuestas; una sola pendiente, también entre dos cargas simultáneas;
 * - 004 · confirmar es responder: RESPONDED, SELF_REPORTED, la transcripción con quién cargó y qué corrigió; rectificar en V2;
 * - 005 · rechazar y retirar borran: ninguna respuesta propuesta queda en la base; la Solicitud sigue pendiente; al revocar
 *   el A3 las pendientes se retiran solas; rechazar no exige el A3; la novedad del rechazo solo si el profesional sigue
 *   autorizado;
 * - 006 · solo el profesional de la Solicitud carga: otro, uno con el vínculo en pausa o con el B2 revocado reciben el
 *   mismo 404; con la versión vieja, 409;
 * - y la carrera entre cargar la propuesta (FRI-06) y responder (FRI-04, FRM-07), ordenada por el cerrojo de la Solicitud
 *   (`cerrojo-de-solicitud.ts`): nunca quedan juntas una Respuesta y una propuesta pendiente. Sin pausas: la prueba retiene
 *   la fila y suelta cuando la base dice que los dos pedidos esperan (`soporte-concurrencia.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import {
  DetalleDeSolicitudResponseSchema,
  DetalleDeSolicitudV2ResponseSchema,
  ListaDeSolicitudesPropiasResponseSchema,
  ListaDeSolicitudesPropiasV2ResponseSchema,
  PropuestaCargadaResponseSchema,
  PropuestaResueltaResponseSchema,
  RespuestaCreadaResponseSchema,
  VersionDePlantillaV2ResponseSchema,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type request from 'supertest';
import { appDePrueba, conSesion, cuerpoDeCierre, resumenDeRespuestas, simultaneos } from './soporte-api';
import { conLaFilaRetenida, esperarQueEsperen } from './soporte-concurrencia';
import { CAMPOS_V2, circuitoV2, conAgua, fri, pedirV2, RESPUESTAS_V2, type CircuitoV2 } from './soporte-formularios-v2';
import { sembrarCopiaDeLaVersion, VERSION_HABITOS_V1 } from './soporte-plantillas-de-inicio';
import { a3Vigente, otorgarA3, pausar, prepararAsesorado, prepararProfesional, revocarB2, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';

const PLANTILLA_ENTRENAMIENTO = '67e4d0b3-cf4a-41e7-9d84-6864c5dde951';
/** «Antecedentes para entrenamiento» (P0): histórica desde FI-02 (la v2 es la vigente). FRI-01 sirve cualquier versión. */
const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
/**
 * FRM-HABITOS v1 (P0, transversal: horas de sueño NUMBER en h, nivel de actividad TEXT, fuma BOOLEAN), en una copia de
 * prueba: desde la ronda 2.1 (DL-165) la del catálogo es histórica y FRM-03 ya no la deja pedir. El contenido es el mismo.
 */
let VERSION_HABITOS: string;

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
  VERSION_HABITOS = (await sembrarCopiaDeLaVersion(prisma, VERSION_HABITOS_V1, 'fi-habitos')).versionId;
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

type Novedad = { kind: string; body: string; source: { identityId: string } | null; open: { view: string; referenceId: string | null } };
const novedadesDe = async (token: string): Promise<Novedad[]> => (await conSesion(app, token).get('/api/v1/me/news').expect(200)).body.data as Novedad[];
const vistaDe = async (token: string, formRequestId: string) => DetalleDeSolicitudV2ResponseSchema.parse((await fri(app, token).vista(formRequestId).expect(200)).body).data;
const bandejaDe = async (token: string) => ListaDeSolicitudesPropiasV2ResponseSchema.parse((await fri(app, token).bandeja().expect(200)).body).data;
const revocarA3 = async (token: string) => conSesion(app, token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, token)}/revoke`).send({}).expect(200);
/** Una Solicitud de FRM-HABITOS (P0): la APK instalada la responde por FRM-07 y FRM-06 la lista. */
async function pedirHabitos(c: CircuitoV2): Promise<string> {
  const r = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/form-requests`)
    .send({ templateVersionId: VERSION_HABITOS, purpose: 'Hábitos', scope: 'NUTRICION', requestedFieldCodes: ['horas_de_sueno', 'fuma'], requiredFieldCodes: ['horas_de_sueno'] })
    .expect(201);
  return r.body.data.formRequestId as string;
}

/** D-6: después de rechazar o retirar, ninguna propuesta de la Solicitud conserva respuestas. */
async function sinRespuestasPropuestas(formRequestId: string): Promise<void> {
  const filas = await prisma.propuestaDeRespuestaDeFormulario.findMany({ where: { solicitudId: formRequestId } });
  expect(filas.length).toBeGreaterThan(0);
  expect(filas.every((f) => f.contenido === null && f.estado !== 'PENDIENTE' && f.resueltaEn !== null)).toBe(true);
  expect(JSON.stringify(filas)).not.toContain('Milanesa');
}

describe('TEST-FRI-001 · las APK instaladas no ven lo nuevo (D-5; DL-152)', () => {
  it('FRM-06 no lista la Solicitud V2; FRM-02, 05, 07 y 08 responden el 404 de lo inexistente; FRI-01 y FRI-02 sí la sirven', async () => {
    const c = await circuitoV2(app, prisma, `t1-${++contador}`);
    const ase = conSesion(app, c.ase.token);
    const inexistente = await ase.get(`/api/v1/form-requests/${randomUUID()}`).expect(404);
    for (const consulta of ['', '?status=PENDING&limit=50']) {
      const propias = await ase.get(`/api/v1/me/form-requests${consulta}`).expect(200);
      expect(ListaDeSolicitudesPropiasResponseSchema.safeParse(propias.body).success).toBe(true);
      expect((propias.body.data as { formRequestId: string }[]).some((s) => s.formRequestId === c.formRequestId)).toBe(false);
    }
    expect((await ase.get(`/api/v1/form-requests/${c.formRequestId}`).expect(404)).body).toEqual(inexistente.body);
    expect((await ase.get(`/api/v1/form-templates/${c.plantillaId}/versions/${c.versionId}`).expect(404)).body).toEqual(inexistente.body);
    expect((await ase.post(`/api/v1/me/form-requests/${c.formRequestId}/responses`).send({ answers: [{ fieldCode: 'ini_agua', value: 6 }] }).expect(404)).body).toEqual(inexistente.body);
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    // Respondida por FRI-04, su respuesta tampoco se rectifica por FRM-08.
    const respondida = await fri(app, c.ase.token).responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201);
    const formResponseId = respondida.body.data.formResponseId as string;
    const rectificar = await ase.post(`/api/v1/me/form-responses/${formResponseId}/rectifications`).send({ expectedVersion: 'v1', reason: 'x', answers: [{ fieldCode: 'ini_agua', value: 7 }] }).expect(404);
    expect(rectificar.body).toEqual(inexistente.body);
    expect(await prisma.rectificacionDeRespuestaDeFormulario.count({ where: { respuestaId: formResponseId } })).toBe(0);
    // Lo que sí la sirve: FRI-01 (la definición en V2, con los tipos nuevos) y FRI-02 (la bandeja).
    const definicion = VersionDePlantillaV2ResponseSchema.parse((await fri(app, c.ase.token).definicion(c.plantillaId, c.versionId).expect(200)).body).data;
    expect(definicion).toMatchObject({ templateId: c.plantillaId, templateVersionId: c.versionId, format: 2, usesNewTypes: true, estimatedMinutes: 10, status: 'SELECTABLE', domain: 'NUTRICION' });
    expect(definicion.sections.flatMap((s) => s.fields.map((f) => f.fieldCode))).toEqual([...CAMPOS_V2]);
    expect(definicion.sections.flatMap((s) => s.fields.map((f) => f.dataType))).toEqual(expect.arrayContaining(['CHOICE', 'MULTI_CHOICE', 'LIST', 'FOODS', 'TIMES', 'NUMBER']));
    const bandeja = await bandejaDe(c.ase.token);
    expect(bandeja.find((s) => s.formRequestId === c.formRequestId)).toMatchObject({ usesNewTypes: true, estimatedMinutes: 10, status: 'RESPONDED', respondable: false, pendingProposal: null });
  });

  it('FRI-01 traduce una versión de P0: texto de varias líneas, número con sus límites, sí o no; sin tipos nuevos ni minutos', async () => {
    const persona = await prepararAsesorado(app, `t1b-${++contador}`, { a3: true });
    const definicion = VersionDePlantillaV2ResponseSchema.parse((await fri(app, persona.token).definicion(PLANTILLA_ENTRENAMIENTO, VERSION_ENTRENAMIENTO).expect(200)).body).data;
    expect(definicion).toMatchObject({ format: 2, usesNewTypes: false, estimatedMinutes: null, domain: 'ENTRENAMIENTO' });
    const campos = new Map(definicion.sections.flatMap((s) => s.fields).map((f) => [f.fieldCode, f]));
    expect(campos.get('trn_dias_por_semana')).toMatchObject({ dataType: 'NUMBER', unit: 'días por semana', limits: { minimum: 1, maximum: 7, integer: true }, showIf: null });
    expect(campos.get('trn_objetivo_declarado')).toMatchObject({ dataType: 'TEXT', multiline: true, maxLength: 2000 });
    await fri(app, persona.token).definicion(PLANTILLA_ENTRENAMIENTO, randomUUID()).expect(404);
  });
});

describe('TEST-FRI-002 · lo oculto no se guarda (D-2)', () => {
  it('responder una pregunta condicional cerrada es 422 FORM_ANSWER_NOT_VISIBLE sin escribir nada; el obligatorio oculto no se exige y la respuesta se guarda en formato 2', async () => {
    const c = await circuitoV2(app, prisma, `t2-${++contador}`);
    const f = fri(app, c.ase.token);
    const sinDiabetes = RESPUESTAS_V2.map((r) => (r.fieldCode === 'ini_condiciones' ? { fieldCode: r.fieldCode, answer: { type: 'MULTI_CHOICE' as const, options: ['hipertension'], otherText: null } } : r));
    const r = await f.responder(c.formRequestId, { answers: sinDiabetes, fromProposal: null }).expect(422);
    expect(r.body.error.code).toBe('FORM_RESPONSE_INVALID');
    const i = sinDiabetes.findIndex((x) => x.fieldCode === 'ini_diabetes_tipo');
    expect(r.body.error.details.issues).toEqual([{ code: 'FORM_ANSWER_NOT_VISIBLE', path: `answers[${i}].answer`, fieldCode: 'ini_diabetes_tipo' }]);
    expect(JSON.stringify(r.body.error.details)).not.toContain('tipo_2');
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    // Sin la pregunta oculta: aunque la Solicitud la pide como obligatoria, no se exige.
    const ok = await f.responder(c.formRequestId, { answers: sinDiabetes.filter((x) => x.fieldCode !== 'ini_diabetes_tipo'), fromProposal: null }).expect(201);
    expect(RespuestaCreadaResponseSchema.safeParse(ok.body).success).toBe(true);
    const fila = await prisma.respuestaDeFormulario.findUniqueOrThrow({ where: { solicitudId: c.formRequestId } });
    expect(fila.contenido).toMatchObject({ format: 2 });
    expect(fila.transcripcion).toBeNull();
    const vista = await vistaDe(c.ase.token, c.formRequestId);
    expect(vista.request.status).toBe('RESPONDED');
    expect(vista.respondable).toBe(false);
    expect(vista.response?.original.answers.map((a) => a.fieldCode)).not.toContain('ini_diabetes_tipo');
    expect(vista.response?.original.answers.every((a) => a.provenance === 'SELF_REPORTED')).toBe(true);
    expect(vista.response?.transcription).toBeNull();
    expect(vista.proposal).toBeNull();
  });

  it('una versión de P0 respondida por FRI-04 se guarda en la forma V1: FRM-05 (la APK instalada) la sigue leyendo, y FRI-03 la lee en V2; con una propuesta esperando, FRM-06 no la da por respondable y FRM-07 no la pisa', async () => {
    const c = await circuitoV2(app, prisma, `t2b-${++contador}`);
    const habitos = await pedirHabitos(c);
    const f = fri(app, c.ase.token);
    // Un tipo nuevo contra una versión de P0: la forma no coincide con el campo.
    const mal = await f.responder(habitos, { answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'CHOICE', option: 'ocho', otherText: null } }], fromProposal: null }).expect(422);
    expect(mal.body.error.details.issues).toEqual([{ code: 'FORM_ANSWER_TYPE_MISMATCH', path: 'answers[0].answer', fieldCode: 'horas_de_sueno' }]);
    const fuera = await f.responder(habitos, { answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 7, unit: 'h' } }, { fieldCode: 'nivel_de_actividad', answer: { type: 'TEXT', text: 'alto' } }], fromProposal: null }).expect(422);
    expect(fuera.body.error.details.issues).toEqual([{ code: 'FORM_ANSWER_NOT_REQUESTED', path: 'answers[1].answer', fieldCode: 'nivel_de_actividad' }]);
    // Sobre una versión de P0 también se carga una propuesta (FRI-06). La APK instalada no la conoce: FRM-06 la lista como
    // no respondable y FRM-07 no la pisa en silencio (422, nada se escribe) hasta que la persona la resuelve por FRI-04/08.
    const horas = { fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER' as const, number: 7, unit: 'h' } };
    const p = PropuestaCargadaResponseSchema.parse((await fri(app, c.pro.token).cargar(habitos, { expectedVersion: null, answers: [horas] }).expect(201)).body).data;
    const instalada = conSesion(app, c.ase.token);
    expect((await instalada.get('/api/v1/me/form-requests').expect(200)).body.data.find((s: { formRequestId: string }) => s.formRequestId === habitos)).toMatchObject({ status: 'PENDING', respondable: false });
    expect((await instalada.post(`/api/v1/me/form-requests/${habitos}/responses`).send({ answers: [{ fieldCode: 'horas_de_sueno', value: 8 }] }).expect(422)).body.error.code).toBe('FORM_REQUEST_NOT_RESPONDABLE');
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: habitos } })).toBe(0);
    // La persona confirma desde la app nueva y suma una respuesta: se guarda en la forma V1, con la transcripción.
    await f.responder(habitos, { answers: [horas, { fieldCode: 'fuma', answer: { type: 'BOOLEAN', yes: false } }], fromProposal: { proposalId: p.proposalId, expectedVersion: 'v1' } }).expect(201);
    const v1 = await instalada.get(`/api/v1/form-requests/${habitos}`).expect(200);
    expect(DetalleDeSolicitudResponseSchema.safeParse(v1.body).success).toBe(true);
    expect(v1.body.data.request.status).toBe('RESPONDED');
    expect(v1.body.data.response.original.answers).toEqual([
      { fieldCode: 'horas_de_sueno', value: 7, unit: 'h', profileSourceRef: null, provenance: 'SELF_REPORTED' },
      { fieldCode: 'fuma', value: false, unit: null, profileSourceRef: null, provenance: 'SELF_REPORTED' },
    ]);
    expect((await instalada.get('/api/v1/me/form-requests').expect(200)).body.data.find((s: { formRequestId: string }) => s.formRequestId === habitos)).toMatchObject({ status: 'RESPONDED', respondable: false });
    const v2 = await vistaDe(c.ase.token, habitos);
    expect(v2.request).toMatchObject({ usesNewTypes: false, estimatedMinutes: null, status: 'RESPONDED' });
    expect(v2.response?.original.answers).toEqual([
      { fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 7, unit: 'h' }, provenance: 'SELF_REPORTED' },
      { fieldCode: 'fuma', answer: { type: 'BOOLEAN', yes: false }, provenance: 'SELF_REPORTED' },
    ]);
    expect(v2.response?.transcription).toMatchObject({ professional: { identityId: c.pro.id }, loadedAt: p.loadedAt, correctedFieldCodes: ['fuma'] });
    expect(v2.proposal).toBeNull();
  });

  it('un número que la APK instalada respondió sin `unit` (FRM-07) se guarda así en V1 y sale por FRI-03 con la unidad de su campo', async () => {
    const c = await circuitoV2(app, prisma, `t2c-${++contador}`);
    const habitos = await pedirHabitos(c);
    const instalada = conSesion(app, c.ase.token);
    await instalada.post(`/api/v1/me/form-requests/${habitos}/responses`).send({ answers: [{ fieldCode: 'horas_de_sueno', value: 8 }, { fieldCode: 'fuma', value: true }] }).expect(201);
    // Lo guardado y lo que lee la APK instalada no cambian: la unidad quedó en null.
    expect((await instalada.get(`/api/v1/form-requests/${habitos}`).expect(200)).body.data.response.original.answers[0]).toEqual({ fieldCode: 'horas_de_sueno', value: 8, unit: null, profileSourceRef: null, provenance: 'SELF_REPORTED' });
    // FRI-03 la traduce con la unidad de la plantilla (horas de sueño en «h»), como hace la cita de la API.
    for (const token of [c.ase.token, c.pro.token]) {
      expect((await vistaDe(token, habitos)).response?.original.answers).toEqual([
        { fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 8, unit: 'h' }, provenance: 'SELF_REPORTED' },
        { fieldCode: 'fuma', answer: { type: 'BOOLEAN', yes: true }, provenance: 'SELF_REPORTED' },
      ]);
    }
  });
});

describe('TEST-FRI-003 · la propuesta no es del perfil (D-3)', () => {
  it('mientras espera, otro profesional con acceso no la ve (404 en FRI-03 y FRI-06); de la persona la ven su bandeja y su vista, nada en sus respuestas; una sola pendiente', async () => {
    const c = await circuitoV2(app, prisma, `t3-${++contador}`);
    const pro = fri(app, c.pro.token);
    const p = PropuestaCargadaResponseSchema.parse((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    expect(p.version).toBe('v1');
    // Otro profesional de Nutrición, vinculado y autorizado con la misma persona: el 404 de lo inexistente.
    const otro = await prepararProfesional(app, `t3-otro-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, otro, c.ase, 'NUTRICION');
    const deOtro = fri(app, otro.token);
    const inexistente = await deOtro.vista(randomUUID()).expect(404);
    expect((await deOtro.vista(c.formRequestId).expect(404)).body).toEqual(inexistente.body);
    expect((await deOtro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(404)).body).toEqual(inexistente.body);
    // Su propia Solicitud a la misma persona no trae nada de la propuesta ajena.
    const propia = await pedirV2(app, otro, c.ase.id, c.versionId, 'NUTRICION');
    expect(await vistaDe(otro.token, propia)).toMatchObject({ proposal: null, lastProposalOutcome: null, response: null });
    // La persona: en su bandeja el resumen (sin respuestas); en su vista, la propuesta completa; respuesta, ninguna.
    const bandeja = await bandejaDe(c.ase.token);
    expect(bandeja.find((s) => s.formRequestId === c.formRequestId)?.pendingProposal).toEqual({ proposalId: p.proposalId, professional: { identityId: c.pro.id, displayName: expect.any(String) }, loadedAt: p.loadedAt, version: 'v1' });
    expect(JSON.stringify(bandeja)).not.toContain('Milanesa');
    const vista = await vistaDe(c.ase.token, c.formRequestId);
    expect(vista.request.status).toBe('PENDING');
    expect(vista.respondable).toBe(true);
    expect(vista.response).toBeNull();
    expect(vista.proposal).toEqual({ proposalId: p.proposalId, formRequestId: c.formRequestId, professional: { identityId: c.pro.id, displayName: expect.any(String) }, answers: RESPUESTAS_V2, loadedAt: p.loadedAt, version: 'v1' });
    expect(vista.lastProposalOutcome).toBeNull();
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    // La novedad a la persona abre sus formularios en esa Solicitud; nunca lleva las respuestas.
    const aviso = (await novedadesDe(c.ase.token)).find((n) => n.kind === 'FORM_PROPOSAL_LOADED');
    expect(aviso).toMatchObject({ open: { view: 'FORMS', referenceId: c.formRequestId }, source: { identityId: c.pro.id } });
    expect(aviso?.body).not.toContain('Milanesa');
    // Reemplazar: con la versión que se vio; con una vieja, o sin versión habiendo una pendiente, 409.
    const reemplazada = PropuestaCargadaResponseSchema.parse((await pro.cargar(c.formRequestId, { expectedVersion: 'v1', answers: conAgua(5) }).expect(200)).body).data;
    expect(reemplazada).toMatchObject({ proposalId: p.proposalId, version: 'v2' });
    expect((await pro.cargar(c.formRequestId, { expectedVersion: 'v1', answers: conAgua(5) }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    expect((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: conAgua(5) }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    expect((await vistaDe(c.ase.token, c.formRequestId)).proposal?.answers.find((a) => a.fieldCode === 'ini_agua')?.answer).toEqual({ type: 'NUMBER', number: 5, unit: 'vasos' });
    expect((await novedadesDe(c.ase.token)).filter((n) => n.kind === 'FORM_PROPOSAL_LOADED')).toHaveLength(2);
  });

  it('una sola pendiente por Solicitud, también entre dos cargas simultáneas: la base deja pasar una', async () => {
    const c = await circuitoV2(app, prisma, `t3c-${++contador}`);
    const dos = await simultaneos(2, () => fri(app, c.pro.token).cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }));
    expect(resumenDeRespuestas(dos)).toEqual(['201', '409 VERSION_CONFLICT']);
    expect(await prisma.propuestaDeRespuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(1);
  });
});

describe('TEST-FRI-004 · confirmar es responder (D-4)', () => {
  it('la persona confirma con una corrección: RESPONDED, SELF_REPORTED, la transcripción dice quién cargó y qué corrigió; la propuesta queda confirmada sin sus respuestas', async () => {
    const c = await circuitoV2(app, prisma, `t4-${++contador}`);
    const pro = fri(app, c.pro.token);
    const ase = fri(app, c.ase.token);
    const p = PropuestaCargadaResponseSchema.parse((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    // Sin `fromProposal` habiendo una pendiente que no se vio, o con otra versión: 409, nada se pisa en silencio.
    expect((await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: { proposalId: p.proposalId, expectedVersion: 'v9' } }).expect(409);
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    const confirmada = await ase.responder(c.formRequestId, { answers: conAgua(8), fromProposal: { proposalId: p.proposalId, expectedVersion: 'v1' } }).expect(201);
    const creada = RespuestaCreadaResponseSchema.parse(confirmada.body).data;
    expect(creada.version).toBe('v1');

    const vista = await vistaDe(c.ase.token, c.formRequestId);
    expect(vista.request.status).toBe('RESPONDED');
    expect(vista.respondable).toBe(false);
    expect(vista.proposal).toBeNull();
    expect(vista.response?.transcription).toEqual({ professional: { identityId: c.pro.id, displayName: expect.any(String) }, loadedAt: p.loadedAt, confirmedAt: expect.any(String), correctedFieldCodes: ['ini_agua'] });
    expect(vista.response?.original.answers.find((a) => a.fieldCode === 'ini_agua')?.answer).toEqual({ type: 'NUMBER', number: 8, unit: 'vasos' });
    expect(vista.response?.original.answers.every((a) => a.provenance === 'SELF_REPORTED')).toBe(true);
    const propuesta = await prisma.propuestaDeRespuestaDeFormulario.findUniqueOrThrow({ where: { id: p.proposalId } });
    expect(propuesta).toMatchObject({ estado: 'CONFIRMADA', contenido: null, version: 1 });
    expect(propuesta.resueltaEn).not.toBeNull();
    const respuesta = await prisma.respuestaDeFormulario.findUniqueOrThrow({ where: { solicitudId: c.formRequestId } });
    expect(respuesta.transcripcion).toMatchObject({ professionalId: c.pro.id, proposalId: p.proposalId, correctedFieldCodes: ['ini_agua'] });
    expect(await bandejaDe(c.ase.token)).toEqual(expect.arrayContaining([expect.objectContaining({ formRequestId: c.formRequestId, status: 'RESPONDED', pendingProposal: null })]));

    // El profesional lee la misma forma, sin propuesta ni desenlace, y recibe la novedad; los hechos quedan en orden.
    const delPro = await vistaDe(c.pro.token, c.formRequestId);
    expect(delPro.response?.transcription?.correctedFieldCodes).toEqual(['ini_agua']);
    expect(delPro.proposal).toBeNull();
    expect(delPro.lastProposalOutcome).toBeNull();
    expect((await novedadesDe(c.pro.token)).find((n) => n.kind === 'FORM_PROPOSAL_CONFIRMED')).toMatchObject({ open: { view: 'ADVISEE', referenceId: c.ase.id }, source: { identityId: c.ase.id } });
    const hechos = await prisma.eventoDeFormulario.findMany({ where: { recursoId: { in: [p.proposalId, creada.formResponseId] } }, orderBy: { secuencia: 'asc' } });
    expect(hechos.map((e) => e.tipo)).toEqual(['PropuestaDeRespuestaCargada', 'RespuestaDeFormularioRegistrada', 'PropuestaDeRespuestaConfirmada']);

    // Ya respondida: ni confirmar de nuevo ni cargar otra propuesta.
    expect((await ase.responder(c.formRequestId, { answers: conAgua(8), fromProposal: { proposalId: p.proposalId, expectedVersion: 'v1' } }).expect(422)).body.error.code).toBe('FORM_REQUEST_NOT_RESPONDABLE');
    expect((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(422)).body.error.code).toBe('FORM_REQUEST_NOT_RESPONDABLE');

    // Rectificar en V2 (FRI-05): la original no se toca; con la versión vieja, 409; FRM-08 no la ve.
    const rect = await ase.corregir(creada.formResponseId, { expectedVersion: 'v1', reason: 'Tomo menos agua de lo que dije.', answers: RESPUESTAS_V2 }).expect(201);
    expect(rect.body.data.version).toBe('v2');
    await ase.corregir(creada.formResponseId, { expectedVersion: 'v1', reason: 'Vieja.', answers: RESPUESTAS_V2 }).expect(409);
    const despues = await vistaDe(c.ase.token, c.formRequestId);
    expect(despues.response).toMatchObject({ version: 'v2', effectiveView: { kind: 'RECTIFIED', rectificationId: rect.body.data.rectificationId } });
    expect(despues.response?.original.answers.find((a) => a.fieldCode === 'ini_agua')?.answer).toEqual({ type: 'NUMBER', number: 8, unit: 'vasos' });
    expect(despues.response?.rectifications[0]?.answers.find((a) => a.fieldCode === 'ini_agua')?.answer).toEqual({ type: 'NUMBER', number: 6, unit: 'vasos' });
    expect(despues.response?.transcription?.correctedFieldCodes).toEqual(['ini_agua']);
    await conSesion(app, c.ase.token).post(`/api/v1/me/form-responses/${creada.formResponseId}/rectifications`).send({ expectedVersion: 'v2', reason: 'x', answers: [{ fieldCode: 'ini_agua', value: 1 }] }).expect(404);
  });
});

describe('TEST-FRI-005 · rechazar y retirar borran (D-6)', () => {
  it('rechazar: no queda ninguna respuesta propuesta, la Solicitud sigue pendiente, el profesional ve el desenlace y recibe la novedad; puede cargar otra', async () => {
    const c = await circuitoV2(app, prisma, `t5a-${++contador}`);
    const pro = fri(app, c.pro.token);
    const ase = fri(app, c.ase.token);
    const p = PropuestaCargadaResponseSchema.parse((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    await ase.rechazar(c.formRequestId, { expectedVersion: 'v2' }).expect(409);
    const r = await ase.rechazar(c.formRequestId, { expectedVersion: 'v1' }).expect(200);
    const resuelta = PropuestaResueltaResponseSchema.parse(r.body).data;
    expect(resuelta).toMatchObject({ proposalId: p.proposalId, outcome: 'REJECTED' });
    await ase.rechazar(c.formRequestId, { expectedVersion: 'v1' }).expect(409);
    await sinRespuestasPropuestas(c.formRequestId);
    expect(await vistaDe(c.ase.token, c.formRequestId)).toMatchObject({ request: { status: 'PENDING' }, respondable: true, response: null, proposal: null, lastProposalOutcome: null });
    expect((await bandejaDe(c.ase.token)).find((s) => s.formRequestId === c.formRequestId)).toMatchObject({ status: 'PENDING', respondable: true, pendingProposal: null });
    expect((await vistaDe(c.pro.token, c.formRequestId)).lastProposalOutcome).toEqual({ outcome: 'REJECTED', loadedAt: p.loadedAt, resolvedAt: resuelta.resolvedAt });
    expect((await novedadesDe(c.pro.token)).find((n) => n.kind === 'FORM_PROPOSAL_REJECTED')).toMatchObject({ open: { view: 'ADVISEE', referenceId: c.ase.id }, source: { identityId: c.ase.id } });
    // Otra propuesta, desde cero: el desenlace de la anterior deja de mostrarse.
    const otra = PropuestaCargadaResponseSchema.parse((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    expect(otra.proposalId).not.toBe(p.proposalId);
    expect(otra.version).toBe('v1');
    expect(await vistaDe(c.pro.token, c.formRequestId)).toMatchObject({ proposal: { proposalId: otra.proposalId }, lastProposalOutcome: null });
  });

  it('retirar: lo mismo del lado del profesional; después la persona responde sola, y confirmar lo retirado es 409', async () => {
    const c = await circuitoV2(app, prisma, `t5b-${++contador}`);
    const pro = fri(app, c.pro.token);
    const ase = fri(app, c.ase.token);
    const p = PropuestaCargadaResponseSchema.parse((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    await pro.retirar(c.formRequestId, { expectedVersion: 'v2' }).expect(409);
    const r = await pro.retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(200);
    expect(PropuestaResueltaResponseSchema.parse(r.body).data).toMatchObject({ proposalId: p.proposalId, outcome: 'WITHDRAWN' });
    await pro.retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(409);
    await sinRespuestasPropuestas(c.formRequestId);
    expect((await vistaDe(c.pro.token, c.formRequestId)).lastProposalOutcome).toMatchObject({ outcome: 'WITHDRAWN', loadedAt: p.loadedAt });
    expect(await vistaDe(c.ase.token, c.formRequestId)).toMatchObject({ request: { status: 'PENDING' }, respondable: true, proposal: null, lastProposalOutcome: null });
    expect((await bandejaDe(c.ase.token)).find((s) => s.formRequestId === c.formRequestId)?.pendingProposal).toBeNull();
    // Nadie recibe una novedad por retirar; la persona sí la había recibido al cargar.
    expect((await novedadesDe(c.ase.token)).filter((n) => n.kind === 'FORM_PROPOSAL_LOADED')).toHaveLength(1);
    await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: { proposalId: p.proposalId, expectedVersion: 'v1' } }).expect(409);
    await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201);
    const respuesta = await prisma.respuestaDeFormulario.findUniqueOrThrow({ where: { solicitudId: c.formRequestId } });
    expect(respuesta.transcripcion).toBeNull();
    expect((await vistaDe(c.pro.token, c.formRequestId)).response?.transcription).toBeNull();
  });

  it('revocar el A3 retira las pendientes de la persona en la misma transacción, con el evento a su nombre; rechazar no exige el A3 y sin autorización el profesional no recibe la novedad', async () => {
    const c = await circuitoV2(app, prisma, `t5c-${++contador}`);
    const pro = fri(app, c.pro.token);
    const ase = fri(app, c.ase.token);
    const p = PropuestaCargadaResponseSchema.parse((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    // La persona revoca su A3: la propuesta queda RETIRADA y sin respuestas, con el retiro a nombre de ella y por API-CON-08.
    const revocacion = await revocarA3(c.ase.token);
    await sinRespuestasPropuestas(c.formRequestId);
    const retirada = await prisma.propuestaDeRespuestaDeFormulario.findUniqueOrThrow({ where: { id: p.proposalId } });
    expect(retirada).toMatchObject({ estado: 'RETIRADA', contenido: null, version: 1 });
    expect(retirada.resueltaEn?.toISOString()).toBe(revocacion.body.data.revokedAt);
    const hechos = await prisma.eventoDeFormulario.findMany({ where: { recursoId: p.proposalId }, orderBy: { secuencia: 'asc' } });
    expect(hechos.map((e) => [e.tipo, e.actorId, (e.procedencia as { operacion: string }).operacion])).toEqual([
      ['PropuestaDeRespuestaCargada', c.pro.id, 'API-FRI-06'],
      ['PropuestaDeRespuestaRetirada', c.ase.id, 'API-CON-08'],
    ]);
    // Nadie recibe una novedad por el retiro; sin el A3, el profesional tampoco lee la Solicitud (404) ni carga otra.
    expect((await novedadesDe(c.pro.token)).filter((n) => n.kind.startsWith('FORM_PROPOSAL_'))).toEqual([]);
    const inexistente = await pro.vista(randomUUID()).expect(404);
    expect((await pro.vista(c.formRequestId).expect(404)).body).toEqual(inexistente.body);
    expect((await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(404)).body).toEqual(inexistente.body);
    // Rechazar sin A3: no es 403; sin una pendiente, 409. Y si igual quedara una pendiente (escrita directo en la base), la
    // persona la descarta sin A3, sin novedad para el profesional, que hoy no está autorizado.
    expect((await ase.rechazar(c.formRequestId, { expectedVersion: 'v1' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    const directa = await prisma.propuestaDeRespuestaDeFormulario.create({
      data: { solicitudId: c.formRequestId, profesionalId: c.pro.id, contenido: { format: 2, answers: [{ fieldCode: 'ini_agua', answer: { type: 'NUMBER', number: 2, unit: 'vasos' } }] }, procedencia: { fuente: 'PRUEBA' } },
    });
    const r = PropuestaResueltaResponseSchema.parse((await ase.rechazar(c.formRequestId, { expectedVersion: 'v1' }).expect(200)).body).data;
    expect(r).toMatchObject({ proposalId: directa.id, outcome: 'REJECTED' });
    await sinRespuestasPropuestas(c.formRequestId);
    expect(await prisma.propuestaDeRespuestaDeFormulario.findUniqueOrThrow({ where: { id: directa.id } })).toMatchObject({ estado: 'RECHAZADA', contenido: null });
    expect((await novedadesDe(c.pro.token)).filter((n) => n.kind === 'FORM_PROPOSAL_REJECTED')).toEqual([]);
    // Con un A3 nuevo, el profesional vuelve a leer: el desenlace de su última propuesta es el rechazo; la Solicitud sigue pendiente.
    await otorgarA3(app, c.ase.token).expect(201);
    expect(await vistaDe(c.pro.token, c.formRequestId)).toMatchObject({ request: { status: 'PENDING' }, proposal: null, lastProposalOutcome: { outcome: 'REJECTED', resolvedAt: r.resolvedAt } });
    expect(await vistaDe(c.ase.token, c.formRequestId)).toMatchObject({ request: { status: 'PENDING' }, respondable: true, proposal: null });
  });

  it('la novedad del rechazo llega solo si el profesional sigue autorizado sobre el Alcance: con el vínculo en pausa no se le avisa, y el rechazo y el borrado son iguales', async () => {
    const c = await circuitoV2(app, prisma, `t5d-${++contador}`);
    const p = PropuestaCargadaResponseSchema.parse((await fri(app, c.pro.token).cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    await pausar(app, c.ase.token, c.vinculoId, await versionDeVinculo(app, c.ase.token, c.vinculoId)).expect(200);
    const r = PropuestaResueltaResponseSchema.parse((await fri(app, c.ase.token).rechazar(c.formRequestId, { expectedVersion: 'v1' }).expect(200)).body).data;
    expect(r).toMatchObject({ proposalId: p.proposalId, outcome: 'REJECTED' });
    await sinRespuestasPropuestas(c.formRequestId);
    expect((await novedadesDe(c.pro.token)).filter((n) => n.kind === 'FORM_PROPOSAL_REJECTED')).toEqual([]);
    expect(await prisma.eventoDeFormulario.count({ where: { recursoId: p.proposalId, tipo: 'PropuestaDeRespuestaRechazada', actorId: c.ase.id } })).toBe(1);
  });

  it('cerrar la cuenta retira las pendientes de la persona en la misma transacción: sin respuestas propuestas, con el retiro a su nombre y por el cierre', async () => {
    const c = await circuitoV2(app, prisma, `t5e-${++contador}`);
    const p = PropuestaCargadaResponseSchema.parse((await fri(app, c.pro.token).cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body).data;
    await conSesion(app, c.ase.token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(201);
    await sinRespuestasPropuestas(c.formRequestId);
    expect(await prisma.propuestaDeRespuestaDeFormulario.findUniqueOrThrow({ where: { id: p.proposalId } })).toMatchObject({ estado: 'RETIRADA', contenido: null });
    const hechos = await prisma.eventoDeFormulario.findMany({ where: { recursoId: p.proposalId }, orderBy: { secuencia: 'asc' } });
    expect(hechos.map((e) => [e.tipo, e.actorId, (e.procedencia as { operacion: string }).operacion])).toEqual([
      ['PropuestaDeRespuestaCargada', c.pro.id, 'API-FRI-06'],
      ['PropuestaDeRespuestaRetirada', c.ase.id, 'API-ACC-P1-03'],
    ]);
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
  });
});

describe('La carrera entre cargar la propuesta (FRI-06) y responder (FRI-04, FRM-07): el cerrojo de la Solicitud las pone en fila', () => {
  /** Dispara el pedido ya (supertest es perezoso) y devuelve su promesa. */
  const disparar = (t: request.Test): Promise<request.Response> => t.then((r) => r);
  const estadoDe = (r: request.Response): string => (r.status >= 400 ? `${r.status} ${r.body?.error?.code ?? ''}` : String(r.status));
  /** Lo que quedó en la base: cuántas Respuestas y cuántas propuestas, por estado. */
  async function enLaBase(formRequestId: string): Promise<{ respuestas: number; propuestas: string[] }> {
    return {
      respuestas: await prisma.respuestaDeFormulario.count({ where: { solicitudId: formRequestId } }),
      propuestas: (await prisma.propuestaDeRespuestaDeFormulario.findMany({ where: { solicitudId: formRequestId }, select: { estado: true } })).map((p) => p.estado).sort(),
    };
  }
  /**
   * Con la fila de la Solicitud retenida por la prueba, llegan los dos pedidos y quedan esperando en orden; al soltar, el
   * primero sigue primero y el segundo relee lo que el primero dejó.
   */
  async function enFila(formRequestId: string, primero: () => request.Test, segundo: () => request.Test): Promise<[string, string]> {
    const [p1, p2] = await conLaFilaRetenida(prisma, { solicitudDeFormulario: formRequestId }, async () => {
      const p1 = disparar(primero());
      await esperarQueEsperen(prisma, 1, { que: 'el primer pedido, esperando la Solicitud' });
      const p2 = disparar(segundo());
      await esperarQueEsperen(prisma, 2, { que: 'los dos pedidos esperando la Solicitud' });
      return [p1, p2] as const;
    });
    const [r1, r2] = await Promise.all([p1, p2]);
    return [estadoDe(r1), estadoDe(r2)];
  }

  it('cargar primero: la propuesta entra y responder sin `fromProposal` es 409 (hay una pendiente que no se vio)', async () => {
    const c = await circuitoV2(app, prisma, `carrera-a-${++contador}`);
    const resultado = await enFila(
      c.formRequestId,
      () => fri(app, c.pro.token).cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }),
      () => fri(app, c.ase.token).responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }),
    );
    expect(resultado).toEqual(['201', '409 VERSION_CONFLICT']);
    expect(await enLaBase(c.formRequestId)).toEqual({ respuestas: 0, propuestas: ['PENDIENTE'] });
  });

  it('responder primero: la Respuesta entra y cargar es 422 (respondida: no hay nada que confirmar)', async () => {
    const c = await circuitoV2(app, prisma, `carrera-b-${++contador}`);
    const resultado = await enFila(
      c.formRequestId,
      () => fri(app, c.ase.token).responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }),
      () => fri(app, c.pro.token).cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }),
    );
    expect(resultado).toEqual(['201', '422 FORM_REQUEST_NOT_RESPONDABLE']);
    expect(await enLaBase(c.formRequestId)).toEqual({ respuestas: 1, propuestas: [] });
  });

  it('sobre una versión de P0, con la APK instalada (FRM-07): cargar primero deja la Solicitud no respondable para ella (422); responder primero deja a cargar en 422', async () => {
    const c = await circuitoV2(app, prisma, `carrera-c-${++contador}`);
    const instalada = conSesion(app, c.ase.token);
    const horas = { fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER' as const, number: 7, unit: 'h' } };
    const porFrm07 = (formRequestId: string) => instalada.post(`/api/v1/me/form-requests/${formRequestId}/responses`).send({ answers: [{ fieldCode: 'horas_de_sueno', value: 8 }] });
    const habitos = await pedirHabitos(c);
    expect(await enFila(habitos, () => fri(app, c.pro.token).cargar(habitos, { expectedVersion: null, answers: [horas] }), () => porFrm07(habitos))).toEqual(['201', '422 FORM_REQUEST_NOT_RESPONDABLE']);
    expect(await enLaBase(habitos)).toEqual({ respuestas: 0, propuestas: ['PENDIENTE'] });
    const otra = await pedirHabitos(c);
    expect(await enFila(otra, () => porFrm07(otra), () => fri(app, c.pro.token).cargar(otra, { expectedVersion: null, answers: [horas] }))).toEqual(['201', '422 FORM_REQUEST_NOT_RESPONDABLE']);
    expect(await enLaBase(otra)).toEqual({ respuestas: 1, propuestas: [] });
  });
});

describe('TEST-FRI-006 · solo el profesional de la Solicitud carga', () => {
  it('otro profesional, uno con el vínculo en pausa y uno con el B2 revocado reciben el mismo 404 que lo inexistente, sin escribir nada', async () => {
    const c = await circuitoV2(app, prisma, `t6-${++contador}`);
    const pro = fri(app, c.pro.token);
    const cuerpo = { expectedVersion: null, answers: RESPUESTAS_V2 };
    const inexistente = await pro.cargar(randomUUID(), cuerpo).expect(404);
    const otro = await prepararProfesional(app, `t6-otro-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, otro, c.ase, 'NUTRICION');
    expect((await fri(app, otro.token).cargar(c.formRequestId, cuerpo).expect(404)).body).toEqual(inexistente.body);
    expect((await fri(app, otro.token).retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(404)).body).toEqual(inexistente.body);
    // Con el vínculo en pausa (por la persona), el profesional de la Solicitud recibe el mismo 404.
    await pausar(app, c.ase.token, c.vinculoId, await versionDeVinculo(app, c.ase.token, c.vinculoId)).expect(200);
    expect((await pro.cargar(c.formRequestId, cuerpo).expect(404)).body).toEqual(inexistente.body);
    expect(await prisma.propuestaDeRespuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    // Con el B2 revocado, lo mismo.
    const c2 = await circuitoV2(app, prisma, `t6b-${++contador}`);
    await revocarB2(app, c2.ase, c2.consentId).expect(200);
    expect((await fri(app, c2.pro.token).cargar(c2.formRequestId, cuerpo).expect(404)).body).toEqual(inexistente.body);
    expect(await prisma.propuestaDeRespuestaDeFormulario.count({ where: { solicitudId: c2.formRequestId } })).toBe(0);
  });

  it('con la versión vieja, 409 VERSION_CONFLICT; lo que no tiene la forma del formulario, 422 con un issue por problema; un solo opcional alcanza (los obligatorios los completa la persona)', async () => {
    const c = await circuitoV2(app, prisma, `t6c-${++contador}`);
    const pro = fri(app, c.pro.token);
    await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201);
    await pro.cargar(c.formRequestId, { expectedVersion: 'v1', answers: RESPUESTAS_V2 }).expect(200);
    expect((await pro.cargar(c.formRequestId, { expectedVersion: 'v1', answers: RESPUESTAS_V2 }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    expect((await pro.retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    const invalida = await pro.cargar(c.formRequestId, { expectedVersion: 'v2', answers: [{ fieldCode: 'ini_jornada', answer: { type: 'CHOICE', option: 'inventada', otherText: null } }, { fieldCode: 'ini_agua', answer: { type: 'NUMBER', number: 99, unit: 'vasos' } }] }).expect(422);
    expect(invalida.body.error.code).toBe('FORM_RESPONSE_INVALID');
    expect(invalida.body.error.details.issues).toEqual([
      { code: 'FORM_ANSWER_UNKNOWN_OPTION', path: 'answers[0].answer', fieldCode: 'ini_jornada' },
      { code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[1].answer', fieldCode: 'ini_agua' },
    ]);
    expect(JSON.stringify(invalida.body.error.details)).not.toContain('inventada');
    const solaUna = await pro.cargar(c.formRequestId, { expectedVersion: 'v2', answers: [{ fieldCode: 'ini_agua', answer: { type: 'NUMBER', number: 4, unit: 'vasos' } }] }).expect(200);
    expect(solaUna.body.data.version).toBe('v3');
    expect((await vistaDe(c.ase.token, c.formRequestId)).proposal?.answers).toEqual([{ fieldCode: 'ini_agua', answer: { type: 'NUMBER', number: 4, unit: 'vasos' } }]);
  });
});
