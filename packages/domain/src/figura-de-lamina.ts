/**
 * La lámina antropométrica del compositor de Dirección, como datos tipados: las seis figuras, dónde va cada sitio de
 * toma (por clave de medición de BE) y la geometría con que el compositor arma la lámina, para dibujarla igual en el
 * website y en la APK.
 *
 * Fuente única: `docs/direccion/BE-VIS-Compositor_v13.3.html` (compositor v13.3, recibido de Dirección el 2026-09-20;
 * ver `docs/direccion/UI-ANTROPOMETRIA.md`). Cada bloque cita el objeto o la función del compositor de donde sale
 * (`FIGS`, `LAY`, `SLAY`, `GR`, `GF`, `POST`, `TAG`, `BONES`, `PAL`, `figGeom`, `ringG`, `dotG`, `panelHTML`,
 * `layoutSide`, `slide1`, `slide2`, `serieSlide`). El diseño completo —encabezado, pie, tipografía, colores de cada
 * tema, la lámina «Conclusiones» y el modo Serie— está descripto en `docs/direccion/LAMINA-DEL-COMPOSITOR.md`.
 *
 * Las imágenes son los PNG originales del compositor, extraídos sin recomprimir a `packages/domain/assets/figura/`; acá
 * van solo su nombre, tamaño y huella. Las posiciones las calibró Dirección a mano en el compositor (modo «Calibrar») y
 * se copian tal cual, sin redondear ni corregir.
 *
 * Rige la misma regla que la figura de la toma (figura-antropometrica.ts; DL-073): la lámina **ubica, nunca califica**
 * (RF-048, INV-06-06). Los colores de este archivo distinguen capas del dibujo —anillo, punto, guía, sitio posterior—,
 * nunca rangos de un valor. Por eso no se trajeron los colores «mejor / peor» del modo Serie (`DCOL`): están descriptos
 * en el documento, como tensión abierta.
 */

// ─── Sexo, encuadre y tema ──────────────────────────────────────────────────────────────────────

/** Compositor: `m` (Hombre) y `f` (Mujer). */
export type SexoDeLaLamina = 'HOMBRE' | 'MUJER';

/** Compositor: `all` (Entero), `sup` (Tren superior) e `inf` (Tren inferior). */
export type EncuadreDeLaLamina = 'ENTERO' | 'TREN_SUPERIOR' | 'TREN_INFERIOR';

/** Compositor: `light` (Claro), `dark` (Oscuro) y `blue` (Azul). */
export type TemaDeLaLamina = 'CLARO' | 'OSCURO' | 'AZUL';

/** Los códigos con que el compositor nombra sexo, encuadre y tema (sus botones y las claves de `FIGS` y `PAL`). */
export const CODIGO_EN_EL_COMPOSITOR = {
  sexo: { HOMBRE: 'm', MUJER: 'f' },
  encuadre: { ENTERO: 'all', TREN_SUPERIOR: 'sup', TREN_INFERIOR: 'inf' },
  tema: { CLARO: 'light', OSCURO: 'dark', AZUL: 'blue' },
} as const;

/** La píldora de arriba a la derecha en Circunferencias y Pliegues (compositor: `TAG`). En Serie va «SERIE · » delante. */
export const ETIQUETA_DEL_ENCUADRE: Readonly<Record<EncuadreDeLaLamina, string>> = {
  ENTERO: 'CUERPO ENTERO',
  TREN_SUPERIOR: 'TREN SUPERIOR',
  TREN_INFERIOR: 'TREN INFERIOR',
};

// ─── Las claves: del compositor a BE ────────────────────────────────────────────────────────────

/** Los pliegues que la lámina ubica, por su clave de medición de BE (un punto cada uno). */
export type PliegueDeLaLamina =
  | 'pliegue-pectoral'
  | 'pliegue-axilar-media'
  | 'pliegue-triceps'
  | 'pliegue-biceps'
  | 'pliegue-subescapular'
  | 'pliegue-antebrazo'
  | 'pliegue-supraespinal'
  | 'pliegue-cresta-iliaca'
  | 'pliegue-abdominal'
  | 'pliegue-muslo-frontal'
  | 'pliegue-pantorrilla';

/** Los perímetros que la lámina ubica (un anillo cada uno). */
export type PerimetroDeLaLamina =
  | 'perimetro-cuello'
  | 'perimetro-hombros'
  | 'perimetro-pecho'
  | 'perimetro-brazo-relajado'
  | 'perimetro-brazo-flexionado'
  | 'perimetro-antebrazo'
  | 'perimetro-muneca'
  | 'perimetro-cintura'
  | 'perimetro-abdomen'
  | 'perimetro-cadera'
  | 'perimetro-muslo'
  | 'perimetro-pantorrilla'
  | 'perimetro-tobillo';

/** Los diámetros óseos: no tienen sitio en la figura; van en un bloque al pie de Circunferencias. */
export type DiametroDeLaLamina = 'diametro-humero' | 'diametro-biestiloideo' | 'diametro-femur';

export type ClaveDeLaLamina = PliegueDeLaLamina | PerimetroDeLaLamina | DiametroDeLaLamina;

/**
 * Clave del compositor → clave de medición de BE (compositor: `RINGS`, `FOLDS` y `BONES`; los códigos de planilla
 * `CM…`, `PL…` y `DO…` de su lector de datos, `AL`, confirman cada sitio). Dos equivalencias no son literales:
 * - `plSuprailiaco` («Suprailíaco», PL3 del Jackson-Pollock 7) → `pliegue-supraespinal`. El compositor lo ubica de
 *   frente, sobre la línea axilar anterior y apenas arriba de la cresta ilíaca: es el «suprailíaco» de JP7 y ACSM, que en
 *   la nomenclatura ISAK se corresponde con el supraespinal (no son idénticos: cambian el reparo y la dirección del
 *   pliegue). La cresta ilíaca de ISAK se toma en la línea medioaxilar y el compositor no la dibuja (BE la suma: ver
 *   `PLIEGUES_SUMADOS_POR_BE`). En BE el rótulo es «Supraespinal»: las fórmulas de Jackson y Pollock toman su
 *   suprailíaco en la cresta ilíaca (DL-111, D-1 de la ficha de métodos), y un «Suprailíaco» con el valor del
 *   supraespinal diría otra cosa que el cálculo.
 * - `brazoCon` («Brazo contraído») → `perimetro-brazo-flexionado` (flexionado y contraído).
 * Además, `abdomen` se rotula «Abdomen bajo» (CM5 en la planilla).
 */
