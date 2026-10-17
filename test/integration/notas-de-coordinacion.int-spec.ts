/**
 * TEST-RF-057 y TEST-UC-E07 (11A) contra PostgreSQL real: la nota de coordinación entre los profesionales de una persona
 * (WP-NOTAS-DE-COORDINACION; DEUDA_LEGAJO DL-140; API-CRD-01 y sus dos variantes), con un Expo Push falso local.
 * - CRD-D1: «todos» son los que ese día acompañan a la persona con el vínculo aceptado y el B2 vigente; «uno», solo ese.
 *   Los destinatarios quedan guardados, y cada lectura exige además el acceso de ese día.
 * - El autor sin acceso recibe el mismo 404 que una persona inexistente (UC-E07, paso 3; UC-I02 E05).
 * - Quien pierde el vínculo (pausa, B2 revocado, fin) deja de leerla; la persona la lee siempre (08 §9.15, §14.3).
 * - CRD-D5: lo citado es del autor y de su área; nombrarlo no lo abre. CRD-D6: la novedad no trae el texto, ni el aviso.
 * - CRD-D7: solo se agrega (la base rechaza UPDATE, DELETE y TRUNCATE); para corregir, otra nota que la cita.
 * - Idempotencia: el reintento con la misma clave responde la misma nota, sin otra ni otra novedad.
 */
import type { INestApplication } from '@nestjs/common';
import {
  DestinatariosPosiblesResponseSchema,
  LineaDeTiempoResponseSchema,
  ListaDeNotasPropiasResponseSchema,
  ListaDeNovedadesResponseSchema,
  NotaDeCoordinacionResponseSchema,
  type EntradaDeLineaDeTiempo,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { DespachadorDeAvisos } from '../../apps/api/src/novedades/despachador';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoConPlanActivo, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, registrarComida } from './soporte-nutricion';
import {
  a3Vigente,
  finalizar,
  pausar,
  prepararAsesorado,
  prepararProfesional,
  reanudar,
  revocarB2,
  versionDeVinculo,
  vinculoCompleto,
  type Parte,
} from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let expo: { url: string; mensajes: { to: string; title: string; body: string; data: unknown }[]; cerrar: () => Promise<void> };

/** Un Expo Push falso: guarda lo que le llega y responde «ok». Ninguna prueba llama a Expo. */
async function levantarExpoFalso(): Promise<typeof expo> {
  const mensajes: (typeof expo)['mensajes'] = [];
  const servidor: Server = createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c: Buffer) => (cuerpo += c.toString('utf8')));
    req.on('end', () => {
      const lote = JSON.parse(cuerpo) as (typeof expo)['mensajes'];
      mensajes.push(...lote);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: lote.map((_, i) => ({ status: 'ok', id: `ticket-${mensajes.length}-${i}` })) }));
    });
  });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  const { port } = servidor.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, mensajes, cerrar: () => new Promise((r) => servidor.close(() => r())) };
}

beforeAll(async () => {
  expo = await levantarExpoFalso();
  app = await appDePrueba({ avisos: { canal: 'expo', expoUrl: expo.url, expoToken: 'token-de-acceso-sintetico', presupuestoMs: 2_000 } });
});
afterAll(async () => {
  await app.close();
  await expo.cerrar();
  await prisma.$disconnect();
});

const TEXTO = 'Desde el lunes cena más tarde: si entrena temprano, la sesión queda lejos de la última comida.';

/**
 * El equipo de una persona: su nutricionista con un plan activado (el autor de las notas), y una entrenadora y un
 * antropometrista, cada uno con su vínculo aceptado y su B2.
 */
async function equipo(etiqueta: string) {
  const c = await circuitoConPlanActivo(app, `crd-${etiqueta}`);
  const ent = await prepararProfesional(app, `ent-crd-${etiqueta}`, ['ENTRENAMIENTO']);
  const ant = await prepararProfesional(app, `ant-crd-${etiqueta}`, ['ANTROPOMETRIA']);
  const vEnt = await vinculoCompleto(app, ent, c.ase, 'ENTRENAMIENTO');
  const vAnt = await vinculoCompleto(app, ant, c.ase, 'ANTROPOMETRIA');
  return { ...c, nut: c.pro, ent, ant, vEnt, vAnt };
}

