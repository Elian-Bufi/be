/**
 * ED-23 (WP-EDITORES-PROFESIONAL) · La planilla de series, sin React: escribir un valor en varias series a la vez,
 * «Volver a lo general», copiar hacia abajo (Ctrl+D) y lo que se pierde al quitar una serie.
 *
 * Los tres estados de cada objetivo de una serie son los de DL-122 y no cambian: la clave ausente toma de lo general,
 * `null` es «Sin indicar en esta serie» y un número es el propio. Escribir en varias deja el valor propio en cada una;
 * «Volver a lo general» quita la clave (TEST-EDP-024: lo que se ve como heredado es lo que la API guarda como heredado).
 */
import { valoresPropiosDeLaSerie, type EstructuraDePlanDeEntrenamientoEntrada } from '@be/domain';

type Serie = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number]['prescriptions'][number]['sets'][number];

/** Lo que tiene un valor general del que tomar: el descanso, la carga sugerida y el RIR. */
export type ObjetivoDeLaSerie = 'restSeconds' | 'suggestedLoad' | 'rir';
/** Lo que copia Ctrl+D: además, las repeticiones y la nota. */
export type CampoDeLaSerie = ObjetivoDeLaSerie | 'repetitions' | 'note';

const OBJETIVOS: readonly ObjetivoDeLaSerie[] = ['restSeconds', 'suggestedLoad', 'rir'];

/** El tope de las repeticiones de una serie: el del contrato (`RepeticionesPrescriptasSchema`). */
const TOPE_DE_REPETICIONES = 1000;

/**
 * Lo escrito en las repeticiones de una serie, en la celda y en la edición conjunta (ENP-D16): vacío es «sin repeticiones
 * fijadas»; un entero de 1 a 1000, o un rango «8-12» que empieza en 1 o más y no termina antes de empezar. Lo demás
 * —«12-8», «0-10», «abc»— queda como «no se entiende» (NaN), que no deja guardar y dice dónde. Antes, un rango al revés
 * pasaba como bueno, la edición conjunta lo escribía en todas las elegidas y el guardado automático lo rechazaba en el
 * servidor sin nombrar el lugar.
 */
export function leerRepeticiones(s: string): Serie['repetitions'] {
  if (s.trim() === '') return null;
  const valido = (n: number) => Number.isInteger(n) && n >= 1 && n <= TOPE_DE_REPETICIONES;
  const rango = s.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  if (rango) {
    const [min, max] = [Number(rango[1]), Number(rango[2])];
    return valido(min) && valido(max) && max >= min ? { min, max } : { min: Number.NaN, max: Number.NaN };
  }
  const n = Number(s.trim());
  return { value: valido(n) ? n : Number.NaN };
}

/** Escribe el mismo valor propio en las series elegidas; las demás no cambian. */
export function escribirEnLasSeries<S extends Serie>(sets: readonly S[], elegidas: ReadonlySet<number>, campo: ObjetivoDeLaSerie, valor: S[ObjetivoDeLaSerie]): S[] {
  return sets.map((s, n) => (elegidas.has(n) ? { ...s, [campo]: valor } : s));
}

/** «Volver a lo general»: las elegidas dejan sus objetivos propios (y «Sin indicar») y toman de lo general. */
export function volverALoGeneral<S extends Serie>(sets: readonly S[], elegidas: ReadonlySet<number>): S[] {
  return sets.map((s, n) => {
    if (!elegidas.has(n)) return s;
    const copia: Record<string, unknown> = { ...s };
    for (const c of OBJETIVOS) delete copia[c];
    return copia as S;
  });
}

/** Ctrl+D: la serie `n` toma el valor de la de arriba en ese campo (si la de arriba toma de lo general, esta también). */
export function copiarHaciaAbajo<S extends Serie>(sets: readonly S[], n: number, campo: CampoDeLaSerie): S[] {
  if (n <= 0 || n >= sets.length) return [...sets];
  const arriba = sets[n - 1]!;
  return sets.map((s, m) => {
    if (m !== n) return s;
    const copia: Record<string, unknown> = { ...s };
    if (campo in arriba) copia[campo] = structuredClone((arriba as Record<string, unknown>)[campo]);
    else delete copia[campo];
    return copia as S;
  });
}

/** El campo de una celda por su identificador (`…-serie-2-carga`): la serie y qué copia Ctrl+D. */
export function celdaDeLaPlanilla(id: string, prefijo: string): { readonly serie: number; readonly campo: CampoDeLaSerie } | null {
  const m = new RegExp(`^${prefijo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-serie-(\\d+)(?:-(carga|rir|descanso|nota))?$`).exec(id);
  if (!m) return null;
  const campo: CampoDeLaSerie = m[2] === 'carga' ? 'suggestedLoad' : m[2] === 'rir' ? 'rir' : m[2] === 'descanso' ? 'restSeconds' : m[2] === 'nota' ? 'note' : 'repetitions';
  return { serie: Number(m[1]), campo };
}

