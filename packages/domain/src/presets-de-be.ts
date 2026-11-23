/**
 * ED-11 (WP-EDITORES-PROFESIONAL, §2.4; DL-167) · Los presets de BE de Entrenamiento: un punto de partida que el
 * profesional aplica con un clic y ajusta después. BE no los aplica solo ni los propone para una persona.
 *
 * Son siete (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12):
 * - **tres estructuras**, solo nombres de sesiones y días sugeridos;
 * - **cuatro prescripciones**, series × repeticiones, RIR y descanso, **sin cargas**.
 * Ninguno trae un ejercicio, un alimento ni una carga (ED-D2: BE no elige ejercicios). Son contenido estático
 * versionado: si cambian, sube `VERSION_DE_LOS_PRESETS_DE_BE`, y lo ya aplicado en un borrador no cambia (escribió
 * valores, no una regla). Sigue valiendo ED-D2: Dirección los valida antes de publicarlos.
 */
import type { DiaDeLaSemana } from './contratos-entrenamiento';
import type { IdDeZonaMuscular } from './zonas-musculares';
import { leerPrescripcion, type PrescripcionLeida } from './prescripcion-rapida';

/**
 * 2 desde DL-196 parte B (EE-D37): cada sesión de una estructura dice las zonas que trabaja como principales en un reparto
 * típico (para la silueta del reparto semanal) y se sumó «Por grupo muscular · 5 días». Lo ya aplicado no cambia.
 */
export const VERSION_DE_LOS_PRESETS_DE_BE = 2;

export interface PresetDeEstructura {
  readonly tipo: 'ESTRUCTURA';
  readonly clave: string;
  readonly nombre: string;
  /** «4 sesiones · sin ejercicios». */
  readonly detalle: string;
  /**
   * Cada sesión con sus días sugeridos y las zonas que trabaja como principales en un reparto típico (DL-196 parte B): sirven
   * para dibujar el reparto semanal en la silueta. No son ejercicios: BE no elige ejercicios (ED-D2).
   */
  readonly sesiones: readonly { readonly nombre: string; readonly dias: readonly DiaDeLaSemana[]; readonly zonas: readonly IdDeZonaMuscular[] }[];
}

export interface PresetDePrescripcion {
  readonly tipo: 'PRESCRIPCION';
  readonly clave: string;
  readonly nombre: string;
  /** La línea, como se escribe en el editor: «4×8-12 RIR 2 · 90 s». */
  readonly linea: string;
  /** «4×8-12 · RIR 2 · 90 s · sin cargas». */
  readonly detalle: string;
}

export type PresetDeBe = PresetDeEstructura | PresetDePrescripcion;

const estructura = (clave: string, nombre: string, sesiones: PresetDeEstructura['sesiones']): PresetDeEstructura => ({
  tipo: 'ESTRUCTURA',
  clave,
  nombre,
  detalle: `${sesiones.length} sesiones · sin ejercicios`,
  sesiones,
});
const prescripcion = (clave: string, nombre: string, linea: string, detalle: string): PresetDePrescripcion => ({ tipo: 'PRESCRIPCION', clave, nombre, linea, detalle });

const CUERPO_ENTERO: readonly IdDeZonaMuscular[] = ['pectoral', 'dorsal', 'deltoides', 'cuadriceps', 'isquios', 'gluteos', 'recto-abdominal'];
const TORSO: readonly IdDeZonaMuscular[] = ['pectoral', 'dorsal', 'romboides', 'deltoides', 'biceps', 'triceps'];
const PIERNAS: readonly IdDeZonaMuscular[] = ['cuadriceps', 'isquios', 'gluteos', 'aductores', 'gemelos', 'recto-abdominal'];
const EMPUJE: readonly IdDeZonaMuscular[] = ['pectoral', 'deltoides', 'triceps'];
const TIRON: readonly IdDeZonaMuscular[] = ['dorsal', 'romboides', 'trapecio', 'biceps', 'antebrazo'];
const PIERNAS_DE_LA_TRIADA: readonly IdDeZonaMuscular[] = ['cuadriceps', 'isquios', 'gluteos', 'gemelos'];