const cuerpo = (cambios: Record<string, unknown> = {}) => ({ originScope: 'NUTRICION', purpose: 'CONTEXT_FOR_YOUR_AREA', recipients: { mode: 'ALL' }, text: TEXTO, ...cambios });
const escribir = (autor: Parte, asesoradoId: string, c: Record<string, unknown>, clave = claveDeIdempotencia()) =>
  conSesion(app, autor.token).post(`/api/v1/advisees/${asesoradoId}/coordination-notes`, clave).send(c);
/** Las notas de la línea de tiempo de un profesional, o el status si no la puede leer. */
async function notasEnLaLinea(pro: Parte, asesoradoId: string): Promise<EntradaDeLineaDeTiempo[] | number> {
  const r = await conSesion(app, pro.token).get(`/api/v1/advisees/${asesoradoId}/timeline?type=COORDINATION_NOTE_RECORDED&limit=50`);
  if (r.status !== 200) return r.status;
  return LineaDeTiempoResponseSchema.parse(r.body).data.entries;
}
const novedadesDeNotas = async (pro: Parte) =>
  ListaDeNovedadesResponseSchema.parse((await conSesion(app, pro.token).get('/api/v1/me/news?limit=50').expect(200)).body).data.filter((n) => n.kind === 'COORDINATION_NOTE_RECEIVED');
const notasPropias = async (ase: Parte) => ListaDeNotasPropiasResponseSchema.parse((await conSesion(app, ase.token).get('/api/v1/me/coordination-notes?limit=50').expect(200)).body).data;

