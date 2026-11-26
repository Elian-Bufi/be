/**
 * DL-202 (WP-ESFUERZO-POR-SERIE, decisión de Dirección del 2026-11-26) · «Pedir el esfuerzo de cada serie»: una opción
 * del plan, al lado de «Pedir el esfuerzo de la sesión al terminar», que dice si la app le pregunta a la persona el
 * esfuerzo (RIR o RPE, según la notación del plan: DL-192) de cada serie efectiva.
 *
 * - **Apagada por defecto** (EP-D01). Encendida, la app muestra el campo del esfuerzo en cada serie efectiva, como hasta
 *   ahora; apagada, no lo muestra y la serie se registra sin esfuerzo: tampoco se completa con el del plan (EP-D03).
 * - **Las aproximaciones nunca lo piden** (EP-D04), con la opción encendida o apagada.
 * - **Lo ya registrado se sigue viendo** en la historia y en la corrección: la opción decide qué se pregunta, no qué se
 *   muestra de lo que ya está (EP-D05).
 * - **Los planes de antes** (EP-D02): el campo es opcional en el contrato. Ausente, se pide solo si la persona ya declaró
 *   el esfuerzo de alguna serie efectiva de ese plan (en cualquiera de sus versiones); si no, está apagada. Lo resuelve la
 *   API al servir la sesión (API-SER-02) y el plan al profesional (API-SER-01), con `pideElEsfuerzoDeCadaSerie`; el
 *   profesional lo deja escrito cuando toca la casilla.
 */
import type { SerieEjecutadaApi } from './contratos-entrenamiento';
import { COPY_NOTACION_DEL_ESFUERZO, type NotacionDelEsfuerzo } from './notacion-del-esfuerzo';

export const COPY_ESFUERZO_DE_CADA_SERIE = {
  opcionDelPlan: 'Pedir el esfuerzo de cada serie',
  /** El texto de la casilla, con la notación real del plan. */
  opcionExplicada: (notacion: NotacionDelEsfuerzo): string =>
    `La app le pregunta a la persona el ${COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion]} de cada serie efectiva, no de las aproximaciones.`,
  /** EP-D02: lo que se aclara en un plan de antes que no tiene la opción escrita y la API la encontró en sus registros. */
  porLosRegistros: 'Encendida porque la persona ya registró el esfuerzo de sus series en este plan.',
} as const;

/** Lo mínimo de una serie registrada para saber si la persona declaró su esfuerzo. */
type SerieParaElEsfuerzo = Pick<SerieEjecutadaApi, 'rir' | 'recordedAs' | 'fieldOrigins' | 'setKind'>;

/**
 * Si la persona declaró el esfuerzo de una serie efectiva: un RIR con valor que no vino del plan. Una serie tildada «como
 * el plan» (`AS_PLANNED`) o con el RIR completado del plan (`fieldOrigins.rir: 'PLAN'`) no es una declaración; una
 * aproximación (`WARM_UP`), tampoco cuenta. Una serie de antes de la procedencia, sin la clave, sí: la escribió alguien.
 */
export const declaroElEsfuerzo = (s: SerieParaElEsfuerzo): boolean =>
  s.rir !== null && s.rir !== undefined && s.recordedAs !== 'AS_PLANNED' && s.fieldOrigins?.rir !== 'PLAN' && s.setKind !== 'WARM_UP';

/** Si en alguno de estos registros (los `contenido` de las ejecuciones de un plan) la persona declaró un esfuerzo. */
export function hayEsfuerzoDeclarado(registros: readonly { readonly exercises?: readonly { readonly sets?: readonly SerieParaElEsfuerzo[] | null }[] | null }[]): boolean {
  return registros.some((r) => (r.exercises ?? []).some((e) => (e.sets ?? []).some(declaroElEsfuerzo)));
}

/**
 * EP-D02: si el plan pide el esfuerzo de cada serie. Lo escrito en el plan manda (`true` o `false`); ausente, se pide
 * solo si la persona ya declaró esfuerzos en ese plan.
 */
export const pideElEsfuerzoDeCadaSerie = (planificacion: { readonly askSetEffort?: boolean } | null | undefined, yaDeclarado: boolean): boolean =>
  planificacion?.askSetEffort ?? yaDeclarado;

/**
 * En la app: si la serie muestra el campo del esfuerzo. `pide` es lo que trae API-SER-02 (`askSetEffort`); ausente (una
 * API anterior, o sin la lectura), como hasta ahora: se pide. Una aproximación, nunca (EP-D04).
 */
export const seMuestraElEsfuerzoDeLaSerie = (pide: boolean | null | undefined, tipo: 'WORKING' | 'WARM_UP' | null | undefined): boolean =>
  pide !== false && tipo !== 'WARM_UP';
