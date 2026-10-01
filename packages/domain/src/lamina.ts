/**
 * DL-111 · la lámina del compositor de Dirección armada con los datos registrados de BE (website del profesional).
 *
 * `figura-de-lamina.ts` trae la figura, los sitios y la geometría del compositor (`docs/direccion/BE-VIS-Compositor_v13.3.html`);
 * este módulo pone encima lo que necesita la lámina para mostrar **datos de BE**, sin pantalla de por medio:
 * - los colores de la lámina fuera del dibujo de la figura (fondo, tarjetas y textos de cada tema; compositor: el CSS de
 *   `.slide.light`, `.slide.dark` y `.slide.blue`, y `PAL`). Viven acá porque el website no escribe colores literales
 *   (`scripts/contraste.test.cjs`): son los del compositor, no tokens del website;
 * - los valores vigentes de una toma, la composición de cada lámina (Medición, Serie y Conclusiones) y las cuentas de
 *   los gráficos de Serie, con las mismas reglas del compositor (`panelHTML`, `serieSlide`, `chartSVG`).
 *
 * Tres diferencias con el compositor, todas por el legajo:
 * - **un sitio sin valor no se dibuja** (el compositor lo dibuja con «—»);
 * - **la diferencia entre tomas es una resta con signo, en un solo color**: el compositor la pinta de verde o naranja
 *   según «mejoró» o «empeoró» (`DCOL`), y eso califica (RF-048, INV-06-06, DL-073, TEST-PRJ-009). Además, solo se
 *   restan valores que comparten protocolo, método y unidad (REG-06-162);
 * - **un hueco no se cruza**: en los gráficos de Serie, una toma sin dato corta la línea; no se dibuja un punto
 *   punteado sobre la línea interpolada como hace el compositor (INV-06-176/177).
 * Conclusiones muestra los resultados calculados por BE (corridas vigentes, con su método), no números pegados.
 */
import { CATEGORIAS_DE_METODO, type CategoriaDeMetodo } from './calculo';
import type { EvaluacionAntropometricaApi } from './contratos-antropometria';
import type { CorridaDeCalculoApi, MetodoApi } from './contratos-calculo';
import {
  altoDeTarjetaEnSerie,
  anilloEnLaLamina,
  apilarTarjetas,
  DIAMETROS_DE_LA_LAMINA,
  ENCUADRE_EN_MEDICION,
  ENCUADRE_EN_SERIE,
  esPliegueDeLaCaraPosterior,
  FIGURAS_DE_LA_LAMINA,
  puntoEnLaLamina,
  repartirEnDosColumnas,
  ROTULO_EN_LA_LAMINA,
  TARJETAS_DE_PERIMETROS,
  TARJETAS_DE_PLIEGUES,
  TARJETAS_EN_MEDICION,
  TARJETAS_EN_SERIE,
  ubicarFiguraEnLaLamina,
  type CapaDelDibujo,
  type ClaveDeLaLamina,
  type ColoresDeLaFigura,
  type DiametroDeLaLamina,
  type ElipseEnLaLamina,
  type EncuadreDeLaFiguraEnLaLamina,
  type EncuadreDeLaLamina,
  type FiguraDeLaLamina,
  type PerimetroDeLaLamina,
  type PliegueDeLaLamina,
  type PuntoEnLaLamina,
  type RectanguloEnLaLamina,
  type SexoDeLaLamina,
  type TemaDeLaLamina,
} from './figura-de-lamina';
import { numero, numeroConPrecision, UNIDAD_ADIMENSIONAL } from './formato-numeros';
import { nombreDeMetrica } from './nombres-de-metricas';

type MedicionDeLaApi = EvaluacionAntropometricaApi['measurements'][number];

// ─── Hojas y modos ──────────────────────────────────────────────────────────────────────────────

/** Compositor: las láminas 1, 2 y 3. En Serie, la tercera se llama «Evolución». */
export type HojaDeLaLamina = 'CIRCUNFERENCIAS' | 'PLIEGUES' | 'CONCLUSIONES';
/** Compositor: `single` (una toma) y `serie` (varias tomas de la persona). */
export type ModoDeLaLamina = 'MEDICION' | 'SERIE';
export type FamiliaDeLaLamina = 'PERIMETROS' | 'PLIEGUES';
export type EncuadreEnSerie = Exclude<EncuadreDeLaLamina, 'ENTERO'>;

export const FAMILIA_DE_LA_HOJA: Readonly<Record<Exclude<HojaDeLaLamina, 'CONCLUSIONES'>, FamiliaDeLaLamina>> = { CIRCUNFERENCIAS: 'PERIMETROS', PLIEGUES: 'PLIEGUES' };

/** Serie no tiene cuerpo entero: el compositor pasa a tren superior. */
export const encuadreEnSerie = (encuadre: EncuadreDeLaLamina): EncuadreEnSerie => (encuadre === 'ENTERO' ? 'TREN_SUPERIOR' : encuadre);

/** Hasta cuántas tomas lleva una serie (compositor: «Máximo 8 tomas por serie»). */
export const MAXIMO_DE_TOMAS_EN_SERIE = 8;

// ─── Colores de la lámina, fuera del dibujo de la figura ───────────────────────────────────────

export interface ParadaDeDegradado {
  /** De 0 a 1. */
  readonly en: number;
  readonly color: string;
}

/** Un `linear-gradient` de CSS: el ángulo como lo escribe CSS (0° es hacia arriba, en sentido horario). */
export interface DegradadoLineal {
  readonly angulo: number;
  readonly paradas: readonly ParadaDeDegradado[];
}

/** Un `radial-gradient` elíptico sobre todo el lienzo: centro y radios en fracciones del ancho y del alto. */
export interface DegradadoRadial {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly paradas: readonly ParadaDeDegradado[];
}

export interface SombraDeLaLamina {
  readonly dy: number;
  /** El desenfoque de `box-shadow` (el desvío del SVG es la mitad). */
  readonly desenfoque: number;
  readonly color: string;
  readonly opacidad: number;
}

export interface ColoresDeLaLamina {
  /** Fondo del lienzo (`.slide.light`, `.slide.dark`, `.slide.blue`). */
  readonly fondo: DegradadoLineal;
  /** `.vig`: encima de las tarjetas; el tema claro no la tiene. */
  readonly vineta: DegradadoRadial | null;
  /** `.haze`: degradé vertical del color del fondo a transparente, que esconde la grilla salvo cerca del piso. */
  readonly velo: readonly ParadaDeDegradado[];
  /** `.aura` y `.floor`: degradés radiales `closest-side`. */
  readonly aura: readonly ParadaDeDegradado[];
  readonly piso: readonly ParadaDeDegradado[];
  /** `.gl`: la tarjeta de vidrio. `brillo` es la línea clara de arriba (`inset 0 1px 0`). */
  readonly tarjeta: {
    readonly relleno: readonly [string, string];
    readonly borde: string;
    readonly radio: number;
    readonly brillo: string | null;
    readonly sombra: SombraDeLaLamina;
  };
  /** Claro y Azul: título y línea de nombre limpios; Oscuro: fecha y título en píldoras de vidrio. */
  readonly encabezado: { readonly estilo: 'LIMPIO' | 'PILDORAS'; readonly titulo: string; readonly subtitulo: string; readonly fechaEnPildora: string };
  /** `.pillTag`, la etiqueta del encuadre. */
  readonly etiqueta: { readonly fondo: string; readonly borde: string; readonly grosorDelBorde: number; readonly texto: string; readonly sombra: SombraDeLaLamina | null };
  /** `.rowName`, `.rowVal`, `.rowUnit` y `.rowSep`; `rotuloPosterior` es el de un pliegue de la cara posterior. */
  readonly fila: { readonly rotulo: string; readonly rotuloPosterior: string; readonly valor: string; readonly unidad: string; readonly separador: string };
  /** `.postTag`. */
  readonly marcaPosterior: { readonly fondo: string; readonly texto: string; readonly borde: string };
  /** `.cap`: «DIÁMETROS ÓSEOS». */
  readonly rotuloDeBloque: string;
  /** `.kl`, `.kv` y `.vdiv`: el pie de Pliegues y la franja de Serie. */
  readonly pie: { readonly rotulo: string; readonly valor: string; readonly divisor: string };
  /** `.cardTitle`, `.hair` y `.hair2`. */
  readonly tarjetaTitulo: string;
  readonly linea: string;
  readonly lineaSuave: string;
  /** «BETTER EVERYDAY» (`.footWrap div`). */
  readonly firma: string;
  /** Conclusiones (`PAL`: `tit`, `lab`, `labSoft`, `val`, `valInk`, `unit`). */
  readonly conclusiones: { readonly titulo: string; readonly rotulo: string; readonly rotuloSuave: string; readonly valor: string; readonly valorTinta: string; readonly unidad: string };
  /** Serie (`.tChip`, `.tDate`, `.tJoin`, `.kAcc`, `.sT`, `.sBig`, `.sUnit`, `.sVals`, `.mLab`, `.iBadge`, `PAL.gauge` y `gTrack`). */
  readonly serie: {
    readonly chip: { readonly texto: string; readonly borde: string; readonly fondo: string | null; readonly textoActivo: string; readonly fondoActivo: string };
    readonly fecha: string;
    readonly fechaActiva: string;
    readonly union: string;
    readonly acento: string;
    readonly nombre: string;
    readonly valor: string;
    readonly unidad: string;
    readonly valores: { readonly fondo: string; readonly texto: string };
    readonly rotulo: string;
    readonly insignia: { readonly fondo: string; readonly borde: string };
    /**
     * La diferencia entre tomas, siempre en el color neutro del compositor (`DCOL.neu`): nunca verde ni naranja por
     * «mejor» o «peor».
     */
    readonly diferencia: { readonly texto: string; readonly fondo: string; readonly borde: string };
    readonly grafico: { readonly linea: string; readonly pista: string; readonly rotulo: string; readonly puntoRelleno: string; readonly valor: string };
  };
}

