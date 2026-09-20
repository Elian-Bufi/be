/**
 * Los siete oráculos TEST-CAL del 11A, que hasta WP-05 eran un título de una línea cada uno (11A:592-598), más las
 * reglas del 06 §20.3 que los sostienen. Cada prueba cita lo que verifica.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  admiteFinalidad,
  coexisten,
  ejecutar,
  evaluarAdmisibilidad,
  evaluarAdopcion,
  seleccionabilidad,
  type DatoPropuesto,
  type EspecificacionDeMetodo,
} from './calculo';

/** MET-DEMO v1, el del catálogo sintético: admitía el peso informado por la persona y declaraba dos decimales. */
const V1: EspecificacionDeMetodo = {
  finalidades: ['SOPORTE_ANTROPOMETRICO', 'SOPORTE_DE_OBJETIVO_NUTRICIONAL'],
  entradas: [
    { codigo: 'PESO', metrica: 'peso', unidadesAdmitidas: ['kg'], procedenciasAdmitidas: ['CAPTURA_DIRECTA', 'AUTORREPORTE'] },
    { codigo: 'TALLA', metrica: 'talla', unidadesAdmitidas: ['m'], procedenciasAdmitidas: ['CAPTURA_DIRECTA'] },
  ],
  salida: { metrica: 'indice-demo', unidad: 'kg/m2' },
  precision: { decimales: 2, modo: 'MEDIO_ARRIBA' },
  regla: 'demo/peso-sobre-talla-cuadrado@1',
};

/**
 * v2 sucede a v1 con la **misma regla**: lo que cambió es que dejó de admitir el peso informado por la persona, se
 * restringió a la finalidad antropométrica y declaró tres decimales. Un cambio metodológico no es necesariamente un
 * cambio de fórmula.
 */
const V2: EspecificacionDeMetodo = {
  ...V1,
  finalidades: ['SOPORTE_ANTROPOMETRICO'],
  entradas: [
    { codigo: 'PESO', metrica: 'peso', unidadesAdmitidas: ['kg'], procedenciasAdmitidas: ['CAPTURA_DIRECTA'] },
    { codigo: 'TALLA', metrica: 'talla', unidadesAdmitidas: ['m'], procedenciasAdmitidas: ['CAPTURA_DIRECTA'] },
  ],
  precision: { decimales: 3, modo: 'MEDIO_ARRIBA' },
};

const dato = (p: Partial<DatoPropuesto> & Pick<DatoPropuesto, 'codigo' | 'metrica'>): DatoPropuesto => ({
  medicionId: `m-${p.codigo}`,
  magnitud: { valor: 1, unidad: 'kg' },
  origen: 'CAPTURA_DIRECTA',
  vigente: true,
  ...p,
});

/** `DatoPropuesto.magnitud` es anulable (cadena de correcciones no resoluble); acá las fijas son siempre valores. */
const MAG_PESO = { valor: 72.5, unidad: 'kg' } as const;
const MAG_TALLA = { valor: 1.75, unidad: 'm' } as const;
const PESO = dato({ codigo: 'PESO', metrica: 'peso', magnitud: MAG_PESO });
const TALLA = dato({ codigo: 'TALLA', metrica: 'talla', magnitud: MAG_TALLA });

// ─── TEST-CAL-001 · versión exacta de método ────────────────────────────────────────────────────

test('TEST-CAL-001 · REG-06-203: publicar una versión nueva no vuelve seleccionable ni reescribe a la anterior', () => {
  // La v1 tiene sucesora: histórica, y sigue existiendo para explicar las corridas que la citan.
  assert.equal(seleccionabilidad(true), 'HISTORICO_NO_SELECCIONABLE');
  assert.equal(seleccionabilidad(false), 'SELECCIONABLE');

  // La corrida hecha con v1 conserva el resultado de v1, aunque v2 ya exista y dé otro número.
  const conV1 = ejecutar(V1, [
    { medicionId: 'm1', metrica: 'peso', magnitud: MAG_PESO },
    { medicionId: 'm2', metrica: 'talla', magnitud: MAG_TALLA },
  ]);
  const conV2 = ejecutar(V2, [
    { medicionId: 'm1', metrica: 'peso', magnitud: MAG_PESO },
    { medicionId: 'm2', metrica: 'talla', magnitud: MAG_TALLA },
  ]);
  assert.ok(conV1.ok && conV2.ok);
  assert.equal(conV1.magnitud.valor, 23.67);
  assert.equal(conV2.magnitud.valor, 23.673);
  // Mismo número crudo, distinta precisión declarada: por eso la precisión viaja con la corrida (REG-06-158).
  assert.notEqual(conV1.magnitud.valor, conV2.magnitud.valor);
  assert.equal(conV1.precision.decimales, 2);
  assert.equal(conV2.precision.decimales, 3);
  assert.equal(conV1.regla, conV2.regla);
});

// ─── TEST-CAL-002 · disponible ≠ admisible ──────────────────────────────────────────────────────

