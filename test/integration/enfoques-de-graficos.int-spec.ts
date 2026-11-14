/**
 * WP-GRAFICOS GR-27 (DEUDA_LEGAJO DL-174) · los enfoques, por la API real y contra PostgreSQL:
 * - **TEST-GRF-084:** los enfoques del profesional: crear con Idempotency-Key, listar, cambiar con la versión leída y
 *   borrar (204 también al reintentar); solo un profesional (403).
 * - **TEST-GRF-085:** un enfoque de otro profesional responde el mismo 404 que uno inexistente, al cambiarlo, al borrarlo
 *   y al elegirlo, y no aparece en su lista.
 * - **TEST-GRF-086:** los topes (50 enfoques, 6 gráficos, 3 series) y el contenido estricto: un valor o la persona dentro
 *   del contenido no se guardan.
 * - **TEST-GRF-087:** elegir para la persona y para cada plan, con la versión esperada; un plan ajeno, de otra persona, de
 *   la otra área o inexistente es el mismo 404; dos pestañas que eligen a la vez no dejan dos (la base, sin pausas).
 * - **TEST-GRF-088:** con la persona, el PDP de hoy: sin un área permitida, API-GRF-05 a 07 responden el 404 de lo
 *   inexistente y lo elegido queda guardado; un área sin acceso no se lee ni se elige; el reintento de quitar vuelve a
 *   decidir.
 * - **TEST-GRF-089:** borrar un enfoque quita sus elecciones; cada escritura queda en la auditoría y cada decisión en el
 *   registro del PDP; la base sostiene el ámbito, el dueño y el plan aunque el servicio se equivocara.
 *
 * Mutaciones que estas pruebas matan (descritas; quedan para correrlas con la base de la CI): dejar leer o cambiar el
 * enfoque al otro profesional; aceptar un valor dentro del contenido; dejar pasar el enfoque 51; elegir sin el PDP o con
 * cualquier área para un plan; leer la elección del plan de un área sin acceso; sacar el índice único de la persona;
 * guardar la decisión de quitar sin la captura que la vuelve a tomar en el reintento; dejar las elecciones de un enfoque
 * borrado.
 */
