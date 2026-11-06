/**
 * DL-147 · La sesión del website sobrevive a una recarga (encargo de consolidación de Dirección del 2026-10-19, bloque 3):
 * la cookie de reanudación (API-ACC-02-REANUDACION) contra PostgreSQL real.
 * - Al iniciar sesión en el website llega una cookie HttpOnly, Secure, SameSite=None y Partitioned, solo para
 *   /api/v1/auth/sessions; la APK no la recibe.
 * - Reanudar devuelve un token nuevo de la MISMA sesión (mismo id y mismo vencimiento) y rota la cookie.
 * - Dos pestañas que recargan a la vez: la cookie ya reemplazada vale dentro del margen, sin rotar; fuera de él, revoca.
 * - El servidor decide: una sesión cerrada, revocada, vencida o de una cuenta suspendida no se reanuda.
 */
import type { INestApplication } from '@nestjs/common';
import { IniciarSesionResponseSchema, MeResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import request from 'supertest';
import { COOKIE_DE_REANUDACION, MARGEN_DE_GRACIA_MS } from '../../apps/api/src/sesion/reanudacion.service';
import { appDePrueba, conSesion, correoSintetico, login, registrarOk, transicionPorServicio } from './soporte-api';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const huella = (secreto: string) => createHash('sha256').update(secreto).digest('hex');

/** La cookie de reanudación que manda una respuesta, con sus atributos; `null` si no manda ninguna. */
function cookieDe(res: request.Response): { valor: string; atributos: string[] } | null {
  const lista = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const linea = lista.find((c) => c.startsWith(`${COOKIE_DE_REANUDACION}=`));
  if (!linea) return null;
  const [par, ...atributos] = linea.split(';').map((p) => p.trim());
  return { valor: par.slice(par.indexOf('=') + 1), atributos };
}

const reanudar = (secreto: string | null, cambios: { superficie?: string | null; origen?: string } = {}, a: INestApplication = app) => {
  const req = request(a.getHttpServer()).post('/api/v1/auth/sessions/resume');
  if (cambios.superficie !== null) req.set('X-BE-Surface', cambios.superficie ?? 'WEB');
  if (cambios.origen) req.set('Origin', cambios.origen);
  if (secreto !== null) req.set('Cookie', `${COOKIE_DE_REANUDACION}=${secreto}`);
  return req.send();
};

async function entrarEnElWebsite(etiqueta: string) {
  const correo = correoSintetico(etiqueta);
  const identidadId = await registrarOk(app, correo, 'WEB');
  const res = await login(app, correo, undefined, 'WEB').expect(201);
  const sesion = IniciarSesionResponseSchema.parse(res.body).data.session;
  const cookie = cookieDe(res);
  if (!cookie) throw new Error('el login del website no mandó la cookie de reanudación');
  return { correo, identidadId, sesion, secreto: cookie.valor, atributos: cookie.atributos };
}

describe('DL-147 · la cookie de reanudación', () => {
  it('el login del website la manda HttpOnly, Secure, SameSite=None, Partitioned, con su ruta y que dura lo que la sesión; el de la APK, no', async () => {
    const web = await entrarEnElWebsite('reanudar-atributos');
    expect(web.secreto).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const atributos = web.atributos.map((a) => a.toLowerCase());
    expect(atributos).toEqual(expect.arrayContaining(['path=/api/v1/auth/sessions', 'httponly', 'secure', 'samesite=none', 'partitioned']));
    const maxAge = Number(atributos.find((a) => a.startsWith('max-age='))?.slice('max-age='.length));
    expect(maxAge).toBeGreaterThan(12 * 3600 - 60);
    expect(maxAge).toBeLessThanOrEqual(12 * 3600);
    // Solo la huella queda en la base, nunca el secreto.
    const filas = await prisma.reanudacionDeSesion.findMany({ where: { sesionId: web.sesion.id } });
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ huella: huella(web.secreto), predecesoraId: null });
    expect(JSON.stringify(filas)).not.toContain(web.secreto);

    const correo = correoSintetico('reanudar-apk');
    await registrarOk(app, correo, 'APK');
    const apk = await login(app, correo, undefined, 'APK').expect(201);
    expect(cookieDe(apk)).toBeNull();
    expect(await prisma.reanudacionDeSesion.count({ where: { sesionId: apk.body.data.session.id } })).toBe(0);
  });

  it('reanudar devuelve un token nuevo de la misma sesión, con el mismo vencimiento, y rota la cookie', async () => {
    const web = await entrarEnElWebsite('reanudar-ok');
    const res = await reanudar(web.secreto).expect(200);
    const sesion = IniciarSesionResponseSchema.parse(res.body).data.session;
    expect(sesion.id).toBe(web.sesion.id);
    expect(sesion.expiresAt).toBe(web.sesion.expiresAt);
    expect(sesion.renewable).toBe(false);
    const nueva = cookieDe(res);
    expect(nueva?.valor).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(nueva?.valor).not.toBe(web.secreto);
    // El token nuevo autentica, y es de la misma persona.
    const me = MeResponseSchema.parse((await conSesion(app, sesion.accessToken).get('/api/v1/me').expect(200)).body);
    expect(me.data.identityId).toBe(web.identidadId);
    expect(me.data.session.id).toBe(web.sesion.id);
    // La nueva reemplaza a la presentada.
    const cadena = await prisma.reanudacionDeSesion.findMany({ where: { sesionId: web.sesion.id } });
    expect(cadena).toHaveLength(2);
    const primera = cadena.find((r) => r.predecesoraId === null);
    expect(cadena.find((r) => r.predecesoraId === primera?.id)?.huella).toBe(huella(nueva!.valor));
  });

  it('sin cookie, con otra forma o desconocida: neutral, y la cookie con otra forma se borra', async () => {
    expect((await reanudar(null).expect(401)).body.error.code).toBe('AUTHENTICATION_REQUIRED');
    const mal = await reanudar('no-es-un-secreto').expect(401);
    expect(mal.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(cookieDe(mal)?.valor).toBe('');
    const desconocida = await reanudar(randomBytes(32).toString('base64url')).expect(401);
    expect(desconocida.body.error.code).toBe('SESSION_INVALID');
    expect(cookieDe(desconocida)?.valor).toBe('');
  });

  it('solo el website reanuda: con otra superficie o sin declararla, no', async () => {
    const web = await entrarEnElWebsite('reanudar-superficie');
    expect((await reanudar(web.secreto, { superficie: 'APK' }).expect(401)).body.error.code).toBe('AUTHENTICATION_REQUIRED');
    expect((await reanudar(web.secreto, { superficie: null }).expect(401)).body.error.code).toBe('AUTHENTICATION_REQUIRED');
    // La cookie sigue sirviendo desde el website.
    await reanudar(web.secreto).expect(200);
  });

  it('dos pestañas que recargan a la vez: la cookie reemplazada vale dentro del margen, sin rotar otra vez', async () => {
    const web = await entrarEnElWebsite('reanudar-dos-pestanas');
    const primera = await reanudar(web.secreto).expect(200);
    const segunda = await reanudar(web.secreto).expect(200);
    expect(cookieDe(segunda)).toBeNull();
    expect(segunda.body.data.session.id).toBe(web.sesion.id);
    expect(await prisma.reanudacionDeSesion.count({ where: { sesionId: web.sesion.id } })).toBe(2);
    // La vigente sigue rotando.
    await reanudar(cookieDe(primera)!.valor).expect(200);
    expect(await prisma.reanudacionDeSesion.count({ where: { sesionId: web.sesion.id } })).toBe(3);
  });

  it('pedidos simultáneos con la misma cookie: todos responden, rota una sola vez y la cadena no se bifurca', async () => {
    const web = await entrarEnElWebsite('reanudar-simultaneos');
    const respuestas = await Promise.all([1, 2, 3, 4].map(() => reanudar(web.secreto)));
    expect(respuestas.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    expect(respuestas.filter((r) => cookieDe(r) !== null)).toHaveLength(1);
    expect(await prisma.reanudacionDeSesion.count({ where: { sesionId: web.sesion.id } })).toBe(2);
  });

  it('una cookie reemplazada fuera del margen es una copia: revoca la sesión', async () => {
    const web = await entrarEnElWebsite('reanudar-reuso');
    const primera = await prisma.reanudacionDeSesion.findFirstOrThrow({ where: { sesionId: web.sesion.id } });
    // La reemplazó otra reanudación hace más que el margen (se agrega como lo haría la API, con su fecha).
    await prisma.reanudacionDeSesion.create({
      data: { sesionId: web.sesion.id, predecesoraId: primera.id, huella: huella(randomBytes(32).toString('base64url')), momentoDeRegistro: new Date(Date.now() - MARGEN_DE_GRACIA_MS - 60_000) },
    });
    const res = await reanudar(web.secreto).expect(401);
    expect(res.body.error.code).toBe('SESSION_INVALID');
    expect(cookieDe(res)?.valor).toBe('');
    const sesion = await prisma.sesion.findUniqueOrThrow({ where: { id: web.sesion.id } });
    expect(sesion).toMatchObject({ estado: 'REVOCADA', motivoDeRevocacion: 'REANUDACION_REUTILIZADA' });
    // El token que tenía la pestaña tampoco sirve: la revocación es de la sesión.
    await conSesion(app, web.sesion.accessToken).get('/api/v1/me').expect(401);
  });

  it('cerrar la sesión borra la cookie, y la sesión cerrada no se reanuda', async () => {
    const web = await entrarEnElWebsite('reanudar-logout');
    const res = await request(app.getHttpServer())
      .delete('/api/v1/auth/sessions/current')
      .set('X-BE-Surface', 'WEB')
      .set('Authorization', `Bearer ${web.sesion.accessToken}`)
      .set('Cookie', `${COOKIE_DE_REANUDACION}=${web.secreto}`)
      .expect(204);
    const borrada = cookieDe(res);
    expect(borrada?.valor).toBe('');
    expect(borrada?.atributos.map((a) => a.toLowerCase())).toEqual(expect.arrayContaining(['path=/api/v1/auth/sessions', 'partitioned']));
    expect((await reanudar(web.secreto).expect(401)).body.error.code).toBe('SESSION_INVALID');
  });

  it('cerrar todas las sesiones, o suspender la cuenta, deja sin reanudación a todas', async () => {
    const web = await entrarEnElWebsite('reanudar-todas');
    const otra = await login(app, web.correo, undefined, 'WEB').expect(201);
    const res = await conSesion(app, web.sesion.accessToken).delete('/api/v1/auth/sessions').set('X-BE-Surface', 'WEB').expect(204);
    expect(cookieDe(res)?.valor).toBe('');
    expect((await reanudar(web.secreto).expect(401)).body.error.code).toBe('SESSION_INVALID');
    expect((await reanudar(cookieDe(otra)!.valor).expect(401)).body.error.code).toBe('SESSION_INVALID');

    const suspendida = await entrarEnElWebsite('reanudar-suspendida');
    await transicionPorServicio(app, suspendida.identidadId, 'SuspenderCuenta');
    expect((await reanudar(suspendida.secreto).expect(401)).body.error.code).toBe('SESSION_INVALID');
  });

  it('una sesión vencida no se reanuda, y se dice que venció', async () => {
    const correo = correoSintetico('reanudar-vencida');
    const identidadId = await registrarOk(app, correo, 'WEB');
    const control = await prisma.controlDeSesion.findUniqueOrThrow({ where: { identidadId } });
    const hace = (h: number) => new Date(Date.now() - h * 3600_000);
    const sesion = await prisma.sesion.create({ data: { identidadId, superficie: 'WEB', momentoDeOcurrencia: hace(13), expiraEn: hace(1), versionDeControl: control.version } });
    const secreto = randomBytes(32).toString('base64url');
    await prisma.reanudacionDeSesion.create({ data: { sesionId: sesion.id, huella: huella(secreto) } });
    const res = await reanudar(secreto).expect(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
    expect(cookieDe(res)?.valor).toBe('');
  });

  it('con orígenes configurados, uno ajeno no reanuda; el del website sí, con credenciales en CORS', async () => {
    const conOrigenes = await appDePrueba({ corsAllowedOrigins: ['https://website.example'] });
    try {
      const correo = correoSintetico('reanudar-origen');
      await registrarOk(conOrigenes, correo, 'WEB');
      const entrada = await request(conOrigenes.getHttpServer())
        .post('/api/v1/auth/sessions')
        .set('X-BE-Surface', 'WEB')
        .set('Origin', 'https://website.example')
        .send({ method: 'LOCAL', identifier: correo, credential: 'clave-sintetica-de-prueba-01' })
        .expect(201);
      expect(entrada.headers['access-control-allow-credentials']).toBe('true');
      expect(entrada.headers['access-control-allow-origin']).toBe('https://website.example');
      const secreto = cookieDe(entrada)!.valor;
      expect((await reanudar(secreto, { origen: 'https://otro.example' }, conOrigenes).expect(401)).body.error.code).toBe('AUTHENTICATION_REQUIRED');
      await reanudar(secreto, { origen: 'https://website.example' }, conOrigenes).expect(200);
      // La verificación previa de CORS: la cabecera de superficie obliga a hacerla, y un origen ajeno no la pasa.
      const previa = await request(conOrigenes.getHttpServer())
        .options('/api/v1/auth/sessions/resume')
        .set('Origin', 'https://otro.example')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'x-be-surface');
      expect(previa.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await conOrigenes.close();
    }
  });

  it('la historia de las reanudaciones solo se agrega, y solo una sesión activa del website se reanuda', async () => {
    const web = await entrarEnElWebsite('reanudar-historia');
    await expect(prisma.$executeRaw`UPDATE "reanudacion_de_sesion" SET "huella" = ${'0'.repeat(64)} WHERE "sesion_id" = ${web.sesion.id}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`DELETE FROM "reanudacion_de_sesion" WHERE "sesion_id" = ${web.sesion.id}::uuid`).rejects.toThrow(/append-only/);
    // Otra reanudación inicial para la misma sesión, o una de una sesión de la APK: el trigger las rechaza.
    await expect(prisma.reanudacionDeSesion.create({ data: { sesionId: web.sesion.id, huella: huella('otra') } })).rejects.toThrow(/una sola reanudación inicial/);
    const correo = correoSintetico('reanudar-historia-apk');
    await registrarOk(app, correo, 'APK');
    const apk = await login(app, correo, undefined, 'APK').expect(201);
    await expect(prisma.reanudacionDeSesion.create({ data: { sesionId: apk.body.data.session.id, huella: huella('apk') } })).rejects.toThrow(/solo una sesión activa del website/);
  });
});
