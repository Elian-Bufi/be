/**
 * RP-17 (DL-190) · Kerr (1988), cinco componentes (`formulas-antropometricas.ts`) y su suma frente al peso medido
 * (`fraccionamiento-de-kerr.ts`):
 * - casos calculados a mano con dos personas de la ficha (H1 y M2) y las siete mediciones que el perfil completo no tiene;
 * - el Phantom: con sus valores y su talla, cada masa da la del Phantom (la prueba de que las constantes cierran);
 * - la constante de la piel antes de los 12 años y con 12 cumplidos (AK-D05);
 * - el ejemplo de la propia fuente: la tesis no trae un sujeto resuelto, pero el apéndice B tiene las medidas de los 25
 *   cadáveres y la tabla 5.5 las medias de las masas predichas; las de BE dan las de la tabla al décimo de kg.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarPrecision } from './antropometria';
import type { EvaluacionAntropometricaApi } from './contratos-antropometria';
import type { CorridaDeCalculoApi } from './contratos-calculo';
import { fraccionamientoDeKerr } from './fraccionamiento-de-kerr';
import { REGLAS_ANTROPOMETRICAS, type ValoresDeEntrada } from './formulas-antropometricas';

const regla = (id: string) => {
  const r = REGLAS_ANTROPOMETRICAS[id];
  assert.ok(r, `falta la regla ${id}`);
  return r;
};
const numero = (id: string, e: ValoresDeEntrada): number => {
  const r = regla(id)(e);
  assert.equal(typeof r, 'number', `${id}: ${JSON.stringify(r)}`);
  return r as number;
};
const unDecimal = (x: number) => aplicarPrecision(x, { decimales: 1, modo: 'MEDIO_ARRIBA' });

/** H1 y M2 de la ficha (§1), con las siete mediciones de Kerr que el perfil completo no tiene. */
const H1: ValoresDeEntrada = {
  edad: 22, peso: 72, talla: 176, 'talla-sentado': 91,
  'pliegue-triceps': 8, 'pliegue-subescapular': 10, 'pliegue-supraespinal': 7, 'pliegue-abdominal': 14.5, 'pliegue-muslo-frontal': 11, 'pliegue-pantorrilla': 6.5,
  'perimetro-brazo-relajado': 30, 'perimetro-antebrazo': 27, 'perimetro-pecho': 95, 'perimetro-cintura': 78, 'perimetro-pantorrilla': 37,
  'perimetro-cabeza': 57, 'perimetro-muslo-gluteo': 56.5,
  'diametro-humero': 7, 'diametro-femur': 9.6, 'diametro-biacromial': 40.5, 'diametro-biiliocrestal': 28.5, 'diametro-torax-transverso': 29, 'diametro-torax-anteroposterior': 19,
};
const M2: ValoresDeEntrada = {
  edad: 34, peso: 64, talla: 166, 'talla-sentado': 87,
  'pliegue-triceps': 19, 'pliegue-subescapular': 14, 'pliegue-supraespinal': 14, 'pliegue-abdominal': 22, 'pliegue-muslo-frontal': 27, 'pliegue-pantorrilla': 17,
  'perimetro-brazo-relajado': 28, 'perimetro-antebrazo': 24, 'perimetro-pecho': 90, 'perimetro-cintura': 74, 'perimetro-pantorrilla': 36,
  'perimetro-cabeza': 55, 'perimetro-muslo-gluteo': 59,
  'diametro-humero': 6.1, 'diametro-femur': 8.9, 'diametro-biacromial': 36, 'diametro-biiliocrestal': 28, 'diametro-torax-transverso': 26, 'diametro-torax-anteroposterior': 17,
};

test('piel (Kerr): superficie corporal por el espesor de la piel y su densidad, por sexo', () => {
  // H1: 68,308 × 72^0,425 × 176^0,725 / 10 000 = 1,785807 m²; × 2,07 × 1,05 = 3,881452 kg.
  const h1 = numero('be/kerr-masa-piel-hombres@1', H1);
  assert.ok(Math.abs(h1 - (68.308 * 72 ** 0.425 * 176 ** 0.725 / 10_000) * 2.07 * 1.05) < 1e-12);
  assert.equal(unDecimal(h1), 3.9);
  // M2: 73,074 × 64^0,425 × 166^0,725 / 10 000 = 1,741677 m²; × 1,96 × 1,05 = 3,584372 kg.
  assert.equal(unDecimal(numero('be/kerr-masa-piel-mujeres@1', M2)), 3.6);
});

