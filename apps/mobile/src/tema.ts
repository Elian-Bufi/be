/**
 * Tokens de la APK: el único lugar de la app donde se escribe un color (docs/paquetes/WP-IDENTIDAD-VISUAL.md, tramos A
 * y E). Dos temas, como el website (Dirección, 2026-09-30):
 * - **Azul noche** (predeterminado): medido en las pantallas mobile de referencia de Dirección del 2026-09-30.
 * - **Claro**: los colores del compositor de láminas (`docs/direccion/BE-VIS-Compositor_v13.3.html`, tema `light`),
 *   con seis ajustes de contraste en el mismo tono (secundario, unidad, azul como texto, éxito, alerta, borde de campo).
 *
 * `scripts/contraste.test.cjs` lee los dos objetos y falla si un par de texto baja de 4,5:1 o un borde de control baja
 * de 3:1 (WCAG 1.4.3 y 1.4.11). Un color nuevo entra acá, en los dos temas y en esa prueba, o no entra. Los opacos se
 * escriben `#rrggbb` y los translúcidos `#rrggbbaa`; un token translúcido en un tema y opaco en el otro va con alfa en
 * los dos (`#rrggbbFF`), porque la prueba exige las mismas claves en cada grupo.
 *
 * **La receta de vidrio** (WP-APP-VUELTA-2 §3.1, DL-170): el fondo es un degradé (`fondoArriba`, `fondo`, `fondoAbajo`)
 * con dos destellos quietos, y las tarjetas son de vidrio en dos niveles (`vidrio` y `vidrioInterior`) con un borde y una
 * línea de luz. La dibujan `vidrio.tsx` y `receta-de-vidrio.ts`; acá están solo los colores.
 * - **`superficie` sigue opaca** (AV2-T2): en Azul noche es exactamente `vidrio` sobre el fondo liso, y en Claro casi
 *   (#FCFDFE contra #FFFFFF). Los diálogos, la fila fija de la sesión, los campos y lo que todavía no migró la usan y no
 *   desentonan. Volverla translúcida rompería los diálogos (nada se ve a través de ellos) y la prueba.
 * - **Los destellos tienen un tope:** cian al 12 % y azul al 14 % en Azul noche. La prueba mide el texto en el peor
 *   punto (los tres puntos del degradé, con cada destello solo y con los dos juntos, y el vidrio encima), y el margen es
 *   fino: con el 14 % y el 18 %, el tenue directo sobre el fondo baja a 4,16:1. Un destello más fuerte no entra sin
 *   bajar otra cosa.
 *
 * Las pantallas no leen estos objetos: leen `COLOR` y las hojas de `estilosPorTema`, que siguen al tema elegido.
 */
import { StyleSheet } from 'react-native';

