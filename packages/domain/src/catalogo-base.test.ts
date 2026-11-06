/**
 * WP-CATALOGO-BASE (DL-141, tramo 1): el contrato de lo importado para todos (D-1) y de los nombres alternativos (D-2), y
 * cómo se muestran; y (encargo de Dirección del 2026-10-19, bloque 4) el origen en la fila del buscador (D-6). Sin base,
 * sin red y sin reloj.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { EjercicioEncontradoSchema, BusquedaDeEjerciciosResponseSchema, type EjercicioDeCatalogo } from './contratos-entrenamiento';
import { CandidatoDeEjercicioSchema, ResolucionDeAlimentoSchema, ResolucionDeEjercicioSchema } from './contratos-integraciones';
import { BusquedaEnCatalogoResponseSchema, ElementoEncontradoSchema, type ElementoDeCatalogo } from './contratos-nutricion';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { terminosProhibidosEn } from './copy-nutricion';
import { origenEnElCatalogo } from './copy-origen-en-el-catalogo';
import { nombreAlternativoComoAclaracion, nombreConAlternativo } from './nombres-alternativos';
import { OPERACIONES } from './openapi';

const ID = '11111111-1111-4111-8111-111111111111';
const LICENCIA = { id: 'CC-BY-SA-4.0', label: 'Creative Commons Attribution Share Alike 4.0', url: null, attribution: 'autora-sintetica' };
const ejercicio: EjercicioDeCatalogo = {
  exerciseId: ID,
  versionId: ID,
  name: 'Press de banca',
  provenance: 'BE_SYNTHETIC_SEED',
  externalSource: null,
  muscleZones: [],
  didacticResources: [],
  available: true,
};
const alimento: ElementoDeCatalogo = {
  catalogItemId: ID,
  versionId: ID,
  name: 'Palta',
  itemType: 'FOOD',
  composition: { referenceAmount: '100g', energyKcal: 160, proteinG: 2, carbohydrateG: 8.5, fatG: 14.7 },
  provenance: 'BE_SYNTHETIC_SEED',
  externalSource: null,
  available: true,
};
const pagina = { limit: 20, nextCursor: null, hasMore: false };
/** DL-141 D-6: lo que suma cada fila de las búsquedas del website (lo sembrado: sin quién lo cargó y sin aproximación). */
const ORIGEN = { loadedBy: null, approximateCorrespondence: null };

// ─── D-2 · cómo se muestra el nombre alternativo ────────────────────────────────────────────────

test('D-2 · el nombre alternativo aclara entre paréntesis, en minúscula salvo una sigla', () => {
  assert.equal(nombreConAlternativo('Press de banca', 'Bench press'), 'Press de banca (bench press)');
  assert.equal(nombreConAlternativo('Palta', 'Aguacate'), 'Palta (aguacate)');
  assert.equal(nombreConAlternativo('Zancadas', 'Estocadas'), 'Zancadas (estocadas)');
  assert.equal(nombreConAlternativo('Banana', 'Plátano'), 'Banana (plátano)');
  // Una sigla no se toca, ni un nombre que ya empieza en minúscula.
  assert.equal(nombreAlternativoComoAclaracion('TRX row'), 'TRX row');
  assert.equal(nombreAlternativoComoAclaracion('pull-ups'), 'pull-ups');
  // Si coincidió el principal, el nombre tal cual.
  assert.equal(nombreConAlternativo('Palta', null), 'Palta');
  assert.equal(nombreConAlternativo('Palta', undefined), 'Palta');
});

// ─── D-2 · el campo nuevo, solo en las búsquedas del website ────────────────────────────────────