test('piel (Kerr): antes de los 12 años la constante es la de chicos para los dos sexos; con 12 cumplidos, la de su sexo (AK-D05)', () => {
  const chico = { ...H1, edad: 10, peso: 32, talla: 138 };
  const superficie = (70.691 * 32 ** 0.425 * 138 ** 0.725) / 10_000;
  assert.ok(Math.abs(numero('be/kerr-masa-piel-hombres@1', chico) - superficie * 2.07 * 1.05) < 1e-12);
  assert.ok(Math.abs(numero('be/kerr-masa-piel-mujeres@1', chico) - superficie * 1.96 * 1.05) < 1e-12);
  const doce = { ...chico, edad: 12 };
  assert.ok(Math.abs(numero('be/kerr-masa-piel-hombres@1', doce) - ((68.308 * 32 ** 0.425 * 138 ** 0.725) / 10_000) * 2.07 * 1.05) < 1e-12);
  assert.ok(Math.abs(numero('be/kerr-masa-piel-mujeres@1', { ...doce, edad: 11.99 }) - superficie * 1.96 * 1.05) < 1e-12);
});

test('adiposa (Kerr): los casos de MA-57 de la ficha', () => {
  assert.equal(unDecimal(numero('be/kerr-masa-adiposa@1', H1)), 16.9);
  assert.equal(unDecimal(numero('be/kerr-masa-adiposa@1', M2)), 23.7);
  // El valor sin redondear de la ficha (caso 1): 16,916464.
  assert.equal(aplicarPrecision(numero('be/kerr-masa-adiposa@1', H1), { decimales: 6, modo: 'MEDIO_ARRIBA' }), 16.916464);
});

test('muscular (Kerr): el muslo a 1 cm del pliegue glúteo, no el muslo medio (D-3 resuelta)', () => {
  // H1: brazo 30 − π·0,8 = 27,486726; antebrazo 27; muslo 56,5 − π·1,1 = 53,044248; pantorrilla 37 − π·0,65 = 34,957965;
  // pecho 95 − π·1,0 = 91,858407. Σ = 234,347346; Z = (234,347346 × 0,966932 − 207,21) / 13,74 = 1,411056;
  // masa = (1,411056 × 5,4 + 24,5) / 0,904040 = 35,529078 kg.
  const h1 = numero('be/kerr-masa-muscular@1', H1);
  assert.equal(aplicarPrecision(h1, { decimales: 6, modo: 'MEDIO_ARRIBA' }), 35.529078);
  assert.equal(unDecimal(h1), 35.5);
  assert.equal(unDecimal(numero('be/kerr-masa-muscular@1', M2)), 26.7);
  // El muslo medio no entra: sin el de 1 cm del pliegue glúteo, no se calcula.
  const sinElDeKerr: Record<string, number> = { ...H1, 'perimetro-muslo': 53 };
  delete sinElDeKerr['perimetro-muslo-gluteo'];
  const r = regla('be/kerr-masa-muscular@1')(sinElDeKerr);
  assert.equal(typeof r, 'object');
  assert.match((r as { error: string }).error, /perimetro-muslo-gluteo/);
});

test('ósea (Kerr): la cabeza sin escalar más el cuerpo escalado por la talla', () => {
  // H1: cabeza (57 − 56) / 1,44 × 0,18 + 1,20 = 1,325; cuerpo: Σ = 40,5 + 28,5 + 14 + 19,2 = 102,2; Z = (102,2 × 0,966932 −
  // 98,88) / 5,33 = −0,011176; (−0,011176 × 1,34 + 6,70) / 0,904040 = 7,394613. Total 8,719613 kg.
  assert.equal(aplicarPrecision(numero('be/kerr-masa-osea@1', H1), { decimales: 6, modo: 'MEDIO_ARRIBA' }), 8.719613);
  assert.equal(unDecimal(numero('be/kerr-masa-osea@1', M2)), 6.7);
});

