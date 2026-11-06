/**
 * El borrador de un formulario guardado en el teléfono (WP-FORMULARIOS-RONDA-2, FR-01; FI-04):
 * `apps/mobile/src/borrador-de-formulario.ts`, con el almacén cifrado de `almacen-cifrado.ts` y el AES-256-GCM de Node.
 *
 * Con almacenamientos inyectados que fallan a propósito, sin teléfono:
 *  1. las claves: una por cuenta y por solicitud, con la identidad adentro, y una clave de cifrado por cuenta;
 *  2. el cifrado: nada legible en AsyncStorage, lo de una solicitud copiado a otra no descifra, y dos primeras escrituras
 *     a la vez no crean dos claves;
 *  3. la demora corta: no se escribe en cada tecla, la última escritura reemplaza a la que esperaba y «guardar ya» no
 *     espera;
 *  4. qué se restaura al abrir, antes que la precarga, y qué se descarta (la versión del formulario, la respuesta o lo
 *     cargado cambiaron, o ya se respondió);
 *  5. cada caso de borrado: al enviar, al descartar lo cargado (con y sin `conservarBorrador`), cuando no queda nada
 *     propio, al cerrar la sesión y cuando la bandeja dice que la solicitud ya no está pendiente;
 *  6. si el almacén falla, nada lanza: una lectura que no responde es «sin leer», y una escritura fallida se informa.
 *
 * **Lo que esto no prueba:** AsyncStorage, el almacenamiento seguro ni el AES de expo-crypto en un teléfono real, ni la
 * pantalla. Eso se comprueba en la próxima candidata: cerrar la app desde Recientes con algo escrito y volver.
 * Uso: node --test scripts/borrador-de-formulario.test.mjs (después de construir @be/domain).
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

const b = await import('../apps/mobile/src/borrador-de-formulario.ts');
const cifrado = await import('../apps/mobile/src/almacen-cifrado.ts');
const { BORRADOR_VACIO, reducirBorrador } = await import('../apps/mobile/src/formulario-v2.ts');

// ─── Lo que se inyecta ──────────────────────────────────────────────────────────────────────────

/** Un AsyncStorage en memoria que se puede hacer fallar a pedido. */
function asyncStorage(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  const a = {
    datos,
    fallarLectura: false,
    fallarEscritura: false,
    fallarBorrado: false,
    escrituras: 0,
    async leer(k) {
      if (a.fallarLectura) throw new Error('AsyncStorage no respondió');
      return datos.get(k) ?? null;
    },
    async guardar(k, v) {
      if (a.fallarEscritura) throw new Error('AsyncStorage no escribió');
      a.escrituras++;
      datos.set(k, v);
    },
    async borrar(k) {
      if (a.fallarBorrado) throw new Error('AsyncStorage no borró');
      datos.delete(k);
    },
    async claves() {
      if (a.fallarLectura) throw new Error('AsyncStorage no respondió');
      return [...datos.keys()];
    },
  };
  return a;
}

/** El almacenamiento seguro, para la clave de cifrado de cada cuenta. */
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

/** Un temporizador que corre a pedido: la demora se prueba sin esperar. */
function temporizador() {
  const t = { pendientes: [] };
  t.programar = (hacer, ms) => {
    const p = { hacer, ms, cancelado: false };
    t.pendientes.push(p);
    return () => (p.cancelado = true);
  };
  t.correr = () => {
    const ahora = t.pendientes.filter((p) => !p.cancelado);
    t.pendientes = [];
    for (const p of ahora) p.hacer();
  };
  return t;
}

/** Un teléfono: AsyncStorage, el almacenamiento seguro y el almacén de los borradores, como en `formularios-en-el-telefono.ts`. */
function telefono({ plano = asyncStorage(), claves = almacenDeClaves(), reloj = temporizador() } = {}) {
  const almacen = cifrado.crearAlmacenCifrado({ plano, claves, aes: aesDeNode, nombreDeLaClave: b.nombreDeLaClaveDeCifrado });
  const borradores = b.crearBorradoresDeFormularios({ almacen, plano, programar: reloj.programar });
  return { plano, claves, reloj, almacen, borradores };
}

