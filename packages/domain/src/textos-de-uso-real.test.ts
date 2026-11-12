/**
 * UF-05 de WP-USO-FINAL (DL-169): los textos de uso real, la parte del dominio de TEST-UF-010. La publicación simulada con
 * la API y la base está en test/integration/textos-de-uso-real.int-spec.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { CAPACIDADES_CONOCIDAS, CAPACIDAD_TEXTOS_VIGENTES } from './compatibilidad-de-clientes';
import { conocePasos, PASOS_PARA_SEGUIR } from './contratos-perfil-propio';
import { OPERACIONES } from './openapi';
import { CATALOGO_DE_TEXTOS, VERSION_VIGENTE, type TipoDeTexto } from './textos';
import { catalogoPublicando, faltaParaPublicar, VERSIONES_SIN_PUBLICAR } from './textos-sin-publicar';
import { AceptarVersionVigenteRequestSchema, pasosDeLosTextos, textoDelPaso, versionPublicada } from './textos-vigentes';

const TIPOS_DEL_PAQUETE: readonly TipoDeTexto[] = [
  'TERMINOS',
  'PRIVACIDAD_INFO',
  'DATOS_SALUD_BE',
  'CONSECUENCIAS_DE_CIERRE',
  'CONSENTIMIENTO_PROFESIONAL_SANITARIO',
  'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO',
  'EVIDENCIA_VISUAL',
  'HABITOS_COMPARTIDOS',
  'RESUMENES_COMPARTIDOS',
  'RESUMENES_Y_PLAN_COMPARTIDOS',
];

test('TEST-UF-010 · las diez versiones nuevas: una por tipo, suceden a la vigente, su hash es el de su texto y no dicen «demostración»', () => {
  assert.deepEqual([...VERSIONES_SIN_PUBLICAR.map((v) => v.tipo)].sort(), [...TIPOS_DEL_PAQUETE].sort());
  for (const v of VERSIONES_SIN_PUBLICAR) {
    assert.equal(v.reemplazaA, VERSION_VIGENTE[v.tipo].id, v.id);
    assert.equal(v.hash, createHash('sha256').update(v.texto, 'utf8').digest('hex'), v.id);
    assert.doesNotMatch(v.texto, /demostración/i, v.id);
    assert.doesNotMatch(v.texto, /Texto propuesto, pendiente/, v.id);
    assert.equal(v.titulo, VERSION_VIGENTE[v.tipo].titulo);
  }
  // Sin publicar: no están en el catálogo (que es el de la base) ni se pueden aceptar.
  for (const v of VERSIONES_SIN_PUBLICAR) assert.equal(versionPublicada(v.id), null, v.id);
  assert.equal(new Set(VERSIONES_SIN_PUBLICAR.map((v) => v.id)).size, VERSIONES_SIN_PUBLICAR.length);
  for (const v of VERSIONES_SIN_PUBLICAR) assert.equal(CATALOGO_DE_TEXTOS.some((c) => c.id === v.id), false, v.id);
});

test('TEST-UF-010 · ninguna se puede publicar: a todas les falta la validación jurídica, y a las reescritas, los datos marcados', () => {
  for (const v of VERSIONES_SIN_PUBLICAR) {
    const falta = faltaParaPublicar(v);
    assert.ok(falta.includes('VALIDACION_JURIDICA'), v.id);
    assert.ok(!falta.includes('AVISO_DE_DEMOSTRACION') && !falta.includes('NO_SUCEDE_A_LA_VIGENTE') && !falta.includes('HASH'), `${v.id}: ${falta.join(', ')}`);
  }
  const terminos = VERSIONES_SIN_PUBLICAR.find((v) => v.tipo === 'TERMINOS')!;
  assert.ok(faltaParaPublicar(terminos).includes('DATOS_A_COMPLETAR'), 'el responsable y la jurisdicción los completa Dirección con la asesoría');
  // Con la validación y sin nada por completar, se puede.
  const validada = { ...terminos, texto: 'Términos', hash: createHash('sha256').update('Términos', 'utf8').digest('hex'), validacionJuridica: { fecha: '2026-11-20', quien: 'Asesoría jurídica (sintético)' } };
  assert.deepEqual(faltaParaPublicar(validada), []);
});

test('TEST-UF-010 · publicadas, ningún texto vigente dice «demostración»', () => {
  const { vigentes } = catalogoPublicando(VERSIONES_SIN_PUBLICAR, '2026-12-01T03:00:00.000Z');
  for (const tipo of Object.keys(vigentes) as TipoDeTexto[]) assert.doesNotMatch(vigentes[tipo].texto, /demostración/i, tipo);
  // Hoy, sin publicar, los de demostración siguen siendo los vigentes.
  assert.match(VERSION_VIGENTE.TERMINOS.texto, /demostración/);
});

test('TEST-UF-010 · los pasos: la vigente aceptada no pide nada; la anterior o ninguna piden el texto, con el id de la vigente', () => {
  const vigentes = catalogoPublicando(VERSIONES_SIN_PUBLICAR, '2026-12-01T03:00:00.000Z').vigentes;
  assert.deepEqual(pasosDeLosTextos({ TERMINOS: VERSION_VIGENTE.TERMINOS.id, PRIVACIDAD_INFO: VERSION_VIGENTE.PRIVACIDAD_INFO.id }), []);
  assert.deepEqual(pasosDeLosTextos({ TERMINOS: VERSION_VIGENTE.TERMINOS.id, PRIVACIDAD_INFO: VERSION_VIGENTE.PRIVACIDAD_INFO.id }, vigentes), [
    { step: 'ACCEPT_TERMS', suggestion: 'terminos-2026-11' },
    { step: 'ACKNOWLEDGE_PRIVACY', suggestion: 'privacidad-2026-11' },
  ]);
  assert.deepEqual(pasosDeLosTextos({ TERMINOS: 'terminos-2026-11', PRIVACIDAD_INFO: VERSION_VIGENTE.PRIVACIDAD_INFO.id }, vigentes), [{ step: 'ACKNOWLEDGE_PRIVACY', suggestion: 'privacidad-2026-11' }]);
  assert.deepEqual(pasosDeLosTextos({ TERMINOS: null, PRIVACIDAD_INFO: null }), [
    { step: 'ACCEPT_TERMS', suggestion: VERSION_VIGENTE.TERMINOS.id },
    { step: 'ACKNOWLEDGE_PRIVACY', suggestion: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
  ]);
  assert.equal(textoDelPaso('ACCEPT_TERMS'), 'TERMS');
  assert.equal(textoDelPaso('ACKNOWLEDGE_PRIVACY'), 'PRIVACY');
  assert.equal(textoDelPaso('DISPLAY_NAME'), null);
});

test('TEST-UF-010 · el contrato: los pasos nuevos los conoce el cliente nuevo, la capacidad existe y API-ACC-08 acepta solo el texto y la versión', () => {
  assert.deepEqual([...PASOS_PARA_SEGUIR], ['DISPLAY_NAME', 'ACCEPT_TERMS', 'ACKNOWLEDGE_PRIVACY']);
  assert.ok(conocePasos([{ step: 'ACCEPT_TERMS', suggestion: 'x' }, { step: 'ACKNOWLEDGE_PRIVACY', suggestion: 'y' }]));
  assert.ok((CAPACIDADES_CONOCIDAS as readonly string[]).includes(CAPACIDAD_TEXTOS_VIGENTES));
  assert.ok(AceptarVersionVigenteRequestSchema.safeParse({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id }).success);
  assert.equal(AceptarVersionVigenteRequestSchema.safeParse({ text: 'HEALTH', versionId: 'x' }).success, false);
  assert.equal(AceptarVersionVigenteRequestSchema.safeParse({ text: 'TERMS', versionId: 'x', extra: 1 }).success, false);
  const op = OPERACIONES.find((o) => o.id === 'API-ACC-08');
  assert.ok(op, 'API-ACC-08 está en el contrato');
  assert.deepEqual([op.metodo, op.ruta, op.autenticacion, op.exitos.map((e) => e.status).sort()], ['post', '/me/legal-acceptances', 'SESSION', [200, 201]]);
  assert.deepEqual([...(op.errores[422] ?? [])].sort(), ['PRIVACY_VERSION_NOT_ACCEPTABLE', 'TERMS_VERSION_NOT_ACCEPTABLE']);
});
