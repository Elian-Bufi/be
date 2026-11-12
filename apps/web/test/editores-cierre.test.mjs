/**
 * WP-EDITORES-PROFESIONAL · el cierre del website (§8.3 y §8.4): lo pendiente de V3 que no choca con la API.
 * - ED-33 · «Copiar desde otra comida» y «Usar una comida habitual», en el «⋯» de la comida (TEST-EDP-031: la copia no
 *   comparte identificadores con el original).
 *
 * Uso: npm run test -w @be/web.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const leer = (r) => readFileSync(new URL(`../src/app/pro/advisees/${r}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const O = await import('../src/app/pro/advisees/nutrition/opcion-de-otra-comida.ts');

const item = (itemId, catalogItemId) => ({ itemId, catalogItemId, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED', note: 'sin sal' });
const dias = [
  {
    label: 'Día habitual',
    meals: [
      { mealId: 'm1', label: 'Almuerzo', options: [{ optionId: 'o1', label: 'Arroz con pollo', items: [item('i1', 'arroz'), item('i2', 'pollo')] }, { optionId: 'o2', label: '', items: [] }] },
      { mealId: 'm2', label: 'Merienda', options: [{ optionId: 'o3', label: 'Yogur', items: [item('i3', 'yogur')] }] },
    ],
  },
  { label: '', meals: [{ mealId: 'm3', label: '', options: [{ optionId: 'o4', label: 'Tarta', items: [], recipeVersionId: 'rv1' }] }] },
];

test('ED-33 · las opciones para copiar son las de las otras comidas, de todos los días tipo, sin las vacías', () => {
  const o = O.origenesDeLaCopia(dias, 0, 1);
  assert.deepEqual(
    o.map((x) => [x.clave, x.donde, x.opcion, x.tiene]),
    [
      ['0-0-0', 'Día habitual · Almuerzo', 'Arroz con pollo', '2 alimentos'],
      ['1-0-0', 'Día tipo 2 · Comida 1', 'Tarta', 'Receta'],
    ],
  );
  // La misma comida no se ofrece: para eso está «Duplicar opción».
  assert.ok(O.origenesDeLaCopia(dias, 0, 0).every((x) => x.clave !== '0-0-0'));
  assert.deepEqual(O.origenesDeLaCopia([dias[0]], 0, 0).map((x) => x.clave), ['0-1-0']);
});

test('TEST-EDP-031 · la copia desde otra comida es independiente: sin identificadores, con su nombre y todo lo demás', () => {
  const fuente = dias[0].meals[0].options[0];
  const copia = O.copiaDesdeOtraComida(fuente, 0);
  assert.equal(copia.optionId, undefined);
  assert.equal(copia.label, 'Arroz con pollo');
  assert.deepEqual(copia.items, [
    { catalogItemId: 'arroz', quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED', note: 'sin sal' },
    { catalogItemId: 'pollo', quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED', note: 'sin sal' },
  ]);
  // Cambiar la copia no toca el original.
  copia.items[0].quantity.value = 5;
  assert.equal(fuente.items[0].quantity.value, 100);
  // Una de receta sigue citando la misma versión.
  assert.equal(O.copiaDesdeOtraComida(dias[1].meals[0].options[0], 0).recipeVersionId, 'rv1');
  assert.equal(O.copiaDesdeOtraComida({ label: ' ', items: [] }, 2).label, 'Opción 3');
});

test('ED-33 · una comida habitual entra como opciones, con su nombre, sin pasar de doce', () => {
  const una = { name: 'Desayuno de siempre', structure: { options: [{ optionId: 'h1', label: 'Opción 1', items: [{ itemId: 'x', catalogItemId: 'avena' }] }] } };
  const r = O.opcionesDeLaHabitual(una, 3);
  assert.deepEqual(r, { opciones: [{ label: 'Desayuno de siempre', items: [{ catalogItemId: 'avena' }] }], quedanAfuera: 0 });
  const tres = { name: 'Cena', structure: { options: [{ label: 'Pescado', items: [] }, { label: '', items: [] }, { label: 'Pasta', items: [] }] } };
  const dos = O.opcionesDeLaHabitual(tres, 2);
  assert.deepEqual(dos.opciones.map((o) => o.label), ['Cena · Pescado', 'Cena · Opción 2']);
  assert.equal(dos.quedanAfuera, 1);
  assert.deepEqual(O.opcionesDeLaHabitual(tres, 0), { opciones: [], quedanAfuera: 3 });
  assert.equal(O.COPY_DE_OTRA_COMIDA.usada('Cena', 'Almuerzo', 2), '«Cena» entró como 2 opciones de Almuerzo.');
  assert.equal(O.COPY_DE_OTRA_COMIDA.quedanAfuera(1), 'Una opción de la habitual no entró: la comida llegó a doce.');
});

test('ED-33 · las dos entradas van en el «⋯» de la comida, con su motivo si no se pueden', () => {
  const comida = leer('nutrition/comida-del-editor.tsx');
  assert.match(comida, /clave: 'copiar-desde-otra', texto: COPY_DE_OTRA_COMIDA\.copiar, alElegir: alCopiarDesdeOtra, noSePuede: noSePuedeCopiar/);
  assert.match(comida, /clave: 'usar-habitual', texto: COPY_DE_OTRA_COMIDA\.usarHabitual, alElegir: alUsarHabitual, noSePuede: noSePuedeUsarHabitual/);
  const editor = leer('nutrition/editor.tsx');
  // Cambian el borrador (el autoguardado lo lleva): ninguna escritura propia.
  assert.match(editor, /cambiar\(\(x\) => \(x\[di\]!\.meals\[j\]!\.options\.push\(\.\.\.opciones\), x\)\);/);
});

// ─── ED-31 · La opción en un cuadro, con el buscador adentro ───────────────────────────────────────────────────────

const Q = await import('../src/app/pro/advisees/nutrition/opcion-en-un-cuadro.ts');
const alimento = (catalogItemId, provenance = 'PROFESSIONAL_MANUAL', composition = { energyKcal: 100, carbohydrateG: 1, proteinG: 2, fatG: 3, fiberG: 4 }) => ({ catalogItemId, name: catalogItemId, provenance, composition });

test('ED-31 · los habituales que coinciden van primero, sin repetir un alimento del catálogo', () => {
  const r = Q.resultadosDelBuscador([alimento('palta')], [alimento('palta-hass'), alimento('palta')]);
  assert.deepEqual(r.map((x) => [x.alimento.catalogItemId, x.habitual]), [['palta', true], ['palta-hass', false]]);
  assert.equal(Q.hayQueBuscar(' p '), false);
  assert.equal(Q.hayQueBuscar('pa'), true);
});

test('ED-31 · las flechas mueven el marcado y dan la vuelta; sin resultados no hay marcado', () => {
  assert.equal(Q.marcadoTrasTecla(0, 3, 'ArrowDown'), 1);
  assert.equal(Q.marcadoTrasTecla(2, 3, 'ArrowDown'), 0);
  assert.equal(Q.marcadoTrasTecla(0, 3, 'ArrowUp'), 2);
  assert.equal(Q.marcadoTrasTecla(7, 3, 'Enter'), 2);
  assert.equal(Q.marcadoTrasTecla(0, 0, 'ArrowDown'), -1);
});

test('ED-31 · cada resultado dice qué le falta y si es de demostración; lo que falta nunca es cero', () => {
  assert.equal(Q.completitudEnPalabras({ energyKcal: 1, carbohydrateG: 1, proteinG: 1, fatG: 1, fiberG: 0 }), 'composición completa');
  assert.equal(Q.completitudEnPalabras({ energyKcal: 1, carbohydrateG: 1, proteinG: 1, fatG: 1, fiberG: null }), 'Sin dato de fibra');
  assert.equal(Q.completitudEnPalabras({ energyKcal: 1, carbohydrateG: 1, proteinG: 1 }), 'Sin dato de grasas y fibra');
  assert.equal(Q.esDeDemostracion(alimento('x', 'BE_SYNTHETIC_SEED')), true);
  assert.equal(Q.esDeDemostracion(alimento('x')), false);
  // Ningún texto de Nutrición dice «%» (DJ-7).
  assert.doesNotMatch(JSON.stringify(Q.COPY_OPCION_EN_UN_CUADRO, (_, v) => (typeof v === 'function' ? v('x', 1) : v)), /%/);
});

test('ED-31 · «Guardar la opción» conserva la identidad que un guardado le dio con el cuadro abierto', () => {
  const copia = { label: 'Arroz', items: [Q.itemNuevo('arroz')] };
  assert.deepEqual(Q.opcionAlGuardar({ optionId: 'o9', label: 'Opción 1', items: [] }, copia), { ...copia, optionId: 'o9' });
  assert.equal(Q.opcionAlGuardar({ label: 'x', items: [] }, copia), copia);
  assert.deepEqual(Q.opcionAlGuardar({ optionId: 'o9', label: 'x', items: [] }, { ...copia, optionId: 'o1' }).optionId, 'o1');
  assert.deepEqual(Q.itemNuevo('arroz'), { catalogItemId: 'arroz', quantity: null, preparationState: null, note: null });
  assert.equal(Q.cambioLaOpcion({ label: 'a', items: [] }, { label: 'a', items: [] }), false);
  assert.equal(Q.cambioLaOpcion({ label: 'a', items: [] }, { label: 'b', items: [] }), true);
  assert.equal(Q.tituloDelCuadro('Almuerzo', 0), 'Almuerzo · opción 1');
  assert.equal(Q.subtituloDelCuadro('Día habitual', 3), 'Día habitual · se elige una de 3 opciones');
});

test('ED-31 · Enter suma el marcado y el cuadro sigue abierto; el borrador cambia solo con «Guardar la opción»', () => {
  const cuadro = leer('nutrition/cuadro-de-la-opcion.tsx');
  assert.match(cuadro, /role="combobox"/);
  assert.match(cuadro, /else if \(e\.key === 'Enter'\) \{\n\s+e\.preventDefault\(\);\n\s+if \(actual >= 0 && columna === 1\) alternar\(actual\);\n\s+else if \(actual >= 0\) elegir\(actual\);/);
  // Elegir vacía el campo y deja el foco adentro: no cierra nada.
  assert.match(cuadro, /alSumar\(r\.alimento\);\n\s+escribir\(''\);\n\s+campo\.current\?\.focus\(\);/);
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /m\.options\[k\] = opcionAlGuardar\(m\.options\[k\], copia\);/);
  assert.doesNotMatch(editor, /<AgregarItem/);
});

test('ED-31 (DL-109) · el cuadro deja marcar y quitar un habitual en cada resultado, sin un botón adentro de una opción', () => {
  const cuadro = leer('nutrition/cuadro-de-la-opcion.tsx');
  // La lista es una grilla: la estrella va en su propia celda, con su estado y el nombre del alimento en su rótulo.
  assert.match(cuadro, /aria-haspopup="grid"/);
  assert.match(cuadro, /role="grid"/);
  assert.doesNotMatch(cuadro, /role="option"/);
  assert.match(cuadro, /aria-pressed=\{esHabitual\}/);
  assert.match(cuadro, /aria-label=\{`\$\{esHabitual \? COPY_HABITUALES\.quitarMarca : COPY_HABITUALES\.marcar\}: \$\{r\.alimento\.name\}`\}/);
  assert.match(cuadro, /if \(r\) void habituales\.alternar\(r\.alimento\);/);
  // Una lectura que falló se dice, con «Reintentar»; un marcado que falló, también.
  assert.match(cuadro, /habituales\.lectura === 'falla' \? \(\n\s+<Aviso tipo="error">\n\s+<p>\{C\.habitualesNoSeLeyeron\(habituales\.motivoDeLectura\)\}<\/p>\n\s+<button type="button" className="boton boton--secundario" onClick=\{habituales\.recargar\}>/);
  assert.match(cuadro, /habituales\.fallo \? \(/);
  // Con el teclado: a la derecha se llega a la estrella solo con el cursor al final; a la izquierda se vuelve.
  assert.equal(Q.columnaTrasTecla(0, 'ArrowRight', true, true), 1);
  assert.equal(Q.columnaTrasTecla(0, 'ArrowRight', true, false), null);
  assert.equal(Q.columnaTrasTecla(0, 'ArrowRight', false, true), null);
  assert.equal(Q.columnaTrasTecla(1, 'ArrowLeft', true, false), 0);
  assert.equal(Q.columnaTrasTecla(0, 'ArrowLeft', true, true), null);
  assert.equal(Q.columnaTrasTecla(1, 'ArrowRight', true, true), null);
});

test('ED-31 · «Guardar la opción» aplica la regla del plan: sin nombre o con una cantidad ilegible no guarda, y lleva al campo', () => {
  const nombres = { arroz: 'Arroz', pollo: 'Pollo' };
  const item = (catalogItemId, value) => ({ catalogItemId, quantity: value === null ? null : { value, unit: 'g' } });
  assert.equal(Q.loQueNoDejaGuardarLaOpcion({ label: 'Almuerzo', items: [item('arroz', 100), item('pollo', null)] }, nombres), null);
  // «1o0» viaja como NaN: no se guarda, y se dice cuál.
  assert.deepEqual(Q.loQueNoDejaGuardarLaOpcion({ label: 'Almuerzo', items: [item('arroz', 100), item('pollo', Number.NaN)] }, nombres), { motivo: 'Hay una cantidad que no se entiende: Pollo.', fila: 1 });
  assert.deepEqual(Q.loQueNoDejaGuardarLaOpcion({ label: ' ', items: [item('pollo', Number.NaN)] }, nombres), { motivo: Q.COPY_OPCION_EN_UN_CUADRO.sinNombre, fila: null });
  const cuadro = leer('nutrition/cuadro-de-la-opcion.tsx');
  assert.match(cuadro, /apagado: impide\?\.motivo \?\? null,/);
  assert.match(cuadro, /alTocarApagado: \(\) => document\.getElementById\(impide && impide\.fila !== null \? `cuadro-item-\$\{impide\.fila\}-cantidad` : 'opcion-en-un-cuadro-nombre'\)\?\.focus\(\)/);
});

test('ED-31 · al volver de «Crearlo a mano» o de «Importarlo…», el foco vuelve al buscador, con lo buscado y lo agregado', () => {
  const cuadro = leer('nutrition/cuadro-de-la-opcion.tsx');
  assert.match(cuadro, /if \(modo === 'opcion' && modoAnterior\.current !== 'opcion'\) buscador\.current\?\.focus\(\);/);
  assert.match(cuadro, /<CrearManualmente id="opcion-crear-a-mano" nombreInicial=\{texto\.trim\(\)\}/);
  // Lo creado o importado se anuncia como lo elegido en el buscador: «Agregado: …».
  assert.match(cuadro, /setAgregado\(\(a\) => \(\{ nombre: e\.name, veces: \(a\?\.veces \?\? 0\) \+ 1 \}\)\);/);
  // Lo que cubren las opciones no se llama «rango»: no es un rango indicado por el profesional.
  assert.equal(Q.COPY_OPCION_EN_UN_CUADRO.rangoDe('Almuerzo'), 'Lo que cubren las opciones de Almuerzo');
});

test('ED-30 · «Agregar una opción» del paso 5 no toca el borrador hasta «Guardar la opción»: cancelar no deja una vacía', () => {
  assert.deepEqual(Q.opcionNueva(2), { label: 'Opción 3', items: [] });
  const pasos = leer('nutrition/pasos-del-asistente.tsx');
  assert.match(pasos, /onClick=\{\(\) => onAgregarOpcion\(i, j\)\}/);
  assert.doesNotMatch(pasos, /options\.push\(\{ label: `Opción/);
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /if \(m && nueva\) \{\n\s+if \(m\.options\.length < MAXIMO_DE_OPCIONES\) m\.options\.push\(copia\);/);
});

test('ED-31 · el cuadro calcula con las opciones de su propio día tipo, y lo que no se leyó todavía dice «leyendo»', () => {
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /otrasOpciones=\{otrasOpcionesDelCuadro\}/);
  assert.match(editor, /rangosDelDia\(diaDeLaOpcion, agregando\.i,/);
  // En el asistente se leen las composiciones de todos los días tipo; fuera de él, el que se mira y el del cuadro.
  assert.match(editor, /const dias = conTodosLosDias \? estructura : \[\.\.\.new Set\(\[diaMirado, diaDelCuadro\]\)\]/);
});

test('ED-32 · después de «Usar la versión N», la porción guardada de la versión anterior ya no cuenta', () => {
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /return recipeVersionId === undefined \|\| o\.recipe\?\.recipeVersionId === recipeVersionId \? o\.items : null;/);
  assert.doesNotMatch(editor, /\(id\) => itemsGuardados\(version, id\)/);
});

test('ED-30 · activar desde el paso 7 sale del asistente y muestra el plan activo', () => {
  const plan = leer('nutrition/plan.tsx');
  assert.match(plan, /ir\(\{ version: null, dia: null, comidas: null, asistente: null \}\);\n\s+void cargar\(\);/);
});

test('EDC-12 · un objetivo nuevo cuenta como algo por guardar recién cuando llega su relectura, y «Siguiente» la espera', () => {
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /const objetivoPorGuardar = objetivoPedido && !!version && !!objetivoVigente && objetivoVigente !== version\.objectiveVersionId;/);
  assert.match(editor, /habilitado: !!version && porGuardar && puedeGuardar/);
  assert.match(editor, /setObjetivoPedido\(true\);\n\s+return onObjetivoNuevo\(\);/);
  // Ya no se marca «sucio» antes de que llegue el objetivo nuevo: ese guardado saldría sin él.
  assert.doesNotMatch(editor, /setSucio\(true\);\n\s+onObjetivoNuevo\(\);/);
  const pasos = leer('nutrition/pasos-del-asistente.tsx');
  assert.match(pasos, /ocupado: releyendoElObjetivo \? C\.leyendoElObjetivoNuevo/);
  assert.match(leer('nutrition/plan.tsx'), /onObjetivoNuevo=\{\(\) => cargar\(false\)\}/);
  // El número de la versión cuenta todas las páginas; con la lista a medias, solo la fecha.
  assert.match(pasos, /todasLasPaginas\(\(f\) => api\.listarObjetivos\(token, asesoradoId, f\)\)/);
  assert.match(pasos, /r\.datos\.completa \? numeroDeLaVersionDelObjetivo/);
});

// ─── ED-32 · La foto después de guardar y «Usar la versión nueva» ──────────────────────────────────────────────────

const R = await import('../src/app/pro/advisees/nutrition/version-nueva-de-la-receta.ts');
const vigente = {
  recipeId: 'r1',
  recipeVersionId: 'rv3',
  versionNumber: 3,
  name: 'Tazón de yogur, avena y banana',
  servings: 2,
  ingredients: [
    { catalogItemId: 'yogur', name: 'Yogur', quantity: { value: 400, unit: 'g' } },
    { catalogItemId: 'avena', name: 'Avena', quantity: { value: 100, unit: 'g' } },
    { catalogItemId: 'banana', name: 'Banana', quantity: { value: 200, unit: 'g' } },
  ],
};

test('ED-32 · hay una versión nueva solo si es de la misma receta y más nueva que la citada', () => {
  assert.equal(R.hayVersionNueva({ recipeId: 'r1', versionNumber: 2 }, vigente), true);
  assert.equal(R.hayVersionNueva({ recipeId: 'r1', versionNumber: 3 }, vigente), false);
  assert.equal(R.hayVersionNueva({ recipeId: 'r2', versionNumber: 1 }, vigente), false);
  assert.equal(R.hayVersionNueva({ recipeId: 'r1', versionNumber: 1 }, null), false);
});

test('ED-32 · lo que cambia en una porción: lo que entra, lo que sale y las cantidades', () => {
  const porcion = R.porcionDe(vigente);
  assert.deepEqual(porcion.map((p) => [p.catalogItemId, p.cantidad.value]), [['yogur', 200], ['avena', 50], ['banana', 100]]);
  const antes = [
    { catalogItemId: 'yogur', nombre: 'Yogur', cantidad: { value: 200, unit: 'g' } },
    { catalogItemId: 'avena', nombre: 'Avena', cantidad: { value: 40, unit: 'g' } },
    { catalogItemId: 'miel', nombre: 'Miel', cantidad: { value: 10, unit: 'g' } },
  ];
  assert.deepEqual(R.cambiosEnUnaPorcion(antes, porcion), ['Avena: de 40 g a 50 g', 'Se suma Banana, 100 g', 'Sale Miel']);
  assert.deepEqual(R.cambiosEnUnaPorcion(porcion, porcion), ['Una porción tiene los mismos ingredientes y cantidades.']);
  // Sin la porción de ahora (la opción no se guardó), los ingredientes de la nueva.
  assert.deepEqual(R.cambiosEnUnaPorcion(null, porcion), ['Yogur, 200 g', 'Avena, 50 g', 'Banana, 100 g']);
  assert.deepEqual(R.cambiosEnUnaPorcion([], [{ catalogItemId: 'x', nombre: 'Sal', cantidad: { value: 0.25, unit: 'g' } }]), ['Se suma Sal, 0,3 g']);
});

test('ED-32 · usarla cambia solo la versión citada, y el nombre si era el de la receta (TEST-EDP-030: nunca sola)', () => {
  const citada = { name: 'Tazón de yogur' };
  assert.deepEqual(R.opcionConLaVersionNueva({ optionId: 'o1', label: 'Tazón de yogur', items: [], recipeVersionId: 'rv2' }, citada, vigente), {
    optionId: 'o1',
    label: 'Tazón de yogur, avena y banana',
    items: [],
    recipeVersionId: 'rv3',
  });
  assert.equal(R.opcionConLaVersionNueva({ label: 'Merienda dulce', items: [], recipeVersionId: 'rv2' }, citada, vigente).label, 'Merienda dulce');
  const editor = leer('nutrition/editor.tsx');
  // Se pasa a pedido, y solo si la opción sigue citando la versión que se miró.
  assert.match(editor, /if \(op\?\.recipeVersionId === v\.citada\.recipeVersionId\) x\[i\]!\.meals\[j\]!\.options\[k\] = opcionConLaVersionNueva\(op, v\.citada, v\.vigente\);/);
});

test('ED-32 · guardada la receta, el cuadro pasa a la foto (opcional) y vuelve al plan con lo que pasó', () => {
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /pasarALaFoto\(r, COPY_RECETA_NUEVA\.agregada\(r\.name, res\.k, recetaNueva\.nombre\)\);/);
  assert.match(editor, /pasarALaFoto\(r, COPY_RECETA_NUEVA\.soloGuardada\(r\.name\)\);/);
  assert.match(editor, /principal=\{fotoDeLaReceta \? \{ texto: COPY_FOTO_DE_LA_RECETA\.listo, alTocar: cerrarLaRecetaNueva \} : null\}/);
  assert.match(editor, /<ImagenDeReceta\n\s+token=\{token\}\n\s+receta=\{fotoDeLaReceta\.receta\}/);
});

// ─── ED-21 · «Crear un ejercicio propio», con los parecidos del catálogo antes de crear ────────────────────────────

const E = await import('../src/app/pro/advisees/training/parecidos-del-catalogo.ts');
const ej = (versionId, name) => ({ versionId, name });

test('ED-21 · qué se busca: el nombre entero y, si hace falta, su palabra más larga', () => {
  assert.deepEqual(E.busquedasDeParecidos('  Sentadilla   búlgara con mancuernas '), { principal: 'Sentadilla búlgara con mancuernas', otra: 'sentadilla' });
  assert.deepEqual(E.busquedasDeParecidos('Remo'), { principal: 'Remo', otra: null });
  assert.equal(E.haySugerencias('ab'), false);
  assert.equal(E.haySugerencias('a b c'), true);
});

test('ED-21 · los parecidos van del más al menos parecido, sin repetir, hasta cinco; los que no comparten nada, no', () => {
  const candidatos = [ej('1', 'Press de banca'), ej('2', 'Sentadilla búlgara'), ej('3', 'Sentadilla'), ej('2', 'Sentadilla búlgara'), ej('4', 'Sentadilla búlgara con mancuernas')];
  assert.deepEqual(E.parecidos('sentadilla bulgara con mancuernas', candidatos).map((c) => c.versionId), ['4', '2', '3']);
  assert.deepEqual(E.parecidos('Remo', candidatos), []);
  const muchos = Array.from({ length: 8 }, (_, n) => ej(String(n), `Curl ${n}`));
  assert.equal(E.parecidos('curl', muchos).length, 5);
  // «con», «de» y «la» no cuentan.
  assert.deepEqual(E.palabrasQueCuentan('Press de la banca con barra'), ['press', 'banca', 'barra']);
});

test('ED-21 · uno que se llama igual se dice aparte y crear otro pide «Crear igual»; nada se crea solo', () => {
  assert.deepEqual(E.elQueSeLlamaIgual('sentadilla BÚLGARA', [ej('2', 'Sentadilla búlgara')]), ej('2', 'Sentadilla búlgara'));
  assert.equal(E.elQueSeLlamaIgual('Sentadilla', [ej('2', 'Sentadilla búlgara')]), null);
  const agregar = leer('training/agregar-ejercicio.tsx');
  assert.match(agregar, /\{creando \? 'Creando…' : igual \? EP\.crearIgual : EP\.crearYMarcar\}/);
  // Elegir un parecido lo marca (como lo creado): entra con «Agregar», nunca solo (EDT-17).
  assert.match(agregar, /onClick=\{\(\) => onCreado\(p\)\}/);
});

// ─── ED-30 · El asistente de Nutrición ─────────────────────────────────────────────────────────────────────────────

const N = await import('../src/app/pro/advisees/nutrition/asistente-de-nutricion.ts');
const opcion = (items, recipeVersionId) => ({ label: 'Opción 1', items, ...(recipeVersionId ? { recipeVersionId } : {}) });
const comida = (label, opciones) => ({ label, options: opciones });

test('ED-30 · el paso sugerido sale del borrador: nunca el 1, el 2 ni el 7', () => {
  assert.equal(N.pasoQueSigueEnNutricion([]), 3);
  assert.equal(N.pasoQueSigueEnNutricion([{ label: 'Día habitual', meals: [] }]), 4);
  assert.equal(N.pasoQueSigueEnNutricion([{ label: 'D', meals: [comida('Almuerzo', [opcion([])])] }]), 5);
  assert.equal(N.pasoQueSigueEnNutricion([{ label: 'D', meals: [comida('Almuerzo', [])] }]), 5);
  // Una opción de receta trae sus alimentos al guardar: no cuenta como vacía.
  assert.equal(N.pasoQueSigueEnNutricion([{ label: 'D', meals: [comida('Almuerzo', [opcion([], 'rv1')]), comida('Cena', [opcion([{}])])] }]), 6);
  assert.deepEqual([...N.PASOS_DE_NUTRICION], ['Punto de partida', 'Objetivo', 'Días tipo', 'Comidas', 'Opciones', 'Revisar', 'Activar']);
});

test('ED-30 · «Lo que llevás armado», en pocas líneas', () => {
  assert.deepEqual(N.loQueLlevasArmadoEnNutricion([]), ['0 días tipo · 0 comidas', 'Todavía sin días tipo.']);
  assert.deepEqual(
    N.loQueLlevasArmadoEnNutricion([
      { label: 'Día habitual', meals: [comida('Desayuno', [opcion([{}]), opcion([])]), comida('Almuerzo', [opcion([])])] },
      { label: '', meals: [] },
    ]),
    ['2 días tipo · 2 comidas', 'Día habitual · 2 comidas · 3 opciones · 2 sin alimentos', 'Día tipo 2 · sin comidas'],
  );
});

test('TEST-EDP-027 · el objetivo general con su versión; sin «%» en el asistente; sin objetivo no hay paso 2', () => {
  const versiones = [
    { objectiveId: 'o1', versionId: 'v2', createdAt: '2026-11-10T10:00:00Z' },
    { objectiveId: 'o1', versionId: 'v1', createdAt: '2026-10-01T10:00:00Z' },
    { objectiveId: 'o2', versionId: 'w1', createdAt: '2026-09-01T10:00:00Z' },
    { objectiveId: 'o1', versionId: 'v3', createdAt: '2026-11-11T10:00:00Z' },
  ];
  assert.equal(N.numeroDeLaVersionDelObjetivo(versiones, 'v2'), 2);
  assert.equal(N.numeroDeLaVersionDelObjetivo(versiones, 'v3'), 3);
  assert.equal(N.numeroDeLaVersionDelObjetivo(versiones, 'nada'), null);
  assert.equal(N.COPY_ASISTENTE_DE_NUTRICION.versionYFecha(3, 'martes 10 de noviembre'), 'Versión 3, vigente desde el martes 10 de noviembre.');
  const textos = JSON.stringify(N.COPY_ASISTENTE_DE_NUTRICION, (_, v) => (typeof v === 'function' ? v(1, 'x') : v));
  assert.doesNotMatch(textos, /%/);
  assert.doesNotMatch(leer('nutrition/pasos-del-asistente.tsx'), /%/);
  // El paso 1 solo se ofrece con un objetivo del que nacer; sin él, empieza por la evaluación.
  const plan = leer('nutrition/plan.tsx');
  assert.match(plan, /const conElAsistente = sePuedeCrear && pasoPedido\(parametros\.get\('asistente'\)\) !== null;/);
  assert.match(plan, /parametros\.get\('asistente'\) && !objetivo && !borrador && !faltan\.objetivo \? \(\n\s+<Aviso tipo="info">\n\s+<p>\{CAN\.sinObjetivo\}<\/p>/);
});

test('ED-30 · los pasos 2 a 7 van sobre el mismo borrador; «Siguiente» guarda y espera (TEST-EDP-017)', () => {
  const pasos = leer('nutrition/pasos-del-asistente.tsx');
  assert.match(pasos, /const r = await sePuedeAvanzar\(\{ sucio, guardando, guardar \}\);/);
  assert.match(pasos, /if \(r === 'no-avanza'\) return setNoAvanzo\(true\);/);
  // El paso 5 arma cada opción en su cuadro (ED-31).
  assert.match(pasos, /onClick=\{\(\) => onAbrirOpcion\(i, j, k\)\}/);
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /onAbrirOpcion=\{\(di, j, k\) => setAgregando\(\{ i: di, j, k \}\)\}/);
  assert.match(editor, /<div className="editor-de-nutricion__zonas" hidden=\{enElAsistente\}>/);
  // Corregir desde «Revisar» sale del asistente a la estación.
  assert.match(editor, /ir\(\{ asistente: null, dia: pedidoDeLaPosicion\(l\.dia\)/);
});