test('residual (Kerr): con la talla sentado y la cintura mínima corregida por el pliegue abdominal', () => {
  // H1: 29 + 19 + (78 − π·1,45) = 121,444691; k = 89,92 / 91 = 0,988132; Z = (121,444691 × 0,988132 − 109,35) / 7,08 =
  // 1,504713; (1,504713 × 1,24 + 6,10) / 0,964816 = 8,256331 kg.
  assert.equal(aplicarPrecision(numero('be/kerr-masa-residual@1', H1), { decimales: 6, modo: 'MEDIO_ARRIBA' }), 8.256331);
  assert.equal(unDecimal(numero('be/kerr-masa-residual@1', M2)), 6.2);
});

test('el Phantom: con sus valores, cada masa da la del Phantom (Ross y Wilson, 1974)', () => {
  const phantom: ValoresDeEntrada = {
    talla: 170.18, 'talla-sentado': 89.92,
    'pliegue-triceps': 15.4, 'pliegue-subescapular': 17.2, 'pliegue-supraespinal': 15.4, 'pliegue-abdominal': 25.4, 'pliegue-muslo-frontal': 27, 'pliegue-pantorrilla': 16,
    'perimetro-brazo-relajado': 26.89, 'perimetro-antebrazo': 25.13, 'perimetro-muslo-gluteo': 55.82, 'perimetro-pantorrilla': 35.25, 'perimetro-pecho': 87.86, 'perimetro-cintura': 71.91,
    'perimetro-cabeza': 56, 'diametro-biacromial': 38.04, 'diametro-biiliocrestal': 28.84, 'diametro-humero': 6.48, 'diametro-femur': 9.52,
    'diametro-torax-transverso': 27.92, 'diametro-torax-anteroposterior': 17.5,
  };
  assert.equal(unDecimal(numero('be/kerr-masa-adiposa@1', phantom)), 25.6);
  assert.equal(unDecimal(numero('be/kerr-masa-muscular@1', phantom)), 24.5);
  // 6,70 del cuerpo y 1,20 de la cabeza.
  assert.equal(unDecimal(numero('be/kerr-masa-osea@1', phantom)), 7.9);
  assert.equal(unDecimal(numero('be/kerr-masa-residual@1', phantom)), 6.1);
});

/**
 * El apéndice B de la tesis (págs. 124-126): las medidas de los 25 cadáveres, transcriptas de la imagen escaneada.
 * Columnas: id, sexo, talla, talla sentado, peso | tríceps, subescapular, supraespinal, abdominal, muslo frontal,
 * pantorrilla (mm) | brazo relajado, antebrazo, pecho, muslo (1 cm glúteo), pantorrilla, cabeza, biacromial,
 * biiliocrestal, fémur, húmero (cm). No trae cintura ni diámetros del tórax: la residual no se puede contrastar.
 */
