/**
 * DL-141 (WP-CATALOGO-BASE, tramos 2 y 3) por la API real, contra PostgreSQL real con todas las migraciones aplicadas y el
 * proveedor falso local de WP-08 (D-H):
 * - **la siembra del catálogo base está entera,** cada ítem con su fuente y su licencia, con una sola versión, y correrla
 *   de nuevo no agrega nada;
 * - **el buscador del website lo encuentra** por el nombre en castellano, por el inglés y por el de otro país, y dice cuál
 *   coincidió; las lecturas legadas lo encuentran igual, sin el campo;
 * - **importar desde wger un ejercicio que ya está en el catálogo base** apunta al sembrado y no crea otro (D-1);
 * - **la persona** ve un ejercicio del catálogo base en su plan y en el catálogo, tal como los lee la APK instalada;
 * - **la correspondencia con la fuente** (encargo de Dirección del 2026-10-19, bloque 4): los cortes vacunos con un nombre
 *   fiel son una versión nueva, con la misma composición y la misma fuente, y la anterior queda; los nombres que nombraban
 *   otro ingrediente u otra preparación ya no encuentran su alimento; y el buscador del website dice el origen de cada
 *   fila, con la equivalencia aproximada a la vista (D-6).
 */
import type { INestApplication } from '@nestjs/common';
import {
  BusquedaDeEjerciciosResponseSchema,
  BusquedaEnCatalogoResponseSchema,
  CandidatoDeEjercicioResponseSchema,
  ComposicionSchema,
  FuenteExternaDeAlimentoSchema,
  FuenteExternaSchema,
  ListaDeCatalogoResponseSchema,
  ListaDeEjerciciosResponseSchema,
  ResolucionDeEjercicioResponseSchema,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './soporte';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento } from './soporte-entrenamiento';
import { levantarProveedorFalso, WGER_DEL_CATALOGO_BASE, type ProveedorFalso } from './soporte-proveedores';
import { prepararProfesional } from './soporte-vinculo';

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

const TRN = '/api/v1/training/catalog-import-candidates';
const SIEMBRA_DE_EJERCICIOS = 'WP-CATALOGO-BASE · DL-141 · tramo 2';
const SIEMBRA_DE_ALIMENTOS = 'WP-CATALOGO-BASE · DL-141 · tramo 3';
const MARCA_DE_LA_CORRECCION = 'WP-CATALOGO-BASE · DL-141 · correspondencia de cortes';
const entrenador = () => prepararProfesional(app, `catbase-trn-${++contador}`, ['ENTRENAMIENTO']);
const nutricionista = () => prepararProfesional(app, `catbase-nut-${++contador}`, ['NUTRICION']);

const leer = (...partes: string[]) => readFileSync(join(RAIZ, ...partes), 'utf8');
const EJERCICIOS = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'ejercicios.json')).ejercicios as { wgerId: number; nombre: string }[];
const ALIMENTOS = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'alimentos.json')).alimentos as { fdcId: string; nombre: string }[];
interface Correcciones {
  cortes: { fdcId: string; nombreAnterior: string; nombre: string; correspondencia: 'DIRECTA' | 'APROXIMADA'; nota: string | null }[];
  nombresRetirados: { fdcId: string; nombre: string }[];
  nombresNuevos: { fdcId: string; nombre: string }[];
}
const CORRECCIONES = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'correcciones.json')) as Correcciones;
const CORTES_QUE_CAMBIAN = CORRECCIONES.cortes.filter((c) => c.nombre !== c.nombreAnterior);

/** Las inserciones de una migración del catálogo base, tal como están en el repositorio, con cuántas filas trae cada una. */
function insercionesDe(carpeta: string): { sentencia: string; filas: number }[] {
  return leer('prisma', 'migrations', carpeta, 'migration.sql')
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.includes('INSERT INTO'))
    .map((sentencia) => ({ sentencia, filas: (sentencia.match(/^ {4}\(/gm) ?? []).length }));
}
const DE_EJERCICIOS = insercionesDe('20261019120000_catalogo_base_de_ejercicios');
const DE_ALIMENTOS = insercionesDe('20261019120100_catalogo_base_de_alimentos');
const DE_CORRECCIONES = insercionesDe('20261019210000_catalogo_base_correspondencia_de_cortes');

