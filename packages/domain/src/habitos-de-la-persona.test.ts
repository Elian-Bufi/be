/**
 * DL-165 D-9 (WP-FORMULARIOS-RONDA-2, FR-10) · los hábitos de la persona y la autorización para compartirlos, sin base de
 * datos: la parte común, cómo queda la versión que agrega un formulario (D-16), la precarga de «¿Sigue igual?», qué dice
 * la autorización de cada profesional (con el que llega después, D-17), los renglones de una versión nueva, quién los
 * recibe hoy, el texto del acto (una propuesta) y los contratos de la familia API-HBT. La API y la base hacen lo mismo, con
 * sus pruebas de integración (`habitos-de-la-persona.int-spec.ts`).
 *
 * Ronda 2.1 (D-15 y D-17 nuevas de Dirección, 2026-11-06): «Tus hábitos» aparte (FRM-HABITOS v2), la sugerencia al pedir
 * (D-22), el límite de los pedidos de acceso (D-24), a quiénes nombra un «Sí» a un pedido (D-25), la novedad nueva y las
 * operaciones API-HBT-06 a 09.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { crearClienteBe } from './cliente-http';
import {
  CompartirHabitosRequestSchema,
  HabitosCompartidosResponseSchema,
  HabitosParaElProfesionalResponseSchema,
  MisHabitosResponseSchema,
  PedidosDeAccesoResponseSchema,
  RegistrarHabitosRequestSchema,
  ResponderPedidoDeAccesoRequestSchema,
} from './contratos-habitos-de-la-persona';
import { esNovedadImportante, NovedadSchema, VISTAS_DE_NOVEDAD } from './contratos-novedades';
import { textoDeNovedad, textoDelAvisoPush, vistaDeNovedad } from './copy-novedades';
import type { RespuestaDeCampoV2Entrada } from './contratos-formularios-v2';
import { COPY_HABITOS } from './copy-habitos-de-la-persona';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { validarRespuestasV2 } from './formularios-v2';
import {
  CAMPOS_DE_HABITOS,
  CODIGO_DE_LA_PARTE_DE_HABITOS,
  comoLosRecibe,
  compartirAlAceptarUnPedido,
  desdeCuandoLosRecibe,
  desdeCuandoSePuedeVolverAPedir,
  habitosDespuesDeUnFormulario,
  habitosEnOrden,
  hayQuePreguntar,
  parteDeHabitos,
  precargaDeHabitos,
  problemasDelPedidoDeCompartir,
  puedePedirAcceso,
  renglonesDeLaAutorizacion,
  SOLICITUD_DE_MIS_HABITOS,
  sugerenciaDeSumarHabitos,
  tienenMasDeTresMeses,
  traeLaParteDeHabitos,
  type ComponenteParaHabitos,
  type RenglonDeLaAutorizacion,
} from './habitos-de-la-persona';
import { OPERACIONES } from './openapi';
import {
  PLANTILLA_ENTRENAMIENTO_V2,
  PLANTILLA_ENTRENAMIENTO_V3,
  PLANTILLA_ENTRENAMIENTO_V4,
  PLANTILLA_HABITOS_V2,
  PLANTILLA_NUTRICION_INICIO,
  PLANTILLA_NUTRICION_INICIO_V2,
  PLANTILLA_NUTRICION_INICIO_V3,
  SECCION_DE_HABITOS,
} from './plantillas-de-inicio';
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

test('D-9 y D-20 · la parte «Tus hábitos» es la misma en las versiones que la traen (la ronda 2 y «Tus hábitos» aparte), solo con hábitos, y no está en las demás', () => {
  assert.equal(CODIGO_DE_LA_PARTE_DE_HABITOS, 'tus_habitos');
  assert.deepEqual(CAMPOS_DE_HABITOS, ['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes', 'habitos_estres']);
  for (const p of [PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_ENTRENAMIENTO_V3, PLANTILLA_HABITOS_V2]) {
    assert.deepEqual(parteDeHabitos(p.sections), SECCION_DE_HABITOS, `${p.clave} v${p.version}`);
    assert.equal(traeLaParteDeHabitos(p.sections), true);
    // Ninguna pregunta de la parte aparece además en otra parte.
    const fuera = p.sections.filter((s) => s.sectionCode !== 'tus_habitos').flatMap((s) => s.fields.map((c) => c.fieldCode));
    assert.deepEqual(fuera.filter((c) => CAMPOS_DE_HABITOS.includes(c)), [], p.clave);
  }
  // Las de DL-164 y las de área de la ronda 2.1 no la traen: responderlas no cambia los hábitos.
  for (const p of [PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2, PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4]) assert.equal(traeLaParteDeHabitos(p.sections), false, `${p.clave} v${p.version}`);
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

test('la familia API-HBT: nueve operaciones propias de BE, con sus rutas, y el cliente las llama así', async () => {
  const hbt = OPERACIONES.filter((o) => o.id.startsWith('API-HBT-'));
  assert.deepEqual(hbt.map((o) => [o.id, o.metodo, o.ruta, o.idempotencia]), [
    ['API-HBT-01', 'get', '/me/habits', false],
    ['API-HBT-02', 'post', '/me/habits', true],
    ['API-HBT-03', 'put', '/me/habits/sharing', true],
    ['API-HBT-04', 'post', '/me/habits/sharing/withdrawal', true],
    ['API-HBT-05', 'get', '/advisees/{adviseeId}/habits', false],
    // Ronda 2.1 (D-17 nueva): «Pedir acceso a sus hábitos».
    ['API-HBT-06', 'post', '/advisees/{adviseeId}/habits/access-requests', true],
    ['API-HBT-07', 'get', '/advisees/{adviseeId}/habits/status', false],
    ['API-HBT-08', 'get', '/me/habits/access-requests', false],
    ['API-HBT-09', 'post', '/me/habits/access-requests/{accessRequestId}/answer', true],
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
  await cliente.pedirAccesoAHabitos('t', NUT, { scope: 'NUTRICION' }, 'clave-4');
  await cliente.habitosParaElProfesional('t', NUT);
  await cliente.pedidosDeAccesoAMisHabitos('t');
  await cliente.responderPedidoDeAcceso('t', ENT, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }, 'clave-5');
  assert.deepEqual(llamadas, [
    { metodo: 'GET', url: 'https://api.example.invalid/api/v1/me/habits', clave: null },
    { metodo: 'POST', url: 'https://api.example.invalid/api/v1/me/habits', clave: 'clave-1' },
    { metodo: 'PUT', url: 'https://api.example.invalid/api/v1/me/habits/sharing', clave: 'clave-2' },
    { metodo: 'POST', url: 'https://api.example.invalid/api/v1/me/habits/sharing/withdrawal', clave: 'clave-3' },
    { metodo: 'GET', url: `https://api.example.invalid/api/v1/advisees/${NUT}/habits`, clave: null },
    { metodo: 'POST', url: `https://api.example.invalid/api/v1/advisees/${NUT}/habits/access-requests`, clave: 'clave-4' },
    { metodo: 'GET', url: `https://api.example.invalid/api/v1/advisees/${NUT}/habits/status`, clave: null },
    { metodo: 'GET', url: 'https://api.example.invalid/api/v1/me/habits/access-requests', clave: null },
    { metodo: 'POST', url: `https://api.example.invalid/api/v1/me/habits/access-requests/${ENT}/answer`, clave: 'clave-5' },
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

/**
 * DL-152 · hasta la 0.20.0-candidata.1 (versionCode 33) ninguna APK conoce API-HBT. La 0.21.0-candidata.1 (34) llama las de
 * la persona de la ronda 2 (01 a 04), con su forma congelada. Desde la ronda 2.1, una APK puede sumar las de la persona que
 * responden los pedidos de acceso (08 y 09), y nunca las del profesional (05 a 07), que son del website.
 */
