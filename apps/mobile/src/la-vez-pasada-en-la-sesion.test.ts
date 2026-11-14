/**
 * TEST-PG-010 (WP-PULIDO-GRANDES PG-11, DL-173) y TEST-GR-001 del lado de la persona (WP-GRAFICOS GR-01, DL-174): «La vez
 * pasada» en la sesión en curso. Se prueba la lógica pura (`la-vez-pasada-en-la-sesion.ts`) y, leyendo el código, que la
 * sesión la lee de «Tu historial» y la dibuja debajo del ejercicio.
 * - La última vez del mismo ejercicio en los 90 días hasta la fecha de la sesión, con su fecha.
 * - Hecha con otro ejercicio: lo dice y no es comparable (no se va a poder copiar).
 * - Sin ninguna, sin lo leído o con el ejercicio sustituido en esta sesión: la línea no se dibuja.
 * - Lo tildado sin escribir dice «como el plan»; la fecha, entera para el lector.
 *
 * Mutaciones que estas pruebas ponen en rojo: no filtrar por la fecha de la sesión; mostrar la línea con el ejercicio
 * sustituido; tomar la sustitución por otro ejercicio como comparable.
 *
 * Uso: cd apps/mobile && npx jest src/la-vez-pasada-en-la-sesion.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { EjecucionDeEntrenamientoSchema, type EjecucionDeEntrenamiento, type SerieEjecutadaApi } from '@be/domain';
import { DIAS_DE_LA_VEZ_PASADA, lineaDeLaVezPasadaDelEjercicio } from './la-vez-pasada-en-la-sesion';

// El jest de la APK compila sin los tipos de Node: lo poco que usa la lectura del código se declara acá.
declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

type Ejercicio = { readonly exerciseId: string; readonly exerciseVersionId: string; readonly exerciseName: string };
const SENTADILLA: Ejercicio = { exerciseId: '5a2c3d7f-8b02-4d02-8f02-7b7e3c7b1e02', exerciseVersionId: '5a2c3d7f-8b02-4d02-8f02-7b7e3c7b1f02', exerciseName: 'Sentadilla goblet' };
const PRENSA: Ejercicio = { exerciseId: '6b3d4e8a-9c13-4e13-9a13-8c8f4d8c2e03', exerciseVersionId: '6b3d4e8a-9c13-4e13-9a13-8c8f4d8c2f03', exerciseName: 'Prensa de piernas' };

const escrita = (setIndex: number, carga: number, reps: number, rir: number | null = 2): SerieEjecutadaApi => ({ setIndex, load: { value: carga, unit: 'kg' }, completedRepetitions: reps, rir, perceivedExertion: null });
const tildada = (setIndex: number): SerieEjecutadaApi => ({ ...escrita(setIndex, 20, 10, 2), recordedAs: 'AS_PLANNED' });

let secuencia = 0;
function ejecucion(fecha: string, prescripto: Ejercicio, series: readonly SerieEjecutadaApi[], realizado: Ejercicio = prescripto): EjecucionDeEntrenamiento {
  const x = `00000000-0000-4000-8000-${String(++secuencia).padStart(12, '0')}`;
  const ocurrio = `${fecha}T18:00:00.000-03:00`;
  return EjecucionDeEntrenamientoSchema.parse({
    executionId: x,
    state: 'REGISTERED',
    adviseeId: 'persona-1',
    planId: 'plan-v1',
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `oc-${x}`,
    date: fecha,
    timeZone: 'America/Argentina/Buenos_Aires',
    plannedSession: {
      sessionId: 'ses-a',
      label: 'Piernas A',
      order: 1,
      instructions: null,
      prescriptions: [
        {
          prescriptionId: 'rx-1',
          order: 1,
          ...prescripto,
          sets: [1, 2, 3].map((setIndex) => ({ setIndex, repetitions: { min: 8, max: 10 }, note: null })),
          intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
          suggestedLoad: { value: 20, unit: 'kg' },
          professionalParameters: [],
          note: null,
        },
      ],
      blockId: 'blq-1',
      blockLabel: 'Bloque 1',
      microcycleId: null,
      microcycleLabel: null,
    },
    original: {
      granularity: 'SET',
      sessionCondition: 'COMPLETED',
      reason: null,
      exercises: [
        {
          prescriptionId: 'rx-1',
          prescribedExerciseVersionId: prescripto.exerciseVersionId,
          prescribedExerciseName: prescripto.exerciseName,
          performedExerciseVersionId: realizado.exerciseVersionId,
          performedExerciseName: realizado.exerciseName,
          substituted: realizado !== prescripto,
          sets: [...series],
          executionSummary: null,
        },
      ],
      sessionSummary: null,
    },
    corrections: [],
    effectiveView: { kind: 'ORIGINAL' },
    occurredAt: ocurrio,
    recordedAt: ocurrio,
  });
}

const HISTORIA = [
  ejecucion('2026-11-03', SENTADILLA, [escrita(1, 20, 8), escrita(2, 20, 8), escrita(3, 22, 6, 1)]),
  ejecucion('2026-11-10', SENTADILLA, [escrita(1, 22, 8), tildada(2)]),
  ejecucion('2026-11-12', PRENSA, [escrita(1, 80, 10)]),
];
const linea = (o: Partial<Parameters<typeof lineaDeLaVezPasadaDelEjercicio>[1]> = {}, historia: readonly EjecucionDeEntrenamiento[] | null = HISTORIA) =>
  lineaDeLaVezPasadaDelEjercicio(historia, { exerciseId: SENTADILLA.exerciseId, fechaDeLaSesion: '2026-11-14', hoy: '2026-11-14', sustituido: false, ...o });

describe('TEST-PG-010 · «La vez pasada» debajo del ejercicio', () => {
  test('la última vez del mismo ejercicio, con su fecha; lo tildado sin escribir dice «como el plan»', () => {
    expect(linea()).toEqual({
      texto: 'La vez pasada, mar 10 nov: 22 kg × 8 · RIR 2, 20 kg × 10 · RIR 2 (como el plan)',
      paraLeer: 'La vez pasada, martes 10 de noviembre: 22 kg × 8 · RIR 2, 20 kg × 10 · RIR 2 (como el plan)',
      comparable: true,
    });
  });

  test('hasta la fecha de la sesión que se registra: una sesión de otro día anterior no ve lo que vino después', () => {
    expect(linea({ fechaDeLaSesion: '2026-11-05' })?.texto).toBe('La vez pasada, mar 3 nov: 20 kg × 8 · RIR 2, 20 kg × 8 · RIR 2, 22 kg × 6 · RIR 1');
    expect(DIAS_DE_LA_VEZ_PASADA).toBe(90);
  });

  test('hecha con otro ejercicio: lo dice y no es comparable', () => {
    const conPrensa = [ejecucion('2026-11-01', PRENSA, [escrita(1, 80, 10)]), ejecucion('2026-11-11', SENTADILLA, [escrita(1, 80, 10)], PRENSA)];
    expect(linea({}, conPrensa)).toEqual({
      texto: 'La vez pasada, mié 11 nov: la hiciste con Prensa de piernas',
      paraLeer: 'La vez pasada, miércoles 11 de noviembre: la hiciste con Prensa de piernas',
      comparable: false,
    });
  });

  test('sin ninguna vez, sin lo leído, sin ejercicio o con el ejercicio sustituido ahora: la línea no se dibuja', () => {
    expect(linea({ exerciseId: '8d5f6a0c-be35-4a35-bc35-ae0b6f0e4e05' })).toBeNull();
    expect(linea({}, null)).toBeNull();
    expect(linea({ exerciseId: null })).toBeNull();
    expect(linea({ sustituido: true })).toBeNull();
  });

  test('la sesión la lee de «Tu historial» una vez y la dibuja debajo del ejercicio, tenue y entera para el lector', () => {
    const sesion = readFileSync(join(__dirname, 'pantallas', 'entrenamiento.tsx'), 'utf8');
    expect(sesion).toMatch(/api\.misEjecucionesDeEntrenamiento\(token, ultimosDiasHasta\(fechaDeLaSesion, DIAS_DE_LA_VEZ_PASADA\)\)/);
    expect(sesion).toMatch(/lineaDeLaVezPasadaDelEjercicio\(historia, \{ exerciseId: p\.exerciseId, fechaDeLaSesion, hoy, sustituido: sustitucion\.ejecutado !== null \}\)/);
    expect(sesion).toMatch(/vezPasada=\{vezPasada\}/);
    const pieza = readFileSync(join(__dirname, 'pantallas', 'sesion-enfocada.tsx'), 'utf8');
    expect(pieza).toMatch(/<Text style=\{estilos\.detalle\} accessibilityLabel=\{vezPasada\.paraLeer\} testID="la-vez-pasada">/);
  });
});
