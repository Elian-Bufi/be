'use client';

/**
 * Las lecturas de los gráficos de Nutrición (WP-GRAFICOS fase 2, rama C; DL-174). Todas van a la API con el acceso de
 * ese momento y pasan por `limitarLectura` (cuatro a la vez); dos gráficos de la misma página que piden lo mismo mientras
 * está en vuelo comparten la lectura (`compartirLecturaEnCurso`), sin guardar nada después.
 * - Cada métrica, por día: API-PRJ-01 `NUTRITION_PRESCRIBED_VS_RECORDED` (lo registrado, el objetivo, lo indicado del día,
 *   la cobertura y las versiones).
 * - Lo cargado después: API-DSH-04 de Nutrición con `late`, leída entera (de a 50).
 * - Las comidas de cada día: API-NUT-17 en tramos de 92 días (GR-14).
 * - Los pesos de las tomas: API-PRJ-01 `ANTHROPOMETRY_LONGITUDINAL` (`peso`), solo para los g/kg, que se ofrecen con los
 *   dos alcances y tomas propias (GR-T13). Si el período no trae un peso anterior al primer día con registros, se busca
 *   hasta un año antes, sin pasar del inicio del vínculo (GR-T44).
 *
 * `leerSeriePorKilo` es lo que despacha `leerSerieDelCatalogo` (la base) para las series derivadas de los g/kg.
 */
import {
  definicionDeMetrica,
  todasLasPaginas,
  type ContrasteDescriptivo,
  type MetricaNutricional,
  type ResultadoDeProyeccionNutricional,
  type SerieDisponible,
} from '@be/domain';
import { api } from '../../../../../lib/api';
import { limitarLectura, motivoDeFalla } from '../../seguimiento/contexto';
import type { EstadoDeSerie } from '../../seguimiento/series';
import { inicioDelEje, type PeriodoDelGrafico } from '../eje-de-fechas';
import { compartirLecturaEnCurso, leerEnTramos, type ParametrosDeLectura } from '../lecturas';
import type { Leido } from '../nutricion-y-cuerpo/leido';
import { inicioDeLaBusquedaDelPeso, pesosMedidos, serieAnaliticaPorKilo, type PesoDeLaToma } from './gramos-por-kilo';
import type { MetricaDelGrafico } from './dias-de-nutricion';

export type LecturaBase = Omit<ParametrosDeLectura, 'periodo'>;

type Respuesta = Awaited<ReturnType<typeof api.proyeccion>>;

/** La falla de una respuesta: la sesión perdida, un 404 (sin acceso, anti-enumeración) u otra falla, que se dice. */
function fallaDe(l: LecturaBase, r: Exclude<Respuesta, { ok: true }> | Awaited<ReturnType<typeof api.contextoDeRevision>> | Awaited<ReturnType<typeof api.lineaDeTiempo>>): Exclude<Leido<never>, { tipo: 'LISTO' }> {
  if (l.sesionPerdida(r)) return { tipo: 'SESION' };
  if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return { tipo: 'SIN_ACCESO' };
  return { tipo: 'ERROR', motivo: motivoDeFalla(r) };
}

export interface LecturaNutricional {
  /** `null` si la API respondió sin resultado (sin registros en el período). */
  readonly resultado: ResultadoDeProyeccionNutricional | null;
  readonly parcial: boolean;
  readonly generada: string;
  readonly zona: string;
}

/** Una métrica de Nutrición, por día, de `desde` a `hasta` (hasta 366 días). */
export async function leerMetricaNutricional(l: LecturaBase, metrica: MetricaDelGrafico, desde: string, hasta: string): Promise<Leido<LecturaNutricional>> {
  const r = await compartirLecturaEnCurso(`nutricion|${l.asesoradoId}|${metrica}|${desde}|${hasta}`, () =>
    limitarLectura(() => api.proyeccion(l.token, l.asesoradoId, 'NUTRITION_PRESCRIBED_VS_RECORDED', { periodStart: desde, periodEnd: hasta, metric: metrica, grain: 'DAY' })),
  );
  if (!r.ok || l.sesionPerdida(r)) return fallaDe(l, r as Exclude<Respuesta, { ok: true }>);
  const d = r.datos.data;
  if (d.dataState === 'NOT_AVAILABLE_TO_VIEW') return { tipo: 'SIN_ACCESO' };
  const resultado = d.result && d.result.kind === 'NUTRITION_PRESCRIBED_VS_RECORDED' ? d.result : null;
  return { tipo: 'LISTO', datos: { resultado, parcial: d.partialView, generada: d.generatedAt, zona: d.period.timeZone } };
}