const PRIMER_VERSION_CODE_CON_HBT = 34;
const DE_LA_PERSONA = new Set(['API-HBT-01', 'API-HBT-02', 'API-HBT-03', 'API-HBT-04', 'API-HBT-08', 'API-HBT-09']);

test('DL-152 · las APK congeladas hasta la 0.20 no leen API-HBT; la 0.21 lee solo las de la persona (01 a 04), y ninguna lee las del profesional', () => {
  const carpeta = join(__dirname, '..', 'fixtures', 'lecturas-de-la-apk');
  for (const archivo of readdirSync(carpeta).filter((f) => f.endsWith('.json'))) {
    const congelado = JSON.parse(readFileSync(join(carpeta, archivo), 'utf8')) as { apk: { versionCode: number }; lecturas: Record<string, { ruta?: string }> };
    const ids = Object.keys(congelado.lecturas).filter((id) => id.startsWith('API-HBT-'));
    const rutas = Object.values(congelado.lecturas)
      .map((l) => l.ruta ?? '')
      .filter((ruta) => ruta.includes('/habits'));
    if (congelado.apk.versionCode < PRIMER_VERSION_CODE_CON_HBT) {
      assert.deepEqual(ids, [], archivo);
      assert.deepEqual(rutas, [], archivo);
    } else {
      if (congelado.apk.versionCode === PRIMER_VERSION_CODE_CON_HBT) assert.deepEqual(ids, ['API-HBT-01', 'API-HBT-02', 'API-HBT-03', 'API-HBT-04'], archivo);
      for (const id of ['API-HBT-01', 'API-HBT-02', 'API-HBT-03', 'API-HBT-04']) assert.ok(ids.includes(id), `${archivo}: ${id}`);
      assert.ok(ids.every((id) => DE_LA_PERSONA.has(id)), archivo);
      assert.ok(rutas.every((ruta) => ruta.startsWith('/me/habits')), archivo);
    }
  }
});

