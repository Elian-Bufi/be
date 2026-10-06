/**
 * El guardado del entrenamiento en curso en el teléfono (precierre del 2026-10-06, §1 y §4):
 * `apps/mobile/src/almacen-de-entrenamiento.ts`, `almacen-cifrado.ts` y `textos-del-guardado.ts`.
 *
 * Con almacenamientos inyectados que fallan a propósito, sin teléfono:
 *  1. una escritura rechazada no se esconde: el estado dice «falló al guardar», la serie dice «solo en la app» y el
 *     aviso dice que un cierre la perdería; un reintento que funciona la deja «guardada en el teléfono»;
 *  2. una lectura rechazada no es «no hay nada»: no se escribe encima de lo guardado, lo nuevo queda solo en la app, y al
 *     poder leer se suma a lo guardado, que antes se aparta tal cual;
 *  3. lo que no se puede leer (JSON inválido, una sesión ilegible, otra cuenta adentro) se aparta tal cual a una clave de
 *     recuperación antes de escribir encima; si no se puede apartar, no se escribe;
 *  4. un cambio de cuenta durante una escritura o una lectura no mezcla nada;
 *  5. un cierre antes de que termine una escritura: la pantalla nunca dijo «guardada en el teléfono», y el proceso nuevo
 *     lee lo último confirmado;
 *  6. el cifrado: AES-256-GCM (en las pruebas, el de Node), la clave en el almacenamiento seguro, los datos asociados atan
 *     el valor a su cuenta, la migración de lo guardado sin cifrar, y la clave ausente o el almacenamiento seguro caído.
 *
 * **Lo que esto no prueba:** AsyncStorage, el almacenamiento seguro ni el AES de expo-crypto en un teléfono real, ni las
 * reglas de respaldo de Android. Eso se comprueba en la próxima candidata (ver EVIDENCIA/ENTRENAMIENTO-SERIES).
 * Uso: node --test scripts/guardado-local.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
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

const almacenes = await import('../apps/mobile/src/almacen-de-entrenamiento.ts');
const cifrado = await import('../apps/mobile/src/almacen-cifrado.ts');
const textos = await import('../apps/mobile/src/textos-del-guardado.ts');
const series = await import('../apps/mobile/src/series-de-la-sesion.ts');
const { crearReloj } = await import('../apps/mobile/src/reloj-de-sesion.ts');
const { SesionConObjetivosSchema } = await import('@be/domain');

const T = textos.TEXTOS_DEL_GUARDADO;

// ─── Lo que se inyecta ──────────────────────────────────────────────────────────────────────────

/** Un AsyncStorage en memoria que se puede hacer fallar, y frenar, a pedido. */
function almacenQueFalla(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  const a = {
    datos,
    fallarLectura: false,
    fallarEscritura: false,
    lecturas: 0,
    escrituras: [],
    /** Si está, las escrituras esperan a que se la llame. */
    frenoDeEscritura: null,
    frenoDeLectura: null,
    async leer(k) {
      a.lecturas++;
      if (a.frenoDeLectura) await a.frenoDeLectura;
      if (a.fallarLectura) throw new Error('AsyncStorage no respondió');
      return datos.get(k) ?? null;
    },
    async guardar(k, v) {
      if (a.frenoDeEscritura) await a.frenoDeEscritura;
      if (a.fallarEscritura) throw new Error('AsyncStorage no escribió');
      a.escrituras.push(k);
      datos.set(k, v);
    },
    async borrar(k) {
      datos.delete(k);
    },
  };
  return a;
}

const freno = () => {
  let soltar;
  const promesa = new Promise((r) => (soltar = r));
  return { promesa, soltar };
};

const SESION = SesionConObjetivosSchema.parse({
  sessionId: 's1',
  label: 'Piernas A',
  order: 1,
  instructions: null,
  prescriptions: [
    {
      prescriptionId: 'pA',
      order: 1,
      exerciseId: 'ej-a',
      exerciseVersionId: 'ev-a',
      exerciseName: 'Sentadilla goblet',
      image: null,
      sets: [1, 2].map((n) => ({ setIndex: n, note: null, target: { repetitions: { min: 10, max: 12 }, rir: null, suggestedLoad: null, restSeconds: 90 }, targetOrigin: { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'SET' } })),
      intensity: null,
      suggestedLoad: null,
      restSeconds: 90,
      loadBasis: null,
      repetitionBasis: null,
      professionalParameters: [],
      note: null,
    },
  ],
});

