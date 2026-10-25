import * as dominio from '@be/domain';
import { ErrorDeApi } from './errores';
import { maximoDeElementos, validarCuerpo } from './validacion';

/**
 * #206, primera observación de la revisión (2026-10-24): **ningún cuerpo que el contrato acepta y que entra en el límite
 * HTTP de 16 KB puede rechazarse por la cota de elementos**.
 *
 * Para los ocho esquemas de planes y plantillas se generan cuerpos válidos de verdad, recorriendo la definición de zod:
 * - los más densos que admite el contrato (los elementos más baratos primero, hasta 16 KB), también rellenados hasta
 *   16.384 bytes exactos;
 * - densos al azar cerca del límite, y variados de cualquier tamaño, con una semilla fija: la CI corre los mismos;
 * - casos de borde: cada lista llena hasta su tope, opcionales presentes y ausentes, `null` explícito, textos al máximo,
 *   unicode y escapes.
 * Cada cuerpo tiene que pasar `safeParse` (si no, es un error del generador y la prueba falla) y ocupar como mucho 16.384
 * bytes. Después, `validarCuerpo` tiene que devolver lo mismo que `safeParse`, y el mismo cuerpo con un campo no declarado
 * tiene que recibir UNKNOWN_FIELD, no TOO_BIG: dentro de lo que admite un cuerpo válido, la validación estricta manda.
 *
 * Los ocho no tienen campos con valor por defecto ni formatos salvo `z.iso.date()`. Los valores por defecto y los demás
 * formatos están probados contra la cota en `validacion.spec.ts`.
 */

const LIMITE = 16 * 1024;
const OCHO = [
  'CrearPlanRequestSchema',
  'EditarBorradorRequestSchema',
  'CrearPlantillaNutricionalRequestSchema',
  'NuevaVersionDePlantillaNutricionalRequestSchema',
  'CrearPlanDeEntrenamientoRequestSchema',
  'EditarPlanDeEntrenamientoRequestSchema',
  'CrearPlantillaDeEntrenamientoRequestSchema',
  'NuevaVersionDePlantillaRequestSchema',
] as const;

// Se recorren los esquemas por su definición interna de zod 4: por eso los `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Esquema = any;
const bytes = (v: unknown): number => Buffer.byteLength(JSON.stringify(v));

