/**
 * WP-ANTROPOMETRIA-RESULTADOS (DL-200) · sin React: lo que la pantalla de la toma hace con el resultado completo de cada
 * método. La lógica vive en el dominio (`resultados-antropometricos.ts`) y tiene sus pruebas allá, con los valores de la
 * ficha y los ejemplos publicados; acá se fija que la pantalla la use, lo que dice y que no vuelvan los casilleros.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (r) => readFileSync(new URL(`../src/app/pro/advisees/anthropometry/${r}`, import.meta.url), 'utf8');
const RESULTADOS = leer('resultados-por-metodo.tsx');
const CALCULOS = leer('calculos.tsx');
const ELECCION = leer('eleccion-de-metodos.tsx');
const PREPARACION = leer('preparacion.tsx');
const GUARDAR = leer('guardar-en-la-historia.ts');
const CSS = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

test('AR-01 · la toma muestra cada método entero, sin casilleros: ningún checkbox en los resultados ni al elegir', () => {
  for (const [nombre, texto] of [
    ['resultados-por-metodo.tsx', RESULTADOS],
    ['eleccion-de-metodos.tsx', ELECCION],
    ['calculos.tsx · ResultadosDeLaToma', CALCULOS.slice(CALCULOS.indexOf('export function ResultadosDeLaToma'), CALCULOS.indexOf('export function DetalleDeResultado'))],
  ]) {
    assert.ok(!/type="checkbox"/.test(texto), `${nombre}: sin casilleros`);
  }
  // Los métodos con algo que dar salen solos, más los elegidos y los guardados, en el orden del catálogo.
  assert.match(RESULTADOS, /metodosConResultado\(valores, sexo\)/);
  assert.match(RESULTADOS, /PROGRAMAS_DE_RESULTADO\.map\(\(p\) => p\.clave\)\.filter\(/);
  assert.match(CALCULOS, /<ResultadosPorMetodo /);
});

test('AR-02 · el resumen arriba y el detalle por método en desplegables, con la evolución de cada valor', () => {
  assert.match(RESULTADOS, /<Resumen resultado=\{delResumen\}/);
  assert.match(RESULTADOS, /<details className="metodo-de-la-toma" open=\{abierto\}/);
  assert.match(RESULTADOS, /diferenciaDelPaso\(p, suyo\)/);
  assert.match(RESULTADOS, /desde la anterior/);
  // El orden de las etapas lo da el dominio: primero lo medido, después lo inferido.
  const r = D.resultadoDelMetodo('jackson-pollock-7', {}, 'HOMBRE');
  assert.deepEqual(r.etapas.map((e) => e.titulo), ['Lo medido', 'La ecuación', 'La conversión', 'Las masas', 'En cuatro componentes']);
});

test('AR-03 · cada valor con su origen, su «?» en la esquina con la fórmula y un ejemplo resuelto, y lo que falta en su paso', () => {
  assert.match(RESULTADOS, /<ExplicacionAPedido nombre=\{`Cómo se calcula: \$\{paso\.nombre\}`\} como="div" lugar="esquina">/);
  assert.match(RESULTADOS, /paso\.cuenta \?\? cuentaDeEjemplo\(programa, sexo, paso\.clave, conversion\)/);
  assert.match(RESULTADOS, /Un ejemplo resuelto\./);
  assert.match(RESULTADOS, /className="paso-de-la-cadena__origen">\{paso\.origen\}/);
  assert.match(RESULTADOS, /textoDeLoQueFalta\(paso\)/);
  // El % de grasa con su base, también en el resumen.
  assert.match(RESULTADOS, /resumen-de-la-toma__base">\{p\.base\}/);
});

test('AR-04 · las ecuaciones por sexo y la conversión se eligen una vez, con segmentos, y Brožek se ve al lado', () => {
  assert.match(RESULTADOS, /<legend>Ecuaciones de<\/legend>/);
  assert.match(RESULTADOS, /<legend>% de grasa con<\/legend>/);
  assert.match(RESULTADOS, /ir\(\{ conversion: c === 'BROZEK' \? 'brozek' : null \}\)/);
  assert.match(RESULTADOS, /paso\.alLado\.map/);
});

test('AR-05 · guardar en la historia: al registrar lo elegido y, desde la toma, con un botón por método', () => {
  assert.match(GUARDAR, /m\.status === 'SELECTABLE'/);
  assert.match(GUARDAR, /!vigentes\.has\(m\.methodId\)/);
  assert.match(GUARDAR, /o\.intento\.actual\(`\$\{o\.toma\.evaluationId\}:\$\{metodo\.methodVersionId\}`\)/);
  assert.match(RESULTADOS, />\s*\{guardando \? 'Guardando…' : 'Guardar en la historia'\}/);
  assert.match(PREPARACION, /guardarEnLaHistoria\(\{ token, asesoradoId, toma, metodos: metodosParaGuardar\(resultados, toma, metodos, \[\]\)/);
  assert.match(PREPARACION, /Con la toma, BE guarda en la historia los resultados de/);
  // La toma recién registrada se abre con los métodos elegidos y las ecuaciones de la figura.
  assert.match(PREPARACION, /ecuaciones: sexo === 'MUJER' \? 'mujer' : 'hombre'/);
});

test('AR-06 · antes de medir, cada método dice qué pide y qué va a dar; el fraccionamiento se suma con un toque', () => {
  assert.match(ELECCION, /loQuePideEnPalabras\(pide\)/);
  assert.match(ELECCION, /loQueVaADar\(p\.clave, conFraccionamiento\)/);
  assert.match(ELECCION, /aria-pressed=\{conFraccionamiento\}/);
  assert.match(ELECCION, /aria-pressed=\{elegido\}/);
  assert.equal(D.loQuePideEnPalabras(D.medicionesDelPrograma('jackson-pollock-7', 'HOMBRE')), '7 pliegues, la edad y el peso');
});

test('las acciones de Antropometría no van subrayadas y los colores nuevos salen de los tokens', () => {
  for (const archivo of ['calculos.tsx', 'evaluaciones.tsx', 'preparacion.tsx', 'eleccion-de-metodos.tsx', 'resultados-por-metodo.tsx', 'lamina.tsx', 'grafico-de-evolucion.tsx']) {
    assert.ok(!leer(archivo).includes('boton--enlace'), archivo);
  }
  const bloque = CSS.slice(CSS.indexOf('/* ─── DL-200 (WP-ANTROPOMETRIA-RESULTADOS)'), CSS.indexOf('.anteriores-sin-efecto {'));
  assert.ok(bloque.length > 1000, 'el bloque de estilos de DL-200 está');
  assert.ok(!/#[0-9a-f]{3,8}\b|rgb\(/i.test(bloque), 'sin colores sueltos: todo con var(--…)');
});

test('las palabras de las piezas nuevas no califican ni usan lo prohibido', () => {
  for (const [nombre, texto] of [
    ['resultados-por-metodo.tsx', RESULTADOS],
    ['eleccion-de-metodos.tsx', ELECCION],
    ['guardar-en-la-historia.ts', GUARDAR],
  ]) {
    assert.deepEqual(D.terminosProhibidosDeAntropometriaEn(texto), [], nombre);
    const visibles = [...texto.matchAll(/>([^<>{}]+)</g), ...texto.matchAll(/'([^'\n]+)'/g), ...texto.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]).filter((t) => /\s/.test(t));
    for (const palabra of ['cumplimiento', 'adherencia', 'racha', 'puntaje', 'asesorado', 'estación', 'mejor']) {
      assert.ok(!visibles.some((t) => t.toLocaleLowerCase('es-AR').includes(palabra)), `${nombre}: «${palabra}»`);
    }
  }
});
