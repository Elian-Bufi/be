/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION, decisión de Dirección del 2026-11-18) · el bloque dentro de la sesión, por la API
 * real contra PostgreSQL.
 *
 * - **Lo viejo sigue igual:** un plan sin bloques se guarda y se congela sin claves nuevas; para un cliente sin
 *   `training-session-groups-1` sale exactamente como antes, y con la capacidad la única diferencia son las dos claves.
 * - **Los bloques se guardan, se activan y se entregan:** quedan en la versión y en su instantánea en la forma canónica,
 *   salen con su orden y su tipo, y la APK que los declara los recibe en «Hoy» y en la sesión para registrar.
 * - **La APK vieja recibe lo de antes:** los mismos ejercicios, en el mismo orden, sin las dos claves; no se le retiene nada.
 * - **Lo que no se puede guardar** (bloque desconocido o no contiguo) es un 422 sin cambios; **lo que falta** (un bloque
 *   vacío, uno «En vueltas» con un solo ejercicio) lo dice la revisión e impide activar.
 * - **Las plantillas y las sesiones habituales** conservan los bloques.
 * Las reglas de forma y las partes de la sesión las prueba el dominio (`packages/domain/src/bloques-de-la-sesion.test.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import {
  CAPACIDAD_BLOQUES_DE_LA_SESION,
  CAPACIDAD_OBJETIVOS_POR_SERIE,
  CAPACIDAD_TIPOS_DE_SERIE,
  PlanConObjetivosResponseSchema,
  PlanDeEntrenamientoResponseSchema,
  PlantillaDeEntrenamientoResponseSchema,
  valorDeCapacidades,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { conLaApk } from './soporte-por-serie';

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

/** La APK nueva: la de DL-178 más los bloques. */
const LA_APK_NUEVA = valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_TIPOS_DE_SERIE, CAPACIDAD_BLOQUES_DE_LA_SESION]);
/** La APK instalada (0.29.0-candidata.1): DL-178 sí, los bloques no. */
const LA_APK_INSTALADA = valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_TIPOS_DE_SERIE]);
/** El website, que se despliega con la API: declara las dos. */
const conElWebsite = (token: string) => conLaApk(app, token, valorDeCapacidades([CAPACIDAD_TIPOS_DE_SERIE, CAPACIDAD_BLOQUES_DE_LA_SESION]));

/** Una copia profunda sin las dos claves de DL-181: lo que el interceptor le saca a quien no declara la capacidad. */
function sinLasDosClaves(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(sinLasDosClaves);
  if (valor === null || typeof valor !== 'object') return valor;
  return Object.fromEntries(Object.entries(valor).flatMap(([k, v]) => (k === 'exerciseGroups' || k === 'exerciseGroupId' ? [] : [[k, sinLasDosClaves(v)]])));
}

type Sesion = { sessionId: string; label: string; prescriptions: Record<string, unknown>[]; exerciseGroups?: Record<string, unknown>[] };
/** La estructura de siempre con la sesión A en bloques: banca y sentadilla «En vueltas» (Torso), y un bloque «Seguido». */
function conBloques(extra: { vacio?: boolean; unoSolo?: boolean } = {}): Record<string, unknown> {
  const e = estructuraDeEntrenamiento() as { blocks: { sessions: Sesion[] }[] };
  const a = e.blocks[0]!.sessions[0]!;
  a.exerciseGroups = [
    { groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 },
    ...(extra.vacio ? [{ groupId: 'g-2', label: 'Core', kind: 'SEQUENTIAL' }] : []),
  ];
  a.prescriptions[0]!.exerciseGroupId = 'g-1';
  if (!extra.unoSolo) a.prescriptions[1]!.exerciseGroupId = 'g-1';
  return e;
}

async function contenidoGuardado(planId: string): Promise<{ blocks: { sessions: Sesion[] }[] }> {
  const v = await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: planId } });
  return v.contenido as { blocks: { sessions: Sesion[] }[] };
}

describe('DL-181 · lo viejo sigue igual', () => {
  it('un plan sin bloques se guarda y se congela sin las claves nuevas; sin la capacidad sale como antes, y con ella solo suma las dos claves', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('sin-bloques'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    expect(JSON.stringify(await contenidoGuardado(b.planId))).not.toContain('exerciseGroup');
    const viejo = (await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${b.planId}`).expect(200)).body;
    expect(JSON.stringify(viejo)).not.toContain('exerciseGroup');
    PlanDeEntrenamientoResponseSchema.parse(viejo);
    const nuevo = (await conLaApk(app, c.pro.token, valorDeCapacidades([CAPACIDAD_BLOQUES_DE_LA_SESION])).get(`/api/v1/training/plans/${b.planId}`).expect(200)).body;
    expect(nuevo.data.blocks[0].sessions[0].exerciseGroups).toEqual([]);
    expect(nuevo.data.blocks[0].sessions[0].prescriptions.map((p: { exerciseGroupId: unknown }) => p.exerciseGroupId)).toEqual([null, null]);
    expect(sinLasDosClaves(nuevo)).toEqual(viejo);

    // Activado, la instantánea tampoco las tiene: su huella es la de siempre.
    const act = await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    const instantanea = await prisma.instantaneaDePlanDeEntrenamiento.findFirstOrThrow({ where: { versionDePlanId: b.planId } });
    expect(JSON.stringify(instantanea.contenido)).not.toContain('exerciseGroup');
    expect(act.body.data.snapshotDigest).toMatch(/^[0-9a-f]{64}$/);
    // La persona, con la APK instalada, recibe lo de antes en «Hoy».
    const hoy = (await conLaApk(app, c.ase.token, LA_APK_INSTALADA).get('/api/v1/me/training/today').expect(200)).body;
    expect(JSON.stringify(hoy)).not.toContain('exerciseGroup');
  });
});

