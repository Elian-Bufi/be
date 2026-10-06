/**
 * Los tiempos de la sesión en la APK (WP-ENTRENAMIENTO-SERIES §5, §7.4 y §7.5; ACEPTACION T01 a T08 del lado del
 * teléfono, R03): `apps/mobile/src/reloj-de-sesion.ts`, `corrida-de-entrenamiento.ts` y `almacen-de-entrenamiento.ts`.
 *
 * Con un reloj inyectado y sin esperas reales:
 *  1. el reloj lleva el ancla del proceso, y lo que se muestra mientras corre sale de `enVivo`, no de sumar ticks;
 *  2. cada acción arma sus eventos con identificador, corrida, secuencia correlativa y acción compuesta, y se valida con
 *     `aplicarEventos` antes de encolarse: lo que el dominio rechaza no se encola;
 *  3. los eventos viajan en lotes de hasta 30, en orden; RECORDED y DUPLICATE salen de pendientes, CONFLICT y REJECTED
 *     quedan y se muestran;
 *  4. lo guardado está aislado por cuenta: otra cuenta no lo ve ni lo sincroniza, y una respuesta tardía de la cuenta
 *     anterior no se aplica;
 *  5. si el proceso murió con una medición abierta, se pregunta y nunca se cierra sola: «Terminó ahora» es un instante
 *     declarado (estimado) y «Dejarla incompleta» deja la medición incompleta.
 *
 * **Lo que esto no prueba:** la pantalla bloqueada, el segundo plano y la muerte real del proceso en Android, ni que
 * AsyncStorage conserve lo escrito. Eso se comprueba en el teléfono.
 * Uso: node --test scripts/tiempos-en-el-telefono.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const reloj = await import('../apps/mobile/src/reloj-de-sesion.ts');
const corrida = await import('../apps/mobile/src/corrida-de-entrenamiento.ts');
const almacenes = await import('../apps/mobile/src/almacen-de-entrenamiento.ts');
const { aplicarEventos, calcularTiempos, IdDeClienteSchema, EventoDeTiempoSchema, SesionConObjetivosSchema } = await import('@be/domain');

const INICIO_CIVIL = Date.parse('2026-10-06T16:00:00.000Z');

/** Un reloj de mentira: el monotónico y el civil avanzan cuando la prueba lo dice. */
function relojDePrueba(ancla = 'proceso-uno') {
  const r = { mono: 5_000, civil: INICIO_CIVIL };
  return {
    estado: r,
    reloj: reloj.crearReloj({ ancla, monotonico: () => r.mono, civil: () => r.civil }),
    /** Pasa el tiempo; si el teléfono durmió, el civil avanza y el monotónico no. */
    avanzar(segundos, { durmio = false } = {}) {
      if (!durmio) r.mono += segundos * 1000;
      r.civil += segundos * 1000;
    },
  };
}

function idsCorrelativos() {
  let n = 0;
  return (prefijo) => `${prefijo}-${String(++n).padStart(6, '0')}`;
}

const CONTEXTO = { prescripciones: new Set(['pA', 'pB', 'pC']), otraSesionEnCurso: false };

/** Aplica una acción y devuelve la corrida nueva; falla la prueba si el dominio la rechaza. */
function hacer(c, accion, h) {
  const r = corrida.armarAccion(c, accion, CONTEXTO, h);
  assert.equal(r.ok, true, `rechazada: ${JSON.stringify(accion)} → ${r.motivo}`);
  return r.corrida;
}

// ─── 1. El reloj ────────────────────────────────────────────────────────────────────────────────

test('1 · el reloj del proceso tiene un ancla aleatoria y los instantes llevan el monotónico con esa ancla', () => {
  assert.equal(IdDeClienteSchema.safeParse(reloj.ANCLA_DEL_PROCESO).success, true);
  assert.notEqual(reloj.idAleatorio('proceso'), reloj.idAleatorio('proceso'));
  const { reloj: r } = relojDePrueba('proceso-uno');
  assert.deepEqual(r.ahora(), { civil: '2026-10-06T16:00:00.000Z', monotonic: { anchor: 'proceso-uno', ms: 5000 }, source: 'MONOTONIC' });
  assert.deepEqual(r.declarado(), { civil: '2026-10-06T16:00:00.000Z', monotonic: null, source: 'DECLARED' });
});

