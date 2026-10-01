/**
 * DL-111 · las fórmulas del catálogo de BE (`formulas-antropometricas.ts`) contra los casos de la ficha de investigación
 * (`docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md`): sus seis personas de prueba (§1) y, para cada método, el valor
 * esperado con la precisión que declara. La ficha los calculó con la cuenta a la vista y los verificó con una segunda
 * implementación escrita aparte; ninguno cae en el borde de un redondeo. Al final, los ejemplos resueltos de las propias
 * fuentes (tabla 9 de Durnin y Womersley; sujeto 573 del manual de Heath y Carter).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarPrecision } from './antropometria';
import { ejecutar, REGLAS_CONOCIDAS, type EspecificacionDeMetodo } from './calculo';
import { REGLAS_ANTROPOMETRICAS, type ValoresDeEntrada } from './formulas-antropometricas';

type Persona = 'H1' | 'H2' | 'H3' | 'M1' | 'M2' | 'M3';

/** Las personas de prueba de la ficha (§1), en las unidades del catálogo: kg, cm, mm y años. */
const COLUMNAS: Record<string, [number, number, number, number, number, number]> = {
  edad: [22, 35, 55, 19, 34, 47],
  peso: [72, 88, 92, 55, 64, 78],
  talla: [176, 178, 172, 162, 166, 160],
  'pliegue-pectoral': [6, 12, 20, 7, 10, 16],
  'pliegue-axilar-media': [7.5, 15, 24, 8, 12, 20],
  'pliegue-triceps': [8, 12, 16, 15, 19, 26],
  'pliegue-subescapular': [10, 16, 24, 10, 14, 24],
  'pliegue-biceps': [4, 6, 9, 6, 8, 13],
  'pliegue-cresta-iliaca': [12, 22, 30, 14, 20, 28],
  'pliegue-supraespinal': [7, 14, 20, 10, 14, 20],
  'pliegue-abdominal': [14.5, 26, 34, 15, 22, 32],
  'pliegue-muslo-frontal': [11, 16, 18, 22, 27, 34],
  'pliegue-pantorrilla': [6.5, 10, 12, 14, 17, 22],
  'perimetro-cuello': [37, 40, 42, 31, 33, 35.5],
  'perimetro-brazo-relajado': [30, 33, 33, 25.5, 28, 32],
  'perimetro-brazo-flexionado': [33.5, 35.5, 34.5, 26.5, 29, 32.5],
  'perimetro-antebrazo': [27, 29, 28, 22.5, 24, 26],
  'perimetro-pecho': [95, 104, 108, 84, 90, 100],
  'perimetro-cintura': [78, 92, 102, 66, 74, 88],
  'perimetro-abdomen': [80, 95, 106, 72, 82, 96],
  'perimetro-cadera': [94, 102, 106, 92, 100, 110],
  'perimetro-muslo': [53, 57, 55, 52, 56, 60],
  'perimetro-pantorrilla': [37, 39, 38, 34, 36, 38],
  'diametro-humero': [7, 7.2, 7.3, 5.9, 6.1, 6.3],
  'diametro-biestiloideo': [5.7, 5.9, 6, 4.9, 5, 5.2],
  'diametro-femur': [9.6, 9.9, 10, 8.6, 8.9, 9.2],
};
const ORDEN: readonly Persona[] = ['H1', 'H2', 'H3', 'M1', 'M2', 'M3'];
const persona = (p: Persona, cambios: ValoresDeEntrada = {}): ValoresDeEntrada => ({
  ...Object.fromEntries(Object.entries(COLUMNAS).map(([clave, valores]) => [clave, valores[ORDEN.indexOf(p)]!])),
  ...cambios,
});

const crudo = (id: string, valores: ValoresDeEntrada): number | { error: string } => {
  const regla = REGLAS_ANTROPOMETRICAS[id];
  assert.ok(regla, `falta la regla ${id}`);
  return regla(valores);
};
/** El resultado con la precisión declarada (MEDIO_ARRIBA, como `aplicarPrecision`), igual al de la ficha. */
const da = (id: string, decimales: number, casos: readonly [Persona | ValoresDeEntrada, number][]) => {
  for (const [quien, esperado] of casos) {
    const r = crudo(id, typeof quien === 'string' ? persona(quien) : quien);
    assert.equal(typeof r, 'number', `${id} · ${JSON.stringify(quien).slice(0, 40)}: ${JSON.stringify(r)}`);
    assert.equal(aplicarPrecision(r as number, { decimales, modo: 'MEDIO_ARRIBA' }), esperado, `${id} · ${typeof quien === 'string' ? quien : 'caso'}`);
  }
};
const falla = (id: string, valores: ValoresDeEntrada, contiene: string) => {
  const r = crudo(id, valores);
  assert.equal(typeof r, 'object', `${id} tenía que fallar y dio ${String(r)}`);
  assert.match((r as { error: string }).error, new RegExp(contiene));
};

