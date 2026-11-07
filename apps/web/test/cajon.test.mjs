/**
 * WP-TABLERO-ALTA-GAMA TB-12 (DL-163 D-4) · el cajón «De a una», sin React (`src/app/pro/cajon.ts`) y con una mirada al
 * componente (`cajon-de-a-una.tsx`):
 *  1. TEST-TAG-009 · el cajón lee y no escribe: el componente solo lee (el resumen de la persona y lo nuevo desde la
 *     revisión), no arma claves de idempotencia, saltear no llama a la API y Enter no tiene atajo.
 *  2. TEST-TAG-009 · la cola sigue la vista elegida, y el lugar que se guarda para volver son identificadores, sin nombres.
 *  3. El cierre es un comprobante: sin cuentas ni festejos; y los textos pasan la prueba de términos de la cartera.
 *  4. El interruptor: sin `BE_CAJON_DE_A_UNA=si`, el cajón está apagado.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const { CAJON_DE_A_UNA, COPY_CAJON, dondeSigue, fichaDe, lugarLeido, lugarParaGuardar, salidaPrincipal, VIGENCIA_DEL_LUGAR_MS } = await import('../src/app/pro/cajon.ts');
const { claveDelPendiente, colaDeLaVista, porPersona } = await import('../src/app/pro/mesa.ts');
const { rutaQueResuelve } = await import('../src/app/pro/pendiente-en-una-fila.ts');
const { terminosProhibidosDeCarteraEn, TIPOS_DE_PENDIENTE } = await import('@be/domain');

const COMPONENTE = readFileSync(new URL('../src/app/pro/cajon-de-a-una.tsx', import.meta.url), 'utf8');
const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const fila = (persona, kind, domain, extra = {}) => ({
  kind,
  domain,
  since: null,
  daysOverdue: null,
  daysUntil: null,
  lastActivityAt: null,
  relationshipId: ID(900 + persona),
  open: { view: kind.startsWith('REVIEW') ? 'revisiones' : 'planes' },
  advisee: { identityId: ID(persona), displayName: `Persona ${persona}` },
  ...extra,
});

test('TEST-TAG-009 · el cajón solo lee: el resumen de la persona y lo nuevo desde la revisión', () => {
  const llamadas = new Set([...COMPONENTE.matchAll(/\bapi\.(\w+)\(/g)].map((m) => m[1]));
  assert.deepEqual([...llamadas].sort(), ['consultarDashboard', 'lineaDeTiempo']);
  assert.doesNotMatch(COMPONENTE, /nuevaClaveDeIdempotencia|Idempotency|method: 'POST'|'PUT'|'DELETE'/);
});

test('TEST-TAG-009 · saltear no llama a la API, y Enter no tiene atajo: J, K y S, y Escape lo cierra el diálogo', () => {
  const saltear = COMPONENTE.slice(COMPONENTE.indexOf('const saltear = () => {'), COMPONENTE.indexOf('/** Al salir por una salida'));
  assert.ok(saltear.length > 0);
  assert.doesNotMatch(saltear, /api\./);
  const teclas = COMPONENTE.slice(COMPONENTE.indexOf('const alTeclear'), COMPONENTE.indexOf('const quien ='));
  assert.deepEqual([...teclas.matchAll(/tecla === '(\w+)'/g)].map((m) => m[1]), ['j', 'k', 's']);
  assert.doesNotMatch(teclas, /enter/i);
  // Las teclas se escuchan en el diálogo: solo con el foco adentro.
  assert.match(COMPONENTE, /<dialog[^>]*onKeyDown=\{alTeclear\}/);
});

test('TEST-TAG-009 · la cola sigue la vista elegida: por persona, el agrupado; por pendiente, el orden de DL-107', () => {
  const filas = [fila(2, 'REVIEW_OVERDUE', 'nutrition', { daysOverdue: 9 }), fila(1, 'REVIEW_OVERDUE', 'training', { daysOverdue: 2 }), fila(2, 'NO_ACTIVE_PLAN', 'training'), fila(1, 'PLAN_DRAFT_PENDING', 'nutrition', { since: '2026-10-01' })];
  assert.deepEqual(colaDeLaVista(filas, 'pendiente'), filas);
  assert.deepEqual(colaDeLaVista(filas, 'persona'), porPersona(filas).flatMap((p) => p.pendientes));
  assert.deepEqual(colaDeLaVista(filas, 'persona').map((p) => p.advisee.identityId), [ID(2), ID(2), ID(1), ID(1)]);
});

test('TEST-TAG-009 · el lugar guarda identificadores, sin nombres, y la cola sigue con el siguiente que quede', () => {
  const cola = [fila(1, 'REVIEW_OVERDUE', 'nutrition'), fila(2, 'NO_ACTIVE_PLAN', 'training'), fila(3, 'ANTHRO_DRAFT_PENDING', 'anthropometry')].map(claveDelPendiente);
  const lugar = lugarParaGuardar(cola, 0, [cola[1]], 1000);
  const guardado = JSON.stringify(lugar);
  assert.doesNotMatch(guardado, /Persona|displayName|nombre/);
  assert.deepEqual(lugarLeido(guardado, 2000), lugar);
  // Algo que no es un identificador (un nombre) no se guarda.
  assert.equal(lugarParaGuardar(['REVIEW_OVERDUE|nutrition|Diego Sosa'], 0, [], 1000), null);
  // Viejo, roto o del futuro: no se retoma.
  assert.equal(lugarLeido(guardado, 1000 + VIGENCIA_DEL_LUGAR_MS + 1), null);
  assert.equal(lugarLeido('{roto', 2000), null);
  assert.equal(lugarLeido(guardado, 999), null);
  // Se resolvió el primero: la cola nueva no lo tiene, y sigue con el segundo. Si se resolvieron todos, el cierre.
  assert.equal(dondeSigue(lugar, [cola[1], cola[2]]), 0);
  assert.equal(dondeSigue({ ...lugar, indice: 1 }, [cola[0], cola[2]]), 1);
  assert.equal(dondeSigue({ ...lugar, indice: 2 }, cola), null);
  assert.equal(dondeSigue(lugar, []), null);
});

test('cada pendiente tiene su pregunta y su salida, que lleva a la misma pantalla que el verbo de la fila', () => {
  for (const kind of TIPOS_DE_PENDIENTE) assert.match(COPY_CAJON.pregunta({ kind, domain: 'nutrition' }), /^¿.+\?$/);
  const revision = fila(1, 'REVIEW_OVERDUE', 'nutrition');
  assert.deepEqual(salidaPrincipal(revision, rutaQueResuelve(revision)), { texto: 'Preparar la revisión', href: `/pro/advisees/nutrition?id=${ID(1)}&vista=revisiones&preparar=1` });
  assert.deepEqual(salidaPrincipal(fila(2, 'NO_ACTIVE_PLAN', 'training'), rutaQueResuelve(fila(2, 'NO_ACTIVE_PLAN', 'training'))), { texto: 'Empezar el plan', href: `/pro/advisees/training?id=${ID(2)}&vista=planes` });
  assert.equal(fichaDe(revision), `/pro/advisees?id=${ID(1)}`);
});

test('el cierre es un comprobante, sin cuentas ni festejos, y los textos pasan la prueba de términos de la cartera', () => {
  assert.doesNotMatch(COPY_CAJON.fin, /\d|¡|!|felicit|genial|bien hecho|complet/i);
  const textos = Object.values(COPY_CAJON).flatMap((v) => (typeof v === 'function' ? [] : [v]));
  textos.push(COPY_CAJON.posicion(1, 3), ...TIPOS_DE_PENDIENTE.map((kind) => COPY_CAJON.pregunta({ kind, domain: 'training' })));
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeCarteraEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px/i, t);
  }
  // Sin tachados en el cierre.
  assert.doesNotMatch(COMPONENTE, /line-through|<s>|<del>/);
});

test('el interruptor: sin la variable de la compilación, el cajón está apagado', () => {
  assert.equal(process.env.BE_CAJON_DE_A_UNA === 'si', CAJON_DE_A_UNA);
  if (process.env.BE_CAJON_DE_A_UNA === undefined) assert.equal(CAJON_DE_A_UNA, false);
});
