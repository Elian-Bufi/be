/**
 * WP-NUTRICION-ALIMENTOS (DL-180) por la API real, contra PostgreSQL real:
 * - **NUA-01 · corregir** un alimento cargado a mano emite una versión nueva: el plan activado conserva la que citaba y un
 *   borrador nuevo usa la vigente; va contra la versión que se vio (409) y dos correcciones a la vez se ordenan en la base;
 * - **NUA-02 · retirar** no borra nada: deja de aparecer en el buscador, se lee por su identidad con la marca, un borrador
 *   que lo cita se sigue guardando y validar y activar lo señalan;
 * - **NUA-03 · los tres niveles:** lo de otro profesional se ve como «De otro profesional», va después y no dice de quién
 *   es; lo cargado antes de DL-180 no se comparte hasta que su autor lo corrige;
 * - **NUA-04 · Administración** verifica con una fuente (para la versión que vio) o marca un equivalente de la tabla
 *   oficial, que el buscador sugiere; ve el nombre y los valores, nunca quién lo cargó;
 * - **NUA-05 · el grupo** se elige al cargarlo, se cambia sin emitir una versión y está sembrado en la tabla oficial;
 * - lo ajeno y lo inexistente son el mismo 404, y la base sostiene las guardias aunque el código se equivoque.
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
  ListaDeVerificadosResponseSchema,
  type ElementoEncontrado,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { adm, administradorListo, type Administrador } from './soporte-administracion';
import { esperarQueEsperen } from './soporte-concurrencia';
import { activar, circuitoListoParaPlanificar, patchConSesion, type Circuito } from './soporte-nutricion';
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
    expect(antes).toMatchObject({ version: 'v1', versionNumber: 1, available: true, shared: true });
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

// ─── NUA-03 · Los tres niveles ───────────────────────────────────────────────────────────────────

describe('NUA-03 · lo de otro profesional se ve como «De otro profesional» y va después', () => {
  it('el propio va antes que el ajeno, aunque el ajeno sea más nuevo; el ajeno no dice de quién es', async () => {
    const yo = await nutricionista();
    const otro = await nutricionista();
    const marca = `Zzpru${unico()}`;
    const mio = await cargarAMano(yo, `${marca} galleta propia`);
    const ajeno = await cargarAMano(otro, `${marca} galleta ajena`);
    // Solo estos dos: el buscador puede completar la página con parecidos de otras pruebas (los nombres comparten la fecha).
    const filas = (await buscar(yo, marca)).filter((f) => f.catalogItemId === mio.catalogItemId || f.catalogItemId === ajeno.catalogItemId);
    expect(filas.map((f) => f.catalogItemId)).toEqual([mio.catalogItemId, ajeno.catalogItemId]);
    expect(filas[0]).toMatchObject({ originLevel: 'YOURS', origin: { loadedBy: 'YOU' } });
    expect(filas[1]).toMatchObject({ originLevel: 'OTHER_PROFESSIONAL', origin: { loadedBy: 'ANOTHER_PROFESSIONAL' } });
    expect(JSON.stringify(filas[1])).not.toContain(otro.id);
    // Un USDA es «Verificado».
    const [usda] = await buscar(yo, 'Arroz blanco de grano largo, cocido');
    expect(usda!.originLevel).toBe('VERIFIED');
  });

  it('lo cargado antes de DL-180 no se comparte hasta que su autor lo corrige', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const nombre = `Zzviejo${unico()} licuado`;
    // Como lo dejaba la carga a mano de antes: el elemento y su versión, sin la fila de compartido.
    const elemento = await prisma.elementoDeCatalogoNutricional.create({ data: { procedencia: 'PROFESSIONAL_MANUAL', creadoPorId: autor.id } });
    await prisma.versionDeElementoNutricional.create({
      data: { elementoId: elemento.id, nombre, composicion: COMPOSICION, disponibilidad: 'DISPONIBLE', procedencia: { fuente: 'PROPIA', carga: 'MANUAL', casoDeUso: 'PRUEBA' } },
    });
    expect((await buscar(otro, nombre)).some((e) => e.catalogItemId === elemento.id)).toBe(false);
    expect(await porIdentidad(otro, [elemento.id])).toEqual([]);
    expect((await buscar(autor, nombre)).some((e) => e.catalogItemId === elemento.id)).toBe(true);
    expect((await propios(autor)).find((a) => a.catalogItemId === elemento.id)).toMatchObject({ shared: false });
    // Guardar la corrección sin cambiar nada no es corregir: responde la misma versión («no cambió») y sigue sin
    // compartirse, como le dice «Mis alimentos» («Por ahora lo ves solo vos»).
    const sinCambios = await corregir(autor, elemento.id, { expectedVersion: 'v1', name: nombre, composition: COMPOSICION }).expect(200);
    expect(AlimentoPropioResponseSchema.parse(sinCambios.body).data).toMatchObject({ versionNumber: 1, shared: false });
    expect((await buscar(otro, nombre)).some((e) => e.catalogItemId === elemento.id)).toBe(false);
    expect(await porIdentidad(otro, [elemento.id])).toEqual([]);
    await corregir(autor, elemento.id, { expectedVersion: 'v1', name: nombre, composition: { ...COMPOSICION, fatG: 7 } }).expect(200);
    expect((await buscar(otro, nombre)).find((e) => e.catalogItemId === elemento.id)).toMatchObject({ originLevel: 'OTHER_PROFESSIONAL' });
  });
});

// ─── NUA-04 · Administración ─────────────────────────────────────────────────────────────────────

describe('NUA-04 · Administración verifica con una fuente o marca un equivalente', () => {
  const lista = async (q: string, state?: string) => {
    const r = await adm(app, admin.token).post('/admin/foods/query').send({ q, ...(state ? { state } : {}) }).expect(200);
    return ListaDeAlimentosParaRevisarResponseSchema.parse(r.body).data;
  };
  const decidir = (id: string, cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) => adm(app, admin.token).post(`/admin/foods/${id}/decisions`).set('Idempotency-Key', clave).send(cuerpo);

  it('ve el nombre y los valores, nunca quién lo cargó; verificarlo vale para esa versión', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const creado = await cargarAMano(autor, `Zzcert${unico()} yogur`);
    const [fila] = await lista(creado.name);
    expect(fila).toMatchObject({ catalogItemId: creado.catalogItemId, version: 'v1', review: { state: 'PENDING' } });
    expect(JSON.stringify(fila)).not.toContain(autor.id);

    const sinFuente = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY' }).expect(422);
    expect(sinFuente.body.error.details.issues).toEqual([{ code: 'SOURCE_REQUIRED', path: 'source' }]);
    const r = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'Rótulo del envase, lote sintético 1' }).expect(200);
    expect(AlimentoParaRevisarResponseSchema.parse(r.body).data.review).toMatchObject({ state: 'CERTIFIED', certification: { source: 'Rótulo del envase, lote sintético 1' } });
    expect((await buscar(otro, creado.name))[0]).toMatchObject({ originLevel: 'VERIFIED', certification: { source: 'Rótulo del envase, lote sintético 1' } });
    expect((await propios(autor)).find((a) => a.catalogItemId === creado.catalogItemId)?.review.state).toBe('CERTIFIED');

    // Corregido, la versión nueva vuelve a esperar revisión; una decisión sobre la vieja es 409.
    await corregir(autor, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, fatG: 12 } }).expect(200);
    expect((await buscar(otro, creado.name))[0]).toMatchObject({ originLevel: 'OTHER_PROFESSIONAL', certification: null });
    expect((await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'Otra' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
  });

  it('un equivalente de la tabla oficial: el buscador lo sugiere; quitarlo vuelve a «sin revisar»', async () => {
    const autor = await nutricionista();
    const creado = await cargarAMano(autor, `Zzequiv${unico()} arroz cocido casero`);
    const verificados = ListaDeVerificadosResponseSchema.parse((await adm(app, admin.token).post('/admin/foods/verified/query').send({ q: 'arroz blanco de grano largo cocido' }).expect(200)).body).data;
    const oficial = verificados.find((v) => v.name === 'Arroz blanco de grano largo, cocido')!;
    expect(oficial.foodGroup).toBe('GRAINS');

    // Uno que no es de la tabla oficial no sirve de equivalente.
    const otroManual = await cargarAMano(autor, `Zzequiv${unico()} otro`);
    const noOficial = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'EQUIVALENT', equivalentCatalogItemId: otroManual.catalogItemId }).expect(422);
    expect(noOficial.body.error.details.issues).toEqual([{ code: 'EQUIVALENT_NOT_VERIFIED', path: 'equivalentCatalogItemId' }]);

    await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'EQUIVALENT', equivalentCatalogItemId: oficial.catalogItemId }).expect(200);
    const [fila] = (await buscar(autor, creado.name)).filter((e) => e.catalogItemId === creado.catalogItemId);
    expect(fila!.verifiedEquivalent).toMatchObject({ catalogItemId: oficial.catalogItemId, name: oficial.name, foodGroup: 'GRAINS' });
    expect(fila!.originLevel).toBe('YOURS');

    await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CLEAR' }).expect(200);
    expect((await lista(creado.name))[0]!.review.state).toBe('PENDING');
    const otraVez = await decidir(creado.catalogItemId, { expectedVersion: 'v1', decision: 'CLEAR' }).expect(422);
    expect(otraVez.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('un alimento de la tabla oficial o inexistente es 404; una sesión de profesional no entra', async () => {
    const pro = await nutricionista();
    const [usda] = await buscar(pro, 'Arroz blanco de grano largo, cocido');
    const sembrado = await decidir(usda!.catalogItemId, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'x' }).expect(404);
    const inexistente = await decidir(randomUUID(), { expectedVersion: 'v1', decision: 'CERTIFY', source: 'x' }).expect(404);
    expect(sembrado.body.error).toEqual(inexistente.body.error);
    await adm(app, pro.token).post('/admin/foods/query').send({}).expect(403);
  });

  it('lo que su autor no compartió no lo ve ni lo decide Administración: el mismo 404 que lo inexistente', async () => {
    const autor = await nutricionista();
    const nombre = `Zzsolo${unico()} licuado`;
    // Como lo dejaba la carga a mano de antes de DL-180: sin la fila de compartido. «Mis alimentos» le dice a su autor
    // «Por ahora lo ves solo vos».
    const elemento = await prisma.elementoDeCatalogoNutricional.create({ data: { procedencia: 'PROFESSIONAL_MANUAL', creadoPorId: autor.id } });
    const version = await prisma.versionDeElementoNutricional.create({
      data: { elementoId: elemento.id, nombre, composicion: COMPOSICION, disponibilidad: 'DISPONIBLE', procedencia: { fuente: 'PROPIA', carga: 'MANUAL', casoDeUso: 'PRUEBA' } },
    });
    expect(await lista(nombre)).toEqual([]);
    const noCompartido = await decidir(elemento.id, { expectedVersion: 'v1', decision: 'CERTIFY', source: 'Rótulo sintético' }).expect(404);
    const inexistente = await decidir(randomUUID(), { expectedVersion: 'v1', decision: 'CERTIFY', source: 'Rótulo sintético' }).expect(404);
    expect(noCompartido.body.error).toEqual(inexistente.body.error);
    // La base tampoco lo deja, ni con el administrador.
    await expect(
      prisma.$executeRaw`INSERT INTO "revision_administrativa_de_alimento" ("elemento_id", "numero", "resultado", "version_id", "fuente", "administrador_id", "procedencia")
                         VALUES (${elemento.id}::uuid, 1, 'CERTIFICADO', ${version.id}::uuid, 'x', ${admin.id}::uuid, ${JSON.stringify({ fuente: 'PROPIA', casoDeUso: 'PRUEBA' })}::jsonb)`,
    ).rejects.toThrow(/compartió/);

    // Un equivalente que no es un identificador válido es el mismo 422 que uno que no es verificado, no un error de la base.
    const compartido = await cargarAMano(autor, `Zzsolo${unico()} otro`);
    const raro = await decidir(compartido.catalogItemId, { expectedVersion: 'v1', decision: 'EQUIVALENT', equivalentCatalogItemId: 'no-es-un-id' }).expect(422);
    expect(raro.body.error.details.issues).toEqual([{ code: 'EQUIVALENT_NOT_VERIFIED', path: 'equivalentCatalogItemId' }]);

    // Cuando su autor lo corrige (y así lo comparte, NUA-D13), entra en la revisión.
    await corregir(autor, elemento.id, { expectedVersion: 'v1', name: nombre, composition: { ...COMPOSICION, fatG: 7 } }).expect(200);
    expect((await lista(nombre)).map((f) => f.catalogItemId)).toEqual([elemento.id]);
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

// ─── La base ─────────────────────────────────────────────────────────────────────────────────────

describe('DL-180 · la base sostiene las guardias', () => {
  const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'DL-180' };

  it('el grupo lo elige solo quien lo cargó; lo compartido y las revisiones no se cambian ni se borran', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const creado = await cargarAMano(autor, `Zzbase${unico()}`);
    await expect(prisma.$executeRaw`INSERT INTO "grupo_de_alimento" ("elemento_id", "numero", "grupo", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, 'CARNES', ${otro.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`).rejects.toThrow(/lo elige quien lo cargó/);
    await expect(prisma.$executeRaw`UPDATE "alimento_compartido" SET "procedencia" = '{}'::jsonb WHERE "elemento_id" = ${creado.catalogItemId}::uuid`).rejects.toThrow();
    await expect(prisma.$executeRaw`DELETE FROM "alimento_compartido" WHERE "elemento_id" = ${creado.catalogItemId}::uuid`).rejects.toThrow();
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
