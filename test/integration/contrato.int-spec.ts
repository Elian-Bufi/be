/**
 * TEST-CT — el runtime no emite nada que el contrato no declare.
 * - WP-02: TEST-CT-ACC-01…05 · TEST-CT-P1-ACC-P1-03 · CON-05.
 * - WP-03: TEST-CT-REL-01…09 · TEST-CT-CON-01…04, 06…08 · TEST-CT-DSH-03 (parcial).
 * - WP-04: TEST-CT-NUT-01…21 · TEST-CT-INT-NUT-01 · la lista propia de ingestas (DL-055).
 * - WP-05: TEST-CT-ANT-01, 03, 05 a 12, la evolución propia, y MTH-01/02 con CAL-01 a 04.
 * Un observador registra cada respuesta real (método, ruta, status, código). Después se exige que todo par
 * (status, código) esté declarado para esa operación en `OPERACIONES`, la misma fuente que genera
 * `docs/api/openapi.json` (09v7 T21).
 */
import type { INestApplication } from '@nestjs/common';
import { VERSION_VIGENTE } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { erroresDeclarados, OPERACIONES, operacionDe } from '../../packages/domain/src/openapi';
import { TokensService } from '../../apps/api/src/sesion/tokens.service';
import {
  appDePrueba,
  claveDeIdempotencia,
  conSesion,
  correoSintetico,
  CREDENCIAL_SINTETICA,
  cuerpoDeCierre,
  cuerpoDeRegistro,
  login,
  OTRA_CREDENCIAL_SINTETICA,
  registrar,
  registrarOk,
  tokenDe,
} from './soporte-api';
import { aceptar, dashboard, pausar, prepararAsesorado, prepararProfesional, solicitar, versionDeVinculo } from './soporte-vinculo';
import { CATALOGO_DEMO, circuitoAntropometrico } from './soporte-antropometria';
import { randomUUID } from 'node:crypto';
import {
  activar,
  circuitoListoParaPlanificar,
  crearBorrador,
  cuerpoDeEvaluacion,
  cuerpoDeObjetivo,
  cuerpoDeRevision,
  estructura,
  patchConSesion,
  registrarComida,
  registrarLibre,
} from './soporte-nutricion';

interface Observada {
  metodo: string;
  ruta: string;
  status: number;
  codigo: string | null;
}

const observadas: Observada[] = [];
const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba({}, (a) => {
    a.use((req: Request, res: Response, next: NextFunction) => {
      let codigo: string | null = null;
      const json = res.json.bind(res);
      res.json = (cuerpo: unknown) => {
        codigo = (cuerpo as { error?: { code?: string } } | null)?.error?.code ?? null;
        return json(cuerpo);
      };
      res.on('finish', () => observadas.push({ metodo: req.method.toLowerCase(), ruta: req.originalUrl.split('?')[0], status: res.statusCode, codigo }));
      next();
    });
  });
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const CIERRE = '/api/v1/me/account-closure-requests';

