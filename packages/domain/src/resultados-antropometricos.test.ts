/**
 * DL-200 · el resultado completo de cada método, encadenado (`resultados-antropometricos.ts`), contra:
 * - los casos de la ficha de métodos (`docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md`): H1 a H3 y M1 a M3, calculados
 *   con la cuenta a la vista y verificados con una segunda implementación (MA-13 densidad, MA-19 a MA-26 Siri y Brožek,
 *   MA-34 y MA-35 masas sobre Jackson y Pollock, MA-50 a MA-53 cuatro componentes);
 * - los ejemplos **publicados** de las fuentes: la tabla 9 de Durnin y Womersley (1974), el sujeto 573 del manual de Heath
 *   y Carter (2002) y el Phantom de Ross y Wilson para Kerr (1988), que con sus medidas da sus masas;
 * - la regla del proyecto: cada paso que tiene método en el catálogo da lo mismo que la regla publicada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarPrecision } from './antropometria';
import { REGLAS_ANTROPOMETRICAS, type ValoresDeEntrada } from './formulas-antropometricas';
import {
  diferenciaDelPaso,
  leerProgramas,
  loQueVaADar,
  medicionesDelPrograma,
  metodosConResultado,
  PROGRAMAS_DE_RESULTADO,
  programasDeLasMetricas,
  pasosDelResultado,
  resultadoDelMetodo,
  textoDeLoQueFalta,
  textoDelPasoDeLaCadena,
  textoDelValorAlLado,
  valoresParaLaCadena,
  type ConversionDeDensidad,
  type PasoDeLaCadena,
  type SexoDeLaCadena,
} from './resultados-antropometricos';

/** Las personas de la ficha (§1), en las unidades del catálogo. */
const H1: ValoresDeEntrada = {
  edad: 22, peso: 72, talla: 176,
  'pliegue-pectoral': 6, 'pliegue-axilar-media': 7.5, 'pliegue-triceps': 8, 'pliegue-subescapular': 10, 'pliegue-biceps': 4, 'pliegue-cresta-iliaca': 12,
  'pliegue-supraespinal': 7, 'pliegue-abdominal': 14.5, 'pliegue-muslo-frontal': 11, 'pliegue-pantorrilla': 6.5,
  'perimetro-brazo-relajado': 30, 'perimetro-brazo-flexionado': 33.5, 'perimetro-antebrazo': 27, 'perimetro-pecho': 95, 'perimetro-cintura': 78, 'perimetro-cadera': 94,
  'perimetro-muslo': 53, 'perimetro-pantorrilla': 37, 'diametro-humero': 7, 'diametro-biestiloideo': 5.7, 'diametro-femur': 9.6,
};
const H2: ValoresDeEntrada = {
  edad: 35, peso: 88, talla: 178,
  'pliegue-pectoral': 12, 'pliegue-axilar-media': 15, 'pliegue-triceps': 12, 'pliegue-subescapular': 16, 'pliegue-biceps': 6, 'pliegue-cresta-iliaca': 22,
  'pliegue-supraespinal': 14, 'pliegue-abdominal': 26, 'pliegue-muslo-frontal': 16, 'pliegue-pantorrilla': 10, 'diametro-biestiloideo': 5.9, 'diametro-femur': 9.9,
};
const H3: ValoresDeEntrada = {
  edad: 55, peso: 92, talla: 172,
  'pliegue-pectoral': 20, 'pliegue-axilar-media': 24, 'pliegue-triceps': 16, 'pliegue-subescapular': 24, 'pliegue-biceps': 9, 'pliegue-cresta-iliaca': 30,
  'pliegue-supraespinal': 20, 'pliegue-abdominal': 34, 'pliegue-muslo-frontal': 18, 'pliegue-pantorrilla': 12, 'diametro-biestiloideo': 6, 'diametro-femur': 10,
};
const M1: ValoresDeEntrada = { edad: 19, peso: 55, talla: 162, 'pliegue-pectoral': 7, 'pliegue-axilar-media': 8, 'pliegue-triceps': 15, 'pliegue-subescapular': 10, 'pliegue-biceps': 6, 'pliegue-cresta-iliaca': 14, 'pliegue-supraespinal': 10, 'pliegue-abdominal': 15, 'pliegue-muslo-frontal': 22, 'pliegue-pantorrilla': 14 };
const M2: ValoresDeEntrada = { edad: 34, peso: 64, talla: 166, 'pliegue-pectoral': 10, 'pliegue-axilar-media': 12, 'pliegue-triceps': 19, 'pliegue-subescapular': 14, 'pliegue-biceps': 8, 'pliegue-cresta-iliaca': 20, 'pliegue-supraespinal': 14, 'pliegue-abdominal': 22, 'pliegue-muslo-frontal': 27, 'pliegue-pantorrilla': 17 };

