/**
 * Regresión de los defectos hallados en «Tu historial» (DL-096) durante la validación en teléfono:
 *  1. Navegación: el detalle de ejecución se abre desde «Entrenamiento de hoy», desde «Tu historial» y, desde DL-117,
 *     desde Inicio; volver tiene que regresar al origen, no siempre a Hoy. El origen es la ruta anterior entera (`desde`,
 *     asignado por `navegar`), que reemplazó al `origen: 'hoy' | 'historial'` de DL-096. El botón Atrás de Android y
 *     el de la cabecera usan la misma `anterior`.
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
 *  5. Barra, cabecera y origen (DL-117, Dirección, 2026-10-04; reemplaza a la barra del 2026-10-01): los cinco destinos
 *     con Inicio, Cuenta en el avatar, «atrás» hacia Inicio desde las raíces, el origen de cada detalle, el menú auxiliar
 *     y la cápsula flotante, accesible y fuera del camino del teclado.
 *  6. Sesión (prueba de la 0.13.1: la APK volvía a la bienvenida). Si Android recrea la actividad, por ejemplo al
 *     cambiar el tamaño de letra, la raíz encuentra la sesión y la pantalla que seguían en el proceso. Una sesión que
 *     venció mientras tanto se informa como vencida, y una sesión olvidada no vuelve. Nada va a disco: lo fija
 *     `sesion-en-memoria.ts`, que no importa ningún almacenamiento.
 *  7. Altura de las zonas (candidata 0.13.2): desde que cada zona verifica antes de mostrar, el contenido llega cuando la
 *     API confirma. Volver a una zona la deja a la altura en que se la dejó aunque eso tarde más de 1,5 s, salvo que la
 *     persona haya movido la pantalla o hayan pasado 10 s.
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
// Desde DL-117 (Dirección, 2026-10-04) el origen es la ruta anterior entera (`desde`), que asigna `navegar`. Reemplaza
// al `origen: 'hoy' | 'historial'` de DL-096, que solo cubría la ejecución: ahora el mismo detalle abierto desde Inicio
// vuelve a Inicio, y abierto desde su módulo vuelve al módulo.

const HISTORIAL = { nombre: 'historial-de-entrenamiento', desde: { nombre: 'entrenamiento' } };

test('el detalle abierto desde «Tu historial» vuelve a «Tu historial»', () => {
  const detalle = nav.navegar(HISTORIAL, { nombre: 'ejecucion-de-entrenamiento', id: 'e1' });
  assert.deepEqual(nav.anterior(detalle), HISTORIAL);
});

test('el mismo detalle vuelve a Entrenamiento de hoy si se abrió ahí, a Inicio si se abrió desde Inicio, y sin origen a su madre', () => {
  assert.deepEqual(nav.anterior(nav.navegar({ nombre: 'entrenamiento' }, { nombre: 'ejecucion-de-entrenamiento', id: 'e1' })), { nombre: 'entrenamiento' });
  assert.deepEqual(nav.anterior(nav.navegar({ nombre: 'inicio' }, { nombre: 'ejecucion-de-entrenamiento', id: 'e1' })), { nombre: 'inicio' });
  assert.deepEqual(nav.anterior({ nombre: 'ejecucion-de-entrenamiento', id: 'e1' }), { nombre: 'entrenamiento' });
});

test('registrar el borrador lo reemplaza por su ejecución: volver lleva adonde se había abierto el borrador', () => {
  const sesion = { sesion: {}, fecha: '2026-10-04' };
  for (const raiz of [{ nombre: 'inicio' }, { nombre: 'entrenamiento' }]) {
    const borrador = nav.navegar(raiz, { nombre: 'sesion-de-entrenamiento', draftId: 'd1', ...sesion });
    const registrada = nav.navegar(borrador, { nombre: 'ejecucion-de-entrenamiento', id: 'e1', aviso: 'Sesión registrada.' }, 'reemplazar');
    assert.deepEqual(nav.anterior(registrada), raiz, `desde ${raiz.nombre}`);
  }
  assert.deepEqual(nav.anterior({ nombre: 'sesion-de-entrenamiento', draftId: 'd1', ...sesion }), { nombre: 'entrenamiento' }, 'sin origen, a Entrenamiento de hoy');
});

test('el botón de volver nombra adónde vuelve', () => {
  assert.equal(nav.textoDeVolverA({ nombre: 'historial-de-entrenamiento' }), 'Volver a Tu historial');
  assert.equal(nav.textoDeVolverA({ nombre: 'inicio' }), 'Volver a Inicio');
  assert.equal(nav.textoDeVolverA({ nombre: 'mi-evolucion' }), 'Volver a Mi evolución');
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

// ─── 5. Barra, cabecera y origen (DL-117, Dirección, 2026-10-04) ────────────────────────────────
// Con sesión, la APK navega con una barra de cinco raíces: Inicio, Nutrición, Entrenamiento, Evolución e Información.
// Cuenta se abre desde el avatar de la cabecera. Reemplaza a la barra del 2026-10-01, que tenía Cuenta en lugar de Inicio
// y abría en Nutrición. El dibujo real (área segura, teclado, letra grande) solo se comprueba en el teléfono.

/** Una ruta de ejemplo por cada nombre de `Ruta`, con los datos que piden. */
const RUTAS = [
  { nombre: 'bienvenida' },
  { nombre: 'registro' },
  { nombre: 'login' },
  { nombre: 'inicio' },
  { nombre: 'cuenta' },
  { nombre: 'vinculos' },
  { nombre: 'vinculo', id: 'v1' },
  { nombre: 'consentimiento', vinculoId: 'v1' },
  { nombre: 'privacidad' },
  { nombre: 'hoy' },
  { nombre: 'plan-actual' },
  { nombre: 'registros-nutricionales' },
  { nombre: 'registro-nutricional', id: 'i1' },
  // WP-NUTRICION-RECETAS: el detalle de una opción de una comida y «Comí algo diferente».
  { nombre: 'opcion-de-comida', id: 'o1', comidaId: 'm1' },
  { nombre: 'comida-diferente', comidaId: 'm1', comida: 'Almuerzo', fecha: '2026-10-05', planId: 'p1', diaTipoId: 'd1' },
  { nombre: 'mi-evolucion' },
  { nombre: 'entrenamiento' },
  { nombre: 'historial-de-entrenamiento' },
  { nombre: 'plan-de-entrenamiento', id: 'p1' },
  { nombre: 'mis-solicitudes' },
  { nombre: 'mi-solicitud', id: 's1' },
  { nombre: 'sesion-de-entrenamiento', draftId: 'd1', sesion: {}, fecha: '2026-10-01' },
  { nombre: 'ejecucion-de-entrenamiento', id: 'e1' },
];
const RAICES = ['inicio', 'hoy', 'entrenamiento', 'mi-evolucion', 'mis-solicitudes'].map((nombre) => ({ nombre }));
const conSesion = RUTAS.filter(nav.requiereSesion);