const CADAVERES = `
3 H 156.2 86.16 52.8 | 16.25 14.25 19.85 17.00 20.05 22.40 | 24.70 22.00 86.50 48.05 27.60 55.70 31.20 25.90 9.71 6.13
5 H 162.8 89.36 70.4 | 15.30 16.95 12.35 18.05 15.75 13.00 | 30.10 25.80 95.15 48.75 36.15 53.80 37.15 30.52 9.57 6.51
6 H 167.0 91.81 71.5 | 18.70 10.95 7.15 14.55 14.45 7.10 | 29.65 26.80 99.90 46.75 31.90 59.05 36.30 30.84 10.46 8.08
9 H 159.2 88.72 58.5 | 15.85 14.00 6.30 16.30 12.80 5.55 | 26.35 24.50 96.30 43.10 26.00 54.55 37.60 30.39 9.35 7.65
10 H 167.5 92.42 51.7 | 12.10 8.20 4.05 9.30 9.05 7.25 | 23.40 22.25 89.95 34.65 20.52 55.25 36.90 30.48 9.80 7.05
13 H 165.8 90.09 65.1 | 26.00 18.05 8.20 11.50 11.60 5.85 | 29.85 28.55 93.50 46.75 32.45 56.95 35.35 30.30 9.50 7.63
17 H 166.1 89.74 54.8 | 15.00 9.10 5.05 12.30 6.15 4.65 | 25.50 22.85 89.25 44.70 28.30 56.26 36.70 30.10 9.78 7.21
20 H 173.2 90.62 76.8 | 18.10 18.25 12.15 19.45 20.45 17.45 | 28.05 26.40 97.85 52.50 39.25 55.45 37.75 30.95 10.70 7.27
23 H 176.9 93.12 61.0 | 10.80 8.10 4.95 13.25 10.15 8.20 | 24.65 21.75 88.80 44.80 30.80 55.90 37.25 32.20 9.55 6.73
25 H 172.0 95.24 85.1 | 23.30 21.85 14.45 20.40 22.35 10.15 | 33.00 28.25 104.45 54.90 35.40 59.60 39.30 31.45 10.23 7.61
26 H 163.6 91.98 57.7 | 16.60 17.90 10.70 28.70 24.90 16.60 | 26.60 22.00 88.30 46.40 27.25 54.70 36.40 29.70 9.49 6.08
27 H 186.5 97.11 88.9 | 11.05 11.50 6.85 12.85 18.55 10.00 | 31.40 29.10 97.00 56.55 36.45 57.85 40.30 32.25 11.19 8.03
4 M 148.3 80.74 61.6 | 47.50 36.40 23.00 25.80 30.35 17.55 | 30.15 28.85 92.70 47.15 28.30 55.85 35.40 32.44 9.13 6.10
7 M 151.5 80.82 49.1 | 13.05 7.70 4.60 10.80 15.05 16.00 | 23.25 21.75 77.40 47.35 29.15 52.20 33.30 29.90 9.03 6.53
8 M 157.1 84.49 48.3 | 19.80 10.65 8.45 19.10 13.30 18.90 | 24.15 22.15 73.10 44.20 31.40 53.60 38.55 30.24 9.07 6.23
11 M 157.8 89.20 75.4 | 46.35 21.35 21.65 20.40 35.60 31.50 | 31.35 26.65 94.40 56.15 33.70 55.75 34.45 31.82 9.82 6.73
12 M 168.6 93.04 62.9 | 26.65 12.90 6.80 16.85 19.80 18.88 | 25.55 23.55 84.40 47.55 32.75 56.75 36.45 34.35 9.77 7.44
14 M 160.2 81.99 63.4 | 26.60 9.60 10.85 20.50 17.75 16.10 | 28.00 24.75 84.10 52.00 29.15 54.72 34.05 31.25 9.27 6.81
15 M 159.7 87.12 58.9 | 28.15 12.55 26.25 31.65 21.65 22.35 | 28.40 23.10 78.85 50.75 30.10 56.55 34.75 27.85 9.56 6.90
18 M 172.3 87.91 74.2 | 13.20 15.65 23.90 22.60 41.15 35.80 | 29.85 22.40 84.50 52.30 22.30 54.80 36.10 31.80 10.11 6.82
19 M 161.7 88.58 48.2 | 23.40 9.85 16.00 35.15 23.40 17.25 | 23.60 20.25 73.80 44.35 26.25 52.90 35.25 31.05 9.55 6.76
21 M 151.3 81.70 71.6 | 22.35 21.70 12.95 25.35 43.75 16.30 | 32.20 27.60 87.00 56.15 32.20 56.80 37.85 30.15 10.07 7.00
22 M 153.6 78.82 69.0 | 28.35 17.80 12.75 27.25 29.90 23.60 | 33.00 24.25 86.35 53.95 34.75 53.40 33.00 29.80 10.47 6.88
24 M 156.5 83.66 61.2 | 25.80 12.95 23.30 22.80 28.80 29.50 | 26.70 23.15 82.94 50.00 29.00 54.55 36.65 30.95 9.94 6.50
28 M 163.5 97.00 68.8 | 23.25 16.55 12.65 20.85 28.80 18.75 | 28.60 24.65 81.55 52.80 32.40 53.50 35.00 31.35 9.76 6.85
`;

