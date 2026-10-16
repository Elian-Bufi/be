/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138) · entrar con Google, verificado por la API (API-GOO-01 a 03), contra PostgreSQL
 * real y un Google falso local (`soporte-google.ts`): ninguna prueba llama a Google.
 * RF-003 · 05 UC-E05 (E01 proveedor indisponible, E02 identidad ambigua, E03 resultado no verificable) · 06 §5.6
 * (REG-06-21, INV-06-21, INV-06-24) · 08 §24.1, §24.5, §24.6 y §24.7 a.
 */
import type { INestApplication } from '@nestjs/common';
import { IniciarSesionResponseSchema, MeResponseSchema, VERSION_VIGENTE } from '@be/domain';
import { Prisma, PrismaClient } from '@prisma/client';
import request from 'supertest';
import {
  appDePrueba,
  conSesion,
  correoSintetico,
  CREDENCIAL_SINTETICA,
  DECLARACION_DE_MAYORIA,
  entornoDePrueba,
  login,
  OTRA_CREDENCIAL_SINTETICA,
  registrar,
  registrarOk,
  transicionPorServicio,
} from './soporte-api';
import {
  CLIENTE_APK,
  claveDeGoogle,
  googleDePrueba,
  idTokenDeGoogle,
  levantarGoogleFalso,
  reclamosDeGoogle,
  subSintetico,
  type GoogleFalso,
} from './soporte-google';

const prisma = new PrismaClient();
let google: GoogleFalso;
let app: INestApplication;

beforeAll(async () => {
  google = await levantarGoogleFalso();
  app = await appDePrueba(googleDePrueba(google));
});
afterAll(async () => {
  await app.close();
  await google.cerrar();
  await prisma.$disconnect();
});

const NEUTRAL = { error: { code: 'INVALID_CREDENTIALS', message: 'No pudimos verificar los datos de acceso.' } };
const RUTA = '/api/v1/auth/federated/google';

function entrar(a: INestApplication, idToken: string, superficie?: 'WEB' | 'APK') {
  const req = request(a.getHttpServer()).post(`${RUTA}/sessions`);
  if (superficie) req.set('X-BE-Surface', superficie);
  return req.send({ idToken });
}

function vincular(a: INestApplication, idToken: string, credential: string) {
  return request(a.getHttpServer()).post(`${RUTA}/links`).send({ idToken, credential });
}

function crear(a: INestApplication, idToken: string, cambios: Record<string, unknown> = {}, superficie?: 'WEB' | 'APK') {
  const req = request(a.getHttpServer()).post(`${RUTA}/registrations`);
  if (superficie) req.set('X-BE-Surface', superficie);
  return req.send({
    idToken,
    registrationIntent: 'ADVISEE',
    termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
    privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
    adultDeclaration: DECLARACION_DE_MAYORIA,
    ...cambios,
  });
}

/** Una cuenta de Google sintética: su `sub`, su correo y un ID token válido. */
function cuentaDeGoogle(etiqueta: string, cambios: Record<string, unknown> = {}) {
  const sub = subSintetico();
  const correo = correoSintetico(etiqueta);
  return { sub, correo, token: idTokenDeGoogle(google, reclamosDeGoogle(sub, correo, cambios)) };
}

async function crearConGoogle(etiqueta: string): Promise<{ sub: string; correo: string; token: string; id: string }> {
  const cuenta = cuentaDeGoogle(etiqueta);
  const res = await crear(app, cuenta.token).expect(201);
  return { ...cuenta, id: res.body.data.actor.identityId as string };
}

