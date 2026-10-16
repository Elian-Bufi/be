/**
 * Entrenamiento · Plan (WP-ESCRITORIO-AREAS, parte 6): qué bloque, qué microciclo y qué sesión se muestran; el renglón
 * de un ejercicio plegado; las series con el objetivo que recibe el teléfono; lo general del ejercicio; y los textos.
 *
 * Los resultados esperados se escriben a mano, a partir de la maqueta 24 y de las reglas de BE (un `null` es «sin
 * objetivo», nunca un cero; lo que cambia de una serie a otra no se resume con la primera ni con un rango). Si una
 * prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PrescripcionConObjetivos, SerieConObjetivo } from './contratos-entrenamiento-por-serie';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { COPY_DEL_PLAN_DE_ENTRENAMIENTO, cuentaDeLaSesion, encabezadoDelEjercicio, loGeneralDelEjercicio, loQueSeMiraDelPlan, renglonDelEjercicio, seriesDelEjercicio, sesionesDelBloque } from './lectura-del-plan-de-entrenamiento';

const kg = (value: number) => ({ value, unit: 'kg' as const });
const rir = (value: number): PrescripcionConObjetivos['intensity'] => ({ criterion: 'RIR', target: { value, reference: null } });
const porcentaje = (value: number, descripcion: string | null = null): PrescripcionConObjetivos['intensity'] => ({ criterion: 'PERCENT_RM', target: { value, reference: descripcion ? { description: descripcion } : null } });
const DE_LA_PRESCRIPCION = { rir: 'PRESCRIPTION', suggestedLoad: 'PRESCRIPTION', restSeconds: 'PRESCRIPTION' } as const;
/** Una serie con su objetivo ya resuelto, como lo entrega la API. Lo que no se dice es «sin objetivo». */
const serie = (setIndex: number, objetivo: Partial<SerieConObjetivo['target']> = {}, note: string | null = null): SerieConObjetivo => ({
  setIndex,
  note,
  target: { repetitions: null, rir: null, suggestedLoad: null, restSeconds: null, ...objetivo },
  targetOrigin: DE_LA_PRESCRIPCION,
});
const iguales = (cuantas: number, objetivo: Partial<SerieConObjetivo['target']>): SerieConObjetivo[] => Array.from({ length: cuantas }, (_, i) => serie(i + 1, objetivo));
const OCHO_A_DIEZ = { min: 8, max: 10 };
const SEIS_A_OCHO = { min: 6, max: 8 };

// ─── Qué se mira ────────────────────────────────────────────────────────────────────────────────

const sesion = (order: number, label: string) => ({ sessionId: `s-${label}`, label, order, instructions: null, prescriptions: [] });
// Llegan desordenados: lo primero es lo de menor orden, no lo que llegó primero.
const BLOQUES = [
  {
    blockId: 'b2',
    label: 'Descarga',
    order: 2,
    purpose: null,
    sessions: [],
    microcycles: [
      { microcycleId: 'm2', label: 'Semana 2', order: 2, purpose: null, sessions: [sesion(1, 'Liviana')] },
      { microcycleId: 'm1', label: 'Semana 1', order: 1, purpose: null, sessions: [sesion(2, 'Tren superior, suave'), sesion(1, 'Tren inferior, suave')] },
    ],
  },
  { blockId: 'b1', label: 'Fuerza', order: 1, purpose: null, microcycles: [], sessions: [sesion(2, 'B · Tren superior'), sesion(1, 'A · Tren inferior')] },
];
const nombres = (m: ReturnType<typeof loQueSeMiraDelPlan>) => [m.bloque?.label ?? null, m.microciclo?.label ?? null, m.sesion?.label ?? null, m.sesiones.map((s) => s.label).join(' | ')];

test('sin pedir nada se mira el primer bloque y su primera sesión; un bloque sin microciclos no tiene microciclo', () => {
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: null, microciclo: null, sesion: null })), ['Fuerza', null, 'A · Tren inferior', 'A · Tren inferior | B · Tren superior']);
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: '1', microciclo: null, sesion: '2' })), ['Fuerza', null, 'B · Tren superior', 'A · Tren inferior | B · Tren superior']);
  // Un bloque que no usa microciclos no tiene microciclo: no se inventa uno para ponerle las sesiones.
  assert.equal(loQueSeMiraDelPlan(BLOQUES, { bloque: '1', microciclo: null, sesion: null }).microciclo, null);
  assert.equal(loQueSeMiraDelPlan(BLOQUES, { bloque: '1', microciclo: '1', sesion: null }).microciclo, null);
  // Un microciclo pedido en un bloque que no los usa se ignora.
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: '1', microciclo: '2', sesion: null })), ['Fuerza', null, 'A · Tren inferior', 'A · Tren inferior | B · Tren superior']);
});

