/**
 * WP-GRAFICOS GR-27 (DL-174) · los contratos de los enfoques, la familia GRF: TEST-GRF-080 a TEST-GRF-082. Cada prueba dice
 * la mutación que la tiene que hacer fallar. Las de la API, con la base, son TEST-GRF-083 a 089
 * (apps/api/src/graficos/enfoques.service.spec.ts y test/integration/enfoques-de-graficos.int-spec.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { crearClienteBe } from './cliente-http';
import { CodigoDeError } from './contratos';
import {
  AREA_DEL_AMBITO,
  ContenidoDelEnfoqueSchema,
  CrearEnfoqueRequestSchema,
  EleccionDeEnfoqueSchema,
  ElegirEnfoqueRequestSchema,
  EnfoqueSchema,
  GraficoDelEnfoqueSchema,
  MAXIMO_DE_ENFOQUES,
  MAXIMO_DE_GRAFICOS_POR_ENFOQUE,
  ReemplazarEnfoqueRequestSchema,
} from './contratos-enfoques';
import { GRAFICOS_SUGERIDOS } from './graficos-sugeridos';
import { erroresDeclarados, OPERACIONES } from './openapi';

const ENFOQUE = '0b8e4c1a-3f2d-4e6b-9a7c-5d1e2f3a4b5c';
const PLAN = '7c6b5a49-3827-4615-a4b3-c2d1e0f9a8b7';
const PERSONA = '2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f60';
const ELECCION = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const EJERCICIO = 'e:4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01';

const fuerza = { kind: 'SUGGESTED', chartId: 'entrenamiento.fuerza-estimada', exercise: { kind: 'MOST_RECORDED', rank: 1 }, bodyMetric: null };
const armado = {
  kind: 'CUSTOM',
  title: 'Carbohidratos y carga',
  series: [
    { metricId: 'nutricion.carbohidratos', exerciseKey: null, setIndex: null, unit: null },
    { metricId: 'entrenamiento.carga', exerciseKey: EJERCICIO, setIndex: 1, unit: 'kg' },
  ],
  mode: 'PANELS',
};
const contenido = (charts: readonly unknown[] = [fuerza, armado]) => ({ schemaVersion: 1, charts });
const valido = (schema: z.ZodType, valor: unknown): boolean => schema.safeParse(valor).success;

/**
 * Los textos libres de un esquema: cada `string` sin patrón, sin enumerado, sin constante y sin formato, con su ruta. En
 * un enfoque tienen que ser solo los que escribe el profesional: el nombre y el título de un gráfico armado.
 */
function textosLibres(nodo: unknown, ruta: string, salida: Set<string>): Set<string> {
  if (!nodo || typeof nodo !== 'object') return salida;
  const n = nodo as Record<string, unknown>;
  if (n.type === 'string' && n.pattern === undefined && n.enum === undefined && n.const === undefined && n.format === undefined) salida.add(ruta);
  for (const clave of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (Array.isArray(n[clave])) for (const x of n[clave] as unknown[]) textosLibres(x, ruta, salida);
  }
  if (n.items) textosLibres(n.items, `${ruta}[]`, salida);
  if (n.properties && typeof n.properties === 'object') {
    for (const [k, v] of Object.entries(n.properties as Record<string, unknown>)) textosLibres(v, ruta ? `${ruta}.${k}` : k, salida);
  }
  return salida;
}

/** Cada objeto del esquema, con su ruta, si admite propiedades que no declara. */
function objetosAbiertos(nodo: unknown, ruta: string, salida: string[]): string[] {
  if (!nodo || typeof nodo !== 'object') return salida;
  const n = nodo as Record<string, unknown>;
  if (n.type === 'object' && n.additionalProperties !== false) salida.push(ruta || '(raíz)');
  for (const clave of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (Array.isArray(n[clave])) for (const x of n[clave] as unknown[]) objetosAbiertos(x, ruta, salida);
  }
  if (n.items) objetosAbiertos(n.items, `${ruta}[]`, salida);
  if (n.properties && typeof n.properties === 'object') {
    for (const [k, v] of Object.entries(n.properties as Record<string, unknown>)) objetosAbiertos(v, ruta ? `${ruta}.${k}` : k, salida);
  }
  return salida;
}

