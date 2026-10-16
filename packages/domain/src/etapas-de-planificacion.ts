/**
 * Etapas de planificación (encargo del 2026-10-09, eje 4): comparar por las etapas reales del plan, no por fechas
 * elegidas a ojo.
 *
 * - **Una etapa es la vigencia de una versión ACTIVADA** del plan de un área: desde su activación hasta la activación de
 *   la sucesora o el cierre del seguimiento, lo primero (`VigenciaDePlan`, la misma de las bandas). Un borrador no
 *   inicia una etapa: nunca llega como vigencia.
 * - **El día del corte es de la etapa siguiente** (la convención de las bandas): no se cuenta dos veces. Dos activaciones
 *   el mismo día se separan por sus instantes; la primera no tiene un día entero y lo dice.
 * - **Una etapa abierta termina hoy**, que todavía está en curso.
 * - **Cada registro conserva su referencia histórica:** una sesión del plan anterior registrada después no se reatribuye.
 *   Entrenamiento se resume por la versión que ejecutó cada sesión; nutrición y antropometría, por las fechas de la etapa
 *   («registrado durante este período»), porque la toma no ejecuta un plan y la API de comidas asocia el registro a la
 *   versión vigente cuando se carga. Lo que no coincide se cuenta y se dice; no se inventan pausas.
 * - **El resumen y la diferencia son los de «Comparar dos períodos»** (`resumirPeriodo` y `compararResumenes`) sobre las
 *   observaciones originales: no es un segundo motor.
 */
import type { DominioDeAnalisis, SerieAnalitica, VigenciaDePlan } from './contratos-analisis';
import { diasEntreFechas } from './fechas-civiles';
import type { AreaDeMetrica, DefinicionDeMetrica } from './metricas-del-analisis';
import { compararResumenes, resumirPeriodo, type MotivoSinDiferencia, type ResumenDeUnPeriodo } from './series-del-analisis';

export type DominioConEtapas = Extract<DominioDeAnalisis, 'NUTRITION' | 'TRAINING'>;

export interface EtapaDePlanificacion {
  readonly planVersionId: string;
  readonly dominio: DominioConEtapas;
  /** «v3», el orden de activación de las versiones del plan. */
  readonly etiqueta: string;
  readonly activadaEl: string;
  /** El instante del corte (activación de la sucesora o cierre del seguimiento); `null` si sigue vigente. */
  readonly finalizadaEl: string | null;
  readonly motivoDeFin: VigenciaDePlan['endReason'];
  /** El día de la activación, en la zona del asesorado. */
  readonly desde: string;
  /** El día del corte, que ya es de la etapa siguiente; `null` si sigue vigente. */
  readonly corte: string | null;
  /**
   * El último día civil entero de la etapa: el anterior al corte, u hoy si sigue vigente. `null` si no tiene ninguno
   * (activada y reemplazada el mismo día).
   */
  readonly ultimoDia: string | null;
  readonly abierta: boolean;
  /** Días civiles enteros, con hoy si sigue vigente. */
  readonly dias: number;
  /** Lo que duró entre instantes (hasta ahora, si sigue): separa dos activaciones del mismo día. */
  readonly duracionMs: number;
}

const dominioDeLaVigencia = (v: VigenciaDePlan): DominioConEtapas | null => (v.domain === 'NUTRITION' || v.domain === 'TRAINING' ? v.domain : null);
const diaAnterior = (fecha: string): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * Las etapas de un área, de la más antigua a la más reciente, desde las vigencias de una proyección. `hoy` es la fecha
 * civil de hoy en la zona del asesorado y `ahora`, el instante de la lectura (para la duración de la etapa abierta).
 */
export function etapasDelArea(vigencias: readonly VigenciaDePlan[], dominio: DominioConEtapas, hoy: string, ahora: string): EtapaDePlanificacion[] {
  const vistas = new Set<string>();
  return vigencias
    .filter((v) => dominioDeLaVigencia(v) === dominio)
    .filter((v) => (vistas.has(v.planVersionId) ? false : (vistas.add(v.planVersionId), true)))
    .sort((a, b) => a.activatedAt.localeCompare(b.activatedAt) || a.planVersionId.localeCompare(b.planVersionId))
    .map((v) => {
      const abierta = v.to === null;
      const ultimo = abierta ? hoy : diaAnterior(v.to as string);
      const ultimoDia = ultimo >= v.from ? ultimo : null;
      const fin = v.endedAt ?? ahora;
      return {
        planVersionId: v.planVersionId,
        dominio,
        etiqueta: v.label,
        activadaEl: v.activatedAt,
        finalizadaEl: v.endedAt,
        motivoDeFin: v.endReason,
        desde: v.from,
        corte: v.to,
        ultimoDia,
        abierta,
        dias: ultimoDia === null ? 0 : diasEntreFechas(v.from, ultimoDia) + 1,
        duracionMs: Math.max(0, Date.parse(fin) - Date.parse(v.activatedAt)),
      };
    });
}

