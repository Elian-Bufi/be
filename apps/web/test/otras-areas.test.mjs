/**
 * WP-TABLERO-ALTA-GAMA TB-52, TB-53, TB-54 y TB-56 (DL-163 D-13, ampliada por Dirección el 2026-11-07) · TEST-TAG-039 ·
 * el panel «Otras áreas» aparece solo con algo de otra área, sin React:
 *  1. el panel aparece solo si otra área la lleva otro profesional;
 *  2. cada tarjeta dice quién la lleva y qué le comparte la persona, sin candado ni «no te compartió», con su pedido;
 *  3. al abrir la página se lee solo API-RES-04; los planes y API-RES-07, al desplegar;
 *  4. nada del panel escribe, salvo «Dejar una nota» y «Pedir ver su plan»;
 *  5. el plan en una línea, lo avanzado en cifras, el encabezado del plan completo y la cita de la nota;
 *  6. «Ocultar nombres» también rige acá;
 *  7. el pedido: desde qué área sale y qué se hace con cada respuesta;
 *  8. los textos, sin «%» ni juicios ni las palabras de las listas de las tres áreas (T13).
 * El dibujo, en las capturas del tablero (`EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { terminosProhibidosDeAntropometriaEn, terminosProhibidosDeEntrenamientoEn, terminosProhibidosEn } from '@be/domain';

const O = await import('../src/app/pro/advisees/seguimiento/otras-areas.ts');
const { areasDelPanel, hayPanel, estadoDeOtraArea, tarjetaDeOtraArea, renglonPlegado, conPedidoPendiente, LECTURAS_AL_ABRIR, lecturasAlDesplegar, areaDelPedido, trasPedirVerElPlan, lineaDeMiArea, lineaDelPlan, lineaDelAvance, tablaDelAvance, encabezadoDelPlan, citaDelPlan, COPY_OTRAS_AREAS, ACCIONES_QUE_ESCRIBEN } = O;

const SEGUIMIENTO = join(dirname(fileURLToPath(import.meta.url)), '../src/app/pro/advisees/seguimiento');
const SOFIA = { identityId: '0b6f2c1e-1111-4a2b-8c3d-000000000001', displayName: 'Lic. Sofía Paz' };
const MARTIN = { identityId: '0b6f2c1e-2222-4a2b-8c3d-000000000002', displayName: 'Prof. Martín Acosta' };
const LUCIA = { identityId: '0b6f2c1e-3333-4a2b-8c3d-000000000003', displayName: 'Prof. Lucía Benítez' };
const tal = (a) => a.displayName;
const oculto = (a) => `Profesional · ${a.identityId.slice(-6)}`;
const fecha = (iso) => iso.slice(0, 10);
const diaCivil = (f) => `«${f}»`;

const area = (x) => ({ area: 'ENTRENAMIENTO', professional: MARTIN, shared: null, accessRequest: null, canRequestPlan: false, canRequestPlanFrom: null, ...x });
const pedido = (x) => ({ accessRequestId: '9a1b2c3d-0000-4000-8000-00000000000a', scope: 'NUTRICION', area: 'ENTRENAMIENTO', status: 'PENDING', requestedAt: '2026-11-05T13:00:00.000Z', ...x });
const CON_PLAN = area({ shared: { level: 'SUMMARY_AND_PLAN', since: '2026-11-01T12:00:00.000Z' } });
const CON_RESUMEN = area({ shared: { level: 'SUMMARY', since: '2026-10-20T12:00:00.000Z' }, canRequestPlan: true });
const SIN_NADA = area({ canRequestPlan: true });
const PENDIENTE = area({ accessRequest: pedido(), canRequestPlan: false, canRequestPlanFrom: '2026-11-12T13:00:00.000Z' });
const RESPONDIDO = area({ accessRequest: pedido({ status: 'ANSWERED' }), canRequestPlan: false, canRequestPlanFrom: '2026-11-12T13:00:00.000Z' });
const ANTRO = { area: 'ANTROPOMETRIA', professional: SOFIA, shared: null, accessRequest: null, canRequestPlan: true, canRequestPlanFrom: null };

const plan = {
  NUTRICION: {
    area: 'NUTRICION',
    author: SOFIA,
    level: 'SUMMARY_AND_PLAN',
    sharedSince: '2026-11-01T12:00:00.000Z',
    activatedAt: '2026-10-02T13:00:00.000Z',
    nextReviewAt: '2026-11-20',
    progress: { unit: 'MEAL_RECORDS', plannedPerWeek: null, weeks: [] },
    plan: { planId: '5e5e5e5e-0000-4000-8000-000000000001', dayTypes: [{ dayTypeId: 'd1', label: 'Día habitual', order: 1, meals: [{ mealId: 'm1' }, { mealId: 'm2' }] }] },
    objective: null,
  },
  ENTRENAMIENTO: {
    area: 'ENTRENAMIENTO',
    author: MARTIN,
    level: 'SUMMARY_AND_PLAN',
    sharedSince: '2026-11-01T12:00:00.000Z',
    activatedAt: '2026-10-05T13:00:00.000Z',
    nextReviewAt: null,
    progress: { unit: 'SESSIONS', plannedPerWeek: 3, weeks: ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02'].map((weekStart, i) => ({ weekStart, recorded: [2, 3, 3, 2, 4, 3][i] })) },
    plan: { planId: '5e5e5e5e-0000-4000-8000-000000000002', blocks: [{ blockId: 'b1', sessions: [{}, {}], microcycles: [] }, { blockId: 'b2', sessions: [], microcycles: [{ sessions: [{}] }] }] },
    objective: null,
  },
};

/** Todos los textos que arman las funciones con los casos de la prueba, y los de la copia. */
function textosArmados() {
  const textos = [];
  const juntar = (v) => {
    if (typeof v === 'string') textos.push(v);
    else if (typeof v === 'function') {
      try {
        juntar(v('…'));
        juntar(v('…', '…'));
      } catch {
        /* una función que no arma texto */
      }
    } else if (Array.isArray(v)) v.forEach(juntar);
    else if (v && typeof v === 'object') Object.values(v).forEach(juntar);
  };
  juntar(COPY_OTRAS_AREAS);
  for (const a of [CON_PLAN, CON_RESUMEN, SIN_NADA, PENDIENTE, RESPONDIDO, ANTRO]) {
    const t = tarjetaDeOtraArea(a, tal, fecha);
    juntar(t.lineas);
    juntar(t.pedir);
    juntar(t.etiqueta);
  }
  juntar(renglonPlegado([CON_PLAN, CON_RESUMEN, SIN_NADA, ANTRO].map((a) => tarjetaDeOtraArea(a, tal, fecha)), new Set(['ENTRENAMIENTO'])));
  for (const p of Object.values(plan)) {
    juntar(lineaDelPlan(p, fecha));
    juntar(lineaDelAvance(p.progress, diaCivil));
    juntar(tablaDelAvance(p.progress, diaCivil));
    juntar(encabezadoDelPlan(p, tal, fecha, diaCivil));
    juntar(citaDelPlan(p, fecha).texto);
  }
  juntar(lineaDeMiArea([{ area: 'NUTRICION', professional: MARTIN, level: 'SUMMARY_AND_PLAN', since: '2026-11-01T12:00:00.000Z' }], tal, fecha));
  return textos;
}