test('las 40 reglas del catálogo de BE están registradas en el cálculo', () => {
  for (const id of Object.keys(REGLAS_ANTROPOMETRICAS)) assert.ok(REGLAS_CONOCIDAS.includes(id), id);
  assert.equal(Object.keys(REGLAS_ANTROPOMETRICAS).length, 40);
});

test('índices (MA-01 a MA-04): IMC, cintura/cadera, cintura/talla y conicidad', () => {
  da('be/imc@1', 1, [['H1', 23.2], ['M2', 23.2], ['H3', 31.1]]);
  da('be/indice-cintura-cadera@1', 2, [['H2', 0.9], ['M1', 0.72], ['M3', 0.8]]);
  da('be/indice-cintura-talla@1', 2, [['H1', 0.44], ['M2', 0.45], ['H3', 0.59]]);
  da('be/indice-conicidad@1', 2, [['H2', 1.2], ['M1', 1.04], ['M3', 1.16]]);
});

test('sumas de pliegues (MA-10 a MA-12): ISAK 6 y 8, Jackson y Pollock 7 con la cresta ilíaca', () => {
  da('be/suma-6-pliegues-isak@1', 1, [['H1', 57], ['M2', 113], ['H3', 124]]);
  da('be/suma-8-pliegues-isak@1', 1, [['H2', 122], ['M1', 106], ['M3', 199]]);
  da('be/suma-7-pliegues-jackson-pollock@1', 1, [['H1', 69], ['M2', 124], ['H3', 166]]);
});

test('grasa por densidad de Jackson y Pollock y de Jackson, Pollock y Ward, con Siri y con Brozek (MA-19 a MA-26)', () => {
  da('be/grasa-jackson-pollock-7-hombres@1', 1, [['H1', 9.1], ['H2', 17.9], ['H3', 26.4]]);
  da('be/grasa-jackson-pollock-7-brozek-hombres@1', 1, [['H1', 9.6], ['H2', 17.8], ['H3', 25.6]]);
  da('be/grasa-jackson-pollock-3-hombres@1', 1, [['H1', 8.6], ['H2', 16.8], ['H3', 24.1]]);
  da('be/grasa-jackson-pollock-3-brozek-hombres@1', 1, [['H1', 9.2], ['H2', 16.8], ['H3', 23.5]]);
  da('be/grasa-jackson-pollock-7-mujeres@1', 1, [['M1', 18.5], ['M2', 24.6], ['M3', 33.1]]);
  da('be/grasa-jackson-pollock-7-brozek-mujeres@1', 1, [['M1', 18.4], ['M2', 24], ['M3', 31.8]]);
  da('be/grasa-jackson-pollock-3-mujeres@1', 1, [['M1', 20.4], ['M2', 26.3], ['M3', 33.7]]);
  da('be/grasa-jackson-pollock-3-brozek-mujeres@1', 1, [['M1', 20.1], ['M2', 25.5], ['M3', 32.4]]);
});

test('grasa por densidad de Durnin y Womersley, por franja de edad, con Siri y con Brozek (MA-27 a MA-30)', () => {
  da('be/grasa-durnin-womersley-hombres@1', 1, [
    ['H1', 14.2],
    ['H2', 22.7],
    ['H3', 33.6],
    [persona('H2', { edad: 18 }), 20.6],
    [persona('H3', { edad: 45 }), 31],
    // Borde: 20 años ya es la franja de 20 a 29.
    [persona('H1', { edad: 20 }), 14.2],
  ]);
  da('be/grasa-durnin-womersley-brozek-hombres@1', 1, [['H1', 14.4], ['H2', 22.2], ['H3', 32.2]]);
  da('be/grasa-durnin-womersley-mujeres@1', 1, [['M1', 24.7], ['M2', 30.8], ['M3', 38.5], [persona('M2', { edad: 25 }), 29.7], [persona('M3', { edad: 55 }), 41.3]]);
  da('be/grasa-durnin-womersley-brozek-mujeres@1', 1, [['M1', 24], ['M2', 29.7], ['M3', 36.8]]);
  // Debajo de la primera franja no hay coeficientes: no se extrapola.
  falla('be/grasa-durnin-womersley-hombres@1', persona('H1', { edad: 16 }), 'no tiene coeficientes para 16 años');
  falla('be/grasa-durnin-womersley-mujeres@1', persona('M1', { edad: 15 }), 'no tiene coeficientes para 15 años');
});

