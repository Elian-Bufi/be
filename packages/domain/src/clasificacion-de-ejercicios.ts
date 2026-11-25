/**
 * DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1, ET1-12 y ET1-D12 a ET1-D14) · la clasificación de un ejercicio del catálogo,
 * para los filtros de «Agregar ejercicios»: el grupo muscular (la categoría de wger), el equipamiento, el patrón de
 * movimiento y las articulaciones (mono o multiarticular).
 * - **Los 186 del catálogo base** la traen de la siembra (migración 20261125120000): la categoría y el material de wger y,
 *   propuestos por BE con criterio de entrenador, el patrón, las articulaciones y el equipamiento que wger no dice. Esa
 *   propuesta está **a validar por Dirección** (`prisma/datos/catalogo-base/clasificacion-de-ejercicios.csv`).
 * - **Los propios** la aceptan opcional al crearlos (API-INT-TRN-01): sin ella, el ejercicio sigue igual, solo que los filtros
 *   no lo encuentran por esos datos.
 * - **No juzga:** ordena el catálogo para buscar; no dice qué ejercicio es mejor (09v10:854: el catálogo no calcula).
 */
import { z } from 'zod';

export const GRUPOS_MUSCULARES = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'ABS', 'CALVES', 'CARDIO'] as const;
export const EQUIPAMIENTOS = ['BARBELL', 'EZ_BAR', 'DUMBBELL', 'KETTLEBELL', 'CABLE', 'MACHINE', 'BENCH', 'INCLINE_BENCH', 'PULL_UP_BAR', 'BAND', 'MAT', 'SWISS_BALL', 'BODYWEIGHT', 'OTHER'] as const;
export const PATRONES_DE_MOVIMIENTO = ['PUSH', 'PULL', 'SQUAT', 'HINGE', 'LUNGE', 'CORE', 'CARDIO', 'OTHER'] as const;
export const ARTICULACIONES = ['SINGLE', 'MULTI'] as const;

export const GrupoMuscularSchema = z.enum(GRUPOS_MUSCULARES);
export const EquipamientoSchema = z.enum(EQUIPAMIENTOS);
export const PatronDeMovimientoSchema = z.enum(PATRONES_DE_MOVIMIENTO);
export const ArticulacionesSchema = z.enum(ARTICULACIONES);
export type GrupoMuscular = z.infer<typeof GrupoMuscularSchema>;
export type Equipamiento = z.infer<typeof EquipamientoSchema>;
export type PatronDeMovimiento = z.infer<typeof PatronDeMovimientoSchema>;
export type Articulaciones = z.infer<typeof ArticulacionesSchema>;

/** La clasificación de un ejercicio: cada dato puede faltar (un ejercicio propio que no la cargó, o una parte sin decir). */
export const ClasificacionDeEjercicioSchema = z.strictObject({
  muscleGroup: GrupoMuscularSchema.nullable(),
  equipment: z.array(EquipamientoSchema).max(EQUIPAMIENTOS.length),
  movementPattern: PatronDeMovimientoSchema.nullable(),
  joints: ArticulacionesSchema.nullable(),
});
export type ClasificacionDeEjercicio = z.infer<typeof ClasificacionDeEjercicioSchema>;

export const CLASIFICACION_VACIA: ClasificacionDeEjercicio = { muscleGroup: null, equipment: [], movementPattern: null, joints: null };

/** Los nombres en pantalla. «Pantorrillas» y no «Gemelos»: es el grupo de wger, que suma el sóleo. */
export const NOMBRE_DEL_GRUPO_MUSCULAR: Readonly<Record<GrupoMuscular, string>> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  LEGS: 'Piernas',
  SHOULDERS: 'Hombros',
  ARMS: 'Brazos',
  ABS: 'Abdomen',
  CALVES: 'Pantorrillas',
  CARDIO: 'Cardio',
};
export const NOMBRE_DEL_EQUIPAMIENTO: Readonly<Record<Equipamiento, string>> = {
  BARBELL: 'Barra',
  EZ_BAR: 'Barra Z',
  DUMBBELL: 'Mancuernas',
  KETTLEBELL: 'Kettlebell',
  CABLE: 'Polea',
  MACHINE: 'Máquina',
  BENCH: 'Banco',
  INCLINE_BENCH: 'Banco inclinado',
  PULL_UP_BAR: 'Barra de dominadas',
  BAND: 'Banda elástica',
  MAT: 'Colchoneta',
  SWISS_BALL: 'Pelota suiza',
  BODYWEIGHT: 'Peso corporal',
  OTHER: 'Otro',
};
export const NOMBRE_DEL_PATRON: Readonly<Record<PatronDeMovimiento, string>> = {
  PUSH: 'Empuje',
  PULL: 'Tracción',
  SQUAT: 'Sentadilla',
  HINGE: 'Bisagra',
  LUNGE: 'Zancada',
  CORE: 'Core',
  CARDIO: 'Cardio',
  OTHER: 'Otro',
};
export const NOMBRE_DE_LAS_ARTICULACIONES: Readonly<Record<Articulaciones, string>> = { SINGLE: 'Monoarticular', MULTI: 'Multiarticular' };