// ─── Ronda 2.1 (2026-11-06) · la sugerencia, el límite, el «Sí» a un pedido y la novedad ──────────

test('D-22 · «Sumar «Tus hábitos»»: marcada sin hábitos o con más de 3 meses; sin marcar, con su fecha, si son recientes o si espera una', () => {
  const ahora = '2026-11-06T15:00:00.000Z';
  assert.deepEqual(sugerenciaDeSumarHabitos({ vistosEl: null, pendienteDesde: null, ahora }), { marcada: true, motivo: 'SIN_HABITOS', desde: null });
  assert.deepEqual(sugerenciaDeSumarHabitos({ vistosEl: '2026-10-01T12:00:00.000Z', pendienteDesde: null, ahora }), { marcada: false, motivo: 'RECIENTES', desde: '2026-10-01T12:00:00.000Z' });
  assert.deepEqual(sugerenciaDeSumarHabitos({ vistosEl: '2026-07-30T12:00:00.000Z', pendienteDesde: null, ahora }), { marcada: true, motivo: 'VIEJOS', desde: '2026-07-30T12:00:00.000Z' });
  // Con una solicitud con la parte esperando la respuesta, no se marca: pedirla de nuevo no le suma nada a la persona.
  assert.deepEqual(sugerenciaDeSumarHabitos({ vistosEl: null, pendienteDesde: '2026-11-01T12:00:00.000Z', ahora }), { marcada: false, motivo: 'PENDIENTE', desde: '2026-11-01T12:00:00.000Z' });
  // Los tres meses son de calendario: justo tres meses todavía no es «más»; un instante después, sí. Del 31 de agosto, el
  // límite es el 30 de noviembre (el último día del mes).
  assert.equal(tienenMasDeTresMeses('2026-08-06T15:00:00.000Z', '2026-11-06T15:00:00.000Z'), false);
  assert.equal(tienenMasDeTresMeses('2026-08-06T15:00:00.000Z', '2026-11-06T15:00:00.001Z'), true);
  assert.equal(tienenMasDeTresMeses('2026-08-31T12:00:00.000Z', '2026-11-30T12:00:00.000Z'), false);
  assert.equal(tienenMasDeTresMeses('2026-08-31T12:00:00.000Z', '2026-11-30T12:00:01.000Z'), true);
  assert.equal(tienenMasDeTresMeses('2026-11-30T12:00:00.000Z', '2027-03-01T12:00:00.000Z'), true);
  // Los textos de la casilla dicen la fecha y no califican nada.
  for (const t of [COPY_HABITOS.web.sugerencia.SIN_HABITOS(), COPY_HABITOS.web.sugerencia.VIEJOS('6/8'), COPY_HABITOS.web.sugerencia.RECIENTES('1/10'), COPY_HABITOS.web.sugerencia.PENDIENTE('1/11'), COPY_HABITOS.web.sumarHabitos, COPY_HABITOS.web.sumarHabitosQueEs]) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
  }
});

test('D-24 · el límite: quien ya los recibe no pide; una pendiente por vez, y volver a pedir recién a los 7 días del último', () => {
  const pedido = '2026-11-06T10:00:00.000Z';
  assert.equal(desdeCuandoSePuedeVolverAPedir(pedido), '2026-11-13T10:00:00.000Z');
  assert.deepEqual(puedePedirAcceso({ losRecibe: false, ultimoPedidoEl: null, ahora: pedido }), { puede: true });
  assert.deepEqual(puedePedirAcceso({ losRecibe: true, ultimoPedidoEl: null, ahora: pedido }), { puede: false, motivo: 'YA_LOS_RECIBE', desde: null });
  assert.deepEqual(puedePedirAcceso({ losRecibe: false, ultimoPedidoEl: pedido, ahora: '2026-11-13T09:59:59.999Z' }), { puede: false, motivo: 'MUY_PRONTO', desde: '2026-11-13T10:00:00.000Z' });
  assert.deepEqual(puedePedirAcceso({ losRecibe: false, ultimoPedidoEl: pedido, ahora: '2026-11-13T10:00:00.000Z' }), { puede: true });
});

