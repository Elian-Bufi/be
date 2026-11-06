/**
 * WP-FORMULARIOS-RONDA-2 · FR-10 (DEUDA_LEGAJO DL-165 D-9) · la sección común de hábitos, por la API real y contra
 * PostgreSQL:
 * - FRI-04 agrega una versión de los hábitos de la persona, en la misma transacción, al responder o confirmar un
 *   formulario con la parte «Tus hábitos»: lo que el formulario preguntó de la parte reemplaza lo vigente y lo demás queda
 *   (D-16). Un formulario sin la parte no agrega nada. Rectificar no los cambia.
 * - API-HBT-01 y 02: «Mis hábitos», de la persona y con su A3; cada cambio es una versión nueva, con la vigente que se vio.
 * - API-HBT-03 a 05: la autorización «Compartir mis hábitos con mis profesionales», con su lista explícita, y lo que ve
 *   cada profesional. El 404 de lo inexistente sin la autorización y fuera de la lista; el corte al retirarla (para todos),
 *   al pausar o terminar un vínculo; un profesional que llega después no se suma solo (D-17); cerrar la cuenta la retira.
 * - La base: las tres tablas solo se agregan, y las versiones van de a una.
 *
 * Ronda 2.1 (D-15 y D-17 nuevas de Dirección, 2026-11-06): «Tus hábitos» aparte (FRM-HABITOS v2) y la regla general de
 * FRI-04 (D-20); lo que sabe el profesional, solo de lo que ya puede ver (API-HBT-07, D-22); «Pedir acceso a sus hábitos»,
 * con su novedad y su límite (API-HBT-06, D-23 y D-24); y la respuesta de la persona (API-HBT-08 y 09, D-25). Las Solicitudes
 * de la ronda 2 ya no se piden, pero las pedidas antes siguen: se crean directo en la base (`solicitudDeAntes`).
 */
import type { INestApplication } from '@nestjs/common';
import {
  CAMPOS_DE_HABITOS,
  HabitosCompartidosEstadoResponseSchema,
  HabitosCompartidosResponseSchema,
  HabitosParaElProfesionalResponseSchema,
  HabitosRegistradosResponseSchema,
  MisHabitosResponseSchema,
  PedidoDeAccesoCreadoResponseSchema,
  PedidoDeAccesoRespondidoResponseSchema,
  PedidosDeAccesoResponseSchema,
  SECCION_DE_HABITOS,
  VERSION_VIGENTE,
  type RespuestaDeCampoV2Entrada,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion, cuerpoDeCierre } from './soporte-api';
