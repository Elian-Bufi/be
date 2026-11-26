/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-01 a ET3-06) · **las Plantillas de BE** de Entrenamiento: planes completos,
 * con su planificación (fases por semanas, aproximaciones, progresión e intensidad), que BE ofrece a todos los profesionales
 * de Entrenamiento, como el Recetario de BE en Nutrición (DL-191).
 * - **Son datos versionados de BE** (ET3-D01): cada una tiene su clave y su número de versión; corregirla es una versión nueva
 *   en este archivo, nunca reescribir una versión ya publicada. Administración decide si cada una se ofrece o se retira
 *   (API-TPB-03 y 04); el contenido lo cura Dirección.
 * - **Son una propuesta, a validar por Elián** (ET3-D02): lo dicen en pantalla hasta que Dirección las valide.
 * - **Nombran los ejercicios por su número de wger** (el catálogo base de DL-141): al aplicarlas, BE busca la versión vigente
 *   de cada uno en el catálogo de ese entorno. Lo que no está, no entra, y se dice (ET3-D05).
 * - **Las cargas van en % RM** en los ejercicios principales; al aplicarla a una persona, BE resuelve cada carga con el 1RM de
 *   referencia de esa persona (DL-198) y, si no lo tiene, lo dice y deja la carga para completar (ET3-D03). Los accesorios van
 *   sin intensidad, con repeticiones y la carga «Sin indicar» (ET3-D04).
 */
import type { EstructuraDePlanDeEntrenamientoEntrada, IntensidadDelPlan, PasoDeRedondeo, ProgresionDeLaFase } from './contratos-entrenamiento';
import type { PlanificacionDeLaPlantilla } from './contratos-plantillas';
import type { EstadoDePlantillaDeBe, PlantillaDeBeApi } from './contratos-plantillas-de-be';
import { numero } from './formato-numeros';
import { progresionEnPalabras } from './progresiones';
import { implementoDelEjercicio, pasoPorOmision, porcentajesPara, seriesDeAproximacion } from './planificacion-del-plan';
import { cargaDelPorcentajeDe, unoRMEnUnRenglon, type UnoRMVigente } from './repeticion-maxima';

/** Cómo reparte el entrenamiento: lo que el profesional busca al elegir (ET3-01). */
export type DivisionDeLaPlantillaDeBe = 'FULL_BODY' | 'UPPER_LOWER' | 'PUSH_PULL_LEGS' | 'BODY_PART_SPLIT';

export const NOMBRE_DE_LA_DIVISION: Readonly<Record<DivisionDeLaPlantillaDeBe, string>> = {
  FULL_BODY: 'Cuerpo completo',
  UPPER_LOWER: 'Torso y pierna',
  PUSH_PULL_LEGS: 'Empuje, tracción y pierna',
  BODY_PART_SPLIT: 'Por grupo muscular',
};

/** Un ejercicio de la plantilla: su número de wger, el nombre con el que se lo escribió y lo que se pide. */
export interface EjercicioDeLaPlantillaDeBe {
  readonly wger: string;
  /** El nombre del catálogo base, para leer la plantilla sin la base (la pantalla muestra el del catálogo vigente). */
  readonly nombre: string;
  readonly series: number;
  readonly repeticiones: number | { readonly min: number; readonly max: number };
  /** El % RM de las series efectivas; `null`: un accesorio, sin intensidad (ET3-D04). */
  readonly porcentaje: number | null;
  readonly descanso: number;
  /** Cuántas aproximaciones «Por %» lleva (solo los de % RM). */
  readonly aproximaciones?: number;
}

export interface SesionDeLaPlantillaDeBe {
  readonly nombre: string;
  readonly ejercicios: readonly EjercicioDeLaPlantillaDeBe[];
}

export interface FaseDeLaPlantillaDeBe {
  readonly nombre: string;
  readonly proposito: string;
  readonly semanas: number;
  readonly sesiones: readonly SesionDeLaPlantillaDeBe[];
  /** La progresión de la fase (EE-D30), sobre los ejercicios en % RM. */
  readonly progresion: Pick<ProgresionDeLaFase, 'model' | 'loadStep' | 'repStep' | 'repRange' | 'waves' | 'deload'> | null;
}

