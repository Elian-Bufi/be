/**
 * La figura de la carga de una toma (WP-ESCRITORIO-AREAS, parte 9; maqueta 23): dónde van la imagen, cada sitio, cada
 * tarjeta con sus campos y cada guía. Es lógica pura, sin interfaz: la usa `figura-de-la-carga.tsx` y la prueba
 * `scripts/composicion-de-la-carga.test.mjs`.
 *
 * - **La figura es la de Dirección** (cuerpo entero: la misma de la Lámina y del teléfono) y los sitios son los que guarda
 *   BE (`FIGURAS_DE_LA_LAMINA`). Se ubican con `anilloEnLaLamina` y `puntoEnLaLamina` sobre la caja de la imagen: no se
 *   mueven nunca, aunque dos queden casi encimados (DL-113; regla de Dirección del 2026-10-02).
 * - **Perímetros:** las tarjetas del compositor; las del tronco a la derecha de la figura y las del brazo y la pierna a la
 *   izquierda, para que ninguna guía cruce el cuerpo de más (criterio del primer paquete).
 * - **Pliegues:** los once sitios quedan del lado izquierdo de la imagen, que es el derecho de la persona. A la derecha
 *   van solo los dos que están junto a la línea media (subescapular y abdominal); los demás, a la izquierda. Es la
 *   propuesta «b» que se dibujó antes de programar (`EVIDENCIA/ESCRITORIO-AREAS/parte-9/antes-de-programar/`).
 * - **Dentro de cada tarjeta, los campos van en el orden decidido,** que sigue la altura de los sitios. Si con la figura
 *   elegida dos guías de una tarjeta se cruzaran, va el orden más parecido en el que ninguna se cruza (con el perfil
 *   completo no hace falta: el orden es el mismo en las dos figuras).
 * - **Las tarjetas de cada lado se apilan** con `apilarTarjetas`, cada una centrada en la altura media de sus sitios.
 * - Lo que el protocolo declara y no tiene sitio en la figura no va en la escena: va en «Fuera de la figura».
 *
 * La figura ubica, nunca califica: nada de este módulo conoce un valor (RF-048; INV-06-06).
 */
import {
  anilloEnLaLamina,
  apilarTarjetas,
  esPliegueDeLaCaraPosterior,
  FIGURAS_DE_LA_LAMINA,
  puntoEnLaLamina,
  TARJETAS_DE_PERIMETROS,
  type RectanguloEnLaLamina,
  type SexoDeLaLamina,
} from '@be/domain';

export type FamiliaDeLaCarga = 'PERIMETROS' | 'PLIEGUES';
export type LadoDeLaTarjeta = 'IZQUIERDA' | 'DERECHA';

/** Las medidas de la escena, en px: las de la maqueta 23. */
export const ESCENA_DE_LA_CARGA = {
  alto: 632,
  /** La imagen (900 × 1350) se muestra a 440 × 660, centrada, con su borde de arriba 12 px por encima de la escena. */
  imagen: { ancho: 440, alto: 660, arriba: -12 },
  tarjeta: { ancho: 292, relleno: 6, borde: 1 },
  fila: 48,
  /** Entre dos tarjetas de la misma columna. */
  separacion: 12,
  /** Lo que queda libre arriba y abajo de cada columna de tarjetas. */
  margen: 8,
  /** El tramo horizontal con que la guía sale de su campo. */
  quiebre: 16,
  margenAlAnillo: 5,
  margenAlPunto: 4,
  radioDelPunto: 7.5,
  /** Con menos ancho, las tarjetas pisan los brazos de la figura: los campos van en lista, sin escena. */
  anchoMinimo: 832,
} as const;

/** En qué tarjeta y de qué lado va cada sitio, por familia. */
export const TARJETAS_DE_LA_CARGA: Readonly<Record<FamiliaDeLaCarga, Readonly<Record<LadoDeLaTarjeta, readonly (readonly string[])[]>>>> = {
  PERIMETROS: {
    IZQUIERDA: [TARJETAS_DE_PERIMETROS.ENTERO[1]!, TARJETAS_DE_PERIMETROS.ENTERO[3]!],
    DERECHA: [TARJETAS_DE_PERIMETROS.ENTERO[0]!, TARJETAS_DE_PERIMETROS.ENTERO[2]!],
  },
  PLIEGUES: {
    IZQUIERDA: [
      ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-biceps'],
      ['pliegue-antebrazo', 'pliegue-cresta-iliaca', 'pliegue-supraespinal'],
      ['pliegue-muslo-frontal', 'pliegue-pantorrilla'],
    ],
    DERECHA: [['pliegue-subescapular', 'pliegue-abdominal']],
  },
};