/**
 * Los colores del compositor, con un ajuste: **cada texto llega a 4,5:1** sobre lo que tiene detrás (WCAG 2.2 AA;
 * RNF-ACC-001), medido en cada parada del degradé del fondo y con las transparencias compuestas (`lamina.test.ts`). Los
 * del compositor que no llegaban se oscurecieron o se hicieron más opacos lo justo, sin cambiar el tono; cada uno dice
 * entre paréntesis el valor original. En el tema azul, además, la última parada del fondo es un poco más profunda, el
 * vidrio de las tarjetas un poco menos blanco y las píldoras chicas van con un velo oscuro: con el azul claro de la
 * esquina, ni el blanco llegaba a 4,5:1 sobre el vidrio. La marca de un pliegue posterior ya no se apaga al 60 %: la
 * distinguen la marca «posterior» y su guía punteada.
 */
export const COLORES_DE_LA_LAMINA: Readonly<Record<TemaDeLaLamina, ColoresDeLaLamina>> = {
  CLARO: {
    fondo: { angulo: 163, paradas: [{ en: 0, color: '#F2F6FC' }, { en: 0.46, color: '#E9F0FA' }, { en: 0.78, color: '#DEE8F6' }, { en: 1, color: '#D6E2F3' }] },
    vineta: null,
    velo: [{ en: 0, color: '#F2F6FC' }, { en: 0.4, color: 'rgba(242,246,252,.90)' }, { en: 1, color: 'rgba(242,246,252,0)' }],
    aura: [{ en: 0, color: 'rgba(255,255,255,.82)' }, { en: 0.46, color: 'rgba(255,255,255,.34)' }, { en: 0.76, color: 'rgba(255,255,255,0)' }],
    piso: [{ en: 0, color: 'rgba(30,80,150,.22)' }, { en: 0.7, color: 'rgba(30,80,150,0)' }],
    tarjeta: { relleno: ['#FFFFFF', '#FFFFFF'], borde: 'rgba(255,255,255,.9)', radio: 22, brillo: null, sombra: { dy: 10, desenfoque: 30, color: '#143264', opacidad: 0.13 } },
    // subtitulo (#1E6BF2)
    encabezado: { estilo: 'LIMPIO', titulo: '#0A1F44', subtitulo: '#0D59DF', fechaEnPildora: '#0A1F44' },
    etiqueta: { fondo: '#FFFFFF', borde: 'rgba(30,107,242,.4)', grosorDelBorde: 1.5, texto: '#1E6BF2', sombra: { dy: 4, desenfoque: 14, color: '#1E6BF2', opacidad: 0.1 } },
    // rotuloPosterior (el rótulo al 60 %), unidad (#94A3B8)
    fila: { rotulo: '#334155', rotuloPosterior: 'rgba(51,65,85,.72)', valor: '#1E6BF2', unidad: '#637895', separador: '#E8F0FC' },
    // texto (#8496AD)
    marcaPosterior: { fondo: '#EDF1F7', texto: '#5B6F89', borde: '#E1E8F2' },
    // (#6B7C96)
    rotuloDeBloque: '#57657A',
    // rotulo (#6B7C96)
    pie: { rotulo: '#57657A', valor: '#0A1F44', divisor: '#E3ECFF' },
    tarjetaTitulo: '#0A1F44',
    linea: 'rgba(30,107,242,.16)',
    lineaSuave: '#E8F0FC',
    // (#7C93B5)
    firma: '#4D6588',
    // unidad (#94A3B8)
    conclusiones: { titulo: '#0A1F44', rotulo: 'rgba(51,65,85,.9)', rotuloSuave: '#64748B', valor: '#1E6BF2', valorTinta: '#0A1F44', unidad: '#637895' },
    serie: {
      chip: { texto: '#1E6BF2', borde: '#1E6BF2', fondo: '#FFFFFF', textoActivo: '#FFFFFF', fondoActivo: '#1E6BF2' },
      fecha: '#5B6B84',
      fechaActiva: '#1E6BF2',
      union: 'rgba(30,107,242,.45)',
      acento: '#1E6BF2',
      nombre: '#0A1F44',
      valor: '#0A1F44',
      unidad: '#1E6BF2',
      valores: { fondo: '#ECF1F9', texto: '#22344E' },
      // (#6B7C96)
      rotulo: '#57657A',
      insignia: { fondo: 'rgba(30,107,242,.08)', borde: 'rgba(30,107,242,.18)' },
      // texto (#1E6BF2, el neutro de DCOL)
      diferencia: { texto: '#0D59DF', fondo: 'rgba(30,107,242,.13)', borde: 'rgba(30,107,242,.34)' },
      grafico: { linea: '#1E6BF2', pista: '#E6EEF9', rotulo: '#64748B', puntoRelleno: '#FFFFFF', valor: '#0A1F44' },
    },
  },
  OSCURO: {
    fondo: { angulo: 158, paradas: [{ en: 0, color: '#0B1A2C' }, { en: 0.4, color: '#081422' }, { en: 0.72, color: '#050D17' }, { en: 1, color: '#081524' }] },
    vineta: { cx: 0.5, cy: 0.46, rx: 1.2, ry: 0.9, paradas: [{ en: 0, color: 'rgba(0,0,0,0)' }, { en: 0.55, color: 'rgba(0,0,0,0)' }, { en: 1, color: 'rgba(0,0,0,.34)' }] },
    velo: [{ en: 0, color: '#081422' }, { en: 0.42, color: 'rgba(8,20,34,.92)' }, { en: 1, color: 'rgba(8,20,34,0)' }],
    aura: [{ en: 0, color: 'rgba(95,212,240,.17)' }, { en: 0.55, color: 'rgba(95,212,240,.06)' }, { en: 0.78, color: 'rgba(95,212,240,0)' }],
    piso: [{ en: 0, color: 'rgba(110,195,235,.20)' }, { en: 0.7, color: 'rgba(110,195,235,0)' }],
    tarjeta: {
      relleno: ['rgba(28,48,74,.72)', 'rgba(16,30,50,.66)'],
      borde: 'rgba(150,200,235,.23)',
      radio: 26,
      brillo: 'rgba(255,255,255,.16)',
      sombra: { dy: 16, desenfoque: 40, color: '#000000', opacidad: 0.42 },
    },
    // subtitulo (.55)
    encabezado: { estilo: 'PILDORAS', titulo: '#FFFFFF', subtitulo: 'rgba(206,226,244,.56)', fechaEnPildora: 'rgba(233,243,252,.8)' },
    etiqueta: { fondo: 'rgba(95,212,240,.13)', borde: 'rgba(95,212,240,.42)', grosorDelBorde: 1, texto: '#A0E6FA', sombra: null },
    // rotuloPosterior (el rótulo al 60 %), unidad (.45)
    fila: { rotulo: 'rgba(224,238,250,.82)', rotuloPosterior: 'rgba(224,238,250,.54)', valor: '#FFFFFF', unidad: 'rgba(255,255,255,.49)', separador: 'rgba(255,255,255,.10)' },
    // texto (.62)
    marcaPosterior: { fondo: 'rgba(255,255,255,.09)', texto: 'rgba(206,224,247,.68)', borde: 'rgba(255,255,255,.13)' },
    // (.6)
    rotuloDeBloque: 'rgba(170,205,235,.64)',
    // rotulo (.63)
    pie: { rotulo: 'rgba(170,205,235,.66)', valor: '#FFFFFF', divisor: 'rgba(255,255,255,.12)' },
    tarjetaTitulo: 'rgba(255,255,255,.93)',
    linea: 'rgba(120,190,230,.28)',
    lineaSuave: 'rgba(255,255,255,.12)',
    // (.47)
    firma: 'rgba(170,205,235,.64)',
    conclusiones: {
      titulo: 'rgba(255,255,255,.93)',
      rotulo: 'rgba(224,238,250,.8)',
      rotuloSuave: 'rgba(224,238,250,.7)',
      valor: '#FFFFFF',
      valorTinta: '#FFFFFF',
      // (.43)
      unidad: 'rgba(255,255,255,.49)',
    },
    serie: {
      chip: { texto: '#5FD4F0', borde: '#5FD4F0', fondo: null, textoActivo: '#06121F', fondoActivo: '#5FD4F0' },
      fecha: 'rgba(224,238,250,.72)',
      fechaActiva: '#FFFFFF',
      union: 'rgba(95,212,240,.45)',
      acento: '#5FE1F5',
      nombre: 'rgba(255,255,255,.94)',
      valor: '#FFFFFF',
      unidad: '#5FD4F0',
      valores: { fondo: 'rgba(255,255,255,.07)', texto: '#EAF4FF' },
      rotulo: 'rgba(170,205,235,.72)',
      insignia: { fondo: 'rgba(95,212,240,.11)', borde: 'rgba(95,212,240,.26)' },
      diferencia: { texto: '#5FD4F0', fondo: 'rgba(95,212,240,.13)', borde: 'rgba(95,212,240,.34)' },
      grafico: { linea: '#5FD4F0', pista: 'rgba(255,255,255,.13)', rotulo: 'rgba(224,238,250,.7)', puntoRelleno: '#5FD4F0', valor: '#FFFFFF' },
    },
  },
  AZUL: {
    // última parada (#1E63C8)
    fondo: { angulo: 104, paradas: [{ en: 0, color: '#071B3D' }, { en: 0.34, color: '#0C2E63' }, { en: 0.62, color: '#14468F' }, { en: 1, color: '#1A57B2' }] },
    vineta: { cx: 0.26, cy: 0.44, rx: 1.3, ry: 0.95, paradas: [{ en: 0, color: 'rgba(4,14,32,.42)' }, { en: 0.62, color: 'rgba(4,14,32,0)' }] },
    velo: [{ en: 0, color: '#0A2450' }, { en: 0.4, color: 'rgba(11,40,86,.86)' }, { en: 1, color: 'rgba(11,40,86,0)' }],
    aura: [{ en: 0, color: 'rgba(180,225,255,.20)' }, { en: 0.76, color: 'rgba(180,225,255,0)' }],
    piso: [{ en: 0, color: 'rgba(190,230,255,.24)' }, { en: 0.7, color: 'rgba(190,230,255,0)' }],
    tarjeta: {
      // relleno (.14 → .07)
      relleno: ['rgba(255,255,255,.12)', 'rgba(255,255,255,.06)'],
      borde: 'rgba(255,255,255,.26)',
      radio: 24,
      brillo: 'rgba(255,255,255,.30)',
      sombra: { dy: 16, desenfoque: 40, color: '#030C1E', opacidad: 0.34 },
    },
    encabezado: { estilo: 'LIMPIO', titulo: '#FFFFFF', subtitulo: '#A9D6FF', fechaEnPildora: '#FFFFFF' },
    // texto (#DCEEFF)
    etiqueta: { fondo: 'rgba(255,255,255,.13)', borde: 'rgba(255,255,255,.38)', grosorDelBorde: 1, texto: '#E4F2FF', sombra: null },
    // rotulo (.86), rotuloPosterior (el rótulo al 60 %), unidad (.55)
    fila: { rotulo: 'rgba(255,255,255,.89)', rotuloPosterior: 'rgba(255,255,255,.89)', valor: '#FFFFFF', unidad: 'rgba(255,255,255,.89)', separador: 'rgba(255,255,255,.16)' },
    // fondo (rgba(255,255,255,.12)), texto (.72)
    marcaPosterior: { fondo: 'rgba(5,20,50,.16)', texto: 'rgba(216,236,255,.87)', borde: 'rgba(255,255,255,.18)' },
    // (.7)
    rotuloDeBloque: 'rgba(214,234,255,.85)',
    // rotulo (rgba(214,234,255,.72))
    pie: { rotulo: '#E0EFFF', valor: '#FFFFFF', divisor: 'rgba(255,255,255,.18)' },
    tarjetaTitulo: '#FFFFFF',
    linea: 'rgba(255,255,255,.24)',
    lineaSuave: 'rgba(255,255,255,.14)',
    // (.6)
    firma: 'rgba(214,234,255,.85)',
    // rotulo (.86), rotuloSuave (rgba(214,234,255,.75)), unidad (.55)
    conclusiones: { titulo: '#FFFFFF', rotulo: 'rgba(255,255,255,.89)', rotuloSuave: '#E0EFFF', valor: '#FFFFFF', valorTinta: '#FFFFFF', unidad: 'rgba(255,255,255,.89)' },
    serie: {
      // texto (#CFEEFF)
      chip: { texto: '#D9F2FF', borde: '#9BE7FF', fondo: null, textoActivo: '#07264F', fondoActivo: '#9BE7FF' },
      // (.75)
      fecha: 'rgba(255,255,255,.89)',
      fechaActiva: '#FFFFFF',
      union: 'rgba(155,231,255,.5)',
      // (#9BE7FF)
      acento: '#D1F4FF',
      nombre: '#FFFFFF',
      valor: '#FFFFFF',
      // (#9BE7FF)
      unidad: '#D1F4FF',
      // fondo (rgba(255,255,255,.11))
      valores: { fondo: 'rgba(5,20,50,.20)', texto: '#F2F9FF' },
      // (rgba(214,234,255,.78))
      rotulo: '#E0EFFF',
      insignia: { fondo: 'rgba(255,255,255,.13)', borde: 'rgba(255,255,255,.26)' },
      // texto (#BFE7FF, el neutro de DCOL), fondo (rgba(191,231,255,.13))
      diferencia: { texto: '#D9F1FF', fondo: 'rgba(5,20,50,.20)', borde: 'rgba(191,231,255,.34)' },
      // rotulo (rgba(214,234,255,.75))
      grafico: { linea: '#9BE7FF', pista: 'rgba(255,255,255,.20)', rotulo: '#E0EFFF', puntoRelleno: '#9BE7FF', valor: '#FFFFFF' },
    },
  },
};

