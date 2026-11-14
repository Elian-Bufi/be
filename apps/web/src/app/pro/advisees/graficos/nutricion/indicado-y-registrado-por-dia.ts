/**
 * GR-14 · Lo indicado y lo registrado, día por día (WP-GRAFICOS fase 2, rama C; DL-174).
 *
 * - Por día y por métrica (calorías, proteínas, carbohidratos y grasas), una mancuerna: un rombo hueco para lo indicado
 *   en el plan y un círculo para lo registrado, con la marca de lo que BE sabe del día. Se unen y se escribe la
 *   diferencia («+18 g») **solo en los días con cantidades en todos sus registros y sin comidas del plan sin registro**
 *   (GR-T45): restarle lo indicado a un subtotal diría que faltó algo que solo falta registrar.
 * - **Hay indicado del día solo si el plan no deja elegir** (DL-158): con varias opciones en una comida, no hay rombo y se
 *   dice por qué. BE no elige entre alternativas, no las suma ni las promedia.
 * - Debajo, una tira por comida del plan (API-NUT-17, en tramos de 92 días): con la opción del plan, con una comida
 *   diferente o sin registro. Un día sin registros no es «todas las comidas sin registro»: es un hueco y no se dibuja.
 * - Sin rojo, sin el signo de porcentaje y sin palabras que califiquen: la diferencia es una resta con su signo.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import {
  CAPAS_DE_LA_COMPARACION,
  motivoCortoSinIndicadoDelDia,
  numero,
  sinIndicadoParaDibujar,
  type ContrasteDescriptivo,
  type IndicadoDelDiaApi,
  type PuntoAnalitico,
  type ResultadoDeProyeccionNutricional,
} from '@be/domain';
import type { CeldaDeLaTabla } from '../tabla-equivalente';
import { huecosEnTexto, type ElementoDeLaLeyenda, type EstadoDeLaComida, type FilaDeLaTira, type GraficoArmado, type MarcaDelPanel, type PanelDeTira, type PanelDeValores, type UnionDelPanel } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C, contar } from './copy';
import { calidadDelDia, marcaDelDia, puntosPorFecha, saberDelDia, valorDelDia, type MetricaDelGrafico } from './dias-de-nutricion';
import { leyendaDeLosDias } from './energia-por-dia';
import { temporadasDeNutricion } from './temporadas';

type DiaDelContraste = ContrasteDescriptivo['days'][number];

/** Una métrica de GR-14: calorías y los tres macronutrientes, cada uno en su unidad. */
export interface MetricaDeLaComparacion {
  readonly metrica: MetricaDelGrafico;
  readonly serie: string;
  readonly nombre: string;
  readonly unidad: 'kcal' | 'g';
  readonly decimales: number;
}

export const METRICAS_DE_LA_COMPARACION: readonly MetricaDeLaComparacion[] = [
  { metrica: 'ENERGY', serie: 'nutricion.energia', nombre: 'Calorías', unidad: 'kcal', decimales: 0 },
  { metrica: 'PROTEIN', serie: 'nutricion.proteinas', nombre: 'Proteínas', unidad: 'g', decimales: 1 },
  { metrica: 'CARBOHYDRATE', serie: 'nutricion.carbohidratos', nombre: 'Carbohidratos', unidad: 'g', decimales: 1 },
  { metrica: 'FAT', serie: 'nutricion.grasas', nombre: 'Grasas', unidad: 'g', decimales: 1 },
];

/** La diferencia de lo registrado menos lo indicado, con su signo: «+18 g», «−12,5 g», «0 g». */
export function diferenciaConSigno(registrado: number, indicado: number, unidad: string, decimales: number): string {
  const d = Number((registrado - indicado).toFixed(decimales));
  const signo = d > 0 ? '+' : d < 0 ? '−' : '';
  return `${signo}${numero(Math.abs(d), decimales)} ${unidad}`;
}