test('TEST-GRF-080 · un enfoque guarda solo referencias: ningún objeto admite un campo más, y los únicos textos libres son el nombre y el título de un gráfico armado (mutación: aceptar un valor dentro del contenido)', () => {
  assert.ok(valido(CrearEnfoqueRequestSchema, { name: 'Foco en fuerza', content: contenido() }));
  // Un valor, una nota o la persona, en cualquier nivel: el esquema estricto lo rechaza.
  const conValor = [
    { name: 'Foco en fuerza', content: contenido([{ ...fuerza, value: 96 }]) },
    { name: 'Foco en fuerza', content: { ...contenido(), adviseeId: PERSONA } },
    { name: 'Foco en fuerza', note: 'le duele la rodilla', content: contenido() },
    { name: 'Foco en fuerza', content: contenido([{ ...armado, series: [{ ...armado.series[0], value: 250 }] }]) },
    { name: 'Foco en fuerza', content: contenido([{ ...fuerza, exercise: { kind: 'MOST_RECORDED', rank: 1, label: 'Sentadilla de Ana' } }]) },
    { name: 'Foco en fuerza', content: contenido([{ ...fuerza, period: { start: '2026-11-01', end: '2026-11-14' } }]) },
  ];
  for (const cuerpo of conValor) assert.equal(valido(CrearEnfoqueRequestSchema, cuerpo), false, JSON.stringify(cuerpo));
  // Las referencias no admiten texto libre: ni una medida ni un gráfico con espacios o mayúsculas.
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...fuerza, bodyMetric: 'antropometria.Peso de Ana' }), false);
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...fuerza, chartId: 'entrenamiento.fuerza de Ana' }), false);
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...armado, series: [{ ...armado.series[0], metricId: 'nutricion.lo que comió' }] }), false);

  for (const [nombre, schema] of [
    ['crear', CrearEnfoqueRequestSchema],
    ['reemplazar', ReemplazarEnfoqueRequestSchema],
    ['elegir', ElegirEnfoqueRequestSchema],
  ] as const) {
    const json = z.toJSONSchema(schema, { io: 'input' });
    assert.deepEqual(objetosAbiertos(json, '', []), [], `${nombre}: hay un objeto que admite campos que no declara`);
  }
  assert.deepEqual([...textosLibres(z.toJSONSchema(CrearEnfoqueRequestSchema, { io: 'input' }), '', new Set())].sort(), ['content.charts[].title', 'name']);
  assert.deepEqual([...textosLibres(z.toJSONSchema(ElegirEnfoqueRequestSchema, { io: 'input' }), '', new Set())], []);
  // Y nada que se lea como una calificación de la persona.
  const nombres = JSON.stringify([z.toJSONSchema(CrearEnfoqueRequestSchema, { io: 'input' }), z.toJSONSchema(EnfoqueSchema, { io: 'output' }), z.toJSONSchema(EleccionDeEnfoqueSchema, { io: 'output' })]);
  assert.doesNotMatch(nombres, /adherence|compliance|score|grade|percent|streak|ranking/i);
});

