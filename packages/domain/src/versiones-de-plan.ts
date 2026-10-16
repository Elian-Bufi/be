/**
 * Lo que comparten los dos planes del escritorio del profesional, el de comidas y el de entrenamiento
 * (WP-ESCRITORIO-AREAS, partes 5 y 6): el número de una versión, el historial, qué se muestra cuando la dirección de
 * la página pide algo por su número de orden, y los textos de las versiones.
 *
 * - **El número de una versión es su orden de activación** (1, 2, 3…). El campo `version` del contrato es el token de
 *   concurrencia del recurso y avanza con cada guardado: no sirve para mostrar. Un borrador no tiene número.
 * - **Lo que se elige vive en la dirección de la página, por su número de orden:** «Actualizar» y volver atrás lo
 *   conservan. Un número que la versión no tiene no es un error: se ignora.
 */
import { numero } from './formato-numeros';

// ─── Las versiones ──────────────────────────────────────────────────────────────────────────────

interface ConActivacion {
  readonly planId: string;
  readonly activatedAt: string | null;
}

/** El número de cada versión activada: su orden de activación. Un borrador no figura. */
export function numerosDeVersionDePlan(versiones: readonly ConActivacion[]): Map<string, number> {
  const activadas = versiones.filter((v) => v.activatedAt !== null).sort((a, b) => (a.activatedAt as string).localeCompare(b.activatedAt as string));
  return new Map(activadas.map((v, i) => [v.planId, i + 1]));
}

/** Una versión del historial: su número, cuándo se activó y si es la que rige. */
export interface VersionDelHistorial {
  readonly planId: string;
  readonly numero: number;
  readonly activadaEl: string;
  /** Es la versión efectiva: la que ve el asesorado. */
  readonly vigente: boolean;
}

/** Las versiones activadas, de la más nueva a la más vieja. La vigente la dice la API (`isEffective`), no la fecha. */
export function historialDeVersiones(versiones: readonly (ConActivacion & { readonly isEffective: boolean })[]): readonly VersionDelHistorial[] {
  const numeros = numerosDeVersionDePlan(versiones);
  return versiones
    .filter((v) => v.activatedAt !== null)
    .map((v) => ({ planId: v.planId, numero: numeros.get(v.planId) as number, activadaEl: v.activatedAt as string, vigente: v.isEffective }))
    .sort((a, b) => b.numero - a.numero);
}

// ─── Lo que pide la dirección, por número de orden ──────────────────────────────────────────────

interface ConOrden {
  readonly order: number;
}

/**
 * Lo que se muestra de una lista ordenada (un día tipo, un bloque, una sesión): lo que pide la dirección, por su número
 * de orden (`dia=2`); si no pide nada, o pide algo que la lista no tiene, lo primero. `null` solo si la lista está vacía.
 */
export function elegidoPorOrden<T extends ConOrden>(cosas: readonly T[], pedido: string | null): T | null {
  const enOrden = [...cosas].sort((a, b) => a.order - b.order);
  return enOrden.find((d) => String(d.order) === pedido) ?? enOrden[0] ?? null;
}

const ordenesDe = (cosas: readonly ConOrden[]): number[] => cosas.map((c) => c.order).sort((a, b) => a - b);

/**
 * Lo que está abierto de una lista de cosas que se pliegan (las comidas de un día, los ejercicios de una sesión), por
 * su número de orden (`comidas=1.3`). Sin pedido, lo primero: la pantalla abre con una cosa entera a la vista y las
 * demás en un renglón. Un número que la lista no tiene se ignora.
 */
export function abiertosPorOrden(cosas: readonly ConOrden[], pedido: string | null): ReadonlySet<number> {
  const ordenes = ordenesDe(cosas);
  if (pedido === null) return new Set(ordenes.slice(0, 1));
  const pedidas = new Set(pedido.split('.'));
  return new Set(ordenes.filter((o) => pedidas.has(String(o))));
}

/**
 * Lo inverso, para escribir la dirección: `null` si es lo que se ve sin pedir nada (abierto solo lo primero);
 * `ninguno`, la palabra que dice «todo plegado», si no queda nada abierto.
 */
export function pedidoDeAbiertos(cosas: readonly ConOrden[], abiertos: ReadonlySet<number>, ninguno: string): string | null {
  const ordenes = ordenesDe(cosas);
  const quedan = ordenes.filter((o) => abiertos.has(o));
  if (quedan.length === 0) return ordenes.length === 0 ? null : ninguno;
  if (quedan.length === 1 && quedan[0] === ordenes[0]) return null;
  return quedan.join('.');
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/** Los textos de las versiones de un plan, iguales en Nutrición y en Entrenamiento. Describen, no califican. */
export const COPY_DE_VERSIONES = {
  version: 'Versión',
  /** El borrador no lleva número hasta activarse: se nombra por lo que es. */
  enPreparacion: 'En preparación',
  /** En el selector de versión: «2 · activa». La activada sí tiene número. */
  activaConNumero: (n: number): string => `${numero(n)} · activa`,
  elAsesoradoNoLaVe: 'El asesorado no la ve.',
  /** «Versión 2 · activada el 7 oct». */
  versionActivada: (n: number, cuando: string): string => `Versión ${numero(n)} · activada el ${cuando}`,
  esLoQueVe: 'es lo que ve el asesorado',
  vigente: 'vigente',
  anterior: 'anterior, conservada',
  historial: 'Historial',
  sinVersionesActivadas: 'Todavía no se activó ninguna versión.',
  huella: 'Huella de la instantánea',
  primeroElObjetivo: 'Para planificar, primero definí el objetivo: el plan se relaciona con el objetivo vigente.',
  irAResumen: 'Ir a Resumen',
  versionActivadaAviso: 'Versión activada. El asesorado ya ve esta planificación como vigente.',
  /** Con una versión en preparación a la vista, la activa no ofrece crear otra: hay una sola a la vez. */
  yaHayUnaEnPreparacion: 'Ya hay una versión en preparación: se sigue sobre esa.',
} as const;
