'use client';

/**
 * La lámina dibujada (DL-111): el lienzo de 1080 × 1920 del compositor de Dirección
 * (`docs/direccion/BE-VIS-Compositor_v13.3.html`; diseño en `docs/direccion/LAMINA-DEL-COMPOSITOR.md`) como un SVG que
 * se escala al ancho disponible y que «Descargar imagen» rasteriza tal cual.
 *
 * Las capas van en el orden del compositor: fondo, grilla del piso, velo, aura y piso; la figura entre las capas de
 * cada sitio (el anillo completo debajo de la imagen, su mitad trasera punteada y la delantera encima); las guías; las
 * tarjetas; el pie de la lámina; la viñeta; el encabezado y el pie de página. Toda la geometría y los colores salen de
 * `@be/domain` (`figura-de-lamina.ts` y `lamina.ts`): acá no se escribe un color ni una posición calibrada.
 *
 * La lámina **ubica, nunca califica** (RF-048; INV-06-06; DL-073): ningún color depende de un valor, y la diferencia
 * entre tomas es una resta con signo en un solo color. El lector de pantalla no recorre el dibujo: el SVG es una imagen
 * con su descripción, y los datos completos están en el detalle de la evaluación.
 */
import {
  BLOQUE_DE_DIAMETROS,
  COLORES_DE_LA_FIGURA,
  COLORES_DE_LA_LAMINA,
  COPY_ANTROPOMETRIA,
  DIBUJO_EN_MEDICION,
  DIBUJO_EN_SERIE,
  GUIA_EN_MEDICION,
  GUIA_EN_SERIE,
  LIENZO_DE_LA_LAMINA,
  PIE_DE_PLIEGUES,
  PLIEGUES_SIN_SITIO,
  TARJETAS_EN_MEDICION,
  colorDeLaCapa,
  diametrosDeLaToma,
  escalaDelGrafico,
  grillaDelPiso,
  lineaDelDegradado,
  opacidadDeLaCapa,
  partirEnLineas,
  recortarTexto,
  repartirConclusiones,
  repartirEvolucion,
  textoDeDiferenciaAntropometrica,
  textoDelValor,
  tramosDeLaSerie,
  unidadVisible,
  type CapaDelDibujo,
  type ColoresDeLaFigura,
  type ColoresDeLaLamina,
  type ComposicionDeMedicion,
  type ComposicionDeSerie,
  type ElipseEnLaLamina,
  type EncuadreDeLaFiguraEnLaLamina,
  type ModoDeLaLamina,
  type SerieConNombre,
  type SitioDibujado,
  type TarjetaDeSerie,
  type TemaDeLaLamina,
  type TrazoDeGuia,
  type ValorDeLaLamina,
} from '@be/domain';
import type { ReactNode, Ref } from 'react';
import isotipo from '../../../../marca/isotipo-96.png';

const { ancho: SW, alto: SH } = LIENZO_DE_LA_LAMINA;
const SEPARADOR = '\u00a0\u00a0·\u00a0\u00a0';

/**
 * La tipografía: Poppins si está instalada (la del compositor, que la trae embebida); si no, la del website. El PNG
 * descargado usa la misma, porque una imagen SVG solo ve las fuentes del sistema.
 */
export const FUENTE_DE_LA_LAMINA = "Poppins, Inter, 'Segoe UI', Roboto, Arial, sans-serif";

// ─── Texto ──────────────────────────────────────────────────────────────────────────────────────

let contextoDeMedida: CanvasRenderingContext2D | null = null;

/** El ancho de un texto en px de la lámina, medido con un lienzo y la misma fuente. */
function medir(texto: string, tamano: number, peso = 400, espaciado = 0): number {
  if (!contextoDeMedida && typeof document !== 'undefined') contextoDeMedida = document.createElement('canvas').getContext('2d');
  let ancho = texto.length * tamano * 0.56;
  if (contextoDeMedida) {
    contextoDeMedida.font = `${peso} ${tamano}px ${FUENTE_DE_LA_LAMINA}`;
    ancho = contextoDeMedida.measureText(texto).width;
  }
  return ancho + espaciado * texto.length;
}
const medidor = (tamano: number, peso = 400, espaciado = 0) => (texto: string) => medir(texto, tamano, peso, espaciado);

/** La línea de base de un bloque de texto con su borde de arriba en `arriba` (las posiciones del compositor son cajas). */
const baseDesdeArriba = (arriba: number, tamano: number) => arriba + tamano * 1.1;
/** La línea de base de un texto centrado en una fila. */
const baseCentrada = (centro: number, tamano: number) => centro + tamano * 0.35;

const mayusculas = (texto: string) => texto.toLocaleUpperCase('es-AR');