/** La etapa anterior a una, en el mismo área; `null` si es la primera. */
export function etapaAnterior(etapas: readonly EtapaDePlanificacion[], planVersionId: string): EtapaDePlanificacion | null {
  const i = etapas.findIndex((e) => e.planVersionId === planVersionId);
  return i > 0 ? (etapas[i - 1] ?? null) : null;
}

/** La etapa que contiene una fecha civil (la de su banda); `null` si ninguna (antes del primer plan o tras un cierre). */
export function etapaDeLaFecha(etapas: readonly EtapaDePlanificacion[], fecha: string): EtapaDePlanificacion | null {
  return etapas.find((e) => e.ultimoDia !== null && e.desde <= fecha && fecha <= e.ultimoDia) ?? null;
}

/**
 * Lo que hay entre dos etapas seguidas que no se tocan: un seguimiento cerrado antes de activar otro plan. Sale de los
 * datos (el cierre), nunca de una suposición: entre una versión y su sucesora no hay pausa.
 */
export function sinPlanEntre(a: EtapaDePlanificacion, b: EtapaDePlanificacion): { readonly desde: string; readonly hasta: string } | null {
  if (a.motivoDeFin !== 'FOLLOW_UP_CLOSED' || a.corte === null || b.desde <= a.corte) return null;
  return { desde: a.corte, hasta: diaAnterior(b.desde) };
}

// ─── Resumen de una métrica en una etapa ────────────────────────────────────────────────────────

/**
 * Cómo se asigna una observación a una etapa:
 * - `VERSION_EJECUTADA`: por la versión que guardó su registro (entrenamiento: cada sesión ejecuta una versión).
 * - `FECHAS_DE_LA_ETAPA`: por la fecha del hecho (nutrición y antropometría: «registrado durante este período»).
 */
export type LenteDeEtapa = 'VERSION_EJECUTADA' | 'FECHAS_DE_LA_ETAPA';

export const LENTE_DEL_AREA: Readonly<Record<AreaDeMetrica, LenteDeEtapa>> = {
  NUTRICION: 'FECHAS_DE_LA_ETAPA',
  ENTRENAMIENTO: 'VERSION_EJECUTADA',
  ANTROPOMETRIA: 'FECHAS_DE_LA_ETAPA',
};

export type MotivoSinResumenDeEtapa = 'SIN_DIA_ENTERO' | 'FUERA_DE_LO_LEIDO';

export interface ResumenDeEtapa {
  readonly etapa: EtapaDePlanificacion;
  readonly lente: LenteDeEtapa;
  /** El rango de fechas usado, recortado a lo leído; `null` si no hay ninguno. */
  readonly rango: { readonly desde: string; readonly hasta: string } | null;
  /** La lectura no llega al principio o al final de la etapa (el máximo de un año): se dice. */
  readonly recortada: boolean;
  readonly resumen: ResumenDeUnPeriodo | null;
  readonly motivoSinResumen: MotivoSinResumenDeEtapa | null;
  /** Por fechas: observaciones del rango cuyos registros guardaron otra versión (cargados después de la activación siguiente). */
  readonly deOtraVersion: number;
  /** Por versión: sesiones de esta versión fuera de las fechas de la etapa (por ejemplo, el día del corte). */
  readonly fueraDeLasFechas: number;
}

export interface PeriodoLeido {
  readonly desde: string;
  readonly hasta: string;
}

/** El resumen de una métrica en una etapa, con la lente de su área y la misma regla de «Comparar dos períodos». */
export function resumirEtapa(serie: SerieAnalitica, definicion: DefinicionDeMetrica, etapa: EtapaDePlanificacion, leido: PeriodoLeido): ResumenDeEtapa {
  const lente = LENTE_DEL_AREA[definicion.area];
  const base = { etapa, lente, deOtraVersion: 0, fueraDeLasFechas: 0 };
  if (lente === 'VERSION_EJECUTADA') {
    const propios = serie.points.filter((p) => p.planVersionIds.includes(etapa.planVersionId) && p.date >= leido.desde && p.date <= leido.hasta);
    const desdeEtapa = etapa.desde;
    const hastaEtapa = etapa.ultimoDia ?? etapa.desde;
    const fechas = propios.map((p) => p.date).sort();
    const desde = [desdeEtapa, fechas[0] ?? desdeEtapa].sort()[0] as string;
    const hasta = [hastaEtapa, fechas[fechas.length - 1] ?? hastaEtapa].sort().reverse()[0] as string;
    const rango = { desde: desde < leido.desde ? leido.desde : desde, hasta: hasta > leido.hasta ? leido.hasta : hasta };
    if (rango.desde > rango.hasta) return { ...base, rango: null, recortada: true, resumen: null, motivoSinResumen: 'FUERA_DE_LO_LEIDO' };
    const filtrada: SerieAnalitica = { ...serie, points: propios };
    return {
      ...base,
      rango,
      recortada: desdeEtapa < leido.desde || hastaEtapa > leido.hasta,
      resumen: resumirPeriodo(filtrada, definicion, rango.desde, rango.hasta),
      motivoSinResumen: null,
      fueraDeLasFechas: propios.filter((p) => p.date < desdeEtapa || p.date > hastaEtapa).length,
    };
  }
  if (etapa.ultimoDia === null) return { ...base, rango: null, recortada: false, resumen: null, motivoSinResumen: 'SIN_DIA_ENTERO' };
  const rango = { desde: etapa.desde < leido.desde ? leido.desde : etapa.desde, hasta: etapa.ultimoDia > leido.hasta ? leido.hasta : etapa.ultimoDia };
  if (rango.desde > rango.hasta) return { ...base, rango: null, recortada: true, resumen: null, motivoSinResumen: 'FUERA_DE_LO_LEIDO' };
  const delRango = serie.points.filter((p) => p.date >= rango.desde && p.date <= rango.hasta);
  return {
    ...base,
    rango,
    recortada: rango.desde !== etapa.desde || rango.hasta !== etapa.ultimoDia,
    // Una etapa abierta termina hoy, que sigue en curso: no es un día sin registros aunque todavía no tenga ninguno.
    resumen: resumirPeriodo(serie, definicion, rango.desde, rango.hasta, etapa.abierta ? etapa.ultimoDia ?? undefined : undefined),
    motivoSinResumen: null,
    // Solo nutrición guarda versión en el punto; la antropometría no ejecuta un plan (lista vacía).
    deOtraVersion: delRango.filter((p) => p.planVersionIds.some((v) => v !== etapa.planVersionId)).length,
  };
}

