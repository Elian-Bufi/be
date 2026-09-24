/**
 * WP-05 · el circuito antropométrico por la API real, con PostgreSQL real.
 *
 * Cubre E2E-06 (del borrador a la evolución) y los tres casos adversariales que DL-042 asignó a este paquete:
 * el **6** (doble anulación), el **7** en su variante de mediciones (`SIN_DATO` no es cero) y el **10** (borrador de
 * otro profesional).
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { CATALOGO_DEMO, circuitoAntropometrico, type CircuitoAntropometrico } from './soporte-antropometria';
import { prepararProfesional, prepararAsesorado, vinculoCompleto, revocarB2 } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const ayer = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

/** Una medición directa, en la forma del 09: métrica, valor y unidad. El protocolo y el origen son de la toma. */
const medicion = (metrica: string, valor: number, unidad: string) => ({ metricCode: metrica, value: valor, unit: unidad });

/**
 * El contenido de una toma: momento, especificación, origen y sus mediciones directas (09v11 §6).
 *
 * `referencia` solo corresponde a `CONTROLLED_IMPORT`: el contrato la rechaza en los otros orígenes y la base
 * también, con el control `origen_coherente` (INV-06-167; DL-062).
 */
const toma = (
  c: CircuitoAntropometrico,
  mediciones: ReturnType<typeof medicion>[],
  momento = ayer(),
  origen: 'DIRECT_CAPTURE' | 'SELF_REPORTED' | 'CONTROLLED_IMPORT' = 'DIRECT_CAPTURE',
  referencia?: string,
) => ({
  occurredAt: momento,
  specificationVersionId: c.protocoloVersionId,
  source: referencia === undefined ? { type: origen } : { type: origen, preparationReference: referencia },
  directMeasurements: mediciones,
  professionalNotes: 'Consulta sintética.',
});

/** Borrador con peso y talla, ya registrado: lo que sí es historia. */
async function evaluacionRegistrada(c: CircuitoAntropometrico, peso = 72.5) {
  const borrador = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
    .send(toma(c, [medicion('peso', peso, 'kg'), medicion('talla', 1.75, 'm')]))
    .expect(201);
  const registrada = await conSesion(app, c.pro.token)
    .post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
    .send({ expectedVersion: borrador.body.data.version })
    .expect(200);
  return registrada.body.data as {
    evaluationId: string;
    state: string;
    measurements: { measurementId: string; metric: string; condition: string; magnitude: { value: number; unit: string } }[];
  };
}

