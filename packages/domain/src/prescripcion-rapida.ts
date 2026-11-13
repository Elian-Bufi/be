/**
 * ED-22 y ED-11 (WP-EDITORES-PROFESIONAL; DL-167, DJ-8) · Prescribir en una línea, y aplicar una prescripción (escrita
 * o de un preset) a un ejercicio del borrador.
 *
 * **La línea.** `leerPrescripcion` lee «4×8-12 RIR 2 · 60 kg · 90 s», «5x5 @RIR1» o «3×15», y devuelve las series, las
 * repeticiones (un número o un rango), el RIR, la carga con su unidad y el descanso en segundos, o lo que no entendió.
 * **Nunca adivina:** lo que sobra, lo repetido o lo que está fuera de rango es un error, y no se aplica nada.
 * `escribirPrescripcion` escribe la forma que `leerPrescripcion` vuelve a leer igual.
 *
 * **Aplicar** (`aplicarPrescripcion`) escribe en el borrador, como cualquier valor, y dice antes qué cambia:
 * - la cantidad de series pasa a ser la de la prescripción (aplicar dos veces no duplica series);
 * - cada serie toma las repeticiones nuevas; lo que no trae la prescripción (la carga, un RIR que no dice) queda;
 * - **las cargas se conservan** (DJ-8): si cambian las repeticiones y hay una carga escrita, queda escrita y se marca
 *   «escrita para 6-8: revisala», sin cambiarla;
 * - lo que se pierde (una serie que se quita con valores propios, un valor propio de una serie que la prescripción
 *   reemplaza) se nombra antes.
 * «Deshacer» es la operación inversa: devolver la prescripción de antes, que el editor guarda como cualquier cambio.
 */
import type { EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';
import { esMilesConPunto, numero } from './formato-numeros';

type PrescripcionEntrada = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number]['prescriptions'][number];
type SerieEntrada = PrescripcionEntrada['sets'][number];
type Repeticiones = NonNullable<SerieEntrada['repetitions']>;

export interface PrescripcionLeida {
  readonly series: number;
  readonly repeticiones: Repeticiones;
  /** `null`: la línea no dice RIR, y el ejercicio conserva su criterio. */
  readonly rir: number | null;
  readonly carga: { readonly value: number; readonly unit: 'kg' | 'lb' } | null;
  readonly descanso: number | null;
}

export type LecturaDePrescripcion = { readonly ok: true; readonly leida: PrescripcionLeida } | { readonly ok: false; readonly noSeEntiende: string };

export const LIMITES_DE_LA_LINEA = { series: 20, repeticiones: 1000, rir: 10, descanso: 3600 } as const;

export const COPY_PRESCRIPCION_RAPIDA = {
  rotulo: 'Prescripción en una línea',
  ayuda: 'Por ejemplo, 4×8-12 RIR 2 · 60 kg · 90 s. Enter la aplica.',
  gramatica: [
    'Series × repeticiones: 4×8, 4x8-12 o 3×15. Va primero.',
    'RIR: «RIR 2» o «@RIR1», de 0 a 10.',
    'Carga: «60 kg», «2,5 kg» o «135 lb».',
    'Descanso: «90 s», «3 min» o «1:30».',
    'Lo demás se separa con «·» o con espacios. Lo que no se entiende no se aplica.',
  ],
  vacia: 'Escribí la prescripción, por ejemplo 4×8-12 RIR 2.',
  sinSeriesNiRepeticiones: 'Empezá por las series y las repeticiones, como 4×8-12.',
  noSeEntiende: (resto: string) => `No se entiende «${resto}». No se aplicó nada.`,
  repetido: (que: string) => `${que} está dos veces. No se aplicó nada.`,
  fueraDeRango: (que: string) => `${que} está fuera de rango. No se aplicó nada.`,
  seLee: (vista: string) => `Se lee: ${vista}`,
  escritaPara: (reps: string) => `escrita para ${reps}: revisala`,
} as const;

const NUMERO = String.raw`\d+(?:[.,]\d+)?`;
const aNumero = (t: string): number => Number(t.replace(',', '.'));

