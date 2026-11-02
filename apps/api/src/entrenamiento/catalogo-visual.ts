import { ordenarZonasDeEjercicio, type EjercicioDeCatalogo, type FichaVisualDeEjercicio } from '@be/domain';
import type { Prisma, RolDeZonaMuscular } from '@prisma/client';
import { esUuid } from '../plataforma/ejecutor';
import type { FilaDeEjercicio } from './lectura-entrenamiento';
import { imagenesDeEjercicios, type ImagenALaFecha } from './lectura-por-serie';

/**
 * WP-CATALOGO-VISUAL — lo visual de un ejercicio: sus zonas musculares (DL-081) y su imagen (DL-123 y DL-162).
 * - Las zonas son la asignación vigente (la de mayor número) de una historia de solo agregar, como la imagen. Cada zona
 *   viaja por su identificador y su rol, sin porcentajes (REG-06-139); nunca sale de wger ni del nombre (B10-06 §22).
 * - En API-TRN-13 y su búsqueda, que leen las APK instaladas, viajan con la forma congelada de siempre (DL-152): las zonas
 *   en `muscleZones` y la imagen vigente en `didacticResources`. La ficha completa, con la procedencia y el texto
 *   alternativo de la imagen, es API-EJE-05.
 */

type Tx = Prisma.TransactionClient;
export type RelacionConZona = EjercicioDeCatalogo['muscleZones'][number];
export type RecursoDidactico = EjercicioDeCatalogo['didacticResources'][number];

export const ROL_HACIA_API: Readonly<Record<RolDeZonaMuscular, RelacionConZona['role']>> = { PRINCIPAL: 'PRIMARY', SECUNDARIO: 'SECONDARY' };
export const ROL_DESDE_API: Readonly<Record<RelacionConZona['role'], RolDeZonaMuscular>> = { PRIMARY: 'PRINCIPAL', SECONDARY: 'SECUNDARIO' };

/** Las zonas vigentes de un ejercicio: el número de su última asignación (0 si nunca tuvo) y la versión para la que se declaró. */
export interface ZonasVigentes {
  readonly numero: number;
  readonly versionDeEjercicioId: string | null;
  readonly zonas: RelacionConZona[];
}

const SIN_ZONAS: ZonasVigentes = { numero: 0, versionDeEjercicioId: null, zonas: [] };

/** Las zonas vigentes de cada ejercicio, por identidad. Un ejercicio que nunca tuvo zonas responde `SIN_ZONAS`. */
export async function zonasDeEjercicios(tx: Tx, ejercicioIds: readonly string[]): Promise<Map<string, ZonasVigentes>> {
  const ids = [...new Set(ejercicioIds)].filter(esUuid).map((id) => id.toLowerCase());
  const r = new Map<string, ZonasVigentes>(ids.map((id) => [id, SIN_ZONAS]));
  if (ids.length === 0) return r;
  const asignaciones = await tx.$queryRaw<{ ejercicioId: string; asignacionId: string; numero: number; versionDeEjercicioId: string }[]>`
    SELECT DISTINCT ON (a."ejercicio_id") a."ejercicio_id"::text AS "ejercicioId", a."id"::text AS "asignacionId", a."numero",
           a."version_de_ejercicio_id"::text AS "versionDeEjercicioId"
      FROM "asignacion_de_zonas_de_ejercicio" a
     WHERE a."ejercicio_id" = ANY(${ids}::uuid[])
     ORDER BY a."ejercicio_id", a."numero" DESC`;
  if (asignaciones.length === 0) return r;
  const zonas = await tx.$queryRaw<{ asignacionId: string; zonaId: string; rol: RolDeZonaMuscular }[]>`
    SELECT z."asignacion_id"::text AS "asignacionId", z."zona_id" AS "zonaId", z."rol"::text AS "rol"
      FROM "zona_de_ejercicio" z
     WHERE z."asignacion_id" = ANY(${asignaciones.map((a) => a.asignacionId)}::uuid[])`;
  for (const a of asignaciones) {
    const propias = zonas.filter((z) => z.asignacionId === a.asignacionId).map((z) => ({ zoneId: z.zonaId, role: ROL_HACIA_API[z.rol] }));
    r.set(a.ejercicioId, { numero: a.numero, versionDeEjercicioId: a.versionDeEjercicioId, zonas: ordenarZonasDeEjercicio(propias) });
  }
  return r;
}

/**
 * La imagen vigente como recurso didáctico de API-TRN-13 (09v10 §9), con la forma que leen las APK instaladas:
 * `resourceId` es el medio (lo que se pide con API-MED-03) y `resourceVersionId`, la asociación vigente. La licencia es la
 * declarada; sin licencia externa, su identificador es NO_EXTERNAL_LICENSE y su nombre, los términos de uso. La forma no
 * tiene un campo para la procedencia: si la imagen se generó con IA y la autoría no lo dice, la autoría lo agrega.
 */
