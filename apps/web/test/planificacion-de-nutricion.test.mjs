/**
 * WP-NUTRICION-PLANIFICACION (NUP-01 a NUP-14) · Los números que se ven mientras se planifica Nutrición, el teclado y los
 * cuadros. Las cuentas se prueban sin React; las pantallas, leyendo el componente (como el resto de las pruebas del
 * website).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

// `planificacion.ts` importa sus vecinos sin extensión, como los resuelve Next: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const P = await import('../src/app/pro/advisees/nutrition/planificacion.ts');
const R = await import('../src/app/pro/advisees/nutrition/rangos.ts');
const V = await import('../src/components/validacion-viva.ts');
const T = await import('../src/components/tocar-afuera.ts');
const N = await import('../src/app/pro/advisees/nutrition/asistente-de-nutricion.ts');
const d = await import('@be/domain');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// Composiciones cada 100 g (sintéticas), las mismas que en `rangos-de-nutricion.test.mjs`.
const comp = (energyKcal, proteinG, carbohydrateG, fatG, fiberG = null) => ({ referenceAmount: '100g', energyKcal, proteinG, carbohydrateG, fatG, fiberG });
const COMPOSICIONES = new Map([
  ['banana', comp(89, 1.1, 22.8, 0.3, 2.6)],
  ['arroz', comp(130, 2.7, 28.2, 0.3)],
  ['pollo', comp(165, 31, 0, 3.6)],
  ['sin-grasas', { referenceAmount: '100g', energyKcal: 50, proteinG: 1, carbohydrateG: 10, fatG: null }],
]);
const NOMBRES = { banana: 'Banana', arroz: 'Arroz', pollo: 'Pollo', 'sin-grasas': 'Caldo', avena: 'Avena' };
const item = (catalogItemId, value, unit = 'g') => ({ catalogItemId, quantity: value === null ? null : { value, unit }, nombre: NOMBRES[catalogItemId] ?? catalogItemId });
const itemDelPlan = (catalogItemId, value, unit = 'g') => ({ catalogItemId, quantity: value === null ? null : { value, unit }, preparationState: 'RAW', note: null });
const opcion = (label, items) => ({ label, items });
const comida = (label, options) => ({ label, prescriptionMode: 'DISH_OPTIONS', options });
const sinReceta = () => null;
const rangoIndicado = (protein, carbohydrate, fat) => {
  const macro = (l) => (l ? { unit: 'g', perKg: null, grams: { min: l[0], max: l[1] } } : undefined);
  return Object.fromEntries(Object.entries({ protein: macro(protein), carbohydrate: macro(carbohydrate), fat: macro(fat) }).filter(([, v]) => v));
};

// ─── NUP-01 · Lo que aporta cada alimento ────────────────────────────────────────────────────────────────────────

test('NUP-01 · cada alimento dice lo que aporta con su cantidad, con la cuenta del dominio, y cambia con los gramos', () => {
  const a120 = P.aporteDelItem(item('banana', 120), COMPOSICIONES.get('banana'));
  assert.equal(P.aporteEnUnaLinea(a120), '107 kcal · P 1,3 g · C 27,4 g · G 0,4 g');
  const a150 = P.aporteDelItem(item('banana', 150), COMPOSICIONES.get('banana'));
  assert.equal(P.aporteEnUnaLinea(a150), '134 kcal · P 1,7 g · C 34,2 g · G 0,5 g');
  assert.equal(P.aporteEnPalabras(a120), 'Aporta Energía 107 kcal · Proteínas 1,3 g · Carbohidratos 27,4 g · Grasas 0,4 g');
  // La misma cuenta que el total: las filas, sumadas exactas, dan el total de la opción, nutriente por nutriente.
  const items = [item('banana', 120), item('arroz', 200), item('pollo', 150.5)];
  const total = R.totalDeLaOpcion(items, COMPOSICIONES);
  for (const n of R.NUTRIENTES_DEL_RANGO) {
    const filas = items.map((it) => P.aporteDelItem(it, COMPOSICIONES.get(it.catalogItemId)).total[n].exacto);
    assert.equal(d.sumaExacta(filas), total[n].exacto, n);
  }
});

test('NUP-01 (NUP-D02) · lo que falta se nombra y nunca es cero', () => {
  const linea = (it, c) => P.aporteEnUnaLinea(P.aporteDelItem(it, c));
  assert.equal(linea(item('banana', null), COMPOSICIONES.get('banana')), 'Sin cantidad: escribila para ver lo que aporta');
  assert.equal(linea(item('banana', Number.NaN), COMPOSICIONES.get('banana')), 'Sin cantidad: escribila para ver lo que aporta');
  assert.equal(linea(item('banana', 2, 'unit'), COMPOSICIONES.get('banana')), 'En unidades: sin estimación');
  assert.equal(linea(item('avena', 40), 'leyendo'), 'Leyendo su composición…');
  assert.equal(linea(item('avena', 40), undefined), 'Leyendo su composición…');
  assert.equal(linea(item('avena', 40), 'sin-composicion'), 'No se pudo leer su composición');
  // Un solo nutriente sin dato: los demás se ven.
  assert.equal(linea(item('sin-grasas', 200), COMPOSICIONES.get('sin-grasas')), '100 kcal · P 2,0 g · C 20,0 g · G Sin dato');
  for (const t of [linea(item('banana', null), COMPOSICIONES.get('banana')), linea(item('avena', 40), 'leyendo')]) assert.doesNotMatch(t, /\b0 (kcal|g)\b/);
});

test('NUP-01 (NUP-D03) · la pista dice la composición cada 100 g y de dónde sale', () => {
  assert.equal(P.composicionEnLaPista(COMPOSICIONES.get('banana'), 'USDA'), 'Cada 100 g: 89 kcal · proteínas 1,1 g · carbohidratos 22,8 g · grasas 0,3 g · fibra 2,6 g. De dónde sale: USDA.');
  assert.equal(P.composicionEnLaPista(COMPOSICIONES.get('sin-grasas'), null), 'Cada 100 g: 50 kcal · proteínas 1,0 g · carbohidratos 10,0 g · grasas sin dato · fibra sin dato.');
  assert.equal(P.composicionEnLaPista({ ...COMPOSICIONES.get('arroz'), referenceAmount: '100ml' }, 'Cargado por vos').startsWith('Cada 100 ml: 130 kcal'), true);
  assert.equal(P.composicionEnLaPista('leyendo', 'USDA'), 'Leyendo su composición del catálogo. De dónde sale: USDA.');
  assert.equal(P.composicionEnLaPista('sin-composicion', null), 'No se pudo leer su composición del catálogo.');
  // El origen breve: el del buscador si vino; si no, por su procedencia.
  assert.equal(P.origenBreve({ provenance: 'BE_SYNTHETIC_SEED', externalSource: null }), 'Demostración');
  assert.equal(P.origenBreve({ provenance: 'PROFESSIONAL_MANUAL', externalSource: null }), 'Cargado a mano');
  assert.equal(P.origenBreve({ provenance: 'CONTROLLED_IMPORT', externalSource: { provider: 'USDA_FDC_SR_LEGACY' } }), 'USDA');
  assert.equal(P.origenBreve({ provenance: 'CONTROLLED_IMPORT', externalSource: { provider: 'OPEN_FOOD_FACTS' } }), 'Open Food Facts');
  assert.equal(P.origenBreve({ provenance: 'PROFESSIONAL_MANUAL', externalSource: null, origin: { loadedBy: 'YOU', approximateCorrespondence: null } }), 'Cargado por vos');
});

// ─── NUP-02 · La comida plegada ──────────────────────────────────────────────────────────────────────────────────

test('NUP-02 · la comida plegada dice lo que aporta de la opción que menos a la que más, sin sumar alternativas', () => {
  const dia = { label: 'Habitual', meals: [comida('Almuerzo', [opcion('Arroz', [itemDelPlan('arroz', 200)]), opcion('Fruta', [itemDelPlan('banana', 100)])]), comida('Cena', [])] };
  const r = R.rangosDelDia(dia, 0, COMPOSICIONES, NOMBRES, sinReceta);
  assert.equal(P.loQueAportaLaComida(r.comidas[0].rango, 2), '89–260 kcal · P 1,1–5,4 g · C 22,8–56,4 g · G 0,3–0,6 g');
  assert.equal(P.loQueAportaLaComidaEnPalabras(r.comidas[0].rango, 2), 'Según la opción, aporta Energía de 89 a 260 kcal · Proteínas de 1,1 a 5,4 g · Carbohidratos de 22,8 a 56,4 g · Grasas de 0,3 a 0,6 g');
  assert.equal(P.loQueAportaLaComida(r.comidas[1].rango, 0), null, 'sin opciones no hay nada que decir');
  // Una opción sola: un número, no un rango.
  const una = R.rangosDelDia({ label: 'X', meals: [comida('Merienda', [opcion('Fruta', [itemDelPlan('banana', 100)])])] }, 0, COMPOSICIONES, NOMBRES, sinReceta);
  assert.equal(P.loQueAportaLaComida(una.comidas[0].rango, 1), '89 kcal · P 1,1 g · C 22,8 g · G 0,3 g');
  // Un hueco: «Sin dato», nunca cero.
  const hueco = R.rangosDelDia({ label: 'X', meals: [comida('Merienda', [opcion('Fruta', [itemDelPlan('banana', null)])])] }, 0, COMPOSICIONES, NOMBRES, sinReceta);
  assert.equal(P.loQueAportaLaComida(hueco.comidas[0].rango, 1), 'kcal sin dato · P Sin dato · C Sin dato · G Sin dato');
});

// ─── NUP-04 · Ubicar frente al rango ─────────────────────────────────────────────────────────────────────────────

test('NUP-04 (NUP-D05) · ubicar frente a un rango: dentro, encima o debajo, con la diferencia; un lado vacío es sin límite', () => {
  assert.deepEqual(P.ubicar(35, { min: 30, max: 40 }), { tipo: 'dentro' });
  assert.deepEqual(P.ubicar(52, { min: 30, max: 40 }), { tipo: 'encima', diferencia: 12 });
  assert.deepEqual(P.ubicar(22, { min: 30, max: 40 }), { tipo: 'debajo', diferencia: 8 });
  assert.deepEqual(P.ubicar(500, { min: 30, max: null }), { tipo: 'dentro' });
  assert.deepEqual(P.ubicar(0, { min: null, max: 40 }), { tipo: 'dentro' });
  // Se compara lo que se muestra: 40,04 g se ve «40 g» y queda dentro, nunca «0 g por encima».
  assert.deepEqual(P.ubicar(40.04, { min: 30, max: 40 }), { tipo: 'dentro' });
  assert.deepEqual(P.ubicar(40.06, { min: 30, max: 40 }), { tipo: 'encima', diferencia: 0.1 });
});

test('NUP-04 · la opción frente al rango de su comida, con el ejemplo de Dirección; solo los macros con rango', () => {
  const total = R.totalDeLaOpcion([item('pollo', 167.7)], COMPOSICIONES);
  const lineas = P.opcionFrenteAlRango(total, rangoIndicado([30, 40], null, [null, 5]), 'Almuerzo');
  assert.deepEqual(
    lineas.map((l) => l.texto),
    ['Proteínas: 52 g · 12 g por encima del rango de Almuerzo (30 a 40 g)', 'Grasas: 6 g · 1 g por encima del rango de Almuerzo (hasta 5 g)'],
  );
  assert.deepEqual(lineas.map((l) => l.afuera), [true, true]);
  const dentro = P.opcionFrenteAlRango(R.totalDeLaOpcion([item('pollo', 110)], COMPOSICIONES), rangoIndicado([30, 40]), 'Almuerzo');
  assert.deepEqual(dentro.map((l) => [l.texto, l.afuera]), [['Proteínas: 34,1 g · dentro del rango de Almuerzo (30 a 40 g)', false]]);
  const debajo = P.opcionFrenteAlRango(R.totalDeLaOpcion([item('banana', 100)], COMPOSICIONES), rangoIndicado(null, [30, null]), 'Merienda');
  assert.equal(debajo[0].texto, 'Carbohidratos: 22,8 g · 7,2 g por debajo del rango de Merienda (desde 30 g)');
  // Sin rango no hay línea; sin dato, se dice y no se ubica.
  assert.deepEqual(P.opcionFrenteAlRango(total, null, 'Almuerzo'), []);
  const sinDato = P.opcionFrenteAlRango(R.totalDeLaOpcion([item('pollo', null)], COMPOSICIONES), rangoIndicado([30, 40]), 'Almuerzo');
  assert.equal(sinDato[0].texto, 'Proteínas: sin dato · no se puede ubicar frente del rango de Almuerzo (30 a 40 g)');
});

test('NUP-04 · el día frente a su rango: se ubican las dos puntas de lo que puede elegir', () => {
  const dia = { label: 'Habitual', meals: [comida('Almuerzo', [opcion('A', [itemDelPlan('pollo', 200)]), opcion('B', [itemDelPlan('pollo', 300)])]), comida('Cena', [opcion('C', [itemDelPlan('pollo', 100)])])] };
  const r = R.rangosDelDia(dia, 0, COMPOSICIONES, NOMBRES, sinReceta);
  // Proteínas: de 93 (62 + 31) a 124 g (93 + 31).
  const [p] = P.diaFrenteAlRango(r.dia, rangoIndicado([100, 120]));
  assert.equal(p.texto, 'Proteínas del día: de 93 a 124 g según lo que elija · el mínimo queda 7 g por debajo y el máximo queda 4 g por encima del rango del día (100 a 120 g)');
  assert.equal(p.afuera, true);
  const [dentro] = P.diaFrenteAlRango(r.dia, rangoIndicado([90, 130]));
  assert.equal(dentro.texto, 'Proteínas del día: de 93 a 124 g según lo que elija · dentro del rango del día (90 a 130 g)');
});

// ─── NUP-06 · La suma de los rangos frente al objetivo ───────────────────────────────────────────────────────────

test('NUP-06 (NUP-D06) · la suma de los rangos de las comidas frente al objetivo, con los ejemplos de Dirección', () => {
  const comidas = [
    { nombre: 'Desayuno', rango: rangoIndicado([25, 35], [40, 60], [10, 15]) },
    { nombre: 'Almuerzo', rango: rangoIndicado([40, 55], [60, 80], [20, 30]) },
    { nombre: 'Cena', rango: rangoIndicado([30, 40], [50, 70], [20, 30]) },
  ];
  const suma = P.sumaDeLosRangos(comidas);
  assert.deepEqual([suma.macros.protein.min, suma.macros.protein.max], [95, 130]);
  assert.deepEqual([suma.macros.fat.min, suma.macros.fat.max], [50, 75]);
  // Las kcal de la suma, con 4, 4 y 9: 95×4 + 150×4 + 50×9 = 1.430; 130×4 + 210×4 + 75×9 = 2.035.
  assert.deepEqual([suma.kcal.min, suma.kcal.max], [1430, 2035]);
  const filas = P.sumaFrenteAlObjetivo(suma, P.objetivoDelDia({ estimatedEnergyRequirement: { value: 2500 }, macronutrientDistribution: { protein: { value: 112, unit: 'g/day' }, carbohydrate: { value: 80, unit: 'g/day' }, fat: { value: 335, unit: 'g/day' } } }));
  assert.deepEqual(filas.map(P.filaEnUnaLinea), [
    'kcal · 1.430–2.035 kcal · objetivo 2.500 kcal · 465 kcal por encima del máximo',
    'Proteínas · 95–130 g · objetivo 112 g · adentro',
    'Carbohidratos · 150–210 g · objetivo 80 g · 70 g por debajo del mínimo',
    'Grasas · 50–75 g · objetivo 335 g · 260 g por encima del máximo',
  ]);
  assert.match(filas[0].nota, /4, 4 y 9 kcal por gramo/);
  // La franja: la suma y la marca del objetivo en la misma escala.
  const grasas = filas[3].franja;
  assert.ok(grasas.desde < grasas.hasta && grasas.hasta < grasas.objetivo && grasas.objetivo <= 100);
});

test('NUP-06 · una comida sin rango o sin máximo deja la suma sin tope, y se dice cuál; sin rangos, se dice', () => {
  const suma = P.sumaDeLosRangos([
    { nombre: 'Desayuno', rango: rangoIndicado([25, null]) },
    { nombre: 'Almuerzo', rango: rangoIndicado([40, 55]) },
    { nombre: 'Cena', rango: null },
  ]);
  assert.deepEqual([suma.macros.protein.min, suma.macros.protein.max], [65, null]);
  const [kcal, proteinas, carbohidratos] = P.sumaFrenteAlObjetivo(suma, { kcal: 2000, macros: { protein: 112, carbohydrate: null, fat: 60 } });
  assert.equal(P.filaEnUnaLinea(proteinas), 'Proteínas · desde 65 g · objetivo 112 g · adentro');
  assert.equal(proteinas.nota, 'Cena sin rango · Desayuno sin máximo: la suma no tiene tope');
  assert.equal(proteinas.franja.abierta, true);
  // Una sola comida sin rango alcanza para que la suma no tenga tope: lo de esa comida no tiene límite.
  const unaSinRango = P.sumaDeLosRangos([{ nombre: 'Almuerzo', rango: rangoIndicado([40, 55]) }, { nombre: 'Cena', rango: null }]);
  assert.deepEqual([unaSinRango.macros.protein.min, unaSinRango.macros.protein.max, unaSinRango.macros.protein.sinRango], [40, null, ['Cena']]);
  assert.equal(P.filaEnUnaLinea(carbohidratos), 'Carbohidratos · Sin rangos indicados', 'un objetivo en proporción no se compara');
  assert.equal(kcal.suma, 'desde 260 kcal');
  // Sin objetivo: la suma se ve igual, sin ubicarla.
  assert.equal(P.filaEnUnaLinea(P.sumaFrenteAlObjetivo(suma, null)[1]), 'Proteínas · desde 65 g');
});

// ─── NUP-07 · El objetivo ────────────────────────────────────────────────────────────────────────────────────────

test('NUP-07 (NUP-D07) · el caso real: 2.500 kcal con C 80, G 335 y P 112 suman unas 3.780 kcal, y se avisa sin bloquear', () => {
  const k = P.kcalDeLosGramos({ protein: 112, carbohydrate: 80, fat: 335 }, 2500);
  assert.equal(k.kcal, 3783);
  assert.deepEqual(k.frente, { diferencia: 1283, coinciden: false });
  assert.equal(P.COPY_PLANIFICACION.kcalDeLosGramos(k), 'Los gramos suman 3.783 kcal (proteínas 112 g × 4 + carbohidratos 80 g × 4 + grasas 335 g × 9).');
  assert.equal(P.COPY_PLANIFICACION.noCoinciden(k, 2500), 'No coinciden con las 2.500 kcal indicadas: los gramos suman 1.283 kcal más. Revisá los gramos o las kcal; se puede guardar igual.');
  // Hasta el 5 % de las indicadas, coinciden (4, 4 y 9 son redondeos): 2.378 frente a 2.500 es 4,9 %.
  assert.equal(P.kcalDeLosGramos({ protein: 125, carbohydrate: 312, fat: 70 }, 2500).frente.coinciden, true);
  assert.equal(P.kcalDeLosGramos({ protein: 125, carbohydrate: 300, fat: 70 }, 2500).frente.coinciden, false);
  // Con un macro sin escribir no se suma a medias; sin kcal, no se compara.
  assert.equal(P.kcalDeLosGramos({ protein: 112, carbohydrate: null, fat: 335 }, 2500), null);
  assert.equal(P.kcalDeLosGramos({ protein: 112, carbohydrate: 80, fat: 335 }, null).frente, null);
});

test('NUP-07 (NUP-D08) · el porcentaje va con su base y su número real al lado', () => {
  assert.equal(P.porcentajeDeLasKcal('protein', 112, 2500), '18 % de las 2.500 kcal · 112 g · 448 kcal');
  assert.equal(P.porcentajeDeLasKcal('fat', 335, 2500), '121 % de las 2.500 kcal · 335 g · 3.015 kcal');
  assert.equal(P.porcentajeDeLasKcal('protein', 112, null), null);
  assert.equal(P.porcentajeDeLasKcal('protein', null, 2500), null);
});

// ─── NUP-08 · El «%» en el website del profesional ───────────────────────────────────────────────────────────────

/** NUP-D11: un «%» del website del profesional va con su base: «de las 2.500 kcal». */
const porcentajeSinSuBase = (t) => /%(?!\s*de\s+l[ao]s?\b)/.test(t);

