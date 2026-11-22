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

test('RP-20 · el promedio y el conteo: «1 de 3 opciones adentro · promedio 28 g P»; con una sola, su valor y dónde queda', () => {
  const tres = F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 17)), opcion('b', total(610, 34, 70, 18)), opcion('c', total(400, 22, 50, 12))]);
  const p = renglon(tres, 'protein');
  assert.equal(p.adentro, 1);
  assert.deepEqual([p.promedio.valor, p.promedio.posicion, p.promedio.ubicacion.tipo], [28, 50, 'dentro']);
  assert.equal(p.resumen, '1 de 3 opciones adentro · promedio 28 g P');
  // Un promedio afuera dice cuánto.
  const c = renglon(tres, 'carbohydrate');
  assert.equal(c.resumen, '2 de 3 opciones adentro · promedio 61,7 g C');
  const grasas = renglon(F.franjasDeLaComida(ALMUERZO, [opcion('a', total(520, 28, 65, 24)), opcion('b', total(610, 34, 70, 22))]), 'fat');
  assert.equal(grasas.resumen, '0 de 2 opciones adentro · promedio 23 g G (por encima, 4 g)');
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
  const franja = COMIDA.indexOf('<FranjasDeLaComida franjas={franjas} comida={plegada.titulo} />');
  const cuerpo = COMIDA.indexOf('className="comida-del-plan__cuerpo comida-del-editor__cuerpo"');
  assert.ok(cabecera < franja && franja < cuerpo, 'entre el encabezado y el cuerpo');
  // Sale del total de cada opción en pantalla (el que cambia con cada tecla), no de lo guardado.
  assert.match(COMIDA, /const paraLaFranja = comida\.options\.map\(\(o, n\) => \(\{ clave: o\.optionId \?\? `nueva-\$\{n\}`, nombre: pestanaDeLaOpcion\(o, n\), total: totalDeLaOpcion\(n\) \}\)\);/);
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
  assert.match(PIEZA, /<p className="visualmente-oculto">\{franjasEnPalabras\(franjas, comida\)\}<\/p>/);
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
  assert.match(bloque, /@container \(max-width: 36rem\) \{[\s\S]*?height: 2\.55rem;/);
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
  assert.match(PANEL, /<FranjasDeLaComida franjas=\{f\} comida=\{c\.nombre\} variante="panel" \/>/);
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
