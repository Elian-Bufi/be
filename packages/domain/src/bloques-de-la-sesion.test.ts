/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION, decisión de Dirección del 2026-11-18) · el bloque dentro de la sesión: una
 * marca sobre la lista, que no cambia lo de antes. Datos sintéticos, validados contra los esquemas estrictos del contrato.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  bloqueNuevo,
  descansoEnPalabras,
  indicacionDeVueltas,
  nuevoIdDeBloque,
  partesDeLaSesion,
  problemasDeLosBloquesAlGuardar,
  resumenDelBloque,
  seriesParaLasVueltas,
  seriesQueNoSonLasVueltas,
  sinBloque,
} from './bloques-de-la-sesion';
import { CAPACIDAD_BLOQUES_DE_LA_SESION, capacidadesDeclaradas } from './compatibilidad-de-clientes';
import {
  BloqueDeLaSesionEntradaSchema,
  EstructuraDePlanDeEntrenamientoEntradaSchema,
  PrescripcionSchema,
  SesionPlanificadaSchema,
  type EstructuraDePlanDeEntrenamientoEntrada,
} from './contratos-entrenamiento';
import { normalizarEstructuraDeEntrenamiento, problemasDeCompletitud, type ContenidoDePlanDeEntrenamiento } from './plan-de-entrenamiento';

const EJERCICIO = '7d0c1f7e-0000-4000-8000-000000000001';
const ejercicio = (extra: Record<string, unknown> = {}) => ({ exerciseVersionId: EJERCICIO, sets: [{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }, { repetitions: { value: 8 } }], intensity: null, ...extra });
const estructura = (e: unknown): EstructuraDePlanDeEntrenamientoEntrada => EstructuraDePlanDeEntrenamientoEntradaSchema.parse(e);
let n = 0;
const nuevoId = () => `id-${++n}`;
const normalizar = (e: unknown) => normalizarEstructuraDeEntrenamiento(estructura(e), nuevoId);
const huella = (c: ContenidoDePlanDeEntrenamiento) => createHash('sha256').update(JSON.stringify(c)).digest('hex');

test('DL-181 · una sesión sin bloques se guarda idéntica a las de antes: sin claves nuevas, con la misma huella', () => {
  n = 0;
  const antes = normalizar({ blocks: [{ blockId: 'f1', label: 'Fase 1', sessions: [{ sessionId: 's1', label: 'A', prescriptions: [ejercicio({ prescriptionId: 'p1' })] }] }] });
  assert.ok(antes.ok);
  const s = antes.contenido.blocks[0]!.sessions[0]!;
  assert.equal('exerciseGroups' in s, false);
  assert.equal('exerciseGroupId' in s.prescriptions[0]!, false);
  // Con la lista vacía y un ejercicio con `exerciseGroupId: null`, también: lo que no tiene bloques no lleva las claves.
  n = 0;
  const conVacios = normalizar({
    blocks: [{ blockId: 'f1', label: 'Fase 1', sessions: [{ sessionId: 's1', label: 'A', exerciseGroups: [], prescriptions: [ejercicio({ prescriptionId: 'p1', exerciseGroupId: null })] }] }],
  });
  assert.ok(conVacios.ok);
  assert.equal(huella(conVacios.contenido), huella(antes.contenido));
});

test('DL-181 · los bloques se guardan en su forma canónica: las vueltas solo en «En vueltas»', () => {
  const r = normalizar({
    blocks: [
      {
        label: 'Fase 1',
        sessions: [
          {
            label: 'A',
            exerciseGroups: [
              { groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 },
              { groupId: 'g-2', label: 'Core', kind: 'SEQUENTIAL' },
            ],
            prescriptions: [ejercicio({ exerciseGroupId: 'g-1' }), ejercicio({ exerciseGroupId: 'g-1' }), ejercicio(), ejercicio({ exerciseGroupId: 'g-2' })],
          },
        ],
      },
    ],
  });
  assert.ok(r.ok);
  const s = r.contenido.blocks[0]!.sessions[0]!;
  assert.deepEqual(s.exerciseGroups, [
    { groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 },
    { groupId: 'g-2', label: 'Core', kind: 'SEQUENTIAL' },
  ]);
  assert.deepEqual(
    s.prescriptions.map((p) => p.exerciseGroupId ?? null),
    ['g-1', 'g-1', null, 'g-2'],
  );
  assert.equal('exerciseGroupId' in s.prescriptions[2]!, false);
});

