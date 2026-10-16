/**
 * Entrenamiento · La versión en preparación (WP-ESCRITORIO-AREAS, parte 8): qué se mira según la dirección, dónde está
 * un problema, qué dice un ejercicio plegado con lo escrito y todavía sin guardar, y qué entra al activar.
 *
 * Los resultados esperados se escriben a mano, a partir de la maqueta 28, de lo que el editor ya decía («Bloque →
 * Sesión → Ejercicio N → Serie N») y del renglón que el plan activo muestra para el mismo ejercicio. Si una prueba
 * falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { textoDeSegundos } from './copy-entrenamiento-por-serie';
import {
  PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO,
  avisoDeLoQueNoDejaGuardarElEntrenamiento,
  celdaDeObjetivoDelEditor,
  ejercicioPlegadoDelEditor,
  ejerciciosAbiertosEnElEditor,
  esLoQueTieneLaCelda,
  leerDescanso,
  objetivoElegidoEnLaCelda,
  objetivoEscritoEnLaCelda,
  pedidoDeEjerciciosDelEditor,
  loQueEntraAlActivarElEntrenamiento,
  loQueNoDejaGuardarDelEjercicio,
  loQueNoDejaGuardarElEntrenamiento,
  loQueSeMiraEnElEditor,
  lugarDelProblemaDeEntrenamiento,
  problemasDelEjercicio,
  ubicacionDelProblemaDeEntrenamiento,
  type EjercicioDelEditor,
} from './editor-del-plan-de-entrenamiento';

const KG = 'kg' as const;
const rango = { min: 8, max: 10 };
/** Cuatro series iguales, con RIR 2, 47,5 kg y dos minutos de descanso: todo lo toman de lo general. */
const REMO: EjercicioDelEditor = {
  intensity: { criterion: 'RIR', target: { value: 2 } },
  suggestedLoad: { value: 47.5, unit: KG },
  restSeconds: 120,
  sets: [{ repetitions: rango }, { repetitions: rango }, { repetitions: rango }, { repetitions: rango }],
};
/** Sin criterio de intensidad, sin carga y sin descanso. */
const DOMINADAS: EjercicioDelEditor = { intensity: null, sets: [{ repetitions: { value: 6 } }, { repetitions: { value: 6 } }] };

const BLOQUES = [
  {
    label: 'Fuerza: progresión',
    sessions: [
      { label: 'A · Tren inferior', prescriptions: [REMO, DOMINADAS] },
      { label: '', prescriptions: [] },
    ],
  },
  {
    label: '',
    microcycles: [
      { label: 'Semana 1', sessions: [{ label: 'C', prescriptions: [] }] },
      { label: '', sessions: [{ label: 'D', prescriptions: [] }, { label: 'E', prescriptions: [] }] },
    ],
  },
];

// ─── Lo que se mira, según la dirección ─────────────────────────────────────────────────────────────────────────

test('sin pedir nada se mira el primer bloque y su primera sesión; un bloque sin microciclos no tiene uno elegido', () => {
  assert.deepEqual(loQueSeMiraEnElEditor(BLOQUES, { bloque: null, microciclo: null, sesion: null }), { bloque: 0, conMicrociclos: false, microciclo: -1, sesiones: 2, sesion: 0 });
  assert.deepEqual(loQueSeMiraEnElEditor(BLOQUES, { bloque: '1', microciclo: null, sesion: '2' }), { bloque: 0, conMicrociclos: false, microciclo: -1, sesiones: 2, sesion: 1 });
  // Un microciclo pedido en un bloque que no los usa no cambia nada.
  assert.deepEqual(loQueSeMiraEnElEditor(BLOQUES, { bloque: null, microciclo: '2', sesion: null }), { bloque: 0, conMicrociclos: false, microciclo: -1, sesiones: 2, sesion: 0 });
});

