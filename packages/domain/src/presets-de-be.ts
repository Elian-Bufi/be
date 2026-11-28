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
 *
 * **DL-203 (PN-D03 a PN-D05): la prescripción sigue a la intensidad del plan,** o a la del ejercicio si la cambia. Antes
 * decían «RIR 2» aunque el plan fuera en RPE o en % RM:
 * - en RIR, el RIR del preset; en RPE, el mismo esfuerzo escrito como RPE (RPE = 10 − RIR: «RPE 8»);
 * - en % RM, un porcentaje por objetivo (Hipertrofia 70 %, Fuerza 85 % y Resistencia 60 %, ratificados por Dirección;
 *   Técnica 50 %, a ratificar): la carga sale del 1RM de la persona con el redondeo del plan (ET2-D05), la calcula el
 *   editor;
 * - en «Solo carga y repeticiones», sin esfuerzo.
 */
import type { DiaDeLaSemana, EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';
import type { IdDeZonaMuscular } from './zonas-musculares';
import { numero } from './formato-numeros';
import { aplicarPrescripcion, intensidadEnPalabras, leerPrescripcion, type CambioDelEjercicio, type PrescripcionLeida } from './prescripcion-rapida';

/**
 * 2 desde DL-196 parte B (EE-D37): cada sesión de una estructura dice las zonas que trabaja como principales en un reparto
 * típico (para la silueta del reparto semanal) y se sumó «Por grupo muscular · 5 días». 3 desde DL-203: las prescripciones
 * siguen a la intensidad del plan (RIR, RPE, % RM o sin esfuerzo). Lo ya aplicado no cambia.
 */
export const VERSION_DE_LOS_PRESETS_DE_BE = 3;

/**
 * DL-203: la intensidad con la que se lee y se aplica un preset de prescripción: la del plan (`RIR` escrito como RIR o como
 * RPE, `PERCENT_RM` o `NONE`, «Solo carga y repeticiones») o la del ejercicio, si tiene otra.
 */
export type IntensidadDelPreset = 'RIR' | 'RPE' | 'PERCENT_RM' | 'NONE';

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
  /** La línea en RIR, como se escribe en el editor: «4×8-12 RIR 2 · 90 s». En otra intensidad, `lineaDelPreset`. */
  readonly linea: string;
  /** «4×8-12 · RIR 2 · 90 s · sin cargas». En otra intensidad, `detalleDelPreset`. */
  readonly detalle: string;
  /** DL-203: el RIR del preset (en RPE se escribe 10 − RIR). */
  readonly rir: number;
  /** DL-203: el % RM del preset, cuando el plan o el ejercicio van en % RM. */
  readonly porcentajeRm: number;
}

export type PresetDeBe = PresetDeEstructura | PresetDePrescripcion;

const estructura = (clave: string, nombre: string, sesiones: PresetDeEstructura['sesiones']): PresetDeEstructura => ({
  tipo: 'ESTRUCTURA',
  clave,
  nombre,
  detalle: `${sesiones.length} sesiones · sin ejercicios`,
  sesiones,
});
const prescripcion = (clave: string, nombre: string, linea: string, detalle: string, rir: number, porcentajeRm: number): PresetDePrescripcion => ({ tipo: 'PRESCRIPCION', clave, nombre, linea, detalle, rir, porcentajeRm });

/**
 * DL-203 · el % RM de cada preset de prescripción. Hipertrofia, Fuerza y Resistencia, ratificados por Dirección
 * (2026-11-26); Técnica 50 %, propuesto por Claude y a ratificar (PN-D04): una carga liviana para aprender el gesto.
 */
export const PORCENTAJE_RM_DE_LOS_PRESETS = { HIPERTROFIA: 70, FUERZA: 85, RESISTENCIA: 60, TECNICA: 50 } as const;

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
  prescripcion('HIPERTROFIA', 'Hipertrofia', '4×8-12 RIR 2 · 90 s', '4×8-12 · RIR 2 · 90 s · sin cargas', 2, PORCENTAJE_RM_DE_LOS_PRESETS.HIPERTROFIA),
  prescripcion('FUERZA', 'Fuerza', '5×5 RIR 2 · 3 min', '5×5 · RIR 2 · 3 min · sin cargas', 2, PORCENTAJE_RM_DE_LOS_PRESETS.FUERZA),
  prescripcion('RESISTENCIA', 'Resistencia', '3×15 RIR 3 · 45 s', '3×15 · RIR 3 · 45 s · sin cargas', 3, PORCENTAJE_RM_DE_LOS_PRESETS.RESISTENCIA),
  prescripcion('TECNICA', 'Técnica', '3×8 RIR 4', '3×8 · RIR 4 · sin cargas', 4, PORCENTAJE_RM_DE_LOS_PRESETS.TECNICA),
];

