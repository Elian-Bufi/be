import {
  coberturaNutricional,
  definicionAntropometrica,
  diasNutricionales,
  ejerciciosDelPeriodo,
  METRICAS_DEL_DICCIONARIO,
  nombreDeMetrica,
  NOTA_DE_LO_PREVISTO,
  objetivosDeLaVersionDelPlan,
  serieAntropometrica,
  serieDeEntrenamiento,
  serieNutricional,
  VERSION_DEL_DICCIONARIO,
  type DefinicionDeMetrica,
  type EjecucionDeEntrenamiento,
  type InstantaneaDeEntrenamiento,
  type ObjetivosDeLaVersion,
  type ProyeccionResponse,
  type RegistroDeComida,
  type ResultadoDeProyeccionAntropometrica,
  type ResultadoDeProyeccionDeEntrenamiento,
  type ResultadoDeProyeccionNutricional,
  type SerieApi,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { seriesDeEvolucion, type FilasDeEvolucion } from '../antropometria/evolucion.service';
import { fechaLocalEn } from '../nutricion/zona';
import { DIAS_MAXIMOS_DEL_ANALISIS, type ConsultaDeProyeccion } from './consultas';
import { ZONA, vigenciasEnElPeriodo, type VersionActivada, type VersionDeObjetivo } from './fuentes';

type Tx = Prisma.TransactionClient;

/**
 * Las tres proyecciones con derivación definida de API-PRJ-01 (DL-126). Cada una es una **vista** del cálculo canónico
 * que ya existe en el dominio (encargo §10 y §16): no hay fórmulas nuevas para obtener una curva.
 * - Nutrición: `calcularNutrientes` de cada registro efectivo (ya resuelto en `consumed`), sumado de forma exacta.
 * - Entrenamiento: la serie del mismo número entre sesiones (`evolucion`), con el objetivo histórico de cada serie.
 * - Antropometría: la serie de API-ANT-06 (`seriesDeEvolucion`), con sus grupos de comparabilidad.
 */

type Derivacion = NonNullable<ProyeccionResponse['data']['derivation']>;

export const DERIVACION: Readonly<Record<'NUTRITION_PRESCRIBED_VS_RECORDED' | 'TRAINING_PROGRESSION_BY_EXERCISE' | 'ANTHROPOMETRY_LONGITUDINAL', Derivacion>> = {
  NUTRITION_PRESCRIBED_VS_RECORDED: { specificationId: 'BE-PRJ-NUTRICION-REGISTRADA', version: VERSION_DEL_DICCIONARIO, method: 'SUM_SOURCE_PER_100G_V1' },
  TRAINING_PROGRESSION_BY_EXERCISE: { specificationId: 'BE-PRJ-PROGRESION-POR-SERIE', version: VERSION_DEL_DICCIONARIO, method: 'MISMA_SERIE_ENTRE_SESIONES' },
  ANTHROPOMETRY_LONGITUDINAL: { specificationId: 'API-ANT-06', version: VERSION_DEL_DICCIONARIO, method: 'GRUPOS_DE_COMPARABILIDAD' },
};

/** La definición del diccionario para un parámetro `metric` de nutrición o entrenamiento. */
function definicionPorParametro(area: DefinicionDeMetrica['area'], parametro: string): DefinicionDeMetrica {
  const d = METRICAS_DEL_DICCIONARIO.find((m) => m.area === area && m.implementada && m.parametro === parametro);
  if (!d) throw new Error(`métrica sin definición: ${area} ${parametro}`);
  return d;
}

// ─── NUTRITION_PRESCRIBED_VS_RECORDED ───────────────────────────────────────────────────────────

export function proyeccionNutricional(
  c: Extract<ConsultaDeProyeccion, { clave: 'NUTRITION_PRESCRIBED_VS_RECORDED' }>,
  datos: { readonly registros: readonly RegistroDeComida[]; readonly versiones: readonly VersionActivada[]; readonly objetivos: readonly VersionDeObjetivo[]; readonly hoy: string },
): ResultadoDeProyeccionNutricional {
  const { desde, hasta } = c.periodo;
  const dias = diasNutricionales(datos.registros, desde, hasta);
  const definicion = definicionPorParametro('NUTRICION', c.metrica);
  return {
    kind: 'NUTRITION_PRESCRIBED_VS_RECORDED',
    metric: c.metrica,
    recorded: serieNutricional(dias, definicion, c.metrica, c.grano, { desde, hasta, hoy: datos.hoy }),
    prescribed: {
      // El requerimiento energético del objetivo, como escalón por vigencia: solo para la energía.
      energyRequirement:
        c.metrica === 'ENERGY'
          ? datos.objetivos
              .filter((o) => o.requerimientoKcal !== null)
              .map((o) => ({ ...o, from: fechaLocalEn(o.vigenteDesde, ZONA), to: o.vigenteHasta ? fechaLocalEn(o.vigenteHasta, ZONA) : null }))
              .filter((o) => o.from <= hasta && (o.to === null || o.to >= desde))
              .map((o) => ({ objectiveVersionId: o.id, from: o.from, to: o.to, value: o.requerimientoKcal as number, unit: 'kcal/day' as const }))
          : [],
      note: NOTA_DE_LO_PREVISTO,
    },
    coverage: coberturaNutricional(dias, desde, hasta),
    planVersions: vigenciasEnElPeriodo(datos.versiones, 'NUTRITION', desde, hasta),
  };
}

// ─── TRAINING_PROGRESSION_BY_EXERCISE ───────────────────────────────────────────────────────────

/** DL-122: los objetivos por serie de cada versión que aparece en las sesiones, desde su instantánea. */
export async function objetivosDeLasVersiones(tx: Tx, ejecuciones: readonly EjecucionDeEntrenamiento[]): Promise<Map<string, ObjetivosDeLaVersion>> {
  const ids = [...new Set(ejecuciones.map((x) => x.planId))];
  if (ids.length === 0) return new Map();
  const versiones = await tx.versionDePlanDeEntrenamiento.findMany({ where: { id: { in: ids } }, select: { id: true, instantanea: { select: { contenido: true } } } });
  return new Map(
    versiones.flatMap((v) => {
      const instantanea = v.instantanea?.contenido as unknown as InstantaneaDeEntrenamiento | undefined;
      // Una versión sin instantánea legible queda sin objetivos por serie: se compara con la prescripción, como en el website.
      return instantanea?.contenido ? [[v.id, objetivosDeLaVersionDelPlan(instantanea.contenido)] as const] : [];
    }),
  );
}

export function proyeccionDeEntrenamiento(
  c: Extract<ConsultaDeProyeccion, { clave: 'TRAINING_PROGRESSION_BY_EXERCISE' }>,
  datos: { readonly ejecuciones: readonly EjecucionDeEntrenamiento[]; readonly versiones: readonly VersionActivada[]; readonly objetivosPorVersion: ReadonlyMap<string, ObjetivosDeLaVersion> },
): ResultadoDeProyeccionDeEntrenamiento {
  const { desde, hasta } = c.periodo;
  const ejercicios = ejerciciosDelPeriodo(datos.ejecuciones);
  let progression: ResultadoDeProyeccionDeEntrenamiento['progression'] = null;
  if (c.exerciseKey) {
    const ejercicio = ejercicios.find((e) => e.exerciseKey === c.exerciseKey);
    // Sin unidad pedida, la primera registrada del ejercicio; kg si no registró cargas. kg y lb nunca se mezclan.
    const unidad = c.unidad ?? ejercicio?.loadUnits[0] ?? 'kg';
    const definicion = definicionPorParametro('ENTRENAMIENTO', c.metrica);
    progression = {
      exerciseKey: c.exerciseKey,
      metric: c.metrica,
      setIndex: c.serie,
      unit: c.metrica === 'LOAD' ? unidad : null,
      series: serieDeEntrenamiento(datos.ejecuciones, definicion, {
        exerciseKey: c.exerciseKey,
        metrica: c.metrica,
        serie: c.serie,
        unidad,
        grano: c.grano,
        desde,
        hasta,
        objetivosPorVersion: datos.objetivosPorVersion,
      }),
    };
  }
  return { kind: 'TRAINING_PROGRESSION_BY_EXERCISE', exercises: ejercicios, progression, planVersions: vigenciasEnElPeriodo(datos.versiones, 'TRAINING', desde, hasta) };
}

// ─── ANTHROPOMETRY_LONGITUDINAL ─────────────────────────────────────────────────────────────────

const serieVacia = (metricCode: string, desde: string, hasta: string): SerieApi => ({
  metricCode,
  series: [],
  gaps: [{ from: desde, to: hasta, state: 'NO_DATA', days: Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000) + 1 }],
  comparability: { groups: [] },
});

