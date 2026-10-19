/**
 * DL-141 (WP-CATALOGO-BASE, tramo 1) por la API real, contra PostgreSQL real y el proveedor falso local de WP-08 (D-H):
 * - **D-1 · lo importado es de todos los profesionales,** con su fuente, y hay uno solo por ítem externo: si otro lo
 *   importa, la resolución de su candidato apunta al que ya está, también cuando importan a la vez;
 * - **D-2 · los nombres alternativos:** el buscador los usa con sus reglas (el orden de las palabras, los plurales y los
 *   errores de tipeo), y dice cuál coincidió solo en las búsquedas del website; API-TRN-13, la que lee la APK instalada,
 *   no cambia de forma.
 * Para crear un alimento importado, cada prueba pide un código que nadie importó (`codigoDePruebaUnico`); el ejercicio de
 * wger es siempre el mismo (`WGER.enEspanol`), y las pruebas valen lo haya importado quien sea.
 */
import type { INestApplication } from '@nestjs/common';
import {
  BusquedaDeEjerciciosResponseSchema,
  BusquedaEnCatalogoResponseSchema,
  CandidatoDeAlimentoResponseSchema,
  CandidatoDeEjercicioResponseSchema,
  ListaDeCatalogoResponseSchema,
  ResolucionDeAlimentoResponseSchema,
  ResolucionDeEjercicioResponseSchema,
  type AlimentoCandidato,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './soporte';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento } from './soporte-entrenamiento';
import { codigoDePruebaUnico, levantarProveedorFalso, nombreDelProductoUnico, WGER, type ProveedorFalso } from './soporte-proveedores';
import { prepararProfesional, type Parte } from './soporte-vinculo';

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
const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'DL-141', superficie: null, requestId: null };
const COMPOSICION = { referenceAmount: '100g', energyKcal: 300, proteinG: 4, carbohydrateG: 30, fatG: 18 };
const nutricionista = () => prepararProfesional(app, `catb-nut-${++contador}`, ['NUTRICION']);
const entrenador = () => prepararProfesional(app, `catb-trn-${++contador}`, ['ENTRENAMIENTO']);

/**
 * Lo que vería la APK instalada en una respuesta: su esquema congelado, leído con el zod del dominio, como en la prueba
 * C01 (`compatibilidad-de-clientes.int-spec.ts`). Vacío es que la acepta.
 */
