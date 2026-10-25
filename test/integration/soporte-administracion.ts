/**
 * Soporte de las pruebas de WP-ADMINISTRACION (DL-155): administradores sintéticos incorporados con el comando interno (la
 * misma función que corre el operador), su acceso con dos factores por la API real y los códigos TOTP calculados con la
 * misma biblioteca (`otpauth`), sin ningún secreto en los registros de la prueba.
 */
import type { INestApplication } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import * as OTPAuth from 'otpauth';
import request from 'supertest';
import { incorporarAdministrador } from '../../apps/api/src/administracion/incorporacion';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { CREDENCIAL_SINTETICA, claveDeIdempotencia, correoSintetico, registrarOk, tokenDe } from './soporte-api';
import type { Parte } from './soporte-vinculo';

/** Un profesional con un área presentada y pendiente de revisión (el quinto campo PENDIENTE de la siembra). */
export async function profesionalPendiente(app: INestApplication, e: string, alcance: 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA' = 'NUTRICION'): Promise<Parte> {
  const correo = correoSintetico(`pend-${e}`);
  const id = await registrarOk(app, correo, 'WEB');
  const verificacion = app.get(VerificacionService);
  await app.get(PrismaService).$transaction((tx) => verificacion.prepararProfesional(tx, id, { alcance, tipo: 'SANITARIO', nombreVisible: `Lic. Pendiente ${e}`, estadoInicial: 'PENDIENTE' }, new Date()));
  return { correo, id, token: await tokenDe(app, correo, 'WEB') };
}

/** Un código de seis dígitos que no vale ahora (ni en el paso anterior ni en el siguiente). */
export function codigoQueNoVale(secreto: string): string {
  const validos = new Set([-30_000, 0, 30_000].map((d) => codigoTotp(secreto, d)));
  for (let n = Number(codigoTotp(secreto)) + 1; ; n++) {
    const candidato = String(n % 1_000_000).padStart(6, '0');
    if (!validos.has(candidato)) return candidato;
  }
}

export interface Administrador {
  readonly correo: string;
  readonly id: string;
  /** El token de la sesión con el segundo factor vigente. */
  readonly token: string;
  /** La clave del autenticador, en base32: solo en memoria de la prueba. */
  readonly secreto: string;
  readonly codigosDeRecuperacion: readonly string[];
  /** El último código TOTP usado (para probar que no se acepta otra vez). */
  readonly ultimoCodigo: string;
}

/** El código del autenticador para el momento pedido (por omisión, ahora). */
export function codigoTotp(secreto: string, desfaseMs = 0): string {
  return new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secreto), algorithm: 'SHA1', digits: 6, period: 30 }).generate({ timestamp: Date.now() + desfaseMs });
}

export function adm(app: INestApplication, token?: string) {
  const s = app.getHttpServer();
  const con = (r: request.Test) => (token ? r.set('Authorization', `Bearer ${token}`) : r).set('X-BE-Surface', 'WEB');
  return {
    get: (ruta: string) => con(request(s).get(`/api/v1${ruta}`)),
    post: (ruta: string) => con(request(s).post(`/api/v1${ruta}`)),
    delete: (ruta: string) => con(request(s).delete(`/api/v1${ruta}`)),
    decidir: (profesionalId: string, alcance: string, cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) =>
      con(request(s).post(`/api/v1/admin/professionals/${profesionalId}/scopes/${alcance}/decisions`)).set('Idempotency-Key', clave).send(cuerpo),
  };
}

/** El primer factor de Administración: correo y contraseña. */
export function primerFactor(app: INestApplication, correo: string, credencial = CREDENCIAL_SINTETICA) {
  return adm(app).post('/admin/auth/sessions').send({ identifier: correo, credential: credencial });
}

/**
 * Una cuenta registrada por el alta pública, incorporada como administradora con el comando interno, con su autenticador
 * configurado y una sesión con el segundo factor vigente.
 */
export async function administradorListo(app: INestApplication, prisma: PrismaClient, etiqueta: string, nombre = `Admin ${etiqueta}`): Promise<Administrador> {
  const correo = correoSintetico(`adm-${etiqueta}`);
  const id = await registrarOk(app, correo, 'WEB');
  const { codigo } = await incorporarAdministrador(prisma, { correo, nombre, fundamento: 'Prueba sintética de Administración', operador: 'Prueba de integración', appEnv: 'test' });
  const sesion = await primerFactor(app, correo).expect(201);
  const token = sesion.body.data.session.accessToken as string;
  const configuracion = await adm(app, token).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: codigo }).expect(200);
  const secreto = configuracion.body.data.secret as string;
  const ultimoCodigo = codigoTotp(secreto);
  const confirmada = await adm(app, token).post('/admin/auth/second-factor/enrollment/confirm').send({ code: ultimoCodigo }).expect(200);
  return { correo, id, token, secreto, codigosDeRecuperacion: confirmada.body.data.recoveryCodes as string[], ultimoCodigo };
}

/** Otra sesión del mismo administrador, con un código del paso siguiente (el anterior ya se usó). */
export async function otraSesion(app: INestApplication, a: Administrador, desfaseMs = 30_000): Promise<string> {
  const sesion = await primerFactor(app, a.correo).expect(201);
  const token = sesion.body.data.session.accessToken as string;
  await adm(app, token).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, desfaseMs) }).expect(200);
  return token;
}

/**
 * Una decisión con la versión del área que se acaba de leer en la ficha, como hace la consola. `expect(status)` la manda y
 * comprueba el estado; si no coincide, el error muestra el cuerpo de la respuesta.
 */
export function decidirSobre(app: INestApplication, token: string, profesionalId: string, alcance: string, decision: string, extra: Record<string, unknown> = {}, clave?: string) {
  return {
    async expect(status: number): Promise<request.Response> {
      const ficha = await adm(app, token).get(`/admin/professionals/${profesionalId}`).expect(200);
      const area = (ficha.body.data.scopes as { scope: string; version: string }[]).find((a) => a.scope === alcance)!;
      const r = await adm(app, token).decidir(profesionalId, alcance, { expectedVersion: area.version, decision, rationale: `Fundamento interno de ${decision}`, messageToProfessional: `Texto para el profesional (${decision})`, ...extra }, clave);
      if (r.status !== status) throw new Error(`${decision} sobre ${alcance}: se esperaba ${status} y respondió ${r.status} ${JSON.stringify(r.body).slice(0, 600)}`);
      return r;
    },
  };
}
