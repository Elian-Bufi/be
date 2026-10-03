/**
 * DL-115 · el A3 del titular en antropometría y formularios (08:406; 09v16.1 §36), por la API real y contra PostgreSQL.
 * Es la prueba PE-01 de la matriz de DV-05 (TEST-AUTH-004 y la variante del titular de TEST-AUTH-003):
 * - revocado o nunca otorgado el A3, lo propio deja de leerse y de registrarse con `403 ACTION_FORBIDDEN`. Se prueba el
 *   acceso directo, sin la APK: por `/me` y por la ruta del profesional con el propio id;
 * - el A3 es del titular: lo ajeno y lo inexistente siguen dando el mismo 404 de siempre, y sobre lo propio el A3 va
 *   antes que cualquier otra regla de la operación (por ejemplo, «ya respondida»);
 * - lo que el contrato permite sigue: la lista de solicitudes propias (FRM-06), sin respuestas y sin poder responder;
 * - los datos cargados antes no se borran: con un A3 nuevo vuelven idénticos (la revocación es prospectiva, 08 §13).
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoAntropometrico, type CircuitoAntropometrico } from './soporte-antropometria';
import { circuitoDeEntrenamiento, type CircuitoDeEntrenamiento } from './soporte-entrenamiento';
import { a3Vigente, otorgarA3, prepararAsesorado, type Parte } from './soporte-vinculo';

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

const revocarA3 = async (ase: Parte) => {
  const a3 = await a3Vigente(app, ase.token);
  await conSesion(app, ase.token).post(`/api/v1/me/health-data-consents/${a3}/revoke`).send({}).expect(200);
};
const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const periodo = () => `periodStart=${haceDias(20).slice(0, 10)}&periodEnd=${new Date().toISOString().slice(0, 10)}`;

// ─── Antropometría ──────────────────────────────────────────────────────────────────────────────

async function conUnaToma(): Promise<CircuitoAntropometrico> {
  const c = await circuitoAntropometrico(app, prisma, `a3-ant-${++contador}`);
  const borrador = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
    .send({
      occurredAt: haceDias(3),
      specificationVersionId: c.protocoloVersionId,
      source: { type: 'DIRECT_CAPTURE' },
      directMeasurements: [
        { metricCode: 'peso', value: 72.5, unit: 'kg' },
        { metricCode: 'talla', value: 1.75, unit: 'm' },
      ],
      professionalNotes: null,
    })
    .expect(201);
  await conSesion(app, c.pro.token)
    .post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
    .send({ expectedVersion: borrador.body.data.version })
    .expect(200);
  return c;
}
/** Lo que la evolución propia muestra de cada métrica: sus puntos con valor, en orden. */
const puntos = (cuerpo: { data: { metrics: { metricCode: string; series: { value?: number | null }[] }[] } }) =>
  Object.fromEntries(cuerpo.data.metrics.map((m) => [m.metricCode, m.series.map((p) => p.value).filter((v) => v !== null && v !== undefined)]));

