/**
 * DL-196 (punto 5; Dirección, 19/11 y 23/11): la versión de la app ya no traba ni retiene nada en Entrenamiento, por la
 * API real contra PostgreSQL (`packages/domain/src/compatibilidad-de-clientes.ts`;
 * `apps/api/src/entrenamiento/compatibilidad-de-clientes.ts`).
 *
 * Antes (DL-122, precierre del 2026-10-06; DL-178), un plan con objetivos distintos por serie o con series de calentamiento
 * no se activaba mientras su titular no hubiera usado una APK que lo declarara (409 CLIENT_CAPABILITY_REQUIRED), y a un
 * pedido sin la capacidad «Hoy» y el período decían que no estaba disponible y el detalle y abrir la sesión eran un 404.
 * Ahora todos usan la última APK: el plan se activa aunque el titular nunca haya declarado nada y se le entrega a cualquier
 * pedido. Lo que declara el cliente solo moldea la forma (a quien no declara `training-set-kinds-1`, sin `setKind`).
 *
 * «Piernas A» sale del paquete de Dirección (`sesion_demo.json`, con `soporte-por-serie.ts`); el plan sin objetivos por
 * serie es el de siempre (`estructuraDeEntrenamiento`).
 */
import type { INestApplication } from '@nestjs/common';
import { PlanConObjetivosResponseSchema, SesionParaRegistrarResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './soporte';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento } from './soporte-entrenamiento';
import {
  abrirBorrador,
  activar,
  borradorDeLaDemo,
  conLaApk,
  ejerciciosDeLaDemo,
  estructuraDeLaDemo,
  ocurrenciaDeHoy,
  registrarYConfirmar,
  registroDeLaDemo,
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

/** La API ya no registra lo que declara el cliente: la tabla queda en desuso. */
const capacidadesRegistradas = (identidadId: string) => prisma.capacidadDeClienteDeclarada.count({ where: { identidadId } });
/** Los rechazos auditados por la versión de la app (lo que antes dejaban la activación y la entrega retenida). */
const retenciones = async (actorId: string): Promise<string[]> =>
  (await prisma.registroDeAuditoria.findMany({ where: { actorId, resultado: 'RECHAZO', motivo: 'CLIENT_CAPABILITY_REQUIRED' } })).map((f) => `${f.operacion} ${f.recursoTipo ?? '-'} ${f.recursoId ?? '-'}`).sort();

/** «Piernas A», del paquete, activada. */
async function piernasActivada(nombre: string): Promise<PlanDeLaDemo> {
  const plan = await borradorDeLaDemo(app, etiqueta(nombre));
  await activar(app, plan).expect(200);
  return plan;
}

// ─── Un plan sin objetivos por serie ──────────────────────────────────────────────────────────────

describe('un plan sin objetivos por serie sigue como siempre', () => {
  it('el titular sin la cabecera ve «Hoy», el período, el detalle y abre la sesión como siempre, en la forma de la APK instalada; nada se registra', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('compat-sin-series'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);

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

    // La sesión para registrar (API-SER-02), pedida con la capacidad: sale igual, y la API ya no la registra.
    SesionParaRegistrarResponseSchema.parse((await conLaApk(app, c.ase.token).get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body);
    expect(await capacidadesRegistradas(c.ase.id)).toBe(0);
    expect(await retenciones(c.ase.id)).toEqual([]);
  });
});

// ─── La activación y la entrega, sin ninguna declaración ─────────────────────────────────────────

describe('DL-196 · la versión de la app ya no traba la activación ni retiene la entrega', () => {
  it('«Piernas A» con calentamiento y objetivos por serie se activa aunque el titular nunca haya declarado nada; «Hoy», el período, la agenda, el detalle, la sesión y abrir el borrador le llegan a un pedido sin la cabecera', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('compat-sin-trabas'));
    const ejercicios = await ejerciciosDeLaDemo(app, c.pro);
    // «Piernas A» tiene objetivos distintos por serie; se le suma una serie de calentamiento arriba del primer ejercicio.
    const estructura = estructuraDeLaDemo(ejercicios) as { blocks: { sessions: { prescriptions: { sets: Record<string, unknown>[] }[] }[] }[] };
    estructura.blocks[0]!.sessions[0]!.prescriptions[0]!.sets.unshift({ repetitions: { value: 12 }, setKind: 'WARM_UP' });
    const creado = (await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructura }).expect(201)).body
      .data as { planId: string; version: string };

    // API-SER-01, con su esquema vigente: ya no dice si el plan le llega a la app de la persona.
    const detalle = PlanConObjetivosResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${creado.planId}/detail`).expect(200)).body).data;
    expect(Object.keys(detalle)).not.toContain('setTargetsDelivery');
    expect(Object.keys(detalle)).not.toContain('setKindsDelivery');

    // El titular nunca abrió la app ni declaró nada: se activa igual (antes, 409 CLIENT_CAPABILITY_REQUIRED).
    expect(await capacidadesRegistradas(c.ase.id)).toBe(0);
    expect((await activarPlanDeEntrenamiento(app, c.pro, creado.planId, creado.version).expect(200)).body.data).toMatchObject({ planId: creado.planId, state: 'ACTIVATED' });
    expect(await prisma.instantaneaDePlanDeEntrenamiento.count({ where: { versionDePlanId: creado.planId } })).toBe(1);

    let ocurrencia = '';
    for (const [cliente, pedido] of [
      ['sin la cabecera', conSesion(app, c.ase.token)],
      ['solo con capacidades desconocidas', conLaApk(app, c.ase.token, SOLO_DESCONOCIDAS)],
    ] as const) {
      const hoy = (await pedido.get('/api/v1/me/training/today').expect(200)).body.data;
      expect([cliente, hoy]).toMatchObject([cliente, { planState: 'AVAILABLE', activePlan: { planId: creado.planId } }]);
      ocurrencia = (hoy.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((o) => o.plannedSession.sessionId === SESION_ID)!.occurrenceId;
      const fecha = hoy.date as string;
      const periodo = (await pedido.get(`/api/v1/me/training/occurrences?periodStart=${fecha}&periodEnd=${fecha}`).expect(200)).body.data;
      expect([cliente, periodo.planState, (periodo.occurrences as { occurrenceId: string }[]).map((o) => o.occurrenceId)]).toEqual([cliente, 'AVAILABLE', expect.arrayContaining([ocurrencia])]);
      expect([cliente, (await pedido.get('/api/v1/me/training/agenda').expect(200)).body.data]).toMatchObject([cliente, { planState: 'AVAILABLE', planId: creado.planId }]);
      const elPlan = (await pedido.get(`/api/v1/training/plans/${creado.planId}`).expect(200)).body;
      expect([cliente, elPlan.data]).toMatchObject([cliente, { planId: creado.planId, state: 'ACTIVATED' }]);
      // Sin `training-set-kinds-1`, las series salen sin `setKind`, como siempre: la capacidad solo moldea la forma.
      expect([cliente, JSON.stringify(elPlan).includes('setKind')]).toEqual([cliente, false]);
      const sesion = SesionParaRegistrarResponseSchema.parse((await pedido.get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body).data.session;
      expect([cliente, sesion.sessionId]).toEqual([cliente, SESION_ID]);
    }
    expect((await conSesion(app, c.ase.token).put(`/api/v1/training/occurrences/${ocurrencia}/execution-draft`).send({}).expect(201)).body.data).toMatchObject({ occurrenceId: ocurrencia, state: 'DRAFT' });

    // Nada se rechazó ni se registró por la versión de la app.
    expect(await retenciones(c.ase.id)).toEqual([]);
    expect(await retenciones(c.pro.id)).toEqual([]);
    expect(await capacidadesRegistradas(c.ase.id)).toBe(0);
  });
});

// ─── Lo registrado y las lecturas del profesional ───────────────────────────────────────────────

describe('lo registrado y lo que lee el profesional no dependen de lo que declara el cliente', () => {
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

    // El profesional, con la cabecera o sin ella, lee lo mismo.
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
