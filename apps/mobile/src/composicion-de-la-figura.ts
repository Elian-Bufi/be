/**
 * La composición de la figura de la toma en el teléfono (DL-111): dónde van el cuerpo, cada sitio, cada tarjeta con sus
 * filas y cada guía. Es lógica pura, sin React: la usan el componente (`pantallas/figura-de-la-toma.tsx`) y la maqueta del
 * navegador, que así dibuja exactamente lo mismo que la APK.
 *
 * Dos modos. En la prueba de la 0.13.1, con la letra al máximo, los rótulos se cortaban y el texto de la figura no crecía
 * con el resto (Dirección, 2026-10-03).
 * - **TARJETAS.** Las tarjetas del compositor a la izquierda, una fila por sitio con su rótulo, su valor y la diferencia,
 *   unida a su sitio por una guía. Se usa cuando todo el texto entra con la letra que eligió la persona. El rótulo puede
 *   ocupar dos líneas, y cada fila mide lo que necesita.
 * - **NUMEROS.** Si el texto no entra, cada sitio lleva un número en una columna angosta, unido por su guía. Los valores
 *   van debajo de la figura, en una lista con los mismos números que crece con la letra sin tope. El cuerpo queda más
 *   grande, porque las tarjetas ya no ocupan la mitad del ancho.
 *
 * Los sitios no se mueven nunca (DL-113): cambian las tarjetas, las guías y el tamaño del cuerpo. El orden de las
 * tarjetas y de sus filas es el del compositor, y el apilado es por el centro de sus sitios (`apilarTarjetas`).
 *
 * **Mapa corporal** (DL-118, Dirección 2026-10-05). Las filas llevan el nombre y el valor de la toma: el mapa responde
 * «¿cuáles son mis medidas más recientes?». Los gráficos chicos por orden de toma que llevaban las filas desde el cierre
 * del 2026-10-04 se retiraron: el progreso va en la vista Progreso, con fechas reales y la figura de cada zona
 * (`componerLaFiguraDeZona`, al final de este módulo).
 *
 * **Encuadre** (pulido del 2026-10-04, `ENCUADRE`). El cuerpo es grande, va a la derecha y lo recorta el borde derecho de
 * la lámina. Ahí no hay sitios: se mide del lado derecho de la persona, que en la figura de frente queda a la izquierda,
 * y los anillos del tronco tienen su centro en el eje del cuerpo, que queda a la vista. El tamaño sale del ancho de la
 * lámina y de los sitios posibles de la familia, no de cuántas medidas tiene la toma, y el cuerpo empieza arriba: sumar
 * medidas alarga las tarjetas hacia abajo, pero no achica el cuerpo ni deja un hueco encima. Figura, anillos, puntos,
 * guías y zonas de toque salen del mismo rectángulo de la imagen: la misma escala y el mismo desplazamiento.
 *
 * **Filas.** Todas tienen la misma forma: el nombre a la izquierda y el valor a la derecha, en la misma línea si entran
 * o, si el nombre es largo, el valor en la línea de abajo, siempre contra el borde derecho; y al final, la diferencia a la
 * izquierda y el gráfico a la derecha. Así los valores forman una columna y la última línea es igual en todas.
 *
 * El ancho de un texto se estima por la cantidad de letras, con un ancho medio holgado para Roboto. Si la estimación se
 * pasa, la fila queda más alta o la figura pasa a números, nunca se corta.
 */
import {
  anilloEnLaLamina,
  apilarTarjetas,
  cantidad,
  esPliegueDeLaCaraPosterior,
  FIGURAS_DE_LA_LAMINA,
  numero,
  puntoEnLaLamina,
  ROTULO_EN_LA_LAMINA,
  TARJETAS_DE_PERIMETROS,
  TARJETAS_DE_PLIEGUES,
  type ClaveDeLaLamina,
  type MedidaDeLaToma,
  type RectanguloEnLaLamina,
  type SexoDeLaLamina,
} from '@be/domain';

export type FamiliaDeLaFigura = 'PERIMETROS' | 'PLIEGUES';
export type ModoDeLaFigura = 'TARJETAS' | 'NUMEROS';

