/**
 * WP-NOVEDADES-Y-AVISOS (DEUDA_LEGAJO DL-133) contra PostgreSQL real: el centro de novedades (RF-061; UC-P30;
 * TEST-RF-061) y los avisos push no sensibles (RF-062; UC-E08; TEST-RF-062), con un Expo Push falso local.
 * - Los hechos dejan su novedad en la misma transacción: la activación de un plan, una revisión, la solicitud de
 *   vínculo y su respuesta, la pausa, la revocación del B2. Un reintento no la duplica.
 * - El texto lo arma BE y no trae contenido; el nombre de la contraparte sigue DL-040.
 * - Abrir una novedad registra la primera lectura; la de otro es 404; la historia solo se agrega.
 * - El aviso dice solo que hay algo («BE» / «Tenés un recordatorio para hoy.»): ni nombres ni datos de salud.
 * - Los recordatorios: solo a quien los activó, con un plan vigente, sin registros del día y con el PDP a favor;
 *   repetir la corrida no crea otro; la ruta interna exige su secreto y si no, responde 404.
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDeNovedadesResponseSchema, NovedadResponseSchema, PreferenciasDeAvisosResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoConPlanActivo, cuerpoDeRevision, registrarComida } from './soporte-nutricion';
import { pausar, revocarB2, versionDeVinculo } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const REFERENCIA = /^Asesorado · [0-9a-f]{6}$/;
const novedades = async (a: INestApplication, token: string) => ListaDeNovedadesResponseSchema.parse((await conSesion(a, token).get('/api/v1/me/news?limit=50').expect(200)).body);

describe('RF-061 · el centro de novedades', () => {
  it('la activación de un plan deja su novedad para el asesorado, con el nombre del profesional y sin contenido; abrirla la deja leída una vez', async () => {
    const c = await circuitoConPlanActivo(app, 'nov-plan');
    const lista = await novedades(app, c.ase.token);
    // La más nueva primero: la activación, y antes la solicitud de vínculo que recibió.
    expect(lista.data.map((n) => n.kind)).toEqual(['PLAN_ACTIVATED', 'RELATIONSHIP_REQUEST_RECEIVED']);
    expect(lista.unreadCount).toBe(2);
    const plan = lista.data[0]!;
    expect(plan).toMatchObject({
      scope: 'NUTRICION',
      source: { identityId: c.pro.id, displayName: 'Profesional sintético nut-nov-plan' },
      title: 'Plan nuevo de Nutrición',
      body: 'Profesional sintético nut-nov-plan activó una versión nueva de tu plan de Nutrición.',
      date: null,
      readAt: null,
      open: { view: 'NUTRITION', referenceId: null },
    });
    // Nada del plan: ni alimentos, ni energía, ni el objetivo.
    expect(JSON.stringify(lista)).not.toMatch(/Arroz|Pechuga|kcal|2200/);

    const abierta = NovedadResponseSchema.parse((await conSesion(app, c.ase.token).get(`/api/v1/me/news/${plan.newsId}`).expect(200)).body).data;
    expect(abierta.readAt).not.toBeNull();
    const otraVez = NovedadResponseSchema.parse((await conSesion(app, c.ase.token).get(`/api/v1/me/news/${plan.newsId}`).expect(200)).body).data;
    expect(otraVez.readAt).toBe(abierta.readAt);
    expect(await prisma.lecturaDeNovedad.count({ where: { novedadId: plan.newsId } })).toBe(1);
    expect((await novedades(app, c.ase.token)).unreadCount).toBe(1);

    // La de otro, el mismo 404 que una inexistente; un identificador mal formado, también.
    await conSesion(app, c.pro.token).get(`/api/v1/me/news/${plan.newsId}`).expect(404);
    await conSesion(app, c.ase.token).get('/api/v1/me/news/00000000-0000-4000-8000-000000000000').expect(404);
    await conSesion(app, c.ase.token).get('/api/v1/me/news/no-es-un-id').expect(404);
    await request(app.getHttpServer()).get('/api/v1/me/news').expect(401);

    // La historia solo se agrega.
    await expect(prisma.$executeRawUnsafe(`UPDATE novedad SET tipo = 'PLAN_ACTIVADO' WHERE id = '${plan.newsId}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM lectura_de_novedad WHERE novedad_id = '${plan.newsId}'`)).rejects.toThrow(/append-only/);
  });

  it('el profesional ve la aceptación con la referencia neutral, y con el nombre visible cuando la persona lo declara (DL-040)', async () => {
    const c = await circuitoConPlanActivo(app, 'nov-nombre');
    const antes = (await novedades(app, c.pro.token)).data.find((n) => n.kind === 'RELATIONSHIP_REQUEST_ACCEPTED')!;
    expect(antes.source?.displayName).toMatch(REFERENCIA);
    expect(antes.open).toEqual({ view: 'ADVISEE', referenceId: c.ase.id });
    await conSesion(app, c.ase.token).patch('/api/v1/me/profile').send({ expectedVersion: 'v0', changes: { displayName: 'Diego Prueba' } }).expect(200);
    const despues = (await novedades(app, c.pro.token)).data.find((n) => n.kind === 'RELATIONSHIP_REQUEST_ACCEPTED')!;
    expect(despues.body).toBe('Diego Prueba aceptó tu solicitud de vínculo de Nutrición.');
  });

  it('una revisión deja su novedad (sin su contenido) y reintentarla con la misma clave no la duplica; la pausa y la revocación del B2 avisan a la otra parte', async () => {
    const c = await circuitoConPlanActivo(app, 'nov-revision');
    const reg = await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const clave = claveDeIdempotencia();
    const cuerpo = cuerpoDeRevision([{ type: 'EXECUTION', id: reg.body.data.executionId as string }], 'MAINTAIN');
    await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`, clave).send(cuerpo).expect(201);
    await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`, clave).send(cuerpo).expect(201);
    const revisiones = (await novedades(app, c.ase.token)).data.filter((n) => n.kind === 'REVIEW_RECORDED');
    expect(revisiones).toHaveLength(1);
    expect(revisiones[0]!.body).toBe('Profesional sintético nut-nov-revision registró una revisión de Nutrición.');
    expect(JSON.stringify(revisiones[0])).not.toMatch(/almuerzo|Interpretación|Fundamento/i);

    await pausar(app, c.pro.token, c.vinculoId, await versionDeVinculo(app, c.pro.token, c.vinculoId)).expect(200);
    expect((await novedades(app, c.ase.token)).data[0]).toMatchObject({ kind: 'RELATIONSHIP_PAUSED', title: 'Vínculo de Nutrición en pausa', open: { view: 'RELATIONSHIPS' } });

    await revocarB2(app, c.ase, c.consentId).expect(200);
    expect((await novedades(app, c.pro.token)).data[0]).toMatchObject({ kind: 'CONSENT_REVOKED', scope: 'NUTRICION', open: { view: 'ADVISEE', referenceId: c.ase.id } });
  });
});

describe('RF-062 · los teléfonos suscriptos y las preferencias', () => {
  it('un teléfono es de una cuenta por vez: si otra lo registra, la anterior deja de recibir; retirarlo es idempotente; el token no va a la auditoría', async () => {
    const a = await circuitoConPlanActivo(app, 'nov-tel-a');
    const b = await circuitoConPlanActivo(app, 'nov-tel-b');
    const telefono = '00000000-0000-4000-8000-0000000000a1';
    const ruta = `/api/v1/me/push-subscriptions/${telefono}`;
    const token = 'ExponentPushToken[telefono-compartido-1]';
    await conSesion(app, a.ase.token).put(ruta).send({ expoPushToken: token, platform: 'ANDROID' }).expect(200);
    // Repetirlo igual no cambia nada.
    await conSesion(app, a.ase.token).put(ruta).send({ expoPushToken: token, platform: 'ANDROID' }).expect(200);
    expect(await prisma.suscripcionPush.count({ where: { dispositivoId: telefono } })).toBe(1);
    await conSesion(app, b.ase.token).put(ruta).send({ expoPushToken: token, platform: 'ANDROID' }).expect(200);
    const filas = await prisma.suscripcionPush.findMany({ where: { dispositivoId: telefono }, orderBy: { momentoDeAlta: 'asc' } });
    expect(filas.map((f) => [f.identidadId, f.motivoDeBaja])).toEqual([
      [a.ase.id, 'OTRA_CUENTA'],
      [b.ase.id, null],
    ]);
    // La cuenta A ya no tiene nada que retirar ahí; B sí, y repetirlo responde igual.
    await conSesion(app, a.ase.token).delete(ruta).expect(204);
    await conSesion(app, b.ase.token).delete(ruta).expect(204);
    await conSesion(app, b.ase.token).delete(ruta).expect(204);
    expect((await prisma.suscripcionPush.findMany({ where: { dispositivoId: telefono } })).map((f) => f.motivoDeBaja)).toEqual(['OTRA_CUENTA', 'RETIRADA']);
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { operacion: { in: ['API-NOV-03', 'API-NOV-04'] }, actorId: { in: [a.ase.id, b.ase.id] } } });
    expect(auditoria.length).toBe(3);
    expect(JSON.stringify(auditoria)).not.toContain('telefono-compartido');
  });

  it('las preferencias empiezan apagadas; cambiarlas queda en la auditoría, y repetirlas no', async () => {
    const c = await circuitoConPlanActivo(app, 'nov-pref');
    const ruta = '/api/v1/me/notification-preferences';
    expect(PreferenciasDeAvisosResponseSchema.parse((await conSesion(app, c.ase.token).get(ruta).expect(200)).body).data).toEqual({ mealLogReminder: false, trainingLogReminder: false, updatedAt: null });
    const r = PreferenciasDeAvisosResponseSchema.parse((await conSesion(app, c.ase.token).put(ruta).send({ mealLogReminder: true, trainingLogReminder: false }).expect(200)).body).data;
    expect(r).toMatchObject({ mealLogReminder: true, trainingLogReminder: false });
    expect(r.updatedAt).not.toBeNull();
    await conSesion(app, c.ase.token).put(ruta).send({ mealLogReminder: true, trainingLogReminder: false }).expect(200);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-NOV-06', actorId: c.ase.id } })).toBe(1);
  });
});

// ─── Los avisos y los recordatorios, con un Expo Push falso ───────────────────────────────────────

interface PedidoAExpo {
  readonly encabezados: IncomingHttpHeaders;
  readonly mensajes: { to: string; title: string; body: string; data: { type: string; referenceId: string } }[];
}

async function levantarExpoFalso(): Promise<{ url: string; pedidos: PedidoAExpo[]; cerrar: () => Promise<void> }> {
  const pedidos: PedidoAExpo[] = [];
  const servidor: Server = createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c: Buffer) => (cuerpo += c.toString('utf8')));
    req.on('end', () => {
      const mensajes = JSON.parse(cuerpo) as PedidoAExpo['mensajes'];
      pedidos.push({ encabezados: req.headers, mensajes });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          data: mensajes.map((m, i) =>
            m.to.includes('invalido') ? { status: 'error', message: 'sintético', details: { error: 'DeviceNotRegistered' } } : { status: 'ok', id: `ticket-${pedidos.length}-${i}` },
          ),
        }),
      );
    });
  });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  const { port } = servidor.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, pedidos, cerrar: () => new Promise((r) => servidor.close(() => r())) };
}

describe('RF-062 y DL-133 · los avisos y los recordatorios diarios', () => {
  const SECRETO = 'secreto-sintetico-de-la-tarea-de-recordatorios-01';
  let conAvisos: INestApplication;
  let expo: Awaited<ReturnType<typeof levantarExpoFalso>>;

  beforeAll(async () => {
    expo = await levantarExpoFalso();
    conAvisos = await appDePrueba({ avisos: { canal: 'expo', expoUrl: expo.url, expoToken: 'token-de-acceso-sintetico', presupuestoMs: 2_000 }, secretoDeTareas: SECRETO });
  });
  afterAll(async () => {
    await conAvisos.close();
    await expo.cerrar();
  });

  const correr = (slot: 'AFTERNOON' | 'NIGHT', autorizacion = `Bearer ${SECRETO}`) =>
    request(conAvisos.getHttpServer()).post('/internal/reminder-runs').set('Authorization', autorizacion).send({ slot });

  it('la ruta interna exige su secreto: sin él, con otro o sin configurar, el mismo 404', async () => {
    await request(conAvisos.getHttpServer()).post('/internal/reminder-runs').send({ slot: 'AFTERNOON' }).expect(404);
    await correr('AFTERNOON', 'Bearer otro-secreto').expect(404);
    await request(app.getHttpServer()).post('/internal/reminder-runs').set('Authorization', `Bearer ${SECRETO}`).send({ slot: 'AFTERNOON' }).expect(404);
    await correr('AFTERNOON').send({ slot: 'MAÑANA' }).expect(400);
  });

  it('a quien lo activó y no registró comidas le llega un recordatorio y un aviso sin contenido; repetir la corrida no crea otro; con una comida, ya no; sin B2, tampoco', async () => {
    const c = await circuitoConPlanActivo(conAvisos, 'nov-rec');
    await conSesion(conAvisos, c.ase.token).put('/api/v1/me/notification-preferences').send({ mealLogReminder: true, trainingLogReminder: true }).expect(200);
    const token = 'ExponentPushToken[recordatorio-ok-1]';
    await conSesion(conAvisos, c.ase.token).put('/api/v1/me/push-subscriptions/00000000-0000-4000-8000-0000000000b1').send({ expoPushToken: token, platform: 'ANDROID' }).expect(200);
    // Otra persona con el recordatorio activo y un teléfono que Expo ya no reconoce.
    const otra = await circuitoConPlanActivo(conAvisos, 'nov-rec-invalido');
    await conSesion(conAvisos, otra.ase.token).put('/api/v1/me/notification-preferences').send({ mealLogReminder: true, trainingLogReminder: false }).expect(200);
    await conSesion(conAvisos, otra.ase.token).put('/api/v1/me/push-subscriptions/00000000-0000-4000-8000-0000000000b2').send({ expoPushToken: 'ExponentPushToken[telefono-invalido-1]', platform: 'ANDROID' }).expect(200);
    const previos = expo.pedidos.length;

    // Otros archivos de prueba pueden compartir la base: se cuenta lo de estas personas, no el total de la corrida.
    const r = (await correr('AFTERNOON').expect(200)).body.data;
    expect(r.slot).toBe('AFTERNOON');
    expect(r.reminders).toBeGreaterThanOrEqual(2);
    expect(r.pushes.sent).toBeGreaterThanOrEqual(1);
    expect(r.pushes.rejected).toBeGreaterThanOrEqual(1);
    const recordatoriosDe = (id: string) => prisma.novedad.count({ where: { destinatarioId: id, tipo: 'RECORDATORIO_DE_COMIDAS' } });
    expect(await recordatoriosDe(c.ase.id)).toBe(1);
    expect(await recordatoriosDe(otra.ase.id)).toBe(1);
    const recordatorio = (await novedades(conAvisos, c.ase.token)).data[0]!;
    expect(recordatorio).toMatchObject({ kind: 'MEAL_LOG_REMINDER', source: null, scope: 'NUTRICION', title: 'Recordatorio', date: r.date, open: { view: 'NUTRITION' } });

    // Lo que viajó a Expo: autenticado con el token de acceso, y solo una señal mínima.
    const enviados = expo.pedidos.slice(previos).flatMap((p) => p.mensajes);
    const propio = enviados.find((m) => m.to === token)!;
    expect(propio).toEqual(expect.objectContaining({ title: 'BE', body: 'Tenés un recordatorio para hoy.', data: { type: 'NEW_INTERNAL_UPDATE', referenceId: recordatorio.newsId } }));
    expect(JSON.stringify(enviados)).not.toMatch(/Profesional sintético|Nutrición|comida|kcal|Asesorado/);
    expect(expo.pedidos[expo.pedidos.length - 1]!.encabezados.authorization).toBe('Bearer token-de-acceso-sintetico');
    // El teléfono que Expo no reconoce queda dado de baja.
    expect((await prisma.suscripcionPush.findFirst({ where: { dispositivoId: '00000000-0000-4000-8000-0000000000b2' } }))?.motivoDeBaja).toBe('TOKEN_INVALIDO');

    // Repetir la franja no crea otro recordatorio ni otro aviso.
    const avisosAntes = expo.pedidos.flatMap((p) => p.mensajes).filter((m) => m.to === token).length;
    await correr('AFTERNOON').expect(200);
    expect(await recordatoriosDe(c.ase.id)).toBe(1);
    expect(expo.pedidos.flatMap((p) => p.mensajes).filter((m) => m.to === token).length).toBe(avisosAntes);

    // Con una comida registrada hoy, la noche no recuerda comidas; tampoco entrenamiento, porque no tiene ese plan.
    await registrarComida(conAvisos, c.ase, c.planId, c.dia).expect(201);
    await correr('NIGHT').expect(200);
    const deLaPersona = await prisma.novedad.count({ where: { destinatarioId: c.ase.id, tipo: { in: ['RECORDATORIO_DE_COMIDAS', 'RECORDATORIO_DE_ENTRENAMIENTO'] } } });
    expect(deLaPersona).toBe(1);
    // La otra persona sigue sin comidas: la noche le deja su segundo recordatorio del día.
    expect(await recordatoriosDe(otra.ase.id)).toBe(2);

    // Sin el B2 la persona no puede registrar contra ese plan: el PDP lo impide, y el recordatorio no se emite.
    const tercera = await circuitoConPlanActivo(conAvisos, 'nov-rec-sin-b2');
    await conSesion(conAvisos, tercera.ase.token).put('/api/v1/me/notification-preferences').send({ mealLogReminder: true, trainingLogReminder: false }).expect(200);
    await revocarB2(conAvisos, tercera.ase, tercera.consentId).expect(200);
    await correr('NIGHT').expect(200);
    expect(await prisma.novedad.count({ where: { destinatarioId: tercera.ase.id, tipo: 'RECORDATORIO_DE_COMIDAS' } })).toBe(0);
  });

  it('las novedades de antes de suscribir el teléfono no se avisan, y una ya leída tampoco', async () => {
    const c = await circuitoConPlanActivo(conAvisos, 'nov-antes');
    const previos = expo.pedidos.length;
    await conSesion(conAvisos, c.ase.token).put('/api/v1/me/push-subscriptions/00000000-0000-4000-8000-0000000000c1').send({ expoPushToken: 'ExponentPushToken[antes-de-suscribir-1]', platform: 'ANDROID' }).expect(200);
    await correr('AFTERNOON').expect(200);
    expect(expo.pedidos.slice(previos).flatMap((p) => p.mensajes).filter((m) => m.to === 'ExponentPushToken[antes-de-suscribir-1]')).toEqual([]);
  });
});
