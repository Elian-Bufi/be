/**
 * PF-03, incremento 1 (DL-105) · cómo se lee una prescripción, igual en el website y en la APK.
 *
 * Antes, cada superficie tenía su resumen: la APK usaba las repeticiones de la primera serie, así que una pirámide
 * 10/8/6 aparecía como «3 × 10», y no mostraba parámetros ni notas. Esta presentación es **fiel**:
 * - series iguales y sin notas: «3 × 10»; si difieren o alguna tiene nota, una línea por serie:
 *   «Serie 2: 8 · pausa de 2 s abajo»; un rango, «8-12»; sin fijar, «sin repeticiones fijadas»;
 * - intensidad con su criterio y la referencia del profesional: «75 % RM (1RM estimado…)» o «RIR 2»;
 * - carga sugerida aparte del criterio (09v10:391), parámetros con su unidad tal como se escribieron, y la nota.
 * No calcula nada ni interpreta lo que escribió el profesional: lo muestra. Todo número pasa por `numero` o `cantidad`
 * (coma decimal, DL-091 punto 4). El contrato no cambia: es la misma `Prescripcion` que ya viaja.
 */
import type { Prescripcion } from './contratos-entrenamiento';
import { COPY_ENTRENAMIENTO, ETIQUETA_DE_CRITERIO } from './copy-entrenamiento';
import { cantidad, numero } from './formato-numeros';

type Serie = Prescripcion['sets'][number];

/** Las repeticiones planificadas de una serie: «10» o «8-12»; `null` si la serie no las fija. */
export function repeticionesPlanificadas(s: Pick<Serie, 'repetitions'>): string | null {
  if (!s.repetitions) return null;
  return 'value' in s.repetitions ? numero(s.repetitions.value) : `${numero(s.repetitions.min)}-${numero(s.repetitions.max)}`;
}

/**
 * Las series: «3 × 10» si todas planifican lo mismo y ninguna tiene nota; si no, una línea por serie, con su nota.
 * Series iguales sin repeticiones fijadas: «3 series sin repeticiones fijadas».
 */
export function seriesPlanificadas(p: Pick<Prescripcion, 'sets'>): string[] {
  if (p.sets.length === 0) return [];
  const primera = repeticionesPlanificadas(p.sets[0]!);
  const iguales = p.sets.every((s) => repeticionesPlanificadas(s) === primera && !s.note);
  if (iguales) {
    return [primera === null ? `${numero(p.sets.length)} ${p.sets.length === 1 ? 'serie' : 'series'} ${COPY_ENTRENAMIENTO.sinRepeticionesFijadas}` : `${numero(p.sets.length)} × ${primera}`];
  }
  return p.sets.map((s) => `${COPY_ENTRENAMIENTO.serie} ${numero(s.setIndex)}: ${repeticionesPlanificadas(s) ?? COPY_ENTRENAMIENTO.sinRepeticionesFijadas}${s.note ? ` · ${s.note}` : ''}`);
}

/** «75 % RM (1RM estimado por el método que usaste)» o «RIR 2»; `null` si la prescripción no declara criterio. */
export function intensidadPlanificada(p: Pick<Prescripcion, 'intensity'>): string | null {
  if (!p.intensity) return null;
  const { criterion, target } = p.intensity;
  const valor = criterion === 'PERCENT_RM' ? `${numero(target.value)} ${ETIQUETA_DE_CRITERIO.PERCENT_RM}` : `${ETIQUETA_DE_CRITERIO.RIR} ${numero(target.value)}`;
  return target.reference ? `${valor} (${target.reference.description})` : valor;
}

/** Las líneas de lo planificado, en orden: series, intensidad, carga sugerida, parámetros y nota. */
export function lineasDePrescripcion(p: Prescripcion, opciones: { readonly sinCriterioExplicito?: boolean } = {}): string[] {
  const lineas = [...seriesPlanificadas(p)];
  const intensidad = intensidadPlanificada(p);
  if (intensidad) lineas.push(intensidad);
  // En el website, la ausencia de criterio se dice: es legítima (DL-088 punto 8), pero el profesional tiene que verla.
  else if (opciones.sinCriterioExplicito) lineas.push(COPY_ENTRENAMIENTO.sinCriterio);
  if (p.suggestedLoad) lineas.push(`${COPY_ENTRENAMIENTO.cargaSugerida}: ${cantidad(p.suggestedLoad.value, p.suggestedLoad.unit)}`);
  // Un parámetro puede ser texto o número: solo se formatea cuando es número. La unidad va tal como la escribió.
  for (const q of p.professionalParameters) lineas.push(`${q.label}: ${typeof q.value === 'number' ? numero(q.value) : q.value}${q.unit ? ` ${q.unit}` : ''}`);
  if (p.note) lineas.push(`${COPY_ENTRENAMIENTO.notas}: ${p.note}`);
  return lineas;
}

/**
 * La referencia de lo planificado para una serie mientras se registra: «planificadas 8 repeticiones». Se muestra al
 * lado de la serie; **nunca se carga como realizado** (B10-06:1242-1255). `null` si la serie no fija repeticiones.
 */
export function referenciaDeSerie(s: Pick<Serie, 'repetitions'>): string | null {
  const r = repeticionesPlanificadas(s);
  return r === null ? null : `${COPY_ENTRENAMIENTO.planificadas} ${r} ${COPY_ENTRENAMIENTO.repeticiones.toLowerCase()}`;
}