describe('TEST-RF-057 · TEST-UC-E07 · escribir y leer una nota de coordinación', () => {
  it('para todos: la reciben los que acompañan a la persona; la leen en su línea de tiempo y con una novedad sin el texto; la persona la lee; el aviso es genérico', async () => {
    const e = await equipo('todos');
    // La entrenadora tiene los avisos activos en su teléfono: el aviso no puede llevar nada de la nota.
    const telefono = `ExponentPushToken[crd-ent-${randomUUID().slice(0, 8)}]`;
    await conSesion(app, e.ent.token).put(`/api/v1/me/push-subscriptions/${randomUUID()}`).send({ expoPushToken: telefono, platform: 'ANDROID' }).expect(200);

    const r = await escribir(e.nut, e.ase.id, cuerpo({ references: [{ type: 'NUTRITION_PLAN_VERSION', id: e.planId }] })).expect(201);
    const nota = NotaDeCoordinacionResponseSchema.parse(r.body).data;
    expect(nota).toMatchObject({
      adviseeId: e.ase.id,
      author: { identityId: e.nut.id, displayName: 'Profesional sintético nut-crd-todos' },
      originScope: { code: 'NUTRICION', label: 'Nutrición' },
      purpose: 'CONTEXT_FOR_YOUR_AREA',
      text: TEXTO,
      corrects: null,
      correctedBy: [],
    });
    expect(nota.recipients.mode).toBe('ALL');
    expect(nota.recipients.people.map((p) => p.identityId).sort()).toEqual([e.ent.id, e.ant.id].sort());
    expect(nota.references).toEqual([{ type: 'NUTRITION_PLAN_VERSION', id: e.planId, label: expect.stringMatching(/^Plan de Nutrición, versión 1, activada el \d{1,2}\/\d{1,2}\/\d{4}$/) }]);

    // La entrenadora y el antropometrista la ven en su línea de tiempo, como un hito, con el área desde la que se escribió.
    for (const pro of [e.ent, e.ant]) {
      const [entrada, ...resto] = (await notasEnLaLinea(pro, e.ase.id)) as EntradaDeLineaDeTiempo[];
      expect(resto).toEqual([]);
      expect(entrada).toMatchObject({
        timelineEntryId: `cnote:${nota.noteId}`,
        eventType: 'COORDINATION_NOTE_RECORDED',
        domain: 'NUTRITION',
        source: { type: 'COORDINATION_NOTE', id: nota.noteId },
        author: { identityId: e.nut.id, role: 'PROFESSIONAL' },
        title: 'Nota de coordinación · Contexto para tu área',
        state: 'EFFECTIVE',
      });
      expect(entrada!.details).toEqual(expect.arrayContaining([{ label: 'Desde', value: 'Nutrición' }, { label: 'Nota', value: TEXTO }]));
      expect(entrada!.details.find((d) => d.label === 'Para')?.value).toMatch(/^Todos los profesionales que la acompañan: /);
      // Ve que el plan está citado, con su rótulo; abrirlo es otra lectura, con su propio permiso: no lo tiene.
      expect(entrada!.relations).toEqual([expect.objectContaining({ kind: 'REFERS_TO', target: { type: 'NUTRITION_PLAN_VERSION', id: e.planId } })]);
      await conSesion(app, pro.token).get(`/api/v1/nutrition/plans/${e.planId}`).expect(404);
    }
    // El autor la ve también, y sí abre lo que citó.
    expect(((await notasEnLaLinea(e.nut, e.ase.id)) as EntradaDeLineaDeTiempo[]).map((x) => x.source.id)).toEqual([nota.noteId]);
    await conSesion(app, e.nut.token).get(`/api/v1/nutrition/plans/${e.planId}`).expect(200);
    // La línea de tiempo la cuenta entre sus tipos; la búsqueda la encuentra por su texto.
    const linea = LineaDeTiempoResponseSchema.parse((await conSesion(app, e.ent.token).get(`/api/v1/advisees/${e.ase.id}/timeline?limit=1`).expect(200)).body).data;
    expect(linea.periodCounts.byEventType).toEqual(expect.arrayContaining([{ eventType: 'COORDINATION_NOTE_RECORDED', count: 1 }]));
    const busqueda = await conSesion(app, e.ent.token).post(`/api/v1/advisees/${e.ase.id}/timeline/search`).send({ q: 'cena más tarde' }).expect(200);
    expect(LineaDeTiempoResponseSchema.parse(busqueda.body).data.entries.map((x) => x.timelineEntryId)).toEqual([`cnote:${nota.noteId}`]);

    // CRD-D6: una novedad para cada destinatario, que dice quién y sobre quién, sin el texto, y abre la ficha.
    for (const pro of [e.ent, e.ant]) {
      const [nov, ...otras] = await novedadesDeNotas(pro);
      expect(otras).toEqual([]);
      expect(nov).toMatchObject({ scope: 'NUTRICION', source: { identityId: e.nut.id }, title: 'Nota de coordinación', open: { view: 'ADVISEE', referenceId: e.ase.id } });
      expect(nov!.body).toMatch(/^Profesional sintético nut-crd-todos dejó una nota de coordinación sobre Asesorado · [0-9a-f]{6}\.$/);
      expect(nov!.body).not.toContain('cena');
    }
    // Ni el autor ni la persona reciben esa novedad: el autor la escribió; la persona la lee en su app.
    expect(await novedadesDeNotas(e.nut)).toEqual([]);
    expect(await novedadesDeNotas(e.ase)).toEqual([]);

    // El aviso push: «BE» y «Tenés una novedad.», sin nombres ni el texto (REG-06-30; CRD-D6).
    await app.get(DespachadorDeAvisos).despachar();
    const aviso = expo.mensajes.filter((m) => m.to === telefono);
    expect(aviso).toEqual([expect.objectContaining({ title: 'BE', body: 'Tenés una novedad.' })]);
    expect(JSON.stringify(aviso)).not.toMatch(/cena|Profesional sintético|Asesorado|Nutrición|coordinación/);

    // CRD-D2: la persona la lee entera, con quién la escribió y a quién fue.
    const [propia] = await notasPropias(e.ase);
    expect(propia).toEqual(nota);
  });

  it('para uno en particular: solo lo recibe ese; elegir a alguien sin acceso, al autor o a la persona es 422 y no se registra nada', async () => {
    const e = await equipo('uno');
    const ajeno = await prepararProfesional(app, 'crd-uno-ajeno', ['ENTRENAMIENTO']);
    const nota = NotaDeCoordinacionResponseSchema.parse((await escribir(e.nut, e.ase.id, cuerpo({ purpose: 'COORDINATION_REQUEST', recipients: { mode: 'ONE', identityId: e.ent.id } })).expect(201)).body).data;
    expect(nota.recipients).toEqual({ mode: 'ONE', people: [{ identityId: e.ent.id, displayName: 'Profesional sintético ent-crd-uno' }] });
    expect(((await notasEnLaLinea(e.ent, e.ase.id)) as EntradaDeLineaDeTiempo[]).map((x) => x.source.id)).toEqual([nota.noteId]);
    // El antropometrista no la recibió: ni en su línea de tiempo ni en sus novedades.
    expect(await notasEnLaLinea(e.ant, e.ase.id)).toEqual([]);
    expect(await novedadesDeNotas(e.ant)).toEqual([]);

    const antes = await prisma.notaDeCoordinacion.count({ where: { asesoradoId: e.ase.id } });
    for (const elegido of [ajeno.id, e.nut.id, e.ase.id, randomUUID()]) {
      const r = await escribir(e.nut, e.ase.id, cuerpo({ recipients: { mode: 'ONE', identityId: elegido } })).expect(422);
      expect(r.body.error.code).toBe('COORDINATION_RECIPIENT_NOT_AVAILABLE');
    }
    expect(await prisma.notaDeCoordinacion.count({ where: { asesoradoId: e.ase.id } })).toBe(antes);
  });

  it('el autor sin vínculo con la persona, o desde un área que no es suya con ella, recibe el mismo 404 que una persona inexistente', async () => {
    const e = await equipo('sin-acceso');
    const ajeno = await prepararProfesional(app, 'crd-ajeno', ['NUTRICION']);
    const inexistente = await escribir(ajeno, randomUUID(), cuerpo()).expect(404);
    const sinVinculo = await escribir(ajeno, e.ase.id, cuerpo()).expect(404);
    expect(sinVinculo.body).toEqual(inexistente.body);
    await escribir(ajeno, 'no-es-un-id', cuerpo()).expect(404);
    // La nutricionista no acompaña a la persona en Entrenamiento: desde esa área no puede escribir.
    const otraArea = await escribir(e.nut, e.ase.id, cuerpo({ originScope: 'ENTRENAMIENTO' })).expect(404);
    expect(otraArea.body).toEqual(inexistente.body);
    // El rechazo queda en la auditoría y la decisión denegada, en el registro del PDP.
    expect(await prisma.decisionDeAcceso.count({ where: { operacion: 'API-CRD-01', actorId: ajeno.id, resultado: 'DENEGADA' } })).toBeGreaterThanOrEqual(2);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-CRD-01', actorId: ajeno.id, resultado: 'RECHAZO' } })).toBeGreaterThanOrEqual(2);
    // Tampoco ve a quién escribirle ni lee la línea de tiempo.
    await conSesion(app, ajeno.token).get(`/api/v1/advisees/${e.ase.id}/coordination-notes/recipients`).expect(404);
    expect(await notasEnLaLinea(ajeno, e.ase.id)).toBe(404);
    expect(await prisma.notaDeCoordinacion.count({ where: { autorId: ajeno.id } })).toBe(0);
  });

  it('API-CRD-01-LISTA: las áreas del autor y los que hoy acompañan a la persona, con sus áreas; quien pierde el acceso deja de figurar', async () => {
    const e = await equipo('lista');
    const leer = async () => DestinatariosPosiblesResponseSchema.parse((await conSesion(app, e.nut.token).get(`/api/v1/advisees/${e.ase.id}/coordination-notes/recipients`).expect(200)).body).data;
    const antes = await leer();
    expect(antes.origins).toEqual([{ code: 'NUTRICION', label: 'Nutrición' }]);
    expect(antes.recipients.map((r) => [r.identityId, r.scopes.map((s) => s.code)]).sort()).toEqual(
      [
        [e.ent.id, ['ENTRENAMIENTO']],
        [e.ant.id, ['ANTROPOMETRIA']],
      ].sort(),
    );
    await pausar(app, e.ase.token, e.vEnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vEnt.vinculoId)).expect(200);
    expect((await leer()).recipients.map((r) => r.identityId)).toEqual([e.ant.id]);
    await conSesion(app, e.nut.token).get(`/api/v1/advisees/${e.ase.id}/coordination-notes/recipients?x=1`).expect(400);
  });
});

