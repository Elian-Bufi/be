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
import { leerPrescripcion, type PrescripcionLeida } from './prescripcion-rapida';

export const VERSION_DE_LOS_PRESETS_DE_BE = 1;

export interface PresetDeEstructura {
  readonly tipo: 'ESTRUCTURA';
  readonly clave: string;
  readonly nombre: string;
  /** «4 sesiones · sin ejercicios». */
  readonly detalle: string;
  readonly sesiones: readonly { readonly nombre: string; readonly dias: readonly DiaDeLaSemana[] }[];
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

export const PRESETS_DE_BE: readonly PresetDeBe[] = [
  estructura('CUERPO_ENTERO_3', 'Cuerpo entero · 3 días', [
    { nombre: 'Cuerpo entero A', dias: ['MONDAY'] },
    { nombre: 'Cuerpo entero B', dias: ['WEDNESDAY'] },
    { nombre: 'Cuerpo entero C', dias: ['FRIDAY'] },
  ]),
  estructura('TORSO_PIERNAS_4', 'Torso / Piernas · 4 días', [
    { nombre: 'Torso A', dias: ['MONDAY'] },
    { nombre: 'Piernas A', dias: ['TUESDAY'] },
    { nombre: 'Torso B', dias: ['THURSDAY'] },
    { nombre: 'Piernas B', dias: ['FRIDAY'] },
  ]),
  estructura('EMPUJE_TIRON_PIERNAS_6', 'Empuje / Tirón / Piernas · 6 días', [
    { nombre: 'Empuje A', dias: ['MONDAY'] },
    { nombre: 'Tirón A', dias: ['TUESDAY'] },
    { nombre: 'Piernas A', dias: ['WEDNESDAY'] },
    { nombre: 'Empuje B', dias: ['THURSDAY'] },
    { nombre: 'Tirón B', dias: ['FRIDAY'] },
    { nombre: 'Piernas B', dias: ['SATURDAY'] },
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