// ─── Una solicitud de ejemplo ───────────────────────────────────────────────────────────────────

const base = { category: 'HABITOS_Y_CONTEXTO', helpText: null, purpose: null, showIf: null, requiredByDefault: false };
const SECCIONES = [
  {
    sectionCode: 'habitos',
    title: 'Hábitos',
    intro: null,
    fields: [
      { ...base, fieldCode: 'notas', label: 'Algo más que quieras contar', dataType: 'TEXT', multiline: true, maxLength: 200 },
      { ...base, fieldCode: 'comidas_por_dia', label: 'Cuántas comidas hacés por día', dataType: 'NUMBER', unit: 'comidas', limits: null },
      {
        ...base,
        fieldCode: 'comidas',
        label: 'Las comidas que más se repiten',
        dataType: 'LIST',
        itemLabel: 'comida',
        minItems: 0,
        maxItems: 5,
        itemFields: [{ code: 'que', label: 'Qué comés', required: true, dataType: 'TEXT', maxLength: 200 }],
      },
    ],
  },
];

const escribir = (borrador, fieldCode, texto, como = 'TEXT') => reducirBorrador(borrador, { tipo: 'escribir', fieldCode, como, texto });
const conNotas = (texto) => escribir(BORRADOR_VACIO, 'notas', texto);

const SOLICITUD = { formRequestId: 'sol-1', templateVersionId: 'v-nut-1', status: 'PENDING' };
const RESPUESTA = {
  formResponseId: 'resp-1',
  version: 'r1',
  original: { answers: [{ fieldCode: 'notas', answer: { type: 'TEXT', text: 'Como en casa' } }] },
  rectifications: [],
  effectiveView: { kind: 'ORIGINAL' },
};
const PROPUESTA = { proposalId: 'prop-1', version: 'p1', answers: [{ fieldCode: 'comidas_por_dia', answer: { type: 'NUMBER', number: 4 } }] };

/** Lo que la pantalla guarda: la cuenta, la solicitud, la versión del formulario, sobre qué se escribió y lo escrito. */
const guardado = ({ identidadId = 'cuenta-a', formRequestId = 'sol-1', templateVersionId = 'v-nut-1', base: sobre = { tipo: 'responder' }, borrador = conNotas('Desayuno mate'), motivo = '' } = {}) => ({
  version: 1,
  identidadId,
  formRequestId,
  templateVersionId,
  base: sobre,
  borrador,
  motivo,
});

/** Escribe y deja que corra la demora; devuelve si la escritura quedó en el teléfono. */
async function escribirYGuardar(t, g) {
  let enElTelefono = null;
  t.borradores.escribir(g, (ok) => (enElTelefono = ok));
  t.reloj.correr();
  await t.borradores.guardarYa();
  return enElTelefono;
}

// ─── 1. Las claves ──────────────────────────────────────────────────────────────────────────────

test('1 · una clave por cuenta y por solicitud, con los identificadores codificados, y una clave de cifrado por cuenta', () => {
  const a1 = b.claveDelBorrador('cuenta-a', 'sol-1');
  const a2 = b.claveDelBorrador('cuenta-a', 'sol-2');
  const raro = b.claveDelBorrador('cuenta:a', 'sol/1:2');
  assert.equal(a1, 'be-formulario-en-curso:cuenta-a:sol-1');
  assert.notEqual(a1, a2);
  assert.equal(b.solicitudDeLaClave('cuenta-a', a2), 'sol-2');
  assert.equal(b.solicitudDeLaClave('cuenta:a', raro), 'sol/1:2', 'un «:» en un identificador no confunde la cuenta con la solicitud');
  assert.equal(b.solicitudDeLaClave('cuenta-b', a1), null, 'una clave de otra cuenta no es de esta');
  assert.equal(b.solicitudDeLaClave('cuenta', a1), null, 'ni la de una cuenta cuyo identificador empieza igual');
  // La de cifrado es la de la cuenta: igual para sus dos solicitudes, distinta de la de otra cuenta y de la del entrenamiento.
  assert.equal(b.nombreDeLaClaveDeCifrado(a1), b.nombreDeLaClaveDeCifrado(a2));
  assert.notEqual(b.nombreDeLaClaveDeCifrado(a1), b.nombreDeLaClaveDeCifrado(b.claveDelBorrador('cuenta-b', 'sol-1')));
  assert.notEqual(b.nombreDeLaClaveDeCifrado(a1), cifrado.claveDeCifrado('be-entrenamiento-en-curso:cuenta-a'));
  assert.match(b.nombreDeLaClaveDeCifrado(raro), /^[A-Za-z0-9._-]+$/, 'una clave que el almacenamiento seguro acepta');
});

