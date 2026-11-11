/**
 * DL-168 · un guardado que falla se dice claro, y lo escrito no se pierde (arreglo del 2026-11-11).
 *
 * Antes, un plan que no entraba en el límite de la API se decía «El servicio no está disponible en este momento. Probá de
 * nuevo más tarde.», como si BE estuviera caído; y el autoguardado solo mostraba «No se pudo guardar: se reintenta…»,
 * aunque reintentar no lo arreglaba (B28 de las capturas de los flujos de planificación). Ahora:
 *  1. la regla (`falloDeGuardado`, en @be/domain) distingue el plan que no entra, la falta de respuesta y el resto;
 *  2. los dos editores de planes la usan: el que no entra se dice siempre, también en el autoguardado y sin mover el foco;
 *     sin respuesta o con un 5xx, «No pudimos guardar los cambios. Tus cambios siguen acá. Reintentá.»;
 *  3. al fallar, el editor no toca lo escrito, y salir con cambios sin guardar pide confirmar;
 *  4. (ampliación, el mismo día) los dos diálogos «Guardar como plantilla» dicen lo mismo cuando el plan no entra.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/advisees/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const api = (status, codigo, issues = []) => ({ ok: false, tipo: 'API', status, codigo, issues });

test('DL-168 · el plan que no entra se dice como demasiado grande, no como BE caído', () => {
  // Lo que responde la API cuando el cuerpo pasa el límite de su ruta, o la cota de elementos: 400 con TOO_BIG en el cuerpo.
  assert.equal(d.falloDeGuardado(api(400, 'INVALID_REQUEST', [{ code: 'TOO_BIG', path: '(body)' }])), 'DEMASIADO_GRANDE');
  // Un 413 de un intermediario, sin el sobre de error de la API, también.
  assert.equal(d.falloDeGuardado(api(413, 'RESPUESTA_NO_RECONOCIDA')), 'DEMASIADO_GRANDE');
  // Una lista del contrato que se pasa de su tope tiene su lugar en el plan: es un problema del plan, no de tamaño.
  assert.equal(d.falloDeGuardado(api(400, 'INVALID_REQUEST', [{ code: 'TOO_BIG', path: 'changes.dayTypes' }])), 'OTRO');
  assert.equal(
    d.COPY_GUARDADO.demasiadoGrande,
    'El plan es demasiado grande para guardarlo de una vez. Tus cambios siguen acá: quitá lo que no haga falta (opciones, semanas o notas largas) y volvé a guardar.',
  );
});

test('DL-168 · sin respuesta, una respuesta que no se entiende o un 5xx: «No pudimos guardar los cambios. Tus cambios siguen acá. Reintentá.»', () => {
  for (const r of [{ ok: false, tipo: 'RED' }, api(503, 'DB_UNAVAILABLE'), api(500, 'INTERNAL_ERROR'), api(502, 'RESPUESTA_NO_RECONOCIDA'), api(200, 'RESPUESTA_NO_RECONOCIDA')]) {
    assert.equal(d.falloDeGuardado(r), 'SIN_RESPUESTA', JSON.stringify(r));
  }
  assert.equal(d.COPY_GUARDADO.sinRespuesta, 'No pudimos guardar los cambios. Tus cambios siguen acá. Reintentá.');
  // Ninguno de los dos se dice como «El servicio no está disponible»: eso hacía pensar que BE estaba caído.
  for (const texto of [d.COPY_GUARDADO.sinRespuesta, d.COPY_GUARDADO.demasiadoGrande]) assert.doesNotMatch(texto, /no está disponible/);
});

test('DL-168 · los rechazos del contrato y del estado siguen como antes', () => {
  for (const r of [
    api(409, 'VERSION_CONFLICT'),
    api(409, 'RESOURCE_CONFLICT'),
    api(404, 'RESOURCE_NOT_FOUND'),
    api(422, 'INVALID_STATE_TRANSITION'),
    api(422, 'TRAINING_PLAN_STRUCTURE_INVALID', [{ code: 'DUPLICATE_NODE_ID', path: 'blocks[0].blockId' }]),
    api(400, 'INVALID_REQUEST'),
    api(429, 'RATE_LIMITED'),
  ]) {
    assert.equal(d.falloDeGuardado(r), 'OTRO', r.codigo);
  }
});

test('DL-168 · los dos editores de planes la usan, y al fallar no tocan lo escrito', () => {
  for (const archivo of ['nutrition/editor.tsx', 'training/editor.tsx']) {
    const fuente = leer(archivo);
    const motivo = fuente.indexOf('const motivo = falloDeGuardado(r);');
    assert.ok(motivo > 0, `${archivo}: el guardado usa falloDeGuardado`);
    // La rama de la falla: desde que se marca el fallo hasta el cierre del `if (!r.ok)` del guardado.
    const rama = fuente.slice(fuente.lastIndexOf('setFallo(true);', motivo), fuente.indexOf('\n    }\n', motivo));
    // El que no entra se dice también en el autoguardado, sin mover el foco: nada corta antes, y el autoguardado corta después.
    assert.doesNotMatch(rama.slice(0, rama.indexOf("motivo === 'DEMASIADO_GRANDE'")), /return/, archivo);
    assert.match(rama, /motivo === 'DEMASIADO_GRANDE'[\s\S]*COPY_GUARDADO\.demasiadoGrande, sinFoco: automatico[\s\S]*if \(automatico\) return null;/, archivo);
    assert.match(rama, /motivo === 'SIN_RESPUESTA'[\s\S]*COPY_GUARDADO\.sinRespuesta/, archivo);
    // Lo escrito no se toca: ni la estructura ni «sucio», ni se recarga lo guardado.
    assert.doesNotMatch(rama, /setEstructura\(|setBloques\(|setSucio\(|cargar\(/, archivo);
    // Un aviso sin foco no se enfoca.
    assert.match(fuente, /enfocar=\{\([^}]*\) && !mensaje\.sinFoco\}/, archivo);
    // Salir con cambios sin guardar pide confirmar.
    assert.match(fuente, /useCambiosSinGuardar\(sucio, /, archivo);
  }
});

test('DL-168 · «Guardar como plantilla» dice lo mismo que el editor cuando el plan no entra', () => {
  for (const archivo of ['nutrition/plantillas.tsx', 'training/plantillas.tsx']) {
    const fuente = leer(archivo);
    // El nombre tomado primero; si el plan no entra, el texto del editor; el resto, como antes.
    assert.match(fuente, /COPY_PLANTILLAS\.nombreTomado : falloDeGuardado\(r\) === 'DEMASIADO_GRANDE' \? COPY_GUARDADO\.demasiadoGrande : mensajeDeFallo\(r\)/, archivo);
  }
});
