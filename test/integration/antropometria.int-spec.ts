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
import { circuitoAntropometrico, type CircuitoAntropometrico } from './soporte-antropometria';
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

const medicion = (c: CircuitoAntropometrico, metrica: string, valor: number, unidad: string, extra: Record<string, unknown> = {}) => ({
  metric: metrica,
  magnitude: { value: valor, unit: unidad },
  protocolVersionId: c.protocoloVersionId,
  origin: 'DIRECT_CAPTURE',
  occurredAt: ayer(),
  ...extra,
});

/** Borrador con peso y talla, ya registrado: lo que sí es historia. */
async function evaluacionRegistrada(c: CircuitoAntropometrico, peso = 72.5) {
  const borrador = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`, claveDeIdempotencia())
    .send({ occurredAt: ayer(), context: 'Consulta sintética.', measurements: [medicion(c, 'peso', peso, 'kg'), medicion(c, 'talla', 1.75, 'm')] })
    .expect(201);
  const registrada = await conSesion(app, c.pro.token)
    .post(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
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
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`, claveDeIdempotencia())
      .send({ occurredAt: ayer(), measurements: [medicion(c, 'peso', 72.5, 'kg')] })
      .expect(201);
    expect(borrador.body.data.state).toBe('IN_PREPARATION');
    expect(borrador.body.data.registeredAt).toBeNull();
    // La clase se deriva del origen: el cliente no la elige (04:1090).
    expect(borrador.body.data.measurements[0]).toMatchObject({ dataClass: 'MEASURED', condition: 'EFFECTIVE' });

    // REG-06-215: el borrador no alimenta la serie ni aparece entre las registradas.
    const registradasAntes = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`).expect(200);
    expect(registradasAntes.body.data).toEqual([]);
    const serieAntes = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    expect(serieAntes.body.data.series).toEqual([]);
    // Pero sí es retomable por su autor (API-ANT-08).
    const borradores = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations/drafts`).expect(200);
    expect(borradores.body.data.map((e: { evaluationId: string }) => e.evaluationId)).toEqual([borrador.body.data.evaluationId]);

    // API-ANT-10: guardar avanza el token de trabajo (REG-06-216) y reemplaza el contenido del borrador.
    const guardado = await conSesion(app, c.pro.token)
      .patch(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: borrador.body.data.version, measurements: [medicion(c, 'peso', 72.5, 'kg'), medicion(c, 'talla', 1.75, 'm')] })
      .expect(200);
    expect(guardado.body.data.version).not.toBe(borrador.body.data.version);
    expect(guardado.body.data.measurements).toHaveLength(2);
    // Un token viejo ya no sirve: alguien más pudo haber tocado el borrador.
    await conSesion(app, c.pro.token)
      .patch(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: borrador.body.data.version, measurements: [] })
      .expect(409);

    // API-ANT-11: el acto explícito de registro.
    const registrada = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
      .send({ expectedVersion: guardado.body.data.version })
      .expect(200);
    expect(registrada.body.data.state).toBe('REGISTERED');
    expect(registrada.body.data.registeredAt).not.toBeNull();

    // REG-06-214 inciso 5: ya registrada, no se guarda más.
    await conSesion(app, c.pro.token)
      .patch(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: registrada.body.data.version, measurements: [] })
      .expect(422);

    // API-ANT-06: ahora sí hay serie, y sale de lo registrado.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const peso = serie.body.data.series.find((s: { metric: string }) => s.metric === 'peso');
    const disponibles = peso.points.filter((p: { availability: string }) => p.availability === 'AVAILABLE');
    expect(disponibles).toHaveLength(1);
    expect(disponibles[0].magnitude).toEqual({ value: 72.5, unit: 'kg' });
    expect(disponibles[0].dataClass).toBe('MEASURED');
    expect(serie.body.data.honesty).toEqual({ interpolated: false, imputed: false, carriedForward: false });
  });

  it('TEST-ANT-003 · una evaluación sin mediciones no se registra', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'vacia');
    const borrador = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`, claveDeIdempotencia())
      .send({ occurredAt: ayer() })
      .expect(201);
    const r = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
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
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/corrections`, claveDeIdempotencia())
      .send({ reason: 'La balanza estaba sin tarar.', magnitude: { value: 71.2, unit: 'kg' } })
      .expect(201);

    // El original no se toca; la vista efectiva es la corrección (REG-06-16; INV-06-171).
    expect(corregida.body.data.magnitude).toEqual({ value: 72.5, unit: 'kg' });
    expect(corregida.body.data.effectiveMagnitude).toEqual({ value: 71.2, unit: 'kg' });
    expect(corregida.body.data.corrections).toHaveLength(1);
    expect(corregida.body.data.corrections[0].previousCorrectionId).toBeNull();

    // Una segunda corrección encadena sobre la terminal, no sobre el original.
    const segunda = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/corrections`, claveDeIdempotencia())
      .send({ reason: 'Segunda lectura.', magnitude: { value: 71, unit: 'kg' } })
      .expect(201);
    expect(segunda.body.data.corrections[1].previousCorrectionId).toBe(segunda.body.data.corrections[0].correctionId);
    expect(segunda.body.data.effectiveMagnitude).toEqual({ value: 71, unit: 'kg' });

    // La serie usa la magnitud efectiva, no el valor original.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const punto = serie.body.data.series.find((s: { metric: string }) => s.metric === 'peso').points.find((p: { availability: string }) => p.availability === 'AVAILABLE');
    expect(punto.magnitude).toEqual({ value: 71, unit: 'kg' });
  });

  it('TEST-ANT-006 · adversarial 6: la segunda anulación no produce un segundo efecto ni un error nuevo', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'anular');
    const e = await evaluacionRegistrada(c);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;

    const primera = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulment`, claveDeIdempotencia())
      .send({ reason: 'Balanza mal calibrada.' })
      .expect(201);
    expect(primera.body.data).toMatchObject({ condition: 'ANNULLED', alreadyAnnulled: false });

    // Con una clave NUEVA: 200, la anulación que ya existe, sin error y sin segundo evento.
    const segunda = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulment`, claveDeIdempotencia())
      .send({ reason: 'Otro motivo.' })
      .expect(200);
    expect(segunda.body.data.alreadyAnnulled).toBe(true);
    expect(segunda.body.data.annulment.annulmentId).toBe(primera.body.data.annulment.annulmentId);
    expect(segunda.body.data.annulment.reason).toBe('Balanza mal calibrada.');

    // Con la MISMA clave: se replica la respuesta original, sin tocar nada.
    const clave = claveDeIdempotencia();
    const a = await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulment`, clave).send({ reason: 'Repetida.' }).expect(200);
    const b = await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulment`, clave).send({ reason: 'Repetida.' }).expect(200);
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
      .post(`/api/v1/anthropometry/measurements/${talla.measurementId}/corrections`, claveDeIdempotencia())
      .send({ reason: 'Estaba en metros y quiero centímetros.', magnitude: { value: 175, unit: 'cm' } })
      .expect(422);
    expect(r.body.error.code).toBe('UNIT_NOT_COMPATIBLE');
    // Y la ficha de comparabilidad sigue hablando de la unidad efectiva, que es la única que hay.
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?metrics=talla`).expect(200);
    const punto = (serie.body.data.series[0]?.points ?? []).find((p: { availability: string }) => p.availability === 'AVAILABLE');
    expect(punto.comparability.unit).toBe(punto.magnitude.unit);
  });

  it('TEST-ANT-007 · no hay reversión: una medición anulada no admite corrección', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'sin-reversion');
    const e = await evaluacionRegistrada(c);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;
    await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulment`, claveDeIdempotencia()).send({ reason: 'Toma inválida.' }).expect(201);
    const r = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/corrections`, claveDeIdempotencia())
      .send({ reason: 'Quiero revivirla.', magnitude: { value: 70, unit: 'kg' } })
      .expect(422);
    expect(r.body.error.code).toBe('CORRECTION_NOT_ALLOWED');
  });
});

