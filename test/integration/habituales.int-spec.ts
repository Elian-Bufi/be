/**
 * DL-109 · «Mis habituales» de entrenamiento (API-HAB-01 a 05).
 *
 * Lo que estas pruebas fijan:
 * - el ejercicio habitual es una marca por profesional y ejercicio (estable): la lista lo devuelve con la misma forma
 *   que el buscador, en su versión vigente; marcar y quitar es una sola operación idempotente; solo se marca lo que
 *   este profesional puede prescribir (lo ajeno o inexistente, 422);
 * - la sesión habitual se guarda sin identificadores de nodo ni cargas (salvo pedido) y con sus notas; nombre único
 *   por profesional: guardar con el mismo nombre es 409 salvo que el pedido señale a quién reemplaza (`replaces`), y el
 *   nombre de una quitada se reactiva; concurrencia por expectedVersion;
 * - solo el profesional que lo creó lo ve (lo ajeno es 404 neutral; un asesorado o un profesional de otra área, 403);
 * - insertada dos veces en un borrador real, el servidor asigna identificadores distintos a cada copia.
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDeEjerciciosHabitualesResponseSchema, ListaDeSesionesHabitualesResponseSchema, PlanDeEntrenamientoResponseSchema, SesionHabitualResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { prepararAsesorado, prepararProfesional, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `hab-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const FAVORITOS = '/api/v1/training/favorite-exercises';
const SESIONES = '/api/v1/training/session-presets';

type Sesion = { sessionId?: string; label: string; instructions?: string | null; prescriptions: Record<string, unknown>[] };
/** La sesión A de la estructura de prueba, con identificadores, carga sugerida y notas en todos los lugares. */
function sesionDePrueba(): Sesion {
  const e = estructuraDeEntrenamiento() as { blocks: { sessions: Sesion[] }[] };
  const s = e.blocks[0]!.sessions[0]!;
  const rx = s.prescriptions[0]!;
  rx.note = 'Técnica antes que carga.';
  (rx.sets as Record<string, unknown>[])[0]!.note = 'Primera serie suave';
  return s;
}
/** Identificador estable del ejercicio sembrado, a partir de su versión. */
async function ejercicioDe(versionId: string): Promise<string> {
  return (await prisma.versionDeEjercicio.findUniqueOrThrow({ where: { id: versionId }, select: { ejercicioId: true } })).ejercicioId;
}
const marcar = (pro: Parte, exerciseId: string, state: 'MARKED' | 'REMOVED') => conSesion(app, pro.token).patch(`${FAVORITOS}/${exerciseId}`).send({ state });
const guardar = (pro: Parte, cuerpo: Record<string, unknown>) => conSesion(app, pro.token).post(SESIONES, claveDeIdempotencia()).send(cuerpo);
const listarFavoritos = async (pro: Parte) => ListaDeEjerciciosHabitualesResponseSchema.parse((await conSesion(app, pro.token).get(FAVORITOS).expect(200)).body).data;
const listarSesiones = async (pro: Parte, query = '') => ListaDeSesionesHabitualesResponseSchema.parse((await conSesion(app, pro.token).get(`${SESIONES}${query}`).expect(200)).body).data;

