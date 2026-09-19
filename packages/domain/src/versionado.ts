/**
 * B-06 — Versionado, instantáneas, correcciones e historia común (06 §4, 06:1142-1797). Patrón transversal: no conoce
 * nutrición, entrenamiento ni antropometría, y lo reusan las tres verticales.
 *
 * «NINGUNA MÁQUINA GLOBAL NUEVA» (06:1248). Este módulo no declara estados: cada vertical declara su máquina y usa
 * estas funciones para cumplir los efectos obligatorios del §4.9 (06:1516-1557):
 * - emitir: el contenido queda fijo (REG-06-11);
 * - suceder: una sola predecesora directa, sin modificarla (REG-06-12);
 * - instantánea: se reconstruye desde lo emitido, nunca desde catálogos actuales (REG-06-13);
 * - corregir: el original queda intacto, en una cadena lineal hacia el original raíz (REG-06-14, 15);
 * - vista efectiva: se obtiene por relación, nunca por «la última fecha» (REG-06-16).
 *
 * Es código puro: web y APK lo importan, así que no usa `node:crypto`. La huella de una instantánea la calcula la API
 * sobre `serializacionCanonica`.
 */

// ─── Cadena lineal (REG-06-12, REG-06-15, REG-06-16) ────────────────────────────────────────────

/**
 * Un eslabón de una cadena: una corrección apunta a la corrección inmediata anterior, y una versión, a su predecesora
 * directa. `previoId = null` marca el primer eslabón.
 */
export interface Eslabon {
  readonly id: string;
  readonly previoId: string | null;
}

/**
 * Por qué una cadena no se puede resolver automáticamente (REG-06-16, inciso 3; REG-06-12, bifurcación):
 * - `RAMIFICACION`: dos eslabones con el mismo previo, o más de un primer eslabón;
 * - `CICLO`: el recorrido vuelve sobre sí mismo;
 * - `RELACION_INCOMPLETA`: un eslabón apunta a un previo que no está, o quedan eslabones fuera del recorrido.
 */
export type MotivoNoResoluble = 'RAMIFICACION' | 'CICLO' | 'RELACION_INCOMPLETA';

export type ResolucionDeCadena =
  /** Sin eslabones. */
  | { readonly tipo: 'VACIA' }
  /** Una sola terminal. `orden` va del primer eslabón a la terminal (06:1444: «recorrible desde el original hasta la terminal»). */
  | { readonly tipo: 'TERMINAL'; readonly terminalId: string; readonly orden: readonly string[] }
  /** «no resoluble automáticamente»: nadie puede elegir por tiempo de registro (06:1452). */
  | { readonly tipo: 'NO_RESOLUBLE'; readonly motivo: MotivoNoResoluble };

/**
 * Resuelve una cadena lineal. No usa fechas ni el orden del arreglo: solo las relaciones (REG-06-16, 06:1448).
 */
export function resolverCadena(eslabones: readonly Eslabon[]): ResolucionDeCadena {
  if (eslabones.length === 0) return { tipo: 'VACIA' };

  const porId = new Map<string, Eslabon>();
  for (const e of eslabones) {
    // Un id repetido es una relación que no identifica a un solo eslabón.
    if (porId.has(e.id)) return { tipo: 'NO_RESOLUBLE', motivo: 'RELACION_INCOMPLETA' };
    porId.set(e.id, e);
  }

  const siguientes = new Map<string, string>();
  const primeros: string[] = [];
  for (const e of eslabones) {
    if (e.previoId === null) {
      primeros.push(e.id);
      continue;
    }
    if (e.previoId === e.id) return { tipo: 'NO_RESOLUBLE', motivo: 'CICLO' };
    if (!porId.has(e.previoId)) return { tipo: 'NO_RESOLUBLE', motivo: 'RELACION_INCOMPLETA' };
    if (siguientes.has(e.previoId)) return { tipo: 'NO_RESOLUBLE', motivo: 'RAMIFICACION' };
    siguientes.set(e.previoId, e.id);
  }

  if (primeros.length > 1) return { tipo: 'NO_RESOLUBLE', motivo: 'RAMIFICACION' };
  // Todos tienen previo y todos los previos existen: la única forma es un ciclo.
  if (primeros.length === 0) return { tipo: 'NO_RESOLUBLE', motivo: 'CICLO' };

  const orden: string[] = [];
  const visitados = new Set<string>();
  let actual: string | undefined = primeros[0];
  while (actual !== undefined) {
    if (visitados.has(actual)) return { tipo: 'NO_RESOLUBLE', motivo: 'CICLO' };
    visitados.add(actual);
    orden.push(actual);
    actual = siguientes.get(actual);
  }
  // Eslabones que no se alcanzan desde el primero: forman un ciclo aparte.
  if (orden.length !== eslabones.length) return { tipo: 'NO_RESOLUBLE', motivo: 'CICLO' };

  return { tipo: 'TERMINAL', terminalId: orden[orden.length - 1] as string, orden };
}