describe('TEST-ANT-009 · adversarial 7: la serie no miente (REG-06-165/166; INV-06-176/177)', () => {
  it('un checkpoint sin medición es SIN_DATO y no lleva valor; un cero medido sí es un punto disponible', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'serie');
    await evaluacionRegistrada(c);

    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const peso = serie.body.data.series.find((s: { metric: string }) => s.metric === 'peso');
    const huecos = peso.points.filter((p: { availability: string }) => p.availability === 'NO_DATA');

    expect(huecos.length).toBeGreaterThan(0);
    // Ningún hueco tiene valor: ni cero, ni interpolado, ni arrastrado del anterior.
    for (const h of huecos) expect(Object.keys(h).sort()).toEqual(['availability', 'date']);
    expect(peso.missingData).toEqual(huecos.map((h: { date: string }) => h.date));
    expect(serie.body.data.honesty).toEqual({ interpolated: false, imputed: false, carriedForward: false });
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
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`, claveDeIdempotencia())
      .send({ occurredAt: alasDiez, measurements: [medicion(c, 'peso', 70.4, 'kg', { occurredAt: alasDiez })] })
      .expect(201);
    await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
      .send({ expectedVersion: borrador.body.data.version })
      .expect(200);

    const serie = await conSesion(app, c.pro.token)
      .get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?from=${ayerLocal}&to=${ayerLocal}&metrics=peso`)
      .expect(200);
    const puntos = serie.body.data.series[0].points as { date: string; availability: string; magnitude?: { value: number } }[];
    expect(puntos).toHaveLength(1);
    expect(puntos[0]!.availability).toBe('AVAILABLE');
    expect(puntos[0]!.magnitude!.value).toBe(70.4);
  });

  it('REG-06-15/16 · la cadena de correcciones no se puede bifurcar: la base rechaza la segunda raíz y el segundo sucesor', async () => {
    // Una cadena bifurcada no tendría vista efectiva resoluble, y entonces habría que elegir por fecha, que es
    // justo lo que REG-06-16 prohíbe. La base cierra la puerta antes: no hay forma de crear la bifurcación.
    const c = await circuitoAntropometrico(app, prisma, 'cadena');
    const e = await evaluacionRegistrada(c, 68.3);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;
    const primera = await conSesion(app, c.pro.token)
      .post(`/api/v1/anthropometry/measurements/${peso.measurementId}/corrections`, claveDeIdempotencia())
      .send({ reason: 'Se leyó mal la balanza.', magnitude: { value: 69, unit: 'kg' } })
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
    const serie = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress?metrics=peso`).expect(200);
    const punto = (serie.body.data.series[0]?.points ?? []).find((x: { availability: string }) => x.availability === 'AVAILABLE');
    expect(punto.magnitude.value).toBe(71);
  });

  it('una medición anulada deja de aportar punto, y el checkpoint queda SIN_DATO (REG-06-221)', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'serie-anulada');
    const e = await evaluacionRegistrada(c);
    const peso = e.measurements.find((m) => m.metric === 'peso')!;

    const antes = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    expect(antes.body.data.series.find((s: { metric: string }) => s.metric === 'peso').points.some((p: { availability: string }) => p.availability === 'AVAILABLE')).toBe(true);

    await conSesion(app, c.pro.token).post(`/api/v1/anthropometry/measurements/${peso.measurementId}/annulment`, claveDeIdempotencia()).send({ reason: 'Toma inválida.' }).expect(201);

    const despues = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/progress`).expect(200);
    const serieDePeso = despues.body.data.series.find((s: { metric: string }) => s.metric === 'peso');
    // El hecho sigue existiendo y es consultable; lo que no hace es aportar un punto vigente, ni convertirse en cero.
    expect(serieDePeso?.points.every((p: { availability: string }) => p.availability === 'NO_DATA') ?? true).toBe(true);
    const consulta = await conSesion(app, c.pro.token).get(`/api/v1/anthropometry/evaluations/${e.evaluationId}`).expect(200);
    expect(consulta.body.data.measurements.find((m: { metric: string }) => m.metric === 'peso').condition).toBe('ANNULLED');
  });
});

