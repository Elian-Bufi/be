/**
 * El nombre visible del perfil propio (DL-009, opción B, y DL-040, decididas por Dirección el 2026-10-15): cómo se
 * normaliza, qué se puede guardar, la referencia neutral y la forma del contrato.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  conocePasos,
  EditarPerfilPropioRequestSchema,
  ISSUE_DEL_NOMBRE,
  LARGO_MAXIMO_DEL_NOMBRE_VISIBLE,
  LoQueFaltaParaSeguirResponseSchema,
  nombreVisibleValido,
  normalizarNombreVisible,
  PASOS_PARA_SEGUIR,
  PerfilPropioResponseSchema,
  problemaDelNombre,
  referenciaCorta,
  referenciaNeutral,
} from './contratos-perfil-propio';
import { MENSAJE_DE_CAMPO } from './copy';
import { OPERACIONES } from './openapi';

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

// ─── DL-169 (WP-USO-FINAL, UF-01): el nombre obligatorio ────────────────────────────────────────────

test('TEST-UF-001 a 004 · el problema del nombre: falta (no vino, null o vacío), inválido (largo o invisible) o ninguno', () => {
  for (const falta of [undefined, null, '', '   ', '\n\t']) assert.equal(problemaDelNombre(falta), 'FALTA', JSON.stringify(falta));
  for (const invalido of ['a'.repeat(LARGO_MAXIMO_DEL_NOMBRE_VISIBLE + 1), 'Ana​Paz', 'Ana\u0007']) assert.equal(problemaDelNombre(invalido), 'INVALIDO', JSON.stringify(invalido));
  for (const bueno of ['Ana', ' Martina   Gómez ', "María José O'Neill-Paz", 'ñ'.repeat(LARGO_MAXIMO_DEL_NOMBRE_VISIBLE)]) assert.equal(problemaDelNombre(bueno), null, bueno);
  // Los códigos de la API son las claves de los mensajes de campo: el website y la APK los muestran sin traducir nada.
  assert.deepEqual(ISSUE_DEL_NOMBRE, { REQUERIDO: 'DISPLAY_NAME_REQUIRED', INVALIDO: 'INVALID_DISPLAY_NAME' });
  for (const codigo of Object.values(ISSUE_DEL_NOMBRE)) assert.ok(MENSAJE_DE_CAMPO[codigo], codigo);
});

test('TEST-UF-005 · API-ACC-07: lo que falta para seguir, con su paso como texto y su propuesta; vacío, la cuenta sigue', () => {
  assert.deepEqual([...PASOS_PARA_SEGUIR], ['DISPLAY_NAME']);
  assert.ok(LoQueFaltaParaSeguirResponseSchema.safeParse({ data: { steps: [] } }).success);
  assert.ok(LoQueFaltaParaSeguirResponseSchema.safeParse({ data: { steps: [{ step: 'DISPLAY_NAME', suggestion: 'Lic. Sofía Paz' }] } }).success);
  assert.ok(LoQueFaltaParaSeguirResponseSchema.safeParse({ data: { steps: [{ step: 'DISPLAY_NAME', suggestion: null }] } }).success);
  // Un paso nuevo (UF-05, UF-13) se lee igual: el cliente que no lo conoce pide actualizar la app.
  const conPasoNuevo = LoQueFaltaParaSeguirResponseSchema.parse({ data: { steps: [{ step: 'TERMS_VERSION', suggestion: null }] } });
  assert.equal(conocePasos(conPasoNuevo.data.steps), false);
  assert.equal(conocePasos([{ step: 'DISPLAY_NAME', suggestion: null }]), true);
  assert.equal(conocePasos([]), true);
  assert.equal(LoQueFaltaParaSeguirResponseSchema.safeParse({ data: { steps: [{ step: 'DISPLAY_NAME' }] } }).success, false, 'la propuesta viene siempre');
  assert.equal(LoQueFaltaParaSeguirResponseSchema.safeParse({ data: { steps: [], extra: 1 } }).success, false, 'estricto');
  const op = OPERACIONES.find((o) => o.id === 'API-ACC-07');
  assert.ok(op, 'API-ACC-07 está en el contrato');
  assert.deepEqual([op.metodo, op.ruta, op.autenticacion, op.idempotencia], ['get', '/me/pending-steps', 'SESSION', false]);
  assert.match(op.fuente, /DL-169/);
});

test('TEST-UF-004 · API-ACC-06: el schema admite null para que la API responda el 422 preciso; el contrato dice que no se quita', () => {
  assert.equal(EditarPerfilPropioRequestSchema.safeParse({ expectedVersion: 'v1', changes: { displayName: null } }).success, true);
  const op = OPERACIONES.find((o) => o.id === 'API-ACC-06')!;
  assert.match(op.resumen, /no se quita/);
  assert.ok(op.errores[422]?.includes('INVALID_PROFILE_DATA'));
});
