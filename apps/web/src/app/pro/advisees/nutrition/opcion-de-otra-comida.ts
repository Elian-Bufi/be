/**
 * ED-33 (WP-EDITORES-PROFESIONAL) · En el «⋯» de la comida, sin React: «Copiar desde otra comida» (una opción de otra
 * comida del plan, de cualquier día tipo) y «Usar una comida habitual» (una comida guardada, como opción).
 *
 * - **La copia es independiente:** sin los identificadores de la opción ni de sus ítems, así el guardado la crea de nuevo
 *   y cambiar una no toca la otra (TEST-EDP-031). Una opción de receta sigue citando la misma versión de la receta.
 * - **El nombre se conserva:** la copia va a otra comida, donde no se confunde con su original (no lleva «(copia)»).
 * - **Una comida habitual entra como opciones de esta comida:** si tiene una sola opción, la opción toma el nombre de la
 *   habitual; si tiene varias, cada una entra con «Habitual · Opción». Nunca se pasa de doce opciones: lo que no entra
 *   se cuenta y se dice.
 * - Ninguna de las dos escribe nada: cambian el borrador, que viaja con el autoguardado.
 */

/** Lo mínimo de una opción que se copia: su nombre, sus ítems y, si es de receta, la versión que cita. */
export interface OpcionParaCopiar {
  readonly optionId?: string | undefined;
  readonly label: string;
  readonly items: readonly { readonly itemId?: string | undefined }[];
  readonly recipeVersionId?: string | undefined;
}

interface Comida<O extends OpcionParaCopiar> {
  readonly mealId?: string | undefined;
  readonly label: string;
  readonly options: readonly O[];
}

interface Dia<O extends OpcionParaCopiar> {
  readonly label: string;
  readonly meals: readonly Comida<O>[];
}

/** Una opción de otra comida que se puede copiar, con dónde está y qué tiene. */
export interface OrigenDeLaCopia {
  /** La clave estable de la elección: `i-j-k`. */
  readonly clave: string;
  readonly i: number;
  readonly j: number;
  readonly k: number;
  /** «Día habitual · Almuerzo». */
  readonly donde: string;
  /** «Arroz con pollo y brócoli». */
  readonly opcion: string;
  /** «4 alimentos», «Receta» o «Sin alimentos». */
  readonly tiene: string;
}

/** El contrato admite hasta doce opciones por comida. */
export const MAXIMO_DE_OPCIONES = 12;

const nombreDelDia = (d: { readonly label: string }, i: number) => d.label.trim() || `Día tipo ${i + 1}`;
const nombreDeComida = (m: { readonly label: string }, j: number) => m.label.trim() || `Comida ${j + 1}`;
const nombreDeOpcion = (o: { readonly label: string }, k: number) => o.label.trim() || `Opción ${k + 1}`;

/** «3 alimentos», «1 alimento», «Receta» o «Sin alimentos». */
export function loQueTiene(o: OpcionParaCopiar): string {
  if (o.recipeVersionId) return 'Receta';
  if (o.items.length === 0) return 'Sin alimentos';
  return o.items.length === 1 ? '1 alimento' : `${o.items.length} alimentos`;
}

/**
 * Las opciones que se pueden copiar a la comida `j` del día tipo `i`: las de todas las demás comidas del plan, en el
 * orden del plan. Las de la misma comida no (para eso está «Duplicar opción»), ni las vacías: copiar nada no ayuda.
 */
export function origenesDeLaCopia<O extends OpcionParaCopiar>(dias: readonly Dia<O>[], i: number, j: number): OrigenDeLaCopia[] {
  const origenes: OrigenDeLaCopia[] = [];
  dias.forEach((d, di) =>
    d.meals.forEach((m, mj) => {
      if (di === i && mj === j) return;
      m.options.forEach((o, ok) => {
        if (!o.recipeVersionId && o.items.length === 0) return;
        origenes.push({ clave: `${di}-${mj}-${ok}`, i: di, j: mj, k: ok, donde: `${nombreDelDia(d, di)} · ${nombreDeComida(m, mj)}`, opcion: nombreDeOpcion(o, ok), tiene: loQueTiene(o) });
      });
    }),
  );
  return origenes;
}

/** Una opción sin sus identificadores ni los de sus ítems, con su nombre. */
export function opcionSinIdentificadores<O extends OpcionParaCopiar>(o: O, nombre: string = o.label): O {
  const { optionId: _opcion, ...resto } = structuredClone(o) as O & { optionId?: string };
  return { ...resto, label: nombre, items: resto.items.map(({ itemId: _item, ...it }) => it) } as unknown as O;
}

/** La copia de una opción de otra comida, lista para sumarse: independiente y con su nombre. */
export const copiaDesdeOtraComida = <O extends OpcionParaCopiar>(o: O, k: number): O => opcionSinIdentificadores(o, nombreDeOpcion(o, k));

/**
 * Las opciones que suma una comida habitual, sin pasar de doce: `libres` es cuántas le entran a la comida. Con una sola
 * opción, toma el nombre de la habitual; con varias, «Habitual · Opción». Las que no entran, contadas.
 */
export function opcionesDeLaHabitual<O extends OpcionParaCopiar>(habitual: { readonly name: string; readonly structure: { readonly options: readonly O[] } }, libres: number): { readonly opciones: O[]; readonly quedanAfuera: number } {
  const todas = habitual.structure.options;
  const nombre = habitual.name.trim() || 'Comida habitual';
  const opciones = todas.slice(0, Math.max(0, libres)).map((o, k) => opcionSinIdentificadores(o, (todas.length === 1 ? nombre : `${nombre} · ${nombreDeOpcion(o, k)}`).slice(0, 120)));
  return { opciones, quedanAfuera: todas.length - opciones.length };
}

export const COPY_DE_OTRA_COMIDA = {
  copiar: 'Copiar desde otra comida…',
  usarHabitual: 'Usar una comida habitual…',
  tituloCopiar: (comida: string) => `Copiar una opción a ${comida}`,
  tituloHabitual: (comida: string) => `Usar una comida habitual en ${comida}`,
  sinOtras: 'No hay otra comida con opciones para copiar.',
  tope: (n: number) => `Esta comida ya tiene ${n} opciones, el máximo.`,
  principalCopiar: (comida: string, n: number) => `Copiar a ${comida} como opción ${n}`,
  principalHabitual: (comida: string) => `Usarla en ${comida}`,
  elegiUna: 'Elegí una opción para copiar.',
  elegiUnaHabitual: 'Elegí una comida habitual.',
  queHace: 'Se copia con sus alimentos, cantidades, estados y notas. La copia es independiente: cambiar una no toca la otra.',
  queHaceHabitual: 'Cada opción de la comida habitual entra como una opción más de esta comida, con sus alimentos.',
  copiada: (opcion: string, comida: string) => `«${opcion}» se copió a ${comida}.`,
  usada: (habitual: string, comida: string, n: number) => (n === 1 ? `«${habitual}» entró como una opción de ${comida}.` : `«${habitual}» entró como ${n} opciones de ${comida}.`),
  quedanAfuera: (n: number) => (n === 1 ? 'Una opción de la habitual no entró: la comida llegó a doce.' : `${n} opciones de la habitual no entraron: la comida llegó a doce.`),
} as const;
