/**
 * Regresión de los defectos hallados en «Tu historial» (DL-096) durante la validación en teléfono:
 *  1. Navegación: el detalle de ejecución se abre desde «Entrenamiento de hoy» y desde «Tu historial»; volver tiene que
 *     regresar al origen, no siempre a Hoy. Se prueban ambos orígenes y el botón Atrás (que usa `anterior`, igual que el
 *     enlace visible).
 *  2. Fecha: la lista formateaba la fecha civil como medianoche UTC y retrocedía un día en zonas al oeste de UTC; el
 *     detalle la ancla a mediodía UTC. La parte de fecha corre en un subproceso con TZ de Buenos Aires para reproducir
 *     el bug de forma determinista (la CI corre en UTC, donde no se manifestaría).
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nav = await import('../apps/mobile/src/navegacion.ts');

// ─── 1. Navegación: volver conserva el origen ───────────────────────────────────────────────────

test('el detalle abierto desde «Tu historial» vuelve a «Tu historial»', () => {
  assert.deepEqual(nav.anterior({ nombre: 'ejecucion-de-entrenamiento', id: 'e1', origen: 'historial' }), { nombre: 'historial-de-entrenamiento' });
});

test('el detalle abierto desde «Hoy» sigue volviendo a «Entrenamiento de hoy» (origen explícito o ausente)', () => {
  assert.deepEqual(nav.anterior({ nombre: 'ejecucion-de-entrenamiento', id: 'e1', origen: 'hoy' }), { nombre: 'entrenamiento' });
  assert.deepEqual(nav.anterior({ nombre: 'ejecucion-de-entrenamiento', id: 'e1' }), { nombre: 'entrenamiento' });
});

test('la pantalla de registro (borrador) sigue volviendo a Hoy: solo se abre desde Hoy', () => {
  assert.deepEqual(nav.anterior({ nombre: 'sesion-de-entrenamiento', draftId: 'd1', sesion: {}, fecha: '2026-09-25' }), { nombre: 'entrenamiento' });
});

test('el enlace visible de volver nombra «Tu historial» cuando el destino es el historial', () => {
  assert.equal(nav.textoDeVolverA({ nombre: 'historial-de-entrenamiento' }), 'Volver a Tu historial');
});

// ─── 2. Fecha: la fecha civil no retrocede un día ───────────────────────────────────────────────

/** Corre `dia(...)` con TZ de Buenos Aires (UTC−3), donde el bug se manifiesta. Devuelve `anclada|cruda`. */
function diaEnBuenosAires() {
  const codigo = "const {dia}=await import('./apps/mobile/src/formato.ts');process.stdout.write(dia('2026-09-25T12:00:00Z')+'|'+dia('2026-09-25'));";
  return execFileSync(process.execPath, ['--input-type=module', '-e', codigo], {
    cwd: RAIZ,
    env: { ...process.env, TZ: 'America/Argentina/Buenos_Aires' },
    encoding: 'utf8',
  });
}

test('la fecha anclada a mediodía UTC muestra el día civil correcto (25), no el anterior', () => {
  const [anclada, cruda] = diaEnBuenosAires().split('|');
  // Lo que ahora usan la lista y el detalle: el día civil real de la sesión.
  assert.ok(anclada.startsWith('25'), `esperaba día 25, vino «${anclada}»`);
  // El patrón viejo de la lista retrocedía un día: se conserva como demostración del porqué del anclaje.
  assert.ok(cruda.startsWith('24'), `el patrón sin anclar debía dar 24 en Buenos Aires, vino «${cruda}»`);
  assert.notEqual(anclada, cruda);
});