/** Varias métricas a la vez; si una falla, falla la lectura entera (lo que falta no es «sin datos»). */
export async function leerMetricasNutricionales(l: LecturaBase, metricas: readonly MetricaDelGrafico[], desde: string, hasta: string): Promise<Leido<readonly LecturaNutricional[]>> {
  const leidas = await Promise.all(metricas.map((m) => leerMetricaNutricional(l, m, desde, hasta)));
  const datos: LecturaNutricional[] = [];
  for (const x of leidas) {
    if (x.tipo !== 'LISTO') return x;
    datos.push(x.datos);
  }
  return { tipo: 'LISTO', datos };
}

/** Los días con registros de comida cargados en un día posterior (API-DSH-04 con `late`). */
export async function leerDiasCargadosDespues(l: LecturaBase, desde: string, hasta: string): Promise<Leido<ReadonlySet<string>>> {
  const r = await compartirLecturaEnCurso(`tarde|${l.asesoradoId}|${desde}|${hasta}`, () =>
    todasLasPaginas(
      async (f) => {
        const pagina = await limitarLectura(() => api.lineaDeTiempo(l.token, l.asesoradoId, { periodStart: desde, periodEnd: hasta, domain: 'NUTRITION', type: 'MEAL_RECORDED', late: 'true', ...f }));
        return pagina.ok ? { ok: true as const, datos: { data: pagina.datos.data.entries, page: pagina.datos.page } } : pagina;
      },
      { limite: 50, maximoDePaginas: 10 },
    ),
  );
  if (l.sesionPerdida(r)) return { tipo: 'SESION' };
  if (!r.ok) return r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'SIN_ACCESO' } : { tipo: 'ERROR', motivo: motivoDeFalla(r) };
  return { tipo: 'LISTO', datos: new Set(r.datos.data.filter((e) => e.recordedLate).map((e) => e.occurredDate)) };
}

/** Las comidas de cada día (API-NUT-17), en tramos de 92 días que cubren el período. */
export async function leerComidasDeCadaDia(l: LecturaBase, periodo: PeriodoDelGrafico): Promise<Leido<{ readonly dias: ContrasteDescriptivo['days']; readonly enTramos: boolean }>> {
  const { partes, enTramos, falla } = await leerEnTramos(periodo, 92, (desde, hasta) => api.contextoDeRevision(l.token, l.asesoradoId, { periodStart: desde, periodEnd: hasta }));
  if (falla) return fallaDe(l, falla);
  return { tipo: 'LISTO', datos: { dias: partes.flatMap((p) => p.data.descriptiveContrast.days), enTramos } };
}

/** Los pesos medidos de las tomas propias, de `desde` a `hasta` (hasta 366 días). */
async function leerPesos(l: LecturaBase, desde: string, hasta: string): Promise<Leido<{ readonly pesos: readonly PesoDeLaToma[]; readonly parcial: boolean }>> {
  const r = await compartirLecturaEnCurso(`peso|${l.asesoradoId}|${desde}|${hasta}`, () =>
    limitarLectura(() => api.proyeccion(l.token, l.asesoradoId, 'ANTHROPOMETRY_LONGITUDINAL', { periodStart: desde, periodEnd: hasta, metric: 'peso' })),
  );
  if (!r.ok || l.sesionPerdida(r)) return fallaDe(l, r as Exclude<Respuesta, { ok: true }>);
  const d = r.datos.data;
  if (d.dataState === 'NOT_AVAILABLE_TO_VIEW') return { tipo: 'SIN_ACCESO' };
  const serie = d.result && d.result.kind === 'ANTHROPOMETRY_LONGITUDINAL' ? (d.result.series.find((s) => s.metricId === 'antropometria.peso') ?? null) : null;
  return { tipo: 'LISTO', datos: { pesos: pesosMedidos(serie), parcial: d.partialView } };
}

