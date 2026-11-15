/**
 * GR-12 · Las calorías registradas por día, con lo que se sabe de cada día (WP-GRAFICOS fase 2, rama C; DL-174).
 *
 * - Un punto por día con registros: lleno, hueco o con el contorno cortado, según lo que BE sabe del día
 *   (`dias-de-nutricion.ts`); un día sin registros no se dibuja ni es cero. Lo cargado después lleva su muesca.
 * - El objetivo del profesional en escalón y las temporadas de fondo (GR-11).
 * - **Por semana** (GR-VC01; de entrada con más de seis semanas): una barra por semana con la media de la semana (v1,
 *   GR-T42: los días con cantidades en todos sus registros, si son 4 o más), que dice con qué días se hizo y cuáles
 *   quedaron afuera, y por qué; sin media, una columna gris (`por-semana.ts`). «Día por día», a un toque.
 * - «Registrado», nunca otra palabra que sugiera lo que la persona comió de verdad (el subregistro es sistemático).
 *
 * Qué se ve y qué va a «Cómo leerlo» (§5 manda sobre la guía visual): el método, en la línea tenue; a la vista, lo cargado
 * después (§5.14), lo de otro profesional y un objetivo en proporción, que no se dibuja; en «Cómo leerlo», el método
 * entero, que es lo registrado y no la ingesta, y por qué un día sin registros no es un cero.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { numero, type PuntoAnalitico, type ResultadoDeProyeccionNutricional } from '@be/domain';
import type { CeldaDeLaTabla } from '../tabla-equivalente';
import { diaYMes, huecosEnTexto, type ElementoDeLaLeyenda, type GraficoArmado, type MarcaDelPanel, type PanelDeValores } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C, contar, enumerar } from './copy';
import { lecturaDelDia, marcaDelDia, puntosPorFecha, saberDelDia } from './dias-de-nutricion';
import { coberturaDeLosDias, loCargadoDespuesEnElPeriodo, mediasDeLasSemanas, MINIMO_DE_DIAS_PARA_LA_MEDIA, porSemanaDelGrafico, semanasDelPanel } from './por-semana';
import { escalonesDelObjetivo, objetivoDelDia, proporcionesDelObjetivo, temporadasDeNutricion } from './temporadas';

export { mediasDeLasSemanas, MINIMO_DE_DIAS_PARA_LA_MEDIA, type MediaDeLaSemana } from './por-semana';

/** Lo que hace falta para armar GR-12. */
export interface EntradaDeEnergia {
  /** API-PRJ-01 `NUTRITION_PRESCRIBED_VS_RECORDED`, `ENERGY`, por día. */
  readonly resultado: ResultadoDeProyeccionNutricional;
  /** Los días con registros cargados después (API-DSH-04 con `late`); `null` si no se pudo leer. */
  readonly cargadoTarde: ReadonlySet<string> | null;
  /** Si la lectura de lo cargado después quedó a medias, desde qué día se sabe (`loCargadoDespues`). */
  readonly cargadoTardeSabidoDesde?: string | null;
  /** El primer día que se dibuja (el del período o el del vínculo) y el último. */
  readonly desde: string;
  readonly hasta: string;
  readonly hoy: string;
  /**
   * API-PRJ-01 respondió con `partialView`: hay registros de comida de otro profesional en estas fechas, que no se ven ni
   * suman. Sin decirlo, un día se leería como todo lo que la persona registró.
   */
  readonly parcial?: boolean;
}

/** La nota de lo que no se ve: los registros de comida de otro profesional, que no están en los números. */
export const notasDeLaVistaParcial = (parcial: boolean | undefined): string[] => (parcial ? [C.deOtroProfesional] : []);

/** La nota de lo cargado después: no se pudo leer, o se sabe solo desde un día (la lectura quedó a medias). */
export function notasDeLoCargadoDespues(cargadoTarde: ReadonlySet<string> | null, sabidoDesde: string | null | undefined, hasta?: string): string[] {
  if (cargadoTarde === null) return [C.sinLoCargadoDespues];
  return sabidoDesde ? [C.cargadoDespuesDesde(diaYMes(sabidoDesde, hasta))] : [];
}

