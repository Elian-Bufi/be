/**
 * WP-USO-FINAL · UF-03 (DEUDA_LEGAJO DL-169; UF-D9; 04 RF-005, UC-E09; 08 §24.4 a §24.6 y §26.3; 09 v0.12 §10): recuperar
 * el acceso local. Oráculos TEST-UF-007 y TEST-UF-008 (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * - Pedir (API-ACC-P1-01) responde lo mismo exista o no la cuenta; solo cambia lo que llega por correo.
 * - Completar (API-ACC-P1-02) con un código que no vale no cambia nada; con el vigente, la identidad es la misma, la
 *   contraseña cambia y todas las sesiones terminan.
 * - La recuperación asistida (API-ADM-18) da un código de un solo uso, con fundamento, y cierra las sesiones.
 * El correo va a un proveedor falso local (el adaptador de Postmark, contra 127.0.0.1): ninguna prueba manda un correo de
 * verdad ni depende de un tercero. Google también es el falso local de DL-138.
 */
import type { INestApplication } from '@nestjs/common';
import { VERSION_VIGENTE, VIGENCIA_DEL_CODIGO_POR_CORREO_MS } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { codigoAlAzar } from '../../apps/api/src/administracion/segundo-factor';
import type { CorreoConfigurado } from '../../apps/api/src/config/entorno';
import { huellaDeRecuperacionDeAcceso } from '../../apps/api/src/recuperacion/recuperacion.service';
import { adm, administradorListo, primerFactor } from './soporte-administracion';
import {
  appDePrueba,
  CREDENCIAL_SINTETICA,
  conSesion,
  correoSintetico,
  cuerpoDeCierre,
  DECLARACION_DE_MAYORIA,
  entornoDePrueba,
  login,
  NOMBRE_SINTETICO,
  registrarOk,
  tokenDe,
  transicionPorServicio,
} from './soporte-api';
import { googleDePrueba, idTokenDeGoogle, levantarGoogleFalso, reclamosDeGoogle, subSintetico, type GoogleFalso } from './soporte-google';
import { prepararAsesorado, prepararProfesional, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
const NUEVA = 'clave-sintetica-nueva-uf03';
const RECUPERACION = '/api/v1/auth/recovery-requests';

/** Un proveedor de correo falso (la API de Postmark): guarda cada mensaje y responde 200. */
interface CorreoFalso {
  readonly config: CorreoConfigurado;
  readonly recibidos: { readonly para: string; readonly asunto: string; readonly texto: string; readonly clave: string | undefined }[];
  /** Espera hasta que haya llegado un correo para `para` (sin pausas fijas: cada llegada despierta la espera). */
  esperar(para: string): Promise<{ readonly texto: string; readonly asunto: string }>;
  cerrar(): Promise<void>;
}

async function levantarCorreoFalso(): Promise<CorreoFalso> {
  const recibidos: CorreoFalso['recibidos'] = [];
  const esperando: (() => void)[] = [];
  const servidor: Server = createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c: Buffer) => (cuerpo += c.toString('utf8')));
    req.on('end', () => {
      const m = JSON.parse(cuerpo) as { To: string; Subject: string; TextBody: string };
      recibidos.push({ para: m.To, asunto: m.Subject, texto: m.TextBody, clave: req.headers['x-postmark-server-token'] as string | undefined });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ MessageID: randomUUID(), ErrorCode: 0 }));
      for (const despertar of esperando.splice(0)) despertar();
    });
  });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  const { port } = servidor.address() as AddressInfo;
  return {
    config: { proveedor: 'postmark', clave: 'clave-sintetica-del-proveedor-uf03', remitente: 'no-responder@example.invalid', url: `http://127.0.0.1:${port}`, presupuestoMs: 5000 },
    recibidos,
    async esperar(para) {
      const limite = Date.now() + 10_000;
      for (;;) {
        const llegado = recibidos.find((r) => r.para === para);
        if (llegado) return llegado;
        if (Date.now() > limite) throw new Error(`no llegó el correo para ${para}`);
        await new Promise<void>((r) => {
          esperando.push(r);
          setTimeout(r, 500).unref();
        });
      }
    },
    cerrar: () => new Promise((r) => servidor.close(() => r())),
  };
}

