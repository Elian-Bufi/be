/**
 * ENSAYO CONJUNTO del 2026-10-25 (rama NO INTEGRAR): los cruces entre Administración (A, #210), la sustitución de
 * ejercicios (B, #195) y la comparación de Nutrición (C, DL-158). Cada paquete tiene sus pruebas; acá va lo que ninguno
 * ve sin el otro:
 * - **C con A:** suspender Nutrición deja «Analizar» sin nada de Nutrición —ni lo registrado, ni el objetivo, ni lo
 *   indicado— para un profesional que sigue viendo a la persona por Entrenamiento; al rehabilitar, la proyección vuelve
 *   igual (nada se borró ni se recalculó distinto).
 * - **B con A:** con Entrenamiento suspendido, guardar una sustitución desde la APK devuelve el 404 que la APK trata como
 *   acceso retirado (`useAccesoRetirado`), no otro error que dejaría el diálogo con un mensaje confuso; al rehabilitar,
 *   la sustitución se guarda.
 * - **Avisos:** el profesional recibe la decisión y la persona, el efecto, como novedades.
 * Solo datos sintéticos (`example.invalid`).
 */
import type { INestApplication } from '@nestjs/common';
import { BusquedaDeEjerciciosResponseSchema, ProyeccionResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { administradorListo, decidirSobre } from './soporte-administracion';
import { circuitoConPlanActivo, registrarComida } from './soporte-nutricion';
import { abrirBorrador, activar, borradorDeLaDemo, conLaApk, ocurrenciaDeHoy, prescripcionIdDe, SESION_DEMO, type EjercicioDeLaDemo } from './soporte-por-serie';
import { prepararProfesional, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (n: string) => `${n}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

/** Las novedades de una cuenta (API-NOV-01): el profesional las lee en el website; la persona, en la APK. */
const tiposDeNovedad = async (token: string, apk = false): Promise<string[]> =>
  (((await (apk ? conLaApk(app, token) : conSesion(app, token)).get('/api/v1/me/news?limit=30').expect(200)).body.data as { kind: string }[]) ?? []).map((n) => n.kind);

describe('Ensayo conjunto · cruces entre A, B y C', () => {
  it('C con A: con Nutrición suspendida, Analizar no muestra lo registrado, el objetivo ni lo indicado; al rehabilitar vuelve igual', async () => {
    const pro = await prepararProfesional(app, etiqueta('cruce-c'), ['NUTRICION', 'ENTRENAMIENTO']);
    const c = await circuitoConPlanActivo(app, etiqueta('cruce-c-n'), pro);
    // El profesional sigue viendo a la persona por Entrenamiento: la respuesta nombra el dominio, sin datos.
    await vinculoCompleto(app, pro, c.ase, 'ENTRENAMIENTO');
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const a = await administradorListo(app, prisma, etiqueta('cruce-c-adm'));
    const leer = async () =>
      ProyeccionResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/advisees/${c.ase.id}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY`).expect(200)).body).data;

    const antes = await leer();
    expect(antes.dataState).toBe('AVAILABLE');
    if (antes.result?.kind !== 'NUTRITION_PRESCRIBED_VS_RECORDED') throw new Error('sin la proyección');
    expect(antes.result.prescribed.planned.days.some((d) => d.state === 'DETERMINED')).toBe(true);
    expect(antes.result.prescribed.objectiveSteps.length).toBeGreaterThan(0);

    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'SUSPEND').expect(200);
    expect(await leer()).toMatchObject({ dataState: 'NOT_AVAILABLE_TO_VIEW', result: null, sourceDomains: [] });

    await decidirSobre(app, a.token, pro.id, 'NUTRICION', 'REINSTATE', { messageToProfessional: undefined }).expect(200);
    const despues = await leer();
    expect(despues.dataState).toBe('AVAILABLE');
    expect(despues.result).toEqual(antes.result);

    // Los avisos: la decisión al profesional; el efecto (suspendido y restablecido) a la persona.
    expect(await tiposDeNovedad(pro.token)).toEqual(expect.arrayContaining(['ADMINISTRATIVE_DECISION']));
    expect(await tiposDeNovedad(c.ase.token, true)).toEqual(expect.arrayContaining(['PROFESSIONAL_ACCESS_SUSPENDED', 'PROFESSIONAL_ACCESS_RESTORED']));
  });

  it('B con A: con Entrenamiento suspendido, guardar una sustitución desde la APK es el 404 de acceso retirado; al rehabilitar, se guarda', async () => {
    const [EJ_A] = SESION_DEMO.exercises as [EjercicioDeLaDemo];
    const A = prescripcionIdDe(EJ_A);
    const plan = await borradorDeLaDemo(app, etiqueta('cruce-b'));
    await activar(app, plan).expect(200);
    const apk = conLaApk(app, plan.ase.token);
    const { draftId, version } = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));
    const sustituto = BusquedaDeEjerciciosResponseSchema.parse((await apk.post('/api/v1/training/exercises/search').send({ q: 'press con mancuernas', limit: 20 }).expect(200)).body).data.find(
      (e) => e.name === 'Press con mancuernas',
    );
    if (!sustituto) throw new Error('sin el sustituto en el catálogo');
    const cambios = { granularity: 'SET', exercises: [{ prescriptionId: A, performedExerciseVersionId: sustituto.versionId, sets: [] }] };
    const a = await administradorListo(app, prisma, etiqueta('cruce-b-adm'));

    await decidirSobre(app, a.token, plan.pro.id, 'ENTRENAMIENTO', 'SUSPEND').expect(200);
    const rechazada = await apk.patch(`/api/v1/training/execution-drafts/${draftId}`).send({ expectedVersion: version, changes: cambios });
    // El 404 no revelador: el mismo que la APK convierte en «acceso retirado» y que las demás pantallas ya manejan.
    expect(rechazada.status).toBe(404);
    expect(rechazada.body.error.code).toBe('RESOURCE_NOT_FOUND');

    await decidirSobre(app, a.token, plan.pro.id, 'ENTRENAMIENTO', 'REINSTATE', { messageToProfessional: undefined }).expect(200);
    const guardada = await apk.patch(`/api/v1/training/execution-drafts/${draftId}`).send({ expectedVersion: version, changes: cambios }).expect(200);
    expect(guardada.body.data.exercises[0]).toMatchObject({ prescriptionId: A, performedExerciseVersionId: sustituto.versionId, substituted: true, sets: [] });
  });
});