/**
 * Lo que vería la APK instalada en una respuesta: su esquema congelado, leído con el zod del dominio, como en la prueba
 * C01 (`compatibilidad-de-clientes.int-spec.ts`). Vacío es que la acepta.
 */
const { fromJSONSchema } = require(require.resolve('zod', { paths: [join(RAIZ, 'packages', 'domain')] })) as {
  fromJSONSchema: (esquema: unknown) => { safeParse(valor: unknown): { success: boolean; error?: { issues: unknown[] } } };
};
const CONGELADAS = JSON.parse(leer('packages', 'domain', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json')) as {
  operaciones: Record<string, { respuestas: Record<string, unknown> }>;
};
function comoLaLeeLaApkInstalada(operacion: string, cuerpo: unknown): unknown[] {
  const r = fromJSONSchema(CONGELADAS.operaciones[operacion]!.respuestas['200']).safeParse(cuerpo);
  return r.success ? [] : (r.error?.issues ?? ['sin detalle']);
}

/** El ejercicio del catálogo base de un número de wger: el de su ítem externo, con su única versión. */
async function delCatalogoBase(wgerId: string): Promise<{ ejercicioId: string; versionId: string; nombre: string }> {
  const [fila] = await prisma.$queryRaw<{ ejercicioId: string; versionId: string; nombre: string }[]>`
    SELECT x."ejercicio_id"::text AS "ejercicioId", v."id"::text AS "versionId", v."nombre"
      FROM "item_externo_de_catalogo" x
      JOIN "version_de_ejercicio" v ON v."ejercicio_id" = x."ejercicio_id"
     WHERE x."proveedor" = 'WGER' AND x."id_externo" = ${wgerId}`;
  return fila!;
}

// ─── La siembra ──────────────────────────────────────────────────────────────────────────────────

describe('DL-141 tramos 2 y 3 · la siembra del catálogo base', () => {
  async function contar() {
    const [fila] = await prisma.$queryRaw<Record<string, number>[]>`
      SELECT (SELECT count(*)::int FROM "version_de_ejercicio" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_EJERCICIOS}) AS "versionesDeEjercicios",
             (SELECT count(DISTINCT "ejercicio_id")::int FROM "version_de_ejercicio" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_EJERCICIOS}) AS "ejercicios",
             (SELECT count(*)::int FROM "item_externo_de_catalogo" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_EJERCICIOS}) AS "itemsExternos",
             (SELECT count(*)::int FROM "nombre_alternativo_de_ejercicio" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_EJERCICIOS}) AS "nombresDeEjercicios",
             (SELECT count(*)::int FROM "version_de_elemento_nutricional" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_ALIMENTOS}) AS "versionesDeAlimentos",
             (SELECT count(DISTINCT "elemento_id")::int FROM "version_de_elemento_nutricional" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_ALIMENTOS}) AS "alimentos",
             (SELECT count(*)::int FROM "nombre_alternativo_de_alimento" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_ALIMENTOS}) AS "nombresDeAlimentos",
             (SELECT count(*)::int FROM "version_de_elemento_nutricional" WHERE "procedencia" ->> 'siembra' = ${MARCA_DE_LA_CORRECCION}) AS "versionesCorregidas",
             (SELECT count(*)::int FROM "retiro_de_nombre_alternativo_de_alimento" WHERE "procedencia" ->> 'siembra' = ${MARCA_DE_LA_CORRECCION}) AS "nombresRetirados",
             (SELECT count(*)::int FROM "nombre_alternativo_de_alimento" WHERE "procedencia" ->> 'siembra' = ${MARCA_DE_LA_CORRECCION}) AS "nombresNuevos"`;
    return fila!;
  }

  it('cada fila de las tres migraciones está en la base, y correrlas de nuevo no agrega nada', async () => {
    expect(DE_EJERCICIOS.map((i) => i.filas)).toEqual([EJERCICIOS.length, EJERCICIOS.length, EJERCICIOS.length, expect.any(Number)]);
    expect(DE_ALIMENTOS.map((i) => i.filas)).toEqual([ALIMENTOS.length, ALIMENTOS.length, expect.any(Number)]);
    expect(DE_CORRECCIONES.map((i) => i.filas)).toEqual([CORTES_QUE_CAMBIAN.length, CORRECCIONES.nombresRetirados.length, CORRECCIONES.nombresNuevos.length]);
    const antes = await contar();
    expect(antes).toEqual({
      versionesDeEjercicios: EJERCICIOS.length,
      ejercicios: EJERCICIOS.length,
      itemsExternos: EJERCICIOS.length,
      nombresDeEjercicios: DE_EJERCICIOS[3]!.filas,
      versionesDeAlimentos: ALIMENTOS.length,
      alimentos: ALIMENTOS.length,
      nombresDeAlimentos: DE_ALIMENTOS[2]!.filas,
      versionesCorregidas: CORTES_QUE_CAMBIAN.length,
      nombresRetirados: CORRECCIONES.nombresRetirados.length,
      nombresNuevos: CORRECCIONES.nombresNuevos.length,
    });
    for (const { sentencia } of [...DE_EJERCICIOS, ...DE_ALIMENTOS, ...DE_CORRECCIONES]) await prisma.$executeRawUnsafe(sentencia);
    expect(await contar()).toEqual(antes);
  });

  it('respeta las cadenas de versiones: cada ítem sembrado tiene su primera versión, y no es de ningún profesional; un corte corregido suma una sola más', async () => {
    const [fila] = await prisma.$queryRaw<Record<string, number>[]>`
      SELECT (SELECT count(*)::int FROM "version_de_ejercicio" v JOIN "ejercicio_de_catalogo" e ON e."id" = v."ejercicio_id"
               WHERE v."procedencia" ->> 'siembra' = ${SIEMBRA_DE_EJERCICIOS}
                 AND (v."predecesora_id" IS NOT NULL OR e."procedencia" <> 'CONTROLLED_IMPORT' OR e."creado_por_id" IS NOT NULL
                      OR (SELECT count(*) FROM "version_de_ejercicio" o WHERE o."ejercicio_id" = e."id") <> 1)) AS "ejercicios",
             (SELECT count(*)::int FROM "version_de_elemento_nutricional" v JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
               WHERE v."procedencia" ->> 'siembra' = ${SIEMBRA_DE_ALIMENTOS}
                 AND (v."predecesora_id" IS NOT NULL OR e."procedencia" <> 'CONTROLLED_IMPORT' OR e."creado_por_id" IS NOT NULL
                      OR (SELECT count(*) FROM "version_de_elemento_nutricional" o WHERE o."elemento_id" = e."id"
                           AND o."procedencia" ->> 'siembra' IS DISTINCT FROM ${MARCA_DE_LA_CORRECCION}) <> 1)) AS "alimentos"`;
    expect(fila).toEqual({ ejercicios: 0, alimentos: 0 });
    // La versión corregida sigue a la del tramo 3 de su mismo alimento, es la vigente y no hay otra.
    const [corregidas] = await prisma.$queryRaw<Record<string, number>[]>`
      SELECT count(*)::int AS "total",
             count(*) FILTER (WHERE a."procedencia" ->> 'siembra' = ${SIEMBRA_DE_ALIMENTOS} AND a."elemento_id" = v."elemento_id" AND a."predecesora_id" IS NULL
                                AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id"))::int AS "encadenadas"
        FROM "version_de_elemento_nutricional" v
        JOIN "version_de_elemento_nutricional" a ON a."id" = v."predecesora_id"
       WHERE v."procedencia" ->> 'siembra' = ${MARCA_DE_LA_CORRECCION}`;
    expect(corregidas).toEqual({ total: CORTES_QUE_CAMBIAN.length, encadenadas: CORTES_QUE_CAMBIAN.length });
  });

  it('cada ejercicio sembrado trae su fuente y su licencia, es el de su ítem externo y dice lo que declara wger', async () => {
    const filas = await prisma.$queryRaw<{ procedencia: Record<string, unknown>; idExterno: string | null }[]>`
      SELECT v."procedencia", x."id_externo" AS "idExterno"
        FROM "version_de_ejercicio" v
        LEFT JOIN "item_externo_de_catalogo" x ON x."ejercicio_id" = v."ejercicio_id"
       WHERE v."procedencia" ->> 'siembra' = ${SIEMBRA_DE_EJERCICIOS}`;
    expect(filas).toHaveLength(EJERCICIOS.length);
    for (const f of filas) {
      const fuente = FuenteExternaSchema.parse(f.procedencia.fuenteExterna);
      expect(fuente.provider).toBe('WGER');
      expect(f.idExterno).toBe(fuente.externalId);
      expect(['CC-BY-SA-3.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'CC-BY-4.0']).toContain(fuente.license.id);
      expect(fuente.license.url).toMatch(/^https:\/\//);
      expect(f.procedencia).toMatchObject({ carga: 'IMPORTACION_CONTROLADA', declaradoPorWger: { categoria: expect.any(String), license: { id: expect.any(String) } } });
    }
    // Los nombres que vienen de wger traen su licencia; los curados por BE, la siembra.
    const [nombres] = await prisma.$queryRaw<{ sinLicencia: number; deOtroOrigen: number }[]>`
      SELECT count(*) FILTER (WHERE "origen" = 'PROVEEDOR' AND ("procedencia" -> 'license' ->> 'id') IS NULL)::int AS "sinLicencia",
             count(*) FILTER (WHERE "origen" NOT IN ('PROVEEDOR', 'SIEMBRA_DE_BE') OR ("origen" = 'PROVEEDOR') <> ("proveedor" IS NOT NULL))::int AS "deOtroOrigen"
        FROM "nombre_alternativo_de_ejercicio" WHERE "procedencia" ->> 'siembra' = ${SIEMBRA_DE_EJERCICIOS}`;
    expect(nombres).toEqual({ sinLicencia: 0, deOtroOrigen: 0 });
  });

  it('cada alimento sembrado trae su fuente (USDA, CC0-1.0) y su composición completa, con el formato de DL-119', async () => {
    const filas = await prisma.$queryRaw<{ composicion: unknown; procedencia: Record<string, unknown> }[]>`
      SELECT v."composicion", v."procedencia" FROM "version_de_elemento_nutricional" v WHERE v."procedencia" ->> 'siembra' = ${SIEMBRA_DE_ALIMENTOS}`;
    expect(filas).toHaveLength(ALIMENTOS.length);
    for (const f of filas) {
      const fuente = FuenteExternaDeAlimentoSchema.parse(f.procedencia.fuenteExterna);
      expect(fuente).toMatchObject({ provider: 'USDA_FDC_SR_LEGACY', license: { id: 'CC0-1.0', attribution: 'USDA Agricultural Research Service' } });
      expect(fuente.usdaReference).toMatchObject({ dataset: 'FoodData Central · SR Legacy', publishedOn: '2019-04-01' });
      expect(f.procedencia).toMatchObject({ fuente: 'usda-fdc-sr-legacy', carga: 'IMPORTACION_CONTROLADA', recurso: `https://api.nal.usda.gov/fdc/v1/food/${fuente.externalId}` });
      const composicion = ComposicionSchema.parse(f.composicion);
      expect(composicion.fiberG).toEqual(expect.any(Number));
    }
  });
});

// ─── El buscador ─────────────────────────────────────────────────────────────────────────────────

describe('DL-141 tramos 2 y 3 · el buscador encuentra el catálogo base por cualquiera de sus nombres', () => {
  it('ejercicios: por el castellano, por el inglés de wger y por el de otro país; API-TRN-13 sin el campo', async () => {
    const pro = await entrenador();
    const s = conSesion(app, pro.token);
    const buscar = async (q: string) => BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q, limit: 50 }).expect(200)).body).data;
    const pares = async (q: string) => (await buscar(q)).map((e) => [e.name, e.matchedAlternativeName]);

    // Por el nombre en castellano: coincide el principal, con su fuente y su licencia, y sin zonas BE.
    expect((await buscar('press de banca plano con barra'))[0]).toMatchObject({
      name: 'Press de banca plano con barra',
      provenance: 'CONTROLLED_IMPORT',
      matchedAlternativeName: null,
      externalSource: { provider: 'WGER', externalId: '73', license: { id: 'CC-BY-SA-3.0', attribution: 'sistab2' } },
      muscleZones: [],
    });
    // Por el inglés de wger, por la traducción de wger y por el de otro país.
    expect(await pares('benchpress dumbbells')).toContainEqual(['Press de banca con mancuernas', 'Benchpress Dumbbells']);
    expect(await pares('jalon a la cara')).toContainEqual(['Face pull en polea', 'Jalón a la Cara']);
    expect(await pares('serrucho')).toContainEqual(['Remo con mancuerna a un brazo', 'Serrucho']);
    expect(await pares('desplantes')).toContainEqual(['Zancadas con peso corporal', 'Desplantes']);

    // API-TRN-13 encuentra igual, en la forma de siempre.
    const legado = (await s.get(`/api/v1/training/exercises?q=${encodeURIComponent('serrucho')}`).expect(200)).body;
    expect(ListaDeEjerciciosResponseSchema.parse(legado).data.map((e) => e.name)).toContain('Remo con mancuerna a un brazo');
    expect(comoLaLeeLaApkInstalada('API-TRN-13', legado)).toEqual([]);
  });

  it('alimentos: por el castellano, por la descripción de USDA y por el de otro país; también el inglés de los de DL-119', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const buscar = async (q: string) => BusquedaEnCatalogoResponseSchema.parse((await s.post('/api/v1/nutrition/catalog-items/search').send({ q, limit: 50 }).expect(200)).body).data;
    const pares = async (q: string) => (await buscar(q)).map((e) => [e.name, e.matchedAlternativeName]);

    expect((await buscar('zapallo anco crudo'))[0]).toMatchObject({
      name: 'Zapallo anco crudo',
      provenance: 'CONTROLLED_IMPORT',
      matchedAlternativeName: null,
      composition: { referenceAmount: '100g', energyKcal: 45, fiberG: 2 },
      externalSource: {
        provider: 'USDA_FDC_SR_LEGACY',
        externalId: '169295',
        license: { id: 'CC0-1.0' },
        usdaReference: { originalDescription: 'Squash, winter, butternut, raw', preparationDescription: 'crudo' },
      },
    });
    expect(await pares('avocados')).toContainEqual(['Palta cruda', 'Avocados, raw, all commercial varieties']);
    expect(await pares('frijoles negros')).toEqual(
      expect.arrayContaining([
        ['Porotos negros secos, crudos', 'Frijoles negros'],
        ['Porotos negros hervidos, sin sal', 'Frijoles negros'],
      ]),
    );
    // El inglés de los ocho de DL-119, que este tramo les suma.
    expect(await pares('lentils boiled')).toContainEqual(['Lentejas hervidas sin sal', 'Lentils, mature seeds, cooked, boiled, without salt']);

    // API-NUT-13 encuentra igual, con su forma de siempre.
    const legado = ListaDeCatalogoResponseSchema.parse((await s.get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent('frijoles negros')}`).expect(200)).body);
    expect(legado.data.map((i) => i.name)).toContain('Porotos negros secos, crudos');
  });
});

// ─── La correspondencia con la fuente y el origen en la fila ────────────────────────────────────

describe('Encargo de Dirección del 2026-10-19, bloque 4 · la correspondencia con la fuente y el origen en la fila del buscador', () => {
  interface Version {
    id: string;
    predecesora: string | null;
    nombre: string;
    composicion: unknown;
    procedencia: Record<string, unknown>;
  }
  /** Las versiones de un alimento de USDA, de la primera a la vigente. */
  const versionesDe = (fdcId: string) =>
    prisma.$queryRaw<Version[]>`
      SELECT v."id"::text AS "id", v."predecesora_id"::text AS "predecesora", v."nombre", v."composicion", v."procedencia"
        FROM "version_de_elemento_nutricional" v
       WHERE v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY' AND v."procedencia" -> 'fuenteExterna' ->> 'externalId' = ${fdcId}
       ORDER BY v."momento_de_registro"`;

  it('cada corte corregido es una versión nueva: el nombre fiel, la misma composición y la misma fuente; la anterior queda con su nombre', async () => {
    expect(CORTES_QUE_CAMBIAN.map((c) => c.fdcId)).toEqual(['174055', '168634', '168745', '169563', '168733']);
    for (const c of CORTES_QUE_CAMBIAN) {
      const [anterior, vigente, ...otras] = await versionesDe(c.fdcId);
      expect(otras).toEqual([]);
      expect(anterior).toMatchObject({ predecesora: null, nombre: c.nombreAnterior, procedencia: { siembra: SIEMBRA_DE_ALIMENTOS } });
      expect(vigente).toMatchObject({
        predecesora: anterior!.id,
        nombre: c.nombre,
        procedencia: { siembra: MARCA_DE_LA_CORRECCION, correccion: { nombreAnterior: c.nombreAnterior }, correspondencia: { tipo: c.correspondencia, nota: c.nota } },
      });
      // Los datos de la fuente, tal cual: la composición (con sus valores faltantes) y la fuente externa.
      expect(vigente!.composicion).toEqual(anterior!.composicion);
      expect(FuenteExternaDeAlimentoSchema.parse(vigente!.procedencia.fuenteExterna)).toEqual(anterior!.procedencia.fuenteExterna);
      expect(vigente!.procedencia).toMatchObject({ fuente: 'usda-fdc-sr-legacy', carga: 'IMPORTACION_CONTROLADA', recurso: anterior!.procedencia.recurso });
    }
    // La bola de lomo ya tenía un nombre fiel: está revisada, pero no tiene otra versión.
    expect((await versionesDe('173125')).map((v) => v.nombre)).toEqual(['Bola de lomo, magra, cruda']);
  });

  it('el buscador del website trae la versión vigente con su origen: la equivalencia aproximada, a la vista; lo cargado a mano, de quién es', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const buscar = async (q: string) => BusquedaEnCatalogoResponseSchema.parse((await s.post('/api/v1/nutrition/catalog-items/search').send({ q, limit: 50 }).expect(200)).body).data;

    const cuadril = CORTES_QUE_CAMBIAN.find((c) => c.fdcId === '174055')!;
    const enCuadril = await buscar('cuadril');
    expect(enCuadril.map((e) => e.name)).not.toContain(cuadril.nombreAnterior);
    expect(enCuadril.find((e) => e.name === cuadril.nombre)).toMatchObject({
      versionId: (await versionesDe('174055'))[1]!.id,
      provenance: 'CONTROLLED_IMPORT',
      externalSource: { provider: 'USDA_FDC_SR_LEGACY', externalId: '174055' },
      origin: { loadedBy: null, approximateCorrespondence: cuadril.nota },
    });
    // Una correspondencia directa no se marca: el bife de vacío es el flank steak de USDA. «vacío» lo sigue encontrando,
    // ahora con su nombre fiel.
    const enVacio = await buscar('vacío');
    expect(enVacio.find((e) => e.name === 'Bife de vacío, magro y grasa, crudo')).toMatchObject({ origin: { loadedBy: null, approximateCorrespondence: null } });
    expect(enVacio.map((e) => e.name)).not.toContain('Vacío, magro y grasa, crudo');

    // Lo cargado a mano dice que es de quien busca.
    await s.post('/api/v1/nutrition/catalog-items').send({ name: 'Cuadril trilimbo de la casa', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 150, proteinG: 21, carbohydrateG: 0, fatG: 7 } }).expect(201);
    expect((await buscar('cuadril trilimbo'))[0]).toMatchObject({ provenance: 'PROFESSIONAL_MANUAL', origin: { loadedBy: 'YOU', approximateCorrespondence: null } });

    // API-NUT-13 trae la misma versión vigente, en su forma de siempre: sin el origen.
    const legado = ListaDeCatalogoResponseSchema.parse((await s.get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent('cuadril')}`).expect(200)).body);
    expect(legado.data.map((i) => i.name)).toContain(cuadril.nombre);
    expect(legado.data.map((i) => i.name)).not.toContain(cuadril.nombreAnterior);
  });

  it('un nombre alternativo retirado ya no encuentra su alimento y queda en la historia con su motivo; el nuevo lo encuentra', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const pares = async (q: string) =>
      BusquedaEnCatalogoResponseSchema.parse((await s.post('/api/v1/nutrition/catalog-items/search').send({ q, limit: 50 }).expect(200)).body).data.map((e) => [e.name, e.matchedAlternativeName]);
    expect((await pares('copos de avena')).filter(([, alternativo]) => alternativo === 'Copos de avena')).toEqual([]);
    expect((await pares('entrecot')).filter(([, alternativo]) => alternativo === 'Entrecot')).toEqual([]);
    expect(await pares('lomo alto sin tapa')).toEqual(
      expect.arrayContaining([
        ['Ojo de bife, magro, crudo', 'Lomo alto sin tapa'],
        ['Ojo de bife, magro, a la parrilla', 'Lomo alto sin tapa'],
      ]),
    );
    // Retirar no borra: cada nombre retirado sigue en su tabla, con su retiro y su motivo.
    const [historia] = await prisma.$queryRaw<{ nombres: number; conMotivo: number }[]>`
      SELECT count(*)::int AS "nombres", count(*) FILTER (WHERE btrim(r."motivo") <> '')::int AS "conMotivo"
        FROM "nombre_alternativo_de_alimento" n
        JOIN "retiro_de_nombre_alternativo_de_alimento" r ON r."nombre_id" = n."id"
       WHERE r."procedencia" ->> 'siembra' = ${MARCA_DE_LA_CORRECCION}`;
    expect(historia).toEqual({ nombres: CORRECCIONES.nombresRetirados.length, conMotivo: CORRECCIONES.nombresRetirados.length });
  });

  it('el buscador de ejercicios también dice el origen: wger con su licencia, la demostración y lo cargado a mano; API-TRN-13, sin el campo', async () => {
    const pro = await entrenador();
    const s = conSesion(app, pro.token);
    const buscar = async (q: string) => BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q, limit: 50 }).expect(200)).body).data;
    expect((await buscar('press de banca plano con barra'))[0]).toMatchObject({
      provenance: 'CONTROLLED_IMPORT',
      externalSource: { provider: 'WGER', license: { id: 'CC-BY-SA-3.0' } },
      origin: { loadedBy: null, approximateCorrespondence: null },
    });
    expect((await buscar('sentadilla'))[0]).toMatchObject({ name: 'Sentadilla', provenance: 'BE_SYNTHETIC_SEED', origin: { loadedBy: null, approximateCorrespondence: null } });
    await s.post('/api/v1/training/exercises').send({ name: 'Remo trilimbo propio', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    expect((await buscar('remo trilimbo propio'))[0]).toMatchObject({ provenance: 'PROFESSIONAL_MANUAL', origin: { loadedBy: 'YOU', approximateCorrespondence: null } });
    const legado = (await s.get(`/api/v1/training/exercises?q=${encodeURIComponent('remo trilimbo propio')}`).expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-13', legado)).toEqual([]);
  });
});