function cadaveres(): { sexo: 'H' | 'M'; valores: ValoresDeEntrada }[] {
  return CADAVERES.trim()
    .split('\n')
    .map((linea) => {
      const [base, pliegues, medidas] = linea.split('|').map((p) => p.trim().split(/\s+/));
      const [, sexo, talla, tallaSentado, peso] = base!;
      const [tri, sub, sup, abd, muslo, pant] = pliegues!.map(Number);
      const [brazo, antebrazo, pecho, musloGluteo, pantorrilla, cabeza, biacromial, biiliocrestal, femur, humero] = medidas!.map(Number);
      return {
        sexo: sexo as 'H' | 'M',
        valores: {
          // Adultos: la edad no está en el apéndice; cualquier edad de 12 o más usa la constante de su sexo.
          edad: 70, talla: Number(talla), 'talla-sentado': Number(tallaSentado), peso: Number(peso),
          'pliegue-triceps': tri!, 'pliegue-subescapular': sub!, 'pliegue-supraespinal': sup!, 'pliegue-abdominal': abd!, 'pliegue-muslo-frontal': muslo!, 'pliegue-pantorrilla': pant!,
          'perimetro-brazo-relajado': brazo!, 'perimetro-antebrazo': antebrazo!, 'perimetro-pecho': pecho!, 'perimetro-muslo-gluteo': musloGluteo!, 'perimetro-pantorrilla': pantorrilla!,
          'perimetro-cabeza': cabeza!, 'diametro-biacromial': biacromial!, 'diametro-biiliocrestal': biiliocrestal!, 'diametro-femur': femur!, 'diametro-humero': humero!,
        },
      };
    });
}

test('las medias de los 25 cadáveres de la tesis (apéndice B) dan las de la tabla 5.5, al décimo de kg', () => {
  const todos = cadaveres();
  assert.equal(todos.length, 25);
  // Tabla 5.5: medias predichas de piel, adiposa, muscular y ósea, en kg (12 hombres y 13 mujeres).
  const TABLA_5_5 = { H: { piel: 3.6, adiposa: 19.2, muscular: 24.8, osea: 8.7 }, M: { piel: 3.4, adiposa: 23.8, muscular: 17.6, osea: 8.0 } } as const;
  for (const sexo of ['H', 'M'] as const) {
    const grupo = todos.filter((c) => c.sexo === sexo);
    assert.equal(grupo.length, sexo === 'H' ? 12 : 13);
    const media = (id: string) => grupo.reduce((t, c) => t + numero(id, c.valores), 0) / grupo.length;
    const medias = {
      piel: media(sexo === 'H' ? 'be/kerr-masa-piel-hombres@1' : 'be/kerr-masa-piel-mujeres@1'),
      adiposa: media('be/kerr-masa-adiposa@1'),
      muscular: media('be/kerr-masa-muscular@1'),
      osea: media('be/kerr-masa-osea@1'),
    };
    for (const [masa, publicada] of Object.entries(TABLA_5_5[sexo])) {
      const calculada = medias[masa as keyof typeof medias];
      assert.ok(Math.abs(calculada - publicada) <= 0.1, `${sexo} · ${masa}: ${calculada.toFixed(2)} kg frente a ${publicada} de la tabla 5.5`);
    }
  }
});

test('una medición en cero no se calcula: se dice cuál', () => {
  const r = regla('be/kerr-masa-residual@1')({ ...H1, 'talla-sentado': 0 });
  assert.match((r as { error: string }).error, /talla-sentado/);
  const s = regla('be/kerr-masa-osea@1')({ ...H1, 'perimetro-cabeza': 0 });
  assert.match((s as { error: string }).error, /perimetro-cabeza/);
});

// ─── La suma frente al peso medido ───────────────────────────────────────────────────────────────

const corrida = (metrica: string, valor: number, cambios: Partial<CorridaDeCalculoApi> = {}): CorridaDeCalculoApi =>
  ({
    calculationRunId: `c-${metrica}-${valor}`,
    adviseeId: 'a',
    evaluationId: 'e1',
    evaluationContext: 'REGISTERED',
    purpose: 'ANTHROPOMETRIC_SUPPORT',
    methodId: `m-${metrica}`,
    methodVersionId: `v-${metrica}`,
    methodName: `Método de ${metrica}`,
    methodVersion: '1',
    ruleId: 'be/x@1',
    result: { metric: metrica, magnitude: { value: valor, unit: 'kg' } },
    precision: { decimals: 1, rounding: 'HALF_UP' },
    inputProvenance: [],
    supersedesRunId: null,
    referenceForPurpose: false,
    referenceVersion: null,
    effective: true,
    supersededByRunId: null,
    author: { identityId: 'p', displayName: 'P' },
    recordedAt: '2026-11-21T10:00:00.000Z',
    ...cambios,
  }) as CorridaDeCalculoApi;
