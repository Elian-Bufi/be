/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3) · TEST-ET3-10 a TEST-ET3-19: la sugerencia de progresión desde lo que hizo la
 * persona (doble progresión) y el cardio en los parámetros de BE. Los resultados esperados se escriben a mano. Datos
 * sintéticos.
 * Mutaciones que estas pruebas ponen en rojo: sugerir con una serie de menos o con una repetición de menos; tomar el
 * mínimo del rango y no el tope; comparar el RIR al revés; sugerir con menos carga que la planificada o con una progresión
 * en la fase; subir las aproximaciones; tomar «Duración 30 s» de una plancha como cardio; perder los parámetros propios al
 * pasar a cardio; dejar repeticiones o carga en el cardio.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CARDIO_SIN_INDICAR,
  cardioDe,
  cardioEnPalabras,
  conElCardio,
  esCardio,
  leerIntensidadDelCardio,
  parametrosDelCardio,
  problemasDelCardio,
  sinElCardio,
  textoDeLaIntensidadDelCardio,
} from './cardio-de-la-prescripcion';
import { renglonDelEjercicio } from './lectura-del-plan-de-entrenamiento';
import { ejercicioPlegadoDelEditor } from './editor-del-plan-de-entrenamiento';
import { lineasDePrescripcion } from './presentacion-de-prescripcion';
import { claveDeLaSugerencia, conLaCargaSubida, pasoDeLaProgresion, sugerenciaDeProgresion, type PrescripcionParaLaSugerencia } from './sugerencia-de-progresion';
import type { SerieDeLaVezPasada, VezPasada } from './la-vez-pasada';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { COPY_SUGERENCIA_DE_PROGRESION } from './sugerencia-de-progresion';
import { COPY_CARDIO } from './cardio-de-la-prescripcion';

const kg = (value: number) => ({ value, unit: 'kg' as const });
const serie = (numero: number, carga: number | null, repeticiones: number | null, rir: number | null, cargaRapida = false): SerieDeLaVezPasada => ({
  numero,
  carga: carga === null ? null : kg(carga),
  repeticiones,
  rir,
  duracion: null,
  cargaRapida,
  delPlan: [],
});
const vez = (series: readonly SerieDeLaVezPasada[], fecha = '2026-11-24'): VezPasada => ({
  executionId: 'ejec-1',
  prescriptionId: 'presc-1',
  fecha,
  sesion: 'Torso A',
  cargadaOtroDia: false,
  corregida: false,
  como: { tipo: 'series', series, enLugarDe: null },
  comparable: true,
});
/** 3 × 8–10 a RIR 2 con 60 kg de común, y una aproximación arriba. */
const PRESS: PrescripcionParaLaSugerencia = {
  intensity: { criterion: 'RIR', target: { value: 2 } },
  suggestedLoad: kg(60),
  sets: [{ repetitions: { value: 8 }, setKind: 'WARM_UP', suggestedLoad: kg(30), rir: null }, { repetitions: { min: 8, max: 10 } }, { repetitions: { min: 8, max: 10 } }, { repetitions: { min: 8, max: 10 } }],
};
const HECHA = [serie(1, 30, 8, null), serie(2, 60, 10, 2), serie(3, 60, 10, 3), serie(4, 60, 10, 2)];

test('TEST-ET3-10: todas las series con el tope del rango, el RIR pedido o más y la carga → «+2,5 kg la próxima», con el motivo', () => {
  const s = sugerenciaDeProgresion({ prescripcion: PRESS, veces: [vez(HECHA)], nombre: 'Press de banca plano con barra' });
  assert.ok(s);
  assert.equal(s.titulo, '+2,5 kg la próxima');
  assert.deepEqual(s.desde, kg(60));
  assert.deepEqual(s.hasta, kg(62.5));
  assert.equal(s.motivo, 'Hizo las 3 series con 10 repeticiones a RIR 2 o más y 60 kg el 24 nov.');
  assert.equal(claveDeLaSugerencia('ej-9', s), 'ej-9|ejec-1|presc-1');
  // En RPE, la misma cuenta, dicha al revés.
  assert.equal(sugerenciaDeProgresion({ prescripcion: PRESS, veces: [vez(HECHA)], nombre: 'Press de banca plano con barra', notacion: 'RPE' })!.motivo, 'Hizo las 3 series con 10 repeticiones a RPE 8 o menos y 60 kg el 24 nov.');
});

