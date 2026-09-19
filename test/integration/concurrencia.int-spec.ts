/**
 * Concurrencia del cierre y del login (TEST-RF-069 · TEST-RF-002 · TEST-AUTH-011 en carrera · 06 §5.7.4).
 * Deterministas: una transacción retiene el bloqueo de la fila `identidad` mientras las requests llegan, y se suelta
 * recién cuando la base informa que quedaron esperando (`pg_locks`). Sin FOR UPDATE en el cierre o sin FOR SHARE en el
 * login, estas pruebas fallan.
 */
import type { INestApplication } from '@nestjs/common';
import { VERSION_VIGENTE, type ContextoDeTransicionDeCuenta } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import type { Test } from 'supertest';
import { EstadoDeCuentaService } from '../../apps/api/src/identidad/estado-de-cuenta.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, conSesion, correoSintetico, cuerpoDeCierre, login, registrarOk, tokenDe } from './soporte-api';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

/** Espera hasta que al menos `n` pedidos de bloqueo estén en espera sobre la fila de esa identidad. */
async function esperarBloqueados(n: number): Promise<void> {
  for (let i = 0; i < 400; i++) {
    const [{ esperando }] = await prisma.$queryRaw<{ esperando: bigint }[]>`
      SELECT count(*)::bigint AS "esperando" FROM pg_locks WHERE NOT granted`;
    if (Number(esperando) >= n) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`nunca hubo ${n} requests esperando el bloqueo`);
}

/** Dispara la request ya (supertest es perezoso) y devuelve su promesa. */
const disparar = (t: Test) => t.then((r) => r);

it('TEST-RF-069 / 06 §5.7.4: dos cierres simultáneos con keys distintas → exactamente un CuentaCerrada; el otro 422 INVALID_STATE_TRANSITION', async () => {
  const correo = correoSintetico('cierre-doble');
  const id = await registrarOk(app, correo);
  const a = await tokenDe(app, correo, 'WEB');
  const b = await tokenDe(app, correo, 'APK');

  let pendientes: Promise<{ status: number; body: { error?: { code: string } } }[]> | null = null;
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${id}::uuid FOR UPDATE`;
      pendientes = Promise.all([
        disparar(conSesion(app, a).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre())),
        disparar(conSesion(app, b).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre())),
      ]);
      await esperarBloqueados(2);
    },
    { timeout: 30_000 },
  );
  const respuestas = await pendientes!;
  expect(respuestas.map((r) => r.status).sort()).toEqual([201, 422]);
  expect(respuestas.find((r) => r.status === 422)?.body.error?.code).toBe('INVALID_STATE_TRANSITION');
  expect(await prisma.eventoDeDominio.count({ where: { identidadId: id, tipo: 'CuentaCerrada' } })).toBe(1);
  expect(await prisma.solicitudDeCierreDeCuenta.count({ where: { identidadId: id } })).toBe(1);
  expect(await prisma.registroDeSupresion.count({ where: { sujetoId: id } })).toBe(1);
});

it('TEST-AUTH-011 en carrera: un login con la contraseña correcta que llega mientras el cierre retiene la cuenta → 401, sin sesión ACTIVA, con auditoría del rechazo', async () => {
  const correo = correoSintetico('login-en-carrera');
  const id = await registrarOk(app, correo);
  const servicio = app.get(EstadoDeCuentaService);
  const contexto: ContextoDeTransicionDeCuenta = {
    transicion: 'CerrarCuenta',
    actor: 'TITULAR',
    sesionDelTitularValida: true,
    autenticacionReciente: true,
    versionDeConsecuenciasPresentada: VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id,
    confirmacionExplicita: true,
  };
  const procedencia = { fuente: 'PROPIA' as const, casoDeUso: 'PRUEBA', operacion: 'CONCURRENCIA', superficie: null, requestId: null };

  let pendiente: Promise<{ status: number; headers: Record<string, string> }> | null = null;
  await app.get(PrismaService).$transaction(
    async (tx) => {
      // El cierre real (FOR UPDATE + efectos) queda sin confirmar mientras llega el login.
      const r = await servicio.transicionar(tx, id, contexto, { identidadId: id }, procedencia, new Date());
      expect(r.permitida).toBe(true);
      pendiente = disparar(login(app, correo)) as never;
      await esperarBloqueados(1);
    },
    { timeout: 30_000 },
  );
  const res = await pendiente!;
  expect(res.status).toBe(401);
  expect(await prisma.sesion.count({ where: { identidadId: id, estado: 'ACTIVA' } })).toBe(0);
  const auditoria = await prisma.registroDeAuditoria.findFirst({ where: { requestId: res.headers['x-request-id'] } });
  expect(auditoria).toMatchObject({ operacion: 'API-ACC-02', resultado: 'RECHAZO', sujetoId: id });
  expect(auditoria?.motivo).toMatch(/^CUENTA_CERRADA$|^CREDENCIAL_SUPRIMIDA$/);
});

it('06 §5.8 en carrera: sesiones que llegan mientras el cierre espera el bloqueo quedan revocadas, con finalización ≥ inicio', async () => {
  const correo = correoSintetico('sesiones-en-carrera');
  const id = await registrarOk(app, correo);
  const ejecutora = await tokenDe(app, correo);

  let cierre: Promise<{ status: number }> | null = null;
  let logins: Promise<{ status: number }[]> | null = null;
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${id}::uuid FOR UPDATE`;
      cierre = disparar(conSesion(app, ejecutora).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()));
      logins = Promise.all([disparar(login(app, correo)), disparar(login(app, correo))]);
      await esperarBloqueados(3);
    },
    { timeout: 30_000 },
  );
  expect((await cierre!).status).toBe(201);
  await logins!;
  // Gane quien gane el bloqueo, ninguna sesión sobrevive activa al cierre, y ninguna termina antes de empezar.
  const sesiones = await prisma.sesion.findMany({ where: { identidadId: id } });
  expect(sesiones.filter((s) => s.estado === 'ACTIVA')).toHaveLength(0);
  for (const s of sesiones) expect(s.momentoDeFinalizacion!.getTime()).toBeGreaterThanOrEqual(s.momentoDeOcurrencia.getTime());
});