export const PRESETS_DE_ESTRUCTURA = PRESETS_DE_BE.filter((p): p is PresetDeEstructura => p.tipo === 'ESTRUCTURA');
export const PRESETS_DE_PRESCRIPCION = PRESETS_DE_BE.filter((p): p is PresetDePrescripcion => p.tipo === 'PRESCRIPCION');

/** La prescripción de un preset, leída con la misma gramática que la línea del editor. */
export function prescripcionDelPreset(p: PresetDePrescripcion): PrescripcionLeida {
  const l = leerPrescripcion(p.linea);
  if (!l.ok) throw new Error(`El preset ${p.clave} no se lee: ${l.noSeEntiende}`);
  return l.leida;
}

// ─── DL-203 · el preset de prescripción en la intensidad del plan o del ejercicio ─────────────────────────────────

type PrescripcionEntrada = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number]['prescriptions'][number];

/** El esfuerzo del preset en una intensidad: «RIR 2», «RPE 8», «70 % RM» o nada («Solo carga y repeticiones»). */
export function esfuerzoDelPreset(p: PresetDePrescripcion, i: IntensidadDelPreset): string | null {
  if (i === 'NONE') return null;
  if (i === 'PERCENT_RM') return `${numero(p.porcentajeRm)} % RM`;
  return intensidadEnPalabras({ criterion: 'RIR', target: { value: p.rir, reference: null } }, i);
}

const partesDelPreset = (p: PresetDePrescripcion, i: IntensidadDelPreset): { readonly cabeza: string; readonly esfuerzo: string | null; readonly descanso: string | null } => {
  // La línea en RIR es la fuente: «4×8-12 RIR 2 · 90 s». Se separa en la cabeza, el esfuerzo y el descanso.
  const [cabeza, ...resto] = p.linea.split(' · ');
  return { cabeza: cabeza!.replace(/ RIR \d+$/, ''), esfuerzo: esfuerzoDelPreset(p, i), descanso: resto.length > 0 ? resto.join(' · ') : null };
};

/** «4×8-12 RPE 8 · 90 s»: la línea del preset en una intensidad, como se lee en la tarjeta. */
export function lineaDelPreset(p: PresetDePrescripcion, i: IntensidadDelPreset): string {
  const x = partesDelPreset(p, i);
  return [[x.cabeza, x.esfuerzo].filter(Boolean).join(' '), x.descanso].filter(Boolean).join(' · ');
}

/**
 * «4×8-12 · RPE 8 · 90 s · sin cargas»; en % RM, «4×8-12 · 70 % RM · 90 s · la carga sale del 1RM»; sin esfuerzo,
 * «3×8 · sin esfuerzo · sin cargas».
 */
export function detalleDelPreset(p: PresetDePrescripcion, i: IntensidadDelPreset): string {
  const x = partesDelPreset(p, i);
  return [x.cabeza, x.esfuerzo ?? COPY_PRESETS.sinEsfuerzo, x.descanso, i === 'PERCENT_RM' ? COPY_PRESETS.cargaDelUnoRm : COPY_PRESETS.sinCargas].filter(Boolean).join(' · ');
}

/**
 * La intensidad con la que un preset se aplica a un ejercicio: la suya si la cambia (un criterio propio, o «Sin criterio de
 * intensidad» por excepción) y si no, la del plan. Un criterio RIR propio se escribe en la notación del plan.
 */
export function intensidadParaElPreset(x: Pick<PrescripcionEntrada, 'intensity'>, delPlan: IntensidadDelPreset, sinIntensidadPropia: boolean): IntensidadDelPreset {
  if (sinIntensidadPropia) return 'NONE';
  if (x.intensity?.criterion === 'PERCENT_RM') return 'PERCENT_RM';
  if (x.intensity?.criterion === 'RIR') return delPlan === 'RPE' ? 'RPE' : 'RIR';
  return delPlan;
}

