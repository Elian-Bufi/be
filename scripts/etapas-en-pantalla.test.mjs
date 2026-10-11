/**
 * La comparación de dos etapas en pantalla (WP-ESCRITORIO-AMABLE, C-12; `apps/web/src/app/pro/advisees/seguimiento/
 * etapas-en-pantalla.ts`):
 * - la cobertura se dice una vez por etapa: la que comparten más métricas va en la tarjeta, y una métrica con otra
 *   cobertura la dice en su celda; ninguna se pierde ni se funde con otra;
 * - las frases son las del dominio, sin reescribir ni reordenar; lo que no coincide con la etapa va con la cobertura;
 * - cada tarjeta ofrece las etapas que dejan a A como la más antigua, y nunca la de la otra tarjeta;
 * - cómo terminó una etapa se dice con la versión que la reemplazó, si se la conoce.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { coberturaDeLaEtapa, enumerar, etapasElegibles, finDeLaEtapa, partesDeLaEtapa, versionDeLaEtapa } = await import('../apps/web/src/app/pro/advisees/seguimiento/etapas-en-pantalla.ts');

const dia = (f) => `«${f}»`;
const etapa = (n, desde, ultimoDia, extra = {}) => ({
  planVersionId: `plan-${n}`,
  dominio: 'NUTRITION',
  etiqueta: `v${n}`,
  activadaEl: `${desde}T12:00:00.000Z`,
  finalizadaEl: ultimoDia ? `${ultimoDia}T12:00:00.000Z` : null,
  motivoDeFin: ultimoDia ? 'SUCCESSOR_ACTIVATED' : null,
  desde,
  corte: null,
  ultimoDia: ultimoDia ?? '2026-10-11',
  abierta: !ultimoDia,
  dias: 10,
  duracionMs: 1,
  ...extra,
});
const V1 = etapa(1, '2026-07-20', '2026-09-05');
const V2 = etapa(2, '2026-09-06', '2026-09-20');
const V3 = etapa(3, '2026-09-21', null);

/** Un resumen por días (nutrición), como lo arma `resumirPeriodo`. */
const porDias = (regla, n, extra = {}) => ({
  desde: V1.desde,
  hasta: V1.ultimoDia,
  duracionDias: 48,
  regla,
  valor: 1200,
  n,
  observaciones: 44,
  sinValor: 0,
  dias: { sinRegistros: 4, sinCantidades: 0, sinDatoDelNutriente: 0, hoyEnCurso: false },
  parciales: 0,
  incompletos: 0,
  primero: null,
  ultimo: null,
  tramo: null,
  ...extra,
});
const resumenDeEtapa = (resumen, extra = {}) => ({ etapa: V1, lente: 'FECHAS_DE_LA_ETAPA', rango: { desde: V1.desde, hasta: V1.ultimoDia }, recortada: false, resumen, motivoSinResumen: null, deOtraVersion: 0, fueraDeLasFechas: 0, ...extra });

test('las partes de una etapa son las del dominio, más lo que no coincide con la etapa', () => {
  const media = resumenDeEtapa(porDias('MEDIA_DE_DIAS_CON_DATOS', 44, { parciales: 6 }), { deOtraVersion: 1 });
  assert.deepEqual(partesDeLaEtapa(media, dia), ['48 días: 44 con valor', 'de ellos, 6 son subtotales (falta algún dato)', '4 sin registros', '1 día con registros asociados a otra versión']);
  // Las fechas de la etapa están en su tarjeta: no se repiten en la cobertura.
  assert.ok(!partesDeLaEtapa(media, dia).some((p) => p.includes('«')));
  // Un total cuenta días con registros, no con valor: es otra cobertura.
  assert.deepEqual(partesDeLaEtapa(resumenDeEtapa(porDias('TOTAL', 44)), dia), ['48 días: 44 con registros', '4 sin registros']);
  // Sesiones de esa versión fuera de sus fechas (entrenamiento): se dice cuántas y qué fechas se usaron.
  const corrida = resumenDeEtapa(porDias('MEDIANA', 5, { dias: null, observaciones: 6, sinValor: 1 }), { lente: 'VERSION_EJECUTADA', rango: { desde: V1.desde, hasta: '2026-09-08' }, fueraDeLasFechas: 2 });
  assert.deepEqual(partesDeLaEtapa(corrida, dia), ['6 sesiones: 5 con valor', '2 fuera de las fechas de la etapa', 'del «2026-07-20» al «2026-09-08»']);
  // Lo leído no cubre la etapa: se dice; las fechas usadas, no (las dice el aviso de lo leído).
  const recortada = resumenDeEtapa(porDias('MEDIA_DE_DIAS_CON_DATOS', 44), { rango: { desde: '2026-08-01', hasta: V1.ultimoDia }, recortada: true });
  assert.deepEqual(partesDeLaEtapa(recortada, dia), ['48 días: 44 con valor', '4 sin registros', 'la lectura no cubre la etapa entera']);
  // Sin resumen (duró menos de un día, o quedó fuera de lo leído): lo dice la celda.
  assert.equal(partesDeLaEtapa(resumenDeEtapa(null, { motivoSinResumen: 'SIN_DIA_ENTERO', rango: null }), dia), null);
});