/**
 * El segmento de un `linear-gradient` de CSS sobre una caja: pasa por el centro, en la dirección del ángulo (0° hacia
 * arriba, en sentido horario), con el largo que hace que los extremos toquen las esquinas. Para el SVG, en px.
 */
export function lineaDelDegradado(angulo: number, ancho: number, alto: number): { x1: number; y1: number; x2: number; y2: number } {
  const radianes = (angulo * Math.PI) / 180;
  const dx = Math.sin(radianes);
  const dy = -Math.cos(radianes);
  const medio = (Math.abs(ancho * dx) + Math.abs(alto * dy)) / 2;
  return { x1: ancho / 2 - dx * medio, y1: alto / 2 - dy * medio, x2: ancho / 2 + dx * medio, y2: alto / 2 + dy * medio };
}

/** El color de una capa del dibujo en el tema, o `null` si el tema no tiene esa capa (no se dibuja). */
export function colorDeLaCapa(capa: CapaDelDibujo, colores: ColoresDeLaFigura): string | null {
  return colores[capa.color];
}

/** La opacidad de una capa: fija, o la del resplandor del tema más un ajuste; con sombra (Oscuro), la propia. */
export function opacidadDeLaCapa(capa: CapaDelDibujo, colores: ColoresDeLaFigura): number {
  if (colores.anilloSombra && capa.opacidadConSombra !== undefined) return capa.opacidadConSombra;
  if (typeof capa.opacidad === 'number') return capa.opacidad;
  const base = capa.opacidad.resplandor === 'ANCHO' ? colores.opacidadResplandorAncho : colores.opacidadResplandorAngosto;
  return Number((base + capa.opacidad.mas).toFixed(4));
}

