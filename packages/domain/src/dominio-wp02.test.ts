import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ACTO_REVOCABLE, ACTOS_DEL_REGISTRO, EstadoDeActoRegistrable, TRANSICIONES_DE_ACTO_REGISTRABLE } from './acto-registrable';
import {
  IniciarSesionRequestSchema,
  RegistrarIdentidadRequestSchema,
  RequisitoDeConsentimientoDeSaludResponseSchema,
  SolicitarCierreRequestSchema,
} from './contratos';
import { identificadorLocalValido, normalizarIdentificadorLocal, problemaDeCredencialLocal } from './identificador';
import { superficieDeclarada } from './procedencia';
import { DURACION_DE_SESION_MS, EstadoDeSesion, TRANSICIONES_DE_SESION } from './sesion';
import { CATALOGO_DE_TEXTOS, TipoDeTexto, VERSION_VIGENTE } from './textos';

test('08 §12.2 — cada versión de texto guarda el SHA-256 real de su contenido', () => {
  for (const v of CATALOGO_DE_TEXTOS) {
    assert.equal(createHash('sha256').update(v.texto, 'utf8').digest('hex'), v.hash, v.id);
  }
});

test('Catálogo de textos: ids únicos, una versión vigente por tipo y marcados como demostración (DL-028)', () => {
  assert.equal(new Set(CATALOGO_DE_TEXTOS.map((v) => v.id)).size, CATALOGO_DE_TEXTOS.length);
  for (const tipo of Object.values(TipoDeTexto)) assert.equal(VERSION_VIGENTE[tipo].tipo, tipo);
  for (const v of CATALOGO_DE_TEXTOS.filter((t) => t.tipo !== 'CONSECUENCIAS_DE_CIERRE')) {
    assert.match(v.texto, /Texto de demostración/);
  }
});

test('A2 contiene los contenidos mínimos del 08 §12.1 y aclara que no es consentimiento de salud', () => {
  const a2 = VERSION_VIGENTE.PRIVACIDAD_INFO.texto;
  for (const tema of ['Responsable', 'Finalidades', 'Destinatarios', 'Datos de salud', 'Acceso excepcional', 'Transferencias internacionales', 'derechos']) {
    assert.ok(a2.includes(tema), tema);
  }
  assert.match(a2, /No es un consentimiento para tratar datos de salud/);
});

test('Consecuencias del cierre: copy de 10-ADD + irreversibilidad (DL-024), sin prometer borrado', () => {
  const t = VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.texto;
  assert.match(t, /la historia no se borra silenciosamente/);
  assert.match(t, /El cierre no se puede deshacer/);
  assert.doesNotMatch(t, /borrad|eliminar todos/i);
});

test('08 §12.4 — el registro crea A1 y A2, nunca A3; solo TERMINOS y DATOS_SALUD_BE son revocables', () => {
  assert.deepEqual([...ACTOS_DEL_REGISTRO], ['TERMINOS', 'PRIVACIDAD_INFO']);
  assert.ok(!ACTOS_DEL_REGISTRO.includes('DATOS_SALUD_BE'));
  assert.deepEqual(ACTO_REVOCABLE, { TERMINOS: true, PRIVACIDAD_INFO: false, DATOS_SALUD_BE: true });
  assert.deepEqual(Object.values(EstadoDeActoRegistrable), ['VIGENTE', 'REVOCADO']);
  assert.deepEqual(TRANSICIONES_DE_ACTO_REGISTRABLE.map((t) => `${t.origen}->${t.destino}`), ['VIGENTE->REVOCADO']);
});

test('Sesión: estados como enum con lista blanca; TTL ≤ 24 h (08 §26.2)', () => {
  assert.deepEqual(Object.values(EstadoDeSesion), ['ACTIVA', 'FINALIZADA', 'REVOCADA']);
  assert.deepEqual(TRANSICIONES_DE_SESION.map((t) => `${t.transicion}:${t.origen}->${t.destino}`), [
    'FinalizarSesion:ACTIVA->FINALIZADA',
    'RevocarSesion:ACTIVA->REVOCADA',
  ]);
  assert.ok(DURACION_DE_SESION_MS <= 24 * 60 * 60 * 1000);
});

test('Identificador local: normalización y validación sintáctica', () => {
  assert.equal(normalizarIdentificadorLocal('  Ana.Demo@Example.INVALID '), 'ana.demo@example.invalid');
  assert.ok(identificadorLocalValido('ana.demo@example.invalid'));
  for (const malo of ['', 'sin-arroba', 'a@b', 'con espacio@example.invalid']) assert.ok(!identificadorLocalValido(malo), malo);
});

test('Credencial: mínimo 12 caracteres, máximo 72 bytes (DL-013)', () => {
  assert.equal(problemaDeCredencialLocal('corta-11ch!'), 'CREDENCIAL_DEMASIADO_CORTA');
  assert.equal(problemaDeCredencialLocal('suficiente-12'), null);
  assert.equal(problemaDeCredencialLocal('x'.repeat(72)), null);
  assert.equal(problemaDeCredencialLocal('x'.repeat(73)), 'CREDENCIAL_DEMASIADO_LARGA');
  assert.equal(problemaDeCredencialLocal('ñ'.repeat(37)), 'CREDENCIAL_DEMASIADO_LARGA', '37 × 2 bytes = 74');
});

test('Superficie: solo WEB o APK; cualquier otro valor queda no declarado (null), nunca inventado', () => {
  assert.equal(superficieDeclarada('WEB'), 'WEB');
  assert.equal(superficieDeclarada('APK'), 'APK');
  for (const v of [undefined, null, '', 'web', 'IOS']) assert.equal(superficieDeclarada(v), null);
});

test('09v7 T12 — contratos estrictos: un campo no declarado se rechaza (UNKNOWN_FIELD)', () => {
  const base = {
    registrationIntent: 'ADVISEE',
    identity: { localIdentifier: 'a@example.invalid', localCredential: 'suficiente-12' },
    termsAcceptance: { versionId: 'terminos-2026-09-demo' },
    privacyAcknowledgement: { versionId: 'privacidad-2026-09-demo' },
  };
  assert.ok(RegistrarIdentidadRequestSchema.safeParse(base).success);
  const conRol = RegistrarIdentidadRequestSchema.safeParse({ ...base, role: 'ADMIN' });
  assert.ok(!conRol.success && conRol.error.issues.some((i) => i.code === 'unrecognized_keys'));
  const conA3 = RegistrarIdentidadRequestSchema.safeParse({ ...base, healthDataConsent: { versionId: 'x' } });
  assert.ok(!conA3.success, 'el registro no acepta A3');
  assert.ok(!IniciarSesionRequestSchema.safeParse({ method: 'GOOGLE', identifier: 'a', credential: 'b' }).success);
  assert.ok(!SolicitarCierreRequestSchema.safeParse({ confirmed: true }).success, 'sin consecuencias presentadas');
});

test('API-CON-05 — la forma «A3 no otorgado» es currentConsent: null', () => {
  const v = VERSION_VIGENTE.DATOS_SALUD_BE;
  const r = RequisitoDeConsentimientoDeSaludResponseSchema.safeParse({
    data: {
      type: 'HEALTH_DATA_BE',
      consentVersion: { id: v.id, text: v.texto, textHash: v.hash, effectiveFrom: v.vigenteDesde },
      purpose: 'HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY',
      currentConsent: null,
    },
  });
  assert.ok(r.success);
});