export interface PlantillaDeBe {
  readonly clave: string;
  readonly version: number;
  readonly nombre: string;
  readonly descripcion: string;
  readonly division: DivisionDeLaPlantillaDeBe;
  readonly diasPorSemana: number;
  /** Los días que se sugieren, en palabras (los elige el profesional en «Días de la semana»). */
  readonly diasSugeridos: string;
  readonly intensidad: IntensidadDelPlan;
  readonly fases: readonly FaseDeLaPlantillaDeBe[];
}

// ─── Los ejercicios del catálogo base que usan (número de wger y nombre de BE) ───────────────────────────────

const SENTADILLA = { wger: '615', nombre: 'Sentadilla trasera con barra' } as const;
const PRESS_BANCA = { wger: '73', nombre: 'Press de banca plano con barra' } as const;
const REMO_BARRA = { wger: '83', nombre: 'Remo inclinado con barra, agarre prono' } as const;
const PESO_MUERTO = { wger: '184', nombre: 'Peso muerto convencional' } as const;
const RUMANO = { wger: '507', nombre: 'Peso muerto rumano con barra' } as const;
const PRESS_HOMBROS = { wger: '566', nombre: 'Press de hombros con barra' } as const;
const PRESS_INCLINADO_MANCUERNAS = { wger: '537', nombre: 'Press inclinado con mancuernas' } as const;
const JALON = { wger: '355', nombre: 'Jalón al pecho' } as const;
const REMO_POLEA = { wger: '394', nombre: 'Remo sentado en polea baja' } as const;
const DOMINADAS = { wger: '475', nombre: 'Dominadas con agarre prono' } as const;
const PRENSA = { wger: '371', nombre: 'Prensa de piernas' } as const;
const HIP_THRUST = { wger: '294', nombre: 'Hip thrust con barra' } as const;
const BULGARA = { wger: '1706', nombre: 'Sentadilla búlgara con mancuernas' } as const;
const CURL_FEMORAL = { wger: '365', nombre: 'Curl femoral acostado' } as const;
const EXTENSION_CUADRICEPS = { wger: '369', nombre: 'Extensión de cuádriceps en máquina' } as const;
const GEMELOS = { wger: '622', nombre: 'Elevación de talones de pie' } as const;
const LATERALES = { wger: '348', nombre: 'Elevaciones laterales con mancuernas' } as const;
const FACE_PULL = { wger: '222', nombre: 'Face pull en polea' } as const;
const APERTURAS = { wger: '135', nombre: 'Aperturas en máquina' } as const;
const FONDOS = { wger: '194', nombre: 'Fondos en paralelas' } as const;
const CURL_BARRA = { wger: '91', nombre: 'Curl de bíceps con barra' } as const;
const CURL_MARTILLO = { wger: '272', nombre: 'Curl martillo con mancuernas' } as const;
const TRICEPS_POLEA = { wger: '659', nombre: 'Extensión de tríceps en polea' } as const;
const PRESS_FRANCES = { wger: '246', nombre: 'Press francés con barra Z' } as const;
const PALLOF = { wger: '1194', nombre: 'Press Pallof' } as const;

type Base = { readonly wger: string; readonly nombre: string };
/** Un principal: en % RM, con sus aproximaciones y un descanso largo. */
const principal = (e: Base, series: number, repeticiones: EjercicioDeLaPlantillaDeBe['repeticiones'], porcentaje: number, aproximaciones = 3, descanso = 150): EjercicioDeLaPlantillaDeBe => ({
  ...e,
  series,
  repeticiones,
  porcentaje,
  descanso,
  aproximaciones,
});
/** Un accesorio: sin intensidad, con repeticiones; la carga la completa el profesional. */
const accesorio = (e: Base, series: number, repeticiones: EjercicioDeLaPlantillaDeBe['repeticiones'], descanso = 90): EjercicioDeLaPlantillaDeBe => ({ ...e, series, repeticiones, porcentaje: null, descanso });

