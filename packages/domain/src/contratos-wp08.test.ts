/**
 * WP-08 · los contratos de la importación controlada y las reglas puras que la API aplica antes de tocar la base.
 * Sin base, sin red y sin reloj.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CandidatoDeAlimentoSchema,
  CrearCandidatoDeAlimentoRequestSchema,
  CrearCandidatoDeEjercicioRequestSchema,
  ResolverCandidatoDeAlimentoRequestSchema,
  ResolverCandidatoDeEjercicioRequestSchema,
  type AlimentoCandidato,
} from './contratos-integraciones';
import { ElementoDeCatalogoSchema } from './contratos-nutricion';
import { EjercicioDeCatalogoSchema } from './contratos-entrenamiento';
import { camposCorregidosDeAlimento, camposCorregidosDeEjercicio, composicionCompleta, faltantesDeAlimento, faltantesDeEjercicio } from './integraciones';
import { erroresDeclarados, OPERACIONES } from './openapi';

const ID = '11111111-1111-4111-8111-111111111111';
const alimento = (cambios: Partial<AlimentoCandidato['composition']> = {}, nombre: string | null = 'Galletitas de prueba'): AlimentoCandidato => ({
  name: nombre,
  composition: { referenceAmount: '100g', energyKcal: 450, proteinG: 7.5, carbohydrateG: 65, fatG: 18, ...cambios },
});

// ─── Identificadores externos (D-I) ─────────────────────────────────────────────────────────────

test('D-I · el código de barras es EAN-8, UPC-A, EAN-13 o GTIN-14; nada más', () => {
  const pedir = (externalId: string) => CrearCandidatoDeAlimentoRequestSchema.safeParse({ provider: 'OPEN_FOOD_FACTS', lookup: { externalId } }).success;
  for (const valido of ['12345670', '012345678905', '7790001000013', '17790001000010']) assert.equal(pedir(valido), true, valido);
  for (const invalido of ['1234567', '123456789', '12345678901', '779000100001X', '', ' 7790001000013']) assert.equal(pedir(invalido), false, invalido);
});

test('D-I · el número de wger es un entero positivo, y el proveedor de cada operación es fijo', () => {
  assert.equal(CrearCandidatoDeEjercicioRequestSchema.safeParse({ provider: 'WGER', lookup: { externalId: '345' } }).success, true);
  for (const invalido of ['0', '-3', '3.5', 'abc', '0345']) assert.equal(CrearCandidatoDeEjercicioRequestSchema.safeParse({ provider: 'WGER', lookup: { externalId: invalido } }).success, false, invalido);
  // Pedirle a nutrición un ejercicio de wger, o al revés, no es otra forma del mismo pedido: es un pedido inválido.
  assert.equal(CrearCandidatoDeAlimentoRequestSchema.safeParse({ provider: 'WGER', lookup: { externalId: '7790001000013' } }).success, false);
  assert.equal(CrearCandidatoDeEjercicioRequestSchema.safeParse({ provider: 'OPEN_FOOD_FACTS', lookup: { externalId: '345' } }).success, false);
  // 09v7 T12: un campo no declarado se rechaza, también en la búsqueda (no es un passthrough del proveedor, D-B).
  assert.equal(CrearCandidatoDeAlimentoRequestSchema.safeParse({ provider: 'OPEN_FOOD_FACTS', lookup: { externalId: '7790001000013', q: 'galletitas' } }).success, false);
});

// ─── El candidato: lo que falta es null, nunca cero (B10-10 §1) ────────────────────────────────

test('B10-10 §1 · un nutriente que el proveedor no trajo viaja null; un negativo no es un dato', () => {
  const base = {
    candidateId: ID,
    provider: 'OPEN_FOOD_FACTS' as const,
    externalId: '7790001000013',
    receivedAt: '2026-09-24T03:00:00.000Z',
    expiresAt: '2026-10-01T03:00:00.000Z',
    provenance: {
      provider: 'OPEN_FOOD_FACTS' as const,
      externalId: '7790001000013',
      receivedAt: '2026-09-24T03:00:00.000Z',
      contentDigest: 'a'.repeat(64),
      license: { id: 'ODbL-1.0', label: 'Open Database License 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/', attribution: 'Colaboradores de Open Food Facts' },
      sourceUrl: 'https://world.openfoodfacts.org/product/7790001000013',
    },
  };
  assert.equal(CandidatoDeAlimentoSchema.safeParse({ ...base, candidate: { name: null, composition: { referenceAmount: '100g', energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null } } }).success, true);
  // La base tampoco se supone: si el proveedor no la declara sin ambigüedad, viaja null y la elige quien revisa.
  assert.equal(CandidatoDeAlimentoSchema.safeParse({ ...base, candidate: alimento({ referenceAmount: null }) }).success, true);
  assert.equal(CandidatoDeAlimentoSchema.safeParse({ ...base, candidate: alimento({ referenceAmount: '100kg' as never }) }).success, false);
  assert.equal(CandidatoDeAlimentoSchema.safeParse({ ...base, candidate: alimento({ fatG: -1 }) }).success, false);
  assert.equal(CandidatoDeAlimentoSchema.safeParse({ ...base, candidate: alimento(), provenance: { ...base.provenance, contentDigest: 'no-es-un-hash' } }).success, false);
});

// ─── Resolver: IMPORT con contenido revisado o REJECT, sin mezclas ──────────────────────────────

test('09v12:245-275 · IMPORT lleva el contenido revisado; REJECT no puede llevarlo', () => {
  assert.equal(ResolverCandidatoDeAlimentoRequestSchema.safeParse({ decision: 'IMPORT', reviewedContent: alimento(), rationale: null }).success, true);
  assert.equal(ResolverCandidatoDeAlimentoRequestSchema.safeParse({ decision: 'IMPORT', rationale: null }).success, false, 'IMPORT sin contenido');
  assert.equal(ResolverCandidatoDeAlimentoRequestSchema.safeParse({ decision: 'REJECT', rationale: 'Datos del envase ilegibles.' }).success, true);
  assert.equal(ResolverCandidatoDeAlimentoRequestSchema.safeParse({ decision: 'REJECT', reviewedContent: alimento() }).success, false, 'REJECT con contenido');
  assert.equal(ResolverCandidatoDeAlimentoRequestSchema.safeParse({ decision: 'ACCEPT', reviewedContent: alimento() }).success, false);
  // El contenido revisado admite null: la completitud es una regla del dominio, con su 422 y su ruta (D-I).
  assert.equal(ResolverCandidatoDeAlimentoRequestSchema.safeParse({ decision: 'IMPORT', reviewedContent: alimento({ energyKcal: null }) }).success, true);
  assert.equal(ResolverCandidatoDeEjercicioRequestSchema.safeParse({ decision: 'IMPORT', reviewedContent: { name: 'Plancha abdominal', muscleZones: [] } }).success, false, 'ninguna zona viaja en la resolución');
});

test('RF-028 · lo que falta para incorporar se dice por ruta; un cero es un dato, no un faltante', () => {
  assert.deepEqual(faltantesDeAlimento(alimento()), []);
  assert.deepEqual(faltantesDeAlimento(alimento({ fatG: 0 })), [], '0 g de grasa es un dato');
  assert.deepEqual(faltantesDeAlimento(alimento({ referenceAmount: null, energyKcal: null, fatG: null }, '  ')), [
    { code: 'REQUIRED', path: 'reviewedContent.name' },
    { code: 'REQUIRED', path: 'reviewedContent.composition.referenceAmount' },
    { code: 'REQUIRED', path: 'reviewedContent.composition.energyKcal' },
    { code: 'REQUIRED', path: 'reviewedContent.composition.fatG' },
  ]);
  assert.deepEqual(faltantesDeEjercicio({ name: null }), [{ code: 'REQUIRED', path: 'reviewedContent.name' }]);
  assert.deepEqual(faltantesDeEjercicio({ name: 'Plancha abdominal' }), []);
  assert.throws(() => composicionCompleta(alimento({ proteinG: null }).composition), /incompleta/);
  assert.throws(() => composicionCompleta(alimento({ referenceAmount: null }).composition), /referenceAmount/);
  assert.deepEqual(composicionCompleta(alimento().composition), { referenceAmount: '100g', energyKcal: 450, proteinG: 7.5, carbohydrateG: 65, fatG: 18 });
});

test('UC-I07 §14.5.6 · la corrección no oculta la fuente: se registra qué cambió, y un espacio de más no es un cambio', () => {
  const recibido = alimento({ energyKcal: null }, 'Galletitas de prueba');
  const revisado = alimento({ energyKcal: 452 }, 'Galletitas  de prueba ');
  assert.deepEqual(camposCorregidosDeAlimento(recibido, revisado), ['composition.energyKcal']);
  assert.deepEqual(camposCorregidosDeAlimento(recibido, { ...revisado, name: 'Galletitas dulces' }), ['name', 'composition.energyKcal']);
  // Elegir la base que el proveedor no declaró también es un dato del profesional, y queda registrado.
  assert.deepEqual(camposCorregidosDeAlimento(alimento({ referenceAmount: null }), alimento()), ['composition.referenceAmount']);
  const ejercicio = { name: 'Estabilización abdominal', nameLanguage: 'es' as const, category: 'Abdominales', primaryMuscles: [], secondaryMuscles: [], equipment: [] };
  assert.deepEqual(camposCorregidosDeEjercicio(ejercicio, { name: 'Estabilización abdominal' }), []);
  assert.deepEqual(camposCorregidosDeEjercicio(ejercicio, { name: 'Plancha' }), ['name']);
});

// ─── El catálogo muestra la procedencia (RF-060) ────────────────────────────────────────────────

test('RF-060 · un elemento importado declara CONTROLLED_IMPORT y su fuente; uno manual, fuente null', () => {
  const fuente = { provider: 'OPEN_FOOD_FACTS', externalId: '7790001000013', receivedAt: '2026-09-24T03:00:00.000Z', license: { id: 'ODbL-1.0', label: 'ODbL 1.0', url: null, attribution: null } };
  const elemento = { catalogItemId: ID, versionId: ID, name: 'Galletitas', itemType: 'FOOD', composition: composicionCompleta(alimento().composition), available: true };
  assert.equal(ElementoDeCatalogoSchema.safeParse({ ...elemento, provenance: 'CONTROLLED_IMPORT', externalSource: fuente }).success, true);
  assert.equal(ElementoDeCatalogoSchema.safeParse({ ...elemento, provenance: 'PROFESSIONAL_MANUAL', externalSource: null }).success, true);
  assert.equal(ElementoDeCatalogoSchema.safeParse({ ...elemento, provenance: 'PROFESSIONAL_MANUAL' }).success, false, 'la fuente se declara siempre, aunque sea null');
  const ejercicio = { exerciseId: ID, versionId: ID, name: 'Plancha', muscleZones: [], didacticResources: [], available: true };
  assert.equal(EjercicioDeCatalogoSchema.safeParse({ ...ejercicio, provenance: 'CONTROLLED_IMPORT', externalSource: { ...fuente, provider: 'WGER', externalId: '56' } }).success, true);
});

// ─── El contrato publicado ──────────────────────────────────────────────────────────────────────

test('09v12 §5-§7 · las cuatro operaciones están declaradas, con Idempotency-Key, y el 503 del proveedor convive con el de la base', () => {
  for (const id of ['API-INT-NUT-02', 'API-INT-NUT-03', 'API-INT-TRN-02', 'API-INT-TRN-03']) {
    const op = OPERACIONES.find((o) => o.id === id);
    assert.ok(op, id);
    assert.equal(op.idempotencia, true, id);
  }
  assert.deepEqual([...erroresDeclarados('API-INT-NUT-02')['503']!].sort(), ['DB_UNAVAILABLE', 'DEPENDENCY_UNAVAILABLE']);
  assert.deepEqual([...erroresDeclarados('API-INT-TRN-02')['503']!].sort(), ['DB_UNAVAILABLE', 'DEPENDENCY_UNAVAILABLE']);
  assert.deepEqual(erroresDeclarados('API-INT-NUT-03')['422'], ['IMPORT_CANDIDATE_NOT_RESOLVABLE', 'REVIEWED_CONTENT_INVALID']);
  // Una operación sin 503 propio sigue declarando el común.
  assert.deepEqual(erroresDeclarados('API-INT-NUT-01')['503'], ['DB_UNAVAILABLE']);
});

test('B10-05 §19-§20 · el copy no dice «importado» antes de resolver, ni presenta al proveedor como garantía de BE', async () => {
  const { COPY_INTEGRACIONES, terminosProhibidosDeIntegracionesEn } = await import('./copy-integraciones');
  const { terminosProhibidosEn } = await import('./copy-nutricion');
  const { terminosProhibidosDeEntrenamientoEn } = await import('./copy-entrenamiento');
  const textos = Object.values(COPY_INTEGRACIONES);
  const hallazgos = textos.flatMap((t) => [...terminosProhibidosDeIntegracionesEn(t), ...terminosProhibidosEn(t), ...terminosProhibidosDeEntrenamientoEn(t)].map((p) => `${p} en «${t}»`));
  assert.deepEqual(hallazgos, []);
  // «Importado de» solo existe para rotular un elemento ya incorporado; ningún texto del candidato lo usa.
  for (const [clave, texto] of Object.entries(COPY_INTEGRACIONES)) if (clave !== 'importadoDe') assert.doesNotMatch(texto, /\bimportado\b/i, clave);
  // La caída ofrece el camino alternativo, con las palabras de B10-05 §20.
  assert.match(COPY_INTEGRACIONES.proveedorCaidoAlimento, /catálogo BE o cargar un alimento manualmente/);
  // El detector distingue afirmar de negar.
  assert.deepEqual(terminosProhibidosDeIntegracionesEn('Este dato está verificado por BE.'), ['verificado por be']);
  assert.deepEqual(terminosProhibidosDeIntegracionesEn(COPY_INTEGRACIONES.noVerificadoPorBe), []);
});