const API_QUE_NO_SE_USA = {
  consultarBorradorDeEjecucion: async () => assert.fail('no se usa'),
  guardarBorradorDeEjecucion: async () => assert.fail('no se usa'),
  registrarEventosDeTiempo: async () => assert.fail('no se usa'),
  tiemposDelBorrador: async () => assert.fail('no se usa'),
};

let contador = 0;
const nuevoId = (prefijo) => `${prefijo}-${String(++contador).padStart(6, '0')}`;
const reloj = () => crearReloj({ ancla: 'proceso-prueba', monotonico: () => 1000, civil: () => Date.parse('2026-10-06T16:00:00.000Z') });

function nuevoAlmacen(almacen) {
  return almacenes.crearAlmacenDeEntrenamiento({ almacen, api: API_QUE_NO_SE_USA, reloj: reloj(), nuevoId, esperar: async () => undefined });
}

const PREPARAR = { draftId: 'borrador-1', occurrenceId: 'occ_1', fecha: '2026-10-06', modo: 'en-vivo', etiqueta: 'Piernas A', sesion: SESION };
const serie = (setIndex, completedRepetitions = 12) => ({ prescriptionId: 'pA', performedExerciseVersionId: 'ev-a', serie: { setIndex, load: { value: 16, unit: 'kg' }, completedRepetitions, rir: 2, perceivedExertion: null } });

/** La fila de la tabla de esa serie, como la dibuja la sesión enfocada, y su texto. */
function filaDe(a, setIndex) {
  const s = a.sesion('borrador-1');
  const filas = series.filasDelEjercicio(s.sesion.prescriptions[0], [], s.series, 0, (l) => a.proteccionDeSerie('borrador-1', l));
  const f = filas.find((x) => x.setIndex === setIndex);
  return { fila: f, texto: textos.textoDeEstadoDeFila(f) };
}

const guardadoDe = (almacen, cuenta) => almacenes.leerCuenta(almacen.datos.get(almacenes.claveDeLaCuenta(cuenta)) ?? null, cuenta);
const recuperaciones = (almacen, cuenta) => [...almacen.datos.keys()].filter((k) => k.startsWith(`${almacenes.PREFIJO_DE_RECUPERACION}${cuenta}:`));

// ─── 1. La escritura rechazada ──────────────────────────────────────────────────────────────────

test('1 · una escritura rechazada no se esconde: «solo en la app», el aviso dice que un cierre la perdería, y un reintento la guarda', async () => {
  const almacen = almacenQueFalla();
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token');
  assert.equal(a.estadoDelGuardado(), 'en-el-telefono');
  almacen.fallarEscritura = true;
  a.preparar(PREPARAR);
  assert.equal(a.registrarSerie('borrador-1', serie(1)), 'registrada');
  // Mientras escribe: «guardando», nunca «guardada en el teléfono».
  assert.equal(a.estadoDelGuardado(), 'guardando');
  assert.equal(filaDe(a, 1).texto, T.fila.guardando);
  await a.escrituras();
  assert.equal(a.estadoDelGuardado(), 'fallo-al-guardar');
  assert.equal(a.proteccionDeSerie('borrador-1', a.sesion('borrador-1').series[0]), 'solo-en-la-app');
  assert.equal(filaDe(a, 1).texto, T.fila['solo-en-la-app']);
  const aviso = textos.avisoDelGuardado(a.estadoDelGuardado(), 'pendiente');
  assert.equal(aviso.titulo, 'No pudimos guardar en el teléfono');
  assert.match(aviso.textos[0], /sigue en la app.*si la cerrás, se pierde/);
  assert.equal(aviso.boton, 'Reintentar guardar');
  // Lo escrito sigue en memoria, y en el teléfono no hay nada.
  assert.equal(a.sesion('borrador-1').series.length, 1);
  assert.equal(almacen.datos.size, 0);

  // Otro cambio también falla: el estado no se limpia solo.
  a.registrarSerie('borrador-1', serie(2));
  await a.escrituras();
  assert.equal(a.estadoDelGuardado(), 'fallo-al-guardar');

  // «Reintentar guardar», con el almacenamiento de vuelta: todo queda en el teléfono.
  almacen.fallarEscritura = false;
  await a.reintentarGuardado();
  assert.equal(a.estadoDelGuardado(), 'en-el-telefono');
  assert.equal(filaDe(a, 1).texto, 'Guardada en el teléfono');
  assert.equal(filaDe(a, 2).texto, 'Guardada en el teléfono');
  assert.equal(textos.avisoDelGuardado(a.estadoDelGuardado(), 'pendiente'), null);
  assert.equal(textos.lineaDelEnvio('pendiente', a.estadoDelGuardado()), 'Guardado en el teléfono; falta enviarlo.');
  assert.deepEqual(guardadoDe(almacen, 'cuenta-a').sesiones[0].series.map((l) => l.serie.setIndex), [1, 2]);
});