test('1 · la identidad y la solicitud van adentro: lo de otra cuenta o de otra solicitud copiado a esta clave no se lee', () => {
  const texto = JSON.stringify(guardado());
  assert.deepEqual(b.leerGuardado(texto, 'cuenta-a', 'sol-1'), guardado());
  assert.equal(b.leerGuardado(texto, 'cuenta-b', 'sol-1'), null);
  assert.equal(b.leerGuardado(texto, 'cuenta-a', 'sol-2'), null);
  assert.equal(b.leerGuardado('{no es JSON', 'cuenta-a', 'sol-1'), null);
  assert.equal(b.leerGuardado(JSON.stringify({ ...guardado(), version: 2 }), 'cuenta-a', 'sol-1'), null, 'otra versión del formato');
  // Un valor con otra forma rompería la pantalla al dibujarlo: no se acepta.
  for (const malo of [{ tipo: 'LIST', renglones: 'uno' }, { tipo: 'BOOLEAN', eleccion: true }, { tipo: 'FOODS', alimentos: [{ nombre: 3 }] }, { tipo: 'OTRO' }]) {
    assert.equal(b.leerGuardado(JSON.stringify({ ...guardado(), borrador: { notas: malo } }), 'cuenta-a', 'sol-1'), null, JSON.stringify(malo));
  }
  assert.equal(b.leerGuardado(JSON.stringify({ ...guardado(), base: { tipo: 'corregir' } }), 'cuenta-a', 'sol-1'), null, 'una corrección sin su respuesta');
});

// ─── 2. El cifrado ──────────────────────────────────────────────────────────────────────────────

test('2 · lo guardado queda cifrado, se lee en un proceso nuevo y comparte la clave de su cuenta', async () => {
  const t = telefono();
  assert.equal(await escribirYGuardar(t, guardado({ borrador: conNotas('Desayuno mate con tostadas') })), true);
  assert.equal(await escribirYGuardar(t, guardado({ formRequestId: 'sol-2', borrador: conNotas('Entreno a la noche') })), true);
  const crudo = t.plano.datos.get(b.claveDelBorrador('cuenta-a', 'sol-1'));
  assert.ok(crudo.startsWith(cifrado.PREFIJO_CIFRADO));
  assert.doesNotMatch(crudo, /Desayuno|tostadas|cuenta-a|sol-1|notas/, 'nada legible en AsyncStorage');
  assert.equal(t.claves.datos.size, 1, 'una clave de cifrado para las dos solicitudes de la cuenta');
  assert.equal(Buffer.from([...t.claves.datos.values()][0], 'base64').length, 32, '256 bits: solo la clave, nunca lo escrito');

  // La app se cierra y vuelve: un proceso nuevo, con el mismo AsyncStorage y el mismo almacenamiento seguro.
  const otro = telefono({ plano: t.plano, claves: t.claves });
  const lectura = await otro.borradores.leer('cuenta-a', 'sol-1');
  assert.equal(lectura.tipo, 'guardado');
  assert.equal(lectura.guardado.borrador.notas.texto, 'Desayuno mate con tostadas');
});