test('DL-181 · el contrato: «En vueltas» pide las vueltas, «Seguido» no las admite, y las vueltas van de 1 a 20', () => {
  assert.equal(BloqueDeLaSesionEntradaSchema.safeParse({ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS' }).success, false);
  assert.equal(BloqueDeLaSesionEntradaSchema.safeParse({ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3 }).success, true);
  assert.equal(BloqueDeLaSesionEntradaSchema.safeParse({ groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 21 }).success, false);
  assert.equal(BloqueDeLaSesionEntradaSchema.safeParse({ groupId: 'g-1', label: 'Torso', kind: 'SEQUENTIAL', rounds: 3 }).success, false);
  assert.equal(BloqueDeLaSesionEntradaSchema.safeParse({ groupId: 'g-1', label: 'Torso', kind: 'SEQUENTIAL', restAfterRoundSeconds: 60 }).success, false);
  assert.equal(BloqueDeLaSesionEntradaSchema.safeParse({ groupId: 'g-1', label: ' ', kind: 'SEQUENTIAL' }).success, false);
  assert.equal(BloqueDeLaSesionEntradaSchema.safeParse({ groupId: 'g.1', label: 'Torso', kind: 'SEQUENTIAL' }).success, false);
});

test('DL-181 · al guardar: el bloque existe en la sesión, sus ejercicios van seguidos y su identificador no se repite', () => {
  const desconocido = normalizar({ blocks: [{ label: 'F', sessions: [{ label: 'A', prescriptions: [ejercicio({ exerciseGroupId: 'g-9' })] }] }] });
  assert.equal(desconocido.ok, false);
  assert.ok(!desconocido.ok && desconocido.tipo === 'ESTRUCTURA');
  assert.deepEqual(!desconocido.ok && desconocido.issues, [{ code: 'EXERCISE_GROUP_UNKNOWN', path: 'blocks[0].sessions[0].prescriptions[0].exerciseGroupId' }]);

  const conHueco = normalizar({
    blocks: [{ label: 'F', sessions: [{ label: 'A', exerciseGroups: [{ groupId: 'g-1', label: 'T', kind: 'SEQUENTIAL' }], prescriptions: [ejercicio({ exerciseGroupId: 'g-1' }), ejercicio(), ejercicio({ exerciseGroupId: 'g-1' })] }] }],
  });
  assert.deepEqual(!conHueco.ok && conHueco.issues, [{ code: 'EXERCISE_GROUP_NOT_CONTIGUOUS', path: 'blocks[0].sessions[0].prescriptions[2].exerciseGroupId' }]);

  const repetido = normalizar({
    blocks: [
      {
        label: 'F',
        sessions: [
          {
            label: 'A',
            exerciseGroups: [
              { groupId: 'g-1', label: 'T', kind: 'SEQUENTIAL' },
              { groupId: 'g-1', label: 'P', kind: 'SEQUENTIAL' },
            ],
            prescriptions: [ejercicio({ exerciseGroupId: 'g-1' })],
          },
        ],
      },
    ],
  });
  assert.deepEqual(!repetido.ok && repetido.issues, [{ code: 'DUPLICATE_NODE_ID', path: 'blocks[0].sessions[0].exerciseGroups[1].groupId' }]);

  // El identificador del bloque es de la sesión: el mismo en dos sesiones (una sesión duplicada) se guarda.
  const enDosSesiones = normalizar({
    blocks: [
      {
        label: 'F',
        sessions: [
          { label: 'A', exerciseGroups: [{ groupId: 'g-1', label: 'T', kind: 'SEQUENTIAL' }], prescriptions: [ejercicio({ exerciseGroupId: 'g-1' })] },
          { label: 'B', exerciseGroups: [{ groupId: 'g-1', label: 'T', kind: 'SEQUENTIAL' }], prescriptions: [ejercicio({ exerciseGroupId: 'g-1' })] },
        ],
      },
    ],
  });
  assert.equal(enDosSesiones.ok, true);
});

test('DL-181 · para activar: ningún bloque vacío, y los «En vueltas» con dos ejercicios o más', () => {
  const r = normalizar({
    blocks: [
      {
        label: 'F',
        sessions: [
          {
            label: 'A',
            exerciseGroups: [
              { groupId: 'g-1', label: 'Torso', kind: 'ROUNDS', rounds: 3 },
              { groupId: 'g-2', label: 'Core', kind: 'SEQUENTIAL' },
              { groupId: 'g-3', label: 'Pierna', kind: 'ROUNDS', rounds: 2 },
            ],
            prescriptions: [ejercicio({ exerciseGroupId: 'g-1' }), ejercicio({ exerciseGroupId: 'g-3' }), ejercicio({ exerciseGroupId: 'g-3' })],
          },
        ],
      },
    ],
  });
  assert.ok(r.ok);
  assert.deepEqual(problemasDeCompletitud(r.contenido), [
    { code: 'ROUNDS_GROUP_NEEDS_TWO_EXERCISES', path: 'blocks[0].sessions[0].exerciseGroups[0]' },
    { code: 'EXERCISE_GROUP_EMPTY', path: 'blocks[0].sessions[0].exerciseGroups[1]' },
  ]);
});

test('DL-181 · las partes de la sesión: el bloque donde está su primer ejercicio; uno vacío, al final; lo desconocido, suelto', () => {
  const s = {
    exerciseGroups: [
      { groupId: 'g-1', label: 'Torso', kind: 'ROUNDS' as const, rounds: 3 },
      { groupId: 'g-2', label: 'Core', kind: 'SEQUENTIAL' as const },
      { groupId: 'g-3', label: 'Pierna', kind: 'SEQUENTIAL' as const },
    ],
    prescriptions: [{ exerciseGroupId: null, n: 0 }, { exerciseGroupId: 'g-3', n: 1 }, { exerciseGroupId: 'g-1', n: 2 }, { exerciseGroupId: 'g-1', n: 3 }, { exerciseGroupId: 'g-9', n: 4 }],
  };
  const partes = partesDeLaSesion(s);
  assert.deepEqual(
    partes.map((p) => (p.tipo === 'suelto' ? `suelto ${p.ejercicio.posicion}` : `${p.bloque.label} [${p.ejercicios.map((e) => e.posicion).join(',')}]`)),
    ['suelto 0', 'Pierna [1]', 'Torso [2,3]', 'suelto 4', 'Core []'],
  );
  // Sin bloques, la lista de siempre.
  assert.deepEqual(
    partesDeLaSesion({ prescriptions: [{}, {}] }).map((p) => p.tipo),
    ['suelto', 'suelto'],
  );
});

test('DL-181 · la indicación «En vueltas», como la pidió Dirección', () => {
  assert.equal(indicacionDeVueltas({ groupId: 'g', label: 'T', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }, 2), 'Alterná estos 2 ejercicios · 3 vueltas · descansá 90 s al terminar cada vuelta');
  assert.equal(indicacionDeVueltas({ groupId: 'g', label: 'T', kind: 'ROUNDS', rounds: 1 }, 3), 'Alterná estos 3 ejercicios · 1 vuelta');
  assert.equal(indicacionDeVueltas({ groupId: 'g', label: 'T', kind: 'ROUNDS', rounds: 4, restAfterRoundSeconds: 0 }, 2), 'Alterná estos 2 ejercicios · 4 vueltas · sin pausa al terminar cada vuelta');
  assert.equal(descansoEnPalabras(150), '2 min 30 s');
  assert.equal(descansoEnPalabras(120), '2 min');
  assert.equal(descansoEnPalabras(45), '45 s');
  assert.equal(resumenDelBloque({ groupId: 'g', label: 'T', kind: 'SEQUENTIAL' }), 'Seguido');
  assert.equal(resumenDelBloque({ groupId: 'g', label: 'T', kind: 'ROUNDS', rounds: 3 }), 'En vueltas · 3 vueltas');
});

test('DL-181 · ENP-D05: las series para las vueltas copian la última o quitan las de abajo; el calentamiento queda arriba', () => {
  const series = [{ setKind: 'WARM_UP' as const, r: 'c' }, { r: 'a' }, { r: 'b' }];
  assert.deepEqual(seriesParaLasVueltas(series, 4, { r: 'vacia' }), [{ setKind: 'WARM_UP', r: 'c' }, { r: 'a' }, { r: 'b' }, { r: 'b' }, { r: 'b' }]);
  assert.deepEqual(seriesParaLasVueltas(series, 1, { r: 'vacia' }), [{ setKind: 'WARM_UP', r: 'c' }, { r: 'a' }]);
  assert.deepEqual(seriesParaLasVueltas<{ setKind?: 'WARM_UP'; r?: string }>([], 2, { r: 'vacia' }), [{ r: 'vacia' }, { r: 'vacia' }]);
  const s = {
    exerciseGroups: [{ groupId: 'g-1', label: 'T', kind: 'ROUNDS' as const, rounds: 3 }],
    prescriptions: [
      { exerciseGroupId: 'g-1', sets: [{}, {}, {}] },
      { exerciseGroupId: 'g-1', sets: [{ setKind: 'WARM_UP' as const }, {}, {}, {}, {}] },
      { exerciseGroupId: null, sets: [{}] },
    ],
  };
  assert.deepEqual(seriesQueNoSonLasVueltas(s), [{ posicion: 1, vueltas: 3, series: 4 }]);
});

test('DL-181 · los identificadores nuevos no chocan, y copiar a otra sesión saca el bloque', () => {
  assert.equal(nuevoIdDeBloque({ prescriptions: [] }), 'g-1');
  assert.equal(nuevoIdDeBloque({ prescriptions: [], exerciseGroups: [{ groupId: 'g-2' }, { groupId: 'g-3' }] }), 'g-4');
  assert.equal(nuevoIdDeBloque({ prescriptions: [], exerciseGroups: [{ groupId: 'g-2' }] }), 'g-3');
  assert.deepEqual(bloqueNuevo({ prescriptions: [], exerciseGroups: [{ groupId: 'g-1' }] }), { groupId: 'g-2', label: 'Bloque 2', kind: 'SEQUENTIAL' });
  assert.deepEqual(sinBloque({ exerciseVersionId: 'x', exerciseGroupId: 'g-1' }), { exerciseVersionId: 'x' });
  assert.deepEqual(problemasDeLosBloquesAlGuardar({ prescriptions: [{ exerciseGroupId: null }] }, 's'), []);
});

test('DL-181 · la salida: las dos claves son opcionales (la APK sin la capacidad no las recibe) y la capacidad se reconoce', () => {
  const sesion = { sessionId: 's1', label: 'A', order: 1, instructions: null, prescriptions: [] };
  assert.equal(SesionPlanificadaSchema.safeParse(sesion).success, true);
  assert.equal(SesionPlanificadaSchema.safeParse({ ...sesion, exerciseGroups: [{ groupId: 'g-1', label: 'T', order: 1, kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: null }] }).success, true);
  const prescripcion = { prescriptionId: 'p1', order: 1, exerciseId: EJERCICIO, exerciseVersionId: EJERCICIO, exerciseName: 'X', sets: [], intensity: null, suggestedLoad: null, professionalParameters: [], note: null };
  assert.equal(PrescripcionSchema.safeParse(prescripcion).success, true);
  assert.equal(PrescripcionSchema.safeParse({ ...prescripcion, exerciseGroupId: null }).success, true);
  assert.equal(capacidadesDeclaradas('training-set-kinds-1,training-session-groups-1').has(CAPACIDAD_BLOQUES_DE_LA_SESION), true);
});
