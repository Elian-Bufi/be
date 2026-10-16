/**
 * Nutrición · Plan (WP-ESCRITORIO-AREAS, parte 5; maqueta 16): cómo se lee una versión activada del plan de comidas en
 * el escritorio del profesional. Son reglas de presentación, calculadas acá y con sus pruebas: la pantalla no decide
 * ninguna. Las usan la sección «Plan» de Nutrición y la planificación de una etapa en la ficha.
 *
 * - **El plan se lee de a un día tipo.** Con uno solo no hay nada que elegir.
 * - **Las opciones de una comida no son equivalencias:** se elige una. Con una sola opción no se dice «se elige una», ni
 *   lleva número.
 * - **Un ítem sin cantidad es un hueco, no un cero:** se dice «sin cantidad indicada».
 * - **Lo que se elige vive en la dirección de la página** (el día tipo y las comidas abiertas), por su número de orden.
 * El número de una versión, el historial y la regla de «lo que pide la dirección» son los de los dos planes:
 * `versiones-de-plan.ts`.
 */
import type { VersionDePlan } from './contratos-nutricion';
import { ETIQUETA_DE_PREPARACION, ETIQUETA_DE_UNIDAD } from './copy-nutricion';
import { cantidad, numero } from './formato-numeros';
import { COPY_DE_VERSIONES, abiertosPorOrden, elegidoPorOrden, pedidoDeAbiertos } from './versiones-de-plan';

// ─── El día tipo ────────────────────────────────────────────────────────────────────────────────

/**
 * El día tipo que se muestra: el que pide la dirección, por su número de orden (`dia=2`); si no pide ninguno, o pide uno
 * que esta versión no tiene, el primero. `null` solo si la versión no tiene días tipo.
 */
export const diaTipoElegido = elegidoPorOrden;

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

/**
 * Las comidas abiertas del día tipo que se mira, por su número de orden (`comidas=1.3`). Sin pedido, la primera: la
 * pantalla abre con una comida entera a la vista y las demás en un renglón. Un número que este día no tiene se ignora.
 */
export const comidasAbiertas = abiertosPorOrden;

/** Lo inverso, para escribir la dirección: `null` si es lo que se ve sin pedir nada (abierta solo la primera). */
export const pedidoDeComidas = (comidas: readonly { readonly order: number }[], abiertas: ReadonlySet<number>): string | null => pedidoDeAbiertos(comidas, abiertas, NINGUNA_COMIDA);

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/**
 * Los textos de «Plan» que no comparte la APK (los que comparte están en `COPY_NUTRICION` y `COPY_RECETAS`, y no
 * cambian). Los de las versiones son los de los dos planes. Los verifica la prueba de palabras de Nutrición: describen,
 * no califican.
 */
export const COPY_DEL_PLAN = {
  ...COPY_DE_VERSIONES,
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
} as const;
