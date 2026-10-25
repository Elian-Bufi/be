/**
 * WP-NUTRICION-COMPARACION (DL-158) · API-PRJ-01 con el objetivo del profesional y lo indicado en el plan, con datos reales
 * registrados por la API. Lo que fijan:
 * - lo indicado del día es la suma de las opciones únicas de cada comida, calculada **a mano** desde la instantánea (no
 *   con el código que se prueba), también un día sin registros y el día en curso; un día futuro no tiene;
 * - por comida registrada, lo de su opción; una comida diferente no tiene indicado; un anulado no aparece;
 * - con varias opciones en una comida, el día no tiene indicado: se dice cuál comida y cuántas, sin sumar nada;
 * - lo indicado de ayer no cambia al activar otra versión (la instantánea), y el día del cambio no tiene indicado del día;
 * - el objetivo: las calorías y los macros en gramos son escalones; una proporción de las calorías no se convierte.
 */
import type { INestApplication } from '@nestjs/common';
import { ProyeccionResponseSchema, type ResultadoDeProyeccionNutricional } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activar, circuitoConPlanActivo, circuitoListoParaPlanificar, clavesProhibidas, crearBorrador, patchConSesion } from './soporte-nutricion';
import type { Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000);
const fechaCivil = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const HOY = () => fechaCivil(new Date());

