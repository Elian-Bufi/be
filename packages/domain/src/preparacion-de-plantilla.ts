/**
 * PLT (DL-182) · las reglas de la preparación de una plantilla de entrenamiento, que usan la API (al revisar y al guardar
 * la versión) y el website (la revisión antes de guardar).
 *
 * - **Lo que impide guardar la plantilla es poco, y no depende de ninguna persona** (PLT-D08): el nombre, en una plantilla
 *   nueva, y al menos una sesión en toda la plantilla. Un ejercicio que ya no está disponible lo agrega la API, que mira el
 *   catálogo; el nombre tomado, también (la regla vigente: único por profesional).
 * - **Lo incompleto de un plan no impide guardar una plantilla** (PLT-D09): una fase sin sesiones, una sesión sin
 *   ejercicios, un bloque vacío o uno «En vueltas» con un solo ejercicio quedan «para completar al adaptarla». Las reglas
 *   para activar siguen en el plan de cada persona (API-TRN-11 y 12), sin cambios.
 * - **Las cargas** (D-2 de DL-108): con el interruptor apagado, las cargas sugeridas escritas no van a la versión. Se
 *   cuentan para decirlo antes de guardar, no para impedirlo.
 */
import type { ValidationIssue } from './contratos';
import type { EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';
import { sesionesDeLaEstructura } from './contratos-plantillas';
import { CodigoDeProblemaDePlanDeEntrenamiento, problemasDeCompletitud, type ContenidoDePlanDeEntrenamiento } from './plan-de-entrenamiento';
import { serializacionCanonica } from './versionado';

type Estructura = EstructuraDePlanDeEntrenamientoEntrada;

/** Los problemas propios de la plantilla, con el código que dicen la revisión (API-TPL-11) y el rechazo al guardar (API-TPL-12). */
export const CodigoDeProblemaDeLaPlantilla = {
  /** Una plantilla nueva sin nombre: el nombre se exige al guardarla, no mientras se prepara. */
  TEMPLATE_NAME_REQUIRED: 'TEMPLATE_NAME_REQUIRED',
  /** Otro molde propio ya se llama así (sin distinguir mayúsculas ni acentos). */
  TEMPLATE_NAME_TAKEN: 'TEMPLATE_NAME_TAKEN',
  /** Ninguna sesión en toda la plantilla (PLT-D08). */
  TEMPLATE_SESSION_REQUIRED: 'TEMPLATE_SESSION_REQUIRED',
  /** La plantilla que se cambia está archivada: para una versión nueva, primero se reactiva. */
  TEMPLATE_ARCHIVED: 'TEMPLATE_ARCHIVED',
  /** PLT-D10: los cambios de una existente no cambian nada frente a su versión de base: no se guarda una versión igual. */
  TEMPLATE_UNCHANGED: 'TEMPLATE_UNCHANGED',
} as const;

/**
 * Lo que impide guardar la plantilla y no depende de la base: el nombre de una nueva y al menos una sesión. El nombre de
 * una existente no se mira: es el de la plantilla, y se cambia con API-TPL-05 (PLT-D05).
 */
export function problemasParaGuardarLaPlantilla(p: { readonly nueva: boolean; readonly nombre: string; readonly estructura: Estructura }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (p.nueva && p.nombre.trim() === '') issues.push({ code: CodigoDeProblemaDeLaPlantilla.TEMPLATE_NAME_REQUIRED, path: 'name' });
  if (sesionesDeLaEstructura(p.estructura) === 0) issues.push({ code: CodigoDeProblemaDeLaPlantilla.TEMPLATE_SESSION_REQUIRED, path: 'blocks' });
  return issues;
}

/**
 * Lo que queda para completar al adaptar la plantilla a una persona (PLT-D09): lo incompleto de un plan, que en una
 * plantilla no impide guardar. Sin ninguna sesión, «la fase no tiene sesiones» lo dice ya el problema que impide guardar:
 * no se repite.
 */
export function paraCompletarAlAdaptar(contenido: ContenidoDePlanDeEntrenamiento): ValidationIssue[] {
  const sinSesiones = contenido.blocks.every((b) => b.sessions.length === 0 && b.microcycles.every((m) => m.sessions.length === 0));
  const P = CodigoDeProblemaDePlanDeEntrenamiento;
  return problemasDeCompletitud(contenido).filter((x) => !(sinSesiones && (x.code === P.SESSION_REQUIRED || x.code === P.BLOCK_REQUIRED)));
}

/** Cuántos ejercicios tienen una carga sugerida escrita, en lo general o en alguna serie (D-2 de DL-108). */
export function ejerciciosConCargaEscrita(estructura: Estructura): number {
  const deSesion = (s: { readonly prescriptions: readonly { readonly suggestedLoad?: unknown; readonly sets: readonly { readonly suggestedLoad?: unknown }[] }[] }) =>
    s.prescriptions.filter((p) => (p.suggestedLoad ?? null) !== null || p.sets.some((x) => (x.suggestedLoad ?? null) !== null)).length;
  return estructura.blocks.reduce((n, b) => n + (b.sessions ?? []).reduce((m, s) => m + deSesion(s), 0) + (b.microcycles ?? []).reduce((m, c) => m + c.sessions.reduce((k, s) => k + deSesion(s), 0), 0), 0);
}

/**
 * PLT-D10: si guardar los cambios de una plantilla existente daría una versión igual a la de base: la misma estructura (con
 * las cargas que irían a la versión) y el mismo interruptor de las cargas. Se compara la forma canónica, sin el orden de
 * las claves. `estructuraQueIria` ya viene sin cargas si el interruptor está apagado.
 */
export function sinCambiosFrenteALaBase(
  base: { readonly estructura: unknown; readonly conCargas: boolean },
  preparada: { readonly estructuraQueIria: unknown; readonly conCargas: boolean },
): boolean {
  return base.conCargas === preparada.conCargas && serializacionCanonica(base.estructura) === serializacionCanonica(preparada.estructuraQueIria);
}

/** La estructura en blanco de una plantilla nueva: una fase, sin sesiones, como un plan nuevo (`plan.tsx`). */
export const ESTRUCTURA_EN_BLANCO: Estructura = { blocks: [{ label: 'Fase 1', sessions: [] }] };
