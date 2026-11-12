/**
 * UF-06 de WP-USO-FINAL (DL-169; 08 §18 y §19; Ley 25.326, art. 14 y 16, a confirmar con la asesoría): los plazos de los
 * pedidos y la forma de los contratos. Lo que hace la API con la base lo prueba la integración
 * (test/integration/derechos-del-titular.int-spec.ts).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CrearExportacionRequestSchema,
  CrearPedidoDeDerechoRequestSchema,
  PedidoDeDerechoSchema,
  plazoDelPedido,
  VIGENCIA_DE_LA_DESCARGA_SEGUNDOS,
} from './derechos-del-titular';

test('TEST-UF-011 · el acceso se responde en diez días corridos', () => {
  assert.equal(plazoDelPedido('ACCESS', '2026-11-13'), '2026-11-23', 'desde un viernes');
  assert.equal(plazoDelPedido('ACCESS', '2026-12-28'), '2027-01-07', 'cruzando el año');
});

test('TEST-UF-011 · rectificar o suprimir, en cinco días hábiles (de lunes a viernes)', () => {
  assert.equal(plazoDelPedido('SUPPRESSION', '2026-11-13'), '2026-11-20', 'desde un viernes: del lunes al viernes siguiente');
  assert.equal(plazoDelPedido('RECTIFICATION', '2026-11-16'), '2026-11-23', 'desde un lunes: el lunes siguiente');
  assert.equal(plazoDelPedido('SUPPRESSION', '2026-11-14'), '2026-11-20', 'desde un sábado: el fin de semana no cuenta');
});

test('TEST-UF-011 · el pedido y la exportación tienen la forma del 09, y la persona no ve el fundamento interno', () => {
  assert.ok(CrearPedidoDeDerechoRequestSchema.safeParse({ type: 'SUPPRESSION', scope: {} }).success);
  assert.ok(CrearPedidoDeDerechoRequestSchema.safeParse({ type: 'ACCESS', scope: { note: 'Quiero ver mis registros.' } }).success);
  assert.equal(CrearPedidoDeDerechoRequestSchema.safeParse({ type: 'BORRAR_TODO', scope: {} }).success, false);
  assert.ok(CrearExportacionRequestSchema.safeParse({ scope: { domains: ['NUTRITION', 'TRAINING', 'ANTHROPOMETRY'], period: null } }).success);
  const pedido = { requestId: 'r', type: 'ACCESS', note: null, state: 'RESOLVED', createdAt: '2026-11-12T12:00:00.000Z', deadline: '2026-11-22', resolvedAt: '2026-11-13T12:00:00.000Z', response: 'Te enviamos el archivo.' };
  assert.ok(PedidoDeDerechoSchema.safeParse(pedido).success);
  assert.equal(PedidoDeDerechoSchema.safeParse({ ...pedido, rationale: 'interno' }).success, false, 'el fundamento no viaja a la persona');
  assert.equal(VIGENCIA_DE_LA_DESCARGA_SEGUNDOS, 900, 'la ruta de descarga vence a los 15 minutos (08 §21)');
});