test('1 · lo que se muestra sale de enVivo: con la pantalla bloqueada no se pierde ni se inventa precisión', () => {
  const t = relojDePrueba();
  const h = { reloj: t.reloj, nuevoId: idsCorrelativos() };
  let c = hacer(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, h);
  t.avanzar(65);
  c = hacer(c, { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 }, h);
  t.avanzar(60);
  const vivo = corrida.enVivoDeLaCorrida(c, t.reloj);
  assert.deepEqual(vivo.sesionSinPausas, { ms: 125_000, quality: 'MEASURED' });
  assert.deepEqual(vivo.medicionAbierta, { ms: 60_000, quality: 'MEASURED' });
  // El teléfono durmió 10 minutos: el monotónico no avanzó. Se muestra el civil, como estimado: no se reinicia ni se pierde.
  t.avanzar(600, { durmio: true });
  const despues = corrida.enVivoDeLaCorrida(c, t.reloj);
  assert.deepEqual(despues.medicionAbierta, { ms: 660_000, quality: 'ESTIMATED' });
  assert.equal(despues.sesionSinPausas.quality, 'ESTIMATED');
});

// ─── 2. Los eventos de cada acción ──────────────────────────────────────────────────────────────

test('2 · «Iniciar entrenamiento» es una acción compuesta: inicio y ejercicio activo, con el mismo instante', () => {
  const t = relojDePrueba();
  const c = hacer(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, { reloj: t.reloj, nuevoId: idsCorrelativos() });
  const [inicio, activo] = c.pendientes;
  assert.deepEqual([inicio.type, inicio.sequence, activo.type, activo.sequence], ['SESSION_STARTED', 1, 'EXERCISE_ACTIVATED', 2]);
  assert.equal(inicio.runId, activo.runId);
  assert.ok(inicio.compoundActionId && inicio.compoundActionId === activo.compoundActionId);
  assert.deepEqual(inicio.at, activo.at);
  for (const e of c.pendientes) {
    assert.equal(EventoDeTiempoSchema.safeParse(e).success, true);
    assert.equal(IdDeClienteSchema.safeParse(e.eventId).success, true);
  }
  assert.equal(new Set(c.pendientes.map((e) => e.eventId)).size, 2, 'cada evento tiene su identificador');
});

