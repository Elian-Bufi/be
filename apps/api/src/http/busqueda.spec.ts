import { Prisma } from '@prisma/client';
import {
  admiteParecido,
  buscarEnCatalogo,
  CON_MARCA,
  escribirCursorDeBusqueda,
  formasDeLaPalabra,
  leerBusqueda,
  leerCursorDeBusqueda,
  SIN_MARCA,
  sinMarcas,
  UMBRAL_DE_PARECIDO,
} from './busqueda';

describe('búsqueda por nombre sin tildes ni mayúsculas', () => {
  it('cada letra marcada tiene su letra sin marca, en el mismo orden', () => {
    expect([...CON_MARCA].length).toBe([...SIN_MARCA].length);
    expect(new Set([...CON_MARCA]).size).toBe([...CON_MARCA].length);
  });

  it('«Sandía» y «sandia», «PIÑA» y «pina», «Elevación» y «elevacion» se igualan; el resto no cambia', () => {
    expect(sinMarcas('Sandía')).toBe('sandia');
    expect(sinMarcas('PIÑA')).toBe('pina');
    expect(sinMarcas('Elevación de talones')).toBe('elevacion de talones');
    expect(sinMarcas('Pingüino')).toBe('pinguino');
    expect(sinMarcas('100% avena_integral')).toBe('100% avena_integral');
  });
});

describe('DL-139 · los plurales: las formas de cada palabra', () => {
  it('sin la «s», sin la «es», «ces» → «z» y «z» → «ces»', () => {
    expect(formasDeLaPalabra('huevos')).toEqual(['huevos', 'huevo']);
    expect(formasDeLaPalabra('limones')).toEqual(['limones', 'limon', 'limone']);
    expect(formasDeLaPalabra('nueces')).toEqual(['nueces', 'nuez', 'nuece']);
    expect(formasDeLaPalabra('nuez')).toEqual(['nuez', 'nueces']);
    expect(formasDeLaPalabra('pollo')).toEqual(['pollo']);
  });

  it('cada plural encuentra su singular dentro de alguna forma (y «nuez», su plural)', () => {
    const pares: [string, string][] = [
      ['huevos', 'huevo'],
      ['limones', 'limon'],
      ['nueces', 'nuez'],
      ['panes', 'pan'],
      ['tomates', 'tomate'],
      ['dulces', 'dulce'],
      ['lapices', 'lapiz'],
      ['flexiones', 'flexion'],
      ['abdominales', 'abdominal'],
      ['sentadillas', 'sentadilla'],
      ['frutillas', 'frutilla'],
      ['nuez', 'nueces'],
      ['arroz', 'arroces'],
    ];
    for (const [escrita, nombre] of pares) expect(formasDeLaPalabra(escrita).some((f) => nombre.includes(f))).toBe(true);
  });

  it('ninguna forma deja menos de tres letras, y «dulces» no da «dulc»', () => {
    expect(formasDeLaPalabra('res')).toEqual(['res']);
    expect(formasDeLaPalabra('pies')).toEqual(['pies', 'pie']);
    expect(formasDeLaPalabra('tres')).toEqual(['tres', 'tre']);
    expect(formasDeLaPalabra('dulces')).not.toContain('dulc');
    for (const p of ['res', 'pies', 'tres', 'mes', 'meses', 'luz', 'luces', 'peces', 'as', 'es', 'ces', 's']) {
      for (const f of formasDeLaPalabra(p)) expect(f === p || f.length >= 3).toBe(true);
    }
  });
});