/** Tamaños de letra de la figura en sp, antes de la escala de la persona, y sus interlineados. */
export const LETRA = { rotulo: 13, valor: 15, detalle: 12, ficha: 12 } as const;
export const INTERLINEA = { rotulo: 17, valor: 20, detalle: 16 } as const;

/**
 * El encuadre del cuerpo en la lámina del teléfono (pulido del 2026-10-04): grande, a la derecha y recortado por el borde
 * derecho, donde no hay sitios. Ver el comentario del módulo.
 */
export const ENCUADRE = {
  /** El ancho de la imagen de la lámina, en veces el ancho de la lámina en el teléfono. */
  anchoDeLaImagen: 1.44,
  /** Cuánto se ve a la derecha del eje del cuerpo, en fracción del ancho de la imagen: lo demás queda fuera del borde. */
  aLaDerechaDelEje: 0.13,
  /** El ancho mínimo de una tarjeta: si no entra a la izquierda de los sitios, el cuerpo se achica lo justo. */
  anchoMinimoDeTarjeta: 132,
} as const;
/** El radio del punto de un pliegue con su halo, en dp: su dibujo entero queda a la vista. */
const RADIO_DEL_PUNTO = 7;
/** Lo que separa el nombre del valor cuando van en la misma línea. */
const SEPARACION_EN_LA_FILA = 6;
/** Cuánto más ancho es el rótulo en peso 500 que la estimación común de `anchoEstimado`. */
const PESO_DEL_ROTULO = 1.08;

/** Medidas fijas del dibujo, en dp. */
const RELLENO = 6;
/**
 * El alto mínimo de una fila de tarjeta: es un objetivo táctil, y la regla de la APK es 48 dp (guía de UX §5). Con la
 * letra normal y un rótulo de una línea, el texto pide 44: la fila crece hasta 48, sin agrandar la letra.
 */
export const ALTO_MINIMO_DE_FILA = 48;
/** Cuánto se aleja un toque del dibujo de un sitio y lo sigue eligiendo: 24 dp alrededor, un objetivo de 48 dp. */
export const RADIO_DE_TOQUE = 24;
/** Si otro sitio queda a menos de esta diferencia de distancia, el toque no elige: sería adivinar. Elige la fila. */
export const MARGEN_DE_AMBIGUEDAD = 8;
const SEPARACION = 8;
const MARGEN = 10;
const PADDING_DE_TARJETA = 8;
/**
 * Lo que la tarjeta y la fila quitan al ancho del texto: el relleno (8) y el borde (1) de la tarjeta de cada lado, y la
 * fila, que se corre 6 hacia afuera y tiene 5 de relleno y 1 de borde. Es el ancho del gráfico chico de la fila.
 */
const BORDES_DE_LA_FILA = 2 * (PADDING_DE_TARJETA + 1) - 2 * 6 + 2 * (5 + 1);
/** Lo que queda entre las tarjetas y el sitio más a la izquierda: ahí doblan las guías, fuera del cuerpo. */
const CALLE = 28;
/** Desde esta escala de letra, las tarjetas laterales ya no entran bien en un teléfono: la figura pasa a números. */
export const ESCALA_DESDE_LA_QUE_VAN_NUMEROS = 1.3;
/** La ficha numerada crece con la letra hasta este tope; el número completo se repite en la lista, que no tiene tope. */
const ESCALA_MAXIMA_DE_LA_FICHA = 1.6;

export interface SitioDeLaFigura {
  readonly medida: MedidaDeLaToma;
  readonly clave: ClaveDeLaLamina;
  /** El número del sitio en el modo NUMEROS y en su lista, en el orden de las tarjetas del compositor. */
  readonly numero: number;
  readonly rotulo: string;
  readonly valor: string;
  /** La diferencia con la toma anterior comparable, con su signo; `null` si no hay. */
  readonly diferencia: string | null;
  readonly cx: number;
  readonly cy: number;
  /** El borde izquierdo del dibujo del sitio: el anillo o el punto. */
  readonly izquierda: number;
  readonly anillo: { readonly rx: number; readonly ry: number } | null;
  readonly posterior: boolean;
}

export interface FilaDeLaTarjeta {
  readonly sitio: SitioDeLaFigura;
  /** El centro vertical de la fila, donde llega la guía. */
  readonly y: number;
  readonly alto: number;
  readonly lineasDelRotulo: 1 | 2;
  /** Si el nombre y el valor van en la misma línea; si no, el valor va en la de abajo. La diferencia, si la hay, al final. */
  readonly enLinea: boolean;
}

