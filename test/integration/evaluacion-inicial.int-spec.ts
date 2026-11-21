/**
 * WP-EVALUACION-INICIAL-2 (DEUDA_LEGAJO DL-189) · TEST-EVI-010, por la API real y contra PostgreSQL: «Anotaciones» (RP-13)
 * es el texto libre del profesional en la evaluación (`professionalNotes`, EI-D06), y **ninguna lectura de la persona lo
 * devuelve**, en Nutrición ni en Entrenamiento:
 *   1. su autor lo lee en la evaluación (API-NUT-03 y API-TRN-03), con lo que se registró de lo que necesita el cálculo;
 *   2. la persona, al pedir esa evaluación, recibe el 404 de lo inexistente, idéntico al de un id que no existe;
 *   3. ninguna lectura propia de la persona sin parámetros (`GET /me/...`) trae el texto, y tampoco su exportación con los
 *      tres dominios (la Ley 26.529 y la exportación quedan como pendiente legal: lo revisa el abogado).
 *
 * Mutación que esta prueba mata (descrita; corre con la base de la CI, no en esta PC): sumar las notas del profesional a
 * cualquier lectura de la persona (por ejemplo, a la del plan del día o a la exportación).
 */
import type { INestApplication } from '@nestjs/common';
import { EvaluacionResponseSchema } from '@be/domain';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { appDePrueba, conSesion } from './soporte-api';
import { circuitoConPlanActivo, cuerpoDeEvaluacion } from './soporte-nutricion';
import { circuitoConPlanDeEntrenamientoActivo, cuerpoDeEvaluacionDeEntrenamiento } from './soporte-entrenamiento';
import { prepararProfesional, vinculoCompleto } from './soporte-vinculo';

let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
});

/** Las lecturas propias de la persona sin parámetros de ruta: todas las que puede pedir sin conocer un id. */
const LECTURAS_DE_LA_PERSONA = [
  '/me/analysis-views',
  '/me/anthropometry/progress',
  '/me/chart-sets',
  '/me/consents',
  '/me/coordination-notes',
  '/me/data-rights-requests',
  '/me/form-inbox',
  '/me/form-requests',
  '/me/habits',
  '/me/habits/access-requests',
  '/me/health-data-consents',
  '/me/news',
  '/me/nutrition/executions',
  '/me/nutrition/meal-records',
  '/me/nutrition/reviews',
  '/me/nutrition/today',
  '/me/nutrition/today/options',
  '/me/pending-steps',
  '/me/previous-history',
  '/me/profile',
  '/me/relationships',
  '/me/sharing-proposal',
  '/me/summary-sharing',
  '/me/training/agenda',
  '/me/training/executions',
  '/me/training/occurrences',
  '/me/training/reviews',
  '/me/training/session-in-progress',
  '/me/training/today',
];

const cuerpoDel404 = (r: { body: { error?: { code?: string; message?: string } } }) => ({ code: r.body.error?.code, message: r.body.error?.message });