describe('API-GOO-03 — crear la cuenta con Google', () => {
  it('crea la identidad con el método GOOGLE (el sub y el correo verificado, sin contraseña), A1, A2 y la declaración de mayoría de edad, y abre la sesión', async () => {
    const sub = subSintetico();
    const correo = correoSintetico('goo-alta');
    // Google puede mandar el correo con mayúsculas: se normaliza como el identificador local.
    const token = idTokenDeGoogle(google, reclamosDeGoogle(sub, correo.toUpperCase()));
    const res = await crear(app, token, {}, 'APK').expect(201);
    const cuerpo = IniciarSesionResponseSchema.parse(res.body);
    expect(cuerpo.data.session).toMatchObject({ tokenType: 'Bearer', renewable: false });
    expect(cuerpo.data.actor.accountOperationalState).toBe('OPERATIVA');
    const id = cuerpo.data.actor.identityId;

    const metodos = await prisma.metodoDeAcceso.findMany({ where: { identidadId: id }, include: { credencialLocal: true } });
    expect(metodos).toHaveLength(1);
    expect(metodos[0]).toMatchObject({ tipo: 'GOOGLE', referencia: sub, correo, credencialLocal: null });
    expect(metodos[0].procedencia).toMatchObject({ casoDeUso: 'UC-P25', operacion: 'API-GOO-03', superficie: 'APK' });

    // 08 §12.2 y §24.7 a: los tres actos del alta, cada uno con su versión, hash, finalidad y superficie.
    const actos = await prisma.actoRegistrable.findMany({ where: { identidadId: id } });
    expect(actos.map((a) => a.tipo).sort()).toEqual(['MAYORIA_DE_EDAD', 'PRIVACIDAD_INFO', 'TERMINOS']);
    for (const acto of actos) {
      const version = VERSION_VIGENTE[acto.tipo as 'TERMINOS' | 'PRIVACIDAD_INFO' | 'MAYORIA_DE_EDAD'];
      expect(acto).toMatchObject({ estado: 'VIGENTE', versionDeTextoId: version.id, hashDelTexto: version.hash, finalidad: version.finalidad, superficie: 'APK', actorId: id, autoriaId: id });
    }
    const eventos = await prisma.eventoDeDominio.findMany({ where: { identidadId: id } });
    expect(eventos.map((e) => e.tipo).sort()).toEqual(['IdentidadCreada', 'MetodoDeAccesoAsociado']);
    expect(eventos.find((e) => e.tipo === 'IdentidadCreada')?.datos).toEqual({ registrationIntent: 'ADVISEE' });
    expect(eventos.find((e) => e.tipo === 'MetodoDeAccesoAsociado')?.datos).toEqual({ metodoDeAccesoId: metodos[0].id, tipo: 'GOOGLE' });
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { sujetoId: id, operacion: 'API-GOO-03' } });
    expect(auditoria.map((f) => `${f.resultado} ${f.recursoTipo}`).sort()).toEqual(['EXITO Identidad', 'EXITO Sesion']);

    // La sesión es la de siempre: /me responde con la identidad nueva, sin A3 ni rol.
    const me = MeResponseSchema.parse((await conSesion(app, cuerpo.data.session.accessToken).get('/api/v1/me').expect(200)).body);
    expect(me.data).toMatchObject({ identityId: id, registrationIntent: 'ADVISEE', actorCapabilities: [] });
    expect(await prisma.sesion.findUniqueOrThrow({ where: { id: cuerpo.data.session.id } })).toMatchObject({ identidadId: id, superficie: 'APK', estado: 'ACTIVA' });
  });

  it.each([
    ['sin la declaración', { adultDeclaration: undefined }, 'adultDeclaration', 'ADULT_DECLARATION_REQUIRED'],
    ['con la declaración sin marcar', { adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: false } }, 'adultDeclaration.declared', 'ADULT_DECLARATION_REQUIRED'],
    ['con otra versión de la declaración', { adultDeclaration: { versionId: 'mayoria-de-edad-vieja', declared: true } }, 'adultDeclaration.versionId', 'ADULT_DECLARATION_VERSION_NOT_ACCEPTABLE'],
  ])('%s: 422 VALIDATION_FAILED con el issue preciso, y no se crea nada', async (_caso, cambio, path, code) => {
    const cuenta = cuentaDeGoogle('goo-sin-mayoria');
    const res = await crear(app, cuenta.token, cambio).expect(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details.issues).toEqual([{ code, path }]);
    expect(await prisma.metodoDeAcceso.count({ where: { tipo: 'GOOGLE', referencia: cuenta.sub } })).toBe(0);
  });

  it('versiones de términos o privacidad no vigentes: los mismos 422 que el alta local', async () => {
    const cuenta = cuentaDeGoogle('goo-versiones');
    expect((await crear(app, cuenta.token, { termsAcceptance: { versionId: 'terminos-vieja' } }).expect(422)).body.error.code).toBe('TERMS_VERSION_NOT_ACCEPTABLE');
    expect((await crear(app, cuenta.token, { privacyAcknowledgement: { versionId: 'privacidad-vieja' } }).expect(422)).body.error.code).toBe('PRIVACY_VERSION_NOT_ACCEPTABLE');
  });

  it('con una cuenta de Google que ya tiene identidad: 200 y una sesión nueva de la misma identidad, sin duplicar nada (un reintento)', async () => {
    const creada = await crearConGoogle('goo-reintento');
    const res = await crear(app, creada.token).expect(200);
    expect(IniciarSesionResponseSchema.parse(res.body).data.actor.identityId).toBe(creada.id);
    expect(await prisma.metodoDeAcceso.count({ where: { identidadId: creada.id } })).toBe(1);
    expect(await prisma.actoRegistrable.count({ where: { identidadId: creada.id } })).toBe(3);
    expect(await prisma.sesion.count({ where: { identidadId: creada.id } })).toBe(2);
  });

  it('seis altas simultáneas con la misma cuenta de Google terminan en una sola identidad (una 201 y cinco 200)', async () => {
    const cuenta = cuentaDeGoogle('goo-simultaneas');
    const respuestas = await Promise.all(Array.from({ length: 6 }, () => crear(app, cuenta.token)));
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 200, 200, 200, 200, 201]);
    expect(new Set(respuestas.map((r) => r.body.data.actor.identityId)).size).toBe(1);
    expect(await prisma.metodoDeAcceso.count({ where: { tipo: 'GOOGLE', referencia: cuenta.sub } })).toBe(1);
    expect(await prisma.identidad.count({ where: { metodosDeAcceso: { some: { correo: cuenta.correo } } } })).toBe(1);
  });
});

