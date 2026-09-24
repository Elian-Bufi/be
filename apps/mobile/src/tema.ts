/**
 * Tokens de la APK: el único lugar de la app donde se escribe un color (docs/paquetes/WP-IDENTIDAD-VISUAL.md, tramos A
 * y E). Tema oscuro, como las referencias de Dirección del 2026-09-21, que son pantallas de la APK.
 *
 * `scripts/contraste.test.cjs` lee este objeto y falla si un par de texto baja de 4,5:1 o un borde de control baja de
 * 3:1 (WCAG 1.4.3 y 1.4.11). Un color nuevo entra acá y en esa prueba, o no entra.
 */
export const COLOR = {
  // Superficies y texto
  fondo: '#04213F',
  superficie: '#0A2E52',
  texto: '#F2F7FC',
  tenue: '#A9C1DA',
  // Marca e interacción: el cian es el acento; el azul, solo decoración
  acento: '#5EE0FB',
  azul: '#2E8FFF',
  botonFondo: '#5EE0FB',
  botonTexto: '#04213F',
  peligroFondo: '#FF9B8F',
  peligroTexto: '#04213F',
  // Bordes: el decorativo separa; el de control delimita un campo y necesita 3:1
  borde: '#1E4470',
  bordeControl: '#7FA3C8',
  // Estados: siempre con texto además del color (B10-10 §1, §12)
  error: '#FF9B8F',
  errorFondo: '#3B1A25',
  exito: '#6EE7B7',
  exitoFondo: '#0B3A3A',
};

/** El velo detrás de un diálogo: no es texto ni borde de control. */
export const VELO = 'rgba(0, 0, 0, 0.6)';