/**
 * Aplica un preset de BE a un ejercicio en una intensidad (DL-203). Las series, las repeticiones y el descanso, como
 * siempre (`aplicarPrescripcion`); el esfuerzo:
 * - RIR o RPE: el criterio RIR con el valor del preset (RPE 8 se guarda como RIR 2, DL-192);
 * - % RM: el criterio % RM con el % del preset; la referencia del % RM es la del ejercicio, si la tenía. Las series no
 *   llevan RIR propio. La carga la recalcula el editor con el 1RM de la persona (ET2-D05); sin 1RM, se conserva;
 * - sin esfuerzo: sin criterio y sin el RIR propio de las series.
 * Lo que se pierde se dice antes, en la notación del plan.
 */
export function aplicarPresetDeBe(x: PrescripcionEntrada, p: PresetDePrescripcion, i: IntensidadDelPreset): { readonly prescripcion: PrescripcionEntrada; readonly cambio: CambioDelEjercicio } {
  const leida = prescripcionDelPreset(p);
  const notacion: 'RIR' | 'RPE' = i === 'RPE' ? 'RPE' : 'RIR';
  if (i === 'RIR' || i === 'RPE') {
    const r = aplicarPrescripcion(x, leida);
    return {
      prescripcion: r.prescripcion,
      cambio: {
        ...r.cambio,
        intensidad: { antes: intensidadEnPalabras(x.intensity, notacion), despues: intensidadEnPalabras(r.prescripcion.intensity, notacion) },
        sePierde: i === 'RPE' ? r.cambio.sePierde.map((t) => t.replace(/pasa a ser RIR (\d+(?:,\d+)?)$/, (_m, n: string) => `pasa a ser RPE ${numero(10 - Number(n.replace(',', '.')))}`)) : r.cambio.sePierde,
      },
    };
  }
  // % RM o sin esfuerzo: las series y el descanso del preset, sin tocar el criterio todavía.
  const r = aplicarPrescripcion(x, { ...leida, rir: null });
  const sePierde = [...r.cambio.sePierde];
  const antes = intensidadEnPalabras(x.intensity, notacion);
  const intensity: PrescripcionEntrada['intensity'] =
    i === 'PERCENT_RM' ? { criterion: 'PERCENT_RM', target: { value: p.porcentajeRm, reference: x.intensity?.criterion === 'PERCENT_RM' ? (x.intensity.target.reference ?? null) : null } } : null;
  const despues = intensidadEnPalabras(intensity, notacion);
  if (antes && x.intensity?.criterion !== intensity?.criterion) sePierde.unshift(`Su criterio ${antes} pasa a ser ${despues ?? COPY_PRESETS.sinEsfuerzo}`);
  const sets = r.prescripcion.sets.map((s, n) => {
    if (s.rir === undefined) return s;
    const { rir, ...resto } = s;
    if (rir !== null && s.setKind !== 'WARM_UP') sePierde.push(`Serie ${n + 1}: su RIR propio (${numero(rir)}) se quita: ${i === 'PERCENT_RM' ? 'en % RM la serie no lleva RIR' : 'sin esfuerzo'}`);
    return resto;
  });
  return {
    prescripcion: { ...r.prescripcion, sets, intensity },
    cambio: {
      ...r.cambio,
      intensidad: { antes, despues },
      // En % RM la carga no queda «para revisar»: el editor la recalcula con el 1RM (si la persona no tiene, se conserva).
      carga: i === 'PERCENT_RM' ? { texto: r.cambio.carga.texto, revisar: null, delUnoRm: true } : r.cambio.carga,
      sePierde,
    },
  };
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
  // DL-203: el preset en la intensidad del plan.
  sinEsfuerzo: 'sin esfuerzo',
  sinCargas: 'sin cargas',
  cargaDelUnoRm: 'la carga sale del 1RM',
  cargaQueSaleDelUnoRm: 'Sale del 1RM de la persona, con el redondeo del plan',
  enLaIntensidad: (cual: string) => `En la intensidad del plan: ${cual}.`,
} as const;

/** DL-203: cómo se nombra cada intensidad del plan en la galería. */
export const NOMBRE_DE_LA_INTENSIDAD_DEL_PRESET: Readonly<Record<IntensidadDelPreset, string>> = {
  RIR: 'RIR',
  RPE: 'RPE',
  PERCENT_RM: '% RM',
  NONE: 'solo carga y repeticiones',
};
