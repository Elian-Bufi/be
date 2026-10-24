/**
 * La cota de elementos de listas de un cuerpo VÁLIDO, para que `validarCuerpo` corte antes de zod un cuerpo que no puede
 * serlo (riesgo residual de GHSA-mrhx-c7xc-m3w5, 2026-10-24).
 *
 * La idea. Cada elemento de una lista válida ocupa al menos sus bytes PROPIOS: sus campos obligatorios con el valor más
 * corto que el esquema acepta, y sus listas internas vacías. Esos bytes no se comparten entre elementos, así que en un
 * cuerpo de N caracteres Σ cantidad × (propio + 1) ≤ N, y cada lista no pasa el producto de los topes de su camino. El
 * máximo de Σ cantidad con esas condiciones sale llenando primero los elementos más baratos (mochila fraccionaria).
 * Pedir menos de lo que pide el esquema solo agranda la cota: todo lo que no se sabe medir cuenta como 0 bytes.
 *
 * Se lee la definición interna de los esquemas de zod 4 (`_zod.def`), la que zod documenta para quien recorre esquemas.
 * `validacion.spec.ts` prueba la cota contra máximos conocidos y contra cada esquema de entrada de la API.
 */

interface Lista {
  /** Cuántos elementos puede tener en todo el cuerpo: el producto de los topes de su camino. */
  readonly producto: number;
  /** Los bytes propios mínimos de cada elemento. */
  readonly propio: number;
}

/** La definición interna de un esquema de zod 4: se lee con cuidado, campo por campo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- la forma de `def` cambia con cada tipo de esquema
type Definicion = any;
type Esquema = { _zod?: { def: Definicion; optin?: string } } | undefined;

/** Los que validan su entrada con el esquema de adentro. `catch` y `success` no: aceptan cualquier entrada. */
const ENVOLTORIOS = new Set(['optional', 'nullable', 'default', 'prefault', 'nonoptional', 'readonly']);
/**
 * El largo mínimo de cada formato de texto de zod: cotas inferiores, cada una con un ejemplo válido de ese largo o más en
 * `validacion.spec.ts` (una URL puede ser `a:`). Un formato que no está acá cuenta como texto de cualquier largo.
 */
export const LARGO_DE_FORMATO: Readonly<Record<string, number>> = { uuid: 36, guid: 36, ulid: 26, nanoid: 21, email: 3, datetime: 16, date: 10, time: 5, url: 2, ipv4: 7 };

const largoDeFormato = (formato: unknown): number => (typeof formato === 'string' && formato in LARGO_DE_FORMATO ? LARGO_DE_FORMATO[formato] : 0);

/** En zod 4, `z.uuid()` y los demás formatos llevan el formato en su propia definición; `.min()` y `.regex()`, en `checks`. */
function largoMinimoDeTexto(def: { format?: unknown; checks?: { _zod: { def: Record<string, unknown> } }[] }): number {
  let largo = largoDeFormato(def.format);
  for (const ch of def.checks ?? []) {
    const c = ch._zod.def;
    if (c.check === 'min_length') largo = Math.max(largo, c.minimum as number);
    else if (c.check === 'length_equals') largo = Math.max(largo, c.length as number);
    else if (c.check === 'string_format') largo = Math.max(largo, largoDeFormato(c.format));
  }
  return largo;
}

/** Cota inferior del tamaño en JSON de un valor válido de `s`, con sus listas vacías. */
function minimo(s: Esquema, pila: ReadonlySet<Esquema>): number {
  if (!s?._zod || pila.has(s)) return 0;
  const p = new Set(pila).add(s);
  const d = s._zod.def;
  switch (d.type) {
    case 'string':
      return 2 + largoMinimoDeTexto(d);
    case 'number':
    case 'int':
      return 1;
    case 'boolean':
    case 'null':
      return 4;
    case 'enum':
      return Math.min(...Object.values(d.entries as Record<string, unknown>).map((v) => JSON.stringify(v).length));
    case 'literal':
      return Math.min(...(d.values as unknown[]).map((v) => (v === undefined ? 0 : JSON.stringify(v).length)));
    case 'object': {
      let total = 2;
      let campos = 0;
      for (const [clave, v] of Object.entries(d.shape as Record<string, Esquema>)) {
        // Un campo que se puede omitir no cuenta: zod lo marca con `optin` («optional», o «defaulted» si tiene valor por defecto).
        if (v?._zod?.optin) continue;
        total += JSON.stringify(clave).length + 1 + minimo(v, p);
        campos += 1;
      }
      return total + Math.max(0, campos - 1);
    }
    case 'array':
      return 2;
    case 'tuple':
      return 2;
    case 'union':
      return Math.min(...(d.options as Esquema[]).map((o) => minimo(o, p)));
    case 'intersection':
      return Math.max(minimo(d.left, p), minimo(d.right, p));
    case 'pipe':
      return minimo(d.in, p);
    case 'lazy':
      return minimo(d.getter(), p);
    case 'nullable':
      return Math.min(4, minimo(d.innerType, p));
    default:
      return ENVOLTORIOS.has(d.type) ? minimo(d.innerType, p) : 0;
  }
}

