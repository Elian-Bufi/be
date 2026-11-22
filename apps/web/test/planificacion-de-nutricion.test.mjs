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
  // «Sin dato» se escribe igual en las cuatro partes, como en la fila del alimento y en el renglón de la opción (baja de la
  // revisión adversaria: decía «kcal sin dato · P Sin dato»).
  assert.equal(P.loQueAportaLaComida(hueco.comidas[0].rango, 1), 'kcal Sin dato · P Sin dato · C Sin dato · G Sin dato');
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
  assert.equal(sinDato[0].texto, 'Proteínas: sin dato · no se puede ubicar frente al rango de Almuerzo (30 a 40 g)');
  // El día sin dato, igual: «frente al rango del día» (decía «frente del rango»).
  const [diaSinDato] = P.diaFrenteAlRango(R.rangoDelDia([R.rangoDeLaComida([{ nombre: 'A', total: R.totalDeLaOpcion([item('pollo', null)], COMPOSICIONES) }], 'Almuerzo')], ''), rangoIndicado([90, 120]));
  assert.equal(diaSinDato.texto, 'Proteínas del día: sin dato · no se puede ubicar frente al rango del día (90 a 120 g)');
  assert.doesNotMatch(leer('app/pro/advisees/nutrition/planificacion.ts'), /frente del/);
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
  // Sin tope, el objetivo no queda «adentro»: no hay máximo con qué compararlo (revisión adversaria del primer tramo).
  assert.equal(P.filaEnUnaLinea(proteinas), 'Proteínas · desde 65 g · objetivo 112 g · 47 g por encima del mínimo, sin tope para comparar');
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

