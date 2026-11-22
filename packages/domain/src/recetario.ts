/**
 * El Recetario de BE (DL-191), lo que se puede probar sin pantalla: las recetas parecidas que ve Administración al revisar
 * una propuesta, qué hace falta para proponer una receta y el copy de las pantallas.
 * Sigue el criterio de `copy-recetas.ts`: describir, no calificar; nunca «cumplimiento», «adherencia», «racha», «puntaje»,
 * «asesorado» ni «estación»; lo que no se cargó, «Sin indicar».
 */
import { claveDeNombreParecido } from './alimentos-del-catalogo';
import type { EstadoDePropuesta } from './contratos-recetas';

/** Las palabras que no dicen de qué es una receta: no cuentan para el parecido. */
const PALABRAS_VACIAS = new Set(['de', 'del', 'con', 'y', 'e', 'a', 'al', 'la', 'el', 'lo', 'los', 'las', 'en', 'sin', 'para', 'o', 'u', 'un', 'una', 'por']);

/** Las palabras que cuentan de un nombre, sin tildes, sin mayúsculas y sin plurales simples (`claveDeNombreParecido`). */
export function palabrasDeLaReceta(nombre: string): readonly string[] {
  return [...new Set(claveDeNombreParecido(nombre).split(' ').filter((p) => p && !PALABRAS_VACIAS.has(p)))];
}

/**
 * Cuánto se parecen dos nombres, de 0 a 1: las palabras en común sobre las del nombre más corto. «Tarta de pollo» y
 * «Tarta de pollo y puerro» dan 1; «Milanesa de pollo» y «Tarta de pollo», 0,5.
 */
export function parecidoDeNombres(a: string, b: string): number {
  const pa = palabrasDeLaReceta(a);
  const pb = new Set(palabrasDeLaReceta(b));
  if (pa.length === 0 || pb.size === 0) return 0;
  const comunes = pa.filter((p) => pb.has(p)).length;
  return comunes / Math.min(pa.length, pb.size);
}

/** Desde cuánto dos nombres son «parecidos» para Administración. */
export const UMBRAL_DE_PARECIDO = 0.6;

/** Las candidatas con un nombre parecido a `nombre`, de la más parecida a la menos, hasta `maximo`. */
export function recetasParecidas<C extends { readonly name: string }>(nombre: string, candidatas: readonly C[], maximo = 5): C[] {
  return candidatas
    .map((c) => ({ c, puntos: parecidoDeNombres(nombre, c.name) }))
    .filter((x) => x.puntos >= UMBRAL_DE_PARECIDO)
    .sort((x, y) => y.puntos - x.puntos || x.c.name.localeCompare(y.c.name, 'es'))
    .slice(0, maximo)
    .map((x) => x.c);
}

/**
 * Por qué una receta propia no se puede proponer todavía, o `null` si se puede: ya hay una propuesta esperando, o la
 * versión vigente ya se sumó. Una rechazada se puede volver a proponer.
 */
export function motivoParaNoProponer(receta: { readonly versionNumber: number; readonly origin: 'OWN' | 'BE_RECIPE_BOOK'; readonly proposal: { readonly status: EstadoDePropuesta; readonly versionNumber: number } | null }): 'DEL_RECETARIO' | 'ESPERANDO' | 'YA_SUMADA' | null {
  if (receta.origin === 'BE_RECIPE_BOOK') return 'DEL_RECETARIO';
  if (receta.proposal?.status === 'PENDING') return 'ESPERANDO';
  if (receta.proposal?.status === 'ADDED' && receta.proposal.versionNumber === receta.versionNumber) return 'YA_SUMADA';
  return null;
}

