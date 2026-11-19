/**
 * ENP-D01, ratificado por Dirección el 19/11 · en la APK, la fase de un plan viejo con el nombre automático «Bloque N»
 * se lee «Fase N» en el detalle de la sesión de hoy. El nombre propio de una fase queda tal cual.
 *
 * Uso: cd apps/mobile && npx jest src/fases-en-el-telefono.test.ts --runInBand (después de construir @be/domain).
 */
import { expect, test } from '@jest/globals';
import { detalleDeLaSesion } from './inicio-de-hoy';

const sesion = (blockLabel: string | null, microcycleLabel: string | null = null) => ({
  blockLabel,
  microcycleLabel,
  prescriptions: [{ exerciseName: 'Sentadilla', sets: [{}, {}, {}] }],
});

test('ENP-D01 · «Bloque 1» de un plan viejo se lee «Fase 1»; con la semana, «Fase 1 · Semana 2»', () => {
  expect(detalleDeLaSesion(sesion('Bloque 1')).bloque).toBe('Fase 1');
  expect(detalleDeLaSesion(sesion('Bloque 3', 'Semana 2')).bloque).toBe('Fase 3 · Semana 2');
});

test('ENP-D01 · un nombre propio queda tal cual, y sin fase no se inventa nada', () => {
  expect(detalleDeLaSesion(sesion('Bloque de fuerza')).bloque).toBe('Bloque de fuerza');
  expect(detalleDeLaSesion(sesion(null)).bloque).toBeNull();
});