describe('API-HAB-01/02 · ejercicios habituales', () => {
  it('marca, lista con la forma del buscador y en orden de marcado, quita y vuelve a marcar (idempotente); deja eventos', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['ENTRENAMIENTO']);
    const banca = await ejercicioDe(CATALOGO_DE_EJERCICIOS.pressDeBanca);
    const sentadilla = await ejercicioDe(CATALOGO_DE_EJERCICIOS.sentadilla);
    expect(await listarFavoritos(pro)).toEqual([]);

    expect((await marcar(pro, banca, 'MARKED').expect(200)).body).toEqual({ data: { exerciseId: banca, state: 'MARKED' } });
    const [solo] = await listarFavoritos(pro);
    expect(solo).toMatchObject({ exerciseId: banca, versionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, available: true, provenance: 'BE_SYNTHETIC_SEED' });
    // La misma forma que el buscador (API-TRN-13): el website reutiliza el mismo componente.
    const delBuscador = ((await conSesion(app, pro.token).get(`/api/v1/training/exercises?q=${encodeURIComponent(solo!.name)}`).expect(200)).body.data as { exerciseId: string }[]).find((e) => e.exerciseId === banca);
    expect(delBuscador).toEqual(solo);

    await marcar(pro, sentadilla, 'MARKED').expect(200);
    expect((await listarFavoritos(pro)).map((e) => e.exerciseId)).toEqual([sentadilla, banca]);
    await marcar(pro, sentadilla, 'MARKED').expect(200);
    expect((await listarFavoritos(pro)).map((e) => e.exerciseId)).toEqual([sentadilla, banca]);

    expect((await marcar(pro, banca, 'REMOVED').expect(200)).body).toEqual({ data: { exerciseId: banca, state: 'REMOVED' } });
    expect((await listarFavoritos(pro)).map((e) => e.exerciseId)).toEqual([sentadilla]);
    await marcar(pro, banca, 'REMOVED').expect(200);
    await marcar(pro, randomUUID(), 'REMOVED').expect(200);
    await marcar(pro, banca, 'MARKED').expect(200);
    expect((await listarFavoritos(pro)).map((e) => e.exerciseId)).toEqual([banca, sentadilla]);
    // Una fila por profesional y ejercicio, que se reactiva; la historia queda en los eventos.
    expect(await prisma.ejercicioHabitual.count({ where: { profesionalId: pro.id } })).toBe(2);
    expect(await prisma.eventoDeEntrenamiento.count({ where: { actorId: pro.id, tipo: 'EjercicioHabitualMarcado' } })).toBe(3);
    expect(await prisma.eventoDeEntrenamiento.count({ where: { actorId: pro.id, tipo: 'EjercicioHabitualQuitado' } })).toBe(1);
  });

  it('solo lo que este profesional puede prescribir: ajeno, inexistente o mal formado, 422; asesorado y nutricionista, 403; cuerpo inválido, 400', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['ENTRENAMIENTO']);
    const otro = await prepararProfesional(app, etiqueta(), ['ENTRENAMIENTO']);
    const propioDeOtro = (await conSesion(app, otro.token).post('/api/v1/training/exercises', claveDeIdempotencia()).send({ name: 'Remo con banda', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data as { exerciseId: string };
    await marcar(otro, propioDeOtro.exerciseId, 'MARKED').expect(200);
    expect((await marcar(pro, propioDeOtro.exerciseId, 'MARKED').expect(422)).body.error.code).toBe('EXERCISE_REFERENCE_INVALID');
    expect((await marcar(pro, randomUUID(), 'MARKED').expect(422)).body.error.code).toBe('EXERCISE_REFERENCE_INVALID');
    await marcar(pro, 'no-es-un-id', 'MARKED').expect(422);
    expect(await listarFavoritos(pro)).toEqual([]);
    expect((await listarFavoritos(otro)).map((e) => e.exerciseId)).toEqual([propioDeOtro.exerciseId]);

    const banca = await ejercicioDe(CATALOGO_DE_EJERCICIOS.pressDeBanca);
    await conSesion(app, pro.token).patch(`${FAVORITOS}/${banca}`).send({ state: 'FAVORITE' }).expect(400);
    await conSesion(app, pro.token).patch(`${FAVORITOS}/${banca}`).send({ state: 'MARKED', extra: 1 }).expect(400);
    await conSesion(app, pro.token).get(`${FAVORITOS}?limit=5`).expect(400);

    const ase = await prepararAsesorado(app, etiqueta(), { a3: true });
    await conSesion(app, ase.token).get(FAVORITOS).expect(403);
    await marcar(ase, banca, 'MARKED').expect(403);
    const nutricionista = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    await conSesion(app, nutricionista.token).get(FAVORITOS).expect(403);
    await marcar(nutricionista, banca, 'MARKED').expect(403);
  });
});