// ─── Corrección trazable (06 §4.7) ─────────────────────────────────────────────────────────────

/** Estructura mínima de relación de una Corrección trazable (06:1407-1418). El contenido lo define la vertical. */
export interface RelacionDeCorreccion {
  readonly id: string;
  /** Registro raíz. Obligatorio (06:1410). */
  readonly originalId: string;
  /** Corrección inmediata anterior; `null` en la primera (REG-06-15). */
  readonly correccionPreviaId: string | null;
}

export type VistaEfectiva =
  /** REG-06-16, inciso 1: sin corrección, rige el original. */
  | { readonly tipo: 'ORIGINAL'; readonly id: string }
  /** REG-06-16, inciso 2: cadena válida con una sola terminal. */
  | { readonly tipo: 'CORREGIDA'; readonly id: string; readonly cadena: readonly string[] }
  /** REG-06-16, inciso 3. */
  | { readonly tipo: 'NO_RESOLUBLE'; readonly motivo: MotivoNoResoluble };

/**
 * Vista efectiva de un registro con sus correcciones (REG-06-16). Es derivada: la historia es la fuente de verdad
 * (06:1455), así que no se persiste.
 */
export function resolverVistaEfectiva(originalId: string, correcciones: readonly RelacionDeCorreccion[]): VistaEfectiva {
  // REG-06-15: todas apuntan al mismo original raíz.
  if (correcciones.some((c) => c.originalId !== originalId)) return { tipo: 'NO_RESOLUBLE', motivo: 'RELACION_INCOMPLETA' };
  // Una corrección que dice ser el original no es una corrección.
  if (correcciones.some((c) => c.id === originalId)) return { tipo: 'NO_RESOLUBLE', motivo: 'RELACION_INCOMPLETA' };

  const cadena = resolverCadena(correcciones.map((c) => ({ id: c.id, previoId: c.correccionPreviaId })));
  switch (cadena.tipo) {
    case 'VACIA':
      return { tipo: 'ORIGINAL', id: originalId };
    case 'TERMINAL':
      return { tipo: 'CORREGIDA', id: cadena.terminalId, cadena: cadena.orden };
    case 'NO_RESOLUBLE':
      return cadena;
  }
}

export type EvaluacionDeCorreccion =
  | { readonly valida: true; readonly correccionPreviaId: string | null }
  | {
      readonly valida: false;
      /**
       * - `CADENA_NO_RESOLUBLE`: la historia existente ya no se puede resolver, y agregar no la arregla;
       * - `NO_SUCEDE_A_LA_TERMINAL`: la nueva corrección no apunta a la inmediata anterior (06:1440), por ejemplo porque
       *   otra corrección se confirmó en el medio;
       * - `ORIGINAL_DISTINTO`: apunta a otro original raíz.
       */
      readonly motivo: 'CADENA_NO_RESOLUBLE' | 'NO_SUCEDE_A_LA_TERMINAL' | 'ORIGINAL_DISTINTO';
    };

/**
 * Admite una corrección nueva solo si deja la cadena lineal (REG-06-14, 15): apunta al original raíz y a la terminal
 * actual. Si otra corrección entró en el medio, la nueva queda rechazada y el servicio responde conflicto de versión,
 * nunca una rama.
 */
export function evaluarNuevaCorreccion(
  originalId: string,
  existentes: readonly RelacionDeCorreccion[],
  nueva: { readonly originalId: string; readonly correccionPreviaId: string | null },
): EvaluacionDeCorreccion {
  if (nueva.originalId !== originalId) return { valida: false, motivo: 'ORIGINAL_DISTINTO' };
  const vista = resolverVistaEfectiva(originalId, existentes);
  if (vista.tipo === 'NO_RESOLUBLE') return { valida: false, motivo: 'CADENA_NO_RESOLUBLE' };
  const esperada = vista.tipo === 'ORIGINAL' ? null : vista.id;
  if (nueva.correccionPreviaId !== esperada) return { valida: false, motivo: 'NO_SUCEDE_A_LA_TERMINAL' };
  return { valida: true, correccionPreviaId: esperada };
}