test('2 · lo de una solicitud copiado a la clave de otra no descifra: no se usa y se borra', async () => {
  const t = telefono();
  await escribirYGuardar(t, guardado());
  t.plano.datos.set(b.claveDelBorrador('cuenta-a', 'sol-2'), t.plano.datos.get(b.claveDelBorrador('cuenta-a', 'sol-1')));
  assert.deepEqual(await t.borradores.leer('cuenta-a', 'sol-2'), { tipo: 'nada' });
  assert.equal(t.plano.datos.has(b.claveDelBorrador('cuenta-a', 'sol-2')), false);
  assert.equal((await t.borradores.leer('cuenta-a', 'sol-1')).tipo, 'guardado', 'el original sigue');
});

test('2 · dos primeras escrituras a la vez, de dos solicitudes de la misma cuenta, crean una sola clave y las dos se leen', async () => {
  const t = telefono();
  // Directo al almacén cifrado, en paralelo: el almacén de los borradores las pondría en fila y no se cruzarían.
  await Promise.all([
    t.almacen.guardar(b.claveDelBorrador('cuenta-a', 'sol-1'), JSON.stringify(guardado())),
    t.almacen.guardar(b.claveDelBorrador('cuenta-a', 'sol-2'), JSON.stringify(guardado({ formRequestId: 'sol-2' }))),
  ]);
  assert.equal(t.claves.guardadas, 1, 'si se crearan dos, la segunda pisaría a la primera y lo cifrado con ella no se leería');
  const otro = telefono({ plano: t.plano, claves: t.claves });
  assert.equal((await otro.borradores.leer('cuenta-a', 'sol-1')).tipo, 'guardado');
  assert.equal((await otro.borradores.leer('cuenta-a', 'sol-2')).tipo, 'guardado');
});

test('2 · sin la clave de cifrado (se borró el almacenamiento seguro), lo cifrado no se lee, se borra y se sigue', async () => {
  const t = telefono();
  await escribirYGuardar(t, guardado());
  const sinClave = telefono({ plano: t.plano });
  assert.deepEqual(await sinClave.borradores.leer('cuenta-a', 'sol-1'), { tipo: 'nada' });
  assert.equal(t.plano.datos.size, 0);
  assert.equal(await escribirYGuardar(sinClave, guardado()), true, 'la próxima escritura crea una clave nueva');
});

// ─── 3. La demora corta ─────────────────────────────────────────────────────────────────────────

test('3 · no se escribe en cada tecla: espera la demora, la última reemplaza a la anterior y «guardar ya» no espera', async () => {
  const t = telefono();
  const avisos = [];
  t.borradores.escribir(guardado({ borrador: conNotas('De') }), (ok) => avisos.push(['De', ok]));
  t.borradores.escribir(guardado({ borrador: conNotas('Desayuno') }), (ok) => avisos.push(['Desayuno', ok]));
  assert.equal(t.reloj.pendientes.filter((p) => !p.cancelado).length, 1, 'una sola escritura esperando');
  assert.equal(t.reloj.pendientes[0].ms, b.DEMORA_DEL_BORRADOR_MS);
  assert.equal(t.plano.escrituras, 0, 'nada escrito antes de la demora');
  t.reloj.correr();
  await t.borradores.guardarYa();
  assert.equal(t.plano.escrituras, 1);
  assert.deepEqual(avisos, [['Desayuno', true]], 'solo la última, y dice que quedó en el teléfono');

  // Al salir de la pantalla o pasar a segundo plano: lo que esperaba se guarda ya.
  t.borradores.escribir(guardado({ borrador: conNotas('Desayuno mate') }));
  await t.borradores.guardarYa();
  assert.equal((await t.borradores.leer('cuenta-a', 'sol-1')).guardado.borrador.notas.texto, 'Desayuno mate');
  t.reloj.correr();
  await t.borradores.guardarYa();
  assert.equal(t.plano.escrituras, 2, 'la demora vieja no vuelve a escribir');
});

// ─── 4. Qué se restaura al abrir ────────────────────────────────────────────────────────────────

const detalle = ({ request = {}, response = null, proposal = null } = {}) => ({ request: { ...SOLICITUD, ...request }, response, proposal });

