import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ContextoDeTransicionDeCuenta,
  ESTADO_INICIAL_DE_CUENTA,
  ESTADOS_TERMINALES_DE_CUENTA,
  EstadoOperativoDeCuenta,
  TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA,
  cuentaPermiteOperar,
  evaluarTransicionDeCuenta,
  transicionDeclarada,
} from './estado-operativo-de-cuenta';
import { VERSION_VIGENTE } from './textos';

const ESTADOS = Object.values(EstadoOperativoDeCuenta);
const CONSECUENCIAS = VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id;

const suspender: ContextoDeTransicionDeCuenta = { transicion: 'SuspenderCuenta', actor: 'SERVICIO_INTERNO', fundamento: 'INCIDENTE-SINTETICO-01' };
const restablecer: ContextoDeTransicionDeCuenta = { transicion: 'RestablecerCuenta', actor: 'SERVICIO_INTERNO', resolucion: 'INCIDENTE-SINTETICO-01 resuelto' };
const cerrar = (cambios: Partial<Extract<ContextoDeTransicionDeCuenta, { transicion: 'CerrarCuenta' }>> = {}): ContextoDeTransicionDeCuenta => ({
  transicion: 'CerrarCuenta',
  actor: 'TITULAR',
  sesionDelTitularValida: true,
  autenticacionReciente: true,
  versionDeConsecuenciasPresentada: CONSECUENCIAS,
  confirmacionExplicita: true,
  ...cambios,
});

test('06 §5.7.2 — conjunto cerrado de tres estados, tokens CONV-06-02', () => {
  assert.deepEqual([...ESTADOS].sort(), ['CERRADA', 'OPERATIVA', 'SUSPENDIDA']);
  for (const e of ESTADOS) assert.match(e, /^[A-Z_]+$/);
});

test('06 §5.7.2 — inicial OPERATIVA, terminal CERRADA; solo OPERATIVA permite operar (INV-06-28)', () => {
  assert.equal(ESTADO_INICIAL_DE_CUENTA, 'OPERATIVA');
  assert.deepEqual(ESTADOS_TERMINALES_DE_CUENTA, ['CERRADA']);
  assert.deepEqual(ESTADOS.filter(cuentaPermiteOperar), ['OPERATIVA']);
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

test('06 §5.7.4 — toda transición no declarada está prohibida (matriz 3×3)', () => {
  const permitidas = new Set(['OPERATIVA->SUSPENDIDA', 'SUSPENDIDA->OPERATIVA', 'OPERATIVA->CERRADA']);
  for (const origen of ESTADOS) {
    for (const destino of ESTADOS) {
      assert.equal(transicionDeclarada(origen, destino) !== undefined, permitidas.has(`${origen}->${destino}`), `${origen}->${destino}`);
    }
  }
});

// ─── Una prueba por transición declarada (TEST-RNF-DAT-001) ───────────────────────────────────────

test('SuspenderCuenta OPERATIVA → SUSPENDIDA: permitida con fundamento; revoca sesiones', () => {
  const r = evaluarTransicionDeCuenta('OPERATIVA', suspender);
  assert.equal(r.permitida, true);
  if (r.permitida) {
    assert.equal(r.transicion.destino, 'SUSPENDIDA');
    assert.equal(r.transicion.evento, 'CuentaSuspendida');
    assert.deepEqual(r.efectos, { revocarSesiones: true, suprimirCredencialLocal: false, actosARevocar: [] });
  }
});

test('SuspenderCuenta: la guarda rechaza un fundamento vacío', () => {
  assert.deepEqual(evaluarTransicionDeCuenta('OPERATIVA', { ...suspender, fundamento: '   ' }), { permitida: false, motivo: 'SIN_FUNDAMENTO' });
});

test('RestablecerCuenta SUSPENDIDA → OPERATIVA: permitida con resolución; no concede nada más', () => {
  const r = evaluarTransicionDeCuenta('SUSPENDIDA', restablecer);
  assert.equal(r.permitida, true);
  if (r.permitida) {
    assert.equal(r.transicion.destino, 'OPERATIVA');
    assert.equal(r.transicion.evento, 'CuentaRestablecida');
    assert.deepEqual(r.efectos, { revocarSesiones: false, suprimirCredencialLocal: false, actosARevocar: [] });
  }
});

test('RestablecerCuenta: la guarda rechaza una resolución vacía', () => {
  assert.deepEqual(evaluarTransicionDeCuenta('SUSPENDIDA', { ...restablecer, resolucion: '' }), { permitida: false, motivo: 'SIN_RESOLUCION' });
});

test('CerrarCuenta OPERATIVA → CERRADA: permitida con las cuatro guardas; efectos del §5.8 y 08', () => {
  const r = evaluarTransicionDeCuenta('OPERATIVA', cerrar());
  assert.equal(r.permitida, true);
  if (r.permitida) {
    assert.equal(r.transicion.destino, 'CERRADA');
    assert.equal(r.transicion.evento, 'CuentaCerrada');
    assert.deepEqual(r.efectos, { revocarSesiones: true, suprimirCredencialLocal: true, actosARevocar: ['TERMINOS'] });
  }
});

test('CerrarCuenta: cada guarda se evalúa como condición explícita', () => {
  assert.deepEqual(evaluarTransicionDeCuenta('OPERATIVA', cerrar({ sesionDelTitularValida: false })), { permitida: false, motivo: 'SESION_NO_VALIDA' });
  assert.deepEqual(evaluarTransicionDeCuenta('OPERATIVA', cerrar({ autenticacionReciente: false })), { permitida: false, motivo: 'STEP_UP_REQUERIDO' });
  assert.deepEqual(evaluarTransicionDeCuenta('OPERATIVA', cerrar({ versionDeConsecuenciasPresentada: null })), { permitida: false, motivo: 'CONSECUENCIAS_NO_PRESENTADAS' });
  assert.deepEqual(evaluarTransicionDeCuenta('OPERATIVA', cerrar({ versionDeConsecuenciasPresentada: 'cierre-cuenta-version-vieja' })), { permitida: false, motivo: 'CONSECUENCIAS_NO_PRESENTADAS' });
  assert.deepEqual(evaluarTransicionDeCuenta('OPERATIVA', cerrar({ confirmacionExplicita: false })), { permitida: false, motivo: 'SIN_CONFIRMACION_EXPLICITA' });
});

// ─── Transiciones prohibidas ─────────────────────────────────────────────────────────────────────

test('SUSPENDIDA → CERRADA FALLA aunque todas las guardas del cierre se cumplan (06 §5.7.4)', () => {
  assert.deepEqual(evaluarTransicionDeCuenta('SUSPENDIDA', cerrar()), { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
});

test('CERRADA no tiene salida: ninguna transición se evalúa como permitida desde CERRADA', () => {
  for (const contexto of [suspender, restablecer, cerrar()]) {
    assert.deepEqual(evaluarTransicionDeCuenta('CERRADA', contexto), { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
  }
});

test('Transiciones con origen equivocado se rechazan (Restablecer desde OPERATIVA, Suspender desde SUSPENDIDA)', () => {
  assert.equal(evaluarTransicionDeCuenta('OPERATIVA', restablecer).permitida, false);
  assert.equal(evaluarTransicionDeCuenta('SUSPENDIDA', suspender).permitida, false);
});