export const CLAVE_BE_DEL_COMPOSITOR = {
  cuello: 'perimetro-cuello',
  hombros: 'perimetro-hombros',
  pecho: 'perimetro-pecho',
  brazoRel: 'perimetro-brazo-relajado',
  brazoCon: 'perimetro-brazo-flexionado',
  antebrazo: 'perimetro-antebrazo',
  munecaC: 'perimetro-muneca',
  cintura: 'perimetro-cintura',
  abdomen: 'perimetro-abdomen',
  cadera: 'perimetro-cadera',
  muslo: 'perimetro-muslo',
  pantorrilla: 'perimetro-pantorrilla',
  tobillo: 'perimetro-tobillo',
  plPectoral: 'pliegue-pectoral',
  plAxilar: 'pliegue-axilar-media',
  plTriceps: 'pliegue-triceps',
  plSubescapular: 'pliegue-subescapular',
  plAntebrazo: 'pliegue-antebrazo',
  plSuprailiaco: 'pliegue-supraespinal',
  plAbdominal: 'pliegue-abdominal',
  plMuslo: 'pliegue-muslo-frontal',
  plPantorrilla: 'pliegue-pantorrilla',
  doCodo: 'diametro-humero',
  doMuneca: 'diametro-biestiloideo',
  doRodilla: 'diametro-femur',
} as const satisfies Readonly<Record<string, ClaveDeLaLamina>>;

/**
 * DL-113 · dos pliegues que el compositor no dibuja y BE suma a la figura, porque los piden métodos del catálogo: el
 * **bíceps** (Durnin y Womersley) y la **cresta ilíaca** (Durnin y Womersley, Jackson y Pollock). Sus coordenadas no
 * vienen del compositor: las ubicó el ejecutor sobre cada figura y Dirección las tiene que validar.
 * - Bíceps: en la cara anterior del brazo, a la mitad, **a la misma altura que el tríceps** (cara posterior), en el centro
 *   del brazo a esa altura.
 * - Cresta ilíaca: sobre la línea medioaxilar, **a la misma altura que el supraespinal**, que de frente es el borde del
 *   tronco.
 * De frente, cada par casi coincide: son caras o líneas distintas a la misma altura. No se corren para separarlos (regla
 * de Dirección, 2026-10-02: un punto anatómico no se mueve para resolver un cruce). Sus guías llegan al mismo lugar y las
 * tarjetas dicen cuál es cuál; el tríceps sigue marcado «posterior». La primera versión (DL-113) los corría unos puntos
 * para separarlos, y eso no corresponde.
 */
export const PLIEGUES_SUMADOS_POR_BE: readonly PliegueDeLaLamina[] = ['pliegue-biceps', 'pliegue-cresta-iliaca'];

/**
 * Los pliegues de la cara posterior (compositor: `POST`). La figura está de frente: el punto real se dibuja debajo de la
 * imagen —el cuerpo lo tapa— y encima queda su contorno punteado; la fila de la tarjeta va atenuada y con la marca
 * «posterior».
 */
export const PLIEGUES_POSTERIORES_DE_LA_LAMINA: readonly PliegueDeLaLamina[] = ['pliegue-triceps', 'pliegue-subescapular'];

export function esPliegueDeLaCaraPosterior(clave: string): boolean {
  return (PLIEGUES_POSTERIORES_DE_LA_LAMINA as readonly string[]).includes(clave);
}

/** El rótulo de cada sitio en las tarjetas, tal como lo escribe el compositor (`RINGS`, `FOLDS`, `BONES`). */
export const ROTULO_EN_LA_LAMINA: Readonly<Record<ClaveDeLaLamina, string>> = {
  'perimetro-cuello': 'Cuello',
  'perimetro-hombros': 'Hombros',
  'perimetro-pecho': 'Pecho',
  'perimetro-brazo-relajado': 'Brazo relajado',
  'perimetro-brazo-flexionado': 'Brazo contraído',
  'perimetro-antebrazo': 'Antebrazo',
  'perimetro-muneca': 'Muñeca',
  'perimetro-cintura': 'Cintura',
  'perimetro-abdomen': 'Abdomen bajo',
  'perimetro-cadera': 'Cadera',
  'perimetro-muslo': 'Muslo',
  'perimetro-pantorrilla': 'Pantorrilla',
  'perimetro-tobillo': 'Tobillo',
  'pliegue-pectoral': 'Pectoral',
  'pliegue-axilar-media': 'Axilar media',
  'pliegue-triceps': 'Tríceps',
  'pliegue-biceps': 'Bíceps',
  'pliegue-subescapular': 'Subescapular',
  'pliegue-antebrazo': 'Antebrazo',
  'pliegue-supraespinal': 'Supraespinal',
  'pliegue-cresta-iliaca': 'Cresta ilíaca',
  'pliegue-abdominal': 'Abdominal',
  'pliegue-muslo-frontal': 'Muslo anterior',
  'pliegue-pantorrilla': 'Pantorrilla',
  'diametro-humero': 'Codo',
  'diametro-biestiloideo': 'Muñeca',
  'diametro-femur': 'Rodilla',
};

// ─── Las figuras y sus sitios ───────────────────────────────────────────────────────────────────

/**
 * Las coordenadas del compositor son **relativas a la imagen de la figura**, no a la lámina:
 * - `y`: distancia desde el borde superior de la imagen, en % de su alto;
 * - `x`: desplazamiento horizontal desde el **centro** de la imagen, en % de su ancho; negativo es a la izquierda de
 *   quien mira, que es el lado derecho de la persona (la figura está de frente);
 * - `ancho` (solo perímetros): el ancho total del anillo, en % del ancho de la imagen. El alto del anillo es 0,17 de su
 *   ancho (`ringG`).
 * En píxeles de la imagen (900 × 1350): px = 900 · (0,5 + x/100); py = 1350 · y/100; ancho = 900 · ancho/100. Para
 * llevarlas a la lámina: `ubicarFiguraEnLaLamina` y después `anilloEnLaLamina` o `puntoEnLaLamina`.
 */
export interface SitioDePerimetroEnLaFigura {
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
}

export interface SitioDePliegueEnLaFigura {
  readonly x: number;
  readonly y: number;
}

export interface FiguraDeLaLamina {
  /** El archivo, en `packages/domain/assets/figura/`: PNG RGBA de 8 bits, fondo transparente, cuerpo con alfa 251. */
  readonly archivo: string;
  readonly anchoPx: number;
  readonly altoPx: number;
  readonly bytes: number;
  /** SHA-256 del archivo: son los bytes del base64 del compositor, sin recomprimir. */
  readonly sha256: string;
  /**
   * La caja del cuerpo dentro de la imagen, en % (compositor: `top`, `bh`, `cx`, `bw`): borde superior y alto, en % del
   * alto de la imagen; centro horizontal y ancho, en % del ancho. Con ella se encuadra la figura en la lámina. Coincide
   * con la caja medida sobre el alfa con diferencias de hasta 1 punto.
   */
  readonly cuerpo: { readonly arriba: number; readonly alto: number; readonly centroX: number; readonly ancho: number };
  readonly perimetros: Readonly<Partial<Record<PerimetroDeLaLamina, SitioDePerimetroEnLaFigura>>>;
  readonly pliegues: Readonly<Partial<Record<PliegueDeLaLamina, SitioDePliegueEnLaFigura>>>;
}

