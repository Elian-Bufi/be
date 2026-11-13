/**
 * API-PLN-02 y API-PLN-03 (WP-EDITORES-PROFESIONAL ED-34; decisión de Dirección del 2026-11-13, «Último peso, guardado en
 * gramos») · los rangos de macronutrientes del plan, por la API real y contra PostgreSQL. Lo que fija esta prueba:
 * - con Antropometría habilitada, el peso es el último registrado, y el plan guarda los gramos y el peso del que salieron;
 * - un pesaje nuevo no mueve lo guardado: solo aparece como el último peso, y recalcular es volver a escribir con él;
 * - sin Antropometría (nunca habilitada o revocada), la API no devuelve el peso por ningún camino, tampoco en el error, y
 *   el profesional lo carga a mano;
 * - un peso que no existe es el mismo problema que no tener permiso, y el intento sin permiso queda registrado;
 * - si la toma usada se corrige o se anula, se avisa y lo guardado no cambia, salvo que el profesional pida el valor vigente;
 * - con el peso retenido, lo que no se toca conserva sus g/kg y el peso del que salieron;
 * - activada la versión, los rangos quedan fijos; la sucesora los conserva; la persona no los lee.
 * Datos sintéticos; las tomas se siembran por SQL, como en las pruebas de Antropometría.
 */
import type { INestApplication } from '@nestjs/common';
import { RangosDelPlanResponseSchema } from '@be/domain';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, conSesion } from './soporte-api';
import { sembrarEspecificaciones } from './soporte-antropometria';
import { activar, circuitoListoParaPlanificar, crearBorrador } from './soporte-nutricion';
import { prepararProfesional, revocarB2, vinculoCompleto, type Parte } from './soporte-vinculo';

let app: INestApplication;
let prisma: PrismaService;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
  prisma = app.get(PrismaService);
}, 120_000);
afterAll(async () => {
  await app?.close();
});

const DIA = 24 * 60 * 60 * 1000;
const fechaLocal = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(d);

/** Una toma de peso registrada por `pro`, sembrada por SQL: borrador, medición y registro, como la API. */
async function pesoRegistrado(pro: Parte, aseId: string, kg: number, haceDias: number): Promise<{ id: string; fecha: string }> {
  const { protocoloVersionId } = await sembrarEspecificaciones(prisma);
  const instante = new Date(Date.now() - haceDias * DIA);
  const ev = randomUUID();
  const med = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","procedencia","momento_de_ocurrencia")
     VALUES ('${ev}','${pro.id}','${aseId}','{"prueba":"rangos"}', '${instante.toISOString()}')`,
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO "medicion_antropometrica"
       ("id","evaluacion_id","metrica","valor","unidad_de_origen","protocolo_version_id","origen","clase","procedencia","momento_de_ocurrencia")
     VALUES ('${med}','${ev}','peso',${kg},'kg','${protocoloVersionId}','CAPTURA_DIRECTA','MEDIDO','{"prueba":"rangos"}','${instante.toISOString()}')`,
  );
  await prisma.$executeRawUnsafe(`UPDATE "evaluacion_antropometrica" SET "estado" = 'REGISTRADA', "momento_de_registro_de_evaluacion" = now() WHERE "id" = '${ev}'`);
  return { id: med, fecha: fechaLocal(instante) };
}

/** Profesional de Nutrición y de Antropometría, con los dos vínculos y un borrador. */
async function conAntropometria() {
  const pro = await prepararProfesional(app, `rangos-${++contador}`, ['NUTRICION', 'ANTROPOMETRIA']);
  const c = await circuitoListoParaPlanificar(app, `rangos-${++contador}`, pro);
  const ant = await vinculoCompleto(app, pro, c.ase, 'ANTROPOMETRIA');
  const b = await crearBorrador(app, c);
  const plan = await conSesion(app, pro.token).get(`/api/v1/nutrition/plans/${b.planId}`).expect(200);
  const dia = plan.body.data.dayTypes[0];
  return { c, pro, b, consentAnt: ant.consentId as string, dayTypeId: dia.dayTypeId as string, mealId: dia.meals[0].mealId as string };
}