describe('DL-181 · lo que no se puede guardar', () => {
  it('un bloque que la sesión no tiene, o ejercicios del bloque con otro en el medio, son un 422 sin cambios', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('mal-formado'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const desconocido = estructuraDeEntrenamiento() as { blocks: { sessions: Sesion[] }[] };
    desconocido.blocks[0]!.sessions[0]!.prescriptions[0]!.exerciseGroupId = 'g-9';
    const r1 = await conSesion(app, c.pro.token).patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: desconocido }).expect(422);
    expect(r1.body.error.code).toBe('TRAINING_PLAN_STRUCTURE_INVALID');
    expect(r1.body.error.details.issues).toContainEqual({ code: 'EXERCISE_GROUP_UNKNOWN', path: 'blocks[0].sessions[0].prescriptions[0].exerciseGroupId' });

    const conHueco = estructuraDeEntrenamiento() as { blocks: { sessions: Sesion[] }[] };
    const a = conHueco.blocks[0]!.sessions[0]!;
    a.prescriptions.push({ prescriptionId: 'rx-tercero', exerciseVersionId: CATALOGO_DE_EJERCICIOS.dominadas, sets: [{ repetitions: { value: 6 } }], intensity: null, exerciseGroupId: 'g-1' });
    a.prescriptions[0]!.exerciseGroupId = 'g-1';
    a.exerciseGroups = [{ groupId: 'g-1', label: 'Torso', kind: 'SEQUENTIAL' }];
    const r2 = await conSesion(app, c.pro.token).patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: conHueco }).expect(422);
    expect(r2.body.error.details.issues).toContainEqual({ code: 'EXERCISE_GROUP_NOT_CONTIGUOUS', path: 'blocks[0].sessions[0].prescriptions[2].exerciseGroupId' });

    // «En vueltas» sin las vueltas no es un 422: el contrato lo rechaza antes.
    const sinVueltas = conBloques() as { blocks: { sessions: Sesion[] }[] };
    delete sinVueltas.blocks[0]!.sessions[0]!.exerciseGroups![0]!.rounds;
    await conSesion(app, c.pro.token).patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: sinVueltas }).expect(400);
    expect(JSON.stringify(await contenidoGuardado(b.planId))).not.toContain('exerciseGroup');
  });
});

