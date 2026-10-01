/**
 * DL-111 · las fórmulas del catálogo de BE (`formulas-antropometricas.ts`) sobre una toma sintética completa.
 *
 * Los valores esperados se calcularon aparte, escribiendo cada ecuación de nuevo a partir de su fuente (ficha:
 * `docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md`), sin usar este módulo: si una regla toma otra medición o equivoca
 * un coeficiente, la prueba lo dice. Los casos publicados por las propias fuentes van en el bloque final.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ejecutar, REGLAS_CONOCIDAS, type EspecificacionDeMetodo } from './calculo';
import { REGLAS_ANTROPOMETRICAS, type ValoresDeEntrada } from './formulas-antropometricas';

/** Una toma sintética de un adulto de 25 años, en las unidades del catálogo: kg, cm, mm y años. */
const TOMA: ValoresDeEntrada = {
  peso: 80,
  talla: 175,
  edad: 25,
  'pliegue-triceps': 10,
  'pliegue-subescapular': 12,
  'pliegue-biceps': 4,
  'pliegue-cresta-iliaca': 14,
  'pliegue-supraespinal': 8,
  'pliegue-abdominal': 15,
  'pliegue-muslo-frontal': 14,
  'pliegue-pantorrilla': 7,
  'pliegue-pectoral': 9,
  'pliegue-axilar-media': 11,
  'perimetro-cuello': 38,
  'perimetro-abdomen': 86,
  'perimetro-cintura': 84,
  'perimetro-cadera': 98,
  'perimetro-brazo-relajado': 32,
  'perimetro-brazo-flexionado': 34,
  'perimetro-muslo': 56,
  'perimetro-pantorrilla': 37,
  'diametro-humero': 7,
  'diametro-biestiloideo': 5.8,
  'diametro-femur': 9.8,
};

const regla = (id: string, valores: ValoresDeEntrada = TOMA) => {
  const r = REGLAS_ANTROPOMETRICAS[id];
  assert.ok(r, `falta la regla ${id}`);
  return r(valores);
};
const cerca = (id: string, esperado: number, valores: ValoresDeEntrada = TOMA) => {
  const obtenido = regla(id, valores);
  assert.equal(typeof obtenido, 'number', `${id}: ${JSON.stringify(obtenido)}`);
  assert.ok(Math.abs((obtenido as number) - esperado) < 1e-9, `${id}: ${obtenido as number} ≠ ${esperado}`);
};
const falla = (id: string, valores: ValoresDeEntrada, contiene: string) => {
  const r = regla(id, valores);
  assert.equal(typeof r, 'object', `${id} tenía que fallar`);
  assert.match((r as { error: string }).error, new RegExp(contiene));
};

test('todas las reglas del catálogo de BE están registradas en el cálculo', () => {
  for (const id of Object.keys(REGLAS_ANTROPOMETRICAS)) assert.ok(REGLAS_CONOCIDAS.includes(id), id);
  assert.equal(Object.keys(REGLAS_ANTROPOMETRICAS).length, 29);
});

test('índices: IMC, cintura/cadera y cintura/talla', () => {
  cerca('be/imc@1', 26.122448979591837);
  cerca('be/indice-cintura-cadera@1', 0.8571428571428571);
  cerca('be/indice-cintura-talla@1', 0.48);
});

test('sumas de pliegues: ISAK 6 y 8, Jackson y Pollock 7', () => {
  cerca('be/suma-6-pliegues-isak@1', 66);
  cerca('be/suma-8-pliegues-isak@1', 84);
  cerca('be/suma-7-pliegues-jackson-pollock@1', 79);
});

test('porcentaje de grasa: Durnin y Womersley por franja de edad, con Siri', () => {
  cerca('be/grasa-durnin-womersley-hombres@1', 16.167621838008756);
  cerca('be/grasa-durnin-womersley-mujeres@1', 23.66957045520843);
  cerca('be/grasa-durnin-womersley-hombres@1', 22.915089177676236, { ...TOMA, edad: 55 });
  // Fuera de las franjas de la ecuación no hay coeficientes: no se extrapola.
  falla('be/grasa-durnin-womersley-hombres@1', { ...TOMA, edad: 16 }, 'no tiene coeficientes para 16 años');
  cerca('be/grasa-durnin-womersley-mujeres@1', 23.66957045520843 + 0, { ...TOMA, edad: 25 });
  assert.equal(typeof regla('be/grasa-durnin-womersley-mujeres@1', { ...TOMA, edad: 16 }), 'number');
});