export const AZUL_NOCHE = {
  // Superficies y texto. El fondo de la app es un degradé de `fondoArriba` a `fondoAbajo`, con `fondo` al 55 % del alto;
  // con el «Texto de alto contraste» de Android, `fondo` liso (DL-170).
  fondoArriba: '#04223D',
  fondo: '#011325',
  fondoAbajo: '#000D1A',
  superficie: '#052238',
  // Un escalón más claro que la superficie: el botón secundario, las fichas y lo elegido (tanda del 2026-10-03).
  superficieElevada: '#0A2B47',
  texto: '#FFFFFF',
  // El tenue gris azulado del website (F-143, aprobado por Dirección el 2026-10-15): la APK lo esperaba desde entonces
  // («conserva el celeste hasta su próxima versión») y lo toma con la receta de vidrio (AV2-T5).
  tenue: '#A3B1C2',
  // Marca e interacción: el cian es el acento; el azul, solo decoración
  acento: '#27D5F9',
  azul: '#1D98DE',
  // El botón principal (DL-170): un degradé de `botonFondo` arriba a `botonFondoFin` abajo, con un resplandor quieto
  // mientras está habilitado. Antes era casi blanco (#E8F5FE).
  botonFondo: '#27D5F9',
  botonFondoFin: '#16B4E8',
  botonTexto: '#011325',
  peligroFondo: '#FF9B8F',
  peligroTexto: '#011325',
  // Bordes: el decorativo separa; el de control delimita un campo y necesita 3:1. El decorativo era un azul brillante
  // (#0A72A1) en todas las tarjetas y competía con el cian; desde el 2026-10-03 es un azul apagado, y el cian queda
  // para lo que orienta: lo elegido, lo activo y los datos.
  borde: '#173F61',
  // Sobre el vidrio con los destellos, el borde de antes (#4F7FA3) bajaba a 2,49:1 (AV2-T6).
  bordeControl: '#6497BD',
  // Estados: siempre con texto además del color (B10-10 §1, §12)
  error: '#FF9B8F',
  errorFondo: '#3B1A25',
  exito: '#6EE7B7',
  exitoFondo: '#0B3A3A',
  // El velo detrás de un diálogo: no es texto ni borde de control
  velo: 'rgba(0, 0, 0, 0.6)',
  // La barra inferior (DL-117): una cápsula de vidrio ahumado, sin desenfoque, con el borde y la línea de luz de la
  // receta. Desde DL-170 deja ver un 12 % de lo que pasa detrás (antes, un 6 %). `scripts/contraste.test.cjs` mide las
  // etiquetas sobre la mezcla del vidrio con cualquier color del tema que pueda pasar detrás.
  barraVidrio: '#0A2B47E0',
  barraBorde: '#1D4B72',
  barraTexto: '#A3B1C2',
  barraElegido: '#27D5F9',
  // La sombra de lo que todavía no migró (la lámina de la toma y sus tarjetas): no es texto ni borde.
  sombra: '#000000',
  // ─── La receta de vidrio (DL-170, §3.1) ────────────────────────────────────────────────────
  // Los dos destellos del fondo: luz quieta, que no marca nada que se toque (GUIA I.6). Su tope está en el encabezado.
  destello: '#27D5F91F',
  destelloAzul: '#1D98DE24',
  // La tarjeta de nivel 1 y lo que va adentro (nivel 2). Sobre el fondo liso, `vidrio` da exactamente `superficie`.
  vidrio: '#072B449E',
  vidrioInterior: '#FFFFFF0F',
  // El borde de luz, de 1 dp: el filo del vidrio del compositor (LAMINA-DEL-COMPOSITOR §3.9).
  vidrioFilo: '#96C8EB3B',
  // La línea de luz bajo el borde de arriba, por dentro.
  vidrioLuz: '#FFFFFF33',
  // El brillo de arriba de una tarjeta de nivel 1. Se apaga dentro del relleno: ningún texto queda encima (AV2-T14).
  vidrioBrillo: '#FFFFFF0D',
  // La sombra de una tarjeta de nivel 1 y el resplandor del botón principal habilitado: no son texto ni borde.
  sombraVidrio: '#00000059',
  resplandorPrimario: '#27D5F94D',
  // La etiqueta de estado neutra (rellena, sin borde, con el texto en `tenue`) y el tinte de «la que sigue», con el borde
  // en `acento`. El tinte es del 8 %: con el 12 %, el tenue quedaba en 4,45:1 (AV2-T7).
  etiquetaFondo: '#FFFFFF14',
  destacadaFondo: '#27D5F914',
  // La lámina de la toma (DL-111): los colores del tema «Azul» del compositor (`.slide.blue`), con las transparencias
  // ya resueltas sobre su fondo para que la prueba de contraste las pueda medir.
  laminaFondo: '#0C2E63',
  laminaTarjeta: '#1F3F70',
  laminaBorde: '#334F7C',
  laminaNombre: '#E0E4EB',
  laminaValor: '#FFFFFF',
  laminaDetalle: '#CED5DF',
  // El contorno de la silueta. En Azul noche el cuerpo ya contrasta, unos 11:1 con el fondo, y el contorno va del tono
  // del cuerpo: casi no se ve. En Claro es lo que separa el cuerpo del fondo.
  laminaContorno: '#E9EEF5',
  // El filo de las tarjetas de la lámina (pulido del 2026-10-04): apenas más claro, en lugar de un borde. Su brillo no se
  // dibuja desde el 2026-10-06, y se retiró con su medición (DL-170).
  laminaFilo: '#FFFFFF24',
  // El fondo de la ilustración de un ejercicio, ajustada entera (precierre del 2026-10-06, §5): el blanco con el que el
  // servidor aplana la transparencia al guardar la imagen. Igual en los dos temas, para que la imagen no deje franjas.
  // No lleva texto encima.
  fondoDeIlustracion: '#FFFFFF',
  // La «G» del botón «Continuar con Google» (DL-138): los cuatro colores de la marca de Google, iguales en los dos temas,
  // porque las pautas de Google no dejan cambiarlos. Es un logotipo: no es texto ni borde de control.
  googleAzul: '#4285F4',
  googleVerde: '#34A853',
  googleAmarillo: '#FBBC05',
  googleRojo: '#EA4335',
};

