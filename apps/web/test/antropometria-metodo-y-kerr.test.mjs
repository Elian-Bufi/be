/**
 * WP-ANTROPOMETRIA-METODO-Y-KERR (DL-190) · sin React: lo que la pantalla de la toma tiene que hacer con el método elegido
 * antes de medir (RP-18) y con las cinco masas de Kerr (RP-17). La lógica vive en el dominio (`metodos-de-la-toma.ts`,
 * `fraccionamiento-de-kerr.ts`) y tiene sus pruebas allá; acá se fija que la pantalla la use y lo que dice.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (r) => readFileSync(new URL(`../src/app/pro/advisees/anthropometry/${r}`, import.meta.url), 'utf8');
const PREPARACION = leer('preparacion.tsx');
const ELECCION = leer('eleccion-de-metodos.tsx');
const CALCULOS = leer('calculos.tsx');

test('RP-18 · la toma lee los métodos y los de la última toma, y elige antes de medir', () => {
  assert.match(PREPARACION, /api\.metodosHabituales\(token\)/);
  assert.match(PREPARACION, /todasLasPaginas\(\(f\) => api\.listarMetodos\(token, f\)\)/);
  assert.match(PREPARACION, /<EleccionDeMetodos /);
  // Sin `metodos=` en la dirección vienen los de la última toma; `ninguno` es no filtrar.
  assert.match(PREPARACION, /enLaDireccion === null \? familiasHabituales\(/);
  assert.match(PREPARACION, /'ninguno'/);
  // Lo que se ve sale de la unión de los métodos elegidos, con los puntos sueltos y lo que ya tiene dato.
  assert.match(PREPARACION, /medicionesDeLaEleccion\(familiasDeMetodo, elegidas, \{ sueltas, conDato: conValor \}\)/);
  // «+ Otra medición» suma un punto suelto del protocolo o del catálogo.
  assert.match(PREPARACION, />\+ Otra medición</);
  assert.match(PREPARACION, /otrasMediciones\(delProtocolo, /);
});

test('RP-18 · elegir no pierde nada: lo que se guarda y lo que se revisa es todo lo escrito, no solo lo que se ve', () => {
  assert.match(PREPARACION, /directMeasurements: \[\n\s+\.\.\.universo\n/);
  assert.match(PREPARACION, /for \(const m of universo\) \{/);
  // Un borrador que se reabre reparte sus valores entre todos los campos que BE conoce (también los de Kerr).
  assert.equal((PREPARACION.match(/universoDe\(metricasDelProtocolo\(/g) ?? []).length, 2);
});

test('RP-18 · la nota de dónde mide BE el suprailíaco de Jackson y Pollock (D-1) está a la vista al elegir', () => {
  assert.match(ELECCION, /NOTA_DEL_SITIO\[f\.clave\]/);
  assert.match(D.NOTA_DEL_SITIO['grasa-jackson-pollock-7'], /cresta ilíaca/);
  assert.match(ELECCION, /Vienen elegidos los de tu última toma/);
  assert.match(ELECCION, /ecuación por sexo/);
});

test('RP-18 · si al calcular le faltan medidas al método, BE dice cuáles', () => {
  assert.match(CALCULOS, /const faltantes = datos\.filter\(\(d\) => !entradas\[d\.codigo\]\)/);
  assert.match(CALCULOS, /A este método le faltan \$\{faltantes\.length\} medidas de esta toma/);
});

test('RP-17 · Kerr en la toma: lo medido primero, las cinco masas, la suma y la diferencia en kg y en %', () => {
  assert.match(CALCULOS, /fraccionamientoDeKerr\(calculos\.corridas, toma\.evaluationId, toma\.measurements\)/);
  const tabla = CALCULOS.slice(CALCULOS.indexOf('function KerrEnLaToma'), CALCULOS.indexOf('export function ResultadosDeLaToma'));
  assert.ok(tabla.indexOf('Peso medido') < tabla.indexOf('f.componentes.map'), 'el peso de la balanza va primero');
  assert.match(tabla, /Peso estructurado \(la suma de las cinco\)/);
  assert.match(tabla, /del peso\)/);
  // Lo inferido, con su ecuación a la vista: la piel tiene una por sexo y la suma cuenta la última registrada, así que la
  // fila dice con cuál se calculó («Masa de la piel (Kerr), mujeres»), no solo «Masa de la piel (Kerr)».
  assert.match(tabla, /<th scope="row">\{c\.metodo \?\? nombreDeMetrica\(c\.metrica\)\}<\/th>/);
});

test('las palabras de las piezas nuevas no califican ni usan lo prohibido', () => {
  for (const [nombre, texto] of [
    ['eleccion-de-metodos.tsx', ELECCION],
    // De calculos.tsx, lo nuevo: el bloque de Kerr y el aviso de lo que falta (el resto ya lo mira su propia prueba).
    ['calculos.tsx', CALCULOS.slice(CALCULOS.indexOf('function KerrEnLaToma'), CALCULOS.indexOf('export function ResultadosDeLaToma')) + CALCULOS.slice(CALCULOS.indexOf('const faltantes'), CALCULOS.indexOf('{C.metodoPide}'))],
    ['preparacion.tsx', PREPARACION],
  ]) {
    assert.deepEqual(D.terminosProhibidosDeAntropometriaEn(texto), [], nombre);
    for (const palabra of ['cumplimiento', 'adherencia', 'racha', 'puntaje', 'asesorado', 'estación']) {
      // En el código hay identificadores con «asesorado» (asesoradoId): se mira solo lo que se lee en pantalla, entre comillas o entre etiquetas.
      const visibles = [...texto.matchAll(/>([^<>{}]+)</g), ...texto.matchAll(/'([^'\n]+)'/g)].map((m) => m[1]).filter((t) => /\s/.test(t));
      assert.ok(!visibles.some((t) => t.toLocaleLowerCase('es-AR').includes(palabra)), `${nombre}: «${palabra}»`);
    }
  }
});
