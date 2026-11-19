/**
 * WP-NUTRICION-ALIMENTOS (DL-180) por la API real, contra PostgreSQL real:
 * - **NUA-01 · corregir** un alimento cargado a mano emite una versión nueva: el plan activado conserva la que citaba y un
 *   borrador nuevo usa la vigente; va contra la versión que se vio (409) y dos correcciones a la vez se ordenan en la base;
 * - **NUA-02 · retirar** no borra nada: deja de aparecer en el buscador, se lee por su identidad con la marca, un borrador
 *   que lo cita se sigue guardando y validar y activar lo señalan;
 * - **NUA-03 y NUA-D14 · lo propio es propio:** lo cargado a mano lo ve y lo cita solo quien lo cargó («Tuyo»); para los
 *   demás es el mismo 404 que lo inexistente (decisión de Dirección del 2026-11-19);
 * - **NUA-04, NUA-D15 y NUA-D16 · Administración** ve todas las cargas con el nombre de quien las cargó, las agrupa por
 *   nombre parecido con cuántos profesionales cargaron algo así, verifica con una fuente, marca equivalentes y suma al
 *   canon un alimento verificado de todos;
 * - **NUA-05 · el grupo** se elige al cargarlo, se cambia sin emitir una versión y está sembrado en la tabla oficial;
 * - lo ajeno y lo inexistente son el mismo 404, y la base sostiene las guardias aunque el código se equivoque;
 * - **segundo tramo:** las bajas de la revisión adversaria que tocan lo retirado (NUA-D17 y D18) y las medidas caseras
 *   (NUA-08).
 */