/** Una ficha de la leyenda con su texto corto y el entero. */
const ficha = (clave: string, t: { readonly texto: string; readonly largo: string }, muestra: ElementoDeLaLeyenda['muestra']): ElementoDeLaLeyenda => ({ clave, texto: t.texto, largo: t.largo, muestra });

/** Las fichas de la leyenda de los días: solo las que aparecen en el dibujo, para que la leyenda diga lo que se ve. */
export function leyendaDeLosDias(marcas: readonly Pick<MarcaDelPanel, 'marca' | 'tarde'>[], color: number): ElementoDeLaLeyenda[] {
  const hay = (m: MarcaDelPanel['marca']) => marcas.some((x) => x.marca === m);
  return [
    ...(hay('LLENA') ? [ficha('con-todo', C.leyenda.conTodo, { tipo: 'MARCA', marca: 'LLENA', forma: 'CIRCULO', color })] : []),
    ...(hay('HUECA') ? [ficha('subtotal', C.leyenda.subtotal, { tipo: 'MARCA', marca: 'HUECA', forma: 'CIRCULO', color })] : []),
    ...(hay('CONTORNO_CORTADO') ? [ficha('sin-saber', C.leyenda.sinSaber, { tipo: 'MARCA', marca: 'CONTORNO_CORTADO', forma: 'CIRCULO', color })] : []),
    ...(marcas.some((x) => x.tarde) ? [ficha('tarde', C.leyenda.tarde, { tipo: 'TARDE' })] : []),
  ];
}

/** Las fichas comunes de Nutrición: el objetivo y las versiones del plan, si se ven. */
export function leyendaDelObjetivoYLasTemporadas(conObjetivo: boolean, conTemporadas: boolean): ElementoDeLaLeyenda[] {
  return [...(conObjetivo ? [ficha('objetivo', C.leyenda.objetivo, { tipo: 'ESCALON', color: 0 })] : []), ...(conTemporadas ? [ficha('temporada', C.leyenda.temporada, { tipo: 'TEMPORADA' })] : [])];
}

export { ficha as fichaDeLaLeyenda };

/** Los días de una métrica como marcas de un panel: solo los que tienen valor, con su tramo (un hueco corta la línea). */
export function marcasDeLosDias(puntos: readonly PuntoAnalitico[], desde: string, hasta: string, tarde: ReadonlySet<string> | null, color: number, serie = 'registrado'): MarcaDelPanel[] {
  return [...puntosPorFecha(puntos, desde, hasta).values()].flatMap((p): MarcaDelPanel[] => {
    const marca = marcaDelDia(p);
    return marca === null || p.value === null
      ? []
      : [{ clave: p.pointId, serie, fecha: p.date, en: null, valor: p.value, marca, forma: 'CIRCULO', color, tarde: tarde?.has(p.date) ?? false, tramo: p.segment }];
  });
}

/** Lo común de las aclaraciones de Nutrición, en «Cómo leerlo»: el método entero y por qué un hueco no es un cero. */
export const aclaracionesDeLaSuma = (): string[] => [`${C.metodoDeLaSuma}. ${C.loRegistrado}`, C.diaSinRegistros];

