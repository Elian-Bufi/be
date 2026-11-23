/**
 * RP-20 y RP-21 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Las franjas por comida y «Rangos y totales», sin React: dónde va
 * cada marca, adentro o afuera, el promedio, cuántas quedan adentro, lo que se fija al borde, sin rango, sin alimentos,
 * lo que se está leyendo, el día, la receta que se elige y lo que dice la pantalla.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const F = await import('../src/app/pro/advisees/nutrition/franjas-por-comida.ts');
const d = await import('@be/domain');
const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8');

/** Un rango indicado en gramos: [min, max] por macro; `null` deja el macro sin rango. */
const rango = (p, c, g) => {
  const m = (x) => (x ? { unit: 'g', perKg: null, grams: { min: x[0], max: x[1] } } : undefined);
  return Object.fromEntries(Object.entries({ protein: m(p), carbohydrate: m(c), fat: m(g) }).filter(([, v]) => v));
};
/** El total de una opción: kcal, P, C y G como decimales exactos; `null` en uno: «sin dato» por `motivo`. */
const total = (k, p, c, g, motivo = 'SIN_CANTIDAD') => {
  const v = (x) => (x === null ? { exacto: null, faltan: [{ donde: '', nombre: 'Arroz', motivo }] } : { exacto: String(x), faltan: [] });
  return { energyKcal: v(k), proteinG: v(p), carbohydrateG: v(c), fatG: v(g) };
};
const vacia = () => total(null, null, null, null, 'SIN_ALIMENTOS');
const opcion = (clave, t, nombre = clave) => ({ clave, nombre, total: t });
const ALMUERZO = rango([25, 31], [60, 74], [15, 19]);
const renglon = (f, r) => f.renglones.find((x) => x.renglon === r);

test('RP-20 · los límites de cada renglón: los gramos de P, C y G y las kcal que implican, con 4, 4 y 9', () => {
  assert.deepEqual(F.limitesDelRenglon(ALMUERZO, 'protein'), { min: 25, max: 31 });
  // 25 × 4 + 60 × 4 + 15 × 9 = 475; 31 × 4 + 74 × 4 + 19 × 9 = 591.
  assert.deepEqual(F.limitesDelRenglon(ALMUERZO, 'kcal'), { min: 475, max: 591 });
  // Un macro sin máximo: las kcal no tienen tope; sin mínimo, cuenta como cero.
  assert.deepEqual(F.limitesDelRenglon(rango([25, 31], [60, 74], [null, 19]), 'kcal'), { min: 340, max: 591 });
  assert.deepEqual(F.limitesDelRenglon(rango([25, 31], [60, null], [15, 19]), 'kcal'), { min: 475, max: null });
  // Con un macro sin rango, las kcal no tienen rango: el piso sería el de los otros y casi todo quedaría adentro.
  assert.equal(F.limitesDelRenglon(rango([25, 31], null, null), 'kcal'), null);
  assert.equal(F.limitesDelRenglon(rango([25, 31], null, null), 'fat'), null);
  assert.equal(F.limitesDelRenglon(null, 'protein'), null);
});

test('RP-20 (RP-D42) · la escala va de 0 al doble del centro: con el mismo margen, la banda queda igual en los cuatro renglones', () => {
  const f = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 17))]);
  const bandas = f.renglones.map((r) => r.banda);
  for (const b of bandas) {
    assert.ok(b.desde > 43 && b.desde < 46, `desde ${b.desde}`);
    assert.ok(b.hasta > 54 && b.hasta < 57, `hasta ${b.hasta}`);
    assert.equal(b.sinTope, false);
  }
  assert.equal(F.topeDeLaEscala({ min: 25, max: 31 }), 56);
  // Con un solo lado, ese lado es el centro; sin tope, la banda llega al borde y se desvanece.
  assert.equal(F.topeDeLaEscala({ min: 30, max: null }), 60);
  assert.deepEqual(F.bandaEnLaPista({ min: 30, max: null }, 60), { desde: 50, hasta: 100, sinTope: true });
  assert.deepEqual(F.bandaEnLaPista({ min: null, max: 40 }, 80), { desde: 0, hasta: 50, sinTope: false });
  // Un rango en cero no tiene centro: la escala llega un poco más allá del mayor de los valores.
  assert.equal(F.topeDeLaEscala({ min: 0, max: 0 }, [10]), 11.5);
});

test('RP-20 · cada opción, en su lugar: adentro llena, afuera con su diferencia en gramos o kcal, nunca un «%»', () => {
  const f = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 17), 'Opción 1'), opcion('b', total(610, 34, 70, 18), '2 · Pollo'), opcion('c', total(400, 22.04, 50, 12), 'Opción 3')]);
  const p = renglon(f, 'protein');
  assert.deepEqual(p.marcas.map((m) => [m.clave, m.posicion, m.ubicacion.tipo]), [
    ['a', 50, 'dentro'],
    ['b', 60.7, 'encima'],
    ['c', 39.3, 'debajo'],
  ]);
  assert.equal(p.marcas[1].texto, '2 · Pollo: 34 g P · por encima, 3 g');
  // Los gramos se comparan a un decimal, como se muestran: 22,04 es 22 y queda 3 g por debajo.
  assert.equal(p.marcas[2].texto, 'Opción 3: 22 g P · por debajo, 3 g');
  // Las kcal, enteras y en kcal.
  assert.equal(renglon(f, 'kcal').marcas[1].texto, '2 · Pollo: 610 kcal · por encima, 19 kcal');
  for (const r of f.renglones) {
    assert.doesNotMatch(r.resumen + r.enPalabras, /%/);
    assert.deepEqual(d.terminosProhibidosEn(r.resumen + ' ' + r.enPalabras), [], r.resumen);
  }
});

