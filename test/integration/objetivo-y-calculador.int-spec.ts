/**
 * API-OBC-01 a 03 (WP-OBJETIVO-Y-CALCULADOR, DL-186; pedido de Dirección del 2026-11-19) · el objetivo con una toma de
 * Antropometría de referencia y el calculador de macros, por la API real y contra PostgreSQL. Lo que fija esta prueba:
 * - con Antropometría habilitada, las tomas del profesional con su peso, talla, edad y las corridas de las que sale la masa
 *   libre de grasa; la versión del objetivo y su cálculo se escriben juntos, y el servidor rehace el cálculo;
 * - lo guardado no se mueve: una toma más nueva y una corrección solo se avisan;
 * - sin Antropometría (nunca habilitada o revocada), ninguna toma sale por ningún camino: ni sus valores, ni que existe, ni
 *   en el error, que es el mismo para «sin permiso» y «no existe», y el intento queda registrado;
 * - a mano, sin toma; la frontera del profesional: lo de otro, el mismo 404.
 * Datos sintéticos; las tomas se siembran por SQL, como en las pruebas de los rangos.
 */
import type { INestApplication } from '@nestjs/common';
import { calcularObjetivo, ObjetivoConReferenciaResponseSchema, ReferenciaDelObjetivoResponseSchema, TomasDeReferenciaResponseSchema } from '@be/domain';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, conSesion } from './soporte-api';
import { sembrarEspecificaciones } from './soporte-antropometria';
import { circuitoListoParaPlanificar, cuerpoDeObjetivo } from './soporte-nutricion';
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

interface Toma {
  readonly evaluacionId: string;
  readonly fecha: string;
  readonly mediciones: Record<string, string>;
  readonly corridas: Record<string, string>;
}

/**
 * Una toma registrada por `pro`, sembrada por SQL: la evaluación, sus mediciones, el registro y, si se piden, corridas
 * vigentes (masa libre de grasa en kg o % de grasa) con el peso de entrada.
 */
async function tomaRegistrada(pro: Parte, aseId: string, valores: { peso?: number; talla?: number; edad?: number; mlg?: number; grasa?: number }, haceDias: number): Promise<Toma> {
  const { protocoloVersionId, metodoVersionId } = await sembrarEspecificaciones(prisma);
  const instante = new Date(Date.now() - haceDias * DIA);
  const ev = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","procedencia","momento_de_ocurrencia")
     VALUES ('${ev}','${pro.id}','${aseId}','{"prueba":"objetivo"}', '${instante.toISOString()}')`,
  );
  const mediciones: Record<string, string> = {};
  for (const [metrica, valor, unidad] of [['peso', valores.peso, 'kg'], ['talla', valores.talla, 'cm'], ['edad', valores.edad, 'años']] as const) {
    if (valor === undefined) continue;
    const id = randomUUID();
    mediciones[metrica] = id;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "medicion_antropometrica"
         ("id","evaluacion_id","metrica","valor","unidad_de_origen","protocolo_version_id","origen","clase","procedencia","momento_de_ocurrencia")
       VALUES ('${id}','${ev}','${metrica}',${valor},'${unidad}','${protocoloVersionId}','CAPTURA_DIRECTA','MEDIDO','{"prueba":"objetivo"}','${instante.toISOString()}')`,
    );
  }
  await prisma.$executeRawUnsafe(`UPDATE "evaluacion_antropometrica" SET "estado" = 'REGISTRADA', "momento_de_registro_de_evaluacion" = now() WHERE "id" = '${ev}'`);
  const corridas: Record<string, string> = {};
  for (const [clave, metrica, valor, unidad] of [['mlg', 'masa-libre-de-grasa-durnin-womersley', valores.mlg, 'kg'], ['grasa', 'grasa-faulkner', valores.grasa, '%']] as const) {
    if (valor === undefined || !mediciones.peso) continue;
    const id = randomUUID();
    corridas[clave] = id;
    await prisma.ejecucionDeCalculo.create({
      data: { id, evaluacionId: ev, metodoVersionId, autorId: pro.id, metrica, valor, unidad, decimales: 1, modoDeRedondeo: 'MEDIO_ARRIBA', finalidad: 'SOPORTE_ANTROPOMETRICO', regla: `be/${metrica}@1`, procedencia: { prueba: 'objetivo' } },
    });
    await prisma.entradaDeCalculo.create({ data: { ejecucionId: id, medicionId: mediciones.peso, metrica: 'peso', valor: valores.peso!, unidad: 'kg' } });
  }
  return { evaluacionId: ev, fecha: fechaLocal(instante), mediciones, corridas };
}