function Texto({
  x,
  y,
  tamano,
  peso = 400,
  color,
  ancla,
  espaciado,
  cifras,
  children,
}: {
  x: number;
  y: number;
  tamano: number;
  peso?: number;
  color: string;
  ancla?: 'start' | 'middle' | 'end';
  espaciado?: number;
  cifras?: boolean;
  children: ReactNode;
}) {
  return (
    <text x={x} y={y} fontSize={tamano} fontWeight={peso} fill={color} textAnchor={ancla} letterSpacing={espaciado} style={cifras ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
      {children}
    </text>
  );
}

// ─── Lienzo, fondo y piezas comunes ─────────────────────────────────────────────────────────────

export interface DatosDelEncabezado {
  /** «CIRCUNFERENCIAS», «PLIEGUES», «CONCLUSIONES» o «EVOLUCIÓN». */
  readonly titulo: string;
  /** Claro y Azul: «NOMBRE · ANTROPOMETRÍA · FECHA». */
  readonly linea: string;
  /** Oscuro: la fecha (o el rango de la serie) en su píldora, y el nombre debajo del título. */
  readonly fecha: string;
  readonly nombre: string | null;
  /** La etiqueta del encuadre, arriba a la derecha; Conclusiones no la lleva. */
  readonly etiqueta: string | null;
}

/** El SVG de la lámina: defs del tema y fondo; cada hoja dibuja lo demás, en orden. */
export function LaminaSvg({ tema, descripcion, refDelSvg, children }: { tema: TemaDeLaLamina; descripcion: string; refDelSvg?: Ref<SVGSVGElement>; children: ReactNode }) {
  const c = COLORES_DE_LA_LAMINA[tema];
  return (
    <svg ref={refDelSvg} className="lamina__svg" viewBox={`0 0 ${SW} ${SH}`} role="img" aria-label={descripcion} fontFamily={FUENTE_DE_LA_LAMINA}>
      <Definiciones c={c} />
      <rect width={SW} height={SH} fill="url(#lamina-fondo)" />
      {children}
    </svg>
  );
}

function Definiciones({ c }: { c: ColoresDeLaLamina }) {
  const linea = lineaDelDegradado(c.fondo.angulo, SW, SH);
  const sombraChica = c.etiqueta.sombra;
  return (
    <defs>
      <linearGradient id="lamina-fondo" gradientUnits="userSpaceOnUse" x1={linea.x1} y1={linea.y1} x2={linea.x2} y2={linea.y2}>
        {c.fondo.paradas.map((p) => (
          <stop key={p.en} offset={p.en} stopColor={p.color} />
        ))}
      </linearGradient>
      {c.vineta ? (
        <radialGradient
          id="lamina-vineta"
          gradientUnits="userSpaceOnUse"
          cx={0}
          cy={0}
          r={1}
          gradientTransform={`translate(${c.vineta.cx * SW} ${c.vineta.cy * SH}) scale(${c.vineta.rx * SW} ${c.vineta.ry * SH})`}
        >
          {c.vineta.paradas.map((p) => (
            <stop key={p.en} offset={p.en} stopColor={p.color} />
          ))}
        </radialGradient>
      ) : null}
      <linearGradient id="lamina-velo" x1={0} y1={0} x2={0} y2={1}>
        {c.velo.map((p) => (
          <stop key={p.en} offset={p.en} stopColor={p.color} />
        ))}
      </linearGradient>
      {/* `closest-side` del compositor: en la caja del óvalo, un radio de la mitad de cada lado. */}
      <radialGradient id="lamina-aura" cx={0.5} cy={0.5} r={0.5}>
        {c.aura.map((p) => (
          <stop key={p.en} offset={p.en} stopColor={p.color} />
        ))}
      </radialGradient>
      <radialGradient id="lamina-piso" cx={0.5} cy={0.5} r={0.5}>
        {c.piso.map((p) => (
          <stop key={p.en} offset={p.en} stopColor={p.color} />
        ))}
      </radialGradient>
      <linearGradient id="lamina-vidrio" x1={0} y1={0} x2={0} y2={1}>
        <stop offset={0} stopColor={c.tarjeta.relleno[0]} />
        <stop offset={1} stopColor={c.tarjeta.relleno[1]} />
      </linearGradient>
      {sombraChica ? (
        <filter id="lamina-sombra-chica" x="-20%" y="-50%" width="140%" height="250%">
          <feDropShadow dx={0} dy={sombraChica.dy} stdDeviation={sombraChica.desenfoque / 2} floodColor={sombraChica.color} floodOpacity={sombraChica.opacidad} />
        </filter>
      ) : null}
    </defs>
  );
}

/** El contorno de un rectángulo de esquinas redondeadas, como trazado. */
const rectanguloRedondeado = (x: number, y: number, ancho: number, alto: number, r: number) =>
  `M ${x + r} ${y} H ${x + ancho - r} A ${r} ${r} 0 0 1 ${x + ancho} ${y + r} V ${y + alto - r} A ${r} ${r} 0 0 1 ${x + ancho - r} ${y + alto} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + alto - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

/**
 * La tarjeta de vidrio (`.gl`): relleno, borde, sombra y, en Oscuro y Azul, la línea clara de arriba (`inset 0 1px 0`).
 * La sombra imita `box-shadow`, que se dibuja solo **por fuera** de la caja: el vidrio es translúcido, y una sombra por
 * debajo (como la de `feDropShadow`) lo oscurecería por dentro.
 */
function Vidrio({ x, y, ancho, alto, c, radio }: { x: number; y: number; ancho: number; alto: number; c: ColoresDeLaLamina; radio?: number }) {
  const r = Math.min(radio ?? c.tarjeta.radio, alto / 2, ancho / 2);
  const s = c.tarjeta.sombra;
  const id = `lamina-vidrio-${Math.round(x)}-${Math.round(y)}-${Math.round(ancho)}-${Math.round(alto)}`;
  // El desenfoque llega a tres desvíos: la región del filtro lleva ese margen alrededor de la sombra.
  const margen = Math.ceil(1.5 * s.desenfoque) + 4;
  return (
    <g>
      <clipPath id={`${id}-fuera`}>
        <path d={`M -400 -400 H ${SW + 400} V ${SH + 400} H -400 Z ${rectanguloRedondeado(x, y, ancho, alto, r)}`} clipRule="evenodd" />
      </clipPath>
      <filter id={`${id}-sombra`} filterUnits="userSpaceOnUse" x={x - margen} y={y + s.dy - margen} width={ancho + 2 * margen} height={alto + 2 * margen}>
        <feGaussianBlur stdDeviation={s.desenfoque / 2} />
      </filter>
      <g clipPath={`url(#${id}-fuera)`}>
        <rect x={x} y={y + s.dy} width={ancho} height={alto} rx={r} fill={s.color} opacity={s.opacidad} filter={`url(#${id}-sombra)`} />
      </g>
      <rect x={x} y={y} width={ancho} height={alto} rx={r} fill="url(#lamina-vidrio)" stroke={c.tarjeta.borde} strokeWidth={1} />
      {c.tarjeta.brillo ? <path d={`M ${x + r} ${y + 1.5} H ${x + ancho - r}`} stroke={c.tarjeta.brillo} strokeWidth={1} fill="none" /> : null}
    </g>
  );
}

/** El aura, la grilla del piso y el velo detrás de la figura (compositor: `auraHTML` y `serieAura`). */
function AuraYPiso({ encuadre, modo, cf }: { encuadre: EncuadreDeLaFiguraEnLaLamina; modo: ModoDeLaLamina; cf: ColoresDeLaFigura }) {
  const pies = encuadre.arriba + encuadre.altoDelCuerpo;
  const centroY = encuadre.arriba + encuadre.altoDelCuerpo * 0.45;
  const grilla = grillaDelPiso(encuadre, modo);
  const medicion = modo === 'MEDICION';
  const [radioX, radioY] = medicion ? [430, 620] : [370, 520];
  const [pisoX, pisoArriba, pisoAncho, pisoAlto] = medicion ? [290, 34, 580, 96] : [250, 28, 500, 82];
  return (
    <g>
      {grilla.elipses.map((e) => (
        <ellipse key={e.rx} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={cf.grilla} strokeWidth={2} opacity={cf.opacidadGrilla * e.opacidad} />
      ))}
      {grilla.rayos.map((r) => (
        <line key={r.x2} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={cf.grilla} strokeWidth={2} opacity={cf.opacidadGrilla * r.opacidad} />
      ))}
      {medicion ? <rect x={0} y={0} width={SW} height={Math.max(0, pies - 260)} fill="url(#lamina-velo)" /> : null}
      <rect x={encuadre.centroX - radioX} y={centroY - radioY} width={radioX * 2} height={radioY * 2} fill="url(#lamina-aura)" />
      {encuadre.conPiso ? <rect x={encuadre.centroX - pisoX} y={pies - pisoArriba} width={pisoAncho} height={pisoAlto} fill="url(#lamina-piso)" /> : null}
    </g>
  );
}

function Vineta({ c }: { c: ColoresDeLaLamina }) {
  return c.vineta ? <rect width={SW} height={SH} fill="url(#lamina-vineta)" /> : null;
}

