/**
 * TEST-RNF-SEC-002 · TEST-RNF-OBS-001 · TEST-RUN-009 — secretos y datos personales fuera de logs, auditoría y respuestas
 * (08:989 «test de sanitización»; 07:2972; 08 §30). Recorrido completo con errores incluidos, capturando stdout y stderr.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CuentaPropiaService } from '../../apps/api/src/identidad/cuenta-propia.service';
import {
  appDePrueba,
  conSesion,
  correoSintetico,
  cuerpoDeCierre,
  CREDENCIAL_SINTETICA,
  login,
  OTRA_CREDENCIAL_SINTETICA,
  registrar,
} from './soporte-api';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

async function capturando(fn: () => Promise<void>): Promise<string> {
  const lineas: string[] = [];
  const escribir = (flujo: NodeJS.WriteStream) => {
    const original = flujo.write.bind(flujo) as (...a: unknown[]) => boolean;
    return ((trozo: unknown, ...resto: unknown[]) => {
      lineas.push(String(trozo));
      return original(trozo, ...resto);
    }) as typeof flujo.write;
  };
  // Se capturan las funciones originales ANTES de reemplazarlas (si no, el espía se llama a sí mismo).
  const haciaStdout = escribir(process.stdout);
  const haciaStderr = escribir(process.stderr);
  const out = jest.spyOn(process.stdout, 'write').mockImplementation(haciaStdout);
  const err = jest.spyOn(process.stderr, 'write').mockImplementation(haciaStderr);
  try {
    await fn();
  } finally {
    out.mockRestore();
    err.mockRestore();
  }
  return lineas.join('');
}

it('TEST-RNF-SEC-002 / TEST-RNF-OBS-001 / TEST-RUN-009: ni credenciales, ni tokens, ni hashes, ni correos, ni IP en logs, auditoría o respuestas', async () => {
  const correo = correoSintetico('sanitizacion');
  const respuestas: string[] = [];
  let token = '';
  let identidadId = '';

  const log = await capturando(async () => {
    const alta = await registrar(app, correo, { superficie: 'WEB' }).expect(201);
    identidadId = alta.body.data.identityId;
    respuestas.push(JSON.stringify(alta.body));
    respuestas.push(JSON.stringify((await registrar(app, correo).expect(409)).body));
    respuestas.push(JSON.stringify((await login(app, correo, OTRA_CREDENCIAL_SINTETICA).expect(401)).body));
    respuestas.push(JSON.stringify((await login(app, correoSintetico('nadie'), CREDENCIAL_SINTETICA).expect(401)).body));
    const sesion = await login(app, correo).expect(201);
    token = sesion.body.data.session.accessToken;
    respuestas.push(JSON.stringify((await conSesion(app, token).get('/api/v1/me').expect(200)).body));
    respuestas.push(JSON.stringify((await conSesion(app, `${token}x`).get('/api/v1/me').expect(401)).body));
    respuestas.push(JSON.stringify((await conSesion(app, token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(201)).body));
  });

  const prohibidos = [CREDENCIAL_SINTETICA, OTRA_CREDENCIAL_SINTETICA, token, correo, correo.split('@')[0], '127.0.0.1', '::ffff:'];
  for (const secreto of prohibidos) expect(log).not.toContain(secreto);
  expect(log).not.toMatch(/\$2[aby]\$\d{2}\$/); // ningún hash bcrypt
  expect(log).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ/); // ningún JWT

  // Lo que sí debe estar: la línea técnica con requestId y ruta parametrizada, sin cuerpos.
  expect(log).toMatch(/"ruta":"\/api\/v1\/registrations"/);
  expect(log).toMatch(/"ruta":"\/api\/v1\/auth\/sessions"/);

  const cuerpos = respuestas.join('\n');
  for (const secreto of [CREDENCIAL_SINTETICA, OTRA_CREDENCIAL_SINTETICA, correo]) expect(cuerpos).not.toContain(secreto);
  expect(cuerpos).not.toMatch(/\$2[aby]\$\d{2}\$/);

  // Auditoría probatoria: identificadores opacos, nunca el correo, la IP ni el user-agent (08:658).
  const auditoria = await prisma.registroDeAuditoria.findMany({ where: { OR: [{ sujetoId: identidadId }, { actorId: identidadId }] } });
  expect(auditoria.length).toBeGreaterThanOrEqual(4);
  const textoDeAuditoria = JSON.stringify(auditoria);
  for (const dato of [correo, CREDENCIAL_SINTETICA, token, '127.0.0.1']) expect(textoDeAuditoria).not.toContain(dato);
});

it('TEST-RUN-009: un error no clasificado deja en el log solo tipo y requestId, nunca el mensaje', async () => {
  const espia = jest.spyOn(app.get(CuentaPropiaService), 'consultar').mockRejectedValue(new Error(`fallo con dato ${CREDENCIAL_SINTETICA}`));
  const correo = correoSintetico('error-500');
  await registrar(app, correo).expect(201);
  const sesion = await login(app, correo).expect(201);
  let cuerpo = '';
  const log = await capturando(async () => {
    const res = await conSesion(app, sesion.body.data.session.accessToken).get('/api/v1/me').expect(500);
    cuerpo = JSON.stringify(res.body);
  });
  espia.mockRestore();
  expect(JSON.parse(cuerpo)).toEqual({ error: { code: 'INTERNAL_ERROR', message: expect.any(String) } });
  expect(log).toMatch(/"evento":"error_no_clasificado"/);
  expect(log).not.toContain(CREDENCIAL_SINTETICA);
  expect(cuerpo).not.toContain(CREDENCIAL_SINTETICA);
});
