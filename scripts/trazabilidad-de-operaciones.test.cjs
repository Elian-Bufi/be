/**
 * DL-116 · guardia de trazabilidad de las operaciones del contrato (`packages/domain/src/openapi.ts`) frente al 09.
 *
 * Un ID del 09 nombra una sola operación. Si BE reusa ese ID para otra cosa, un conteo por ID da por hecha una operación
 * que no existe: pasó con API-DSH-04, que en el 09 es la línea temporal y en BE nombraba «Pendientes» (DL-116).
 * Esta guardia lee el 09 (solo lectura: el legajo está en el manifiesto y no se toca) y exige:
 * 1. una operación con un ID del inventario P0 del 09 tiene el método y la ruta que el 09 le da;
 * 2. una operación con un ID que no está en el inventario es una extensión declarada de BE, con una familia propia
 *    (TPL, TPN, HAB, HAN, CAR, REC, MED, ING, SER, EJE, TIE, EVI, VAN, NOV, INV, GOO, ADM, ZON, FRI, HBT, PLN, PLE, RES, MFA, SOP, FZA, INC, MET, NPP), con un sufijo sobre un ID del 09 (LISTA, PROPIA, PERIODO), con un ID P1 que el 09
 *    nombra o con un ID nuevo de una familia del 09 que el 09 no usa, declarado con su DL (API-ACC-07, API-TRN-25), con o sin
 *    sufijo, y cita su fuente;
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

/**
 * Las familias propias de BE, cada una con la DL que la declara.
 * AGE (DL-137): la agenda del día del titular, una operación propia porque «Hoy» no cambia de forma.
 * GOO (DL-138): el 09 solo bosqueja el acceso con Google («Google federated authorize/complete — P1», 09 §12 y 09v12 §11)
 * sin IDs; BE verifica el ID token que el cliente obtuvo de Google, y lo declara como familia propia.
 * ZON (DL-081): el 09v10 §8 describe el catálogo de las 17 zonas sin un ID de operación; BE declara su descubrimiento.
 * FRI (DL-164): los formularios de inicio con tipos nuevos y la propuesta del profesional que la persona confirma; el 09
 * §22 no tiene esas operaciones, y las de FRM quedan como están para las APK instaladas (DL-152; DL-137 D-7).
 * HBT (DL-165 D-9, FR-10): los hábitos de la persona y la autorización para compartirlos con sus profesionales; el 09 no
 * las tiene. El diseño las llamaba HAB, que ya es «Mis habituales» de DL-109: repetir la familia es lo que esta guardia
 * frena (D-14).
 * PLN y PLE (DL-163 D-17 a D-21; WP-TABLERO-ALTA-GAMA §4.4 y §4.5): planificar Nutrición y Entrenamiento desde el
 * escritorio profesional; el 09 no las tiene. La primera de cada una es descartar un borrador que nunca se activó (D-21,
 * TB-47: API-PLN-07 y API-PLE-05). No chocan con HAB ni con HBT.
 * RES (DL-163 D-13, ampliada por Dirección el 2026-11-07; WP-TABLERO-ALTA-GAMA §4.3, TB-52 a TB-56): lo que la persona
 * comparte de otras áreas, el plan del otro y el pedido de verlo; el 09 no la tiene.
 * MFA (DL-169, UF-11 de WP-USO-FINAL): el segundo factor del profesional sobre su sesión común (08 §25 y §42, condición 6);
 * el 09 solo lo nombra como política (MFA_REQUIRED, 09v7 §4.3) y el de Administración es la familia ADM.
 * SOP (DL-169, UF-07 de WP-USO-FINAL): el canal de ayuda y contacto, leído de la configuración; el 09 no lo tiene, y las
 * incidencias de RF-068 (09 v0.12 §16) quedan afuera.
 * FZA (DL-171, ED-72 de WP-EDITORES-PROFESIONAL): la serie observada por el profesional, con su estimación Epley v1; el 09
 * no la tiene (09v10:356 no fija una fórmula, y DL-171 registra la decisión de Dirección que lo enmienda sin tocar el legajo).
 * Las prescripciones y los repartos habituales de ED-13 (API-HAB-06 a 08 y API-HAN-06 a 08) siguen en HAB y HAN (DL-109),
 * extendidas por DL-167.
 * INC y MET (DL-172, pedido de Dirección del 2026-11-13): las incidencias de RF-068 y los métodos de acceso de RF-004. El 09
 * v0.12 los bosqueja como superficies candidatas (§16 y §12), con rutas y sin IDs; BE las declara como familias propias y
 * conserva las rutas del bosquejo (las de Administración, bajo /admin).
 * NPP (DL-173, PG-16 de WP-PULIDO-GRANDES, con PG-D11 aprobada por Dirección el 2026-11-14): las notas propias del
 * profesional sobre una persona, que solo lee su autor. El 09 no las tiene; no son la nota de coordinación (API-CRD-01),
 * que se manda a otros profesionales.
 */