// ─── 1 · El panel aparece solo con otra área de otro profesional ─────────────────────────────────────────────

test('TEST-TAG-039 · el panel aparece solo si otra área la lleva otro profesional', () => {
  assert.deepEqual(areasDelPanel(null), []);
  assert.equal(hayPanel(null), false);
  assert.equal(hayPanel({ scopes: ['NUTRICION'], areas: [] }), false, 'sin otras áreas, no hay panel');
  assert.equal(hayPanel({ scopes: ['NUTRICION'], areas: [area({ professional: null })] }), false, 'un área que no lleva nadie no hace panel');
  assert.equal(hayPanel({ scopes: ['NUTRICION', 'ENTRENAMIENTO'], areas: [CON_PLAN] }), false, 'un área que lleva quien mira no es «otra»');
  const datos = { scopes: ['NUTRICION', 'ANTROPOMETRIA'], areas: [area({ professional: null, area: 'ANTROPOMETRIA' }), CON_PLAN] };
  assert.equal(hayPanel(datos), true);
  assert.deepEqual(areasDelPanel(datos), [CON_PLAN]);
});

// ─── 2 · Cada tarjeta, sin candado ni «no te compartió» ───────────────────────────────────────────────────────

test('TEST-TAG-039 · cada tarjeta dice quién la lleva y qué le comparte, con su pedido y sin candado', () => {
  const p = tarjetaDeOtraArea(CON_PLAN, tal, fecha);
  assert.equal(estadoDeOtraArea(CON_PLAN), 'PLAN');
  assert.deepEqual(p.lineas, ['Lo lleva Prof. Martín Acosta.', 'Te comparte el resumen y el plan desde el 2026-11-01.']);
  assert.deepEqual(p.acciones, ['ver-plan', 'dejar-nota']);
  assert.equal(p.pedir, null);

  const r = tarjetaDeOtraArea(CON_RESUMEN, tal, fecha);
  assert.equal(r.estado, 'RESUMEN');
  assert.deepEqual(r.lineas, ['Lo lleva Prof. Martín Acosta.', 'Te comparte el resumen desde el 2026-10-20.']);
  assert.deepEqual(r.acciones, ['pedir']);
  assert.equal(r.pedir, 'Pedir ver su plan');
  assert.deepEqual(tarjetaDeOtraArea({ ...CON_RESUMEN, canRequestPlan: false }, tal, fecha).acciones, [], 'sin que la API lo deje, no se ofrece pedir');

  const n = tarjetaDeOtraArea(SIN_NADA, tal, fecha);
  assert.equal(n.estado, 'NADA');
  assert.deepEqual(n.lineas, ['Lo lleva Prof. Martín Acosta.'], 'sin nada compartido, una línea neutra con quién la lleva');
  assert.deepEqual(n.acciones, ['pedir']);

  const pe = tarjetaDeOtraArea(PENDIENTE, tal, fecha);
  assert.deepEqual(pe.lineas, ['Lo lleva Prof. Martín Acosta.', 'Le pediste ver su plan el 2026-11-05: espera la respuesta de la persona.', 'Podés volver a pedirlo desde el 2026-11-12.']);
  assert.deepEqual(pe.acciones, []);
  const re = tarjetaDeOtraArea(RESPONDIDO, tal, fecha);
  assert.deepEqual(re.lineas, ['Lo lleva Prof. Martín Acosta.', 'Le pediste ver su plan el 2026-11-05.', 'Podés volver a pedirlo desde el 2026-11-12.'], 'nunca qué respondió');
  assert.equal(tarjetaDeOtraArea({ ...RESPONDIDO, canRequestPlan: true, canRequestPlanFrom: null }, tal, fecha).pedir, 'Volver a pedir ver su plan');

  const an = tarjetaDeOtraArea(ANTRO, tal, fecha);
  assert.deepEqual(an.acciones, [], 'Antropometría no tiene plan: nunca se ofrece pedirlo');
  assert.equal(estadoDeOtraArea({ ...ANTRO, shared: { level: 'SUMMARY_AND_PLAN', since: '2026-11-01T12:00:00.000Z' } }), 'RESUMEN');

  assert.equal(renglonPlegado([p, r, an], conPedidoPendiente([CON_PLAN, CON_RESUMEN, ANTRO])), 'Entrenamiento: resumen y plan · Entrenamiento: resumen · Antropometría');
  assert.equal(renglonPlegado([tarjetaDeOtraArea(PENDIENTE, tal, fecha)], conPedidoPendiente([PENDIENTE])), 'Entrenamiento: pediste ver su plan');
  assert.doesNotMatch(renglonPlegado([p, r, n, an]), /Martín|Sofía/, 'el renglón plegado no lleva nombres');
});