/**
 * La grilla del piso, a los pies de la figura (compositor: `auraHTML` en Medición, `serieAura` en Serie): elipses que
 * se abren y, en Medición, rayos en abanico. Opacidades relativas a la del tema (`gridOp`).
 */
export function grillaDelPiso(
  encuadre: EncuadreDeLaFiguraEnLaLamina,
  modo: ModoDeLaLamina,
): { readonly elipses: readonly { cx: number; cy: number; rx: number; ry: number; opacidad: number }[]; readonly rayos: readonly { x1: number; y1: number; x2: number; y2: number; opacidad: number }[] } {
  const pies = encuadre.arriba + encuadre.altoDelCuerpo;
  const elipses = Array.from({ length: 8 }, (_, i) => {
    const p = (i + 1) / 8;
    const rx = Math.round(modo === 'MEDICION' ? 110 + p * p * 1180 : 90 + p * p * 920);
    return { cx: encuadre.centroX, cy: pies, rx, ry: Math.round(rx * 0.2), opacidad: 1 - p * 0.7 };
  });
  const rayos =
    modo === 'MEDICION'
      ? Array.from({ length: 15 }, (_, i) => {
          const a = ((i - 7) * 11 * Math.PI) / 180;
          return { x1: Math.round(encuadre.centroX + Math.tan(a) * 90), y1: pies + 18, x2: Math.round(encuadre.centroX + Math.tan(a) * 1500), y2: pies + 430, opacidad: 0.5 };
        })
      : [];
  return { elipses, rayos };
}

// ─── Los valores de una toma ────────────────────────────────────────────────────────────────────

/** Un valor tal como lo muestra la lámina, con lo que hace falta para decidir si dos valores se pueden restar. */
export interface ValorDeLaLamina {
  readonly valor: number;
  readonly unidad: string;
  /** Protocolo, método y unidad (REG-06-162): dos valores se restan solo si comparten grupo. */
  readonly grupo: string;
  readonly clase: 'MEASURED' | 'REPORTED' | 'DERIVED';
  /** Los decimales que declara el método (solo resultados calculados; REG-06-158). */
  readonly decimales?: number;
}

/**
 * El valor como se lee en la lámina, con coma decimal: un resultado calculado con la precisión que declara su método
 * (REG-06-158); una medición, con todos sus decimales, sin redondear en silencio.
 */
export const textoDelValor = (v: ValorDeLaLamina): string => (v.decimales !== undefined ? numeroConPrecision(v.valor, v.decimales) : numero(v.valor));

/** La unidad que acompaña un valor: ninguna para un resultado sin dimensión (un índice, el somatotipo). */
export const unidadVisible = (unidad: string): string => (unidad === UNIDAD_ADIMENSIONAL ? '' : unidad);

export interface ValoresDeLaToma {
  readonly porClave: ReadonlyMap<string, ValorDeLaLamina>;
  /** Claves con más de una medición vigente en la toma: la lámina muestra la más reciente y lo dice. */
  readonly repetidas: readonly string[];
}

/** El grupo de comparabilidad de una medición: el mismo criterio que la evolución (protocolo, método y unidad). */
export const grupoDeLaMedicion = (m: Pick<MedicionDeLaApi, 'protocol'>, unidad: string): string => `${m.protocol.protocolVersionId}|${m.protocol.methodVersionId ?? ''}|${unidad}`;

/**
 * Los valores vigentes de una toma, por clave de medición: solo las mediciones vigentes (`EFFECTIVE`) con valor que
 * rige (`effectiveMagnitude`, ya resuelto con las correcciones). Una anulada no cuenta; una con la cadena de
 * correcciones sin resolver tampoco, porque no tiene un valor que mostrar.
 */
export function valoresDeLaToma(mediciones: readonly MedicionDeLaApi[]): ValoresDeLaToma {
  const vigentes = mediciones
    .filter((m) => m.condition === 'EFFECTIVE' && m.effectiveMagnitude !== null)
    .slice()
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.recordedAt.localeCompare(b.recordedAt));
  const porClave = new Map<string, ValorDeLaLamina>();
  const cuenta = new Map<string, number>();
  for (const m of vigentes) {
    const magnitud = m.effectiveMagnitude!;
    porClave.set(m.metric, { valor: magnitud.value, unidad: magnitud.unit, grupo: grupoDeLaMedicion(m, magnitud.unit), clase: m.dataClass });
    cuenta.set(m.metric, (cuenta.get(m.metric) ?? 0) + 1);
  }
  return { porClave, repetidas: [...cuenta.entries()].filter(([, n]) => n > 1).map(([clave]) => clave) };
}

// ─── Sitios dibujados ───────────────────────────────────────────────────────────────────────────

export interface SitioDibujado {
  readonly clave: PerimetroDeLaLamina | PliegueDeLaLamina;
  readonly rotulo: string;
  readonly posterior: boolean;
  /** El anillo de un perímetro, o `null` si es un pliegue. */
  readonly anillo: ElipseEnLaLamina | null;
  /** El punto de un pliegue, o `null` si es un perímetro. */
  readonly punto: PuntoEnLaLamina | null;
  readonly cx: number;
  readonly cy: number;
  /** El desplazamiento lateral en la figura (compositor: `x` de `FIGS`): reparte las columnas de Serie. */
  readonly lateral: number;
}

/** Las claves de la familia en el encuadre, en el orden de las tarjetas del compositor (`GR`, `GF`). */
export const clavesDelEncuadre = (familia: FamiliaDeLaLamina, encuadre: EncuadreDeLaLamina): readonly (readonly (PerimetroDeLaLamina | PliegueDeLaLamina)[])[] =>
  familia === 'PERIMETROS' ? TARJETAS_DE_PERIMETROS[encuadre] : TARJETAS_DE_PLIEGUES[encuadre];

/** El sitio de una clave en la figura, en px de la lámina, o `null` si la figura no lo ubica. */
export function sitioDibujado(figura: FiguraDeLaLamina, imagen: RectanguloEnLaLamina, clave: PerimetroDeLaLamina | PliegueDeLaLamina): SitioDibujado | null {
  const perimetro = figura.perimetros[clave as PerimetroDeLaLamina];
  if (perimetro) {
    const anillo = anilloEnLaLamina(imagen, perimetro);
    return { clave, rotulo: ROTULO_EN_LA_LAMINA[clave], posterior: false, anillo, punto: null, cx: anillo.cx, cy: anillo.cy, lateral: perimetro.x };
  }
  const pliegue = figura.pliegues[clave as PliegueDeLaLamina];
  if (pliegue) {
    const punto = puntoEnLaLamina(imagen, pliegue);
    return { clave, rotulo: ROTULO_EN_LA_LAMINA[clave], posterior: esPliegueDeLaCaraPosterior(clave), anillo: null, punto, cx: punto.cx, cy: punto.cy, lateral: pliegue.x };
  }
  return null;
}

/** Una línea guía: una polilínea y el punto que la marca (en Medición, en su inicio; en Serie, en el sitio). */
export interface TrazoDeGuia {
  readonly puntos: readonly (readonly [number, number])[];
  readonly marca: readonly [number, number];
  readonly posterior: boolean;
}

// ─── Medición: Circunferencias y Pliegues ───────────────────────────────────────────────────────

export interface FilaDeTarjeta {
  readonly sitio: SitioDibujado;
  readonly valor: ValorDeLaLamina;
  /** El centro vertical de la fila, en px de la lámina. */
  readonly centro: number;
}

export interface TarjetaDeMedicion extends RectanguloEnLaLamina {
  readonly filas: readonly FilaDeTarjeta[];
}

export interface ComposicionDeMedicion {
  readonly figura: FiguraDeLaLamina;
  readonly imagen: RectanguloEnLaLamina;
  readonly encuadre: EncuadreDeLaFiguraEnLaLamina;
  /** Solo los sitios con valor en la toma. */
  readonly sitios: readonly SitioDibujado[];
  readonly tarjetas: readonly TarjetaDeMedicion[];
  readonly guias: readonly TrazoDeGuia[];
  /** Las claves de la familia que tienen valor en la toma y que este encuadre no muestra (otro tren). */
  readonly fueraDelEncuadre: readonly (PerimetroDeLaLamina | PliegueDeLaLamina)[];
}

