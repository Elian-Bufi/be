/**
 * PF-03, incremento 1 (DL-105) · la presentación compartida de una prescripción es fiel a lo que planificó el
 * profesional: todas las series (iguales, distintas, rangos y sin fijar), sus notas, la intensidad con su referencia,
 * la carga sugerida, los parámetros con su unidad y la nota. La misma función usan el website y la APK.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Prescripcion } from './contratos-entrenamiento';
import { COPY_ENTRENAMIENTO, terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { intensidadPlanificada, lineasDePrescripcion, referenciaDeSerie, repeticionesPlanificadas, seriesPlanificadas } from './presentacion-de-prescripcion';

type Repeticiones = Prescripcion['sets'][number]['repetitions'];
const serie = (setIndex: number, repetitions: Repeticiones, note: string | null = null) => ({ setIndex, repetitions, note });
const fijas = (value: number) => ({ value });
const rango = (min: number, max: number) => ({ min, max });

function prescripcion(cambios: Partial<Prescripcion> = {}): Prescripcion {
  return {
    prescriptionId: 'p1',
    order: 1,
    exerciseId: '00000000-0000-4000-8000-000000000001',
    exerciseVersionId: '00000000-0000-4000-8000-000000000002',
    exerciseName: 'Sentadilla',
    sets: [serie(1, fijas(10)), serie(2, fijas(10)), serie(3, fijas(10))],
    intensity: null,
    suggestedLoad: null,
    professionalParameters: [],
    note: null,
    ...cambios,
  };
}

test('PF-03 · una pirámide 10/8/6 se muestra serie por serie, nunca como «3 × 10»', () => {
  const p = prescripcion({ sets: [serie(1, fijas(10)), serie(2, fijas(8)), serie(3, fijas(6))] });
  assert.deepEqual(seriesPlanificadas(p), ['Serie 1: 10', 'Serie 2: 8', 'Serie 3: 6']);
  assert.equal(lineasDePrescripcion(p).includes('3 × 10'), false);
});

test('PF-03 · series iguales: «3 × 10»; un rango igual en todas: «3 × 8-12»', () => {
  assert.deepEqual(seriesPlanificadas(prescripcion()), ['3 × 10']);
  assert.deepEqual(seriesPlanificadas(prescripcion({ sets: [serie(1, rango(8, 12)), serie(2, rango(8, 12))] })), ['2 × 8-12']);
  assert.deepEqual(seriesPlanificadas(prescripcion({ sets: [serie(1, fijas(12))] })), ['1 × 12']);
});

test('PF-03 · rangos y valores mezclados, y series sin repeticiones fijadas', () => {
  assert.deepEqual(seriesPlanificadas(prescripcion({ sets: [serie(1, rango(8, 12)), serie(2, fijas(8)), serie(3, null)] })), [
    'Serie 1: 8-12',
    'Serie 2: 8',
    'Serie 3: sin repeticiones fijadas',
  ]);
  assert.deepEqual(seriesPlanificadas(prescripcion({ sets: [serie(1, null), serie(2, null), serie(3, null)] })), ['3 series sin repeticiones fijadas']);
  assert.deepEqual(seriesPlanificadas(prescripcion({ sets: [serie(1, null)] })), ['1 serie sin repeticiones fijadas']);
  assert.deepEqual(seriesPlanificadas(prescripcion({ sets: [] })), []);
});

test('PF-03 · una nota por serie se muestra junto a su serie, aunque las repeticiones sean iguales', () => {
  const p = prescripcion({ sets: [serie(1, fijas(8)), serie(2, fijas(8), 'pausa de 2 s abajo'), serie(3, fijas(8))] });
  assert.deepEqual(seriesPlanificadas(p), ['Serie 1: 8', 'Serie 2: 8 · pausa de 2 s abajo', 'Serie 3: 8']);
});

test('PF-03 · intensidad con su criterio y la referencia del profesional, con coma decimal', () => {
  assert.equal(intensidadPlanificada(prescripcion()), null);
  assert.equal(
    intensidadPlanificada(prescripcion({ intensity: { criterion: 'PERCENT_RM', target: { value: 72.5, reference: { description: '1RM estimado por el método que usaste' } } } })),
    '72,5 % RM (1RM estimado por el método que usaste)',
  );
  assert.equal(intensidadPlanificada(prescripcion({ intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: null } } })), '75 % RM');
  assert.equal(intensidadPlanificada(prescripcion({ intensity: { criterion: 'RIR', target: { value: 2, reference: null } } })), 'RIR 2');
});

test('PF-03 · la prescripción completa, en orden: series, intensidad, carga, parámetros con su unidad y nota', () => {
  const p = prescripcion({
    sets: [serie(1, fijas(10)), serie(2, fijas(8), 'pausa de 2 s abajo'), serie(3, fijas(6))],
    intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
    suggestedLoad: { value: 62.5, unit: 'kg' },
    professionalParameters: [
      { label: 'Descanso', value: 90, unit: 's' },
      { label: 'Tempo', value: 'bajar en 3 s, subir en 1 s', unit: null },
    ],
    note: 'Espalda neutra en todo el recorrido',
  });
  assert.deepEqual(lineasDePrescripcion(p), [
    'Serie 1: 10',
    'Serie 2: 8 · pausa de 2 s abajo',
    'Serie 3: 6',
    'RIR 2',
    'Carga sugerida: 62,5 kg',
    'Descanso: 90 s',
    'Tempo: bajar en 3 s, subir en 1 s',
    'Notas: Espalda neutra en todo el recorrido',
  ]);
});

test('PF-03 · sin criterio: la APK no lo dice; el website lo dice explícitamente', () => {
  assert.deepEqual(lineasDePrescripcion(prescripcion()), ['3 × 10']);
  assert.deepEqual(lineasDePrescripcion(prescripcion(), { sinCriterioExplicito: true }), ['3 × 10', COPY_ENTRENAMIENTO.sinCriterio]);
});

test('PF-03 · la referencia de lo planificado para registrar una serie: repeticiones con concordancia, sin fijar y la nota de la serie', () => {
  assert.equal(referenciaDeSerie(serie(2, fijas(8))), 'planificadas 8 repeticiones');
  assert.equal(referenciaDeSerie(serie(1, fijas(1))), 'planificada 1 repetición');
  assert.equal(referenciaDeSerie(serie(2, rango(8, 12))), 'planificadas 8-12 repeticiones');
  assert.equal(referenciaDeSerie(serie(2, null)), 'sin repeticiones fijadas');
  assert.equal(referenciaDeSerie(serie(2, fijas(8), 'pausa de 2 s abajo')), 'planificadas 8 repeticiones · pausa de 2 s abajo');
  assert.equal(referenciaDeSerie(serie(3, null, 'a gusto')), 'sin repeticiones fijadas · a gusto');
  // Con el formato del país (DL-091 punto 4): separador de miles con punto.
  assert.equal(repeticionesPlanificadas(serie(1, fijas(1000))), '1.000');
});

test('PF-03 · los textos de la presentación no usan términos prohibidos de entrenamiento', () => {
  const p = prescripcion({
    sets: [serie(1, fijas(10)), serie(2, null, 'pausa')],
    intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado' } } },
    suggestedLoad: { value: 40, unit: 'kg' },
  });
  const textos = [
    ...lineasDePrescripcion(p, { sinCriterioExplicito: true }),
    referenciaDeSerie(serie(1, fijas(8))),
    referenciaDeSerie(serie(1, fijas(1), 'pausa')),
    COPY_ENTRENAMIENTO.indicacionesDeLaSesion,
    COPY_ENTRENAMIENTO.agregarDescanso,
    COPY_ENTRENAMIENTO.ayudaDeTempo,
    COPY_ENTRENAMIENTO.ayudaDelMotivo,
    COPY_ENTRENAMIENTO.notaDeSerie,
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
});
