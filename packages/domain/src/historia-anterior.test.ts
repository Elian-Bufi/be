/**
 * WP-HISTORIA-ANTERIOR (DL-175) · la lógica pura de la historia anterior, TEST-HA-001 a TEST-HA-012. Cada prueba dice la
 * mutación que la tiene que poner en rojo; las de TEST-HA-003, 004, 005, 007 y 009 se verificaron mutando el código
 * (docs/paquetes/WP-HISTORIA-ANTERIOR.md §7). Lo que pasa con la base y la API, en
 * test/integration/historia-anterior.int-spec.ts (TEST-HA-020 a 031).
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { terminosProhibidosEn } from './copy-nutricion';
import {
  AutorizarHistoriaAnteriorRequestSchema,
  HistoriaAnteriorResponseSchema,
  MiHistoriaAnteriorResponseSchema,
  RegistroAnteriorSchema,
  RetirarHistoriaAnteriorRequestSchema,
  TomaAnteriorSchema,
  DecisionAnteriorSchema,
} from './contratos-historia-anterior';
import {
  COPY_HISTORIA_ANTERIOR as C,
  DIAS_DEL_TRAMO,
  LO_QUE_ENTRA,
  TEXTO_DE_LA_HISTORIA_ANTERIOR as T,
  autorizacionVigente,
  decidirCambioDeAutorizacion,
  extensionDe,
  huboOtroAntes,
  ordinalesDeLosAnteriores,
  porSemana,
  rotuloDelAutor,
  textosDeLaHistoriaAnterior,
  tocaElTramo,
  tramoAnterior,
  tramoDeLaHistoriaAnterior,
  tramoSiguiente,
  ultimaVersion,
  vigenciaHastaElCorte,
} from './historia-anterior';
import { OPERACIONES } from './openapi';

const A = 'aaaaaaaa-0000-4000-8000-000000000001';
const B = 'bbbbbbbb-0000-4000-8000-000000000002';
const C2 = 'cccccccc-0000-4000-8000-000000000003';
const YO = 'dddddddd-0000-4000-8000-000000000004';
const CORTE = '2026-11-01T12:00:00.000Z';

test('TEST-HA-001 · el texto que se acepta: su hash es el de su texto, es una propuesta, dice qué entra y qué nunca entra, y no nombra a nadie (mutación: cambiar una coma del texto sin el hash)', () => {
  assert.equal(T.hash, createHash('sha256').update(T.texto, 'utf8').digest('hex'));
  assert.equal(T.propuesta, true);
  assert.match(T.texto, /pendiente de validación jurídica/);
  assert.match(T.texto, /nunca los borradores/);
  assert.match(T.texto, /notas privadas/);
  assert.match(T.texto, /Tampoco ve lo de otras áreas/);
  assert.match(T.texto, /La podés retirar cuando quieras/);
  assert.match(T.texto, /queda registrado/);
  assert.match(T.texto, /sin su nombre/);
  assert.match(T.id, /^historia-anterior-\d{4}-\d{2}-propuesta$/);
});

test('TEST-HA-002 · lo que entra de cada área: Antropometría solo sus tomas; Nutrición y Entrenamiento, planes, registros y decisiones (mutación: sumar las tomas a Nutrición)', () => {
  assert.deepEqual(LO_QUE_ENTRA, { NUTRICION: ['PLANS', 'RECORDS', 'DECISIONS'], ENTRENAMIENTO: ['PLANS', 'RECORDS', 'DECISIONS'], ANTROPOMETRIA: ['MEASUREMENTS'] });
  // La explicación de la app dice lo mismo, con las palabras de la persona.
  assert.equal(C.explicacion('Lic. Sofía Paz', 'NUTRICION'), 'Le muestra a Lic. Sofía Paz tus planes, registros y decisiones anteriores de Nutrición, con otros profesionales. Sus notas privadas no se comparten.');
  assert.equal(C.explicacion('Prof. Lucía Benítez', 'ANTROPOMETRIA'), 'Le muestra a Prof. Lucía Benítez tus tomas anteriores de Antropometría, con su método, con otros profesionales. Sus notas privadas no se comparten.');
  assert.doesNotMatch(C.explicacion('X', 'NUTRICION'), /tomas/);
});

test('TEST-HA-003 · los otros profesionales, numerados por cuándo empezaron: sin quien lee, sin los que empezaron después del corte y cada uno una vez (mutaciones: no excluir a quien lee; usar <= en el corte; ordenar al revés)', () => {
  const componentes = [
    { profesionalId: B, inicio: '2026-06-01T10:00:00.000Z' },
    { profesionalId: A, inicio: '2026-01-10T10:00:00.000Z' },
    // A vuelve con otro componente: cuenta una vez, desde el primero.
    { profesionalId: A, inicio: '2026-08-01T10:00:00.000Z' },
    // Quien lee también tuvo uno antes: lo suyo no es «de otro».
    { profesionalId: YO, inicio: '2025-12-01T10:00:00.000Z' },
    // Empezó justo en el corte: ya no es anterior.
    { profesionalId: C2, inicio: CORTE },
  ];
  const n = ordinalesDeLosAnteriores(componentes, { lectorId: YO, corte: CORTE });
  assert.deepEqual([...n.entries()], [[A, 1], [B, 2]]);
  assert.equal(n.has(YO), false);
  assert.equal(n.has(C2), false);
  // Empate en el inicio: el orden no cambia de una lectura a otra.
  const empate = ordinalesDeLosAnteriores([{ profesionalId: B, inicio: '2026-01-01T00:00:00.000Z' }, { profesionalId: A, inicio: '2026-01-01T00:00:00.000Z' }], { lectorId: YO, corte: CORTE });
  assert.deepEqual([...empate.entries()], [[A, 1], [B, 2]]);
  assert.equal(ordinalesDeLosAnteriores([], { lectorId: YO, corte: CORTE }).size, 0);
});

test('TEST-HA-004 · un profesional lee solo con la última versión VIGENTE: retirada después de darla, no; dada otra vez, sí; sin decidir, no (mutación: mirar la primera versión)', () => {
  assert.equal(autorizacionVigente([]), false);
  assert.equal(autorizacionVigente([{ version: 1, estado: 'VIGENTE' }]), true);
  assert.equal(autorizacionVigente([{ version: 1, estado: 'VIGENTE' }, { version: 2, estado: 'RETIRADA' }]), false);
  assert.equal(autorizacionVigente([{ version: 2, estado: 'RETIRADA' }, { version: 1, estado: 'VIGENTE' }]), false, 'el orden de las filas no importa: manda la versión');
  assert.equal(autorizacionVigente([{ version: 3, estado: 'VIGENTE' }, { version: 1, estado: 'VIGENTE' }, { version: 2, estado: 'RETIRADA' }]), true);
  assert.equal(ultimaVersion([{ version: 2 }, { version: 5 }, { version: 4 }])?.version, 5);
});

test('TEST-HA-005 · autorizar y retirar con lo que se vio: la versión nueva, nada si ya está dada, y el conflicto si lo visto no es lo último o no hay qué retirar (mutaciones: no comparar la versión vista; retirar una retirada)', () => {
  const dada = { version: 1, estado: 'VIGENTE' as const };
  const retirada = { version: 2, estado: 'RETIRADA' as const };
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: null, pedido: 'AUTORIZAR', versionVista: null }), { tipo: 'AGREGAR', estado: 'VIGENTE', version: 1 });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: null, pedido: 'AUTORIZAR', versionVista: 'v1' }), { tipo: 'CONFLICTO' });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: dada, pedido: 'AUTORIZAR', versionVista: 'v1' }), { tipo: 'SIN_CAMBIO' });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: dada, pedido: 'AUTORIZAR', versionVista: null }), { tipo: 'CONFLICTO' });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: dada, pedido: 'RETIRAR', versionVista: 'v1' }), { tipo: 'AGREGAR', estado: 'RETIRADA', version: 2 });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: retirada, pedido: 'RETIRAR', versionVista: 'v2' }), { tipo: 'CONFLICTO' });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: null, pedido: 'RETIRAR', versionVista: null }), { tipo: 'CONFLICTO' });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: retirada, pedido: 'AUTORIZAR', versionVista: 'v2' }), { tipo: 'AGREGAR', estado: 'VIGENTE', version: 3 });
  assert.deepEqual(decidirCambioDeAutorizacion({ ultima: retirada, pedido: 'AUTORIZAR', versionVista: 'v1' }), { tipo: 'CONFLICTO' });
});

test('TEST-HA-006 · la tarjeta al aceptar aparece si antes hubo otro profesional en esa área, aunque ya haya terminado; no por otra área ni por el mismo profesional (mutación: no mirar el área)', () => {
  const nuevo = { profesionalId: B, alcance: 'NUTRICION' as const, inicio: '2026-11-10T10:00:00.000Z' };
  assert.equal(huboOtroAntes(nuevo, [nuevo]), false);
  assert.equal(huboOtroAntes(nuevo, [nuevo, { profesionalId: A, alcance: 'NUTRICION', inicio: '2026-03-01T10:00:00.000Z' }]), true);
  assert.equal(huboOtroAntes(nuevo, [nuevo, { profesionalId: A, alcance: 'ENTRENAMIENTO', inicio: '2026-03-01T10:00:00.000Z' }]), false);
  assert.equal(huboOtroAntes(nuevo, [nuevo, { profesionalId: B, alcance: 'NUTRICION', inicio: '2026-03-01T10:00:00.000Z' }]), false);
  assert.equal(huboOtroAntes(nuevo, [nuevo, { profesionalId: A, alcance: 'NUTRICION', inicio: '2026-11-12T10:00:00.000Z' }]), false, 'uno que llegó después no es «antes»');
});

test('TEST-HA-007 · el tramo: sin fechas, los últimos 90 días de la historia; las dos fechas juntas, en orden y hasta 366 días (mutaciones: aceptar una sola fecha; dejar pasar 367 días)', () => {
  const ext = { desde: '2026-01-05', hasta: '2026-10-30' };
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: undefined, fin: undefined }, { extension: ext, fechaDelCorte: '2026-11-01' }), { ok: true, tramo: { desde: '2026-08-02', hasta: '2026-10-30' } });
  // Una historia corta: el tramo empieza donde empieza ella.
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: undefined, fin: undefined }, { extension: { desde: '2026-10-20', hasta: '2026-10-30' }, fechaDelCorte: '2026-11-01' }), { ok: true, tramo: { desde: '2026-10-20', hasta: '2026-10-30' } });
  // Sin nada: los 90 días antes del corte.
  const vacio = tramoDeLaHistoriaAnterior({ inicio: undefined, fin: undefined }, { extension: null, fechaDelCorte: '2026-11-01' });
  assert.deepEqual(vacio, { ok: true, tramo: { desde: '2026-08-03', hasta: '2026-10-31' } });
  assert.equal(DIAS_DEL_TRAMO, 90);
  const base = { extension: ext, fechaDelCorte: '2026-11-01' };
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: '2026-03-01', fin: undefined }, base), { ok: false, issues: [{ code: 'REQUIRED', path: 'periodEnd' }] });
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: '2026-02-30', fin: '2026-03-01' }, base), { ok: false, issues: [{ code: 'INVALID_DATE', path: 'periodStart' }] });
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: ['2026-03-01'], fin: '2026-03-01' }, base), { ok: false, issues: [{ code: 'INVALID_DATE', path: 'periodStart' }] });
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: '2026-03-02', fin: '2026-03-01' }, base), { ok: false, issues: [{ code: 'INVALID_PERIOD', path: 'periodStart' }] });
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: '2025-01-01', fin: '2026-01-01' }, base), { ok: true, tramo: { desde: '2025-01-01', hasta: '2026-01-01' } });
  assert.deepEqual(tramoDeLaHistoriaAnterior({ inicio: '2025-01-01', fin: '2026-01-02' }, base), { ok: false, issues: [{ code: 'PERIOD_TOO_LONG', path: 'periodEnd' }] });
});

test('TEST-HA-008 · los tramos de antes y de después, del mismo largo, solo mientras la historia siga; tocar el tramo incluye los bordes (mutación: ofrecer el siguiente cuando el tramo ya llega al final)', () => {
  const ext = { desde: '2026-01-05', hasta: '2026-10-30' };
  const tramo = { desde: '2026-08-02', hasta: '2026-10-30' };
  assert.deepEqual(tramoAnterior(tramo, ext), { desde: '2026-05-04', hasta: '2026-08-01' });
  assert.equal(tramoSiguiente(tramo, ext), null);
  assert.deepEqual(tramoSiguiente({ desde: '2026-05-04', hasta: '2026-08-01' }, ext), { desde: '2026-08-02', hasta: '2026-10-30' });
  assert.equal(tramoAnterior({ desde: '2026-01-05', hasta: '2026-04-04' }, ext), null);
  assert.equal(tramoAnterior(tramo, null), null);
  assert.equal(tocaElTramo({ desde: '2026-10-30', hasta: null }, tramo), true);
  assert.equal(tocaElTramo({ desde: '2026-07-01', hasta: '2026-08-02' }, tramo), true);
  assert.equal(tocaElTramo({ desde: '2026-07-01', hasta: '2026-08-01' }, tramo), false);
  assert.equal(tocaElTramo({ desde: '2026-10-31', hasta: null }, tramo), false);
});

test('TEST-HA-009 · una versión que seguía vigente al empezar el acompañamiento no dice hasta cuándo; la extensión va de la fecha más vieja a la más nueva (mutación: mostrar el fin de una que seguía)', () => {
  assert.deepEqual(vigenciaHastaElCorte({ desde: '2026-03-01', hasta: '2026-06-01', corteEl: '2026-06-01T12:00:00.000Z' }, CORTE), { desde: '2026-03-01', hasta: '2026-06-01', seguiaVigente: false });
  assert.deepEqual(vigenciaHastaElCorte({ desde: '2026-06-01', hasta: '2026-11-20', corteEl: '2026-11-20T12:00:00.000Z' }, CORTE), { desde: '2026-06-01', hasta: null, seguiaVigente: true });
  assert.deepEqual(vigenciaHastaElCorte({ desde: '2026-06-01', hasta: null, corteEl: null }, CORTE), { desde: '2026-06-01', hasta: null, seguiaVigente: true });
  assert.deepEqual(extensionDe(['2026-05-01', null, '2026-01-03', undefined, '2026-10-30', 'no es fecha']), { desde: '2026-01-03', hasta: '2026-10-30' });
  assert.equal(extensionDe([null, undefined]), null);
});

test('TEST-HA-010 · los contratos son estrictos y no tienen dónde llevar el nombre del otro profesional, una nota, la interpretación ni las fotos (mutación: aceptar `author.displayName`)', () => {
  const autor = { kind: 'OTHER_PROFESSIONAL', ordinal: 1 };
  const comida = { kind: 'MEAL', recordId: 'r1', author: autor, planVersionId: 'p1', date: '2026-10-01', type: 'PLAN_OPTION', meal: 'Almuerzo', option: 'Arroz con pollo', description: null, annulled: false };
  assert.equal(RegistroAnteriorSchema.safeParse(comida).success, true);
  assert.equal(RegistroAnteriorSchema.safeParse({ ...comida, author: { ...autor, displayName: 'Lic. Otra' } }).success, false);
  assert.equal(RegistroAnteriorSchema.safeParse({ ...comida, author: { ...autor, identityId: A } }).success, false);
  assert.equal(RegistroAnteriorSchema.safeParse({ ...comida, evidence: [] }).success, false, 'sin fotos');
  assert.equal(RegistroAnteriorSchema.safeParse({ ...comida, author: { kind: 'OWN', ordinal: 1 } }).success, false);
  const decision = { reviewId: 'v1', author: autor, recordedAt: '2026-10-01T12:00:00.000Z', date: '2026-10-01', reviewedPeriod: { from: '2026-09-01', to: '2026-09-30' }, result: 'ADJUST', rationale: 'F', nextAction: { description: 'P', nextReviewAt: null } };
  assert.equal(DecisionAnteriorSchema.safeParse(decision).success, true);
  assert.equal(DecisionAnteriorSchema.safeParse({ ...decision, interpretation: 'I' }).success, false, 'sin la interpretación');
  assert.equal(DecisionAnteriorSchema.safeParse({ ...decision, professionalNotes: 'N' }).success, false);
  const toma = { evaluationId: 'e1', author: autor, takenAt: '2026-10-01T12:00:00.000Z', date: '2026-10-01', measurements: [], derivedResults: [] };
  assert.equal(TomaAnteriorSchema.safeParse(toma).success, true);
  assert.equal(TomaAnteriorSchema.safeParse({ ...toma, context: 'En ayunas' }).success, false, 'sin el contexto de la toma');
  const vacia = { area: 'NUTRICION', beforeYourStart: '2026-11-01', period: { from: '2026-08-01', to: '2026-10-31' }, extent: null, otherProfessionals: 0, includes: ['PLANS'], planVersions: [], records: [], measurements: [], decisions: [] };
  assert.equal(HistoriaAnteriorResponseSchema.safeParse({ data: vacia }).success, true);
  assert.equal(HistoriaAnteriorResponseSchema.safeParse({ data: { ...vacia, notes: [] } }).success, false, 'sin notas');
  assert.equal(HistoriaAnteriorResponseSchema.safeParse({ data: { ...vacia, professional: { identityId: A, displayName: 'X' } } }).success, false);
  assert.equal(AutorizarHistoriaAnteriorRequestSchema.safeParse({ expectedVersion: null, textVersionId: T.id }).success, true);
  assert.equal(AutorizarHistoriaAnteriorRequestSchema.safeParse({ expectedVersion: null, textVersionId: T.id, area: 'NUTRICION' }).success, false);
  assert.equal(RetirarHistoriaAnteriorRequestSchema.safeParse({ expectedVersion: null }).success, false);
  assert.equal(MiHistoriaAnteriorResponseSchema.safeParse({ data: { text: { id: T.id, title: T.titulo, text: T.texto, textHash: T.hash, effectiveFrom: T.vigenteDesde, approval: 'PENDING_APPROVAL' }, items: [], accesses: [] } }).success, true);
});

test('TEST-HA-011 · los textos de las pantallas: sin las palabras prohibidas de las tres áreas, sin «asesorado», «cumplimiento», «adherencia», «racha», «puntaje» ni «%» (mutación: «Tu adherencia anterior»)', () => {
  const textos = textosDeLaHistoriaAnterior();
  assert.ok(textos.length > 60);
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeAntropometriaEn(t), [], t);
    assert.doesNotMatch(t, /asesorad|cumplimiento|adherencia|racha|puntaje|%|1RM real|\bvolumen\b/i, t);
  }
  // La guardia detecta lo que tiene que detectar (si no, la prueba de arriba no prueba nada).
  assert.notDeepEqual(terminosProhibidosEn('Tu adherencia anterior'), []);
  // El aviso del website es el que fijó Dirección.
  assert.equal(C.aviso, 'Lo que sigue pasó con otro profesional, antes de tu acompañamiento. Solo lectura.');
  // Sin la autorización, se dice cómo pedirla con un condicional: no se afirma que haya algo.
  assert.match(C.comoPedirla.cuerpo('NUTRICION'), /^Si la persona tuvo antes otro profesional de Nutrición/);
});

test('TEST-HA-012 · lo registrado por semana, de lunes a domingo y de la más nueva a la más vieja; el rótulo lleva el número solo con más de un profesional (mutación: semanas de domingo a sábado)', () => {
  const r = (date: string) => ({ date });
  const semanas = porSemana([r('2026-10-07'), r('2026-10-12'), r('2026-10-05'), r('2026-10-11'), r('2026-10-13')]);
  assert.deepEqual(semanas.map((s) => [s.desde, s.hasta, s.registros.map((x) => x.date)]), [
    ['2026-10-12', '2026-10-18', ['2026-10-12', '2026-10-13']],
    ['2026-10-05', '2026-10-11', ['2026-10-05', '2026-10-07', '2026-10-11']],
  ]);
  assert.equal(rotuloDelAutor({ kind: 'OTHER_PROFESSIONAL', ordinal: 1 }, 1), 'De otro profesional');
  assert.equal(rotuloDelAutor({ kind: 'OTHER_PROFESSIONAL', ordinal: 2 }, 2), 'De otro profesional (2.º)');
});

test('TEST-HA-013 · la familia HIA: cuatro operaciones, cada una cita DL-175; las de la persona escriben con Idempotency-Key y la del profesional es una lectura con su tramo (mutación: API-HIA-02 sin Idempotency-Key)', () => {
  const hia = OPERACIONES.filter((o) => o.id.startsWith('API-HIA-'));
  assert.deepEqual(hia.map((o) => `${o.id} ${o.metodo.toUpperCase()} ${o.ruta}`), [
    'API-HIA-01 GET /me/previous-history',
    'API-HIA-02 PUT /me/previous-history/{relationshipId}',
    'API-HIA-03 POST /me/previous-history/{relationshipId}/withdrawal',
    'API-HIA-04 GET /advisees/{adviseeId}/previous-history/{area}',
  ]);
  for (const o of hia) assert.ok(o.fuente.includes('DL-175'), o.id);
  assert.deepEqual(hia.map((o) => o.idempotencia), [false, true, true, false]);
  const cuatro = hia[3]!;
  assert.deepEqual((cuatro.query ?? []).map((q) => q.nombre), ['periodStart', 'periodEnd']);
  assert.deepEqual(cuatro.errores[404], ['RESOURCE_NOT_FOUND']);
});