test('en un bloque con microciclos, las sesiones entre las que se elige son las del microciclo elegido', () => {
  assert.deepEqual(loQueSeMiraEnElEditor(BLOQUES, { bloque: '2', microciclo: null, sesion: null }), { bloque: 1, conMicrociclos: true, microciclo: 0, sesiones: 1, sesion: 0 });
  assert.deepEqual(loQueSeMiraEnElEditor(BLOQUES, { bloque: '2', microciclo: '2', sesion: '2' }), { bloque: 1, conMicrociclos: true, microciclo: 1, sesiones: 2, sesion: 1 });
});

test('lo que la dirección pide y la versión no tiene cae en lo primero; donde no hay sesiones, no se mira ninguna', () => {
  assert.deepEqual(loQueSeMiraEnElEditor(BLOQUES, { bloque: '9', microciclo: null, sesion: '9' }), { bloque: 0, conMicrociclos: false, microciclo: -1, sesiones: 2, sesion: 0 });
  assert.deepEqual(loQueSeMiraEnElEditor(BLOQUES, { bloque: '2', microciclo: '7', sesion: '2' }), { bloque: 1, conMicrociclos: true, microciclo: 0, sesiones: 1, sesion: 0 });
  assert.deepEqual(loQueSeMiraEnElEditor([{ label: 'Bloque 1', sessions: [] }], { bloque: null, microciclo: null, sesion: null }), { bloque: 0, conMicrociclos: false, microciclo: -1, sesiones: 0, sesion: -1 });
  assert.deepEqual(loQueSeMiraEnElEditor([], { bloque: '1', microciclo: null, sesion: null }), { bloque: -1, conMicrociclos: false, microciclo: -1, sesiones: 0, sesion: -1 });
});

test('al entrar no hay ningún ejercicio abierto; la dirección los nombra desde uno, separados por punto, y lo que la sesión no tiene se ignora', () => {
  assert.deepEqual([...ejerciciosAbiertosEnElEditor(3, null)], []);
  assert.deepEqual([...ejerciciosAbiertosEnElEditor(3, '1.3')], [0, 2]);
  assert.deepEqual([...ejerciciosAbiertosEnElEditor(3, '2.9.x.0')], [1]);
  // El plan activo escribe «ninguno» cuando se pliega todo: acá es lo mismo que no pedir nada.
  assert.deepEqual([...ejerciciosAbiertosEnElEditor(3, 'ninguno')], []);
  assert.equal(pedidoDeEjerciciosDelEditor(new Set()), null);
  assert.equal(pedidoDeEjerciciosDelEditor(new Set([2, 0])), '1.3');
});

// ─── Dónde está un problema ─────────────────────────────────────────────────────────────────────────────────────

test('la ruta de un problema da las posiciones de su bloque, su microciclo, su sesión, su ejercicio y su serie, hasta donde llegue', () => {
  assert.deepEqual(lugarDelProblemaDeEntrenamiento('blocks[0]'), { bloque: 0, microciclo: null, sesion: null, ejercicio: null, serie: null });
  assert.deepEqual(lugarDelProblemaDeEntrenamiento('blocks[1].microcycles[1].sessions[0].prescriptions[2].sets[3]'), { bloque: 1, microciclo: 1, sesion: 0, ejercicio: 2, serie: 3 });
  assert.deepEqual(lugarDelProblemaDeEntrenamiento('blocks[0].sessions[1].prescriptions[0].intensity.target.value'), { bloque: 0, microciclo: null, sesion: 1, ejercicio: 0, serie: null });
  // Una falla de forma del pedido trae la ruta con puntos y con su prefijo: dice lo mismo.
  assert.deepEqual(lugarDelProblemaDeEntrenamiento('changes.blocks.0.sessions.1.prescriptions.0.sets.2.repetitions'), { bloque: 0, microciclo: null, sesion: 1, ejercicio: 0, serie: 2 });
  assert.deepEqual(lugarDelProblemaDeEntrenamiento('changes.blocks.1.microcycles.0.label'), { bloque: 1, microciclo: 0, sesion: null, ejercicio: null, serie: null });
  // Lo que no es de la estructura no ubica nada: es del plan entero.
  assert.deepEqual(lugarDelProblemaDeEntrenamiento('objectiveVersionId'), { bloque: null, microciclo: null, sesion: null, ejercicio: null, serie: null });
});