it('TEST-CT (WP-02): se ejercitan éxitos y errores de las siete operaciones de identidad y sesiones', async () => {
  const servidor = app.getHttpServer();
  // ACC-01
  const correo = correoSintetico('contrato');
  const clave = claveDeIdempotencia();
  await registrar(app, correo, { clave }).expect(201);
  await registrar(app, correo).expect(409); // REGISTRATION_NOT_AVAILABLE
  await registrar(app, correoSintetico('contrato-otro'), { clave }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await request(servidor).post('/api/v1/registrations').send(cuerpoDeRegistro(correoSintetico('sin-key'))).expect(400);
  await request(servidor).post('/api/v1/registrations?x=1').set('Idempotency-Key', claveDeIdempotencia()).send(cuerpoDeRegistro(correoSintetico('query'))).expect(400);
  await request(servidor).post('/api/v1/registrations').set('Idempotency-Key', claveDeIdempotencia()).send({ ...cuerpoDeRegistro(correoSintetico('campo')), rol: 'X' }).expect(400);
  await request(servidor)
    .post('/api/v1/registrations')
    .set('Idempotency-Key', claveDeIdempotencia())
    .send({ ...cuerpoDeRegistro(correoSintetico('terminos')), termsAcceptance: { versionId: 'vieja' } })
    .expect(422);
  await request(servidor)
    .post('/api/v1/registrations')
    .set('Idempotency-Key', claveDeIdempotencia())
    .send({ ...cuerpoDeRegistro(correoSintetico('privacidad')), privacyAcknowledgement: { versionId: 'vieja' } })
    .expect(422);
  await request(servidor).post('/api/v1/registrations').set('Content-Type', 'application/json').set('Idempotency-Key', claveDeIdempotencia()).send('{no es json').expect(400);

  // ACC-02
  await login(app, correo).expect(201);
  await login(app, correo, OTRA_CREDENCIAL_SINTETICA).expect(401);
  await request(servidor).post('/api/v1/auth/sessions').send({ method: 'GOOGLE', identifier: correo, credential: CREDENCIAL_SINTETICA }).expect(400);
  await request(servidor).post('/api/v1/auth/sessions').send({ method: 'LOCAL', identifier: correo, credential: CREDENCIAL_SINTETICA, rol: 'X' }).expect(400);

  // ACC-05 · CON-05 · ACC-04 · ACC-03
  const token = await tokenDe(app, correo);
  await conSesion(app, token).get('/api/v1/me').expect(200);
  await conSesion(app, token).get('/api/v1/me?x=1').expect(400);
  await request(servidor).get('/api/v1/me').expect(401);
  await conSesion(app, 'no-es-un-jwt').get('/api/v1/me').expect(401);
  await conSesion(app, token).get('/api/v1/me/health-data-consent-requirement').expect(200);
  await conSesion(app, token).get('/api/v1/me/health-data-consent-requirement?x=1').expect(400);
  await request(servidor).get('/api/v1/me/health-data-consent-requirement').expect(401);
  await conSesion(app, token).delete('/api/v1/auth/sessions?x=1').expect(400);
  await conSesion(app, token).delete('/api/v1/auth/sessions').expect(204);
  await conSesion(app, token).delete('/api/v1/auth/sessions').expect(401); // SESSION_REVOKED
  await conSesion(app, token).get('/api/v1/me').expect(401); // SESSION_REVOKED
  await request(servidor).delete('/api/v1/auth/sessions').expect(401);
  const otro = await tokenDe(app, correo);
  await conSesion(app, otro).delete('/api/v1/auth/sessions/current?x=1').expect(400);
  await conSesion(app, otro).delete('/api/v1/auth/sessions/current').expect(204);
  await conSesion(app, otro).delete('/api/v1/auth/sessions/current').expect(204);
  await request(servidor).delete('/api/v1/auth/sessions/current').expect(401);
  await conSesion(app, 'no-es-un-jwt').delete('/api/v1/auth/sessions/current').expect(401);

  // ACC-P1-03
  const t = await tokenDe(app, correo);
  await request(servidor).post(CIERRE).set('Authorization', `Bearer ${t}`).send(cuerpoDeCierre()).expect(400); // sin key
  await conSesion(app, t).post(CIERRE).send(cuerpoDeCierre({ borrarTodo: true })).expect(400);
  await conSesion(app, t).post(CIERRE).send(cuerpoDeCierre({ confirmed: false })).expect(422);
  await request(servidor).post(CIERRE).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpoDeCierre()).expect(401);
  const id = (await conSesion(app, t).get('/api/v1/me').expect(200)).body.data.identityId as string;
  const { version } = await prisma.controlDeSesion.findUniqueOrThrow({ where: { identidadId: id } });
  const vieja = await prisma.sesion.create({
    data: { identidadId: id, momentoDeOcurrencia: new Date(Date.now() - 11 * 60_000), expiraEn: new Date(Date.now() + 3600_000), versionDeControl: version },
  });
  const tokenViejo = app.get(TokensService).firmar({ sub: id, sid: vieja.id, tv: version }, vieja.expiraEn);
  await conSesion(app, tokenViejo).post(CIERRE).send(cuerpoDeCierre()).expect(403);
  const claveDeCierre = claveDeIdempotencia();
  await conSesion(app, t).post(CIERRE, claveDeCierre).send(cuerpoDeCierre()).expect(201);
  await conSesion(app, t).post(CIERRE, claveDeCierre).send(cuerpoDeCierre({ consequencesAcknowledgement: { versionId: VERSION_VIGENTE.TERMINOS.id } })).expect(409);
});


