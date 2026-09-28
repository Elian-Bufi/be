/**
 * DL-104 (opción A) · un número fuera de lo que admite la plantilla se rechaza diciendo qué campo corregir y qué
 * valores admite, al responder (API-FRM-07) y al rectificar (API-FRM-08), por la API real y contra PostgreSQL.
 * - un issue por campo, todos a la vez, dentro de `error.details` (compatible con la APK 0.11.3), sin el valor enviado;
 * - el rechazo no escribe nada, y el envío corregido se registra (también con la misma clave: un error no se guarda);
 * - un rechazo de datos sin límites de por medio (otro tipo, falta un requerido) sigue siendo el mismo 422, sin detalle;
 * - las respuestas exitosas de FRM no cambian: validan contra los esquemas estrictos que usa la APK instalada.
 */
import type { INestApplication } from '@nestjs/common';
import {
  DetalleDeRespuestaFueraDeLimitesSchema,
  DetalleDeSolicitudResponseSchema,
  ErrorEnvelopeSchema,
  ListaDeSolicitudesPropiasResponseSchema,
  RectificacionCreadaResponseSchema,
  RespuestaCreadaResponseSchema,
  VersionDePlantillaResponseSchema,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

const PLANTILLA_ENTRENAMIENTO = '67e4d0b3-cf4a-41e7-9d84-6864c5dde951';
const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];
const DIAS = { minimum: 1, maximum: 7, integer: true };
const MINUTOS = { minimum: 1, maximum: 600, integer: true };

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

/** Días y minutos van en las posiciones 2 y 3 de `answers`: los issues apuntan ahí. */
const respuestas = (dias: unknown, minutos: unknown) => ({
  answers: [
    { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme' },
    { fieldCode: 'trn_experiencia', value: 'Caminatas; nada de fuerza en el último año' },
    { fieldCode: 'trn_dias_por_semana', value: dias },
    { fieldCode: 'trn_minutos_por_sesion', value: minutos },
    { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa, con mancuernas livianas' },
  ],
});

interface Escenario {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly formRequestId: string;
  readonly responder: string;
}
/** Un profesional de ENTRENAMIENTO pide «Antecedentes para entrenamiento» a un asesorado con A3, vínculo y B2. */
async function escenario(): Promise<Escenario> {
  const n = ++contador;
  const pro = await prepararProfesional(app, `dl104-${n}`, ['ENTRENAMIENTO']);
  const ase = await prepararAsesorado(app, `dl104-${n}`, { a3: true });
  await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
  const s = await conSesion(app, pro.token)
    .post(`/api/v1/advisees/${ase.id}/form-requests`)
    .send({ templateVersionId: VERSION_ENTRENAMIENTO, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) })
    .expect(201);
  const formRequestId = s.body.data.formRequestId as string;
  return { pro, ase, formRequestId, responder: `/api/v1/me/form-requests/${formRequestId}/responses` };
}

/**
 * El cuerpo de un 422 tiene que ser un ErrorEnvelope válido (lo que lee el cliente de la APK) y su detalle, el del
 * contrato. Devuelve los issues **tal como llegaron**, no los que deja el esquema: así una clave de más (por ejemplo,
 * el valor enviado) hace fallar la comparación exacta.
 */
function issuesDe(cuerpo: unknown): unknown[] {
  const e = ErrorEnvelopeSchema.parse(cuerpo);
  expect(e.error.code).toBe('FORM_RESPONSE_INVALID');
  DetalleDeRespuestaFueraDeLimitesSchema.parse(e.error.details);
  return (e.error.details as { issues: unknown[] }).issues;
}

async function sinRespuesta(e: Escenario): Promise<void> {
  const d = await conSesion(app, e.ase.token).get(`/api/v1/form-requests/${e.formRequestId}`).expect(200);
  expect(d.body.data.request.status).toBe('PENDING');
  expect(d.body.data.response).toBeNull();
  expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: e.formRequestId } })).toBe(0);
}

