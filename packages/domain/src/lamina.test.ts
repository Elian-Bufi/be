/**
 * DL-111 · la lámina del compositor con datos de BE (`lamina.ts`). Las posiciones esperadas salen del compositor
 * (`docs/direccion/LAMINA-DEL-COMPOSITOR.md` § 3.4: hombre entero, tarjetas de perímetros en y = 551,5 / 783,5 /
 * 1077,5 / 1309,5); lo demás, de las reglas del legajo: un sitio sin valor no se dibuja, la diferencia es una resta
 * solo entre valores comparables, un hueco no se cruza y ningún color dice «mejor» o «peor».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CorridaDeCalculoApi } from './contratos-calculo';
import type { EvaluacionAntropometricaApi } from './contratos-antropometria';
import { COLORES_DE_LA_FIGURA, DIBUJO_EN_MEDICION, FIGURAS_DE_LA_LAMINA, PLIEGUES_SUMADOS_POR_BE, TARJETAS_DE_PERIMETROS, TARJETAS_DE_PLIEGUES, altoDeTarjetaEnSerie, apilarTarjetas } from './figura-de-lamina';
import {
  agruparPorCategoria,
  COLORES_DE_LA_LAMINA,
  componerMedicion,
  componerSerie,
  corridasSinEfecto,
  diametrosDeLaToma,
  distanciaAlTramo,
  enUnMismoLugar,
  escalaDelGrafico,
  FRANJA_DE_LA_SERIE,
  HOLGURA_DE_LA_GUIA,
  grillaDelPiso,
  lineaDelDegradado,
  nombreDelArchivoDeLaLamina,
  opacidadDeLaCapa,
  partirEnLineas,
  recortarTexto,
  redondoHaciaArriba,
  repartirConclusiones,
  repartirEvolucion,
  resultadosDeLaToma,
  serieDeValores,
  sumasDelPieDePliegues,
  seriesDeEvolucion,
  tomasPorDefecto,
  tramosDeLaSerie,
  valoresDeLaToma,
  type ColoresDeLaLamina,
  type ValorDeLaLamina,
} from './lamina';

// ─── Datos sintéticos ───────────────────────────────────────────────────────────────────────────

type Medicion = EvaluacionAntropometricaApi['measurements'][number];
let n = 0;
const PROTOCOLO = { protocolId: 'proto', protocolVersionId: 'proto-v1', protocolName: 'Perfil antropométrico completo', methodId: null, methodVersionId: null, unit: 'cm' };
const autor = { identityId: 'pro', displayName: 'Profesional' };

function medicion(metric: string, value: number, unit: string, extra: Partial<Medicion> = {}): Medicion {
  n += 1;
  return {
    measurementId: `m-${n}`,
    evaluationId: 'ev-1',
    metric,
    magnitude: { value, unit },
    origin: 'DIRECT_CAPTURE',
    dataClass: 'MEASURED',
    protocol: { ...PROTOCOLO, unit },
    preparationReference: null,
    condition: 'EFFECTIVE',
    annulment: null,
    corrections: [],
    effectiveMagnitude: { value, unit },
    occurredAt: '2026-07-29T13:00:00.000Z',
    recordedAt: `2026-07-29T13:${String(n % 60).padStart(2, '0')}:00.000Z`,
    ...extra,
  };
}

const valor = (v: number, unidad = 'cm', grupo = `proto-v1||${unidad}`): ValorDeLaLamina => ({ valor: v, unidad, grupo, clase: 'MEASURED' });

/** La toma de ejemplo del compositor (`bDemo`): los 13 perímetros del hombre entero. */
const PERIMETROS_DEL_EJEMPLO: Readonly<Record<string, number>> = {
  'perimetro-cuello': 37.5,
  'perimetro-hombros': 119,
  'perimetro-pecho': 102,
  'perimetro-brazo-relajado': 33.5,
  'perimetro-brazo-flexionado': 38,
  'perimetro-antebrazo': 29,
  'perimetro-muneca': 17,
  'perimetro-cintura': 76,
  'perimetro-abdomen': 75,
  'perimetro-cadera': 97,
  'perimetro-muslo': 56,
  'perimetro-pantorrilla': 41,
  'perimetro-tobillo': 25,
};
const ejemplo = new Map(Object.entries(PERIMETROS_DEL_EJEMPLO).map(([k, v]) => [k, valor(v)]));

function corrida(evaluationId: string, metric: string, value: number, extra: Partial<CorridaDeCalculoApi> = {}): CorridaDeCalculoApi {
  n += 1;
  return {
    calculationRunId: `c-${n}`,
    adviseeId: 'a',
    evaluationId,
    evaluationContext: 'REGISTERED',
    purpose: 'ANTHROPOMETRIC_SUPPORT',
    methodId: `met-${metric}`,
    methodVersionId: `met-${metric}-v1`,
    methodName: `Método de ${metric}`,
    methodVersion: '1',
    ruleId: `be/${metric}@1`,
    result: { metric, magnitude: { value, unit: '%' } },
    precision: { decimals: 1, rounding: 'HALF_UP' },
    inputProvenance: [],
    supersedesRunId: null,
    referenceForPurpose: false,
    referenceVersion: null,
    effective: true,
    supersededByRunId: null,
    author: autor,
    recordedAt: `2026-07-29T14:${String(n % 60).padStart(2, '0')}:00.000Z`,
    ...extra,
  };
}

// ─── Valores de la toma ─────────────────────────────────────────────────────────────────────────

