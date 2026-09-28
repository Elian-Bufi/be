/**
 * PF-02 · DL-102: la evaluación de entrenamiento cita respuestas de formulario como evidencia, por la API real y contra
 * PostgreSQL. Ficha: docs/propuestas/PF-01-02_contexto-de-entrenamiento.md. Cada prueba nombra el criterio del Plan
 * Funcional que verifica (CA-FOR-04, CA-TRN-01, V-01, V-02, V-07).
 */
import type { INestApplication } from '@nestjs/common';
import { EvaluacionDeEntrenamientoResponseSchema, ListaDeEvaluacionesDeEntrenamientoResponseSchema } from '@be/domain';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto, type Parte } from './soporte-vinculo';
import { circuitoDeEntrenamiento, cuerpoDeEvaluacionDeEntrenamiento, type CircuitoDeEntrenamiento } from './soporte-entrenamiento';

const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];

let app: INestApplication;
let contador = 0;
const fresco = (): Promise<CircuitoDeEntrenamiento> => circuitoDeEntrenamiento(app, `ctx-${++contador}`);

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
});

const evaluaciones = (adviseeId: string) => `/api/v1/advisees/${adviseeId}/training/evaluations`;

/** El profesional pide «Antecedentes para entrenamiento» y el asesorado responde cinco campos (omite preferencias). */
async function contextoRespondido(pro: Parte, ase: Parte, dias = 3): Promise<string> {
  const solicitud = await conSesion(app, pro.token)
    .post(`/api/v1/advisees/${ase.id}/form-requests`)
    .send({ templateVersionId: VERSION_ENTRENAMIENTO, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) })
    .expect(201);
  const respondida = await conSesion(app, ase.token)
    .post(`/api/v1/me/form-requests/${solicitud.body.data.formRequestId}/responses`)
    .send({
      answers: [
        { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme' },
        { fieldCode: 'trn_experiencia', value: 'Caminatas; nada de fuerza en el último año' },
        { fieldCode: 'trn_dias_por_semana', value: dias },
        { fieldCode: 'trn_minutos_por_sesion', value: 45 },
        { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa, con mancuernas livianas' },
      ],
    })
    .expect(201);
  return respondida.body.data.formResponseId as string;
}

const conCitas = (citas: { formResponseId: string; fieldCode: string }[]) => ({ ...cuerpoDeEvaluacionDeEntrenamiento(), formResponseReferences: citas });

describe('PF-02 · DL-102 — citar respuestas en la evaluación de entrenamiento', () => {
  it('CA-FOR-04 / CA-TRN-01 · la evaluación cita respuestas concretas, con rótulo, unidad, origen y versión; no las copia como observación', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const respuestaId = await contextoRespondido(c.pro, c.ase);
    const creada = await pro
      .post(evaluaciones(c.ase.id))
      .send(conCitas([{ formResponseId: respuestaId, fieldCode: 'trn_dias_por_semana' }, { formResponseId: respuestaId, fieldCode: 'trn_objetivo_declarado' }]))
      .expect(201);

    const detalle = await pro.get(`/api/v1/training/evaluations/${creada.body.data.evaluationId}`).expect(200);
    const evaluacion = EvaluacionDeEntrenamientoResponseSchema.parse(detalle.body).data;
    expect(evaluacion.formResponseReferences).toHaveLength(2);
    const [dias, objetivo] = evaluacion.formResponseReferences;
    expect(dias).toMatchObject({ formResponseId: respuestaId, fieldCode: 'trn_dias_por_semana', value: 3, unit: 'días por semana', provenance: 'SELF_REPORTED', citedVersion: 'v1', laterVersionExists: false });
    expect(dias?.label).toBe('Cuántos días por semana podrías reservar de manera realista');
    expect(objetivo).toMatchObject({ fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme', unit: null });
    // La valoración del profesional no se tocó: la cita no se convierte en un dato OBSERVED ni REPORTED de la valoración.
    expect(evaluacion.assessment.entries).toHaveLength(3);

    const lista = ListaDeEvaluacionesDeEntrenamientoResponseSchema.parse((await pro.get(evaluaciones(c.ase.id)).expect(200)).body);
    expect(lista.data[0]?.formResponseReferences.map((r) => r.fieldCode)).toEqual(['trn_dias_por_semana', 'trn_objetivo_declarado']);
  });

  it('compatibilidad · una evaluación sin citas (cliente anterior) sigue funcionando y devuelve una lista vacía', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const creada = await pro.post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const detalle = await pro.get(`/api/v1/training/evaluations/${creada.body.data.evaluationId}`).expect(200);
    expect(EvaluacionDeEntrenamientoResponseSchema.parse(detalle.body).data.formResponseReferences).toEqual([]);
  });

  it('V-07 · si la persona rectifica después de la cita, el valor citado se conserva y la lectura avisa que hay una versión posterior', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const respuestaId = await contextoRespondido(c.pro, c.ase, 3);
    const creada = await pro.post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId: respuestaId, fieldCode: 'trn_dias_por_semana' }])).expect(201);
    await conSesion(app, c.ase.token)
      .post(`/api/v1/me/form-responses/${respuestaId}/rectifications`)
      .send({
        expectedVersion: 'v1',
        reason: 'Ahora tengo un día más.',
        answers: [
          { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme' },
          { fieldCode: 'trn_experiencia', value: 'Caminatas; nada de fuerza en el último año' },
          { fieldCode: 'trn_dias_por_semana', value: 4 },
          { fieldCode: 'trn_minutos_por_sesion', value: 45 },
          { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa, con mancuernas livianas' },
        ],
      })
      .expect(201);
    const antes = EvaluacionDeEntrenamientoResponseSchema.parse((await pro.get(`/api/v1/training/evaluations/${creada.body.data.evaluationId}`).expect(200)).body).data;
    expect(antes.formResponseReferences[0]).toMatchObject({ value: 3, citedVersion: 'v1', laterVersionExists: true });

    // Una evaluación nueva cita la versión vigente: la rectificación.
    const nueva = await pro.post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId: respuestaId, fieldCode: 'trn_dias_por_semana' }])).expect(201);
    const despues = EvaluacionDeEntrenamientoResponseSchema.parse((await pro.get(`/api/v1/training/evaluations/${nueva.body.data.evaluationId}`).expect(200)).body).data;
    expect(despues.formResponseReferences[0]).toMatchObject({ value: 4, citedVersion: 'v2', laterVersionExists: false });
  });

  it('V-01 · no se puede citar la respuesta de otra persona ni una pedida por otro profesional; el 422 no revela si existe', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const propia = await contextoRespondido(c.pro, c.ase);

    // Otro asesorado del mismo profesional.
    const otroAse = await prepararAsesorado(app, `ctx-otro-${++contador}`, { a3: true });
    await vinculoCompleto(app, c.pro, otroAse, 'ENTRENAMIENTO');
    const deOtraPersona = await contextoRespondido(c.pro, otroAse);
    // Otro profesional, con el mismo asesorado.
    const otroPro = await prepararProfesional(app, `ctx-otro-pro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otroPro, c.ase, 'ENTRENAMIENTO');
    const deOtroProfesional = await contextoRespondido(otroPro, c.ase);

    const casos = [
      [{ formResponseId: deOtraPersona, fieldCode: 'trn_dias_por_semana' }],
      [{ formResponseId: deOtroProfesional, fieldCode: 'trn_dias_por_semana' }],
      [{ formResponseId: randomUUID(), fieldCode: 'trn_dias_por_semana' }],
      [{ formResponseId: propia, fieldCode: 'trn_preferencias' }], // pedido pero no respondido
      [{ formResponseId: propia, fieldCode: 'campo_que_no_existe' }],
      [{ formResponseId: propia, fieldCode: 'trn_dias_por_semana' }, { formResponseId: propia, fieldCode: 'trn_dias_por_semana' }], // repetida
    ];
    for (const citas of casos) {
      const r = await pro.post(evaluaciones(c.ase.id)).send(conCitas(citas)).expect(422);
      expect(r.body.error.code).toBe('TRAINING_EVALUATION_INVALID');
      expect(r.body.error.details.issues[0].code).toBe('FORM_RESPONSE_REFERENCE_INVALID');
    }
    // Nada quedó escrito por los intentos rechazados.
    expect((await pro.get(evaluaciones(c.ase.id)).expect(200)).body.data).toHaveLength(0);
  });

  it('V-02 · revocado B2 después de citar, ni la evaluación ni lo citado se leen (404 neutral, sin contenido)', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const respuestaId = await contextoRespondido(c.pro, c.ase);
    const creada = await pro.post(evaluaciones(c.ase.id)).send(conCitas([{ formResponseId: respuestaId, fieldCode: 'trn_objetivo_declarado' }])).expect(201);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    const detalle = await pro.get(`/api/v1/training/evaluations/${creada.body.data.evaluationId}`).expect(404);
    expect(JSON.stringify(detalle.body)).not.toContain('Ganar fuerza');
    await pro.get(evaluaciones(c.ase.id)).expect(404);
  });
});