describe('API-HAB-03/04/05 · sesiones habituales', () => {
  it('guarda sin identificadores ni cargas, con notas y nombres del catálogo; con el interruptor conserva las cargas; lista la última guardada primero', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['ENTRENAMIENTO']);
    const r = await guardar(pro, { name: 'Pierna A', structure: sesionDePrueba() }).expect(201);
    const s = SesionHabitualResponseSchema.parse(r.body).data;
    expect(s).toMatchObject({ name: 'Pierna A', version: 'v1', copiedLoads: false, prescriptionCount: 2 });
    expect(s.structure.sessionId).toBeUndefined();
    expect(s.structure.prescriptions.every((p) => p.prescriptionId === undefined)).toBe(true);
    expect(s.structure.label).toBe('Sesión A');
    expect(s.structure.instructions).toBe('Entrada en calor de diez minutos.');
    const rx = s.structure.prescriptions[0]!;
    expect(rx.suggestedLoad).toBeUndefined();
    expect(rx.note).toBe('Técnica antes que carga.');
    expect(rx.sets[0]!.note).toBe('Primera serie suave');
    expect(rx.professionalParameters).toEqual([{ label: 'Descanso', value: 90, unit: 's' }]);
    for (const p of s.structure.prescriptions) expect(s.exercises[p.exerciseVersionId]).toMatchObject({ available: true });
    expect(Object.values(s.exercises).every((e) => e.exerciseName.length > 0)).toBe(true);
    expect(JSON.stringify(r.body)).not.toContain('sessionId');

    const conCargas = SesionHabitualResponseSchema.parse((await guardar(pro, { name: 'Pierna con cargas', structure: sesionDePrueba(), copySuggestedLoads: true }).expect(201)).body).data;
    expect(conCargas.copiedLoads).toBe(true);
    expect(conCargas.structure.prescriptions[0]!.suggestedLoad).toEqual({ value: 60, unit: 'kg' });

    const lista = await listarSesiones(pro);
    expect(lista.map((x) => x.name)).toEqual(['Pierna con cargas', 'Pierna A']);
    expect(lista.every((x) => x.structure.prescriptions.length === 2 && Object.keys(x.exercises).length === 2)).toBe(true);
    const primera = await listarSesiones(pro, '?limit=1');
    expect(primera.map((x) => x.name)).toEqual(['Pierna con cargas']);
  });

  it('nombre único: 409 sin señalar; con replaces reemplaza y sube la versión; renombrar, quitar (no se lista) y reactivar por el nombre', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['ENTRENAMIENTO']);
    const s = SesionHabitualResponseSchema.parse((await guardar(pro, { name: 'Pierna', structure: sesionDePrueba() }).expect(201)).body).data;
    await guardar(pro, { name: 'Ocupado', structure: sesionDePrueba() }).expect(201);
    expect((await guardar(pro, { name: '  PIERNA ', structure: sesionDePrueba() }).expect(409)).body.error.code).toBe('PRESET_NAME_TAKEN');
    expect((await guardar(pro, { name: 'Pierna', structure: sesionDePrueba(), replaces: randomUUID() }).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect((await guardar(pro, { name: 'ocupado', structure: sesionDePrueba(), replaces: s.presetId }).expect(409)).body.error.code).toBe('PRESET_NAME_TAKEN');

    const otraSesion = { label: 'Pierna fuerte', prescriptions: [{ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [{ repetitions: { value: 5 } }], intensity: null }] };
    const reemplazada = SesionHabitualResponseSchema.parse((await guardar(pro, { name: 'Pierna fuerte', structure: otraSesion, replaces: s.presetId }).expect(201)).body).data;
    expect(reemplazada).toMatchObject({ presetId: s.presetId, name: 'Pierna fuerte', version: 'v2', prescriptionCount: 1 });
    expect(reemplazada.structure.label).toBe('Pierna fuerte');
    expect((await listarSesiones(pro)).map((x) => x.name)).toEqual(['Pierna fuerte', 'Ocupado']);
    // Guardar con el mismo nombre y señalando a la misma: reemplaza sin 409.
    const otraVez = SesionHabitualResponseSchema.parse((await guardar(pro, { name: 'Pierna fuerte', structure: sesionDePrueba(), replaces: s.presetId }).expect(201)).body).data;
    expect(otraVez).toMatchObject({ presetId: s.presetId, version: 'v3', prescriptionCount: 2 });

    await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v9', name: 'Pierna suave' }).expect(409);
    expect((await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v3', name: 'OCUPADO' }).expect(409)).body.error.code).toBe('PRESET_NAME_TAKEN');
    await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v3' }).expect(400);
    const renombrada = SesionHabitualResponseSchema.parse((await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v3', name: 'Pierna suave' }).expect(200)).body).data;
    expect(renombrada).toMatchObject({ name: 'Pierna suave', version: 'v4', prescriptionCount: 2 });
    const quitada = SesionHabitualResponseSchema.parse((await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v4', state: 'REMOVED' }).expect(200)).body).data;
    expect(quitada.version).toBe('v5');
    expect((await listarSesiones(pro)).map((x) => x.name)).toEqual(['Ocupado']);
    await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v5', name: 'Otra' }).expect(404);
    // El nombre de una quitada queda libre y volver a guardarlo la reactiva (misma fila, reemplazada).
    const reactivada = SesionHabitualResponseSchema.parse((await guardar(pro, { name: 'pierna suave', structure: otraSesion }).expect(201)).body).data;
    expect(reactivada).toMatchObject({ presetId: s.presetId, name: 'pierna suave', version: 'v6', prescriptionCount: 1 });
    expect((await listarSesiones(pro)).map((x) => x.name)).toEqual(['pierna suave', 'Ocupado']);
    // Renombrar otra al nombre de una quitada también es legítimo: la quitada no cuenta.
    await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v6', state: 'REMOVED' }).expect(200);
    const ocupado = (await listarSesiones(pro))[0]!;
    expect(SesionHabitualResponseSchema.parse((await conSesion(app, pro.token).patch(`${SESIONES}/${ocupado.presetId}`).send({ expectedVersion: ocupado.version, name: 'Pierna suave' }).expect(200)).body).data.name).toBe('Pierna suave');
    expect(await prisma.sesionHabitual.count({ where: { profesionalId: pro.id } })).toBe(2);
    expect(await prisma.eventoDeEntrenamiento.count({ where: { actorId: pro.id, tipo: 'SesionHabitualGuardada' } })).toBe(5);
    expect(await prisma.eventoDeEntrenamiento.count({ where: { actorId: pro.id, tipo: 'SesionHabitualEditada' } })).toBe(4);
  });

  it('lo ajeno es 404 neutral; asesorado y nutricionista, 403; campo desconocido 400; ejercicio inexistente o ajeno, 422 con la ruta relativa a la sesión', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['ENTRENAMIENTO']);
    const s = SesionHabitualResponseSchema.parse((await guardar(pro, { name: 'Mía', structure: sesionDePrueba() }).expect(201)).body).data;
    const otro = await prepararProfesional(app, etiqueta(), ['ENTRENAMIENTO']);
    expect(await listarSesiones(otro)).toEqual([]);
    await conSesion(app, otro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v1', name: 'Robada' }).expect(404);
    await guardar(otro, { name: 'Robada', structure: sesionDePrueba(), replaces: s.presetId }).expect(404);
    expect(SesionHabitualResponseSchema.parse((await conSesion(app, pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v1', name: 'Sigue mía' }).expect(200)).body).data.name).toBe('Sigue mía');

    const ase = await prepararAsesorado(app, etiqueta(), { a3: true });
    await conSesion(app, ase.token).get(SESIONES).expect(403);
    await guardar(ase, { name: 'x', structure: sesionDePrueba() }).expect(403);
    const nutricionista = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    await conSesion(app, nutricionista.token).get(SESIONES).expect(403);
    await guardar(nutricionista, { name: 'x', structure: sesionDePrueba() }).expect(403);

    await guardar(pro, { name: 'Con extra', structure: sesionDePrueba(), extra: 1 }).expect(400);
    await guardar(pro, { name: 'Sin estructura' }).expect(400);
    const inexistente = await guardar(pro, { name: 'Rota', structure: { label: 'S', prescriptions: [{ exerciseVersionId: randomUUID(), sets: [{ repetitions: { value: 8 } }], intensity: null }] } }).expect(422);
    expect(inexistente.body.error.code).toBe('EXERCISE_REFERENCE_INVALID');
    expect(JSON.stringify(inexistente.body)).toContain('prescriptions[0]');
    expect(JSON.stringify(inexistente.body)).not.toContain('blocks[0]');
    const propioDeOtro = (await conSesion(app, otro.token).post('/api/v1/training/exercises', claveDeIdempotencia()).send({ name: 'Remo con banda', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data as { versionId: string };
    expect((await guardar(pro, { name: 'Ajena', structure: { label: 'S', prescriptions: [{ exerciseVersionId: propioDeOtro.versionId, sets: [{ repetitions: { value: 8 } }], intensity: null }] } }).expect(422)).body.error.code).toBe('EXERCISE_REFERENCE_INVALID');
    expect((await guardar(pro, { name: 'Criterio', structure: { label: 'S', prescriptions: [{ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [{ repetitions: { value: 8 } }], intensity: { criterion: 'RIR', target: { value: 99 } } }] } }).expect(422)).body.error.code).toBe('INTENSITY_CRITERION_INVALID');
  });

  it('insertada dos veces en un borrador real, cada copia recibe identificadores propios del servidor', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const s = SesionHabitualResponseSchema.parse((await guardar(c.pro, { name: 'Pierna A', structure: sesionDePrueba() }).expect(201)).body).data;
    const borrador = await crearBorradorDeEntrenamiento(app, c);
    const cambios = estructuraDeEntrenamiento() as { blocks: { sessions: unknown[] }[] };
    cambios.blocks[0]!.sessions.push(s.structure, s.structure);
    const r = await conSesion(app, c.pro.token).patch(`/api/v1/training/plans/${borrador.planId}`).send({ expectedVersion: borrador.version, changes: cambios }).expect(200);
    const plan = PlanDeEntrenamientoResponseSchema.parse(r.body).data;
    const sesiones = plan.blocks[0]!.sessions!;
    expect(sesiones).toHaveLength(4);
    expect(new Set(sesiones.map((x) => x.sessionId)).size).toBe(4);
    const prescripciones = sesiones.flatMap((x) => x.prescriptions.map((p) => p.prescriptionId));
    expect(new Set(prescripciones).size).toBe(prescripciones.length);
    expect(sesiones[2]!.label).toBe('Sesión A');
    expect(sesiones[3]!.prescriptions[0]!.note).toBe('Técnica antes que carga.');
    // La sesión habitual no cambia porque el plan la haya usado, ni el plan por lo que le pase a ella.
    await conSesion(app, c.pro.token).patch(`${SESIONES}/${s.presetId}`).send({ expectedVersion: 'v1', state: 'REMOVED' }).expect(200);
    const despues = PlanDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body).data;
    expect(despues.blocks[0]!.sessions).toHaveLength(4);
  });
});
