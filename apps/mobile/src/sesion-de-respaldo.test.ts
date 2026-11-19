/**
 * La sesión de respaldo de la APK (`sesionDesdeLaOcurrencia`): la que arma desde «Hoy» (API-TRN-14) cuando el plan de
 * cada serie (API-SER-02) no responde. Revisión adversaria de WP-ENTRENAMIENTO-PLANIFICACION (trae #288, DL-178).
 *
 * - **El tipo de cada serie viaja.** «Hoy» trae `setKind` a esta APK, que declara `training-set-kinds-1`. Si el respaldo
 *   lo perdía, un calentamiento se veía como «Serie 1», se numeraba entre las efectivas y se registraba sin su tipo.
 * - **Los bloques de la sesión (DL-181) viajan solo si vienen.**
 *
 * Mutación verificada (2026-11-19): sacar la línea del tipo en `sesionDesdeLaOcurrencia` pone en rojo la primera prueba.
 *
 * Uso: cd apps/mobile && npx jest src/sesion-de-respaldo.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { rotulosDeLasSeries, type SesionDeOcurrencia } from '@be/domain';
import { filasDelEjercicio, sesionDesdeLaOcurrencia } from './series-de-la-sesion';

const serie = (setIndex: number, extra: Record<string, unknown> = {}) => ({ setIndex, repetitions: { value: 8 }, note: null, ...extra });

const OCURRENCIA = {
  sessionId: 'ses-a',
  label: 'Piernas A',
  order: 1,
  instructions: null,
  blockId: 'blq-1',
  blockLabel: 'Fase 1',
  microcycleId: null,
  microcycleLabel: null,
  prescriptions: [
    {
      prescriptionId: 'rx-sentadilla',
      order: 1,
      exerciseId: 'ej-1',
      exerciseVersionId: 'ev-1',
      exerciseName: 'Sentadilla',
      // Como llega a esta APK: el tipo explícito en cada serie.
      sets: [serie(1, { setKind: 'WARM_UP' }), serie(2, { setKind: 'WORKING' }), serie(3, { setKind: 'WORKING' })],
      intensity: null,
      suggestedLoad: null,
      professionalParameters: [],
      note: null,
    },
  ],
} as unknown as SesionDeOcurrencia;

describe('La sesión de respaldo (API-SER-02 no responde)', () => {
  test('conserva el tipo de cada serie: el calentamiento se ve, se numera y se registra como calentamiento', () => {
    const sesion = sesionDesdeLaOcurrencia(OCURRENCIA);
    const series = sesion.prescriptions[0]!.sets;
    expect(series.map((s) => s.setKind)).toEqual(['WARM_UP', 'WORKING', 'WORKING']);
    // La tabla: «C», «1», «2», como con el plan de cada serie.
    expect(rotulosDeLasSeries(series).map((r) => r.corto)).toEqual(['C', '1', '2']);
    const filas = filasDelEjercicio(sesion.prescriptions[0]!, [], []);
    expect(filas.map((f) => [f.setIndex, f.tipo, f.numero])).toEqual([
      [1, 'WARM_UP', null],
      [2, 'WORKING', 1],
      [3, 'WORKING', 2],
    ]);
  });

  test('sin el tipo (una respuesta sin la capacidad), las series quedan efectivas, como siempre', () => {
    const vieja = { ...OCURRENCIA, prescriptions: OCURRENCIA.prescriptions.map((p) => ({ ...p, sets: [serie(1), serie(2)] })) } as unknown as SesionDeOcurrencia;
    const series = sesionDesdeLaOcurrencia(vieja).prescriptions[0]!.sets;
    expect(series.every((s) => !('setKind' in s))).toBe(true);
    expect(rotulosDeLasSeries(series).map((r) => r.corto)).toEqual(['1', '2']);
  });

  test('los bloques de la sesión viajan solo si vienen', () => {
    expect('exerciseGroups' in sesionDesdeLaOcurrencia(OCURRENCIA)).toBe(false);
    const conBloque = {
      ...OCURRENCIA,
      exerciseGroups: [{ groupId: 'g-1', label: 'Pierna', order: 1, kind: 'SEQUENTIAL', rounds: null, restAfterRoundSeconds: null }],
      prescriptions: OCURRENCIA.prescriptions.map((p) => ({ ...p, exerciseGroupId: 'g-1' })),
    } as unknown as SesionDeOcurrencia;
    const sesion = sesionDesdeLaOcurrencia(conBloque);
    expect(sesion.exerciseGroups?.map((g) => g.groupId)).toEqual(['g-1']);
    expect(sesion.prescriptions.map((p) => p.exerciseGroupId)).toEqual(['g-1']);
  });
});