test('1 · si lo que falla se envió al servicio, el aviso dice dónde está realmente guardado', () => {
  const aviso = textos.avisoDelGuardado('fallo-al-guardar', 'sincronizado');
  assert.deepEqual(aviso.textos, [T.falloAlGuardar, 'Lo que ya se envió está guardado en BE.']);
  assert.equal(textos.lineaDelEnvio('sincronizado', 'fallo-al-guardar'), 'Enviado: está guardado en BE.');
  // Pendiente y todavía guardándose: nunca «guardado en el teléfono».
  assert.equal(textos.lineaDelEnvio('pendiente', 'guardando'), 'Guardando en el teléfono…');
});

test('1 · una escritura vieja que termina bien después de una nueva que falló no tapa el fallo', async () => {
  const almacen = almacenQueFalla();
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token');
  a.preparar(PREPARAR);
  await a.escrituras();
  almacen.fallarEscritura = true;
  a.registrarSerie('borrador-1', serie(1));
  await a.escrituras();
  assert.equal(a.estadoDelGuardado(), 'fallo-al-guardar');
  assert.equal(filaDe(a, 1).fila.proteccion, 'solo-en-la-app');
  // La serie no está en lo confirmado: el teléfono tiene la sesión sin series.
  assert.deepEqual(guardadoDe(almacen, 'cuenta-a').sesiones[0].series, []);
});

// ─── 2. La lectura rechazada ────────────────────────────────────────────────────────────────────

test('2 · una lectura rechazada no es «no hay nada»: no se escribe encima, lo nuevo queda en la app, y al leer se suma', async () => {
  // Lo que ya había: una sesión con una serie pendiente, de una corrida anterior.
  const previo = almacenQueFalla();
  const antes = nuevoAlmacen(previo);
  await antes.abrirCuenta('cuenta-a', 'token');
  antes.preparar({ ...PREPARAR, draftId: 'borrador-viejo' });
  antes.registrarSerie('borrador-viejo', serie(1, 15));
  await antes.escrituras();
  const original = previo.datos.get(almacenes.claveDeLaCuenta('cuenta-a'));
  assert.ok(original);

  const almacen = almacenQueFalla(Object.fromEntries(previo.datos));
  almacen.fallarLectura = true;
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token');
  assert.equal(almacen.lecturas, almacenes.INTENTOS_DE_LECTURA, 'se reintenta antes de rendirse');
  assert.equal(a.estadoDelGuardado(), 'sin-leer');
  const aviso = textos.avisoDelGuardado('sin-leer', 'pendiente');
  assert.equal(aviso.titulo, 'No pudimos leer lo que había guardado en este teléfono');
  assert.match(aviso.textos[0], /No lo borramos ni lo pisamos/);
  assert.equal(aviso.accion, 'leer');

  // La persona sigue: lo nuevo queda en la app, sin tocar lo guardado.
  a.preparar(PREPARAR);
  a.registrarSerie('borrador-1', serie(1));
  await a.escrituras();
  assert.equal(almacen.escrituras.length, 0, 'no se escribió nada');
  assert.equal(almacen.datos.get(almacenes.claveDeLaCuenta('cuenta-a')), original, 'lo guardado sigue intacto');
  assert.equal(filaDe(a, 1).texto, T.fila['solo-en-la-app']);

  // El almacenamiento responde de nuevo: lo guardado se aparta tal cual y se suma a lo de la app.
  almacen.fallarLectura = false;
  await a.reintentarLectura();
  await a.escrituras();
  assert.equal(a.estadoDelGuardado(), 'en-el-telefono');
  assert.deepEqual(a.sesiones().map((s) => s.draftId).sort(), ['borrador-1', 'borrador-viejo']);
  assert.equal(a.sesion('borrador-viejo').series[0].serie.completedRepetitions, 15, 'lo de antes no se perdió');
  const [copia] = recuperaciones(almacen, 'cuenta-a');
  assert.equal(almacen.datos.get(copia), original, 'la copia de recuperación es idéntica');
  assert.deepEqual(guardadoDe(almacen, 'cuenta-a').sesiones.map((s) => s.draftId).sort(), ['borrador-1', 'borrador-viejo']);
});

