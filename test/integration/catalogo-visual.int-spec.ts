/**
 * WP-CATALOGO-VISUAL por la API real, contra PostgreSQL: las zonas musculares (DL-081) y la imagen del catálogo de todos
 * (DL-162). Lo curado por BE se prueba sobre un ejercicio del catálogo base de wger que ninguna otra prueba lee
 * («Pullover con mancuerna»): los 12 de WP-06 quedan sin zonas ni imagen, como los esperan las demás pruebas
 * (INV-06-143). Las imágenes son las del paquete de Dirección del 2026-10-06; no se copia ningún número.
 */
import type { INestApplication } from '@nestjs/common';
import {
  EjercicioDeCatalogoResponseSchema,
  FichaVisualDeEjercicioResponseSchema,
  FichasVisualesResponseSchema,
  ListaDeEjerciciosResponseSchema,
  ListaDeZonasMuscularesResponseSchema,
  PlanConObjetivosResponseSchema,
  SesionParaRegistrarResponseSchema,
  ZONAS_MUSCULARES,
  BusquedaDeEjerciciosResponseSchema,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { incorporarAdministrador } from '../../apps/api/src/administracion/incorporacion';
import { curarImagen, curarZonas, ErrorDeCuraduria, type PedidoDeImagen } from '../../apps/api/src/entrenamiento/curaduria';
import { AlmacenDeMediosEnPostgres } from '../../apps/api/src/medios/almacen-de-medios';
import { appDePrueba, claveDeIdempotencia, conSesion, correoSintetico, registrarOk } from './soporte-api';
import { PROCEDENCIA_SQL } from './soporte-entrenamiento';
import { activar, asociarImagen, borradorDeLaDemo, bytesDe, cuerpoDeImagen, IMAGENES_DEL_PAQUETE, ocurrenciaDeHoy, subirImagenDeEjercicio } from './soporte-por-serie';
import { prepararAsesorado, prepararProfesional } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

/** Del catálogo base de wger (DL-141, migración 20261019120000): es de todos y ninguna otra prueba lo lee. */
const PULLOVER = 'b68abbb0-6043-5e9d-b12a-c44447f40d61';
/** Del catálogo sintético de WP-06. */
const SENTADILLA = '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01';
const OPERADOR = { operador: 'Prueba de integración', fundamento: 'Curaduría sintética de la prueba (DL-081, DL-162)' };

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

async function versionVigente(ejercicioId: string): Promise<string> {
  const [v] = await prisma.$queryRaw<{ id: string }[]>`
    SELECT v."id"::text AS "id" FROM "version_de_ejercicio" v
     WHERE v."ejercicio_id" = ${ejercicioId}::uuid AND NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id")`;
  return v!.id;
}

/** Una cuenta administradora de BE, incorporada con el comando interno: la curadora de una imagen del catálogo de todos. */
async function curadora(nombre: string): Promise<string> {
  const correo = correoSintetico(`cur-${nombre}`);
  await registrarOk(app, correo, 'WEB');
  await incorporarAdministrador(prisma, { correo, nombre: `Curadora ${nombre}`, fundamento: 'Prueba sintética de curaduría', operador: 'Prueba de integración', appEnv: 'test' });
  return correo;
}

function pedidoDeImagen(exerciseId: string, i = 0): PedidoDeImagen {
  const imagen = IMAGENES_DEL_PAQUETE[i]!;
  return {
    exerciseId,
    bytes: bytesDe(imagen),
    contentType: 'image/png',
    provenance: 'AI_GENERATED',
    authorship: 'Generada para BE',
    altText: imagen.alt,
    license: { kind: 'NO_EXTERNAL_LICENSE', usage: imagen.usage },
    technicalReview: 'PENDING_PROFESSIONAL_REVIEW',
  };
}

describe('DL-081 · el catálogo de las 17 zonas', () => {
  it('REG-06-137 · la base tiene las mismas 17 zonas del dominio, con sus vistas y sus nombres', async () => {
    const filas = await prisma.zonaMuscular.findMany({ orderBy: { id: 'asc' } });
    const esperado = [...ZONAS_MUSCULARES].sort((a, b) => a.zoneId.localeCompare(b.zoneId));
    expect(filas.map((f) => [f.id, f.nombre, f.vistaAnterior, f.vistaPosterior])).toEqual(
      esperado.map((z) => [z.zoneId, z.name, (z.anatomicalViews as readonly string[]).includes('ANTERIOR'), (z.anatomicalViews as readonly string[]).includes('POSTERIOR')]),
    );
    await expect(prisma.$executeRawUnsafe(`UPDATE "zona_muscular" SET "nombre" = 'Otro' WHERE "id" = 'pectoral'`)).rejects.toThrow(/append-only/);
  });

  it('API-ZON-01 · cualquier sesión descubre las zonas, en el orden del catálogo; sin sesión, 401', async () => {
    const pro = await prepararProfesional(app, etiqueta('zon'), ['ENTRENAMIENTO']);
    const r = ListaDeZonasMuscularesResponseSchema.parse((await conSesion(app, pro.token).get('/api/v1/training/muscle-zones').expect(200)).body);
    expect(r.data.map((z) => z.zoneId)).toEqual(ZONAS_MUSCULARES.map((z) => z.zoneId));
    expect(r.data.filter((z) => z.anatomicalViews.length === 2).map((z) => z.zoneId).sort()).toEqual(['antebrazo', 'deltoides']);
    await conSesion(app, pro.token).get('/api/v1/training/muscle-zones?vista=ANTERIOR').expect(400);
    await request(app.getHttpServer()).get('/api/v1/training/muscle-zones').expect(401);
  });
});

describe('DL-081 · las zonas de un ejercicio propio (API-INT-TRN-01 y API-EJE-04)', () => {
  it('REG-06-139 · se declaran al cargarlo, con su rol, y viajan en el catálogo con la forma de siempre', async () => {
    const pro = await prepararProfesional(app, etiqueta('zonas-alta'), ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    const nombre = `Remo con zonas sintético ${randomUUID().slice(0, 6)}`;
    const zonas = [
      { zoneId: 'biceps', role: 'SECONDARY' },
      { zoneId: 'dorsal', role: 'PRIMARY' },
    ];
    const creado = EjercicioDeCatalogoResponseSchema.parse(
      (await s.post('/api/v1/training/exercises').send({ name: nombre, muscleZones: zonas, didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body,
    ).data;
    // Primero las principales; dentro de cada rol, el orden del catálogo.
    expect(creado.muscleZones).toEqual([zonas[1], zonas[0]]);
    const listado = ListaDeEjerciciosResponseSchema.parse((await s.get(`/api/v1/training/exercises?q=${encodeURIComponent(nombre)}`).expect(200)).body).data;
    expect(listado.map((e) => e.muscleZones)).toEqual([[zonas[1], zonas[0]]]);
    const buscado = BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q: nombre }).expect(200)).body).data;
    expect(buscado.map((e) => e.muscleZones)).toEqual([[zonas[1], zonas[0]]]);
    // Una zona que no es de las 17, o repetida, es un 422 con su ruta; un porcentaje no pasa el contrato.
    const invalidas = await s
      .post('/api/v1/training/exercises')
      .send({ name: 'Con zonas inválidas', muscleZones: [{ zoneId: 'pecho', role: 'PRIMARY' }, { zoneId: 'dorsal', role: 'PRIMARY' }, { zoneId: 'dorsal', role: 'SECONDARY' }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(422);
    expect(invalidas.body.error.details.issues).toEqual([
      { code: 'MUSCLE_ZONE_UNKNOWN', path: 'muscleZones[0].zoneId' },
      { code: 'MUSCLE_ZONE_DUPLICATED', path: 'muscleZones[2].zoneId' },
    ]);
    await s.post('/api/v1/training/exercises').send({ name: 'Con peso', muscleZones: [{ zoneId: 'dorsal', role: 'PRIMARY', percentage: 60 }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(400);
  });

  it('API-EJE-04 · se reemplazan por versión esperada, con historia; ajeno, 404; asesorado, 403', async () => {
    const pro = await prepararProfesional(app, etiqueta('zonas-cambio'), ['ENTRENAMIENTO']);
    const otro = await prepararProfesional(app, etiqueta('zonas-otro'), ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, etiqueta('zonas-ase'), { a3: true });
    const s = conSesion(app, pro.token);
    const creado = (await s.post('/api/v1/training/exercises').send({ name: `Sentadilla búlgara sintética ${randomUUID().slice(0, 6)}`, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data;
    const ruta = `/api/v1/training/exercises/${creado.exerciseId}/muscle-zones`;
    const cuerpo = { exerciseVersionId: creado.versionId, expectedZonesVersion: 0, muscleZones: [{ zoneId: 'cuadriceps', role: 'PRIMARY' }, { zoneId: 'gluteos', role: 'PRIMARY' }, { zoneId: 'aductores', role: 'SECONDARY' }] };
    const clave = claveDeIdempotencia();
    const primera = FichaVisualDeEjercicioResponseSchema.parse((await s.put(ruta, clave).send(cuerpo).expect(200)).body).data;
    expect(primera).toMatchObject({ exerciseId: creado.exerciseId, provenance: 'PROFESSIONAL_MANUAL', zonesVersion: 1, zonesExerciseVersionId: creado.versionId, imageVersion: 0, image: null });
    expect(primera.muscleZones.map((z) => z.zoneId)).toEqual(['gluteos', 'cuadriceps', 'aductores']);
    await s.put(ruta, clave).send(cuerpo).expect(200); // reintento: lo mismo, sin sumar
    await s.put(ruta, clave).send({ ...cuerpo, muscleZones: [] }).expect(409); // IDEMPOTENCY_KEY_REUSED
    await s.put(ruta).send(cuerpo).expect(409); // VERSION_CONFLICT: ya no es la 0
    await s.put(ruta).send({ ...cuerpo, expectedZonesVersion: 1, exerciseVersionId: randomUUID() }).expect(422); // EXERCISE_REFERENCE_INVALID
    const desconocida = await s.put(ruta).send({ ...cuerpo, expectedZonesVersion: 1, muscleZones: [{ zoneId: 'core', role: 'PRIMARY' }] }).expect(422);
    expect(desconocida.body.error.details.issues).toEqual([{ code: 'MUSCLE_ZONE_UNKNOWN', path: 'muscleZones[0].zoneId' }]);
    await conSesion(app, otro.token).put(ruta).send({ ...cuerpo, expectedZonesVersion: 1 }).expect(404);
    await conSesion(app, ase.token).put(ruta).send({ ...cuerpo, expectedZonesVersion: 1 }).expect(403);
    // Del catálogo de todos: ningún profesional lo cambia (REG-06-135), y responde como lo inexistente.
    await s.put(`/api/v1/training/exercises/${SENTADILLA}/muscle-zones`).send({ ...cuerpo, exerciseVersionId: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01' }).expect(404);
    // Quitar todas es otra asignación: la historia queda.
    const vacia = FichaVisualDeEjercicioResponseSchema.parse((await s.put(ruta).send({ ...cuerpo, expectedZonesVersion: 1, muscleZones: [] }).expect(200)).body).data;
    expect([vacia.zonesVersion, vacia.muscleZones]).toEqual([2, []]);
    const historia = await prisma.asignacionDeZonasDeEjercicio.findMany({ where: { ejercicioId: creado.exerciseId }, include: { zonas: true }, orderBy: { numero: 'asc' } });
    expect(historia.map((a) => [a.numero, a.autorId, a.zonas.length])).toEqual([
      [1, pro.id, 3],
      [2, pro.id, 0],
    ]);
  });
});

describe('DL-162 · la imagen y las zonas del catálogo de todos, curadas por BE', () => {
  it('las zonas: sin confirmar no escribe; confirmadas, las ve cualquiera; repetirlas no suma; lo de un profesional no se cura', async () => {
    const zonas = [
      { zoneId: 'dorsal', role: 'PRIMARY' as const },
      { zoneId: 'pectoral', role: 'SECONDARY' as const },
      { zoneId: 'triceps', role: 'SECONDARY' as const },
    ];
    const antes = await prisma.asignacionDeZonasDeEjercicio.count({ where: { ejercicioId: PULLOVER } });
    const simulado = await curarZonas(prisma, [{ exerciseId: PULLOVER, muscleZones: zonas }], { ...OPERADOR, escribir: false });
    expect(simulado.map((r) => r.escrito)).toEqual([false]);
    expect(await prisma.asignacionDeZonasDeEjercicio.count({ where: { ejercicioId: PULLOVER } })).toBe(antes);
    const escrito = await curarZonas(prisma, [{ exerciseId: PULLOVER, muscleZones: zonas }], { ...OPERADOR, escribir: true });
    expect(escrito[0]!.despues).toEqual(zonas);
    const otraVez = await curarZonas(prisma, [{ exerciseId: PULLOVER, muscleZones: zonas }], { ...OPERADOR, escribir: true });
    expect(otraVez.map((r) => [r.accion, r.escrito])).toEqual([['SIN_CAMBIOS', false]]);
    const ultima = await prisma.asignacionDeZonasDeEjercicio.findFirst({ where: { ejercicioId: PULLOVER }, orderBy: { numero: 'desc' } });
    expect(ultima!.autorId).toBeNull();
    expect(ultima!.procedencia).toMatchObject({ carga: 'CURADURIA_BE', operador: OPERADOR.operador, fundamento: OPERADOR.fundamento });
    // Las ve cualquier profesional de Entrenamiento, en el catálogo y en la ficha visual.
    const pro = await prepararProfesional(app, etiqueta('zonas-todos'), ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    const buscado = BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q: 'pullover con mancuerna' }).expect(200)).body).data;
    expect(buscado.find((e) => e.exerciseId === PULLOVER)!.muscleZones).toEqual(zonas);
    const fichas = FichasVisualesResponseSchema.parse((await s.post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [PULLOVER, randomUUID(), PULLOVER, 'no-es-un-id'] }).expect(200)).body).data;
    expect(fichas.map((f) => [f.exerciseId, f.provenance, f.muscleZones])).toEqual([[PULLOVER, 'CONTROLLED_IMPORT', zonas]]);
    // Una zona desconocida o un ejercicio de un profesional no pasan, y no escriben nada.
    await expect(curarZonas(prisma, [{ exerciseId: PULLOVER, muscleZones: [{ zoneId: 'pecho', role: 'PRIMARY' }] }], { ...OPERADOR, escribir: true })).rejects.toThrow(ErrorDeCuraduria);
    const propio = (await s.post('/api/v1/training/exercises').send({ name: `Propio sintético ${randomUUID().slice(0, 6)}`, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data;
    await expect(curarZonas(prisma, [{ exerciseId: propio.exerciseId as string, muscleZones: zonas }], { ...OPERADOR, escribir: true })).rejects.toThrow(/lo cargó un profesional/);
    await expect(curarZonas(prisma, [{ exerciseId: PULLOVER, muscleZones: zonas }], { operador: '', fundamento: '', escribir: true })).rejects.toThrow(/--operador/);
  });

  it('la imagen: la asocia una cuenta administradora; viaja en el catálogo, en el plan y en la sesión, y la ven el profesional y su asesorado', async () => {
    const almacen = new AlmacenDeMediosEnPostgres();
    const correo = await curadora(etiqueta('img'));
    // Una cuenta que no es administradora no cura.
    const comun = correoSintetico(`cur-comun-${randomUUID().slice(0, 6)}`);
    await registrarOk(app, comun, 'WEB');
    await expect(curarImagen(prisma, almacen, pedidoDeImagen(PULLOVER), { ...OPERADOR, escribir: true, curador: comun })).rejects.toThrow(/administradora/);
    const simulada = await curarImagen(prisma, almacen, pedidoDeImagen(PULLOVER), { ...OPERADOR, escribir: false, curador: correo });
    expect([simulada.escrito, simulada.mediaId]).toEqual([false, null]);
    const curada = await curarImagen(prisma, almacen, pedidoDeImagen(PULLOVER), { ...OPERADOR, escribir: true, curador: correo });
    expect([curada.accion, curada.escrito]).toEqual(['ASOCIAR', true]);
    expect(Math.max(curada.guardada.ancho, curada.guardada.alto)).toBeLessThanOrEqual(1600);
    const repetida = await curarImagen(prisma, almacen, pedidoDeImagen(PULLOVER), { ...OPERADOR, escribir: true, curador: correo });
    expect([repetida.accion, repetida.mediaId]).toEqual(['SIN_CAMBIOS', curada.mediaId]);
    const mediaId = curada.mediaId!;

    // El plan cita el ejercicio del catálogo de todos: el profesional lo ve con su imagen (SER-01), y el asesorado en la
    // sesión (SER-02), con el mismo medio que lee con API-MED-03.
    const pullover = await versionVigente(PULLOVER);
    const plan = await borradorDeLaDemo(app, etiqueta('img-plan'), [
      { sessionId: 'ses-catalogo', label: 'Sesión con el catálogo', prescriptions: [{ prescriptionId: 'rx-pullover', exerciseVersionId: pullover, sets: [{ repetitions: { value: 10 } }], intensity: null }] },
    ]);
    await activar(app, plan).expect(200);
    const detalle = PlanConObjetivosResponseSchema.parse((await conSesion(app, plan.pro.token).get(`/api/v1/training/plans/${plan.planId}/detail`).expect(200)).body).data;
    const enElPlan = detalle.blocks.flatMap((b) => b.sessions).flatMap((x) => x.prescriptions).find((p) => p.prescriptionId === 'rx-pullover')!;
    expect(enElPlan.image).toMatchObject({ mediaId, provenance: 'AI_GENERATED', authorship: 'Generada para BE', license: { kind: 'NO_EXTERNAL_LICENSE' }, technicalReview: 'PENDING_PROFESSIONAL_REVIEW' });
    const ocurrencia = await ocurrenciaDeHoy(app, plan.ase, 'ses-catalogo');
    const sesion = SesionParaRegistrarResponseSchema.parse((await conSesion(app, plan.ase.token).get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body).data;
    expect(sesion.session.prescriptions.find((p) => p.prescriptionId === 'rx-pullover')!.image?.mediaId).toBe(mediaId);
    await conSesion(app, plan.ase.token).get(`/api/v1/media/${mediaId}/access`).expect(200);
    // Cualquier profesional de Entrenamiento la ve (el catálogo es de todos); uno solo de Nutrición o una persona sin un
    // plan que cite el ejercicio, no: el mismo 404 que lo inexistente.
    const otro = await prepararProfesional(app, etiqueta('img-otro'), ['ENTRENAMIENTO']);
    await conSesion(app, otro.token).get(`/api/v1/media/${mediaId}/access`).expect(200);
    const nutri = await prepararProfesional(app, etiqueta('img-nutri'), ['NUTRICION']);
    await conSesion(app, nutri.token).get(`/api/v1/media/${mediaId}/access`).expect(404);
    const ajena = await prepararAsesorado(app, etiqueta('img-ajena'), { a3: true });
    await conSesion(app, ajena.token).get(`/api/v1/media/${mediaId}/access`).expect(404);

    // En el catálogo viaja como recurso didáctico, con la forma congelada; la ficha visual trae la procedencia.
    const s = conSesion(app, otro.token);
    const buscado = BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q: 'pullover con mancuerna' }).expect(200)).body).data;
    expect(buscado.find((e) => e.exerciseId === PULLOVER)!.didacticResources).toEqual([
      { resourceId: mediaId, resourceVersionId: expect.any(String), type: 'IMAGE', authorship: { name: 'Generada para BE (generada con IA)' }, license: { id: 'NO_EXTERNAL_LICENSE', label: IMAGENES_DEL_PAQUETE[0]!.usage } },
    ]);
    const [ficha] = FichasVisualesResponseSchema.parse((await s.post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [PULLOVER] }).expect(200)).body).data;
    expect(ficha!.image).toMatchObject({ mediaId, provenance: 'AI_GENERATED', altText: IMAGENES_DEL_PAQUETE[0]!.alt });
  });

  it('la ficha visual de un ejercicio propio trae su imagen con la procedencia, y la de otro profesional no existe para el de al lado', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('ficha-propia'));
    const imagen = IMAGENES_DEL_PAQUETE[0]!;
    const ejercicio = plan.ejercicios.get(imagen.fixtureKey)!;
    const subida = await subirImagenDeEjercicio(app, plan.pro, imagen);
    await asociarImagen(app, plan.pro, ejercicio.exerciseId, cuerpoDeImagen(imagen, ejercicio.versionId, subida.mediaId, 0)).expect(200);
    const [ficha] = FichasVisualesResponseSchema.parse((await conSesion(app, plan.pro.token).post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [ejercicio.exerciseId] }).expect(200)).body).data;
    expect(ficha).toMatchObject({ exerciseId: ejercicio.exerciseId, imageVersion: 1, image: { mediaId: subida.mediaId, provenance: 'AI_GENERATED' } });
    const listado = ListaDeEjerciciosResponseSchema.parse((await conSesion(app, plan.pro.token).get(`/api/v1/training/exercises?q=${encodeURIComponent(imagen.name)}`).expect(200)).body).data;
    expect(listado.find((e) => e.exerciseId === ejercicio.exerciseId)!.didacticResources.map((r) => r.resourceId)).toEqual([subida.mediaId]);
    const otro = await prepararProfesional(app, etiqueta('ficha-otro'), ['ENTRENAMIENTO']);
    expect((await conSesion(app, otro.token).post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [ejercicio.exerciseId] }).expect(200)).body.data).toEqual([]);
    await conSesion(app, otro.token).post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [] }).expect(400);
    await conSesion(app, otro.token).post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [ejercicio.exerciseId], extra: 1 }).expect(400);
    const nutri = await prepararProfesional(app, etiqueta('ficha-nutri'), ['NUTRICION']);
    await conSesion(app, nutri.token).post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [ejercicio.exerciseId] }).expect(403);
  });

  it('la base sostiene las reglas aunque el código se equivoque: orden, quién asigna, la asignación vigente y solo agregar', async () => {
    const pro = await prepararProfesional(app, etiqueta('zonas-base'), ['ENTRENAMIENTO']);
    const propio = (await conSesion(app, pro.token).post('/api/v1/training/exercises').send({ name: `Base sintética ${randomUUID().slice(0, 6)}`, muscleZones: [{ zoneId: 'gemelos', role: 'PRIMARY' }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data;
    const asignacion = (campos: { ejercicio?: string; version?: string; numero?: number; autor?: string | null; procedencia?: string }) =>
      `INSERT INTO "asignacion_de_zonas_de_ejercicio" ("ejercicio_id","version_de_ejercicio_id","numero","autor_id","procedencia")
       VALUES ('${campos.ejercicio ?? propio.exerciseId}','${campos.version ?? propio.versionId}',${campos.numero ?? 2},${campos.autor === null ? 'NULL' : `'${campos.autor ?? pro.id}'`},${campos.procedencia ?? PROCEDENCIA_SQL})`;
    const rechazada = (sql: string, motivo: RegExp) => expect(prisma.$executeRawUnsafe(sql)).rejects.toThrow(motivo);
    await rechazada(asignacion({ numero: 3 }), /sigue al anterior/);
    const otro = await prepararProfesional(app, etiqueta('zonas-base-otro'), ['ENTRENAMIENTO']);
    await rechazada(asignacion({ autor: otro.id }), /REG-06-135/); // un ejercicio ajeno para ese autor
    const sentadilla = '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01';
    await rechazada(asignacion({ ejercicio: SENTADILLA, version: sentadilla, numero: 1 }), /REG-06-135/); // lo de todos, sin curaduría
    const curada = `'{"fuente":"PROPIA","casoDeUso":null,"operacion":"PRUEBA","superficie":null,"requestId":null,"carga":"CURADURIA_BE"}'`;
    await rechazada(asignacion({ ejercicio: SENTADILLA, version: sentadilla, numero: 1, procedencia: curada }), /REG-06-135/); // curada, pero con autor
    await rechazada(asignacion({ procedencia: curada, autor: null }), /REG-06-135/); // lo de un profesional no se cura
    // Una zona no se agrega a una asignación que ya no es la vigente, ni a una que no existe.
    const [primera] = await prisma.$queryRaw<{ id: string }[]>`SELECT "id"::text AS "id" FROM "asignacion_de_zonas_de_ejercicio" WHERE "ejercicio_id" = ${propio.exerciseId}::uuid AND "numero" = 1`;
    await prisma.$executeRawUnsafe(asignacion({}));
    await rechazada(`INSERT INTO "zona_de_ejercicio" ("asignacion_id","zona_id","rol") VALUES ('${primera!.id}','tibial','SECUNDARIO')`, /asignación vigente/);
    await rechazada(`INSERT INTO "zona_de_ejercicio" ("asignacion_id","zona_id","rol") VALUES ('${randomUUID()}','tibial','SECUNDARIO')`, /asignación vigente/);
    await expect(prisma.$executeRawUnsafe(`UPDATE "asignacion_de_zonas_de_ejercicio" SET "numero" = 9 WHERE "ejercicio_id" = '${propio.exerciseId}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM "zona_de_ejercicio" WHERE "asignacion_id" = '${primera!.id}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe('TRUNCATE "zona_de_ejercicio"')).rejects.toThrow(/append-only/);
    // La imagen de lo de todos: con la marca de curaduría, solo de una cuenta administradora.
    const imagen = (autor: string, procedencia: string) =>
      `INSERT INTO "asociacion_de_imagen_de_ejercicio" ("ejercicio_id","version_de_ejercicio_id","numero","cambio","medio_id","texto_alternativo","licencia","revision_tecnica","autor_id","procedencia")
       VALUES ('${SENTADILLA}','${sentadilla}',1,'RETIRAR',NULL,NULL,NULL,NULL,'${autor}',${procedencia})`;
    await rechazada(imagen(pro.id, curada), /REG-06-135/);
  });
});
