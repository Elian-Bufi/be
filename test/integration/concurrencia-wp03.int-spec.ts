/**
 * WP-03 · Regresión de la revisión adversarial: concurrencia, revelabilidad y auditoría, contra PostgreSQL real.
 * Cada escenario reproduce un hallazgo confirmado y fija el comportamiento corregido:
 * - el corte con lecturas concurrentes (T-PDP-4): ninguna decisión PERMITIDA con hora posterior a la revocación;
 * - el cierre de cuenta concurrente con REL-01, REL-03 y REL-07/08 (T13, D8): sin deadlocks ni solicitudes huérfanas;
 * - la caducidad perezosa concurrente: sin 500;
 * - CON-02 (versión nueva) contra CON-04 (revocar): mismo orden de bloqueos, sin deadlock;
 * - REL-01 no es un oráculo de existencia; DSH-03 valida la query antes del PDP, limita por actor y no se guarda en caché;
 * - los 404 de lectura y las respuestas repetidas dejan rastro en la auditoría.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { appDePrueba, claveDeIdempotencia, conSesion, cuerpoDeCierre, transicionPorServicio } from './soporte-api';
import { migrarDeploy, RAIZ, urlConSchema } from './soporte';
import {
  aceptar,
  dashboard,
  finalizar,
  pausar,
  prepararAsesorado,
  prepararProfesional,
  reanudar,
  revocarB2,
  solicitar,
  versionDeVinculo,
  vinculoCompleto,
} from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

/**
 * App que ya escucha en un puerto propio. Con requests concurrentes, supertest sobre un servidor que no escucha lo abre
 * y lo cierra en cada request, y las que siguen en vuelo reciben ECONNRESET: eso mediría el harness, no la API.
 */
async function appEscuchando(...args: Parameters<typeof appDePrueba>): Promise<INestApplication> {
  const a = await appDePrueba(...args);
  await a.listen(0);
  return a;
}