/** TEST-EDP-056: lo que se pierde al quitar la serie `n`, dicho antes; `null` si no tenía valores propios. */
export function loQueSePierdeAlQuitarLaSerie(sets: readonly Serie[], n: number): string | null {
  const s = sets[n];
  const propios = s ? valoresPropiosDeLaSerie(s) : null;
  return propios ? `Quitar la serie ${n + 1}: se pierde ${propios}.` : null;
}

export const COPY_PLANILLA = {
  elegir: (n: number) => `Elegir la serie ${n}`,
  elegidas: (n: number) => (n === 1 ? '1 serie elegida' : `${n} series elegidas`),
  campo: 'Qué escribir',
  valor: 'Valor',
  escribir: 'Escribir en las elegidas',
  // C8: «común» en lugar de «general»: lo que toman las series que no tienen uno propio.
  volverALoGeneral: 'Usar el valor común',
  soltar: 'Soltar la selección',
  noSeEntiende: 'No se entiende el valor: no se escribió nada.',
  atajo: 'Ctrl+D copia en la celda el valor de la serie de arriba.',
  quitarTitulo: (n: number) => `¿Quitar la serie ${n}?`,
  quitar: (n: number) => `Quitar la serie ${n}`,
  // ED-23 y C8: la fila de los valores comunes dentro de la tabla.
  general: 'Común',
  generalDetalle: 'a todas las series',
  repeticionesPorSerie: 'en cada serie',
  // El RIR común es el objetivo del criterio, que desde ENP-D14 va arriba de la tabla (decía «abajo»).
  rirDeLaIntensidad: '· el del criterio, arriba',
  notaDeLoGeneral: 'Las notas, abajo',
  unidadDeLaCarga: 'Unidad de la carga',
  // C8: de dónde sale cada valor, en la celda.
  comun: 'común',
  propio: 'propio',
  sinIndicar: 'Sin indicar',
  usarElComun: 'Usar el valor común',
  sinIndicarEnEstaSerie: 'Sin indicar en esta serie',
  comoSeLee: 'Cada valor dice de dónde sale: «común», el de la fila Común (cambia si cambia el común); «propio», el de esa serie; «Sin indicar», ninguno en esa serie, aunque haya uno común. Es lo que recibe la persona.',
} as const;

/** C8: de dónde sale el valor de una celda de objetivo, dicho en la celda y para el lector. */
export interface OrigenDeLaCelda {
  /** Lo que se ve con la celda vacía: el valor común, o «Sin indicar». */
  readonly placeholder: string;
  /** La marca a la vista: «común» o «propio»; `null` sin indicar (lo dice el texto) o con algo que no se entiende. */
  readonly marca: 'común' | 'propio' | null;
  readonly descripcion: string;
}

/**
 * C8 (WP-ENTRENAMIENTO-PLANIFICACION, tramo 2) · cada valor de una serie dice si es común a todas las series, propio de
 * esa serie o sin indicar, sin recargar la tabla: una marca corta dentro de la celda («común», «propio») o el texto «Sin
 * indicar». Los tres estados son los de DL-122 (`celdaDeObjetivoDelEditor`, del dominio, que no cambia); esto solo los
 * dice. `comun` es el valor de la fila Común, ya escrito («62,5», «02:30»), o `null` si no hay.
 */
export function origenDeLaCelda(estado: 'de-lo-general' | 'propio' | 'sin-objetivo' | 'no-se-entiende', comun: string | null): OrigenDeLaCelda {
  const P = COPY_PLANILLA;
  switch (estado) {
    case 'de-lo-general':
      return comun ? { placeholder: comun, marca: 'común', descripcion: `Común a todas las series: ${comun}.` } : { placeholder: '', marca: null, descripcion: 'Sin indicar: no hay un valor común.' };
    case 'sin-objetivo':
      return { placeholder: P.sinIndicar, marca: null, descripcion: comun ? `Sin indicar en esta serie; el valor común es ${comun}.` : 'Sin indicar en esta serie.' };
    case 'propio':
      return { placeholder: comun ?? P.sinIndicar, marca: 'propio', descripcion: comun ? `Propio de esta serie; el valor común es ${comun}.` : 'Propio de esta serie.' };
    default:
      return { placeholder: comun ?? P.sinIndicar, marca: null, descripcion: 'No se entiende lo escrito.' };
  }
}

// ─── RP-22 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · los números de la planilla, con su mínimo, su máximo y su paso ─────────

