/**
 * ED-61 · Sin conflicto falso por una respuesta perdida (WP-EDITORES-PROFESIONAL; TEST-EDP-048).
 *
 * Un guardado llega al servidor y pierde la respuesta; el profesional sigue escribiendo y el guardado siguiente da 409.
 * El editor relee la versión y la compara, sin los identificadores que puso el servidor, con cada cuerpo que mandó sin
 * respuesta: si coincide con uno, adopta la versión (su token y los identificadores nuevos) y vuelve a mandar lo escrito
 * después; si no, es un conflicto real (DL-148).
 *
 * Uso: npm run test -w @be/web.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const { IDENTIFICADORES_DEL_SERVIDOR, conLosIdentificadoresNuevos, cualMande, huellaDelGuardado } = await import('../src/app/pro/advisees/es-lo-que-mande.ts');

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/advisees/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── Entrenamiento: lo que mandó la pantalla (una sesión nueva, sin identificador) y lo que quedó en el servidor ──
const mandadoEntrenamiento = {
  estructura: [
    {
      blockId: 'b1',
      label: 'Fuerza',
      purpose: null,
      sessions: [
        { sessionId: 's1', label: 'Piernas A', instructions: null, prescriptions: [{ prescriptionId: 'p1', exerciseVersionId: 'ev-sentadilla', sets: [{ repetitions: { min: 6, max: 8 } }], intensity: null }] },
        { label: 'Tren superior liviano', instructions: null, prescriptions: [{ exerciseVersionId: 'ev-press', sets: [{ repetitions: null }], intensity: null }] },
      ],
    },
  ],
  proximaRevision: null,
  agenda: { startDate: '2026-11-16', sessions: [{ sessionId: 's1', weekdays: ['MONDAY'] }], moves: [] },
  objetivo: 'obj-1',
};
// El servidor completa lo vacío (notas, cargas, listas) y pone identificadores a lo nuevo.
const guardadoEntrenamiento = {
  estructura: [
    {
      blockId: 'b1',
      label: 'Fuerza',
      purpose: null,
      microcycles: [],
      sessions: [
        {
          sessionId: 's1',
          label: 'Piernas A',
          instructions: null,
          prescriptions: [{ prescriptionId: 'p1', exerciseVersionId: 'ev-sentadilla', sets: [{ repetitions: { min: 6, max: 8 }, note: null }], intensity: null, suggestedLoad: null, professionalParameters: [], note: null }],
        },
        {
          sessionId: 's2-nueva',
          label: 'Tren superior liviano',
          instructions: null,
          prescriptions: [{ prescriptionId: 'p2-nueva', exerciseVersionId: 'ev-press', sets: [{ repetitions: null, note: null }], intensity: null, suggestedLoad: null, professionalParameters: [], note: null }],
        },
      ],
    },
  ],
  proximaRevision: null,
  agenda: { startDate: '2026-11-16', sessions: [{ sessionId: 's1', weekdays: ['MONDAY'] }], moves: [] },
  objetivo: 'obj-1',
};

test('TEST-EDP-048 · lo guardado es lo que mandó esta pantalla: coincide sin los identificadores del servidor', () => {
  // Lo que se mandó antes sin respuesta es el segundo de la lista.
  const otro = { ...mandadoEntrenamiento, proximaRevision: '2026-12-01' };
  assert.equal(cualMande(guardadoEntrenamiento, [otro, mandadoEntrenamiento]), 1);
  assert.equal(huellaDelGuardado(guardadoEntrenamiento), huellaDelGuardado(mandadoEntrenamiento));
  // Los identificadores que pone el servidor son los de cada parte del plan, nada más.
  assert.deepEqual([...IDENTIFICADORES_DEL_SERVIDOR].sort(), ['blockId', 'dayTypeId', 'itemId', 'mealId', 'microcycleId', 'optionId', 'prescriptionId', 'sessionId']);
});

test('TEST-EDP-048 · otra pestaña cambió el borrador: no coincide y es un conflicto real', () => {
  const cambiado = structuredClone(guardadoEntrenamiento);
  cambiado.estructura[0].sessions[1].label = 'Tren superior (otra pestaña)';
  assert.equal(cualMande(cambiado, [mandadoEntrenamiento]), -1);
  // Otra fecha de revisión, otro objetivo o una agenda distinta también son de otro.
  assert.equal(cualMande({ ...guardadoEntrenamiento, proximaRevision: '2026-12-01' }, [mandadoEntrenamiento]), -1);
  assert.equal(cualMande({ ...guardadoEntrenamiento, objetivo: 'obj-2' }, [mandadoEntrenamiento]), -1);
  // La agenda se compara con sus identificadores: mover los días de una sesión a otra es un cambio de otro.
  const otraAgenda = { ...guardadoEntrenamiento, agenda: { startDate: '2026-11-16', sessions: [{ sessionId: 's2-nueva', weekdays: ['MONDAY'] }], moves: [] } };
  assert.equal(cualMande(otraAgenda, [mandadoEntrenamiento]), -1);
  // Sin cuerpos sin respuesta, nunca se toma lo guardado por propio.
  assert.equal(cualMande(guardadoEntrenamiento, []), -1);
});

test('TEST-EDP-048 · adoptar: los identificadores nuevos van a lo que ya existía, y lo escrito después se conserva', () => {
  // Después del envío perdido, el profesional agregó otra sesión al final.
  const enPantalla = structuredClone(mandadoEntrenamiento.estructura);
  enPantalla[0].sessions.push({ label: 'Movilidad', instructions: null, prescriptions: [] });
  const resultado = conLosIdentificadoresNuevos(enPantalla, mandadoEntrenamiento.estructura, guardadoEntrenamiento.estructura);
  // Lo escrito después sigue.
  assert.equal(resultado[0].sessions[2].label, 'Movilidad');
  // Lo que ya existía tiene los identificadores del servidor; lo nuevo, ninguno (lo crea el guardado siguiente).
  assert.equal(resultado[0].sessions[1].sessionId, 's2-nueva');
  assert.equal(resultado[0].sessions[1].prescriptions[0].prescriptionId, 'p2-nueva');
  assert.equal(resultado[0].sessions[2].sessionId, undefined);
  // Lo que ya tenía identificador no cambia, y lo de pantalla no se toca (se devuelve una copia).
  assert.equal(resultado[0].sessions[0].sessionId, 's1');
  assert.equal(enPantalla[0].sessions[1].sessionId, undefined);
});

test('TEST-EDP-048 · EDT-03: una parte que cambió después del envío no recibe el identificador; el guardado siguiente la crea de nuevo', () => {
  // El profesional cambió el nombre de la sesión nueva después del envío perdido: ya no es lo que se mandó.
  const enPantalla = structuredClone(mandadoEntrenamiento.estructura);
  enPantalla[0].sessions[1].label = 'Tren superior liviano · cambiado después';
  const resultado = conLosIdentificadoresNuevos(enPantalla, mandadoEntrenamiento.estructura, guardadoEntrenamiento.estructura);
  // Lo escrito después sigue, sin identificador (ni ella ni sus partes): se guarda como nueva, con lo que está en pantalla.
  assert.equal(resultado[0].sessions[1].label, 'Tren superior liviano · cambiado después');
  assert.equal(resultado[0].sessions[1].sessionId, undefined);
  assert.equal(resultado[0].sessions[1].prescriptions[0].prescriptionId, undefined);
  assert.equal(resultado[0].sessions[0].sessionId, 's1');
});

test('TEST-EDP-048 · EDT-03: nunca se asigna un identificador a otra parte (una nueva arriba, o una que se borró)', () => {
  // Revisión adversaria de la etapa 1: con el injerto por posición, N2 se quedaba con el identificador de N1.
  const sesion = (label, sessionId) => ({ ...(sessionId ? { sessionId } : {}), label, instructions: null, prescriptions: [] });
  const bloque = (sessions) => [{ blockId: 'b1', label: 'Fuerza', purpose: null, sessions }];
  const cuales = (r) => r[0].sessions.map((s) => [s.label, s.sessionId ?? null]);
  // Lo mandado era [S1, N1 nueva] y lo guardado [S1, N1 (x)]. Después del envío, el profesional sube una N2 nueva arriba de N1.
  const arriba = conLosIdentificadoresNuevos(bloque([sesion('S1', 's1'), sesion('N2'), sesion('N1')]), bloque([sesion('S1', 's1'), sesion('N1')]), bloque([sesion('S1', 's1'), sesion('N1', 'x')]));
  assert.deepEqual(cuales(arriba), [
    ['S1', 's1'],
    ['N2', null],
    ['N1', 'x'],
  ]);
  // Lo mandado era [N1, N2], las dos nuevas, y lo guardado [N1 (x), N2 (y)]. Después, borra N1: N2 se queda con el suyo.
  const borrada = conLosIdentificadoresNuevos(bloque([sesion('N2')]), bloque([sesion('N1'), sesion('N2')]), bloque([sesion('N1', 'x'), sesion('N2', 'y')]));
  assert.deepEqual(cuales(borrada), [['N2', 'y']]);
  // Y si las mueve, cada una sigue con el suyo.
  const movidas = conLosIdentificadoresNuevos(bloque([sesion('N2'), sesion('N1')]), bloque([sesion('N1'), sesion('N2')]), bloque([sesion('N1', 'x'), sesion('N2', 'y')]));
  assert.deepEqual(cuales(movidas), [
    ['N2', 'y'],
    ['N1', 'x'],
  ]);
  // Una sesión que ya existía se busca por su identificador: si se movió, su ejercicio nuevo igual recibe el suyo.
  const ejercicio = (prescriptionId) => ({ ...(prescriptionId ? { prescriptionId } : {}), exerciseVersionId: 'ev-press', sets: [{ repetitions: null }], intensity: null });
  const conEjercicio = (label, sessionId, prescriptionId) => ({ ...sesion(label, sessionId), prescriptions: [ejercicio(prescriptionId)] });
  const movida = conLosIdentificadoresNuevos(
    bloque([sesion('S2', 's2'), conEjercicio('S1', 's1')]),
    bloque([conEjercicio('S1', 's1'), sesion('S2', 's2')]),
    bloque([conEjercicio('S1', 's1', 'p9'), sesion('S2', 's2')]),
  );
  assert.equal(movida[0].sessions[1].prescriptions[0].prescriptionId, 'p9');
  assert.deepEqual(movida[0].sessions[0].prescriptions, []);
});

test('TEST-EDP-048 · adoptar nunca repite un identificador ni pisa uno que ya estaba', () => {
  // El profesional movió la sesión nueva al principio después del envío: en esa posición ahora hay una que ya tenía el suyo.
  const enPantalla = structuredClone(mandadoEntrenamiento.estructura);
  enPantalla[0].sessions.reverse();
  const resultado = conLosIdentificadoresNuevos(enPantalla, mandadoEntrenamiento.estructura, guardadoEntrenamiento.estructura);
  const ids = JSON.stringify(resultado).match(/"(sessionId|prescriptionId)":"[^"]+"/g);
  assert.equal(new Set(ids).size, ids.length, `sin repetidos: ${ids}`);
  // La que ya tenía identificador lo conserva.
  assert.equal(resultado[0].sessions[1].sessionId, 's1');
});

test('TEST-EDP-048 · Nutrición: los días tipo, las comidas, las opciones y los ítems, igual', () => {
  const mandado = {
    estructura: [{ dayTypeId: 'd1', label: 'Día habitual', meals: [{ label: 'Merienda', prescriptionMode: 'COMPOSED_PLATE', options: [{ label: 'Opción 1', items: [{ catalogItemId: 'yogur', quantity: { value: 200, unit: 'g' }, preparationState: null, note: '' }] }] }] }],
    proximaRevision: '2026-11-20',
    objetivo: 'obj-n',
  };
  const guardado = {
    estructura: [{ dayTypeId: 'd1', label: 'Día habitual', meals: [{ mealId: 'm9', label: 'Merienda', prescriptionMode: 'COMPOSED_PLATE', options: [{ optionId: 'o9', label: 'Opción 1', items: [{ itemId: 'i9', catalogItemId: 'yogur', quantity: { value: 200, unit: 'g' }, preparationState: null, note: null }] }] }] }],
    proximaRevision: '2026-11-20',
    objetivo: 'obj-n',
  };
  assert.equal(cualMande(guardado, [mandado]), 0);
  const conIds = conLosIdentificadoresNuevos(mandado.estructura, mandado.estructura, guardado.estructura);
  assert.equal(conIds[0].meals[0].mealId, 'm9');
  assert.equal(conIds[0].meals[0].options[0].optionId, 'o9');
  assert.equal(conIds[0].meals[0].options[0].items[0].itemId, 'i9');
  // Otra cantidad es otro contenido.
  const otro = structuredClone(guardado);
  otro.estructura[0].meals[0].options[0].items[0].quantity.value = 250;
  assert.equal(cualMande(otro, [mandado]), -1);
});

test('TEST-EDP-048 · los dos editores guardan lo mandado sin respuesta y lo comparan ante un 409', () => {
  for (const archivo of ['training/editor.tsx', 'nutrition/editor.tsx']) {
    const fuente = leer(archivo);
    // Sin respuesta, se recuerda lo que se mandó.
    assert.match(fuente, /if \(motivo === 'SIN_RESPUESTA'\) sinRespuesta\.current = \[\.\.\.sinRespuesta\.current, cuerpo\];/, archivo);
    // Ante un 409, se relee solo si hubo algo sin respuesta, y se compara con cada cuerpo.
    assert.match(fuente, /const actual = mandados\.length > 0 && !reenvio \? await api\./, archivo);
    assert.match(fuente, /cualMande\(cuerpoGuardado\(actual\.datos\.data\), mandados\)/, archivo);
    // Lo escrito después se manda sobre la versión adoptada, con los identificadores nuevos.
    assert.match(fuente, /return guardar\(automatico, \{ base: guardada, (bloques|estructura): conLosIdentificadoresNuevos\(/, archivo);
    // Con una respuesta, o al leer el borrador, la lista se vacía.
    assert.ok((fuente.match(/sinRespuesta\.current = \[\];/g) ?? []).length >= 3, `${archivo}: la lista se vacía al guardar, al adoptar y al leer`);
    // Ya no se compara con el cuerpo que acaba de dar 409 ni con los identificadores incluidos.
    assert.doesNotMatch(fuente, /JSON\.stringify\(aEntrada\(actual\.datos\.data\)\) === JSON\.stringify/, archivo);
  }
});

test('TEST-EDP-048 · si la relectura que sigue al 409 tampoco responde, no es un conflicto: es un guardado sin respuesta', () => {
  // Revisión adversaria de la etapa 1: sin red o con un 5xx en la relectura, `cual` daba -1 y aparecía «cambió en otra
  // pestaña», con el autoguardado y «Guardar ahora» apagados. La única salida era «Cargar la versión guardada», que
  // pisaba lo escrito después del envío perdido.
  for (const archivo of ['training/editor.tsx', 'nutrition/editor.tsx']) {
    const fuente = leer(archivo);
    const desde = fuente.indexOf("if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {");
    const conflicto = fuente.indexOf('setConflicto(true);', desde);
    assert.ok(desde > 0 && conflicto > desde, `${archivo}: el caso del 409`);
    const caso = fuente.slice(desde, conflicto);
    // La sesión perdida y el acceso retirado se dicen como en cualquier guardado.
    assert.match(caso, /if \(actual && \(sesionPerdida\(actual\) \|\| accesoRetirado\(actual\)\)\) \{/, archivo);
    // Una relectura que no respondió va antes que el conflicto: queda el fallo sin respuesta, con su detalle, y la lista
    // de lo mandado no se vacía (el intento siguiente vuelve a dar 409 y a releer).
    const sinRelectura = caso.indexOf('if (actual && !actual.ok) {');
    assert.ok(sinRelectura > 0, `${archivo}: la relectura que no respondió tiene su camino, antes del conflicto`);
    const bloque = caso.slice(sinRelectura, caso.indexOf('return null;', sinRelectura));
    assert.match(bloque, /setFallo\(true\);/, archivo);
    assert.match(bloque, /setDetalle\(\{ \.\.\.detalleDelFallo\(actual, horaDelDia\(new Date\(\)\)\), motivo: 'SIN_RESPUESTA' \}\);/, archivo);
    assert.match(bloque, /autoguardado\.informar\('SIN_RESPUESTA'\);/, archivo);
    assert.doesNotMatch(bloque, /setConflicto|sinRespuesta\.current = \[\]/, archivo);
  }
});
