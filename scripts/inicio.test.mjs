/**
 * Inicio de la APK (DL-117, decisión de Dirección del 2026-10-04). Prueba sin teléfono lo que decide qué se muestra y
 * cuánto se pide:
 *  1. Las lecturas de Inicio (`apps/mobile/src/lecturas-de-inicio.ts`), con respuestas controladas: el último registro
 *     solo si hoy no hay, con `limit` 1; la actividad con las correcciones aplicadas; las pendientes con `hasMore` y el
 *     A3; y ninguna falla disfrazada de dato.
 *  2. Los textos y criterios: registros que no se presentan como comidas del plan, y la medida destacada con un
 *     criterio fijo.
 *  3. El día de la API: cuánto falta para la medianoche, la fecha del saludo y el período de 30 días.
 *  4. Cuántas solicitudes hace una visita a Inicio: al abrir, al volver y después de registrar. Cada tarjeta pide una vez
 *     por entrada (G2 de `ciclo-de-lectura.ts`); la prueba cuenta con un cliente que anota cada pedido.
 *  5. Lo que la pantalla tiene que cumplir y se ve en su código: las claves compartidas, los destinos tipados y que no
 *     escribe.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inicio = await import('../apps/mobile/src/lecturas-de-inicio.ts');
const zonas = await import('../apps/mobile/src/lecturas-de-las-zonas.ts');
const formato = await import('../apps/mobile/src/formato.ts');

// ─── Respuestas de prueba ───────────────────────────────────────────────────────────────────────

const ok = (datos) => ({ ok: true, datos });
const falla = (status, codigo, tipo = 'API') => (tipo === 'RED' ? { ok: false, tipo: 'RED' } : { ok: false, tipo: 'API', status, codigo, issues: [] });
const SIN_RED = falla(0, '', 'RED');
const SIN_A3 = falla(403, 'ACTION_FORBIDDEN');
const VENCIDA = falla(401, 'SESSION_EXPIRED');

const ingesta = (id, origin, recordedAt, localDate = '2026-10-04') => ({ executionId: id, origin, recordedAt, localDate });
const hoyNutricional = (registeredIntake = [], extra = {}) => ({
  data: { date: '2026-10-04', timeZone: 'America/Argentina/Buenos_Aires', planState: 'AVAILABLE', activePlan: null, selectedDayTypeId: null, registeredIntake, dataState: registeredIntake.length ? 'HAS_DATA' : 'NO_DATA', ...extra },
});
const ejecucion = (id, condicion, correcciones = []) => ({
  executionId: id,
  original: { sessionCondition: condicion },
  corrections: correcciones.map((c, i) => ({ correctionId: `${id}-c${i}`, correction: { sessionCondition: c } })),
  effectiveView: correcciones.length ? { kind: 'CORRECTED', correctionId: `${id}-c${correcciones.length - 1}` } : { kind: 'ORIGINAL' },
});
const solicitud = (id, extra = {}) => ({ formRequestId: id, status: 'PENDING', respondable: true, templateName: `Plantilla ${id}`, professional: { identityId: 'p', displayName: 'Lic. Prueba' }, createdAt: '2026-10-01T12:00:00.000Z', ...extra });
const a3 = (estado) => ok({ data: { currentConsent: estado ? { state: estado } : null } });

/** Un cliente de la API que responde lo que se le da y anota cada pedido. */
function clienteDePrueba(respuestas = {}) {
  const pedidos = [];
  const responder = (nombre, ...args) => {
    pedidos.push({ nombre, args });
    const r = respuestas[nombre];
    return Promise.resolve(typeof r === 'function' ? r(...args) : r);
  };
  const api = {
    hoyDeEntrenamiento: (...a) => responder('hoyDeEntrenamiento', ...a),
    hoyNutricional: (...a) => responder('hoyNutricional', ...a),
    listarMisIngestas: (...a) => responder('listarMisIngestas', ...a),
    misEjecucionesDeEntrenamiento: (...a) => responder('misEjecucionesDeEntrenamiento', ...a),
    misSolicitudesDeFormulario: (...a) => responder('misSolicitudesDeFormulario', ...a),
    consultarRequisitoA3: (...a) => responder('consultarRequisitoA3', ...a),
    miEvolucionAntropometrica: (...a) => responder('miEvolucionAntropometrica', ...a),
  };
  return { api, pedidos };
}

// ─── 1. Las lecturas ────────────────────────────────────────────────────────────────────────────