it('TEST-CT (WP-03): se ejercitan éxitos y errores de REL, CON y DSH-03', async () => {
  const servidor = app.getHttpServer();
  const pn = await prepararProfesional(app, 'ct', ['NUTRICION']);
  const pt = await prepararProfesional(app, 'ct-t', ['ENTRENAMIENTO']);
  const a01 = await prepararAsesorado(app, 'ct', { a3: true });
  const a02 = await prepararAsesorado(app, 'ct-2');

  // REL-01
  const clave = claveDeIdempotencia();
  const creada = await solicitar(app, pn, a01.id, 'NUTRICION', clave).expect(201);
  const solicitudId = creada.body.data.relationshipRequestId as string;
  await solicitar(app, pn, a01.id, 'NUTRICION').expect(200); // equivalente pendiente (REG-06-44)
  await solicitar(app, pn, a02.id, 'NUTRICION', clave).expect(409); // IDEMPOTENCY_KEY_REUSED
  await request(servidor).post('/api/v1/relationship-requests').set('Authorization', `Bearer ${pn.token}`).send({}).expect(400); // sin key
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a01.id }, scope: { code: 'NUTRICION' }, purpose: 'x', rol: 'PRO' }).expect(400);
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: '00000000-0000-4000-8000-000000000000' }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(404);
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'NUTRICION' }, purpose: '' }).expect(422); // PURPOSE_REQUIRED
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'PSICOLOGIA' }, purpose: 'x' }).expect(422); // SCOPE_NOT_AVAILABLE
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: pn.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(422); // COUNTERPART_NOT_ELIGIBLE
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'NUTRICION' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' }).expect(422); // VALIDATION_FAILED
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'ENTRENAMIENTO' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' }).expect(422); // SCOPE_NOT_AVAILABLE: no verificado
  await request(servidor).post('/api/v1/relationship-requests').set('Idempotency-Key', claveDeIdempotencia()).send({}).expect(401);

  // REL-02
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?state=PENDIENTE&limit=5').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?orden=asc').expect(400);
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?cursor=basura').expect(400); // INVALID_CURSOR
  await request(servidor).get('/api/v1/me/relationship-requests').expect(401);

  // REL-03 / REL-04
  await aceptar(app, pn, solicitudId).expect(404); // el profesional no acepta por el asesorado
  await aceptar(app, a01, solicitudId, 'v9').expect(409); // VERSION_CONFLICT
  const claveDeAceptar = claveDeIdempotencia();
  const aceptada = await aceptar(app, a01, solicitudId, 'v1', claveDeAceptar).expect(200);
  const vinculoId = aceptada.body.data.relationshipId as string;
  await aceptar(app, a01, solicitudId, 'v1', claveDeAceptar).expect(200); // replay idempotente
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${solicitudId}/accept`, claveDeAceptar).send({ expectedVersion: 'v2' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await aceptar(app, a01, solicitudId, 'v2').expect(422); // ya ACEPTADA
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${solicitudId}/accept`).send({ expectedVersion: 'uno' }).expect(400);
  const paraRechazar = await solicitar(app, pt, a01.id, 'ENTRENAMIENTO').expect(201);
  const rechazoId = paraRechazar.body.data.relationshipRequestId as string;
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v7' }).expect(409);
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v1' }).expect(200);
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v2' }).expect(422);
  await conSesion(app, pt.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v2' }).expect(404);
  await solicitar(app, pn, a01.id, 'NUTRICION').expect(409); // RESOURCE_CONFLICT: ya hay vínculo vigente

  // REL-05 / REL-06
  await conSesion(app, pn.token).get('/api/v1/me/relationships').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationships?scope=NUTRICION&state=ACEPTADO').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationships?scope=PSICOLOGIA').expect(400);
  await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}`).expect(200);
  await conSesion(app, a02.token).get(`/api/v1/relationships/${vinculoId}`).expect(404);
  await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}?x=1`).expect(400);

  // CON-01 / CON-02 / CON-03
  await conSesion(app, pn.token).get(`/api/v1/relationships/${vinculoId}/consent-requirements`).expect(404);
  const requisitos = await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}/consent-requirements`).expect(200);
  const versionB2 = requisitos.body.data.consentVersion.id as string;
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'terminos-2026-09-demo' }).expect(409); // CONSENT_VERSION_STALE
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2, professionalId: pn.id }).expect(400);
  await conSesion(app, pn.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(404);
  const otorgado = await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(201);
  const consentId = otorgado.body.data.consentId as string;
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(200); // ya vigente con esa versión
  await conSesion(app, a01.token).get('/api/v1/me/consents').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/consents?state=VIGENTE').expect(400);

  // DSH-03
  await dashboard(app, pn, a01.id).expect(200);
  await conSesion(app, pn.token).get(`/api/v1/advisees/${a01.id}/dashboard?periodStart=2026-09-01T00:00:00Z&periodEnd=2026-09-30T00:00:00Z`).expect(200);
  await conSesion(app, pn.token).get(`/api/v1/advisees/${a01.id}/dashboard?periodStart=ayer`).expect(400);
  await dashboard(app, pt, a01.id).expect(404);
  await request(servidor).get(`/api/v1/advisees/${a01.id}/dashboard`).expect(401);

  // REL-07 / REL-08 / REL-09
  const v = await versionDeVinculo(app, a01.token, vinculoId);
  await pausar(app, a01.token, vinculoId, 'v99').expect(409); // VERSION_CONFLICT
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/pause`).send({ expectedVersion: v, reason: 'porque sí' }).expect(400);
  await pausar(app, a02.token, vinculoId, v).expect(404);
  await pausar(app, a01.token, vinculoId, v).expect(200);
  const vPausado = await versionDeVinculo(app, a01.token, vinculoId);
  await pausar(app, a01.token, vinculoId, vPausado).expect(422); // ya PAUSADO
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(422); // RELATIONSHIP_NOT_READY_FOR_CONSENT
  await conSesion(app, pn.token).post(`/api/v1/relationships/${vinculoId}/resume`).send({ expectedVersion: vPausado }).expect(403); // lo pausó el asesorado
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/resume`).send({ expectedVersion: vPausado }).expect(200);
  const vActivo = await versionDeVinculo(app, a01.token, vinculoId);
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/resume`).send({ expectedVersion: vActivo }).expect(422); // ya ACEPTADO

  // CON-04
  await conSesion(app, a02.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({}).expect(404);
  await conSesion(app, a01.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({ motivo: 'x' }).expect(400);
  await conSesion(app, a01.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({}).expect(200);
  await conSesion(app, a01.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({}).expect(200); // REVOKED → REVOKED
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/finalize`).send({ expectedVersion: vActivo, reason: 'OBJETIVO_CUMPLIDO' }).expect(200);
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/finalize`).send({ expectedVersion: 'v99', reason: 'OBJETIVO_CUMPLIDO' }).expect(422); // FINALIZADO es terminal

  // CON-06 / CON-07 / CON-08
  await conSesion(app, a02.token).post('/api/v1/me/health-data-consents').send({ consentVersionId: 'terminos-2026-09-demo' }).expect(422); // HEALTH_DATA_CONSENT_NOT_AVAILABLE
  const claveA3 = claveDeIdempotencia();
  const a3 = await conSesion(app, a02.token).post('/api/v1/me/health-data-consents', claveA3).send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id }).expect(201);
  await conSesion(app, a02.token).post('/api/v1/me/health-data-consents', claveA3).send({ consentVersionId: 'otra-version' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await conSesion(app, a02.token).post('/api/v1/me/health-data-consents').send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id }).expect(409); // CONSENT_ALREADY_ACTIVE
  await conSesion(app, a02.token).get('/api/v1/me/health-data-consents').expect(200);
  await conSesion(app, a02.token).get('/api/v1/me/health-data-consents?cursor=x').expect(400);
  await conSesion(app, a01.token).post(`/api/v1/me/health-data-consents/${a3.body.data.consentId}/revoke`).send({}).expect(404);
  await conSesion(app, a02.token).post(`/api/v1/me/health-data-consents/${a3.body.data.consentId}/revoke`).send({}).expect(200);
  await conSesion(app, a02.token).post(`/api/v1/me/health-data-consents/${a3.body.data.consentId}/revoke`).send({}).expect(200);
});

