/**
 * El nombre visible del perfil propio (DL-009, opción B, y DL-040, decididas por Dirección el 2026-10-15): cómo se
 * normaliza, qué se puede guardar, la referencia neutral y la forma del contrato.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EditarPerfilPropioRequestSchema,
  LARGO_MAXIMO_DEL_NOMBRE_VISIBLE,
  nombreVisibleValido,
  normalizarNombreVisible,
  PerfilPropioResponseSchema,
  referenciaCorta,
  referenciaNeutral,
} from './contratos-perfil-propio';

test('el nombre se guarda sin espacios de más, en NFC', () => {
  assert.equal(normalizarNombreVisible('  Martina    Gómez \n'), 'Martina Gómez');
  // «é» escrita como «e» más el acento combinado se guarda como un solo carácter.
  assert.equal(normalizarNombreVisible('José'), 'José');
});

test('se puede guardar de 1 a 60 caracteres, sin caracteres de control ni invisibles', () => {
  assert.equal(nombreVisibleValido(' Lucía  Fernández '), 'Lucía Fernández');
  assert.equal(nombreVisibleValido("María José O'Neill-Paz"), "María José O'Neill-Paz");
  assert.equal(nombreVisibleValido('ñ'.repeat(LARGO_MAXIMO_DEL_NOMBRE_VISIBLE)), 'ñ'.repeat(60));
  for (const malo of ['', '   ', 'x'.repeat(61), 'Ana\u0007Paz', 'Ana​Paz', 'Ana‮Paz', 'Ana']) {
    assert.equal(nombreVisibleValido(malo), null, JSON.stringify(malo));
  }
  // Un emoji cuenta como un carácter, como en la base (char_length).
  assert.equal(nombreVisibleValido(`${'a'.repeat(59)}😀`), `${'a'.repeat(59)}😀`);
});

test('la referencia neutral son los últimos seis caracteres del identificador, sin guiones', () => {
  const id = '83fcf0fb-e06e-4d1f-8201-78a72ab67857';
  assert.equal(referenciaCorta(id), 'b67857');
  assert.equal(referenciaNeutral(id), 'Asesorado · b67857');
});

test('el contrato: solo el nombre en los cambios, y la versión «vN»', () => {
  assert.equal(EditarPerfilPropioRequestSchema.safeParse({ expectedVersion: 'v0', changes: { displayName: 'Ana' } }).success, true);
  assert.equal(EditarPerfilPropioRequestSchema.safeParse({ expectedVersion: 'v3', changes: { displayName: null } }).success, true);
  for (const malo of [
    { expectedVersion: '0', changes: { displayName: 'Ana' } },
    { expectedVersion: 'v1', changes: {} },
    { expectedVersion: 'v1', changes: { displayName: 'Ana', email: 'ana@example.invalid' } },
    { expectedVersion: 'v1', changes: { displayName: 'Ana' }, height: 170 },
  ]) {
    assert.equal(EditarPerfilPropioRequestSchema.safeParse(malo).success, false, JSON.stringify(malo));
  }
  assert.equal(PerfilPropioResponseSchema.safeParse({ data: { displayName: null, version: 'v0', updatedAt: null } }).success, true);
  assert.equal(PerfilPropioResponseSchema.safeParse({ data: { displayName: 'Ana', version: 'v1', updatedAt: '2026-10-15T18:00:00.000Z', email: 'x' } }).success, false);
});