describe('DL-115 · antropometría: la evolución propia exige el A3 vigente', () => {
  it('revocado el A3: 403 por /me y por la ruta del profesional con el propio id; el profesional, 404; con un A3 nuevo vuelve idéntica', async () => {
    const c = await conUnaToma();
    const ase = conSesion(app, c.ase.token);
    const antes = await ase.get(`/api/v1/me/anthropometry/progress?${periodo()}`).expect(200);
    expect(puntos(antes.body)).toEqual({ peso: [72.5], talla: [1.75] });
    const mediciones = await prisma.medicionAntropometrica.count({ where: { evaluacion: { asesoradoId: c.ase.id } } });

    await revocarA3(c.ase);
    const propia = await ase.get(`/api/v1/me/anthropometry/progress?${periodo()}`).expect(403);
    expect(propia.body.error.code).toBe('ACTION_FORBIDDEN');
    // Acceso directo por la otra ruta: el propio id no abre un camino distinto.
    const directa = await ase.get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?${periodo()}`).expect(403);
    expect(directa.body.error.code).toBe('ACTION_FORBIDDEN');
    // El profesional también deja de leer, con el 404 del PDP (sin cambios: TEST-AUTH-004, variante profesional).
    await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?${periodo()}`).expect(404);
    // No se borró nada: la revocación es prospectiva.
    expect(await prisma.medicionAntropometrica.count({ where: { evaluacion: { asesoradoId: c.ase.id } } })).toBe(mediciones);

    await otorgarA3(app, c.ase.token).expect(201);
    const despues = await ase.get(`/api/v1/me/anthropometry/progress?${periodo()}`).expect(200);
    expect(puntos(despues.body)).toEqual(puntos(antes.body));
  });

  it('A3 nunca otorgado: 403 (TEST-AUTH-003, variante del titular); lo de otro titular sigue siendo el mismo 404', async () => {
    const sinA3 = await prepararAsesorado(app, `a3-nunca-${++contador}`);
    const r = await conSesion(app, sinA3.token).get(`/api/v1/me/anthropometry/progress?${periodo()}`).expect(403);
    expect(r.body.error.code).toBe('ACTION_FORBIDDEN');
    const c = await conUnaToma();
    await conSesion(app, sinA3.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?${periodo()}`).expect(404);
  });
});

// ─── Formularios ────────────────────────────────────────────────────────────────────────────────

const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];
const respuestas = (dias: number) => ({
  answers: [
    { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza' },
    { fieldCode: 'trn_experiencia', value: 'Caminatas' },
    { fieldCode: 'trn_dias_por_semana', value: dias },
    { fieldCode: 'trn_minutos_por_sesion', value: 45 },
    { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa' },
  ],
});

async function solicitud(c: CircuitoDeEntrenamiento): Promise<string> {
  const s = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/form-requests`, claveDeIdempotencia())
    .send({ templateVersionId: VERSION_ENTRENAMIENTO, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) })
    .expect(201);
  return s.body.data.formRequestId as string;
}

describe('DL-115 · formularios: lo propio exige el A3 vigente; la lista sigue', () => {
  it('revocado el A3: detalle, responder y corregir dan 403 sin escribir nada; la lista sigue sin respuestas; lo ajeno y lo inexistente, 404', async () => {
    const c = await circuitoDeEntrenamiento(app, `a3-frm-${++contador}`);
    const otro = await circuitoDeEntrenamiento(app, `a3-frm-otro-${contador}`);
    const respondida = await solicitud(c);
    const pendiente = await solicitud(c);
    const ajena = await solicitud(otro);
    const ase = conSesion(app, c.ase.token);
    const r = await ase.post(`/api/v1/me/form-requests/${respondida}/responses`, claveDeIdempotencia()).send(respuestas(3)).expect(201);
    const formResponseId = r.body.data.formResponseId as string;
    const antes = await ase.get(`/api/v1/form-requests/${respondida}`).expect(200);

    await revocarA3(c.ase);
    // FRM-05: lo propio, 403; lo ajeno y lo inexistente, el mismo 404 de siempre (no se revela qué existe).
    expect((await ase.get(`/api/v1/form-requests/${respondida}`).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    await ase.get(`/api/v1/form-requests/${ajena}`).expect(404);
    await ase.get(`/api/v1/form-requests/${randomUUID()}`).expect(404);
    // FRM-07 y FRM-08 sobre lo propio: 403 y nada escrito. El A3 va antes que «ya respondida». Lo ajeno y lo inexistente,
    // el mismo 404 de siempre.
    const respuestasAntes = await prisma.respuestaDeFormulario.count({ where: { asesoradoId: c.ase.id } });
    expect((await ase.post(`/api/v1/me/form-requests/${pendiente}/responses`, claveDeIdempotencia()).send(respuestas(4)).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    await ase.post(`/api/v1/me/form-requests/${respondida}/responses`, claveDeIdempotencia()).send(respuestas(4)).expect(403);
    await ase.post(`/api/v1/me/form-requests/${ajena}/responses`, claveDeIdempotencia()).send(respuestas(4)).expect(404);
    await ase.post(`/api/v1/me/form-requests/${randomUUID()}/responses`, claveDeIdempotencia()).send(respuestas(4)).expect(404);
    expect(
      (await ase.post(`/api/v1/me/form-responses/${formResponseId}/rectifications`, claveDeIdempotencia()).send({ expectedVersion: 'v1', reason: 'Un día más.', ...respuestas(4) }).expect(403)).body.error.code,
    ).toBe('ACTION_FORBIDDEN');
    expect(await prisma.respuestaDeFormulario.count({ where: { asesoradoId: c.ase.id } })).toBe(respuestasAntes);
    expect(await prisma.rectificacionDeRespuestaDeFormulario.count({ where: { respuestaId: formResponseId } })).toBe(0);
    // FRM-06 sigue: las dos solicitudes, ninguna respondable, y sin las respuestas.
    const lista = await ase.get('/api/v1/me/form-requests').expect(200);
    const propias = (lista.body.data as { formRequestId: string; respondable: boolean }[]).filter((s) => [respondida, pendiente].includes(s.formRequestId));
    expect(propias).toHaveLength(2);
    expect(propias.every((s) => s.respondable === false)).toBe(true);
    expect(JSON.stringify(lista.body)).not.toContain('Ganar fuerza');
    // El profesional tampoco lee la respuesta: el PDP lo corta (404).
    await conSesion(app, c.pro.token).get(`/api/v1/form-requests/${respondida}`).expect(404);

    // Con un A3 nuevo, lo cargado antes vuelve idéntico, y se puede corregir y responder otra vez.
    await otorgarA3(app, c.ase.token).expect(201);
    const despues = await ase.get(`/api/v1/form-requests/${respondida}`).expect(200);
    expect(despues.body.data.response).toEqual(antes.body.data.response);
    await ase.post(`/api/v1/me/form-responses/${formResponseId}/rectifications`, claveDeIdempotencia()).send({ expectedVersion: 'v1', reason: 'Un día más.', ...respuestas(4) }).expect(201);
    await ase.post(`/api/v1/me/form-requests/${pendiente}/responses`, claveDeIdempotencia()).send(respuestas(4)).expect(201);
  });
});
