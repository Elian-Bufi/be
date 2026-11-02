/**
 * WP-ADMINISTRACION (DL-155; docs/paquetes/WP-ADMINISTRACION.md §14) contra PostgreSQL real y la API completa. Los diez
 * criterios del encargo de Dirección del 2026-10-25:
 *  1. el administrador entra con MFA y opera; sin MFA no accede;
 *  2. un profesional o un asesorado no obtienen privilegios administrativos;
 *  3. el administrador no lee datos de salud, ni llamando directo a la API (TEST-AUTH-010);
 *  4. las transiciones válidas funcionan y las inválidas se rechazan (TEST-RF-011, TEST-RF-012);
 *  5. suspender Nutrición bloquea esa área y no otra (TEST-RF-014);
 *  6. restablecer no recupera consentimientos revocados ni vínculos finalizados;
 *  7. cada acción conserva autor y fundamento; reintentos y conflictos se resuelven;
 *  8. los avisos se generan una vez y corresponden a decisiones confirmadas (y las APK los leen);
 *  9. reiniciar y volver a preparar datos no deshace decisiones humanas;
 * 10. la configuración y la recuperación del MFA no dejan una vía sin protección.
 * Solo datos sintéticos (`example.invalid`). Ningún secreto, QR ni código se escribe en un registro.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { ErrorDeComando, incorporarAdministrador, restablecerSegundoFactor, retirarAdministrador } from '../../apps/api/src/administracion/incorporacion';
import { PdpService } from '../../apps/api/src/autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../../apps/api/src/http/contexto';
import { puedeOperarArea } from '../../apps/api/src/profesional/area-operable';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, claveDeIdempotencia, conSesion, CREDENCIAL_SINTETICA, correoSintetico, login, registrarOk, tokenDe } from './soporte-api';
import { adm, administradorListo, codigoQueNoVale, codigoTotp, decidirSobre, otraSesion, primerFactor, profesionalPendiente, type Administrador } from './soporte-administracion';
import { LaApk } from './soporte-lecturas-de-la-apk';
import { esperarQueEsperen, pidDeLaTransaccion } from './soporte-concurrencia';
import { circuitoConPlanActivo, registrarComida } from './soporte-nutricion';
import { finalizar, prepararAsesorado, prepararProfesional, revocarB2, solicitar, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (n: string) => `${n}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const ctx = (): ContextoDeSolicitud => ({ requestId: null, momentoDeRecepcion: new Date(), superficie: null, direccionIp: null, agenteDeUsuario: null, capacidades: new Set() });

const area = async (a: Administrador, profesionalId: string, alcance: string) =>
  ((await adm(app, a.token).get(`/admin/professionals/${profesionalId}`).expect(200)).body.data.scopes as { scope: string; [k: string]: unknown }[]).find((x) => x.scope === alcance)!;

// ─── 1 y 10 · El acceso con dos factores ────────────────────────────────────────────────────────

describe('Acceso administrativo (criterios 1 y 10)', () => {
  it('con solo el primer factor no se lee ni se decide nada; con el autenticador configurado, sí', async () => {
    const e = etiqueta('acceso');
    const correo = correoSintetico(`adm-${e}`);
    await registrarOk(app, correo, 'WEB');
    const pro = await prepararProfesional(app, `acceso-${e}`, ['NUTRICION']);
    const { codigo } = await incorporarAdministrador(prisma, { correo, nombre: 'Admin acceso', fundamento: 'Prueba', operador: 'Prueba', appEnv: 'test' });
    const sesion = await primerFactor(app, correo).expect(201);
    expect(sesion.body.data.secondFactor.state).toBe('ENROLLMENT_REQUIRED');
    const token = sesion.body.data.session.accessToken as string;
    // Solo el primer factor: ninguna lectura ni decisión.
    for (const r of [
      adm(app, token).post('/admin/professionals/query').send({}),
      adm(app, token).get(`/admin/professionals/${pro.id}`),
      adm(app, token).get(`/admin/professionals/${pro.id}/history`),
      adm(app, token).decidir(pro.id, 'NUTRICION', { expectedVersion: 'a2-1', decision: 'SUSPEND', rationale: 'x', messageToProfessional: 'x' }),
      adm(app, token).post('/admin/auth/recovery-codes').send({ credential: 'clave-sintetica-de-prueba-01' }),
    ]) {
      const res = await r;
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MFA_REQUIRED');
    }
    // Un código de incorporación incorrecto cuenta como intento y no configura nada.
    const malo = await adm(app, token).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: 'AAAAA-AAAAA-AAAAA-AAAAA' }).expect(422);
    expect(malo.body.error).toMatchObject({ code: 'INCORPORATION_CODE_INVALID', details: { attemptsRemaining: 4 } });
    const conf = await adm(app, token).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: codigo }).expect(200);
    expect(conf.body.data).toMatchObject({ issuer: 'BE', algorithm: 'SHA1', digits: 6, periodSeconds: 30 });
    expect(conf.body.data.otpauthUri).toMatch(/^otpauth:\/\/totp\//);
    const secreto = conf.body.data.secret as string;
    // Un código que no es del autenticador nuevo no confirma.
    await adm(app, token).post('/admin/auth/second-factor/enrollment/confirm').send({ code: '000000' === codigoTotp(secreto) ? '111111' : '000000' }).expect(422);
    const ok = await adm(app, token).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoTotp(secreto) }).expect(200);
    expect(ok.body.data.recoveryCodes).toHaveLength(10);
    expect(ok.body.data.secondFactor.state).toBe('VERIFIED');
    await adm(app, token).post('/admin/professionals/query').send({}).expect(200);
    // El código de incorporación quedó usado: no sirve para otra configuración.
    const usado = await prisma.codigoDeIncorporacion.findFirst({ where: { identidad: { metodosDeAcceso: { some: { referencia: correo } } } } });
    expect(usado?.momentoDeUso).not.toBeNull();
    // La base no guarda el secreto en claro ni los códigos: solo el cifrado y las huellas.
    const factor = await prisma.factorTotp.findFirst({ where: { identidadId: usado!.identidadId, estado: 'ACTIVO' } });
    expect(factor!.secretoCifrado).toMatch(/^v1\./);
    expect(factor!.secretoCifrado).not.toContain(secreto);
    const huellas = await prisma.codigoDeRecuperacion.findMany({ where: { identidadId: usado!.identidadId } });
    for (const c of ok.body.data.recoveryCodes as string[]) expect(huellas.some((h) => h.huella.includes(c.replace(/-/g, '')))).toBe(false);
  });

  it('un código ya usado no vale otra vez; uno del paso siguiente, sí', async () => {
    const a = await administradorListo(app, prisma, etiqueta('replay'));
    const otra = await primerFactor(app, a.correo).expect(201);
    const t = otra.body.data.session.accessToken as string;
    const r = await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: a.ultimoCodigo }).expect(422);
    expect(r.body.error).toMatchObject({ code: 'SECOND_FACTOR_INVALID', details: { attemptsRemaining: 4 } });
    await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(200);
  });

  it('cinco códigos fallidos revocan la sesión; el rechazo queda auditado sin el código', async () => {
    const a = await administradorListo(app, prisma, etiqueta('intentos'));
    const s = await primerFactor(app, a.correo).expect(201);
    const t = s.body.data.session.accessToken as string;
    for (let i = 1; i <= 4; i++) {
      const r = await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: '12345' }).expect(422);
      expect(r.body.error.details.attemptsRemaining).toBe(5 - i);
    }
    await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: '12345' }).expect(401);
    const sesion = await prisma.sesion.findUnique({ where: { id: s.body.data.session.id } });
    expect(sesion).toMatchObject({ estado: 'REVOCADA', motivoDeRevocacion: 'SEGUNDO_FACTOR_FALLIDO' });
    await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(401);
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { recursoId: s.body.data.session.id, operacion: 'API-ADM-05' } });
    // Los cinco códigos que no valen y, desde la revisión de seguridad del 2026-10-25, el sexto pedido: el guard lo rechaza
    // por la sesión revocada y también lo audita.
    expect(auditoria.map((f) => `${f.resultado} ${f.motivo}`).sort()).toEqual([
      'RECHAZO FORMA_INVALIDA',
      'RECHAZO FORMA_INVALIDA',
      'RECHAZO FORMA_INVALIDA',
      'RECHAZO FORMA_INVALIDA',
      'RECHAZO FORMA_INVALIDA:INTENTOS_AGOTADOS',
      'RECHAZO SESION_REVOCADA',
    ]);
    expect(JSON.stringify(auditoria)).not.toContain('12345');
  });

  it('un código de recuperación sirve una sola vez y no desactiva el autenticador', async () => {
    const a = await administradorListo(app, prisma, etiqueta('recuperacion'));
    const s1 = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    const r1 = await adm(app, s1).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: a.codigosDeRecuperacion[0]!.toLowerCase() }).expect(200);
    expect(r1.body.data).toMatchObject({ secondFactor: { state: 'VERIFIED', method: 'RECOVERY_CODE' }, recoveryCodesRemaining: 9 });
    const s2 = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    await adm(app, s2).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: a.codigosDeRecuperacion[0] }).expect(422);
    // El autenticador sigue activo y vale.
    await adm(app, s2).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(200);
  });

  it('15 minutos sin actividad vencen el segundo factor: se pide otro código, sin la contraseña', async () => {
    const a = await administradorListo(app, prisma, etiqueta('inactividad'));
    await adm(app, a.token).post('/admin/professionals/query').send({}).expect(200);
    const hace = new Date(Date.now() - 16 * 60_000);
    const sesionId = (await adm(app, a.token).get('/admin/auth/sessions/current').expect(200)).body.data.session.id as string;
    await prisma.segundoFactorDeSesion.update({ where: { sesionId }, data: { verificadoEn: hace, ultimaActividad: hace } });
    const r = await adm(app, a.token).post('/admin/professionals/query').send({});
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('MFA_REQUIRED');
    expect((await adm(app, a.token).get('/admin/auth/sessions/current').expect(200)).body.data.secondFactor).toEqual({ state: 'REQUIRED', deadline: null });
    await adm(app, a.token).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(200);
    await adm(app, a.token).post('/admin/professionals/query').send({}).expect(200);
  });

  it('recargar reanuda la misma sesión con su propia cookie, y el servidor dice el estado del segundo factor', async () => {
    const a = await administradorListo(app, prisma, etiqueta('reanudar'));
    const s = await primerFactor(app, a.correo).expect(201);
    const cookie = (s.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('__Secure-be-admin-reanudacion='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/admin\/auth\/sessions/);
    const valor = cookie.split(';')[0]!;
    const reanudada = await adm(app).post('/admin/auth/sessions/resume').set('Cookie', valor).expect(200);
    expect(reanudada.body.data.session.id).toBe(s.body.data.session.id);
    // Sin código todavía: la reanudación no inventa un segundo factor.
    expect(reanudada.body.data.secondFactor.state).toBe('REQUIRED');
    // La cookie de Administración no sirve para la reanudación común (ni al revés).
    await request(app.getHttpServer()).post('/api/v1/auth/sessions/resume').set('X-BE-Surface', 'WEB').set('Cookie', valor.replace('__Secure-be-admin-reanudacion', '__Secure-be-reanudacion')).expect(401);
  });

  it('reemplazar el autenticador exige el segundo factor y la contraseña; el anterior vale hasta confirmar el nuevo', async () => {
    const a = await administradorListo(app, prisma, etiqueta('reemplazo'));
    await adm(app, a.token).post('/admin/auth/second-factor/enrollment').send({ credential: 'otra-clave-equivocada' }).expect(401);
    const nueva = await adm(app, a.token).post('/admin/auth/second-factor/enrollment').send({ credential: 'clave-sintetica-de-prueba-01' }).expect(200);
    // Todavía no se confirmó: el anterior sigue valiendo en otra sesión.
    await otraSesion(app, a, 30_000);
    await adm(app, a.token).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoTotp(nueva.body.data.secret) }).expect(200);
    const estados = await prisma.factorTotp.findMany({ where: { identidadId: a.id }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(estados.map((f) => f.estado)).toEqual(['REEMPLAZADO', 'ACTIVO']);
    // Los códigos de recuperación anteriores dejaron de valer, y el autenticador viejo también.
    const s = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    await adm(app, s).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: a.codigosDeRecuperacion[1] }).expect(422);
    await adm(app, s).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 60_000) }).expect(422);
  });

  it('si el operador restablece el segundo factor, se revoca todo y hay que configurarlo de nuevo con otro código', async () => {
    const a = await administradorListo(app, prisma, etiqueta('restablecer'));
    const { codigo } = await restablecerSegundoFactor(prisma, { correo: a.correo, fundamento: 'Perdió el teléfono y los códigos', operador: 'Prueba' });
    await adm(app, a.token).post('/admin/professionals/query').send({}).expect(401);
    const s = await primerFactor(app, a.correo).expect(201);
    expect(s.body.data.secondFactor.state).toBe('ENROLLMENT_REQUIRED');
    const t = s.body.data.session.accessToken as string;
    // No hay atajo: ni el autenticador viejo ni un código de recuperación viejo.
    await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(422);
    await adm(app, t).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: a.codigosDeRecuperacion[2] }).expect(422);
    const conf = await adm(app, t).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: codigo }).expect(200);
    await adm(app, t).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoTotp(conf.body.data.secret) }).expect(200);
    await adm(app, t).post('/admin/professionals/query').send({}).expect(200);
  });

  it('cerrar la sesión la finaliza en la base y es idempotente; retirar el rol corta el acceso', async () => {
    const a = await administradorListo(app, prisma, etiqueta('cerrar'));
    await adm(app, a.token).delete('/admin/auth/sessions/current').expect(204);
    await adm(app, a.token).delete('/admin/auth/sessions/current').expect(204);
    await adm(app, a.token).post('/admin/professionals/query').send({}).expect(401);
    const b = await administradorListo(app, prisma, etiqueta('retirar'));
    await retirarAdministrador(prisma, { correo: b.correo, fundamento: 'Ya no administra', operador: 'Prueba' });
    await adm(app, b.token).post('/admin/professionals/query').send({}).expect(401);
    await primerFactor(app, b.correo).expect(401);
  });

  it('el primer factor es neutral: sin rol, con la contraseña mal o sin cuenta, el mismo 401', async () => {
    const pro = await prepararProfesional(app, etiqueta('neutral'), ['NUTRICION']);
    const a = await administradorListo(app, prisma, etiqueta('neutral-adm'));
    const sinRol = await primerFactor(app, pro.correo).expect(401);
    const mal = await primerFactor(app, a.correo, 'clave-incorrecta-de-prueba').expect(401);
    const nadie = await primerFactor(app, correoSintetico('nadie')).expect(401);
    expect(sinRol.body).toEqual(mal.body);
    expect(mal.body).toEqual(nadie.body);
    const motivos = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-ADM-01', resultado: 'RECHAZO', sujetoId: pro.id } });
    expect(motivos.map((m) => m.motivo)).toContain('CUENTA_SIN_ROL_ADMINISTRATIVO');
  });

  it('sin la clave del segundo factor, la administración no abre y el resto de BE sigue', async () => {
    const sinClave = await appDePrueba({ claveDelSegundoFactor: null });
    try {
      const r = await request(sinClave.getHttpServer()).post('/api/v1/admin/auth/sessions').set('X-BE-Surface', 'WEB').send({ identifier: 'x@example.invalid', credential: 'y' }).expect(503);
      expect(r.body.error.code).toBe('ADMINISTRATION_NOT_AVAILABLE');
      await request(sinClave.getHttpServer()).get('/health/live').expect(200);
    } finally {
      await sinClave.close();
    }
  });
});

// ─── 2 y 3 · Sin privilegios cruzados ni datos de salud ─────────────────────────────────────────

describe('Permisos (criterios 2 y 3; TEST-AUTH-010)', () => {
  it('un profesional o un asesorado no obtienen nada de Administración', async () => {
    const pro = await prepararProfesional(app, etiqueta('perm-pro'), ['NUTRICION']);
    const ase = await prepararAsesorado(app, etiqueta('perm-ase'), { a3: true });
    for (const token of [pro.token, ase.token]) {
      for (const r of [
        adm(app, token).post('/admin/professionals/query').send({}),
        adm(app, token).get(`/admin/professionals/${pro.id}`),
        adm(app, token).get('/admin/auth/sessions/current'),
        adm(app, token).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: 'AAAAA-AAAAA-AAAAA-AAAAA' }),
        adm(app, token).decidir(pro.id, 'NUTRICION', { expectedVersion: 'a2-1', decision: 'SUSPEND', rationale: 'x', messageToProfessional: 'x' }),
      ]) {
        const res = await r;
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('ACTION_FORBIDDEN');
      }
    }
    // Y no hay forma de asignarse el rol: ninguna operación HTTP lo concede.
    expect(await prisma.rolAdministrativo.count({ where: { identidadId: { in: [pro.id, ase.id] } } })).toBe(0);
  });

  it('la sesión administrativa no autentica en ninguna operación de personas ni de profesionales (ni de salud)', async () => {
    const c = await circuitoConPlanActivo(app, etiqueta('salud'));
    const a = await administradorListo(app, prisma, etiqueta('salud-adm'));
    const rutas = [
      '/api/v1/me',
      '/api/v1/me/nutrition/today',
      '/api/v1/me/nutrition/executions',
      '/api/v1/me/news',
      `/api/v1/advisees/${c.ase.id}/dashboard`,
      `/api/v1/advisees/${c.ase.id}/nutrition/evaluations`,
      `/api/v1/advisees/${c.ase.id}/nutrition/plans`,
      `/api/v1/advisees/${c.ase.id}/training/evaluations`,
      `/api/v1/advisees/${c.ase.id}/timeline`,
      '/api/v1/me/relationships',
      '/api/v1/me/portfolio',
      '/api/v1/nutrition/plan-templates',
    ];
    for (const ruta of rutas) {
      const r = await request(app.getHttpServer()).get(ruta).set('Authorization', `Bearer ${a.token}`);
      expect([r.status, ruta]).toEqual([401, ruta]);
      expect(r.body.error.code).toBe('SESSION_INVALID');
    }
    // El inicio de sesión común también la rechaza, con el 401 neutral.
    await login(app, a.correo).expect(401);
  });

  it('la ficha y la lista no traen nada de las personas: ni su identidad ni sus datos', async () => {
    const c = await circuitoConPlanActivo(app, etiqueta('minimo'));
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const a = await administradorListo(app, prisma, etiqueta('minimo-adm'));
    const ficha = await adm(app, a.token).get(`/admin/professionals/${c.pro.id}`).expect(200);
    const historial = await adm(app, a.token).get(`/admin/professionals/${c.pro.id}/history`).expect(200);
    const lista = await adm(app, a.token).post('/admin/professionals/query').send({ text: c.pro.correo.slice(0, 18) }).expect(200);
    for (const cuerpo of [ficha.body, historial.body, lista.body]) {
      const texto = JSON.stringify(cuerpo);
      expect(texto).not.toContain(c.ase.id);
      expect(texto).not.toContain(c.ase.correo);
      expect(texto).not.toContain(c.planId);
      expect(texto).not.toMatch(/kcal|Arroz|Pollo/i);
    }
    expect((ficha.body.data.scopes as { scope: string; linkedPeople: unknown }[]).find((x) => x.scope === 'NUTRICION')!.linkedPeople).toEqual({ active: 1, paused: 0 });
  });

  it('una identidad administrativa es separada: no se incorpora un profesional ni una persona con vínculos, y no se convierte en profesional', async () => {
    const pro = await prepararProfesional(app, etiqueta('sep-pro'), ['NUTRICION']);
    const ase = await prepararAsesorado(app, etiqueta('sep-ase'), { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    await expect(incorporarAdministrador(prisma, { correo: pro.correo, nombre: 'X', fundamento: 'x', operador: 'x', appEnv: 'test' })).rejects.toThrow(ErrorDeComando);
    await expect(incorporarAdministrador(prisma, { correo: ase.correo, nombre: 'X', fundamento: 'x', operador: 'x', appEnv: 'test' })).rejects.toThrow(ErrorDeComando);
    // Ni con un correo real en test.
    await expect(incorporarAdministrador(prisma, { correo: 'alguien@ejemplo.com', nombre: 'X', fundamento: 'x', operador: 'x', appEnv: 'test' })).rejects.toThrow(/sintéticas/);
    // La base lo exige igual, aunque alguien saltee el comando.
    await expect(prisma.rolAdministrativo.create({ data: { identidadId: pro.id, nombreVisible: 'X', fundamento: 'x', operador: 'x', procedencia: {}, momentoDeOcurrencia: new Date() } })).rejects.toThrow(/identidad separada/);
    // Y la preparación de la demostración no convierte a una administradora en profesional.
    const a = await administradorListo(app, prisma, etiqueta('sep-adm'));
    const r = await app.get(PrismaService).$transaction((tx) => app.get(VerificacionService).prepararProfesional(tx, a.id, { alcance: 'NUTRICION', tipo: 'SANITARIO', nombreVisible: 'X' }, new Date()));
    expect(r).toBe('IDENTIDAD_ADMINISTRATIVA');
    expect(await prisma.perfilProfesional.count({ where: { identidadId: a.id } })).toBe(0);
    // Una solicitud de vínculo dirigida a ella responde lo mismo que a una identidad que no existe: sin oráculo.
    const aAdmin = await solicitar(app, pro, a.id, 'NUTRICION');
    const aNadie = await solicitar(app, pro, randomUUID(), 'NUTRICION');
    expect([aAdmin.status, aAdmin.body.error?.code]).toEqual([aNadie.status, aNadie.body.error?.code]);
  });
});

// ─── 4 y 7 · Decisiones, autoría, reintentos y conflictos ───────────────────────────────────────

describe('Decisiones (criterios 4 y 7; TEST-RF-011, TEST-RF-012)', () => {
  it('un área pendiente: observar no cambia el estado; verificar y conceder dejan operar; cada hecho con su autor y su fundamento', async () => {
    const pro = await profesionalPendiente(app, etiqueta('dec'));
    const a = await administradorListo(app, prisma, etiqueta('dec-adm'), 'Ana Admin');
    const antes = await area(a, pro.id, 'NUTRICION');
    expect(antes).toMatchObject({ situation: 'PENDING_REVIEW', canOperate: false, availableDecisions: ['OBSERVE', 'VERIFY', 'REJECT', 'GRANT_ENABLEMENT'] });
    // Sin el texto para el profesional, o sin fundamento, no se registra nada.
    await adm(app, a.token).decidir(pro.id, 'NUTRICION', { expectedVersion: antes.version, decision: 'OBSERVE', rationale: 'Falta la constancia' }).expect(422);
    const sinFundamento = await adm(app, a.token).decidir(pro.id, 'NUTRICION', { expectedVersion: antes.version, decision: 'OBSERVE', rationale: '  ', messageToProfessional: 'x' }).expect(422);
    expect(sinFundamento.body.error.code).toBe('RATIONALE_REQUIRED');
    // Transiciones que el estado no admite.
    for (const decision of ['SUSPEND', 'REINSTATE', 'WITHDRAW_ENABLEMENT']) {
      const r = await adm(app, a.token).decidir(pro.id, 'NUTRICION', { expectedVersion: antes.version, decision, rationale: 'x', messageToProfessional: 'x' }).expect(422);
      expect(r.body.error.code).toBe('INVALID_STATE_TRANSITION');
    }
    const observada = await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'OBSERVE').expect(200);
    expect(observada.body.data.scope).toMatchObject({ situation: 'PENDING_REVIEW', lastObservation: { messageToProfessional: 'Texto para el profesional (OBSERVE)' } });
    expect(observada.body.data.notified).toEqual({ professional: true, linkedPeople: 0 });
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'VERIFY').expect(200);
    expect(await area(a, pro.id, 'NUTRICION')).toMatchObject({ situation: 'VERIFIED_NOT_ENABLED', canOperate: false });
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'GRANT_ENABLEMENT').expect(200);
    expect(await area(a, pro.id, 'NUTRICION')).toMatchObject({ situation: 'CAN_OPERATE', canOperate: true, availableDecisions: ['SUSPEND', 'WITHDRAW_ENABLEMENT'] });
    await conSesion(app, pro.token).get('/api/v1/nutrition/plan-templates').expect(200);
    // El historial: del más nuevo al más viejo, la persona y el servicio interno distinguidos, con fundamento y texto.
    const h = (await adm(app, a.token).get(`/admin/professionals/${pro.id}/history`).expect(200)).body.data as { kind: string; actor: { type: string; displayName?: string }; rationale: string; messageToProfessional: string | null; previousState: string | null; newState: string | null; reviewedVersion: number | null }[];
    expect(h.map((x) => x.kind)).toEqual(['HabilitacionConcedida', 'AlcanceVerificado', 'ObservacionRegistrada', 'AlcancePresentado', 'PerfilProfesionalCreado']);
    expect(h[0]).toMatchObject({ actor: { type: 'ADMINISTRATOR', displayName: 'Ana Admin' }, rationale: 'Fundamento interno de GRANT_ENABLEMENT', previousState: null, newState: 'CONCEDIDA' });
    expect(h[1]).toMatchObject({ previousState: 'PENDIENTE', newState: 'VERIFICADO', reviewedVersion: 2 });
    expect(h[2]).toMatchObject({ previousState: 'PENDIENTE', newState: 'PENDIENTE', messageToProfessional: 'Texto para el profesional (OBSERVE)', reviewedVersion: 1 });
    expect(h[3]!.actor).toEqual({ type: 'INTERNAL_SERVICE' });
    // La base guarda el actor explícito.
    const hechos = await prisma.eventoDeVerificacion.findMany({ where: { identidadId: pro.id }, orderBy: { secuencia: 'asc' } });
    expect(hechos.map((x) => x.tipoDeActor)).toEqual(['SERVICIO_INTERNO', 'SERVICIO_INTERNO', 'ADMINISTRADOR', 'ADMINISTRADOR', 'ADMINISTRADOR']);
    expect(hechos.filter((x) => x.tipoDeActor === 'ADMINISTRADOR').every((x) => x.administradorId === a.id && x.actorServicio === null)).toBe(true);
  });

  it('rehabilitar no concede una habilitación retirada: son dos decisiones', async () => {
    const pro = await prepararProfesional(app, etiqueta('dos'), ['NUTRICION']);
    const a = await administradorListo(app, prisma, etiqueta('dos-adm'));
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'SUSPEND').expect(200);
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'WITHDRAW_ENABLEMENT').expect(200);
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'REINSTATE', { messageToProfessional: undefined }).expect(200);
    expect(await area(a, pro.id, 'NUTRICION')).toMatchObject({ verification: { state: 'VERIFICADO' }, enablement: { state: 'RETIRADA' }, canOperate: false, situation: 'VERIFIED_NOT_ENABLED' });
    await conSesion(app, pro.token).get('/api/v1/nutrition/plan-templates').expect(403);
  });

  it('un reintento con la misma clave no duplica la decisión ni sus avisos; con otro cuerpo, 409', async () => {
    const pro = await prepararProfesional(app, etiqueta('idem'), ['NUTRICION']);
    const a = await administradorListo(app, prisma, etiqueta('idem-adm'));
    const clave = claveDeIdempotencia();
    const primera = await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'SUSPEND', {}, clave).expect(200);
    const version = (await prisma.eventoDeVerificacion.findMany({ where: { identidadId: pro.id, tipoDeActor: 'ADMINISTRADOR' } })).length;
    // El mismo intento otra vez: con la versión que tenía la primera.
    const cuerpo = { expectedVersion: 'a2-1', decision: 'SUSPEND', rationale: 'Fundamento interno de SUSPEND', messageToProfessional: 'Texto para el profesional (SUSPEND)' };
    const segunda = await adm(app, a.token).decidir(pro.id, 'NUTRICION', cuerpo, clave).expect(200);
    expect(segunda.body).toEqual(primera.body);
    expect(await prisma.eventoDeVerificacion.count({ where: { identidadId: pro.id, tipoDeActor: 'ADMINISTRADOR' } })).toBe(version);
    expect(await prisma.novedad.count({ where: { destinatarioId: pro.id, tipo: 'DECISION_ADMINISTRATIVA' } })).toBe(1);
    const reusada = await adm(app, a.token).decidir(pro.id, 'NUTRICION', { ...cuerpo, rationale: 'otro' }, clave).expect(409);
    expect(reusada.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('dos administradores con información vieja no se pisan: el segundo recibe 409 y no se guarda nada', async () => {
    const pro = await prepararProfesional(app, etiqueta('conf'), ['NUTRICION']);
    const a = await administradorListo(app, prisma, etiqueta('conf-a'));
    const b = await administradorListo(app, prisma, etiqueta('conf-b'));
    const version = (await area(a, pro.id, 'NUTRICION')).version as string;
    const cuerpo = (decision: string) => ({ expectedVersion: version, decision, rationale: `por ${decision}`, messageToProfessional: 'Texto' });
    // A la vez: uno solo gana.
    const [r1, r2] = await Promise.all([adm(app, a.token).decidir(pro.id, 'NUTRICION', cuerpo('SUSPEND')), adm(app, b.token).decidir(pro.id, 'NUTRICION', cuerpo('WITHDRAW_ENABLEMENT'))]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409]);
    expect([r1, r2].find((r) => r.status === 409)!.body.error.code).toBe('VERSION_CONFLICT');
    expect(await prisma.eventoDeVerificacion.count({ where: { identidadId: pro.id, tipoDeActor: 'ADMINISTRADOR' } })).toBe(1);
    expect(await prisma.novedad.count({ where: { destinatarioId: pro.id, tipo: 'DECISION_ADMINISTRATIVA' } })).toBe(1);
    // El rechazo queda auditado con su motivo.
    const rechazos = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-ADM-13', resultado: 'RECHAZO', sujetoId: pro.id } });
    expect(rechazos.map((x) => x.motivo)).toContain('VERSION_DEL_AREA');
  });

  it('un profesional inexistente o una identidad sin perfil profesional: el mismo 404', async () => {
    const a = await administradorListo(app, prisma, etiqueta('404'));
    const ase = await prepararAsesorado(app, etiqueta('404-ase'), { a3: true });
    for (const id of [randomUUID(), ase.id, 'no-es-un-id']) {
      const f = await adm(app, a.token).get(`/admin/professionals/${id}`).expect(404);
      expect(f.body.error.code).toBe('RESOURCE_NOT_FOUND');
      await adm(app, a.token).get(`/admin/professionals/${id}/history`).expect(404);
      await adm(app, a.token).decidir(id, 'NUTRICION', { expectedVersion: 'a1-1', decision: 'SUSPEND', rationale: 'x', messageToProfessional: 'x' }).expect(404);
    }
  });

  it('la lista: búsqueda sin tildes, filtros por área y situación, pendientes primero y paginación', async () => {
    const a = await administradorListo(app, prisma, etiqueta('lista'));
    const marca = randomUUID().slice(0, 6);
    const pendiente = await profesionalPendiente(app, `${marca}-p`);
    const correo = correoSintetico(`lista-${marca}`);
    const id = await registrarOk(app, correo, 'WEB');
    await app.get(PrismaService).$transaction((tx) => app.get(VerificacionService).prepararProfesional(tx, id, { alcance: 'ENTRENAMIENTO', tipo: 'NO_SANITARIO', nombreVisible: `Prof. Núñez ${marca}`, estadoInicial: 'VERIFICADO' }, new Date()));
    const porNombre = await adm(app, a.token).post('/admin/professionals/query').send({ text: `NUNEZ ${marca}` }).expect(200);
    expect(porNombre.body.data.map((p: { professionalId: string }) => p.professionalId)).toEqual([id]);
    const pendientes = await adm(app, a.token).post('/admin/professionals/query').send({ situation: 'PENDING_REVIEW', limit: 50 }).expect(200);
    expect(pendientes.body.data.some((p: { professionalId: string }) => p.professionalId === pendiente.id)).toBe(true);
    expect(pendientes.body.totals.pendingReview).toBeGreaterThanOrEqual(1);
    const entrenamiento = await adm(app, a.token).post('/admin/professionals/query').send({ scope: 'ENTRENAMIENTO', text: marca }).expect(200);
    expect(entrenamiento.body.data.map((p: { professionalId: string }) => p.professionalId)).toEqual([id]);
    // La primera página tiene primero a los pendientes; la paginación no repite ni saltea.
    const vistos = new Set<string>();
    let cursor: string | undefined;
    let primera = true;
    do {
      const p = await adm(app, a.token).post('/admin/professionals/query').send({ limit: 25, ...(cursor ? { cursor } : {}) }).expect(200);
      if (primera && p.body.totals.pendingReview > 0) expect(p.body.data[0].scopes.some((s: { situation: string }) => s.situation === 'PENDING_REVIEW')).toBe(true);
      primera = false;
      for (const x of p.body.data as { professionalId: string }[]) {
        expect(vistos.has(x.professionalId)).toBe(false);
        vistos.add(x.professionalId);
      }
      cursor = p.body.page.nextCursor ?? undefined;
    } while (cursor);
    expect(vistos.size).toBe(await prisma.perfilProfesional.count());
    await adm(app, a.token).post('/admin/professionals/query').send({ cursor: 'no-es-un-cursor' }).expect(400);
    // La búsqueda no queda en la auditoría.
    const lecturas = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-ADM-10', actorId: a.id } });
    expect(JSON.stringify(lecturas)).not.toContain(marca);
  });
});

// ─── 5 y 6 · Efecto real: una suspensión corta el área, conserva todo y restablecer reevalúa ────

describe('Efectos sobre el acceso (criterios 5 y 6; TEST-RF-014)', () => {
  it('suspender Nutrición corta esa área desde el pedido siguiente, con la sesión abierta, y no toca Entrenamiento', async () => {
    const pro = await prepararProfesional(app, etiqueta('efecto'), ['NUTRICION', 'ENTRENAMIENTO']);
    const c = await circuitoConPlanActivo(app, etiqueta('efecto-n'), pro);
    await vinculoCompleto(app, pro, c.ase, 'ENTRENAMIENTO');
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const a = await administradorListo(app, prisma, etiqueta('efecto-adm'));
    const pide = (ruta: string) => conSesion(app, pro.token).get(ruta);
    await pide(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).expect(200);
    const antes = { planes: await prisma.planNutricional.count({ where: { profesionalId: pro.id } }), comidas: await prisma.ingestaNutricional.count({ where: { asesoradoId: c.ase.id } }) };
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'SUSPEND').expect(200);
    // La misma sesión del profesional: Nutrición no, Entrenamiento sí.
    await pide(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).expect(404);
    await pide('/api/v1/nutrition/plan-templates').expect(403);
    await pide(`/api/v1/advisees/${c.ase.id}/training/evaluations`).expect(200);
    await pide('/api/v1/training/plan-templates').expect(200);
    // Nada se borró.
    expect({ planes: await prisma.planNutricional.count({ where: { profesionalId: pro.id } }), comidas: await prisma.ingestaNutricional.count({ where: { asesoradoId: c.ase.id } }) }).toEqual(antes);
    // La persona: su historia propia se lee; «Hoy» dice no disponible (un estado que las APK conocen) y registrar en ese plan no se puede.
    await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/executions').expect(200);
    expect((await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200)).body.data.planState).toBe('NOT_AVAILABLE');
    await registrarComida(app, c.ase, c.planId, c.dia).expect(404);
    // Rehabilitar: vuelve a operar.
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'REINSTATE', { messageToProfessional: undefined }).expect(200);
    await pide(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).expect(200);
    // Otra comida (la de ayer): la de hoy ya estaba registrada.
    await registrarComida(app, c.ase, c.planId, c.dia, { ocurrencia: new Date(Date.now() - 86_400_000) }).expect(201);
  });

  it('restablecer no recupera un consentimiento revocado ni un vínculo finalizado durante la suspensión', async () => {
    const pro = await prepararProfesional(app, etiqueta('reeval'), ['NUTRICION']);
    const revoca = await prepararAsesorado(app, etiqueta('reeval-r'), { a3: true });
    const finaliza = await prepararAsesorado(app, etiqueta('reeval-f'), { a3: true });
    const sigue = await prepararAsesorado(app, etiqueta('reeval-s'), { a3: true });
    const vR = await vinculoCompleto(app, pro, revoca, 'NUTRICION');
    const vF = await vinculoCompleto(app, pro, finaliza, 'NUTRICION');
    await vinculoCompleto(app, pro, sigue, 'NUTRICION');
    const a = await administradorListo(app, prisma, etiqueta('reeval-adm'));
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'SUSPEND').expect(200);
    await revocarB2(app, revoca, vR.consentId as string).expect(200);
    await finalizar(app, finaliza.token, vF.vinculoId, await versionDeVinculo(app, finaliza.token, vF.vinculoId)).expect(200);
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'REINSTATE', { messageToProfessional: undefined }).expect(200);
    await conSesion(app, pro.token).get(`/api/v1/advisees/${sigue.id}/nutrition/evaluations`).expect(200);
    await conSesion(app, pro.token).get(`/api/v1/advisees/${revoca.id}/nutrition/evaluations`).expect(404);
    await conSesion(app, pro.token).get(`/api/v1/advisees/${finaliza.id}/nutrition/evaluations`).expect(404);
    // En la base también: rehabilitar no toca lo que se cortó durante la suspensión (pasada de cierre del 2026-10-25).
    expect(await prisma.consentimiento.findUnique({ where: { id: vR.consentId as string } })).toMatchObject({ situacion: 'REVOCADO' });
    // `relationshipId` es el vínculo en esa área (AlcanceDeVinculo).
    expect(await prisma.alcanceDeVinculo.findUnique({ where: { id: vF.vinculoId }, select: { estado: true } })).toEqual({ estado: 'FINALIZADO' });
  });

  it('el cruce: una operación profesional en curso termina antes de la decisión; la siguiente ya no pasa', async () => {
    const c = await circuitoConPlanActivo(app, etiqueta('cruce'));
    const a = await administradorListo(app, prisma, etiqueta('cruce-adm'));
    const pdp = app.get(PdpService);
    const base = app.get(PrismaService);
    /**
     * Abre una transacción que hace lo que hace una operación del profesional (decidir con el PDP, o la comprobación de un
     * catálogo) y la deja abierta; mientras tanto, pide la decisión. La decisión espera hasta que la operación confirma.
     * Que espera lo dice la base (la barrera por bloqueos de `soporte-concurrencia.ts`): antes era un plazo de 800 ms, que
     * daba la espera por buena si la decisión todavía no había terminado, aunque no hubiera llegado a esperar nada.
     */
    const cruzar = async (enCurso: (tx: Parameters<Parameters<typeof base.$transaction>[0]>[0]) => Promise<void>, decision: string) => {
      const version = (await area(a, c.pro.id, 'NUTRICION')).version as string;
      let soltar!: () => void;
      const espera = new Promise<void>((r) => (soltar = r));
      let tomado!: (pid: number) => void;
      const conBloqueo = new Promise<number>((r) => (tomado = r));
      const transaccion = base.$transaction(
        async (tx) => {
          await enCurso(tx);
          tomado(await pidDeLaTransaccion(tx));
          await espera;
        },
        { timeout: 30_000, maxWait: 10_000 },
      );
      const operacionEnCurso = await conBloqueo;
      let termino = false;
      const pedida = adm(app, a.token)
        .decidir(c.pro.id, 'NUTRICION', { expectedVersion: version, decision, rationale: 'cruce', messageToProfessional: 'cruce' })
        .then((r) => {
          termino = true;
          return r.status;
        });
      await esperarQueEsperen(prisma, 1, { bloqueadoPor: operacionEnCurso, yaPaso: () => termino, que: `la decisión ${decision}, esperando lo que tomó la operación profesional en curso` });
      const terminoSinEsperar = termino;
      soltar();
      await transaccion;
      expect({ decisionEspero: !terminoSinEsperar, status: await pedida }).toEqual({ decisionEspero: true, status: 200 });
    };
    // 1. Una lectura de salud en curso (el PDP con sus bloqueos compartidos) y la suspensión.
    await cruzar(async (tx) => {
      await pdp.decidirEnTransaccion(tx, { operacion: 'PRUEBA-CRUCE', actorDeLaDecision: c.pro.id, profesionalId: c.pro.id, titularId: c.ase.id, alcance: 'NUTRICION', recurso: null }, ctx());
    }, 'SUSPEND');
    await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).expect(404);
    await decidirSobre(app, a.token, c.pro.id, 'NUTRICION', 'REINSTATE', { messageToProfessional: undefined }).expect(200);
    // 2. Una operación de catálogo en curso (la comprobación del área en modo compartido) y el retiro de la habilitación.
    await cruzar(async (tx) => {
      expect(await puedeOperarArea(tx, c.pro.id, 'NUTRICION')).toBe(true);
    }, 'WITHDRAW_ENABLEMENT');
    await conSesion(app, c.pro.token).get('/api/v1/nutrition/plan-templates').expect(403);
  });
});