test('RP-20 · el promedio y el conteo: «1 de 3 adentro · promedio 28 g P» (el lector oye «opciones»); con una sola, su valor y dónde queda', () => {
  const tres = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 17)), opcion('b', total(610, 34, 70, 18)), opcion('c', total(400, 22, 50, 12))]);
  const p = renglon(tres, 'protein');
  assert.equal(p.adentro, 1);
  assert.deepEqual([p.promedio.valor, p.promedio.posicion, p.promedio.ubicacion.tipo], [28, 50, 'dentro']);
  assert.equal(p.resumen, '1 de 3 adentro · promedio 28 g P');
  assert.match(p.enPalabras, /1 de 3 opciones adentro$/);
  // Un promedio afuera dice cuánto.
  const c = renglon(tres, 'carbohydrate');
  assert.equal(c.resumen, '2 de 3 adentro · promedio 61,7 g C');
  const grasas = renglon(F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 24)), opcion('b', total(610, 34, 70, 22))]), 'fat');
  assert.equal(grasas.resumen, '0 de 2 adentro · promedio 23 g G (por encima, 4 g)');
  // Con una sola opción no hay promedio: su valor y dónde queda.
  const una = renglon(F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 34, 65, 17))]), 'protein');
  assert.equal(una.promedio, null);
  assert.equal(una.resumen, '34 g P · por encima, 3 g');
  assert.match(una.enPalabras, /^Proteínas: rango indicado 25 a 31 g P\. a: 34 g P · por encima, 3 g/);
});

test('RP-20 · lo que pasa del borde se fija al borde, con su flecha', () => {
  const f = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(1500, 80, 65, 17)), opcion('b', total(520, 28, 65, 17))]);
  const [lejos] = renglon(f, 'protein').marcas;
  assert.deepEqual([lejos.posicion, lejos.fijada, lejos.ubicacion.tipo], [100, 'derecha', 'encima']);
  assert.equal(renglon(f, 'kcal').marcas[0].fijada, 'derecha');
  assert.deepEqual(F.posicionEnLaPista(30, 56), { posicion: 53.6, fijada: null });
  assert.deepEqual(F.posicionEnLaPista(57, 56), { posicion: 100, fijada: 'derecha' });
});

test('RP-20 · sin rango indicado no se dibuja; un renglón sin rango dice «Sin rango indicado» y no ubica', () => {
  assert.equal(F.franjasDeLaComida(null, [opcion('a', total(520, 28, 65, 17))]), null);
  assert.equal(F.franjasDeLaComida({}, [opcion('a', total(520, 28, 65, 17))]), null);
  const soloProteinas = F.franjasDeLaComida(rango([25, 31], null, null), [opcion('a', total(520, 28, 65, 17)), opcion('b', total(610, 34, 70, 18))]);
  const g = renglon(soloProteinas, 'fat');
  assert.equal(g.banda, null);
  assert.deepEqual(g.marcas, []);
  assert.equal(g.resumen, 'Sin rango indicado · promedio 17,5 g G');
  assert.equal(renglon(soloProteinas, 'kcal').limites, null);
  // El panel la usa igual, por lo que aportan las opciones.
  assert.equal(F.deCuantoACuanto(renglon(F.armarFranjas(null, [opcion('a', total(520, 28, 65, 17)), opcion('b', total(610, 34, 70, 18))]), 'kcal')), '520–610');
  assert.equal(F.deCuantoACuanto(renglon(F.armarFranjas(null, [opcion('a', total(520, 28, 65, 17))]), 'protein')), '28');
});

test('RP-20 · sin opciones con alimentos: una sola indicación neutra, no «Sin dato» por renglón; una sin alimentos no cuenta', () => {
  const f = F.franjasDeLaComida(ALMUERZO, [opcion('a', vacia()), opcion('b', vacia())]);
  assert.equal(f.sinAlimentos, true);
  for (const r of f.renglones) {
    assert.deepEqual(r.marcas, []);
    assert.equal(r.resumen, '');
    assert.ok(r.banda, 'la banda se ve: es a donde apuntar');
  }
  assert.equal(F.franjasEnPalabras(f, 'Merienda'), `Las opciones de Merienda frente a su rango indicado. ${F.COPY_FRANJAS.sinAlimentos}`);
  assert.equal(F.franjasDeLaComida(ALMUERZO, []).sinAlimentos, true);
  // Con una opción armada y otra vacía, la vacía no entra en la cuenta.
  const mezcla = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 17)), opcion('b', vacia())]);
  assert.equal(mezcla.sinAlimentos, false);
  assert.equal(renglon(mezcla, 'protein').resumen, '28 g P · adentro');
});

test('RP-20 · lo que espera y lo que falta: «leyendo», «al guardar» y «sin dato», contados una vez', () => {
  const f = F.franjasDeLaComida(ALMUERZO, [
    opcion('a', total(520, 28, 65, 17)),
    opcion('b', total(null, null, null, null, 'LEYENDO')),
    opcion('c', total(null, null, null, null, 'RECETA_SIN_GUARDAR')),
    opcion('d', total(null, null, null, null, 'SIN_CANTIDAD')),
  ]);
  const p = renglon(f, 'protein');
  assert.deepEqual(p.esperan.map((e) => [e.clave, e.motivo]), [
    ['b', 'leyendo'],
    ['c', 'al-guardar'],
  ]);
  assert.deepEqual(p.sinDato, ['d']);
  assert.equal(p.resumen, '28 g P · adentro · 1 leyendo · 1 al guardar · 1 sin dato');
  assert.match(p.enPalabras, /b: leyendo su composición\. c: se calcula cuando se guarda el plan\. 1 opción sin dato: d/);
  // Si ninguna tiene el dato todavía: «Leyendo…».
  assert.equal(renglon(F.franjasDeLaComida(ALMUERZO, [opcion('b', total(null, null, null, null, 'LEYENDO'))]), 'protein').resumen, 'Leyendo…');
  assert.equal(renglon(F.franjasDeLaComida(ALMUERZO, [opcion('c', total(null, null, null, null, 'RECETA_SIN_GUARDAR'))]), 'protein').resumen, 'Se calcula al guardar');
});

test('RP-21 · el día: lo que va según lo que se elija, con su tramo frente al rango del día', () => {
  const dia = { energyKcal: { tipo: 'rango', min: '1850', max: '2420' }, proteinG: { tipo: 'rango', min: '95', max: '130' }, carbohydrateG: { tipo: 'rango', min: '200', max: '260' }, fatG: { tipo: 'sin-dato', faltan: [] } };
  const [k, p, c, g] = F.tramosDelDia(dia, rango([90, 120], [180, 280], [50, 70]));
  assert.equal(p.cifra, '95 a 130');
  assert.deepEqual([p.tramo.minimo.tipo, p.tramo.maximo.tipo], ['dentro', 'encima']);
  assert.match(p.enPalabras, /el máximo por encima, 10 g$/);
  assert.equal(c.enPalabras, 'Carbohidratos del día: 200 a 260 g C, frente al rango del día 180 a 280 g C: adentro');
  assert.equal(g.cifra, null);
  assert.equal(g.tramo, null);
  // Sin rango del día: solo la cifra.
  const [sinRango] = F.tramosDelDia(dia, null);
  assert.deepEqual([sinRango.cifra, sinRango.banda, sinRango.tramo], ['1.850 a 2.420', null, null]);
  assert.ok(k.banda);
});

