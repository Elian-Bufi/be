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
 */
import type { INestApplication } from '@nestjs/common';
import {
  CAMPOS_DE_HABITOS,
  HabitosCompartidosEstadoResponseSchema,
  HabitosCompartidosResponseSchema,
  HabitosRegistradosResponseSchema,
  MisHabitosResponseSchema,
  SECCION_DE_HABITOS,
  VERSION_VIGENTE,
  type RespuestaDeCampoV2Entrada,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion, cuerpoDeCierre } from './soporte-api';
import { CON_FORMATO_3, fri, pedirV2, RESPUESTAS_V2, sembrarPlantillaV2 } from './soporte-formularios-v2';
import { VERSION_ENTRENAMIENTO_V3, VERSION_NUTRICION_INICIO_V2 } from './soporte-plantillas-de-inicio';
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
    const deNutricion = await pedir(e.nut, e.ase, VERSION_NUTRICION_INICIO_V2, 'NUTRICION', CAMPOS_DE_HABITOS, OBLIGATORIAS_DE_LA_PARTE);
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
    const deEntrenamiento = await pedir(e.ent, e.ase, VERSION_ENTRENAMIENTO_V3, 'ENTRENAMIENTO', ['trn_objetivo_declarado', 'horas_de_sueno', 'habitos_estres'], ['trn_objetivo_declarado']);
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
    const deEntrenamiento = await pedir(e.ent, e.ase, VERSION_ENTRENAMIENTO_V3, 'ENTRENAMIENTO', ['trn_objetivo_declarado', ...CAMPOS_DE_HABITOS], ['trn_objetivo_declarado']);
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