test('NUP-06 (NUP-D06) · sin tope o sin piso, la suma nunca dice «adentro»: ubica frente al lado que hay', () => {
  // El caso de la captura 06: la Colación sin rango y la Cena sin máximo de grasas. Antes decía «adentro» en las cuatro
  // filas, aunque la suma no tenía techo con qué comparar el objetivo.
  const captura = P.sumaDeLosRangos([
    { nombre: 'Desayuno', rango: rangoIndicado([15, 25], [30, 50], [5, 15]) },
    { nombre: 'Almuerzo', rango: rangoIndicado([30, 40], [40, 70], [10, 20]) },
    { nombre: 'Merienda', rango: rangoIndicado([8, 15], [20, 40], [3, 10]) },
    { nombre: 'Cena', rango: rangoIndicado([25, 35], [30, 60], [8, null]) },
    { nombre: 'Colación', rango: null },
  ]);
  const filas = P.sumaFrenteAlObjetivo(captura, { kcal: 1750, macros: { protein: 79, carbohydrate: 237, fat: 54 } });
  assert.deepEqual(filas.map(P.filaEnUnaLinea), [
    'kcal · desde 1.026 kcal · objetivo 1.750 kcal · 724 kcal por encima del mínimo, sin tope para comparar',
    'Proteínas · desde 78 g · objetivo 79 g · 1 g por encima del mínimo, sin tope para comparar',
    'Carbohidratos · desde 120 g · objetivo 237 g · 117 g por encima del mínimo, sin tope para comparar',
    'Grasas · desde 26 g · objetivo 54 g · 28 g por encima del mínimo, sin tope para comparar',
  ]);
  for (const f of filas) assert.notEqual(f.ubicacion, 'adentro', f.nombre);
  // Sin tope, lo que sí se puede decir: debajo del mínimo, o justo en él.
  const debajo = P.sumaFrenteAlObjetivo(captura, { kcal: 900, macros: { protein: 70, carbohydrate: 120, fat: null } });
  assert.deepEqual(debajo.map((f) => f.ubicacion), ['126 kcal por debajo del mínimo', '8 g por debajo del mínimo', 'en el mínimo, sin tope para comparar', null]);

  // Sin piso (ninguna comida indica un mínimo): el cero de los mínimos vacíos no es un piso indicado.
  const sinPiso = P.sumaDeLosRangos([
    { nombre: 'Desayuno', rango: rangoIndicado(null, null, [null, 30]) },
    { nombre: 'Almuerzo', rango: rangoIndicado(null, null, [null, 45]) },
  ]);
  const grasas = (g) => P.filaEnUnaLinea(P.sumaFrenteAlObjetivo(sinPiso, { kcal: 2000, macros: { protein: null, carbohydrate: null, fat: g } })[3]);
  assert.equal(grasas(54), 'Grasas · hasta 75 g · objetivo 54 g · 21 g por debajo del máximo, sin mínimo para comparar');
  assert.equal(grasas(75), 'Grasas · hasta 75 g · objetivo 75 g · en el máximo, sin mínimo para comparar');
  assert.equal(grasas(80), 'Grasas · hasta 75 g · objetivo 80 g · 5 g por encima del máximo');
  // Ni piso ni tope: no hay con qué comparar.
  const nada = P.sumaDeLosRangos([
    { nombre: 'Desayuno', rango: rangoIndicado(null, null, [null, 30]) },
    { nombre: 'Cena', rango: null },
  ]);
  assert.equal(P.filaEnUnaLinea(P.sumaFrenteAlObjetivo(nada, { kcal: 2000, macros: { protein: null, carbohydrate: null, fat: 54 } })[3]), 'Grasas · sin mínimo ni tope · objetivo 54 g · sin mínimo ni tope para comparar');
  // Con piso y tope sigue siendo «adentro»; y las kcal se comparan enteras, como se muestran: nunca «0 kcal por encima».
  const completa = P.sumaDeLosRangos([{ nombre: 'Almuerzo', rango: rangoIndicado([40, 55], [60, 80], [20, 30]) }]);
  const kcal = (k) => P.sumaFrenteAlObjetivo(completa, { kcal: k, macros: { protein: 50, carbohydrate: null, fat: null } });
  assert.deepEqual([completa.kcal.min, completa.kcal.max], [580, 810]);
  assert.equal(kcal(800)[1].ubicacion, 'adentro');
  assert.equal(kcal(810.4)[0].ubicacion, 'adentro');
  assert.equal(kcal(810.6)[0].ubicacion, '1 kcal por encima del máximo');
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

/**
 * NUP-D11: un «%» del website del profesional va con su base y el número de la base: «de las 2.500 kcal» (o la expresión
 * que lo escribe). «De las kcal» no dice de cuáles cuando los gramos no suman las kcal indicadas (revisión adversaria del
 * primer tramo).
 */
const porcentajeSinSuBase = (t) => /%(?!\s*de\s+l[ao]s?(?:\s+\d|\s*\$\{|\s*$))/.test(t);

test('NUP-08 (NUP-D11) · los textos de la planificación no califican, y cada «%» dice su base', () => {
  const fuente = leer('app/pro/advisees/nutrition/planificacion.ts');
  const textos = [...fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').matchAll(/'[^'\n]*'|`[^`\n]*`/g)].map((m) => m[0]);
  assert.ok(textos.length > 30);
  for (const t of textos) {
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|óptim|excelente|\bmal\b|\bbien\b/i, t);
    assert.equal(porcentajeSinSuBase(t), false, t);
  }
  // La prueba de la prueba: un porcentaje sin base, o con la base sin su número, se detecta.
  assert.equal(porcentajeSinSuBase('Registró el 82 % del plan'), true);
  assert.equal(porcentajeSinSuBase('Proteínas 112 g · 18 % de las kcal'), true);
  assert.equal(porcentajeSinSuBase('Registró el 82 % de los días'), true);
  assert.equal(porcentajeSinSuBase('18 % de las 2.500 kcal'), false);
  assert.equal(porcentajeSinSuBase('`${p} % de las ${numero(kcal, 0)} kcal`'), false);
  // Cada parte del renglón compacto dice su base con su número, también cuando los gramos no suman las kcal indicadas.
  const partes = ['protein', 'carbohydrate', 'fat'].map((m) => P.porcentajeEnUnaParte(m, { protein: 112, carbohydrate: 80, fat: 335 }[m], 2500));
  assert.deepEqual(partes, ['Proteínas 112 g · 18 % de las 2.500 kcal', 'Carbohidratos 80 g · 13 % de las 2.500 kcal', 'Grasas 335 g · 121 % de las 2.500 kcal']);
  for (const p of partes) assert.equal(porcentajeSinSuBase(p), false, p);
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
  assert.match(formulario, /if \(destino === null\) return;\n\s*\/\/[^\n]*\n\s*if \(enfocarLoQueFalta\(enOrden\[destino\]!\)\) evento\.preventDefault\(\);\n\}/, 'solo se frena el envío cuando hay a dónde ir y el foco llegó');
  for (const ruta of ['app/pro/advisees/nutrition/formularios.tsx', 'app/pro/advisees/nutrition/revisiones.tsx', 'app/pro/advisees/training/revisiones.tsx', 'app/pro/recipes/editor-de-receta.tsx', 'app/pro/solicitar-vinculo.tsx']) {
    const fuente = leer(ruta);
    const formularios = fuente.split('\n').filter((l) => l.includes('<form ') && l.includes('onBlur={avisos.alSalir}'));
    assert.ok(formularios.length > 0, ruta);
    for (const f of formularios) assert.match(f, /onKeyDown=\{avisos\.alEnter\}/, `${ruta}: ${f}`);
  }
  // DL-180: «Crear a mano» usa el formulario común del alimento (el mismo de «Corregir»), con el mismo Enter.
  assert.match(leer('app/pro/advisees/nutrition/formulario-del-alimento.tsx'), /<form .*onKeyDown=\{\(e\) => enterAlQueFalta\(e, loQueFalta\(\)\)\}/);
  assert.match(leer('app/pro/advisees/nutrition/agregar-item.tsx'), /<FormularioDelAlimento\n/);
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
const PIEZAS = leer('app/pro/advisees/nutrition/suma-de-los-rangos.tsx');
const DEL_PLAN = leer('app/pro/advisees/nutrition/rangos-indicados-del-plan.tsx');
const FORMULARIOS = leer('app/pro/advisees/nutrition/formularios.tsx');
const ESTILOS = leer('app/globals.css');

test('NUP-01 · la fila de cada alimento dice lo que aporta con su cantidad, en vivo, y la pista con el mouse o el foco', () => {
  // Se calcula con la cantidad del ítem, que el campo propaga con cada tecla: cambia mientras se escriben los gramos.
  assert.match(COMIDA, /const aporte = aporteDelItem\(\{ catalogItemId: item\.catalogItemId, quantity: magnitud, nombre \}, composicion\);/);
  assert.match(COMIDA, /setEscrito\(e\.target\.value\);\n\s*const n = leerNumero\(e\.target\.value\);[\s\S]{0,400}onCambiar\(conNumero\(item, n \?\? Number\.NaN, ml\)\)/);
  // Debajo del nombre, con la pista al pasar el mouse; y la misma pista con el foco en la cantidad.
  // DL-180: antes del nombre, el ícono de su grupo (NUA-05); después, la marca de retirado si corresponde (NUA-02).
  assert.match(COMIDA, /<th scope="row" className="item-del-editor__nombre">\n\s*<span className="item-del-editor__grupo"[\s\S]{0,200}\n\s*\{nombre\}[\s\S]{0,500}<Pista texto=\{pista\}>\n\s*<span className="item-del-editor__aporte" data-aporte-del-item>/);
  assert.match(COMIDA, /<Pista texto=\{pista\}>\n\s*<input\n\s*id=\{`\$\{id\}-cantidad`\}/);
  // La comida del editor y el cuadro de la opción le pasan la composición y el origen de cada alimento.
  assert.match(COMIDA, /composicion=\{composiciones\.get\(it\.catalogItemId\)\}\n\s*origen=\{origenes\.get\(it\.catalogItemId\) \?\? null\}/);
  assert.match(CUADRO, /composicion=\{todasLasComposiciones\.get\(it\.catalogItemId\)\}\n\s*origen=\{todosLosOrigenes\.get\(it\.catalogItemId\) \?\? null\}/);
  // De dónde sale: de los habituales, de lo que se leyó por su identidad (DL-180, API-ALI-04) y de lo que se sumó en el cuadro.
  assert.match(EDITOR, /setOrigenes\(\(m\) => new Map\(\[\.\.\.m, \.\.\.\[\.\.\.porId\.values\(\)\]\.map\(\(e\) => \[e\.catalogItemId, origenBreve\(e\)\] as const\)\]\)\);/);
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

test('NUP-04 y NUP-05 · frente a los rangos, en la opción y en el cuadro; el rango se indica donde se arma', () => {
  // RP-20 (DL-188): las líneas de la opción pasaron a ser franjas (franjas-por-comida.test.mjs); en el cuadro, el día
  // frente a su rango sigue en líneas.
  assert.match(COMIDA, /<FranjasDeLaComida franjas=\{franjasDeLaOpcion\} comida=\{plegada\.titulo\} variante="opcion" \/>/);
  assert.match(CUADRO, /<FrenteALosRangos lineas=\{frenteDelDia\} titulo=\{COPY_FRANJAS\.elDiaFrenteAlSuyo\} \/>/);
  // Ubica, no califica: la pieza no usa los colores de error ni de éxito.
  const pieza = COMIDA.slice(COMIDA.indexOf('export function FrenteALosRangos'), COMIDA.indexOf('export function FilaDeItem'));
  assert.doesNotMatch(pieza, /error|exito|peligro/);
  const estilo = ESTILOS.slice(ESTILOS.indexOf('.frente-a-los-rangos {'), ESTILOS.indexOf('/* NUP-06'));
  assert.doesNotMatch(estilo, /--error|--exito|--peligro/);
  // Un solo cuadro del rango por editor, que abren la lista y cada comida.
  assert.equal(EDITOR.match(/<CuadroDelRangoIndicado /g)?.length, 1);
  assert.doesNotMatch(DEL_PLAN.slice(DEL_PLAN.indexOf('export function RangosIndicados'), DEL_PLAN.indexOf('export function CuadroDelRangoIndicado')), /<CuadroDelRango\b/);
  // Abierta la comida, su encabezado ya dice el rango: abajo va el botón para indicarlo o cambiarlo.
  assert.match(COMIDA, /<RangoEnUnRenglon de=\{plegada\.titulo\} rango=\{rango\} soloElBoton \/>/);
  // Cada comida del editor lo recibe de `rangoParaIndicar` (los pasos 3 a 5 del asistente, que también lo usaban, se
  // retiraron con DL-193).
  assert.match(EDITOR, /rango=\{\{ \.\.\.rangoParaIndicar\(i, j\),/);
});

test('NUP-06 · la suma de los rangos: en el editor, su chequeo va en el reparto (RP-19)', () => {
  // RP-19 (DL-188, pedido de Dirección del 22/11): arriba de las comidas del editor aparecía de golpe al proponer y corría
  // toda la pantalla. Su chequeo es una línea del «Reparto por comida», con la tabla detrás de un «?».
  assert.doesNotMatch(EDITOR, /<SumaDeLosRangosIndicados/);
  assert.match(leer('app/pro/advisees/nutrition/propuesta-de-rangos-del-plan.tsx'), /<SumaDeLosRangosIndicados comidas=\{comidasConRango\} objetivo=\{objetivo\} enDetalle \/>/);
  assert.match(P.COPY_PLANIFICACION.sumaAyuda, /otra cuenta que «Rangos y totales»/);
  assert.match(PIEZAS, /<p className="nota">\{C\.sumaAyuda\}<\/p>/);
});

test('NUP-07 y NUP-10 · el objetivo: las kcal de los gramos al escribir y en lo vigente; los macros alineados arriba', () => {
  assert.match(FORMULARIOS, /<div className="fila-de-dato fila-de-dato--arriba">/);
  assert.match(ESTILOS, /\.fila-de-dato--arriba \{\n\s*align-items: flex-start;\n\}/);
  assert.match(FORMULARIOS, /<KcalDelObjetivo kcal=\{numeroPositivo\(valores\.kcal\)\} gramos=\{\{ protein: numeroNoNegativo\(valores\.proteina\), carbohydrate: numeroNoNegativo\(valores\.carbohidratos\), fat: numeroNoNegativo\(valores\.grasas\) \}\} \/>/);
  // En el editor, en dos renglones: las comidas siguen a la vista. Un objetivo viejo en proporción de las kcal lo dice
  // (SAN-04: antes, solo en el paso 2 del asistente).
  assert.match(EDITOR, /<KcalDelObjetivo kcal=\{objetivo\.estimatedEnergyRequirement\.value\} gramos=\{gramosDelObjetivo\(objetivo\)\} enProporcion=\{macrosEnProporcion\(objetivo\)\} compacto \/>/);
  assert.equal(P.porcentajeEnUnaParte('protein', 79, 1750), 'Proteínas 79 g · 18 % de las 1.750 kcal');
  // El aviso no bloquea: el formulario no lo cuenta como error.
  assert.doesNotMatch(FORMULARIOS.slice(FORMULARIOS.indexOf('export function erroresDeObjetivo'), FORMULARIOS.indexOf('export function aObjetivo')), /kcalDeLosGramos|noCoinciden/);
});

test('NUP-12, NUP-13 y NUP-14 · la comida vacía dice por dónde empezar; la comida del editor ofrece las cuatro formas; «Corregirlo en el plan»', () => {
  assert.equal(P.comidaVacia({ options: [{ label: 'Opción 1', items: [] }] }), true);
  assert.equal(P.comidaVacia({ options: [] }), true);
  assert.equal(P.comidaVacia({ options: [{ label: 'Budín', items: [], recipeVersionId: 'rv1' }] }), false);
  assert.equal(P.comidaVacia({ options: [{ label: 'A', items: [] }, { label: 'B', items: [{ catalogItemId: 'x' }] }] }), false);
  assert.match(COMIDA, /\{vacia \? \(\n\s*<p className="comida-del-editor__empeza" data-empeza-con>/);
  for (const t of ['unaHabitual', 'copiarDeOtra', 'unaReceta', 'alimentos']) assert.match(COMIDA, new RegExp(`texto=\\{CP\\.${t}\\}`), t);
  // Lo que se suma a una comida recién creada ocupa el lugar de su «Opción 1» sin tocar.
  assert.match(EDITOR, /const k = opcionesQueSiguen\(estructura\[di\]\?\.meals\[j\]\?\.options \?\? \[\]\);/);
  assert.match(EDITOR, /m\.options\.splice\(opcionesQueSiguen\(m\.options\)\);/);
  // «+ Opción de receta», «Copiar desde otra comida» y «Usar una comida habitual», en cada comida del editor (el paso 5
  // del asistente las repetía; se retiró con DL-193).
  assert.match(EDITOR, /alCopiarDesdeOtra=\{\(\) => setOtraComida\(\{ que: 'copiar', i, j \}\)\}/);
  assert.match(EDITOR, /alUsarHabitual=\{\(\) => setOtraComida\(\{ que: 'habitual', i, j \}\)\}/);
  assert.match(EDITOR, /alAgregarReceta=\{\(\) => setEligiendoReceta\(\{ i, j \}\)\}/);
  // NUP-14: «estación» es jerga del código. En el armazón del asistente de Entrenamiento (que compartía el de Nutrición),
  // «Seguir en el plan», «Corregirlo en el plan» y «Lo que llevás armado».
  const comun = leer('app/pro/advisees/asistente/paso-que-sigue.ts');
  for (const clave of ['seguirEnLaEstacion', 'irEnLaEstacion', 'queEs']) assert.doesNotMatch(comun.match(new RegExp(`${clave}: '[^']*'`))[0], /estaci[oó]n/, clave);
});

test('NUP-11 (NUP-D10) · en el cuadro de la opción, lo escrito en «Crearlo a mano» o «Importarlo…» no se pierde al tocar afuera', () => {
  // Esos formularios viven adentro del cuadro y no son parte de la opción: sin esto, un toque en el fondo (o Escape)
  // cerraba sin preguntar y se perdía el alimento a medio cargar (revisión adversaria del primer tramo).
  assert.match(CUADRO, /conCambios=\{Boolean\(opcion && copia && cambioLaOpcion\(opcion, copia\)\) \|\| \(modo !== 'opcion' && escritoAparte\)\}/);
  assert.match(CUADRO, /<CrearManualmente [^\n]*alEscribir=\{anotarLoEscrito\}/);
  assert.match(CUADRO, /\{copia && modo === 'importar' \? \(\n\s*<div className="agregar-item__otro" onInput=\{anotarLoEscrito\}>/);
  // Al volver a la opción o al abrir de nuevo, lo de aquel formulario ya quedó atrás.
  assert.match(CUADRO, /useEffect\(\(\) => setEscritoAparte\(false\), \[modo, abierto\]\);/);
  assert.match(leer('app/pro/advisees/nutrition/formulario-del-alimento.tsx'), /<form className="agregar-item__otro formulario-del-alimento" [^\n]*onInput=\{alEscribir\}/);
  assert.match(leer('app/pro/advisees/nutrition/agregar-item.tsx'), /alEscribir=\{\(\) => \{\n\s*setIgual\(null\);\n\s*alEscribir\?\.\(\);/);
});

// ─── Las bajas de la revisión adversaria del primer tramo (19/11) ───────────────────────────────────────────────

const RP = await import('../src/app/pro/advisees/nutrition/receta-en-el-plan.ts');
const X = await import('../src/app/pro/advisees/editar-la-estructura.ts');
const O = await import('../src/app/pro/advisees/nutrition/opcion-de-otra-comida.ts');
const ENFOCADO = leer('components/cuadro-enfocado.tsx');
const DIALOGO = leer('components/dialogo.tsx');

test('NUP-04 · en el cuadro, una opción nueva todavía vacía no muestra una línea «sin dato» por macro: una sola indicación', async () => {
  assert.match(CUADRO, /const sinAlimentos = copia !== null && copia\.items\.length === 0 && !copia\.recipeVersionId;/);
  // RP-20 (DL-188): la franja de la opción vacía dice una sola indicación (la misma de antes), y el día no se ubica.
  assert.match(CUADRO, /const frenteDelDia = total && rango && !sinAlimentos \?/);
  const FR = await import('../src/app/pro/advisees/nutrition/franjas-por-comida.ts');
  assert.equal(FR.COPY_FRANJAS.sinAlimentosLaOpcion, P.COPY_PLANIFICACION.frenteSinAlimentos);
  const pieza = COMIDA.slice(COMIDA.indexOf('export function FrenteALosRangos'), COMIDA.indexOf('export function FilaDeItem'));
  assert.match(pieza, /\{sinAlimentos \? \(\n\s*<p className="nota" data-frente-sin-alimentos>\n\s*\{CP\.frenteSinAlimentos\}/);
  assert.equal(P.COPY_PLANIFICACION.frenteSinAlimentos, 'Todavía no tiene alimentos: se ubica cuando sumes el primero.');
  // La comida del editor ya esperaba a que la opción tuviera algo.
  assert.match(COMIDA, /const conAlgo = !!opcion && \(opcion\.items\.length > 0 \|\| !!opcion\.recipeVersionId\);/);
});

test('NUP-12 · en una comida recién creada, la «Opción 1» sin tocar deja su lugar también en el número de la copia y en los lugares libres', () => {
  const sinTocar = { label: RP.OPCION_INICIAL, items: [] };
  const conAlgo = { label: 'Arroz', items: [itemDelPlan('arroz', 100)] };
  assert.equal(RP.opcionesQueSiguen([sinTocar]), 0, 'lo que se suma queda como opción 1');
  assert.equal(RP.opcionesQueSiguen([conAlgo]), 1);
  assert.equal(RP.opcionesQueSiguen([sinTocar, conAlgo]), 2, 'con otra opción, la «Opción 1» vacía no se toca');
  assert.equal(RP.opcionesQueSiguen([{ ...sinTocar, label: 'Desayuno liviano' }]), 1, 'con otro nombre, ya la tocaron');
  assert.equal(RP.opcionesQueSiguen([]), 0);
  // «Copiar a Almuerzo como opción N» dice el número que va a tener (decía 2 y quedaba como opción 1).
  assert.equal(O.COPY_DE_OTRA_COMIDA.principalCopiar('Almuerzo', RP.opcionesQueSiguen([sinTocar]) + 1), 'Copiar a Almuerzo como opción 1');
  assert.match(EDITOR, /numeroDeLaNueva=\{opcionesQueSiguen\(\(otraComida \? estructura\[otraComida\.i\]\?\.meals\[otraComida\.j\]\?\.options : undefined\) \?\? \[\]\) \+ 1\}/);
  // Una habitual de doce opciones entra entera en una comida recién creada (antes quedaba una afuera).
  const doce = { name: 'Doce', structure: { options: Array.from({ length: 12 }, (_, k) => ({ label: `O${k + 1}`, items: [] })) } };
  assert.equal(O.opcionesDeLaHabitual(doce, O.MAXIMO_DE_OPCIONES - RP.opcionesQueSiguen([sinTocar])).quedanAfuera, 0);
  assert.match(EDITOR, /opcionesDeLaHabitual\(h, MAXIMO_DE_OPCIONES - opcionesQueSiguen\(m\.options\)\)/);
  // La receta, con la misma cuenta.
  assert.deepEqual(RP.opcionesConLaReceta([sinTocar], { recipeVersionId: 'rv1', name: 'Budín' }), { opciones: [{ label: 'Budín', items: [], recipeVersionId: 'rv1' }], k: 0 });
  assert.equal(RP.opcionesConLaReceta([conAlgo], { recipeVersionId: 'rv1', name: 'Budín' }).k, 1);
});

test('NUP-D04 · al subir o bajar una comida, cada una conserva su opción abierta, y la que estaba plegada sigue plegada', () => {
  // Día 0: la comida 1 tiene abierta su opción 3 (k = 2); la 2, de varias opciones, nunca se eligió (plegada). Se baja la 1.
  assert.deepEqual(X.elegidasTrasMover({ '0-1': 2 }, 0, 1, 2), { '0-2': 2 });
  // Se sube la plegada: sigue sin elegida (antes quedaba con la primera abierta), y la otra lleva la suya.
  assert.deepEqual(X.elegidasTrasMover({ '0-1': 2 }, 0, 2, 1), { '0-2': 2 });
  // Una plegada a propósito (-1) y una abierta se intercambian.
  assert.deepEqual(X.elegidasTrasMover({ '0-0': -1, '0-1': 0 }, 0, 0, 1), { '0-1': -1, '0-0': 0 });
  // Los otros días no cambian, y no toca lo que recibe.
  const antes = { '0-1': 2, '1-1': 3, '1-2': 0 };
  assert.deepEqual(X.elegidasTrasMover(antes, 0, 1, 0), { '0-0': 2, '1-1': 3, '1-2': 0 });
  assert.deepEqual(antes, { '0-1': 2, '1-1': 3, '1-2': 0 });
  assert.match(EDITOR, /setPestanas\(\(p\) => elegidasTrasMover\(p, i, j, hacia\)\);/);
  assert.doesNotMatch(EDITOR, /\?\? 0, \[`\$\{i\}-\$\{j\}`\]/, 'mover no elige la primera opción');
});

test('NUP-09 · Enter: si el campo que falta no puede recibir el foco, envía como siempre en vez de no hacer nada', () => {
  const documento = { activeElement: null };
  const campo = (recibe) => {
    const e = { ownerDocument: documento, matches: () => true, querySelector: () => null, focus: () => void (recibe && (documento.activeElement = e)) };
    return e;
  };
  const grupo = (adentro) => ({ ownerDocument: documento, matches: () => false, querySelector: () => adentro, focus: () => undefined });
  assert.equal(V.enfocarLoQueFalta(campo(true)), true, 'el foco llega: Enter no envía');
  documento.activeElement = null;
  assert.equal(V.enfocarLoQueFalta(campo(false)), false, 'apagado o escondido: Enter envía como siempre');
  const adentro = campo(true);
  assert.equal(V.enfocarLoQueFalta(grupo(adentro)), true);
  assert.equal(documento.activeElement, adentro, 'en un grupo, al primero de adentro');
  documento.activeElement = null;
  assert.equal(V.enfocarLoQueFalta(grupo(null)), false, 'un grupo sin nada que reciba el foco');
});

test('NUP-11 · «Seguir editando» devuelve el foco adonde se estaba, en el diálogo de confirmación y en el cuadro enfocado', () => {
  const adentro = new Set();
  const cuadro = { contains: (e) => adentro.has(e) };
  const campo = { isConnected: true };
  const titulo = { isConnected: true };
  adentro.add(campo).add(titulo);
  assert.equal(T.dondeSigueElFoco(cuadro, campo, titulo), campo, 'al campo donde se estaba');
  assert.equal(T.dondeSigueElFoco(cuadro, { isConnected: false }, titulo), titulo, 'si ya no está, al título');
  assert.equal(T.dondeSigueElFoco(cuadro, { isConnected: true }, titulo), titulo, 'si quedó fuera del cuadro, al título');
  assert.equal(T.dondeSigueElFoco(cuadro, null, titulo), titulo);
  // La pieza común anota dónde se estaba (no la pregunta ni lo que pide cerrar) y vuelve ahí cuando la pregunta se va.
  const pieza = leer('components/tocar-afuera.ts');
  assert.match(pieza, /if \(t !== e\.currentTarget && t instanceof HTMLElement && !t\.closest\(NO_ES_DONDE_SE_ESTABA\)\) ultimo\.current = t;/);
  assert.match(pieza, /if \(preguntando \|\| !volver\.current\) return;\n\s*volver\.current = false;\n\s*dondeSigueElFoco<HTMLElement>\(cuadro\.current, ultimo\.current, siNo\(\)\)\?\.focus\(\);/);
  assert.equal(T.NO_ES_DONDE_SE_ESTABA, '[data-pregunta-al-cerrar], [data-pide-cerrar]');
  for (const [nombre, fuente, uso, boton] of [
    ['el diálogo', DIALOGO, 'seguirEditando', 'seguir'],
    ['el cuadro enfocado', ENFOCADO, 'seguir', 'seguirRef'],
  ]) {
    assert.match(fuente, new RegExp(`onFocus=\\{${uso}\\.alEnfocar\\}`), nombre);
    assert.match(fuente, new RegExp(`<button ref=\\{${boton}\\} type="button" className="boton boton--secundario" onClick=\\{\\(\\) => ${uso}\\.seguir\\(\\(\\) => setPreguntando\\(false\\)\\)\\}>`), nombre);
    assert.doesNotMatch(fuente, /onClick=\{\(\) => setPreguntando\(false\)\}/, `${nombre}: sin volver, el foco quedaba en el documento`);
  }
  assert.match(ENFOCADO, /useSeguirEditando\(ref, \(\) => tituloRef\.current, preguntando\)/);
  assert.match(DIALOGO, /useSeguirEditando\(ref, \(\) => ref\.current\?\.querySelector<HTMLElement>\(PRIMER_CONTROL\) \?\? null, preguntando\)/);
  // «Cerrar» y «Cancelar» piden cerrar: no son «donde se estaba»; la pregunta, tampoco.
  assert.equal(ENFOCADO.match(/ data-pide-cerrar>/g)?.length, 2);
  assert.match(ENFOCADO, /role="alertdialog" [^\n]*data-pregunta-al-cerrar>/);
  assert.match(DIALOGO, /role="alertdialog" [^\n]*data-pregunta-al-cerrar>/);
});

test('NUP-07 · un objetivo viejo con macros en proporción de las kcal: el paso 2 no dice «con los tres macros escritos»', () => {
  const viejo = { estimatedEnergyRequirement: { value: 2300 }, macronutrientDistribution: { protein: { value: 0.25, unit: 'energy_share' }, carbohydrate: { value: 240, unit: 'g/day' }, fat: { value: 0.3, unit: 'energy_share' } } };
  assert.deepEqual(P.macrosEnProporcion(viejo), ['protein', 'fat']);
  assert.equal(P.kcalDeLosGramos(P.gramosDelObjetivo(viejo), 2300), null, 'no hay gramos que sumar');
  assert.equal(P.sinLasKcalDeLosGramos(P.macrosEnProporcion(viejo)), 'El objetivo tiene Proteínas y Grasas en proporción de las kcal, no en gramos: no hay gramos que sumar.');
  assert.equal(P.sinLasKcalDeLosGramos(['carbohydrate']), 'El objetivo tiene Carbohidratos en proporción de las kcal, no en gramos: no hay gramos que sumar.');
  assert.equal(P.sinLasKcalDeLosGramos(['protein', 'carbohydrate', 'fat']), 'El objetivo tiene Proteínas, Carbohidratos y Grasas en proporción de las kcal, no en gramos: no hay gramos que sumar.');
  // En gramos (lo que se escribe hoy), mientras falte un macro, sigue diciendo qué se va a ver.
  const enGramos = { ...viejo, macronutrientDistribution: { protein: { value: 112, unit: 'g/day' }, carbohydrate: { value: 80, unit: 'g/day' }, fat: { value: 335, unit: 'g/day' } } };
  assert.deepEqual(P.macrosEnProporcion(enGramos), []);
  assert.equal(P.sinLasKcalDeLosGramos([]), 'Con los tres macros escritos se ve cuántas kcal suman, con 4, 4 y 9 kcal por gramo.');
  assert.match(PIEZAS, /<p className="nota kcal-del-objetivo" data-kcal-del-objetivo>\n\s*\{sinLasKcalDeLosGramos\(enProporcion\)\}/);
  for (const t of [P.sinLasKcalDeLosGramos(['protein', 'fat']), P.sinLasKcalDeLosGramos([])]) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.equal(porcentajeSinSuBase(t), false, t);
  }
});

test('La suma de los rangos: el número no se separa de su unidad; y los comentarios del «%», al día', () => {
  // «desde 1.026 kcal» se partía en dos renglones con la columna principal angosta: la suma y el objetivo no se cortan,
  // y la ubicación (texto) es la que se acomoda.
  assert.match(PIEZAS, /<td className="suma-de-los-rangos__cifra">\{f\.suma\}<\/td>/);
  assert.match(PIEZAS, /<td className="suma-de-los-rangos__cifra">\{f\.objetivoCifra \?\? '—'\}<\/td>/);
  assert.match(ESTILOS, /\.suma-de-los-rangos__cifra \{\n\s*white-space: nowrap;\n\}/);
  // Nutrición ya muestra el «%» con su base (NUP-D11): los comentarios que decían lo contrario se actualizaron.
  assert.doesNotMatch(leer('app/pro/advisees/nutrition/rangos.ts'), /Sin «%»/);
});