test('la toma lleva solo los valores que rigen: ni anulados ni cadenas sin resolver; la corrección cuenta', () => {
  const corregida = medicion('perimetro-cintura', 80, 'cm', { effectiveMagnitude: { value: 78.5, unit: 'cm' }, corrections: [] });
  const anulada = medicion('perimetro-cadera', 97, 'cm', { condition: 'ANNULLED' });
  const sinResolver = medicion('perimetro-pecho', 102, 'cm', { effectiveMagnitude: null });
  const { porClave, repetidas } = valoresDeLaToma([corregida, anulada, sinResolver, medicion('pliegue-triceps', 4, 'mm')]);
  assert.deepEqual([...porClave.keys()].sort(), ['perimetro-cintura', 'pliegue-triceps']);
  assert.equal(porClave.get('perimetro-cintura')?.valor, 78.5);
  assert.equal(porClave.get('pliegue-triceps')?.grupo, 'proto-v1||mm');
  assert.deepEqual(repetidas, []);
});

test('con dos mediciones vigentes de la misma clave, la lámina muestra la más reciente y lo dice', () => {
  const primera = medicion('pliegue-triceps', 4, 'mm', { occurredAt: '2026-07-29T13:00:00.000Z' });
  const segunda = medicion('pliegue-triceps', 4.4, 'mm', { occurredAt: '2026-07-29T13:05:00.000Z' });
  const { porClave, repetidas } = valoresDeLaToma([segunda, primera]);
  assert.equal(porClave.get('pliegue-triceps')?.valor, 4.4);
  assert.deepEqual(repetidas, ['pliegue-triceps']);
});

// ─── Medición ───────────────────────────────────────────────────────────────────────────────────

test('Medición · hombre entero: las cuatro tarjetas de perímetros caen donde las pone la composición', () => {
  const c = componerMedicion('HOMBRE', 'ENTERO', 'PERIMETROS', ejemplo);
  // Con el encuadre del compositor v13.3 caían en 551,5 · 783,5 · 1077,5 · 1309,5. Desde el 2026-10-03 el cuerpo entero
  // sube y crece (ENCUADRE_EN_MEDICION, pedido de Dirección), y las tarjetas suben con sus sitios. El orden, las filas
  // y las guías siguen las mismas reglas: lo verifican las pruebas de abajo.
  assert.deepEqual(
    c.tarjetas.map((t) => Number(t.y.toFixed(1))),
    [456.8, 688.8, 982.8, 1229.2],
  );
  assert.deepEqual(
    c.tarjetas.map((t) => t.filas.length),
    TARJETAS_DE_PERIMETROS.ENTERO.map((g) => g.length),
  );
  // La guía de la primera fila: sale a 14 px de la tarjeta, quiebra a 54 px y llega 10 px antes del anillo.
  const primera = c.tarjetas[0]!.filas[0]!;
  const guia = c.guias[0]!;
  assert.deepEqual(guia.puntos[0], [476, primera.centro]);
  assert.deepEqual(guia.puntos[1], [516, primera.centro]);
  assert.equal(guia.puntos[2]![0], primera.sitio.anillo!.cx - primera.sitio.anillo!.rx - 10);
  assert.equal(c.sitios.length, 13);
  assert.deepEqual(c.fueraDelEncuadre, []);
});

test('Medición · un sitio sin valor no se dibuja: ni anillo, ni fila, ni guía', () => {
  const sinHombros = new Map(ejemplo);
  sinHombros.delete('perimetro-hombros');
  const c = componerMedicion('HOMBRE', 'ENTERO', 'PERIMETROS', sinHombros);
  assert.equal(c.sitios.length, 12);
  assert.ok(!c.sitios.some((s) => s.clave === 'perimetro-hombros'));
  assert.equal(c.tarjetas[0]!.filas.length, 2);
  assert.equal(c.tarjetas[0]!.alto, 2 * 62 + 20);
  assert.equal(c.guias.length, 12);
});

test('Medición · sin valores no hay tarjetas, y lo que no entra en el encuadre se nombra', () => {
  assert.deepEqual(componerMedicion('MUJER', 'ENTERO', 'PLIEGUES', new Map()).tarjetas, []);
  const c = componerMedicion('HOMBRE', 'TREN_SUPERIOR', 'PERIMETROS', ejemplo);
  assert.deepEqual(c.fueraDelEncuadre, ['perimetro-muslo', 'perimetro-pantorrilla', 'perimetro-tobillo']);
  assert.ok(c.tarjetas.every((t) => t.y >= 250 && t.y + t.alto <= 1650));
});

test('Medición · los pliegues posteriores llevan la marca y su guía es la de la cara posterior', () => {
  const pliegues = new Map(TARJETAS_DE_PLIEGUES.ENTERO.flat().map((k) => [k, valor(5, 'mm')]));
  const c = componerMedicion('MUJER', 'ENTERO', 'PLIEGUES', pliegues);
  const posteriores = c.sitios.filter((s) => s.posterior).map((s) => s.clave);
  assert.deepEqual(posteriores.sort(), ['pliegue-subescapular', 'pliegue-triceps']);
  assert.equal(c.guias.filter((g) => g.posterior).length, 2);
  // El destino de un pliegue es 16 px a la izquierda del punto.
  const triceps = c.tarjetas.flatMap((t) => t.filas).find((f) => f.sitio.clave === 'pliegue-triceps')!;
  const guia = c.guias.find((g) => g.puntos[0]![1] === triceps.centro)!;
  assert.equal(guia.puntos[2]![0], triceps.sitio.cx - 16);
});

// ─── DL-113 · bíceps y cresta ilíaca en la figura ─────────────────────────────────────────────