test('4 · una respuesta nueva vuelve tal cual, contra el formulario vacío, antes que cualquier precarga', () => {
  const r = b.restauracionDe(guardado(), detalle(), SECCIONES);
  assert.deepEqual(r, { tipo: 'restaurar', borrador: conNotas('Desayuno mate'), motivo: '', base: BORRADOR_VACIO, corrigiendo: false });
  assert.deepEqual(b.restauracionDe(null, detalle(), SECCIONES), { tipo: 'nada' });
});

test('4 · si cambió la versión del formulario, lo guardado no corresponde y se descarta', () => {
  assert.deepEqual(b.restauracionDe(guardado(), detalle({ request: { templateVersionId: 'v-nut-2' } }), SECCIONES), { tipo: 'descartar' });
});

test('4 · una corrección vuelve con su motivo, contra la respuesta vigente; si la respuesta cambió, se descarta', () => {
  const sobre = { tipo: 'corregir', formResponseId: 'resp-1', version: 'r1' };
  const g = guardado({ base: sobre, borrador: conNotas('Como en casa y en el trabajo'), motivo: 'Cambié de trabajo' });
  const conRespuesta = detalle({ request: { status: 'RESPONDED' }, response: RESPUESTA });
  const r = b.restauracionDe(g, conRespuesta, SECCIONES);
  assert.equal(r.tipo, 'restaurar');
  assert.equal(r.motivo, 'Cambié de trabajo');
  assert.deepEqual(r.base, conNotas('Como en casa'), 'la base es lo que vale hoy: lo propio se mide contra eso');
  assert.equal(r.corrigiendo, false);
  // Se corrigió en otro lado mientras tanto (otra versión), o es otra respuesta: lo de acá es viejo.
  assert.deepEqual(b.restauracionDe(g, detalle({ request: { status: 'RESPONDED' }, response: { ...RESPUESTA, version: 'r2' } }), SECCIONES), { tipo: 'descartar' });
  assert.deepEqual(b.restauracionDe(g, detalle(), SECCIONES), { tipo: 'descartar' }, 'sin respuesta, no hay qué corregir');
  // Solo el motivo, sin tocar las respuestas, también es propio.
  assert.equal(b.restauracionDe(guardado({ base: sobre, borrador: conNotas('Como en casa'), motivo: 'Me equivoqué' }), conRespuesta, SECCIONES).tipo, 'restaurar');
});

test('4 · lo cargado que se estaba corrigiendo vuelve solo si es la misma carga, con la misma versión', () => {
  const sobre = { tipo: 'propuesta', proposalId: 'prop-1', version: 'p1' };
  const corregido = escribir(escribir(BORRADOR_VACIO, 'comidas_por_dia', '5', 'NUMBER'), 'notas', 'Ceno tarde');
  const g = guardado({ base: sobre, borrador: corregido });
  const r = b.restauracionDe(g, detalle({ proposal: PROPUESTA }), SECCIONES);
  assert.equal(r.tipo, 'restaurar');
  assert.equal(r.corrigiendo, true, 'se abre el formulario, no la lectura en palabras');
  assert.deepEqual(r.base, escribir(BORRADOR_VACIO, 'comidas_por_dia', '4', 'NUMBER'));
  assert.deepEqual(b.restauracionDe(g, detalle({ proposal: { ...PROPUESTA, version: 'p2' } }), SECCIONES), { tipo: 'descartar' }, 'el profesional la volvió a cargar');
  assert.deepEqual(b.restauracionDe(g, detalle(), SECCIONES), { tipo: 'descartar' }, 'la retiró o ya se resolvió');
});

test('4 · lo escrito por la persona sigue siendo suyo aunque después aparezca algo cargado; si ya se respondió, se descarta', () => {
  const r = b.restauracionDe(guardado(), detalle({ proposal: PROPUESTA }), SECCIONES);
  assert.equal(r.tipo, 'restaurar');
  assert.equal(r.corrigiendo, false, 'primero se lee lo cargado; lo escrito sigue en el formulario');
  assert.deepEqual(b.restauracionDe(guardado(), detalle({ request: { status: 'RESPONDED' }, response: RESPUESTA }), SECCIONES), { tipo: 'descartar' });
});

