/**
 * WP-USO-FINAL · UF-09 (DEUDA_LEGAJO DL-169; UF-D10, ratificada por Dirección el 2026-11-11): el catálogo de demostración,
 * según el ambiente. Oráculo TEST-UF-013 (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * - Dos apps de la API sobre la misma base: una con APP_ENV test, como el despliegue de hoy, y otra con production. Los
 *   profesionales y las personas se preparan en la de test; sus sesiones valen en las dos (la misma base y la misma firma).
 * - En producción, los buscadores no ofrecen lo sembrado como demostración (procedencia BE_SYNTHETIC_SEED) y un plan nuevo
 *   no lo acepta. En test, todo sigue igual. Las filas quedan: no se borra ni se marca nada.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { appDePrueba, conSesion } from './soporte-api';
import { circuitoListoParaPlanificarEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { circuitoListoParaPlanificar, estructura } from './soporte-nutricion';

const prisma = new PrismaClient();
let enTest: INestApplication;
let enProduccion: INestApplication;

beforeAll(async () => {
  enTest = await appDePrueba();
  enProduccion = await appDePrueba({ appEnv: 'production' });
});
afterAll(async () => {
  await enTest.close();
  await enProduccion.close();
  await prisma.$disconnect();
});

interface Fila {
  readonly name: string;
  readonly provenance: string;
}
interface Pagina {
  readonly data: Fila[];
  readonly page: { readonly nextCursor: string | null };
}

/** Todas las filas de una búsqueda, siguiendo el cursor: lo que ofrece el buscador, tenga el catálogo lo que tenga. */
async function todasLasFilas(app: INestApplication, token: string, ruta: string, q: string): Promise<Fila[]> {
  const filas: Fila[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 60; i++) {
    const p = (await conSesion(app, token).post(ruta).send({ q, limit: 50, ...(cursor ? { cursor } : {}) }).expect(200)).body as Pagina;
    filas.push(...p.data);
    if (!p.page.nextCursor) return filas;
    cursor = p.page.nextCursor;
  }
  throw new Error('el buscador no terminó en 60 páginas');
}

const ALIMENTOS = '/api/v1/nutrition/catalog-items/search';
const EJERCICIOS = '/api/v1/training/exercises/search';
const sembrados = async () => ({
  alimentos: await prisma.elementoDeCatalogoNutricional.count({ where: { procedencia: 'BE_SYNTHETIC_SEED' } }),
  ejercicios: await prisma.ejercicioDeCatalogo.count({ where: { procedencia: 'BE_SYNTHETIC_SEED' } }),
});