test('TEST-GRF-081 · los topes y las referencias: de 1 a 6 gráficos, de 1 a 3 series, nombre hasta 80 y título hasta 60, y los gráficos por expresión, no por lista (mutación: dejar siete gráficos o cuatro series)', () => {
  assert.equal(MAXIMO_DE_GRAFICOS_POR_ENFOQUE, 6);
  assert.equal(MAXIMO_DE_ENFOQUES, 50);
  assert.ok(valido(ContenidoDelEnfoqueSchema, contenido(Array.from({ length: 6 }, () => fuerza))));
  assert.equal(valido(ContenidoDelEnfoqueSchema, contenido(Array.from({ length: 7 }, () => fuerza))), false);
  assert.equal(valido(ContenidoDelEnfoqueSchema, contenido([])), false);
  assert.equal(valido(ContenidoDelEnfoqueSchema, { schemaVersion: 2, charts: [fuerza] }), false);
  const serie = armado.series[0];
  assert.ok(valido(GraficoDelEnfoqueSchema, { ...armado, series: [serie, serie, serie] }));
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...armado, series: [serie, serie, serie, serie] }), false);
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...armado, series: [] }), false);
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...armado, mode: 'RELATIVE' }), false);
  // Los nombres, sin los espacios de los bordes.
  assert.equal(CrearEnfoqueRequestSchema.parse({ name: '  Foco en fuerza  ', content: contenido() }).name, 'Foco en fuerza');
  assert.equal(valido(CrearEnfoqueRequestSchema, { name: '   ', content: contenido() }), false);
  assert.ok(valido(CrearEnfoqueRequestSchema, { name: 'x'.repeat(80), content: contenido() }));
  assert.equal(valido(CrearEnfoqueRequestSchema, { name: 'x'.repeat(81), content: contenido() }), false);
  assert.ok(valido(GraficoDelEnfoqueSchema, { ...armado, title: 'x'.repeat(60) }));
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...armado, title: 'x'.repeat(61) }), false);
  // El ejercicio: uno del catálogo, o el más registrado del 1.º al 3.º (GR-T08).
  for (const rank of [1, 2, 3]) assert.ok(valido(GraficoDelEnfoqueSchema, { ...fuerza, exercise: { kind: 'MOST_RECORDED', rank } }));
  for (const rank of [0, 4]) assert.equal(valido(GraficoDelEnfoqueSchema, { ...fuerza, exercise: { kind: 'MOST_RECORDED', rank } }), false);
  assert.ok(valido(GraficoDelEnfoqueSchema, { ...fuerza, exercise: { kind: 'FIXED', exerciseKey: EJERCICIO, unit: 'kg', setIndex: 1 } }));
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...fuerza, exercise: { kind: 'FIXED', exerciseKey: EJERCICIO, unit: 'kg', setIndex: 31 } }), false);
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...fuerza, exercise: { kind: 'FIXED', exerciseKey: 'press de banca', unit: null, setIndex: null } }), false);
  // Los sugeridos de hoy entran; uno nuevo con la forma, también (el website ignora el que no conoce: GR-T17); otra forma, no.
  for (const g of GRAFICOS_SUGERIDOS) assert.ok(valido(GraficoDelEnfoqueSchema, { ...fuerza, chartId: g.id }), g.id);
  assert.ok(valido(GraficoDelEnfoqueSchema, { ...fuerza, chartId: 'nutricion.uno-que-todavia-no-existe' }));
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...fuerza, chartId: 'habitos.sueno' }), false);
  assert.equal(valido(GraficoDelEnfoqueSchema, { ...fuerza, chartId: `cruce.${'a'.repeat(80)}` }), false);
  // Elegir: la persona sin plan; un plan por su identidad y con el campo de su área; la versión explícita (null para crear).
  assert.ok(valido(ElegirEnfoqueRequestSchema, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: null }));
  assert.ok(valido(ElegirEnfoqueRequestSchema, { scope: 'TRAINING_PLAN', trainingPlanId: PLAN, setId: ENFOQUE, expectedVersion: 'v2' }));
  assert.ok(valido(ElegirEnfoqueRequestSchema, { scope: 'NUTRITION_PLAN', nutritionPlanId: PLAN, setId: ENFOQUE, expectedVersion: null }));
  assert.equal(valido(ElegirEnfoqueRequestSchema, { scope: 'PERSON', trainingPlanId: PLAN, setId: ENFOQUE, expectedVersion: null }), false);
  assert.equal(valido(ElegirEnfoqueRequestSchema, { scope: 'NUTRITION_PLAN', trainingPlanId: PLAN, setId: ENFOQUE, expectedVersion: null }), false);
  assert.equal(valido(ElegirEnfoqueRequestSchema, { scope: 'TRAINING_PLAN', planId: PLAN, setId: ENFOQUE, expectedVersion: null }), false);
  assert.equal(valido(ElegirEnfoqueRequestSchema, { scope: 'NUTRITION_PLAN', setId: ENFOQUE, expectedVersion: null }), false);
  assert.equal(valido(ElegirEnfoqueRequestSchema, { scope: 'PERSON', setId: 'Foco en fuerza', expectedVersion: null }), false);
  assert.equal(valido(ElegirEnfoqueRequestSchema, { scope: 'PERSON', setId: ENFOQUE }), false);
  assert.equal(valido(ElegirEnfoqueRequestSchema, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: 'v0' }), false);
  // El área que pide cada ámbito con la persona.
  assert.deepEqual(AREA_DEL_AMBITO, { PERSON: null, TRAINING_PLAN: 'ENTRENAMIENTO', NUTRITION_PLAN: 'NUTRICION' });
  // Las respuestas.
  const enfoque = { setId: ENFOQUE, name: 'Foco en fuerza', content: contenido(), choices: 4, version: 'v3', createdAt: '2026-11-14T12:00:00.000Z', updatedAt: '2026-11-14T13:00:00.000Z' };
  assert.ok(valido(EnfoqueSchema, enfoque));
  assert.equal(valido(EnfoqueSchema, { ...enfoque, choices: -1 }), false);
  const eleccion = { choiceId: ELECCION, scope: 'TRAINING_PLAN', trainingPlanId: PLAN, nutritionPlanId: null, set: { setId: ENFOQUE, name: 'Foco en fuerza' }, version: 'v1', updatedAt: '2026-11-14T13:00:00.000Z' };
  assert.ok(valido(EleccionDeEnfoqueSchema, eleccion));
  assert.equal(valido(EleccionDeEnfoqueSchema, { ...eleccion, set: { ...eleccion.set, content: contenido() } }), false);
});