test('TEST-ET3-11: si falta algo, no sugiere nada (una repetición menos, una serie menos, un RIR más bajo, menos carga, otra vez más vieja)', () => {
  const base = { prescripcion: PRESS, nombre: 'Press de banca plano con barra' };
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [vez([HECHA[0]!, HECHA[1]!, serie(3, 60, 9, 3), HECHA[3]!])] }), null, 'una con 9 (el mínimo del rango no alcanza)');
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [vez(HECHA.slice(0, 3))] }), null, 'una serie menos');
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [vez([HECHA[0]!, HECHA[1]!, serie(3, 60, 10, 1), HECHA[3]!])] }), null, 'RIR 1 con RIR 2 pedido');
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [vez([HECHA[0]!, HECHA[1]!, serie(3, 57.5, 10, 2), HECHA[3]!])] }), null, 'con menos carga');
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [vez([HECHA[0]!, HECHA[1]!, serie(3, 60, 10, null), HECHA[3]!])] }), null, 'sin el RIR');
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [] }), null, 'sin registros');
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [{ ...vez(HECHA), comparable: false, como: { tipo: 'resumida' } }] }), null, 'resumida');
  // Solo se mira la última vez: una vieja que cumplía no cuenta si la última no.
  assert.equal(sugerenciaDeProgresion({ ...base, veces: [vez(HECHA.slice(0, 3), '2026-11-24'), vez(HECHA, '2026-11-20')] }), null);
  // La aproximación no cuenta: puede faltar o venir sin RIR.
  assert.ok(sugerenciaDeProgresion({ ...base, veces: [vez(HECHA.slice(1))] }));
  // Tildada «como el plan»: cuenta como hecha con lo del plan.
  assert.ok(sugerenciaDeProgresion({ ...base, veces: [vez([HECHA[0]!, serie(2, 60, 10, 2, true), HECHA[2]!, HECHA[3]!])] }));
});

test('TEST-ET3-12: con una progresión en la fase no sugiere (ET3-D12); el paso es el del implemento o el de la fase (ET3-D11)', () => {
  assert.equal(sugerenciaDeProgresion({ prescripcion: PRESS, veces: [vez(HECHA)], nombre: 'Press de banca plano con barra', conProgresionDeLaFase: true }), null);
  assert.equal(pasoDeLaProgresion('BARRA', 'kg'), 2.5);
  assert.equal(pasoDeLaProgresion('MANCUERNA', 'kg'), 2);
  assert.equal(pasoDeLaProgresion('MAQUINA', 'kg'), 5);
  assert.equal(pasoDeLaProgresion('OTRO', 'lb'), 5);
  assert.equal(pasoDeLaProgresion('MAQUINA', 'lb'), 10);
  assert.equal(sugerenciaDeProgresion({ prescripcion: PRESS, veces: [vez(HECHA)], nombre: 'Press de pecho en máquina' })!.titulo, '+5 kg la próxima');
  assert.equal(sugerenciaDeProgresion({ prescripcion: PRESS, veces: [vez(HECHA)], nombre: 'Press de banca con mancuernas' })!.hasta.value, 62);
  assert.equal(sugerenciaDeProgresion({ prescripcion: PRESS, veces: [vez(HECHA)], nombre: 'Press de banca plano con barra', paso: 1 })!.titulo, '+1 kg la próxima');
  // Sin RIR pedido (sin criterio), alcanza con las repeticiones y la carga; el motivo no inventa un esfuerzo.
  const sinCriterio = { ...PRESS, intensity: null };
  assert.equal(sugerenciaDeProgresion({ prescripcion: sinCriterio, veces: [vez(HECHA)], nombre: 'Press de banca plano con barra' })!.motivo, 'Hizo las 3 series con 10 repeticiones y 60 kg el 24 nov.');
});