test('RP-21 · lo que falta en el día: las opciones sin alimentos, aparte; lo demás, una vez cada cosa', () => {
  const comidas = [
    { nombre: 'Almuerzo', opciones: [{ nombre: 'Opción 1', total: total(520, 28, 65, 17) }, { nombre: 'Opción 2', total: total(null, null, null, null, 'SIN_CANTIDAD') }] },
    { nombre: 'Merienda', opciones: [{ nombre: 'Opción 1', total: vacia() }] },
    { nombre: 'Colación', opciones: [] },
  ];
  const f = F.loQueFaltaEnElDia(comidas);
  assert.deepEqual(f.sinAlimentos, ['Merienda · Opción 1', 'Colación (sin opciones)']);
  assert.deepEqual(f.otros, [{ donde: 'Almuerzo · Opción 2', nombre: 'Arroz', motivo: 'SIN_CANTIDAD' }]);
  assert.equal(F.listaEnPalabras(['Merienda · Opción 1', 'Cena · Opción 1']), 'Merienda · Opción 1 y Cena · Opción 1');
});

test('RP-20 (C) · la receta que se elige: una porción frente al rango de la comida, y primero las que entran', () => {
  const porcion = (k, p, c, g) => ({ energyKcal: { value: k, missing: [] }, proteinG: { value: p, missing: [] }, carbohydrateG: { value: c, missing: [] }, fatG: { value: g, missing: [] }, fiberG: { value: null, missing: [] } });
  const tarta = { name: 'Tarta', calculation: { perServing: porcion('700', '40', '80', '30') } };
  const pollo = { name: 'Pollo con arroz', calculation: { perServing: porcion('530', '29', '66', '16') } };
  const ensalada = { name: 'Ensalada', calculation: { perServing: porcion('300', '12', null, '10') } };
  const f = F.recetaFrenteAlRango(pollo.calculation.perServing, ALMUERZO, pollo.name);
  assert.deepEqual(f.renglones.map((r) => F.porcionEnElRenglon(r)), [
    { valor: '530 kcal', ubicacion: 'adentro' },
    { valor: '29 g P', ubicacion: 'adentro' },
    { valor: '66 g C', ubicacion: 'adentro' },
    { valor: '16 g G', ubicacion: 'adentro' },
  ]);
  assert.deepEqual(F.porcionEnElRenglon(renglon(F.recetaFrenteAlRango(ensalada.calculation.perServing, ALMUERZO, 'x'), 'carbohydrate')), { valor: 'Sin dato', ubicacion: '' });
  assert.deepEqual(F.porcionEnElRenglon(renglon(F.recetaFrenteAlRango(tarta.calculation.perServing, ALMUERZO, 'x'), 'fat')), { valor: '30 g G', ubicacion: 'por encima, 11 g' });
  // Primero las que entran: más renglones adentro primero; entre iguales, la más cercana. No esconde ninguna.
  assert.deepEqual(F.primeroLasQueEntran([tarta, ensalada, pollo], ALMUERZO).map((r) => r.name), ['Pollo con arroz', 'Tarta', 'Ensalada']);
  assert.deepEqual(F.primeroLasQueEntran([tarta, ensalada, pollo], null).map((r) => r.name), ['Tarta', 'Ensalada', 'Pollo con arroz'], 'sin rango, el orden de siempre');
  assert.equal(F.recetaFrenteAlRango(tarta.calculation.perServing, null, 'x'), null);
});

test('RP-20 y RP-21 · los textos: sin «%», sin juicio y sin las palabras prohibidas', () => {
  const C = F.COPY_FRANJAS;
  const textos = Object.values(C).flatMap((v) => (typeof v === 'function' ? [v('Almuerzo'), v(1), v(3)] : [v])).filter((t) => typeof t === 'string');
  for (const t of textos) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n|%/i, t);
  }
});

const COMIDA = leer('app/pro/advisees/nutrition/comida-del-editor.tsx');
const CUADRO = leer('app/pro/advisees/nutrition/cuadro-de-la-opcion.tsx');
const EDITOR = leer('app/pro/advisees/nutrition/editor.tsx');
const PIEZA = leer('app/pro/advisees/nutrition/franjas-de-la-comida.tsx');
const PANEL = leer('app/pro/advisees/nutrition/rangos-y-totales.tsx');
const ESTILOS = leer('app/globals.css');