test('porcentaje de grasa: Jackson y Pollock (7 y 3 pliegues), Faulkner, Navy y Deurenberg', () => {
  cerca('be/grasa-jackson-pollock-7-hombres@1', 10.953152036764607);
  cerca('be/grasa-jackson-pollock-7-mujeres@1', 16.90146370967807);
  cerca('be/grasa-jackson-pollock-3-hombres@1', 10.962183593694647);
  cerca('be/grasa-jackson-pollock-3-mujeres@1', 14.093898852844234);
  cerca('be/grasa-faulkner@1', 12.668);
  cerca('be/grasa-navy-hombres@1', 17.707592296405437);
  cerca('be/grasa-navy-mujeres@1', 27.80466904126638);
  cerca('be/grasa-deurenberg-hombres@1', 20.896938775510204);
  cerca('be/grasa-deurenberg-mujeres@1', 31.696938775510205);
  falla('be/grasa-navy-hombres@1', { ...TOMA, 'perimetro-abdomen': 38 }, 'abdomen tiene que ser mayor');
});

test('masas: grasa y libre de grasa (Faulkner), ósea (Rocha), residual (Würch), muscular en cuatro componentes y esquelética (Lee)', () => {
  cerca('be/masa-grasa-faulkner@1', 10.1344);
  cerca('be/masa-libre-de-grasa-faulkner@1', 69.8656);
  cerca('be/masa-osea-rocha@1', 12.024680211496197);
  cerca('be/masa-residual-wurch-hombres@1', 19.28);
  cerca('be/masa-residual-wurch-mujeres@1', 16.72);
  cerca('be/masa-muscular-4c-hombres@1', 38.5609197885038);
  cerca('be/masa-muscular-4c-mujeres@1', 41.120919788503805);
  cerca('be/masa-muscular-esqueletica-lee-hombres@1', 33.29045632530724);
  cerca('be/masa-muscular-esqueletica-lee-mujeres@1', 30.890456325307245);
});

test('somatotipo de Heath y Carter: endomorfia, mesomorfia y ectomorfia en sus tres tramos', () => {
  cerca('be/somatotipo-endomorfia@1', 2.970916007759795);
  cerca('be/somatotipo-mesomorfia@1', 5.5191);
  // 175 / ∛80 = 40,61: tramo del medio.
  cerca('be/somatotipo-ectomorfia@1', 1.1742367621737735);
  // ≥ 40,75: 0,732 · IPR − 28,58. Con 190 cm y 70 kg, IPR = 46,15.
  const alto = { ...TOMA, talla: 190, peso: 70 };
  cerca('be/somatotipo-ectomorfia@1', 0.732 * (190 / Math.cbrt(70)) - 28.58, alto);
  // ≤ 38,25: el valor mínimo de la escala, 0,1.
  cerca('be/somatotipo-ectomorfia@1', 0.1, { ...TOMA, talla: 160, peso: 90 });
});

test('una medición en cero o negativa no se calcula: se dice cuál', () => {
  falla('be/imc@1', { ...TOMA, talla: 0 }, 'talla');
  falla('be/suma-6-pliegues-isak@1', { ...TOMA, 'pliegue-abdominal': 0 }, 'pliegue-abdominal');
  falla('be/masa-osea-rocha@1', { ...TOMA, 'diametro-femur': -1 }, 'diametro-femur');
});

test('ejecutar aplica la precisión que declara el método, sobre la regla del catálogo', () => {
  const metodo: EspecificacionDeMetodo = {
    finalidades: ['SOPORTE_ANTROPOMETRICO'],
    entradas: [
      { codigo: 'PESO', metrica: 'peso', unidadesAdmitidas: ['kg'], procedenciasAdmitidas: ['CAPTURA_DIRECTA'] },
      { codigo: 'TALLA', metrica: 'talla', unidadesAdmitidas: ['cm'], procedenciasAdmitidas: ['CAPTURA_DIRECTA'] },
    ],
    salida: { metrica: 'imc', unidad: 'kg/m²' },
    precision: { decimales: 1, modo: 'MEDIO_ARRIBA' },
    regla: 'be/imc@1',
  };
  const r = ejecutar(metodo, [
    { medicionId: 'm-peso', metrica: 'peso', magnitud: { valor: 80, unidad: 'kg' } },
    { medicionId: 'm-talla', metrica: 'talla', magnitud: { valor: 175, unidad: 'cm' } },
  ]);
  assert.deepEqual(r, { ok: true, magnitud: { valor: 26.1, unidad: 'kg/m²' }, precision: { decimales: 1, modo: 'MEDIO_ARRIBA' }, regla: 'be/imc@1' });
});