/** GR-12 armado: el panel, las temporadas, la tabla (que también es la lectura) y su texto. */
export function graficoDeEnergia(e: EntradaDeEnergia): GraficoArmado {
  const { resultado, desde, hasta, hoy } = e;
  const puntos = resultado.recorded.points;
  const objetivo = resultado.prescribed.objectiveSteps;
  const marcas = marcasDeLosDias(puntos, desde, hasta, e.cargadoTarde, 0);
  const medias = mediasDeLasSemanas(puntos, 'ENERGY', desde, hasta, hoy);
  const escalones = escalonesDelObjetivo(objetivo, desde, hasta, 0);
  const panel: PanelDeValores = {
    tipo: 'VALORES',
    id: 'energia',
    nombre: C.energia.panel,
    unidad: 'kcal',
    metodo: C.metodoDeLaSuma,
    escala: { enteros: true, desdeCero: true },
    marcas,
    uniones: [],
    escalones,
    semanas: semanasDelPanel(medias, 'energia'),
    cobertura: coberturaDeLosDias(puntos, desde, hasta, hoy),
  };
  const porFecha = puntosPorFecha(puntos, desde, hasta);
  const mediaDe = (fecha: string) => medias.find((m) => fecha >= m.desde && fecha <= m.hasta) ?? null;
  const filas = [...porFecha.values()].map((p) => {
    const tarde = e.cargadoTarde?.has(p.date) ?? false;
    const registrado: CeldaDeLaTabla = { texto: lecturaDelDia(p, 'ENERGY', tarde), marca: marcaDelDia(p), tarde, registrada: true };
    const objetivoDelDiaTexto = objetivoDelDia(objetivo, 'ENERGY', p.date);
    const delObjetivo: CeldaDeLaTabla = { texto: objetivoDelDiaTexto ?? C.sinObjetivo, marca: null, tarde: false, registrada: true };
    const media = mediaDe(p.date);
    const deLaMedia: CeldaDeLaTabla | null = media ? { texto: media.texto, marca: null, tarde: false, registrada: true } : null;
    return { fecha: p.date, celdas: [registrado, delObjetivo, deLaMedia] };
  });
  const conValor = [...porFecha.values()].filter((p) => p.value !== null);
  const cuenta = (s: ReturnType<typeof saberDelDia>) => conValor.filter((p) => saberDelDia(p) === s).length;
  const conMedia = medias.filter((m) => m.valor !== null).length;
  const objetivos = escalones.map((t) => `${numero(t.valor)} kcal por día desde el ${diaYMes(t.desde, hasta)}`);
  const temporadas = temporadasDeNutricion(resultado.planVersions, objetivo, desde, hasta);
  const descripcion = [
    `${C.energia.titulo}: ${contar(porFecha.size, 'día con registros', 'días con registros')}.`,
    `${contar(cuenta('CON_TODO'), 'día', 'días')} ${C.conTodo}; ${contar(cuenta('CON_ALGO_QUE_FALTA'), 'subtotal', 'subtotales')}; en ${contar(cuenta('SIN_SABER_SI_FALTAN_COMIDAS'), 'día', 'días')} no se puede saber si faltan comidas.`,
    `${contar(conMedia, 'semana tiene', 'semanas tienen')} media.`,
    ...(objetivos.length > 0 ? [`Objetivo del profesional: ${enumerar(objetivos)}.`] : []),
    ...(temporadas.length > 0 ? [`${C.temporadas}: ${temporadas.map((t) => t.rotulo).join('; ')}.`] : []),
  ].join(' ');
  const comunes = leyendaDelObjetivoYLasTemporadas(escalones.length > 0, temporadas.length > 0);
  return {
    paneles: [panel],
    temporadas,
    tabla: {
      columnas: [
        { id: 'registrado', nombre: C.energia.panel, unidad: 'kcal' },
        { id: 'objetivo', nombre: C.energia.columnaObjetivo, unidad: C.energia.unidadPorDia },
        { id: 'media', nombre: C.energia.columnaMedia, unidad: C.energia.unidadPorDia },
      ],
      filas,
      sinRegistros: huecosEnTexto(resultado.recorded.gaps, desde, hasta),
    },
    descripcion,
    leyenda: [...leyendaDeLosDias(marcas, 0), ...comunes],
    notas: [
      ...proporcionesDelObjetivo(objetivo, 'ENERGY', C.energia.panel, desde, hasta),
      ...loCargadoDespuesEnElPeriodo(marcas),
      ...notasDeLoCargadoDespues(e.cargadoTarde, e.cargadoTardeSabidoDesde, hasta),
      ...notasDeLaVistaParcial(e.parcial),
    ],
    aclaraciones: [...aclaracionesDeLaSuma(), C.energia.metodoDeLaMedia(MINIMO_DE_DIAS_PARA_LA_MEDIA), ...temporadasEnTexto(temporadas)],
    metodo: C.metodoDeLaSuma,
    porSemana: porSemanaDelGrafico({ paneles: [panel], leyendaExtra: comunes }),
    comoTabla: false,
  };
}

/** Las temporadas enteras, en texto, para «Cómo leerlo» (el dibujo lleva el rótulo que entra). */
export const temporadasEnTexto = (temporadas: readonly { readonly rotulo: string }[]): string[] => (temporadas.length > 0 ? [`${C.temporadas}: ${temporadas.map((t) => t.rotulo).join(' · ')}.`] : []);
