/**
 * DL-116 · guardia de trazabilidad de las operaciones del contrato (`packages/domain/src/openapi.ts`) frente al 09.
 *
 * Un ID del 09 nombra una sola operación. Si BE reusa ese ID para otra cosa, un conteo por ID da por hecha una operación
 * que no existe: pasó con API-DSH-04, que en el 09 es la línea temporal y en BE nombraba «Pendientes» (DL-116).
 * Esta guardia lee el 09 (solo lectura: el legajo está en el manifiesto y no se toca) y exige:
 * 1. una operación con un ID del inventario P0 del 09 tiene el método y la ruta que el 09 le da;
 * 2. una operación con un ID que no está en el inventario es una extensión declarada de BE, con una familia propia
 *    (TPL, TPN, HAB, HAN, CAR, REC, MED, ING, SER, EJE, TIE, EVI), con un sufijo sobre un ID del 09 (LISTA, PROPIA, PERIODO) o con un ID P1 que el 09
 *    nombra, y cita su fuente;
 * 3. ningún ID se repite.
 * Requiere `npm run build:domain` antes.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const DOCS_DEL_09 = [path.join(RAIZ, 'docs/legajo/09_BE_LEG_09_v0.16.1.md'), ...fs.readdirSync(path.join(RAIZ, 'docs/legajo/09_AUX')).filter((f) => f.endsWith('.md')).map((f) => path.join(RAIZ, 'docs/legajo/09_AUX', f))];
const INVENTARIO = path.join(RAIZ, 'docs/legajo/09_AUX/INVENTARIO_API_P0_BE_LEG_09_v0.16.1_122_OPERACIONES_2026-09-07.md');
const { OPERACIONES } = require(path.join(RAIZ, 'packages/domain/dist/openapi.js'));

/** Las familias propias de BE, cada una con la DL que la declara. */
const FAMILIAS_DE_BE = { TPL: 'DL-108', TPN: 'DL-108', HAB: 'DL-109', HAN: 'DL-109', CAR: 'DL-107 y DL-116', REC: 'DL-119', MED: 'DL-120', ING: 'DL-121', SER: 'DL-122', EJE: 'DL-123', TIE: 'DL-124', EVI: 'DL-125' };
/** Los sufijos de BE sobre un ID del 09: una variante de esa operación (la lista propia, lo propio, por período). */
const SUFIJOS_DE_BE = ['LISTA', 'PROPIA', 'PERIODO'];

const normalizar = (ruta) => ruta.replace(/^\/api\/v1/, '').replace(/\?.*$/, '').replace(/\{[^}]+\}/g, '{}').replace(/\/$/, '');

/**
 * id → [{ metodo, ruta, fuente }] desde los encabezados de operación del 09 y el primer bloque http que los sigue. Si el
 * 09 solo nombra la operación en una tabla de trazabilidad, se toma de ahí.
 */
function rutasDel09() {
  const rutas = new Map();
  const encabezado = /^#+\s+(?:[0-9.]+\s+)?`?(API-[A-Z]+(?:-[A-Z0-9]+)?-\d{2})`?(?:\s+—.*)?\s*$/;
  for (const archivo of DOCS_DEL_09) {
    const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
    for (let i = 0; i < lineas.length; i++) {
      const m = lineas[i].match(encabezado);
      if (!m) continue;
      for (let j = i + 1; j < Math.min(lineas.length, i + 40); j++) {
        if (encabezado.test(lineas[j])) break;
        if (!lineas[j].startsWith('```http')) continue;
        const r = (lineas[j + 1] || '').match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/);
        if (r) {
          if (!rutas.has(m[1])) rutas.set(m[1], []);
          rutas.get(m[1]).push({ metodo: r[1].toLowerCase(), ruta: normalizar(r[2]), fuente: `${path.basename(archivo)}:${j + 2}` });
        }
        break;
      }
    }
    // Una operación que el 09 solo nombra en una tabla de trazabilidad («API-CRD-01 · POST /advisees/{id}/…»).
    for (const [i, linea] of lineas.entries()) {
      for (const m of linea.matchAll(/(API-[A-Z]+(?:-[A-Z0-9]+)?-\d{2}) · (GET|POST|PUT|PATCH|DELETE) (\/\S+?)[;|]/g)) {
        if (rutas.has(m[1])) continue;
        rutas.set(m[1], [{ metodo: m[2].toLowerCase(), ruta: normalizar(m[3]), fuente: `${path.basename(archivo)}:${i + 1}` }]);
      }
    }
  }
  return rutas;
}

const inventario = new Set([...fs.readFileSync(INVENTARIO, 'utf8').matchAll(/`(API-[A-Z-]+-\d{2})`/g)].map((m) => m[1]));
const del09 = rutasDel09();

test('el inventario del 09 tiene 122 operaciones y de cada una se lee su ruta', () => {
  assert.equal(inventario.size, 122);
  const sinRuta = [...inventario].filter((id) => !del09.has(id));
  assert.deepEqual(sinRuta, [], `sin ruta en el 09: ${sinRuta.join(', ')}`);
});

test('una operación con un ID del 09 tiene el método y la ruta que el 09 le da (DL-116)', () => {
  const choques = [];
  for (const op of OPERACIONES.filter((o) => inventario.has(o.id))) {
    const rutas = del09.get(op.id);
    const propia = { metodo: op.metodo, ruta: normalizar(op.ruta) };
    if (!rutas.some((r) => r.metodo === propia.metodo && r.ruta === propia.ruta)) {
      choques.push(`${op.id}: el contrato dice ${propia.metodo.toUpperCase()} ${propia.ruta}; el 09, ${rutas.map((r) => `${r.metodo.toUpperCase()} ${r.ruta} (${r.fuente})`).join(' o ')}`);
    }
  }
  assert.deepEqual(choques, [], choques.join('\n'));
});

test('un ID fuera del inventario es una extensión declarada de BE y cita su fuente', () => {
  const sinDeclarar = [];
  for (const op of OPERACIONES.filter((o) => !inventario.has(o.id))) {
    const familia = op.id.match(/^API-([A-Z]+)-\d{2}$/);
    const sufijo = op.id.match(/^(API-[A-Z]+-\d{2})-([A-Z]+)$/);
    const p1 = /^API-[A-Z]+-P1-\d{2}$/.test(op.id) && del09.has(op.id);
    const declarada = (familia && familia[1] in FAMILIAS_DE_BE) || (sufijo && inventario.has(sufijo[1]) && SUFIJOS_DE_BE.includes(sufijo[2])) || p1;
    if (!declarada || !op.fuente || !op.fuente.trim()) sinDeclarar.push(op.id);
  }
  assert.deepEqual(sinDeclarar, [], `extensiones sin declarar: ${sinDeclarar.join(', ')}`);
});

test('ningún ID de operación se repite', () => {
  const vistos = new Set();
  const repetidos = OPERACIONES.map((o) => o.id).filter((id) => (vistos.has(id) ? true : (vistos.add(id), false)));
  assert.deepEqual(repetidos, []);
});