/**
 * Los límites de lo que se escribe en las series, los del contrato: las repeticiones, de 1 a 1000 (`RepeticionesPrescriptasSchema`);
 * el descanso, de 0 a una hora (`DescansoRecomendadoSchema`); la carga, desde 0 (`CargaSchema`). El paso es el de las
 * flechas del teclado (↑ y ↓; con Mayúsculas, cuatro pasos): 1 repetición, 15 segundos y 2,5 kg (o 5 lb), lo que cambia
 * de una serie a otra en una sala. El RIR y el % RM son del criterio de intensidad: no están acá.
 */
export const LIMITES_DE_LA_PLANILLA = {
  repeticiones: { minimo: 1, maximo: TOPE_DE_REPETICIONES, paso: 1 },
  descanso: { minimo: 0, maximo: 3600, paso: 15 },
  carga: { minimo: 0, paso: { kg: 2.5, lb: 5 } },
} as const;

/** Con Mayúsculas, la flecha da cuatro pasos (10 kg, un minuto, 4 repeticiones). */
const PASOS_CON_MAYUSCULAS = 4;

/** La carga escrita: un número desde 0, con coma o con punto. Lo negativo o lo que no es un número, `null` (no se entiende). */
export function leerCargaDeLaPlanilla(t: string, leer: (s: string) => number | null): number | null {
  const n = leer(t);
  return n === null || n < LIMITES_DE_LA_PLANILLA.carga.minimo ? null : n;
}

/** El descanso escrito: «02:30» o los segundos, hasta una hora. Más de una hora, `null` (no se entiende). */
export function leerDescansoDeLaPlanilla(t: string, leer: (s: string) => number | null): number | null {
  const n = leer(t);
  return n === null || n > LIMITES_DE_LA_PLANILLA.descanso.maximo ? null : n;
}

const redondear = (n: number): number => Math.round(n * 1000) / 1000;
const entre = (n: number, minimo: number, maximo: number): number => Math.min(maximo, Math.max(minimo, n));

/**
 * Un paso en la grilla: desde un valor de la grilla, uno más o uno menos; desde uno de afuera (62 con paso 2,5), el de la
 * grilla más cercano en esa dirección (62,5 con ↑, 60 con ↓). Con varios pasos, los que faltan después.
 */
function pasoEnLaGrilla(actual: number, paso: number, veces: number): number {
  const abajo = redondear(Math.floor(redondear(actual / paso)) * paso);
  const enLaGrilla = abajo === redondear(actual);
  if (enLaGrilla) return redondear(actual + veces * paso);
  const primero = veces > 0 ? redondear(abajo + paso) : abajo;
  return redondear(primero + (veces - Math.sign(veces)) * paso);
}

/**
 * Un paso con las flechas en una celda de la planilla. Parte de lo escrito o, si la celda está vacía, del valor común que
 * toma (`desde`); sin ninguno, de un valor con sentido (8 repeticiones, 01:00, 20 kg) con la primera flecha. Queda
 * dentro de los límites. Lo que no se entiende, un rango o un valor ya en el borde no cambian (`null`).
 */
export function conUnPaso(
  campo: 'repetitions' | 'restSeconds' | 'suggestedLoad',
  escrito: string,
  desde: number | null,
  sube: boolean,
  o: { readonly unidad?: 'kg' | 'lb'; readonly grande?: boolean; readonly leerNumero: (s: string) => number | null; readonly leerDescanso: (s: string) => number | null },
): number | null {
  const veces = (o.grande ? PASOS_CON_MAYUSCULAS : 1) * (sube ? 1 : -1);
  const vacio = escrito.trim() === '';
  const L = LIMITES_DE_LA_PLANILLA;
  // Vacía y sin un valor común, la primera flecha escribe el valor de partida, sin sumarle nada.
  const partida = { repetitions: 8, restSeconds: 60, suggestedLoad: 20 }[campo];
  if (vacio && desde === null) return partida;
  const actual = vacio ? desde : campo === 'repetitions' ? (/^\s*\d+\s*$/.test(escrito) ? Number(escrito.trim()) : null) : campo === 'restSeconds' ? o.leerDescanso(escrito) : o.leerNumero(escrito);
  if (actual === null || actual < 0) return null;
  const nuevo =
    campo === 'repetitions'
      ? entre(actual + veces, L.repeticiones.minimo, L.repeticiones.maximo)
      : campo === 'restSeconds'
        ? entre(pasoEnLaGrilla(actual, L.descanso.paso, veces), L.descanso.minimo, L.descanso.maximo)
        : Math.max(L.carga.minimo, pasoEnLaGrilla(actual, L.carga.paso[o.unidad ?? 'kg'], veces));
  return nuevo === actual ? null : nuevo;
}

