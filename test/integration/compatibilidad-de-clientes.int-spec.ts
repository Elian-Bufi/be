/**
 * Precierre del 2026-10-06, §2 (DL-122): qué clientes reciben un plan con objetivos por serie, por la API real contra
 * PostgreSQL (`packages/domain/src/compatibilidad-de-clientes.ts`; `apps/api/src/entrenamiento/compatibilidad-de-clientes.ts`).
 *
 * Las APK instaladas (0.13.2 y las candidatas 0.14.0) no mandan `X-BE-Capabilities` y muestran solo los objetivos generales
 * de cada prescripción; la APK que muestra los de cada serie lo declara. Un plan que los exige no se activa mientras su
 * titular no haya usado esa APK, y no se le entrega a un cliente que no los muestra. Lo que ve una APK instalada se valida
 * con su esquema congelado (`packages/domain/fixtures/respuestas-que-lee-la-apk-instalada.json`), no con el vigente.
 *
 * «Piernas A» sale del paquete de Dirección (`sesion_demo.json`, con `soporte-por-serie.ts`); el plan sin objetivos por
 * serie es el de siempre (`estructuraDeEntrenamiento`).
 */
import type { INestApplication } from '@nestjs/common';
import { COPY_COMPATIBILIDAD_DE_CLIENTES, HEADER_DE_SUPERFICIE, PlanConObjetivosResponseSchema, SesionParaRegistrarResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './soporte';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento } from './soporte-entrenamiento';
import {
  abrirBorrador,
  activar,
  borradorDeLaDemo,
  conLaApk,
  objetivoDeLaDemo,
  ocurrenciaDeHoy,
  prescripcionIdDe,
  registrarYConfirmar,
  registroDeLaDemo,
  SESION_DEMO,
  SESION_ID,
  type PlanDeLaDemo,
} from './soporte-por-serie';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

// ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * Los problemas que la APK instalada encontraría en una respuesta: su esquema congelado, leído con `fromJSONSchema` del zod
 * del dominio (el zod 4 con el que se congeló). Vacío es que lo acepta. `apps/api` no importa zod; esta prueba lo toma del
 * dominio, donde vive.
 */
