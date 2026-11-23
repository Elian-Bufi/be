/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-09; E15 de Dirección) · el campo de tiempo con máscara «mm:ss», sin React, para
 * probarlo solo (`apps/web/test/editor-de-entrenamiento.test.mjs`).
 *
 * - **El «:» queda fijo:** no hay que escribirlo.
 * - **Lo que se escribe entra por los minutos:** «3» es 03:00 (tres minutos, no tres segundos); «13», 13:00; con tres
 *   cifras, la primera son los minutos y las otras dos los segundos: «130» es 01:30; con cuatro, «1305» es 13:05.
 * - Borrar saca la última cifra; sin cifras, el campo queda vacío (sin descanso propio).
 * - Lo que no es un tiempo (segundos de 60 o más, más de 60:00) se ve como se escribió y no se guarda: es NaN, como en
 *   el resto de la planilla.
 * - Pegar «2:30» o «150» (segundos) se entiende como siempre (`leerDescanso`).
 */

/** Cuántas cifras entran: mm y ss. */
export const CIFRAS_DE_LA_MASCARA = 4;
/** El tope del contrato (`DescansoRecomendadoSchema`): una hora. */
export const TOPE_DE_SEGUNDOS = 3600;

const dos = (n: number): string => String(n).padStart(2, '0');

/** Los minutos y los segundos de lo escrito, por cifras. Sin cifras, `null`. */
function partes(cifras: string): { readonly minutos: number; readonly segundos: number } | null {
  const c = cifras.replace(/\D/g, '').slice(0, CIFRAS_DE_LA_MASCARA);
  if (c === '') return null;
  if (c.length <= 2) return { minutos: Number(c), segundos: 0 };
  return { minutos: Number(c.slice(0, c.length - 2)), segundos: Number(c.slice(-2)) };
}

/** Lo que muestra el campo con esas cifras: «03:00», «01:30». Sin cifras, vacío. */
export function textoDeLaMascara(cifras: string): string {
  const p = partes(cifras);
  return p ? `${dos(p.minutos)}:${dos(p.segundos)}` : '';
}

/** Los segundos que dicen esas cifras; `null` sin cifras; NaN si no es un tiempo de hasta 60:00. */
export function segundosDeLaMascara(cifras: string): number | null {
  const p = partes(cifras);
  if (!p) return null;
  if (p.segundos >= 60) return Number.NaN;
  const total = p.minutos * 60 + p.segundos;
  return total > TOPE_DE_SEGUNDOS ? Number.NaN : total;
}

/** Lo que queda escrito al apretar una tecla: una cifra se suma (hasta cuatro); Borrar saca la última; Suprimir, todo. */
export function cifrasTrasLaTecla(cifras: string, tecla: string): string | null {
  if (/^\d$/.test(tecla)) return cifras.length >= CIFRAS_DE_LA_MASCARA ? cifras : cifras + tecla;
  if (tecla === 'Backspace') return cifras.slice(0, -1);
  if (tecla === 'Delete') return '';
  return null;
}

/** Las cifras que muestran unos segundos, para seguir escribiendo desde ahí: 90 → «130» (01:30); 180 → «3» (03:00). */
export function cifrasDeSegundos(segundos: number | null | undefined): string {
  if (typeof segundos !== 'number' || !Number.isFinite(segundos) || segundos < 0) return '';
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return s === 0 ? String(m) : `${m}${dos(s)}`;
}
