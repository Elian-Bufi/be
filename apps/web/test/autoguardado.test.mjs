/**
 * ED-60 · El autoguardado no insiste ante un error que no se arregla solo (WP-EDITORES-PROFESIONAL; TEST-EDP-047).
 *
 * Con temporizadores falsos (node:test `mock.timers`): un rechazo permanente (demasiado grande u otro rechazo del
 * contrato) no se reintenta hasta un cambio o «Reintentar»; sin respuesta, la espera crece (4 s de pausa y después 8, 16,
 * 32 y 60 s, y cada 60 s) y vuelve a 4 s con el evento `online` o con un cambio. Con la regla de antes (un intento cada
 * 4 s después de cualquier falla), estas pruebas fallan.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mock, test } from 'node:test';

const { PlanificadorDelAutoguardado, DEMORA_DEL_AUTOGUARDADO_MS, esperaSinRespuesta } = await import('../src/lib/espera-del-autoguardado.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/**
 * Avanza el reloj falso de a un segundo: así corre también un intento que se programa dentro de otro. Con un solo salto
 * de `tick`, el reloj ya está al final cuando se programa, y queda para después.
 */
function avanzar(t, ms) {
  for (let hecho = 0; hecho < ms; hecho += 1000) t.mock.timers.tick(Math.min(1000, ms - hecho));
}

/** Un editor simulado: cuenta los intentos y responde lo que se le pide; el reloj es el falso. */
function editor(responder) {
  const intentos = [];
  const reloj = { setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t) };
  const p = new PlanificadorDelAutoguardado(() => {
    intentos.push(Date.now());
    p.pausar(); // el guardado viaja: el editor no puede guardar mientras tanto
    const r = responder(intentos.length);
    p.resultado(r);
    // Volvió la respuesta: con una falla, lo escrito sigue pendiente y el editor puede volver a guardar; guardado, no
    // queda nada pendiente (sin cambios, el editor no habilita el autoguardado).
    if (r !== 'GUARDADO') p.reanudar();
  }, reloj);
  /** Un cambio en lo escrito: el editor queda con algo pendiente y habilita el autoguardado. */
  const cambiar = () => {
    p.reanudar();
    p.cambio();
  };
  return { p, intentos, cambiar };
}

test('TEST-EDP-047 · después de DEMASIADO_GRANDE, un solo intento: ninguno más sin un cambio', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const { p, intentos, cambiar } = editor(() => 'DEMASIADO_GRANDE');
  cambiar();
  t.mock.timers.tick(DEMORA_DEL_AUTOGUARDADO_MS);
  assert.equal(intentos.length, 1, 'el primer intento, en la pausa de 4 s');
  avanzar(t, 10 * 60_000);
  assert.equal(intentos.length, 1, 'diez minutos después, sin cambios: ningún intento más');
  assert.equal(p.programado, false);
  // Un cambio lo vuelve a intentar en la pausa.
  cambiar();
  t.mock.timers.tick(DEMORA_DEL_AUTOGUARDADO_MS);
  assert.equal(intentos.length, 2);
});

test('TEST-EDP-047 · después de OTRO (un rechazo del contrato), tampoco se insiste; «Reintentar» informa su resultado', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const { p, intentos, cambiar } = editor(() => 'OTRO');
  cambiar();
  t.mock.timers.tick(DEMORA_DEL_AUTOGUARDADO_MS);
  avanzar(t, 5 * 60_000);
  assert.equal(intentos.length, 1);
  // El profesional toca «Reintentar» y vuelve a fallar igual: sigue sin intentos automáticos.
  p.resultado('OTRO');
  avanzar(t, 5 * 60_000);
  assert.equal(intentos.length, 1);
  // Con un guardado bien (por ejemplo, «Guardar ahora» después de corregir), queda todo como al principio.
  p.resultado('GUARDADO');
  assert.equal(p.programado, false);
});

