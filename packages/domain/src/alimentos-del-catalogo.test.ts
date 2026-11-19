/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · las piezas del dominio de los alimentos del catálogo: el nivel del origen (NUA-03),
 * los grupos y sus íconos (NUA-05) y los contratos que lee el website (todo lo nuevo es opcional: una API anterior no lo
 * manda y vale lo de siempre).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cantidadDeLaMedida,
  claveDeNombreParecido,
  equivalenciaEnPalabras,
  ETIQUETA_DEL_NIVEL,
  GRUPO_API,
  GRUPO_DE_LA_CURADURIA,
  GRUPO_EN_LA_BASE,
  GRUPOS_DE_ALIMENTO,
  ICONO_DEL_GRUPO,
  iconoDelAlimento,
  NOMBRE_DEL_GRUPO,
  MedidasCaserasSchema,
  medidaElegidaEnPalabras,
  nivelDeOrigen,
} from './alimentos-del-catalogo';
import { CorregirAlimentoRequestSchema, DecidirSobreAlimentoRequestSchema, SumarAlCanonRequestSchema } from './contratos-alimentos';
import { CrearElementoDeCatalogoRequestSchema, ElementoEncontradoSchema, ItemPrescriptoEntradaSchema } from './contratos-nutricion';
import { CodigoDeProblemaDePlan, normalizarEstructura, problemasDeBorrador } from './nutricion';
import { ItemDeLaEstimacionSchema } from './contratos-totales-del-plan';
import { ICONOS, NOMBRES_DE_ICONO } from './iconos';

const USDA = 'USDA_FDC_SR_LEGACY';

test('NUA-03 y NUA-D14 · el nivel: la tabla oficial, el canon y lo certificado son «Verificado»; lo propio, «Tuyo»; no hay «De otro profesional»', () => {
  assert.equal(nivelDeOrigen({ provenance: 'CONTROLLED_IMPORT', externalProvider: USDA, loadedBy: null, certified: false }), 'VERIFIED');
  assert.equal(nivelDeOrigen({ provenance: 'PROFESSIONAL_MANUAL', externalProvider: null, loadedBy: 'YOU', certified: false }), 'YOURS');
  // Lo del canon llega como verificado por Administración (`certified`), sin proveedor externo.
  assert.equal(nivelDeOrigen({ provenance: 'CONTROLLED_IMPORT', externalProvider: null, loadedBy: null, certified: true }), 'VERIFIED');
  // La certificación vale más que quién lo cargó.
  assert.equal(nivelDeOrigen({ provenance: 'PROFESSIONAL_MANUAL', externalProvider: null, loadedBy: 'YOU', certified: true }), 'VERIFIED');
  // Lo importado de Open Food Facts y lo de demostración conservan su origen, sin un nivel más.
  assert.equal(nivelDeOrigen({ provenance: 'CONTROLLED_IMPORT', externalProvider: 'OPEN_FOOD_FACTS', loadedBy: null, certified: false }), 'UNVERIFIED');
  assert.equal(nivelDeOrigen({ provenance: 'BE_SYNTHETIC_SEED', externalProvider: null, loadedBy: null, certified: false }), 'UNVERIFIED');
  assert.equal(ETIQUETA_DEL_NIVEL.UNVERIFIED, null);
  assert.deepEqual(ETIQUETA_DEL_NIVEL, { VERIFIED: 'Verificado', YOURS: 'Tuyo', UNVERIFIED: null });
  assert.equal(ElementoEncontradoSchema.shape.originLevel.safeParse('OTHER_PROFESSIONAL').success, false);
});

test('NUA-D15 · los nombres parecidos: sin tildes, sin mayúsculas, sin espacios de más y sin plurales simples', () => {
  assert.equal(claveDeNombreParecido('  Milanesas   de SOJA '), 'milanesa de soja');
  assert.equal(claveDeNombreParecido('milanesa de soja'), 'milanesa de soja');
  assert.equal(claveDeNombreParecido('Panes integrales'), 'pan integral');
  assert.equal(claveDeNombreParecido('Limones'), 'limon');
  assert.equal(claveDeNombreParecido('Tomates perita'), 'tomate perita');
  assert.equal(claveDeNombreParecido('Huevos'), 'huevo');
  assert.equal(claveDeNombreParecido('Té con leche'), 'te con leche');
  // Las palabras cortas no se tocan («gas», «tos»).
  assert.equal(claveDeNombreParecido('Agua con gas'), 'agua con gas');
  assert.equal(claveDeNombreParecido('Proteína en polvo, sabor vainilla'), 'proteina en polvo sabor vainilla');
});

