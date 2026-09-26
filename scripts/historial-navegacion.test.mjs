/**
 * Regresión de los defectos hallados en «Tu historial» (DL-096) durante la validación en teléfono:
 *  1. Navegación: el detalle de ejecución se abre desde «Entrenamiento de hoy» y desde «Tu historial»; volver tiene que
 *     regresar al origen (`origen` en la ruta), no siempre a Hoy. Se prueban ambos orígenes; el botón Atrás de Android
 *     y el enlace visible usan la misma `anterior`.
 *  2. Fecha civil: se prueba la función de producción `fechaCivil` (formato.ts), que formatea un `YYYY-MM-DD` anclado
 *     a medianoche UTC con un formateador fijado en UTC, así día/mes/año no dependen de la zona del dispositivo. Corre
 *     en subprocesos con TZ Buenos Aires, UTC, Auckland, Kiritimati (UTC+14) y Kathmandu (UTC+05:45), en límites de
 *     mes/año y una bisiesta; exige el mismo texto en todas. Los subprocesos hacen la prueba determinista aunque la CI
 *     corra en UTC.
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

// ─── 2. Fecha civil: `fechaCivil` no desplaza el día en ninguna zona ─────────────────────────────

/** Zonas donde el anclaje ingenuo fallaba: al oeste retrocedía (UTC−3), al este muy positivo avanzaba (UTC+13/+14). */
const ZONAS = ['America/Argentina/Buenos_Aires', 'UTC', 'Pacific/Auckland', 'Pacific/Kiritimati', 'Asia/Kathmandu'];

/** Corre la función de producción `fechaCivil` sobre varias fechas, bajo una zona dada. Devuelve un arreglo alineado. */
function fechaCivilEnZona(tz, fechas) {
  const codigo = `const {fechaCivil}=await import('./apps/mobile/src/formato.ts');process.stdout.write(${JSON.stringify(fechas)}.map(fechaCivil).join('\\n'));`;
  return execFileSync(process.execPath, ['--input-type=module', '-e', codigo], { cwd: RAIZ, env: { ...process.env, TZ: tz }, encoding: 'utf8' }).split('\n');
}

// La fecha del defecto original más límites de mes, año y una bisiesta. `esperaDia` es el número de día civil que debe mostrarse.
const CASOS = [
  { fecha: '2026-09-25', esperaDia: '25', anio: '2026' }, // el caso reportado
  { fecha: '2026-08-31', esperaDia: '31', anio: '2026' }, // fin de mes
  { fecha: '2026-09-01', esperaDia: '1', anio: '2026' }, // inicio de mes
  { fecha: '2026-12-31', esperaDia: '31', anio: '2026' }, // fin de año
  { fecha: '2027-01-01', esperaDia: '1', anio: '2027' }, // inicio de año
  { fecha: '2024-02-29', esperaDia: '29', anio: '2024' }, // bisiesto
];

test('`fechaCivil` conserva el día civil en toda zona (Buenos Aires, UTC, extremos positivos), en límites de mes/año y bisiesto', () => {
  const porZona = Object.fromEntries(ZONAS.map((tz) => [tz, fechaCivilEnZona(tz, CASOS.map((c) => c.fecha))]));
  const referencia = porZona['UTC'];
  for (const tz of ZONAS) {
    // Independiente de zona: el mismo texto en todas.
    assert.deepEqual(porZona[tz], referencia, `«${tz}» difiere de UTC: ${JSON.stringify(porZona[tz])}`);
    CASOS.forEach((c, i) => {
      const salida = porZona[tz][i];
      assert.ok(salida.startsWith(c.esperaDia), `${c.fecha} en ${tz}: esperaba día ${c.esperaDia}, vino «${salida}»`);
      assert.ok(salida.includes(c.anio), `${c.fecha} en ${tz}: esperaba año ${c.anio}, vino «${salida}»`);
    });
  }
});