const FAMILIAS_DE_BE = { TPL: 'DL-108', TPN: 'DL-108', HAB: 'DL-109', HAN: 'DL-109', CAR: 'DL-107 y DL-116', REC: 'DL-119', MED: 'DL-120', ING: 'DL-121', SER: 'DL-122', EJE: 'DL-123', TIE: 'DL-124', EVI: 'DL-125', VAN: 'DL-128', NOV: 'DL-133', INV: 'DL-136', AGE: 'DL-137', GOO: 'DL-138', ADM: 'DL-155', ZON: 'DL-081', FRI: 'DL-164', HBT: 'DL-165', PLN: 'DL-163', PLE: 'DL-163', RES: 'DL-163', MFA: 'DL-169', SOP: 'DL-169', FZA: 'DL-171', INC: 'DL-172', MET: 'DL-172', NPP: 'DL-173' };
/**
 * HIA (DL-175, WP-HISTORIA-ANTERIOR; decidido por Dirección el 2026-11-15): la historia anterior de un área, para el
 * profesional nuevo, con el permiso de la persona (08 §14.1, «Cambio de profesional»; REG-06-55; RF-025). El 09 no la tiene,
 * y no es HAN (los habituales de Nutrición, DL-109) ni RES (lo de otras áreas, DL-163). Se declara aparte de la lista para
 * que se integre sin pisar a otra familia que se sume en paralelo.
 */
FAMILIAS_DE_BE.HIA = 'DL-175';
/**
 * CMP (DL-176, WP-COMPARTIR; decidido por Dirección el 2026-11-15): compartir casi por omisión, con una sola pantalla de
 * consentimiento al aceptar el vínculo y un toque que escribe todo lo elegido. El 09 no la tiene, y no es RES, HBT ni HIA:
 * agrupa sus actos en una transacción y les suma el A3 y el B2.
 */
FAMILIAS_DE_BE.CMP = 'DL-176';
/**
 * CTX (DL-179, WP-CONTEXTO-DE-LA-PERSONA; decidido por Dirección el 2026-11-18): las lecturas del panel «Contexto de
 * <nombre>» que BE no tenía (las respuestas propias, vigentes, y el cuerpo, propio o por el resumen compartido). El 09 no la
 * tiene, y no es FRI (los formularios para la persona), RES (lo de otras áreas) ni ANT.
 */
FAMILIAS_DE_BE.CTX = 'DL-179';
/**
 * ALI (DL-180, WP-NUTRICION-ALIMENTOS; aprobado por Dirección el 2026-11-16): los alimentos que un profesional carga a mano
 * (corregirlos con versiones, retirarlos y consultarlos por su identidad) y su revisión por Administración (certificarlos,
 * marcarlos como equivalentes de uno verificado). El 09 no la tiene: no es NUT ni INT-NUT, que cargan y buscan, ni ADM,
 * que administra profesionales. Se declara aparte de la lista para que se integre sin pisar a otra familia en paralelo.
 */
FAMILIAS_DE_BE.ALI = 'DL-180';
/**
 * Los sufijos de BE sobre un ID del 09: una variante de esa operación (la lista propia, lo propio, por período, la
 * búsqueda con el texto en el cuerpo, DL-127, la reanudación de la sesión del website, DL-147, y la evidencia resuelta
 * de una revisión, DL-154).
 */