/** Pseudoaleatorio con semilla (mulberry32): las mismas corridas en local y en la CI. */
function conSemilla(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Opciones {
  readonly azar: () => number;
  /** `minimo`: el valor válido más corto; `variado`: uno al azar dentro de lo que el contrato acepta. */
  readonly modo: 'minimo' | 'variado';
  /** Los campos opcionales: nunca, siempre, al azar, o solo los que llevan listas (para poder densificar). */
  readonly opcionales: 'nunca' | 'siempre' | 'azar' | 'conListas';
  /** Los textos: los más cortos, al máximo de su largo, al azar, o con unicode y escapes. */
  readonly textos: 'cortos' | 'largos' | 'azar' | 'raros';
  /** Un campo que admite `null`: preferirlo, evitarlo o al azar. */
  readonly nulos: 'preferir' | 'evitar' | 'azar';
  /**
   * Con `opcionales: 'conListas'`, qué listas opcionales lleva cada objeto (un bloque con `sessions` y sin `microcycles`,
   * una prescripción sin `professionalParameters`). Sin esto, las lleva todas. El cuerpo más denso depende de esa forma.
   */
  readonly forma?: (objeto: Esquema, clave: string) => boolean;
}

const elegir = <T>(xs: readonly T[], o: Opciones): T => xs[Math.floor(o.azar() * xs.length)];
const entero = (lo: number, hi: number, o: Opciones): number => lo + Math.floor(o.azar() * (hi - lo + 1));

/** Si el esquema (o lo que lleva adentro) tiene listas. */
const conListasCache = new Map<Esquema, boolean>();
function tieneListas(s: Esquema): boolean {
  if (conListasCache.has(s)) return conListasCache.get(s) as boolean;
  conListasCache.set(s, false);
  const d = s._zod.def;
  let r = false;
  if (d.type === 'array') r = true;
  else if (d.type === 'object') r = Object.values<Esquema>(d.shape).some(tieneListas);
  else if (d.type === 'union') r = d.options.some(tieneListas);
  else if (d.innerType) r = tieneListas(d.innerType);
  conListasCache.set(s, r);
  return r;
}

function controles(s: Esquema): Record<string, Esquema>[] {
  return (s._zod.def.checks ?? []).map((ch: Esquema) => ch._zod.def);
}

const LETRAS = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'];
const RAROS = ['ñ', 'á', 'ü', '"', '\\', '/', '€', 'Ñandú', '\t', '😀'];

function texto(s: Esquema, o: Opciones): string {
  const d = s._zod.def;
  if (d.format === 'date') {
    if (o.modo === 'minimo') return '2026-10-24';
    return `20${entero(10, 39, o)}-${String(entero(1, 12, o)).padStart(2, '0')}-${String(entero(1, 28, o)).padStart(2, '0')}`;
  }
  let min = 0;
  let max = 64;
  let patron: RegExp | null = null;
  for (const c of controles(s)) {
    if (c.check === 'min_length') min = Math.max(min, c.minimum);
    if (c.check === 'max_length') max = Math.min(max === 64 ? c.maximum : max, c.maximum);
    if (c.check === 'string_format' && c.format === 'regex') patron = c.pattern;
  }
  if (!controles(s).some((c) => c.check === 'max_length')) max = 64;
  const valido = (v: string): boolean => s.safeParse(v).success;
  if (patron) {
    // Un patrón (IdDeNodo, TokenDeVersion): candidatos del más corto al más largo, y al azar dentro del patrón.
    const cortos = ['a', 'v1', '1', 'A', '_', 'a1', 'v12', 'ab'];
    if (o.modo === 'minimo' || o.textos === 'cortos') {
      const v = cortos.find(valido);
      if (v !== undefined) return v;
    }
    for (let i = 0; i < 40; i++) {
      const largo = o.textos === 'largos' ? 64 : entero(1, 64, o);
      const v = o.azar() < 0.5 ? `v${entero(1, 99999, o)}` : Array.from({ length: largo }, () => elegir([...LETRAS, '_', '-'], o)).join('');
      if (valido(v)) return v;
    }
    const v = cortos.find(valido);
    if (v === undefined) throw new Error(`el generador no encontró un texto para ${patron}`);
    return v;
  }
  if (o.modo === 'minimo' || o.textos === 'cortos') return 'a'.repeat(min);
  const largo = o.textos === 'largos' ? max : entero(min, Math.min(max, 40), o);
  for (let i = 0; i < 20; i++) {
    let v = Array.from({ length: largo }, (_, j) => (o.textos === 'raros' && j % 3 === 1 ? elegir(RAROS, o) : elegir(LETRAS, o))).join('');
    // Con espacios adentro, que `.trim()` no toca; nunca en los bordes.
    if (largo > 4 && o.azar() < 0.5) v = `${v.slice(0, 2)} ${v.slice(3)}`;
    if (v.length > max) v = v.slice(0, max);
    if (valido(v)) return v;
  }
  return 'a'.repeat(min);
}

function numero(s: Esquema, o: Opciones): number {
  const valido = (v: number): boolean => s.safeParse(v).success;
  if (o.modo === 'minimo') {
    const v = [0, 1, 2, -1].find(valido);
    if (v === undefined) throw new Error('el generador no encontró un número');
    return v;
  }
  let lo = -1000;
  let hi = 1000;
  let entera = false;
  for (const c of controles(s)) {
    if (c.check === 'greater_than') lo = Math.max(lo, c.inclusive ? c.value : c.value + 1);
    if (c.check === 'less_than') hi = Math.min(hi, c.inclusive ? c.value : c.value - 1);
    if (c.check === 'number_format') entera = true;
  }
  for (let i = 0; i < 20; i++) {
    const v = entero(lo, hi, o) + (entera || o.azar() < 0.5 ? 0 : 0.5);
    if (valido(v)) return v;
  }
  return numero(s, { ...o, modo: 'minimo' });
}

function objeto(s: Esquema, o: Opciones): Record<string, unknown> {
  const d = s._zod.def;
  const arma = (opc: Opciones, forzar?: Set<string>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [clave, v] of Object.entries<Esquema>(d.shape)) {
      if (v._zod.optin && !forzar?.has(clave)) {
        const conLista = opc.opcionales === 'conListas' && tieneListas(v) && (opc.forma?.(s, clave) ?? true);
        const incluir = opc.opcionales === 'siempre' || conLista || (opc.opcionales === 'azar' && opc.azar() < 0.5);
        if (!incluir) continue;
      }
      out[clave] = valor(v, opc);
    }
    return out;
  };
  const primero = arma(o);
  if (s.safeParse(primero).success) return primero;
  // Un refinamiento (por ejemplo, un parámetro numérico pide unidad): se prueban otras elecciones, y se queda la más corta.
  const candidatos: Record<string, unknown>[] = [];
  for (let i = 0; i < 30; i++) {
    const otra = arma({ ...o, modo: 'variado', textos: i % 2 ? 'cortos' : o.textos }, new Set(i % 3 === 0 ? Object.keys(d.shape) : []));
    if (s.safeParse(otra).success) candidatos.push(otra);
  }
  if (candidatos.length === 0) throw new Error(`el generador no armó un objeto válido (${Object.keys(d.shape).join(', ')})`);
  return candidatos.sort((a, b) => bytes(a) - bytes(b))[0];
}