/** El tope que zod 4.6.6 aplica antes de validar los elementos: los controles de tamaño que van primero (util.sizeCaps). */
function tope(def: { checks?: { _zod: { def: Record<string, unknown> } }[] }): number {
  const topes: number[] = [];
  for (const ch of def.checks ?? []) {
    const c = ch._zod.def;
    if (!/_(length|size)$|_equals$/.test(String(c.check))) break;
    const max = (c.maximum ?? c.length ?? c.size) as number | undefined;
    if (typeof max === 'number' && max >= 0) topes.push(max);
  }
  return topes.length ? Math.min(...topes) : Infinity;
}

/**
 * Lo que puede traer contenido de cualquier forma, listas incluidas, en un cuerpo válido. Cuenta como una lista sin tope y
 * de 0 bytes: con eso, la cota de ese esquema pasa el techo y `validacion.spec.ts` lo hace notar, en vez de dejar afuera
 * cuerpos válidos. Ninguno de los esquemas de entrada del 2026-10-24 usa estos tipos.
 */
const SIN_FORMA = new Set(['record', 'map', 'set', 'unknown', 'any', 'custom', 'transform', 'catch', 'success']);

/** Las listas de un esquema, de la más barata a la más cara. */
function listasDe(schema: Esquema): Lista[] {
  const listas: Lista[] = [];
  const sinTope = (): void => {
    listas.push({ producto: Infinity, propio: 0 });
  };
  const recorrer = (s: Esquema, producto: number, pila: ReadonlySet<Esquema>): void => {
    if (!s?._zod) return;
    // Un esquema recursivo, o demasiado profundo para seguirlo, puede anidar listas sin fin.
    if (pila.has(s) || pila.size > 40) return sinTope();
    const p = new Set(pila).add(s);
    const d = s._zod.def;
    if (d.type === 'object') {
      // Solo un objeto estricto rechaza las claves de más: z.object las descarta y z.looseObject las deja pasar, con lo que traigan.
      if (d.catchall?._zod?.def?.type !== 'never') sinTope();
      for (const v of Object.values(d.shape as Record<string, Esquema>)) recorrer(v, producto, p);
    } else if (d.type === 'array') {
      const n = producto * tope(d);
      listas.push({ producto: n, propio: minimo(d.element, new Set()) });
      recorrer(d.element, n, p);
    } else if (d.type === 'tuple') {
      const items = d.items as Esquema[];
      listas.push({ producto: producto * (d.rest ? Infinity : items.length), propio: 0 });
      for (const it of items) recorrer(it, producto, p);
      if (d.rest) recorrer(d.rest, Infinity, p);
    } else if (d.type === 'union') for (const o of d.options as Esquema[]) recorrer(o, producto, p);
    else if (d.type === 'intersection') {
      recorrer(d.left, producto, p);
      recorrer(d.right, producto, p);
    } else if (d.type === 'pipe') {
      // Las listas que trae el cuerpo las valida la entrada. Si la entrada es una transformación (un preprocess), ya cuenta
      // sin tope; lo que arma la salida no está en el cuerpo.
      recorrer(d.in, producto, p);
    } else if (d.type === 'lazy') recorrer(d.getter(), producto, p);
    else if (SIN_FORMA.has(d.type)) sinTope();
    else if (ENVOLTORIOS.has(d.type)) recorrer(d.innerType, producto, p);
  };
  recorrer(schema, 1, new Set());
  return listas.sort((a, b) => a.propio - b.propio);
}

const listasPorEsquema = new WeakMap<object, Lista[]>();

/** Cuántos elementos de listas puede tener, como máximo, un cuerpo válido de `schema` con `caracteres` caracteres de JSON. */
export function cotaDeElementos(schema: object, caracteres: number): number {
  let listas = listasPorEsquema.get(schema);
  if (!listas) {
    listas = listasDe(schema as Esquema);
    listasPorEsquema.set(schema, listas);
  }
  let restante = caracteres;
  let total = 0;
  for (const l of listas) {
    if (restante <= 0) break;
    const k = Math.min(l.producto, Math.floor(restante / (l.propio + 1)));
    total += k;
    restante -= k * (l.propio + 1);
  }
  return total;
}
