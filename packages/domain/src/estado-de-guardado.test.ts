import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COPY_GUARDADO, detalleDelFallo, estadoDeGuardado, motivoSinGuardarAhora, textoDelDetalleDelFallo, type EntradaDeGuardado } from './estado-de-guardado';

const base: EntradaDeGuardado = { guardando: false, sucio: false, puedeGuardar: true, fallo: false, conflicto: false, guardadoA: null };

test('estado de guardado: «Guardado» solo con la respuesta del servidor; con hora si la hubo en esta pantalla', () => {
  assert.deepEqual(estadoDeGuardado(base), { tipo: 'guardado', texto: COPY_GUARDADO.guardado });
  assert.deepEqual(estadoDeGuardado({ ...base, guardadoA: '14:32' }), { tipo: 'guardado', texto: 'Guardado a las 14:32' });
});

test('estado de guardado: lo que pasa ahora gana; después el fallo y el conflicto; después lo pendiente', () => {
  assert.equal(estadoDeGuardado({ ...base, guardando: true, sucio: true, fallo: true }).texto, COPY_GUARDADO.guardando);
  assert.deepEqual(estadoDeGuardado({ ...base, conflicto: true, fallo: true, sucio: true }), { tipo: 'fallo', texto: COPY_GUARDADO.conflictoCorto });
  assert.deepEqual(estadoDeGuardado({ ...base, fallo: true, sucio: true }), { tipo: 'fallo', texto: COPY_GUARDADO.noSePudoReintento });
  assert.deepEqual(estadoDeGuardado({ ...base, fallo: true }), { tipo: 'fallo', texto: COPY_GUARDADO.noSePudo });
  assert.deepEqual(estadoDeGuardado({ ...base, sucio: true }), { tipo: 'pendiente', texto: COPY_GUARDADO.pendiente });
  assert.deepEqual(estadoDeGuardado({ ...base, sucio: true, puedeGuardar: false }), { tipo: 'pendiente', texto: COPY_GUARDADO.pendienteIncompleto });
});

// ── ED-03 · El estado de guardado, inequívoco, y el error recuperable (WP-EDITORES-PROFESIONAL; TEST-EDP-004) ──────
test('TEST-EDP-004 · el fallo sin respuesta nombra «Guardar ahora», nunca «Guardar cambios» (DJ-6)', () => {
  assert.equal(COPY_GUARDADO.noSePudoReintento, 'No se pudo guardar: se reintenta al seguir editando o con «Guardar ahora»');
  assert.equal(COPY_GUARDADO.guardarAhora, 'Guardar ahora');
  for (const texto of Object.values(COPY_GUARDADO)) {
    if (typeof texto === 'string') assert.doesNotMatch(texto, /Guardar cambios/, texto);
  }
});

test('TEST-EDP-004 · «Guardado» nunca aparece con un fallo, un conflicto o mientras se guarda', () => {
  for (const e of [
    { ...base, fallo: true },
    { ...base, fallo: true, sucio: true },
    { ...base, conflicto: true },
    { ...base, guardando: true, guardadoA: '10:44' },
    { ...base, fallo: true, guardadoA: '10:44' },
  ]) {
    assert.doesNotMatch(estadoDeGuardado(e).texto, /^Guardado/, JSON.stringify(e));
  }
  // Después de recargar, «Guardado» sin hora (DJ-10).
  assert.equal(estadoDeGuardado(base).texto, 'Guardado');
});

test('TEST-EDP-004 · el detalle técnico: la operación, el motivo, el código y la hora, sin datos de la persona', () => {
  const sinRed = detalleDelFallo({ ok: false, tipo: 'RED' }, '10:44');
  assert.deepEqual(sinRed, { motivo: 'SIN_RESPUESTA', codigo: null, hora: '10:44' });
  assert.equal(textoDelDetalleDelFallo(sinRed), 'guardar el borrador · sin respuesta · 10:44 · sin datos de la persona');
  const grande = detalleDelFallo({ ok: false, tipo: 'API', status: 400, codigo: 'INVALID_REQUEST', issues: [{ code: 'TOO_BIG', path: '(body)' }] }, '10:45');
  assert.equal(textoDelDetalleDelFallo(grande), 'guardar el borrador · demasiado grande · 400 INVALID_REQUEST · 10:45 · sin datos de la persona');
  const caido = detalleDelFallo({ ok: false, tipo: 'API', status: 503, codigo: 'DB_UNAVAILABLE', issues: [] }, '10:46');
  assert.equal(caido.motivo, 'SIN_RESPUESTA');
  assert.equal(caido.codigo, '503 DB_UNAVAILABLE');
  // Lo que se mandó y los problemas con su lugar no van al detalle: solo el código de la respuesta.
  const conProblemas = detalleDelFallo({ ok: false, tipo: 'API', status: 422, codigo: 'TRAINING_PLAN_STRUCTURE_INVALID', issues: [{ code: 'DUPLICATE_NODE_ID', path: 'blocks[0].label' }] }, '10:47');
  assert.doesNotMatch(textoDelDetalleDelFallo(conProblemas), /blocks|DUPLICATE/);
});

test('TEST-EDP-004 · «Guardar ahora» está apagado, con su motivo, cuando no hay nada que guardar', () => {
  assert.equal(motivoSinGuardarAhora({ guardando: false, sucio: false, conflicto: false }), COPY_GUARDADO.nadaQueGuardar);
  assert.equal(motivoSinGuardarAhora({ guardando: true, sucio: true, conflicto: false }), COPY_GUARDADO.yaSeEstaGuardando);
  assert.equal(motivoSinGuardarAhora({ guardando: false, sucio: true, conflicto: true }), COPY_GUARDADO.primeroLaVersionGuardada);
  // Con cambios, se puede tocar (también con algo a medio escribir: tocarlo lista lo que falta).
  assert.equal(motivoSinGuardarAhora({ guardando: false, sucio: true, conflicto: false }), null);
});
