/**
 * Tramo D de WP-IDENTIDAD-VISUAL · la figura de la toma antropométrica: qué dibuja, de dónde lo saca y qué no puede hacer.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { metricasDelProtocolo, metricasPorFamilia, puntosDeLaFigura, repartirEnElProtocolo, SITIOS_DE_LA_FIGURA } from './figura-antropometrica';

const PROTOCOLO = {
  metricas: [
    { clave: 'peso', nombre: 'Peso', familia: 'MASA_Y_ESTATURA', unidades: ['kg'], precision: 1 },
    { clave: 'pliegue-triceps', nombre: 'Pliegue tricipital', familia: 'PLIEGUES', unidades: ['mm'] },
    { clave: 'perimetro-cintura', nombre: 'Perímetro de cintura', familia: 'PERIMETROS', unidades: ['cm'] },
    { clave: 'envergadura', nombre: 'Envergadura', familia: 'OTRAS', unidades: ['cm'] },
  ],
};

test('B10-07 §18 · lo que se mide lo declara el protocolo: nombre, familia y unidades salen de su contenido', () => {
  assert.deepEqual(
    metricasDelProtocolo(PROTOCOLO).map((m) => [m.clave, m.nombre, m.familia, m.unidades]),
    [
      ['peso', 'Peso', 'MASA_Y_ESTATURA', ['kg']],
      ['pliegue-triceps', 'Pliegue tricipital', 'PLIEGUES', ['mm']],
      ['perimetro-cintura', 'Perímetro de cintura', 'PERIMETROS', ['cm']],
      ['envergadura', 'Envergadura', 'OTRAS', ['cm']],
    ],
  );
  // El protocolo de laboratorio de WP-05 no declara nombre ni familia: vale la clave, en «Otras».
  assert.deepEqual(metricasDelProtocolo({ metricas: [{ clave: 'talla', unidades: ['m', 'cm'], precision: 2 }] }), [
    { clave: 'talla', nombre: 'talla', familia: 'OTRAS', unidades: ['m', 'cm'] },
  ]);
});

test('un contenido que no tiene la forma esperada no declara métricas: no se supone ninguna', () => {
  for (const contenido of [null, undefined, 'metricas', {}, { metricas: 'peso' }, { metricas: [{ clave: '' , unidades: ['kg'] }] }, { metricas: [{ clave: 'peso', unidades: [] }] }]) {
    assert.deepEqual(metricasDelProtocolo(contenido), [], JSON.stringify(contenido));
  }
  // Una clave repetida cuenta una vez.
  assert.equal(metricasDelProtocolo({ metricas: [{ clave: 'peso', unidades: ['kg'] }, { clave: 'peso', unidades: ['g'] }] }).length, 1);
});

test('B10-07 §15 · las familias en su orden, cada una con sus métricas en el orden del protocolo', () => {
  assert.deepEqual(
    metricasPorFamilia(metricasDelProtocolo(PROTOCOLO)).map((g) => [g.familia, g.metricas.map((m) => m.clave)]),
    [
      ['MASA_Y_ESTATURA', ['peso']],
      ['PLIEGUES', ['pliegue-triceps']],
      ['PERIMETROS', ['perimetro-cintura']],
      ['OTRAS', ['envergadura']],
    ],
  );
});

test('B10-07 §17 · una medición va a su campo solo si el protocolo la declara en esa unidad; si no, queda fuera, tal cual', () => {
  const escritas = [
    { id: 'a', metrica: 'perimetro-cintura', valor: '81', unidad: 'cm' },
    { id: 'b', metrica: 'pliegue-triceps', valor: '85', unidad: 'cm' },
    { id: 'c', metrica: 'perimetro-cadera', valor: '95', unidad: 'cm' },
    { id: 'd', metrica: ' peso ', valor: '70,5', unidad: 'kg ' },
  ];
  const { enSuCampo, fuera } = repartirEnElProtocolo(escritas, metricasDelProtocolo(PROTOCOLO));
  assert.deepEqual([...enSuCampo.keys()], ['perimetro-cintura', 'peso']);
  // El pliegue en cm no se esconde detrás de los mm del campo, ni se convierte; la cadera no está en el protocolo.
  assert.deepEqual(
    fuera.map((m) => [m.id, m.metrica, m.valor, m.unidad]),
    [
      ['b', 'pliegue-triceps', '85', 'cm'],
      ['c', 'perimetro-cadera', '95', 'cm'],
    ],
  );
  // Lo que va al campo es la misma medición, con su valor como se escribió.
  assert.equal(enSuCampo.get('peso'), escritas[3]);
});

test('el reparto no pierde nada: la primera ocupa el campo, una repetida o sin valor queda fuera del protocolo', () => {
  const escritas = [
    { id: 'campo', metrica: 'perimetro-cintura', valor: '81', unidad: 'cm' },
    { id: 'repetida', metrica: 'perimetro-cintura', valor: '82', unidad: 'cm' },
    { id: 'sin-valor', metrica: 'pliegue-triceps', valor: ' ', unidad: 'mm' },
  ];
  const { enSuCampo, fuera } = repartirEnElProtocolo(escritas, metricasDelProtocolo(PROTOCOLO));
  assert.equal(enSuCampo.get('perimetro-cintura')?.id, 'campo');
  assert.deepEqual(fuera.map((m) => m.id), ['repetida', 'sin-valor']);
  // Sin métricas declaradas, todo queda fuera del protocolo; y siempre, lo que entra es lo que sale.
  const sinProtocolo = repartirEnElProtocolo(escritas, []);
  assert.equal(sinProtocolo.enSuCampo.size, 0);
  assert.deepEqual(sinProtocolo.fuera, escritas);
});

test('la figura dibuja solo lo que el protocolo declara y tiene sitio; lo demás queda en la lista', () => {
  const puntos = puntosDeLaFigura(metricasDelProtocolo(PROTOCOLO), new Set());
  assert.deepEqual(
    puntos.map((p) => p.clave),
    ['pliegue-triceps', 'perimetro-cintura'],
  );
  assert.equal(puntos.find((p) => p.clave === 'pliegue-triceps')?.vista, 'ESPALDA');
  assert.equal(puntos.find((p) => p.clave === 'perimetro-cintura')?.forma, 'ANILLO');
});

test('DL-073 · la figura ubica, nunca califica: un punto solo sabe si hay dato, nunca cuánto vale', () => {
  const metricas = metricasDelProtocolo(PROTOCOLO);
  const conDato = puntosDeLaFigura(metricas, new Set(['pliegue-triceps']));
  const triceps = conDato.find((p) => p.clave === 'pliegue-triceps')!;
  assert.equal(triceps.cargado, true);
  assert.equal(conDato.find((p) => p.clave === 'perimetro-cintura')!.cargado, false);
  // Lo que el punto lleva es su sitio, su nombre y si tiene dato: ninguna clave puede transportar un valor, un rango o
  // una categoría hasta la pantalla.
  assert.deepEqual(Object.keys(triceps).sort(), ['cargado', 'clave', 'forma', 'nombre', 'vista', 'x', 'y']);
  // Y la función no recibe valores: su segundo argumento es el conjunto de claves con dato.
  assert.equal(puntosDeLaFigura.length, 2);
});

test('cada sitio cae dentro de la figura y del lado que se dibuja', () => {
  for (const [clave, s] of Object.entries(SITIOS_DE_LA_FIGURA)) {
    assert.ok(s.x > 0 && s.x < 200 && s.y > 0 && s.y < 440, clave);
    // Se dibuja el lado derecho de la persona: a la izquierda de quien mira de frente, a la derecha de espalda.
    if (s.vista === 'FRENTE' && s.forma === 'PUNTO') assert.ok(s.x < 100, `${clave} de frente`);
    if (s.vista === 'ESPALDA') assert.ok(s.x > 100, `${clave} de espalda`);
    if (s.forma === 'ANILLO') assert.ok(s.radio && s.radio > 0, `${clave} sin ancho`);
  }
});
