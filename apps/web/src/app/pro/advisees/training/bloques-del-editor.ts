/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION) · Las operaciones del editor sobre los bloques de una sesión, sin React.
 *
 * El bloque es una marca sobre la lista de ejercicios (`bloques-de-la-sesion.ts`, ENP-D02): cada operación deja la lista
 * como la pide la API —los ejercicios de un bloque, seguidos— y los bloques en el orden en que se ven. Cada una devuelve
 * la sesión nueva sin tocar la de entrada y, si cambió el orden, de dónde salió cada ejercicio (`desdeDonde[nueva] =
 * vieja`), para que lo abierto acompañe a su ejercicio.
 */
import {
  bloqueDe,
  bloqueDeLaSesionDelProblema,
  bloqueNuevo,
  conLosBloquesEnOrden,
  PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO,
  partesDeLaSesion,
  posicionesDelBloque,
  seriesParaLasVueltas,
  VUELTAS_POR_OMISION,
  type BloqueDeLaSesionEntrada,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type TipoDeBloque,
} from '@be/domain';

type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];
export type SesionE = NonNullable<Bloques[number]['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];
type Serie = PrescripcionE['sets'][number];

export interface SesionReordenada {
  readonly sesion: SesionE;
  /** Por cada posición nueva, la que tenía antes; `-1` para un ejercicio que no estaba. */
  readonly desdeDonde: readonly number[];
}

const identidad = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** Las posiciones abiertas después de reordenar: cada una sigue a su ejercicio. */
export function abiertosTrasReordenar(abiertos: ReadonlySet<number>, desdeDonde: readonly number[]): Set<number> {
  return new Set(desdeDonde.flatMap((vieja, nueva) => (abiertos.has(vieja) ? [nueva] : [])));
}

/** La sesión con la lista nueva (por posiciones viejas) y sus bloques en el orden en que se ven. */
function conLaLista(s: SesionE, orden: readonly number[]): SesionReordenada {
  return { sesion: conLosBloquesEnOrden({ ...s, prescriptions: orden.map((n) => s.prescriptions[n]!) }), desdeDonde: orden };
}

/** Un bloque nuevo, «Seguido», al final de la sesión (sin ejercicios: se agregan desde su pie). */
export function agregarBloque(s: SesionE): { readonly sesion: SesionE; readonly bloque: BloqueDeLaSesionEntrada } {
  const bloque = bloqueNuevo(s);
  return { sesion: { ...s, exerciseGroups: [...(s.exerciseGroups ?? []), bloque] }, bloque };
}

/** Quita el bloque: sus ejercicios quedan en la sesión, sueltos y en su lugar. */
export function quitarBloque(s: SesionE, groupId: string): SesionE {
  const grupos = (s.exerciseGroups ?? []).filter((g) => g.groupId !== groupId);
  const prescriptions = s.prescriptions.map((p) => {
    if (bloqueDe(p) !== groupId) return p;
    const { exerciseGroupId: _bloque, ...resto } = p;
    return resto;
  });
  const { exerciseGroups: _todos, ...sinBloques } = s;
  return { ...sinBloques, prescriptions, ...(grupos.length > 0 ? { exerciseGroups: grupos } : {}) };
}

/** Cambia algo del bloque (el nombre, el descanso). No toca los ejercicios. */
export function cambiarBloque(s: SesionE, groupId: string, c: Partial<Omit<BloqueDeLaSesionEntrada, 'groupId' | 'kind'>>): SesionE {
  return { ...s, exerciseGroups: (s.exerciseGroups ?? []).map((g) => (g.groupId === groupId ? { ...g, ...c } : g)) };
}

/** Lo que pierde un ejercicio al igualar sus series a las vueltas, para poder deshacerlo. */
export interface CambioDeVueltas {
  readonly sesion: SesionE;
  /** Las prescripciones de antes, por posición: «Deshacer» las vuelve a escribir. */
  readonly antes: ReadonlyMap<number, PrescripcionE>;
}

const serieVacia: Serie = { repetitions: null };

/**
 * ENP-D05: las vueltas del bloque, y cada ejercicio del bloque con una serie efectiva por vuelta (copia la última o quita
 * las de abajo; el calentamiento queda arriba).
 */
export function cambiarVueltas(s: SesionE, groupId: string, vueltas: number): CambioDeVueltas {
  const antes = new Map<number, PrescripcionE>();
  const prescriptions = s.prescriptions.map((p, n) => {
    if (bloqueDe(p) !== groupId) return p;
    const sets = seriesParaLasVueltas<Serie>(p.sets, vueltas, serieVacia);
    if (JSON.stringify(sets) === JSON.stringify(p.sets)) return p;
    antes.set(n, structuredClone(p));
    return { ...p, sets };
  });
  return { sesion: { ...cambiarBloque(s, groupId, { rounds: vueltas }), prescriptions }, antes };
}

/**
 * Cambia el tipo del bloque. A «En vueltas», con las vueltas por omisión (o las series efectivas que ya tiene el primero de
 * sus ejercicios, si las tiene) y sus series igualadas; a «Seguido», sin vueltas ni descanso (el contrato no los admite).
 */
export function cambiarTipo(s: SesionE, groupId: string, tipo: TipoDeBloque): CambioDeVueltas {
  const g = (s.exerciseGroups ?? []).find((x) => x.groupId === groupId);
  if (!g || g.kind === tipo) return { sesion: s, antes: new Map() };
  if (tipo === 'SEQUENTIAL') {
    const grupos = (s.exerciseGroups ?? []).map((x) => (x.groupId === groupId ? { groupId: x.groupId, label: x.label, kind: 'SEQUENTIAL' as const } : x));
    return { sesion: { ...s, exerciseGroups: grupos }, antes: new Map() };
  }
  const primero = s.prescriptions.find((p) => bloqueDe(p) === groupId);
  const efectivas = primero ? primero.sets.filter((x) => x.setKind !== 'WARM_UP').length : 0;
  const vueltas = efectivas >= 1 && efectivas <= 20 ? efectivas : VUELTAS_POR_OMISION;
  const conTipo: SesionE = { ...s, exerciseGroups: (s.exerciseGroups ?? []).map((x) => (x.groupId === groupId ? { groupId: x.groupId, label: x.label, kind: 'ROUNDS' as const, rounds: vueltas } : x)) };
  return cambiarVueltas(conTipo, groupId, vueltas);
}

/** El «Deshacer» de las vueltas: la sesión como estaba, en qué sesión del editor y en qué bloque. */
export interface DeshacerLasVueltas {
  /** La sesión en el editor (`b0-m1-s2`). */
  readonly lugar: string;
  readonly groupId: string;
  /** Las vueltas que quedaron: lo dice el aviso. */
  readonly vueltas: number;
  /** La sesión como estaba antes del primero de los cambios de vueltas seguidos. */
  readonly sesion: SesionE;
}

/**
 * ENP-D05: el «Deshacer» después de cambiar las vueltas de un bloque (o de pasarlo a «En vueltas»). Si se cambian varias
 * veces seguidas en el mismo bloque —con el teclado, la lista cambia en cada flecha: de 5 a 3 pasa por 4—, «Deshacer»
 * vuelve a como estaba antes del primero, no al paso anterior: cada paso que baja las vueltas quita series, y deshacer
 * solo el último perdía las de los pasos de antes. Cualquier otro cambio del editor corta la seguidilla (`previo` llega
 * en `null`). Devuelve `null` si no hay nada que deshacer.
 */
export function deshacerTrasCambiarLasVueltas(previo: DeshacerLasVueltas | null, lugar: string, groupId: string, antes: SesionE, cambio: CambioDeVueltas): DeshacerLasVueltas | null {
  const vueltas = (cambio.sesion.exerciseGroups ?? []).find((g) => g.groupId === groupId)?.rounds;
  const sigue = previo !== null && previo.lugar === lugar && previo.groupId === groupId ? previo : null;
  if (typeof vueltas !== 'number' || (cambio.antes.size === 0 && !sigue)) return null;
  return { lugar, groupId, vueltas, sesion: sigue ? sigue.sesion : structuredClone(antes) };
}

/** Vuelve a escribir las prescripciones de antes (el «Deshacer» de las vueltas). */
export function conLasDeAntes(s: SesionE, antes: ReadonlyMap<number, PrescripcionE>): SesionE {
  return { ...s, prescriptions: s.prescriptions.map((p, n) => antes.get(n) ?? p) };
}

/** Las partes de la sesión como rangos de posiciones: un ejercicio suelto es una parte; un bloque, todos los suyos. */
interface Rango {
  readonly groupId: string | null;
  readonly posiciones: number[];
}
function rangos(s: SesionE): Rango[] {
  return partesDeLaSesion(s).flatMap((p): Rango[] => (p.tipo === 'suelto' ? [{ groupId: null, posiciones: [p.ejercicio.posicion] }] : p.ejercicios.length > 0 ? [{ groupId: p.bloque.groupId, posiciones: p.ejercicios.map((e) => e.posicion) }] : []));
}

/**
 * Sube o baja un ejercicio. Dentro de un bloque, solo entre los del bloque; uno suelto salta un bloque entero (no se mete
 * adentro: para eso está «Pasar a…»). `null` si ya está en la punta.
 */
export function moverEjercicio(s: SesionE, l: number, hacia: -1 | 1): SesionReordenada | null {
  const p = s.prescriptions[l];
  if (!p) return null;
  const id = bloqueDe(p);
  const orden = identidad(s.prescriptions.length);
  if (id !== null) {
    const vecino = l + hacia;
    if (bloqueDe(s.prescriptions[vecino] ?? {}) !== id || !s.prescriptions[vecino]) return null;
    [orden[l], orden[vecino]] = [orden[vecino]!, orden[l]!];
    return conLaLista(s, orden);
  }
  const partes = rangos(s);
  const k = partes.findIndex((r) => r.posiciones.includes(l));
  const otra = partes[k + hacia];
  if (k < 0 || !otra) return null;
  const nuevas = [...partes];
  [nuevas[k], nuevas[k + hacia]] = [nuevas[k + hacia]!, nuevas[k]!];
  return conLaLista(s, nuevas.flatMap((r) => r.posiciones));
}

/** Si un ejercicio se puede subir (-1) o bajar (1). */
export const sePuedeMover = (s: SesionE, l: number, hacia: -1 | 1): boolean => moverEjercicio(s, l, hacia) !== null;

/** Sube o baja un bloque entero, por encima o por debajo de la parte de al lado. `null` si ya está en la punta o está vacío. */
export function moverBloque(s: SesionE, groupId: string, hacia: -1 | 1): SesionReordenada | null {
  const partes = rangos(s);
  const k = partes.findIndex((r) => r.groupId === groupId);
  if (k < 0 || !partes[k + hacia]) return null;
  const nuevas = [...partes];
  [nuevas[k], nuevas[k + hacia]] = [nuevas[k + hacia]!, nuevas[k]!];
  return conLaLista(s, nuevas.flatMap((r) => r.posiciones));
}

/**
 * Pasa un ejercicio a otro bloque (al final de sus ejercicios) o lo saca del suyo (`null`: queda suelto justo después del
 * bloque, así los que quedan siguen juntos).
 */
export function pasarAlBloque(s: SesionE, l: number, groupId: string | null): SesionReordenada {
  const p = s.prescriptions[l]!;
  const actual = bloqueDe(p);
  const resto = identidad(s.prescriptions.length).filter((n) => n !== l);
  const ultimoDe = (id: string) => [...resto].reverse().find((n) => bloqueDe(s.prescriptions[n]!) === id);
  let lugar: number;
  if (groupId === null) {
    if (actual === null) return { sesion: s, desdeDonde: identidad(s.prescriptions.length) };
    // Si era el único del bloque, se queda donde está; si no, va justo después de los que quedan.
    const ultimo = ultimoDe(actual);
    lugar = ultimo === undefined ? l : resto.indexOf(ultimo) + 1;
  } else {
    // Un bloque vacío se ve al final de la sesión: el ejercicio va al final.
    const ultimo = ultimoDe(groupId);
    lugar = ultimo === undefined ? resto.length : resto.indexOf(ultimo) + 1;
  }
  const orden = [...resto.slice(0, lugar), l, ...resto.slice(lugar)];
  const movido: PrescripcionE = groupId === null ? (({ exerciseGroupId: _bloque, ...x }) => x)(p) : { ...p, exerciseGroupId: groupId };
  const conElMovido: SesionE = { ...s, prescriptions: s.prescriptions.map((x, n) => (n === l ? movido : x)) };
  return conLaLista(conElMovido, orden);
}

/**
 * Agrega ejercicios a la sesión: sueltos, al final; a un bloque, después del último de los suyos y con su marca. En un
 * bloque «En vueltas», cada uno nace con una serie efectiva por vuelta (ENP-D05). Devuelve también dónde quedaron.
 */
export function agregarEjercicios(s: SesionE, nuevas: readonly PrescripcionE[], groupId: string | null): SesionReordenada & { readonly posiciones: readonly number[] } {
  const g = groupId !== null ? (s.exerciseGroups ?? []).find((x) => x.groupId === groupId) : undefined;
  const marcadas = nuevas.map((p): PrescripcionE => {
    if (!g) return p;
    const conMarca: PrescripcionE = { ...p, exerciseGroupId: g.groupId };
    return g.kind === 'ROUNDS' && typeof g.rounds === 'number' ? { ...conMarca, sets: seriesParaLasVueltas<Serie>(p.sets, g.rounds, serieVacia) } : conMarca;
  });
  const viejas = s.prescriptions.length;
  const ultimo = g ? posicionesDelBloque(s, g.groupId).at(-1) : undefined;
  const lugar = ultimo === undefined ? viejas : ultimo + 1;
  const orden = [...identidad(lugar), ...nuevas.map((_, n) => viejas + n), ...identidad(viejas).slice(lugar)];
  const r = conLaLista({ ...s, prescriptions: [...s.prescriptions, ...marcadas] }, orden);
  return { ...r, desdeDonde: r.desdeDonde.map((n) => (n >= viejas ? -1 : n)), posiciones: nuevas.map((_, n) => lugar + n) };
}

/** Los bloques a los que se puede pasar un ejercicio: todos menos el suyo. */
export const otrosBloques = (s: SesionE, l: number): readonly BloqueDeLaSesionEntrada[] => (s.exerciseGroups ?? []).filter((g) => g.groupId !== bloqueDe(s.prescriptions[l] ?? {}));

// ─── «Ir a…» un problema de un bloque ───────────────────────────────────────────────────────────────────────────

/**
 * A dónde lleva «Ir a…» un problema de un bloque de la sesión (`…sessions[k].exerciseGroups[n]`): sin nombre, abre su
 * campo (`renombrar`: la clave del bloque en el editor); con el descanso ilegible, a ese campo; lo demás, a su título.
 * `null` si el problema no es de un bloque de la sesión. `delGrupo` es el prefijo de la sesión en el editor (`b0-m1-s2`).
 *
 * El editor lo pregunta **antes** que el nombre de la sesión: la ruta de un bloque también es «de la sesión», y un
 * «falta el nombre» del bloque abría el nombre de la sesión.
 */
export function destinoDelProblemaDelBloque(
  p: { readonly code: string; readonly path: string },
  sesion: Pick<SesionE, 'exerciseGroups'> | undefined,
  delGrupo: string,
): { readonly renombrar: string } | { readonly enfocar: string } | null {
  const g = bloqueDeLaSesionDelProblema(p.path);
  if (g === null) return null;
  const bloque = sesion?.exerciseGroups?.[g];
  if (p.code === PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO.faltaElNombre && bloque) return { renombrar: `${delGrupo}-${bloque.groupId}` };
  if (p.code === PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO.descansoIlegible) return { enfocar: `${delGrupo}-g${g}-descanso` };
  return { enfocar: `${delGrupo}-g${g}-titulo` };
}