/**
 * La lámina de una toma (compositor: `slide1`, `slide2` y `panelHTML`): la figura a la derecha, las tarjetas a la
 * izquierda con una fila por sitio **con valor**, y una guía por fila. Cada tarjeta arranca centrada en la altura
 * media de sus sitios y se apilan sin pisarse (`apilarTarjetas`).
 */
export function componerMedicion(sexo: SexoDeLaLamina, encuadre: EncuadreDeLaLamina, familia: FamiliaDeLaLamina, valores: ReadonlyMap<string, ValorDeLaLamina>): ComposicionDeMedicion {
  const figura = FIGURAS_DE_LA_LAMINA[sexo][encuadre];
  const ubicacion = ENCUADRE_EN_MEDICION[encuadre];
  const imagen = ubicarFiguraEnLaLamina(figura, ubicacion);
  const { izquierda, ancho, altoDeFila, relleno, separacion, tope, piso, inicioDeLaGuia, quiebreDeLaGuia, margenAlAnillo, margenAlPunto } = TARJETAS_EN_MEDICION;

  const grupos = clavesDelEncuadre(familia, encuadre)
    .map((grupo) =>
      grupo.flatMap((clave) => {
        const valor = valores.get(clave);
        const sitio = valor ? sitioDibujado(figura, imagen, clave) : null;
        return sitio && valor ? [{ sitio, valor }] : [];
      }),
    )
    .filter((g) => g.length > 0);

  const altos = grupos.map((g) => g.length * altoDeFila + 2 * relleno);
  const bordes = apilarTarjetas(
    grupos.map((g, i) => ({ alto: altos[i]!, centroDeseado: g.reduce((n, f) => n + f.sitio.cy, 0) / g.length })),
    { tope, piso, separacion },
  );

  const tarjetas: TarjetaDeMedicion[] = grupos.map((g, i) => ({
    x: izquierda,
    y: bordes[i]!,
    ancho,
    alto: altos[i]!,
    filas: g.map((f, fila) => ({ ...f, centro: bordes[i]! + relleno + fila * altoDeFila + altoDeFila / 2 })),
  }));

  const salida = izquierda + ancho + inicioDeLaGuia;
  const quiebre = izquierda + ancho + quiebreDeLaGuia;
  const guias: TrazoDeGuia[] = tarjetas.flatMap((t) =>
    t.filas.map((f) => {
      const destino: [number, number] = f.sitio.anillo ? [f.sitio.anillo.cx - f.sitio.anillo.rx - margenAlAnillo, f.sitio.cy] : [f.sitio.cx - margenAlPunto, f.sitio.cy];
      return { puntos: [[salida, f.centro], [quiebre, f.centro], destino], marca: [salida, f.centro], posterior: f.sitio.posterior };
    }),
  );

  const enElEncuadre = new Set<string>(clavesDelEncuadre(familia, encuadre).flat());
  const fueraDelEncuadre = clavesDelEncuadre(familia, 'ENTERO')
    .flat()
    .filter((clave) => valores.has(clave) && !enElEncuadre.has(clave));

  return { figura, imagen, encuadre: ubicacion, sitios: tarjetas.flatMap((t) => t.filas.map((f) => f.sitio)), tarjetas, guias, fueraDelEncuadre };
}

/** Los diámetros óseos de la toma, en el orden del bloque del compositor (`BONES`); `[]` si no hay ninguno. */
export function diametrosDeLaToma(valores: ReadonlyMap<string, ValorDeLaLamina>): readonly { readonly clave: DiametroDeLaLamina; readonly rotulo: string; readonly valor: ValorDeLaLamina | null }[] {
  if (!DIAMETROS_DE_LA_LAMINA.some((d) => valores.has(d))) return [];
  return DIAMETROS_DE_LA_LAMINA.map((clave) => ({ clave, rotulo: ROTULO_EN_LA_LAMINA[clave], valor: valores.get(clave) ?? null }));
}

/**
 * Los pliegues del catálogo de BE que la figura no ubica (bíceps y cresta ilíaca: el compositor no los dibuja). Van al
 * pie de Pliegues, con su rótulo corto, para que no se pierdan.
 */
export const PLIEGUES_SIN_SITIO: readonly { readonly clave: 'pliegue-biceps' | 'pliegue-cresta-iliaca'; readonly rotulo: string }[] = [
  { clave: 'pliegue-biceps', rotulo: 'Bíceps' },
  { clave: 'pliegue-cresta-iliaca', rotulo: 'Cresta ilíaca' },
];

/** Las mediciones de la toma que no son de ningún sitio de la figura ni del pie: masa, estatura y edad. */
export const DATOS_DE_LA_TOMA = ['peso', 'talla', 'edad'] as const;

/** Todo lo que la lámina sabe ubicar en algún lugar: sitios de la figura, diámetros, pliegues sin sitio y datos. */
const CLAVES_CONOCIDAS = new Set<string>([...Object.keys(ROTULO_EN_LA_LAMINA), ...PLIEGUES_SIN_SITIO.map((p) => p.clave), ...DATOS_DE_LA_TOMA]);

/** Las claves de la toma que la lámina no tiene dónde mostrar (de otros protocolos): van en la lista de abajo. */
export const clavesSinLugarEnLaLamina = (valores: ReadonlyMap<string, ValorDeLaLamina>): string[] => [...valores.keys()].filter((c) => !CLAVES_CONOCIDAS.has(c));

// ─── Conclusiones: los resultados calculados de la toma ────────────────────────────────────────

export interface ResultadoDeLaToma {
  readonly corridaId: string;
  readonly metrica: string;
  /** El nombre de la métrica (`nombreDeMetrica`). */
  readonly nombre: string;
  readonly metodo: string;
  readonly version: string;
  readonly categoria: CategoriaDeMetodo | null;
  readonly valor: ValorDeLaLamina;
  readonly registradoEn: string;
}

/** Una corrida en efecto: sin sucesora (la vigente de su cadena) y sin entradas anuladas (REG-06-220). */
export const corridaVigente = (c: Pick<CorridaDeCalculoApi, 'effective' | 'supersededByRunId'>): boolean => c.effective && c.supersededByRunId === null;

/** La categoría del método de una corrida: por su versión y, si es una versión anterior, por el método. */
export function categoriaDeLaCorrida(c: Pick<CorridaDeCalculoApi, 'methodVersionId' | 'methodId'>, metodos: readonly Pick<MetodoApi, 'methodVersionId' | 'methodId' | 'category'>[]): CategoriaDeMetodo | null {
  return (metodos.find((m) => m.methodVersionId === c.methodVersionId) ?? metodos.find((m) => m.methodId === c.methodId))?.category ?? null;
}

const ordenDeCategoria = (c: CategoriaDeMetodo | null): number => (c === null ? CATEGORIAS_DE_METODO.length : CATEGORIAS_DE_METODO.indexOf(c));

/** El orden neutral de los resultados: categoría del catálogo, método y versión. Nunca por «mejor» (REG-06-205). */
const porCatalogo = (a: ResultadoDeLaToma, b: ResultadoDeLaToma): number =>
  ordenDeCategoria(a.categoria) - ordenDeCategoria(b.categoria) || a.metodo.localeCompare(b.metodo, 'es') || a.version.localeCompare(b.version, 'es') || a.nombre.localeCompare(b.nombre, 'es');

/** El resultado de una corrida, como valor de la lámina: el grupo es el método (versión), la unidad y la métrica. */
export function resultadoDeLaCorrida(c: CorridaDeCalculoApi, metodos: readonly Pick<MetodoApi, 'methodVersionId' | 'methodId' | 'category'>[]): ResultadoDeLaToma {
  return {
    corridaId: c.calculationRunId,
    metrica: c.result.metric,
    nombre: nombreDeMetrica(c.result.metric),
    metodo: c.methodName,
    version: c.methodVersion,
    categoria: categoriaDeLaCorrida(c, metodos),
    valor: {
      valor: c.result.magnitude.value,
      unidad: c.result.magnitude.unit,
      grupo: `${c.methodVersionId}|${c.result.magnitude.unit}|${c.result.metric}`,
      clase: 'DERIVED',
      decimales: c.precision.decimals,
    },
    registradoEn: c.recordedAt,
  };
}