test('TEST-EDP-047 · sin respuesta, los intentos se espacian: 4 s de pausa y después 8, 16, 32 y 60 s, y cada 60 s', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const { p, intentos, cambiar } = editor(() => 'SIN_RESPUESTA');
  cambiar();
  avanzar(t, 4 * 60 * 60_000); // cuatro horas, de a un segundo
  const esperas = intentos.map((x, i) => (i === 0 ? x : x - intentos[i - 1]) / 1000).slice(0, 8);
  assert.deepEqual(esperas, [4, 8, 16, 32, 60, 60, 60, 60]);
  assert.equal(esperaSinRespuesta(1), 8_000);
  assert.equal(esperaSinRespuesta(99), 60_000);
});

test('TEST-EDP-047 · con el evento `online` o con un cambio, la espera vuelve a 4 s', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let sinRed = true;
  const { p, intentos, cambiar } = editor(() => (sinRed ? 'SIN_RESPUESTA' : 'GUARDADO'));
  cambiar();
  avanzar(t, 4_000 + 8_000 + 16_000 + 32_000);
  assert.equal(intentos.length, 4, 'la próxima espera ya es de 60 s');
  // Vuelve la conexión: el próximo intento, a los 4 s.
  sinRed = false;
  p.enLinea();
  t.mock.timers.tick(4_000);
  assert.equal(intentos.length, 5);
  assert.equal(p.programado, false, 'guardado: no queda nada programado');
  // Otra vez sin red; un cambio también vuelve a 4 s.
  sinRed = true;
  cambiar();
  avanzar(t, 4_000 + 8_000);
  assert.equal(intentos.length, 7);
  cambiar();
  t.mock.timers.tick(4_000);
  assert.equal(intentos.length, 8, 'el cambio vuelve a la pausa de 4 s');
});

test('TEST-EDP-047 · un cambio escrito mientras viajaba el guardado rechazado cuenta: lo nuevo se intenta en la pausa', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const intentos = [];
  const reloj = { setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (x) => clearTimeout(x) };
  // El guardado viaja: el editor no puede guardar, el profesional escribe y recién después llega el rechazo.
  const p = new PlanificadorDelAutoguardado(() => {
    intentos.push(Date.now());
    p.pausar();
  }, reloj);
  p.reanudar();
  p.cambio();
  t.mock.timers.tick(DEMORA_DEL_AUTOGUARDADO_MS);
  assert.equal(intentos.length, 1);
  p.cambio(); // escribe mientras viaja
  p.resultado('DEMASIADO_GRANDE', true);
  p.reanudar(); // volvió la respuesta: el editor puede guardar otra vez
  t.mock.timers.tick(DEMORA_DEL_AUTOGUARDADO_MS);
  assert.equal(intentos.length, 2, 'lo escrito después del envío se intenta en la pausa');
  // Sin cambios durante el viaje, el mismo rechazo frena hasta un cambio.
  p.resultado('DEMASIADO_GRANDE', false);
  p.reanudar();
  avanzar(t, 10 * 60_000);
  assert.equal(intentos.length, 2);
});

test('TEST-EDP-047 · mientras no se puede guardar (un cuadro abierto, algo en viaje), no se intenta', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const { p, intentos, cambiar } = editor(() => 'GUARDADO');
  cambiar();
  p.pausar();
  t.mock.timers.tick(60_000);
  assert.equal(intentos.length, 0);
  p.reanudar();
  t.mock.timers.tick(DEMORA_DEL_AUTOGUARDADO_MS);
  assert.equal(intentos.length, 1);
});

test('TEST-EDP-047 · los dos editores de planes informan el resultado de cada intento al autoguardado', () => {
  const gancho = leer('lib/autoguardado.ts');
  assert.match(gancho, /new PlanificadorDelAutoguardado\(/);
  assert.match(gancho, /addEventListener\('online'/);
  for (const ruta of ['app/pro/advisees/training/editor.tsx', 'app/pro/advisees/nutrition/editor.tsx']) {
    const fuente = leer(ruta);
    assert.match(fuente, /const autoguardado = useAutoguardado\(/, ruta);
    assert.match(fuente, /autoguardado\.informar\(motivo, ediciones\.current !== edicionesAlEnviar\)/, `${ruta}: cada falla dice su motivo y si lo escrito cambió mientras viajaba`);
    assert.match(fuente, /autoguardado\.informar\('GUARDADO'\)/, `${ruta}: un guardado bien lo dice`);
  }
});
