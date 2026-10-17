/**
 * Los textos de las notas de coordinación (WP-NOTAS-DE-COORDINACION; DL-140; RF-057 · UC-E07), para el website del
 * profesional y la APK de la persona. Las mismas palabras en los dos lados.
 * - **Los cuatro límites a la vista** al escribir (UC-E07, paso 6): no prescribir, no modificar, no decidir sobre otra área
 *   y no transferir responsabilidad. Una nota no es una revisión ni un cambio de plan, y no cierra nada.
 * - **Los dos avisos aprobados:** «la persona también la lee» (CRD-D2) y «escribí solo lo que el otro profesional necesita
 *   para su trabajo» (CRD-D3).
 * - Sin juicios ni puntajes, como todo el copy de BE: estos textos pasan por las listas de términos prohibidos de los tres
 *   dominios y de la cartera (`notas-de-coordinacion.test.ts`).
 */
import type { FinalidadDeNota, TipoDeReferenciaDeNota } from './contratos-notas-de-coordinacion';

/** CRD-D4: la finalidad, como se lee en las pantallas. */
export const ETIQUETA_DE_FINALIDAD_DE_NOTA: Readonly<Record<FinalidadDeNota, string>> = {
  CONTEXT_FOR_YOUR_AREA: 'Contexto para tu área',
  CHANGE_IN_MY_AREA: 'Cambio en mi área que conviene que sepas',
  COORDINATION_REQUEST: 'Pedido de coordinación',
};

/** UC-E07, paso 6: lo que una nota no hace. Se muestran al escribirla, siempre. */
export const LIMITES_DE_LA_NOTA: readonly string[] = [
  'No prescribe: lo que se indica en cada área lo indica su profesional.',
  'No modifica planes ni objetivos de otra área.',
  'No decide sobre otra área.',
  'No transfiere responsabilidad: cada profesional sigue a cargo de la suya.',
];

/** Cómo se llama cada tipo de recurso citado, en una frase. */
const NOMBRE_DE_LA_REFERENCIA: Readonly<Record<TipoDeReferenciaDeNota, string>> = {
  NUTRITION_PLAN_VERSION: 'Plan de Nutrición',
  NUTRITION_REVIEW: 'Revisión de Nutrición',
  TRAINING_PLAN_VERSION: 'Plan de Entrenamiento',
  TRAINING_REVIEW: 'Revisión de Entrenamiento',
  ANTHROPOMETRIC_EVALUATION: 'Toma antropométrica',
};

/** `AAAA-MM-DD` → `10/10/2026`, sin depender de la zona. */
const fechaCorta = (f: string): string => `${Number(f.slice(8, 10))}/${Number(f.slice(5, 7))}/${f.slice(0, 4)}`;

/**
 * El rótulo de un recurso citado (CRD-D5): qué es y de cuándo. Quien no puede abrirlo ve solo esto. `fecha` es el día civil
 * del recurso (la activación de una versión, la revisión, la toma), o `null` si no se conoce; `version`, el número de la
 * versión de un plan para quien lee: su orden de activación (1, 2, 3…), el mismo que muestran la pestaña Plan y la línea
 * de tiempo.
 */
export function rotuloDeReferencia(tipo: TipoDeReferenciaDeNota, datos: { readonly fecha: string | null; readonly version?: number | null }): string {
  const nombre = NOMBRE_DE_LA_REFERENCIA[tipo];
  const cuando = datos.fecha ? fechaCorta(datos.fecha) : null;
  if (tipo === 'NUTRITION_PLAN_VERSION' || tipo === 'TRAINING_PLAN_VERSION') {
    if (datos.version) return cuando ? `${nombre}, versión ${datos.version}, activada el ${cuando}` : `${nombre}, versión ${datos.version}`;
    return cuando ? `${nombre}, activado el ${cuando}` : nombre;
  }
  return cuando ? `${nombre} del ${cuando}` : nombre;
}

