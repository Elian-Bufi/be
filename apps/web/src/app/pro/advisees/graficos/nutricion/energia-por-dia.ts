/**
 * GR-12 · Las calorías registradas por día, con lo que se sabe de cada día (WP-GRAFICOS fase 2, rama C; DL-174).
 *
 * - Un punto por día con registros: lleno, hueco o con el contorno cortado, según lo que BE sabe del día
 *   (`dias-de-nutricion.ts`); un día sin registros no se dibuja ni es cero. Lo cargado después lleva su muesca.
 * - El objetivo del profesional en escalón y las temporadas de fondo (GR-11).
 * - **La media de cada semana** (GR-T42): el promedio de los días de esa semana con cantidades en todos sus registros, si
 *   son 4 o más. Dice con qué días se hizo y cuáles quedaron afuera, y por qué («con 5 de 7 días; 1 sin registro y 1 con
 *   cantidades faltantes»): promediar solo los días registrados con cuidado es un sesgo de selección y se dice. Si no
 *   alcanza, no hay media y se dice cuánto falta. Hoy no cuenta: el día sigue en curso.
 * - «Registrado», nunca otra palabra que sugiera lo que la persona comió de verdad (el subregistro es sistemático).
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { fechasDelRango, numero, semanasDelPeriodo, type PuntoAnalitico, type ResultadoDeProyeccionNutricional } from '@be/domain';
import type { CeldaDeLaTabla } from '../tabla-equivalente';
import { huecosEnTexto, type ElementoDeLaLeyenda, type GraficoArmado, type MarcaDelPanel, type PanelDeValores, type TramoDelPanel } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C, contar, enumerar } from './copy';
import { faltanCantidades, lecturaDelDia, marcaDelDia, puntosPorFecha, saberDelDia, valorDelDia, type MetricaDelGrafico } from './dias-de-nutricion';
import { escalonesDelObjetivo, objetivoDelDia, proporcionesDelObjetivo, temporadasDeNutricion } from './temporadas';

/** Con menos días con cantidades en todos sus registros, una semana no tiene media (GR-T42). */
export const MINIMO_DE_DIAS_PARA_LA_MEDIA = 4;

export interface MediaDeLaSemana {
  readonly lunes: string;
  /** Los días de la semana que caen en el período: de dónde a dónde va el tramo. */
  readonly desde: string;
  readonly hasta: string;
  /** `null`: no alcanza, no hay media. */
  readonly valor: number | null;
  /** Los días que entraron en el promedio. */
  readonly incluidos: number;
  /** Los días que cuentan: los de la semana en el período, sin hoy ni los que vienen. */
  readonly dias: number;
  /** «1.950 kcal por día de media · con 5 de 7 días; 1 sin registro y 1 con cantidades faltantes». */
  readonly texto: string;
}

/**
 * Las medias de las semanas que tocan [desde, hasta]. Entra cada día de la semana con un valor y cantidades en todos sus
 * registros (lleno o de contorno cortado); quedan afuera, y se cuentan, los días sin registro, los que tienen cantidades
 * faltantes o un dato que falta y los que tienen comidas del plan sin registro. Hoy y los días por venir no cuentan.
 */