const leer = async (pro: Parte, planId: string) => RangosDelPlanResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/nutrition/plans/${planId}/ranges`).expect(200)).body).data;
const escribir = (pro: Parte, planId: string, cuerpo: Record<string, unknown>) => conSesion(app, pro.token).put(`/api/v1/nutrition/plans/${planId}/ranges`).send(cuerpo);
const proteinas = (dayTypeId: string, min: number, max: number) => [{ dayTypeId, day: { protein: { unit: 'g_per_kg', min, max } }, meals: [] }];

describe('API-PLN-02 y 03 · los rangos de Nutrición en g/kg, con el último peso y guardados en gramos', () => {
  it('con Antropometría: el último peso, los gramos guardados, y un pesaje nuevo que no mueve nada', async () => {
    const { c, pro, b, dayTypeId, mealId } = await conAntropometria();
    const viejo = await pesoRegistrado(pro, c.ase.id, 74, 9);
    const p78 = await pesoRegistrado(pro, c.ase.id, 78, 3);
    const vacio = await leer(pro, b.planId);
    expect(vacio).toMatchObject({ state: 'DRAFT', revision: 0, bodyWeight: null, bodyWeightWithheld: false, dayTypes: [] });
    expect(vacio.anthropometry).toEqual({ enabled: true, latestWeight: { measurementId: p78.id, valueKg: 78, measuredOn: p78.fecha }, usedMeasurement: null });
    const guardado = RangosDelPlanResponseSchema.parse(
      (
        await escribir(pro, b.planId, {
          expectedRevision: 0,
          bodyWeight: { source: 'RECORDED', measurementId: p78.id },
          dayTypes: [{ dayTypeId, day: { protein: { unit: 'g_per_kg', min: 1.6, max: 2 } }, meals: [{ mealId, range: { fat: { unit: 'g', min: null, max: 25 } } }] }],
        }).expect(200)
      ).body,
    ).data;
    expect(guardado.revision).toBe(1);
    expect(guardado.bodyWeight).toEqual({ source: 'RECORDED', valueKg: 78, measuredOn: p78.fecha, measurementId: p78.id });
    expect(guardado.dayTypes[0]!.day!.protein).toEqual({ unit: 'g_per_kg', perKg: { min: 1.6, max: 2 }, grams: { min: 125, max: 156 } });
    // Un límite sin escribir sigue sin límite: nunca cero.
    expect(guardado.dayTypes[0]!.meals[0]!.range.fat).toEqual({ unit: 'g', perKg: null, grams: { min: null, max: 25 } });
    // Una toma que ya no es la última no se usa.
    const vieja = await escribir(pro, b.planId, { expectedRevision: 1, bodyWeight: { source: 'RECORDED', measurementId: viejo.id }, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(422);
    expect(vieja.body.error.details.issues).toEqual([{ code: 'BODY_WEIGHT_OUTDATED', path: 'bodyWeight.measurementId' }]);
    // Un pesaje nuevo no mueve lo guardado: aparece solo como el último peso.
    const p80 = await pesoRegistrado(pro, c.ase.id, 80.05, 1);
    const despues = await leer(pro, b.planId);
    expect([despues.revision, despues.bodyWeight, despues.dayTypes[0]!.day!.protein!.grams]).toEqual([1, guardado.bodyWeight, { min: 125, max: 156 }]);
    expect(despues.anthropometry.latestWeight).toEqual({ measurementId: p80.id, valueKg: 80.1, measuredOn: p80.fecha });
    // Seguir con el peso guardado tampoco lo mueve; recalcular es pedir el nuevo.
    const sigue = await escribir(pro, b.planId, { expectedRevision: 1, bodyWeight: { source: 'RECORDED', measurementId: p78.id }, dayTypes: proteinas(dayTypeId, 1.6, 2.2) }).expect(200);
    expect([sigue.body.data.bodyWeight.valueKg, sigue.body.data.dayTypes[0].day.protein.grams]).toEqual([78, { min: 125, max: 172 }]);
    const recalculado = await escribir(pro, b.planId, { expectedRevision: 2, bodyWeight: { source: 'RECORDED', measurementId: p80.id }, dayTypes: proteinas(dayTypeId, 1.6, 2.2) }).expect(200);
    expect([recalculado.body.data.bodyWeight.valueKg, recalculado.body.data.dayTypes[0].day.protein.grams]).toEqual([80.1, { min: 128, max: 176 }]);
    // La revisión vieja choca: no pisa lo que otro guardó.
    await escribir(pro, b.planId, { expectedRevision: 2, bodyWeight: null, dayTypes: [] }).expect(409);
    // Activada, queda fija; la persona no la lee; la sucesora la conserva tal cual.
    await activar(app, pro, b.planId, b.version).expect(200);
    const activada = await leer(pro, b.planId);
    expect([activada.state, activada.bodyWeight?.valueKg]).toEqual(['ACTIVATED', 80.1]);
    expect((await escribir(pro, b.planId, { expectedRevision: 3, bodyWeight: null, dayTypes: [] }).expect(422)).body.error.code).toBe('PLAN_NOT_EDITABLE');
    await conSesion(app, c.ase.token).get(`/api/v1/nutrition/plans/${b.planId}/ranges`).expect(404);
    const sucesora = await conSesion(app, pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: b.planId }).expect(201);
    const copia = await leer(pro, sucesora.body.data.planId as string);
    expect([copia.revision, copia.bodyWeight, copia.dayTypes]).toEqual([1, activada.bodyWeight, activada.dayTypes]);
  });

  it('sin Antropometría: el peso no sale por ningún camino y se carga a mano', async () => {
    const pro = await prepararProfesional(app, `rangos-${++contador}`, ['NUTRICION']);
    const c = await circuitoListoParaPlanificar(app, `rangos-${++contador}`, pro);
    const b = await crearBorrador(app, c);
    const dayTypeId = (await conSesion(app, pro.token).get(`/api/v1/nutrition/plans/${b.planId}`).expect(200)).body.data.dayTypes[0].dayTypeId as string;
    // Una toma de otro profesional, que este no puede ver.
    const otro = await prepararProfesional(app, `rangos-${++contador}`, ['ANTROPOMETRIA']);
    const ajeno = await pesoRegistrado(otro, c.ase.id, 91.3, 2);
    expect((await leer(pro, b.planId)).anthropometry).toEqual({ enabled: false, latestWeight: null, usedMeasurement: null });
    const rechazo = await escribir(pro, b.planId, { expectedRevision: 0, bodyWeight: { source: 'RECORDED', measurementId: ajeno.id }, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(422);
    expect(rechazo.body.error.details.issues).toEqual([{ code: 'BODY_WEIGHT_NOT_AVAILABLE', path: 'bodyWeight.measurementId' }]);
    expect(JSON.stringify(rechazo.body)).not.toMatch(/91\.3|91,3/);
    // El intento queda: la decisión denegada de Antropometría y el rechazo con su motivo real, aunque la escritura se revirtió.
    const requestId = rechazo.headers['x-request-id'] as string;
    expect(await prisma.decisionDeAcceso.count({ where: { requestId, operacion: 'API-PLN-03', alcance: 'ANTROPOMETRIA', resultado: 'DENEGADA', actorId: pro.id } })).toBe(1);
    expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId } })).toMatchObject({ operacion: 'API-PLN-03', resultado: 'RECHAZO', motivo: 'ANTROPOMETRIA_NO_HABILITADA' });
    // Sin peso no hay g/kg; a mano, sí.
    const sinPeso = await escribir(pro, b.planId, { expectedRevision: 0, bodyWeight: null, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(422);
    expect(sinPeso.body.error.details.issues).toEqual([{ code: 'BODY_WEIGHT_REQUIRED', path: 'bodyWeight' }]);
    const hoy = fechaLocal(new Date());
    const aMano = await escribir(pro, b.planId, { expectedRevision: 0, bodyWeight: { source: 'MANUAL', valueKg: 70.5, measuredOn: hoy }, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(200);
    expect(aMano.body.data.bodyWeight).toEqual({ source: 'MANUAL', valueKg: 70.5, measuredOn: hoy, measurementId: null });
    expect(aMano.body.data.dayTypes[0].day.protein.grams).toEqual({ min: 113, max: 141 });
    expect(JSON.stringify(aMano.body)).not.toMatch(/91\.3|91,3/);
  });

  it('con el acceso revocado: quedan los gramos, y se retienen el peso registrado y los g/kg', async () => {
    const { c, pro, b, consentAnt, dayTypeId } = await conAntropometria();
    const p = await pesoRegistrado(pro, c.ase.id, 66.6, 2);
    await escribir(pro, b.planId, { expectedRevision: 0, bodyWeight: { source: 'RECORDED', measurementId: p.id }, dayTypes: proteinas(dayTypeId, 1.5, 1.8) }).expect(200);
    await revocarB2(app, c.ase, consentAnt).expect(200);
    const leido = await leer(pro, b.planId);
    expect(leido).toMatchObject({ revision: 1, bodyWeight: null, bodyWeightWithheld: true, anthropometry: { enabled: false, latestWeight: null } });
    expect(leido.dayTypes[0]!.day!.protein).toEqual({ unit: 'g_per_kg', perKg: null, grams: { min: 100, max: 120 } });
    const crudo = JSON.stringify(leido);
    expect(crudo).not.toContain(p.id);
    expect(crudo).not.toMatch(/66\.6|1\.5|1\.8/);
    const rechazo = await escribir(pro, b.planId, { expectedRevision: 1, bodyWeight: { source: 'RECORDED', measurementId: p.id }, dayTypes: proteinas(dayTypeId, 1.5, 1.8) }).expect(422);
    expect(rechazo.body.error.details.issues).toEqual([{ code: 'BODY_WEIGHT_NOT_AVAILABLE', path: 'bodyWeight.measurementId' }]);
    expect(JSON.stringify(rechazo.body)).not.toMatch(/66\.6/);
    // Guardar otro rango, en gramos, sin tocar las proteínas: vuelven en gramos (lo que ve) y quedan en g/kg con su peso.
    const otro = await escribir(pro, b.planId, {
      expectedRevision: 1,
      bodyWeight: null,
      dayTypes: [{ dayTypeId, day: { protein: { unit: 'g', min: 100, max: 120 }, fat: { unit: 'g', min: null, max: 70 } }, meals: [] }],
    }).expect(200);
    expect(otro.body.data).toMatchObject({ revision: 2, bodyWeight: null, bodyWeightWithheld: true });
    expect(JSON.stringify(otro.body)).not.toMatch(/66\.6|1\.5|1\.8/);
    const fila = await prisma.rangosDePlanNutricional.findUniqueOrThrow({ where: { versionDePlanId: b.planId } });
    const contenido = fila.contenido as { bodyWeight: { valueKg: number; source: string }; dayTypes: { day: Record<string, unknown> }[] };
    expect([contenido.bodyWeight.source, contenido.bodyWeight.valueKg]).toEqual(['RECORDED', 66.6]);
    expect(contenido.dayTypes[0]!.day.protein).toEqual({ unit: 'g_per_kg', perKg: { min: 1.5, max: 1.8 }, grams: { min: 100, max: 120 } });
  });

  it('la toma usada se corrige o se anula: se avisa, lo guardado no cambia y el valor vigente se usa solo si se pide', async () => {
    const { c, pro, b, dayTypeId } = await conAntropometria();
    const p78 = await pesoRegistrado(pro, c.ase.id, 78, 3);
    await escribir(pro, b.planId, { expectedRevision: 0, bodyWeight: { source: 'RECORDED', measurementId: p78.id }, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(200);
    expect((await leer(pro, b.planId)).anthropometry.usedMeasurement).toEqual({ state: 'CURRENT', valueKg: 78 });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","correccion_previa_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${p78.id}',NULL,'${pro.id}','Se leyó mal la balanza.',87,'kg','{"prueba":"rangos"}')`,
    );
    // Corregida: el plan sigue con 78 kg; se avisa el valor de hoy, con la misma toma como la última.
    const corregida = await leer(pro, b.planId);
    expect([corregida.bodyWeight?.valueKg, corregida.dayTypes[0]!.day!.protein!.grams]).toEqual([78, { min: 125, max: 156 }]);
    expect(corregida.anthropometry).toEqual({ enabled: true, latestWeight: { measurementId: p78.id, valueKg: 87, measuredOn: p78.fecha }, usedMeasurement: { state: 'CURRENT', valueKg: 87 } });
    // Volver a mandar la misma toma conserva lo guardado; pedir el valor vigente recalcula (1,6 × 87 = 139,2; 2 × 87 = 174).
    const sigue = await escribir(pro, b.planId, { expectedRevision: 1, bodyWeight: { source: 'RECORDED', measurementId: p78.id }, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(200);
    expect(sigue.body.data.bodyWeight.valueKg).toBe(78);
    const vigente = await escribir(pro, b.planId, { expectedRevision: 2, bodyWeight: { source: 'RECORDED', measurementId: p78.id, useCurrentValue: true }, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(200);
    expect([vigente.body.data.bodyWeight.valueKg, vigente.body.data.dayTypes[0].day.protein.grams]).toEqual([87, { min: 139, max: 174 }]);
    // Anulada: el plan sigue citándola tal cual, y se avisa que ya no está vigente.
    await prisma.$executeRawUnsafe(
      `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${p78.id}','${pro.id}','Toma duplicada.','{}', now())`,
    );
    const anulada = await leer(pro, b.planId);
    expect([anulada.revision, anulada.bodyWeight?.valueKg]).toEqual([3, 87]);
    expect(anulada.anthropometry).toEqual({ enabled: true, latestWeight: null, usedMeasurement: { state: 'NOT_CURRENT' } });
  });

  it('con Antropometría y sin tomas: no hay último peso, y una medición inexistente es el mismo problema', async () => {
    const { pro, b, dayTypeId } = await conAntropometria();
    expect((await leer(pro, b.planId)).anthropometry).toEqual({ enabled: true, latestWeight: null, usedMeasurement: null });
    const r = await escribir(pro, b.planId, { expectedRevision: 0, bodyWeight: { source: 'RECORDED', measurementId: randomUUID() }, dayTypes: proteinas(dayTypeId, 1.6, 2) }).expect(422);
    expect(r.body.error.details.issues).toEqual([{ code: 'BODY_WEIGHT_NOT_AVAILABLE', path: 'bodyWeight.measurementId' }]);
    // Otro profesional y lo inexistente: el mismo 404.
    const otro = await circuitoListoParaPlanificar(app, `rangos-${++contador}`);
    const ajeno = await conSesion(app, otro.pro.token).get(`/api/v1/nutrition/plans/${b.planId}/ranges`);
    const inexistente = await conSesion(app, pro.token).get(`/api/v1/nutrition/plans/${randomUUID()}/ranges`);
    expect([ajeno.status, inexistente.status]).toEqual([404, 404]);
  });
});