test('RP-20 · la franja va debajo del encabezado de la comida (plegada también) y dentro de la opción abierta, en vivo', () => {
  // Fuera del botón de la comida, antes de su cuerpo: se ve plegada.
  const cabecera = COMIDA.indexOf('<div className="comida-del-editor__cabecera">');
  // RP-23: con las opciones tildadas y lo que oye el lector de las barras.
  const franja = COMIDA.indexOf('<FranjasDeLaComida franjas={franjas} comida={plegada.titulo} elegidas={enLasBarras} enLasBarras={enLasBarrasEnPalabras(paraLaFranja, enLasBarras)} />');
  assert.ok(franja > 0, 'la franja de la comida, con las opciones tildadas');
  const cuerpo = COMIDA.indexOf('className="comida-del-plan__cuerpo comida-del-editor__cuerpo"');
  assert.ok(cabecera < franja && franja < cuerpo, 'entre el encabezado y el cuerpo');
  // Sale del total de cada opción en pantalla (el que cambia con cada tecla), no de lo guardado.
  assert.match(COMIDA, /const paraLaFranja = comida\.options\.map\(\(o, n\) => \(\{ clave: o\.optionId \?\? `nueva-\$\{n\}`, nombre: pestanaDeLaOpcion\(o, n\), total: totalDeLaOpcion\(n\), lugar: n \}\)\);/);
  assert.match(EDITOR, /totalDeLaOpcion=\{\(k\) => rangos\?\.comidas\[j\]\?\.opciones\[k\]\?\.total \?\? null\}/);
  assert.match(EDITOR, /const rangos = dia \? rangosDelDia\(dia, i, composiciones,/);
  // La opción abierta, sola; reemplaza las líneas de NUP-04.
  assert.match(COMIDA, /<FranjasDeLaComida franjas=\{franjasDeLaOpcion\} comida=\{plegada\.titulo\} variante="opcion" \/>/);
  assert.doesNotMatch(COMIDA, /<FrenteALosRangos lineas=\{frente\} \/>/);
  // El cuadro de la opción, también; el día sigue en líneas porque el cuadro tapa el panel.
  assert.match(CUADRO, /<FranjasDeLaComida franjas=\{franjas\} comida=\{comida\} variante="opcion" \/>/);
  assert.match(CUADRO, /<FrenteALosRangos lineas=\{frenteDelDia\} titulo=\{COPY_FRANJAS\.elDiaFrenteAlSuyo\} \/>/);
  // Mientras se leen los rangos, la franja guarda su lugar.
  assert.match(COMIDA, /\) : rango\.leyendo \? \(\n\s*<div className="comida-del-editor__franjas" data-franjas-de-la-comida data-leyendo-el-rango>\n\s*<FranjasQueSeLeen \/>/);
  assert.match(EDITOR, /leyendo: rangosIndicados\.estado\.estado === 'leyendo' && !!m\.mealId/);
});

test('RP-20 · la pieza: lo dibujado para la vista, el texto entero para el lector, y la marca que se lee queda donde estaba', () => {
  assert.match(PIEZA, /<div className="franjas__renglones" aria-hidden="true">/);
  assert.match(PIEZA, /<p className="visualmente-oculto">\{franjasEnPalabras\(franjas, comida, variante, enLasBarras\)\}<\/p>/);
  assert.match(PIEZA, /recordadas\.current\.set\(`\$\{r\.renglon\}\|\$\{m\.clave\}`, m\.posicion\)/);
  assert.match(PIEZA, /data-espera=\{e\.motivo\}/);
  // Cada marca dice de qué opción es en su pista.
  assert.match(PIEZA, /title=\{m\.texto\}/);
  // Ubica, no califica: la pieza no usa los colores de error ni de éxito.
  assert.doesNotMatch(PIEZA, /error|exito|peligro/);
});

test('RP-20 (F) · sin saltos: cada renglón tiene su alto fijo, en todas sus formas; sin rojo ni verde', () => {
  const bloque = ESTILOS.slice(ESTILOS.indexOf('/* ─── RP-20 y RP-21'));
  assert.ok(bloque.length > 1000);
  assert.match(bloque, /\.franja \{\n\s*display: grid;[\s\S]*?height: 1\.6rem;/);
  assert.match(bloque, /\.franjas\[data-variante='panel'\] \.franja \{[\s\S]*?height: 1\.45rem;/);
  assert.match(bloque, /\.franjas\[data-variante='receta'\] \.franja \{[\s\S]*?height: 1\.45rem;/);
  assert.match(bloque, /@container \(max-width: 46rem\) \{[\s\S]*?height: 2\.55rem;/);
  assert.doesNotMatch(bloque, /--error|--exito|--peligro/);
  // La banda en el color de acento; las marcas, en el del texto.
  assert.match(bloque, /\.franja__banda \{[\s\S]*?var\(--azul\)/);
  assert.match(bloque, /\.franja__marca \{[\s\S]*?background: var\(--texto\);/);
  assert.match(bloque, /\.franja__marca\[data-afuera\] \{\n\s*background: var\(--franja-fondo\);/);
  // Los resúmenes no se parten: el renglón no crece.
  assert.match(bloque, /\.franja__derecha \{[\s\S]*?white-space: nowrap;/);
});

test('RP-21 · «Rangos y totales»: el día arriba, cada comida con su franja compacta, lo que falta una vez; sin tabla de 2 × 2', () => {
  assert.match(EDITOR, /<RangosYTotales\n\s*rangos=\{rangos\}/);
  assert.doesNotMatch(EDITOR, /panel-de-nutricion__tabla|panel-de-nutricion__del-dia/);
  assert.ok(PANEL.indexOf('data-rango-del-dia') < PANEL.indexOf('data-rangos-por-comida'), 'el día, arriba');
  assert.match(PANEL, /<FranjasDeLaComida franjas=\{f\} comida=\{c\.nombre\} variante="panel" elegidas=\{elegidas\} enLasBarras=\{enLasBarrasEnPalabras\(paraLaFranja, elegidas\)\} \/>/);
  // Una comida sin alimentos: una línea, no cuatro «Sin dato».
  assert.match(PANEL, /\{c\.opciones\.length > 0 && !f\.sinAlimentos \? <FranjasDeLaComida/);
  // Las cantidades con su ícono (RP-07).
  assert.match(PIEZA, /<CantidadDelMacro macro=\{macro\} cifra=\{cifra\} \/>/);
  // Nada que desplace de costado: sin tablas ni `desplazable-x`.
  assert.doesNotMatch(PANEL, /<table|desplazable-x/);
});

test('RP-20 (C) · al elegir una receta: la porción de la lista, sin un pedido por receta', () => {
  const elegir = EDITOR.slice(EDITOR.indexOf('function ElegirReceta('));
  assert.match(elegir, /const frente = recetaFrenteAlRango\(r\.calculation\.perServing, rango, r\.name\);/);
  assert.match(elegir, /<FranjasDeLaComida franjas=\{frente\} comida=\{comida\} variante="receta" \/>/);
  // Un solo pedido, el de la lista: ningún `api.` adentro del recorrido de las recetas.
  const recorrido = elegir.slice(elegir.indexOf('{enOrden.map((r) => {'), elegir.indexOf('</ul>'));
  assert.doesNotMatch(recorrido, /api\./);
  assert.equal(elegir.match(/api\./g)?.length, 1);
  assert.match(elegir, /data-primero-las-que-entran/);
  assert.match(EDITOR, /rango=\{eligiendoReceta && comidaDeLaReceta \? rangoIndicadoDe\(rangosIndicados\.estado, estructura\[eligiendoReceta\.i\]\?\.dayTypeId, comidaDeLaReceta\.mealId\) : null\}/);
});

// ─── Revisión adversaria (22/11): casos raros, lo que oye el lector, sin saltos en el panel y lo largo a pedido ─────

test('RP-20 · casos raros: mín = máx, un solo lado, ceros y un total que no es un número', () => {
  // Mín = máx: la banda es una raya; lo que coincide como se muestra queda adentro, y una décima de más, por encima.
  const fijo = F.franjasDeLaComida(rango([30, 30], [60, 60], [10, 10]), [opcion('a', total(450, 30.04, 60, 10)), opcion('b', total(460, 30.06, 60, 10.2))]);
  const p = renglon(fijo, 'protein');
  assert.deepEqual(p.banda, { desde: 50, hasta: 50, sinTope: false });
  assert.deepEqual(p.marcas.map((m) => m.ubicacion), [{ tipo: 'dentro' }, { tipo: 'encima', diferencia: 0.1 }]);
  assert.deepEqual(renglon(fijo, 'kcal').limites, { min: 450, max: 450 });
  // Solo mínimos: las kcal no tienen tope; solo máximos: no tienen piso.
  assert.deepEqual(F.limitesDelRenglon(rango([30, null], [60, null], [10, null]), 'kcal'), { min: 450, max: null });
  assert.deepEqual(F.limitesDelRenglon(rango([null, 30], [null, 60], [null, 10]), 'kcal'), { min: null, max: 450 });
  const soloMaximo = renglon(F.franjasDeLaComida(rango([null, 30], [null, 60], [null, 10]), [opcion('a', total(450, 20, 80, 10))]), 'carbohydrate');
  assert.deepEqual([soloMaximo.banda.desde, soloMaximo.banda.hasta], [0, 50]);
  assert.equal(soloMaximo.resumen, '80 g C · por encima, 20 g');
  // Un rango en cero: la escala sale de los valores y nada se divide por cero.
  const ceros = renglon(F.franjasDeLaComida(rango([0, 0], [0, 0], [0, 0]), [opcion('a', total(0, 0, 0, 0)), opcion('b', total(10, 1, 0, 0))]), 'protein');
  assert.ok(Number.isFinite(ceros.tope) && ceros.tope > 0);
  assert.deepEqual(
    ceros.marcas.map((m) => [m.ubicacion.tipo, Number.isFinite(m.posicion)]),
    [
      ['dentro', true],
      ['encima', true],
    ],
  );
  // Un total que no es un número no queda «adentro» por descarte: es un dato que falta, en la comida y en el día.
  const raro = renglon(F.franjasDeLaComida(ALMUERZO, [opcion('a', total('NaN', 28, 65, 17))]), 'kcal');
  assert.deepEqual(raro.marcas, []);
  assert.equal(raro.resumen, 'Sin dato');
  const sinDato = { tipo: 'sin-dato', faltan: [] };
  const [kcalDelDia] = F.tramosDelDia({ energyKcal: { tipo: 'rango', min: 'x', max: '2000' }, proteinG: sinDato, carbohydrateG: sinDato, fatG: sinDato }, null);
  assert.deepEqual([kcalDelDia.cifra, kcalDelDia.tramo], [null, null]);
});

test('RP-20 · el resumen que se ve entra entero: con el promedio afuera por tres cifras de kcal, 57 caracteres', () => {
  // A 1440 la columna del resumen tiene unos 400 px (1,6 partes contra 1 de la pista): unas 58 letras de 0,88 rem. El
  // recorrido de navegador lo mide en pantalla; esto cuida que el texto no crezca.
  const f = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(700, 40, 85, 25)), opcion('b', total(760, 44, 90, 27))]);
  for (const r of f.renglones) assert.ok(r.resumen.length <= 57, `${r.renglon}: «${r.resumen}» (${r.resumen.length})`);
  assert.equal(renglon(f, 'kcal').resumen, '0 de 2 adentro · promedio 730 kcal (por encima, 139 kcal)');
  assert.match(ESTILOS, /\.franja \{\n\s*display: grid;\n\s*grid-template-columns: 3\.4rem 8rem minmax\(7rem, 1fr\) minmax\(0, 1\.6fr\);/);
  // Más angosto que 46 rem (la comida a 1280), el resumen va debajo de la pista, con todo el ancho.
  assert.match(ESTILOS, /@container \(max-width: 46rem\) \{\n\s*\.franjas:is\(\[data-variante='comida'\], \[data-variante='opcion'\]\) \.franja \{\n\s*grid-template-columns: 2\.9rem minmax\(0, auto\) minmax\(0, 1fr\);/);
  // Sin alimentos, el renglón de las kcal dice una sola cosa, corta.
  assert.ok(F.COPY_FRANJAS.sinAlimentos.length <= 57, F.COPY_FRANJAS.sinAlimentos);
});

test('RP-20 · lo que oye el lector dice dónde está la franja y de dónde salen las kcal del rango', () => {
  const una = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 17), 'Opción 1')]);
  assert.match(F.franjasEnPalabras(una, 'Almuerzo'), /^Las opciones de Almuerzo frente a su rango indicado\. /);
  assert.match(F.franjasEnPalabras(una, 'Almuerzo', 'opcion'), /^Esta opción frente al rango de Almuerzo\. /);
  assert.match(F.franjasEnPalabras(una, 'Almuerzo', 'receta'), /^Una porción, frente al rango de Almuerzo\. /);
  assert.match(F.franjasEnPalabras(F.armarFranjas(null, [opcion('a', total(520, 28, 65, 17))]), 'Desayuno', 'panel'), /^Lo que aportan las opciones de Desayuno\. Energía: sin rango indicado\. a: 520 kcal/);
  // RP-D41: el renglón de las kcal dice que su rango sale de los gramos (a la vista, solo en el «?» del panel).
  assert.match(renglon(una, 'kcal').enPalabras, /^Energía: rango indicado 475 a 591 kcal, sale de los gramos, con 4, 4 y 9 kcal por gramo\. Opción 1: 520 kcal · adentro/);
  assert.doesNotMatch(renglon(una, 'protein').enPalabras, /4, 4 y 9/);
  // Sin alimentos, la opción sola no habla de «cada opción».
  const sola = F.franjasDeLaComida(ALMUERZO, [opcion('a', vacia())]);
  assert.equal(F.franjasEnPalabras(sola, 'Almuerzo', 'opcion'), `Esta opción frente al rango de Almuerzo. ${F.COPY_FRANJAS.sinAlimentosLaOpcion}`);
  assert.match(PIEZA, /\{franjasEnPalabras\(franjas, comida, variante, enLasBarras\)\}/);
});

test('RP-21 · sin saltos en el panel: el día tiene siempre su renglón de ayuda y sus cuatro renglones, con dato o sin él', () => {
  const sinDato = { tipo: 'sin-dato', faltan: [] };
  const tramos = F.tramosDelDia({ energyKcal: sinDato, proteinG: sinDato, carbohydrateG: sinDato, fatG: sinDato }, rango([90, 120], [180, 280], [50, 70]));
  assert.equal(tramos.length, 4);
  for (const t of tramos) {
    assert.deepEqual([t.cifra, t.tramo], [null, null]);
    // RP-D84: sin dato, la pista vacía: la banda sola, centrada por la escala, era un punto en el medio que no decía nada.
    assert.deepEqual([t.banda, t.sinDato], [null, true], `${t.renglon}: sin dato, la pista vacía`);
  }
  // En el panel, el día se dibuja igual con dato o sin él: ninguna rama lo cambia por una nota de otro alto.
  const dia = PANEL.slice(PANEL.indexOf('data-rango-del-dia'), PANEL.indexOf('data-rangos-por-comida'));
  assert.equal(dia.match(/<TramosDelDia /g)?.length, 1);
  assert.match(dia, /<p className="nota rangos-y-totales__ayuda" data-dia-sin-dato=\{diaConDato \? undefined : ''\}>/);
  assert.match(PIEZA, /<CifraConIcono macro=\{t\.renglon\} cifra=\{t\.cifra\} sinDato="—" \/>/);
  // El porqué es corto: entra en el renglón de ayuda del panel (24 rem), que no se parte.
  const textoDe = (clave) => PANEL.match(new RegExp(`${clave}: '([^']+)'`))[1];
  for (const t of [F.COPY_FRANJAS.segunLoQueElija, textoDe('diaSinDato'), textoDe('diaLeyendo')]) assert.ok(t.length <= 46, t);
  assert.match(ESTILOS, /\.rangos-y-totales__ayuda \{[\s\S]*?white-space: nowrap;/);
});

test('RP-21 · lo largo, detrás de un «?»: cómo se lee, cómo se suma, las kcal de los gramos, las recetas, la estimación y los rangos indicados', () => {
  // RP-24 (RP-D91): el «?» va en la esquina del encabezado del día (`EncabezadoConAyuda`), y lo largo no queda además a la vista.
  assert.match(PANEL, /<EncabezadoConAyuda\s+className="rangos-y-totales__encabezado"/);
  const pedido = PANEL.slice(PANEL.indexOf('nombre={COPY_FRANJAS.comoSeLeeElPanel}'), PANEL.indexOf('/>', PANEL.indexOf('{COPY_RANGOS.estimacion}')));
  for (const t of ['COPY_FRANJAS.comoSeLeeLaFranja', 'COPY_RANGOS.comoSeLee', 'COPY_FRANJAS.kcalDeLosGramos', 'COPY_FRANJAS.recetasGuardadas', 'COPY_RANGOS.estimacion']) {
    assert.ok(pedido.includes(`{${t}}`), `${t}, detrás del «?»`);
    assert.equal(PANEL.split(`{${t}}`).length - 1, 1, `${t}: una sola vez, a pedido`);
  }
  // «Rangos indicados», en el panel: su explicación, detrás de un «?» junto al título. La lista sin título (el paso del
  // asistente de Nutrición) se retiró con DL-193.
  const DEL_PLAN = leer('app/pro/advisees/nutrition/rangos-indicados-del-plan.tsx');
  const lista = DEL_PLAN.slice(DEL_PLAN.indexOf('export function RangosIndicados'), DEL_PLAN.indexOf('export function CuadroDelRangoIndicado'));
  assert.match(lista, /<EncabezadoConAyuda className="rangos-indicados__titulo" titulo=\{C\.titulo\} nombre=\{C\.queSon\} como="span" ayuda=\{C\.ayuda\} \/>/);
  assert.equal(lista.split('{C.ayuda}').length - 1, 1, 'una sola vez, a pedido');
  for (const t of [F.COPY_FRANJAS.comoSeLeeLaFranja, F.COPY_FRANJAS.comoSeLeeElPanel, F.COPY_FRANJAS.kcalDeLosGramosCorto]) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.doesNotMatch(t, /%/, t);
  }
});

test('RP-20 · el cuadro de la opción no se titula con un rango que la comida no tiene', () => {
  assert.match(CUADRO, /<h3 id="opcion-frente-al-rango">\{franjas \? COPY_FRANJAS\.frenteAlRangoDe\(comida\) : COPY_PLANIFICACION\.frenteAlRango\}<\/h3>/);
});

// ─── RP-23 (22/11): el promedio solo, las opciones que se tildan y sus colores ───────────────────────────────────

const B = await import('../src/app/pro/advisees/nutrition/opciones-en-las-barras.ts');
const TOKENS = leer('app/tokens.css');

test('RP-23 (RP-D80) · la comida: la banda y la raya del promedio; con una sola opción, su valor; las marcas, solo las tildadas', () => {
  const opciones = [opcion('a', total(520, 28, 65, 17), 'Opción 1'), { ...opcion('b', total(610, 34, 70, 18), '2 · Pollo'), lugar: 1 }, { ...opcion('c', total(400, 22, 50, 12), 'Opción 3'), lugar: 2 }];
  const p = renglon(F.franjasDeLaComida(ALMUERZO, opciones), 'protein');
  // Por defecto no hay nada tildado: ninguna marca, la raya del promedio.
  assert.deepEqual(F.marcasALaVista(p, new Set()), []);
  assert.deepEqual([F.rayaDelPromedio(p).valor, F.rayaDelPromedio(p).posicion], [28, 50]);
  // Tildada la 2: su marca, con su color y su forma (por encima: hueca).
  const vista = F.marcasALaVista(p, new Set(['b']));
  assert.deepEqual(
    vista.map((m) => [m.clave, m.color, m.ubicacion.tipo]),
    [['b', 2, 'encima']],
  );
  // Sin lugar (la receta que se elige, o una opción que no lo dice), sin color.
  assert.equal(p.marcas[0].color, null);
  // Una sola opción: la raya es su valor, en su lugar.
  const una = renglon(F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 34, 65, 17))]), 'protein');
  assert.equal(una.promedio, null);
  assert.deepEqual([F.rayaDelPromedio(una).valor, F.rayaDelPromedio(una).ubicacion.tipo], [34, 'encima']);
  // Sin opciones con el dato, ni raya ni marcas.
  const nada = renglon(F.franjasDeLaComida(ALMUERZO, [opcion('a', vacia())]), 'protein');
  assert.equal(F.rayaDelPromedio(nada), null);
});

test('RP-23 (RP-D81) · un color por lugar, de una paleta de cinco que vuelve a empezar, con su nombre, en los dos temas', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(F.colorDeLaOpcion), [1, 2, 3, 4, 5, 1, 2]);
  assert.equal(F.COLORES_DE_LAS_OPCIONES, 5);
  for (let n = 1; n <= 5; n++) {
    assert.ok(F.NOMBRE_DEL_COLOR[n], `el color ${n} tiene nombre`);
    assert.doesNotMatch(F.NOMBRE_DEL_COLOR[n], /rojo|^verde$|ámbar|amarillo|naranja/, 'ningún color de juicio');
  }
  // Claro en `:root`, Azul noche en su bloque: los dos definen los cinco.
  const corte = TOKENS.indexOf("[data-tema='azul-noche'] {");
  for (let n = 1; n <= 5; n++) {
    assert.match(TOKENS.slice(0, corte), new RegExp(`--opcion-${n}: #[0-9a-f]{6};`));
    assert.match(TOKENS.slice(corte), new RegExp(`--opcion-${n}: #[0-9a-f]{6};`));
  }
});