/**
 * Las seis figuras del compositor (`FIGS`), con sus sitios por clave de BE. Son seis imágenes distintas, ninguna
 * repetida: los trenes muestran el mismo maniquí y la misma pose que el cuerpo entero, más cerca (×1,6 a ×1,75) y con
 * más definición que el recorte equivalente; el tren inferior, además, sin brazos. No se pueden obtener recortando el
 * entero (detalle en el documento).
 */
export const FIGURAS_DE_LA_LAMINA: Readonly<Record<SexoDeLaLamina, Readonly<Record<EncuadreDeLaLamina, FiguraDeLaLamina>>>> = {
  HOMBRE: {
    ENTERO: {
      archivo: 'hombre-entero.png',
      anchoPx: 900,
      altoPx: 1350,
      bytes: 411154,
      sha256: 'd8e14eee8b2e210da88e209f5161f99da30d5f89292c4fbc6ffb441c1d142ee4',
      cuerpo: { arriba: 2.41, alto: 90.1, centroX: 50, ancho: 43.65 },
      perimetros: {
        'perimetro-cuello': { x: 0, y: 14.3, ancho: 10 },
        'perimetro-hombros': { x: -0.1, y: 20.4, ancho: 37.3 },
        'perimetro-pecho': { x: -0.3, y: 25, ancho: 24.4 },
        'perimetro-brazo-relajado': { x: -15.3, y: 26.2, ancho: 7.3 },
        'perimetro-brazo-flexionado': { x: -15.5, y: 27.3, ancho: 7.3 },
        'perimetro-antebrazo': { x: -17.7, y: 35.2, ancho: 9.2 },
        'perimetro-muneca': { x: -19.6, y: 44.2, ancho: 6.9 },
        'perimetro-cintura': { x: 0.3, y: 32, ancho: 21.5 },
        'perimetro-abdomen': { x: 0, y: 36.6, ancho: 23.4 },
        'perimetro-cadera': { x: -0.1, y: 46, ancho: 28.3 },
        'perimetro-muslo': { x: -7.5, y: 53.7, ancho: 14.6 },
        'perimetro-pantorrilla': { x: -8.5, y: 72.1, ancho: 12.1 },
        'perimetro-tobillo': { x: -8.6, y: 84.1, ancho: 6.5 },
      },
      pliegues: {
        'pliegue-pectoral': { x: -12, y: 22.5 },
        'pliegue-axilar-media': { x: -11.3, y: 25.7 },
        'pliegue-triceps': { x: -14.7, y: 28.5 },
        'pliegue-biceps': { x: -15.4, y: 28.5 },
        'pliegue-subescapular': { x: -1.7, y: 27.6 },
        'pliegue-antebrazo': { x: -17.3, y: 35.8 },
        'pliegue-supraespinal': { x: -8.6, y: 34.3 },
        'pliegue-cresta-iliaca': { x: -9.2, y: 34.3 },
        'pliegue-abdominal': { x: -3.9, y: 36.3 },
        'pliegue-muslo-frontal': { x: -7.3, y: 53 },
        'pliegue-pantorrilla': { x: -4.6, y: 72.6 },
      },
    },
    TREN_SUPERIOR: {
      archivo: 'hombre-tren-superior.png',
      anchoPx: 900,
      altoPx: 1350,
      bytes: 743101,
      sha256: '200784e1df2ef8beda23fab653b4b7a57d994b3c0f32c88b995424fbb0b3d16b',
      cuerpo: { arriba: 3.91, alto: 90.69, centroX: 49.9, ancho: 71.58 },
      perimetros: {
        'perimetro-cuello': { x: 0.1, y: 23.9, ancho: 17.9 },
        'perimetro-hombros': { x: -1.4, y: 34.7, ancho: 61.5 },
        'perimetro-pecho': { x: 0.3, y: 43, ancho: 41.4 },
        'perimetro-brazo-relajado': { x: -26.4, y: 44.4, ancho: 13 },
        'perimetro-brazo-flexionado': { x: -26.4, y: 46.1, ancho: 12.6 },
        'perimetro-antebrazo': { x: -29.3, y: 59.1, ancho: 15.1 },
        'perimetro-muneca': { x: -31.9, y: 75.2, ancho: 9.4 },
        'perimetro-cintura': { x: 0, y: 55.3, ancho: 35.6 },
        'perimetro-abdomen': { x: -0.1, y: 61.1, ancho: 38.1 },
        'perimetro-cadera': { x: 0.2, y: 76.9, ancho: 46.4 },
      },
      pliegues: {
        'pliegue-pectoral': { x: -19.6, y: 39.3 },
        'pliegue-axilar-media': { x: -19.8, y: 43.3 },
        'pliegue-triceps': { x: -26.1, y: 48.5 },
        'pliegue-biceps': { x: -26.3, y: 48.5 },
        'pliegue-subescapular': { x: -3.4, y: 45.5 },
        'pliegue-antebrazo': { x: -29.6, y: 59.7 },
        'pliegue-supraespinal': { x: -15.4, y: 57.8 },
        'pliegue-cresta-iliaca': { x: -16.2, y: 57.8 },
        'pliegue-abdominal': { x: -7.5, y: 60.4 },
      },
    },
    TREN_INFERIOR: {
      archivo: 'hombre-tren-inferior.png',
      anchoPx: 900,
      altoPx: 1350,
      bytes: 560625,
      sha256: '3944303bc544382ffd1918cf888c33222d27f4efc7ccd64d576308d622e4ad93',
      cuerpo: { arriba: 4.49, alto: 91.6, centroX: 50, ancho: 53.22 },
      perimetros: {
        'perimetro-abdomen': { x: -0.4, y: 5.5, ancho: 41.6 },
        'perimetro-cadera': { x: -0.6, y: 20, ancho: 50.1 },
        'perimetro-muslo': { x: -13.5, y: 33, ancho: 25.1 },
        'perimetro-pantorrilla': { x: -15.6, y: 63.5, ancho: 20.1 },
        'perimetro-tobillo': { x: -14.9, y: 82.8, ancho: 10.5 },
      },
      pliegues: {
        'pliegue-supraespinal': { x: -17.4, y: 1 },
        'pliegue-cresta-iliaca': { x: -18.7, y: 1 },
        'pliegue-abdominal': { x: -6.4, y: 4.4 },
        'pliegue-muslo-frontal': { x: -13.7, y: 29.9 },
        'pliegue-pantorrilla': { x: -7.7, y: 63.5 },
      },
    },
  },
  MUJER: {
    ENTERO: {
      archivo: 'mujer-entero.png',
      anchoPx: 900,
      altoPx: 1350,
      bytes: 366147,
      sha256: '9e4c220918fb0cdbd9d4963c4bc3aefd87ee2fc79ace7bc1981a859bd4acd581',
      cuerpo: { arriba: 2.86, alto: 91.54, centroX: 49.8, ancho: 40.14 },
      perimetros: {
        'perimetro-cuello': { x: 0.2, y: 15.5, ancho: 10.2 },
        'perimetro-hombros': { x: -0.1, y: 20.4, ancho: 30.9 },
        'perimetro-pecho': { x: -0.1, y: 27.1, ancho: 20.7 },
        'perimetro-brazo-relajado': { x: -12.7, y: 27.9, ancho: 6.6 },
        'perimetro-brazo-flexionado': { x: -12.9, y: 28.6, ancho: 6.3 },
        'perimetro-antebrazo': { x: -14.9, y: 35.4, ancho: 8.3 },
        'perimetro-muneca': { x: -17.8, y: 44.2, ancho: 4.1 },
        'perimetro-cintura': { x: -0.1, y: 33.2, ancho: 17.9 },
        'perimetro-abdomen': { x: -0.1, y: 37.4, ancho: 22.8 },
        'perimetro-cadera': { x: -0.3, y: 45.3, ancho: 29.4 },
        'perimetro-muslo': { x: -6.9, y: 54.1, ancho: 13.4 },
        'perimetro-pantorrilla': { x: -7.1, y: 74.4, ancho: 10.1 },
        'perimetro-tobillo': { x: -6.6, y: 85.8, ancho: 6 },
      },
      pliegues: {
        'pliegue-pectoral': { x: -9.7, y: 23 },
        'pliegue-axilar-media': { x: -9.5, y: 25.7 },
        'pliegue-triceps': { x: -13, y: 27.3 },
        'pliegue-biceps': { x: -12.4, y: 27.3 },
        'pliegue-subescapular': { x: -2.7, y: 28.3 },
        'pliegue-antebrazo': { x: -15, y: 35.9 },
        'pliegue-supraespinal': { x: -7.6, y: 36.2 },
        'pliegue-cresta-iliaca': { x: -9.1, y: 36.2 },
        'pliegue-abdominal': { x: -3.2, y: 38.6 },
        'pliegue-muslo-frontal': { x: -7.3, y: 53.2 },
        'pliegue-pantorrilla': { x: -4.1, y: 74.4 },
      },
    },
    TREN_SUPERIOR: {
      archivo: 'mujer-tren-superior.png',
      anchoPx: 900,
      altoPx: 1350,
      bytes: 620017,
      sha256: '96053167cd67c1cecc95fbf187889159be78e9f29a5071752b788626b3e1e9a0',
      cuerpo: { arriba: 5.27, alto: 83.53, centroX: 50, ancho: 62.99 },
      perimetros: {
        'perimetro-cuello': { x: 0, y: 25.5, ancho: 16.5 },
        'perimetro-hombros': { x: 0.2, y: 33.8, ancho: 53.3 },
        'perimetro-pecho': { x: -0.1, y: 45.5, ancho: 32.7 },
        'perimetro-brazo-relajado': { x: -20.7, y: 44.2, ancho: 10.2 },
        'perimetro-brazo-flexionado': { x: -20.8, y: 45.5, ancho: 10.6 },
        'perimetro-antebrazo': { x: -24.4, y: 58.2, ancho: 12 },
        'perimetro-muneca': { x: -28.2, y: 72.3, ancho: 8 },
        'perimetro-cintura': { x: 0.1, y: 54.7, ancho: 29.4 },
        'perimetro-abdomen': { x: -0.2, y: 61, ancho: 36.8 },
        'perimetro-cadera': { x: 0.1, y: 74, ancho: 47.3 },
      },
      pliegues: {
        'pliegue-pectoral': { x: -16.5, y: 38.8 },
        'pliegue-axilar-media': { x: -16.5, y: 43.1 },
        'pliegue-triceps': { x: -21.1, y: 45.5 },
        'pliegue-biceps': { x: -21.1, y: 45.5 },
        'pliegue-subescapular': { x: -4.1, y: 46.1 },
        'pliegue-antebrazo': { x: -24.3, y: 58.1 },
        'pliegue-supraespinal': { x: -13.1, y: 57.9 },
        'pliegue-cresta-iliaca': { x: -14.6, y: 57.9 },
        'pliegue-abdominal': { x: -6.6, y: 59.7 },
      },
    },
    TREN_INFERIOR: {
      archivo: 'mujer-tren-inferior.png',
      anchoPx: 900,
      altoPx: 1350,
      bytes: 504138,
      sha256: '41b36e8ee357f52bc650d6d1b51f95c9b81cc728fd3b77b0cb5148d2e375be8f',
      cuerpo: { arriba: 4.49, alto: 91.15, centroX: 50.1, ancho: 46 },
      perimetros: {
        'perimetro-abdomen': { x: -0.1, y: 5.6, ancho: 31.4 },
        'perimetro-cadera': { x: -0.2, y: 22.4, ancho: 46.7 },
        'perimetro-muslo': { x: -11.7, y: 34.8, ancho: 23.4 },
        'perimetro-pantorrilla': { x: -12.4, y: 64.6, ancho: 17.7 },
        'perimetro-tobillo': { x: -11.3, y: 83, ancho: 9.8 },
      },
      pliegues: {
        'pliegue-supraespinal': { x: -13.7, y: 7.7 },
        'pliegue-cresta-iliaca': { x: -14.6, y: 7.7 },
        'pliegue-abdominal': { x: -6, y: 9.2 },
        'pliegue-muslo-frontal': { x: -12.2, y: 34.2 },
        'pliegue-pantorrilla': { x: -6.1, y: 65 },
      },
    },
  },
};

