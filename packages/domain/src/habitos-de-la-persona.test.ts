/**
 * DL-165 D-9 (WP-FORMULARIOS-RONDA-2, FR-10) · los hábitos de la persona y la autorización para compartirlos, sin base de
 * datos: la parte común, cómo queda la versión que agrega un formulario (D-16), la precarga de «¿Sigue igual?», qué dice
 * la autorización de cada profesional (con el que llega después, D-17), los renglones de una versión nueva, quién los
 * recibe hoy, el texto del acto (una propuesta) y los contratos de la familia API-HBT. La API y la base hacen lo mismo, con
 * sus pruebas de integración (`habitos-de-la-persona.int-spec.ts`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { crearClienteBe } from './cliente-http';
import { CompartirHabitosRequestSchema, HabitosCompartidosResponseSchema, MisHabitosResponseSchema, RegistrarHabitosRequestSchema } from './contratos-habitos-de-la-persona';
import type { RespuestaDeCampoV2Entrada } from './contratos-formularios-v2';
import { COPY_HABITOS } from './copy-habitos-de-la-persona';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { validarRespuestasV2 } from './formularios-v2';
import {
  CAMPOS_DE_HABITOS,
  CODIGO_DE_LA_PARTE_DE_HABITOS,
  comoLosRecibe,
  desdeCuandoLosRecibe,
  habitosDespuesDeUnFormulario,
  habitosEnOrden,
  hayQuePreguntar,
  parteDeHabitos,
  precargaDeHabitos,
  problemasDelPedidoDeCompartir,
  renglonesDeLaAutorizacion,
  SOLICITUD_DE_MIS_HABITOS,
  traeLaParteDeHabitos,
  type ComponenteParaHabitos,
  type RenglonDeLaAutorizacion,
} from './habitos-de-la-persona';
import { OPERACIONES } from './openapi';
import { PLANTILLA_ENTRENAMIENTO_V2, PLANTILLA_ENTRENAMIENTO_V3, PLANTILLA_NUTRICION_INICIO, PLANTILLA_NUTRICION_INICIO_V2, SECCION_DE_HABITOS } from './plantillas-de-inicio';
import { VERSION_VIGENTE, VERSIONES_PROPUESTAS } from './textos';

const r = (fieldCode: string, answer: RespuestaDeCampoV2Entrada['answer']): RespuestaDeCampoV2Entrada => ({ fieldCode, answer });
const HORARIOS = r('habitos_horarios', { type: 'TIMES', times: [{ part: 'semana_me_levanto', time: '07:00' }, { part: 'semana_me_acuesto', time: '23:30' }] });
const SUENO = (h: number) => r('horas_de_sueno', { type: 'NUMBER', number: h, unit: 'h' });
const ACTIVIDAD = r('nivel_de_actividad', { type: 'CHOICE', option: 'sentado_y_de_pie', otherText: null });
const HACE = (si: boolean) => r('habitos_hace_deporte', { type: 'BOOLEAN', yes: si });
const DEPORTES = r('habitos_deportes', { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['jue', 'lun'], momento: 'noche', minutos: 90, exigencia: 'moderada' }] });
const ESTRES = (o: string) => r('habitos_estres', { type: 'CHOICE', option: o, otherText: null });
const TODOS: RespuestaDeCampoV2Entrada[] = [HORARIOS, SUENO(7.5), ACTIVIDAD, HACE(true), DEPORTES, ESTRES('normal')];
const codigos = (rs: readonly RespuestaDeCampoV2Entrada[] | null) => rs?.map((x) => x.fieldCode) ?? null;

test('D-9 · la parte «Tus hábitos» es la misma en las dos versiones vigentes, solo con hábitos, y no está en las de DL-164', () => {
  assert.equal(CODIGO_DE_LA_PARTE_DE_HABITOS, 'tus_habitos');
  assert.deepEqual(CAMPOS_DE_HABITOS, ['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes', 'habitos_estres']);
  for (const p of [PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_ENTRENAMIENTO_V3]) {
    assert.deepEqual(parteDeHabitos(p.sections), SECCION_DE_HABITOS, `${p.clave} v${p.version}`);
    assert.equal(traeLaParteDeHabitos(p.sections), true);
    // Ninguna pregunta de la parte aparece además en otra parte.
    const fuera = p.sections.filter((s) => s.sectionCode !== 'tus_habitos').flatMap((s) => s.fields.map((c) => c.fieldCode));
    assert.deepEqual(fuera.filter((c) => CAMPOS_DE_HABITOS.includes(c)), [], p.clave);
  }
  for (const p of [PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2]) assert.equal(traeLaParteDeHabitos(p.sections), false, `${p.clave} v${p.version}`);
  // Solo hábitos: nada de la salud (D-9), y todo de la categoría de hábitos.
  assert.ok(SECCION_DE_HABITOS.fields.every((c) => c.category === 'HABITOS_Y_CONTEXTO'));
  // Lo dice al empezar la parte: también queda en «Mis hábitos».
  assert.match(SECCION_DE_HABITOS.intro ?? '', /«Mis hábitos»/);
});

test('«Mis hábitos» valida la parte entera sin obligatorias; una lista abierta sigue exigiendo sus renglones', () => {
  assert.deepEqual(validarRespuestasV2([SECCION_DE_HABITOS], SOLICITUD_DE_MIS_HABITOS, []), []);
  assert.deepEqual(validarRespuestasV2([SECCION_DE_HABITOS], SOLICITUD_DE_MIS_HABITOS, TODOS), []);
  const sinMinutos = r('habitos_deportes', { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun'], momento: 'noche', exigencia: 'suave' }] });
  assert.deepEqual(validarRespuestasV2([SECCION_DE_HABITOS], SOLICITUD_DE_MIS_HABITOS, [HACE(true), sinMinutos]).map((p) => p.code), ['FORM_ANSWER_ITEM_FIELD_REQUIRED']);
  // Con «No» en el deporte, la lista no se ve: mandarla es un problema.
  assert.deepEqual(validarRespuestasV2([SECCION_DE_HABITOS], SOLICITUD_DE_MIS_HABITOS, [HACE(false), DEPORTES]).map((p) => p.code), ['FORM_ANSWER_NOT_VISIBLE']);
});

test('habitosEnOrden: en el orden de la parte, una vez cada una, en su forma canónica, sin lo oculto ni lo que la parte no acepta', () => {
  const desordenadas = [ESTRES('normal'), r('nut_agua', { type: 'CHOICE', option: '2_a_4', otherText: null }), SUENO(20), DEPORTES, HACE(true), ACTIVIDAD, ACTIVIDAD];
  const enOrden = habitosEnOrden(desordenadas);
  // El número fuera de sus límites y la pregunta de otra parte se descartan; la repetida, una vez.
  assert.deepEqual(codigos(enOrden), ['nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes', 'habitos_estres']);
  // Los días del renglón, en el orden de la pregunta.
  const lista = enOrden.find((x) => x.fieldCode === 'habitos_deportes')!.answer;
  assert.ok(lista.type === 'LIST');
  assert.deepEqual(lista.items[0]!.que_dias, ['lun', 'jue']);
  // Con «No», la lista sale.
  assert.deepEqual(codigos(habitosEnOrden([HACE(false), DEPORTES])), ['habitos_hace_deporte']);
});

test('D-16 · lo que el formulario preguntó de la parte reemplaza lo vigente, lo que no preguntó queda, y lo que dejó sin responder sale', () => {
  const parte = SECCION_DE_HABITOS;
  // La primera vez, lo respondido.
  assert.deepEqual(codigos(habitosDespuesDeUnFormulario({ parte, pedidos: CAMPOS_DE_HABITOS, respondidas: TODOS, vigentes: null })), CAMPOS_DE_HABITOS);
  // Un formulario que pidió dos preguntas: esas cambian, las otras cuatro quedan.
  const despues = habitosDespuesDeUnFormulario({ parte, pedidos: ['horas_de_sueno', 'habitos_estres', 'trn_objetivo_declarado'], respondidas: [SUENO(6), ESTRES('cargada')], vigentes: habitosEnOrden(TODOS) })!;
  assert.deepEqual(codigos(despues), CAMPOS_DE_HABITOS);
  assert.deepEqual(despues.find((x) => x.fieldCode === 'horas_de_sueno')!.answer, { type: 'NUMBER', number: 6, unit: 'h' });
  assert.deepEqual(despues.find((x) => x.fieldCode === 'habitos_estres')!.answer, { type: 'CHOICE', option: 'cargada', otherText: null });
  // Pedida y sin responder (la persona quitó su respuesta): sale de lo vigente.
  assert.deepEqual(codigos(habitosDespuesDeUnFormulario({ parte, pedidos: ['habitos_estres'], respondidas: [], vigentes: habitosEnOrden(TODOS) })), CAMPOS_DE_HABITOS.filter((c) => c !== 'habitos_estres'));
  // «No» en el deporte, preguntado: la lista vigente queda oculta y sale, aunque el formulario no la haya pedido.
  assert.deepEqual(codigos(habitosDespuesDeUnFormulario({ parte, pedidos: ['habitos_hace_deporte'], respondidas: [HACE(false)], vigentes: habitosEnOrden(TODOS) })), ['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_estres']);
  // Un formulario que no pidió nada de la parte no agrega nada; tampoco el que no tiene vigente y no respondió nada de ella.
  assert.equal(habitosDespuesDeUnFormulario({ parte, pedidos: ['trn_objetivo_declarado'], respondidas: [], vigentes: habitosEnOrden(TODOS) }), null);
  assert.equal(habitosDespuesDeUnFormulario({ parte, pedidos: ['habitos_estres'], respondidas: [], vigentes: null }), null);
  // Si quitó lo único que había, la versión nueva queda vacía: lo vigente es «nada».
  assert.deepEqual(habitosDespuesDeUnFormulario({ parte, pedidos: ['habitos_estres'], respondidas: [], vigentes: [ESTRES('normal')] }), []);
});

test('D-18 · la precarga de «¿Sigue igual?» trae lo vigente de lo que el formulario pide, y nada si no trae la parte', () => {
  const secciones = PLANTILLA_ENTRENAMIENTO_V3.sections;
  const vigentes = habitosEnOrden(TODOS);
  assert.deepEqual(codigos(precargaDeHabitos(secciones, { requestedFieldCodes: ['trn_objetivo_declarado', 'horas_de_sueno', 'habitos_estres'] }, vigentes)), ['horas_de_sueno', 'habitos_estres']);
  assert.deepEqual(codigos(precargaDeHabitos(secciones, { requestedFieldCodes: [...CAMPOS_DE_HABITOS] }, vigentes)), CAMPOS_DE_HABITOS);
  // La lista sin la pregunta de la que depende no se precarga: no se vería.
  assert.deepEqual(codigos(precargaDeHabitos(secciones, { requestedFieldCodes: ['habitos_deportes'] }, vigentes)), []);
  assert.deepEqual(precargaDeHabitos(PLANTILLA_ENTRENAMIENTO_V2.sections, { requestedFieldCodes: ['horas_de_sueno'] }, vigentes), []);
});

// ─── La autorización ────────────────────────────────────────────────────────────────────────────

const NUT = 'aaaaaaaa-0000-4000-8000-000000000001';
const ENT = 'aaaaaaaa-0000-4000-8000-000000000002';
const ANT = 'aaaaaaaa-0000-4000-8000-000000000003';
const c = (id: string, estado: 'ACEPTADO' | 'PAUSADO' = 'ACEPTADO', alcance: ComponenteParaHabitos['alcance'] = 'NUTRICION'): ComponenteParaHabitos => ({ alcanceDeVinculoId: id, alcance, estado });
const ANTES = '2026-11-05T10:00:00.000Z';
const AHORA = '2026-11-06T10:00:00.000Z';

test('comoLosRecibe: los recibe, dijo que no, o llegó después (NOT_ASKED); sin la autorización activa, nadie', () => {
  const renglones: RenglonDeLaAutorizacion[] = [
    { profesionalId: NUT, alcanceDeVinculoId: 'av-nut', incluido: true, incluidoDesde: ANTES },
    { profesionalId: ENT, alcanceDeVinculoId: 'av-ent', incluido: false, incluidoDesde: null },
  ];
  assert.deepEqual(comoLosRecibe([c('av-nut')], NUT, renglones), { sharing: 'RECEIVES', sharedSince: ANTES });
  assert.deepEqual(comoLosRecibe([c('av-ent')], ENT, renglones), { sharing: 'DOES_NOT_RECEIVE', sharedSince: null });
  assert.deepEqual(comoLosRecibe([c('av-ant')], ANT, renglones), { sharing: 'NOT_ASKED', sharedSince: null });
  // En pausa sigue en la lista (no los ve mientras dure: lo decide el PDP).
  assert.deepEqual(comoLosRecibe([c('av-nut', 'PAUSADO')], NUT, renglones).sharing, 'RECEIVES');
  // Terminó su vínculo y volvió con otro componente: es alguien que llega después (D-17).
  assert.deepEqual(comoLosRecibe([c('av-nut-2')], NUT, renglones).sharing, 'NOT_ASKED');
  assert.deepEqual(comoLosRecibe([c('av-nut')], NUT, null), { sharing: 'DOES_NOT_RECEIVE', sharedSince: null });
  // Se le pregunta solo con el vínculo aceptado y la autorización activa.
  assert.equal(hayQuePreguntar([c('av-ant')], ANT, renglones), true);
  assert.equal(hayQuePreguntar([c('av-ant', 'PAUSADO')], ANT, renglones), false);
  assert.equal(hayQuePreguntar([c('av-ant')], ANT, null), false);
  assert.equal(hayQuePreguntar([c('av-nut')], NUT, renglones), false);
});

test('renglonesDeLaAutorizacion: la lista explícita, con desde cuándo; el «no» queda; el que nadie nombró, no; un área nueva se registra', () => {
  const profesionales = [
    { profesionalId: NUT, componentes: [c('av-nut'), c('av-nut-ant', 'ACEPTADO', 'ANTROPOMETRIA')] },
    { profesionalId: ENT, componentes: [c('av-ent', 'PAUSADO', 'ENTRENAMIENTO')] },
    { profesionalId: ANT, componentes: [c('av-ant', 'ACEPTADO', 'ANTROPOMETRIA')] },
  ];
  // La primera: la nutricionista la recibe; el entrenador, en pausa, también; al antropometrista se le dijo que no.
  const primera = renglonesDeLaAutorizacion({ profesionales, anteriores: null, incluidos: new Set([NUT, ENT]), declinados: new Set([ANT]), ahora: ANTES });
  assert.deepEqual(primera, [
    { profesionalId: NUT, alcanceDeVinculoId: 'av-nut', incluido: true, incluidoDesde: ANTES },
    { profesionalId: NUT, alcanceDeVinculoId: 'av-nut-ant', incluido: true, incluidoDesde: ANTES },
    { profesionalId: ENT, alcanceDeVinculoId: 'av-ent', incluido: true, incluidoDesde: ANTES },
    { profesionalId: ANT, alcanceDeVinculoId: 'av-ant', incluido: false, incluidoDesde: null },
  ]);
  // Después: el entrenador sale; la nutricionista conserva desde cuándo; el «no» del antropometrista sigue aunque esta vez
  // nadie lo nombre; y uno que llega después y nadie nombró no aparece (sigue NOT_ASKED).
  const NUEVO = 'aaaaaaaa-0000-4000-8000-000000000009';
  const segunda = renglonesDeLaAutorizacion({
    profesionales: [...profesionales, { profesionalId: NUEVO, componentes: [c('av-nuevo')] }],
    anteriores: primera,
    incluidos: new Set([NUT]),
    declinados: new Set([ENT]),
    ahora: AHORA,
  });
  assert.deepEqual(segunda, [
    { profesionalId: NUT, alcanceDeVinculoId: 'av-nut', incluido: true, incluidoDesde: ANTES },
    { profesionalId: NUT, alcanceDeVinculoId: 'av-nut-ant', incluido: true, incluidoDesde: ANTES },
    { profesionalId: ENT, alcanceDeVinculoId: 'av-ent', incluido: false, incluidoDesde: null },
    { profesionalId: ANT, alcanceDeVinculoId: 'av-ant', incluido: false, incluidoDesde: null },
  ]);
  assert.equal(comoLosRecibe([c('av-nuevo')], NUEVO, segunda).sharing, 'NOT_ASKED');
  // Sumarlo después: desde ahora.
  const tercera = renglonesDeLaAutorizacion({ profesionales: [{ profesionalId: NUEVO, componentes: [c('av-nuevo')] }], anteriores: segunda, incluidos: new Set([NUEVO]), declinados: new Set(), ahora: AHORA });
  assert.deepEqual(tercera, [{ profesionalId: NUEVO, alcanceDeVinculoId: 'av-nuevo', incluido: true, incluidoDesde: AHORA }]);
});

test('problemasDelPedidoDeCompartir y desdeCuandoLosRecibe: solo quien acompaña hoy, una vez; y los recibe solo con un componente que el PDP permite', () => {
  const disponibles = new Set([NUT, ENT]);
  assert.deepEqual(problemasDelPedidoDeCompartir(disponibles, [NUT], [ENT]), []);
  assert.deepEqual(problemasDelPedidoDeCompartir(disponibles, [NUT, ANT, NUT.toUpperCase()], [ENT, NUT]), [
    { code: 'HABITS_RECIPIENT_NOT_AVAILABLE', path: 'professionalIds[1]' },
    { code: 'HABITS_RECIPIENT_REPEATED', path: 'professionalIds[2]' },
    { code: 'HABITS_RECIPIENT_REPEATED', path: 'declinedProfessionalIds[1]' },
  ]);
  const renglones: RenglonDeLaAutorizacion[] = [
    { profesionalId: NUT, alcanceDeVinculoId: 'av-nut', incluido: true, incluidoDesde: ANTES },
    { profesionalId: ENT, alcanceDeVinculoId: 'av-ent', incluido: false, incluidoDesde: null },
  ];
  assert.equal(desdeCuandoLosRecibe(NUT, ['av-nut'], renglones), ANTES);
  // En pausa o terminado, el PDP no lo permite: no está entre los permitidos.
  assert.equal(desdeCuandoLosRecibe(NUT, [], renglones), null);
  // Con otro componente que la lista no nombra (volvió con otro vínculo), tampoco.
  assert.equal(desdeCuandoLosRecibe(NUT, ['av-nut-2'], renglones), null);
  assert.equal(desdeCuandoLosRecibe(ENT, ['av-ent'], renglones), null);
  assert.equal(desdeCuandoLosRecibe(NUT, ['av-nut'], null), null);
});

// ─── El texto del acto, el copy y los contratos ─────────────────────────────────────────────────

test('el texto del acto es una propuesta, pendiente de validación jurídica, con su hash, y dice lo que hace la implementación', () => {
  const v = VERSION_VIGENTE.HABITOS_COMPARTIDOS;
  assert.equal(v.id, 'habitos-compartidos-2026-11-propuesta');
  assert.ok(VERSIONES_PROPUESTAS.has(v.id));
  assert.equal(createHash('sha256').update(v.texto, 'utf8').digest('hex'), v.hash);
  assert.match(v.texto, /Texto propuesto, pendiente de validación jurídica\./);
  assert.match(v.texto, /Texto de demostración/);
  for (const frase of [
    'sobre una sola categoría de datos: tus hábitos',
    'No incluye tu salud (medicación, condiciones o embarazo) ni el resto de tus formularios.',
    'sin esta autorización, cada profesional ve solo lo que le respondiste a él, en su formulario',
    'No ven de qué formulario salió ni tus versiones anteriores.',
    'solo los profesionales que elijas en la lista, mientras su vínculo con vos esté vigente y su acceso esté autorizado',
    'Si un vínculo se pausa o termina, ese profesional deja de verlos.',
    'Un profesional que empiece a acompañarte después no los ve: BE te pregunta antes, y si no respondés, no los ve.',
    'Cada vez que un profesional los abre, queda registrado.',
    'Al retirarla, ninguno de tus profesionales los ve desde ese momento. No se borra nada',
    'Retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.',
    'Aceptar esta versión no acepta versiones futuras.',
  ]) {
    assert.ok(v.texto.includes(frase), `el texto no dice: ${frase}`);
  }
  assert.deepEqual(terminosProhibidosDeFormulariosEn(v.texto), []);
});

/** Todos los textos de un objeto de copy, también los de las funciones (con valores de muestra). */
function textosDeCopy(o: unknown): string[] {
  if (typeof o === 'string') return [o];
  if (typeof o === 'function') return [String((o as (...a: unknown[]) => unknown)('5/11', 'FORM'))];
  if (o && typeof o === 'object') return Object.values(o).flatMap(textosDeCopy);
  return [];
}

