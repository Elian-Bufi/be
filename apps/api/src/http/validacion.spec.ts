import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dominio from '@be/domain';
import { CrearPlanDeEntrenamientoRequestSchema, CrearPlanRequestSchema } from '@be/domain';
import { cotaDeElementos, LARGO_DE_FORMATO } from './cota-de-elementos';
import { ErrorDeApi } from './errores';
import { MAXIMO_DE_ELEMENTOS, MAXIMO_DE_ERRORES_INFORMADOS, PISO_DE_ELEMENTOS, maximoDeElementos, superaElementos, validarCuerpo } from './validacion';

/**
 * El riesgo que deja zod 4.6.6 (GHSA-mrhx-c7xc-m3w5, revisado el 2026-10-24): zod junta un error por cada elemento que
 * falla, y desde la 4.6.6 corta antes solo la lista que pasa su propio tope. Los topes de los planes se multiplican (días
 * 7 × comidas 12 × opciones 12 × ítems 40), y dentro de los 16 KB del pedido entraban 4.800 ítems `{}`: 14.542 errores,
 * una respuesta de 1,4 MB y decenas de milisegundos por pedido. Cualquier cuenta llegaba: el cuerpo se valida antes de
 * autorizar.
 *
 * Estas pruebas fijan la corrección de `validarCuerpo`:
 * - un cuerpo con más elementos de listas de los que puede tener uno válido de su tamaño se rechaza con un solo TOO_BIG,
 *   sin validarlo;
 * - se informan como mucho MAXIMO_DE_ERRORES_INFORMADOS errores, con la prioridad de siempre;
 * - la cota nunca queda por debajo de un máximo verdadero, y ningún cuerpo válido de 16 KB de la API llega al techo.
 */

const LIMITE_DEL_CUERPO = 16 * 1024;
const tamano = (v: unknown): number => JSON.stringify(v).length;
const comoJson = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Lo que `validarCuerpo` lanza, para mirarlo. */
function rechazo(fn: () => unknown): { status: number; code: string; issues: { code: string; path: string }[] } {
  try {
    fn();
  } catch (e) {
    if (!(e instanceof ErrorDeApi)) throw e;
    return { status: e.status, code: e.code, issues: (e.details?.issues ?? []) as { code: string; path: string }[] };
  }
  throw new Error('validarCuerpo no rechazó el cuerpo');
}

/** Un plan nutricional con ítems `{}` sin pasar ningún tope: 1 día × `comidas` × `opciones` × `items`. */
function planNutricionalMalo(comidas: number, opciones = 12, items = 40): unknown {
  const opcion = { items: Array.from({ length: items }, () => ({})) };
  return { initialStructure: { dayTypes: [{ meals: Array.from({ length: comidas }, () => ({ options: Array.from({ length: opciones }, () => opcion) })) }] } };
}
/** El peor plan de entrenamiento de 16 KB sin pasar ningún tope: 1 bloque × 8 microciclos × 14 sesiones × 40 prescripciones `{}`. */
function planDeEntrenamientoMalo(): unknown {
  const sesion = { prescriptions: Array.from({ length: 40 }, () => ({})) };
  return { initialStructure: { blocks: [{ microcycles: Array.from({ length: 8 }, () => ({ sessions: Array.from({ length: 14 }, () => sesion) })) }] } };
}