test('D-2 · la búsqueda del website trae matchedAlternativeName en cada fila: un nombre o null, nunca ausente ni de más', () => {
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: 'Bench press', origin: ORIGEN }).success, true);
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: null, origin: ORIGEN }).success, true);
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, origin: ORIGEN }).success, false, 'el campo va siempre, aunque sea null');
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: null, origin: ORIGEN, otro: 1 }).success, false, 'sigue siendo estricto');
  assert.equal(ElementoEncontradoSchema.safeParse({ ...alimento, matchedAlternativeName: 'Aguacate', origin: ORIGEN }).success, true);
  assert.equal(ElementoEncontradoSchema.safeParse({ ...alimento, origin: ORIGEN }).success, false);
  assert.equal(BusquedaDeEjerciciosResponseSchema.safeParse({ data: [{ ...ejercicio, matchedAlternativeName: null, origin: ORIGEN }], page: pagina }).success, true);
  assert.equal(BusquedaEnCatalogoResponseSchema.safeParse({ data: [{ ...alimento, matchedAlternativeName: 'Aguacate', origin: ORIGEN }], page: pagina }).success, true);

  const busqueda = (id: string) => OPERACIONES.find((o) => o.id === id)!.exitos[0]!.schema;
  assert.equal(busqueda('API-TRN-13-BUSQUEDA'), BusquedaDeEjerciciosResponseSchema);
  assert.equal(busqueda('API-NUT-13-BUSQUEDA'), BusquedaEnCatalogoResponseSchema);
});

test('D-2 · por qué el campo no va en API-TRN-13: la APK instalada la lee con un esquema congelado que lo rechazaría', () => {
  const congeladas = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json'), 'utf8')) as {
    operaciones: Record<string, { respuestas: Record<string, unknown> }>;
  };
  const congelada = z.fromJSONSchema(congeladas.operaciones['API-TRN-13']!.respuestas['200'] as Parameters<typeof z.fromJSONSchema>[0]);
  assert.equal(congelada.safeParse({ data: [ejercicio], page: pagina }).success, true);
  assert.equal(congelada.safeParse({ data: [{ ...ejercicio, matchedAlternativeName: null }], page: pagina }).success, false);
  // La lectura legada sigue declarando su respuesta de siempre.
  const legada = OPERACIONES.find((o) => o.id === 'API-TRN-13')!.exitos[0]!.schema!;
  assert.deepEqual(z.toJSONSchema(legada, { target: 'draft-2020-12', io: 'output' }), congeladas.operaciones['API-TRN-13']!.respuestas['200']);
});

// ─── D-6 · el origen en la fila del buscador del website ────────────────────────────────────────

test('D-6 · cada fila de las búsquedas del website trae su origen: quién lo cargó y si la correspondencia es aproximada', () => {
  const fila = { ...alimento, matchedAlternativeName: null };
  assert.equal(ElementoEncontradoSchema.safeParse({ ...fila, origin: { loadedBy: 'YOU', approximateCorrespondence: null } }).success, true);
  assert.equal(ElementoEncontradoSchema.safeParse({ ...fila, origin: { loadedBy: null, approximateCorrespondence: 'Es el top sirloin de USDA.' } }).success, true);
  assert.equal(ElementoEncontradoSchema.safeParse(fila).success, false, 'el origen va siempre');
  assert.equal(ElementoEncontradoSchema.safeParse({ ...fila, origin: { loadedBy: 'ELLA', approximateCorrespondence: null } }).success, false);
  assert.equal(ElementoEncontradoSchema.safeParse({ ...fila, origin: { loadedBy: null, approximateCorrespondence: '' } }).success, false, 'una aproximación dice en qué');
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: null, origin: { loadedBy: 'ANOTHER_PROFESSIONAL', approximateCorrespondence: null } }).success, true);
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: null, origin: { ...ORIGEN, extra: true } }).success, false, 'sigue siendo estricto');
});

test('D-6 · el esquema congelado de API-TRN-13 rechazaría el origen: por eso va solo en la búsqueda del website', () => {
  const congeladas = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json'), 'utf8')) as {
    operaciones: Record<string, { respuestas: Record<string, unknown> }>;
  };
  const congelada = z.fromJSONSchema(congeladas.operaciones['API-TRN-13']!.respuestas['200'] as Parameters<typeof z.fromJSONSchema>[0]);
  assert.equal(congelada.safeParse({ data: [{ ...ejercicio, origin: ORIGEN }], page: pagina }).success, false);
});