/** Lo que hay que corregir en las series de un ejercicio, para decirlo en un renglón propio debajo de la tabla. */
export interface CeldaQueNoSeEntiende {
  /** El `id` de la celda (`…-carga`, `…-serie-1-descanso`). */
  readonly id: string;
  /** Qué es, en palabras: «la carga común», «el descanso de la serie 2». */
  readonly que: string;
  /** Cómo se escribe: «va un número desde 0». */
  readonly como: string;
}

const COMO_SE_ESCRIBE = {
  repetitions: 'de 1 a 1000, o un rango como 8-12',
  suggestedLoad: 'un número desde 0',
  rir: 'un número',
  rpe: 'de 6 a 10, de a medio punto, o «6 o menos»',
  restSeconds: 'como 02:30 o en segundos, hasta 60:00',
} as const;

type PrescripcionDeLaPlanilla = {
  readonly suggestedLoad?: { readonly value: number } | null;
  readonly restSeconds?: number | null;
  readonly sets: readonly Serie[];
};

const esNaN = (n: unknown): boolean => typeof n === 'number' && Number.isNaN(n);

/**
 * RP-22 · Las celdas de la planilla de un ejercicio que no se entienden, en el orden de la tabla: la fila Común y
 * después cada serie. `rotulos` dice el nombre de cada serie («la serie 2», «el calentamiento»). Cada celda se marca
 * en su lugar; el texto va a un renglón reservado debajo de la tabla (`textoDeLoQueNoSeEntiende`), para que la fila no
 * crezca mientras se escribe.
 */
/** `esfuerzo`: cómo se nombra el RIR en la notación del plan («RPE» en un plan en RPE: nada de RIR a la vista). */
export function loQueNoSeEntiendeEnLasSeries(prefijo: string, p: PrescripcionDeLaPlanilla, rotulos: readonly string[], esfuerzo = 'RIR'): readonly CeldaQueNoSeEntiende[] {
  const celdas: CeldaQueNoSeEntiende[] = [];
  if (esNaN(p.suggestedLoad?.value)) celdas.push({ id: `${prefijo}-carga`, que: 'la carga común', como: COMO_SE_ESCRIBE.suggestedLoad });
  if (esNaN(p.restSeconds)) celdas.push({ id: `${prefijo}-descanso`, que: 'el descanso común', como: COMO_SE_ESCRIBE.restSeconds });
  p.sets.forEach((s, n) => {
    const de = rotulos[n] ?? `la serie ${n + 1}`;
    const r = s.repetitions;
    if (r && ('value' in r ? esNaN(r.value) : esNaN(r.min) || esNaN(r.max))) celdas.push({ id: `${prefijo}-serie-${n}`, que: `las repeticiones de ${de}`, como: COMO_SE_ESCRIBE.repetitions });
    if (esNaN(s.suggestedLoad?.value)) celdas.push({ id: `${prefijo}-serie-${n}-carga`, que: `la carga de ${de}`, como: COMO_SE_ESCRIBE.suggestedLoad });
    if (esNaN(s.rir)) celdas.push({ id: `${prefijo}-serie-${n}-rir`, que: `el ${esfuerzo} de ${de}`, como: esfuerzo === 'RPE' ? COMO_SE_ESCRIBE.rpe : COMO_SE_ESCRIBE.rir });
    if (esNaN(s.restSeconds)) celdas.push({ id: `${prefijo}-serie-${n}-descanso`, que: `el descanso de ${de}`, como: COMO_SE_ESCRIBE.restSeconds });
  });
  return celdas;
}

/**
 * El renglón: la primera celda con cómo se escribe y, si hay más, cuántas («Y 1 más, marcada.»). Vacío (`null`) si todo
 * se entiende. RP-22 (revisión): corto, para que entre en un renglón también a 1440 con el panel abierto. Con dos avisos
 * («También el descanso común.» y «No se guarda hasta corregirlo.») pasaba a dos renglones y bajaba «Agregar serie» 20 px
 * (la CI). Que no se guarda ya lo dicen la barra («Pendiente de guardar: falta completar algo») y «Antes de activar».
 */
export function textoDeLoQueNoSeEntiende(celdas: readonly CeldaQueNoSeEntiende[]): string | null {
  const [primera, ...resto] = celdas;
  if (!primera) return null;
  const mas = resto.length === 0 ? '' : resto.length === 1 ? ' Y 1 más, marcada.' : ` Y ${resto.length} más, marcadas.`;
  const verbo = /^las /.test(primera.que) ? 'No se entienden' : 'No se entiende';
  return `${verbo} ${primera.que}: va ${primera.como}.${mas}`;
}
