/**
 * ED-01 · Descartar la versión en preparación (WP-EDITORES-PROFESIONAL; TEST-EDP-002). La API ya existía (TB-47, DL-163
 * D-21: API-PLE-05 y API-PLN-07); faltaba el website.
 *
 * - Solo una versión en preparación que nunca se activó ofrece descartarse; la vigente, nunca.
 * - El cuadro dice de qué versión salió, que lo armado se borra, que la vigente no cambia y que no se deshace; con cambios
 *   sin guardar, que también se pierden. «Cancelar» tiene el foco y no llama a la API.
 * - El reintento de un resultado incierto reusa la misma clave de idempotencia.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const D = await import('../src/app/pro/advisees/descartar-el-borrador.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const api = (status, codigo) => ({ ok: false, tipo: 'API', status, codigo, issues: [] });

test('TEST-EDP-002 · solo se ofrece en una versión en preparación que nunca se activó; la vigente, nunca', () => {
  assert.equal(D.ofreceDescartar({ state: 'DRAFT', activatedAt: null }), true);
  assert.equal(D.ofreceDescartar({ state: 'ACTIVATED', activatedAt: '2026-11-10T13:00:00.000Z' }), false);
  // El número del borrador es el de las activadas más uno (DJ-6).
  assert.equal(D.numeroDelBorrador([]), 1);
  assert.equal(D.numeroDelBorrador([{ numero: 8 }, { numero: 7 }]), 9);
});

test('TEST-EDP-002 · el cuadro: de qué versión salió, que la vigente no cambia, lo que no se guardó y que no se deshace', () => {
  const cuadro = D.cuadroDelDescarte({ numero: 9, vigente: { numero: 8, desde: 'martes 10 de noviembre' }, sinGuardar: true });
  assert.equal(cuadro.titulo, '¿Descartar la versión 9 en preparación?');
  assert.deepEqual(cuadro.parrafos, [
    'Salió de la versión 8, vigente desde el martes 10 de noviembre. Se borra lo que armaste en esta versión.',
    'La versión 8 no cambia, y la persona no ve nada distinto.',
    'También se pierden los cambios que todavía no se guardaron.',
  ]);
  assert.equal(cuadro.confirmar, 'Descartar la versión 9');
  // Sin cambios sin guardar, no lo dice; sin vigente, lo dice así.
  const primera = D.cuadroDelDescarte({ numero: 1, vigente: null, sinGuardar: false });
  assert.deepEqual(primera.parrafos, [d.COPY_DESCARTAR_LA_VERSION.primera, d.COPY_DESCARTAR_LA_VERSION.laPersonaNoLaVio]);
  assert.equal(d.COPY_DESCARTAR_LA_VERSION.noSeDeshace, 'No se puede deshacer.');
  // Los textos pasan las guardias: nada que califique ni términos prohibidos.
  const textos = Object.values(d.COPY_DESCARTAR_LA_VERSION).map((t) => (typeof t === 'function' ? t(9, 'martes 10 de noviembre') : t));
  for (const t of [...textos, ...cuadro.parrafos]) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.doesNotMatch(t, /asesorad|cumplimiento|adherencia|racha|DL-|TB-/i, t);
  }
});

test('TEST-EDP-002 · cada respuesta, con sus palabras: descartada o ya no estaba, la sección vuelve a leer', () => {
  assert.equal(D.resultadoDelDescarte({ ok: true, datos: { data: { planId: 'p', discardedAt: '2026-11-12T10:00:00.000Z' } } }), 'DESCARTADA');
  assert.equal(D.resultadoDelDescarte(api(404, 'RESOURCE_NOT_FOUND')), 'YA_NO_ESTA');
  assert.equal(D.resultadoDelDescarte(api(409, 'VERSION_CONFLICT')), 'CAMBIO_EN_OTRA_PESTANA');
  assert.equal(D.resultadoDelDescarte(api(422, 'PLAN_NOT_EDITABLE')), 'YA_ACTIVADA');
  assert.equal(D.resultadoDelDescarte({ ok: false, tipo: 'RED' }), 'INCIERTO');
  assert.equal(D.resultadoDelDescarte(api(200, 'RESPUESTA_NO_RECONOCIDA')), 'INCIERTO');
  assert.equal(D.textoDelDescarteQueNoSeHizo('DESCARTADA'), null);
  assert.equal(D.textoDelDescarteQueNoSeHizo('YA_NO_ESTA'), null);
  assert.equal(D.textoDelDescarteQueNoSeHizo('CAMBIO_EN_OTRA_PESTANA'), d.COPY_DESCARTAR_LA_VERSION.cambioEnOtraPestana);
  assert.equal(D.textoDelDescarteQueNoSeHizo('YA_ACTIVADA'), d.COPY_DESCARTAR_LA_VERSION.yaActivada);
  assert.equal(D.textoDelDescarteQueNoSeHizo('INCIERTO'), d.COPY.resultadoIncierto);
});

test('TEST-EDP-002 · los dos editores: el «⋯», el cuadro, la misma clave en el reintento y «Cancelar» sin la API', () => {
  for (const [ruta, llamada] of [
    ['app/pro/advisees/training/editor.tsx', 'descartarBorradorDePlanDeEntrenamiento'],
    ['app/pro/advisees/nutrition/editor.tsx', 'descartarBorradorDePlanNutricional'],
  ]) {
    const fuente = leer(ruta);
    // El «⋯» solo en una versión que se puede descartar.
    assert.match(fuente, /\{ofreceDescartar\(version\) \? \(\n\s*<MenuDeAcciones\n\s*id="mas-de-la-version"/, ruta);
    // La clave es la del intento: se crea al primer uso, y solo una respuesta definitiva la libera.
    assert.match(fuente, new RegExp(`api\\.${llamada}\\(token, planId, version\\.version, intentoDeDescartar\\.actual\\(\\)\\);\\n\\s*intentoDeDescartar\\.registrar\\(r\\);`), ruta);
    // «Cancelar» (y Escape, que es lo mismo) cierra sin llamar a la API ni tirar la clave de un intento incierto.
    const cancelar = fuente.slice(fuente.indexOf('onCancelar={() => {'), fuente.indexOf('onDescartar='));
    assert.ok(cancelar.length > 0, ruta);
    assert.doesNotMatch(cancelar, /api\.|descartarLaVersion|intentoDeDescartar\.descartar/, ruta);
    // Mientras el cuadro está abierto, el autoguardado espera (la versión que se descarta es la que se mostró).
    assert.match(fuente, /habilitado: [^\n]*&& !descartar,/, ruta);
    // Descartada, salir ya no pregunta y la sección vuelve a leer el plan.
    assert.match(fuente, /setSucio\(false\);\n\s*setDescartar\(false\);\n\s*onDescartado\(\);/, ruta);
  }
  for (const ruta of ['app/pro/advisees/training/plan.tsx', 'app/pro/advisees/nutrition/plan.tsx']) {
    const fuente = leer(ruta);
    assert.match(fuente, /numero=\{numeroDelBorrador\(historial\)\}/, ruta);
    assert.match(fuente, /onDescartado=\{\(\) => \{\n\s*setAviso\(\{ tipo: 'exito', texto: COPY_DESCARTAR_LA_VERSION\.descartada\(/, ruta);
  }
  // La vigente (`PlanActivo`) nunca ofrece descartar.
  const plan = leer('app/pro/advisees/training/plan.tsx');
  const activo = plan.slice(plan.indexOf('function PlanActivo('), plan.indexOf('export function PlanSoloLectura('));
  assert.ok(activo.length > 0);
  assert.doesNotMatch(activo, /[Dd]escart/);
});

test('TEST-EDP-002 · el cuadro: «Cancelar» con el foco y un solo botón de efecto', () => {
  const cuadro = leer('app/pro/advisees/cuadro-del-descarte.tsx');
  assert.match(cuadro, /textoVolver=\{D\.cancelar\}/);
  assert.match(cuadro, /\n\s*peligro\n/);
  assert.match(cuadro, /\n\s*focoEnVolver\n/);
  // Lo que no se deshace, con ícono y en negrita: nunca solo color.
  assert.match(cuadro, /<Icono nombre="aviso" tamano=\{18\} \/>\n\s*<span>\n\s*<strong>\{D\.noSeDeshace\}<\/strong>/);
  // El diálogo tiene dos botones: «Cancelar» y el que descarta.
  const dialogo = leer('components/dialogo.tsx');
  assert.equal((dialogo.match(/<button/g) ?? []).length, 2);
});