test('la barra tiene los cinco destinos, en orden, con su texto y su raíz', () => {
  assert.deepEqual(
    nav.ZONAS.map((z) => [z.texto, z.ruta.nombre]),
    [
      ['Inicio', 'inicio'],
      ['Nutrición', 'hoy'],
      ['Entrenamiento', 'entrenamiento'],
      ['Evolución', 'mi-evolucion'],
      ['Información', 'mis-solicitudes'],
    ],
  );
  for (const z of nav.ZONAS) {
    assert.equal(nav.moduloDe(z.ruta), z.zona, `la raíz de ${z.texto} pertenece a su módulo`);
    assert.equal(nav.pestanaActiva(z.ruta), z.zona, `la raíz de ${z.texto} resalta su destino`);
    assert.ok(nav.esRaiz(z.ruta));
  }
});

test('módulo, pestaña activa y barra son tres cosas: Cuenta es un módulo que no resalta ningún destino', () => {
  for (const ruta of RUTAS) {
    const modulo = nav.moduloDe(ruta);
    if (nav.requiereSesion(ruta)) assert.ok(modulo, `«${ruta.nombre}» no tiene módulo`);
    else assert.equal(modulo, null, `«${ruta.nombre}» está fuera de la sesión`);
  }
  for (const nombre of ['cuenta', 'vinculos', 'privacidad']) {
    assert.equal(nav.moduloDe({ nombre }), 'cuenta');
    assert.equal(nav.pestanaActiva({ nombre }), null, `«${nombre}» no resalta ningún destino`);
  }
  // Un detalle sin origen resalta su módulo; abierto desde Inicio, resalta Inicio, donde empezó el camino.
  assert.equal(nav.pestanaActiva({ nombre: 'ejecucion-de-entrenamiento', id: 'e1' }), 'entrenamiento');
  assert.equal(nav.pestanaActiva(nav.navegar({ nombre: 'inicio' }, { nombre: 'ejecucion-de-entrenamiento', id: 'e1' })), 'inicio');
  assert.equal(nav.pestanaActiva(nav.navegar({ nombre: 'hoy' }, { nombre: 'privacidad' })), null, 'Privacidad es de Cuenta aunque se abra desde Nutrición');
});

