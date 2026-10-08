/**
 * WP-DASHBOARD-PROFESIONAL · API-DSH-04 (línea de tiempo; DL-127), API-PRJ-01 (proyecciones; DL-126) y API-VAN-01 a 04
 * (vistas guardadas; DL-128), con datos reales registrados por la API.
 *
 * Lo que fijan, que es lo que sería fácil romper sin darse cuenta:
 * - ocurrió y registrado son independientes, y una carga tardía se dice (TEST-TIM-001);
 * - una rectificación cuenta una sola vez y una anulación queda en el historial, fuera de los agregados;
 * - el número de «Analizar» es el mismo que el del registro (encargo §11): la suma exacta de lo conocido;
 * - un alcance denegado no aporta ni una entrada, ni un conteo, ni una coincidencia de búsqueda (TEST-DSH-002);
 * - un tercero recibe el mismo 404 que un asesorado inexistente;
 * - ocho claves, ninguna extra, y las cinco sin especificación no inventan nada (TEST-PRJ-001);
 * - una vista guardada es solo configuración y no concede acceso.
 */
import type { INestApplication } from '@nestjs/common';
import {
  CLAVES_DE_PROYECCION,
  LineaDeTiempoResponseSchema,
  ListaDeVistasResponseSchema,
  ProyeccionResponseSchema,
  sumaExacta,
  VistaDeAnalisisResponseSchema,
  type ConfiguracionDeAnalisis,
  type EntradaDeLineaDeTiempo,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { borradorSembrado, circuitoAntropometrico, medicionSembrada, registrarBorrador } from './soporte-antropometria';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoListoParaPlanificarEntrenamiento } from './soporte-entrenamiento';
import { circuitoConPlanActivo, clavesProhibidas } from './soporte-nutricion';
import { abrirBorrador, activar as activarDemo, borradorDeLaDemo, ocurrenciaDeHoy, registrarYConfirmar } from './soporte-por-serie';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto, type Parte } from './soporte-vinculo';

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

const lineaDeTiempo = (pro: Parte, asesoradoId: string, query = '') => conSesion(app, pro.token).get(`/api/v1/advisees/${asesoradoId}/timeline${query}`);
const proyeccion = (pro: Parte, asesoradoId: string, clave: string, query = '') => conSesion(app, pro.token).get(`/api/v1/advisees/${asesoradoId}/projections/${clave}${query}`);
const entradas = async (pro: Parte, asesoradoId: string, query = '') => LineaDeTiempoResponseSchema.parse((await lineaDeTiempo(pro, asesoradoId, query).expect(200)).body);

// ─── Nutrición: comidas con y sin cantidades, rectificada, anulada y cargada tarde ───────────────

interface EscenarioNutricional {
  c: Awaited<ReturnType<typeof circuitoConPlanActivo>>;
  /** Almuerzo de hace 3 días, sin confirmar y rectificado después a las porciones del plan (cargado tarde). */
  rectificado: { recordId: string; energia: string };
  /** Cena de hace 3 días, con las porciones del plan. */
  completo: { recordId: string; energia: string };
  /** Almuerzo de hoy, anulado. */
  anulado: { recordId: string };
  /** Cena de hoy, sin confirmar: un registro sin cantidades. */
  sinCantidades: { recordId: string };
}