test('nutrición: con registros hoy no pide nada más; sin registros pide solo el último, con limit 1', async () => {
  const conRegistros = clienteDePrueba({ hoyNutricional: ok(hoyNutricional([ingesta('i1', 'PRESCRIBED', '2026-10-04T15:00:00Z')])) });
  const r1 = await inicio.leerNutricionDeInicio(conRegistros.api, 't', 'dia-1');
  assert.deepEqual(r1.datos.ultimo, { tipo: 'hoy' });
  assert.deepEqual(conRegistros.pedidos.map((p) => p.nombre), ['hoyNutricional']);
  assert.equal(conRegistros.pedidos[0].args[1], 'dia-1', 'el día del plan elegido viaja en la lectura');

  const sinRegistros = clienteDePrueba({ hoyNutricional: ok(hoyNutricional()), listarMisIngestas: ok({ data: [ingesta('i9', 'OUTSIDE_PRESCRIPTION', '2026-10-03T21:00:00Z', '2026-10-02')], page: { hasMore: true } }) });
  const r2 = await inicio.leerNutricionDeInicio(sinRegistros.api, 't', undefined);
  assert.deepEqual(r2.datos.ultimo, { tipo: 'anterior', registro: { executionId: 'i9', localDate: '2026-10-02', origin: 'OUTSIDE_PRESCRIPTION' } });
  assert.deepEqual(sinRegistros.pedidos.map((p) => p.nombre), ['hoyNutricional', 'listarMisIngestas']);
  assert.deepEqual(sinRegistros.pedidos[1].args[1], { limit: '1' }, 'una sola fila: no recorre el historial');

  const nunca = clienteDePrueba({ hoyNutricional: ok(hoyNutricional()), listarMisIngestas: ok({ data: [], page: { hasMore: false } }) });
  assert.deepEqual((await inicio.leerNutricionDeInicio(nunca.api, 't')).datos.ultimo, { tipo: 'nunca' });
});

test('nutrición: una falla del último registro no se disfraza de dato', async () => {
  for (const [secundaria, esperado] of [
    [SIN_RED, { tipo: 'sin-leer' }],
    [falla(503, 'SERVICE_UNAVAILABLE'), { tipo: 'sin-leer' }],
    [falla(400, 'INVALID_REQUEST'), { tipo: 'sin-leer' }],
  ]) {
    const { api } = clienteDePrueba({ hoyNutricional: ok(hoyNutricional()), listarMisIngestas: secundaria });
    const r = await inicio.leerNutricionDeInicio(api, 't');
    assert.ok(r.ok, 'la tarjeta muestra el plan y lo de hoy');
    assert.deepEqual(r.datos.ultimo, esperado, 'y no dice «nunca registraste» sin saberlo');
  }
  // De sesión o de acceso: se devuelve la falla, para que la app salga de la sesión o muestre el aviso del A3.
  for (const secundaria of [VENCIDA, SIN_A3]) {
    const { api } = clienteDePrueba({ hoyNutricional: ok(hoyNutricional()), listarMisIngestas: secundaria });
    assert.deepEqual(await inicio.leerNutricionDeInicio(api, 't'), secundaria);
  }
  // Sin el A3, «Hoy» ya responde 403 y no se pide nada más.
  const sinA3 = clienteDePrueba({ hoyNutricional: SIN_A3 });
  assert.deepEqual(await inicio.leerNutricionDeInicio(sinA3.api, 't'), SIN_A3);
  assert.equal(sinA3.pedidos.length, 1);
});

test('actividad: cuenta por la condición vigente, con las correcciones aplicadas, y guarda solo el resumen', async () => {
  const { api, pedidos } = clienteDePrueba({
    misEjecucionesDeEntrenamiento: ok({
      data: {
        period: { start: '2026-09-05', end: '2026-10-04' },
        executions: [
          ejecucion('a', 'COMPLETED'),
          ejecucion('b', 'COMPLETED_WITH_DEVIATION'),
          ejecucion('c', 'NOT_COMPLETED'),
          // Registrada como realizada y corregida a «no realizada»: cuenta como no realizada.
          ejecucion('d', 'COMPLETED', ['NOT_COMPLETED']),
          // Corregida dos veces: rige la última.
          ejecucion('e', 'NOT_COMPLETED', ['COMPLETED_WITH_DEVIATION', 'COMPLETED']),
        ],
      },
    }),
  });
  const periodo = { periodStart: '2026-09-05', periodEnd: '2026-10-04' };
  const r = await inicio.leerActividadDeEntrenamiento(api, 't', periodo);
  assert.deepEqual(r.datos, { periodo: { desde: '2026-09-05', hasta: '2026-10-04' }, registradas: 5, realizadas: 2, conDesvio: 1, noRealizadas: 2, corregidas: 2 });
  assert.deepEqual(pedidos[0].args[1], periodo);
  assert.deepEqual(await inicio.leerActividadDeEntrenamiento(clienteDePrueba({ misEjecucionesDeEntrenamiento: SIN_A3 }).api, 't', periodo), SIN_A3);
});