async function leer(pro: Parte, asesoradoId: string, query: string): Promise<ResultadoDeProyeccionNutricional> {
  const r = ProyeccionResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/advisees/${asesoradoId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED${query}`).expect(200)).body);
  expect(clavesProhibidas(r)).toEqual([]);
  const resultado = r.data.result;
  if (resultado?.kind !== 'NUTRITION_PRESCRIBED_VS_RECORDED') throw new Error('otra clave');
  return resultado;
}

// ─── El cálculo a mano, desde la instantánea guardada ───────────────────────────────────────────

type ItemGuardado = { quantity: { value: number; unit: string }; composition: Record<string, unknown> & { referenceAmount: string } };
type OpcionGuardada = { optionId: string; label: string; items: ItemGuardado[] };
type ComidaGuardada = { mealId: string; label: string; options: OpcionGuardada[] };

async function instantanea(planId: string): Promise<{ dayTypes: { dayTypeId: string; meals: ComidaGuardada[] }[] }> {
  const fila = await prisma.instantaneaDePlanNutricional.findUniqueOrThrow({ where: { versionDePlanId: planId } });
  return fila.contenido as unknown as { dayTypes: { dayTypeId: string; meals: ComidaGuardada[] }[] };
}

/** Lo de una opción para un campo de la composición: gramos × valor cada 100 g / 100, sumado con números comunes. */
function aMano(opcion: OpcionGuardada, campo: 'energyKcal' | 'proteinG'): number {
  return opcion.items.reduce((suma, it) => {
    expect(it.composition.referenceAmount).toBe('100g');
    expect(it.quantity.unit).toBe('g');
    return suma + (it.quantity.value * Number(it.composition[campo])) / 100;
  }, 0);
}

/** Un plan con alternativas en la cena: pollo 150 g o arroz 200 g. */
function estructuraConAlternativas(arroz: string, pollo: string): Record<string, unknown> {
  const item = (catalogItemId: string, gramos: number) => ({ catalogItemId, quantity: { value: gramos, unit: 'g' }, preparationState: 'COOKED' });
  return {
    dayTypes: [
      {
        label: 'Día habitual',
        meals: [
          { label: 'Almuerzo', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Arroz con pollo', items: [item(arroz, 100), item(pollo, 120)] }] },
          {
            label: 'Cena',
            prescriptionMode: 'DISH_OPTIONS',
            options: [
              { label: 'Pollo solo', items: [item(pollo, 150)] },
              { label: 'Arroz solo', items: [item(arroz, 200)] },
            ],
          },
        ],
      },
    ],
  };
}

function registrarOpcion(ase: Parte, planId: string, dayTypeId: string, comida: ComidaGuardada, opcion: OpcionGuardada, ocurrio: Date) {
  return conSesion(app, ase.token)
    .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
    .send({ kind: 'PLAN_OPTION', activePlanId: planId, dayTypeId, mealId: comida.mealId, optionId: opcion.optionId, occurredAt: ocurrio.toISOString(), consumption: { status: 'PLAN_PORTIONS' }, observation: null })
    .expect(201);
}

describe('API-PRJ-01 · objetivo del profesional e indicado en el plan (DL-158)', () => {
  it('el día tiene lo indicado de sus opciones únicas (a mano), también sin registros y hoy; por comida, lo de su opción; la comida diferente y el anulado, no', async () => {
    const c = await circuitoConPlanActivo(app, `cmp-dia-${++contador}`);
    const plan = await instantanea(c.planId);
    const dia = plan.dayTypes[0]!;
    const [almuerzo, cena] = dia.meals as [ComidaGuardada, ComidaGuardada];
    // A mano: la única opción del almuerzo (arroz 100 g y pollo 120 g) más la de la cena (pollo 150 g).
    const almuerzoKcal = aMano(almuerzo.options[0]!, 'energyKcal');
    const delDia = almuerzoKcal + aMano(cena.options[0]!, 'energyKcal');

    const ayer = (await registrarOpcion(c.ase, c.planId, dia.dayTypeId, almuerzo, almuerzo.options[0]!, haceDias(1))).body.data;
    const diferente = (
      await conSesion(app, c.ase.token)
        .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
        .send({ kind: 'DIFFERENT', activePlanId: c.planId, dayTypeId: dia.dayTypeId, mealId: cena.mealId, occurredAt: haceDias(1).toISOString(), description: 'Una pizza con amigos', approximateQuantity: null, mediaIds: [] })
        .expect(201)
    ).body.data;
    const anulado = (await registrarOpcion(c.ase, c.planId, dia.dayTypeId, almuerzo, almuerzo.options[0]!, new Date())).body.data;
    await conSesion(app, c.ase.token).post(`/api/v1/nutrition/meal-records/${anulado.recordId}/annulment`).send({ reason: 'Me equivoqué de comida', expectedVersion: anulado.version }).expect(201);

    const r = await leer(c.pro, c.ase.id, `?metric=ENERGY&periodStart=${fechaCivil(haceDias(2))}&periodEnd=${fechaCivil(haceDias(-3))}`);
    // Un día por fecha, hasta hoy: el día en curso sí, los futuros no.
    expect(r.prescribed.planned.days.map((d) => d.date)).toEqual([fechaCivil(haceDias(2)), fechaCivil(haceDias(1)), HOY()]);
    const [anteayer, deAyer, deHoy] = r.prescribed.planned.days;
    // Anteayer no regía el plan (se activó hoy) y no hay registros que lo citen.
    expect(anteayer).toMatchObject({ state: 'UNDETERMINED', reason: 'NO_ACTIVE_PLAN', planVersionId: null, mealsWithSeveralOptions: [] });
    // Ayer, por los registros que citan la versión; hoy, sin registros efectivos (el único está anulado), la que rige.
    for (const d of [deAyer, deHoy]) {
      if (d?.state !== 'DETERMINED') throw new Error(`sin indicado: ${JSON.stringify(d)}`);
      expect(d).toMatchObject({ planVersionId: c.planId, dayTypeId: dia.dayTypeId, dayType: 'Día habitual' });
      expect(d.value).toBeCloseTo(delDia, 6);
    }
    // Por comida: el almuerzo de ayer con lo de su opción; la comida diferente sin indicado; el anulado no está.
    expect(r.prescribed.planned.meals).toHaveLength(2);
    const delAlmuerzo = r.prescribed.planned.meals.find((m) => m.recordId === ayer.recordId);
    if (delAlmuerzo?.state !== 'DETERMINED') throw new Error('el almuerzo sin indicado');
    expect(delAlmuerzo.value).toBeCloseTo(almuerzoKcal, 6);
    expect(delAlmuerzo.planVersionId).toBe(c.planId);
    expect(r.prescribed.planned.meals.find((m) => m.recordId === diferente.recordId)).toEqual({ recordId: diferente.recordId, state: 'UNDETERMINED', reason: 'DIFFERENT_MEAL', planVersionId: c.planId });

    // El objetivo: en calorías, el mismo escalón que el requerimiento; en proteínas, los gramos declarados; la fibra, nada.
    expect(r.prescribed.objectiveSteps).toEqual(r.prescribed.energyRequirement.map((e) => ({ objectiveVersionId: e.objectiveVersionId, from: e.from, to: e.to, amount: { value: e.value, unit: 'kcal/day' }, energyShare: null })));
    expect(r.prescribed.objectiveSteps).toEqual([expect.objectContaining({ objectiveVersionId: c.objectiveVersionId, amount: { value: 2200, unit: 'kcal/day' }, to: null })]);
    const proteinas = await leer(c.pro, c.ase.id, `?metric=PROTEIN&periodStart=${fechaCivil(haceDias(2))}&periodEnd=${HOY()}`);
    expect(proteinas.prescribed.objectiveSteps).toEqual([{ objectiveVersionId: c.objectiveVersionId, from: HOY(), to: null, amount: { value: 110, unit: 'g/day' }, energyShare: null }]);
    expect(proteinas.prescribed.energyRequirement).toEqual([]);
    const proteinasDeAyer = proteinas.prescribed.planned.days.find((d) => d.date === fechaCivil(haceDias(1)));
    if (proteinasDeAyer?.state !== 'DETERMINED') throw new Error('sin proteínas indicadas');
    expect(proteinasDeAyer.value).toBeCloseTo(aMano(almuerzo.options[0]!, 'proteinG') + aMano(cena.options[0]!, 'proteinG'), 6);
    expect((await leer(c.pro, c.ase.id, `?metric=FIBER&periodStart=${HOY()}&periodEnd=${HOY()}`)).prescribed.objectiveSteps).toEqual([]);
    // La cuenta de registros no tiene objetivo ni indicado.
    const registros = await leer(c.pro, c.ase.id, `?metric=RECORDS&periodStart=${fechaCivil(haceDias(2))}&periodEnd=${HOY()}`);
    expect(registros.prescribed).toMatchObject({ objectiveSteps: [], planned: { days: [], meals: [] } });
  });

  it('con varias opciones en una comida el día no tiene indicado: se dice cuál y cuántas; una proporción del objetivo no se convierte', async () => {
    const c = await circuitoListoParaPlanificar(app, `cmp-opciones-${++contador}`);
    const borrador = await crearBorrador(app, c, { initialStructure: estructuraConAlternativas(c.arroz, c.pollo) });
    await activar(app, c.pro, borrador.planId, borrador.version).expect(200);
    const plan = await instantanea(borrador.planId);
    const dia = plan.dayTypes[0]!;
    const cena = dia.meals[1]!;
    const arrozSolo = cena.options.find((o) => o.label === 'Arroz solo')!;
    const registro = (await registrarOpcion(c.ase, borrador.planId, dia.dayTypeId, cena, arrozSolo, new Date())).body.data;

    const r = await leer(c.pro, c.ase.id, `?metric=ENERGY&periodStart=${HOY()}&periodEnd=${HOY()}`);
    expect(r.prescribed.planned.days).toEqual([{ date: HOY(), state: 'UNDETERMINED', reason: 'SEVERAL_OPTIONS', planVersionId: borrador.planId, mealsWithSeveralOptions: [{ meal: 'Cena', options: 2 }] }]);
    // La opción elegida sí tiene lo suyo, a mano: arroz 200 g.
    const comida = r.prescribed.planned.meals[0];
    if (comida?.state !== 'DETERMINED' || comida.recordId !== registro.recordId) throw new Error('la cena sin indicado');
    expect(comida.value).toBeCloseTo(aMano(arrozSolo, 'energyKcal'), 6);

    // Un objetivo nuevo con las proteínas como proporción de las calorías (la API lo acepta; el website escribe gramos).
    const v1 = await prisma.versionDeObjetivoNutricional.findUniqueOrThrow({ where: { id: c.objectiveVersionId } });
    const v2 = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "version_de_objetivo_nutricional" ("id","objetivo_id","predecesora_id","evaluacion_id","vigente_desde","requerimiento_energetico","distribucion_de_macronutrientes","fundamento","autor_id","procedencia")
       VALUES ('${v2}','${v1.objetivoId}','${v1.id}','${v1.evaluacionId}', now(),'{"value":2000,"unit":"kcal/day"}','{"protein":{"value":0.3,"unit":"energy_share"},"carbohydrate":{"value":250,"unit":"g/day"},"fat":{"value":60,"unit":"g/day"}}','Fundamento sintético del ajuste.','${c.pro.id}','{"prueba":"comparacion"}')`,
    );
    const proteinas = await leer(c.pro, c.ase.id, `?metric=PROTEIN&periodStart=${HOY()}&periodEnd=${HOY()}`);
    expect(proteinas.prescribed.objectiveSteps).toEqual([
      { objectiveVersionId: v1.id, from: HOY(), to: HOY(), amount: { value: 110, unit: 'g/day' }, energyShare: null },
      { objectiveVersionId: v2, from: HOY(), to: null, amount: null, energyShare: 0.3 },
    ]);
    const grasas = await leer(c.pro, c.ase.id, `?metric=FAT&periodStart=${HOY()}&periodEnd=${HOY()}`);
    expect(grasas.prescribed.objectiveSteps.map((e) => e.amount?.value)).toEqual([70, 60]);
  });

  it('lo indicado de ayer no cambia al activar otra versión; el día del cambio no tiene indicado del día y cada comida tiene el de su versión', async () => {
    const c = await circuitoConPlanActivo(app, `cmp-version-${++contador}`);
    const plan = await instantanea(c.planId);
    const dia = plan.dayTypes[0]!;
    const almuerzo = dia.meals[0]!;
    await registrarOpcion(c.ase, c.planId, dia.dayTypeId, almuerzo, almuerzo.options[0]!, haceDias(1));
    const periodo = `?metric=ENERGY&periodStart=${fechaCivil(haceDias(1))}&periodEnd=${HOY()}`;
    const antes = await leer(c.pro, c.ase.id, periodo);
    const ayerAntes = antes.prescribed.planned.days[0];
    if (ayerAntes?.state !== 'DETERMINED') throw new Error('ayer sin indicado');

    // Otra versión, con la estructura reescrita (alternativas en la cena), activada hoy.
    const sucesora = (await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201)).body.data;
    const reescrita = (await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${sucesora.planId}`).send({ expectedVersion: sucesora.version, changes: estructuraConAlternativas(c.arroz, c.pollo) }).expect(200)).body.data;
    await activar(app, c.pro, reescrita.planId, reescrita.version).expect(200);
    const nueva = await instantanea(reescrita.planId);
    const cenaNueva = nueva.dayTypes[0]!.meals[1]!;
    const polloSolo = cenaNueva.options.find((o) => o.label === 'Pollo solo')!;
    const deHoy = (await registrarOpcion(c.ase, reescrita.planId, nueva.dayTypes[0]!.dayTypeId, cenaNueva, polloSolo, new Date())).body.data;

    const despues = await leer(c.pro, c.ase.id, periodo);
    // Ayer: el mismo número y la misma versión (la instantánea no cambia).
    expect(despues.prescribed.planned.days[0]).toEqual(ayerAntes);
    // Hoy rigieron dos versiones: no hay un indicado del día.
    expect(despues.prescribed.planned.days[1]).toEqual({ date: HOY(), state: 'UNDETERMINED', reason: 'PLAN_VERSION_CHANGED', planVersionId: reescrita.planId, mealsWithSeveralOptions: [] });
    // La cena de hoy, con la versión que cita su registro, a mano: pollo 150 g.
    const cena = despues.prescribed.planned.meals.find((m) => m.recordId === deHoy.recordId);
    if (cena?.state !== 'DETERMINED') throw new Error('la cena sin indicado');
    expect(cena.planVersionId).toBe(reescrita.planId);
    expect(cena.value).toBeCloseTo(aMano(polloSolo, 'energyKcal'), 6);
  });
});