/** El código, en el texto del correo: dos grupos de cinco del alfabeto de los códigos. */
const codigoDelCorreo = (texto: string): string => {
  const m = texto.match(/\b([0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5})\b/);
  if (!m) throw new Error('el correo no trae un código');
  return m[1]!;
};

let correo: CorreoFalso;
let google: GoogleFalso;
/** Con proveedor de correo (el falso) y con Google (el falso). */
let app: INestApplication;
/** Sin proveedor de correo, como hoy en `test`: rige la recuperación asistida. */
let sinCorreo: INestApplication;

beforeAll(async () => {
  correo = await levantarCorreoFalso();
  google = await levantarGoogleFalso();
  app = await appDePrueba({ correo: correo.config, ...googleDePrueba(google) });
  sinCorreo = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await sinCorreo.close();
  await correo.cerrar();
  await google.cerrar();
  await prisma.$disconnect();
});

const pedir = (a: INestApplication, identificador: string) => request(a.getHttpServer()).post(RECUPERACION).set('X-BE-Surface', 'WEB').send({ identifier: identificador });
const completar = (a: INestApplication, recoveryId: string, proof: string, newCredential = NUEVA) =>
  request(a.getHttpServer()).post(`${RECUPERACION}/${recoveryId}/complete`).set('X-BE-Surface', 'WEB').send({ proof, newCredential });

/** Una cuenta creada con Google (sin contraseña), con el Google falso. */
async function cuentaSoloGoogle(a: INestApplication, etiqueta: string): Promise<{ correo: string; id: string }> {
  const direccion = correoSintetico(etiqueta);
  const idToken = idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), direccion));
  const r = await request(a.getHttpServer())
    .post('/api/v1/auth/federated/google/registrations')
    .send({
      idToken,
      registrationIntent: 'ADVISEE',
      profile: { displayName: NOMBRE_SINTETICO },
      termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: DECLARACION_DE_MAYORIA,
    })
    .expect(201);
  return { correo: direccion, id: r.body.data.actor.identityId as string };
}

