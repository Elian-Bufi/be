/**
 * DL-139 · El buscador de los catálogos contra PostgreSQL real tolera el orden de las palabras, los plurales y los errores
 * de tipeo (pedido de Dirección del 2026-10-16: «la búsqueda: el orden de las palabras, los plurales y los errores de
 * tipeo»). Con las filas sembradas por las migraciones (los alimentos de WP-04 y de USDA, DL-119; los ejercicios de WP-06)
 * y con las propias de cada profesional. Alimentos (API-NUT-13 y su búsqueda) y ejercicios (API-TRN-13 y su búsqueda).
 *
 * «Trilimbo» es una palabra inventada: con ella, el conjunto de candidatos es conocido y el orden se puede afirmar entero.
 *
 * Las pruebas no dependen de cuántos ítems tenga el catálogo (encargo de Dirección del 2026-10-19, bloque 4): «encuentra»
 * recorre todas las páginas, y el orden se afirma solo donde es el pedido (el nombre igual primero, los parecidos del más
 * cercano al menos cercano), también con más ítems parecidos que una página.
 */
import type { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './soporte';
import { appDePrueba, conSesion } from './soporte-api';
import { prepararProfesional } from './soporte-vinculo';

let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
});

const composicion = { referenceAmount: '100g', energyKcal: 30, proteinG: 0.6, carbohydrateG: 7.6, fatG: 0.2 };

interface Pagina {
  readonly data: { readonly name: string }[];
  readonly page: { readonly limit: number; readonly nextCursor: string | null; readonly hasMore: boolean };
}

/** Los nombres de todas las páginas de una búsqueda, siguiendo el cursor: lo que encuentra, tenga el catálogo lo que tenga. */
async function todasLasPaginas(pedir: (cursor: string | undefined) => Promise<Pagina>): Promise<string[]> {
  const nombres: string[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 40; i++) {
    const p = await pedir(cursor);
    nombres.push(...p.data.map((x) => x.name));
    if (!p.page.nextCursor) return nombres;
    cursor = p.page.nextCursor;
  }
  throw new Error('la búsqueda no terminó en 40 páginas');
}

