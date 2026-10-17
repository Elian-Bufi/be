/**
 * WP-CATALOGO-BASE (DL-141, tramo 1): el contrato de lo importado para todos (D-1) y de los nombres alternativos (D-2), y
 * cómo se muestran. Sin base, sin red y sin reloj.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { EjercicioEncontradoSchema, BusquedaDeEjerciciosResponseSchema, type EjercicioDeCatalogo } from './contratos-entrenamiento';
import { CandidatoDeEjercicioSchema, ResolucionDeAlimentoSchema, ResolucionDeEjercicioSchema } from './contratos-integraciones';
import { BusquedaEnCatalogoResponseSchema, ElementoEncontradoSchema, type ElementoDeCatalogo } from './contratos-nutricion';
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
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: 'Bench press' }).success, true);
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: null }).success, true);
  assert.equal(EjercicioEncontradoSchema.safeParse(ejercicio).success, false, 'el campo va siempre, aunque sea null');
  assert.equal(EjercicioEncontradoSchema.safeParse({ ...ejercicio, matchedAlternativeName: null, otro: 1 }).success, false, 'sigue siendo estricto');
  assert.equal(ElementoEncontradoSchema.safeParse({ ...alimento, matchedAlternativeName: 'Aguacate' }).success, true);
  assert.equal(ElementoEncontradoSchema.safeParse(alimento).success, false);
  assert.equal(BusquedaDeEjerciciosResponseSchema.safeParse({ data: [{ ...ejercicio, matchedAlternativeName: null }], page: pagina }).success, true);
  assert.equal(BusquedaEnCatalogoResponseSchema.safeParse({ data: [{ ...alimento, matchedAlternativeName: 'Aguacate' }], page: pagina }).success, true);

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