test('grasa directa: Faulkner, Yuhasz-Carter, RFM, BAI y Deurenberg (MA-05 a MA-09, MA-31 a MA-33)', () => {
  da('be/grasa-faulkner@1', 1, [['H1', 11.8], ['H2', 16.2], ['H3', 20.2]]);
  da('be/grasa-yuhasz-carter-hombres@1', 1, [['H1', 8.6], ['H2', 12.5], ['H3', 15.6]]);
  da('be/grasa-yuhasz-carter-mujeres@1', 1, [['M1', 16.9], ['M2', 21.1], ['M3', 28]]);
  da('be/grasa-rfm-hombres@1', 1, [['H1', 18.9], ['H2', 25.3], ['H3', 30.3]]);
  da('be/grasa-rfm-mujeres@1', 1, [['M1', 26.9], ['M2', 31.1], ['M3', 39.6]]);
  da('be/grasa-bai@1', 1, [['H1', 22.3], ['M2', 28.8], ['M3', 36.4]]);
  da('be/grasa-deurenberg-hombres@1', 1, [['H1', 16.8], ['H2', 25.2], ['H3', 33.8]]);
  da('be/grasa-deurenberg-mujeres@1', 1, [['M1', 24.1], ['M2', 30.3], ['M3', 42]]);
});

test('masas (MA-39 a MA-42, MA-50 a MA-53): Lee, Rocha, Würch, Faulkner y cuatro componentes', () => {
  da('be/masa-muscular-esqueletica-lee-peso-hombres@1', 1, [['H1', 32.4], ['H2', 35.2], ['H3', 33.8]]);
  da('be/masa-muscular-esqueletica-lee-peso-mujeres@1', 1, [['M1', 20.9], ['M2', 21.9], ['M3', 23.6]]);
  da('be/masa-osea-rocha@1', 1, [['H1', 11.8], ['M2', 9.4], ['H3', 12.2]]);
  da('be/masa-residual-wurch-hombres@1', 1, [['H1', 17.4], ['H2', 21.2], ['H3', 22.2]]);
  da('be/masa-residual-wurch-mujeres@1', 1, [['M1', 11.5], ['M2', 13.4], ['M3', 16.3]]);
  da('be/masa-muscular-4c-hombres@1', 1, [['H1', 34.3], ['H2', 40], ['H3', 39.1]]);
  // Masa grasa y libre de grasa de Faulkner: el peso por el porcentaje (MA-31), sin redondear en el medio.
  da('be/masa-grasa-faulkner@1', 1, [['H1', 8.5], ['H2', 14.2], ['H3', 18.6]]);
  da('be/masa-libre-de-grasa-faulkner@1', 1, [['H1', 63.5], ['H2', 73.8], ['H3', 73.4]]);
});

test('Lee, modelo con perímetros (MA-39 y MA-40): los perímetros se corrigen con π y el pliegue en cm', () => {
  // La ficha muestra la cuenta de cada caso; acá se repite, a la vista, para H1 y M1.
  const h1 = 1.76 * (0.00744 * (30 - Math.PI * 0.8) ** 2 + 0.00088 * (53 - Math.PI * 1.1) ** 2 + 0.00441 * (37 - Math.PI * 0.65) ** 2) + 2.4 - 0.048 * 22 + 7.8;
  const m1 = 1.62 * (0.00744 * (25.5 - Math.PI * 1.5) ** 2 + 0.00088 * (52 - Math.PI * 2.2) ** 2 + 0.00441 * (34 - Math.PI * 1.4) ** 2) - 0.048 * 19 + 7.8;
  assert.ok(Math.abs((crudo('be/masa-muscular-esqueletica-lee-hombres@1', persona('H1')) as number) - h1) < 1e-9);
  assert.ok(Math.abs((crudo('be/masa-muscular-esqueletica-lee-mujeres@1', persona('M1')) as number) - m1) < 1e-9);
  // Los valores intermedios de la ficha: 1,76 × 13,170428 = 23,179953 (H1) y 1,62 × 8,868352 = 14,36673 (M1).
  assert.equal(aplicarPrecision(h1 - 2.4 + 0.048 * 22 - 7.8, { decimales: 6, modo: 'MEDIO_ARRIBA' }), 23.179953);
  assert.equal(aplicarPrecision(m1 + 0.048 * 19 - 7.8, { decimales: 5, modo: 'MEDIO_ARRIBA' }), 14.36673);
});