const SUFIJOS_DE_BE = ['LISTA', 'PROPIA', 'PERIODO', 'BUSQUEDA', 'REANUDACION', 'EVIDENCIA', 'DESCARGA'];
/**
 * Las operaciones que el 09 define fuera del inventario P0, con su ruta, y que BE implementa tal cual, cada una con la DL
 * que la trae: los derechos del titular y la exportación propia (09 v0.12 §14 y §15; UF-06 de WP-USO-FINAL, DL-169). La
 * guardia exige que tengan el método y la ruta que el 09 les da. DESCARGA (DL-169) es la descarga firmada de API-EXP-02.
 */
const IDS_DEL_09_FUERA_DEL_INVENTARIO = { 'API-RGT-01': 'DL-169', 'API-RGT-02': 'DL-169', 'API-RGT-03': 'DL-169', 'API-EXP-01': 'DL-169', 'API-EXP-02': 'DL-169' };
/**
 * Los IDs nuevos dentro de una familia del 09 que el 09 no usa, cada uno con la DL que lo declara. El 09 tiene API-ACC-01
 * a 06 y las P1; DL-169 (WP-USO-FINAL, UF-D4, ratificada por Dirección el 2026-11-11) suma API-ACC-07, «Lo que falta para
 * seguir», y API-ACC-08, «Aceptar la versión vigente» de los términos o de la privacidad (UF-05). DL-173 (PG-15 de
 * WP-PULIDO-GRANDES, con PG-D10 aprobada por Dirección el 2026-11-14) suma API-TRN-25, la nota para el profe al finalizar
 * la sesión: el 09 llega a API-TRN-24. Sus variantes (LISTA y PROPIA) son sufijos sobre ese ID. La guardia exige además
 * que el 09 no tenga ese ID: si lo usara, serían dos operaciones con el mismo nombre.
 */
const IDS_NUEVOS_EN_FAMILIAS_DEL_09 = { 'API-ACC-07': 'DL-169', 'API-ACC-08': 'DL-169', 'API-ACC-09': 'DL-169', 'API-TRN-25': 'DL-173' };

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
    const nuevoEnFamiliaDel09 = op.id in IDS_NUEVOS_EN_FAMILIAS_DEL_09 && !del09.has(op.id);
    const del09FueraDelInventario = op.id in IDS_DEL_09_FUERA_DEL_INVENTARIO && del09.has(op.id);
    const baseDelSufijo = sufijo && (inventario.has(sufijo[1]) || sufijo[1] in IDS_DEL_09_FUERA_DEL_INVENTARIO || sufijo[1] in IDS_NUEVOS_EN_FAMILIAS_DEL_09);
    const declarada = (familia && familia[1] in FAMILIAS_DE_BE) || (baseDelSufijo && SUFIJOS_DE_BE.includes(sufijo[2])) || p1 || nuevoEnFamiliaDel09 || del09FueraDelInventario;
    if (!declarada || !op.fuente || !op.fuente.trim()) sinDeclarar.push(op.id);
  }
  assert.deepEqual(sinDeclarar, [], `extensiones sin declarar: ${sinDeclarar.join(', ')}`);
});

test('ningún ID de operación se repite', () => {
  const vistos = new Set();
  const repetidos = OPERACIONES.map((o) => o.id).filter((id) => (vistos.has(id) ? true : (vistos.add(id), false)));
  assert.deepEqual(repetidos, []);
});

test('un ID nuevo en una familia del 09 es uno que el 09 no usa, y está en el contrato (DL-169)', () => {
  for (const [id, dl] of Object.entries(IDS_NUEVOS_EN_FAMILIAS_DEL_09)) {
    assert.equal(del09.has(id), false, `${id} (${dl}) ya es una operación del 09`);
    assert.equal(inventario.has(id), false, `${id} (${dl}) está en el inventario P0 del 09`);
    assert.ok(OPERACIONES.some((o) => o.id === id && o.fuente.includes(dl)), `${id} no está en el contrato o no cita ${dl}`);
  }
});