/** El equipamiento que se nombra en el renglón: el principal, sin el banco ni la colchoneta si hay otro (son apoyos). */
const APOYOS: ReadonlySet<Equipamiento> = new Set(['BENCH', 'INCLINE_BENCH', 'MAT']);
export function equipamientoPrincipal(equipo: readonly Equipamiento[]): Equipamiento | null {
  return equipo.find((e) => !APOYOS.has(e)) ?? equipo[0] ?? null;
}

/** «Pecho · Barra · Multiarticular»: lo que se sabe, en un renglón; sin nada, `null`. */
export function clasificacionEnUnRenglon(c: ClasificacionDeEjercicio | null | undefined): string | null {
  if (!c) return null;
  const equipo = equipamientoPrincipal(c.equipment);
  const partes = [c.muscleGroup ? NOMBRE_DEL_GRUPO_MUSCULAR[c.muscleGroup] : null, equipo ? NOMBRE_DEL_EQUIPAMIENTO[equipo] : null, c.joints ? NOMBRE_DE_LAS_ARTICULACIONES[c.joints] : null].filter(
    (x): x is string => x !== null,
  );
  return partes.length > 0 ? partes.join(' · ') : null;
}

/** Los filtros de «Agregar ejercicios»: cada uno vacío (`null`) no filtra. */
export interface FiltrosDelCatalogo {
  readonly texto: string;
  readonly grupo: GrupoMuscular | null;
  readonly equipamiento: Equipamiento | null;
  readonly patron: PatronDeMovimiento | null;
  readonly articulaciones: Articulaciones | null;
  /** «Favoritos»: solo los de esta lista (los habituales del profesional), o `null`. */
  readonly favoritos: ReadonlySet<string> | null;
}
export const SIN_FILTROS: FiltrosDelCatalogo = { texto: '', grupo: null, equipamiento: null, patron: null, articulaciones: null, favoritos: null };

const normalizado = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Un ejercicio del catálogo, como lo filtra «Agregar ejercicios». */
export interface EjercicioParaFiltrar {
  readonly exerciseId: string;
  readonly name: string;
  readonly classification?: ClasificacionDeEjercicio | null;
}

/**
 * ET1-D13: el filtro del catálogo, en el navegador, sobre la lista entera. El texto busca, sin tildes ni mayúsculas y en
 * cualquier orden, en el nombre y en lo que dice la clasificación («pecho barra» encuentra el press de banca): «Buscar por
 * ejercicio, músculo o equipo». Los demás filtros se combinan (y); uno sin datos en el ejercicio no lo deja pasar.
 */
export function filtrarElCatalogo<E extends EjercicioParaFiltrar>(lista: readonly E[], f: FiltrosDelCatalogo): E[] {
  const palabras = normalizado(f.texto).split(/\s+/).filter(Boolean);
  return lista.filter((e) => {
    const c = e.classification ?? null;
    if (f.favoritos && !f.favoritos.has(e.exerciseId)) return false;
    if (f.grupo && c?.muscleGroup !== f.grupo) return false;
    if (f.equipamiento && !(c?.equipment ?? []).includes(f.equipamiento)) return false;
    if (f.patron && c?.movementPattern !== f.patron) return false;
    if (f.articulaciones && c?.joints !== f.articulaciones) return false;
    if (palabras.length === 0) return true;
    const dondeBuscar = normalizado(
      [
        e.name,
        c?.muscleGroup ? NOMBRE_DEL_GRUPO_MUSCULAR[c.muscleGroup] : '',
        ...(c?.equipment ?? []).map((x) => NOMBRE_DEL_EQUIPAMIENTO[x]),
        c?.movementPattern ? NOMBRE_DEL_PATRON[c.movementPattern] : '',
        c?.joints ? NOMBRE_DE_LAS_ARTICULACIONES[c.joints] : '',
      ].join(' '),
    );
    return palabras.every((p) => dondeBuscar.includes(p));
  });
}

/** El catálogo entero en orden alfabético (español, sin distinguir tildes), para la lista de «Agregar ejercicios». */
export const enOrdenAlfabetico = <E extends { readonly name: string }>(lista: readonly E[]): E[] => [...lista].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
