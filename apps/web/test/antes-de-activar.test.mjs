/**
 * ED-07 · «Antes de activar»: una sola entrada fija (WP-EDITORES-PROFESIONAL; DJ-6; TEST-EDP-008 y TEST-EDP-009).
 *
 * - «Revisar y activar…» abre el cuadro siempre; el principal («Activar la versión 9 de Entrenamiento») nunca se enciende
 *   con algo por corregir, con cambios sin guardar, sin la revisión de la API ni sin una elección de fecha, y dice por qué.
 * - «Sin fecha por ahora» sigue (REG-06-145 y TB-15). La validación final y la activación las decide la API.
 * - Lo que cambia frente a la vigente sale de la diferencia entre las dos estructuras, nunca de un texto, y nada califica.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const A = await import('../src/app/pro/advisees/antes-de-activar.ts');
const C = await import('../src/app/pro/advisees/comparar-versiones.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITORES = ['app/pro/advisees/training/editor.tsx', 'app/pro/advisees/nutrition/editor.tsx'];
const listo = { impiden: 0, revisando: false, sinRevisar: false, sinGuardar: false, eligioCuando: true };

test('TEST-EDP-008 · el principal: apagado con su motivo mientras falte algo, y encendido solo con todo listo', () => {
  assert.equal(A.motivoDelPrincipal(listo), null);
  assert.equal(A.motivoDelPrincipal({ ...listo, impiden: 1, eligioCuando: false }), 'Falta corregir 1 cosa y elegir cuándo la revisás');
  assert.equal(A.motivoDelPrincipal({ ...listo, impiden: 2 }), 'Falta corregir 2 cosas');
  assert.equal(A.motivoDelPrincipal({ ...listo, sinGuardar: true, impiden: 1, eligioCuando: false }), 'Falta guardar los cambios, corregir 1 cosa y elegir cuándo la revisás');
  assert.equal(A.motivoDelPrincipal({ ...listo, revisando: true }), 'Revisando el plan…');
  assert.equal(A.motivoDelPrincipal({ ...listo, sinRevisar: true }), 'Falta volver a revisar el plan');
  // Nunca se enciende con algo por corregir, sin guardar, sin revisar o sin una elección de fecha (todas las combinaciones).
  for (const impiden of [0, 1, 3])
    for (const revisando of [false, true])
      for (const sinRevisar of [false, true])
        for (const sinGuardar of [false, true])
          for (const eligioCuando of [false, true]) {
            const e = { impiden, revisando, sinRevisar, sinGuardar, eligioCuando };
            const encendido = A.motivoDelPrincipal(e) === null;
            assert.equal(encendido, impiden === 0 && !revisando && !sinRevisar && !sinGuardar && eligioCuando, JSON.stringify(e));
          }
  assert.equal(A.COPY_ANTES_DE_ACTIVAR.activar(9, 'Entrenamiento'), 'Activar la versión 9 de Entrenamiento');
  assert.equal(A.COPY_ANTES_DE_ACTIVAR.titulo(9, 'Nutrición'), 'Antes de activar la versión 9 de Nutrición');
  assert.equal(A.COPY_ANTES_DE_ACTIVAR.revisarYActivar, 'Revisar y activar…');
});

test('TEST-EDP-008 · los editores: una sola entrada fija, la revisión de la API y «Sin fecha por ahora»', () => {
  for (const ruta of EDITORES) {
    const fuente = leer(ruta);
    // La barra: un solo botón lleno, «Revisar y activar…», que abre el cuadro siempre (sin apagarse).
    const barra = fuente.slice(fuente.indexOf('<div className="editor-del-plan__acciones">'), fuente.indexOf('<MenuDeAcciones\n              id="mas-de-la-version"'));
    assert.ok(barra.length > 100, ruta);
    assert.equal((barra.match(/boton--primario/g) ?? []).length, 1, `${ruta}: un solo botón lleno en la barra`);
    assert.match(barra, /<button type="button" className="boton boton--primario" data-revisar-y-activar onClick=\{abrirAntesDeActivar\}>/, ruta);
    assert.match(barra, /\{COPY_ANTES_DE_ACTIVAR\.revisarYActivar\}/, ruta);
    // «Revisar el plan» y «Activar plan» como acciones sueltas ya no están.
    assert.doesNotMatch(fuente, /async function validar\(|abrirLaActivacion|COPY_(ENTRENAMIENTO|NUTRICION)\.(validarPlan|activarPlan)/, ruta);
    // Con todo guardado, el cuadro pide la revisión a la API; la activación la decide la API.
    assert.match(fuente, /if \(confirmar && version && !sucio && !guardando && revision === null\) void revisar\(version\);/, ruta);
    assert.match(fuente, /const r = await api\.validarPlan(DeEntrenamiento)?\(token, planId, v\.version\);/, ruta);
    assert.match(fuente, /await api\.activarPlan(DeEntrenamiento)?\(token, planId, v\.version, intentoDeActivar\.actual\(/, ruta);
    // «¿Cuándo la revisás?» con «Sin fecha por ahora», y el principal espera una elección.
    assert.match(fuente, /cuando=\{\n\s*<CuandoLaRevisas\n[\s\S]*?conSinFecha\n/, ruta);
    assert.match(fuente, /eligioCuando=\{fechaQueResulta\(cuando, hoyEn\(\)\) !== undefined\}/, ruta);
    // Con cambios sin guardar, el cuadro ofrece «Guardar ahora».
    assert.match(fuente, /sinGuardar=\{sucio\}\n\s*guardando=\{guardando\}\n\s*onGuardarAhora=\{\(\) => void guardar\(\)\}/, ruta);
  }
  const cuadro = leer('app/pro/advisees/cuadro-antes-de-activar.tsx');
  assert.match(cuadro, /const motivo = motivoDelPrincipal\(\{ impiden: impiden\.length, revisando, sinRevisar, sinGuardar, eligioCuando \}\);/);
  assert.match(cuadro, /confirmarDeshabilitado=\{motivo !== null\}\n\s*motivo=\{motivo\}/);
  // Al abrirse, el foco va a «Volver al plan»; lo que pasa mientras se revisa se anuncia.
  assert.match(cuadro, /\n\s*focoEnVolver\n/);
  assert.match(cuadro, /role="status" aria-live="polite"/);
  // El diálogo dice el motivo al lado del botón apagado, y al lector.
  const dialogo = leer('components/dialogo.tsx');
  assert.match(dialogo, /aria-describedby=\{motivo \? `\$\{id\}-motivo` : undefined\}/);
});

// ── TEST-EDP-009 · lo que cambia frente a la vigente ───────────────────────────────────────────────────────────

const sentadilla = (reps, id = 'p1') => ({ prescriptionId: id, exerciseVersionId: 'ev-sentadilla', sets: Array.from({ length: 4 }, () => ({ repetitions: reps })), intensity: null });
const vigente = [
  {
    blockId: 'b1',
    label: 'Fuerza 4 · acumulación',
    purpose: null,
    sessions: [
      { sessionId: 's1', label: 'Piernas A', instructions: null, prescriptions: [sentadilla('3')] },
      { sessionId: 's2', label: 'Torso A', instructions: null, prescriptions: [] },
    ],
  },
];
const borrador = [
  {
    blockId: 'b1',
    label: 'Fuerza 4 · acumulación',
    purpose: null,
    sessions: [
      { sessionId: 's1', label: 'Piernas A', instructions: null, prescriptions: [sentadilla('6-8')] },
      { sessionId: 's2', label: 'Torso A', instructions: null, prescriptions: [] },
      { label: 'Tren superior liviano', instructions: null, prescriptions: [] },
    ],
  },
];
const como = {
  nombreDelEjercicio: (id) => ({ 'ev-sentadilla': 'Sentadilla trasera con barra', 'ev-press': 'Press de banca plano con barra' })[id] ?? 'Ejercicio',
  renglon: (p) => `${p.sets.length} × ${p.sets[0]?.repetitions}`,
};

test('TEST-EDP-009 · los contadores salen de la diferencia, con su lista', async () => {
  const c = C.compararEntrenamiento(vigente, borrador, como);
  assert.deepEqual({ modificados: c.modificados, agregados: c.agregados, quitados: c.quitados }, { modificados: 1, agregados: 1, quitados: 0 });
  assert.deepEqual(c.lista, ['+ Tren superior liviano', 'Sentadilla trasera con barra: 4 × 3 → 4 × 6-8']);
  assert.equal(C.textoDeLosContadores(c), '1 modificado · 1 agregado · 0 quitados');
  // Quitar una sesión y un ejercicio, y agregar otro, se cuenta así.
  const otro = structuredClone(borrador);
  otro[0].sessions.splice(1, 1);
  otro[0].sessions[0].prescriptions.push({ exerciseVersionId: 'ev-press', sets: [{ repetitions: '8' }], intensity: null });
  const c2 = C.compararEntrenamiento(vigente, otro, como);
  assert.equal(C.textoDeLosContadores(c2), '1 modificado · 2 agregados · 1 quitado');
  assert.ok(c2.lista.includes('− Torso A'));
  assert.ok(c2.lista.includes('+ Press de banca plano con barra en Piernas A'));
  // Sin vigente (la primera versión), todo es «agregado».
  const primera = C.compararEntrenamiento([], borrador, como);
  assert.equal(primera.modificados + primera.quitados, 0);
  assert.equal(primera.agregados, primera.lista.length);
  // Sin cambios, ningún renglón; un cambio de orden y los días de entrenamiento también cuentan.
  assert.equal(C.compararEntrenamiento(vigente, vigente, como).lista.length, 0);
  // Los identificadores de las partes son los mismos que reconoce ED-61.
  const { IDENTIFICADORES_DEL_SERVIDOR } = await import('../src/app/pro/advisees/es-lo-que-mande.ts');
  assert.deepEqual(C.IDENTIFICADORES_DE_LAS_PARTES, IDENTIFICADORES_DEL_SERVIDOR);
  const agendas = { vigente: { startDate: '2026-11-16', sessions: [], moves: [] }, borrador: { startDate: '2026-11-16', sessions: [{ sessionId: 's1', weekdays: ['MONDAY'] }], moves: [] } };
  assert.deepEqual(C.compararEntrenamiento(vigente, vigente, { ...como, agendas }).lista, ['Días de entrenamiento: cambiaron']);
});

test('TEST-EDP-009 · Nutrición: días tipo, comidas y opciones, contados de la diferencia', () => {
  const opcion = (id, cantidad) => ({ optionId: id, label: 'Opción 1', items: [{ itemId: 'i1', catalogItemId: 'yogur', quantity: { value: cantidad, unit: 'g' } }] });
  const antes = [{ dayTypeId: 'd1', label: 'Día habitual', meals: [{ mealId: 'm1', label: 'Merienda', prescriptionMode: 'COMPOSED_PLATE', options: [opcion('o1', 200)] }] }];
  const ahora = [
    { dayTypeId: 'd1', label: 'Día habitual', meals: [{ mealId: 'm1', label: 'Merienda', prescriptionMode: 'COMPOSED_PLATE', options: [opcion('o1', 250)] }] },
    { label: 'Día de descanso', meals: [{ label: 'Almuerzo', options: [] }] },
  ];
  const c = C.compararNutricion(antes, ahora);
  assert.equal(C.textoDeLosContadores(c), '1 modificado · 1 agregado · 0 quitados');
  assert.deepEqual(c.lista, ['+ Día de descanso', 'Merienda · Opción 1 (Día habitual): cambió lo que lleva']);
});

test('TEST-EDP-009 · nada del resumen califica, y los textos pasan las guardias', () => {
  const c = C.compararEntrenamiento(vigente, borrador, como);
  const T = A.COPY_ANTES_DE_ACTIVAR;
  const textos = [
    ...c.lista,
    C.textoDeLosContadores(c),
    ...Object.entries(T)
      .filter(([clave]) => clave !== 'falta')
      .map(([, t]) => (typeof t === 'function' ? t(9, 'Entrenamiento') : t)),
    T.falta([T.corregir(1), T.elegirCuando]),
  ];
  for (const t of textos) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /óptim|mejor|peor|cumplimiento|adherencia|racha|asesorad|DL-|TB-/i, t);
  }
  // Sin color de estado: el cuadro no usa las clases de bien o mal para el resumen.
  const cuadro = leer('app/pro/advisees/cuadro-antes-de-activar.tsx');
  assert.doesNotMatch(cuadro, /aviso--exito|aviso--error|--exito|insignia--si/);
});