test('4 · lo guardado sin nada propio (igual a lo precargado) no se restaura', () => {
  const sobre = { tipo: 'corregir', formResponseId: 'resp-1', version: 'r1' };
  assert.deepEqual(b.restauracionDe(guardado({ base: sobre, borrador: conNotas('Como en casa') }), detalle({ request: { status: 'RESPONDED' }, response: RESPUESTA }), SECCIONES), { tipo: 'descartar' });
  assert.deepEqual(b.restauracionDe(guardado({ borrador: conNotas('   ') }), detalle(), SECCIONES), { tipo: 'descartar' });
});

test('4 · sobre qué se escribe: la respuesta vigente, lo cargado mientras se corrige, o una respuesta nueva', () => {
  assert.deepEqual(b.baseDelBorrador({ response: RESPUESTA, proposal: null, corrigiendo: false }), { tipo: 'corregir', formResponseId: 'resp-1', version: 'r1' });
  assert.deepEqual(b.baseDelBorrador({ response: null, proposal: PROPUESTA, corrigiendo: true }), { tipo: 'propuesta', proposalId: 'prop-1', version: 'p1' });
  assert.deepEqual(b.baseDelBorrador({ response: null, proposal: PROPUESTA, corrigiendo: false }), { tipo: 'responder' }, 'lo de la persona, con algo cargado que espera');
  assert.deepEqual(b.baseDelBorrador({ response: null, proposal: null, corrigiendo: false }), { tipo: 'responder' });
});

// ─── 5. Cada caso de borrado ────────────────────────────────────────────────────────────────────

test('5 · al enviar con éxito: se borra lo guardado y la escritura que esperaba su demora no llega a hacerse', async () => {
  const t = telefono();
  await escribirYGuardar(t, guardado());
  t.borradores.escribir(guardado({ borrador: conNotas('Desayuno mate y fruta') }));
  await t.borradores.borrar('cuenta-a', 'sol-1');
  t.reloj.correr();
  await t.borradores.guardarYa();
  assert.equal(t.plano.datos.size, 0);
  assert.deepEqual(await t.borradores.leer('cuenta-a', 'sol-1'), { tipo: 'nada' });
});

test('5 · al descartar lo cargado: si se estaba corrigiendo, se borra; si era lo de la persona (`conservarBorrador`), sigue y vale', async () => {
  // Corrigiendo lo cargado: el borrador era eso. La pantalla limpia y borra.
  const t = telefono();
  await escribirYGuardar(t, guardado({ base: { tipo: 'propuesta', proposalId: 'prop-1', version: 'p1' }, borrador: escribir(BORRADOR_VACIO, 'comidas_por_dia', '5', 'NUMBER') }));
  await t.borradores.borrar('cuenta-a', 'sol-1');
  assert.deepEqual(await t.borradores.leer('cuenta-a', 'sol-1'), { tipo: 'nada' });

  // Lo escrito por la persona antes de que apareciera lo cargado: sobrevive al descarte, guardado sobre una respuesta nueva.
  const propio = telefono();
  await escribirYGuardar(propio, guardado({ base: b.baseDelBorrador({ response: null, proposal: PROPUESTA, corrigiendo: false }) }));
  const lectura = await propio.borradores.leer('cuenta-a', 'sol-1');
  assert.equal(b.restauracionDe(lectura.guardado, detalle(), SECCIONES).tipo, 'restaurar', 'sin lo cargado, vuelve igual');
});

test('5 · cuando no queda nada propio, la pantalla lo borra: lo precargado sin tocar, lo borrado a mano y un motivo en blanco no se guardan', () => {
  const precargado = conNotas('Como en casa');
  assert.equal(b.hayQueGuardar(precargado, precargado, ''), false);
  assert.equal(b.hayQueGuardar(conNotas(''), BORRADOR_VACIO, ''), false, 'lo escrito y después borrado');
  assert.equal(b.hayQueGuardar(BORRADOR_VACIO, BORRADOR_VACIO, '   '), false);
  assert.equal(b.hayQueGuardar(conNotas('Como en casa y afuera'), precargado, ''), true);
  assert.equal(b.hayQueGuardar(precargado, precargado, 'Me equivoqué'), true, 'el motivo solo ya es propio');
});

