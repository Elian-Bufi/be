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

/** «14,2 kg · Masa grasa (Durnin y Womersley), mujeres»: el valor y la versión del método que lo calculó. */
export function masaEnPalabras(o: ObservacionDeLaToma): string {
  const metodo = o.metodoVersionId ? (nombreDeMetodo(o.metodoVersionId) ?? C.masas.metodoSinNombre) : null;
  return [cantidad(o.valor, o.unidad), ...(metodo ? [metodo] : []), ...(o.corregido ? ['corregido'] : [])].join(' · ');
}

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
    return { tipo: 'VALORES', id: p.id, nombre: p.nombre, unidad: UNIDAD, metodo: null, escala: { enteros: false }, marcas, uniones, escalones: [], medias: [] };
  });
  const columnas = conDatos.flatMap((p) => [
    ...p.metodos.map((m) => ({ id: m.metrica, nombre: `${p.nombre} ${m.nombre}`, unidad: UNIDAD })),
    { id: `${p.id}:separacion`, nombre: C.masas.columnaSeparacion(p.nombre), unidad: UNIDAD },
  ]);
  const fechas = [...new Set(enElPeriodo.filter((o) => MEDIDAS_DE_GR20.includes(o.metrica)).map((o) => o.fecha))].sort();
  const filas = fechas.map((fecha) => ({
    fecha,
    celdas: conDatos.flatMap((p, i): (CeldaDeLaTabla | null)[] => {
      const delDia = (m: MetodoDeLaMasa) => enElPeriodo.filter((o) => o.metrica === m.metrica && o.fecha === fecha);
      const metodos = p.metodos.map((m): CeldaDeLaTabla | null => {
        const lista = delDia(m);
        return lista.length === 0 ? null : { texto: lista.map(masaEnPalabras).join(' · '), marca: marcaDeLaClase(lista[0]!.clase), tarde: false };
      });
      const separaciones = paneles[i]!.uniones.filter((u) => u.fecha === fecha && u.rotulo !== null).map((u) => C.masas.separan(u.rotulo as string));
      return [...metodos, separaciones.length > 0 ? { texto: separaciones.join(' · '), marca: null, tarde: false } : null];
    }),
  }));
  const presentes = new Set(enElPeriodo.map((o) => o.metrica));
  const leyenda: ElementoDeLaLeyenda[] = [
    ...conDatos.flatMap((p) =>
      p.metodos
        .filter((m) => presentes.has(m.metrica))
        .map((m): ElementoDeLaLeyenda => ({ clave: m.metrica, texto: `${p.nombre} ${m.nombre}: ${m.forma === 'CIRCULO' ? 'círculo' : 'cuadrado'}, con un punto adentro (calculado)`, muestra: { tipo: 'MARCA', marca: 'PUNTO_ADENTRO', forma: m.forma, color: m.color } })),
    ),
    ...(paneles.some((p) => p.uniones.length > 0) ? [{ clave: 'separacion', texto: C.masas.leyendaSeparacion, muestra: { tipo: 'UNION', forma: 'SEPARACION' } } as const] : []),
  ];
  const tomas = new Set(enElPeriodo.filter((o) => MEDIDAS_DE_GR20.includes(o.metrica)).map((o) => o.evaluacionId)).size;
  const cuantas = (m: MetodoDeLaMasa) => new Set(enElPeriodo.filter((o) => o.metrica === m.metrica).map((o) => o.evaluacionId)).size;
  const descripcion = `${C.masas.titulo}: ${tomas} ${tomas === 1 ? 'toma con alguna masa calculada' : 'tomas con alguna masa calculada'}. ${conDatos
    .map((p) => `${p.nombre}: ${p.metodos.map((m) => `${m.nombre} en ${cuantas(m)} ${cuantas(m) === 1 ? 'toma' : 'tomas'}`).join(', ')}`)
    .join('. ')}.`;
  return {
    paneles,
    temporadas: [],
    tabla: { columnas, filas, sinRegistros: [] },
    descripcion,
    leyenda,
    notas: [
      C.masas.porConstruccion,
      C.masas.separacionNoEsCambio,
      C.masas.cadaNumero,
      C.masas.ejeComun,
      ...(conDatos.some((p) => p.id === 'masa-muscular') ? [C.masas.leeAparte] : []),
      C.soloPuntos,
      C.sinErrorDeMedicion,
      ...(opciones.parcial ? [C.parcial] : []),
      ...(opciones.enTramos ? [C.leidoEnTramos] : []),
    ],
  };
}