function lista(s: Esquema, o: Opciones): unknown[] {
  let min = 0;
  for (const c of controles(s)) if (c.check === 'min_length') min = Math.max(min, c.minimum);
  const largo = o.modo === 'minimo' ? min : entero(min, Math.max(min, Math.min(topeDe(s), 2)), o);
  return Array.from({ length: largo }, () => valor(s._zod.def.element, o));
}

function topeDe(s: Esquema): number {
  let max = Infinity;
  for (const c of controles(s)) {
    if (c.check === 'max_length') max = Math.min(max, c.maximum);
    if (c.check === 'length_equals') max = Math.min(max, c.length);
  }
  return max;
}

function valor(s: Esquema, o: Opciones): unknown {
  const d = s._zod.def;
  switch (d.type) {
    case 'string':
      return texto(s, o);
    case 'number':
      return numero(s, o);
    case 'boolean':
      return o.modo === 'minimo' ? true : o.azar() < 0.5;
    case 'enum': {
      const vs = Object.values(d.entries);
      return o.modo === 'minimo' ? vs.sort((a, b) => JSON.stringify(a).length - JSON.stringify(b).length)[0] : elegir(vs, o);
    }
    case 'literal':
      return d.values[0];
    case 'null':
      return null;
    case 'nullable': {
      // Para densificar, lo que lleva listas va con su objeto (la agenda), aunque se prefiera `null` en lo demás.
      if (o.opcionales === 'conListas' && tieneListas(d.innerType)) return valor(d.innerType, o);
      if (o.nulos === 'preferir') return null;
      if (o.nulos === 'azar' && o.azar() < 0.4) return null;
      const adentro = valor(d.innerType, o);
      // El mínimo: `null` (4 caracteres) salvo que lo de adentro sea más corto (un número de una cifra).
      return o.modo === 'minimo' && o.nulos !== 'evitar' && bytes(adentro) >= 4 ? null : adentro;
    }
    case 'optional':
    case 'default':
    case 'prefault':
    case 'readonly':
    case 'nonoptional':
      return valor(d.innerType, o);
    case 'object':
      return objeto(s, o);
    case 'array':
      return lista(s, o);
    case 'union': {
      const validos = d.options.map((op: Esquema) => valor(op, o)).filter((v: unknown, i: number) => d.options[i].safeParse(v).success);
      if (validos.length === 0) throw new Error('el generador no armó ninguna opción válida de una unión');
      return o.modo === 'minimo' ? validos.sort((a: unknown, b: unknown) => bytes(a) - bytes(b))[0] : elegir(validos, o);
    }
    default:
      throw new Error(`el generador no sabe armar un ${d.type}`);
  }
}

