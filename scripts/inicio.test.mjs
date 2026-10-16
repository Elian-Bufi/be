/**
 * Inicio de la APK (DL-117, decisión de Dirección del 2026-10-04). Prueba sin teléfono lo que decide qué se muestra y
 * cuánto se pide:
 *  1. Las lecturas de Inicio (`apps/mobile/src/lecturas-de-inicio.ts`), con respuestas controladas: el último registro
 *     como lectura aparte, con `limit` 1; la actividad con las correcciones aplicadas y el período que respondió la API;
 *     las pendientes con `hasMore` y el A3; y ninguna falla disfrazada de dato.
 *  2. Los textos y criterios: registros que no se presentan como comidas del plan, y la medida destacada con un
 *     criterio fijo.
 *  3. El día de la API, con la hora del servidor (`reloj-del-servidor.ts`): cuándo cambia con el teléfono adelantado o
 *     atrasado, y la actividad ante un período futuro: el rechazo, el período mostrado y la actualización posterior.
 *  4. Cuántas solicitudes hace una visita a Inicio: al abrir, al volver y después de registrar. Cada tarjeta pide una vez
 *     por entrada (G2 de `ciclo-de-lectura.ts`); la prueba cuenta con un cliente que anota cada pedido.
 *  5. Lo que la pantalla tiene que cumplir y solo se ve en su código: las claves compartidas, los destinos tipados y que
 *     no escribe.
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
const reloj = await import('../apps/mobile/src/reloj-del-servidor.ts');
const { COPY_NUTRICION } = await import('@be/domain');

// ─── Respuestas de prueba ───────────────────────────────────────────────────────────────────────

const ok = (datos) => ({ ok: true, datos });
const falla = (status, codigo, tipo = 'API') => (tipo === 'RED' ? { ok: false, tipo: 'RED' } : { ok: false, tipo: 'API', status, codigo, issues: [] });
const SIN_RED = falla(0, '', 'RED');
const SIN_A3 = falla(403, 'ACTION_FORBIDDEN');
const VENCIDA = falla(401, 'SESSION_EXPIRED');
/** La API rechaza un período que termina en un día que para ella todavía no llegó. */
const FUTURO = { ok: false, tipo: 'API', status: 400, codigo: 'INVALID_REQUEST', issues: [{ code: 'PERIOD_IN_FUTURE', path: 'periodEnd' }] };

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

test('nutrición: el último registro es una lectura aparte, de una sola fila', async () => {
  const conUno = clienteDePrueba({ listarMisIngestas: ok({ data: [ingesta('i9', 'OUTSIDE_PRESCRIPTION', '2026-10-03T21:00:00Z', '2026-10-02')], page: { hasMore: true } }) });
  assert.deepEqual((await inicio.leerUltimoRegistro(conUno.api, 't')).datos, { executionId: 'i9', localDate: '2026-10-02', origin: 'OUTSIDE_PRESCRIPTION' });
  assert.deepEqual(
    conUno.pedidos.map((p) => [p.nombre, p.args[1]]),
    [['listarMisIngestas', { limit: '1' }]],
    'una sola fila: no recorre el historial, y no vuelve a pedir «Hoy»',
  );
  const nunca = clienteDePrueba({ listarMisIngestas: ok({ data: [], page: { hasMore: false } }) });
  assert.equal((await inicio.leerUltimoRegistro(nunca.api, 't')).datos, null);
  // Las fallas se devuelven tal cual: la de sesión saca de la sesión, y la tarjeta decide qué decir con las demás.
  for (const f of [SIN_RED, VENCIDA, SIN_A3]) assert.deepEqual(await inicio.leerUltimoRegistro(clienteDePrueba({ listarMisIngestas: f }).api, 't'), f);
});