it('TEST-CT (WP-04): se ejercitan éxitos y errores de NUT e INT-NUT-01', async () => {
  const c = await circuitoListoParaPlanificar(app, 'contrato');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const ajeno = randomUUID();
  // NUT-01 a 06
  const evClave = claveDeIdempotencia();
  const ev = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`, evClave).send(cuerpoDeEvaluacion()).expect(201);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`, evClave).send({ ...cuerpoDeEvaluacion(), context: 'otro' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).send({ ...cuerpoDeEvaluacion(), occurredAt: new Date(Date.now() + 86_400_000).toISOString() }).expect(422);
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(404);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).send({ ...cuerpoDeEvaluacion(), extra: 1 }).expect(400);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).expect(200);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/evaluations`).expect(404);
  await pro.get(`/api/v1/nutrition/evaluations/${ev.body.data.evaluationId}`).expect(200);
  await pro.get(`/api/v1/nutrition/evaluations/${ajeno}`).expect(404);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(ajeno)).expect(422); // EVALUATION_NOT_COMPATIBLE
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/objectives`).send(cuerpoDeObjetivo(c.evaluationId)).expect(404);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).expect(200);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/objectives`).expect(404);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/objectives/effective`).expect(200);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/objectives/effective`).expect(404);
  // NUT-13 e INT-NUT-01
  await pro.get('/api/v1/nutrition/catalog-items?q=arroz').expect(200);
  await pro.get('/api/v1/nutrition/catalog-items?type=OTRO').expect(400);
  await ase.get('/api/v1/nutrition/catalog-items').expect(403);
  const nuevo = { name: 'Galleta sintética', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 420, proteinG: 8, carbohydrateG: 70, fatG: 12 } };
  await pro.post('/api/v1/nutrition/catalog-items').send(nuevo).expect(201);
  await ase.post('/api/v1/nutrition/catalog-items').send(nuevo).expect(403);
  // NUT-07 a 12
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: ajeno }).expect(422); // OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(404);
  const b = await crearBorrador(app, c);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(409); // RESOURCE_CONFLICT: ya hay un borrador
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/plans?state=DRAFT`).expect(200);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/plans?state=OTRO`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/plans`).expect(404);
  await pro.get(`/api/v1/nutrition/plans/${b.planId}`).expect(200);
  await pro.get(`/api/v1/nutrition/plans/${ajeno}`).expect(404);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: 'v9', changes: { dayTypes: [] } }).expect(409);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: b.version, changes: { dayTypes: [{ label: 'D', meals: [{ label: 'M', prescriptionMode: 'EXCHANGE_PORTIONS', options: [] }] }] } }).expect(422);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${ajeno}`).send({ expectedVersion: 'v1', changes: { dayTypes: [] } }).expect(404);
  const guardado = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructura(c.arroz, c.pollo) }).expect(200);
  await pro.post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: 'v1' }).expect(409);
  await pro.post(`/api/v1/nutrition/plans/${ajeno}/validate`).send({ expectedVersion: 'v1' }).expect(404);
  await pro.post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: guardado.body.data.version }).expect(200);
  await activar(app, c.pro, b.planId, 'v1').expect(409);
  await activar(app, c.pro, ajeno, 'v1').expect(404);
  const act = await activar(app, c.pro, b.planId, guardado.body.data.version).expect(200);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: act.body.data.version, changes: { dayTypes: [] } }).expect(422); // PLAN_NOT_EDITABLE
  await pro.post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: act.body.data.version }).expect(422); // PLAN_NOT_EDITABLE
  await activar(app, c.pro, b.planId, act.body.data.version).expect(422); // OPERATION_NOT_READY
  // NUT-14 a 16, lista propia y NUT-21
  const hoy = await ase.get('/api/v1/me/nutrition/today').expect(200);
  await ase.get('/api/v1/me/nutrition/today?otro=1').expect(400);
  const dia = hoy.body.data.activePlan.dayTypes[0];
  const reg = await registrarComida(app, c.ase, b.planId, dia, { gramos: 80 }).expect(201);
  await registrarComida(app, c.ase, b.planId, dia, { gramos: 80 }).expect(200);
  await registrarComida(app, c.ase, b.planId, dia, { gramos: 10 }).expect(409);
  await registrarComida(app, c.ase, ajeno, dia).expect(404);
  const invalida = await ase.post('/api/v1/me/nutrition/executions').send({
    activePlanId: b.planId,
    dayTypeId: dia.dayTypeId,
    occurredAt: new Date().toISOString(),
    recording: { origin: 'PRESCRIBED', mode: 'DISH_OPTIONS', mealId: dia.meals[0].mealId, optionId: randomUUID() },
  });
  expect(invalida.status).toBe(422);
  const libre = await registrarLibre(app, c.ase, b.planId, 'Texto libre para el contrato.').expect(201);
  await ase.get('/api/v1/me/nutrition/executions').expect(200);
  await ase.get('/api/v1/me/nutrition/executions?cursor=zz').expect(400);
  await ase.get(`/api/v1/nutrition/executions/${reg.body.data.executionId}`).expect(200);
  await ase.get(`/api/v1/nutrition/executions/${ajeno}`).expect(404);
  const estimacion = { reason: 'STRUCTURE_FREE_DESCRIPTION', structuredEstimate: { items: [{ catalogItemId: null, description: 'Texto', quantity: null }] }, estimationStatement: 'Estimación.' };
  await pro.post(`/api/v1/nutrition/executions/${libre.body.data.executionId}/corrections`).send(estimacion).expect(201);
  await pro.post(`/api/v1/nutrition/executions/${reg.body.data.executionId}/corrections`).send(estimacion).expect(422);
  await pro.post(`/api/v1/nutrition/executions/${libre.body.data.executionId}/corrections`).send({ ...estimacion, structuredEstimate: { items: [{ catalogItemId: ajeno, description: 'x', quantity: null }] } }).expect(422);
  await pro.post(`/api/v1/nutrition/executions/${ajeno}/corrections`).send(estimacion).expect(404);
  // NUT-17 a 20
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/review-context`).expect(200);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/review-context?periodStart=mal`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/review-context`).expect(404);
  const evidencia = [{ type: 'EXECUTION', id: reg.body.data.executionId as string }];
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'OTRO')).expect(422);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send({ ...cuerpoDeRevision(evidencia, 'MAINTAIN'), rationale: '' }).expect(422);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision([{ type: 'EXECUTION', id: ajeno }], 'MAINTAIN')).expect(422);
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN')).expect(404);
  const rev = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN', { nextReviewAt: '2030-01-01' })).expect(201);
  await pro.get(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}`).expect(200);
  await pro.get(`/api/v1/nutrition/reviews/${ajeno}`).expect(404);
  await pro.post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/apply`).send({ expectedVersion: 'v2' }).expect(409);
  await pro.post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
  await pro.post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(409);
  await pro.post(`/api/v1/nutrition/reviews/${ajeno}/apply`).send({ expectedVersion: 'v1' }).expect(404);
  // AJUSTAR con un borrador ya abierto: la continuidad no se puede aplicar (UC-I06 E02).
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: b.planId }).expect(201);
  const ajuste = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'ADJUST')).expect(201);
  await pro.post(`/api/v1/nutrition/reviews/${ajuste.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(422);
  // Revisar sin seguimiento abierto: REVIEW_NOT_ALLOWED.
  const cierre = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'FINALIZE')).expect(201);
  await pro.post(`/api/v1/nutrition/reviews/${cierre.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN')).expect(422);
  await registrarLibre(app, c.ase, b.planId, 'Después del cierre.').expect(422); // ACTIVE_PLAN_REQUIRED
});

