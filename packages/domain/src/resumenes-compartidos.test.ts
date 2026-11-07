/**
 * DL-163 D-13, ampliada por Dirección el 2026-11-07 (WP-TABLERO-ALTA-GAMA TB-52 a TB-56) · lo que la persona comparte de
 * otras áreas, sin base de datos: la matriz del plan completo (TA-87), los permisos y sus renglones, qué amplía (08 C-12),
 * qué recibe cada profesional, el pedido y su límite (TA-95), lo avanzado por semana (TA-86), el texto del acto (una
 * propuesta), la novedad y los contratos de la familia API-RES. La API y la base hacen lo mismo, con sus pruebas de
 * integración (`resumenes-compartidos.int-spec.ts`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crearClienteBe } from './cliente-http';
import { esNovedadImportante, TIPOS_DE_NOVEDAD } from './contratos-novedades';
import {
  CompartirResumenesRequestSchema,
  laMatrizDejaVerElPlan,
  MATRIZ_DEL_PLAN_COMPLETO,
  PedirVerElPlanRequestSchema,
  PlanCompartidoResponseSchema,
  ResponderPedidoDePlanRequestSchema,
  ResumenesParaElProfesionalResponseSchema,
} from './contratos-resumenes-compartidos';
import { textoDeNovedad, textoDelAvisoPush, vistaDeNovedad } from './copy-novedades';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import {
  ampliaLoCompartido,
  areasQueSeLePuedenCompartir,
  loQueRecibe,
  permisosAlAceptarUnPedido,
  problemasDeLosPermisos,
  puedePedirVerElPlan,
  renglonesDeLosPermisos,
  renglonesDelPlan,
  renglonesVigentes,
  semanasDeLoAvanzado,
  sesionesPorSemanaDeLaAgenda,
  type ComponenteDeLaPersona,
  type RenglonDeResumen,
} from './resumenes-compartidos';
import { VERSION_VIGENTE, VERSIONES_PROPUESTAS } from './textos';

const NUT = '11111111-1111-4111-8111-111111111111';
const ENT = '22222222-2222-4222-8222-222222222222';
const ANT = '33333333-3333-4333-8333-333333333333';
const AV_NUT = 'aaaaaaaa-0000-4000-8000-000000000001';
const AV_ENT = 'aaaaaaaa-0000-4000-8000-000000000002';
const AV_ANT = 'aaaaaaaa-0000-4000-8000-000000000003';

/** Una persona con su nutricionista, su entrenador y su antropometrista, cada uno con su componente aceptado. */
const EQUIPO: readonly ComponenteDeLaPersona[] = [
  { profesionalId: NUT, alcanceDeVinculoId: AV_NUT, alcance: 'NUTRICION', estado: 'ACEPTADO' },
  { profesionalId: ENT, alcanceDeVinculoId: AV_ENT, alcance: 'ENTRENAMIENTO', estado: 'ACEPTADO' },
  { profesionalId: ANT, alcanceDeVinculoId: AV_ANT, alcance: 'ANTROPOMETRIA', estado: 'ACEPTADO' },
];
const AYER = '2026-11-06T12:00:00.000Z';
const HOY = '2026-11-07T12:00:00.000Z';

test('TEST-TAG-037 · la matriz del plan completo: «todos con todos, con permiso» (TA-87), y nunca el área que el receptor ya lleva', () => {
  assert.deepEqual(MATRIZ_DEL_PLAN_COMPLETO, { NUTRICION: ['ENTRENAMIENTO', 'ANTROPOMETRIA'], ENTRENAMIENTO: ['NUTRICION', 'ANTROPOMETRIA'] });
  assert.equal(laMatrizDejaVerElPlan('NUTRICION', ['ENTRENAMIENTO']), true);
  assert.equal(laMatrizDejaVerElPlan('NUTRICION', ['ANTROPOMETRIA']), true);
  assert.equal(laMatrizDejaVerElPlan('ENTRENAMIENTO', ['NUTRICION']), true);
  assert.equal(laMatrizDejaVerElPlan('ENTRENAMIENTO', ['ANTROPOMETRIA']), true);
  // Quien ya lleva el área de origen la ve por su Alcance, no como compartida; sin áreas, sin fila.
  assert.equal(laMatrizDejaVerElPlan('NUTRICION', ['NUTRICION', 'ENTRENAMIENTO']), false);
  assert.equal(laMatrizDejaVerElPlan('ENTRENAMIENTO', []), false);
});

