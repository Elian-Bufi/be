/**
 * RF-004 (DL-172) · Oráculos de los métodos de acceso de una misma identidad (TEST-MET-001 a 005;
 * docs/paquetes/WP-RF068-RF004-ORACULOS.md). Escritos antes que el servicio y verificados con mutación.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { decidirRetiro, decidirVinculoDeGoogle, metodosUtilizables, metodoVigente, type MetodoDeLaCuenta } from './metodos-de-acceso';
import { pasoDeAccesoConGoogle } from './pasos-de-acceso-google';
import { COPY_ACCESO_GOOGLE } from './copy-acceso-google';
import { OPERACIONES } from './openapi';

const contrasena = (cambios: Partial<MetodoDeLaCuenta> = {}): MetodoDeLaCuenta => ({ id: 'm-local', tipo: 'LOCAL', referencia: 'ana@be.test', vigente: true, conCredencial: true, ...cambios });
const google = (cambios: Partial<MetodoDeLaCuenta> = {}): MetodoDeLaCuenta => ({ id: 'm-google', tipo: 'GOOGLE', referencia: 'sub-1', vigente: true, conCredencial: false, ...cambios });

test('TEST-MET-001 · un método vale sin cambios o con una cantidad par (los impares son retiros)', () => {
  assert.equal(metodoVigente(0), true);
  assert.equal(metodoVigente(1), false);
  assert.equal(metodoVigente(2), true);
  assert.equal(metodoVigente(3), false);
  // Una contraseña suprimida no sirve para entrar; un Google retirado, tampoco.
  assert.deepEqual(metodosUtilizables([contrasena({ conCredencial: false }), google({ vigente: false })]), []);
  assert.deepEqual(metodosUtilizables([contrasena(), google()]).map((m) => m.id), ['m-local', 'm-google']);
});

test('TEST-MET-002 · nunca sin un método utilizable: Google se retira solo si queda la contraseña, y la contraseña no se retira', () => {
  assert.equal(decidirRetiro([contrasena(), google()], 'm-google'), 'RETIRAR');
  assert.equal(decidirRetiro([google()], 'm-google'), 'ULTIMO_METODO');
  assert.equal(decidirRetiro([contrasena({ conCredencial: false }), google()], 'm-google'), 'ULTIMO_METODO');
  assert.equal(decidirRetiro([contrasena(), google()], 'm-local'), 'LA_CONTRASENA_NO_SE_RETIRA');
  // Lo ya retirado, lo ajeno o lo inexistente: el mismo 404.
  assert.equal(decidirRetiro([contrasena(), google({ vigente: false })], 'm-google'), 'NO_ESTA');
  assert.equal(decidirRetiro([contrasena(), google()], 'otro'), 'NO_ESTA');
});

test('TEST-MET-003 · vincular Google: el mismo correo se vincula; otro, solo con la confirmación explícita', () => {
  const p = { metodos: [contrasena()], sub: 'sub-1', correoDeGoogle: 'ana@be.test', subDeOtraIdentidad: false, confirmaCorreoDistinto: false };
  assert.equal(decidirVinculoDeGoogle(p), 'ASOCIAR');
  assert.equal(decidirVinculoDeGoogle({ ...p, correoDeGoogle: 'ana.personal@be.test' }), 'CORREO_DISTINTO');
  assert.equal(decidirVinculoDeGoogle({ ...p, correoDeGoogle: 'ana.personal@be.test', confirmaCorreoDistinto: true }), 'ASOCIAR');
  // Sin contraseña con que confirmar (suprimida), no se vincula desde la cuenta.
  assert.equal(decidirVinculoDeGoogle({ ...p, metodos: [contrasena({ conCredencial: false })] }), 'SIN_CONTRASENA');
});

test('TEST-MET-004 · nunca una cuenta de Google en dos identidades, ni dos cuentas de Google en una', () => {
  const p = { metodos: [contrasena()], sub: 'sub-1', correoDeGoogle: 'ana@be.test', subDeOtraIdentidad: false, confirmaCorreoDistinto: false };
  assert.equal(decidirVinculoDeGoogle({ ...p, subDeOtraIdentidad: true }), 'DE_OTRA_IDENTIDAD');
  assert.equal(decidirVinculoDeGoogle({ ...p, subDeOtraIdentidad: true, metodos: [contrasena(), google()] }), 'DE_OTRA_IDENTIDAD');
  assert.equal(decidirVinculoDeGoogle({ ...p, metodos: [contrasena(), google()] }), 'YA_ESTA');
  assert.equal(decidirVinculoDeGoogle({ ...p, metodos: [contrasena(), google({ referencia: 'sub-2' })] }), 'YA_TIENE_OTRA');
  // La misma que se desvinculó se reasocia; otra distinta, todavía no (DL-172 D-5).
  assert.equal(decidirVinculoDeGoogle({ ...p, metodos: [contrasena(), google({ vigente: false })] }), 'REASOCIAR');
  assert.equal(decidirVinculoDeGoogle({ ...p, metodos: [contrasena(), google({ vigente: false, referencia: 'sub-2' })] }), 'OTRA_ANTERIOR');
  // La reasociación también pide la confirmación si el correo es otro.
  assert.equal(decidirVinculoDeGoogle({ ...p, correoDeGoogle: 'otro@be.test', metodos: [contrasena(), google({ vigente: false })] }), 'CORREO_DISTINTO');
});

test('TEST-MET-005 · el contrato: ver y vincular con sesión, desvincular con una entrada reciente; entrar con una cuenta desvinculada lo dice', () => {
  const op = (id: string) => OPERACIONES.find((o) => o.id === id);
  assert.deepEqual(
    ['API-MET-01', 'API-MET-02', 'API-MET-03'].map((id) => [op(id)?.metodo, op(id)?.ruta, op(id)?.autenticacion]),
    [
      ['get', '/me/access-methods', 'SESSION'],
      ['post', '/me/access-methods', 'SESSION'],
      ['delete', '/me/access-methods/{methodId}', 'SESSION_STEP_UP'],
    ],
  );
  assert.ok(op('API-MET-02')?.errores[403]?.includes('MFA_REQUIRED'));
  assert.ok(op('API-MET-03')?.errores[403]?.includes('MFA_REQUIRED'));
  assert.ok(op('API-MET-03')?.errores[409]?.includes('LAST_ACCESS_METHOD'));
  const rechazo = { ok: false as const, tipo: 'API' as const, status: 409, codigo: 'GOOGLE_ACCOUNT_UNLINKED', issues: [] };
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', rechazo, 'WEB'), { tipo: 'AVISO', mensaje: COPY_ACCESO_GOOGLE.desvinculada, reiniciar: true });
});