test('TEST-ET3-13: aplicar sube la común y las propias de las efectivas; las aproximaciones quedan (ET3-D10)', () => {
  const s = sugerenciaDeProgresion({ prescripcion: PRESS, veces: [vez(HECHA)], nombre: 'Press de banca plano con barra' })!;
  const subida = conLaCargaSubida(PRESS, s);
  assert.deepEqual(subida.suggestedLoad, kg(62.5));
  assert.deepEqual(subida.sets[0]!.suggestedLoad, kg(30), 'la aproximación no se toca');
  // Una pirámide sigue siendo pirámide.
  const piramide: PrescripcionParaLaSugerencia = { intensity: null, suggestedLoad: null, sets: [{ repetitions: { value: 10 }, suggestedLoad: kg(50) }, { repetitions: { value: 8 }, suggestedLoad: kg(55) }] };
  const s2 = sugerenciaDeProgresion({ prescripcion: piramide, veces: [vez([serie(1, 50, 10, null), serie(2, 55, 8, null)])], nombre: 'Sentadilla con barra' })!;
  assert.equal(s2.motivo, 'Hizo las 2 series con las repeticiones pedidas y las cargas planificadas el 24 nov.');
  const p2 = conLaCargaSubida(piramide, s2);
  assert.deepEqual(p2.sets.map((x) => x.suggestedLoad), [kg(52.5), kg(57.5)]);
  assert.equal(p2.suggestedLoad, null);
  // Sin ninguna carga planificada: la registrada más alta, y la nueva queda como común.
  const sinCarga: PrescripcionParaLaSugerencia = { intensity: null, suggestedLoad: null, sets: [{ repetitions: { value: 10 } }] };
  const s3 = sugerenciaDeProgresion({ prescripcion: sinCarga, veces: [vez([serie(1, 40, 10, null)])], nombre: 'Remo con barra' })!;
  assert.deepEqual(conLaCargaSubida(sinCarga, s3).suggestedLoad, kg(42.5));
});

test('TEST-ET3-14: el cardio se marca con la «Duración» de BE en minutos; una plancha de 30 s o uno con series no es cardio (ET3-D13)', () => {
  const cardio = { sets: [{ repetitions: null }], suggestedLoad: null, professionalParameters: [{ label: 'Duración', value: 30, unit: 'min' }, { label: 'Distancia', value: 5, unit: 'km' }, { label: 'Intensidad', value: 'Zona 2' }] };
  assert.equal(esCardio(cardio), true);
  assert.deepEqual(cardioDe(cardio), { duracionMinutos: 30, distancia: { valor: 5, unidad: 'km' }, intensidad: { tipo: 'ZONA', zona: 2 } });
  assert.equal(esCardio({ sets: [{ repetitions: null }], professionalParameters: [{ label: 'Duración', value: 30, unit: 's' }] }), false, 'una plancha');
  assert.equal(esCardio({ sets: [{ repetitions: { value: 10 } }], professionalParameters: [{ label: 'Duración', value: 1, unit: 'min' }] }), false, 'con repeticiones');
  assert.equal(esCardio({ sets: [{ repetitions: null }, { repetitions: null }], professionalParameters: [{ label: 'Duración', value: 1, unit: 'min' }] }), false, 'dos series');
  assert.equal(esCardio({ sets: [{ repetitions: null }], suggestedLoad: kg(10), professionalParameters: [{ label: 'Duración', value: 1, unit: 'min' }] }), false, 'con carga');
  // Sin indicar todavía: es cardio, sin minutos.
  assert.deepEqual(cardioDe({ sets: [{ repetitions: null }], professionalParameters: [{ label: 'Duración', value: 'Sin indicar' }] }), CARDIO_SIN_INDICAR);
  // La lectura por serie trae las repeticiones en `target`.
  assert.equal(esCardio({ sets: [{ target: { repetitions: null, suggestedLoad: null } }], professionalParameters: [{ label: 'Duración', value: 20, unit: 'min' }] }), true);
  assert.equal(esCardio({ sets: [{ target: { repetitions: { value: 8 } } }], professionalParameters: [{ label: 'Duración', value: 20, unit: 'min' }] }), false);
});