const lineal = (loadStep: number, deload: ProgresionDeLaFase['deload'] = null): FaseDeLaPlantillaDeBe['progresion'] => ({ model: 'LINEAR', loadStep, repStep: null, repRange: null, waves: null, deload });
const doble = (min: number, max: number, loadStep: number): FaseDeLaPlantillaDeBe['progresion'] => ({ model: 'DOUBLE', loadStep, repStep: null, repRange: { min, max }, waves: null, deload: null });
const descargaEn = (week: number): ProgresionDeLaFase['deload'] => ({ week, mode: 'LOAD', workingLoadShare: 85, setsRemoved: 1 });

/**
 * Las cuatro de la semilla (ET3-D02): **propuesta de BE, a validar por Elián.** Criterio: lo clásico de un gimnasio
 * argentino, con barra, mancuernas, poleas y máquinas comunes; los principales en % RM (del 65 al 82 %), con dos o tres
 * aproximaciones; dos fases (una de base y otra más pesada), progresión lineal o doble y una semana de descarga.
 */
export const PLANTILLAS_DE_BE: readonly PlantillaDeBe[] = [
  {
    clave: 'BE-CUERPO-COMPLETO',
    version: 1,
    nombre: 'Cuerpo completo · 3 días',
    descripcion: 'Tres sesiones de cuerpo entero (A, B y C): un empuje, una tracción y una pierna en cada una. Para quien empieza o vuelve, o tiene tres días.',
    division: 'FULL_BODY',
    diasPorSemana: 3,
    diasSugeridos: 'lun · mié · vie',
    intensidad: 'PERCENT_RM',
    fases: [
      {
        nombre: 'Base',
        proposito: 'Aprender los movimientos y sumar trabajo de a poco.',
        semanas: 4,
        progresion: lineal(2.5),
        sesiones: [
          { nombre: 'Cuerpo completo A', ejercicios: [principal(SENTADILLA, 3, 10, 65), principal(PRESS_BANCA, 3, 10, 65), accesorio(REMO_POLEA, 3, 12), accesorio(PALLOF, 3, 12, 60)] },
          { nombre: 'Cuerpo completo B', ejercicios: [principal(RUMANO, 3, 10, 60), principal(PRESS_HOMBROS, 3, 10, 60), accesorio(JALON, 3, 12), accesorio(LATERALES, 3, 15, 60)] },
          { nombre: 'Cuerpo completo C', ejercicios: [accesorio(PRENSA, 3, 12, 120), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 10), principal(REMO_BARRA, 3, 10, 60), accesorio(CURL_FEMORAL, 3, 12)] },
        ],
      },
      {
        nombre: 'Fuerza',
        proposito: 'Más carga y menos repeticiones en los principales. La última semana, descarga.',
        semanas: 4,
        progresion: lineal(2.5, descargaEn(4)),
        sesiones: [
          { nombre: 'Cuerpo completo A', ejercicios: [principal(SENTADILLA, 4, 6, 77, 3, 180), principal(PRESS_BANCA, 4, 6, 77, 3, 180), accesorio(REMO_POLEA, 3, 10), accesorio(PALLOF, 3, 12, 60)] },
          { nombre: 'Cuerpo completo B', ejercicios: [principal(RUMANO, 4, 8, 70), principal(PRESS_HOMBROS, 4, 6, 75, 3, 180), accesorio(JALON, 3, 10), accesorio(LATERALES, 3, 15, 60)] },
          { nombre: 'Cuerpo completo C', ejercicios: [accesorio(PRENSA, 3, 10, 120), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 8), principal(REMO_BARRA, 4, 8, 70), accesorio(CURL_FEMORAL, 3, 10)] },
        ],
      },
    ],
  },
  {
    clave: 'BE-TORSO-PIERNA',
    version: 1,
    nombre: 'Torso y pierna · 4 días',
    descripcion: 'Dos sesiones de torso y dos de pierna por semana: cada grupo, dos veces. Para quien ya entrena y tiene cuatro días.',
    division: 'UPPER_LOWER',
    diasPorSemana: 4,
    diasSugeridos: 'lun · mar · jue · vie',
    intensidad: 'PERCENT_RM',
    fases: [
      {
        nombre: 'Acumulación',
        proposito: 'Series de 8 en los principales para sumar trabajo semana a semana.',
        semanas: 5,
        progresion: lineal(2.5),
        sesiones: [
          { nombre: 'Torso A', ejercicios: [principal(PRESS_BANCA, 4, 8, 70), principal(REMO_BARRA, 4, 8, 70), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 10), accesorio(JALON, 3, 10), accesorio(TRICEPS_POLEA, 3, 12, 60), accesorio(CURL_BARRA, 3, 12, 60)] },
          { nombre: 'Pierna A', ejercicios: [principal(SENTADILLA, 4, 8, 70, 3, 180), principal(RUMANO, 3, 10, 65), accesorio(PRENSA, 3, 12, 120), accesorio(CURL_FEMORAL, 3, 12), accesorio(GEMELOS, 4, 12, 60)] },
          { nombre: 'Torso B', ejercicios: [principal(PRESS_HOMBROS, 4, 8, 68), accesorio(DOMINADAS, 4, 8, 120), accesorio(REMO_POLEA, 3, 10), accesorio(LATERALES, 3, 15, 60), accesorio(FACE_PULL, 3, 15, 60)] },
          { nombre: 'Pierna B', ejercicios: [principal(PESO_MUERTO, 4, 6, 72, 3, 180), principal(HIP_THRUST, 3, 10, 70), accesorio(BULGARA, 3, 10), accesorio(EXTENSION_CUADRICEPS, 3, 12, 60), accesorio(PALLOF, 3, 12, 60)] },
        ],
      },
      {
        nombre: 'Intensificación',
        proposito: 'Series de 5 más pesadas en los principales. La última semana, descarga.',
        semanas: 3,
        progresion: lineal(2.5, descargaEn(3)),
        sesiones: [
          { nombre: 'Torso A', ejercicios: [principal(PRESS_BANCA, 4, 5, 80, 3, 180), principal(REMO_BARRA, 4, 6, 77), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 8), accesorio(JALON, 3, 8), accesorio(TRICEPS_POLEA, 3, 10, 60), accesorio(CURL_BARRA, 3, 10, 60)] },
          { nombre: 'Pierna A', ejercicios: [principal(SENTADILLA, 4, 5, 80, 3, 180), principal(RUMANO, 3, 8, 70), accesorio(PRENSA, 3, 10, 120), accesorio(CURL_FEMORAL, 3, 10), accesorio(GEMELOS, 4, 10, 60)] },
          { nombre: 'Torso B', ejercicios: [principal(PRESS_HOMBROS, 4, 5, 78, 3, 180), accesorio(DOMINADAS, 4, 6, 120), accesorio(REMO_POLEA, 3, 8), accesorio(LATERALES, 3, 12, 60), accesorio(FACE_PULL, 3, 15, 60)] },
          { nombre: 'Pierna B', ejercicios: [principal(PESO_MUERTO, 4, 4, 82, 3, 180), principal(HIP_THRUST, 3, 8, 75), accesorio(BULGARA, 3, 8), accesorio(EXTENSION_CUADRICEPS, 3, 10, 60), accesorio(PALLOF, 3, 12, 60)] },
        ],
      },
    ],
  },
  {
    clave: 'BE-EMPUJE-TRACCION-PIERNA',
    version: 1,
    nombre: 'Empuje, tracción y pierna · 3 o 6 días',
    descripcion: 'Tres sesiones por patrón: empuje, tracción y pierna. Se hacen una vez por semana (3 días) o dos (6 días).',
    division: 'PUSH_PULL_LEGS',
    diasPorSemana: 3,
    diasSugeridos: 'lun · mié · vie (o de lunes a sábado, dos vueltas)',
    intensidad: 'PERCENT_RM',
    fases: [
      {
        nombre: 'Hipertrofia',
        proposito: 'Doble progresión: primero las repeticiones de 8 a 10; al llegar a 10, más carga.',
        semanas: 6,
        progresion: doble(8, 10, 2.5),
        sesiones: [
          { nombre: 'Empuje', ejercicios: [principal(PRESS_BANCA, 3, { min: 8, max: 10 }, 70), principal(PRESS_HOMBROS, 3, { min: 8, max: 10 }, 65), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 10), accesorio(LATERALES, 3, 15, 60), accesorio(TRICEPS_POLEA, 3, 12, 60)] },
          { nombre: 'Tracción', ejercicios: [principal(REMO_BARRA, 3, { min: 8, max: 10 }, 70), accesorio(JALON, 3, 10), accesorio(REMO_POLEA, 3, 12), accesorio(FACE_PULL, 3, 15, 60), accesorio(CURL_MARTILLO, 3, 12, 60)] },
          { nombre: 'Pierna', ejercicios: [principal(SENTADILLA, 3, { min: 8, max: 10 }, 70, 3, 180), principal(RUMANO, 3, { min: 8, max: 10 }, 65), accesorio(PRENSA, 3, 12, 120), accesorio(CURL_FEMORAL, 3, 12), accesorio(GEMELOS, 4, 12, 60)] },
        ],
      },
      {
        nombre: 'Fuerza',
        proposito: 'Series de 5 en los principales, lineal. La última semana, descarga.',
        semanas: 3,
        progresion: lineal(2.5, descargaEn(3)),
        sesiones: [
          { nombre: 'Empuje', ejercicios: [principal(PRESS_BANCA, 4, 5, 80, 3, 180), principal(PRESS_HOMBROS, 4, 5, 77, 3, 180), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 8), accesorio(LATERALES, 3, 12, 60), accesorio(TRICEPS_POLEA, 3, 10, 60)] },
          { nombre: 'Tracción', ejercicios: [principal(REMO_BARRA, 4, 6, 77), accesorio(JALON, 3, 8), accesorio(REMO_POLEA, 3, 10), accesorio(FACE_PULL, 3, 15, 60), accesorio(CURL_MARTILLO, 3, 10, 60)] },
          { nombre: 'Pierna', ejercicios: [principal(SENTADILLA, 4, 5, 80, 3, 180), principal(RUMANO, 3, 6, 75), accesorio(PRENSA, 3, 10, 120), accesorio(CURL_FEMORAL, 3, 10), accesorio(GEMELOS, 4, 10, 60)] },
        ],
      },
    ],
  },
  {
    clave: 'BE-POR-GRUPO-MUSCULAR',
    version: 1,
    nombre: 'Por grupo muscular · 5 días',
    descripcion: 'Una sesión por grupo: pecho, espalda, piernas, hombros y brazos. Cada grupo, una vez por semana con más series.',
    division: 'BODY_PART_SPLIT',
    diasPorSemana: 5,
    diasSugeridos: 'de lunes a viernes',
    intensidad: 'PERCENT_RM',
    fases: [
      {
        nombre: 'Hipertrofia 1',
        proposito: 'Series de 10 a 12 para sumar trabajo por grupo.',
        semanas: 4,
        progresion: lineal(2.5),
        sesiones: [
          { nombre: 'Pecho', ejercicios: [principal(PRESS_BANCA, 4, 10, 67), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 10), accesorio(APERTURAS, 3, 12, 60), accesorio(FONDOS, 3, 10)] },
          { nombre: 'Espalda', ejercicios: [principal(REMO_BARRA, 4, 10, 65), accesorio(DOMINADAS, 3, 8, 120), accesorio(JALON, 3, 12), accesorio(REMO_POLEA, 3, 12)] },
          { nombre: 'Piernas', ejercicios: [principal(SENTADILLA, 4, 10, 67, 3, 180), principal(RUMANO, 3, 10, 62), accesorio(PRENSA, 3, 12, 120), accesorio(CURL_FEMORAL, 3, 12), accesorio(GEMELOS, 4, 15, 60)] },
          { nombre: 'Hombros', ejercicios: [principal(PRESS_HOMBROS, 4, 10, 62), accesorio(LATERALES, 4, 15, 60), accesorio(FACE_PULL, 3, 15, 60), accesorio(PALLOF, 3, 12, 60)] },
          { nombre: 'Brazos', ejercicios: [accesorio(CURL_BARRA, 4, 10, 75), accesorio(PRESS_FRANCES, 4, 10, 75), accesorio(CURL_MARTILLO, 3, 12, 60), accesorio(TRICEPS_POLEA, 3, 12, 60)] },
        ],
      },
      {
        nombre: 'Hipertrofia 2',
        proposito: 'Series de 8 con más carga. La última semana, descarga.',
        semanas: 4,
        progresion: lineal(2.5, descargaEn(4)),
        sesiones: [
          { nombre: 'Pecho', ejercicios: [principal(PRESS_BANCA, 4, 8, 72), accesorio(PRESS_INCLINADO_MANCUERNAS, 3, 8), accesorio(APERTURAS, 3, 10, 60), accesorio(FONDOS, 3, 8)] },
          { nombre: 'Espalda', ejercicios: [principal(REMO_BARRA, 4, 8, 70), accesorio(DOMINADAS, 3, 6, 120), accesorio(JALON, 3, 10), accesorio(REMO_POLEA, 3, 10)] },
          { nombre: 'Piernas', ejercicios: [principal(SENTADILLA, 4, 8, 72, 3, 180), principal(RUMANO, 3, 8, 67), accesorio(PRENSA, 3, 10, 120), accesorio(CURL_FEMORAL, 3, 10), accesorio(GEMELOS, 4, 12, 60)] },
          { nombre: 'Hombros', ejercicios: [principal(PRESS_HOMBROS, 4, 8, 68), accesorio(LATERALES, 4, 12, 60), accesorio(FACE_PULL, 3, 15, 60), accesorio(PALLOF, 3, 12, 60)] },
          { nombre: 'Brazos', ejercicios: [accesorio(CURL_BARRA, 4, 8, 75), accesorio(PRESS_FRANCES, 4, 8, 75), accesorio(CURL_MARTILLO, 3, 10, 60), accesorio(TRICEPS_POLEA, 3, 10, 60)] },
        ],
      },
    ],
  },
];