// ─── 8 · Los avisos ─────────────────────────────────────────────────────────────────────────────

describe('Avisos (criterio 8)', () => {
  it('suspender avisa una vez al profesional y a cada persona vinculada (también en pausa), sin el fundamento; las APK los leen', async () => {
    const pro = await prepararProfesional(app, etiqueta('aviso'), ['NUTRICION', 'ENTRENAMIENTO']);
    const activa = await prepararAsesorado(app, etiqueta('aviso-a'), { a3: true, superficie: 'APK' });
    const enPausa = await prepararAsesorado(app, etiqueta('aviso-p'), { a3: true });
    const terminada = await prepararAsesorado(app, etiqueta('aviso-t'), { a3: true });
    const otraArea = await prepararAsesorado(app, etiqueta('aviso-o'), { a3: true });
    await vinculoCompleto(app, pro, activa, 'NUTRICION');
    const vp = await vinculoCompleto(app, pro, enPausa, 'NUTRICION');
    const vt = await vinculoCompleto(app, pro, terminada, 'NUTRICION');
    await vinculoCompleto(app, pro, otraArea, 'ENTRENAMIENTO');
    const { pausar } = await import('./soporte-vinculo');
    await pausar(app, enPausa.token, vp.vinculoId, await versionDeVinculo(app, enPausa.token, vp.vinculoId)).expect(200);
    await finalizar(app, terminada.token, vt.vinculoId, await versionDeVinculo(app, terminada.token, vt.vinculoId)).expect(200);
    const a = await administradorListo(app, prisma, etiqueta('aviso-adm'));
    const r = await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'SUSPEND', { rationale: 'Motivo interno reservado', messageToProfessional: 'Revisá la documentación con Administración.' }).expect(200);
    expect(r.body.data.notified).toEqual({ professional: true, linkedPeople: 2 });
    // En el orden en que se registraron: sin `orderBy`, PostgreSQL no garantiza el de inserción (en la CI del 2026-10-25 los
    // dos avisos de la persona salieron invertidos una vez). Las dos decisiones son pedidos sucesivos, con instantes distintos.
    const tipos = async (id: string) =>
      (await prisma.novedad.findMany({ where: { destinatarioId: id }, orderBy: { momentoDeRegistro: 'asc' } })).map((n) => n.tipo).filter((t) => t.startsWith('ACCESO') || t === 'DECISION_ADMINISTRATIVA');
    expect(await tipos(pro.id)).toEqual(['DECISION_ADMINISTRATIVA']);
    expect(await tipos(activa.id)).toEqual(['ACCESO_PROFESIONAL_SUSPENDIDO']);
    expect(await tipos(enPausa.id)).toEqual(['ACCESO_PROFESIONAL_SUSPENDIDO']);
    expect(await tipos(terminada.id)).toEqual([]);
    expect(await tipos(otraArea.id)).toEqual([]);
    // Lo que lee el profesional: la decisión y el texto comunicado, nunca el fundamento interno; de BE, no del administrador.
    const delPro = (await conSesion(app, pro.token).get('/api/v1/me/news').expect(200)).body.data.find((n: { kind: string }) => n.kind === 'ADMINISTRATIVE_DECISION');
    expect(delPro).toMatchObject({ scope: 'NUTRICION', source: null, open: { view: 'NEWS', referenceId: null } });
    expect(delPro.body).toContain('Revisá la documentación con Administración.');
    expect(JSON.stringify(delPro)).not.toContain('Motivo interno reservado');
    expect(JSON.stringify(delPro)).not.toContain(a.id);
    // Lo que lee la persona, con la APK candidata 0.17.0-3 (DL-152): el efecto, sin motivos, con vistas que conoce.
    const apk = new LaApk('0.17.0-candidata.3', () => app);
    const lista = (await apk.pide('API-NOV-01', { token: activa.token, consulta: { limit: '30' } })).body.data as { newsId: string; kind: string; body: string; open: { view: string } }[];
    const aviso = lista.find((n) => n.kind === 'PROFESSIONAL_ACCESS_SUSPENDED')!;
    expect(aviso.open.view).toBe('RELATIONSHIPS');
    expect(aviso.body).toMatch(/tiene suspendido el acceso a Nutrición en BE/);
    expect(aviso.body).not.toContain('Revisá la documentación');
    expect(aviso.body).not.toContain('Motivo interno');
    await apk.pide('API-NOV-02', { token: activa.token, params: { newsId: aviso.newsId } });
    expect(apk.rechazos()).toEqual([]);
    // Restablecer avisa el regreso, con la condición del vínculo y la autorización.
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'REINSTATE', { messageToProfessional: undefined }).expect(200);
    expect(await tipos(activa.id)).toEqual(['ACCESO_PROFESIONAL_SUSPENDIDO', 'ACCESO_PROFESIONAL_RESTABLECIDO']);
    const regreso = (await apk.pide('API-NOV-01', { token: activa.token, consulta: { limit: '30' } })).body.data.find((n: { kind: string }) => n.kind === 'PROFESSIONAL_ACCESS_RESTORED');
    expect(regreso.body).toMatch(/solo si su vínculo con vos y tu autorización siguen vigentes/);
    expect(apk.rechazos()).toEqual([]);
  });

  it('una observación avisa solo al profesional; una decisión rechazada no avisa a nadie', async () => {
    const pro = await profesionalPendiente(app, etiqueta('aviso-obs'));
    const a = await administradorListo(app, prisma, etiqueta('aviso-obs-adm'));
    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'OBSERVE').expect(200);
    expect(await prisma.novedad.count({ where: { destinatarioId: pro.id, tipo: 'DECISION_ADMINISTRATIVA' } })).toBe(1);
    await adm(app, a.token).decidir(pro.id, 'NUTRICION', { expectedVersion: 'a1-0', decision: 'VERIFY', rationale: 'vieja' }).expect(409);
    expect(await prisma.novedad.count({ where: { destinatarioId: pro.id, tipo: 'DECISION_ADMINISTRATIVA' } })).toBe(1);
  });
});