/** Lee una línea de prescripción. Lo que no entiende lo devuelve, y entonces no hay nada que aplicar. */
export function leerPrescripcion(texto: string): LecturaDePrescripcion {
  const C = COPY_PRESCRIPCION_RAPIDA;
  let resto = ` ${texto.trim().toLowerCase().replace(/[×✕]/g, 'x')} `;
  if (resto.trim() === '') return { ok: false, noSeEntiende: C.vacia };
  const cabeza = /^\s*(\d+)\s*x\s*(\d+)(?:\s*[-–]\s*(\d+))?(?=[\s·@]|$)/.exec(resto);
  if (!cabeza) return { ok: false, noSeEntiende: C.sinSeriesNiRepeticiones };
  resto = resto.slice(cabeza[0].length);
  const series = Number(cabeza[1]);
  const min = Number(cabeza[2]);
  const max = cabeza[3] === undefined ? null : Number(cabeza[3]);
  if (series < 1 || series > LIMITES_DE_LA_LINEA.series) return { ok: false, noSeEntiende: C.fueraDeRango('La cantidad de series') };
  if (min < 1 || (max ?? min) > LIMITES_DE_LA_LINEA.repeticiones || (max !== null && max < min)) return { ok: false, noSeEntiende: C.fueraDeRango('Las repeticiones') };
  const repeticiones: Repeticiones = max === null || max === min ? { value: min } : { min, max };

  /** Saca del resto lo que lee `re`; si aparece dos veces, es ambiguo. */
  const tomar = (re: RegExp): RegExpExecArray | null | 'repetido' => {
    const global = new RegExp(re.source, 'g');
    const todos = [...resto.matchAll(global)];
    if (todos.length > 1) return 'repetido';
    const m = re.exec(resto);
    if (m) resto = resto.slice(0, m.index) + ' ' + resto.slice(m.index + m[0].length);
    return m;
  };

  // El descanso con dos puntos va antes que la carga: «1:30» no es un número suelto.
  const reloj = tomar(/(?<![\d.,])(\d{1,2}):([0-5]\d)(?![\d:])/);
  const carga = tomar(new RegExp(String.raw`(?<![\d.,])(${NUMERO})\s*(kg|lb)(?![a-z])`));
  const rir = tomar(new RegExp(String.raw`@?\s*rir\s*(${NUMERO})(?![\d.,])`));
  const segundos = tomar(new RegExp(String.raw`(?<![\d.,])(\d+)\s*(?:s|seg|segundos)(?![a-z])`));
  const minutos = tomar(new RegExp(String.raw`(?<![\d.,])(${NUMERO})\s*(?:min|minutos|')(?![a-z])`));
  for (const [m, que] of [
    [reloj, 'El descanso'],
    [carga, 'La carga'],
    [rir, 'El RIR'],
    [segundos, 'El descanso'],
    [minutos, 'El descanso'],
  ] as const) {
    if (m === 'repetido') return { ok: false, noSeEntiende: C.repetido(que) };
  }
  const descansos = [reloj, segundos, minutos].filter((m) => m !== null);
  if (descansos.length > 1) return { ok: false, noSeEntiende: C.repetido('El descanso') };
  const sobra = resto.replace(/[\s·;|/]+/g, ' ').trim();
  if (sobra !== '') return { ok: false, noSeEntiende: C.noSeEntiende(sobra) };

  const r = rir && rir !== 'repetido' ? aNumero(rir[1]!) : null;
  if (r !== null && (r < 0 || r > LIMITES_DE_LA_LINEA.rir)) return { ok: false, noSeEntiende: C.fueraDeRango('El RIR') };
  if (carga && carga !== 'repetido' && esMilesConPunto(carga[1]!)) return { ok: false, noSeEntiende: C.noSeEntiende(carga[0].trim()) };
  const c = carga && carga !== 'repetido' ? { value: aNumero(carga[1]!), unit: carga[2] as 'kg' | 'lb' } : null;
  let d: number | null = null;
  if (reloj && reloj !== 'repetido') d = Number(reloj[1]) * 60 + Number(reloj[2]);
  if (segundos && segundos !== 'repetido') d = Number(segundos[1]);
  if (minutos && minutos !== 'repetido') d = aNumero(minutos[1]!) * 60;
  if (d !== null && (!Number.isInteger(d) || d > LIMITES_DE_LA_LINEA.descanso)) return { ok: false, noSeEntiende: C.fueraDeRango('El descanso') };
  return { ok: true, leida: { series, repeticiones, rir: r, carga: c, descanso: d } };
}