export interface TarjetaDeLaFigura {
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
  readonly filas: readonly FilaDeLaTarjeta[];
}

export interface GuiaDeLaFigura {
  readonly clave: ClaveDeLaLamina;
  readonly desde: { readonly x: number; readonly y: number };
  readonly quiebre: number;
  readonly hasta: { readonly x: number; readonly y: number };
  readonly posterior: boolean;
}

export interface ComposicionDeLaFigura {
  readonly modo: ModoDeLaFigura;
  readonly ancho: number;
  readonly alto: number;
  readonly imagen: RectanguloEnLaLamina;
  /** En el orden de las tarjetas: es el de los números. */
  readonly sitios: readonly SitioDeLaFigura[];
  /** En NUMEROS, cada tarjeta es la ficha redonda de un número. */
  readonly tarjetas: readonly TarjetaDeLaFigura[];
  readonly guias: readonly GuiaDeLaFigura[];
  /** El diámetro de la ficha numerada (solo NUMEROS). */
  readonly ficha: number;
}

/** El ancho estimado de un texto en dp: letras por un ancho medio holgado de Roboto (más ancho en negrita). */
export function anchoEstimado(texto: string, tamano: number, negrita = false): number {
  return texto.length * tamano * (negrita ? 0.6 : 0.56);
}

/** El rótulo de un sitio en la figura: el del compositor y, en la cara posterior, «· posterior». */
export const rotuloDelSitio = (clave: ClaveDeLaLamina): string => `${ROTULO_EN_LA_LAMINA[clave]}${esPliegueDeLaCaraPosterior(clave) ? ' · posterior' : ''}`;

function diferenciaDe(m: MedidaDeLaToma): string | null {
  if (!m.diferencia) return null;
  const d = m.diferencia.delta;
  return `${d < 0 ? '−' : d > 0 ? '+' : ''}${numero(Math.abs(d))}`;
}

interface DisposicionDeLaFila {
  readonly enLinea: boolean;
  readonly lineasDelRotulo: 1 | 2;
  readonly alto: number;
}

/**
 * Cómo va una fila de tarjeta, o `null` si su texto no entra (la figura pasa a números). `util` es el ancho estimado
 * para el texto y `contenido`, el ancho exacto de la fila.
 */
function disponerFila(s: SitioDeLaFigura, util: number, contenido: number, escala: number): DisposicionDeLaFila | null {
  const rotulo = anchoEstimado(s.rotulo, LETRA.rotulo * escala);
  const valor = anchoEstimado(s.valor, LETRA.valor * escala, true);
  const diferencia = s.diferencia ? anchoEstimado(s.diferencia, LETRA.detalle * escala) : 0;
  if (valor + (diferencia ? SEPARACION_EN_LA_FILA + diferencia : 0) > util || rotulo > 2 * util * 0.92) return null;
  // En línea solo si entran con holgura en el ancho exacto de la fila: el nombre va en peso 500, más ancho que la
  // estimación común. Si no, se apilan: el nombre nunca se corta con «…».
  const enLinea = rotulo * PESO_DEL_ROTULO + SEPARACION_EN_LA_FILA + valor <= contenido - 2;
  const lineasDelRotulo: 1 | 2 = !enLinea && rotulo > util ? 2 : 1;
  let lineas = (enLinea ? INTERLINEA.valor : lineasDelRotulo * INTERLINEA.rotulo + INTERLINEA.valor) * escala;
  // La última línea, si la composición pide la diferencia.
  if (diferencia) lineas += INTERLINEA.detalle * escala;
  return { enLinea, lineasDelRotulo, alto: Math.max(ALTO_MINIMO_DE_FILA, Math.ceil(lineas) + 8) };
}

export interface EntradaDeLaComposicion {
  /** El ancho disponible, en dp. */
  readonly ancho: number;
  readonly sexo: SexoDeLaLamina;
  readonly familia: FamiliaDeLaFigura;
  readonly medidas: readonly MedidaDeLaToma[];
  /** La escala de letra del sistema (`useWindowDimensions().fontScale`). */
  readonly escalaDeLetra: number;
  /**
   * Si cada fila lleva la diferencia con el anterior comparable (por omisión, sí). El mapa corporal de DL-118 muestra
   * solo el nombre y el valor: la diferencia y el progreso aparecen al tocar.
   */
  readonly diferencias?: boolean;
}

