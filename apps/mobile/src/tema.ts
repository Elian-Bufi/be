/**
 * Tokens de la APK: el único lugar de la app donde se escribe un color (docs/paquetes/WP-IDENTIDAD-VISUAL.md, tramos A
 * y E). Dos temas, como el website (Dirección, 2026-09-30):
 * - **Azul noche** (predeterminado): medido en las pantallas mobile de referencia de Dirección del 2026-09-30.
 * - **Claro**: los colores del compositor de láminas (`docs/direccion/BE-VIS-Compositor_v13.3.html`, tema `light`),
 *   con seis ajustes de contraste en el mismo tono (secundario, unidad, azul como texto, éxito, alerta, borde de campo).
 *
 * `scripts/contraste.test.cjs` lee los dos objetos y falla si un par de texto baja de 4,5:1 o un borde de control baja
 * de 3:1 (WCAG 1.4.3 y 1.4.11). Un color nuevo entra acá, en los dos temas y en esa prueba, o no entra.
 *
 * Las pantallas no leen estos objetos: leen `COLOR` y las hojas de `estilosPorTema`, que siguen al tema elegido.
 */
import { StyleSheet } from 'react-native';

export const AZUL_NOCHE = {
  // Superficies y texto
  fondo: '#011325',
  superficie: '#052238',
  texto: '#FFFFFF',
  tenue: '#8DCAE5',
  // Marca e interacción: el cian es el acento; el azul, solo decoración
  acento: '#27D5F9',
  azul: '#1D98DE',
  botonFondo: '#E8F5FE',
  botonTexto: '#011325',
  peligroFondo: '#FF9B8F',
  peligroTexto: '#011325',
  // Bordes: el decorativo separa (el brillo de las tarjetas); el de control delimita un campo y necesita 3:1
  borde: '#0A72A1',
  bordeControl: '#4F7FA3',
  // Estados: siempre con texto además del color (B10-10 §1, §12)
  error: '#FF9B8F',
  errorFondo: '#3B1A25',
  exito: '#6EE7B7',
  exitoFondo: '#0B3A3A',
  // El velo detrás de un diálogo: no es texto ni borde de control
  velo: 'rgba(0, 0, 0, 0.6)',
};

export const CLARO: Paleta = {
  fondo: '#F2F6FC',
  superficie: '#FFFFFF',
  texto: '#0A1F44',
  tenue: '#62728A',
  acento: '#1465F1',
  azul: '#1E6BF2',
  botonFondo: '#1E6BF2',
  botonTexto: '#FFFFFF',
  peligroFondo: '#BB4D1C',
  peligroTexto: '#FFFFFF',
  borde: '#E3ECFF',
  bordeControl: '#7B8EA8',
  error: '#BB4D1C',
  errorFondo: '#FFF4F0',
  exito: '#107F45',
  exitoFondo: '#EEF8F2',
  velo: 'rgba(10, 31, 68, 0.45)',
};

export type Paleta = { readonly [K in keyof typeof AZUL_NOCHE]: string };

export const TEMAS = ['azul-noche', 'claro'] as const;
export type Tema = (typeof TEMAS)[number];
export const TEMA_PREDETERMINADO: Tema = 'azul-noche';
export const PALETAS: Readonly<Record<Tema, Paleta>> = { 'azul-noche': AZUL_NOCHE, claro: CLARO };
/** Los íconos de la barra del sistema: claros sobre Azul noche, oscuros sobre Claro. */
export const BARRA_DEL_SISTEMA: Readonly<Record<Tema, 'light' | 'dark'>> = { 'azul-noche': 'light', claro: 'dark' };

export const esTema = (valor: unknown): valor is Tema => TEMAS.includes(valor as Tema);

// ─── El tema vigente ─────────────────────────────────────────────────────────────────────────────
// Uno para toda la app. Lo fija la raíz (App.tsx) al arrancar y cuando la persona lo cambia; la raíz se vuelve a
// dibujar entera, y cada componente toma los colores del tema nuevo al dibujarse.
let vigente: Tema = TEMA_PREDETERMINADO;
export const temaVigente = (): Tema => vigente;
export function fijarTema(tema: Tema): void {
  vigente = tema;
}

/** Los colores del tema vigente, leídos al momento de usarlos (dentro de un componente, al dibujarse). */
export const COLOR: Paleta = new Proxy({} as Paleta, {
  get: (_objeto, clave) => PALETAS[vigente][clave as keyof Paleta],
});

/**
 * Una hoja de estilos que sigue al tema: se arma con la paleta de cada tema la primera vez que se usa y queda
 * guardada. Se escribe igual que `StyleSheet.create`, con la paleta como parámetro.
 */
export function estilosPorTema<T extends StyleSheet.NamedStyles<T>>(fabrica: (color: Paleta) => T): T {
  const hojas = new Map<Tema, T>();
  const hoja = (): T => {
    let h = hojas.get(vigente);
    if (!h) {
      h = StyleSheet.create(fabrica(PALETAS[vigente]));
      hojas.set(vigente, h);
    }
    return h;
  };
  return new Proxy({} as T, { get: (_objeto, clave) => hoja()[clave as keyof T] });
}
