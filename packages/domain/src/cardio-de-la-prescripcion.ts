/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-13 a ET3-15) · **el cardio**: un ejercicio de cardio (los de grupo
 * «Cardio» de la clasificación, ET1-12) se planifica con su **duración**, una **distancia** opcional y una **intensidad**
 * (una zona de 1 a 5, el esfuerzo percibido de 0 a 10, o unas palabras), y no con series × repeticiones × carga.
 *
 * **Lo mínimo correcto (ET3-D13): sin campo nuevo en el contrato.** Lo del cardio va en los parámetros del profesional de
 * siempre (B10-06:390, REG-06-111: cada uno con su rótulo, su valor y su unidad), con tres rótulos fijos de BE:
 * - «Duración»: los minutos (número, unidad «min»), o «Sin indicar» (texto, sin unidad) mientras no se escriben;
 * - «Distancia»: el número con su unidad, «km» o «m» (si no se planifica, no va);
 * - «Intensidad»: «Zona 2», «Esfuerzo 6 de 10» o lo que escriba el profesional (si no se planifica, no va).
 * Y una sola serie efectiva sin repeticiones, sin carga ni criterio de intensidad de fuerza: la persona la tilda al
 * terminar, como una plancha (DL-161). Así lo del cardio viaja igual por todas las lecturas (el plan, «Hoy», el registro
 * por serie, la exportación), por las plantillas, las copias y «Mis habituales», y **la APK congelada lo lee y lo muestra
 * sin cambiar nada** («Duración: 30 min»): no hace falta capacidad, migración ni operación nueva.
 *
 * Es puro: lo prueban `editor-de-entrenamiento-tanda-3.test.ts` y las pruebas del website.
 */
import { numero } from './formato-numeros';

/** Los tres rótulos de BE. Son la marca del cardio: no se traducen ni se cambian sin una migración de los planes. */
export const ROTULOS_DEL_CARDIO = { duracion: 'Duración', distancia: 'Distancia', intensidad: 'Intensidad' } as const;
/** La duración todavía sin escribir: un texto honesto, sin unidad, que la app muestra tal cual. */
export const DURACION_SIN_INDICAR = 'Sin indicar';
/** La unidad de la duración del cardio. */
export const UNIDAD_DE_LA_DURACION = 'min';
/** De 1 minuto a 10 horas, en minutos (admite medios: 2,5 min de un intervalo). */
export const LIMITES_DE_LA_DURACION = { min: 0.5, max: 600 } as const;
/** Hasta 1000 km o 100 000 m. */
export const LIMITES_DE_LA_DISTANCIA = { km: 1000, m: 100_000 } as const;

export type UnidadDeDistancia = 'km' | 'm';
export type IntensidadDelCardio =
  /** Zona de frecuencia cardíaca, de 1 a 5 (el modelo de cinco zonas). */
  | { readonly tipo: 'ZONA'; readonly zona: 1 | 2 | 3 | 4 | 5 }
  /** El esfuerzo percibido de la sesión de cardio, de 0 a 10 (CR-10). No es el RPE de una serie de fuerza (DL-192). */
  | { readonly tipo: 'ESFUERZO'; readonly valor: number }
  /** Unas palabras del profesional: «conversacional», «ritmo de 10 km». */
  | { readonly tipo: 'TEXTO'; readonly texto: string };

/** Lo del cardio de un ejercicio: lo que se planifica en lugar de las series. `null` en cada parte: sin indicar. */
export interface CardioDeLaPrescripcion {
  readonly duracionMinutos: number | null;
  readonly distancia: { readonly valor: number; readonly unidad: UnidadDeDistancia } | null;
  readonly intensidad: IntensidadDelCardio | null;
}

/** Un parámetro del profesional, como lo tienen la entrada, lo guardado y la lectura. */
export interface ParametroDelCardio {
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string | null;
}

/** Lo mínimo de una prescripción para saber si es de cardio. */
export interface PrescripcionConParametros {
  readonly professionalParameters?: readonly ParametroDelCardio[] | null;
  /** En la entrada y lo guardado, `repetitions`; en la lectura por serie (API-SER-01/02), `target.repetitions`. */
  readonly sets: readonly { readonly repetitions?: unknown; readonly target?: { readonly repetitions?: unknown; readonly suggestedLoad?: unknown } }[];
  readonly suggestedLoad?: unknown;
}

const R = ROTULOS_DEL_CARDIO;
const deRotulo = (ps: readonly ParametroDelCardio[] | null | undefined, rotulo: string): ParametroDelCardio | undefined => (ps ?? []).find((q) => q.label === rotulo);

