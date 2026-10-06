/**
 * La APK nueva nunca muestra los objetivos generales como si fueran los de una serie (precierre del 2026-10-06, §2):
 * `apps/mobile/src/series-de-la-sesion.ts` (`sesionDesdeLaOcurrencia`).
 *
 * Cuando API-SER-02 no se puede leer, la sesión se arma desde «Hoy» (API-TRN-14), que trae la intensidad y la carga
 * generales de cada prescripción. Con objetivos por serie, las generales pueden no ser las de una serie y desde «Hoy» no
 * se puede saber. Por eso esta APK puede declarar la capacidad `training-set-targets-1` sin fingirla: en el respaldo
 * muestra solo las repeticiones de cada serie, que sí son de esa serie.
 * Uso: node --test scripts/compatibilidad-en-el-telefono.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const series = await import('../apps/mobile/src/series-de-la-sesion.ts');
const { COPY_ENTRENAMIENTO_POR_SERIE, SesionConObjetivosSchema } = await import('@be/domain');

/** La sesión de una ocurrencia como la da «Hoy»: RIR 3 y 16 kg generales, aunque la serie 3 lleve otros. */
const DE_HOY = {
  sessionId: 's1',
  label: 'Piernas A',
  order: 1,
  instructions: 'Entrada en calor de 5 minutos.',
  blockLabel: 'Bloque 1',
  microcycleLabel: null,
  prescriptions: [
    {
      prescriptionId: 'pA',
      order: 1,
      exerciseId: 'ej-a',
      exerciseVersionId: 'ev-a',
      exerciseName: 'Sentadilla goblet',
      sets: [
        { setIndex: 1, repetitions: { min: 12, max: 16 }, note: null },
        { setIndex: 2, repetitions: { min: 10, max: 12 }, note: null },
        { setIndex: 3, repetitions: { min: 8, max: 10 }, note: 'Última, más pesada' },
      ],
      intensity: { criterion: 'RIR', target: { value: 3, reference: null } },
      suggestedLoad: { value: 16, unit: 'kg' },
      professionalParameters: [],
      note: 'Tronco erguido.',
    },
  ],
};

test('sin API-SER-02, la sesión de respaldo no lleva la carga ni el RIR generales en ninguna serie ni en el ejercicio', () => {
  const s = series.sesionDesdeLaOcurrencia(DE_HOY);
  assert.equal(SesionConObjetivosSchema.safeParse(s).success, true);
  const p = s.prescriptions[0];
  assert.equal(p.intensity, null);
  assert.equal(p.suggestedLoad, null);
  for (const x of p.sets) {
    assert.equal(x.target.rir, null, `serie ${x.setIndex}`);
    assert.equal(x.target.suggestedLoad, null, `serie ${x.setIndex}`);
    assert.deepEqual(x.targetOrigin, { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'NONE' });
  }
  // Lo que sí es de cada serie se conserva: sus repeticiones y su nota.
  assert.deepEqual(p.sets.map((x) => x.target.repetitions), [{ min: 12, max: 16 }, { min: 10, max: 12 }, { min: 8, max: 10 }]);
  assert.equal(p.sets[2].note, 'Última, más pesada');
  assert.equal(p.note, 'Tronco erguido.');
});

test('lo que se ve en la tabla y en la banda de la serie: las repeticiones, y «Sin objetivo» en la carga y el RIR', () => {
  const s = series.sesionDesdeLaOcurrencia(DE_HOY);
  const serie3 = s.prescriptions[0].sets[2];
  const placeholders = series.placeholdersDeLaSerie(serie3.target, 'kg');
  assert.equal(placeholders.carga, COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo);
  assert.equal(placeholders.rir, COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo);
  assert.equal(placeholders.repeticiones, '8–10');
  const banda = series.bandaDeLaSerie(3, serie3.target);
  assert.doesNotMatch(banda.completa, /16|RIR 3/, 'ni la carga ni el RIR generales aparecen como plan de la serie');
  assert.match(series.AVISO_SIN_PLAN_POR_SERIE, /no mostramos la carga ni el RIR objetivo/);
});