describe('API-GOO-01 — iniciar sesión con Google', () => {
  it('la identidad que ya tiene esa cuenta de Google entra: la misma sesión que API-ACC-02, con su superficie y su auditoría', async () => {
    const creada = await crearConGoogle('goo-entrar');
    const res = await entrar(app, creada.token, 'WEB').expect(201);
    const cuerpo = IniciarSesionResponseSchema.parse(res.body);
    expect(cuerpo.data.actor).toEqual({ identityId: creada.id, accountOperationalState: 'OPERATIVA' });
    const vence = new Date(cuerpo.data.session.expiresAt).getTime() - Date.now();
    expect(vence).toBeGreaterThan(11.9 * 3600 * 1000);
    expect(vence).toBeLessThanOrEqual(12 * 3600 * 1000);
    expect(await prisma.sesion.findUniqueOrThrow({ where: { id: cuerpo.data.session.id } })).toMatchObject({ superficie: 'WEB', estado: 'ACTIVA' });
    const fila = await prisma.registroDeAuditoria.findFirst({ where: { requestId: res.headers['x-request-id'] } });
    expect(fila).toMatchObject({ operacion: 'API-GOO-01', resultado: 'EXITO', recursoTipo: 'Sesion', actorId: creada.id });
    // El token de Google también sirve con el client ID de la APK.
    const desdeLaApk = idTokenDeGoogle(google, reclamosDeGoogle(creada.sub, creada.correo, { aud: CLIENTE_APK, azp: CLIENTE_APK }));
    await entrar(app, desdeLaApk, 'APK').expect(201);
  });

  it('sin una identidad con esa cuenta de Google ni con ese correo: 404 GOOGLE_ACCOUNT_NOT_FOUND con el correo, y no se crea nada', async () => {
    const cuenta = cuentaDeGoogle('goo-nadie');
    const res = await entrar(app, cuenta.token).expect(404);
    expect(res.body.error).toMatchObject({ code: 'GOOGLE_ACCOUNT_NOT_FOUND', details: { email: cuenta.correo } });
    expect(await prisma.metodoDeAcceso.count({ where: { OR: [{ referencia: cuenta.sub }, { correo: cuenta.correo }] } })).toBe(0);
  });

  it('una cuenta suspendida o cerrada no abre sesión: el mismo 401 neutral que el login (UC-P26 E02)', async () => {
    const suspendida = await crearConGoogle('goo-suspendida');
    await transicionPorServicio(app, suspendida.id, 'SuspenderCuenta');
    const r1 = await entrar(app, suspendida.token).expect(401);
    expect(r1.body).toEqual(NEUTRAL);
    expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId: r1.headers['x-request-id'] } })).toMatchObject({ operacion: 'API-GOO-01', resultado: 'RECHAZO', motivo: 'CUENTA_SUSPENDIDA' });

    const cerrada = await crearConGoogle('goo-cerrada');
    const sesion = (await entrar(app, cerrada.token).expect(201)).body.data.session.accessToken as string;
    await conSesion(app, sesion)
      .post('/api/v1/me/account-closure-requests')
      .send({ consequencesAcknowledgement: { versionId: VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id }, confirmed: true })
      .expect(201);
    expect((await entrar(app, cerrada.token).expect(401)).body).toEqual(NEUTRAL);
    // Y con la cuenta cerrada, la misma cuenta de Google no crea otra identidad: el alta responde como el inicio de sesión.
    expect((await crear(app, cerrada.token).expect(401)).body).toEqual(NEUTRAL);
    expect(await prisma.metodoDeAcceso.count({ where: { tipo: 'GOOGLE', referencia: cerrada.sub } })).toBe(1);
  });

  it('cuerpo con campos de más, token desmedido o parámetros de query: 400, sin consultar las claves', async () => {
    const consultas = google.consultas();
    const servidor = app.getHttpServer();
    expect((await request(servidor).post(`${RUTA}/sessions`).send({ idToken: 'x', role: 'ADMIN' }).expect(400)).body.error.code).toBe('UNKNOWN_FIELD');
    expect((await request(servidor).post(`${RUTA}/sessions`).send({ idToken: 'x'.repeat(4097) }).expect(400)).body.error.code).toBe('INVALID_REQUEST');
    expect((await request(servidor).post(`${RUTA}/sessions?idToken=x`).send({ idToken: 'x' }).expect(400)).body.error.code).toBe('INVALID_REQUEST');
    expect(google.consultas()).toBe(consultas);
  });
});

