/**
 * ED-04 · Los avisos se actualizan al corregir (WP-EDITORES-PROFESIONAL; TEST-EDP-005).
 *
 * Un formulario que ya mostró sus errores los recalcula al salir de cada campo: el aviso corregido se va, el resumen se
 * recalcula y desaparece cuando no queda nada, y el lector oye «Listo para registrar». Mientras se escribe, nada cambia
 * (el foco no salta). Antes del primer intento de envío, ningún aviso.
 *
 * Uso: npm run test -w @be/web.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const V = await import('../src/components/validacion-viva.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const falta = (...ids) => ids.map((id) => ({ id, texto: `Falta ${id}.` }));

test('TEST-EDP-005 · antes del primer intento de envío, ningún aviso, ni al salir de un campo', () => {
  const a = V.alSalirDelCampo(V.SIN_AVISOS, ['interpretacion'], falta('interpretacion', 'fundamento'));
  assert.deepEqual(a.mostrados, []);
  assert.equal(V.anuncioDeLosAvisos(a, 'Listo para registrar'), '');
});

test('TEST-EDP-005 · al corregir y salir del campo, su aviso se va; el resumen desaparece con el último y se anuncia', () => {
  let a = V.alEnviar(falta('interpretacion', 'fundamento'));
  assert.deepEqual(a.mostrados.map((e) => e.id), ['interpretacion', 'fundamento']);
  assert.equal(V.anuncioDeLosAvisos(a, 'Listo para registrar'), '');
  // Corrige la interpretación y sale de ella: su aviso se va, el del fundamento sigue.
  a = V.alSalirDelCampo(a, ['interpretacion'], falta('fundamento'));
  assert.deepEqual(a.mostrados.map((e) => e.id), ['fundamento']);
  // Corrige el último: el resumen queda vacío (no se dibuja) y el lector oye que está listo.
  a = V.alSalirDelCampo(a, ['fundamento'], []);
  assert.deepEqual(a.mostrados, []);
  assert.equal(V.anuncioDeLosAvisos(a, V.COPY_AVISOS_VIVOS.listoParaRegistrar), 'Listo para registrar');
  // Un envío sin nada que corregir no anuncia nada: no hubo avisos.
  assert.equal(V.anuncioDeLosAvisos(V.alEnviar([]), 'Listo para registrar'), '');
});

test('TEST-EDP-005 · un valor inválido en un campo ya corregido aparece al salir de él, no mientras se escribe', () => {
  let a = V.alEnviar(falta('accion'));
  a = V.alSalirDelCampo(a, ['accion'], []);
  assert.deepEqual(a.mostrados, []);
  // Mientras se escribe no hay salida del campo: nada cambia. Al salir con algo inválido, aparece.
  a = V.alSalirDelCampo(a, ['accion'], falta('accion'));
  assert.deepEqual(a.mostrados.map((e) => e.id), ['accion']);
  // Un error nuevo de otro campo espera a su salida (o al envío): salir de «accion» no lo muestra.
  a = V.alSalirDelCampo(a, ['accion'], falta('accion', 'proxima'));
  assert.deepEqual(a.mostrados.map((e) => e.id), ['accion']);
  a = V.alSalirDelCampo(a, ['proxima'], falta('accion', 'proxima'));
  assert.deepEqual(a.mostrados.map((e) => e.id), ['accion', 'proxima']);
});

test('TEST-EDP-005 · un casillero dentro de un grupo con su aviso cuenta como el grupo', () => {
  const formulario = { id: 'formulario', parentElement: null };
  const grupo = { id: 'trn-revision-evidencia', parentElement: formulario };
  const fila = { id: '', parentElement: grupo };
  const casillero = { id: 'evidencia-3', parentElement: fila };
  assert.deepEqual(V.idsDelCampo(casillero, formulario), ['evidencia-3', 'trn-revision-evidencia']);
  let a = V.alEnviar(falta('trn-revision-evidencia'));
  a = V.alSalirDelCampo(a, V.idsDelCampo(casillero, formulario), []);
  assert.deepEqual(a.mostrados, []);
});

const FORMULARIOS = [
  ['app/pro/advisees/training/revisiones.tsx', 'listoParaRegistrar'],
  ['app/pro/advisees/nutrition/revisiones.tsx', 'listoParaRegistrar'],
  ['app/pro/advisees/nutrition/formularios.tsx', 'listoParaGuardar'],
  ['app/pro/recipes/editor-de-receta.tsx', 'listoParaGuardar'],
  ['app/pro/solicitar-vinculo.tsx', 'listoParaEnviar'],
];

test('TEST-EDP-005 · los formularios usan los avisos vivos: se muestran al enviar y se recalculan al salir de cada campo', () => {
  for (const [ruta, listo] of FORMULARIOS) {
    const f = leer(ruta);
    assert.match(f, /useAvisosVivos\(/, ruta);
    assert.match(f, /<form [^\n]*onBlur=\{avisos\.alSalir\}/, ruta);
    assert.match(f, new RegExp(`<AnuncioDeLosAvisos texto=\\{avisos\\.anuncio\\(COPY_AVISOS_VIVOS\\.${listo}\\)\\} />`), ruta);
    assert.match(f, /avisos\.alEnviar\(\)/, ruta);
    // Ya no hay errores que solo se calculan al enviar.
    assert.doesNotMatch(f, /setErrores\(/, ruta);
  }
  // El resumen toma el foco solo con un envío (`intento`), nunca mientras se escribe.
  const formulario = leer('components/formulario.tsx');
  assert.match(formulario, /if \(hayErrores\) ref\.current\?\.focus\(\);\n\s*\/\/ A propósito depende solo del envío \(intento\), no de la lista\.\n\s*\}, \[intento\]\);/);
  assert.match(formulario, /role="status" aria-live="polite" data-anuncio-de-los-avisos/);
  // Invitar: elegir un área corrige su aviso.
  assert.match(leer('app/pro/invitar-persona.tsx'), /if \(e\.target\.value && errorDeArea === COPY_INVITACION\.elegirArea\) setErrorDeArea\(undefined\);/);
});