test('la ubicación de un problema se dice con los nombres, sin rutas técnicas; lo que no tiene nombre, por lo que es y su número', () => {
  assert.equal(ubicacionDelProblemaDeEntrenamiento('blocks[0].sessions[0].prescriptions[1].sets[1]', BLOQUES), 'Fuerza: progresión → A · Tren inferior → Ejercicio 2 → Serie 2');
  assert.equal(ubicacionDelProblemaDeEntrenamiento('blocks[0].sessions[1]', BLOQUES), 'Fuerza: progresión → Sesión 2');
  assert.equal(ubicacionDelProblemaDeEntrenamiento('blocks[1].microcycles[1].sessions[1]', BLOQUES), 'Bloque 2 → Microciclo 2 → E');
  assert.equal(ubicacionDelProblemaDeEntrenamiento('blocks[1].microcycles[0]', BLOQUES), 'Bloque 2 → Semana 1');
  assert.equal(ubicacionDelProblemaDeEntrenamiento('changes.blocks.0.label', BLOQUES), 'Fuerza: progresión');
  assert.equal(ubicacionDelProblemaDeEntrenamiento('objectiveVersionId', BLOQUES), 'Plan');
  // Una ruta a algo que ya no está (se quitó después de validar) no rompe.
  assert.equal(ubicacionDelProblemaDeEntrenamiento('blocks[7].sessions[2]', BLOQUES), 'Bloque 8 → Sesión 3');
});

test('los problemas de un ejercicio son los que están en él o en una de sus series, no los de otro ejercicio, otra sesión ni otro bloque', () => {
  const rutas = [
    'blocks[0].sessions[0].prescriptions[1]',
    'blocks[0].sessions[0].prescriptions[1].sets[0]',
    'blocks[0].sessions[0].prescriptions[0]',
    'blocks[0].sessions[1].prescriptions[1]',
    'blocks[1].microcycles[0].sessions[0].prescriptions[1]',
    'blocks[0].sessions[0]',
    'objectiveVersionId',
  ];
  assert.equal(problemasDelEjercicio(rutas, { bloque: 0, microciclo: null, sesion: 0, ejercicio: 1 }), 2);
  assert.equal(problemasDelEjercicio(rutas, { bloque: 0, microciclo: null, sesion: 0, ejercicio: 0 }), 1);
  assert.equal(problemasDelEjercicio(rutas, { bloque: 1, microciclo: 0, sesion: 0, ejercicio: 1 }), 1);
  // La sesión de un microciclo no es la sesión del bloque que está en la misma posición.
  assert.equal(problemasDelEjercicio(rutas, { bloque: 1, microciclo: null, sesion: 0, ejercicio: 1 }), 0);
  assert.equal(problemasDelEjercicio([], { bloque: 0, microciclo: null, sesion: 0, ejercicio: 0 }), 0);
});

// ─── Un ejercicio plegado ───────────────────────────────────────────────────────────────────────────────────────

test('un ejercicio plegado dice lo que piden sus series, con lo escrito: si todas piden lo mismo, entero', () => {
  assert.deepEqual(ejercicioPlegadoDelEditor(REMO, 0), { resumen: '4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00', avisos: [] });
  assert.deepEqual(ejercicioPlegadoDelEditor(DOMINADAS, 0), { resumen: '2 × 6 rep. · sin criterio de intensidad', avisos: [] });
  // El criterio viaja como texto en la entrada: con espacios o en minúscula es el mismo.
  assert.equal(ejercicioPlegadoDelEditor({ ...REMO, intensity: { criterion: ' rir ', target: { value: 2 } } }, 0).resumen, '4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00');
});

