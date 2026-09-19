/**
 * TEST-CT-ACC-01…05 · TEST-CT-P1-ACC-P1-03 · CON-05 — el runtime no emite nada que el contrato no declare.
 * Un observador registra cada respuesta real (método, ruta, status, código); después se exige que todo par
 * (status, código) esté declarado para esa operación en `OPERACIONES_WP02`, la misma fuente que genera
 * `docs/api/openapi.json` (09v7 T21).
 */
import type { INestApplication } from '@nestjs/common';
import { VERSION_VIGENTE } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { erroresDeclarados, OPERACIONES_WP02 } from '../../packages/domain/src/openapi';
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

it('TEST-CT: se ejercitan éxitos y errores de las siete operaciones autorizadas', async () => {
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

it('TEST-CT: todo (status, código) observado está declarado para su operación; los éxitos coinciden con el contrato', () => {
  const noDeclaradas: string[] = [];
  const porOperacion = new Map<string, Set<string>>();
  for (const o of observadas) {
    const op = OPERACIONES_WP02.find((x) => x.metodo === o.metodo && `/api/v1${x.ruta}` === o.ruta);
    if (!op) {
      noDeclaradas.push(`${o.metodo.toUpperCase()} ${o.ruta} (operación fuera del contrato)`);
      continue;
    }
    const vistos = porOperacion.get(op.id) ?? new Set<string>();
    vistos.add(`${o.status}${o.codigo ? ` ${o.codigo}` : ''}`);
    porOperacion.set(op.id, vistos);
    if (o.status < 400) {
      if (o.status !== op.exito.status) noDeclaradas.push(`${op.id}: éxito ${o.status} (declarado ${op.exito.status})`);
      continue;
    }
    const declarados = erroresDeclarados(op.id)[String(o.status)] ?? [];
    if (!o.codigo || !declarados.includes(o.codigo)) noDeclaradas.push(`${op.id}: ${o.status} ${o.codigo ?? '(sin ErrorEnvelope)'}`);
  }
  process.stdout.write(`${JSON.stringify({ prueba: 'TEST-CT', observadas: Object.fromEntries([...porOperacion].map(([k, v]) => [k, [...v].sort()])) })}\n`);
  expect(noDeclaradas).toEqual([]);
  expect([...porOperacion.keys()].sort()).toEqual(OPERACIONES_WP02.map((o) => o.id).sort());
});
