/**
 * Entrenamiento en «Analizar» (WP-DASHBOARD-PROFESIONAL §6; encargo §12): la progresión de un ejercicio, por identidad
 * del catálogo y **por número de serie**, con el mismo cálculo que «Evolución de un ejercicio» del website.
 *
 * - **Reutiliza** `observacionesDelEjercicio` y `evolucion` (`comparacion-de-entrenamiento.ts`): la identidad del
 *   ejercicio sale de todas las ejecuciones del período; cada punto es la serie del número elegido en una sesión
 *   registrada; las líneas se cortan donde no hay dato; lo planificado es el de la versión que rigió ese día.
 * - **No agrega entre series** (09v10:1285-1295): ni promedios, ni sumas, ni máximos. El único conteo es el de series
 *   registradas, que es cobertura y no rendimiento.
 * - **kg y lb nunca se mezclan;** ejercicios distintos tampoco. Un registro resumido no tiene series y no se sintetizan.
 * - **RIR nulo es «sin informar»; RIR 0 es una respuesta.** Una sesión registrada como «no realizada» es la única
 *   omisión declarada: aporta 0 series registradas y lo dice.
 * - Los borradores no llegan: el profesional ve lo registrado (09v10:980).
 */
import type { EjercicioDelPeriodo, MetricaDeEntrenamiento, PuntoAnalitico, SerieAnalitica } from './contratos-analisis';
import type { EjecucionDeEntrenamiento } from './contratos-entrenamiento';
import { objetivosEfectivos } from './objetivos-por-serie';
import { sesionesDelPlan, type ContenidoDePlanDeEntrenamiento } from './plan-de-entrenamiento';
import {
  ejerciciosComparables,
  evolucion,
  medidasDeLaEvolucion,
  numerosDeSerie,
  observacionesDelEjercicio,
  type Medida,
  type ObjetivosDeLaVersion,
  type ObservacionDeEvolucion,
  type ValorPlanificado,
} from './comparacion-de-entrenamiento';
import type { DefinicionDeMetrica } from './metricas-del-analisis';
import { lunesDe, semanasDelPeriodo } from './series-del-analisis';
import { numero } from './formato-numeros';

/**
 * DL-122: los objetivos efectivos por serie de una versión de plan (su instantánea), por prescripción. Es lo que el
 * website arma desde API-SER-01 para «Evolución de un ejercicio», resuelto con la misma `objetivosEfectivos`: así cada
 * punto se compara con el objetivo de **esa** serie en la versión que rigió ese día.
 */
export function objetivosDeLaVersionDelPlan(contenido: ContenidoDePlanDeEntrenamiento): ObjetivosDeLaVersion {
  return new Map(
    sesionesDelPlan(contenido).flatMap(({ sesion }) =>
      sesion.prescriptions.map(
        (p) =>
          [
            p.prescriptionId,
            objetivosEfectivos(p).map((o) => ({
              setIndex: o.setIndex,
              target: { rir: o.rir, suggestedLoad: o.suggestedLoad },
              targetOrigin: { rir: o.origin.rir, suggestedLoad: o.origin.suggestedLoad },
            })),
          ] as const,
      ),
    ),
  );
}

/** Los ejercicios del período, por identidad, con lo necesario para elegir uno y una serie. */
export function ejerciciosDelPeriodo(ejecuciones: readonly EjecucionDeEntrenamiento[]): EjercicioDelPeriodo[] {
  return ejerciciosComparables(ejecuciones).map((e) => {
    const observaciones = observacionesDelEjercicio(ejecuciones, e.clave);
    const unidades = medidasDeLaEvolucion(observaciones).flatMap((m) => (m.variable === 'carga' ? [m.unidad] : []));
    const fechas = observaciones.map((o) => o.comparacion.fecha).sort();
    return {
      exerciseKey: e.clave,
      name: e.nombre,
      otherNames: [...e.otrosNombres],
      homonym: e.homonimo,
      sessions: new Set(observaciones.map((o) => o.comparacion.executionId)).size,
      setNumbers: numerosDeSerie(observaciones),
      loadUnits: unidades,
      lastDate: fechas[fechas.length - 1] ?? null,
    };
  });
}

const MEDIDA: Readonly<Record<Exclude<MetricaDeEntrenamiento, 'SETS_RECORDED'>, (unidad: 'kg' | 'lb') => Medida>> = {
  LOAD: (unidad) => ({ variable: 'carga', unidad }),
  REPETITIONS: () => ({ variable: 'repeticiones' }),
  RIR: () => ({ variable: 'rir' }),
};