test('lo que una serie cambia se resuelve como al guardar: con un valor propio o sin objetivo, el renglón dice qué va «por serie»', () => {
  const conPropios: EjercicioDelEditor = { ...REMO, sets: [{ repetitions: rango }, { repetitions: rango }, { repetitions: rango, rir: 1 }, { repetitions: rango, suggestedLoad: null }] };
  assert.equal(ejercicioPlegadoDelEditor(conPropios, 0).resumen, '4 series · 8–10 rep. · carga y RIR por serie · descanso 02:00');
  // Un valor propio igual al general no cambia lo que la serie recibe: el renglón sigue entero.
  const conElMismo: EjercicioDelEditor = { ...REMO, sets: [{ repetitions: rango, rir: 2 }, { repetitions: rango }, { repetitions: rango }, { repetitions: rango, restSeconds: 120 }] };
  assert.equal(ejercicioPlegadoDelEditor(conElMismo, 0).resumen, '4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00');
  assert.equal(ejercicioPlegadoDelEditor({ ...REMO, sets: [] }, 0).resumen, 'Sin series');
});

test('plegar no esconde lo que falta: lo que no deja guardar y los problemas de «Validar» se dicen en el renglón', () => {
  const conUnDatoMal: EjercicioDelEditor = { ...REMO, sets: [{ repetitions: rango }, { repetitions: rango, rir: Number.NaN }, { repetitions: rango }, { repetitions: rango }] };
  // Con un dato que no se entiende no hay resumen que valga: dice cuántas series son.
  assert.deepEqual(ejercicioPlegadoDelEditor(conUnDatoMal, 0), { resumen: '4 series', avisos: ['1 dato que no se entiende'] });
  assert.deepEqual(ejercicioPlegadoDelEditor(REMO, 2).avisos, ['2 problemas para revisar']);
  // El objetivo que falta se dice con su nombre, aparte de lo que no se entiende; cada aviso, con su cuenta.
  const conDos: EjercicioDelEditor = { ...REMO, restSeconds: Number.NaN, suggestedLoad: { value: Number.NaN, unit: KG }, intensity: { criterion: 'RIR', target: { value: Number.NaN } } };
  assert.deepEqual(ejercicioPlegadoDelEditor(conDos, 1), { resumen: '4 series', avisos: ['Falta el objetivo de intensidad', '2 datos que no se entienden', '1 problema para revisar'] });
  assert.deepEqual(ejercicioPlegadoDelEditor({ ...REMO, intensity: { criterion: 'PERCENT_RM', target: { value: Number.NaN } } }, 0), { resumen: '4 series', avisos: ['Falta el objetivo de intensidad'] });
  // Un parámetro sin completar no cambia lo que piden las series: el resumen sigue, y el aviso lo dice.
  const conParametros: EjercicioDelEditor = { ...REMO, professionalParameters: [{ label: '', value: '' }, { label: 'Tempo', value: 'bajar en 3 segundos' }, { label: 'Agarre', value: ' ' }] };
  assert.deepEqual(ejercicioPlegadoDelEditor(conParametros, 0), { resumen: '4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00', avisos: ['2 parámetros sin completar'] });
  assert.deepEqual(ejercicioPlegadoDelEditor({ ...REMO, professionalParameters: [{ label: 'Tempo', value: '' }] }, 0).avisos, ['1 parámetro sin completar']);
});

// ─── Lo que no deja guardar ─────────────────────────────────────────────────────────────────────────────────────

const N = PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO;