test('TEST-ET3-15: pasar a cardio deja una serie sin repeticiones, sin carga ni criterio, y conserva los parámetros propios; volver a series los saca', () => {
  const fuerza = {
    exerciseVersionId: 'v1',
    sets: [{ repetitions: { value: 10 }, note: 'suave', rir: 2 }, { repetitions: { value: 10 } }],
    intensity: { criterion: 'RIR', target: { value: 2 } },
    suggestedLoad: kg(20),
    restSeconds: 90,
    professionalParameters: [{ label: 'Pendiente', value: 2, unit: '%' }],
  };
  const c = conElCardio(fuerza, { duracionMinutos: 25, distancia: null, intensidad: { tipo: 'ESFUERZO', valor: 6 } });
  assert.deepEqual(c.sets, [{ repetitions: null, note: 'suave' }]);
  assert.equal(c.intensity, null);
  assert.equal(c.suggestedLoad, null);
  assert.equal((c as { restSeconds?: unknown }).restSeconds, null);
  assert.deepEqual(c.professionalParameters, [
    { label: 'Duración', value: 25, unit: 'min' },
    { label: 'Intensidad', value: 'Esfuerzo 6 de 10' },
    { label: 'Pendiente', value: 2, unit: '%' },
  ]);
  assert.equal(c.exerciseVersionId, 'v1');
  // Escribir otra vez reemplaza los de BE, no los suma.
  const otra = conElCardio(c, { duracionMinutos: 30, distancia: { valor: 400, unidad: 'm' }, intensidad: null });
  assert.deepEqual(otra.professionalParameters.map((q) => q.label), ['Duración', 'Distancia', 'Pendiente']);
  const series = sinElCardio(otra);
  assert.deepEqual(series.professionalParameters, [{ label: 'Pendiente', value: 2, unit: '%' }]);
  assert.deepEqual(series.sets, [{ repetitions: null }]);
  assert.equal(esCardio(series), false);
  assert.deepEqual(parametrosDelCardio(CARDIO_SIN_INDICAR), [{ label: 'Duración', value: 'Sin indicar' }]);
});

test('TEST-ET3-16: la intensidad del cardio se escribe y se lee: zona, esfuerzo de 0 a 10 o en palabras', () => {
  assert.deepEqual(leerIntensidadDelCardio('Zona 3'), { tipo: 'ZONA', zona: 3 });
  assert.deepEqual(leerIntensidadDelCardio('Esfuerzo 6,5 de 10'), { tipo: 'ESFUERZO', valor: 6.5 });
  assert.deepEqual(leerIntensidadDelCardio('conversacional'), { tipo: 'TEXTO', texto: 'conversacional' });
  assert.deepEqual(leerIntensidadDelCardio('Zona 7'), { tipo: 'TEXTO', texto: 'Zona 7' }, 'la zona 7 no existe: queda como texto');
  assert.equal(leerIntensidadDelCardio('  '), null);
  assert.equal(textoDeLaIntensidadDelCardio({ tipo: 'ESFUERZO', valor: 6.5 }), 'Esfuerzo 6,5 de 10');
  assert.deepEqual(problemasDelCardio({ duracionMinutos: 0, distancia: { valor: 0, unidad: 'km' }, intensidad: { tipo: 'ESFUERZO', valor: 11 } }), ['DURACION_FUERA_DE_RANGO', 'DISTANCIA_FUERA_DE_RANGO', 'ESFUERZO_FUERA_DE_RANGO']);
  assert.deepEqual(problemasDelCardio({ duracionMinutos: 45, distancia: { valor: 8.5, unidad: 'km' }, intensidad: null }), []);
});

