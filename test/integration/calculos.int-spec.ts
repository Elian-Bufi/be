/**
 * Métodos y cálculos contra la API real (API-MTH-01/02 y API-CAL-01 a 04). Materializa los siete oráculos TEST-CAL
 * que el 11A dejó como título (11A:592-598) y las reglas del 06 §20.3 que los sostienen.
 *
 * Lo que se demuestra, en una frase cada uno:
 * - la corrida conserva la **versión exacta** del método, aunque después se publique una nueva (TEST-CAL-001);
 * - **disponible no es admisible**: el mismo dato sirve para una versión y no para otra (TEST-CAL-002);
 * - un `sourceRef` ajeno responde el **mismo 404** que uno inexistente (TEST-CAL-003);
 * - **varias corridas coexisten**, sin promedio y sin ganadora (TEST-CAL-004 y 005);
 * - **adoptar una referencia es una relación**, con historia, que no toca la corrida (TEST-CAL-006);
 * - el cálculo **no crea** objetivo ni prescripción, y la respuesta no dice que lo haya hecho (TEST-CAL-007).
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { CATALOGO_DEMO, circuitoAntropometrico, type CircuitoAntropometrico } from './soporte-antropometria';
import { prepararProfesional, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let c: CircuitoAntropometrico;
let pro: ReturnType<typeof conSesion>;

const AYER = new Date(Date.now() - 86_400_000).toISOString();

beforeAll(async () => {
  app = await appDePrueba();
  c = await circuitoAntropometrico(app, prisma, 'calculos');
  pro = conSesion(app, c.pro.token);
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const medicion = (metric: string, value: number, unit: string, origin: 'DIRECT_CAPTURE' | 'SELF_REPORTED' = 'DIRECT_CAPTURE') => ({
  metric,
  magnitude: { value, unit },
  protocolVersionId: c.protocoloVersionId,
  origin,
  occurredAt: AYER,
});

/** Una evaluación registrada con las mediciones pedidas; devuelve sus identificadores por métrica. */
async function evaluacionRegistrada(mediciones: ReturnType<typeof medicion>[]): Promise<{ evaluationId: string; porMetrica: Record<string, string> }> {
  const creada = await pro
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`)
    .send({ occurredAt: AYER, measurements: mediciones })
    .expect(201);
  const registrada = await pro
    .post(`/api/v1/anthropometry/evaluations/${creada.body.data.evaluationId}/register`)
    .send({ expectedVersion: creada.body.data.version })
    .expect(200);
  const porMetrica: Record<string, string> = {};
  for (const m of registrada.body.data.measurements as { metric: string; measurementId: string }[]) porMetrica[m.metric] = m.measurementId;
  return { evaluationId: registrada.body.data.evaluationId, porMetrica };
}

const bindings = (porMetrica: Record<string, string>) => [
  { inputCode: 'PESO', sourceRef: porMetrica.peso! },
  { inputCode: 'TALLA', sourceRef: porMetrica.talla! },
];

describe('API-MTH-01/02 — métodos versionados (REG-06-203)', () => {
  it('TEST-CAL-001 (parte 1): solo la versión vigente se ofrece como seleccionable; la histórica se consulta y dice que lo es', async () => {
    const lista = await pro.get('/api/v1/professional-methods').expect(200);
    const claves = (lista.body.data as { methodVersionId: string; status: string }[]).map((m) => m.methodVersionId);
    expect(claves).toContain(CATALOGO_DEMO.metodo.v2);
    expect(claves).not.toContain(CATALOGO_DEMO.metodo.v1);
    expect(lista.body.data.every((m: { status: string }) => m.status === 'SELECTABLE')).toBe(true);

    const historica = await pro.get(`/api/v1/professional-methods/${CATALOGO_DEMO.metodo.especificacionId}/versions/${CATALOGO_DEMO.metodo.v1}`).expect(200);
    expect(historica.body.data.status).toBe('HISTORICAL_NOT_SELECTABLE');
    expect(historica.body.data.supersededByVersionId).toBe(CATALOGO_DEMO.metodo.v2);
    // La versión histórica se sigue pudiendo explicar: declara sus entradas, su precisión y su regla.
    expect(historica.body.data.precisionPolicy).toEqual({ decimals: 2, rounding: 'HALF_UP' });
    expect(historica.body.data.ruleId).toBe('demo/peso-sobre-talla-cuadrado@1');
    expect(historica.body.data.requiredInputs.find((e: { inputCode: string }) => e.inputCode === 'PESO').acceptedProvenances).toEqual(['DIRECT_CAPTURE', 'SELF_REPORTED']);
  });

  it('los métodos son metadatos de la capacidad: el asesorado no los consulta, y no hay parámetro de asesorado', async () => {
    await conSesion(app, c.ase.token).get('/api/v1/professional-methods').expect(403);
    // El filtro por finalidad es allowlist; `adviseeId` no existe como parámetro (09 §21.1).
    await pro.get('/api/v1/professional-methods?purpose=OTRA').expect(400);
    await pro.get(`/api/v1/professional-methods?adviseeId=${c.ase.id}`).expect(400);
  });
});

describe('API-CAL-01 — ejecutar (REG-06-204/205)', () => {
  it('ejecuta con la versión vigente y deja la corrida reconstruible: método, versión, regla, precisión y entradas', async () => {
    const { evaluationId, porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const r = await pro
      .post(`/api/v1/advisees/${c.ase.id}/calculations`)
      .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
      .expect(201);

    expect(r.body.data.methodVersionId).toBe(CATALOGO_DEMO.metodo.v2);
    expect(r.body.data.evaluationId).toBe(evaluationId);
    expect(r.body.data.ruleId).toBe('demo/peso-sobre-talla-cuadrado@1');
    expect(r.body.data.precision).toEqual({ decimals: 3, rounding: 'HALF_UP' });
    expect(r.body.data.result).toEqual({ metric: 'indice-demo', magnitude: { value: 23.673, unit: 'kg/m2' } });
    // REG-06-205: la procedencia de cada entrada viaja con la corrida, para poder reconstruirla.
    expect(r.body.data.inputProvenance).toHaveLength(2);
    expect(r.body.data.inputProvenance.map((i: { inputCode: string }) => i.inputCode).sort()).toEqual(['PESO', 'TALLA']);
    expect(r.body.data.inputProvenance.every((i: { provenanceType: string }) => i.provenanceType === 'DIRECT_CAPTURE')).toBe(true);
    // TEST-CAL-007: ninguna corrida nace adoptada, y no hay ningún campo de decisión en la respuesta.
    expect(r.body.data.referenceForPurpose).toBe(false);
    expect(Object.keys(r.body.data)).not.toContain('objectiveCreated');
    expect(Object.keys(r.body.data)).not.toContain('prescriptionUpdated');
    expect(Object.keys(r.body.data)).not.toContain('planChanged');
  });

  it('TEST-CAL-002 · REG-06-204: el mismo dato es admisible para una versión y no para otra', async () => {
    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 70, 'kg', 'SELF_REPORTED'), medicion('talla', 1.75, 'm')]);
    const rechazada = await pro
      .post(`/api/v1/advisees/${c.ase.id}/calculations`)
      .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
      .expect(422);
    expect(rechazada.body.error.code).toBe('CALCULATION_INPUTS_INSUFFICIENT');
    expect(rechazada.body.error.details.issues).toEqual([{ code: 'PROCEDENCIA_NO_ADMITIDA', path: 'inputBindings.PESO' }]);

    // La v1 sí lo admitía, pero es histórica: no se puede elegir para una corrida nueva (REG-06-203).
    const historica = await pro
      .post(`/api/v1/advisees/${c.ase.id}/calculations`)
      .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v1, inputBindings: bindings(porMetrica) })
      .expect(422);
    expect(historica.body.error.code).toBe('METHOD_VERSION_NOT_SELECTABLE');
  });

  it('una versión no se ejecuta para una finalidad que no declara, ni con entradas incompletas', async () => {
    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const finalidad = await pro
      .post(`/api/v1/advisees/${c.ase.id}/calculations`)
      .send({ purpose: 'NUTRITION_OBJECTIVE_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
      .expect(422);
    expect(finalidad.body.error.code).toBe('METHOD_VERSION_NOT_SELECTABLE');

    const incompleta = await pro
      .post(`/api/v1/advisees/${c.ase.id}/calculations`)
      .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: [{ inputCode: 'PESO', sourceRef: porMetrica.peso! }] })
      .expect(422);
    expect(incompleta.body.error.code).toBe('CALCULATION_INPUTS_INSUFFICIENT');
    expect(incompleta.body.error.details.issues).toEqual([{ code: 'ENTRADA_FALTANTE', path: 'inputBindings.TALLA' }]);
  });

  it('TEST-CAL-003 · 09 §20.2.1: un sourceRef ajeno responde igual que uno inexistente', async () => {
    const otro = await circuitoAntropometrico(app, prisma, 'calculos-otro');
    const ajena = await conSesion(app, otro.pro.token)
      .post(`/api/v1/advisees/${otro.ase.id}/anthropometry/evaluations`)
      .send({ occurredAt: AYER, measurements: [{ ...medicion('peso', 80, 'kg'), protocolVersionId: otro.protocoloVersionId }] })
      .expect(201);
    const medicionAjena = ajena.body.data.measurements[0].measurementId as string;

    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const cuerpo = (peso: string) => ({
      purpose: 'ANTHROPOMETRIC_SUPPORT',
      methodVersionId: CATALOGO_DEMO.metodo.v2,
      inputBindings: [{ inputCode: 'PESO', sourceRef: peso }, { inputCode: 'TALLA', sourceRef: porMetrica.talla! }],
    });
    const conAjena = await pro.post(`/api/v1/advisees/${c.ase.id}/calculations`).send(cuerpo(medicionAjena)).expect(404);
    const conInventada = await pro.post(`/api/v1/advisees/${c.ase.id}/calculations`).send(cuerpo(randomUUID())).expect(404);
    expect(conAjena.body).toEqual(conInventada.body);
  });

  it('las entradas de una corrida son de una misma evaluación: si no, no se puede reconstruir con qué observación se calculó', async () => {
    const a = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const b = await evaluacionRegistrada([medicion('peso', 73, 'kg'), medicion('talla', 1.75, 'm')]);
    const r = await pro
      .post(`/api/v1/advisees/${c.ase.id}/calculations`)
      .send({
        purpose: 'ANTHROPOMETRIC_SUPPORT',
        methodVersionId: CATALOGO_DEMO.metodo.v2,
        inputBindings: [{ inputCode: 'PESO', sourceRef: a.porMetrica.peso! }, { inputCode: 'TALLA', sourceRef: b.porMetrica.talla! }],
      })
      .expect(422);
    expect(r.body.error.code).toBe('CALCULATION_NOT_REPRODUCIBLE');
  });
});

describe('API-CAL-02/03 — las corridas coexisten (REG-06-205)', () => {
  it('TEST-CAL-004 y TEST-CAL-005: dos corridas del mismo método con distintas entradas se listan las dos, sin promedio ni ganadora', async () => {
    const propio = await circuitoAntropometrico(app, prisma, 'coexisten');
    const suyo = conSesion(app, propio.pro.token);
    const hacerEvaluacion = async (peso: number) => {
      const creada = await suyo
        .post(`/api/v1/advisees/${propio.ase.id}/anthropometry/evaluations`)
        .send({
          occurredAt: AYER,
          measurements: [
            { metric: 'peso', magnitude: { value: peso, unit: 'kg' }, protocolVersionId: propio.protocoloVersionId, origin: 'DIRECT_CAPTURE', occurredAt: AYER },
            { metric: 'talla', magnitude: { value: 1.75, unit: 'm' }, protocolVersionId: propio.protocoloVersionId, origin: 'DIRECT_CAPTURE', occurredAt: AYER },
          ],
        })
        .expect(201);
      const registrada = await suyo
        .post(`/api/v1/anthropometry/evaluations/${creada.body.data.evaluationId}/register`)
        .send({ expectedVersion: creada.body.data.version })
        .expect(200);
      const porMetrica: Record<string, string> = {};
      for (const m of registrada.body.data.measurements as { metric: string; measurementId: string }[]) porMetrica[m.metric] = m.measurementId;
      return porMetrica;
    };
    const ejecutar = async (porMetrica: Record<string, string>) =>
      (
        await suyo
          .post(`/api/v1/advisees/${propio.ase.id}/calculations`)
          .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
          .expect(201)
      ).body.data;

    const a = await ejecutar(await hacerEvaluacion(72.5));
    const b = await ejecutar(await hacerEvaluacion(75));
    expect(a.result.magnitude.value).not.toBe(b.result.magnitude.value);

    const lista = await suyo.get(`/api/v1/advisees/${propio.ase.id}/calculations`).expect(200);
    const ids = (lista.body.data as { calculationRunId: string }[]).map((x) => x.calculationRunId);
    expect(ids).toContain(a.calculationRunId);
    expect(ids).toContain(b.calculationRunId);
    // Ninguna viene marcada, ni hay un resumen que promedie: la lista es lo que hay.
    expect(lista.body.data.every((x: { referenceForPurpose: boolean }) => x.referenceForPurpose === false)).toBe(true);
    expect(Object.keys(lista.body)).toEqual(['data', 'page']);
  });

  it('TEST-CAL-001 (parte 2): publicar una versión nueva no reescribe la corrida ya hecha', async () => {
    // Un método propio de esta prueba, para publicarle una versión nueva sin tocar el catálogo del resto: las
    // versiones son append-only, así que una vez publicada no se puede deshacer (06 §4.4).
    const metodoId = randomUUID();
    const v1 = randomUUID();
    const v2 = randomUUID();
    const contenido = (decimales: number) =>
      `{"finalidades":["SOPORTE_ANTROPOMETRICO"],"entradas":[{"codigo":"PESO","metrica":"peso","unidadesAdmitidas":["kg"],"procedenciasAdmitidas":["CAPTURA_DIRECTA"]},{"codigo":"TALLA","metrica":"talla","unidadesAdmitidas":["m"],"procedenciasAdmitidas":["CAPTURA_DIRECTA"]}],"salida":{"metrica":"indice-demo","unidad":"kg/m2"},"precision":{"decimales":${decimales},"modo":"MEDIO_ARRIBA"},"regla":"demo/peso-sobre-talla-cuadrado@1"}`;
    await prisma.$executeRawUnsafe(`INSERT INTO "especificacion_antropometrica" ("id","clave","tipo") VALUES ('${metodoId}','MET-SUCESION-'||left('${metodoId}',8),'METODO')`);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "version_de_especificacion_antropometrica" ("id","especificacion_id","predecesora_id","version","nombre","contenido","procedencia")
       VALUES ('${v1}','${metodoId}',NULL,'1','Método con sucesión (demostración)','${contenido(3)}','{"rotulo":"Método sintético de demostración."}')`,
    );

    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const corrida = (
      await pro
        .post(`/api/v1/advisees/${c.ase.id}/calculations`)
        .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: v1, inputBindings: bindings(porMetrica) })
        .expect(201)
    ).body.data;
    expect(corrida.result.magnitude.value).toBe(23.673);

    // Se publica la v2, con otra precisión, como haría el catálogo con una revisión metodológica.
    await prisma.$executeRawUnsafe(
      `INSERT INTO "version_de_especificacion_antropometrica" ("id","especificacion_id","predecesora_id","version","nombre","contenido","procedencia")
       VALUES ('${v2}','${metodoId}','${v1}','2','Método con sucesión v2 (demostración)','${contenido(1)}','{"rotulo":"Método sintético de demostración."}')`,
    );

    const despues = await pro.get(`/api/v1/calculations/${corrida.calculationRunId}`).expect(200);
    expect(despues.body.data.methodVersionId).toBe(v1);
    expect(despues.body.data.methodVersion).toBe('1');
    expect(despues.body.data.precision).toEqual({ decimals: 3, rounding: 'HALF_UP' });
    expect(despues.body.data.result).toEqual(corrida.result);

    // La v1 pasó a ser histórica sin desaparecer, y ya no se puede elegir para una corrida nueva.
    const historica = await pro.get(`/api/v1/professional-methods/${metodoId}/versions/${v1}`).expect(200);
    expect(historica.body.data.status).toBe('HISTORICAL_NOT_SELECTABLE');
    expect(historica.body.data.supersededByVersionId).toBe(v2);
    const rechazada = await pro
      .post(`/api/v1/advisees/${c.ase.id}/calculations`)
      .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: v1, inputBindings: bindings(porMetrica) })
      .expect(422);
    expect(rechazada.body.error.code).toBe('METHOD_VERSION_NOT_SELECTABLE');
  });

  it('la corrida de otro profesional sobre el mismo asesorado responde el mismo 404 que una inexistente, y no se lista', async () => {
    // Un segundo profesional con capacidad antropométrica y vínculo activo con el MISMO asesorado: el cálculo no
    // puede ser la puerta trasera que API-ANT-04 cierra (DL-057; 08 §56.5).
    const segundo = await prepararProfesional(app, `cal-vecino-${Date.now()}`, ['ANTROPOMETRIA']);
    await vinculoCompleto(app, segundo, c.ase, 'ANTROPOMETRIA');
    const vecino = conSesion(app, segundo.token);

    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const mia = (
      await pro
        .post(`/api/v1/advisees/${c.ase.id}/calculations`)
        .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
        .expect(201)
    ).body.data;

    const ajena = await vecino.get(`/api/v1/calculations/${mia.calculationRunId}`).expect(404);
    const inexistente = await vecino.get(`/api/v1/calculations/${randomUUID()}`).expect(404);
    expect(ajena.body).toEqual(inexistente.body);

    const lista = await vecino.get(`/api/v1/advisees/${c.ase.id}/calculations`).expect(200);
    expect((lista.body.data as { calculationRunId: string }[]).map((x) => x.calculationRunId)).not.toContain(mia.calculationRunId);

    // Y tampoco la puede adoptar como referencia propia.
    await vecino
      .put(`/api/v1/advisees/${c.ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`)
      .send({ calculationRunId: mia.calculationRunId, expectedVersion: null })
      .expect(404);
  });

  it('09 §3.3 · sin vínculo con el asesorado, ejecutar y adoptar dan el mismo 404 que un asesorado inventado', async () => {
    // Sesión válida, capacidad antropométrica habilitada, y ningún vínculo con esta persona: el PDP decide.
    const extrano = conSesion(app, (await prepararProfesional(app, `cal-extrano-${Date.now()}`, ['ANTROPOMETRIA'])).token);
    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const cuerpo = { purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) };

    const conocido = await extrano.post(`/api/v1/advisees/${c.ase.id}/calculations`).send(cuerpo).expect(404);
    const inventado = await extrano.post(`/api/v1/advisees/${randomUUID()}/calculations`).send(cuerpo).expect(404);
    expect(conocido.body).toEqual(inventado.body);

    await extrano.get(`/api/v1/advisees/${c.ase.id}/calculations`).expect(404);
    await extrano
      .put(`/api/v1/advisees/${c.ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`)
      .send({ calculationRunId: randomUUID(), expectedVersion: null })
      .expect(404);
  });

  it('REG-06-215 · una corrida de un borrador se ve como de preparación y no se puede adoptar como referencia', async () => {
    const borrador = await pro
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`)
      .send({ occurredAt: AYER, measurements: [medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')] })
      .expect(201);
    const porMetrica: Record<string, string> = {};
    for (const m of borrador.body.data.measurements as { metric: string; measurementId: string }[]) porMetrica[m.metric] = m.measurementId;

    const corrida = (
      await pro
        .post(`/api/v1/advisees/${c.ase.id}/calculations`)
        .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
        .expect(201)
    ).body.data;
    expect(corrida.evaluationContext).toBe('IN_PREPARATION');

    const rechazo = await pro
      .put(`/api/v1/advisees/${c.ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`)
      .send({ calculationRunId: corrida.calculationRunId, expectedVersion: null })
      .expect(422);
    expect(rechazo.body.error.code).toBe('CALCULATION_REFERENCE_NOT_COMPATIBLE');
  });

  it('REG-06-220 · una corrida cuya entrada quedó anulada deja de presentarse como vigente, sin borrarse', async () => {
    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const corrida = (
      await pro
        .post(`/api/v1/advisees/${c.ase.id}/calculations`)
        .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
        .expect(201)
    ).body.data;
    expect(corrida.effective).toBe(true);
    expect((corrida.inputProvenance as { condition: string }[]).every((i) => i.condition === 'EFFECTIVE')).toBe(true);

    await pro
      .post(`/api/v1/anthropometry/measurements/${porMetrica.talla}/annulment`, claveDeIdempotencia())
      .send({ reason: 'Se midió con el calzado puesto.' })
      .expect(201);

    const despues = await pro.get(`/api/v1/calculations/${corrida.calculationRunId}`).expect(200);
    expect(despues.body.data.effective).toBe(false);
    expect((despues.body.data.inputProvenance as { metric: string; condition: string }[]).find((i) => i.metric === 'talla')!.condition).toBe('ANNULLED');
    // El resultado histórico no cambió: dejó de ser vigente, no dejó de existir.
    expect(despues.body.data.result).toEqual(corrida.result);
  });
});

describe('API-CAL-04 — adoptar una referencia es una relación (REG-06-207)', () => {
  it('TEST-CAL-006: adoptar, reemplazar y volver a adoptar dejan historia y no tocan las corridas', async () => {
    const propio = await circuitoAntropometrico(app, prisma, 'referencia');
    const suyo = conSesion(app, propio.pro.token);
    const corridaCon = async (peso: number) => {
      const creada = await suyo
        .post(`/api/v1/advisees/${propio.ase.id}/anthropometry/evaluations`)
        .send({
          occurredAt: AYER,
          measurements: [
            { metric: 'peso', magnitude: { value: peso, unit: 'kg' }, protocolVersionId: propio.protocoloVersionId, origin: 'DIRECT_CAPTURE', occurredAt: AYER },
            { metric: 'talla', magnitude: { value: 1.75, unit: 'm' }, protocolVersionId: propio.protocoloVersionId, origin: 'DIRECT_CAPTURE', occurredAt: AYER },
          ],
        })
        .expect(201);
      const registrada = await suyo
        .post(`/api/v1/anthropometry/evaluations/${creada.body.data.evaluationId}/register`)
        .send({ expectedVersion: creada.body.data.version })
        .expect(200);
      const porMetrica: Record<string, string> = {};
      for (const m of registrada.body.data.measurements as { metric: string; measurementId: string }[]) porMetrica[m.metric] = m.measurementId;
      return (
        await suyo
          .post(`/api/v1/advisees/${propio.ase.id}/calculations`)
          .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
          .expect(201)
      ).body.data;
    };
    const a = await corridaCon(72.5);
    const b = await corridaCon(75);
    const ruta = `/api/v1/advisees/${propio.ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`;

    // Primera adopción: no sucede a nada, y no existe adopción automática.
    const primera = await suyo.put(ruta).send({ calculationRunId: a.calculationRunId, expectedVersion: null, rationale: 'Es la que mejor representa la toma.' }).expect(201);
    expect(primera.body.data.supersedesReferenceId).toBeNull();
    expect(primera.body.data.version).toBe('v1');

    // Adoptar la misma otra vez no crea una relación nueva: no hubo cambio que registrar.
    const repetida = await suyo.put(ruta).send({ calculationRunId: a.calculationRunId, expectedVersion: 'v1' }).expect(200);
    expect(repetida.body.data.referenceId).toBe(primera.body.data.referenceId);

    // Con un token desactualizado no se pisa la decisión de otro momento.
    await suyo.put(ruta).send({ calculationRunId: b.calculationRunId, expectedVersion: null }).expect(409);

    // Reemplazo: sucede a la anterior, que se conserva.
    const segunda = await suyo.put(ruta).send({ calculationRunId: b.calculationRunId, expectedVersion: 'v1' }).expect(201);
    expect(segunda.body.data.supersedesReferenceId).toBe(primera.body.data.referenceId);
    expect(segunda.body.data.version).toBe('v2');
    const anterior = await prisma.referenciaDeCalculo.findUnique({ where: { id: primera.body.data.referenceId } });
    expect(anterior).not.toBeNull();

    // Las dos corridas siguen existiendo e intactas; solo cambió cuál está marcada.
    const lista = await suyo.get(`/api/v1/advisees/${propio.ase.id}/calculations`).expect(200);
    const porId = new Map((lista.body.data as { calculationRunId: string; referenceForPurpose: boolean; result: unknown }[]).map((x) => [x.calculationRunId, x]));
    expect(porId.get(a.calculationRunId)!.referenceForPurpose).toBe(false);
    expect(porId.get(b.calculationRunId)!.referenceForPurpose).toBe(true);
    expect(porId.get(a.calculationRunId)!.result).toEqual(a.result);

    // TEST-CAL-007: adoptar no crea objetivo ni prescripción, y no hay ningún campo que lo insinúe.
    expect(Object.keys(segunda.body.data).sort()).toEqual(
      ['adoptedAt', 'adviseeId', 'author', 'calculationRunId', 'purpose', 'rationale', 'referenceId', 'supersedesReferenceId', 'version'].sort(),
    );
  });

  it('una corrida de otro asesorado no se adopta: el mismo 404 que una inexistente', async () => {
    const otro = await circuitoAntropometrico(app, prisma, 'referencia-ajena');
    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const mia = (
      await pro
        .post(`/api/v1/advisees/${c.ase.id}/calculations`)
        .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
        .expect(201)
    ).body.data;
    const ruta = `/api/v1/advisees/${otro.ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`;
    await conSesion(app, otro.pro.token).put(ruta).send({ calculationRunId: mia.calculationRunId, expectedVersion: null }).expect(404);
    await conSesion(app, otro.pro.token).put(ruta).send({ calculationRunId: randomUUID(), expectedVersion: null }).expect(404);
  });
});

describe('REG-06-161 — recálculo con la versión registrada en la corrida', () => {
  it('anular una entrada reemite la corrida con el mismo método y conserva la histórica', async () => {
    const { porMetrica } = await evaluacionRegistrada([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const original = (
      await pro
        .post(`/api/v1/advisees/${c.ase.id}/calculations`)
        .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: bindings(porMetrica) })
        .expect(201)
    ).body.data;

    // Se corrige el peso: la corrida se reemite, relacionada con la anterior, que queda intacta.
    await pro
      .post(`/api/v1/anthropometry/measurements/${porMetrica.peso}/corrections`, claveDeIdempotencia())
      .send({ reason: 'Se leyó mal la balanza.', magnitude: { value: 74, unit: 'kg' } })
      .expect(201);

    const vieja = await pro.get(`/api/v1/calculations/${original.calculationRunId}`).expect(200);
    expect(vieja.body.data.result).toEqual(original.result);

    const lista = await pro.get(`/api/v1/advisees/${c.ase.id}/calculations`).expect(200);
    const sucesora = (lista.body.data as { supersedesRunId: string | null; methodVersionId: string; precision: unknown }[]).find(
      (x) => x.supersedesRunId === original.calculationRunId,
    );
    expect(sucesora).toBeDefined();
    // REG-06-161: se recalcula con la versión registrada en la corrida, no con una más nueva.
    expect(sucesora!.methodVersionId).toBe(original.methodVersionId);
    expect(sucesora!.precision).toEqual(original.precision);

    // Anular la talla deja la corrida sin sucesor posible: no se inventa un cero (REG-06-220 inciso 6).
    const anulada = await pro
      .post(`/api/v1/anthropometry/measurements/${porMetrica.talla}/annulment`, claveDeIdempotencia())
      .send({ reason: 'Se midió con el calzado puesto.' })
      .expect(201);
    expect(anulada.body.data.dependencyImpact.withoutSuccessor.length).toBeGreaterThan(0);
    expect(anulada.body.data.dependencyImpact.recalculated).toEqual([]);
  });
});