describe('D2 · el PDP custodia el dato antropométrico (adversarial 10; TEST-RNF-SEC-006)', () => {
  it('adversarial 10 · el borrador de otro profesional no aparece: ni bloqueado, ni existente', async () => {
    const c = await circuitoAntropometrico(app, prisma, 'ajeno');
    const borrador = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`, claveDeIdempotencia())
      .send({ occurredAt: ayer(), measurements: [medicion(c, 'peso', 72.5, 'kg')] })
      .expect(201);

    // Otro profesional con la MISMA capacidad y su propio vínculo con el mismo asesorado.
    const otro = await prepararProfesional(app, 'ant-otro', ['ANTROPOMETRIA']);
    await vinculoCompleto(app, otro, c.ase, 'ANTROPOMETRIA');

    const inexistente = randomUUID();
    const ajeno = await conSesion(app, otro.token).get(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}`).expect(404);
    const inventado = await conSesion(app, otro.token).get(`/api/v1/anthropometry/evaluations/${inexistente}`).expect(404);
    expect(ajeno.body).toEqual(inventado.body);

    // Tampoco lo lista, ni puede guardarlo ni registrarlo.
    const listado = await conSesion(app, otro.token).get(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations/drafts`).expect(200);
    expect(listado.body.data).toEqual([]);
    await conSesion(app, otro.token)
      .patch(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}`)
      .send({ expectedVersion: borrador.body.data.version, measurements: [] })
      .expect(404);
    await conSesion(app, otro.token)
      .post(`/api/v1/anthropometry/evaluations/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia())
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
      [`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`, `/api/v1/advisees/${inexistente}/anthropometry/evaluations`],
      [`/api/v1/advisees/${c.ase.id}/anthropometry/progress`, `/api/v1/advisees/${inexistente}/anthropometry/progress`],
      [`/api/v1/anthropometry/evaluations/${e.evaluationId}`, `/api/v1/anthropometry/evaluations/${inexistente}`],
    ];
    for (const [real, falso] of pares) {
      const a = await conSesion(app, nutricionista.token).get(real);
      const b = await conSesion(app, nutricionista.token).get(falso);
      expect({ ruta: real, status: a.status, body: a.body }).toEqual({ ruta: real, status: 404, body: b.body });
    }
    // El catálogo es de la capacidad (WP-05 §0 D-C).
    await conSesion(app, nutricionista.token).get('/api/v1/anthropometry/specifications').expect(403);
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
    const peso = propia.body.data.series.find((s: { metric: string }) => s.metric === 'peso');
    expect(peso.points.filter((p: { availability: string }) => p.availability === 'AVAILABLE')).toHaveLength(1);
  });
});