/** Lo planificado de la serie en palabras («8 a 10», «sugerida: 40 kg»), sin convertirlo en un número que no es. */
function planificadoEnPalabras(p: ValorPlanificado, unidad: string): string | null {
  switch (p.tipo) {
    case 'valor':
      return `${numero(p.valor)} ${unidad}${p.sugerida ? ' (sugerida)' : ''}`;
    case 'rango':
      return `${numero(p.min)} a ${numero(p.max)} ${unidad}`;
    case 'porcentaje-rm':
      return `${numero(p.valor)} % RM (no se convierte a kg)`;
    case 'otra-unidad':
      return `${numero(p.carga.value)} ${p.carga.unit}`;
    case 'sin-fijar':
      return 'sin fijar';
    default:
      return null;
  }
}

export interface OpcionesDeSerieDeEntrenamiento {
  readonly exerciseKey: string;
  readonly metrica: MetricaDeEntrenamiento;
  /** El número de serie; se exige salvo para el conteo de series registradas. */
  readonly serie: number | null;
  readonly unidad: 'kg' | 'lb';
  readonly grano: 'ORIGINAL' | 'WEEK';
  readonly desde: string;
  readonly hasta: string;
  /** DL-122: los objetivos por serie de cada versión del período, por `planId`, para el objetivo histórico. */
  readonly objetivosPorVersion?: ReadonlyMap<string, ObjetivosDeLaVersion>;
}

const UNIDAD_DE_LA_METRICA: Readonly<Record<Exclude<MetricaDeEntrenamiento, 'LOAD'>, string>> = { REPETITIONS: 'rep', RIR: 'RIR', SETS_RECORDED: 'series' };

const fuenteDe = (o: ObservacionDeEvolucion) => [{ type: 'TRAINING_EXECUTION' as const, id: o.comparacion.executionId }];

