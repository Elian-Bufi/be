/**
 * UF-04 de WP-USO-FINAL (DL-169; UF-D6 a UF-D8): la forma de la incorporación de un profesional (API-ADM-14) y del cambio
 * de su nombre profesional (API-ADM-15), sin la base. Lo que hace la API con la base lo prueba la integración
 * (test/integration/incorporacion-de-profesionales.int-spec.ts).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluarCambioDeNombre, evaluarIncorporacion, IncorporarProfesionalRequestSchema, type IncorporarProfesionalRequest } from './incorporacion-de-profesionales';

const valida: IncorporarProfesionalRequest = {
  email: '  Lic.Sintetica@Example.Invalid ',
  professionalName: '  Lic.   María Sintética ',
  profileType: 'HEALTH_PROFESSIONAL',
  license: { number: ' MN 000000 ', jurisdiction: 'Ciudad Autónoma de Buenos Aires' },
  scopes: ['ANTROPOMETRIA', 'NUTRICION'],
  rationale: 'Matrícula verificada en el registro público el 2026-11-12.',
};
const codigos = (r: ReturnType<typeof evaluarIncorporacion>) => (r.ok ? [] : r.issues.map((i) => `${i.code}@${i.path}`));

test('TEST-UF-009 · una incorporación completa sale normalizada, con las áreas en el orden del catálogo', () => {
  assert.ok(IncorporarProfesionalRequestSchema.safeParse(valida).success);
  assert.deepEqual(evaluarIncorporacion(valida), {
    ok: true,
    correo: 'lic.sintetica@example.invalid',
    nombre: 'Lic. María Sintética',
    tipo: 'SANITARIO',
    matricula: { numero: 'MN 000000', jurisdiccion: 'Ciudad Autónoma de Buenos Aires' },
    alcances: ['NUTRICION', 'ANTROPOMETRIA'],
    fundamento: 'Matrícula verificada en el registro público el 2026-11-12.',
  });
  const noSanitario = evaluarIncorporacion({ ...valida, profileType: 'NON_HEALTH_PROFESSIONAL', license: null, scopes: ['ENTRENAMIENTO'] });
  assert.ok(noSanitario.ok && noSanitario.matricula === null && noSanitario.tipo === 'NO_SANITARIO');
});

test('TEST-UF-009 · sin fundamento, sin nombre o sin áreas no se incorpora, y cada problema va a su campo', () => {
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, rationale: '   ' })), ['RATIONALE_REQUIRED@rationale']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, professionalName: ' ' })), ['DISPLAY_NAME_REQUIRED@professionalName']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, professionalName: 'x'.repeat(61) })), ['INVALID_DISPLAY_NAME@professionalName']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, scopes: [] })), ['SCOPES_REQUIRED@scopes']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, scopes: ['NUTRICION', 'NUTRICION'] })), ['SCOPE_REPEATED@scopes']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, email: ' ' })), ['EMAIL_REQUIRED@email']);
});

test('TEST-UF-009 · un sanitario lleva su matrícula completa; un no sanitario, ninguna (UF-D8)', () => {
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, license: null })), ['LICENSE_REQUIRED@license']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, license: { number: 'MN 1', jurisdiction: '  ' } })), ['LICENSE_REQUIRED@license.jurisdiction']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, license: { number: 'x'.repeat(41), jurisdiction: 'CABA' } })), ['INVALID_LICENSE@license.number']);
  assert.deepEqual(codigos(evaluarIncorporacion({ ...valida, profileType: 'NON_HEALTH_PROFESSIONAL' })), ['LICENSE_NOT_APPLICABLE@license']);
});

test('TEST-UF-009 · el nombre profesional cambia con fundamento, y no por el mismo', () => {
  assert.deepEqual(evaluarCambioDeNombre({ professionalName: ' Lic. María  Sintética Pérez ', expectedName: 'Lic. María Sintética', rationale: 'Pedido por el canal, con su matrícula.' }, 'Lic. María Sintética'), {
    ok: true,
    nombre: 'Lic. María Sintética Pérez',
    fundamento: 'Pedido por el canal, con su matrícula.',
  });
  const igual = evaluarCambioDeNombre({ professionalName: 'Lic. María Sintética', expectedName: 'Lic. María Sintética', rationale: 'x' }, 'Lic. María Sintética');
  assert.deepEqual(igual.ok ? [] : igual.issues.map((i) => i.code), ['SAME_DISPLAY_NAME']);
  const sinFundamento = evaluarCambioDeNombre({ professionalName: 'Otro', expectedName: 'Lic. María Sintética', rationale: '' }, 'Lic. María Sintética');
  assert.deepEqual(sinFundamento.ok ? [] : sinFundamento.issues.map((i) => i.code), ['RATIONALE_REQUIRED']);
});