/** Una lista del cuerpo que todavía puede crecer, con el esquema de sus elementos. */
interface Hueco {
  readonly lista: unknown[];
  readonly elemento: Esquema;
  readonly tope: number;
}
function huecos(v: unknown, s: Esquema, salida: Hueco[]): void {
  const d = s._zod.def;
  if (v === null || v === undefined) return;
  if (d.type === 'array' && Array.isArray(v)) {
    salida.push({ lista: v, elemento: d.element, tope: topeDe(s) });
    for (const e of v) huecos(e, d.element, salida);
  } else if (d.type === 'object' && typeof v === 'object') {
    for (const [clave, x] of Object.entries(v as Record<string, unknown>)) if (d.shape[clave]) huecos(x, d.shape[clave], salida);
  } else if (d.type === 'union') {
    const op = d.options.find((x: Esquema) => x.safeParse(v).success);
    if (op) huecos(v, op, salida);
  } else if (d.innerType) huecos(v, d.innerType, salida);
}

/**
 * Agrega elementos hasta `objetivo` bytes. `barato`: siempre el elemento más barato que entra (el cuerpo más denso);
 * `profundo`: llena primero la lista que se abrió última (cada lista hasta su tope); `azar`: un hueco al azar.
 */
function densificar(cuerpo: unknown, s: Esquema, objetivo: number, o: Opciones, estrategia: 'barato' | 'profundo' | 'azar'): void {
  let tam = bytes(cuerpo);
  const abiertos: Hueco[] = [];
  huecos(cuerpo, s, abiertos);
  const minimos = new Map<Esquema, { valor: unknown; bytes: number }>();
  const minimoDe = (e: Esquema): { valor: unknown; bytes: number } => {
    let m = minimos.get(e);
    if (!m) {
      // El elemento más corto que todavía puede crecer: con sus listas opcionales, vacías (un bloque con `microcycles: []`).
      const v = valor(e, { ...o, modo: 'minimo', opcionales: 'conListas', textos: 'cortos', nulos: o.nulos === 'azar' ? 'preferir' : o.nulos });
      m = { valor: v, bytes: bytes(v) };
      minimos.set(e, m);
    }
    return m;
  };
  const costo = (h: Hueco): number => minimoDe(h.elemento).bytes + (h.lista.length ? 1 : 0);
  const masBarato = (vivos: Hueco[]): Hueco => vivos.reduce((a, b) => (costo(b) < costo(a) ? b : a));
  for (let paso = 0; paso < 20_000; paso++) {
    const vivos = abiertos.filter((h) => h.lista.length < h.tope);
    if (vivos.length === 0) return;
    let h = estrategia === 'barato' ? masBarato(vivos) : estrategia === 'profundo' ? vivos[vivos.length - 1] : elegir(vivos, o);
    let nuevo = estrategia === 'barato' || o.modo === 'minimo' || o.azar() < 0.6 ? structuredClone(minimoDe(h.elemento).valor) : valor(h.elemento, o);
    let delta = bytes(nuevo) + (h.lista.length ? 1 : 0);
    if (tam + delta > objetivo) {
      // Si no entra, se prueba lo más barato de cualquier hueco; si tampoco, se terminó.
      h = masBarato(vivos);
      delta = costo(h);
      if (tam + delta > objetivo) return;
      nuevo = structuredClone(minimoDe(h.elemento).valor);
    }
    tam += delta;
    h.lista.push(nuevo);
    huecos(nuevo, h.elemento, abiertos);
  }
}

