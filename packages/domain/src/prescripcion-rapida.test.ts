import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarPrescripcion, escribirPrescripcion, leerPrescripcion, loQueSePierdeAlQuitarSeries, vistaPreviaDePrescripcion, type PrescripcionLeida } from './prescripcion-rapida';
import { COPY_PRESETS, PRESETS_DE_BE, PRESETS_DE_PRESCRIPCION, VERSION_DE_LOS_PRESETS_DE_BE, prescripcionDelPreset } from './presets-de-be';
import { terminosProhibidosEn } from './index';

const leida = (t: string): PrescripcionLeida => {
  const l = leerPrescripcion(t);
  assert.ok(l.ok, `${t}: ${l.ok ? '' : l.noSeEntiende}`);
  return l.leida;
};

// ── ED-22 · Prescribir en una línea (TEST-EDP-023) ─────────────────────────────────────────────────────────────

test('TEST-EDP-023 · lee las formas del paquete', () => {
  assert.deepEqual(leida('4×8-12 RIR 2 · 60 kg · 90 s'), { series: 4, repeticiones: { min: 8, max: 12 }, rir: 2, carga: { value: 60, unit: 'kg' }, descanso: 90 });
  assert.deepEqual(leida('5x5 @RIR1'), { series: 5, repeticiones: { value: 5 }, rir: 1, carga: null, descanso: null });
  assert.deepEqual(leida('3×15'), { series: 3, repeticiones: { value: 15 }, rir: null, carga: null, descanso: null });
  assert.deepEqual(leida('4x6-8 RIR 2 · 122,5 kg · 3 min'), { series: 4, repeticiones: { min: 6, max: 8 }, rir: 2, carga: { value: 122.5, unit: 'kg' }, descanso: 180 });
  assert.equal(leida('3×10 · 1:30').descanso, 90);
  assert.equal(leida('3×10 135 lb').carga?.unit, 'lb');
});

test('TEST-EDP-023 · «2.5 kg» y «2,5 kg» valen lo mismo', () => {
  assert.deepEqual(leida('3×10 2.5 kg'), leida('3×10 2,5 kg'));
});

test('TEST-EDP-023 · nada ambiguo se aplica: lo que no entiende queda dicho', () => {
  for (const t of ['', 'cuatro por ocho', '8-12', '4×8 RIR 2 RIR 3', '4×8 · 60 kg · 70 kg', '4×8 · 90 s · 2 min', '4×8 RPE 8', '4×8 · 1.850 kg', '0×8', '21×8', '4×12-8', '4×8 RIR 11', '4×8 · 2 h', '4×8 · 61:00']) {
    const l = leerPrescripcion(t);
    assert.equal(l.ok, false, t);
  }
  const rpe = leerPrescripcion('4×8 RPE 8');
  assert.ok(!rpe.ok && /rpe 8/.test(rpe.noSeEntiende));
});

test('TEST-EDP-023 · lo que escribe se vuelve a leer igual (propiedad, sobre una grilla de casos)', () => {
  const casos: PrescripcionLeida[] = [];
  for (const series of [1, 3, 20])
    for (const repeticiones of [{ value: 1 }, { value: 12 }, { min: 6, max: 8 }])
      for (const rir of [null, 0, 2.5])
        for (const carga of [null, { value: 0, unit: 'kg' as const }, { value: 122.5, unit: 'kg' as const }, { value: 135, unit: 'lb' as const }])
          for (const descanso of [null, 0, 45, 90, 180, 3600]) casos.push({ series, repeticiones, rir, carga, descanso });
  for (const c of casos) assert.deepEqual(leida(escribirPrescripcion(c)), c, escribirPrescripcion(c));
  assert.equal(vistaPreviaDePrescripcion(leida('4×8-12 RIR 2 · 60 kg · 90 s')), '4 series · 8 a 12 · RIR 2 · 60 kg · 1:30');
});

test('TEST-EDP-023 · aplicada, el ejercicio queda con esos valores generales y 4 series que los heredan', () => {
  const p = { exerciseVersionId: 'e', sets: [{ repetitions: { value: 10 } }], intensity: null };
  const { prescripcion } = aplicarPrescripcion(p, leida('4×8-12 RIR 2 · 60 kg · 90 s'));
  assert.equal(prescripcion.sets.length, 4);
  for (const s of prescripcion.sets) assert.deepEqual(s, { repetitions: { min: 8, max: 12 } });
  assert.deepEqual(prescripcion.intensity, { criterion: 'RIR', target: { value: 2, reference: null } });
  assert.deepEqual(prescripcion.suggestedLoad, { value: 60, unit: 'kg' });
  assert.equal(prescripcion.restSeconds, 90);
});