test('nutrición sin registros hoy: lo dice enseguida, completa el último cuando llega, y una falla no se disfraza de dato', () => {
  const fecha = (f) => `[${f}]`;
  const mientras = inicio.sinRegistrosDeHoy(null, fecha);
  assert.deepEqual(mientras, { texto: COPY_NUTRICION.sinRegistrosHoy, ultimo: null }, 'mientras se lee, solo lo que se sabe');
  assert.deepEqual(inicio.sinRegistrosDeHoy(ok({ executionId: 'i9', localDate: '2026-10-02', origin: 'PRESCRIBED' }), fecha), {
    texto: COPY_NUTRICION.sinRegistrosHoy,
    ultimo: { texto: 'Tu último registro es del [2026-10-02].', executionId: 'i9' },
  });
  assert.deepEqual(inicio.sinRegistrosDeHoy(ok(null), fecha), { texto: 'Todavía no registraste ninguna comida.', ultimo: null }, 'si nunca hubo uno, se dice una sola vez');
  for (const f of [SIN_RED, falla(503, 'SERVICE_UNAVAILABLE'), falla(400, 'INVALID_REQUEST'), SIN_A3]) {
    assert.deepEqual(inicio.sinRegistrosDeHoy(f, fecha), mientras, 'una falla no dice «nunca» ni inventa una fecha');
  }
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
          // Con correcciones que no se pueden ordenar: rige el original, y no se presenta como corregida.
          { ...ejecucion('f', 'COMPLETED', ['NOT_COMPLETED']), effectiveView: { kind: 'NOT_RESOLVABLE' } },
        ],
      },
    }),
  });
  const periodo = { periodStart: '2026-09-05', periodEnd: '2026-10-04' };
  const r = await inicio.leerActividadDeEntrenamiento(api, 't', periodo);
  assert.deepEqual(r.datos, { periodo: { desde: '2026-09-05', hasta: '2026-10-04' }, registradas: 6, realizadas: 3, conDesvio: 1, noRealizadas: 2, corregidas: 2, sinOrdenar: 1 });
  assert.deepEqual(pedidos[0].args[1], periodo);
  assert.deepEqual(await inicio.leerActividadDeEntrenamiento(clienteDePrueba({ misEjecucionesDeEntrenamiento: SIN_A3 }).api, 't', periodo), SIN_A3);
});