test('5 · al cerrar la sesión: se borra todo lo de esa cuenta, también lo que esperaba su demora, y nada de otra cuenta', async () => {
  const t = telefono();
  t.plano.datos.set('be-entrenamiento-en-curso:cuenta-a', 'del entrenamiento');
  await escribirYGuardar(t, guardado());
  await escribirYGuardar(t, guardado({ formRequestId: 'sol-2' }));
  await escribirYGuardar(t, guardado({ identidadId: 'cuenta-b' }));
  t.borradores.escribir(guardado({ formRequestId: 'sol-3' }));
  await t.borradores.borrarDeLaCuenta('cuenta-a');
  t.reloj.correr();
  await t.borradores.guardarYa();
  assert.deepEqual([...t.plano.datos.keys()].sort(), ['be-entrenamiento-en-curso:cuenta-a', b.claveDelBorrador('cuenta-b', 'sol-1')]);
});

test('5 · qué salidas borran: cerrar la sesión (una o todas) y pedir el cierre de la cuenta; vencer, dejar de valer o volver a entrar, no', () => {
  for (const motivo of ['sesion-cerrada', 'sesiones-cerradas', 'cierre-registrado']) assert.equal(b.borraLosBorradores(motivo), true, motivo);
  for (const motivo of ['sesion-vencida', 'sesion-no-valida', 'reautenticar']) assert.equal(b.borraLosBorradores(motivo), false, motivo);
});

const enLaBandeja = (formRequestId, cambios = {}) => ({ formRequestId, templateVersionId: 'v-nut-1', status: 'PENDING', pendingProposal: null, ...cambios });

test('5 · al leer la bandeja: se borra lo de las solicitudes que ya no están pendientes, y se conserva lo que sigue valiendo', async () => {
  const t = telefono();
  const corregir = { tipo: 'corregir', formResponseId: 'resp-1', version: 'r1' };
  const propuesta = { tipo: 'propuesta', proposalId: 'prop-1', version: 'p1' };
  await escribirYGuardar(t, guardado({ formRequestId: 'pendiente' }));
  await escribirYGuardar(t, guardado({ formRequestId: 'respondida' }));
  await escribirYGuardar(t, guardado({ formRequestId: 'corrigiendo', base: corregir }));
  await escribirYGuardar(t, guardado({ formRequestId: 'cargada', base: propuesta }));
  await escribirYGuardar(t, guardado({ formRequestId: 'recargada', base: propuesta }));
  await escribirYGuardar(t, guardado({ formRequestId: 'otra-version' }));
  await escribirYGuardar(t, guardado({ formRequestId: 'fuera-de-la-lista' }));
  await escribirYGuardar(t, guardado({ identidadId: 'cuenta-b', formRequestId: 'respondida' }));
  const bandeja = [
    enLaBandeja('pendiente'),
    enLaBandeja('respondida', { status: 'RESPONDED' }),
    enLaBandeja('corrigiendo', { status: 'RESPONDED' }),
    enLaBandeja('cargada', { pendingProposal: { proposalId: 'prop-1', version: 'p1' } }),
    enLaBandeja('recargada', { pendingProposal: { proposalId: 'prop-1', version: 'p2' } }),
    enLaBandeja('otra-version', { templateVersionId: 'v-nut-2' }),
  ];
  // Con otra página por leer, lo que no está en esta puede estar en la siguiente: se conserva.
  await t.borradores.conservarSegunLaLista('cuenta-a', bandeja, false);
  const deA = () => [...t.plano.datos.keys()].map((k) => b.solicitudDeLaClave('cuenta-a', k)).filter(Boolean).sort();
  assert.deepEqual(deA(), ['cargada', 'corrigiendo', 'fuera-de-la-lista', 'pendiente']);
  // Con la bandeja entera, lo que no está ya no es de una solicitud pendiente.
  await t.borradores.conservarSegunLaLista('cuenta-a', bandeja, true);
  assert.deepEqual(deA(), ['cargada', 'corrigiendo', 'pendiente']);
  assert.ok(t.plano.datos.has(b.claveDelBorrador('cuenta-b', 'respondida')), 'lo de otra cuenta no se toca');
});