/** La plantilla de BE de esa clave y versión, o `null`. */
export const plantillaDeBe = (clave: string, version: number): PlantillaDeBe | null => PLANTILLAS_DE_BE.find((p) => p.clave === clave && p.version === version) ?? null;

/** Las semanas del plan: la suma de sus fases. */
export const semanasDeLaPlantillaDeBe = (p: PlantillaDeBe): number => p.fases.reduce((n, f) => n + f.semanas, 0);

/** Los números de wger que usa, sin repetir. */
export const ejerciciosDeLaPlantillaDeBe = (p: PlantillaDeBe): string[] => [...new Set(p.fases.flatMap((f) => f.sesiones.flatMap((s) => s.ejercicios.map((e) => e.wger))))];

/** «3 × 10 · 65 % RM» o «3 × 8–10» (el renglón de cada ejercicio en la vista previa). */
export function renglonDelEjercicioDeBe(e: EjercicioDeLaPlantillaDeBe): string {
  const reps = typeof e.repeticiones === 'number' ? String(e.repeticiones) : `${e.repeticiones.min}–${e.repeticiones.max}`;
  return e.porcentaje === null ? `${e.series} × ${reps}` : `${e.series} × ${reps} · ${numero(e.porcentaje)} % RM`;
}

/** El ejercicio del catálogo de ese entorno que corresponde a un número de wger. */
export interface EjercicioResuelto {
  readonly exerciseId: string;
  readonly exerciseVersionId: string;
  readonly nombre: string;
}

