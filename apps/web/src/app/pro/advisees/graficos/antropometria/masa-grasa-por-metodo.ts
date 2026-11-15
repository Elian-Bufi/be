/**
 * GR-20 · La masa grasa según cada método, en un eje común (WP-GRAFICOS fase 2, rama C; DL-174): ¿cuántos kg de masa
 * grasa estima cada método en cada toma, y cuánto se separan entre sí?
 *
 * - Un panel por tipo de masa: la masa grasa según Durnin y Womersley y según Faulkner **en un eje común** (uno propio
 *   por método agrandaría cualquier diferencia chica); la masa libre de grasa, en otro panel con su propio eje común; la
 *   masa muscular esquelética de Lee, aparte, porque estima otra cosa.
 * - Cada método con su forma (círculo o cuadrado) y su versión en la lectura; lo calculado lleva su punto adentro.
 * - **Solo puntos**: nada une dos tomas (B10-07; GR-D5). Lo único que se une es lo de la misma toma: una línea fina entre
 *   dos métodos dice cuánto se separan (GR-T47), y eso no es un cambio.
 * - Los dos métodos salen de los mismos pliegues de la misma toma: que se muevan juntos es por construcción, y se dice.
 *   Cada número es la estimación de un método, nunca una medición directa de la grasa de la persona.
 *
 * La pasada visual de la rama C (DISENO-VISUAL §2 «C»; GR-VC05 y GR-VC06):
 * - **Con menos de 4 tomas va como tabla a la vista**, no como un gráfico de dos o tres puntitos: con tan pocos puntos un
 *   dibujo parece estable o parece un salto (§5.8).
 * - **Nunca se nombra un método que no aparece:** las columnas, la leyenda, la descripción y las notas dicen solo los
 *   métodos que tienen alguna masa en estas fechas; «se mueven juntos por construcción» va solo si están los dos.
 * - A la vista, lo que §5 pide (por construcción, el error de medición, lo de otro profesional); lo demás, en «Cómo
 *   leerlo».
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { cantidad, nombreDeMetodo, type MarcaSemantica } from '@be/domain';
import type { CeldaDeLaTabla } from '../tabla-equivalente';
import type { ElementoDeLaLeyenda, FormaDeLaSerie, GraficoArmado, MarcaDelPanel, PanelDeValores, UnionDelPanel } from '../nutricion-y-cuerpo/lienzo';
import { COPY_ANTROPOMETRIA_EN_GRAFICOS as C } from './copy';
import type { ObservacionDeLaToma } from './tomas';

export interface MetodoDeLaMasa {
  readonly metrica: string;
  /** «según Durnin y Womersley». */
  readonly nombre: string;
  readonly forma: FormaDeLaSerie;
  readonly color: number;
}

export interface PanelDeMasa {
  readonly id: string;
  readonly nombre: string;
  readonly metodos: readonly [MetodoDeLaMasa, MetodoDeLaMasa];
}

const durninYFaulkner = (prefijo: string): readonly [MetodoDeLaMasa, MetodoDeLaMasa] => [
  { metrica: `${prefijo}-durnin-womersley`, nombre: 'según Durnin y Womersley', forma: 'CIRCULO', color: 0 },
  { metrica: `${prefijo}-faulkner`, nombre: 'según Faulkner', forma: 'CUADRADO', color: 1 },
];

/** Los paneles de GR-20, en orden: la masa grasa, la libre de grasa y, aparte, la muscular de Lee. */
export const PANELES_DE_MASAS: readonly PanelDeMasa[] = [
  { id: 'masa-grasa', nombre: C.masas.panelGrasa, metodos: durninYFaulkner('masa-grasa') },
  { id: 'masa-libre-de-grasa', nombre: C.masas.panelLibre, metodos: durninYFaulkner('masa-libre-de-grasa') },
  {
    id: 'masa-muscular',
    nombre: C.masas.panelMuscular,
    metodos: [
      { metrica: 'masa-muscular-esqueletica-lee', nombre: 'con perímetros', forma: 'CIRCULO', color: 0 },
      { metrica: 'masa-muscular-esqueletica-lee-peso', nombre: 'con peso y talla', forma: 'CUADRADO', color: 1 },
    ],
  },
];

/** Las medidas que lee GR-20 (para pedirlas a API-ANT-06 sin traer las demás). */
export const MEDIDAS_DE_GR20: readonly string[] = PANELES_DE_MASAS.flatMap((p) => p.metodos.map((m) => m.metrica));

const UNIDAD = 'kg';

/** La marca de una masa: calculada (punto adentro), reportada (contorno cortado) o medida (llena). */
const marcaDeLaClase = (clase: ObservacionDeLaToma['clase']): MarcaSemantica => (clase === 'DERIVED' ? 'PUNTO_ADENTRO' : clase === 'REPORTED' ? 'CONTORNO_CORTADO' : 'LLENA');

