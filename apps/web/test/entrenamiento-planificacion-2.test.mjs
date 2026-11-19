/**
 * WP-ENTRENAMIENTO-PLANIFICACION, tramo 2 (§6 y §7 del documento del paquete) · el editor del plan de Entrenamiento del
 * profesional: las bajas de la revisión adversaria que pesan para el profesional (el preset con la sesión vacía, el tope
 * de los bloques, los bloques en la versión activa y en lo compartido) y las sugerencias C5 a C9 y C11 de Dirección. Lo
 * puro se prueba con datos; de las pantallas se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const T = await import('../src/app/pro/advisees/topes-del-plan.ts');
const L = await import('../src/app/pro/advisees/training/bloques-en-la-lectura.ts');
const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = fuente('../src/app/pro/advisees/training/editor.tsx');
const GALERIA = fuente('../src/app/pro/advisees/galeria-de-presets.tsx');
const ESTRUCTURA = fuente('../src/app/pro/advisees/training/estructura-del-plan.tsx');
const COMPARTIDO = fuente('../src/app/pro/advisees/seguimiento/plan-compartido.tsx');

/** El máximo de un arreglo del contrato (zod 4), también si es opcional. */
function maximo(esquema) {
  let s = esquema;
  while (s._def.innerType) s = s._def.innerType;
  return s._def.checks.find((c) => c._zod.def.check === 'max_length')._zod.def.maximum;
}

// ─── §7 · los bloques en la versión activa y en el plan compartido ────────────────────────────────────────────

const leido = (order, exerciseGroupId = null) => ({ order, exerciseGroupId, prescriptionId: `p${order}` });
const enPalabras = (partes) => partes.map((x) => (x.tipo === 'suelto' ? `${x.ejercicio.order}` : `[${x.encabezado.nombre}: ${x.ejercicios.map((e) => e.order).join(' ')}]`));

test('§7 · la versión activa y lo compartido agrupan bajo su bloque, en el orden de la sesión', () => {
  const sesion = {
    // Llegan por `order`, no en el orden del arreglo.
    prescriptions: [leido(4), leido(2, 'g-1'), leido(1), leido(3, 'g-1'), leido(5, 'g-9')],
    exerciseGroups: [
      { groupId: 'g-2', label: 'Vacío', order: 2, kind: 'SEQUENTIAL', rounds: null, restAfterRoundSeconds: null },
      { groupId: 'g-1', label: 'Pierna', order: 1, kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 },
    ],
  };
  // El bloque vacío no se muestra; el que nombra un bloque que la sesión no tiene va suelto, a la vista.
  assert.deepEqual(enPalabras(L.partesParaLeer(sesion)), ['1', '[Pierna: 2 3]', '4', '5']);
  const bloque = L.partesParaLeer(sesion).find((x) => x.tipo === 'bloque');
  assert.equal(bloque.encabezado.detalle, 'En vueltas · se alternan 2 ejercicios · 3 vueltas · 90 s de descanso al terminar cada vuelta');
  assert.equal(bloque.encabezado.etiqueta, 'Bloque Pierna, en vueltas, se alternan 2 ejercicios, 3 vueltas, 90 s de descanso al terminar cada vuelta, 2 ejercicios.');
  // Sin bloques, la lista de siempre.
  assert.deepEqual(enPalabras(L.partesParaLeer({ prescriptions: [leido(2), leido(1)] })), ['1', '2']);
});

test('§7 · el encabezado describe y no le indica a nadie: lo leen profesionales', () => {
  const g = (x) => ({ groupId: 'g', label: '', kind: 'ROUNDS', rounds: 4, restAfterRoundSeconds: 0, ...x });
  assert.equal(L.detalleDelBloqueLeido(g(), 3), 'En vueltas · se alternan 3 ejercicios · 4 vueltas · sin pausa al terminar cada vuelta');
  assert.equal(L.detalleDelBloqueLeido(g({ restAfterRoundSeconds: null, rounds: 1 }), 2), 'En vueltas · se alternan 2 ejercicios · 1 vuelta');
  assert.equal(L.detalleDelBloqueLeido(g({ kind: 'SEQUENTIAL' }), 2), null);
  assert.equal(L.encabezadoLeido(g({ kind: 'SEQUENTIAL' }), 1, 1).nombre, 'Bloque 2');
  assert.equal(L.encabezadoLeido(g({ kind: 'SEQUENTIAL' }), 1, 1).etiqueta, 'Bloque 2, 1 ejercicio.');
  for (const x of [L.detalleDelBloqueLeido(g(), 2), L.encabezadoLeido(g(), 0, 2).etiqueta]) assert.doesNotMatch(x, /Alterná|descansá/);
});