/** Lo que dice el armado de una plantilla de BE: la estructura y la planificación, con los ejercicios que no estaban. */
export interface PlantillaDeBeArmada {
  readonly estructura: EstructuraDePlanDeEntrenamientoEntrada;
  readonly planificacion: PlanificacionDeLaPlantilla;
  /** Los nombres (de la plantilla) de los que no están en el catálogo de este entorno: no entran (ET3-D05). */
  readonly noDisponibles: readonly string[];
}

const idDe = (...partes: (string | number)[]): string => `be-${partes.join('-')}`.slice(0, 64);

/**
 * La estructura de entrada (la de API-TRN-07) y la planificación de la plantilla, con los ejercicios del catálogo de este
 * entorno. Cada fase es un bloque, sin microciclos; los identificadores de nodo son estables (la planificación los nombra y
 * `planificacionDesdeLaPlantilla` los lleva al plan nuevo por su lugar). Sin cargas: las pone `conLasCargasDeLaPlantillaDeBe`.
 */
export function armarPlantillaDeBe(p: PlantillaDeBe, catalogo: ReadonlyMap<string, EjercicioResuelto>): PlantillaDeBeArmada {
  const noDisponibles = new Set<string>();
  const warmUps: NonNullable<PlanificacionDeLaPlantilla['warmUps']> = [];
  const progressions: NonNullable<PlanificacionDeLaPlantilla['progressions']> = [];
  const withoutIntensity: string[] = [];
  const blocks = p.fases.map((f, i) => {
    const blockId = idDe(i + 1);
    const principales: string[] = [];
    const sessions = f.sesiones.map((s, j) => ({
      sessionId: idDe(i + 1, j + 1),
      label: s.nombre,
      prescriptions: s.ejercicios.flatMap((e, k) => {
        const delCatalogo = catalogo.get(e.wger);
        if (!delCatalogo) {
          noDisponibles.add(e.nombre);
          return [];
        }
        const prescriptionId = idDe(i + 1, j + 1, k + 1);
        const repetitions = typeof e.repeticiones === 'number' ? { value: e.repeticiones } : { min: e.repeticiones.min, max: e.repeticiones.max };
        if (e.porcentaje !== null) {
          principales.push(prescriptionId);
          if (e.aproximaciones) {
            const paso: PasoDeRedondeo = pasoPorOmision(implementoDelEjercicio(delCatalogo.nombre), null);
            warmUps.push({ prescriptionId, mode: 'FROM_WORKING_LOAD', workingLoadShares: [...porcentajesPara(e.aproximaciones)], step: paso });
          }
        } else withoutIntensity.push(prescriptionId);
        return [
          {
            prescriptionId,
            exerciseVersionId: delCatalogo.exerciseVersionId,
            sets: Array.from({ length: e.series }, () => ({ repetitions })),
            intensity: e.porcentaje === null ? null : { criterion: 'PERCENT_RM', target: { value: e.porcentaje, reference: null } },
            suggestedLoad: null,
            restSeconds: e.descanso,
          },
        ];
      }),
    }));
    if (f.progresion && principales.length > 0) progressions.push({ blockId, ...f.progresion, prescriptionIds: principales });
    return { blockId, label: f.nombre, purpose: f.proposito, sessions };
  });
  const planificacion: PlanificacionDeLaPlantilla = {
    weeks: semanasDeLaPlantillaDeBe(p),
    phases: p.fases.map((f, i) => ({ blockId: idDe(i + 1), weeks: f.semanas })),
    ...(warmUps.length > 0 ? { warmUps } : {}),
    ...(progressions.length > 0 ? { progressions } : {}),
    intensity: p.intensidad,
    ...(withoutIntensity.length > 0 ? { withoutIntensity } : {}),
  };
  return { estructura: { blocks }, planificacion, noDisponibles: [...noDisponibles] };
}