/** Lo que la marca dice con su forma, dicho con palabras para la tabla y la lectura (la forma no llega al lector de pantalla). */
const CLASE_EN_PALABRAS: Readonly<Partial<Record<ObservacionDeLaToma['clase'], string>>> = { DERIVED: C.masas.calculado, REPORTED: C.masas.reportado };

/**
 * «14,2 kg (calculado) · Masa grasa (Durnin y Womersley), mujeres»: el valor, lo que dice su marca y la versión del método
 * que lo calculó.
 */
export function masaEnPalabras(o: ObservacionDeLaToma, conElMetodo = true): string {
  const metodo = conElMetodo && o.metodoVersionId ? nombreDeLaVersion(o.metodoVersionId) : null;
  const clase = CLASE_EN_PALABRAS[o.clase];
  return [`${cantidad(o.valor, o.unidad)}${clase ? ` (${clase})` : ''}`, ...(metodo ? [metodo] : []), ...(o.corregido ? ['corregido'] : [])].join(' · ');
}

/** El nombre de la versión de un método: «Masa grasa (Durnin y Womersley), hombres». */
const nombreDeLaVersion = (id: string): string => nombreDeMetodo(id) ?? C.masas.metodoSinNombre;

/**
 * La versión del método de una columna, si todas sus masas en estas fechas son de la misma (GR-VC06): va una vez, en el
 * encabezado, y cada celda dice solo su valor (DISENO-VISUAL §1, principio 8: si no entra, se reduce el detalle, no se
 * corta el número). Con versiones distintas en la misma columna, `null`: cada celda dice la suya.
 */
function versionDeLaColumna(observaciones: readonly ObservacionDeLaToma[]): string | null {
  const versiones = new Set(observaciones.map((o) => o.metodoVersionId));
  const [unica] = [...versiones];
  return versiones.size === 1 && unica ? unica : null;
}

/** Con menos tomas, GR-20 va como tabla a la vista (GR-VC05): dos o tres puntos parecen estables o un salto (§5.8). */
export const MINIMO_DE_TOMAS_PARA_DIBUJAR = 4;