/** Encabezado (compositor: `slideHead` y `serieHead`): limpio en Claro y Azul; con píldoras en Oscuro. */
function Encabezado({ c, datos }: { c: ColoresDeLaLamina; datos: DatosDelEncabezado }) {
  const etiqueta = datos.etiqueta ? <Etiqueta c={c} texto={datos.etiqueta} /> : null;
  if (c.encabezado.estilo === 'LIMPIO') {
    return (
      <g>
        <Texto x={SW / 2} y={baseDesdeArriba(88, 56)} tamano={56} peso={700} espaciado={0.5} color={c.encabezado.titulo} ancla="middle">
          {datos.titulo}
        </Texto>
        <Texto x={SW / 2} y={baseDesdeArriba(158, 19)} tamano={19} peso={500} espaciado={1.6} color={c.encabezado.subtitulo} ancla="middle">
          {recortarTexto(datos.linea, SW - 120, medidor(19, 500, 1.6))}
        </Texto>
        {etiqueta}
      </g>
    );
  }
  const anchoDeFecha = Math.max(196, medir(datos.fecha, 21, 500) + 44);
  const anchoDelTitulo = medir(datos.titulo, 36, 700, 1.5) + 88;
  return (
    <g>
      <Vidrio x={52} y={56} ancho={anchoDeFecha} alto={54} radio={27} c={c} />
      <Texto x={52 + anchoDeFecha / 2} y={baseCentrada(83, 21)} tamano={21} peso={500} color={c.encabezado.fechaEnPildora} ancla="middle">
        {datos.fecha}
      </Texto>
      <Vidrio x={SW / 2 - anchoDelTitulo / 2} y={48} ancho={anchoDelTitulo} alto={70} radio={35} c={c} />
      <Texto x={SW / 2} y={baseCentrada(83, 36)} tamano={36} peso={700} espaciado={1.5} color={c.encabezado.titulo} ancla="middle">
        {datos.titulo}
      </Texto>
      {datos.nombre ? (
        <Texto x={SW / 2} y={baseDesdeArriba(138, 20)} tamano={20} peso={500} espaciado={3} color={c.encabezado.subtitulo} ancla="middle">
          {recortarTexto(mayusculas(datos.nombre), SW - 120, medidor(20, 500, 3))}
        </Texto>
      ) : null}
      {etiqueta}
    </g>
  );
}

/** La etiqueta del encuadre (`.pillTag`): arriba a la derecha, a 52 px del borde. */
function Etiqueta({ c, texto }: { c: ColoresDeLaLamina; texto: string }) {
  const ancho = medir(texto, 17, 500, 1) + 52;
  const x = SW - 52 - ancho;
  return (
    <g>
      <rect
        x={x}
        y={60}
        width={ancho}
        height={46}
        rx={23}
        fill={c.etiqueta.fondo}
        stroke={c.etiqueta.borde}
        strokeWidth={c.etiqueta.grosorDelBorde}
        filter={c.etiqueta.sombra ? 'url(#lamina-sombra-chica)' : undefined}
      />
      <Texto x={x + 26} y={baseCentrada(83, 17)} tamano={17} peso={500} espaciado={1} color={c.etiqueta.texto}>
        {texto}
      </Texto>
    </g>
  );
}

/** El pie de página (compositor: `footHTML`): el isotipo de BE y «BETTER EVERYDAY». */
function PieDePagina({ c }: { c: ColoresDeLaLamina }) {
  return (
    <g>
      <image href={isotipo.src} x={SW / 2 - 20} y={1826} width={40} height={40} />
      <Texto x={SW / 2} y={baseDesdeArriba(1886, 13)} tamano={13} peso={500} espaciado={4} color={c.firma} ancla="middle">
        BETTER EVERYDAY
      </Texto>
    </g>
  );
}

/** Una lámina sin datos que mostrar: el encabezado, la nota y el pie (compositor: `emptyNote`). */
export function HojaConNota({ tema, titulo, texto, encabezado }: { tema: TemaDeLaLamina; titulo: string; texto: string; encabezado: DatosDelEncabezado }) {
  const c = COLORES_DE_LA_LAMINA[tema];
  return (
    <>
      <NotaVacia c={c} titulo={titulo} texto={texto} />
      <Vineta c={c} />
      <Encabezado c={c} datos={encabezado} />
      <PieDePagina c={c} />
    </>
  );
}

/** Una tarjeta con un mensaje en lugar de datos (compositor: `emptyNote`). */
function NotaVacia({ c, titulo, texto, y = 830 }: { c: ColoresDeLaLamina; titulo: string; texto: string; y?: number }) {
  const lineas = partirEnLineas(texto, 680, medidor(16, 500, 0.4), 3);
  return (
    <g>
      <Vidrio x={140} y={y} ancho={800} alto={230} c={c} />
      <Texto x={SW / 2} y={baseDesdeArriba(y + 50, 25)} tamano={25} peso={500} color={c.tarjetaTitulo} ancla="middle">
        {titulo}
      </Texto>
      {lineas.map((linea, i) => (
        <Texto key={linea} x={SW / 2} y={baseDesdeArriba(y + 112 + i * 28, 16)} tamano={16} peso={500} espaciado={0.4} color={c.pie.rotulo} ancla="middle">
          {linea}
        </Texto>
      ))}
    </g>
  );
}

// ─── La figura y sus sitios ─────────────────────────────────────────────────────────────────────

/** Media elipse o la elipse entera. La delantera es la mitad de abajo (de 0 a π); la trasera, la de arriba. */
function arco({ cx, cy, rx, ry }: ElipseEnLaLamina, tramo: 'COMPLETO' | 'DELANTERO' | 'TRASERO'): string {
  if (tramo === 'DELANTERO') return `M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`;
  if (tramo === 'TRASERO') return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;
}

function CapasDelSitio({ sitio, capas, cf }: { sitio: SitioDibujado; capas: readonly CapaDelDibujo[]; cf: ColoresDeLaFigura }) {
  return (
    <>
      {capas.map((capa, i) => {
        const color = colorDeLaCapa(capa, cf);
        if (!color) return null;
        const opacidad = opacidadDeLaCapa(capa, cf);
        const pintura =
          capa.grosor !== undefined ? { fill: 'none', stroke: color, strokeWidth: capa.grosor, strokeDasharray: capa.guiones ? capa.guiones.join(' ') : undefined } : { fill: color };
        if (sitio.anillo && capa.tramo) return <path key={i} d={arco(sitio.anillo, capa.tramo)} opacity={opacidad} {...pintura} />;
        if (capa.radio !== undefined) return <circle key={i} cx={sitio.cx} cy={sitio.cy} r={capa.radio} opacity={opacidad} {...pintura} />;
        return null;
      })}
    </>
  );
}

/** La imagen entre las capas de cada sitio: lo de abajo lo tapa el cuerpo y asoma por los bordes. */
function FiguraConSitios({ comp, modo, cf }: { comp: Pick<ComposicionDeMedicion, 'figura' | 'imagen' | 'sitios'>; modo: ModoDeLaLamina; cf: ColoresDeLaFigura }) {
  const dibujo = modo === 'MEDICION' ? DIBUJO_EN_MEDICION : DIBUJO_EN_SERIE;
  const receta = (s: SitioDibujado) => (s.anillo ? dibujo.anillo : s.posterior ? dibujo.plieguePosterior : dibujo.pliegue);
  return (
    <g>
      {comp.sitios.map((s) => (
        <CapasDelSitio key={`debajo-${s.clave}`} sitio={s} capas={receta(s).debajo} cf={cf} />
      ))}
      <image href={`/figura/${comp.figura.archivo}`} x={comp.imagen.x} y={comp.imagen.y} width={comp.imagen.ancho} height={comp.imagen.alto} preserveAspectRatio="none" />
      {comp.sitios.map((s) => (
        <CapasDelSitio key={`encima-${s.clave}`} sitio={s} capas={receta(s).encima} cf={cf} />
      ))}
    </g>
  );
}

function Guia({ guia, modo, cf }: { guia: TrazoDeGuia; modo: ModoDeLaLamina; cf: ColoresDeLaFigura }) {
  const trazos = modo === 'MEDICION' ? GUIA_EN_MEDICION : GUIA_EN_SERIE;
  const t = guia.posterior ? trazos.posterior : trazos.normal;
  return (
    <g>
      <path d={`M ${guia.puntos.map((p) => p.join(' ')).join(' L ')}`} fill="none" stroke={cf[t.color]} strokeWidth={t.grosor} strokeDasharray={t.guiones.join(' ')} />
      <circle cx={guia.marca[0]} cy={guia.marca[1]} r={t.radioDelPunto} fill={cf[t.colorDelPunto]} />
    </g>
  );
}