import type { INestApplication } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { esperarQueEsperen, pidDeLaTransaccion } from './soporte-concurrencia';
import { cuerpoDeEvaluacionDeEntrenamiento, cuerpoDeObjetivoDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { alimento, cuerpoDeEvaluacion, cuerpoDeObjetivo, estructura } from './soporte-nutricion';
import { pausar, prepararAsesorado, prepararProfesional, reanudar, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

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

const ENFOQUES = '/api/v1/me/chart-sets';
const enfoque = (setId: string) => `${ENFOQUES}/${setId}`;
const elecciones = (adviseeId: string) => `/api/v1/advisees/${adviseeId}/chart-set-choices`;
const eleccion = (adviseeId: string, choiceId: string) => `${elecciones(adviseeId)}/${choiceId}`;

const FUERZA = { kind: 'SUGGESTED', chartId: 'entrenamiento.fuerza-estimada', exercise: { kind: 'MOST_RECORDED', rank: 1 }, bodyMetric: null };
const ENERGIA = { kind: 'SUGGESTED', chartId: 'nutricion.energia-por-dia', exercise: null, bodyMetric: null };
const SERIE = { metricId: 'nutricion.carbohidratos', exerciseKey: null, setIndex: null, unit: null };
const ARMADO = {
  kind: 'CUSTOM',
  title: 'Carbohidratos y carga',
  series: [SERIE, { metricId: 'entrenamiento.carga', exerciseKey: `e:${randomUUID()}`, setIndex: 1, unit: 'kg' }],
  mode: 'PANELS',
};
const contenido = (charts: unknown[] = [FUERZA, ENERGIA]) => ({ schemaVersion: 1, charts });
const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'SIEMBRA', superficie: null, requestId: null };
const comoJson = (valor: unknown) => valor as Prisma.InputJsonValue;
const ambitos = (data: { scope: string }[]) => data.map((x) => x.scope);

type Area = 'ENTRENAMIENTO' | 'NUTRICION';

interface Escenario {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly vinculos: Partial<Record<Area, string>>;
  readonly trainingPlanId: string | null;
  readonly nutritionPlanId: string | null;
}

/** Un plan de Entrenamiento del profesional con la persona (un borrador alcanza: la elección es del plan, no de una versión). */
async function planDeEntrenamiento(pro: Parte, ase: Parte): Promise<string> {
  const s = conSesion(app, pro.token);
  const ev = await s.post(`/api/v1/advisees/${ase.id}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
  const ob = await s.post(`/api/v1/advisees/${ase.id}/training/objectives`).send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId)).expect(201);
  const plan = await s.post(`/api/v1/advisees/${ase.id}/training/plans`).send({ objectiveVersionId: ob.body.data.versionId, initialStructure: estructuraDeEntrenamiento() }).expect(201);
  return plan.body.data.trainingPlanId as string;
}

/** Un plan de Nutrición del profesional con la persona. */
async function planNutricional(pro: Parte, ase: Parte): Promise<string> {
  const s = conSesion(app, pro.token);
  const ev = await s.post(`/api/v1/advisees/${ase.id}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(201);
  const ob = await s.post(`/api/v1/advisees/${ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(ev.body.data.evaluationId)).expect(201);
  const [arroz, pollo] = [await alimento(app, pro, 'Arroz blanco'), await alimento(app, pro, 'Pechuga de pollo')];
  const plan = await s.post(`/api/v1/advisees/${ase.id}/nutrition/plans`).send({ objectiveVersionId: ob.body.data.versionId, initialStructure: estructura(arroz, pollo) }).expect(201);
  return plan.body.data.nutritionPlanId as string;
}

/** Un profesional con sus áreas, una persona que acompaña en cada una y, si se pide, un plan propio por área. */
async function escenario(etiqueta: string, areas: readonly Area[] = ['ENTRENAMIENTO', 'NUTRICION'], conPlanes = true): Promise<Escenario> {
  const n = ++contador;
  const pro = await prepararProfesional(app, `grf-${etiqueta}-${n}`, areas);
  const ase = await prepararAsesorado(app, `grf-${etiqueta}-${n}`, { a3: true });
  const vinculos: Partial<Record<Area, string>> = {};
  for (const area of areas) vinculos[area] = (await vinculoCompleto(app, pro, ase, area)).vinculoId;
  return {
    pro,
    ase,
    vinculos,
    trainingPlanId: conPlanes && areas.includes('ENTRENAMIENTO') ? await planDeEntrenamiento(pro, ase) : null,
    nutritionPlanId: conPlanes && areas.includes('NUTRICION') ? await planNutricional(pro, ase) : null,
  };
}

async function crearEnfoque(pro: Parte, nombre = 'Foco en fuerza', charts?: unknown[]): Promise<{ setId: string; version: string }> {
  return (await conSesion(app, pro.token).post(ENFOQUES).send({ name: nombre, content: contenido(charts) }).expect(201)).body.data;
}

function elegir(pro: Parte, adviseeId: string, cuerpo: Record<string, unknown>) {
  return conSesion(app, pro.token).put(elecciones(adviseeId)).send(cuerpo);
}

async function pausarArea(e: Escenario, area: Area): Promise<void> {
  const vinculo = e.vinculos[area] as string;
  await pausar(app, e.pro.token, vinculo, await versionDeVinculo(app, e.pro.token, vinculo)).expect(200);
}

async function reanudarArea(e: Escenario, area: Area): Promise<void> {
  const vinculo = e.vinculos[area] as string;
  await reanudar(app, e.pro.token, vinculo, await versionDeVinculo(app, e.pro.token, vinculo)).expect(200);
}

// ─── TEST-GRF-084 · los enfoques del profesional ─────────────────────────────────────────────────────────────

describe('TEST-GRF-084 · los enfoques del profesional: crear, listar, cambiar con la versión y borrar (API-GRF-01 a 04)', () => {
  it('crear con la misma clave no duplica; listar trae el contenido y el más cambiado primero; cambiar pide la versión leída', async () => {
    const pro = await prepararProfesional(app, `grf-crud-${++contador}`, ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    const clave = claveDeIdempotencia();
    const cuerpo = { name: '  Foco en fuerza  ', content: contenido([FUERZA, ARMADO]) };
    const creado = (await s.post(ENFOQUES, clave).send(cuerpo).expect(201)).body.data;
    expect(creado).toMatchObject({ name: 'Foco en fuerza', choices: 0, version: 'v1', content: contenido([FUERZA, ARMADO]) });
    const repetido = (await s.post(ENFOQUES, clave).send(cuerpo).expect(201)).body.data;
    expect(repetido.setId).toBe(creado.setId);
    expect((await s.post(ENFOQUES, clave).send({ ...cuerpo, name: 'Otro' }).expect(409)).body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await prisma.conjuntoDeGraficos.count({ where: { profesionalId: pro.id } })).toBe(1);
    expect((await s.get(ENFOQUES).expect(200)).body.data).toEqual([creado]);
    await s.get(`${ENFOQUES}?x=1`).expect(400);

    const cambiado = (await s.put(enfoque(creado.setId)).send({ expectedVersion: 'v1', name: 'Foco en fuerza, bloque 2', content: contenido([ENERGIA]) }).expect(200)).body.data;
    expect(cambiado).toMatchObject({ setId: creado.setId, name: 'Foco en fuerza, bloque 2', version: 'v2', content: contenido([ENERGIA]), choices: 0 });
    expect((await s.put(enfoque(creado.setId)).send({ expectedVersion: 'v1', name: 'Viejo', content: contenido() }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    const otro = await crearEnfoque(pro, 'Foco en las comidas', [ENERGIA]);
    expect((await s.get(ENFOQUES).expect(200)).body.data.map((x: { setId: string }) => x.setId)).toEqual([otro.setId, creado.setId]);
  });

  it('borrar responde 204, también al reintentar con la misma clave; con otra clave, el 404 de lo que ya no está; sin clave, 400', async () => {
    const pro = await prepararProfesional(app, `grf-borrar-${++contador}`, ['NUTRICION']);
    const s = conSesion(app, pro.token);
    const creado = await crearEnfoque(pro);
    const clave = claveDeIdempotencia();
    await s.delete(enfoque(creado.setId)).set('Idempotency-Key', clave).expect(204);
    await s.delete(enfoque(creado.setId)).set('Idempotency-Key', clave).expect(204);
    await s.delete(enfoque(creado.setId)).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    await s.delete(enfoque(creado.setId)).expect(400);
    expect(await prisma.conjuntoDeGraficos.count({ where: { profesionalId: pro.id } })).toBe(0);
  });

  it('solo un profesional verificado y habilitado: una persona recibe 403 en las cuatro operaciones de los enfoques', async () => {
    const ase = await prepararAsesorado(app, `grf-403-${++contador}`, { a3: true });
    const s = conSesion(app, ase.token);
    const respuestas = [
      await s.get(ENFOQUES),
      await s.post(ENFOQUES).send({ name: 'Mío', content: contenido() }),
      await s.put(enfoque(randomUUID())).send({ expectedVersion: 'v1', name: 'Mío', content: contenido() }),
      await s.delete(enfoque(randomUUID())).set('Idempotency-Key', claveDeIdempotencia()),
    ];
    expect(respuestas.map((r) => [r.status, r.body.error?.code])).toEqual(Array.from({ length: 4 }, () => [403, 'ACTION_FORBIDDEN']));
    expect(await prisma.conjuntoDeGraficos.count({ where: { profesionalId: ase.id } })).toBe(0);
  });
});

// ─── TEST-GRF-085 · un enfoque ajeno ─────────────────────────────────────────────────────────────────────────

describe('TEST-GRF-085 · un enfoque de otro profesional responde el mismo 404 que uno inexistente (mutación: dejar al otro profesional)', () => {
  it('no aparece en su lista, no lo cambia, no lo borra y no lo elige; el intento queda en la auditoría', async () => {
    const duenio = await prepararProfesional(app, `grf-duenio-${++contador}`, ['ENTRENAMIENTO']);
    const otro = await escenario('ajeno', ['ENTRENAMIENTO'], false);
    const mio = await crearEnfoque(duenio);
    const s = conSesion(app, otro.pro.token);
    const inexistente = randomUUID();
    expect((await s.get(ENFOQUES).expect(200)).body.data).toEqual([]);
    const cambio = { expectedVersion: 'v1', name: 'Mío ahora', content: contenido() };
    const cambios = [await s.put(enfoque(mio.setId)).send(cambio), await s.put(enfoque(inexistente)).send(cambio)];
    const borrados = [await s.delete(enfoque(mio.setId)).set('Idempotency-Key', claveDeIdempotencia()), await s.delete(enfoque(inexistente)).set('Idempotency-Key', claveDeIdempotencia())];
    const elegidos = [
      await elegir(otro.pro, otro.ase.id, { scope: 'PERSON', setId: mio.setId, expectedVersion: null }),
      await elegir(otro.pro, otro.ase.id, { scope: 'PERSON', setId: inexistente, expectedVersion: null }),
    ];
    for (const [delDuenio, deNadie] of [cambios, borrados, elegidos]) {
      expect([delDuenio!.status, deNadie!.status]).toEqual([404, 404]);
      expect(delDuenio!.body).toEqual(deNadie!.body);
    }
    // El enfoque sigue como estaba, y nadie lo eligió.
    expect((await conSesion(app, duenio.token).get(ENFOQUES).expect(200)).body.data).toEqual([expect.objectContaining({ setId: mio.setId, version: 'v1', name: 'Foco en fuerza', choices: 0 })]);
    expect(await prisma.eleccionDeConjuntoDeGraficos.count({ where: { conjuntoId: mio.setId } })).toBe(0);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-GRF-03', resultado: 'RECHAZO', actorId: otro.pro.id, recursoId: mio.setId } })).toBe(1);
  });
});

// ─── TEST-GRF-086 · los topes y el contenido estricto ────────────────────────────────────────────────────────

describe('TEST-GRF-086 · los topes: 50 enfoques por profesional y 6 gráficos por enfoque, y solo referencias (mutación: dejar pasar el 51 o un valor)', () => {
  it('el enfoque 51 responde 422 TOO_MANY_SETS sin crearlo; borrando uno, vuelve a entrar', async () => {
    const pro = await prepararProfesional(app, `grf-tope-${++contador}`, ['NUTRICION']);
    await prisma.conjuntoDeGraficos.createMany({
      data: Array.from({ length: 49 }, (_, i) => ({ profesionalId: pro.id, nombre: `Enfoque ${i + 1}`, contenido: comoJson(contenido([ENERGIA])), procedencia: comoJson(PROCEDENCIA) })),
    });
    const elCincuenta = await crearEnfoque(pro, 'El 50');
    const tope = await conSesion(app, pro.token).post(ENFOQUES).send({ name: 'El 51', content: contenido() }).expect(422);
    expect(tope.body.error.code).toBe('TOO_MANY_SETS');
    expect(await prisma.conjuntoDeGraficos.count({ where: { profesionalId: pro.id } })).toBe(50);
    expect((await conSesion(app, pro.token).get(ENFOQUES).expect(200)).body.data).toHaveLength(50);
    await conSesion(app, pro.token).delete(enfoque(elCincuenta.setId)).set('Idempotency-Key', claveDeIdempotencia()).expect(204);
    await crearEnfoque(pro, 'El 50, otra vez');
  });

  it('siete gráficos, cuatro series, un valor o la persona dentro del contenido, o un nombre vacío: 400, sin guardar nada', async () => {
    const pro = await prepararProfesional(app, `grf-forma-${++contador}`, ['NUTRICION']);
    const s = conSesion(app, pro.token);
    await s.post(ENFOQUES).send({ name: 'Siete', content: contenido(Array.from({ length: 7 }, () => ENERGIA)) }).expect(400);
    await s.post(ENFOQUES).send({ name: 'Cuatro series', content: contenido([{ ...ARMADO, series: [SERIE, SERIE, SERIE, SERIE] }]) }).expect(400);
    await s.post(ENFOQUES).send({ name: 'Con un valor', content: contenido([{ ...ENERGIA, value: 2150 }]) }).expect(400);
    expect((await s.post(ENFOQUES).send({ name: 'Con la persona', content: { ...contenido(), adviseeId: randomUUID() } }).expect(400)).body.error.code).toBe('UNKNOWN_FIELD');
    expect((await s.post(ENFOQUES).send({ name: 'Con una nota', note: 'le duele la rodilla', content: contenido() }).expect(400)).body.error.code).toBe('UNKNOWN_FIELD');
    await s.post(ENFOQUES).send({ name: '   ', content: contenido() }).expect(400);
    expect(await prisma.conjuntoDeGraficos.count({ where: { profesionalId: pro.id } })).toBe(0);
    await s.post(ENFOQUES).send({ name: 'Seis', content: contenido(Array.from({ length: 6 }, () => ENERGIA)) }).expect(201);
  });
});

// ─── TEST-GRF-087 · elegir ───────────────────────────────────────────────────────────────────────────────────

describe('TEST-GRF-087 · elegir para la persona y para cada plan, con la versión esperada, y una sola elección por lugar', () => {
  it('la persona y sus dos planes: 201 al crear y 200 al cambiar; 409 al crear sobre una que ya está o con una versión vieja; choices dice en cuántos lugares', async () => {
    const e = await escenario('elegir');
    const fuerza = await crearEnfoque(e.pro, 'Foco en fuerza', [FUERZA]);
    const comidas = await crearEnfoque(e.pro, 'Foco en las comidas', [ENERGIA]);
    const deLaPersona = (await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: fuerza.setId, expectedVersion: null }).expect(201)).body.data;
    expect(deLaPersona).toMatchObject({ scope: 'PERSON', trainingPlanId: null, nutritionPlanId: null, set: { setId: fuerza.setId, name: 'Foco en fuerza' }, version: 'v1' });
    const delEntrenamiento = (await elegir(e.pro, e.ase.id, { scope: 'TRAINING_PLAN', trainingPlanId: e.trainingPlanId, setId: fuerza.setId, expectedVersion: null }).expect(201)).body.data;
    expect(delEntrenamiento).toMatchObject({ scope: 'TRAINING_PLAN', trainingPlanId: e.trainingPlanId, nutritionPlanId: null });
    const deNutricion = (await elegir(e.pro, e.ase.id, { scope: 'NUTRITION_PLAN', nutritionPlanId: e.nutritionPlanId, setId: comidas.setId, expectedVersion: null }).expect(201)).body.data;
    expect(deNutricion).toMatchObject({ scope: 'NUTRITION_PLAN', trainingPlanId: null, nutritionPlanId: e.nutritionPlanId, set: { setId: comidas.setId, name: 'Foco en las comidas' } });

    expect((await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: comidas.setId, expectedVersion: null }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    const cambiada = (await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: comidas.setId, expectedVersion: 'v1' }).expect(200)).body.data;
    expect(cambiada).toMatchObject({ choiceId: deLaPersona.choiceId, version: 'v2', set: { setId: comidas.setId } });
    expect((await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: fuerza.setId, expectedVersion: 'v1' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');

    const leidas = (await conSesion(app, e.pro.token).get(elecciones(e.ase.id)).expect(200)).body.data;
    expect(ambitos(leidas)).toEqual(['PERSON', 'TRAINING_PLAN', 'NUTRITION_PLAN']);
    expect(leidas[0]).toEqual(cambiada);
    await conSesion(app, e.pro.token).get(`${elecciones(e.ase.id)}?x=1`).expect(400);
    const lista = (await conSesion(app, e.pro.token).get(ENFOQUES).expect(200)).body.data as { setId: string; choices: number }[];
    expect(Object.fromEntries(lista.map((x) => [x.setId, x.choices]))).toEqual({ [fuerza.setId]: 1, [comidas.setId]: 2 });
  });

  it('un plan de otro profesional, de otra persona, de la otra área o inexistente: el mismo 404, sin guardar nada', async () => {
    const e = await escenario('planes');
    const s = await crearEnfoque(e.pro);
    const otraPersona = await prepararAsesorado(app, `grf-planes-otra-${++contador}`, { a3: true });
    await vinculoCompleto(app, e.pro, otraPersona, 'ENTRENAMIENTO');
    const deOtraPersona = await planDeEntrenamiento(e.pro, otraPersona);
    const ajeno = await escenario('planes-ajeno', ['ENTRENAMIENTO']);
    const intentos = [
      { scope: 'TRAINING_PLAN', trainingPlanId: deOtraPersona },
      { scope: 'TRAINING_PLAN', trainingPlanId: ajeno.trainingPlanId },
      { scope: 'TRAINING_PLAN', trainingPlanId: e.nutritionPlanId },
      { scope: 'NUTRITION_PLAN', nutritionPlanId: e.trainingPlanId },
      { scope: 'TRAINING_PLAN', trainingPlanId: randomUUID() },
    ];
    const respuestas = [];
    for (const intento of intentos) respuestas.push(await elegir(e.pro, e.ase.id, { ...intento, setId: s.setId, expectedVersion: null }));
    expect(respuestas.map((r) => r.status)).toEqual([404, 404, 404, 404, 404]);
    for (const r of respuestas) expect(r.body).toEqual(respuestas[4]!.body);
    expect(await prisma.eleccionDeConjuntoDeGraficos.count({ where: { profesionalId: e.pro.id } })).toBe(0);
  });

  it('dos pestañas que eligen a la vez para la persona no dejan dos: la segunda espera a la primera en la base y recibe 409 (mutación: sin el índice único)', async () => {
    const e = await escenario('a-la-vez', ['ENTRENAMIENTO'], false);
    const s = await crearEnfoque(e.pro);
    let segunda: { status: number; body: { error?: { code?: string } } } | null = null;
    let pedido: Promise<unknown> | undefined;
    await prisma.$transaction(
      async (tx) => {
        // La primera pestaña: su elección está escrita y todavía sin confirmar.
        await tx.$executeRaw`
          INSERT INTO "eleccion_de_conjunto_de_graficos" ("profesional_id", "asesorado_id", "ambito", "conjunto_id", "procedencia")
          VALUES (${e.pro.id}::uuid, ${e.ase.id}::uuid, 'PERSONA', ${s.setId}::uuid, '{}'::jsonb)`;
        const pid = await pidDeLaTransaccion(tx);
        pedido = elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: null }).then((r) => {
          segunda = r;
        });
        // La segunda no ve la primera (no está confirmada) y queda esperando en el índice único: la base la ordena.
        await esperarQueEsperen(prisma, 1, { bloqueadoPor: pid, yaPaso: () => segunda !== null, que: 'la segunda elección esperando el índice único' });
        expect(segunda).toBeNull();
      },
      { timeout: 40_000, maxWait: 10_000 },
    );
    await pedido;
    expect(segunda).toMatchObject({ status: 409, body: { error: { code: 'VERSION_CONFLICT' } } });
    expect(await prisma.eleccionDeConjuntoDeGraficos.count({ where: { profesionalId: e.pro.id, asesoradoId: e.ase.id } })).toBe(1);
  });
});

// ─── TEST-GRF-088 · con la persona, el PDP de hoy ────────────────────────────────────────────────────────────

describe('TEST-GRF-088 · sin un área permitida con la persona, API-GRF-05 a 07 responden el 404 de lo inexistente, y lo elegido queda guardado', () => {
  it('con el vínculo en pausa no se lee, no se elige ni se quita; reanudado, todo vuelve como estaba', async () => {
    const e = await escenario('pausa', ['ENTRENAMIENTO']);
    const s = await crearEnfoque(e.pro);
    const deLaPersona = (await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: null }).expect(201)).body.data;
    await elegir(e.pro, e.ase.id, { scope: 'TRAINING_PLAN', trainingPlanId: e.trainingPlanId, setId: s.setId, expectedVersion: null }).expect(201);
    await pausarArea(e, 'ENTRENAMIENTO');
    const pro = conSesion(app, e.pro.token);
    const deNadie = await pro.get(elecciones(randomUUID())).expect(404);
    expect((await pro.get(elecciones(e.ase.id)).expect(404)).body).toEqual(deNadie.body);
    expect((await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: 'v1' }).expect(404)).body).toEqual(deNadie.body);
    expect((await pro.delete(eleccion(e.ase.id, deLaPersona.choiceId)).set('Idempotency-Key', claveDeIdempotencia()).expect(404)).body).toEqual(deNadie.body);
    // Una persona que no acompaña nunca: lo mismo.
    const desconocida = await prepararAsesorado(app, `grf-desconocida-${++contador}`, { a3: true });
    expect((await pro.get(elecciones(desconocida.id)).expect(404)).body).toEqual(deNadie.body);
    // Queda guardado, y la decisión denegada, registrada.
    expect(await prisma.eleccionDeConjuntoDeGraficos.count({ where: { profesionalId: e.pro.id, asesoradoId: e.ase.id } })).toBe(2);
    expect(await prisma.decisionDeAcceso.count({ where: { operacion: 'API-GRF-05', actorId: e.pro.id, sujetoId: e.ase.id, resultado: 'DENEGADA' } })).toBeGreaterThan(0);
    await reanudarArea(e, 'ENTRENAMIENTO');
    expect(ambitos((await pro.get(elecciones(e.ase.id)).expect(200)).body.data)).toEqual(['PERSON', 'TRAINING_PLAN']);
  });

  it('un área sin acceso no se lee ni se elige: con Nutrición en pausa, siguen la persona y el plan de Entrenamiento (mutación: leer todos los ámbitos)', async () => {
    const e = await escenario('area');
    const s = await crearEnfoque(e.pro);
    await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: null }).expect(201);
    await elegir(e.pro, e.ase.id, { scope: 'TRAINING_PLAN', trainingPlanId: e.trainingPlanId, setId: s.setId, expectedVersion: null }).expect(201);
    const deNutricion = (await elegir(e.pro, e.ase.id, { scope: 'NUTRITION_PLAN', nutritionPlanId: e.nutritionPlanId, setId: s.setId, expectedVersion: null }).expect(201)).body.data;
    await pausarArea(e, 'NUTRICION');
    const pro = conSesion(app, e.pro.token);
    expect(ambitos((await pro.get(elecciones(e.ase.id)).expect(200)).body.data)).toEqual(['PERSON', 'TRAINING_PLAN']);
    await elegir(e.pro, e.ase.id, { scope: 'NUTRITION_PLAN', nutritionPlanId: e.nutritionPlanId, setId: s.setId, expectedVersion: 'v1' }).expect(404);
    await pro.delete(eleccion(e.ase.id, deNutricion.choiceId)).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    // La de la persona se sigue eligiendo con el área que queda.
    await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: 'v1' }).expect(200);
    await reanudarArea(e, 'NUTRICION');
    expect(ambitos((await pro.get(elecciones(e.ase.id)).expect(200)).body.data)).toEqual(['PERSON', 'TRAINING_PLAN', 'NUTRITION_PLAN']);
  });

  it('quitar: 204 y otra vez 204 con la misma clave; la de otro profesional, el mismo 404; y el reintento vuelve a decidir: en pausa, 404 (08:601)', async () => {
    const e = await escenario('quitar', ['ENTRENAMIENTO'], false);
    const s = await crearEnfoque(e.pro);
    const elegida = (await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: null }).expect(201)).body.data;
    // Otro profesional que acompaña a la misma persona no la quita.
    const otro = await prepararProfesional(app, `grf-quitar-otro-${++contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, e.ase, 'ENTRENAMIENTO');
    const deOtro = await conSesion(app, otro.token).delete(eleccion(e.ase.id, elegida.choiceId)).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    const inexistente = await conSesion(app, otro.token).delete(eleccion(e.ase.id, randomUUID())).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    expect(deOtro.body).toEqual(inexistente.body);
    expect((await conSesion(app, otro.token).get(elecciones(e.ase.id)).expect(200)).body.data).toEqual([]);

    const pro = conSesion(app, e.pro.token);
    const clave = claveDeIdempotencia();
    await pro.delete(eleccion(e.ase.id, elegida.choiceId)).set('Idempotency-Key', clave).expect(204);
    await pro.delete(eleccion(e.ase.id, elegida.choiceId)).set('Idempotency-Key', clave).expect(204);
    await pro.delete(eleccion(e.ase.id, elegida.choiceId)).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    expect((await pro.get(elecciones(e.ase.id)).expect(200)).body.data).toEqual([]);
    await pausarArea(e, 'ENTRENAMIENTO');
    await pro.delete(eleccion(e.ase.id, elegida.choiceId)).set('Idempotency-Key', clave).expect(404);
  });
});