test('somatotipo de Heath y Carter (MA-54 a MA-56): tres componentes, el mínimo de 0,1 y el sujeto 573 del manual', () => {
  da('be/somatotipo-endomorfia@1', 1, [['H1', 2.4], ['M2', 4.9], ['H3', 5.8]]);
  da('be/somatotipo-mesomorfia@1', 1, [['H1', 5.2], ['M2', 4], ['H3', 6.4]]);
  da('be/somatotipo-ectomorfia@1', 1, [['H1', 2.4], ['H2', 0.9], ['M3', 0.1]]);
  // Un componente de cero o menos se informa como 0,1 (manual de Carter, 2002).
  da('be/somatotipo-endomorfia@1', 1, [[persona('H1', { 'pliegue-triceps': 2, 'pliegue-subescapular': 2, 'pliegue-supraespinal': 1, talla: 170 }), 0.1]]);
  // El sujeto 573 del manual, que publica 1,6 - 5,4 - 3,2.
  const sujeto573 = persona('H1', {
    'pliegue-triceps': 6.4,
    'pliegue-subescapular': 7.1,
    'pliegue-supraespinal': 4.6,
    talla: 178.3,
    peso: 69.2,
    'diametro-humero': 7.2,
    'diametro-femur': 9.75,
    'perimetro-brazo-flexionado': 33.9,
    'perimetro-pantorrilla': 37.6,
    'pliegue-pantorrilla': 5.2,
  });
  da('be/somatotipo-endomorfia@1', 1, [[sujeto573, 1.6]]);
  da('be/somatotipo-mesomorfia@1', 1, [[sujeto573, 5.4]]);
  da('be/somatotipo-ectomorfia@1', 1, [[sujeto573, 3.2]]);
});

test('ejemplos resueltos de Durnin y Womersley (tabla 9 del original)', () => {
  // Hombres de 35 años: Σ4 = 40 mm → 19,2 %; Σ4 = 100 mm → 29,0 %.
  da('be/grasa-durnin-womersley-hombres@1', 1, [
    [persona('H1', { edad: 35, 'pliegue-biceps': 4, 'pliegue-triceps': 10, 'pliegue-subescapular': 12, 'pliegue-cresta-iliaca': 14 }), 19.2],
    [persona('H1', { edad: 35, 'pliegue-biceps': 10, 'pliegue-triceps': 25, 'pliegue-subescapular': 30, 'pliegue-cresta-iliaca': 35 }), 29],
  ]);
  // Mujeres: 45 años y Σ4 = 60 mm → 33,2 %; 35 años y Σ4 = 40 mm → 25,5 %.
  da('be/grasa-durnin-womersley-mujeres@1', 1, [
    [persona('M1', { edad: 45, 'pliegue-biceps': 8, 'pliegue-triceps': 20, 'pliegue-subescapular': 15, 'pliegue-cresta-iliaca': 17 }), 33.2],
    [persona('M1', { edad: 35, 'pliegue-biceps': 5, 'pliegue-triceps': 13, 'pliegue-subescapular': 10, 'pliegue-cresta-iliaca': 12 }), 25.5],
  ]);
});

test('una medición en cero o un resultado sin sentido físico no se calculan: se dice por qué', () => {
  falla('be/imc@1', persona('H1', { talla: 0 }), 'talla');
  falla('be/suma-6-pliegues-isak@1', persona('H1', { 'pliegue-abdominal': 0 }), 'pliegue-abdominal');
  falla('be/masa-osea-rocha@1', persona('H1', { 'diametro-femur': -1 }), 'diametro-femur');
  // RFM con una cintura muy chica respecto de la talla da un porcentaje negativo: fuera de dominio (D-6).
  falla('be/grasa-rfm-hombres@1', persona('H1', { 'perimetro-cintura': 50 }), 'fuera de su dominio');
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
    { medicionId: 'm-peso', metrica: 'peso', magnitud: { valor: 72, unidad: 'kg' } },
    { medicionId: 'm-talla', metrica: 'talla', magnitud: { valor: 176, unidad: 'cm' } },
  ]);
  assert.deepEqual(r, { ok: true, magnitud: { valor: 23.2, unidad: 'kg/m²' }, precision: { decimales: 1, modo: 'MEDIO_ARRIBA' }, regla: 'be/imc@1' });
});
