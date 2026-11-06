/**
 * DL-154 · la evidencia de una revisión registrada, en palabras: el resumen sale de lo que la revisión guardó, cada
 * elemento se nombra sin valores de salud, lo de después de la revisión se dice y nada se completa. Resultados a mano.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { EvidenciaDeRevisionResponseSchema, type EvidenciaResuelta } from './contratos-evidencia-de-revision';
import { avisoAlAbrir, cambioEnPalabras, COPY_EVIDENCIA_REGISTRADA, cuandoDeLaEvidencia, gruposDeLaEvidencia, nombreDeLaEvidencia, resumenDeLaEvidencia } from './evidencia-registrada';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const F = { dia: (f: string) => `${Number(f.slice(8, 10))}/${Number(f.slice(5, 7))}`, momento: (i: string) => `${i.slice(8, 10)}/${i.slice(5, 7)} ${i.slice(11, 16)}` };

const comida = (n: number, fecha: string, hora: string, extra: Partial<EvidenciaResuelta> = {}): EvidenciaResuelta => ({
  reference: { type: 'EXECUTION', id: id(n) },
  state: 'AVAILABLE',
  source: { type: 'MEAL_RECORD', id: id(n) },
  occurredDate: fecha,
  occurredAt: `${fecha}T${hora}:00.000Z`,
  what: { kind: 'MEAL_RECORD', meal: 'Almuerzo', recordKind: 'PLAN_OPTION' },
  changesAfterReview: [],
  ...extra,
});

test('el resumen cuenta lo que la revisión guardó, por clase, sin leer nada más', () => {
  const refs = [
    { type: 'EXECUTION' as const, id: id(1) },
    { type: 'EXECUTION' as const, id: id(2) },
    { type: 'PLAN_VERSION' as const, id: id(3) },
    { type: 'OBJECTIVE_VERSION' as const, id: id(4) },
  ];
  assert.deepEqual(resumenDeLaEvidencia(refs, 'NUTRITION'), ['2 comidas', '1 versión del plan', 'el objetivo']);
  assert.deepEqual(resumenDeLaEvidencia(refs.slice(0, 1), 'TRAINING'), ['1 sesión']);
  assert.deepEqual(resumenDeLaEvidencia([], 'NUTRITION'), [], 'sin evidencia guardada no se inventa un resumen');
});

test('cada elemento se nombra por lo que es, sin cantidades ni cargas; lo que no se encuentra no dice qué era', () => {
  assert.equal(nombreDeLaEvidencia(comida(1, '2026-10-13', '11:30')), 'Almuerzo · opción del plan');
  assert.equal(nombreDeLaEvidencia(comida(2, '2026-10-13', '23:00', { what: { kind: 'MEAL_RECORD', meal: 'Cena', recordKind: 'DIFFERENT' } })), 'Cena · comida diferente');
  assert.equal(nombreDeLaEvidencia(comida(3, '2026-10-13', '17:00', { what: { kind: 'MEAL_RECORD', meal: null, recordKind: 'DIFFERENT' } })), 'Comida diferente, fuera de las comidas del plan');
  assert.equal(nombreDeLaEvidencia({ ...comida(4, '2026-10-01', '10:00'), what: { kind: 'PLAN_VERSION', number: 2 } }), 'Plan v2');
  assert.equal(nombreDeLaEvidencia({ ...comida(5, '2026-10-01', '10:00'), what: { kind: 'TRAINING_SESSION', session: 'Piernas A' } }), 'Piernas A');
  const perdida: EvidenciaResuelta = { reference: { type: 'EXECUTION', id: id(6) }, state: 'NOT_FOUND', source: null, occurredDate: null, occurredAt: null, what: null, changesAfterReview: [] };
  assert.equal(nombreDeLaEvidencia(perdida), COPY_EVIDENCIA_REGISTRADA.noEncontrada);
  assert.equal(cuandoDeLaEvidencia(perdida, F), null);
});

test('lo que cambió después de la revisión se dice con su momento: lo que se abre hoy no es lo que se revisó', () => {
  const rectificada = comida(1, '2026-10-13', '11:30', { changesAfterReview: [{ kind: 'RECTIFIED', at: '2026-10-15T13:20:00.000Z' }] });
  assert.equal(cambioEnPalabras(rectificada.changesAfterReview[0]!, rectificada, F), 'Se rectificaron las cantidades después de esta revisión (15/10 13:20).');
  const anulada = comida(2, '2026-10-13', '23:00', { changesAfterReview: [{ kind: 'ANNULLED', at: '2026-10-16T09:00:00.000Z' }] });
  assert.match(cambioEnPalabras(anulada.changesAfterReview[0]!, anulada, F), /Se deshizo después de esta revisión .*quedó fuera de los totales/);
  const plan: EvidenciaResuelta = { ...comida(3, '2026-10-01', '10:00'), what: { kind: 'PLAN_VERSION', number: 1 }, changesAfterReview: [{ kind: 'SUCCEEDED', at: '2026-10-20T12:00:00.000Z' }] };
  assert.equal(cambioEnPalabras(plan.changesAfterReview[0]!, plan, F), 'Después se activó otra versión del plan (20/10 12:00).');
  assert.equal(cuandoDeLaEvidencia(plan, F), 'activada el 1/10');
  const objetivo: EvidenciaResuelta = { ...comida(4, '2026-10-02', '10:00'), what: { kind: 'OBJECTIVE_VERSION' }, changesAfterReview: [{ kind: 'SUCCEEDED', at: '2026-10-21T12:00:00.000Z' }] };
  assert.equal(cambioEnPalabras(objetivo.changesAfterReview[0]!, objetivo, F), 'Después se registró otro objetivo (21/10 12:00).');
});

test('D-2: al abrir, «como está hoy» solo si cambió el registro; una versión reemplazada es la misma que se revisó', () => {
  assert.equal(avisoAlAbrir(comida(1, '2026-10-13', '11:30')), null, 'sin cambios posteriores, sin aviso');
  for (const kind of ['RECTIFIED', 'CORRECTED', 'ANNULLED'] as const) {
    const cambiada = comida(2, '2026-10-13', '11:30', { changesAfterReview: [{ kind, at: '2026-10-15T13:20:00.000Z' }] });
    assert.equal(avisoAlAbrir(cambiada), COPY_EVIDENCIA_REGISTRADA.loDeHoy, `${kind}: lo que se abre es como está hoy`);
  }
  const plan: EvidenciaResuelta = {
    ...comida(3, '2026-10-01', '10:00'),
    source: { type: 'NUTRITION_PLAN_VERSION', id: id(3) },
    what: { kind: 'PLAN_VERSION', number: 1 },
    changesAfterReview: [{ kind: 'SUCCEEDED', at: '2026-10-20T12:00:00.000Z' }],
  };
  assert.equal(avisoAlAbrir(plan), 'Es la misma versión que se revisó; ya no es la vigente.', 'la versión no cambió: no se dice «como está hoy»');
  const objetivo: EvidenciaResuelta = { ...plan, source: null, what: { kind: 'OBJECTIVE_VERSION' } };
  assert.equal(avisoAlAbrir(objetivo), COPY_EVIDENCIA_REGISTRADA.mismaVersion, 'lo mismo con otro objetivo');
  // Si además cambió el registro, el aviso dice lo que cambia lo que se ve.
  const ambos: EvidenciaResuelta = { ...plan, changesAfterReview: [...plan.changesAfterReview, { kind: 'CORRECTED', at: '2026-10-21T12:00:00.000Z' }] };
  assert.equal(avisoAlAbrir(ambos), COPY_EVIDENCIA_REGISTRADA.loDeHoy);
});

test('los grupos: registros por fecha y hora, después la planificación, y al final lo que ya no está; no se agrega nada', () => {
  const items: EvidenciaResuelta[] = [
    comida(1, '2026-10-14', '12:00'),
    { ...comida(9, '2026-10-01', '10:00'), what: { kind: 'PLAN_VERSION', number: 1 } },
    comida(2, '2026-10-13', '20:00'),
    comida(3, '2026-10-13', '08:00'),
    { reference: { type: 'EXECUTION', id: id(7) }, state: 'NOT_FOUND', source: null, occurredDate: null, occurredAt: null, what: null, changesAfterReview: [] },
  ];
  const grupos = gruposDeLaEvidencia(items, 'NUTRITION');
  assert.deepEqual(
    grupos.map((g) => [g.titulo, g.items.map((i) => i.reference.id.slice(-1))]),
    [
      ['Comidas', ['3', '2', '1']],
      ['Planificación', ['9']],
      ['Ya no está en este seguimiento', ['7']],
    ],
  );
  assert.equal(grupos.flatMap((g) => g.items).length, items.length, 'cada elemento guardado aparece una vez');
  assert.deepEqual(gruposDeLaEvidencia([], 'TRAINING'), []);
});

test('el contrato no tiene dónde poner cantidades, cargas ni medidas', () => {
  // Las claves de las propiedades del esquema publicado: ninguna es un valor de salud.
  const esquema = JSON.stringify(z.toJSONSchema(EvidenciaDeRevisionResponseSchema));
  assert.doesNotMatch(esquema, /"(quantity|quantities|kcal|energyKcal|load|weight|value|values|score|adherence)"\s*:/i);
});