import { CON_FORMATO_3, fri, pedirV2, RESPUESTAS_V2, sembrarPlantillaV2 } from './soporte-formularios-v2';
import {
  solicitudDeAntes,
  VERSION_ENTRENAMIENTO_V3,
  VERSION_ENTRENAMIENTO_V4,
  VERSION_HABITOS_V1,
  VERSION_HABITOS_V2,
  VERSION_NUTRICION_INICIO_V2,
  VERSION_NUTRICION_INICIO_V3,
} from './soporte-plantillas-de-inicio';
import { a3Vigente, finalizar, pausar, prepararAsesorado, prepararProfesional, reanudar, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

/** Respuestas completas de la parte «Tus hábitos», en su forma canónica. */
const HABITOS: readonly RespuestaDeCampoV2Entrada[] = [
  {
    fieldCode: 'habitos_horarios',
    answer: {
      type: 'TIMES',
      times: [
        { part: 'semana_me_levanto', time: '07:00' },
        { part: 'semana_me_acuesto', time: '23:30' },
        { part: 'finde_me_levanto', time: '09:30' },
        { part: 'finde_me_acuesto', time: '01:00' },
      ],
    },
  },
  { fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 7.5, unit: 'h' } },
  { fieldCode: 'nivel_de_actividad', answer: { type: 'CHOICE', option: 'sentado_y_de_pie', otherText: null } },
  { fieldCode: 'habitos_hace_deporte', answer: { type: 'BOOLEAN', yes: true } },
  { fieldCode: 'habitos_deportes', answer: { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'], momento: 'noche', minutos: 90, exigencia: 'moderada' }] } },
  { fieldCode: 'habitos_estres', answer: { type: 'CHOICE', option: 'normal', otherText: null } },
];
const OBLIGATORIAS_DE_LA_PARTE = SECCION_DE_HABITOS.fields.filter((c) => c.requiredByDefault).map((c) => c.fieldCode);
const conProcedencia = (r: readonly RespuestaDeCampoV2Entrada[]) => r.map((x) => ({ ...x, provenance: 'SELF_REPORTED' }));
const con = (codigo: string, answer: RespuestaDeCampoV2Entrada['answer']) => HABITOS.map((r) => (r.fieldCode === codigo ? { fieldCode: codigo, answer } : r));

/** Las cinco operaciones con la sesión de un actor; las escrituras llevan una Idempotency-Key nueva salvo que se pase una. */
function hbt(token: string) {
  const s = conSesion(app, token);
  return {
    mios: () => s.get('/api/v1/me/habits'),
    registrar: (cuerpo: unknown, clave?: string) => s.post('/api/v1/me/habits', clave).send(cuerpo as object),
    compartir: (cuerpo: unknown, clave?: string) => s.put('/api/v1/me/habits/sharing', clave).send(cuerpo as object),
    retirar: (cuerpo: unknown, clave?: string) => s.post('/api/v1/me/habits/sharing/withdrawal', clave).send(cuerpo as object),
    deLaPersona: (adviseeId: string) => s.get(`/api/v1/advisees/${adviseeId}/habits`),
  };
}
const misHabitos = async (p: Parte) => MisHabitosResponseSchema.parse((await hbt(p.token).mios().expect(200)).body).data;
const TEXTO = VERSION_VIGENTE.HABITOS_COMPARTIDOS.id;

interface Equipo {
  readonly ase: Parte;
  readonly nut: Parte;
  readonly ent: Parte;
  readonly vNut: { vinculoId: string; consentId: string | null };
  readonly vEnt: { vinculoId: string; consentId: string | null };
}

/** Una persona con A3 y dos profesionales con su vínculo aceptado y su B2: una nutricionista y un entrenador. */
async function equipo(etiqueta: string): Promise<Equipo> {
  const e = `hab-${etiqueta}-${++contador}`;
  const ase = await prepararAsesorado(app, e, { a3: true });
  const nut = await prepararProfesional(app, `nut-${e}`, ['NUTRICION']);
  const ent = await prepararProfesional(app, `ent-${e}`, ['ENTRENAMIENTO']);
  const vNut = await vinculoCompleto(app, nut, ase, 'NUTRICION');
  const vEnt = await vinculoCompleto(app, ent, ase, 'ENTRENAMIENTO');
  return { ase, nut, ent, vNut, vEnt };
}

/** FRM-03 sobre una versión del catálogo, con las preguntas que se pidan (como el website). */
function pedir(pro: Parte, ase: Parte, versionId: string, alcance: 'NUTRICION' | 'ENTRENAMIENTO', pedidas: readonly string[], obligatorias: readonly string[]): Promise<string> {
  return pedirV2(app, pro, ase.id, versionId, alcance, pedidas, obligatorias);
}

/**
 * Una Solicitud de la ronda 2 («Cómo comés hoy» v2 o «Antes de entrenar» v3, con la parte), pedida antes de la ronda 2.1:
 * desde ahí FRM-03 ya no deja pedirlas, pero las que quedaron siguen y responderlas sigue sumando hábitos.
 */
function pedidaAntes(pro: Parte, ase: Parte, versionId: string, alcance: 'NUTRICION' | 'ENTRENAMIENTO', pedidas: readonly string[], obligatorias: readonly string[]): Promise<string> {
  return solicitudDeAntes(prisma, { profesionalId: pro.id, asesoradoId: ase.id, versionId, alcance, pedidos: pedidas, requeridos: obligatorias });
}

/** Lo vigente de la persona, con la versión que la API le asigna. */
async function compartirCon(ase: Parte, incluidos: readonly Parte[], declinados: readonly Parte[] = []) {
  const yo = await misHabitos(ase);
  const r = await hbt(ase.token).compartir({ expectedVersion: yo.sharing.version, textVersionId: TEXTO, professionalIds: incluidos.map((p) => p.id), declinedProfessionalIds: declinados.map((p) => p.id) }).expect(200);
  return HabitosCompartidosEstadoResponseSchema.parse(r.body).data;
}

describe('FR-10 · FRI-04 agrega la versión de los hábitos (§4.2; D-16)', () => {
  it('responder «Cómo comés hoy» con la parte agrega la versión 1; confirmar lo cargado en «Antes de entrenar» cambia solo lo que preguntó; un formulario sin la parte y una rectificación no cambian nada', async () => {
    const e = await equipo('fri04');
    // Nutrición pide la parte entera, con sus obligatorias, y la persona responde desde la app nueva.
    const deNutricion = await pedidaAntes(e.nut, e.ase, VERSION_NUTRICION_INICIO_V2, 'NUTRICION', CAMPOS_DE_HABITOS, OBLIGATORIAS_DE_LA_PARTE);
    const respondida = await fri(app, e.ase.token, CON_FORMATO_3).responder(deNutricion, { answers: HABITOS, fromProposal: null }).expect(201);
    const formResponseId = respondida.body.data.formResponseId as string;
    const filas = await prisma.habitosDeLaPersona.findMany({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'asc' } });
    expect(filas.map((f) => [f.version, f.origen, f.respuestaDeFormularioId])).toEqual([[1, 'FORMULARIO', formResponseId]]);
    // La Respuesta guarda lo suyo como siempre: la parte también queda en el formulario de Nutrición.
    const vista = await fri(app, e.nut.token, CON_FORMATO_3).vista(deNutricion).expect(200);
    expect((vista.body.data.response.original.answers as { fieldCode: string }[]).map((a) => a.fieldCode)).toEqual([...CAMPOS_DE_HABITOS]);

    const v1 = await misHabitos(e.ase);
    expect(v1.current).toMatchObject({ version: 'v1', origin: 'FORM' });
    expect(v1.current!.answers).toEqual(conProcedencia(HABITOS));
    expect(v1.history).toEqual([]);
    expect(v1.section).toEqual(JSON.parse(JSON.stringify(SECCION_DE_HABITOS)));
    expect(await prisma.eventoDeFormulario.count({ where: { asesoradoId: e.ase.id, tipo: 'VersionDeHabitosRegistrada' } })).toBe(1);

    // Entrenamiento pide dos preguntas de la parte y una suya; el entrenador las carga con la persona y ella confirma
    // (confirmar es responder, DL-164 D-4).
    const deEntrenamiento = await pedidaAntes(e.ent, e.ase, VERSION_ENTRENAMIENTO_V3, 'ENTRENAMIENTO', ['trn_objetivo_declarado', 'horas_de_sueno', 'habitos_estres'], ['trn_objetivo_declarado']);
    const cargadas: RespuestaDeCampoV2Entrada[] = [
      { fieldCode: 'trn_objetivo_declarado', answer: { type: 'TEXT', text: 'Subir escaleras sin cansarme' } },
      { fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 6, unit: 'h' } },
      { fieldCode: 'habitos_estres', answer: { type: 'CHOICE', option: 'cargada', otherText: null } },
    ];
    const propuesta = await fri(app, e.ent.token, CON_FORMATO_3).cargar(deEntrenamiento, { expectedVersion: null, answers: cargadas }).expect(201);
    await fri(app, e.ase.token, CON_FORMATO_3)
      .responder(deEntrenamiento, { answers: cargadas, fromProposal: { proposalId: propuesta.body.data.proposalId, expectedVersion: propuesta.body.data.version } })
      .expect(201);
    const v2 = await misHabitos(e.ase);
    expect(v2.current).toMatchObject({ version: 'v2', origin: 'FORM' });
    // Las dos preguntas que hizo Entrenamiento, con lo nuevo; las otras cuatro, como estaban. Nada del área (el objetivo).
    expect(v2.current!.answers).toEqual(conProcedencia(con('horas_de_sueno', { type: 'NUMBER', number: 6, unit: 'h' }).map((r) => (r.fieldCode === 'habitos_estres' ? cargadas[2]! : r))));
    expect(v2.history.map((h) => h.version)).toEqual(['v1']);
    expect(v2.history[0]!.answers).toEqual(conProcedencia(HABITOS));

    // Un formulario sin la parte no agrega nada.
    const { versionId } = await sembrarPlantillaV2(prisma, `hab-sin-parte-${contador}`, 'NUTRICION');
    const sinParte = await pedirV2(app, e.nut, e.ase.id, versionId, 'NUTRICION');
    await fri(app, e.ase.token, CON_FORMATO_3).responder(sinParte, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201);
    // Rectificar la de Nutrición tampoco: lo vigente es más nuevo que ese formulario (D-16).
    const r = await fri(app, e.ase.token, CON_FORMATO_3).vista(deNutricion).expect(200);
    await fri(app, e.ase.token, CON_FORMATO_3)
      .corregir(formResponseId, { expectedVersion: r.body.data.response.version, reason: 'Duermo menos', answers: con('horas_de_sueno', { type: 'NUMBER', number: 5, unit: 'h' }) })
      .expect(201);
    expect(await prisma.habitosDeLaPersona.count({ where: { asesoradoId: e.ase.id } })).toBe(2);
  });
});