import type { INestApplication } from '@nestjs/common';
import {
  AlimentoParaRevisarResponseSchema,
  AlimentoPropioResponseSchema,
  AlimentosConsultadosResponseSchema,
  BusquedaEnCatalogoResponseSchema,
  ElementoDeCatalogoResponseSchema,
  EstimacionDeLasOpcionesResponseSchema,
  ListaDeAlimentosParaRevisarResponseSchema,
  ListaDeAlimentosPropiosResponseSchema,
  ListaDeParecidosResponseSchema,
  AlimentoDelCanonResponseSchema,
  ListaDeVerificadosResponseSchema,
  type ElementoEncontrado,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { adm, administradorListo, type Administrador } from './soporte-administracion';
import { esperarQueEsperen } from './soporte-concurrencia';
import { activar, circuitoListoParaPlanificar, crearBorrador, patchConSesion, type Circuito } from './soporte-nutricion';
import { prepararProfesional, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let admin: Administrador;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
  admin = await administradorListo(app, prisma, `nua-${randomUUID().slice(0, 8)}`);
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const CATALOGO = '/api/v1/nutrition/catalog-items';
const COMPOSICION = { referenceAmount: '100g', energyKcal: 380, proteinG: 75, carbohydrateG: 8, fatG: 5 };
const unico = () => `${Date.now().toString(36)}${++contador}`;
const nutricionista = () => prepararProfesional(app, `nua-${unico()}`, ['NUTRICION']);

async function cargarAMano(pro: Parte, nombre: string, extra: Record<string, unknown> = {}) {
  const r = await conSesion(app, pro.token).post(CATALOGO).send({ name: nombre, itemType: 'FOOD', composition: COMPOSICION, ...extra }).expect(201);
  return ElementoDeCatalogoResponseSchema.parse(r.body).data;
}

async function buscar(pro: Parte, q: string): Promise<ElementoEncontrado[]> {
  const r = await request(app.getHttpServer()).post(`${CATALOGO}/search`).set('Authorization', `Bearer ${pro.token}`).send({ q, limit: 50 }).expect(200);
  return BusquedaEnCatalogoResponseSchema.parse(r.body).data;
}

async function propios(pro: Parte) {
  const r = await conSesion(app, pro.token).get(`${CATALOGO}/mine`).expect(200);
  return ListaDeAlimentosPropiosResponseSchema.parse(r.body).data;
}

function corregir(pro: Parte, id: string, cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) {
  return patchConSesion(app, pro.token, `${CATALOGO}/${id}`).set('Idempotency-Key', clave).send(cuerpo);
}

function retirar(pro: Parte, id: string, version: string, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).post(`${CATALOGO}/${id}/retirement`, clave).send({ expectedVersion: version });
}

async function porIdentidad(pro: Parte, ids: string[]) {
  const r = await request(app.getHttpServer()).post(`${CATALOGO}/lookup`).set('Authorization', `Bearer ${pro.token}`).send({ catalogItemIds: ids }).expect(200);
  return AlimentosConsultadosResponseSchema.parse(r.body).data;
}

/** Un día con una sola opción: el alimento dado, 100 g crudo. */
function estructuraCon(alimentoId: string, otra: string) {
  return {
    dayTypes: [
      {
        label: 'Día habitual',
        meals: [
          {
            label: 'Almuerzo',
            prescriptionMode: 'DISH_OPTIONS',
            options: [
              {
                label: 'Con el alimento',
                items: [
                  { catalogItemId: alimentoId, quantity: { value: 100, unit: 'g' }, preparationState: 'RAW' },
                  { catalogItemId: otra, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED' },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

async function borradorCon(c: Circuito, alimentoId: string, extra: Record<string, unknown> = {}) {
  const r = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`)
    .send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraCon(alimentoId, c.arroz), ...extra })
    .expect(201);
  return { planId: r.body.data.planId as string, version: r.body.data.version as string };
}

async function estimacion(pro: Parte, planId: string) {
  const r = await conSesion(app, pro.token).get(`/api/v1/nutrition/plans/${planId}/option-estimates`).expect(200);
  return EstimacionDeLasOpcionesResponseSchema.parse(r.body).data;
}

const itemDe = (e: Awaited<ReturnType<typeof estimacion>>, id: string) => e.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => o.items))).find((it) => it.catalogItemId === id)!;

// ─── NUA-01 · Corregir ───────────────────────────────────────────────────────────────────────────

describe('NUA-01 · corregir un alimento cargado a mano emite una versión nueva', () => {
  it('el plan activado conserva la versión que citaba; un borrador nuevo usa la corregida', async () => {
    const c = await circuitoListoParaPlanificar(app, `nua1-${unico()}`);
    const creado = await cargarAMano(c.pro, `Proteína en polvo de prueba ${unico()}`);
    const b = await borradorCon(c, creado.catalogItemId);
    await activar(app, c.pro, b.planId, b.version).expect(200);

    const [antes] = (await propios(c.pro)).filter((a) => a.catalogItemId === creado.catalogItemId);
    expect(antes).toMatchObject({ version: 'v1', versionNumber: 1, available: true });
    const r = await corregir(c.pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, energyKcal: 120, proteinG: 25 } }).expect(200);
    const corregido = AlimentoPropioResponseSchema.parse(r.body).data;
    expect(corregido).toMatchObject({ version: 'v2', versionNumber: 2 });
    expect(corregido.versionId).not.toBe(creado.versionId);

    // La instantánea del plan activado sigue con la versión 1 y su composición.
    const activado = itemDe(await estimacion(c.pro, b.planId), creado.catalogItemId);
    expect(activado.catalogItemVersionId).toBe(creado.versionId);
    expect(activado.composition?.energyKcal).toBe(380);
    // Un borrador nuevo (la versión siguiente del plan) usa la vigente.
    const nueva = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: b.planId }).expect(201);
    const enElBorrador = itemDe(await estimacion(c.pro, nueva.body.data.planId), creado.catalogItemId);
    expect(enElBorrador.catalogItemVersionId).toBe(corregido.versionId);
    expect(enElBorrador.composition?.energyKcal).toBe(120);
    // El buscador muestra la vigente.
    expect((await buscar(c.pro, creado.name)).find((e) => e.catalogItemId === creado.catalogItemId)?.composition.energyKcal).toBe(120);
  });

  it('contra la versión que se vio: una vieja es 409; los mismos valores no emiten una versión', async () => {
    const pro = await nutricionista();
    const creado = await cargarAMano(pro, `Galleta de prueba ${unico()}`);
    await corregir(pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, fatG: 9 } }).expect(200);
    const vieja = await corregir(pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, fatG: 10 } }).expect(409);
    expect(vieja.body.error.code).toBe('VERSION_CONFLICT');
    const igual = await corregir(pro, creado.catalogItemId, { expectedVersion: 'v2', name: creado.name, composition: { ...COMPOSICION, fatG: 9 } }).expect(200);
    expect(AlimentoPropioResponseSchema.parse(igual.body).data.versionNumber).toBe(2);
  });

  it('dos correcciones a la vez sobre la misma versión: la base las ordena y la segunda es 409', async () => {
    const pro = await nutricionista();
    const creado = await cargarAMano(pro, `Barrita de prueba ${unico()}`);
    const respuestas: request.Response[] = [];
    let terminados = 0;
    await prisma.$transaction(
      async (tx) => {
        // La prueba retiene el alimento; las dos correcciones tienen que quedar esperándolo.
        await tx.$queryRaw`SELECT 1 FROM "elemento_de_catalogo_nutricional" WHERE "id" = ${creado.catalogItemId}::uuid FOR UPDATE`;
        for (const kcal of [200, 210]) {
          void corregir(pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, energyKcal: kcal } }).then((r) => {
            respuestas.push(r);
            terminados += 1;
          });
        }
        await esperarQueEsperen(prisma, 2, { yaPaso: () => terminados > 0, que: 'las dos correcciones esperando el alimento' });
        expect(terminados).toBe(0);
      },
      { timeout: 40_000, maxWait: 10_000 },
    );
    for (let i = 0; i < 400 && terminados < 2; i++) await new Promise((r) => setTimeout(r, 25));
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 409]);
    const [vigente] = (await propios(pro)).filter((a) => a.catalogItemId === creado.catalogItemId);
    expect(vigente!.versionNumber).toBe(2);
  });

  it('lo ajeno, lo sembrado y lo inexistente son el mismo 404, para corregir y para retirar', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const creado = await cargarAMano(autor, `Snack de prueba ${unico()}`);
    const [usda] = await buscar(otro, 'Arroz blanco de grano largo, cocido');
    const cuerpo = { expectedVersion: 'v1', name: 'Otro nombre', composition: COMPOSICION };
    const ajeno = await corregir(otro, creado.catalogItemId, cuerpo).expect(404);
    const sembrado = await corregir(otro, usda!.catalogItemId, cuerpo).expect(404);
    const inexistente = await corregir(otro, randomUUID(), cuerpo).expect(404);
    expect(ajeno.body.error).toEqual(inexistente.body.error);
    expect(sembrado.body.error).toEqual(inexistente.body.error);
    const retiroAjeno = await retirar(otro, creado.catalogItemId, 'v1').expect(404);
    expect(retiroAjeno.body.error).toEqual(inexistente.body.error);
    // Nada cambió.
    expect((await propios(autor)).find((a) => a.catalogItemId === creado.catalogItemId)).toMatchObject({ versionNumber: 1, available: true });
  });
});

// ─── NUA-02 · Retirar ────────────────────────────────────────────────────────────────────────────

describe('NUA-02 · retirar no borra: lo que lo cita lo sigue mostrando', () => {
  it('sale del buscador, se lee por su identidad con la marca, el borrador se guarda y activar lo señala', async () => {
    const c = await circuitoListoParaPlanificar(app, `nua2-${unico()}`);
    const creado = await cargarAMano(c.pro, `Suplemento de prueba ${unico()}`);
    const b = await borradorCon(c, creado.catalogItemId);
    const r = await retirar(c.pro, creado.catalogItemId, 'v1').expect(200);
    expect(AlimentoPropioResponseSchema.parse(r.body).data).toMatchObject({ available: false, versionNumber: 2 });
    // Retirarlo otra vez no emite nada.
    await retirar(c.pro, creado.catalogItemId, 'v2').expect(200);
    expect((await propios(c.pro)).find((a) => a.catalogItemId === creado.catalogItemId)).toMatchObject({ available: false, versionNumber: 2 });
    // Corregir uno retirado no se puede.
    const corregirlo = await corregir(c.pro, creado.catalogItemId, { expectedVersion: 'v2', name: creado.name, composition: COMPOSICION }).expect(422);
    expect(corregirlo.body.error.code).toBe('INVALID_STATE_TRANSITION');

    expect((await buscar(c.pro, creado.name)).some((e) => e.catalogItemId === creado.catalogItemId)).toBe(false);
    const [leido] = await porIdentidad(c.pro, [creado.catalogItemId]);
    expect(leido).toMatchObject({ catalogItemId: creado.catalogItemId, retired: true, name: creado.name });
    expect(leido!.composition.energyKcal).toBe(380);
    // El borrador que lo cita: la estimación lo muestra con su composición y la marca; se sigue guardando.
    const item = itemDe(await estimacion(c.pro, b.planId), creado.catalogItemId);
    expect(item).toMatchObject({ retired: true });
    expect(item.composition?.energyKcal).toBe(380);
    const plan = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${b.planId}`).expect(200);
    const guardado = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: plan.body.data.version, changes: estructuraCon(creado.catalogItemId, c.arroz) }).expect(200);
    // Validar y activar lo señalan.
    const validado = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: guardado.body.data.version }).expect(200);
    expect(validado.body.data.valid).toBe(false);
    expect((validado.body.data.issues as { code: string }[]).map((i) => i.code)).toContain('CATALOG_REFERENCE_INVALID');
    const activacion = await activar(app, c.pro, b.planId, validado.body.data.version);
    expect(activacion.status).toBe(422);
    // Un plan nuevo con él no se crea.
    const otro = await circuitoListoParaPlanificar(app, `nua2b-${unico()}`, c.pro);
    const nuevo = await conSesion(app, otro.pro.token).post(`/api/v1/advisees/${otro.ase.id}/nutrition/plans`).send({ objectiveVersionId: otro.objectiveVersionId, initialStructure: estructuraCon(creado.catalogItemId, otro.arroz) });
    expect(nuevo.status).toBe(422);
    expect(nuevo.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
  });
});

// ─── NUA-03 y NUA-D14 · Lo propio es propio ──────────────────────────────────────────────────────

describe('NUA-03 y NUA-D14 · lo cargado a mano lo ve y lo cita solo quien lo cargó', () => {
  it('para otro profesional, el mismo 404 que lo inexistente: ni el buscador, ni la consulta por identidad, ni una receta, ni un plan', async () => {
    const autor = await nutricionista();
    const c = await circuitoListoParaPlanificar(app, `nua3-${unico()}`);
    const marca = `Zzpropio${unico()}`;
    const mio = await cargarAMano(autor, `${marca} galleta`);
    // El autor lo ve, como «Tuyo».
    expect((await buscar(autor, marca)).find((f) => f.catalogItemId === mio.catalogItemId)).toMatchObject({ originLevel: 'YOURS', origin: { loadedBy: 'YOU' } });
    // El otro, nada: ni en el buscador ni por su identidad.
    expect((await buscar(c.pro, marca)).some((f) => f.catalogItemId === mio.catalogItemId)).toBe(false);
    expect(await porIdentidad(c.pro, [mio.catalogItemId])).toEqual([]);
    // Ni en una receta ni en un plan: el mismo CATALOG_REFERENCE_INVALID que un identificador que no existe.
    const ajena = await recetaCon(c.pro, mio.catalogItemId, mio.versionId);
    const inexistente = await recetaCon(c.pro, randomUUID(), randomUUID());
    expect(ajena.status).toBe(422);
    expect(ajena.body.error.code).toBe(inexistente.body.error.code);
    const plan = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraCon(mio.catalogItemId, c.arroz) });
    expect(plan.status).toBe(422);
    expect(plan.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
    // Un USDA es «Verificado» para todos.
    const [usda] = await buscar(c.pro, 'Arroz blanco de grano largo, cocido');
    expect(usda!.originLevel).toBe('VERIFIED');
  });

  it('lo que se compartió en el primer tramo ya no se lee: lo cargado a mano no se comparte con nadie', async () => {
    const autor = await nutricionista();
    const creado = await cargarAMano(autor, `Zzhist${unico()} licuado`);
    // La tabla del primer tramo está cerrada: no admite filas nuevas, ni con el código equivocado.
    await expect(
      prisma.$executeRaw`INSERT INTO "alimento_compartido" ("elemento_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, ${JSON.stringify({ fuente: 'PROPIA', casoDeUso: 'PRUEBA' })}::jsonb)`,
    ).rejects.toThrow(/no se comparte/);
    // Corregir no comparte nada, y no hay un campo para compartir.
    const otro = await nutricionista();
    await corregir(autor, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, fatG: 7 } }).expect(200);
    expect(await porIdentidad(otro, [creado.catalogItemId])).toEqual([]);
    const conCampo = await conSesion(app, autor.token).post(CATALOGO).send({ name: `Zzhist${unico()}`, itemType: 'FOOD', composition: COMPOSICION, share: true });
    expect(conCampo.status).toBe(400);
  });
});

// ─── NUA-04, NUA-D15 y NUA-D16 · Administración ──────────────────────────────────────────────────

describe('NUA-04, NUA-D15 y NUA-D16 · Administración ve quién lo cargó, agrupa los parecidos y suma al canon', () => {
  const lista = async (q: string, state?: string) => {
    const r = await adm(app, admin.token).post('/admin/foods/query').send({ q, ...(state ? { state } : {}) }).expect(200);
    return ListaDeAlimentosParaRevisarResponseSchema.parse(r.body).data;
  };
  const decidir = (id: string, cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) => adm(app, admin.token).post(`/admin/foods/${id}/decisions`).set('Idempotency-Key', clave).send(cuerpo);
  const parecidos = async (q: string) => ListaDeParecidosResponseSchema.parse((await adm(app, admin.token).post('/admin/foods/similar/query').send({ q }).expect(200)).body).data;
  const sumarAlCanon = (cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) => adm(app, admin.token).post('/admin/foods/canon').set('Idempotency-Key', clave).send(cuerpo);
  const nombreDe = async (pro: Parte) => (await prisma.perfilProfesional.findUniqueOrThrow({ where: { identidadId: pro.id }, select: { nombreVisible: true } })).nombreVisible;

  it('ve todas las cargas, con el nombre de quien la cargó y nunca su identidad ni sus personas; verificar vale para esa versión', async () => {
    const autor = await nutricionista();
    const creado = await cargarAMano(autor, `Zzcert${unico()} yogur`);
    const [fila] = await lista(creado.name);
    expect(fila).toMatchObject({ catalogItemId: creado.catalogItemId, version: 'v1', review: { state: 'PENDING' }, loadedBy: { displayName: await nombreDe(autor) } });
    expect(JSON.stringify(fila)).not.toContain(autor.id);

    const sinFuente = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY' }).expect(422);
    expect(sinFuente.body.error.details.issues).toEqual([{ code: 'SOURCE_REQUIRED', path: 'source' }]);
    const r = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'Rótulo del envase, lote sintético 1' }).expect(200);
    expect(AlimentoParaRevisarResponseSchema.parse(r.body).data.review).toMatchObject({ state: 'CERTIFIED', certification: { source: 'Rótulo del envase, lote sintético 1' } });
    // Para su autor, «Verificado» con la fuente.
    expect((await buscar(autor, creado.name))[0]).toMatchObject({ originLevel: 'VERIFIED', certification: { source: 'Rótulo del envase, lote sintético 1' } });
    expect((await propios(autor)).find((a) => a.catalogItemId === creado.catalogItemId)?.review.state).toBe('CERTIFIED');
    // Corregido, la versión nueva vuelve a esperar revisión; una decisión sobre la vieja es 409.
    await corregir(autor, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, fatG: 12 } }).expect(200);
    expect((await buscar(autor, creado.name))[0]).toMatchObject({ originLevel: 'YOURS', certification: null });
    expect((await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'Otra' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
  });

  it('un equivalente de la tabla oficial: el buscador de su autor lo sugiere; quitarlo vuelve a «sin revisar»', async () => {
    const autor = await nutricionista();
    const creado = await cargarAMano(autor, `Zzequiv${unico()} arroz cocido casero`);
    const verificados = ListaDeVerificadosResponseSchema.parse((await adm(app, admin.token).post('/admin/foods/verified/query').send({ q: 'arroz blanco de grano largo cocido' }).expect(200)).body).data;
    const oficial = verificados.find((v) => v.name === 'Arroz blanco de grano largo, cocido')!;
    expect(oficial.foodGroup).toBe('GRAINS');
    // Uno que no es verificado no sirve de equivalente.
    const otroManual = await cargarAMano(autor, `Zzequiv${unico()} otro`);
    const noOficial = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'EQUIVALENT', equivalentCatalogItemId: otroManual.catalogItemId }).expect(422);
    expect(noOficial.body.error.details.issues).toEqual([{ code: 'EQUIVALENT_NOT_VERIFIED', path: 'equivalentCatalogItemId' }]);
    const raro = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'EQUIVALENT', equivalentCatalogItemId: 'no-es-un-id' }).expect(422);
    expect(raro.body.error.details.issues).toEqual([{ code: 'EQUIVALENT_NOT_VERIFIED', path: 'equivalentCatalogItemId' }]);

    await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'EQUIVALENT', equivalentCatalogItemId: oficial.catalogItemId }).expect(200);
    const [fila] = (await buscar(autor, creado.name)).filter((e) => e.catalogItemId === creado.catalogItemId);
    expect(fila!.verifiedEquivalent).toMatchObject({ catalogItemId: oficial.catalogItemId, name: oficial.name, foodGroup: 'GRAINS' });
    expect(fila!.originLevel).toBe('YOURS');

    await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CLEAR' }).expect(200);
    expect((await lista(creado.name))[0]!.review.state).toBe('PENDING');
    const otraVez = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CLEAR' }).expect(422);
    expect(otraVez.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('un alimento de la tabla oficial o inexistente es 404; una sesión de profesional no entra a ninguna ruta', async () => {
    const pro = await nutricionista();
    const [usda] = await buscar(pro, 'Arroz blanco de grano largo, cocido');
    const sembrado = await decidir(usda!.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'x' }).expect(404);
    const inexistente = await decidir(randomUUID(), { expectedVersion: 'v1', decision: 'CERTIFY', source: 'x' }).expect(404);
    expect(sembrado.body.error).toEqual(inexistente.body.error);
    await adm(app, pro.token).post('/admin/foods/query').send({}).expect(403);
    await adm(app, pro.token).post('/admin/foods/similar/query').send({}).expect(403);
    await adm(app, pro.token).post('/admin/foods/canon').set('Idempotency-Key', claveDeIdempotencia()).send({ name: 'x', composition: COMPOSICION, source: 'x' }).expect(403);
  });

  it('los parecidos: cuántos profesionales distintos cargaron algo así, sin tildes, mayúsculas ni plurales simples', async () => {
    const marca = `zzmila${unico()}`;
    const [a, b, c] = [await nutricionista(), await nutricionista(), await nutricionista()];
    await cargarAMano(a, `${marca} Milanesas de soja`);
    await cargarAMano(a, `${marca} milanesa de soja`);
    await cargarAMano(b, `${marca}   MILANESA de Soja`);
    await cargarAMano(c, `${marca} milanesa de sója`);
    await cargarAMano(c, `${marca} tarta de acelga`);
    const grupos = await parecidos(marca);
    const mila = grupos.find((g) => g.key === `${marca} milanesa de soja`)!;
    expect(mila).toMatchObject({ professionals: 3 });
    expect(mila.loads).toHaveLength(4);
    expect(mila.names.length).toBeGreaterThanOrEqual(3);
    // Lo más cargado primero; cada carga con quién la cargó.
    expect(grupos[0]!.key).toBe(mila.key);
    expect(grupos.find((g) => g.key === `${marca} tarta de acelga`)).toMatchObject({ professionals: 1 });
    expect(mila.loads.map((l) => l.loadedBy.displayName).sort()).toEqual([await nombreDe(a), await nombreDe(a), await nombreDe(b), await nombreDe(c)].sort());
    const minimo = ListaDeParecidosResponseSchema.parse((await adm(app, admin.token).post('/admin/foods/similar/query').send({ q: marca, minProfessionals: 2 }).expect(200)).body).data;
    expect(minimo.map((g) => g.key)).toEqual([mila.key]);
  });

  it('sumar al canon: un verificado de todos, con su fuente obligatoria; las cargas del grupo quedan como equivalentes', async () => {
    const marca = `zzcanon${unico()}`;
    const [a, b] = [await nutricionista(), await nutricionista()];
    const deA = await cargarAMano(a, `${marca} empanada de carne`);
    const deB = await cargarAMano(b, `${marca} empanadas de carne`, { group: 'MEAT' });
    const cuerpo = { name: `${marca} Empanada de carne`, composition: { ...COMPOSICION, energyKcal: 290, proteinG: 11 }, group: 'GRAINS', fromCatalogItemId: deA.catalogItemId, equivalentCatalogItemIds: [deA.catalogItemId, deB.catalogItemId] };
    // Sin fuente no se suma (ni con una en blanco).
    const sinFuente = await sumarAlCanon(cuerpo).expect(400);
    expect(sinFuente.body.error.code).toBe('INVALID_REQUEST');
    await sumarAlCanon({ ...cuerpo, source: '   ' }).expect(400);
    // Una carga que no existe se señala con su ruta, y no se suma nada.
    const conUnaRara = await sumarAlCanon({ ...cuerpo, source: 'Receta estándar', equivalentCatalogItemIds: [deA.catalogItemId, randomUUID()] }).expect(422);
    expect(conUnaRara.body.error.details.issues).toEqual([{ code: 'LOAD_NOT_AVAILABLE', path: 'equivalentCatalogItemIds[1]' }]);

    const r = await sumarAlCanon({ ...cuerpo, source: 'Receta estándar de la Escuela de Nutrición, edición sintética' }).expect(201);
    const canon = AlimentoDelCanonResponseSchema.parse(r.body).data;
    expect(canon).toMatchObject({ name: cuerpo.name, foodGroup: 'GRAINS', equivalentsMarked: 2 });
    // Lo ve cualquier profesional, «Verificado», con la fuente.
    const otro = await nutricionista();
    expect((await buscar(otro, cuerpo.name)).find((e) => e.catalogItemId === canon.catalogItemId)).toMatchObject({
      originLevel: 'VERIFIED',
      provenance: 'CONTROLLED_IMPORT',
      certification: { source: 'Receta estándar de la Escuela de Nutrición, edición sintética' },
      foodGroup: 'GRAINS',
    });
    // A cada autor, su buscador le sugiere el verificado; lo suyo no cambia.
    const filaDeB = (await buscar(b, deB.name)).find((e) => e.catalogItemId === deB.catalogItemId)!;
    expect(filaDeB.verifiedEquivalent).toMatchObject({ catalogItemId: canon.catalogItemId });
    expect((await propios(b)).find((x) => x.catalogItemId === deB.catalogItemId)).toMatchObject({ versionNumber: 1, review: { state: 'EQUIVALENT' } });
    // Se puede elegir como equivalente y como ingrediente de cualquiera.
    expect(ListaDeVerificadosResponseSchema.parse((await adm(app, admin.token).post('/admin/foods/verified/query').send({ q: cuerpo.name }).expect(200)).body).data.map((v) => v.catalogItemId)).toContain(canon.catalogItemId);
    await recetaCon(otro, canon.catalogItemId, canon.versionId).expect(201);
    // La base: la fila del canon, con la fuente y su origen.
    expect(await prisma.alimentoDelCanon.findUnique({ where: { elementoId: canon.catalogItemId } })).toMatchObject({ origenId: deA.catalogItemId, administradorId: admin.id });
  });

  it('sumar al canon y una decisión a la vez sobre la misma carga: la base las ordena y no se pierde ninguna', async () => {
    const autor = await nutricionista();
    const carga = await cargarAMano(autor, `Zzcarrera${unico()} flan casero`);
    const respuestas: request.Response[] = [];
    let terminados = 0;
    const anotar = (r: request.Response) => {
      respuestas.push(r);
      terminados += 1;
    };
    await prisma.$transaction(
      async (tx) => {
        // La prueba retiene la carga; las dos escrituras de Administración tienen que quedar esperándola.
        await tx.$queryRaw`SELECT 1 FROM "elemento_de_catalogo_nutricional" WHERE "id" = ${carga.catalogItemId}::uuid FOR UPDATE`;
        void sumarAlCanon({ name: `${carga.name} del canon`, composition: COMPOSICION, source: 'Tabla sintética de prueba', equivalentCatalogItemIds: [carga.catalogItemId] }).then(anotar);
        void decidir(carga.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'Rótulo sintético' }).then(anotar);
        await esperarQueEsperen(prisma, 2, { yaPaso: () => terminados > 0, que: 'sumar al canon y la decisión esperando la carga' });
        expect(terminados).toBe(0);
      },
      { timeout: 40_000, maxWait: 10_000 },
    );
    for (let i = 0; i < 400 && terminados < 2; i++) await new Promise((r) => setTimeout(r, 25));
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 201]);
    const revisiones = await prisma.revisionAdministrativaDeAlimento.findMany({ where: { elementoId: carga.catalogItemId }, orderBy: { numero: 'asc' }, select: { numero: true, resultado: true } });
    expect(revisiones.map((r) => r.numero)).toEqual([1, 2]);
    expect(revisiones.map((r) => r.resultado).sort()).toEqual(['CERTIFICADO', 'EQUIVALENTE']);
  });
});