export function mediasDeLasSemanas(puntos: readonly PuntoAnalitico[], metrica: MetricaDelGrafico, desde: string, hasta: string, hoy: string): MediaDeLaSemana[] {
  const porFecha = puntosPorFecha(puntos, desde, hasta);
  return semanasDelPeriodo(desde, hasta).map((s): MediaDeLaSemana => {
    const inicio = s.lunes < desde ? desde : s.lunes;
    const fin = s.domingo > hasta ? hasta : s.domingo;
    const cuentan = fechasDelRango(inicio, fin).filter((f) => f < hoy);
    let sinRegistro = 0;
    let conCantidadesFaltantes = 0;
    let conComidasSinRegistro = 0;
    let sinSaber = 0;
    const valores: number[] = [];
    for (const f of cuentan) {
      const p = porFecha.get(f);
      if (!p) sinRegistro++;
      else if (p.value === null) conCantidadesFaltantes++;
      else {
        const saber = saberDelDia(p);
        if (saber === 'CON_ALGO_QUE_FALTA') {
          if (faltanCantidades(p)) conCantidadesFaltantes++;
          else conComidasSinRegistro++;
        } else {
          if (saber === 'SIN_SABER_SI_FALTAN_COMIDAS') sinSaber++;
          valores.push(p.value);
        }
      }
    }
    const afuera = [
      ...(sinRegistro > 0 ? [C.media.sinRegistro(sinRegistro)] : []),
      ...(conCantidadesFaltantes > 0 ? [C.media.conCantidadesFaltantes(conCantidadesFaltantes)] : []),
      ...(conComidasSinRegistro > 0 ? [C.media.conComidasSinRegistro(conComidasSinRegistro)] : []),
    ];
    const extras = [...(sinSaber > 0 ? [C.media.sinSaber(sinSaber)] : []), ...(hoy >= inicio && hoy <= fin ? [C.media.hoyAfuera] : [])];
    const conCuantos = [`${C.media.conDias(valores.length, cuentan.length)}${afuera.length > 0 ? `; ${enumerar(afuera)}` : ''}`, ...extras].join(' · ');
    const valor = valores.length >= MINIMO_DE_DIAS_PARA_LA_MEDIA ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
    return {
      lunes: s.lunes,
      desde: inicio,
      hasta: fin,
      valor,
      incluidos: valores.length,
      dias: cuentan.length,
      texto: valor === null ? C.media.sinMedia(MINIMO_DE_DIAS_PARA_LA_MEDIA, conCuantos) : C.media.valor(valorDelDia(valor, metrica), conCuantos),
    };
  });
}

/** Lo que hace falta para armar GR-12. */
export interface EntradaDeEnergia {
  /** API-PRJ-01 `NUTRITION_PRESCRIBED_VS_RECORDED`, `ENERGY`, por día. */
  readonly resultado: ResultadoDeProyeccionNutricional;
  /** Los días con registros cargados después (API-DSH-04 con `late`); `null` si no se pudo leer. */
  readonly cargadoTarde: ReadonlySet<string> | null;
  /** El primer día que se dibuja (el del período o el del vínculo) y el último. */
  readonly desde: string;
  readonly hasta: string;
  readonly hoy: string;
}

/** Los renglones de la leyenda de los días: solo los que aparecen en el dibujo, para que la leyenda diga lo que se ve. */
export function leyendaDeLosDias(marcas: readonly Pick<MarcaDelPanel, 'marca' | 'tarde'>[], color: number): ElementoDeLaLeyenda[] {
  const hay = (m: MarcaDelPanel['marca']) => marcas.some((x) => x.marca === m);
  return [
    ...(hay('LLENA') ? [{ clave: 'con-todo', texto: C.leyenda.conTodo, muestra: { tipo: 'MARCA', marca: 'LLENA', forma: 'CIRCULO', color } } as const] : []),
    ...(hay('HUECA') ? [{ clave: 'subtotal', texto: C.leyenda.subtotal, muestra: { tipo: 'MARCA', marca: 'HUECA', forma: 'CIRCULO', color } } as const] : []),
    ...(hay('CONTORNO_CORTADO') ? [{ clave: 'sin-saber', texto: C.leyenda.sinSaber, muestra: { tipo: 'MARCA', marca: 'CONTORNO_CORTADO', forma: 'CIRCULO', color } } as const] : []),
    ...(marcas.some((x) => x.tarde) ? [{ clave: 'tarde', texto: C.leyenda.tarde, muestra: { tipo: 'TARDE' } } as const] : []),
  ];
}

/** Los días de una métrica como marcas de un panel: solo los que tienen valor, con su tramo (un hueco corta la línea). */
export function marcasDeLosDias(puntos: readonly PuntoAnalitico[], desde: string, hasta: string, tarde: ReadonlySet<string> | null, color: number, serie = 'registrado'): MarcaDelPanel[] {
  return [...puntosPorFecha(puntos, desde, hasta).values()].flatMap((p): MarcaDelPanel[] => {
    const marca = marcaDelDia(p);
    return marca === null || p.value === null
      ? []
      : [{ clave: p.pointId, serie, fecha: p.date, en: null, valor: p.value, marca, forma: 'CIRCULO', color, tarde: tarde?.has(p.date) ?? false, tramo: p.segment }];
  });
}