/**
 * El cuerpo más denso que se pueda armar, por paquetes. El paquete de un elemento es el elemento con sus listas internas
 * llenas hasta el tope, pero solo las que bajan sus bytes por elemento: una prescripción con sus 20 series (22,5 bytes por
 * elemento) conviene más que otra sesión vacía (33), y un ítem (62) no conviene dentro de una opción (25). Se llenan
 * primero las listas de paquete más denso, y el último paquete, a medias. Mirar solo el elemento más barato no llega:
 * llena sesiones vacías.
 */
function densificarPorPaquetes(cuerpo: unknown, s: Esquema, objetivo: number, o: Opciones): void {
  const minimos = new Map<Esquema, unknown>();
  const minimoDe = (e: Esquema): unknown => {
    if (!minimos.has(e)) minimos.set(e, valor(e, { ...o, modo: 'minimo', opcionales: 'conListas', textos: 'cortos' }));
    return structuredClone(minimos.get(e));
  };
  const paquetes = new Map<Esquema, { bytes: number; elementos: number; llenar: Set<Esquema> }>();
  const paquete = (e: Esquema, pila: Set<Esquema> = new Set()): { bytes: number; elementos: number; llenar: Set<Esquema> } => {
    const ya = paquetes.get(e);
    if (ya) return ya;
    const base = minimoDe(e);
    let total = { bytes: bytes(base) + 1, elementos: 1 };
    const llenar = new Set<Esquema>();
    if (!pila.has(e)) {
      const hijos: Hueco[] = [];
      huecos(base, e, hijos);
      const conPaquete = hijos.map((h) => ({ h, p: paquete(h.elemento, new Set(pila).add(e)) })).sort((a, b) => a.p.bytes / a.p.elementos - b.p.bytes / b.p.elementos);
      for (const { h, p } of conPaquete) {
        if (p.bytes / p.elementos >= total.bytes / total.elementos || !Number.isFinite(h.tope)) continue;
        total = { bytes: total.bytes + h.tope * p.bytes, elementos: total.elementos + h.tope * p.elementos };
        llenar.add(h.elemento);
      }
    }
    const r = { ...total, llenar };
    paquetes.set(e, r);
    return r;
  };
  let restante = objetivo - bytes(cuerpo);
  /** Llena una lista con elementos y sus paquetes, mientras entren. */
  const llenarLista = (h: Hueco): void => {
    const p = paquete(h.elemento);
    while (h.lista.length < h.tope) {
      const nuevo = minimoDe(h.elemento);
      const costo = bytes(nuevo) + (h.lista.length ? 1 : 0);
      if (costo > restante) return;
      h.lista.push(nuevo);
      restante -= costo;
      const hijos: Hueco[] = [];
      huecos(nuevo, h.elemento, hijos);
      for (const hijo of hijos.filter((x) => p.llenar.has(x.elemento)).sort((a, b) => paquete(a.elemento).bytes / paquete(a.elemento).elementos - paquete(b.elemento).bytes / paquete(b.elemento).elementos)) llenarLista(hijo);
    }
  };
  const raices: Hueco[] = [];
  huecos(cuerpo, s, raices);
  for (const h of raices.sort((a, b) => paquete(a.elemento).bytes / paquete(a.elemento).elementos - paquete(b.elemento).bytes / paquete(b.elemento).elementos)) llenarLista(h);
  // Lo que sobra, con el elemento más barato que entre.
  densificar(cuerpo, s, objetivo, o, 'barato');
}