export const PRESETS_DE_BE: readonly PresetDeBe[] = [
  estructura('CUERPO_ENTERO_3', 'Cuerpo entero · 3 días', [
    { nombre: 'Cuerpo entero A', dias: ['MONDAY'], zonas: CUERPO_ENTERO },
    { nombre: 'Cuerpo entero B', dias: ['WEDNESDAY'], zonas: CUERPO_ENTERO },
    { nombre: 'Cuerpo entero C', dias: ['FRIDAY'], zonas: CUERPO_ENTERO },
  ]),
  estructura('TORSO_PIERNAS_4', 'Torso / Piernas · 4 días', [
    { nombre: 'Torso A', dias: ['MONDAY'], zonas: TORSO },
    { nombre: 'Piernas A', dias: ['TUESDAY'], zonas: PIERNAS },
    { nombre: 'Torso B', dias: ['THURSDAY'], zonas: TORSO },
    { nombre: 'Piernas B', dias: ['FRIDAY'], zonas: PIERNAS },
  ]),
  estructura('EMPUJE_TIRON_PIERNAS_6', 'Empuje / Tirón / Piernas · 6 días', [
    { nombre: 'Empuje A', dias: ['MONDAY'], zonas: EMPUJE },
    { nombre: 'Tirón A', dias: ['TUESDAY'], zonas: TIRON },
    { nombre: 'Piernas A', dias: ['WEDNESDAY'], zonas: PIERNAS_DE_LA_TRIADA },
    { nombre: 'Empuje B', dias: ['THURSDAY'], zonas: EMPUJE },
    { nombre: 'Tirón B', dias: ['FRIDAY'], zonas: TIRON },
    { nombre: 'Piernas B', dias: ['SATURDAY'], zonas: PIERNAS_DE_LA_TRIADA },
  ]),
  // DL-196 parte B (E13, EE-D37): la división por grupo muscular, cada grupo una vez por semana.
  estructura('POR_GRUPO_MUSCULAR_5', 'Por grupo muscular · 5 días', [
    { nombre: 'Pecho', dias: ['MONDAY'], zonas: ['pectoral'] },
    { nombre: 'Espalda', dias: ['TUESDAY'], zonas: ['dorsal', 'romboides', 'trapecio'] },
    { nombre: 'Piernas', dias: ['WEDNESDAY'], zonas: ['cuadriceps', 'isquios', 'gluteos', 'aductores', 'gemelos'] },
    { nombre: 'Hombros', dias: ['THURSDAY'], zonas: ['deltoides', 'trapecio'] },
    { nombre: 'Brazos', dias: ['FRIDAY'], zonas: ['biceps', 'triceps', 'antebrazo'] },
  ]),
  prescripcion('HIPERTROFIA', 'Hipertrofia', '4×8-12 RIR 2 · 90 s', '4×8-12 · RIR 2 · 90 s · sin cargas'),
  prescripcion('FUERZA', 'Fuerza', '5×5 RIR 2 · 3 min', '5×5 · RIR 2 · 3 min · sin cargas'),
  prescripcion('RESISTENCIA', 'Resistencia', '3×15 RIR 3 · 45 s', '3×15 · RIR 3 · 45 s · sin cargas'),
  prescripcion('TECNICA', 'Técnica', '3×8 RIR 4', '3×8 · RIR 4 · sin cargas'),
];

export const PRESETS_DE_ESTRUCTURA = PRESETS_DE_BE.filter((p): p is PresetDeEstructura => p.tipo === 'ESTRUCTURA');
export const PRESETS_DE_PRESCRIPCION = PRESETS_DE_BE.filter((p): p is PresetDePrescripcion => p.tipo === 'PRESCRIPCION');

/** La prescripción de un preset, leída con la misma gramática que la línea del editor. */
export function prescripcionDelPreset(p: PresetDePrescripcion): PrescripcionLeida {
  const l = leerPrescripcion(p.linea);
  if (!l.ok) throw new Error(`El preset ${p.clave} no se lee: ${l.noSeEntiende}`);
  return l.leida;
}

export const COPY_PRESETS = {
  galeria: 'Presets',
  deBe: 'De BE · punto de partida',
  tuyos: 'Tuyos',
  rotuloDeBe: 'De BE',
  noEsRecomendacion: 'punto de partida, no una recomendación',
  usar: 'Usar',
  nadaElegido: 'Elegí un preset para ver qué trae.',
  aplicarA: (nombre: string, donde: string) => `Aplicar «${nombre}» a ${donde}`,
  alcance: 'A qué se aplica',
  esteEjercicio: 'Este ejercicio',
  laSesion: (n: number) => `La sesión · ${n === 1 ? '1 ejercicio' : `${n} ejercicios`}`,
  aplicarAEjercicios: (n: number) => (n === 1 ? 'Aplicar a 1 ejercicio' : `Aplicar a ${n} ejercicios`),
  seActualizan: (n: number, sesion: string) => `Se actualizan ${n === 1 ? '1 ejercicio' : `${n} ejercicios`} de ${sesion}.`,
  lasCargasSeConservan: 'Las cargas se conservan y quedan para revisar.',
  cadaUnoPasa: (antes: number, despues: number) => `Cada uno pasa de ${antes} a ${despues} series.`,
  pasaDe: (nombre: string, antes: number, despues: number) => `${nombre} pasa de ${antes} a ${despues} series.`,
  loQueSePierde: 'Lo que se pierde:',
  nada: 'nada.',
  deshacerExplica: 'Después de aplicar, «Deshacer» devuelve todo como estaba, aunque ya se haya guardado.',
  escribeEnElBorrador: (persona: string) => `Se escribe en el borrador: ${persona} no ve nada`,
  aplicado: (n: number) => `Aplicado a ${n === 1 ? '1 ejercicio' : `${n} ejercicios`}`,
  deshacer: 'Deshacer',
  deshecho: 'Volvió como estaba.',
  sinEjercicios: 'Esta sesión todavía no tiene ejercicios: agregalos y después aplicá la prescripción.',
  estructuraEscribe: (n: number) => `Escribe ${n} sesiones con sus nombres y sus días sugeridos, sin ejercicios.`,
  estructuraReemplaza: 'Se reemplazan solo las sesiones sin nada escrito (sin ejercicios, indicaciones ni días). Las demás quedan.',
  tuyosPlantillas: 'Tus plantillas',
  tuyosSesiones: 'Tus sesiones habituales',
  sinTuyos: 'Todavía no guardaste ninguno. Con «Guardar como preset», en el «⋯» de la barra, quedan acá.',
  tuyosNoSeLeyeron: 'No pudimos leer tus presets. Los de BE se pueden usar igual.',
  prescripcionesPropiasMasAdelante: 'Tus prescripciones propias llegan con la próxima actualización del servidor.',
} as const;