// ─── Importar lo que ya está ─────────────────────────────────────────────────────────────────────

describe('DL-141 D-1 con el catálogo base · importar desde wger un ejercicio sembrado apunta al sembrado', () => {
  it('el candidato dice que ya está (existingExercise) y la resolución lo usa: no se crea otro ejercicio ni otra versión', async () => {
    const base = await delCatalogoBase(WGER_DEL_CATALOGO_BASE);
    expect(base.nombre).toBe('Press de banca plano con barra');
    const pro = await entrenador();
    const s = conSesion(app, pro.token);

    const candidato = CandidatoDeEjercicioResponseSchema.parse((await s.post(TRN).send({ provider: 'WGER', lookup: { externalId: WGER_DEL_CATALOGO_BASE } }).expect(201)).body).data;
    expect(candidato.existingExercise).toMatchObject({
      exerciseId: base.ejercicioId,
      versionId: base.versionId,
      name: 'Press de banca plano con barra',
      provenance: 'CONTROLLED_IMPORT',
      externalSource: { provider: 'WGER', externalId: WGER_DEL_CATALOGO_BASE },
    });

    // Como el website con «Usar el del catálogo BE»: se importa con el nombre que ya tiene.
    const resolucion = ResolucionDeEjercicioResponseSchema.parse(
      (await s.post(`${TRN}/${candidato.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: { name: base.nombre } }).expect(200)).body,
    ).data;
    expect(resolucion.exercise).toEqual({ exerciseId: base.ejercicioId, versionId: base.versionId });
    expect(resolucion.existingExercise).toMatchObject({ exerciseId: base.ejercicioId, name: base.nombre });

    // Un solo ejercicio cita ese número de wger, con su única versión; la resolución quedó registrada sin crear nada.
    const [citan] = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(DISTINCT "ejercicio_id")::int AS "n" FROM "version_de_ejercicio"
       WHERE "procedencia" -> 'fuenteExterna' ->> 'provider' = 'WGER' AND "procedencia" -> 'fuenteExterna' ->> 'externalId' = ${WGER_DEL_CATALOGO_BASE}`;
    expect(citan!.n).toBe(1);
    expect(await prisma.versionDeEjercicio.count({ where: { ejercicioId: base.ejercicioId } })).toBe(1);
    expect(await prisma.resolucionDeCandidato.findUniqueOrThrow({ where: { candidatoId: candidato.candidateId } })).toMatchObject({
      decision: 'IMPORTAR',
      ejercicioId: base.ejercicioId,
      versionCreadaId: null,
    });
  });
});

// ─── La persona ──────────────────────────────────────────────────────────────────────────────────

describe('DL-141 tramo 2 · la persona ve el catálogo base como lo lee la APK instalada', () => {
  it('un ejercicio del catálogo base prescripto: su plan (API-TRN-09) y el catálogo (API-TRN-13), en los esquemas congelados', async () => {
    const base = await delCatalogoBase(WGER_DEL_CATALOGO_BASE);
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `catbase-plan-${++contador}`);
    const estructura = {
      blocks: [
        {
          label: 'Bloque 1',
          purpose: 'Fuerza',
          sessions: [{ sessionId: 'ses-a', label: 'Sesión A', prescriptions: [{ prescriptionId: 'rx-base', exerciseVersionId: base.versionId, sets: [{ repetitions: { value: 8 } }], intensity: null }] }],
        },
      ],
    };
    const plan = await crearBorradorDeEntrenamiento(app, c, { initialStructure: estructura });
    await activarPlanDeEntrenamiento(app, c.pro, plan.planId, plan.version).expect(200);

    const ase = conSesion(app, c.ase.token);
    const suPlan = (await ase.get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-09', suPlan)).toEqual([]);
    expect(JSON.stringify(suPlan)).toContain(base.nombre);

    const catalogo = (await ase.get(`/api/v1/training/exercises?q=${encodeURIComponent(base.nombre)}`).expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-13', catalogo)).toEqual([]);
    expect(catalogo.data[0]).toMatchObject({
      exerciseId: base.ejercicioId,
      versionId: base.versionId,
      name: base.nombre,
      provenance: 'CONTROLLED_IMPORT',
      externalSource: { provider: 'WGER', externalId: WGER_DEL_CATALOGO_BASE, license: { id: 'CC-BY-SA-3.0' } },
    });
    // Una página entera del catálogo, ya con lo sembrado de wger, también es legible para la APK instalada.
    const pagina = (await ase.get('/api/v1/training/exercises?limit=50').expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-13', pagina)).toEqual([]);
  });
});