test('actividad: si para la API el último día todavía es mañana, se pide una vez más, un día antes', async () => {
  const respuestas = [FUTURO, ok({ data: { period: { start: '2026-09-05', end: '2026-10-04', timeZone: formato.ZONA_DE_LA_API }, executions: [ejecucion('a', 'COMPLETED')] } })];
  const { api, pedidos } = clienteDePrueba({ misEjecucionesDeEntrenamiento: () => respuestas.shift() });
  const r = await inicio.leerActividadDeEntrenamiento(api, 't', { periodStart: '2026-09-06', periodEnd: '2026-10-05' });
  assert.deepEqual(pedidos.map((p) => p.args[1]), [
    { periodStart: '2026-09-06', periodEnd: '2026-10-05' },
    { periodStart: '2026-09-05', periodEnd: '2026-10-04' },
  ]);
  assert.deepEqual(r.datos.periodo, { desde: '2026-09-05', hasta: '2026-10-04' }, 'la tarjeta dice el período que la API respondió');
  // Un segundo rechazo no se reintenta más: se muestra como falla.
  const siempre = clienteDePrueba({ misEjecucionesDeEntrenamiento: FUTURO });
  assert.deepEqual(await inicio.leerActividadDeEntrenamiento(siempre.api, 't', { periodStart: '2026-09-06', periodEnd: '2026-10-05' }), FUTURO);
  assert.equal(siempre.pedidos.length, 2);
  // Mientras no hay respuesta, el encabezado no dice fechas: todavía no se sabe cuáles respondió la API.
  assert.equal(inicio.detalleDeActividad(null, formato.fechaCivil), 'Entrenamiento · últimos 30 días');
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

/**
 * El tiempo de la prueba: un reloj monótono que la prueba adelanta a mano, y un temporizador que cumple en orden las esperas
 * que vencen. La hora de pared del teléfono es aparte: se puede correr sin que el tiempo pase.
 */
function tiempoDePrueba(inicio, desfaseDePared = 0) {
  let ahora = inicio;
  let pared = desfaseDePared;
  let esperas = [];
  return {
    monotono: () => ahora,
    pared: () => ahora + pared,
    correrLaPared(ms) {
      pared += ms;
    },
    esperar(ms, alCumplirse) {
      const espera = { vence: ahora + ms, alCumplirse };
      esperas.push(espera);
      return () => {
        esperas = esperas.filter((e) => e !== espera);
      };
    },
    adelantar(ms) {
      const fin = ahora + ms;
      for (;;) {
        const proxima = esperas.filter((e) => e.vence <= fin).sort((a, b) => a.vence - b.vence)[0];
        if (!proxima) break;
        esperas = esperas.filter((e) => e !== proxima);
        ahora = proxima.vence;
        proxima.alCumplirse();
      }
      ahora = fin;
    },
    pendientes: () => esperas.length,
  };
}

/** La cabecera `Date` que manda el servidor a una hora dada: en segundos enteros, truncada. */
const cabeceraDate = (horaDelServidor) => new Date(Math.floor(horaDelServidor / 1000) * 1000).toUTCString();

/** 00:00 del 5 de octubre en Buenos Aires (UTC−3). */
const MEDIANOCHE = Date.parse('2026-10-05T03:00:00.000Z');

test('el día cambia a la medianoche de Buenos Aires, no a la de UTC ni a la del teléfono', () => {
  const ZONA = formato.ZONA_DE_LA_API;
  // 23:59:00 en Buenos Aires (UTC−3): falta un minuto, más el medio segundo de margen.
  assert.equal(formato.msHastaElProximoDia(ZONA, new Date('2026-10-05T02:59:00.000Z')), 60_500);
  // 00:00:01: casi un día entero.
  assert.equal(formato.msHastaElProximoDia(ZONA, new Date('2026-10-05T03:00:01.000Z')), 86_399_500);
  // A las 21:30 de Buenos Aires la fecha UTC ya es mañana; el día de la API, no.
  assert.equal(formato.diaDeLaApi(Date.parse('2026-10-05T00:30:00.000Z')), '2026-10-04');
  assert.equal(formato.msHastaLaMedianocheDeLaApi(Date.parse('2026-10-05T00:30:00.000Z')), 2.5 * 3_600_000 + 500);
});

test('la hora del servidor: sin respuestas es la del teléfono; con la cabecera Date, nunca se adelanta', () => {
  // En la prueba, el reloj monótono marca la hora del servidor: así se compara directo. La pared del teléfono va 40 s adelantada.
  const t = tiempoDePrueba(MEDIANOCHE - 29_300, 40_000);
  const r = reloj.crearRelojDelServidor(t);
  assert.equal(r.conocido(), false);
  assert.equal(r.ahora(), MEDIANOCHE - 29_300 + 40_000, 'sin respuestas no hay otra fuente que el teléfono');
  let avisos = 0;
  const desuscribir = r.suscribir(() => avisos++);
  // Sale a las 23:59:30.700 del servidor (la cabecera dice 23:59:30) y llega 300 ms después.
  t.adelantar(300);
  r.registrar(cabeceraDate(MEDIANOCHE - 29_300));
  assert.equal(r.conocido(), true);
  assert.equal(avisos, 1);
  assert.ok(r.ahora() <= t.monotono(), 'la estimación no pasa la hora real del servidor');
  assert.ok(t.monotono() - r.ahora() <= 1000 + 300, 'y se atrasa a lo sumo un segundo más la latencia');
  // Una respuesta que tardó en bajar da una cota peor: se descarta.
  t.adelantar(60_000);
  r.registrar(cabeceraDate(t.monotono() - 4_000));
  assert.equal(avisos, 1);
  assert.ok(t.monotono() - r.ahora() <= 1300, 'la respuesta lenta no atrasa la estimación');
  // Una más ajustada (truncamiento chico, llegada rápida) la mejora sin avisar: menos de un segundo no cambia el día.
  const antes = r.ahora();
  t.adelantar(10_400);
  r.registrar(cabeceraDate(t.monotono()));
  assert.ok(r.ahora() >= antes + 10_000 && r.ahora() <= t.monotono());
  assert.equal(avisos, 1);
  // Una cabecera que falta o no se entiende no cambia nada.
  for (const mala of [null, undefined, '', 'ayer']) r.registrar(mala);
  assert.equal(avisos, 1);
  desuscribir();
});

test('la hora del teléfono no mueve la estimación: ni si la persona la cambia ni si la red la corrige', () => {
  // El caso de la revisión independiente: llega una respuesta a las 23:00:00,950 (la cabecera trunca 950 ms), el teléfono
  // se adelanta 1,5 s y la respuesta de las 23:30:00,100 difiere 650 ms. Con el desfase contra la pared, la estimación
  // quedaba 550 ms adelantada. Con el reloj monótono, la pared no cuenta.
  const t = tiempoDePrueba(MEDIANOCHE - 3_600_000 + 950);
  const r = reloj.crearRelojDelServidor(t);
  r.registrar(cabeceraDate(t.monotono()));
  t.correrLaPared(1_500);
  t.adelantar(1_800_000 - 850);
  r.registrar(cabeceraDate(t.monotono()));
  for (const salto of [1_500, 3_600_000, -3_600_000]) {
    t.correrLaPared(salto);
    assert.ok(r.ahora() <= t.monotono(), `con la pared corrida ${salto} ms, la estimación no se adelanta`);
  }
  // Recorrida la hora hasta la medianoche, el día cambia recién cuando el servidor cambia.
  t.adelantar(MEDIANOCHE - t.monotono() - 1);
  assert.equal(formato.diaDeLaApi(r.ahora()), '2026-10-04');
});

test('una referencia de más de diez minutos se renueva aunque la cabecera nueva sea menos ajustada', () => {
  const t = tiempoDePrueba(MEDIANOCHE - 7_200_000);
  const r = reloj.crearRelojDelServidor(t);
  r.registrar(cabeceraDate(t.monotono()));
  t.adelantar(reloj.VIGENCIA_DE_LA_REFERENCIA_MS + 1_000);
  // Una respuesta lenta, de 2 s: antes de vencer se descartaba; vencida la referencia, se toma.
  r.registrar(cabeceraDate(t.monotono() - 2_000));
  const atraso = t.monotono() - r.ahora();
  assert.ok(atraso >= 2_000 && atraso <= 3_000, `la estimación queda ${atraso} ms atrás, nunca adelante`);
});

test('el día que muestra la app no vuelve atrás, salvo al pasar de la hora del teléfono a la del servidor', () => {
  const ayer = { dia: '2026-10-04', conocido: true };
  const hoy = { dia: '2026-10-05', conocido: true };
  // Ya pasada la medianoche, una estimación un poco más atrasada no devuelve el día anterior.
  assert.equal(reloj.diaSinRetroceso(hoy, '2026-10-04', true), hoy);
  assert.deepEqual(reloj.diaSinRetroceso(ayer, '2026-10-05', true), hoy);
  assert.equal(reloj.diaSinRetroceso(hoy, '2026-10-05', true), hoy, 'sin cambios, el mismo objeto: la pantalla no vuelve a dibujarse');
  // Con la hora del teléfono adelantada, antes de la primera respuesta, el día pudo adelantarse: la del servidor lo corrige.
  assert.deepEqual(reloj.diaSinRetroceso({ dia: '2026-10-05', conocido: false }, '2026-10-04', true), ayer);
  assert.deepEqual(reloj.diaSinRetroceso(null, '2026-10-04', false), { dia: '2026-10-04', conocido: false });
});

test('el cambio de día sigue la medianoche del servidor con cualquier hora en el teléfono: nunca antes, y enseguida', () => {
  for (const desfase of [-7_200_000, -40_000, -4_000, 0, 3_000, 5_000, 40_000, 7_200_000]) {
    for (const latencia of [0, 120, 900]) {
      const caso = `teléfono ${desfase / 1000} s, latencia ${latencia} ms`;
      // Una respuesta sale a las 23:58:12.345 del servidor y llega `latencia` ms después. El monótono marca la hora del servidor.
      const t = tiempoDePrueba(MEDIANOCHE - 107_655, desfase);
      const r = reloj.crearRelojDelServidor(t);
      t.adelantar(latencia);
      r.registrar(cabeceraDate(MEDIANOCHE - 107_655));
      const cambios = [];
      const vigia = reloj.vigilarElDia(r, formato.msHastaLaMedianocheDeLaApi, t, () => cambios.push({ servidor: t.monotono(), dia: formato.diaDeLaApi(r.ahora()) }));
      assert.equal(formato.diaDeLaApi(r.ahora()), '2026-10-04', caso);
      t.adelantar(3 * 60_000);
      vigia.parar();
      assert.equal(cambios.length, 1, caso);
      assert.equal(cambios[0].dia, '2026-10-05', caso);
      // Con el margen fijo de 5 s, un teléfono adelantado más de 5 s pedía antes de la medianoche del servidor: la API
      // respondía el día anterior y quedaba guardado con la clave del día nuevo.
      assert.ok(cambios[0].servidor >= MEDIANOCHE, `cuando cambia el día, el servidor ya está en el día nuevo (${caso})`);
      assert.ok(cambios[0].servidor - MEDIANOCHE <= 1000 + latencia + 500, `y cambia enseguida: truncamiento, latencia y medio segundo (${caso})`);
      assert.equal(t.pendientes(), 0, 'parar cancela la espera');
    }
  }
});

test('actividad: rechazo por período futuro, período mostrado y actualización posterior, con la hora del servidor', async () => {
  // La hora del teléfono va 40 s adelantada: a las 23:59:30 del servidor, para el teléfono ya es el 5/10. El monótono marca
  // la hora del servidor.
  const t = tiempoDePrueba(MEDIANOCHE - 30_000, 40_000);
  const r = reloj.crearRelojDelServidor(t);
  // La API de prueba manda su hora en cada respuesta, rechaza un período que termina después de su día y responde el pedido.
  const { api, pedidos } = clienteDePrueba({
    misEjecucionesDeEntrenamiento: (_token, p) => {
      r.registrar(cabeceraDate(t.monotono()));
      if (p.periodEnd > formato.diaDeLaApi(t.monotono())) return FUTURO;
      return ok({ data: { period: { start: p.periodStart, end: p.periodEnd, timeZone: formato.ZONA_DE_LA_API }, executions: [ejecucion('a', 'COMPLETED')] } });
    },
  });
  // La tarjeta, como en la pantalla: el día que se muestra (sin retroceso), sus 30 días, la lectura y el encabezado.
  let dia = null;
  const mirarElDia = () => {
    dia = reloj.diaSinRetroceso(dia, formato.diaDeLaApi(r.ahora()), r.conocido());
  };
  const tarjeta = async () => {
    mirarElDia();
    const leida = await inicio.leerActividadDeEntrenamiento(api, 't', formato.ultimosDiasHasta(dia.dia, inicio.DIAS_DE_ACTIVIDAD));
    return { dia: dia.dia, encabezado: inicio.detalleDeActividad(leida.ok ? leida.datos.periodo : null, formato.fechaCivil) };
  };
  const encabezado = (desde, hasta) => `Entrenamiento · últimos 30 días, del ${formato.fechaCivil(desde)} al ${formato.fechaCivil(hasta)}`;
  let avisos = 0;
  const vigia = reloj.vigilarElDia(r, formato.msHastaLaMedianocheDeLaApi, t, () => avisos++);

  // 1. Antes de la primera respuesta solo está la hora del teléfono: pide hasta el 5/10, la API lo rechaza y se pide un día antes.
  const primera = await tarjeta();
  assert.equal(primera.dia, '2026-10-05');
  assert.deepEqual(pedidos.map((p) => p.args[1].periodEnd), ['2026-10-05', '2026-10-04']);
  // 2. El encabezado dice el período que respondió la API, no el pedido.
  assert.equal(primera.encabezado, encabezado('2026-09-05', '2026-10-04'));
  // La respuesta trajo la hora del servidor: el día vuelve al 4/10 (el único retroceso permitido) y la pantalla vuelve a mirar.
  assert.equal(avisos, 1);
  const segunda = await tarjeta();
  assert.equal(segunda.dia, '2026-10-04');
  assert.equal(pedidos.length, 3, 'ya sin rechazo');
  assert.equal(segunda.encabezado, encabezado('2026-09-05', '2026-10-04'));
  // 3. A la medianoche del servidor, y no antes, cambia el día: la tarjeta vuelve a leer y dice el período nuevo.
  t.adelantar(29_000);
  assert.equal(avisos, 1, 'faltan segundos para la medianoche del servidor');
  assert.equal(formato.diaDeLaApi(r.ahora()), '2026-10-04');
  t.adelantar(2_000);
  assert.equal(avisos, 2);
  const tercera = await tarjeta();
  assert.equal(tercera.dia, '2026-10-05');
  assert.deepEqual(pedidos.at(-1).args[1], { periodStart: '2026-09-06', periodEnd: '2026-10-05' });
  assert.equal(pedidos.length, 4, 'sin rechazo: el servidor ya está en el 5/10');
  assert.equal(tercera.encabezado, encabezado('2026-09-06', '2026-10-05'));
  vigia.parar();
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
    api.hoyNutricional('t', diaTipo).then((r) => (r.ok && inicio.pideElUltimoRegistro(r.datos.data) ? inicio.leerUltimoRegistro(api, 't') : null)),
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
  misEjecucionesDeEntrenamiento: (_token, p) => ok({ data: { period: { start: p.periodStart, end: p.periodEnd, timeZone: 'America/Argentina/Buenos_Aires' }, executions: [] } }),
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
    ['`entrenamiento-hoy:${dia}`', "'entrenamiento-en-curso'", '`hoy-nutricional:${dia}:${diaTipo ?? \'\'}`', "'inicio-ultimo-registro'", '`inicio-actividad:${periodo.periodStart}:${periodo.periodEnd}`', "'inicio-pendientes'", "'mi-evolucion:ultimos-90'"].sort(),
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
  // La sesión en curso (API-TIE-04) también es la misma lectura en Inicio y en Entrenamiento.
  assert.match(ENTRENAMIENTO, /useLecturaRecordada\(token, 'entrenamiento-en-curso', pedirEnCurso, sesionPerdida\)/);
  // «Hoy» de Nutrición es la misma lectura en Inicio y en Nutrición: la misma clave, con el mismo día y el mismo día del plan.
  assert.ok(NUTRICION.includes("useLecturaRecordada(token, `hoy-nutricional:${hoyDeLaApi}:${diaTipo ?? ''}`"));
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

test('con letra grande, el título de una tarjeta no parte una palabra y dos acciones no parten su texto', () => {
  const TARJETA = fuente('tarjeta-de-inicio.tsx');
  // Render del navegador con letra ×2 en 360 dp: el título partía «Entrenamient / o». Crece hasta 1,5 y el ícono va arriba.
  assert.match(TARJETA, /accessibilityRole="header" maxFontSizeMultiplier=\{1\.5\}/);
  assert.match(TARJETA, /fontScale >= ESCALA_PARA_APILAR && estilos\.cabezaApilada/);
  // Cada acción pide un ancho que crece con la letra: con letra grande baja a su línea entera.
  assert.match(TARJETA, /flexBasis: 140 \* Math\.min\(Math\.max\(fontScale, 1\), 2\.2\)/);
});

test('revisión de la candidata: las respuestas tardías al abrir un borrador', () => {
  // La familia de la figura y «Ver la toma» se prueban por comportamiento: composicion-de-la-figura.test.mjs y
  // selector-de-tomas.test.mjs. Una respuesta que llega después de irse de la pantalla no navega: se descarta antes de
  // tocar nada.
  const ENTRENAMIENTO = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), 'utf8');
  const respuesta = ENTRENAMIENTO.indexOf('const r = await api.abrirBorradorDeEjecucion(token, o.occurrenceId);');
  const descarte = ENTRENAMIENTO.indexOf('if (!montada.current) return;', respuesta);
  const primerUso = ENTRENAMIENTO.indexOf('setAbriendo(false);', respuesta);
  assert.ok(respuesta > 0 && descarte > respuesta && descarte < primerUso, 'el descarte va antes de usar la respuesta');
});

test('el saludo es neutro y no hay marcas de progreso', () => {
  const codigo = PANTALLA.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.match(codigo, /<Titulo>Hola<\/Titulo>/);
  assert.doesNotMatch(codigo, /displayName\}?\s*\}?<\/Titulo>|profile|iniciales/i, 'sin nombre ni iniciales en el saludo (D-2)');
  assert.doesNotMatch(codigo, /`[^`]*\$\{[^}]+\}\s*\/\s*\$\{[^}]+\}[^`]*`/, 'sin «2/4»');
  assert.doesNotMatch(codigo, /%/, 'ni en el texto ni en los estilos: la prueba de textos no distingue los anchos');
});
