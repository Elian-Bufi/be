/**
 * Cuándo existe un cruce (WP-GRAFICOS fase 2, DL-174; SP-01, SP-02 y GR-24). Es puro: lo prueba
 * `apps/web/test/graficos-cruces.test.mjs` con el caso negado de cada cruce.
 *
 * **Caso 1:** el mismo profesional con las dos áreas permitidas por el PDP **y** planes o tomas propios en las dos (las
 * lecturas de API-PRJ-01 ya traen solo lo suyo). Solo ahí el cruce existe completo. Entre profesionales distintos (caso
 * 2) viaja solo lo que deja la matriz §3.1, por API-RES, en la fase 3: acá no se ofrece.
 *
 * **El caso negado:** si falta un área, el cruce no se ofrece, no aparece en gris ni con candado, y **no se pide ninguna
 * lectura**: tampoco la del área que sí está, porque el cruce no se va a dibujar.
 */
import type { AccesoDeLaPersona, Alcance } from '@be/domain';

export type CruceDelCaso1 = 'SP-01' | 'SP-02';

/** Las dos áreas que junta cada cruce. */
export const AREAS_DEL_CRUCE: Readonly<Record<CruceDelCaso1, readonly [Alcance, Alcance]>> = {
  'SP-01': ['NUTRICION', 'ENTRENAMIENTO'],
  'SP-02': ['NUTRICION', 'ANTROPOMETRIA'],
};

/** Las series que lee cada cruce, en el orden de sus carriles: la energía va al lado de los carbohidratos (SP-01). */
export const SERIES_DEL_CRUCE: Readonly<Record<CruceDelCaso1, readonly string[]>> = {
  'SP-01': ['nutricion.carbohidratos', 'nutricion.energia', 'entrenamiento.1rm-estimado'],
  'SP-02': ['nutricion.energia', 'antropometria.peso'],
};

/** Si el área está permitida y tiene planes o tomas propios del profesional que consulta. */
const conLoPropio = (acceso: AccesoDeLaPersona, area: Alcance): boolean => acceso.alcances.includes(area) && acceso.propios[area] === true;

/** Si el cruce existe con esta persona: caso 1, las dos áreas con lo propio. */
export function cruceOfrecido(cruce: CruceDelCaso1, acceso: AccesoDeLaPersona): boolean {
  return AREAS_DEL_CRUCE[cruce].every((area) => conLoPropio(acceso, area));
}

/** Las series que el cruce pide a la API. Sin el caso 1, ninguna: el caso negado no lee nada. */
export function lecturasDelCruce(cruce: CruceDelCaso1, acceso: AccesoDeLaPersona): readonly string[] {
  return cruceOfrecido(cruce, acceso) ? SERIES_DEL_CRUCE[cruce] : [];
}

/** Las áreas con etapas del plan (versiones activadas) que el profesional puede comparar: las permitidas y con plan propio. */
export function areasConEtapas(acceso: AccesoDeLaPersona): ('NUTRICION' | 'ENTRENAMIENTO')[] {
  return (['ENTRENAMIENTO', 'NUTRICION'] as const).filter((area) => conLoPropio(acceso, area));
}

/** GR-24 se ofrece si hay al menos un área con plan propio: las etapas son las versiones de ese plan. */
export const dosEtapasOfrecida = (acceso: AccesoDeLaPersona): boolean => areasConEtapas(acceso).length > 0;