// ── ED-11 · Aplicar un preset (TEST-EDP-012 y 013, con DJ-8) ────────────────────────────────────────────────────

test('TEST-EDP-012 · un preset de BE nunca trae ejercicio, alimento ni carga; su versión queda en el contenido', () => {
  assert.equal(VERSION_DE_LOS_PRESETS_DE_BE, 1);
  assert.equal(PRESETS_DE_BE.length, 7);
  for (const p of PRESETS_DE_BE) {
    assert.doesNotMatch(JSON.stringify(p), /exercise|food|alimento|kg|lb\b|suggestedLoad/i, p.clave);
    if (p.tipo === 'PRESCRIPCION') assert.equal(prescripcionDelPreset(p).carga, null);
  }
  for (const t of Object.values(COPY_PRESETS).map((v) => (typeof v === 'function' ? (v as (...a: unknown[]) => string)(3, 'Piernas A', 4) : v))) {
    assert.deepEqual(terminosProhibidosEn(String(t)), [], String(t));
    assert.doesNotMatch(String(t), /asesorad|DL-|ED-/i);
  }
});

const hipertrofia = prescripcionDelPreset(PRESETS_DE_PRESCRIPCION.find((p) => p.clave === 'HIPERTROFIA')!);

test('TEST-EDP-013 · aplicar nunca borra una carga: queda escrita y marcada «escrita para 6-8: revisala»', () => {
  const p = { exerciseVersionId: 'e', sets: [{ repetitions: { min: 6, max: 8 } }, { repetitions: { min: 6, max: 8 } }, { repetitions: { min: 6, max: 8 }, suggestedLoad: { value: 110, unit: 'kg' as const } }], intensity: null, suggestedLoad: { value: 122.5, unit: 'kg' as const } };
  const { prescripcion, cambio } = aplicarPrescripcion(p, hipertrofia);
  assert.deepEqual(prescripcion.suggestedLoad, { value: 122.5, unit: 'kg' });
  assert.deepEqual(prescripcion.sets[2]!.suggestedLoad, { value: 110, unit: 'kg' });
  assert.equal(cambio.carga.revisar, 'escrita para 6-8: revisala');
  assert.deepEqual(cambio.series, { antes: 3, despues: 4 });
  assert.deepEqual(cambio.sePierde, []);
});

test('TEST-EDP-013 · lo que muestra la vista previa es lo que queda; aplicar dos veces no duplica series', () => {
  const p = { exerciseVersionId: 'e', sets: [{ repetitions: { value: 3 } }], intensity: null };
  const una = aplicarPrescripcion(p, hipertrofia);
  const dos = aplicarPrescripcion(una.prescripcion, hipertrofia);
  assert.equal(una.prescripcion.sets.length, una.cambio.series.despues);
  assert.deepEqual(dos.prescripcion, una.prescripcion);
  assert.equal(una.cambio.repeticiones.despues, '8-12');
  assert.equal(una.cambio.descanso.despues, una.prescripcion.restSeconds);
});

test('TEST-EDP-013 · «Deshacer» devuelve exacto: es la prescripción de antes, que no se tocó', () => {
  const p = { exerciseVersionId: 'e', sets: [{ repetitions: { value: 5 }, rir: 1, note: 'pausa' }], intensity: { criterion: 'RIR', target: { value: 2 } }, restSeconds: 120 };
  const antes = structuredClone(p);
  aplicarPrescripcion(p, hipertrofia);
  assert.deepEqual(p, antes);
});

test('TEST-EDP-056 · lo que se pierde se nombra antes: series con valores propios y valores propios reemplazados', () => {
  const sets = [{ repetitions: { value: 5 } }, { repetitions: { value: 5 }, rir: 1, restSeconds: 150 }, { repetitions: { value: 5 } }, { repetitions: { value: 5 }, rir: 1, suggestedLoad: { value: 82.5, unit: 'kg' as const } }];
  assert.deepEqual(loQueSePierdeAlQuitarSeries(sets, 3), ['Quitar la serie 4: se pierde su RIR (1) y su carga (82,5 kg)']);
  assert.deepEqual(loQueSePierdeAlQuitarSeries(sets, 4), []);
  const { cambio } = aplicarPrescripcion({ exerciseVersionId: 'e', sets, intensity: null }, leida('3×5 RIR 2 · 90 s'));
  assert.deepEqual(cambio.sePierde, [
    'Quitar la serie 4: se pierde su RIR (1) y su carga (82,5 kg)',
    'Serie 2: su RIR propio (1) pasa a ser el de la prescripción',
    'Serie 2: su descanso propio (2:30) pasa a ser el de la prescripción',
  ]);
});
