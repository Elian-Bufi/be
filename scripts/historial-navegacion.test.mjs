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
 *  4. Teclado: el KeyboardAvoidingView raíz usa «padding» también en Android, porque con edge-to-edge el sistema ya no
 *     achica la ventana (validación de la APK 0.11.2: el teclado tapaba el campo «Reps» de «Corregir registro»).
 *  5. Barra inferior (Dirección, 2026-10-01): las cinco zonas, la zona madre de cada subpantalla, «atrás» hacia
 *     Nutrición desde las zonas principales, y la barra fija abajo, accesible y fuera del camino del teclado.
 *  6. Sesión (prueba de la 0.13.1: la APK volvía a la bienvenida). Si Android recrea la actividad, por ejemplo al
 *     cambiar el tamaño de letra, la raíz encuentra la sesión y la pantalla que seguían en el proceso. Una sesión que
 *     venció mientras tanto se informa como vencida, y una sesión olvidada no vuelve. Nada va a disco: lo fija
 *     `sesion-en-memoria.ts`, que no importa ningún almacenamiento.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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

// ─── 4. Teclado en Android: el KeyboardAvoidingView raíz tiene que actuar también en Android ─────
// Validación de la APK 0.11.2 en «Corregir registro»: con edge-to-edge (Expo SDK 54+), Android ya no achica la ventana al
// abrir el teclado (adjustResize deja de tener efecto). Con `behavior` indefinido en Android nada reaccionaba al teclado:
// en las capturas, los elementos quedaban en la misma posición con y sin teclado, y el campo «Reps» quedaba tapado. Se lee
// el código fuente, como copy-pantallas.test.cjs; el comportamiento real con teclado solo se comprueba en dispositivo.

const APP = readFileSync(resolve(RAIZ, 'apps/mobile/App.tsx'), 'utf8');

test('el KeyboardAvoidingView raíz tiene comportamiento «padding» también en Android (no depende de adjustResize)', () => {
  const apertura = APP.match(/<KeyboardAvoidingView\b[^>]*>/);
  assert.ok(apertura, 'App.tsx tiene que envolver la app en un KeyboardAvoidingView');
  assert.match(apertura[0], /behavior="padding"/, `vino: ${apertura[0]}`);
  assert.doesNotMatch(apertura[0], /undefined/, 'un comportamiento indefinido en Android deja el teclado tapando los campos');
});

test('el ScrollView global sigue dentro del KeyboardAvoidingView (el padding lo achica y el campo enfocado queda a la vista)', () => {
  const inicio = APP.indexOf('<KeyboardAvoidingView');
  const scroll = APP.indexOf('<ScrollView', inicio);
  const fin = APP.indexOf('</KeyboardAvoidingView>');
  assert.ok(inicio >= 0 && scroll > inicio && fin > scroll, 'el ScrollView global tiene que estar dentro del KeyboardAvoidingView');
});

// ─── 5. La barra inferior (Dirección, 2026-10-01): cinco zonas, como en las apps ─────────────────
// Con sesión, la APK navega con una barra fija abajo: Nutrición, Entrenamiento, Evolución, Información y Cuenta. Cada
// pantalla pertenece a una zona, que queda resaltada también en sus subpantallas; «atrás» desde una zona principal lleva
// a Nutrición, y desde Nutrición sale de la app. El dibujo real (área segura, teclado) solo se comprueba en el teléfono.

/** Una ruta de ejemplo por cada nombre de `Ruta`, con los datos que piden. */
const RUTAS = [
  { nombre: 'bienvenida' },
  { nombre: 'registro' },
  { nombre: 'login' },
  { nombre: 'cuenta' },
  { nombre: 'vinculos' },
  { nombre: 'vinculo', id: 'v1' },
  { nombre: 'consentimiento', vinculoId: 'v1' },
  { nombre: 'privacidad' },
  { nombre: 'hoy' },
  { nombre: 'plan-actual' },
  { nombre: 'registros-nutricionales' },
  { nombre: 'registro-nutricional', id: 'i1' },
  { nombre: 'mi-evolucion' },
  { nombre: 'entrenamiento' },
  { nombre: 'historial-de-entrenamiento' },
  { nombre: 'plan-de-entrenamiento', id: 'p1' },
  { nombre: 'mis-solicitudes' },
  { nombre: 'mi-solicitud', id: 's1' },
  { nombre: 'sesion-de-entrenamiento', draftId: 'd1', sesion: {}, fecha: '2026-10-01' },
  { nombre: 'ejecucion-de-entrenamiento', id: 'e1' },
];