export function recursosDidacticosDe(i: ImagenALaFecha | undefined): RecursoDidactico[] {
  if (!i || !i.imagen || !i.asociacionId) return [];
  const imagen = i.imagen;
  const conIa = imagen.provenance === 'AI_GENERATED' && !/\bIA\b|inteligencia artificial/i.test(imagen.authorship);
  return [
    {
      resourceId: imagen.mediaId,
      resourceVersionId: i.asociacionId,
      type: 'IMAGE',
      authorship: { name: conIa ? `${imagen.authorship} (generada con IA)` : imagen.authorship },
      license: imagen.license.kind === 'EXTERNAL' ? { id: imagen.license.id, label: imagen.license.label } : { id: 'NO_EXTERNAL_LICENSE', label: imagen.license.usage },
    },
  ];
}

/** Lo visual de cada ejercicio para las filas del catálogo: sus zonas y su imagen vigentes, con la forma de API-TRN-13. */
export type VisualDeFila = Pick<EjercicioDeCatalogo, 'muscleZones' | 'didacticResources'>;

export async function visualDeEjercicios(tx: Tx, ejercicioIds: readonly string[]): Promise<(ejercicioId: string) => VisualDeFila> {
  const zonas = await zonasDeEjercicios(tx, ejercicioIds);
  const imagenes = await imagenesDeEjercicios(tx, ejercicioIds, null);
  return (ejercicioId) => {
    const id = ejercicioId.toLowerCase();
    return { muscleZones: zonas.get(id)?.zonas ?? [], didacticResources: recursosDidacticosDe(imagenes.get(id)) };
  };
}

/** La ficha visual de un ejercicio (API-EJE-04 y 05). */
export function fichaVisualApi(f: FilaDeEjercicio, zonas: ZonasVigentes | undefined, imagen: ImagenALaFecha | undefined): FichaVisualDeEjercicio {
  return {
    exerciseId: f.ejercicioId,
    versionId: f.versionId,
    name: f.nombre,
    provenance: f.procedencia,
    muscleZones: zonas?.zonas ?? [],
    zonesVersion: zonas?.numero ?? 0,
    zonesExerciseVersionId: zonas?.versionDeEjercicioId ?? null,
    imageVersion: imagen?.numero ?? 0,
    image: imagen?.imagen ?? null,
  };
}

export async function fichasVisuales(tx: Tx, filas: readonly FilaDeEjercicio[]): Promise<FichaVisualDeEjercicio[]> {
  const ids = filas.map((f) => f.ejercicioId);
  const zonas = await zonasDeEjercicios(tx, ids);
  const imagenes = await imagenesDeEjercicios(tx, ids, null);
  return filas.map((f) => fichaVisualApi(f, zonas.get(f.ejercicioId.toLowerCase()), imagenes.get(f.ejercicioId.toLowerCase())));
}

/** El número de la última asignación de zonas del ejercicio: 0 si nunca tuvo. Es el `zonesVersion` que se espera. */
export async function ultimaAsignacionDeZonas(tx: Tx, ejercicioId: string): Promise<number> {
  const u = await tx.asignacionDeZonasDeEjercicio.findFirst({ where: { ejercicioId }, orderBy: { numero: 'desc' }, select: { numero: true } });
  return u?.numero ?? 0;
}

/**
 * Una asignación nueva con su lista completa de zonas (vacía quita todas). La base exige que siga a la anterior, que la
 * versión sea del ejercicio y que el autor sea quien lo cargó a mano, o que sea una curaduría de BE sobre el catálogo de
 * todos (trigger de la migración 20261102120000). Quien llama ya validó las zonas con `problemasDeZonas`.
 */
export async function asignarZonas(
  tx: Tx,
  p: { ejercicioId: string; versionDeEjercicioId: string; numero: number; autorId: string | null; procedencia: unknown; zonas: readonly RelacionConZona[] },
): Promise<void> {
  const asignacion = await tx.asignacionDeZonasDeEjercicio.create({
    data: { ejercicioId: p.ejercicioId, versionDeEjercicioId: p.versionDeEjercicioId, numero: p.numero, autorId: p.autorId, procedencia: p.procedencia as Prisma.InputJsonValue },
    select: { id: true },
  });
  if (p.zonas.length > 0) {
    await tx.zonaDeEjercicio.createMany({ data: p.zonas.map((z) => ({ asignacionId: asignacion.id, zonaId: z.zoneId, rol: ROL_DESDE_API[z.role] })) });
  }
}