it('TEST-CT (WP-05): se ejercitan éxitos y errores de las doce operaciones ANT', async () => {
  const c = await circuitoAntropometrico(app, prisma, 'contrato');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const ajeno = randomUUID();
  const ayer = new Date(Date.now() - 86_400_000).toISOString();
  const medicion = (metricCode: string, value: number, unit: string) => ({ metricCode, value, unit });
  const toma = (mediciones: { metricCode: string; value: number; unit: string }[], cambios: Record<string, unknown> = {}) => ({
    occurredAt: ayer,
    specificationVersionId: c.protocoloVersionId,
    source: { type: 'DIRECT_CAPTURE' },
    directMeasurements: mediciones,
    ...cambios,
  });
  const evaluaciones = `/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`;
  const borradores = `/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`;

  // ANT-01: el catálogo es de la capacidad antropométrica; el asesorado no lo consulta.
  await pro.get('/api/v1/anthropometry/specifications?kind=PROTOCOL').expect(200);
  await pro.get('/api/v1/anthropometry/specifications?kind=OTRO').expect(400); // INVALID_REQUEST
  await pro.get('/api/v1/anthropometry/specifications?cursor=xx').expect(400); // INVALID_CURSOR
  await ase.get('/api/v1/anthropometry/specifications').expect(403); // ACTION_FORBIDDEN

  // ANT-02: la evaluación nace registrada, en un solo acto.
  const claveDirecta = claveDeIdempotencia();
  const directa = await pro.post(evaluaciones, claveDirecta).send(toma([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')])).expect(201);
  expect(directa.body.data.state).toBe('REGISTERED');
  await pro.post(evaluaciones, claveDirecta).send(toma([medicion('peso', 70, 'kg')])).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { occurredAt: new Date(Date.now() + 86_400_000).toISOString() })).expect(422); // ANTHROPOMETRY_EVALUATION_INVALID
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { specificationVersionId: ajeno })).expect(422); // SPECIFICATION_REFERENCE_INVALID
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { extra: 1 })).expect(400); // UNKNOWN_FIELD
  await pro.post(`/api/v1/advisees/${ajeno}/anthropometry/evaluations`).send(toma([medicion('peso', 72.5, 'kg')])).expect(404);
  // Un método pedido que no existe, y uno que no se puede calcular con estas mediciones.
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { requestedDerivedMethods: [{ methodVersionId: ajeno }] })).expect(422); // METHOD_VERSION_NOT_SELECTABLE
  await pro
    .post(evaluaciones)
    .send(toma([medicion('peso', 72.5, 'kg')], { requestedDerivedMethods: [{ methodVersionId: CATALOGO_DEMO.metodo.v2 }] }))
    .expect(422); // CALCULATION_INPUTS_INSUFFICIENT

  // ANT-07: el borrador, en su propia colección.
  const claveDeCreacion = claveDeIdempotencia();
  const creado = await pro.post(borradores, claveDeCreacion).send(toma([medicion('peso', 72.5, 'kg')])).expect(201);
  const evaluationId = creado.body.data.evaluationId as string;
  await pro.post(borradores, claveDeCreacion).send(toma([])).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(borradores).send(toma([medicion('peso', 72.5, 'kg')], { occurredAt: new Date(Date.now() + 86_400_000).toISOString() })).expect(422);
  await pro.post(borradores).send(toma([medicion('peso', 70, 'kg')], { specificationVersionId: ajeno })).expect(422);
  await pro.post(borradores).send(toma([], { extra: 1 })).expect(400);
  await pro.post(`/api/v1/advisees/${ajeno}/anthropometry/evaluation-drafts`).send(toma([])).expect(404);

  // ANT-08, ANT-03, ANT-04 y ANT-09: cada colección lee lo suyo.
  await pro.get(borradores).expect(200);
  await pro.get(`${borradores}?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/anthropometry/evaluation-drafts`).expect(404);
  await pro.get(evaluaciones).expect(200);
  await pro.get(`${evaluaciones}?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/anthropometry/evaluations`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}`).expect(200);
  await pro.get(`/api/v1/anthropometry/evaluation-drafts/${ajeno}`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluations/${directa.body.data.evaluationId}`).expect(200);
  await pro.get(`/api/v1/anthropometry/evaluations/${ajeno}`).expect(404);
  // Cruzadas: un borrador por la ruta de las registradas no existe, y al revés tampoco (09v16:1718).
  await pro.get(`/api/v1/anthropometry/evaluations/${evaluationId}`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluation-drafts/${directa.body.data.evaluationId}`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluations/${directa.body.data.evaluationId}?x=1`).expect(400);

  // ANT-10: guardar reemplaza la versión de trabajo y avanza el token.
  const guardar = (cuerpo: object, id = evaluationId) => conSesion(app, c.pro.token).put(`/api/v1/anthropometry/evaluation-drafts/${id}`).send(cuerpo);
  const guardado = await guardar({ expectedVersion: creado.body.data.version, ...toma([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]) }).expect(200);
  await guardar({ expectedVersion: 'v9', ...toma([]) }).expect(409); // VERSION_CONFLICT
  await guardar({ expectedVersion: guardado.body.data.version, ...toma([medicion('peso', 70, 'kg')], { specificationVersionId: ajeno }) }).expect(422);
  await guardar({ expectedVersion: guardado.body.data.version, ...toma([]), extra: 1 }).expect(400);
  await guardar({ expectedVersion: 'v1', ...toma([]) }, ajeno).expect(404);

  // ANT-11: el acto explícito de registro. Sin contenido registrable no procede, y REGISTRADA es terminal.
  const vacio = await pro.post(borradores).send(toma([])).expect(201);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${vacio.body.data.evaluationId}/register`).send({ expectedVersion: vacio.body.data.version }).expect(422); // ANTHROPOMETRY_EVALUATION_INVALID
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`).send({ expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  const claveDeRegistro = claveDeIdempotencia();
  const registrada = await pro
    .post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`, claveDeRegistro)
    .send({ expectedVersion: guardado.body.data.version })
    .expect(200);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`, claveDeRegistro).send({ expectedVersion: 'v9' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  // Ya registrada: REGISTRADA es terminal y el dueño recibe el motivo, no un 404. Esconderla no le agrega nada,
  // porque sabe que existe: la fusiona la lectura (ANT-04/ANT-09), que sí es donde el 09 exige la separación.
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`).send({ expectedVersion: registrada.body.data.version }).expect(422); // ANTHROPOMETRY_EVALUATION_NOT_EDITABLE
  await guardar({ expectedVersion: registrada.body.data.version, ...toma([]) }).expect(422);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${ajeno}/register`).send({ expectedVersion: 'v1' }).expect(404);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`).send({ expectedVersion: 'v1', extra: 1 }).expect(400);

  // ANT-05: corregir va sobre la evaluación, con el objetivo declarado en el cuerpo.
  const [peso, talla] = registrada.body.data.measurements as { measurementId: string }[];
  const correcciones = `/api/v1/anthropometry/evaluations/${evaluationId}/corrections`;
  const claveDeCorreccion = claveDeIdempotencia();
  await pro.post(correcciones, claveDeCorreccion).send({ targetId: peso!.measurementId, reason: 'Se leyó mal la balanza.', magnitude: { value: 73.1, unit: 'kg' } }).expect(201);
  await pro.post(correcciones, claveDeCorreccion).send({ targetId: peso!.measurementId, reason: 'Otro motivo.', magnitude: { value: 73.2, unit: 'kg' } }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(correcciones).send({ targetId: peso!.measurementId, reason: 'Otra unidad.', magnitude: { value: 73100, unit: 'g' } }).expect(422); // UNIT_NOT_COMPATIBLE
  await pro.post(correcciones).send({ targetId: ajeno, reason: 'x', magnitude: { value: 1, unit: 'kg' } }).expect(404);
  await pro.post(`/api/v1/anthropometry/evaluations/${ajeno}/corrections`).send({ targetId: peso!.measurementId, reason: 'x', magnitude: { value: 1, unit: 'kg' } }).expect(404);
  await pro.post(correcciones).send({ targetId: peso!.measurementId, reason: 'x', magnitude: { value: 1, unit: 'kg' }, extra: 1 }).expect(400);

  // ANT-12: anular es aditivo, terminal y sin segundo efecto.
  const anulacion = (id: string) => `/api/v1/anthropometry/measurements/${id}/annulments`;
  const claveDeAnulacion = claveDeIdempotencia();
  await pro.post(anulacion(talla!.measurementId), claveDeAnulacion).send({ reason: 'Se midió con el calzado puesto.' }).expect(201);
  await pro.post(anulacion(talla!.measurementId), claveDeAnulacion).send({ reason: 'Otro motivo.' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  // Clave nueva sobre una medición ya anulada: 200 con la anulación que ya existe (WP-05 §0, opción A; DL-059).
  await pro.post(anulacion(talla!.measurementId), claveDeIdempotencia()).send({ reason: 'Otra vez.' }).expect(200);
  // Con un token viejo de la evaluación, 409: nadie anula sobre una foto que ya cambió (09v16 §24.1).
  await pro.post(anulacion(peso!.measurementId)).send({ expectedVersion: 'v9', reason: 'x' }).expect(409); // VERSION_CONFLICT
  // Corregir lo anulado no procede: la corrección cambia la vista del valor, no resucita la medición (REG-06-219).
  await pro.post(correcciones).send({ targetId: talla!.measurementId, reason: 'x', magnitude: { value: 1.8, unit: 'm' } }).expect(422); // CORRECTION_NOT_ALLOWED
  await pro.post(anulacion(ajeno)).send({ reason: 'x' }).expect(404);
  await pro.post(anulacion(peso!.measurementId)).send({ reason: 'x', extra: 1 }).expect(400);

  // ANT-06 y su variante propia: la evolución, del lado del profesional y del lado del asesorado.
  const progreso = `/api/v1/advisees/${c.ase.id}/anthropometry/progress`;
  await pro.get(progreso).expect(200);
  await pro.get(`${progreso}?periodStart=ayer`).expect(400); // INVALID_REQUEST
  await pro.get(`/api/v1/advisees/${ajeno}/anthropometry/progress`).expect(404);
  await ase.get('/api/v1/me/anthropometry/progress').expect(200);
  await ase.get('/api/v1/me/anthropometry/progress?periodEnd=nunca').expect(400);
});

it('TEST-CT (WP-05): se ejercitan éxitos y errores de MTH y CAL', async () => {
  const c = await circuitoAntropometrico(app, prisma, 'contrato-cal');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const ajeno = randomUUID();
  const ayer = new Date(Date.now() - 86_400_000).toISOString();

  // MTH-01 y MTH-02: metadatos de la capacidad; el asesorado no los consulta.
  await pro.get('/api/v1/professional-methods').expect(200);
  await pro.get('/api/v1/professional-methods?purpose=OTRA').expect(400); // INVALID_REQUEST
  await pro.get('/api/v1/professional-methods?cursor=xx').expect(400); // INVALID_CURSOR
  await ase.get('/api/v1/professional-methods').expect(403); // ACTION_FORBIDDEN
  await pro.get(`/api/v1/professional-methods/${CATALOGO_DEMO.metodo.especificacionId}/versions/${CATALOGO_DEMO.metodo.v1}`).expect(200);
  await pro.get(`/api/v1/professional-methods/${CATALOGO_DEMO.metodo.especificacionId}/versions/${CATALOGO_DEMO.metodo.v1}?x=1`).expect(400);
  await pro.get(`/api/v1/professional-methods/${ajeno}/versions/${ajeno}`).expect(404);
  await ase.get(`/api/v1/professional-methods/${CATALOGO_DEMO.metodo.especificacionId}/versions/${CATALOGO_DEMO.metodo.v2}`).expect(403);

  // Una evaluación registrada con peso y talla, que es lo que un cálculo necesita.
  const medicion = (metricCode: string, value: number, unit: string) => ({ metricCode, value, unit });
  const creada = await pro
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`)
    .send({ occurredAt: ayer, specificationVersionId: c.protocoloVersionId, source: { type: 'DIRECT_CAPTURE' }, directMeasurements: [medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')] })
    .expect(201);
  const registrada = await pro
    .post(`/api/v1/anthropometry/evaluation-drafts/${creada.body.data.evaluationId}/register`)
    .send({ expectedVersion: creada.body.data.version })
    .expect(200);
  const porMetrica: Record<string, string> = {};
  for (const m of registrada.body.data.measurements as { metric: string; measurementId: string }[]) porMetrica[m.metric] = m.measurementId;
  const entradas = [
    { inputCode: 'PESO', sourceRef: porMetrica.peso as string },
    { inputCode: 'TALLA', sourceRef: porMetrica.talla as string },
  ];
  const calculos = `/api/v1/advisees/${c.ase.id}/calculations`;
  const ejecucion = (cambios: Record<string, unknown> = {}) => ({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: entradas, ...cambios });

  // CAL-01
  const claveDeCalculo = claveDeIdempotencia();
  const corrida = await pro.post(calculos, claveDeCalculo).send(ejecucion()).expect(201);
  await pro.post(calculos, claveDeCalculo).send(ejecucion({ purpose: 'NUTRITION_OBJECTIVE_SUPPORT' })).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(calculos).send(ejecucion({ methodVersionId: CATALOGO_DEMO.metodo.v1 })).expect(422); // METHOD_VERSION_NOT_SELECTABLE
  await pro.post(calculos).send(ejecucion({ inputBindings: [entradas[0]] })).expect(422); // CALCULATION_INPUTS_INSUFFICIENT
  await pro.post(calculos).send(ejecucion({ inputBindings: [{ inputCode: 'PESO', sourceRef: porMetrica.peso as string }, { inputCode: 'TALLA', sourceRef: porMetrica.peso as string }] })).expect(422);
  await pro.post(calculos).send(ejecucion({ extra: 1 })).expect(400); // UNKNOWN_FIELD
  await pro.post(calculos).send({ purpose: 'OTRA', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: entradas }).expect(400); // INVALID_REQUEST
  await pro.post(`/api/v1/advisees/${ajeno}/calculations`).send(ejecucion()).expect(404);

  // El asesorado no es profesional de este vínculo: el PDP decide primero y responde el 404 no revelador, no un 403.
  await ase.post(calculos).send(ejecucion()).expect(404);
  await ase.get(calculos).expect(404);

  // CAL-02 y CAL-03
  await pro.get(calculos).expect(200);
  await pro.get(`${calculos}?purpose=OTRA`).expect(400);
  await pro.get(`${calculos}?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/calculations`).expect(404);
  await pro.get(`/api/v1/calculations/${corrida.body.data.calculationRunId}`).expect(200);
  await pro.get(`/api/v1/calculations/${corrida.body.data.calculationRunId}?x=1`).expect(400);
  await ase.get(`/api/v1/calculations/${corrida.body.data.calculationRunId}`).expect(404);
  await pro.get(`/api/v1/calculations/${ajeno}`).expect(404);

  // CAL-04: adoptar es una relación con historia.
  const referencia = `/api/v1/advisees/${c.ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`;
  const claveDeAdopcion = claveDeIdempotencia();
  await pro.put(referencia, claveDeAdopcion).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(201);
  await pro.put(referencia, claveDeAdopcion).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: 'v9' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: 'v1' }).expect(200); // ya es la referencia
  await pro.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(409); // VERSION_CONFLICT
  await pro
    .put(`/api/v1/advisees/${c.ase.id}/calculation-references/NUTRITION_OBJECTIVE_SUPPORT`)
    .send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null })
    .expect(422); // CALCULATION_REFERENCE_NOT_COMPATIBLE
  await pro.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: 'v1', extra: 1 }).expect(400);
  await ase.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(404);
  await pro.put(`/api/v1/advisees/${ajeno}/calculation-references/ANTHROPOMETRIC_SUPPORT`).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(404);
});