describe('DL-104 · responder (API-FRM-07)', () => {
  it('días 9 y minutos 45,5 a la vez: un 422 con un issue por campo, con los límites y sin el valor enviado; no se escribe nada', async () => {
    const e = await escenario();
    const r = await conSesion(app, e.ase.token).post(e.responder).send(respuestas(9, 45.5)).expect(422);
    expect(issuesDe(r.body)).toEqual([
      { code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[2].value', fieldCode: 'trn_dias_por_semana', limits: DIAS },
      { code: 'FORM_ANSWER_NOT_INTEGER', path: 'answers[3].value', fieldCode: 'trn_minutos_por_sesion', limits: MINUTOS },
    ]);
    // El detalle no repite lo que la persona escribió (09 v0.16.1:204: details sin internals).
    expect(JSON.stringify(r.body.error.details)).not.toContain('45.5');
    expect(Object.keys(r.body)).toEqual(['error']);
    expect(Object.keys(r.body.error).sort()).toEqual(['code', 'details', 'message']);
    await sinRespuesta(e);
  });

  it('cada límite tiene su código: 0 por debajo del mínimo, 2,5 con decimales, 601 minutos por encima del máximo', async () => {
    const e = await escenario();
    const s = conSesion(app, e.ase.token);
    const casos: [unknown, unknown, unknown[]][] = [
      [0, 45, [{ code: 'FORM_ANSWER_BELOW_MINIMUM', path: 'answers[2].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }]],
      [-1, 45, [{ code: 'FORM_ANSWER_BELOW_MINIMUM', path: 'answers[2].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }]],
      [2.5, 45, [{ code: 'FORM_ANSWER_NOT_INTEGER', path: 'answers[2].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }]],
      [3, 0, [{ code: 'FORM_ANSWER_BELOW_MINIMUM', path: 'answers[3].value', fieldCode: 'trn_minutos_por_sesion', limits: MINUTOS }]],
      [3, 601, [{ code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[3].value', fieldCode: 'trn_minutos_por_sesion', limits: MINUTOS }]],
    ];
    for (const [dias, minutos, esperados] of casos) {
      const r = await s.post(e.responder).send(respuestas(dias, minutos)).expect(422);
      expect(issuesDe(r.body)).toEqual(esperados);
    }
    await sinRespuesta(e);
  });

  it('corregido el valor, se registra; y la misma clave del rechazo también sirve, porque un error no queda guardado', async () => {
    const e = await escenario();
    const s = conSesion(app, e.ase.token);
    const clave = `dl104-${randomUUID()}`;
    await s.post(e.responder, clave).send(respuestas(9, 45)).expect(422);
    // La APK renueva la clave después de un rechazo definitivo; aun reusándola, el envío corregido se procesa.
    const ok = await s.post(e.responder, clave).send(respuestas(4, 45)).expect(201);
    expect(RespuestaCreadaResponseSchema.safeParse(ok.body).success).toBe(true);
    // Repetir el éxito con su clave devuelve lo mismo, sin registrar dos veces.
    const replay = await s.post(e.responder, clave).send(respuestas(4, 45)).expect(201);
    expect(replay.body).toEqual(ok.body);
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: e.formRequestId } })).toBe(1);
  });

  it('respaldo: un rechazo de datos sin límites de por medio sigue siendo el mismo 422, sin detalle (la APK dice que un dato no se aceptó)', async () => {
    const e = await escenario();
    const s = conSesion(app, e.ase.token);
    const otroTipo = await s.post(e.responder).send(respuestas('tres', 45)).expect(422);
    const faltaRequerido = await s.post(e.responder).send({ answers: respuestas(3, 45).answers.slice(0, 4) }).expect(422);
    for (const r of [otroTipo, faltaRequerido]) {
      const env = ErrorEnvelopeSchema.parse(r.body);
      expect(env.error.code).toBe('FORM_RESPONSE_INVALID');
      expect(env.error.details).toBeUndefined();
    }
    await sinRespuesta(e);
  });
});

describe('DL-104 · rectificar (API-FRM-08)', () => {
  it('8 días al rectificar: 422 con el issue del campo; la respuesta sigue en v1; con 4 se registra la v2', async () => {
    const e = await escenario();
    const s = conSesion(app, e.ase.token);
    const respondida = await s.post(e.responder).send(respuestas(3, 45)).expect(201);
    const formResponseId = respondida.body.data.formResponseId as string;
    const rectificar = `/api/v1/me/form-responses/${formResponseId}/rectifications`;
    const r = await s.post(rectificar).send({ expectedVersion: 'v1', reason: 'Tengo un día más.', ...respuestas(8, 45) }).expect(422);
    expect(issuesDe(r.body)).toEqual([{ code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[2].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }]);
    const antes = await s.get(`/api/v1/form-requests/${e.formRequestId}`).expect(200);
    expect(antes.body.data.response.version).toBe('v1');
    expect(antes.body.data.response.rectifications).toEqual([]);
    const ok = await s.post(rectificar).send({ expectedVersion: 'v1', reason: 'Tengo un día más.', ...respuestas(4, 45) }).expect(201);
    expect(RectificacionCreadaResponseSchema.safeParse(ok.body).success).toBe(true);
    expect(ok.body.data.version).toBe('v2');
  });

  it('con una versión vieja, el conflicto se informa antes que los límites: 409 VERSION_CONFLICT, no 422', async () => {
    const e = await escenario();
    const s = conSesion(app, e.ase.token);
    const respondida = await s.post(e.responder).send(respuestas(3, 45)).expect(201);
    const rectificar = `/api/v1/me/form-responses/${respondida.body.data.formResponseId}/rectifications`;
    await s.post(rectificar).send({ expectedVersion: 'v1', reason: 'Primer ajuste.', ...respuestas(4, 45) }).expect(201);
    const r = await s.post(rectificar).send({ expectedVersion: 'v1', reason: 'Otro ajuste.', ...respuestas(9, 45) }).expect(409);
    expect(r.body.error.code).toBe('VERSION_CONFLICT');
  });
});

describe('DL-104 · compatibilidad con la APK 0.11.3', () => {
  it('las respuestas exitosas de FRM-02, 05, 06, 07 y 08 validan contra los esquemas estrictos que usa la APK: DL-104 no les agrega nada', async () => {
    const e = await escenario();
    const s = conSesion(app, e.ase.token);
    const plantilla = await s.get(`/api/v1/form-templates/${PLANTILLA_ENTRENAMIENTO}/versions/${VERSION_ENTRENAMIENTO}`).expect(200);
    expect(VersionDePlantillaResponseSchema.safeParse(plantilla.body).success).toBe(true);
    expect(JSON.stringify(plantilla.body)).not.toContain('numberLimits');
    const propias = await s.get('/api/v1/me/form-requests').expect(200);
    expect(ListaDeSolicitudesPropiasResponseSchema.safeParse(propias.body).success).toBe(true);
    await s.post(e.responder).send(respuestas(9, 45)).expect(422);
    const creada = await s.post(e.responder).send(respuestas(3, 45)).expect(201);
    expect(RespuestaCreadaResponseSchema.safeParse(creada.body).success).toBe(true);
    const rect = await s
      .post(`/api/v1/me/form-responses/${creada.body.data.formResponseId}/rectifications`)
      .send({ expectedVersion: 'v1', reason: 'Ajuste.', ...respuestas(4, 60) })
      .expect(201);
    expect(RectificacionCreadaResponseSchema.safeParse(rect.body).success).toBe(true);
    const detalle = await s.get(`/api/v1/form-requests/${e.formRequestId}`).expect(200);
    expect(DetalleDeSolicitudResponseSchema.safeParse(detalle.body).success).toBe(true);
  });
});
