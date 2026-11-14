/**
 * GR-13 · Proteínas, carbohidratos, grasas y fibra, cada uno en su panel (WP-GRAFICOS fase 2, rama C; DL-174).
 *
 * - Cuatro paneles apilados con el mismo eje de fechas, cada uno con su eje, el objetivo de cada versión en escalón y
 *   las temporadas de fondo (GR-11). Nunca barras apiladas: invitan a leer proporciones.
 * - Cada día dice lo que BE sabe de él (`dias-de-nutricion.ts`): la fibra desconocida no es cero, es un subtotal.
 * - **En g/kg** (GR-T13), los mismos días divididos por el peso de la última toma propia en ese día o antes
 *   (`gramos-por-kilo.ts`), con la fecha del peso en cada punto y la lista de los pesos usados. Sin cambio relativo y sin
 *   el signo de porcentaje. Los rangos de la literatura no se dibujan: los elige el profesional (TB-39).
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { numero, type PuntoAnalitico, type ResultadoDeProyeccionNutricional } from '@be/domain';
import type { CeldaDeLaTabla, FilaDeLaTabla } from '../tabla-equivalente';
import { diaYMes, huecosEnTexto, type ElementoDeLaLeyenda, type GraficoArmado, type MarcaDelPanel, type PanelDeValores } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C, contar, enumerar } from './copy';
import { calidadDelDia, lecturaDelDia, marcaDelDia, puntosPorFecha, type MetricaDelGrafico } from './dias-de-nutricion';
import { leyendaDeLosDias, marcasDeLosDias } from './energia-por-dia';
import { pesoDelDia, pesoEnPalabras, pesosUsados, serieAnaliticaPorKilo, type PesoDeLaToma } from './gramos-por-kilo';
import { escalonesDelObjetivo, objetivoDelDia, proporcionesDelObjetivo, temporadasDeNutricion } from './temporadas';

/** Un macronutriente de GR-13: su métrica de API-PRJ-01, su serie del catálogo y su nombre. */
export interface MacroDelGrafico {
  readonly metrica: Exclude<MetricaDelGrafico, 'ENERGY'>;
  readonly serie: string;
  readonly nombre: string;
}

/** En el orden de GR-13: proteína, carbohidratos, grasa y fibra. */
export const MACROS_DEL_GRAFICO: readonly MacroDelGrafico[] = [
  { metrica: 'PROTEIN', serie: 'nutricion.proteinas', nombre: 'Proteínas registradas' },
  { metrica: 'CARBOHYDRATE', serie: 'nutricion.carbohidratos', nombre: 'Carbohidratos registrados' },
  { metrica: 'FAT', serie: 'nutricion.grasas', nombre: 'Grasas registradas' },
  { metrica: 'FIBER', serie: 'nutricion.fibra', nombre: 'Fibra registrada' },
];

/** Los de g/kg: la fibra por kilo no está en el catálogo. */
export const MACROS_POR_KILO: readonly MacroDelGrafico[] = MACROS_DEL_GRAFICO.filter((m) => m.metrica !== 'FIBER');

export interface EntradaDeMacros {
  /** Una lectura por macronutriente, por día, en el orden de `macros`. */
  readonly resultados: readonly ResultadoDeProyeccionNutricional[];
  readonly macros: readonly MacroDelGrafico[];
  readonly cargadoTarde: ReadonlySet<string> | null;
  readonly desde: string;
  readonly hasta: string;
}

const valorPorKilo = (v: number): string => `${numero(v, 2)} g/kg`;

/** La celda de un día de un macronutriente: su lectura y el objetivo que regía ese día. */
function celdaDelMacro(p: PuntoAnalitico | undefined, r: ResultadoDeProyeccionNutricional, m: MacroDelGrafico, fecha: string, tarde: boolean): CeldaDeLaTabla | null {
  if (!p) return null;
  const objetivo = objetivoDelDia(r.prescribed.objectiveSteps, m.metrica, fecha);
  return { texto: [lecturaDelDia(p, m.metrica, tarde), ...(objetivo ? [objetivo] : [])].join(' · '), marca: marcaDelDia(p), tarde };
}