describe('UC-E05 E02 — una cuenta con contraseña y el mismo correo: Google se vincula solo con esa contraseña', () => {
  it('vincular exige la contraseña; con la incorrecta, el 401 del login; con la correcta, el método GOOGLE en la misma identidad, y después se entra solo con Google', async () => {
    const correo = correoSintetico('goo-vincular');
    const id = await registrarOk(app, correo);
    const sub = subSintetico();
    const token = idTokenDeGoogle(google, reclamosDeGoogle(sub, correo));

    // Entrar o crear con Google no vincula ni crea: dice que hace falta la contraseña (nunca una identidad paralela).
    const sesionesAntes = await prisma.sesion.count({ where: { identidadId: id } });
    const requerida = await entrar(app, token).expect(409);
    expect(requerida.body.error).toMatchObject({ code: 'GOOGLE_LINK_REQUIRED', details: { email: correo } });
    expect((await crear(app, token).expect(409)).body.error.code).toBe('GOOGLE_LINK_REQUIRED');
    expect(await prisma.metodoDeAcceso.count({ where: { tipo: 'GOOGLE', referencia: sub } })).toBe(0);
    expect(await prisma.identidad.count({ where: { metodosDeAcceso: { some: { OR: [{ referencia: correo }, { correo }] } } } })).toBe(1);

    // La contraseña incorrecta: exactamente la respuesta del login, y nada se vincula.
    const incorrecta = await vincular(app, token, OTRA_CREDENCIAL_SINTETICA).expect(401);
    expect(incorrecta.body).toEqual(NEUTRAL);
    expect(incorrecta.body).toEqual((await login(app, correo, OTRA_CREDENCIAL_SINTETICA).expect(401)).body);
    expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId: incorrecta.headers['x-request-id'] } })).toMatchObject({ operacion: 'API-GOO-02', resultado: 'RECHAZO', motivo: 'CREDENCIAL_INCORRECTA', sujetoId: id });
    expect(await prisma.metodoDeAcceso.count({ where: { tipo: 'GOOGLE', referencia: sub } })).toBe(0);
    expect(await prisma.sesion.count({ where: { identidadId: id } })).toBe(sesionesAntes);

    // La correcta: la misma identidad, con el método GOOGLE, el hecho y la auditoría del cambio de método (08 §24.6).
    const vinculada = await vincular(app, token, CREDENCIAL_SINTETICA).expect(201);
    expect(IniciarSesionResponseSchema.parse(vinculada.body).data.actor.identityId).toBe(id);
    const google1 = await prisma.metodoDeAcceso.findFirstOrThrow({ where: { tipo: 'GOOGLE', referencia: sub } });
    expect(google1).toMatchObject({ identidadId: id, correo });
    expect(google1.procedencia).toMatchObject({ casoDeUso: 'UC-E05', operacion: 'API-GOO-02' });
    const evento = await prisma.eventoDeDominio.findFirst({ where: { identidadId: id, tipo: 'MetodoDeAccesoAsociado', datos: { path: ['tipo'], equals: 'GOOGLE' } } });
    expect(evento).toMatchObject({ actorId: id, datos: { metodoDeAccesoId: google1.id, tipo: 'GOOGLE' } });
    const filas = await prisma.registroDeAuditoria.findMany({ where: { requestId: vinculada.headers['x-request-id'] }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(filas.map((f) => `${f.operacion} ${f.resultado} ${f.recursoTipo}`).sort()).toEqual(['API-GOO-02 EXITO MetodoDeAcceso', 'API-GOO-02 EXITO Sesion']);

    // Después: se entra con Google sin contraseña, a la misma identidad; y el correo y la contraseña siguen sirviendo.
    expect((await entrar(app, token).expect(201)).body.data.actor.identityId).toBe(id);
    expect((await login(app, correo).expect(201)).body.data.actor.identityId).toBe(id);
    // Repetir la vinculación (un reintento) abre otra sesión sin duplicar el método.
    await vincular(app, token, CREDENCIAL_SINTETICA).expect(201);
    expect(await prisma.metodoDeAcceso.count({ where: { identidadId: id } })).toBe(2);
  });

  it('vincular con un correo sin cuenta con contraseña: el mismo 401 neutral; una cuenta que ya tiene otra cuenta de Google: 409 GOOGLE_ACCOUNT_ALREADY_LINKED', async () => {
    const sinCuenta = cuentaDeGoogle('goo-vincular-nadie');
    expect((await vincular(app, sinCuenta.token, CREDENCIAL_SINTETICA).expect(401)).body).toEqual(NEUTRAL);
    // Una cuenta creada con Google no tiene contraseña que confirmar: el mismo 401.
    const conGoogle = await crearConGoogle('goo-vincular-sin-clave');
    expect((await vincular(app, conGoogle.token, CREDENCIAL_SINTETICA).expect(401)).body).toEqual(NEUTRAL);

    const correo = correoSintetico('goo-otra-cuenta');
    await registrarOk(app, correo);
    await vincular(app, idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correo)), CREDENCIAL_SINTETICA).expect(201);
    const otra = idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correo));
    expect((await entrar(app, otra).expect(409)).body.error.code).toBe('GOOGLE_LINK_REQUIRED');
    expect((await vincular(app, otra, CREDENCIAL_SINTETICA).expect(409)).body.error.code).toBe('GOOGLE_ACCOUNT_ALREADY_LINKED');
  });

  it('vincular comparte el cupo de intentos del login para ese correo: no es otra vía para probar contraseñas (08 §24.5)', async () => {
    const limites = { ...entornoDePrueba().limites, login: { maximo: 2, ventanaMs: 60_000 } };
    const conLimite = await appDePrueba({ ...googleDePrueba(google), limites });
    try {
      const correo = correoSintetico('goo-cupo');
      await registrar(conLimite, correo).expect(201);
      const token = idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correo));
      await vincular(conLimite, token, OTRA_CREDENCIAL_SINTETICA).expect(401);
      await vincular(conLimite, token, OTRA_CREDENCIAL_SINTETICA).expect(401);
      // El tercer intento, por cualquiera de las dos vías y aun con la contraseña correcta, ya no se prueba.
      expect((await login(conLimite, correo).expect(429)).body.error.code).toBe('RATE_LIMITED');
      expect((await vincular(conLimite, token, CREDENCIAL_SINTETICA).expect(429)).body.error.code).toBe('RATE_LIMITED');
    } finally {
      await conLimite.close();
    }
  });
});