beforeAll(async () => {
  app = await appEscuchando();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CIERRE = '/api/v1/me/account-closure-requests';

describe('T-PDP-4 — el corte con lecturas concurrentes', () => {
  it('ninguna decisión PERMITIDA tiene hora posterior a la revocación; toda lectura que empieza después de confirmarla da 404', async () => {
    const pn = await prepararProfesional(app, 'corte-conc', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'corte-conc', { a3: true });
    const rondas = 8;
    let permitidasDespues = 0;
    let respuestas200 = 0;
    let respuestas404 = 0;
    for (let i = 0; i < rondas; i++) {
      const { vinculoId, consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
      // 16 lecturas escalonadas de a 1 ms, y la revocación en el medio.
      const lecturas = Array.from({ length: 16 }, (_, k) => espera(k).then(() => dashboard(app, pn, a01.id)));
      await espera(5);
      const revocada = await revocarB2(app, a01, consentId as string).expect(200);
      await dashboard(app, pn, a01.id).expect(404);
      for (const r of await Promise.all(lecturas)) {
        expect([200, 404]).toContain(r.status);
        if (r.status === 200) respuestas200++;
        else respuestas404++;
      }
      const revocadaEn = new Date(revocada.body.data.revokedAt as string);
      const posteriores = await prisma.decisionDeAcceso.findMany({
        where: { actorId: pn.id, sujetoId: a01.id, alcance: 'NUTRICION', momentoDeOcurrencia: { gte: revocadaEn } },
        orderBy: { secuencia: 'asc' },
      });
      permitidasDespues += posteriores.filter((d) => d.resultado === 'PERMITIDA').length;
      // 08:404: «su primera denegación posterior verificable», enlazada a la versión de revocación.
      const revocacion = await prisma.versionDeConsentimiento.findFirstOrThrow({ where: { consentimientoId: consentId as string, decision: 'REVOCACION' } });
      expect(posteriores[0]).toMatchObject({ resultado: 'DENEGADA', consentimientoId: consentId, versionDeConsentimientoId: revocacion.id });
      expect(revocacion.momentoDeOcurrencia.getTime()).toBe(revocadaEn.getTime());
      await finalizar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId)).expect(200);
    }
    expect(permitidasDespues).toBe(0);
    process.stdout.write(
      `${JSON.stringify({ prueba: 'medicion-del-corte-concurrente', rondas, lecturasPorRonda: 16, respuestas200, respuestas404, permitidasConHoraPosterior: permitidasDespues })}\n`,
    );
  });
});

describe('T13 / D8 — el cierre de cuenta contra operaciones concurrentes de la contraparte', () => {
  it('REL-01 hacia una cuenta que se cierra: ninguna solicitud queda PENDIENTE hacia la cuenta CERRADA, y nada da 500', async () => {
    const a01 = await prepararAsesorado(app, 'cierre-rel01');
    const pros = await Promise.all(Array.from({ length: 6 }, (_, k) => prepararProfesional(app, `cierre-rel01-${k}`, ['NUTRICION'])));
    const pedidos = pros.map((p, k) => espera(k).then(() => solicitar(app, p, a01.id, 'NUTRICION')));
    const cierre = await conSesion(app, a01.token).post(CIERRE, claveDeIdempotencia()).send(cuerpoDeCierre());
    const estados = (await Promise.all(pedidos)).map((r) => r.status);
    expect(cierre.status).toBe(201);
    for (const s of estados) expect([201, 404]).toContain(s);
    expect(await prisma.solicitudDeVinculo.count({ where: { asesoradoId: a01.id, estado: 'PENDIENTE' } })).toBe(0);
  });

  it('el profesional cierra su cuenta mientras cuatro asesorados aceptan: sin deadlock, y ningún componente vivo con la cuenta CERRADA', async () => {
    const pn = await prepararProfesional(app, 'cierre-rel03', ['NUTRICION']);
    const asesorados = await Promise.all(Array.from({ length: 4 }, (_, k) => prepararAsesorado(app, `cierre-rel03-${k}`)));
    const solicitudes: string[] = [];
    for (const a of asesorados) solicitudes.push((await solicitar(app, pn, a.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string);
    const aceptaciones = asesorados.map((a, k) => espera(k).then(() => aceptar(app, a, solicitudes[k])));
    const cierre = await conSesion(app, pn.token).post(CIERRE, claveDeIdempotencia()).send(cuerpoDeCierre());
    const estados = (await Promise.all(aceptaciones)).map((r) => r.status);
    expect(cierre.status).toBe(201);
    for (const s of estados) expect([200, 404, 422]).toContain(s);
    const vivos = await prisma.alcanceDeVinculo.count({ where: { estado: { not: 'FINALIZADO' }, vinculo: { profesionalId: pn.id } } });
    expect(vivos).toBe(0);
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pn.id, estado: 'PENDIENTE' } })).toBe(0);
  });

  it('un profesional que pausa y reanuda en bucle no hace fallar el cierre del asesorado (RF-069)', async () => {
    const pn = await prepararProfesional(app, 'cierre-bucle', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'cierre-bucle', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    let seguir = true;
    const estados: number[] = [];
    const bucle = (async () => {
      while (seguir) {
        const v = await conSesion(app, pn.token).get(`/api/v1/relationships/${vinculoId}`);
        if (v.status !== 200 || v.body.data.relationshipState === 'FINALIZADO') break;
        const r =
          v.body.data.relationshipState === 'ACEPTADO'
            ? await pausar(app, pn.token, vinculoId, v.body.data.version as string)
            : await reanudar(app, pn.token, vinculoId, v.body.data.version as string);
        estados.push(r.status);
      }
    })();
    await espera(30);
    const cierre = await conSesion(app, a01.token).post(CIERRE, claveDeIdempotencia()).send(cuerpoDeCierre());
    seguir = false;
    await bucle;
    expect(cierre.status).toBe(201);
    for (const s of estados) expect([200, 409, 422]).toContain(s);
    expect((await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id: vinculoId } })).estado).toBe('FINALIZADO');
  });
});