// ─── NUA-05 · El grupo ───────────────────────────────────────────────────────────────────────────

describe('NUA-05 · el grupo de cada alimento', () => {
  it('se elige al cargarlo, se cambia sin emitir una versión y está sembrado en la tabla oficial', async () => {
    const pro = await nutricionista();
    const creado = await cargarAMano(pro, `Zzgrupo${unico()} queso`, { group: 'DAIRY' });
    expect((await buscar(pro, creado.name))[0]!.foodGroup).toBe('DAIRY');
    const r = await corregir(pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: COMPOSICION, group: 'MEAT' }).expect(200);
    expect(AlimentoPropioResponseSchema.parse(r.body).data).toMatchObject({ foodGroup: 'MEAT', versionNumber: 1 });
    expect((await porIdentidad(pro, [creado.catalogItemId]))[0]!.foodGroup).toBe('MEAT');

    // Sembrado: todo alimento de la tabla oficial tiene su grupo.
    const [{ sinGrupo }] = await prisma.$queryRaw<{ sinGrupo: number }[]>`
      SELECT count(DISTINCT v."elemento_id")::int AS "sinGrupo" FROM "version_de_elemento_nutricional" v
       WHERE v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'
         AND NOT EXISTS (SELECT 1 FROM "grupo_de_alimento" g WHERE g."elemento_id" = v."elemento_id")`;
    expect(sinGrupo).toBe(0);
    expect((await buscar(pro, 'Salmón atlántico de cultivo'))[0]!.foodGroup).toBe('FISH');
  });
});