/** Profesional de Nutrición y de Antropometría, con los dos vínculos y una evaluación nutricional. */
async function conAntropometria() {
  const pro = await prepararProfesional(app, `obc-${++contador}`, ['NUTRICION', 'ANTROPOMETRIA']);
  const c = await circuitoListoParaPlanificar(app, `obc-${++contador}`, pro);
  const ant = await vinculoCompleto(app, pro, c.ase, 'ANTROPOMETRIA');
  return { c, pro, consentAnt: ant.consentId as string };
}

const tomas = async (pro: Parte, aseId: string) => TomasDeReferenciaResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/advisees/${aseId}/nutrition/objective-reference/measurements`).expect(200)).body).data;
const crear = (pro: Parte, aseId: string, cuerpo: Record<string, unknown>) => conSesion(app, pro.token).post(`/api/v1/advisees/${aseId}/nutrition/objectives/with-reference`).send(cuerpo);
const referencia = async (pro: Parte, versionId: string) => ReferenciaDelObjetivoResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/nutrition/objective-versions/${versionId}/reference`).expect(200)).body).data;

const PARAMETROS = {
  sex: 'FEMALE',
  restingMethod: 'MIFFLIN_ST_JEOR',
  activity: { factor: 1.55, restDayFactor: 1.4 },
  adjustment: { kind: 'KCAL', value: -300 },
  macros: { base: 'BODY_WEIGHT', proteinPerKg: 1.8, fatPerKg: 0.9 },
} as const;