describe('DL-181 · un plan con bloques', () => {
  it('se guarda en la forma canónica; la revisión dice lo que falta; se activa, queda en la instantánea y se entrega a la APK nueva, y la vieja recibe lo de antes', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('con-bloques'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const pro = conElWebsite(c.pro.token);

    // Con un bloque vacío y uno «En vueltas» de un solo ejercicio: se guarda (es un borrador), pero la revisión lo dice.
    const incompleto = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: conBloques({ vacio: true, unoSolo: true }) }).expect(200);
    const revision = await pro.post(`/api/v1/training/plans/${b.planId}/validate`).send({ expectedVersion: incompleto.body.data.version }).expect(200);
    expect(revision.body.data.valid).toBe(false);
    expect(revision.body.data.issues).toEqual(
      expect.arrayContaining([
        { code: 'ROUNDS_GROUP_NEEDS_TWO_EXERCISES', path: 'blocks[0].sessions[0].exerciseGroups[0]' },
        { code: 'EXERCISE_GROUP_EMPTY', path: 'blocks[0].sessions[0].exerciseGroups[1]' },
      ]),
    );
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, incompleto.body.data.version).expect(422);

    // Completo: se guarda en la forma canónica.
    const guardado = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: incompleto.body.data.version, changes: conBloques() }).expect(200);
    const a = (await contenidoGuardado(b.planId)).blocks[0]!.sessions[0]!;
    expect(a.exerciseGroups).toEqual([{ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }]);
    expect(a.prescriptions.map((p) => p.exerciseGroupId)).toEqual(['g-1', 'g-1']);
    expect('exerciseGroups' in (await contenidoGuardado(b.planId)).blocks[0]!.sessions[1]!).toBe(false);

    // API-SER-01 (el editor del website) los trae, y vuelven como entrada idénticos.
    const detalle = PlanConObjetivosResponseSchema.parse((await pro.get(`/api/v1/training/plans/${b.planId}/detail`).expect(200)).body).data;
    expect(detalle.blocks[0]!.sessions[0]!.exerciseGroups).toEqual([{ groupId: 'g-1', label: 'Torso', order: 1, kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }]);
    expect(detalle.blocks[0]!.sessions[1]!.exerciseGroups).toEqual([]);

    // Se activa sin esperar a la persona (no se retiene nada) y la instantánea los congela.
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, guardado.body.data.version).expect(200);
    const instantanea = await prisma.instantaneaDePlanDeEntrenamiento.findFirstOrThrow({ where: { versionDePlanId: b.planId } });
    const congelada = (instantanea.contenido as { contenido: { blocks: { sessions: Sesion[] }[] } }).contenido.blocks[0]!.sessions[0]!;
    expect(congelada.exerciseGroups).toEqual([{ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }]);

    // La APK nueva: «Hoy» y la sesión para registrar traen el bloque.
    const apk = conLaApk(app, c.ase.token, LA_APK_NUEVA);
    const hoy = (await apk.get('/api/v1/me/training/today').expect(200)).body;
    const ocurrencia = (hoy.data.occurrences as { occurrenceId: string; plannedSession: Sesion }[]).find((o) => o.plannedSession.sessionId === 'ses-a')!;
    expect(ocurrencia.plannedSession.exerciseGroups).toEqual([{ groupId: 'g-1', label: 'Torso', order: 1, kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }]);
    const sesion = (await apk.get(`/api/v1/training/occurrences/${ocurrencia.occurrenceId}/session`).expect(200)).body;
    expect((sesion.data.session.prescriptions as { exerciseGroupId: string | null }[]).map((p) => p.exerciseGroupId)).toEqual(['g-1', 'g-1']);

    // La APK instalada: los mismos ejercicios, en el mismo orden, sin las dos claves. No se le retiene nada.
    const vieja = conLaApk(app, c.ase.token, LA_APK_INSTALADA);
    const hoyViejo = (await vieja.get('/api/v1/me/training/today').expect(200)).body;
    expect(JSON.stringify(hoyViejo)).not.toContain('exerciseGroup');
    expect(hoyViejo).toEqual(sinLasDosClaves(hoy));
    const sesionVieja = (await vieja.get(`/api/v1/training/occurrences/${ocurrencia.occurrenceId}/session`).expect(200)).body;
    expect(JSON.stringify(sesionVieja)).not.toContain('exerciseGroup');
    expect((sesionVieja.data.session.prescriptions as { prescriptionId: string }[]).map((p) => p.prescriptionId)).toEqual(['rx-banca', 'rx-sentadilla']);
    await conSesion(app, c.ase.token).get(`/api/v1/training/plans/${b.planId}`).expect(200);
  });
});

describe('DL-181 · las plantillas y las sesiones habituales conservan los bloques', () => {
  it('una plantilla guarda los bloques y el plan que nace de ella los trae; una sesión habitual también', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('plantilla-con-bloques'));
    const pro = conElWebsite(c.pro.token);
    const t = await pro.post('/api/v1/training/plan-templates').send({ name: `Torso en vueltas ${randomUUID().slice(0, 8)}`, structure: conBloques() }).expect(201);
    const plantilla = PlantillaDeEntrenamientoResponseSchema.parse(t.body).data;
    const enLaPlantilla = plantilla.structure.blocks[0]!.sessions![0]!;
    expect(enLaPlantilla.exerciseGroups).toEqual([{ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }]);
    expect(enLaPlantilla.prescriptions.map((p) => p.exerciseGroupId)).toEqual(['g-1', 'g-1']);

    const aplicado = await pro.post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: plantilla.versionId }).expect(201);
    const leido = PlanConObjetivosResponseSchema.parse((await pro.get(`/api/v1/training/plans/${aplicado.body.data.planId}/detail`).expect(200)).body).data;
    expect(leido.blocks[0]!.sessions[0]!.exerciseGroups!.map((g) => [g.label, g.kind, g.rounds])).toEqual([['Torso', 'ROUNDS', 3]]);
    expect(leido.blocks[0]!.sessions[0]!.prescriptions.map((p) => p.exerciseGroupId)).toEqual(['g-1', 'g-1']);

    const sesionDeEntrada = (conBloques() as { blocks: { sessions: Sesion[] }[] }).blocks[0]!.sessions[0]!;
    const hab = await pro.post('/api/v1/training/session-presets').send({ name: `Torso ${randomUUID().slice(0, 8)}`, structure: sesionDeEntrada }).expect(201);
    expect(hab.body.data.structure.exerciseGroups).toEqual([{ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }]);
    expect((hab.body.data.structure.prescriptions as { exerciseGroupId?: string }[]).map((p) => p.exerciseGroupId)).toEqual(['g-1', 'g-1']);
  });
});