/** GR-20 armado; `null` si no hay ninguna masa en estas fechas. */
export function graficoDeMasas(observaciones: readonly ObservacionDeLaToma[], desde: string, hasta: string, opciones: { readonly parcial: boolean; readonly enTramos: boolean }): GraficoArmado | null {
  const enElPeriodo = observaciones.filter((o) => o.fecha >= desde && o.fecha <= hasta && o.unidad === UNIDAD);
  const conDatos = PANELES_DE_MASAS.filter((p) => p.metodos.some((m) => enElPeriodo.some((o) => o.metrica === m.metrica)));
  if (conDatos.length === 0) return null;
  const paneles = conDatos.map((p): PanelDeValores => {
    const marcas = p.metodos.flatMap((m) =>
      enElPeriodo
        .filter((o) => o.metrica === m.metrica)
        .map((o): MarcaDelPanel => ({ clave: `${m.metrica}:${o.sourceId}`, serie: m.metrica, fecha: o.fecha, en: o.en, valor: o.valor, marca: marcaDeLaClase(o.clase), forma: m.forma, color: m.color, tarde: false, tramo: null })),
    );
    const [primero, segundo] = p.metodos;
    const uniones = enElPeriodo
      .filter((o) => o.metrica === primero.metrica)
      .flatMap((a): UnionDelPanel[] => {
        const b = enElPeriodo.find((o) => o.metrica === segundo.metrica && o.evaluacionId === a.evaluacionId);
        if (!b) return [];
        return [{ clave: `${p.id}:${a.evaluacionId}`, fecha: a.fecha, en: a.en, desde: Math.min(a.valor, b.valor), hasta: Math.max(a.valor, b.valor), rotulo: cantidad(Number(Math.abs(a.valor - b.valor).toPrecision(12)), UNIDAD), forma: 'SEPARACION' }];
      });
    return { tipo: 'VALORES', id: p.id, nombre: p.nombre, unidad: UNIDAD, metodo: null, escala: { enteros: false }, marcas, uniones, escalones: [], semanas: [], cobertura: [] };
  });
  const presentes = new Set(enElPeriodo.map((o) => o.metrica));
  // Solo los métodos que aparecen (nunca nombrar uno que no está) y la separación solo con los dos.
  const metodosDe = (p: PanelDeMasa) => p.metodos.filter((m) => presentes.has(m.metrica));
  const conLosDos = (p: PanelDeMasa) => metodosDe(p).length === 2;
  const versionDe = new Map(conDatos.flatMap((p) => metodosDe(p)).map((m) => [m.metrica, versionDeLaColumna(enElPeriodo.filter((o) => o.metrica === m.metrica))] as const));
  const columnas = conDatos.flatMap((p) => [
    ...metodosDe(p).map((m) => {
      const version = versionDe.get(m.metrica) ?? null;
      return { id: m.metrica, nombre: version ? nombreDeLaVersion(version) : `${p.nombre} ${m.nombre}`, unidad: UNIDAD };
    }),
    ...(conLosDos(p) ? [{ id: `${p.id}:separacion`, nombre: C.masas.columnaSeparacion(p.nombre), unidad: UNIDAD }] : []),
  ]);
  const fechas = [...new Set(enElPeriodo.filter((o) => MEDIDAS_DE_GR20.includes(o.metrica)).map((o) => o.fecha))].sort();
  const filas = fechas.map((fecha) => ({
    fecha,
    celdas: conDatos.flatMap((p, i): (CeldaDeLaTabla | null)[] => {
      const delDia = (m: MetodoDeLaMasa) => enElPeriodo.filter((o) => o.metrica === m.metrica && o.fecha === fecha);
      const metodos = metodosDe(p).map((m): CeldaDeLaTabla | null => {
        const lista = delDia(m);
        const conElMetodo = (versionDe.get(m.metrica) ?? null) === null;
        return lista.length === 0 ? null : { texto: lista.map((o) => masaEnPalabras(o, conElMetodo)).join(' · '), marca: marcaDeLaClase(lista[0]!.clase), tarde: false, registrada: true };
      });
      const separaciones = paneles[i]!.uniones.filter((u) => u.fecha === fecha && u.rotulo !== null).map((u) => C.masas.separan(u.rotulo as string));
      return [...metodos, ...(conLosDos(p) ? [separaciones.length > 0 ? { texto: separaciones.join(' · '), marca: null, tarde: false, registrada: true } : null] : [])];
    }),
  }));
  // Una ficha por método (Durnin y Womersley vale para la masa grasa y la libre de grasa): el nombre corto a la vista y,
  // para el lector de pantalla, la forma y lo que dice.
  const fichas = new Map<string, ElementoDeLaLeyenda>();
  for (const p of conDatos) {
    for (const m of metodosDe(p)) {
      const corto = C.masas.fichaDelMetodo(p.id, m.nombre.replace(/^según /, ''));
      if (!fichas.has(corto)) fichas.set(corto, { clave: m.metrica, texto: corto, largo: C.masas.fichaLarga(corto, m.forma === 'CIRCULO' ? 'círculo' : 'cuadrado'), muestra: { tipo: 'MARCA', marca: 'PUNTO_ADENTRO', forma: m.forma, color: m.color } });
    }
  }
  const leyenda: ElementoDeLaLeyenda[] = [
    ...fichas.values(),
    ...(paneles.some((p) => p.uniones.length > 0) ? [{ clave: 'separacion', texto: C.masas.fichaSeparacion, largo: C.masas.leyendaSeparacion, muestra: { tipo: 'UNION', forma: 'SEPARACION' } } as const] : []),
  ];
  const tomas = new Set(enElPeriodo.filter((o) => MEDIDAS_DE_GR20.includes(o.metrica)).map((o) => o.evaluacionId)).size;
  const cuantas = (m: MetodoDeLaMasa) => new Set(enElPeriodo.filter((o) => o.metrica === m.metrica).map((o) => o.evaluacionId)).size;
  const descripcion = `${C.masas.titulo}: ${tomas} ${tomas === 1 ? 'toma con alguna masa calculada' : 'tomas con alguna masa calculada'}. ${conDatos
    .map((p) => `${p.nombre}: ${metodosDe(p).map((m) => `${m.nombre} en ${cuantas(m)} ${cuantas(m) === 1 ? 'toma' : 'tomas'}`).join(', ')}`)
    .join('. ')}.`;
  const comoTabla = tomas < MINIMO_DE_TOMAS_PARA_DIBUJAR;
  const durninYFaulknerJuntos = conDatos.some((p) => p.id !== 'masa-muscular' && conLosDos(p));
  return {
    paneles,
    temporadas: [],
    tabla: { columnas, filas, sinRegistros: [] },
    descripcion,
    leyenda,
    notas: [...(durninYFaulknerJuntos ? [C.masas.porConstruccion] : []), C.sinErrorDeMedicion, ...(opciones.parcial ? [C.parcial] : [])],
    aclaraciones: [
      ...(comoTabla ? [C.masas.comoTabla(tomas, MINIMO_DE_TOMAS_PARA_DIBUJAR)] : []),
      C.masas.cadaNumero,
      ...(paneles.some((p) => p.uniones.length > 0) ? [C.masas.separacionNoEsCambio] : []),
      ...(comoTabla ? [] : [C.masas.ejeComun, C.soloPuntos]),
      ...(conDatos.some((p) => p.id === 'masa-muscular') ? [C.masas.leeAparte] : []),
      ...(opciones.enTramos ? [C.leidoEnTramos] : []),
    ],
    metodo: C.masas.metodo,
    porSemana: null,
    comoTabla,
  };
}