describe('TEST-RF-057 · quién la sigue leyendo', () => {
  it('la pausa, el B2 revocado y el fin del vínculo cortan la lectura del destinatario; una nota nueva no le llega; la persona las lee siempre', async () => {
    const e = await equipo('cortes');
    const primera = NotaDeCoordinacionResponseSchema.parse((await escribir(e.nut, e.ase.id, cuerpo()).expect(201)).body).data;
    expect(((await notasEnLaLinea(e.ent, e.ase.id)) as EntradaDeLineaDeTiempo[]).length).toBe(1);

    // Pausa: deja de leerla (sin ningún alcance permitido, la línea de tiempo es 404). Al reanudar, vuelve a verla.
    await pausar(app, e.ase.token, e.vEnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vEnt.vinculoId)).expect(200);
    expect(await notasEnLaLinea(e.ent, e.ase.id)).toBe(404);
    // Una nota para todos escrita durante la pausa no le llega: ese día no la acompaña con acceso.
    const durante = NotaDeCoordinacionResponseSchema.parse((await escribir(e.nut, e.ase.id, cuerpo({ purpose: 'CHANGE_IN_MY_AREA', text: 'Cambio de horario de las comidas.' })).expect(201)).body).data;
    expect(durante.recipients.people.map((p) => p.identityId)).toEqual([e.ant.id]);
    await reanudar(app, e.ase.token, e.vEnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vEnt.vinculoId)).expect(200);
    expect(((await notasEnLaLinea(e.ent, e.ase.id)) as EntradaDeLineaDeTiempo[]).map((x) => x.source.id)).toEqual([primera.noteId]);

    // B2 revocado: deja de leerla.
    await revocarB2(app, e.ase, e.vEnt.consentId as string).expect(200);
    expect(await notasEnLaLinea(e.ent, e.ase.id)).toBe(404);

    // El autor pausado tampoco la lee ni puede escribir (08 Q-005: pausado no conserva lectura profesional).
    await pausar(app, e.ase.token, e.vinculoId, await versionDeVinculo(app, e.ase.token, e.vinculoId)).expect(200);
    expect(await notasEnLaLinea(e.nut, e.ase.id)).toBe(404);
    await escribir(e.nut, e.ase.id, cuerpo()).expect(404);

    // Fin del vínculo del antropometrista: deja de leerla.
    expect(((await notasEnLaLinea(e.ant, e.ase.id)) as EntradaDeLineaDeTiempo[]).length).toBe(2);
    await finalizar(app, e.ase.token, e.vAnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vAnt.vinculoId)).expect(200);
    expect(await notasEnLaLinea(e.ant, e.ase.id)).toBe(404);

    // La persona las sigue leyendo todas: son su historia (08 §9.15, §14.3).
    expect((await notasPropias(e.ase)).map((n) => n.noteId)).toEqual([durante.noteId, primera.noteId]);
    // Sin el A3 vigente, 403, como «Tu historial» y REV-A (08:406).
    await conSesion(app, e.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, e.ase.token)}/revoke`).send({}).expect(200);
    const sinA3 = await conSesion(app, e.ase.token).get('/api/v1/me/coordination-notes').expect(403);
    expect(sinA3.body.error.code).toBe('ACTION_FORBIDDEN');
  });

  it('cada uno lee solo lo suyo: otra persona no ve notas ajenas, y un profesional no lee por /me las notas que escribió', async () => {
    const e = await equipo('propias');
    await escribir(e.nut, e.ase.id, cuerpo()).expect(201);
    const otra = await prepararAsesorado(app, 'crd-propias-otra', { a3: true });
    expect(await notasPropias(otra)).toEqual([]);
    expect((await conSesion(app, e.nut.token).get('/api/v1/me/coordination-notes').expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    await conSesion(app, e.ase.token).get('/api/v1/me/coordination-notes?cursor=basura').expect(400);
    await request(app.getHttpServer()).get('/api/v1/me/coordination-notes').expect(401);
  });
});

describe('CRD-D5 · lo citado', () => {
  it('solo lo propio del área de origen y registrado; lo ajeno, lo de otra área o un borrador es 422 y no se registra nada', async () => {
    const e = await equipo('referencias');
    const otro = await circuitoConPlanActivo(app, 'crd-referencias-otro');
    const borrador = await circuitoListoParaPlanificar(app, 'crd-referencias-borrador');
    const deBorrador = await crearBorrador(app, borrador);
    const casos: { referencia: { type: string; id: string }; issue: string }[] = [
      // El plan de otra nutricionista con otra persona: existe, pero no es del autor con esta persona.
      { referencia: { type: 'NUTRITION_PLAN_VERSION', id: otro.planId }, issue: 'REFERENCE_NOT_AVAILABLE' },
      // Un borrador no es un hecho registrado.
      { referencia: { type: 'NUTRITION_PLAN_VERSION', id: deBorrador.planId }, issue: 'REFERENCE_NOT_AVAILABLE' },
      { referencia: { type: 'NUTRITION_REVIEW', id: randomUUID() }, issue: 'REFERENCE_NOT_AVAILABLE' },
      // Otra área que la de origen: aunque fuera del autor, una nota de Nutrición no cita Entrenamiento.
      { referencia: { type: 'TRAINING_PLAN_VERSION', id: randomUUID() }, issue: 'REFERENCE_OUTSIDE_ORIGIN_SCOPE' },
    ];
    for (const caso of casos) {
      const r = await escribir(e.nut, e.ase.id, cuerpo({ references: [caso.referencia] })).expect(422);
      expect(r.body.error).toMatchObject({ code: 'COORDINATION_REFERENCE_INVALID', details: { issues: [{ code: caso.issue, path: 'references.0' }] } });
    }
    expect(await prisma.notaDeCoordinacion.count({ where: { asesoradoId: e.ase.id } })).toBe(0);

    // Una revisión registrada por la autora sí se cita, con su rótulo.
    const reg = await registrarComida(app, e.ase, e.planId, e.dia).expect(201);
    const rev = await conSesion(app, e.nut.token)
      .post(`/api/v1/advisees/${e.ase.id}/nutrition/reviews`)
      .send(cuerpoDeRevision([{ type: 'EXECUTION', id: reg.body.data.executionId as string }], 'MAINTAIN', { nextReviewAt: '2030-01-01' }))
      .expect(201);
    const nota = NotaDeCoordinacionResponseSchema.parse(
      (await escribir(e.nut, e.ase.id, cuerpo({ references: [{ type: 'NUTRITION_REVIEW', id: rev.body.data.reviewId as string }, { type: 'NUTRITION_PLAN_VERSION', id: e.planId }] })).expect(201)).body,
    ).data;
    expect(nota.references.map((r) => r.type)).toEqual(['NUTRITION_REVIEW', 'NUTRITION_PLAN_VERSION']);
    expect(nota.references[0]!.label).toMatch(/^Revisión de Nutrición del \d{1,2}\/\d{1,2}\/\d{4}$/);
    // La entrenadora ve que la revisión está citada, pero no la abre: nombrarla no da acceso (UC-E07 E05).
    await conSesion(app, e.ent.token).get(`/api/v1/nutrition/reviews/${rev.body.data.reviewId as string}`).expect(404);
  });
});

describe('CRD-D7 · solo se agrega; para corregir, otra nota que la cita', () => {
  it('la base rechaza modificar o borrar una nota, sus destinatarios o sus referencias; una corrección cita una nota propia sobre la misma persona', async () => {
    const e = await equipo('agregar');
    const original = NotaDeCoordinacionResponseSchema.parse((await escribir(e.nut, e.ase.id, cuerpo({ references: [{ type: 'NUTRITION_PLAN_VERSION', id: e.planId }] })).expect(201)).body).data;
    for (const sentencia of [
      `UPDATE nota_de_coordinacion SET texto = 'otra cosa' WHERE id = '${original.noteId}'`,
      `DELETE FROM nota_de_coordinacion WHERE id = '${original.noteId}'`,
      `UPDATE destinatario_de_nota SET destinatario_id = '${e.ant.id}' WHERE nota_id = '${original.noteId}'`,
      `DELETE FROM destinatario_de_nota WHERE nota_id = '${original.noteId}'`,
      `DELETE FROM referencia_de_nota WHERE nota_id = '${original.noteId}'`,
    ]) {
      await expect(prisma.$executeRawUnsafe(sentencia)).rejects.toThrow(/append-only/);
    }

    // La corrección: otra nota de la misma autora que la cita. La persona y los destinatarios ven las dos, enlazadas.
    const correccion = NotaDeCoordinacionResponseSchema.parse(
      (await escribir(e.nut, e.ase.id, cuerpo({ purpose: 'CHANGE_IN_MY_AREA', text: 'Corrijo: cena a la hora de siempre.', correctsNoteId: original.noteId })).expect(201)).body,
    ).data;
    expect(correccion.corrects).toEqual({ noteId: original.noteId, recordedAt: original.recordedAt });
    const [nueva, vieja] = await notasPropias(e.ase);
    expect(nueva!.noteId).toBe(correccion.noteId);
    expect(vieja!.correctedBy).toEqual([{ noteId: correccion.noteId, recordedAt: correccion.recordedAt }]);
    expect(vieja!.text).toBe(TEXTO);
    const entradas = (await notasEnLaLinea(e.ent, e.ase.id)) as EntradaDeLineaDeTiempo[];
    const enLaLinea = entradas.find((x) => x.source.id === original.noteId)!;
    expect(enLaLinea.relations.map((r) => r.kind)).toEqual(['REFERS_TO', 'CORRECTED_BY_NOTE']);
    expect(entradas.find((x) => x.source.id === correccion.noteId)!.relations).toEqual([expect.objectContaining({ kind: 'CORRECTS_NOTE', target: { type: 'COORDINATION_NOTE', id: original.noteId } })]);

    // No se corrige la nota de otro profesional, ni una nota sobre otra persona.
    const deLaEntrenadora = NotaDeCoordinacionResponseSchema.parse(
      (await escribir(e.ent, e.ase.id, cuerpo({ originScope: 'ENTRENAMIENTO', purpose: 'COORDINATION_REQUEST', text: 'Sumamos una sesión los sábados.' })).expect(201)).body,
    ).data;
    const ajena = await escribir(e.nut, e.ase.id, cuerpo({ correctsNoteId: deLaEntrenadora.noteId })).expect(422);
    expect(ajena.body.error).toMatchObject({ code: 'COORDINATION_REFERENCE_INVALID', details: { issues: [{ code: 'CORRECTED_NOTE_NOT_AVAILABLE', path: 'correctsNoteId' }] } });
    await escribir(e.nut, e.ase.id, cuerpo({ correctsNoteId: randomUUID() })).expect(422);
  });

  it('la base sostiene sus garantías aunque el código se equivoque', async () => {
    const e = await equipo('base');
    const nota = NotaDeCoordinacionResponseSchema.parse((await escribir(e.nut, e.ase.id, cuerpo()).expect(201)).body).data;
    const nueva = randomUUID();
    const insertarNota = (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], extra = '') =>
      tx.$executeRawUnsafe(
        `INSERT INTO nota_de_coordinacion (id, autor_id, asesorado_id, alcance_de_origen, finalidad, modo_de_destinatarios, texto, procedencia, momento_de_ocurrencia${extra ? ', corrige_a_id' : ''})
         VALUES ('${nueva}', '${e.nut.id}', '${e.ase.id}', 'NUTRICION', 'CONTEXTO_PARA_TU_AREA', 'UNO', 'Texto sintético.', '{}'::jsonb, now()${extra ? `, '${extra}'` : ''})`,
      );
    // Una nota sin destinatarios no se confirma (constraint diferido).
    await expect(prisma.$transaction((tx) => insertarNota(tx))).rejects.toThrow(/no tiene destinatarios/);
    // Ni el autor ni la persona la reciben; «uno» es uno solo.
    await expect(
      prisma.$transaction(async (tx) => {
        await insertarNota(tx);
        await tx.$executeRawUnsafe(`INSERT INTO destinatario_de_nota (nota_id, destinatario_id) VALUES ('${nueva}', '${e.nut.id}')`);
      }),
    ).rejects.toThrow(/otro profesional/);
    await expect(
      prisma.$transaction(async (tx) => {
        await insertarNota(tx);
        await tx.$executeRawUnsafe(`INSERT INTO destinatario_de_nota (nota_id, destinatario_id) VALUES ('${nueva}', '${e.ent.id}'), ('${nueva}', '${e.ant.id}')`);
      }),
    ).rejects.toThrow(/un solo destinatario/);
    // Lo citado tiene que ser del autor con esta persona y de su área.
    const otro = await circuitoConPlanActivo(app, 'crd-base-otro');
    await expect(
      prisma.$transaction(async (tx) => {
        await insertarNota(tx);
        await tx.$executeRawUnsafe(`INSERT INTO destinatario_de_nota (nota_id, destinatario_id) VALUES ('${nueva}', '${e.ent.id}')`);
        await tx.$executeRawUnsafe(`INSERT INTO referencia_de_nota (nota_id, orden, tipo, recurso_id) VALUES ('${nueva}', 1, 'VERSION_DE_PLAN_NUTRICIONAL', '${otro.planId}')`);
      }),
    ).rejects.toThrow(/no es un registro del autor/);
    // Una corrección cita una nota del mismo autor sobre la misma persona.
    const deOtro = NotaDeCoordinacionResponseSchema.parse(
      (await escribir(e.ent, e.ase.id, cuerpo({ originScope: 'ENTRENAMIENTO', recipients: { mode: 'ONE', identityId: e.nut.id } })).expect(201)).body,
    ).data;
    await expect(prisma.$transaction((tx) => insertarNota(tx, deOtro.noteId))).rejects.toThrow(/mismo autor/);
    // El texto: hasta 600 caracteres, sin espacios en los bordes.
    for (const texto of ['a'.repeat(601), ' con espacio', '']) {
      await expect(
        prisma.$executeRawUnsafe(
          `INSERT INTO nota_de_coordinacion (autor_id, asesorado_id, alcance_de_origen, finalidad, modo_de_destinatarios, texto, procedencia, momento_de_ocurrencia)
           VALUES ('${e.nut.id}', '${e.ase.id}', 'NUTRICION', 'CONTEXTO_PARA_TU_AREA', 'TODOS', '${texto}', '{}'::jsonb, now())`,
        ),
      ).rejects.toThrow(/nota_de_coordinacion_texto_acotado/);
    }
    // La novedad de una nota nombra la nota.
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO novedad (destinatario_id, tipo, alcance, fuente_id, clave_de_unicidad, procedencia) VALUES ('${e.ent.id}', 'NOTA_DE_COORDINACION_RECIBIDA', 'NUTRICION', '${e.nut.id}', 'prueba-${nueva}', '{}'::jsonb)`,
      ),
    ).rejects.toThrow(/novedad_nota_de_coordinacion_referenciada/);
    expect(await prisma.notaDeCoordinacion.count({ where: { id: nueva } })).toBe(0);
    expect(nota.noteId).toBeTruthy();
  });
});

