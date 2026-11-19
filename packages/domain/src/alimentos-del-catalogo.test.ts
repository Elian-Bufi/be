/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · las piezas del dominio de los alimentos del catálogo: el nivel del origen (NUA-03),
 * los grupos y sus íconos (NUA-05) y los contratos que lee el website (todo lo nuevo es opcional: una API anterior no lo
 * manda y vale lo de siempre).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ETIQUETA_DEL_NIVEL,
  GRUPO_API,
  GRUPO_DE_LA_CURADURIA,
  GRUPO_EN_LA_BASE,
  GRUPOS_DE_ALIMENTO,
  ICONO_DEL_GRUPO,
  iconoDelAlimento,
  NOMBRE_DEL_GRUPO,
  nivelDeOrigen,
  ordenDelNivel,
} from './alimentos-del-catalogo';
import { CorregirAlimentoRequestSchema, DecidirSobreAlimentoRequestSchema } from './contratos-alimentos';
import { CrearElementoDeCatalogoRequestSchema, ElementoEncontradoSchema } from './contratos-nutricion';
import { ItemDeLaEstimacionSchema } from './contratos-totales-del-plan';
import { ICONOS, NOMBRES_DE_ICONO } from './iconos';

const USDA = 'USDA_FDC_SR_LEGACY';

test('NUA-03 · el nivel: la tabla oficial y lo certificado son «Verificado»; lo propio, «Tuyo»; lo ajeno, «De otro profesional»', () => {
  assert.equal(nivelDeOrigen({ provenance: 'CONTROLLED_IMPORT', externalProvider: USDA, loadedBy: null, certified: false }), 'VERIFIED');
  assert.equal(nivelDeOrigen({ provenance: 'PROFESSIONAL_MANUAL', externalProvider: null, loadedBy: 'YOU', certified: false }), 'YOURS');
  assert.equal(nivelDeOrigen({ provenance: 'PROFESSIONAL_MANUAL', externalProvider: null, loadedBy: 'ANOTHER_PROFESSIONAL', certified: false }), 'OTHER_PROFESSIONAL');
  // La certificación vale más que quién lo cargó.
  assert.equal(nivelDeOrigen({ provenance: 'PROFESSIONAL_MANUAL', externalProvider: null, loadedBy: 'ANOTHER_PROFESSIONAL', certified: true }), 'VERIFIED');
  assert.equal(nivelDeOrigen({ provenance: 'PROFESSIONAL_MANUAL', externalProvider: null, loadedBy: 'YOU', certified: true }), 'VERIFIED');
  // Lo importado de Open Food Facts y lo de demostración conservan su origen, sin un nivel más.
  assert.equal(nivelDeOrigen({ provenance: 'CONTROLLED_IMPORT', externalProvider: 'OPEN_FOOD_FACTS', loadedBy: null, certified: false }), 'UNVERIFIED');
  assert.equal(nivelDeOrigen({ provenance: 'BE_SYNTHETIC_SEED', externalProvider: null, loadedBy: null, certified: false }), 'UNVERIFIED');
  assert.equal(ETIQUETA_DEL_NIVEL.UNVERIFIED, null);
  assert.deepEqual([ETIQUETA_DEL_NIVEL.VERIFIED, ETIQUETA_DEL_NIVEL.YOURS, ETIQUETA_DEL_NIVEL.OTHER_PROFESSIONAL], ['Verificado', 'Tuyo', 'De otro profesional']);
  // Solo lo de otro profesional va después.
  assert.deepEqual((['VERIFIED', 'YOURS', 'OTHER_PROFESSIONAL', 'UNVERIFIED'] as const).map(ordenDelNivel), [0, 0, 1, 0]);
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
  assert.equal(CorregirAlimentoRequestSchema.safeParse({ name: 'Galleta', composition: fila.composition }).success, false);
  assert.equal(CorregirAlimentoRequestSchema.safeParse({ expectedVersion: 'v2', name: 'Galleta', composition: fila.composition }).success, true);
  // La decisión: un campo de más no entra (objeto estricto).
  assert.equal(DecidirSobreAlimentoRequestSchema.safeParse({ expectedVersion: 'v1', decision: 'CERTIFY', source: 'x', profesional: 'y' }).success, false);
});