describe('validarCuerpo · el riesgo residual de las listas (GHSA-mrhx-c7xc-m3w5)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reproducción: sin el corte, el peor plan de 16 KB da más de 14.000 errores', () => {
    const cuerpo = planNutricionalMalo(10);
    expect(tamano(cuerpo)).toBeLessThanOrEqual(LIMITE_DEL_CUERPO);
    const r = CrearPlanRequestSchema.safeParse(comoJson(cuerpo));
    expect(r.success).toBe(false);
    expect(r.error?.issues.length).toBeGreaterThan(14_000);
  });

  it('el peor plan nutricional y el peor de entrenamiento de 16 KB se rechazan con un solo TOO_BIG, sin validarlos', () => {
    for (const [schema, cuerpo] of [
      [CrearPlanRequestSchema, planNutricionalMalo(10)],
      [CrearPlanDeEntrenamientoRequestSchema, planDeEntrenamientoMalo()],
    ] as const) {
      expect(tamano(cuerpo)).toBeLessThanOrEqual(LIMITE_DEL_CUERPO);
      const espia = jest.spyOn(schema, 'safeParse');
      const r = rechazo(() => validarCuerpo(schema, comoJson(cuerpo)));
      expect(r).toEqual({ status: 400, code: 'INVALID_REQUEST', issues: [{ code: 'TOO_BIG', path: '(body)' }] });
      expect(espia).not.toHaveBeenCalled();
    }
  });

  it('un cuerpo chico pero denso también se corta: la cota depende del tamaño, no solo del techo', () => {
    const cuerpo = comoJson(planNutricionalMalo(3)); // 1.440 ítems en menos de 5 KB: menos que el techo
    expect(tamano(cuerpo)).toBeLessThan(5 * 1024);
    expect(superaElementos(cuerpo, MAXIMO_DE_ELEMENTOS)).toBe(false);
    expect(superaElementos(cuerpo, maximoDeElementos(CrearPlanRequestSchema, cuerpo))).toBe(true);
    const espia = jest.spyOn(CrearPlanRequestSchema, 'safeParse');
    expect(rechazo(() => validarCuerpo(CrearPlanRequestSchema, cuerpo)).issues).toEqual([{ code: 'TOO_BIG', path: '(body)' }]);
    expect(espia).not.toHaveBeenCalled();
  });

  it('dentro de la cota se valida, y se informan solo los primeros errores, en el orden de zod', () => {
    const cuerpo = comoJson(planNutricionalMalo(1, 1, 40)); // 43 elementos: debajo del piso
    expect(superaElementos(cuerpo, PISO_DE_ELEMENTOS)).toBe(false);
    const todos = CrearPlanRequestSchema.safeParse(cuerpo).error?.issues ?? [];
    expect(todos.length).toBeGreaterThan(MAXIMO_DE_ERRORES_INFORMADOS);
    const r = rechazo(() => validarCuerpo(CrearPlanRequestSchema, cuerpo));
    expect(r.status).toBe(400);
    expect(r.code).toBe('INVALID_REQUEST');
    expect(r.issues).toEqual(todos.slice(0, MAXIMO_DE_ERRORES_INFORMADOS).map((i) => ({ code: i.code.toUpperCase(), path: i.path.map(String).join('.') || '(body)' })));
    expect(tamano({ error: { details: { issues: r.issues } } })).toBeLessThan(4 * 1024);
  });

  it('los campos no declarados siguen teniendo prioridad, también acotados, y una lista chica donde no va sigue siendo UNKNOWN_FIELD', () => {
    const muchos = { objectiveVersionId: '', ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`campo${i}`, 1])) };
    const r = rechazo(() => validarCuerpo(CrearPlanRequestSchema, muchos));
    expect(r.code).toBe('UNKNOWN_FIELD');
    expect(r.issues.map((i) => i.path)).toEqual(Array.from({ length: MAXIMO_DE_ERRORES_INFORMADOS }, (_, i) => `campo${i}`));
    expect(r.issues.every((i) => i.code === 'UNKNOWN_FIELD')).toBe(true);
    expect(rechazo(() => validarCuerpo(CrearPlanRequestSchema, { objectiveVersionId: 'objetivo-1', roles: ['ADMIN'] }))).toEqual({ status: 400, code: 'UNKNOWN_FIELD', issues: [{ code: 'UNKNOWN_FIELD', path: 'roles' }] });
  });

  it('un cuerpo válido pasa igual que antes', () => {
    expect(validarCuerpo(CrearPlanRequestSchema, { objectiveVersionId: 'objetivo-1' })).toMatchObject({ objectiveVersionId: 'objetivo-1' });
  });
});

