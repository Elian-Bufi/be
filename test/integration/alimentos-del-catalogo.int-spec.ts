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
 * - lo ajeno y lo inexistente son el mismo 404, y la base sostiene las guardias aunque el código se equivoque;
 * - **segundo tramo (NUA-D14 a D17): compartir con control.** Compartir es un interruptor al cargar y una elección aparte
 *   al corregir; dejar de compartir es un hecho nuevo que lo saca de todos los caminos de los demás (el mismo 404 que lo
 *   inexistente) mientras lo que ya lo cita lo conserva; las versiones de antes de compartir no se citan; una cita y un
 *   «dejar de compartir» simultáneos se ordenan en la base. Y las bajas de la revisión adversaria que tocan lo retirado.
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
import { esperarQueEsperen, pidDeLaTransaccion } from './soporte-concurrencia';
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

function compartir(pro: Parte, id: string, compartido: boolean, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).post(`${CATALOGO}/${id}/sharing`, clave).send({ shared: compartido });
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
    // compartirse, como le dice «Mis alimentos» («Lo ves solo vos»).
    const sinCambios = await corregir(autor, elemento.id, { expectedVersion: 'v1', name: nombre, composition: COMPOSICION }).expect(200);
    expect(AlimentoPropioResponseSchema.parse(sinCambios.body).data).toMatchObject({ versionNumber: 1, shared: false });
    expect((await buscar(otro, nombre)).some((e) => e.catalogItemId === elemento.id)).toBe(false);
    expect(await porIdentidad(otro, [elemento.id])).toEqual([]);
    // NUA-D14 (segundo tramo): una corrección de verdad tampoco lo comparte sola; compartir es una elección aparte.
    await corregir(autor, elemento.id, { expectedVersion: 'v1', name: nombre, composition: { ...COMPOSICION, fatG: 7 } }).expect(200);
    expect((await propios(autor)).find((a) => a.catalogItemId === elemento.id)).toMatchObject({ versionNumber: 2, shared: false, stoppedSharing: false });
    expect((await buscar(otro, nombre)).some((e) => e.catalogItemId === elemento.id)).toBe(false);
    await corregir(autor, elemento.id, { expectedVersion: 'v2', name: nombre, composition: { ...COMPOSICION, fatG: 7 }, share: true }).expect(200);
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

    // Cuando su autor lo comparte (NUA-D14: con el interruptor, al corregirlo), entra en la revisión.
    await corregir(autor, elemento.id, { expectedVersion: 'v1', name: nombre, composition: { ...COMPOSICION, fatG: 7 }, share: true }).expect(200);
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

// ─── Segundo tramo · compartir con control (NUA-D14 a D16) ───────────────────────────────────────

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