// ─── 3. Lo que no se puede leer ─────────────────────────────────────────────────────────────────

test('3 · un JSON inválido se aparta tal cual antes de escribir encima, y nunca se imprime', async () => {
  const clave = almacenes.claveDeLaCuenta('cuenta-a');
  const almacen = almacenQueFalla({ [clave]: '{"v":1,"cuenta":"cuenta-a","sesiones":[' });
  const registro = [];
  const original = console.log;
  console.log = (...x) => registro.push(x.join(' '));
  try {
    const a = nuevoAlmacen(almacen);
    await a.abrirCuenta('cuenta-a', 'token');
    // Apartado lo ilegible, la cuenta se vuelve a escribir: mientras tanto, «guardando».
    assert.equal(a.estadoDelGuardado(), 'guardando');
    await a.escrituras();
    assert.equal(a.estadoDelGuardado(), 'en-el-telefono');
    a.preparar(PREPARAR);
    await a.escrituras();
    const [copia] = recuperaciones(almacen, 'cuenta-a');
    assert.equal(almacen.datos.get(copia), '{"v":1,"cuenta":"cuenta-a","sesiones":[', 'la copia es exactamente lo que había');
    assert.equal(guardadoDe(almacen, 'cuenta-a').sesiones[0].draftId, 'borrador-1');
  } finally {
    console.log = original;
  }
  assert.equal(registro.length, 0, 'nada se imprimió');
});

test('3 · una sesión ilegible dentro de lo guardado: se usan las demás y lo guardado se aparta antes de escribir', async () => {
  const clave = almacenes.claveDeLaCuenta('cuenta-a');
  const previo = almacenQueFalla();
  const antes = nuevoAlmacen(previo);
  await antes.abrirCuenta('cuenta-a', 'token');
  antes.preparar(PREPARAR);
  await antes.escrituras();
  const o = JSON.parse(previo.datos.get(clave));
  o.sesiones.push({ draftId: 'borrador-roto', occurrenceId: 'occ_2' });
  const conRota = JSON.stringify(o);
  const almacen = almacenQueFalla({ [clave]: conRota });
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token');
  await a.escrituras();
  assert.deepEqual(a.sesiones().map((s) => s.draftId), ['borrador-1']);
  const [copia] = recuperaciones(almacen, 'cuenta-a');
  assert.equal(almacen.datos.get(copia), conRota, 'la sesión ilegible no se perdió: está en la copia');
});

test('3 · lo de otra cuenta adentro de esta clave no se lee, y se aparta en lugar de borrarse', async () => {
  const otra = almacenQueFalla();
  const b = nuevoAlmacen(otra);
  await b.abrirCuenta('cuenta-b', 'token-b');
  b.preparar(PREPARAR);
  await b.escrituras();
  const deB = otra.datos.get(almacenes.claveDeLaCuenta('cuenta-b'));
  const almacen = almacenQueFalla({ [almacenes.claveDeLaCuenta('cuenta-a')]: deB });
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token-a');
  assert.deepEqual(a.sesiones(), [], 'no se muestra lo de otra cuenta');
  a.preparar({ ...PREPARAR, draftId: 'borrador-a' });
  await a.escrituras();
  assert.equal(almacen.datos.get(recuperaciones(almacen, 'cuenta-a')[0]), deB);
});