describe('TEST-UF-013 · en producción el catálogo de demostración no se ofrece ni se acepta; en test, sí', () => {
  it('en test, los buscadores ofrecen lo sembrado, con su procedencia', async () => {
    const nut = await circuitoListoParaPlanificar(enTest, 'uf09-test');
    const trn = await circuitoListoParaPlanificarEntrenamiento(enTest, 'uf09-test');
    const arroz = (await todasLasFilas(enTest, nut.pro.token, ALIMENTOS, 'Arroz blanco')).filter((f) => f.provenance === 'BE_SYNTHETIC_SEED');
    expect(arroz.map((f) => f.name)).toContain('Arroz blanco');
    const porUrl = (await conSesion(enTest, nut.pro.token).get('/api/v1/nutrition/catalog-items?q=Arroz%20blanco&limit=50').expect(200)).body.data as Fila[];
    expect(porUrl.some((f) => f.name === 'Arroz blanco' && f.provenance === 'BE_SYNTHETIC_SEED')).toBe(true);
    const sentadilla = await todasLasFilas(enTest, trn.pro.token, EJERCICIOS, 'Sentadilla');
    expect(sentadilla.some((f) => f.name === 'Sentadilla' && f.provenance === 'BE_SYNTHETIC_SEED')).toBe(true);
  });

  it('en producción, ningún buscador ofrece una fila sembrada como demostración, ni buscando su nombre ni sin texto', async () => {
    const antes = await sembrados();
    expect(antes.alimentos).toBeGreaterThan(0);
    expect(antes.ejercicios).toBeGreaterThan(0);
    const nut = await circuitoListoParaPlanificar(enTest, 'uf09-prod-busq');
    const trn = await circuitoListoParaPlanificarEntrenamiento(enTest, 'uf09-prod-busq');
    for (const q of ['Arroz blanco', 'Pechuga de pollo', '']) {
      const filas = await todasLasFilas(enProduccion, nut.pro.token, ALIMENTOS, q);
      expect(filas.filter((f) => f.provenance === 'BE_SYNTHETIC_SEED')).toEqual([]);
    }
    const porUrl = (await conSesion(enProduccion, nut.pro.token).get('/api/v1/nutrition/catalog-items?q=Arroz%20blanco&limit=50').expect(200)).body.data as Fila[];
    expect(porUrl.filter((f) => f.provenance === 'BE_SYNTHETIC_SEED')).toEqual([]);
    for (const q of ['Sentadilla', 'Press de banca', '']) {
      const filas = await todasLasFilas(enProduccion, trn.pro.token, EJERCICIOS, q);
      expect(filas.filter((f) => f.provenance === 'BE_SYNTHETIC_SEED')).toEqual([]);
    }
    // Lo demás del catálogo sigue: el buscador de producción no queda vacío.
    expect((await todasLasFilas(enProduccion, nut.pro.token, ALIMENTOS, '')).length).toBeGreaterThan(0);
    expect(await sembrados()).toEqual(antes);
  });

  it('en producción, un plan nuevo con un ítem sembrado responde 422 y no crea nada; en test, el mismo pedido crea el plan', async () => {
    const antes = await sembrados();
    const nut = await circuitoListoParaPlanificar(enTest, 'uf09-plan-nut');
    const cuerpoNut = { objectiveVersionId: nut.objectiveVersionId, initialStructure: estructura(nut.arroz, nut.pollo) };
    const rechazoNut = await conSesion(enProduccion, nut.pro.token).post(`/api/v1/advisees/${nut.ase.id}/nutrition/plans`).send(cuerpoNut).expect(422);
    expect(rechazoNut.body.error.code).toBe('CATALOG_REFERENCE_INVALID');
    expect((rechazoNut.body.error.details.issues as { code: string }[]).every((i) => i.code === 'CATALOG_REFERENCE_INVALID')).toBe(true);
    expect(await prisma.planNutricional.count({ where: { asesoradoId: nut.ase.id } })).toBe(0);
    await conSesion(enTest, nut.pro.token).post(`/api/v1/advisees/${nut.ase.id}/nutrition/plans`).send(cuerpoNut).expect(201);

    const trn = await circuitoListoParaPlanificarEntrenamiento(enTest, 'uf09-plan-trn');
    const cuerpoTrn = { objectiveVersionId: trn.objectiveVersionId, initialStructure: estructuraDeEntrenamiento() };
    const rechazoTrn = await conSesion(enProduccion, trn.pro.token).post(`/api/v1/advisees/${trn.ase.id}/training/plans`).send(cuerpoTrn).expect(422);
    expect(rechazoTrn.body.error.code).toBe('EXERCISE_REFERENCE_INVALID');
    // Las tres prescripciones citan ejercicios sembrados (press de banca, sentadilla y dominadas): ninguna se acepta.
    expect((rechazoTrn.body.error.details.issues as { code: string }[]).map((i) => i.code)).toEqual(['EXERCISE_REFERENCE_INVALID', 'EXERCISE_REFERENCE_INVALID', 'EXERCISE_REFERENCE_INVALID']);
    expect(await prisma.planDeEntrenamiento.count({ where: { asesoradoId: trn.ase.id } })).toBe(0);
    await conSesion(enTest, trn.pro.token).post(`/api/v1/advisees/${trn.ase.id}/training/plans`).send(cuerpoTrn).expect(201);
    expect(await sembrados()).toEqual(antes);
  });
});