describe('TEST-UF-007 · pedir la recuperación responde igual exista o no la cuenta', () => {
  it('la misma respuesta para un correo sin cuenta, una con contraseña, una de Google, una cerrada y una suspendida; solo cambia lo que llega por correo', async () => {
    const conContrasena = correoSintetico('uf03-pass');
    await registrarOk(app, conContrasena, 'WEB');
    const deGoogle = await cuentaSoloGoogle(app, 'uf03-goo');
    const cerrada = correoSintetico('uf03-cerrada');
    await registrarOk(app, cerrada, 'WEB');
    await conSesion(app, await tokenDe(app, cerrada, 'WEB')).post('/api/v1/me/account-closure-requests').set('X-BE-Surface', 'WEB').send(cuerpoDeCierre()).expect(201);
    const suspendida = correoSintetico('uf03-susp');
    await transicionPorServicio(app, await registrarOk(app, suspendida, 'WEB'), 'SuspenderCuenta');
    const sinCuenta = correoSintetico('uf03-nadie');

    // Primero los que no reciben un código, después el que sí: cuando llega su correo, ya se procesaron los demás.
    const casos = [sinCuenta, cerrada, suspendida, deGoogle.correo, conContrasena];
    const respuestas: request.Response[] = [];
    for (const direccion of casos) {
      const antes = Date.now();
      // El correo como lo escribe la persona: con mayúsculas y espacios, se normaliza igual que en el alta.
      const r = await pedir(app, `  ${direccion.toUpperCase()} `);
      expect(r.status).toBe(202);
      expect(Object.keys(r.body)).toEqual(['data']);
      expect(Object.keys(r.body.data).sort()).toEqual(['delivery', 'expiresAt', 'recoveryId']);
      expect(r.body.data.delivery).toBe('EMAIL');
      const vence = new Date(r.body.data.expiresAt).getTime();
      expect(vence - antes).toBeGreaterThanOrEqual(VIGENCIA_DEL_CODIGO_POR_CORREO_MS - 2000);
      expect(vence - Date.now()).toBeLessThanOrEqual(VIGENCIA_DEL_CODIGO_POR_CORREO_MS + 2000);
      respuestas.push(r);
    }
    // Cada pedido tiene un recoveryId nuevo, exista o no la cuenta.
    expect(new Set(respuestas.map((r) => r.body.data.recoveryId)).size).toBe(casos.length);

    const codigo = await correo.esperar(conContrasena);
    expect(codigo.asunto).toMatch(/código/);
    const visible = codigoDelCorreo(codigo.texto);
    const aGoogle = await correo.esperar(deGoogle.correo);
    expect(aGoogle.texto).toMatch(/Continuar con Google/);
    expect(aGoogle.texto).not.toMatch(/[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}/);
    // Nada a las demás; la clave del proveedor viaja en su encabezado.
    for (const nadie of [sinCuenta, cerrada, suspendida]) expect(correo.recibidos.some((m) => m.para === nadie)).toBe(false);
    expect(correo.recibidos.every((m) => m.clave === correo.config.clave)).toBe(true);

    // La auditoría: cada pedido, sin el correo ni el código; el que no tiene cuenta, sin sujeto.
    const auditados = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-ACC-P1-01', requestId: { in: respuestas.map((r) => r.headers['x-request-id'] as string) } } });
    expect(auditados).toHaveLength(casos.length);
    const porCaso = (direccion: string) => auditados.find((a) => a.requestId === respuestas[casos.indexOf(direccion)]!.headers['x-request-id']);
    expect(porCaso(sinCuenta)).toMatchObject({ resultado: 'RECHAZO', motivo: 'CUENTA_INEXISTENTE', sujetoId: null, actorId: null });
    expect(porCaso(cerrada)).toMatchObject({ resultado: 'RECHAZO', motivo: 'CUENTA_NO_OPERATIVA' });
    expect(porCaso(suspendida)).toMatchObject({ resultado: 'RECHAZO', motivo: 'CUENTA_NO_OPERATIVA' });
    expect(porCaso(deGoogle.correo)).toMatchObject({ resultado: 'RECHAZO', motivo: 'SIN_CONTRASENA', sujetoId: deGoogle.id });
    expect(porCaso(conContrasena)).toMatchObject({ resultado: 'EXITO', motivo: 'CODIGO_POR_CORREO' });
    const texto = JSON.stringify(auditados);
    for (const prohibido of [...casos, visible, visible.replace('-', '')]) expect(texto).not.toContain(prohibido);

    // La base guarda la huella, nunca el código; el pedido no cambia la contraseña ni cierra sesiones.
    const filas = await prisma.recuperacionDeAcceso.findMany({ where: { id: { in: respuestas.map((r) => r.body.data.recoveryId as string) } } });
    expect(filas).toHaveLength(1);
    expect(filas[0]!.huella).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(filas)).not.toContain(visible.replace('-', ''));
    await login(app, conContrasena).expect(201);
  });

  it('el cupo es de 3 pedidos por hora por correo, desde cualquier red, igual exista o no la cuenta', async () => {
    const limites = { ...entornoDePrueba().limites, recuperacion: { maximo: 3, ventanaMs: 60 * 60 * 1000 } };
    const conCupo = await appDePrueba({ limites });
    try {
      const existe = correoSintetico('uf03-cupo');
      await registrarOk(conCupo, existe, 'WEB');
      const noExiste = correoSintetico('uf03-cupo-nadie');
      for (const direccion of [existe, noExiste]) {
        for (let i = 0; i < 3; i++) await pedir(conCupo, direccion).expect(202);
        const cuarto = await pedir(conCupo, direccion).expect(429);
        expect(cuarto.body.error.code).toBe('RATE_LIMITED');
      }
    } finally {
      await conCupo.close();
    }
  });

  it('sin proveedor de correo: el mismo 202 con la entrega ASSISTED, y no sale ningún correo', async () => {
    const direccion = correoSintetico('uf03-asistida');
    await registrarOk(sinCorreo, direccion, 'WEB');
    const antes = correo.recibidos.length;
    const r = await pedir(sinCorreo, direccion).expect(202);
    expect(r.body.data.delivery).toBe('ASSISTED');
    expect((await pedir(sinCorreo, correoSintetico('uf03-asistida-nadie')).expect(202)).body.data.delivery).toBe('ASSISTED');
    expect(correo.recibidos.length).toBe(antes);
    // El pedido queda, sin código: acepta el que dé Administración.
    expect(await prisma.recuperacionDeAcceso.findUniqueOrThrow({ where: { id: r.body.data.recoveryId } })).toMatchObject({ origen: 'PEDIDO', huella: null });
  });

  it('un correo mal escrito es 422 en su campo; un campo de más, 400', async () => {
    const r = await pedir(app, 'sin-arroba').expect(422);
    expect(r.body.error.details.issues).toEqual([{ code: 'INVALID_LOCAL_IDENTIFIER', path: 'identifier' }]);
    await request(app.getHttpServer()).post(RECUPERACION).send({ identifier: correoSintetico('x'), extra: 1 }).expect(400);
  });
});