const SEXOS = ['HOMBRE', 'MUJER'] as const;
const ENCUADRES = ['ENTERO', 'TREN_SUPERIOR', 'TREN_INFERIOR'] as const;
const todosLosPliegues = (encuadre: (typeof ENCUADRES)[number]) => new Map(TARJETAS_DE_PLIEGUES[encuadre].flat().map((k) => [k, valor(5, 'mm')]));
/**
 * Los sitios que de frente caen juntos por anatomía comparten lugar (`enUnMismoLugar`): sus guías llegan al mismo lugar.
 * Los puntos no se corren para separarlos (regla de Dirección, 2026-10-02), así que la holgura y los cruces se exigen
 * frente a todos los demás sitios, no entre los de un mismo lugar.
 */
const enElMismoLugar = enUnMismoLugar;
const cruzan = (a: readonly [number, number], b: readonly [number, number], c: readonly [number, number], d: readonly [number, number]) => {
  const lado = (p: readonly [number, number], q: readonly [number, number], r: readonly [number, number]) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return lado(a, b, c) !== lado(a, b, d) && lado(c, d, a) !== lado(c, d, b);
};

test('DL-113 · el bíceps y la cresta ilíaca tienen punto en cada figura que los muestra, y una fila con su guía', () => {
  for (const sexo of SEXOS) {
    for (const encuadre of ENCUADRES) {
      const esperados = encuadre === 'TREN_INFERIOR' ? ['pliegue-cresta-iliaca'] : [...PLIEGUES_SUMADOS_POR_BE];
      for (const clave of esperados) assert.ok(FIGURAS_DE_LA_LAMINA[sexo][encuadre].pliegues[clave as 'pliegue-biceps'], `${sexo} ${encuadre} ${clave}`);
      const c = componerMedicion(sexo, encuadre, 'PLIEGUES', todosLosPliegues(encuadre));
      const filas = c.tarjetas.flatMap((t) => t.filas);
      for (const clave of esperados) assert.ok(filas.some((f) => f.sitio.clave === clave && f.valor !== null), `${sexo} ${encuadre} ${clave}`);
      assert.equal(c.guias.length, filas.length);
    }
  }
});

test('DL-113 · Medición: las filas siguen la altura de sus sitios y ninguna guía se cruza ni pasa sobre otro punto', () => {
  for (const sexo of SEXOS) {
    for (const encuadre of ENCUADRES) {
      const c = componerMedicion(sexo, encuadre, 'PLIEGUES', todosLosPliegues(encuadre));
      for (const t of c.tarjetas) {
        const alturas = t.filas.map((f) => f.sitio.cy);
        assert.deepEqual(alturas, [...alturas].sort((a, b) => a - b), `${sexo} ${encuadre}: filas fuera de orden`);
      }
      const sitioDeLaGuia = (g: (typeof c.guias)[number]) => c.tarjetas.flatMap((t) => t.filas).find((f) => f.centro === g.puntos[0]![1])!.sitio;
      for (const [i, g] of c.guias.entries()) {
        for (const h of c.guias.slice(i + 1)) {
          if (enElMismoLugar(sitioDeLaGuia(g), sitioDeLaGuia(h))) continue;
          for (let a = 0; a < g.puntos.length - 1; a++) for (let b = 0; b < h.puntos.length - 1; b++) assert.ok(!cruzan(g.puntos[a]!, g.puntos[a + 1]!, h.puntos[b]!, h.puntos[b + 1]!), `${sexo} ${encuadre}: guías cruzadas`);
        }
      }
      const filas = c.tarjetas.flatMap((t) => t.filas);
      for (const g of c.guias) {
        const sitio = filas.find((f) => f.centro === g.puntos[0]![1])!.sitio;
        const propio = sitio.clave;
        for (const s of c.sitios.filter((x) => x.clave !== propio && !enElMismoLugar(x, sitio))) {
          for (let a = 1; a < g.puntos.length - 1; a++) assert.ok(distanciaAlTramo([s.cx, s.cy], g.puntos[a]!, g.puntos[a + 1]!) >= HOLGURA_DE_LA_GUIA, `${sexo} ${encuadre}: la guía de ${propio} pasa sobre ${s.clave}`);
        }
      }
    }
  }
});

test('DL-113 · Serie: ninguna guía pasa sobre el punto de otro pliegue; si hace falta, entra al sitio de costado', () => {
  for (const sexo of SEXOS) {
    for (const encuadre of ['TREN_SUPERIOR', 'TREN_INFERIOR'] as const) {
      const toma = todosLosPliegues(encuadre);
      const c = componerSerie(sexo, encuadre, 'PLIEGUES', [toma, toma]);
      for (const t of c.tarjetas) {
        const p = t.guia.puntos;
        // Siempre termina en la marca; con desvío, el último tramo es horizontal, a la altura del sitio.
        assert.deepEqual(p[p.length - 1], t.guia.marca);
        if (p.length === 4) assert.equal(p[2]![1], p[3]![1]);
        for (const s of c.sitios.filter((x) => x.punto !== null && x.clave !== t.sitio.clave && !enElMismoLugar(x, t.sitio))) {
          for (let a = 1; a < p.length - 1; a++) assert.ok(distanciaAlTramo([s.cx, s.cy], p[a]!, p[a + 1]!) >= HOLGURA_DE_LA_GUIA, `${sexo} ${encuadre}: la guía de ${t.sitio.clave} pasa sobre ${s.clave}`);
        }
      }
    }
  }
  // En el tren superior, la guía del pliegue del brazo que llega desde más abajo (en el hombre, el tríceps; en la mujer,
  // el bíceps, porque los dos están a la misma altura) pasaba por el punto del antebrazo: entra de costado.
  const toma = todosLosPliegues('TREN_SUPERIOR');
  const delBrazo = (sexo: 'HOMBRE' | 'MUJER', clave: string) => componerSerie(sexo, 'TREN_SUPERIOR', 'PLIEGUES', [toma, toma]).tarjetas.find((t) => t.sitio.clave === clave)!;
  assert.equal(delBrazo('HOMBRE', 'pliegue-triceps').guia.puntos.length, 4);
  assert.equal(delBrazo('MUJER', 'pliegue-biceps').guia.puntos.length, 4);
  // Los perímetros no necesitan desvío: sus guías quedan como en el compositor.
  const perimetros = componerSerie('HOMBRE', 'TREN_SUPERIOR', 'PERIMETROS', [ejemplo, ejemplo]);
  assert.ok(perimetros.tarjetas.every((t) => t.guia.puntos.length === 3));
});