test('TEST-CAL-002 · REG-06-204: un dato existente con procedencia no admisible no produce una ejecución', () => {
  const informado = { ...PESO, origen: 'AUTORREPORTE' as const };
  const conV2 = evaluarAdmisibilidad(V2, [informado, TALLA]);
  assert.equal(conV2.admisible, false);
  assert.deepEqual(
    conV2.admisible === false ? conV2.problemas : [],
    [{ motivo: 'PROCEDENCIA_NO_ADMITIDA', codigo: 'PESO' }],
  );
  // El mismo dato era admisible para la v1: la admisibilidad es de la versión, no del dato (REG-06-204).
  assert.equal(evaluarAdmisibilidad(V1, [informado, TALLA]).admisible, true);
});

test('REG-06-204 · falta de entrada, unidad ajena, métrica cruzada y entrada anulada tampoco alcanzan', () => {
  const soloPeso = evaluarAdmisibilidad(V2, [PESO]);
  assert.deepEqual(soloPeso.admisible === false ? soloPeso.problemas : [], [{ motivo: 'ENTRADA_FALTANTE', codigo: 'TALLA' }]);

  const enCentimetros = evaluarAdmisibilidad(V2, [PESO, { ...TALLA, magnitud: { valor: 175, unidad: 'cm' } }]);
  assert.deepEqual(enCentimetros.admisible === false ? enCentimetros.problemas : [], [{ motivo: 'UNIDAD_NO_ADMITIDA', codigo: 'TALLA' }]);

  // La conversión no es automática: convertir es un acto explícito y reproducible (REG-06-155).
  const cruzada = evaluarAdmisibilidad(V2, [{ ...PESO, metrica: 'talla' }, TALLA]);
  assert.ok(cruzada.admisible === false && cruzada.problemas.some((p) => p.motivo === 'METRICA_NO_CORRESPONDE'));

  // REG-06-217: una medición anulada dejó de contar, también como entrada de un cálculo.
  const anulada = evaluarAdmisibilidad(V2, [{ ...PESO, vigente: false }, TALLA]);
  assert.deepEqual(anulada.admisible === false ? anulada.problemas : [], [{ motivo: 'ENTRADA_NO_VIGENTE', codigo: 'PESO' }]);
});

/**
 * REG-06-16. El cálculo usa el valor que rige, no el que se tomó primero. Cuando la cadena de correcciones no se
 * resuelve —una rama, un ciclo, un eslabón que falta— no hay valor vigente, y eso es una inadmisibilidad: caer en el
 * original produciría un derivado de un valor que el profesional ya corrigió, con la firma de un cálculo reproducible.
 */
test('REG-06-16 · sin valor vigente resoluble no se calcula, y no se cae en el original', () => {
  const sinVigente = evaluarAdmisibilidad(V2, [{ ...PESO, magnitud: null }, TALLA]);
  assert.deepEqual(sinVigente.admisible === false ? sinVigente.problemas : [], [{ motivo: 'VALOR_VIGENTE_NO_RESOLUBLE', codigo: 'PESO' }]);

  // No se arma ninguna entrada con esa medición: no hay con qué ejecutar, y no se completa con nada.
  assert.equal(sinVigente.admisible, false);
});

test('REG-06-203 · una versión no se usa para una finalidad que no declara', () => {
  assert.equal(admiteFinalidad(V2, 'SOPORTE_DE_OBJETIVO_NUTRICIONAL'), false);
  assert.equal(admiteFinalidad(V1, 'SOPORTE_DE_OBJETIVO_NUTRICIONAL'), true);
  assert.equal(admiteFinalidad(V2, 'SOPORTE_ANTROPOMETRICO'), true);
});

// ─── TEST-CAL-004 y 005 · varias corridas coexisten, sin promedio ni ganadora ───────────────────

test('TEST-CAL-004 y TEST-CAL-005 · REG-06-205: las corridas coexisten tal como están', () => {
  const a = { ejecucionId: 'run-a', valor: 23.67 };
  const b = { ejecucionId: 'run-b', valor: 24.1 };
  const listadas = coexisten([a, b]);
  // Ni promedio, ni orden por «mejor», ni una marcada ganadora: salen las dos, en el orden en que entraron.
  assert.deepEqual(listadas, [a, b]);
  assert.equal(listadas.length, 2);
});

// ─── TEST-CAL-006 y 007 · referencia ≠ decisión ─────────────────────────────────────────────────

