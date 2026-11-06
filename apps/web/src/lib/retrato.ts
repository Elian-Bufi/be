/**
 * El rostro de cada persona en el tablero (WP-TABLERO-ALTA-GAMA TB-05; DL-163 D-2): un monograma de un solo tono neutro
 * con las iniciales del nombre visible, donde el profesional ya ve el nombre y con la regla de DL-040. No expone ningún
 * dato nuevo: sale del nombre que ya se ve, con el mismo tono para todos. La foto del profesional llega en la etapa B
 * (TB-23); la de las personas, después del piloto.
 *
 * Hasta TB-20 (la candidata de la APK), estas funciones viven en el website (§8.2 del paquete), con sus pruebas en
 * `apps/web/test/retrato.test.mjs`.
 *
 * - **`inicialesDe`:** la primera letra de la primera palabra y de la última, sin títulos («Lic.», «Prof.»), sin
 *   partículas («de», «del», «van») y sin lo que va entre paréntesis («(sintética)»). Las tildes se conservan («Álvarez»
 *   da «Á»). Una palabra sola da una letra. Lo que no es letra (un emoji, un signo) no cuenta. La referencia neutral
 *   («Asesorado · a9be23») y el nombre de reemplazo de la API («Profesional») no son un nombre: no tienen iniciales, y el
 *   monograma lleva el ícono «persona». Las iniciales nunca se inventan.
 * - **«Ocultar nombres»** (TB-05): cada persona se ve por su referencia neutral. La del asesorado es la de DL-040; la de
 *   un profesional, «Profesional · 1a2b3c», con la misma referencia corta. Con los nombres ocultos tampoco hay iniciales.
 */
import { normalizarTexto, referenciaCorta, referenciaNeutral } from '@be/domain';

/** Lo que el website recibe de cada persona: su identidad y el nombre que este actor puede ver (DL-040). */
export interface Actor {
  readonly identityId: string;
  readonly displayName: string;
  /** Algunas lecturas dicen el papel de quien escribió (la línea de tiempo): `ADVISEE` o `PROFESSIONAL`. */
  readonly role?: string;
}

export type RolDeQuien = 'asesorado' | 'profesional';

/** Títulos y tratamientos que van delante de un nombre: no son una inicial. Se comparan sin tildes, sin punto y en minúscula. */
const TITULOS: ReadonlySet<string> = new Set([
  'lic',
  'lica',
  'licda',
  'licdo',
  'lcda',
  'lcdo',
  'licenciada',
  'licenciado',
  'dr',
  'dra',
  'doctor',
  'doctora',
  'prof',
  'profa',
  'profe',
  'profesor',
  'profesora',
  'mg',
  'mgter',
  'mgtr',
  'mag',
  'magister',
  'esp',
  'ing',
  'arq',
  'nutr',
  'nut',
  'kgo',
  'kga',
  'klgo',
  'klga',
  'psic',
  'tec',
  'sr',
  'sra',
  'srta',
]);

/** Partículas de un apellido o de un nombre compuesto: «María de los Ángeles Pérez» da «MP». */
const PARTICULAS: ReadonlySet<string> = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'da', 'das', 'do', 'dos', 'di', 'du', 'van', 'von', 'der', 'den', 'le', 'lo']);

/** La referencia neutral de DL-040 y el reemplazo que la API usa para un profesional sin nombre: no son un nombre. */
const ES_REFERENCIA = /^(asesorado|profesional)(\s*·\s*[0-9a-z]{6})?$/i;

/** La primera letra de una palabra, en mayúscula y con su tilde. */
const letraDe = (palabra: string): string => (/\p{L}/u.exec(palabra)?.[0] ?? '').toLocaleUpperCase('es');

/** Las palabras de un nombre que pueden dar una inicial: sin paréntesis, sin signos en los bordes y con al menos una letra. */
function palabrasDe(nombre: string): string[] {
  return nombre
    .normalize('NFC')
    .replace(/\([^)]*\)/g, ' ')
    .split(/[\s·,;/|]+/u)
    .map((p) => p.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter((p) => /\p{L}/u.test(p));
}

/**
 * Las iniciales del nombre visible: dos letras («Diego Sosa» → «DS»), una con una sola palabra («Diego» → «D»), o
 * `null` cuando no hay un nombre del que sacarlas (la referencia neutral, un texto sin letras o vacío). Con `null`, el
 * monograma lleva el ícono «persona».
 */
export function inicialesDe(nombre: string | null | undefined): string | null {
  const texto = (nombre ?? '').trim();
  if (!texto || ES_REFERENCIA.test(texto)) return null;
  const propias = palabrasDe(texto).filter((p) => {
    const llana = normalizarTexto(p).replace(/\./g, '');
    return !TITULOS.has(llana) && !PARTICULAS.has(llana);
  });
  const primera = propias[0];
  if (!primera) return null;
  const ultima = propias.length > 1 ? propias[propias.length - 1] : undefined;
  return `${letraDe(primera)}${ultima ? letraDe(ultima) : ''}`;
}

/** Cómo se ve un profesional con los nombres ocultos: «Profesional · 1a2b3c», con la referencia corta de su identidad. */
export const referenciaDeProfesional = (identityId: string): string => `Profesional · ${referenciaCorta(identityId)}`;

/** El papel de quien escribió algo en la ficha de `asesoradoId`: la persona, o uno de sus profesionales. */
export const rolDe = (actor: Actor, asesoradoId: string): RolDeQuien => (actor.role === 'ADVISEE' || actor.identityId === asesoradoId ? 'asesorado' : 'profesional');

/** El nombre que se muestra: el visible o, con los nombres ocultos, la referencia neutral de su papel. */
export function nombreQueSeVe(actor: Actor, ocultos: boolean, rol: RolDeQuien): string {
  if (!ocultos) return actor.displayName;
  return rol === 'asesorado' ? referenciaNeutral(actor.identityId) : referenciaDeProfesional(actor.identityId);
}

/**
 * Un texto que arma la API con nombres adentro (el título de una novedad, «Corregida por …»): con los nombres ocultos,
 * cada nombre conocido pasa a su referencia, el más largo primero. Lo que una persona escribió a mano (el texto de una
 * nota) no se toca: no se puede saber qué es un nombre.
 */
export function textoSinNombres(texto: string, conocidos: readonly { readonly actor: Actor; readonly rol: RolDeQuien }[], ocultos: boolean): string {
  if (!ocultos) return texto;
  const reemplazos = conocidos
    .filter(({ actor }) => actor.displayName.trim().length > 1 && !ES_REFERENCIA.test(actor.displayName.trim()))
    .map(({ actor, rol }) => [actor.displayName, nombreQueSeVe(actor, true, rol)] as const)
    .sort((a, b) => b[0].length - a[0].length);
  return reemplazos.reduce((t, [nombre, referencia]) => t.split(nombre).join(referencia), texto);
}