// ─── Cómo se compone la lámina ──────────────────────────────────────────────────────────────────

/** El lienzo, en px (compositor: `SW` × `SH`). El PNG se exporta al doble (html2canvas con `scale: 2`): 2160 × 3840. */
export const LIENZO_DE_LA_LAMINA = { ancho: 1080, alto: 1920, escalaDeExportacion: 2 } as const;

/** La unidad que muestra cada familia en la lámina (compositor: `slide1`, `slide2`). */
export const UNIDAD_EN_LA_LAMINA = { perimetros: 'cm', pliegues: 'mm', diametros: 'cm' } as const;

/** Dónde se apoya la figura en la lámina: la caja del cuerpo (`FiguraDeLaLamina.cuerpo`) se lleva a este lugar. */
export interface EncuadreDeLaFiguraEnLaLamina {
  /** Alto, en px de la lámina, que ocupa la caja del cuerpo. */
  readonly altoDelCuerpo: number;
  /** X de la lámina donde cae el centro horizontal de la caja del cuerpo. */
  readonly centroX: number;
  /** Y de la lámina donde cae el borde superior de la caja del cuerpo. */
  readonly arriba: number;
  /** Si lleva el resplandor del piso bajo los pies. */
  readonly conPiso: boolean;
}

/** Modo Medición (compositor: `LAY`): la figura va a la derecha y las tarjetas, a la izquierda. */
export const ENCUADRE_EN_MEDICION: Readonly<Record<EncuadreDeLaLamina, EncuadreDeLaFiguraEnLaLamina>> = {
  ENTERO: { altoDelCuerpo: 1270, centroX: 840, arriba: 408, conPiso: true },
  TREN_SUPERIOR: { altoDelCuerpo: 1120, centroX: 875, arriba: 300, conPiso: false },
  TREN_INFERIOR: { altoDelCuerpo: 1300, centroX: 845, arriba: 360, conPiso: true },
};