// ─── Versión y sucesión (06 §4.5) ──────────────────────────────────────────────────────────────

/** Estructura mínima de relación de una Versión (06:1308-1320). El contenido y la vigencia los define la vertical. */
export interface RelacionDeVersion {
  readonly id: string;
  /** Objeto versionado: todas las versiones de una sucesión comparten objeto y ámbito (REG-06-12). */
  readonly objetoId: string;
  /** Predecesora directa: como máximo una (06:1312). */
  readonly predecesoraId: string | null;
}

export type EvaluacionDeSucesion =
  | { readonly valida: true }
  | {
      readonly valida: false;
      /**
       * - `OBJETO_DISTINTO`: la predecesora es de otro objeto (REG-06-12: «misma entidad y mismo ámbito»);
       * - `PREDECESORA_INEXISTENTE`: apunta a una versión que no está;
       * - `BIFURCACION`: la predecesora ya tiene sucesora y la vertical no declaró ramas (06:1345-1347);
       * - `PRIMERA_YA_EXISTE`: el objeto ya tiene versiones y la nueva no declara predecesora.
       */
      readonly motivo: 'OBJETO_DISTINTO' | 'PREDECESORA_INEXISTENTE' | 'BIFURCACION' | 'PRIMERA_YA_EXISTE';
    };

/**
 * Admite una versión nueva sin modificar ninguna existente (REG-06-11, 12; INV-06-11, 12). La vigencia no nace de la
 * sucesión (06:1343): la decide la vertical con su máquina.
 */
export function evaluarSucesion(
  existentes: readonly RelacionDeVersion[],
  nueva: { readonly objetoId: string; readonly predecesoraId: string | null },
): EvaluacionDeSucesion {
  const delObjeto = existentes.filter((v) => v.objetoId === nueva.objetoId);
  if (nueva.predecesoraId === null) {
    return delObjeto.length === 0 ? { valida: true } : { valida: false, motivo: 'PRIMERA_YA_EXISTE' };
  }
  const predecesora = existentes.find((v) => v.id === nueva.predecesoraId);
  if (!predecesora) return { valida: false, motivo: 'PREDECESORA_INEXISTENTE' };
  if (predecesora.objetoId !== nueva.objetoId) return { valida: false, motivo: 'OBJETO_DISTINTO' };
  if (delObjeto.some((v) => v.predecesoraId === predecesora.id)) return { valida: false, motivo: 'BIFURCACION' };
  return { valida: true };
}

/**
 * Versión terminal de una sucesión lineal. La usan las verticales cuya vigencia es «la última versión emitida por
 * relación», como el Objetivo (INV-06-107). Nunca decide por fecha (06:1288-1290).
 */
export function resolverVersionTerminal(versiones: readonly RelacionDeVersion[]): ResolucionDeCadena {
  return resolverCadena(versiones.map((v) => ({ id: v.id, previoId: v.predecesoraId })));
}

// ─── Instantánea reproducible (06 §4.6) ─────────────────────────────────────────────────────────

/**
 * Serialización canónica: claves de objeto ordenadas, sin espacios, arreglos en su orden. La misma entrada da siempre
 * los mismos bytes, así que la huella de una instantánea se puede recalcular para demostrar que no cambió (INV-06-13).
 *
 * Solo acepta valores JSON: `undefined`, funciones, `NaN` e `Infinity` no tienen representación reproducible y se
 * rechazan en vez de perderse en silencio.
 */
export function serializacionCanonica(valor: unknown): string {
  if (valor === null) return 'null';
  switch (typeof valor) {
    case 'string':
    case 'boolean':
      return JSON.stringify(valor);
    case 'number':
      if (!Number.isFinite(valor)) throw new TypeError('serializacionCanonica: número no finito');
      return JSON.stringify(valor);
    case 'object': {
      if (Array.isArray(valor)) return `[${valor.map((v) => serializacionCanonica(v)).join(',')}]`;
      const claves = Object.keys(valor as Record<string, unknown>).sort();
      const partes: string[] = [];
      for (const clave of claves) {
        const v = (valor as Record<string, unknown>)[clave];
        if (v === undefined) throw new TypeError(`serializacionCanonica: «${clave}» es undefined`);
        partes.push(`${JSON.stringify(clave)}:${serializacionCanonica(v)}`);
      }
      return `{${partes.join(',')}}`;
    }
    default:
      throw new TypeError(`serializacionCanonica: tipo no serializable (${typeof valor})`);
  }
}