test('DL-113 · apilar tarjetas: el compositor ordena por el borde de arriba; el teléfono, por la altura media de sus sitios', () => {
  // Las tarjetas de la figura del teléfono, hombre entero, 360 dp: una alta con sitios un poco más abajo (cresta ilíaca,
  // supraespinal y abdominal) y una baja con sitios más arriba (subescapular y antebrazo).
  const tarjetas = [
    { alto: 144, centroDeseado: 216.9 },
    { alto: 100, centroDeseado: 198.3 },
  ];
  const limites = { tope: 10, piso: 1000, separacion: 8 };
  const [altaPorBorde, bajaPorBorde] = apilarTarjetas(tarjetas, limites);
  assert.ok(altaPorBorde! < bajaPorBorde!, 'por defecto, el orden del compositor: primero el borde de arriba más alto');
  const [alta, baja] = apilarTarjetas(tarjetas, limites, 'CENTRO');
  assert.ok(baja! < alta!, 'por el centro, primero la tarjeta de los sitios más altos');
  assert.ok(alta! >= baja! + 100 + 8, 'y las tarjetas no se pisan');
  assert.deepEqual(apilarTarjetas(tarjetas, limites, 'BORDE'), [altaPorBorde, bajaPorBorde]);
});

test('DL-113 · el pie de Pliegues lleva las dos sumas del catálogo, la corrida más reciente de cada una, o nada', () => {
  const metodos = [
    { methodId: 'met-suma-6-pliegues-isak', methodVersionId: 'met-suma-6-pliegues-isak-v1', category: 'SUMAS_DE_PLIEGUES' as const },
    { methodId: 'met-suma-7-pliegues-jackson-pollock', methodVersionId: 'met-suma-7-pliegues-jackson-pollock-v1', category: 'SUMAS_DE_PLIEGUES' as const },
  ];
  const vieja = corrida('ev-1', 'suma-7-pliegues-jackson-pollock', 80);
  const nueva = corrida('ev-1', 'suma-7-pliegues-jackson-pollock', 82);
  const sumas = sumasDelPieDePliegues(resultadosDeLaToma([vieja, nueva], metodos, 'ev-1'));
  assert.deepEqual(
    sumas.map((s) => [s.rotulo, s.resultado?.valor.valor ?? null]),
    [
      ['Suma 6 pliegues (ISAK)', null],
      ['Suma 7 pliegues (JP)', 82],
    ],
  );
  // La franja de Serie ya no repite los dos pliegues que ahora tienen sitio.
  assert.deepEqual(FRANJA_DE_LA_SERIE.PLIEGUES.map((f) => f.clave), ['peso']);
});

test('el bloque de diámetros aparece solo si la toma tiene alguno, y lo que falta es «sin dato», no cero', () => {
  assert.deepEqual(diametrosDeLaToma(ejemplo), []);
  const conCodo = new Map([['diametro-humero', valor(8)]]);
  const bloque = diametrosDeLaToma(conCodo);
  assert.deepEqual(
    bloque.map((d) => [d.rotulo, d.valor?.valor ?? null]),
    [
      ['Codo', 8],
      ['Muñeca', null],
      ['Rodilla', null],
    ],
  );
});

// ─── Conclusiones ───────────────────────────────────────────────────────────────────────────────

test('Conclusiones · solo corridas vigentes de la toma, con su método y su categoría; orden del catálogo', () => {
  const metodos = [
    { methodId: 'met-imc', methodVersionId: 'met-imc-v1', category: 'INDICES' as const },
    { methodId: 'met-grasa-jackson-pollock-7', methodVersionId: 'met-grasa-jackson-pollock-7-v2', category: 'GRASA_CORPORAL' as const },
  ];
  const corridas = [
    corrida('ev-1', 'grasa-jackson-pollock-7', 10.1),
    corrida('ev-1', 'imc', 24.5),
    corrida('ev-1', 'masa-osea-rocha', 12.4, { effective: false, supersededByRunId: 'c-otra' }),
    corrida('ev-1', 'endomorfia', 2.1, { effective: false }),
    corrida('ev-2', 'imc', 25),
  ];
  const resultados = resultadosDeLaToma(corridas, metodos, 'ev-1');
  assert.deepEqual(
    resultados.map((r) => [r.metrica, r.categoria]),
    [
      ['imc', 'INDICES'],
      ['grasa-jackson-pollock-7', 'GRASA_CORPORAL'],
    ],
  );
  // La versión anterior de un método encuentra su categoría por el método.
  assert.equal(resultados[1]!.valor.decimales, 1);
  assert.equal(corridasSinEfecto(corridas, 'ev-1'), 2);
  assert.deepEqual(
    agruparPorCategoria(resultados).map((s) => s.categoria),
    ['INDICES', 'GRASA_CORPORAL'],
  );
  assert.deepEqual(resultadosDeLaToma(corridas, metodos, 'ev-3'), []);
});

