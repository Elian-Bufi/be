import localFont from 'next/font/local';

/**
 * La letra del website (WP-TABLERO-ALTA-GAMA, TB-01; DL-163 D-3), autoalojada: los archivos viven al lado de este módulo
 * y se sirven desde el mismo origen, así que alcanza con `font-src 'self'` (render.yaml) y nada se pide a terceros.
 * - **Inter variable** (pesos de 100 a 900), para todo el texto. Tiene cifras tabulares (`tnum`), que usan las tablas,
 *   las series y los gráficos con `font-variant-numeric: tabular-nums`.
 * - **Poppins 600**, solo en los momentos de marca: el título del Espacio profesional, el nombre de la persona en el
 *   marco de la ficha y, con TB-12, la pregunta del cajón «De a una».
 * Las dos son de la SIL Open Font License 1.1 (LICENCIA-INTER.txt y LICENCIA-POPPINS.txt), del paquete Fontsource 5.3.0,
 * con el subconjunto latino, que cubre el español. Una letra que falta en el subconjunto la dibuja el respaldo.
 * El respaldo se ajusta a las medidas de cada una sobre Arial (`adjustFontFallback`): mientras la letra llega, el texto
 * ocupa casi lo mismo y la página no salta.
 */
export const letraDeTexto = localFont({
  src: './inter-latin-variable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--letra-texto',
  adjustFontFallback: 'Arial',
  fallback: ['Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});

export const letraDeMarca = localFont({
  src: './poppins-latin-600.woff2',
  weight: '600',
  style: 'normal',
  display: 'swap',
  variable: '--letra-marca',
  adjustFontFallback: 'Arial',
  fallback: ['Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});