/**
 * La familia que se dibuja: la elegida, si la toma la tiene; si no, la otra. Con el selector de tomas (DL-117), la
 * elección sobrevive al cambio de toma, y una toma con una sola familia dejaba la silueta vacía.
 */
export function familiaQueSeVe(elegida: FamiliaDeLaFigura, hayPerimetros: boolean, hayPliegues: boolean): FamiliaDeLaFigura {
  if (elegida === 'PERIMETROS') return hayPerimetros ? 'PERIMETROS' : 'PLIEGUES';
  return hayPliegues ? 'PLIEGUES' : 'PERIMETROS';
}

export function componerLaFigura(entrada: EntradaDeLaComposicion): ComposicionDeLaFigura | null {
  const { ancho, sexo, familia, medidas } = entrada;
  const escala = Math.max(1, entrada.escalaDeLetra);
  const figura = FIGURAS_DE_LA_LAMINA[sexo].ENTERO;
  const porClave = new Map(medidas.map((m) => [m.metrica, m]));
  const lugares = (familia === 'PERIMETROS' ? figura.perimetros : figura.pliegues) as Readonly<Record<string, unknown>>;
  const claves = (familia === 'PERIMETROS' ? TARJETAS_DE_PERIMETROS.ENTERO : TARJETAS_DE_PLIEGUES.ENTERO)
    .map((grupo) => grupo.filter((clave) => porClave.has(clave) && lugares[clave] !== undefined))
    .filter((grupo) => grupo.length > 0);
  if (claves.length === 0) return null;

  let ficha = 0;
  const enTarjetas = escala < ESCALA_DESDE_LA_QUE_VAN_NUMEROS ? componer('TARJETAS') : null;
  return enTarjetas ?? componer('NUMEROS');

  function componer(modo: ModoDeLaFigura): ComposicionDeLaFigura | null {
    // El cuerpo, grande y a la derecha, recortado por el borde derecho (`ENCUADRE`). Su tamaño no depende de cuántas
    // medidas hay: el borde izquierdo se calcula con todos los sitios posibles de la familia.
    ficha = modo === 'NUMEROS' ? Math.round(24 * Math.min(escala, ESCALA_MAXIMA_DE_LA_FICHA)) : 0;
    const columna = modo === 'TARJETAS' ? ENCUADRE.anchoMinimoDeTarjeta : MARGEN / 2 + ficha + 4;
    const relativos = Object.values(lugares as Readonly<Record<string, { x: number; ancho?: number }>>).map((l) => l.x / 100 - (familia === 'PERIMETROS' ? (l.ancho ?? 0) / 200 : 0));
    const aLaIzquierda = -Math.min(...relativos);
    const punto = familia === 'PLIEGUES' ? RADIO_DEL_PUNTO : 0;
    // Si la columna de la izquierda no entra con el cuerpo al tamaño buscado, el cuerpo se achica lo justo.
    const tope = (ancho - columna - CALLE - punto) / (ENCUADRE.aLaDerechaDelEje + aLaIzquierda);
    const anchoDeImagen = Math.min(ancho * ENCUADRE.anchoDeLaImagen, tope);
    const altoDeImagen = (anchoDeImagen * figura.altoPx) / figura.anchoPx;
    const altoDelCuerpo = (altoDeImagen * figura.cuerpo.alto) / 100;
    const eje = ancho - ENCUADRE.aLaDerechaDelEje * anchoDeImagen;
    // El cuerpo empieza arriba, en el margen, sin importar el alto de las tarjetas.
    const imagenFija: RectanguloEnLaLamina = { x: eje - anchoDeImagen / 2, y: MARGEN - (figura.cuerpo.arriba / 100) * altoDeImagen, ancho: anchoDeImagen, alto: altoDeImagen };
    const izquierdaDeLaFamilia = eje - aLaIzquierda * anchoDeImagen - punto;
    const ubicar = (): RectanguloEnLaLamina => imagenFija;

    let n = 0;
    const sitiosEn = (imagen: RectanguloEnLaLamina) =>
      claves.map((grupo) =>
        grupo.map((clave): SitioDeLaFigura => {
          const medida = porClave.get(clave)!;
          const base = { medida, clave, numero: 0, rotulo: rotuloDelSitio(clave), valor: cantidad(medida.actual.punto.value, medida.actual.punto.unit), diferencia: entrada.diferencias === false ? null : diferenciaDe(medida) };
          if (familia === 'PERIMETROS') {
            const a = anilloEnLaLamina(imagen, figura.perimetros[clave as keyof typeof figura.perimetros]!);
            return { ...base, cx: a.cx, cy: a.cy, izquierda: a.cx - a.rx, anillo: { rx: a.rx, ry: Math.max(a.ry, 3) }, posterior: false };
          }
          const p = puntoEnLaLamina(imagen, figura.pliegues[clave as keyof typeof figura.pliegues]!);
          return { ...base, cx: p.cx, cy: p.cy, izquierda: p.cx - 7, anillo: null, posterior: esPliegueDeLaCaraPosterior(clave) };
        }),
      );
    const provisorios = sitiosEn(ubicar());

    // Las filas de cada tarjeta y su alto, según el modo.
    let anchoDeTarjeta: number;
    let disposiciones: DisposicionDeLaFila[][];
    if (modo === 'TARJETAS') {
      anchoDeTarjeta = Math.min(ancho * 0.56, izquierdaDeLaFamilia - CALLE);
      const util = anchoDeTarjeta - MARGEN / 2 - 2 * PADDING_DE_TARJETA;
      const contenido = anchoDeTarjeta - MARGEN / 2 - BORDES_DE_LA_FILA;
      disposiciones = [];
      for (const grupo of provisorios) {
        const filas: DisposicionDeLaFila[] = [];
        for (const sitio of grupo) {
          const d = disponerFila(sitio, util, contenido, escala);
          if (!d) return null;
          filas.push(d);
        }
        disposiciones.push(filas);
      }
    } else {
      anchoDeTarjeta = columna;
      disposiciones = provisorios.map((g) => g.map(() => ({ enLinea: false, lineasDelRotulo: 1 as const, alto: ficha + 6 })));
    }

    // Con tarjetas, un grupo del compositor es una tarjeta. Con números, cada sitio es su propia ficha, para que cada
    // número quede lo más cerca posible de la altura de su sitio.
    const bloques = modo === 'TARJETAS' ? provisorios.map((g, i) => ({ grupo: g, filas: disposiciones[i]! })) : provisorios.flat().map((s, i) => ({ grupo: [s], filas: [disposiciones.flat()[i]!] }));
    const altosDeBloque = bloques.map((b) => b.filas.reduce((x, y) => x + y.alto, 0) + (modo === 'TARJETAS' ? 2 * RELLENO : 0));
    const separacion = modo === 'TARJETAS' ? SEPARACION : 2;
    const necesario = altosDeBloque.reduce((a, b) => a + b, 0) + (bloques.length - 1) * separacion + 2 * MARGEN;
    const alto = Math.max(altoDelCuerpo + 2 * MARGEN, necesario);
    const imagen = ubicar();
    const enSuLugar = new Map(sitiosEn(imagen).flat().map((s) => [s.clave, s]));
    const ubicados = bloques.map((b) => b.grupo.map((s) => enSuLugar.get(s.clave)!));

    const bordes = apilarTarjetas(
      ubicados.map((g, i) => ({ alto: altosDeBloque[i]!, centroDeseado: g.reduce((t, s) => t + s.cy, 0) / g.length })),
      { tope: MARGEN, piso: alto - MARGEN, separacion },
      'CENTRO',
    );

    // Los números: con tarjetas, en el orden de las tarjetas del compositor; con números, en el de la columna, de arriba
    // hacia abajo, para que la columna y la lista de abajo se lean 1, 2, 3…
    const orden = modo === 'TARJETAS' ? ubicados.map((_, i) => i) : ubicados.map((_, i) => i).sort((a, b) => bordes[a]! - bordes[b]! || a - b);
    const numeros = new Map<ClaveDeLaLamina, number>();
    for (const i of orden) for (const sitio of ubicados[i]!) numeros.set(sitio.clave, ++n);
    const bloquesFinales = ubicados.map((g) => g.map((sitio) => ({ ...sitio, numero: numeros.get(sitio.clave)! })));
    const sitios = bloquesFinales.flat().sort((a, b) => a.numero - b.numero);

    const tarjetas: TarjetaDeLaFigura[] = bloquesFinales.map((g, i) => {
      let y = bordes[i]! + (modo === 'TARJETAS' ? RELLENO : 0);
      const filas = g.map((sitio, fila): FilaDeLaTarjeta => {
        const d = bloques[i]!.filas[fila]!;
        const centro = y + d.alto / 2;
        y += d.alto;
        return { sitio, y: centro, alto: d.alto, lineasDelRotulo: d.lineasDelRotulo, enLinea: d.enLinea };
      });
      return { x: MARGEN / 2, y: bordes[i]!, ancho: anchoDeTarjeta - MARGEN / 2, alto: altosDeBloque[i]!, filas };
    });

    const guias: GuiaDeLaFigura[] = tarjetas.flatMap((t) =>
      t.filas.map((f) => ({ clave: f.sitio.clave, desde: { x: anchoDeTarjeta + 2, y: f.y }, quiebre: anchoDeTarjeta + 10, hasta: { x: f.sitio.izquierda - 3, y: f.sitio.cy }, posterior: f.sitio.posterior })),
    );
    return { modo, ancho, alto, imagen, sitios, tarjetas, guias, ficha };
  }
}