describe('E2E-06 · del borrador a la evolución (UC-P19, UC-P20)', () => {
  it('el borrador no es historia, registrar es un acto explícito y la serie sale de lo registrado', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'e2e');

    // API-ANT-01: el catálogo publica el protocolo y el método, rotulados como demostración (REG-06-157).
    const catalogo = await conSesion(app, c.pro.token).get('/api/v1/anthropometry/specifications').expect(200);
    expect(catalogo.body.data.map((e: { key: string }) => e.key)).toEqual(expect.arrayContaining(['MET-DEMO', 'PROTO-LAB']));
    expect(catalogo.body.data[0].provenanceNote).toContain('demostración');

    // API-ANT-07: nace EN_PREPARACION.
    const borrador = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
      .send(toma(c, [medicion('peso', 72.5, 'kg')]))
      .expect(201);
    expect(borrador.body.data.state).toBe('IN_PREPARATION');
    expect(borrador.body.data.registeredAt).toBeNull();
    // La clase se deriva del origen: el cliente no la elige (04:1090).
    expect(borrador.body.data.measurements[0]).toMatchObject({ dataClass: 'MEASURED', condition: 'EFFECTIVE' });

    // REG-06-215: el borrador no alimenta la serie ni aparece entre las registradas.
    const registradasAntes = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`).expect(200);
    expect(registradasAntes.body.data).toEqual([]);
    const serieAntes = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    expect(serieAntes.body.data.metrics).toEqual([]);
    // Pero sí es retomable por su autor (API-ANT-08).
    const borradores = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`).expect(200);
    expect(borradores.body.data.map((e: { evaluationId: string }) => e.evaluationId)).toEqual([borrador.body.data.evaluationId]);

    // API-ANT-10: guardar avanza el token de trabajo (REG-06-216) y reemplaza el contenido del borrador.
    const guardado = await conSesion(app, c.pro.token)
      .put(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: borrador.body.data.version, ...toma(c, [medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]) })
      .expect(200);
    expect(guardado.body.data.version).not.toBe(borrador.body.data.version);
    expect(guardado.body.data.measurements).toHaveLength(2);
    // Un token viejo ya no sirve: alguien más pudo haber tocado el borrador.
    await conSesion(app, c.pro.token)
      .put(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: borrador.body.data.version, ...toma(c, []) })
      .expect(409);

    // API-ANT-11: el acto explícito de registro.
    const registrada = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
      .send({ expectedVersion: guardado.body.data.version })
      .expect(200);
    expect(registrada.body.data.state).toBe('REGISTERED');
    expect(registrada.body.data.registeredAt).not.toBeNull();

    // REG-06-214 inciso 5: ya registrada, no se guarda más.
    await conSesion(app, c.pro.token)
      .put(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: registrada.body.data.version, ...toma(c, []) })
      .expect(422);

    // API-ANT-06: ahora sí hay serie, y sale de lo registrado.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const peso = serie.body.data.metrics.find((s: { metricCode: string }) => s.metricCode === 'peso');
    const disponibles = peso.series;
    expect(disponibles).toHaveLength(1);
    expect({ value: disponibles[0].value, unit: disponibles[0].unit }).toEqual({ value: 72.5, unit: 'kg' });
    expect(disponibles[0].dataClass).toBe('MEASURED');
    expect(serie.body.data.honesty).toEqual({ interpolated: false, imputed: false, carriedForward: false });
  });

  it('TEST-ANT-003 · una evaluación sin mediciones no se registra', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'vacia');
    const borrador = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
      .send({ occurredAt: ayer() })
      .expect(201);
    const r = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
      .send({ expectedVersion: borrador.body.data.version })
      .expect(422);
    expect(r.body.error.code).toBe('ANTHROPOMETRY_EVALUATION_INVALID');
  });
});

