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
export const LETRA = { rotulo: 12, valor: 15, detalle: 12, ficha: 12 } as const;
export const INTERLINEA = { rotulo: 16, valor: 20 } as const;

/** Medidas fijas del dibujo, en dp. */
const RELLENO = 6;
const SEPARACION = 8;
const MARGEN = 10;
const PADDING_DE_TARJETA = 8;
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

export interface EntradaDeLaComposicion {
  /** El ancho disponible, en dp. */
  readonly ancho: number;
  readonly sexo: SexoDeLaLamina;
  readonly familia: FamiliaDeLaFigura;
  readonly medidas: readonly MedidaDeLaToma[];
  /** La escala de letra del sistema (`useWindowDimensions().fontScale`). */
  readonly escalaDeLetra: number;
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

  const enTarjetas = escala < ESCALA_DESDE_LA_QUE_VAN_NUMEROS ? componer('TARJETAS') : null;
  return enTarjetas ?? componer('NUMEROS');

  function componer(modo: ModoDeLaFigura): ComposicionDeLaFigura | null {
    // El cuerpo, a la derecha. Con tarjetas ocupa algo menos de la mitad del ancho (compositor: `figGeom`, `LAY`); con
    // números, la columna es angosta y el cuerpo crece.
    const anchoDelCuerpo = ancho * (modo === 'TARJETAS' ? 0.46 : 0.62);
    const anchoDeImagen = anchoDelCuerpo / (figura.cuerpo.ancho / 100);
    const altoDeImagen = (anchoDeImagen * figura.altoPx) / figura.anchoPx;
    const altoDelCuerpo = (altoDeImagen * figura.cuerpo.alto) / 100;
    const centroX = ancho - anchoDelCuerpo / 2 - 4;
    // La figura se centra en el alto final; acá se ubica con un desplazamiento provisorio y se corrige al final.
    const ubicar = (desplazamiento: number): RectanguloEnLaLamina => ({
      x: centroX - (figura.cuerpo.centroX / 100) * anchoDeImagen,
      y: MARGEN + desplazamiento - (figura.cuerpo.arriba / 100) * altoDeImagen,
      ancho: anchoDeImagen,
      alto: altoDeImagen,
    });

    let n = 0;
    const sitiosEn = (imagen: RectanguloEnLaLamina) =>
      claves.map((grupo) =>
        grupo.map((clave): SitioDeLaFigura => {
          const medida = porClave.get(clave)!;
          const base = { medida, clave, numero: 0, rotulo: rotuloDelSitio(clave), valor: cantidad(medida.actual.punto.value, medida.actual.punto.unit), diferencia: diferenciaDe(medida) };
          if (familia === 'PERIMETROS') {
            const a = anilloEnLaLamina(imagen, figura.perimetros[clave as keyof typeof figura.perimetros]!);
            return { ...base, cx: a.cx, cy: a.cy, izquierda: a.cx - a.rx, anillo: { rx: a.rx, ry: Math.max(a.ry, 3) }, posterior: false };
          }
          const p = puntoEnLaLamina(imagen, figura.pliegues[clave as keyof typeof figura.pliegues]!);
          return { ...base, cx: p.cx, cy: p.cy, izquierda: p.cx - 7, anillo: null, posterior: esPliegueDeLaCaraPosterior(clave) };
        }),
      );
    const provisorios = sitiosEn(ubicar(0));
    const izquierdaMinima = Math.min(...provisorios.flat().map((s) => s.izquierda));

    // Las filas de cada tarjeta y su alto, según el modo.
    let anchoDeTarjeta: number;
    let ficha = 0;
    let altosDeFila: number[][];
    let lineas: (1 | 2)[][];
    if (modo === 'TARJETAS') {
      anchoDeTarjeta = Math.max(120, Math.min(ancho * 0.5, izquierdaMinima - CALLE));
      const util = anchoDeTarjeta - MARGEN / 2 - 2 * PADDING_DE_TARJETA;
      lineas = [];
      altosDeFila = [];
      for (const grupo of provisorios) {
        const l: (1 | 2)[] = [];
        const a: number[] = [];
        for (const s of grupo) {
          const rotulo = anchoEstimado(s.rotulo, LETRA.rotulo * escala);
          const valor = anchoEstimado(s.valor, LETRA.valor * escala, true) + (s.diferencia ? anchoEstimado(`  ${s.diferencia}`, LETRA.detalle * escala) : 0);
          // Si el valor no entra en una línea, o el rótulo pide más de dos, la figura va con números.
          if (valor > util || rotulo > 2 * util * 0.92) return null;
          const lineasDelRotulo = rotulo > util ? 2 : 1;
          l.push(lineasDelRotulo);
          a.push(Math.ceil((lineasDelRotulo * INTERLINEA.rotulo + INTERLINEA.valor) * escala) + 8);
        }
        lineas.push(l);
        altosDeFila.push(a);
      }
    } else {
      ficha = Math.round(24 * Math.min(escala, ESCALA_MAXIMA_DE_LA_FICHA));
      anchoDeTarjeta = MARGEN / 2 + ficha + 4;
      lineas = provisorios.map((g) => g.map(() => 1 as const));
      altosDeFila = provisorios.map((g) => g.map(() => ficha + 6));
    }

    // Con tarjetas, un grupo del compositor es una tarjeta. Con números, cada sitio es su propia ficha, para que cada
    // número quede lo más cerca posible de la altura de su sitio.
    const bloques = modo === 'TARJETAS' ? provisorios.map((g, i) => ({ grupo: g, altos: altosDeFila[i]!, lineas: lineas[i]! })) : provisorios.flat().map((s, i) => ({ grupo: [s], altos: [altosDeFila.flat()[i]!], lineas: [1 as const] }));
    const altosDeBloque = bloques.map((b) => b.altos.reduce((x, y) => x + y, 0) + (modo === 'TARJETAS' ? 2 * RELLENO : 0));
    const separacion = modo === 'TARJETAS' ? SEPARACION : 2;
    const necesario = altosDeBloque.reduce((a, b) => a + b, 0) + (bloques.length - 1) * separacion + 2 * MARGEN;
    const alto = Math.max(altoDelCuerpo + 2 * MARGEN, necesario);
    const desplazamiento = (alto - altoDelCuerpo - 2 * MARGEN) / 2;
    const imagen = ubicar(desplazamiento);
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
        const altoDeFila = bloques[i]!.altos[fila]!;
        const centro = y + altoDeFila / 2;
        y += altoDeFila;
        return { sitio, y: centro, alto: altoDeFila, lineasDelRotulo: bloques[i]!.lineas[fila]! };
      });
      return { x: MARGEN / 2, y: bordes[i]!, ancho: anchoDeTarjeta - MARGEN / 2, alto: altosDeBloque[i]!, filas };
    });

    const guias: GuiaDeLaFigura[] = tarjetas.flatMap((t) =>
      t.filas.map((f) => ({ clave: f.sitio.clave, desde: { x: anchoDeTarjeta + 2, y: f.y }, quiebre: anchoDeTarjeta + 10, hasta: { x: f.sitio.izquierda - 3, y: f.sitio.cy }, posterior: f.sitio.posterior })),
    );
    return { modo, ancho, alto, imagen, sitios, tarjetas, guias, ficha };
  }
}