test('Conclusiones · dos corridas vigentes del mismo método conviven: no se promedian ni se elige una', () => {
  const corridas = [corrida('ev-1', 'imc', 24.5), corrida('ev-1', 'imc', 24.7)];
  assert.equal(resultadosDeLaToma(corridas, [], 'ev-1').length, 2);
  assert.deepEqual(
    agruparPorCategoria(resultadosDeLaToma(corridas, [], 'ev-1')).map((s) => [s.categoria, s.resultados.length]),
    [[null, 2]],
  );
});

test('Conclusiones · una columna si entra; si no, dos; si tampoco, filas más bajas; y lo que no entra se cuenta', () => {
  const pocas = repartirConclusiones([3, 2]);
  assert.equal(pocas.columnas, 1);
  assert.deepEqual(
    pocas.tarjetas.map((t) => [t.y, t.alto]),
    [
      [236, 86 + 3 * 64 + 18],
      [236 + 86 + 3 * 64 + 18 + 24, 86 + 2 * 64 + 18],
    ],
  );
  const muchas = repartirConclusiones([3, 3, 10, 9, 3, 2]);
  assert.equal(muchas.columnas, 2);
  assert.equal(muchas.omitidas, 0);
  assert.ok(muchas.tarjetas.every((t) => t.y + t.alto <= 1790 && t.ancho === 476));
  const demasiadas = repartirConclusiones([40, 40]);
  assert.equal(demasiadas.altoDeFila, 50);
  assert.ok(demasiadas.omitidas > 0);
  assert.equal(demasiadas.omitidas + demasiadas.tarjetas.reduce((s, t) => s + t.filas, 0), 80);
});

// ─── Serie ──────────────────────────────────────────────────────────────────────────────────────

test('Serie · la diferencia es la última menos la primera toma con dato, solo entre valores comparables', () => {
  const s = serieDeValores([valor(40.2), null, valor(41.5)]);
  assert.deepEqual(s.resta, { delta: 1.3, unidad: 'cm', desde: 0, hasta: 2 });
  assert.equal(s.ultimo?.indice, 2);
  assert.equal(s.noComparables, false);

  const otroProtocolo = serieDeValores([valor(40.2, 'cm', 'otro-v1||cm'), valor(41.5)]);
  assert.equal(otroProtocolo.resta, null);
  assert.equal(otroProtocolo.noComparables, true);

  const una = serieDeValores([null, valor(9, 'mm')]);
  assert.equal(una.resta, null);
  assert.equal(una.noComparables, false);
  assert.equal(serieDeValores([null, null]).ultimo, null);
  // Sin ruido binario: 0,1 + 0,2 no da 0,30000000000000004.
  assert.equal(serieDeValores([valor(0.1), valor(0.4)]).resta?.delta, 0.3);
});

test('Serie · la línea une solo tomas consecutivas con dato y del mismo grupo: nada cruza un hueco', () => {
  assert.deepEqual(tramosDeLaSerie([valor(1), valor(2), null, valor(3), valor(4, 'cm', 'otro||cm')]), [[0, 1]]);
});

test('Serie · las tarjetas se reparten a los lados de la figura, con el alto del compositor y la guía hacia el sitio', () => {
  const tomas = [ejemplo, new Map([['perimetro-cuello', valor(38)]])];
  const c = componerSerie('HOMBRE', 'TREN_SUPERIOR', 'PERIMETROS', tomas);
  // Diez perímetros en el tren superior: cinco por columna.
  assert.equal(c.tarjetas.length, 10);
  const izquierda = c.tarjetas.filter((t) => t.lado === 'IZQUIERDA');
  assert.equal(izquierda.length, 5);
  assert.ok(izquierda.every((t) => t.x === 34 && t.alto === altoDeTarjetaEnSerie(5)));
  assert.ok(c.tarjetas.filter((t) => t.lado === 'DERECHA').every((t) => t.x === 762));
  // Los del brazo van a la izquierda.
  assert.ok(izquierda.some((t) => t.sitio.clave === 'perimetro-muneca'));
  const cuello = c.tarjetas.find((t) => t.sitio.clave === 'perimetro-cuello')!;
  assert.deepEqual(cuello.serie.resta, { delta: 0.5, unidad: 'cm', desde: 0, hasta: 1 });
  // La guía sale 30 px debajo del borde y termina 7 px por fuera del anillo, del lado de la tarjeta.
  const anillo = cuello.sitio.anillo!;
  const destino = cuello.guia.puntos[2]!;
  assert.equal(cuello.guia.puntos[0]![1], cuello.y + 30);
  assert.equal(destino[0], cuello.lado === 'IZQUIERDA' ? anillo.cx - anillo.rx - 7 : anillo.cx + anillo.rx + 7);
  assert.deepEqual(cuello.guia.marca, destino);
  assert.deepEqual(c.fueraDelEncuadre, ['perimetro-muslo', 'perimetro-pantorrilla', 'perimetro-tobillo']);
});

test('Serie · un sitio sin dato en ninguna toma no se dibuja', () => {
  const c = componerSerie('MUJER', 'TREN_INFERIOR', 'PLIEGUES', [new Map([['pliegue-pantorrilla', valor(9, 'mm')]]), new Map()]);
  assert.deepEqual(
    c.sitios.map((s) => s.clave),
    ['pliegue-pantorrilla'],
  );
  assert.equal(c.tarjetas[0]!.alto, 348);
});