describe('TEST-UF-008 · un código que no vale no cambia nada; el vigente cambia la contraseña y cierra todas las sesiones', () => {
  it('con el código del correo: la misma identidad y el mismo vínculo, la contraseña nueva entra, la vieja no, y las sesiones de antes quedan revocadas', async () => {
    const pro = await prepararProfesional(app, 'uf03-pro', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'uf03-ase');
    const { vinculoId } = await vinculoCompleto(app, pro, ase, 'NUTRICION');
    const web = await tokenDe(app, ase.correo, 'WEB');
    const metodosAntes = await prisma.metodoDeAcceso.findMany({ where: { identidadId: ase.id } });

    const pedido = (await pedir(app, ase.correo).expect(202)).body.data.recoveryId as string;
    const codigo = codigoDelCorreo((await correo.esperar(ase.correo)).texto);
    const otra = correoSintetico('uf03-otra');
    await registrarOk(app, otra, 'WEB');
    await pedir(app, otra).expect(202);
    const deOtra = codigoDelCorreo((await correo.esperar(otra)).texto);

    // Lo que no vale: un código que no es, el de otra cuenta, un pedido inventado. El mismo 422, y nada cambia.
    for (const [id, prueba] of [
      [pedido, 'AAAAA-AAAAA'],
      [pedido, deOtra],
      [randomUUID(), codigo],
      ['no-es-un-id', codigo],
    ] as const) {
      const r = await completar(app, id, prueba).expect(422);
      expect(r.body.error).toEqual({ code: 'RECOVERY_CODE_INVALID', message: 'El código no es válido o ya no está vigente.' });
    }
    // Una contraseña nueva corta: 422 en su campo, sin gastar un intento.
    const intentos = (await prisma.recuperacionDeAcceso.findUniqueOrThrow({ where: { id: pedido } })).intentosFallidos;
    const corta = await completar(app, pedido, codigo, 'corta').expect(422);
    expect(corta.body.error.code).toBe('VALIDATION_FAILED');
    expect((await prisma.recuperacionDeAcceso.findUniqueOrThrow({ where: { id: pedido } })).intentosFallidos).toBe(intentos);
    await login(app, ase.correo).expect(201);

    // El vigente, con guion o sin él y en minúsculas: 204.
    await completar(app, pedido, codigo.replace('-', '').toLowerCase()).expect(204);
    await login(app, ase.correo, CREDENCIAL_SINTETICA).expect(401);
    const nueva = await login(app, ase.correo, NUEVA, 'APK').expect(201);
    expect(nueva.body.data.actor.identityId).toBe(ase.id);
    for (const viejo of [ase.token, web]) {
      const r = await conSesion(app, viejo).get('/api/v1/me').expect(401);
      expect(r.body.error.code).toBe('SESSION_REVOKED');
    }
    const revocadas = await prisma.sesion.findMany({ where: { identidadId: ase.id, motivoDeRevocacion: 'RECUPERACION_DE_ACCESO' } });
    expect(revocadas.length).toBeGreaterThanOrEqual(2);
    // La misma identidad, los mismos métodos y el mismo vínculo.
    expect(await prisma.metodoDeAcceso.findMany({ where: { identidadId: ase.id } })).toEqual(metodosAntes);
    expect(await prisma.vinculo.findUnique({ where: { id: vinculoId } })).toMatchObject({ asesoradoId: ase.id, profesionalId: pro.id });
    const conNueva = nueva.body.data.session.accessToken as string;
    const vinculos = await conSesion(app, conNueva).get('/api/v1/me/relationships').expect(200);
    expect(JSON.stringify(vinculos.body)).toContain(vinculoId);
    // El cambio, como hecho: el método, la recuperación usada y la auditoría, sin el código.
    expect(await prisma.cambioDeCredencial.findMany({ where: { identidadId: ase.id } })).toHaveLength(1);
    const exito = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-ACC-P1-02', resultado: 'EXITO', sujetoId: ase.id } });
    expect(exito.motivo).toMatch(/^SESIONES_REVOCADAS:\d+$/);
    expect(JSON.stringify(await prisma.registroDeAuditoria.findMany({ where: { sujetoId: ase.id } }))).not.toContain(codigo.replace('-', ''));
    // El mismo código otra vez: 422, y la contraseña nueva sigue.
    await completar(app, pedido, codigo, 'otra-clave-sintetica-uf03').expect(422);
    await login(app, ase.correo, NUEVA).expect(201);
  });

  it('un código vencido no vale y la contraseña sigue; cinco que no valen anulan el pedido, aun para el código correcto', async () => {
    const direccion = correoSintetico('uf03-vence');
    const id = await registrarOk(app, direccion, 'WEB');
    // Un pedido vencido, escrito en la base con su huella: registrado hace dos horas, venció hace una.
    const vencido = codigoAlAzar(10);
    const fila = await prisma.recuperacionDeAcceso.create({
      data: {
        identidadId: id,
        origen: 'PEDIDO',
        huella: huellaDeRecuperacionDeAcceso(entornoDePrueba().jwtSecret, vencido),
        venceEn: new Date(Date.now() - 60 * 60 * 1000),
        momentoDeRegistro: new Date(Date.now() - 2 * 60 * 60 * 1000),
        procedencia: { fuente: 'PRUEBA' },
      },
    });
    await completar(app, fila.id, vencido).expect(422);
    await login(app, direccion).expect(201);
    await login(app, direccion, NUEVA).expect(401);

    const pedido = (await pedir(app, direccion).expect(202)).body.data.recoveryId as string;
    const codigo = codigoDelCorreo((await correo.esperar(direccion)).texto);
    for (let i = 0; i < 5; i++) await completar(app, pedido, `AAAA${i}-AAAAA`).expect(422);
    expect(await prisma.recuperacionDeAcceso.findUniqueOrThrow({ where: { id: pedido } })).toMatchObject({ intentosFallidos: 5, momentoDeUso: null });
    await completar(app, pedido, codigo).expect(422);
    await login(app, direccion).expect(201);
  });

  it('la recuperación asistida (API-ADM-18): segundo factor, fundamento, cuentas que no se recuperan con un código, y el código de un solo uso que cierra las sesiones', async () => {
    const a = await administradorListo(app, prisma, `uf03-${randomUUID().slice(0, 6)}`);
    const persona = await prepararAsesorado(sinCorreo, 'uf03-asis');
    const goo = await cuentaSoloGoogle(app, 'uf03-asis-goo');
    const asistida = (token: string, cuerpo: Record<string, unknown>) => adm(app, token).post('/admin/access-recoveries').send(cuerpo);
    const fundamento = 'Escribió desde el correo de la cuenta y confirmó la fecha del alta.';

    // Sin el segundo factor de esta sesión: 403.
    const sinSegundo = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    expect((await asistida(sinSegundo, { email: persona.correo, rationale: fundamento }).expect(403)).body.error.code).toBe('MFA_REQUIRED');
    // Los 422 en su campo.
    const issue = async (cuerpo: Record<string, unknown>) => (await asistida(a.token, cuerpo).expect(422)).body.error.details.issues;
    expect(await issue({ email: persona.correo, rationale: '   ' })).toEqual([{ code: 'RATIONALE_REQUIRED', path: 'rationale' }]);
    expect(await issue({ email: a.correo, rationale: fundamento })).toEqual([{ code: 'ACCOUNT_IS_ADMINISTRATIVE', path: 'email' }]);
    expect(await issue({ email: goo.correo, rationale: fundamento })).toEqual([{ code: 'ACCOUNT_WITHOUT_PASSWORD', path: 'email' }]);
    await asistida(a.token, { email: correoSintetico('uf03-asis-nadie'), rationale: fundamento }).expect(404);

    // La persona tiene una sesión abierta; la asistida la cierra y da el código una sola vez.
    const emitida = await asistida(a.token, { email: persona.correo.toUpperCase(), rationale: fundamento }).expect(201);
    expect(emitida.body.data).toMatchObject({ identityId: persona.id, code: expect.stringMatching(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/), sessionsRevoked: 1 });
    const vence = new Date(emitida.body.data.expiresAt).getTime() - Date.now();
    expect(vence).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect((await conSesion(app, persona.token).get('/api/v1/me').expect(401)).body.error.code).toBe('SESSION_REVOKED');
    const fila = await prisma.recuperacionDeAcceso.findFirstOrThrow({ where: { identidadId: persona.id, origen: 'ASISTIDA' } });
    expect(fila).toMatchObject({ administradorId: a.id, fundamento });
    expect(JSON.stringify(fila)).not.toContain(emitida.body.data.code.replace('-', ''));
    const auditada = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-ADM-18', resultado: 'EXITO', sujetoId: persona.id } });
    expect(auditada).toMatchObject({ actorId: a.id, motivo: 'SESIONES_REVOCADAS:1' });
    expect(JSON.stringify(auditada)).not.toContain(fundamento);
    expect(JSON.stringify(auditada)).not.toContain(emitida.body.data.code);

    // Otra emisión anula la anterior; la persona pide y completa con la última, sin proveedor de correo.
    const ultima = (await asistida(a.token, { email: persona.correo, rationale: fundamento }).expect(201)).body.data.code as string;
    const pedido = (await pedir(sinCorreo, persona.correo).expect(202)).body.data;
    expect(pedido.delivery).toBe('ASSISTED');
    await completar(sinCorreo, pedido.recoveryId, emitida.body.data.code).expect(422);
    await completar(sinCorreo, pedido.recoveryId, ultima).expect(204);
    await login(sinCorreo, persona.correo, NUEVA).expect(201);
    await completar(sinCorreo, pedido.recoveryId, ultima, 'otra-clave-sintetica-uf03').expect(422);
  });

  it('la base no deja cambiar una credencial sin su cambio registrado, ni tocar un pedido más que en sus intentos, su uso y su anulación', async () => {
    const direccion = correoSintetico('uf03-base');
    const id = await registrarOk(app, direccion, 'WEB');
    const metodo = await prisma.metodoDeAcceso.findFirstOrThrow({ where: { identidadId: id, tipo: 'LOCAL' } });
    await expect(prisma.$executeRaw`UPDATE "credencial_local" SET "hash" = 'otro' WHERE "metodo_de_acceso_id" = ${metodo.id}::uuid`).rejects.toThrow(/cambio registrado/);
    const pedido = (await pedir(app, direccion).expect(202)).body.data.recoveryId as string;
    await expect(prisma.$executeRaw`UPDATE "recuperacion_de_acceso" SET "vence_en" = now() + interval '1 day' WHERE "id" = ${pedido}::uuid`).rejects.toThrow(/solo cambian/);
    await expect(prisma.$executeRaw`UPDATE "recuperacion_de_acceso" SET "intentos_fallidos" = 3 WHERE "id" = ${pedido}::uuid`).rejects.toThrow(/de a uno/);
    await expect(prisma.$executeRaw`DELETE FROM "recuperacion_de_acceso" WHERE "id" = ${pedido}::uuid`).rejects.toThrow(/append-only/);
    await login(app, direccion).expect(201);
  });
});
