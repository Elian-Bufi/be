/**
 * WP-04 — pruebas aisladas del patrón de versionado de B-06 (06 §4; docs/paquetes/WP-04.md T1). Se prueba antes de
 * cualquier vertical, porque nutrición, entrenamiento y antropometría lo reusan.
 * - TEST-DOM-002: la corrección no sobrescribe el original.
 * - TEST-DOM-009: la nueva versión sucede, no reescribe.
 * - REG-06-16: la vista efectiva sale de la relación, nunca de la fecha ni del orden de registro.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluarNuevaCorreccion,
  evaluarSucesion,
  resolverCadena,
  resolverVersionTerminal,
  resolverVistaEfectiva,
  serializacionCanonica,
  type RelacionDeCorreccion,
  type RelacionDeVersion,
} from './versionado';

// ─── Cadena lineal ───────────────────────────────────────────────────────────────────────────────

test('REG-06-15 · una cadena vacía no tiene terminal', () => {
  assert.deepEqual(resolverCadena([]), { tipo: 'VACIA' });
});

test('REG-06-15 · la cadena se recorre del primer eslabón a la terminal, sin importar el orden del arreglo', () => {
  const r = resolverCadena([
    { id: 'c3', previoId: 'c2' },
    { id: 'c1', previoId: null },
    { id: 'c2', previoId: 'c1' },
  ]);
  assert.deepEqual(r, { tipo: 'TERMINAL', terminalId: 'c3', orden: ['c1', 'c2', 'c3'] });
});

test('REG-06-16 inc. 3 · dos eslabones con el mismo previo son una ramificación', () => {
  const r = resolverCadena([
    { id: 'c1', previoId: null },
    { id: 'c2', previoId: 'c1' },
    { id: 'c2b', previoId: 'c1' },
  ]);
  assert.deepEqual(r, { tipo: 'NO_RESOLUBLE', motivo: 'RAMIFICACION' });
});

test('REG-06-16 inc. 3 · dos primeros eslabones son una ramificación', () => {
  const r = resolverCadena([
    { id: 'c1', previoId: null },
    { id: 'c1b', previoId: null },
  ]);
  assert.deepEqual(r, { tipo: 'NO_RESOLUBLE', motivo: 'RAMIFICACION' });
});

test('REG-06-15 · sin ciclos: un ciclo cerrado es no resoluble', () => {
  assert.deepEqual(
    resolverCadena([
      { id: 'a', previoId: 'b' },
      { id: 'b', previoId: 'a' },
    ]),
    { tipo: 'NO_RESOLUBLE', motivo: 'CICLO' },
  );
  assert.deepEqual(resolverCadena([{ id: 'a', previoId: 'a' }]), { tipo: 'NO_RESOLUBLE', motivo: 'CICLO' });
});

test('REG-06-15 · un ciclo aparte, no alcanzable desde el primero, es no resoluble', () => {
  const r = resolverCadena([
    { id: 'c1', previoId: null },
    { id: 'x', previoId: 'y' },
    { id: 'y', previoId: 'x' },
  ]);
  assert.deepEqual(r, { tipo: 'NO_RESOLUBLE', motivo: 'CICLO' });
});

test('REG-06-16 inc. 3 · un previo que no existe es una relación incompleta', () => {
  assert.deepEqual(resolverCadena([{ id: 'c2', previoId: 'fantasma' }]), { tipo: 'NO_RESOLUBLE', motivo: 'RELACION_INCOMPLETA' });
});

test('un id repetido es una relación incompleta', () => {
  assert.deepEqual(
    resolverCadena([
      { id: 'c1', previoId: null },
      { id: 'c1', previoId: null },
    ]),
    { tipo: 'NO_RESOLUBLE', motivo: 'RELACION_INCOMPLETA' },
  );
});

// ─── Corrección trazable y vista efectiva ────────────────────────────────────────────────────────

const ORIGINAL = 'ingesta-1';
const corr = (id: string, previa: string | null, original = ORIGINAL): RelacionDeCorreccion => ({ id, originalId: original, correccionPreviaId: previa });

test('REG-06-16 inc. 1 · sin corrección, rige el original', () => {
  assert.deepEqual(resolverVistaEfectiva(ORIGINAL, []), { tipo: 'ORIGINAL', id: ORIGINAL });
});

test('REG-06-16 inc. 2 · con cadena válida rige la terminal, y la cadena conserva todo (TEST-DOM-002)', () => {
  const v = resolverVistaEfectiva(ORIGINAL, [corr('k2', 'k1'), corr('k1', null)]);
  assert.deepEqual(v, { tipo: 'CORREGIDA', id: 'k2', cadena: ['k1', 'k2'] });
});

test('REG-06-16 · la vista no depende del orden de registro: una corrección «más nueva» por posición no gana', () => {
  // Mismo conjunto en otro orden: la terminal es la misma, porque sale de la relación.
  const a = resolverVistaEfectiva(ORIGINAL, [corr('k1', null), corr('k2', 'k1'), corr('k3', 'k2')]);
  const b = resolverVistaEfectiva(ORIGINAL, [corr('k3', 'k2'), corr('k1', null), corr('k2', 'k1')]);
  assert.deepEqual(a, b);
  assert.equal(a.tipo === 'CORREGIDA' && a.id, 'k3');
});

test('REG-06-15 · todas las correcciones apuntan al mismo original raíz', () => {
  const v = resolverVistaEfectiva(ORIGINAL, [corr('k1', null), corr('k2', 'k1', 'otro-original')]);
  assert.deepEqual(v, { tipo: 'NO_RESOLUBLE', motivo: 'RELACION_INCOMPLETA' });
});

test('REG-06-16 inc. 3 · con ramas, nadie elige por fecha: la vista es no resoluble', () => {
  const v = resolverVistaEfectiva(ORIGINAL, [corr('k1', null), corr('k2', 'k1'), corr('k2b', 'k1')]);
  assert.deepEqual(v, { tipo: 'NO_RESOLUBLE', motivo: 'RAMIFICACION' });
});

test('REG-06-14/15 · la primera corrección apunta al original y no tiene previa', () => {
  assert.deepEqual(evaluarNuevaCorreccion(ORIGINAL, [], { originalId: ORIGINAL, correccionPreviaId: null }), { valida: true, correccionPreviaId: null });
  assert.deepEqual(evaluarNuevaCorreccion(ORIGINAL, [], { originalId: ORIGINAL, correccionPreviaId: 'k1' }), {
    valida: false,
    motivo: 'NO_SUCEDE_A_LA_TERMINAL',
  });
});

test('REG-06-15 · cada corrección sucesiva apunta a la inmediata anterior; si otra entró en el medio, se rechaza', () => {
  const existentes = [corr('k1', null), corr('k2', 'k1')];
  assert.deepEqual(evaluarNuevaCorreccion(ORIGINAL, existentes, { originalId: ORIGINAL, correccionPreviaId: 'k2' }), {
    valida: true,
    correccionPreviaId: 'k2',
  });
  // Quien leyó antes de k2 propone suceder a k1: sería una rama. Se rechaza.
  assert.deepEqual(evaluarNuevaCorreccion(ORIGINAL, existentes, { originalId: ORIGINAL, correccionPreviaId: 'k1' }), {
    valida: false,
    motivo: 'NO_SUCEDE_A_LA_TERMINAL',
  });
});

test('REG-06-14 · no se corrige otro original ni sobre una historia no resoluble', () => {
  assert.deepEqual(evaluarNuevaCorreccion(ORIGINAL, [], { originalId: 'otro', correccionPreviaId: null }), { valida: false, motivo: 'ORIGINAL_DISTINTO' });
  const rota = [corr('k1', null), corr('k1b', null)];
  assert.deepEqual(evaluarNuevaCorreccion(ORIGINAL, rota, { originalId: ORIGINAL, correccionPreviaId: 'k1' }), {
    valida: false,
    motivo: 'CADENA_NO_RESOLUBLE',
  });
});

// ─── Sucesión de versiones ──────────────────────────────────────────────────────────────────────

const ver = (id: string, predecesora: string | null, objeto = 'plan-1'): RelacionDeVersion => ({ id, objetoId: objeto, predecesoraId: predecesora });

test('REG-06-12 · la primera versión no tiene predecesora; si ya hay versiones, la nueva tiene que declararla', () => {
  assert.deepEqual(evaluarSucesion([], { objetoId: 'plan-1', predecesoraId: null }), { valida: true });
  assert.deepEqual(evaluarSucesion([ver('v1', null)], { objetoId: 'plan-1', predecesoraId: null }), { valida: false, motivo: 'PRIMERA_YA_EXISTE' });
});

test('TEST-DOM-009 · la nueva versión sucede a la anterior sin modificarla', () => {
  const existentes = [ver('v1', null)];
  const copia = structuredClone(existentes);
  assert.deepEqual(evaluarSucesion(existentes, { objetoId: 'plan-1', predecesoraId: 'v1' }), { valida: true });
  assert.deepEqual(existentes, copia, 'evaluar no toca las versiones existentes');
});

test('REG-06-12 · misma entidad: una predecesora de otro objeto, o inexistente, no se admite', () => {
  const existentes = [ver('v1', null), ver('w1', null, 'plan-2')];
  assert.deepEqual(evaluarSucesion(existentes, { objetoId: 'plan-1', predecesoraId: 'w1' }), { valida: false, motivo: 'OBJETO_DISTINTO' });
  assert.deepEqual(evaluarSucesion(existentes, { objetoId: 'plan-1', predecesoraId: 'v9' }), { valida: false, motivo: 'PREDECESORA_INEXISTENTE' });
});

test('REG-06-12 · sin regla de ramas, una segunda sucesora de la misma versión es bifurcación', () => {
  const existentes = [ver('v1', null), ver('v2', 'v1')];
  assert.deepEqual(evaluarSucesion(existentes, { objetoId: 'plan-1', predecesoraId: 'v1' }), { valida: false, motivo: 'BIFURCACION' });
});

test('INV-06-107 · la versión terminal sale de la sucesión, no del orden ni de la fecha', () => {
  const r = resolverVersionTerminal([ver('v3', 'v2'), ver('v1', null), ver('v2', 'v1')]);
  assert.deepEqual(r, { tipo: 'TERMINAL', terminalId: 'v3', orden: ['v1', 'v2', 'v3'] });
});

// ─── Instantánea ─────────────────────────────────────────────────────────────────────────────────

test('INV-06-13 · la serialización canónica no depende del orden de las claves', () => {
  const a = serializacionCanonica({ b: 1, a: { d: [3, 2], c: 'x' } });
  const b = serializacionCanonica({ a: { c: 'x', d: [3, 2] }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":"x","d":[3,2]},"b":1}');
});

test('INV-06-13 · el orden de los arreglos sí es contenido: cambiarlo cambia la serialización', () => {
  assert.notEqual(serializacionCanonica({ comidas: ['desayuno', 'almuerzo'] }), serializacionCanonica({ comidas: ['almuerzo', 'desayuno'] }));
});

test('la serialización canónica rechaza lo que no es JSON reproducible, en vez de perderlo', () => {
  assert.throws(() => serializacionCanonica({ a: undefined }), TypeError);
  assert.throws(() => serializacionCanonica({ a: Number.NaN }), TypeError);
  assert.throws(() => serializacionCanonica({ a: Infinity }), TypeError);
  assert.throws(() => serializacionCanonica({ a: () => 1 }), TypeError);
});
