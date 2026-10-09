/**
 * WP-DASHBOARD-COMPRENSION (encargo del 2026-10-09): las extensiones aditivas de lectura, con datos reales registrados
 * por la API.
 *
 * - API-DSH-03: la última revisión dice si su resultado se aplicó y qué creó; el borrador del plan se informa sin regir;
 *   el objetivo dice desde cuándo rige.
 * - API-DSH-04 con `since`: lo que ocurrió después del corte, lo que se cargó después sobre días anteriores y lo que se
 *   corrigió después se cuentan por separado; la revisión misma no es una novedad; el filtro deja solo lo nuevo.
 * - API-PRJ-01: cada punto dice la versión del plan que ejecutan sus registros; la vigencia dice su instante de corte, y
 *   su número es el orden de activación (no el token de concurrencia).
 * - API-NUT-13-BUSQUEDA y API-TRN-13-BUSQUEDA: la misma lectura que el GET, con el texto en el cuerpo y fuera de todo
 *   registro.
 * - API-DSH-04 (pasada del 2026-10-09): el modo de registro de las cantidades no es una diferencia; la diferencia con la
 *   opción indicada se comprueba ingrediente por ingrediente y tiene su propio rasgo de calidad.
 */
import type { INestApplication } from '@nestjs/common';
import { DashboardResponseSchema, LineaDeTiempoResponseSchema, ListaDeCatalogoResponseSchema, ProyeccionResponseSchema } from '@be/domain';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoConPlanActivo, cuerpoDeRevision } from './soporte-nutricion';

let app: INestApplication;
beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
});