/**
 * La distancia de un toque al dibujo de un sitio. Para un pliegue, al punto. Para un perímetro, al eje del anillo: los
 * anillos son elipses planas que cruzan el cuerpo, y se miden como el segmento de su eje mayor. Así, tocar el centro de
 * un anillo lo elige aunque otro anillo pase cerca, y dos anillos solo quedan parejos si de verdad coinciden.
 */
export function distanciaAlSitio(sitio: Pick<SitioDeLaFigura, 'cx' | 'cy' | 'anillo'>, x: number, y: number): number {
  if (!sitio.anillo) return Math.hypot(x - sitio.cx, y - sitio.cy);
  const { rx, ry } = sitio.anillo;
  if (rx >= ry) return Math.hypot(Math.max(0, Math.abs(x - sitio.cx) - rx), y - sitio.cy);
  return Math.hypot(x - sitio.cx, Math.max(0, Math.abs(y - sitio.cy) - ry));
}

export type ToqueEnLaFigura = { readonly tipo: 'sitio'; readonly clave: ClaveDeLaLamina } | { readonly tipo: 'ambiguo'; readonly claves: readonly ClaveDeLaLamina[] } | null;

/**
 * Qué elige un toque en la figura. Cada sitio responde hasta 24 dp de su dibujo, un objetivo de 48 dp, sin agrandar lo
 * que se ve. Si otro sitio queda casi a la misma distancia (menos de 8 dp de diferencia), el toque no elige ninguno:
 * sería adivinar. La pantalla lo dice, y la fila de cada sitio elige sin ambigüedad. Pasa, por ejemplo, con el bíceps
 * y el tríceps, que de frente quedan casi en el mismo lugar.
 */