describe('RF-001 e INV-06-21 — un correo es de una sola identidad, también entre métodos', () => {
  it('el alta local con el correo de una cuenta creada con Google: el mismo 409 neutral del registro', async () => {
    const creada = await crearConGoogle('goo-luego-local');
    const res = await registrar(app, creada.correo).expect(409);
    expect(res.body).toEqual({ error: { code: 'REGISTRATION_NOT_AVAILABLE', message: 'No pudimos completar el registro con esos datos.' } });
    expect(await prisma.metodoDeAcceso.count({ where: { tipo: 'LOCAL', referencia: creada.correo } })).toBe(0);
  });

  it('la base tampoco deja pasar una segunda identidad con ese correo, una segunda cuenta de Google en una identidad, ni un GOOGLE sin correo', async () => {
    const creada = await crearConGoogle('goo-base');
    const otra = await registrarOk(app, correoSintetico('goo-base-otra'));
    const procedencia = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'INSERCION_DIRECTA', superficie: null, requestId: null };
    const fallas = [
      // El correo de la cuenta de Google, como identificador local de otra identidad.
      prisma.metodoDeAcceso.create({ data: { identidadId: otra, tipo: 'LOCAL', referencia: creada.correo, procedencia } }),
      // Otra cuenta de Google con el mismo correo en otra identidad.
      prisma.metodoDeAcceso.create({ data: { identidadId: otra, tipo: 'GOOGLE', referencia: subSintetico(), correo: creada.correo, procedencia } }),
      // Una segunda cuenta de Google en la misma identidad.
      prisma.metodoDeAcceso.create({ data: { identidadId: creada.id, tipo: 'GOOGLE', referencia: subSintetico(), correo: creada.correo, procedencia } }),
    ];
    for (const falla of fallas) {
      const error = await falla.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((error as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    }
    // Un GOOGLE sin correo, o un LOCAL con correo: el CHECK.
    await expect(prisma.metodoDeAcceso.create({ data: { identidadId: otra, tipo: 'GOOGLE', referencia: subSintetico(), procedencia } })).rejects.toThrow(/metodo_de_acceso_correo_solo_de_google/);
    await expect(prisma.metodoDeAcceso.create({ data: { identidadId: otra, tipo: 'LOCAL', referencia: correoSintetico('x'), correo: 'x@example.invalid', procedencia } })).rejects.toThrow(
      /metodo_de_acceso_correo_solo_de_google/,
    );
    // La declaración de mayoría de edad: una por identidad, del titular, y no se revoca.
    const acto = await prisma.actoRegistrable.findFirstOrThrow({ where: { identidadId: creada.id, tipo: 'MAYORIA_DE_EDAD' } });
    const segunda = await prisma.actoRegistrable.create({ data: { ...acto, id: undefined, momentoDeRegistro: undefined, procedencia: acto.procedencia as Prisma.InputJsonValue } }).catch((e: unknown) => e);
    expect((segunda as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    await expect(prisma.actoRegistrable.update({ where: { id: acto.id }, data: { estado: 'REVOCADO', momentoDeRevocacion: new Date() } })).rejects.toThrow(/TRANSICION_NO_DECLARADA/);
    await expect(
      prisma.actoRegistrable.create({ data: { ...acto, id: undefined, identidadId: otra, actorId: creada.id, momentoDeRegistro: undefined, procedencia: acto.procedencia as Prisma.InputJsonValue } }),
    ).rejects.toThrow(/la declara su titular/);
  });
});

describe('UC-E05 E03 — un resultado de Google que no se puede verificar no abre nada', () => {
  const otraClave = claveDeGoogle('clave-sintetica-de-prueba');

  it.each([
    ['firmado con otra clave', () => idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correoSintetico('goo-firma')), { clave: otraClave }), 401, 'GOOGLE_TOKEN_INVALID', 'TOKEN_FIRMA'],
    ['para otra aplicación (audiencia ajena)', () => idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correoSintetico('goo-aud'), { aud: '000000000009-otraapp.apps.googleusercontent.com', azp: undefined })), 401, 'GOOGLE_TOKEN_INVALID', 'TOKEN_AUDIENCIA'],
    ['vencido', () => idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correoSintetico('goo-vencido'), { iat: Math.floor(Date.now() / 1000) - 7200, exp: Math.floor(Date.now() / 1000) - 3600 })), 401, 'GOOGLE_TOKEN_INVALID', 'TOKEN_VENCIDO'],
    ['de otro emisor', () => idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correoSintetico('goo-iss'), { iss: 'https://emisor-sintetico.example.invalid' })), 401, 'GOOGLE_TOKEN_INVALID', 'TOKEN_EMISOR'],
    ['con alg none', () => idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correoSintetico('goo-none')), { alg: 'none' }), 401, 'GOOGLE_TOKEN_INVALID', 'TOKEN_ALGORITMO'],
    ['con el correo sin verificar', () => idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correoSintetico('goo-sin-verificar'), { email_verified: false })), 422, 'GOOGLE_EMAIL_NOT_VERIFIED', 'CORREO_NO_VERIFICADO'],
  ])('un ID token %s se rechaza en las tres operaciones, queda en la auditoría y no crea nada', async (_caso, fabricar, status, code, motivo) => {
    const token = fabricar();
    for (const res of [await entrar(app, token), await vincular(app, token, CREDENCIAL_SINTETICA), await crear(app, token)]) {
      expect(res.status).toBe(status);
      expect(res.body.error.code).toBe(code);
      expect(JSON.stringify(res.body)).not.toContain(token.split('.')[2]);
      expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId: res.headers['x-request-id'] } })).toMatchObject({ resultado: 'RECHAZO', motivo });
    }
    const reclamos = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { sub: string };
    expect(await prisma.metodoDeAcceso.count({ where: { referencia: reclamos.sub } })).toBe(0);
  });

  it('el ID token no queda en ningún registro de la base: ni la auditoría, ni los hechos, ni la procedencia', async () => {
    const creada = await crearConGoogle('goo-sin-rastro');
    await entrar(app, creada.token).expect(201);
    const firma = creada.token.split('.')[2];
    const [{ apariciones }] = await prisma.$queryRaw<{ apariciones: bigint }[]>`
      SELECT (SELECT count(*) FROM "registro_de_auditoria" t WHERE row_to_json(t)::text LIKE ${`%${firma}%`})
           + (SELECT count(*) FROM "evento_de_dominio" t WHERE row_to_json(t)::text LIKE ${`%${firma}%`})
           + (SELECT count(*) FROM "metodo_de_acceso" t WHERE row_to_json(t)::text LIKE ${`%${firma}%`})
           + (SELECT count(*) FROM "acto_registrable" t WHERE row_to_json(t)::text LIKE ${`%${firma}%`})
           + (SELECT count(*) FROM "identidad" t WHERE row_to_json(t)::text LIKE ${`%${firma}%`}) AS "apariciones"`;
    expect(Number(apariciones)).toBe(0);
  });
});