test('pendientes: pide solo las pendientes, con un tope, y dice si hay más; el A3 se lee y no se supone', async () => {
  const { api, pedidos } = clienteDePrueba({
    misSolicitudesDeFormulario: ok({ data: [solicitud('s1'), solicitud('s2', { respondable: false }), solicitud('s3')], page: { limit: 3, nextCursor: 'c', hasMore: true } }),
    consultarRequisitoA3: a3('ACTIVE'),
  });
  const r = await inicio.leerPendientes(api, 't');
  assert.deepEqual(pedidos.find((p) => p.nombre === 'misSolicitudesDeFormulario').args[1], { status: 'PENDING', limit: String(inicio.PENDIENTES_EN_INICIO) });
  assert.equal(r.datos.pendientes.length, 3);
  assert.equal(r.datos.hayMas, true, 'con más páginas, la cuenta no es el total');
  assert.equal(r.datos.sinA3, false);
  // El A3 revocado o nunca otorgado se muestra; si no se pudo leer, se devuelve la falla.
  for (const [requisito, esperado] of [
    [a3('REVOKED'), true],
    [a3(null), true],
  ]) {
    const otro = clienteDePrueba({ misSolicitudesDeFormulario: ok({ data: [solicitud('s1')], page: { limit: 3, nextCursor: null, hasMore: false } }), consultarRequisitoA3: requisito });
    assert.equal((await inicio.leerPendientes(otro.api, 't')).datos.sinA3, esperado);
  }
  for (const requisito of [SIN_RED, VENCIDA]) {
    const otro = clienteDePrueba({ misSolicitudesDeFormulario: ok({ data: [], page: { limit: 3, nextCursor: null, hasMore: false } }), consultarRequisitoA3: requisito });
    assert.deepEqual(await inicio.leerPendientes(otro.api, 't'), requisito);
  }
});

// ─── 2. Textos y criterios ──────────────────────────────────────────────────────────────────────

test('los registros de hoy se cuentan como registros, separando los del plan y los de fuera del plan', () => {
  assert.equal(inicio.textoDeRegistrosDeHoy([{ origin: 'PRESCRIBED' }]), 'Hoy hiciste 1 registro del plan.');
  assert.equal(inicio.textoDeRegistrosDeHoy([{ origin: 'OUTSIDE_PRESCRIPTION' }, { origin: 'OUTSIDE_PRESCRIPTION' }]), 'Hoy hiciste 2 registros fuera del plan.');
  assert.equal(inicio.textoDeRegistrosDeHoy([{ origin: 'PRESCRIBED' }, { origin: 'PRESCRIBED' }, { origin: 'OUTSIDE_PRESCRIPTION' }]), 'Hoy hiciste 3 registros: 2 del plan y 1 fuera del plan.');
  for (const texto of [inicio.textoDeRegistrosDeHoy([{ origin: 'PRESCRIBED' }]), inicio.textoDeRegistrosDeHoy([{ origin: 'PRESCRIBED' }, { origin: 'OUTSIDE_PRESCRIPTION' }])]) {
    assert.doesNotMatch(texto, /%|\bde \d+ comidas|cumpl|adherencia/i, 'sin porcentajes, sin «2 de 4 comidas» y sin juicios');
  }
});

test('la medida destacada sigue un criterio fijo: la primera de la toma en el orden del catálogo, o el primer resultado', () => {
  const m = (metrica) => ({ metrica });
  assert.equal(inicio.medidaDestacada({ medidas: [m('peso'), m('talla')], derivadas: [m('imc')] }).metrica, 'peso');
  assert.equal(inicio.medidaDestacada({ medidas: [], derivadas: [m('imc')] }).metrica, 'imc');
  assert.equal(inicio.medidaDestacada({ medidas: [], derivadas: [] }), null);
});

// ─── 3. El día de la API ────────────────────────────────────────────────────────────────────────

test('el día cambia a la medianoche de Buenos Aires, no a la de UTC ni a la del teléfono', () => {
  const ZONA = formato.ZONA_DE_LA_API;
  // 23:59:00 en Buenos Aires (UTC−3): falta un minuto, más el medio segundo de margen.
  assert.equal(formato.msHastaElProximoDia(ZONA, new Date('2026-10-05T02:59:00.000Z')), 60_500);
  // 00:00:01: casi un día entero.
  assert.equal(formato.msHastaElProximoDia(ZONA, new Date('2026-10-05T03:00:01.000Z')), 86_399_500);
  // A las 21:30 de Buenos Aires la fecha UTC ya es mañana; el día de la API, no.
  assert.equal(formato.hoyEnZona(ZONA, new Date('2026-10-05T00:30:00.000Z')), '2026-10-04');
  assert.equal(formato.msHastaElProximoDia(ZONA, new Date('2026-10-05T00:30:00.000Z')), 2.5 * 3_600_000 + 500);
});