const resultado = (clave: string, v: ValoresDeEntrada, sexo: SexoDeLaCadena, conversion: ConversionDeDensidad = 'SIRI') => {
  const r = resultadoDelMetodo(clave, v, sexo, conversion);
  assert.ok(r, `falta el método ${clave}`);
  return r;
};
const pasoDe = (clave: string, v: ValoresDeEntrada, sexo: SexoDeLaCadena, que: string, conversion: ConversionDeDensidad = 'SIRI'): PasoDeLaCadena => {
  const p = pasosDelResultado(resultado(clave, v, sexo, conversion)).find((x) => x.clave === que);
  assert.ok(p, `${clave} no tiene el paso ${que}`);
  return p;
};
const valor = (clave: string, v: ValoresDeEntrada, sexo: SexoDeLaCadena, que: string, conversion: ConversionDeDensidad = 'SIRI') => pasoDe(clave, v, sexo, que, conversion).valor;
const reglaRedondeada = (id: string, v: ValoresDeEntrada, decimales = 1) => {
  const r = REGLAS_ANTROPOMETRICAS[id]!(v);
  assert.equal(typeof r, 'number', id);
  return aplicarPrecision(r as number, { decimales, modo: 'MEDIO_ARRIBA' });
};

test('Jackson y Pollock, 7 pliegues: de una vez, la suma, la densidad, el % de grasa con Siri y Brožek y las masas (ficha MA-12, MA-13, MA-19, MA-20, MA-34, MA-35)', () => {
  const r = resultado('jackson-pollock-7', H1, 'HOMBRE');
  // Primero lo medido, después lo inferido con su ecuación: el orden de las etapas.
  assert.deepEqual(r.etapas.map((e) => e.etapa), ['MEDIDO', 'ECUACION', 'CONVERSION', 'MASAS', 'FRACCIONAMIENTO']);
  assert.equal(valor('jackson-pollock-7', H1, 'HOMBRE', 'suma'), 69);
  assert.equal(valor('jackson-pollock-7', H1, 'HOMBRE', 'densidad'), 1.0783);
  assert.equal(valor('jackson-pollock-7', H2, 'HOMBRE', 'densidad'), 1.0579);
  assert.equal(valor('jackson-pollock-7', H3, 'HOMBRE', 'densidad'), 1.0391);
  for (const [v, siri, brozek, mg, mlg] of [
    [H1, 9.1, 9.6, 6.5, 65.5],
    [H2, 17.9, 17.8, 15.7, 72.3],
    [H3, 26.4, 25.6, 24.3, 67.7],
  ] as const) {
    const grasa = pasoDe('jackson-pollock-7', v, 'HOMBRE', 'grasa');
    assert.equal(grasa.valor, siri);
    assert.equal(grasa.base, 'del peso corporal');
    assert.match(grasa.origen, /Siri \(1961\)/);
    // Brožek al lado, con la otra fórmula; y con un toque, la principal.
    assert.equal(grasa.alLado[0]?.nombre, 'Con Brožek');
    assert.equal(grasa.alLado[0]?.valor, brozek);
    assert.equal(valor('jackson-pollock-7', v, 'HOMBRE', 'grasa', 'BROZEK'), brozek);
    assert.equal(valor('jackson-pollock-7', v, 'HOMBRE', 'masa-grasa'), mg);
    assert.equal(valor('jackson-pollock-7', v, 'HOMBRE', 'masa-libre-de-grasa'), mlg);
  }
  // Mujeres: Jackson, Pollock y Ward (1980).
  for (const [v, siri, brozek] of [
    [M1, 18.5, 18.4],
    [M2, 24.6, 24],
  ] as const) {
    assert.equal(valor('jackson-pollock-7', v, 'MUJER', 'grasa'), siri);
    assert.equal(valor('jackson-pollock-7', v, 'MUJER', 'grasa', 'BROZEK'), brozek);
    assert.match(pasoDe('jackson-pollock-7', v, 'MUJER', 'densidad').origen, /Jackson, Pollock y Ward \(1980\), mujeres/);
  }
  // El resumen de arriba: % de grasa, masa grasa, masa libre de grasa y la suma, en ese orden.
  assert.deepEqual(r.resumen.map((p) => p.clave), ['grasa', 'masa-grasa', 'masa-libre-de-grasa', 'suma']);
  assert.deepEqual(r.resumen.map(textoDelPasoDeLaCadena), ['9,1 % del peso corporal', '6,5 kg', '65,5 kg', '69,0 mm']);
  // La cuenta del «?» con los números de esta toma.
  assert.match(pasoDe('jackson-pollock-7', H1, 'HOMBRE', 'suma').cuenta ?? '', /^6 \+ 7,5 \+ 8 \+ 10 \+ 14,5 \+ 12 \+ 11 = 69 mm$/);
  assert.match(pasoDe('jackson-pollock-7', H1, 'HOMBRE', 'densidad').cuenta ?? '', /1,112 − 0,00043499 × 69 \+ 0,00000055 × 69² − 0,00028826 × 22 = 1,078263 g\/cm³/);
});

