/**
 * WP-EDITOR-ENTRENAMIENTO parte B (DL-196) · la distribución por músculo (`distribucion-por-musculo.ts`): el conteo de
 * series por semana (1 principal, ½ secundaria, sin aproximaciones), la frecuencia, los equilibrios, el reparto de las
 * estructuras y las zonas a cuidar. TEST-EE-40 a TEST-EE-44.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import {
  COPY_DISTRIBUCION,
  distribucionPorMusculo,
  equilibrios,
  nivelDeCalor,
  repartoDeLaEstructura,
  seriesEfectivasDe,
  zonaEnPalabras,
  zonasACuidar,
  zonasDelEjercicioACuidar,
} from './distribucion-por-musculo';
import { PRESETS_DE_ESTRUCTURA } from './presets-de-be';

const banca = { zonas: [{ zoneId: 'pectoral', role: 'PRIMARY' as const }, { zoneId: 'triceps', role: 'SECONDARY' as const }, { zoneId: 'deltoides', role: 'SECONDARY' as const }], seriesEfectivas: 4 };
const aperturas = { zonas: [{ zoneId: 'pectoral', role: 'PRIMARY' as const }], seriesEfectivas: 3 };
const remo = { zonas: [{ zoneId: 'dorsal', role: 'PRIMARY' as const }, { zoneId: 'romboides', role: 'PRIMARY' as const }, { zoneId: 'biceps', role: 'SECONDARY' as const }], seriesEfectivas: 3 };
const sentadilla = { zonas: [{ zoneId: 'cuadriceps', role: 'PRIMARY' as const }, { zoneId: 'gluteos', role: 'PRIMARY' as const }, { zoneId: 'isquios', role: 'SECONDARY' as const }], seriesEfectivas: 4 };

test('TEST-EE-40 · series por semana: 1 si es principal, ½ si es secundaria, por cada día de la sesión', () => {
  const d = distribucionPorMusculo([
    { dias: ['MONDAY', 'THURSDAY'], ejercicios: [banca, remo] },
    { dias: ['TUESDAY'], ejercicios: [aperturas, sentadilla] },
  ]);
  const de = (z: string) => d.zonas.find((x) => x.zoneId === z);
  // Pectoral: banca 4 × 2 días + aperturas 3 × 1 día = 11, de 2 ejercicios.
  assert.equal(de('pectoral')?.series, 11);
  assert.equal(de('pectoral')?.ejercicios, 2);
  // Tríceps: 4 × ½ × 2 = 4; isquios: 4 × ½ × 1 = 2.
  assert.equal(de('triceps')?.series, 4);
  assert.equal(de('isquios')?.series, 2);
  assert.equal(d.maximo, 11);
  assert.equal(zonaEnPalabras(de('pectoral')!), 'Pectoral: 11 series por semana (de 2 ejercicios) · 3 días');
  // El orden es el del catálogo, de la cabeza a los pies.
  assert.deepEqual(d.zonas.map((z) => z.zoneId).slice(0, 3), ['deltoides', 'pectoral', 'romboides']);
});

test('TEST-EE-41 · las aproximaciones no cuentan; sin días, una vez por semana; sin zonas, no suma', () => {
  assert.equal(seriesEfectivasDe({ sets: [{ setKind: 'WARM_UP' }, { setKind: 'WARM_UP' }, {}, { setKind: 'WORKING' }, {}] }), 3);
  const d = distribucionPorMusculo([
    { dias: [], ejercicios: [banca, { zonas: [], seriesEfectivas: 5 }] },
    { dias: [], ejercicios: [] },
  ]);
  assert.equal(d.sesionesSinDias, 1, 'la sesión vacía no cuenta');
  assert.equal(d.ejerciciosSinZonas, 1);
  assert.equal(d.zonas.find((z) => z.zoneId === 'pectoral')?.series, 4);
  // Una zona que no es de las 17 se deja afuera.
  assert.equal(distribucionPorMusculo([{ dias: ['MONDAY'], ejercicios: [{ zonas: [{ zoneId: 'cuello', role: 'PRIMARY' }], seriesEfectivas: 3 }] }]).zonas.length, 0);
});

test('TEST-EE-42 · la frecuencia: los días distintos en que se trabaja, principal o secundaria', () => {
  const d = distribucionPorMusculo([
    { dias: ['MONDAY', 'THURSDAY'], ejercicios: [banca] },
    { dias: ['MONDAY'], ejercicios: [aperturas] },
    { dias: [], ejercicios: [aperturas] },
  ]);
  const pectoral = d.zonas.find((z) => z.zoneId === 'pectoral')!;
  // Lunes y jueves, más la sesión sin días (un día propio): 3.
  assert.equal(pectoral.dias, 3);
  assert.equal(d.zonas.find((z) => z.zoneId === 'triceps')?.dias, 2);
  // El calor, en cuatro niveles, relativo al máximo de la fase.
  assert.deepEqual([nivelDeCalor(0, 10), nivelDeCalor(1, 10), nivelDeCalor(5, 10), nivelDeCalor(10, 10)], [0, 1, 2, 4]);
});

test('TEST-EE-43 · los equilibrios: pares lado a lado, sin calificar; las estructuras con su reparto', () => {
  const d = distribucionPorMusculo([{ dias: ['MONDAY'], ejercicios: [banca, remo, sentadilla] }]);
  const e = equilibrios(d);
  const par = (c: string) => e.find((x) => x.clave === c);
  // Empuje: pectoral 4 + tríceps 2 = 6; tracción: dorsal 3 + romboides 3 + bíceps 1,5 = 7,5.
  assert.deepEqual(par('EMPUJE_TRACCION'), { clave: 'EMPUJE_TRACCION', izquierda: { nombre: 'Empuje', series: 6 }, derecha: { nombre: 'Tracción', series: 7.5 } });
  assert.deepEqual(par('CUADRICEPS_ISQUIOS')?.derecha.series, 2);
  assert.equal(par('ABDOMEN_LUMBAR'), undefined, 'un par sin series no va');
  assert.equal(PRESETS_DE_ESTRUCTURA.length, 4);
  const torsoPiernas = repartoDeLaEstructura(PRESETS_DE_ESTRUCTURA.find((p) => p.clave === 'TORSO_PIERNAS_4')!);
  assert.equal(torsoPiernas.zonas.find((z) => z.zoneId === 'pectoral')?.dias, 2);
  const porGrupo = repartoDeLaEstructura(PRESETS_DE_ESTRUCTURA.find((p) => p.clave === 'POR_GRUPO_MUSCULAR_5')!);
  assert.equal(porGrupo.zonas.find((z) => z.zoneId === 'pectoral')?.dias, 1);
  assert.equal(porGrupo.zonas.find((z) => z.zoneId === 'trapecio')?.dias, 2);
});

test('TEST-EE-44 · las zonas a cuidar: lo declarado en el formulario más nuevo, llevado a los músculos cercanos', () => {
  const formulario = (opciones: string[], dolor = true) => ({
    sections: [
      {
        answers: [
          { fieldCode: 'dolor_o_lesiones', answer: { type: 'BOOLEAN', yes: dolor }, text: dolor ? 'Sí' : 'No' },
          { fieldCode: 'trn_zonas', answer: { type: 'MULTI_CHOICE', options: opciones }, text: 'Hombros y Rodillas' },
        ],
      },
    ],
  });
  const z = zonasACuidar([formulario(['hombros', 'rodillas']), formulario(['lumbar'])]);
  assert.deepEqual(z, { declarado: 'Hombros y Rodillas', zonas: ['deltoides', 'cuadriceps'] });
  assert.equal(zonasACuidar([formulario(['hombros'], false)]), null);
  assert.equal(zonasACuidar([formulario(['otra'])]), null);
  assert.equal(zonasACuidar([]), null);
  assert.deepEqual(zonasDelEjercicioACuidar(banca.zonas, z), ['deltoides']);
  assert.deepEqual(zonasDelEjercicioACuidar(remo.zonas, z), []);
  for (const t of Object.values(COPY_DISTRIBUCION).map((v) => (typeof v === 'function' ? (v as (x: unknown) => string)(2) : v))) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(String(t)), [], String(t));
  }
});
