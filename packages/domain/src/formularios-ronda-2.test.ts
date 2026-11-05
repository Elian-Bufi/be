/**
 * WP-FORMULARIOS-RONDA-2 (DL-165): lo que cambió de los formularios de inicio después de la prueba de Dirección.
 * - FR-05 · las ayudas, plegadas (D-2) y sin los minutos (D-3): dónde va la ayuda de cada pregunta, cuándo se ofrece
 *   «Quitar respuesta» y que ningún texto diga los minutos ni califique a la persona.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CampoDePlantillaV2 } from './contratos-formularios-v2';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { COPY_FORMULARIOS_V2 } from './copy-formularios-v2';
import { ayudaDeLaPregunta, seOfreceQuitarRespuesta, TIPOS_CON_QUITAR_RESPUESTA } from './formularios-v2';

const op = (code: string, label = code) => ({ code, label });
const base = { category: 'HABITOS_Y_CONTEXTO' as const, helpText: null, purpose: 'Para armar tu plan.', showIf: null, requiredByDefault: false };

/** Todos los textos de un copy: las cadenas tal cual y las funciones con un valor de ejemplo. */
function textosDe(copy: Readonly<Record<string, unknown>>): string[] {
  return Object.values(copy).flatMap((v) => {
    if (typeof v === 'string') return [v];
    if (typeof v === 'function') return [String((v as (...a: unknown[]) => unknown)('Prueba', 'Prueba', 'Prueba'))];
    if (v && typeof v === 'object') return textosDe(v as Record<string, unknown>);
    return [];
  });
}

// ─── FR-05 · D-2 y D-3 ──────────────────────────────────────────────────────────────────────────

test('DL-165 D-2 · en una respuesta de texto, la ayuda es el texto de muestra; en las demás, una línea a la vista', () => {
  const texto: CampoDePlantillaV2 = { ...base, fieldCode: 'nut_algo', label: '¿Algo más?', dataType: 'TEXT', multiline: true, maxLength: 300, helpText: 'Por ejemplo: el asado del domingo.' };
  assert.deepEqual(ayudaDeLaPregunta(texto), { aLaVista: null, deMuestra: 'Por ejemplo: el asado del domingo.' });
  const numero: CampoDePlantillaV2 = { ...base, fieldCode: 'trn_dias', label: '¿Cuántos días?', dataType: 'NUMBER', unit: 'días', limits: null, helpText: 'Un número entero entre 1 y 7.' };
  assert.deepEqual(ayudaDeLaPregunta(numero), { aLaVista: 'Un número entero entre 1 y 7.', deMuestra: null });
  const opcion: CampoDePlantillaV2 = { ...base, fieldCode: 'nut_objetivo', label: '¿Qué buscás?', dataType: 'MULTI_CHOICE', options: [op('a'), op('b')], maxSelected: 2, exclusiveOptionCodes: [], otherOptionCode: null, helpText: 'Elegí hasta dos.' };
  assert.deepEqual(ayudaDeLaPregunta(opcion), { aLaVista: 'Elegí hasta dos.', deMuestra: null });
  // Sin ayuda, o solo con espacios: no hay nada que mostrar.
  assert.deepEqual(ayudaDeLaPregunta({ dataType: 'TEXT', helpText: '   ' }), { aLaVista: null, deMuestra: null });
  assert.deepEqual(ayudaDeLaPregunta({ dataType: 'BOOLEAN', helpText: null }), { aLaVista: null, deMuestra: null });
});

test('DL-165 D-2 · «Quitar respuesta» va solo con algo elegido en una pregunta opcional, y solo donde se elige', () => {
  const solicitud = { requiredFieldCodes: ['nut_alergias'] };
  // Una opcional con algo elegido: sí. Sin nada elegido: no.
  assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'nut_picoteo', dataType: 'CHOICE' }, solicitud, true), true);
  assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'nut_picoteo', dataType: 'CHOICE' }, solicitud, false), false);
  // En una obligatoria no se ofrece: se cambia de opción.
  assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'nut_alergias', dataType: 'BOOLEAN' }, solicitud, true), false);
  // Los cuatro tipos donde se elige; en un texto se borra lo escrito y en una lista se quita el renglón.
  assert.deepEqual([...TIPOS_CON_QUITAR_RESPUESTA], ['BOOLEAN', 'CHOICE', 'MULTI_CHOICE', 'MATRIX']);
  for (const dataType of ['TEXT', 'NUMBER', 'LIST', 'FOODS', 'TIMES'] as const) assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'x', dataType }, solicitud, true), false, dataType);
});

test('DL-165 D-3 · ningún texto de los formularios V2 dice los minutos, y ninguno califica ni presenta la falta como incumplimiento', () => {
  assert.equal('minutos' in COPY_FORMULARIOS_V2, false);
  const textos = textosDe(COPY_FORMULARIOS_V2);
  assert.ok(textos.length > 40, `se leyeron ${textos.length} textos`);
  for (const t of textos) {
    assert.doesNotMatch(t, /minuto/i, t);
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
  }
  // El botón y su nombre para el lector de pantalla dicen de qué pregunta son.
  assert.equal(COPY_FORMULARIOS_V2.paraQueBoton, '¿Para qué?');
  assert.equal(COPY_FORMULARIOS_V2.paraQueDe('¿Cuántas horas dormís?'), '¿Para qué? ¿Cuántas horas dormís?');
  assert.equal(COPY_FORMULARIOS_V2.quitarRespuestaDe('¿Picoteás?'), 'Quitar respuesta: ¿Picoteás?');
});