describe('superaElementos', () => {
  it('suma los elementos de todas las listas, también las de adentro de objetos, y no cuenta los valores sueltos', () => {
    const v = { a: [1, 2, [3, 4, 5]], b: { c: [{ d: [6] }] }, e: 'texto', f: 7 };
    // a: 3 · [3, 4, 5]: 3 · c: 1 · d: 1 → 8
    expect(superaElementos(v, 7)).toBe(true);
    expect(superaElementos(v, 8)).toBe(false);
    expect(superaElementos([], 0)).toBe(false);
    expect(superaElementos('texto', 0)).toBe(false);
    expect(superaElementos(null, 0)).toBe(false);
  });

  it('no se queda sin pila con un anidamiento muy profundo', () => {
    let profundo: unknown = [];
    for (let i = 0; i < 20_000; i++) profundo = [profundo];
    expect(superaElementos(profundo, 30_000)).toBe(false);
    expect(superaElementos(profundo, 10_000)).toBe(true);
  });
});

/** Los esquemas con que la API valida cuerpos: los que recibe validarCuerpo directamente, los del ejecutor y los de las transiciones. */
function archivosDeLaApi(): string[] {
  const recorrer = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts') ? [path.join(dir, e.name)] : []));
  return recorrer(path.resolve(__dirname, '..'));
}
function esquemasDeEntrada(): string[] {
  const nombres = new Set<string>();
  for (const archivo of archivosDeLaApi()) {
    const texto = fs.readFileSync(archivo, 'utf8');
    for (const re of [/validarCuerpo\(\s*([A-Z][A-Za-z0-9_]*Schema)\b/g, /esquema:\s*([A-Z][A-Za-z0-9_]*Schema)\b/g, /transicionar\(\s*'[^']+',\s*([A-Z][A-Za-z0-9_]*Schema)\b/g]) {
      for (const m of texto.matchAll(re)) nombres.add(m[1]);
    }
  }
  return [...nombres];
}

describe('cotaDeElementos · ningún cuerpo válido queda afuera', () => {
  // El zod del dominio (4.6.6). Un `import 'zod'` desde la API recibiría el de la raíz, que es el 3 de la CLI de Expo (también
  // sus tipos), así que se lo pide desde @be/domain y sin tipos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { z } = require(require.resolve('zod', { paths: [path.dirname(require.resolve('@be/domain'))] })) as { z: any };

  it('nunca da menos que el máximo verdadero, en esquemas donde se lo conoce', () => {
    // [0,0,…,0] en 16 KB: 8.191 números.
    expect(cotaDeElementos(z.array(z.number()), LIMITE_DEL_CUERPO)).toBeGreaterThanOrEqual(8191);
    // {"a":[{"x":""},…]}: cada elemento ocupa 9 caracteres con su coma.
    const conObjetos = z.strictObject({ a: z.array(z.strictObject({ x: z.string() })).max(5000) });
    const real = Math.floor((LIMITE_DEL_CUERPO - tamano({ a: [] }) + 1) / (tamano({ x: '' }) + 1));
    const cuerpo = { a: Array.from({ length: real }, () => ({ x: '' })) };
    expect(tamano(cuerpo)).toBeLessThanOrEqual(LIMITE_DEL_CUERPO);
    expect(conObjetos.safeParse(cuerpo).success).toBe(true);
    expect(cotaDeElementos(conObjetos, tamano(cuerpo))).toBeGreaterThanOrEqual(real);
    // Una URL puede ser muy corta: «a:» es válida.
    expect(z.url().safeParse('a:').success).toBe(true);
    const urls = Array.from({ length: Math.floor((LIMITE_DEL_CUERPO - 1) / 5) }, () => 'a:'); // ["a:",…]: 5n + 1 caracteres
    expect(tamano(urls)).toBeLessThanOrEqual(LIMITE_DEL_CUERPO);
    expect(cotaDeElementos(z.array(z.url()), tamano(urls))).toBeGreaterThanOrEqual(urls.length);
    // Los campos opcionales no cuentan: [{},{},…] es válido.
    const conOpcionales = z.array(z.strictObject({ x: z.string().optional(), y: z.number().default(0) }));
    const vacios = Array.from({ length: Math.floor((LIMITE_DEL_CUERPO - 1) / 3) }, () => ({})); // [{},…]: 3n + 1 caracteres
    expect(conOpcionales.safeParse(vacios).success).toBe(true);
    expect(cotaDeElementos(conOpcionales, tamano(vacios))).toBeGreaterThanOrEqual(vacios.length);
    // Anidadas con topes chicos: el producto manda (5 + 5 × 3).
    expect(cotaDeElementos(z.array(z.array(z.number()).max(3)).max(5), LIMITE_DEL_CUERPO)).toBeGreaterThanOrEqual(20);
    // Un registro no tiene tope: la cota es la de un elemento por carácter.
    expect(cotaDeElementos(z.strictObject({ r: z.record(z.string(), z.number()) }), 100)).toBeGreaterThanOrEqual(100);
  });

  it('cada largo mínimo de formato tiene un ejemplo válido que no lo baja, y la cota lo respeta', () => {
    const ejemplos: [string, unknown, string][] = [
      ['uuid', z.uuid(), '123e4567-e89b-42d3-a456-426614174000'],
      ['guid', z.guid(), '00000000-0000-0000-0000-000000000000'],
      ['ulid', z.ulid(), '01ARZ3NDEKTSV4RRFFQ69G5FAV'],
      ['nanoid', z.nanoid(), 'V1StGXR8_Z5jdHi6B-myT'],
      ['email', z.email(), 'a@b.cd'],
      ['datetime', z.iso.datetime(), '2026-10-24T00:00:00Z'],
      ['date', z.iso.date(), '2026-10-24'],
      ['time', z.iso.time(), '00:00:00'],
      ['url', z.url(), 'a:'],
      ['ipv4', z.ipv4(), '0.0.0.0'],
    ];
    expect(ejemplos.map(([f]) => f).sort()).toEqual(Object.keys(LARGO_DE_FORMATO).sort());
    for (const [formato, schema, ejemplo] of ejemplos) {
      expect([formato, (schema as { safeParse: (v: unknown) => { success: boolean } }).safeParse(ejemplo).success]).toEqual([formato, true]);
      expect([formato, ejemplo.length >= LARGO_DE_FORMATO[formato]]).toEqual([formato, true]);
      const lista = Array.from({ length: Math.floor((LIMITE_DEL_CUERPO - 1) / (ejemplo.length + 3)) }, () => ejemplo);
      expect([formato, cotaDeElementos(z.array(schema), tamano(lista)) >= lista.length]).toEqual([formato, true]);
    }
    // Y la cota usa el formato, no solo «un texto»: cada uuid ocupa 36 + 2 comillas + 1 coma.
    expect(cotaDeElementos(z.array(z.uuid()), LIMITE_DEL_CUERPO)).toBe(Math.floor(LIMITE_DEL_CUERPO / 39));
  });

  it('para cada esquema de entrada de la API, un cuerpo válido de 16 KB no llega al techo', () => {
    const bootstrap = fs.readFileSync(path.resolve(__dirname, '..', 'bootstrap.ts'), 'utf8');
    expect(bootstrap).toMatch(/const LIMITE_DE_CUERPO = '16kb';/); // si cambia el límite, cambia esta cota
    const nombres = esquemasDeEntrada();
    expect(nombres.length).toBeGreaterThan(70);
    const pasados = nombres
      .map((nombre) => {
        const schema = (dominio as unknown as Record<string, object>)[nombre];
        expect(schema).toBeDefined();
        return { nombre, cota: cotaDeElementos(schema, LIMITE_DEL_CUERPO) };
      })
      .filter((c) => c.cota >= MAXIMO_DE_ELEMENTOS);
    expect(pasados).toEqual([]);
  });

  it('validarCuerpo se llama solo con un esquema por nombre, o con el del ejecutor y las transiciones, que la prueba anterior encuentra', () => {
    const raiz = path.resolve(__dirname, '..');
    const llamadas = archivosDeLaApi().flatMap((a) => [...fs.readFileSync(a, 'utf8').matchAll(/validarCuerpo\(\s*([^,\s)]+)/g)].map((m) => `${path.relative(raiz, a).split(path.sep).join('/')}: ${m[1]}`));
    const otras = llamadas.filter((l) => !/: [A-Z][A-Za-z0-9_]*Schema$/.test(l) && l !== 'plataforma/ejecutor.ts: p.esquema' && l !== 'vinculo/vinculos.service.ts: esquema');
    expect(otras).toEqual([]);
  });
});