test('RP-23 · lo que oye el lector: el promedio primero, cada opción con dónde queda, y qué hay en las barras', () => {
  const opciones = [{ ...opcion('a', total(520, 28, 65, 17), 'Opción 1'), lugar: 0 }, { ...opcion('b', total(610, 34, 70, 18), 'Opción 2'), lugar: 1 }];
  const f = F.franjasDeLaComida(ALMUERZO, opciones);
  assert.equal(renglon(f, 'protein').enPalabras, 'Proteínas: rango indicado 25 a 31 g P. promedio 31 g P, adentro. Opción 1: 28 g P · adentro. Opción 2: 34 g P · por encima, 3 g. 1 de 2 opciones adentro');
  assert.equal(F.enLasBarrasEnPalabras(opciones, new Set()), 'En las barras, solo el promedio.');
  assert.equal(F.enLasBarrasEnPalabras(opciones, new Set(['b'])), 'En las barras, el promedio y Opción 2 (violeta).');
  assert.equal(F.enLasBarrasEnPalabras(opciones, new Set(['a', 'b'])), 'En las barras, el promedio y Opción 1 (azul) y Opción 2 (violeta).');
  const oido = F.franjasEnPalabras(f, 'Almuerzo', 'comida', F.enLasBarrasEnPalabras(opciones, new Set(['b'])));
  assert.match(oido, /Opción 1: 28 g P · adentro/, 'la opción sin tildar también se oye');
  assert.match(oido, /\. En las barras, el promedio y Opción 2 \(violeta\)\.$/);
  // La etiqueta de la casilla y la pista del punto.
  assert.equal(F.COPY_FRANJAS.mostrarEnLasBarras(2, 'violeta'), 'Mostrar la opción 2 en las barras de la comida (su punto es violeta)');
  for (const t of [F.COPY_FRANJAS.mostrarEnLasBarras(2, 'violeta'), F.COPY_FRANJAS.suPunto(2, 'violeta'), F.COPY_FRANJAS.enLasBarrasSoloElPromedio, F.COPY_FRANJAS.comoSeLeeLaFranja]) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.doesNotMatch(t, /%|cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n/i, t);
  }
});