// ─── Apoyo del segundo tramo ─────────────────────────────────────────────────────────────────────

/** Una receta de un solo ingrediente: el alimento dado, en la versión dada. */
function recetaCon(pro: Parte, alimentoId: string, versionId: string) {
  return conSesion(app, pro.token)
    .post('/api/v1/nutrition/recipes')
    .send({
      name: `Receta de prueba ${unico()}`,
      description: null,
      servings: 1,
      steps: [],
      ingredients: [{ catalogItemId: alimentoId, catalogItemVersionId: versionId, quantity: { value: 50, unit: 'g' }, preparationState: 'RAW' }],
    });
}

// ─── Segundo tramo · las bajas de la revisión adversaria que tocan lo retirado (NUA-D17 y D18) ───────

describe('NUA-D17 y D18 · lo retirado: el borrador acepta solo lo que ya citaba; las recetas no lo suman', () => {
  /** Una opción de receta en el día: la entrada trae la versión de la receta y los ítems vacíos (los arma el servidor). */
  function estructuraConReceta(recetaVersionId: string, arroz: string) {
    return {
      dayTypes: [
        {
          label: 'Día habitual',
          meals: [
            {
              label: 'Almuerzo',
              prescriptionMode: 'DISH_OPTIONS',
              options: [
                { label: 'La receta', items: [], recipeVersionId: recetaVersionId },
                { label: 'Arroz', items: [{ catalogItemId: arroz, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED' }] },
              ],
            },
          ],
        },
      ],
    };
  }
  const guardar = (c: Circuito, planId: string, version: string, changes: unknown) => patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${planId}`).send({ expectedVersion: version, changes });
  const validar = (c: Circuito, planId: string, version: string) => conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${planId}/validate`).send({ expectedVersion: version });

  it('un borrador no suma uno retirado que no citaba: el mismo CATALOG_REFERENCE_INVALID que un plan nuevo', async () => {
    const c = await circuitoListoParaPlanificar(app, `nuad17-${unico()}`);
    const creado = await cargarAMano(c.pro, `Zzret${unico()} turrón`);
    const b = await crearBorrador(app, c);
    await retirar(c.pro, creado.catalogItemId, 'v1').expect(200);
    const r = await guardar(c, b.planId, b.version, estructuraCon(creado.catalogItemId, c.arroz));
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
    expect(r.body.error.details.issues).toEqual([{ code: 'CATALOG_REFERENCE_INVALID', path: 'dayTypes[0].meals[0].options[0].items[0].catalogItemId' }]);
  });

  it('una receta no cita ninguna versión de uno retirado, tampoco una vieja; la que ya lo citaba lo lleva a un borrador que validar y activar señalan', async () => {
    const c = await circuitoListoParaPlanificar(app, `nuad18-${unico()}`);
    const creado = await cargarAMano(c.pro, `Zzret${unico()} galleta`);
    const corregido = AlimentoPropioResponseSchema.parse((await corregir(c.pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, fatG: 6 } }).expect(200)).body).data;
    // Una receta que cita la versión vieja, antes del retiro: se guarda.
    const receta = (await recetaCon(c.pro, creado.catalogItemId, creado.versionId).expect(201)).body.data as { recipeId: string; recipeVersionId: string; version: string };
    // La receta en un borrador, antes del retiro.
    const conLaReceta = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`)
      .send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraConReceta(receta.recipeVersionId, c.arroz) })
      .expect(201);
    await retirar(c.pro, creado.catalogItemId, corregido.version).expect(200);

    // Retirado: ninguna versión se cita en una receta nueva, ni la vieja ni la última disponible.
    for (const versionId of [creado.versionId, corregido.versionId]) {
      const nueva = await recetaCon(c.pro, creado.catalogItemId, versionId);
      expect(nueva.status).toBe(422);
      expect(nueva.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
    }
    // El borrador que ya la tenía se guarda; validar y activar señalan el ingrediente retirado de la receta.
    const plan = conLaReceta.body.data as { planId: string; version: string };
    const guardado = await guardar(c, plan.planId, plan.version, estructuraConReceta(receta.recipeVersionId, c.arroz)).expect(200);
    const validado = await validar(c, plan.planId, guardado.body.data.version).expect(200);
    expect(validado.body.data.valid).toBe(false);
    expect(validado.body.data.issues).toContainEqual({ code: 'CATALOG_REFERENCE_INVALID', path: 'dayTypes[0].meals[0].options[0].items[0].catalogItemId' });
    const activacion = await activar(app, c.pro, plan.planId, guardado.body.data.version);
    expect(activacion.status).toBe(422);
    // Un borrador que no la tenía no la suma.
    const otro = await circuitoListoParaPlanificar(app, `nuad18b-${unico()}`, c.pro);
    const b = await crearBorrador(app, otro);
    const sumarla = await guardar(otro, b.planId, b.version, estructuraConReceta(receta.recipeVersionId, otro.arroz));
    expect(sumarla.status).toBe(422);
    expect(sumarla.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
  });
});

// ─── NUA-08 · Las medidas caseras ────────────────────────────────────────────────────────────────

describe('NUA-08 · las medidas caseras: las define quien carga el alimento; el plan las usa y la cuenta sigue en gramos', () => {
  const TAZA = { kind: 'CUP', amount: 240 };
  const UNIDAD = { kind: 'UNIT', amount: 50 };

  it('se cargan, se leen por todos los caminos del autor y se corrigen sin emitir una versión', async () => {
    const pro = await nutricionista();
    const creado = await cargarAMano(pro, `Zzmed${unico()} avena casera`, { householdMeasures: [TAZA, UNIDAD] });
    const propio = (await propios(pro)).find((a) => a.catalogItemId === creado.catalogItemId)!;
    expect(propio.householdMeasures).toEqual(expect.arrayContaining([TAZA, UNIDAD]));
    expect((await buscar(pro, creado.name)).find((e) => e.catalogItemId === creado.catalogItemId)!.householdMeasures).toEqual(expect.arrayContaining([TAZA, UNIDAD]));
    expect((await porIdentidad(pro, [creado.catalogItemId]))[0]!.householdMeasures).toHaveLength(2);
    // Corregir solo las medidas: la misma versión; una lista vacía las quita.
    const r = await corregir(pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: COMPOSICION, householdMeasures: [{ kind: 'CUP', amount: 200 }] }).expect(200);
    expect(AlimentoPropioResponseSchema.parse(r.body).data).toMatchObject({ versionNumber: 1, householdMeasures: [{ kind: 'CUP', amount: 200 }] });
    const sinNada = await corregir(pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: COMPOSICION, householdMeasures: [] }).expect(200);
    expect(AlimentoPropioResponseSchema.parse(sinNada.body).data.householdMeasures).toEqual([]);
    // Dos medidas del mismo tipo no entran.
    await corregir(pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: COMPOSICION, householdMeasures: [TAZA, { kind: 'CUP', amount: 1 }] }).expect(400);
    // La tabla oficial no trae medidas inventadas.
    const [usda] = await buscar(pro, 'Arroz blanco de grano largo, cocido');
    expect(usda!.householdMeasures).toBeUndefined();
  });

  it('el ítem del plan guarda la medida elegida con su equivalencia; la persona recibe solo los gramos', async () => {
    const c = await circuitoListoParaPlanificar(app, `nua8-${unico()}`);
    const creado = await cargarAMano(c.pro, `Zzmed${unico()} arroz casero`, { householdMeasures: [TAZA] });
    const conMedida = (cantidad: number, medida: Record<string, unknown>) => ({
      dayTypes: [
        {
          label: 'Día habitual',
          meals: [
            {
              label: 'Almuerzo',
              prescriptionMode: 'DISH_OPTIONS',
              options: [{ label: 'Con taza', items: [{ catalogItemId: creado.catalogItemId, quantity: { value: cantidad, unit: 'g' }, preparationState: 'COOKED', householdMeasure: medida }] }],
            },
          ],
        },
      ],
    });
    // Una cantidad que no es la de la medida no se guarda.
    const mal = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: conMedida(400, { kind: 'CUP', count: 2, amountPerUnit: 240 }) });
    expect(mal.status).toBe(422);
    expect(mal.body.error.details.issues).toEqual([{ code: 'HOUSEHOLD_MEASURE_INCONSISTENT', path: 'dayTypes[0].meals[0].options[0].items[0].householdMeasure' }]);
    const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: conMedida(360, { kind: 'CUP', count: 1.5, amountPerUnit: 240 }) }).expect(201);
    const plan = r.body.data as { planId: string; version: string; dayTypes: { meals: { options: { items: Record<string, unknown>[] }[] }[] }[] };
    expect(plan.dayTypes[0]!.meals[0]!.options[0]!.items[0]).toMatchObject({ quantity: { value: 360, unit: 'g' }, householdMeasure: { kind: 'CUP', count: 1.5, amountPerUnit: 240 } });
    // La estimación cuenta en gramos: 360 g de 380 kcal cada 100 g.
    const item = itemDe(await estimacion(c.pro, plan.planId), creado.catalogItemId);
    expect(item.quantity).toEqual({ value: 360, unit: 'g' });
    // Su autor cambia la taza después: el plan conserva la que eligió.
    await corregir(c.pro, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: COMPOSICION, householdMeasures: [{ kind: 'CUP', amount: 200 }] }).expect(200);
    await activar(app, c.pro, plan.planId, plan.version).expect(200);
    const leido = await conSesion(app, c.pro.token).get(`/api/v1/nutrition/plans/${plan.planId}`).expect(200);
    expect(leido.body.data.dayTypes[0].meals[0].options[0].items[0]).toMatchObject({ householdMeasure: { kind: 'CUP', count: 1.5, amountPerUnit: 240 } });
    // La persona: los gramos de siempre, sin la medida.
    const hoy = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
    expect(JSON.stringify(hoy.body)).not.toContain('householdMeasure');
    expect(hoy.body.data.activePlan.dayTypes[0].meals[0].options[0].items[0].quantity).toEqual({ value: 360, unit: 'g' });
  });
});

// ─── La base ─────────────────────────────────────────────────────────────────────────────────────

describe('DL-180 · la base sostiene las guardias', () => {
  const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'DL-180' };

  it('el grupo y las medidas los elige solo quien lo cargó; lo compartido está cerrado; el canon lo suma Administración', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const creado = await cargarAMano(autor, `Zzbase${unico()}`);
    await expect(prisma.$executeRaw`INSERT INTO "grupo_de_alimento" ("elemento_id", "numero", "grupo", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, 'CARNES', ${otro.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`).rejects.toThrow(/lo elige quien lo cargó/);
    // Segundo tramo: la tabla de lo compartido está cerrada (NUA-D14).
    await expect(prisma.$executeRaw`INSERT INTO "alimento_compartido" ("elemento_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`).rejects.toThrow(/no se comparte/);
    // NUA-08: las medidas las define solo quien lo cargó, con una forma conocida, y no se cambian ni se borran.
    await expect(
      prisma.$executeRaw`INSERT INTO "medidas_caseras_de_alimento" ("elemento_id", "numero", "medidas", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, '[{"kind":"CUP","amount":240}]'::jsonb, ${otro.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/quien lo cargó/);
    await expect(
      prisma.$executeRaw`INSERT INTO "medidas_caseras_de_alimento" ("elemento_id", "numero", "medidas", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, '[{"kind":"BALDE","amount":240}]'::jsonb, ${autor.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/medidas_caseras_de_alimento_forma/);
    await expect(
      prisma.$executeRaw`INSERT INTO "medidas_caseras_de_alimento" ("elemento_id", "numero", "medidas", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, '[{"kind":"CUP","amount":0}]'::jsonb, ${autor.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/medidas_caseras_de_alimento_forma/);
    // De la revisión adversaria: una equivalencia que no es un número, un tipo que no es un texto, un dato de más o dos
    // medidas del mismo tipo tampoco entran (en jsonpath, comparar tipos distintos da «desconocido» y el CHECK las dejaba).
    for (const medidas of ['[{"kind":"CUP","amount":"240"}]', '[{"kind":["CUP"],"amount":240}]', '[{"kind":"CUP","amount":240,"persona":"Ana"}]', '["CUP"]']) {
      await expect(
        prisma.$executeRaw`INSERT INTO "medidas_caseras_de_alimento" ("elemento_id", "numero", "medidas", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, ${medidas}::jsonb, ${autor.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
      ).rejects.toThrow(/un tipo y una equivalencia en número/);
    }
    await expect(
      prisma.$executeRaw`INSERT INTO "medidas_caseras_de_alimento" ("elemento_id", "numero", "medidas", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, '[{"kind":"CUP","amount":240},{"kind":"CUP","amount":200}]'::jsonb, ${autor.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/una medida casera de cada tipo/);
    await prisma.$executeRaw`INSERT INTO "medidas_caseras_de_alimento" ("elemento_id", "numero", "medidas", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, '[{"kind":"CUP","amount":240}]'::jsonb, ${autor.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`;
    await expect(prisma.$executeRaw`UPDATE "medidas_caseras_de_alimento" SET "medidas" = '[]'::jsonb WHERE "elemento_id" = ${creado.catalogItemId}::uuid`).rejects.toThrow();
    // NUA-D16: el canon lo suma solo un administrador, y solo un alimento de BE (no una carga a mano).
    await expect(
      prisma.$executeRaw`INSERT INTO "alimento_del_canon" ("elemento_id", "fuente", "administrador_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 'x', ${admin.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/no cargas a mano/);
    const deBe = await prisma.elementoDeCatalogoNutricional.create({ data: { procedencia: 'CONTROLLED_IMPORT' } });
    await expect(
      prisma.$executeRaw`INSERT INTO "alimento_del_canon" ("elemento_id", "fuente", "administrador_id", "procedencia") VALUES (${deBe.id}::uuid, 'x', ${otro.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/rol vigente/);
    await expect(
      prisma.$executeRaw`INSERT INTO "alimento_del_canon" ("elemento_id", "fuente", "administrador_id", "procedencia") VALUES (${deBe.id}::uuid, '  ', ${admin.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/alimento_del_canon_fuente/);
    // Una revisión la escribe solo un administrador con su rol vigente.
    await expect(
      prisma.$executeRaw`INSERT INTO "revision_administrativa_de_alimento" ("elemento_id", "numero", "resultado", "version_id", "fuente", "administrador_id", "procedencia")
                         VALUES (${creado.catalogItemId}::uuid, 1, 'CERTIFICADO', ${creado.versionId}::uuid, 'x', ${otro.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/rol vigente/);
    // Certificar sin fuente no entra ni con el administrador.
    await expect(
      prisma.$executeRaw`INSERT INTO "revision_administrativa_de_alimento" ("elemento_id", "numero", "resultado", "version_id", "administrador_id", "procedencia")
                         VALUES (${creado.catalogItemId}::uuid, 1, 'CERTIFICADO', ${creado.versionId}::uuid, ${admin.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow();
  });
});