test('TEST-CAL-006 · REG-06-207: adoptar sucede a la referencia anterior y no la borra', () => {
  const corrida = { ejecucionId: 'run-b', asesoradoId: 'ase-1', finalidad: 'SOPORTE_ANTROPOMETRICO' as const };
  const contexto = { asesoradoId: 'ase-1', finalidad: 'SOPORTE_ANTROPOMETRICO' as const };

  // Primera adopción: no sucede a nada.
  assert.deepEqual(evaluarAdopcion(corrida, { ...contexto, actual: null, expectedVersion: null }), { adopta: true, sucedeA: null });

  // Reemplazo: sucede a la referencia vigente, que se conserva.
  const actual = { referenciaId: 'ref-1', ejecucionId: 'run-a', finalidad: 'SOPORTE_ANTROPOMETRICO' as const, version: 'v1' };
  assert.deepEqual(evaluarAdopcion(corrida, { ...contexto, actual, expectedVersion: 'v1' }), { adopta: true, sucedeA: 'ref-1' });

  // Con un token desactualizado no se pisa la decisión de otro momento.
  assert.deepEqual(evaluarAdopcion(corrida, { ...contexto, actual, expectedVersion: null }), { adopta: false, motivo: 'VERSION_DESACTUALIZADA' });

  // Adoptar la que ya es referencia no crea una relación nueva: no hubo cambio que registrar.
  assert.deepEqual(evaluarAdopcion({ ...corrida, ejecucionId: 'run-a' }, { ...contexto, actual, expectedVersion: 'v1' }), { adopta: false, motivo: 'YA_ES_LA_REFERENCIA' });
});

test('REG-06-207 · la referencia no cruza personas ni finalidades', () => {
  const corrida = { ejecucionId: 'run-a', asesoradoId: 'ase-1', finalidad: 'SOPORTE_ANTROPOMETRICO' as const };
  assert.deepEqual(
    evaluarAdopcion(corrida, { asesoradoId: 'ase-2', finalidad: 'SOPORTE_ANTROPOMETRICO', actual: null, expectedVersion: null }),
    { adopta: false, motivo: 'OTRO_ASESORADO' },
  );
  assert.deepEqual(
    evaluarAdopcion(corrida, { asesoradoId: 'ase-1', finalidad: 'SOPORTE_DE_OBJETIVO_NUTRICIONAL', actual: null, expectedVersion: null }),
    { adopta: false, motivo: 'FINALIDAD_NO_COMPATIBLE' },
  );
});

test('TEST-CAL-007 · INV-06-05: el resultado de adoptar es una relación, no un objetivo ni una prescripción', () => {
  const r = evaluarAdopcion(
    { ejecucionId: 'run-a', asesoradoId: 'ase-1', finalidad: 'SOPORTE_ANTROPOMETRICO' },
    { asesoradoId: 'ase-1', finalidad: 'SOPORTE_ANTROPOMETRICO', actual: null, expectedVersion: null },
  );
  // Lo que devuelve la adopción es a quién sucede. No hay ningún campo por donde salga una decisión clínica.
  assert.deepEqual(Object.keys(r).sort(), ['adopta', 'sucedeA']);
  const ejecucion = ejecutar(V1, [
    { medicionId: 'm1', metrica: 'peso', magnitud: MAG_PESO },
    { medicionId: 'm2', metrica: 'talla', magnitud: MAG_TALLA },
  ]);
  assert.ok(ejecucion.ok);
  assert.deepEqual(Object.keys(ejecucion).sort(), ['magnitud', 'ok', 'precision', 'regla']);
});

// ─── Reproducibilidad (REG-06-156) ──────────────────────────────────────────────────────────────

test('REG-06-156 · una regla que no está en el catálogo no ejecuta nada, y un resultado imposible tampoco', () => {
  const inventada = ejecutar({ ...V1, regla: 'otra/cosa@1' }, [
    { medicionId: 'm1', metrica: 'peso', magnitud: MAG_PESO },
    { medicionId: 'm2', metrica: 'talla', magnitud: MAG_TALLA },
  ]);
  assert.deepEqual(inventada, { ok: false, motivo: 'NO_REPRODUCIBLE', detalle: 'la regla otra/cosa@1 no está en el catálogo' });

  const talla0 = ejecutar(V1, [
    { medicionId: 'm1', metrica: 'peso', magnitud: MAG_PESO },
    { medicionId: 'm2', metrica: 'talla', magnitud: { valor: 0, unidad: 'm' } },
  ]);
  assert.ok(!talla0.ok && talla0.motivo === 'NO_REPRODUCIBLE');
});

test('REG-06-159 · la entrada se vincula por identificador declarado, nunca por posición', () => {
  // Las mismas dos entradas en orden invertido producen el mismo resultado y las mismas dependencias.
  const directo = evaluarAdmisibilidad(V1, [PESO, TALLA]);
  const invertido = evaluarAdmisibilidad(V1, [TALLA, PESO]);
  assert.ok(directo.admisible && invertido.admisible);
  assert.deepEqual(
    directo.entradas.map((e) => e.medicionId),
    invertido.entradas.map((e) => e.medicionId),
  );
  // Declarar dos veces el mismo código es un error, no una preferencia por la última.
  const duplicada = evaluarAdmisibilidad(V1, [PESO, TALLA, { ...PESO, medicionId: 'otra' }]);
  assert.ok(duplicada.admisible === false && duplicada.problemas.some((p) => p.motivo === 'ENTRADA_DUPLICADA'));
  // Un código que el método no declara tampoco se ignora en silencio.
  const desconocida = evaluarAdmisibilidad(V1, [PESO, TALLA, dato({ codigo: 'PLIEGUE', metrica: 'pliegue' })]);
  assert.ok(desconocida.admisible === false && desconocida.problemas.some((p) => p.motivo === 'ENTRADA_DESCONOCIDA'));
});
