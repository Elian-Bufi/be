/**
 * PF-02 · DL-102: la evaluación de entrenamiento cita respuestas de formulario como evidencia, por la API real y contra
 * PostgreSQL. Ficha: docs/propuestas/PF-01-02_contexto-de-entrenamiento.md. Las pruebas están agrupadas por las cinco
 * dimensiones que pidió la auditoría del PR #101:
 *   1. autorización de las citas (CA-FOR-04, CA-FOR-07, V-01, PDP antes que las citas, 422 neutral);
 *   2. conservación de la versión citada (V-07, cadenas de rectificaciones, answeredAt, rótulo y unidad);
 *   3. comportamiento ante rectificaciones (campo que aparece o desaparece entre versiones);
 *   4. lectura tras revocar permisos (V-01 lectura, V-02 con B2, A3, pausa y finalización);
 *   5. migración y restricciones de integridad (trigger de pertenencia, misma transacción, solo agregado, CHECK, UNIQUE).
 */
import type { INestApplication } from '@nestjs/common';
import { EvaluacionDeEntrenamientoResponseSchema, ListaDeEvaluacionesDeEntrenamientoResponseSchema, type RespuestaCitada } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { a3Vigente, finalizar, pausar, prepararAsesorado, prepararProfesional, revocarB2, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';
import { circuitoDeEntrenamiento, cuerpoDeEvaluacionDeEntrenamiento, PROCEDENCIA_SQL, type CircuitoDeEntrenamiento } from './soporte-entrenamiento';

const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const VERSION_HABITOS = '4879e539-235f-4f91-83fc-2e113c404393';
const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const fresco = (): Promise<CircuitoDeEntrenamiento> => circuitoDeEntrenamiento(app, `ctx-${++contador}`);

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const evaluaciones = (adviseeId: string) => `/api/v1/advisees/${adviseeId}/training/evaluations`;
const detalle = (evaluationId: string) => `/api/v1/training/evaluations/${evaluationId}`;

interface Opciones {
  readonly preferencias?: string;
  readonly unidadDeMinutos?: string;
}
function respuestas(dias: number, o: Opciones = {}) {
  return [
    { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme' },
    { fieldCode: 'trn_experiencia', value: 'Caminatas; nada de fuerza en el último año' },
    { fieldCode: 'trn_dias_por_semana', value: dias },
    { fieldCode: 'trn_minutos_por_sesion', value: 45, ...(o.unidadDeMinutos ? { unit: o.unidadDeMinutos } : {}) },
    { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa, con mancuernas livianas' },
    ...(o.preferencias ? [{ fieldCode: 'trn_preferencias', value: o.preferencias }] : []),
  ];
}

interface Respondida {
  readonly formResponseId: string;
  readonly submittedAt: string;
}
/** El profesional pide «Antecedentes para entrenamiento» y el asesorado responde (cinco campos, más preferencias si se pasa). */
async function responder(pro: Parte, ase: Parte, dias = 3, o: Opciones = {}): Promise<Respondida> {
  const solicitud = await conSesion(app, pro.token)
    .post(`/api/v1/advisees/${ase.id}/form-requests`)
    .send({ templateVersionId: VERSION_ENTRENAMIENTO, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) })
    .expect(201);
  const r = await conSesion(app, ase.token).post(`/api/v1/me/form-requests/${solicitud.body.data.formRequestId}/responses`).send({ answers: respuestas(dias, o) }).expect(201);
  return { formResponseId: r.body.data.formResponseId as string, submittedAt: r.body.data.submittedAt as string };
}
const contextoRespondido = async (pro: Parte, ase: Parte, dias = 3): Promise<string> => (await responder(pro, ase, dias)).formResponseId;

/** El asesorado rectifica su respuesta (FRM-08) y devuelve el identificador y el instante de la rectificación. */
async function rectificar(ase: Parte, formResponseId: string, expectedVersion: string, dias: number, o: Opciones = {}): Promise<{ rectificationId: string; recordedAt: string }> {
  const r = await conSesion(app, ase.token)
    .post(`/api/v1/me/form-responses/${formResponseId}/rectifications`)
    .send({ expectedVersion, reason: 'Actualizo un dato.', answers: respuestas(dias, o) })
    .expect(201);
  return { rectificationId: r.body.data.rectificationId as string, recordedAt: r.body.data.recordedAt as string };
}

/** Una cita tal como la manda el cliente: `expectedVersion` es la versión de la respuesta que vio (opcional). */
type Cita = { formResponseId: string; fieldCode: string; expectedVersion?: string };
const conCitas = (citas: Cita[]) => ({ ...cuerpoDeEvaluacionDeEntrenamiento(), formResponseReferences: citas });

async function citasDe(pro: Parte, evaluationId: string): Promise<RespuestaCitada[]> {
  const r = await conSesion(app, pro.token).get(detalle(evaluationId)).expect(200);
  return EvaluacionDeEntrenamientoResponseSchema.parse(r.body).data.formResponseReferences;
}
async function citasPorLista(pro: Parte, adviseeId: string): Promise<Map<string, RespuestaCitada[]>> {
  const r = await conSesion(app, pro.token).get(evaluaciones(adviseeId)).expect(200);
  return new Map(ListaDeEvaluacionesDeEntrenamientoResponseSchema.parse(r.body).data.map((e) => [e.evaluationId, e.formResponseReferences]));
}
async function citar(pro: Parte, ase: Parte, citas: Cita[]): Promise<string> {
  const r = await conSesion(app, pro.token).post(evaluaciones(ase.id)).send(conCitas(citas)).expect(201);
  return r.body.data.evaluationId as string;
}

// ─── 1. Autorización de las citas ───────────────────────────────────────────────────────────────

describe('PF-02 · DL-102 · 1. autorización de las citas', () => {
  it('CA-FOR-04 / CA-TRN-01 · la evaluación cita respuestas concretas, con rótulo, unidad, origen y versión; no las copia como observación', async () => {
    const c = await fresco();
    const respuestaId = await contextoRespondido(c.pro, c.ase);
    const evaluationId = await citar(c.pro, c.ase, [
      { formResponseId: respuestaId, fieldCode: 'trn_dias_por_semana' },
      { formResponseId: respuestaId, fieldCode: 'trn_objetivo_declarado' },
    ]);
    const evaluacion = EvaluacionDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(detalle(evaluationId)).expect(200)).body).data;
    expect(evaluacion.formResponseReferences).toHaveLength(2);
    const [dias, objetivo] = evaluacion.formResponseReferences;
    expect(dias).toMatchObject({ formResponseId: respuestaId, fieldCode: 'trn_dias_por_semana', value: 3, unit: 'días por semana', provenance: 'SELF_REPORTED', citedVersion: 'v1', laterVersionExists: false });
    expect(dias?.label).toBe('Cuántos días por semana podrías reservar de manera realista');
    expect(objetivo).toMatchObject({ fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme', unit: null });
    // La valoración del profesional no se tocó: la cita no se convierte en un dato OBSERVED ni REPORTED de la valoración.
    expect(evaluacion.assessment.entries).toHaveLength(3);
    expect((await citasPorLista(c.pro, c.ase.id)).get(evaluationId)?.map((r) => r.fieldCode)).toEqual(['trn_dias_por_semana', 'trn_objetivo_declarado']);
  });

  it('compatibilidad · una evaluación sin citas (cliente anterior) sigue funcionando y devuelve una lista vacía', async () => {
    const c = await fresco();
    const creada = await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    expect(await citasDe(c.pro, creada.body.data.evaluationId)).toEqual([]);
  });

  it('V-01 · CA-FOR-07 · no se cita lo de otra persona, de otro profesional, de otro alcance, ni un id inexistente o malformado; el 422 es idéntico y no escribe nada', async () => {
    // Un profesional con NUTRICION y ENTRENAMIENTO sobre el mismo asesorado: la Solicitud de NUTRICION es suya, pero no se cita.
    const etiqueta = `ctx-dos-alcances-${++contador}`;
    const pro = await prepararProfesional(app, etiqueta, ['NUTRICION', 'ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, etiqueta, { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    const propia = await contextoRespondido(pro, ase);
    const deNutricion = await conSesion(app, pro.token)
      .post(`/api/v1/advisees/${ase.id}/form-requests`)
      .send({ templateVersionId: VERSION_HABITOS, purpose: 'Acompañamiento nutricional', scope: 'NUTRICION', requestedFieldCodes: ['horas_de_sueno'], requiredFieldCodes: ['horas_de_sueno'] })
      .expect(201);
    const respuestaDeNutricion = (
      await conSesion(app, ase.token).post(`/api/v1/me/form-requests/${deNutricion.body.data.formRequestId}/responses`).send({ answers: [{ fieldCode: 'horas_de_sueno', value: 7 }] }).expect(201)
    ).body.data.formResponseId as string;
    // Otro asesorado del mismo profesional, y otro profesional con el mismo asesorado.
    const otroAse = await prepararAsesorado(app, `ctx-otro-${++contador}`, { a3: true });
    await vinculoCompleto(app, pro, otroAse, 'ENTRENAMIENTO');
    const deOtraPersona = await contextoRespondido(pro, otroAse);
    const otroPro = await prepararProfesional(app, `ctx-otro-pro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otroPro, ase, 'ENTRENAMIENTO');
    const deOtroProfesional = await contextoRespondido(otroPro, ase);

    const intento = (citas: { formResponseId: string; fieldCode: string }[]) => conSesion(app, pro.token).post(evaluaciones(ase.id)).send(conCitas(citas)).expect(422);
    const inexistente = (await intento([{ formResponseId: randomUUID(), fieldCode: 'trn_dias_por_semana' }])).body;
    expect(inexistente.error.code).toBe('TRAINING_EVALUATION_INVALID');
    expect(inexistente.error.details.issues).toEqual([{ code: 'FORM_RESPONSE_REFERENCE_INVALID', path: 'formResponseReferences[0]' }]);
    // Todos fallan en el índice 0 con el mismo cuerpo: nada distingue «no existe» de «es de otro» o «es de otro alcance».
    const mismos = [
      [{ formResponseId: deOtraPersona, fieldCode: 'trn_dias_por_semana' }],
      [{ formResponseId: deOtroProfesional, fieldCode: 'trn_dias_por_semana' }],
      [{ formResponseId: respuestaDeNutricion, fieldCode: 'horas_de_sueno' }],
      [{ formResponseId: 'no-es-un-uuid', fieldCode: 'trn_dias_por_semana' }],
      [{ formResponseId: propia, fieldCode: 'trn_preferencias' }], // pedido pero no respondido
      [{ formResponseId: propia, fieldCode: 'campo_que_no_existe' }],
    ];
    for (const citas of mismos) expect((await intento(citas)).body).toEqual(inexistente);
    // Repetida, también con el mismo UUID en mayúsculas: falla en el índice 1.
    for (const segunda of [propia, propia.toUpperCase()]) {
      const r = await intento([{ formResponseId: propia, fieldCode: 'trn_dias_por_semana' }, { formResponseId: segunda, fieldCode: 'trn_dias_por_semana' }]);
      expect(r.body.error.details.issues).toEqual([{ code: 'FORM_RESPONSE_REFERENCE_INVALID', path: 'formResponseReferences[1]' }]);
    }
    // Nada quedó escrito por los intentos rechazados.
    expect((await conSesion(app, pro.token).get(evaluaciones(ase.id)).expect(200)).body.data).toHaveLength(0);
    // El mismo UUID en mayúsculas, una sola vez, es válido y se guarda con su forma canónica.
    const evaluationId = await citar(pro, ase, [{ formResponseId: propia.toUpperCase(), fieldCode: 'trn_dias_por_semana' }]);
    expect((await citasDe(pro, evaluationId))[0]?.formResponseId).toBe(propia);
  });

  it('el PDP decide antes que las citas: el asesorado, o el profesional sin B2, recibe 404 aun con citas válidas (nunca un 422 que sirva de oráculo)', async () => {
    const c = await fresco();
    const propia = await contextoRespondido(c.pro, c.ase);
    const citas = [{ formResponseId: propia, fieldCode: 'trn_dias_por_semana' }];
    const neutral = (await conSesion(app, c.pro.token).post(evaluaciones(randomUUID())).send(conCitas(citas)).expect(404)).body;
    // El titular conoce sus ids, pero no es profesional: su intento no evalúa las citas. Recibe el mismo 404 que al
    // pedir sobre un asesorado inexistente.
    const titular = conSesion(app, c.ase.token);
    const inexistenteParaElTitular = (await titular.post(evaluaciones(randomUUID())).send(conCitas(citas)).expect(404)).body;
    expect((await titular.post(evaluaciones(c.ase.id)).send(conCitas(citas)).expect(404)).body).toEqual(inexistenteParaElTitular);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    expect((await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send(conCitas(citas)).expect(404)).body).toEqual(neutral);
    const filas = await prisma.evaluacionDeEntrenamiento.count({ where: { asesoradoId: c.ase.id } });
    expect(filas).toBe(0);
  });
});

// ─── 2. Conservación de la versión citada ───────────────────────────────────────────────────────

describe('PF-02 · DL-102 · 2. conservación de la versión citada', () => {
  it('V-07 · con tres versiones (v1 → v2 → v3), cada evaluación conserva la versión y la fecha que citó; la base guarda la rectificación terminal de ese momento', async () => {
    const c = await fresco();
    const { formResponseId, submittedAt } = await responder(c.pro, c.ase, 3);
    const cita = [{ formResponseId, fieldCode: 'trn_dias_por_semana' }];
    const primera = await citar(c.pro, c.ase, cita);
    const v2 = await rectificar(c.ase, formResponseId, 'v1', 4);
    const segunda = await citar(c.pro, c.ase, cita);
    const v3 = await rectificar(c.ase, formResponseId, 'v2', 5);
    const tercera = await citar(c.pro, c.ase, cita);

    const esperado = new Map([
      [primera, { value: 3, citedVersion: 'v1', laterVersionExists: true, answeredAt: submittedAt }],
      [segunda, { value: 4, citedVersion: 'v2', laterVersionExists: true, answeredAt: v2.recordedAt }],
      [tercera, { value: 5, citedVersion: 'v3', laterVersionExists: false, answeredAt: v3.recordedAt }],
    ]);
    const porLista = await citasPorLista(c.pro, c.ase.id);
    for (const [evaluationId, e] of esperado) {
      expect((await citasDe(c.pro, evaluationId))[0]).toMatchObject(e);
      expect(porLista.get(evaluationId)?.[0]).toMatchObject(e);
    }
    const filas = await prisma.citaDeRespuestaEnEvaluacionDeEntrenamiento.findMany({ where: { respuestaId: formResponseId } });
    const rectificacionDe = (evaluationId: string) => filas.find((f) => f.evaluacionId === evaluationId)?.rectificacionId;
    expect(rectificacionDe(primera)).toBeNull();
    expect(rectificacionDe(segunda)).toBe(v2.rectificationId);
    expect(rectificacionDe(tercera)).toBe(v3.rectificationId);
  });

  it('la unidad es la que declaró la persona; si no declaró ninguna, la de la plantilla', async () => {
    const c = await fresco();
    const { formResponseId } = await responder(c.pro, c.ase, 3, { unidadDeMinutos: 'minutos' });
    const evaluationId = await citar(c.pro, c.ase, [
      { formResponseId, fieldCode: 'trn_minutos_por_sesion' },
      { formResponseId, fieldCode: 'trn_dias_por_semana' },
    ]);
    const [minutos, dias] = await citasDe(c.pro, evaluationId);
    expect(minutos).toMatchObject({ value: 45, unit: 'minutos' });
    expect(dias).toMatchObject({ value: 3, unit: 'días por semana' });
  });

  it('una versión nueva de la plantilla no cambia el rótulo ni la unidad de lo ya citado (la Solicitud fija su versión)', async () => {
    const c = await fresco();
    const plantillaId = randomUUID();
    const v1 = randomUUID();
    const campo = (label: string, unit: string) =>
      JSON.stringify({ sections: [{ sectionCode: 'prueba', title: 'Prueba', fields: [{ fieldCode: 'trn_minutos_de_prueba', label, dataType: 'NUMBER', unit, category: 'HABITOS_Y_CONTEXTO', helpText: null }] }] });
    const procedencia = JSON.stringify({ rotulo: 'Plantilla sintética de una prueba de integración.' });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`INSERT INTO "plantilla_de_formulario" ("id","clave") VALUES ('${plantillaId}','FRM-PRUEBA-${plantillaId.slice(0, 8)}')`);
      await tx.$executeRawUnsafe(
        `INSERT INTO "version_de_plantilla_de_formulario" ("id","plantilla_id","version","nombre","proposito","dominio","contenido","procedencia") VALUES ('${v1}','${plantillaId}','1','Plantilla de prueba','Prueba de rótulos','ENTRENAMIENTO','${campo('Rótulo v1', 'min')}','${procedencia}')`,
      );
    });
    const solicitud = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/form-requests`)
      .send({ templateVersionId: v1, purpose: 'Prueba', scope: 'ENTRENAMIENTO', requestedFieldCodes: ['trn_minutos_de_prueba'], requiredFieldCodes: ['trn_minutos_de_prueba'] })
      .expect(201);
    const formResponseId = (
      await conSesion(app, c.ase.token).post(`/api/v1/me/form-requests/${solicitud.body.data.formRequestId}/responses`).send({ answers: [{ fieldCode: 'trn_minutos_de_prueba', value: 30 }] }).expect(201)
    ).body.data.formResponseId as string;
    const evaluationId = await citar(c.pro, c.ase, [{ formResponseId, fieldCode: 'trn_minutos_de_prueba' }]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "version_de_plantilla_de_formulario" ("id","plantilla_id","predecesora_id","version","nombre","proposito","dominio","contenido","procedencia") VALUES ('${randomUUID()}','${plantillaId}','${v1}','2','Plantilla de prueba','Prueba de rótulos','ENTRENAMIENTO','${campo('Rótulo v2', 'h')}','${procedencia}')`,
    );
    expect((await citasDe(c.pro, evaluationId))[0]).toMatchObject({ label: 'Rótulo v1', unit: 'min', value: 30 });
  });
});

// ─── 3. Comportamiento ante rectificaciones ─────────────────────────────────────────────────────

describe('PF-02 · DL-102 · 3. comportamiento ante rectificaciones', () => {
  it('si una rectificación quita el campo citado, lo citado se sigue leyendo con su valor; citarlo de nuevo ya no se puede', async () => {
    const c = await fresco();
    const { formResponseId } = await responder(c.pro, c.ase, 3, { preferencias: 'Me gusta caminar; evito correr' });
    const evaluationId = await citar(c.pro, c.ase, [{ formResponseId, fieldCode: 'trn_preferencias' }]);
    await rectificar(c.ase, formResponseId, 'v1', 3); // sin preferencias
    expect((await citasDe(c.pro, evaluationId))[0]).toMatchObject({ value: 'Me gusta caminar; evito correr', citedVersion: 'v1', laterVersionExists: true });
    expect((await citasPorLista(c.pro, c.ase.id)).get(evaluationId)?.[0]?.laterVersionExists).toBe(true);
    const r = await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId, fieldCode: 'trn_preferencias' }])).expect(422);
    expect(r.body.error.details.issues[0].code).toBe('FORM_RESPONSE_REFERENCE_INVALID');
  });

  it('si la rectificación agrega un campo que el original no tenía, se cita la rectificación', async () => {
    const c = await fresco();
    const { formResponseId } = await responder(c.pro, c.ase, 3);
    await rectificar(c.ase, formResponseId, 'v1', 3, { preferencias: 'Prefiero la mañana' });
    const evaluationId = await citar(c.pro, c.ase, [{ formResponseId, fieldCode: 'trn_preferencias' }]);
    expect((await citasDe(c.pro, evaluationId))[0]).toMatchObject({ value: 'Prefiero la mañana', citedVersion: 'v2', laterVersionExists: false });
  });

  it('dos citas de la misma respuesta en una evaluación quedan en la misma versión', async () => {
    const c = await fresco();
    const { formResponseId } = await responder(c.pro, c.ase, 3);
    const v2 = await rectificar(c.ase, formResponseId, 'v1', 4);
    const evaluationId = await citar(c.pro, c.ase, [
      { formResponseId, fieldCode: 'trn_dias_por_semana' },
      { formResponseId, fieldCode: 'trn_objetivo_declarado' },
    ]);
    const filas = await prisma.citaDeRespuestaEnEvaluacionDeEntrenamiento.findMany({ where: { evaluacionId: evaluationId } });
    expect(filas.map((f) => f.rectificacionId)).toEqual([v2.rectificationId, v2.rectificationId]);
  });
});

// ─── 4. Lectura tras revocar permisos ───────────────────────────────────────────────────────────

describe('PF-02 · DL-102 · 4. lectura tras revocar permisos', () => {
  it('V-01 · otro profesional y otro asesorado no leen una evaluación con citas: el mismo 404 que lo inexistente, y una lista vacía', async () => {
    const c = await fresco();
    const propia = await contextoRespondido(c.pro, c.ase);
    const evaluationId = await citar(c.pro, c.ase, [{ formResponseId: propia, fieldCode: 'trn_objetivo_declarado' }]);
    const otroPro = await prepararProfesional(app, `ctx-lector-${++contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otroPro, c.ase, 'ENTRENAMIENTO');
    const ajena = await conSesion(app, otroPro.token).get(detalle(evaluationId)).expect(404);
    const inexistente = await conSesion(app, otroPro.token).get(detalle(randomUUID())).expect(404);
    expect(ajena.body).toEqual(inexistente.body);
    expect(JSON.stringify(ajena.body)).not.toContain('Ganar fuerza');
    expect((await conSesion(app, otroPro.token).get(evaluaciones(c.ase.id)).expect(200)).body.data).toEqual([]);
    const otroAse = await prepararAsesorado(app, `ctx-lector-ase-${contador}`, { a3: true });
    const otro = conSesion(app, otroAse.token);
    const inexistenteParaElOtro = (await otro.get(detalle(randomUUID())).expect(404)).body;
    const delOtroAsesorado = await otro.get(detalle(evaluationId)).expect(404);
    expect(delOtroAsesorado.body).toEqual(inexistenteParaElOtro);
    expect(JSON.stringify(delOtroAsesorado.body)).not.toContain('Ganar fuerza');
  });

  const CORTES: readonly [string, (c: CircuitoDeEntrenamiento) => Promise<unknown>][] = [
    ['revocado el B2', (c) => revocarB2(app, c.ase, c.consentId).expect(200)],
    ['revocado el A3 del titular', async (c) => conSesion(app, c.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, c.ase.token)}/revoke`).send({}).expect(200)],
    ['pausado el vínculo', async (c) => pausar(app, c.ase.token, c.vinculoId, await versionDeVinculo(app, c.ase.token, c.vinculoId)).expect(200)],
    ['finalizado el vínculo', async (c) => finalizar(app, c.ase.token, c.vinculoId, await versionDeVinculo(app, c.ase.token, c.vinculoId)).expect(200)],
  ];
  it.each(CORTES)('V-02 · %s, ni la evaluación ni lo citado se leen: 404 idéntico al inexistente, sin contenido', async (_, cortar) => {
    const c = await fresco();
    const propia = await contextoRespondido(c.pro, c.ase);
    const evaluationId = await citar(c.pro, c.ase, [{ formResponseId: propia, fieldCode: 'trn_objetivo_declarado' }]);
    const pro = conSesion(app, c.pro.token);
    const neutralDetalle = (await pro.get(detalle(randomUUID())).expect(404)).body;
    const neutralLista = (await pro.get(evaluaciones(randomUUID())).expect(404)).body;
    await cortar(c);
    const d = await pro.get(detalle(evaluationId)).expect(404);
    expect(d.body).toEqual(neutralDetalle);
    expect(JSON.stringify(d.body)).not.toContain('Ganar fuerza');
    expect((await pro.get(evaluaciones(c.ase.id)).expect(404)).body).toEqual(neutralLista);
  });
});

// ─── 5. Migración y restricciones de integridad ─────────────────────────────────────────────────

const REVERTIR = new Error('revertir');
/** Corre sentencias en una transacción que siempre se revierte; devuelve el mensaje del error de la base, o 'SIN ERROR'. */
async function errorDeLaBase(...sentencias: string[]): Promise<string> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const s of sentencias) await tx.$executeRawUnsafe(s);
      throw REVERTIR;
    });
  } catch (e) {
    if (e === REVERTIR) return 'SIN ERROR';
    return String((e as Error).message);
  }
  return 'SIN ERROR';
}
const evaluacionSql = (id: string, pro: Parte, ase: Parte) =>
  `INSERT INTO "evaluacion_de_entrenamiento" ("id","profesional_id","asesorado_id","valoracion","referencias","procedencia","momento_de_ocurrencia") VALUES ('${id}','${pro.id}','${ase.id}','{}','[]',${PROCEDENCIA_SQL}, now())`;
const citaSql = (evaluacionId: string, respuestaId: string, o: { rectificacionId?: string; campo?: string; orden?: number } = {}) =>
  `INSERT INTO "cita_de_respuesta_en_evaluacion_de_entrenamiento" ("evaluacion_id","respuesta_id","rectificacion_id","codigo_de_campo","orden") VALUES ('${evaluacionId}','${respuestaId}',${o.rectificacionId ? `'${o.rectificacionId}'` : 'NULL'},'${o.campo ?? 'trn_dias_por_semana'}',${o.orden ?? 0})`;

describe('PF-02 · DL-102 · 5. migración y restricciones de integridad (a nivel SQL)', () => {
  it('el trigger exige mismo asesorado, Solicitud del mismo profesional y de ENTRENAMIENTO, rectificación de la misma respuesta y la misma transacción que la evaluación', async () => {
    const etiqueta = `ctx-sql-${++contador}`;
    const pro = await prepararProfesional(app, etiqueta, ['NUTRICION', 'ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, etiqueta, { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    const propia = await contextoRespondido(pro, ase);
    const otraPropia = (await responder(pro, ase, 4)).formResponseId;
    const rectificacionDeOtra = (await rectificar(ase, otraPropia, 'v1', 5)).rectificationId;
    const otroAse = await prepararAsesorado(app, `${etiqueta}-b`, { a3: true });
    await vinculoCompleto(app, pro, otroAse, 'ENTRENAMIENTO');
    const deOtraPersona = await contextoRespondido(pro, otroAse);
    const otroPro = await prepararProfesional(app, `${etiqueta}-p`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otroPro, ase, 'ENTRENAMIENTO');
    const deOtroProfesional = await contextoRespondido(otroPro, ase);
    const deNutricion = await conSesion(app, pro.token)
      .post(`/api/v1/advisees/${ase.id}/form-requests`)
      .send({ templateVersionId: VERSION_HABITOS, purpose: 'Acompañamiento nutricional', scope: 'NUTRICION', requestedFieldCodes: ['horas_de_sueno'], requiredFieldCodes: ['horas_de_sueno'] })
      .expect(201);
    const respuestaDeNutricion = (
      await conSesion(app, ase.token).post(`/api/v1/me/form-requests/${deNutricion.body.data.formRequestId}/responses`).send({ answers: [{ fieldCode: 'horas_de_sueno', value: 7 }] }).expect(201)
    ).body.data.formResponseId as string;
    const yaRegistrada = await citar(pro, ase, [{ formResponseId: propia, fieldCode: 'trn_dias_por_semana' }]);

    const e = randomUUID();
    // Control: una cita coherente, en la misma transacción que su evaluación, pasa.
    expect(await errorDeLaBase(evaluacionSql(e, pro, ase), citaSql(e, propia))).toBe('SIN ERROR');
    const PERTENENCIA = 'de alcance ENTRENAMIENTO (DL-102)';
    expect(await errorDeLaBase(evaluacionSql(e, pro, ase), citaSql(e, deOtraPersona))).toContain(PERTENENCIA);
    expect(await errorDeLaBase(evaluacionSql(e, pro, ase), citaSql(e, deOtroProfesional))).toContain(PERTENENCIA);
    expect(await errorDeLaBase(evaluacionSql(e, pro, ase), citaSql(e, respuestaDeNutricion, { campo: 'horas_de_sueno' }))).toContain(PERTENENCIA);
    expect(await errorDeLaBase(evaluacionSql(e, pro, ase), citaSql(e, propia, { rectificacionId: rectificacionDeOtra }))).toContain('la rectificación citada es de la misma respuesta');
    // Agregarle una cita a una evaluación ya registrada (otra transacción) no se puede.
    expect(await errorDeLaBase(citaSql(yaRegistrada, otraPropia, { orden: 5 }))).toContain('junto con su evaluación, en la misma transacción');
  });

  it('solo agregado, CHECK y UNIQUE: una cita no se edita ni se borra, el campo no es vacío, el orden no es negativo y no se repiten orden ni respuesta y campo', async () => {
    const c = await fresco();
    const propia = await contextoRespondido(c.pro, c.ase);
    const evaluationId = await citar(c.pro, c.ase, [{ formResponseId: propia, fieldCode: 'trn_dias_por_semana' }]);
    const tabla = '"cita_de_respuesta_en_evaluacion_de_entrenamiento"';
    expect(await errorDeLaBase(`UPDATE ${tabla} SET "codigo_de_campo" = 'trn_experiencia' WHERE "evaluacion_id" = '${evaluationId}'`)).toMatch(/append-only/);
    expect(await errorDeLaBase(`DELETE FROM ${tabla} WHERE "evaluacion_id" = '${evaluationId}'`)).toMatch(/append-only/);

    const e = randomUUID();
    const nueva = evaluacionSql(e, c.pro, c.ase);
    expect(await errorDeLaBase(nueva, citaSql(e, propia, { campo: '  ' }))).toContain('cita_de_respuesta_en_evaluacion_con_campo');
    expect(await errorDeLaBase(nueva, citaSql(e, propia, { orden: -1 }))).toContain('cita_de_respuesta_en_evaluacion_orden_valido');
    const ordenRepetido = await errorDeLaBase(nueva, citaSql(e, propia), citaSql(e, propia, { campo: 'trn_experiencia', orden: 0 }));
    expect(ordenRepetido).toContain('23505');
    expect(ordenRepetido).toContain('(evaluacion_id, orden)');
    const citaRepetida = await errorDeLaBase(nueva, citaSql(e, propia), citaSql(e, propia, { orden: 1 }));
    expect(citaRepetida).toContain('23505');
    expect(citaRepetida).toContain('(evaluacion_id, respuesta_id, codigo_de_campo)');
  });
});

// ─── 6. Precondición de versión (auditoría del #102) ────────────────────────────────────────────

describe('PF-02 · DL-102 · 6. precondición de versión: se cita lo que el profesional vio', () => {
  /** La versión de la respuesta que ve el website al cargar el contexto (FRM-05). */
  async function versionVista(pro: Parte, formRequestId: string): Promise<{ version: string; dias: unknown }> {
    const r = await conSesion(app, pro.token).get(`/api/v1/form-requests/${formRequestId}`).expect(200);
    const respuesta = r.body.data.response;
    const vigente = respuesta.effectiveView.kind === 'RECTIFIED' ? respuesta.rectifications.find((x: { rectificationId: string }) => x.rectificationId === respuesta.effectiveView.rectificationId) : respuesta.original;
    return { version: respuesta.version as string, dias: vigente.answers.find((a: { fieldCode: string }) => a.fieldCode === 'trn_dias_por_semana')?.value };
  }

  it('cargar v1, rectificar a v2 y enviar lo de v1 da 409 sin escribir nada; actualizar, revisar y enviar v2 cita v2', async () => {
    const c = await fresco();
    const { formResponseId } = await responder(c.pro, c.ase, 3);
    const formRequestId = (await prisma.respuestaDeFormulario.findUniqueOrThrow({ where: { id: formResponseId } })).solicitudId;
    // 1. El profesional carga el contexto y ve v1 (3 días).
    const vista = await versionVista(c.pro, formRequestId);
    expect(vista).toEqual({ version: 'v1', dias: 3 });
    // 2. Mientras tanto, la persona rectifica a v2 (4 días).
    await rectificar(c.ase, formResponseId, 'v1', 4);
    // 3. El envío con lo que vio (v1) no se registra: conflicto, sin evaluación ni cita.
    const pro = conSesion(app, c.pro.token);
    const conflicto = await pro.post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId, fieldCode: 'trn_dias_por_semana', expectedVersion: vista.version }])).expect(409);
    expect(conflicto.body.error.code).toBe('VERSION_CONFLICT');
    expect(conflicto.body.error.details.issues).toEqual([{ code: 'FORM_RESPONSE_VERSION_CHANGED', path: 'formResponseReferences[0].expectedVersion' }]);
    expect(await prisma.evaluacionDeEntrenamiento.count({ where: { asesoradoId: c.ase.id } })).toBe(0);
    expect(await prisma.citaDeRespuestaEnEvaluacionDeEntrenamiento.count({ where: { respuestaId: formResponseId } })).toBe(0);
    // 4. Actualiza el contexto, ve v2 (4 días), lo revisa y lo cita: se registra con v2.
    const actualizada = await versionVista(c.pro, formRequestId);
    expect(actualizada).toEqual({ version: 'v2', dias: 4 });
    const creada = await pro.post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId, fieldCode: 'trn_dias_por_semana', expectedVersion: actualizada.version }])).expect(201);
    expect((await citasDe(c.pro, creada.body.data.evaluationId))[0]).toMatchObject({ value: 4, citedVersion: 'v2', laterVersionExists: false });
  });

  it('si la rectificación quitó el campo elegido, también es 409 (no un 422): lo que cambió es la versión', async () => {
    const c = await fresco();
    const { formResponseId } = await responder(c.pro, c.ase, 3, { preferencias: 'Me gusta caminar' });
    await rectificar(c.ase, formResponseId, 'v1', 3); // sin preferencias
    const r = await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId, fieldCode: 'trn_preferencias', expectedVersion: 'v1' }])).expect(409);
    expect(r.body.error.code).toBe('VERSION_CONFLICT');
  });

  it('sobre una respuesta ajena o inexistente, la precondición no se evalúa: sigue el 422 neutral idéntico, nunca un 409 que revele que existe', async () => {
    const c = await fresco();
    const otroAse = await prepararAsesorado(app, `ctx-ver-${++contador}`, { a3: true });
    await vinculoCompleto(app, c.pro, otroAse, 'ENTRENAMIENTO');
    const ajena = await contextoRespondido(c.pro, otroAse);
    const pro = conSesion(app, c.pro.token);
    const inexistente = (await pro.post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId: randomUUID(), fieldCode: 'trn_dias_por_semana', expectedVersion: 'v9' }])).expect(422)).body;
    for (const expectedVersion of ['v1', 'v9']) {
      const r = await pro.post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId: ajena, fieldCode: 'trn_dias_por_semana', expectedVersion }])).expect(422);
      expect(r.body).toEqual(inexistente);
    }
  });

  it('con la versión correcta se registra igual que sin precondición (compatibilidad del contrato)', async () => {
    const c = await fresco();
    const { formResponseId } = await responder(c.pro, c.ase, 3);
    const conPrecondicion = await citar(c.pro, c.ase, [{ formResponseId, fieldCode: 'trn_dias_por_semana', expectedVersion: 'v1' }]);
    const sinPrecondicion = await citar(c.pro, c.ase, [{ formResponseId, fieldCode: 'trn_dias_por_semana' }]);
    for (const id of [conPrecondicion, sinPrecondicion]) expect((await citasDe(c.pro, id))[0]).toMatchObject({ value: 3, citedVersion: 'v1' });
  });
});
