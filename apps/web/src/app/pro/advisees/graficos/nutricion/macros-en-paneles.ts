/**
 * GR-13 · Proteínas, carbohidratos, grasas y fibra, cada uno en su panel (WP-GRAFICOS fase 2, rama C; DL-174).
 *
 * - Cuatro paneles apilados con el mismo eje de fechas, cada uno con su eje, el objetivo de cada versión en escalón y
 *   las temporadas de fondo (GR-11). Nunca barras apiladas: invitan a leer proporciones.
 * - Cada día dice lo que BE sabe de él (`dias-de-nutricion.ts`): la fibra desconocida no es cero, es un subtotal.
 * - **Por semana** (GR-VC01; de entrada con más de seis semanas), cada panel con la media de la semana (v1) de GR-12,
 *   con sus días; «Día por día», a un toque.
 * - **En g/kg** (GR-T13), los mismos días divididos por el peso de la última toma propia en ese día o antes
 *   (`gramos-por-kilo.ts`), con la fecha del peso en cada punto y la lista de los pesos usados, a la vista. Sin cambio
 *   relativo y sin el signo de porcentaje. Los rangos de la literatura no se dibujan: los elige el profesional (TB-39).
 *   **Los g/kg van solo día por día** (GR-VC02): cada día usa el peso de su toma, la línea se corta donde cambia el peso, y
 *   una media de la semana mezclaría dos pesos sin decirlo.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { numero, type PuntoAnalitico, type ResultadoDeProyeccionNutricional } from '@be/domain';
import type { CeldaDeLaTabla, FilaDeLaTabla } from '../tabla-equivalente';
import { diaYMes, huecosEnTexto, type GraficoArmado, type MarcaDelPanel, type PanelDeValores } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C, contar, enumerar } from './copy';
import { calidadDelDia, lecturaDelDia, marcaDelDia, puntosPorFecha, type MetricaDelGrafico } from './dias-de-nutricion';
import { aclaracionesDeLaSuma, leyendaDeLosDias, leyendaDelObjetivoYLasTemporadas, marcasDeLosDias, notasDeLaVistaParcial, notasDeLoCargadoDespues, temporadasEnTexto } from './energia-por-dia';
import { coberturaDeLosDias, loCargadoDespuesEnElPeriodo, mediasDeLasSemanas, porSemanaDelGrafico, semanasDelPanel } from './por-semana';
import { pesoDelDia, pesoEnPalabras, pesosUsados, serieAnaliticaPorKilo, type PesoDeLaToma } from './gramos-por-kilo';
import { escalonesDelObjetivo, objetivoDelDia, proporcionesDelObjetivo, seVenLasTemporadas, temporadasDeNutricion } from './temporadas';

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
  /** Si la lectura de lo cargado después quedó a medias, desde qué día se sabe (`loCargadoDespues`). */
  readonly cargadoTardeSabidoDesde?: string | null;
  readonly desde: string;
  readonly hasta: string;
  /** Hoy: no entra en la media de su semana (sigue en curso). Sin esto, el día siguiente al último del gráfico. */
  readonly hoy?: string;
  /** Alguna lectura respondió con `partialView`: hay registros de comida de otro profesional que no se ven ni suman. */
  readonly parcial?: boolean;
}

const valorPorKilo = (v: number): string => `${numero(v, 2)} g/kg`;

/** La celda de un día de un macronutriente: su lectura y el objetivo que regía ese día. */
function celdaDelMacro(p: PuntoAnalitico | undefined, r: ResultadoDeProyeccionNutricional, m: MacroDelGrafico, fecha: string, tarde: boolean): CeldaDeLaTabla | null {
  if (!p) return null;
  const objetivo = objetivoDelDia(r.prescribed.objectiveSteps, m.metrica, fecha);
  return { texto: [lecturaDelDia(p, m.metrica, tarde), ...(objetivo ? [objetivo] : [])].join(' · '), marca: marcaDelDia(p), tarde, registrada: true };
}