const peso = (valor: number, cambios: Record<string, unknown> = {}) =>
  ({ measurementId: 'm-peso', metric: 'peso', condition: 'EFFECTIVE', effectiveMagnitude: { value: valor, unit: 'kg' }, ...cambios }) as unknown as EvaluacionAntropometricaApi['measurements'][number];

test('la suma de las cinco masas frente al peso medido, en kg y en % del peso, como valida Kerr', () => {
  // H1: 3,9 + 16,9 + 35,5 + 8,7 + 8,3 = 73,3 kg frente a 72,0: +1,3 kg, +1,8 %.
  const cinco = [corrida('masa-piel-kerr', 3.9), corrida('masa-adiposa-kerr', 16.9), corrida('masa-muscular-kerr', 35.5), corrida('masa-osea-kerr', 8.7), corrida('masa-residual-kerr', 8.3)];
  const f = fraccionamientoDeKerr(cinco, 'e1', [peso(72)])!;
  assert.deepEqual(f.faltan, []);
  assert.equal(f.pesoEstructurado, 73.3);
  assert.equal(f.diferenciaKg, 1.3);
  assert.equal(f.diferenciaPorcentaje, 1.8);
  assert.deepEqual(f.componentes.map((c) => c.nombre), ['Piel', 'Adiposa', 'Muscular', 'Ósea', 'Residual']);
  // Una suma por debajo de la balanza da una diferencia negativa: una resta con signo, sin calificar.
  assert.equal(fraccionamientoDeKerr(cinco, 'e1', [peso(75)])!.diferenciaKg, -1.7);
});

test('sin las cinco no hay suma; sin ninguna, no hay bloque; lo anulado o reemplazado no cuenta', () => {
  assert.equal(fraccionamientoDeKerr([corrida('imc', 23)], 'e1', [peso(72)]), null);
  const tres = [corrida('masa-piel-kerr', 3.9), corrida('masa-adiposa-kerr', 16.9), corrida('masa-osea-kerr', 8.7)];
  const f = fraccionamientoDeKerr(tres, 'e1', [peso(72)])!;
  assert.deepEqual(f.faltan, ['Muscular', 'Residual']);
  assert.equal(f.pesoEstructurado, null);
  assert.equal(f.diferenciaKg, null);
  const conUnaSinEfecto = [...tres, corrida('masa-muscular-kerr', 35.5, { effective: false }), corrida('masa-residual-kerr', 8.3)];
  assert.deepEqual(fraccionamientoDeKerr(conUnaSinEfecto, 'e1', [peso(72)])!.faltan, ['Muscular']);
  // De otra toma no cuenta; un peso anulado tampoco.
  assert.equal(fraccionamientoDeKerr(tres, 'otra', [peso(72)]), null);
  const cinco = [...tres, corrida('masa-muscular-kerr', 35.5), corrida('masa-residual-kerr', 8.3)];
  const sinPeso = fraccionamientoDeKerr(cinco, 'e1', [peso(72, { condition: 'ANNULLED' })])!;
  assert.equal(sinPeso.pesoEstructurado, 73.3);
  assert.equal(sinPeso.pesoMedido, null);
  assert.equal(sinPeso.diferenciaKg, null);
});

test('si una masa está calculada dos veces (la piel de hombres y la de mujeres), cuenta la última registrada', () => {
  const f = fraccionamientoDeKerr(
    [corrida('masa-piel-kerr', 3.9, { recordedAt: '2026-11-21T10:00:00.000Z' }), corrida('masa-piel-kerr', 3.7, { recordedAt: '2026-11-21T11:00:00.000Z', calculationRunId: 'otra' })],
    'e1',
    [peso(72)],
  )!;
  assert.equal(f.componentes[0]!.valor, 3.7);
  assert.equal(f.componentes[0]!.corridaId, 'otra');
});
