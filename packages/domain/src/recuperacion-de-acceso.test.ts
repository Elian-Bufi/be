/**
 * UF-03 de WP-USO-FINAL (DL-169; UF-D9; 04 RF-005): recuperar el acceso local, la parte del dominio de TEST-UF-007 y
 * TEST-UF-008. La garantía de punta a punta (la API, la base y el correo) está en
 * test/integration/recuperacion-de-acceso.int-spec.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OPERACIONES } from './openapi';
import {
  CompletarRecuperacionRequestSchema,
  COPY_RECUPERACION,
  codigoDeRecuperacionEnGrupos,
  EmitirRecuperacionAsistidaRequestSchema,
  estadoDelCodigoDeRecuperacion,
  normalizarCodigoDeRecuperacionDeAcceso,
  PedirRecuperacionRequestSchema,
  planDelPedidoDeRecuperacion,
  RecuperacionAsistidaResponseSchema,
  RecuperacionPedidaResponseSchema,
  respuestaDelPedidoDeRecuperacion,
  VIGENCIA_DEL_CODIGO_POR_CORREO_MS,
  type CuentaParaRecuperar,
} from './recuperacion-de-acceso';

const CON_CONTRASENA: CuentaParaRecuperar = { operativa: true, conContrasena: true, conGoogle: false };
const SOLO_GOOGLE: CuentaParaRecuperar = { operativa: true, conContrasena: false, conGoogle: true };
const CERRADA: CuentaParaRecuperar = { operativa: false, conContrasena: false, conGoogle: false };
const SUSPENDIDA: CuentaParaRecuperar = { operativa: false, conContrasena: true, conGoogle: false };

test('TEST-UF-007 · el pedido guarda un código solo para una cuenta operativa con contraseña; el correo sale solo con proveedor', () => {
  assert.deepEqual(planDelPedidoDeRecuperacion(CON_CONTRASENA, true), { guardar: true, correo: 'CODIGO', motivo: 'CODIGO_POR_CORREO' });
  assert.deepEqual(planDelPedidoDeRecuperacion(CON_CONTRASENA, false), { guardar: true, correo: null, motivo: 'PEDIDO_SIN_CORREO' }, 'sin proveedor, el pedido queda para el código de Administración');
  assert.deepEqual(planDelPedidoDeRecuperacion({ ...CON_CONTRASENA, conGoogle: true }, true), { guardar: true, correo: 'CODIGO', motivo: 'CODIGO_POR_CORREO' }, 'con los dos métodos, recupera la contraseña');
  assert.deepEqual(planDelPedidoDeRecuperacion(SOLO_GOOGLE, true), { guardar: false, correo: 'ENTRA_CON_GOOGLE', motivo: 'SIN_CONTRASENA' });
  assert.deepEqual(planDelPedidoDeRecuperacion(SOLO_GOOGLE, false), { guardar: false, correo: null, motivo: 'SIN_CONTRASENA' });
  for (const correoActivo of [true, false]) {
    assert.deepEqual(planDelPedidoDeRecuperacion(null, correoActivo), { guardar: false, correo: null, motivo: 'CUENTA_INEXISTENTE' });
    assert.deepEqual(planDelPedidoDeRecuperacion(CERRADA, correoActivo), { guardar: false, correo: null, motivo: 'CUENTA_NO_OPERATIVA' }, 'una cuenta cerrada no recibe nada');
    assert.deepEqual(planDelPedidoDeRecuperacion(SUSPENDIDA, correoActivo), { guardar: false, correo: null, motivo: 'CUENTA_NO_OPERATIVA' }, 'una suspendida tampoco');
  }
});

test('TEST-UF-007 · la respuesta no depende de la cuenta: el pedido, 30 minutos y la entrega, que es la del ambiente', () => {
  const momento = new Date('2026-11-12T15:00:00.000Z');
  const r = respuestaDelPedidoDeRecuperacion({ recoveryId: '00000000-0000-4000-8000-000000000a01', momento, correoActivo: true });
  assert.deepEqual(RecuperacionPedidaResponseSchema.parse(r), r);
  assert.deepEqual(Object.keys(r.data).sort(), ['delivery', 'expiresAt', 'recoveryId']);
  assert.equal(new Date(r.data.expiresAt).getTime() - momento.getTime(), VIGENCIA_DEL_CODIGO_POR_CORREO_MS);
  assert.equal(VIGENCIA_DEL_CODIGO_POR_CORREO_MS, 30 * 60 * 1000);
  assert.equal(r.data.delivery, 'EMAIL');
  assert.equal(respuestaDelPedidoDeRecuperacion({ recoveryId: 'x', momento, correoActivo: false }).data.delivery, 'ASSISTED');
  // La firma no recibe la cuenta: TypeScript no deja pasarla, y la función tiene un solo parámetro.
  assert.equal(respuestaDelPedidoDeRecuperacion.length, 1);
});

test('TEST-UF-007 · las formas: el pedido lleva solo el correo; completar, el código y la contraseña nueva; nada más', () => {
  assert.ok(PedirRecuperacionRequestSchema.safeParse({ identifier: 'persona@example.invalid' }).success);
  assert.equal(PedirRecuperacionRequestSchema.safeParse({ identifier: 'persona@example.invalid', extra: 1 }).success, false);
  assert.ok(CompletarRecuperacionRequestSchema.safeParse({ proof: 'ABCDE-FGHJK', newCredential: 'clave-sintetica-nueva' }).success);
  assert.equal(CompletarRecuperacionRequestSchema.safeParse({ proof: 'ABCDE-FGHJK' }).success, false);
  assert.ok(EmitirRecuperacionAsistidaRequestSchema.safeParse({ email: 'persona@example.invalid', rationale: 'Escribió desde su correo.' }).success);
  assert.ok(RecuperacionAsistidaResponseSchema.safeParse({ data: { identityId: 'x', code: 'ABCDE-FGHJK', expiresAt: '2026-11-13T15:00:00.000Z', sessionsRevoked: 2 } }).success);
  assert.equal(RecuperacionAsistidaResponseSchema.safeParse({ data: { identityId: 'x', code: 'abcde-fghjk', expiresAt: '2026-11-13T15:00:00.000Z', sessionsRevoked: 0 } }).success, false, 'el código sale normalizado');
});

test('TEST-UF-007 · los textos de la pantalla no dicen si la cuenta existe', () => {
  assert.match(COPY_RECUPERACION.pedidoPorCorreo, /^Si hay una cuenta/);
  assert.match(COPY_RECUPERACION.conGoogle, /Continuar con Google/);
  assert.match(COPY_RECUPERACION.mensaje.textoGoogle, /Continuar con Google/);
  assert.match(COPY_RECUPERACION.mensaje.texto('ABCDE-FGHJK'), /ABCDE-FGHJK/);
  assert.match(COPY_RECUPERACION.mensaje.texto('ABCDE-FGHJK'), /30 minutos/);
});

test('TEST-UF-008 · solo un código vigente vale: vencido, usado o anulado, no', () => {
  const ahora = new Date('2026-11-12T15:00:00.000Z');
  const vence = new Date('2026-11-12T15:30:00.000Z');
  assert.equal(estadoDelCodigoDeRecuperacion({ venceEn: vence, usadoEn: null, anuladoEn: null, ahora }), 'VIGENTE');
  assert.equal(estadoDelCodigoDeRecuperacion({ venceEn: vence, usadoEn: null, anuladoEn: null, ahora: vence }), 'VENCIDO', 'en el instante del vencimiento ya no vale');
  assert.equal(estadoDelCodigoDeRecuperacion({ venceEn: vence, usadoEn: null, anuladoEn: null, ahora: new Date('2026-11-13T00:00:00.000Z') }), 'VENCIDO');
  assert.equal(estadoDelCodigoDeRecuperacion({ venceEn: vence, usadoEn: ahora, anuladoEn: null, ahora }), 'USADO');
  assert.equal(estadoDelCodigoDeRecuperacion({ venceEn: vence, usadoEn: null, anuladoEn: ahora, ahora }), 'ANULADO');
});

test('TEST-UF-008 · la forma del código: diez caracteres del alfabeto, con guion o sin él, en minúsculas; otra cosa es null', () => {
  assert.equal(normalizarCodigoDeRecuperacionDeAcceso('ABCDE-FGHJK'), 'ABCDEFGHJK');
  assert.equal(normalizarCodigoDeRecuperacionDeAcceso(' abcde fghjk '), 'ABCDEFGHJK');
  assert.equal(normalizarCodigoDeRecuperacionDeAcceso('abcde-fghjk'), normalizarCodigoDeRecuperacionDeAcceso('ABCDEFGHJK'));
  assert.equal(normalizarCodigoDeRecuperacionDeAcceso('0OIL1-23456'), '00111-23456'.replace('-', ''), 'las letras dudosas se leen como el número que parecen');
  for (const raro of ['', 'ABCDE-FGHJ', 'ABCDE-FGHJKM', 'ABCDE-FGHJU', 'ÁBCDE-FGHJK', '12345678901']) {
    assert.equal(normalizarCodigoDeRecuperacionDeAcceso(raro), null, raro);
  }
  assert.equal(codigoDeRecuperacionEnGrupos('ABCDEFGHJK'), 'ABCDE-FGHJK');
});

test('TEST-UF-007 y TEST-UF-008 · el contrato: P1-01 es 202 público, P1-02 es 204 público y la asistida es de Administración, sin idempotencia', () => {
  const p1 = OPERACIONES.find((o) => o.id === 'API-ACC-P1-01');
  const p2 = OPERACIONES.find((o) => o.id === 'API-ACC-P1-02');
  const adm = OPERACIONES.find((o) => o.id === 'API-ADM-18');
  assert.ok(p1 && p2 && adm, 'las tres están en el contrato');
  assert.deepEqual([p1.metodo, p1.ruta, p1.autenticacion, p1.exitos.map((e) => e.status)], ['post', '/auth/recovery-requests', 'PUBLIC', [202]]);
  assert.deepEqual([p2.metodo, p2.ruta, p2.autenticacion, p2.exitos.map((e) => e.status)], ['post', '/auth/recovery-requests/{recoveryId}/complete', 'PUBLIC', [204]]);
  assert.ok(p2.errores[422]?.includes('RECOVERY_CODE_INVALID'));
  assert.deepEqual([adm.autenticacion, adm.idempotencia], ['SESSION_MFA', false], 'el código no puede quedar guardado en la idempotencia');
});
