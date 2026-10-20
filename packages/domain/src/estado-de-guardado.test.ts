import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COPY_GUARDADO, estadoDeGuardado, type EntradaDeGuardado } from './estado-de-guardado';

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
