/**
 * TEST-UF-018 (WP-USO-FINAL, UF-02; DL-169; 08 §42 y §56.9) · el gate del primer dato real, condición por condición.
 *
 * Lee `EVIDENCIA/USO-FINAL/GATE-08-42.md` y exige:
 * - las 24 condiciones del 08 §42 y las 25 a 28 del §56.9, cada una una sola vez, con un estado conocido;
 * - la que se da por cumplida (CON EVIDENCIA), la programada que espera su integración (EN EL PR) y la parcial (PARCIAL)
 *   citan al menos una ruta entre comillas invertidas, y todas existen en el repositorio;
 * - la que no está cumplida (EN EL PR, PARCIAL y PENDIENTE) lleva un dueño y una fecha;
 * - el resumen cuenta lo mismo que las filas y, con alguna condición sin cumplir, el documento dice que el gate está
 *   cerrado;
 * - la condición 18 (cero IA externa con dato identificable) se verifica acá: ningún package.json depende de un SDK de IA.
 *
 * Ninguna condición se da por cumplida sin evidencia: esta guardia es la que lo sostiene en cada PR.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const RAIZ = join(__dirname, '..');
const DOCUMENTO = join(RAIZ, 'EVIDENCIA', 'USO-FINAL', 'GATE-08-42.md');
const ESTADOS = ['CON EVIDENCIA', 'EN EL PR', 'PARCIAL', 'PENDIENTE'];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const SIN_VALOR = new Set(['', '—', '-']);

/** Las filas de la tabla que sigue al encabezado dado: `| # | Condición | Estado | Evidencia | Parte | Dueño | Fecha |`. */
function filasDe(texto, encabezado) {
  const desde = texto.indexOf(encabezado);
  assert.ok(desde >= 0, `falta la sección «${encabezado}»`);
  const lineas = texto.slice(desde).split(/\r?\n/);
  const filas = [];
  let enTabla = false;
  for (const linea of lineas.slice(1)) {
    if (linea.startsWith('## ')) break;
    if (!linea.startsWith('|')) {
      if (enTabla) break;
      continue;
    }
    enTabla = true;
    const celdas = linea.split('|').slice(1, -1).map((c) => c.trim());
    if (celdas[0] === '#' || /^-+$/.test(celdas[0].replace(/:/g, ''))) continue;
    assert.equal(celdas.length, 7, `una fila con ${celdas.length} columnas: ${linea.slice(0, 80)}`);
    const [numero, condicion, estado, evidencia, parte, dueno, fecha] = celdas;
    filas.push({ numero: Number(numero), condicion, estado: estado.replace(/\*/g, ''), evidencia, parte, dueno, fecha });
  }
  return filas;
}

/** Las rutas citadas entre comillas invertidas que parecen un archivo o una carpeta del repositorio. */
const rutasCitadas = (evidencia) => [...evidencia.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((r) => /^[\w.][\w.@-]*(\/[\w.@-]+)*$/.test(r) && /[/.]/.test(r));

function leer() {
  const texto = readFileSync(DOCUMENTO, 'utf8');
  return { texto, gate: filasDe(texto, '## Las 24 condiciones del 08 §42'), extension: filasDe(texto, '## La extensión del 08 §56.9') };
}

test('TEST-UF-018 · están las 24 condiciones del §42 y las cuatro del §56.9, cada una una sola vez', () => {
  const { gate, extension } = leer();
  assert.deepEqual(gate.map((f) => f.numero), Array.from({ length: 24 }, (_, i) => i + 1));
  assert.deepEqual(extension.map((f) => f.numero), [25, 26, 27, 28]);
});

test('TEST-UF-018 · cada condición tiene su estado, su evidencia que existe o su dueño y su fecha', () => {
  const { gate, extension } = leer();
  for (const f of [...gate, ...extension]) {
    const donde = `condición ${f.numero}`;
    assert.ok(ESTADOS.includes(f.estado), `${donde}: estado desconocido «${f.estado}»`);
    assert.ok(!SIN_VALOR.has(f.condicion), `${donde}: sin texto`);
    const rutas = rutasCitadas(f.evidencia);
    if (f.estado !== 'PENDIENTE') {
      assert.ok(rutas.length > 0, `${donde}: ${f.estado} sin una ruta de evidencia`);
      for (const r of rutas) assert.ok(existsSync(join(RAIZ, r)), `${donde}: la evidencia \`${r}\` no existe`);
    }
    if (f.estado === 'CON EVIDENCIA') continue;
    assert.ok(!SIN_VALOR.has(f.dueno), `${donde}: ${f.estado} sin dueño`);
    assert.match(f.fecha, FECHA, `${donde}: ${f.estado} sin fecha (AAAA-MM-DD)`);
  }
});

test('TEST-UF-018 · el resumen cuenta lo mismo que las filas, y con algo sin cumplir el gate está cerrado', () => {
  const { texto, gate, extension } = leer();
  const filas = [...gate, ...extension];
  const cuenta = (estado) => filas.filter((f) => f.estado === estado).length;
  const resumen = texto.match(/\*\*Resumen:\*\* (\d+) con evidencia, (\d+) en el PR, (\d+) parciales y (\d+) pendientes/);
  assert.ok(resumen, 'falta la línea del resumen');
  assert.deepEqual(resumen.slice(1).map(Number), ESTADOS.map(cuenta));
  if (filas.some((f) => f.estado !== 'CON EVIDENCIA')) assert.match(texto, /El gate está cerrado/);
});

test('TEST-UF-018 · condición 18: ningún package.json depende de un SDK de IA externa', () => {
  const PROHIBIDAS = /^(openai|@anthropic-ai\/.+|@google\/generative-ai|@google\/genai|langchain|@langchain\/.+|cohere-ai|@mistralai\/.+)$/;
  const paquetes = ['package.json', ...['apps', 'packages'].flatMap((d) => readdirSync(join(RAIZ, d)).map((p) => join(d, p, 'package.json')))].filter((p) => existsSync(join(RAIZ, p)));
  assert.ok(paquetes.length >= 4, 'se leen el package.json de la raíz, la API, el website, la APK y el dominio');
  for (const p of paquetes) {
    const j = JSON.parse(readFileSync(join(RAIZ, p), 'utf8'));
    const deps = Object.keys({ ...j.dependencies, ...j.devDependencies, ...j.optionalDependencies, ...j.peerDependencies });
    for (const d of deps) assert.doesNotMatch(d, PROHIBIDAS, `${p} depende de ${d}`);
  }
});
