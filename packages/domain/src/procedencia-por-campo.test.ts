/**
 * ED-70 (WP-EDITORES-PROFESIONAL; DL-171, DJ-2) · La procedencia por campo de la serie registrada, en el contrato y en
 * el dominio: TEST-EDP-059 (cada combinación de escrito y heredado; `AS_PLANNED` sin el campo; lo de antes queda igual)
 * y TEST-EDP-060 (una corrección del profesional no le atribuye a la persona un valor que cambió).
 *
 * Los resultados esperados se escriben a mano, desde §5.8 del paquete. Datos sintéticos. Si una prueba falla, se corrige
 * el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SerieEjecutadaSchema, type EjercicioRegistradoEntrada, type SerieEjecutadaApi } from './contratos-entrenamiento';
import { estimarLaSerie } from './estimacion-de-fuerza';
import { problemasDeCoherencia } from './plan-de-entrenamiento';
import { ejerciciosSinLaMarca, origenesQueAtribuyenALaPersona, serieEnSuForma } from './registro-por-niveles';

const kg = (value: number) => ({ value, unit: 'kg' as const });
const PRESS = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
const serie = (extra: Partial<SerieEjecutadaApi> = {}): SerieEjecutadaApi => ({ setIndex: 1, load: kg(60), completedRepetitions: 10, rir: 2, perceivedExertion: null, ...extra });
const ejercicio = (sets: SerieEjecutadaApi[]): EjercicioRegistradoEntrada => ({ prescriptionId: 'p1', performedExerciseVersionId: '11111111-1111-4111-8111-111111111111', sets });
const coherencia = (sets: SerieEjecutadaApi[]) => problemasDeCoherencia({ condicion: 'REALIZADA', granularidad: 'SERIE', ejercicios: [ejercicio(sets)], resumenDeSesion: null }).valores;

test('TEST-EDP-059 · el plan 60 kg × 8 con RIR 2 y la persona escribe solo «10»: 60 × 10 con RIR 2, cada valor con su origen', () => {
  const s = serie({ fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } });
  assert.equal(SerieEjecutadaSchema.safeParse(s).success, true);
  assert.deepEqual(serieEnSuForma(s).fieldOrigins, { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' });
  assert.deepEqual(coherencia([s]), []);
  // La carga y el RIR son del plan: no entra en la estimación, con su motivo (RM-24).
  const r = estimarLaSerie({ ...s, exerciseId: PRESS, fuente: 'PERSONA', fechaCivil: '2026-11-11' });
  assert.deepEqual(r, { entra: false, motivo: 'VALOR_DEL_PLAN', campos: ['load', 'rir'] });
});

test('TEST-EDP-059 · cada combinación de escrito y heredado se acepta y se devuelve en el orden del contrato', () => {
  const origenes = ['PERSON', 'PLAN'] as const;
  for (const load of origenes)
    for (const completedRepetitions of origenes)
      for (const rir of origenes) {
        const s = serie({ fieldOrigins: { rir, load, completedRepetitions } });
        assert.equal(SerieEjecutadaSchema.safeParse(s).success, true);
        assert.deepEqual(Object.keys(serieEnSuForma(s).fieldOrigins ?? {}), ['load', 'completedRepetitions', 'rir']);
        assert.deepEqual(coherencia([s]), []);
      }
});

test('TEST-EDP-059 · un objeto vacío no viaja, y una serie sin el campo queda idéntica a las de antes', () => {
  assert.equal('fieldOrigins' in serieEnSuForma(serie({ fieldOrigins: {} })), false);
  const antes = serie();
  assert.deepEqual(serieEnSuForma(antes), { setIndex: 1, load: kg(60), completedRepetitions: 10, rir: 2, perceivedExertion: null });
  // Mutación: si el objeto vacío se guardara, la serie de antes ya no sería igual a sí misma con el campo vacío.
  assert.deepEqual(serieEnSuForma(serie({ fieldOrigins: {} })), serieEnSuForma(antes));
});

test('TEST-EDP-059 · el contrato es estricto: otra clave u otro origen, 400', () => {
  assert.equal(SerieEjecutadaSchema.safeParse(serie({ fieldOrigins: { perceivedExertion: 'PERSON' } as never })).success, false);
  assert.equal(SerieEjecutadaSchema.safeParse(serie({ fieldOrigins: { load: 'PROFESSIONAL' } as never })).success, false);
});

test('TEST-EDP-059 · una clave sin valor, o PERSON en una serie tildada con lo planificado, se rechaza con su código', () => {
  assert.deepEqual(coherencia([serie({ rir: null, fieldOrigins: { rir: 'PERSON' } })]), [{ code: 'FIELD_ORIGIN_WITHOUT_VALUE', path: 'exercises[0].sets[0].fieldOrigins.rir' }]);
  assert.deepEqual(coherencia([serie({ recordedAs: 'AS_PLANNED', fieldOrigins: { load: 'PERSON' } })]), [{ code: 'FIELD_ORIGIN_PERSON_AS_PLANNED', path: 'exercises[0].sets[0].fieldOrigins.load' }]);
  // AS_PLANNED sin el campo, como la manda la app (todo es del plan): sin problemas.
  assert.deepEqual(coherencia([serie({ recordedAs: 'AS_PLANNED' })]), []);
});

test('ED-70 · cambiar solo la procedencia no es una corrección (como DL-161 I-4)', () => {
  const a = ejerciciosSinLaMarca([ejercicio([serie({ fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } })])]);
  const b = ejerciciosSinLaMarca([ejercicio([serie({ fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } })])]);
  assert.deepEqual(a, b);
});

test('TEST-EDP-060 · el profesional corrige la carga: ese valor no puede decir PERSON; lo que no cambió, sí', () => {
  const vigente = [ejercicio([serie({ fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } })])];
  const conservaTodo = [ejercicio([serie({ load: kg(62.5), fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } })])];
  assert.deepEqual(origenesQueAtribuyenALaPersona(conservaTodo, vigente), [{ code: 'FIELD_ORIGIN_PERSON_ON_CHANGED_VALUE', path: 'exercises[0].sets[0].fieldOrigins.load' }]);
  // Lo que pide el paquete: corregir saca la clave de lo que cambia y conserva la de lo demás.
  const bien = [ejercicio([serie({ load: kg(62.5), fieldOrigins: { completedRepetitions: 'PERSON', rir: 'PERSON' } })])];
  assert.deepEqual(origenesQueAtribuyenALaPersona(bien, vigente), []);
  // Una serie nueva del profesional no tiene con qué compararse.
  const nueva = [ejercicio([serie({ fieldOrigins: { completedRepetitions: 'PERSON', rir: 'PERSON' } }), serie({ setIndex: 2, fieldOrigins: { rir: 'PERSON' } })])];
  assert.deepEqual(origenesQueAtribuyenALaPersona(nueva, vigente), [{ code: 'FIELD_ORIGIN_PERSON_ON_CHANGED_VALUE', path: 'exercises[0].sets[1].fieldOrigins.rir' }]);
});