// ─── TEST-GRF-089 · borrar quita las elecciones; auditoría; la base ──────────────────────────────────────────

describe('TEST-GRF-089 · borrar un enfoque quita sus elecciones, todo queda auditado y la base sostiene sus garantías', () => {
  it('borrar un enfoque elegido en dos lugares los deja en los sugeridos; el otro enfoque y su elección no cambian (mutación: dejar las elecciones)', async () => {
    const e = await escenario('borrar-elegido');
    const s = await crearEnfoque(e.pro);
    const queda = await crearEnfoque(e.pro, 'Foco en las comidas', [ENERGIA]);
    await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: null }).expect(201);
    await elegir(e.pro, e.ase.id, { scope: 'TRAINING_PLAN', trainingPlanId: e.trainingPlanId, setId: s.setId, expectedVersion: null }).expect(201);
    await elegir(e.pro, e.ase.id, { scope: 'NUTRITION_PLAN', nutritionPlanId: e.nutritionPlanId, setId: queda.setId, expectedVersion: null }).expect(201);
    const pro = conSesion(app, e.pro.token);
    const antes = (await pro.get(ENFOQUES).expect(200)).body.data as { setId: string; choices: number }[];
    expect(Object.fromEntries(antes.map((x) => [x.setId, x.choices]))).toEqual({ [s.setId]: 2, [queda.setId]: 1 });
    await pro.delete(enfoque(s.setId)).set('Idempotency-Key', claveDeIdempotencia()).expect(204);
    const leidas = (await pro.get(elecciones(e.ase.id)).expect(200)).body.data;
    expect(ambitos(leidas)).toEqual(['NUTRITION_PLAN']);
    expect(leidas[0]).toMatchObject({ set: { setId: queda.setId }, version: 'v1' });
    expect(await prisma.eleccionDeConjuntoDeGraficos.count({ where: { conjuntoId: s.setId } })).toBe(0);
    expect((await pro.get(ENFOQUES).expect(200)).body.data).toEqual([expect.objectContaining({ setId: queda.setId, choices: 1 })]);
  });

  it('cada escritura queda en la auditoría con su recurso, y cada lectura, elección y retiro, en el registro de decisiones del PDP', async () => {
    const e = await escenario('auditoria', ['ENTRENAMIENTO'], false);
    const s = await crearEnfoque(e.pro);
    const pro = conSesion(app, e.pro.token);
    await pro.put(enfoque(s.setId)).send({ expectedVersion: 'v1', name: 'Cambiado', content: contenido() }).expect(200);
    const elegida = (await elegir(e.pro, e.ase.id, { scope: 'PERSON', setId: s.setId, expectedVersion: null }).expect(201)).body.data;
    await pro.get(elecciones(e.ase.id)).expect(200);
    await pro.delete(eleccion(e.ase.id, elegida.choiceId)).set('Idempotency-Key', claveDeIdempotencia()).expect(204);
    await pro.delete(enfoque(s.setId)).set('Idempotency-Key', claveDeIdempotencia()).expect(204);
    const exitos = await prisma.registroDeAuditoria.findMany({
      where: { actorId: e.pro.id, operacion: { startsWith: 'API-GRF-' }, resultado: 'EXITO' },
      select: { operacion: true, recursoTipo: true, recursoId: true, sujetoId: true },
    });
    expect(exitos).toHaveLength(5);
    expect(exitos).toEqual(
      expect.arrayContaining([
        { operacion: 'API-GRF-02', recursoTipo: 'ConjuntoDeGraficos', recursoId: s.setId, sujetoId: null },
        { operacion: 'API-GRF-03', recursoTipo: 'ConjuntoDeGraficos', recursoId: s.setId, sujetoId: null },
        { operacion: 'API-GRF-06', recursoTipo: 'EleccionDeConjuntoDeGraficos', recursoId: elegida.choiceId, sujetoId: e.ase.id },
        { operacion: 'API-GRF-07', recursoTipo: 'EleccionDeConjuntoDeGraficos', recursoId: elegida.choiceId, sujetoId: e.ase.id },
        { operacion: 'API-GRF-04', recursoTipo: 'ConjuntoDeGraficos', recursoId: s.setId, sujetoId: null },
      ]),
    );
    const decisiones = await prisma.decisionDeAcceso.findMany({ where: { actorId: e.pro.id, operacion: { startsWith: 'API-GRF-' }, resultado: 'PERMITIDA' }, select: { operacion: true, alcance: true, sujetoId: true } });
    expect([...new Set(decisiones.map((d) => d.operacion))].sort()).toEqual(['API-GRF-05', 'API-GRF-06', 'API-GRF-07']);
    expect(decisiones.every((d) => d.alcance === 'ENTRENAMIENTO' && d.sujetoId === e.ase.id)).toBe(true);
  });

  it('la base: el ámbito coherente con sus columnas, el enfoque y el plan del mismo profesional y de la misma persona, y el nombre y el contenido, aunque el servicio se equivocara', async () => {
    const e = await escenario('base', ['ENTRENAMIENTO']);
    const otro = await escenario('base-otro', ['ENTRENAMIENTO']);
    const s = await crearEnfoque(e.pro);
    const ajeno = await crearEnfoque(otro.pro);
    const insertar = (ambito: string, plan: string | null, conjunto: string, persona = e.ase.id) =>
      prisma.$executeRaw`
        INSERT INTO "eleccion_de_conjunto_de_graficos" ("profesional_id", "asesorado_id", "ambito", "plan_de_entrenamiento_id", "conjunto_id", "procedencia")
        VALUES (${e.pro.id}::uuid, ${persona}::uuid, ${ambito}::"AmbitoDeEleccionDeGraficos", ${plan}::uuid, ${conjunto}::uuid, '{}'::jsonb)`;
    await expect(insertar('PERSONA', e.trainingPlanId, s.setId)).rejects.toThrow(/eleccion_de_graficos_coherente/);
    await expect(insertar('PLAN_DE_ENTRENAMIENTO', null, s.setId)).rejects.toThrow(/eleccion_de_graficos_coherente/);
    await expect(insertar('PERSONA', null, s.setId, e.pro.id)).rejects.toThrow(/eleccion_de_graficos_coherente/);
    await expect(insertar('PERSONA', null, ajeno.setId)).rejects.toThrow(/el enfoque elegido es del mismo profesional/);
    await expect(insertar('PLAN_DE_ENTRENAMIENTO', otro.trainingPlanId, s.setId)).rejects.toThrow(/el plan de la elección es del mismo profesional y de la misma persona/);
    expect(await prisma.eleccionDeConjuntoDeGraficos.count({ where: { profesionalId: e.pro.id } })).toBe(0);
    const enfoqueCrudo = (nombre: string, contenidoCrudo: string) =>
      prisma.$executeRaw`
        INSERT INTO "conjunto_de_graficos" ("profesional_id", "nombre", "contenido", "procedencia")
        VALUES (${e.pro.id}::uuid, ${nombre}, ${contenidoCrudo}::jsonb, '{}'::jsonb)`;
    await expect(enfoqueCrudo(' Con espacios ', '{}')).rejects.toThrow(/conjunto_de_graficos_coherente/);
    await expect(enfoqueCrudo('x'.repeat(81), '{}')).rejects.toThrow(/conjunto_de_graficos_coherente/);
    await expect(enfoqueCrudo('Una lista', '[]')).rejects.toThrow(/conjunto_de_graficos_coherente/);
  });
});
