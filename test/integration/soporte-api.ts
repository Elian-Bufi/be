/**
 * Soporte e2e de WP-02: AppModule completo (guards + filtro + prefijo) con supertest contra PostgreSQL real
 * (07:1702). Solo datos sintéticos: correos en el dominio reservado `example.invalid` (RFC 2606) y credenciales
 * de prueba evidentemente ficticias.
 */
import type { INestApplication } from '@nestjs/common';
import { VERSION_VIGENTE, type Procedencia } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import request from 'supertest';
import { crearApp } from '../../apps/api/src/bootstrap';
import type { Entorno } from '../../apps/api/src/config/entorno';
import { EstadoDeCuentaService } from '../../apps/api/src/identidad/estado-de-cuenta.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { RAIZ } from './soporte';

export const CREDENCIAL_SINTETICA = 'clave-sintetica-de-prueba-01';
export const OTRA_CREDENCIAL_SINTETICA = 'otra-clave-sintetica-de-prueba';

export function entornoDePrueba(cambios: Partial<Entorno> = {}): Entorno {
  return {
    appEnv: 'test',
    port: 0,
    databaseUrl: process.env.DATABASE_URL as string,
    corsAllowedOrigins: [],
    jwtSecret: 'secreto-sintetico-de-integracion-de-32-caracteres',
    costoBcrypt: 10,
    // Límites altos: las pruebas de límite usan su propia app con límites bajos.
    limites: {
      login: { maximo: 10_000, ventanaMs: 60_000 },
      loginPorIp: { maximo: 10_000, ventanaMs: 60_000 },
      loginPorIdentificador: { maximo: 10_000, ventanaMs: 60_000 },
      registro: { maximo: 10_000, ventanaMs: 60_000 },
      consultaProtegida: { maximo: 10_000, ventanaMs: 60_000 },
    },
    saltosDeProxy: 0,
    caducidadDeSolicitudMs: 30 * 24 * 60 * 60 * 1000,
    demoProfesionales: [],
    ...cambios,
  };
}

/** `antesDeIniciar` permite montar middleware de observación (p. ej. el contract test) antes de las rutas. */
export async function appDePrueba(cambios: Partial<Entorno> = {}, antesDeIniciar?: (app: INestApplication) => void): Promise<INestApplication> {
  const app = await crearApp({
    entorno: entornoDePrueba(cambios),
    version: { aplicacion: '0.1.0', commit: 'integracion', construidoEn: null },
    directorioMigraciones: join(RAIZ, 'prisma', 'migrations'),
  });
  antesDeIniciar?.(app);
  await app.init();
  // Escucha en un puerto propio. Sin esto, supertest abre y cierra el servidor en cada request, y con requests
  // concurrentes las que siguen en vuelo reciben ECONNRESET: la prueba mediría el harness, no la API.
  await app.listen(0);
  return app;
}

/** Correo sintético único por prueba, en un dominio que nunca resuelve. */
export function correoSintetico(etiqueta: string): string {
  return `persona-${etiqueta}-${randomUUID().slice(0, 8)}@example.invalid`;
}

export function claveDeIdempotencia(): string {
  return `prueba-${randomUUID()}`;
}

export function cuerpoDeRegistro(correo: string, credencial = CREDENCIAL_SINTETICA): Record<string, unknown> {
  return {
    registrationIntent: 'ADVISEE',
    identity: { localIdentifier: correo, localCredential: credencial },
    termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
    privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
  };
}

export function registrar(app: INestApplication, correo: string, opciones: { clave?: string; superficie?: 'WEB' | 'APK'; credencial?: string } = {}) {
  const req = request(app.getHttpServer())
    .post('/api/v1/registrations')
    .set('Idempotency-Key', opciones.clave ?? claveDeIdempotencia());
  if (opciones.superficie) req.set('X-BE-Surface', opciones.superficie);
  return req.send(cuerpoDeRegistro(correo, opciones.credencial));
}

export function login(app: INestApplication, identificador: string, credencial = CREDENCIAL_SINTETICA, superficie?: 'WEB' | 'APK') {
  const req = request(app.getHttpServer()).post('/api/v1/auth/sessions');
  if (superficie) req.set('X-BE-Surface', superficie);
  return req.send({ method: 'LOCAL', identifier: identificador, credential: credencial });
}

/** Registra y devuelve el id de la identidad creada. */
export async function registrarOk(app: INestApplication, correo: string, superficie?: 'WEB' | 'APK'): Promise<string> {
  const res = await registrar(app, correo, { superficie }).expect(201);
  return res.body.data.identityId as string;
}

/** Inicia sesión y devuelve el access token. */
export async function tokenDe(app: INestApplication, correo: string, superficie?: 'WEB' | 'APK'): Promise<string> {
  const res = await login(app, correo, CREDENCIAL_SINTETICA, superficie).expect(201);
  return res.body.data.session.accessToken as string;
}

export function conSesion(app: INestApplication, token: string) {
  const servidor = app.getHttpServer();
  return {
    get: (ruta: string) => request(servidor).get(ruta).set('Authorization', `Bearer ${token}`),
    delete: (ruta: string) => request(servidor).delete(ruta).set('Authorization', `Bearer ${token}`),
    post: (ruta: string, clave = claveDeIdempotencia()) =>
      request(servidor).post(ruta).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', clave),
  };
}

export function cuerpoDeCierre(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return { consequencesAcknowledgement: { versionId: VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id }, confirmed: true, ...cambios };
}

const PROCEDENCIA_DE_SERVICIO: Procedencia = {
  fuente: 'PROPIA',
  casoDeUso: 'PRUEBA',
  operacion: 'SERVICIO_INTERNO',
  superficie: null,
  requestId: null,
};

/** SuspenderCuenta / RestablecerCuenta: solo servicio interno (DL-020). */
export async function transicionPorServicio(
  app: INestApplication,
  identidadId: string,
  transicion: 'SuspenderCuenta' | 'RestablecerCuenta',
  motivo = 'motivo sintético de prueba',
) {
  const prisma = app.get(PrismaService);
  const servicio = app.get(EstadoDeCuentaService);
  const contexto =
    transicion === 'SuspenderCuenta'
      ? ({ transicion, actor: 'SERVICIO_INTERNO', fundamento: motivo } as const)
      : ({ transicion, actor: 'SERVICIO_INTERNO', resolucion: motivo } as const);
  return prisma.$transaction((tx: Prisma.TransactionClient) =>
    servicio.transicionar(tx, identidadId, contexto, { servicio: 'SERVICIO_INTERNO' }, PROCEDENCIA_DE_SERVICIO, new Date()),
  );
}

export function mediana(valores: number[]): number {
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
}