const textoDeReps = (r: Repeticiones): string => ('value' in r ? `${r.value}` : `${r.min}-${r.max}`);
const textoDelDescanso = (s: number): string => (s % 60 === 0 && s > 0 ? `${s / 60} min` : s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`);

/** La forma escrita, que `leerPrescripcion` vuelve a leer igual: «4×8-12 RIR 2 · 60 kg · 90 s». */
export function escribirPrescripcion(p: PrescripcionLeida): string {
  return [
    `${p.series}×${textoDeReps(p.repeticiones)}${p.rir !== null ? ` RIR ${numero(p.rir)}` : ''}`,
    ...(p.carga ? [`${numero(p.carga.value)} ${p.carga.unit}`] : []),
    ...(p.descanso !== null ? [textoDelDescanso(p.descanso)] : []),
  ].join(' · ');
}

/** La vista previa en palabras: «4 series · 8 a 12 · RIR 2 · 60 kg · 1:30». */
export function vistaPreviaDePrescripcion(p: PrescripcionLeida): string {
  const reps = 'value' in p.repeticiones ? `${p.repeticiones.value}` : `${p.repeticiones.min} a ${p.repeticiones.max}`;
  return [
    p.series === 1 ? '1 serie' : `${p.series} series`,
    reps,
    ...(p.rir !== null ? [`RIR ${numero(p.rir)}`] : []),
    ...(p.carga ? [`${numero(p.carga.value)} ${p.carga.unit}`] : []),
    ...(p.descanso !== null ? [`${Math.floor(p.descanso / 60)}:${String(p.descanso % 60).padStart(2, '0')}`] : []),
  ].join(' · ');
}

// ─── Aplicar ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que una aplicación cambia en un ejercicio, para la vista previa («antes → después») y lo que se pierde. */
export interface CambioDelEjercicio {
  readonly series: { readonly antes: number; readonly despues: number };
  readonly repeticiones: { readonly antes: string | null; readonly despues: string };
  /** El criterio de intensidad en palabras («RIR 2», «75 % RM»): un % RM que pasa a RIR también va en `sePierde`. */
  readonly intensidad: { readonly antes: string | null; readonly despues: string | null };
  readonly descanso: { readonly antes: number | null; readonly despues: number | null };
  /** La carga general, que se conserva; `revisar`: cambiaron las repeticiones y queda marcada. */
  readonly carga: { readonly texto: string | null; readonly revisar: string | null };
  /** Lo que se pierde, en palabras («Quitar la serie 4: se pierde su RIR (1) y su carga (82,5 kg)»). */
  readonly sePierde: readonly string[];
}

const repsDelEjercicio = (p: PrescripcionEntrada): string | null => {
  const distintas = [...new Set(p.sets.map((s) => (s.repetitions ? textoDeReps(s.repetitions) : '')))];
  return distintas.length === 1 && distintas[0] !== '' ? distintas[0]! : distintas.filter(Boolean).join(', ') || null;
};
const intensidadDe = (i: PrescripcionEntrada['intensity']): string | null =>
  !i ? null : i.criterion === 'RIR' ? `RIR ${numero(i.target.value)}` : i.criterion === 'PERCENT_RM' ? `${numero(i.target.value)} % RM` : null;

/** Los valores propios de una serie, en palabras: «su RIR (1) y su carga (82,5 kg)». */
export function valoresPropiosDeLaSerie(s: SerieEntrada): string | null {
  const partes = [
    ...(s.rir !== undefined && s.rir !== null ? [`su RIR (${numero(s.rir)})`] : []),
    ...(s.suggestedLoad ? [`su carga (${numero(s.suggestedLoad.value)} ${s.suggestedLoad.unit})`] : []),
    ...(s.restSeconds !== undefined && s.restSeconds !== null ? [`su descanso (${textoDelDescanso(s.restSeconds)})`] : []),
    ...(s.note ? [`su nota («${s.note}»)`] : []),
  ];
  if (partes.length === 0) return null;
  return partes.length === 1 ? partes[0]! : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/** ED-23: lo que se pierde al quitar las series desde `desde` (en base 0). Vacío si ninguna tenía valores propios. */
export function loQueSePierdeAlQuitarSeries(sets: readonly SerieEntrada[], desde: number): readonly string[] {
  return sets.flatMap((s, n) => {
    if (n < desde) return [];
    const propios = valoresPropiosDeLaSerie(s);
    return propios ? [`Quitar la serie ${n + 1}: se pierde ${propios}`] : [];
  });
}

/**
 * Aplica una prescripción leída a un ejercicio. Devuelve el ejercicio nuevo y lo que cambia. Las series que quedan
 * conservan su nota y su carga propia; el RIR y el descanso propios se reemplazan solo si la prescripción los trae (y
 * entonces se nombran en `sePierde`).
 */
export function aplicarPrescripcion(p: PrescripcionEntrada, l: PrescripcionLeida): { readonly prescripcion: PrescripcionEntrada; readonly cambio: CambioDelEjercicio } {
  const sePierde: string[] = [...loQueSePierdeAlQuitarSeries(p.sets, l.series)];
  // DJ-8: un criterio % RM que la prescripción cambia por RIR se nombra antes, con su referencia.
  if (l.rir !== null && p.intensity?.criterion === 'PERCENT_RM') {
    const ref = p.intensity.target.reference?.description;
    sePierde.unshift(`Su criterio % RM (${numero(p.intensity.target.value)} %${ref ? `, referencia «${ref}»` : ''}) pasa a ser RIR ${numero(l.rir)}`);
  }
  const sets: SerieEntrada[] = Array.from({ length: l.series }, (_, n) => {
    const antes = p.sets[n];
    const nueva: SerieEntrada = { repetitions: l.repeticiones };
    if (antes?.note) nueva.note = antes.note;
    if (antes?.suggestedLoad !== undefined) nueva.suggestedLoad = antes.suggestedLoad;
    if (antes?.rir !== undefined) {
      if (l.rir === null) nueva.rir = antes.rir;
      else if (antes.rir !== null) sePierde.push(`Serie ${n + 1}: su RIR propio (${numero(antes.rir)}) pasa a ser el de la prescripción`);
    }
    if (antes?.restSeconds !== undefined) {
      if (l.descanso === null) nueva.restSeconds = antes.restSeconds;
      else if (antes.restSeconds !== null) sePierde.push(`Serie ${n + 1}: su descanso propio (${textoDelDescanso(antes.restSeconds)}) pasa a ser el de la prescripción`);
    }
    return nueva;
  });
  const repsAntes = repsDelEjercicio(p);
  const repsDespues = textoDeReps(l.repeticiones);
  const carga = l.carga ?? p.suggestedLoad ?? null;
  const conCargas = !!carga || p.sets.some((s) => !!s.suggestedLoad);
  const revisar = !l.carga && conCargas && repsAntes !== null && repsAntes !== repsDespues ? COPY_PRESCRIPCION_RAPIDA.escritaPara(repsAntes) : null;
  const intensity: PrescripcionEntrada['intensity'] = l.rir !== null ? { criterion: 'RIR', target: { value: l.rir, reference: null } } : p.intensity;
  const prescripcion: PrescripcionEntrada = {
    ...p,
    sets,
    intensity,
    ...(l.carga ? { suggestedLoad: l.carga } : {}),
    ...(l.descanso !== null ? { restSeconds: l.descanso } : {}),
  };
  return {
    prescripcion,
    cambio: {
      series: { antes: p.sets.length, despues: l.series },
      repeticiones: { antes: repsAntes, despues: repsDespues },
      intensidad: { antes: intensidadDe(p.intensity), despues: intensidadDe(intensity) },
      descanso: { antes: p.restSeconds ?? null, despues: l.descanso ?? p.restSeconds ?? null },
      carga: { texto: carga ? `${numero(carga.value)} ${carga.unit}` : null, revisar },
      sePierde,
    },
  };
}

// ─── ED-13 (WP-EDITORES-PROFESIONAL; DL-167) · la prescripción habitual ─────────────────────────────────────────────

/** Una prescripción habitual, como la guarda API-HAB-07: lo de una prescripción menos el ejercicio, la nota y las cargas. */
export interface ContenidoDePrescripcionHabitual {
  readonly sets: readonly Omit<SerieEntrada, 'suggestedLoad'>[];
  readonly intensity: PrescripcionEntrada['intensity'];
  readonly restSeconds?: number | null;
  readonly loadBasis?: PrescripcionEntrada['loadBasis'];
  readonly repetitionBasis?: PrescripcionEntrada['repetitionBasis'];
  readonly professionalParameters?: PrescripcionEntrada['professionalParameters'];
}

/**
 * «Estas series, como prescripción habitual» (ED-12 y ED-13): lo que se guarda de un ejercicio. Las cargas no viajan
 * (son de cada persona y de cada ejercicio, ED-D2 y A05; la API las rechaza con un 400), ni la nota del ejercicio ni
 * las de sus series, que pueden nombrar a la persona. `seQuita` dice antes qué no se guarda.
 */
export function prescripcionHabitualDe(p: PrescripcionEntrada): { readonly contenido: ContenidoDePrescripcionHabitual; readonly seQuita: readonly string[] } {
  const seQuita: string[] = [];
  if (p.suggestedLoad || p.sets.some((s) => !!s.suggestedLoad)) seQuita.push('las cargas, que son de cada persona y de cada ejercicio');
  if (p.note || p.sets.some((s) => !!s.note)) seQuita.push('las notas, que pueden nombrar a la persona');
  const sets = p.sets.map(({ suggestedLoad: _carga, note: _nota, ...s }) => s);
  const contenido: ContenidoDePrescripcionHabitual = {
    sets,
    intensity: p.intensity,
    ...(p.restSeconds !== undefined ? { restSeconds: p.restSeconds } : {}),
    ...(p.loadBasis !== undefined ? { loadBasis: p.loadBasis } : {}),
    ...(p.repetitionBasis !== undefined ? { repetitionBasis: p.repetitionBasis } : {}),
    ...(p.professionalParameters && p.professionalParameters.length > 0 ? { professionalParameters: p.professionalParameters } : {}),
  };
  return { contenido, seQuita };
}

/**
 * Aplica una prescripción habitual a un ejercicio (DJ-8, como un preset de BE): las series pasan a ser las de la
 * habitual, con sus objetivos por serie; cada serie que queda conserva su carga y su nota, y la carga general se
 * conserva y queda para revisar si cambian las repeticiones. El criterio, el descanso y las bases pasan a ser los de la
 * habitual; lo que se pierde se nombra antes.
 */
export function aplicarPrescripcionHabitual(p: PrescripcionEntrada, h: ContenidoDePrescripcionHabitual): { readonly prescripcion: PrescripcionEntrada; readonly cambio: CambioDelEjercicio } {
  const sePierde: string[] = [...loQueSePierdeAlQuitarSeries(p.sets, h.sets.length)];
  if (p.intensity?.criterion === 'PERCENT_RM' && h.intensity?.criterion !== 'PERCENT_RM') {
    const ref = p.intensity.target.reference?.description;
    sePierde.unshift(`Su criterio % RM (${numero(p.intensity.target.value)} %${ref ? `, referencia «${ref}»` : ''}) pasa a ser ${intensidadDe(h.intensity) ?? 'sin criterio'}`);
  }
  const sets: SerieEntrada[] = h.sets.map((s, n) => {
    const antes = p.sets[n];
    const nueva: SerieEntrada = structuredClone(s) as SerieEntrada;
    // Los objetivos propios de la serie pasan a ser los de la habitual: si cambian, se nombran antes.
    if (antes?.rir !== undefined && antes.rir !== null && antes.rir !== nueva.rir) sePierde.push(`Serie ${n + 1}: su RIR propio (${numero(antes.rir)}) pasa a ser el de la prescripción habitual`);
    if (antes?.restSeconds !== undefined && antes.restSeconds !== null && antes.restSeconds !== nueva.restSeconds) sePierde.push(`Serie ${n + 1}: su descanso propio (${textoDelDescanso(antes.restSeconds)}) pasa a ser el de la prescripción habitual`);
    if (antes?.note && !nueva.note) nueva.note = antes.note;
    if (antes?.suggestedLoad !== undefined) nueva.suggestedLoad = antes.suggestedLoad;
    return nueva;
  });
  const prescripcion: PrescripcionEntrada = {
    ...p,
    sets,
    intensity: h.intensity ? structuredClone(h.intensity) : null,
    ...(h.restSeconds !== undefined ? { restSeconds: h.restSeconds } : {}),
    ...(h.loadBasis !== undefined ? { loadBasis: h.loadBasis } : {}),
    ...(h.repetitionBasis !== undefined ? { repetitionBasis: h.repetitionBasis } : {}),
    ...(h.professionalParameters !== undefined ? { professionalParameters: structuredClone(h.professionalParameters) } : {}),
  };
  const repsAntes = repsDelEjercicio(p);
  const repsDespues = repsDelEjercicio(prescripcion) ?? 'Sin dato';
  const conCargas = !!p.suggestedLoad || p.sets.some((s) => !!s.suggestedLoad);
  const revisar = conCargas && repsAntes !== null && repsAntes !== repsDespues ? COPY_PRESCRIPCION_RAPIDA.escritaPara(repsAntes) : null;
  return {
    prescripcion,
    cambio: {
      series: { antes: p.sets.length, despues: sets.length },
      repeticiones: { antes: repsAntes, despues: repsDespues },
      intensidad: { antes: intensidadDe(p.intensity), despues: intensidadDe(prescripcion.intensity) },
      descanso: { antes: p.restSeconds ?? null, despues: prescripcion.restSeconds ?? null },
      carga: { texto: p.suggestedLoad ? `${numero(p.suggestedLoad.value)} ${p.suggestedLoad.unit}` : null, revisar },
      sePierde,
    },
  };
}
