import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTADO_INICIAL_DE_CUENTA,
  ESTADOS_TERMINALES_DE_CUENTA,
  EstadoOperativoDeCuenta,
  TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA,
  transicionDeclarada,
} from './estado-operativo-de-cuenta';

const ESTADOS = Object.values(EstadoOperativoDeCuenta);

test('06 §5.7.2 — conjunto cerrado de tres estados, tokens CONV-06-02', () => {
  assert.deepEqual([...ESTADOS].sort(), ['CERRADA', 'OPERATIVA', 'SUSPENDIDA']);
  for (const e of ESTADOS) assert.match(e, /^[A-Z_]+$/);
});

test('06 §5.7.2 — inicial OPERATIVA, terminal CERRADA', () => {
  assert.equal(ESTADO_INICIAL_DE_CUENTA, 'OPERATIVA');
  assert.deepEqual(ESTADOS_TERMINALES_DE_CUENTA, ['CERRADA']);
});

test('06 §5.7.4 — lista blanca exacta', () => {
  assert.deepEqual(
    TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA.map((t) => `${t.transicion}:${t.origen}->${t.destino}:${t.evento}`),
    [
      'SuspenderCuenta:OPERATIVA->SUSPENDIDA:CuentaSuspendida',
      'RestablecerCuenta:SUSPENDIDA->OPERATIVA:CuentaRestablecida',
      'CerrarCuenta:OPERATIVA->CERRADA:CuentaCerrada',
    ],
  );
});

test('06 §5.7.4 — toda transición no declarada está prohibida', () => {
  const permitidas = new Set(['OPERATIVA->SUSPENDIDA', 'SUSPENDIDA->OPERATIVA', 'OPERATIVA->CERRADA']);
  for (const origen of ESTADOS) {
    for (const destino of ESTADOS) {
      const clave = `${origen}->${destino}`;
      assert.equal(transicionDeclarada(origen, destino) !== undefined, permitidas.has(clave), clave);
    }
  }
});

test('06 §5.7.2/§5.7.4 — CERRADA no tiene salida y SUSPENDIDA→CERRADA no existe', () => {
  for (const destino of ESTADOS) assert.equal(transicionDeclarada('CERRADA', destino), undefined);
  assert.equal(transicionDeclarada('SUSPENDIDA', 'CERRADA'), undefined);
});