test('cada paso que tiene método en el catálogo da lo mismo que su regla publicada', () => {
  for (const v of [H1, H2, H3]) {
    assert.equal(valor('jackson-pollock-7', v, 'HOMBRE', 'suma'), reglaRedondeada('be/suma-7-pliegues-jackson-pollock@1', v));
    assert.equal(valor('jackson-pollock-7', v, 'HOMBRE', 'grasa'), reglaRedondeada('be/grasa-jackson-pollock-7-hombres@1', v));
    assert.equal(valor('jackson-pollock-7', v, 'HOMBRE', 'grasa', 'BROZEK'), reglaRedondeada('be/grasa-jackson-pollock-7-brozek-hombres@1', v));
    assert.equal(valor('jackson-pollock-3', v, 'HOMBRE', 'grasa'), reglaRedondeada('be/grasa-jackson-pollock-3-hombres@1', v));
    assert.equal(valor('durnin-womersley', v, 'HOMBRE', 'grasa'), reglaRedondeada('be/grasa-durnin-womersley-hombres@1', v));
    assert.equal(valor('durnin-womersley', v, 'HOMBRE', 'masa-grasa'), reglaRedondeada('be/masa-grasa-durnin-womersley-hombres@1', v));
    assert.equal(valor('durnin-womersley', v, 'HOMBRE', 'masa-libre-de-grasa'), reglaRedondeada('be/masa-libre-de-grasa-durnin-womersley-hombres@1', v));
    assert.equal(valor('faulkner', v, 'HOMBRE', 'masa-grasa'), reglaRedondeada('be/masa-grasa-faulkner@1', v));
    assert.equal(valor('faulkner', v, 'HOMBRE', 'masa-muscular'), reglaRedondeada('be/masa-muscular-4c-hombres@1', v));
    assert.equal(valor('isak-6', v, 'HOMBRE', 'suma'), reglaRedondeada('be/suma-6-pliegues-isak@1', v));
    assert.equal(valor('isak-8', v, 'HOMBRE', 'suma'), reglaRedondeada('be/suma-8-pliegues-isak@1', v));
  }
  // El método del catálogo de cada paso, por sexo (para guardarlo en la historia).
  assert.equal(pasoDe('jackson-pollock-7', M1, 'MUJER', 'grasa').metodoDelCatalogo, 'MET-GRASA-JP7-M');
  assert.equal(pasoDe('jackson-pollock-7', M1, 'MUJER', 'grasa', 'BROZEK').metodoDelCatalogo, 'MET-GRASA-JP7-BROZEK-M');
  assert.equal(pasoDe('jackson-pollock-7', M1, 'MUJER', 'densidad').metodoDelCatalogo, null);
  assert.match(pasoDe('jackson-pollock-7', M1, 'MUJER', 'densidad').regla, /^be\/derivacion\//);
});

test('el fraccionamiento en cuatro componentes con la grasa de Jackson y Pollock, Rocha y Würch, y la muscular por diferencia', () => {
  const r = resultado('jackson-pollock-7', H1, 'HOMBRE');
  const cuatro = r.etapas.find((e) => e.etapa === 'FRACCIONAMIENTO')!;
  assert.deepEqual(cuatro.pasos.map((p) => p.clave), ['fraccion-grasa', 'masa-osea', 'masa-residual', 'masa-muscular']);
  // H1: grasa 6,531752 (MA-34), ósea 11,79896 (MA-50), residual 17,352 (MA-51); muscular = 72 − 35,682712 = 36,317288.
  assert.deepEqual(cuatro.pasos.map((p) => p.valor), [6.5, 11.8, 17.4, 36.3]);
  const suma = cuatro.pasos.reduce((t, p) => t + (p.crudo ?? 0), 0);
  assert.ok(Math.abs(suma - 72) < 1e-9, 'las cuatro masas suman el peso');
  assert.match(cuatro.pasos[3]!.origen, /De Rose y Guimarães, 1980/);
  assert.equal(textoDelValorAlLado(cuatro.pasos[1]!.alLado[0]!), '16,4 % del peso corporal');
  // Con Faulkner es el modelo publicado (MA-53): 34,3 kg en H1, 40,0 en H2 y 39,1 en H3.
  assert.equal(valor('faulkner', H1, 'HOMBRE', 'masa-muscular'), 34.3);
  assert.equal(valor('faulkner', H2, 'HOMBRE', 'masa-muscular'), 40);
  assert.equal(valor('faulkner', H3, 'HOMBRE', 'masa-muscular'), 39.1);
  // Würch por sexo (MA-51 y MA-52).
  assert.equal(valor('wurch', M2, 'MUJER', 'masa-residual'), 13.4);
});

test('lo que falta para un paso se dice en ese paso, con nombre; lo de antes sigue a la vista', () => {
  const sinDiametros: Record<string, number> = { ...H1 };
  delete sinDiametros['diametro-femur'];
  delete sinDiametros['diametro-biestiloideo'];
  const osea = pasoDe('jackson-pollock-7', sinDiametros, 'HOMBRE', 'masa-osea');
  assert.equal(osea.valor, null);
  assert.equal(textoDeLoQueFalta(osea), 'Para la masa ósea (Rocha) faltan el diámetro biestiloideo (muñeca) y el diámetro bicondíleo del fémur (rodilla).');
  // La muscular depende de la ósea: le falta lo mismo.
  assert.deepEqual(pasoDe('jackson-pollock-7', sinDiametros, 'HOMBRE', 'masa-muscular').faltan, ['diametro-biestiloideo', 'diametro-femur']);
  // Lo anterior no se esconde: el % de grasa y las masas siguen.
  assert.equal(valor('jackson-pollock-7', sinDiametros, 'HOMBRE', 'masa-grasa'), 6.5);
  // Sin peso, la densidad y el % de grasa están; las masas dicen que falta el peso.
  const sinPeso: Record<string, number> = { ...H1 };
  delete sinPeso.peso;
  assert.equal(valor('jackson-pollock-7', sinPeso, 'HOMBRE', 'grasa'), 9.1);
  assert.equal(textoDeLoQueFalta(pasoDe('jackson-pollock-7', sinPeso, 'HOMBRE', 'masa-grasa')), 'Para la masa grasa falta el peso.');
  // Sin un pliegue no hay suma, ni densidad, ni lo que sigue; cada paso dice cuál.
  const sinPectoral: Record<string, number> = { ...H1 };
  delete sinPectoral['pliegue-pectoral'];
  assert.equal(textoDeLoQueFalta(pasoDe('jackson-pollock-7', sinPectoral, 'HOMBRE', 'densidad')), 'Para la densidad corporal falta el pliegue pectoral.');
  assert.equal(resultado('jackson-pollock-7', sinPectoral, 'HOMBRE').calculado, false);
  // Sin edad: la suma está, la densidad pide la edad.
  const sinEdad: Record<string, number> = { ...H1 };
  delete sinEdad.edad;
  assert.equal(textoDeLoQueFalta(pasoDe('jackson-pollock-7', sinEdad, 'HOMBRE', 'densidad')), 'Para la densidad corporal falta la edad al momento de la toma.');
  // Un cero no es un dato que falta: se dice por qué no se calcula.
  assert.match(pasoDe('jackson-pollock-7', { ...H1, 'pliegue-pectoral': 0 }, 'HOMBRE', 'suma').motivo ?? '', /El pliegue pectoral tiene que ser mayor que cero/);
  // Faulkner no tiene ecuación de mujeres: se dice, no se calcula con la de hombres.
  assert.match(pasoDe('faulkner', M1, 'MUJER', 'grasa').motivo ?? '', /no tiene ecuación para mujeres/);
});

test('Durnin y Womersley: la densidad por franja de edad y los ejemplos publicados de la tabla 9 del original', () => {
  const caso = (sexo: SexoDeLaCadena, edad: number, b: number, t: number, s: number, c: number) => ({ ...(sexo === 'HOMBRE' ? H1 : M1), edad, 'pliegue-biceps': b, 'pliegue-triceps': t, 'pliegue-subescapular': s, 'pliegue-cresta-iliaca': c });
  // Hombres de 35: Σ4 = 40 mm → 19,2 %; Σ4 = 100 mm → 29,0 %. Mujeres: 45 años y 60 mm → 33,2 %; 35 y 40 mm → 25,5 %.
  assert.equal(valor('durnin-womersley', caso('HOMBRE', 35, 4, 10, 12, 14), 'HOMBRE', 'grasa'), 19.2);
  assert.equal(valor('durnin-womersley', caso('HOMBRE', 35, 10, 25, 30, 35), 'HOMBRE', 'grasa'), 29);
  assert.equal(valor('durnin-womersley', caso('MUJER', 45, 8, 20, 15, 17), 'MUJER', 'grasa'), 33.2);
  assert.equal(valor('durnin-womersley', caso('MUJER', 35, 5, 13, 10, 12), 'MUJER', 'grasa'), 25.5);
  // La densidad del caso A de hombres: 1,1422 − 0,0544 × log10(40) = 1,05504794 → 1,0550.
  const densidad = pasoDe('durnin-womersley', caso('HOMBRE', 35, 4, 10, 12, 14), 'HOMBRE', 'densidad');
  assert.equal(densidad.valor, 1.055);
  assert.match(densidad.origen, /de 30 a 39 años/);
  assert.match(densidad.formula, /c = 1,1422 y m = 0,0544/);
  // Los casos de la ficha (MA-27 a MA-30), con Siri y con Brožek.
  assert.equal(valor('durnin-womersley', H1, 'HOMBRE', 'grasa'), 14.2);
  assert.equal(valor('durnin-womersley', H1, 'HOMBRE', 'grasa', 'BROZEK'), 14.4);
  assert.equal(valor('durnin-womersley', M2, 'MUJER', 'grasa'), 30.8);
  assert.equal(valor('durnin-womersley', M2, 'MUJER', 'grasa', 'BROZEK'), 29.7);
  // Debajo de la primera franja no hay coeficientes: se dice, no se extrapola.
  assert.match(pasoDe('durnin-womersley', { ...H1, edad: 16 }, 'HOMBRE', 'densidad').motivo ?? '', /no tiene coeficientes para 16 años/);
  // Las masas del catálogo de Durnin y Womersley son con Siri: con Brožek, son una derivación sin método del catálogo.
  assert.equal(pasoDe('durnin-womersley', H1, 'HOMBRE', 'masa-grasa').metodoDelCatalogo, 'MET-MASA-GRASA-DW-H');
  assert.equal(pasoDe('durnin-womersley', H1, 'HOMBRE', 'masa-grasa', 'BROZEK').metodoDelCatalogo, null);
});

test('ISAK, Yuhasz-Carter y los de % de grasa directo', () => {
  assert.equal(valor('isak-6', H1, 'HOMBRE', 'suma'), 57);
  assert.equal(valor('isak-8', H2, 'HOMBRE', 'suma'), 122);
  assert.match(resultado('isak-6', H1, 'HOMBRE').etapas[0]!.nota ?? '', /No es una ecuación de predicción/);
  assert.equal(valor('yuhasz-carter', H1, 'HOMBRE', 'grasa'), 8.6);
  assert.equal(valor('yuhasz-carter', M1, 'MUJER', 'grasa'), 16.9);
  assert.equal(valor('faulkner', H1, 'HOMBRE', 'grasa'), 11.8);
  assert.equal(valor('rfm', H1, 'HOMBRE', 'grasa'), 18.9);
  assert.equal(valor('bai', H1, 'HOMBRE', 'grasa'), 22.3);
  assert.equal(valor('deurenberg', H1, 'HOMBRE', 'grasa'), 16.8);
  // Los de % directo no tienen conversión: el método no ofrece Brožek.
  assert.equal(pasoDe('yuhasz-carter', H1, 'HOMBRE', 'grasa').alLado.length, 0);
});

test('Kerr (1988): el Phantom de Ross y Wilson da sus masas, y la suma se compara con el peso', () => {
  const phantom: ValoresDeEntrada = {
    edad: 30, peso: 64.58, talla: 170.18, 'talla-sentado': 89.92,
    'pliegue-triceps': 15.4, 'pliegue-subescapular': 17.2, 'pliegue-supraespinal': 15.4, 'pliegue-abdominal': 25.4, 'pliegue-muslo-frontal': 27, 'pliegue-pantorrilla': 16,
    'perimetro-brazo-relajado': 26.89, 'perimetro-antebrazo': 25.13, 'perimetro-muslo-gluteo': 55.82, 'perimetro-pantorrilla': 35.25, 'perimetro-pecho': 87.86, 'perimetro-cintura': 71.91,
    'perimetro-cabeza': 56, 'diametro-biacromial': 38.04, 'diametro-biiliocrestal': 28.84, 'diametro-humero': 6.48, 'diametro-femur': 9.52,
    'diametro-torax-transverso': 27.92, 'diametro-torax-anteroposterior': 17.5,
  };
  const r = resultado('kerr-5c', phantom, 'HOMBRE');
  const masas = r.etapas[0]!.pasos;
  // Las masas del Phantom: adiposa 25,6, muscular 24,5, residual 6,1 kg; la ósea suma la cabeza (1,2 kg) a 6,7.
  assert.equal(masas.find((p) => p.clave === 'masa-adiposa')?.valor, 25.6);
  assert.equal(masas.find((p) => p.clave === 'masa-muscular')?.valor, 24.5);
  assert.equal(masas.find((p) => p.clave === 'masa-residual')?.valor, 6.1);
  assert.equal(masas.find((p) => p.clave === 'masa-osea')?.valor, 7.9);
  for (const p of masas) assert.equal(p.valor, reglaRedondeada(p.regla, phantom), p.clave);
  // La suma, el peso estructurado, y la diferencia con la balanza en kg y en % del peso medido.
  const estructurado = pasoDe('kerr-5c', phantom, 'HOMBRE', 'peso-estructurado');
  assert.ok(Math.abs((estructurado.crudo ?? 0) - masas.reduce((t, p) => t + (p.crudo ?? 0), 0)) < 1e-9);
  const diferencia = pasoDe('kerr-5c', phantom, 'HOMBRE', 'diferencia');
  assert.ok(Math.abs((diferencia.crudo ?? 0) - ((estructurado.crudo ?? 0) - 64.58)) < 1e-9);
  assert.equal(diferencia.alLado[0]?.base, 'del peso medido');
  // Cada masa también en % del peso estructurado, con su base.
  assert.equal(masas[0]!.alLado[0]?.base, 'del peso estructurado');
  // Sin el muslo de Kerr, la muscular lo dice, y la suma también.
  const sinMuslo: Record<string, number> = { ...phantom };
  delete sinMuslo['perimetro-muslo-gluteo'];
  assert.equal(textoDeLoQueFalta(pasoDe('kerr-5c', sinMuslo, 'HOMBRE', 'masa-muscular')), 'Para la masa muscular falta el perímetro del muslo a 1 cm del pliegue glúteo.');
  assert.deepEqual(pasoDe('kerr-5c', sinMuslo, 'HOMBRE', 'peso-estructurado').faltan, ['perimetro-muslo-gluteo']);
});

test('somatotipo: el sujeto 573 del manual de Carter (1,6 - 5,4 - 3,2) y su punto en la somatocarta', () => {
  const sujeto573: ValoresDeEntrada = { ...H1, 'pliegue-triceps': 6.4, 'pliegue-subescapular': 7.1, 'pliegue-supraespinal': 4.6, talla: 178.3, peso: 69.2, 'diametro-humero': 7.2, 'diametro-femur': 9.75, 'perimetro-brazo-flexionado': 33.9, 'perimetro-pantorrilla': 37.6, 'pliegue-pantorrilla': 5.2 };
  const r = resultado('somatotipo', sujeto573, 'HOMBRE');
  assert.deepEqual(r.resumen.map((p) => p.valor), [1.6, 5.4, 3.2]);
  // X = III − I = 1,6; Y = 2 × II − (I + III) = 6,0.
  assert.equal(valor('somatotipo', sujeto573, 'HOMBRE', 'coordenada-x'), 1.6);
  assert.equal(valor('somatotipo', sujeto573, 'HOMBRE', 'coordenada-y'), 6);
});

test('Lee, Rocha e índices: cada uno con su valor y, las masas, en % del peso corporal', () => {
  assert.equal(valor('rocha', H1, 'HOMBRE', 'masa-osea'), 11.8);
  assert.equal(pasoDe('rocha', H1, 'HOMBRE', 'masa-osea').alLado[0]?.base, 'del peso corporal');
  assert.equal(valor('lee-perimetros', H1, 'HOMBRE', 'masa-muscular-esqueletica'), reglaRedondeada('be/masa-muscular-esqueletica-lee-hombres@1', H1));
  assert.equal(valor('lee-peso', H1, 'HOMBRE', 'masa-muscular-esqueletica'), 32.4);
  assert.equal(valor('imc', H1, 'HOMBRE', 'imc'), 23.2);
  assert.equal(valor('cintura-talla', H1, 'HOMBRE', 'indice-cintura-talla'), 0.44);
});

test('antes de medir: qué pide cada método (JP7 pide sus 7 pliegues, la edad y el peso; con el fraccionamiento, la talla y dos diámetros) y qué va a dar', () => {
  assert.deepEqual(medicionesDelPrograma('jackson-pollock-7', 'HOMBRE'), [
    'pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-abdominal', 'pliegue-cresta-iliaca', 'pliegue-muslo-frontal', 'edad', 'peso',
  ]);
  assert.deepEqual(medicionesDelPrograma('jackson-pollock-7', 'HOMBRE', true).slice(-3), ['talla', 'diametro-biestiloideo', 'diametro-femur']);
  // JP3 pide otros pliegues según el sexo.
  assert.deepEqual(medicionesDelPrograma('jackson-pollock-3', 'MUJER').slice(0, 3), ['pliegue-triceps', 'pliegue-cresta-iliaca', 'pliegue-muslo-frontal']);
  assert.deepEqual(loQueVaADar('jackson-pollock-7', true), ['Suma de pliegues', 'Densidad corporal', '% de grasa (Siri y Brožek)', 'Masa grasa y masa libre de grasa', 'Masas ósea, residual y muscular']);
  // La dirección guarda los métodos; una dirección de DL-190 (familias por métrica) se traduce al método que las da.
  assert.deepEqual(leerProgramas('jackson-pollock-7,fraccionamiento-4c'), { programas: ['jackson-pollock-7'], conFraccionamiento: true });
  assert.deepEqual(leerProgramas('grasa-jackson-pollock-7,suma-7-pliegues-jackson-pollock,masa-osea-kerr,__proto__'), { programas: ['jackson-pollock-7', 'kerr-5c'], conFraccionamiento: false });
  assert.deepEqual(programasDeLasMetricas(['masa-grasa-durnin-womersley']), ['durnin-womersley']);
});

test('la toma: los valores vigentes en la unidad del catálogo, sin convertir en silencio, y los métodos que dan algo', () => {
  const m = (metric: string, value: number, unit: string, condition = 'EFFECTIVE') => ({ metric, condition, effectiveMagnitude: { value, unit } });
  const { valores, enOtraUnidad } = valoresParaLaCadena([m('peso', 72, 'kg'), m('talla', 1.76, 'm'), m('pliegue-pectoral', 6, 'mm', 'ANNULLED'), m('edad', 22, 'años')]);
  assert.deepEqual(valores, { peso: 72, edad: 22 });
  assert.deepEqual(enOtraUnidad, ['talla']);
  // Con los 7 pliegues, el peso, la talla y la edad de H1, dan algo: las sumas, las grasas de pliegues y las de índices.
  const dan = metodosConResultado(H1, 'HOMBRE');
  assert.ok(dan.includes('jackson-pollock-7') && dan.includes('durnin-womersley') && dan.includes('imc'));
  assert.ok(!dan.includes('kerr-5c'), 'Kerr no da nada sin la talla sentado ni sus perímetros');
  // El orden es el del catálogo: nunca «el mejor».
  assert.deepEqual(dan, PROGRAMAS_DE_RESULTADO.map((p) => p.clave).filter((c) => dan.includes(c)));
});

test('la evolución de cada valor: una resta con signo, y el % de grasa en puntos', () => {
  const ahora = pasoDe('jackson-pollock-7', H2, 'HOMBRE', 'grasa');
  const antes = pasoDe('jackson-pollock-7', H1, 'HOMBRE', 'grasa');
  assert.equal(diferenciaDelPaso(ahora, antes), '+8,8 puntos');
  assert.equal(diferenciaDelPaso(pasoDe('jackson-pollock-7', H1, 'HOMBRE', 'masa-grasa'), pasoDe('jackson-pollock-7', H2, 'HOMBRE', 'masa-grasa')), '−9,2 kg');
  assert.equal(diferenciaDelPaso(antes, antes), '0,0 puntos');
  assert.equal(diferenciaDelPaso(antes, null), null);
});

test('las palabras del resultado no califican', () => {
  const textos = PROGRAMAS_DE_RESULTADO.flatMap((p) => {
    const r = resultadoDelMetodo(p.clave, H1, 'HOMBRE')!;
    return [p.nombre, p.da, ...pasosDelResultado(r).flatMap((x) => [x.nombre, x.origen, x.formula, x.motivo ?? '']), ...r.etapas.map((e) => e.nota ?? '')];
  });
  for (const palabra of ['normal', 'ideal', 'sobrepeso', 'obesidad', 'cumplimiento', 'adherencia', 'puntaje', 'asesorado', 'mejor', 'riesgo']) {
    assert.ok(!textos.some((t) => t.toLocaleLowerCase('es-AR').includes(palabra)), palabra);
  }
});