const comoDia = (instante: string) => instante.slice(0, 10);
const DE_USDA = {
  provider: 'USDA_FDC_SR_LEGACY' as const,
  externalId: '174055',
  receivedAt: '2026-10-19T00:00:00.000Z',
  license: { id: 'CC0-1.0', label: 'CC0 1.0 Universal (dominio público)', url: 'https://creativecommons.org/publicdomain/zero/1.0/', attribution: 'USDA Agricultural Research Service' },
  usdaReference: { dataset: 'FoodData Central · SR Legacy', ndbNumber: '23611', originalDescription: 'Beef, top sirloin, steak, separable lean only, raw', publishedOn: '2019-04-01', preparationDescription: 'crudo, magro' },
};

test('D-6 · el origen breve y su detalle: USDA (lo aproximado, a la vista), wger con su licencia, Open Food Facts, demostración y lo cargado a mano', () => {
  const usda = origenEnElCatalogo({ provenance: 'CONTROLLED_IMPORT', externalSource: DE_USDA, origin: ORIGEN }, comoDia);
  assert.deepEqual([usda.breve, usda.seccion], ['USDA', 'fuentes-alimentos']);
  assert.match(usda.detalle, /registro FDC 174055 \(NDB 23611\), «Beef, top sirloin, steak, separable lean only, raw»\.$/);
  const aproximada = origenEnElCatalogo({ provenance: 'CONTROLLED_IMPORT', externalSource: DE_USDA, origin: { loadedBy: null, approximateCorrespondence: 'Es el top sirloin de USDA: el cuadril sin la colita' } }, comoDia);
  assert.equal(aproximada.breve, 'USDA · equivalencia aproximada');
  assert.match(aproximada.detalle, /La equivalencia es aproximada\. Es el top sirloin de USDA: el cuadril sin la colita\.$/);

  const wger = origenEnElCatalogo({ provenance: 'CONTROLLED_IMPORT', externalSource: { provider: 'WGER', externalId: '73', receivedAt: '2026-10-19T00:00:00.000Z', license: LICENCIA }, origin: ORIGEN }, comoDia);
  assert.deepEqual([wger.breve, wger.seccion], ['wger · CC BY-SA 4.0', 'fuentes-ejercicios']);
  assert.match(wger.detalle, /el ejercicio 73, con la licencia Creative Commons Attribution Share Alike 4\.0 \(autoría: autora-sintetica\)\. Llegó al catálogo BE el 2026-10-19\.$/);
  const sinAutoria = origenEnElCatalogo({ provenance: 'CONTROLLED_IMPORT', externalSource: { provider: 'WGER', externalId: '74', receivedAt: '2026-10-19T00:00:00.000Z', license: { ...LICENCIA, id: 'CC0-1.0', attribution: null } }, origin: ORIGEN }, comoDia);
  assert.equal(sinAutoria.breve, 'wger · CC0 1.0');
  assert.doesNotMatch(sinAutoria.detalle, /autoría/);

  const off = origenEnElCatalogo(
    { provenance: 'CONTROLLED_IMPORT', externalSource: { provider: 'OPEN_FOOD_FACTS', externalId: '7790001', receivedAt: '2026-09-24T12:00:00.000Z', license: { id: 'ODbL-1.0', label: 'Open Database License (ODbL) 1.0', url: null, attribution: null } }, origin: ORIGEN },
    comoDia,
  );
  assert.deepEqual([off.breve, off.seccion], ['Open Food Facts · ODbL 1.0', 'fuentes-importados']);
  assert.match(off.detalle, /^Importado de Open Food Facts el 2026-09-24, el producto 7790001, con la licencia Open Database License \(ODbL\) 1\.0\. No es un dato verificado por BE\.$/);
  // Una licencia sin nombre corto conocido va con el que declara el proveedor.
  assert.equal(
    origenEnElCatalogo({ provenance: 'CONTROLLED_IMPORT', externalSource: { provider: 'WGER', externalId: '75', receivedAt: '2026-10-19T00:00:00.000Z', license: { id: 'OTRA', label: 'Otra licencia 2.0', url: null, attribution: null } }, origin: ORIGEN }, comoDia).breve,
    'wger · Otra licencia 2.0',
  );

  const demostracion = origenEnElCatalogo({ provenance: 'BE_SYNTHETIC_SEED', externalSource: null, origin: ORIGEN }, comoDia);
  assert.deepEqual([demostracion.breve, demostracion.seccion], ['Demostración', 'fuentes-demostracion']);
  const propio = origenEnElCatalogo({ provenance: 'PROFESSIONAL_MANUAL', externalSource: null, origin: { loadedBy: 'YOU', approximateCorrespondence: null } }, comoDia);
  assert.deepEqual([propio.breve, propio.seccion], ['Cargado por vos', null]);
  const deOtro = origenEnElCatalogo({ provenance: 'PROFESSIONAL_MANUAL', externalSource: null, origin: { loadedBy: 'ANOTHER_PROFESSIONAL', approximateCorrespondence: null } }, comoDia);
  assert.deepEqual([deOtro.breve, deOtro.seccion], ['Cargado por otro profesional', null]);
  // Un importado sin su fuente externa (anterior a WP-08) no inventa un proveedor.
  assert.equal(origenEnElCatalogo({ provenance: 'CONTROLLED_IMPORT', externalSource: null, origin: ORIGEN }, comoDia).breve, 'Importado');

  // Ningún texto propio con un juicio ni un porcentaje (TEST-PRJ-009): se muestra en Nutrición y en Entrenamiento.
  const textos = [usda, aproximada, wger, sinAutoria, off, demostracion, propio, deOtro].flatMap((o) => [o.breve, o.detalle]);
  assert.deepEqual(
    textos.flatMap((t) => [...terminosProhibidosEn(t), ...terminosProhibidosDeEntrenamientoEn(t)]),
    [],
  );
});

