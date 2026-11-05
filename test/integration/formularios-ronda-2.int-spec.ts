/**
 * WP-FORMULARIOS-RONDA-2 (DEUDA_LEGAJO DL-165) · lo que la ronda 2 cambia en la API, por la API real y contra PostgreSQL:
 * - FR-08 · el formato 3: una versión con el subtipo de varias opciones dentro de un renglón (o lo demás de la ronda 2)
 *   solo se le entrega a un cliente que declara `forms-format-3`. Para los demás (la APK 0.20 y las anteriores) no
 *   existe: FRI-02 no la lista, FRI-01, 03, 04, 05, 06, 07 y 08 responden el 404 de lo inexistente, y las de FRM tampoco
 *   la sirven. Con la capacidad se lee, se responde, se carga y se rectifica con la lista de opciones en el renglón.
 * - FR-07 · la regla «no más días que los marcados»: un número con su tope en una tabla no pasa de lo marcado en ella
 *   (los «No puedo» no cuentan), al responder (FRI-04), al rectificar (FRI-05) y al cargar (FRI-06): 422 con
 *   FORM_ANSWER_MORE_THAN_MARKED en ese número. Sin la tabla respondida, no hay tope.
 */
import type { INestApplication } from '@nestjs/common';
import { DetalleDeSolicitudV2ResponseSchema, ListaDeSolicitudesPropiasV2ResponseSchema, VersionDePlantillaV2ResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { CAMPOS_V3, CON_FORMATO_3, conDiasParaReservar, fri, pedirV2, REQUERIDOS_V3, RESPUESTAS_V3, sembrarPlantillaV3 } from './soporte-formularios-v2';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

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

interface CircuitoV3 {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly plantillaId: string;
  readonly versionId: string;
  readonly formRequestId: string;
}

/** Profesional de Nutrición, persona con A3, vínculo con B2, la plantilla de formato 3 y una Solicitud sobre ella (FRM-03, como el website). */
async function circuitoV3(etiqueta: string): Promise<CircuitoV3> {
  const pro = await prepararProfesional(app, `r2-${etiqueta}`, ['NUTRICION']);
  const ase = await prepararAsesorado(app, `r2-${etiqueta}`, { a3: true });
  await vinculoCompleto(app, pro, ase, 'NUTRICION');
  const { plantillaId, versionId } = await sembrarPlantillaV3(prisma, etiqueta, 'NUTRICION');
  const formRequestId = await pedirV2(app, pro, ase.id, versionId, 'NUTRICION', CAMPOS_V3, REQUERIDOS_V3);
  return { pro, ase, plantillaId, versionId, formRequestId };
}

describe('FR-08 · el formato 3, solo para quien lo declara (DL-165 D-6; DL-152)', () => {
  it('sin la capacidad, la Solicitud de formato 3 no existe: FRI-02 no la lista y FRI-01, 03, 04, 05, 06, 07 y 08 responden el 404 de lo inexistente', async () => {
    const c = await circuitoV3(`sin-${++contador}`);
    const comoLaApk020 = fri(app, c.ase.token);
    const inexistente = await comoLaApk020.vista(randomUUID()).expect(404);
    // La bandeja, con y sin filtros, no la trae: para esa APK no hay nada que responder.
    for (const consulta of ['', '?status=PENDING&limit=3']) {
      const bandeja = ListaDeSolicitudesPropiasV2ResponseSchema.parse((await comoLaApk020.bandeja(consulta).expect(200)).body).data;
      expect(bandeja.map((s) => s.formRequestId)).not.toContain(c.formRequestId);
    }
    expect((await comoLaApk020.vista(c.formRequestId).expect(404)).body).toEqual(inexistente.body);
    expect((await comoLaApk020.definicion(c.plantillaId, c.versionId).expect(404)).body).toEqual(inexistente.body);
    expect((await comoLaApk020.responder(c.formRequestId, { answers: RESPUESTAS_V3, fromProposal: null }).expect(404)).body).toEqual(inexistente.body);
    expect((await comoLaApk020.rechazar(c.formRequestId, { expectedVersion: 'v1' }).expect(404)).body).toEqual(inexistente.body);
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    // Un cliente del profesional que no declara la capacidad tampoco la ve ni la carga.
    const proSinCapacidad = fri(app, c.pro.token);
    expect((await proSinCapacidad.vista(c.formRequestId).expect(404)).body).toEqual(inexistente.body);
    expect((await proSinCapacidad.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V3 }).expect(404)).body).toEqual(inexistente.body);
    expect((await proSinCapacidad.retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(404)).body).toEqual(inexistente.body);
    expect(await prisma.propuestaDeRespuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    // Las de FRM (las APK hasta la 0.18) tampoco: es V2, como en DL-164 D-5.
    const ase = conSesion(app, c.ase.token);
    const propias = await ase.get('/api/v1/me/form-requests').expect(200);
    expect((propias.body.data as { formRequestId: string }[]).map((s) => s.formRequestId)).not.toContain(c.formRequestId);
    expect((await ase.get(`/api/v1/form-requests/${c.formRequestId}`).expect(404)).body).toEqual(inexistente.body);
    expect((await ase.get(`/api/v1/form-templates/${c.plantillaId}/versions/${c.versionId}`).expect(404)).body).toEqual(inexistente.body);
  });

  it('con la capacidad se lee en formato 3, con el subtipo nuevo y sin minutos; se responde con varias opciones en el renglón y se rectifica', async () => {
    const c = await circuitoV3(`con-${++contador}`);
    const apkNueva = fri(app, c.ase.token, CON_FORMATO_3);
    const definicion = VersionDePlantillaV2ResponseSchema.parse((await apkNueva.definicion(c.plantillaId, c.versionId).expect(200)).body).data;
    expect(definicion).toMatchObject({ format: 3, usesNewTypes: true, estimatedMinutes: null });
    const deportes = definicion.sections.flatMap((s) => s.fields).find((f) => f.fieldCode === 'ini_deportes');
    expect(deportes?.dataType === 'LIST' ? deportes.itemFields.map((s) => s.dataType) : []).toEqual(['TEXT', 'MULTI_CHOICE']);
    const bandeja = ListaDeSolicitudesPropiasV2ResponseSchema.parse((await apkNueva.bandeja().expect(200)).body).data;
    expect(bandeja.find((s) => s.formRequestId === c.formRequestId)).toMatchObject({ usesNewTypes: true, estimatedMinutes: null, status: 'PENDING', respondable: true });
    // Una opción que la pregunta no tiene, o la lista vacía, no pasa: 422 con el issue en el renglón.
    const conUnDiaQueNoExiste = RESPUESTAS_V3.map((r) => (r.fieldCode === 'ini_deportes' ? { fieldCode: r.fieldCode, answer: { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'feriado'] }] } } : r));
    const invalida = await apkNueva.responder(c.formRequestId, { answers: conUnDiaQueNoExiste, fromProposal: null }).expect(422);
    expect(invalida.body.error.details.issues).toEqual([expect.objectContaining({ code: 'FORM_ANSWER_ITEM_FIELD_INVALID', fieldCode: 'ini_deportes', path: expect.stringContaining('.items[0].que_dias') })]);
    // Los días se mandan desordenados y repetidos: se guardan en el orden de la pregunta, una vez cada uno.
    const desordenados = RESPUESTAS_V3.map((r) => (r.fieldCode === 'ini_deportes' ? { fieldCode: r.fieldCode, answer: { type: 'LIST', items: [{ cual: ' Fútbol ', que_dias: ['jue', 'lun', 'jue'] }] } } : r));
    const respondida = await apkNueva.responder(c.formRequestId, { answers: desordenados, fromProposal: null }).expect(201);
    const vista = DetalleDeSolicitudV2ResponseSchema.parse((await apkNueva.vista(c.formRequestId).expect(200)).body).data;
    expect(vista.response?.original.answers.find((a) => a.fieldCode === 'ini_deportes')?.answer).toEqual({ type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'] }] });
    // Rectificar también con el subtipo nuevo.
    const otrosDias = RESPUESTAS_V3.map((r) => (r.fieldCode === 'ini_deportes' ? { fieldCode: r.fieldCode, answer: { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['mar', 'sab'] }] } } : r));
    await apkNueva.corregir(respondida.body.data.formResponseId as string, { expectedVersion: respondida.body.data.version, reason: 'Cambié de días.', answers: otrosDias }).expect(201);
    // Para la APK 0.20, la respuesta tampoco existe: FRI-05 es el mismo 404.
    const inexistente = await fri(app, c.ase.token).vista(randomUUID()).expect(404);
    const desdeLaApk020 = await fri(app, c.ase.token).corregir(respondida.body.data.formResponseId as string, { expectedVersion: 'v2', reason: 'x', answers: otrosDias }).expect(404);
    expect(desdeLaApk020.body).toEqual(inexistente.body);
  });

  it('con la capacidad, el profesional carga con el subtipo nuevo y la persona lo confirma; la transcripción no marca como corregido lo que solo cambió de orden', async () => {
    const c = await circuitoV3(`carga-${++contador}`);
    const web = fri(app, c.pro.token, CON_FORMATO_3);
    const cargada = (await web.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V3 }).expect(201)).body.data as { proposalId: string; version: string };
    const apkNueva = fri(app, c.ase.token, CON_FORMATO_3);
    const vista = DetalleDeSolicitudV2ResponseSchema.parse((await apkNueva.vista(c.formRequestId).expect(200)).body).data;
    expect(vista.proposal?.answers.find((a) => a.fieldCode === 'ini_deportes')?.answer).toEqual({ type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'] }] });
    // La persona confirma con los mismos días en otro orden: no es una corrección.
    const igualesEnOtroOrden = RESPUESTAS_V3.map((r) => (r.fieldCode === 'ini_deportes' ? { fieldCode: r.fieldCode, answer: { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['jue', 'lun'] }] } } : r));
    await apkNueva.responder(c.formRequestId, { answers: igualesEnOtroOrden, fromProposal: { proposalId: cargada.proposalId, expectedVersion: cargada.version } }).expect(201);
    const final = DetalleDeSolicitudV2ResponseSchema.parse((await web.vista(c.formRequestId).expect(200)).body).data;
    expect(final.response?.transcription?.correctedFieldCodes).toEqual([]);
  });
});

