/**
 * ED-61 · Sin conflicto falso por una respuesta perdida (WP-EDITORES-PROFESIONAL; V3 X-02).
 *
 * Un guardado puede llegar al servidor y perder la respuesta en el camino. El siguiente guardado manda la versión vieja
 * y recibe un 409: antes, el editor lo comparaba con lo que acababa de mandar, con los identificadores incluidos, y si el
 * profesional había seguido escribiendo decía «cambió en otra pestaña». «Cargar la versión guardada» descartaba entonces
 * lo escrito después: una pérdida de datos.
 *
 * Ahora el editor guarda cada cuerpo que mandó sin respuesta y, ante el 409, relee la versión y la compara con ellos:
 * - **sin los identificadores que pone el servidor** (un bloque, una sesión o una comida nuevos los reciben al
 *   guardarse) y sin lo que no cambia el contenido (un valor vacío, `null` o una lista vacía, que el servidor completa);
 * - si coincide con uno, lo guardado es lo de esta pantalla: el editor adopta la versión del servidor (su token y los
 *   identificadores nuevos, `conLosIdentificadoresNuevos`) y vuelve a mandar lo escrito después, sin conflicto;
 * - si no coincide con ninguno, es un conflicto real (DL-148), y «Cargar la versión guardada» avisa que reemplaza lo
 *   que está en pantalla.
 *
 * Sin React ni red: lo usan los dos editores de planes, y la prueba lo recorre con estructuras sintéticas.
 */

/** Los identificadores que el servidor pone a cada parte de un plan: los de Entrenamiento y los de Nutrición. */
export const IDENTIFICADORES_DEL_SERVIDOR: readonly string[] = ['blockId', 'microcycleId', 'sessionId', 'prescriptionId', 'dayTypeId', 'mealId', 'optionId', 'itemId'];

/** Lo que una pantalla mandó en un guardado, o lo que quedó guardado, en la forma que se compara. */
export interface CuerpoDelGuardado {
  /** Los bloques (Entrenamiento) o los días tipo (Nutrición), como entrada del PATCH. */
  readonly estructura: unknown;
  readonly proximaRevision: string | null;
  /** La agenda de Entrenamiento (DL-137); en Nutrición, ausente. Se compara con sus identificadores: nombra sesiones. */
  readonly agenda?: unknown;
  /** La versión del objetivo con la que queda el borrador. */
  readonly objetivo: string | null;
}

const vacio = (v: unknown): boolean => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

/** El contenido, con las claves en orden y sin lo vacío; sin los identificadores del servidor, si se pide. */
function contenido(x: unknown, sinIdentificadores: boolean): unknown {
  if (Array.isArray(x)) return x.map((y) => contenido(y, sinIdentificadores));
  if (x === null || typeof x !== 'object') return x;
  const salida: Record<string, unknown> = {};
  for (const k of Object.keys(x).sort()) {
    if (sinIdentificadores && IDENTIFICADORES_DEL_SERVIDOR.includes(k)) continue;
    const v = (x as Record<string, unknown>)[k];
    if (!vacio(v)) salida[k] = contenido(v, sinIdentificadores);
  }
  return salida;
}

/** La huella del contenido de un guardado: dos cuerpos con la misma huella guardan lo mismo. */
export function huellaDelGuardado(c: CuerpoDelGuardado): string {
  return JSON.stringify({
    estructura: contenido(c.estructura, true),
    proximaRevision: c.proximaRevision || null,
    agenda: contenido(c.agenda ?? null, false) ?? null,
    objetivo: c.objetivo ?? null,
  });
}

/** Cuál de los cuerpos que esta pantalla mandó sin respuesta es lo que quedó guardado; -1 si ninguno: un conflicto real. */
export function cualMande(guardado: CuerpoDelGuardado, mandados: readonly CuerpoDelGuardado[]): number {
  const huella = huellaDelGuardado(guardado);
  return mandados.findIndex((m) => huellaDelGuardado(m) === huella);
}

const esObjeto = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x);

/** Todos los identificadores del servidor que aparecen en un valor. */
function identificadoresEn(x: unknown, en: Set<string>): Set<string> {
  if (Array.isArray(x)) for (const y of x) identificadoresEn(y, en);
  else if (esObjeto(x)) {
    for (const [k, v] of Object.entries(x)) {
      if (IDENTIFICADORES_DEL_SERVIDOR.includes(k) && typeof v === 'string') en.add(v);
      else identificadoresEn(v, en);
    }
  }
  return en;
}

