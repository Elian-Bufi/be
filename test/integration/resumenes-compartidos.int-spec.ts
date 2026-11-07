/**
 * WP-TABLERO-ALTA-GAMA · TB-52, TB-55 y TB-56 (DEUDA_LEGAJO DL-163 D-13, ampliada por Dirección el 2026-11-07) · lo que la
 * persona comparte de otras áreas, por la API real y contra PostgreSQL:
 * - TEST-TAG-037: API-RES-06 da el plan del otro solo con la autorización de la persona en «resumen y plan», la fila de la
 *   matriz y el PDP; si falta algo, el 404 de lo inexistente. El plan es el que ve la persona. Retirar o bajar corta;
 *   subir pide el texto vigente y el A3; la pausa y el fin del vínculo cortan; cada lectura la ve la persona (API-RES-01) y
 *   quien lleva el área sabe con quién se comparte (API-RES-07); cerrar la cuenta la retira; la base sostiene lo suyo.
 * - TEST-TAG-039 (la parte de la API): API-RES-04 no depende de que haya un plan.
 * - TEST-TAG-040: pedir (API-RES-08) no concede nada; uno por vez y 7 días; la persona decide (API-RES-09 y 10).
 */
import type { INestApplication } from '@nestjs/common';
import {
  LoQueSeComparteDeMiAreaResponseSchema,
  MisResumenesCompartidosResponseSchema,
  PedidoDePlanCreadoResponseSchema,
  PedidoDePlanRespondidoResponseSchema,
  PedidosDePlanResponseSchema,
  PlanCompartidoResponseSchema,
  ResumenesCompartidosEstadoResponseSchema,
  ResumenesParaElProfesionalResponseSchema,
  VERSION_VIGENTE,
  esNovedadImportante,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion, cuerpoDeCierre } from './soporte-api';