describe('NUA-D14 a D16 · compartir con control', () => {
  const lista = async (q: string) => ListaDeAlimentosParaRevisarResponseSchema.parse((await adm(app, admin.token).post('/admin/foods/query').send({ q }).expect(200)).body).data;
  const decidir = (id: string) => adm(app, admin.token).post(`/admin/foods/${id}/decisions`).set('Idempotency-Key', claveDeIdempotencia()).send({ expectedVersion: 'v1', decision: 'CERTIFY', source: 'Rótulo sintético' });
  type Borrador = { version: string; dayTypes: { meals: { options: { items: { catalogItemId: string; name: string }[] }[] }[] }[] };
  const leerBorrador = async (pro: Parte, planId: string) => (await conSesion(app, pro.token).get(`/api/v1/nutrition/plans/${planId}`).expect(200)).body.data as Borrador;
  const nombreEn = (b: Borrador, id: string) => b.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => o.items))).find((it) => it.catalogItemId === id)?.name;

  it('cargado con el interruptor apagado no se comparte; compartirlo y dejar de compartirlo son hechos nuevos', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const creado = await cargarAMano(autor, `Zzpriv${unico()} licuado`, { share: false });
    expect((await propios(autor)).find((a) => a.catalogItemId === creado.catalogItemId)).toMatchObject({ shared: false, stoppedSharing: false });
    expect((await buscar(otro, creado.name)).some((e) => e.catalogItemId === creado.catalogItemId)).toBe(false);
    expect(await porIdentidad(otro, [creado.catalogItemId])).toEqual([]);
    expect(await lista(creado.name)).toEqual([]);

    const r = await compartir(autor, creado.catalogItemId, true).expect(200);
    expect(AlimentoPropioResponseSchema.parse(r.body).data).toMatchObject({ shared: true, stoppedSharing: false, versionNumber: 1 });
    // Compartirlo otra vez no agrega nada.
    await compartir(autor, creado.catalogItemId, true).expect(200);
    expect((await buscar(otro, creado.name)).find((e) => e.catalogItemId === creado.catalogItemId)).toMatchObject({ originLevel: 'OTHER_PROFESSIONAL' });
    expect((await lista(creado.name)).map((a) => a.catalogItemId)).toEqual([creado.catalogItemId]);

    const dejado = await compartir(autor, creado.catalogItemId, false).expect(200);
    expect(AlimentoPropioResponseSchema.parse(dejado.body).data).toMatchObject({ shared: false, stoppedSharing: true });
    const cambios = await prisma.cambioDeAlimentoCompartido.findMany({ where: { elementoId: creado.catalogItemId }, orderBy: { numero: 'asc' } });
    expect(cambios.map((c) => [c.numero, c.compartido])).toEqual([
      [1, true],
      [2, false],
    ]);
    expect(cambios.every((c) => c.versionId === creado.versionId && c.autorId === autor.id)).toBe(true);
  });

  it('dejado de compartir: el mismo 404 que lo inexistente para los demás, y lo que ya lo cita lo conserva', async () => {
    const autor = await nutricionista();
    const c = await circuitoListoParaPlanificar(app, `nuac-${unico()}`);
    const nombre = `Zzdejar${unico()} batido`;
    const creado = await cargarAMano(autor, nombre);
    // El otro profesional lo usa: un plan activado y, después, el borrador que sigue.
    const b = await borradorCon(c, creado.catalogItemId);
    await activar(app, c.pro, b.planId, b.version).expect(200);
    const sucesora = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: b.planId }).expect(201);
    const borradorId = sucesora.body.data.planId as string;

    await compartir(autor, creado.catalogItemId, false).expect(200);
    // El buscador, la consulta por identidad y Administración: como si no existiera.
    expect((await buscar(c.pro, nombre)).some((e) => e.catalogItemId === creado.catalogItemId)).toBe(false);
    expect(await porIdentidad(c.pro, [creado.catalogItemId])).toEqual([]);
    expect(await lista(nombre)).toEqual([]);
    const dejado = await decidir(creado.catalogItemId).expect(404);
    const inexistente = await decidir(randomUUID()).expect(404);
    expect(dejado.body.error).toEqual(inexistente.body.error);
    // Una receta nueva del otro no lo cita.
    const receta = await recetaCon(c.pro, creado.catalogItemId, creado.versionId);
    expect(receta.status).toBe(422);
    expect(receta.body.error.code).toBe('CATALOG_REFERENCE_INVALID');

    // El plan activado lo conserva, con su versión.
    expect(itemDe(await estimacion(c.pro, b.planId), creado.catalogItemId)).toMatchObject({ catalogItemVersionId: creado.versionId });
    // Su autor lo corrige para él solo: el borrador del otro sigue mostrando el nombre que ya conocía.
    await corregir(autor, creado.catalogItemId, { expectedVersion: 'v1', name: `${nombre} de una persona`, composition: COMPOSICION }).expect(200);
    const leido = await leerBorrador(c.pro, borradorId);
    expect(nombreEn(leido, creado.catalogItemId)).toBe(nombre);
    expect(JSON.stringify(leido)).not.toContain('de una persona');
    // El borrador que ya lo citaba se guarda; validar lo señala.
    const guardado = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${borradorId}`).send({ expectedVersion: leido.version, changes: estructuraCon(creado.catalogItemId, c.arroz) }).expect(200);
    const validado = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${borradorId}/validate`).send({ expectedVersion: guardado.body.data.version }).expect(200);
    expect(validado.body.data.issues).toContainEqual(expect.objectContaining({ code: 'CATALOG_REFERENCE_INVALID' }));

    // Volver a compartirlo es otro hecho: los demás ven la versión vigente.
    await compartir(autor, creado.catalogItemId, true).expect(200);
    expect((await buscar(c.pro, nombre)).find((e) => e.catalogItemId === creado.catalogItemId)?.name).toBe(`${nombre} de una persona`);
    const cambios = await prisma.cambioDeAlimentoCompartido.findMany({ where: { elementoId: creado.catalogItemId }, orderBy: { numero: 'asc' } });
    expect(cambios.map((k) => k.compartido)).toEqual([true, false, true]);
  });

  it('las versiones de antes de compartir no las cita nadie más, aunque se conozca su identificador', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const creado = await cargarAMano(autor, `Zzantes${unico()} de una persona`, { share: false });
    const r = await corregir(autor, creado.catalogItemId, { expectedVersion: 'v1', name: `Zzantes${unico()} licuado`, composition: COMPOSICION, share: true }).expect(200);
    const compartida = AlimentoPropioResponseSchema.parse(r.body).data;
    const vieja = await recetaCon(otro, creado.catalogItemId, creado.versionId);
    expect(vieja.status).toBe(422);
    expect(vieja.body.error.details.issues).toEqual([{ code: 'CATALOG_REFERENCE_INVALID', path: 'ingredients[0].catalogItemVersionId' }]);
    await recetaCon(otro, creado.catalogItemId, compartida.versionId).expect(201);
    // Su autor sí cita la suya, la que sea.
    await recetaCon(autor, creado.catalogItemId, creado.versionId).expect(201);
  });

  /**
   * NUA-D16: una cita (guardar un borrador que lo suma) y el «dejar de compartir» de su autor, a la vez. La prueba retiene
   * el alimento; los dos pedidos quedan esperándolo (la cita lo toma en modo compartido) y el primero que quedó esperando
   * sigue primero. Sin ese bloqueo, la cita no esperaría y la barrera no se cumpliría.
   */
  async function aLaVez(primero: 'dejar' | 'citar') {
    const autor = await nutricionista();
    const c = await circuitoListoParaPlanificar(app, `nuar-${unico()}`);
    const creado = await cargarAMano(autor, `Zzcarrera${unico()} galleta`);
    const b = await crearBorrador(app, c);
    const resultado: { dejar: request.Response | null; citar: request.Response | null } = { dejar: null, citar: null };
    const pedidos = {
      dejar: () => void compartir(autor, creado.catalogItemId, false).then((r) => (resultado.dejar = r)),
      citar: () =>
        void patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`)
          .send({ expectedVersion: b.version, changes: estructuraCon(creado.catalogItemId, c.arroz) })
          .then((r) => (resultado.citar = r)),
    };
    const segundo = primero === 'dejar' ? 'citar' : 'dejar';
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM "elemento_de_catalogo_nutricional" WHERE "id" = ${creado.catalogItemId}::uuid FOR UPDATE`;
        const pid = await pidDeLaTransaccion(tx);
        pedidos[primero]();
        await esperarQueEsperen(prisma, 1, { bloqueadoPor: pid, yaPaso: () => resultado[primero] !== null, que: `«${primero}» esperando el alimento` });
        pedidos[segundo]();
        await esperarQueEsperen(prisma, 2, { yaPaso: () => resultado[segundo] !== null, que: `«${segundo}» esperando el alimento` });
        expect([resultado.dejar, resultado.citar]).toEqual([null, null]);
      },
      { timeout: 40_000, maxWait: 10_000 },
    );
    for (let i = 0; i < 400 && (resultado.dejar === null || resultado.citar === null); i++) await new Promise((r) => setTimeout(r, 25));
    return { ...resultado, c, b };
  }

  it('una cita y un «dejar de compartir» a la vez: si se deja de compartir primero, la cita no entra', async () => {
    const { dejar, citar } = await aLaVez('dejar');
    expect(dejar!.status).toBe(200);
    expect(citar!.status).toBe(422);
    expect(citar!.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
  });

  it('una cita y un «dejar de compartir» a la vez: si la cita va primero, el borrador lo conserva y validar lo señala', async () => {
    const { dejar, citar, c, b } = await aLaVez('citar');
    expect(citar!.status).toBe(200);
    expect(dejar!.status).toBe(200);
    const validado = await conSesion(app, c.pro.token).post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: citar!.body.data.version }).expect(200);
    expect(validado.body.data.issues).toContainEqual(expect.objectContaining({ code: 'CATALOG_REFERENCE_INVALID' }));
  });
});

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