/** La serie analítica de un ejercicio para una métrica. */
export function serieDeEntrenamiento(ejecuciones: readonly EjecucionDeEntrenamiento[], definicion: DefinicionDeMetrica, o: OpcionesDeSerieDeEntrenamiento): SerieAnalitica {
  const observaciones = observacionesDelEjercicio(ejecuciones, o.exerciseKey, ejecuciones, o.objetivosPorVersion).filter(
    (x) => x.comparacion.fecha >= o.desde && x.comparacion.fecha <= o.hasta,
  );
  const unidad = o.metrica === 'LOAD' ? o.unidad : UNIDAD_DE_LA_METRICA[o.metrica];
  const notas: string[] = [...definicion.limites];
  let puntos: PuntoAnalitico[] = [];

  if (o.metrica === 'SETS_RECORDED') {
    for (const x of observaciones) {
      // Lo registrado tiene que ser de este ejercicio: una sustitución por otro no le suma series.
      if (x.rol === 'sustituido' || x.rol === 'registrado-sin-identidad') continue;
      const c = x.comparacion;
      if (c.condicion === null) continue;
      const noRealizada = c.condicion === 'NOT_COMPLETED';
      const resumida = !noRealizada && c.realizado !== null && c.resumen !== null && c.filas.every((f) => f.registrada.tipo !== 'registrada');
      if (resumida || (!noRealizada && c.realizado === null)) continue;
      const registradas = c.filas.filter((f) => f.registrada.tipo === 'registrada').length;
      puntos.push({
        pointId: `x:${c.executionId}:${c.prescriptionId}`,
        date: c.fecha,
        dateEnd: null,
        at: c.ocurrio,
        value: registradas,
        quality: 'COMPLETE',
        n: 1,
        segment: 'sesiones',
        corrected: c.fuente.tipo === 'correccion',
        partialBucket: false,
        dataClass: null,
        coverage: null,
        missing: [],
        detail: [
          { label: 'Sesión', value: c.sesion },
          ...(noRealizada ? [{ label: 'Condición', value: 'Registrada como no realizada' }] : []),
          { label: 'Series planificadas', value: String(c.filas.filter((f) => f.planificada.tipo === 'planificada').length) },
          ...(x.delDia.total > 1 ? [{ label: 'Sesión del día', value: `${x.delDia.orden} de ${x.delDia.total}` }] : []),
        ],
        sources: fuenteDe(x),
        sourcesTruncated: false,
      });
    }
    if (o.grano === 'WEEK') {
      puntos = semanasDelPeriodo(o.desde, o.hasta).flatMap((s) => {
        const deLaSemana = puntos.filter((p) => lunesDe(p.date) === s.lunes);
        if (deLaSemana.length === 0) return [];
        return [
          {
            pointId: `w:${s.lunes}`,
            date: s.lunes,
            dateEnd: s.domingo,
            at: null,
            value: deLaSemana.reduce((t, p) => t + (p.value as number), 0),
            quality: 'COMPLETE' as const,
            n: deLaSemana.length,
            segment: 'semanas',
            corrected: deLaSemana.some((p) => p.corrected),
            partialBucket: s.parcial,
            dataClass: null,
            coverage: null,
            missing: [],
            detail: [{ label: 'Sesiones registradas', value: String(deLaSemana.length) }],
            sources: deLaSemana.flatMap((p) => p.sources).slice(0, 60),
            sourcesTruncated: deLaSemana.length > 60,
          },
        ];
      });
    }
  } else {
    if (o.serie === null) throw new Error('la métrica exige un número de serie');
    const medida = MEDIDA[o.metrica](o.unidad);
    let otraUnidad = 0;
    let sinDato = 0;
    for (const p of evolucion(observaciones, medida, o.serie)) {
      const c = p.observacion.comparacion;
      if (p.registrado.tipo === 'otra-unidad') {
        otraUnidad++;
        continue;
      }
      if (p.registrado.tipo !== 'valor') {
        sinDato++;
        continue;
      }
      const serie = p.fila?.registrada.tipo === 'registrada' ? p.fila.registrada.serie : null;
      const planificado = planificadoEnPalabras(p.planificado, unidad);
      puntos.push({
        pointId: `x:${c.executionId}:${c.prescriptionId}:${o.serie}`,
        date: c.fecha,
        dateEnd: null,
        at: c.ocurrio,
        value: p.registrado.valor,
        quality: 'COMPLETE',
        n: 1,
        segment: `t${p.tramoRegistrado ?? 0}`,
        corrected: p.fila?.corregida ?? false,
        partialBucket: false,
        dataClass: null,
        coverage: null,
        missing: [],
        detail: [
          { label: 'Sesión', value: c.sesion },
          ...(planificado ? [{ label: 'Objetivo de esta serie', value: planificado }] : []),
          ...(o.metrica !== 'LOAD' && serie?.load ? [{ label: 'Carga de la serie', value: `${numero(serie.load.value)} ${serie.load.unit}` }] : []),
          ...(o.metrica !== 'REPETITIONS' && serie?.completedRepetitions != null ? [{ label: 'Repeticiones de la serie', value: numero(serie.completedRepetitions) }] : []),
          ...(o.metrica !== 'RIR' ? [{ label: 'RIR', value: serie?.rir == null ? 'sin informar' : numero(serie.rir) }] : []),
          ...(p.observacion.delDia.total > 1 ? [{ label: 'Sesión del día', value: `${p.observacion.delDia.orden} de ${p.observacion.delDia.total}` }] : []),
        ],
        sources: fuenteDe(p.observacion),
        sourcesTruncated: false,
      });
    }
    if (otraUnidad > 0) notas.push(`${numero(otraUnidad)} ${otraUnidad === 1 ? 'sesión registró' : 'sesiones registraron'} la carga en ${o.unidad === 'kg' ? 'lb' : 'kg'}: están en su propia escala, no en esta.`);
    if (sinDato > 0) notas.push(`${numero(sinDato)} ${sinDato === 1 ? 'sesión no tiene' : 'sesiones no tienen'} dato de esta serie: no son cero.`);
  }

  const tramos = [...new Set(puntos.map((p) => p.segment))];
  return {
    metricId: definicion.id,
    label: definicion.nombre,
    unit: unidad,
    scale: definicion.escala,
    grain: o.grano,
    aggregation: o.grano === 'WEEK' ? 'SUM' : o.metrica === 'SETS_RECORDED' ? 'COUNT' : 'NONE',
    points: puntos,
    // Las sesiones son hechos puntuales: no tener sesión un día no es un dato faltante.
    gaps: [],
    segments: tramos.map((segment, i) => ({ segment, label: o.metrica === 'SETS_RECORDED' ? 'Sesiones registradas' : `Serie ${o.serie}`, breakReason: i === 0 ? null : 'Una sesión sin dato de esta serie corta la línea.' })),
    notes: notas,
  };
}
