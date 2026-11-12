/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-D12; 08 §25 y §42, condición 6): el segundo factor del profesional, en el dominio.
 * El estado de la sesión y la condición del PDP. Que la API lo exija en cada pedido lo prueba la integración
 * (test/integration/segundo-factor-del-profesional.int-spec.ts).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLAZO_DEL_SEGUNDO_FACTOR_MS } from './administracion';
import { evaluarAutorizacion, type HechosDeAutorizacion } from './autorizacion';
import {
  actuaComoProfesional,
  estadoDelSegundoFactorDelProfesional,
  finDelInicioReciente,
  SegundoFactorDeLaSesionResponseSchema,
  segundoFactorDelProfesionalApi,
} from './segundo-factor-del-profesional';

const inicio = new Date('2026-11-12T12:00:00.000Z');
const despues = (ms: number) => new Date(inicio.getTime() + ms);
const base = { esProfesional: true, inicioDeLaSesion: inicio, verificadoEn: null, metodo: null, tieneAutenticadorActivo: false, ahora: despues(60_000) } as const;

test('TEST-UF-014 · sin perfil profesional no se pide nada, y la sesión actúa como siempre', () => {
  const e = estadoDelSegundoFactorDelProfesional({ ...base, esProfesional: false });
  assert.deepEqual(e, { estado: 'NO_REQUERIDO' });
  assert.equal(actuaComoProfesional(e), true);
});

test('TEST-UF-014 · con perfil profesional, solo la sesión verificada actúa como profesional', () => {
  const verificado = estadoDelSegundoFactorDelProfesional({ ...base, verificadoEn: despues(30_000), metodo: 'TOTP', tieneAutenticadorActivo: true, ahora: despues(11 * 60 * 60 * 1000) });
  assert.deepEqual(verificado, { estado: 'VERIFICADO', metodo: 'TOTP' }, 'vale lo que dura la sesión: no vence por inactividad');
  assert.equal(actuaComoProfesional(verificado), true);
  const requerido = estadoDelSegundoFactorDelProfesional({ ...base, tieneAutenticadorActivo: true, ahora: despues(3 * 60 * 60 * 1000) });
  assert.deepEqual(requerido, { estado: 'REQUERIDO' }, 'con autenticador, el código se pide sin plazo');
  assert.equal(actuaComoProfesional(requerido), false);
});

test('TEST-UF-014 · sin autenticador, se configura dentro de los 10 minutos de entrar; después, hay que volver a entrar', () => {
  const dentro = estadoDelSegundoFactorDelProfesional({ ...base, ahora: despues(PLAZO_DEL_SEGUNDO_FACTOR_MS - 1) });
  assert.deepEqual(dentro, { estado: 'CONFIGURACION_REQUERIDA', plazo: finDelInicioReciente(inicio) });
  assert.equal(finDelInicioReciente(inicio).getTime() - inicio.getTime(), 10 * 60 * 1000);
  assert.equal(actuaComoProfesional(dentro), false);
  const fuera = estadoDelSegundoFactorDelProfesional({ ...base, ahora: despues(PLAZO_DEL_SEGUNDO_FACTOR_MS) });
  assert.deepEqual(fuera, { estado: 'INICIO_RECIENTE_REQUERIDO' });
  assert.equal(actuaComoProfesional(fuera), false);
});

test('TEST-UF-014 · el contrato dice cada estado, y la respuesta del estado lo valida', () => {
  const plazo = finDelInicioReciente(inicio);
  assert.deepEqual(segundoFactorDelProfesionalApi({ estado: 'CONFIGURACION_REQUERIDA', plazo }), { state: 'ENROLLMENT_REQUIRED', deadline: plazo.toISOString() });
  assert.deepEqual(segundoFactorDelProfesionalApi({ estado: 'VERIFICADO', metodo: 'RECOVERY_CODE' }), { state: 'VERIFIED', method: 'RECOVERY_CODE' });
  assert.deepEqual(segundoFactorDelProfesionalApi({ estado: 'INICIO_RECIENTE_REQUERIDO' }), { state: 'RECENT_SIGN_IN_REQUIRED' });
  for (const estado of [{ estado: 'NO_REQUERIDO' }, { estado: 'REQUERIDO' }] as const) {
    assert.ok(SegundoFactorDeLaSesionResponseSchema.safeParse({ data: { secondFactor: segundoFactorDelProfesionalApi(estado), recoveryCodesRemaining: null, recentSignInUntil: null } }).success);
  }
  assert.equal(SegundoFactorDeLaSesionResponseSchema.safeParse({ data: { secondFactor: { state: 'MAYBE' }, recoveryCodesRemaining: null, recentSignInUntil: null } }).success, false);
});

const favorables: HechosDeAutorizacion = {
  operacion: { alcance: 'NUTRICION', finalidad: 'ACOMPANAMIENTO_NUTRICIONAL' },
  actor: { identidadId: 'pro', cuentaOperativa: true, tienePerfilProfesional: true, conSegundoFactor: true },
  titular: { identidadId: 'persona', cuentaOperativa: true, a3Vigente: true },
  verificacion: 'VERIFICADO',
  habilitacion: 'CONCEDIDA',
  alcanceDeVinculo: { id: 'av', alcance: 'NUTRICION', finalidad: 'ACOMPANAMIENTO_NUTRICIONAL', estado: 'ACEPTADO' },
  consentimiento: { id: 'b2', finalidad: 'ACOMPANAMIENTO_NUTRICIONAL', situacion: 'VIGENTE', versionVigenteId: 'v1' },
};

test('TEST-UF-014 · el PDP: con todo a favor salvo el segundo factor de la sesión, deniega por la situación del actor', () => {
  assert.equal(evaluarAutorizacion(favorables).permitida, true);
  const sinSegundoFactor = evaluarAutorizacion({ ...favorables, actor: { ...favorables.actor, conSegundoFactor: false } });
  assert.equal(sinSegundoFactor.permitida, false);
  assert.deepEqual(sinSegundoFactor.dimensionesDesfavorables, ['SITUACION']);
});