test('NUA-08 · las medidas caseras: una de cada tipo, su equivalencia a la vista y la cantidad siempre en gramos', () => {
  assert.equal(MedidasCaserasSchema.safeParse([{ kind: 'CUP', amount: 240 }, { kind: 'UNIT', amount: 50 }]).success, true);
  assert.equal(MedidasCaserasSchema.safeParse([{ kind: 'CUP', amount: 240 }, { kind: 'CUP', amount: 200 }]).success, false, 'una de cada tipo');
  assert.equal(MedidasCaserasSchema.safeParse([{ kind: 'CUP', amount: 0 }]).success, false);
  assert.equal(equivalenciaEnPalabras({ kind: 'CUP', amount: 240 }), '1 taza = 240 g');
  assert.equal(equivalenciaEnPalabras({ kind: 'TABLESPOON', amount: 12.5 }, '100ml'), '1 cucharada = 12,5 ml');
  assert.equal(cantidadDeLaMedida({ count: 1.5, amountPerUnit: 240 }), 360);
  assert.equal(cantidadDeLaMedida({ count: 3, amountPerUnit: 33.33 }), 100);
  assert.equal(medidaElegidaEnPalabras({ kind: 'CUP', count: 2, amountPerUnit: 240 }), '2 tazas (480 g)');
  assert.equal(medidaElegidaEnPalabras({ kind: 'UNIT', count: 1, amountPerUnit: 50 }), '1 unidad (50 g)');
  // En el plan: la medida viaja con su cantidad en gramos, y la cantidad tiene que ser la de la medida.
  const item = (cantidad: number | null, medida: object | null) => ({
    dayTypes: [{ label: 'D', meals: [{ label: 'C', prescriptionMode: 'DISH_OPTIONS' as const, options: [{ label: 'O', items: [{ catalogItemId: 'a', quantity: cantidad === null ? null : { value: cantidad, unit: 'g' as const }, preparationState: 'RAW' as const, ...(medida ? { householdMeasure: medida } : {}) }] }] }] }],
  });
  let n = 0;
  const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  const taza = { kind: 'CUP', count: 2, amountPerUnit: 240 };
  assert.equal(ItemPrescriptoEntradaSchema.safeParse({ catalogItemId: id(), quantity: { value: 480, unit: 'g' }, preparationState: 'RAW', householdMeasure: taza }).success, true);
  const bien = normalizarEstructura(item(480, taza) as never, id);
  assert.deepEqual(bien.dayTypes[0]!.meals[0]!.options[0]!.items[0]!.householdMeasure, taza);
  assert.deepEqual(problemasDeBorrador(bien, new Set(['a'])), []);
  const mal = normalizarEstructura(item(400, taza) as never, id);
  assert.deepEqual(problemasDeBorrador(mal, new Set(['a'])).map((p) => p.code), [CodigoDeProblemaDePlan.HOUSEHOLD_MEASURE_INCONSISTENT]);
  // Sin cantidad, la medida no se guarda; sin medida, todo como siempre.
  assert.equal('householdMeasure' in normalizarEstructura(item(null, taza) as never, id).dayTypes[0]!.meals[0]!.options[0]!.items[0]!, false);
  assert.equal('householdMeasure' in normalizarEstructura(item(100, null) as never, id).dayTypes[0]!.meals[0]!.options[0]!.items[0]!, false);
});