async function escenarioNutricional(etiqueta: string): Promise<EscenarioNutricional> {
  const c = await circuitoConPlanActivo(app, etiqueta);
  const hoy = (await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
  const [almuerzo, cena] = hoy.meals as { mealId: string; options: { optionId: string }[] }[];
  const registrar = (comida: { mealId: string; options: { optionId: string }[] }, ocurrio: Date, status: string) =>
    conSesion(app, c.ase.token)
      .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
      .send({ kind: 'PLAN_OPTION', activePlanId: c.planId, dayTypeId: hoy.dayTypes[0].dayTypeId, mealId: comida.mealId, optionId: comida.options[0]!.optionId, occurredAt: ocurrio.toISOString(), consumption: { status }, observation: null })
      .expect(201);
  const a = (await registrar(almuerzo!, haceDias(3), 'UNCONFIRMED')).body.data;
  const rect = await conSesion(app, c.ase.token).post(`/api/v1/nutrition/meal-records/${a.recordId}/consumed-quantities`).send({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: a.version }).expect(201);
  const b = (await registrar(cena!, haceDias(3), 'PLAN_PORTIONS')).body.data;
  const anular = (await registrar(almuerzo!, new Date(), 'PLAN_PORTIONS')).body.data;
  await conSesion(app, c.ase.token).post(`/api/v1/nutrition/meal-records/${anular.recordId}/annulment`).send({ reason: 'Me equivoqué de opción', expectedVersion: anular.version }).expect(201);
  const d = (await registrar(cena!, new Date(), 'UNCONFIRMED')).body.data;
  return {
    c,
    rectificado: { recordId: a.recordId, energia: rect.body.data.consumed.energyKcal.value },
    completo: { recordId: b.recordId, energia: b.consumed.energyKcal.value },
    anulado: { recordId: anular.recordId },
    sinCantidades: { recordId: d.recordId },
  };
}

describe('API-DSH-04 · línea de tiempo de nutrición', () => {
  let e: EscenarioNutricional;
  beforeAll(async () => {
    e = await escenarioNutricional(`ana-tl-${++contador}`);
  }, 120_000);

  it('una entrada por hecho, con ocurrió y registrado independientes, y la carga tardía dicha', async () => {
    const r = await entradas(e.c.pro, e.c.ase.id);
    // El profesional solo trabaja Nutrición con este asesorado: los otros alcances quedan denegados y el aviso de vista
    // parcial es el mismo de API-DSH-03, uno solo y sin nombrar nada.
    expect(r.data.partialView).toBe(true);
    expect(r.data.sourceDomains).toEqual(['NUTRITION']);
    expect(r.data.searchScope).toBe('WHOLE_PERIOD');
    const tipos = r.data.entries.map((x) => x.eventType);
    expect(tipos).toEqual(expect.arrayContaining(['NUTRITION_PLAN_ACTIVATED', 'NUTRITION_OBJECTIVE_SET', 'MEAL_RECORDED']));
    // Una entrada por registro (no por ítem), con los anulados marcados y no borrados.
    expect(r.data.entries.filter((x) => x.eventType === 'MEAL_RECORDED')).toHaveLength(4);

    const tardio = r.data.entries.find((x) => x.timelineEntryId === `meal:${e.rectificado.recordId}`)!;
    expect(tardio.occurredDate).toBe(fechaCivil(haceDias(3)));
    expect(tardio.occurredAt).not.toBe(tardio.recordedAt);
    expect(tardio.recordedLate).toBe(true);
    expect(tardio.state).toBe('RECTIFIED');
    expect(tardio.relations.map((x) => x.kind)).toEqual(expect.arrayContaining(['RECTIFIED', 'EXECUTES_PLAN_VERSION']));
    expect(tardio.author).toMatchObject({ identityId: e.c.ase.id, role: 'ADVISEE' });

    const anulado = r.data.entries.find((x) => x.timelineEntryId === `meal:${e.anulado.recordId}`)!;
    expect(anulado.state).toBe('ANNULLED');
    expect(anulado.relations.find((x) => x.kind === 'ANNULLED')).toBeTruthy();
    const sinCantidades = r.data.entries.find((x) => x.timelineEntryId === `meal:${e.sinCantidades.recordId}`)!;
    expect(sinCantidades.quality).toContain('QUANTITIES_UNCONFIRMED');
    expect(sinCantidades.details.find((d) => d.label === 'Energía registrada')).toBeUndefined();

    // Sin puntajes, cumplimiento ni adherencia en ninguna parte de la respuesta.
    expect(clavesProhibidas(r)).toEqual([]);
  });

  it('el orden es estable: fecha del hecho descendente, y la paginación por cursor no repite ni pierde entradas', async () => {
    const todo = await entradas(e.c.pro, e.c.ase.id, '?limit=50');
    const fechas = todo.data.entries.map((x) => x.occurredDate);
    expect([...fechas].sort().reverse()).toEqual(fechas);
    const vistos: EntradaDeLineaDeTiempo[] = [];
    let cursor: string | null = null;
    do {
      const pagina = await entradas(e.c.pro, e.c.ase.id, `?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      expect(pagina.data.totalMatching).toBe(todo.data.totalMatching);
      vistos.push(...pagina.data.entries);
      cursor = pagina.page.nextCursor;
      expect(pagina.page.hasMore).toBe(cursor !== null);
    } while (cursor);
    expect(vistos.map((x) => x.timelineEntryId)).toEqual(todo.data.entries.map((x) => x.timelineEntryId));
  });

  it('los filtros y la búsqueda recorren todo el período, y totalMatching cuenta solo lo que coincide', async () => {
    const anulados = await entradas(e.c.pro, e.c.ase.id, '?state=ANNULLED');
    expect(anulados.data.entries.map((x) => x.timelineEntryId)).toEqual([`meal:${e.anulado.recordId}`]);
    expect(anulados.data.totalMatching).toBe(1);
    const tardias = await entradas(e.c.pro, e.c.ase.id, '?late=true');
    expect(tardias.data.entries.map((x) => x.timelineEntryId).sort()).toEqual([`meal:${e.completo.recordId}`, `meal:${e.rectificado.recordId}`].sort());
    // La búsqueda no distingue acentos ni mayúsculas, y encuentra más allá de la primera página.
    const cenas = await entradas(e.c.pro, e.c.ase.id, `?q=${encodeURIComponent('CENA')}&limit=1`);
    expect(cenas.data.totalMatching).toBe(2);
    expect(cenas.page.hasMore).toBe(true);
    const comidas = await entradas(e.c.pro, e.c.ase.id, '?type=MEAL_RECORDED&quality=QUANTITIES_UNCONFIRMED');
    expect(comidas.data.entries.map((x) => x.timelineEntryId)).toEqual([`meal:${e.sinCantidades.recordId}`]);
  });

  it('una consulta inválida es 400 antes del PDP: parámetro desconocido, cursor alterado, período largo o invertido', async () => {
    expect((await lineaDeTiempo(e.c.pro, e.c.ase.id, '?orden=asc').expect(400)).body.error.details.issues[0]).toMatchObject({ code: 'UNKNOWN_QUERY_PARAMETER', path: 'orden' });
    expect((await lineaDeTiempo(e.c.pro, e.c.ase.id, '?cursor=no-es-un-cursor').expect(400)).body.error.code).toBe('INVALID_CURSOR');
    expect((await lineaDeTiempo(e.c.pro, e.c.ase.id, '?periodStart=2025-01-01&periodEnd=2026-01-03').expect(400)).body.error.details.issues[0].code).toBe('PERIOD_TOO_LONG');
    expect((await lineaDeTiempo(e.c.pro, e.c.ase.id, '?periodStart=2026-02-02&periodEnd=2026-02-01').expect(400)).body.error.details.issues[0].code).toBe('INVALID_PERIOD');
    expect((await lineaDeTiempo(e.c.pro, e.c.ase.id, '?domain=FINANZAS').expect(400)).body.error.details.issues[0]).toMatchObject({ code: 'INVALID_FILTER', path: 'domain' });
  });
});

describe('API-PRJ-01 · nutrición prescripta y registrada', () => {
  let e: EscenarioNutricional;
  beforeAll(async () => {
    e = await escenarioNutricional(`ana-nut-${++contador}`);
  }, 120_000);

  it('el día es la suma exacta de lo conocido —el mismo número del registro—, y la rectificación cuenta una vez', async () => {
    const r = ProyeccionResponseSchema.parse((await proyeccion(e.c.pro, e.c.ase.id, 'NUTRITION_PRESCRIBED_VS_RECORDED').expect(200)).body);
    expect(r.data).toMatchObject({ projectionKey: 'NUTRITION_PRESCRIBED_VS_RECORDED', dataState: 'AVAILABLE', partialView: false, derivation: { method: 'SUM_SOURCE_PER_100G_V1' } });
    const resultado = r.data.result!;
    if (resultado.kind !== 'NUTRITION_PRESCRIBED_VS_RECORDED') throw new Error('otra clave');
    const hace3 = resultado.recorded.points.find((p) => p.date === fechaCivil(haceDias(3)))!;
    expect(hace3.value).toBe(Number(sumaExacta([e.rectificado.energia, e.completo.energia])));
    expect(hace3).toMatchObject({ quality: 'COMPLETE', n: 2, corrected: true });
    // Hoy: el anulado no cuenta y el único efectivo no tiene cantidades → desconocido, no cero.
    const hoy = resultado.recorded.points.find((p) => p.date === fechaCivil(new Date()))!;
    expect(hoy).toMatchObject({ value: null, quality: 'UNKNOWN', missing: [{ reason: 'SIN_CANTIDADES', count: 1 }] });
    expect(resultado.coverage).toMatchObject({ records: 3, recordsWithQuantities: 2, recordsWithoutQuantities: 1, annulledExcluded: 1, rectifiedCountedOnce: 1, daysWithRecords: 2 });
    // El requerimiento del objetivo es un escalón con su vigencia; lo previsto no se suma como objetivo del día.
    expect(resultado.prescribed.energyRequirement).toEqual([expect.objectContaining({ value: 2200, unit: 'kcal/day', to: null })]);
    expect(resultado.prescribed.note).toMatch(/alternativas/);
    expect(resultado.planVersions).toHaveLength(1);
    expect(clavesProhibidas(r)).toEqual([]);
  });

  it('la semana es la media de los días con valor, con su denominador; nunca la suma dividida por siete', async () => {
    const r = ProyeccionResponseSchema.parse((await proyeccion(e.c.pro, e.c.ase.id, 'NUTRITION_PRESCRIBED_VS_RECORDED', '?grain=WEEK').expect(200)).body);
    const resultado = r.data.result!;
    if (resultado.kind !== 'NUTRITION_PRESCRIBED_VS_RECORDED') throw new Error('otra clave');
    const conValor = resultado.recorded.points.filter((p) => p.value !== null);
    expect(conValor).toHaveLength(1);
    expect(conValor[0]!.value).toBe(Number(sumaExacta([e.rectificado.energia, e.completo.energia])));
    expect(conValor[0]!.coverage).toMatchObject({ daysWithData: 1 });
  });

  it('ocho claves y ninguna extra; las cinco sin especificación no inventan datos; filtros no aplicables son 400', async () => {
    for (const clave of CLAVES_DE_PROYECCION) {
      const r = ProyeccionResponseSchema.parse((await proyeccion(e.c.pro, e.c.ase.id, clave).expect(200)).body);
      if (['NUTRITION_PRESCRIBED_VS_RECORDED', 'TRAINING_PROGRESSION_BY_EXERCISE', 'ANTHROPOMETRY_LONGITUDINAL'].includes(clave)) continue;
      // El profesional solo tiene Nutrición: las de Entrenamiento no se ven, sin revelar nada.
      expect(r.data).toMatchObject({ dataState: 'NOT_AVAILABLE_TO_VIEW', result: null, reason: null });
    }
    expect((await proyeccion(e.c.pro, e.c.ase.id, 'TRAINING_ONE_REP_MAX').expect(400)).body.error.details.issues[0].code).toBe('UNKNOWN_PROJECTION_KEY');
    expect((await proyeccion(e.c.pro, e.c.ase.id, 'NUTRITION_PRESCRIBED_VS_RECORDED', `?exerciseId=e:${randomUUID()}`).expect(400)).body.error.details.issues[0]).toMatchObject({ code: 'NOT_APPLICABLE_QUERY_PARAMETER', path: 'exerciseId' });
    expect((await proyeccion(e.c.pro, e.c.ase.id, 'NUTRITION_PRESCRIBED_VS_RECORDED', '?metric=ADHERENCE').expect(400)).body.error.details.issues[0]).toMatchObject({ code: 'INVALID_FILTER', path: 'metric' });
  });

  it('sin registros en el período: NO_DATA con su motivo, nunca una serie de ceros', async () => {
    const r = ProyeccionResponseSchema.parse((await proyeccion(e.c.pro, e.c.ase.id, 'NUTRITION_PRESCRIBED_VS_RECORDED', '?periodStart=2026-01-01&periodEnd=2026-01-31').expect(200)).body);
    expect(r.data).toMatchObject({ dataState: 'NO_DATA', reason: 'NO_RECORDS_IN_PERIOD' });
    const resultado = r.data.result!;
    if (resultado.kind !== 'NUTRITION_PRESCRIBED_VS_RECORDED') throw new Error('otra clave');
    expect(resultado.recorded.points).toEqual([]);
    expect(resultado.recorded.gaps).toEqual([{ from: '2026-01-01', to: '2026-01-31', days: 31, state: 'NO_DATA' }]);
  });
});

// ─── Entrenamiento: la sesión «Piernas A» registrada por la API ──────────────────────────────────

describe('API-PRJ-01 y API-DSH-04 · entrenamiento por número de serie', () => {
  let plan: Awaited<ReturnType<typeof borradorDeLaDemo>>;
  let executionId: string;
  let sentadilla: string;
  beforeAll(async () => {
    plan = await borradorDeLaDemo(app, `ana-trn-${++contador}`);
    await activarDemo(app, plan).expect(200);
    const ocurrencia = await ocurrenciaDeHoy(app, plan.ase);
    executionId = (await registrarYConfirmar(app, plan, await abrirBorrador(app, plan.ase, ocurrencia))).executionId;
    sentadilla = `e:${plan.ejercicios.get('sentadilla_goblet')!.exerciseId}`;
  }, 180_000);

  it('los ejercicios del período, y la carga de la serie 2 sesión por sesión, con el objetivo de esa serie', async () => {
    const lista = ProyeccionResponseSchema.parse((await proyeccion(plan.pro, plan.ase.id, 'TRAINING_PROGRESSION_BY_EXERCISE').expect(200)).body).data.result!;
    if (lista.kind !== 'TRAINING_PROGRESSION_BY_EXERCISE') throw new Error('otra clave');
    expect(lista.progression).toBeNull();
    expect(lista.exercises.find((x) => x.exerciseKey === sentadilla)).toMatchObject({ sessions: 1, setNumbers: [1, 2, 3], loadUnits: ['kg'] });

    const carga = ProyeccionResponseSchema.parse((await proyeccion(plan.pro, plan.ase.id, 'TRAINING_PROGRESSION_BY_EXERCISE', `?exerciseId=${sentadilla}&metric=LOAD&setIndex=2`).expect(200)).body).data.result!;
    if (carga.kind !== 'TRAINING_PROGRESSION_BY_EXERCISE') throw new Error('otra clave');
    expect(carga.progression).toMatchObject({ exerciseKey: sentadilla, metric: 'LOAD', setIndex: 2, unit: 'kg' });
    expect(carga.progression!.series.points.map((p) => p.value)).toEqual([18]);
    expect(carga.progression!.series.points[0]!.sources).toEqual([{ type: 'TRAINING_EXECUTION', id: executionId }]);
  });

  it('RIR nulo es «sin informar»: no es un punto ni un cero; las series registradas se cuentan y la semana suma', async () => {
    const rir = ProyeccionResponseSchema.parse((await proyeccion(plan.pro, plan.ase.id, 'TRAINING_PROGRESSION_BY_EXERCISE', `?exerciseId=${sentadilla}&metric=RIR&setIndex=3`).expect(200)).body).data.result!;
    if (rir.kind !== 'TRAINING_PROGRESSION_BY_EXERCISE') throw new Error('otra clave');
    expect(rir.progression!.series.points).toEqual([]);
    expect(rir.progression!.series.notes.join(' ')).toMatch(/no tiene dato de esta serie/);
    const series = ProyeccionResponseSchema.parse((await proyeccion(plan.pro, plan.ase.id, 'TRAINING_PROGRESSION_BY_EXERCISE', `?exerciseId=${sentadilla}&metric=SETS_RECORDED&grain=WEEK`).expect(200)).body).data.result!;
    if (series.kind !== 'TRAINING_PROGRESSION_BY_EXERCISE') throw new Error('otra clave');
    expect(series.progression!.series.points.map((p) => p.value)).toEqual([3]);
    // La semana solo agrega conteos: la carga de una serie no se suma ni se promedia.
    expect((await proyeccion(plan.pro, plan.ase.id, 'TRAINING_PROGRESSION_BY_EXERCISE', `?exerciseId=${sentadilla}&metric=LOAD&grain=WEEK`).expect(400)).body.error.details.issues[0].code).toBe('GRAIN_NOT_ALLOWED');
  });

  it('la sesión aparece en la línea de tiempo con su relación al plan, y el filtro por ejercicio la encuentra', async () => {
    const r = await entradas(plan.pro, plan.ase.id, `?exerciseId=${sentadilla}`);
    expect(r.data.entries.map((x) => x.timelineEntryId)).toEqual([`tses:${executionId}`]);
    const sesion = r.data.entries[0]!;
    expect(sesion).toMatchObject({ domain: 'TRAINING', eventType: 'TRAINING_SESSION_RECORDED', state: 'EFFECTIVE', planVersionId: plan.planId });
    expect(sesion.relations).toEqual([expect.objectContaining({ kind: 'EXECUTES_PLAN_VERSION', target: { type: 'TRAINING_PLAN_VERSION', id: plan.planId } })]);
    expect(sesion.details.find((d) => d.label === 'Condición')?.value).toBe('Realizada');
  });
});

// ─── Antropometría: dos tomas a más de 92 días ───────────────────────────────────────────────────

describe('API-PRJ-01 · antropometría longitudinal', () => {
  it('lee más de 92 días (ANT-06 conserva su límite) y cada toma es un punto del mismo grupo comparable', async () => {
    const c = await circuitoAntropometrico(app, prisma, `ana-ant-${++contador}`);
    const reciente = await borradorSembrado(prisma, c);
    await medicionSembrada(prisma, c, reciente, { valor: 71.4 });
    await registrarBorrador(prisma, reciente);
    // Una toma de hace 100 días, con su fecha del hecho explícita.
    const vieja = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","procedencia","momento_de_ocurrencia") VALUES ('${vieja}','${c.pro.id}','${c.ase.id}','{"prueba":"dashboard"}', now() - interval '100 days')`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "medicion_antropometrica" ("id","evaluacion_id","metrica","valor","unidad_de_origen","protocolo_version_id","origen","clase","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${vieja}','peso',73.9,'kg','${c.protocoloVersionId}','CAPTURA_DIRECTA','MEDIDO','{"prueba":"dashboard"}', now() - interval '100 days')`,
    );
    await registrarBorrador(prisma, vieja);

    // Una toma de otro profesional con el mismo asesorado: existe, no se muestra y la proyección lo avisa.
    const otro = await prepararProfesional(app, `ana-ant-otro-${contador}`, ['ANTROPOMETRIA']);
    const ajena = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","procedencia","momento_de_ocurrencia") VALUES ('${ajena}','${otro.id}','${c.ase.id}','{"prueba":"dashboard"}', now() - interval '10 days')`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "medicion_antropometrica" ("id","evaluacion_id","metrica","valor","unidad_de_origen","protocolo_version_id","origen","clase","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${ajena}','peso',99.9,'kg','${c.protocoloVersionId}','CAPTURA_DIRECTA','MEDIDO','{"prueba":"dashboard"}', now() - interval '10 days')`,
    );
    await registrarBorrador(prisma, ajena);

    const desde = fechaCivil(haceDias(120));
    await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?periodStart=${desde}`).expect(400);
    const r = ProyeccionResponseSchema.parse((await proyeccion(c.pro, c.ase.id, 'ANTHROPOMETRY_LONGITUDINAL', `?periodStart=${desde}&metric=peso`).expect(200)).body);
    const resultado = r.data.result!;
    if (resultado.kind !== 'ANTHROPOMETRY_LONGITUDINAL') throw new Error('otra clave');
    expect(resultado.available).toEqual([expect.objectContaining({ metricCode: 'peso', observations: 2, units: ['kg'] })]);
    const peso = resultado.series[0]!;
    expect(peso.points.map((p) => p.value)).toEqual([73.9, 71.4]);
    expect(new Set(peso.points.map((p) => p.segment)).size).toBe(1);
    expect(resultado.honesty).toEqual({ interpolated: false, imputed: false, carriedForward: false });
    expect(r.data.partialView).toBe(true);
    expect(JSON.stringify(r)).not.toContain('99.9');
    // Sin pedir métricas, solo la lista disponible: no se arma ninguna serie.
    const lista = ProyeccionResponseSchema.parse((await proyeccion(c.pro, c.ase.id, 'ANTHROPOMETRY_LONGITUDINAL').expect(200)).body).data.result!;
    if (lista.kind !== 'ANTHROPOMETRY_LONGITUDINAL') throw new Error('otra clave');
    expect(lista.series).toEqual([]);
  });
});

// ─── Permisos: alcance revocado, tercero y anti-enumeración ──────────────────────────────────────

describe('Permisos del entorno profesional', () => {
  it('un alcance revocado no aporta entradas, conteos ni coincidencias de búsqueda, y su proyección no revela nada', async () => {
    const etiqueta = `ana-parcial-${++contador}`;
    const pro = await prepararProfesional(app, etiqueta, ['ENTRENAMIENTO', 'NUTRICION']);
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta, pro);
    await vinculoCompleto(app, pro, c.ase, 'NUTRICION');
    // Antes de revocar, el objetivo de entrenamiento («Mejorar la fuerza…») está y se encuentra.
    const antes = await entradas(pro, c.ase.id, '?q=fuerza');
    expect(antes.data.totalMatching).toBe(1);
    expect(antes.data.entries[0]!.eventType).toBe('TRAINING_OBJECTIVE_SET');

    await revocarB2(app, c.ase, c.consentId).expect(200);
    const despues = await entradas(pro, c.ase.id, '?q=fuerza');
    expect(despues.data).toMatchObject({ partialView: true, totalMatching: 0, entries: [], sourceDomains: ['NUTRITION'] });
    const todo = await entradas(pro, c.ase.id);
    expect(todo.data.entries.some((x) => x.domain === 'TRAINING')).toBe(false);

    const p = ProyeccionResponseSchema.parse((await proyeccion(pro, c.ase.id, 'TRAINING_PROGRESSION_BY_EXERCISE').expect(200)).body);
    expect(p.data).toMatchObject({ dataState: 'NOT_AVAILABLE_TO_VIEW', partialView: true, result: null, sourceDomains: [] });
    expect(JSON.stringify(p)).not.toContain('fuerza');
  });

  it('un tercero recibe el mismo 404 que un asesorado inexistente, en la línea de tiempo y en las proyecciones', async () => {
    const etiqueta = `ana-tercero-${++contador}`;
    const pro = await prepararProfesional(app, etiqueta, ['NUTRICION']);
    const otro = await prepararProfesional(app, `${etiqueta}-otro`, ['NUTRICION']);
    const ase = await prepararAsesorado(app, etiqueta, { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    const ajeno = await lineaDeTiempo(otro, ase.id).expect(404);
    const inexistente = await lineaDeTiempo(otro, randomUUID()).expect(404);
    expect(ajeno.body.error.code).toBe(inexistente.body.error.code);
    expect((await proyeccion(otro, ase.id, 'NUTRITION_PRESCRIBED_VS_RECORDED').expect(404)).body.error.code).toBe(inexistente.body.error.code);
    // Con el vínculo, el profesional sí lee (vacío): la diferencia es el vínculo, no la existencia.
    expect((await entradas(pro, ase.id)).data.sourceDomains).toEqual(['NUTRITION']);
  });
});

// ─── API-VAN · vistas guardadas ──────────────────────────────────────────────────────────────────

const configuracion = (cambios: Partial<ConfiguracionDeAnalisis> = {}): ConfiguracionDeAnalisis => ({
  schemaVersion: 1,
  metrics: [
    { metricId: 'nutricion.energia', exerciseKey: null, setIndex: null, unit: null },
    { metricId: 'antropometria.peso', exerciseKey: null, setIndex: null, unit: null },
  ],
  mode: 'PANELS',
  grain: 'DAY',
  period: { kind: 'LAST_DAYS', days: 90 },
  layers: { planBands: true, events: true },
  referenceDays: 7,
  comparison: null,
  ...cambios,
});

describe('API-VAN-01 a 04 · vistas de análisis guardadas', () => {
  it('crear, listar, reemplazar con versión y borrar con la misma clave; lo ajeno es 404 y lo concurrente 409', async () => {
    const etiqueta = `ana-van-${++contador}`;
    const pro = await prepararProfesional(app, etiqueta, ['NUTRICION']);
    const otro = await prepararProfesional(app, `${etiqueta}-otro`, ['ANTROPOMETRIA']);
    const s = conSesion(app, pro.token);
    const creada = VistaDeAnalisisResponseSchema.parse((await s.post('/api/v1/me/analysis-views', claveDeIdempotencia()).send({ usage: 'ANALYSIS', name: 'Peso y alimentación', configuration: configuracion() }).expect(201)).body).data;
    expect(creada).toMatchObject({ usage: 'ANALYSIS', name: 'Peso y alimentación', version: 'v1' });
    expect(ListaDeVistasResponseSchema.parse((await s.get('/api/v1/me/analysis-views').expect(200)).body).data.map((v) => v.viewId)).toEqual([creada.viewId]);

    const cambiada = (await s.put(`/api/v1/me/analysis-views/${creada.viewId}`).send({ expectedVersion: 'v1', name: 'Peso y alimentación (semanal)', configuration: configuracion({ grain: 'WEEK' }) }).expect(200)).body.data;
    expect(cambiada).toMatchObject({ version: 'v2', configuration: { grain: 'WEEK' } });
    expect((await s.put(`/api/v1/me/analysis-views/${creada.viewId}`).send({ expectedVersion: 'v1', name: 'Vieja', configuration: configuracion() }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    // Una configuración de indicadores no entra en una vista de «Analizar».
    const indicadores = { schemaVersion: 1, metrics: [{ metricId: 'antropometria.peso', exerciseKey: null, setIndex: null, unit: null }] };
    expect((await s.put(`/api/v1/me/analysis-views/${creada.viewId}`).send({ expectedVersion: 'v2', name: 'Otra', configuration: indicadores }).expect(422)).body.error.details.issues[0].code).toBe('CONFIGURATION_USAGE_MISMATCH');

    // La vista de otro profesional: el mismo 404 que una inexistente, también al borrar.
    const ajena = conSesion(app, otro.token);
    expect((await ajena.put(`/api/v1/me/analysis-views/${creada.viewId}`).send({ expectedVersion: 'v2', name: 'Robada', configuration: configuracion() }).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect((await ajena.delete(`/api/v1/me/analysis-views/${creada.viewId}`).set('Idempotency-Key', claveDeIdempotencia()).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');

    const clave = claveDeIdempotencia();
    await s.delete(`/api/v1/me/analysis-views/${creada.viewId}`).set('Idempotency-Key', clave).expect(204);
    await s.delete(`/api/v1/me/analysis-views/${creada.viewId}`).set('Idempotency-Key', clave).expect(204);
    await s.delete(`/api/v1/me/analysis-views/${creada.viewId}`).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    expect((await s.get('/api/v1/me/analysis-views').expect(200)).body.data).toEqual([]);
    // Cada escritura quedó en la auditoría.
    const auditadas = await prisma.registroDeAuditoria.findMany({ where: { actorId: pro.id, operacion: { in: ['API-VAN-02', 'API-VAN-03', 'API-VAN-04'] }, resultado: 'EXITO' } });
    expect(auditadas.map((a) => a.operacion).sort()).toEqual(['API-VAN-02', 'API-VAN-03', 'API-VAN-04']);
  });

  it('solo configuración: un campo de más es 400, y a lo sumo una configuración de indicadores por profesional', async () => {
    const pro = await prepararProfesional(app, `ana-van-${++contador}`, ['ANTROPOMETRIA']);
    const s = conSesion(app, pro.token);
    // No hay dónde guardar un valor ni un asesorado: el esquema estricto lo rechaza.
    expect((await s.post('/api/v1/me/analysis-views', claveDeIdempotencia()).send({ usage: 'ANALYSIS', name: 'Con datos', configuration: { ...configuracion(), adviseeId: randomUUID() } }).expect(400)).body.error.code).toBe('UNKNOWN_FIELD');
    // Más de tres métricas no entra.
    const cuatro = configuracion({ metrics: ['nutricion.energia', 'nutricion.proteinas', 'nutricion.grasas', 'antropometria.peso'].map((metricId) => ({ metricId, exerciseKey: null, setIndex: null, unit: null })) });
    await s.post('/api/v1/me/analysis-views', claveDeIdempotencia()).send({ usage: 'ANALYSIS', name: 'Cuatro', configuration: cuatro }).expect(400);
    const indicadores = { schemaVersion: 1, metrics: [{ metricId: 'antropometria.peso', exerciseKey: null, setIndex: null, unit: null }] };
    await s.post('/api/v1/me/analysis-views', claveDeIdempotencia()).send({ usage: 'SUMMARY_INDICATORS', name: 'Indicadores', configuration: indicadores }).expect(201);
    expect((await s.post('/api/v1/me/analysis-views', claveDeIdempotencia()).send({ usage: 'SUMMARY_INDICATORS', name: 'Otros', configuration: indicadores }).expect(409)).body.error.code).toBe('RESOURCE_CONFLICT');
  });

  it('un asesorado no guarda vistas: 403', async () => {
    const ase = await prepararAsesorado(app, `ana-van-ase-${++contador}`, { a3: true });
    await conSesion(app, ase.token).get('/api/v1/me/analysis-views').expect(403);
    await conSesion(app, ase.token).post('/api/v1/me/analysis-views', claveDeIdempotencia()).send({ usage: 'ANALYSIS', name: 'Mía', configuration: configuracion() }).expect(403);
  });
});
