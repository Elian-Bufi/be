/**
 * WP-08 · la importación controlada de Open Food Facts y wger por la API real, contra PostgreSQL real y un proveedor
 * falso HTTP local (D-H). Cada bloque es uno de los oráculos de docs/paquetes/WP-08-ORACULOS.md.
 */
import type { INestApplication } from '@nestjs/common';
import { CandidatoDeAlimentoResponseSchema, CandidatoDeEjercicioResponseSchema, ListaDeCatalogoResponseSchema, ListaDeEjerciciosResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { prepararAsesorado, prepararProfesional } from './soporte-vinculo';
import { levantarProveedorFalso, OFF, WGER, type ProveedorFalso } from './soporte-proveedores';

const prisma = new PrismaClient();
let app: INestApplication;
let proveedor: ProveedorFalso;
let contador = 0;

beforeAll(async () => {
  proveedor = await levantarProveedorFalso();
  app = await appDePrueba({ proveedores: { openFoodFactsUrl: proveedor.url, wgerUrl: proveedor.url, presupuestoMs: 1_500 } });
}, 120_000);
afterAll(async () => {
  await app?.close();
  await proveedor?.cerrar();
  await prisma.$disconnect();
});

const NUT = '/api/v1/nutrition/catalog-import-candidates';
const TRN = '/api/v1/training/catalog-import-candidates';
const pedirAlimento = (codigo: string) => ({ provider: 'OPEN_FOOD_FACTS', lookup: { externalId: codigo } });
const pedirEjercicio = (numero: string) => ({ provider: 'WGER', lookup: { externalId: numero } });
const nutricionista = () => prepararProfesional(app, `imp-nut-${++contador}`, ['NUTRICION']);
const entrenador = () => prepararProfesional(app, `imp-trn-${++contador}`, ['ENTRENAMIENTO']);

describe('TEST-RF-028 · Open Food Facts: importación controlada con procedencia y fallback', () => {
  it('pasos 1 a 3: consultar no incorpora; importar con una corrección conserva lo recibido y el catálogo muestra la fuente', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);

    const creado = await s.post(NUT).send(pedirAlimento(OFF.completo)).expect(201);
    const candidato = CandidatoDeAlimentoResponseSchema.parse(creado.body).data;
    expect(candidato.candidate).toEqual({
      name: 'Galletitas de prueba',
      composition: { referenceAmount: '100g', energyKcal: 452, proteinG: 8.5, carbohydrateG: 66, fatG: 17.25 },
    });
    expect(candidato.provenance).toMatchObject({ provider: 'OPEN_FOOD_FACTS', externalId: OFF.completo, license: { id: 'ODbL-1.0' } });
    expect(candidato.provenance.contentDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(new Date(candidato.expiresAt).getTime() - new Date(candidato.receivedAt).getTime()).toBe(7 * 24 * 60 * 60 * 1000);

    // No hay importación ciega: sin resolver, el catálogo no cambió.
    const antes = ListaDeCatalogoResponseSchema.parse((await s.get('/api/v1/nutrition/catalog-items?q=Galletitas%20de%20prueba').expect(200)).body).data;
    expect(antes).toEqual([]);

    const resuelto = await s
      .post(`${NUT}/${candidato.candidateId}/resolve`)
      .send({ decision: 'IMPORT', reviewedContent: { name: 'Galletitas de prueba', composition: { ...candidato.candidate.composition, energyKcal: 450 } }, rationale: 'Ajusté las kcal al envase.' })
      .expect(200);
    expect(resuelto.body.data).toMatchObject({ candidateId: candidato.candidateId, decision: 'IMPORT', correctedFields: ['composition.energyKcal'] });

    const despues = ListaDeCatalogoResponseSchema.parse((await s.get('/api/v1/nutrition/catalog-items?q=Galletitas%20de%20prueba').expect(200)).body).data;
    expect(despues).toHaveLength(1);
    expect(despues[0]).toMatchObject({
      catalogItemId: resuelto.body.data.catalogItem.catalogItemId,
      provenance: 'CONTROLLED_IMPORT',
      composition: { energyKcal: 450 },
      externalSource: { provider: 'OPEN_FOOD_FACTS', externalId: OFF.completo, receivedAt: candidato.receivedAt, license: { id: 'ODbL-1.0' } },
    });

    // La corrección no oculta la fuente: el candidato conserva lo que llegó.
    const fila = await prisma.candidatoDeImportacion.findUniqueOrThrow({ where: { id: candidato.candidateId } });
    expect((fila.contenido as { composition: { energyKcal: number } }).composition.energyKcal).toBe(452);
  });

  it('paso 4: lo que el proveedor no trajo viaja null —también la base—, y no se incorpora sin completarlo: 422 con la ruta de cada faltante', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const candidato = (await s.post(NUT).send(pedirAlimento(OFF.sinComposicion)).expect(201)).body.data;
    expect(candidato.candidate.composition).toEqual({ referenceAmount: null, energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null });
    const r = await s.post(`${NUT}/${candidato.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: candidato.candidate }).expect(422);
    expect(r.body.error.code).toBe('REVIEWED_CONTENT_INVALID');
    expect(r.body.error.details.issues.map((i: { path: string }) => i.path)).toEqual([
      'reviewedContent.composition.referenceAmount',
      'reviewedContent.composition.energyKcal',
      'reviewedContent.composition.proteinG',
      'reviewedContent.composition.carbohydrateG',
      'reviewedContent.composition.fatG',
    ]);
    // Completarlo sí lo incorpora, y los cinco datos quedan como del profesional: la base también.
    const completo = { ...candidato.candidate, composition: { referenceAmount: '100g', energyKcal: 120, proteinG: 3, carbohydrateG: 20, fatG: 2.5 } };
    const ok = await s.post(`${NUT}/${candidato.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: completo }).expect(200);
    expect(ok.body.data.correctedFields).toEqual([
      'composition.referenceAmount',
      'composition.energyKcal',
      'composition.proteinG',
      'composition.carbohydrateG',
      'composition.fatG',
    ]);
  });

  it('la base se toma solo si el proveedor la declara sin ambigüedad: «100ml» sí; «100g» en un envase en ml, no', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    expect((await s.post(NUT).send(pedirAlimento(OFF.liquido)).expect(201)).body.data.candidate.composition.referenceAmount).toBe('100ml');
    expect((await s.post(NUT).send(pedirAlimento(OFF.liquidoAmbiguo)).expect(201)).body.data.candidate.composition.referenceAmount).toBeNull();
  });

  it('paso 5: un código que el proveedor no tiene es 422 IMPORT_SOURCE_NOT_FOUND, no una caída —con 404 o con 200 y status 0—', async () => {
    const pro = await nutricionista();
    for (const codigo of [OFF.inexistente, OFF.sinProductoCon200]) {
      const r = await conSesion(app, pro.token).post(NUT).send(pedirAlimento(codigo)).expect(422);
      expect(r.body.error.code).toBe('IMPORT_SOURCE_NOT_FOUND');
    }
  });

  it('paso 6: caído, lento, desmedido, redirigido o con una ruta rota → 503 con el fallback, sin candidato; la carga manual sigue', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const antes = await prisma.candidatoDeImportacion.count({ where: { profesionalId: pro.id } });
    // Un 404 que no tiene la forma de Open Food Facts no dice «no existe»: dice que algo cambió del otro lado.
    for (const codigo of [OFF.caido, OFF.lento, OFF.enorme, OFF.enormeDeclarado, OFF.redirige, OFF.rutaRota]) {
      const inicio = Date.now();
      const r = await s.post(NUT).send(pedirAlimento(codigo)).expect(503);
      expect(r.body.error).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', details: { fallback: { catalog: true, manualEntry: true } } });
      // El presupuesto de tiempo se respeta: no se espera al proveedor lento (D-E).
      expect(Date.now() - inicio).toBeLessThan(4_500);
      expect(r.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    }
    expect(await prisma.candidatoDeImportacion.count({ where: { profesionalId: pro.id } })).toBe(antes);
    await s
      .post('/api/v1/nutrition/catalog-items')
      .send({ name: 'Alimento cargado a mano', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 100, proteinG: 1, carbohydrateG: 1, fatG: 1 } })
      .expect(201);
  });

  it('09v12:84 · mientras se espera al proveedor, la API no tiene ninguna transacción abierta', async () => {
    const pro = await nutricionista();
    // El proveedor lento tarda 5 s y el presupuesto es 1,5 s: a los 0,6 s la consulta está esperando al tercero.
    const pendiente = conSesion(app, pro.token).post(NUT).send(pedirAlimento(OFF.lento)).then((r) => r);
    await new Promise((listo) => setTimeout(listo, 600));
    const [abiertas] = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid() AND state LIKE 'idle in transaction%'`;
    expect(abiertas?.n).toBe(0);
    expect((await pendiente).status).toBe(503);
  });
});

describe('TEST-RF-038 · wger: importación controlada, sin aceptar la relación muscular como canónica', () => {
  it('pasos 1 a 3: el nombre en español con su licencia; importar crea el ejercicio sin zonas BE', async () => {
    const pro = await entrenador();
    const s = conSesion(app, pro.token);
    const candidato = CandidatoDeEjercicioResponseSchema.parse((await s.post(TRN).send(pedirEjercicio(WGER.enEspanol)).expect(201)).body).data;
    expect(candidato.candidate).toEqual({
      name: 'Estabilización abdominal',
      nameLanguage: 'es',
      category: 'Abs',
      primaryMuscles: ['Rectus abdominis'],
      secondaryMuscles: ['Obliquus externus abdominis'],
      equipment: ['Gym mat'],
    });
    // La licencia es la de la traducción elegida, con su autoría.
    expect(candidato.provenance.license).toEqual({
      id: 'CC-BY-SA-4.0',
      label: 'Creative Commons Attribution Share Alike 4.0',
      url: 'https://creativecommons.org/licenses/by-sa/4.0/',
      attribution: 'traductora-sintetica',
    });

    const r = await s.post(`${TRN}/${candidato.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: { name: 'Estabilización abdominal' } }).expect(200);
    expect(r.body.data).toMatchObject({ decision: 'IMPORT', correctedFields: [] });

    const lista = ListaDeEjerciciosResponseSchema.parse((await s.get('/api/v1/training/exercises?q=Estabilizaci%C3%B3n%20abdominal').expect(200)).body).data;
    const importado = lista.find((e) => e.exerciseId === r.body.data.exercise.exerciseId);
    expect(importado).toMatchObject({ provenance: 'CONTROLLED_IMPORT', externalSource: { provider: 'WGER', externalId: WGER.enEspanol }, muscleZones: [] });

    // Lo que se guardó, no solo lo que se responde: la resolución lleva el nombre y nada más, y la versión del ejercicio
    // cita la fuente sin ningún músculo de wger (09v12:397-401).
    const resolucion = await prisma.resolucionDeCandidato.findUniqueOrThrow({ where: { candidatoId: candidato.candidateId } });
    expect(resolucion.contenidoRevisado).toEqual({ name: 'Estabilización abdominal' });
    const version = await prisma.versionDeEjercicio.findUniqueOrThrow({ where: { id: r.body.data.exercise.versionId } });
    expect(version.procedencia).toMatchObject({ fuenteExterna: { provider: 'WGER', externalId: WGER.enEspanol } });
    expect(JSON.stringify(version.procedencia)).not.toMatch(/Rectus|Obliquus|Gym mat|Abs/);
  });

  it('pasos 4 y 5: rechazar no crea nada, y un candidato resuelto no se resuelve de nuevo', async () => {
    const pro = await entrenador();
    const s = conSesion(app, pro.token);
    const candidato = (await s.post(TRN).send(pedirEjercicio(WGER.soloEnIngles)).expect(201)).body.data;
    expect(candidato.candidate).toMatchObject({ name: 'Plank', nameLanguage: 'en' });
    const ejerciciosAntes = await prisma.ejercicioDeCatalogo.count({ where: { creadoPorId: pro.id } });
    const r = await s.post(`${TRN}/${candidato.candidateId}/resolve`).send({ decision: 'REJECT', rationale: 'Ya lo tengo cargado.' }).expect(200);
    expect(r.body.data).toMatchObject({ decision: 'REJECT', exercise: null, correctedFields: [] });
    expect(await prisma.ejercicioDeCatalogo.count({ where: { creadoPorId: pro.id } })).toBe(ejerciciosAntes);
    const otra = await s.post(`${TRN}/${candidato.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: { name: 'Plank' } }).expect(422);
    expect(otra.body.error.code).toBe('IMPORT_CANDIDATE_NOT_RESOLVABLE');
  });

  it('un número desconocido es 422; un wger caído o con una ruta rota es 503, y ninguno crea candidato', async () => {
    const pro = await entrenador();
    const s = conSesion(app, pro.token);
    expect((await s.post(TRN).send(pedirEjercicio(WGER.inexistente)).expect(422)).body.error.code).toBe('IMPORT_SOURCE_NOT_FOUND');
    expect((await s.post(TRN).send(pedirEjercicio(WGER.caido)).expect(503)).body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    expect((await s.post(TRN).send(pedirEjercicio(WGER.rutaRota)).expect(503)).body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    expect(await prisma.candidatoDeImportacion.count({ where: { profesionalId: pro.id } })).toBe(0);
  });

  it('datos raros del proveedor no rompen la request: se descarta lo que no es una traducción y se limpian los caracteres de control', async () => {
    const pro = await entrenador();
    const r = await conSesion(app, pro.token).post(TRN).send(pedirEjercicio(WGER.datosRaros)).expect(201);
    expect(r.body.data.candidate).toMatchObject({ name: 'Plancha lateral', nameLanguage: 'es' });
    expect(r.body.data.provenance.license).toMatchObject({ id: 'CC-BY-SA-4.0', attribution: 'autora -sintetica' });
  });

  it('una traducción sin licencia ni autor conocidos no toma prestados los del ejercicio', async () => {
    const pro = await entrenador();
    const r = await conSesion(app, pro.token).post(TRN).send(pedirEjercicio(WGER.sinAutor)).expect(201);
    expect(r.body.data.provenance.license).toEqual({ id: 'desconocida', label: 'Licencia no informada por wger', url: null, attribution: null });
  });
});

describe('TEST-UC-I07 · el candidato es de quien lo pidió, y la base sostiene que se resuelve una sola vez', () => {
  it('pasos 1 a 3: otro profesional recibe el mismo 404 que lo inexistente; el reintento no duplica ni vuelve a consultar', async () => {
    // A tiene las dos capacidades: así el corte entre dominios es el del candidato, no el de la capacidad.
    const a = await prepararProfesional(app, `imp-dos-${++contador}`, ['NUTRICION', 'ENTRENAMIENTO']);
    const b = await nutricionista();
    const clave = claveDeIdempotencia();
    const creado = await conSesion(app, a.token).post(NUT, clave).send(pedirAlimento(OFF.completo)).expect(201);
    const id = creado.body.data.candidateId as string;
    const ruta = `/api/v2/product/${OFF.completo}.json`;
    const consultasAntes = proveedor.consultas.get(ruta) ?? 0;
    const repetido = await conSesion(app, a.token).post(NUT, clave).send(pedirAlimento(OFF.completo)).expect(201);
    expect(repetido.body).toEqual(creado.body);
    expect(proveedor.consultas.get(ruta) ?? 0).toBe(consultasAntes);

    const cuerpo = { decision: 'IMPORT', reviewedContent: creado.body.data.candidate };
    const ajeno = await conSesion(app, b.token).post(`${NUT}/${id}/resolve`).send(cuerpo).expect(404);
    const inexistente = await conSesion(app, b.token).post(`${NUT}/${randomUUID()}/resolve`).send(cuerpo).expect(404);
    expect(ajeno.body).toEqual(inexistente.body);
    // El candidato de nutrición no existe para el catálogo de entrenamiento, ni siquiera para quien lo pidió.
    const otroDominio = await conSesion(app, a.token).post(`${TRN}/${id}/resolve`).send({ decision: 'IMPORT', reviewedContent: { name: 'x' } }).expect(404);
    expect(otroDominio.body).toEqual(inexistente.body);

    const claveDeResolver = claveDeIdempotencia();
    const uno = await conSesion(app, a.token).post(`${NUT}/${id}/resolve`, claveDeResolver).send(cuerpo).expect(200);
    const dos = await conSesion(app, a.token).post(`${NUT}/${id}/resolve`, claveDeResolver).send(cuerpo).expect(200);
    expect(dos.body).toEqual(uno.body);
    expect(await prisma.resolucionDeCandidato.count({ where: { candidatoId: id } })).toBe(1);
    expect(await prisma.elementoDeCatalogoNutricional.count({ where: { creadoPorId: a.id, procedencia: 'CONTROLLED_IMPORT' } })).toBe(1);
  });

  it('paso 4: la base rechaza reescribir el candidato, borrar la resolución o resolverlo dos veces', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const id = (await s.post(NUT).send(pedirAlimento(OFF.completo)).expect(201)).body.data.candidateId as string;
    await s.post(`${NUT}/${id}/resolve`).send({ decision: 'REJECT' }).expect(200);
    await expect(prisma.candidatoDeImportacion.update({ where: { id }, data: { idExterno: '0000000000000' } })).rejects.toThrow(/solo se agrega|append|BE:/i);
    await expect(prisma.resolucionDeCandidato.deleteMany({ where: { candidatoId: id } })).rejects.toThrow(/solo se agrega|append|BE:/i);
    // La segunda resolución la frena el índice único del candidato (P2002), no otra cosa.
    await expect(prisma.resolucionDeCandidato.create({ data: { candidatoId: id, decision: 'RECHAZAR', autorId: pro.id, procedencia: {} } })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('dos resoluciones concurrentes con claves distintas: una incorpora, la otra es 422, y hay un solo elemento', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const candidato = (await s.post(NUT).send(pedirAlimento(OFF.completo)).expect(201)).body.data;
    const cuerpo = { decision: 'IMPORT', reviewedContent: candidato.candidate };
    const resolver = () => conSesion(app, pro.token).post(`${NUT}/${candidato.candidateId}/resolve`, claveDeIdempotencia()).send(cuerpo).then((r) => r);
    const respuestas = await Promise.all([resolver(), resolver()]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 422]);
    expect(respuestas.find((r) => r.status === 422)?.body.error.code).toBe('IMPORT_CANDIDATE_NOT_RESOLVABLE');
    expect(await prisma.elementoDeCatalogoNutricional.count({ where: { creadoPorId: pro.id, procedencia: 'CONTROLLED_IMPORT' } })).toBe(1);
  });

  it('la base sostiene qué es importar: un elemento nuevo, propio, CONTROLLED_IMPORT, del dominio del candidato y con su versión', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const pedir = async () => (await s.post(NUT).send(pedirAlimento(OFF.completo)).expect(201)).body.data.candidateId as string;
    const contenidoRevisado = { name: 'Galletitas de prueba', composition: { referenceAmount: '100g', energyKcal: 452, proteinG: 8.5, carbohydrateG: 66, fatG: 17.25 } };
    const importar = (candidatoId: string, elemento: { elementoNutricionalId?: string; ejercicioId?: string }, versionCreadaId: string) =>
      prisma.resolucionDeCandidato.create({ data: { candidatoId, decision: 'IMPORTAR', contenidoRevisado, autorId: pro.id, procedencia: {}, versionCreadaId, ...elemento } });

    // Adoptar un alimento sembrado como si se hubiera importado.
    const sembrado = await prisma.versionDeElementoNutricional.findFirstOrThrow({ where: { elemento: { procedencia: 'BE_SYNTHETIC_SEED' } } });
    await expect(importar(await pedir(), { elementoNutricionalId: sembrado.elementoId }, sembrado.id)).rejects.toThrow(/CONTROLLED_IMPORT/);
    // Un ejercicio para un candidato de nutrición.
    const ejercicio = await prisma.versionDeEjercicio.findFirstOrThrow();
    await expect(importar(await pedir(), { ejercicioId: ejercicio.ejercicioId }, ejercicio.id)).rejects.toThrow(/dominio del candidato/);
    // Una versión inventada, aun con un elemento importado propio (todo en una transacción, que la base revierte).
    const candidatoId = await pedir();
    await expect(
      prisma.$transaction(async (tx) => {
        const elemento = await tx.elementoDeCatalogoNutricional.create({ data: { procedencia: 'CONTROLLED_IMPORT', creadoPorId: pro.id } });
        await tx.resolucionDeCandidato.create({
          data: { candidatoId, decision: 'IMPORTAR', contenidoRevisado, autorId: pro.id, procedencia: {}, elementoNutricionalId: elemento.id, versionCreadaId: randomUUID() },
        });
      }),
    ).rejects.toThrow(/versión del elemento importado/);
    // Y un elemento CONTROLLED_IMPORT sin la resolución que lo incorpora no llega a existir.
    await expect(prisma.elementoDeCatalogoNutricional.create({ data: { procedencia: 'CONTROLLED_IMPORT', creadoPorId: pro.id } })).rejects.toThrow(/resolución de su candidato/);
  });

  it('los CHECK de la base: el proveedor es el del dominio, y rechazar no crea ni guarda contenido', async () => {
    const pro = await nutricionista();
    const base = {
      idExterno: '901',
      contenido: { name: 'x' },
      huellaDeLoRecibido: 'c'.repeat(64),
      licencia: { id: 'CC-BY-SA-4.0' },
      urlDeOrigen: 'http://127.0.0.1/sintetico',
      profesionalId: pro.id,
      recibidoEn: new Date(),
      venceEn: new Date(Date.now() + 60_000),
      procedencia: {},
    };
    await expect(prisma.candidatoDeImportacion.create({ data: { ...base, alcance: 'NUTRICION', proveedor: 'WGER' } })).rejects.toThrow(/proveedor_del_alcance/);
    const id = (await conSesion(app, pro.token).post(NUT).send(pedirAlimento(OFF.completo)).expect(201)).body.data.candidateId as string;
    await expect(
      prisma.resolucionDeCandidato.create({ data: { candidatoId: id, decision: 'RECHAZAR', autorId: pro.id, procedencia: {}, contenidoRevisado: { name: 'x' } } }),
    ).rejects.toThrow(/efecto_coherente/);
  });

  it('la base exige que la resolución sea de quien pidió el candidato', async () => {
    const pro = await nutricionista();
    const otro = await nutricionista();
    const id = (await conSesion(app, pro.token).post(NUT).send(pedirAlimento(OFF.completo)).expect(201)).body.data.candidateId as string;
    await expect(prisma.resolucionDeCandidato.create({ data: { candidatoId: id, decision: 'RECHAZAR', autorId: otro.id, procedencia: {} } })).rejects.toThrow(/quien lo pidió/);
  });

  it('paso 5: un candidato vencido no se resuelve, ni por la API ni en la base', async () => {
    const pro = await nutricionista();
    const hace = (dias: number) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
    const vencido = await prisma.candidatoDeImportacion.create({
      data: {
        alcance: 'NUTRICION',
        proveedor: 'OPEN_FOOD_FACTS',
        idExterno: OFF.completo,
        contenido: { name: 'Galletitas de prueba', composition: { referenceAmount: '100g', energyKcal: 452, proteinG: 8.5, carbohydrateG: 66, fatG: 17.25 } },
        huellaDeLoRecibido: 'b'.repeat(64),
        licencia: { id: 'ODbL-1.0', label: 'Open Database License (ODbL) 1.0', url: null, attribution: null },
        urlDeOrigen: `${proveedor.url}/api/v2/product/${OFF.completo}.json`,
        profesionalId: pro.id,
        recibidoEn: hace(8),
        venceEn: hace(1),
        procedencia: {},
      },
    });
    const r = await conSesion(app, pro.token).post(`${NUT}/${vencido.id}/resolve`).send({ decision: 'REJECT' }).expect(422);
    expect(r.body.error.code).toBe('IMPORT_CANDIDATE_NOT_RESOLVABLE');
    await expect(prisma.resolucionDeCandidato.create({ data: { candidatoId: vencido.id, decision: 'RECHAZAR', autorId: pro.id, procedencia: {} } })).rejects.toThrow(/vencido/);
    // La hora la pone la base: declarar una resolución «de antes» no saltea el vencimiento.
    await expect(
      prisma.resolucionDeCandidato.create({ data: { candidatoId: vencido.id, decision: 'RECHAZAR', autorId: pro.id, procedencia: {}, momentoDeRegistro: new Date(0) } }),
    ).rejects.toThrow(/vencido/);
  });

  it('D-F: sin la capacidad del dominio, 403, y el proveedor no llega a consultarse', async () => {
    const ase = await prepararAsesorado(app, `imp-ase-${++contador}`, { a3: true });
    const ruta = `/api/v2/product/${OFF.liquido}.json`;
    const antes = proveedor.consultas.get(ruta) ?? 0;
    const r = await conSesion(app, ase.token).post(NUT).send(pedirAlimento(OFF.liquido)).expect(403);
    expect(r.body.error.code).toBe('ACTION_FORBIDDEN');
    expect(proveedor.consultas.get(ruta) ?? 0).toBe(antes);
    await conSesion(app, ase.token).post(TRN).send(pedirEjercicio(WGER.enEspanol)).expect(403);
  });
});