test('TEST-GRF-082 · la familia GRF en el contrato: rutas, Idempotency-Key, la lectura protegida, TOO_MANY_SETS y DL-174 (mutación: sacar API-GRF-05 de las lecturas protegidas)', async () => {
  const grf = OPERACIONES.filter((o) => o.id.startsWith('API-GRF-'));
  assert.deepEqual(
    grf.map((o) => [o.id, o.metodo, o.ruta, o.idempotencia, o.exitos.map((e) => e.status)]),
    [
      ['API-GRF-01', 'get', '/me/chart-sets', false, [200]],
      ['API-GRF-02', 'post', '/me/chart-sets', true, [201]],
      ['API-GRF-03', 'put', '/me/chart-sets/{setId}', false, [200]],
      ['API-GRF-04', 'delete', '/me/chart-sets/{setId}', true, [204]],
      ['API-GRF-05', 'get', '/advisees/{adviseeId}/chart-set-choices', false, [200]],
      ['API-GRF-06', 'put', '/advisees/{adviseeId}/chart-set-choices', false, [201, 200]],
      ['API-GRF-07', 'delete', '/advisees/{adviseeId}/chart-set-choices/{choiceId}', true, [204]],
    ],
  );
  for (const o of grf) {
    assert.match(o.fuente, /DEUDA_LEGAJO DL-174/, o.id);
    assert.equal(o.autenticacion, 'SESSION', o.id);
  }
  // Solo la lectura de las elecciones de una persona es protegida: los enfoques son configuración, como las vistas.
  assert.deepEqual(erroresDeclarados('API-GRF-05')['429'], ['RATE_LIMITED']);
  assert.equal(erroresDeclarados('API-GRF-01')['429'], undefined);
  // Un enfoque o una elección ajenos, el mismo 404; el tope, su código propio, sin cambiar el de las vistas.
  for (const id of ['API-GRF-03', 'API-GRF-04', 'API-GRF-05', 'API-GRF-06', 'API-GRF-07']) assert.ok(erroresDeclarados(id)['404']?.includes('RESOURCE_NOT_FOUND'), id);
  assert.equal(CodigoDeError.TOO_MANY_SETS, 'TOO_MANY_SETS');
  assert.deepEqual(erroresDeclarados('API-GRF-02')['422'], ['TOO_MANY_SETS']);
  assert.ok(erroresDeclarados('API-VAN-02')['422']?.includes('VALIDATION_FAILED'));
  for (const id of ['API-GRF-03', 'API-GRF-06']) assert.ok(erroresDeclarados(id)['409']?.includes('VERSION_CONFLICT'), id);

  // El cliente: las siete, con la Idempotency-Key solo en crear, borrar y quitar.
  const llamadas: { metodo: string; url: string; clave: string | null }[] = [];
  const cliente = crearClienteBe({
    baseUrl: 'https://api.example.invalid/api/v1',
    superficie: 'WEB',
    fetch: async (url, init) => {
      llamadas.push({ metodo: init?.method ?? 'GET', url: String(url), clave: new Headers(init?.headers).get('Idempotency-Key') });
      return new Response(JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' } }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    },
  });
  await cliente.listarEnfoques('t');
  await cliente.crearEnfoque('t', { name: 'Foco en fuerza', content: ContenidoDelEnfoqueSchema.parse(contenido()) }, 'c-1');
  await cliente.reemplazarEnfoque('t', ENFOQUE, { expectedVersion: 'v1', name: 'Foco en fuerza', content: ContenidoDelEnfoqueSchema.parse(contenido()) });
  await cliente.borrarEnfoque('t', ENFOQUE, 'c-2');
  await cliente.leerEleccionesDeEnfoque('t', PERSONA);
  await cliente.elegirEnfoque('t', PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: null });
  await cliente.quitarEleccionDeEnfoque('t', PERSONA, ELECCION, 'c-3');
  const B = 'https://api.example.invalid/api/v1';
  assert.deepEqual(llamadas, [
    { metodo: 'GET', url: `${B}/me/chart-sets`, clave: null },
    { metodo: 'POST', url: `${B}/me/chart-sets`, clave: 'c-1' },
    { metodo: 'PUT', url: `${B}/me/chart-sets/${ENFOQUE}`, clave: null },
    { metodo: 'DELETE', url: `${B}/me/chart-sets/${ENFOQUE}`, clave: 'c-2' },
    { metodo: 'GET', url: `${B}/advisees/${PERSONA}/chart-set-choices`, clave: null },
    { metodo: 'PUT', url: `${B}/advisees/${PERSONA}/chart-set-choices`, clave: null },
    { metodo: 'DELETE', url: `${B}/advisees/${PERSONA}/chart-set-choices/${ELECCION}`, clave: 'c-3' },
  ]);
});