test('RP-23 (RP-D82) · las casillas: nada tildado por defecto, se recuerdan por plan en la sesión y un almacenamiento roto no corta nada', () => {
  const memoria = new Map();
  const almacen = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v), removeItem: (k) => memoria.delete(k) };
  assert.equal(B.leerEnLasBarras(almacen, 'plan-1').size, 0);
  const clave = B.claveEnLasBarras('dia-1', 'comida-2', 'opcion-3');
  const una = B.alternarEnLasBarras(new Set(), clave);
  B.guardarEnLasBarras(almacen, 'plan-1', una);
  assert.deepEqual([...B.leerEnLasBarras(almacen, 'plan-1')], [clave]);
  assert.equal(B.leerEnLasBarras(almacen, 'plan-2').size, 0, 'cada plan, lo suyo');
  B.guardarEnLasBarras(almacen, 'plan-1', B.alternarEnLasBarras(una, clave));
  assert.equal(memoria.size, 0, 'sin nada tildado, no queda nada guardado');
  // Roto o sin almacenamiento: nada tildado, sin errores.
  memoria.set('be:nutricion:en-las-barras:plan-3', '{no es json');
  assert.equal(B.leerEnLasBarras(almacen, 'plan-3').size, 0);
  const lanza = () => {
    throw new Error('sin acceso');
  };
  const falla = { getItem: lanza, setItem: lanza, removeItem: lanza };
  assert.equal(B.leerEnLasBarras(falla, 'plan-1').size, 0);
  assert.doesNotThrow(() => B.guardarEnLasBarras(falla, 'plan-1', una));
  assert.doesNotThrow(() => B.guardarEnLasBarras(null, 'plan-1', una));
  // Por comida: la clave de la franja de cada opción tildada, solo las guardadas. Una sin guardar cambia de lugar al quitar,
  // duplicar o mover, y de identidad al autoguardar: lo recordado con su forma vieja («nueva-2») no pasa a otra opción.
  const comida = { mealId: 'comida-2', options: [{ optionId: 'opcion-1' }, { optionId: 'opcion-3' }, {}] };
  const elegidas = new Set([clave, B.claveEnLasBarras('dia-1', 'comida-2', 'nueva-2'), B.claveEnLasBarras('otro', 'comida-2', 'opcion-1')]);
  assert.deepEqual([...B.enLasBarrasDeLaComida(elegidas, { dayTypeId: 'dia-1' }, comida)], ['opcion-3']);
  assert.equal(B.enLasBarrasDeLaComida(new Set([B.claveEnLasBarras('nuevo-0', 'nueva-1', 'nueva-0')]), {}, { options: [{}] }).size, 0, 'un día o una comida sin guardar: nada');
  assert.equal(B.sePuedeMostrarEnLasBarras({ dayTypeId: 'dia-1' }, comida, comida.options[1]), true);
  assert.equal(B.sePuedeMostrarEnLasBarras({ dayTypeId: 'dia-1' }, comida, comida.options[2]), false, 'la opción sin guardar, apagada');
  assert.equal(B.sePuedeMostrarEnLasBarras({}, comida, comida.options[1]), false, 'el día sin guardar, apagada');
  assert.doesNotMatch(EDITOR, /nuevo-${i}`, m.mealId ?? `nueva-/, 'sin claves por lugar');
  // En la sesión, no para siempre; el estado vive en la pantalla del editor.
  const FUENTE = leer('app/pro/advisees/nutrition/opciones-en-las-barras.ts');
  assert.match(FUENTE, /window\.sessionStorage/);
  assert.doesNotMatch(FUENTE, /localStorage/);
  assert.match(EDITOR, /const barras = useOpcionesEnLasBarras\(planId\);/);
});

