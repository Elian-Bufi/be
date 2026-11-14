/**
 * PG-15 (WP-PULIDO-GRANDES; DL-173, PG-D10, aprobada por Dirección el 2026-11-14) · «¿Algo para contarle a tu profe?»: la
 * nota que la persona deja al terminar una sesión. Es lógica pura: la pantalla (`pantallas/nota-para-tu-profe.tsx`) y su
 * prueba (`nota-para-tu-profe.test.ts`, TEST-PG-014) la usan.
 *
 * - **Nunca está en el camino de finalizar** (PG-T63): se escribe en la pantalla de la sesión ya registrada, a la que
 *   lleva «Finalizar» con «Sesión registrada» arriba. Confirmar (API-TRN-18) no cambia: la nota viaja después, aparte
 *   (API-TRN-25). Si falla, la sesión sigue registrada y la nota dice «No se mandó» con «Reintentar».
 * - **Frases a un toque** (PG-T62): se suman al texto, en el orden de la lista y cada una con su punto, antes de lo que la
 *   persona escribe. La API guarda solo el texto: BE no las clasifica ni las cuenta.
 * - **Hasta 280 caracteres** entre las frases y lo escrito. Lo que pasa del tope no se manda, y se dice cuánto sobra.
 * - **Lo enviado se muestra solo con la respuesta del servidor** (B10-01 §36): mientras viaja, «Mandando…».
 * - **No se edita:** una nueva queda debajo, con su hora.
 */
import { MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION, numero, type Resultado } from '@be/domain';

/** Las frases a un toque, en el orden en que se muestran y en que quedan en el texto. */
export const FRASES_PARA_TU_PROFE = ['Algo me molestó', 'Cambié de máquina', 'Tuve poco tiempo'] as const;

export const TEXTOS_DE_LA_NOTA = {
  pregunta: '¿Algo para contarle a tu profe?',
  opcional: 'Opcional. Lo lee tu profesional junto a esta sesión, y no se responde por acá.',
  frases: 'Frases a un toque',
  escribir: 'O contalo con tus palabras',
  mandar: 'Mandar a tu profe',
  mandando: 'Mandando…',
  reintentar: 'Reintentar',
  leContaste: 'Le contaste a tu profe',
  enviada: 'Le mandaste la nota a tu profe.',
  otraMas: 'Contarle algo más',
  noSeMando: 'No se mandó',
  noSeMandoReintentar: 'La sesión ya quedó registrada. Revisá la conexión y probá de nuevo.',
  sinAcceso: 'Tu profesional ya no ve esta sesión: la nota no se puede mandar. La sesión sigue registrada.',
  tope: 'Esta sesión ya tiene todas las notas que admite.',
  noSeEntendio: 'La nota no se pudo mandar así. Revisá el texto.',
  noSePudoLeer: 'No pudimos leer lo que le contaste en esta sesión.',
  quedan: (n: number) => (n < 0 ? `Sobran ${numero(-n, 0)} caracteres.` : n === 1 ? 'Te queda 1 carácter.' : `Te quedan ${numero(n, 0)} caracteres.`),
} as const;

/** El texto de la nota: las frases elegidas, en el orden de la lista y cada una con su punto, y después lo escrito. */
export function textoDeLaNota(frases: readonly string[], escrito: string): string {
  const elegidas = FRASES_PARA_TU_PROFE.filter((f) => frases.includes(f)).map((f) => `${f}.`);
  return [...elegidas, escrito.trim()].filter((t) => t.length > 0).join(' ');
}

/** Cuántos caracteres quedan para el tope de la API (negativo: cuántos sobran). */
export const caracteresQueQuedan = (texto: string): number => MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION - texto.length;

/** Se manda una nota con algo escrito y dentro del tope; vacía o de más, no. */
export const sePuedeMandar = (texto: string): boolean => texto.trim().length > 0 && caracteresQueQuedan(texto) >= 0;

/** Tocar una frase la suma o la saca; las demás quedan como estaban. */
export function alternarFrase(frases: readonly string[], frase: string): string[] {
  return frases.includes(frase) ? frases.filter((f) => f !== frase) : [...frases, frase];
}

/** Por qué una nota no se mandó, y si sirve reintentar con la misma clave. */
export type MotivoDeNoEnvio = 'conexion' | 'sin-acceso' | 'tope' | 'no-se-entendio';

/**
 * Qué pasó con API-TRN-25: enviada solo con la respuesta del servidor. Sin respuesta (o con una que no se entiende) se
 * reintenta con la misma clave, y el servidor no la duplica. Sin acceso (el 404 de una sesión que su profesional ya no ve),
 * con el tope o con un texto que la API no acepta, reintentar no cambia nada.
 */
export function trasMandar(r: Resultado<unknown>): { readonly tipo: 'enviada' } | { readonly tipo: 'no-se-mando'; readonly motivo: MotivoDeNoEnvio; readonly reintentable: boolean } {
  if (r.ok) return { tipo: 'enviada' };
  if (r.tipo !== 'API' || r.codigo === 'RESPUESTA_NO_RECONOCIDA' || r.status >= 500 || r.codigo === 'RATE_LIMITED' || r.codigo === 'RESOURCE_CONFLICT') {
    return { tipo: 'no-se-mando', motivo: 'conexion', reintentable: true };
  }
  if (r.codigo === 'RESOURCE_NOT_FOUND') return { tipo: 'no-se-mando', motivo: 'sin-acceso', reintentable: false };
  if (r.codigo === 'VALIDATION_FAILED') return { tipo: 'no-se-mando', motivo: 'tope', reintentable: false };
  return { tipo: 'no-se-mando', motivo: 'no-se-entendio', reintentable: false };
}

/** Lo que dice la pantalla de una nota que no se mandó. */
export const TEXTO_DEL_MOTIVO: Readonly<Record<MotivoDeNoEnvio, string>> = {
  conexion: TEXTOS_DE_LA_NOTA.noSeMandoReintentar,
  'sin-acceso': TEXTOS_DE_LA_NOTA.sinAcceso,
  tope: TEXTOS_DE_LA_NOTA.tope,
  'no-se-entendio': TEXTOS_DE_LA_NOTA.noSeEntendio,
};