export const CLARO: Paleta = {
  // El «gris azulado» de la maqueta sale de la sombra de las tarjetas, no de oscurecer el fondo: un fondo más oscuro que
  // `fondoAbajo` deja el tenue, el acento, el éxito y el error por debajo de 4,5:1 (WP-APP-VUELTA-2 §1.2).
  fondoArriba: '#F7F9FD',
  fondo: '#F2F6FC',
  fondoAbajo: '#F0F4FB',
  superficie: '#FFFFFF',
  superficieElevada: '#F4F7FC',
  texto: '#0A1F44',
  // Sobre el degradé, el de antes (#62728A) bajaba a 4,43:1 (AV2-T5).
  tenue: '#5B6B82',
  acento: '#1465F1',
  azul: '#1E6BF2',
  botonFondo: '#1E6BF2',
  botonFondoFin: '#1453C9',
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
  // La barra inferior: el blanco que deja ver un 12 % de lo que pasa detrás (antes, un 5 %). Las etiquetas van más
  // oscuras que `tenue` y que `acento`: sobre el vidrio, con un texto oscuro pasando detrás, esos dos no llegan a 4,5:1.
  barraVidrio: '#FFFFFFE0',
  barraBorde: '#D5E0F0',
  barraTexto: '#4A5A70',
  barraElegido: '#1453C9',
  sombra: '#0A1F44',
  // La receta de vidrio en Claro: los destellos aclaran; el vidrio es blanco translúcido y el nivel 2, blanco opaco; el
  // borde de luz es blanco; sin línea ni brillo arriba, que sobre blanco no se verían; la sombra, azul y suave.
  destello: '#FFFFFF99',
  destelloAzul: '#F0FAFFCC',
  vidrio: '#FFFFFFC7',
  vidrioInterior: '#FFFFFFFF',
  vidrioFilo: '#FFFFFFE6',
  vidrioLuz: '#FFFFFF00',
  vidrioBrillo: '#FFFFFF00',
  sombraVidrio: '#14326421',
  resplandorPrimario: '#1E6BF240',
  etiquetaFondo: '#0A1F440F',
  // «La que sigue»: un celeste opaco. Con #E8F1FF, el acento quedaba en 4,44:1 (AV2-T7).
  destacadaFondo: '#EEF5FFFF',
  // La lámina de la toma (DL-111): los colores del tema «Claro» del compositor (`.slide.light`). El detalle va más
  // oscuro que su `.rowUnit`, que no llega a 4,5:1.
  laminaFondo: '#E4ECF8',
  laminaTarjeta: '#FFFFFF',
  laminaBorde: '#D6E2F3',
  laminaNombre: '#334155',
  laminaValor: '#1E6BF2',
  laminaDetalle: '#475569',
  // El contorno de la silueta (prueba de la 0.13.1): el cuerpo blanco contra este fondo medía de 1,01:1 a 1,19:1.
  // Con el contorno, la silueta se distingue con más de 3:1 (WCAG 1.4.11).
  laminaContorno: '#64748B',
  // Las tarjetas de la lámina en Claro: la tarjeta blanca se separa del fondo por la sombra y un filo apenas oscuro.
  laminaFilo: '#0A1F4414',
  fondoDeIlustracion: '#FFFFFF',
  googleAzul: '#4285F4',
  googleVerde: '#34A853',
  googleAmarillo: '#FBBC05',
  googleRojo: '#EA4335',
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
