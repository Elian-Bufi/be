/**
 * DL-111 · elegir un método para una toma: qué pide, si la toma lo tiene, y la asignación automática de cada dato.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { MetodoApi } from './contratos-calculo';
import type { EvaluacionAntropometricaApi } from './contratos-antropometria';
import { nombreDeMetrica } from './nombres-de-metricas';
import { asignacionAutomatica, datosDelMetodo, metodosParaLaToma } from './seleccion-de-metodo';

type Medicion = EvaluacionAntropometricaApi['measurements'][number];

const medicion = (id: string, metric: string, value: number | null, unit: string, condition: Medicion['condition'] = 'EFFECTIVE'): Medicion =>
  ({ measurementId: id, metric, condition, effectiveMagnitude: value === null ? null : { value, unit } }) as unknown as Medicion;

const metodo = (key: string, entradas: [string, string, string[]][], extra: Partial<MetodoApi> = {}): MetodoApi =>
  ({
    methodVersionId: `${key}-v1`,
    key,
    name: key,
    status: 'SELECTABLE',
    category: null,
    requiredInputs: entradas.map(([inputCode, metric, acceptedUnits]) => ({ inputCode, metric, acceptedUnits, acceptedProvenances: ['DIRECT_CAPTURE'] })),
    ...extra,
  }) as unknown as MetodoApi;

const TOMA = [
  medicion('m-peso', 'peso', 80, 'kg'),
  medicion('m-talla', 'talla', 175, 'cm'),
  medicion('m-cintura-anulada', 'perimetro-cintura', 90, 'cm', 'ANNULLED'),
  medicion('m-cadera', 'perimetro-cadera', null, 'cm'),
];

test('cada dato se asigna a la medición vigente, con valor y en una unidad que el método admite', () => {
  const imc = metodo('imc', [
    ['PESO', 'peso', ['kg']],
    ['TALLA', 'talla', ['cm']],
  ]);
  const datos = datosDelMetodo(imc, TOMA);
  assert.deepEqual(
    datos.map((d) => d.medicion),
    [
      { id: 'm-peso', valor: 80, unidad: 'kg' },
      { id: 'm-talla', valor: 175, unidad: 'cm' },
    ],
  );
  assert.deepEqual(asignacionAutomatica(datos), { PESO: 'm-peso', TALLA: 'm-talla' });
});

test('una medición anulada, sin valor vigente o en otra unidad no cubre el dato: falta', () => {
  const icc = metodo('icc', [
    ['CINTURA', 'perimetro-cintura', ['cm']],
    ['CADERA', 'perimetro-cadera', ['cm']],
  ]);
  const enMetros = metodo('talla-m', [['TALLA', 'talla', ['m']]]);
  assert.deepEqual(
    datosDelMetodo(icc, TOMA).map((d) => d.medicion),
    [null, null],
  );
  assert.equal(datosDelMetodo(enMetros, TOMA)[0]!.medicion, null);
  assert.deepEqual(asignacionAutomatica(datosDelMetodo(icc, TOMA)), {});
  // Y dice por qué: la anulada y la que no tiene valor vigente no son «otra unidad»; la talla en cm sí lo es.
  assert.deepEqual(
    datosDelMetodo(icc, TOMA).map((d) => d.falta),
    [{ motivo: 'SIN_VALOR_VIGENTE' }, { motivo: 'SIN_VALOR_VIGENTE' }],
  );
  assert.deepEqual(datosDelMetodo(enMetros, TOMA)[0]!.falta, { motivo: 'OTRA_UNIDAD', unidad: 'cm' });
  assert.deepEqual(datosDelMetodo(metodo('edad', [['EDAD', 'edad', ['años']]]), TOMA)[0]!.falta, { motivo: 'NO_ESTA' });
  assert.equal(datosDelMetodo(icc, [medicion('m-c', 'perimetro-cintura', 80, 'cm'), medicion('m-k', 'perimetro-cadera', 95, 'cm')])[0]!.falta, null);
});

test('primero los métodos que la toma cubre por completo; adentro por categoría y nombre; los no seleccionables quedan afuera', () => {
  const imc = metodo('IMC', [['PESO', 'peso', ['kg']], ['TALLA', 'talla', ['cm']]], { category: 'INDICES' });
  const peso = metodo('Peso solo', [['PESO', 'peso', ['kg']]], { category: 'INDICES' });
  const icc = metodo('ICC', [['CINTURA', 'perimetro-cintura', ['cm']]], { category: 'INDICES' });
  const viejo = metodo('Viejo', [['PESO', 'peso', ['kg']]], { status: 'HISTORICAL_NOT_SELECTABLE' });
  const { posibles, faltanDatos } = metodosParaLaToma([icc, peso, viejo, imc], TOMA);
  assert.deepEqual(
    posibles.map((m) => m.name),
    ['IMC', 'Peso solo'],
  );
  assert.deepEqual(
    faltanDatos.map((m) => m.name),
    ['ICC'],
  );
});

test('los nombres de las mediciones: el del catálogo, o el código legible; nunca el código crudo', () => {
  assert.equal(nombreDeMetrica('perimetro-cintura'), 'Perímetro de cintura');
  assert.equal(nombreDeMetrica('diametro-femur'), 'Diámetro bicondíleo del fémur (rodilla)');
  assert.equal(nombreDeMetrica('algo-nuevo'), 'Algo nuevo');
});