test('3 · si no se puede apartar lo ilegible, no se escribe encima: queda «sin leer»', async () => {
  const clave = almacenes.claveDeLaCuenta('cuenta-a');
  const almacen = almacenQueFalla({ [clave]: 'no es JSON' });
  almacen.fallarEscritura = true;
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token');
  assert.equal(a.estadoDelGuardado(), 'sin-leer');
  almacen.fallarEscritura = false;
  a.preparar(PREPARAR);
  await a.escrituras();
  assert.equal(almacen.datos.get(clave), 'no es JSON', 'lo ilegible sigue donde estaba');
  // Se puede reintentar: esta vez se aparta, y recién entonces se escribe.
  await a.reintentarLectura();
  await a.escrituras();
  assert.equal(a.estadoDelGuardado(), 'en-el-telefono');
  assert.equal(almacen.datos.get(recuperaciones(almacen, 'cuenta-a')[0]), 'no es JSON');
  assert.equal(guardadoDe(almacen, 'cuenta-a').sesiones[0].draftId, 'borrador-1');
});

// ─── 4. Cambio de cuenta durante una escritura o una lectura ────────────────────────────────────

test('4 · cambiar de cuenta durante una escritura: lo de la cuenta anterior va a su clave y no cambia el estado de la nueva', async () => {
  const almacen = almacenQueFalla();
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token-a');
  const f = freno();
  almacen.frenoDeEscritura = f.promesa;
  a.preparar(PREPARAR);
  a.registrarSerie('borrador-1', serie(1));
  // Mientras escribe, entra otra cuenta.
  almacen.frenoDeEscritura = null;
  await a.abrirCuenta('cuenta-b', 'token-b');
  assert.equal(a.estadoDelGuardado(), 'en-el-telefono', 'la cuenta nueva no hereda la escritura en curso');
  assert.deepEqual(a.sesiones(), []);
  f.soltar();
  await a.escrituras();
  assert.equal(a.estadoDelGuardado(), 'en-el-telefono');
  assert.deepEqual(a.sesiones(), [], 'la escritura que terminó tarde no trae lo de la otra cuenta');
  assert.equal(almacen.datos.has(almacenes.claveDeLaCuenta('cuenta-b')), false);
  assert.equal(guardadoDe(almacen, 'cuenta-a').sesiones[0].series.length, 1, 'lo de la cuenta anterior quedó en su clave');
});

test('4 · cambiar de cuenta durante una lectura: lo leído tarde no aparece en la cuenta nueva ni se escribe en su clave', async () => {
  const previo = almacenQueFalla();
  const antes = nuevoAlmacen(previo);
  await antes.abrirCuenta('cuenta-a', 'token-a');
  antes.preparar(PREPARAR);
  await antes.escrituras();
  const almacen = almacenQueFalla(Object.fromEntries(previo.datos));
  const f = freno();
  almacen.frenoDeLectura = f.promesa;
  const a = nuevoAlmacen(almacen);
  const lecturaDeA = a.abrirCuenta('cuenta-a', 'token-a');
  almacen.frenoDeLectura = null;
  await a.abrirCuenta('cuenta-b', 'token-b');
  f.soltar();
  await lecturaDeA;
  await a.escrituras();
  assert.equal(a.cuenta(), 'cuenta-b');
  assert.deepEqual(a.sesiones(), []);
  assert.equal(almacen.datos.has(almacenes.claveDeLaCuenta('cuenta-b')), false);
});

// ─── 5. El cierre antes de que termine una escritura ────────────────────────────────────────────

test('5 · si la app se cierra antes de que termine una escritura, nunca dijo «guardada en el teléfono», y el proceso nuevo lee lo último confirmado', async () => {
  const almacen = almacenQueFalla();
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token');
  a.preparar(PREPARAR);
  a.registrarSerie('borrador-1', serie(1));
  await a.escrituras();
  assert.equal(filaDe(a, 1).texto, 'Guardada en el teléfono');
  // La segunda serie empieza a escribirse y el sistema cierra la app en el medio.
  almacen.frenoDeEscritura = new Promise(() => undefined);
  a.registrarSerie('borrador-1', serie(2));
  assert.equal(a.estadoDelGuardado(), 'guardando');
  assert.equal(filaDe(a, 2).texto, 'Guardando en el teléfono…', 'la que se estaba escribiendo no se anunció como guardada');
  assert.equal(filaDe(a, 1).texto, 'Guardada en el teléfono', 'la confirmada sigue confirmada');

  // El proceso nuevo lee lo que quedó: la serie 1, que era lo confirmado.
  almacen.frenoDeEscritura = null;
  const otro = nuevoAlmacen(almacen);
  await otro.abrirCuenta('cuenta-a', 'token');
  assert.deepEqual(otro.sesion('borrador-1').series.map((l) => l.serie.setIndex), [1]);
  assert.equal(otro.estadoDelGuardado(), 'en-el-telefono');
});