describe('FR-10 · API-HBT-01 y 02 · «Mis hábitos»', () => {
  it('cada cambio es una versión nueva con la vigente que se vio; lo que no tiene la forma de la parte es 422; sin el A3, 403; la base no deja cambiar ni borrar una versión', async () => {
    const ase = await prepararAsesorado(app, `hab-mios-${++contador}`, { a3: true });
    const yo = hbt(ase.token);
    const vacio = await misHabitos(ase);
    expect(vacio).toMatchObject({ current: null, history: [], sharing: { status: 'NOT_GIVEN', version: null }, professionals: [] });
    expect(vacio.text).toMatchObject({ id: TEXTO, approval: 'PENDING_APPROVAL' });

    const clave = claveDeIdempotencia();
    const primera = HabitosRegistradosResponseSchema.parse((await yo.registrar({ expectedVersion: null, answers: HABITOS }, clave).expect(201)).body).data;
    expect(primera).toMatchObject({ version: 'v1', origin: 'MY_HABITS' });
    // El reintento con la misma clave responde lo mismo y no agrega otra.
    expect((await yo.registrar({ expectedVersion: null, answers: HABITOS }, clave).expect(201)).body.data).toEqual(primera);
    // Con la vigente vieja (o sin ella), 409: no se pisa lo que entró en el medio.
    expect((await yo.registrar({ expectedVersion: null, answers: HABITOS }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    // Ninguna es obligatoria en «Mis hábitos»: con una sola, queda una sola.
    const segunda = HabitosRegistradosResponseSchema.parse((await yo.registrar({ expectedVersion: 'v1', answers: [HABITOS[1]!] }).expect(201)).body).data;
    expect(segunda.answers).toEqual(conProcedencia([HABITOS[1]!]));
    // Lo que no tiene la forma de la parte: un número fuera de sus límites, una pregunta que la parte no tiene.
    const malo = await yo.registrar({ expectedVersion: 'v2', answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 20, unit: 'h' } }, { fieldCode: 'nut_agua', answer: { type: 'CHOICE', option: '2_a_4', otherText: null } }] }).expect(422);
    expect(malo.body.error.code).toBe('FORM_RESPONSE_INVALID');
    expect((malo.body.error.details.issues as { code: string; fieldCode: string }[]).map((i) => [i.code, i.fieldCode])).toEqual([
      ['FORM_ANSWER_ABOVE_MAXIMUM', 'horas_de_sueno'],
      ['FORM_ANSWER_UNKNOWN_FIELD', 'nut_agua'],
    ]);
    const mios = await misHabitos(ase);
    expect([mios.current!.version, ...mios.history.map((h) => h.version)]).toEqual(['v2', 'v1']);
    expect(await prisma.habitosDeLaPersona.count({ where: { asesoradoId: ase.id } })).toBe(2);

    // La base: solo se agrega, y de a una versión.
    await expect(prisma.$executeRawUnsafe(`UPDATE habitos_de_la_persona SET version = 9 WHERE asesorado_id = '${ase.id}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM habitos_de_la_persona WHERE asesorado_id = '${ase.id}'`)).rejects.toThrow(/append-only/);
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO habitos_de_la_persona (asesorado_id, version, contenido, origen, procedencia, momento_de_ocurrencia) VALUES ('${ase.id}', 5, '{"format":2,"answers":[]}', 'MIS_HABITOS', '{}', now())`,
      ),
    ).rejects.toThrow(/sigue a la última/);

    // Sin el A3, lo propio no se lee ni se escribe (08:406).
    await conSesion(app, ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, ase.token)}/revoke`).send({}).expect(200);
    expect((await yo.mios().expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    expect((await yo.registrar({ expectedVersion: 'v2', answers: HABITOS }).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
  });
});

describe('FR-10 · API-HBT-03 a 05 · la autorización y lo que ve cada profesional (§4.3 a §4.5)', () => {
  it('sin la autorización, HBT-05 es el 404 de lo inexistente; al darla, los de la lista ven lo vigente (sin la historia ni de dónde salió), y el que quedó afuera, el mismo 404', async () => {
    const e = await equipo('lista');
    await hbt(e.ase.token).registrar({ expectedVersion: null, answers: HABITOS }).expect(201);
    const inexistente = await hbt(e.nut.token).deLaPersona(randomUUID()).expect(404);
    // Sin la autorización: ninguno de los dos se entera de que hay hábitos.
    for (const pro of [e.nut, e.ent]) expect((await hbt(pro.token).deLaPersona(e.ase.id).expect(404)).body).toEqual(inexistente.body);
    // Un profesional sin vínculo con la persona, tampoco.
    const ajeno = await prepararProfesional(app, `ajeno-hab-${contador}`, ['NUTRICION']);
    expect((await hbt(ajeno.token).deLaPersona(e.ase.id).expect(404)).body).toEqual(inexistente.body);

    // Los dos aparecen para elegir; la persona comparte solo con la nutricionista y le dice que no al entrenador.
    const antes = await misHabitos(e.ase);
    expect(antes.professionals.map((p) => [p.professional.identityId, p.link, p.sharing]).sort()).toEqual([[e.nut.id, 'ACTIVE', 'DOES_NOT_RECEIVE'], [e.ent.id, 'ACTIVE', 'DOES_NOT_RECEIVE']].sort());
    const estado = await compartirCon(e.ase, [e.nut], [e.ent]);
    expect(estado.sharing).toMatchObject({ status: 'ACTIVE', version: 'v1', acceptedTextVersionId: TEXTO, withdrawnAt: null });
    expect(Object.fromEntries(estado.professionals.map((p) => [p.professional.identityId, p.sharing]))).toEqual({ [e.nut.id]: 'RECEIVES', [e.ent.id]: 'DOES_NOT_RECEIVE' });

    const visto = HabitosCompartidosResponseSchema.parse((await hbt(e.nut.token).deLaPersona(e.ase.id).expect(200)).body).data;
    expect(visto.sharedSince).toBe(estado.professionals.find((p) => p.professional.identityId === e.nut.id)!.sharedSince);
    expect(visto.current).toMatchObject({ origin: 'MY_HABITS' });
    expect(visto.current!.answers).toEqual(conProcedencia(HABITOS));
    // Ni la historia, ni el número de versión, ni de qué formulario salió (§4.4).
    expect(Object.keys(visto.current!).sort()).toEqual(['answers', 'origin', 'recordedAt']);
    // El que quedó afuera: el mismo 404.
    expect((await hbt(e.ent.token).deLaPersona(e.ase.id).expect(404)).body).toEqual(inexistente.body);
    // Cada lectura de la nutricionista queda en el registro de accesos, con la persona como sujeto.
    expect(await prisma.decisionDeAcceso.count({ where: { operacion: 'API-HBT-05', actorId: e.nut.id, sujetoId: e.ase.id, resultado: 'PERMITIDA', recursoTipo: 'HabitosDeLaPersona' } })).toBe(1);
  });

  it('un profesional que la acompaña después no los recibe solo: la app le pregunta, y sin respuesta sigue sin verlos', async () => {
    const e = await equipo('nuevo');
    await hbt(e.ase.token).registrar({ expectedVersion: null, answers: HABITOS }).expect(201);
    const dada = await compartirCon(e.ase, [e.nut, e.ent]);
    const desdeNut = dada.professionals.find((p) => p.professional.identityId === e.nut.id)!.sharedSince;
    const ant = await prepararProfesional(app, `ant-hab-${contador}`, ['ANTROPOMETRIA']);
    await vinculoCompleto(app, ant, e.ase, 'ANTROPOMETRIA');
    const conElNuevo = await misHabitos(e.ase);
    expect(conElNuevo.professionals.find((p) => p.professional.identityId === ant.id)).toMatchObject({ link: 'ACTIVE', sharing: 'NOT_ASKED', sharedSince: null });
    await hbt(ant.token).deLaPersona(e.ase.id).expect(404);
    // Con la versión vieja de la autorización, 409; con la que vio, lo suma (una aceptación nueva, 08 C-12).
    const vieja = await hbt(e.ase.token).compartir({ expectedVersion: null, textVersionId: TEXTO, professionalIds: [e.nut.id, e.ent.id, ant.id], declinedProfessionalIds: [] }).expect(409);
    expect(vieja.body.error.code).toBe('VERSION_CONFLICT');
    const sumado = await compartirCon(e.ase, [e.nut, e.ent, ant]);
    expect(sumado.sharing.version).toBe('v2');
    await hbt(ant.token).deLaPersona(e.ase.id).expect(200);
    // Los que ya los recibían conservan desde cuándo.
    expect(sumado.professionals.find((p) => p.professional.identityId === e.nut.id)!.sharedSince).toBe(desdeNut);
    expect(await prisma.eventoDeFormulario.findMany({ where: { asesoradoId: e.ase.id, recursoTipo: 'AutorizacionDeHabitos' }, orderBy: { secuencia: 'asc' }, select: { tipo: true } })).toEqual([
      { tipo: 'AutorizacionDeHabitosActivada' },
      { tipo: 'AutorizacionDeHabitosModificada' },
    ]);
  });

  it('retirarla corta a futuro y para todos, sin el A3 y sin borrar nada; pausar corta y reanudar vuelve; terminar corta, y volver con otro vínculo no se suma solo', async () => {
    const e = await equipo('cortes');
    await hbt(e.ase.token).registrar({ expectedVersion: null, answers: HABITOS }).expect(201);
    await compartirCon(e.ase, [e.nut, e.ent]);
    for (const pro of [e.nut, e.ent]) await hbt(pro.token).deLaPersona(e.ase.id).expect(200);

    // Pausar el vínculo de Nutrición la corta a ella; al reanudar vuelve a verlos (la pausa es temporal).
    await pausar(app, e.ase.token, e.vNut.vinculoId, await versionDeVinculo(app, e.ase.token, e.vNut.vinculoId)).expect(200);
    await hbt(e.nut.token).deLaPersona(e.ase.id).expect(404);
    expect((await misHabitos(e.ase)).professionals.find((p) => p.professional.identityId === e.nut.id)).toMatchObject({ link: 'PAUSED', sharing: 'RECEIVES' });
    await hbt(e.ent.token).deLaPersona(e.ase.id).expect(200);
    await reanudar(app, e.ase.token, e.vNut.vinculoId, await versionDeVinculo(app, e.ase.token, e.vNut.vinculoId)).expect(200);
    await hbt(e.nut.token).deLaPersona(e.ase.id).expect(200);

    // Terminar el del entrenador lo corta; si vuelve con otro vínculo, es alguien que llega después (D-17).
    await finalizar(app, e.ase.token, e.vEnt.vinculoId, await versionDeVinculo(app, e.ase.token, e.vEnt.vinculoId)).expect(200);
    await hbt(e.ent.token).deLaPersona(e.ase.id).expect(404);
    await vinculoCompleto(app, e.ent, e.ase, 'ENTRENAMIENTO');
    expect((await misHabitos(e.ase)).professionals.find((p) => p.professional.identityId === e.ent.id)).toMatchObject({ link: 'ACTIVE', sharing: 'NOT_ASKED' });
    await hbt(e.ent.token).deLaPersona(e.ase.id).expect(404);

    // Retirarla corta para todos a la vez. No exige el A3: se revoca antes, y se puede retirar igual.
    await conSesion(app, e.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, e.ase.token)}/revoke`).send({}).expect(200);
    const version = (await prisma.autorizacionDeHabitos.findFirstOrThrow({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'desc' } })).version;
    const retirada = HabitosCompartidosEstadoResponseSchema.parse((await hbt(e.ase.token).retirar({ expectedVersion: `v${version}` }).expect(200)).body).data;
    expect(retirada.sharing).toMatchObject({ status: 'WITHDRAWN', acceptedTextVersionId: null, activeSince: null });
    expect(retirada.professionals.every((p) => p.sharing === 'DOES_NOT_RECEIVE')).toBe(true);
    for (const pro of [e.nut, e.ent]) await hbt(pro.token).deLaPersona(e.ase.id).expect(404);
    // Otra vez, ya retirada: 409, nada se escribe dos veces.
    expect((await hbt(e.ase.token).retirar({ expectedVersion: `v${version + 1}` }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    // No se borra nada: los hábitos siguen siendo de la persona.
    expect(await prisma.habitosDeLaPersona.count({ where: { asesoradoId: e.ase.id } })).toBe(1);
    expect((await prisma.autorizacionDeHabitos.findMany({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'asc' } })).map((a) => a.estado)).toEqual(['ACTIVA', 'RETIRADA']);
  });

  it('lo que no se puede nombrar es 422, el texto que no es el vigente es 409 y sin el A3 no se comparte; cerrar la cuenta la retira', async () => {
    const e = await equipo('pedido');
    const ajeno = await prepararProfesional(app, `ajeno-hab-pedido-${contador}`, ['NUTRICION']);
    const pedido = (cambios: Record<string, unknown>) => ({ expectedVersion: null, textVersionId: TEXTO, professionalIds: [e.nut.id], declinedProfessionalIds: [], ...cambios });
    const noDisponible = await hbt(e.ase.token).compartir(pedido({ professionalIds: [e.nut.id, ajeno.id, randomUUID()], declinedProfessionalIds: [e.nut.id] })).expect(422);
    expect(noDisponible.body.error.code).toBe('HABITS_RECIPIENT_NOT_AVAILABLE');
    expect(noDisponible.body.error.details.issues).toEqual([
      { code: 'HABITS_RECIPIENT_NOT_AVAILABLE', path: 'professionalIds[1]' },
      { code: 'HABITS_RECIPIENT_NOT_AVAILABLE', path: 'professionalIds[2]' },
      { code: 'HABITS_RECIPIENT_REPEATED', path: 'declinedProfessionalIds[0]' },
    ]);
    expect((await hbt(e.ase.token).compartir(pedido({ textVersionId: VERSION_VIGENTE.EVIDENCIA_VISUAL.id })).expect(409)).body.error.code).toBe('CONSENT_VERSION_STALE');
    await hbt(e.ase.token).compartir(pedido({ professionalIds: [] })).expect(400);
    expect(await prisma.autorizacionDeHabitos.count({ where: { asesoradoId: e.ase.id } })).toBe(0);

    // La base exige el texto de su tipo con su hash, y que la dé la persona.
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO autorizacion_de_habitos (asesorado_id, version, estado, version_de_texto_id, hash_del_texto, actor_id, procedencia, momento_de_ocurrencia)
         VALUES ('${e.ase.id}', 1, 'ACTIVA', '${VERSION_VIGENTE.EVIDENCIA_VISUAL.id}', '${VERSION_VIGENTE.EVIDENCIA_VISUAL.hash}', '${e.ase.id}', '{}', now())`,
      ),
    ).rejects.toThrow(/acepta una versión de su texto/);

    await compartirCon(e.ase, [e.nut, e.ent]);
    // Cerrar la cuenta la retira, con su hecho; la persona es la actora.
    await conSesion(app, e.ase.token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(201);
    const ultima = await prisma.autorizacionDeHabitos.findFirstOrThrow({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'desc' } });
    expect([ultima.version, ultima.estado, ultima.actorId]).toEqual([2, 'RETIRADA', e.ase.id]);
    expect(await prisma.eventoDeFormulario.count({ where: { asesoradoId: e.ase.id, tipo: 'AutorizacionDeHabitosRetirada' } })).toBe(1);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM destinatario_de_habitos WHERE autorizacion_id IN (SELECT id FROM autorizacion_de_habitos WHERE asesorado_id = '${e.ase.id}')`)).rejects.toThrow(
      /append-only/,
    );
  });

  it('sin el A3 no se comparte; un profesional de un área nunca ve por esta vía lo que la persona respondió en el formulario de otra área', async () => {
    const e = await equipo('areas');
    // La persona responde la parte en el formulario de Entrenamiento, con una pregunta del área.
    const deEntrenamiento = await pedidaAntes(e.ent, e.ase, VERSION_ENTRENAMIENTO_V3, 'ENTRENAMIENTO', ['trn_objetivo_declarado', ...CAMPOS_DE_HABITOS], ['trn_objetivo_declarado']);
    await fri(app, e.ase.token, CON_FORMATO_3)
      .responder(deEntrenamiento, { answers: [{ fieldCode: 'trn_objetivo_declarado', answer: { type: 'TEXT', text: 'Correr 5 km' } }, ...HABITOS], fromProposal: null })
      .expect(201);
    // La nutricionista no ve la solicitud del entrenador, ni los hábitos: no se los comparte.
    await fri(app, e.nut.token, CON_FORMATO_3).vista(deEntrenamiento).expect(404);
    await hbt(e.nut.token).deLaPersona(e.ase.id).expect(404);
    // Con la autorización ve los hábitos, y solo eso: nada de la pregunta del área ni de qué formulario salieron.
    await compartirCon(e.ase, [e.nut], [e.ent]);
    const visto = HabitosCompartidosResponseSchema.parse((await hbt(e.nut.token).deLaPersona(e.ase.id).expect(200)).body).data;
    expect(visto.current!.answers.map((a) => a.fieldCode)).toEqual([...CAMPOS_DE_HABITOS]);
    expect(visto.current!.origin).toBe('FORM');
    expect(JSON.stringify(visto)).not.toMatch(/trn_objetivo_declarado|Correr 5 km|ENTRENAMIENTO|formRequestId|formResponseId/);
    await fri(app, e.nut.token, CON_FORMATO_3).vista(deEntrenamiento).expect(404);

    // Sin el A3, la persona no comparte (lo propio, 08:406), y el PDP deja de permitir la lectura.
    await conSesion(app, e.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, e.ase.token)}/revoke`).send({}).expect(200);
    await hbt(e.nut.token).deLaPersona(e.ase.id).expect(404);
    const sinA3 = await hbt(e.ase.token).compartir({ expectedVersion: 'v1', textVersionId: TEXTO, professionalIds: [e.nut.id, e.ent.id], declinedProfessionalIds: [] }).expect(403);
    expect(sinA3.body.error.code).toBe('ACTION_FORBIDDEN');
  });
});