/**
 * WP-06 se implementa por tramos, con el contrato entero publicado primero (docs/paquetes/WP-06.md §9.6). Las
 * operaciones declaradas que todavía no tienen servicio figuran acá, **a la vista**, en vez de relajar la exigencia
 * de cobertura. La lista solo puede achicarse: si una operación de acá ya se ejercita, la prueba falla hasta que se
 * la saque. **Para cerrar WP-06 tiene que quedar vacía.**
 */
const EN_CONSTRUCCION: ReadonlySet<string> = new Set([
  ...Array.from({ length: 24 }, (_, i) => `API-TRN-${String(i + 1).padStart(2, '0')}`),
  'API-TRN-14-PERIODO',
  'API-INT-TRN-01',
]);

it('TEST-CT: todo (status, código) observado está declarado para su operación; los éxitos coinciden con el contrato', () => {
  const noDeclaradas: string[] = [];
  const porOperacion = new Map<string, Set<string>>();
  for (const o of observadas) {
    const op = operacionDe(o.metodo, o.ruta);
    if (!op) {
      noDeclaradas.push(`${o.metodo.toUpperCase()} ${o.ruta} (operación fuera del contrato)`);
      continue;
    }
    const vistos = porOperacion.get(op.id) ?? new Set<string>();
    vistos.add(`${o.status}${o.codigo ? ` ${o.codigo}` : ''}`);
    porOperacion.set(op.id, vistos);
    if (o.status < 400) {
      if (!op.exitos.some((e) => e.status === o.status)) noDeclaradas.push(`${op.id}: éxito ${o.status} (declarados ${op.exitos.map((e) => e.status).join(', ')})`);
      continue;
    }
    const declarados = erroresDeclarados(op.id)[String(o.status)] ?? [];
    if (!o.codigo || !declarados.includes(o.codigo)) noDeclaradas.push(`${op.id}: ${o.status} ${o.codigo ?? '(sin ErrorEnvelope)'}`);
  }
  process.stdout.write(`${JSON.stringify({ prueba: 'TEST-CT', observadas: Object.fromEntries([...porOperacion].map(([k, v]) => [k, [...v].sort()])) })}\n`);
  expect(noDeclaradas).toEqual([]);
  expect([...porOperacion.keys()].filter((id) => EN_CONSTRUCCION.has(id))).toEqual([]);
  expect([...porOperacion.keys()].sort()).toEqual(OPERACIONES.map((o) => o.id).filter((id) => !EN_CONSTRUCCION.has(id)).sort());
});