test('en un bloque con microciclos, las sesiones son las del microciclo elegido; sin pedirlo, el primero', () => {
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: '2', microciclo: null, sesion: null })), ['Descarga', 'Semana 1', 'Tren inferior, suave', 'Tren inferior, suave | Tren superior, suave']);
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: '2', microciclo: '2', sesion: null })), ['Descarga', 'Semana 2', 'Liviana', 'Liviana']);
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: '2', microciclo: '1', sesion: '2' })), ['Descarga', 'Semana 1', 'Tren superior, suave', 'Tren inferior, suave | Tren superior, suave']);
});

test('lo que la versión no tiene no es un error ni deja la pantalla vacía: se muestra lo primero', () => {
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: '9', microciclo: '9', sesion: '9' })), ['Fuerza', null, 'A · Tren inferior', 'A · Tren inferior | B · Tren superior']);
  assert.deepEqual(nombres(loQueSeMiraDelPlan(BLOQUES, { bloque: '2', microciclo: 'x', sesion: '7' })), ['Descarga', 'Semana 1', 'Tren inferior, suave', 'Tren inferior, suave | Tren superior, suave']);
  assert.deepEqual(nombres(loQueSeMiraDelPlan([], { bloque: '1', microciclo: null, sesion: null })), [null, null, null, '']);
  const sinSesiones = [{ blockId: 'b', label: 'Vacío', order: 1, purpose: null, microcycles: [], sessions: [] }];
  assert.deepEqual(nombres(loQueSeMiraDelPlan(sinSesiones, { bloque: null, microciclo: null, sesion: null })), ['Vacío', null, null, '']);
});

test('las sesiones de un bloque se cuentan con las de sus microciclos; una sola, en singular; ninguna, dicho', () => {
  assert.equal(sesionesDelBloque(BLOQUES[1]!), '2 sesiones');
  assert.equal(sesionesDelBloque(BLOQUES[0]!), '3 sesiones');
  assert.equal(sesionesDelBloque({ sessions: [sesion(1, 'Única')], microcycles: [] }), '1 sesión');
  // Un bloque sin sesiones lo dice: no «0 sesiones».
  assert.equal(sesionesDelBloque({ sessions: [], microcycles: [] }), 'sin sesiones');
});

test('lo que tiene una sesión: ejercicios y series, contadas', () => {
  assert.equal(cuentaDeLaSesion({ prescriptions: [{ sets: iguales(4, {}) }, { sets: iguales(4, {}) }, { sets: iguales(4, {}) }] }), '3 ejercicios · 12 series');
  assert.equal(cuentaDeLaSesion({ prescriptions: [{ sets: iguales(1, {}) }] }), '1 ejercicio · 1 serie');
});

// ─── Un ejercicio ───────────────────────────────────────────────────────────────────────────────

test('la cabecera de un ejercicio abierto dice cuántas series tiene y con qué criterio; sin criterio, lo dice', () => {
  assert.equal(encabezadoDelEjercicio({ sets: iguales(4, {}), intensity: rir(2) }), '4 series · criterio de intensidad: RIR');
  assert.equal(encabezadoDelEjercicio({ sets: iguales(3, {}), intensity: porcentaje(75) }), '3 series · criterio de intensidad: % RM');
  assert.equal(encabezadoDelEjercicio({ sets: iguales(1, {}), intensity: null }), '1 serie · sin criterio de intensidad');
});

test('plegado, un ejercicio con todas las series iguales se dice en un renglón, como en la maqueta', () => {
  assert.equal(renglonDelEjercicio({ sets: iguales(4, { repetitions: OCHO_A_DIEZ, suggestedLoad: kg(47.5), rir: 2, restSeconds: 120 }), intensity: rir(2) }), '4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00');
  assert.equal(renglonDelEjercicio({ sets: iguales(4, { repetitions: { value: 6 }, restSeconds: 120 }), intensity: null }), '4 × 6 rep. · sin criterio de intensidad · descanso 02:00');
  // Con % RM la intensidad es la general; sin descanso recomendado, no se dice ninguno.
  assert.equal(renglonDelEjercicio({ sets: iguales(3, { repetitions: { value: 5 }, suggestedLoad: kg(100) }), intensity: porcentaje(75, '1RM estimado') }), '3 × 5 rep. · 100 kg · 75 % RM');
  // Una carga de cero se muestra: es un dato, no una ausencia.
  assert.equal(renglonDelEjercicio({ sets: iguales(2, { repetitions: { value: 12 }, suggestedLoad: kg(0), rir: 3 }), intensity: rir(3) }), '2 × 12 rep. · 0 kg · RIR 3');
});

