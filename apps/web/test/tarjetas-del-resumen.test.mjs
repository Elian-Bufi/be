/**
 * WP-TABLERO-ALTA-GAMA TB-10 (DL-163 D-1) · las tarjetas del Resumen, sin React:
 *  1. TEST-TAG-001 · el tramo del ciclo (`apps/web/src/lib/reloj.ts`) no se mueve con lo que registra la persona: una
 *     prueba de propiedad sobre resúmenes de API-DSH-03 al azar (con una semilla fija), que cambia solo lo registrado;
 *     sin fecha acordada no hay barra, y al vencer sigue en discontinua y lo dice.
 *  2. TEST-TAG-002 · toda barra con `role="progressbar"` del website lleva `aria-valuetext`, y las frases del tramo no
 *     tienen «%», «por ciento» ni «te faltan».
 *  3. Las piezas propias de cada tarjeta (`seguimiento/piezas-del-area.ts`): la barra partida de Nutrición, las
 *     sesiones por ejercicio y los pasos de «Empezar el plan» en miniatura.
 * El dibujo, en las capturas del tablero (`EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const { avanceDelReloj, textosDelTramo, tramoDelCiclo, TOPE_DE_LO_VENCIDO } = await import('../src/lib/reloj.ts');
const { EJERCICIOS_A_LA_VISTA, losRegistrosDelPeriodo, pasosDelPrimerPlan, sesionesPorEjercicio, textoDeLasComidas, textoDeLosRectificados } = await import(
  '../src/app/pro/advisees/seguimiento/piezas-del-area.ts'
);

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const FORMATO = { fecha: (f) => `día ${f}`, diaDeLaSemana: () => 'lun' };

/** Un generador con semilla: la misma corrida da los mismos casos. */
function azar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sumarDias = (civil, n) => new Date(Date.parse(`${civil}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const instante = (civil) => `${civil}T15:00:00.000Z`;

/** Un resumen de Nutrición o de Entrenamiento al azar, con sus fechas del profesional y lo que registró la persona. */
function resumenAlAzar(r, hoy, area) {
  const activado = sumarDias(hoy, -Math.floor(r() * 120));
  const acordada = r() < 0.15 ? null : sumarDias(activado, Math.floor(r() * 60) - 5);
  const revision =
    r() < 0.3
      ? null
      : {
          reviewId: ID(1),
          recordedAt: instante(sumarDias(activado, Math.floor(r() * 50) - 25)),
          author: { actorId: ID(2), displayName: 'Profesional' },
          application: r() < 0.4 ? null : { appliedAt: instante(hoy), createdPlanId: null, createdObjectiveVersionId: null },
        };
  const base = { activePlan: { planVersionId: ID(3), activatedAt: instante(activado), nextReviewAt: acordada }, objective: null, lastReview: revision, draftPlan: null };
  return area === 'NUTRICION'
    ? { ...base, registeredIntakes: Math.floor(r() * 400), lastIntakeAt: r() < 0.2 ? null : instante(sumarDias(hoy, -Math.floor(r() * 10))) }
    : { ...base, registeredExecutions: Math.floor(r() * 60), lastExecutionAt: r() < 0.2 ? null : instante(sumarDias(hoy, -Math.floor(r() * 10))) };
}

/** Lo mismo, con otro registro de la persona: otras cuentas y otra fecha del último registro. */
function conOtrosRegistros(resumen, r, hoy) {
  const otro = () => (r() < 0.3 ? null : instante(sumarDias(hoy, -Math.floor(r() * 90))));
  return 'registeredIntakes' in resumen
    ? { ...resumen, registeredIntakes: Math.floor(r() * 5000), lastIntakeAt: otro() }
    : { ...resumen, registeredExecutions: Math.floor(r() * 500), lastExecutionAt: otro() };
}

// ─── TEST-TAG-001 · La barra del reloj no se mueve con lo que registra la persona ──────────────────────────────────────

test('TEST-TAG-001 · con las mismas fechas, el tramo es el mismo, registre lo que registre la persona (propiedad, 2000 casos)', () => {
  const r = azar(20261106);
  let conBarra = 0;
  for (let i = 0; i < 2000; i++) {
    const hoy = sumarDias('2026-11-06', Math.floor(r() * 30) - 15);
    const area = r() < 0.5 ? 'NUTRICION' : 'ENTRENAMIENTO';
    const resumen = resumenAlAzar(r, hoy, area);
    const tramo = tramoDelCiclo(resumen, hoy);
    if (tramo?.tipo === 'RELOJ') conBarra++;
    for (let j = 0; j < 4; j++) {
      const otro = conOtrosRegistros(resumen, r, hoy);
      assert.deepEqual(tramoDelCiclo(otro, hoy), tramo, `caso ${i}: el tramo cambió con lo registrado`);
      assert.deepEqual(textosDelTramo(tramo ?? { tipo: 'SIN_FECHA', revision: null }, FORMATO, hoy), textosDelTramo(tramoDelCiclo(otro, hoy) ?? { tipo: 'SIN_FECHA', revision: null }, FORMATO, hoy));
    }
  }
  assert.ok(conBarra > 500, `la propiedad tiene que recorrer muchos tramos con barra (fueron ${conBarra})`);
});

test('TEST-TAG-001 · el avance sale solo de tres fechas: lo transcurrido hasta hoy, sobre los días acordados', () => {
  assert.deepEqual(avanceDelReloj('2026-10-16', '2026-11-16', '2026-11-06'), { tipo: 'EN_CURSO', total: 31, transcurridos: 21, posicionDeHoy: 21 / 31, posicionDeLaAcordada: 1 });
  assert.deepEqual(avanceDelReloj('2026-10-16', '2026-11-16', '2026-11-16'), { tipo: 'EN_CURSO', total: 31, transcurridos: 31, posicionDeHoy: 1, posicionDeLaAcordada: 1 });
  assert.deepEqual(avanceDelReloj('2026-11-06', '2026-11-06', '2026-11-06'), { tipo: 'EN_CURSO', total: 0, transcurridos: 0, posicionDeHoy: 1, posicionDeLaAcordada: 1 });
});

test('TEST-TAG-001 · al vencer, hoy va al final y lo vencido ocupa como mucho la cuarta parte, en palabras', () => {
  const corto = avanceDelReloj('2026-10-02', '2026-11-02', '2026-11-06');
  assert.equal(corto.tipo, 'VENCIDO');
  assert.equal(corto.vencidoHace, 4);
  assert.equal(corto.posicionDeHoy, 1);
  assert.equal(corto.posicionDeLaAcordada, 1 - 4 / 35);
  const largo = avanceDelReloj('2026-10-30', '2026-11-01', '2026-11-06');
  assert.equal(largo.posicionDeLaAcordada, 1 - TOPE_DE_LO_VENCIDO, 'cinco días vencidos sobre dos acordados no se comen la barra');
  const resumen = { activePlan: { planVersionId: ID(3), activatedAt: instante('2026-10-02'), nextReviewAt: '2026-11-02' }, objective: null, lastReview: null, draftPlan: null, registeredIntakes: 0, lastIntakeAt: null };
  const t = textosDelTramo(tramoDelCiclo(resumen, '2026-11-06'), FORMATO, '2026-11-06');
  assert.equal(t.titulo, 'Acordada para el lun día 2026-11-02');
  assert.equal(t.detalle, 'vencida hace 4 días');
  assert.equal(t.fin, 'hoy');
});

test('TEST-TAG-001 · sin fecha acordada no hay barra; con la revisión de esa fecha registrada, tampoco (TA-13)', () => {
  const sinFecha = { activePlan: { planVersionId: ID(3), activatedAt: instante('2026-10-02'), nextReviewAt: null }, objective: null, lastReview: null, draftPlan: null, registeredIntakes: 9, lastIntakeAt: null };
  assert.deepEqual(tramoDelCiclo(sinFecha, '2026-11-06'), { tipo: 'SIN_FECHA', revision: null });
  assert.equal(textosDelTramo(tramoDelCiclo(sinFecha, '2026-11-06'), FORMATO, '2026-11-06').enPalabras, null);
  assert.equal(tramoDelCiclo({ ...sinFecha, activePlan: null }, '2026-11-06'), null, 'sin plan vigente no hay ciclo');
  const revisada = {
    ...sinFecha,
    activePlan: { ...sinFecha.activePlan, nextReviewAt: '2026-11-05' },
    lastReview: { reviewId: ID(1), recordedAt: instante('2026-11-03'), author: { actorId: ID(2), displayName: 'P' }, application: null },
  };
  assert.deepEqual(tramoDelCiclo(revisada, '2026-11-06'), { tipo: 'REVISADA', revision: { dia: '2026-11-03', aplicada: false } });
});

test('TEST-TAG-001 · el tramo empieza en la última revisión, o en la activación del plan vigente si es posterior (TA-17)', () => {
  const plan = { planVersionId: ID(3), activatedAt: instante('2026-10-17'), nextReviewAt: '2026-11-16' };
  const revision = (dia) => ({ reviewId: ID(1), recordedAt: instante(dia), author: { actorId: ID(2), displayName: 'P' }, application: { appliedAt: instante(dia), createdPlanId: null, createdObjectiveVersionId: null } });
  const base = { activePlan: plan, objective: null, draftPlan: null, registeredExecutions: 3, lastExecutionAt: null };
  const despues = tramoDelCiclo({ ...base, lastReview: revision('2026-10-20') }, '2026-11-06');
  assert.equal(despues.inicio, '2026-10-20');
  assert.equal(despues.desde, 'REVISION');
  const antes = tramoDelCiclo({ ...base, lastReview: revision('2026-10-16') }, '2026-11-06');
  assert.equal(antes.inicio, '2026-10-17');
  assert.equal(antes.desde, 'PLAN');
});

// ─── TEST-TAG-002 · Las barras se dicen en palabras ──────────────────────────────────────────────────────────────────

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}

test('TEST-TAG-002 · toda barra con role="progressbar" del website lleva aria-valuetext en el mismo elemento', () => {
  const sin = [];
  let barras = 0;
  for (const archivo of archivos(join(WEB, 'src'))) {
    const fuente = readFileSync(archivo, 'utf8');
    for (let i = fuente.indexOf('role="progressbar"'); i >= 0; i = fuente.indexOf('role="progressbar"', i + 1)) {
      barras++;
      const desde = fuente.lastIndexOf('<', i);
      const hasta = fuente.indexOf('<', i);
      if (!fuente.slice(desde, hasta).includes('aria-valuetext=')) sin.push(relative(WEB, archivo));
    }
  }
  assert.ok(barras >= 1, 'el tramo del ciclo es una barra de progreso');
  assert.deepEqual(sin, []);
});

test('TEST-TAG-002 · las frases del tramo no tienen «%», «por ciento» ni «te faltan»', () => {
  const r = azar(7);
  for (let i = 0; i < 500; i++) {
    const hoy = sumarDias('2026-11-06', Math.floor(r() * 20));
    const tramo = tramoDelCiclo(resumenAlAzar(r, hoy, 'NUTRICION'), hoy);
    if (!tramo) continue;
    const t = textosDelTramo(tramo, FORMATO, hoy);
    for (const texto of [t.titulo, t.detalle, t.enPalabras].filter(Boolean)) {
      assert.doesNotMatch(texto, /%|por ciento|te faltan|cumpl|adherencia|racha/i, texto);
    }
  }
});

// ─── TB-10 · Las piezas propias de cada tarjeta ──────────────────────────────────────────────────────────────────────

const cobertura = (c) => ({
  daysInPeriod: 90,
  daysWithRecords: 86,
  records: c.con + c.sin,
  recordsWithQuantities: c.con,
  recordsWithoutQuantities: c.sin,
  differentMealsWithoutQuantities: 0,
  annulledExcluded: c.anulados,
  rectifiedCountedOnce: c.rectificados ?? 0,
  planMeals: { daysKnown: 86, daysUndetermined: [], expected: c.esperadas ?? 0, withPlanOption: 0, withDifferentMeal: 0, withoutRecord: c.sinRegistro ?? 0 },
});

test('TB-10 · la barra partida de Nutrición: tres tramos que no se pisan, de una sola fuente, y los rectificados aparte', () => {
  const r = losRegistrosDelPeriodo(cobertura({ con: 301, sin: 25, anulados: 3, rectificados: 4, esperadas: 344, sinRegistro: 32 }));
  assert.deepEqual(
    r.tramos.map((t) => [t.clave, t.cifra, t.texto]),
    [
      ['CON_CANTIDADES', '301', 'con cantidades'],
      ['SIN_CANTIDADES', '25', 'sin cantidades'],
      ['ANULADOS', '3', 'anulados, fuera de los totales'],
    ],
  );
  assert.ok(Math.abs(r.tramos.reduce((s, t) => s + t.fraccion, 0) - 1) < 1e-9, 'los tramos llenan la barra entre los tres');
  assert.equal(r.rectificados, 4);
  assert.equal(textoDeLosRectificados(4), '4 rectificados, contados una vez');
  assert.equal(textoDeLasComidas(r.comidas), 'Comidas del plan con registro: 312 de 344, en 86 días con registros, sin hoy');
});

test('TB-10 · un tramo vacío no ocupa lugar, y sin registros no hay barra', () => {
  assert.deepEqual(
    losRegistrosDelPeriodo(cobertura({ con: 10, sin: 0, anulados: 1 })).tramos.map((t) => t.clave),
    ['CON_CANTIDADES', 'ANULADOS'],
  );
  assert.equal(losRegistrosDelPeriodo(cobertura({ con: 0, sin: 0, anulados: 0 })), null);
  assert.equal(losRegistrosDelPeriodo(null), null);
  assert.equal(losRegistrosDelPeriodo(cobertura({ con: 2, sin: 0, anulados: 0 })).comidas, null, 'sin comidas indicadas no hay cuenta de comidas');
});

const ejercicio = (n, nombre, sesiones) => ({ exerciseKey: `e:${ID(n)}`, name: nombre, otherNames: [], homonym: false, sessions: sesiones, setNumbers: [1], loadUnits: ['kg'], lastDate: '2026-11-02' });

test('TB-10 · las sesiones por ejercicio: de más a menos, hasta cinco y «y N más»; sin sesiones, no se nombra', () => {
  const s = sesionesPorEjercicio([
    ejercicio(1, 'Remo', 8),
    ejercicio(2, 'Sentadilla', 22),
    ejercicio(3, 'Press de banca', 22),
    ejercicio(4, 'Plancha', 0),
    ejercicio(5, 'Dominadas', 3),
    ejercicio(6, 'Estocadas', 5),
    ejercicio(7, 'Curl', 2),
    ejercicio(8, 'Peso muerto', 1),
  ]);
  assert.equal(EJERCICIOS_A_LA_VISTA, 5);
  assert.deepEqual(
    s.filas.map((f) => [f.nombre, f.sesiones]),
    [
      ['Press de banca', 22],
      ['Sentadilla', 22],
      ['Remo', 8],
      ['Estocadas', 5],
      ['Dominadas', 3],
    ],
  );
  assert.equal(s.mas, 2, 'Curl y Peso muerto; Plancha no tuvo sesiones');
  assert.equal(s.filas[0].fraccion, 1);
  assert.equal(s.filas[2].fraccion, 8 / 22);
  assert.equal(sesionesPorEjercicio([ejercicio(4, 'Plancha', 0)]), null);
  assert.equal(sesionesPorEjercicio(null), null);
});

test('TB-10 · «Empezar el plan» en miniatura: el paso que toca, con la misma regla que el Plan del área', () => {
  const estados = (e, o) => pasosDelPrimerPlan(e, o).map((p) => [p.titulo, p.estado, p.detalle]);
  assert.deepEqual(estados(false, null), [
    ['Evaluación inicial', 'ahora', 'Ahora'],
    ['Objetivo', 'despues', 'Después de la evaluación.'],
    ['Plan', 'despues', 'Después del objetivo.'],
  ]);
  assert.deepEqual(estados('3 nov', null), [
    ['Evaluación inicial', 'listo', 'Registrada el 3 nov.'],
    ['Objetivo', 'ahora', 'Ahora'],
    ['Plan', 'despues', 'Después del objetivo.'],
  ]);
  assert.deepEqual(estados(null, null)[0], ['Evaluación inicial', 'despues', 'Leyendo…'], 'mientras se lee, ningún paso se dice listo ni actual');
  assert.equal(pasosDelPrimerPlan(false, '4 nov')[2].estado, 'ahora');
});
