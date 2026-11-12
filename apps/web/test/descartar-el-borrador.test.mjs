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
  assert.deepEqual(primera.parrafos, [d.COPY_DESCARTAR_LA_VERSION.primera, d.COPY_DESCARTAR_LA_VERSION.noLaVio(null)]);
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
    // El «⋯» solo en una versión que se puede descartar (en el asistente, la barra no lo muestra: ED-14).
    assert.match(fuente, /\{(?:!pasoDelAsistente && )?ofreceDescartar\(version\) \? \(\n\s*<MenuDeAcciones\n\s*id="mas-de-la-version"/, ruta);
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
    assert.match(fuente, /onDescartado=\{\(porOtraPestana\) => \{\n(?:\s*\/\/[^\n]*\n)?\s*focoTrasDescartar\.current = !porOtraPestana;\n\s*setAviso\(porOtraPestana \? \{ tipo: 'error', texto: porOtraPestana \} : \{ tipo: 'exito', texto: COPY_DESCARTAR_LA_VERSION\.descartada\(/, ruta);
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

test('DJ-6 · la versión en preparación lleva su número en el título, en el selector y en los cuadros', () => {
  // Revisión adversaria de la etapa 1: los cuadros decían «la versión 9» y la cabecera, «Versión en preparación», sin número.
  assert.equal(d.COPY_DE_VERSIONES.versionEnPreparacion(9), 'Versión 9 · en preparación');
  assert.equal(d.COPY_DE_VERSIONES.enPreparacionConNumero(9), '9 · en preparación');
  assert.equal(d.COPY_DE_VERSIONES.noLaVe('Diego'), 'Diego no la ve');
  assert.equal(d.COPY_DE_VERSIONES.noLaVe(null), 'La persona no la ve');
  for (const ruta of ['app/pro/advisees/training/editor.tsx', 'app/pro/advisees/nutrition/editor.tsx']) {
    const fuente = leer(ruta);
    assert.match(fuente, /<h2 id="titulo-borrador">\n\s*\{COPY_DE_VERSIONES\.versionEnPreparacion\(numero\)\}\{' '\}/, ruta);
    assert.match(fuente, /\{COPY_DE_VERSIONES\.noLaVe\(persona\)\}/, ruta);
    assert.doesNotMatch(fuente, /Versión en preparación\{' '\}/, ruta);
  }
  for (const ruta of ['app/pro/advisees/training/plan.tsx', 'app/pro/advisees/nutrition/plan.tsx']) {
    assert.match(leer(ruta), /<SelectorDeVersion mostrada=\{mostrada\} numeroDeLaActiva=\{numeroDeLaActiva \?\? 1\} numeroDelBorrador=\{numeroDelBorrador\(historial\)\} /, ruta);
  }
  assert.match(leer('app/pro/advisees/versiones-del-plan.tsx'), /\{COPY_DE_VERSIONES\.enPreparacionConNumero\(numeroDelBorrador\)\}/);
});

test('TEST-EDP-002 · el cuadro dice la fecha en prosa: «vigente desde el martes 10 de noviembre» (maqueta 11)', async () => {
  // Revisión adversaria de la etapa 1: con `diaSinElAnioEnCurso` la frase quedaba «vigente desde el 10 nov.».
  const F = await import('../src/lib/formato.ts');
  // Al mediodía de Buenos Aires: el mismo día en la zona de la CI y en la de la máquina.
  const ahora = new Date('2026-11-12T15:00:00Z');
  assert.equal(F.diaEnUnaFrase('2026-11-10T15:00:00Z', ahora), 'martes 10 de noviembre');
  // De otro año, con el año.
  assert.equal(F.diaEnUnaFrase('2025-12-09T15:00:00Z', ahora), 'martes 9 de diciembre de 2025');
  const vigente = { numero: 5, desde: F.diaEnUnaFrase('2026-11-10T15:00:00Z', ahora) };
  assert.equal(D.cuadroDelDescarte({ numero: 6, vigente, sinGuardar: false }).parrafos[0], 'Salió de la versión 5, vigente desde el martes 10 de noviembre. Se borra lo que armaste en esta versión.');
  for (const ruta of ['app/pro/advisees/training/editor.tsx', 'app/pro/advisees/nutrition/editor.tsx']) {
    assert.match(leer(ruta), /vigente=\{vigente \? \{ numero: vigente\.numero, desde: diaEnUnaFrase\(vigente\.desde\) \} : null\}/, ruta);
  }
});

test('TEST-EDP-002 · después de descartar, el foco va a «Crear una nueva versión»: el «⋯» que abrió el cuadro ya no está', () => {
  // Revisión adversaria de la etapa 1: el cuadro devolvía el foco al «⋯», pero volver a leer el plan desmontaba el editor
  // con ese botón adentro, y el foco caía al principio de la página.
  // El primer arreglo enfocaba cuando volvía la lectura del plan. Sin una versión activa, «Crear el plan» va dentro de
  // «Empezar el plan», que en ese momento todavía leía las evaluaciones: el botón no estaba y el foco no llegaba (lo mostró
  // el recorrido `descartar` en la CI). Ahora lo toma el botón mismo, cuando aparece.
  for (const ruta of ['app/pro/advisees/training/plan.tsx', 'app/pro/advisees/nutrition/plan.tsx']) {
    const fuente = leer(ruta);
    // Descartada, el foco espera al botón; si el descarte no se hizo, se queda en el aviso del error, que lo toma.
    assert.match(fuente, /onDescartado=\{\(porOtraPestana\) => \{\n(?:\s*\/\/[^\n]*\n)?\s*focoTrasDescartar\.current = !porOtraPestana;/, ruta);
    // El botón lo toma al aparecer, una sola vez.
    assert.match(fuente, /const enfocarSiSeDescarto = useCallback\(\(boton: HTMLButtonElement \| null\) => \{\n\s*if \(!boton \|\| !focoTrasDescartar\.current\) return;\n\s*focoTrasDescartar\.current = false;\n\s*boton\.focus\(\);/, ruta);
    assert.match(fuente, /data-crear-version ref=\{enfocarSiSeDescarto\}>/, ruta);
    // Nada que mire solo la lectura del plan: ahí el botón puede no estar todavía.
    assert.doesNotMatch(fuente, /if \(!focoTrasDescartar \|\| !r\) return;/, ruta);
  }
});

test('TEST-EDP-002 · el cuadro de descartar dice el nombre de la persona (DL-169; maqueta 11)', () => {
  const conVigente = D.cuadroDelDescarte({ numero: 6, vigente: { numero: 5, desde: 'martes 10 de noviembre' }, sinGuardar: false, persona: 'Diego' });
  assert.equal(conVigente.parrafos[1], 'La versión 5 no cambia, y Diego no ve nada distinto.');
  const primera = D.cuadroDelDescarte({ numero: 1, vigente: null, sinGuardar: false, persona: 'Diego' });
  assert.equal(primera.parrafos[1], 'Diego no ve nada distinto: nunca vio esta versión.');
  // Sin nombre, «la persona».
  assert.equal(D.cuadroDelDescarte({ numero: 1, vigente: null, sinGuardar: false, persona: null }).parrafos[1], 'La persona no ve nada distinto: nunca vio esta versión.');
  assert.match(leer('app/pro/advisees/cuadro-del-descarte.tsx'), /cuadroDelDescarte\(\{ numero, vigente, sinGuardar, persona \}\)/);
});