test('la cobertura de la tarjeta es la que comparten más métricas; las otras van en su celda', () => {
  const comun = ['48 días: 44 con valor', '4 sin registros'];
  const c = coberturaDeLaEtapa([
    { clave: 'energia', nombre: 'Calorías', partes: comun },
    { clave: 'proteinas', nombre: 'Proteínas', partes: [...comun] },
    { clave: 'registros', nombre: 'Registros', partes: ['48 días: 44 con registros', '4 sin registros'] },
  ]);
  assert.deepEqual(c.partes, comun);
  assert.deepEqual(c.de, ['Calorías', 'Proteínas']);
  assert.equal(c.deTodas, false);
  assert.deepEqual([...c.propias], ['registros']);
  // Si todas coinciden, no hace falta nombrarlas, y ninguna celda repite nada.
  const todas = coberturaDeLaEtapa([
    { clave: 'energia', nombre: 'Calorías', partes: comun },
    { clave: 'proteinas', nombre: 'Proteínas', partes: [...comun] },
  ]);
  assert.equal(todas.deTodas, true);
  assert.equal(todas.propias.size, 0);
});

test('con un empate va la cobertura de la primera métrica, y cada una de las otras se dice en su celda', () => {
  const c = coberturaDeLaEtapa([
    { clave: 'series', nombre: 'Series', partes: ['6 sesiones'] },
    { clave: 'carga', nombre: 'Carga', partes: ['6 sesiones: 5 con valor'] },
    { clave: 'repeticiones', nombre: 'Repeticiones', partes: ['6 sesiones: 6 con valor'] },
  ]);
  assert.deepEqual(c.de, ['Series']);
  assert.deepEqual(c.partes, ['6 sesiones']);
  assert.deepEqual([...c.propias].sort(), ['carga', 'repeticiones']);
  // Ninguna cobertura se pierde: lo que no está en la tarjeta está en una celda.
  assert.equal(c.de.length + c.propias.size, 3);
});

test('una métrica sin resumen no decide la cobertura ni cuenta para «todas»', () => {
  const c = coberturaDeLaEtapa([
    { clave: 'energia', nombre: 'Calorías', partes: null },
    { clave: 'peso', nombre: 'Peso', partes: ['2 tomas'] },
  ]);
  assert.deepEqual(c.de, ['Peso']);
  assert.equal(c.deTodas, true);
  assert.equal(c.propias.size, 0);
  assert.equal(coberturaDeLaEtapa([{ clave: 'energia', nombre: 'Calorías', partes: null }]), null);
  assert.equal(coberturaDeLaEtapa([]), null);
});

test('los nombres se enumeran como se dicen', () => {
  assert.equal(enumerar([]), '');
  assert.equal(enumerar(['Calorías']), 'Calorías');
  assert.equal(enumerar(['Calorías', 'Proteínas']), 'Calorías y Proteínas');
  assert.equal(enumerar(['Calorías', 'Proteínas', 'Registros']), 'Calorías, Proteínas y Registros');
});

test('cada tarjeta ofrece las etapas que dejan a A como la más antigua, y nunca la de la otra', () => {
  const ids = (xs) => xs.map((e) => e.etiqueta);
  const todas = [V1, V2, V3];
  // Con A = v1 y B = v2: A no tiene otra para elegir; B puede pasar a v3.
  assert.deepEqual(ids(etapasElegibles(todas, V1, V2, 'A')), ['v1']);
  assert.deepEqual(ids(etapasElegibles(todas, V2, V1, 'B')), ['v2', 'v3']);
  // Con A = v1 y B = v3: A puede pasar a v2; B puede volver a v2.
  assert.deepEqual(ids(etapasElegibles(todas, V1, V3, 'A')), ['v1', 'v2']);
  assert.deepEqual(ids(etapasElegibles(todas, V3, V1, 'B')), ['v2', 'v3']);
  // Con dos etapas en el área no hay nada para elegir: la pantalla escribe el nombre, sin selector.
  assert.deepEqual(ids(etapasElegibles([V1, V2], V1, V2, 'A')), ['v1']);
  assert.deepEqual(ids(etapasElegibles([V1, V2], V2, V1, 'B')), ['v2']);
  // La elegida está siempre, aunque ya no figure entre las del último año, y en su orden.
  const vieja = etapa(0, '2025-06-01', '2025-09-30');
  assert.deepEqual(ids(etapasElegibles(todas, vieja, V2, 'A')), ['v0', 'v1']);
  // Ninguna lista trae la etapa de la otra tarjeta.
  for (const [elegida, otra, lado] of [[V1, V2, 'A'], [V2, V1, 'B'], [V2, V3, 'A'], [V3, V2, 'B']]) assert.ok(!etapasElegibles(todas, elegida, otra, lado).includes(otra));
});

test('cómo terminó una etapa: qué versión la reemplazó, que se cerró el seguimiento o que sigue vigente', () => {
  const todas = [V1, V2, V3];
  assert.equal(versionDeLaEtapa(V3), '3');
  assert.equal(finDeLaEtapa(V1, todas, dia), '«2026-09-05», la reemplazó la versión 2');
  assert.equal(finDeLaEtapa(V3, todas, dia), 'Sigue vigente');
  // Sin la siguiente a la vista (no está entre las del último año), no se inventa su número.
  assert.equal(finDeLaEtapa(V2, [V2], dia), '«2026-09-20», la reemplazó la versión siguiente');
  assert.equal(finDeLaEtapa({ ...V2, motivoDeFin: 'FOLLOW_UP_CLOSED' }, todas, dia), '«2026-09-20», se cerró el seguimiento');
  // Activada y reemplazada el mismo día: no tiene un último día entero.
  assert.equal(finDeLaEtapa({ ...V1, ultimoDia: null }, todas, dia), 'El mismo día, la reemplazó la versión 2');
});