const { fromJSONSchema } = require(require.resolve('zod', { paths: [join(RAIZ, 'packages', 'domain')] })) as {
  fromJSONSchema: (esquema: unknown) => { safeParse(valor: unknown): { success: boolean; error?: { issues: unknown[] } } };
};
const CONGELADAS = JSON.parse(readFileSync(join(RAIZ, 'packages', 'domain', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json'), 'utf8')) as {
  operaciones: Record<string, { respuestas: Record<string, unknown> }>;
};
function comoLaLeeLaApkInstalada(operacion: string, cuerpo: unknown): unknown[] {
  const r = fromJSONSchema(CONGELADAS.operaciones[operacion]!.respuestas['200']).safeParse(cuerpo);
  return r.success ? [] : (r.error?.issues ?? ['sin detalle']);
}

/** API-INT-NUT-02: el candidato de un producto, validado con el contrato. */
async function candidatoDeAlimento(pro: Parte, codigo: string) {
  const r = await conSesion(app, pro.token).post(NUT).send({ provider: 'OPEN_FOOD_FACTS', lookup: { externalId: codigo } }).expect(201);
  return CandidatoDeAlimentoResponseSchema.parse(r.body).data;
}

/** API-INT-NUT-03 con IMPORT, validado con el contrato. */
async function importarAlimento(pro: Parte, candidateId: string, reviewedContent: AlimentoCandidato) {
  const r = await conSesion(app, pro.token).post(`${NUT}/${candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent }).expect(200);
  return ResolucionDeAlimentoResponseSchema.parse(r.body).data;
}

/** Los elementos del catálogo que vinieron de este producto: los que lo citan como fuente en alguna versión. */
async function elementosDelProducto(codigo: string): Promise<string[]> {
  const filas = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT v."elemento_id"::text AS "id" FROM "version_de_elemento_nutricional" v
     WHERE v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'OPEN_FOOD_FACTS' AND v."procedencia" -> 'fuenteExterna' ->> 'externalId' = ${codigo}`;
  return filas.map((f) => f.id);
}

// ─── D-1 · lo importado es de todos, y uno solo por ítem externo ─────────────────────────────────────────────

describe('DL-141 D-1 · lo importado es de todos los profesionales, con su fuente, y hay uno solo por ítem externo', () => {
  it('lo que importa A lo encuentra, lo marca y lo usa B; si B lo importa, la resolución apunta al de A, no crea otro y no lo cambia', async () => {
    const a = await nutricionista();
    const b = await nutricionista();
    const codigo = codigoDePruebaUnico();
    const nombre = nombreDelProductoUnico(codigo);

    const deA = await candidatoDeAlimento(a, codigo);
    expect(deA.existingCatalogItem).toBeNull();
    const resA = await importarAlimento(a, deA.candidateId, { ...deA.candidate, composition: { ...deA.candidate.composition, energyKcal: 450 } });
    expect(resA).toMatchObject({ decision: 'IMPORT', correctedFields: ['composition.energyKcal'], existingCatalogItem: null });
    const elemento = resA.catalogItem!.catalogItemId;

    // B lo encuentra con su fuente y su licencia: en la búsqueda del website y en la lectura legada.
    const sb = conSesion(app, b.token);
    const porPost = BusquedaEnCatalogoResponseSchema.parse((await sb.post('/api/v1/nutrition/catalog-items/search').send({ q: nombre }).expect(200)).body).data;
    expect(porPost).toEqual([
      expect.objectContaining({
        catalogItemId: elemento,
        name: nombre,
        provenance: 'CONTROLLED_IMPORT',
        composition: expect.objectContaining({ energyKcal: 450 }),
        externalSource: expect.objectContaining({ provider: 'OPEN_FOOD_FACTS', externalId: codigo, license: expect.objectContaining({ id: 'ODbL-1.0' }) }),
        matchedAlternativeName: null,
      }),
    ]);
    const porGet = ListaDeCatalogoResponseSchema.parse((await sb.get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent(nombre)}`).expect(200)).body).data;
    expect(porGet.map((i) => i.catalogItemId)).toEqual([elemento]);

    // Y lo cita como cualquier ítem del catálogo: lo marca como habitual (API-HAN-02) y lo usa en una receta (API-REC-07).
    await sb.patch(`/api/v1/nutrition/favorite-items/${elemento}`).send({ state: 'MARKED' }).expect(200);
    await sb
      .post('/api/v1/nutrition/recipe-calculations')
      .send({ servings: 1, ingredients: [{ catalogItemId: elemento, catalogItemVersionId: resA.catalogItem!.versionId, quantity: { value: 100, unit: 'g' }, preparationState: 'AS_PURCHASED' }] })
      .expect(200);

    // Si B consulta el mismo producto, el candidato ya dice que está, tal como lo dejó A.
    const deB = await candidatoDeAlimento(b, codigo);
    expect(deB.existingCatalogItem).toMatchObject({ catalogItemId: elemento, versionId: resA.catalogItem!.versionId, name: nombre, composition: { energyKcal: 450 } });
    // Importarlo, aun con otra revisión, apunta al de A: no crea otro elemento ni lo cambia.
    const resB = await importarAlimento(b, deB.candidateId, { ...deB.candidate, name: 'Galletitas con otro nombre' });
    expect(resB.catalogItem).toEqual(resA.catalogItem);
    expect(resB.existingCatalogItem).toMatchObject({ catalogItemId: elemento, name: nombre, composition: { energyKcal: 450 } });
    expect(resB.correctedFields).toEqual(['name']);
    expect(await elementosDelProducto(codigo)).toEqual([elemento]);

    // Lo que quedó en la base: dos resoluciones del mismo elemento; la de B, sin versión creada y con su revisión.
    const resoluciones = await prisma.resolucionDeCandidato.findMany({ where: { candidatoId: { in: [deA.candidateId, deB.candidateId] } }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(resoluciones.map((r) => [r.autorId, r.elementoNutricionalId, r.versionCreadaId === null])).toEqual([
      [a.id, elemento, false],
      [b.id, elemento, true],
    ]);
    expect(resoluciones[1]!.contenidoRevisado).toMatchObject({ name: 'Galletitas con otro nombre' });
    expect(await prisma.versionDeElementoNutricional.findMany({ where: { elementoId: elemento }, select: { nombre: true } })).toEqual([{ nombre }]);
    expect(await prisma.itemExternoDeCatalogo.findUnique({ where: { proveedor_idExterno: { proveedor: 'OPEN_FOOD_FACTS', idExterno: codigo } } })).toMatchObject({
      elementoNutricionalId: elemento,
      ejercicioId: null,
    });
  });

  it('tres profesionales importan el mismo producto a la vez: uno lo crea y las otras dos resoluciones apuntan a ese', async () => {
    const codigo = codigoDePruebaUnico();
    const pros = [await nutricionista(), await nutricionista(), await nutricionista()];
    const candidatos: Awaited<ReturnType<typeof candidatoDeAlimento>>[] = [];
    for (const p of pros) candidatos.push(await candidatoDeAlimento(p, codigo));
    expect(candidatos.map((c) => c.existingCatalogItem)).toEqual([null, null, null]);

    const respuestas = await Promise.all(
      pros.map((p, i) =>
        conSesion(app, p.token)
          .post(`${NUT}/${candidatos[i]!.candidateId}/resolve`, claveDeIdempotencia())
          .send({ decision: 'IMPORT', reviewedContent: candidatos[i]!.candidate })
          .then((r) => r),
      ),
    );
    expect(respuestas.map((r) => r.status)).toEqual([200, 200, 200]);
    const datos = respuestas.map((r) => ResolucionDeAlimentoResponseSchema.parse(r.body).data);
    const elementos = [...new Set(datos.map((d) => d.catalogItem!.catalogItemId))];
    expect(elementos).toHaveLength(1);
    expect(datos.filter((d) => d.existingCatalogItem === null)).toHaveLength(1);
    expect(datos.filter((d) => d.existingCatalogItem !== null).map((d) => d.existingCatalogItem!.catalogItemId)).toEqual([elementos[0], elementos[0]]);
    expect(await elementosDelProducto(codigo)).toEqual(elementos);
  });

  it('el ejercicio de wger que importa uno lo encuentra, lo marca y lo prescribe otro; la persona lo ve en su plan y en el catálogo, en la forma de la APK instalada', async () => {
    const a = await entrenador();
    const sa = conSesion(app, a.token);
    const deA = CandidatoDeEjercicioResponseSchema.parse((await sa.post(TRN).send({ provider: 'WGER', lookup: { externalId: WGER.enEspanol } }).expect(201)).body).data;
    // Si otra prueba ya lo importó, el candidato lo dice, y se usa ese con su nombre (como hace el website).
    const revisado = { name: deA.existingExercise?.name ?? deA.candidate.name };
    const resA = ResolucionDeEjercicioResponseSchema.parse((await sa.post(`${TRN}/${deA.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: revisado }).expect(200)).body).data;
    const importado = resA.exercise!;
    expect(resA.existingExercise === null).toBe(deA.existingExercise === null);
    expect(await prisma.itemExternoDeCatalogo.findUnique({ where: { proveedor_idExterno: { proveedor: 'WGER', idExterno: WGER.enEspanol } } })).toMatchObject({ ejercicioId: importado.exerciseId });
    const nombre = (await prisma.versionDeEjercicio.findUniqueOrThrow({ where: { id: importado.versionId } })).nombre;

    // Otro profesional, con su asesorado: lo encuentra con su fuente, lo marca como habitual y lo prescribe.
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `catb-plan-${++contador}`);
    const sb = conSesion(app, c.pro.token);
    const encontrados = BusquedaDeEjerciciosResponseSchema.parse((await sb.post('/api/v1/training/exercises/search').send({ q: nombre }).expect(200)).body).data;
    expect(encontrados).toContainEqual(
      expect.objectContaining({
        exerciseId: importado.exerciseId,
        versionId: importado.versionId,
        provenance: 'CONTROLLED_IMPORT',
        externalSource: expect.objectContaining({ provider: 'WGER', externalId: WGER.enEspanol }),
        matchedAlternativeName: null,
      }),
    );
    await sb.patch(`/api/v1/training/favorite-exercises/${importado.exerciseId}`).send({ state: 'MARKED' }).expect(200);
    const estructura = {
      blocks: [
        {
          label: 'Bloque 1',
          purpose: 'Adaptación',
          sessions: [{ sessionId: 'ses-a', label: 'Sesión A', prescriptions: [{ prescriptionId: 'rx-importado', exerciseVersionId: importado.versionId, sets: [{ repetitions: { value: 10 } }], intensity: null }] }],
        },
      ],
    };
    const plan = await crearBorradorDeEntrenamiento(app, c, { initialStructure: estructura });
    await activarPlanDeEntrenamiento(app, c.pro, plan.planId, plan.version).expect(200);

    // La persona: su plan (API-TRN-09) y el catálogo (API-TRN-13), tal como los lee la APK instalada.
    const ase = conSesion(app, c.ase.token);
    const suPlan = (await ase.get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-09', suPlan)).toEqual([]);
    expect(JSON.stringify(suPlan)).toContain(nombre);
    const catalogo = (await ase.get(`/api/v1/training/exercises?q=${encodeURIComponent(nombre)}`).expect(200)).body;
    expect(comoLaLeeLaApkInstalada('API-TRN-13', catalogo)).toEqual([]);
    expect((catalogo.data as { exerciseId: string }[]).map((e) => e.exerciseId)).toContain(importado.exerciseId);
  });

  it('la base sostiene uno por ítem externo: ni dos filas por producto, ni un ítem externo de lo sembrado o de otro producto, ni una resolución que apunte a otro importado', async () => {
    const pro = await nutricionista();
    const codigo = codigoDePruebaUnico();
    const candidato = await candidatoDeAlimento(pro, codigo);
    const elemento = (await importarAlimento(pro, candidato.candidateId, candidato.candidate)).catalogItem!.catalogItemId;

    // Una segunda fila para el mismo producto choca con la clave (proveedor, identificador).
    await expect(prisma.itemExternoDeCatalogo.create({ data: { proveedor: 'OPEN_FOOD_FACTS', idExterno: codigo, elementoNutricionalId: elemento, procedencia: PROCEDENCIA } })).rejects.toMatchObject({
      code: 'P2002',
    });
    // Un ítem externo no apunta a lo sembrado, ni a un importado de otro producto, ni cruza el dominio del proveedor.
    const sembrado = await prisma.elementoDeCatalogoNutricional.findFirstOrThrow({ where: { procedencia: 'BE_SYNTHETIC_SEED' } });
    await expect(prisma.itemExternoDeCatalogo.create({ data: { proveedor: 'OPEN_FOOD_FACTS', idExterno: codigoDePruebaUnico(), elementoNutricionalId: sembrado.id, procedencia: PROCEDENCIA } })).rejects.toThrow(
      /CONTROLLED_IMPORT/,
    );
    await expect(prisma.itemExternoDeCatalogo.create({ data: { proveedor: 'OPEN_FOOD_FACTS', idExterno: codigoDePruebaUnico(), elementoNutricionalId: elemento, procedencia: PROCEDENCIA } })).rejects.toThrow(
      /mismo proveedor e identificador/,
    );
    await expect(prisma.itemExternoDeCatalogo.create({ data: { proveedor: 'WGER', idExterno: '990001', elementoNutricionalId: elemento, procedencia: PROCEDENCIA } })).rejects.toThrow(
      /mismo proveedor e identificador|del_dominio_del_proveedor/,
    );

    // Una resolución de otro producto no puede apuntar a este elemento, aunque sea un importado.
    const otro = await candidatoDeAlimento(pro, codigoDePruebaUnico());
    await expect(
      prisma.resolucionDeCandidato.create({
        data: { candidatoId: otro.candidateId, decision: 'IMPORTAR', contenidoRevisado: otro.candidate, autorId: pro.id, procedencia: PROCEDENCIA, elementoNutricionalId: elemento },
      }),
    ).rejects.toThrow(/su ítem externo/);
  });
});

// ─── D-2 · los nombres alternativos ──────────────────────────────────────────────────────────────────────────

/**
 * Las filas del grupo del nombre igual a lo escrito, que van primero (DL-139): las que se llaman así o tienen un nombre
 * alternativo así. Desde los catálogos base (DL-141, tramos 2 y 3) puede haber más de una: la de demostración y la
 * sembrada desde wger o USDA («Bench Press», «Aguacate»), y entre ellas va primero la más nueva.
 */
function grupoDelNombreIgual(filas: (string | null)[][], nombre: string): (string | null)[][] {
  const igual = (n: string | null) => n !== null && n.toLowerCase() === nombre;
  const fin = filas.findIndex((f) => !f.some(igual));
  const grupo = fin === -1 ? filas : filas.slice(0, fin);
  // Ninguna fila con ese nombre queda después: van todas primero.
  expect(filas.slice(grupo.length).filter((f) => f.some(igual))).toEqual([]);
  return grupo;
}

describe('DL-141 D-2 · los nombres alternativos encuentran el ítem, y solo las búsquedas del website dicen cuál coincidió', () => {
  it('ejercicios: el inglés y el de otro país, también en singular y con un error de tipeo; el principal gana y las palabras van en un mismo nombre; API-TRN-13 sin el campo', async () => {
    const pro = await entrenador();
    const s = conSesion(app, pro.token);
    const buscar = async (q: string) =>
      BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q, limit: 50 }).expect(200)).body).data.map((e) => [e.name, e.matchedAlternativeName]);

    // «bench press» es igual al nombre alternativo: va primero, en el grupo del nombre igual (con el press de banca del
    // catálogo base, que wger llama «Bench Press»).
    const benchPress = grupoDelNombreIgual(await buscar('bench press'), 'bench press');
    expect(benchPress).toContainEqual(['Press de banca', 'Bench press']);
    expect(await buscar('squat')).toContainEqual(['Sentadilla', 'Squat']);
    // El de otro país, y en singular dentro del plural.
    expect(await buscar('estocadas')).toContainEqual(['Zancadas', 'Estocadas']);
    expect(await buscar('desplante')).toContainEqual(['Zancadas', 'Desplantes']);
    expect(await buscar('lunge')).toContainEqual(['Zancadas', 'Lunges']);
    // Un error de tipeo en el nombre alternativo («dedlift» por «deadlift»).
    expect(await buscar('dedlift')).toContainEqual(['Peso muerto', 'Deadlift']);
    // Si coincide el principal, no se nombra ningún alternativo.
    expect((await buscar('press de banca'))[0]).toEqual(['Press de banca', null]);
    expect((await buscar('sentadilla'))[0]).toEqual(['Sentadilla', null]);
    // Todas las palabras en un mismo nombre: «bench» de uno y «sentadilla» de otro no se mezclan.
    const mezcla = (await buscar('bench sentadilla')).map(([n]) => n);
    expect(mezcla).not.toContain('Press de banca');
    expect(mezcla).not.toContain('Sentadilla');

    // API-TRN-13, la que lee la APK instalada: encuentra igual, sin el campo nuevo y en su forma congelada.
    const legado = (await s.get(`/api/v1/training/exercises?q=${encodeURIComponent('bench press')}`).expect(200)).body;
    const deDemostracion = (legado.data as { name: string }[]).findIndex((e) => e.name === 'Press de banca');
    expect(deDemostracion).toBeGreaterThanOrEqual(0);
    expect(deDemostracion).toBeLessThan(benchPress.length);
    for (const e of legado.data) expect(e).not.toHaveProperty('matchedAlternativeName');
    expect(comoLaLeeLaApkInstalada('API-TRN-13', legado)).toEqual([]);
  });

  it('alimentos: «aguacate», «fresas» y «pasta de maní», en plural y con un error de tipeo; el principal gana; API-NUT-13 sin el campo', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const buscar = async (q: string) =>
      BusquedaEnCatalogoResponseSchema.parse((await s.post('/api/v1/nutrition/catalog-items/search').send({ q, limit: 50 }).expect(200)).body).data.map((e) => [e.name, e.matchedAlternativeName]);

    // «Aguacate» es también un nombre de la palta del catálogo base de USDA (DL-141, tramo 3): las dos van primero.
    expect(grupoDelNombreIgual(await buscar('aguacate'), 'aguacate')).toContainEqual(['Palta', 'Aguacate']);
    expect(grupoDelNombreIgual(await buscar('aguacates'), 'aguacate')).toContainEqual(['Palta', 'Aguacate']);
    expect(await buscar('aguacte')).toContainEqual(['Palta', 'Aguacate']);
    expect(await buscar('fresa')).toContainEqual(['Frutillas', 'Fresas']);
    // Sin tildes, como el principal.
    expect(await buscar('pasta de mani')).toContainEqual(['Mantequilla de maní', 'Pasta de maní']);
    expect((await buscar('palta'))[0]).toEqual(['Palta', null]);

    // API-NUT-13: encuentra igual, con su forma de siempre (el esquema estricto rechazaría un campo de más).
    const legado = ListaDeCatalogoResponseSchema.parse((await s.get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent('aguacate')}`).expect(200)).body);
    expect(legado.data.map((i) => i.name)).toContain('Palta');
  });

  it('un nombre que agrega un profesional encuentra su ítem y, retirado, deja de encontrarlo; la base sostiene el origen, la región y el nombre', async () => {
    const pro = await nutricionista();
    const s = conSesion(app, pro.token);
    const sufijo = randomUUID().slice(0, 8);
    const propio = (await s.post('/api/v1/nutrition/catalog-items').send({ name: `Untable sintético ${sufijo}`, itemType: 'FOOD', composition: COMPOSICION }).expect(201)).body.data as { catalogItemId: string };
    const alternativo = `Crema trilimba ${sufijo}`;
    const nombre = await prisma.nombreAlternativoDeAlimento.create({
      data: { elementoId: propio.catalogItemId, nombre: alternativo, idioma: 'ES', region: 'AR', origen: 'PROFESIONAL', profesionalId: pro.id, procedencia: PROCEDENCIA },
    });
    const buscar = async () =>
      BusquedaEnCatalogoResponseSchema.parse((await s.post('/api/v1/nutrition/catalog-items/search').send({ q: `trilimba ${sufijo}` }).expect(200)).body).data.map((e) => [e.catalogItemId, e.matchedAlternativeName]);
    expect(await buscar()).toEqual([[propio.catalogItemId, alternativo]]);

    // Retirarlo es un hecho aparte: el nombre queda en la historia y el buscador deja de usarlo.
    await prisma.retiroDeNombreAlternativoDeAlimento.create({ data: { nombreId: nombre.id, motivo: 'Nombre cargado por error.', profesionalId: pro.id, procedencia: PROCEDENCIA } });
    expect(await buscar()).toEqual([]);
    expect(await prisma.nombreAlternativoDeAlimento.count({ where: { id: nombre.id } })).toBe(1);
    // Un nombre se retira una sola vez.
    await expect(prisma.retiroDeNombreAlternativoDeAlimento.create({ data: { nombreId: nombre.id, motivo: 'Otra vez.', procedencia: PROCEDENCIA } })).rejects.toMatchObject({ code: 'P2002' });

    // El origen dice de quién es, y solo con ese origen; la región es un país; el nombre no tiene espacios en los bordes.
    const base = { elementoId: propio.catalogItemId, idioma: 'ES' as const, procedencia: PROCEDENCIA };
    await expect(prisma.nombreAlternativoDeAlimento.create({ data: { ...base, nombre: 'Sin autor', origen: 'PROFESIONAL' } })).rejects.toThrow(/origen_coherente/);
    await expect(prisma.nombreAlternativoDeAlimento.create({ data: { ...base, nombre: 'Con autor de más', origen: 'SIEMBRA_DE_BE', profesionalId: pro.id } })).rejects.toThrow(/origen_coherente/);
    await expect(prisma.nombreAlternativoDeAlimento.create({ data: { ...base, nombre: 'De wger', origen: 'PROVEEDOR', proveedor: 'WGER' } })).rejects.toThrow(/origen_coherente/);
    await expect(prisma.nombreAlternativoDeAlimento.create({ data: { ...base, nombre: 'Región rara', origen: 'SIEMBRA_DE_BE', region: 'arg' } })).rejects.toThrow(/region/);
    await expect(prisma.nombreAlternativoDeAlimento.create({ data: { ...base, nombre: ' Con espacios ', origen: 'SIEMBRA_DE_BE' } })).rejects.toThrow(/nombre_alternativo_de_alimento_nombre/);
  });

  it('los ítems externos, los nombres y sus retiros solo se agregan: UPDATE y DELETE los rechaza la base', async () => {
    // Cada tabla tiene filas (las de las pruebas de arriba y la siembra); las del ejercicio se agregan dentro de una
    // transacción que se revierte siempre, porque la sentencia falla.
    const pro = await entrenador();
    const nombreDelEjercicio = `Remo trilimbo ${randomUUID().slice(0, 8)}`;
    const ejercicio = (await conSesion(app, pro.token).post('/api/v1/training/exercises').send({ name: nombreDelEjercicio, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201))
      .body.data as { exerciseId: string };
    const tablas = ['item_externo_de_catalogo', 'nombre_alternativo_de_ejercicio', 'retiro_de_nombre_alternativo_de_ejercicio', 'nombre_alternativo_de_alimento', 'retiro_de_nombre_alternativo_de_alimento'];
    const resultados: string[] = [];
    for (const tabla of tablas) {
      for (const sentencia of [`UPDATE "${tabla}" SET "procedencia" = "procedencia"`, `DELETE FROM "${tabla}"`]) {
        try {
          await prisma.$transaction(async (tx) => {
            const nombre = await tx.nombreAlternativoDeEjercicio.create({
              data: { ejercicioId: ejercicio.exerciseId, nombre: 'Seated row', idioma: 'EN', origen: 'PROFESIONAL', profesionalId: pro.id, procedencia: PROCEDENCIA },
            });
            await tx.retiroDeNombreAlternativoDeEjercicio.create({ data: { nombreId: nombre.id, motivo: 'Prueba.', procedencia: PROCEDENCIA } });
            await tx.$executeRawUnsafe(sentencia);
          });
          resultados.push(`${sentencia}: aceptada`);
        } catch (e) {
          resultados.push(`${sentencia}: ${String(e).includes(`${tabla} es append-only`) ? 'rechazada' : String(e)}`);
        }
      }
    }
    expect(resultados).toEqual(tablas.flatMap((t) => [`UPDATE "${t}" SET "procedencia" = "procedencia": rechazada`, `DELETE FROM "${t}": rechazada`]));
  });

  it('la siembra del catálogo de demostración es idempotente, y cada nombre es de un ítem sembrado, con su origen', async () => {
    const siembra = sentenciasDeLaSiembra();
    const contar = async () => {
      const [fila] = await prisma.$queryRaw<{ ejercicios: number; alimentos: number }[]>`
        SELECT (SELECT count(*)::int FROM "nombre_alternativo_de_ejercicio" WHERE "procedencia" ->> 'siembra' = 'WP-CATALOGO-BASE · DL-141') AS "ejercicios",
               (SELECT count(*)::int FROM "nombre_alternativo_de_alimento" WHERE "procedencia" ->> 'siembra' = 'WP-CATALOGO-BASE · DL-141') AS "alimentos"`;
      return fila;
    };
    const antes = await contar();
    expect(antes).toEqual({ ejercicios: 15, alimentos: 17 });
    for (const sentencia of siembra) await prisma.$executeRawUnsafe(sentencia);
    expect(await contar()).toEqual(antes);

    const deOtroOrigen = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS "n" FROM (
        SELECT n."origen"::text AS "origen", e."procedencia"::text AS "item" FROM "nombre_alternativo_de_ejercicio" n JOIN "ejercicio_de_catalogo" e ON e."id" = n."ejercicio_id"
         WHERE n."procedencia" ->> 'siembra' = 'WP-CATALOGO-BASE · DL-141'
        UNION ALL
        SELECT n."origen"::text, e."procedencia"::text FROM "nombre_alternativo_de_alimento" n JOIN "elemento_de_catalogo_nutricional" e ON e."id" = n."elemento_id"
         WHERE n."procedencia" ->> 'siembra' = 'WP-CATALOGO-BASE · DL-141'
      ) t WHERE t."origen" <> 'SIEMBRA_DE_BE' OR t."item" <> 'BE_SYNTHETIC_SEED'`;
    expect(deOtroOrigen[0]!.n).toBe(0);
  });
});

/** Las dos inserciones de la migración de la siembra, tal como están en el repositorio. */
function sentenciasDeLaSiembra(): string[] {
  const archivo = readFileSync(join(RAIZ, 'prisma', 'migrations', '20261017010200_nombres_alternativos_del_catalogo_de_demostracion', 'migration.sql'), 'utf8');
  const sentencias = archivo
    .split(/;\s*\n/)
    .map((x) => x.trim())
    .filter((x) => x.includes('INSERT INTO'));
  expect(sentencias).toHaveLength(2);
  return sentencias;
}