test('TEST-ET3-17: el renglón del cardio, plegado en el editor y en la app: «30 min · 5 km · zona 2»', () => {
  assert.equal(cardioEnPalabras({ duracionMinutos: 30, distancia: { valor: 5, unidad: 'km' }, intensidad: { tipo: 'ZONA', zona: 2 } }), '30 min · 5 km · zona 2');
  assert.equal(cardioEnPalabras({ duracionMinutos: 20, distancia: null, intensidad: { tipo: 'ESFUERZO', valor: 6 } }), '20 min · esfuerzo 6 de 10');
  assert.equal(cardioEnPalabras(CARDIO_SIN_INDICAR), 'Duración sin indicar');
  const p = { sets: [{ repetitions: null }], intensity: null, suggestedLoad: null, professionalParameters: [{ label: 'Duración', value: 30, unit: 'min' }, { label: 'Distancia', value: 5, unit: 'km' }, { label: 'Intensidad', value: 'Zona 2' }] };
  assert.equal(ejercicioPlegadoDelEditor(p, 0).resumen, '30 min · 5 km · zona 2');
  assert.deepEqual(ejercicioPlegadoDelEditor({ ...p, professionalParameters: [{ label: 'Duración', value: 0, unit: 'min' }] }, 0).avisos, ['La duración va de 0,5 a 600 min.']);
  // La lectura por serie (la de la app): la serie trae su objetivo en `target`.
  const leida = { sets: [{ setIndex: 1, target: { repetitions: null, rir: null, suggestedLoad: null, restSeconds: null } }], intensity: null, professionalParameters: p.professionalParameters };
  assert.equal(renglonDelEjercicio(leida as unknown as Parameters<typeof renglonDelEjercicio>[0]), '30 min · 5 km · zona 2');
});

test('TEST-ET3-18: la APK de hoy, sin cambios, lo lee como parámetros: «Duración: 30 min», «Distancia: 5 km», «Intensidad: Zona 2»', () => {
  const lineas = lineasDePrescripcion({
    prescriptionId: 'p',
    order: 1,
    exerciseId: 'e',
    exerciseVersionId: 'v',
    exerciseName: 'Ciclismo',
    sets: [{ setIndex: 1, repetitions: null, note: null }],
    intensity: null,
    suggestedLoad: null,
    professionalParameters: [{ label: 'Duración', value: 30, unit: 'min' }, { label: 'Distancia', value: 5, unit: 'km' }, { label: 'Intensidad', value: 'Zona 2' }],
    note: null,
  } as unknown as Parameters<typeof lineasDePrescripcion>[0]);
  assert.ok(lineas.includes('Duración: 30 min'));
  assert.ok(lineas.includes('Distancia: 5 km'));
  assert.ok(lineas.includes('Intensidad: Zona 2'));
});

test('TEST-ET3-19: los textos describen: sin palabras prohibidas y sin «volumen»', () => {
  const textos: string[] = [
    ...Object.values(COPY_SUGERENCIA_DE_PROGRESION).map((t) => (typeof t === 'string' ? t : t('62,5 kg'))),
    ...Object.values(COPY_CARDIO).flatMap((t): string[] => (typeof t === 'string' ? [t] : Object.values(t))),
  ];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /volumen|cumplimiento|adherencia|racha|puntaje|asesorado|estaci[oó]n/i, t);
  }
});