test('la barra tiene las cinco zonas, en orden, con su texto y su pantalla principal', () => {
  assert.deepEqual(
    nav.ZONAS.map((z) => [z.texto, z.ruta.nombre]),
    [
      ['Nutrición', 'hoy'],
      ['Entrenamiento', 'entrenamiento'],
      ['Evolución', 'mi-evolucion'],
      ['Información', 'mis-solicitudes'],
      ['Cuenta', 'cuenta'],
    ],
  );
  for (const z of nav.ZONAS) assert.equal(nav.zonaDe(z.ruta), z.zona, `la pantalla principal de ${z.texto} pertenece a su zona`);
});

test('toda pantalla con sesión tiene zona, y las de afuera de la sesión no (sin barra en Bienvenida, registro ni login)', () => {
  for (const ruta of RUTAS) {
    const zona = nav.zonaDe(ruta);
    if (nav.requiereSesion(ruta)) assert.ok(zona, `«${ruta.nombre}» no tiene zona`);
    else assert.equal(zona, null, `«${ruta.nombre}» no debería mostrar la barra`);
  }
});

test('en una subpantalla queda resaltada la zona madre', () => {
  const madre = (nombre) => nav.zonaDe(RUTAS.find((r) => r.nombre === nombre));
  assert.equal(madre('sesion-de-entrenamiento'), 'entrenamiento');
  assert.equal(madre('ejecucion-de-entrenamiento'), 'entrenamiento');
  assert.equal(madre('historial-de-entrenamiento'), 'entrenamiento');
  assert.equal(madre('plan-de-entrenamiento'), 'entrenamiento');
  assert.equal(madre('vinculo'), 'cuenta');
  assert.equal(madre('consentimiento'), 'cuenta');
  assert.equal(madre('privacidad'), 'cuenta');
  assert.equal(madre('mi-solicitud'), 'informacion');
  assert.equal(madre('registro-nutricional'), 'nutricion');
  assert.equal(madre('plan-actual'), 'nutricion');
});

test('«atrás» desde una zona principal lleva a Nutrición, y desde Nutrición deja salir de la app', () => {
  assert.equal(nav.INICIO.nombre, 'hoy', 'con sesión, la APK abre en Nutrición');
  for (const nombre of ['entrenamiento', 'mi-evolucion', 'mis-solicitudes', 'cuenta']) assert.deepEqual(nav.anterior({ nombre }), { nombre: 'hoy' }, nombre);
  assert.equal(nav.anterior({ nombre: 'hoy' }), null, 'en Nutrición decide el sistema: sale de la app');
});

test('«Tu historial» vuelve a Entrenamiento de hoy: ya no se entra desde Cuenta', () => {
  assert.deepEqual(nav.anterior({ nombre: 'historial-de-entrenamiento' }), { nombre: 'entrenamiento' });
  assert.equal(nav.textoDeVolverA(nav.anterior({ nombre: 'historial-de-entrenamiento' })), 'Volver a Entrenamiento de hoy');
});

test('las zonas principales no llevan enlace de volver; las subpantallas sí, hacia una pantalla de su misma zona', () => {
  for (const ruta of RUTAS.filter(nav.requiereSesion)) {
    if (nav.esPrincipal(ruta)) continue;
    const destino = nav.anterior(ruta);
    assert.ok(destino, `«${ruta.nombre}» necesita volver`);
    assert.equal(nav.zonaDe(destino), nav.zonaDe(ruta), `volver desde «${ruta.nombre}» no cambia de zona`);
  }
  assert.match(APP, /destinoAnterior && !esPrincipal\(ruta\)/, 'App.tsx no dibuja el enlace de volver en las zonas principales');
});

test('la barra va fija abajo: fuera del ScrollView y dentro del KeyboardAvoidingView, y solo con sesión', () => {
  const finDelScroll = APP.indexOf('</ScrollView>');
  const barra = APP.indexOf('<BarraDeZonas');
  const fin = APP.indexOf('</KeyboardAvoidingView>');
  assert.ok(finDelScroll >= 0 && barra > finDelScroll && fin > barra, 'la barra tiene que ir después del ScrollView y dentro del KeyboardAvoidingView');
  assert.match(APP, /const zona = sesion \? zonaDe\(ruta\) : null;/, 'sin sesión no hay barra');
  assert.match(APP, /ir\(alIniciarSesion\(ruta\)\)/, 'al iniciar sesión se abre la pantalla que decide alIniciarSesion');
});