test('«atrás» desde una raíz lleva a Inicio, y desde Inicio o Bienvenida deja actuar al sistema', () => {
  assert.deepEqual(nav.INICIO, { nombre: 'inicio' }, 'con sesión, la APK abre en Inicio');
  for (const nombre of ['hoy', 'entrenamiento', 'mi-evolucion', 'mis-solicitudes']) assert.deepEqual(nav.anterior({ nombre }), { nombre: 'inicio' }, nombre);
  assert.equal(nav.anterior({ nombre: 'inicio' }), null);
  assert.equal(nav.anterior({ nombre: 'bienvenida' }), null);
});

test('toda pantalla con sesión que no es raíz tiene adónde volver, también sin origen', () => {
  for (const ruta of conSesion) {
    if (nav.esRaiz(ruta)) continue;
    const destino = nav.anterior(ruta);
    assert.ok(destino, `«${ruta.nombre}» necesita volver`);
    assert.ok(nav.requiereSesion(destino), `volver desde «${ruta.nombre}» no sale de la sesión`);
  }
});

test('Cuenta abierta desde el avatar vuelve a la pantalla desde la que se abrió, en cada destino y en un detalle', () => {
  const desdeUnDetalle = nav.navegar({ nombre: 'entrenamiento' }, { nombre: 'ejecucion-de-entrenamiento', id: 'e1' });
  for (const origen of [...RAICES, desdeUnDetalle]) {
    const cuenta = nav.navegar(origen, { nombre: 'cuenta' });
    assert.equal(cuenta.nombre, 'cuenta');
    assert.deepEqual(nav.anterior(cuenta), origen, `desde ${origen.nombre}`);
  }
  // Tocar el avatar estando en Cuenta no la apila de nuevo.
  const cuenta = nav.navegar({ nombre: 'hoy' }, { nombre: 'cuenta' });
  assert.deepEqual(nav.navegar(cuenta, { nombre: 'cuenta' }), cuenta);
});

test('Privacidad vuelve al aviso de A3 desde el que se abrió; desde Cuenta, a Cuenta, que conserva su propio origen', () => {
  assert.deepEqual(nav.anterior(nav.navegar({ nombre: 'hoy' }, { nombre: 'privacidad' })), { nombre: 'hoy' });
  const cuenta = nav.navegar({ nombre: 'mi-evolucion' }, { nombre: 'cuenta' });
  const privacidad = nav.navegar(cuenta, { nombre: 'privacidad' });
  assert.deepEqual(nav.anterior(privacidad), cuenta);
  assert.deepEqual(nav.anterior(nav.anterior(privacidad)), { nombre: 'mi-evolucion' });
});

test('el menú auxiliar lleva a funciones que ya existen, fuera de la barra, y lo abierto vuelve a la raíz del menú', () => {
  const MENU = readFileSync(resolve(RAIZ, 'apps/mobile/src/menu-auxiliar.tsx'), 'utf8');
  const destinos = [...MENU.matchAll(/ruta: \{ nombre: '([a-z-]+)' \}/g)].map((m) => m[1]);
  assert.deepEqual(destinos, ['vinculos', 'historial-de-entrenamiento', 'registros-nutricionales']);
  for (const nombre of destinos) {
    assert.ok(!nav.esRaiz({ nombre }), `«${nombre}» ya está en la barra`);
    for (const raiz of RAICES) assert.deepEqual(nav.anterior(nav.navegar(raiz, { nombre })), raiz, `«${nombre}» desde ${raiz.nombre}`);
  }
  assert.match(MENU, /<Modal[^>]*onRequestClose=\{cerrar\}/, 'el botón atrás cierra el menú antes de navegar');
});