test('de un ejercicio no deja guardar lo escrito que no se entiende, en lo general y en cada serie; lo que falta no es un problema', () => {
  assert.deepEqual(loQueNoDejaGuardarDelEjercicio(REMO, 'x'), []);
  assert.deepEqual(loQueNoDejaGuardarDelEjercicio(DOMINADAS, 'x'), []);
  // Vacío no es un error: sin carga, sin descanso, sin repeticiones fijadas, «Sin objetivo en esta serie».
  assert.deepEqual(loQueNoDejaGuardarDelEjercicio({ intensity: null, suggestedLoad: null, restSeconds: null, professionalParameters: [], sets: [{ repetitions: null, rir: null, suggestedLoad: null, restSeconds: null }] }, 'x'), []);
  const todoMal: EjercicioDelEditor = {
    intensity: { criterion: 'RIR', target: { value: Number.NaN } },
    suggestedLoad: { value: Number.NaN, unit: KG },
    restSeconds: Number.NaN,
    professionalParameters: [{ label: 'Tempo', value: 'bajar en 3 segundos' }, { label: 'Pausa', value: Number.NaN }, { label: 'Inclinación', value: 30 }],
    sets: [
      { repetitions: { value: Number.NaN }, rir: Number.NaN },
      { repetitions: { min: 8, max: Number.NaN }, suggestedLoad: { value: Number.NaN, unit: KG }, restSeconds: Number.NaN },
      { repetitions: rango },
    ],
  };
  // En el orden en que se ve: lo general, los parámetros y cada serie (repeticiones, carga, RIR y descanso).
  assert.deepEqual(loQueNoDejaGuardarDelEjercicio(todoMal, 'blocks[0].sessions[1].prescriptions[2]'), [
    { code: N.faltaElObjetivo, path: 'blocks[0].sessions[1].prescriptions[2]' },
    { code: N.cargaIlegible, path: 'blocks[0].sessions[1].prescriptions[2]' },
    { code: N.descansoIlegible, path: 'blocks[0].sessions[1].prescriptions[2]' },
    { code: N.parametroIncompleto, path: 'blocks[0].sessions[1].prescriptions[2].professionalParameters[1]' },
    { code: N.repeticionesIlegibles, path: 'blocks[0].sessions[1].prescriptions[2].sets[0]' },
    { code: N.rirIlegible, path: 'blocks[0].sessions[1].prescriptions[2].sets[0]' },
    { code: N.repeticionesIlegibles, path: 'blocks[0].sessions[1].prescriptions[2].sets[1]' },
    { code: N.cargaIlegible, path: 'blocks[0].sessions[1].prescriptions[2].sets[1]' },
    { code: N.descansoIlegible, path: 'blocks[0].sessions[1].prescriptions[2].sets[1]' },
  ]);
});

test('del plan no dejan guardar un bloque, un microciclo o una sesión sin nombre y lo de cada ejercicio, cada uno con su lugar y en el orden de la estructura', () => {
  const conDatoMal: EjercicioDelEditor = { ...DOMINADAS, restSeconds: Number.NaN };
  const estructura = [
    { label: 'Fuerza', sessions: [{ label: ' ', prescriptions: [REMO, conDatoMal] }] },
    {
      label: '',
      microcycles: [
        { label: 'Semana 1', sessions: [{ label: 'C', prescriptions: [conDatoMal] }] },
        { label: '', sessions: [{ label: '', prescriptions: [] }] },
      ],
      // Con microciclos, las sesiones del bloque no se editan: no se recorren.
      sessions: [{ label: '', prescriptions: [conDatoMal] }],
    },
  ];
  assert.deepEqual(loQueNoDejaGuardarElEntrenamiento(estructura), [
    { code: N.faltaElNombre, path: 'blocks[0].sessions[0]' },
    { code: N.descansoIlegible, path: 'blocks[0].sessions[0].prescriptions[1]' },
    { code: N.faltaElNombre, path: 'blocks[1]' },
    { code: N.descansoIlegible, path: 'blocks[1].microcycles[0].sessions[0].prescriptions[0]' },
    { code: N.faltaElNombre, path: 'blocks[1].microcycles[1]' },
    { code: N.faltaElNombre, path: 'blocks[1].microcycles[1].sessions[0]' },
  ]);
  assert.deepEqual(loQueNoDejaGuardarElEntrenamiento([{ label: 'Bloque 1', sessions: [{ label: 'A', prescriptions: [REMO, DOMINADAS] }] }]), []);
  assert.deepEqual(loQueNoDejaGuardarElEntrenamiento([]), []);
  // Cada lugar de esa lista se puede ubicar y decir: es la ruta que leen los problemas de «Validar».
  assert.deepEqual(lugarDelProblemaDeEntrenamiento('blocks[1].microcycles[1].sessions[0]'), { bloque: 1, microciclo: 1, sesion: 0, ejercicio: null, serie: null });
  assert.equal(ubicacionDelProblemaDeEntrenamiento('blocks[0].sessions[0].prescriptions[1]', estructura), 'Fuerza → Sesión 1 → Ejercicio 2');
});