test('el copy de los hábitos: frases cortas, sin términos prohibidos ni juicios, y el origen sin el área ni el formulario', () => {
  const textos = textosDeCopy(COPY_HABITOS);
  assert.ok(textos.length > 40);
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
    for (const j of ['cumplimiento', 'px', 'adherencia', 'saludable', 'puntaje']) assert.ok(!t.toLowerCase().includes(j), `«${t}» dice «${j}»`);
  }
  assert.deepEqual(COPY_HABITOS.origen, { FORM: 'en un formulario', MY_HABITS: 'en «Mis hábitos»' });
  assert.equal(COPY_HABITOS.web.compartidoEl('5/11'), 'Compartido por la persona el 5/11');
  assert.equal(COPY_HABITOS.apk.sigueIgual('5/11'), 'Ya lo respondiste el 5/11: ¿sigue igual?');
});

test('la familia API-HBT: cinco operaciones propias de BE, con sus rutas, y el cliente las llama así', async () => {
  const hbt = OPERACIONES.filter((o) => o.id.startsWith('API-HBT-'));
  assert.deepEqual(hbt.map((o) => [o.id, o.metodo, o.ruta, o.idempotencia]), [
    ['API-HBT-01', 'get', '/me/habits', false],
    ['API-HBT-02', 'post', '/me/habits', true],
    ['API-HBT-03', 'put', '/me/habits/sharing', true],
    ['API-HBT-04', 'post', '/me/habits/sharing/withdrawal', true],
    ['API-HBT-05', 'get', '/advisees/{adviseeId}/habits', false],
  ]);
  // HAB sigue siendo «Mis habituales» (DL-109): ninguna de esas rutas es de hábitos (D-14).
  assert.ok(OPERACIONES.filter((o) => o.id.startsWith('API-HAB-')).every((o) => !o.ruta.includes('/habits')));
  const llamadas: { metodo: string; url: string; clave: string | null }[] = [];
  const cliente = crearClienteBe({
    baseUrl: 'https://api.example.invalid/api/v1',
    superficie: 'APK',
    fetch: async (url, init) => {
      llamadas.push({ metodo: init?.method ?? 'GET', url: String(url), clave: new Headers(init?.headers).get('Idempotency-Key') });
      return new Response(JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' } }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    },
  });
  await cliente.misHabitos('t');
  await cliente.registrarMisHabitos('t', { expectedVersion: null, answers: [] }, 'clave-1');
  await cliente.compartirMisHabitos('t', { expectedVersion: null, textVersionId: 'x', professionalIds: [NUT], declinedProfessionalIds: [] }, 'clave-2');
  await cliente.dejarDeCompartirMisHabitos('t', { expectedVersion: 'v1' }, 'clave-3');
  await cliente.habitosDeLaPersona('t', NUT);
  assert.deepEqual(llamadas, [
    { metodo: 'GET', url: 'https://api.example.invalid/api/v1/me/habits', clave: null },
    { metodo: 'POST', url: 'https://api.example.invalid/api/v1/me/habits', clave: 'clave-1' },
    { metodo: 'PUT', url: 'https://api.example.invalid/api/v1/me/habits/sharing', clave: 'clave-2' },
    { metodo: 'POST', url: 'https://api.example.invalid/api/v1/me/habits/sharing/withdrawal', clave: 'clave-3' },
    { metodo: 'GET', url: `https://api.example.invalid/api/v1/advisees/${NUT}/habits`, clave: null },
  ]);
});

test('los contratos son estrictos: lo que ve el profesional no trae la historia ni de qué formulario salió', () => {
  const visto = {
    data: { section: SECCION_DE_HABITOS, sharedSince: ANTES, current: { answers: [{ ...SUENO(7), provenance: 'SELF_REPORTED' }], recordedAt: ANTES, origin: 'FORM' } },
  };
  assert.ok(HabitosCompartidosResponseSchema.safeParse(visto).success);
  assert.equal(HabitosCompartidosResponseSchema.safeParse({ data: { ...visto.data, current: { ...visto.data.current, formRequestId: 'x' } } }).success, false);
  assert.equal(HabitosCompartidosResponseSchema.safeParse({ data: { ...visto.data, history: [] } }).success, false);
  assert.equal(CompartirHabitosRequestSchema.safeParse({ expectedVersion: null, textVersionId: 'x', professionalIds: [], declinedProfessionalIds: [] }).success, false);
  assert.ok(RegistrarHabitosRequestSchema.safeParse({ expectedVersion: null, answers: [] }).success);
  assert.ok(
    MisHabitosResponseSchema.safeParse({
      data: {
        section: SECCION_DE_HABITOS,
        current: null,
        history: [],
        sharing: { status: 'NOT_GIVEN', version: null, activeSince: null, withdrawnAt: null, acceptedTextVersionId: null },
        professionals: [],
        text: { id: 'x', title: 't', text: 't', textHash: 'h', effectiveFrom: ANTES, approval: 'PENDING_APPROVAL' },
      },
    }).success,
  );
});

test('DL-152 · ninguna APK congelada lee API-HBT (la 0.20 no las conoce)', () => {
  const carpeta = join(__dirname, '..', 'fixtures', 'lecturas-de-la-apk');
  for (const archivo of readdirSync(carpeta).filter((f) => f.endsWith('.json'))) {
    const congelado = JSON.parse(readFileSync(join(carpeta, archivo), 'utf8')) as { lecturas: Record<string, { ruta?: string }> };
    const ids = Object.keys(congelado.lecturas);
    assert.deepEqual(ids.filter((id) => id.startsWith('API-HBT-')), [], archivo);
    assert.ok(Object.values(congelado.lecturas).every((l) => !(l.ruta ?? '').includes('/habits')), archivo);
  }
});