export interface SitioEnLaEscena {
  readonly clave: string;
  readonly forma: 'ANILLO' | 'PUNTO';
  readonly cx: number;
  readonly cy: number;
  /** Los semiejes del anillo de un perímetro; en un pliegue, el radio del punto. */
  readonly rx: number;
  readonly ry: number;
  /** Un pliegue de la cara de atrás: la figura está de frente. */
  readonly posterior: boolean;
}

export interface FilaEnLaEscena {
  readonly clave: string;
  /** Desde el borde de arriba de su tarjeta. */
  readonly arriba: number;
  readonly alto: number;
}

export interface TarjetaEnLaEscena {
  readonly lado: LadoDeLaTarjeta;
  readonly x: number;
  readonly arriba: number;
  readonly ancho: number;
  readonly alto: number;
  readonly filas: readonly FilaEnLaEscena[];
}

/** La guía de un campo: sale del borde de su tarjeta, corre un tramo horizontal y va recta hasta el borde del sitio. */
export interface GuiaEnLaEscena {
  readonly clave: string;
  readonly desde: { readonly x: number; readonly y: number };
  readonly quiebre: { readonly x: number; readonly y: number };
  readonly hasta: { readonly x: number; readonly y: number };
  readonly posterior: boolean;
}

export interface ComposicionDeLaCarga {
  readonly ancho: number;
  readonly alto: number;
  readonly imagen: RectanguloEnLaLamina;
  readonly archivo: string;
  readonly sitios: readonly SitioEnLaEscena[];
  /** En el orden del documento: el del protocolo, por la primera medición de cada tarjeta. */
  readonly tarjetas: readonly TarjetaEnLaEscena[];
  readonly guias: readonly GuiaEnLaEscena[];
}

const figuraDe = (sexo: SexoDeLaLamina) => FIGURAS_DE_LA_LAMINA[sexo].ENTERO;

/** Las claves que tienen sitio en la figura, en cualquiera de las dos familias (las dos figuras tienen los mismos). */
export function clavesConSitio(sexo: SexoDeLaLamina): ReadonlySet<string> {
  const f = figuraDe(sexo);
  return new Set([...Object.keys(f.perimetros), ...Object.keys(f.pliegues)]);
}

/** De las claves del protocolo, las de una familia que tienen sitio en la figura, en el orden del protocolo. */
export function clavesDeLaFamilia(sexo: SexoDeLaLamina, familia: FamiliaDeLaCarga, claves: readonly string[]): string[] {
  const f = figuraDe(sexo);
  const sitios: Readonly<Record<string, unknown>> = familia === 'PERIMETROS' ? f.perimetros : f.pliegues;
  return claves.filter((c) => c in sitios);
}

/** La caja de la imagen en la escena: centrada en el ancho, con el alto de la maqueta. */
export function imagenEnLaEscena(ancho: number): RectanguloEnLaLamina {
  const { imagen } = ESCENA_DE_LA_CARGA;
  return { x: (ancho - imagen.ancho) / 2, y: imagen.arriba, ancho: imagen.ancho, alto: imagen.alto };
}

/** Dónde va cada sitio de la familia, sobre la caja de la imagen: las cuentas de la lámina, sin mover ninguno. */
export function sitiosEnLaEscena(sexo: SexoDeLaLamina, familia: FamiliaDeLaCarga, claves: readonly string[], ancho: number): SitioEnLaEscena[] {
  const f = figuraDe(sexo);
  const imagen = imagenEnLaEscena(ancho);
  return clavesDeLaFamilia(sexo, familia, claves).map((clave) => {
    if (familia === 'PERIMETROS') {
      const a = anilloEnLaLamina(imagen, f.perimetros[clave as keyof typeof f.perimetros]!);
      return { clave, forma: 'ANILLO' as const, cx: a.cx, cy: a.cy, rx: a.rx, ry: a.ry, posterior: false };
    }
    const p = puntoEnLaLamina(imagen, f.pliegues[clave as keyof typeof f.pliegues]!);
    const r = ESCENA_DE_LA_CARGA.radioDelPunto;
    return { clave, forma: 'PUNTO' as const, cx: p.cx, cy: p.cy, rx: r, ry: r, posterior: esPliegueDeLaCaraPosterior(clave) };
  });
}