// ─── 9 · La siembra no deshace decisiones humanas ───────────────────────────────────────────────

describe('Convivencia con la preparación de la demostración (criterio 9; D-7)', () => {
  it('reiniciar la API y repetir la preparación después de una observación, una suspensión y una retirada no cambia nada', async () => {
    const declarar = async (e: string) => {
      const correo = correoSintetico(`demo-${e}`);
      return { correo, id: await registrarOk(app, correo, 'WEB') };
    };
    const observado = await declarar(etiqueta('siembra-o'));
    const suspendido = await declarar(etiqueta('siembra-s'));
    const retirado = await declarar(etiqueta('siembra-r'));
    const sinDecision = await declarar(etiqueta('siembra-n'));
    const demo = [
      { identidadId: observado.id, alcance: 'NUTRICION' as const, tipo: 'SANITARIO' as const, nombreVisible: 'Lic. Observada', estadoInicial: 'PENDIENTE' as const },
      { identidadId: suspendido.id, alcance: 'NUTRICION' as const, tipo: 'SANITARIO' as const, nombreVisible: 'Lic. Suspendida', estadoInicial: 'VERIFICADO' as const },
      { identidadId: retirado.id, alcance: 'ENTRENAMIENTO' as const, tipo: 'NO_SANITARIO' as const, nombreVisible: 'Prof. Retirado', estadoInicial: 'VERIFICADO' as const },
      { identidadId: sinDecision.id, alcance: 'ANTROPOMETRIA' as const, tipo: 'NO_SANITARIO' as const, nombreVisible: 'Prof. Sin decisión', estadoInicial: 'VERIFICADO' as const },
      // La misma identidad suspendida, en otra área sin decisión: esa sí la sigue preparando.
      { identidadId: suspendido.id, alcance: 'ANTROPOMETRIA' as const, tipo: 'SANITARIO' as const, nombreVisible: 'Lic. Suspendida', estadoInicial: 'VERIFICADO' as const },
    ];
    let conSiembra = await appDePrueba({ demoProfesionales: demo });
    try {
      const a = await administradorListo(conSiembra, prisma, etiqueta('siembra-adm'));
      const decidir = (id: string, alcance: string, decision: string) => decidirSobre(conSiembra, a.token, id, alcance, decision).expect(200);
      await decidir(observado.id, 'NUTRICION', 'OBSERVE');
      await decidir(suspendido.id, 'NUTRICION', 'SUSPEND');
      await decidir(retirado.id, 'ENTRENAMIENTO', 'WITHDRAW_ENABLEMENT');
      const foto = async () => {
        const v = await prisma.verificacionProfesional.findMany({ where: { identidadId: { in: [observado.id, suspendido.id, retirado.id, sinDecision.id] } }, orderBy: [{ identidadId: 'asc' }, { alcance: 'asc' }] });
        const h = await prisma.habilitacion.findMany({ where: { identidadId: { in: [observado.id, suspendido.id, retirado.id, sinDecision.id] } }, orderBy: [{ identidadId: 'asc' }, { alcance: 'asc' }] });
        return { v: v.map((x) => `${x.identidadId}|${x.alcance}|${x.estado}|${x.version}`), h: h.map((x) => `${x.identidadId}|${x.alcance}|${x.estado}|${x.version}`) };
      };
      const antes = await foto();
      expect(antes.v).toContain(`${observado.id}|NUTRICION|PENDIENTE|2`);
      expect(antes.v).toContain(`${suspendido.id}|NUTRICION|SUSPENDIDO|3`);
      expect(antes.h).toContain(`${retirado.id}|ENTRENAMIENTO|RETIRADA|2`);
      // Reiniciar la API: la siembra corre al arrancar.
      await conSiembra.close();
      conSiembra = await appDePrueba({ demoProfesionales: demo });
      expect(await foto()).toEqual(antes);
      // Repetir la preparación a mano, como las pruebas y las herramientas de datos.
      const verificacion = conSiembra.get(VerificacionService);
      for (const d of demo) await conSiembra.get(PrismaService).$transaction((tx) => verificacion.prepararProfesional(tx, d.identidadId, d, new Date()));
      expect(await foto()).toEqual(antes);
      // Lo que no tiene decisión humana sí sigue preparado.
      expect(antes.v).toContain(`${sinDecision.id}|ANTROPOMETRIA|VERIFICADO|2`);
      expect(antes.v).toContain(`${suspendido.id}|ANTROPOMETRIA|VERIFICADO|2`);
    } finally {
      await conSiembra.close();
    }
  });
});