describe('API-OBC-01 a 03 · el objetivo con una toma de referencia y el calculador de macros', () => {
  it('con Antropometría: las tomas, el objetivo con su cálculo y lo guardado que no se mueve', async () => {
    const { c, pro } = await conAntropometria();
    const vieja = await tomaRegistrada(pro, c.ase.id, { peso: 70.2, talla: 162, edad: 45 }, 30);
    const toma = await tomaRegistrada(pro, c.ase.id, { peso: 68, talla: 162, edad: 45, mlg: 46.5, grasa: 30 }, 3);
    const lista = await tomas(pro, c.ase.id);
    expect(lista.anthropometryEnabled).toBe(true);
    expect(lista.measurements.map((t) => t.evaluationId)).toEqual([toma.evaluacionId, vieja.evaluacionId]);
    expect(lista.measurements[0]).toMatchObject({ measuredOn: toma.fecha, weightKg: 68, heightCm: 162, ageYears: 45 });
    // La masa libre de grasa: la de la corrida en kg, y la que sale del % de grasa con el peso de la toma (68 × 0,7).
    expect(lista.measurements[0]!.composition.map((x) => [x.calculationId, x.unit, x.value, x.leanMassKg])).toEqual([
      [toma.corridas.mlg, 'kg', 46.5, 46.5],
      [toma.corridas.grasa, '%', 30, 47.6],
    ]);

    const pedido = {
      objective: { ...cuerpoDeObjetivo(c.evaluationId, 1725), methodStatement: 'Estimación: Mifflin-St Jeor (1990).' },
      reference: { source: 'RECORDED', evaluationId: toma.evaluacionId, leanMassCalculationId: toma.corridas.mlg, additions: { heightCm: null, ageYears: null } },
      parameters: PARAMETROS,
    };
    const r = ObjetivoConReferenciaResponseSchema.parse((await crear(pro, c.ase.id, pedido).expect(201)).body).data;
    expect(r.objective).toMatchObject({ isEffective: true, estimatedEnergyRequirement: { value: 1725, unit: 'kcal/day' }, predecessorVersionId: c.objectiveVersionId });
    expect(r.calculation.reference).toEqual({ source: 'RECORDED', evaluationId: toma.evaluacionId, measuredOn: toma.fecha });
    expect(r.calculation.data).toEqual({
      weightKg: { value: 68, origin: 'MEASUREMENT' },
      heightCm: { value: 162, origin: 'MEASUREMENT' },
      ageYears: { value: 45, origin: 'MEASUREMENT' },
      leanMassKg: { value: 46.5, origin: 'CALCULATION', method: 'Masa libre de grasa (Durnin y Womersley)', fatPercent: null },
    });
    // El servidor rehace el cálculo con la misma función del dominio: 1.306,5 kcal en reposo, × 1,55 − 300 = 1.725.
    expect(r.calculation.result).toEqual(calcularObjetivo(r.calculation.data!, PARAMETROS));
    expect(r.calculation.result?.energy).toEqual({ day: 1725, restDay: 1529 });
    expect(r.calculation.result?.macros?.day.protein.grams).toBe(122);
    // El objetivo efectivo es el nuevo, y la versión anterior sigue sin cálculo.
    const efectivo = await conSesion(app, pro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/objectives/effective`).expect(200);
    expect(efectivo.body.data.objective.versionId).toBe(r.objective.versionId);
    expect((await referencia(pro, c.objectiveVersionId)).calculation).toBeNull();

    const leido = await referencia(pro, r.objective.versionId);
    expect(leido.calculation).toEqual(r.calculation);
    expect(leido.anthropometry).toEqual({ anthropometryEnabled: true, newerMeasurement: null, referenceState: 'CURRENT' });
    // Una toma más nueva y una corrección del peso: se avisan, y lo guardado sigue igual.
    const nueva = await tomaRegistrada(pro, c.ase.id, { peso: 66.4 }, 1);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","correccion_previa_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${toma.mediciones.peso}',NULL,'${pro.id}','Se leyó mal la balanza.',67,'kg','{"prueba":"objetivo"}')`,
    );
    const despues = await referencia(pro, r.objective.versionId);
    expect(despues.anthropometry).toEqual({ anthropometryEnabled: true, newerMeasurement: { evaluationId: nueva.evaluacionId, measuredOn: nueva.fecha }, referenceState: 'CHANGED' });
    expect(despues.calculation).toEqual(r.calculation);
    // Lo que la toma no tiene, a mano: la talla de la toma nueva, con su origen.
    const conAgregado = await crear(pro, c.ase.id, {
      ...pedido,
      reference: { source: 'RECORDED', evaluationId: nueva.evaluacionId, leanMassCalculationId: null, additions: { heightCm: 161.5, ageYears: 45 } },
      parameters: { ...PARAMETROS, macros: null, adjustment: null },
    }).expect(201);
    expect(conAgregado.body.data.calculation.data).toEqual({ weightKg: { value: 66.4, origin: 'MEASUREMENT' }, heightCm: { value: 161.5, origin: 'MANUAL' }, ageYears: { value: 45, origin: 'MANUAL' }, leanMassKg: null });
    // Una corrida que no es de esa toma: el mismo problema que una toma que no existe.
    const otraCorrida = await crear(pro, c.ase.id, { ...pedido, reference: { ...pedido.reference, evaluationId: nueva.evaluacionId } }).expect(422);
    expect(otraCorrida.body.error.details.issues).toEqual([{ code: 'MEASUREMENT_NOT_AVAILABLE', path: 'reference.leanMassCalculationId' }]);
    // La persona no lo lee.
    await conSesion(app, c.ase.token).get(`/api/v1/nutrition/objective-versions/${r.objective.versionId}/reference`).expect(404);
  });

  it('sin Antropometría: ninguna toma sale por ningún camino, y el intento queda registrado', async () => {
    const pro = await prepararProfesional(app, `obc-${++contador}`, ['NUTRICION']);
    const c = await circuitoListoParaPlanificar(app, `obc-${++contador}`, pro);
    const otro = await prepararProfesional(app, `obc-${++contador}`, ['ANTROPOMETRIA']);
    const ajena = await tomaRegistrada(otro, c.ase.id, { peso: 91.3, talla: 177, edad: 52 }, 2);
    expect(await tomas(pro, c.ase.id)).toEqual({ anthropometryEnabled: false, measurements: [] });
    const versiones = await prisma.versionDeObjetivoNutricional.count({ where: { objetivo: { asesoradoId: c.ase.id } } });
    const pedido = (evaluationId: string) => ({
      objective: cuerpoDeObjetivo(c.evaluationId),
      reference: { source: 'RECORDED', evaluationId, leanMassCalculationId: null, additions: { heightCm: null, ageYears: null } },
      parameters: PARAMETROS,
    });
    const rechazo = await crear(pro, c.ase.id, pedido(ajena.evaluacionId)).expect(422);
    const inexistente = await crear(pro, c.ase.id, pedido(randomUUID())).expect(422);
    expect(rechazo.body.error.details).toEqual(inexistente.body.error.details);
    expect(rechazo.body.error.details.issues).toEqual([{ code: 'MEASUREMENT_NOT_AVAILABLE', path: 'reference.evaluationId' }]);
    expect(JSON.stringify(rechazo.body)).not.toMatch(/91\.3|177/);
    const requestId = rechazo.headers['x-request-id'] as string;
    expect(await prisma.decisionDeAcceso.count({ where: { requestId, operacion: 'API-OBC-02', alcance: 'ANTROPOMETRIA', resultado: 'DENEGADA', actorId: pro.id } })).toBe(1);
    expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId } })).toMatchObject({ operacion: 'API-OBC-02', resultado: 'RECHAZO', motivo: 'ANTROPOMETRIA_NO_HABILITADA' });
    // Rechazado, no se emitió ninguna versión del objetivo.
    expect(await prisma.versionDeObjetivoNutricional.count({ where: { objetivo: { asesoradoId: c.ase.id } } })).toBe(versiones);
    // A mano, sí: con su fecha, sin fecha futura, y la masa libre de grasa menor que el peso.
    const hoy = fechaLocal(new Date());
    const manual = { source: 'MANUAL', measuredOn: hoy, weightKg: 70, heightCm: 175, ageYears: 30, leanMassKg: 55, leanMassNote: 'Bioimpedancia del consultorio' };
    const aMano = await crear(pro, c.ase.id, { objective: cuerpoDeObjetivo(c.evaluationId), reference: manual, parameters: { ...PARAMETROS, sex: 'MALE', restingMethod: 'CUNNINGHAM_1980' } }).expect(201);
    expect(aMano.body.data.calculation).toMatchObject({ reference: { source: 'MANUAL', evaluationId: null, measuredOn: hoy }, anthropometryWithheld: false, restingMethod: 'CUNNINGHAM_1980' });
    expect(aMano.body.data.calculation.result.resting).toMatchObject({ state: 'CALCULATED', kcal: 1710, applied: '500 + 22 × 55 = 1.710' });
    const futura = fechaLocal(new Date(Date.now() + 3 * DIA));
    const problemas = await crear(pro, c.ase.id, { objective: cuerpoDeObjetivo(c.evaluationId), reference: { ...manual, measuredOn: futura, leanMassKg: 80 }, parameters: null }).expect(422);
    expect(problemas.body.error.details.issues).toEqual([
      { code: 'DATE_IN_FUTURE', path: 'reference.measuredOn' },
      { code: 'LEAN_MASS_NOT_BELOW_WEIGHT', path: 'reference.leanMassKg' },
    ]);
    // Sin cálculo, solo la referencia: queda, sin método.
    const soloReferencia = await crear(pro, c.ase.id, { objective: cuerpoDeObjetivo(c.evaluationId), reference: manual, parameters: null }).expect(201);
    expect(soloReferencia.body.data.calculation).toMatchObject({ restingMethod: null, parameters: null, result: null });
    expect((await referencia(pro, aMano.body.data.objective.versionId)).anthropometry).toEqual({ anthropometryEnabled: false, newerMeasurement: null, referenceState: null });
  });

  it('con el acceso revocado: se retienen la toma, los datos y el resultado; queda el método', async () => {
    const { c, pro, consentAnt } = await conAntropometria();
    const toma = await tomaRegistrada(pro, c.ase.id, { peso: 66.6, talla: 158, edad: 38 }, 2);
    const r = await crear(pro, c.ase.id, {
      objective: cuerpoDeObjetivo(c.evaluationId),
      reference: { source: 'RECORDED', evaluationId: toma.evaluacionId, leanMassCalculationId: null, additions: { heightCm: null, ageYears: null } },
      parameters: PARAMETROS,
    }).expect(201);
    await revocarB2(app, c.ase, consentAnt).expect(200);
    const leido = await referencia(pro, r.body.data.objective.versionId as string);
    expect(leido.calculation).toMatchObject({ reference: { source: 'RECORDED', evaluationId: null, measuredOn: null }, anthropometryWithheld: true, restingMethod: 'MIFFLIN_ST_JEOR', data: null, parameters: null, result: null });
    expect(leido.anthropometry).toEqual({ anthropometryEnabled: false, newerMeasurement: null, referenceState: null });
    const crudo = JSON.stringify(leido);
    expect(crudo).not.toContain(toma.evaluacionId);
    expect(crudo).not.toMatch(/66\.6|158/);
    expect(await tomas(pro, c.ase.id)).toEqual({ anthropometryEnabled: false, measurements: [] });
    // Lo guardado sigue en la base, tal cual.
    const fila = await prisma.calculoDelObjetivoNutricional.findUniqueOrThrow({ where: { versionDeObjetivoId: r.body.data.objective.versionId as string } });
    expect((fila.contenido as { data: { weightKg: { value: number } } }).data.weightKg.value).toBe(66.6);
    // Append-only: la base no deja corregirlo ni borrarlo.
    await expect(prisma.$executeRawUnsafe(`UPDATE "calculo_del_objetivo_nutricional" SET "contenido" = '{}' WHERE "id" = '${fila.id}'`)).rejects.toThrow();
  });

  it('la frontera del profesional: la versión de otro profesional y lo inexistente, el mismo 404', async () => {
    const { c, pro } = await conAntropometria();
    const otro = await prepararProfesional(app, `obc-${++contador}`, ['NUTRICION']);
    const versionAjena = c.objectiveVersionId;
    await conSesion(app, otro.token).get(`/api/v1/nutrition/objective-versions/${versionAjena}/reference`).expect(404);
    await conSesion(app, pro.token).get(`/api/v1/nutrition/objective-versions/${randomUUID()}/reference`).expect(404);
    await conSesion(app, otro.token).get(`/api/v1/advisees/${c.ase.id}/nutrition/objective-reference/measurements`).expect(404);
    await crear(otro, c.ase.id, { objective: cuerpoDeObjetivo(c.evaluationId), reference: { source: 'MANUAL', measuredOn: fechaLocal(new Date()), weightKg: 70, heightCm: null, ageYears: null, leanMassKg: null, leanMassNote: null }, parameters: null }).expect(404);
  });
});