test('D-25 · «Sí, que los vea» a un pedido: con la autorización activa, suma a quien pidió y nadie más cambia; sin compartir, solo él', () => {
  const profesionales = [
    { profesionalId: NUT, componentes: [c('av-nut')] },
    { profesionalId: ENT, componentes: [c('av-ent', 'ACEPTADO', 'ENTRENAMIENTO')] },
    { profesionalId: ANT, componentes: [c('av-ant', 'ACEPTADO', 'ANTROPOMETRIA')] },
  ];
  // Activa: la nutricionista los recibe, el entrenador dijo que no y la antropometrista llegó después. Pide el entrenador.
  const renglones: RenglonDeLaAutorizacion[] = [
    { profesionalId: NUT, alcanceDeVinculoId: 'av-nut', incluido: true, incluidoDesde: ANTES },
    { profesionalId: ENT, alcanceDeVinculoId: 'av-ent', incluido: false, incluidoDesde: null },
  ];
  const activa = compartirAlAceptarUnPedido({ profesionales, renglones, profesionalId: ENT });
  assert.deepEqual([[...activa.incluidos].sort(), [...activa.declinados]], [[NUT, ENT].sort(), []]);
  const nueva = renglonesDeLaAutorizacion({ profesionales, anteriores: renglones, ...activa, ahora: AHORA });
  assert.deepEqual(comoLosRecibe(profesionales[0]!.componentes, NUT, nueva), { sharing: 'RECEIVES', sharedSince: ANTES });
  assert.deepEqual(comoLosRecibe(profesionales[1]!.componentes, ENT, nueva), { sharing: 'RECEIVES', sharedSince: AHORA });
  // La que llegó después sigue sin que se le pregunte por ella: la persona respondió el pedido de otro.
  assert.deepEqual(comoLosRecibe(profesionales[2]!.componentes, ANT, nueva), { sharing: 'NOT_ASKED', sharedSince: null });
  // Sin compartir todavía (nunca o retirada): se activa solo para quien pidió, y los demás quedan nombrados como que no los
  // ven (no se les pregunta: la persona los suma cuando quiera).
  const sinCompartir = compartirAlAceptarUnPedido({ profesionales, renglones: null, profesionalId: ENT });
  assert.deepEqual([[...sinCompartir.incluidos], [...sinCompartir.declinados].sort()], [[ENT], [NUT, ANT].sort()]);
  const primera = renglonesDeLaAutorizacion({ profesionales, anteriores: null, ...sinCompartir, ahora: AHORA });
  assert.deepEqual(profesionales.map((p) => comoLosRecibe(p.componentes, p.profesionalId, primera).sharing), ['DOES_NOT_RECEIVE', 'RECEIVES', 'DOES_NOT_RECEIVE']);
  assert.equal(hayQuePreguntar(profesionales[0]!.componentes, NUT, primera), false);
  // D-17 nueva: la persona siempre puede cambiar de opinión. Volver a sumar al que dijo que no, desde «Cambiar con quiénes».
  const otraVez = renglonesDeLaAutorizacion({ profesionales, anteriores: primera, incluidos: new Set([ENT, NUT]), declinados: new Set([ANT]), ahora: '2026-11-07T10:00:00.000Z' });
  assert.deepEqual(comoLosRecibe(profesionales[0]!.componentes, NUT, otraVez), { sharing: 'RECEIVES', sharedSince: '2026-11-07T10:00:00.000Z' });
});