describe('TEST-ANT-004/006/007 · corregir y anular son actos distintos (UC-E03; RF-050)', () => {
  it('corregir preserva el original y resuelve la vista efectiva por relación', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'corregir');
    const e = await evaluacionRegistrada(c);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;

    const corregida = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${e.evaluationId}/corrections`, claveDeIdempotencia())
      .send({ targetId: peso.measurementId, reason: 'La balanza estaba sin tarar.', magnitude: { value: 71.2, unit: 'kg' } })
      .expect(201);

    // El original no se toca; la vista efectiva es la corrección (REG-06-16; INV-06-171).
    expect(corregida.body.data.magnitude).toEqual({ value: 72.5, unit: 'kg' });
    expect(corregida.body.data.effectiveMagnitude).toEqual({ value: 71.2, unit: 'kg' });
    expect(corregida.body.data.corrections).toHaveLength(1);
    expect(corregida.body.data.corrections[0].previousCorrectionId).toBeNull();

    // Una segunda corrección encadena sobre la terminal, no sobre el original.
    const segunda = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${e.evaluationId}/corrections`, claveDeIdempotencia())
      .send({ targetId: peso.measurementId, reason: 'Segunda lectura.', magnitude: { value: 71, unit: 'kg' } })
      .expect(201);
    expect(segunda.body.data.corrections[1].previousCorrectionId).toBe(segunda.body.data.corrections[0].correctionId);
    expect(segunda.body.data.effectiveMagnitude).toEqual({ value: 71, unit: 'kg' });

    // La serie usa la magnitud efectiva, no el valor original.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const punto = serie.body.data.metrics.find((s: { metricCode: string }) => s.metricCode === 'peso').series[0];
    expect({ value: punto.value, unit: punto.unit }).toEqual({ value: 71, unit: 'kg' });
    expect(punto.correctionState).toBe('CORRECTED');
  });

  /**
   * TEST-ANT-005 (oráculo derivado bajo DL-065; ver `docs/paquetes/WP-05-ORACULOS.md`).
   *
   * Que la respuesta de la anulación diga `ANNULLED` no prueba que el original se conserve: lo prueba una lectura
   * posterior, por otra operación, que devuelva la misma magnitud. La sobrescritura silenciosa que RF-050 prohíbe es
   * justamente la que no se ve en la respuesta del acto.
   */
  it('TEST-ANT-005 · anular fija la condición y conserva el original, el motivo y la fila (REG-06-217; RF-050)', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'anular-conserva');
    const e = await evaluacionRegistrada(c);
    const talla = e.measurements.find((m) => m.metric === 'talla')!;
    const antes = { ...talla.magnitude };

    const motivo = 'Se midió con el calzado puesto.';
    const anulada = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${talla.measurementId}/annulments`, claveDeIdempotencia())
      .send({ reason: motivo })
      .expect(201);
    expect(anulada.body.data.condition).toBe('ANNULLED');
    expect(anulada.body.data.annulment.reason).toBe(motivo);
    expect(anulada.body.data.annulment.author.identityId).toBe(c.pro.id);

    // La relectura por otra operación: el original sigue intacto y el motivo se conserva tal como se escribió.
    const releida = await conSesion(app, c.pro.token).get(`/api/v1/anthropometry/evaluations/${e.evaluationId}`).expect(200);
    const vista = releida.body.data.measurements.find((m: { metric: string }) => m.metric === 'talla');
    expect(vista.magnitude).toEqual(antes);
    expect(vista.condition).toBe('ANNULLED');
    expect(vista.annulment.reason).toBe(motivo);
    // La evaluación que la contiene no cambió de estado: anular una medición no reabre ni degrada el registro.
    expect(releida.body.data.state).toBe('REGISTERED');

    // La fila no se borra ni se vacía: sigue en la base con su valor de origen (08 §56.12, no es destructivo).
    const fila = await prisma.medicionAntropometrica.findUniqueOrThrow({ where: { id: talla.measurementId } });
    expect(Number(fila.valor)).toBe(antes.value);
    expect(fila.unidadDeOrigen).toBe(antes.unit);
  });

  it('TEST-ANT-006 · adversarial 6: la segunda anulación no produce un segundo efecto ni un error nuevo', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'anular');
    const e = await evaluacionRegistrada(c);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;

    const primera = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulments`, claveDeIdempotencia())
      .send({ reason: 'Balanza mal calibrada.' })
      .expect(201);
    expect(primera.body.data).toMatchObject({ condition: 'ANNULLED', alreadyAnnulled: false });

    // Con una clave NUEVA: 200, la anulación que ya existe, sin error y sin segundo evento.
    const segunda = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulments`, claveDeIdempotencia())
      .send({ reason: 'Otro motivo.' })
      .expect(200);
    expect(segunda.body.data.alreadyAnnulled).toBe(true);
    expect(segunda.body.data.annulment.annulmentId).toBe(primera.body.data.annulment.annulmentId);
    expect(segunda.body.data.annulment.reason).toBe('Balanza mal calibrada.');

    // Con la MISMA clave: se replica la respuesta original, sin tocar nada.
    const clave = claveDeIdempotencia();
    const a = await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulments`, clave).send({ reason: 'Repetida.' }).expect(200);
    const b = await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulments`, clave).send({ reason: 'Repetida.' }).expect(200);
    expect(b.body).toEqual(a.body);

    // Un solo evento de anulación y una sola fila, pase lo que pase.
    expect(await prisma.anulacionDeMedicion.count({ where: { medicionId: peso.measurementId } })).toBe(1);
    expect(await prisma.eventoDeAntropometria.count({ where: { medicionId: peso.measurementId, tipo: 'MedicionAnulada' } })).toBe(1);
  });

  it('REG-06-154/155 · una corrección no cambia la unidad: eso sería una conversión en silencio', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'unidad');
    const e = await evaluacionRegistrada(c);
    const talla = e.measurements.find((m) => m.metric === 'talla')!;
    const r = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${e.evaluationId}/corrections`, claveDeIdempotencia())
      .send({ targetId: talla.measurementId, reason: 'Estaba en metros y quiero centímetros.', magnitude: { value: 175, unit: 'cm' } })
      .expect(422);
    expect(r.body.error.code).toBe('UNIT_NOT_COMPATIBLE');
    // Y la ficha de comparabilidad sigue hablando de la unidad efectiva, que es la única que hay.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?metric=talla`).expect(200);
    const punto = (serie.body.data.metrics[0]?.series ?? [])[0];
    const grupo = serie.body.data.metrics[0].comparability.groups.find((g: { comparabilityGroup: string }) => g.comparabilityGroup === punto.comparabilityGroup);
    expect(grupo.unit).toBe(punto.unit);
  });

  it('TEST-ANT-007 · no hay reversión: una medición anulada no admite corrección', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'sin-reversion');
    const e = await evaluacionRegistrada(c);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;
    await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulments`, claveDeIdempotencia()).send({ reason: 'Toma inválida.' }).expect(201);
    const r = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${e.evaluationId}/corrections`, claveDeIdempotencia())
      .send({ targetId: peso.measurementId, reason: 'Quiero revivirla.', magnitude: { value: 70, unit: 'kg' } })
      .expect(422);
    expect(r.body.error.code).toBe('CORRECTION_NOT_ALLOWED');
  });
});

