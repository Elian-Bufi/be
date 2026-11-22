/**
 * WP-OBJETIVO-Y-CALCULADOR (DL-186) · El calculador del objetivo y la propuesta de rangos en el website, sin React: lo
 * escrito, los datos con su origen, lo que se manda a la API, la propuesta por comida y lo que se reemplaza. Los valores
 * esperados se calcularon a mano con los coeficientes publicados.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

// Los módulos importan sus vecinos sin extensión, como los resuelve Next: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const K = await import('../src/app/pro/advisees/nutrition/calculador-del-objetivo.ts');
const P = await import('../src/app/pro/advisees/nutrition/propuesta-de-rangos.ts');
const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8');

const HOY = '2026-11-20';
const TOMA = {
  evaluationId: 'ev-1',
  measuredOn: '2026-11-17',
  occurredAt: '2026-11-17T12:00:00.000Z',
  weightKg: 68,
  heightCm: 162,
  ageYears: null,
  composition: [
    { calculationId: 'c-mlg', metric: 'masa-libre-de-grasa-durnin-womersley', label: 'Masa libre de grasa (Durnin y Womersley)', value: 46.5, unit: 'kg', leanMassKg: 46.5 },
    { calculationId: 'c-g', metric: 'grasa-faulkner', label: 'Grasa corporal (Faulkner)', value: 30, unit: '%', leanMassKg: 47.6 },
  ],
};

test('el punto de partida: la toma más nueva con su masa libre de grasa, Mifflin-St Jeor y factor 1,55', () => {
  const v = K.calculadorInicial([TOMA], HOY);
  assert.deepEqual([v.fuente, v.evaluationId, v.corridaId, v.metodo, v.factor], ['toma', 'ev-1', 'c-mlg', 'MIFFLIN_ST_JEOR', '1,55']);
  assert.equal(K.calculadorInicial([], HOY).fuente, 'a-mano');
});

test('con una toma: los datos con su origen, lo que falta a mano, y la edad que falta se dice', () => {
  const base = { ...K.calculadorInicial([TOMA], HOY), sexo: 'FEMALE', proteinaPorKg: '1,8', grasaPorKg: '0,9' };
  // La toma no tiene la edad: Mifflin la pide, y lo dice.
  const sinEdad = K.calculoEnVivo(base, [TOMA], HOY);
  assert.deepEqual(sinEdad.resultado.resting, { state: 'MISSING_DATA', method: 'MIFFLIN_ST_JEOR', missing: ['ageYears'] });
  assert.equal(K.reposoEnPalabras(sinEdad.resultado.resting), 'Para este método falta la edad. Cargalo a mano o elegí otro método: BE no lo inventa.');
  const conEdad = K.calculoEnVivo({ ...base, edadAgregada: '45' }, [TOMA], HOY);
  assert.deepEqual(conEdad.datos.ageYears, { value: 45, origin: 'MANUAL' });
  assert.deepEqual(conEdad.datos.weightKg, { value: 68, origin: 'MEASUREMENT' });
  assert.equal(conEdad.resultado.resting.kcal, 1307);
  assert.deepEqual(conEdad.resultado.energy, { day: 2025, restDay: null });
  assert.deepEqual(K.valoresParaElObjetivo(conEdad.resultado), { kcal: '2025', proteina: '122', carbohidratos: '247', grasas: '61' });
  // La masa libre de grasa del % de grasa, con su base y su número.
  const delPorcentaje = K.datosUsados({ ...base, corridaId: 'c-g' }, [TOMA]);
  assert.deepEqual(delPorcentaje.leanMassKg, { value: 47.6, origin: 'FROM_BODY_FAT', method: 'Grasa corporal (Faulkner)', bodyFatValue: 30 });
  assert.equal(K.masaEnPalabras(delPorcentaje.leanMassKg, 68), '47,6 kg · el peso menos la grasa: 30 % de los 68 kg (Grasa corporal (Faulkner))');
  // Lo que se manda: la toma, la corrida y lo agregado a mano.
  assert.deepEqual(K.referenciaDelCalculador({ ...base, edadAgregada: '45' }, HOY), { source: 'RECORDED', evaluationId: 'ev-1', leanMassCalculationId: 'c-mlg', additions: { heightCm: null, ageYears: 45 } });
});

test('a mano: los topes, la fecha y la masa libre de grasa menor que el peso; el ajuste con su sentido (RP-05)', () => {
  const v = { ...K.calculadorInicial([], HOY), peso: '70', talla: '175', edad: '30', masaLibre: '80', sexo: 'MALE', ajuste: 'deficit', unidadDelAjuste: 'KCAL', valorDelAjuste: '300', proteinaPorKg: '1,6', grasaPorKg: '0,8' };
  assert.equal(K.problemasDelCalculador(v, HOY).masaLibre, 'La masa libre de grasa es menor que el peso.');
  assert.equal(K.referenciaDelCalculador(v, HOY), null);
  assert.equal(K.problemasDelCalculador({ ...v, fecha: '2026-12-01' }, HOY).fecha, 'La fecha no puede ser posterior a hoy.');
  assert.equal(K.problemasDelCalculador({ ...v, peso: '1.850' }, HOY).peso, 'Escribí un número, por ejemplo 1,55.');
  const bien = { ...v, masaLibre: '' };
  // RP-05: el sentido se elige y la cantidad va sin signo; por dentro, con su signo, como lo guarda el contrato.
  assert.deepEqual(K.parametrosDelCalculador(bien, HOY).adjustment, { kind: 'KCAL', value: -300 });
  assert.deepEqual(K.parametrosDelCalculador({ ...bien, ajuste: 'superavit', valorDelAjuste: '250' }, HOY).adjustment, { kind: 'KCAL', value: 250 });
  assert.deepEqual(K.parametrosDelCalculador({ ...bien, ajuste: 'deficit', unidadDelAjuste: 'PERCENT', valorDelAjuste: '15' }, HOY).adjustment, { kind: 'PERCENT', value: -15 });
  assert.equal(K.parametrosDelCalculador({ ...bien, ajuste: 'mantener', valorDelAjuste: '300' }, HOY).adjustment, null);
  assert.equal(K.problemasDelCalculador({ ...bien, unidadDelAjuste: 'PERCENT', valorDelAjuste: '60' }, HOY).valorDelAjuste, 'Hasta 40, en porcentaje del gasto total.');
  assert.match(K.problemasDelCalculador({ ...bien, valorDelAjuste: '−300' }, HOY).valorDelAjuste, /sin signo: «Déficit» ya dice para qué lado/);
  assert.match(K.problemasDelCalculador({ ...bien, valorDelAjuste: '0' }, HOY).valorDelAjuste, /mayor que cero/);
  // RP-05: «De dónde sale» lo dice la fuente; la masa a mano no lleva una nota escrita.
  assert.equal(K.deDondeSale(bien, []), 'Cargado a mano');
  assert.equal(K.referenciaDelCalculador(bien, HOY).leanMassNote, null);
  const pedido = K.pedidoConReferencia({ rationale: 'x' }, bien, HOY, true);
  assert.equal(pedido.reference.source, 'MANUAL');
  assert.equal(pedido.parameters.restingMethod, 'MIFFLIN_ST_JEOR');
  // Mifflin, hombre: 10 × 70 + 6,25 × 175 − 5 × 30 + 5 = 1.648,75.
  assert.equal(K.calculoEnVivo(bien, [], HOY).resultado.resting.applied, '10 × 70 + 6,25 × 175 − 5 × 30 + 5 = 1.648,8');
});

test('RP-05 · la proteína y la grasa, dentro de sus límites con nombre y de a 0,1: fuera de ellos, se avisa y no se propone', () => {
  const v = { ...K.calculadorInicial([], HOY), peso: '70', talla: '175', edad: '30', sexo: 'MALE', proteinaPorKg: '1,8', grasaPorKg: '0,9' };
  assert.ok(K.parametrosDelCalculador(v, HOY));
  for (const [campo, valor, aviso] of [
    ['proteinaPorKg', '0,5', 'Entre 0,6 y 3 g/kg.'],
    ['proteinaPorKg', '3.1', 'Entre 0,6 y 3 g/kg.'],
    ['grasaPorKg', '0,4', 'Entre 0,5 y 2,5 g/kg.'],
    ['grasaPorKg', '2.6', 'Entre 0,5 y 2,5 g/kg.'],
  ]) {
    const fuera = { ...v, [campo]: valor };
    assert.equal(K.problemasDelCalculador(fuera, HOY)[campo], aviso, `${campo} ${valor}`);
    assert.equal(K.parametrosDelCalculador(fuera, HOY), null, `${campo} ${valor} no propone`);
    assert.equal(K.calculoEnVivo(fuera, [], HOY), null);
  }
  // En los bordes, sí (el número del campo llega con punto: «3.0», «0.5»).
  assert.ok(K.parametrosDelCalculador({ ...v, proteinaPorKg: '3.0', grasaPorKg: '0.5' }, HOY));
  assert.ok(K.parametrosDelCalculador({ ...v, proteinaPorKg: '0,6', grasaPorKg: '2,5' }, HOY));
  // La toma, en palabras, para «De dónde sale» y para el renglón que la elige.
  assert.equal(K.deDondeSale({ fuente: 'toma', evaluationId: 'ev-1' }, [TOMA]), 'Toma del 17/11');
  assert.equal(K.COPY_CALCULADOR.titulo, 'Calcular');
  assert.equal(K.COPY_CALCULADOR.usarLaToma('17/11'), 'Usar la toma del 17/11');
});

test('RP-09 · ten Haaf (2014) en el calculador: cada método dice para quién sirve, y fuera de su franja de edad se dice', () => {
  const v = { ...K.calculadorInicial([], HOY), peso: '70', talla: '175', edad: '30', sexo: 'MALE', metodo: 'TEN_HAAF_2014_WEIGHT', proteinaPorKg: '1,8', grasaPorKg: '0,9' };
  const vivo = K.calculoEnVivo(v, [], HOY);
  assert.equal(vivo.resultado.resting.kcal, 1840);
  assert.equal(vivo.resultado.resting.applied, '11,936 × 70 + 587,728 × 1,75 − 8,129 × 30 + 191,027 × 1 + 29,279 = 1.840,5');
  assert.equal(K.fichaEnUnaLinea('TEN_HAAF_2014_WEIGHT'), 'ten Haaf y Weijs (2014), con el peso · deportistas de 18 a 35 años · usa peso, talla, edad y sexo');
  assert.equal(K.fichaEnUnaLinea('TEN_HAAF_2014_LEAN_MASS'), 'ten Haaf y Weijs (2014), con la masa libre de grasa · deportistas, con la masa libre de grasa · usa masa libre de grasa');
  assert.ok(K.fichaEnUnaLinea('MIFFLIN_ST_JEOR').startsWith('Mifflin-St Jeor (1990) · adultos en general · usa '));
  // Lo que va al objetivo nombra solo el método.
  assert.equal(K.declaracionParaElObjetivo(vivo.parametros), 'Estimación de partida con el calculador de BE: gasto en reposo por ten Haaf y Weijs (2014), con el peso, carbohidratos por diferencia.');
});

test('lo guardado con el objetivo: los avisos en neutro, sin tocar lo guardado', () => {
  const avisos = K.avisosDeLaReferencia({ anthropometryWithheld: false }, { anthropometryEnabled: true, newerMeasurement: { evaluationId: 'ev-2', measuredOn: '2026-11-19' }, referenceState: 'CHANGED' });
  assert.equal(avisos.length, 2);
  assert.match(avisos[0], /Hay una toma más nueva, del 19\/11/);
  assert.match(avisos[1], /se corrigió o se anuló/);
  assert.deepEqual(K.avisosDeLaReferencia(null, { anthropometryEnabled: false, newerMeasurement: null, referenceState: null }), []);
});

const DIA = { dayTypeId: 'd1', nombre: 'Día habitual', comidas: [{ mealId: 'm1', nombre: 'Desayuno' }, { mealId: 'm2', nombre: 'Almuerzo' }, { mealId: 'm3', nombre: 'Merienda' }, { mealId: 'm4', nombre: 'Cena' }] };
const CALCULO = {
  result: {
    macros: {
      base: 'BODY_WEIGHT',
      baseKg: 68,
      day: { energyKcal: 1725, protein: { grams: 122 }, carbohydrate: { grams: 172 }, fat: { grams: 61 } },
      restDay: { energyKcal: 1529, protein: { grams: 122 }, carbohydrate: { grams: 123 }, fat: { grams: 61 } },
    },
  },
};

test('la propuesta: el día con su margen y cada comida con el reparto sugerido; nunca pisa lo escrito sin confirmar', () => {
  const fuente = P.fuenteDeLaPropuesta(null, CALCULO);
  assert.equal(fuente.origen, 'calculo');
  assert.equal(fuente.descanso.carbohydrate, 123);
  const r = P.repartoInicial(DIA);
  assert.deepEqual(r.comidas.m3, { protein: '26', carbohydrate: '14', fat: '32' });
  const p = P.propuestaDelDia(DIA, r, fuente, 10);
  assert.ok(p.ok);
  assert.deepEqual(p.dia.protein, { min: 110, max: 134 });
  assert.equal(P.limitesEnPalabras(p.comidas[0].carbohydrate), '50 a 61 g');
  // El día de descanso usa sus carbohidratos.
  assert.deepEqual(P.propuestaDelDia(DIA, { ...r, variante: 'descanso' }, fuente, 0).dia.carbohydrate, { min: 123, max: 123 });
  // Un reparto que no suma 100 no propone.
  const malo = P.propuestaDelDia(DIA, { ...r, comidas: { ...r.comidas, m4: { ...r.comidas.m4, carbohydrate: '10' } } }, fuente, 10);
  assert.deepEqual(malo, { ok: false, sumas: [{ macro: 'carbohydrate', suma: 91 }] });

  // Lo ya escrito: el almuerzo tiene su rango. Sin reemplazar, se conserva; con reemplazar, se dice.
  const datos = {
    revision: 3,
    bodyWeight: null,
    dayTypes: [{ dayTypeId: 'd1', day: null, meals: [{ mealId: 'm2', range: { protein: { unit: 'g', perKg: null, grams: { min: 30, max: 40 } } } }] }],
  };
  const propuestos = [{ dayTypeId: 'd1', dia: p.dia, comidas: DIA.comidas.map((c, j) => ({ mealId: c.mealId, rango: p.comidas[j] })) }];
  const nombre = (_d, m) => (m === null ? 'todo el día' : DIA.comidas.find((c) => c.mealId === m).nombre);
  const conservando = P.cuerpoConLaPropuesta(datos, propuestos, nombre, false);
  assert.deepEqual([conservando.nuevos, conservando.conservados, conservando.reemplazados], [4, ['Almuerzo'], []]);
  assert.equal(conservando.cuerpo.expectedRevision, 3);
  assert.deepEqual(conservando.cuerpo.dayTypes[0].meals.find((m) => m.mealId === 'm2').range, { protein: { unit: 'g', min: 30, max: 40 } });
  const reemplazando = P.cuerpoConLaPropuesta(datos, propuestos, nombre, true);
  assert.deepEqual(reemplazando.reemplazados, ['Almuerzo']);
  assert.equal(reemplazando.cuerpo.dayTypes[0].meals.find((m) => m.mealId === 'm2').range.carbohydrate.unit, 'g');
  assert.equal(reemplazando.cuerpo.bodyWeight, null);
  // Sin cálculo con macros, los gramos del objetivo; en proporción de la energía, nada que proponer.
  const objetivo = { estimatedEnergyRequirement: { value: 2000 }, macronutrientDistribution: { protein: { value: 100, unit: 'g/day' }, carbohydrate: { value: 250, unit: 'g/day' }, fat: { value: 65, unit: 'g/day' } } };
  assert.equal(P.fuenteDeLaPropuesta(objetivo, null).origen, 'objetivo');
  assert.equal(P.fuenteDeLaPropuesta({ ...objetivo, macronutrientDistribution: { ...objetivo.macronutrientDistribution, fat: { value: 30, unit: 'energy_share' } } }, null), null);
  // Rige lo que escribió el profesional: si cambió los gramos del cálculo, la propuesta usa los suyos y no ofrece el descanso.
  const cambiado = P.fuenteDeLaPropuesta(objetivo, CALCULO);
  assert.deepEqual([cambiado.origen, cambiado.dia.protein, cambiado.descanso], ['objetivo', 100, null]);
  assert.match(cambiado.texto, /rigen los tuyos/);
  // Con el objetivo igual al cálculo, el día y el descanso del cálculo.
  const igual = { estimatedEnergyRequirement: { value: 1725 }, macronutrientDistribution: { protein: { value: 122, unit: 'g/day' }, carbohydrate: { value: 172, unit: 'g/day' }, fat: { value: 61, unit: 'g/day' } } };
  assert.deepEqual([P.fuenteDeLaPropuesta(igual, CALCULO).origen, P.fuenteDeLaPropuesta(igual, CALCULO).descanso.carbohydrate], ['calculo', 123]);
  // Las comidas suman exactamente el rango del día.
  for (const m of ['protein', 'carbohydrate', 'fat']) {
    assert.equal(p.comidas.reduce((s, c) => s + c[m].min, 0), p.dia[m].min);
    assert.equal(p.comidas.reduce((s, c) => s + c[m].max, 0), p.dia[m].max);
  }
  // Lo que va al objetivo: solo el método; con la energía no positiva, nada.
  assert.doesNotMatch(K.declaracionParaElObjetivo({ restingMethod: 'KATCH_MCARDLE', macros: { base: 'LEAN_MASS', proteinPerKg: 2, fatPerKg: 1 } }), /toma|g\/kg|factor/);
  assert.equal(K.valoresParaElObjetivo({ energy: { day: -273, restDay: null }, macros: null }), null);
  // El rechazo de la referencia se dice sin elegir entre «sin permiso», «no existe» y «es de otro».
  assert.match(K.falloDeLaReferencia({ ok: false, tipo: 'API', issues: [{ code: 'MEASUREMENT_NOT_AVAILABLE', path: 'reference.evaluationId' }] }), /ya no se puede usar de referencia/);
  assert.doesNotMatch(K.falloDeLaReferencia({ ok: false, tipo: 'API', issues: [{ code: 'MEASUREMENT_NOT_AVAILABLE' }] }), /permiso|habilit|otro profesional|no existe/);
  assert.equal(K.falloDeLaReferencia({ ok: false, tipo: 'API', issues: [] }), null);
});

test('las pantallas: el calculador separado de los rangos de cada comida, sin palabras de juicio y con el «%» con su base', () => {
  const calculador = leer('app/pro/advisees/nutrition/calculador.tsx');
  const propuesta = leer('app/pro/advisees/nutrition/propuesta-de-rangos-del-plan.tsx');
  for (const t of [calculador, propuesta, leer('app/pro/advisees/nutrition/referencia-del-objetivo.tsx')]) {
    assert.doesNotMatch(t, /(cumplimiento|adherencia|asesorad[oa]s?|racha|puntaje|estaci[oó]n)/i);
  }
  // RP-19 (DL-188): el «%» de cada parte, con su base, en el rótulo de la columna.
  assert.match(propuesta, /C\.deLosGramos\(gramos\[m\]\)/);
  assert.equal(P.COPY_PROPUESTA.deLosGramos(130), '% de los 130 g');
  // El calculador vive en el objetivo; la propuesta, en el plan, y guarda por API-PLN-03 como cualquier rango.
  assert.match(leer('app/pro/advisees/nutrition/formularios.tsx'), /SeccionDelCalculador/);
  assert.match(propuesta, /escribirRangosDelPlan/);
});