describe('UC-E05 E01 — Google no disponible: se informa y el acceso local sigue', () => {
  it('sin GOOGLE_CLIENT_IDS, las tres operaciones responden 503 DEPENDENCY_UNAVAILABLE con el acceso local a mano, y el correo y la contraseña siguen funcionando', async () => {
    const sinGoogle = await appDePrueba();
    try {
      const cuenta = cuentaDeGoogle('goo-sin-config');
      for (const res of [await entrar(sinGoogle, cuenta.token), await vincular(sinGoogle, cuenta.token, CREDENCIAL_SINTETICA), await crear(sinGoogle, cuenta.token)]) {
        expect(res.status).toBe(503);
        expect(res.body.error).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', details: { fallback: { localAccess: true } } });
        expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId: res.headers['x-request-id'] } })).toMatchObject({ resultado: 'RECHAZO', motivo: 'GOOGLE_NO_CONFIGURADO' });
      }
      const correo = correoSintetico('goo-sin-config-local');
      await registrar(sinGoogle, correo).expect(201);
      await login(sinGoogle, correo).expect(201);
    } finally {
      await sinGoogle.close();
    }
  });

  it('con Google caído antes de leer sus claves: 503; con las claves ya leídas, se sigue entrando aunque Google no responda', async () => {
    const propia = await appDePrueba(googleDePrueba(google));
    try {
      const creada = await crearConGoogle('goo-caido');
      google.caer(true);
      const caida = await entrar(propia, creada.token).expect(503);
      expect(caida.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
      expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId: caida.headers['x-request-id'] } })).toMatchObject({ motivo: 'CLAVES_NO_DISPONIBLES' });
      google.caer(false);
      await entrar(propia, creada.token).expect(201);
      google.caer(true);
      await entrar(propia, creada.token).expect(201);
    } finally {
      google.caer(false);
      await propia.close();
    }
  });
});