/** Las filas de la tabla: una por fecha con algún punto en algún panel. */
function filasDeLosMacros(porMacro: readonly Map<string, PuntoAnalitico>[], celda: (i: number, p: PuntoAnalitico | undefined, fecha: string) => CeldaDeLaTabla | null): FilaDeLaTabla[] {
  const fechas = [...new Set(porMacro.flatMap((m) => [...m.keys()]))].sort();
  return fechas.map((fecha) => ({ fecha, celdas: porMacro.map((m, i) => celda(i, m.get(fecha), fecha)) }));
}

/** GR-13 en gramos por día. */
export function graficoDeMacros(e: EntradaDeMacros): GraficoArmado {
  const { desde, hasta } = e;
  const paneles = e.macros.map((m, i): PanelDeValores => {
    const r = e.resultados[i]!;
    return {
      tipo: 'VALORES',
      id: m.serie,
      nombre: m.nombre,
      unidad: 'g',
      metodo: i === 0 ? C.metodoDeLaSuma : null,
      escala: { enteros: false, desdeCero: true },
      marcas: marcasDeLosDias(r.recorded.points, desde, hasta, e.cargadoTarde, 0, m.serie),
      uniones: [],
      escalones: escalonesDelObjetivo(r.prescribed.objectiveSteps, desde, hasta, 0),
      medias: [],
    };
  });
  const porMacro = e.resultados.map((r) => puntosPorFecha(r.recorded.points, desde, hasta));
  const filas = filasDeLosMacros(porMacro, (i, p, fecha) => celdaDelMacro(p, e.resultados[i]!, e.macros[i]!, fecha, e.cargadoTarde?.has(fecha) ?? false));
  const primera = e.resultados[0];
  const temporadas = primera ? temporadasDeNutricion(primera.planVersions, primera.prescribed.objectiveSteps, desde, hasta) : [];
  const marcas = paneles.flatMap((p) => p.marcas);
  const conObjetivo = paneles.some((p) => p.escalones.length > 0);
  const dias = new Set(marcas.map((x) => x.fecha)).size;
  return {
    paneles,
    temporadas,
    tabla: {
      columnas: e.macros.map((m) => ({ id: m.serie, nombre: m.nombre, unidad: 'g' })),
      filas,
      sinRegistros: primera ? huecosEnTexto(primera.recorded.gaps, desde, hasta) : [],
    },
    descripcion: `${C.macros.titulo}: ${contar(dias, 'día con algún valor', 'días con algún valor')}. ${e.macros
      .map((m, i) => `${m.nombre}: ${contar(paneles[i]!.marcas.length, 'día', 'días')}`)
      .join('; ')}.`,
    leyenda: [
      ...leyendaDeLosDias(marcas, 0),
      ...(conObjetivo ? [{ clave: 'objetivo', texto: C.leyenda.objetivo, muestra: { tipo: 'ESCALON', color: 0 } } as const] : []),
      ...(temporadas.length > 0 ? [{ clave: 'temporada', texto: C.leyenda.temporada, muestra: { tipo: 'TEMPORADA' } } as const] : []),
    ],
    notas: [
      `${C.metodoDeLaSuma}. ${C.loRegistrado}`,
      C.macros.sinBarrasApiladas,
      C.macros.fibraDesconocida,
      C.diaSinRegistros,
      ...e.macros.flatMap((m, i) => proporcionesDelObjetivo(e.resultados[i]!.prescribed.objectiveSteps, m.metrica, m.nombre, desde, hasta)),
      ...(e.cargadoTarde === null ? [C.sinLoCargadoDespues] : []),
    ],
  };
}

export interface EntradaDeMacrosPorKilo extends EntradaDeMacros {
  /** Los pesos medidos en kg de las tomas propias, hasta el último día (con los de antes del período). */
  readonly pesos: readonly PesoDeLaToma[];
  /** Desde cuándo se buscó el peso anterior al período; `null` si no se buscó antes. */
  readonly pesoBuscadoDesde: string | null;
}