// ─── D-1 · el candidato y la resolución dicen si ya estaba ──────────────────────────────────────

test('D-1 · el candidato dice si el ítem ya está en el catálogo, entero, o null', () => {
  const base = {
    candidateId: ID,
    provider: 'WGER' as const,
    externalId: '901',
    receivedAt: '2026-10-17T03:00:00.000Z',
    expiresAt: '2026-10-24T03:00:00.000Z',
    candidate: { name: 'Estabilización abdominal', nameLanguage: 'es' as const, category: 'Abs', primaryMuscles: [], secondaryMuscles: [], equipment: [] },
    provenance: { provider: 'WGER' as const, externalId: '901', receivedAt: '2026-10-17T03:00:00.000Z', contentDigest: 'a'.repeat(64), license: LICENCIA, sourceUrl: 'http://127.0.0.1/sintetico' },
  };
  const importado: EjercicioDeCatalogo = {
    ...ejercicio,
    name: 'Estabilización abdominal',
    provenance: 'CONTROLLED_IMPORT',
    externalSource: { provider: 'WGER', externalId: '901', receivedAt: '2026-10-16T03:00:00.000Z', license: LICENCIA },
  };
  assert.equal(CandidatoDeEjercicioSchema.safeParse({ ...base, existingExercise: null }).success, true);
  assert.equal(CandidatoDeEjercicioSchema.safeParse({ ...base, existingExercise: importado }).success, true);
  assert.equal(CandidatoDeEjercicioSchema.safeParse(base).success, false, 'el campo va siempre, aunque sea null');
});

test('D-1 · la resolución apunta al elemento, nuevo o el que ya estaba, y en ese caso lo trae entero', () => {
  const resolucion = { candidateId: ID, decision: 'IMPORT' as const, correctedFields: ['name'], resolvedAt: '2026-10-17T03:00:00.000Z' };
  assert.equal(ResolucionDeAlimentoSchema.safeParse({ ...resolucion, catalogItem: { catalogItemId: ID, versionId: ID }, existingCatalogItem: { ...alimento, provenance: 'CONTROLLED_IMPORT' } }).success, true);
  assert.equal(ResolucionDeAlimentoSchema.safeParse({ ...resolucion, catalogItem: { catalogItemId: ID, versionId: ID }, existingCatalogItem: null }).success, true);
  assert.equal(ResolucionDeAlimentoSchema.safeParse({ ...resolucion, catalogItem: { catalogItemId: ID, versionId: ID } }).success, false);
  assert.equal(ResolucionDeEjercicioSchema.safeParse({ ...resolucion, decision: 'REJECT', correctedFields: [], exercise: null, existingExercise: null }).success, true);
});