interface EsquemaLeido {
  safeParse(valor: unknown): { success: boolean; error?: { issues: unknown[] } };
}
const { fromJSONSchema } = require(require.resolve('zod', { paths: [join(RAIZ, 'packages', 'domain')] })) as { fromJSONSchema: (esquema: unknown) => EsquemaLeido };
const CONGELADAS = JSON.parse(readFileSync(join(RAIZ, 'packages', 'domain', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json'), 'utf8')) as {
  operaciones: Record<string, { respuestas: Record<string, unknown> }>;
};
const esquemas = new Map<string, EsquemaLeido>();
function comoLaLeeLaApkInstalada(operacion: string, cuerpo: unknown, status = '200'): unknown[] {
  const clave = `${operacion} ${status}`;
  if (!esquemas.has(clave)) esquemas.set(clave, fromJSONSchema(CONGELADAS.operaciones[operacion]!.respuestas[status]));
  const r = esquemas.get(clave)!.safeParse(cuerpo);
  return r.success ? [] : (r.error?.issues ?? ['sin detalle']);
}

/** Capacidades que la API no conoce: un cliente futuro puede declararlas, y no le dan nada. */
const SOLO_DESCONOCIDAS = 'futura-1, otra-capacidad-2';

const capacidadesRegistradas = (identidadId: string) => prisma.capacidadDeClienteDeclarada.findMany({ where: { identidadId } });
const entregaDe = async (pro: { token: string }, planId: string) =>
  PlanConObjetivosResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/training/plans/${planId}/detail`).expect(200)).body).data.setTargetsDelivery;
/** Las retenciones auditadas de un actor, con el motivo que el cliente no ve: operación y recurso, ordenadas. */
const retenciones = async (actorId: string): Promise<string[]> =>
  (await prisma.registroDeAuditoria.findMany({ where: { actorId, resultado: 'RECHAZO', motivo: 'CLIENT_CAPABILITY_REQUIRED' } })).map((f) => `${f.operacion} ${f.recursoTipo ?? '-'} ${f.recursoId ?? '-'}`).sort();

/** «Piernas A», del paquete, activada: el titular ya usó la APK que muestra los objetivos por serie. */
async function piernasActivada(nombre: string): Promise<PlanDeLaDemo> {
  const plan = await borradorDeLaDemo(app, etiqueta(nombre));
  await activar(app, plan).expect(200);
  return plan;
}

// ─── Un plan sin objetivos por serie ──────────────────────────────────────────────────────────────

describe('DL-122 · un plan sin objetivos por serie sigue como siempre', () => {
  it('el titular sin la cabecera ve «Hoy», el período, el detalle y abre la sesión como siempre, en la forma de la APK instalada; el plan se activa sin ningún registro', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('compat-sin-series'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    expect(await entregaDe(c.pro, b.planId)).toEqual({ required: false, adviseeClientCapable: false });
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    expect(await capacidadesRegistradas(c.ase.id)).toEqual([]);

    const instalada = conSesion(app, c.ase.token);
    const hoy = (await instalada.get('/api/v1/me/training/today').expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-14', hoy)).toEqual([]);
    expect(hoy.data).toMatchObject({ planState: 'AVAILABLE', activePlan: { planId: b.planId } });
    expect((hoy.data.occurrences as { plannedSession: { sessionId: string } }[]).map((o) => o.plannedSession.sessionId)).toEqual(['ses-a', 'ses-b']);
    const fecha = hoy.data.date as string;
    const periodo = (await instalada.get(`/api/v1/me/training/occurrences?periodStart=${fecha}&periodEnd=${fecha}`).expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-14-PERIODO', periodo)).toEqual([]);
    expect(periodo.data).toMatchObject({ planState: 'AVAILABLE', occurrences: hoy.data.occurrences });
    const detalle = (await instalada.get(`/api/v1/training/plans/${b.planId}`).expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-09', detalle)).toEqual([]);
    const ocurrencia = hoy.data.occurrences[0].occurrenceId as string;
    const abierto = (await instalada.put(`/api/v1/training/occurrences/${ocurrencia}/execution-draft`).send({}).expect(201)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-15', abierto, '201')).toEqual([]);
    // Ningún pedido sin la cabecera registra nada ni retiene nada.
    expect(await capacidadesRegistradas(c.ase.id)).toEqual([]);
    expect(await retenciones(c.ase.id)).toEqual([]);

    // La sesión para registrar (API-SER-02), pedida con la capacidad, sí la registra: también es de la APK que la muestra.
    SesionParaRegistrarResponseSchema.parse((await conLaApk(app, c.ase.token).get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body);
    expect((await capacidadesRegistradas(c.ase.id)).map((r) => r.capacidad)).toEqual(['training-set-targets-1']);
    expect(await entregaDe(c.pro, b.planId)).toEqual({ required: false, adviseeClientCapable: true });
  });
});

// ─── La activación ────────────────────────────────────────────────────────────────────────────────

describe('DL-122 · un plan que exige objetivos por serie se activa cuando su titular ya usó una APK que los muestra', () => {
  it('«Piernas A» sin ese registro: 409 CLIENT_CAPABILITY_REQUIRED sin ningún cambio, también al reintentar; abierto «Hoy» con la APK capaz, queda el registro y se activa con la misma clave', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('compat-activacion'), [], { apk: false });
    const pro = conSesion(app, plan.pro.token);
    expect(await entregaDe(plan.pro, plan.planId)).toEqual({ required: true, adviseeClientCapable: false });

    const clave = claveDeIdempotencia();
    const rechazo = await activar(app, plan, plan.version, clave).expect(409);
    expect(rechazo.body.error).toEqual({ code: 'CLIENT_CAPABILITY_REQUIRED', message: COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueada });
    // Nada cambió: sigue en borrador, sin instantánea, sin vigencia y sin Proceso.
    expect((await pro.get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body.data).toMatchObject({
      state: 'DRAFT',
      version: plan.version,
      activatedAt: null,
      snapshotDigest: null,
      isEffective: false,
    });
    expect(await prisma.instantaneaDePlanDeEntrenamiento.count({ where: { versionDePlanId: plan.planId } })).toBe(0);
    expect(await prisma.planDeEntrenamiento.findFirstOrThrow({ where: { asesoradoId: plan.ase.id } })).toMatchObject({ versionEfectivaId: null });
    expect(await prisma.procesoOperativo.count({ where: { asesoradoId: plan.ase.id, alcance: 'ENTRENAMIENTO' } })).toBe(0);
    // Como los otros 409, el rechazo no queda guardado con la clave: el reintento vuelve a decidir y da lo mismo.
    expect((await activar(app, plan, plan.version, clave).expect(409)).body.error.code).toBe('CLIENT_CAPABILITY_REQUIRED');
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-TRN-12', resultado: 'RECHAZO', motivo: 'CLIENT_CAPABILITY_REQUIRED', recursoId: plan.planId } })).toBe(2);
    expect(await capacidadesRegistradas(plan.ase.id)).toEqual([]);

    // El titular abre «Hoy» con la APK que muestra los objetivos por serie (todavía no tiene un plan vigente).
    const hoy = await conLaApk(app, plan.ase.token).get('/api/v1/me/training/today').set(HEADER_DE_SUPERFICIE, 'APK').expect(200);
    expect(hoy.body.data.planState).toBe('NO_ACTIVE_PLAN');
    const [registro] = await capacidadesRegistradas(plan.ase.id);
    expect(registro).toMatchObject({ capacidad: 'training-set-targets-1', superficie: 'APK' });
    expect(registro!.momentoDeUltimaDeclaracion).toEqual(registro!.momentoDePrimeraDeclaracion);
    expect(await entregaDe(plan.pro, plan.planId)).toEqual({ required: true, adviseeClientCapable: true });
    // Con la misma clave: el 409 no se había guardado, así que ahora activa.
    expect((await activar(app, plan, plan.version, clave).expect(200)).body.data).toMatchObject({ planId: plan.planId, state: 'ACTIVATED' });

    // No escribe en cada pedido: dentro de la hora, la última vez no cambia.
    await conLaApk(app, plan.ase.token).get('/api/v1/me/training/today').expect(200);
    expect((await capacidadesRegistradas(plan.ase.id)).map((r) => r.momentoDeUltimaDeclaracion)).toEqual([registro!.momentoDeUltimaDeclaracion]);
    // Pasada la hora, la actualiza; la primera vez queda.
    await prisma.$executeRaw`
      UPDATE "capacidad_de_cliente_declarada" SET "momento_de_primera_declaracion" = now() - interval '2 hours', "momento_de_ultima_declaracion" = now() - interval '2 hours'
       WHERE "identidad_id" = ${plan.ase.id}::uuid`;
    const [antes] = await capacidadesRegistradas(plan.ase.id);
    await conLaApk(app, plan.ase.token).get('/api/v1/me/training/today').expect(200);
    const [despues] = await capacidadesRegistradas(plan.ase.id);
    expect(despues!.momentoDePrimeraDeclaracion).toEqual(antes!.momentoDePrimeraDeclaracion);
    expect(despues!.momentoDeUltimaDeclaracion.getTime()).toBeGreaterThan(antes!.momentoDeUltimaDeclaracion.getTime() + 60 * 60 * 1000);
    expect(await capacidadesRegistradas(plan.ase.id)).toHaveLength(1);
  });
});

// ─── La entrega ───────────────────────────────────────────────────────────────────────────────────

describe('DL-122 · un plan que exige objetivos por serie no se le entrega a un cliente que no los muestra', () => {
  it('con «Piernas A» activa: sin la cabecera, «Hoy» y el período no disponibles (en la forma de la APK instalada), el detalle y abrir la sesión, el 404 de lo inexistente; con la cabecera, todo, con los objetivos exactos de cada serie', async () => {
    const plan = await piernasActivada('compat-entrega');
    const ocurrencia = await ocurrenciaDeHoy(app, plan.ase);
    const fecha = (await conLaApk(app, plan.ase.token).get('/api/v1/me/training/today').expect(200)).body.data.date as string;

    for (const [cliente, instalada] of [
      ['sin la cabecera', conSesion(app, plan.ase.token)],
      ['solo con capacidades desconocidas', conLaApk(app, plan.ase.token, SOLO_DESCONOCIDAS)],
    ] as const) {
      const hoy = (await instalada.get('/api/v1/me/training/today').expect(200)).body;
      expect([cliente, hoy.data]).toEqual([cliente, { date: fecha, timeZone: 'America/Argentina/Buenos_Aires', planState: 'NOT_AVAILABLE', activePlan: null, occurrences: [] }]);
      expect([cliente, comoLaLeeLaApkInstalada('API-TRN-14', hoy)]).toEqual([cliente, []]);
      const periodo = (await instalada.get(`/api/v1/me/training/occurrences?periodStart=${fecha}&periodEnd=${fecha}`).expect(200)).body;
      expect([cliente, periodo.data]).toEqual([cliente, { period: { start: fecha, end: fecha, timeZone: 'America/Argentina/Buenos_Aires' }, planState: 'NOT_AVAILABLE', occurrences: [] }]);
      expect([cliente, comoLaLeeLaApkInstalada('API-TRN-14-PERIODO', periodo)]).toEqual([cliente, []]);
      // El detalle y abrir la sesión: el mismo 404 que un plan o una ocurrencia que no existen, y nada se crea.
      const planInexistente = (await instalada.get(`/api/v1/training/plans/${randomUUID()}`).expect(404)).body;
      expect([cliente, (await instalada.get(`/api/v1/training/plans/${plan.planId}`).expect(404)).body]).toEqual([cliente, planInexistente]);
      const ocurrenciaInexistente = (await instalada.put('/api/v1/training/occurrences/occ_no-es-una-ocurrencia/execution-draft').send({}).expect(404)).body;
      expect([cliente, (await instalada.put(`/api/v1/training/occurrences/${ocurrencia}/execution-draft`).send({}).expect(404)).body]).toEqual([cliente, ocurrenciaInexistente]);
      expect(await prisma.borradorDeEjecucionDeEntrenamiento.count({ where: { asesoradoId: plan.ase.id } })).toBe(0);
    }
    // Cada retención queda auditada con su motivo real, que el cliente no ve: sobre la versión, o sobre la ocurrencia opaca
    // (que no es un identificador de la base). Dos de cada una: los dos clientes.
    const unaVez = [
      `API-TRN-14 VersionDePlanDeEntrenamiento ${plan.planId}`,
      `API-TRN-14-PERIODO VersionDePlanDeEntrenamiento ${plan.planId}`,
      `API-TRN-09 VersionDePlanDeEntrenamiento ${plan.planId}`,
      'API-TRN-15 - -',
    ];
    const retenidas = [...unaVez, ...unaVez].sort();
    expect(await retenciones(plan.ase.id)).toEqual(retenidas);

    // Con la cabecera: «Hoy» disponible, en la misma forma de siempre; la sesión con el objetivo exacto de cada serie del
    // paquete; el detalle; y abrir la sesión.
    const apk = conLaApk(app, plan.ase.token);
    const hoy = (await apk.get('/api/v1/me/training/today').expect(200)).body;
    expect(hoy.data).toMatchObject({ planState: 'AVAILABLE', activePlan: { planId: plan.planId } });
    expect((hoy.data.occurrences as { occurrenceId: string }[]).map((o) => o.occurrenceId)).toEqual([ocurrencia]);
    expect(comoLaLeeLaApkInstalada('API-TRN-14', hoy)).toEqual([]);
    const sesion = SesionParaRegistrarResponseSchema.parse((await apk.get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body).data.session;
    expect(sesion.sessionId).toBe(SESION_ID);
    for (const e of SESION_DEMO.exercises) {
      const p = sesion.prescriptions.find((x) => x.prescriptionId === prescripcionIdDe(e))!;
      expect(p.sets.map((s) => [s.setIndex, s.target])).toEqual(e.sets.map((s) => [s.setIndex, objetivoDeLaDemo(s)]));
    }
    expect((await apk.get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body.data).toMatchObject({ planId: plan.planId, state: 'ACTIVATED' });
    expect((await apk.put(`/api/v1/training/occurrences/${ocurrencia}/execution-draft`).send({}).expect(201)).body.data).toMatchObject({ occurrenceId: ocurrencia, state: 'DRAFT' });
    // Lo que pidió con la cabecera no se retuvo.
    expect(await retenciones(plan.ase.id)).toEqual(retenidas);
  });

  it('lo registrado (TRN-16 a 20, 19-LISTA) y la lista de planes del titular no cambian sin la cabecera; las lecturas del profesional, tampoco', async () => {
    const plan = await piernasActivada('compat-historia');
    const ocurrencia = await ocurrenciaDeHoy(app, plan.ase);
    const borrador = await abrirBorrador(app, plan.ase, ocurrencia);
    // TRN-17 y 18 sin la cabecera (`registrarYConfirmar` usa la sesión sola): se guarda y se confirma como siempre.
    const { executionId } = await registrarYConfirmar(app, plan, borrador);
    const fecha = (await conLaApk(app, plan.ase.token).get('/api/v1/me/training/today').expect(200)).body.data.date as string;

    const instalada = conSesion(app, plan.ase.token);
    const apk = conLaApk(app, plan.ase.token);
    const delTitular: [string, string, string][] = [
      ['API-TRN-16', `/api/v1/training/execution-drafts/${borrador.draftId}`, '200'],
      ['API-TRN-19', `/api/v1/training/executions/${executionId}`, '200'],
      ['API-TRN-19-LISTA', `/api/v1/me/training/executions?periodStart=${fecha}&periodEnd=${fecha}`, '200'],
      ['API-TRN-08', `/api/v1/advisees/${plan.ase.id}/training/plans`, '200'],
    ];
    for (const [operacion, ruta, status] of delTitular) {
      const sin = (await instalada.get(ruta).expect(Number(status))).body;
      expect([operacion, comoLaLeeLaApkInstalada(operacion, sin, status)]).toEqual([operacion, []]);
      expect([operacion, (await apk.get(ruta).expect(Number(status))).body]).toEqual([operacion, sin]);
    }
    expect(((await instalada.get(`/api/v1/me/training/executions?periodStart=${fecha}&periodEnd=${fecha}`).expect(200)).body.data.executions as { executionId: string }[]).map((x) => x.executionId)).toEqual([executionId]);
    // Corregir lo propio sin la cabecera (TRN-20): como siempre.
    const corregida = { ...registroDeLaDemo(plan.ejercicios), sessionCondition: 'COMPLETED_WITH_DEVIATION', reason: 'Una serie quedó corta.', sessionSummary: null };
    const correccion = (await instalada.post(`/api/v1/training/executions/${executionId}/corrections`).send({ reason: 'Me equivoqué en una serie.', correction: corregida }).expect(201)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-20', correccion, '201')).toEqual([]);

    // El profesional nunca pasa por la compuerta: con la cabecera o sin ella, lee lo mismo.
    const pro = conSesion(app, plan.pro.token);
    const proConCabecera = conLaApk(app, plan.pro.token);
    for (const ruta of [
      `/api/v1/advisees/${plan.ase.id}/training/plans`,
      `/api/v1/training/plans/${plan.planId}`,
      `/api/v1/training/plans/${plan.planId}/detail`,
      `/api/v1/training/executions/${executionId}`,
      `/api/v1/advisees/${plan.ase.id}/training/review-context`,
    ]) {
      const sin = (await pro.get(ruta).expect(200)).body;
      expect([ruta, (await proConCabecera.get(ruta).expect(200)).body]).toEqual([ruta, sin]);
    }
    expect(await retenciones(plan.ase.id)).toEqual([]);
    expect(await retenciones(plan.pro.id)).toEqual([]);
  });
});
