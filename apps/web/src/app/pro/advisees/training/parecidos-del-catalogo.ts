/**
 * ED-21 (WP-EDITORES-PROFESIONAL) · «Crear un ejercicio propio», con los parecidos del catálogo antes de crear, sin
 * React. Es lo que hacen los buenos gestores de catálogos (o de incidencias) antes de dar de alta algo: mostrar lo que
 * ya existe y se le parece, para no duplicar.
 *
 * - **Mientras se escribe el nombre** (desde tres letras, con una pausa), se busca en el catálogo por el nombre entero y,
 *   si trae pocos, también por su palabra más larga: «sentadilla búlgara con mancuernas» encuentra «Sentadilla búlgara».
 * - **Se ordenan por cuánto del nombre comparten** (palabras sin tildes ni mayúsculas, sin las cortas como «con» o «de»),
 *   y se muestran hasta cinco. Uno que se llama igual se dice aparte: crear otro igual pide decirlo («Crear igual»).
 * - **Nada se crea solo:** elegir un parecido lo marca, como en la búsqueda, y crear sigue siendo un botón.
 */

export const LETRAS_PARA_SUGERIR = 3;
export const PAUSA_DE_LAS_SUGERENCIAS = 300;
export const CUANTOS_PARECIDOS = 5;
/** Con menos resultados que estos por el nombre entero, se busca también por su palabra más larga. */
export const POCOS_RESULTADOS = 3;

/** Sin tildes, en minúsculas y con un espacio entre palabras. */
export const normalizado = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();

/** Las palabras que no dicen nada del ejercicio. */
const QUE_NO_CUENTAN = new Set(['con', 'del', 'las', 'los', 'para', 'por', 'sin', 'una', 'uno', 'unos', 'unas']);

/** Las palabras que cuentan: las de tres letras o más, sin «con», «para» ni las que no dicen nada del ejercicio. */
export const palabrasQueCuentan = (s: string): string[] => normalizado(s).split(' ').filter((p) => p.length >= 3 && !QUE_NO_CUENTAN.has(p));

export const haySugerencias = (nombre: string): boolean => normalizado(nombre).replace(/ /g, '').length >= LETRAS_PARA_SUGERIR;

/** Qué buscar en el catálogo: el nombre entero y, si hace falta, su palabra más larga (si es otra cosa). */
export function busquedasDeParecidos(nombre: string): { readonly principal: string; readonly otra: string | null } {
  const principal = nombre.trim().replace(/\s+/g, ' ');
  const palabras = palabrasQueCuentan(principal);
  const larga = palabras.reduce<string | null>((a, p) => (a === null || p.length > a.length ? p : a), null);
  return { principal, otra: larga && larga !== normalizado(principal) ? larga : null };
}

/** Cuánto del nombre escrito comparte un candidato: la parte de sus palabras que están en el candidato. */
export function parecido(nombre: string, candidato: string): number {
  const deEl = palabrasQueCuentan(nombre);
  if (deEl.length === 0) return 0;
  const delCandidato = palabrasQueCuentan(candidato);
  const comparte = deEl.filter((p) => delCandidato.some((c) => c === p || c.startsWith(p) || p.startsWith(c))).length;
  return comparte / Math.max(deEl.length, delCandidato.length);
}

/** Los parecidos, sin repetir (por su versión), del más al menos parecido, hasta cinco. Los que no comparten nada, no. */
export function parecidos<E extends { readonly versionId: string; readonly name: string }>(nombre: string, candidatos: readonly E[]): E[] {
  const vistos = new Set<string>();
  return candidatos
    .filter((c) => (vistos.has(c.versionId) ? false : (vistos.add(c.versionId), true)))
    .map((c, n) => ({ c, n, p: parecido(nombre, c.name) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.n - b.n)
    .slice(0, CUANTOS_PARECIDOS)
    .map((x) => x.c);
}

/** El que se llama igual (sin tildes ni mayúsculas), si está. */
export const elQueSeLlamaIgual = <E extends { readonly name: string }>(nombre: string, candidatos: readonly E[]): E | null => candidatos.find((c) => normalizado(c.name) === normalizado(nombre) && normalizado(nombre) !== '') ?? null;

export const COPY_EJERCICIO_PROPIO = {
  crear: 'Crear un ejercicio propio',
  queEs: 'Un ejercicio tuyo. Queda en el catálogo para volver a usarlo.',
  antesDeCrear: 'Antes de crear, ¿es alguno de estos?',
  buscandoParecidos: 'Buscando parecidos en el catálogo…',
  sinParecidos: (nombre: string) => `No hay ninguno parecido a «${nombre.trim()}» en el catálogo.`,
  noSePudieronBuscar: 'No pudimos buscar parecidos. Podés crearlo igual.',
  yaExiste: (nombre: string) => `Ya hay uno que se llama «${nombre}».`,
  usarEste: 'Usar este',
  crearYMarcar: 'Crear y marcarlo',
  crearIgual: 'Crear igual',
} as const;