const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000);
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Desde la última revisión: corte por área, novedades y aplicación', () => {
  it('la revisión registrada se informa sin aplicar, y aplicada dice qué creó; el borrador no rige', async () => {
    const c = await circuitoConPlanActivo(app, 'comprension-revision');
    const hoy = (await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    const [almuerzo, cena] = hoy.meals as { mealId: string; options: { optionId: string }[] }[];
    const registrar = (comida: { mealId: string; options: { optionId: string }[] }, ocurrio: Date, status: string) =>
      conSesion(app, c.ase.token)
        .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
        .send({ kind: 'PLAN_OPTION', activePlanId: c.planId, dayTypeId: hoy.dayTypes[0].dayTypeId, mealId: comida.mealId, optionId: comida.options[0]!.optionId, occurredAt: ocurrio.toISOString(), consumption: { status }, observation: null })
        .expect(201);

    // Antes del corte: una comida sin confirmar que después se rectifica, y otra que no se toca.
    const previa = (await registrar(almuerzo!, haceDias(1), 'UNCONFIRMED')).body.data;
    await registrar(cena!, haceDias(1), 'PLAN_PORTIONS');
    await pausa(20);

    // La revisión es el corte. Registrarla no la aplica.
    const evidencia = [{ type: 'PLAN_VERSION', id: c.planId }];
    const revision = (await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'ADJUST')).expect(201)).body.data;
    const panel = async () => DashboardResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/dashboard`).expect(200)).body).data.domains.nutrition;
    const antes = await panel();
    if (!antes.available || !antes.summary) throw new Error('nutrición tenía que estar disponible');
    expect(antes.summary.lastReview).toMatchObject({ reviewId: revision.reviewId, recordedAt: revision.recordedAt, application: null });
    expect(antes.summary.draftPlan).toBeNull();
    expect(Date.parse(antes.summary.objective!.effectiveFrom)).toBeLessThanOrEqual(Date.now());

    // Aplicada: dice cuándo y qué creó, y el borrador sucesor aparece como borrador (no como plan vigente).
    const aplicada = (await conSesion(app, c.pro.token).post(`/api/v1/nutrition/reviews/${revision.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200)).body.data.application;
    const despues = await panel();
    if (!despues.available || !despues.summary) throw new Error('nutrición tenía que estar disponible');
    expect(despues.summary.lastReview?.application).toEqual({ appliedAt: aplicada.appliedAt, createdPlanId: aplicada.createdPlanId, createdObjectiveVersionId: null });
    expect(despues.summary.draftPlan).toMatchObject({ planVersionId: aplicada.createdPlanId, fromReviewId: revision.reviewId });
    expect(despues.summary.activePlan?.planVersionId).toBe(c.planId);

    // Después del corte: una comida de hoy, una de anteayer cargada recién y la rectificación de la previa.
    await pausa(20);
    await registrar(almuerzo!, new Date(), 'PLAN_PORTIONS');
    await registrar(cena!, haceDias(2), 'PLAN_PORTIONS');
    await conSesion(app, c.ase.token).post(`/api/v1/nutrition/meal-records/${previa.recordId}/consumed-quantities`).send({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: previa.version }).expect(201);

    const linea = async (query: string) => LineaDeTiempoResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/timeline${query}`).expect(200)).body).data;
    const desde = encodeURIComponent(revision.recordedAt);
    const conCorte = await linea(`?since=${desde}&limit=50`);
    expect(conCorte.sinceCounts).toEqual({
      since: new Date(revision.recordedAt).toISOString(),
      counts: [
        { kind: 'OCURRIO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 1 },
        { kind: 'INCORPORADO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 1 },
        { kind: 'CORREGIDO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 1 },
      ],
    });
    // El filtro deja solo lo nuevo: las tres comidas; ni la revisión del corte ni la cena previa sin cambios.
    expect(conCorte.totalMatching).toBe(3);
    expect(conCorte.entries.every((e) => e.eventType === 'MEAL_RECORDED')).toBe(true);
    // Los conteos del período no cambian con el corte: son antes de los filtros.
    expect(conCorte.periodCounts).toEqual((await linea('?limit=1')).periodCounts);
    // Sin corte, la extensión no aparece.
    expect((await linea('?limit=1')).sinceCounts).toBeNull();
    // La búsqueda por cuerpo acepta el mismo corte.
    const buscada = LineaDeTiempoResponseSchema.parse(
      (await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/timeline/search`).send({ q: 'almuerzo', since: revision.recordedAt }).expect(200)).body,
    ).data;
    expect(buscada.sinceCounts?.counts.length).toBe(3);
    expect(buscada.totalMatching).toBeGreaterThanOrEqual(1);
  });
});

describe('API-PRJ-01: la versión que ejecuta cada punto y el corte de cada vigencia', () => {
  it('los puntos de nutrición guardan la versión del plan de sus registros; la vigencia abierta no tiene corte', async () => {
    const c = await circuitoConPlanActivo(app, 'comprension-proyeccion');
    const hoy = (await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    const [almuerzo] = hoy.meals as { mealId: string; options: { optionId: string }[] }[];
    await conSesion(app, c.ase.token)
      .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
      .send({ kind: 'PLAN_OPTION', activePlanId: c.planId, dayTypeId: hoy.dayTypes[0].dayTypeId, mealId: almuerzo!.mealId, optionId: almuerzo!.options[0]!.optionId, occurredAt: new Date().toISOString(), consumption: { status: 'PLAN_PORTIONS' }, observation: null })
      .expect(201);
    const r = ProyeccionResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY`).expect(200)).body);
    const res = r.data.result;
    if (res?.kind !== 'NUTRITION_PRESCRIBED_VS_RECORDED') throw new Error('tenía que ser la proyección nutricional');
    expect(res.recorded.points.length).toBeGreaterThan(0);
    for (const p of res.recorded.points) expect(p.planVersionIds).toEqual([c.planId]);
    expect(res.recorded.points.every((p) => p.method === null)).toBe(true);
    expect(res.planVersions).toEqual([expect.objectContaining({ planVersionId: c.planId, to: null, endedAt: null, endReason: null })]);
    // La versión para la persona es el orden de activación, como en la pestaña Plan: la primera activada es la 1, aunque el
    // token de concurrencia de la fila ya avanzó al activarla (09:255-257). La línea de tiempo dice lo mismo.
    expect(res.planVersions[0]?.label).toBe('v1');
    const linea = LineaDeTiempoResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/timeline?domain=NUTRITION&limit=50`).expect(200)).body).data;
    const activacion = linea.entries.find((e) => e.eventType === 'NUTRITION_PLAN_ACTIVATED');
    expect(activacion?.title).toMatch(/activado · versión 1$/);
    expect(activacion?.details).toContainEqual({ label: 'Versión', value: '1' });
  });
});