export interface PesosDelPeriodo {
  readonly pesos: readonly PesoDeLaToma[];
  /** Desde cuándo se buscó un peso anterior al período; `null` si alcanzó con los del período. */
  readonly buscadoDesde: string | null;
  readonly parcial: boolean;
}

/**
 * Los pesos para dividir los días del período: los del período y, si el primer día con registros no tiene una toma en
 * ese día o antes, los del año anterior (sin pasar del inicio del vínculo).
 */
export async function leerPesosParaLosDias(l: LecturaBase, periodo: PeriodoDelGrafico, primerDia: string | null): Promise<Leido<PesosDelPeriodo>> {
  const desde = inicioDelEje(periodo);
  const delPeriodo = await leerPesos(l, desde, periodo.hasta);
  if (delPeriodo.tipo !== 'LISTO') return delPeriodo;
  const alcanza = primerDia === null || delPeriodo.datos.pesos.some((p) => p.fecha <= primerDia);
  const antes = alcanza ? null : inicioDeLaBusquedaDelPeso(desde, periodo.desdeElVinculo);
  if (antes === null) return { tipo: 'LISTO', datos: { pesos: delPeriodo.datos.pesos, buscadoDesde: null, parcial: delPeriodo.datos.parcial } };
  const anteriores = await leerPesos(l, antes.desde, antes.hasta);
  if (anteriores.tipo !== 'LISTO') return anteriores;
  return { tipo: 'LISTO', datos: { pesos: [...anteriores.datos.pesos, ...delPeriodo.datos.pesos], buscadoDesde: antes.desde, parcial: delPeriodo.datos.parcial || anteriores.datos.parcial } };
}

/**
 * La serie derivada de los g/kg para «Analizar» y «Armá tu gráfico» (la despacha `leerSerieDelCatalogo`): los gramos del
 * día de su macronutriente divididos por el peso de la última toma propia en ese día o antes (GR-T13).
 */
export async function leerSeriePorKilo(p: ParametrosDeLectura, serie: SerieDisponible): Promise<EstadoDeSerie> {
  if (serie.fuente.tipo !== 'DERIVADA') return { tipo: 'sin-especificacion' };
  const deLosGramos = definicionDeMetrica(serie.fuente.de[0] ?? '');
  const metrica = deLosGramos?.parametro as MetricaNutricional | null | undefined;
  if (!deLosGramos || deLosGramos.area !== 'NUTRICION' || !metrica || metrica === 'RECORDS') return { tipo: 'sin-especificacion' };
  const desde = inicioDelEje(p.periodo);
  const gramos = await leerMetricaNutricional(p, metrica, desde, p.periodo.hasta);
  const comoEstado = (x: Exclude<Leido<never>, { tipo: 'LISTO' }>): EstadoDeSerie => (x.tipo === 'SESION' ? { tipo: 'cargando' } : x.tipo === 'SIN_ACCESO' ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: x.motivo });
  if (gramos.tipo !== 'LISTO') return comoEstado(gramos);
  const resultado = gramos.datos.resultado;
  if (!resultado || resultado.recorded.points.every((x) => x.value === null)) return { tipo: 'sin-datos' };
  const primerDia = resultado.recorded.points.find((x) => x.value !== null)?.date ?? null;
  const pesos = await leerPesosParaLosDias(p, p.periodo, primerDia);
  if (pesos.tipo !== 'LISTO') return comoEstado(pesos);
  const derivada = serieAnaliticaPorKilo(resultado.recorded, pesos.datos.pesos, serie.id, serie.definicion.nombre);
  return {
    tipo: 'lista',
    serie: derivada,
    observaciones: derivada,
    bandas: resultado.planVersions,
    objetivo: [],
    escalones: [],
    indicado: null,
    parcial: gramos.datos.parcial || pesos.datos.parcial,
    generada: gramos.datos.generada,
    zona: gramos.datos.zona,
  };
}
