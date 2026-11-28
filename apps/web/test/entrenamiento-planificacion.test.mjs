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
  assert.match(EDITOR, /<p data-que-es-la-fase>\{COPY_ENTRENAMIENTO\.queEsLaFase\}<\/p>/);
});

test('ENP-D15 · cada «Agregar» dice qué agrega', () => {
  assert.equal(d.COPY_ENTRENAMIENTO.agregarBloque, 'Agregar fase');
  assert.equal(d.COPY_ENTRENAMIENTO.agregarSesion, 'Agregar sesión');
  assert.equal(d.COPY_ENTRENAMIENTO.agregarEjercicio, 'Agregar ejercicios');
  assert.equal(d.COPY_BLOQUES_DE_LA_SESION.agregarBloque, 'Agregar bloque');
  // DL-197 (ET1-05): «Nueva sesión», al final de las tarjetas de las sesiones.
  assert.match(EDITOR, /texto=\{COPY_SEMANA_TIPO\.nuevaSesion\}/);
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
  // DL-196 (E3): sin compatibilidad con APK viejas, la nota sobre «la app anterior» ya no va.
  assert.doesNotMatch(EDITOR, /COPY_BLOQUES_DE_LA_SESION\.laAppAnterior/);
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
  // En «Antes de activar», lo mismo: una revisión de otra versión no se muestra como la de esta.
  // DL-198: las fases de más van aparte, con sus dos salidas; el 422 de la API no se repite.
  assert.match(EDITOR, /revision\?\.estado === 'lista' && revision\.version === version\.version\n\s*\? revision\.problemas\.filter\(\(p\) => !\(p\.code === 'PHASES_EXCEED_PLAN_WEEKS' && fasesDeMas > 0\)\)\.map\(\(p\) => conSuLugar/);
});

test('C10 · «Lo que trabaja la semana» no está mientras no tenga datos', () => {
  assert.doesNotMatch(EDITOR, /\['semana', CE\.pestanaSemana\]/);
  assert.doesNotMatch(EDITOR, /id="panel-semana"/);
});

test('ENP-D14, enmendada por DL-197 (F16): la planilla con «Común» a la vista; el criterio y las bases, en «Más opciones»', () => {
  // DL-197: al abrir un ejercicio se ve la planilla; la unidad va en un chip del encabezado de la carga (F10).
  assert.ok(EJERCICIO.indexOf('<SeriesDelEjercicio id=') < EJERCICIO.indexOf('<CriterioDelEjercicio id='));
  assert.match(EJERCICIO, /data-unidad-de-la-carga=\{unidad\}/);
  assert.doesNotMatch(EJERCICIO, /<details className="a-un-clic"[^>]*data-bases>/, 'las bases ya no están a un clic');
  assert.match(CSS, /\.ejercicio-del-editor__cuerpo:not\(\[hidden\]\) \{\n  grid-template-columns: minmax\(0, 1fr\);/);
});

test('ENP-D16 · «Copiar» a la vista y la edición conjunta de series, con las repeticiones y los rangos', () => {
  assert.match(EJERCICIO, /texto="Copiar"/);
  // DL-197 (F16): «Editar todas las series», un cuadro con las series elegidas y los datos (las repeticiones, con rangos).
  assert.match(EJERCICIO, /data-editar-todas-las-series/);
  assert.match(EJERCICIO, /const r = leerReps\(valores\.reps\);/);
  assert.match(EJERCICIO, /data-elegir-serie=\{n \+ 1\}/);
});

test('ENP-D10 · con la sesión vacía, el preset se puede usar y queda para los ejercicios que se agreguen', () => {
  assert.match(GALERIA, /sinEjercicios && !onElegirParaLaSesionVacia/);
  // DL-203: en la intensidad de cada ejercicio que se agregue.
  assert.match(GALERIA, /onElegirParaLaSesionVacia\(preset\.nombre, \(x\) => aplicarPresetDeBe\(x, preset, intensidadDe\(x\)\)\.prescripcion as PrescripcionE\)/);
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

test('ENP-D12 y RP-02 (DL-189) · «Todavía no hay un plan activo» no se dice con la versión en preparación a la vista', () => {
  assert.doesNotMatch(PLAN, /<p className="nota">\{COPY_ENTRENAMIENTO\.sinPlanActivo\}<\/p>/);
  // RP-02: «Versión 1 en preparación» ya lo dice; el editor conserva la etiqueta, sin que el Plan la pida (EI-D13).
  assert.doesNotMatch(PLAN, /sinPlanActivo=\{!activa\}/);
  assert.match(EDITOR, /data-sin-plan-activo/);
});

test('El lenguaje: ubicar, nunca calificar', () => {
  const textos = [...Object.values(d.COPY_BLOQUES_DE_LA_SESION).filter((x) => typeof x === 'string'), ...Object.values(d.PROBLEMA_DE_BLOQUES), d.indicacionDeVueltas({ groupId: 'g', label: 'T', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }, 2)];
  for (const t of textos) assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|volumen/i, t);
});

// ─── Revisión adversaria (2026-11-19) ────────────────────────────────────────────────────────────────────────────
// Cada prueba de abajo queda en rojo sin su corrección (mutaciones verificadas el 2026-11-19).

test('Revisión · el panel no se contradice: el título no dice «Impide activar» arriba de «no se encontraron impedimentos»', () => {
  assert.doesNotMatch(EDITOR, /\{CE\.impide\}/, 'ni el panel ni el paso del asistente titulan «Impide activar»');
  assert.match(REVISION, /titulo: 'Revisión para activar'/);
  assert.match(EDITOR, /<Icono nombre="revision" tamano=\{15\} \/>\n\s*\{COPY_REVISION_DEL_PLAN\.titulo\}/);
  assert.match(EDITOR, /<h4>\{COPY_REVISION_DEL_PLAN\.titulo\}<\/h4>/);
});

test('Revisión · «Revisar ahora» no guarda mientras otro guardado está en curso (un 409 de la pantalla consigo misma)', () => {
  assert.match(EDITOR, /const motivoSinRevisar = sucio \? sinGuardarAhora : null;/);
  assert.match(EDITOR, /async function revisarAhora\(\) \{\n\s*if \(motivoSinRevisar\) return;/);
  assert.match(EDITOR, /motivoSinRevisar=\{motivoSinRevisar\}/);
  // Apagado con `aria-disabled` (conserva el foco), y dice por qué.
  assert.match(REVISION, /aria-disabled=\{motivoSinRevisar \? true : undefined\}/);
  assert.match(REVISION, /if \(!motivoSinRevisar\) onRevisar\(\);/);
  assert.equal(d.motivoSinGuardarAhora({ guardando: true, sucio: true, conflicto: false }), d.COPY_GUARDADO.yaSeEstaGuardando);
});

test('Revisión · el cuadro «Antes de activar» no dice «Nada impide activar» antes de que la API revise esta versión', () => {
  // Recién abierto (sin revisión) o con la de otra versión, está revisando; y entonces «Activar» queda apagado.
  assert.match(EDITOR, /revisando=\{!sucio && \(revision === null \|\| revision\.version !== version\.version \|\| revision\.estado === 'revisando'\)\}/);
});

test('Revisión · «Ir a…» un bloque sin nombre abre el nombre del bloque, no el de la sesión', () => {
  const s = { exerciseGroups: [{ groupId: 'g-1', label: 'Pierna', kind: 'SEQUENTIAL' }, { groupId: 'g-7', label: '', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: Number.NaN }] };
  assert.deepEqual(B.destinoDelProblemaDelBloque({ code: 'NAME_REQUIRED', path: 'blocks[0].microcycles[1].sessions[2].exerciseGroups[1]' }, s, 'b0-m1-s2'), { renombrar: 'b0-m1-s2-g-7' });
  assert.deepEqual(B.destinoDelProblemaDelBloque({ code: 'REST_NOT_READABLE', path: 'blocks[0].sessions[2].exerciseGroups[1]' }, s, 'b0-s2'), { enfocar: 'b0-s2-g1-descanso' });
  assert.deepEqual(B.destinoDelProblemaDelBloque({ code: 'EXERCISE_GROUP_EMPTY', path: 'blocks[0].sessions[2].exerciseGroups[0]' }, s, 'b0-s2'), { enfocar: 'b0-s2-g0-titulo' });
  assert.equal(B.destinoDelProblemaDelBloque({ code: 'NAME_REQUIRED', path: 'blocks[0].sessions[2]' }, s, 'b0-s2'), null, 'el nombre de la sesión no es del bloque');
  // En el editor, el bloque se pregunta antes que el nombre de la sesión (su ruta también es «de la sesión»).
  const ir = EDITOR.slice(EDITOR.indexOf('const irAlProblema = '), EDITOR.indexOf('const agregarUnBloque = ('));
  assert.ok(ir.indexOf('destinoDelProblemaDelBloque(p, s, delGrupo)') > 0, 'irAlProblema usa el destino del bloque');
  assert.ok(ir.indexOf('destinoDelProblemaDelBloque(p, s, delGrupo)') < ir.indexOf('if (p.code === N.faltaElNombre)'), 'y lo pregunta antes que el nombre de la sesión');
});

test('Revisión · varios cambios de vueltas seguidos (las flechas en la lista) se deshacen juntos, hasta como estaba', () => {
  const serie = (n) => ({ repetitions: { value: n } });
  const s5 = {
    label: 'A',
    exerciseGroups: [{ groupId: 'g-1', label: 'Pierna', kind: 'ROUNDS', rounds: 5 }],
    prescriptions: [ej(1, { exerciseGroupId: 'g-1', sets: [serie(10), serie(9), serie(8), serie(7), serie(6)] }), ej(2, { exerciseGroupId: 'g-1', sets: [serie(5), serie(5), serie(5), serie(5), serie(5)] })],
  };
  // De 5 a 3 con el teclado: pasa por 4.
  const a4 = B.cambiarVueltas(s5, 'g-1', 4);
  const d1 = B.deshacerTrasCambiarLasVueltas(null, 'b0-s0', 'g-1', s5, a4);
  const a3 = B.cambiarVueltas(a4.sesion, 'g-1', 3);
  const d2 = B.deshacerTrasCambiarLasVueltas(d1, 'b0-s0', 'g-1', a4.sesion, a3);
  assert.equal(d2.vueltas, 3, 'el aviso dice las vueltas que quedaron');
  assert.deepEqual(d2.sesion, s5, '«Deshacer» vuelve a las 5 series, no a las 4 del paso anterior');
  // Otra sesión u otro bloque empiezan de nuevo; sin cambios de series ni seguidilla, no hay nada que deshacer.
  assert.deepEqual(B.deshacerTrasCambiarLasVueltas(d1, 'b0-s1', 'g-1', a4.sesion, a3).sesion, a4.sesion);
  const conOtro = { ...a4.sesion, exerciseGroups: [...a4.sesion.exerciseGroups, { groupId: 'g-2', label: 'Core', kind: 'ROUNDS', rounds: 2 }], prescriptions: [...a4.sesion.prescriptions, ej(3, { exerciseGroupId: 'g-2', sets: [serie(1), serie(1)] }), ej(4, { exerciseGroupId: 'g-2', sets: [serie(1), serie(1)] })] };
  const otro = B.cambiarVueltas(conOtro, 'g-2', 3);
  assert.deepEqual(B.deshacerTrasCambiarLasVueltas(d1, 'b0-s0', 'g-2', conOtro, otro).sesion, conOtro);
  assert.equal(B.deshacerTrasCambiarLasVueltas(null, 'b0-s0', 'g-1', s5, { sesion: s5, antes: new Map() }), null);
  // En el editor: lo que había antes viaja al cambio siguiente.
  assert.match(EDITOR, /const siguiente = deshacerTrasCambiarLasVueltas\(previo, `\$\{prefijo\}-s\$\{k\}`, groupId, sesion, r\);/);
});

test('Revisión · las repeticiones que el contrato no admite («12-8», «0-10») no se escriben como buenas en varias series', async () => {
  const P = await import('../src/app/pro/advisees/training/planilla-de-series.ts');
  assert.equal(P.leerRepeticiones('  '), null);
  assert.deepEqual(P.leerRepeticiones('8'), { value: 8 });
  assert.deepEqual(P.leerRepeticiones('8 - 12'), { min: 8, max: 12 });
  assert.deepEqual(P.leerRepeticiones('10-10'), { min: 10, max: 10 });
  for (const mal of ['12-8', '0-10', '5-1001', '0', '1001', 'abc', '8.5']) {
    const r = P.leerRepeticiones(mal);
    const enNaN = 'value' in r ? Number.isNaN(r.value) : Number.isNaN(r.min) && Number.isNaN(r.max);
    assert.ok(enNaN, `«${mal}» no se entiende`);
    // Y entonces no deja guardar, con su lugar (antes, «12-8» llegaba al servidor y el guardado automático fallaba).
    const bloques = [{ label: 'F', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: 'e1', intensity: null, sets: [{ repetitions: r }] }] }] }];
    assert.deepEqual(d.loQueNoDejaGuardarElEntrenamiento(bloques).map((p) => p.path), ['blocks[0].sessions[0].prescriptions[0].sets[0]'], mal);
  }
  // La celda y la edición conjunta leen con la misma regla.
  assert.match(EJERCICIO, /const leerReps = \(s: string\): Repeticiones => leerRepeticiones\(s\);/);
});