test('el saludo dice el día civil sin correrlo, y la actividad mira los 30 días que terminan hoy', () => {
  assert.match(formato.fechaLarga('2026-10-04'), /^Domingo,? 4 de octubre$/);
  assert.match(formato.fechaLarga('2026-01-01'), /^Jueves,? 1 de enero$/);
  assert.deepEqual(formato.ultimosDiasHasta('2026-10-04', 30), { periodStart: '2026-09-05', periodEnd: '2026-10-04' });
  assert.deepEqual(formato.ultimosDiasHasta('2026-03-01', 30), { periodStart: '2026-01-31', periodEnd: '2026-03-01' });
});

// ─── 4. Cuántas solicitudes hace una visita ─────────────────────────────────────────────────────

/** Una visita a Inicio: cada tarjeta pide lo suyo una vez, como lo hace su `useLecturaRecordada` al montarse. */
async function visita(api, { diaTipo } = {}) {
  await Promise.all([
    api.hoyDeEntrenamiento('t'),
    inicio.leerNutricionDeInicio(api, 't', diaTipo),
    inicio.leerPendientes(api, 't'),
    inicio.leerActividadDeEntrenamiento(api, 't', formato.ultimosDiasHasta('2026-10-04', inicio.DIAS_DE_ACTIVIDAD)),
    zonas.leerMiEvolucion(api, 't'),
  ]);
}
const conMediciones = { data: { period: { start: '2026-07-07', end: '2026-10-04', timeZone: 'America/Argentina/Buenos_Aires' }, metrics: [{ metricCode: 'peso', series: [{}] }] } };
const sinMediciones = { data: { period: { start: '2026-07-07', end: '2026-10-04', timeZone: 'America/Argentina/Buenos_Aires' }, metrics: [{ metricCode: 'peso', series: [] }] } };
const respuestasComunes = (registrosDeHoy, evolucion = conMediciones) => ({
  hoyDeEntrenamiento: ok({ data: { date: '2026-10-04', planState: 'AVAILABLE', occurrences: [] } }),
  hoyNutricional: ok(hoyNutricional(registrosDeHoy)),
  listarMisIngestas: ok({ data: [], page: { hasMore: false } }),
  misEjecucionesDeEntrenamiento: ok({ data: { period: {}, executions: [] } }),
  misSolicitudesDeFormulario: ok({ data: [], page: { limit: 3, nextCursor: null, hasMore: false } }),
  consultarRequisitoA3: a3('ACTIVE'),
  miEvolucionAntropometrica: ok(evolucion),
});

test('una visita a Inicio hace 6 solicitudes, 7 si hoy no hay registros de comidas; volver hace las mismas', async () => {
  const conRegistros = clienteDePrueba(respuestasComunes([ingesta('i1', 'PRESCRIBED', '2026-10-04T15:00:00Z')]));
  await visita(conRegistros.api);
  assert.equal(conRegistros.pedidos.length, 6);
  // Volver a Inicio: cada tarjeta verifica de nuevo antes de mostrar (G2). Lo recordado evita recalcular, no pedir.
  await visita(conRegistros.api);
  assert.equal(conRegistros.pedidos.length, 12);

  const sinRegistros = clienteDePrueba(respuestasComunes([]));
  await visita(sinRegistros.api);
  assert.equal(sinRegistros.pedidos.length, 7);
  assert.deepEqual(
    [...new Set(sinRegistros.pedidos.map((p) => p.nombre))].sort(),
    ['consultarRequisitoA3', 'hoyDeEntrenamiento', 'hoyNutricional', 'listarMisIngestas', 'miEvolucionAntropometrica', 'misEjecucionesDeEntrenamiento', 'misSolicitudesDeFormulario'],
  );
  // Ninguna escribe: todas son lecturas.
  assert.ok(sinRegistros.pedidos.every((p) => !/^(abrir|guardar|registrar|confirmar|corregir|otorgar|revocar)/.test(p.nombre)));
});

