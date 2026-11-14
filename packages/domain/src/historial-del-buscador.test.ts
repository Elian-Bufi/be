/**
 * TEST-GR-004 (WP-GRAFICOS GR-04, DL-174): la marca «Con historial» en el buscador «Agregar ejercicio».
 * - Sale del índice de API-PRJ-01 (`sessions` y `lastDate`), por ejercicio del catálogo.
 * - Un ejercicio sin sesiones no lleva marca: ni «0», ni «sin historial».
 * - Sin el primer valor ni el último, sin flecha y sin juicio.
 *
 * Mutaciones que estas pruebas ponen en rojo: atar la marca por nombre en vez de por ejercicio; marcar un ejercicio con 0
 * sesiones; tomar una versión sin ejercicio conocido (`v:`) como si fuera del catálogo; callar que la cuenta incluye las
 * sesiones registradas como no realizadas o hechas con otro ejercicio.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { EjercicioDelPeriodo } from './contratos-analisis';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { COPY_HISTORIAL_DEL_BUSCADOR, historialPorEjercicio, marcaDeHistorial } from './historial-del-buscador';

const SENTADILLA = '5a2c3d7f-8b02-4d02-8f02-7b7e3c7b1e02';
const PRENSA = '6b3d4e8a-9c13-4e13-9a13-8c8f4d8c2e03';
const VERSION_SUELTA = '7c4e5f9b-ad24-4f24-ab24-9d9a5e9d3f04';
const entrada = (exerciseKey: string, name: string, sessions: number, lastDate: string | null): EjercicioDelPeriodo => ({
  exerciseKey,
  name,
  otherNames: [],
  homonym: false,
  sessions,
  setNumbers: [1, 2, 3],
  loadUnits: ['kg'],
  lastDate,
});

const INDICE = historialPorEjercicio([
  entrada(`e:${SENTADILLA.toUpperCase()}`, 'Sentadilla goblet', 9, '2026-11-03'),
  entrada(`e:${PRENSA}`, 'Prensa de piernas', 1, '2026-11-14'),
  entrada(`v:${VERSION_SUELTA}`, 'Sentadilla en máquina', 4, '2026-11-01'),
  entrada('e:8d5f6a0c-be35-4a35-bc35-ae0b6f0e4e05', 'Remo con barra', 0, null),
]);
const HOY = '2026-11-14';

test('TEST-GR-004 · la marca dice cuántas sesiones y la última, por ejercicio del catálogo', () => {
  assert.equal(marcaDeHistorial(INDICE, SENTADILLA, HOY), 'Con historial · 9 sesiones · la última el mar 3 nov');
  // El identificador se compara sin mayúsculas: el del buscador y el del índice son el mismo ejercicio.
  assert.equal(marcaDeHistorial(INDICE, SENTADILLA.toUpperCase(), HOY), 'Con historial · 9 sesiones · la última el mar 3 nov');
  assert.equal(marcaDeHistorial(INDICE, PRENSA, HOY), 'Con historial · 1 sesión · la última, hoy');
});

test('TEST-GR-004 · sin sesiones, o sin ejercicio conocido, no hay marca', () => {
  assert.equal(marcaDeHistorial(INDICE, '8d5f6a0c-be35-4a35-bc35-ae0b6f0e4e05', HOY), null);
  assert.equal(marcaDeHistorial(INDICE, VERSION_SUELTA, HOY), null);
  assert.equal(marcaDeHistorial(INDICE, '00000000-0000-4000-8000-000000000000', HOY), null);
  assert.deepEqual([...INDICE.keys()].sort(), [PRENSA, SENTADILLA].sort());
  // Sin la fecha de la última, solo la cuenta.
  assert.equal(marcaDeHistorial(historialPorEjercicio([entrada(`e:${SENTADILLA}`, 'Sentadilla goblet', 2, null)]), SENTADILLA, HOY), 'Con historial · 2 sesiones');
});

test('TEST-GR-004 · qué cuenta la marca se dice entero: también las registradas como no realizadas o hechas con otro ejercicio', () => {
  // El índice de PRJ-01 no separa lo hecho de lo que no: «la última el 3 nov» no puede leerse como «lo hizo el 3 nov».
  assert.match(COPY_HISTORIAL_DEL_BUSCADOR.queCuenta, /registradas como no realizadas o hechas con otro ejercicio/);
  assert.match(COPY_HISTORIAL_DEL_BUSCADOR.queCuenta, /en el último año/);
  assert.match(COPY_HISTORIAL_DEL_BUSCADOR.queCuenta, /«La vez pasada»/);
});

test('TEST-GR-004 · sin flecha, sin primero y último, sin juicio', () => {
  for (const t of [...Object.values(COPY_HISTORIAL_DEL_BUSCADOR), marcaDeHistorial(INDICE, SENTADILLA, HOY)!]) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /[↑↓→←▲▼]|mejor|peor|récord|primer[oa]? |progres/i, t);
  }
});