export const COPY_RECETARIO = {
  recetarioDeBe: 'Recetario de BE',
  misRecetas: 'Mis recetas',
  queEs: 'Recetas de cocina familiar que curó BE. Las ven todos los profesionales de Nutrición y no se editan: usalas tal cual como opción del plan, o copialas a Mis recetas para adaptarlas.',
  deBe: 'Del Recetario de BE',
  soloLectura: 'Es una receta del Recetario de BE: no se edita. Para adaptarla, copiala a Mis recetas.',
  copiar: 'Copiar a Mis recetas',
  copiando: 'Copiando…',
  copiada: (nombre: string) => `«${nombre}» ya está en Mis recetas. La copia es tuya: cambiala como quieras; la del recetario no cambia.`,
  copiaDe: (nombre: string) => `Copia de «${nombre}», del Recetario de BE`,
  sinRecetas: 'El Recetario de BE todavía no tiene recetas.',
  buscar: 'Buscar en el Recetario de BE',
  ninguna: (texto: string) => `Ninguna receta del Recetario de BE tiene «${texto.trim()}» en el nombre.`,
  sinFoto: 'Sin foto',
  // Proponer
  proponer: 'Proponer al Recetario de BE',
  proponerQueEs: 'Ofrecé esta receta para que la vean todos los profesionales de Nutrición. Administración la revisa y la suma o no. La tuya sigue igual en Mis recetas.',
  proponerConFoto: 'La receta tiene una foto: para proponerla, leé y aceptá la cesión de la foto.',
  aceptoLaCesion: 'Leí y acepto la cesión de la foto',
  faltaAceptar: 'Para proponer una receta con foto, aceptá la cesión de la foto.',
  enviarPropuesta: 'Proponer',
  enviandoPropuesta: 'Proponiendo…',
  propuesta: (nombre: string) => `Propusiste «${nombre}» al Recetario de BE. Administración la va a revisar.`,
  sinPropuesta: 'Todavía no la propusiste al Recetario de BE.',
  estadoDeLaPropuesta: {
    PENDING: (version: number) => `Propuesta al Recetario de BE (versión ${version}): espera la revisión de Administración.`,
    ADDED: (version: number) => `La versión ${version} está en el Recetario de BE.`,
    REJECTED: (version: number) => `Administración no sumó la versión ${version} al Recetario de BE.`,
  } as Readonly<Record<EstadoDePropuesta, (version: number) => string>>,
  motivo: (motivo: string | null) => `Motivo: ${motivo ?? 'Sin indicar'}`,
  noSePuedeProponer: {
    DEL_RECETARIO: 'Es del Recetario de BE.',
    ESPERANDO: 'Ya está propuesta: espera la revisión de Administración.',
    YA_SUMADA: 'Esta versión ya está en el Recetario de BE. Si la cambiás, podés proponer la versión nueva.',
  } as const,
  conAlimentoPropio: 'Tiene un alimento que cargaste a mano: para proponerla, cambialo por uno del catálogo verificado. Lo propio es tuyo y los demás no lo ven.',
  // Imagen
  cargarImagenDeLaReceta: 'Cargar la imagen',
  cambiarImagenDeLaReceta: 'Cambiar la imagen',
  laImagenEsDeLaReceta: 'La imagen es de la receta: si la cambiás acá, cambia en Mis recetas y en los planes que la ofrecen.',
  // Administración
  propuestas: 'Propuestas al Recetario de BE',
  propuestasQueVe: 'Las recetas que los profesionales ofrecieron al Recetario de BE, con quién la propuso (su nombre de profesional) y las recetas parecidas que ya hay. Nunca a quién se la indicó.',
  propuestaPor: (nombre: string) => `Propuesta por ${nombre}`,
  sinPropuestas: 'No hay propuestas para revisar.',
  parecidas: 'Parecidas',
  sinParecidas: 'No hay recetas con un nombre parecido.',
  parecidaDelRecetario: 'En el Recetario de BE',
  parecidaPropuesta: 'Otra propuesta',
  sumar: 'Sumar al Recetario de BE',
  rechazar: 'No sumarla',
  motivoDelRechazo: 'Motivo (opcional, lo ve quien la propuso)',
  sumada: (nombre: string) => `«${nombre}» ya está en el Recetario de BE.`,
  rechazada: (nombre: string) => `«${nombre}» no se sumó. Quien la propuso lo ve en Mis recetas.`,
  conCesion: (version: string, fecha: string) => `Con la cesión de la foto aceptada (${version}, ${fecha}).`,
  sinFotoEnLaPropuesta: 'Sin foto: no hay cesión.',
  filtro: { PENDING: 'Esperan revisión', ADDED: 'Sumadas', REJECTED: 'No sumadas' } as Readonly<Record<EstadoDePropuesta, string>>,
} as const;