test('el aviso de lo que no deja guardar dice qué hay que corregir: nombres, datos, o las dos cosas', () => {
  const nombre = { code: N.faltaElNombre, path: 'blocks[0]' };
  const dato = { code: N.rirIlegible, path: 'blocks[0].sessions[0].prescriptions[0].sets[1]' };
  const objetivo = { code: N.faltaElObjetivo, path: 'blocks[0].sessions[0].prescriptions[0]' };
  assert.equal(avisoDeLoQueNoDejaGuardarElEntrenamiento([nombre]), 'Hay nombres sin completar. Completalos antes de guardar.');
  assert.equal(avisoDeLoQueNoDejaGuardarElEntrenamiento([dato]), 'Hay datos que faltan o no se entienden. Corregilos antes de guardar.');
  assert.equal(avisoDeLoQueNoDejaGuardarElEntrenamiento([objetivo]), 'Hay datos que faltan o no se entienden. Corregilos antes de guardar.');
  assert.equal(avisoDeLoQueNoDejaGuardarElEntrenamiento([dato, nombre]), 'Hay nombres sin completar y datos que faltan o no se entienden. Corregilos antes de guardar.');
});

// ─── El descanso, escrito ───────────────────────────────────────────────────────────────────────────────────────

test('el descanso se lee como minutos y segundos, con o sin hora, o como un número solo, que son segundos', () => {
  assert.equal(leerDescanso('2:30'), 150);
  assert.equal(leerDescanso('02:30'), 150);
  assert.equal(leerDescanso(' 02:30 '), 150);
  assert.equal(leerDescanso('1:00:00'), 3600);
  assert.equal(leerDescanso('1:02:03'), 3723);
  assert.equal(leerDescanso('90:00'), 5400);
  // Un número solo son segundos, como se venía escribiendo. Cero es sin pausa: no es «nada».
  assert.equal(leerDescanso('150'), 150);
  assert.equal(leerDescanso('90'), 90);
  assert.equal(leerDescanso('0'), 0);
  assert.equal(leerDescanso('00:00'), 0);
});

test('lo que no es un descanso no se adivina: ni medio segundo, ni «2:5», ni setenta y cinco segundos después de los dos puntos', () => {
  for (const mal of ['', ' ', 'abc', '2:5', '2:75', '1:60:00', '1:2:03', '90,5', '90.5', '-30', '2:30:', ':30', '2 30', '1:00:00:00', '2m30s']) assert.equal(leerDescanso(mal), null, `«${mal}»`);
});

test('el descanso que se muestra se vuelve a leer igual: escribirlo y leerlo no lo cambia', () => {
  for (const segundos of [0, 1, 59, 60, 61, 90, 150, 599, 600, 3599, 3600]) assert.equal(leerDescanso(textoDeSegundos(segundos) ?? ''), segundos, `${segundos} s`);
  assert.equal(textoDeSegundos(150), '02:30');
  assert.equal(textoDeSegundos(3600), '1:00:00');
});