test('una operación del 09 fuera del inventario tiene el método y la ruta que el 09 le da, y cita su DL (DL-169)', () => {
  const choques = [];
  for (const [id, dl] of Object.entries(IDS_DEL_09_FUERA_DEL_INVENTARIO)) {
    const op = OPERACIONES.find((o) => o.id === id);
    const rutas = del09.get(id);
    if (!op || !rutas) {
      choques.push(`${id}: ${!op ? 'no está en el contrato' : 'el 09 no la define'}`);
      continue;
    }
    if (!op.fuente.includes(dl)) choques.push(`${id}: no cita ${dl}`);
    if (!rutas.some((r) => r.metodo === op.metodo && r.ruta === normalizar(op.ruta))) {
      choques.push(`${id}: el contrato dice ${op.metodo.toUpperCase()} ${normalizar(op.ruta)}; el 09, ${rutas.map((r) => `${r.metodo.toUpperCase()} ${r.ruta}`).join(' o ')}`);
    }
  }
  assert.deepEqual(choques, [], choques.join('\n'));
});

test('ED-72 · la familia FZA cita DL-171 en cada operación y el 09 no la usa (TEST-EDP-062)', () => {
  const fza = OPERACIONES.filter((o) => o.id.startsWith('API-FZA-'));
  assert.deepEqual(fza.map((o) => o.id), ['API-FZA-01', 'API-FZA-02', 'API-FZA-03']);
  for (const o of fza) assert.ok(o.fuente.includes('DL-171'), `${o.id} no cita DL-171`);
  assert.deepEqual([...del09.keys()].filter((id) => id.startsWith('API-FZA-')), []);
});

test('PG-15 y PG-16 · API-TRN-25 y sus variantes, y la familia NPP, citan DL-173; el 09 no usa ninguno (TEST-PG-014 y TEST-PG-015)', () => {
  const notas = OPERACIONES.filter((o) => /^API-TRN-25(-|$)/.test(o.id) || o.id.startsWith('API-NPP-'));
  assert.deepEqual(notas.map((o) => o.id), ['API-TRN-25', 'API-TRN-25-LISTA', 'API-TRN-25-PROPIA', 'API-NPP-01', 'API-NPP-02', 'API-NPP-03']);
  for (const o of notas) assert.ok(o.fuente.includes('DL-173'), `${o.id} no cita DL-173`);
  assert.deepEqual([...del09.keys()].filter((id) => id.startsWith('API-NPP-') || id.startsWith('API-TRN-25')), []);
});

test('DL-175 · la familia HIA son las cuatro operaciones de la historia anterior, cada una cita DL-175 y el 09 no la usa (TEST-HA-013)', () => {
  const hia = OPERACIONES.filter((o) => o.id.startsWith('API-HIA-'));
  assert.deepEqual(hia.map((o) => o.id), ['API-HIA-01', 'API-HIA-02', 'API-HIA-03', 'API-HIA-04']);
  for (const o of hia) assert.ok(o.fuente.includes('DL-175'), `${o.id} no cita DL-175`);
  assert.deepEqual([...del09.keys()].filter((id) => id.startsWith('API-HIA-')), []);
});

test('DL-179 · la familia CTX son las dos lecturas del contexto de la persona, cada una cita DL-179 y el 09 no la usa (TEST-CTX-010)', () => {
  const ctx = OPERACIONES.filter((o) => o.id.startsWith('API-CTX-'));
  assert.deepEqual(ctx.map((o) => o.id), ['API-CTX-01', 'API-CTX-02']);
  for (const o of ctx) assert.ok(o.fuente.includes('DL-179'), `${o.id} no cita DL-179`);
  assert.deepEqual([...del09.keys()].filter((id) => id.startsWith('API-CTX-')), []);
});

test('DL-176 · la familia CMP son las tres operaciones de la pantalla única, cada una cita DL-176 y el 09 no la usa (TEST-CMP-013)', () => {
  const cmp = OPERACIONES.filter((o) => o.id.startsWith('API-CMP-'));
  assert.deepEqual(cmp.map((o) => o.id), ['API-CMP-01', 'API-CMP-02', 'API-CMP-03']);
  for (const o of cmp) assert.ok(o.fuente.includes('DL-176'), `${o.id} no cita DL-176`);
  assert.deepEqual([...del09.keys()].filter((id) => id.startsWith('API-CMP-')), []);
});