test('al iniciar sesión se abre Nutrición; si Cuenta pidió volver a entrar para confirmar una acción, se vuelve a Cuenta', () => {
  assert.deepEqual(nav.alIniciarSesion({ nombre: 'login' }), { nombre: 'hoy' });
  assert.deepEqual(nav.alIniciarSesion({ nombre: 'login', aviso: 'La sesión ya no es válida.' }), { nombre: 'hoy' });
  assert.deepEqual(nav.alIniciarSesion({ nombre: 'login', aviso: 'Por seguridad…', alEntrar: 'cuenta' }), { nombre: 'cuenta' });
  assert.match(APP, /motivo === 'reautenticar' \? \{ alEntrar: 'cuenta' as const \}/, 'la reautenticación del cierre de cuenta vuelve a Cuenta');
});

test('cada destino de la barra es una pestaña accesible de 48 dp o más, respeta el área segura y se oculta con el teclado', () => {
  const BARRA = readFileSync(resolve(RAIZ, 'apps/mobile/src/barra-de-zonas.tsx'), 'utf8');
  assert.match(BARRA, /accessibilityRole="tab"/);
  assert.match(BARRA, /accessibilityState=\{\{ selected: elegida \}\}/);
  assert.match(BARRA, /accessibilityRole="tablist"/);
  const alto = Number(/destino: \{[^}]*minHeight: (\d+)/.exec(BARRA)?.[1]);
  const ancho = Number(/destino: \{[^}]*minWidth: (\d+)/.exec(BARRA)?.[1]);
  assert.ok(alto >= 48 && ancho >= 48, `el destino mide ${ancho} × ${alto} dp`);
  assert.match(BARRA, /paddingBottom: insets\.bottom/, 'la barra deja libre el área segura de abajo');
  assert.match(BARRA, /keyboardDidShow/, 'la barra se oculta con el teclado abierto (Android)');
  assert.match(BARRA, /if \(tecladoAbierto\) return null;/);
  // Cuenta ya no es el menú: sus botones a las zonas salieron, porque están en la barra.
  const CUENTA = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/cuenta.tsx'), 'utf8');
  for (const nombre of ['hoy', 'entrenamiento', 'historial-de-entrenamiento', 'mi-evolucion', 'mis-solicitudes']) {
    assert.doesNotMatch(CUENTA, new RegExp(`ir\\(\\{ nombre: '${nombre}' \\}\\)`), `Cuenta todavía abre «${nombre}»`);
  }
});

// ─── 6. Sesión: sobrevive a que Android recree la actividad, nunca a que se la olvide ──────────────────────────────
const memoria = await import('../apps/mobile/src/sesion-en-memoria.ts');

test('6 · la raíz encuentra la sesión y la pantalla que seguían en el proceso; vencida, lo dice; olvidada, no vuelve', () => {
  const ahora = Date.parse('2026-10-03T12:00:00Z');
  assert.deepEqual(memoria.sesionAlMontar(ahora), { estado: 'ninguna' });
  const sesion = { token: 'token-sintetico', expiraEn: ahora + 60_000, identidadId: 'identidad-sintetica' };
  memoria.recordarSesion(sesion, { nombre: 'mi-evolucion' });
  assert.deepEqual(memoria.sesionAlMontar(ahora), { estado: 'vigente', sesion, ruta: { nombre: 'mi-evolucion' } });
  assert.deepEqual(memoria.sesionAlMontar(ahora + 60_000), { estado: 'vencida' });
  memoria.olvidarSesion();
  assert.deepEqual(memoria.sesionAlMontar(ahora), { estado: 'ninguna' });
});

test('6 · la sesión en memoria no toca ningún almacenamiento del teléfono', () => {
  const fuente = readFileSync(resolve(RAIZ, 'apps/mobile/src/sesion-en-memoria.ts'), 'utf8');
  const importaciones = fuente.split('\n').filter((l) => /^import /.test(l));
  assert.deepEqual(importaciones, ["import type { Ruta } from './navegacion';"]);
  assert.doesNotMatch(fuente, /AsyncStorage|SecureStore|localStorage/);
});