test('TEST-TAG-037 · los schemas: Antropometría solo con «resumen», un par una sola vez, el plan de otra área, y «Sí» con lo que vio', () => {
  const permiso = (area: string, level: string) => ({ professionalId: ENT, area, level });
  const pedido = (grants: unknown[]) => ({ expectedVersion: null, textVersionId: 'x', grants });
  assert.ok(CompartirResumenesRequestSchema.safeParse(pedido([permiso('NUTRICION', 'SUMMARY_AND_PLAN'), permiso('ANTROPOMETRIA', 'SUMMARY')])).success);
  assert.ok(!CompartirResumenesRequestSchema.safeParse(pedido([permiso('ANTROPOMETRIA', 'SUMMARY_AND_PLAN')])).success);
  assert.ok(!CompartirResumenesRequestSchema.safeParse(pedido([permiso('NUTRICION', 'SUMMARY'), permiso('NUTRICION', 'SUMMARY_AND_PLAN')])).success);
  // Para no compartir nada, API-RES-03; el nivel es un enum, nunca un booleano.
  assert.ok(!CompartirResumenesRequestSchema.safeParse(pedido([])).success);
  assert.ok(!CompartirResumenesRequestSchema.safeParse(pedido([permiso('NUTRICION', true as unknown as string)])).success);
  assert.ok(!CompartirResumenesRequestSchema.safeParse({ ...pedido([permiso('NUTRICION', 'SUMMARY')]), extra: 1 }).success);
  assert.ok(PedirVerElPlanRequestSchema.safeParse({ scope: 'ENTRENAMIENTO', area: 'NUTRICION' }).success);
  assert.ok(!PedirVerElPlanRequestSchema.safeParse({ scope: 'NUTRICION', area: 'NUTRICION' }).success);
  assert.ok(!PedirVerElPlanRequestSchema.safeParse({ scope: 'NUTRICION', area: 'ANTROPOMETRIA' }).success);
  assert.ok(ResponderPedidoDePlanRequestSchema.safeParse({ expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).success);
  assert.ok(!ResponderPedidoDePlanRequestSchema.safeParse({ expectedVersion: 'v1', answer: 'SHARE', sharing: null }).success);
  assert.ok(!ResponderPedidoDePlanRequestSchema.safeParse({ expectedVersion: 'v1', answer: 'NOT_NOW', sharing: { expectedVersion: null, textVersionId: 'x' } }).success);
  // Sin plan vigente, { data: null }; la respuesta es estricta (09v7 T12).
  assert.ok(PlanCompartidoResponseSchema.safeParse({ data: null }).success);
  assert.ok(!PlanCompartidoResponseSchema.safeParse({ data: null, extra: 1 }).success);
  assert.ok(!ResumenesParaElProfesionalResponseSchema.safeParse({ data: { scopes: [], areas: [] } }).success);
});

test('TEST-TAG-037 · qué se le puede compartir a cada uno, y los problemas de los permisos', () => {
  assert.deepEqual(areasQueSeLePuedenCompartir(ENT, EQUIPO), ['NUTRICION', 'ANTROPOMETRIA']);
  assert.deepEqual(areasQueSeLePuedenCompartir(NUT, EQUIPO.filter((c) => c.profesionalId !== ANT)), ['ENTRENAMIENTO']);
  const ajeno = '44444444-4444-4444-8444-444444444444';
  assert.deepEqual(
    problemasDeLosPermisos(EQUIPO, [
      { professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' },
      { professionalId: ajeno, area: 'NUTRICION', level: 'SUMMARY' },
      { professionalId: ENT, area: 'ENTRENAMIENTO', level: 'SUMMARY' },
    ]),
    [
      { code: 'SUMMARY_RECIPIENT_NOT_AVAILABLE', path: 'grants[1]' },
      { code: 'SUMMARY_AREA_NOT_SHAREABLE', path: 'grants[2]' },
    ],
  );
  // Un área que nadie más lleva no se comparte: no hay nada de quién.
  assert.deepEqual(problemasDeLosPermisos(EQUIPO.filter((c) => c.profesionalId !== NUT), [{ professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY' }]), [
    { code: 'SUMMARY_AREA_NOT_SHAREABLE', path: 'grants[0]' },
  ]);
});

test('TEST-TAG-037 · los renglones: por componente de quien recibe y de quien lleva el área; el «desde» sigue en el mismo nivel y se reinicia al cambiarlo', () => {
  const primera = renglonesDeLosPermisos({ componentes: EQUIPO, anteriores: null, permisos: [{ professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY' }], ahora: AYER });
  assert.deepEqual(primera, [{ profesionalId: ENT, alcanceDeVinculoId: AV_ENT, origenId: AV_NUT, area: 'NUTRICION', nivel: 'SUMMARY', desde: AYER }]);
  const igual = renglonesDeLosPermisos({ componentes: EQUIPO, anteriores: primera, permisos: [{ professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY' }], ahora: HOY });
  assert.equal(igual[0]!.desde, AYER);
  const subida = renglonesDeLosPermisos({ componentes: EQUIPO, anteriores: primera, permisos: [{ professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' }], ahora: HOY });
  assert.deepEqual(subida[0], { ...primera[0], nivel: 'SUMMARY_AND_PLAN', desde: HOY });
  // Si la persona cambia de nutricionista, lo de la anterior ya no vale y a la nueva no se le comparte nada solo (TA-96).
  const otra = { profesionalId: '55555555-5555-4555-8555-555555555555', alcanceDeVinculoId: 'aaaaaaaa-0000-4000-8000-000000000005', alcance: 'NUTRICION' as const, estado: 'ACEPTADO' as const };
  const sinLaAnterior = [...EQUIPO.filter((c) => c.profesionalId !== NUT), otra];
  assert.deepEqual(renglonesVigentes(subida, sinLaAnterior), []);
  // Lo mismo si el vínculo de quien recibe termina: lo suyo deja de valer sin escribir nada.
  assert.deepEqual(renglonesVigentes(subida, EQUIPO.filter((c) => c.profesionalId !== ENT)), []);
  assert.deepEqual(renglonesVigentes(null, EQUIPO), []);
});

test('TEST-TAG-037 · ampliar (sumar a alguien o subir de nivel) es una aceptación nueva; bajar o sacar a alguien, no', () => {
  const resumen: RenglonDeResumen = { profesionalId: ENT, alcanceDeVinculoId: AV_ENT, origenId: AV_NUT, area: 'NUTRICION', nivel: 'SUMMARY', desde: AYER };
  const plan: RenglonDeResumen = { ...resumen, nivel: 'SUMMARY_AND_PLAN', desde: HOY };
  const delAntropometrista: RenglonDeResumen = { profesionalId: ANT, alcanceDeVinculoId: AV_ANT, origenId: AV_NUT, area: 'NUTRICION', nivel: 'SUMMARY', desde: HOY };
  assert.equal(ampliaLoCompartido([], [resumen]), true);
  assert.equal(ampliaLoCompartido([resumen], [plan]), true);
  assert.equal(ampliaLoCompartido([resumen], [resumen, delAntropometrista]), true);
  assert.equal(ampliaLoCompartido([plan], [resumen]), false);
  assert.equal(ampliaLoCompartido([plan, delAntropometrista], [plan]), false);
  assert.equal(ampliaLoCompartido([resumen], [resumen]), false);
});

test('TEST-TAG-037 · qué recibe cada uno: con un componente que el PDP permite hoy, y el «resumen» nunca abre el plan', () => {
  const resumen: RenglonDeResumen = { profesionalId: ENT, alcanceDeVinculoId: AV_ENT, origenId: AV_NUT, area: 'NUTRICION', nivel: 'SUMMARY', desde: AYER };
  assert.deepEqual(loQueRecibe(ENT, [AV_ENT], [resumen]), [{ area: 'NUTRICION', level: 'SUMMARY', since: AYER }]);
  assert.deepEqual(renglonesDelPlan(ENT, [AV_ENT], 'NUTRICION', [resumen]), []);
  const plan: RenglonDeResumen = { ...resumen, nivel: 'SUMMARY_AND_PLAN', desde: HOY };
  assert.deepEqual(renglonesDelPlan(ENT, [AV_ENT], 'NUTRICION', [plan]), [plan]);
  // Con el componente en pausa (el PDP no lo permite) o a nombre de otro, nada.
  assert.deepEqual(loQueRecibe(ENT, [], [plan]), []);
  assert.deepEqual(renglonesDelPlan(ANT, [AV_ANT], 'NUTRICION', [plan]), []);
  assert.deepEqual(renglonesDelPlan(ENT, [AV_ENT], 'ENTRENAMIENTO', [plan]), []);
});

test('TEST-TAG-040 · pedir: solo un área con plan que otro lleva hoy, sin verlo ya, y otra vez recién a los 7 días del último pedido', () => {
  const base = { area: 'NUTRICION' as const, areasDelProfesional: ['ENTRENAMIENTO' as const], hayQuienLaLleve: true, yaLoVe: false, ultimoPedidoEl: null, ahora: HOY };
  assert.deepEqual(puedePedirVerElPlan(base), { puede: true });
  assert.deepEqual(puedePedirVerElPlan({ ...base, yaLoVe: true }), { puede: false, motivo: 'YA_LO_VE', desde: null });
  assert.deepEqual(puedePedirVerElPlan({ ...base, hayQuienLaLleve: false }), { puede: false, motivo: 'NO_SE_PUEDE', desde: null });
  assert.deepEqual(puedePedirVerElPlan({ ...base, area: 'ANTROPOMETRIA' }), { puede: false, motivo: 'NO_SE_PUEDE', desde: null });
  assert.deepEqual(puedePedirVerElPlan({ ...base, areasDelProfesional: ['NUTRICION', 'ENTRENAMIENTO'] }), { puede: false, motivo: 'NO_SE_PUEDE', desde: null });
  // Los 7 días se cuentan desde el pedido, no desde la respuesta.
  const pedido = '2026-11-01T12:00:00.000Z';
  assert.deepEqual(puedePedirVerElPlan({ ...base, ultimoPedidoEl: pedido }), { puede: false, motivo: 'MUY_PRONTO', desde: '2026-11-08T12:00:00.000Z' });
  assert.deepEqual(puedePedirVerElPlan({ ...base, ultimoPedidoEl: pedido, ahora: '2026-11-08T12:00:00.000Z' }), { puede: true });
});

test('TEST-TAG-040 · «Sí, que lo vea» suma a quien pidió con «resumen y plan» y deja lo demás como estaba; sin compartir todavía, solo eso', () => {
  const delAntropometrista: RenglonDeResumen = { profesionalId: ANT, alcanceDeVinculoId: AV_ANT, origenId: AV_NUT, area: 'NUTRICION', nivel: 'SUMMARY', desde: AYER };
  const resumen: RenglonDeResumen = { profesionalId: ENT, alcanceDeVinculoId: AV_ENT, origenId: AV_NUT, area: 'NUTRICION', nivel: 'SUMMARY', desde: AYER };
  assert.deepEqual(permisosAlAceptarUnPedido({ vigentes: null, profesionalId: ENT, area: 'NUTRICION' }), [{ professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' }]);
  assert.deepEqual(permisosAlAceptarUnPedido({ vigentes: [delAntropometrista, resumen], profesionalId: ENT, area: 'NUTRICION' }), [
    { professionalId: ANT, area: 'NUTRICION', level: 'SUMMARY' },
    { professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' },
  ]);
});

test('TEST-TAG-037 · lo avanzado: semanas de lunes a domingo desde la de la activación, con las vacías en cero, sin lo de antes y hasta 12', () => {
  // El miércoles 4 de noviembre de 2026 se activó; hoy es sábado 21.
  assert.deepEqual(semanasDeLoAvanzado({ activadoEl: '2026-11-04', hoy: '2026-11-21', registradas: ['2026-11-03', '2026-11-04', '2026-11-08', '2026-11-20', '2026-11-20'] }), [
    { weekStart: '2026-11-02', recorded: 2 },
    { weekStart: '2026-11-09', recorded: 0 },
    { weekStart: '2026-11-16', recorded: 2 },
  ]);
  const largo = semanasDeLoAvanzado({ activadoEl: '2026-01-05', hoy: '2026-11-21', registradas: [] });
  assert.equal(largo.length, 12);
  assert.equal(largo[11]!.weekStart, '2026-11-16');
  assert.deepEqual(semanasDeLoAvanzado({ activadoEl: '2026-11-22', hoy: '2026-11-21', registradas: [] }), []);
  assert.equal(sesionesPorSemanaDeLaAgenda(null), null);
  assert.equal(
    sesionesPorSemanaDeLaAgenda({ startDate: '2026-11-02', sessions: [{ sessionId: 'ses-a', weekdays: ['MONDAY', 'THURSDAY'] }, { sessionId: 'ses-b', weekdays: ['SATURDAY'] }], moves: [] }),
    3,
  );
});

test('TEST-TAG-037 · el texto del acto es una propuesta, pendiente de validación jurídica, con su hash, y dice lo que hace la implementación', () => {
  const v = VERSION_VIGENTE.RESUMENES_COMPARTIDOS;
  assert.equal(v.id, 'resumenes-compartidos-2026-11-propuesta');
  assert.ok(VERSIONES_PROPUESTAS.has(v.id));
  assert.equal(createHash('sha256').update(v.texto, 'utf8').digest('hex'), v.hash);
  for (const frase of [
    'Texto propuesto, pendiente de validación jurídica.',
    'La das por profesional y por área, en uno de dos niveles',
    'completo y de solo lectura, como lo ves vos en tu app',
    'No incluye los borradores, las versiones anteriores, lo que se habló en una revisión, las notas internas ni las evaluaciones.',
    'Antropometría no tiene plan: de esa área, solo el resumen.',
    'Si un vínculo se pausa o termina, ese profesional deja de verlo.',
    'si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir',
    'Quien ve tu plan no lo puede cambiar.',
    'Pedirlo no le da acceso: lo decidís vos, y podés decir que no.',
    'Cada vez que un profesional abre tu plan de otra área, queda registrado, y lo ves vos.',
    'Cerrar tu cuenta también la retira.',
    'Aceptar esta versión no acepta versiones futuras.',
  ]) {
    assert.ok(v.texto.includes(frase), `el texto no dice: ${frase}`);
  }
  assert.deepEqual(terminosProhibidosDeFormulariosEn(v.texto), []);
  for (const j of ['cumplimiento', 'adherencia', '%', 'puntaje']) assert.ok(!v.texto.includes(j), j);
});

test('TEST-TAG-040 · la novedad del pedido: importante, dice quién, desde qué área y qué plan, que es su decisión, y nada del plan; el aviso, genérico', () => {
  assert.ok((TIPOS_DE_NOVEDAD as readonly string[]).includes('PLAN_ACCESS_REQUESTED'));
  assert.equal(esNovedadImportante('PLAN_ACCESS_REQUESTED'), true);
  const t = textoDeNovedad('PLAN_ACCESS_REQUESTED', { alcance: 'ENTRENAMIENTO', fuente: 'Martín Acosta', planDe: 'NUTRICION' });
  assert.deepEqual(t, {
    title: 'Te piden ver tu plan',
    body: 'Martín Acosta, de Entrenamiento, te pide ver tu plan de Nutrición, completo y de solo lectura: no lo puede cambiar. Es tu decisión, y la podés cambiar cuando quieras.',
  });
  assert.doesNotMatch(`${t.title} ${t.body}`, /\d|kcal|sesi|comida/i);
  assert.equal(vistaDeNovedad('PLAN_ACCESS_REQUESTED', 'ENTRENAMIENTO', false), 'NEWS');
  assert.equal(textoDelAvisoPush(['PLAN_ACCESS_REQUESTED']), 'Tenés una novedad.');
});

test('el cliente: las nueve operaciones de la familia RES (de la 01 a la 10, sin la 05), con la Idempotency-Key en las escrituras', async () => {
  const llamadas: { metodo: string; url: string; clave: string | null }[] = [];
  const cliente = crearClienteBe({
    baseUrl: 'https://api.example.invalid/api/v1',
    superficie: 'WEB',
    fetch: async (url, init) => {
      llamadas.push({ metodo: init?.method ?? 'GET', url: String(url), clave: new Headers(init?.headers).get('Idempotency-Key') });
      return new Response(JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' } }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    },
  });
  await cliente.misResumenesCompartidos('t');
  await cliente.compartirResumenes('t', { expectedVersion: null, textVersionId: 'x', grants: [{ professionalId: ENT, area: 'NUTRICION', level: 'SUMMARY' }] }, 'c-1');
  await cliente.dejarDeCompartirResumenes('t', { expectedVersion: 'v1' }, 'c-2');
  await cliente.resumenesCompartidos('t', NUT);
  await cliente.planCompartido('t', NUT, 'ENTRENAMIENTO');
  await cliente.loQueSeComparteDeMiArea('t', NUT);
  await cliente.pedirVerElPlan('t', NUT, { scope: 'ENTRENAMIENTO', area: 'NUTRICION' }, 'c-3');
  await cliente.pedidosDePlan('t');
  await cliente.responderPedidoDePlan('t', ENT, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }, 'c-4');
  const B = 'https://api.example.invalid/api/v1';
  assert.deepEqual(llamadas, [
    { metodo: 'GET', url: `${B}/me/summary-sharing`, clave: null },
    { metodo: 'PUT', url: `${B}/me/summary-sharing`, clave: 'c-1' },
    { metodo: 'POST', url: `${B}/me/summary-sharing/withdrawal`, clave: 'c-2' },
    { metodo: 'GET', url: `${B}/advisees/${NUT}/shared-summaries`, clave: null },
    { metodo: 'GET', url: `${B}/advisees/${NUT}/shared-summaries/ENTRENAMIENTO/plan`, clave: null },
    { metodo: 'GET', url: `${B}/advisees/${NUT}/shared-summaries/outgoing`, clave: null },
    { metodo: 'POST', url: `${B}/advisees/${NUT}/shared-summaries/access-requests`, clave: 'c-3' },
    { metodo: 'GET', url: `${B}/me/summary-sharing/access-requests`, clave: null },
    { metodo: 'POST', url: `${B}/me/summary-sharing/access-requests/${ENT}/answer`, clave: 'c-4' },
  ]);
});