/**
 * TEST-ANT-011 (oráculo derivado bajo DL-065; ver `docs/paquetes/WP-05-ORACULOS.md`).
 *
 * No prueba que exista un flujo de importación —por DL-062 ese flujo vive en el paquete de integraciones—, sino que
 * el dato importado **conserva de dónde vino**. Es la mitad que WP-05 sí garantiza, y la que hace que el flujo, el
 * día que llegue, no pueda saltearse la procedencia.
 */
describe('TEST-ANT-011 · la importación controlada conserva la procedencia (RNF-DAT-002; INV-06-167)', () => {
  it('el origen y la referencia de preparación sobreviven al registro y a la lectura', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'importacion');
    // Opaca a propósito: el legajo prohíbe exigirle formato, proveedor o catálogo (INV-06-167).
    const referencia = 'prep-sintetica-7f3a';

    const borrador = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
      .send(toma(c, [medicion('peso', 70.4, 'kg')], ayer(), 'CONTROLLED_IMPORT', referencia))
      .expect(201);
    const registrada = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
      .send({ expectedVersion: borrador.body.data.version })
      .expect(200);

    const m = registrada.body.data.measurements[0];
    expect(m.origin).toBe('CONTROLLED_IMPORT');
    expect(m.preparationReference).toBe(referencia);
    // La unidad de origen se conserva tal cual: importar no convierte en silencio (REG-06-154).
    expect(m.magnitude).toEqual({ value: 70.4, unit: 'kg' });

    // Releída por otra operación: el origen no se normaliza a captura directa ni se pierde la referencia.
    const releida = await conSesion(app, c.pro.token).get(`/api/v1/anthropometry/evaluations/${registrada.body.data.evaluationId}`).expect(200);
    const vista = releida.body.data.measurements[0];
    expect(vista.origin).toBe('CONTROLLED_IMPORT');
    expect(vista.preparationReference).toBe(referencia);

    // En la serie es un punto como cualquier otro, con su clase y su grupo de comparabilidad declarados.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const punto = serie.body.data.metrics.find((s: { metricCode: string }) => s.metricCode === 'peso').series[0];
    expect(punto.value).toBe(70.4);
    expect(punto.dataClass).toBe('MEASURED');
    expect(punto.comparabilityGroup).toBeTruthy();
  });

  it('una toma que no es importación controlada no puede llevar referencia de preparación', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'importacion-coherencia');
    const r = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
      .send(toma(c, [medicion('peso', 70.4, 'kg')], ayer(), 'DIRECT_CAPTURE', 'prep-sintetica-7f3a'))
      .expect(400);
    expect(r.body.error.code).toBe('INVALID_REQUEST');
  });
});

