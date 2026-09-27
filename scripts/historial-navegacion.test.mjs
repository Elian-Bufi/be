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
 *  3. Período: `ultimosDiasEnZona` (formato.ts) calcula los últimos 90 días civiles en la zona con la que la API resuelve
 *     «hoy» (America/Argentina/Buenos_Aires). Con `toISOString()`, de 21 a 24 h en Buenos Aires se pedía «mañana» y la
 *     API respondía 400 PERIOD_IN_FUTURE. Se prueba el instante observado en la validación de la 0.11.1, con varias zonas
 *     de dispositivo y en límites de mes y año.
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

// ─── 3. Período de «Tu historial»: fechas civiles en la zona de la API, no en UTC ────────────────
// Validación en teléfono de la 0.11.1 (2026-09-26, 21:04 en Buenos Aires = 00:04 UTC del 27): la pantalla calculaba el
// período con `toISOString()`, pedía periodEnd=2026-09-27 y la API (que resuelve «hoy» en America/Argentina/Buenos_Aires)
// respondía 400 PERIOD_IN_FUTURE. «Sesiones registradas» mostraba «No pudimos cargar esta vista» de 21 a 24 h.

const ZONA_API = 'America/Argentina/Buenos_Aires';
const INSTANTE_OBSERVADO = '2026-09-27T00:04:00.000Z';

/** Corre `ultimosDiasEnZona` (función de producción) en un subproceso con la zona del dispositivo dada. */
function periodoEnDispositivo(tz, instante) {
  const codigo = `const {ultimosDiasEnZona}=await import('./apps/mobile/src/formato.ts');process.stdout.write(JSON.stringify(ultimosDiasEnZona(90,${JSON.stringify(ZONA_API)},new Date(${JSON.stringify(instante)}))));`;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', codigo], { cwd: RAIZ, env: { ...process.env, TZ: tz }, encoding: 'utf8' }));
}

test('reproduce la causa: a las 21:04 de Buenos Aires, la fecha UTC ya es el día siguiente (el cálculo viejo pedía el futuro)', () => {
  const hoyApi = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_API }).format(new Date(INSTANTE_OBSERVADO));
  const periodEndViejo = new Date(INSTANTE_OBSERVADO).toISOString().slice(0, 10);
  assert.equal(hoyApi, '2026-09-26');
  assert.equal(periodEndViejo, '2026-09-27');
  assert.ok(periodEndViejo > hoyApi, 'con el cálculo en UTC, periodEnd queda en el futuro para la API');
});

test('el período termina en el «hoy» de la API y cubre 90 días civiles, en cualquier zona del dispositivo', () => {
  for (const tz of ['America/Argentina/Buenos_Aires', 'UTC', 'Pacific/Kiritimati', 'America/Los_Angeles']) {
    assert.deepEqual(periodoEnDispositivo(tz, INSTANTE_OBSERVADO), { periodStart: '2026-06-29', periodEnd: '2026-09-26' }, `zona del dispositivo ${tz}`);
  }
});

test('el período respeta los límites de mes y año, y a media tarde coincide con la fecha UTC', () => {
  // 1 de marzo, 01:00 UTC = 28 de febrero, 22:00 en Buenos Aires.
  assert.deepEqual(periodoEnDispositivo('UTC', '2026-03-01T01:00:00.000Z'), { periodStart: '2025-12-01', periodEnd: '2026-02-28' });
  // 1 de enero, 02:30 UTC = 31 de diciembre, 23:30 en Buenos Aires.
  assert.equal(periodoEnDispositivo('UTC', '2027-01-01T02:30:00.000Z').periodEnd, '2026-12-31');
  // 15:00 en Buenos Aires: no hay desfase.
  assert.deepEqual(periodoEnDispositivo('UTC', '2026-09-26T18:00:00.000Z'), { periodStart: '2026-06-29', periodEnd: '2026-09-26' });
});