/**
 * Los resultados de las fórmulas de una toma: sus corridas vigentes (`corridaVigente`), cada una con su método. Las
 * corridas conviven (REG-06-205): no se promedian ni se elige una; si el mismo método dio dos corridas vigentes, se
 * muestran las dos.
 */
export function resultadosDeLaToma(corridas: readonly CorridaDeCalculoApi[], metodos: readonly Pick<MetodoApi, 'methodVersionId' | 'methodId' | 'category'>[], evaluacionId: string): ResultadoDeLaToma[] {
  return corridas
    .filter((c) => c.evaluationId === evaluacionId && corridaVigente(c))
    .map((c) => resultadoDeLaCorrida(c, metodos))
    .sort(porCatalogo);
}

/**
 * La suma de siete pliegues de Jackson y Pollock, que el compositor muestra al pie de Pliegues («SUMA 7 PLIEGUES»,
 * cargada a mano). En BE sale de la corrida vigente de la toma con esa métrica; si hay más de una, la más reciente.
 */
export const METRICA_DEL_PIE_DE_PLIEGUES = 'suma-7-pliegues-jackson-pollock';

export function sumaDelPieDePliegues(resultados: readonly ResultadoDeLaToma[]): ResultadoDeLaToma | null {
  return resultados.filter((r) => r.metrica === METRICA_DEL_PIE_DE_PLIEGUES).reduce<ResultadoDeLaToma | null>((a, r) => (!a || a.registradoEn < r.registradoEn ? r : a), null);
}

/** Cuántas corridas de la toma quedaron sin efecto (reemplazadas o con una entrada anulada): no van en la lámina. */
export const corridasSinEfecto = (corridas: readonly CorridaDeCalculoApi[], evaluacionId: string): number =>
  corridas.filter((c) => c.evaluationId === evaluacionId && !corridaVigente(c)).length;

export interface SeccionDeConclusiones {
  readonly categoria: CategoriaDeMetodo | null;
  readonly resultados: readonly ResultadoDeLaToma[];
}

/** Los resultados agrupados por la categoría del método, en el orden del catálogo; los sin categoría, al final. */
export function agruparPorCategoria(resultados: readonly ResultadoDeLaToma[]): SeccionDeConclusiones[] {
  const secciones = new Map<CategoriaDeMetodo | null, ResultadoDeLaToma[]>();
  for (const r of [...resultados].sort(porCatalogo)) secciones.set(r.categoria, [...(secciones.get(r.categoria) ?? []), r]);
  return [...secciones.entries()].map(([categoria, lista]) => ({ categoria, resultados: lista })).sort((a, b) => ordenDeCategoria(a.categoria) - ordenDeCategoria(b.categoria));
}

/** Dónde van las tarjetas de Conclusiones (compositor: `slide3`, entre el encabezado y el pie). */
export const CONCLUSIONES_EN_LA_LAMINA = {
  x: 52,
  ancho: 976,
  tope: 236,
  piso: 1790,
  separacion: 24,
  /** Título y línea de la tarjeta, antes de la primera fila. */
  encabezado: 86,
  rellenoInferior: 18,
  altoDeFila: 64,
  altoMinimoDeFila: 50,
} as const;

export interface TarjetaDeConclusiones extends RectanguloEnLaLamina {
  /** El índice de la sección que dibuja. */
  readonly indice: number;
  /** Cuántas filas de la sección entran (las primeras). */
  readonly filas: number;
}

export interface RepartoDeConclusiones {
  readonly columnas: 1 | 2;
  readonly altoDeFila: number;
  readonly tarjetas: readonly TarjetaDeConclusiones[];
  /** Filas que no entraron en la lámina. */
  readonly omitidas: number;
}

/**
 * Reparte las tarjetas de Conclusiones (una por sección, con `cantidades[i]` filas): en una columna si entran; si no,
 * en dos (cada tarjeta en la columna más corta, en orden); si tampoco, con filas más bajas, hasta `altoMinimoDeFila`;
 * y si aun así no entran, se cortan las últimas filas y se cuentan en `omitidas`, para decirlo debajo de la lámina.
 */
export function repartirConclusiones(cantidades: readonly number[]): RepartoDeConclusiones {
  const { x, ancho, tope, piso, separacion, encabezado, rellenoInferior, altoDeFila, altoMinimoDeFila } = CONCLUSIONES_EN_LA_LAMINA;
  const disponible = piso - tope;
  const alto = (filas: number, fila: number) => encabezado + filas * fila + rellenoInferior;

  const unaColumna = cantidades.reduce((n, c) => n + alto(c, altoDeFila), 0) + Math.max(0, cantidades.length - 1) * separacion;
  if (unaColumna <= disponible) {
    let y: number = tope;
    const tarjetas = cantidades.map((filas, indice) => {
      const t = { indice, filas, x, y, ancho, alto: alto(filas, altoDeFila) };
      y += t.alto + separacion;
      return t;
    });
    return { columnas: 1, altoDeFila, tarjetas, omitidas: 0 };
  }

  const anchoDeColumna = (ancho - separacion) / 2;
  const enDosColumnas = (fila: number): { tarjetas: TarjetaDeConclusiones[]; omitidas: number } => {
    const fondo: number[] = [tope, tope];
    const tarjetas: TarjetaDeConclusiones[] = [];
    let omitidas = 0;
    cantidades.forEach((filas, indice) => {
      const columna = fondo[1]! < fondo[0]! ? 1 : 0;
      const y = fondo[columna]!;
      const entran = Math.min(filas, Math.floor((piso - y - encabezado - rellenoInferior) / fila));
      if (entran < 1) {
        omitidas += filas;
        return;
      }
      omitidas += filas - entran;
      tarjetas.push({ indice, filas: entran, x: x + columna * (anchoDeColumna + separacion), y, ancho: anchoDeColumna, alto: alto(entran, fila) });
      fondo[columna] = y + alto(entran, fila) + separacion;
    });
    return { tarjetas, omitidas };
  };

  for (let fila = altoDeFila; fila >= altoMinimoDeFila; fila -= 2) {
    const intento = enDosColumnas(fila);
    if (intento.omitidas === 0) return { columnas: 2, altoDeFila: fila, ...intento };
  }
  return { columnas: 2, altoDeFila: altoMinimoDeFila, ...enDosColumnas(altoMinimoDeFila) };
}

// ─── Serie: varias tomas ────────────────────────────────────────────────────────────────────────

export interface SerieDeValores {
  /** Un valor por toma, en el orden T1…Tn; `null` es una toma sin dato (no es cero). */
  readonly valores: readonly (ValorDeLaLamina | null)[];
  readonly primero: { readonly indice: number; readonly valor: ValorDeLaLamina } | null;
  readonly ultimo: { readonly indice: number; readonly valor: ValorDeLaLamina } | null;
  /** Última menos primera toma con dato, solo si comparten grupo (protocolo, método y unidad). */
  readonly resta: { readonly delta: number; readonly unidad: string; readonly desde: number; readonly hasta: number } | null;
  /** Hay dos tomas con dato, pero la primera y la última no se pueden restar. */
  readonly noComparables: boolean;
}

/**
 * La serie de un sitio o de un resultado (compositor: `serCard` y `serieSlide3`): el último valor, y la diferencia
 * entre la primera y la última toma con dato como una resta con signo. Solo se restan valores que comparten
 * protocolo, método y unidad (REG-06-162); si no, se muestran sin resta.
 */
export function serieDeValores(valores: readonly (ValorDeLaLamina | null)[]): SerieDeValores {
  const conDato = valores.flatMap((v, indice) => (v ? [{ indice, valor: v }] : []));
  const primero = conDato[0] ?? null;
  const ultimo = conDato[conDato.length - 1] ?? null;
  if (!primero || !ultimo || primero.indice === ultimo.indice) return { valores, primero, ultimo, resta: null, noComparables: false };
  if (primero.valor.grupo !== ultimo.valor.grupo) return { valores, primero, ultimo, resta: null, noComparables: true };
  const delta = Number((ultimo.valor.valor - primero.valor.valor).toPrecision(12));
  return { valores, primero, ultimo, resta: { delta, unidad: ultimo.valor.unidad, desde: primero.indice, hasta: ultimo.indice }, noComparables: false };
}