export function sitioTocado(sitios: readonly Pick<SitioDeLaFigura, 'clave' | 'cx' | 'cy' | 'anillo'>[], x: number, y: number): ToqueEnLaFigura {
  const todos = sitios.map((sitio) => ({ sitio, distancia: distanciaAlSitio(sitio, x, y) })).sort((a, b) => a.distancia - b.distancia);
  const masCerca = todos[0];
  if (!masCerca || masCerca.distancia > RADIO_DE_TOQUE) return null;
  // La ventaja se exige contra todos: un sitio apenas fuera de su radio también vuelve dudoso el toque.
  const parejos = todos.filter((c) => c.distancia - masCerca.distancia < MARGEN_DE_AMBIGUEDAD);
  return parejos.length === 1 ? { tipo: 'sitio', clave: masCerca.sitio.clave } : { tipo: 'ambiguo', claves: parejos.map((c) => c.sitio.clave) };
}

// ─── La figura de una zona, en Progreso (DL-118) ─────────────────────────────────────────────────────────────────────

export interface EntradaDeLaFiguraDeZona {
  /** El ancho disponible, en dp. */
  readonly ancho: number;
  readonly sexo: SexoDeLaLamina;
  readonly familia: FamiliaDeLaFigura;
  /** La figura del compositor de la zona: tren superior para el torso, tren inferior para las piernas. */
  readonly encuadre: 'TREN_SUPERIOR' | 'TREN_INFERIOR';
  /** Los sitios del panel que se numeran. */
  readonly claves: readonly ClaveDeLaLamina[];
  /** Todos los sitios con datos de la zona: fijan el tamaño y el lugar del cuerpo, iguales en los dos paneles. */
  readonly clavesDeLaZona: readonly ClaveDeLaLamina[];
  readonly escalaDeLetra: number;
  /** El alto máximo del cuerpo, en dp. */
  readonly altoMaximoDelCuerpo: number;
}