test('navegar: una raíz reinicia la cadena, una pantalla ya abierta no se duplica y el origen tiene tope', () => {
  const profundo = nav.navegar(nav.navegar({ nombre: 'inicio' }, { nombre: 'cuenta' }), { nombre: 'vinculos' });
  assert.deepEqual(nav.navegar(profundo, { nombre: 'entrenamiento' }), { nombre: 'entrenamiento' }, 'la barra deja la raíz sin origen');
  // Después de consentir, «Ver vínculo» vuelve al vínculo de donde se vino, con su propio origen, sin apilarlo de nuevo.
  const vinculo = nav.navegar(profundo, { nombre: 'vinculo', id: 'v1' });
  const consentimiento = nav.navegar(vinculo, { nombre: 'consentimiento', vinculoId: 'v1' });
  assert.deepEqual(nav.navegar(consentimiento, { nombre: 'vinculo', id: 'v1' }, 'reemplazar'), vinculo);
  // Desde la lista de vínculos, el vínculo reemplaza al consentimiento y hereda su origen.
  const desdeLaLista = nav.navegar(profundo, { nombre: 'consentimiento', vinculoId: 'v2' });
  assert.deepEqual(nav.anterior(nav.navegar(desdeLaLista, { nombre: 'vinculo', id: 'v2' }, 'reemplazar')), profundo);
  // Un vínculo distinto es otra pantalla: se apila.
  assert.deepEqual(nav.anterior(nav.navegar(vinculo, { nombre: 'vinculo', id: 'v9' })), vinculo);
  // El tope: por más que se encadenen detalles, se recuerdan como mucho TOPE_DEL_ORIGEN niveles.
  let r = { nombre: 'inicio' };
  for (let i = 0; i < 12; i++) r = nav.navegar(r, { nombre: 'vinculo', id: `v${i}` });
  let niveles = 0;
  for (let x = r; nav.desdeDe(x); x = nav.desdeDe(x)) niveles++;
  assert.equal(niveles, nav.TOPE_DEL_ORIGEN);
});

test('lo que era de una sola vez no se recuerda para volver: el pedido de una raíz y el aviso de una ejecución', () => {
  const registro = nav.navegar({ nombre: 'hoy', accion: 'registrar' }, { nombre: 'registro-nutricional', id: 'i1' });
  assert.deepEqual(nav.anterior(registro), { nombre: 'hoy' });
  const medida = nav.navegar({ nombre: 'mi-evolucion', vista: 'evolucion', metrica: 'peso' }, { nombre: 'cuenta' });
  assert.deepEqual(nav.anterior(medida), { nombre: 'mi-evolucion' });
  const registrada = { nombre: 'ejecucion-de-entrenamiento', id: 'e1', aviso: 'Sesión registrada.', desde: { nombre: 'inicio' } };
  assert.deepEqual(nav.anterior(nav.navegar(registrada, { nombre: 'cuenta' })), { nombre: 'ejecucion-de-entrenamiento', id: 'e1', desde: { nombre: 'inicio' } });
  assert.ok(nav.traePedido({ nombre: 'hoy', accion: 'registrar' }) && !nav.traePedido({ nombre: 'hoy' }));
});

test('al iniciar sesión se abre Inicio; si Cuenta pidió volver a entrar para confirmar una acción, se vuelve a Cuenta', () => {
  assert.deepEqual(nav.alIniciarSesion({ nombre: 'login' }), { nombre: 'inicio' });
  assert.deepEqual(nav.alIniciarSesion({ nombre: 'login', aviso: 'La sesión ya no es válida.' }), { nombre: 'inicio' });
  assert.deepEqual(nav.alIniciarSesion({ nombre: 'login', aviso: 'Por seguridad…', alEntrar: 'cuenta' }), { nombre: 'cuenta' });
  assert.deepEqual(nav.navegar({ nombre: 'login' }, nav.alIniciarSesion({ nombre: 'login', alEntrar: 'cuenta' })), { nombre: 'cuenta' }, 'sin origen: volver lleva a Inicio');
  assert.match(APP, /motivo === 'reautenticar' \? \{ alEntrar: 'cuenta' as const \}/, 'la reautenticación del cierre de cuenta vuelve a Cuenta');
  assert.match(APP, /ir\(alIniciarSesion\(ruta\)\)/, 'al iniciar sesión se abre la pantalla que decide alIniciarSesion');
});