/**
 * Los tramos de línea de un gráfico de Serie: solo entre dos tomas **consecutivas** con dato y del mismo grupo. Una
 * toma sin dato o un valor no comparable cortan la línea; nada cruza un hueco (INV-06-176/177).
 */
export function tramosDeLaSerie(valores: readonly (ValorDeLaLamina | null)[]): readonly (readonly [number, number])[] {
  const tramos: [number, number][] = [];
  for (let i = 1; i < valores.length; i++) {
    const a = valores[i - 1];
    const b = valores[i];
    if (a && b && a.grupo === b.grupo) tramos.push([i - 1, i]);
  }
  return tramos;
}

/** El siguiente valor «redondo» (compositor: `niceCeil`): 1; 1,5; 2; 2,5; 3; 4; 5; 6; 8 o 10 por una potencia de 10. */
export function redondoHaciaArriba(v: number): number {
  if (!(v > 0)) return 1;
  const potencia = 10 ** Math.floor(Math.log10(v));
  const u = v / potencia;
  const n = u <= 1 ? 1 : u <= 1.5 ? 1.5 : u <= 2 ? 2 : u <= 2.5 ? 2.5 : u <= 3 ? 3 : u <= 4 ? 4 : u <= 5 ? 5 : u <= 6 ? 6 : u <= 8 ? 8 : 10;
  return n * potencia;
}

/**
 * La escala vertical de un gráfico de Serie (compositor: `chartSVG`): desde cero hasta el siguiente valor redondo de
 * 1,15 veces el máximo (pliegues, grasa y sumas), o el rango de los valores con un margen de 0,35 del mayor entre el
 * rango, el 3 % del máximo y 0,6. `null` si no hay valores.
 */
export function escalaDelGrafico(valores: readonly number[], desdeCero: boolean): { readonly bajo: number; readonly alto: number } | null {
  if (valores.length === 0) return null;
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  let bajo: number;
  let alto: number;
  if (desdeCero) {
    bajo = 0;
    alto = redondoHaciaArriba(Math.max(maximo, 1) * 1.15);
  } else {
    const rango = Math.max(maximo - minimo, Math.abs(maximo) * 0.03, 0.6);
    alto = maximo + rango * 0.35;
    bajo = Math.max(0, minimo - rango * 0.35);
  }
  if (alto <= bajo) alto = bajo + 1;
  return { bajo, alto };
}

export interface TarjetaDeSerie extends RectanguloEnLaLamina {
  readonly sitio: SitioDibujado;
  readonly lado: 'IZQUIERDA' | 'DERECHA';
  /** Una tarjeta de menos de 280 px achica márgenes y letras (compositor: `compact`). */
  readonly compacta: boolean;
  readonly guia: TrazoDeGuia;
  readonly serie: SerieDeValores;
}

export interface ComposicionDeSerie {
  readonly figura: FiguraDeLaLamina;
  readonly imagen: RectanguloEnLaLamina;
  readonly encuadre: EncuadreDeLaFiguraEnLaLamina;
  readonly sitios: readonly SitioDibujado[];
  readonly tarjetas: readonly TarjetaDeSerie[];
  readonly fueraDelEncuadre: readonly (PerimetroDeLaLamina | PliegueDeLaLamina)[];
}

/**
 * La lámina de varias tomas (compositor: `serieSlide`): la figura centrada y una tarjeta por sitio con dato en alguna
 * toma, en dos columnas según su posición lateral (`repartirEnDosColumnas`), apiladas sin pisarse. La guía sale del
 * borde de la tarjeta que mira a la figura y termina en el sitio.
 */
export function componerSerie(sexo: SexoDeLaLamina, encuadre: EncuadreEnSerie, familia: FamiliaDeLaLamina, tomas: readonly ReadonlyMap<string, ValorDeLaLamina>[]): ComposicionDeSerie {
  const figura = FIGURAS_DE_LA_LAMINA[sexo][encuadre];
  const ubicacion = ENCUADRE_EN_SERIE[encuadre];
  const imagen = ubicarFiguraEnLaLamina(figura, ubicacion);
  const { ancho, xIzquierda, xDerecha, tope, piso, separacion, bajadaDeLaGuia, tramoHorizontal, margenAlAnillo, margenAlPunto } = TARJETAS_EN_SERIE;

  const sitios = clavesDelEncuadre(familia, encuadre)
    .flat()
    .filter((clave) => tomas.some((t) => t.has(clave)))
    .flatMap((clave) => {
      const sitio = sitioDibujado(figura, imagen, clave);
      return sitio ? [sitio] : [];
    });

  const { izquierda, derecha } = repartirEnDosColumnas(sitios.map((s) => ({ x: s.lateral, y: s.cy, sitio: s })));
  const columna = (lista: readonly { sitio: SitioDibujado }[], lado: 'IZQUIERDA' | 'DERECHA'): TarjetaDeSerie[] => {
    if (lista.length === 0) return [];
    const alto = altoDeTarjetaEnSerie(lista.length);
    const bordes = apilarTarjetas(
      lista.map((s) => ({ alto, centroDeseado: s.sitio.cy })),
      { tope, piso, separacion },
    );
    return lista.map(({ sitio }, i) => {
      const x = lado === 'IZQUIERDA' ? xIzquierda : xDerecha;
      const y = bordes[i]!;
      const x0 = lado === 'IZQUIERDA' ? x + ancho : x;
      const x1 = lado === 'IZQUIERDA' ? x0 + tramoHorizontal : x0 - tramoHorizontal;
      const hacia = lado === 'IZQUIERDA' ? -1 : 1;
      const destino: [number, number] = sitio.anillo ? [sitio.anillo.cx + hacia * (sitio.anillo.rx + margenAlAnillo), sitio.cy] : [sitio.cx + hacia * margenAlPunto, sitio.cy];
      return {
        sitio,
        lado,
        x,
        y,
        ancho,
        alto,
        compacta: alto < 280,
        guia: { puntos: [[x0, y + bajadaDeLaGuia], [x1, y + bajadaDeLaGuia], destino], marca: destino, posterior: sitio.posterior },
        serie: serieDeValores(tomas.map((t) => t.get(sitio.clave) ?? null)),
      };
    });
  };

  const enElEncuadre = new Set<string>(clavesDelEncuadre(familia, encuadre).flat());
  const fueraDelEncuadre = clavesDelEncuadre(familia, 'ENTERO')
    .flat()
    .filter((clave) => !enElEncuadre.has(clave) && tomas.some((t) => t.has(clave)));

  return { figura, imagen, encuadre: ubicacion, sitios, tarjetas: [...columna(izquierda, 'IZQUIERDA'), ...columna(derecha, 'DERECHA')], fueraDelEncuadre };
}

/**
 * La franja de Serie, debajo de las fechas (compositor: PESO, % GRASA JP7 y MASA MAGRA). Acá van las mediciones que la
 * figura no ubica: masa, estatura y, en Pliegues, los dos pliegues sin sitio. Los resultados calculados van en la
 * lámina «Evolución», cada uno con su método. Solo las que tienen dato en alguna toma.
 */
export const FRANJA_DE_LA_SERIE: Readonly<Record<Exclude<HojaDeLaLamina, 'CONCLUSIONES'>, readonly { readonly clave: string; readonly rotulo: string }[]>> = {
  CIRCUNFERENCIAS: [
    { clave: 'peso', rotulo: 'PESO' },
    { clave: 'talla', rotulo: 'TALLA' },
  ],
  PLIEGUES: [
    { clave: 'peso', rotulo: 'PESO' },
    { clave: 'pliegue-biceps', rotulo: 'BÍCEPS' },
    { clave: 'pliegue-cresta-iliaca', rotulo: 'CRESTA ILÍACA' },
  ],
};

/** Una serie con nombre para la lámina «Evolución» de Serie. */
export interface SerieConNombre {
  readonly clave: string;
  readonly nombre: string;
  /** El método, para un resultado calculado; `null` para una medición. */
  readonly metodo: string | null;
  readonly categoria: CategoriaDeMetodo | null;
  /** Qué ícono lleva (compositor: `ICONS`). */
  readonly icono: 'peso' | 'grasa' | 'magra' | 'pliegues' | 'cintura';
  /** La escala del gráfico arranca en cero (compositor: % de grasa y suma de pliegues). */
  readonly desdeCero: boolean;
  readonly serie: SerieDeValores;
}

