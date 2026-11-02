/**
 * DL-081 — El catálogo de las 17 zonas musculares (REG-06-137 y 138; 09v10 §8), con los nombres y los identificadores
 * del set de capas de Dirección del 2026-08-13 («BE-TRAIN · set de capas musculares», modelo masculino, vistas frontal
 * y posterior), entregado el 2026-11-02.
 *
 * - **Una zona es dominio, no un archivo** (REG-06-138). El identificador es el nombre del grupo en el set
 *   (`be-mask-{sexo}-{vista}-{zona}.png`): cada máscara cita la zona, y nunca al revés. El set femenino que falta usa los
 *   mismos 17 identificadores, sin un catálogo por sexo ni una migración.
 * - **9 + 10 − 2 = 17.** Nueve se ven de frente, diez de espalda, y dos en las dos vistas: antebrazo y deltoides
 *   (REG-06-137; 09v10:468-484).
 * - **El orden** es de la cabeza a los pies: el de un selector o una lista.
 * - **Nada se calcula con una zona.** El área de una máscara no es volumen ni importancia, y la relación de un ejercicio
 *   con una zona es PRIMARY o SECONDARY, sin porcentajes (REG-06-139; 09v10:436-446; B10-06 §20 y §21).
 */
import { z } from 'zod';

/** La vista anatómica en la que se representa una zona (09v10:458-463). */
export const VistaAnatomicaSchema = z.enum(['ANTERIOR', 'POSTERIOR']);
export type VistaAnatomica = z.infer<typeof VistaAnatomicaSchema>;

/** La versión del catálogo de zonas: cambia solo si cambia una zona, nunca por una máscara nueva. */
export const VERSION_DEL_CATALOGO_DE_ZONAS = 'zonas-be-2026-11-02';

/** Cada zona, con su identificador estable, su nombre visible y las vistas en las que se representa. */
export const ZONAS_MUSCULARES = [
  { zoneId: 'trapecio', name: 'Trapecio', anatomicalViews: ['POSTERIOR'] },
  { zoneId: 'deltoides', name: 'Deltoides', anatomicalViews: ['ANTERIOR', 'POSTERIOR'] },
  { zoneId: 'pectoral', name: 'Pectoral', anatomicalViews: ['ANTERIOR'] },
  { zoneId: 'romboides', name: 'Romboides', anatomicalViews: ['POSTERIOR'] },
  { zoneId: 'dorsal', name: 'Dorsal ancho', anatomicalViews: ['POSTERIOR'] },
  { zoneId: 'biceps', name: 'Bíceps', anatomicalViews: ['ANTERIOR'] },
  { zoneId: 'triceps', name: 'Tríceps', anatomicalViews: ['POSTERIOR'] },
  { zoneId: 'antebrazo', name: 'Antebrazo', anatomicalViews: ['ANTERIOR', 'POSTERIOR'] },
  { zoneId: 'recto-abdominal', name: 'Recto abdominal', anatomicalViews: ['ANTERIOR'] },
  { zoneId: 'oblicuos', name: 'Oblicuos', anatomicalViews: ['ANTERIOR'] },
  { zoneId: 'erectores', name: 'Erectores espinales', anatomicalViews: ['POSTERIOR'] },
  { zoneId: 'gluteos', name: 'Glúteos', anatomicalViews: ['POSTERIOR'] },
  { zoneId: 'cuadriceps', name: 'Cuádriceps', anatomicalViews: ['ANTERIOR'] },
  { zoneId: 'aductores', name: 'Aductores', anatomicalViews: ['ANTERIOR'] },
  { zoneId: 'isquios', name: 'Isquiotibiales', anatomicalViews: ['POSTERIOR'] },
  { zoneId: 'tibial', name: 'Tibial anterior', anatomicalViews: ['ANTERIOR'] },
  { zoneId: 'gemelos', name: 'Gemelos', anatomicalViews: ['POSTERIOR'] },
] as const satisfies readonly { zoneId: string; name: string; anatomicalViews: readonly VistaAnatomica[] }[];

export type IdDeZonaMuscular = (typeof ZONAS_MUSCULARES)[number]['zoneId'];

const POR_ID: ReadonlyMap<string, (typeof ZONAS_MUSCULARES)[number]> = new Map(ZONAS_MUSCULARES.map((zona) => [zona.zoneId, zona]));

/** Si el identificador es el de una de las 17 zonas. Sin tolerancia: ni mayúsculas, ni espacios, ni el nombre visible. */
export function esZonaMuscular(id: string): id is IdDeZonaMuscular {
  return POR_ID.has(id);
}

/** El nombre visible de una zona, o `null` si no es ninguna. */
export function nombreDeZona(id: string): string | null {
  return POR_ID.get(id)?.name ?? null;
}

/** El orden del catálogo, para ordenar las zonas de un ejercicio sin depender de cómo se cargaron. */
export function ordenDeZona(id: string): number {
  const i = ZONAS_MUSCULARES.findIndex((zona) => zona.zoneId === id);
  return i < 0 ? ZONAS_MUSCULARES.length : i;
}

/** API-ZON-01 · una zona del catálogo (09v10:454-465). */
export const ZonaMuscularSchema = z.strictObject({
  zoneId: z.string().min(1),
  name: z.string().min(1),
  anatomicalViews: z.array(VistaAnatomicaSchema).min(1),
  version: z.string().min(1),
});
export type ZonaMuscular = z.infer<typeof ZonaMuscularSchema>;
export const ListaDeZonasMuscularesResponseSchema = z.strictObject({ data: z.array(ZonaMuscularSchema) });
export type ListaDeZonasMusculares = z.infer<typeof ListaDeZonasMuscularesResponseSchema>;

/** El catálogo tal como lo responde API-ZON-01. */
export function zonasMuscularesApi(): ZonaMuscular[] {
  return ZONAS_MUSCULARES.map((zona) => ({ zoneId: zona.zoneId, name: zona.name, anatomicalViews: [...zona.anatomicalViews], version: VERSION_DEL_CATALOGO_DE_ZONAS }));
}

/**
 * Lo que no pasa en una lista de zonas de un ejercicio: una zona que no es de las 17 o una repetida (con cualquier
 * rol). Cero zonas es legítimo (REG-06-139). Cada problema lleva su ruta, como un 422 del contrato.
 */
export function problemasDeZonas(zonas: readonly { zoneId: string }[], prefijo = 'muscleZones'): { code: string; path: string }[] {
  const vistas = new Set<string>();
  const problemas: { code: string; path: string }[] = [];
  zonas.forEach((zona, i) => {
    if (!esZonaMuscular(zona.zoneId)) problemas.push({ code: 'MUSCLE_ZONE_UNKNOWN', path: `${prefijo}[${i}].zoneId` });
    else if (vistas.has(zona.zoneId)) problemas.push({ code: 'MUSCLE_ZONE_DUPLICATED', path: `${prefijo}[${i}].zoneId` });
    vistas.add(zona.zoneId);
  });
  return problemas;
}

/** Las zonas de un ejercicio en el orden de lectura: primero las principales y, dentro de cada rol, el del catálogo. */
export function ordenarZonasDeEjercicio<T extends { zoneId: string; role: 'PRIMARY' | 'SECONDARY' }>(zonas: readonly T[]): T[] {
  return [...zonas].sort((a, b) => (a.role === b.role ? ordenDeZona(a.zoneId) - ordenDeZona(b.zoneId) : a.role === 'PRIMARY' ? -1 : 1));
}