/** GR-13 en gramos por kilo de peso: los mismos días, con la fecha del peso que usó cada uno. */
export function graficoDeMacrosPorKilo(e: EntradaDeMacrosPorKilo): GraficoArmado {
  const { desde, hasta } = e;
  const series = e.macros.map((m, i) => serieAnaliticaPorKilo(e.resultados[i]!.recorded, e.pesos, `${m.serie}-por-kilo`, `${m.nombre} por kilo de peso`));
  const paneles = e.macros.map((m, i): PanelDeValores => ({
    tipo: 'VALORES',
    id: `${m.serie}-por-kilo`,
    nombre: `${m.nombre} por kilo de peso`,
    unidad: 'g/kg',
    metodo: i === 0 ? C.porKilo.metodo : null,
    escala: { enteros: false, desdeCero: true },
    marcas: [...puntosPorFecha(series[i]!.points, desde, hasta).values()].flatMap((p): MarcaDelPanel[] => {
      const marca = marcaDelDia(p);
      return marca === null || p.value === null
        ? []
        : [{ clave: p.pointId, serie: m.serie, fecha: p.date, en: null, valor: p.value, marca, forma: 'CIRCULO', color: 0, tarde: e.cargadoTarde?.has(p.date) ?? false, tramo: p.segment }];
    }),
    uniones: [],
    escalones: [],
    medias: [],
  }));
  const porMacro = series.map((s) => puntosPorFecha(s.points, desde, hasta));
  const filas = filasDeLosMacros(porMacro, (i, p, fecha) => {
    if (!p) return null;
    const tarde = e.cargadoTarde?.has(fecha) ?? false;
    const peso = pesoDelDia(e.pesos, fecha);
    const calidad = calidadDelDia(p, tarde);
    const texto = p.value === null ? [calidad, ...(peso ? [] : [C.porKilo.sinPesoAnterior])].join(' · ') : [valorPorKilo(p.value), calidad, ...(peso ? [pesoEnPalabras(peso)] : [])].join(' · ');
    return { texto, marca: marcaDelDia(p), tarde };
  });
  const conValorEnGramos = [...new Set(e.resultados.flatMap((r) => [...puntosPorFecha(r.recorded.points, desde, hasta).values()].filter((p) => p.value !== null).map((p) => p.date)))].sort();
  const sinPeso = conValorEnGramos.filter((f) => pesoDelDia(e.pesos, f) === null).length;
  const usados = pesosUsados(e.pesos, conValorEnGramos);
  const primera = e.resultados[0];
  const temporadas = primera ? temporadasDeNutricion(primera.planVersions, primera.prescribed.objectiveSteps, desde, hasta) : [];
  const marcas = paneles.flatMap((p) => p.marcas);
  const listaDePesos = enumerar(usados.map((p) => `${numero(p.valor)} kg (toma del ${diaYMes(p.fecha)})`));
  return {
    paneles,
    temporadas,
    tabla: {
      columnas: e.macros.map((m) => ({ id: `${m.serie}-por-kilo`, nombre: `${m.nombre} por kilo de peso`, unidad: 'g/kg' })),
      filas,
      sinRegistros: primera ? huecosEnTexto(primera.recorded.gaps, desde, hasta) : [],
    },
    descripcion: `${C.porKilo.titulo}: ${contar(new Set(marcas.map((x) => x.fecha)).size, 'día con valor', 'días con valor')}.${usados.length > 0 ? ` ${C.porKilo.pesosUsados(listaDePesos)}` : ''}`,
    leyenda: [
      ...leyendaDeLosDias(marcas, 0),
      ...(temporadas.length > 0 ? [{ clave: 'temporada', texto: C.leyenda.temporada, muestra: { tipo: 'TEMPORADA' } } as const] : []),
    ] satisfies ElementoDeLaLeyenda[],
    notas: [
      `${C.porKilo.metodo}. ${C.porKilo.reglaDelPeso}`,
      C.porKilo.pesoViejo,
      ...(usados.length > 0 ? [C.porKilo.pesosUsados(listaDePesos)] : e.pesos.length === 0 ? [C.porKilo.sinPesos] : []),
      ...(sinPeso > 0 ? [C.porKilo.diasSinPeso(sinPeso)] : []),
      ...(e.pesoBuscadoDesde !== null ? [C.porKilo.buscadoDesde(diaYMes(e.pesoBuscadoDesde))] : []),
      C.loRegistrado,
      ...(e.cargadoTarde === null ? [C.sinLoCargadoDespues] : []),
    ],
  };
}