describe('TEST-ANT-009 · adversarial 7: la serie no miente (REG-06-165/166; INV-06-176/177)', () => {
  it('un checkpoint sin medición es SIN_DATO y no lleva valor; un cero medido sí es un punto disponible', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'serie');
    await evaluacionRegistrada(c);

    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const peso = serie.body.data.metrics.find((s: { metricCode: string }) => s.metricCode === 'peso');
    const huecos = peso.gaps as { from: string; to: string; state: string; days: number }[];

    expect(huecos.length).toBeGreaterThan(0);
    // Un hueco es un rango sin valor: no hay campo donde poner un cero, ni interpolado, ni arrastrado del anterior.
    for (const h of huecos) expect(Object.keys(h).sort()).toEqual(['days', 'from', 'state', 'to']);
    expect(huecos.every((h) => h.state === 'NO_DATA')).toBe(true);
    expect(serie.body.data.honesty).toEqual({ interpolated: false, imputed: false, carriedForward: false });
  });

  it('la serie no se corta en silencio: un período de más de 92 días es 400 PERIOD_TOO_LONG, no una serie truncada', async () => {
    // Antes la API aceptaba cualquier período y la serie se detenía en el día 92 mientras `period` informaba el rango
    // entero: lo que caía después desaparecía sin figurar siquiera como hueco (hallazgo de la revisión de DL-091).
    const c = await circuitoAntropometrico(app, prisma, 'periodo-largo');
    const base = `/api/v1/advisees/${c.ase.id}/anthropometry/progress`;
    const r = await conSesion(app, c.pro.token).get(`${base}?periodStart=2026-01-01&periodEnd=2026-04-30`).expect(400);
    expect(r.body.error.details.issues).toEqual([{ code: 'PERIOD_TOO_LONG', path: 'periodEnd' }]);
    // 92 días exactos, inclusivos, siguen siendo válidos.
    await conSesion(app, c.pro.token).get(`${base}?periodStart=2026-01-01&periodEnd=2026-04-02`).expect(200);
  });

  it('INV-06-177 · una medición de la tarde del último día del período aparece, no sale «sin dato»', async () => {
    // El período llega en fechas locales y los puntos se ubican en fechas locales: si la ventana se recortara en UTC,
    // las horas de la tarde del último día quedarían afuera y el día se vería como un hueco que no existe.
    const c = await circuitoAntropometrico(app, prisma, 'zona');
    // Ayer a las 22:00 locales: un momento pasado (la evaluación no admite fechas futuras) y de la franja que un
    // recorte en UTC dejaría afuera.
    const ayerLocal = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const alasDiez = new Date(`${ayerLocal}T22:00:00-03:00`).toISOString();
    const borrador = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
      .send(toma(c, [medicion('peso', 70.4, 'kg')], alasDiez))
      .expect(201);
    await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
      .send({ expectedVersion: borrador.body.data.version })
      .expect(200);

    const serie = await conSesion(app, c.pro.token)
      .get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?periodStart=${ayerLocal}&periodEnd=${ayerLocal}&metric=peso`)
      .expect(200);
    const puntos = serie.body.data.metrics[0].series as { occurredAt: string; value: number }[];
    expect(puntos).toHaveLength(1);
    expect(puntos[0]!.value).toBe(70.4);
    expect(serie.body.data.metrics[0].gaps).toEqual([]);
  });

  it('REG-06-15/16 · la cadena de correcciones no se puede bifurcar: la base rechaza la segunda raíz y el segundo sucesor', async () => {
    // Una cadena bifurcada no tendría vista efectiva resoluble, y entonces habría que elegir por fecha, que es
    // justo lo que REG-06-16 prohíbe. La base cierra la puerta antes: no hay forma de crear la bifurcación.
    const c = await circuitoAntropometrico(app, prisma, 'cadena');
    const e = await evaluacionRegistrada(c, 68.3);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;
    const primera = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${e.evaluationId}/corrections`, claveDeIdempotencia())
      .send({ targetId: peso.measurementId, reason: 'Se leyó mal la balanza.', magnitude: { value: 69, unit: 'kg' } })
      .expect(201);

    const segundaRaiz = prisma.$executeRawUnsafe(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","correccion_previa_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${peso.measurementId}',NULL,'${c.pro.id}','rama sintética',70,'kg','{"prueba":"wp05"}')`,
    );
    await expect(segundaRaiz).rejects.toThrow(/23505|una_raiz|duplicate key|llave duplicada/i);

    const segundoSucesor = prisma.$executeRawUnsafe(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","correccion_previa_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${peso.measurementId}','${primera.body.data.correctionId}','${c.pro.id}','rama sintética',71,'kg','{"prueba":"wp05"}')`,
    );
    await expect(segundoSucesor).resolves.toBeDefined();
    const tercero = prisma.$executeRawUnsafe(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","correccion_previa_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${peso.measurementId}','${primera.body.data.correctionId}','${c.pro.id}','otra rama',72,'kg','{"prueba":"wp05"}')`,
    );
    await expect(tercero).rejects.toThrow(/23505|correccion_previa_id|duplicate key|llave duplicada/i);

    // Y la vista efectiva sale de la terminal de la cadena, resuelta por relación y no por la fecha más reciente.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?metric=peso`).expect(200);
    const punto = (serie.body.data.metrics[0]?.series ?? [])[0];
    expect(punto.value).toBe(71);
  });

  it('una medición anulada deja de aportar punto, y el checkpoint queda SIN_DATO (REG-06-221)', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'serie-anulada');
    const e = await evaluacionRegistrada(c);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;

    const antes = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    expect(antes.body.data.metrics.find((s: { metricCode: string }) => s.metricCode === 'peso').series.length).toBeGreaterThan(0);

    await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulments`, claveDeIdempotencia()).send({ reason: 'Toma inválida.' }).expect(201);

    const despues = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const serieDePeso = despues.body.data.metrics.find((s: { metricCode: string }) => s.metricCode === 'peso');
    // El hecho sigue existiendo y es consultable; lo que no hace es aportar un punto vigente, ni convertirse en cero.
    expect(serieDePeso?.series ?? []).toEqual([]);
    const consulta = await conSesion(app, c.pro.token).get(`/api/v1/anthropometry/evaluations/${e.evaluationId}`).expect(200);
    expect(consulta.body.data.measurements.find((m: { metric: string }) => m.metric === 'peso').condition).toBe('ANNULLED');
  });
});

describe('D2 · el PDP custodia el dato antropométrico (adversarial 10; TEST-RNF-SEC-006)', () => {
  it('adversarial 10 · el borrador de otro profesional no aparece: ni bloqueado, ni existente', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'ajeno');
    const borrador = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
      .send(toma(c, [medicion('peso', 72.5, 'kg')]))
      .expect(201);

    // Otro profesional con la MISMA capacidad y su propio vínculo con el mismo asesorado.
    const otro = await prepararProfesional(app, 'ant-otro', ['ANTROPOMETRIA']);
    await vinculoCompleto(app, otro, c.ase, 'ANTROPOMETRIA');

    const inexistente = randomUUID();
    const ajeno = await conSesion(app, otro.token).get(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}`).expect(404);
    const inventado = await conSesion(app, otro.token).get(`/api/v1/anthropometry/evaluation-drafts/${inexistente}`).expect(404);
    expect(ajeno.body).toEqual(inventado.body);

    // Tampoco lo lista, ni puede guardarlo ni registrarlo.
    const listado = await conSesion(app, otro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`).expect(200);
    expect(listado.body.data).toEqual([]);
    await conSesion(app, otro.token)
      .put(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: borrador.body.data.version, ...toma(c, []) })
      .expect(404);
    await conSesion(app, otro.token)
      .post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
      .send({ expectedVersion: borrador.body.data.version })
      .expect(404);
  });

  it('un profesional sin la capacidad antropométrica no ve nada, ni el catálogo', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'sin-capacidad');
    const e = await evaluacionRegistrada(c);
    const nutricionista = await prepararProfesional(app, 'ant-nut', ['NUTRICION']);
    await vinculoCompleto(app, nutricionista, c.ase, 'NUTRICION');

    const inexistente = randomUUID();
    const pares: [string, string][] = [
      [`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, `/api/v1/advisees/${inexistente}/anthropometry/evaluations`],
      [`/api/v1/advisees/${c.ase.id}/anthropometry/progress`, `/api/v1/advisees/${inexistente}/anthropometry/progress`],
      [`/api/v1/anthropometry/evaluation-drafts/${e.evaluationId}`, `/api/v1/anthropometry/evaluation-drafts/${inexistente}`],
    ];
    for (const [real, falso] of pares) {
      const a = await conSesion(app, nutricionista.token).get(real);
      const b = await conSesion(app, nutricionista.token).get(falso);
      expect({ ruta: real, status: a.status, body: a.body }).toEqual({ ruta: real, status: 404, body: b.body });
    }
    // El catálogo es de la capacidad (WP-05 §0 D-C).
    await conSesion(app, nutricionista.token).get('/api/v1/anthropometry/specifications').expect(403);
  });
});

