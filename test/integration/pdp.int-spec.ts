/**
 * WP-03 · PDP contra PostgreSQL real, por HTTP (07:1702). El recurso protegido es API-DSH-03 mínimo (DL-031).
 * TEST-AUTH-003 (variante profesional) · 004 · 005 · 006 · 007 · 008 · 009 · TEST-RF-015 · TEST-RF-021 · TEST-UC-I02 ·
 * TEST-RNF-SEC-001 · TEST-RNF-SEC-005 · TEST-RNF-SEC-006 · TEST-RNF-PRI-002 · DV-05 adversariales 1, 2, 3, 4, 5 y 9.
 *
 * Los oráculos de TEST-AUTH los deriva DV-05 del texto normativo (el 11A no los fija: DL-027) y se declaran en
 * DEFENSA/WP-03.md.
 */
import type { INestApplication } from '@nestjs/common';
import { DashboardResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { transicionPorServicio } from './soporte-api';
import { appDePrueba, claveDeIdempotencia, conSesion, mediana } from './soporte-api';
import {
  a3Vigente,
  dashboard,
  finalizar,
  pausar,
  prepararAsesorado,
  prepararProfesional,
  revocarB2,
  solicitar,
  versionDeVinculo,
  vinculoCompleto,
} from './soporte-vinculo';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const NO_ENCONTRADO = { error: { code: 'RESOURCE_NOT_FOUND', message: 'Recurso no encontrado.' } };

async function ultimasDecisiones(actorId: string, cantidad = 3) {
  return prisma.decisionDeAcceso.findMany({ where: { actorId }, orderBy: { secuencia: 'desc' }, take: cantidad });
}

describe('Contexto positivo — las siete dimensiones favorables permiten solo ese alcance', () => {
  it('TEST-RF-021 / TEST-UC-I02: con vínculo ACEPTADO, B2 vigente y A3 vigente, el profesional ve Nutrición y nada más', async () => {
    const pn = await prepararProfesional(app, 'positivo', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'positivo', { a3: true });
    const { vinculoId, consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');

    const r = await dashboard(app, pn, a01.id).expect(200);
    const datos = DashboardResponseSchema.parse(r.body).data;
    expect(datos.domains.nutrition).toEqual({ available: true, relationshipId: vinculoId, summary: null });
    expect(datos.domains.training).toEqual({ available: false, reason: 'NOT_AVAILABLE_TO_VIEW' });
    expect(datos.domains.anthropometry).toEqual({ available: false, reason: 'NOT_AVAILABLE_TO_VIEW' });
    expect(datos.partialView).toBe(true);

    // REG-06-50 / 08:307: la decisión registra el componente y la versión de consentimiento que la resolvieron.
    const [permitida] = (await ultimasDecisiones(pn.id)).filter((d) => d.alcance === 'NUTRICION');
    expect(permitida).toMatchObject({ resultado: 'PERMITIDA', operacion: 'API-DSH-03', sujetoId: a01.id, alcanceDeVinculoId: vinculoId, consentimientoId: consentId, versionDeMatriz: null });
    expect(permitida.dimensionesDesfavorables).toEqual([]);
    expect(permitida.versionDeConsentimientoId).not.toBeNull();
  });
});

describe('TEST-AUTH-006 — vínculo sin B2 no produce acceso', () => {
  it('TEST-AUTH-006 / TEST-RF-019: después de aceptar, sin consentimiento, el profesional recibe 404 y la auditoría atribuye CONSENTIMIENTO', async () => {
    const pn = await prepararProfesional(app, 'auth006', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'auth006', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    const vinculo = await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}`).expect(200);
    expect(vinculo.body.data).toMatchObject({ relationshipState: 'ACEPTADO', consentState: 'REQUIRED', accessMode: 'BLOCKED' });

    const r = await dashboard(app, pn, a01.id).expect(404);
    expect(r.body).toEqual(NO_ENCONTRADO);
    const decisiones = await ultimasDecisiones(pn.id);
    expect(decisiones.every((d) => d.resultado === 'DENEGADA')).toBe(true);
    expect(decisiones.find((d) => d.alcance === 'NUTRICION')?.dimensionesDesfavorables).toEqual(['CONSENTIMIENTO', 'FINALIDAD']);
  });
});

describe('TEST-AUTH-003 (variante profesional) y TEST-AUTH-005 — B2 sin A3 no produce acceso', () => {
  it('TEST-AUTH-003: B2 vigente con A3 nunca otorgado → sin acceso; se atribuye SITUACION', async () => {
    const pn = await prepararProfesional(app, 'auth003', ['NUTRICION']);
    const a02 = await prepararAsesorado(app, 'auth003', { a3: false });
    await vinculoCompleto(app, pn, a02, 'NUTRICION');
    expect((await dashboard(app, pn, a02.id).expect(404)).body).toEqual(NO_ENCONTRADO);
    expect((await ultimasDecisiones(pn.id)).find((d) => d.alcance === 'NUTRICION')?.dimensionesDesfavorables).toEqual(['SITUACION']);
  });

  it('TEST-AUTH-005 / TEST-AUTH-004: el asesorado revoca A3 y el profesional con B2 vigente pierde el acceso en la request siguiente; B2 no se toca', async () => {
    const pn = await prepararProfesional(app, 'auth005', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'auth005', { a3: true });
    const { consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await dashboard(app, pn, a01.id).expect(200);

    const a3 = await a3Vigente(app, a01.token);
    await conSesion(app, a01.token).post(`/api/v1/me/health-data-consents/${a3}/revoke`).send({}).expect(200);

    expect((await dashboard(app, pn, a01.id).expect(404)).body).toEqual(NO_ENCONTRADO);
    // «no se revocan B2 por mutación del registro — quedan sin capacidad efectiva mientras A3 no satisfaga el PDP» (09:2603).
    expect((await prisma.consentimiento.findUniqueOrThrow({ where: { id: consentId as string } })).situacion).toBe('VIGENTE');
    // Reotorgar A3 es un acto nuevo (09:2607): el acceso vuelve sin tocar B2.
    await conSesion(app, a01.token).post('/api/v1/me/health-data-consents', claveDeIdempotencia()).send({ consentVersionId: 'datos-salud-2026-09-demo' }).expect(201);
    await dashboard(app, pn, a01.id).expect(200);
  });
});

describe('TEST-AUTH-007 — PAUSADO corta ese alcance y no los demás', () => {
  it('TEST-AUTH-007 / TEST-RNF-SEC-006: el asesorado pausa Entrenamiento de PT; PN sigue viendo Nutrición; el vínculo y su historia se conservan', async () => {
    const pn = await prepararProfesional(app, 'auth007n', ['NUTRICION']);
    const pt = await prepararProfesional(app, 'auth007t', ['ENTRENAMIENTO']);
    const a01 = await prepararAsesorado(app, 'auth007', { a3: true });
    const n1 = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const t1 = await vinculoCompleto(app, pt, a01, 'ENTRENAMIENTO');
    await dashboard(app, pt, a01.id).expect(200);

    await pausar(app, a01.token, t1.vinculoId, await versionDeVinculo(app, a01.token, t1.vinculoId)).expect(200);

    expect((await dashboard(app, pt, a01.id).expect(404)).body).toEqual(NO_ENCONTRADO);
    const nutricion = await dashboard(app, pn, a01.id).expect(200);
    expect(nutricion.body.data.domains.nutrition).toEqual({ available: true, relationshipId: n1.vinculoId, summary: null });
    const pausado = await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id: t1.vinculoId } });
    expect(pausado).toMatchObject({ estado: 'PAUSADO', pausadoPor: 'ASESORADO', motivoDeUltimaTransicion: 'DISPONIBILIDAD' });
    // REG-06-52: pausar no revoca B2.
    expect((await prisma.consentimiento.findUniqueOrThrow({ where: { id: t1.consentId as string } })).situacion).toBe('VIGENTE');
    expect((await ultimasDecisiones(pt.id)).find((d) => d.alcance === 'ENTRENAMIENTO')?.dimensionesDesfavorables).toEqual(['VINCULO']);
  });
});

describe('TEST-AUTH-008 — FINALIZADO no deja lectura residual', () => {
  it('TEST-AUTH-008: tras finalizar, 404; el consentimiento y la historia quedan como evidencia (asimetría 7.5-05)', async () => {
    const pn = await prepararProfesional(app, 'auth008', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'auth008', { a3: true });
    const { vinculoId, consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await dashboard(app, pn, a01.id).expect(200);
    await dashboard(app, pn, a01.id).expect(200);

    await finalizar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId), 'CAMBIO_DE_PROFESIONAL').expect(200);

    expect((await dashboard(app, pn, a01.id).expect(404)).body).toEqual(NO_ENCONTRADO);
    // INV-06-64: finalizar no borra consentimientos ni sus versiones; REG-06-52: no los revoca.
    const consentimiento = await prisma.consentimiento.findUniqueOrThrow({ where: { id: consentId as string }, include: { versiones: true } });
    expect(consentimiento.situacion).toBe('VIGENTE');
    expect(consentimiento.versiones).toHaveLength(1);
    const permitidasAntes = await prisma.decisionDeAcceso.count({ where: { actorId: pn.id, resultado: 'PERMITIDA' } });
    expect(permitidasAntes).toBe(2);
    const eventos = await prisma.eventoDeVinculo.findMany({ where: { alcanceDeVinculoId: vinculoId }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(eventos.map((e) => e.tipo)).toEqual(expect.arrayContaining(['AlcanceDeVinculoAceptado', 'ConsentimientoOtorgado', 'AlcanceDeVinculoFinalizado']));
  });
});

describe('TEST-RF-015 / TEST-RNF-SEC-001 — verificado no es autorizado; suspendido y sin habilitación cortan', () => {
  it('TEST-RF-015: una especialidad verificada y habilitada, sin vínculo, no accede; se atribuye VINCULO', async () => {
    const p2 = await prepararProfesional(app, 'rf015', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'rf015', { a3: true });
    expect((await dashboard(app, p2, a01.id).expect(404)).body).toEqual(NO_ENCONTRADO);
    expect((await ultimasDecisiones(p2.id)).find((d) => d.alcance === 'NUTRICION')?.dimensionesDesfavorables).toContain('VINCULO');
  });

  it('TEST-RNF-SEC-001 «suspendidas»: SuspenderAlcance corta el acceso en la operación siguiente; RehabilitarAlcance no restaura otros gates', async () => {
    const pn = await prepararProfesional(app, 'suspendido', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'suspendido', { a3: true });
    await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await dashboard(app, pn, a01.id).expect(200);
    const servicio = app.get(VerificacionService);
    const cliente = app.get(PrismaService);
    await cliente.$transaction((tx) => servicio.transicionarVerificacion(tx, pn.id, 'NUTRICION', 'SuspenderAlcance', 'suspensión sintética', new Date()));
    await dashboard(app, pn, a01.id).expect(404);
    expect((await ultimasDecisiones(pn.id)).find((d) => d.alcance === 'NUTRICION')?.dimensionesDesfavorables).toEqual(['SITUACION']);
    await cliente.$transaction((tx) => servicio.transicionarVerificacion(tx, pn.id, 'NUTRICION', 'RehabilitarAlcance', 'rehabilitación sintética', new Date()));
    await dashboard(app, pn, a01.id).expect(200);
    await cliente.$transaction((tx) => servicio.transicionarHabilitacion(tx, pn.id, 'NUTRICION', 'RetirarHabilitacion', 'retiro sintético', new Date()));
    await dashboard(app, pn, a01.id).expect(404);
  });

  it('TEST-RF-021 V3: una cuenta de asesorado SUSPENDIDA corta el acceso del profesional (situación del titular)', async () => {
    const pn = await prepararProfesional(app, 'cuentasusp', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'cuentasusp', { a3: true });
    await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await dashboard(app, pn, a01.id).expect(200);
    await transicionPorServicio(app, a01.id, 'SuspenderCuenta');
    await dashboard(app, pn, a01.id).expect(404);
    await transicionPorServicio(app, a01.id, 'RestablecerCuenta');
    await dashboard(app, pn, a01.id).expect(200);
  });
});

describe('TEST-AUTH-009 — lo que el cliente declara no reemplaza al PDP (adversarial 4)', () => {
  it('TEST-AUTH-009: `professionalId` y `actorCapabilities` en el cuerpo → 400 UNKNOWN_FIELD; una capacidad en /me no abre el dashboard', async () => {
    const pn = await prepararProfesional(app, 'auth009', ['NUTRICION']);
    const otro = await prepararProfesional(app, 'auth009b', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'auth009', { a3: true });
    for (const extra of [{ professionalId: otro.id }, { actorCapabilities: ['PRO'] }]) {
      const r = await conSesion(app, pn.token)
        .post('/api/v1/relationship-requests')
        .send({ target: { type: 'ADVISEE', identityId: a01.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL', ...extra })
        .expect(400);
      expect(r.body.error.code).toBe('UNKNOWN_FIELD');
    }
    // /me informa PROFESSIONAL_WORKSPACE para navegar; eso no es permiso (09v8:493-497).
    const me = await conSesion(app, pn.token).get('/api/v1/me').expect(200);
    expect(me.body.data.actorCapabilities).toEqual(['PROFESSIONAL_WORKSPACE']);
    await dashboard(app, pn, a01.id).expect(404);
    // La query tampoco eleva nada: un parámetro desconocido es 400 antes del PDP (09:221, schema y payload primero). El
    // 400 no depende del titular, así que no revela nada, y no deja decisiones registradas.
    const r = await conSesion(app, pn.token).get(`/api/v1/advisees/${a01.id}/dashboard?professionalId=${otro.id}`).expect(400);
    expect(r.body.error.code).toBe('INVALID_REQUEST');
  });
});

describe('DV-05 adversarial 1 / UC-I02 E05 — ajeno ≡ inexistente', () => {
  it('adversarial 1: un asesorado ajeno y un identificador inventado responden 404 idéntico, sin diferencia de tiempo útil', async () => {
    const pn = await prepararProfesional(app, 'enum', ['NUTRICION']);
    const ajeno = await prepararAsesorado(app, 'enum-ajeno', { a3: true });
    const inexistente = randomUUID();
    const tiempos: Record<'ajeno' | 'inexistente', number[]> = { ajeno: [], inexistente: [] };
    for (let i = 0; i < 20; i++) {
      for (const [clave, id] of [['ajeno', ajeno.id], ['inexistente', inexistente]] as const) {
        const inicio = performance.now();
        const r = await dashboard(app, pn, id).expect(404);
        tiempos[clave].push(performance.now() - inicio);
        expect(r.body).toEqual(NO_ENCONTRADO);
        expect(Object.keys(r.headers).filter((h) => /^x-be-|^x-pdp/i.test(h))).toEqual([]);
      }
    }
    // Mismo trabajo en ambas ramas (una lectura y tres decisiones registradas): tolerancia de WP-02 (max 50 ms, 35 %).
    const diferencia = Math.abs(mediana(tiempos.ajeno) - mediana(tiempos.inexistente));
    expect(diferencia).toBeLessThan(Math.max(50, 0.35 * mediana(tiempos.ajeno)));
    // Un identificador mal formado tampoco se distingue.
    expect((await dashboard(app, pn, 'no-es-un-uuid').expect(404)).body).toEqual(NO_ENCONTRADO);
    process.stdout.write(`${JSON.stringify({ prueba: 'adversarial-1', medianaAjenoMs: mediana(tiempos.ajeno), medianaInexistenteMs: mediana(tiempos.inexistente) })}\n`);
  });

  it('adversarial 1 sobre REL-06: el vínculo de otra persona y un id inventado responden 404 idéntico', async () => {
    const pn = await prepararProfesional(app, 'enum-rel', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'enum-rel', { a3: true });
    const intruso = await prepararAsesorado(app, 'enum-rel-intruso');
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const ajeno = await conSesion(app, intruso.token).get(`/api/v1/relationships/${vinculoId}`).expect(404);
    const inventado = await conSesion(app, intruso.token).get(`/api/v1/relationships/${randomUUID()}`).expect(404);
    expect(ajeno.body).toEqual(inventado.body);
  });
});

describe('DV-05 adversarial 3 y 5 — sin A3 no hay acceso; ocultar un botón no autoriza', () => {
  it('adversarial 3 (variante profesional): registrarse y dar B2 sin A3 no presume consentimiento de salud', async () => {
    const pn = await prepararProfesional(app, 'adv3', ['NUTRICION']);
    const a02 = await prepararAsesorado(app, 'adv3', { a3: false });
    await vinculoCompleto(app, pn, a02, 'NUTRICION');
    await dashboard(app, pn, a02.id).expect(404);
  });

  it('adversarial 5 / TEST-RNF-SEC-001: llamar la API directo, sin pasar por ninguna pantalla, da el mismo 404', async () => {
    const pn = await prepararProfesional(app, 'adv5', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'adv5', { a3: true });
    await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    const r = await request(app.getHttpServer()).get(`/api/v1/advisees/${a01.id}/dashboard`).set('Authorization', `Bearer ${pn.token}`).set('X-BE-Surface', 'APK').expect(404);
    expect(r.body).toEqual(NO_ENCONTRADO);
  });
});

describe('TEST-RNF-PRI-002 / adversarial 2 — el corte es inmediato y verificable', () => {
  it('medición del corte: revocar B2 y reintentar en la misma sesión; cero operaciones permitidas después de revocar (08 §13: ≤ 1)', async () => {
    const pn = await prepararProfesional(app, 'corte', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'corte', { a3: true });
    const repeticiones = 30;
    const milisegundos: number[] = [];
    let permitidasDespues = 0;
    for (let i = 0; i < repeticiones; i++) {
      const { vinculoId, consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
      await dashboard(app, pn, a01.id).expect(200);
      const revocada = await revocarB2(app, a01, consentId as string).expect(200);
      const confirmada = performance.now();
      const r = await dashboard(app, pn, a01.id);
      milisegundos.push(performance.now() - confirmada);
      expect(r.status).toBe(404);
      // «Toda revocación queda auditada con su primera denegación posterior verificable» (08:404).
      const momentoDeRevocacion = new Date(revocada.body.data.revokedAt as string);
      const posteriores = await prisma.decisionDeAcceso.findMany({
        where: { actorId: pn.id, sujetoId: a01.id, alcance: 'NUTRICION', momentoDeOcurrencia: { gte: momentoDeRevocacion } },
        orderBy: { secuencia: 'asc' },
      });
      permitidasDespues += posteriores.filter((d) => d.resultado === 'PERMITIDA').length;
      expect(posteriores[0]?.resultado).toBe('DENEGADA');
      expect(posteriores[0]?.dimensionesDesfavorables).toContain('CONSENTIMIENTO');
      // Para repetir: el vínculo termina y el siguiente ciclo abre uno nuevo.
      await finalizar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId)).expect(200);
    }
    expect(permitidasDespues).toBe(0);
    const orden = [...milisegundos].sort((a, b) => a - b);
    const p95 = orden[Math.ceil(0.95 * orden.length) - 1];
    process.stdout.write(
      `${JSON.stringify({ prueba: 'medicion-del-corte', repeticiones, operacionesPermitidasDespues: permitidasDespues, medianaMs: mediana(milisegundos), p95Ms: p95, maximoMs: orden[orden.length - 1] })}\n`,
    );
  });
});

describe('DV-05 adversarial 9 — acceder a un vínculo PAUSADO', () => {
  it('adversarial 9: pausado → 404 para el profesional; el asesorado sigue viendo su vínculo con acceso bloqueado', async () => {
    const pn = await prepararProfesional(app, 'adv9', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'adv9', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await pausar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId), 'DECISION_PERSONAL').expect(200);
    await dashboard(app, pn, a01.id).expect(404);
    const propio = await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}`).expect(200);
    expect(propio.body.data).toMatchObject({ relationshipState: 'PAUSADO', accessMode: 'BLOCKED', pausedBy: 'PROFESSIONAL', consentState: 'ACTIVE' });
  });
});

describe('Solicitar no da acceso (INV-06-50)', () => {
  it('TEST-RF-018: con la solicitud PENDIENTE el profesional no accede', async () => {
    const pn = await prepararProfesional(app, 'pendiente', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'pendiente', { a3: true });
    await solicitar(app, pn, a01.id, 'NUTRICION').expect(201);
    await dashboard(app, pn, a01.id).expect(404);
    expect((await ultimasDecisiones(pn.id)).find((d) => d.alcance === 'NUTRICION')?.dimensionesDesfavorables).toContain('VINCULO');
  });
});
