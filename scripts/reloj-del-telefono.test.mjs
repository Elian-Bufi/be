/**
 * El reloj de la sesión en el teléfono (precierre del 2026-10-06, §3): `apps/mobile/src/reloj-de-sesion.ts`
 * (`crearRelojDelTelefono`, `anclaDelArranque`), con un módulo nativo de mentira que imita `SystemClock.elapsedRealtimeNanos()`
 * y `Settings.Global.BOOT_COUNT`.
 *
 *  1. Con el módulo nativo, la base es el tiempo desde el arranque y el ancla nombra el arranque: dos procesos del mismo
 *     arranque comparten el ancla, y otro arranque tiene otra. El número de arranque no sale del teléfono.
 *  2. Si el sistema no da el número de arranque, o leer o guardar el ancla falla, el ancla es de ese proceso: lo que
 *     cruza un cierre queda estimado, nunca mal medido.
 *  3. Sin el módulo nativo, el reloj es el del proceso, y lo dice su base.
 *  4. Con el dominio: la hora del teléfono cambiada, la app reabierta en el mismo arranque y el teléfono reiniciado.
 *
 * **Lo que esto no prueba:** el reloj real de Android, el reposo profundo, el descarte de la actividad, el cierre desde
 * recientes, la muerte del proceso ni el reinicio del teléfono. Son los casos nativos pendientes de la evidencia.
 * Uso: node --test scripts/reloj-del-telefono.test.mjs (después de construir @be/domain).
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
const { calcularTiempos, IdDeClienteSchema, InstanteDeEventoApiSchema } = await import('@be/domain');

/** El módulo nativo de mentira: el reloj desde el arranque y el número de arranque, a pedido de la prueba. */
function sistemaDePrueba({ arranque = 137, ms = 3_600_000 } = {}) {
  const s = { arranque, ms, fallarNumero: false };
  return {
    estado: s,
    msDesdeElArranque: () => s.ms,
    numeroDeArranque: () => {
      if (s.fallarNumero) throw new Error('sin permiso');
      return s.arranque;
    },
  };
}

function almacenDePrueba() {
  const datos = new Map();
  const a = {
    datos,
    fallarLectura: false,
    fallarEscritura: false,
    async leer(k) {
      if (a.fallarLectura) throw new Error('no responde');
      return datos.get(k) ?? null;
    },
    async guardar(k, v) {
      if (a.fallarEscritura) throw new Error('no escribe');
      datos.set(k, v);
    },
  };
  return a;
}

let n = 0;
const nuevoId = (prefijo) => `${prefijo}-${String(++n).padStart(8, '0')}`;
const CIVIL = Date.parse('2026-10-06T16:00:00.000Z');

test('1 · con el módulo nativo, la base es desde el arranque y el ancla nombra el arranque; el número de arranque no sale del teléfono', async () => {
  const sistema = sistemaDePrueba({ arranque: 137 });
  const almacen = almacenDePrueba();
  const r = reloj.crearRelojDelTelefono({ sistema, almacen, nuevoId, proceso: 'proceso-uno', civil: () => CIVIL });
  assert.equal(r.base, 'ELAPSED_SINCE_BOOT');
  await r.listo();
  const instante = r.ahora();
  assert.equal(InstanteDeEventoApiSchema.safeParse(instante).success, true);
  assert.deepEqual(instante.monotonic, { anchor: r.ancla, ms: 3_600_000, clock: 'ELAPSED_SINCE_BOOT' });
  assert.match(r.ancla, /^arranque-/);
  assert.equal(IdDeClienteSchema.safeParse(r.ancla).success, true);
  assert.doesNotMatch(r.ancla, /137/, 'el ancla no lleva el número de arranque');
  assert.ok([...almacen.datos.values()][0].includes('137'), 'el número queda solo en el teléfono, junto al ancla');

  // Otro proceso del mismo arranque (la app se cerró y se volvió a abrir): la misma ancla.
  const otro = reloj.crearRelojDelTelefono({ sistema, almacen, nuevoId, proceso: 'proceso-dos', civil: () => CIVIL });
  await otro.listo();
  assert.equal(otro.ancla, r.ancla);

  // Después de reiniciar el teléfono: otro arranque, otra ancla.
  sistema.estado.arranque = 138;
  const despues = reloj.crearRelojDelTelefono({ sistema, almacen, nuevoId, proceso: 'proceso-tres', civil: () => CIVIL });
  await despues.listo();
  assert.notEqual(despues.ancla, r.ancla);
});

test('2 · sin número de arranque, o si falla leer o guardar el ancla, el ancla es de ese proceso o nueva: nunca una equivocada', async () => {
  const sistema = sistemaDePrueba();
  sistema.estado.fallarNumero = true;
  const almacen = almacenDePrueba();
  const sinNumero = reloj.crearRelojDelTelefono({ sistema, almacen, nuevoId, proceso: 'proceso-uno' });
  await sinNumero.listo();
  assert.equal(sinNumero.ancla, 'arranque-proceso-uno');
  assert.equal(almacen.datos.size, 0);

  sistema.estado.fallarNumero = false;
  const ilegible = almacenDePrueba();
  ilegible.datos.set(reloj.CLAVE_DEL_ANCLA_DEL_ARRANQUE, '{no es JSON');
  const conIlegible = reloj.crearRelojDelTelefono({ sistema, almacen: ilegible, nuevoId, proceso: 'proceso-dos' });
  await conIlegible.listo();
  assert.match(conIlegible.ancla, /^arranque-\d{8}$/, 'lo ilegible se reemplaza por un ancla nueva');

  const caido = almacenDePrueba();
  caido.fallarLectura = true;
  caido.fallarEscritura = true;
  const conCaido = reloj.crearRelojDelTelefono({ sistema, almacen: caido, nuevoId, proceso: 'proceso-tres' });
  await conCaido.listo();
  const otroConCaido = reloj.crearRelojDelTelefono({ sistema, almacen: caido, nuevoId, proceso: 'proceso-cuatro' });
  await otroConCaido.listo();
  assert.notEqual(conCaido.ancla, otroConCaido.ancla, 'sin poder guardarla, cada proceso tiene la suya: lo que cruza queda estimado');
});