// ─── Revisión de seguridad del 2026-10-25 · el segundo factor ───────────────────────────────────

/** La sesión de un token (su `sid`), para mirarla en la base. */
const sesionDelToken = (token: string): string => JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8')).sid as string;

describe('Revisión de seguridad del 2026-10-25 (el segundo factor)', () => {
  it('F1 · diez códigos que no valen seguidos, en varias sesiones, bloquean el autenticador; un código de recuperación lo desbloquea', async () => {
    const a = await administradorListo(app, prisma, etiqueta('bloqueo'));
    // Dos sesiones con cinco códigos que no valen cada una: la quinta de cada una revoca su sesión.
    for (let s = 0; s < 2; s++) {
      const t = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
      for (let i = 0; i < 4; i++) await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: codigoQueNoVale(a.secreto) }).expect(422);
      await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: codigoQueNoVale(a.secreto) }).expect(401);
    }
    // En una tercera sesión, ni el código correcto se evalúa: el autenticador está bloqueado.
    const t3 = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    const bloqueado = await adm(app, t3).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(422);
    expect(bloqueado.body.error.code).toBe('SECOND_FACTOR_LOCKED');
    await adm(app, t3).get(`/admin/professionals/${randomUUID()}`).expect(403); // MFA_REQUIRED: bloqueado no es verificado
    // Un código de recuperación entra y lo desbloquea; desde ahí, el autenticador vuelve a valer.
    await adm(app, t3).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: a.codigosDeRecuperacion[0] }).expect(200);
    const t4 = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    await adm(app, t4).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(200);
    const motivos = await prisma.registroDeAuditoria.findMany({
      where: { sujetoId: a.id, operacion: { in: ['API-ADM-05', 'API-ADM-06'] }, motivo: { startsWith: 'AUTENTICADOR_' } },
      select: { motivo: true },
    });
    expect(motivos.map((m) => m.motivo).sort()).toEqual(['AUTENTICADOR_BLOQUEADO', 'AUTENTICADOR_BLOQUEADO_AHORA', 'AUTENTICADOR_DESBLOQUEADO']);
    expect((await prisma.factorTotp.findFirst({ where: { identidadId: a.id, estado: 'ACTIVO' }, select: { fallosSeguidos: true } }))?.fallosSeguidos).toBe(0);
  });

  it('F2 · un código que esperaba detrás del quinto fallido no se evalúa: la sesión ya se revocó (la carrera, con una barrera)', async () => {
    const a = await administradorListo(app, prisma, etiqueta('paralelo'));
    const t = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    const sid = sesionDelToken(t);
    // El quinto código que no vale, a mano: tiene tomada la fila del segundo factor de la sesión mientras llega otro pedido,
    // con un código bueno. Ese pedido pasa el guard con la sesión todavía activa y queda esperando la fila. La prueba
    // revoca la sesión recién cuando la base dice que el pedido espera esa fila (antes, una pausa de 500 ms).
    let termino = false;
    let pedido!: Promise<request.Response>;
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM "segundo_factor_de_sesion" WHERE "sesion_id" = ${sid}::uuid FOR UPDATE`;
        const quinto = await pidDeLaTransaccion(tx);
        pedido = adm(app, t)
          .post('/admin/auth/sessions/current/second-factor')
          .send({ code: codigoTotp(a.secreto, 30_000) })
          .then((r) => {
            termino = true;
            return r;
          });
        await esperarQueEsperen(prisma, 1, { bloqueadoPor: quinto, yaPaso: () => termino, que: 'el código bueno, esperando la fila del segundo factor de su sesión' });
        if (termino) throw new Error('El código bueno terminó sin esperar la fila: la carrera no se reprodujo.');
        await tx.segundoFactorDeSesion.update({ where: { sesionId: sid }, data: { intentosFallidos: 5 } });
        await tx.$executeRaw`UPDATE "sesion" SET "estado" = 'REVOCADA', "motivo_de_revocacion" = 'SEGUNDO_FACTOR_FALLIDO', "momento_de_finalizacion" = GREATEST(now(), "momento_de_ocurrencia") WHERE "id" = ${sid}::uuid`;
      },
      { timeout: 30_000 },
    );
    const r = await pedido;
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('SESSION_REVOKED');
    const s = await prisma.segundoFactorDeSesion.findUnique({ where: { sesionId: sid }, select: { verificadoEn: true } });
    expect(s?.verificadoEn ?? null).toBeNull();
    // El 401 salió de adentro de la transacción del pedido, que se revirtió: el rechazo queda en la auditoría igual, con el
    // motivo del guard y sin un éxito (pendiente 3 del §14).
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { recursoId: sid, operacion: 'API-ADM-05' }, select: { resultado: true, motivo: true } });
    expect(auditoria).toEqual([{ resultado: 'RECHAZO', motivo: 'SESION_REVOCADA' }]);
  });

  it('F3 · el restablecimiento del operador no deja vivo un autenticador que se activa al mismo tiempo', async () => {
    const correo = correoSintetico(`adm-${etiqueta('carrera')}`);
    const id = await registrarOk(app, correo, 'WEB');
    const { codigo } = await incorporarAdministrador(prisma, { correo, nombre: 'Admin carrera', fundamento: 'Prueba de la carrera', operador: 'Prueba de integración', appEnv: 'test' });
    const t = (await primerFactor(app, correo).expect(201)).body.data.session.accessToken as string;
    await adm(app, t).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: codigo }).expect(200);
    const pendiente = await prisma.factorTotp.findFirstOrThrow({ where: { identidadId: id, estado: 'PENDIENTE' }, select: { id: true } });
    // Una confirmación que tiene el autenticador tomado y lo activa mientras el operador corre el comando. Lo activa recién
    // cuando la base dice que el comando quedó esperando esa fila (antes, una pausa de 400 ms).
    let comandoTermino = false;
    let comando!: Promise<string>;
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM "factor_totp" WHERE "id" = ${pendiente.id}::uuid FOR UPDATE`;
        const confirmacion = await pidDeLaTransaccion(tx);
        comando = restablecerSegundoFactor(prisma, { correo, fundamento: 'Perdió el autenticador (sintético)', operador: 'Prueba de integración' })
          .then(
            () => 'listo',
            (e: unknown) => (e instanceof Error ? e.message : String(e)),
          )
          .finally(() => {
            comandoTermino = true;
          });
        await esperarQueEsperen(prisma, 1, { bloqueadoPor: confirmacion, yaPaso: () => comandoTermino, que: 'el comando del operador, esperando el autenticador que se está activando' });
        if (comandoTermino) throw new Error('El comando terminó sin esperar el autenticador: la carrera no se reprodujo.');
        await tx.factorTotp.update({ where: { id: pendiente.id }, data: { estado: 'ACTIVO', momentoDeActivacion: new Date(), ultimoPaso: 1n } });
      },
      { timeout: 30_000 },
    );
    expect(await comando).toBe('listo');
    expect(await prisma.factorTotp.count({ where: { identidadId: id, estado: { in: ['ACTIVO', 'PENDIENTE'] } } })).toBe(0);
  });

  it('F4 · generar códigos nuevos o reemplazar el autenticador termina las otras sesiones administrativas; la propia sigue', async () => {
    const a = await administradorListo(app, prisma, etiqueta('renovar'));
    const otra = await otraSesion(app, a);
    const nuevos = (await adm(app, a.token).post('/admin/auth/recovery-codes').send({ credential: CREDENCIAL_SINTETICA }).expect(200)).body.data.recoveryCodes as string[];
    await adm(app, otra).get('/admin/auth/sessions/current').expect(401);
    await adm(app, a.token).get('/admin/auth/sessions/current').expect(200);
    expect((await prisma.sesion.findUnique({ where: { id: sesionDelToken(otra) }, select: { motivoDeRevocacion: true } }))?.motivoDeRevocacion).toBe('CREDENCIALES_ADMINISTRATIVAS_RENOVADAS');
    // Una tercera sesión, con un código de recuperación nuevo; después, el reemplazo del autenticador desde la primera.
    const tercera = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    await adm(app, tercera).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: nuevos[0] }).expect(200);
    const secreto = (await adm(app, a.token).post('/admin/auth/second-factor/enrollment').send({ credential: CREDENCIAL_SINTETICA }).expect(200)).body.data.secret as string;
    await adm(app, a.token).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoTotp(secreto) }).expect(200);
    await adm(app, tercera).get('/admin/auth/sessions/current').expect(401);
    await adm(app, a.token).get('/admin/auth/sessions/current').expect(200);
  });

  it('F5 · los rechazos de los guards quedan auditados: una sesión común en Administración y una lectura sin el segundo factor', async () => {
    const pro = await prepararProfesional(app, etiqueta('f5'), ['NUTRICION']);
    await adm(app, pro.token).post('/admin/professionals/query').send({}).expect(403);
    expect(await prisma.registroDeAuditoria.count({ where: { actorId: pro.id, operacion: 'API-ADM-10', resultado: 'RECHAZO', motivo: 'SESION_NO_ADMINISTRATIVA' } })).toBe(1);
    const a = await administradorListo(app, prisma, etiqueta('f5-adm'));
    const solo = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    await adm(app, solo).get(`/admin/professionals/${pro.id}`).expect(403);
    expect(await prisma.registroDeAuditoria.count({ where: { actorId: a.id, operacion: 'API-ADM-11', resultado: 'RECHAZO', motivo: { startsWith: 'MFA_REQUERIDO:' } } })).toBe(1);
    // Ningún registro guarda el token.
    const filas = await prisma.registroDeAuditoria.findMany({ where: { actorId: { in: [pro.id, a.id] } } });
    expect(JSON.stringify(filas)).not.toContain(solo);
  });

  it('el código de incorporación tiene que seguir vigente al confirmar: uno anulado mientras tanto no completa la incorporación', async () => {
    const correo = correoSintetico(`adm-${etiqueta('vigencia')}`);
    const id = await registrarOk(app, correo, 'WEB');
    const { codigo } = await incorporarAdministrador(prisma, { correo, nombre: 'Admin vigencia', fundamento: 'Prueba de vigencia', operador: 'Prueba de integración', appEnv: 'test' });
    const t = (await primerFactor(app, correo).expect(201)).body.data.session.accessToken as string;
    const secreto = (await adm(app, t).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: codigo }).expect(200)).body.data.secret as string;
    await prisma.codigoDeIncorporacion.updateMany({ where: { identidadId: id, momentoDeUso: null, momentoDeAnulacion: null }, data: { momentoDeAnulacion: new Date() } });
    const r = await adm(app, t).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoTotp(secreto) }).expect(422);
    expect(r.body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect(await prisma.factorTotp.count({ where: { identidadId: id, estado: 'ACTIVO' } })).toBe(0);
  });
});