describe('DL-189 · RP-13 · «Anotaciones» no llega a ninguna lectura de la persona', () => {
  it.each(['nutrition', 'training'] as const)('TEST-EVI-010 · %s: el autor las lee; la persona recibe el 404 de lo inexistente y no las ve en ninguna lectura ni en su exportación', async (area) => {
    const etiqueta = `evi-anotaciones-${area}-${randomUUID().slice(0, 8)}`;
    const c = area === 'nutrition' ? await circuitoConPlanActivo(app, etiqueta) : await circuitoConPlanDeEntrenamientoActivo(app, etiqueta);
    const marca = `Anotación privada ${randomUUID()}`;
    const cuerpo = area === 'nutrition' ? cuerpoDeEvaluacion() : cuerpoDeEvaluacionDeEntrenamiento();
    const ruta = area === 'nutrition' ? `/api/v1/advisees/${c.ase.id}/nutrition/evaluations` : `/api/v1/advisees/${c.ase.id}/training/evaluations`;
    // Lo que registra la evaluación nueva: un dato del cálculo con su fuente y su procedencia, y las anotaciones.
    const creada = await conSesion(app, c.pro.token)
      .post(ruta)
      .send({
        ...cuerpo,
        assessment: { entries: [{ concept: 'Sexo', value: 'Femenino', source: 'REPORTED' }, ...(cuerpo.assessment as { entries: unknown[] }).entries] },
        evidenceReferences: ['Sexo: cargado por el profesional.'],
        professionalNotes: marca,
      })
      .expect(201);
    const evaluationId = creada.body.data.evaluationId as string;

    // 1. El autor la lee, con sus anotaciones.
    const leida = await conSesion(app, c.pro.token).get(`/api/v1/${area}/evaluations/${evaluationId}`).expect(200);
    if (area === 'nutrition') expect(EvaluacionResponseSchema.parse(leida.body).data.professionalNotes).toBe(marca);
    else expect(leida.body.data.professionalNotes).toBe(marca);

    // 2. La persona: el mismo 404 que ante una evaluación que no existe.
    const suya = await conSesion(app, c.ase.token).get(`/api/v1/${area}/evaluations/${evaluationId}`);
    const inexistente = await conSesion(app, c.ase.token).get(`/api/v1/${area}/evaluations/${randomUUID()}`);
    expect(suya.status).toBe(404);
    expect(inexistente.status).toBe(404);
    expect(cuerpoDel404(suya)).toEqual(cuerpoDel404(inexistente));
    expect(JSON.stringify(suya.body)).not.toContain(marca);

    // 3. Ninguna lectura propia la trae, sea cual sea su respuesta.
    for (const lectura of LECTURAS_DE_LA_PERSONA) {
      const r = await conSesion(app, c.ase.token).get(`/api/v1${lectura}`);
      expect({ lectura, contiene: (r.text ?? JSON.stringify(r.body)).includes(marca) }).toEqual({ lectura, contiene: false });
    }
    // Tampoco la exportación de sus datos, con los tres dominios.
    const pedida = await conSesion(app, c.ase.token).post('/api/v1/me/exports').send({ scope: { domains: ['NUTRITION', 'TRAINING', 'ANTHROPOMETRY'], period: null } }).expect(201);
    const descarga = (await conSesion(app, c.ase.token).get(`/api/v1/me/exports/${pedida.body.data.exportId}`).expect(200)).body.data.download.path as string;
    const archivo = (await request(app.getHttpServer()).get(`/api/v1${descarga}`).expect(200)).text;
    expect(archivo.length).toBeGreaterThan(0);
    expect(archivo).not.toContain(marca);
  }, 180_000);

  /**
   * Revisión del PR: «Solo para vos» vale también frente a los otros profesionales de la persona. Uno del mismo área y uno
   * de otra, los dos con su vínculo y su B2 (lo que comparte la persona entre sus profesionales), y uno sin vínculo: al
   * pedir la evaluación reciben el 404 de lo inexistente, y ninguna lectura suya del caso trae las anotaciones.
   */
  it.each(['nutrition', 'training'] as const)('TEST-EVI-011 · %s: los otros profesionales de la persona reciben el 404 de lo inexistente y no las ven en ninguna lectura del caso', async (area) => {
    const etiqueta = `evi-otros-${area}-${randomUUID().slice(0, 8)}`;
    const c = area === 'nutrition' ? await circuitoConPlanActivo(app, etiqueta) : await circuitoConPlanDeEntrenamientoActivo(app, etiqueta);
    const marca = `Anotación privada ${randomUUID()}`;
    const cuerpo = area === 'nutrition' ? cuerpoDeEvaluacion() : cuerpoDeEvaluacionDeEntrenamiento();
    const ruta = area === 'nutrition' ? `/api/v1/advisees/${c.ase.id}/nutrition/evaluations` : `/api/v1/advisees/${c.ase.id}/training/evaluations`;
    const creada = await conSesion(app, c.pro.token).post(ruta).send({ ...cuerpo, professionalNotes: marca }).expect(201);
    const evaluationId = creada.body.data.evaluationId as string;

    const delArea = area === 'nutrition' ? 'NUTRICION' : 'ENTRENAMIENTO';
    const deOtra = area === 'nutrition' ? 'ENTRENAMIENTO' : 'NUTRICION';
    const mismoArea = await prepararProfesional(app, `${etiqueta}-mismo`, [delArea]);
    await vinculoCompleto(app, mismoArea, c.ase, delArea);
    const otraArea = await prepararProfesional(app, `${etiqueta}-otra`, [deOtra]);
    await vinculoCompleto(app, otraArea, c.ase, deOtra);
    const sinVinculo = await prepararProfesional(app, `${etiqueta}-sin`, [delArea]);

    for (const otro of [mismoArea, otraArea, sinVinculo]) {
      const suya = await conSesion(app, otro.token).get(`/api/v1/${area}/evaluations/${evaluationId}`);
      const inexistente = await conSesion(app, otro.token).get(`/api/v1/${area}/evaluations/${randomUUID()}`);
      expect(suya.status).toBe(404);
      expect(cuerpoDel404(suya)).toEqual(cuerpoDel404(inexistente));
      // Tampoco sus formularios vinculados (EVF-01): el mismo 404.
      const vinculados = await conSesion(app, otro.token).get(`/api/v1/${area}/evaluations/${evaluationId}/linked-forms`);
      expect(vinculados.status).toBe(404);
      expect(cuerpoDel404(vinculados)).toEqual(cuerpoDel404(await conSesion(app, otro.token).get(`/api/v1/${area}/evaluations/${randomUUID()}/linked-forms`)));
      // Ninguna lectura suya del caso las trae, sea cual sea su respuesta.
      for (const lectura of [
        `/advisees/${c.ase.id}/nutrition/evaluations`,
        `/advisees/${c.ase.id}/training/evaluations`,
        `/advisees/${c.ase.id}/timeline`,
        `/advisees/${c.ase.id}/dashboard`,
        `/advisees/${c.ase.id}/person-context/answers`,
        `/advisees/${c.ase.id}/person-context/body`,
        `/advisees/${c.ase.id}/shared-summaries`,
        `/advisees/${c.ase.id}/nutrition/review-context`,
        `/advisees/${c.ase.id}/training/review-context`,
        `/advisees/${c.ase.id}/professional-notes`,
        `/advisees/${c.ase.id}/form-requests`,
        '/me/portfolio',
        '/me/review-queue',
        '/me/news',
      ]) {
        const r = await conSesion(app, otro.token).get(`/api/v1${lectura}`);
        expect({ lectura, contiene: (r.text ?? JSON.stringify(r.body)).includes(marca) }).toEqual({ lectura, contiene: false });
      }
    }
  }, 240_000);
});