/** Las filas de la tabla: una por fecha con algún punto en algún panel. */
function filasDeLosMacros(porMacro: readonly Map<string, PuntoAnalitico>[], celda: (i: number, p: PuntoAnalitico | undefined, fecha: string) => CeldaDeLaTabla | null): FilaDeLaTabla[] {
  const fechas = [...new Set(porMacro.flatMap((m) => [...m.keys()]))].sort();
  return fechas.map((fecha) => ({ fecha, celdas: porMacro.map((m, i) => celda(i, m.get(fecha), fecha)) }));
}

/** GR-13 en gramos por día. */
export function graficoDeMacros(e: EntradaDeMacros): GraficoArmado {
  const { desde, hasta } = e;
  const hoy = e.hoy ?? diaSiguiente(hasta);
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
      semanas: semanasDelPanel(mediasDeLasSemanas(r.recorded.points, m.metrica, desde, hasta, hoy), m.serie),
      cobertura: coberturaDeLosDias(r.recorded.points, desde, hasta, hoy),
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
    leyenda: [...leyendaDeLosDias(marcas, 0), ...leyendaDelObjetivoYLasTemporadas(conObjetivo, seVenLasTemporadas(temporadas, desde))],
    notas: [
      ...e.macros.flatMap((m, i) => proporcionesDelObjetivo(e.resultados[i]!.prescribed.objectiveSteps, m.metrica, m.nombre, desde, hasta)),
      ...loCargadoDespuesEnElPeriodo(unaPorFecha(marcas)),
      ...notasDeLoCargadoDespues(e.cargadoTarde, e.cargadoTardeSabidoDesde, hasta),
      ...notasDeLaVistaParcial(e.parcial),
    ],
    aclaraciones: [...aclaracionesDeLaSuma(), C.macros.sinBarrasApiladas, C.macros.fibraDesconocida, ...temporadasEnTexto(temporadas)],
    metodo: C.metodoDeLaSuma,
    porSemana: porSemanaDelGrafico({ paneles, leyendaExtra: leyendaDelObjetivoYLasTemporadas(conObjetivo, seVenLasTemporadas(temporadas, desde)) }),
    comoTabla: false,
  };
}

export interface EntradaDeMacrosPorKilo extends EntradaDeMacros {
  /** Los pesos medidos en kg de las tomas propias, hasta el último día (con los de antes del período). */
  readonly pesos: readonly PesoDeLaToma[];
  /** Desde cuándo se buscó el peso anterior al período; `null` si no se buscó antes. */
  readonly pesoBuscadoDesde: string | null;
  /** La lectura de los pesos respondió con `partialView`: hay tomas de otro profesional, y su peso no se usa. */
  readonly pesosParciales?: boolean;
}