describe('DL-139 · el orden de las palabras: lo escrito, partido', () => {
  it('sin marcas, en minúsculas y sin los conectores cuando hay otras palabras', () => {
    expect(leerBusqueda('Pechuga de POLLO')).toEqual({
      texto: 'pechuga de pollo',
      palabras: [
        { palabra: 'pechuga', formas: ['pechuga'] },
        { palabra: 'pollo', formas: ['pollo'] },
      ],
    });
    expect(leerBusqueda('Brócoli')?.palabras.map((p) => p.palabra)).toEqual(['brocoli']);
    // «sin» dice algo: no es un conector.
    expect(leerBusqueda('café sin azúcar')?.palabras.map((p) => p.palabra)).toEqual(['cafe', 'sin', 'azucar']);
  });

  it('solo conectores: se buscan; una palabra repetida, una vez; nada escrito, el catálogo entero', () => {
    expect(leerBusqueda('de la')?.palabras.map((p) => p.palabra)).toEqual(['de', 'la']);
    expect(leerBusqueda('pollo  POLLO pollo')?.palabras.map((p) => p.palabra)).toEqual(['pollo']);
    expect(leerBusqueda('')).toBeNull();
    expect(leerBusqueda('   ')).toBeNull();
  });

  it('los signos pegados a una palabra no cuentan; los del medio, sí; una palabra de solo signos se busca tal cual', () => {
    expect(leerBusqueda('pollo, (asado)')).toMatchObject({ texto: 'pollo asado', palabras: [{ palabra: 'pollo' }, { palabra: 'asado' }] });
    expect(leerBusqueda('leche 1,5%')?.palabras.map((p) => p.palabra)).toEqual(['leche', '1,5%']);
    expect(leerBusqueda('sand%a pi_a')?.palabras.map((p) => p.palabra)).toEqual(['sand%a', 'pi_a']);
    expect(leerBusqueda('...')?.palabras.map((p) => p.palabra)).toEqual(['...']);
  });
});

describe('DL-139 · los errores de tipeo: qué palabra admite parecido', () => {
  it('cuatro letras o números como mínimo, y nada más: «%» y «_» nunca se buscan por parecido', () => {
    expect(admiteParecido('manzna')).toBe(true);
    expect(admiteParecido('b12x')).toBe(true);
    expect(admiteParecido('pan')).toBe(false);
    expect(admiteParecido('sand%a')).toBe(false);
    expect(admiteParecido('pi_a')).toBe(false);
    expect(admiteParecido('1,5%')).toBe(false);
  });
});

describe('DL-139 · el cursor del buscador', () => {
  const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
  const momento = new Date('2026-10-16T12:00:00.000Z');

  it('lleva el grupo del último servido, y sigue siendo opaco', () => {
    const cursor = escribirCursorDeBusqueda(1, momento, id);
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(leerCursorDeBusqueda(cursor)).toEqual({ grupo: 1, momento, id });
    expect(leerCursorDeBusqueda(undefined)).toBeNull();
  });

  it('uno de antes de DL-139 ([momento, id]) se lee como del último grupo, la lista por fecha', () => {
    const viejo = Buffer.from(JSON.stringify([momento.toISOString(), id]), 'utf8').toString('base64url');
    expect(leerCursorDeBusqueda(viejo)).toEqual({ grupo: 2, momento, id });
  });

  it('uno inválido es 400 INVALID_CURSOR', () => {
    const con = (valor: unknown) => Buffer.from(JSON.stringify(valor), 'utf8').toString('base64url');
    for (const malo of ['basura', con([momento.toISOString(), id, 3]), con([momento.toISOString(), id, '1']), con(['no-es-fecha', id, 0]), con([momento.toISOString(), 'no-es-uuid', 0]), con({ a: 1 })]) {
      expect(() => leerCursorDeBusqueda(malo)).toThrow('INVALID_CURSOR');
    }
    expect(() => leerCursorDeBusqueda(['un', 'arreglo'])).toThrow('INVALID_CURSOR');
  });
});