// ─── La celda de un objetivo de una serie ───────────────────────────────────────────────────────────────────────

test('una celda vacía toma de lo general: lo muestra en gris, lo dice con palabras y ofrece quitarle el objetivo a la serie', () => {
  assert.deepEqual(celdaDeObjetivoDelEditor(undefined, '62,5 kg'), { estado: 'de-lo-general', sinValor: '62,5 kg', enGris: true, descripcion: 'Vacío: toma 62,5 kg de lo general.', opciones: ['sin-objetivo'] });
  // Si lo general tampoco lo tiene, la serie queda sin objetivo, y también va en gris: nadie lo eligió para esta serie.
  assert.deepEqual(celdaDeObjetivoDelEditor(undefined, null), { estado: 'de-lo-general', sinValor: 'Sin objetivo', enGris: true, descripcion: 'Vacío: sin objetivo, porque lo general no lo tiene.', opciones: ['sin-objetivo'] });
});

test('«Sin objetivo» elegido para una serie va en el color del texto y ofrece volver a tomar de lo general', () => {
  assert.deepEqual(celdaDeObjetivoDelEditor(null, '02:30'), { estado: 'sin-objetivo', sinValor: 'Sin objetivo', enGris: false, descripcion: 'Sin objetivo en esta serie. Lo general: 02:30.', opciones: ['de-lo-general'] });
  assert.deepEqual(celdaDeObjetivoDelEditor(null, null), { estado: 'sin-objetivo', sinValor: 'Sin objetivo', enGris: false, descripcion: 'Sin objetivo en esta serie.', opciones: ['de-lo-general'] });
});

test('con un valor propio la celda ofrece las dos salidas; el cero es un valor, y lo que no se entiende se dice', () => {
  assert.deepEqual(celdaDeObjetivoDelEditor(60, '62,5 kg'), { estado: 'propio', sinValor: '62,5 kg', enGris: true, descripcion: 'Propio de esta serie. Lo general: 62,5 kg.', opciones: ['sin-objetivo', 'de-lo-general'] });
  assert.deepEqual(celdaDeObjetivoDelEditor(0, null), { estado: 'propio', sinValor: 'Sin objetivo', enGris: true, descripcion: 'Propio de esta serie.', opciones: ['sin-objetivo', 'de-lo-general'] });
  assert.deepEqual(celdaDeObjetivoDelEditor(Number.NaN, 'RIR 2'), { estado: 'no-se-entiende', sinValor: 'RIR 2', enGris: true, descripcion: 'No se entiende lo escrito.', opciones: ['sin-objetivo', 'de-lo-general'] });
});

test('lo que la celda deja en la serie: vacía, nada; un número, el propio; lo que no se entiende, NaN; «Sin objetivo» se elige, no se escribe', () => {
  const leerNumero = (t: string): number | null => (/^\d+(,\d+)?$/.test(t.trim()) ? Number(t.trim().replace(',', '.')) : null);
  assert.equal(objetivoEscritoEnLaCelda('', leerNumero), undefined);
  assert.equal(objetivoEscritoEnLaCelda('   ', leerNumero), undefined);
  assert.equal(objetivoEscritoEnLaCelda('60', leerNumero), 60);
  assert.equal(objetivoEscritoEnLaCelda('0', leerNumero), 0);
  assert.equal(objetivoEscritoEnLaCelda('62,5', leerNumero), 62.5);
  assert.ok(Number.isNaN(objetivoEscritoEnLaCelda('abc', leerNumero)));
  assert.equal(objetivoEscritoEnLaCelda('2:30', leerDescanso), 150);
  assert.ok(Number.isNaN(objetivoEscritoEnLaCelda('2:75', leerDescanso)));
  assert.equal(objetivoElegidoEnLaCelda('sin-objetivo'), null);
  assert.equal(objetivoElegidoEnLaCelda('de-lo-general'), undefined);
});

