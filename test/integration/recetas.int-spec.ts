/**
 * WP-NUTRICION-RECETAS · recetas (DL-119) contra PostgreSQL real (docs/paquetes/WP-NUTRICION-RECETAS.md §10.3).
 * - D1: el profesional crea, lee, lista y edita una receta; editar emite una versión nueva y `expectedVersion` cuida las
 *   ediciones simultáneas.
 * - D3: el cálculo sale del servidor con SUM_SOURCE_PER_100G_V1 y reproduce **exactamente** los once casos de
 *   `casos_calculo.json` del paquete de Dirección (el oráculo es el paquete), con los alimentos de USDA sembrados por la
 *   migración. Un dato ausente es desconocido, no cero, y el total lo dice.
 * - Permisos: solo un profesional de Nutrición; lo ajeno es el mismo 404 que lo inexistente; un ingrediente se cita por
 *   elemento y versión, y una referencia inválida es 422 con su ruta.
 */
import type { INestApplication } from '@nestjs/common';
import { CalculoDeRecetaResponseSchema, DetalleDeRecetaResponseSchema, ListaDeRecetasResponseSchema, mismoValorExacto, RecetaResponseSchema } from '@be/domain';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { alimento } from './soporte-nutricion';
import {
  ALIMENTOS,
  alimentosUsda,
  CASOS,
  crearReceta,
  cuerpoDeReceta,
  ingredientesDe,
  NUTRIENTE_DEL_PAQUETE,
  RECETAS,
  type AlimentoDelCatalogo,
} from './soporte-recetas';
import { prepararAsesorado, prepararProfesional, type Parte } from './soporte-vinculo';

let app: INestApplication;
let pro: Parte;
let alimentos: Map<string, AlimentoDelCatalogo>;

beforeAll(async () => {
  app = await appDePrueba();
  pro = await prepararProfesional(app, 'recetas', ['NUTRICION']);
  alimentos = await alimentosUsda(app, pro);
});
afterAll(async () => {
  await app.close();
});

type Nutrientes = Record<string, { value: string | null; missing: { key: string; reason: string }[] }>;

/** Cada nutriente del caso del paquete, comparado por su valor exacto («529.220» y «529.22» son iguales). */
function exigirCaso(calculo: Nutrientes, esperado: Record<string, string>, caso: string): void {
  for (const [clave, valor] of Object.entries(esperado)) {
    const n = calculo[NUTRIENTE_DEL_PAQUETE[clave]!]!;
    expect({ caso, nutriente: clave, missing: n.missing }).toEqual({ caso, nutriente: clave, missing: [] });
    expect({ caso, nutriente: clave, iguales: n.value !== null && mismoValorExacto(n.value, valor), obtenido: n.value }).toEqual({ caso, nutriente: clave, iguales: true, obtenido: n.value });
  }
}

const receta = (id: string) => RECETAS.find((r) => r.id === id)!;
const calcular = (cuerpo: Record<string, unknown>) => conSesion(app, pro.token).post('/api/v1/nutrition/recipe-calculations').send(cuerpo);