/** GR-13 en gramos por kilo de peso: los mismos días, con la fecha del peso que usó cada uno. */
export function graficoDeMacrosPorKilo(e: EntradaDeMacrosPorKilo): GraficoArmado {
  const { desde, hasta } = e;
  const series = e.macros.map((m, i) => serieAnaliticaPorKilo(e.resultados[i]!.recorded, e.pesos, `${m.serie}-por-kilo`, `${m.nombre} por kilo de peso`, hasta));
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
    semanas: [],
    cobertura: [],
  }));
  const porMacro = series.map((s) => puntosPorFecha(s.points, desde, hasta));
  const filas = filasDeLosMacros(porMacro, (i, p, fecha) => {
    if (!p) return null;
    const tarde = e.cargadoTarde?.has(fecha) ?? false;
    const peso = pesoDelDia(e.pesos, fecha);
    // Sin una toma anterior no hay g/kg, aunque haya gramos: la celda lo dice una vez y sin marca (no se dibuja).
    if (peso === null) return { texto: `${C.sinValor(C.porKilo.sinPesoAnterior)}${tarde ? ` (${C.cargadoDespues})` : ''}`, marca: null, tarde, registrada: true };
    const calidad = calidadDelDia(p, tarde);
    const texto = p.value === null ? [calidad, pesoEnPalabras(peso, hasta)].join(' · ') : [valorPorKilo(p.value), calidad, pesoEnPalabras(peso, hasta)].join(' · ');
    return { texto, marca: marcaDelDia(p), tarde, registrada: true };
  });
  const conValorEnGramos = [...new Set(e.resultados.flatMap((r) => [...puntosPorFecha(r.recorded.points, desde, hasta).values()].filter((p) => p.value !== null).map((p) => p.date)))].sort();
  const sinPeso = conValorEnGramos.filter((f) => pesoDelDia(e.pesos, f) === null).length;
  const usados = pesosUsados(e.pesos, conValorEnGramos);
  const primera = e.resultados[0];
  const temporadas = primera ? temporadasDeNutricion(primera.planVersions, primera.prescribed.objectiveSteps, desde, hasta) : [];
  const marcas = paneles.flatMap((p) => p.marcas);
  const listaDePesos = enumerar(usados.map((p) => `${numero(p.valor)} kg (toma del ${diaYMes(p.fecha, hasta)})`));
  return {
    paneles,
    temporadas,
    tabla: {
      columnas: e.macros.map((m) => ({ id: `${m.serie}-por-kilo`, nombre: `${m.nombre} por kilo de peso`, unidad: 'g/kg' })),
      filas,
      sinRegistros: primera ? huecosEnTexto(primera.recorded.gaps, desde, hasta) : [],
    },
    descripcion: `${C.porKilo.titulo}: ${contar(new Set(marcas.map((x) => x.fecha)).size, 'día con valor', 'días con valor')}.${usados.length > 0 ? ` ${C.porKilo.pesosUsados(listaDePesos)}` : ''}`,
    leyenda: [...leyendaDeLosDias(marcas, 0), ...leyendaDelObjetivoYLasTemporadas(false, seVenLasTemporadas(temporadas, desde))],
    notas: [
      // Los pesos usados, a la vista: cada punto es de su toma, y el profesional tiene que ver con qué peso se dividió.
      ...(usados.length > 0 ? [C.porKilo.pesosUsados(listaDePesos)] : e.pesos.length === 0 ? [C.porKilo.sinPesos] : []),
      ...(sinPeso > 0 ? [C.porKilo.diasSinPeso(sinPeso), ...(e.pesoBuscadoDesde !== null ? [C.porKilo.buscadoDesde(diaYMes(e.pesoBuscadoDesde, hasta))] : [])] : []),
      ...loCargadoDespuesEnElPeriodo(unaPorFecha(marcas)),
      ...notasDeLoCargadoDespues(e.cargadoTarde, e.cargadoTardeSabidoDesde, hasta),
      ...notasDeLaVistaParcial(e.parcial),
      ...(e.pesosParciales ? [C.porKilo.tomasDeOtro] : []),
    ],
    aclaraciones: [
      `${C.porKilo.metodo}. ${C.porKilo.reglaDelPeso}`,
      C.porKilo.pesoViejo,
      C.porKilo.soloDiaPorDia,
      ...(sinPeso === 0 && e.pesoBuscadoDesde !== null ? [C.porKilo.buscadoDesde(diaYMes(e.pesoBuscadoDesde, hasta))] : []),
      C.loRegistrado,
      ...temporadasEnTexto(temporadas),
    ],
    metodo: C.porKilo.metodo,
    porSemana: null,
    comoTabla: false,
  };
}

/** El día siguiente: sin un «hoy», lo que va hasta el último día del gráfico cuenta entero. */
const diaSiguiente = (fecha: string): string => new Date(Date.parse(`${fecha}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** Una marca por fecha (los cuatro paneles repiten el día): para contar los días cargados después una sola vez. */
function unaPorFecha(marcas: readonly MarcaDelPanel[]): MarcaDelPanel[] {
  const vistas = new Map<string, MarcaDelPanel>();
  for (const m of marcas) {
    const antes = vistas.get(m.fecha);
    if (!antes || (m.tarde && !antes.tarde)) vistas.set(m.fecha, m);
  }
  return [...vistas.values()];
}