test('2 · con un descanso en curso, «Cronometrar serie» es «finalizar descanso e iniciar la serie», auditada; pausar cierra lo abierto', () => {
  const t = relojDePrueba();
  const h = { reloj: t.reloj, nuevoId: idsCorrelativos() };
  let c = hacer(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, h);
  t.avanzar(65);
  c = hacer(c, { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 }, h);
  assert.equal(c.pendientes[2].compoundActionId, null, 'una acción simple no lleva identificador de acción');
  t.avanzar(90);
  c = hacer(c, { tipo: 'cronometrar-serie', prescriptionId: 'pA', setIndex: 2 }, h);
  const [fin, serie] = c.pendientes.slice(3);
  assert.deepEqual([fin.type, serie.type, serie.setIndex], ['REST_FINISHED', 'SET_TIMING_STARTED', 2]);
  assert.ok(fin.compoundActionId && fin.compoundActionId === serie.compoundActionId);
  t.avanzar(40);
  c = hacer(c, { tipo: 'pausar' }, h);
  const [cierre, pausa] = c.pendientes.slice(5);
  assert.deepEqual([cierre.type, pausa.type], ['SET_TIMING_FINISHED', 'SESSION_PAUSED']);
  assert.ok(cierre.compoundActionId && cierre.compoundActionId === pausa.compoundActionId);
  // La secuencia es correlativa, sin huecos, y la API registraría todo tal cual.
  assert.deepEqual(c.pendientes.map((e) => e.sequence), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(aplicarEventos([], c.pendientes, CONTEXTO).resultados.every((r) => r.status === 'RECORDED'));
  const tiempos = calcularTiempos(c.pendientes, () => 90);
  assert.deepEqual(tiempos.rests.map((r) => [r.setIndex, r.duration.ms / 1000, r.duration.quality]), [[1, 90, 'MEASURED']]);
  assert.deepEqual(tiempos.timedSets.map((s) => [s.setIndex, s.duration.ms / 1000]), [[2, 40]]);
});

test('2 · lo que el dominio rechaza no se encola: un descanso en pausa, dos mediciones, finalizar con algo abierto', () => {
  const t = relojDePrueba();
  const h = { reloj: t.reloj, nuevoId: idsCorrelativos() };
  let c = hacer(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, h);
  c = hacer(c, { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 }, h);
  const intento = (accion) => corrida.armarAccion(c, accion, CONTEXTO, h);
  assert.deepEqual(intento({ tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 2 }), { ok: false, motivo: 'MEASUREMENT_OPEN' });
  assert.deepEqual(intento({ tipo: 'finalizar' }), { ok: false, motivo: 'MEASUREMENT_OPEN' });
  assert.deepEqual(intento({ tipo: 'finalizar-serie' }), { ok: false, motivo: 'MEASUREMENT_NOT_OPEN' });
  assert.deepEqual(intento({ tipo: 'iniciar', prescriptionId: 'pA' }), { ok: false, motivo: 'SESSION_ALREADY_STARTED' });
  assert.deepEqual(intento({ tipo: 'activar-ejercicio', prescriptionId: 'pZ' }), { ok: false, motivo: 'PRESCRIPTION_NOT_IN_SESSION' });
  // Cambiar de ejercicio durante el descanso es legítimo, y el descanso sigue ligado a su serie.
  const otro = hacer(c, { tipo: 'activar-ejercicio', prescriptionId: 'pB' }, h);
  assert.deepEqual(corrida.estadoLocal(otro).medicionAbierta.prescriptionId, 'pA');
  c = hacer(c, { tipo: 'pausar' }, h);
  assert.deepEqual(corrida.armarAccion(c, { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 2 }, CONTEXTO, h), { ok: false, motivo: 'SESSION_PAUSED' });
  assert.equal(c.pendientes.length, 5, 'los intentos rechazados no dejaron nada');
  // Otra sesión en curso: no se empieza una segunda.
  assert.deepEqual(corrida.armarAccion(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, { ...CONTEXTO, otraSesionEnCurso: true }, h), { ok: false, motivo: 'ANOTHER_SESSION_IN_PROGRESS' });
});

// ─── 3. Lotes y resultados ──────────────────────────────────────────────────────────────────────

test('3 · los eventos viajan en lotes de hasta 30, en orden de secuencia', () => {
  const t = relojDePrueba();
  const h = { reloj: t.reloj, nuevoId: idsCorrelativos() };
  let c = hacer(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, h);
  for (let i = 0; i < 31; i++) {
    t.avanzar(10);
    c = hacer(c, { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 }, h);
    t.avanzar(10);
    c = hacer(c, { tipo: 'finalizar-descanso' }, h);
  }
  assert.equal(c.pendientes.length, 64);
  const lotes = corrida.lotesDeEventos([...c.pendientes].reverse());
  assert.deepEqual(lotes.map((l) => l.length), [30, 30, 4]);
  assert.deepEqual(lotes.flat().map((e) => e.sequence), Array.from({ length: 64 }, (_, i) => i + 1));
  assert.deepEqual(corrida.loteSiguiente({ registrados: [], pendientes: [...c.pendientes].reverse() }).map((e) => e.sequence), Array.from({ length: 30 }, (_, i) => i + 1));
});

test('3 · RECORDED y DUPLICATE salen de pendientes; el primer CONFLICT o REJECTED queda, con los que dependen de él', () => {
  const t = relojDePrueba();
  const h = { reloj: t.reloj, nuevoId: idsCorrelativos() };
  let c = hacer(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, h);
  c = hacer(c, { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 }, h);
  c = hacer(c, { tipo: 'finalizar-descanso' }, h);
  const [a, b, x, y] = c.pendientes;
  const resultados = [
    { eventId: a.eventId, status: 'RECORDED', reason: null },
    { eventId: b.eventId, status: 'DUPLICATE', reason: null },
    { eventId: x.eventId, status: 'CONFLICT', reason: 'SEQUENCE_REUSED' },
    { eventId: y.eventId, status: 'REJECTED', reason: 'PREVIOUS_EVENT_NOT_RECORDED' },
  ];
  const { corrida: nueva, rechazo } = corrida.aplicarResultadosDelLote(c, c.pendientes, resultados);
  assert.deepEqual(rechazo, resultados[2]);
  assert.deepEqual(nueva.pendientes.map((e) => e.eventId), [x.eventId, y.eventId], 'no se descartan en silencio');
  assert.deepEqual(nueva.registrados.map((e) => e.eventId), [a.eventId, b.eventId]);
});

// ─── 4. La sincronización y el aislamiento por cuenta ──────────────────────────────────────────

function almacenEnMemoria() {
  const datos = new Map();
  return { datos, leer: async (k) => datos.get(k) ?? null, guardar: async (k, v) => void datos.set(k, v), borrar: async (k) => void datos.delete(k) };
}

const SESION = SesionConObjetivosSchema.parse({
  sessionId: 's1',
  label: 'Piernas A',
  order: 1,
  instructions: null,
  prescriptions: ['pA', 'pB', 'pC'].map((id, i) => ({
    prescriptionId: id,
    order: i + 1,
    exerciseId: `ej-${id}`,
    exerciseVersionId: `ev-${id}`,
    exerciseName: `Ejercicio ${id}`,
    image: null,
    sets: [{ setIndex: 1, note: null, target: { repetitions: { min: 10, max: 12 }, rir: null, suggestedLoad: null, restSeconds: 90 }, targetOrigin: { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'SET' } }],
    intensity: null,
    suggestedLoad: null,
    restSeconds: 90,
    loadBasis: null,
    repetitionBasis: null,
    professionalParameters: [],
    note: null,
  })),
});

/** Una API que registra los eventos con la misma regla del dominio, como API-TIE-01. */
function apiDeTiempos() {
  const delServidor = [];
  const pedidos = [];
  return {
    delServidor,
    pedidos,
    consultarBorradorDeEjecucion: async () => assert.fail('no se usa'),
    guardarBorradorDeEjecucion: async () => assert.fail('no se usa'),
    tiemposDelBorrador: async () => ({ ok: true, datos: { data: { events: delServidor.map((event) => ({ event, receivedAt: '2026-10-06T16:30:00.000Z' })) } } }),
    async registrarEventosDeTiempo(_token, _draftId, { events }) {
      pedidos.push(events.length);
      const { resultados, aRegistrar } = aplicarEventos(delServidor, events, CONTEXTO);
      delServidor.push(...aRegistrar);
      return { ok: true, datos: { data: { results: resultados, timing: { events: delServidor.map((event) => ({ event, receivedAt: '2026-10-06T16:30:00.000Z' })) } } } };
    },
  };
}

function nuevoAlmacen({ almacen = almacenEnMemoria(), api = apiDeTiempos(), t = relojDePrueba() } = {}) {
  return { almacen, api, t, a: almacenes.crearAlmacenDeEntrenamiento({ almacen, api, reloj: t.reloj, nuevoId: idsCorrelativos() }) };
}

const PREPARAR = { draftId: 'borrador-1', occurrenceId: 'occ_1', fecha: '2026-10-06', modo: 'en-vivo', etiqueta: 'Piernas A', sesion: SESION };

test('4 · la sincronización manda los eventos en lotes de hasta 30 y queda «sincronizado»', async () => {
  const { a, api, t } = nuevoAlmacen();
  await a.abrirCuenta('cuenta-a', 'token-a');
  a.preparar(PREPARAR);
  assert.equal(a.accion('borrador-1', { tipo: 'iniciar', prescriptionId: 'pA' }).ok, true);
  for (let i = 0; i < 20; i++) {
    t.avanzar(10);
    a.accion('borrador-1', { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 });
    t.avanzar(30);
    a.accion('borrador-1', { tipo: 'finalizar-descanso' });
  }
  assert.equal(almacenes.estadoDeSincronizacion(a.sesion('borrador-1'), false), 'pendiente');
  assert.equal(await a.sincronizar('borrador-1'), null);
  assert.deepEqual(api.pedidos, [30, 12]);
  assert.equal(a.sesion('borrador-1').corrida.pendientes.length, 0);
  assert.equal(almacenes.estadoDeSincronizacion(a.sesion('borrador-1'), false), 'sincronizado');
});

test('4 · sin red queda en el teléfono con «error recuperable»; un conflicto se muestra y no se reintenta solo', async () => {
  const api = apiDeTiempos();
  const registrar = api.registrarEventosDeTiempo;
  api.registrarEventosDeTiempo = async () => ({ ok: false, tipo: 'RED' });
  const { a } = nuevoAlmacen({ api });
  await a.abrirCuenta('cuenta-a', 'token-a');
  a.preparar(PREPARAR);
  a.accion('borrador-1', { tipo: 'iniciar', prescriptionId: 'pA' });
  assert.deepEqual(await a.sincronizar('borrador-1'), { ok: false, tipo: 'RED' });
  assert.equal(almacenes.estadoDeSincronizacion(a.sesion('borrador-1'), false), 'error');
  assert.equal(a.sesion('borrador-1').corrida.pendientes.length, 2, 'nada se pierde');
  // Otro dispositivo empezó la corrida de este borrador: la API rechaza el inicio. Es un conflicto, no se pisa.
  api.registrarEventosDeTiempo = registrar;
  api.delServidor.push({ eventId: 'evento-otro-001', runId: 'corrida-otro-dispositivo', sequence: 1, compoundActionId: null, type: 'SESSION_STARTED', at: { civil: '2026-10-06T15:59:00.000Z', monotonic: { anchor: 'proceso-otro', ms: 1 }, source: 'MONOTONIC' } });
  await a.reintentar('borrador-1');
  const s = a.sesion('borrador-1');
  assert.equal(almacenes.estadoDeSincronizacion(s, false), 'conflicto');
  assert.deepEqual(s.problema, { tipo: 'conflicto', de: 'tiempos', motivo: 'SESSION_ALREADY_STARTED' });
  assert.equal(s.corrida.pendientes.length, 2);
  const pedidosAntes = api.pedidos.length;
  await a.sincronizar('borrador-1');
  assert.equal(api.pedidos.length, pedidosAntes, 'con el conflicto sin resolver, no se manda nada más');
  // La persona elige quedarse con lo del servidor: se descartan los pendientes del teléfono.
  await a.usarLosTiemposDelServidor('borrador-1');
  assert.deepEqual(a.sesion('borrador-1').corrida, { registrados: api.delServidor, pendientes: [] });
  assert.equal(almacenes.estadoDeSincronizacion(a.sesion('borrador-1'), false), 'sincronizado');
});

test('4 · aislamiento por cuenta: otra cuenta no ve ni sincroniza lo guardado, y una respuesta tardía no se aplica', async () => {
  const almacen = almacenEnMemoria();
  const api = apiDeTiempos();
  let liberar;
  const registrar = api.registrarEventosDeTiempo;
  api.registrarEventosDeTiempo = (...args) => new Promise((r) => (liberar = () => r(registrar(...args))));
  const { a } = nuevoAlmacen({ almacen, api });
  await a.abrirCuenta('cuenta-a', 'token-a');
  a.preparar(PREPARAR);
  a.accion('borrador-1', { tipo: 'iniciar', prescriptionId: 'pA' });
  await a.escrituras();
  assert.ok(almacen.datos.has(almacenes.claveDeLaCuenta('cuenta-a')));
  const enviando = a.sincronizar('borrador-1');
  // La persona cierra la sesión y entra otra cuenta mientras viaja el pedido.
  await a.abrirCuenta('cuenta-b', 'token-b');
  assert.equal(a.sesion('borrador-1'), null, 'la otra cuenta no ve el entrenamiento');
  assert.deepEqual(a.sesiones(), []);
  liberar();
  await enviando;
  assert.equal(a.sesion('borrador-1'), null, 'la respuesta tardía no se aplica a la otra cuenta');
  assert.equal(await a.sincronizar('borrador-1'), null);
  await a.escrituras();
  assert.equal(almacen.datos.has(almacenes.claveDeLaCuenta('cuenta-b')), false, 'no se escribió nada en la clave de la otra cuenta');
  // Aunque alguien copie lo de una cuenta en la clave de otra, no se lee: la identidad va adentro.
  assert.equal(almacenes.leerCuenta(almacen.datos.get(almacenes.claveDeLaCuenta('cuenta-a')), 'cuenta-b'), null);
  // Al volver la cuenta original, su entrenamiento sigue ahí, con los dos eventos pendientes.
  await a.abrirCuenta('cuenta-a', 'token-a-2');
  assert.equal(a.sesion('borrador-1').corrida.pendientes.length, 2);
});

// ─── 5. La muerte del proceso ───────────────────────────────────────────────────────────────────

test('5 · si el proceso murió con un descanso abierto, se pregunta y nunca se cierra solo; «Terminó ahora» es estimado', async () => {
  const almacen = almacenEnMemoria();
  const uno = relojDePrueba('proceso-uno');
  const primero = nuevoAlmacen({ almacen, t: uno });
  await primero.a.abrirCuenta('cuenta-a', 'token-a');
  primero.a.preparar(PREPARAR);
  primero.a.accion('borrador-1', { tipo: 'iniciar', prescriptionId: 'pA' });
  uno.avanzar(60);
  primero.a.accion('borrador-1', { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 });
  await primero.a.escrituras();

  // El sistema cerró la app. Un proceso nuevo, con otra ancla, lee lo guardado diez minutos después.
  const dos = relojDePrueba('proceso-dos');
  dos.estado.civil = uno.estado.civil + 600_000;
  const segundo = nuevoAlmacen({ almacen, t: dos });
  await segundo.a.abrirCuenta('cuenta-a', 'token-a');
  const s = segundo.a.sesion('borrador-1');
  const abierta = corrida.medicionDeOtroProceso(s.corrida, 'proceso-dos');
  assert.deepEqual([abierta.kind, abierta.prescriptionId, abierta.setIndex], ['REST', 'pA', 1]);
  assert.equal(corrida.medicionDeOtroProceso(s.corrida, 'proceso-uno'), null, 'en el mismo proceso no se pregunta');
  assert.equal(corrida.estadoLocal(s.corrida).cierre, null, 'la sesión no se cerró sola');
  assert.equal(corrida.estadoLocal(s.corrida).medicionAbierta.measurementId, abierta.measurementId, 'el descanso tampoco');

  // «Terminó ahora»: un instante declarado. El descanso queda estimado, no medido.
  assert.equal(segundo.a.accion('borrador-1', { tipo: 'resolver-medicion', resolucion: 'termino-ahora' }).ok, true);
  const despues = segundo.a.sesion('borrador-1').corrida;
  const fin = despues.pendientes[despues.pendientes.length - 1];
  assert.deepEqual([fin.type, fin.at.source, fin.at.monotonic], ['REST_FINISHED', 'DECLARED', null]);
  const tiempos = calcularTiempos(corrida.eventosDeLaCorrida(despues), () => 90);
  assert.deepEqual([tiempos.rests[0].duration.ms / 1000, tiempos.rests[0].duration.quality], [600, 'ESTIMATED']);
  assert.equal(corrida.medicionDeOtroProceso(despues, 'proceso-dos'), null);
});

test('5 · «Dejarla incompleta» deja la medición incompleta; dejar la sesión incompleta no afirma cuándo terminó', async () => {
  const uno = relojDePrueba('proceso-uno');
  const h = { reloj: uno.reloj, nuevoId: idsCorrelativos() };
  let c = hacer(corrida.CORRIDA_VACIA, { tipo: 'iniciar', prescriptionId: 'pA' }, h);
  c = hacer(c, { tipo: 'cronometrar-serie', prescriptionId: 'pA', setIndex: 1 }, h);
  const dos = relojDePrueba('proceso-dos');
  dos.estado.civil += 3_600_000;
  const h2 = { reloj: dos.reloj, nuevoId: idsCorrelativos() };
  c = hacer(c, { tipo: 'resolver-medicion', resolucion: 'incompleta' }, { ...h2, nuevoId: (p) => `${p}-dos-${Math.random().toString(36).slice(2, 10)}` });
  let tiempos = calcularTiempos(corrida.eventosDeLaCorrida(c), () => null);
  assert.deepEqual(tiempos.timedSets[0].duration, { ms: null, quality: 'INCOMPLETE' });
  c = hacer(c, { tipo: 'dejar-incompleta' }, { ...h2, nuevoId: (p) => `${p}-tres-${Math.random().toString(36).slice(2, 10)}` });
  tiempos = calcularTiempos(corrida.eventosDeLaCorrida(c), () => null);
  assert.equal(tiempos.state, 'LEFT_INCOMPLETE');
  assert.equal(tiempos.finishedAt, null, 'no se cierra a la hora de reabrir');
  assert.deepEqual(tiempos.session.elapsed, { ms: null, quality: 'INCOMPLETE' });
});