/** Modo Serie (compositor: `SLAY`): la figura va centrada. No hay cuerpo entero: el compositor pasa a tren superior. */
export const ENCUADRE_EN_SERIE: Readonly<Record<Exclude<EncuadreDeLaLamina, 'ENTERO'>, EncuadreDeLaFiguraEnLaLamina>> = {
  TREN_SUPERIOR: { altoDelCuerpo: 820, centroX: 540, arriba: 560, conPiso: false },
  TREN_INFERIOR: { altoDelCuerpo: 1150, centroX: 540, arriba: 530, conPiso: true },
};

/** Las tarjetas de Circunferencias, en orden, con sus filas (compositor: `GR`). */
export const TARJETAS_DE_PERIMETROS: Readonly<Record<EncuadreDeLaLamina, readonly (readonly PerimetroDeLaLamina[])[]>> = {
  ENTERO: [
    ['perimetro-cuello', 'perimetro-hombros', 'perimetro-pecho'],
    ['perimetro-brazo-relajado', 'perimetro-brazo-flexionado', 'perimetro-antebrazo', 'perimetro-muneca'],
    ['perimetro-cintura', 'perimetro-abdomen', 'perimetro-cadera'],
    ['perimetro-muslo', 'perimetro-pantorrilla', 'perimetro-tobillo'],
  ],
  TREN_SUPERIOR: [
    ['perimetro-cuello', 'perimetro-hombros', 'perimetro-pecho'],
    ['perimetro-brazo-relajado', 'perimetro-brazo-flexionado', 'perimetro-antebrazo', 'perimetro-muneca'],
    ['perimetro-cintura', 'perimetro-abdomen', 'perimetro-cadera'],
  ],
  TREN_INFERIOR: [
    ['perimetro-abdomen', 'perimetro-cadera'],
    ['perimetro-muslo', 'perimetro-pantorrilla', 'perimetro-tobillo'],
  ],
};

/**
 * Las tarjetas de Pliegues, en orden, con sus filas (compositor: `GF`). DL-113 suma el bíceps a la tarjeta del brazo y
 * la cresta ilíaca a la de la cintura; adentro de cada tarjeta, las filas siguen la altura de sus sitios en las dos
 * figuras, para que las guías no se crucen.
 */
export const TARJETAS_DE_PLIEGUES: Readonly<Record<EncuadreDeLaLamina, readonly (readonly PliegueDeLaLamina[])[]>> = {
  ENTERO: [
    ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-biceps'],
    ['pliegue-subescapular', 'pliegue-antebrazo'],
    ['pliegue-cresta-iliaca', 'pliegue-supraespinal', 'pliegue-abdominal'],
    ['pliegue-muslo-frontal', 'pliegue-pantorrilla'],
  ],
  TREN_SUPERIOR: [
    ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-biceps'],
    ['pliegue-subescapular', 'pliegue-antebrazo'],
    ['pliegue-cresta-iliaca', 'pliegue-supraespinal', 'pliegue-abdominal'],
  ],
  TREN_INFERIOR: [
    ['pliegue-supraespinal', 'pliegue-cresta-iliaca', 'pliegue-abdominal'],
    ['pliegue-muslo-frontal', 'pliegue-pantorrilla'],
  ],
};

/**
 * Las tarjetas de Medición, apiladas a la izquierda (compositor: `panelHTML`). Cada tarjeta mide
 * `filas · altoDeFila + 2 · relleno` y arranca centrada en la altura media de sus sitios; `apilarTarjetas` las separa
 * entre `tope` y `piso`. Cada fila tira una guía: sale de (`izquierda + ancho + inicioDeLaGuia`, centro de la fila), va
 * horizontal hasta `izquierda + ancho + quiebreDeLaGuia` y sigue recta hasta el sitio, que es el borde izquierdo del
 * anillo menos `margenAlAnillo`, o `margenAlPunto` a la izquierda del punto. El punto de la guía va en su inicio.
 */
export const TARJETAS_EN_MEDICION = {
  izquierda: 44,
  ancho: 418,
  altoDeFila: 62,
  relleno: 10,
  separacion: 26,
  tope: 250,
  piso: 1650,
  margenLateralDeLaFila: 26,
  inicioDeLaGuia: 14,
  quiebreDeLaGuia: 54,
  margenAlAnillo: 10,
  margenAlPunto: 16,
} as const;

/**
 * Las tarjetas de Serie, en dos columnas a los lados de la figura centrada (compositor: `serieSlide`, `layoutSide`;
 * reparto con `repartirEnDosColumnas`). Todas las de una columna miden `altoDeTarjetaEnSerie(n)`. La guía sale del borde
 * de la tarjeta que mira a la figura, `bajadaDeLaGuia` px debajo de su borde superior, corre `tramoHorizontal` px hacia
 * la figura y sigue recta hasta el sitio: el borde del anillo de ese lado más `margenAlAnillo`, o `margenAlPunto` desde
 * el punto. El punto de la guía va en el sitio.
 */
export const TARJETAS_EN_SERIE = {
  ancho: 284,
  xIzquierda: 34,
  xDerecha: 762,
  tope: 486,
  piso: 1800,
  separacion: 18,
  altoMaximo: 348,
  bajadaDeLaGuia: 30,
  tramoHorizontal: 34,
  margenAlAnillo: 7,
  margenAlPunto: 15,
} as const;