/** La marca «posterior» (`.postTag`) después del rótulo de un pliegue de la cara posterior. */
function MarcaPosterior({ c, x, centro }: { c: ColoresDeLaLamina; x: number; centro: number }) {
  const texto = COPY_ANTROPOMETRIA.laminaPosterior;
  const ancho = medir(texto, 14, 500, 0.5) + 18;
  return (
    <g>
      <rect x={x} y={centro - 12} width={ancho} height={24} rx={7} fill={c.marcaPosterior.fondo} stroke={c.marcaPosterior.borde} strokeWidth={1} />
      <Texto x={x + 9} y={baseCentrada(centro, 14)} tamano={14} peso={500} espaciado={0.5} color={c.marcaPosterior.texto}>
        {texto}
      </Texto>
    </g>
  );
}
const anchoDeLaMarcaPosterior = () => medir(COPY_ANTROPOMETRIA.laminaPosterior, 14, 500, 0.5) + 18;

// ─── Medición: Circunferencias y Pliegues ───────────────────────────────────────────────────────

/**
 * Una toma sobre la figura (compositor: `slide1` y `slide2`): las tarjetas a la izquierda, una fila por sitio con
 * valor, y al pie los diámetros óseos (Circunferencias) o los pliegues sin sitio en la figura (Pliegues).
 */
export function HojaDeMedicion({
  tema,
  comp,
  hoja,
  valores,
  suma,
  encabezado,
}: {
  tema: TemaDeLaLamina;
  comp: ComposicionDeMedicion;
  hoja: 'CIRCUNFERENCIAS' | 'PLIEGUES';
  valores: ReadonlyMap<string, ValorDeLaLamina>;
  /** La suma de 7 pliegues de Jackson y Pollock calculada para la toma, para el pie de Pliegues. */
  suma: ValorDeLaLamina | null;
  encabezado: DatosDelEncabezado;
}) {
  const c = COLORES_DE_LA_LAMINA[tema];
  const cf = COLORES_DE_LA_FIGURA[tema];
  return (
    <>
      <AuraYPiso encuadre={comp.encuadre} modo="MEDICION" cf={cf} />
      <FiguraConSitios comp={comp} modo="MEDICION" cf={cf} />
      {comp.guias.map((g) => (
        <Guia key={`${g.puntos[0]![1]}`} guia={g} modo="MEDICION" cf={cf} />
      ))}
      {comp.tarjetas.map((t) => (
        <g key={t.filas[0]!.sitio.clave}>
          <Vidrio x={t.x} y={t.y} ancho={t.ancho} alto={t.alto} c={c} />
          {t.filas.map((f, i) => (
            <g key={f.sitio.clave}>
              {i > 0 ? <rect x={t.x + 26} y={t.y + TARJETAS_EN_MEDICION.relleno + i * TARJETAS_EN_MEDICION.altoDeFila} width={t.ancho - 52} height={1} fill={c.fila.separador} /> : null}
              <FilaDeValor c={c} x={t.x} ancho={t.ancho} centro={f.centro} rotulo={f.sitio.rotulo} posterior={f.sitio.posterior} valor={f.valor} />
            </g>
          ))}
        </g>
      ))}
      {comp.tarjetas.length === 0 ? <NotaVacia c={c} titulo={COPY_ANTROPOMETRIA.laminaSinMedidasTitulo} texto={COPY_ANTROPOMETRIA.laminaSinMedidas} /> : null}
      {hoja === 'CIRCUNFERENCIAS' ? <PieDeDiametros c={c} valores={valores} /> : <PieDePliegues c={c} valores={valores} dibujados={comp.sitios.length} suma={suma} />}
      <Vineta c={c} />
      <Encabezado c={c} datos={encabezado} />
      <PieDePagina c={c} />
    </>
  );
}

/** Una fila de tarjeta (compositor: `panelHTML`): el rótulo, el valor y la unidad, a 26 px de los bordes. */
function FilaDeValor({ c, x, ancho, centro, rotulo, posterior, valor }: { c: ColoresDeLaLamina; x: number; ancho: number; centro: number; rotulo: string; posterior: boolean; valor: ValorDeLaLamina }) {
  const unidad = unidadVisible(valor.unidad);
  const derechaDelValor = x + ancho - 26 - (unidad ? 46 : 0);
  return (
    <g>
      <Texto x={x + 26} y={baseCentrada(centro, 24)} tamano={24} color={posterior ? c.fila.rotuloPosterior : c.fila.rotulo}>
        {rotulo}
      </Texto>
      {posterior ? <MarcaPosterior c={c} x={x + 26 + medir(rotulo, 24) + 9} centro={centro} /> : null}
      <Texto x={derechaDelValor} y={baseCentrada(centro, 32)} tamano={32} peso={700} color={c.fila.valor} ancla="end" cifras>
        {textoDelValor(valor)}
      </Texto>
      {unidad ? (
        <Texto x={x + ancho - 62} y={baseCentrada(centro, 17)} tamano={17} peso={500} color={c.fila.unidad}>
          {unidad}
        </Texto>
      ) : null}
    </g>
  );
}

