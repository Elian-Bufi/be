/**
 * WP-03 · Solicitud y vínculo por alcance (06 §7.3, §7.5) contra PostgreSQL real.
 * TEST-RF-018 · TEST-RF-019 · TEST-RF-023 · TEST-RF-024 · TEST-RF-025 · TEST-UC-P04 · TEST-UC-P05 · TEST-UC-P06 ·
 * REG-06-44 (concurrencia) · TEST-RNF-REC-002 (idempotencia REL) · E2E-03 (pause/resume/finalize).
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDeSolicitudesResponseSchema, ListaDeVinculosResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import {
  aceptar,
  dashboard,
  finalizar,
  pausar,
  prepararAsesorado,
  prepararProfesional,
  reanudar,
  solicitar,
  versionDeVinculo,
  vinculoCompleto,
} from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('TEST-RF-018 / UC-P04 — solicitar por alcance y finalidad, sin acceso ni duplicados', () => {
  it('TEST-RF-018: la solicitud queda PENDIENTE; el destinatario ve quién y para qué; el evento y la auditoría quedan', async () => {
    const pn = await prepararProfesional(app, 'rf018', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'rf018', { a3: true });
    const r = await solicitar(app, pn, a01.id, 'NUTRICION').expect(201);
    expect(r.body.data).toMatchObject({
      state: 'PENDIENTE',
      version: 'v1',
      initiatedBy: 'PROFESSIONAL',
      scope: { code: 'NUTRICION', label: 'Nutrición' },
      purpose: 'ACOMPANAMIENTO_NUTRICIONAL',
      professional: { identityId: pn.id, displayName: 'Profesional sintético rf018' },
      advisee: { identityId: a01.id },
    });
    // El asesorado ve al profesional por nombre visible; el profesional ve al asesorado con una referencia neutral (DL-040).
    expect(r.body.data.advisee.displayName).toMatch(/^Asesorado · [0-9a-f]{6}$/);
    const lista = ListaDeSolicitudesResponseSchema.parse((await conSesion(app, a01.token).get('/api/v1/me/relationship-requests').expect(200)).body);
    expect(lista.data.map((s) => s.relationshipRequestId)).toContain(r.body.data.relationshipRequestId);
    const eventos = await prisma.eventoDeVinculo.findMany({ where: { solicitudDeVinculoId: r.body.data.relationshipRequestId } });
    expect(eventos.map((e) => [e.tipo, e.estadoPrevio, e.estadoPosterior, e.actorId])).toEqual([['SolicitudDeVinculoCreada', null, 'PENDIENTE', pn.id]]);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-REL-01', resultado: 'EXITO', recursoId: r.body.data.relationshipRequestId } })).toBe(1);
  });

  it('REG-06-44: 8 pedidos equivalentes simultáneos, con claves distintas, dejan una sola PENDIENTE; el resto recibe la misma', async () => {
    const pn = await prepararProfesional(app, 'concurrencia', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'concurrencia');
    const respuestas = await Promise.all(Array.from({ length: 8 }, () => solicitar(app, pn, a01.id, 'NUTRICION')));
    const ids = new Set(respuestas.map((r) => r.body.data.relationshipRequestId as string));
    expect(ids.size).toBe(1);
    expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
    expect(respuestas.filter((r) => r.status === 200 && r.body.data.deduplicated === true)).toHaveLength(7);
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pn.id, asesoradoId: a01.id, estado: 'PENDIENTE' } })).toBe(1);
    process.stdout.write(`${JSON.stringify({ prueba: 'REG-06-44-concurrencia', pedidos: 8, creadas: 1, deduplicadas: 7 })}\n`);
  });

  it('REG-06-44 en la base: insertar una segunda equivalente PENDIENTE directo viola el índice parcial', async () => {
    const pn = await prepararProfesional(app, 'indice', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'indice');
    await solicitar(app, pn, a01.id, 'NUTRICION').expect(201);
    await expect(
      prisma.solicitudDeVinculo.create({
        data: {
          profesionalId: pn.id,
          asesoradoId: a01.id,
          alcance: 'NUTRICION',
          finalidad: 'ACOMPANAMIENTO_NUTRICIONAL',
          iniciador: 'PROFESIONAL',
          procedencia: {},
          venceEn: new Date(Date.now() + 86_400_000),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('TEST-RNF-REC-002: replay con la misma Idempotency-Key devuelve lo mismo sin duplicar; otra solicitud con esa key → 409', async () => {
    const pn = await prepararProfesional(app, 'rec002', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'rec002');
    const a02 = await prepararAsesorado(app, 'rec002-b');
    const clave = claveDeIdempotencia();
    const primera = await solicitar(app, pn, a01.id, 'NUTRICION', clave).expect(201);
    const replay = await solicitar(app, pn, a01.id, 'NUTRICION', clave).expect(201);
    expect(replay.body).toEqual(primera.body);
    const reuso = await solicitar(app, pn, a02.id, 'NUTRICION', clave).expect(409);
    expect(reuso.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pn.id } })).toBe(1);
  });

  it('UC-P04 V02: el asesorado puede iniciar hacia un profesional elegible; igual la acepta él mismo, sin auto-aceptación', async () => {
    const pn = await prepararProfesional(app, 'v02', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'v02');
    const r = await conSesion(app, a01.token)
      .post('/api/v1/relationship-requests')
      .send({ target: { type: 'PROFESSIONAL', identityId: pn.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' })
      .expect(201);
    expect(r.body.data).toMatchObject({ state: 'PENDIENTE', initiatedBy: 'ADVISEE' });
    await aceptar(app, pn, r.body.data.relationshipRequestId).expect(404);
    await aceptar(app, a01, r.body.data.relationshipRequestId).expect(200);
  });

  it('La contraparte profesional no elegible no se revela: 404 igual que inexistente', async () => {
    const noVerificado = await prepararAsesorado(app, 'no-verificado');
    const a01 = await prepararAsesorado(app, 'contraparte');
    const r = await conSesion(app, a01.token)
      .post('/api/v1/relationship-requests')
      .send({ target: { type: 'PROFESSIONAL', identityId: noVerificado.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' })
      .expect(404);
    expect(r.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});

describe('TEST-RF-019 / UC-P05 — aceptar o rechazar; solo el asesorado', () => {
  it('TEST-RF-019: aceptar crea el vínculo por alcance, no concede B2 y deja ambos hechos en la misma transacción', async () => {
    const pn = await prepararProfesional(app, 'rf019', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'rf019', { a3: true });
    const creada = await solicitar(app, pn, a01.id, 'NUTRICION').expect(201);
    const r = await aceptar(app, a01, creada.body.data.relationshipRequestId).expect(200);
    expect(r.body.data).toMatchObject({ relationshipState: 'ACEPTADO', consentRequired: true, accessMode: 'BLOCKED_PENDING_AUTHORIZATION' });
    expect(await prisma.consentimiento.count({ where: { alcanceDeVinculoId: r.body.data.relationshipId } })).toBe(0);
    const eventos = await prisma.eventoDeVinculo.findMany({ where: { solicitudDeVinculoId: creada.body.data.relationshipRequestId }, orderBy: { secuencia: 'asc' } });
    expect(eventos.map((e) => e.tipo)).toEqual(['SolicitudDeVinculoCreada', 'SolicitudDeVinculoAceptada', 'AlcanceDeVinculoAceptado']);
  });

  it('TEST-RF-019: el rechazo queda trazable, no crea vínculo y no borra la solicitud (INV-06-54)', async () => {
    const pn = await prepararProfesional(app, 'rechazo', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'rechazo');
    const creada = await solicitar(app, pn, a01.id, 'NUTRICION').expect(201);
    const id = creada.body.data.relationshipRequestId as string;
    await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${id}/reject`).send({ expectedVersion: 'v1' }).expect(200);
    const s = await prisma.solicitudDeVinculo.findUniqueOrThrow({ where: { id } });
    expect(s).toMatchObject({ estado: 'RECHAZADA', version: 2 });
    expect(s.momentoDeResolucion).not.toBeNull();
    expect(await prisma.vinculo.count({ where: { profesionalId: pn.id, asesoradoId: a01.id } })).toBe(0);
    // Reiterar crea una solicitud nueva relacionada (REG-06-45).
    const nueva = await solicitar(app, pn, a01.id, 'NUTRICION').expect(201);
    expect((await prisma.solicitudDeVinculo.findUniqueOrThrow({ where: { id: nueva.body.data.relationshipRequestId } })).antecedenteId).toBe(id);
  });

  it('REG-06-49: si el profesional deja de estar verificado antes de la aceptación, el sistema invalida la solicitud', async () => {
    const pn = await prepararProfesional(app, 'invalidar', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'invalidar');
    const creada = await solicitar(app, pn, a01.id, 'NUTRICION').expect(201);
    const cliente = app.get(PrismaService);
    await cliente.$transaction((tx) => app.get(VerificacionService).transicionarVerificacion(tx, pn.id, 'NUTRICION', 'SuspenderAlcance', 'suspensión sintética', new Date()));
    await aceptar(app, a01, creada.body.data.relationshipRequestId).expect(422);
    const s = await prisma.solicitudDeVinculo.findUniqueOrThrow({ where: { id: creada.body.data.relationshipRequestId } });
    expect(s.estado).toBe('INVALIDADA');
    const evento = await prisma.eventoDeVinculo.findFirstOrThrow({ where: { solicitudDeVinculoId: s.id, tipo: 'SolicitudDeVinculoInvalidada' } });
    expect(evento).toMatchObject({ actorServicio: 'SISTEMA', actorId: null, estadoPrevio: 'PENDIENTE', estadoPosterior: 'INVALIDADA' });
  });

  it('CaducarSolicitud (DL-037): vencido el plazo, la solicitud pasa a CADUCADA con actor sistema y ya no se acepta', async () => {
    const corta = await appDePrueba({ caducidadDeSolicitudMs: 200 });
    try {
      const pn = await prepararProfesional(corta, 'caduca', ['NUTRICION']);
      const a01 = await prepararAsesorado(corta, 'caduca');
      const creada = await solicitar(corta, pn, a01.id, 'NUTRICION').expect(201);
      await new Promise((ok) => setTimeout(ok, 400));
      const lista = await conSesion(corta, a01.token).get('/api/v1/me/relationship-requests').expect(200);
      expect(lista.body.data[0]).toMatchObject({ relationshipRequestId: creada.body.data.relationshipRequestId, state: 'CADUCADA' });
      await aceptar(corta, a01, creada.body.data.relationshipRequestId, 'v2').expect(422);
      const evento = await prisma.eventoDeVinculo.findFirstOrThrow({ where: { solicitudDeVinculoId: creada.body.data.relationshipRequestId, tipo: 'SolicitudDeVinculoCaducada' } });
      expect(evento.actorServicio).toBe('SISTEMA');
      // La vencida no bloquea una equivalente nueva (el índice parcial solo mira PENDIENTE).
      await solicitar(corta, pn, a01.id, 'NUTRICION').expect(201);
    } finally {
      await corta.close();
    }
  });
});

describe('TEST-RF-023 — cada parte ve solo lo propio, coherente con la autorización efectiva', () => {
  it('TEST-RF-023: el profesional ve sus vínculos, no los de otro; el asesorado ve quién tiene acceso y con qué alcance', async () => {
    const pn = await prepararProfesional(app, 'rf023n', ['NUTRICION']);
    const pt = await prepararProfesional(app, 'rf023t', ['ENTRENAMIENTO']);
    const a01 = await prepararAsesorado(app, 'rf023', { a3: true });
    const a02 = await prepararAsesorado(app, 'rf023-b', { a3: true });
    const n1 = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const t1 = await vinculoCompleto(app, pt, a01, 'ENTRENAMIENTO');
    const n2 = await vinculoCompleto(app, pn, a02, 'NUTRICION');
    await conSesion(app, a01.token).post(`/api/v1/me/consents/${t1.consentId}/revoke`).send({}).expect(200);

    const delAsesorado = ListaDeVinculosResponseSchema.parse((await conSesion(app, a01.token).get('/api/v1/me/relationships').expect(200)).body).data;
    expect(delAsesorado.map((v) => v.relationshipId).sort()).toEqual([n1.vinculoId, t1.vinculoId].sort());
    // «La pantalla no informa acceso vigente cuando el servidor lo deniega por el consentimiento revocado» (DV-05 TEST-RF-023).
    expect(delAsesorado.find((v) => v.relationshipId === t1.vinculoId)).toMatchObject({ consentState: 'REVOKED', accessMode: 'BLOCKED' });
    expect(delAsesorado.find((v) => v.relationshipId === n1.vinculoId)).toMatchObject({ consentState: 'ACTIVE', accessMode: 'CONTEXTUAL' });

    const delProfesional = ListaDeVinculosResponseSchema.parse((await conSesion(app, pt.token).get('/api/v1/me/relationships').expect(200)).body).data;
    expect(delProfesional.map((v) => v.relationshipId)).toEqual([t1.vinculoId]);
    await conSesion(app, pt.token).get(`/api/v1/relationships/${n2.vinculoId}`).expect(404);
    // Lo que muestra la lista coincide con la decisión real.
    await dashboard(app, pt, a01.id).expect(404);
    await dashboard(app, pn, a01.id).expect(200);
  });

  it('Paginación por cursor: páginas disjuntas, orden estable y cursor inválido → 400 INVALID_CURSOR', async () => {
    const a01 = await prepararAsesorado(app, 'pagina');
    const pros = await Promise.all(['p1', 'p2', 'p3'].map((e) => prepararProfesional(app, `pagina-${e}`, ['NUTRICION'])));
    for (const p of pros) await solicitar(app, p, a01.id, 'NUTRICION').expect(201);
    const primera = await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?limit=2').expect(200);
    expect(primera.body.page).toMatchObject({ limit: 2, hasMore: true });
    const segunda = await conSesion(app, a01.token).get(`/api/v1/me/relationship-requests?limit=2&cursor=${primera.body.page.nextCursor}`).expect(200);
    expect(segunda.body.page.hasMore).toBe(false);
    const ids = [...primera.body.data, ...segunda.body.data].map((s: { relationshipRequestId: string }) => s.relationshipRequestId);
    expect(new Set(ids).size).toBe(3);
    const invalido = await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?cursor=eyJ4IjoxfQ').expect(400);
    expect(invalido.body.error.code).toBe('INVALID_CURSOR');
  });
});

describe('TEST-RF-024 / UC-P06 / E2E-03 — pausar, reanudar y finalizar con autoría, fecha y motivo', () => {
  it('E2E-03: pausa (profesional) → solo él reanuda → reanudar no restaura otros gates → finalizar es terminal', async () => {
    const pn = await prepararProfesional(app, 'e2e03', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'e2e03', { a3: true });
    const { vinculoId, consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await dashboard(app, pn, a01.id).expect(200);

    await pausar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId), 'DISPONIBILIDAD').expect(200);
    await dashboard(app, pn, a01.id).expect(404);
    const vPausado = await versionDeVinculo(app, a01.token, vinculoId);
    const prohibido = await reanudar(app, a01.token, vinculoId, vPausado).expect(403);
    expect(prohibido.body.error.code).toBe('ACTION_FORBIDDEN');

    // Mientras está pausado, el asesorado revoca B2: reanudar después no restaura el acceso (REG-06-48).
    await conSesion(app, a01.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({}).expect(200);
    const reanudado = await reanudar(app, pn.token, vinculoId, vPausado).expect(200);
    expect(reanudado.body.data).toMatchObject({ relationshipState: 'ACEPTADO', consentState: 'REVOKED', accessMode: 'BLOCKED', pausedBy: null });
    await dashboard(app, pn, a01.id).expect(404);

    const final = await finalizar(app, a01.token, vinculoId, reanudado.body.data.version, 'DECISION_PERSONAL').expect(200);
    expect(final.body.data).toMatchObject({ relationshipState: 'FINALIZADO', accessMode: 'BLOCKED' });
    await pausar(app, a01.token, vinculoId, final.body.data.version).expect(422);

    const detalle = await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}`).expect(200);
    expect(detalle.body.data.history.map((h: { event: string; actor: string; reason: string | null }) => [h.event, h.actor, h.reason])).toEqual([
      ['SolicitudDeVinculoCreada', 'PROFESSIONAL', null],
      ['SolicitudDeVinculoAceptada', 'ADVISEE', null],
      ['AlcanceDeVinculoAceptado', 'ADVISEE', null],
      ['ConsentimientoOtorgado', 'ADVISEE', null],
      ['AlcanceDeVinculoPausado', 'PROFESSIONAL', 'DISPONIBILIDAD'],
      ['ConsentimientoRevocado', 'ADVISEE', null],
      ['AlcanceDeVinculoReanudado', 'PROFESSIONAL', null],
      ['AlcanceDeVinculoFinalizado', 'ADVISEE', 'DECISION_PERSONAL'],
    ]);
    // «preserva pausa previa»: finalizar desde PAUSADO conserva quién pausó.
    const otro = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await pausar(app, a01.token, otro.vinculoId, await versionDeVinculo(app, a01.token, otro.vinculoId), 'OTRO').expect(200);
    await finalizar(app, pn.token, otro.vinculoId, await versionDeVinculo(app, pn.token, otro.vinculoId), 'CAMBIO_DE_PROFESIONAL').expect(200);
    expect(await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id: otro.vinculoId } })).toMatchObject({ estado: 'FINALIZADO', pausadoPor: 'ASESORADO' });
  });

  it('TEST-RF-024: el motivo es obligatorio y de lista cerrada; CIERRE_DE_CUENTA no lo usa un participante', async () => {
    const pn = await prepararProfesional(app, 'motivo', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'motivo');
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    const v = await versionDeVinculo(app, a01.token, vinculoId);
    await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/pause`).send({ expectedVersion: v }).expect(400);
    await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/finalize`).send({ expectedVersion: v, reason: 'CIERRE_DE_CUENTA' }).expect(400);
    await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/finalize`).send({ expectedVersion: v, reason: 'DISPONIBILIDAD' }).expect(400);
  });
});

describe('TEST-RF-025 — un profesional nuevo no hereda acceso', () => {
  it('TEST-RF-025 / REG-06-55: el asesorado finaliza con PN y se vincula con PN2; PN2 accede solo por su vínculo y su B2', async () => {
    const pn = await prepararProfesional(app, 'rf025a', ['NUTRICION']);
    const pn2 = await prepararProfesional(app, 'rf025b', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'rf025', { a3: true });
    const primero = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await finalizar(app, a01.token, primero.vinculoId, await versionDeVinculo(app, a01.token, primero.vinculoId), 'CAMBIO_DE_PROFESIONAL').expect(200);
    await dashboard(app, pn2, a01.id).expect(404);
    const segundo = await vinculoCompleto(app, pn2, a01, 'NUTRICION', { b2: false });
    await dashboard(app, pn2, a01.id).expect(404);
    await conSesion(app, a01.token).post(`/api/v1/relationships/${segundo.vinculoId}/consents`).send({ consentVersionId: 'b2-sanitario-2026-09-demo' }).expect(201);
    await dashboard(app, pn2, a01.id).expect(200);
    await dashboard(app, pn, a01.id).expect(404);
    // La historia del primer vínculo sigue ahí, con su autoría.
    expect(await prisma.eventoDeVinculo.count({ where: { alcanceDeVinculoId: primero.vinculoId } })).toBeGreaterThanOrEqual(3);
  });
});