test('NUA-D16 · sumar al canon pide la fuente; las cargas a marcar, hasta 50', () => {
  const base = { name: 'Milanesa de soja', composition: { referenceAmount: '100g', energyKcal: 250, proteinG: 18, carbohydrateG: 20, fatG: 10 } };
  assert.equal(SumarAlCanonRequestSchema.safeParse(base).success, false, 'sin fuente');
  assert.equal(SumarAlCanonRequestSchema.safeParse({ ...base, source: '  ' }).success, false);
  assert.equal(SumarAlCanonRequestSchema.safeParse({ ...base, source: 'Rótulo del envase' }).success, true);
  assert.equal(SumarAlCanonRequestSchema.safeParse({ ...base, source: 'x', equivalentCatalogItemIds: Array.from({ length: 51 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`) }).success, false);
});

test('NUA-05 · cada grupo tiene su nombre, su ícono de la familia y su valor en la base, ida y vuelta', () => {
  for (const g of GRUPOS_DE_ALIMENTO) {
    assert.ok(NOMBRE_DEL_GRUPO[g].length > 0, g);
    assert.ok((NOMBRES_DE_ICONO as readonly string[]).includes(ICONO_DEL_GRUPO[g]), `${g}: ${ICONO_DEL_GRUPO[g]} no es de la familia`);
    assert.equal(GRUPO_API[GRUPO_EN_LA_BASE[g]], g);
  }
  // Cada grupo con su propio dibujo, salvo «Otros», que usa el genérico.
  const iconos = GRUPOS_DE_ALIMENTO.filter((g) => g !== 'OTHER').map((g) => ICONO_DEL_GRUPO[g]);
  assert.equal(new Set(iconos).size, iconos.length);
  assert.equal(ICONO_DEL_GRUPO.OTHER, 'alimento');
  assert.equal(iconoDelAlimento(null), 'alimento');
  assert.equal(iconoDelAlimento(undefined), 'alimento');
  assert.equal(iconoDelAlimento('FISH'), 'pescados');
  // Los doce íconos nuevos son del grupo «Alimentos» de la familia.
  for (const n of iconos) assert.equal(ICONOS[n].grupo, 'Alimentos', n);
  // Los grupos de la curaduría van a un grupo de BE: los cuatro de carnes a «Carnes», leches y quesos a «Lácteos».
  assert.equal(GRUPO_DE_LA_CURADURIA['Carnes vacunas'], 'MEAT');
  assert.equal(GRUPO_DE_LA_CURADURIA['Cerdo y fiambres'], 'MEAT');
  assert.equal(GRUPO_DE_LA_CURADURIA['Quesos'], 'DAIRY');
  assert.equal(GRUPO_DE_LA_CURADURIA['Condimentos, especias y otros'], 'OTHER');
});

test('los contratos: lo nuevo es opcional, y la API anterior se sigue leyendo igual', () => {
  const fila = {
    catalogItemId: '00000000-0000-4000-8000-000000000001',
    versionId: '00000000-0000-4000-8000-000000000002',
    name: 'Arroz',
    itemType: 'FOOD',
    composition: { referenceAmount: '100g', energyKcal: 130, proteinG: 2.7, carbohydrateG: 28, fatG: 0.3 },
    provenance: 'CONTROLLED_IMPORT',
    externalSource: null,
    available: true,
    matchedAlternativeName: null,
    origin: { loadedBy: null, approximateCorrespondence: null },
  };
  assert.equal(ElementoEncontradoSchema.safeParse(fila).success, true, 'una fila de antes');
  assert.equal(ElementoEncontradoSchema.safeParse({ ...fila, foodGroup: 'GRAINS', originLevel: 'VERIFIED', certification: null, verifiedEquivalent: null }).success, true);
  assert.equal(ElementoEncontradoSchema.safeParse({ ...fila, foodGroup: 'PASTA' }).success, false, 'un grupo que no existe');
  const item = { itemId: fila.catalogItemId, catalogItemId: fila.catalogItemId, catalogItemVersionId: null, name: null, quantity: null, composition: null };
  assert.equal(ItemDeLaEstimacionSchema.safeParse(item).success, true, 'un ítem de antes');
  assert.equal(ItemDeLaEstimacionSchema.safeParse({ ...item, foodGroup: null, retired: true }).success, true);
  // Cargar a mano con o sin grupo; corregir exige la versión vista.
  const carga = { name: 'Galleta', itemType: 'FOOD', composition: fila.composition };
  assert.equal(CrearElementoDeCatalogoRequestSchema.safeParse(carga).success, true);
  assert.equal(CrearElementoDeCatalogoRequestSchema.safeParse({ ...carga, group: 'SWEETS' }).success, true);
  // NUA-D14: lo cargado a mano no se comparte: no hay un campo para compartirlo (objeto estricto).
  assert.equal(CrearElementoDeCatalogoRequestSchema.safeParse({ ...carga, share: true }).success, false);
  assert.equal(CrearElementoDeCatalogoRequestSchema.safeParse({ ...carga, householdMeasures: [{ kind: 'UNIT', amount: 30 }] }).success, true);
  assert.equal(CorregirAlimentoRequestSchema.safeParse({ name: 'Galleta', composition: fila.composition }).success, false);
  assert.equal(CorregirAlimentoRequestSchema.safeParse({ expectedVersion: 'v2', name: 'Galleta', composition: fila.composition }).success, true);
  // La decisión: un campo de más no entra (objeto estricto).
  assert.equal(DecidirSobreAlimentoRequestSchema.safeParse({ expectedVersion: 'v1', decision: 'CERTIFY', source: 'x', profesional: 'y' }).success, false);
});