describe('DL-037 — caducidad perezosa con listados simultáneos', () => {
  it('veinte listados a la vez sobre una solicitud vencida: todos 200 y un solo hecho de caducidad', async () => {
    const corta = await appEscuchando({ caducidadDeSolicitudMs: 200 });
    try {
      const pn = await prepararProfesional(corta, 'caduca-conc', ['NUTRICION']);
      const a01 = await prepararAsesorado(corta, 'caduca-conc');
      const id = (await solicitar(corta, pn, a01.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
      await espera(350);
      const listados = await Promise.all(
        Array.from({ length: 20 }, (_, k) => conSesion(corta, k % 2 === 0 ? a01.token : pn.token).get('/api/v1/me/relationship-requests')),
      );
      for (const r of listados) expect(r.status).toBe(200);
      expect((await prisma.solicitudDeVinculo.findUniqueOrThrow({ where: { id } })).estado).toBe('CADUCADA');
      expect(await prisma.eventoDeVinculo.count({ where: { solicitudDeVinculoId: id, tipo: 'SolicitudDeVinculoCaducada' } })).toBe(1);
    } finally {
      await corta.close();
    }
  });
});

describe('CON-02 contra CON-04 — el mismo orden de bloqueos, sin deadlock', () => {
  const SCHEMA = 'wp03_concurrencia_b2';
  let aislada: INestApplication;
  let bd: PrismaClient;

  beforeAll(async () => {
    const url = urlConSchema(process.env.DATABASE_URL as string, SCHEMA);
    const previa = process.env.DATABASE_URL;
    bd = new PrismaClient({ datasources: { db: { url } } });
    await bd.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    migrarDeploy(url, join(RAIZ, 'prisma', 'schema.prisma'));
    process.env.DATABASE_URL = url;
    try {
      aislada = await appEscuchando();
    } finally {
      process.env.DATABASE_URL = previa;
    }
  });
  afterAll(async () => {
    await aislada.close();
    await bd.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await bd.$disconnect();
  });

  it('aceptar la versión nueva y revocar a la vez, en diez vínculos: nada da 500 y cada cadena queda coherente', async () => {
    const pn = await prepararProfesional(aislada, 'c2-conc', ['NUTRICION']);
    const pares: { a: Awaited<ReturnType<typeof prepararAsesorado>>; vinculoId: string; consentId: string }[] = [];
    for (let k = 0; k < 10; k++) {
      const a = await prepararAsesorado(aislada, `c2-conc-${k}`, { a3: true });
      const { vinculoId, consentId } = await vinculoCompleto(aislada, pn, a, 'NUTRICION');
      pares.push({ a, vinculoId, consentId: consentId as string });
    }
    const c2 = 'Versión sucesora sintética de B2 para la prueba de concurrencia. No es un texto legal ni se aplica a datos reales.';
    await bd.versionDeTexto.create({
      data: {
        id: 'acceso-profesional-sanitario-c2-concurrencia',
        tipo: 'CONSENTIMIENTO_PROFESIONAL_SANITARIO',
        titulo: 'C2 de prueba',
        finalidad: 'AUTORIZACION_DE_ACCESO_PROFESIONAL',
        texto: c2,
        hash: createHash('sha256').update(c2, 'utf8').digest('hex'),
        vigenteDesde: new Date(),
        reemplazaAId: 'acceso-profesional-sanitario-2026-09-demo',
      },
    });
    const resultados = await Promise.all(
      pares.map(({ a, vinculoId, consentId }) =>
        Promise.all([
          conSesion(aislada, a.token).post(`/api/v1/relationships/${vinculoId}/consents`, claveDeIdempotencia()).send({ consentVersionId: 'acceso-profesional-sanitario-c2-concurrencia' }),
          espera(1).then(() => revocarB2(aislada, a, consentId)),
        ]),
      ),
    );
    for (const [aceptacion, revocacion] of resultados) {
      expect([200, 409, 422]).toContain(aceptacion.status);
      expect(revocacion.status).toBe(200);
    }
    for (const { consentId } of pares) {
      const c = await bd.consentimiento.findUniqueOrThrow({ where: { id: consentId }, include: { versiones: true } });
      expect(c.versiones).toHaveLength(c.version);
    }
  });
});

describe('Revelabilidad (09:213-233) — REL-01 no es un oráculo de existencia', () => {
  it('una cuenta sin perfil profesional recibe la misma respuesta para un destino inexistente, suspendido u operativo', async () => {
    const curioso = await prepararAsesorado(app, 'oraculo');
    const operativo = await prepararAsesorado(app, 'oraculo-op');
    const suspendido = await prepararAsesorado(app, 'oraculo-sus');
    await transicionPorServicio(app, suspendido.id, 'SuspenderCuenta');
    const respuestas = [];
    for (const destino of ['00000000-0000-4000-8000-000000000000', suspendido.id, operativo.id]) {
      const r = await conSesion(app, curioso.token)
        .post('/api/v1/relationship-requests', claveDeIdempotencia())
        .send({ target: { type: 'ADVISEE', identityId: destino }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' });
      respuestas.push([r.status, r.body]);
    }
    expect(respuestas[0]).toEqual([422, { error: expect.objectContaining({ code: 'SCOPE_NOT_AVAILABLE' }) }]);
    expect(respuestas[1]).toEqual(respuestas[0]);
    expect(respuestas[2]).toEqual(respuestas[0]);
  });
});

describe('DSH-03 — query antes del PDP, límite por actor y sin caché', () => {
  it('una query inválida da 400 sin registrar decisiones; la respuesta sale con Cache-Control: no-store', async () => {
    const pn = await prepararProfesional(app, 'dsh-query', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'dsh-query', { a3: true });
    await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const antes = await prisma.decisionDeAcceso.count({ where: { actorId: pn.id } });
    await conSesion(app, pn.token).get(`/api/v1/advisees/${a01.id}/dashboard?x=1`).expect(400);
    await conSesion(app, pn.token).get(`/api/v1/advisees/${a01.id}/dashboard?periodStart=ayer`).expect(400);
    expect(await prisma.decisionDeAcceso.count({ where: { actorId: pn.id } })).toBe(antes);
    const ok = await dashboard(app, pn, a01.id).expect(200);
    expect(ok.headers['cache-control']).toBe('no-store');
  });

  it('más consultas protegidas que el límite del actor: 429, y la que excede no deja decisiones', async () => {
    const limitada = await appEscuchando({
      limites: {
        login: { maximo: 10_000, ventanaMs: 60_000 },
        loginPorIp: { maximo: 10_000, ventanaMs: 60_000 },
        loginPorIdentificador: { maximo: 10_000, ventanaMs: 60_000 },
        registro: { maximo: 10_000, ventanaMs: 60_000 },
        consultaProtegida: { maximo: 3, ventanaMs: 60_000 },
      },
    });
    try {
      const pn = await prepararProfesional(limitada, 'dsh-limite', ['NUTRICION']);
      const a01 = await prepararAsesorado(limitada, 'dsh-limite', { a3: true });
      await vinculoCompleto(limitada, pn, a01, 'NUTRICION');
      for (let i = 0; i < 3; i++) await dashboard(limitada, pn, a01.id).expect(200);
      const antes = await prisma.decisionDeAcceso.count({ where: { actorId: pn.id } });
      const r = await dashboard(limitada, pn, a01.id).expect(429);
      expect(r.body.error.code).toBe('RATE_LIMITED');
      expect(await prisma.decisionDeAcceso.count({ where: { actorId: pn.id } })).toBe(antes);
    } finally {
      await limitada.close();
    }
  });

  it('un cursor con forma de identificador pero que no es un UUID da 400 INVALID_CURSOR, no 500', async () => {
    const a01 = await prepararAsesorado(app, 'cursor');
    const cursor = Buffer.from(JSON.stringify([new Date().toISOString(), '-'.repeat(36)]), 'utf8').toString('base64url');
    const r = await conSesion(app, a01.token).get(`/api/v1/me/relationships?cursor=${cursor}`).expect(400);
    expect(r.body.error.code).toBe('INVALID_CURSOR');
  });
});

describe('Auditoría (08 §29) — respuestas repetidas y 404 de lectura dejan rastro', () => {
  it('la solicitud deduplicada, la revocación repetida y el 404 de REL-06 quedan en la auditoría con su recurso', async () => {
    const pn = await prepararProfesional(app, 'audit', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'audit', { a3: true });
    const primera = (await solicitar(app, pn, a01.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    const repetida = await solicitar(app, pn, a01.id, 'NUTRICION').expect(200);
    expect(repetida.body.data).toEqual({ relationshipRequestId: primera, deduplicated: true });
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-REL-01', resultado: 'EXITO', actorId: pn.id, recursoId: primera } })).toBe(2);

    const vinculoId = (await aceptar(app, a01, primera).expect(200)).body.data.relationshipId as string;
    const requisitos = await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}/consent-requirements`).expect(200);
    const consentId = (
      await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: requisitos.body.data.consentVersion.id }).expect(201)
    ).body.data.consentId as string;
    await revocarB2(app, a01, consentId).expect(200);
    await revocarB2(app, a01, consentId).expect(200);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-CON-04', resultado: 'EXITO', recursoId: consentId } })).toBe(2);

    const ajeno = '11111111-1111-4111-8111-111111111111';
    await conSesion(app, pn.token).get(`/api/v1/relationships/${ajeno}`).expect(404);
    const rastro = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-REL-06', actorId: pn.id, resultado: 'RECHAZO' } });
    expect(rastro).toMatchObject({ motivo: 'RESOURCE_NOT_FOUND', recursoTipo: 'AlcanceDeVinculo', recursoId: ajeno });
  });
});