test('Revisión · «Lo que cambia frente a la vigente» cuenta los bloques de la sesión (no dice «No cambia nada»)', async () => {
  const CV = await import('../src/app/pro/advisees/comparar-versiones.ts');
  const como = { nombreDelEjercicio: (id) => ({ e1: 'Sentadilla', e2: 'Zancadas', e3: 'Plancha' })[id] ?? 'Ejercicio', renglon: () => '3 × 8' };
  const rx = (id, ev, extra = {}) => ({ prescriptionId: id, exerciseVersionId: ev, sets: [{ repetitions: { value: 8 } }], intensity: null, ...extra });
  const sesion = (grupos, prescripciones) => [{ blockId: 'f1', label: 'Fuerza', sessions: [{ sessionId: 's1', label: 'Piernas A', prescriptions: prescripciones, ...(grupos ? { exerciseGroups: grupos } : {}) }] }];
  const vueltas = (extra = {}) => ({ groupId: 'g-1', label: 'Pierna', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90, ...extra });
  const vigente = sesion([vueltas()], [rx('r1', 'e1', { exerciseGroupId: 'g-1' }), rx('r2', 'e2', { exerciseGroupId: 'g-1' }), rx('r3', 'e3')]);
  // Solo el descanso al terminar cada vuelta: lo que la persona lee en «Alterná…» cambia.
  const descanso = CV.compararEntrenamiento(vigente, sesion([vueltas({ restAfterRoundSeconds: 60 })], vigente[0].sessions[0].prescriptions), como);
  assert.deepEqual(descanso.lista, ['Piernas A, bloque Pierna: descanso al terminar cada vuelta: 90 s → 1 min']);
  // De «En vueltas» a «Seguido».
  const seguido = CV.compararEntrenamiento(vigente, sesion([{ groupId: 'g-1', label: 'Pierna', kind: 'SEQUENTIAL' }], vigente[0].sessions[0].prescriptions), como);
  assert.deepEqual(seguido.lista, ['Piernas A, bloque Pierna: En vueltas · 3 vueltas → Seguido · descanso al terminar cada vuelta: 90 s → sin indicar']);
  // Un bloque nuevo y un ejercicio que pasa a él: se dicen con su nombre, no como «cambió lo indicado».
  const nuevo = sesion([vueltas(), { groupId: 'g-2', label: 'Core', kind: 'SEQUENTIAL' }], [rx('r1', 'e1', { exerciseGroupId: 'g-1' }), rx('r2', 'e2', { exerciseGroupId: 'g-1' }), rx('r3', 'e3', { exerciseGroupId: 'g-2' })]);
  assert.deepEqual(CV.compararEntrenamiento(vigente, nuevo, como).lista, ['+ bloque Core en Piernas A', 'Plancha: pasó al bloque Core']);
  // Quitar el bloque: sus ejercicios salen de él.
  const sinBloques = sesion(null, [rx('r1', 'e1'), rx('r2', 'e2'), rx('r3', 'e3')]);
  assert.deepEqual(CV.compararEntrenamiento(vigente, sinBloques, como).lista, ['− bloque Pierna de Piernas A', 'Sentadilla: salió del bloque Pierna', 'Zancadas: salió del bloque Pierna']);
  // Sin cambios, nada.
  assert.equal(CV.compararEntrenamiento(vigente, structuredClone(vigente), como).lista.length, 0);
});