/** Alarga textos libres (sin patrón ni formato) hasta que el cuerpo ocupe `objetivo` bytes. Devuelve si llegó justo. */
function rellenar(cuerpo: unknown, s: Esquema, objetivo: number): boolean {
  const crecibles: { duenio: Record<string, unknown>; clave: string; max: number }[] = [];
  const buscar = (v: unknown, x: Esquema): void => {
    const d = x._zod.def;
    if (v === null || v === undefined) return;
    if (d.type === 'object' && typeof v === 'object') {
      for (const [clave, campo] of Object.entries(v as Record<string, unknown>)) {
        let e = d.shape[clave];
        if (!e) continue;
        while (e._zod.def.innerType) e = e._zod.def.innerType;
        if (e._zod.def.type === 'string' && typeof campo === 'string' && !e._zod.def.format && !controles(e).some((c) => c.check === 'string_format')) {
          const max = topeDe(e);
          if (Number.isFinite(max) && campo.length < max) crecibles.push({ duenio: v as Record<string, unknown>, clave, max });
        } else buscar(campo, d.shape[clave]);
      }
    } else if (d.type === 'array' && Array.isArray(v)) for (const e of v) buscar(e, d.element);
    else if (d.type === 'union') {
      const op = d.options.find((y: Esquema) => y.safeParse(v).success);
      if (op) buscar(v, op);
    } else if (d.innerType) buscar(v, d.innerType);
  };
  buscar(cuerpo, s);
  let falta = objetivo - bytes(cuerpo);
  for (const c of crecibles.sort((a, b) => b.max - a.max)) {
    if (falta <= 0) break;
    const actual = c.duenio[c.clave] as string;
    const agregar = Math.min(falta, c.max - actual.length);
    c.duenio[c.clave] = actual + 'a'.repeat(agregar);
    falta -= agregar;
  }
  return bytes(cuerpo) === objetivo;
}

/** Los elementos de las listas, sumando las anidadas: lo mismo que cuenta validarCuerpo. */
function elementos(v: unknown): number {
  if (Array.isArray(v)) return v.length + v.reduce((a: number, e) => a + elementos(e), 0);
  if (v !== null && typeof v === 'object') return Object.values(v).reduce((a: number, e) => a + elementos(e), 0);
  return 0;
}

