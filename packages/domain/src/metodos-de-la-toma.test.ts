/**
 * RP-18 (DL-190) · elegir el método antes de medir (`metodos-de-la-toma.ts`): las familias por sexo juntas, lo que pide la
 * elección (la unión, más peso, talla y edad), lo medido que no se esconde, las mediciones de Kerr que el protocolo no
 * declara y la variante para calcular con el sexo de la figura.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { MetodoApi } from './contratos-calculo';
import type { MetricaDelProtocolo } from './figura-antropometrica';
import {
  CONJUNTOS_DE_METODOS,
  MEDICIONES_DE_BASE,
  NOTA_DEL_SITIO,
  familiasDeMetodos,
  familiasHabituales,
  leerEleccion,
  medicionesDeLaEleccion,
  metricasDeLaToma,
  otrasMediciones,
  sexoDelMetodo,
  varianteParaCalcular,
} from './metodos-de-la-toma';
import { MEDICIONES_COMPLEMENTARIAS, NOMBRE_DE_METRICA, UNIDAD_DE_METRICA } from './nombres-de-metricas';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';

const metodo = (key: string, salida: string, entradas: readonly string[], cambios: Partial<MetodoApi> = {}): MetodoApi =>
  ({
    methodId: `id-${key}`,
    methodVersionId: `v-${key}`,
    key,
    name: key,
    version: '1',
    purposes: ['ANTHROPOMETRIC_SUPPORT'],
    status: 'SELECTABLE',
    requiredInputs: entradas.map((metric) => ({ inputCode: metric.toUpperCase(), metric, acceptedUnits: [UNIDAD_DE_METRICA[metric] ?? 'cm'], acceptedProvenances: ['DIRECT_CAPTURE'] })),
    output: { metric: salida, unit: 'kg' },
    precisionPolicy: { decimals: 1, rounding: 'HALF_UP' },
    ruleId: `be/${key}@1`,
    provenanceNote: '',
    description: null,
    source: null,
    population: null,
    category: 'MASAS',
    supersededByVersionId: null,
    effectiveSince: '2026-10-01T00:00:00.000Z',
    ...cambios,
  }) as MetodoApi;

const JP7 = ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-abdominal', 'pliegue-cresta-iliaca', 'pliegue-muslo-frontal', 'edad'];
const METODOS = [
  metodo('MET-GRASA-JP7-H', 'grasa-jackson-pollock-7', JP7, { category: 'GRASA_CORPORAL' }),
  metodo('MET-GRASA-JP7-M', 'grasa-jackson-pollock-7', JP7, { category: 'GRASA_CORPORAL' }),
  metodo('MET-IMC', 'imc', ['peso', 'talla'], { category: 'INDICES' }),
  metodo('MET-KERR-OSEA', 'masa-osea-kerr', ['talla', 'perimetro-cabeza', 'diametro-biacromial', 'diametro-biiliocrestal', 'diametro-humero', 'diametro-femur']),
  metodo('MET-KERR-PIEL-H', 'masa-piel-kerr', ['peso', 'talla', 'edad']),
  metodo('MET-KERR-PIEL-M', 'masa-piel-kerr', ['peso', 'talla', 'edad']),
  metodo('MET-VIEJO', 'grasa-faulkner', ['pliegue-triceps'], { status: 'HISTORICAL_NOT_SELECTABLE' }),
];

test('las variantes por sexo son una familia; lo histórico no se ofrece; el orden es por categoría y nombre, nunca por «mejor»', () => {
  const familias = familiasDeMetodos(METODOS);
  assert.deepEqual(familias.map((f) => f.clave), ['imc', 'grasa-jackson-pollock-7', 'masa-piel-kerr', 'masa-osea-kerr']);
  const jp = familias.find((f) => f.clave === 'grasa-jackson-pollock-7')!;
  assert.equal(jp.porSexo, true);
  assert.deepEqual(jp.variantes.map((v) => v.sexo), ['HOMBRE', 'MUJER']);
  assert.equal(jp.nombre, NOMBRE_DE_METRICA['grasa-jackson-pollock-7']);
  assert.equal(familias.find((f) => f.clave === 'imc')!.porSexo, false);
  assert.equal(sexoDelMetodo({ key: 'MET-KERR-ADIPOSA' }), null);
});

test('la elección pide la unión de lo que piden sus métodos, más peso, talla y edad, en el orden del catálogo', () => {
  const familias = familiasDeMetodos(METODOS);
  const soloJP = medicionesDeLaEleccion(familias, new Set(['grasa-jackson-pollock-7']));
  assert.deepEqual(soloJP.slice(0, 3), [...MEDICIONES_DE_BASE]);
  assert.deepEqual(new Set(soloJP), new Set([...MEDICIONES_DE_BASE, ...JP7]));
  // Nada de lo que no pide: ni perímetros ni diámetros.
  assert.ok(!soloJP.some((c) => c.startsWith('perimetro-') || c.startsWith('diametro-')));
  // Dos métodos: la unión, sin repetir.
  const conKerr = medicionesDeLaEleccion(familias, new Set(['grasa-jackson-pollock-7', 'masa-osea-kerr']));
  assert.equal(conKerr.length, new Set(conKerr).size);
  assert.ok(conKerr.includes('perimetro-cabeza') && conKerr.includes('pliegue-pectoral'));
  // Los puntos sueltos y lo que ya tiene dato van, aunque ningún método lo pida.
  const conSueltos = medicionesDeLaEleccion(familias, new Set(['imc']), { sueltas: ['perimetro-cintura'], conDato: ['pliegue-biceps', 'perimetro-cintura'] });
  assert.deepEqual(conSueltos, ['peso', 'talla', 'edad', 'perimetro-cintura', 'pliegue-biceps']);
});

test('una medición de Kerr que el protocolo no declara se arma con el catálogo de BE; una clave desconocida no se inventa', () => {
  const protocolo: MetricaDelProtocolo[] = [
    { clave: 'peso', nombre: 'Peso', familia: 'MASA_Y_ESTATURA', unidades: ['kg'] },
    { clave: 'talla', nombre: 'Talla', familia: 'MASA_Y_ESTATURA', unidades: ['cm'] },
  ];
  const metricas = metricasDeLaToma(protocolo, ['peso', 'talla-sentado', 'perimetro-cabeza', 'algo-que-no-existe']);
  assert.deepEqual(
    metricas.map((m) => [m.clave, m.familia, m.unidades.join()]),
    [
      ['peso', 'MASA_Y_ESTATURA', 'kg'],
      ['talla-sentado', 'MASA_Y_ESTATURA', 'cm'],
      ['perimetro-cabeza', 'PERIMETROS', 'cm'],
    ],
  );
  assert.equal(metricas[2]!.nombre, 'Perímetro de la cabeza');
  assert.deepEqual([...MEDICIONES_COMPLEMENTARIAS].sort(), ['diametro-biacromial', 'diametro-biiliocrestal', 'diametro-torax-anteroposterior', 'diametro-torax-transverso', 'perimetro-cabeza', 'perimetro-muslo-gluteo', 'talla-sentado']);
  // «+ Otra medición» ofrece lo que falta, primero lo del protocolo.
  const otras = otrasMediciones(protocolo, ['peso']);
  assert.equal(otras[0]!.clave, 'talla');
  assert.ok(otras.some((m) => m.clave === 'perimetro-cabeza'));
  assert.ok(!otras.some((m) => m.clave === 'peso'));
});

test('una clave de la dirección con el nombre de una propiedad de los objetos (`__proto__`, `constructor`) no arma un campo', () => {
  // `?sueltas=__proto__` llegaba como una medición con familia, nombre y unidad que eran objetos o funciones: la figura le
  // buscaba un sitio (`clave in sitios`) y la pantalla de la toma se caía al dibujar su nombre.
  const raras = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf'];
  assert.deepEqual(metricasDeLaToma([], raras), []);
  const claves = medicionesDeLaEleccion(familiasDeMetodos(METODOS), new Set(['imc']), { sueltas: raras });
  assert.deepEqual(metricasDeLaToma([], claves).map((m) => m.clave), ['peso', 'talla', 'edad']);
  assert.ok(otrasMediciones([], ['peso']).every((m) => typeof m.familia === 'string' && typeof m.nombre === 'string'));
});

test('viene elegido lo que el profesional usó en su última toma, por método y no por versión', () => {
  const familias = familiasDeMetodos(METODOS);
  assert.deepEqual(familiasHabituales(familias, ['id-MET-GRASA-JP7-H', 'id-que-ya-no-existe']), ['grasa-jackson-pollock-7']);
  assert.deepEqual(familiasHabituales(familias, []), []);
});

test('la variante para calcular sale del sexo de la figura; si la ecuación no es por sexo, la única', () => {
  const familias = familiasDeMetodos(METODOS);
  const jp = familias.find((f) => f.clave === 'grasa-jackson-pollock-7')!;
  assert.equal(varianteParaCalcular(jp, 'MUJER')!.key, 'MET-GRASA-JP7-M');
  assert.equal(varianteParaCalcular(jp, 'HOMBRE')!.key, 'MET-GRASA-JP7-H');
  assert.equal(varianteParaCalcular(familias.find((f) => f.clave === 'imc')!, 'MUJER')!.key, 'MET-IMC');
});

test('la elección en la dirección: solo familias que existen, sin repetir', () => {
  const familias = familiasDeMetodos(METODOS);
  assert.deepEqual(leerEleccion('imc,imc, masa-osea-kerr,otra', familias), ['imc', 'masa-osea-kerr']);
  assert.deepEqual(leerEleccion(null, familias), []);
});

test('el conjunto de Kerr son sus cinco masas; las notas de sitio no califican', () => {
  const kerr = CONJUNTOS_DE_METODOS.find((c) => c.clave === 'kerr-cinco-componentes')!;
  assert.deepEqual(kerr.familias, ['masa-piel-kerr', 'masa-adiposa-kerr', 'masa-muscular-kerr', 'masa-osea-kerr', 'masa-residual-kerr']);
  for (const f of kerr.familias) assert.ok(NOMBRE_DE_METRICA[f], f);
  for (const texto of Object.values(NOTA_DEL_SITIO)) assert.deepEqual(terminosProhibidosDeAntropometriaEn(texto), []);
  assert.match(NOTA_DEL_SITIO['grasa-jackson-pollock-7']!, /cresta ilíaca/);
});