test('lo que cambia de una serie a otra se dice «por serie»: ni la primera por todas, ni un rango', () => {
  // La maqueta: la carga y el RIR cambian; las repeticiones y el descanso, no.
  const comoLaMaqueta = [
    serie(1, { repetitions: SEIS_A_OCHO, suggestedLoad: kg(62.5), rir: 2, restSeconds: 150 }),
    serie(2, { repetitions: SEIS_A_OCHO, suggestedLoad: kg(62.5), rir: 2, restSeconds: 150 }),
    serie(3, { repetitions: SEIS_A_OCHO, suggestedLoad: kg(62.5), rir: 1, restSeconds: 150 }),
    serie(4, { repetitions: SEIS_A_OCHO, suggestedLoad: kg(60), rir: 1, restSeconds: 150 }),
  ];
  assert.equal(renglonDelEjercicio({ sets: comoLaMaqueta, intensity: rir(2) }), '4 series · 6–8 rep. · carga y RIR por serie · descanso 02:30');
  // Si la última serie no tiene descanso recomendado, el descanso también cambia de una serie a otra.
  const sinDescansoEnLaUltima = [...comoLaMaqueta.slice(0, 3), serie(4, { repetitions: SEIS_A_OCHO, suggestedLoad: kg(60), rir: 1, restSeconds: null })];
  const renglon = renglonDelEjercicio({ sets: sinDescansoEnLaUltima, intensity: rir(2) });
  assert.equal(renglon, '4 series · 6–8 rep. · carga, RIR y descanso por serie');
  assert.equal(/RIR \d/.test(renglon), false, 'no dice el RIR de una serie como si fuera el de todas');
  assert.equal(/62,5|60 kg/.test(renglon), false, 'no dice la carga de una serie como si fuera la de todas');
  // Una pirámide: cambian solo las repeticiones.
  const piramide = [serie(1, { repetitions: { value: 10 }, suggestedLoad: kg(60), rir: 2, restSeconds: 90 }), serie(2, { repetitions: { value: 8 }, suggestedLoad: kg(60), rir: 2, restSeconds: 90 }), serie(3, { repetitions: { value: 6 }, suggestedLoad: kg(60), rir: 2, restSeconds: 90 })];
  assert.equal(renglonDelEjercicio({ sets: piramide, intensity: rir(2) }), '3 series · 60 kg · RIR 2 · repeticiones por serie · descanso 01:30');
});

test('un ejercicio sin repeticiones fijadas o sin series lo dice; nunca un cero', () => {
  assert.equal(renglonDelEjercicio({ sets: iguales(3, { rir: 2 }), intensity: rir(2) }), '3 series sin repeticiones fijadas · RIR 2');
  assert.equal(renglonDelEjercicio({ sets: [], intensity: rir(2) }), 'Sin series');
  // Sin criterio, el RIR de una serie no cuenta para decidir si las series son iguales: no existe sin el criterio RIR.
  assert.equal(renglonDelEjercicio({ sets: [serie(1, { repetitions: { value: 6 } }), serie(2, { repetitions: { value: 6 } })], intensity: null }), '2 × 6 rep. · sin criterio de intensidad');
});

test('las series, con el objetivo que recibe el teléfono: lo que falta es `null`, y la pantalla lo dice', () => {
  const p = {
    intensity: rir(2),
    // Llegan desordenadas.
    sets: [
      serie(4, { repetitions: SEIS_A_OCHO, suggestedLoad: kg(60), rir: 1, restSeconds: null }, 'Si se pierde la técnica, cortar la serie.'),
      serie(1, { repetitions: SEIS_A_OCHO, suggestedLoad: kg(62.5), rir: 2, restSeconds: 150 }),
    ],
  };
  assert.deepEqual(seriesDelEjercicio(p), {
    filas: [
      { serie: 1, carga: '62,5 kg', repeticiones: '6–8 rep.', rir: 'RIR 2', descanso: '02:30', nota: null },
      { serie: 4, carga: '60 kg', repeticiones: '6–8 rep.', rir: 'RIR 1', descanso: null, nota: 'Si se pierde la técnica, cortar la serie.' },
    ],
    conRir: true,
    conNota: true,
  });
});

