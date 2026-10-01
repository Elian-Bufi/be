/** «Mis habituales» (`habituales.ts`, `copy-habituales.ts`): notas relativas al nodo, sin identificadores, sin cargas ni cantidades, copy sin promesas. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SesionEntrada } from './contratos-entrenamiento';
import { COPY_HABITUALES } from './copy-habituales';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { terminosProhibidosEn } from './copy-nutricion';
import { vaciarNota } from './plantillas-de-plan';
import {
  itemsDeLaComida,
  nombreNormalizadoDeHabitual,
  notasDeLaComida,
  notasDeLaSesion,
  sinCantidadesDeLaComida,
  sinCargasDeLaSesion,
  sinIdentificadoresDeComida,
  sinIdentificadoresDeSesion,
  type ComidaEntrada,
} from './habituales';

const sesion: SesionEntrada = {
  sessionId: 'ses-1',
  label: 'Pierna A',
  instructions: 'Entrada en calor de Juan',
  prescriptions: [
    {
      prescriptionId: 'pre-1',
      exerciseVersionId: 'ej-1',
      sets: [{ repetitions: { value: 8 }, note: 'lento' }, { repetitions: { value: 8 } }],
      intensity: null,
      note: 'Cuidado con la rodilla',
      suggestedLoad: { value: 60, unit: 'kg' },
    },
    { exerciseVersionId: 'ej-2', sets: [{ repetitions: { min: 6, max: 8 } }], intensity: { criterion: 'RPE', target: { value: 7 } } },
  ],
};

test('las notas de una sesión se listan con lugar relativo a la sesión, en orden de lectura; vaciarlas una por una no muta la entrada', () => {
  const notas = notasDeLaSesion(sesion);
  assert.deepEqual(
    notas.map((n) => [n.lugar, n.texto]),
    [
      ['instructions', 'Entrada en calor de Juan'],
      ['prescriptions[0].note', 'Cuidado con la rodilla'],
      ['prescriptions[0].sets[0].note', 'lento'],
    ],
  );
  assert.equal(notas[0]!.rotulo, 'Instrucciones de la sesión «Pierna A»');
  assert.equal(notas[2]!.rotulo, 'Nota de la serie 1, prescripción 1 de «Pierna A»');
  const sinInstrucciones = vaciarNota(sesion, 'instructions');
  assert.equal(sinInstrucciones.instructions, null);
  assert.equal(sesion.instructions, 'Entrada en calor de Juan', 'la entrada no se muta');
  const sinNotaDeSerie = vaciarNota(sesion, 'prescriptions[0].sets[0].note');
  assert.deepEqual(sinNotaDeSerie.prescriptions[0]!.sets[0], { repetitions: { value: 8 } });
  const limpia = notas.reduce((s, n) => vaciarNota(s, n.lugar), sesion);
  assert.deepEqual(notasDeLaSesion(limpia), []);
  assert.equal(limpia.prescriptions.length, 2);
});

test('sin identificadores: la sesión pierde sessionId y prescriptionId y nada más; sin cargas: pierde las cargas sugeridas y nada más', () => {
  const sinIds = sinIdentificadoresDeSesion(sesion);
  assert.equal('sessionId' in sinIds, false);
  assert.equal(sinIds.prescriptions.every((p) => !('prescriptionId' in p)), true);
  assert.equal(sinIds.prescriptions[0]!.note, 'Cuidado con la rodilla');
  assert.deepEqual(sinIds.prescriptions[0]!.suggestedLoad, { value: 60, unit: 'kg' });
  assert.equal(sesion.sessionId, 'ses-1', 'la entrada no se muta');
  const sinCargas = sinCargasDeLaSesion(sesion);
  assert.equal(sinCargas.prescriptions.every((p) => !('suggestedLoad' in p)), true);
  assert.equal(sinCargas.prescriptions[0]!.prescriptionId, 'pre-1');
  assert.deepEqual(sinCargas.prescriptions[1]!.intensity, { criterion: 'RPE', target: { value: 7 } });
  assert.equal(nombreNormalizadoDeHabitual('  Pierna   Á  '), 'pierna a');
});

test('nutrición: las notas de los ítems con lugar relativo a la comida; sin identificadores; sin cantidades deja el elemento, la preparación y la nota', () => {
  const comida: ComidaEntrada = {
    mealId: 'com-1',
    label: 'Desayuno',
    prescriptionMode: 'DISH_OPTIONS',
    options: [
      {
        optionId: 'op-1',
        label: 'Opción 1',
        items: [
          { itemId: 'it-1', catalogItemId: 'al-1', quantity: { value: 200, unit: 'ml' }, preparationState: 'RAW', note: 'Sin azúcar para Ana' },
          { catalogItemId: 'al-2', quantity: { value: 40, unit: 'g' }, preparationState: null },
        ],
      },
      { label: 'Opción 2', items: [{ catalogItemId: 'al-3', quantity: null, preparationState: null, note: 'tostado' }] },
    ],
  };
  const notas = notasDeLaComida(comida);
  assert.deepEqual(
    notas.map((n) => [n.lugar, n.texto]),
    [
      ['options[0].items[0].note', 'Sin azúcar para Ana'],
      ['options[1].items[0].note', 'tostado'],
    ],
  );
  assert.equal(notas[0]!.rotulo, 'Nota del ítem 1 de «Opción 1» (Desayuno)');
  const vaciada = vaciarNota(comida, notas[0]!.lugar);
  assert.equal(vaciada.options[0]!.items[0]!.note, null);
  assert.equal(comida.options[0]!.items[0]!.note, 'Sin azúcar para Ana', 'la entrada no se muta');
  const sinIds = sinIdentificadoresDeComida(comida);
  assert.equal('mealId' in sinIds, false);
  assert.equal(sinIds.options.every((o) => !('optionId' in o) && o.items.every((i) => !('itemId' in i))), true);
  assert.deepEqual(sinIds.options[0]!.items[0]!.quantity, { value: 200, unit: 'ml' });
  const sin = sinCantidadesDeLaComida(comida);
  assert.deepEqual(sin.options.flatMap((o) => o.items.map((i) => i.quantity)), [null, null, null]);
  assert.equal(sin.options[0]!.items[0]!.preparationState, 'RAW');
  assert.equal(sin.options[0]!.items[0]!.itemId, 'it-1');
  assert.equal(itemsDeLaComida(comida), 3);
});

test('TEST-PRJ-009 · el copy de los habituales no califica ni promete, con los términos de entrenamiento y de nutrición', () => {
  const textos = Object.values(COPY_HABITUALES).map((v) => (typeof v === 'function' ? (v as (...a: never[]) => string)(...(['Pierna A', 2] as never[])) : v));
  textos.push(COPY_HABITUALES.ejercicios(1), COPY_HABITUALES.alimentos(3), COPY_HABITUALES.actualizada('3 sept 2026'));
  assert.deepEqual(textos.flatMap((t) => [...terminosProhibidosDeEntrenamientoEn(t), ...terminosProhibidosEn(t)].map((p) => `${p} en «${t}»`)), []);
});
