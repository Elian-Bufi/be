/**
 * Nutrición · Plan (WP-ESCRITORIO-AREAS, parte 5; maqueta 16): cómo se lee una versión activada del plan de comidas en
 * el escritorio del profesional. Son reglas de presentación, calculadas acá y con sus pruebas: la pantalla no decide
 * ninguna. Las usan la sección «Plan» de Nutrición y la planificación de una etapa en la ficha.
 *
 * - **El número de una versión es su orden de activación** (1, 2, 3…). El campo `version` del contrato es el token de
 *   concurrencia del recurso y avanza con cada guardado: no sirve para mostrar. Un borrador no tiene número.
 * - **El plan se lee de a un día tipo.** Con uno solo no hay nada que elegir.
 * - **Las opciones de una comida no son equivalencias:** se elige una. Con una sola opción no se dice «se elige una», ni
 *   lleva número.
 * - **Un ítem sin cantidad es un hueco, no un cero:** se dice «sin cantidad indicada».
 * - **Lo que se elige vive en la dirección de la página** (el día tipo y las comidas abiertas), por su número de orden:
 *   «Actualizar» y volver atrás lo conservan. Un número que la versión no tiene no es un error: se ignora.
 */
import type { VersionDePlan } from './contratos-nutricion';
import { ETIQUETA_DE_PREPARACION, ETIQUETA_DE_UNIDAD } from './copy-nutricion';
import { cantidad, numero } from './formato-numeros';

// ─── Las versiones ──────────────────────────────────────────────────────────────────────────────

type ConActivacion = Pick<VersionDePlan, 'planId' | 'activatedAt'>;

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
export function historialDeVersiones(versiones: readonly Pick<VersionDePlan, 'planId' | 'activatedAt' | 'isEffective'>[]): readonly VersionDelHistorial[] {
  const numeros = numerosDeVersionDePlan(versiones);
  return versiones
    .filter((v) => v.activatedAt !== null)
    .map((v) => ({ planId: v.planId, numero: numeros.get(v.planId) as number, activadaEl: v.activatedAt as string, vigente: v.isEffective }))
    .sort((a, b) => b.numero - a.numero);
}

// ─── El día tipo ────────────────────────────────────────────────────────────────────────────────

/**
 * El día tipo que se muestra: el que pide la dirección, por su número de orden (`dia=2`); si no pide ninguno, o pide uno
 * que esta versión no tiene, el primero. `null` solo si la versión no tiene días tipo.
 */
export function diaTipoElegido<D extends { readonly order: number }>(dias: readonly D[], pedido: string | null): D | null {
  const enOrden = [...dias].sort((a, b) => a.order - b.order);
  return enOrden.find((d) => String(d.order) === pedido) ?? enOrden[0] ?? null;
}

// ─── Una comida y sus opciones ──────────────────────────────────────────────────────────────────

/** Cuántas opciones tiene una comida. Con más de una, se elige una: no son equivalencias que se sumen. */
export function opcionesEnPalabras(cuantas: number): string {
  if (cuantas === 0) return 'Sin opciones';
  return cuantas === 1 ? '1 opción' : `${numero(cuantas)} opciones · se elige una`;
}

/** El título de una opción: con su número, si la comida tiene más de una. */
export const tituloDeLaOpcion = (opcion: { readonly order: number; readonly label: string }, cuantas: number): string => (cuantas > 1 ? `Opción ${opcion.order}: ${opcion.label}` : opcion.label);

type Item = VersionDePlan['dayTypes'][number]['meals'][number]['options'][number]['items'][number];

/** Lo indicado de un ítem: la cantidad con su unidad y el estado de preparación. Sin cantidad, lo dice. */
export function indicadoDelItem(item: Pick<Item, 'quantity' | 'preparationState'>): string {
  const partes = [item.quantity ? cantidad(item.quantity.value, ETIQUETA_DE_UNIDAD[item.quantity.unit]) : COPY_DEL_PLAN.sinCantidad, ...(item.preparationState ? [ETIQUETA_DE_PREPARACION[item.preparationState].toLowerCase()] : [])];
  return partes.join(' · ');
}

// ─── Las comidas abiertas ───────────────────────────────────────────────────────────────────────

/** En la dirección, «todas plegadas». Sin nada escrito, la primera está abierta. */
export const NINGUNA_COMIDA = 'ninguna';

const ordenesDe = (comidas: readonly { readonly order: number }[]): number[] => comidas.map((c) => c.order).sort((a, b) => a - b);

/**
 * Las comidas abiertas del día tipo que se mira, por su número de orden (`comidas=1.3`). Sin pedido, la primera: la
 * pantalla abre con una comida entera a la vista y las demás en un renglón. Un número que este día no tiene se ignora.
 */
export function comidasAbiertas(comidas: readonly { readonly order: number }[], pedido: string | null): ReadonlySet<number> {
  const ordenes = ordenesDe(comidas);
  if (pedido === null) return new Set(ordenes.slice(0, 1));
  const pedidas = new Set(pedido.split('.'));
  return new Set(ordenes.filter((o) => pedidas.has(String(o))));
}

/** Lo inverso, para escribir la dirección: `null` si es lo que se ve sin pedir nada (abierta solo la primera). */
export function pedidoDeComidas(comidas: readonly { readonly order: number }[], abiertas: ReadonlySet<number>): string | null {
  const ordenes = ordenesDe(comidas);
  const quedan = ordenes.filter((o) => abiertas.has(o));
  if (quedan.length === 0) return ordenes.length === 0 ? null : NINGUNA_COMIDA;
  if (quedan.length === 1 && quedan[0] === ordenes[0]) return null;
  return quedan.join('.');
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/**
 * Los textos de «Plan» que no comparte la APK (los que comparte están en `COPY_NUTRICION` y `COPY_RECETAS`, y no
 * cambian). Los verifica la prueba de palabras de Nutrición: describen, no califican.
 */
export const COPY_DEL_PLAN = {
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
  diaTipo: 'Día tipo',
  objetivoDelDia: 'Objetivo del día',
  /** El plan cita un objetivo que ya no es el vigente: se muestra el del plan, y se dice. */
  objetivoAnterior: 'Es el objetivo con el que se armó esta versión. Hoy rige uno más nuevo.',
  objetivoYaNoRige: 'Es el objetivo con el que se armó esta versión. Hoy no hay un objetivo vigente.',
  objetivoNoSeLeyo: 'No pudimos leer el objetivo de esta versión.',
  sinCantidad: 'sin cantidad indicada',
  abrirTodas: 'Abrir todas las comidas',
  plegarTodas: 'Plegar todas',
  /** La nota de un ítem, tal como la lee el asesorado en la APK. */
  notaDelItem: 'Nota',
  sinComidas: 'Este día tipo no tiene comidas.',
  sinDiasTipo: 'Esta versión no tiene días tipo.',
  sinOpciones: 'Esta comida no tiene opciones.',
  sinItems: 'Esta opción no tiene ítems.',
  primeroElObjetivo: 'Para planificar, primero definí el objetivo: el plan se relaciona con el objetivo vigente.',
  irAResumen: 'Ir a Resumen',
  versionActivadaAviso: 'Versión activada. El asesorado ya ve esta planificación como vigente.',
  /** Con una versión en preparación a la vista, la activa no ofrece crear otra: hay una sola a la vez. */
  yaHayUnaEnPreparacion: 'Ya hay una versión en preparación: se sigue sobre esa.',
} as const;
