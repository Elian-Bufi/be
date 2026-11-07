/**
 * WP-TABLERO-ALTA-GAMA TB-25 (DL-163 D-12) · TEST-TAG-018 · los indicadores salen de las áreas del profesional, sin React:
 *  1. sin nada guardado, los cuatro de sus áreas, con la tabla de la propuesta (§18.4);
 *  2. lo que no está en el período no se inventa: la masa grasa pasa al peso y la suma de pliegues a los registros;
 *  3. nunca hay dos iguales ni más de cuatro;
 *  4. lo guardado por la cuenta manda: `resumen-indicadores.tsx` usa los de por defecto solo sin una elección guardada.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const { indicadoresPorDefecto, areasDe, MAXIMO_DE_INDICADORES } = await import('../src/app/pro/advisees/seguimiento/indicadores-por-area.ts');
const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');

const SENTADILLA = 'e:00000000-0000-4000-8000-000000000001';
const PLANCHA = 'e:00000000-0000-4000-8000-000000000002';
const ejercicio = (exerciseKey, sesiones, loadUnits = ['kg']) => ({ exerciseKey, name: exerciseKey === SENTADILLA ? 'Sentadilla' : 'Plancha', otherNames: [], homonym: false, sessions: sesiones, setNumbers: [1, 2, 3], loadUnits, lastDate: '2026-11-05' });
const medida = (metricCode) => ({ metricCode, name: metricCode, observations: 3, units: ['kg'], comparabilityGroups: 1 });
const TODAS = ['peso', 'masa-grasa-durnin-womersley', 'masa-libre-de-grasa-durnin-womersley', 'suma-6-pliegues-isak', 'perimetro-cintura', 'perimetro-brazo-flexionado'].map(medida);
const ids = (lista) => lista.map((r) => [r.metricId, r.exerciseKey, r.setIndex, r.unit].filter((x) => x !== null).join(' '));

test('TEST-TAG-018 · Nutrición sola: calorías, proteínas y registros (la masa grasa no se ve sin Antropometría)', () => {
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: true, ejercicios: null, antropometria: null })), ['nutricion.energia', 'nutricion.proteinas', 'nutricion.registros']);
});

test('TEST-TAG-018 · Nutrición y Antropometría: calorías, proteínas, masa grasa y la suma de 6 pliegues en lugar de los registros', () => {
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: true, ejercicios: null, antropometria: TODAS })), ['nutricion.energia', 'nutricion.proteinas', 'antropometria.masa-grasa-durnin-womersley', 'antropometria.suma-6-pliegues-isak']);
  // Sin masa grasa ni pliegues en el período (Héctor): el peso y los registros.
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: true, ejercicios: null, antropometria: [medida('peso'), medida('perimetro-cintura')] })), ['nutricion.energia', 'nutricion.proteinas', 'antropometria.peso', 'nutricion.registros']);
  // Con Faulkner y no Durnin y Womersley, la de Faulkner.
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: true, ejercicios: null, antropometria: [medida('peso'), medida('masa-grasa-faulkner')] })).slice(2, 3), ['antropometria.masa-grasa-faulkner']);
});

test('TEST-TAG-018 · Entrenamiento: la carga de la serie principal, las series registradas, el RIR y la masa libre de grasa, si la ve', () => {
  const ejercicios = [ejercicio(SENTADILLA, 30), ejercicio(PLANCHA, 20, [])];
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: false, ejercicios, antropometria: null })), [`entrenamiento.carga ${SENTADILLA} 1 kg`, `entrenamiento.series-registradas ${SENTADILLA}`, `entrenamiento.rir ${SENTADILLA} 1`]);
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: false, ejercicios, antropometria: TODAS })).at(-1), 'antropometria.masa-libre-de-grasa-durnin-womersley');
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: false, ejercicios, antropometria: [medida('peso')] })).at(-1), 'antropometria.peso');
  // Un ejercicio sin cargas: el primero ya son sus series registradas, y no se repiten.
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: false, ejercicios: [ejercicio(PLANCHA, 20, [])], antropometria: null })), [`entrenamiento.series-registradas ${PLANCHA}`, `entrenamiento.rir ${PLANCHA} 1`]);
  // Con el área y sin sesiones en el período: nada que mostrar todavía, y no se inventa.
  assert.deepEqual(indicadoresPorDefecto({ nutricion: false, ejercicios: [], antropometria: null }), []);
});

test('TEST-TAG-018 · Antropometría: masa grasa, la suma de 6 pliegues, la cintura y el brazo flexionado', () => {
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: false, ejercicios: null, antropometria: TODAS })), ['antropometria.masa-grasa-durnin-womersley', 'antropometria.suma-6-pliegues-isak', 'antropometria.perimetro-cintura', 'antropometria.perimetro-brazo-flexionado']);
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: false, ejercicios: null, antropometria: [medida('peso'), medida('perimetro-cintura')] })), ['antropometria.peso', 'antropometria.perimetro-cintura']);
});

test('TEST-TAG-018 · Nutrición y Entrenamiento (TA-28): calorías, proteínas, la carga y la masa grasa si ve Antropometría; si no, los registros', () => {
  const ejercicios = [ejercicio(SENTADILLA, 30)];
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: true, ejercicios, antropometria: TODAS })), ['nutricion.energia', 'nutricion.proteinas', `entrenamiento.carga ${SENTADILLA} 1 kg`, 'antropometria.masa-grasa-durnin-womersley']);
  assert.deepEqual(ids(indicadoresPorDefecto({ nutricion: true, ejercicios, antropometria: null })).at(-1), 'nutricion.registros');
});

test('TEST-TAG-018 · nunca más de cuatro ni dos iguales, y las áreas son las lecturas que respondieron', () => {
  const casos = [true, false].flatMap((n) => [null, [], [ejercicio(SENTADILLA, 3)], [ejercicio(PLANCHA, 3, [])]].flatMap((e) => [null, [], TODAS, [medida('peso')]].map((a) => ({ nutricion: n, ejercicios: e, antropometria: a }))));
  for (const d of casos) {
    const lista = indicadoresPorDefecto(d);
    assert.ok(lista.length <= MAXIMO_DE_INDICADORES);
    assert.equal(new Set(ids(lista)).size, lista.length);
    const areas = areasDe(d);
    for (const r of lista) {
      if (r.metricId.startsWith('nutricion.')) assert.ok(areas.nutricion, 'un indicador de Nutrición solo con Nutrición');
      if (r.metricId.startsWith('entrenamiento.')) assert.ok(areas.entrenamiento);
      if (r.metricId.startsWith('antropometria.')) assert.ok(d.antropometria?.some((m) => `antropometria.${m.metricCode}` === r.metricId), 'una medida que está en el período');
    }
  }
});

test('TEST-TAG-018 · lo guardado por la cuenta manda: los de por defecto, solo sin una elección guardada', () => {
  const fuente = readFileSync(join(WEB, 'src/app/pro/advisees/seguimiento/resumen-indicadores.tsx'), 'utf8');
  assert.match(fuente, /guardada \? guardada\.configuration\.metrics : guardada === null \? indicadoresPorDefecto\(disponibles\) : \[\]/);
});
