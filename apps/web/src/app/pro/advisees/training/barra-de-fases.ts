/**
 * DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1, ET1-01) · lo que dibuja la barra horizontal de fases, sin React (para probarlo
 * con `node --test`): cada fase como una tarjeta con su número, su nombre, «Semanas 3–10», «8 sem.» y un ancho proporcional
 * a sus semanas; lo que pasa del fin del plan, rayado (ET1-D03).
 */
import { DIAS_DE_LA_SEMANA, nombreDeLaFase, semanasDeLaFase, type DiaDeLaSemana, type FaseEnElCalendario, type FaseParaPlanificar, type PlanificacionDelPlan } from '@be/domain';
import { colorDeLaFase } from './fases-del-plan';

/** Una tarjeta de la barra. */
export interface TarjetaDeFase {
  readonly posicion: number;
  readonly numero: number;
  readonly color: number;
  readonly nombre: string;
  /** La semana del plan en que empieza y en la que termina (1 la primera), o `null` sin semanas (o con una anterior sin). */
  readonly desde: number | null;
  readonly hasta: number | null;
  readonly semanas: number | null;
  /** Cuánto del ancho va rayado por pasar del fin del plan: de 0 a 1. */
  readonly fuera: number;
  /** El peso del ancho: sus semanas (una, si no tiene). */
  readonly peso: number;
}

export const COPY_BARRA_DE_FASES = {
  titulo: 'Fases del plan',
  semanas: (desde: number, hasta: number) => (desde === hasta ? `Semana ${desde}` : `Semanas ${desde}–${hasta}`),
  cuantas: (n: number) => `${n} sem.`,
  sinSemanas: 'Sin semanas',
  agregar: 'Agregar fase',
  configurar: 'Configurar plan',
  editar: 'Editar fase',
  dias: 'Días de la semana',
  deMas: (suman: number, plan: number) => `Las fases suman ${suman} semanas y el plan dura ${plan}: lo rayado queda fuera del plan. Así no se puede activar.`,
  resolver: 'Resolver en «Antes de activar»',
  barra: 'Las fases, en orden: elegí una para verla',
  fueraDelPlan: (n: number) => (n === 1 ? '1 semana fuera del plan' : `${n} semanas fuera del plan`),
} as const;

/** Las tarjetas, en el orden de las fases. Las semanas se cuentan desde el inicio; una fase sin semanas corta la cuenta. */
export function tarjetasDeLaBarra(plan: PlanificacionDelPlan | null, fases: readonly (FaseParaPlanificar & { readonly label: string })[]): TarjetaDeFase[] {
  let semana: number | null = 1;
  return fases.map((f, posicion) => {
    const semanas = semanasDeLaFase(plan, f.blockId);
    const desde = semana !== null && semanas !== null ? semana : null;
    const hasta = desde !== null && semanas !== null ? desde + semanas - 1 : null;
    semana = hasta !== null ? hasta + 1 : null;
    const fin = plan?.weeks ?? null;
    const fuera = fin !== null && desde !== null && hasta !== null && hasta > fin ? Math.min(1, (hasta - Math.max(fin, desde - 1)) / (semanas ?? 1)) : 0;
    return { posicion, numero: posicion + 1, color: colorDeLaFase(posicion), nombre: nombreDeLaFase(f.label, posicion), desde, hasta, semanas, fuera, peso: Math.max(1, semanas ?? 1) };
  });
}

/** La fase de la barra que toca con una tecla: ← y → (en ronda), Inicio y Fin; `null` si la tecla no es de la barra. */
export function faseConLaTecla(actual: number, cuantas: number, tecla: string): number | null {
  if (cuantas === 0) return null;
  if (tecla === 'ArrowRight') return (actual + 1) % cuantas;
  if (tecla === 'ArrowLeft') return (actual - 1 + cuantas) % cuantas;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return cuantas - 1;
  return null;
}

/** «Fases del plan · 30 nov – 21 feb»: el rango del plan, si tiene fechas. */
export function rangoDeLaBarra(fechas: readonly (FaseEnElCalendario | null)[], rango: (desde: string, hasta: string) => string, inicio: string | null, fin: string | null): string | null {
  if (inicio && fin) return rango(inicio, fin);
  const conFechas = fechas.filter((x): x is FaseEnElCalendario => x !== null);
  return conFechas.length > 0 ? rango(conFechas[0]!.desde, conFechas[conFechas.length - 1]!.hasta) : null;
}

/** Los días de una sesión, cortos y en orden: «Lun · Jue». */
export const DIA_DE_TRES: Readonly<Record<DiaDeLaSemana, string>> = { MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié', THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom' };
export const diasEnCorto = (dias: readonly DiaDeLaSemana[]): string => DIAS_DE_LA_SEMANA.filter((d) => dias.includes(d)).map((d) => DIA_DE_TRES[d]).join(' · ');