/** El estado de cada comida del plan en un día con registros y comidas conocidas; `null` si no se dibuja. */
export function comidasDelDia(d: DiaDelContraste): readonly { readonly nombre: string; readonly clave: string; readonly estado: EstadoDeLaComida }[] | null {
  if (d.dataState !== 'HAS_DATA' || d.meals.length === 0) return null;
  return d.meals.map((m): { readonly nombre: string; readonly clave: string; readonly estado: EstadoDeLaComida } => ({
    clave: m.mealId,
    nombre: m.label,
    estado: m.state === 'REGISTERED' ? 'CON_OPCION' : m.differentMealExecutionIds.length > 0 ? 'COMIDA_DIFERENTE' : 'SIN_REGISTRO',
  }));
}

/** La tira por comida: una fila por nombre de comida, en el orden en que aparecen, y una celda por día con registros. */
export function tiraDeLasComidas(dias: readonly DiaDelContraste[], desde: string, hasta: string): PanelDeTira {
  const filas = new Map<string, { nombre: string; celdas: { fecha: string; estado: EstadoDeLaComida }[] }>();
  for (const d of [...dias].sort((a, b) => a.date.localeCompare(b.date))) {
    if (d.date < desde || d.date > hasta) continue;
    for (const c of comidasDelDia(d) ?? []) {
      const fila = filas.get(c.nombre) ?? { nombre: c.nombre, celdas: [] };
      fila.celdas.push({ fecha: d.date, estado: c.estado });
      filas.set(c.nombre, fila);
    }
  }
  return { tipo: 'TIRA', id: 'comidas', nombre: C.indicadoYRegistrado.tira, filas: [...filas.entries()].map(([clave, f]): FilaDeLaTira => ({ clave, nombre: f.nombre, celdas: f.celdas })) };
}

/** Lo que dice la columna de las comidas de un día. */
export function comidasEnPalabras(d: DiaDelContraste | undefined): string | null {
  if (!d) return null;
  if (d.dataState !== 'HAS_DATA') return C.indicadoYRegistrado.sinRegistros;
  if (d.meals.length === 0) return d.planId ? C.indicadoYRegistrado.comidasSinDiaTipo : C.indicadoYRegistrado.comidasSinPlan;
  return (comidasDelDia(d) ?? []).map((c) => C.indicadoYRegistrado.comidaEnLaCelda(c.nombre, C.indicadoYRegistrado.estadoDeLaComida[c.estado])).join(' · ');
}

export interface EntradaDeLaComparacion {
  /** Una lectura por métrica, por día, en el orden de `METRICAS_DE_LA_COMPARACION`. */
  readonly resultados: readonly ResultadoDeProyeccionNutricional[];
  /** Los días de API-NUT-17 (en tramos); `null` si no se pudieron leer: la tira no está y se dice. */
  readonly contraste: readonly DiaDelContraste[] | null;
  readonly desde: string;
  readonly hasta: string;
  /** Se leyó en tramos de 92 días: la pantalla lo dice. */
  readonly enTramos: boolean;
}

/** Lo de un día de una métrica: lo registrado (si hay), lo indicado y, si corresponde, la diferencia. */
export function celdaDeLaComparacion(m: MetricaDeLaComparacion, p: PuntoAnalitico | undefined, indicado: IndicadoDelDiaApi | undefined): CeldaDeLaTabla | null {
  const conIndicado = indicado?.state === 'DETERMINED' ? indicado : null;
  if (!p && !conIndicado) return null;
  const partes: string[] = [];
  if (p && p.value !== null) partes.push(C.indicadoYRegistrado.registrado(`${valorDelDia(p.value, m.metrica)} (${calidadDelDia(p, false)})`));
  else if (p) partes.push(calidadDelDia(p, false));
  else partes.push(C.indicadoYRegistrado.sinRegistro);
  if (conIndicado) partes.push(C.indicadoYRegistrado.indicado(valorDelDia(conIndicado.value, m.metrica)));
  else if (indicado && indicado.state === 'UNDETERMINED') partes.push(motivoCortoSinIndicadoDelDia(indicado));
  if (p && p.value !== null && conIndicado) {
    const saber = saberDelDia(p);
    if (saber === 'CON_TODO') partes.push(C.indicadoYRegistrado.diferencia(diferenciaConSigno(p.value, conIndicado.value, m.unidad, m.decimales)));
    else partes.push(saber === 'CON_ALGO_QUE_FALTA' ? C.indicadoYRegistrado.subtotalSinDiferencia : C.indicadoYRegistrado.sinSaberSinDiferencia);
  }
  return { texto: partes.join(' · '), marca: p ? marcaDelDia(p) : 'ROMBO', tarde: false };
}

