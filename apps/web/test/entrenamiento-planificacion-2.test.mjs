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