// ─── 3 · Se lee de a poco ─────────────────────────────────────────────────────────────────────────────────────

test('TEST-TAG-039 · al abrir se lee solo API-RES-04; los planes y API-RES-07, al desplegar', () => {
  assert.deepEqual([...LECTURAS_AL_ABRIR], ['API-RES-04']);
  const tarjetas = [CON_PLAN, { ...CON_PLAN, area: 'NUTRICION', professional: SOFIA }, ANTRO].map((a) => tarjetaDeOtraArea(a, tal, fecha));
  assert.deepEqual([...lecturasAlDesplegar(tarjetas)], ['API-RES-06 ENTRENAMIENTO', 'API-RES-06 NUTRICION', 'API-RES-07']);
  assert.deepEqual([...lecturasAlDesplegar([tarjetaDeOtraArea(PENDIENTE, tal, fecha)])], ['API-RES-07'], 'sin plan compartido, ningún plan se lee');
  // El componente: al montarse lee API-RES-04 y nada más; los planes y API-RES-07 salen de `desplegar`.
  const panel = readFileSync(join(SEGUIMIENTO, 'otras-areas-en-pantalla.tsx'), 'utf8');
  const alMontar = /\/\/ Al abrir la página[\s\S]*?\n {2}\}, \[/.exec(panel)?.[0] ?? '';
  assert.match(alMontar, /api\.resumenesCompartidos\(/, 'al abrir la página se lee API-RES-04');
  assert.doesNotMatch(alMontar, /api\.planCompartido\(|api\.loQueSeComparteDeMiArea\(/, 'al abrir la página no se lee ningún plan');
  const alDesplegar = /async function desplegar[\s\S]*?\n {2}\}\n/.exec(panel)?.[0] ?? '';
  assert.match(alDesplegar, /api\.planCompartido\(/);
  assert.match(alDesplegar, /api\.loQueSeComparteDeMiArea\(/);
});

// ─── 4 · Nada escribe, salvo la nota y el pedido ─────────────────────────────────────────────────────────────

test('TEST-TAG-039 · nada del panel escribe, salvo «Dejar una nota» y «Pedir ver su plan»', () => {
  const acciones = new Set([CON_PLAN, CON_RESUMEN, SIN_NADA, PENDIENTE, RESPONDIDO, ANTRO].flatMap((a) => tarjetaDeOtraArea(a, tal, fecha).acciones));
  assert.deepEqual([...acciones].sort(), ['dejar-nota', 'pedir', 'ver-plan']);
  assert.deepEqual([...ACCIONES_QUE_ESCRIBEN].sort(), ['dejar-nota', 'pedir']);
  const permitidas = new Set(['resumenesCompartidos', 'planCompartido', 'loQueSeComparteDeMiArea', 'pedirVerElPlan']);
  for (const archivo of ['otras-areas-en-pantalla.tsx', 'plan-compartido.tsx']) {
    const codigo = readFileSync(join(SEGUIMIENTO, archivo), 'utf8');
    const llamadas = [...codigo.matchAll(/\bapi\.(\w+)\(/g)].map((m) => m[1]);
    assert.deepEqual(llamadas.filter((l) => !permitidas.has(l)), [], `${archivo} llama solo a las lecturas de RES y al pedido`);
    assert.doesNotMatch(codigo, /\bfetch\(|method:\s*['"](POST|PUT|PATCH|DELETE)/, `${archivo} no escribe por fuera del cliente de la API`);
  }
  // La nota la escribe el redactor de siempre (API-CRD-01): el panel solo lo abre.
  assert.match(readFileSync(join(SEGUIMIENTO, 'otras-areas-en-pantalla.tsx'), 'utf8'), /<DialogoDeNota\b/);
});

// ─── 5 · El plan en una línea, lo avanzado en cifras y la cita ───────────────────────────────────────────────

test('TEST-TAG-039 · el plan en una línea, lo avanzado en cifras, el encabezado y la cita de la nota', () => {
  assert.equal(lineaDelPlan(plan.NUTRICION, fecha), 'Rige desde el 2026-10-02 · 1 día tipo · 2 comidas');
  assert.equal(lineaDelPlan(plan.ENTRENAMIENTO, fecha), 'Rige desde el 2026-10-05 · 2 bloques · 3 sesiones');
  assert.equal(lineaDelAvance(plan.ENTRENAMIENTO.progress, diaCivil), 'Sesiones registradas por semana: 3, 2, 4 y 3 (desde la semana del «2026-10-12») · el plan prevé 3 por semana');
  assert.equal(lineaDelAvance(plan.NUTRICION.progress, diaCivil), 'Todavía no hay semanas registradas desde que rige.');
  assert.equal(lineaDelAvance({ unit: 'MEAL_RECORDS', plannedPerWeek: null, weeks: [{ weekStart: '2026-11-02', recorded: 0 }] }, diaCivil), 'Comidas registradas por semana: 0 (desde la semana del «2026-11-02»)', 'un cero es una cifra');
  const tabla = tablaDelAvance(plan.ENTRENAMIENTO.progress, diaCivil);
  assert.equal(tabla.encabezado, 'Sesiones registradas');
  assert.equal(tabla.filas.length, 6);
  assert.deepEqual(tabla.filas[0], { semana: 'Semana del «2026-09-28»', cifra: '2' });
  assert.equal(tabla.previstas, 'El plan prevé 3 sesiones por semana.');
  assert.deepEqual([...encabezadoDelPlan(plan.NUTRICION, tal, fecha, diaCivil)], ['Lo armó Lic. Sofía Paz', 'Rige desde el 2026-10-02', 'Próxima revisión: «2026-11-20»']);
  assert.deepEqual([...encabezadoDelPlan(plan.ENTRENAMIENTO, tal, fecha, diaCivil)], ['Lo armó Prof. Martín Acosta', 'Rige desde el 2026-10-05', 'Sin próxima revisión acordada']);
  assert.deepEqual(citaDelPlan(plan.NUTRICION, fecha), { type: 'NUTRITION_PLAN_VERSION', id: plan.NUTRICION.plan.planId, texto: 'Plan de Nutrición que te comparte la persona · activado el 2026-10-02' });
  assert.equal(citaDelPlan(plan.ENTRENAMIENTO, fecha).type, 'TRAINING_PLAN_VERSION');
});

// ─── 6 · «Ocultar nombres» ────────────────────────────────────────────────────────────────────────────────────

test('TEST-TAG-039 · con «Ocultar nombres», ni las tarjetas ni la línea de tu área dicen un nombre', () => {
  const lineas = [CON_PLAN, CON_RESUMEN, SIN_NADA, PENDIENTE, ANTRO].flatMap((a) => {
    const t = tarjetaDeOtraArea(a, oculto, fecha);
    return [...t.lineas, t.quien];
  });
  const mia = lineaDeMiArea([{ area: 'NUTRICION', professional: LUCIA, level: 'SUMMARY', since: '2026-11-01T12:00:00.000Z' }], oculto, fecha);
  for (const l of [...lineas, mia, ...encabezadoDelPlan(plan.ENTRENAMIENTO, oculto, fecha, diaCivil)]) assert.doesNotMatch(l, /Sofía|Paz|Martín|Acosta|Lucía|Benítez/, l);
  assert.equal(mia, 'Lo de tu área lo ve también: Profesional · 000003 (Nutrición, resumen, desde el 2026-11-01).');
  assert.equal(lineaDeMiArea([], tal, fecha), null, 'sin nadie, no hay línea');
  const dos = lineaDeMiArea(
    [
      { area: 'NUTRICION', professional: MARTIN, level: 'SUMMARY_AND_PLAN', since: '2026-11-01T12:00:00.000Z' },
      { area: 'ANTROPOMETRIA', professional: LUCIA, level: 'SUMMARY', since: '2026-11-02T12:00:00.000Z' },
    ],
    tal,
    fecha,
  );
  assert.equal(dos, 'Lo de tu área lo ve también: Prof. Martín Acosta (Nutrición, resumen y plan, desde el 2026-11-01) y Prof. Lucía Benítez (Antropometría, resumen, desde el 2026-11-02).');
});

// ─── 7 · El pedido ────────────────────────────────────────────────────────────────────────────────────────────

test('TEST-TAG-039 · el pedido sale del área de la página y cada respuesta tiene su camino', () => {
  assert.deepEqual(areaDelPedido(['NUTRICION'], 'NUTRICION'), { scope: 'NUTRICION', aviso: null });
  assert.deepEqual(areaDelPedido(['NUTRICION', 'ANTROPOMETRIA'], 'NUTRICION'), { scope: 'NUTRICION', aviso: 'Lo pedís desde Nutrición.' });
  assert.deepEqual(areaDelPedido(['ANTROPOMETRIA'], 'NUTRICION'), { scope: 'ANTROPOMETRIA', aviso: null });
  assert.equal(trasPedirVerElPlan({ ok: true }), 'enviado');
  for (const status of [404, 409, 422]) assert.equal(trasPedirVerElPlan({ ok: false, tipo: 'API', status }), 'releer');
  assert.equal(trasPedirVerElPlan({ ok: false, tipo: 'API', status: 500 }), 'otro');
  assert.equal(trasPedirVerElPlan({ ok: false, tipo: 'RED' }), 'otro');
  assert.equal(COPY_OTRAS_AREAS.queLeLlega, 'Le llega una novedad con tu nombre, tu área y para qué. Es su decisión.');
});

// ─── 8 · Los textos ───────────────────────────────────────────────────────────────────────────────────────────

test('TEST-TAG-039 · los textos no tienen «%», juicios ni palabras de las listas, y nunca dicen que no se compartió', () => {
  const textos = textosArmados();
  assert.ok(textos.length > 60, `se esperaban los textos del panel, hay ${textos.length}`);
  const prohibidos = (t) => [...new Set([...terminosProhibidosEn(t), ...terminosProhibidosDeEntrenamientoEn(t), ...terminosProhibidosDeAntropometriaEn(t)])];
  assert.deepEqual(textos.flatMap((t) => prohibidos(t).map((p) => `«${p}» en ${JSON.stringify(t)}`)), []);
  for (const t of textos) assert.doesNotMatch(t, /no te compart|no comparte|candado|bloquead|denegad|rechaz/i, t);
  // La prueba de la prueba: un porcentaje en lo avanzado se detecta.
  assert.ok(prohibidos('Sesiones registradas por semana: 75 % de lo previsto').includes('%'));
});