test('3 · sin el módulo nativo, el reloj es el del proceso, y lo dice su base', () => {
  const r = reloj.crearRelojDelTelefono({ sistema: null, almacen: almacenDePrueba(), nuevoId, proceso: 'proceso-uno' });
  assert.equal(r.base, 'PROCESS_MONOTONIC');
  assert.equal(r.ancla, 'proceso-uno');
  assert.equal(r.ahora().monotonic.clock, 'PROCESS_MONOTONIC');
  assert.equal(reloj.relojDelProceso.base, 'PROCESS_MONOTONIC');
  assert.equal(reloj.relojDelProceso.ancla, reloj.ANCLA_DEL_PROCESO);
});

/** Arma una corrida con un reloj: iniciar, un descanso y finalizar, con lo que pase entre cada paso. */
function corridaCon(pasos) {
  let c = corrida.CORRIDA_VACIA;
  for (const { reloj: r, accion } of pasos) {
    const resultado = corrida.armarAccion(c, accion, { prescripciones: new Set(['pA']), otraSesionEnCurso: false }, { reloj: r, nuevoId });
    assert.equal(resultado.ok, true, JSON.stringify(accion));
    c = resultado.corrida;
  }
  return calcularTiempos(corrida.eventosDeLaCorrida(c), () => 90);
}

test('4 · con el dominio: la hora cambiada no altera la duración, la app reabierta en el mismo arranque sigue medida y el teléfono reiniciado no', async () => {
  const sistema = sistemaDePrueba({ arranque: 200, ms: 7_200_000 });
  const almacen = almacenDePrueba();
  const civil = { ms: CIVIL };
  const uno = reloj.crearRelojDelTelefono({ sistema, almacen, nuevoId, proceso: 'proceso-uno', civil: () => civil.ms });
  await uno.listo();

  // La hora del teléfono se adelanta una hora durante el descanso: el descanso sigue medido, con el monotónico.
  const conHora = [{ reloj: uno, accion: { tipo: 'iniciar', prescriptionId: 'pA' } }];
  const t1 = corridaCon([
    ...conHora,
    { reloj: { ...uno, ahora: () => ({ ...uno.ahora(), monotonic: { ...uno.ahora().monotonic, ms: sistema.estado.ms + 10_000 } }) }, accion: { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 } },
    {
      reloj: { ...uno, ahora: () => ({ civil: new Date(civil.ms + 3_600_000 + 100_000).toISOString(), monotonic: { anchor: uno.ancla, ms: sistema.estado.ms + 100_000, clock: 'ELAPSED_SINCE_BOOT' }, source: 'MONOTONIC' }) },
      accion: { tipo: 'finalizar-descanso' },
    },
  ]);
  assert.deepEqual(t1.rests[0].duration, { ms: 90_000, quality: 'MEASURED' });

  // La app se cerró y se reabrió en el mismo arranque: el proceso nuevo tiene la misma ancla y la sesión sigue medida.
  const dos = reloj.crearRelojDelTelefono({ sistema, almacen, nuevoId, proceso: 'proceso-dos', civil: () => civil.ms });
  await dos.listo();
  const inicio = uno.ahora();
  sistema.estado.ms += 900_000;
  civil.ms += 900_000;
  const fin = dos.ahora();
  assert.equal(fin.monotonic.anchor, inicio.monotonic.anchor);
  const sesion = calcularTiempos(
    [
      { eventId: 'evento-0001', runId: 'corrida-0001', sequence: 1, compoundActionId: null, type: 'SESSION_STARTED', at: inicio },
      { eventId: 'evento-0002', runId: 'corrida-0001', sequence: 2, compoundActionId: null, type: 'SESSION_FINISHED', resolution: 'FINISHED', at: fin },
    ],
    () => null,
  );
  assert.deepEqual(sesion.session.elapsed, { ms: 900_000, quality: 'MEASURED' });

  // El teléfono se reinició: otro arranque, otra ancla, y el reloj volvió a empezar. Lo que cruza queda estimado.
  sistema.estado.arranque = 201;
  sistema.estado.ms = 20_000;
  civil.ms += 300_000;
  const tres = reloj.crearRelojDelTelefono({ sistema, almacen, nuevoId, proceso: 'proceso-tres', civil: () => civil.ms });
  await tres.listo();
  const tras = tres.ahora();
  assert.notEqual(tras.monotonic.anchor, inicio.monotonic.anchor);
  const cruzado = calcularTiempos(
    [
      { eventId: 'evento-0001', runId: 'corrida-0001', sequence: 1, compoundActionId: null, type: 'SESSION_STARTED', at: inicio },
      { eventId: 'evento-0002', runId: 'corrida-0001', sequence: 2, compoundActionId: null, type: 'SESSION_FINISHED', resolution: 'FINISHED', at: tras },
    ],
    () => null,
  );
  assert.deepEqual(cruzado.session.elapsed, { ms: 1_200_000, quality: 'ESTIMATED' });
});