test('lo escrito en la celda es lo que la serie tiene: vacía vale por nada y por «Sin objetivo»; lo que no se entiende, solo por sí mismo', () => {
  assert.equal(esLoQueTieneLaCelda(undefined, undefined), true);
  assert.equal(esLoQueTieneLaCelda(undefined, null), true);
  assert.equal(esLoQueTieneLaCelda(undefined, 60), false);
  // Un cero es un valor: la celda vacía no vale por él, y tiene que mostrarlo (el cero se muestra, no se esconde).
  assert.equal(esLoQueTieneLaCelda(undefined, 0), false);
  assert.equal(esLoQueTieneLaCelda(60, 60), true);
  assert.equal(esLoQueTieneLaCelda(60, 62.5), false);
  assert.equal(esLoQueTieneLaCelda(0, null), false);
  assert.equal(esLoQueTieneLaCelda(0, undefined), false);
  assert.equal(esLoQueTieneLaCelda(Number.NaN, Number.NaN), true);
  // Algo mal escrito que quedó en la celda no vale por «Sin objetivo» ni por nada: la celda se limpia.
  assert.equal(esLoQueTieneLaCelda(Number.NaN, null), false);
  assert.equal(esLoQueTieneLaCelda(Number.NaN, undefined), false);
  assert.equal(esLoQueTieneLaCelda(Number.NaN, 60), false);
});

// ─── Activar ───────────────────────────────────────────────────────────────────────────────────────────────────

test('lo que entra al activar se cuenta de la estructura, con las sesiones de los microciclos, en singular y en plural', () => {
  assert.equal(loQueEntraAlActivarElEntrenamiento(BLOQUES), '2 bloques y 5 sesiones');
  assert.equal(loQueEntraAlActivarElEntrenamiento([{ label: 'Bloque 1', sessions: [{ label: 'A', prescriptions: [] }] }]), '1 bloque y 1 sesión');
  assert.equal(loQueEntraAlActivarElEntrenamiento([{ label: 'Bloque 1', sessions: [] }]), '1 bloque y 0 sesiones');
  assert.equal(loQueEntraAlActivarElEntrenamiento([]), '0 bloques y 0 sesiones');
});

test('los textos que arma el editor describen: no usan una palabra de la lista de Entrenamiento', () => {
  const textos = [
    ...ejercicioPlegadoDelEditor(REMO, 2).avisos,
    ...ejercicioPlegadoDelEditor({ ...REMO, restSeconds: Number.NaN, intensity: { criterion: 'RIR', target: { value: Number.NaN } }, professionalParameters: [{ label: '', value: '' }] }, 1).avisos,
    avisoDeLoQueNoDejaGuardarElEntrenamiento([{ code: N.faltaElNombre, path: 'blocks[0]' }]),
    avisoDeLoQueNoDejaGuardarElEntrenamiento([{ code: N.rirIlegible, path: 'blocks[0]' }]),
    avisoDeLoQueNoDejaGuardarElEntrenamiento([{ code: N.faltaElNombre, path: 'blocks[0]' }, { code: N.rirIlegible, path: 'blocks[0]' }]),
    ...[undefined, null, 60, Number.NaN].flatMap((v) => [celdaDeObjetivoDelEditor(v, '62,5 kg'), celdaDeObjetivoDelEditor(v, null)]).flatMap((c) => [c.sinValor, c.descripcion]),
    ejercicioPlegadoDelEditor(REMO, 0).resumen,
    ejercicioPlegadoDelEditor(DOMINADAS, 0).resumen,
    ubicacionDelProblemaDeEntrenamiento('blocks[0].sessions[0].prescriptions[1].sets[1]', BLOQUES),
    loQueEntraAlActivarElEntrenamiento(BLOQUES),
  ];
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t).map((p) => `${p} en «${t}»`)), []);
});
