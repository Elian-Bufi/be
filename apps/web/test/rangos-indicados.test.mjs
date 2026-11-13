/**
 * API-PLN-02 y API-PLN-03 en el editor de Nutrición (ED-34; decisión de Dirección del 2026-11-13, «Último peso, guardado
 * en gramos») · El formulario de los rangos indicados, sin React: lo escrito, los gramos que resultan, el cuerpo que se
 * manda y los textos. Los valores esperados se calcularon a mano.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const R = await import('../src/app/pro/advisees/nutrition/rangos-indicados.ts');

const P78 = { source: 'RECORDED', valueKg: 78, measuredOn: '2026-11-10', measurementId: 'med-78' };
const ULTIMO_80 = { measurementId: 'med-80', valueKg: 80, measuredOn: '2026-11-12' };
const campo = (unidad, min, max) => ({ unidad, min, max });

test('lo escrito: vacío es sin límite, la coma es decimal y lo que no se entiende nunca es cero', () => {
  assert.equal(R.leerNumero(''), null);
  assert.equal(R.leerNumero('  '), null);
  assert.equal(R.leerNumero('1,6'), 1.6);
  assert.equal(R.leerNumero('0'), 0);
  for (const t of ['abc', '-1', '1,6,2', '1e3']) assert.ok(Number.isNaN(R.leerNumero(t)), t);
  assert.equal(R.problemaDelCampo(campo('g_per_kg', '1,234', ''), 'min'), 'Hasta dos decimales.');
  assert.equal(R.problemaDelCampo(campo('g', '10,25', ''), 'min'), 'Hasta un decimal.');
  assert.equal(R.problemaDelCampo(campo('g_per_kg', '', '25'), 'max'), 'Hasta 20 g/kg.');
  assert.equal(R.problemaDelCampo(campo('g', '90', '60'), 'max'), 'El máximo es menor que el mínimo.');
  assert.equal(R.problemaDelCampo(campo('g', 'x', ''), 'min'), 'Escribí un número, por ejemplo 1,6.');
  assert.equal(R.problemaDelCampo(campo('g', '', ''), 'min'), null);
});

test('los gramos que resultan se ven antes de guardar, con la cuenta del dominio', () => {
  assert.equal(R.gramosQueResultan(campo('g_per_kg', '1,6', '2'), 78), '125 a 156 g');
  assert.equal(R.gramosQueResultan(campo('g_per_kg', '1,6', ''), 78), 'desde 125 g');
  assert.equal(R.gramosQueResultan(campo('g', '', '25,5'), null), 'hasta 25,5 g');
  // Sin peso, o con algo que no se entiende: no hay gramos (ni cero).
  assert.equal(R.gramosQueResultan(campo('g_per_kg', '1,6', '2'), null), null);
  assert.equal(R.gramosQueResultan(campo('g', 'x', '2'), null), null);
  assert.equal(R.gramosQueResultan(campo('g', '', ''), 78), null);
});

test('el peso: el guardado, el último registrado o uno a mano', () => {
  const datos = { bodyWeight: P78, anthropometry: { enabled: true, latestWeight: ULTIMO_80 } };
  assert.deepEqual(R.pesoInicial(datos, '2026-11-13'), { tipo: 'guardado' });
  assert.deepEqual(R.pesoInicial({ bodyWeight: null, anthropometry: datos.anthropometry }, '2026-11-13'), { tipo: 'registrado' });
  assert.deepEqual(R.pesoInicial({ bodyWeight: null, anthropometry: { enabled: false, latestWeight: null } }, '2026-11-13'), { tipo: 'a-mano', kg: '', fecha: '2026-11-13' });
  assert.equal(R.kilosDelPeso({ tipo: 'guardado' }, P78, ULTIMO_80), 78);
  assert.equal(R.kilosDelPeso({ tipo: 'registrado' }, P78, ULTIMO_80), 80);
  assert.equal(R.kilosDelPeso({ tipo: 'a-mano', kg: '70,5', fecha: '2026-11-13' }, P78, ULTIMO_80), 70.5);
  assert.equal(R.kilosDelPeso({ tipo: 'a-mano', kg: '', fecha: '2026-11-13' }, P78, ULTIMO_80), null);
  assert.deepEqual(R.pesoParaMandar({ tipo: 'guardado' }, P78, ULTIMO_80), { source: 'RECORDED', measurementId: 'med-78' });
  assert.deepEqual(R.pesoParaMandar({ tipo: 'registrado' }, P78, ULTIMO_80), { source: 'RECORDED', measurementId: 'med-80' });
  assert.deepEqual(R.pesoParaMandar({ tipo: 'a-mano', kg: '70,5', fecha: '2026-11-13' }, P78, null), { source: 'MANUAL', valueKg: 70.5, measuredOn: '2026-11-13' });
  assert.equal(R.pesoParaMandar({ tipo: 'a-mano', kg: 'x', fecha: '2026-11-13' }, P78, null), null);
  assert.equal(R.pesoEnPalabras(P78), 'Con 78 kg del 10/11 · peso registrado en Antropometría');
  assert.equal(R.pesoEnPalabras({ source: 'MANUAL', valueKg: 70.5, measuredOn: '2026-11-12', measurementId: null }), 'Con 70,5 kg del 12/11 · cargado a mano');
});

test('un peso más nuevo se avisa en neutro y no cambia nada', () => {
  assert.match(R.avisoDePesoMasNuevo({ bodyWeight: P78, anthropometry: { enabled: true, latestWeight: ULTIMO_80 } }), /^Hay un peso más nuevo \(80 kg del 12\/11\)\. Lo guardado no cambia/);
  assert.equal(R.avisoDePesoMasNuevo({ bodyWeight: P78, anthropometry: { enabled: true, latestWeight: { ...ULTIMO_80, measurementId: 'med-78' } } }), null);
  assert.equal(R.avisoDePesoMasNuevo({ bodyWeight: null, anthropometry: { enabled: true, latestWeight: ULTIMO_80 } }), null);
});

test('el cuerpo de API-PLN-03: lo guardado tal cual, el rango nuevo en su lugar y el peso solo si algo va en g/kg', () => {
  const datos = {
    revision: 2,
    bodyWeight: P78,
    dayTypes: [
      {
        dayTypeId: 'd1',
        day: { protein: { unit: 'g_per_kg', perKg: { min: 1.6, max: 2 }, grams: { min: 125, max: 156 } } },
        meals: [{ mealId: 'm1', range: { fat: { unit: 'g', perKg: null, grams: { min: null, max: 25 } } } }],
      },
    ],
  };
  const f = { ...R.formularioDesde(undefined), carbohydrate: campo('g', '60', '80') };
  const cuerpo = R.cuerpoParaGuardar(datos, { dayTypeId: 'd1', mealId: 'm2' }, R.rangoDelFormulario(f), { source: 'RECORDED', measurementId: 'med-78' });
  assert.deepEqual(cuerpo, {
    expectedRevision: 2,
    bodyWeight: { source: 'RECORDED', measurementId: 'med-78' },
    dayTypes: [
      {
        dayTypeId: 'd1',
        day: { protein: { unit: 'g_per_kg', min: 1.6, max: 2 } },
        meals: [
          { mealId: 'm1', range: { fat: { unit: 'g', min: null, max: 25 } } },
          { mealId: 'm2', range: { carbohydrate: { unit: 'g', min: 60, max: 80 } } },
        ],
      },
    ],
  });
  // Quitar el único rango en g/kg deja el plan sin peso.
  const sinDia = R.cuerpoParaGuardar(datos, { dayTypeId: 'd1', mealId: null }, null, null);
  assert.deepEqual([sinDia.bodyWeight, sinDia.dayTypes[0].day], [null, null]);
  // Con el peso retenido, lo guardado en g/kg vuelve en gramos: no se puede reescribir lo que no se ve.
  const retenido = { ...datos, bodyWeight: null, dayTypes: [{ ...datos.dayTypes[0], day: { protein: { unit: 'g_per_kg', perKg: null, grams: { min: 125, max: 156 } } } }] };
  assert.deepEqual(R.formularioDesde(retenido.dayTypes[0].day).protein, campo('g', '125', '156'));
  assert.deepEqual(R.cuerpoParaGuardar(retenido, { dayTypeId: 'd2', mealId: null }, null, null).dayTypes[0].day, { protein: { unit: 'g', min: 125, max: 156 } });
});

test('un rango en una línea y en palabras, con los g/kg cuando se pueden ver', () => {
  const r = { protein: { unit: 'g_per_kg', perKg: { min: 1.6, max: 2 }, grams: { min: 125, max: 156 } }, carbohydrate: { unit: 'g', perKg: null, grams: { min: 250, max: null } }, fat: { unit: 'g', perKg: null, grams: { min: null, max: 25 } } };
  assert.equal(R.rangoEnUnaLinea(r), 'P 125 a 156 g · C desde 250 g · G hasta 25 g');
  assert.equal(R.rangoEnPalabras(r), 'Proteínas 125 a 156 g (1,6 a 2 g/kg) · Carbohidratos desde 250 g · Grasas hasta 25 g');
  assert.deepEqual(R.formularioDesde(r).protein, campo('g_per_kg', '1,6', '2'));
});

test('los textos de los rangos indicados no califican ni usan el signo de proporción, tampoco en un comentario', () => {
  for (const archivo of ['rangos-indicados.ts', 'rangos-indicados-del-plan.tsx']) {
    const fuente = readFileSync(new URL(`../src/app/pro/advisees/nutrition/${archivo}`, import.meta.url), 'utf8');
    fuente.split('\n').forEach((linea, i) => assert.doesNotMatch(linea, /%|cumplimiento|adherencia|racha|asesorad|puntaje|óptim|mejor|peor/i, `${archivo}:${i + 1}: ${linea.trim()}`));
  }
});
