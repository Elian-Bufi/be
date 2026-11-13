/**
 * WP-EDITORES-PROFESIONAL · los restos del website (§8.5 a §8.7): lo que quedaba pendiente cuando la API ya estaba en main.
 * - ED-72 · corregir o anular una serie observada (API-FZA-03): el cuerpo, el motivo y quién puede (EDT-57).
 * - ED-76 · la carga calculada, también en las series elegidas (EDT-56): solo su carga, nunca el % RM ni las demás.
 * - ED-14 · las pestañas por sesión en el paso 4 del asistente (maqueta 03; EDT-58).
 * - ED-23 · la fila «General» dentro de la planilla de series (EDT-59).
 * - API-PLN-01 · la vista previa de la versión nueva de una receta, con las cuentas del servidor (§8.7; EDT-60).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { terminosProhibidosDeFuerzaEn } from '@be/domain';

const leer = (r) => readFileSync(new URL(`../src/app/pro/advisees/${r}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const F = await import('../src/app/pro/advisees/fuerza/fuerza.ts');
const O = await import('../src/app/pro/advisees/asistente/operaciones-del-asistente.ts');
const V = await import('../src/app/pro/advisees/nutrition/version-nueva-de-la-receta.ts');

const PRESS = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
const MARTIN = '22222222-2222-4222-8222-222222222222';
const obs = { observationId: '44444444-4444-4444-8444-444444444441', version: 'v1', localDate: '2026-12-18', timeZone: 'America/Argentina/Buenos_Aires', note: null, estimate: { load: { value: 82.5, unit: 'kg' }, completedRepetitions: 5, rir: 1 } };
const enVivoDe = (f) => F.serieObservadaEnVivo({ exerciseId: PRESS, fecha: f.fecha, carga: f.carga, unidad: f.unidad, repeticiones: f.repeticiones, rir: f.rir });

// ─── ED-72 · API-FZA-03 ─────────────────────────────────────────────────────────────────────────────────────────────

test('ED-72 · la corrección arranca con los valores de la observación, con la carga escrita con coma', () => {
  assert.deepEqual(F.formularioDeLaObservacion(obs), { fecha: '2026-12-18', carga: '82,5', unidad: 'kg', repeticiones: '5', rir: 1, nota: '' });
});

test('ED-72 · anular pide solo el motivo y viaja con la versión que se leyó', () => {
  const f = F.formularioDeLaObservacion(obs);
  assert.deepEqual(F.cuerpoDeLaSucesion('anular', '   ', obs, f, enVivoDe(f), '2026-12-22'), { ok: false, falta: F.COPY_SUCESION.faltaElMotivo });
  assert.deepEqual(F.cuerpoDeLaSucesion('anular', ' La registré en otra persona ', obs, f, enVivoDe(f), '2026-12-22'), {
    ok: true,
    cuerpo: { action: 'VOID', expectedVersion: 'v1', reason: 'La registré en otra persona' },
  });
  assert.equal(F.cuerpoDeLaSucesion('anular', 'x'.repeat(501), obs, f, enVivoDe(f), '2026-12-22').ok, false);
});

test('ED-72 · corregir pide un cambio, una serie que se estime y una fecha que no sea futura', () => {
  const igual = F.formularioDeLaObservacion(obs);
  assert.deepEqual(F.cuerpoDeLaSucesion('corregir', 'Eran 80', obs, igual, enVivoDe(igual), '2026-12-22'), { ok: false, falta: F.COPY_SUCESION.sinCambios });
  const mas2 = { ...igual, rir: F.RIR_MAS_DE_2 };
  assert.equal(F.cuerpoDeLaSucesion('corregir', 'RIR', obs, mas2, enVivoDe(mas2), '2026-12-22').ok, false);
  const futura = { ...igual, carga: '80', fecha: '2026-12-23' };
  assert.deepEqual(F.cuerpoDeLaSucesion('corregir', 'Fecha', obs, futura, enVivoDe(futura), '2026-12-22'), { ok: false, falta: F.COPY_SUCESION.fechaFutura });
  const bien = { ...igual, carga: '80', nota: ' con pausa ' };
  assert.deepEqual(F.cuerpoDeLaSucesion('corregir', 'Eran 80 kg', obs, bien, enVivoDe(bien), '2026-12-22'), {
    ok: true,
    cuerpo: {
      action: 'CORRECT',
      expectedVersion: 'v1',
      reason: 'Eran 80 kg',
      observation: { localDate: '2026-12-18', timeZone: 'America/Argentina/Buenos_Aires', load: { value: 80, unit: 'kg' }, completedRepetitions: 5, rir: 1, note: 'con pausa' },
    },
  });
});

test('ED-72 · solo quien la observó la sucede; un 409 es que otra ya la sucedió', () => {
  const punto = { pointId: 'o:1', date: '2026-12-18', source: 'OBSERVED', origin: { type: 'STRENGTH_OBSERVATION', id: obs.observationId }, writtenBy: { identityId: MARTIN, displayName: 'Martín' } };
  assert.equal(F.puedeSucederla(punto, MARTIN), true);
  assert.equal(F.puedeSucederla(punto, '99999999-9999-4999-8999-999999999999'), false);
  assert.equal(F.puedeSucederla(punto, null), false);
  assert.equal(F.puedeSucederla({ ...punto, source: 'PERSON', origin: { type: 'TRAINING_EXECUTION', id: obs.observationId, prescriptionId: 'p', setIndex: 1, corrected: false } }, MARTIN), false);
  assert.equal(F.laSucedioOtro({ ok: false, tipo: 'API', status: 409 }), true);
  assert.equal(F.laSucedioOtro({ ok: false, tipo: 'API', status: 422 }), false);
  assert.equal(F.laSucedioOtro({ ok: false, tipo: 'RED' }), false);
});

test('ED-72 · el cuadro se abre desde «Cómo se calculó» del detalle, con «Atrás», y el principal dice qué hace', () => {
  const detalle = leer('fuerza/detalle-del-ejercicio.tsx');
  assert.match(detalle, /onSuceder=\{paso\.desde !== 'carga' && puedeSucederla\(punto, yo\) \? \(\) => abrir\(\{ tipo: 'suceder', punto \}\) : null\}/);
  assert.match(detalle, /texto: sucesion\.accion === 'anular' \? COPY_SUCESION\.anularla : COPY_SUCESION\.guardarCorreccion/);
  assert.match(detalle, /Atrás: \$\{COPY_COMO_SE_CALCULO\.titulo\}/);
  const cuadro = leer('fuerza/suceder-serie-observada.tsx');
  // Se lee la vigente (API-FZA-02) antes de mostrar el formulario: si no está, se dice y no se envía nada.
  assert.match(cuadro, /api\.listarSeriesObservadas\(o\.token, o\.asesoradoId, \{ exerciseId: o\.exerciseId \}\)/);
  assert.match(cuadro, /if \(!obs\) return setLectura\(\{ tipo: 'no-esta' \}\)/);
  assert.match(cuadro, /api\.sucederSerieObservada\(o\.token, obs\.observationId, pedido\.cuerpo, clave\)/);
});

// ─── ED-76 · en las series elegidas ─────────────────────────────────────────────────────────────────────────────────

test('ED-76 · en las series elegidas se escribe solo su carga: las demás, la general y el % RM no cambian (EDT-56)', () => {
  const sets = [{ repetitions: { value: 5 } }, { repetitions: { value: 5 }, rir: 2 }, { repetitions: { value: 5 }, suggestedLoad: { value: 60, unit: 'kg' } }];
  const c = F.loQueSeEscribeEnLasSeries(sets, [2, 1], { value: 72.5, unit: 'kg' });
  assert.deepEqual(Object.keys(c), ['sets']);
  assert.deepEqual(c.sets, [{ repetitions: { value: 5 } }, { repetitions: { value: 5 }, rir: 2, suggestedLoad: { value: 72.5, unit: 'kg' } }, { repetitions: { value: 5 }, suggestedLoad: { value: 72.5, unit: 'kg' } }]);
  // La de entrada no cambia, y la que no se eligió es la misma.
  assert.equal(sets[1].suggestedLoad, undefined);
  assert.equal(c.sets[0], sets[0]);
});

test('ED-76 · las elegidas en palabras, el principal, y una serie quitada con el cuadro abierto no se escribe', () => {
  assert.equal(F.lasSeriesEnPalabras([1]), 'la serie 2');
  assert.equal(F.lasSeriesEnPalabras([2, 1]), 'las series 2 y 3');
  assert.equal(F.lasSeriesEnPalabras([3, 0, 1]), 'las series 1, 2 y 4');
  assert.equal(F.textoDelPrincipalEnLasSeries(72.5, 'kg', [1, 2], 'Press de banca'), 'Escribir 72,5 kg en las series 2 y 3 de Press de banca');
  assert.deepEqual(F.lasElegidasQueQuedan([4, 1, 1, -1, 2], 3), [1, 2]);
  const editor = leer('training/ejercicio-del-editor.tsx');
  assert.match(editor, /data-calcular-la-carga-de-las-elegidas onClick=\{\(\) => onCalcularLaCarga\(\[\.\.\.elegidas\]\.sort\(\(a, b\) => a - b\)\)\}/);
  assert.match(leer('fuerza/detalle-del-ejercicio.tsx'), /onEscribirEnLasSeries\(loQueSeEscribeEnLasSeries\(sets, elegidas, \{ value: r\.carga, unit: r\.unidad \}\)\)/);
});

test('ED-76 · en las elegidas con % RM, la estimación tiene que ser la de la referencia; si no, no se escribe (EDT-56)', () => {
  const conRef = { intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado · Epley v1 · 01/10/2026' } } } };
  assert.equal(F.procedenciaEnLasSeries(conRef, '2026-10-01'), null);
  // La del 11/11 con la referencia del 01/10: los kilos saldrían de otra estimación que la que dice el plan.
  assert.equal(F.procedenciaEnLasSeries(conRef, '2026-11-11'), 'otra-referencia');
  assert.equal(F.procedenciaEnLasSeries({ intensity: { criterion: 'PERCENT_RM', target: { value: 75 } } }, '2026-11-11'), 'sin-referencia');
  assert.equal(F.procedenciaEnLasSeries({ intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '  ' } } } }, '2026-11-11'), 'sin-referencia');
  // Con RIR, o sin criterio, no hay referencia que cuidar.
  assert.equal(F.procedenciaEnLasSeries({ intensity: { criterion: 'RIR', target: { value: 2 } } }, '2026-11-11'), null);
  assert.equal(F.procedenciaEnLasSeries({}, '2026-11-11'), null);
  // El % de las elegidas es el de la prescripción y no se edita; el detalle le dice al cuadro que escribe en las series.
  const cuadro = leer('fuerza/carga-desde-la-estimacion.tsx');
  assert.match(cuadro, /const porcentajeFijo = enLasSeries && prescripcion\.intensity\?\.criterion === 'PERCENT_RM';/);
  assert.match(cuadro, /const pct = leerNumero\(porcentajeFijo \? entrada\.porcentaje : porcentaje\);/);
  assert.match(cuadro, /readOnly=\{x\.porcentajeFijo\}/);
  assert.match(cuadro, /procedencia === 'otra-referencia'\n\s+\? C\.otraReferencia/);
  assert.match(leer('fuerza/detalle-del-ejercicio.tsx'), /useCargaDesdeLaEstimacion\(prescripcion, unidad, desdeLasSeries\)/);
});

test('ED-72 · el principal apagado dice el motivo de la lectura: «ya no está» o la falla, no «Leyendo…»', () => {
  const cuadro = leer('fuerza/suceder-serie-observada.tsx');
  assert.match(cuadro, /lectura\.tipo === 'no-esta' \? COPY_SUCESION\.noEsta : lectura\.tipo === 'error' \? lectura\.texto : lectura\.tipo !== 'lista' \? COPY_SUCESION\.leyendo/);
  assert.match(cuadro, /<p role="status" data-sucesion-no-esta>/);
});

test('§5.8 · los textos nuevos de la vertical pasan la guardia de fuerza y de Entrenamiento, también en los comentarios', () => {
  for (const archivo of ['fuerza/suceder-serie-observada.tsx', 'fuerza/fuerza.ts', 'fuerza/detalle-del-ejercicio.tsx', 'fuerza/carga-desde-la-estimacion.tsx']) {
    assert.deepEqual(terminosProhibidosDeFuerzaEn(leer(archivo)), [], archivo);
  }
});

// ─── ED-14 · las pestañas del paso 4 ────────────────────────────────────────────────────────────────────────────────

const sesion = (label, n = 0) => ({ label, instructions: null, prescriptions: Array.from({ length: n }, () => ({ exerciseVersionId: 'e', sets: [] })) });
const nombreDeLaSesion = (s, n) => s.label.trim() || `Sesión ${n + 1}`;

test('ED-14 · una pestaña por sesión de todo el plan; con varios grupos, el grupo en el nombre', () => {
  const uno = O.gruposDelAsistente([{ label: 'Base', sessions: [sesion('Piernas A', 2), sesion('')] }]);
  assert.deepEqual(
    O.pestanasDelPaso4(uno, nombreDeLaSesion).map((t) => [t.clave, t.rotulo, t.ejercicios]),
    [
      ['b0-s0', 'Piernas A', 2],
      ['b0-s1', 'Sesión 2', 0],
    ],
  );
  const varios = O.gruposDelAsistente([{ label: 'Base', microcycles: [{ label: 'Semana 1', sessions: [sesion('A', 1)] }, { label: 'Semana 2', sessions: [sesion('A')] }] }]);
  assert.deepEqual(
    O.pestanasDelPaso4(varios, nombreDeLaSesion).map((t) => [t.clave, t.rotulo]),
    [
      ['b0-m0-s0', 'Base · Semana 1 · A'],
      ['b0-m1-s0', 'Base · Semana 2 · A'],
    ],
  );
});

test('ED-14 · las flechas dan la vuelta, Inicio y Fin van a las puntas; si se quitan sesiones, la última', () => {
  assert.equal(O.pestanaConLaTecla(0, 3, 'ArrowRight'), 1);
  assert.equal(O.pestanaConLaTecla(2, 3, 'ArrowRight'), 0);
  assert.equal(O.pestanaConLaTecla(0, 3, 'ArrowLeft'), 2);
  assert.equal(O.pestanaConLaTecla(1, 3, 'Home'), 0);
  assert.equal(O.pestanaConLaTecla(1, 3, 'End'), 2);
  assert.equal(O.pestanaConLaTecla(1, 3, 'Enter'), null);
  assert.equal(O.pestanaConLaTecla(0, 0, 'ArrowRight'), null);
  assert.equal(O.pestanaVigente(5, 2), 1);
  assert.equal(O.pestanaVigente(1, 3), 1);
  const editor = leer('training/editor.tsx');
  assert.match(editor, /role="tablist"\n\s+aria-label=\{CA\.sesionesDelPlan\}/);
  assert.match(editor, /role="tabpanel" id="paso-4-panel" aria-labelledby=\{idDeLaPestana\(claveElegida\)\}/);
});

test('ED-14 · el panel es uno por pestaña, y lo escrito sin aplicar queda en su sesión y su ejercicio', () => {
  const editor = leer('training/editor.tsx');
  // Sin la key, React reusa la línea del ejercicio 1 de A en el ejercicio 1 de B, y un Enter aplica ahí lo escrito en A.
  assert.match(editor, /<div key=\{claveElegida\} role="tabpanel" id="paso-4-panel"/);
  assert.match(editor, /const pendiente = `\$\{claveElegida\}·p\$\{l\}`;/);
  assert.match(editor, /texto=\{lineasDelPaso4\[pendiente\] \?\? ''\}\n\s+onTexto=\{\(t\) => setLineasDelPaso4\(\(m\) => \(\{ \.\.\.m, \[pendiente\]: t \}\)\)\}/);
  const linea = leer('training/linea-de-prescripcion.tsx');
  assert.match(linea, /const texto = deAfuera \?\? propioTexto;\n\s+const setTexto = onTexto \?\? setPropioTexto;/);
});

// ─── ED-23 · la fila «General» ──────────────────────────────────────────────────────────────────────────────────────

test('ED-23 · la fila «General» está dentro de la tabla, arriba de las series, con la carga y el descanso de la prescripción', () => {
  const editor = leer('training/ejercicio-del-editor.tsx');
  const tabla = editor.slice(editor.indexOf('<table className="tabla series-del-editor"'), editor.indexOf('</table>', editor.indexOf('<table className="tabla series-del-editor"')));
  const general = tabla.indexOf('data-fila-general');
  assert.ok(general > 0 && general < tabla.indexOf('{p.sets.map((s, n) => ('), 'la fila «General» va antes que las series');
  // Los mismos identificadores de siempre: «Validar» lleva al campo de la carga y del descanso generales.
  assert.match(tabla, /id=\{`\$\{id\}-carga`\}/);
  assert.match(tabla, /id=\{`\$\{id\}-descanso`\}/);
  // Y una sola vez en el archivo: lo general de abajo ya no los repite.
  assert.equal(editor.match(/id=\{`\$\{id\}-carga`\}/g).length, 1);
  assert.equal(editor.match(/id=\{`\$\{id\}-descanso`\}/g).length, 1);
  // Lo general que no se entiende lo dice a la vista y asociado al campo (WCAG 3.3.1), como antes de la planilla.
  assert.match(editor, /aria-describedby=\{mal \? `\$\{id\}-no-se-entiende` : undefined\}/);
  assert.match(tabla, /noSeEntiende="No se entiende: va un número\."/);
  assert.match(tabla, /noSeEntiende="No se entiende: va como 02:30, o en segundos enteros\."/);
  // La tabla se ve también sin series: la fila «General» es donde se escribe la carga general.
  assert.doesNotMatch(editor, /p\.sets\.length === 0 \? \(\n\s+<p className="nota">\{C\.sinSeries\}<\/p>\n\s+\) : \(/);
});

// ─── API-PLN-01 · la vista previa de la receta ─────────────────────────────────────────────────────────────────────

const nutr = (kcal, p, c, g) => ({ energyKcal: { value: kcal, missing: [] }, proteinG: { value: p, missing: [] }, carbohydrateG: { value: c, missing: [] }, fatG: { value: g, missing: [] }, fiberG: { value: null, missing: [] } });

test('API-PLN-01 · la porción de ahora la estima el servidor y la nueva sale del cálculo de la receta; lo que falta dice «sin dato»', () => {
  const lineas = V.nutrientesDeLaPorcion(nutr('420', '20', '55.4', '12'), nutr('465', '20', '61', null));
  assert.equal(lineas.length, 4);
  assert.equal(lineas[0], 'Calorías: de 420 kcal a 465 kcal');
  assert.equal(lineas[1], 'Proteínas: 20,0 g, igual que ahora');
  assert.match(lineas[3], /^Grasas: de 12,0 g a sin dato$/);
  assert.deepEqual(V.nutrientesDeLaPorcion(null, nutr('465', '20', '61', '9')).slice(0, 1), ['Calorías: 465 kcal']);
  assert.deepEqual(V.nutrientesDeLaPorcion(nutr('1', '1', '1', '1'), null), []);
  for (const l of lineas) assert.doesNotMatch(l, /%/);
});

test('API-PLN-01 · la estimación vale solo para la versión del plan que se mira y la versión de la receta que cita la opción', () => {
  const e = { version: 'v7', dayTypes: [{ meals: [{ options: [{ optionId: 'o1', recipeVersionId: 'rv2', planned: nutr('420', '20', '55', '12') }] }] }] };
  assert.equal(V.estimacionDeLaOpcion(e, 'v7', 'o1', 'rv2').energyKcal.value, '420');
  assert.equal(V.estimacionDeLaOpcion(e, 'v8', 'o1', 'rv2'), null);
  assert.equal(V.estimacionDeLaOpcion(e, 'v7', 'o1', 'rv3'), null);
  assert.equal(V.estimacionDeLaOpcion(e, 'v7', undefined, 'rv2'), null);
  assert.equal(V.estimacionDeLaOpcion(null, 'v7', 'o1', 'rv2'), null);
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /api\.estimarLasOpcionesDelPlan\(token, planId\)/);
  // Una respuesta de una versión vieja que llega tarde no pisa la de la versión de ahora.
  assert.match(editor, /if \(r\.ok && r\.datos\.data\.version === estimacionPedida\.current\) setEstimacionDelPlan\(r\.datos\.data\);/);
});

test('ED-32 · con porciones que no dividen exacto, los mismos ingredientes no se leen como un cambio (EDT-60)', () => {
  // 100 g en 3 porciones: la API arma 33,3 g por porción y la receta da 33,33…; las dos se comparan con un decimal.
  const despues = V.porcionDe({ servings: 3, ingredients: [{ catalogItemId: 'avena', name: 'Avena', quantity: { value: 100, unit: 'g' } }] });
  assert.deepEqual(V.cambiosEnUnaPorcion([{ catalogItemId: 'avena', nombre: 'Avena', cantidad: { value: 33.3, unit: 'g' } }], despues), ['Una porción tiene los mismos ingredientes y cantidades.']);
  // Los nutrientes vienen de dos métodos del servidor: el comentario lo dice, y no los presenta como el mismo.
  assert.match(leer('nutrition/version-nueva-de-la-receta.ts'), /No es el mismo método \(EDT-60\)/);
});