export function proyeccionAntropometrica(
  c: Extract<ConsultaDeProyeccion, { clave: 'ANTHROPOMETRY_LONGITUDINAL' }>,
  leido: FilasDeEvolucion,
): { readonly resultado: ResultadoDeProyeccionAntropometrica; readonly otrasFuentes: boolean } {
  const { desde, hasta } = c.periodo;
  const { metrics, partialView } = seriesDeEvolucion(leido, desde, hasta, null, DIAS_MAXIMOS_DEL_ANALISIS);
  const porCodigo = new Map(metrics.map((m) => [m.metricCode, m]));
  const available = metrics
    .filter((m) => m.series.length > 0)
    .map((m) => ({ metricCode: m.metricCode, name: nombreDeMetrica(m.metricCode), observations: m.series.length, units: [...new Set(m.series.map((p) => p.unit))] }));
  const series = (c.metricas ?? []).map((codigo) => {
    const serie = porCodigo.get(codigo) ?? serieVacia(codigo, desde, hasta);
    return serieAntropometrica(serie, definicionAntropometrica(codigo, serie.series[0]?.unit ?? ''), ZONA);
  });
  return {
    resultado: { kind: 'ANTHROPOMETRY_LONGITUDINAL', available, series, honesty: { interpolated: false, imputed: false, carriedForward: false } },
    // Hay tomas de otro profesional en el período: existen y no se muestran (09v11:786-796).
    otrasFuentes: partialView,
  };
}