/** GR-14 armado: un panel por métrica, la tira por comida, la tabla y su texto. */
export function graficoDeLaComparacion(e: EntradaDeLaComparacion): GraficoArmado {
  const { desde, hasta } = e;
  const porMetrica = METRICAS_DE_LA_COMPARACION.map((m, i) => {
    const r = e.resultados[i]!;
    const puntos = puntosPorFecha(r.recorded.points, desde, hasta);
    const indicados = new Map(r.prescribed.planned.days.filter((d) => d.date >= desde && d.date <= hasta).map((d) => [d.date, d] as const));
    return { m, r, puntos, indicados };
  });
  const paneles: PanelDeValores[] = porMetrica.map(({ m, puntos, indicados }): PanelDeValores => {
    const registrado = [...puntos.values()].flatMap((p): MarcaDelPanel[] => {
      const marca = marcaDelDia(p);
      return marca === null || p.value === null ? [] : [{ clave: p.pointId, serie: 'registrado', fecha: p.date, en: null, valor: p.value, marca, forma: 'CIRCULO', color: 0, tarde: false, tramo: null }];
    });
    const indicado = [...indicados.values()].flatMap((d): MarcaDelPanel[] =>
      d.state === 'DETERMINED' ? [{ clave: `indicado:${d.date}`, serie: 'indicado', fecha: d.date, en: null, valor: d.value, marca: 'ROMBO', forma: 'CIRCULO', color: null, tarde: false, tramo: null }] : [],
    );
    const uniones = [...puntos.values()].flatMap((p): UnionDelPanel[] => {
      const d = indicados.get(p.date);
      if (p.value === null || !d || d.state !== 'DETERMINED' || saberDelDia(p) !== 'CON_TODO') return [];
      return [{ clave: `diferencia:${p.date}`, fecha: p.date, en: null, desde: d.value, hasta: p.value, rotulo: diferenciaConSigno(p.value, d.value, m.unidad, m.decimales), forma: 'DIFERENCIA' }];
    });
    return { tipo: 'VALORES', id: m.serie, nombre: m.nombre, unidad: m.unidad, metodo: null, escala: { enteros: m.unidad === 'kcal', desdeCero: true }, marcas: [...indicado, ...registrado], uniones, escalones: [], medias: [] };
  });
  const tira = e.contraste ? tiraDeLasComidas(e.contraste, desde, hasta) : null;
  const contrastePorFecha = new Map((e.contraste ?? []).map((d) => [d.date, d] as const));
  const fechas = [
    ...new Set([
      ...porMetrica.flatMap(({ puntos, indicados }) => [...puntos.keys(), ...[...indicados.values()].filter((d) => d.state === 'DETERMINED').map((d) => d.date)]),
      ...[...contrastePorFecha.values()].filter((d) => d.dataState === 'HAS_DATA' && d.date >= desde && d.date <= hasta).map((d) => d.date),
    ]),
  ].sort();
  const filas = fechas.map((fecha) => {
    const comidas = comidasEnPalabras(contrastePorFecha.get(fecha));
    return {
      fecha,
      celdas: [
        ...porMetrica.map(({ m, puntos, indicados }) => celdaDeLaComparacion(m, puntos.get(fecha), indicados.get(fecha))),
        ...(e.contraste ? [comidas === null ? null : ({ texto: comidas, marca: null, tarde: false } satisfies CeldaDeLaTabla)] : []),
      ],
    };
  });
  const primera = e.resultados[0];
  const temporadas = primera ? temporadasDeNutricion(primera.planVersions, primera.prescribed.objectiveSteps, desde, hasta) : [];
  const marcas = paneles.flatMap((p) => p.marcas.filter((x) => x.color !== null));
  const conIndicado = paneles.some((p) => p.marcas.some((x) => x.color === null));
  const conUniones = paneles.some((p) => p.uniones.length > 0);
  const sinIndicado = primera ? sinIndicadoParaDibujar(primera.prescribed.planned.days.filter((d) => d.date >= desde && d.date <= hasta)) : null;
  const estados = new Set((tira?.filas ?? []).flatMap((f) => f.celdas.map((c) => c.estado)));
  const leyendaDeLaTira: ElementoDeLaLeyenda[] = (['CON_OPCION', 'COMIDA_DIFERENTE', 'SIN_REGISTRO'] as const)
    .filter((s) => estados.has(s))
    .map((s): ElementoDeLaLeyenda => ({ clave: `comida-${s}`, texto: s === 'CON_OPCION' ? C.leyenda.conOpcion : s === 'COMIDA_DIFERENTE' ? C.leyenda.comidaDiferente : C.leyenda.sinRegistro, muestra: { tipo: 'COMIDA', estado: s } }));
  const diasConDiferencia = new Set(paneles.flatMap((p) => p.uniones.map((u) => u.fecha))).size;
  return {
    paneles: tira && tira.filas.length > 0 ? [...paneles, tira] : paneles,
    temporadas,
    tabla: {
      columnas: [
        ...METRICAS_DE_LA_COMPARACION.map((m) => ({ id: m.serie, nombre: m.nombre, unidad: m.unidad })),
        ...(e.contraste ? [{ id: 'comidas', nombre: C.indicadoYRegistrado.columnaComidas, unidad: contar(tira?.filas.length ?? 0, 'comida', 'comidas') }] : []),
      ],
      filas,
      sinRegistros: primera ? huecosEnTexto(primera.recorded.gaps, desde, hasta) : [],
    },
    descripcion: `${C.indicadoYRegistrado.titulo}: ${contar(fechas.length, 'día', 'días')} con algo registrado o indicado; en ${contar(diasConDiferencia, 'día', 'días')} la diferencia va escrita.`,
    leyenda: [
      ...leyendaDeLosDias(marcas, 0),
      ...(conIndicado ? [{ clave: 'indicado', texto: C.leyenda.indicado, muestra: { tipo: 'MARCA', marca: 'ROMBO', forma: 'CIRCULO', color: null } } as const] : []),
      ...(conUniones ? [{ clave: 'diferencia', texto: C.leyenda.diferencia, muestra: { tipo: 'UNION', forma: 'DIFERENCIA' } } as const] : []),
      ...leyendaDeLaTira,
      ...(temporadas.length > 0 ? [{ clave: 'temporada', texto: C.leyenda.temporada, muestra: { tipo: 'TEMPORADA' } } as const] : []),
    ],
    notas: [
      C.indicadoYRegistrado.comoSeLeeLaDiferencia,
      CAPAS_DE_LA_COMPARACION.regla,
      C.indicadoYRegistrado.comidaDiferenteSinCantidades,
      ...(sinIndicado ? [sinIndicado] : []),
      ...(e.contraste === null ? [C.indicadoYRegistrado.sinTira] : []),
      ...(e.enTramos ? ['Las comidas de cada día se leyeron en tramos de 92 días.'] : []),
    ],
  };
}