// ─── Ronda 2.1 (D-15 y D-17 nuevas de Dirección, 2026-11-06) ────────────────────────────────────────

/** Las cuatro operaciones nuevas con la sesión de un actor: pedir acceso y lo que sabe el profesional; los pedidos y la respuesta. */
function pedidos(token: string) {
  const s = conSesion(app, token);
  return {
    pedir: (adviseeId: string, scope: string, clave?: string) => s.post(`/api/v1/advisees/${adviseeId}/habits/access-requests`, clave).send({ scope }),
    estado: (adviseeId: string) => s.get(`/api/v1/advisees/${adviseeId}/habits/status`),
    pendientes: () => s.get('/api/v1/me/habits/access-requests'),
    responder: (accessRequestId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/me/habits/access-requests/${accessRequestId}/answer`, clave).send(cuerpo as object),
  };
}
const estadoDe = async (pro: Parte, ase: Parte) => HabitosParaElProfesionalResponseSchema.parse((await pedidos(pro.token).estado(ase.id).expect(200)).body).data;
const pendientesDe = async (ase: Parte) => PedidosDeAccesoResponseSchema.parse((await pedidos(ase.token).pendientes().expect(200)).body).data;
const novedadesDe = async (ase: Parte) => (await conSesion(app, ase.token).get('/api/v1/me/news?limit=30').expect(200)).body.data as { kind: string; title: string; body: string; source: { identityId: string } | null; open: { view: string; referenceId: string | null } }[];
/** El componente aceptado de un profesional con la persona, en un área: de ahí sale un pedido. */
const componente = (pro: Parte, ase: Parte, alcance: 'NUTRICION' | 'ENTRENAMIENTO') =>
  prisma.alcanceDeVinculo.findFirstOrThrow({ where: { alcance, estado: 'ACEPTADO', vinculo: { profesionalId: pro.id, asesoradoId: ase.id } } });

describe('Ronda 2.1 · «Tus hábitos» aparte y la regla general de FRI-04 (D-15 nueva; D-20, D-21)', () => {
  it('cualquier profesional pide «Tus hábitos» en su área y responderlo agrega una versión; las de área nuevas no la traen; una Solicitud de la ronda 2 pedida antes sigue sumando', async () => {
    const e = await equipo('aparte');
    // La nutricionista pide «Tus hábitos» desde Nutrición; el entrenador, desde Entrenamiento. Es la misma plantilla.
    const deNutricion = await pedir(e.nut, e.ase, VERSION_HABITOS_V2, 'NUTRICION', CAMPOS_DE_HABITOS, OBLIGATORIAS_DE_LA_PARTE);
    const deEntrenamiento = await pedir(e.ent, e.ase, VERSION_HABITOS_V2, 'ENTRENAMIENTO', ['horas_de_sueno', 'habitos_estres'], []);
    const app3 = fri(app, e.ase.token, CON_FORMATO_3);
    await app3.responder(deNutricion, { answers: HABITOS, fromProposal: null }).expect(201);
    expect((await misHabitos(e.ase)).current).toMatchObject({ version: 'v1', origin: 'FORM' });
    // Tres meses después, el entrenador vuelve a preguntar dos cosas: cambian esas dos y lo demás queda (D-16).
    await app3.responder(deEntrenamiento, { answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 6, unit: 'h' } }], fromProposal: null }).expect(201);
    const v2 = await misHabitos(e.ase);
    expect(v2.current!.version).toBe('v2');
    expect(v2.current!.answers).toEqual(conProcedencia(con('horas_de_sueno', { type: 'NUMBER', number: 6, unit: 'h' }).filter((r) => r.fieldCode !== 'habitos_estres')));

    // «Cómo comés hoy» v3 y «Antes de entrenar» v4 ya no traen la parte: responderlas no cambia los hábitos.
    const nutV3 = await pedir(e.nut, e.ase, VERSION_NUTRICION_INICIO_V3, 'NUTRICION', ['nut_jornada'], []);
    await app3.responder(nutV3, { answers: [{ fieldCode: 'nut_jornada', answer: { type: 'CHOICE', option: 'en_casa', otherText: null } }], fromProposal: null }).expect(201);
    const entV4 = await pedir(e.ent, e.ase, VERSION_ENTRENAMIENTO_V4, 'ENTRENAMIENTO', ['trn_objetivo_declarado'], []);
    await app3.responder(entV4, { answers: [{ fieldCode: 'trn_objetivo_declarado', answer: { type: 'TEXT', text: 'Correr 5 km' } }], fromProposal: null }).expect(201);
    expect(await prisma.habitosDeLaPersona.count({ where: { asesoradoId: e.ase.id } })).toBe(2);

    // Las de la ronda 2 ya no se piden (REG-06-209)…
    for (const historica of [VERSION_NUTRICION_INICIO_V2, VERSION_HABITOS_V1]) {
      const r = await conSesion(app, e.nut.token).post(`/api/v1/advisees/${e.ase.id}/form-requests`).send({ templateVersionId: historica, purpose: 'x', scope: 'NUTRICION', requestedFieldCodes: ['horas_de_sueno'], requiredFieldCodes: [] }).expect(422);
      expect(r.body.error.code).toBe('FORM_TEMPLATE_NOT_SELECTABLE');
    }
    // …pero la que se pidió antes sigue andando, y responderla sigue sumando hábitos (la regla es general, D-20).
    const deAntes = await solicitudDeAntes(prisma, { profesionalId: e.nut.id, asesoradoId: e.ase.id, versionId: VERSION_NUTRICION_INICIO_V2, alcance: 'NUTRICION', pedidos: ['habitos_estres'], requeridos: [] });
    await app3.responder(deAntes, { answers: [{ fieldCode: 'habitos_estres', answer: { type: 'CHOICE', option: 'cargada', otherText: null } }], fromProposal: null }).expect(201);
    const v3 = await misHabitos(e.ase);
    expect(v3.current!.version).toBe('v3');
    expect(v3.current!.answers.find((a) => a.fieldCode === 'habitos_estres')?.answer).toEqual({ type: 'CHOICE', option: 'cargada', otherText: null });
  });
});

describe('Ronda 2.1 · API-HBT-07 · lo que el profesional sabe, solo de lo que ya puede ver (D-22)', () => {
  it('lo más nuevo que ve sale de sus respuestas y de lo compartido; lo que la persona le contó a otro no aparece; una pendiente se dice; sin vínculo, 404', async () => {
    const e = await equipo('estado');
    const inicial = await estadoDe(e.nut, e.ase);
    expect(inicial).toEqual({ scopes: ['NUTRICION'], receives: false, sharedSince: null, latestSeenAt: null, pendingHabitsRequestSince: null, accessRequest: null, canRequestAccess: true, canRequestAccessFrom: null });
    // El entrenador pide «Tus hábitos» y la persona los responde: él los ve en su respuesta; la nutricionista, no.
    const deEntrenamiento = await pedir(e.ent, e.ase, VERSION_HABITOS_V2, 'ENTRENAMIENTO', CAMPOS_DE_HABITOS, OBLIGATORIAS_DE_LA_PARTE);
    expect((await estadoDe(e.ent, e.ase)).pendingHabitsRequestSince).not.toBeNull();
    await fri(app, e.ase.token, CON_FORMATO_3).responder(deEntrenamiento, { answers: HABITOS, fromProposal: null }).expect(201);
    const delEntrenador = await estadoDe(e.ent, e.ase);
    const respondida = await prisma.respuestaDeFormulario.findUniqueOrThrow({ where: { solicitudId: deEntrenamiento } });
    expect(delEntrenador).toMatchObject({ receives: false, latestSeenAt: respondida.momentoDeRegistro.toISOString(), pendingHabitsRequestSince: null });
    // Nunca revela que la persona contó sus hábitos a otro profesional: para la nutricionista, nada cambió.
    expect(await estadoDe(e.nut, e.ase)).toEqual(inicial);
    // Si se los comparte, lo que ve es la versión vigente, con su fecha.
    await compartirCon(e.ase, [e.nut], [e.ent]);
    const compartidos = await estadoDe(e.nut, e.ase);
    const vigente = await prisma.habitosDeLaPersona.findFirstOrThrow({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'desc' } });
    expect(compartidos).toMatchObject({ receives: true, latestSeenAt: vigente.momentoDeRegistro.toISOString(), canRequestAccess: false, canRequestAccessFrom: null });
    expect(compartidos.sharedSince).not.toBeNull();
    // Sin vínculo, o con el vínculo en pausa, el 404 de lo inexistente (como HBT-05).
    const ajeno = await prepararProfesional(app, `ajeno-estado-${contador}`, ['NUTRICION']);
    const inexistente = await pedidos(e.nut.token).estado(randomUUID()).expect(404);
    expect((await pedidos(ajeno.token).estado(e.ase.id).expect(404)).body).toEqual(inexistente.body);
    await pausar(app, e.ase.token, e.vNut.vinculoId, await versionDeVinculo(app, e.ase.token, e.vNut.vinculoId)).expect(200);
    expect((await pedidos(e.nut.token).estado(e.ase.id).expect(404)).body).toEqual(inexistente.body);
  });
});

describe('Ronda 2.1 · API-HBT-06 · «Pedir acceso a sus hábitos» (D-17 nueva; D-23, D-24)', () => {
  it('le llega a la persona como novedad importante, sin un hábito; una pendiente por vez y 7 días entre pedidos; uno nuevo reemplaza al viejo; si ya los recibe, no hay nada que pedir', async () => {
    const e = await equipo('pedir');
    const clave = claveDeIdempotencia();
    const creado = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(e.nut.token).pedir(e.ase.id, 'NUTRICION', clave).expect(201)).body).data;
    expect(creado).toMatchObject({ scope: 'NUTRICION', status: 'PENDING' });
    // El reintento con la misma clave responde lo mismo y no pide dos veces.
    expect((await pedidos(e.nut.token).pedir(e.ase.id, 'NUTRICION', clave).expect(201)).body.data).toEqual(creado);
    // La novedad: quién pide, desde qué área, para qué le sirve y que es su decisión. Abre «Mis hábitos» con el pedido.
    const novedad = (await novedadesDe(e.ase)).find((n) => n.kind === 'HABITS_ACCESS_REQUESTED');
    expect(novedad).toMatchObject({ title: 'Te piden ver tus hábitos', source: { identityId: e.nut.id }, open: { view: 'MY_HABITS', referenceId: creado.accessRequestId } });
    expect(novedad!.body).toMatch(/te pide ver tus hábitos\. Le ayuda a armar un plan de comidas que entre en tu semana\. Es tu decisión/);
    // El aviso push queda para el despachador, genérico: la novedad no lleva ningún hábito.
    expect(JSON.stringify(novedad)).not.toMatch(/horas_de_sueno|Fútbol|estrés/);

    // Antes de 7 días, no: el 422 dice desde cuándo.
    const pronto = await pedidos(e.nut.token).pedir(e.ase.id, 'NUTRICION').expect(422);
    expect(pronto.body.error.code).toBe('HABITS_ACCESS_REQUEST_TOO_SOON');
    expect(pronto.body.error.details.availableFrom).toBe(new Date(Date.parse(creado.requestedAt) + 7 * 86_400_000).toISOString());
    expect(await estadoDe(e.nut, e.ase)).toMatchObject({ accessRequest: { accessRequestId: creado.accessRequestId, status: 'PENDING' }, canRequestAccess: false, canRequestAccessFrom: pronto.body.error.details.availableFrom });
    // Desde un área en la que no la acompaña: el 404 de lo inexistente.
    await pedidos(e.nut.token).pedir(e.ase.id, 'ENTRENAMIENTO').expect(404);
    await pedidos(e.nut.token).pedir(randomUUID(), 'NUTRICION').expect(404);
    // La base deja una sola pendiente por profesional y persona.
    const av = await componente(e.nut, e.ase, 'NUTRICION');
    await expect(
      prisma.pedidoDeAccesoAHabitos.create({ data: { profesionalId: e.nut.id, asesoradoId: e.ase.id, alcanceDeVinculoId: av.id, alcance: 'NUTRICION', pedidoEn: new Date(), procedencia: {} } }),
    ).rejects.toThrow();

    // El entrenador había pedido hace 8 días y nadie respondió: puede volver a pedir, y el nuevo reemplaza al viejo.
    const avEnt = await componente(e.ent, e.ase, 'ENTRENAMIENTO');
    const viejo = await prisma.pedidoDeAccesoAHabitos.create({ data: { profesionalId: e.ent.id, asesoradoId: e.ase.id, alcanceDeVinculoId: avEnt.id, alcance: 'ENTRENAMIENTO', pedidoEn: new Date(Date.now() - 8 * 86_400_000), procedencia: {} } });
    expect((await estadoDe(e.ent, e.ase)).canRequestAccess).toBe(true);
    const nuevo = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(e.ent.token).pedir(e.ase.id, 'ENTRENAMIENTO').expect(201)).body).data;
    expect((await prisma.pedidoDeAccesoAHabitos.findUniqueOrThrow({ where: { id: viejo.id } })).estado).toBe('REEMPLAZADO');
    expect((await pendientesDe(e.ase)).map((p) => p.accessRequestId).sort()).toEqual([creado.accessRequestId, nuevo.accessRequestId].sort());
    expect(await prisma.eventoDeFormulario.findMany({ where: { asesoradoId: e.ase.id, recursoTipo: 'PedidoDeAccesoAHabitos', profesionalId: e.ent.id }, orderBy: { secuencia: 'asc' }, select: { tipo: true } })).toEqual([
      { tipo: 'PedidoDeAccesoAHabitosReemplazado' },
      { tipo: 'PedidoDeAccesoAHabitosHecho' },
    ]);

    // Si ya se los comparte, no hay nada que pedir.
    await compartirCon(e.ase, [e.ent], [e.nut]);
    const otra = await prepararProfesional(app, `ant-pedir-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, otra, e.ase, 'NUTRICION');
    await compartirCon(e.ase, [e.ent, otra], [e.nut]);
    expect((await pedidos(otra.token).pedir(e.ase.id, 'NUTRICION').expect(422)).body.error.code).toBe('HABITS_ALREADY_SHARED');
    // La base: el pedido solo se resuelve, una vez, y no se borra.
    await expect(prisma.$executeRawUnsafe(`UPDATE pedido_de_acceso_a_habitos SET estado = 'PENDIENTE', resuelto_en = NULL WHERE id = '${viejo.id}'`)).rejects.toThrow(/se resuelve una sola vez/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM pedido_de_acceso_a_habitos WHERE id = '${viejo.id}'`)).rejects.toThrow(/append-only/);
  });
});

describe('Ronda 2.1 · API-HBT-08 y 09 · la persona decide (D-17 nueva; D-25)', () => {
  it('«No, por ahora» no cambia nada y no pide el A3; «Sí, que los vea» sin compartir todavía la activa solo para quien pidió; con la autorización activa lo suma; responder dos veces es 409', async () => {
    const e = await equipo('responder');
    await hbt(e.ase.token).registrar({ expectedVersion: null, answers: HABITOS }).expect(201);
    const deNut = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(e.nut.token).pedir(e.ase.id, 'NUTRICION').expect(201)).body).data;
    const deEnt = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(e.ent.token).pedir(e.ase.id, 'ENTRENAMIENTO').expect(201)).body).data;
    const lista = await pendientesDe(e.ase);
    expect(lista.find((p) => p.accessRequestId === deNut.accessRequestId)).toMatchObject({ version: 'v1', professional: { identityId: e.nut.id }, scope: { code: 'NUTRICION', label: 'Nutrición' } });
    // Lo ajeno y lo inexistente, 404.
    await pedidos(e.nut.token).responder(deNut.accessRequestId, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(404);
    await pedidos(e.ase.token).responder(randomUUID(), { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(404);
    // La forma: «Sí» sin lo que vio, o «No» con algo, no.
    await pedidos(e.ase.token).responder(deEnt.accessRequestId, { expectedVersion: 'v1', answer: 'SHARE', sharing: null }).expect(400);

    // «No, por ahora» al entrenador: no cambia la autorización.
    const no = PedidoDeAccesoRespondidoResponseSchema.parse((await pedidos(e.ase.token).responder(deEnt.accessRequestId, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(200)).body).data;
    expect(no.answer).toBe('NOT_NOW');
    expect(await prisma.autorizacionDeHabitos.count({ where: { asesoradoId: e.ase.id } })).toBe(0);
    const si = (pedido: string, expectedVersion: string | null) => pedidos(e.ase.token).responder(pedido, { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion, textVersionId: TEXTO } });
    // Responder otra vez el que ya respondió: 409.
    expect((await pedidos(e.ase.token).responder(deEnt.accessRequestId, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    // El profesional no se entera de qué respondió: solo que ya no espera.
    expect((await estadoDe(e.ent, e.ase)).accessRequest).toMatchObject({ status: 'ANSWERED' });

    // «Sí» a la nutricionista, sin compartir todavía: se activa solo para ella; el entrenador queda sin verlos y no se le
    // pregunta por él. El texto tiene que ser el vigente.
    expect((await pedidos(e.ase.token).responder(deNut.accessRequestId, { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId: VERSION_VIGENTE.EVIDENCIA_VISUAL.id } }).expect(409)).body.error.code).toBe(
      'CONSENT_VERSION_STALE',
    );
    expect(PedidoDeAccesoRespondidoResponseSchema.parse((await si(deNut.accessRequestId, null).expect(200)).body).data.answer).toBe('SHARE');
    const tras = await misHabitos(e.ase);
    expect(tras.sharing).toMatchObject({ status: 'ACTIVE', version: 'v1', acceptedTextVersionId: TEXTO });
    expect(Object.fromEntries(tras.professionals.map((p) => [p.professional.identityId, p.sharing]))).toEqual({ [e.nut.id]: 'RECEIVES', [e.ent.id]: 'DOES_NOT_RECEIVE' });
    await hbt(e.nut.token).deLaPersona(e.ase.id).expect(200);
    await hbt(e.ent.token).deLaPersona(e.ase.id).expect(404);
    expect(await pendientesDe(e.ase)).toEqual([]);
    expect((await prisma.pedidoDeAccesoAHabitos.findUniqueOrThrow({ where: { id: deNut.accessRequestId } })).estado).toBe('ACEPTADO');

    // D-17 nueva: la persona cambia de opinión cuando quiera. El entrenador vuelve a pedir a los 7 días (acá, un pedido viejo
    // directo en la base) y ella dice que sí: con la autorización activa, se suma y nadie más cambia.
    const avEnt = await componente(e.ent, e.ase, 'ENTRENAMIENTO');
    const otraVez = await prisma.pedidoDeAccesoAHabitos.create({ data: { profesionalId: e.ent.id, asesoradoId: e.ase.id, alcanceDeVinculoId: avEnt.id, alcance: 'ENTRENAMIENTO', pedidoEn: new Date(), procedencia: {} } });
    await si(otraVez.id, null).expect(409); // la autorización ya va por la v1
    await si(otraVez.id, 'v1').expect(200);
    const ahora = await misHabitos(e.ase);
    expect(ahora.sharing.version).toBe('v2');
    expect(ahora.professionals.every((p) => p.sharing === 'RECEIVES')).toBe(true);
    expect(await prisma.eventoDeFormulario.findMany({ where: { asesoradoId: e.ase.id, recursoTipo: 'PedidoDeAccesoAHabitos', profesionalId: e.ent.id }, orderBy: { secuencia: 'asc' }, select: { tipo: true } })).toEqual([
      { tipo: 'PedidoDeAccesoAHabitosHecho' },
      { tipo: 'PedidoDeAccesoAHabitosNoPorAhora' },
      { tipo: 'PedidoDeAccesoAHabitosAceptado' },
    ]);
  });

  it('sin el A3, los pedidos no se leen y «Sí» no se puede (compartir es lo propio); «No, por ahora» sí: decir que no siempre se puede', async () => {
    const e = await equipo('sin-a3');
    const deNut = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(e.nut.token).pedir(e.ase.id, 'NUTRICION').expect(201)).body).data;
    const deEnt = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(e.ent.token).pedir(e.ase.id, 'ENTRENAMIENTO').expect(201)).body).data;
    await conSesion(app, e.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, e.ase.token)}/revoke`).send({}).expect(200);
    expect((await pedidos(e.ase.token).pendientes().expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    const si = await pedidos(e.ase.token).responder(deNut.accessRequestId, { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId: TEXTO } }).expect(403);
    expect(si.body.error.code).toBe('ACTION_FORBIDDEN');
    await pedidos(e.ase.token).responder(deEnt.accessRequestId, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(200);
    expect((await prisma.pedidoDeAccesoAHabitos.findUniqueOrThrow({ where: { id: deEnt.accessRequestId } })).estado).toBe('NO_POR_AHORA');
    expect(await prisma.autorizacionDeHabitos.count({ where: { asesoradoId: e.ase.id } })).toBe(0);
  });

  it('sumarlo desde «Mis hábitos» (API-HBT-03, también desde la 0.21) da por aceptado su pedido; en pausa el pedido no se muestra, y con el vínculo terminado ya no se responde', async () => {
    const e = await equipo('cerrar');
    await hbt(e.ase.token).registrar({ expectedVersion: null, answers: HABITOS }).expect(201);
    await compartirCon(e.ase, [e.nut], [e.ent]);
    const deEnt = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(e.ent.token).pedir(e.ase.id, 'ENTRENAMIENTO').expect(201)).body).data;
    // «Cambiar con quiénes»: vuelve a sumar al que había dicho que no, y su pedido queda aceptado.
    await compartirCon(e.ase, [e.nut, e.ent]);
    expect((await prisma.pedidoDeAccesoAHabitos.findUniqueOrThrow({ where: { id: deEnt.accessRequestId } })).estado).toBe('ACEPTADO');
    expect(await pendientesDe(e.ase)).toEqual([]);
    await hbt(e.ent.token).deLaPersona(e.ase.id).expect(200);

    // Otra persona, con un pedido de un profesional en pausa: no se muestra mientras dure la pausa.
    const f = await equipo('pausa');
    const deNut = PedidoDeAccesoCreadoResponseSchema.parse((await pedidos(f.nut.token).pedir(f.ase.id, 'NUTRICION').expect(201)).body).data;
    await pausar(app, f.ase.token, f.vNut.vinculoId, await versionDeVinculo(app, f.ase.token, f.vNut.vinculoId)).expect(200);
    expect(await pendientesDe(f.ase)).toEqual([]);
    await reanudar(app, f.ase.token, f.vNut.vinculoId, await versionDeVinculo(app, f.ase.token, f.vNut.vinculoId)).expect(200);
    expect((await pendientesDe(f.ase)).map((p) => p.accessRequestId)).toEqual([deNut.accessRequestId]);
    // Con el vínculo terminado, ya no: no se lista, y decir que sí es 422 (ese profesional no la acompaña).
    await finalizar(app, f.ase.token, f.vNut.vinculoId, await versionDeVinculo(app, f.ase.token, f.vNut.vinculoId)).expect(200);
    expect(await pendientesDe(f.ase)).toEqual([]);
    const r = await pedidos(f.ase.token).responder(deNut.accessRequestId, { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId: TEXTO } }).expect(422);
    expect(r.body.error.code).toBe('HABITS_RECIPIENT_NOT_AVAILABLE');
  });
});
