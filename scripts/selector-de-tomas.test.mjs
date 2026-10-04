/**
 * «Mi evolución» de la APK con el selector de tomas (DL-117, Dirección, 2026-10-04). Las reglas de las tomas viven en
 * @be/domain (`tomasDelPeriodo`, `tomaDe`, `valoresPorToma`) y tienen sus pruebas allí. Esta prueba cubre lo de la APK:
 *  1. La lista equivalente de cada gráfico chico y su frase para el lector de pantalla (`textos-por-toma.ts`).
 *  2. Lo que la pantalla tiene que cumplir y se ve en su código: una elección para todo (figura, medidas, resultados,
 *     gráficos y comparación), el selector fuera de «Evolución», y gráficos de puntos sin líneas.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const textos = await import('../apps/mobile/src/textos-por-toma.ts');
const formato = await import('../apps/mobile/src/formato.ts');

const tomas = [
  { evaluacionId: 'ev-1', etiqueta: 'T1', fecha: '2026-07-20', instante: 1, metricas: 3 },
  { evaluacionId: 'ev-2', etiqueta: 'T2', fecha: '2026-08-25', instante: 2, metricas: 1 },
  { evaluacionId: 'ev-3', etiqueta: 'T3', fecha: '2026-09-24', instante: 3, metricas: 3 },
];
const valor = (value, unit = 'kg') => ({ punto: { value, unit } });

test('la lista equivalente dice el valor de cada toma, y un hueco como «sin dato», nunca como cero', () => {
  assert.equal(textos.textoPorToma([valor(82.4), null, valor(80)], tomas), 'T1 82,4 · T2 sin dato · T3 80 kg');
  assert.equal(textos.textoPorToma([null, null, null], tomas), 'T1 sin dato · T2 sin dato · T3 sin dato');
});

test('para el lector de pantalla, cada toma con su fecha, su valor con unidad y cuál es la elegida', () => {
  const frase = textos.frasePorToma([valor(82.4), null, valor(80)], tomas, 'ev-3', formato.fechaCorta);
  assert.equal(frase, 'T1, 20 jul: 82,4 kg; T2, 25 ago: sin dato comparable; T3, 24 sept: 80 kg (la elegida)'.replace('sept', formato.fechaCorta('2026-09-24').split(' ')[1]));
  assert.match(formato.fechaCorta('2026-07-20'), /^20 jul$/, 'sin año y sin punto');
});

const PANTALLA = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/antropometria.tsx'), 'utf8');
const PUNTOS = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/puntos-por-toma.tsx'), 'utf8');
const COMPARAR = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/comparar-tomas.tsx'), 'utf8');

test('una sola elección de toma, por evaluación, para la figura, las medidas, los resultados, los gráficos y la comparación', () => {
  assert.match(PANTALLA, /useSeleccionRecordada<string \| null>\(token, 'mi-evolucion:toma', null\)/);
  assert.match(PANTALLA, /const tomas = useMemo\(\(\) => tomasDelPeriodo\(datos\), \[datos\]\)/);
  assert.match(PANTALLA, /tomas\.find\(\(t\) => t\.evaluacionId === pedida\) \?\? ultima/, 'sin elección o con una toma que ya no está, la última');
  assert.match(PANTALLA, /resumenDe\(datos, elegida\.evaluacionId\)/);
  assert.match(PANTALLA, /<LaToma toma=\{toma\} porToma=\{\{ datos, tomas, elegida: elegida!\.evaluacionId \}\} \/>/);
  assert.match(PANTALLA, /<CompararTomas toma=\{toma\} etiqueta=\{elegida!\.etiqueta\} \/>/);
  assert.match(PANTALLA, /<FiguraDeLaToma medidas=\{toma\.medidas\} \/>/, 'la figura dibuja la toma elegida');
  // Cada fila y cada ficha dibuja su gráfico con los valores del mismo grupo de comparabilidad.
  assert.match(PANTALLA, /valoresPorToma\(porToma\.datos, m\.metrica, m\.actual\.punto\.comparabilityGroup, porToma\.tomas\)/);
  assert.equal((PANTALLA.match(/<EvolucionPorToma valores=\{valores\} tomas=\{porToma\.tomas\} elegida=\{porToma\.elegida\} \/>/g) ?? []).length, 2, 'en la ficha y en la fila');
  // Las etiquetas del selector son las tomas con su fecha real: «T2 · 25 ago».
  assert.match(PANTALLA, /texto: `\$\{t\.etiqueta\} · \$\{fechaCorta\(t\.fecha\)\}`/);
});

test('el selector se ve con más de una toma y no en «Evolución», que muestra una medida en el tiempo', () => {
  assert.match(PANTALLA, /\{vista !== 'EVOLUCION' && tomas\.length > 1 \? <SelectorDeToma /);
  assert.match(COMPARAR, /\{etiqueta \? `TOMA \$\{etiqueta\}` : 'ÚLTIMA TOMA'\}/, 'Comparar dice qué toma compara');
  assert.doesNotMatch(COMPARAR, /No hay un\s+\* selector de otras tomas/, 'el comentario viejo ya no vale');
});

test('el gráfico chico es de puntos, sin líneas entre valores, y no se recorre: su lista lo dice', () => {
  const codigo = PUNTOS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  assert.doesNotMatch(codigo, /<Polyline|<Path/, 'ninguna línea une dos tomas');
  assert.equal((codigo.match(/<Line /g) ?? []).length, 1, 'solo la base, fija, que no une valores');
  assert.match(codigo, /accessible=\{false\} importantForAccessibility="no-hide-descendants"/);
  assert.match(codigo, /<Text style=\{estilos\.lista\}>\{textoPorToma\(valores, tomas\)\}<\/Text>/, 'la lista equivalente, a la vista');
  assert.match(codigo, /if \(!o\) return null;/, 'un hueco no dibuja un punto');
});