test('D-23 · la novedad del pedido: quién pide, desde qué área, para qué le sirve y que es su decisión; nunca un hábito, y el aviso, genérico', () => {
  for (const alcance of ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'] as const) {
    const t = textoDeNovedad('HABITS_ACCESS_REQUESTED', { alcance, fuente: 'Ana López' });
    assert.equal(t.title, 'Te piden ver tus hábitos');
    assert.match(t.body, /^Ana López, de (Nutrición|Entrenamiento|Antropometría), te pide ver tus hábitos\./);
    assert.ok(t.body.includes(COPY_HABITOS.paraQueLeSirven[alcance]), alcance);
    assert.match(t.body, /Es tu decisión/);
    // Sin presión, sin «recomendado» y sin culpa.
    assert.doesNotMatch(t.body, /recomend|deberías|tenés que|importante que/i);
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t.body), [], alcance);
  }
  // Abre «Mis hábitos» y la APK la destaca por su tipo; el resto, no.
  assert.equal(vistaDeNovedad('HABITS_ACCESS_REQUESTED', 'NUTRICION', false), 'MY_HABITS');
  assert.ok((VISTAS_DE_NOVEDAD as readonly string[]).includes('MY_HABITS'));
  assert.equal(esNovedadImportante('HABITS_ACCESS_REQUESTED'), true);
  assert.equal(esNovedadImportante('PLAN_ACTIVATED'), false);
  assert.equal(textoDelAvisoPush(['HABITS_ACCESS_REQUESTED']), 'Tenés una novedad.');
  // La novedad viaja en la forma de siempre: `kind` y `open.view` son texto, así una APK que no los conoce la lee igual (la 0.21).
  const novedad = { newsId: NUT, kind: 'HABITS_ACCESS_REQUESTED', scope: 'NUTRICION', source: { identityId: ENT, displayName: 'Ana López' }, title: 't', body: 'b', date: null, occurredAt: AHORA, recordedAt: AHORA, readAt: null, open: { view: 'MY_HABITS', referenceId: ANT } };
  assert.ok(NovedadSchema.safeParse(novedad).success);
  assert.equal(NovedadSchema.safeParse({ ...novedad, important: true }).success, false, 'un campo nuevo rompería a la 0.21: por eso se decide por el tipo');
  // Los textos de la app para responder: sin presión, y las dos respuestas con el mismo peso.
  for (const t of [COPY_HABITOS.apk.pedidosTitulo, COPY_HABITOS.apk.pedidoDe('Ana', 'Nutrición'), COPY_HABITOS.apk.loQueVeria, COPY_HABITOS.apk.esTuDecision, COPY_HABITOS.apk.pedidoSi, COPY_HABITOS.apk.pedidoNo, COPY_HABITOS.apk.soloEl('Ana'), COPY_HABITOS.apk.pedidoNoPorAhora('Ana')]) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
    assert.doesNotMatch(t, /recomend/i, t);
  }
});

test('los contratos de la ronda 2.1 son estrictos: el profesional no recibe hábitos ni qué respondió la persona; «Sí» lleva lo que se vio', () => {
  const estado = {
    data: { scopes: ['NUTRICION'], receives: false, sharedSince: null, latestSeenAt: null, pendingHabitsRequestSince: null, accessRequest: { accessRequestId: NUT, scope: 'NUTRICION', status: 'ANSWERED', requestedAt: ANTES }, canRequestAccess: false, canRequestAccessFrom: AHORA },
  };
  assert.ok(HabitosParaElProfesionalResponseSchema.safeParse(estado).success);
  assert.equal(HabitosParaElProfesionalResponseSchema.safeParse({ data: { ...estado.data, accessRequest: { ...estado.data.accessRequest, answer: 'NOT_NOW' } } }).success, false);
  assert.equal(HabitosParaElProfesionalResponseSchema.safeParse({ data: { ...estado.data, current: null } }).success, false);
  assert.equal(HabitosParaElProfesionalResponseSchema.safeParse({ data: { ...estado.data, scopes: [] } }).success, false);
  assert.ok(PedidosDeAccesoResponseSchema.safeParse({ data: [{ accessRequestId: NUT, version: 'v1', professional: { identityId: ENT, displayName: 'Ana' }, scope: { code: 'NUTRICION', label: 'Nutrición' }, requestedAt: ANTES }] }).success);
  const si = { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId: VERSION_VIGENTE.HABITOS_COMPARTIDOS.id } };
  assert.ok(ResponderPedidoDeAccesoRequestSchema.safeParse(si).success);
  assert.ok(ResponderPedidoDeAccesoRequestSchema.safeParse({ expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).success);
  // «Sí» sin lo que se vio, o «No» con algo para compartir: no tiene forma.
  assert.equal(ResponderPedidoDeAccesoRequestSchema.safeParse({ ...si, sharing: null }).success, false);
  assert.equal(ResponderPedidoDeAccesoRequestSchema.safeParse({ ...si, answer: 'NOT_NOW' }).success, false);
  assert.equal(ResponderPedidoDeAccesoRequestSchema.safeParse({ ...si, extra: 1 }).success, false);
});