describe('DL-139 · las dos consultas del buscador, sin base', () => {
  interface Fila {
    readonly versionId: string;
    readonly momentoDeRegistro: Date;
    readonly grupo?: number;
  }
  const CATALOGO = { columnas: Prisma.sql`v."id"::text AS "versionId"`, tablas: Prisma.sql`"version" v`, visibles: Prisma.sql`TRUE` };
  const fila = (n: number, grupo = 2): Fila => ({ versionId: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, momentoDeRegistro: new Date(Date.UTC(2026, 9, 16, 0, 0, n)), grupo });

  /** Un cliente que responde en orden y guarda cada consulta, armada como la arma Prisma. */
  function clienteFalso(...respuestas: Fila[][]) {
    const consultas: Prisma.Sql[] = [];
    const cliente = {
      $queryRaw: (partes: TemplateStringsArray, ...valores: unknown[]) => {
        consultas.push(Prisma.sql(partes, ...valores));
        return Promise.resolve(respuestas.shift() ?? []);
      },
    } as unknown as Pick<Prisma.TransactionClient, '$queryRaw'>;
    return { cliente, consultas };
  }

  it('«%» y «_» van escapados en cada forma, y una palabra con signos no busca parecidos', async () => {
    const { cliente, consultas } = clienteFalso([]);
    const r = await buscarEnCatalogo<Fila>(cliente, CATALOGO, leerBusqueda('sand%a pi_a'), 20, null);
    expect(r.filas).toEqual([]);
    expect(consultas).toHaveLength(1);
    expect(consultas[0]!.values).toEqual(expect.arrayContaining(['%sand\\%a%', '%pi\\_a%']));
  });

  it('sin nada exacto, la primera página se completa con los parecidos, sin página siguiente', async () => {
    const { cliente, consultas } = clienteFalso([], [fila(1), fila(2)]);
    const r = await buscarEnCatalogo<Fila>(cliente, CATALOGO, leerBusqueda('manzna'), 20, null);
    expect(r.filas.map((f) => f.versionId)).toEqual([fila(1).versionId, fila(2).versionId]);
    expect(r.page).toEqual({ limit: 20, nextCursor: null, hasMore: false });
    expect(consultas).toHaveLength(2);
    expect(consultas[1]!.sql).toContain('strict_word_similarity');
    expect(consultas[1]!.values).toEqual(expect.arrayContaining(['manzna', UMBRAL_DE_PARECIDO, 20]));
  });

  it('una palabra en plural se mide por parecido también en singular', async () => {
    const { cliente, consultas } = clienteFalso([], []);
    await buscarEnCatalogo<Fila>(cliente, CATALOGO, leerBusqueda('manznas'), 20, null);
    expect(consultas[1]!.values).toEqual(expect.arrayContaining(['manznas', 'manzna']));
  });

  it('con dos exactos, los parecidos completan la página detrás; con tres, no se buscan', async () => {
    const dos = clienteFalso([fila(1, 0), fila(2, 2)], [fila(3)]);
    const r = await buscarEnCatalogo<Fila>(dos.cliente, CATALOGO, leerBusqueda('huevos'), 20, null);
    expect(r.filas.map((f) => f.versionId)).toEqual([fila(1).versionId, fila(2).versionId, fila(3).versionId]);
    expect(dos.consultas[1]!.values).toContain(18);

    const tres = clienteFalso([fila(1), fila(2), fila(3)]);
    await buscarEnCatalogo<Fila>(tres.cliente, CATALOGO, leerBusqueda('huevos'), 20, null);
    expect(tres.consultas).toHaveLength(1);
  });

  it('con más de una página, el cursor lleva el grupo del último servido; con cursor, nunca parecidos', async () => {
    const { cliente } = clienteFalso([fila(1, 0), fila(2, 1), fila(3, 2)]);
    const r = await buscarEnCatalogo<Fila>(cliente, CATALOGO, leerBusqueda('pollo'), 2, null);
    expect(r.page.hasMore).toBe(true);
    expect(leerCursorDeBusqueda(r.page.nextCursor)).toEqual({ grupo: 1, momento: fila(2).momentoDeRegistro, id: fila(2).versionId });

    const siguiente = clienteFalso([]);
    const cursor = leerCursorDeBusqueda(r.page.nextCursor);
    const r2 = await buscarEnCatalogo<Fila>(siguiente.cliente, CATALOGO, leerBusqueda('pollo'), 2, cursor);
    expect(r2.filas).toEqual([]);
    expect(siguiente.consultas).toHaveLength(1);
  });

  it('sin texto, una sola consulta, todo en el último grupo y lo más nuevo primero', async () => {
    const { cliente, consultas } = clienteFalso([]);
    await buscarEnCatalogo<Fila>(cliente, CATALOGO, null, 20, null);
    expect(consultas).toHaveLength(1);
    expect(consultas[0]!.sql).not.toContain('LIKE');
    expect(consultas[0]!.sql).toContain('ORDER BY grp."grupo", v."momento_de_registro" DESC, v."id" DESC');
  });
});
