/**
 * Ajustes de la ratificación de Dirección del 19/11 (wp-ajustes-de-la-ratificacion) · lo que toca la web. Lo puro se
 * prueba con datos; de las pantallas se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ─── ENP-D01 · «Bloque N» de un plan viejo se lee «Fase N» ─────────────────────────────────────────────────────

test('ENP-D01 · en el editor (copiar a, el asistente) la fase «Bloque 2» de un plan viejo se lee «Fase 2»', async () => {
  const C = await import('../src/app/pro/advisees/training/copiar-a.ts');
  const A = await import('../src/app/pro/advisees/asistente/operaciones-del-asistente.ts');
  const viejo = [
    { blockId: 'b1', label: 'Bloque 1', sessions: [{ sessionId: 's1', label: 'Piernas', instructions: null, prescriptions: [] }] },
    { blockId: 'b2', label: 'Bloque 2', sessions: [{ sessionId: 's2', label: 'Torso', instructions: null, prescriptions: [] }] },
  ];
  assert.deepEqual(C.gruposDelPlan(viejo).map((g) => g.nombre), ['Fase 1', 'Fase 2']);
  assert.deepEqual(A.gruposDelAsistente(viejo).map((g) => g.titulo), ['Fase 1', 'Fase 2']);
  // El dato guardado no cambia.
  assert.equal(viejo[1].label, 'Bloque 2');
});

test('ENP-D01 · la versión activa, lo compartido, la plantilla y la historia anterior muestran la fase con su nombre para leer', () => {
  assert.match(fuente('../src/app/pro/advisees/training/plan.tsx'), /const bloques = conNombresDeFase\(version\.blocks\);\n  const mira: LoQueSeMiraDelPlan = loQueSeMiraDelPlan\(bloques,/);
  assert.match(fuente('../src/app/pro/advisees/seguimiento/plan-compartido.tsx'), /const bloques = conNombresDeFase\(enOrden\(plan\.plan\.blocks\)\);/);
  assert.match(fuente('../src/app/pro/templates/detalle-de-la-plantilla.tsx'), /\{nombreDeLaFase\(b\.label, i\)\}/);
  assert.match(fuente('../src/app/pro/advisees/previous-history/historia-anterior.ts'), /conDetalle\(nombreDeLaFase\(b\.label, i\)/);
  assert.match(fuente('../src/app/pro/advisees/training/agenda-del-plan.tsx'), /\[nombreDeLaFase\(b\.label, bi\)\]/);
  assert.match(fuente('../src/app/pro/advisees/training/editor.tsx'), /const nombreDelBloque = \(b: \{ readonly label: string \}, n: number\): string => nombreDeLaFase\(b\.label, n\);/);
});
