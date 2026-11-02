/**
 * DL-081 — el catálogo de las 17 zonas musculares y las operaciones de WP-CATALOGO-VISUAL. Los nombres de las capas son
 * los del set de Dirección del 2026-08-13 («BE-TRAIN · set de capas musculares», `registro-m-front.json` y
 * `registro-m-back.json`): la prueba los copia tal cual, para que una zona nueva o renombrada no pase sin su máscara.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { CambiarZonasDeEjercicioRequestSchema, FichasVisualesRequestSchema } from './contratos-catalogo-visual';
import { EjercicioDeCatalogoSchema, RecursoDidacticoSchema, RelacionConZonaSchema } from './contratos-entrenamiento';
import { OPERACIONES } from './openapi';
import {
  esZonaMuscular,
  ListaDeZonasMuscularesResponseSchema,
  nombreDeZona,
  ordenarZonasDeEjercicio,
  problemasDeZonas,
  VERSION_DEL_CATALOGO_DE_ZONAS,
  ZONAS_MUSCULARES,
  zonasMuscularesApi,
} from './zonas-musculares';

/** Las capas del set: `be-mask-m-front-{zona}.png` y `be-mask-m-back-{zona}.png`. */
const CAPAS_DE_FRENTE = ['deltoides', 'pectoral', 'biceps', 'antebrazo', 'recto-abdominal', 'oblicuos', 'cuadriceps', 'aductores', 'tibial'];
const CAPAS_DE_ESPALDA = ['trapecio', 'romboides', 'deltoides', 'dorsal', 'erectores', 'triceps', 'antebrazo', 'gluteos', 'isquios', 'gemelos'];

test('REG-06-137 · 17 zonas únicas: 9 de frente, 10 de espalda y 2 en las dos (antebrazo y deltoides)', () => {
  const ids = ZONAS_MUSCULARES.map((z) => z.zoneId);
  assert.equal(new Set(ids).size, 17);
  const deFrente = ZONAS_MUSCULARES.filter((z) => (z.anatomicalViews as readonly string[]).includes('ANTERIOR')).map((z) => z.zoneId);
  const deEspalda = ZONAS_MUSCULARES.filter((z) => (z.anatomicalViews as readonly string[]).includes('POSTERIOR')).map((z) => z.zoneId);
  assert.equal(deFrente.length, 9);
  assert.equal(deEspalda.length, 10);
  assert.deepEqual(deFrente.filter((id) => deEspalda.includes(id)).sort(), ['antebrazo', 'deltoides']);
});

test('REG-06-138 · cada máscara del set cita una zona, con su vista; ninguna zona queda sin máscara', () => {
  assert.deepEqual(ZONAS_MUSCULARES.filter((z) => (z.anatomicalViews as readonly string[]).includes('ANTERIOR')).map((z) => z.zoneId).sort(), [...CAPAS_DE_FRENTE].sort());
  assert.deepEqual(ZONAS_MUSCULARES.filter((z) => (z.anatomicalViews as readonly string[]).includes('POSTERIOR')).map((z) => z.zoneId).sort(), [...CAPAS_DE_ESPALDA].sort());
  for (const z of ZONAS_MUSCULARES) {
    assert.match(z.zoneId, /^[a-z]+(-[a-z]+)*$/, 'el identificador es el nombre del grupo en el archivo: minúsculas, sin tildes');
    assert.ok(z.name.trim().length > 0 && (z.name as string) !== z.zoneId, `${z.zoneId} tiene un nombre visible propio`);
  }
});

test('API-ZON-01 · el catálogo responde las 17, con su versión, y valida con su esquema', () => {
  const r = ListaDeZonasMuscularesResponseSchema.parse({ data: zonasMuscularesApi() });
  assert.equal(r.data.length, 17);
  assert.ok(r.data.every((z) => z.version === VERSION_DEL_CATALOGO_DE_ZONAS));
  assert.deepEqual(r.data.find((z) => z.zoneId === 'deltoides')!.anatomicalViews, ['ANTERIOR', 'POSTERIOR']);
});