describe('DL-119 · el catálogo de referencia de USDA FoodData Central · SR Legacy, sembrado por la migración', () => {
  it('los ocho alimentos son globales, CONTROLLED_IMPORT, con FDC, NDB, licencia CC0-1.0 y la composición del paquete', async () => {
    expect(alimentos.size).toBe(8);
    for (const a of ALIMENTOS) {
      const r = await conSesion(app, pro.token).get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent(a.name_es)}`).expect(200);
      const item = (r.body.data as Record<string, any>[]).find((i) => i.catalogItemId === alimentos.get(a.id)!.catalogItemId)!;
      expect(item.provenance).toBe('CONTROLLED_IMPORT');
      expect(item.externalSource).toMatchObject({
        provider: 'USDA_FDC_SR_LEGACY',
        externalId: String(a.source.fdc_id),
        license: { id: 'CC0-1.0' },
        usdaReference: { dataset: 'FoodData Central · SR Legacy', ndbNumber: a.source.ndb_number, originalDescription: a.source.description_original, publishedOn: '2019-04-01' },
      });
      // La composición cada 100 g es la del paquete, con su valor exacto (la fibra incluida).
      for (const [clave, valor] of Object.entries(a.nutrients_per_100g)) {
        expect({ alimento: a.id, clave, iguales: mismoValorExacto(String(item.composition[NUTRIENTE_DEL_PAQUETE[clave]!]), valor) }).toEqual({ alimento: a.id, clave, iguales: true });
      }
    }
    // Otro profesional también los ve: son globales, como el catálogo sintético de WP-04.
    const otro = await prepararProfesional(app, 'recetas-otro-catalogo', ['NUTRICION']);
    expect((await alimentosUsda(app, otro)).get('arroz_cocido')).toEqual(alimentos.get('arroz_cocido'));
  });
});

describe('D3 · los once casos de casos_calculo.json, exactos (SUM_SOURCE_PER_100G_V1)', () => {
  it('las tres recetas del paquete, creadas por API-REC-01, guardan el total y la porción del paquete', async () => {
    for (const r of RECETAS) {
      const creada = await crearReceta(app, pro, cuerpoDeReceta(r, alimentos)).expect(201);
      // La forma exacta que leen la web y la APK (esquemas estrictos del dominio).
      RecetaResponseSchema.parse(creada.body);
      expect(creada.body.data.calculation.method).toBe('SUM_SOURCE_PER_100G_V1');
      const base = CASOS.find((c) => c.recipe_id === r.id && c.factor === '1' && Object.keys(c.quantity_overrides_g).length === 0)!;
      exigirCaso(creada.body.data.calculation.total, base.expected, base.id);
      // Una receta de una porción: la porción es la receta.
      exigirCaso(creada.body.data.calculation.perServing, base.expected, `${base.id} (porción)`);
      // Lo guardado es lo que se vuelve a leer, no un recálculo.
      const leida = await conSesion(app, pro.token).get(`/api/v1/nutrition/recipes/${creada.body.data.recipeId}`).expect(200);
      DetalleDeRecetaResponseSchema.parse(leida.body);
      expect(leida.body.data.calculation).toEqual(creada.body.data.calculation);
      expect(leida.body.data.ingredients.map((i: { name: string }) => i.name)).toEqual(r.items.map((it) => ALIMENTOS.find((a) => a.id === it.food_id)!.name_es));
    }
  });

  it('a la mitad (dos porciones: la porción) y al doble (cantidades × 2), con API-REC-07', async () => {
    for (const caso of CASOS.filter((c) => c.factor !== '1')) {
      const r = receta(caso.recipe_id);
      if (caso.factor === '0.5') {
        const calculo = await calcular({ servings: 2, ingredients: ingredientesDe(r, alimentos) }).expect(200);
        CalculoDeRecetaResponseSchema.parse(calculo.body);
        exigirCaso(calculo.body.data.perServing, caso.expected, caso.id);
      } else {
        expect(caso.factor).toBe('2');
        const calculo = await calcular({ servings: 1, ingredients: ingredientesDe(r, alimentos, {}, 2) }).expect(200);
        exigirCaso(calculo.body.data.total, caso.expected, caso.id);
      }
    }
  });

  it('el recálculo: arroz de 160 a 200 g y el pollo sin los 8 g de aceite, por API-REC-07 y por API-REC-04', async () => {
    const pollo = receta('BE-DEMO-NUT-001');
    const arroz200 = CASOS.find((c) => c.id === 'BE-DEMO-NUT-001-arroz-200g')!;
    const sinAceite = CASOS.find((c) => c.id === 'BE-DEMO-NUT-001-sin-aceite')!;
    // Calcular sin guardar.
    exigirCaso((await calcular({ servings: 1, ingredients: ingredientesDe(pollo, alimentos, { arroz_cocido: '200' }) }).expect(200)).body.data.total, arroz200.expected, `${arroz200.id} (REC-07)`);
    // El caso del paquete pone el aceite en 0; una cantidad tiene que ser positiva, así que se quita el ingrediente: el
    // mismo caso matemático (RECETAS_Y_CALCULOS.md: «quitar el aceite por la operación correspondiente»).
    exigirCaso((await calcular({ servings: 1, ingredients: ingredientesDe(pollo, alimentos, { aceite_oliva: null }) }).expect(200)).body.data.total, sinAceite.expected, `${sinAceite.id} (REC-07)`);

    // Editar: cada edición es una versión nueva, recalculada en el servidor.
    const v1 = (await crearReceta(app, pro, cuerpoDeReceta(pollo, alimentos)).expect(201)).body.data;
    const v2 = (
      await conSesion(app, pro.token)
        .patch(`/api/v1/nutrition/recipes/${v1.recipeId}`)
        .set('Idempotency-Key', claveDeIdempotencia())
        .send({ ...cuerpoDeReceta(pollo, alimentos, { cambios: { arroz_cocido: '200' } }), expectedVersion: v1.version })
        .expect(200)
    ).body.data;
    expect(v2.versionNumber).toBe(2);
    expect(v2.recipeVersionId).not.toBe(v1.recipeVersionId);
    exigirCaso(v2.calculation.total, arroz200.expected, `${arroz200.id} (REC-04)`);
    const v3 = (
      await conSesion(app, pro.token)
        .patch(`/api/v1/nutrition/recipes/${v1.recipeId}`)
        .set('Idempotency-Key', claveDeIdempotencia())
        .send({ ...cuerpoDeReceta(pollo, alimentos, { cambios: { aceite_oliva: null } }), expectedVersion: v2.version })
        .expect(200)
    ).body.data;
    exigirCaso(v3.calculation.total, sinAceite.expected, `${sinAceite.id} (REC-04)`);
    expect(v3.ingredients).toHaveLength(4);

    // El historial conserva las tres versiones; la versión 1 sigue con su cálculo en la base.
    const detalle = await conSesion(app, pro.token).get(`/api/v1/nutrition/recipes/${v1.recipeId}`).expect(200);
    expect(detalle.body.data.versions.map((v: { versionNumber: number }) => v.versionNumber)).toEqual([1, 2, 3]);
    expect(detalle.body.data.recipeVersionId).toBe(v3.recipeVersionId);
    const prisma = app.get(PrismaService);
    const guardada = await prisma.versionDeReceta.findUniqueOrThrow({ where: { id: v1.recipeVersionId } });
    expect(guardada.resultado).toEqual(v1.calculation);
    expect(guardada.metodoDeCalculo).toBe('SUM_SOURCE_PER_100G_V1');

    // Una versión vieja es un conflicto: no se pisa una edición.
    const viejo = await conSesion(app, pro.token)
      .patch(`/api/v1/nutrition/recipes/${v1.recipeId}`)
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({ ...cuerpoDeReceta(pollo, alimentos), expectedVersion: v1.version })
      .expect(409);
    expect(viejo.body.error.code).toBe('VERSION_CONFLICT');
  });

  it('un nutriente desconocido queda sin total (null) y nombra al ingrediente que lo debe; nunca cero', async () => {
    // El catálogo sintético de WP-04 no tiene fibra: es un dato desconocido, no cero.
    const arrozSintetico = await alimento(app, pro, 'Arroz blanco');
    const sintetico = (await conSesion(app, pro.token).get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent('Arroz blanco')}&limit=50`).expect(200)).body.data.find(
      (i: { catalogItemId: string }) => i.catalogItemId === arrozSintetico,
    );
    const r = await calcular({
      servings: 1,
      ingredients: [
        ...ingredientesDe(receta('BE-DEMO-NUT-001'), alimentos).slice(0, 1),
        { catalogItemId: arrozSintetico, catalogItemVersionId: sintetico.versionId, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED' },
      ],
    }).expect(200);
    expect(r.body.data.total.fiberG).toEqual({ value: null, missing: [{ key: '2', reason: 'SIN_DATO_DEL_NUTRIENTE' }] });
    expect(r.body.data.perServing.fiberG).toEqual({ value: null, missing: [{ key: '2', reason: 'SIN_DATO_DEL_NUTRIENTE' }] });
    // Lo demás se calcula: el pollo de USDA y el arroz sintético sí tienen energía y macros.
    expect(r.body.data.total.energyKcal.missing).toEqual([]);
    expect(mismoValorExacto(r.body.data.total.energyKcal.value, String(120 * 1.65 + 130))).toBe(true);
    // Mililitros contra una composición cada 100 g: sin equivalencia identificada, no se convierte.
    const ml = await calcular({ servings: 1, ingredients: [{ ...ingredientesDe(receta('BE-DEMO-NUT-001'), alimentos)[0], quantity: { value: 100, unit: 'ml' } }] }).expect(200);
    expect(ml.body.data.total.energyKcal).toEqual({ value: null, missing: [{ key: '1', reason: 'UNIDAD_SIN_EQUIVALENCIA' }] });
  });
});