test('§7 · las dos lecturas usan la misma regla (la del dominio, como el editor y la APK)', () => {
  assert.match(ESTRUCTURA, /\{partesParaLeer\(sesion\)\.map\(\(parte\) =>/);
  assert.match(ESTRUCTURA, /<BloqueDelPlan key=\{parte\.encabezado\.groupId\}/);
  assert.match(ESTRUCTURA, /nivel=\{nivel === 3 \? 4 : 5\}/, 'los ejercicios del bloque, un nivel de título más');
  assert.match(COMPARTIDO, /\{partesParaLeer\(s\)\.map\(\(parte\) =>/);
  assert.match(COMPARTIDO, /className="plan-compartido__bloque-de-la-sesion"/);
});

// ─── §7 · el tope de los bloques de la sesión ───────────────────────────────────────────────────────────────

test('§7 · «Agregar bloque» tiene el tope del contrato (20) y lo dice antes: el bloque 21 lo rechazaba el servidor', () => {
  assert.equal(T.TOPES_DE_ENTRENAMIENTO.bloquesDeLaSesion, maximo(d.SesionEntradaSchema.shape.exerciseGroups));
  assert.equal(T.motivoSinAgregarBloque(19), null);
  assert.equal(T.motivoSinAgregarBloque(20), 'Una sesión admite hasta 20 bloques: para otro, quitá uno.');
  const grupos = (n) => Array.from({ length: n }, (_, i) => ({ groupId: `g-${i + 1}` }));
  assert.deepEqual(T.topesPasadosDeEntrenamiento([{ sessions: [{ prescriptions: [], exerciseGroups: grupos(20) }] }]), []);
  assert.deepEqual(T.topesPasadosDeEntrenamiento([{ sessions: [{ prescriptions: [], exerciseGroups: grupos(21) }] }]), [{ code: T.TOPE.bloquesDeLaSesion, path: 'blocks[0].sessions[0]' }]);
  assert.match(EDITOR, /const sinAgregarBloque = sesion \? motivoSinAgregarBloque\(sesion\.exerciseGroups\?\.length \?\? 0\) : null;/);
  assert.match(EDITOR, /aria-disabled=\{sinAgregarBloque \? true : undefined\}/);
  assert.match(EDITOR, /data-tope-de-bloques/);
});

// ─── §7 · ENP-D17 y ENP-D18: el preset con la sesión vacía, atado a la sesión y dicho como es ──────────────────

test('ENP-D18 · el preset de la sesión vacía se recuerda por el identificador de la sesión, no por su lugar', () => {
  assert.match(EDITOR, /const claveDeEstaSesion = sesion\?\.sessionId \?\? null;/);
  assert.doesNotMatch(EDITOR, /const claveDeEstaSesion = `\$\{prefijo\}-s\$\{k\}`/, 'por la posición, quitar o mover otra sesión le pasaba la etiqueta a la que quedaba en su lugar');
  // Una sesión sin identificador (una habitual recién insertada) lo recibe al elegir el preset.
  assert.match(EDITOR, /const clave = sesion\.sessionId \?\? crypto\.randomUUID\(\);\n\s*if \(!sesion\.sessionId\) cambiarLaSesion\(\(s\) => \(\{ \.\.\.s, sessionId: clave \}\)\);/);
});

test('ENP-D17 · una sesión nueva nace con su identificador, como las de «Duplicar el día» (el contrato lo admite)', () => {
  assert.match(EDITOR, /const sesionVacia = \(n: number\): SesionE => \(\{ sessionId: crypto\.randomUUID\(\),/);
  // El contrato lo admite: un identificador de nodo, que el servidor conserva al normalizar.
  assert.equal(d.IdDeNodoSchema.safeParse('3f2c7a4e-9b1d-4c2a-8e5f-0a1b2c3d4e5f').success, true);
  const r = d.normalizarEstructuraDeEntrenamiento({ blocks: [{ label: 'Fase 1', sessions: [{ sessionId: 'mio-1', label: 'Sesión A', prescriptions: [] }] }] }, () => 'del-servidor');
  assert.equal(r.ok, true);
  assert.equal(r.contenido.blocks[0].sessions[0].sessionId, 'mio-1');
});

test('ENP-D18 · el texto dice la verdad: vive en esta pantalla hasta agregar ejercicios; no «queda como su prescripción»', () => {
  const todo = `${EDITOR}\n${GALERIA}`;
  assert.doesNotMatch(todo, /queda como su prescripción/);
  assert.match(EDITOR, /dondeVive: 'Vive en esta pantalla: se escribe en cada ejercicio al agregarlo\. Si cerrás o recargás el editor antes, no queda\.'/);
  assert.match(EDITOR, /data-donde-vive-el-preset/);
  assert.match(GALERIA, /No queda guardado en el plan hasta entonces\./);
});

// ─── C9 · guardar y revisar encadenados: «Ir a…» al campo exacto y la vuelta con el contexto ───────────────────

const I = await import('../src/app/pro/advisees/training/ir-al-campo.ts');
const R = await import('../src/app/pro/advisees/revisar-el-plan.ts');
const REVISION = fuente('../src/app/pro/advisees/training/revision-del-plan.tsx');
const EJERCICIO = fuente('../src/app/pro/advisees/training/ejercicio-del-editor.tsx');

test('C9 · «Ir a…» lleva al campo exacto: el de la serie, el del criterio, «Agregar serie»; el renglón queda de ancla', () => {
  const ej = 'b0-s1-p2';
  const ruta = 'blocks[0].sessions[1].prescriptions[2]';
  const campos = (code, path, serie = null) => I.camposDelProblema({ code, path }, ej, serie);
  const ancla = 'abrir-ejercicio-b0-s1-p2';
  // Lo que dice la API, por la ruta.
  assert.deepEqual(campos('SET_RIR_OUT_OF_RANGE', `${ruta}.sets[3].rir`, 3), [`${ej}-serie-3-rir`, ancla]);
  assert.deepEqual(campos('WARM_UP_AFTER_WORKING_SET', `${ruta}.sets[1].setKind`, 1), [`${ej}-serie-1-calentamiento`, ancla]);
  assert.deepEqual(campos('INTENSITY_TARGET_OUT_OF_RANGE', `${ruta}.intensity.target.value`), [`${ej}-objetivo`, `${ej}-criterio`, ancla]);
  assert.deepEqual(campos('INTENSITY_CRITERIA_COMBINED', `${ruta}.intensity.criterion`), [`${ej}-criterio`, ancla]);
  assert.deepEqual(campos('INTENSITY_TARGET_OUT_OF_RANGE', 'changes.blocks.0.sessions.1.prescriptions.2.intensity.target.value'), [`${ej}-objetivo`, `${ej}-criterio`, ancla], 'también con la ruta del pedido');
  // Sin el criterio RIR, la columna del RIR no está: el criterio, después.
  assert.deepEqual(campos('SET_RIR_WITHOUT_RIR_CRITERION', `${ruta}.sets[0].rir`, 0), [`${ej}-serie-0-rir`, `${ej}-criterio`, ancla]);
  // Lo que ve el editor, por el código; lo que queda sin completar, donde se completa.
  assert.deepEqual(campos(d.PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO.rirIlegible, `${ruta}.sets[2]`, 2), [`${ej}-serie-2-rir`, ancla]);
  assert.deepEqual(campos('INCOMPLETO_SIN_REPETICIONES', `${ruta}.sets[2].repetitions`, 2), [`${ej}-serie-2`, ancla]);
  assert.deepEqual(campos('INCOMPLETO_SIN_SERIES', ruta), [`${ej}-agregar-serie`, ancla]);
  assert.equal(R.INCOMPLETO.sinSeries, 'INCOMPLETO_SIN_SERIES', 'la constante de `ir-al-campo.ts` es la de lo incompleto');
  assert.deepEqual(campos(d.PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO.parametroIncompleto, `${ruta}.professionalParameters[1]`), [`${ej}-param-1-etiqueta`, ancla]);
  assert.deepEqual(campos('EXERCISE_NOT_AVAILABLE', `${ruta}.exerciseVersionId`), [ancla]);
  // Los campos que nombra existen en el ejercicio.
  for (const id of ['-serie-${n}-calentamiento', '-agregar-serie', '-criterio', '-objetivo', '-linea']) assert.ok(EJERCICIO.includes(id) || fuente('../src/app/pro/advisees/training/linea-de-prescripcion.tsx').includes(id), id);
});

test('C9 · el foco espera a que el ejercicio esté abierto y elige el primer campo dibujado', () => {
  const dibujados = new Set(['abrir-ejercicio-x', 'x-criterio']);
  const existe = (id) => dibujados.has(id);
  assert.equal(I.campoParaEnfocar(['x-serie-0-rir', 'x-criterio', 'abrir-ejercicio-x'], existe, () => false), null, 'cerrado todavía: no salta al renglón antes de tiempo');
  assert.equal(I.campoParaEnfocar(['x-serie-0-rir', 'x-criterio', 'abrir-ejercicio-x'], existe, () => true), 'x-criterio');
  assert.equal(I.campoParaEnfocar(['menu-de-la-sesion'], () => true, () => false), 'menu-de-la-sesion', 'un campo solo, apenas existe');
  assert.match(EDITOR, /setParaEnfocar\(camposDelProblema\(p, `b\$\{l\.bloque\}/);
  assert.match(EDITOR, /p\.code === 'PRESCRIPTION_REQUIRED' \? 'agregar-ejercicios-a-la-sesion'/);
  assert.match(EDITOR, /id="agregar-ejercicios-a-la-sesion"/);
});

test('C9 · al volver a la revisión se conserva el contexto: la fecha elegida en el cuadro, el panel en su pestaña', () => {
  // Se cierra el cuadro y se va al problema (TEST-EDP-008); la fecha elegida es la del dibujo en que se tocó «Ir a…».
  assert.match(EDITOR, /cerrarAntesDeActivar\(\);\n\s*irAlProblema\(p\);\n(?:\s*\/\/.*\n)*\s*setVolverALaRevision\(\{ desde: 'cuadro', cuando \}\);/);
  assert.match(EDITOR, /if \(v\.desde === 'cuadro'\) return abrirElCuadro\(v\.cuando\);/);
  assert.match(EDITOR, /setCuando\(previa \?\? eleccionAlActivar\(version\.nextReviewAt\)\);/);
  // Desde el panel, que a menos de 1440 está encima de la sesión y tapaba el campo, «Ir a…» lo cierra.
  assert.match(EDITOR, /const irDesdeElPanel = \(p: ValidationIssue\) => \{\n\s*setPanelAbierto\(false\);/);
  assert.match(EDITOR, /data-volver-a-la-revision=\{volverALaRevision\.desde\}/);
  assert.match(EDITOR, /onClick=\{abrirAntesDeActivar\}/, 'la barra sigue abriendo el cuadro con la fecha guardada');
});

test('C9 · «Revisar ahora» sigue apagado con el autoguardado en curso (§7) y lo dice a la vista: la revisión sigue sola', () => {
  assert.match(EDITOR, /const motivoSinRevisar = sucio \? sinGuardarAhora : null;/);
  assert.match(REVISION, /<p id=\{motivoId\} className="nota" data-motivo-sin-revisar>\n\s*\{guardando \? COPY_REVISION_DEL_PLAN\.seRevisaAlGuardar : motivoSinRevisar\}/);
  assert.doesNotMatch(REVISION, /<span id=\{motivoId\} className="visualmente-oculto">/, 'el motivo no queda solo para el lector');
  assert.match(EDITOR, /guardando=\{guardando\} onRevisar=\{\(\) => void revisarAhora\(\)\}/);
});

// ─── C7 · la escritura rápida: su rótulo, «Aplicar», lo escrito sin aplicar y el cambio de criterio ────────────

const ER = await import('../src/app/pro/advisees/training/escritura-rapida.ts');
const CC = await import('../src/app/pro/advisees/training/cambio-de-criterio.ts');
const LINEA = fuente('../src/app/pro/advisees/training/linea-de-prescripcion.tsx');

test('C7 · la escritura rápida lleva su rótulo, su lectura en vivo y «Aplicar» a la vista; Enter sigue aplicando', () => {
  assert.equal(ER.COPY_ESCRITURA_RAPIDA.rotulo, 'Escritura rápida');
  assert.match(LINEA, /<label htmlFor=\{`\$\{id\}-linea`\} className="linea-de-prescripcion__rotulo">\n\s*\{E\.rotulo\}/);
  assert.doesNotMatch(LINEA, /className="visualmente-oculto">\n\s*\{C\.rotulo\}/, 'el rótulo ya no queda solo para el lector');
  assert.match(LINEA, /data-aplicar-la-linea\n\s*aria-disabled=\{sinAplicar \? true : undefined\}/);
  assert.match(LINEA, /if \(e\.key !== 'Enter'\) return;\n\s*e\.preventDefault\(\);\n\s*aplicar\(\);/);
  assert.match(LINEA, /data-lectura-de-la-linea/);
  assert.match(LINEA, /placeholder="Ej\.: 4×8-12 RIR 2 · 60 kg · 90 s"/, 'el ejemplo no se lee como algo ya cargado');
});

test('C7 · lo escrito sin aplicar vive por ejercicio: sobrevive al plegar, a otra sesión y al guardado que da el identificador', () => {
  assert.equal(ER.claveDeLaLinea('b0-s1', 2, null), 'pos:b0-s1-p2');
  assert.equal(ER.claveDeLaLinea('b0-s1', 2, 'abc'), 'id:abc');
  assert.deepEqual(ER.conLaLinea({ 'pos:b0-s0-p0': '4×8' }, 'pos:b0-s0-p0', '  '), {}, 'vacío es nada');
  const enviados = [{ sessions: [{ prescriptions: [{ prescriptionId: 'x' }, {}] }] }, { microcycles: [{ sessions: [{ prescriptions: [{}] }] }] }];
  const guardados = [{ sessions: [{ prescriptions: [{ prescriptionId: 'x' }, { prescriptionId: 'nuevo' }] }] }, { microcycles: [{ sessions: [{ prescriptions: [{ prescriptionId: 'otro' }] }] }] }];
  const lineas = { 'id:x': '3×5', 'pos:b0-s0-p1': '4×8-12 RIR 2', 'pos:b1-m0-s0-p0': '2×10', 'id:quitado': 'ya no está' };
  assert.deepEqual(ER.lineasConLosIdentificadores(lineas, enviados, guardados), { 'id:x': '3×5', 'id:nuevo': '4×8-12 RIR 2', 'id:otro': '2×10', 'id:quitado': 'ya no está' });
  // Lo pendiente: con su lugar, en el orden del plan; lo de un ejercicio que ya no está no se lista.
  assert.deepEqual(ER.lineasPendientes(ER.lineasConLosIdentificadores(lineas, enviados, guardados), guardados), [
    { clave: 'id:x', texto: '3×5', ruta: 'blocks[0].sessions[0].prescriptions[0]' },
    { clave: 'id:nuevo', texto: '4×8-12 RIR 2', ruta: 'blocks[0].sessions[0].prescriptions[1]' },
    { clave: 'id:otro', texto: '2×10', ruta: 'blocks[1].microcycles[0].sessions[0].prescriptions[0]' },
  ]);
  // El editor la lleva por ejercicio, en la estación y en el paso 4, y la migra en los dos caminos del guardado.
  assert.match(EDITOR, /lineaSinAplicar=\{lineas\[claveDeSuLinea\] \?\? ''\}/);
  assert.equal((EDITOR.match(/setLineas\(\(m\) => lineasConLosIdentificadores\(m, bloquesEnviados, aEntrada\(/g) ?? []).length, 2);
  assert.match(EJERCICIO, /\{!abierto && lineaSinAplicar\.trim\(\) !== '' \? \(\n\s*<span className="etiqueta-de-dato ejercicio-del-editor__sin-aplicar" data-linea-sin-aplicar>/, 'plegado, se dice');
});

test('C7 · lo escrito sin aplicar se resuelve antes de salir: se pregunta, no se pierde', () => {
  assert.match(EDITOR, /useCambiosSinGuardar\(lineasSinAplicar\.length > 0, COPY_ESCRITURA_RAPIDA\.alSalir\);/, 'salir o recargar pregunta');
  assert.match(EDITOR, /\.\.\.sinAplicar\.map\(\(x\) => conSuLugar\(x\.issue, x\.texto\)\),/, '«Antes de activar» no deja activar sin resolverlo');
  assert.match(EDITOR, /\.\.\.sinAplicar\.map\(\(x\) => \(\{ \.\.\.impedimento\(x\.issue\), texto: x\.texto \}\)\),/, 'el panel lo dice con «Ir a…»');
  assert.deepEqual(I.camposDelProblema({ code: I.SIN_APLICAR, path: 'blocks[0].sessions[0].prescriptions[1]' }, 'b0-s0-p1', null), ['b0-s0-p1-linea', 'abrir-ejercicio-b0-s0-p1']);
  assert.equal(ER.COPY_ESCRITURA_RAPIDA.pendiente(' 4×8 '), 'tiene escritura rápida sin aplicar («4×8»): aplicala o borrala');
  // No es parte del plan: no impide guardar.
  assert.doesNotMatch(EDITOR, /const loQueNoDejaGuardar = \(bloques: Bloques\) => \[[^\n]*lineas/);
});

test('C7 · cambiar de RIR a % RM dice qué se quita y se puede deshacer; sin nada que perder, no dice nada', () => {
  const conRir = { intensity: { criterion: 'RIR', target: { value: 2, reference: null } }, sets: [{ rir: 1 }, { rir: null }, {}, { rir: 3 }] };
  assert.equal(CC.loQueSeQuitaAlCambiarElCriterio(conRir, 'PERCENT_RM'), 'Al pasar a % RM se quitaron el objetivo RIR 2 y el RIR propio de 3 series. Falta escribir el objetivo de % RM.');
  assert.equal(CC.loQueSeQuitaAlCambiarElCriterio(conRir, ''), 'Al dejarlo sin criterio se quitaron el objetivo RIR 2 y el RIR propio de 3 series.');
  assert.equal(CC.loQueSeQuitaAlCambiarElCriterio(conRir, 'RIR'), null, 'el mismo criterio no cambia nada');
  const conRm = { intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM de octubre' } } }, sets: [{}] };
  assert.equal(CC.loQueSeQuitaAlCambiarElCriterio(conRm, 'RIR'), 'Al pasar a RIR se quitaron el objetivo 75 % RM y la referencia del % RM. Falta escribir el objetivo de RIR.');
  assert.equal(CC.loQueSeQuitaAlCambiarElCriterio({ intensity: { criterion: 'RIR', target: { value: Number.NaN } }, sets: [{}] }, 'PERCENT_RM'), null, 'nada que perder: sin aviso');
  assert.equal(CC.loQueSeQuitaAlCambiarElCriterio({ intensity: null, sets: [{}] }, 'RIR'), null);
  // «Deshacer» devuelve el criterio, el objetivo y el RIR de cada serie (también «Sin objetivo»), también después de un
  // guardado que rehízo la prescripción, y no toca las series que se sumaron.
  const cambio = CC.cambioDeCriterio(conRir, 'PERCENT_RM');
  const despues = { ...conRir, ...CC.conElCriterio(conRir, 'PERCENT_RM') };
  assert.deepEqual(despues.sets, [{}, {}, {}, {}]);
  assert.equal(CC.sigueElCambio(structuredClone(despues), cambio), true);
  const deshecho = CC.deshacerElCambioDeCriterio({ ...despues, sets: [...despues.sets, { repetitions: { value: 8 } }] }, cambio);
  assert.deepEqual(deshecho, { intensity: conRir.intensity, sets: [{ rir: 1 }, { rir: null }, {}, { rir: 3 }, { repetitions: { value: 8 } }] });
  assert.equal(CC.sigueElCambio({ ...despues, intensity: { criterion: 'RIR', target: { value: 1 } } }, cambio), false, 'otro criterio lo retira');
  // De % RM a RIR, con un RIR escrito después en una serie: deshacer vuelve a % RM y ninguna serie queda con RIR (sería un
  // segundo criterio, REG-06-128).
  const aRir = CC.cambioDeCriterio(conRm, 'RIR');
  const conUnRir = { ...conRm, ...CC.conElCriterio(conRm, 'RIR'), sets: [{ rir: 2 }] };
  assert.deepEqual(CC.deshacerElCambioDeCriterio(conUnRir, aRir), { intensity: conRm.intensity, sets: [{}] });
  assert.match(EJERCICIO, /setCambio\(cambioDeCriterio\(p, c\)\);\n\s*onCambiar\(conElCriterio\(p, c\)\);/);
  assert.match(EJERCICIO, /onCambiar\(deshacerElCambioDeCriterio\(p, avisoDelCambio\)\);/);
  assert.match(EJERCICIO, /data-cambio-de-criterio/);
});

// ─── C5 · los días en un solo lugar, con «Ver próximas fechas» a pedido ────────────────────────────────────────

const AGENDA = fuente('../src/app/pro/advisees/training/agenda-del-plan.tsx');

test('C5 · los días se eligen en un solo lugar: los chips junto a cada sesión', () => {
  // La agenda ya no tiene su tabla de días por sesión, ni los elige.
  assert.doesNotMatch(AGENDA, /agenda-del-plan__semana|const alternarDia = /);
  assert.doesNotMatch(AGENDA, /export function AgendaDelPlan/);
  // El editor elige los días solo en los chips (la estación y el paso 5 del asistente usan los mismos).
  assert.equal((EDITOR.match(/alternarDia\(/g) ?? []).length, 1);
  assert.match(EDITOR, /\{\/\* ED-24 y C5: los días en siete chips, el único lugar donde se eligen/);
  // Arriba de la sesión, ni la tira de la semana suelta ni «Días de entrenamiento»; en el selector de la sesión, tampoco.
  assert.doesNotMatch(EDITOR, /<AgendaDelPlan/);
  assert.doesNotMatch(EDITOR, /data-dias-de-la-sesion|C\.sinDiaAsignado/);
  // El renglón de la sesión no repite los días que dicen sus chips.
  assert.doesNotMatch(EDITOR, /dias\.length > 0 \? dias\.map\(\(d\) => DIA_LARGO\[d\]\)\.join\(', '\) : CE\.sinDia/);
});

test('C5 · «Ver próximas fechas» a pedido, desde la lista de sesiones: el inicio, la semana con «Duplicar el día» y las dos semanas', () => {
  assert.match(EDITOR, /data-ver-proximas-fechas/);
  assert.match(EDITOR, /\{fechasAbiertas \? COPY_PROXIMAS_FECHAS\.ocultar : COPY_PROXIMAS_FECHAS\.ver\}/);
  assert.match(EDITOR, /\{fechasAbiertas && agendaConDias \? \(\n\s*<ProximasFechas/);
  // La tira de la semana, con «Duplicar el día» (ED-24), va adentro: no se perdió nada.
  assert.match(EDITOR, /semana=\{\n\s*<ol className="estacion__tira" aria-label=\{CE\.semana\}>/);
  assert.match(EDITOR, /data-duplicar-el-dia=\{d\.dia\}/);
  assert.match(AGENDA, /<CampoDeFecha id="agenda-desde" etiqueta=\{A\.desde\}/);
  assert.match(AGENDA, /\{A\.proximasDosSemanas\}/);
  assert.match(AGENDA, /data-quitar-agenda/);
  // Sin días, se dice qué pasa, en una línea.
  assert.match(EDITOR, /<p className="nota">\{COPY_AGENDA_DE_ENTRENAMIENTO\.sinAgenda\}<\/p>/);
});

// ─── C6 · el catálogo: la selección a la vista con un pie fijo; crear o importar, aparte ───────────────────────

const CATALOGO = fuente('../src/app/pro/advisees/training/agregar-ejercicio.tsx');
const V = (await import('../src/app/pro/advisees/training/varios-a-la-vez.ts')).COPY_VARIOS_A_LA_VEZ;

test('C6 · los elegidos quedan a la vista en el pie fijo, en su orden, y cada uno se quita sin perder la búsqueda', () => {
  const pie = CATALOGO.slice(CATALOGO.indexOf('pie={'), CATALOGO.indexOf('<ContenidoDeAgregarEjercicio'));
  assert.match(pie, /data-elegidos=\{marcados\.length\}/);
  assert.match(pie, /aria-label=\{V\.quitarDeLosElegidos\(m\.name\)\} title=\{m\.name\} onClick=\{\(\) => setMarcados\(\(x\) => alternarMarcado\(x, m\)\)\} data-quitar-elegido/);
  assert.equal(V.agregar(3, 'Sesión A'), 'Agregar 3 ejercicios a Sesión A');
  assert.equal(V.elegidos(3), '3 elegidos, en este orden:');
  assert.equal(V.quitarDeLosElegidos('Remo'), 'Quitar Remo de los elegidos');
  // Un solo principal en el pie: crear e importar ya no compiten con terminar la selección.
  assert.doesNotMatch(pie, /setModo\('manual'\)|setModo\('importar'\)/);
});

test('C6 · crear o importar, bajo «No encuentro el ejercicio», al final de la búsqueda; sin resultados, abierto', () => {
  assert.equal(V.noEncuentro, 'No encuentro el ejercicio');
  const seccion = CATALOGO.slice(CATALOGO.indexOf('data-no-encuentro'));
  assert.match(seccion, /alCambiarDeModo\('manual'\)\} data-crear-ejercicio/);
  assert.match(seccion, /alCambiarDeModo\('importar'\)\} data-importar-ejercicio/);
  assert.match(CATALOGO, /const sinResultados = busqueda\.tipo === 'lista' && ejercicios\.length === 0;\n\s*const noEncuentroAbierto = noEncuentro \|\| sinResultados;/);
  assert.match(CATALOGO, /Podés crearlo o importarlo, en «\{V\.noEncuentro\}»\./);
});

// ─── C8 · de dónde sale cada valor: común a todas las series, propio de esta serie o sin indicar ─────────────────

const PL = await import('../src/app/pro/advisees/training/planilla-de-series.ts');

test('C8 · cada valor dice de dónde sale, en la celda: «común», «propio» o «Sin indicar»', () => {
  // Toma el común: se ve el valor común, marcado «común».
  assert.deepEqual(PL.origenDeLaCelda('de-lo-general', '62,5'), { placeholder: '62,5', marca: 'común', descripcion: 'Común a todas las series: 62,5.' });
  // Sin común que tomar: «Sin indicar», sin marca (lo dice el texto).
  assert.deepEqual(PL.origenDeLaCelda('de-lo-general', null), { placeholder: 'Sin indicar', marca: null, descripcion: 'Sin indicar: no hay un valor común.' });
  // Propio: marcado «propio»; el lector oye también el común.
  assert.deepEqual(PL.origenDeLaCelda('propio', '02:30'), { placeholder: '02:30', marca: 'propio', descripcion: 'Propio de esta serie; el valor común es 02:30.' });
  // «Sin indicar» elegido en la serie, aunque haya común: no se muestra el común como si valiera.
  assert.deepEqual(PL.origenDeLaCelda('sin-objetivo', '02:30'), { placeholder: 'Sin indicar', marca: null, descripcion: 'Sin indicar en esta serie; el valor común es 02:30.' });
  assert.equal(PL.origenDeLaCelda('no-se-entiende', '2').marca, null);
  // La celda lo usa: la marca a la vista, el texto vacío y lo que oye el lector.
  assert.match(EJERCICIO, /const origen = origenDeLaCelda\(celda\.estado, deLoGeneral\);/);
  assert.match(EJERCICIO, /<div className="celda-de-objetivo" data-estado=\{celda\.estado\} data-origen=\{marca \?\? undefined\}>/);
  assert.match(EJERCICIO, /placeholder=\{origen\.placeholder\}/);
  assert.match(EJERCICIO, /<span className="celda-de-objetivo__origen" aria-hidden="true" data-origen-de-la-celda>/);
  assert.match(EJERCICIO, /\{origen\.descripcion\}/);
});

test('C8 · la fila «Común» a todas las series; las opciones de la celda y la ayuda usan las mismas palabras', () => {
  assert.equal(PL.COPY_PLANILLA.general, 'Común');
  assert.equal(PL.COPY_PLANILLA.generalDetalle, 'a todas las series');
  assert.match(PL.COPY_PLANILLA.rirDeLaIntensidad, /arriba/, 'el criterio está arriba de la tabla desde ENP-D14');
  assert.match(EJERCICIO, /\{ 'sin-objetivo': PL\.sinIndicarEnEstaSerie, 'de-lo-general': PL\.usarElComun \}/);
  assert.match(EJERCICIO, /data-como-se-lee-cada-valor>\{PL\.comoSeLee\}/);
  assert.doesNotMatch(EJERCICIO, /En gris, lo que la serie toma de lo general/);
  // Los tres estados de DL-122 no cambian: «Usar el valor común» quita la clave; «Sin indicar» es null.
  assert.deepEqual(PL.volverALoGeneral([{ rir: 1, restSeconds: null }], new Set([0])), [{}]);
});

// ─── C11 · «Sesiones vacías»: A, B y C de una vez, sin pedir nombre ni propósito ─────────────────────────────────

const SVM = await import('../src/app/pro/advisees/training/sesiones-vacias.ts');

test('C11 · con una cantidad, arma Sesión A, B y C en la fase, cada una con su identificador y vacía', () => {
  let n = 0;
  const id = () => `s-${++n}`;
  assert.deepEqual(SVM.sesionesVacias(3, 0, id), [
    { sessionId: 's-1', label: 'Sesión A', instructions: null, prescriptions: [] },
    { sessionId: 's-2', label: 'Sesión B', instructions: null, prescriptions: [] },
    { sessionId: 's-3', label: 'Sesión C', instructions: null, prescriptions: [] },
  ]);
  // Siguen a las que ya hay.
  assert.deepEqual(SVM.sesionesVacias(2, 3, id).map((s) => s.label), ['Sesión D', 'Sesión E']);
  assert.equal(SVM.COPY_SESIONES_VACIAS.armar(3, 0), 'Armar Sesión A, B y C');
  assert.equal(SVM.COPY_SESIONES_VACIAS.armar(5, 0), 'Armar Sesión A a E');
  assert.equal(SVM.COPY_SESIONES_VACIAS.armar(1, 0), 'Armar Sesión A');
  assert.equal(SVM.COPY_SESIONES_VACIAS.armar(2, 1), 'Armar Sesión B y C');
  // De 1 a 7, sin pasar el tope del lugar (30 en una fase, 14 en un microciclo).
  assert.deepEqual(SVM.cantidadesDeSesionesVacias(0, 30), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(SVM.cantidadesDeSesionesVacias(12, 14), [1, 2]);
  assert.deepEqual(SVM.cantidadesDeSesionesVacias(14, 14), []);
});

test('C11 · «Sesiones vacías» no pide nombre ni propósito: no abre ningún campo, y está en la fase sin sesiones', () => {
  const armar = EDITOR.slice(EDITOR.indexOf('const armarSesionesVacias = '), EDITOR.indexOf('const quitarSesion = '));
  assert.match(armar, /lasSesiones\(x\)\.push\(\.\.\.sesionesVacias\(cuantas, n, \(\) => crypto\.randomUUID\(\)\)\)/);
  assert.doesNotMatch(armar, /setTexto/, 'ningún campo de nombre ni de propósito');
  assert.match(EDITOR, /data-armar-sesiones-vacias onClick=\{\(\) => armarSesionesVacias\(cuantasVacias\)\}/);
  assert.match(EDITOR, /const \[cuantasVacias, setCuantasVacias\] = useState\(3\);/);
  for (const t of [SVM.COPY_SESIONES_VACIAS.ayuda, SVM.COPY_SESIONES_VACIAS.armadas(3, 0)]) assert.doesNotMatch(t, /cuerpo entero|recomend|ideal/i, 'no elige un enfoque de entrenamiento');
});

// ─── Lo que mostraron las capturas ──────────────────────────────────────────────────────────────────────────────

test('Capturas · en pantalla nunca «asesorado»: el aviso de los objetivos por serie dice «la persona» (sin tocar el 409 de la API)', () => {
  // El editor dice el texto del dominio con «la persona»; el dominio lo conserva porque es también el mensaje del 409, que
  // cambia en la ventana de la API (ED-08, etapa 2; la excepción contada en scripts/copy-pantallas.test.cjs).
  // La misma expresión que usa el editor (una expresión, no un texto: la guardia de ED-06 lee los textos).
  const enPantalla = d.COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueada.replace(/tu asesorado/, 'la persona');
  assert.doesNotMatch(enPantalla, /asesorad/);
  assert.match(enPantalla, /la persona todavía no usó una versión de BE/);
  assert.ok(EDITOR.includes("const ACTIVACION_BLOQUEADA_POR_LA_APP = COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueada.replace(/tu asesorado/, 'la persona');"));
  assert.doesNotMatch(EDITOR, /COPY_COMPATIBILIDAD_DE_CLIENTES\.activacionBloqueada\b(?!Titulo)(?!\.replace)/, 'el editor no muestra el texto del dominio tal cual');
});

test('Capturas · la fila «Común» no se parte: su detalle lo oye solo el lector', () => {
  assert.match(EJERCICIO, /<span className="visualmente-oculto"> \{PL\.generalDetalle\}<\/span>/);
});

// ─── La revisión adversaria del tramo 2 (2026-11-19) ────────────────────────────────────────────────────────────

const CSS = fuente('../src/app/globals.css');
const CAPTURAS = fuente('../../../EVIDENCIA/ENTRENAMIENTO-PLANIFICACION/herramientas/capturas.mjs');
/** La regla de un selector, la última que aparece (las del tramo 2 van al final y mandan). */
const regla = (selector) => {
  const partes = CSS.split(`${selector} {\n`);
  assert.ok(partes.length > 1, `falta la regla ${selector}`);
  return partes.at(-1).slice(0, partes.at(-1).indexOf('}'));
};
/** Una escena de la herramienta de capturas, desde su nombre hasta la siguiente. */
const escena = (nombre) => {
  const desde = CAPTURAS.indexOf(`nombre: '${nombre}'`);
  assert.ok(desde > 0, nombre);
  const hasta = CAPTURAS.indexOf("nombre: '", desde + 10);
  return CAPTURAS.slice(desde, hasta > 0 ? hasta : undefined);
};

test('Revisión · escena 11: las fichas de los elegidos bajan de renglón y ninguna queda cortada; el campo «para todos» tiene su alto', () => {
  // Una sola fila que se desplazaba de costado cortaba la tercera ficha contra el borde, sin que se notara que seguía.
  const fichas = regla('.agregar-ejercicio__fichas-elegidas');
  assert.match(fichas, /flex-wrap: wrap;/);
  assert.match(fichas, /max-height: calc\(2 \* 32px/, 'dos renglones a la vista');
  assert.match(fichas, /overflow-x: hidden;\n\s*overflow-y: auto;/, 'con más, se desplaza hacia abajo, con su barra');
  assert.doesNotMatch(fichas, /nowrap/);
  // Debajo de su título, con todo el ancho del pie: al lado del título, la tercera quedaba escondida en un tercer renglón.
  assert.match(fichas, /flex: 1 1 100%;/);
  assert.match(regla('.agregar-ejercicio__elegidos-titulo'), /flex: 1 1 100%;/);
  assert.match(escena('11-catalogo-con-elegidos'), /queda escondida debajo de los otros/);
  // El ejemplo va adentro del campo, como en la escritura rápida (C7), y la ayuda entra en un renglón.
  assert.equal(V.prescripcionEjemplo, 'Ej.: 4×8-12 RIR 2 · 90 s');
  assert.equal(V.prescripcionAyuda, 'Vacía, cada uno entra con una serie para completar.');
  assert.match(CATALOGO, /maxLength=\{80\} placeholder=\{V\.prescripcionEjemplo\}/);
  // Con 10 rem el ejemplo se cortaba al lado del rótulo (a 1536): con 15, entra o el campo baja de renglón.
  assert.match(regla('.agregar-ejercicio__para-todos > input'), /flex: 1 1 15rem;/);
  assert.match(escena('11-catalogo-con-elegidos'), /no entra en el campo/);
  // Un nombre largo se recorta adentro de su ficha, entero en `title` y para el lector.
  assert.match(regla('.agregar-ejercicio__nombre-elegido'), /text-overflow: ellipsis;/);
  assert.match(CATALOGO, /aria-label=\{V\.quitarDeLosElegidos\(m\.name\)\} title=\{m\.name\}/);
  assert.match(CATALOGO, /<span className="agregar-ejercicio__nombre-elegido">\{m\.name\}<\/span>/);
  // El campo se veía como una línea finita: ahora con el alto y el borde de los campos del cajón, al lado de su rótulo.
  const campo = regla('.agregar-ejercicio__para-todos > input');
  assert.match(campo, /min-height: 40px;/);
  assert.match(campo, /border: 1\.5px solid var\(--borde-control\);/);
  assert.match(CATALOGO, /<label className="agregar-ejercicio__para-todos" data-para-todos>/);
  // La herramienta de capturas lo verifica en cada tamaño y tema: si no, el paso falla.
  const e11 = escena('11-catalogo-con-elegidos');
  assert.match(e11, /verificar: \(page\) =>/);
  assert.match(e11, /if \(alto < 36\) problemas\.push/);
  assert.match(e11, /queda cortada a lo ancho/);
  assert.match(CAPTURAS, /if \(problemas\.length > 0\) throw new Error\(`no cumple lo que tiene que verse/);
});

test('Revisión · escena 10: el selector de la sesión en forma de lista tiene el borde y el fondo de los campos', () => {
  // Con muchas sesiones pasa a ser una lista desplegable, que se veía gris de sistema, también en Azul noche.
  const lista = regla('.nivel-del-plan__lista select');
  assert.match(lista, /border: 1px solid var\(--borde-control\);/);
  assert.match(lista, /background: var\(--superficie\);/);
  assert.match(lista, /color: var\(--texto\);/);
});

test('Revisión · escena 09: «Común» entra en su columna y no se pisa con «en cada serie»', () => {
  // Con 3 rem (2,5 entre 40 y 46 rem), «Común» en negrita no entraba.
  assert.match(EJERCICIO, /<th scope="col" className="series-del-editor__columna-serie">/);
  assert.match(regla('.series-del-editor thead th.series-del-editor__columna-serie'), /width: 3\.5rem;/, 'la del contenedor de 40 a 46 rem, que va última');
  assert.match(CSS, /\.series-del-editor thead th\.series-del-editor__columna-serie \{\n\s*width: 4rem;/);
  // Las dos reglas nuevas van después de las de siempre (misma especificidad: manda la última).
  assert.ok(CSS.lastIndexOf('th.series-del-editor__columna-serie') > CSS.lastIndexOf('.series-del-editor thead th:first-child {'));
  assert.match(escena('09-de-donde-sale-cada-valor'), /se pisa con «/);
});

test('Revisión · escena 10: «Las próximas dos semanas» queda a la vista, con las sesiones en sus días', () => {
  const e10 = escena('10-proximas-fechas');
  assert.doesNotMatch(e10, /scrollTo\(\{ top: 0 \}\)/, 'quedaba arriba y cortaba el calendario antes de las sesiones');
  assert.match(e10, /antesDeCapturar: async \(page\) =>/);
  assert.match(e10, /las próximas dos semanas no muestran ninguna sesión/);
  assert.match(e10, /sesiones del calendario queda a la vista/);
  // Y la pantalla las dibuja: las fechas previstas de la agenda, en su día.
  assert.match(AGENDA, /const delDia = previstas\.filter\(\(p\) => p\.date === fecha\);/);
  assert.equal(
    d.fechasPrevistas({ startDate: '2026-11-19', sessions: [{ sessionId: 'a', weekdays: ['MONDAY'] }, { sessionId: 'b', weekdays: ['WEDNESDAY'] }], moves: [] }, '2026-11-16', '2026-11-29').map((p) => `${p.sessionId} ${p.date}`).join(', '),
    'a 2026-11-23, b 2026-11-25',
  );
});

test('Revisión · ENP-D17 también al duplicar una sesión o insertar una habitual: nacen con su identificador, sin el de su origen', async () => {
  // Antes, la copia y la habitual quedaban sin identificador hasta el guardado: sus chips decían que primero había que
  // guardar, a diferencia de «Agregar sesión» y «Sesiones vacías».
  assert.match(EDITOR, /duplicarEn\(lasSesiones\(x\), k, \{ \.\.\.copiaDeLaSesion\(lasSesiones\(x\)\[k\]!, k\), sessionId: crypto\.randomUUID\(\) \}\)/);
  assert.match(EDITOR, /lasSesiones\(x\)\.push\(\{ \.\.\.structuredClone\(h\.structure\), sessionId: crypto\.randomUUID\(\) \}\)/);
  // La copia no lleva los identificadores de su origen (si no, el servidor rechaza el plan por un identificador repetido).
  const X = await import('../src/app/pro/advisees/editar-la-estructura.ts');
  const copia = X.copiaDeLaSesion({ sessionId: 's-1', label: 'Piernas A', instructions: null, prescriptions: [{ prescriptionId: 'p-1', exerciseVersionId: 'e', sets: [] }] }, 0);
  assert.equal(copia.sessionId, undefined);
  assert.equal(copia.prescriptions[0].prescriptionId, undefined);
});

test('Revisión · «Ocultar» la vuelta a la revisión deja el foco en la sesión: el botón desaparece con la barra', () => {
  assert.match(EDITOR, /data-ocultar-la-vuelta\n\s*onClick=\{\(\) => \{\n\s*setVolverALaRevision\(null\);\n(?:\s*\/\/.*\n)*\s*setParaEnfocar\('zona-editor'\);/);
  assert.match(EDITOR, /<div id="zona-editor" className="estacion__zona estacion__centro" data-zona="editor" role="region" aria-label=\{CE\.editor\} tabIndex=\{-1\}>/);
});

test('Revisión · sin ninguna sesión con días, «Próximas fechas» se cierra: no vuelve a abrirse sola con el próximo día', () => {
  assert.match(EDITOR, /if \(!a \|\| a\.sessions\.length === 0\) setFechasAbiertas\(false\);/);
});

/** Los textos de una fuente (literales, plantillas y texto de JSX), sin comentarios ni claves («be.primer-uso.estacion.v1»). Las clases no llevan tilde. */
const ts = (await import('typescript')).default;
function textosDe(ruta) {
  const contenido = readFileSync(ruta, 'utf8');
  const archivo = ts.createSourceFile(ruta, contenido, ts.ScriptTarget.Latest, true, ruta.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const textos = [];
  const visitar = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) {
      const t = n.text.trim();
      if (t && !/^[a-z0-9#./_-]+$|^[A-Z0-9_]+$/.test(t)) textos.push(t);
    }
    ts.forEachChild(n, visitar);
  };
  visitar(archivo);
  return textos;
}
const { readdirSync, statSync } = await import('node:fs');
const { join } = await import('node:path');
const { fileURLToPath } = await import('node:url');
const archivosDe = (carpeta) =>
  readdirSync(carpeta).flatMap((n) => {
    const r = join(carpeta, n);
    return statSync(r).isDirectory() ? archivosDe(r) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [r] : [];
  });
const PRO = fileURLToPath(new URL('../src/app/pro', import.meta.url));

test('Revisión · «estación» es jerga del código: en pantalla, «el editor» (Entrenamiento y el resto del website profesional)', () => {
  // Nutrición lo cambió en su paquete (NUP-14, rama wp-nutricion-planificacion): sus textos propios se cuentan ahí. El
  // armazón común del asistente lleva acá el mismo cambio, línea por línea, para que las dos ramas se integren sin chocar.
  const archivos = archivosDe(PRO).filter((a) => !a.includes(`${join('advisees', 'nutrition')}`));
  assert.ok(archivos.length > 100, `se esperaban las pantallas del profesional, hay ${archivos.length}`);
  const hallazgos = archivos.flatMap((a) => textosDe(a).filter((t) => /estación/i.test(t)).map((t) => `${a.slice(PRO.length + 1)}: «${t.slice(0, 80)}»`));
  assert.deepEqual(hallazgos, []);
  const E = fuente('../src/app/pro/advisees/estacion/estacion.ts');
  assert.match(E, /titulo: 'Cómo se usa el editor',/);
  assert.match(fuente('../src/app/pro/advisees/training/ayuda-del-plan.tsx'), /<strong>El editor tiene tres zonas\.<\/strong>/);
  const comun = fuente('../src/app/pro/advisees/asistente/paso-que-sigue.ts');
  assert.match(comun, /seguirEnLaEstacion: 'Seguir en el plan',/);
  assert.match(comun, /irEnLaEstacion: 'Corregirlo en el plan',/);
});

test('Revisión · nunca «asesorado» en pantalla: tampoco en otra pantalla del website ni en la APK', () => {
  // El 409 de la app de la persona (la excepción contada de ED-06) se dice con «la persona» en toda pantalla que lo usa.
  for (const a of archivosDe(PRO)) {
    assert.doesNotMatch(readFileSync(a, 'utf8'), /COPY_COMPATIBILIDAD_DE_CLIENTES\.activacionBloqueada\b(?!Titulo)(?!\.replace\(\/tu asesorado\/, 'la persona'\))/, a);
  }
  // La APK: ningún texto suyo dice «asesorado» (la referencia neutral de quien no tiene nombre viene del dominio y es la
  // otra excepción contada de ED-06).
  const APK = fileURLToPath(new URL('../../mobile/src', import.meta.url));
  const apk = archivosDe(APK);
  assert.ok(apk.length > 50, `se esperaban las pantallas de la APK, hay ${apk.length}`);
  assert.deepEqual(apk.flatMap((a) => textosDe(a).filter((t) => /asesorad/i.test(t)).map((t) => `${a.slice(APK.length + 1)}: «${t.slice(0, 80)}»`)), []);
});

test('Revisión · lo escrito sin aplicar en un ejercicio sin identificador sigue a su ejercicio cuando la sesión se reordena', () => {
  // Mientras algo impide guardar, los ejercicios nuevos siguen sin identificador: subir, bajar, quitar o duplicar otro le
  // pasaba lo escrito al que quedaba en su lugar.
  const lineas = { 'pos:b0-s1-p1': 'uno', 'pos:b0-s1-p2': 'dos', 'pos:b0-s10-p1': 'de otra sesión', 'pos:b0-m0-s1-p1': 'de un microciclo', 'id:x': 'con identificador' };
  const fijas = { 'pos:b0-s10-p1': 'de otra sesión', 'pos:b0-m0-s1-p1': 'de un microciclo', 'id:x': 'con identificador' };
  // Quitar el 0: suben.
  assert.deepEqual(ER.lineasTrasReordenar(lineas, 'b0-s1', ER.ordenTrasQuitar(3, 0)), { ...fijas, 'pos:b0-s1-p0': 'uno', 'pos:b0-s1-p1': 'dos' });
  // Quitar el 1: lo suyo se va con él.
  assert.deepEqual(ER.lineasTrasReordenar(lineas, 'b0-s1', ER.ordenTrasQuitar(3, 1)), { ...fijas, 'pos:b0-s1-p1': 'dos' });
  // Duplicar el 0: la copia, nueva, no lleva nada; los de abajo bajan.
  assert.deepEqual(ER.ordenTrasDuplicar(3, 0), [0, -1, 1, 2]);
  assert.deepEqual(ER.lineasTrasReordenar(lineas, 'b0-s1', ER.ordenTrasDuplicar(3, 0)), { ...fijas, 'pos:b0-s1-p2': 'uno', 'pos:b0-s1-p3': 'dos' });
  assert.deepEqual(ER.ordenTrasDuplicar(3, 2), [0, 1, 2, -1]);
  // Subir el 2 (`desdeDonde` de una sesión reordenada).
  assert.deepEqual(ER.lineasTrasReordenar(lineas, 'b0-s1', [0, 2, 1]), { ...fijas, 'pos:b0-s1-p2': 'uno', 'pos:b0-s1-p1': 'dos' });
  // El editor lo hace en cada operación que mueve ejercicios dentro de la sesión.
  assert.match(EDITOR, /setLineas\(\(m\) => lineasTrasReordenar\(conLaLinea\(m, claveDeLaLinea\(`\$\{prefijo\}-s\$\{k\}`, l, p\.prescriptionId\), ''\), `\$\{prefijo\}-s\$\{k\}`, ordenTrasQuitar\(sesion\.prescriptions\.length, l\)\)\);/);
  assert.match(EDITOR, /dejarAbiertos\(abiertosTrasReordenar\(abiertos, r\.desdeDonde\)\);\n(?:\s*\/\/.*\n)*\s*setLineas\(\(m\) => lineasTrasReordenar\(m, `\$\{prefijo\}-s\$\{k\}`, r\.desdeDonde\)\);/);
  assert.match(EDITOR, /setLineas\(\(m\) => lineasTrasReordenar\(m, `\$\{prefijo\}-s\$\{k\}`, ordenTrasDuplicar\(sesion\.prescriptions\.length, l\)\)\);/);
});