interface Caso {
  readonly nombre: string;
  readonly cuerpo: unknown;
}
function casos(s: Esquema, semillaBase: number): Caso[] {
  const salida: Caso[] = [];
  const base = (azar: () => number): Opciones => ({ azar, modo: 'minimo', opcionales: 'conListas', textos: 'cortos', nulos: 'preferir' });
  // 1. El mínimo absoluto: solo lo obligatorio.
  salida.push({ nombre: 'mínimo', cuerpo: valor(s, { ...base(conSemilla(semillaBase)), opcionales: 'nunca' }) });
  // 2. El más denso: siempre el elemento más barato, hasta 16 KB; y rellenado hasta 16.384 bytes exactos.
  for (const nulos of ['preferir', 'evitar'] as const) {
    const o = { ...base(conSemilla(semillaBase + 1)), nulos };
    const denso = valor(s, o);
    densificar(denso, s, LIMITE, o, 'barato');
    salida.push({ nombre: `denso (${nulos} null)`, cuerpo: denso });
    const relleno = structuredClone(denso);
    rellenar(relleno, s, LIMITE);
    salida.push({ nombre: `denso y rellenado (${nulos} null)`, cuerpo: relleno });
  }
  // 2 bis. El más denso con otras formas: qué listas opcionales lleva cada objeto, una por una y al azar (con semilla).
  const opcionalesConListas = new Set<string>();
  const anotar = (x: Esquema, pila: Set<Esquema>): void => {
    if (pila.has(x)) return;
    const p = new Set(pila).add(x);
    const d = x._zod.def;
    if (d.type === 'object') {
      for (const [k, v] of Object.entries<Esquema>(d.shape)) {
        if (v._zod.optin && tieneListas(v)) opcionalesConListas.add(k);
        anotar(v, p);
      }
    } else if (d.type === 'array') anotar(d.element, p);
    else if (d.type === 'union') d.options.forEach((o: Esquema) => anotar(o, p));
    else if (d.innerType) anotar(d.innerType, p);
  };
  anotar(s, new Set());
  const formas: ((objeto: Esquema, clave: string) => boolean)[] = [...opcionalesConListas].map((sola) => (_o: Esquema, clave: string) => clave === sola || !opcionalesConListas.has(clave));
  formas.push(...[...opcionalesConListas].map((sin) => (_o: Esquema, clave: string) => clave !== sin));
  for (let i = 0; i < 6; i++) {
    const azar = conSemilla(semillaBase + 500 + i);
    const decision = new Map<string, boolean>();
    formas.push((_o: Esquema, clave: string) => {
      if (!decision.has(clave)) decision.set(clave, azar() < 0.5);
      return decision.get(clave) as boolean;
    });
  }
  formas.forEach((f, i) => {
    // La raíz lleva siempre su estructura (y la agenda): la forma se elige adentro.
    const forma = (objeto: Esquema, clave: string): boolean => objeto === s || f(objeto, clave);
    const o = { ...base(conSemilla(semillaBase + 600 + i)), forma };
    const cuerpo = valor(s, o);
    densificar(cuerpo, s, LIMITE, o, 'barato');
    salida.push({ nombre: `denso con otra forma ${i}`, cuerpo });
    const porPaquetes = valor(s, o);
    densificarPorPaquetes(porPaquetes, s, LIMITE, o);
    salida.push({ nombre: `denso por paquetes, forma ${i}`, cuerpo: porPaquetes });
    if (i % 2 === 0) {
      const relleno = structuredClone(porPaquetes);
      rellenar(relleno, s, LIMITE);
      salida.push({ nombre: `denso por paquetes y rellenado, forma ${i}`, cuerpo: relleno });
    }
  });
  for (const nulos of ['preferir', 'evitar'] as const) {
    const o = { ...base(conSemilla(semillaBase + 700)), nulos };
    const porPaquetes = valor(s, o);
    densificarPorPaquetes(porPaquetes, s, LIMITE, o);
    salida.push({ nombre: `denso por paquetes (${nulos} null)`, cuerpo: porPaquetes });
  }
  // 3. Cada lista hasta su tope, llenando primero la más profunda.
  {
    const o = base(conSemilla(semillaBase + 2));
    const profundo = valor(s, o);
    densificar(profundo, s, LIMITE, o, 'profundo');
    salida.push({ nombre: 'cada lista hasta su tope', cuerpo: profundo });
  }
  // 4. Densos al azar cerca del límite: elementos mínimos y variados mezclados, la mitad rellenados a 16.384 bytes.
  for (let i = 0; i < 24; i++) {
    const azar = conSemilla(semillaBase + 100 + i);
    const o: Opciones = { azar, modo: 'variado', opcionales: i % 4 === 0 ? 'siempre' : 'conListas', textos: elegir(['cortos', 'azar', 'raros'] as const, { ...base(azar) }), nulos: elegir(['preferir', 'evitar', 'azar'] as const, { ...base(azar) }) };
    const cuerpo = valor(s, { ...o, opcionales: o.opcionales === 'siempre' ? 'siempre' : 'conListas' });
    densificar(cuerpo, s, LIMITE - Math.floor(azar() * 400), o, i % 3 === 0 ? 'barato' : 'azar');
    if (i % 2 === 0) rellenar(cuerpo, s, LIMITE);
    salida.push({ nombre: `denso al azar ${i}`, cuerpo });
  }
  // 5. Variados de cualquier tamaño: opcionales, nulos y textos al azar, también al máximo o con unicode y escapes.
  for (let i = 0; i < 40; i++) {
    const azar = conSemilla(semillaBase + 1000 + i);
    const o: Opciones = { azar, modo: 'variado', opcionales: elegir(['siempre', 'azar', 'conListas'] as const, base(azar)), textos: elegir(['cortos', 'largos', 'azar', 'raros'] as const, base(azar)), nulos: elegir(['preferir', 'evitar', 'azar'] as const, base(azar)) };
    const cuerpo = valor(s, o);
    densificar(cuerpo, s, 300 + Math.floor(azar() * (LIMITE - 300)), o, 'azar');
    salida.push({ nombre: `variado ${i}`, cuerpo });
  }
  return salida;
}