test('5 · al leer la bandeja, lo que se está escribiendo ahora (con su demora) no se toca, y lo ilegible se borra', async () => {
  const t = telefono();
  await escribirYGuardar(t, guardado({ formRequestId: 'respondida' }));
  t.borradores.escribir(guardado({ formRequestId: 'respondida', borrador: conNotas('Recién escrito') }));
  t.plano.datos.set(b.claveDelBorrador('cuenta-a', 'ilegible'), `${cifrado.PREFIJO_CIFRADO}basura`);
  await t.borradores.conservarSegunLaLista('cuenta-a', [enLaBandeja('respondida', { status: 'RESPONDED' }), enLaBandeja('ilegible')], true);
  assert.equal(t.plano.datos.has(b.claveDelBorrador('cuenta-a', 'ilegible')), false);
  await t.borradores.guardarYa();
  assert.equal((await t.borradores.leer('cuenta-a', 'respondida')).guardado.borrador.notas.texto, 'Recién escrito');
});

// ─── 6. Si el almacén falla ─────────────────────────────────────────────────────────────────────

test('6 · una lectura que no responde es «sin leer», no «no hay nada», y no lanza', async () => {
  const t = telefono();
  await escribirYGuardar(t, guardado());
  t.plano.fallarLectura = true;
  assert.deepEqual(await t.borradores.leer('cuenta-a', 'sol-1'), { tipo: 'sin-leer' });
  t.plano.fallarLectura = false;
  assert.equal((await t.borradores.leer('cuenta-a', 'sol-1')).tipo, 'guardado', 'lo guardado sigue ahí');

  // El almacenamiento seguro caído también es «sin leer»: no se crea una clave nueva que dejaría ilegible lo guardado.
  const otro = telefono({ plano: t.plano, claves: t.claves });
  t.claves.fallar = true;
  assert.deepEqual(await otro.borradores.leer('cuenta-a', 'sol-1'), { tipo: 'sin-leer' });
  assert.equal(t.claves.guardadas, 1);
});

test('6 · una escritura que falla se informa y no lanza; la siguiente que funciona lo guarda', async () => {
  const t = telefono();
  t.plano.fallarEscritura = true;
  assert.equal(await escribirYGuardar(t, guardado()), false);
  t.plano.fallarEscritura = false;
  assert.equal(await escribirYGuardar(t, guardado({ borrador: conNotas('Otra vez') })), true);
  assert.equal((await t.borradores.leer('cuenta-a', 'sol-1')).guardado.borrador.notas.texto, 'Otra vez');
  t.claves.fallar = true;
  assert.equal(await escribirYGuardar(telefono({ plano: t.plano, claves: t.claves }), guardado({ formRequestId: 'sol-2' })), false, 'sin almacenamiento seguro tampoco lanza');
});

test('6 · borrar, borrar lo de la cuenta y limpiar con la bandeja no lanzan aunque el almacén falle', async () => {
  const t = telefono();
  await escribirYGuardar(t, guardado());
  t.plano.fallarBorrado = true;
  await t.borradores.borrar('cuenta-a', 'sol-1');
  await t.borradores.borrarDeLaCuenta('cuenta-a');
  await t.borradores.conservarSegunLaLista('cuenta-a', [], true);
  t.plano.fallarLectura = true;
  await t.borradores.borrarDeLaCuenta('cuenta-a');
  await t.borradores.conservarSegunLaLista('cuenta-a', [], true);
  // Lo que no se pudo borrar queda cifrado y de su cuenta; cuando el almacén vuelve, se borra.
  t.plano.fallarBorrado = false;
  t.plano.fallarLectura = false;
  await t.borradores.borrarDeLaCuenta('cuenta-a');
  assert.equal(t.plano.datos.size, 0);
});