describe('API-DSH-04: el modo de registro no es una diferencia con lo indicado (pasada del 2026-10-09)', () => {
  it('cantidades a mano iguales a la opción no son «distintas»; la diferencia se comprueba ingrediente por ingrediente y se filtra aparte', async () => {
    const c = await circuitoConPlanActivo(app, 'comprension-modo');
    const hoy = (await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
    type Opcion = { optionId: string; items: { itemId: string; quantity: { value: number; unit: 'g' | 'ml' | 'unit' } | null }[] };
    const [almuerzo, cena] = hoy.meals as { mealId: string; options: Opcion[] }[];
    const opcion = almuerzo!.options[0]!;
    const conCantidad = opcion.items.filter((i) => i.quantity !== null);
    expect(conCantidad.length).toBeGreaterThan(0);
    const registrar = (comida: { mealId: string; options: Opcion[] }, ocurrio: Date, consumption: Record<string, unknown>) =>
      conSesion(app, c.ase.token)
        .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
        .send({ kind: 'PLAN_OPTION', activePlanId: c.planId, dayTypeId: hoy.dayTypes[0].dayTypeId, mealId: comida.mealId, optionId: comida.options[0]!.optionId, occurredAt: ocurrio.toISOString(), consumption, observation: null })
        .expect(201);
    const comoIndicado = conCantidad.map((i) => ({ itemId: i.itemId, quantity: i.quantity, notEaten: false }));
    const masTreinta = comoIndicado.map((i, k) => (k === 0 ? { ...i, quantity: { ...i.quantity!, value: i.quantity!.value + 30 } } : i));
    const igual = (await registrar(almuerzo!, haceDias(3), { status: 'REPORTED', items: comoIndicado })).body.data;
    const distinta = (await registrar(almuerzo!, haceDias(2), { status: 'REPORTED', items: masTreinta })).body.data;
    const sinConfirmar = (await registrar(cena!, haceDias(2), { status: 'UNCONFIRMED' })).body.data;
    const diferente = (
      await conSesion(app, c.ase.token)
        .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
        .send({ kind: 'DIFFERENT', activePlanId: c.planId, dayTypeId: null, mealId: null, occurredAt: haceDias(1).toISOString(), description: 'Un sándwich', approximateQuantity: null, mediaIds: [] })
        .expect(201)
    ).body.data;

    const leer = async (quality?: string) =>
      LineaDeTiempoResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/timeline?domain=NUTRITION&type=MEAL_RECORDED&limit=50${quality ? `&quality=${quality}` : ''}`).expect(200)).body).data;
    const todas = await leer();
    const entrada = (id: string) => todas.entries.find((e) => e.source.id === id);
    const frente = (id: string) => entrada(id)?.details.find((d) => d.label === 'Frente a lo indicado')?.value;
    // A mano e iguales: el modo es «informadas a mano»; la comparación dice que coinciden, y no hay rasgo de diferencia.
    expect(entrada(igual.recordId)?.quality).toContain('QUANTITIES_REPORTED');
    expect(entrada(igual.recordId)?.quality).not.toContain('QUANTITIES_DIFFER_FROM_PLAN');
    expect(entrada(igual.recordId)?.details).toContainEqual({ label: 'Cantidades', value: 'informadas a mano' });
    expect(frente(igual.recordId)).toBe(conCantidad.length === opcion.items.length ? 'Igual a lo indicado' : `Igual en lo que se puede comparar; ${opcion.items.length - conCantidad.length} ${opcion.items.length - conCantidad.length === 1 ? 'ingrediente' : 'ingredientes'} sin comparar`);
    // A mano y distintas: la diferencia está comprobada y se dice cuántos ingredientes.
    expect(entrada(distinta.recordId)?.quality).toEqual(expect.arrayContaining(['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN']));
    expect(frente(distinta.recordId)).toBe(`Distinta de lo indicado en 1 de ${opcion.items.length} ${opcion.items.length === 1 ? 'ingrediente' : 'ingredientes'}`);
    // Sin confirmar y comida diferente: no hay qué comparar, y no se afirma ninguna diferencia.
    for (const id of [sinConfirmar.recordId, diferente.recordId]) {
      expect(entrada(id)?.quality).not.toContain('QUANTITIES_DIFFER_FROM_PLAN');
      expect(frente(id)).toBeUndefined();
    }
    expect(entrada(sinConfirmar.recordId)?.quality).toContain('QUANTITIES_UNCONFIRMED');
    expect(entrada(diferente.recordId)?.quality).toContain('DIFFERENT_MEAL');

    // El filtro por diferencia comprobada deja solo la distinta; el del modo, las dos informadas a mano.
    const distintas = await leer('QUANTITIES_DIFFER_FROM_PLAN');
    expect(distintas.entries.map((e) => e.source.id)).toEqual([distinta.recordId]);
    expect(distintas.totalMatching).toBe(1);
    expect((await leer('QUANTITIES_REPORTED')).entries.map((e) => e.source.id).sort()).toEqual([igual.recordId, distinta.recordId].sort());
    expect(todas.periodCounts.byQuality).toContainEqual({ quality: 'QUANTITIES_DIFFER_FROM_PLAN', count: 1 });
  });
});

describe('Búsqueda en los catálogos con el texto en el cuerpo (DL-130)', () => {
  it('la misma respuesta que el GET legado, y el texto no queda en el registro de requests ni en el log', async () => {
    const c = await circuitoConPlanActivo(app, 'comprension-catalogo');
    const pro = conSesion(app, c.pro.token);
    const porGet = ListaDeCatalogoResponseSchema.parse((await pro.get('/api/v1/nutrition/catalog-items?q=arroz&limit=5').expect(200)).body);
    const porPost = ListaDeCatalogoResponseSchema.parse((await pro.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', limit: 5 }).expect(200)).body);
    expect(porPost).toEqual(porGet);

    const TEXTO = 'Ingrediente con nombre propio';
    const lineas: string[] = [];
    const capturar = (flujo: NodeJS.WriteStream) => {
      const escribir = flujo.write.bind(flujo);
      return jest.spyOn(flujo, 'write').mockImplementation((trozo: string | Uint8Array, ...resto: unknown[]) => {
        lineas.push(String(trozo));
        return escribir(trozo as string, ...(resto as []));
      });
    };
    const espias = [capturar(process.stdout), capturar(process.stderr)];
    try {
      await pro.post('/api/v1/nutrition/catalog-items/search').send({ q: TEXTO }).expect(200);
      await pro.post('/api/v1/training/exercises/search').send({ q: TEXTO });
      await pro.post('/api/v1/nutrition/catalog-items/search').send({ q: TEXTO, campoDeMas: 1 }).expect(400);
    } finally {
      for (const espia of espias) espia.mockRestore();
    }
    const registro = lineas.join('');
    expect(registro).toContain('/nutrition/catalog-items/search"');
    expect(registro).not.toMatch(/nombre propio/i);
    expect(registro).not.toContain('campoDeMas');
  });
});