describe('FR-07 · no más días que los marcados (DL-165 D-5)', () => {
  /** El issue de la regla: en el número, nunca en la tabla, y sin repetir el valor enviado. */
  const delTope = (answers: readonly { fieldCode: string }[]) => ({ code: 'FORM_ANSWER_MORE_THAN_MARKED', fieldCode: 'ini_dias_por_semana', path: `answers[${answers.findIndex((a) => a.fieldCode === 'ini_dias_por_semana')}].answer` });

  it('responder: con dos días marcados (el «No puedo» no cuenta), tres para reservar es 422 en ese número, sin escribir nada; dos pasan', async () => {
    const c = await circuitoV3(`tope-${++contador}`);
    const apkNueva = fri(app, c.ase.token, CON_FORMATO_3);
    const tres = conDiasParaReservar(3);
    const rechazada = await apkNueva.responder(c.formRequestId, { answers: tres, fromProposal: null }).expect(422);
    expect(rechazada.body.error.code).toBe('FORM_RESPONSE_INVALID');
    expect(rechazada.body.error.details.issues).toEqual([delTope(tres)]);
    expect(JSON.stringify(rechazada.body)).not.toContain('"number":3');
    expect(await prisma.respuestaDeFormulario.count({ where: { solicitudId: c.formRequestId } })).toBe(0);
    const respondida = await apkNueva.responder(c.formRequestId, { answers: conDiasParaReservar(2), fromProposal: null }).expect(201);
    // Rectificar con la misma regla: cuatro días sobre los mismos dos marcados no pasa.
    const cuatro = conDiasParaReservar(4);
    const correccion = await apkNueva.corregir(respondida.body.data.formResponseId as string, { expectedVersion: respondida.body.data.version, reason: 'Puedo más días.', answers: cuatro }).expect(422);
    expect(correccion.body.error.details.issues).toEqual([delTope(cuatro)]);
  });

  it('cargar con la persona sigue la misma regla; sin la tabla respondida no hay tope, y fuera de sus límites el número dice solo eso', async () => {
    const c = await circuitoV3(`tope-carga-${++contador}`);
    const web = fri(app, c.pro.token, CON_FORMATO_3);
    const cinco = conDiasParaReservar(5);
    const rechazada = await web.cargar(c.formRequestId, { expectedVersion: null, answers: cinco }).expect(422);
    expect(rechazada.body.error.details.issues).toEqual([delTope(cinco)]);
    // Sin la tabla, el número no tiene tope más allá de sus límites (de 1 a 7).
    const sinTabla = conDiasParaReservar(5).filter((r) => r.fieldCode !== 'ini_dias');
    await web.cargar(c.formRequestId, { expectedVersion: null, answers: sinTabla }).expect(201);
    const c2 = await circuitoV3(`tope-limite-${++contador}`);
    const ocho = conDiasParaReservar(8);
    const fuera = await fri(app, c2.ase.token, CON_FORMATO_3).responder(c2.formRequestId, { answers: ocho, fromProposal: null }).expect(422);
    expect(fuera.body.error.details.issues).toEqual([{ code: 'FORM_ANSWER_ABOVE_MAXIMUM', fieldCode: 'ini_dias_por_semana', path: delTope(ocho).path }]);
  });
});