/** «DIÁMETROS ÓSEOS» (compositor: `slide1`): solo si la toma tiene alguno; el que falta dice «—». */
function PieDeDiametros({ c, valores }: { c: ColoresDeLaLamina; valores: ReadonlyMap<string, ValorDeLaLamina> }) {
  const diametros = diametrosDeLaToma(valores);
  if (diametros.length === 0) return null;
  const { titulo, tituloX, tituloY, x, paso, y, ancho, alto } = BLOQUE_DE_DIAMETROS;
  const centro = y + alto / 2;
  return (
    <g>
      <Texto x={tituloX} y={baseDesdeArriba(tituloY, 16)} tamano={16} peso={500} espaciado={2.5} color={c.rotuloDeBloque}>
        {titulo}
      </Texto>
      {diametros.map((d, i) => {
        const izquierda = x + i * paso;
        return (
          <g key={d.clave}>
            <Vidrio x={izquierda} y={y} ancho={ancho} alto={alto} c={c} />
            <Texto x={izquierda + 24} y={baseCentrada(centro, 24)} tamano={24} color={c.fila.rotulo}>
              {d.rotulo}
            </Texto>
            <Texto x={izquierda + ancho - (d.valor ? 62 : 24)} y={baseCentrada(centro, 32)} tamano={32} peso={700} color={c.fila.valor} ancla="end" cifras>
              {d.valor ? textoDelValor(d.valor) : '—'}
            </Texto>
            {d.valor ? (
              <Texto x={izquierda + ancho - 24} y={baseCentrada(centro, 17) + 1} tamano={17} peso={500} color={c.fila.unidad} ancla="end">
                {unidadVisible(d.valor.unidad)}
              </Texto>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

/**
 * El pie de Pliegues (compositor: `slide2`). El compositor pone «MÉTODO · Jackson-Pollock 7», los sitios dibujados y una
 * «SUMA 7 PLIEGUES» cargada a mano. Acá van los pliegues dibujados, los dos que la figura no ubica (para que no se
 * pierdan) y la suma de Jackson y Pollock **calculada** para la toma, si la hay; los demás resultados van en
 * Conclusiones, cada uno con su método. Lo que falta dice «—», nunca cero.
 */
function PieDePliegues({ c, valores, dibujados, suma }: { c: ColoresDeLaLamina; valores: ReadonlyMap<string, ValorDeLaLamina>; dibujados: number; suma: ValorDeLaLamina | null }) {
  const { x, y, ancho, alto } = PIE_DE_PLIEGUES;
  const conUnidad = (v: ValorDeLaLamina | null | undefined) => (v ? `${textoDelValor(v)} ${unidadVisible(v.unidad)}`.trim() : '—');
  const columnas = [
    { rotulo: COPY_ANTROPOMETRIA.laminaPlieguesEnLaFigura, valor: String(dibujados) },
    ...PLIEGUES_SIN_SITIO.map((p) => ({ rotulo: p.rotulo, valor: conUnidad(valores.get(p.clave)) })),
    { rotulo: COPY_ANTROPOMETRIA.laminaSumaDeSietePliegues, valor: conUnidad(suma) },
  ];
  return (
    <g>
      <Vidrio x={x} y={y} ancho={ancho} alto={alto} c={c} />
      {columnas.map((col, i) => {
        const anchoDeColumna = ancho / columnas.length;
        const centro = x + anchoDeColumna * (i + 0.5);
        const rotulo = mayusculas(col.rotulo);
        const tamano = Math.min(14, (14 * (anchoDeColumna - 20)) / medir(rotulo, 14, 500, 1.5));
        return (
          <g key={col.rotulo}>
            {i > 0 ? <rect x={x + anchoDeColumna * i} y={y + 16} width={1} height={62} fill={c.pie.divisor} /> : null}
            <Texto x={centro} y={baseDesdeArriba(y + 16, 14)} tamano={tamano} peso={500} espaciado={1.5} color={c.pie.rotulo} ancla="middle">
              {rotulo}
            </Texto>
            <Texto x={centro} y={baseDesdeArriba(y + 42, 24)} tamano={24} peso={700} color={c.pie.valor} ancla="middle" cifras>
              {col.valor}
            </Texto>
          </g>
        );
      })}
    </g>
  );
}

// ─── Medición: Conclusiones ─────────────────────────────────────────────────────────────────────

export interface FilaDeConclusiones {
  readonly clave: string;
  readonly rotulo: string;
  /**
   * Una segunda línea, chica: la clase del dato (lo medido), la métrica (un método sin categoría) o la versión (dos
   * corridas del mismo método). Sin ella, el rótulo puede ocupar dos líneas.
   */
  readonly detalle: string | null;
  readonly valor: string;
  readonly unidad: string;
}

export interface SeccionDeLaLamina {
  readonly titulo: string;
  readonly filas: readonly FilaDeConclusiones[];
}

/**
 * Los resultados de la toma (compositor: `slide3`, que muestra números cargados a mano): una tarjeta por categoría de
 * método, cada valor con su método. Sin resultados, lo dice.
 */
export function HojaDeConclusiones({ tema, secciones, sinResultados, encabezado }: { tema: TemaDeLaLamina; secciones: readonly SeccionDeLaLamina[]; sinResultados: boolean; encabezado: DatosDelEncabezado }) {
  const c = COLORES_DE_LA_LAMINA[tema];
  const reparto = repartirConclusiones(secciones.map((s) => s.filas.length));
  const fondoDeLasTarjetas = reparto.tarjetas.reduce((y, t) => Math.max(y, t.y + t.alto), 0);
  return (
    <>
      <rect x={SW / 2 - 520} y={0} width={1040} height={620} fill="url(#lamina-aura)" opacity={0.6} />
      <Texto x={SW / 2} y={baseDesdeArriba(198, 15)} tamano={15} peso={500} espaciado={2} color={c.rotuloDeBloque} ancla="middle">
        {mayusculas(COPY_ANTROPOMETRIA.laminaResultadosCalculados)}
      </Texto>
      {reparto.tarjetas.map((t) => (
        <TarjetaDeConclusiones key={secciones[t.indice]!.titulo} c={c} seccion={secciones[t.indice]!} tarjeta={t} altoDeFila={reparto.altoDeFila} />
      ))}
      {sinResultados ? (
        <NotaVacia
          c={c}
          titulo={COPY_ANTROPOMETRIA.laminaSinResultadosTitulo}
          texto={`${COPY_ANTROPOMETRIA.laminaSinResultados} ${COPY_ANTROPOMETRIA.laminaComoCalcular}`}
          y={Math.max(830, fondoDeLasTarjetas + 40)}
        />
      ) : null}
      <Vineta c={c} />
      <Encabezado c={c} datos={encabezado} />
      <PieDePagina c={c} />
    </>
  );
}

function TarjetaDeConclusiones({
  c,
  seccion,
  tarjeta,
  altoDeFila,
}: {
  c: ColoresDeLaLamina;
  seccion: SeccionDeLaLamina;
  tarjeta: { x: number; y: number; ancho: number; alto: number; filas: number };
  altoDeFila: number;
}) {
  const { x, y, ancho, alto } = tarjeta;
  const filas = seccion.filas.slice(0, tarjeta.filas);
  const anchoDeUnidad = Math.max(0, ...filas.map((f) => (f.unidad ? medir(f.unidad, 16, 500) : 0)));
  const derechaDelValor = x + ancho - 34 - (anchoDeUnidad > 0 ? anchoDeUnidad + 10 : 0);
  return (
    <g>
      <Vidrio x={x} y={y} ancho={ancho} alto={alto} c={c} />
      <Texto x={x + ancho / 2} y={baseDesdeArriba(y + 22, 25)} tamano={25} peso={500} color={c.tarjetaTitulo} ancla="middle">
        {recortarTexto(seccion.titulo, ancho - 64, medidor(25, 500))}
      </Texto>
      <rect x={x + 32} y={y + 70} width={ancho - 64} height={1} fill={c.linea} />
      {filas.map((f, i) => {
        const centro = y + 86 + i * altoDeFila + altoDeFila / 2;
        const izquierdaDelValor = derechaDelValor - medir(f.valor, 28, 700);
        const anchoDelTexto = izquierdaDelValor - 16 - (x + 34);
        return (
          <g key={f.clave}>
            {i > 0 ? <rect x={x + 32} y={y + 86 + i * altoDeFila} width={ancho - 64} height={1} fill={c.lineaSuave} /> : null}
            {f.detalle ? (
              <>
                <Texto x={x + 34} y={centro - 3} tamano={21} color={c.conclusiones.rotulo}>
                  {recortarTexto(f.rotulo, anchoDelTexto, medidor(21))}
                </Texto>
                <Texto x={x + 34} y={centro + 17} tamano={15} color={c.conclusiones.rotuloSuave}>
                  {recortarTexto(f.detalle, anchoDelTexto, medidor(15))}
                </Texto>
              </>
            ) : (
              partirEnLineas(f.rotulo, anchoDelTexto, medidor(20), 2).map((linea, j, lineas) => (
                <Texto key={linea} x={x + 34} y={lineas.length === 1 ? baseCentrada(centro, 21) : centro - 4 + j * 23} tamano={lineas.length === 1 ? 21 : 20} color={c.conclusiones.rotulo}>
                  {linea}
                </Texto>
              ))
            )}
            <Texto x={derechaDelValor} y={baseCentrada(centro, 28)} tamano={28} peso={700} color={c.conclusiones.valor} ancla="end" cifras>
              {f.valor}
            </Texto>
            {f.unidad ? (
              <Texto x={x + ancho - 34 - anchoDeUnidad} y={baseCentrada(centro, 16) + 3} tamano={16} peso={500} color={c.conclusiones.unidad}>
                {f.unidad}
              </Texto>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

// ─── Serie ──────────────────────────────────────────────────────────────────────────────────────

export interface FranjaDeLaSerie {
  readonly rotulo: string;
  readonly valores: readonly (ValorDeLaLamina | null)[];
}

/** Las fechas de la serie (T1…Tn, la última resaltada) y, en Circunferencias y Pliegues, la franja de resumen. */
function CabezaDeSerie({ c, fechas, franja }: { c: ColoresDeLaLamina; fechas: readonly string[]; franja: readonly FranjaDeLaSerie[] | null }) {
  const n = fechas.length;
  const ancho = SW - 88;
  const anchoDeChip = Math.min(310, Math.floor((ancho - (n - 1) * 16) / n));
  const inicio = 44 + (ancho - (anchoDeChip * n + 16 * (n - 1))) / 2;
  return (
    <g>
      {fechas.map((fecha, i) => {
        const x = inicio + i * (anchoDeChip + 16);
        const ultima = i === n - 1;
        const tamanoDeFecha = Math.min(19, (19 * (anchoDeChip - 12)) / Math.max(1, medir(fecha, 19, ultima ? 700 : 500)));
        return (
          <g key={`${fecha}-${i}`}>
            <Vidrio x={x} y={212} ancho={anchoDeChip} alto={120} c={c} />
            <circle
              cx={x + anchoDeChip / 2}
              cy={252}
              r={21.75}
              fill={ultima ? c.serie.chip.fondoActivo : (c.serie.chip.fondo ?? 'none')}
              stroke={ultima ? c.serie.chip.fondoActivo : c.serie.chip.borde}
              strokeWidth={2.5}
            />
            <Texto x={x + anchoDeChip / 2} y={baseCentrada(252, 22)} tamano={22} peso={700} color={ultima ? c.serie.chip.textoActivo : c.serie.chip.texto} ancla="middle">
              {`T${i + 1}`}
            </Texto>
            <Texto x={x + anchoDeChip / 2} y={baseDesdeArriba(289, tamanoDeFecha)} tamano={tamanoDeFecha} peso={ultima ? 700 : 500} color={ultima ? c.serie.fechaActiva : c.serie.fecha} ancla="middle">
              {fecha}
            </Texto>
            {i < n - 1 ? <rect x={x + anchoDeChip + 3} y={270} width={10} height={3} rx={1.5} fill={c.serie.union} /> : null}
          </g>
        );
      })}
      {franja && franja.length > 0 ? <FranjaDeResumen c={c} franja={franja} /> : null}
    </g>
  );
}

/** La franja de resumen (compositor: PESO, % GRASA JP7, MASA MAGRA): T1 → … → Tn, la última resaltada. */
function FranjaDeResumen({ c, franja }: { c: ColoresDeLaLamina; franja: readonly FranjaDeLaSerie[] }) {
  const ancho = SW - 88;
  const k = franja.length;
  return (
    <g>
      <Vidrio x={44} y={352} ancho={ancho} alto={106} c={c} />
      {franja.map((item, i) => {
        const centro = 44 + (ancho * (i + 0.5)) / k;
        const n = item.valores.length;
        const ultimo = [...item.valores].reverse().find((v): v is ValorDeLaLamina => v !== null);
        const unidad = ultimo ? unidadVisible(ultimo.unidad) : '';
        const textos = item.valores.map((v) => (v ? textoDelValor(v) : '—'));
        const cadena = n <= 3 ? textos : [textos[0]!, textos[n - 1]!];
        const tamano = n <= 3 ? 23 : 26;
        const disponible = ancho / k - 24;
        const largo = medir(cadena.join('\u00a0→\u00a0'), tamano, 700);
        const tamanoFinal = largo > disponible ? Math.max(14, (tamano * disponible) / largo) : tamano;
        return (
          <g key={item.rotulo}>
            {i > 0 ? <rect x={44 + (ancho * i) / k} y={371} width={1} height={70} fill={c.pie.divisor} /> : null}
            <Texto x={centro} y={baseDesdeArriba(369, 14)} tamano={14} peso={500} espaciado={1.5} color={c.pie.rotulo} ancla="middle">
              {unidad ? `${item.rotulo} (${unidad})` : item.rotulo}
            </Texto>
            <text x={centro} y={baseDesdeArriba(397, tamanoFinal)} fontSize={tamanoFinal} fontWeight={700} textAnchor="middle" fill={c.pie.valor} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {cadena.map((t, j) => (
                <tspan key={j}>
                  {j > 0 ? <tspan fill={c.pie.rotulo} fontWeight={500}>{'\u00a0→\u00a0'}</tspan> : null}
                  <tspan fill={j === cadena.length - 1 ? c.serie.acento : c.pie.valor}>{t}</tspan>
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Varias tomas sobre la figura centrada (compositor: `serieSlide`): una tarjeta por sitio con dato en alguna toma, a
 * los lados, con el último valor, la diferencia entre la primera y la última toma con dato (si son comparables), un
 * gráfico y los valores de cada toma.
 */
export function HojaDeSerie({
  tema,
  comp,
  fechas,
  franja,
  encabezado,
}: {
  tema: TemaDeLaLamina;
  comp: ComposicionDeSerie;
  fechas: readonly string[];
  franja: readonly FranjaDeLaSerie[];
  encabezado: DatosDelEncabezado;
}) {
  const c = COLORES_DE_LA_LAMINA[tema];
  const cf = COLORES_DE_LA_FIGURA[tema];
  return (
    <>
      <AuraYPiso encuadre={comp.encuadre} modo="SERIE" cf={cf} />
      <FiguraConSitios comp={comp} modo="SERIE" cf={cf} />
      {comp.tarjetas.map((t) => (
        <Guia key={`guia-${t.sitio.clave}`} guia={t.guia} modo="SERIE" cf={cf} />
      ))}
      {comp.tarjetas.map((t) => (
        <TarjetaDeSerieSvg key={t.sitio.clave} c={c} t={t} />
      ))}
      {comp.tarjetas.length === 0 ? <NotaVacia c={c} titulo={COPY_ANTROPOMETRIA.laminaSinMedidasTitulo} texto={COPY_ANTROPOMETRIA.laminaSerieSinMedidas} /> : null}
      <Vineta c={c} />
      <Encabezado c={c} datos={encabezado} />
      <CabezaDeSerie c={c} fechas={fechas} franja={franja} />
      <PieDePagina c={c} />
    </>
  );
}

/** El texto de la diferencia de una serie: la resta con signo, «No comparables» o nada. */
const textoDeLaDiferencia = (s: TarjetaDeSerie['serie']): string | null =>
  s.resta ? textoDeDiferenciaAntropometrica(s.resta) : s.noComparables ? COPY_ANTROPOMETRIA.laminaNoComparables : null;

/** Los valores de cada toma, en una píldora: todos si son seis o menos y entran; si no, el primero y el último. */
function textoDeValores(valores: readonly (ValorDeLaLamina | null)[], ancho: number, tamano: number): { texto: string; tamano: number } {
  const textos = valores.map((v) => (v ? textoDelValor(v) : '—'));
  const conDato = textos.filter((_, i) => valores[i]);
  const extremos = conDato.length > 1 ? `${conDato[0]}\u00a0→\u00a0${conDato[conDato.length - 1]}` : (conDato[0] ?? '—');
  const candidatos = [...(textos.length <= 6 ? [textos.join(SEPARADOR), textos.join(' · ')] : []), extremos];
  for (const texto of candidatos) if (medir(texto, tamano, 700, 0.5) <= ancho) return { texto, tamano };
  const ultimo = candidatos[candidatos.length - 1]!;
  return { texto: ultimo, tamano: Math.max(11, (tamano * ancho) / medir(ultimo, tamano, 700, 0.5)) };
}

/** La tarjeta de un sitio en Serie (compositor: `serCard`). */
function TarjetaDeSerieSvg({ c, t }: { c: ColoresDeLaLamina; t: TarjetaDeSerie }) {
  const relleno = t.compacta ? 14 : 20;
  const arribaDelNombre = t.y + relleno;
  const arribaDelValor = arribaDelNombre + (t.compacta ? 26 : 32);
  const altoDePildora = t.compacta ? 32 : 38;
  const arribaDePildora = t.y + t.alto - relleno + 4 - altoDePildora;
  const util = t.ancho - 2 * relleno;
  const tamanoDelNombre = t.compacta ? 18 : 21;
  const tamanoDelValor = t.compacta ? 32 : 40;
  const { ultimo } = t.serie;
  const valor = ultimo ? textoDelValor(ultimo.valor) : '—';
  const unidad = ultimo ? unidadVisible(ultimo.valor.unidad) : '';
  const anchoDelValor = medir(valor, tamanoDelValor, 700) + (unidad ? medir(`\u00a0${unidad}`, 18, 500) : 0);
  const diferencia = textoDeLaDiferencia(t.serie);
  const tamanoDeDiferencia = t.serie.resta ? (t.compacta ? 18 : 20) : 14;
  const anchoDeDiferencia = diferencia ? medir(diferencia, tamanoDeDiferencia, t.serie.resta ? 700 : 500) : 0;
  // Si la diferencia no entra al lado del valor, va debajo, y el gráfico baja.
  const diferenciaAbajo = diferencia !== null && anchoDelValor + 12 + anchoDeDiferencia > util;
  const arribaDelGrafico = arribaDelValor + (t.compacta ? 44 : 56) + (diferenciaAbajo ? 22 : 0);
  const altoDelGrafico = Math.max(40, arribaDePildora - 8 - arribaDelGrafico);
  const marca = t.sitio.posterior ? anchoDeLaMarcaPosterior() + 9 : 0;
  const pildora = textoDeValores(t.serie.valores, util - 16, t.compacta ? 16 : 18);
  const baseDelValor = arribaDelValor + tamanoDelValor * 0.85;
  return (
    <g>
      <Vidrio x={t.x} y={t.y} ancho={t.ancho} alto={t.alto} c={c} />
      <Texto x={t.x + relleno} y={baseDesdeArriba(arribaDelNombre, tamanoDelNombre)} tamano={tamanoDelNombre} peso={700} espaciado={0.3} color={c.serie.nombre}>
        {recortarTexto(t.sitio.rotulo, util - marca, medidor(tamanoDelNombre, 700, 0.3))}
      </Texto>
      {t.sitio.posterior ? (
        <MarcaPosterior c={c} x={t.x + relleno + medir(t.sitio.rotulo, tamanoDelNombre, 700, 0.3) + 9} centro={arribaDelNombre + tamanoDelNombre * 0.75} />
      ) : null}
      <text x={t.x + relleno} y={baseDelValor} fontSize={tamanoDelValor} fontWeight={700} fill={c.serie.valor} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {valor}
        {unidad ? (
          <tspan fontSize={18} fontWeight={500} fill={c.serie.unidad}>
            {`\u00a0${unidad}`}
          </tspan>
        ) : null}
      </text>
      {diferencia ? (
        <Texto
          x={t.x + t.ancho - relleno}
          y={diferenciaAbajo ? baseDelValor + tamanoDeDiferencia + 8 : baseDesdeArriba(arribaDelValor + (t.compacta ? 9 : 14), tamanoDeDiferencia)}
          tamano={tamanoDeDiferencia}
          peso={t.serie.resta ? 700 : 500}
          color={t.serie.resta ? c.serie.diferencia.texto : c.serie.rotulo}
          ancla="end"
          cifras
        >
          {diferencia}
        </Texto>
      ) : null}
      <GraficoDeSerie c={c} x={t.x + relleno} y={arribaDelGrafico} ancho={util} alto={altoDelGrafico} valores={t.serie.valores} desdeCero={t.sitio.punto !== null} grande={false} />
      <rect x={t.x + relleno} y={arribaDePildora} width={util} height={altoDePildora} rx={12} fill={c.serie.valores.fondo} />
      <Texto x={t.x + relleno + util / 2} y={baseCentrada(arribaDePildora + altoDePildora / 2, pildora.tamano)} tamano={pildora.tamano} peso={700} espaciado={0.5} color={c.serie.valores.texto} ancla="middle" cifras>
        {pildora.texto}
      </Texto>
    </g>
  );
}

/**
 * El gráfico de una serie (compositor: `chartSVG`). La línea une solo tomas consecutivas con dato y comparables: una
 * toma sin dato corta la línea y no lleva punto, nunca un valor puesto en el medio (INV-06-176/177). Se dibujan los
 * valores en la unidad del último; uno en otra unidad queda solo en la lista de valores.
 */
function GraficoDeSerie({
  c,
  x,
  y,
  ancho,
  alto,
  valores,
  desdeCero,
  grande,
}: {
  c: ColoresDeLaLamina;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  valores: readonly (ValorDeLaLamina | null)[];
  desdeCero: boolean;
  grande: boolean;
}) {
  const ultimo = [...valores].reverse().find((v): v is ValorDeLaLamina => v !== null);
  if (!ultimo) return null;
  const dibujables = valores.map((v) => (v && v.unidad === ultimo.unidad ? v : null));
  const escala = escalaDelGrafico(
    dibujables.flatMap((v) => (v ? [v.valor] : [])),
    desdeCero,
  );
  if (!escala) return null;
  const n = valores.length;
  const [izquierda, derecha, arriba, abajo] = grande ? [58, 16, 32, 28] : [44, 10, 10, 22];
  const anchoUtil = ancho - izquierda - derecha;
  const altoUtil = alto - arriba - abajo;
  const X = (i: number) => x + izquierda + (n === 1 ? anchoUtil / 2 : (anchoUtil * i) / (n - 1));
  const Y = (v: number) => y + arriba + altoUtil * (1 - (v - escala.bajo) / (escala.alto - escala.bajo));
  const rango = escala.alto - escala.bajo;
  const marcaDelEje = (v: number) => (rango < 8 && Math.abs(v % 1) > 1e-9 ? v.toFixed(1).replace('.', ',') : String(Math.round(v)));
  const g = c.serie.grafico;
  return (
    <g>
      {[escala.bajo, (escala.bajo + escala.alto) / 2, escala.alto].map((v, i) => (
        <g key={i}>
          <line x1={x + izquierda} y1={Y(v)} x2={x + ancho - derecha} y2={Y(v)} stroke={g.pista} strokeWidth={i === 0 ? 2 : 1.3} />
          <Texto x={x + izquierda - 9} y={Y(v) + 5} tamano={grande ? 17 : 13} color={g.rotulo} ancla="end">
            {marcaDelEje(v)}
          </Texto>
        </g>
      ))}
      {tramosDeLaSerie(dibujables).map(([a, b]) => (
        <line key={`${a}-${b}`} x1={X(a)} y1={Y(dibujables[a]!.valor)} x2={X(b)} y2={Y(dibujables[b]!.valor)} stroke={g.linea} strokeWidth={grande ? 4 : 3} strokeLinecap="round" />
      ))}
      {valores.map((_, i) => (
        <Texto key={`t-${i}`} x={X(i)} y={y + alto - 3} tamano={grande ? 16 : 13} color={g.rotulo} ancla="middle">
          {`T${i + 1}`}
        </Texto>
      ))}
      {dibujables.map((v, i) =>
        v ? <circle key={`p-${i}`} cx={X(i)} cy={Y(v.valor)} r={grande ? 7 : 5} fill={g.puntoRelleno} stroke={g.linea} strokeWidth={grande ? 3.2 : 2.6} /> : null,
      )}
      {grande
        ? dibujables.map((v, i) => {
            if (!v) return null;
            const yDelRotulo = Y(v.valor) - 15 < y + 18 ? Y(v.valor) + 34 : Y(v.valor) - 15;
            const ancla = n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 ? 'end' : 'middle';
            const xDelRotulo = ancla === 'start' ? X(i) - 6 : ancla === 'end' ? X(i) + 6 : X(i);
            return (
              <Texto key={`v-${i}`} x={xDelRotulo} y={yDelRotulo} tamano={19} peso={700} color={g.valor} ancla={ancla} cifras>
                {textoDelValor(v)}
              </Texto>
            );
          })
        : null}
    </g>
  );
}

// ─── Serie: Evolución ───────────────────────────────────────────────────────────────────────────

/** Los íconos de las tarjetas de «Evolución» (compositor: `ICONS`), en una caja de 24 × 24. */
function Icono({ cual }: { cual: SerieConNombre['icono'] }) {
  switch (cual) {
    case 'peso':
      return (
        <>
          <rect x={3.6} y={4.6} width={16.8} height={14.8} rx={3.6} />
          <path d="M8 10.4a5 5 0 0 1 8 0" />
          <path d="M12 13.8 14.6 10.6" />
        </>
      );
    case 'grasa':
      return (
        <>
          <circle cx={12} cy={12} r={8.6} />
          <path d="M8.6 15.4 15.4 8.6" />
          <circle cx={9.4} cy={9.4} r={1.35} />
          <circle cx={14.6} cy={14.6} r={1.35} />
        </>
      );
    case 'magra':
      return (
        <>
          <circle cx={12} cy={6} r={3.1} />
          <path d="M5 20v-2.2C5 14.3 8.1 11.6 12 11.6s7 2.7 7 6.2V20" />
        </>
      );
    case 'pliegues':
      return (
        <>
          <path d="M6.4 4 11 12l-4.6 8" />
          <path d="M17.6 4 13 12l4.6 8" />
          <path d="M11 12h2" />
        </>
      );
    default:
      return (
        <>
          <circle cx={12} cy={12} r={8.4} />
          <path d="M12 3.6v3.1M20.4 12h-3.1M12 20.4v-3.1M3.6 12h3.1" />
        </>
      );
  }
}

/**
 * La lámina «Evolución» de Serie (compositor: `serieSlide3`): una tarjeta por serie elegida, con el último valor, la
 * diferencia entre la primera y la última toma con dato en una píldora del color neutro, y el gráfico.
 */
export function HojaDeEvolucion({ tema, series, fechas, pie, encabezado }: { tema: TemaDeLaLamina; series: readonly SerieConNombre[]; fechas: readonly string[]; pie: string; encabezado: DatosDelEncabezado }) {
  const c = COLORES_DE_LA_LAMINA[tema];
  const lugares = repartirEvolucion(series.length);
  return (
    <>
      {series.map((s, i) => (
        <TarjetaDeEvolucion key={s.clave} c={c} s={s} lugar={lugares[i]!} />
      ))}
      {series.length === 0 ? <NotaVacia c={c} titulo={COPY_ANTROPOMETRIA.laminaSinMedidasTitulo} texto={COPY_ANTROPOMETRIA.laminaEvolucionSinSeries} /> : null}
      <Texto x={SW / 2} y={baseDesdeArriba(1786, 14)} tamano={14} peso={500} espaciado={2.4} color={c.pie.rotulo} ancla="middle">
        {recortarTexto(pie, SW - 88, medidor(14, 500, 2.4))}
      </Texto>
      <Vineta c={c} />
      <Encabezado c={c} datos={encabezado} />
      <CabezaDeSerie c={c} fechas={fechas} franja={null} />
      <PieDePagina c={c} />
    </>
  );
}

function TarjetaDeEvolucion({ c, s, lugar }: { c: ColoresDeLaLamina; s: SerieConNombre; lugar: { x: number; y: number; ancho: number; alto: number } }) {
  const { x, y, ancho, alto } = lugar;
  const util = ancho - 52;
  const { ultimo } = s.serie;
  const valor = ultimo ? textoDelValor(ultimo.valor) : '—';
  const unidad = ultimo ? unidadVisible(ultimo.valor.unidad) : '';
  const diferencia = textoDeLaDiferencia(s.serie) ?? '—';
  const anchoDePildora = Math.max(util * 0.52, medir(diferencia, 20, 700) + 36);
  return (
    <g>
      <Vidrio x={x} y={y} ancho={ancho} alto={alto} c={c} />
      <rect x={x + 26} y={y + 24} width={56} height={56} rx={17} fill={c.serie.insignia.fondo} stroke={c.serie.insignia.borde} strokeWidth={1} />
      <g transform={`translate(${x + 26 + 13.5} ${y + 24 + 13.5}) scale(${29 / 24})`} fill="none" stroke={c.serie.grafico.linea} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Icono cual={s.icono} />
      </g>
      <Texto x={x + 98} y={y + 46} tamano={15} peso={500} espaciado={2.2} color={c.serie.rotulo}>
        {recortarTexto(mayusculas(s.nombre), ancho - 98 - 26, medidor(15, 500, 2.2))}
      </Texto>
      {s.metodo ? (
        <Texto x={x + 98} y={y + 68} tamano={13} color={c.serie.rotulo}>
          {recortarTexto(s.metodo, ancho - 98 - 26, medidor(13))}
        </Texto>
      ) : null}
      <text x={x + 98} y={y + 106} fontSize={34} fontWeight={700} fill={c.serie.valor} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {valor}
        {unidad ? (
          <tspan fontSize={17} fontWeight={500} fill={c.serie.unidad}>
            {`\u00a0${unidad}`}
          </tspan>
        ) : null}
      </text>
      <rect x={x + 26} y={y + 120} width={anchoDePildora} height={40} rx={20} fill={c.serie.diferencia.fondo} stroke={c.serie.diferencia.borde} strokeWidth={1} />
      <Texto x={x + 26 + anchoDePildora / 2} y={baseCentrada(y + 140, 20)} tamano={s.serie.resta ? 20 : 15} peso={s.serie.resta ? 700 : 500} color={c.serie.diferencia.texto} ancla="middle" cifras>
        {diferencia}
      </Texto>
      <rect x={x + 26} y={y + 174} width={util} height={1} fill={c.lineaSuave} />
      <GraficoDeSerie c={c} x={x + 26} y={y + 180} ancho={util} alto={Math.max(60, alto - 202)} valores={s.serie.valores} desdeCero={s.desdeCero} grande />
    </g>
  );
}