/** Los diámetros óseos, en el orden del bloque del pie de Circunferencias (compositor: `BONES`). */
export const DIAMETROS_DE_LA_LAMINA: readonly DiametroDeLaLamina[] = ['diametro-humero', 'diametro-biestiloideo', 'diametro-femur'];

/** El bloque «DIÁMETROS ÓSEOS» (compositor: `slide1`): título y tres tarjetas en fila, una por diámetro. */
export const BLOQUE_DE_DIAMETROS = { titulo: 'DIÁMETROS ÓSEOS', tituloX: 48, tituloY: 1684, x: 44, paso: 334, y: 1712, ancho: 314, alto: 82 } as const;

/**
 * El pie de Pliegues (compositor: `slide2`): una tarjeta con tres columnas. «SITIOS» cuenta los pliegues dibujados en el
 * encuadre (9, 7 o 4), no los del método; «SUMA 7 PLIEGUES» es un dato cargado: el compositor no la calcula.
 */
export const PIE_DE_PLIEGUES = {
  x: 44,
  y: 1706,
  ancho: 992,
  alto: 92,
  columnas: ['MÉTODO', 'SITIOS', 'SUMA 7 PLIEGUES'],
  metodo: 'Jackson-Pollock 7',
} as const;

// ─── Cómo se dibujan anillos, puntos y guías ───────────────────────────────────────────────────

/**
 * Los colores del dibujo de la figura en cada tema (compositor: `PAL`; entre paréntesis, su nombre allá). `null` es
 * «este tema no tiene esa capa». `PAL` trae además `backDash`, `dotHalo` y `dotMid`, que el compositor no usa, y `gHalo`,
 * que vale 0 en los tres temas: no están acá. Los colores de textos y medidores van en el documento.
 */
export interface ColoresDeLaFigura {
  /** (`ringA`) El resplandor del anillo y el halo de los puntos. */
  readonly anilloResplandor: string;
  /** (`ringB`) El trazo fino del anillo debajo de la figura y su mitad trasera punteada. */
  readonly anilloTrazo: string;
  /** (`ringCore`) La mitad delantera del anillo, encima de la figura. */
  readonly anilloNucleo: string;
  /** (`under`) Trazo oscuro debajo del anillo para despegarlo de la figura: solo en el tema oscuro. */
  readonly anilloSombra: string | null;
  /** (`gA`) Opacidad del resplandor ancho. */
  readonly opacidadResplandorAncho: number;
  /** (`gB`) Opacidad del resplandor angosto. */
  readonly opacidadResplandorAngosto: number;
  /** (`lead`) La línea guía. */
  readonly guia: string;
  /** (`leadDot`) El punto de la línea guía. */
  readonly guiaPunto: string;
  /** (`dotRing`) El aro del punto de pliegue. */
  readonly puntoAro: string;
  /** (`dotCore`) El centro del punto de pliegue. */
  readonly puntoCentro: string;
  /** (`dotFill`) El relleno del aro: solo en el tema claro. */
  readonly puntoRelleno: string | null;
  /** (`post`) La guía, el aro punteado y el centro de un pliegue posterior. */
  readonly posterior: string;
  /** (`postBack`) El disco que asienta el contorno de un pliegue posterior: oscuro y azul. */
  readonly posteriorFondo: string | null;
  /** (`grid`, `gridOp`) La grilla del piso, con su opacidad base. */
  readonly grilla: string;
  readonly opacidadGrilla: number;
}

export const COLORES_DE_LA_FIGURA: Readonly<Record<TemaDeLaLamina, ColoresDeLaFigura>> = {
  CLARO: {
    anilloResplandor: '#00C4EE',
    anilloTrazo: '#00B8E0',
    anilloNucleo: '#00C8F0',
    anilloSombra: null,
    opacidadResplandorAncho: 0.1,
    opacidadResplandorAngosto: 0.17,
    guia: 'rgba(30,107,242,.5)',
    guiaPunto: '#1E6BF2',
    puntoAro: '#00A8D8',
    puntoCentro: '#00A8D8',
    puntoRelleno: '#FFFFFF',
    posterior: '#94A3B8',
    posteriorFondo: null,
    grilla: '#1E6BF2',
    opacidadGrilla: 0.26,
  },
  OSCURO: {
    anilloResplandor: '#78E1FA',
    anilloTrazo: '#A8EAFC',
    anilloNucleo: '#C4F0FF',
    anilloSombra: 'rgba(8,27,60,.55)',
    opacidadResplandorAncho: 0.13,
    opacidadResplandorAngosto: 0.2,
    guia: 'rgba(150,222,246,.58)',
    guiaPunto: 'rgba(150,222,246,.9)',
    puntoAro: '#EAFBFF',
    puntoCentro: '#EAFBFF',
    puntoRelleno: null,
    posterior: 'rgba(214,232,250,.92)',
    posteriorFondo: 'rgba(8,27,60,.32)',
    grilla: '#7FD8F2',
    opacidadGrilla: 0.34,
  },
  AZUL: {
    anilloResplandor: '#00C4EE',
    anilloTrazo: '#22D3F5',
    anilloNucleo: '#00C8F0',
    anilloSombra: null,
    opacidadResplandorAncho: 0.13,
    opacidadResplandorAngosto: 0.21,
    guia: 'rgba(200,235,255,.62)',
    guiaPunto: '#CFEEFF',
    puntoAro: '#FFFFFF',
    puntoCentro: '#FFFFFF',
    puntoRelleno: null,
    posterior: 'rgba(224,240,255,.95)',
    posteriorFondo: 'rgba(8,34,84,.22)',
    grilla: '#CFEBFF',
    opacidadGrilla: 0.3,
  },
};

/** Los colores de la paleta que usa una capa del dibujo de un sitio. */
export type ColorDeCapa =
  | 'anilloResplandor'
  | 'anilloTrazo'
  | 'anilloNucleo'
  | 'anilloSombra'
  | 'puntoAro'
  | 'puntoCentro'
  | 'puntoRelleno'
  | 'posterior'
  | 'posteriorFondo';

/**
 * Una capa del dibujo de un sitio, en px de la lámina. Si el color de la capa es `null` en el tema (por ejemplo
 * `anilloSombra` fuera del oscuro), la capa no se dibuja.
 */