test('la columna del RIR va con el criterio RIR o si alguna serie tiene uno; la de la nota, si alguna la tiene', () => {
  const sinCriterio = seriesDelEjercicio({ intensity: null, sets: iguales(2, { repetitions: { value: 6 }, restSeconds: 120 }) });
  assert.deepEqual([sinCriterio.conRir, sinCriterio.conNota], [false, false]);
  assert.deepEqual(sinCriterio.filas[0], { serie: 1, carga: null, repeticiones: '6 rep.', rir: null, descanso: '02:00', nota: null });
  assert.equal(seriesDelEjercicio({ intensity: rir(2), sets: iguales(2, {}) }).conRir, true);
  assert.equal(seriesDelEjercicio({ intensity: porcentaje(70), sets: [serie(1, { rir: 2 })] }).conRir, true);
  assert.equal(seriesDelEjercicio({ intensity: porcentaje(70), sets: [serie(1)] }).conRir, false);
  // Una nota vacía no es una nota.
  assert.equal(seriesDelEjercicio({ intensity: null, sets: [serie(1, {}, '   ')] }).conNota, false);
});

test('lo general del ejercicio, como en la maqueta; lo que no se declaró no ocupa un renglón', () => {
  assert.deepEqual(loGeneralDelEjercicio({ intensity: rir(2), loadBasis: 'TOTAL_EXTERNAL', repetitionBasis: 'PER_SET', professionalParameters: [], note: 'Bajar en 3 segundos y subir en 1.' }), [
    { rotulo: 'Intensidad', valor: 'RIR 2' },
    { rotulo: 'La carga se cuenta', valor: 'carga externa total' },
    { rotulo: 'Las repeticiones', valor: 'por serie' },
    { rotulo: 'Notas', valor: 'Bajar en 3 segundos y subir en 1.' },
  ]);
  assert.deepEqual(loGeneralDelEjercicio({ intensity: null, loadBasis: null, repetitionBasis: null, professionalParameters: [], note: null }), [{ rotulo: 'Intensidad', valor: 'Sin criterio de intensidad' }]);
  // La referencia del % RM y los parámetros del profesional, con su unidad tal como la escribió; un número, con coma.
  assert.deepEqual(
    loGeneralDelEjercicio({
      intensity: porcentaje(72.5, '1RM estimado en la última evaluación'),
      loadBasis: 'PER_IMPLEMENT',
      repetitionBasis: 'PER_SIDE',
      professionalParameters: [
        { label: 'Tempo', value: '3-1-1' },
        { label: 'Pausa abajo', value: 1.5, unit: 's' },
      ],
      note: null,
    }),
    [
      { rotulo: 'Intensidad', valor: '72,5 % RM (1RM estimado en la última evaluación)' },
      { rotulo: 'La carga se cuenta', valor: 'por mancuerna o implemento' },
      { rotulo: 'Las repeticiones', valor: 'por lado; no se duplican' },
      { rotulo: 'Tempo', valor: '3-1-1' },
      { rotulo: 'Pausa abajo', valor: '1,5 s' },
    ],
  );
});

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

test('los textos del plan de entrenamiento: ninguno usa un término prohibido, tampoco los que llevan un dato', () => {
  const textos: string[] = [];
  const juntar = (valor: unknown): void => {
    if (typeof valor === 'string') textos.push(valor);
    else if (typeof valor === 'function') juntar((valor as (...a: unknown[]) => unknown)(7, '7 oct'));
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(juntar);
  };
  juntar(COPY_DEL_PLAN_DE_ENTRENAMIENTO);
  textos.push(encabezadoDelEjercicio({ sets: [], intensity: null }), renglonDelEjercicio({ sets: iguales(2, { repetitions: { value: 6 } }), intensity: null }), sesionesDelBloque(BLOQUES[0]!), cuentaDeLaSesion({ prescriptions: [] }));
  assert.ok(textos.length > 30);
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t).map((p) => `${p} en «${t}»`)), []);
  assert.equal(COPY_DEL_PLAN_DE_ENTRENAMIENTO.deCuantas(7), 'de 7');
});