/** Un sitio de la figura de una zona: dónde se dibuja y su número, que es el de su tarjeta. */
export interface SitioDeLaZona {
  readonly clave: ClaveDeLaLamina;
  readonly numero: number;
  readonly rotulo: string;
  readonly cx: number;
  readonly cy: number;
  readonly izquierda: number;
  readonly anillo: { readonly rx: number; readonly ry: number } | null;
  readonly posterior: boolean;
}

export interface FiguraDeLaZona {
  readonly ancho: number;
  readonly alto: number;
  readonly imagen: RectanguloEnLaLamina;
  /** En el orden de los números: de arriba hacia abajo en la figura. */
  readonly sitios: readonly SitioDeLaZona[];
  /** El centro de la ficha de cada número, en la columna de la izquierda. */
  readonly fichas: readonly { readonly clave: ClaveDeLaLamina; readonly numero: number; readonly x: number; readonly y: number }[];
  readonly guias: readonly GuiaDeLaFigura[];
  /** El diámetro de la ficha. */
  readonly ficha: number;
}

/**
 * La figura de una zona: la del compositor para ese tren, con un número por sitio en una columna angosta a la izquierda,
 * unido por su guía, como la figura con números del mapa. Los valores y los gráficos van en las tarjetas, debajo.
 * - Figura, anillos, puntos, guías y zonas de toque salen del mismo rectángulo de la imagen. Ningún sitio se mueve.
 * - El tamaño sale del alto máximo y de todos los sitios de la zona, no del panel: pasar de un panel a otro no mueve el
 *   cuerpo.
 * - El cuerpo va centrado en el espacio libre, sin pasar el límite de recorte del mapa (`ENCUADRE.aLaDerechaDelEje`) y
 *   sin que el sitio más a la izquierda quede debajo de la columna de números.
 * - Los números van de arriba hacia abajo, en el orden de la altura de sus sitios.
 */