/** Cómo quedó la carga de un ejercicio en % RM al aplicar la plantilla a una persona (ET3-03). */
export type CargaResuelta =
  | { readonly prescriptionId: string; readonly nombre: string; readonly porcentaje: number; readonly estado: 'RESUELTA'; readonly carga: { readonly value: number; readonly unit: 'kg' | 'lb' }; readonly base: string }
  | { readonly prescriptionId: string; readonly nombre: string; readonly porcentaje: number; readonly estado: 'SIN_UNO_RM' };

/**
 * ET3-03 y ET3-D03 · las cargas de los ejercicios en % RM con el 1RM de referencia de la persona (DL-198): la carga común
 * de las efectivas, redondeada al paso del implemento (`cargaDelPorcentajeDe`), la referencia del % RM con el origen del
 * 1RM (la que ve la persona) y sus aproximaciones «Por %» arriba. Sin 1RM, la carga queda sin indicar y se dice: el
 * profesional la completa, o calibra el 1RM y usa «Poner las cargas desde el 1RM». Nada se inventa.
 * `vigentes` va por el identificador del ejercicio del catálogo (no de su versión).
 */
export function conLasCargasDeLaPlantillaDeBe(
  armada: PlantillaDeBeArmada,
  ejercicioDeLaVersion: ReadonlyMap<string, { readonly exerciseId: string; readonly nombre: string }>,
  vigentes: ReadonlyMap<string, UnoRMVigente | null>,
): { readonly estructura: EstructuraDePlanDeEntrenamientoEntrada; readonly cargas: readonly CargaResuelta[] } {
  const cargas: CargaResuelta[] = [];
  const aproximaciones = new Map((armada.planificacion.warmUps ?? []).map((w) => [w.prescriptionId, w]));
  const blocks = armada.estructura.blocks.map((b) => ({
    ...b,
    sessions: (b.sessions ?? []).map((s) => ({
      ...s,
      prescriptions: s.prescriptions.map((pr) => {
        if (pr.intensity?.criterion !== 'PERCENT_RM' || !pr.prescriptionId) return pr;
        const ej = ejercicioDeLaVersion.get(pr.exerciseVersionId);
        const nombre = ej?.nombre ?? '';
        const porcentaje = pr.intensity.target.value;
        const vigente = ej ? (vigentes.get(ej.exerciseId) ?? null) : null;
        if (!vigente) {
          cargas.push({ prescriptionId: pr.prescriptionId, nombre, porcentaje, estado: 'SIN_UNO_RM' });
          return pr;
        }
        const carga = cargaDelPorcentajeDe(porcentaje, vigente.valor, nombre, pr.loadBasis ?? null);
        cargas.push({ prescriptionId: pr.prescriptionId, nombre, porcentaje, estado: 'RESUELTA', carga, base: `${numero(porcentaje)} % de ${numero(vigente.valor.value, 2)} ${vigente.valor.unit} = ${numero(carga.value, 2)} ${carga.unit}` });
        const w = aproximaciones.get(pr.prescriptionId);
        const previas = w ? seriesDeAproximacion(carga.value, w.workingLoadShares, w.step, carga.unit) : [];
        return {
          ...pr,
          suggestedLoad: carga,
          sets: [...previas.map((x) => ({ ...x, repetitions: { ...x.repetitions }, suggestedLoad: { ...x.suggestedLoad } })), ...pr.sets],
          intensity: { ...pr.intensity, target: { ...pr.intensity.target, reference: { description: unoRMEnUnRenglon(vigente) } } },
        };
      }),
    })),
  }));
  return { estructura: { blocks }, cargas };
}