/** El identificador propio de una parte (cada una tiene uno solo de la lista), o `undefined` si todavía no lo tiene. */
const claveDe = (x: Record<string, unknown>): string | undefined => IDENTIFICADORES_DEL_SERVIDOR.find((k) => typeof x[k] === 'string');

/**
 * Lo que está en pantalla, con los identificadores que creó el guardado perdido (EDT-03). Lo mandado y lo guardado tienen
 * el mismo contenido (`cualMande`), así que van parte por parte en el mismo orden; lo de pantalla, no: después del envío
 * se pudo agregar, quitar, mover o cambiar algo. Por eso:
 * - una parte que ya tenía identificador se busca por él en lo mandado, y sus partes nuevas, adentro de ella;
 * - una parte nueva recibe los identificadores de la parte nueva que se mandó con **el mismo contenido** (primero la de
 *   su lugar), y sus partes, los de las suyas. Una parte que cambió después del envío no recibe ninguno: el guardado
 *   siguiente la crea de nuevo, con lo que está en pantalla.
 * Así nunca se asigna un identificador a otra parte, ninguno queda repetido y lo escrito después no cambia.
 */
export function conLosIdentificadoresNuevos<T>(enPantalla: T, mandado: unknown, guardado: unknown): T {
  const usados = identificadoresEn(mandado, identificadoresEn(enPantalla, new Set()));
  const huella = (x: unknown): string => JSON.stringify(contenido(x, true));

  /** Los identificadores de `g` en `p`, que tiene su mismo contenido: van en el mismo lugar, en cada parte. */
  const copiar = (p: unknown, g: unknown): unknown => {
    if (Array.isArray(p)) return Array.isArray(g) ? p.map((x, i) => copiar(x, g[i])) : p;
    if (!esObjeto(p) || !esObjeto(g)) return p;
    const salida: Record<string, unknown> = { ...p };
    for (const k of IDENTIFICADORES_DEL_SERVIDOR) {
      const id = g[k];
      if (typeof id === 'string' && salida[k] === undefined && !usados.has(id)) {
        salida[k] = id;
        usados.add(id);
      }
    }
    for (const [k, v] of Object.entries(salida)) if (v !== null && typeof v === 'object') salida[k] = copiar(v, g[k]);
    return salida;
  };

  /** Una lista de partes de pantalla, cada una con su par en lo mandado (y en lo guardado, en el mismo lugar). */
  const lista = (ps: readonly unknown[], ms: unknown, gs: unknown): unknown[] => {
    if (!Array.isArray(ms) || !Array.isArray(gs)) return [...ps];
    const tomadas = new Set<number>();
    const nuevaIgual = (p: unknown, j: number): boolean => {
      const m: unknown = ms[j];
      return !tomadas.has(j) && esObjeto(m) && claveDe(m) === undefined && huella(m) === huella(p);
    };
    return ps.map((p, i) => {
      if (!esObjeto(p)) return p;
      const clave = claveDe(p);
      if (clave) {
        const j = ms.findIndex((m: unknown) => esObjeto(m) && m[clave] === p[clave]);
        if (j < 0) return p;
        tomadas.add(j);
        return parte(p, ms[j], gs[j]);
      }
      const j = nuevaIgual(p, i) ? i : ms.findIndex((_: unknown, k: number) => nuevaIgual(p, k));
      if (j < 0) return p;
      tomadas.add(j);
      return copiar(p, gs[j]);
    });
  };

  /** Las listas de partes que tiene una parte que ya existía (las sesiones de un bloque, los ítems de una opción). */
  const parte = (p: Record<string, unknown>, m: unknown, g: unknown): unknown => {
    if (!esObjeto(m) || !esObjeto(g)) return p;
    const salida: Record<string, unknown> = { ...p };
    for (const [k, v] of Object.entries(salida)) {
      if (Array.isArray(v)) salida[k] = lista(v, m[k], g[k]);
      else if (esObjeto(v)) salida[k] = parte(v, m[k], g[k]);
    }
    return salida;
  };

  if (Array.isArray(enPantalla)) return lista(enPantalla, mandado, guardado) as T;
  return (esObjeto(enPantalla) ? parte(enPantalla, mandado, guardado) : enPantalla) as T;
}