test('RP-23 · la pieza: con elegidas, la raya del promedio y solo las marcas tildadas, en su color; la opción abierta y la receta, como estaban', () => {
  assert.match(PIEZA, /const raya = elegidas \? rayaDelPromedio\(r\) : r\.promedio;/);
  assert.match(PIEZA, /const marcas = elegidas \? marcasALaVista\(r, elegidas\) : r\.marcas;/);
  assert.match(PIEZA, /data-color-de-la-opcion=\{elegidas && m\.color !== null \? m\.color : undefined\}/);
  // Lo que se está leyendo, solo si está tildada.
  assert.match(PIEZA, /if \(elegidas && !elegidas\.has\(e\.clave\)\) return \[\];/);
  // La opción abierta, el cuadro y la receta no pasan `elegidas`: siguen con su punto en el color del texto.
  assert.match(COMIDA, /<FranjasDeLaComida franjas=\{franjasDeLaOpcion\} comida=\{plegada\.titulo\} variante="opcion" \/>/);
  assert.doesNotMatch(CUADRO, /elegidas=/);
  assert.match(EDITOR, /<FranjasDeLaComida franjas=\{frente\} comida=\{comida\} variante="receta" \/>/);
});

test('RP-23 (RP-D83) · la casilla y el punto, en el renglón de la cabecera de la opción, con su etiqueta; sin saltos (RP-19)', () => {
  const fila = COMIDA.slice(COMIDA.indexOf('<div className="opcion-plegable__fila">'), COMIDA.indexOf('<div id={`${propio}-opcion-${n}`}'));
  assert.ok(fila.indexOf('<CasillaEnLasBarras') > 0 && fila.indexOf('<CasillaEnLasBarras') < fila.indexOf('<h4 className="opcion-plegable__titulo">'), 'la casilla, antes de la cabecera y fuera de su botón');
  assert.match(fila, /<\/h4>\n\s*<\/div>/);
  const casilla = COMIDA.slice(COMIDA.indexOf('function CasillaEnLasBarras('), COMIDA.indexOf('function AccionDeInicio('));
  assert.match(casilla, /<input type="checkbox" checked=\{tildada && !sinGuardar\} disabled=\{sinGuardar\} onChange=\{alAlternar\} \/>/);
  assert.match(casilla, /<span className="en-las-barras__punto" data-color-de-la-opcion=\{color\} aria-hidden="true" \/>/);
  assert.match(casilla, /<span className="visualmente-oculto">\s*\{COPY_FRANJAS\.mostrarEnLasBarras\(lugar \+ 1, nombreDelColor\)\}\s*\{sinGuardar \? ` \$\{COPY_FRANJAS\.alGuardarseSePuedeMostrar\}` : ''\}\s*<\/span>/);
  assert.match(casilla, /title=\{sinGuardar \? COPY_FRANJAS\.alGuardarseSePuedeMostrar : COPY_FRANJAS\.suPunto\(lugar \+ 1, nombreDelColor\)\}/);
  // Sin guardar, apagada: su lugar y su identidad todavía cambian.
  assert.match(fila, /sinGuardar=\{!sePuedeMostrarEnLasBarras\(n\)\} alAlternar=\{\(\) => alAlternarEnLasBarras\(n\)\}/);
  // Los estilos, en el bloque de RP-20 y RP-21: los colores salen de los tokens; la fila no agrega renglones.
  const bloque = ESTILOS.slice(ESTILOS.indexOf('/* ─── RP-20 y RP-21'));
  for (let n = 1; n <= 5; n++) assert.match(bloque, new RegExp(`\\[data-color-de-la-opcion='${n}'\\] \\{\\n\\s*--color-de-la-opcion: var\\(--opcion-${n}\\);`));
  assert.match(bloque, /\.franja__marca\[data-color-de-la-opcion\] \{\n\s*border-color: var\(--color-de-la-opcion\);\n\s*background: var\(--color-de-la-opcion\);/);
  assert.match(bloque, /\.franja__marca\[data-color-de-la-opcion\]\[data-afuera\] \{\n\s*background: var\(--franja-fondo\);/);
  assert.match(bloque, /\.opcion-plegable__fila \{\n\s*display: flex;\n\s*align-items: center;\n\}/);
  assert.match(bloque, /\.en-las-barras \{[\s\S]*?min-height: 2rem;/);
  assert.doesNotMatch(bloque, /--error|--exito|--peligro/);
});

test('RP-23 (RP-D84) · el día sin dato: la pista vacía, con su alto; con dato, la banda y el tramo', () => {
  const sinDato = { tipo: 'sin-dato', faltan: [] };
  const delDia = rango([90, 120], [180, 280], [50, 70]);
  const [k] = F.tramosDelDia({ energyKcal: sinDato, proteinG: sinDato, carbohydrateG: sinDato, fatG: sinDato }, delDia);
  assert.deepEqual([k.banda, k.tramo, k.sinDato], [null, null, true]);
  assert.ok(k.limites, 'el rango del día sigue: vuelve la banda con el dato');
  const [conDato] = F.tramosDelDia({ energyKcal: { tipo: 'rango', min: '1850', max: '2420' }, proteinG: sinDato, carbohydrateG: sinDato, fatG: sinDato }, delDia);
  assert.ok(conDato.banda && conDato.tramo);
  assert.equal(conDato.sinDato, false);
  assert.match(PIEZA, /data-sin-dato=\{t\.sinDato \? '' : undefined\}/);
});