// ─── La base ─────────────────────────────────────────────────────────────────────────────────────

describe('DL-180 · la base sostiene las guardias', () => {
  const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'DL-180' };

  it('el grupo lo elige solo quien lo cargó; lo compartido y las revisiones no se cambian ni se borran', async () => {
    const autor = await nutricionista();
    const otro = await nutricionista();
    const creado = await cargarAMano(autor, `Zzbase${unico()}`);
    await expect(prisma.$executeRaw`INSERT INTO "grupo_de_alimento" ("elemento_id", "numero", "grupo", "autor_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, 1, 'CARNES', ${otro.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`).rejects.toThrow(/lo elige quien lo cargó/);
    // Segundo tramo: lo compartido son cambios de solo agregar; la tabla del primer tramo ya no se escribe.
    await expect(prisma.$executeRaw`UPDATE "cambio_de_alimento_compartido" SET "procedencia" = '{}'::jsonb WHERE "elemento_id" = ${creado.catalogItemId}::uuid`).rejects.toThrow();
    await expect(prisma.$executeRaw`DELETE FROM "cambio_de_alimento_compartido" WHERE "elemento_id" = ${creado.catalogItemId}::uuid`).rejects.toThrow();
    await expect(prisma.$executeRaw`INSERT INTO "alimento_compartido" ("elemento_id", "procedencia") VALUES (${creado.catalogItemId}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`).rejects.toThrow(/cambio_de_alimento_compartido/);
    // Lo deja de compartir solo quien lo cargó; cada cambio invierte el anterior y guarda la versión vigente.
    await expect(
      prisma.$executeRaw`INSERT INTO "cambio_de_alimento_compartido" ("elemento_id", "numero", "compartido", "version_id", "autor_id", "procedencia")
                         VALUES (${creado.catalogItemId}::uuid, 2, FALSE, ${creado.versionId}::uuid, ${otro.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/quien lo cargó/);
    await expect(
      prisma.$executeRaw`INSERT INTO "cambio_de_alimento_compartido" ("elemento_id", "numero", "compartido", "version_id", "autor_id", "procedencia")
                         VALUES (${creado.catalogItemId}::uuid, 2, TRUE, ${creado.versionId}::uuid, ${autor.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/alterna/);
    await corregir(autor, creado.catalogItemId, { expectedVersion: 'v1', name: creado.name, composition: { ...COMPOSICION, fatG: 8 } }).expect(200);
    await expect(
      prisma.$executeRaw`INSERT INTO "cambio_de_alimento_compartido" ("elemento_id", "numero", "compartido", "version_id", "autor_id", "procedencia")
                         VALUES (${creado.catalogItemId}::uuid, 2, FALSE, ${creado.versionId}::uuid, ${autor.id}::uuid, ${JSON.stringify(PROCEDENCIA)}::jsonb)`,
    ).rejects.toThrow(/versión vigente/);
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