test('NUP-08 (NUP-D11) · los textos de la planificación no califican, y cada «%» dice su base', () => {
  const fuente = leer('app/pro/advisees/nutrition/planificacion.ts');
  const textos = [...fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').matchAll(/'[^'\n]*'|`[^`\n]*`/g)].map((m) => m[0]);
  assert.ok(textos.length > 30);
  for (const t of textos) {
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|óptim|excelente|\bmal\b|\bbien\b/i, t);
    assert.equal(porcentajeSinSuBase(t), false, t);
  }
  // La prueba de la prueba: un porcentaje sin base se detecta.
  assert.equal(porcentajeSinSuBase('Registró el 82 % del plan'), true);
  assert.equal(porcentajeSinSuBase('18 % de las 2.500 kcal'), false);
  const copy = Object.values(P.COPY_PLANIFICACION).map((t) => (typeof t === 'function' ? t({ kcal: 3783, cuenta: 'x', frente: { diferencia: 1, coinciden: false } }, 2500) : t));
  for (const t of copy) assert.deepEqual(d.terminosProhibidosEn(t), [], t);
});

// ─── NUP-09 · Enter ──────────────────────────────────────────────────────────────────────────────────────────────

test('NUP-09 (NUP-D09) · Enter, mientras falten datos, pasa al siguiente que falta (o al primero); si no, envía', () => {
  // El objetivo: evaluación (0), kcal (1), proteínas (2), carbohidratos (3), grasas (4), fundamento (5).
  assert.equal(V.siguienteQueFalta(1, [2, 3, 5]), 2, 'desde las kcal, a las proteínas');
  assert.equal(V.siguienteQueFalta(4, [1, 5]), 5, 'desde las grasas, al fundamento');
  assert.equal(V.siguienteQueFalta(4, [1, 2]), 1, 'sin ninguno después, al primero que falta');
  assert.equal(V.siguienteQueFalta(3, [3]), null, 'falta solo el actual: envía y el envío lo muestra');
  assert.equal(V.siguienteQueFalta(3, []), null, 'no falta nada: envía');
  assert.equal(V.siguienteQueFalta(2, [5, 5, 1]), 5);
  // La pieza común: `useAvisosVivos` la da a sus formularios, y cada formulario la pone en su `<form>`.
  const formulario = leer('components/formulario.tsx');
  assert.match(formulario, /alEnter: \(evento: KeyboardEvent<HTMLElement>\): void => enterAlQueFalta\(evento, ultimo\.current\(\)\.map\(\(e\) => e\.id\)\)/);
  assert.match(formulario, /if \(!\(campo instanceof HTMLInputElement\) \|\| SIN_ENTER\.has\(campo\.type\)\) return;/, 'las áreas de texto, las listas y los botones no se tocan');
  assert.match(formulario, /if \(destino === null\) return;\n\s*evento\.preventDefault\(\);/, 'solo se frena el envío cuando hay a dónde ir');
  for (const ruta of ['app/pro/advisees/nutrition/formularios.tsx', 'app/pro/advisees/nutrition/revisiones.tsx', 'app/pro/advisees/training/revisiones.tsx', 'app/pro/recipes/editor-de-receta.tsx', 'app/pro/solicitar-vinculo.tsx']) {
    const fuente = leer(ruta);
    const formularios = fuente.split('\n').filter((l) => l.includes('<form ') && l.includes('onBlur={avisos.alSalir}'));
    assert.ok(formularios.length > 0, ruta);
    for (const f of formularios) assert.match(f, /onKeyDown=\{avisos\.alEnter\}/, `${ruta}: ${f}`);
  }
  assert.match(leer('app/pro/advisees/nutrition/agregar-item.tsx'), /<form .*onKeyDown=\{\(e\) => enterAlQueFalta\(e, loQueFalta\(\)\)\}/);
});

// ─── NUP-11 · Tocar afuera ───────────────────────────────────────────────────────────────────────────────────────

test('NUP-11 (NUP-D10) · tocar el fondo cierra como Escape; adentro de la caja, o en algo de adentro, no', () => {
  const caja = { left: 100, top: 100, right: 500, bottom: 400 };
  const cuadro = {};
  assert.equal(T.esElFondo(cuadro, cuadro, caja, 50, 200), true);
  assert.equal(T.esElFondo(cuadro, cuadro, caja, 300, 450), true);
  assert.equal(T.esElFondo(cuadro, cuadro, caja, 300, 200), false, 'el relleno del cuadro no es el fondo');
  assert.equal(T.esElFondo({}, cuadro, caja, 50, 200), false, 'un toque en algo de adentro nunca es el fondo');
  const pieza = leer('components/tocar-afuera.ts');
  assert.match(pieza, /const afuera = empezoAfuera\.current && enElFondo\(e\);/, 'tiene que empezar y terminar afuera');
  // Las piezas comunes van por la misma salida que Escape.
  const enfocado = leer('components/cuadro-enfocado.tsx');
  assert.match(enfocado, /const afuera = useTocarAfuera\(pedirCerrar, !ocupado\);/);
  assert.match(enfocado, /<dialog\n\s+ref=\{ref\}\n[\s\S]*?\{\.\.\.afuera\}/);
  const dialogo = leer('components/dialogo.tsx');
  assert.match(dialogo, /const afuera = useTocarAfuera\(pedirVolver, !enviando\);/);
  assert.match(dialogo, /onCancel=\{\(e\) => \{\n\s*e\.preventDefault\(\);\n\s*pedirVolver\(\);/, 'Escape y tocar afuera, por la misma salida');
  assert.match(dialogo, /if \(escrito\.current && !preguntando\) return setPreguntando\(true\);/, 'con algo escrito, primero pregunta');
  for (const ruta of ['components/panel.tsx', 'components/ayuda-de-vista.tsx']) assert.match(leer(ruta), /useTocarAfuera\(/, ruta);
});

// ─── Las pantallas (se lee el componente, sin React en las pruebas) ──────────────────────────────────────────────

const COMIDA = leer('app/pro/advisees/nutrition/comida-del-editor.tsx');
const EDITOR = leer('app/pro/advisees/nutrition/editor.tsx');
const CUADRO = leer('app/pro/advisees/nutrition/cuadro-de-la-opcion.tsx');
const PASOS = leer('app/pro/advisees/nutrition/pasos-del-asistente.tsx');
const PIEZAS = leer('app/pro/advisees/nutrition/suma-de-los-rangos.tsx');
const DEL_PLAN = leer('app/pro/advisees/nutrition/rangos-indicados-del-plan.tsx');
const FORMULARIOS = leer('app/pro/advisees/nutrition/formularios.tsx');
const ESTILOS = leer('app/globals.css');

test('NUP-01 · la fila de cada alimento dice lo que aporta con su cantidad, en vivo, y la pista con el mouse o el foco', () => {
  // Se calcula con la cantidad del ítem, que el campo propaga con cada tecla: cambia mientras se escriben los gramos.
  assert.match(COMIDA, /const aporte = aporteDelItem\(\{ catalogItemId: item\.catalogItemId, quantity: magnitud, nombre \}, composicion\);/);
  assert.match(COMIDA, /setEscrito\(e\.target\.value\);\n\s*const n = leerNumero\(e\.target\.value\);[\s\S]{0,400}onCambiar\(\{ quantity: \{ value: n \?\? Number\.NaN/);
  // Debajo del nombre, con la pista al pasar el mouse; y la misma pista con el foco en la cantidad.
  assert.match(COMIDA, /<th scope="row" className="item-del-editor__nombre">\n\s*\{nombre\}[\s\S]{0,200}<Pista texto=\{pista\}>\n\s*<span className="item-del-editor__aporte" data-aporte-del-item>/);
  assert.match(COMIDA, /<Pista texto=\{pista\}>\n\s*<input\n\s*id=\{`\$\{id\}-cantidad`\}/);
  // La comida del editor y el cuadro de la opción le pasan la composición y el origen de cada alimento.
  assert.match(COMIDA, /composicion=\{composiciones\.get\(it\.catalogItemId\)\}\n\s*origen=\{origenes\.get\(it\.catalogItemId\) \?\? null\}/);
  assert.match(CUADRO, /composicion=\{todasLasComposiciones\.get\(it\.catalogItemId\)\}\n\s*origen=\{todosLosOrigenes\.get\(it\.catalogItemId\) \?\? null\}/);
  // De dónde sale: de los habituales, de lo que trajo el buscador y de lo que se sumó en el cuadro.
  assert.match(EDITOR, /if \(encontrado\) setOrigenes\(\(m\) => new Map\(m\)\.set\(catalogItemId, origenBreve\(encontrado\)\)\);/);
  assert.match(EDITOR, /setOrigenes\(\(m\) => new Map\(\[\.\.\.m, \.\.\.nuevos\.origenes\]\)\);/);
  assert.match(CUADRO, /setOrigenesNuevos\(\(m\) => new Map\(m\)\.set\(e\.catalogItemId, origenBreve\(e\)\)\);/);
});

test('NUP-02 y NUP-03 · la comida plegada dice lo que aporta y su rango; cada opción es un renglón plegable', () => {
  // Lo que aporta y el rango indicado van adentro del botón de la comida: se ven plegada.
  const desde = COMIDA.indexOf('id={`abrir-comida-${id}`}');
  const boton = COMIDA.slice(desde, COMIDA.indexOf('</button>', desde));
  assert.match(boton, /data-aporta-la-comida/);
  assert.match(boton, /data-rango-indicado-de-la-comida/);
  // Cada opción: un botón con `aria-expanded`, que la abre o la pliega; la tabla y las acciones, solo en la abierta.
  assert.match(COMIDA, /aria-expanded=\{abiertaLaOpcion\}\n\s*aria-controls=\{`\$\{propio\}-opcion-\$\{n\}`\}\n\s*onClick=\{\(\) => alElegirOpcion\(abiertaLaOpcion \? -1 : n\)\}/);
  assert.match(COMIDA, /\{abiertaLaOpcion && opcion \? \(\n\s*<div className="opcion-del-editor" data-opcion=\{k \+ 1\}>/);
  assert.match(COMIDA, /data-numeros-de-la-opcion/);
  // NUP-D04: sin elegir, una sola opción nace abierta; con varias, plegadas.
  assert.match(EDITOR, /const pestana = \(j: number\) => pestanas\[`\$\{i\}-\$\{j\}`\] \?\? \(\(dia\?\.meals\[j\]\?\.options\.length \?\? 0\) === 1 \? 0 : -1\);/);
  assert.doesNotMatch(COMIDA, /type="radio"/, 'ya no son pestañas');
});

test('NUP-04 y NUP-05 · la línea frente a los rangos, en la opción y en el cuadro; el rango se indica donde se arma', () => {
  assert.match(COMIDA, /\{frente\.length > 0 \? <FrenteALosRangos lineas=\{frente\} \/> : null\}/);
  assert.match(CUADRO, /<FrenteALosRangos lineas=\{frente\} \/>/);
  // Ubica, no califica: la pieza no usa los colores de error ni de éxito.
  const pieza = COMIDA.slice(COMIDA.indexOf('export function FrenteALosRangos'), COMIDA.indexOf('export function FilaDeItem'));
  assert.doesNotMatch(pieza, /error|exito|peligro/);
  const estilo = ESTILOS.slice(ESTILOS.indexOf('.frente-a-los-rangos {'), ESTILOS.indexOf('/* NUP-06'));
  assert.doesNotMatch(estilo, /--error|--exito|--peligro/);
  // Un solo cuadro del rango por editor, que abren la lista, cada comida y el asistente.
  assert.equal(EDITOR.match(/<CuadroDelRangoIndicado /g)?.length, 1);
  assert.doesNotMatch(DEL_PLAN.slice(DEL_PLAN.indexOf('export function RangosIndicados'), DEL_PLAN.indexOf('export function CuadroDelRangoIndicado')), /<CuadroDelRango\b/);
  // Abierta la comida, su encabezado ya dice el rango: abajo va el botón para indicarlo o cambiarlo.
  assert.match(COMIDA, /<RangoEnUnRenglon de=\{plegada\.titulo\} rango=\{rango\} soloElBoton \/>/);
  // En el asistente: el día (paso 3) y cada comida (pasos 4 y 5).
  assert.equal(PASOS.match(/<RangoEnUnRenglon /g)?.length, 3);
  assert.match(EDITOR, /rangoDe=\{rangoParaIndicar\}/);
});

test('NUP-06 · la suma de los rangos va arriba de las comidas, en el editor y en el paso 4, y se separa de las opciones', () => {
  const comidas = EDITOR.slice(EDITOR.indexOf('<div className="comidas-del-plan comidas-del-editor"'));
  assert.ok(comidas.indexOf('<SumaDeLosRangosIndicados') >= 0 && comidas.indexOf('<SumaDeLosRangosIndicados') < comidas.indexOf('{dia.meals.map((m, j) => ('), 'arriba de las comidas');
  assert.match(PASOS, /<SumaDeLosRangosIndicados comidas=\{dia\.meals\.map/);
  assert.match(P.COPY_PLANIFICACION.sumaAyuda, /otra cuenta que «Rangos y totales»/);
  assert.match(PIEZAS, /<p className="nota">\{C\.sumaAyuda\}<\/p>/);
});

test('NUP-07 y NUP-10 · el objetivo: las kcal de los gramos al escribir y en lo vigente; los macros alineados arriba', () => {
  assert.match(FORMULARIOS, /<div className="fila-de-dato fila-de-dato--arriba">/);
  assert.match(ESTILOS, /\.fila-de-dato--arriba \{\n\s*align-items: flex-start;\n\}/);
  assert.match(FORMULARIOS, /<KcalDelObjetivo kcal=\{numeroPositivo\(valores\.kcal\)\} gramos=\{\{ protein: numeroNoNegativo\(valores\.proteina\), carbohydrate: numeroNoNegativo\(valores\.carbohidratos\), fat: numeroNoNegativo\(valores\.grasas\) \}\} \/>/);
  // En el editor, en dos renglones: las comidas siguen a la vista.
  assert.match(EDITOR, /<KcalDelObjetivo kcal=\{objetivo\.estimatedEnergyRequirement\.value\} gramos=\{gramosDelObjetivo\(objetivo\)\} compacto \/>/);
  assert.equal(P.porcentajeEnUnaParte('protein', 79, 1750), 'Proteínas 79 g · 18 % de las kcal');
  assert.match(PASOS, /<KcalDelObjetivo kcal=\{objetivo\.estimatedEnergyRequirement\.value\} gramos=\{gramosDelObjetivo\(objetivo\)\} \/>/);
  // El aviso no bloquea: el formulario no lo cuenta como error.
  assert.doesNotMatch(FORMULARIOS.slice(FORMULARIOS.indexOf('export function erroresDeObjetivo'), FORMULARIOS.indexOf('export function aObjetivo')), /kcalDeLosGramos|noCoinciden/);
});

test('NUP-12, NUP-13 y NUP-14 · la comida vacía dice por dónde empezar; el paso 5 ofrece las cuatro formas; «Corregirlo en el plan»', () => {
  assert.equal(P.comidaVacia({ options: [{ label: 'Opción 1', items: [] }] }), true);
  assert.equal(P.comidaVacia({ options: [] }), true);
  assert.equal(P.comidaVacia({ options: [{ label: 'Budín', items: [], recipeVersionId: 'rv1' }] }), false);
  assert.equal(P.comidaVacia({ options: [{ label: 'A', items: [] }, { label: 'B', items: [{ catalogItemId: 'x' }] }] }), false);
  assert.match(COMIDA, /\{vacia \? \(\n\s*<p className="comida-del-editor__empeza" data-empeza-con>/);
  for (const t of ['unaHabitual', 'copiarDeOtra', 'unaReceta', 'alimentos']) assert.match(COMIDA, new RegExp(`texto=\\{CP\\.${t}\\}`), t);
  // Lo que se suma a una comida recién creada ocupa el lugar de su «Opción 1» sin tocar.
  assert.match(EDITOR, /if \(m\.options\.length === 1 && esLaOpcionSinTocar\(m\.options\[0\]!\)\) m\.options\.splice\(0, 1\);/);
  // El paso 5: «+ Opción de receta», «Copiar desde otra comida» y «Usar una comida habitual», con las operaciones de siempre.
  assert.match(PASOS, /data-asistente-opcion-de-receta.*onClick=\{\(\) => onAgregarReceta\(i, j\)\}/);
  assert.match(PASOS, /<BotonConMotivo texto=\{COPY_DE_OTRA_COMIDA\.copiar\}/);
  assert.match(PASOS, /<BotonConMotivo texto=\{COPY_DE_OTRA_COMIDA\.usarHabitual\}/);
  assert.match(EDITOR, /onAgregarReceta=\{\(di, j\) => setEligiendoReceta\(\{ i: di, j \}\)\}/);
  assert.match(EDITOR, /onCopiarDesdeOtra=\{\(di, j\) => setOtraComida\(\{ que: 'copiar', i: di, j \}\)\}/);
  assert.match(EDITOR, /onUsarHabitual=\{\(di, j\) => setOtraComida\(\{ que: 'habitual', i: di, j \}\)\}/);
  // NUP-14: «estación» es jerga del código.
  assert.equal(N.COPY_ASISTENTE_DE_NUTRICION.irEnLaEstacion, 'Corregirlo en el plan');
  const textos = Object.values(N.COPY_ASISTENTE_DE_NUTRICION).map((t) => (typeof t === 'function' ? t('x', 'y') : t));
  for (const t of textos) assert.doesNotMatch(t, /estaci[oó]n/i, t);
  // Y en el armazón común del asistente (los dos editores): «Seguir en el plan», «Corregirlo en el plan» y «Lo que llevás armado».
  const comun = leer('app/pro/advisees/asistente/paso-que-sigue.ts');
  for (const clave of ['seguirEnLaEstacion', 'irEnLaEstacion', 'queEs']) assert.doesNotMatch(comun.match(new RegExp(`${clave}: '[^']*'`))[0], /estaci[oó]n/, clave);
});