interface Resumen {
  cuerpos: number;
  /** Los que el generador armó de más de 16 KB (textos largos): válidos, pero fuera del límite HTTP, así que no cuentan. */
  fueraDelLimite: number;
  cercaDelLimite: number;
  justo: number;
  maxElementos: number;
  menorMargen: number;
}
const resumenes = new Map<string, Resumen>();

describe('#206 · la cota de elementos no rechaza ningún cuerpo válido de hasta 16 KB', () => {
  afterAll(() => {
    // Lo que se probó, para la evidencia del PR.
    const lineas = [...resumenes].map(([n, r]) => `  ${n}: ${r.cuerpos} cuerpos válidos de hasta 16 KB (${r.fueraDelLimite} más, de más de 16 KB, no cuentan) · ${r.cercaDelLimite} de 15 KB o más · ${r.justo} de 16.384 bytes justos · hasta ${r.maxElementos} elementos · margen mínimo contra el máximo: ${r.menorMargen}`);
    process.stdout.write(`\nCuerpos válidos probados contra validarCuerpo:\n${lineas.join('\n')}\n`);
  });

  it.each(OCHO.map((n, i) => [n, i] as const))('%s', (nombre, i) => {
    const schema = (dominio as unknown as Record<string, Esquema>)[nombre];
    const r: Resumen = { cuerpos: 0, fueraDelLimite: 0, cercaDelLimite: 0, justo: 0, maxElementos: 0, menorMargen: Infinity };
    for (const { nombre: caso, cuerpo } of casos(schema, 7919 * (i + 1))) {
      const parseado = schema.safeParse(cuerpo);
      // Tiene que ser un cuerpo que el contrato acepta: si no, el generador está mal.
      expect([caso, parseado.success, parseado.success ? '' : JSON.stringify(parseado.error.issues.slice(0, 2))]).toEqual([caso, true, '']);
      const tam = bytes(cuerpo);
      // Más de 16 KB no llega a validarCuerpo: el body parser lo rechaza antes.
      if (tam > LIMITE) {
        r.fueraDelLimite += 1;
        continue;
      }
      // Lo mismo que safeParse, sin TOO_BIG.
      let devuelto: unknown;
      try {
        devuelto = validarCuerpo(schema, cuerpo);
      } catch (e) {
        const detalle = e instanceof ErrorDeApi ? `${e.code} ${JSON.stringify(e.details)}` : String(e);
        throw new Error(`${nombre} · ${caso}: validarCuerpo rechazó un cuerpo válido de ${tam} bytes con ${elementos(cuerpo)} elementos (${detalle})`);
      }
      expect(devuelto).toEqual(parseado.data);
      // Y con un campo no declarado, la validación estricta lo informa: dentro de la cota no hay TOO_BIG.
      try {
        validarCuerpo(schema, { ...(cuerpo as object), campoNoDeclarado: 1 });
        throw new Error(`${caso}: aceptó un campo no declarado`);
      } catch (e) {
        expect([caso, e instanceof ErrorDeApi ? e.code : String(e)]).toEqual([caso, 'UNKNOWN_FIELD']);
      }
      const n = elementos(cuerpo);
      r.cuerpos += 1;
      if (tam >= 15 * 1024) r.cercaDelLimite += 1;
      if (tam === LIMITE) r.justo += 1;
      r.maxElementos = Math.max(r.maxElementos, n);
      r.menorMargen = Math.min(r.menorMargen, maximoDeElementos(schema, cuerpo) - n);
    }
    resumenes.set(nombre, r);
    // Que haya de verdad cuerpos cerca del límite y al límite justo, y no solo chicos.
    expect(r.cercaDelLimite).toBeGreaterThanOrEqual(20);
    expect(r.justo).toBeGreaterThanOrEqual(5);
    expect(r.menorMargen).toBeGreaterThanOrEqual(0);
  });
});
