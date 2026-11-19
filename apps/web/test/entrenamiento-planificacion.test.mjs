/**
 * WP-ENTRENAMIENTO-PLANIFICACION (DL-181, decisiones de Dirección del 2026-11-18) · el editor del plan de Entrenamiento:
 * la fase, los bloques de la sesión, la revisión honesta, el criterio arriba de las series, las acciones con su objeto,
 * «Copiar» y la edición conjunta de series, el preset con la sesión vacía y los menús enteros. Las operaciones de los
 * bloques son puras (`bloques-del-editor.ts`); de las pantallas se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const B = await import('../src/app/pro/advisees/training/bloques-del-editor.ts');
const R = await import('../src/app/pro/advisees/revisar-el-plan.ts');
const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = fuente('../src/app/pro/advisees/training/editor.tsx');
const EJERCICIO = fuente('../src/app/pro/advisees/training/ejercicio-del-editor.tsx');
const BLOQUE = fuente('../src/app/pro/advisees/training/bloque-del-editor.tsx');
const REVISION = fuente('../src/app/pro/advisees/training/revision-del-plan.tsx');
const GALERIA = fuente('../src/app/pro/advisees/galeria-de-presets.tsx');
const MENU = fuente('../src/components/menu-de-acciones.tsx');
const PLAN = fuente('../src/app/pro/advisees/training/plan.tsx');
const CSS = fuente('../src/app/globals.css');

const ej = (n, extra = {}) => ({ exerciseVersionId: `e${n}`, sets: [{ repetitions: { value: 8 } }], intensity: null, n, ...extra });
const nombres = (s) => s.prescriptions.map((p) => `${p.n}${p.exerciseGroupId ? `:${p.exerciseGroupId}` : ''}`);

test('ENP-D01 · lo que era «Bloque» se lee «Fase», con su ayuda; el contrato sigue con `blocks`', () => {
  assert.equal(d.COPY_ENTRENAMIENTO.bloque, 'Fase');
  assert.equal(d.COPY_ENTRENAMIENTO.queEsLaFase, 'Una fase es un período de varias semanas con un objetivo.');
  assert.equal(d.ubicacionDelProblemaDeEntrenamiento('blocks[1].sessions[0]', [{ label: 'F', sessions: [] }, { label: '', sessions: [{ label: 'A', prescriptions: [] }] }]), 'Fase 2 → A');
  assert.match(PLAN, /initialStructure: \{ blocks: \[\{ label: 'Fase 1', sessions: \[\] \}\] \}/);
  assert.doesNotMatch(EDITOR, /'Quitar este bloque'|Nombre del bloque"|un bloque<\/span>/);
});

test('ENP-D15 · cada «Agregar» dice qué agrega', () => {
  assert.equal(d.COPY_ENTRENAMIENTO.agregarBloque, 'Agregar fase');
  assert.equal(d.COPY_ENTRENAMIENTO.agregarSesion, 'Agregar sesión');
  assert.equal(d.COPY_ENTRENAMIENTO.agregarEjercicio, 'Agregar ejercicios');
  assert.equal(d.COPY_BLOQUES_DE_LA_SESION.agregarBloque, 'Agregar bloque');
  assert.match(EDITOR, /texto=\{COPY_ENTRENAMIENTO\.agregarSesion\}/);
  assert.doesNotMatch(EDITOR, /texto="Agregar"/);
});

test('DL-181 · agregar un bloque, ejercicios en él y quitarlo: los ejercicios quedan sueltos y en su lugar', () => {
  const s0 = { label: 'A', prescriptions: [ej(1), ej(2)] };
  const { sesion: s1, bloque } = B.agregarBloque(s0);
  assert.deepEqual(bloque, { groupId: 'g-1', label: 'Bloque 1', kind: 'SEQUENTIAL' });
  const r = B.agregarEjercicios(s1, [ej(3), ej(4)], 'g-1');
  assert.deepEqual(nombres(r.sesion), ['1', '2', '3:g-1', '4:g-1']);
  assert.deepEqual(r.posiciones, [2, 3]);
  // Agregar sueltos va al final, después del bloque.
  const sueltos = B.agregarEjercicios(r.sesion, [ej(5)], null);
  assert.deepEqual(nombres(sueltos.sesion), ['1', '2', '3:g-1', '4:g-1', '5']);
  // Al bloque, después de su último ejercicio: los suyos siguen juntos.
  const otro = B.agregarEjercicios(sueltos.sesion, [ej(6)], 'g-1');
  assert.deepEqual(nombres(otro.sesion), ['1', '2', '3:g-1', '4:g-1', '6:g-1', '5']);
  assert.deepEqual(otro.desdeDonde, [0, 1, 2, 3, -1, 4], 'lo abierto sigue a su ejercicio');
  const sinBloque = B.quitarBloque(otro.sesion, 'g-1');
  assert.deepEqual(nombres(sinBloque), ['1', '2', '3', '4', '6', '5']);
  assert.equal('exerciseGroups' in sinBloque, false, 'sin bloques, la sesión vuelve a ser la de siempre');
});

test('DL-181 · mover: dentro del bloque entre los suyos; uno suelto salta el bloque entero; el bloque se mueve completo', () => {
  const s = {
    label: 'A',
    exerciseGroups: [{ groupId: 'g-1', label: 'Torso', kind: 'SEQUENTIAL' }],
    prescriptions: [ej(1), ej(2, { exerciseGroupId: 'g-1' }), ej(3, { exerciseGroupId: 'g-1' }), ej(4)],
  };
  assert.deepEqual(nombres(B.moverEjercicio(s, 2, -1).sesion), ['1', '3:g-1', '2:g-1', '4']);
  assert.equal(B.moverEjercicio(s, 1, -1), null, 'el primero del bloque no sale del bloque al subir');
  assert.deepEqual(nombres(B.moverEjercicio(s, 0, 1).sesion), ['2:g-1', '3:g-1', '1', '4'], 'el suelto salta el bloque');
  assert.deepEqual(nombres(B.moverEjercicio(s, 3, -1).sesion), ['1', '4', '2:g-1', '3:g-1']);
  assert.deepEqual(nombres(B.moverBloque(s, 'g-1', -1).sesion), ['2:g-1', '3:g-1', '1', '4']);
  assert.equal(B.moverBloque({ ...s, prescriptions: s.prescriptions.slice(1) }, 'g-1', -1), null);
  // Pasar a otro bloque y sacar del bloque: los que quedan siguen juntos.
  const conDos = { ...s, exerciseGroups: [...s.exerciseGroups, { groupId: 'g-2', label: 'Core', kind: 'SEQUENTIAL' }] };
  assert.deepEqual(nombres(B.pasarAlBloque(conDos, 0, 'g-1').sesion), ['2:g-1', '3:g-1', '1:g-1', '4']);
  assert.deepEqual(nombres(B.pasarAlBloque(conDos, 1, null).sesion), ['1', '3:g-1', '2', '4']);
  assert.deepEqual(nombres(B.pasarAlBloque(conDos, 3, 'g-2').sesion), ['1', '2:g-1', '3:g-1', '4:g-2'], 'a un bloque vacío, al final');
  assert.deepEqual(B.otrosBloques(conDos, 1).map((g) => g.groupId), ['g-2']);
});

test('DL-181 · ENP-D05: «En vueltas» iguala las series efectivas a las vueltas, con lo de antes para «Deshacer»', () => {
  const s = {
    label: 'A',
    exerciseGroups: [{ groupId: 'g-1', label: 'Torso', kind: 'SEQUENTIAL' }],
    prescriptions: [ej(1, { exerciseGroupId: 'g-1', sets: [{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }] }), ej(2, { exerciseGroupId: 'g-1', sets: [{ repetitions: { value: 10 } }] })],
  };
  const r = B.cambiarTipo(s, 'g-1', 'ROUNDS');
  assert.deepEqual(r.sesion.exerciseGroups, [{ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 2 }], 'las vueltas, las series del primero');
  assert.deepEqual(r.sesion.prescriptions[1].sets, [{ repetitions: { value: 10 } }, { repetitions: { value: 10 } }]);
  assert.deepEqual([...r.antes.keys()], [1]);
  const tres = B.cambiarVueltas(r.sesion, 'g-1', 3);
  assert.deepEqual(tres.sesion.prescriptions.map((p) => p.sets.length), [3, 3]);
  assert.deepEqual(B.conLasDeAntes(tres.sesion, tres.antes).prescriptions.map((p) => p.sets.length), [2, 2]);
  // A «Seguido»: sin vueltas ni descanso, como pide el contrato.
  assert.deepEqual(B.cambiarTipo({ ...tres.sesion, exerciseGroups: [{ ...tres.sesion.exerciseGroups[0], restAfterRoundSeconds: 90 }] }, 'g-1', 'SEQUENTIAL').sesion.exerciseGroups, [{ groupId: 'g-1', label: 'Torso', kind: 'SEQUENTIAL' }]);
  // Al agregar a un bloque «En vueltas», nace con una serie efectiva por vuelta.
  assert.deepEqual(B.agregarEjercicios(tres.sesion, [ej(3)], 'g-1').sesion.prescriptions[2].sets.length, 3);
  // Si no coinciden, se dice en «Queda sin completar» y no impide.
  const distinta = { ...tres.sesion, prescriptions: [tres.sesion.prescriptions[0], { ...tres.sesion.prescriptions[1], sets: [{ repetitions: { value: 10 } }] }] };
  assert.deepEqual(R.loQueQuedaSinCompletarEnEntrenamiento([{ sessions: [distinta] }]), [{ code: R.INCOMPLETO.seriesYVueltas, path: 'blocks[0].sessions[0].prescriptions[1]' }]);
});

test('DL-181 · lo que no deja guardar un bloque: su nombre y su descanso; y la ubicación lo nombra', () => {
  const bloques = [{ label: 'F', sessions: [{ label: 'A', exerciseGroups: [{ groupId: 'g-1', label: ' ', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: Number.NaN }], prescriptions: [] }] }];
  assert.deepEqual(d.loQueNoDejaGuardarElEntrenamiento(bloques).map((p) => [p.code, p.path]), [
    ['NAME_REQUIRED', 'blocks[0].sessions[0].exerciseGroups[0]'],
    ['REST_NOT_READABLE', 'blocks[0].sessions[0].exerciseGroups[0]'],
  ]);
  const conNombre = [{ label: 'F', sessions: [{ label: 'A', exerciseGroups: [{ groupId: 'g-1', label: 'Torso', kind: 'SEQUENTIAL' }], prescriptions: [] }] }];
  assert.equal(d.ubicacionDelProblemaDeEntrenamiento('blocks[0].sessions[0].exerciseGroups[0]', conNombre), 'F → A → Bloque «Torso»');
  assert.equal(d.bloqueDeLaSesionDelProblema('changes.blocks.0.sessions.1.exerciseGroups.2.label'), 2);
  assert.equal(d.bloqueDeLaSesionDelProblema('blocks[0].sessions[1].prescriptions[0]'), null);
});

test('DL-181 · el bloque en el editor: los dos tipos a la vista, las vueltas de 1 a 20, la indicación como la ve la persona', () => {
  assert.match(BLOQUE, /type="radio" name=\{`\$\{id\}-tipo`\}/);
  assert.match(BLOQUE, /Array\.from\(\{ length: 20 \}/);
  assert.match(BLOQUE, /indicacionDeVueltas\(/);
  assert.match(BLOQUE, /\{ clave: 'quitar', texto: B\.quitarBloque, detalle: B\.quitarBloqueDetalle/);
  assert.match(EDITOR, /partesDeLaSesion\(sesion\)\.map\(/);
  assert.match(EDITOR, /COPY_BLOQUES_DE_LA_SESION\.laAppAnterior/);
  // Dentro de un bloque, el título del ejercicio es de un nivel más.
  assert.match(EDITOR, /nivel=\{enBloque \? 'h4' : 'h3'\}/);
  assert.match(EJERCICIO, /const Titulo = nivel;/);
});

test('ENP-D13 · la revisión honesta: nunca «Nada impide activar»; cuatro estados, y la de antes deja de valer al cambiar', () => {
  assert.doesNotMatch(EDITOR, /CE\.nadaImpide/);
  assert.match(EDITOR, /const revisionVigente = revision && revision\.version === version\.version && !sucio \? revision : null;/);
  assert.match(EDITOR, /: 'pendiente';/);
  for (const t of ['Revisión pendiente', 'Revisando esta versión…', 'Revisión terminada: no se encontraron impedimentos para activar.']) assert.ok(REVISION.includes(t), t);
  const R2 = REVISION;
  assert.match(R2, /irA: \(destino: string\) => `Ir a \$\{destino\}`/);
  assert.match(R2, /role="status"/);
  // Lo de lo que falta, dicho como lo pidió Dirección: «Sesión B: no tiene ejercicios → Ir a Sesión B».
  assert.match(EDITOR, /PRESCRIPTION_REQUIRED: 'no tiene ejercicios'/);
  assert.match(EDITOR, /destinoDelLugar\(lugar\)/);
  // La revisión se pide sola cuando lo guardado se queda quieto, no en cada tecla.
  assert.match(EDITOR, /setTimeout\(\(\) => void revisar\(version\), 900\)/);
});

test('C10 · «Lo que trabaja la semana» no está mientras no tenga datos', () => {
  assert.doesNotMatch(EDITOR, /\['semana', CE\.pestanaSemana\]/);
  assert.doesNotMatch(EDITOR, /id="panel-semana"/);
});

test('ENP-D14 · el criterio, la unidad y las bases van arriba de las series, a la vista; la tabla tiene todo el ancho', () => {
  const cuerpo = EJERCICIO.slice(EJERCICIO.indexOf('<CriterioDelEjercicio'), EJERCICIO.indexOf('<SeriesDelEjercicio'));
  assert.ok(cuerpo.length > 0, 'el criterio va antes de las series');
  assert.doesNotMatch(EJERCICIO, /<details className="a-un-clic"[^>]*data-bases>/, 'las bases ya no están a un clic');
  assert.match(CSS, /\.ejercicio-del-editor__cuerpo:not\(\[hidden\]\) \{\n  grid-template-columns: minmax\(0, 1fr\);/);
});

test('ENP-D16 · «Copiar» a la vista y la edición conjunta de series, con las repeticiones y los rangos', () => {
  assert.match(EJERCICIO, /texto="Copiar"/);
  assert.match(EJERCICIO, /data-seleccionar-series/);
  assert.match(EJERCICIO, /<option value="repetitions">/);
  assert.match(EJERCICIO, /const r = leerReps\(valor\);/);
  // Las casillas aparecen al pedirlas.
  assert.match(EJERCICIO, /\{seleccionando \? \(\n\s*<td className="series-del-editor__elegir">/);
});

test('ENP-D10 · con la sesión vacía, el preset se puede usar y queda para los ejercicios que se agreguen', () => {
  assert.match(GALERIA, /sinEjercicios && !onElegirParaLaSesionVacia/);
  assert.match(GALERIA, /onElegirParaLaSesionVacia\(elegido\.preset\.nombre, \(x\) => aplicarPrescripcion\(x, leida\)\.prescripcion as PrescripcionE\)/);
  assert.match(EDITOR, /!prescripcion && prescripcionDeEstaSesion \? prescripcionDeEstaSesion\.aplicar\(x\) : x/);
  // Aplicado a una serie vacía, el preset de BE escribe sus series.
  const preset = d.PRESETS_DE_PRESCRIPCION[0];
  const base = { exerciseVersionId: 'e1', sets: [{ repetitions: null }], intensity: null };
  assert.ok(d.aplicarPrescripcion(base, d.prescripcionDelPreset(preset)).prescripcion.sets.length >= 1);
});

test('ENP-D11 · los menús salen enteros: fijos a la ventana, abren arriba si abajo no entran, sin salirse por los costados', () => {
  assert.match(CSS, /\.menu-de-acciones__panel \{\n[^}]*position: fixed;/);
  assert.match(MENU, /const haciaArriba = alto > abajo && arriba > abajo;/);
  assert.match(MENU, /window\.addEventListener\('scroll', ubicar, true\)/);
  assert.match(MENU, /Math\.min\(Math\.max\(margen, deseadaIzquierda\), Math\.max\(margen, window\.innerWidth - margen - ancho\)\)/);
});

test('ENP-D12 · «Todavía no hay un plan activo», en una etiqueta de la cabecera', () => {
  assert.doesNotMatch(PLAN, /<p className="nota">\{COPY_ENTRENAMIENTO\.sinPlanActivo\}<\/p>/);
  assert.match(PLAN, /sinPlanActivo=\{!activa\}/);
  assert.match(EDITOR, /data-sin-plan-activo/);
});

test('El lenguaje: ubicar, nunca calificar', () => {
  const textos = [...Object.values(d.COPY_BLOQUES_DE_LA_SESION).filter((x) => typeof x === 'string'), ...Object.values(d.PROBLEMA_DE_BLOQUES), d.indicacionDeVueltas({ groupId: 'g', label: 'T', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }, 2)];
  for (const t of textos) assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|volumen/i, t);
});