export type MotivoSinDiferenciaDeEtapas = MotivoSinDiferencia | MotivoSinResumenDeEtapa;

export interface ComparacionDeEtapas {
  readonly a: ResumenDeEtapa;
  readonly b: ResumenDeEtapa;
  /** B − A en la unidad de la métrica, descriptiva; `null` con su motivo cuando no corresponde. */
  readonly diferencia: number | null;
  readonly motivoSinDiferencia: MotivoSinDiferenciaDeEtapas | null;
}

/** Dos etapas con el mismo criterio de resumen, sobre las observaciones originales. No produce conclusiones causales. */
export function compararEtapas(serie: SerieAnalitica, definicion: DefinicionDeMetrica, a: EtapaDePlanificacion, b: EtapaDePlanificacion, leido: PeriodoLeido): ComparacionDeEtapas {
  const ra = resumirEtapa(serie, definicion, a, leido);
  const rb = resumirEtapa(serie, definicion, b, leido);
  if (ra.resumen === null || rb.resumen === null) return { a: ra, b: rb, diferencia: null, motivoSinDiferencia: ra.motivoSinResumen ?? rb.motivoSinResumen };
  const c = compararResumenes(ra.resumen, rb.resumen, definicion);
  return { a: ra, b: rb, diferencia: c.diferencia, motivoSinDiferencia: c.motivoSinDiferencia };
}

/** Por qué no hay diferencia entre dos etapas, en palabras. Ninguna frase califica a la persona. */
export const TEXTO_SIN_DIFERENCIA_DE_ETAPAS: Readonly<Record<MotivoSinDiferenciaDeEtapas, string>> = {
  SIN_VALOR_EN_ALGUNO: 'Una de las dos etapas no tiene observaciones con valor de esta métrica.',
  DURACIONES_DISTINTAS: 'Es un total y las etapas duran distinto: dos totales de duraciones distintas no se restan.',
  PERIODO_INCOMPLETO: 'Es un total y una etapa incluye el día en curso: todavía no es el total de su duración.',
  TRAMOS_NO_COMPARABLES: 'Entre las dos etapas cambió el protocolo, el método o la unidad: los valores no se restan.',
  SIN_DIA_ENTERO: 'Una etapa duró menos de un día (se activó otra versión el mismo día): no tiene días enteros para resumir.',
  FUERA_DE_LO_LEIDO: 'Una etapa queda fuera del período que se puede leer (hasta un año).',
};

/** La duración de una etapa en palabras: días enteros, o horas si no llegó a un día. */
export function duracionDeLaEtapa(e: EtapaDePlanificacion): string {
  if (e.ultimoDia === null) {
    const horas = Math.max(1, Math.round(e.duracionMs / 3_600_000));
    return `${horas} ${horas === 1 ? 'hora' : 'horas'} (menos de un día)`;
  }
  return `${e.dias} ${e.dias === 1 ? 'día' : 'días'}${e.abierta ? ', con hoy en curso' : ''}`;
}

/** El período que cubre dos etapas, para leerlas juntas: del primer día de la primera al último de la segunda. */
export function periodoDeLasEtapas(a: EtapaDePlanificacion, b: EtapaDePlanificacion, hoy: string, maximoDeDias: number): PeriodoLeido & { readonly recortado: boolean } {
  const desde = [a.desde, b.desde].sort()[0] as string;
  const fin = [a.ultimoDia ?? a.desde, b.ultimoDia ?? b.desde].sort().reverse()[0] as string;
  const hasta = fin > hoy ? hoy : fin;
  const minimo = new Date(Date.parse(`${hasta}T12:00:00Z`) - (maximoDeDias - 1) * 86_400_000).toISOString().slice(0, 10);
  return desde < minimo ? { desde: minimo, hasta, recortado: true } : { desde, hasta, recortado: false };
}