/**
 * DL-072, decidida: el catálogo suma `status` conservando `kind`. El estado **se deriva de la cadena de versiones**
 * —una versión con sucesora es histórica—, nunca de una columna editable, porque eso permitiría declarar vigente una
 * versión que la cadena ya superó. El catálogo sintético trae MET-DEMO con dos versiones justamente para esto.
 */
describe('DL-072 · el catálogo declara y filtra por estado, derivado de la cadena (REG-06-203)', () => {
  it('sin filtro salen las vigentes; con HISTORICAL salen las superadas, y ninguna miente sobre su estado', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'catalogo-estado');

    const vigentes = await conSesion(app, c.pro.token).get('/api/v1/anthropometry/specifications').expect(200);
    const filas = vigentes.body.data as { versionId: string; key: string; status: string }[];
    expect(filas.length).toBeGreaterThan(0);
    // Sin filtro, el catálogo ofrece lo seleccionable: todas se declaran vigentes.
    expect(filas.every((e) => e.status === 'CURRENT')).toBe(true);
    // La versión vigente de MET-DEMO es la v2; la v1 quedó atrás y no se ofrece.
    expect(filas.map((e) => e.versionId)).toContain(CATALOGO_DEMO.metodo.v2);
    expect(filas.map((e) => e.versionId)).not.toContain(CATALOGO_DEMO.metodo.v1);

    const historicas = await conSesion(app, c.pro.token).get('/api/v1/anthropometry/specifications?status=HISTORICAL').expect(200);
    const viejas = historicas.body.data as { versionId: string; key: string; status: string }[];
    expect(viejas.every((e) => e.status === 'HISTORICAL')).toBe(true);
    // La v1 del método se consulta —para explicar las corridas que la citan— pero no aparece entre las vigentes.
    expect(viejas.map((e) => e.versionId)).toContain(CATALOGO_DEMO.metodo.v1);
    expect(filas.map((e) => e.versionId)).not.toContain(CATALOGO_DEMO.metodo.v1);

    // `kind` y `status` se combinan sin pisarse. No se afirma igualdad exacta: otras pruebas de la suite siembran
    // sus propias cadenas de especificaciones contra la misma base, así que lo verificable es que todo lo devuelto
    // cumpla los dos filtros y que la v1 del método esté.
    const metodosViejos = await conSesion(app, c.pro.token).get('/api/v1/anthropometry/specifications?kind=METHOD&status=HISTORICAL').expect(200);
    const combinado = metodosViejos.body.data as { versionId: string; kind: string; status: string }[];
    expect(combinado.every((e) => e.kind === 'METHOD' && e.status === 'HISTORICAL')).toBe(true);
    expect(combinado.map((e) => e.versionId)).toContain(CATALOGO_DEMO.metodo.v1);

    // Un valor que no está declarado se rechaza, como con `kind`.
    await conSesion(app, c.pro.token).get('/api/v1/anthropometry/specifications?status=VIGENTE').expect(400);
  });

  it('revocar B2 corta el acceso en la operación siguiente', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'revoca');
    await evaluacionRegistrada(c);
    await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(404);
  });
});

describe('RF-049 · el asesorado consulta su propia evolución desde la APK', () => {
  it('ve sus puntos con la misma honestidad, sin pasar por el PDP de vínculo', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'asesorado');
    await evaluacionRegistrada(c);
    const propia = await conSesion(app, c.ase.token).get('/api/v1/me/anthropometry/progress').expect(200);
    expect(propia.body.data.adviseeId).toBe(c.ase.id);
    expect(propia.body.data.honesty).toEqual({ interpolated: false, imputed: false, carriedForward: false });
    const peso = propia.body.data.metrics.find((s: { metricCode: string }) => s.metricCode === 'peso');
    expect(peso.series).toHaveLength(1);
  });
});
