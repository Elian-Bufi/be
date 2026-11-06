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

// ─── La figura de zonas del website (WP-CATALOGO-VISUAL, etapa 2) ─────────────────────────────────────────────────────

/** Romboides y erectores van debajo de otras capas: la figura los pinta igual, y la lista lo aclara. */
export const ZONAS_DE_CAPA_PROFUNDA: readonly IdDeZonaMuscular[] = ['romboides', 'erectores'];

type RolDeZona = 'PRIMARY' | 'SECONDARY';

/** Las vistas en las que se dibuja una zona; ninguna si no es de las 17. */
export function vistasDeZona(id: string): readonly VistaAnatomica[] {
  return POR_ID.get(id)?.anatomicalViews ?? [];
}

/**
 * Las zonas de varios ejercicios juntas, como las de una sesión del plan: cada zona una sola vez, principal si lo es en
 * alguno de los ejercicios y, si no, secundaria. Lo que no es una de las 17 se deja afuera. **No cuenta ni suma nada por
 * zona** (REG-06-139; B10-06 §59): cuántos ejercicios la nombran no es un dato de la figura.
 */
export function zonasJuntas(listas: readonly (readonly { zoneId: string; role: RolDeZona }[])[]): { zoneId: IdDeZonaMuscular; role: RolDeZona }[] {
  const roles = new Map<IdDeZonaMuscular, RolDeZona>();
  for (const lista of listas) {
    for (const { zoneId, role } of lista) {
      if (!esZonaMuscular(zoneId)) continue;
      roles.set(zoneId, role === 'PRIMARY' || roles.get(zoneId) === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY');
    }
  }
  return ordenarZonasDeEjercicio([...roles].map(([zoneId, role]) => ({ zoneId, role })));
}

/**
 * Lo que dice la lista en texto que acompaña siempre a la figura (accesibilidad): los nombres de las principales y de las
 * secundarias, en el orden de lectura, con «(capa profunda)» donde corresponde. Lo que no es una de las 17 no se nombra.
 */
export function zonasEnTexto(zonas: readonly { zoneId: string; role: RolDeZona }[]): { principales: string[]; secundarias: string[] } {
  const nombre = (id: string) => `${nombreDeZona(id)}${(ZONAS_DE_CAPA_PROFUNDA as readonly string[]).includes(id) ? ` (${COPY_FIGURA_DE_ZONAS.capaProfunda})` : ''}`;
  const conocidas = ordenarZonasDeEjercicio(zonas.filter((z) => esZonaMuscular(z.zoneId)));
  return {
    principales: conocidas.filter((z) => z.role === 'PRIMARY').map((z) => nombre(z.zoneId)),
    secundarias: conocidas.filter((z) => z.role === 'SECONDARY').map((z) => nombre(z.zoneId)),
  };
}

/** «Pectoral», «Pectoral y Tríceps», «Pectoral, Deltoides y Tríceps». */
export function enumerarZonas(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/**
 * Las zonas en un renglón, para la fila de un ejercicio: «Pectoral y Tríceps», «Pectoral · secundaria: Deltoides»,
 * «Secundarias: Tríceps y Deltoides». Sin zonas, `null`: la fila no dice nada.
 */
export function zonasEnUnRenglon(zonas: readonly { zoneId: string; role: RolDeZona }[]): string | null {
  const { principales, secundarias } = zonasEnTexto(zonas);
  if (principales.length === 0 && secundarias.length === 0) return null;
  const rotulo = secundarias.length === 1 ? COPY_FIGURA_DE_ZONAS.secundaria : COPY_FIGURA_DE_ZONAS.secundarias;
  if (principales.length === 0) return `${rotulo}: ${enumerarZonas(secundarias)}`;
  if (secundarias.length === 0) return enumerarZonas(principales);
  return `${enumerarZonas(principales)} · ${rotulo.toLowerCase()}: ${enumerarZonas(secundarias)}`;
}

/**
 * Los textos de la figura. Dicen qué zonas nombra el ejercicio, nunca cuánto: ni un puntaje, ni una carga, ni un juicio
 * (TEST-PRJ-009). El color no es un peso (B10-06 §21): lo principal va lleno y lo secundario rayado, y la lista lo dice.
 */
export const COPY_FIGURA_DE_ZONAS = {
  titulo: 'Zonas musculares',
  deFrente: 'De frente',
  deEspalda: 'De espalda',
  principal: 'Principal',
  secundaria: 'Secundaria',
  principales: 'Principales',
  secundarias: 'Secundarias',
  capaProfunda: 'capa profunda',
  queMuestra: 'Lleno, las principales; rayado, las secundarias. La figura dice qué zonas nombra cada ejercicio, no cuánto.',
  sinZonasPropio: 'Este ejercicio todavía no tiene zonas musculares cargadas.',
  sinZonasDelCatalogo: 'BE todavía no cargó las zonas musculares de este ejercicio.',
  tituloDeLaSesion: 'Zonas de la sesión',
  deLaSesion: 'Las de sus ejercicios, juntas: una zona es principal si lo es en alguno.',
  sinZonasEnLaSesion: 'Los ejercicios de esta sesión todavía no tienen zonas musculares cargadas.',
  ejerciciosSinZonas: (n: number) => (n === 1 ? 'Un ejercicio de la sesión todavía no tiene zonas cargadas.' : `${n} ejercicios de la sesión todavía no tienen zonas cargadas.`),
  noSePudieronLeer: 'No pudimos leer las zonas musculares.',
  verDetalle: 'Ver detalle',
  cerrarDetalle: 'Cerrar detalle',
  generadaConIa: 'Imagen generada con IA',
} as const;