// ─── 6. El cifrado ──────────────────────────────────────────────────────────────────────────────

/** AES-256-GCM de Node, con la misma forma que el de expo-crypto: vector de 12 bytes y etiqueta de 16. */
const aesDeNode = {
  async nuevaClave() {
    return randomBytes(32).toString('base64');
  },
  async cifrar(claveB64, datos, asociados) {
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', Buffer.from(claveB64, 'base64'), iv);
    c.setAAD(Buffer.from(asociados));
    const cuerpo = Buffer.concat([c.update(Buffer.from(datos)), c.final()]);
    return Buffer.concat([iv, cuerpo, c.getAuthTag()]).toString('base64');
  },
  async descifrar(claveB64, combinadoB64, asociados) {
    const todo = Buffer.from(combinadoB64, 'base64');
    const d = createDecipheriv('aes-256-gcm', Buffer.from(claveB64, 'base64'), todo.subarray(0, 12));
    d.setAAD(Buffer.from(asociados));
    d.setAuthTag(todo.subarray(todo.length - 16));
    return new Uint8Array(Buffer.concat([d.update(todo.subarray(12, todo.length - 16)), d.final()]));
  },
};

function almacenDeClaves() {
  const datos = new Map();
  const c = {
    datos,
    fallar: false,
    guardadas: 0,
    async leer(k) {
      if (c.fallar) throw new Error('Keystore no disponible');
      return datos.get(k) ?? null;
    },
    async guardar(k, v) {
      if (c.fallar) throw new Error('Keystore no disponible');
      c.guardadas++;
      datos.set(k, v);
    },
  };
  return c;
}

test('6 · UTF-8 de ida y vuelta, sin TextEncoder, con tildes, eñes y emojis; lo que no es UTF-8 no se acepta', () => {
  const texto = 'Sentadilla «goblet» · ñandú · 💪 · 16,5 kg';
  assert.equal(cifrado.desdeUtf8(cifrado.aUtf8(texto)), texto);
  assert.deepEqual([...cifrado.aUtf8(texto)], [...Buffer.from(texto, 'utf8')]);
  assert.throws(() => cifrado.desdeUtf8(Uint8Array.from([0xc3])));
  assert.throws(() => cifrado.desdeUtf8(Uint8Array.from([0xff, 0x41])));
});

test('6 · lo guardado queda cifrado: sin texto legible, con la clave en el almacenamiento seguro, atado a su cuenta', async () => {
  const plano = almacenQueFalla();
  const claves = almacenDeClaves();
  const almacen = cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode });
  const a = nuevoAlmacen(almacen);
  await a.abrirCuenta('cuenta-a', 'token');
  a.preparar(PREPARAR);
  a.registrarSerie('borrador-1', serie(1));
  await a.escrituras();
  const crudo = plano.datos.get(almacenes.claveDeLaCuenta('cuenta-a'));
  assert.ok(crudo.startsWith(cifrado.PREFIJO_CIFRADO));
  assert.doesNotMatch(crudo, /Piernas|borrador|completedRepetitions|cuenta-a/, 'nada legible en AsyncStorage');
  assert.equal(claves.datos.size, 1, 'una clave, de esa cuenta');
  const [claveDeCifrado] = claves.datos.keys();
  assert.match(claveDeCifrado, /^[A-Za-z0-9._-]+$/, 'una clave que el almacenamiento seguro acepta');
  assert.equal(Buffer.from(claves.datos.get(claveDeCifrado), 'base64').length, 32, '256 bits: solo la clave, nunca el historial');

  // Un proceso nuevo lo lee igual.
  const otro = nuevoAlmacen(cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode }));
  await otro.abrirCuenta('cuenta-a', 'token');
  assert.equal(otro.sesion('borrador-1').series[0].serie.completedRepetitions, 12);

  // Copiado a la clave de otra cuenta, con la clave de cifrado de esa cuenta copiada también, no descifra: los datos
  // asociados son la clave de AsyncStorage.
  plano.datos.set(almacenes.claveDeLaCuenta('cuenta-b'), crudo);
  claves.datos.set(cifrado.claveDeCifrado(almacenes.claveDeLaCuenta('cuenta-b')), claves.datos.get(claveDeCifrado));
  assert.deepEqual(await cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode }).leer(almacenes.claveDeLaCuenta('cuenta-b')), { tipo: 'ilegible', motivo: 'no-descifra' });
});