export interface CapaDelDibujo {
  readonly color: ColorDeCapa;
  /** Trazo de ese grosor; sin `grosor`, la capa es un relleno. */
  readonly grosor?: number;
  /** Puntos: el radio del círculo. */
  readonly radio?: number;
  /** Anillos: qué parte de la elipse. La delantera es la mitad de abajo (ángulos de 0 a π); la trasera, la de arriba. */
  readonly tramo?: 'COMPLETO' | 'DELANTERO' | 'TRASERO';
  /** Opacidad fija, o la del resplandor del tema (ancho: `gA`; angosto: `gB`) más un ajuste. */
  readonly opacidad: number | { readonly resplandor: 'ANCHO' | 'ANGOSTO'; readonly mas: number };
  /** Si el tema tiene `anilloSombra`, esta opacidad reemplaza a `opacidad`. */
  readonly opacidadConSombra?: number;
  /** Guiones del trazo: largo del trazo y del hueco. */
  readonly guiones?: readonly [number, number];
}

/** El dibujo de un sitio: lo que va debajo de la imagen (el cuerpo lo tapa; asoma por los bordes) y lo que va encima. */
export interface DibujoDeUnSitio {
  readonly debajo: readonly CapaDelDibujo[];
  readonly encima: readonly CapaDelDibujo[];
}

/** Modo Medición (compositor: `slide1` para anillos; `slide2` para pliegues). Capas de abajo hacia arriba. */
export const DIBUJO_EN_MEDICION: { readonly anillo: DibujoDeUnSitio; readonly pliegue: DibujoDeUnSitio; readonly plieguePosterior: DibujoDeUnSitio } = {
  anillo: {
    debajo: [
      { color: 'anilloResplandor', tramo: 'COMPLETO', grosor: 10, opacidad: { resplandor: 'ANCHO', mas: 0 } },
      { color: 'anilloResplandor', tramo: 'COMPLETO', grosor: 5, opacidad: { resplandor: 'ANGOSTO', mas: 0 } },
      { color: 'anilloSombra', tramo: 'COMPLETO', grosor: 4.6, opacidad: 0.7 },
      { color: 'anilloTrazo', tramo: 'COMPLETO', grosor: 2.4, opacidad: 0.92 },
    ],
    encima: [
      { color: 'anilloTrazo', tramo: 'TRASERO', grosor: 2.2, opacidad: 0.3, opacidadConSombra: 0.45, guiones: [4, 5] },
      { color: 'anilloResplandor', tramo: 'DELANTERO', grosor: 11, opacidad: { resplandor: 'ANCHO', mas: 0.02 } },
      { color: 'anilloResplandor', tramo: 'DELANTERO', grosor: 6, opacidad: { resplandor: 'ANGOSTO', mas: 0.06 } },
      { color: 'anilloSombra', tramo: 'DELANTERO', grosor: 6.8, opacidad: 1 },
      { color: 'anilloNucleo', tramo: 'DELANTERO', grosor: 3.4, opacidad: 1 },
    ],
  },
  pliegue: {
    debajo: [],
    encima: [
      { color: 'anilloResplandor', radio: 17, opacidad: 0.14 },
      { color: 'anilloResplandor', radio: 10, opacidad: 0.2 },
      { color: 'puntoRelleno', radio: 7.5, opacidad: 1 },
      { color: 'puntoAro', radio: 7.5, grosor: 2.2, opacidad: 1 },
      { color: 'puntoCentro', radio: 3, opacidad: 1 },
    ],
  },
  plieguePosterior: {
    debajo: [
      { color: 'anilloResplandor', radio: 15, opacidad: 0.2 },
      { color: 'puntoAro', radio: 7.5, grosor: 2.2, opacidad: 1 },
      { color: 'puntoCentro', radio: 3, opacidad: 1 },
    ],
    encima: [
      { color: 'posteriorFondo', radio: 12.5, opacidad: 1 },
      { color: 'posterior', radio: 7.5, grosor: 2, opacidad: 1, guiones: [3, 3.4] },
      { color: 'posterior', radio: 2.2, opacidad: 1 },
    ],
  },
};

/** Modo Serie (compositor: `serieSlide`): el mismo dibujo, más liviano y sin resplandor en los anillos. */
export const DIBUJO_EN_SERIE: { readonly anillo: DibujoDeUnSitio; readonly pliegue: DibujoDeUnSitio; readonly plieguePosterior: DibujoDeUnSitio } = {
  anillo: {
    debajo: [{ color: 'anilloTrazo', tramo: 'TRASERO', grosor: 2, opacidad: 0.32, opacidadConSombra: 0.45, guiones: [4, 5] }],
    encima: [
      { color: 'anilloSombra', tramo: 'DELANTERO', grosor: 5.6, opacidad: 1 },
      { color: 'anilloNucleo', tramo: 'DELANTERO', grosor: 2.8, opacidad: 1 },
    ],
  },
  pliegue: {
    debajo: [],
    encima: [
      { color: 'anilloResplandor', radio: 15, opacidad: 0.14 },
      { color: 'anilloResplandor', radio: 9, opacidad: 0.2 },
      { color: 'puntoRelleno', radio: 6.5, opacidad: 1 },
      { color: 'puntoAro', radio: 6.5, grosor: 2, opacidad: 1 },
      { color: 'puntoCentro', radio: 2.6, opacidad: 1 },
    ],
  },
  plieguePosterior: {
    debajo: [
      { color: 'anilloResplandor', radio: 13, opacidad: 0.2 },
      { color: 'puntoAro', radio: 6.5, grosor: 2, opacidad: 1 },
    ],
    encima: [
      { color: 'posteriorFondo', radio: 11, opacidad: 1 },
      { color: 'posterior', radio: 6.5, grosor: 2, opacidad: 1, guiones: [3, 3.4] },
      { color: 'posterior', radio: 2, opacidad: 1 },
    ],
  },
};

/** El trazo de la línea guía y de su punto (compositor: `panelHTML` en Medición, `serieSlide` en Serie). */
export interface TrazoDeLaGuia {
  readonly color: 'guia' | 'posterior';
  readonly colorDelPunto: 'guiaPunto' | 'posterior';
  readonly grosor: number;
  readonly guiones: readonly [number, number];
  readonly radioDelPunto: number;
}

export const GUIA_EN_MEDICION: { readonly normal: TrazoDeLaGuia; readonly posterior: TrazoDeLaGuia } = {
  normal: { color: 'guia', colorDelPunto: 'guiaPunto', grosor: 1.8, guiones: [8, 7], radioDelPunto: 3.6 },
  posterior: { color: 'posterior', colorDelPunto: 'posterior', grosor: 1.5, guiones: [3, 5], radioDelPunto: 3 },
};