/** La duración marca el cardio: en minutos o «Sin indicar». Un «Duración 30 s» de una plancha no es cardio. */
function esDuracionDelCardio(q: ParametroDelCardio | undefined): boolean {
  if (!q) return false;
  if (typeof q.value === 'number') return q.unit === UNIDAD_DE_LA_DURACION;
  return q.value === DURACION_SIN_INDICAR && !q.unit;
}

/**
 * Si la prescripción se planifica como cardio (ET3-D13): tiene la «Duración» de BE y, a lo sumo, una serie sin
 * repeticiones y sin carga. Un ejercicio de fuerza con un parámetro libre «Duración 1 min» y sus series sigue siendo de
 * fuerza.
 */
export function esCardio(p: PrescripcionConParametros): boolean {
  if (!esDuracionDelCardio(deRotulo(p.professionalParameters, R.duracion))) return false;
  if (p.sets.length > 1) return false;
  if (p.suggestedLoad !== null && p.suggestedLoad !== undefined) return false;
  const vacio = (x: unknown): boolean => x === null || x === undefined;
  return p.sets.every((s) => vacio(s.repetitions) && vacio(s.target?.repetitions) && vacio(s.target?.suggestedLoad));
}

const ZONA = /^Zona ([1-5])$/;
const ESFUERZO = /^Esfuerzo (\d{1,2}(?:,\d)?) de 10$/;

/** Lee la intensidad escrita en el parámetro. */
export function leerIntensidadDelCardio(texto: string): IntensidadDelCardio | null {
  const t = texto.trim();
  if (t === '') return null;
  const z = ZONA.exec(t);
  if (z) return { tipo: 'ZONA', zona: Number(z[1]) as 1 | 2 | 3 | 4 | 5 };
  const e = ESFUERZO.exec(t);
  if (e) {
    const valor = Number(e[1]!.replace(',', '.'));
    if (valor >= 0 && valor <= 10) return { tipo: 'ESFUERZO', valor };
  }
  return { tipo: 'TEXTO', texto: t };
}

/** La intensidad como se guarda en el parámetro y como la lee la persona: «Zona 2», «Esfuerzo 6 de 10». */
export function textoDeLaIntensidadDelCardio(i: IntensidadDelCardio): string {
  if (i.tipo === 'ZONA') return `Zona ${i.zona}`;
  if (i.tipo === 'ESFUERZO') return `Esfuerzo ${numero(i.valor, 1)} de 10`;
  return i.texto.trim();
}

/** Lo del cardio de una prescripción, o `null` si no es de cardio. */
export function cardioDe(p: PrescripcionConParametros): CardioDeLaPrescripcion | null {
  if (!esCardio(p)) return null;
  const duracion = deRotulo(p.professionalParameters, R.duracion)!;
  const distancia = deRotulo(p.professionalParameters, R.distancia);
  const intensidad = deRotulo(p.professionalParameters, R.intensidad);
  return {
    duracionMinutos: typeof duracion.value === 'number' ? duracion.value : null,
    distancia: distancia && typeof distancia.value === 'number' && (distancia.unit === 'km' || distancia.unit === 'm') ? { valor: distancia.value, unidad: distancia.unit } : null,
    intensidad: intensidad && typeof intensidad.value === 'string' ? leerIntensidadDelCardio(intensidad.value) : null,
  };
}

/** Los parámetros de BE para lo del cardio, en orden: duración, distancia e intensidad (lo sin indicar no va, salvo la duración). */
export function parametrosDelCardio(c: CardioDeLaPrescripcion): { label: string; value: string | number; unit?: string }[] {
  return [
    c.duracionMinutos !== null ? { label: R.duracion, value: c.duracionMinutos, unit: UNIDAD_DE_LA_DURACION } : { label: R.duracion, value: DURACION_SIN_INDICAR },
    ...(c.distancia ? [{ label: R.distancia, value: c.distancia.valor, unit: c.distancia.unidad }] : []),
    ...(c.intensidad && textoDeLaIntensidadDelCardio(c.intensidad) !== '' ? [{ label: R.intensidad, value: textoDeLaIntensidadDelCardio(c.intensidad) }] : []),
  ];
}

const ROTULOS = new Set<string>(Object.values(R));

/**
 * La prescripción con lo del cardio escrito (ET3-14): los tres parámetros de BE en lugar de los suyos (los demás
 * parámetros del profesional quedan), una sola serie efectiva sin repeticiones (conserva la nota de la primera), y sin
 * carga, descanso, bases ni criterio de intensidad de fuerza. Pura y genérica: sirve para la entrada del editor.
 */
export function conElCardio<P extends PrescripcionConParametros & { readonly intensity?: unknown }>(p: P, c: CardioDeLaPrescripcion): P {
  const otros = (p.professionalParameters ?? []).filter((q) => !ROTULOS.has(q.label));
  const primera = p.sets[0] as { readonly note?: string | null } | undefined;
  return {
    ...p,
    sets: [{ repetitions: null, ...(primera?.note ? { note: primera.note } : {}) }],
    intensity: null,
    suggestedLoad: null,
    restSeconds: null,
    loadBasis: null,
    repetitionBasis: null,
    professionalParameters: [...parametrosDelCardio(c), ...otros],
  };
}

