/**
 * DL-108 D-3, ratificado por Dirección el 19/11 · al guardar un plan como plantilla, además de las notas se muestran
 * para confirmar o vaciar los nombres (fases, microciclos, sesiones y bloques; en Nutrición, días tipo, comidas y
 * opciones), los parámetros del profesional de cada ejercicio y la referencia del %RM. Un bloque «Diego · piernas» no
 * viaja sin que el profesional lo vea.
 *
 * Mutaciones que ponen estas pruebas en rojo: no listar los bloques de la sesión; vaciar un nombre a '' (el contrato lo
 * rechaza).
 *
 * Uso: npm run test -w @be/domain (después de construirlo).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { EstructuraDePlanDeEntrenamientoEntradaSchema, type EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';
import type { EstructuraDePlanEntrada } from './contratos-nutricion';
import { COPY_PLANTILLAS } from './copy-plantillas';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { esNombreGenerico, loQueViajaALaPlantilla, loQueViajaALaPlantillaNutricional, vaciarLoQueViaja } from './plantillas-de-plan';

const EJ = '00000000-0000-4000-8000-000000000001';
const estructura: EstructuraDePlanDeEntrenamientoEntrada = {
  blocks: [
    {
      label: 'Fase 1',
      sessions: [
        {
          label: 'Sesión A',
          exerciseGroups: [{ groupId: 'g1', label: 'Diego · piernas', kind: 'SEQUENTIAL' }],
          prescriptions: [
            {
              exerciseVersionId: EJ,
              sets: [{ repetitions: { value: 8 } }],
              intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM de Diego medido el 3/11' } } },
              professionalParameters: [{ label: 'Tempo', value: '3-1-1' }, { label: 'Rango', value: 30, unit: 'cm' }],
              exerciseGroupId: 'g1',
            },
          ],
        },
      ],
    },
    {
      label: 'Pretemporada de Diego',
      microcycles: [{ label: 'Semana 1', sessions: [{ label: 'Torso de Diego', prescriptions: [] }] }],
    },
  ],
} as unknown as EstructuraDePlanDeEntrenamientoEntrada;

test('DL-108 D-3 · se listan los nombres propios, los parámetros y la referencia del %RM; los nombres genéricos no', () => {
  const items = loQueViajaALaPlantilla(estructura);
  assert.deepEqual(
    items.map((x) => [x.tipo, x.texto]),
    [
      ['NOMBRE', 'Diego · piernas'],
      ['PARAMETRO', '3-1-1'],
      ['PARAMETRO', '30 cm'],
      ['REFERENCIA', '1RM de Diego medido el 3/11'],
      ['NOMBRE', 'Pretemporada de Diego'],
      ['NOMBRE', 'Torso de Diego'],
    ],
  );
  assert.equal(items[0]!.rotulo, 'Nombre del bloque 1 de «Sesión A»');
  assert.equal(items[1]!.rotulo, 'Parámetro «Tempo» del ejercicio 1 de «Sesión A»');
  assert.equal(items[3]!.rotulo, 'Referencia del %RM del ejercicio 1 de «Sesión A»');
  for (const g of ['Fase 2', 'Bloque 1', 'Semana 3', 'Sesión B', 'Sesion 4', 'Día tipo 1', 'Comida 2', 'Opción 1']) assert.ok(esNombreGenerico(g), g);
  // Los nombres comunes, sin tildes ni mayúsculas (Dirección, 19/11): no nombran a nadie y no se listan.
  for (const g of ['DESAYUNO', 'Colacion 2', 'Media mañana', 'Pre-entreno', 'Post entreno', 'Día habitual', 'Piernas A', 'Torso', 'core', 'Pierna', 'Tren superior B']) assert.ok(esNombreGenerico(g), g);
  for (const g of ['Diego · piernas', 'Bloque de fuerza', 'Torso de Diego', 'Desayuno de Ana', 'Pretemporada']) assert.ok(!esNombreGenerico(g), g);
});

test('DL-108 D-3 · vaciar: el nombre pasa a su genérico (nunca vacío), el parámetro se quita, la referencia queda en null; la entrada no cambia', () => {
  const antes = structuredClone(estructura);
  const limpia = loQueViajaALaPlantilla(estructura).reduceRight((e, x) => vaciarLoQueViaja(e, x), estructura);
  assert.deepEqual(estructura, antes, 'la entrada no se muta');
  assert.deepEqual(loQueViajaALaPlantilla(limpia), []);
  const sesion = limpia.blocks[0]!.sessions![0]!;
  assert.equal(sesion.exerciseGroups![0]!.label, 'Bloque 1');
  assert.deepEqual(sesion.prescriptions[0]!.professionalParameters, []);
  assert.equal(sesion.prescriptions[0]!.intensity!.target.reference, null);
  assert.equal(sesion.prescriptions[0]!.intensity!.target.value, 75, 'el %RM queda; solo se va la referencia');
  assert.equal(limpia.blocks[1]!.label, 'Fase 2');
  assert.equal(limpia.blocks[1]!.microcycles![0]!.sessions[0]!.label, 'Sesión A');
  // Lo vaciado sigue entrando en el contrato.
  assert.equal(EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse(limpia).success, true);
  // Quitar un parámetro deja el otro.
  const unParametro = vaciarLoQueViaja(estructura, loQueViajaALaPlantilla(estructura)[1]!);
  assert.deepEqual(unParametro.blocks[0]!.sessions![0]!.prescriptions[0]!.professionalParameters, [{ label: 'Rango', value: 30, unit: 'cm' }]);
  // Un lugar que no existe no cambia nada.
  assert.equal(vaciarLoQueViaja(estructura, { tipo: 'NOMBRE', lugar: 'blocks[9].label', rotulo: '', texto: '', generico: 'Fase 10' }), estructura);
});

test('DL-108 D-3 · Nutrición: los nombres de días tipo, comidas y opciones, con su genérico al vaciar', () => {
  const nut = {
    dayTypes: [
      {
        label: 'Día de Diego',
        meals: [{ label: 'Desayuno', prescriptionMode: 'OPTIONS', options: [{ label: 'Opción 1', items: [] }, { label: 'Lo que le gusta a Diego', items: [] }] }],
      },
    ],
  } as unknown as EstructuraDePlanEntrada;
  const items = loQueViajaALaPlantillaNutricional(nut);
  assert.deepEqual(
    items.map((x) => x.texto),
    // «Desayuno» es un nombre común: no se lista.
    ['Día de Diego', 'Lo que le gusta a Diego'],
  );
  assert.equal(items[1]!.rotulo, 'Nombre de la opción 2 de «Desayuno» (Día de Diego)');
  const limpia = items.reduce((e, x) => vaciarLoQueViaja(e, x), nut);
  assert.equal(limpia.dayTypes[0]!.label, 'Día tipo 1');
  assert.deepEqual(
    limpia.dayTypes[0]!.meals[0]!.options.map((o) => o.label),
    ['Opción 1', 'Opción 2'],
  );
});

test('DL-108 D-3 · los textos nuevos del diálogo no califican ni prometen', () => {
  for (const t of [COPY_PLANTILLAS.textosTitulo, COPY_PLANTILLAS.textosAyuda, COPY_PLANTILLAS.nombresAyuda, COPY_PLANTILLAS.sinTextos, COPY_PLANTILLAS.usarGenerico('Fase 2')]) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
  }
});

test('DL-108 D-3 · vaciar no repite el nombre de un hermano: el genérico es el siguiente libre (revisión adversaria del 19/11)', () => {
  // La «Sesión A» se borró: quedan «Sesión B» y una con el nombre de la persona. Vaciarla no deja dos «Sesión B».
  const e = {
    blocks: [
      { label: 'Diego', sessions: [] },
      // Un plan viejo: «Bloque 1» se lee «Fase 1» y ocupa ese nombre.
      { label: 'Bloque 1', sessions: [{ label: 'Sesión B', prescriptions: [] }, { label: 'Piernas de Diego', prescriptions: [] }] },
    ],
  } as unknown as EstructuraDePlanDeEntrenamientoEntrada;
  const items = loQueViajaALaPlantilla(e);
  assert.deepEqual(
    items.map((x) => x.generico),
    ['Fase 2', 'Sesión A'],
  );
  const limpia = items.reduce((x, i) => vaciarLoQueViaja(x, i), e);
  assert.deepEqual(limpia.blocks[1]!.sessions!.map((s) => s.label), ['Sesión B', 'Sesión A']);
  // En Nutrición, igual: «Opción 2» ya está, la opción 2 con nombre propio pasa a «Opción 1».
  const nut = {
    dayTypes: [{ label: 'Día tipo 1', meals: [{ label: 'Cena', prescriptionMode: 'OPTIONS', options: [{ label: 'Opción 2', items: [] }, { label: 'La de Ana', items: [] }] }] }],
  } as unknown as EstructuraDePlanEntrada;
  assert.deepEqual(
    loQueViajaALaPlantillaNutricional(nut).map((x) => x.generico),
    ['Opción 1'],
  );
});