test('una zona se reconoce solo por su identificador exacto, y cada problema lleva su ruta', () => {
  assert.equal(esZonaMuscular('gluteos'), true);
  for (const otro of ['Gluteos', 'glúteos', ' gluteos', 'zone_chest', 'Glúteos', '']) assert.equal(esZonaMuscular(otro), false, otro);
  assert.equal(nombreDeZona('isquios'), 'Isquiotibiales');
  assert.equal(nombreDeZona('pecho'), null);
  assert.deepEqual(problemasDeZonas([]), []);
  assert.deepEqual(problemasDeZonas([{ zoneId: 'pectoral' }, { zoneId: 'pecho' }, { zoneId: 'pectoral' }]), [
    { code: 'MUSCLE_ZONE_UNKNOWN', path: 'muscleZones[1].zoneId' },
    { code: 'MUSCLE_ZONE_DUPLICATED', path: 'muscleZones[2].zoneId' },
  ]);
});

test('las zonas de un ejercicio se leen primero las principales y, dentro de cada rol, en el orden del catálogo', () => {
  const ordenadas = ordenarZonasDeEjercicio([
    { zoneId: 'triceps', role: 'SECONDARY' as const },
    { zoneId: 'pectoral', role: 'PRIMARY' as const },
    { zoneId: 'deltoides', role: 'SECONDARY' as const },
  ]);
  assert.deepEqual(ordenadas.map((z) => z.zoneId), ['pectoral', 'deltoides', 'triceps']);
});

test('09v10 §7.1 · la relación es PRIMARY o SECONDARY, sin porcentajes ni pesos, y su forma es la congelada', () => {
  assert.equal(RelacionConZonaSchema.safeParse({ zoneId: 'pectoral', role: 'PRIMARY' }).success, true);
  assert.equal(RelacionConZonaSchema.safeParse({ zoneId: 'pectoral', role: 'PRINCIPAL' }).success, false);
  assert.equal(RelacionConZonaSchema.safeParse({ zoneId: 'pectoral', role: 'PRIMARY', percentage: 63 }).success, false);
  // Lo que leen las APK instaladas no cambia: la zona y el recurso tienen exactamente los campos de siempre.
  const salida = (s: z.ZodType) => z.toJSONSchema(s, { target: 'draft-2020-12', io: 'output' }) as { properties: Record<string, unknown> };
  assert.deepEqual(Object.keys(salida(RelacionConZonaSchema).properties).sort(), ['role', 'zoneId']);
  assert.deepEqual(Object.keys(salida(RecursoDidacticoSchema).properties).sort(), ['authorship', 'license', 'resourceId', 'resourceVersionId', 'type']);
  assert.ok(Object.keys(salida(EjercicioDeCatalogoSchema).properties).includes('muscleZones'));
});

test('API-EJE-04 · el pedido trae la versión del ejercicio, la de las zonas y hasta 17 zonas; un campo de más no pasa', () => {
  const pedido = { exerciseVersionId: 'v', expectedZonesVersion: 0, muscleZones: [{ zoneId: 'cuadriceps', role: 'PRIMARY' }] };
  assert.equal(CambiarZonasDeEjercicioRequestSchema.safeParse(pedido).success, true);
  assert.equal(CambiarZonasDeEjercicioRequestSchema.safeParse({ ...pedido, muscleZones: [] }).success, true);
  assert.equal(CambiarZonasDeEjercicioRequestSchema.safeParse({ ...pedido, expectedZonesVersion: -1 }).success, false);
  assert.equal(CambiarZonasDeEjercicioRequestSchema.safeParse({ ...pedido, origen: 'wger' }).success, false);
  assert.equal(FichasVisualesRequestSchema.safeParse({ exerciseIds: [] }).success, false);
  assert.equal(FichasVisualesRequestSchema.safeParse({ exerciseIds: Array.from({ length: 51 }, (_, i) => `e${i}`) }).success, false);
});

test('las operaciones nuevas: ZON-01 y EJE-05 leen sin clave, EJE-04 escribe con Idempotency-Key, y citan su DL', () => {
  const op = (id: string) => OPERACIONES.find((o) => o.id === id)!;
  assert.deepEqual(['API-ZON-01', 'API-EJE-04', 'API-EJE-05'].map((id) => [id, op(id).metodo, op(id).idempotencia]), [
    ['API-ZON-01', 'get', false],
    ['API-EJE-04', 'put', true],
    ['API-EJE-05', 'post', false],
  ]);
  assert.ok(op('API-ZON-01').fuente.includes('DL-081'));
  assert.ok(op('API-EJE-04').fuente.includes('DL-081'));
  assert.ok(op('API-EJE-05').fuente.includes('DL-162'));
});
