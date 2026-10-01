/**
 * Evolución antropométrica visual (website profesional; RF-049) · la lectura real de API-ANT-06 pasada por la misma
 * preparación que usan el gráfico, el detalle y la tabla (`prepararSerie`, en @be/domain), contra PostgreSQL y por los
 * flujos reales. La API no cambia: estas pruebas fijan lo que la presentación necesita que se conserve.
 * - la API publica **una observación vigente por día y métrica** (checkpoint diario, 09v11 §11; REG-06-166): con dos
 *   evaluaciones el mismo día, llega una, y la pantalla no inventa la otra. La presentación identifica cada punto por
 *   `sourceId`, así que si el contrato publicara varias por día se verían las dos (probado en las unitarias);
 * - una corrección vigente se marca, y el original no reaparece como punto;
 * - una medición anulada y un borrador en preparación no aparecen por ninguna transformación;
 * - una toma en otra unidad cae en otro grupo, con su propio eje, y no se compara;
 * - los huecos siguen siendo huecos en la tabla;
 * - con evaluaciones de otro profesional, `partialView` es verdadero y esas observaciones no llegan.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { diferenciaDescriptiva, EvolucionResponseSchema, grupoVigente, observacionesDelGrupo, observacionPorId, prepararSerie, resumenDeObservacion, type EvolucionResponse } from '@be/domain';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoAntropometrico, type CircuitoAntropometrico } from './soporte-antropometria';
import { prepararProfesional, vinculoCompleto } from './soporte-vinculo';

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

const haceDias = (n: number, hora = 12) => {
  const d = new Date(Date.now() - n * 86_400_000);
  d.setUTCHours(hora, 0, 0, 0);
  return d.toISOString();
};
const medicion = (metricCode: string, value: number, unit: string) => ({ metricCode, value, unit });

async function registrada(c: CircuitoAntropometrico, occurredAt: string, mediciones: ReturnType<typeof medicion>[], pro = c.pro) {
  const borrador = await conSesion(app, pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
    .send({ occurredAt, specificationVersionId: c.protocoloVersionId, source: { type: 'DIRECT_CAPTURE' }, directMeasurements: mediciones, professionalNotes: 'Consulta sintética.' })
    .expect(201);
  const r = await conSesion(app, pro.token).post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia()).send({ expectedVersion: borrador.body.data.version }).expect(200);
  return r.body.data as { evaluationId: string; measurements: { measurementId: string; metric: string }[] };
}

async function evolucion(c: CircuitoAntropometrico, dias = 30): Promise<EvolucionResponse['data']> {
  const desde = haceDias(dias).slice(0, 10);
  const hasta = new Date().toISOString().slice(0, 10);
  const r = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?periodStart=${desde}&periodEnd=${hasta}`).expect(200);
  // La vista valida con el esquema estricto: si la API devolviera otra forma, el gráfico no se dibuja.
  return EvolucionResponseSchema.parse(r.body).data;
}

describe('Evolución antropométrica visual · la presentación conserva lo que la API garantiza', () => {
  it('con dos evaluaciones el mismo día la API publica una por día; la corrección vigente se marca y el original no reaparece', async () => {
    const c = await circuitoAntropometrico(app, prisma, `evo-${++contador}`);
    const manana = await registrada(c, haceDias(3, 11), [medicion('peso', 72.5, 'kg')]);
    await registrada(c, haceDias(3, 19), [medicion('peso', 73.1, 'kg')]);
    await registrada(c, haceDias(10, 12), [medicion('peso', 74, 'kg')]);
    const peso = manana.measurements.find((m) => m.metric === 'peso')!;
    await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${manana.evaluationId}/corrections`, claveDeIdempotencia())
      .send({ targetId: peso.measurementId, reason: 'La balanza estaba sin tarar.', magnitude: { value: 72.2, unit: 'kg' } })
      .expect(201);

    const datos = await evolucion(c);
    const serie = prepararSerie(datos.metrics.find((m) => m.metricCode === 'peso')!, datos.period.timeZone);
    // Checkpoint diario: el día con dos evaluaciones aporta una observación; el otro día, la suya.
    expect(serie.observaciones).toHaveLength(2);
    expect(serie.observaciones.every((o) => o.delDia.total === 1)).toBe(true);
    expect(new Set(serie.observaciones.map((o) => o.punto.sourceId)).size).toBe(2);
    // El sourceId de la corregida sigue siendo el de la medición original: rige el valor corregido, sin un punto extra.
    const corregida = observacionPorId(serie, peso.measurementId)!;
    expect(resumenDeObservacion(corregida)).toBe('72,2 kg · Medido · Corregida');
    expect(serie.observaciones.some((o) => o.punto.value === 72.5)).toBe(false);
    // Un solo grupo: la diferencia descriptiva entre la más vieja y la corregida existe y es una resta.
    const vieja = serie.observaciones[0]!;
    expect(diferenciaDescriptiva(vieja, corregida)).toEqual({ delta: -1.8, unidad: 'kg', dias: 7 });
  });

  it('una medición anulada y un borrador en preparación no aparecen; los huecos siguen siendo huecos', async () => {
    const c = await circuitoAntropometrico(app, prisma, `evo-${++contador}`);
    const e = await registrada(c, haceDias(5), [medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
    const talla = e.measurements.find((m) => m.metric === 'talla')!;
    await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${talla.measurementId}/annulments`, claveDeIdempotencia()).send({ reason: 'Toma inválida.' }).expect(201);
    // Un borrador con peso, sin registrar: no es historia (REG-06-215).
    await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
      .send({ occurredAt: haceDias(1), specificationVersionId: c.protocoloVersionId, source: { type: 'DIRECT_CAPTURE' }, directMeasurements: [medicion('peso', 60, 'kg')], professionalNotes: null })
      .expect(201);

    const datos = await evolucion(c, 8);
    // La API lista la métrica de la medición anulada, con la serie vacía: la anulada no aporta punto (REG-06-221).
    expect(datos.metrics.map((m) => m.metricCode)).toEqual(['peso', 'talla']);
    const serieTalla = prepararSerie(datos.metrics.find((m) => m.metricCode === 'talla')!, datos.period.timeZone);
    expect(serieTalla.observaciones).toEqual([]);
    expect(serieTalla.filas.every((f) => f.tipo === 'hueco')).toBe(true);
    const serie = prepararSerie(datos.metrics.find((m) => m.metricCode === 'peso')!, datos.period.timeZone);
    expect(serie.observaciones.map((o) => o.punto.value)).toEqual([72.5]);
    // Huecos antes y después de la única observación, ordenados con ella en la tabla.
    const tipos = serie.filas.map((f) => f.tipo);
    expect(tipos).toEqual(['hueco', 'observacion', 'hueco']);
    const dias = serie.filas.filter((f) => f.tipo === 'hueco').reduce((n, f) => n + (f.tipo === 'hueco' ? f.hueco.days : 0), 0);
    expect(dias).toBe(8);
  });

  it('otra unidad es otro grupo, con su propio eje: el grupo vigente es el de la observación más reciente y no se compara con el otro', async () => {
    const c = await circuitoAntropometrico(app, prisma, `evo-${++contador}`);
    await registrada(c, haceDias(9), [medicion('peso', 72.5, 'kg')]);
    await registrada(c, haceDias(2), [medicion('peso', 160, 'lb')]);
    const datos = await evolucion(c);
    const serie = prepararSerie(datos.metrics.find((m) => m.metricCode === 'peso')!, datos.period.timeZone);
    expect(serie.variosGrupos).toBe(true);
    expect(serie.grupos.map((g) => g.unit).sort()).toEqual(['kg', 'lb']);
    const vigente = grupoVigente(serie, null)!;
    expect(observacionesDelGrupo(serie, vigente).map((o) => o.punto.unit)).toEqual(['lb']);
    const [enKg, enLb] = serie.observaciones;
    expect(enLb!.punto.incomparableWithPrevious).toContain('UNIT');
    expect(diferenciaDescriptiva(enKg!, enLb!)).toBeNull();
    // Un grupo que ya no existe cae al vigente: nunca queda un filtro obsoleto.
    expect(grupoVigente(serie, 'cmp-inexistente')).toBe(vigente);
  });

  it('con evaluaciones de otro profesional, la vista es parcial y esas observaciones no llegan', async () => {
    const c = await circuitoAntropometrico(app, prisma, `evo-${++contador}`);
    await registrada(c, haceDias(6), [medicion('peso', 72.5, 'kg')]);
    const otro = await prepararProfesional(app, `evo-otro-${contador}`, ['ANTROPOMETRIA']);
    await vinculoCompleto(app, otro, c.ase, 'ANTROPOMETRIA');
    await registrada(c, haceDias(4), [medicion('peso', 99, 'kg')], otro);
    const datos = await evolucion(c);
    expect(datos.partialView).toBe(true);
    const serie = prepararSerie(datos.metrics.find((m) => m.metricCode === 'peso')!, datos.period.timeZone);
    expect(serie.observaciones.map((o) => o.punto.value)).toEqual([72.5]);
    // Y la evaluación de origen del punto es de este profesional: abrirla no cruza a la del otro.
    expect(serie.observaciones[0]!.punto.sourceEvaluationId).toBeTruthy();
    await conSesion(app, c.pro.token).get(`/api/v1/anthropometry/evaluations/${serie.observaciones[0]!.punto.sourceEvaluationId}`).expect(200);
  });
});
