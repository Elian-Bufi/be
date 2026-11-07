/**
 * TEST-TAG-032 · el guardián de las peticiones al abrir (WP-TABLERO-ALTA-GAMA §6, TA-30), sin navegador:
 *  1. lo medido se compara con la tabla de `EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/peticiones.mjs`: una cuenta que sube
 *     o baja, una página que no está en la tabla o una de la tabla que no se midió dan una diferencia;
 *  2. la espera da la página por abierta solo con la API quieta (ninguna en curso y ninguna nueva en la quietud), y no
 *     se corta por una pausa más corta que la quietud entre dos tandas de lecturas;
 *  3. toda página que capturan las herramientas está en la tabla.
 * La corrida con el navegador está en `capturas.mjs` (la CI, `capturas-del-tablero`).
 *
 * Uso: node --test scripts/guardian-de-peticiones.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const { diferenciasDePeticiones, esperarLaQuietud, PETICIONES_AL_ABRIR, QUIETUD_MS } = await import('../EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/peticiones.mjs');

const TABLA = { 'sofia-paz/espacio': 5, 'sofia-paz/resumen': 18 };
const medidas = (resumen, extra = {}) => [
  { profesional: 'sofia-paz', pagina: 'espacio', peticionesAlAbrir: 5, asentada: true },
  { profesional: 'sofia-paz', pagina: 'resumen', peticionesAlAbrir: resumen, asentada: true, ...extra },
];

test('TEST-TAG-032 · con la cuenta de la tabla no hay diferencias; una lectura de más o de menos, sí', () => {
  assert.deepEqual(diferenciasDePeticiones(medidas(18), TABLA), []);
  assert.deepEqual(diferenciasDePeticiones(medidas(19), TABLA), ['sofia-paz/resumen: suben de 18 a 19 sin aviso']);
  assert.deepEqual(diferenciasDePeticiones(medidas(24), TABLA), ['sofia-paz/resumen: suben de 18 a 24 sin aviso']);
  assert.deepEqual(diferenciasDePeticiones(medidas(17), TABLA), ['sofia-paz/resumen: bajan de 18 a 17 sin aviso']);
});

test('TEST-TAG-032 · una página que se cuenta por indicador espera sus fijas más los indicadores que mostró', () => {
  const tabla = { 'martin-acosta/resumen': { fijas: 12, porIndicador: true } };
  const pagina = (peticiones, indicadores) => [{ profesional: 'martin-acosta', pagina: 'resumen', peticionesAlAbrir: peticiones, asentada: true, indicadores }];
  assert.deepEqual(diferenciasDePeticiones(pagina(14, 2), tabla), [], 'dos indicadores: 14');
  assert.deepEqual(diferenciasDePeticiones(pagina(15, 3), tabla), [], 'tres indicadores: 15');
  assert.deepEqual(diferenciasDePeticiones(pagina(16, 3), tabla), ['martin-acosta/resumen: suben de 15 a 16 sin aviso'], 'una lectura de más se sigue viendo');
  assert.deepEqual(diferenciasDePeticiones(pagina(15, undefined), tabla), ['martin-acosta/resumen: la tabla la cuenta por indicador, y la página no anotó cuántos mostró']);
});

test('TEST-TAG-032 · una página fuera de la tabla, una de la tabla sin medir y una que no asentó fallan', () => {
  const sinTabla = [...medidas(18), { profesional: 'sofia-paz', pagina: 'cajon', peticionesAlAbrir: 2, asentada: true }];
  assert.deepEqual(diferenciasDePeticiones(sinTabla, TABLA), ['sofia-paz/cajon: 2 peticiones, y la página no está en la tabla']);
  assert.deepEqual(diferenciasDePeticiones(medidas(18).slice(0, 1), TABLA), ['sofia-paz/resumen: está en la tabla y no se midió']);
  const [d] = diferenciasDePeticiones(medidas(18, { asentada: false }), TABLA);
  assert.match(d, /^sofia-paz\/resumen: la API no quedó quieta/);
});

/** Un reloj de mentira: la espera avanza el tiempo en lugar de dormir. */
function reloj() {
  let t = 0;
  return { ahora: () => t, pausa: async (ms) => void (t += ms), avanzar: (ms) => void (t += ms) };
}

test('TEST-TAG-032 · la espera sigue mientras hay una lectura en curso o una nueva antes de la quietud', async () => {
  const r = reloj();
  // Una tanda termina en 0; la siguiente empieza a los 900 (menos que la quietud) y termina a los 1200.
  const estado = () => {
    const t = r.ahora();
    if (t < 900) return { enCurso: 0, ultima: 0 };
    if (t < 1200) return { enCurso: 1, ultima: 900 };
    return { enCurso: 0, ultima: 1200 };
  };
  assert.equal(await esperarLaQuietud(estado, { ahora: r.ahora, pausa: r.pausa }), true);
  // No se dio por quieta a los 1500 (quietud desde la primera tanda): esperó la segunda y su quietud.
  assert.ok(r.ahora() >= 1200 + QUIETUD_MS, `terminó a los ${r.ahora()}`);
});

test('TEST-TAG-032 · con una lectura que no termina, la espera se corta y lo dice', async () => {
  const r = reloj();
  assert.equal(await esperarLaQuietud(() => ({ enCurso: 1, ultima: 0 }), { ahora: r.ahora, pausa: r.pausa, maximo: 5000 }), false);
});

test('TEST-TAG-032 · toda página que capturan las herramientas está en la tabla', () => {
  const capturas = readFileSync(new URL('../EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs', import.meta.url), 'utf8');
  const bloque = capturas.slice(capturas.indexOf('const PAGINAS = {'), capturas.indexOf('const NOMBRES = {'));
  const nombres = { PRO_N: 'sofia-paz', PRO_T: 'martin-acosta' };
  const claves = [];
  let quien = null;
  for (const linea of bloque.split('\n')) {
    const p = /^\s+(PRO_[A-Z]+): \[/.exec(linea);
    if (p) quien = nombres[p[1]];
    const pagina = /^\s+\['([a-z-]+)', '\//.exec(linea);
    if (pagina && quien) claves.push(`${quien}/${pagina[1]}`);
  }
  assert.ok(claves.length >= 12, `se leyeron ${claves.length} páginas`);
  assert.deepEqual([...claves].sort(), Object.keys(PETICIONES_AL_ABRIR).sort());
});