import { activar, circuitoConPlanActivo, circuitoListoParaPlanificar, clavesProhibidas, crearBorrador, registrarComida } from './soporte-nutricion';
import { circuitoConPlanDeEntrenamientoActivo, circuitoDeEntrenamiento } from './soporte-entrenamiento';
import { a3Vigente, finalizar, pausar, prepararProfesional, reanudar, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const TEXTO = VERSION_VIGENTE.RESUMENES_COMPARTIDOS.id;
type Area = 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA';
type Nivel = 'SUMMARY' | 'SUMMARY_AND_PLAN';

/** Las nueve operaciones con la sesión de un actor; las escrituras llevan una Idempotency-Key nueva salvo que se pase una. */
function res(token: string) {
  const s = conSesion(app, token);
  return {
    mios: () => s.get('/api/v1/me/summary-sharing'),
    compartir: (cuerpo: unknown, clave?: string) => s.put('/api/v1/me/summary-sharing', clave).send(cuerpo as object),
    retirar: (cuerpo: unknown, clave?: string) => s.post('/api/v1/me/summary-sharing/withdrawal', clave).send(cuerpo as object),
    otras: (adviseeId: string) => s.get(`/api/v1/advisees/${adviseeId}/shared-summaries`),
    plan: (adviseeId: string, area: string) => s.get(`/api/v1/advisees/${adviseeId}/shared-summaries/${area}/plan`),
    salientes: (adviseeId: string) => s.get(`/api/v1/advisees/${adviseeId}/shared-summaries/outgoing`),
    pedir: (adviseeId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/advisees/${adviseeId}/shared-summaries/access-requests`, clave).send(cuerpo as object),
    pendientes: () => s.get('/api/v1/me/summary-sharing/access-requests'),
    responder: (pedidoId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/me/summary-sharing/access-requests/${pedidoId}/answer`, clave).send(cuerpo as object),
  };
}
const mios = async (p: Parte) => MisResumenesCompartidosResponseSchema.parse((await res(p.token).mios().expect(200)).body).data;
const otrasDe = async (pro: Parte, ase: Parte) => ResumenesParaElProfesionalResponseSchema.parse((await res(pro.token).otras(ase.id).expect(200)).body).data;
const pendientesDe = async (ase: Parte) => PedidosDePlanResponseSchema.parse((await res(ase.token).pendientes().expect(200)).body).data;
const permiso = (pro: Parte, area: Area, level: Nivel) => ({ professionalId: pro.id, area, level });
/** API-RES-02 con la última versión que la persona ve, y el status que se espera. */
async function compartir(ase: Parte, grants: unknown[], status: number, textVersionId = TEXTO) {
  const yo = await mios(ase);
  return res(ase.token).compartir({ expectedVersion: yo.sharing.version, textVersionId, grants }).expect(status);
}
const novedadesDe = async (ase: Parte) =>
  (await conSesion(app, ase.token).get('/api/v1/me/news?limit=30').expect(200)).body.data as { kind: string; title: string; body: string; source: { identityId: string } | null; open: { view: string; referenceId: string | null } }[];
const componente = (pro: Parte, ase: Parte, alcance: Area) => prisma.alcanceDeVinculo.findFirstOrThrow({ where: { alcance, vinculo: { profesionalId: pro.id, asesoradoId: ase.id } }, orderBy: { momentoDeRegistro: 'desc' } });
const revocarA3 = async (ase: Parte) => conSesion(app, ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, ase.token)}/revoke`).send({}).expect(200);

/** Una persona con su nutricionista (con un plan activado), su entrenador y su antropometrista, con sus vínculos y su B2. */
async function equipo(etiqueta: string) {
  const c = await circuitoConPlanActivo(app, `res-${etiqueta}-${++contador}`);
  const ent = await prepararProfesional(app, `ent-res-${etiqueta}-${contador}`, ['ENTRENAMIENTO']);
  const ant = await prepararProfesional(app, `ant-res-${etiqueta}-${contador}`, ['ANTROPOMETRIA']);
  const vEnt = await vinculoCompleto(app, ent, c.ase, 'ENTRENAMIENTO');
  const vAnt = await vinculoCompleto(app, ant, c.ase, 'ANTROPOMETRIA');
  return { ...c, nut: c.pro, ent, ant, vEnt, vAnt };
}

describe('TEST-TAG-037 · El plan del otro, solo con el permiso de la persona (TB-52 y TB-55)', () => {
  it('sin autorización, con «resumen» o como ajeno, el 404 de lo inexistente; con «resumen y plan», el plan que ve la persona, sin borradores ni revisiones; cada lectura la ve la persona y quien lleva el área sabe con quién se comparte', async () => {
    const e = await equipo('plan');
    const inexistente = await res(e.ent.token).plan(randomUUID(), 'NUTRICION').expect(404);
    // 1. Sin autorización: API-RES-04 dice quién lleva Nutrición (lo de API-CRD-01-LISTA) y nada compartido.
    const antes = await otrasDe(e.ent, e.ase);
    expect(antes.scopes).toEqual(['ENTRENAMIENTO']);
    expect(antes.areas.map((a) => a.area)).toEqual(['NUTRICION', 'ANTROPOMETRIA']);
    expect(antes.areas[0]).toEqual({ area: 'NUTRICION', professional: { identityId: e.nut.id, displayName: expect.any(String) }, shared: null, accessRequest: null, canRequestPlan: true, canRequestPlanFrom: null });
    expect(antes.areas[1]).toMatchObject({ area: 'ANTROPOMETRIA', professional: { identityId: e.ant.id }, shared: null, canRequestPlan: false });
    expect((await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    const ajeno = await prepararProfesional(app, `ajeno-res-${contador}`, ['ENTRENAMIENTO']);
    expect((await res(ajeno.token).plan(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    await res(ajeno.token).otras(e.ase.id).expect(404);

    // 2. Con «resumen», el plan no se abre.
    await compartir(e.ase, [permiso(e.ent, 'NUTRICION', 'SUMMARY')], 200);
    expect((await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    // 3. Subir de nivel pide el texto vigente: con otro, 409 y nada cambia.
    const viejo = await compartir(e.ase, [permiso(e.ent, 'NUTRICION', 'SUMMARY_AND_PLAN')], 409, VERSION_VIGENTE.HABITOS_COMPARTIDOS.id);
    expect(viejo.body.error.code).toBe('CONSENT_VERSION_STALE');
    expect((await mios(e.ase)).sharing.version).toBe('v1');
    const subida = ResumenesCompartidosEstadoResponseSchema.parse((await compartir(e.ase, [permiso(e.ent, 'NUTRICION', 'SUMMARY_AND_PLAN')], 200)).body).data;
    expect(subida.sharing).toMatchObject({ status: 'ACTIVE', version: 'v2', acceptedTextVersionId: TEXTO });
    const delEntrenador = subida.professionals.find((p) => p.professional.identityId === e.ent.id)!;
    expect(delEntrenador).toMatchObject({ link: 'ACTIVE', shareableAreas: ['NUTRICION', 'ANTROPOMETRIA'], shares: [{ area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' }] });

    // Lo que no viaja: un borrador sucesor y una revisión registrada. Y una comida registrada, para lo avanzado.
    const sucesor = (await conSesion(app, e.nut.token).post(`/api/v1/advisees/${e.ase.id}/nutrition/plans`).send({ objectiveVersionId: e.objectiveVersionId, basedOnPlanId: e.planId }).expect(201)).body.data;
    await registrarComida(app, e.ase, e.planId, e.dia).expect(201);

    // 4. El plan, como lo ve la persona (API-NUT-09 de la titular): la misma lectura, la versión activada vigente.
    const leido = PlanCompartidoResponseSchema.parse((await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(200)).body).data!;
    const propio = (await conSesion(app, e.ase.token).get(`/api/v1/nutrition/plans/${e.planId}`).expect(200)).body.data;
    expect(leido.plan).toEqual(propio);
    expect(leido).toMatchObject({ area: 'NUTRICION', author: { identityId: e.nut.id }, level: 'SUMMARY_AND_PLAN', sharedSince: delEntrenador.shares[0]!.since, plan: { planId: e.planId, state: 'ACTIVATED' } });
    expect(leido.objective).toMatchObject({ isEffective: true });
    expect(leido.progress.unit).toBe('MEAL_RECORDS');
    expect(leido.progress.plannedPerWeek).toBeNull();
    expect(leido.progress.weeks.reduce((n, s) => n + s.recorded, 0)).toBe(1);
    expect(JSON.stringify(leido)).not.toContain(sucesor.planId as string);
    // Lo nuevo de la respuesta no califica (el plan y el objetivo tienen la forma de siempre).
    expect(clavesProhibidas({ ...leido, plan: null, objective: null })).toEqual([]);
    expect(JSON.stringify(leido.progress)).not.toMatch(/%|percent/);

    // Quien lleva el área sabe con quién se comparte (TA-93); la persona ve quién lo miró, una vez por lectura.
    const salientes = LoQueSeComparteDeMiAreaResponseSchema.parse((await res(e.nut.token).salientes(e.ase.id).expect(200)).body).data;
    expect(salientes).toEqual([{ area: 'NUTRICION', professional: { identityId: e.ent.id, displayName: expect.any(String) }, level: 'SUMMARY_AND_PLAN', since: delEntrenador.shares[0]!.since }]);
    expect(LoQueSeComparteDeMiAreaResponseSchema.parse((await res(e.ant.token).salientes(e.ase.id).expect(200)).body).data).toEqual([]);
    const accesos = (await mios(e.ase)).accesses;
    expect(accesos).toHaveLength(1);
    expect(accesos[0]).toMatchObject({ professional: { identityId: e.ent.id }, area: 'NUTRICION' });
    expect((await otrasDe(e.ent, e.ase)).areas[0]).toMatchObject({ shared: { level: 'SUMMARY_AND_PLAN' }, canRequestPlan: false });

    // 8. La base: solo se agrega; Antropometría no tiene plan; lo de otras áreas sale del componente de otro, en esa área.
    const vigente = await prisma.autorizacionDeResumenes.findFirstOrThrow({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'desc' } });
    await expect(prisma.$executeRawUnsafe(`UPDATE autorizacion_de_resumenes SET estado = 'RETIRADA' WHERE id = '${vigente.id}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM destinatario_de_resumenes WHERE autorizacion_id = '${vigente.id}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe('TRUNCATE destinatario_de_resumenes')).rejects.toThrow(/append-only/);
    const [avEnt, avAnt, avNut] = await Promise.all([componente(e.ent, e.ase, 'ENTRENAMIENTO'), componente(e.ant, e.ase, 'ANTROPOMETRIA'), componente(e.nut, e.ase, 'NUTRICION')]);
    const renglon = (origen: string, area: Area, nivel: string) =>
      prisma.$executeRawUnsafe(
        `INSERT INTO destinatario_de_resumenes (autorizacion_id, alcance_de_vinculo_id, origen_id, profesional_id, area, nivel, nivel_desde) VALUES ('${vigente.id}', '${avEnt.id}', '${origen}', '${e.ent.id}', '${area}', '${nivel}', now())`,
      );
    await expect(renglon(avAnt.id, 'ANTROPOMETRIA', 'RESUMEN_Y_PLAN')).rejects.toThrow(/antropometria_sin_plan/);
    await expect(renglon(avNut.id, 'ENTRENAMIENTO', 'RESUMEN')).rejects.toThrow(/componente de otro profesional/);

    // 5. Bajar a «resumen» corta en el momento; subir otra vez lo abre; retirar todo corta.
    await compartir(e.ase, [permiso(e.ent, 'NUTRICION', 'SUMMARY')], 200);
    expect((await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    await compartir(e.ase, [permiso(e.ent, 'NUTRICION', 'SUMMARY_AND_PLAN')], 200);
    await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(200);

    // 6. El vínculo del que lee: en pausa corta, reanudado vuelve, terminado corta.
    await pausar(app, e.ase.token, e.vEnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vEnt.vinculoId)).expect(200);
    expect((await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    await reanudar(app, e.ase.token, e.vEnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vEnt.vinculoId)).expect(200);
    await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(200);
    const version = (await mios(e.ase)).sharing.version as string;
    await res(e.ase.token).retirar({ expectedVersion: version }).expect(200);
    expect((await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    await compartir(e.ase, [permiso(e.ent, 'NUTRICION', 'SUMMARY_AND_PLAN')], 200);
    await finalizar(app, e.ase.token, e.vEnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vEnt.vinculoId)).expect(200);
    await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404);
    // Lo suyo deja de valer sin escribir nada: la persona ya no lo ve compartido con él.
    expect((await mios(e.ase)).professionals.find((p) => p.professional.identityId === e.ent.id)).toBeUndefined();

    // 7. Antropometría no tiene plan; un área que no existe, tampoco.
    const sinPlan = await compartir(e.ase, [permiso(e.ant, 'ANTROPOMETRIA', 'SUMMARY_AND_PLAN')], 400);
    expect(sinPlan.body.error.code).toBe('INVALID_REQUEST');
    await res(e.ant.token).plan(e.ase.id, 'ANTROPOMETRIA').expect(404);
    await res(e.ant.token).plan(e.ase.id, 'OTRA').expect(404);
  });

  it('el plan de Entrenamiento, para la nutricionista: la lectura de la titular, con las sesiones por semana', async () => {
    const t = await circuitoConPlanDeEntrenamientoActivo(app, `res-trn-${++contador}`);
    const nut = await prepararProfesional(app, `nut-res-trn-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, nut, t.ase, 'NUTRICION');
    await compartir(t.ase, [permiso(nut, 'ENTRENAMIENTO', 'SUMMARY_AND_PLAN')], 200);
    const leido = PlanCompartidoResponseSchema.parse((await res(nut.token).plan(t.ase.id, 'ENTRENAMIENTO').expect(200)).body).data!;
    const propio = (await conSesion(app, t.ase.token).get(`/api/v1/training/plans/${t.planId}`).expect(200)).body.data;
    expect(leido.plan).toEqual(propio);
    expect(leido).toMatchObject({ area: 'ENTRENAMIENTO', author: { identityId: t.pro.id }, plan: { planId: t.planId, state: 'ACTIVATED', isEffective: true }, progress: { unit: 'SESSIONS', plannedPerWeek: null } });
    expect(leido.progress.weeks.length).toBeGreaterThanOrEqual(1);
    expect(leido.progress.weeks.every((s) => s.recorded === 0)).toBe(true);
    // El entrenador sabe que la nutricionista lo ve; la persona, que lo miró.
    expect((await res(t.pro.token).salientes(t.ase.id).expect(200)).body.data).toMatchObject([{ area: 'ENTRENAMIENTO', professional: { identityId: nut.id }, level: 'SUMMARY_AND_PLAN' }]);
    expect((await mios(t.ase)).accesses[0]).toMatchObject({ professional: { identityId: nut.id }, area: 'ENTRENAMIENTO' });
  });

  it('ampliar pide el A3; bajar y retirar, no; sin el A3, lo propio es 403; un profesional sin otro en el área no recibe nada; cerrar la cuenta la retira', async () => {
    const e = await equipo('a3');
    await compartir(e.ase, [permiso(e.ent, 'NUTRICION', 'SUMMARY_AND_PLAN')], 200);
    await revocarA3(e.ase);
    expect((await res(e.ase.token).mios().expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    expect((await res(e.ase.token).pendientes().expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    const ampliar = await res(e.ase.token).compartir({ expectedVersion: 'v1', textVersionId: TEXTO, grants: [permiso(e.ent, 'NUTRICION', 'SUMMARY_AND_PLAN'), permiso(e.ant, 'NUTRICION', 'SUMMARY')] }).expect(403);
    expect(ampliar.body.error.code).toBe('ACTION_FORBIDDEN');
    await res(e.ase.token).compartir({ expectedVersion: 'v1', textVersionId: TEXTO, grants: [permiso(e.ent, 'NUTRICION', 'SUMMARY')] }).expect(200);
    await res(e.ase.token).retirar({ expectedVersion: 'v2' }).expect(200);
    expect(await prisma.autorizacionDeResumenes.findMany({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'asc' }, select: { estado: true } })).toEqual([{ estado: 'ACTIVA' }, { estado: 'ACTIVA' }, { estado: 'RETIRADA' }]);

    // Lo que no se puede dar: un ajeno, un área que nadie más lleva, un área propia.
    const f = await equipo('a3-otro');
    const ajeno = await prepararProfesional(app, `ajeno-a3-${contador}`, ['NUTRICION']);
    const r = await compartir(f.ase, [permiso(ajeno, 'ENTRENAMIENTO', 'SUMMARY'), permiso(f.ent, 'ENTRENAMIENTO', 'SUMMARY')], 422);
    expect(r.body.error).toMatchObject({ code: 'SUMMARY_RECIPIENT_NOT_AVAILABLE', details: { issues: [{ code: 'SUMMARY_RECIPIENT_NOT_AVAILABLE', path: 'grants[0]' }, { code: 'SUMMARY_AREA_NOT_SHAREABLE', path: 'grants[1]' }] } });
    expect(await prisma.autorizacionDeResumenes.count({ where: { asesoradoId: f.ase.id } })).toBe(0);

    // Cerrar la cuenta la retira.
    await compartir(f.ase, [permiso(f.ent, 'NUTRICION', 'SUMMARY_AND_PLAN')], 200);
    await conSesion(app, f.ase.token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(201);
    expect((await prisma.autorizacionDeResumenes.findFirstOrThrow({ where: { asesoradoId: f.ase.id }, orderBy: { version: 'desc' } })).estado).toBe('RETIRADA');
  });
});

describe('TEST-TAG-039 · Lo que el panel lee de la API no depende de que haya un plan (TB-54, la parte de la API)', () => {
  it('API-RES-04 es la misma antes y después de activar un plan; sin nadie en el área, no hay a quién pedirle', async () => {
    const c = await circuitoListoParaPlanificar(app, `res-panel-${++contador}`);
    const ent = await prepararProfesional(app, `ent-res-panel-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, ent, c.ase, 'ENTRENAMIENTO');
    const sinPlan = await otrasDe(ent, c.ase);
    expect(sinPlan.areas[0]).toMatchObject({ area: 'NUTRICION', professional: { identityId: c.pro.id }, shared: null, canRequestPlan: true });
    const b = await crearBorrador(app, c);
    await activar(app, c.pro, b.planId, b.version).expect(200);
    expect(await otrasDe(ent, c.ase)).toEqual(sinPlan);

    const solo = await circuitoDeEntrenamiento(app, `res-panel-solo-${contador}`);
    expect((await otrasDe(solo.pro, solo.ase)).areas).toEqual([
      { area: 'NUTRICION', professional: null, shared: null, accessRequest: null, canRequestPlan: false, canRequestPlanFrom: null },
      { area: 'ANTROPOMETRIA', professional: null, shared: null, accessRequest: null, canRequestPlan: false, canRequestPlanFrom: null },
    ]);
  });
});