/** El resumen de lo que se resolvió, en un renglón (ET3-03): «4 de 6 cargas con el 1RM de la persona». */
export function resumenDeLasCargas(cargas: readonly Pick<CargaResuelta, 'estado'>[]): string {
  const resueltas = cargas.filter((c) => c.estado === 'RESUELTA').length;
  if (cargas.length === 0) return 'La plantilla no tiene ejercicios en % RM.';
  if (resueltas === cargas.length) return `Las ${cargas.length} cargas en % RM salen del 1RM de la persona.`;
  if (resueltas === 0) return `La persona no tiene 1RM en ninguno de los ${cargas.length} ejercicios en % RM: las cargas quedan para completar.`;
  return `${resueltas} de ${cargas.length} cargas en % RM salen del 1RM de la persona; las otras quedan para completar.`;
}

/**
 * La plantilla como la lee el profesional (API-TPB-01) y Administración (API-TPB-03): sus fases, sesiones y ejercicios con
 * el nombre del catálogo de este entorno (o el de la plantilla, y `exerciseId: null`, si no está).
 */
export function plantillaDeBeParaLaApi(p: PlantillaDeBe, catalogo: ReadonlyMap<string, EjercicioResuelto>, estado: EstadoDePlantillaDeBe): PlantillaDeBeApi {
  return {
    key: p.clave,
    version: p.version,
    name: p.nombre,
    description: p.descripcion,
    split: p.division,
    daysPerWeek: p.diasPorSemana,
    suggestedDays: p.diasSugeridos,
    weeks: semanasDeLaPlantillaDeBe(p),
    intensity: p.intensidad,
    validation: 'PROPOSAL',
    state: estado,
    phases: p.fases.map((f) => ({
      name: f.nombre,
      purpose: f.proposito,
      weeks: f.semanas,
      progression: f.progresion ? progresionEnPalabras({ blockId: 'x', ...f.progresion, prescriptionIds: null }, 'kg') : null,
      sessions: f.sesiones.map((s) => ({
        label: s.nombre,
        exercises: s.ejercicios.map((e) => {
          const c = catalogo.get(e.wger);
          return { exerciseId: c?.exerciseId ?? null, name: c?.nombre ?? e.nombre, prescription: renglonDelEjercicioDeBe(e), oneRepMaxShare: e.porcentaje };
        }),
      })),
    })),
  };
}