/** Un profesional de Nutrición nuevo, con su catálogo propio y el buscador del website (API-NUT-13-BUSQUEDA). */
async function deNutricion() {
  const pro = await prepararProfesional(app, `busq-nut-${++contador}`, ['NUTRICION']);
  const s = conSesion(app, pro.token);
  return {
    cargar: async (...nombres: string[]) => {
      for (const name of nombres) await s.post('/api/v1/nutrition/catalog-items').send({ name, itemType: 'FOOD', composition: composicion }).expect(201);
    },
    buscar: async (q: string, extra: Record<string, unknown> = {}): Promise<Pagina> => (await s.post('/api/v1/nutrition/catalog-items/search').send({ q, limit: 50, ...extra }).expect(200)).body,
    nombres: (q: string): Promise<string[]> =>
      todasLasPaginas(async (cursor) => (await s.post('/api/v1/nutrition/catalog-items/search').send({ q, limit: 50, ...(cursor ? { cursor } : {}) }).expect(200)).body as Pagina),
    porUrl: (q: string): Promise<string[]> =>
      todasLasPaginas(async (cursor) => (await s.get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent(q)}&limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`).expect(200)).body as Pagina),
  };
}

/** Un profesional de Entrenamiento nuevo, con su catálogo propio y el buscador del website (API-TRN-13-BUSQUEDA). */
async function deEntrenamiento() {
  const pro = await prepararProfesional(app, `busq-trn-${++contador}`, ['ENTRENAMIENTO']);
  const s = conSesion(app, pro.token);
  return {
    s,
    cargar: async (...nombres: string[]) => {
      for (const name of nombres) await s.post('/api/v1/training/exercises').send({ name, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    },
    nombres: (q: string): Promise<string[]> =>
      todasLasPaginas(async (cursor) => (await s.post('/api/v1/training/exercises/search').send({ q, limit: 50, ...(cursor ? { cursor } : {}) }).expect(200)).body as Pagina),
  };
}

/**
 * Lo que vería la APK instalada en una respuesta: su esquema congelado, leído con el zod del dominio, como en la prueba
 * C01 (`compatibilidad-de-clientes.int-spec.ts`). Vacío es que la acepta.
 */
const { fromJSONSchema } = require(require.resolve('zod', { paths: [join(RAIZ, 'packages', 'domain')] })) as {
  fromJSONSchema: (esquema: unknown) => { safeParse(valor: unknown): { success: boolean; error?: { issues: unknown[] } } };
};
const CONGELADAS = JSON.parse(readFileSync(join(RAIZ, 'packages', 'domain', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json'), 'utf8')) as {
  operaciones: Record<string, { respuestas: Record<string, unknown> }>;
};
function comoLaLeeLaApkInstalada(operacion: string, cuerpo: unknown): unknown[] {
  const r = fromJSONSchema(CONGELADAS.operaciones[operacion]!.respuestas['200']).safeParse(cuerpo);
  return r.success ? [] : (r.error?.issues ?? ['sin detalle']);
}

describe('DL-139 · alimentos: el orden de las palabras, los plurales y los errores de tipeo', () => {
  it('el orden de las palabras no importa, y los conectores no se exigen', async () => {
    const nut = await deNutricion();
    expect(await nut.nombres('pollo pechuga')).toEqual(expect.arrayContaining(['Pechuga de pollo', 'Pechuga de pollo sin piel, asada, parte comestible']));
    expect(await nut.nombres('cocido arroz')).toContain('Arroz blanco de grano largo, cocido');
    expect(await nut.nombres('sal sin, lentejas')).toContain('Lentejas hervidas sin sal');
    // La lectura con el texto en la URL (API-NUT-13) busca igual.
    expect(await nut.porUrl('pollo pechuga')).toContain('Pechuga de pollo');
  });

  it('el plural y el singular: «huevos» encuentra «Huevo», «limones», «Limón», «nueces» y «nuez», «Nueces»', async () => {
    const nut = await deNutricion();
    await nut.cargar('Limón');
    expect((await nut.nombres('huevos'))[0]).toBe('Huevo');
    expect((await nut.nombres('limones'))[0]).toBe('Limón');
    expect((await nut.nombres('nueces'))[0]).toBe('Nueces');
    expect(await nut.nombres('nuez')).toContain('Nueces');
    expect(await nut.nombres('tomates')).toContain('Tomate');
    expect(await nut.nombres('frutilla')).toContain('Frutillas');
    expect(await nut.nombres('lenteja hervida')).toContain('Lentejas hervidas sin sal');
  });

  it('un error de tipeo: «manzna» encuentra «Manzana», «zanahria», «Zanahoria» y «merlusa», «Merluza»; sin tildes, «brocoli» va primero a «Brócoli»', async () => {
    const nut = await deNutricion();
    expect(await nut.nombres('manzna')).toContain('Manzana');
    // Un error de tipeo en plural se mide también en singular.
    expect(await nut.nombres('manznas')).toContain('Manzana');
    expect(await nut.nombres('zanahria')).toContain('Zanahoria');
    expect(await nut.nombres('merlusa')).toContain('Merluza');
    const brocoli = await nut.nombres('brocoli');
    expect(brocoli[0]).toBe('Brócoli');
    expect(brocoli).toContain('Brócoli hervido y escurrido, sin sal');
  });

  it('sin falsos parecidos: una palabra ajena no trae nada, «leche» no trae «Lechuga» y «zapato» no trae «Zapallo»', async () => {
    const nut = await deNutricion();
    expect(await nut.nombres('helicoptero')).toEqual([]);
    const leche = await nut.nombres('leche');
    expect(leche).toContain('Leche descremada');
    expect(leche).not.toContain('Lechuga');
    expect(await nut.nombres('zapato')).not.toContain('Zapallo');
    // Cada palabra tiene que estar o parecerse: «manzna helicoptero» no trae «Manzana».
    expect(await nut.nombres('manzna helicoptero')).toEqual([]);
  });

  it('los comodines siguen escapados, también para los errores de tipeo', async () => {
    const nut = await deNutricion();
    await nut.cargar('Trilimbo');
    expect(await nut.nombres('trilimbo')).toEqual(['Trilimbo']);
    expect(await nut.nombres('tril%bo')).toEqual([]);
    expect(await nut.nombres('trilimb_')).toEqual([]);
    expect(await nut.nombres('%')).not.toContain('Trilimbo');
  });

  it('el orden del resultado: igual, empieza con la primera palabra, tiene todas, y dentro de cada grupo lo más nuevo primero', async () => {
    const nut = await deNutricion();
    await nut.cargar('Trilimbo', 'Trilimbo tostado', 'Galleta de trilimbo', 'Tostado con trilimbo');
    expect(await nut.nombres('trilimbo')).toEqual(['Trilimbo', 'Trilimbo tostado', 'Tostado con trilimbo', 'Galleta de trilimbo']);
    // En plural y en mayúsculas, el mismo orden: «Trilimbo» es igual a lo escrito, en singular.
    expect(await nut.nombres('TRILIMBOS')).toEqual(['Trilimbo', 'Trilimbo tostado', 'Tostado con trilimbo', 'Galleta de trilimbo']);
    expect(await nut.nombres('tostado trilimbo')).toEqual(['Tostado con trilimbo', 'Trilimbo tostado']);
    expect(await nut.nombres('trilimbo con tostado')).toEqual(['Trilimbo tostado', 'Tostado con trilimbo']);
  });

  it('la paginación sigue el mismo orden: el cursor lleva el grupo, y no se repite ni se saltea nada', async () => {
    const nut = await deNutricion();
    await nut.cargar('Trilimbo', 'Trilimbo tostado', 'Galleta de trilimbo', 'Tostado con trilimbo');
    const primera = await nut.buscar('trilimbo', { limit: 2 });
    expect(primera.data.map((i) => i.name)).toEqual(['Trilimbo', 'Trilimbo tostado']);
    expect(primera.page).toMatchObject({ limit: 2, hasMore: true });
    const segunda = await nut.buscar('trilimbo', { limit: 2, cursor: primera.page.nextCursor });
    expect(segunda.data.map((i) => i.name)).toEqual(['Tostado con trilimbo', 'Galleta de trilimbo']);
    expect(segunda.page).toEqual({ limit: 2, nextCursor: null, hasMore: false });
  });

  it('los parecidos completan solo la primera página, del más parecido al menos parecido, y no tienen página siguiente', async () => {
    const nut = await deNutricion();
    await nut.cargar('Trilimbo', 'Trilimbo tostado', 'Galleta de trilimbo');
    // «trilinbo» no está en ningún nombre: los tres se parecen igual palabra por palabra (0,5), y van del nombre entero
    // más cercano a lo escrito al menos cercano (0,5; 0,32 y 0,26), no del más nuevo al más viejo: así un catálogo que
    // crece no saca de la primera página al que más se parece.
    const r = await nut.buscar('trilinbo', { limit: 2 });
    expect(r.data.map((i) => i.name)).toEqual(['Trilimbo', 'Trilimbo tostado']);
    expect(r.page).toEqual({ limit: 2, nextCursor: null, hasMore: false });
    // Con un exacto, los parecidos van detrás.
    await nut.cargar('Trilinbo dulce');
    expect(await nut.nombres('trilinbo')).toEqual(['Trilinbo dulce', 'Trilimbo', 'Trilimbo tostado', 'Galleta de trilimbo']);
  });

  it('un parecido nunca muestra lo que no se ve: el alimento propio de otro profesional no aparece ni con un error de tipeo', async () => {
    const duena = await deNutricion();
    await duena.cargar('Trilimbo ajeno');
    const otra = await deNutricion();
    expect(await otra.nombres('trilimbo ajeno')).toEqual([]);
    expect(await otra.nombres('trilinbo ajeno')).toEqual([]);
    expect(await duena.nombres('trilinbo ajeno')).toEqual(['Trilimbo ajeno']);
  });
});

describe('DL-139 · ejercicios: el mismo buscador', () => {
  it('el orden, el plural y un error de tipeo, sobre los ejercicios sembrados', async () => {
    const trn = await deEntrenamiento();
    expect(await trn.nombres('banca press')).toContain('Press de banca');
    expect(await trn.nombres('curl biceps')).toContain('Curl de bíceps');
    expect(await trn.nombres('sentadillas')).toContain('Sentadilla');
    expect(await trn.nombres('zancada')).toContain('Zancadas');
    expect(await trn.nombres('sentadila')).toContain('Sentadilla');
    expect(await trn.nombres('helicoptero')).toEqual([]);
  });

  it('un parecido nunca muestra el ejercicio propio de otro profesional', async () => {
    const duena = await deEntrenamiento();
    await duena.cargar('Escalador trilimbo');
    const otra = await deEntrenamiento();
    expect(await otra.nombres('escalador trilinbo')).toEqual([]);
    expect(await duena.nombres('escalador trilinbo')).toEqual(['Escalador trilimbo']);
  });

  it('crecer no saca a «Sentadilla» de la primera página: con más sentadillas que una página, «sentadila» la trae primero, también en API-TRN-13', async () => {
    const trn = await deEntrenamiento();
    // Veinticinco sentadillas propias, más nuevas que todo el catálogo: a igual parecido palabra por palabra, la más nueva
    // iba primero y la de demostración salía de la primera página (veinte, como pide la APK instalada).
    await trn.cargar(...Array.from({ length: 25 }, (_, i) => `Sentadilla trilimbo ${i + 1}`));
    const legado = (await trn.s.get(`/api/v1/training/exercises?q=${encodeURIComponent('sentadila')}`).expect(200)).body as Pagina;
    expect(legado.data).toHaveLength(20);
    expect(legado.data[0]!.name).toBe('Sentadilla');
    expect(comoLaLeeLaApkInstalada('API-TRN-13', legado)).toEqual([]);
    const delWebsite = (await trn.s.post('/api/v1/training/exercises/search').send({ q: 'sentadila' }).expect(200)).body as Pagina;
    expect(delWebsite.data[0]!.name).toBe('Sentadilla');
    // Sin el error de tipeo, el nombre igual va primero, como siempre, y todas se encuentran página por página.
    expect((await trn.nombres('sentadilla'))[0]).toBe('Sentadilla');
    expect(await trn.nombres('sentadilla trilimbo')).toHaveLength(25);
  });

  it('API-TRN-13, la que lee la APK instalada, responde con la misma forma de siempre también con parecidos', async () => {
    const trn = await deEntrenamiento();
    const r = await trn.s.get(`/api/v1/training/exercises?q=${encodeURIComponent('sentadila')}`).expect(200);
    expect((r.body as Pagina).data.map((e) => e.name)).toContain('Sentadilla');
    expect(comoLaLeeLaApkInstalada('API-TRN-13', r.body)).toEqual([]);
  });
});