export function componerLaFiguraDeZona(e: EntradaDeLaFiguraDeZona): FiguraDeLaZona | null {
  const { ancho, familia } = e;
  const figura = FIGURAS_DE_LA_LAMINA[e.sexo][e.encuadre];
  const lugares = (familia === 'PERIMETROS' ? figura.perimetros : figura.pliegues) as Readonly<Record<string, { x: number; y: number; ancho?: number } | undefined>>;
  const claves = e.claves.filter((c) => lugares[c] !== undefined);
  const deLaZona = e.clavesDeLaZona.filter((c) => lugares[c] !== undefined);
  if (claves.length === 0 || deLaZona.length === 0 || ancho <= 0) return null;
  const escala = Math.max(1, e.escalaDeLetra);
  const ficha = Math.round(24 * Math.min(escala, ESCALA_MAXIMA_DE_LA_FICHA));
  const columna = MARGEN / 2 + ficha + 4;
  const punto = familia === 'PLIEGUES' ? RADIO_DEL_PUNTO : 0;
  const aLaIzquierda = Math.max(0, -Math.min(...deLaZona.map((c) => lugares[c]!.x / 100 - (familia === 'PERIMETROS' ? (lugares[c]!.ancho ?? 0) / 200 : 0))));
  const proporcion = figura.altoPx / figura.anchoPx;
  const porAlto = e.altoMaximoDelCuerpo / (proporcion * (figura.cuerpo.alto / 100));
  const porAncho = (ancho - columna - CALLE - punto) / (ENCUADRE.aLaDerechaDelEje + aLaIzquierda);
  const anchoDeImagen = Math.min(porAlto, porAncho, ancho * ENCUADRE.anchoDeLaImagen);
  const altoDeImagen = anchoDeImagen * proporcion;
  const altoDelCuerpo = (altoDeImagen * figura.cuerpo.alto) / 100;
  const libre = columna + CALLE + punto;
  // El eje de la imagen es su centro; la caja del cuerpo puede estar un poco corrida de él.
  const ejeCentrado = (libre + ancho) / 2 - ((figura.cuerpo.centroX - 50) / 100) * anchoDeImagen;
  const ejeMinimo = libre + aLaIzquierda * anchoDeImagen;
  const ejeMaximo = Math.max(ejeMinimo, ancho - ENCUADRE.aLaDerechaDelEje * anchoDeImagen);
  const eje = Math.min(Math.max(ejeCentrado, ejeMinimo), ejeMaximo);
  const imagen: RectanguloEnLaLamina = { x: eje - anchoDeImagen / 2, y: MARGEN - (figura.cuerpo.arriba / 100) * altoDeImagen, ancho: anchoDeImagen, alto: altoDeImagen };

  const ubicados = claves.map((clave) => {
    const base = { clave, rotulo: rotuloDelSitio(clave) };
    if (familia === 'PERIMETROS') {
      const a = anilloEnLaLamina(imagen, figura.perimetros[clave as keyof typeof figura.perimetros]!);
      return { ...base, cx: a.cx, cy: a.cy, izquierda: a.cx - a.rx, anillo: { rx: a.rx, ry: Math.max(a.ry, 3) }, posterior: false };
    }
    const p = puntoEnLaLamina(imagen, figura.pliegues[clave as keyof typeof figura.pliegues]!);
    return { ...base, cx: p.cx, cy: p.cy, izquierda: p.cx - RADIO_DEL_PUNTO, anillo: null, posterior: esPliegueDeLaCaraPosterior(clave) };
  });
  // De arriba hacia abajo; a la misma altura, en el orden del panel.
  const ordenados = ubicados.map((s, i) => ({ s, i })).sort((a, b) => a.s.cy - b.s.cy || a.i - b.i).map(({ s }, n) => ({ ...s, numero: n + 1 }));
  const separacion = 4;
  const alto = Math.max(altoDelCuerpo + 2 * MARGEN, ordenados.length * ficha + (ordenados.length - 1) * separacion + 2 * MARGEN);
  const bordes = apilarTarjetas(ordenados.map((s) => ({ alto: ficha, centroDeseado: s.cy })), { tope: MARGEN, piso: alto - MARGEN, separacion }, 'CENTRO');
  const fichas = ordenados.map((s, i) => ({ clave: s.clave, numero: s.numero, x: MARGEN / 2 + ficha / 2, y: bordes[i]! + ficha / 2 }));
  const guias: GuiaDeLaFigura[] = ordenados.map((s, i) => ({ clave: s.clave, desde: { x: MARGEN / 2 + ficha + 2, y: fichas[i]!.y }, quiebre: columna + 6, hasta: { x: s.izquierda - 3, y: s.cy }, posterior: s.posterior }));
  return { ancho, alto, imagen, sitios: ordenados, fichas, guias, ficha };
}

/**
 * El número de cada sitio de una zona: su orden de arriba hacia abajo en la figura del tren, el mismo que le da
 * `componerLaFiguraDeZona`. No depende del ancho ni de la letra: las tarjetas lo conocen antes de que la figura se mida.
 */
export function numerosDeLaZona(sexo: SexoDeLaLamina, familia: FamiliaDeLaFigura, encuadre: 'TREN_SUPERIOR' | 'TREN_INFERIOR', claves: readonly ClaveDeLaLamina[]): ReadonlyMap<ClaveDeLaLamina, number> {
  const figura = FIGURAS_DE_LA_LAMINA[sexo][encuadre];
  const lugares = (familia === 'PERIMETROS' ? figura.perimetros : figura.pliegues) as Readonly<Record<string, { y: number } | undefined>>;
  const ordenados = claves
    .filter((c) => lugares[c] !== undefined)
    .map((c, i) => ({ c, i, y: lugares[c]!.y }))
    .sort((a, b) => a.y - b.y || a.i - b.i);
  return new Map(ordenados.map((x, n) => [x.c, n + 1]));
}