describe('Permisos y referencias (DL-119)', () => {
  it('solo un profesional de Nutrición: un asesorado o un entrenador, 403; sin sesión, 401', async () => {
    const ase = await prepararAsesorado(app, 'recetas-ase', { a3: true });
    const entrenador = await prepararProfesional(app, 'recetas-trn', ['ENTRENAMIENTO']);
    for (const parte of [ase, entrenador]) {
      expect((await crearReceta(app, parte, cuerpoDeReceta(RECETAS[0]!, alimentos)).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
      await conSesion(app, parte.token).get('/api/v1/nutrition/recipes').expect(403);
      await conSesion(app, parte.token).post('/api/v1/nutrition/recipe-calculations').send({ servings: 1, ingredients: ingredientesDe(RECETAS[0]!, alimentos) }).expect(403);
    }
  });

  it('lo ajeno es el mismo 404 que lo inexistente: otro profesional no lee, no edita ni cambia la imagen de una receta ajena', async () => {
    const propia = (await crearReceta(app, pro, cuerpoDeReceta(RECETAS[1]!, alimentos)).expect(201)).body.data;
    const otro = await prepararProfesional(app, 'recetas-ajeno', ['NUTRICION']);
    const ajena = await conSesion(app, otro.token).get(`/api/v1/nutrition/recipes/${propia.recipeId}`).expect(404);
    const inexistente = await conSesion(app, otro.token).get(`/api/v1/nutrition/recipes/${randomUUID()}`).expect(404);
    expect(ajena.body).toEqual(inexistente.body);
    await conSesion(app, otro.token)
      .patch(`/api/v1/nutrition/recipes/${propia.recipeId}`)
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({ ...cuerpoDeReceta(RECETAS[1]!, alimentos), expectedVersion: propia.version })
      .expect(404);
    await conSesion(app, otro.token).put(`/api/v1/nutrition/recipes/${propia.recipeId}/image`).send({ mediaId: randomUUID(), expectedVersion: propia.version }).expect(404);
    await conSesion(app, otro.token).delete(`/api/v1/nutrition/recipes/${propia.recipeId}/image?expectedVersion=${propia.version}`).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    // La lista es solo de las propias.
    const lista = await conSesion(app, otro.token).get('/api/v1/nutrition/recipes').expect(200);
    expect(lista.body.data.map((r: { recipeId: string }) => r.recipeId)).not.toContain(propia.recipeId);
  });

  it('un ingrediente se cita por elemento y versión: otra versión, la de otro elemento o un elemento ajeno son 422 CATALOG_REFERENCE_INVALID', async () => {
    const base = cuerpoDeReceta(RECETAS[0]!, alimentos);
    const [primero, segundo] = base.ingredients;
    const casos = [
      { ...base, ingredients: [{ ...primero!, catalogItemVersionId: randomUUID() }] },
      { ...base, ingredients: [{ ...primero!, catalogItemVersionId: segundo!.catalogItemVersionId }] },
    ];
    for (const cuerpo of casos) {
      const r = await crearReceta(app, pro, cuerpo).expect(422);
      expect(r.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
      expect(r.body.error.details.issues[0].path).toMatch(/^ingredients\[0\]\.catalogItem(Version)?Id$/);
    }
    // Un alimento cargado por otro profesional es de su ámbito (REG-06-135).
    const otro = await prepararProfesional(app, 'recetas-catalogo-ajeno', ['NUTRICION']);
    const propioDelOtro = await conSesion(app, otro.token)
      .post('/api/v1/nutrition/catalog-items')
      .send({ name: 'Galleta sintética de otro profesional', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 420, proteinG: 8, carbohydrateG: 70, fatG: 12 } })
      .expect(201);
    const r = await calcular({
      servings: 1,
      ingredients: [{ catalogItemId: propioDelOtro.body.data.catalogItemId, catalogItemVersionId: propioDelOtro.body.data.versionId, quantity: { value: 50, unit: 'g' }, preparationState: 'AS_PURCHASED' }],
    }).expect(422);
    expect(r.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
    // El cliente no manda totales: un campo de más es 400 (contrato estricto).
    await crearReceta(app, pro, { ...base, calculation: { total: {} } }).expect(400);
    await crearReceta(app, pro, { ...base, ingredients: [{ ...primero!, quantity: { value: -10, unit: 'g' } }] }).expect(400);
    await crearReceta(app, pro, { ...base, servings: 0 }).expect(400);
  });

  it('la lista: la editada más recientemente primero, con cursor', async () => {
    const otro = await prepararProfesional(app, 'recetas-lista', ['NUTRICION']);
    const ids: string[] = [];
    for (const r of RECETAS) ids.push((await crearReceta(app, otro, cuerpoDeReceta(r, await alimentosUsda(app, otro))).expect(201)).body.data.recipeId);
    const primera = await conSesion(app, otro.token).get('/api/v1/nutrition/recipes?limit=2').expect(200);
    ListaDeRecetasResponseSchema.parse(primera.body);
    expect(primera.body.data.map((r: { recipeId: string }) => r.recipeId)).toEqual([ids[2], ids[1]]);
    expect(primera.body.page.hasMore).toBe(true);
    const segunda = await conSesion(app, otro.token).get(`/api/v1/nutrition/recipes?limit=2&cursor=${primera.body.page.nextCursor}`).expect(200);
    expect(segunda.body.data.map((r: { recipeId: string }) => r.recipeId)).toEqual([ids[0]]);
    await conSesion(app, otro.token).get('/api/v1/nutrition/recipes?cursor=basura').expect(400);
  });
});
