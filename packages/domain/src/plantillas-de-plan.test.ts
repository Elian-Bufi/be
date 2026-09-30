/** Plantillas del profesional (`plantillas-de-plan.ts`, `copy-plantillas.ts`): notas a confirmar una por una, y copy sin promesas. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';
import { COPY_PLANTILLAS } from './copy-plantillas';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { notasDeLaEstructura, vaciarNota } from './plantillas-de-plan';
import { sesionesDeLaEstructura, sinCargasSugeridas, nombreNormalizadoDePlantilla } from './contratos-plantillas';

const estructura: EstructuraDePlanDeEntrenamientoEntrada = {
  blocks: [
    {
      label: 'Bloque 1',
      purpose: 'Adaptación de Juan',
      microcycles: [
        {
          label: 'Semana 1',
          purpose: null,
          sessions: [{ label: 'A', instructions: 'Entrada en calor', prescriptions: [{ exerciseVersionId: 'ej-1', sets: [{ repetitions: { value: 8 }, note: 'lento' }, { repetitions: { value: 8 } }], intensity: null, note: 'Cuidado con la rodilla', suggestedLoad: { value: 60, unit: 'kg' } }] }],
        },
      ],
      sessions: [{ label: 'B', instructions: null, prescriptions: [{ exerciseVersionId: 'ej-2', sets: [{ repetitions: { min: 6, max: 8 } }], intensity: null }] }],
    },
  ],
};

test('las notas de texto libre se listan con su lugar y su rótulo, en orden de lectura; las vacías no cuentan', () => {
  const notas = notasDeLaEstructura(estructura);
  assert.deepEqual(
    notas.map((n) => [n.lugar, n.texto]),
    [
      ['blocks[0].purpose', 'Adaptación de Juan'],
      ['blocks[0].microcycles[0].sessions[0].instructions', 'Entrada en calor'],
      ['blocks[0].microcycles[0].sessions[0].prescriptions[0].note', 'Cuidado con la rodilla'],
      ['blocks[0].microcycles[0].sessions[0].prescriptions[0].sets[0].note', 'lento'],
    ],
  );
  assert.equal(notas[0]!.rotulo, 'Propósito del bloque «Bloque 1»');
  assert.equal(notas[2]!.rotulo, 'Nota de la prescripción 1 de «A» (microciclo «Semana 1»)');
});

test('vaciar una nota deja todo lo demás igual y no muta la entrada; un lugar inexistente no cambia nada', () => {
  const sinProposito = vaciarNota(estructura, 'blocks[0].purpose');
  assert.equal(sinProposito.blocks[0]!.purpose, null);
  assert.equal(estructura.blocks[0]!.purpose, 'Adaptación de Juan', 'la entrada no se muta');
  const sinNotaDeSerie = vaciarNota(estructura, 'blocks[0].microcycles[0].sessions[0].prescriptions[0].sets[0].note');
  assert.deepEqual(sinNotaDeSerie.blocks[0]!.microcycles![0]!.sessions[0]!.prescriptions[0]!.sets[0], { repetitions: { value: 8 } });
  assert.equal(notasDeLaEstructura(sinNotaDeSerie).length, 3);
  assert.deepEqual(vaciarNota(estructura, 'blocks[7].purpose'), estructura);
  // Vaciarlas todas deja una estructura sin texto libre, con la misma forma.
  const limpia = notasDeLaEstructura(estructura).reduce((e, n) => vaciarNota(e, n.lugar), estructura);
  assert.deepEqual(notasDeLaEstructura(limpia), []);
  assert.equal(sesionesDeLaEstructura(limpia), 2);
});

test('sin cargas sugeridas: se quitan de cada prescripción y nada más cambia; el nombre se normaliza para la unicidad', () => {
  const sin = sinCargasSugeridas(estructura);
  assert.equal('suggestedLoad' in sin.blocks[0]!.microcycles![0]!.sessions[0]!.prescriptions[0]!, false);
  assert.equal(sin.blocks[0]!.microcycles![0]!.sessions[0]!.prescriptions[0]!.note, 'Cuidado con la rodilla');
  assert.equal(sesionesDeLaEstructura(sin), 2);
  assert.equal(nombreNormalizadoDePlantilla('  Fuerza   Básica  '), 'fuerza basica');
});

test('TEST-PRJ-009 · el copy de las plantillas no califica ni promete', () => {
  const textos = Object.values(COPY_PLANTILLAS).map((v) => (typeof v === 'function' ? (v as (...a: never[]) => string)(...(['Fuerza 3 días', 2] as never[])) : v));
  textos.push(COPY_PLANTILLAS.sesiones(1), COPY_PLANTILLAS.origen('3 sept 2026'));
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t).map((p) => `${p} en «${t}»`)), []);
});