/** Un cardio recién agregado: todo sin indicar (la duración se escribe; nada se inventa). */
export const CARDIO_SIN_INDICAR: CardioDeLaPrescripcion = { duracionMinutos: null, distancia: null, intensidad: null };

/**
 * Volver a series (ET3-D15): saca los tres parámetros de BE y deja una serie para completar. Lo de fuerza que tenía antes
 * no vuelve (se cargó como cardio): se escribe de nuevo.
 */
export function sinElCardio<P extends PrescripcionConParametros>(p: P): P {
  return { ...p, sets: [{ repetitions: null }], professionalParameters: (p.professionalParameters ?? []).filter((q) => !ROTULOS.has(q.label)) };
}

/** «30 min · 5 km · zona 2»: el renglón del cardio, plegado en el editor y en la app. */
export function cardioEnPalabras(c: CardioDeLaPrescripcion): string {
  const partes = [c.duracionMinutos !== null ? `${numero(c.duracionMinutos, 1)} min` : 'Duración sin indicar'];
  if (c.distancia) partes.push(`${numero(c.distancia.valor, c.distancia.unidad === 'km' ? 2 : 0)} ${c.distancia.unidad}`);
  if (c.intensidad) {
    const t = textoDeLaIntensidadDelCardio(c.intensidad);
    partes.push(c.intensidad.tipo === 'TEXTO' ? t : t.charAt(0).toLowerCase() + t.slice(1));
  }
  return partes.join(' · ');
}

export type ProblemaDelCardio = 'DURACION_FUERA_DE_RANGO' | 'DISTANCIA_FUERA_DE_RANGO' | 'ESFUERZO_FUERA_DE_RANGO';

/** Lo que no se puede guardar del cardio escrito (el editor lo dice en el campo; nada se corrige solo). */
export function problemasDelCardio(c: CardioDeLaPrescripcion): ProblemaDelCardio[] {
  const r: ProblemaDelCardio[] = [];
  if (c.duracionMinutos !== null && (!Number.isFinite(c.duracionMinutos) || c.duracionMinutos < LIMITES_DE_LA_DURACION.min || c.duracionMinutos > LIMITES_DE_LA_DURACION.max)) r.push('DURACION_FUERA_DE_RANGO');
  if (c.distancia && (!Number.isFinite(c.distancia.valor) || c.distancia.valor <= 0 || c.distancia.valor > LIMITES_DE_LA_DISTANCIA[c.distancia.unidad])) r.push('DISTANCIA_FUERA_DE_RANGO');
  if (c.intensidad?.tipo === 'ESFUERZO' && (c.intensidad.valor < 0 || c.intensidad.valor > 10)) r.push('ESFUERZO_FUERA_DE_RANGO');
  return r;
}

/** Si un ejercicio del catálogo es de cardio por su clasificación (ET1-12: el grupo muscular «Cardio»). */
export const esDeCardioPorLaClasificacion = (e: { readonly classification?: { readonly muscleGroup?: string | null } | null }): boolean => e.classification?.muscleGroup === 'CARDIO';

/** Los textos del cardio en el editor. Describen; no califican. */
export const COPY_CARDIO = {
  titulo: 'Cardio',
  duracion: 'Duración',
  minutos: 'min',
  distancia: 'Distancia',
  opcional: 'Opcional',
  intensidad: 'Intensidad',
  sinIndicar: 'Sin indicar',
  zona: 'Zona de frecuencia cardíaca',
  esfuerzo: 'Esfuerzo percibido (0 a 10)',
  texto: 'En palabras',
  queZona: 'Qué zona',
  cuantoEsfuerzo: 'Qué esfuerzo',
  enPalabras: 'Cómo lo describís',
  ejemploEnPalabras: 'Por ejemplo, conversacional',
  pasarACardio: 'Cargar como cardio',
  pasarASeries: 'Cargar con series',
  enLaApp: 'La persona lo ve como «Duración», «Distancia» e «Intensidad» y lo tilda al terminar.',
  problema: {
    DURACION_FUERA_DE_RANGO: `La duración va de ${numero(LIMITES_DE_LA_DURACION.min)} a ${numero(LIMITES_DE_LA_DURACION.max)} min.`,
    DISTANCIA_FUERA_DE_RANGO: 'La distancia tiene que ser mayor que 0 (hasta 1000 km).',
    ESFUERZO_FUERA_DE_RANGO: 'El esfuerzo va de 0 a 10.',
  } satisfies Record<ProblemaDelCardio, string>,
} as const;