test('Serie · la escala del gráfico es la del compositor', () => {
  assert.equal(redondoHaciaArriba(9.2), 10);
  assert.equal(redondoHaciaArriba(13.8), 15);
  assert.equal(redondoHaciaArriba(0), 1);
  assert.deepEqual(escalaDelGrafico([4, 8], true), { bajo: 0, alto: 10 });
  const e = escalaDelGrafico([76, 78], false)!;
  // rango = máx(2; 3 % de 78 = 2,34; 0,6) = 2,34 → 78 + 0,819 y 76 − 0,819.
  assert.ok(Math.abs(e.alto - 78.819) < 1e-9 && Math.abs(e.bajo - 75.181) < 1e-9);
  assert.equal(escalaDelGrafico([], false), null);
});

test('Serie · «Evolución» lleva peso y cintura, y un resultado por método y versión, en orden del catálogo', () => {
  const tomas = [
    { evaluacionId: 'ev-1', valores: new Map([['peso', valor(76.85, 'kg', 'proto-v1||kg')]]) },
    { evaluacionId: 'ev-2', valores: new Map([['peso', valor(77.4, 'kg', 'proto-v1||kg')]]) },
  ];
  const metodos = [
    { methodId: 'met-grasa-faulkner', methodVersionId: 'met-grasa-faulkner-v1', category: 'GRASA_CORPORAL' as const },
    { methodId: 'met-imc', methodVersionId: 'met-imc-v1', category: 'INDICES' as const },
  ];
  const corridas = [
    corrida('ev-1', 'grasa-faulkner', 12.3),
    corrida('ev-2', 'grasa-faulkner', 11.9),
    corrida('ev-2', 'imc', 24.6),
    corrida('ev-2', 'grasa-faulkner', 12, { methodVersionId: 'met-grasa-faulkner-v2', methodVersion: '2' }),
  ];
  const series = seriesDeEvolucion(tomas, corridas, metodos);
  assert.deepEqual(
    series.map((s) => s.clave),
    ['medicion:peso', 'calculo:met-imc-v1|%|imc', 'calculo:met-grasa-faulkner-v1|%|grasa-faulkner', 'calculo:met-grasa-faulkner-v2|%|grasa-faulkner'],
  );
  const faulkner = series[2]!;
  assert.equal(faulkner.desdeCero, true);
  assert.deepEqual(faulkner.serie.resta, { delta: -0.4, unidad: '%', desde: 0, hasta: 1 });
  // Otra versión del método es otra serie: no se resta contra la primera.
  assert.equal(series[3]!.serie.resta, null);
  assert.equal(repartirEvolucion(6)[5]!.alto, 436);
  assert.equal(repartirEvolucion(8)[7]!.y + repartirEvolucion(8)[7]!.alto <= 1770, true);
});

test('Serie · por defecto, las cuatro tomas más recientes, numeradas por fecha', () => {
  const tomas = ['2026-03-01', '2026-01-10', '2026-07-29', '2026-05-02', '2026-06-15'].map((d, i) => ({ evaluationId: `ev-${i}`, occurredAt: `${d}T12:00:00.000Z` }));
  assert.deepEqual(tomasPorDefecto(tomas), ['ev-0', 'ev-3', 'ev-4', 'ev-2']);
});

// ─── Archivo, texto y geometría ─────────────────────────────────────────────────────────────────

test('el nombre del PNG dice la fecha, la lámina y el encuadre', () => {
  assert.equal(nombreDelArchivoDeLaLamina({ modo: 'MEDICION', hoja: 'CIRCUNFERENCIAS', encuadre: 'ENTERO', fechas: ['2026-07-29'] }), 'lamina-2026-07-29-circunferencias-entero.png');
  assert.equal(nombreDelArchivoDeLaLamina({ modo: 'MEDICION', hoja: 'CONCLUSIONES', encuadre: 'TREN_INFERIOR', fechas: ['2026-07-29'] }), 'lamina-2026-07-29-conclusiones.png');
  assert.equal(
    nombreDelArchivoDeLaLamina({ modo: 'SERIE', hoja: 'PLIEGUES', encuadre: 'ENTERO', fechas: ['2026-05-01', '2026-06-01', '2026-07-29'] }),
    'lamina-serie-2026-05-01-a-2026-07-29-pliegues-tren-superior.png',
  );
  assert.equal(nombreDelArchivoDeLaLamina({ modo: 'SERIE', hoja: 'CONCLUSIONES', encuadre: 'TREN_INFERIOR', fechas: ['2026-07-29'] }), 'lamina-serie-2026-07-29-evolucion.png');
});

test('cortar y partir texto con una medida dada', () => {
  const medir = (t: string) => t.length * 10;
  assert.equal(recortarTexto('Antebrazo', 100, medir), 'Antebrazo');
  assert.equal(recortarTexto('Pliegue de la cresta ilíaca', 100, medir), 'Pliegue d…');
  assert.deepEqual(partirEnLineas('Masa muscular esquelética de Lee', 150, medir), ['Masa muscular', 'esquelética de', 'Lee']);
  assert.deepEqual(partirEnLineas('uno dos tres cuatro cinco', 90, medir, 2), ['uno dos', 'tres cua…']);
});