export const GUIA_EN_SERIE: { readonly normal: TrazoDeLaGuia; readonly posterior: TrazoDeLaGuia } = {
  normal: { color: 'guia', colorDelPunto: 'guiaPunto', grosor: 1.8, guiones: [8, 7], radioDelPunto: 3 },
  posterior: { color: 'posterior', colorDelPunto: 'posterior', grosor: 1.8, guiones: [3, 5], radioDelPunto: 3 },
};

// ─── Geometría: las mismas cuentas del compositor ───────────────────────────────────────────────

export interface RectanguloEnLaLamina {
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
}

export interface ElipseEnLaLamina {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
}

export interface PuntoEnLaLamina {
  readonly cx: number;
  readonly cy: number;
}

/** El alto de un anillo respecto de su ancho (compositor: `ringG`, ry = rx · 0,17). */
export const ACHATAMIENTO_DEL_ANILLO = 0.17;

/**
 * Dónde y de qué tamaño va la imagen en la lámina (compositor: `figGeom` en Medición, `serieGeom` en Serie): se escala
 * para que la caja del cuerpo mida `altoDelCuerpo` y se corre para que su borde superior caiga en `arriba` y su centro
 * horizontal en `centroX`.
 */
export function ubicarFiguraEnLaLamina(
  figura: Pick<FiguraDeLaLamina, 'anchoPx' | 'altoPx' | 'cuerpo'>,
  encuadre: EncuadreDeLaFiguraEnLaLamina,
): RectanguloEnLaLamina {
  const escala = encuadre.altoDelCuerpo / ((figura.altoPx * figura.cuerpo.alto) / 100);
  const ancho = figura.anchoPx * escala;
  const alto = figura.altoPx * escala;
  return { x: encuadre.centroX - (figura.cuerpo.centroX / 100) * ancho, y: encuadre.arriba - (figura.cuerpo.arriba / 100) * alto, ancho, alto };
}

/** El anillo de un perímetro en px de la lámina (compositor: `ringG`): centro y semiejes de la elipse. */
export function anilloEnLaLamina(imagen: RectanguloEnLaLamina, sitio: SitioDePerimetroEnLaFigura): ElipseEnLaLamina {
  const rx = (imagen.ancho * sitio.ancho) / 200;
  return { cx: imagen.x + imagen.ancho * (0.5 + sitio.x / 100), cy: imagen.y + (imagen.alto * sitio.y) / 100, rx, ry: rx * ACHATAMIENTO_DEL_ANILLO };
}

/** El punto de un pliegue en px de la lámina (compositor: `dotG`). */
export function puntoEnLaLamina(imagen: RectanguloEnLaLamina, sitio: SitioDePliegueEnLaFigura): PuntoEnLaLamina {
  return { cx: imagen.x + imagen.ancho * (0.5 + sitio.x / 100), cy: imagen.y + (imagen.alto * sitio.y) / 100 };
}

/**
 * Apila tarjetas en una columna sin que se pisen (compositor: `panelHTML` en Medición y `layoutSide` en Serie). Cada una
 * arranca centrada en `centroDeseado` (en Medición, la altura media de sus sitios); en orden de altura, se empujan hacia
 * abajo para dejar `separacion` entre ellas, sin pasar de `tope`; si la última se pasa de `piso`, se suben desde abajo
 * —la última y, mientras no quede hueco, las anteriores— y al final ninguna queda arriba de `tope`. Devuelve el borde
 * superior de cada tarjeta, en el orden en que llegaron.
 *
 * `orden` dice qué altura ordena la pila:
 * - `BORDE`, la del borde de arriba deseado, es la del compositor; la usa la lámina del website.
 * - `CENTRO`, la de `centroDeseado`, es la de la figura del teléfono. Ahí la figura es unas tres veces más chica frente
 *   al alto de las filas, y ordenar por el borde ponía una tarjeta alta (cresta ilíaca, supraespinal y abdominal) antes
 *   que una baja cuyos sitios están más arriba (subescapular y antebrazo). Sus guías se cruzaban y pasaban sobre otros
 *   puntos. Ordenar por el centro deja las tarjetas en el orden de sus sitios, sin mover ningún punto (DL-113, regla de
 *   Dirección del 2026-10-02).
 */
export function apilarTarjetas(
  tarjetas: readonly { readonly alto: number; readonly centroDeseado: number }[],
  limites: { readonly tope: number; readonly piso: number; readonly separacion: number },
  orden: 'BORDE' | 'CENTRO' = 'BORDE',
): number[] {
  const pila = tarjetas.map((t, indice) => ({ indice, alto: t.alto, centro: t.centroDeseado, y: t.centroDeseado - t.alto / 2 }));
  pila.sort((a, b) => (orden === 'CENTRO' ? a.centro - b.centro : a.y - b.y));
  pila.forEach((t, i) => {
    const anterior = pila[i - 1];
    t.y = Math.max(t.y, anterior ? anterior.y + anterior.alto + limites.separacion : limites.tope);
  });
  const ultima = pila[pila.length - 1];
  const exceso = ultima ? ultima.y + ultima.alto - limites.piso : 0;
  if (exceso > 0) {
    for (let i = pila.length - 1; i >= 0; i--) {
      const t = pila[i];
      t.y -= exceso;
      const anterior = pila[i - 1];
      if (anterior && t.y - (anterior.y + anterior.alto + limites.separacion) >= 0) break;
    }
  }
  const bordes = new Array<number>(tarjetas.length);
  for (const t of pila) bordes[t.indice] = Math.max(limites.tope, t.y);
  return bordes;
}

/** El alto de cada tarjeta de una columna de Serie con `cantidad` tarjetas (compositor: `serieSlide`). */
export function altoDeTarjetaEnSerie(cantidad: number): number {
  const { tope, piso, separacion, altoMaximo } = TARJETAS_EN_SERIE;
  return Math.min(altoMaximo, Math.floor((piso - tope - (cantidad - 1) * separacion) / cantidad));
}

/**
 * En Serie, los sitios se reparten en dos columnas por su posición lateral en la figura (compositor: `serieSlide`): los
 * más a la izquierda —los del brazo— van a la columna izquierda, que se lleva la mitad redondeada para arriba; cada
 * columna queda ordenada por altura. `x` puede ser la del compositor o la de la lámina: el orden es el mismo.
 */
export function repartirEnDosColumnas<T extends { readonly x: number; readonly y: number }>(
  sitios: readonly T[],
): { readonly izquierda: T[]; readonly derecha: T[] } {
  const porLado = [...sitios].sort((a, b) => a.x - b.x || a.y - b.y);
  const enLaIzquierda = Math.ceil(porLado.length / 2);
  return {
    izquierda: porLado.slice(0, enLaIzquierda).sort((a, b) => a.y - b.y),
    derecha: porLado.slice(enLaIzquierda).sort((a, b) => a.y - b.y),
  };
}