describe('TEST-TAG-040 · Pedir no concede nada (TB-56)', () => {
  it('le llega a la persona como novedad importante, sin nada del plan; uno por vez y 7 días; «No, por ahora» no comparte; «Sí» lo abre; compartir desde «Quién ve qué» acepta el que esperaba', async () => {
    const e = await equipo('pedir');
    const pedido = { scope: 'ENTRENAMIENTO', area: 'NUTRICION' };
    const clave = randomUUID();
    const creado = PedidoDePlanCreadoResponseSchema.parse((await res(e.ent.token).pedir(e.ase.id, pedido, clave).expect(201)).body).data;
    expect(creado).toMatchObject({ scope: 'ENTRENAMIENTO', area: 'NUTRICION', status: 'PENDING' });
    expect((await res(e.ent.token).pedir(e.ase.id, pedido, clave).expect(201)).body.data).toEqual(creado);
    const pronto = await res(e.ent.token).pedir(e.ase.id, pedido).expect(422);
    expect(pronto.body.error.code).toBe('PLAN_ACCESS_REQUEST_TOO_SOON');
    expect(pronto.body.error.details.availableFrom).toBe(new Date(Date.parse(creado.requestedAt) + 7 * 86_400_000).toISOString());
    await res(e.ent.token).pedir(e.ase.id, { scope: 'NUTRICION', area: 'ENTRENAMIENTO' }).expect(404);
    await res(e.ent.token).pedir(randomUUID(), pedido).expect(404);
    // Antropometría no tiene plan (400); desde un área para el plan de esa misma, tampoco.
    await res(e.ent.token).pedir(e.ase.id, { scope: 'ENTRENAMIENTO', area: 'ANTROPOMETRIA' }).expect(400);

    // 2. Pedir no abre nada.
    await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404);
    expect((await otrasDe(e.ent, e.ase)).areas[0]).toMatchObject({ accessRequest: { accessRequestId: creado.accessRequestId, status: 'PENDING' }, canRequestPlan: false, canRequestPlanFrom: pronto.body.error.details.availableFrom });

    // 3. La novedad: quién, desde qué área, qué plan y que es su decisión. Importante, sin nada del plan.
    const novedad = (await novedadesDe(e.ase)).find((n) => n.kind === 'PLAN_ACCESS_REQUESTED')!;
    expect(novedad).toMatchObject({ title: 'Te piden ver tu plan', source: { identityId: e.ent.id }, open: { view: 'NEWS', referenceId: null } });
    expect(novedad.body).toMatch(/, de Entrenamiento, te pide ver tu plan de Nutrición, completo y de solo lectura: no lo puede cambiar\. Es tu decisión/);
    expect(esNovedadImportante(novedad.kind)).toBe(true);
    expect(JSON.stringify(novedad)).not.toContain(e.planId);
    expect(await pendientesDe(e.ase)).toEqual([
      { accessRequestId: creado.accessRequestId, version: 'v1', professional: { identityId: e.ent.id, displayName: expect.any(String) }, scope: { code: 'ENTRENAMIENTO', label: 'Entrenamiento' }, area: 'NUTRICION', requestedAt: creado.requestedAt },
    ]);

    // 4. «No, por ahora»: no comparte nada; el profesional solo sabe que ya no espera.
    const no = PedidoDePlanRespondidoResponseSchema.parse((await res(e.ase.token).responder(creado.accessRequestId, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(200)).body).data;
    expect(no.answer).toBe('NOT_NOW');
    expect(await prisma.autorizacionDeResumenes.count({ where: { asesoradoId: e.ase.id } })).toBe(0);
    await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404);
    expect((await otrasDe(e.ent, e.ase)).areas[0]!.accessRequest).toMatchObject({ status: 'ANSWERED' });
    expect((await res(e.ase.token).responder(creado.accessRequestId, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');

    // 5. Un pedido del antropometrista de hace 8 días, sin respuesta: puede pedir otra vez, y el nuevo reemplaza al viejo.
    const avAnt = await componente(e.ant, e.ase, 'ANTROPOMETRIA');
    const viejo = await prisma.pedidoDeAccesoAPlan.create({ data: { profesionalId: e.ant.id, asesoradoId: e.ase.id, alcanceDeVinculoId: avAnt.id, alcance: 'ANTROPOMETRIA', area: 'NUTRICION', pedidoEn: new Date(Date.now() - 8 * 86_400_000), procedencia: {} } });
    const nuevo = PedidoDePlanCreadoResponseSchema.parse((await res(e.ant.token).pedir(e.ase.id, { scope: 'ANTROPOMETRIA', area: 'NUTRICION' }).expect(201)).body).data;
    expect((await prisma.pedidoDeAccesoAPlan.findUniqueOrThrow({ where: { id: viejo.id } })).estado).toBe('REEMPLAZADO');
    const si = (pedidoId: string, textVersionId = TEXTO) => res(e.ase.token).responder(pedidoId, { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId } });
    expect((await si(nuevo.accessRequestId, VERSION_VIGENTE.HABITOS_COMPARTIDOS.id).expect(409)).body.error.code).toBe('CONSENT_VERSION_STALE');
    expect(PedidoDePlanRespondidoResponseSchema.parse((await si(nuevo.accessRequestId).expect(200)).body).data.answer).toBe('SHARE');
    await res(e.ant.token).plan(e.ase.id, 'NUTRICION').expect(200);
    // Solo eso: el entrenador, que dijo que no, sigue sin verlo.
    await res(e.ent.token).plan(e.ase.id, 'NUTRICION').expect(404);
    expect((await mios(e.ase)).professionals.find((p) => p.professional.identityId === e.ant.id)!.shares).toMatchObject([{ area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' }]);

    // 6. Compartir desde «Quién ve qué» acepta el pedido que esperaba (aquí, uno escrito en la base).
    const avEnt = await componente(e.ent, e.ase, 'ENTRENAMIENTO');
    const otraVez = await prisma.pedidoDeAccesoAPlan.create({ data: { profesionalId: e.ent.id, asesoradoId: e.ase.id, alcanceDeVinculoId: avEnt.id, alcance: 'ENTRENAMIENTO', area: 'NUTRICION', pedidoEn: new Date(), procedencia: {} } });
    await compartir(e.ase, [permiso(e.ant, 'NUTRICION', 'SUMMARY_AND_PLAN'), permiso(e.ent, 'NUTRICION', 'SUMMARY_AND_PLAN')], 200);
    expect((await prisma.pedidoDeAccesoAPlan.findUniqueOrThrow({ where: { id: otraVez.id } })).estado).toBe('ACEPTADO');
    expect(await pendientesDe(e.ase)).toEqual([]);
    expect((await res(e.ent.token).pedir(e.ase.id, pedido).expect(422)).body.error.code).toBe('PLAN_ALREADY_SHARED');
    expect(await prisma.eventoDeFormulario.findMany({ where: { asesoradoId: e.ase.id, recursoTipo: 'PedidoDeAccesoAPlan', profesionalId: e.ent.id }, orderBy: { secuencia: 'asc' }, select: { tipo: true } })).toEqual([
      { tipo: 'PedidoDeAccesoAPlanHecho' },
      { tipo: 'PedidoDeAccesoAPlanNoPorAhora' },
      { tipo: 'PedidoDeAccesoAPlanAceptado' },
    ]);

    // 8. La base: uno pendiente por profesional, persona y área; resuelto, no se reabre; no se borra.
    const dos = () => prisma.pedidoDeAccesoAPlan.create({ data: { profesionalId: e.ant.id, asesoradoId: e.ase.id, alcanceDeVinculoId: avAnt.id, alcance: 'ANTROPOMETRIA', area: 'ENTRENAMIENTO', pedidoEn: new Date(), procedencia: {} } });
    await dos();
    await expect(dos()).rejects.toThrow();
    await expect(prisma.$executeRawUnsafe(`UPDATE pedido_de_acceso_a_plan SET estado = 'PENDIENTE', resuelto_en = NULL WHERE id = '${viejo.id}'`)).rejects.toThrow(/se resuelve una sola vez/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM pedido_de_acceso_a_plan WHERE id = '${viejo.id}'`)).rejects.toThrow(/append-only/);
    // De otra área y con plan.
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO pedido_de_acceso_a_plan (profesional_id, asesorado_id, alcance_de_vinculo_id, alcance, area, pedido_en, procedencia) VALUES ('${e.ent.id}', '${e.ase.id}', '${avEnt.id}', 'ENTRENAMIENTO', 'ENTRENAMIENTO', now(), '{}'::jsonb)`,
      ),
    ).rejects.toThrow(/de_otra_area_con_plan/);
  });

  it('con el vínculo del que pide en pausa, no se pide ni se muestra; terminado, no se muestra y «Sí» es 422', async () => {
    const f = await equipo('pausa');
    const pedido = { scope: 'ENTRENAMIENTO', area: 'NUTRICION' };
    const creado = PedidoDePlanCreadoResponseSchema.parse((await res(f.ent.token).pedir(f.ase.id, pedido).expect(201)).body).data;
    await pausar(app, f.ase.token, f.vEnt.vinculoId, await versionDeVinculo(app, f.ase.token, f.vEnt.vinculoId)).expect(200);
    expect(await pendientesDe(f.ase)).toEqual([]);
    await res(f.ent.token).pedir(f.ase.id, pedido).expect(404);
    await reanudar(app, f.ase.token, f.vEnt.vinculoId, await versionDeVinculo(app, f.ase.token, f.vEnt.vinculoId)).expect(200);
    expect((await pendientesDe(f.ase)).map((p) => p.accessRequestId)).toEqual([creado.accessRequestId]);
    await finalizar(app, f.ase.token, f.vEnt.vinculoId, await versionDeVinculo(app, f.ase.token, f.vEnt.vinculoId)).expect(200);
    expect(await pendientesDe(f.ase)).toEqual([]);
    const r = await res(f.ase.token).responder(creado.accessRequestId, { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId: TEXTO } }).expect(422);
    expect(r.body.error.code).toBe('SUMMARY_RECIPIENT_NOT_AVAILABLE');
  });
});