test('App.tsx: cabecera arriba, barra flotante después del ScrollView, solo con sesión, y un único registro del botón atrás', () => {
  const raiz = APP.indexOf('<KeyboardAvoidingView');
  const cabecera = APP.indexOf('<Cabecera', raiz);
  const scroll = APP.indexOf('<ScrollView', raiz);
  const finDelScroll = APP.indexOf('</ScrollView>');
  const barra = APP.indexOf('<BarraDeZonas');
  const fin = APP.indexOf('</KeyboardAvoidingView>');
  assert.ok(raiz >= 0 && cabecera > raiz && scroll > cabecera, 'la cabecera va antes del contenido');
  assert.ok(finDelScroll >= 0 && barra > finDelScroll && fin > barra, 'la barra va después del ScrollView y dentro del KeyboardAvoidingView');
  assert.match(APP, /\{conSesion \? <BarraDeZonas actual=\{pestanaActiva\(ruta\)\}/, 'sin sesión verificada no hay barra');
  assert.match(APP, /alMedir=\{setAltoDeLaBarra\}/, 'el contenido deja libre el alto medido de la barra');
  assert.match(APP, /BackHandler\.addEventListener\('hardwareBackPress', atras\)/);
  assert.match(APP, /\}, \[atras\]\);/, 'el botón atrás se registra una vez, no en cada pantalla');
  assert.doesNotMatch(APP, /textoDeVolverA|tipo="enlace" onPress=\{volver\}/, 'volver está en la cabecera, no como enlace dentro del contenido');
});