test('6 · la migración: lo que una versión anterior guardó sin cifrar se lee igual y la próxima escritura lo cifra, sin perder nada', async () => {
  const sinCifrar = almacenQueFalla();
  const vieja = nuevoAlmacen(sinCifrar);
  await vieja.abrirCuenta('cuenta-a', 'token');
  vieja.preparar(PREPARAR);
  vieja.registrarSerie('borrador-1', serie(1, 14));
  await vieja.escrituras();
  assert.ok(sinCifrar.datos.get(almacenes.claveDeLaCuenta('cuenta-a')).startsWith('{'), 'la versión anterior lo dejó en claro');

  const claves = almacenDeClaves();
  const a = nuevoAlmacen(cifrado.crearAlmacenCifrado({ plano: sinCifrar, claves, aes: aesDeNode }));
  await a.abrirCuenta('cuenta-a', 'token');
  await a.escrituras();
  assert.equal(a.sesion('borrador-1').series[0].serie.completedRepetitions, 14);
  assert.ok(sinCifrar.datos.get(almacenes.claveDeLaCuenta('cuenta-a')).startsWith(cifrado.PREFIJO_CIFRADO), 'quedó cifrado');
  assert.equal(a.estadoDelGuardado(), 'en-el-telefono');
});

test('6 · sin la clave de cifrado (una restauración, un borrado), lo cifrado se aparta tal cual y se sigue con una clave nueva', async () => {
  const plano = almacenQueFalla();
  const claves = almacenDeClaves();
  const a = nuevoAlmacen(cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode }));
  await a.abrirCuenta('cuenta-a', 'token');
  a.preparar(PREPARAR);
  await a.escrituras();
  const crudo = plano.datos.get(almacenes.claveDeLaCuenta('cuenta-a'));
  claves.datos.clear();

  const otro = nuevoAlmacen(cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode }));
  await otro.abrirCuenta('cuenta-a', 'token');
  assert.deepEqual(otro.sesiones(), []);
  assert.equal(plano.datos.get(recuperaciones(plano, 'cuenta-a')[0]), crudo, 'lo cifrado no se perdió: está apartado');
  otro.preparar({ ...PREPARAR, draftId: 'borrador-2' });
  await otro.escrituras();
  assert.equal(otro.estadoDelGuardado(), 'en-el-telefono');
  assert.equal(claves.datos.size, 1, 'una clave nueva');
  const leido = nuevoAlmacen(cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode }));
  await leido.abrirCuenta('cuenta-a', 'token');
  assert.deepEqual(leido.sesiones().map((s) => s.draftId), ['borrador-2']);
});

test('6 · si el almacenamiento seguro no responde, es una lectura fallida: nunca se crea una clave nueva ni se pisa lo cifrado', async () => {
  const plano = almacenQueFalla();
  const claves = almacenDeClaves();
  const a = nuevoAlmacen(cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode }));
  await a.abrirCuenta('cuenta-a', 'token');
  a.preparar(PREPARAR);
  await a.escrituras();
  const crudo = plano.datos.get(almacenes.claveDeLaCuenta('cuenta-a'));
  const guardadasAntes = claves.guardadas;

  claves.fallar = true;
  const otro = nuevoAlmacen(cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode }));
  await otro.abrirCuenta('cuenta-a', 'token');
  assert.equal(otro.estadoDelGuardado(), 'sin-leer');
  otro.preparar({ ...PREPARAR, draftId: 'borrador-2' });
  await otro.escrituras();
  assert.equal(plano.datos.get(almacenes.claveDeLaCuenta('cuenta-a')), crudo, 'lo cifrado sigue igual');
  assert.equal(claves.guardadas, guardadasAntes, 'no se creó ninguna clave');

  // El almacenamiento seguro vuelve: se lee lo de antes y se suma lo nuevo.
  claves.fallar = false;
  await otro.reintentarLectura();
  await otro.escrituras();
  assert.deepEqual(otro.sesiones().map((s) => s.draftId).sort(), ['borrador-1', 'borrador-2']);
  assert.equal(otro.estadoDelGuardado(), 'en-el-telefono');
});