/** «Lic. Sofía Paz», «Lic. Sofía Paz y Prof. Martín Acosta», «A, B y C»: una lista de nombres en castellano. */
export function nombresEnUnaFrase(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/**
 * A quién va la nota, para el profesional que la lee: el nombre del destinatario, o todos los que la acompañaban al
 * escribirla, con sus nombres.
 */
export function paraQuienEs(modo: 'ALL' | 'ONE', nombres: readonly string[]): string {
  return modo === 'ONE' ? nombresEnUnaFrase(nombres) : `Todos los profesionales que la acompañan: ${nombresEnUnaFrase(nombres)}`;
}

/** El título de la nota en la línea de tiempo y en el Resumen: «Nota de coordinación · Pedido de coordinación». */
export const tituloDeLaNota = (finalidad: FinalidadDeNota): string => `Nota de coordinación · ${ETIQUETA_DE_FINALIDAD_DE_NOTA[finalidad]}`;

/** Los textos de las pantallas del website (el profesional) y de la APK (la persona). */
export const COPY_NOTAS_DE_COORDINACION = {
  // ─── Website: escribir ────────────────────────────────────────────────────────────────────────
  escribir: 'Escribir una nota de coordinación',
  escribirCorto: 'Nota de coordinación',
  tituloDelDialogo: 'Nota de coordinación',
  queEs: 'Una nota le da contexto a otro profesional que acompaña a esta persona. Lo de cada área lo sigue decidiendo su profesional.',
  limitesTitulo: 'Lo que una nota no hace',
  /** CRD-D2. */
  laPersonaLaLee: 'La persona también la lee, en su app.',
  /** CRD-D3. */
  soloLoNecesario: 'Escribí solo lo que el otro profesional necesita para su trabajo.',
  sinAdjuntos: 'Es texto, sin archivos adjuntos. BE no la resume ni la interpreta.',
  para: 'Para',
  paraTodos: (persona: string) => `Todos los profesionales que acompañan a ${persona}`,
  paraUno: 'Uno en particular',
  elegirUno: 'Elegí a quién',
  desde: 'Desde tu área',
  finalidad: 'Para qué',
  texto: 'Nota',
  caracteres: (usados: number, maximo: number) => `${usados} de ${maximo} caracteres`,
  referencias: 'Citar algo de tu área (optativo)',
  referenciasAyuda: 'Quien la recibe ve que lo citaste, pero lo abre solo si ya tenía acceso a eso.',
  sinReferencias: 'No hay planes activados, revisiones ni tomas tuyas para citar en esta área.',
  corrige: (fecha: string) => `Corrige la nota del ${fecha}`,
  corregir: 'Corregir con otra nota',
  corregirAyuda: 'Una nota no se edita ni se borra. Para corregirla, escribí otra que la cita.',
  enviar: 'Enviar la nota',
  enviando: 'Enviando…',
  volver: 'Volver sin enviar',
  enviada: 'Nota enviada. Está en la línea de tiempo de esta persona.',
  /** Nadie la puede recibir hoy (CRD-D1): no se envía. */
  sinDestinatarios: 'Hoy no hay otro profesional que acompañe a esta persona con su autorización vigente: la nota no tiene a quién llegar.',
  destinatarioNoDisponible: 'Ese profesional ya no puede recibir notas sobre esta persona. Elegí de nuevo.',
  referenciaNoDisponible: 'Algo de lo que citaste ya no se puede citar. Revisá las referencias.',
  // ─── Website: leer ────────────────────────────────────────────────────────────────────────────
  recientesTitulo: 'Notas recientes del equipo',
  recientesVacio: 'Todavía no hay notas de coordinación entre los profesionales de esta persona.',
  verTodas: 'Ver todas en la línea de tiempo',
  referenciaSinAcceso: 'La abre quien ya tenía acceso a eso: nombrarla no da acceso.',
  // ─── APK: la persona ──────────────────────────────────────────────────────────────────────────
  tituloPropias: 'Notas entre tus profesionales',
  entradaPropias: 'Notas entre tus profesionales',
  explicacionPropias: 'Lo que tus profesionales se escriben entre ellos sobre vos, para coordinar. Las ves todas: en BE no hay notas que no veas.',
  vacioPropias: 'Todavía no hay notas entre tus profesionales.',
  sinA3: 'Para ver tu historia, BE necesita tu autorización de datos de salud vigente. Podés darla en Cuenta, en Privacidad.',
  paraTusProfesionales: (nombres: string) => `Para: ${nombres}`,
  paraTodosTusProfesionales: (nombres: string) => `Para todos tus profesionales: ${nombres}`,
  laCorrige: (fecha: string) => `La corrige la nota del ${fecha}`,
} as const;