const ICONO_DE_CATEGORIA: Readonly<Record<CategoriaDeMetodo, SerieConNombre['icono']>> = {
  INDICES: 'cintura',
  SUMAS_DE_PLIEGUES: 'pliegues',
  GRASA_CORPORAL: 'grasa',
  MASAS: 'magra',
  SOMATOTIPO: 'magra',
};

/**
 * Las series que puede llevar la lámina «Evolución» de Serie (compositor: `serieSlide3`, con PESO, % GRASA JP7, MASA
 * MAGRA, MÚSCULO, SUMA 7 PLIEGUES y CINTURA): peso y cintura, que son mediciones, y cada resultado calculado de las
 * tomas, **uno por método y versión**, porque dos métodos no se comparan entre sí. Si una toma tiene dos corridas
 * vigentes del mismo método, cuenta la más reciente. Orden neutral: mediciones, y después el del catálogo.
 */
export function seriesDeEvolucion(
  tomas: readonly { readonly evaluacionId: string; readonly valores: ReadonlyMap<string, ValorDeLaLamina> }[],
  corridas: readonly CorridaDeCalculoApi[],
  metodos: readonly Pick<MetodoApi, 'methodVersionId' | 'methodId' | 'category'>[],
): SerieConNombre[] {
  const series: SerieConNombre[] = [];
  for (const [clave, icono] of [
    ['peso', 'peso'],
    ['perimetro-cintura', 'cintura'],
  ] as const) {
    const valores = tomas.map((t) => t.valores.get(clave) ?? null);
    if (valores.some((v) => v)) series.push({ clave: `medicion:${clave}`, nombre: nombreDeMetrica(clave), metodo: null, categoria: null, icono, desdeCero: false, serie: serieDeValores(valores) });
  }

  const porGrupo = new Map<string, { resultado: ResultadoDeLaToma; valores: (ResultadoDeLaToma | null)[] }>();
  tomas.forEach((toma, indice) => {
    for (const r of resultadosDeLaToma(corridas, metodos, toma.evaluacionId)) {
      const fila = porGrupo.get(r.valor.grupo) ?? { resultado: r, valores: tomas.map(() => null) };
      const previo = fila.valores[indice];
      if (!previo || previo.registradoEn < r.registradoEn) fila.valores[indice] = r;
      porGrupo.set(r.valor.grupo, fila);
    }
  });
  const calculadas = [...porGrupo.entries()]
    .map(([grupo, { resultado, valores }]) => ({ grupo, resultado, valores }))
    .sort((a, b) => porCatalogo(a.resultado, b.resultado));
  for (const { grupo, resultado, valores } of calculadas) {
    series.push({
      clave: `calculo:${grupo}`,
      nombre: resultado.nombre,
      metodo: `${resultado.metodo} · v${resultado.version}`,
      categoria: resultado.categoria,
      icono: resultado.categoria ? ICONO_DE_CATEGORIA[resultado.categoria] : 'cintura',
      desdeCero: resultado.categoria === 'GRASA_CORPORAL' || resultado.categoria === 'SUMAS_DE_PLIEGUES',
      serie: serieDeValores(valores.map((v) => v?.valor ?? null)),
    });
  }
  return series;
}

/** Cuántas series entran en la lámina «Evolución» (dos columnas de cuatro), y cuántas van por defecto (las del compositor). */
export const SERIES_EN_EVOLUCION = { maximo: 8, porDefecto: 6 } as const;

/** Dónde van las tarjetas de «Evolución» (compositor: `serieSlide3`, `CW`, `GX`, `GY`, `X0`, `Y0`). */
export const TARJETAS_EN_EVOLUCION = { x: 44, y: 372, ancho: 470, separacionX: 52, separacionY: 22, piso: 1770, altoMaximo: 436 } as const;

/** Las tarjetas de «Evolución»: dos columnas, con el alto que entra para `cantidad` series. */
export function repartirEvolucion(cantidad: number): readonly RectanguloEnLaLamina[] {
  const { x, y, ancho, separacionX, separacionY, piso, altoMaximo } = TARJETAS_EN_EVOLUCION;
  const filas = Math.max(1, Math.ceil(cantidad / 2));
  const alto = Math.min(altoMaximo, Math.floor((piso - y - (filas - 1) * separacionY) / filas));
  return Array.from({ length: cantidad }, (_, i) => ({ x: x + (i % 2) * (ancho + separacionX), y: y + Math.floor(i / 2) * (alto + separacionY), ancho, alto }));
}

// ─── Tomas, fechas y archivo ────────────────────────────────────────────────────────────────────

/** Las tomas en orden de fecha (la más antigua primero): así se numeran T1…Tn. */
export const enOrdenDeFecha = <T extends { readonly occurredAt: string; readonly evaluationId: string }>(tomas: readonly T[]): T[] =>
  [...tomas].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.evaluationId.localeCompare(b.evaluationId));

/** Las tomas de una serie por defecto: las `cantidad` más recientes, en orden de fecha. */
export function tomasPorDefecto<T extends { readonly occurredAt: string; readonly evaluationId: string }>(tomas: readonly T[], cantidad = 4): string[] {
  return enOrdenDeFecha(tomas)
    .slice(-cantidad)
    .map((t) => t.evaluationId);
}

const SLUG_DE_HOJA: Readonly<Record<HojaDeLaLamina, string>> = { CIRCUNFERENCIAS: 'circunferencias', PLIEGUES: 'pliegues', CONCLUSIONES: 'conclusiones' };
const SLUG_DE_ENCUADRE: Readonly<Record<EncuadreDeLaLamina, string>> = { ENTERO: 'entero', TREN_SUPERIOR: 'tren-superior', TREN_INFERIOR: 'tren-inferior' };

/**
 * El nombre del PNG descargado: `lamina-AAAA-MM-DD-hoja-encuadre.png` en Medición y
 * `lamina-serie-AAAA-MM-DD-a-AAAA-MM-DD-hoja-encuadre.png` en Serie (la tercera lámina de Serie es «evolucion»). Las
 * fechas llegan como fechas civiles (`AAAA-MM-DD`).
 */
export function nombreDelArchivoDeLaLamina(o: { readonly modo: ModoDeLaLamina; readonly hoja: HojaDeLaLamina; readonly encuadre: EncuadreDeLaLamina; readonly fechas: readonly string[] }): string {
  const tercera = o.hoja === 'CONCLUSIONES';
  const hoja = tercera && o.modo === 'SERIE' ? 'evolucion' : SLUG_DE_HOJA[o.hoja];
  const encuadre = tercera ? '' : `-${SLUG_DE_ENCUADRE[o.modo === 'SERIE' ? encuadreEnSerie(o.encuadre) : o.encuadre]}`;
  const fechas = o.fechas.filter(Boolean);
  const cuando = o.modo === 'SERIE' ? `serie-${fechas[0] ?? 'sin-fecha'}${fechas.length > 1 ? `-a-${fechas[fechas.length - 1]}` : ''}` : (fechas[0] ?? 'sin-fecha');
  return `lamina-${cuando}-${hoja}${encuadre}.png`;
}

// ─── Texto: medir, cortar y partir ──────────────────────────────────────────────────────────────

/** Cómo mide el texto quien dibuja (en el navegador, un lienzo con la misma fuente). */
export type MedirTexto = (texto: string) => number;

/** El texto entero si entra en `ancho`; si no, cortado con «…». */
export function recortarTexto(texto: string, ancho: number, medir: MedirTexto): string {
  if (medir(texto) <= ancho) return texto;
  let corte = texto.length;
  while (corte > 0 && medir(`${texto.slice(0, corte).trimEnd()}…`) > ancho) corte--;
  return corte > 0 ? `${texto.slice(0, corte).trimEnd()}…` : '…';
}

/** El texto partido en líneas de hasta `ancho`, por palabras; la última línea que no entra se corta con «…». */
export function partirEnLineas(texto: string, ancho: number, medir: MedirTexto, maximoDeLineas = 3): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (medir(prueba) <= ancho || !actual) actual = prueba;
    else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maximoDeLineas) return lineas.map((l) => recortarTexto(l, ancho, medir));
  const visibles = lineas.slice(0, maximoDeLineas);
  visibles[maximoDeLineas - 1] = recortarTexto(`${visibles[maximoDeLineas - 1]} ${lineas.slice(maximoDeLineas).join(' ')}`, ancho, medir);
  return visibles.map((l) => recortarTexto(l, ancho, medir));
}
