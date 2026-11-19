/**
 * WP-GRAFICOS GR-27 (DL-174, DL-183) · las reglas de los enfoques que usa el website: TEST-GRF-090 a TEST-GRF-093. Cada
 * prueba dice la mutación que la tiene que hacer fallar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ContenidoDelEnfoqueSchema, MAXIMO_DE_GRAFICOS_POR_ENFOQUE, type EleccionDeEnfoque, type GraficoDelEnfoque } from './contratos-enfoques';
import {
  agregarGrafico,
  avisoAlBorrar,
  avisoAlCambiar,
  contenidoCon,
  eleccionDelLugar,
  eleccionQueRige,
  moverGrafico,
  nombreDeLaCopia,
  otrosLugares,
  quitarGrafico,
  SUGERIDOS_PARA_TUS_AREAS,
  sugeridosParaTusAreas,
  textoDeLosLugares,
} from './enfoques';
import { graficoSugerido } from './graficos-sugeridos';

const PLAN_T = '7c6b5a49-3827-4615-a4b3-c2d1e0f9a8b7';
const OTRO_PLAN_T = '1c6b5a49-3827-4615-a4b3-c2d1e0f9a8b7';
const PLAN_N = '8d6b5a49-3827-4615-a4b3-c2d1e0f9a8b7';

const eleccion = (scope: EleccionDeEnfoque['scope'], nombre: string, plan: string | null = null): EleccionDeEnfoque => ({
  choiceId: `${scope}-${nombre}`,
  scope,
  trainingPlanId: scope === 'TRAINING_PLAN' ? plan : null,
  nutritionPlanId: scope === 'NUTRITION_PLAN' ? plan : null,
  set: { setId: `set-${nombre}`, name: nombre },
  version: 'v1',
  updatedAt: '2026-11-19T12:00:00.000Z',
});

const sugerido = (chartId: string): GraficoDelEnfoque => ({ kind: 'SUGGESTED', chartId, exercise: null, bodyMetric: null });

test('TEST-GRF-090 · dónde rige: la elección del plan gana a la de la persona en el editor de ese plan; en la ficha, la de la persona; sin ninguna, los sugeridos (mutación: que la de la persona gane en el editor, o que la de otro plan rija)', () => {
  const persona = eleccion('PERSON', 'Foco en fuerza');
  const delPlan = eleccion('TRAINING_PLAN', 'Bloque de fuerza', PLAN_T);
  const deNutricion = eleccion('NUTRITION_PLAN', 'Temporada', PLAN_N);
  const todas = [persona, delPlan, deNutricion];
  // En el editor del plan de Entrenamiento rige el del plan; el plan se compara sin mayúsculas (la API los da en minúscula).
  assert.deepEqual(eleccionQueRige(todas, { tipo: 'PLAN', ambito: 'TRAINING_PLAN', planId: PLAN_T.toUpperCase() }), { eleccion: delPlan, de: 'PLAN' });
  assert.deepEqual(eleccionQueRige(todas, { tipo: 'PLAN', ambito: 'NUTRITION_PLAN', planId: PLAN_N }), { eleccion: deNutricion, de: 'PLAN' });
  // Otro plan de Entrenamiento, sin elección propia: el de la persona.
  assert.deepEqual(eleccionQueRige(todas, { tipo: 'PLAN', ambito: 'TRAINING_PLAN', planId: OTRO_PLAN_T }), { eleccion: persona, de: 'PERSONA' });
  // El identificador de un plan de Entrenamiento no rige en Nutrición, aunque sea el mismo texto.
  assert.equal(eleccionDelLugar([delPlan], { tipo: 'PLAN', ambito: 'NUTRITION_PLAN', planId: PLAN_T }), null);
  // En la ficha, la de la persona; nunca la de un plan.
  assert.deepEqual(eleccionQueRige(todas, { tipo: 'PERSONA' }), { eleccion: persona, de: 'PERSONA' });
  assert.equal(eleccionQueRige([delPlan, deNutricion], { tipo: 'PERSONA' }), null);
  assert.equal(eleccionQueRige([], { tipo: 'PLAN', ambito: 'TRAINING_PLAN', planId: PLAN_T }), null);
  // El lugar exacto (para cambiar o quitar desde ahí): en el editor sin elección propia no hay, aunque rija la de la persona.
  assert.equal(eleccionDelLugar(todas, { tipo: 'PLAN', ambito: 'TRAINING_PLAN', planId: OTRO_PLAN_T }), null);
  assert.equal(eleccionDelLugar(todas, { tipo: 'PERSONA' }), persona);
});

test('TEST-GRF-091 · editar el contenido: subir, bajar y quitar sin perder nada; hasta seis y sin repetir; nunca un enfoque vacío (mutación: dejar quitar el último o pasar el tope)', () => {
  const a = sugerido('nutricion.energia-por-dia');
  const b = sugerido('nutricion.macros-en-paneles');
  const c = sugerido('antropometria.masa-grasa-por-metodo');
  const base = { schemaVersion: 1 as const, charts: [a, b, c] };
  assert.deepEqual(moverGrafico(base, 1, -1).charts, [b, a, c]);
  assert.deepEqual(moverGrafico(base, 1, 1).charts, [a, c, b]);
  assert.equal(moverGrafico(base, 0, -1), base, 'el primero no sube');
  assert.equal(moverGrafico(base, 2, 1), base, 'el último no baja');
  assert.deepEqual(quitarGrafico(base, 1)?.charts, [a, c]);
  assert.equal(quitarGrafico({ schemaVersion: 1, charts: [a] }, 0), null, 'un enfoque tiene al menos un gráfico');
  // Agregar: empieza un contenido, no repite y se detiene en seis; lo que sale valida con el esquema de la API.
  const primero = agregarGrafico(null, a);
  assert.equal(primero.tipo, 'AGREGADO');
  assert.equal(agregarGrafico(base, sugerido('nutricion.energia-por-dia')).tipo, 'REPETIDO');
  let contenido = { schemaVersion: 1 as const, charts: [] as GraficoDelEnfoque[] };
  for (let i = 0; i < MAXIMO_DE_GRAFICOS_POR_ENFOQUE; i++) {
    const r = agregarGrafico(contenido, { kind: 'CUSTOM', title: `G${i}`, series: [{ metricId: 'nutricion.energia', exerciseKey: null, setIndex: null, unit: null }], mode: 'PANELS' });
    assert.equal(r.tipo, 'AGREGADO');
    if (r.tipo === 'AGREGADO') contenido = r.contenido as typeof contenido;
  }
  assert.ok(ContenidoDelEnfoqueSchema.safeParse(contenido).success);
  assert.equal(agregarGrafico(contenido, a).tipo, 'TOPE');
  // «Guardar lo que ves»: sin repetir, hasta seis; sin gráficos, nada que guardar.
  assert.deepEqual(contenidoCon([a, a, b])?.charts, [a, b]);
  assert.equal(contenidoCon([]), null);
  assert.equal(contenidoCon([...Array(9)].map((_, i) => sugerido(`nutricion.g-${i}`)))?.charts.length, MAXIMO_DE_GRAFICOS_POR_ENFOQUE);
});

test('TEST-GRF-092 · los lugares: «lugares», nunca «personas»; sin contar el de esta pantalla; la copia no choca con otra (mutación: contar el lugar de la pantalla como otro, o decir «personas»)', () => {
  assert.equal(otrosLugares(4, true), 3);
  assert.equal(otrosLugares(4, false), 4);
  assert.equal(otrosLugares(0, true), 0);
  assert.equal(textoDeLosLugares(0), 'Sin elegir todavía');
  assert.equal(textoDeLosLugares(1), 'Elegido en 1 lugar');
  assert.equal(textoDeLosLugares(4), 'Elegido en 4 lugares');
  assert.match(avisoAlCambiar(3), /^Está elegido en 3 lugares más: el cambio se ve en todos\./);
  assert.match(avisoAlBorrar(2), /2 lugares: esos lugares vuelven a los sugeridos/);
  for (const t of [avisoAlCambiar(1), avisoAlBorrar(1), textoDeLosLugares(5)]) assert.doesNotMatch(t, /persona|asesorad/i);
  assert.equal(nombreDeLaCopia('Foco en fuerza', []), 'Foco en fuerza (copia)');
  assert.equal(nombreDeLaCopia('Foco en fuerza', ['Foco en fuerza (copia)']), 'Foco en fuerza (copia 2)');
  const largo = nombreDeLaCopia('x'.repeat(80), []);
  assert.equal(largo.length, 80);
  assert.ok(largo.endsWith(' (copia)'));
});

test('TEST-GRF-093 · los sugeridos para tus áreas: hasta seis, sin repetir, sin cruces y solo de las áreas con acceso (mutación: sugerir un área sin acceso o un cruce)', () => {
  const ids = SUGERIDOS_PARA_TUS_AREAS.map((s) => (s.grafico.kind === 'SUGGESTED' ? s.grafico.chartId : ''));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length <= MAXIMO_DE_GRAFICOS_POR_ENFOQUE);
  for (const s of SUGERIDOS_PARA_TUS_AREAS) {
    assert.equal(s.grafico.kind, 'SUGGESTED');
    const g = s.grafico.kind === 'SUGGESTED' ? graficoSugerido(s.grafico.chartId) : null;
    assert.ok(g, 'cada sugerido existe en el catálogo de gráficos');
    assert.notEqual(g?.area, 'CRUCE', 'los cruces van en «Ver la relación»');
    assert.ok(g?.alcances.includes(s.area), `${g?.id} es de ${s.area}`);
    assert.equal(g?.ubicacion, 'EN_EL_TIEMPO', 'los sugeridos van sobre el mismo eje de fechas');
  }
  const todos = () => true;
  // El entrenador ve solo lo suyo; la nutricionista con Antropometría, lo de sus dos áreas; sin áreas, nada.
  const deEntrenamiento = sugeridosParaTusAreas(['ENTRENAMIENTO'], todos).map((g) => (g.kind === 'SUGGESTED' ? g.chartId : ''));
  assert.deepEqual(deEntrenamiento, ['entrenamiento.fuerza-estimada', 'entrenamiento.carga-repeticiones-y-rir', 'entrenamiento.rir-indicado-y-registrado']);
  const deNutricionYCuerpo = sugeridosParaTusAreas(['NUTRICION', 'ANTROPOMETRIA'], todos).map((g) => (g.kind === 'SUGGESTED' ? g.chartId : ''));
  assert.deepEqual(deNutricionYCuerpo, ['nutricion.energia-por-dia', 'nutricion.macros-en-paneles', 'antropometria.masa-grasa-por-metodo']);
  assert.deepEqual(sugeridosParaTusAreas([], todos), []);
  // Lo que no se ofrece con esta persona (sin un ejercicio de la lista de la v1, GR-02) no está.
  const sinV1 = sugeridosParaTusAreas(['ENTRENAMIENTO'], (g) => g.kind === 'SUGGESTED' && g.chartId !== 'entrenamiento.fuerza-estimada');
  assert.equal(sinV1.length, 2);
  // Con las tres áreas, seis: el tope.
  assert.equal(sugeridosParaTusAreas(['ENTRENAMIENTO', 'NUTRICION', 'ANTROPOMETRIA'], todos).length, 6);
});
