/**
 * WP-TABLERO-ALTA-GAMA TB-16 (DL-163 D-7) · el período de la persona nueva, sin React (TEST-TAG-014):
 *  1. el inicio del acompañamiento sale de los vínculos aceptados de este profesional, por área;
 *  2. con un acompañamiento de menos de 90 días y sin un período en la URL, el período por omisión arranca ahí y no se
 *     escribe en la URL; con 90 días o más (la cohorte), o con un período elegido, nada cambia;
 *  3. en el minigráfico de cada indicador, lo anterior al vínculo de su área no se dibuja, ni en el lienzo ni en la tira;
 *  4. con uno a tres días con valor no hay línea ni media (la regla es de TB-04 y se comprueba acá con la persona nueva).
 * La verificación de la API (qué devuelve antes del vínculo) está en la §10 del paquete: toda lectura de la ficha está
 * acotada a lo que hizo este profesional.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { inicioDelAcompanamiento, leerPeriodo, parametrosDePeriodo, periodoDesdeElVinculo, sinPeriodoEnLaUrl } = await import('../src/app/pro/advisees/seguimiento/estado.ts');
const { estadosDeLosDias, geometriaDelIndicador, recortadaAlVinculo } = await import('../src/app/pro/advisees/seguimiento/geometria.ts');

const HOY = '2026-11-06';
const vinculo = (area, estado, aceptado) => ({ relationshipState: estado, acceptedAt: aceptado, scope: { code: area } });
const sinNada = new URLSearchParams('id=x');

test('TEST-TAG-014 · el inicio del acompañamiento es el vínculo aceptado más antiguo, y cada área tiene el suyo', () => {
  const a = inicioDelAcompanamiento([
    vinculo('NUTRICION', 'ACEPTADO', '2026-11-03T13:00:00.000Z'),
    vinculo('ANTROPOMETRIA', 'ACEPTADO', '2026-11-05T02:30:00.000Z'),
    vinculo('ENTRENAMIENTO', 'PAUSADO', '2026-01-01T12:00:00.000Z'),
    vinculo('NUTRICION', 'FINALIZADO', '2025-01-01T12:00:00.000Z'),
  ]);
  assert.deepEqual(a.porArea, { NUTRICION: '2026-11-03', ANTROPOMETRIA: '2026-11-04' }, 'el día civil en la zona de BE: las 2:30 UTC del 5 son el 4 a la noche');
  assert.equal(a.inicio, '2026-11-03', 'un vínculo en pausa o terminado no cuenta: esas áreas no se ven');
  assert.deepEqual(inicioDelAcompanamiento([]), { inicio: null, porArea: {} });
});

test('TEST-TAG-014 · con menos de 90 días, el período por omisión arranca en el vínculo y no se escribe en la URL', () => {
  const p = periodoDesdeElVinculo(leerPeriodo(sinNada, HOY), sinPeriodoEnLaUrl(sinNada), '2026-11-03', HOY);
  assert.deepEqual(p, { preset: null, desde: '2026-11-03', hasta: HOY, desdeElVinculo: true });
  assert.deepEqual(parametrosDePeriodo(p), { p: null, desde: null, hasta: null }, 'navegar entre vistas lo conserva como el por omisión');
  assert.deepEqual(periodoDesdeElVinculo(leerPeriodo(sinNada, HOY), true, HOY, HOY).desde, HOY, 'un vínculo de hoy: un día');
});

test('TEST-TAG-014 · la ficha de la cohorte no cambia: con 90 días o más, o con un período elegido, el período es el de siempre', () => {
  const porOmision = leerPeriodo(sinNada, HOY);
  assert.equal(porOmision.desde, '2026-08-09');
  assert.equal(periodoDesdeElVinculo(porOmision, true, '2023-11-05', HOY), porOmision, 'Diego Sosa, con vos desde 2023');
  assert.equal(periodoDesdeElVinculo(porOmision, true, '2026-08-09', HOY), porOmision, 'justo 90 días');
  assert.equal(periodoDesdeElVinculo(porOmision, true, null, HOY), porOmision, 'sin vínculos leídos todavía');
  const elegido = new URLSearchParams('id=x&p=30');
  assert.equal(periodoDesdeElVinculo(leerPeriodo(elegido, HOY), sinPeriodoEnLaUrl(elegido), '2026-11-03', HOY).preset, 30, 'lo elegido manda');
  const rango = new URLSearchParams('id=x&desde=2026-10-01&hasta=2026-10-31');
  assert.equal(periodoDesdeElVinculo(leerPeriodo(rango, HOY), sinPeriodoEnLaUrl(rango), '2026-11-03', HOY).desde, '2026-10-01');
});

const punto = (fecha, valor) => ({
  pointId: `p-${fecha}`,
  date: fecha,
  dateEnd: null,
  value: valor,
  segment: 1,
  coverage: null,
  completeness: 'COMPLETE',
  quality: [],
  sources: [],
});

const entrada = (puntos, extra = {}) => ({
  puntos,
  sinRegistros: [{ desde: '2026-10-08', hasta: '2026-11-02' }],
  desde: '2026-10-08',
  hasta: HOY,
  hoy: HOY,
  diaria: true,
  ancho: 300,
  lienzo: 72,
  inicioDelPlan: null,
  ...extra,
});

test('TEST-TAG-014 · lo anterior al vínculo del área no se dibuja: ni puntos, ni días sin registros en la tira', () => {
  const e = entrada([punto('2026-10-10', 2000), punto('2026-11-03', 2100), punto('2026-11-04', 2200), punto('2026-11-05', 2300), punto('2026-11-06', 900)], { desdeElVinculo: '2026-11-03' });
  const r = recortadaAlVinculo(e);
  assert.deepEqual(
    r.puntos.map((p) => p.date),
    ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'],
  );
  assert.deepEqual(r.sinRegistros, [], 'los días sin registros eran todos antes del vínculo');
  const antes = estadosDeLosDias(r).filter((d) => d.fecha < '2026-11-03');
  assert.ok(antes.length > 0 && antes.every((d) => d.estado === 'nada'), 'antes del vínculo, la tira no tiene nada que decir');
  const g = geometriaDelIndicador(e);
  const xDelVinculo = (300 / 30) * 26;
  assert.ok(
    g.tira.every((c) => c.x >= xDelVinculo - 1),
    `ninguna celda de la tira antes del vínculo (${JSON.stringify(g.tira.map((c) => c.x))})`,
  );
  assert.ok(
    g.puntos.every((p) => p.x >= xDelVinculo),
    'ningún punto antes del vínculo',
  );
  const sinCorte = geometriaDelIndicador({ ...e, desdeElVinculo: null });
  assert.ok(sinCorte.tira.some((c) => c.x < xDelVinculo), 'sin el corte, lo anterior se dibuja (la prueba distingue)');
});

test('TEST-TAG-014 · con uno a tres días con valor no hay línea ni media: van los puntos sueltos', () => {
  const tres = geometriaDelIndicador(entrada([punto('2026-11-03', 2100), punto('2026-11-04', 2200), punto('2026-11-05', 2300)], { desdeElVinculo: '2026-11-03' }));
  assert.equal(tres.modo, 'sueltos');
  assert.deepEqual(tres.tramos, []);
  assert.deepEqual(tres.semanas, []);
  assert.equal(tres.puntos.length, 3);
  const cuatro = geometriaDelIndicador(entrada([punto('2026-11-02', 2000), punto('2026-11-03', 2100), punto('2026-11-04', 2200), punto('2026-11-05', 2300)]));
  assert.notEqual(cuatro.modo, 'sueltos', 'con cuatro días, la línea');
});