describe('Idempotencia', () => {
  it('el reintento con la misma clave responde la misma nota, sin otra ni otra novedad; con otro cuerpo, 409', async () => {
    const e = await equipo('idem');
    const clave = claveDeIdempotencia();
    const primera = await escribir(e.nut, e.ase.id, cuerpo(), clave).expect(201);
    const reintento = await escribir(e.nut, e.ase.id, cuerpo(), clave).expect(201);
    expect(reintento.body).toEqual(primera.body);
    expect(await prisma.notaDeCoordinacion.count({ where: { asesoradoId: e.ase.id } })).toBe(1);
    expect(await novedadesDeNotas(e.ent)).toHaveLength(1);
    const otra = await escribir(e.nut, e.ase.id, cuerpo({ text: 'Otro texto.' }), clave).expect(409);
    expect(otra.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    // Sin la clave, 400; con un campo de más o un texto largo, 400.
    await request(app.getHttpServer()).post(`/api/v1/advisees/${e.ase.id}/coordination-notes`).set('Authorization', `Bearer ${e.nut.token}`).send(cuerpo()).expect(400);
    await escribir(e.nut, e.ase.id, cuerpo({ attachments: [] })).expect(400);
    await escribir(e.nut, e.ase.id, cuerpo({ text: 'a'.repeat(601) })).expect(400);
    // Con el vínculo terminado, el reintento ya no responde la nota: vuelve a decidir y es el mismo 404.
    await finalizar(app, e.ase.token, e.vinculoId, await versionDeVinculo(app, e.ase.token, e.vinculoId)).expect(200);
    await escribir(e.nut, e.ase.id, cuerpo(), clave).expect(404);
  });
});