/** Hasta dónde llega la guía: el borde del sitio que mira a la tarjeta, con un margen. */
function bordeDelSitio(s: SitioEnLaEscena, lado: LadoDeLaTarjeta): number {
  const margen = s.forma === 'ANILLO' ? ESCENA_DE_LA_CARGA.margenAlAnillo : ESCENA_DE_LA_CARGA.margenAlPunto;
  return lado === 'IZQUIERDA' ? s.cx - s.rx - margen : s.cx + s.rx + margen;
}

/**
 * La escena entera para una familia y una figura.
 * @param claves las del protocolo elegido, en su orden (de todas las familias: se toman las que tienen sitio).
 * @param ancho el de la escena, en px; con menos de `anchoMinimo` la pantalla no la dibuja.
 * @param altosDeFilas el alto real de cada fila, si no es el de siempre (una fila con su error abajo crece).
 * @param pie lo que ocupa, abajo a la derecha, la leyenda de la figura: las tarjetas de ese lado no bajan hasta ahí.
 */
export function componerLaCarga(entrada: {
  readonly sexo: SexoDeLaLamina;
  readonly familia: FamiliaDeLaCarga;
  readonly claves: readonly string[];
  readonly ancho: number;
  readonly altosDeFilas?: Readonly<Record<string, number>>;
  readonly pie?: number;
}): ComposicionDeLaCarga {
  const E = ESCENA_DE_LA_CARGA;
  const { sexo, familia, ancho } = entrada;
  const sitios = sitiosEnLaEscena(sexo, familia, entrada.claves, ancho);
  const porClave = new Map(sitios.map((s) => [s.clave, s]));
  const orden = new Map(entrada.claves.map((c, i) => [c, i]));
  const altoDe = (clave: string) => entrada.altosDeFilas?.[clave] ?? E.fila;
  const marco = E.tarjeta.relleno + E.tarjeta.borde;

  const tarjetas: TarjetaEnLaEscena[] = [];
  const guias: GuiaEnLaEscena[] = [];
  for (const lado of ['IZQUIERDA', 'DERECHA'] as const) {
    // Las tarjetas de este lado con los sitios que el protocolo declara; una tarjeta sin ninguno no se dibuja.
    const grupos = TARJETAS_DE_LA_CARGA[familia][lado].map((g) => g.map((c) => porClave.get(c)).filter((s): s is SitioEnLaEscena => s !== undefined)).filter((g) => g.length > 0);
    const altos = grupos.map((g) => g.reduce((t, s) => t + altoDe(s.clave), 0) + 2 * marco);
    const centros = grupos.map((g) => g.reduce((t, s) => t + s.cy, 0) / g.length);
    const piso = E.alto - E.margen - (lado === 'DERECHA' ? (entrada.pie ?? 0) : 0);
    const bordes = apilarTarjetas(
      grupos.map((_, i) => ({ alto: altos[i]!, centroDeseado: centros[i]! })),
      { tope: E.margen, piso, separacion: E.separacion },
      'CENTRO',
    );
    const x = lado === 'IZQUIERDA' ? 0 : ancho - E.tarjeta.ancho;
    const borde = lado === 'IZQUIERDA' ? x + E.tarjeta.ancho : x;
    grupos.forEach((grupo, i) => {
      const arriba = bordes[i]!;
      /** Las filas y sus guías, con los sitios en un orden dado. La guía sale a la altura del campo (la primera línea de la
       *  fila), aunque la fila crezca con su error abajo. */
      const armar = (orden: readonly SitioEnLaEscena[]) => {
        let y = marco;
        return orden.map((s) => {
          const fila: FilaEnLaEscena = { clave: s.clave, arriba: y, alto: altoDe(s.clave) };
          const salida = arriba + y + E.fila / 2;
          const quiebre = lado === 'IZQUIERDA' ? borde + E.quiebre : borde - E.quiebre;
          const guia: GuiaEnLaEscena = { clave: s.clave, desde: { x: borde, y: salida }, quiebre: { x: quiebre, y: salida }, hasta: { x: bordeDelSitio(s, lado), y: s.cy }, posterior: s.posterior };
          y += fila.alto;
          return { fila, guia };
        });
      };
      // El orden del compositor, que sigue la altura de los sitios; si con la figura elegida dos guías de la tarjeta se
      // cruzan (los sitios casi a la misma altura y las filas lejos de ella), el orden más parecido en que ninguna se
      // cruza. Los sitios no se mueven: cambia en qué fila va cada campo.
      const elegido = ordenesPorParecido(grupo).map(armar).find((filas) => !hayCruces(filas.map((f) => f.guia))) ?? armar(grupo);
      guias.push(...elegido.map((f) => f.guia));
      tarjetas.push({ lado, x, arriba, ancho: E.tarjeta.ancho, alto: altos[i]!, filas: elegido.map((f) => f.fila) });
    });
  }
  // El orden del documento —el del foco y el del lector de pantalla— es el del protocolo: cada tarjeta va donde está la
  // primera de sus mediciones. Con el «Perfil antropométrico completo», en perímetros es el del protocolo exacto.
  const primera = (t: TarjetaEnLaEscena) => Math.min(...t.filas.map((f) => orden.get(f.clave) ?? Number.MAX_SAFE_INTEGER));
  tarjetas.sort((a, b) => primera(a) - primera(b));
  return { ancho, alto: E.alto, imagen: imagenEnLaEscena(ancho), archivo: figuraDe(sexo).archivo, sitios, tarjetas, guias };
}