test('el degradado de 163° del tema claro cruza el lienzo de esquina a esquina, como en CSS', () => {
  const l = lineaDelDegradado(163, 1080, 1920);
  const largo = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
  const esperado = 1080 * Math.abs(Math.sin((163 * Math.PI) / 180)) + 1920 * Math.abs(Math.cos((163 * Math.PI) / 180));
  assert.ok(Math.abs(largo - esperado) < 1e-6);
  assert.ok(l.y1 < 0 && l.y2 > 1920 && l.x1 < l.x2);
});

test('las capas del anillo toman la opacidad del tema (gA, gB) y la propia del tema oscuro', () => {
  const resplandorDelantero = DIBUJO_EN_MEDICION.anillo.encima[1]!;
  assert.equal(opacidadDeLaCapa(resplandorDelantero, COLORES_DE_LA_FIGURA.CLARO), 0.12);
  const trasero = DIBUJO_EN_MEDICION.anillo.encima[0]!;
  assert.equal(opacidadDeLaCapa(trasero, COLORES_DE_LA_FIGURA.CLARO), 0.3);
  assert.equal(opacidadDeLaCapa(trasero, COLORES_DE_LA_FIGURA.OSCURO), 0.45);
});

test('la grilla del piso: ocho elipses y, en Medición, quince rayos', () => {
  const medicionGrilla = grillaDelPiso({ altoDelCuerpo: 1270, centroX: 840, arriba: 408, conPiso: true }, 'MEDICION');
  assert.equal(medicionGrilla.elipses.length, 8);
  assert.equal(medicionGrilla.rayos.length, 15);
  assert.equal(medicionGrilla.elipses[7]!.rx, 1290);
  assert.equal(grillaDelPiso({ altoDelCuerpo: 820, centroX: 540, arriba: 560, conPiso: false }, 'SERIE').rayos.length, 0);
});

// ─── Colores: sin «mejor» ni «peor», y con contraste ────────────────────────────────────────────

/** Los colores de variación del compositor (`DCOL.good` y `DCOL.bad`): la lámina de BE no los usa en ningún tema. */
const COLORES_QUE_CALIFICAN = ['#149A54', '#E0662F', '#4ADE80', '#FBA34B', '#8CF2B8', '#FFC08A'];

test('ningún color de la lámina es de «mejoró» o «empeoró» (DCOL): la diferencia va en el color neutro', () => {
  const todo = JSON.stringify(COLORES_DE_LA_LAMINA).toUpperCase();
  assert.deepEqual(
    COLORES_QUE_CALIFICAN.filter((c) => todo.includes(c)),
    [],
  );
});

test('los tres temas declaran los mismos colores', () => {
  // La viñeta y la sombra de la etiqueta pueden faltar en un tema (`null`): se compara que estén declaradas.
  const opcionales = ['vineta.', 'etiqueta.sombra.'];
  const claves = (o: unknown, prefijo = ''): string[] =>
    o && typeof o === 'object' && !Array.isArray(o)
      ? Object.entries(o)
          .flatMap(([k, v]) => [`${prefijo}${k}`, ...claves(v, `${prefijo}${k}.`)])
          .filter((k) => !opcionales.some((p) => k.startsWith(p)))
      : [];
  const claro = claves(COLORES_DE_LA_LAMINA.CLARO).sort();
  assert.deepEqual(claves(COLORES_DE_LA_LAMINA.OSCURO).sort(), claro);
  assert.deepEqual(claves(COLORES_DE_LA_LAMINA.AZUL).sort(), claro);
});

// WCAG 2.2 (la misma cuenta que scripts/contraste.test.cjs), con las transparencias compuestas sobre su fondo.
type Rgb = readonly [number, number, number];
function leerColor(color: string): { rgb: Rgb; alfa: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const v = parseInt(hex[1]!, 16);
    return { rgb: [v >> 16, (v >> 8) & 255, v & 255], alfa: 1 };
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color);
  if (!rgba) throw new Error(`Color que la prueba no sabe leer: ${color}`);
  return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alfa: rgba[4] === undefined ? 1 : Number(rgba[4]) };
}
const sobre = (color: string, fondo: Rgb): Rgb => {
  const { rgb, alfa } = leerColor(color);
  return [0, 1, 2].map((i) => rgb[i]! * alfa + fondo[i]! * (1 - alfa)) as unknown as Rgb;
};
const lineal = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminancia = (c: Rgb) => 0.2126 * lineal(c[0]) + 0.7152 * lineal(c[1]) + 0.0722 * lineal(c[2]);
const contraste = (a: Rgb, b: Rgb) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro! + 0.05) / (oscuro! + 0.05);
};

/** Un degradé evaluado en `t` (de 0 a 1), con su opacidad. */
function enParadas(paradas: ColoresDeLaLamina['aura'], t: number): { rgb: Rgb; alfa: number } {
  const ultima = paradas[paradas.length - 1]!;
  if (t >= ultima.en) return leerColor(ultima.color);
  const j = Math.max(1, paradas.findIndex((p) => p.en >= t));
  const [a, b] = [paradas[j - 1]!, paradas[j]!];
  const f = b.en === a.en ? 0 : Math.max(0, Math.min(1, (t - a.en) / (b.en - a.en)));
  const [ca, cb] = [leerColor(a.color), leerColor(b.color)];
  return { rgb: [0, 1, 2].map((i) => ca.rgb[i]! + (cb.rgb[i]! - ca.rgb[i]!) * f) as unknown as Rgb, alfa: ca.alfa + (cb.alfa - ca.alfa) * f };
}

