/**
 * UF-08 de WP-USO-FINAL (DL-169): lo que dice el ambiente. Los avisos de prueba («Ambiente de prueba · solo datos
 * sintéticos», «usá un correo inventado», «Usá una cuenta de Google de prueba», «Descargar la APK de prueba») salen del
 * ambiente y no de un texto fijo: en `test` aparecen (08 §33, solo datos sintéticos), en producción no aparecen nunca, y
 * en `test` se pueden apagar con un interruptor, para mostrar BE como la app final (pedido de Dirección del 2026-11-11).
 *
 * Cada cliente lee los dos valores al construirse, sin pedirlos a la API:
 * - **El website** (export estático): `BE_AMBIENTE` y `BE_AVISOS_DE_PRUEBA`, en `next.config.mjs`. Sin `BE_AMBIENTE`,
 *   el build de Render es `test`, que es el único ambiente que existe hoy (UF-10).
 * - **La APK:** `APP_ENV` (del perfil de `eas.json`, como hasta ahora) y `BE_AVISOS_DE_PRUEBA`, en `app.config.ts`.
 *
 * Un ambiente que no se reconoce muestra los avisos: es preferible un aviso de más en producción que uno de menos en
 * `test`, donde nadie tiene que cargar datos reales.
 */

/** El valor del interruptor que apaga los avisos en un ambiente que no es producción. */
export const AVISOS_DE_PRUEBA_APAGADOS = 'no';

/** Si se muestran los avisos de prueba, con el ambiente del build y el interruptor (`BE_AVISOS_DE_PRUEBA`). */
export function muestraLosAvisosDePrueba(ambiente: string | null | undefined, interruptor?: string | null): boolean {
  if ((ambiente ?? '').trim().toLowerCase() === 'production') return false;
  if ((interruptor ?? '').trim().toLowerCase() === AVISOS_DE_PRUEBA_APAGADOS) return false;
  return true;
}

/**
 * Los textos de los avisos de prueba: los únicos lugares de BE que dicen «de prueba» a la persona. Ninguna pantalla los
 * escribe por su cuenta (lo revisa `scripts/avisos-de-prueba.test.mjs`, TEST-UF-012), y cada una los muestra solo si
 * `muestraLosAvisosDePrueba` lo permite.
 */
export const AVISOS_DE_PRUEBA = {
  /** La franja de la APK, debajo de la cabecera. */
  franja: 'Ambiente de prueba · solo datos sintéticos',
  /** El pie del website y la bienvenida de la APK. */
  general: 'Ambiente de prueba: usá solo datos sintéticos. No ingreses datos reales de personas.',
  /** El alta con correo, en el website y en la APK. */
  registro: 'Ambiente de prueba: usá un correo inventado (por ejemplo, terminado en @example.invalid) y una contraseña que no uses en otro lado.',
  /** El alta y el ingreso con Google: el correo no se inventa, es el de la cuenta. */
  google: 'Ambiente de prueba: BE guarda el correo de esta cuenta de Google. Usá una cuenta de Google de prueba.',
  /** El botón de descarga del Inicio del website. */
  descargarLaApk: 'Descargar la APK de prueba',
} as const;

/** El mismo botón sin los avisos de prueba (producción, o `test` con el interruptor apagado). */
export const DESCARGAR_LA_APP = 'Descargar la app para Android';

/**
 * UF-09 de WP-USO-FINAL (DL-169; UF-D10): el catálogo de demostración, según el ambiente. Las migraciones de WP-04 y de
 * WP-05 siembran alimentos con valores sintéticos y ejercicios de ejemplo (procedencia `BE_SYNTHETIC_SEED`), y una base de
 * producción también los tendría. En producción la API no los ofrece en los buscadores ni los acepta en nada nuevo (un
 * plan, una plantilla, una receta, un habitual o un registro); en `test` y en desarrollo, todo sigue igual. Las filas
 * quedan: las crean las migraciones y la historia no se borra.
 *
 * Lo decide el `APP_ENV` de la API, nunca el cliente. Al revés que los avisos, un ambiente que no se reconoce no lo
 * ofrece: un alimento con valores inventados en una base real llevaría a una estimación equivocada, y lo único que se
 * pierde en un ambiente mal configurado es un ejemplo.
 */
export const PROCEDENCIA_DE_DEMOSTRACION = 'BE_SYNTHETIC_SEED';

/** Si la API ofrece el catálogo de demostración en este ambiente: solo en `test` y en desarrollo. */
export function ofreceElCatalogoDeDemostracion(ambiente: string | null | undefined): boolean {
  const valor = (ambiente ?? '').trim().toLowerCase();
  return valor === 'test' || valor === 'development';
}