/** Todos los órdenes de una tarjeta (tiene hasta cuatro filas), del más parecido al dado al menos parecido. */
function ordenesPorParecido<T>(dado: readonly T[]): T[][] {
  const todas = (xs: readonly T[]): T[][] => (xs.length <= 1 ? [[...xs]] : xs.flatMap((x, i) => todas([...xs.slice(0, i), ...xs.slice(i + 1)]).map((resto) => [x, ...resto])));
  const posicion = new Map(dado.map((x, i) => [x, i]));
  const inversiones = (orden: readonly T[]) => orden.reduce((t, x, i) => t + orden.slice(i + 1).filter((y) => posicion.get(y)! < posicion.get(x)!).length, 0);
  return todas(dado)
    .map((orden, i) => ({ orden, i, n: inversiones(orden) }))
    .sort((a, b) => a.n - b.n || a.i - b.i)
    .map((x) => x.orden);
}

/** Si dos tramos se cortan en un punto que no es un extremo. */
function seCortan(p1: Punto, p2: Punto, p3: Punto, p4: Punto): boolean {
  const o = (a: Punto, b: Punto, q: Punto) => Math.sign((b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x));
  return o(p1, p2, p3) * o(p1, p2, p4) < 0 && o(p3, p4, p1) * o(p3, p4, p2) < 0;
}
type Punto = { readonly x: number; readonly y: number };
const tramosDe = (g: GuiaEnLaEscena): [Punto, Punto][] => [
  [g.desde, g.quiebre],
  [g.quiebre, g.hasta],
];

/** Si alguna guía cruza a otra. */
export function hayCruces(guias: readonly GuiaEnLaEscena[]): boolean {
  return guias.some((a, i) => guias.slice(i + 1).some((b) => tramosDe(a).some(([p1, p2]) => tramosDe(b).some(([p3, p4]) => seCortan(p1, p2, p3, p4)))));
}

/** El trazo SVG de una guía. */
export const trazoDeLaGuia = (g: GuiaEnLaEscena): string =>
  `M${g.desde.x.toFixed(1)} ${g.desde.y.toFixed(1)}H${g.quiebre.x.toFixed(1)}L${g.hasta.x.toFixed(1)} ${g.hasta.y.toFixed(1)}`;

/** La mitad de adelante (abajo) o la de atrás (arriba) de un anillo, como arco SVG. */
export function arcoDelAnillo(s: SitioEnLaEscena, mitad: 'DELANTERA' | 'TRASERA'): string {
  const barrido = mitad === 'DELANTERA' ? 0 : 1;
  return `M${(s.cx - s.rx).toFixed(1)} ${s.cy.toFixed(1)}A${s.rx.toFixed(1)} ${s.ry.toFixed(1)} 0 0 ${barrido} ${(s.cx + s.rx).toFixed(1)} ${s.cy.toFixed(1)}`;
}