test('la barra: pestañas accesibles de 48 dp, sin los indicadores viejos, sobre el área segura y oculta con el teclado', () => {
  const BARRA = readFileSync(resolve(RAIZ, 'apps/mobile/src/barra-de-zonas.tsx'), 'utf8');
  assert.match(BARRA, /accessibilityRole="tab"/);
  assert.match(BARRA, /accessibilityState=\{\{ selected: elegida \}\}/);
  assert.match(BARRA, /accessibilityRole="tablist"/);
  const alto = Number(/destino: \{[^}]*minHeight: (\d+)/.exec(BARRA)?.[1]);
  const ancho = Number(/destino: \{[^}]*minWidth: (\d+)/.exec(BARRA)?.[1]);
  assert.ok(alto >= 48 && ancho >= 48, `el destino mide ${ancho} × ${alto} dp`);
  assert.match(BARRA, /borderRadius: 999/, 'una cápsula con los extremos redondeados del todo');
  assert.match(BARRA, /bottom: insets\.bottom \+ SEPARACION_DE_LA_BARRA/, 'la cápsula flota sobre el área segura de abajo');
  assert.match(BARRA, /keyboardDidShow/, 'la barra se oculta con el teclado abierto (Android)');
  assert.match(BARRA, /if \(tecladoAbierto\) return null;/);
  assert.match(BARRA, /onLayout=\{\(e\) => alMedir\(/, 'la barra informa su alto real');
  assert.doesNotMatch(BARRA, /marcaElegida|indicadorElegido/, 'sin la marca ni la píldora de la barra anterior');
  assert.doesNotMatch(BARRA, /numberOfLines=\{0\}|display: 'none'/, 'ninguna etiqueta se oculta');
});

test('la cabecera: volver con prioridad sobre el menú, y un avatar neutro que no muestra nombre ni iniciales', () => {
  const CABECERA = readFileSync(resolve(RAIZ, 'apps/mobile/src/cabecera.tsx'), 'utf8');
  assert.match(CABECERA, /\{volverA \? \([\s\S]*?\) : conMenu \? \(/, 'volver tiene prioridad sobre el menú');
  assert.match(CABECERA, /accessibilityLabel=\{textoDeVolverA\(volverA\)\}/, 'el botón dice adónde vuelve');
  assert.match(CABECERA, /accessibilityLabel="Cuenta"/);
  const codigo = CABECERA.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(codigo, /profile|displayName|email|correo|iniciales/i, 'el perfil no tiene nombre ni foto (D-2)');
  assert.match(CABECERA, /Ambiente de prueba · solo datos sintéticos/, 'el ambiente siempre a la vista (08 §33)');
  assert.match(APP, /conMenu=\{conSesion && raiz\}/, 'el menú, solo en una raíz con sesión');
  assert.match(APP, /volverA=\{recuperacion \|\| raiz \? null : anterior\(ruta\)\}/, 'volver en todo lo que no es raíz');
});

const cambios = await import('../apps/mobile/src/registro-de-cambios.ts');

test('sin pérdidas silenciosas: con algo escrito sin guardar, salir pregunta y solo sale si la persona lo confirma', () => {
  const registro = cambios.crearRegistroDeCambios();
  const salidas = [];
  const preguntas = [];
  const salir = () => salidas.push('salió');
  // Sin nada escrito, sale enseguida y no pregunta.
  cambios.salirConCuidado(registro, salir, (que, confirmar) => preguntas.push({ que, confirmar }));
  assert.deepEqual([salidas.length, preguntas.length], [1, 0]);
  // Una tarjeta declara lo escrito: salir pregunta y no sale todavía.
  registro.declarar('comida', 'el registro de «Almuerzo»');
  cambios.salirConCuidado(registro, salir, (que, confirmar) => preguntas.push({ que, confirmar }));
  assert.deepEqual([salidas.length, preguntas.length, preguntas[0].que], [1, 1, 'el registro de «Almuerzo»']);
  // «Seguir acá»: no se llama a confirmar, y lo escrito sigue declarado.
  assert.equal(registro.pendiente(), 'el registro de «Almuerzo»');
  // «Salir sin guardar»: sale. Lo declarado no lo borra la pregunta sino la tarjeta, al desmontarse. Antes la pregunta lo
  // olvidaba: si la pantalla no se desmontaba (tocar la raíz en la que se estaba), lo escrito quedaba sin declarar y la
  // salida siguiente lo perdía sin preguntar (revisión de la candidata).
  preguntas[0].confirmar();
  assert.deepEqual([salidas.length, registro.pendiente()], [2, 'el registro de «Almuerzo»']);
  registro.declarar('comida', null);
  assert.equal(registro.pendiente(), null, 'la tarjeta se desmontó');
  // Guardar o vaciar los campos deja de declararlo.
  registro.declarar('serie', 'lo que cargaste en «Sentadilla»');
  registro.declarar('serie', null);
  assert.equal(registro.pendiente(), null);
});

test('sin pérdidas silenciosas: ir a la pantalla en la que ya se está no pregunta ni la desmonta', () => {
  // Tocar «Nutrición» estando en Nutrición, también si se llegó desde «Registrar» en Inicio: es la misma pantalla.
  for (const actual of [{ nombre: 'hoy' }, { nombre: 'hoy', accion: 'registrar' }]) {
    assert.ok(nav.mismaPantalla(nav.navegar(actual, { nombre: 'hoy' }), actual), JSON.stringify(actual));
  }
  const cuenta = nav.navegar({ nombre: 'inicio' }, { nombre: 'cuenta' });
  assert.ok(nav.mismaPantalla(nav.navegar(cuenta, { nombre: 'cuenta' }), cuenta), 'el avatar estando en Cuenta');
  assert.match(APP, /if \(mismaPantalla\(navegar\(rutaActual\.current, r\), rutaActual\.current\)\) return ir\(r\);/);
  // Nutrición no se vuelve a montar al perder el pedido de una sola vez: lo escrito en una comida sigue ahí.
  assert.doesNotMatch(APP, /<PantallaDeHoy key=/);
});

test('sin pérdidas silenciosas: la barra, el avatar, el menú, volver y el botón atrás preguntan; los formularios declaran lo escrito', () => {
  assert.match(APP, /<BarraDeZonas actual=\{pestanaActiva\(ruta\)\} ir=\{irConCuidado\}/);
  assert.match(APP, /abrirCuenta=\{\(\) => irConCuidado\(\{ nombre: 'cuenta' \}\)\}/);
  assert.match(APP, /volver=\{volverConCuidado\}/);
  assert.match(APP, /setMenuAbierto\(false\);\s*irConCuidado\(r\);/, 'el menú se cierra y después pregunta');
  assert.match(APP, /const atras = useCallback\(\(\) => \{\s*if \(!anterior\(rutaActual\.current\)\) return false;\s*volverConCuidado\(\);/);
  // WP-NUTRICION-RECETAS: los formularios de Nutrición pasaron al detalle de una opción («¿Cuánto comiste?») y a «Comí
  // algo diferente», que reemplazó a la comida fuera del plan.
  const declaran = {
    'opcion-de-comida.tsx': ['el registro de «${comida.label}»'],
    'comida-diferente.tsx': ['lo que comiste en «${comida}»'],
    'entrenamiento.tsx': ['lo que escribiste en esta sesión', 'lo que cargaste en «${p.exerciseName}»', 'la corrección del registro'],
    'formularios.tsx': ['tus respuestas'],
    'registro.tsx': ['los datos de tu cuenta nueva'],
  };
  for (const [archivo, textos] of Object.entries(declaran)) {
    const fuente = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas', archivo), 'utf8');
    for (const texto of textos) assert.ok(fuente.includes(texto), `${archivo} declara «${texto}»`);
  }
});

test('«Volver a Información», dentro de una solicitud, va a Información aunque se haya abierto desde Inicio, y pregunta antes', () => {
  assert.match(APP, /const volverAInformacion = useCallback\(\(\) => irConCuidado\(\{ nombre: 'mis-solicitudes' \}\), \[irConCuidado\]\)/);
  assert.match(APP, /<PantallaDeMiSolicitud [^>]*volver=\{volverAInformacion\}/);
  // Desde Inicio, el origen de la solicitud es Inicio; el botón del contenido no va al origen sino a Información.
  const solicitud = nav.navegar({ nombre: 'inicio' }, { nombre: 'mi-solicitud', id: 's1' });
  assert.deepEqual(nav.anterior(solicitud), { nombre: 'inicio' }, 'la cabecera vuelve a Inicio');
  assert.deepEqual(nav.navegar(solicitud, { nombre: 'mis-solicitudes' }), { nombre: 'mis-solicitudes' }, 'el botón «Volver a Información» abre Información');
});

test('Cuenta no abre los módulos: están en la barra y en el menú', () => {
  const CUENTA = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/cuenta.tsx'), 'utf8');
  for (const nombre of ['inicio', 'hoy', 'entrenamiento', 'historial-de-entrenamiento', 'mi-evolucion', 'mis-solicitudes']) {
    assert.doesNotMatch(CUENTA, new RegExp(`ir\\(\\{ nombre: '${nombre}' \\}\\)`), `Cuenta todavía abre «${nombre}»`);
  }
});

// ─── 6. Sesión: sobrevive a que Android recree la actividad, nunca a que se la olvide ──────────────────────────────
const memoria = await import('../apps/mobile/src/sesion-en-memoria.ts');

const DOCE_HORAS = 12 * 3_600_000;
const INICIO = { token: 'token-sintetico', identidadId: 'identidad-sintetica', expiresAt: '2026-10-04T00:00:00.000Z', fechaDelServidor: 'Sat, 03 Oct 2026 12:00:00 GMT' };

test('6 · la vigencia sale de la API y del reloj del servidor: un reloj del teléfono corrido no la cambia', () => {
  // El teléfono atrasa una hora y la cuenta sigue siendo la del servidor: doce horas desde el inicio de sesión.
  const sesion = memoria.crearSesion(INICIO, 1_000, Date.parse('2026-10-03T11:00:00Z'));
  assert.equal(sesion.vigenciaMs, DOCE_HORAS);
  assert.equal(memoria.restanteMs(sesion, 1_000, Date.parse('2026-10-03T11:00:00Z')), DOCE_HORAS);
  // El tiempo que pasa se mide con el reloj monótono; el de pared puede saltar sin efecto.
  assert.equal(memoria.restanteMs(sesion, 1_000 + DOCE_HORAS - 1, Date.parse('2030-01-01T00:00:00Z')), 1);
  assert.equal(memoria.restanteMs(sesion, 1_000 + DOCE_HORAS, 0), 0);
});

test('6 · sin la cabecera Date, o con una vigencia increíble, se compara con el reloj del teléfono y el aviso no dice la duración', () => {
  const sinFecha = memoria.crearSesion({ ...INICIO, fechaDelServidor: null }, 0, Date.parse('2026-10-03T12:00:00Z'));
  assert.equal(sinFecha.vigenciaMs, null);
  assert.equal(memoria.restanteMs(sinFecha, 999_999_999, Date.parse('2026-10-03T23:00:00Z')), 3_600_000);
  assert.equal(memoria.avisoDeVencimiento(sinFecha), 'Tu sesión venció. Iniciá sesión para continuar.');
  const increible = memoria.crearSesion({ ...INICIO, fechaDelServidor: 'Thu, 01 Jan 2026 00:00:00 GMT' }, 0, 0);
  assert.equal(increible.vigenciaMs, null);
});

test('6 · el aviso de vencimiento dice cuánto duraba esa sesión, según la API', () => {
  assert.equal(memoria.avisoDeVencimiento({ vigenciaMs: DOCE_HORAS }), 'Tu sesión venció: duraba 12 horas. Iniciá sesión para continuar.');
  assert.equal(memoria.avisoDeVencimiento({ vigenciaMs: 3_600_000 }), 'Tu sesión venció: duraba 1 hora. Iniciá sesión para continuar.');
  assert.equal(memoria.avisoDeVencimiento(null), 'Tu sesión venció. Iniciá sesión para continuar.');
});

test('6 · la raíz encuentra la sesión y la pantalla que seguían en el proceso; vencida, lo dice con su sesión; olvidada, no vuelve', () => {
  assert.deepEqual(memoria.sesionAlMontar(0, 0), { estado: 'ninguna' }, 'proceso nuevo: no hay sesión ni motivo');
  const sesion = memoria.crearSesion(INICIO, 1_000, Date.parse('2026-10-03T12:00:00Z'));
  memoria.recordarSesion(sesion, { nombre: 'mi-evolucion' });
  assert.deepEqual(memoria.sesionAlMontar(1_000 + 60_000, 0), { estado: 'vigente', sesion, ruta: { nombre: 'mi-evolucion' } });
  assert.deepEqual(memoria.sesionAlMontar(1_000 + DOCE_HORAS, 0), { estado: 'vencida', sesion });
  memoria.olvidarSesion();
  assert.deepEqual(memoria.sesionAlMontar(1_000, 0), { estado: 'ninguna' });
});

test('6 · con el teléfono dormido el reloj monótono se detiene: si el de pared dice que pasó la vigencia, la sesión «quizás venció» y no se declara', () => {
  const sesion = memoria.crearSesion(INICIO, 1_000, Date.parse('2026-10-03T12:00:00Z'));
  // Toda la noche dormido: el monótono avanzó 5 minutos; el de pared, 13 horas.
  assert.ok(memoria.restanteMs(sesion, 1_000 + 300_000, Date.parse('2026-10-04T01:00:00Z')) > 0, 'no se declara vencida');
  assert.equal(memoria.quizasVencida(sesion, Date.parse('2026-10-04T01:00:00Z')), true, 'pero no se muestra nada sin preguntar');
  assert.equal(memoria.quizasVencida(sesion, Date.parse('2026-10-03T13:00:00Z')), false);
});

test('6 · la sesión en memoria no toca ningún almacenamiento del teléfono', () => {
  const fuente = readFileSync(resolve(RAIZ, 'apps/mobile/src/sesion-en-memoria.ts'), 'utf8');
  const importaciones = fuente.split('\n').filter((l) => /^import /.test(l));
  assert.deepEqual(importaciones, ["import type { Ruta } from './navegacion';"]);
  assert.doesNotMatch(fuente, /AsyncStorage|SecureStore|localStorage/);
});

// ─── 7. Altura de las zonas: volver deja la zona donde estaba, aunque la verificación tarde ───────────────────────

const altura = await import('../apps/mobile/src/altura-de-las-zonas.ts');

test('la zona vuelve a su altura aunque la API confirme después de 1,5 s (la red del teléfono)', () => {
  const r = altura.crearRestauracionDeAltura();
  r.pedir(900, 0);
  // Mientras se verifica, se ve el esqueleto: no alcanza la altura y se espera.
  assert.equal(r.alCambiarElAlto(700, 300), null);
  // La API confirma a los 2,4 s y aparece el contenido.
  assert.equal(r.alCambiarElAlto(2600, 2400), 900);
  // Una sola vez: lo que crezca después no vuelve a mover la pantalla.
  assert.equal(r.alCambiarElAlto(3000, 2500), null);
});

test('si la persona mueve la pantalla mientras espera, manda ella', () => {
  const r = altura.crearRestauracionDeAltura();
  r.pedir(900, 0);
  r.alArrastrar();
  assert.equal(r.alCambiarElAlto(2600, 2400), null);
});

test('pasado el tope, un contenido tardío no mueve la pantalla (un «Reintentar» a los 20 s)', () => {
  const r = altura.crearRestauracionDeAltura();
  r.pedir(900, 0);
  assert.equal(r.alCambiarElAlto(2600, altura.TOPE_DE_LA_ESPERA_MS + 1), null);
  assert.equal(r.alCambiarElAlto(2600, 20_000), null);
});

test('una zona que se dejó arriba, o una pantalla que no es zona, abre arriba sin esperar nada', () => {
  const r = altura.crearRestauracionDeAltura();
  r.pedir(0, 0);
  assert.equal(r.alCambiarElAlto(2600, 100), null);
});

test('la raíz de la APK usa la restauración y la descarta cuando la persona arrastra', () => {
  const APP = readFileSync(resolve(RAIZ, 'apps/mobile/App.tsx'), 'utf8');
  assert.match(APP, /crearRestauracionDeAltura/);
  assert.match(APP, /onScrollBeginDrag=\{restauracion\.alArrastrar\}/);
  assert.match(APP, /restauracion\.pedir\(/);
  assert.match(APP, /restauracion\.alCambiarElAlto\(/);
  assert.doesNotMatch(APP, /Date\.now\(\) \+ 1500/, 'el plazo fijo de 1,5 s dejaba la zona arriba con la red del teléfono');
});