/** El color del fondo en un punto del lienzo, como lo pinta CSS: la proyección sobre la línea del degradé. */
function fondoEn(c: ColoresDeLaLamina, x: number, y: number): Rgb {
  const { x1, y1, x2, y2 } = lineaDelDegradado(c.fondo.angulo, 1080, 1920);
  const [dx, dy] = [x2 - x1, y2 - y1];
  return enParadas(c.fondo.paradas, Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))).rgb;
}

/**
 * Lo que puede haber detrás de un texto. El fondo es un degradé: se mide en cada parada (sus extremos). Y el aura, que
 * aclara, pesa debajo de textos solo en Conclusiones: está arriba al centro (centro (540, 310), radios 520 × 310, al
 * 60 %), detrás del título y de las primeras tarjetas; se mide en una grilla de su zona, con su caída radial. En las
 * otras láminas el aura queda detrás de la figura.
 */
function fondosDePrueba(c: ColoresDeLaLamina): Rgb[] {
  const zona: Rgb[] = [];
  for (let x = 20; x <= 1060; x += 40) {
    for (let y = 0; y <= 620; y += 40) {
      const aura = enParadas(c.aura, Math.hypot((x - 540) / 520, (y - 310) / 310));
      zona.push(sobre(`rgba(${aura.rgb.map(Math.round).join(',')},${aura.alfa * 0.6})`, fondoEn(c, x, y)));
    }
  }
  return [...c.fondo.paradas.map((p) => leerColor(p.color).rgb), ...zona];
}

/** Cada texto de la lámina sobre lo que tiene detrás. Las tarjetas de vidrio son translúcidas: se componen sobre cada fondo. */
function paresDeTexto(c: ColoresDeLaLamina): [string, string, Rgb[]][] {
  const fondos = fondosDePrueba(c);
  const tarjetas = fondos.flatMap((f) => c.tarjeta.relleno.map((r) => sobre(r, f)));
  const sobreCada = (relleno: string, debajo: Rgb[]) => debajo.map((d) => sobre(relleno, d));
  return [
    ['título', c.encabezado.titulo, c.encabezado.estilo === 'LIMPIO' ? fondos : tarjetas],
    ['línea de nombre', c.encabezado.subtitulo, fondos],
    ['fecha en píldora', c.encabezado.fechaEnPildora, tarjetas],
    ['etiqueta del encuadre', c.etiqueta.texto, sobreCada(c.etiqueta.fondo, fondos)],
    ['rótulo de fila', c.fila.rotulo, tarjetas],
    ['rótulo de fila posterior', c.fila.rotuloPosterior, tarjetas],
    ['valor de fila', c.fila.valor, tarjetas],
    ['unidad de fila', c.fila.unidad, tarjetas],
    ['marca «posterior»', c.marcaPosterior.texto, sobreCada(c.marcaPosterior.fondo, tarjetas)],
    ['rótulo de bloque', c.rotuloDeBloque, fondos],
    ['rótulo del pie', c.pie.rotulo, [...tarjetas, ...fondos]],
    ['valor del pie', c.pie.valor, tarjetas],
    ['título de tarjeta', c.tarjetaTitulo, tarjetas],
    ['firma', c.firma, fondos],
    ['conclusiones · título', c.conclusiones.titulo, tarjetas],
    ['conclusiones · rótulo', c.conclusiones.rotulo, tarjetas],
    ['conclusiones · método', c.conclusiones.rotuloSuave, tarjetas],
    ['conclusiones · valor', c.conclusiones.valor, tarjetas],
    ['conclusiones · valor oscuro', c.conclusiones.valorTinta, tarjetas],
    ['conclusiones · unidad', c.conclusiones.unidad, tarjetas],
    ['serie · chip', c.serie.chip.texto, c.serie.chip.fondo ? sobreCada(c.serie.chip.fondo, tarjetas) : tarjetas],
    ['serie · chip de la última toma', c.serie.chip.textoActivo, [leerColor(c.serie.chip.fondoActivo).rgb]],
    ['serie · fecha', c.serie.fecha, tarjetas],
    ['serie · fecha de la última toma', c.serie.fechaActiva, tarjetas],
    ['serie · acento', c.serie.acento, tarjetas],
    ['serie · nombre', c.serie.nombre, tarjetas],
    ['serie · valor', c.serie.valor, tarjetas],
    ['serie · unidad', c.serie.unidad, tarjetas],
    ['serie · rótulo', c.serie.rotulo, tarjetas],
    ['serie · valores', c.serie.valores.texto, sobreCada(c.serie.valores.fondo, tarjetas)],
    ['serie · diferencia en su píldora', c.serie.diferencia.texto, sobreCada(c.serie.diferencia.fondo, tarjetas)],
    ['serie · diferencia sobre la tarjeta', c.serie.diferencia.texto, tarjetas],
    ['serie · rótulos del gráfico', c.serie.grafico.rotulo, tarjetas],
    ['serie · valores del gráfico', c.serie.grafico.valor, tarjetas],
  ];
}

for (const [tema, colores] of Object.entries(COLORES_DE_LA_LAMINA)) {
  test(`contraste · tema ${tema.toLowerCase()}: cada texto de la lámina llega a 4,5:1 sobre lo que tiene detrás`, () => {
    const fallas = paresDeTexto(colores).flatMap(([nombre, texto, fondos]) =>
      fondos.flatMap((f) => {
        const relacion = contraste(sobre(texto, f), f);
        return relacion < 4.5 ? [`${nombre}: ${texto} sobre rgb(${f.map((x) => Math.round(x)).join(',')}) = ${relacion.toFixed(2)}:1`] : [];
      }),
    );
    assert.deepEqual([...new Set(fallas)], []);
  });
}