test('sin mediciones en 90 días, «Mi evolución» mira hacia atrás hasta un año: hasta 3 solicitudes más', async () => {
  const { api, pedidos } = clienteDePrueba(respuestasComunes([ingesta('i1', 'PRESCRIBED', '2026-10-04T15:00:00Z')], sinMediciones));
  await visita(api);
  assert.equal(pedidos.filter((p) => p.nombre === 'miEvolucionAntropometrica').length, 4);
  assert.equal(pedidos.length, 9);
});

// ─── 5. Lo que se ve en el código de la pantalla ───────────────────────────────────────────────

/** La pantalla y sus tarjetas, una por módulo (`inicio-*.tsx`), con sus piezas comunes. */
const ARCHIVOS = ['inicio.tsx', 'inicio-entrenamiento.tsx', 'inicio-nutricion.tsx', 'inicio-informacion.tsx', 'inicio-mediciones.tsx', 'tarjeta-de-inicio.tsx'];
const fuente = (archivo) => readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas', archivo), 'utf8');
const PANTALLA = ARCHIVOS.map(fuente).join('\n');

test('cada tarjeta lee sola, con la clave de su módulo cuando es la misma lectura', () => {
  const claves = [...PANTALLA.matchAll(/useLecturaRecordada\(token, (`[^`]+`|'[^']+')/g)].map((m) => m[1]);
  assert.deepEqual(
    claves.sort(),
    ['`entrenamiento-hoy:${dia}`', '`inicio-actividad:${periodo.periodStart}:${periodo.periodEnd}`', '`inicio-nutricion:${dia}:${diaTipo ?? \'\'}`', "'inicio-pendientes'", "'mi-evolucion:ultimos-90'"].sort(),
  );
  // Las cinco tarjetas están en la pantalla, cada una con su lectura.
  const PRINCIPAL = fuente('inicio.tsx');
  for (const tarjeta of ['EntrenamientoDeHoy', 'NutricionDeHoy', 'Pendientes', 'ActividadDeEntrenamiento', 'Mediciones']) assert.match(PRINCIPAL, new RegExp(`<${tarjeta} `));
  // El día del plan es la misma elección que en Nutrición: elegirlo en Inicio vale en las dos pantallas.
  assert.match(PANTALLA, /useSeleccionRecordada<string \| undefined>\(token, 'hoy-nutricional:dia', undefined\)/);
  const NUTRICION = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/nutricion.tsx'), 'utf8');
  const ENTRENAMIENTO = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), 'utf8');
  assert.match(NUTRICION, /useSeleccionRecordada<string \| undefined>\(token, 'hoy-nutricional:dia', undefined\)/);
  assert.match(ENTRENAMIENTO, /useLecturaRecordada\(token, `entrenamiento-hoy:\$\{hoyDeLaApi\}`/);
});

test('las acciones van a destinos tipados, y la única escritura es abrir un borrador al tocar «Comenzar» o «Continuar»', () => {
  for (const destino of [
    "ir({ nombre: 'hoy', accion: 'registrar' })",
    "ir({ nombre: 'plan-actual' })",
    "ir({ nombre: 'mi-evolucion', vista: 'ultima' })",
    "ir({ nombre: 'mi-evolucion', vista: 'evolucion', metrica: destacada.metrica })",
    "ir({ nombre: 'mi-solicitud', id: s.formRequestId })",
    "ir({ nombre: 'ejecucion-de-entrenamiento', id: executionId })",
    "ir({ nombre: 'historial-de-entrenamiento' })",
  ]) {
    assert.ok(PANTALLA.includes(destino), `falta ${destino}`);
  }
  // Inicio no llama a ninguna operación de escritura del cliente: abrir el borrador pasa por el circuito compartido.
  assert.doesNotMatch(PANTALLA, /api\.(abrir|guardar|registrar|confirmar|corregir|otorgar|revocar|responder)/);
  assert.match(PANTALLA, /useAbrirOcurrencia\(\{ ocurrencia: o, token, sesionPerdida, accesoRetirado, ir \}\)/);
  assert.match(PANTALLA, /onPress=\{\(\) => void abrir\(\)\}/, 'abrir el borrador va solo al tocar');
});

test('el saludo es neutro y no hay marcas de progreso', () => {
  const codigo = PANTALLA.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.match(codigo, /<Titulo>Hola<\/Titulo>/);
  assert.doesNotMatch(codigo, /displayName\}?\s*\}?<\/Titulo>|profile|iniciales/i, 'sin nombre ni iniciales en el saludo (D-2)');
  assert.doesNotMatch(codigo, /`[^`]*\$\{[^}]+\}\s*\/\s*\$\{[^}]+\}[^`]*`/, 'sin «2/4»');
  assert.doesNotMatch(codigo, /%/, 'ni en el texto ni en los estilos: la prueba de textos no distingue los anchos');
});
