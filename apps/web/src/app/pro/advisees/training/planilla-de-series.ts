/**
 * ED-23 (WP-EDITORES-PROFESIONAL) · La planilla de series, sin React: escribir un valor en varias series a la vez,
 * «Volver a lo general», copiar hacia abajo (Ctrl+D) y lo que se pierde al quitar una serie.
 *
 * Los tres estados de cada objetivo de una serie son los de DL-122 y no cambian: la clave ausente toma de lo general,
 * `null` es «Sin objetivo en esta serie» y un número es el propio. Escribir en varias deja el valor propio en cada una;
 * «Volver a lo general» quita la clave (TEST-EDP-024: lo que se ve como heredado es lo que la API guarda como heredado).
 */
import { valoresPropiosDeLaSerie, type EstructuraDePlanDeEntrenamientoEntrada } from '@be/domain';

type Serie = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number]['prescriptions'][number]['sets'][number];

/** Lo que tiene un valor general del que tomar: el descanso, la carga sugerida y el RIR. */
export type ObjetivoDeLaSerie = 'restSeconds' | 'suggestedLoad' | 'rir';
/** Lo que copia Ctrl+D: además, las repeticiones y la nota. */
export type CampoDeLaSerie = ObjetivoDeLaSerie | 'repetitions' | 'note';

const OBJETIVOS: readonly ObjetivoDeLaSerie[] = ['restSeconds', 'suggestedLoad', 'rir'];

/** Escribe el mismo valor propio en las series elegidas; las demás no cambian. */
export function escribirEnLasSeries<S extends Serie>(sets: readonly S[], elegidas: ReadonlySet<number>, campo: ObjetivoDeLaSerie, valor: S[ObjetivoDeLaSerie]): S[] {
  return sets.map((s, n) => (elegidas.has(n) ? { ...s, [campo]: valor } : s));
}

/** «Volver a lo general»: las elegidas dejan sus objetivos propios (y «Sin objetivo») y toman de lo general. */
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
  volverALoGeneral: 'Volver a lo general',
  soltar: 'Soltar la selección',
  noSeEntiende: 'No se entiende el valor: no se escribió nada.',
  atajo: 'Ctrl+D copia en la celda el valor de la serie de arriba.',
  quitarTitulo: (n: number) => `¿Quitar la serie ${n}?`,
  quitar: (n: number) => `Quitar la serie ${n}`,
} as const;