/** GR-12 armado: el panel, las temporadas, la tabla (que también es la lectura) y su texto. */
export function graficoDeEnergia(e: EntradaDeEnergia): GraficoArmado {
  const { resultado, desde, hasta, hoy } = e;
  const puntos = resultado.recorded.points;
  const objetivo = resultado.prescribed.objectiveSteps;
  const marcas = marcasDeLosDias(puntos, desde, hasta, e.cargadoTarde, 0);
  const medias = mediasDeLasSemanas(puntos, 'ENERGY', desde, hasta, hoy);
  const tramosDeLasMedias = medias.flatMap((m): TramoDelPanel[] => (m.valor === null ? [] : [{ clave: `media:${m.lunes}`, desde: m.desde, hasta: m.hasta, valor: m.valor, color: 0 }]));
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
    medias: tramosDeLasMedias,
  };
  const porFecha = puntosPorFecha(puntos, desde, hasta);
  const mediaDe = (fecha: string) => medias.find((m) => fecha >= m.desde && fecha <= m.hasta) ?? null;
  const filas = [...porFecha.values()].map((p) => {
    const tarde = e.cargadoTarde?.has(p.date) ?? false;
    const registrado: CeldaDeLaTabla = { texto: lecturaDelDia(p, 'ENERGY', tarde), marca: marcaDelDia(p), tarde };
    const objetivoDelDiaTexto = objetivoDelDia(objetivo, 'ENERGY', p.date);
    const delObjetivo: CeldaDeLaTabla = { texto: objetivoDelDiaTexto ?? C.sinObjetivo, marca: null, tarde: false };
    const media = mediaDe(p.date);
    const deLaMedia: CeldaDeLaTabla | null = media ? { texto: media.texto, marca: null, tarde: false } : null;
    return { fecha: p.date, celdas: [registrado, delObjetivo, deLaMedia] };
  });
  const conValor = [...porFecha.values()].filter((p) => p.value !== null);
  const cuenta = (s: ReturnType<typeof saberDelDia>) => conValor.filter((p) => saberDelDia(p) === s).length;
  const conMedia = medias.filter((m) => m.valor !== null).length;
  const objetivos = escalones.map((t) => `${numero(t.valor)} kcal por día desde el ${Number(t.desde.slice(8, 10))}/${Number(t.desde.slice(5, 7))}`);
  const descripcion = [
    `${C.energia.titulo}: ${contar(porFecha.size, 'día con registros', 'días con registros')}.`,
    `${contar(cuenta('CON_TODO'), 'día', 'días')} ${C.conTodo}; ${contar(cuenta('CON_ALGO_QUE_FALTA'), 'subtotal', 'subtotales')}; en ${contar(cuenta('SIN_SABER_SI_FALTAN_COMIDAS'), 'día', 'días')} no se puede saber si faltan comidas.`,
    `${contar(conMedia, 'semana tiene', 'semanas tienen')} media.`,
    ...(objetivos.length > 0 ? [`Objetivo del profesional: ${enumerar(objetivos)}.`] : []),
  ].join(' ');
  const temporadas = temporadasDeNutricion(resultado.planVersions, objetivo, desde, hasta);
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
    leyenda: [
      ...leyendaDeLosDias(marcas, 0),
      ...(escalones.length > 0 ? [{ clave: 'objetivo', texto: C.leyenda.objetivo, muestra: { tipo: 'ESCALON', color: 0 } } as const] : []),
      ...(tramosDeLasMedias.length > 0 ? [{ clave: 'media', texto: C.leyenda.media, muestra: { tipo: 'MEDIA', color: 0 } } as const] : []),
      ...(temporadas.length > 0 ? [{ clave: 'temporada', texto: C.leyenda.temporada, muestra: { tipo: 'TEMPORADA' } } as const] : []),
    ],
    notas: [
      `${C.metodoDeLaSuma}. ${C.loRegistrado}`,
      C.energia.metodoDeLaMedia(MINIMO_DE_DIAS_PARA_LA_MEDIA),
      C.diaSinRegistros,
      ...proporcionesDelObjetivo(objetivo, 'ENERGY', C.energia.panel, desde, hasta),
      ...(e.cargadoTarde === null ? [C.sinLoCargadoDespues] : []),
    ],
  };
}
