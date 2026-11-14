/**
 * GR-11 · Las temporadas del objetivo y del plan (WP-GRAFICOS fase 2, rama C; DL-174): la capa de todo gráfico de
 * Nutrición. Es lo que permite decir «subió los carbohidratos durante una temporada».
 * - Las versiones del plan van de fondo, con su rótulo («Plan v3 · desde el 2/9»); las del objetivo, con una línea fina
 *   donde empiezan. Ninguna lleva un color de «bueno» o «malo».
 * - El objetivo de calorías y de macronutrientes en gramos por día va en escalón: cada día se lee contra la versión que
 *   regía ese día (REG-06-105; `escalonesDelRango`, la misma regla que la tira del objetivo).
 * - **Un objetivo guardado como proporción de las calorías se escribe como proporción y no se dibuja ni se convierte a
 *   gramos:** convertirlo pediría factores de energía por macronutriente que BE no tiene como método aprobado.
 * - Detrás de los gráficos de otra área van solo a pedido («Mostrar las temporadas de Nutrición») y en el caso 1: lo
 *   deciden las ramas que dibujan esas áreas, con estas mismas funciones.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { escalonesDelRango, objetivoEnCelda, objetivoEnPalabras, type EscalonDelObjetivoApi, type VigenciaDePlan } from '@be/domain';
import { diaYMes, type TemporadaDelLienzo, type TramoDelPanel } from '../nutricion-y-cuerpo/lienzo';
import { COPY_NUTRICION_EN_GRAFICOS as C } from './copy';
import type { MetricaDelGrafico } from './dias-de-nutricion';

const diaAnterior = (fecha: string): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** Las temporadas de Nutrición que tocan [desde, hasta]: cada versión del plan y cada versión del objetivo. */
export function temporadasDeNutricion(versiones: readonly VigenciaDePlan[], objetivo: readonly EscalonDelObjetivoApi[], desde: string, hasta: string): TemporadaDelLienzo[] {
  const tocan = (inicio: string, fin: string | null) => inicio <= hasta && (fin === null || fin >= desde);
  const planes = versiones
    .filter((v) => v.domain === 'NUTRITION' && tocan(v.from, v.to))
    .map(
      (v): TemporadaDelLienzo => ({
        clave: `plan:${v.planVersionId}`,
        tipo: 'PLAN',
        desde: v.from,
        hasta: v.to,
        rotulo: C.temporadaDelPlan(v.label, diaYMes(v.from)),
        corto: C.temporadaDelPlanCorta(v.label),
      }),
    );
  const porVersion = new Map<string, EscalonDelObjetivoApi>();
  for (const e of objetivo) if (!porVersion.has(e.objectiveVersionId)) porVersion.set(e.objectiveVersionId, e);
  const objetivos = [...porVersion.values()]
    .filter((e) => tocan(e.from, e.to))
    .map(
      (e): TemporadaDelLienzo => ({
        clave: `objetivo:${e.objectiveVersionId}`,
        tipo: 'OBJETIVO',
        desde: e.from,
        hasta: e.to,
        rotulo: C.temporadaDelObjetivo(diaYMes(e.from)),
        corto: C.temporadaDelObjetivoCorta,
      }),
    );
  return [...planes, ...objetivos].sort((a, b) => a.desde.localeCompare(b.desde) || (a.tipo === b.tipo ? 0 : a.tipo === 'PLAN' ? -1 : 1));
}

/**
 * El objetivo de una métrica en escalones, solo los que tienen una cantidad (kcal o g por día). Cada uno rige desde su
 * fecha (o el inicio del rango) hasta el día anterior al siguiente, su fin o el final del rango, lo primero.
 */
export function escalonesDelObjetivo(objetivo: readonly EscalonDelObjetivoApi[], desde: string, hasta: string, color: number): TramoDelPanel[] {
  const tramos = escalonesDelRango(objetivo, desde, hasta);
  return tramos.flatMap((t, i): TramoDelPanel[] => {
    if (!t.escalon.amount) return [];
    const siguiente = tramos[i + 1];
    const candidatos = [hasta, ...(t.escalon.to !== null ? [t.escalon.to] : []), ...(siguiente ? [diaAnterior(siguiente.desde)] : [])];
    const fin = candidatos.sort()[0]!;
    return fin >= t.desde ? [{ clave: `objetivo:${t.escalon.objectiveVersionId}:${t.desde}`, desde: t.desde, hasta: fin, valor: t.escalon.amount.value, color }] : [];
  });
}

/**
 * Los objetivos guardados como proporción de las calorías, escritos (no se dibujan ni se convierten): «Proteínas,
 * objetivo desde el 2/9: 30 de las calorías (proporción): BE no la convierte a gramos ni la dibuja.».
 */
export function proporcionesDelObjetivo(objetivo: readonly EscalonDelObjetivoApi[], metrica: MetricaDelGrafico, nombre: string, desde: string, hasta: string): string[] {
  return escalonesDelRango(objetivo, desde, hasta)
    .filter((t) => t.escalon.amount === null)
    .map((t) => C.proporcion(nombre, diaYMes(t.desde), objetivoEnPalabras(t.escalon, metrica)));
}

/** El objetivo que regía un día, para la lectura y la tabla: «objetivo 2.200 kcal», o `null` si no regía ninguno. */
export function objetivoDelDia(objetivo: readonly EscalonDelObjetivoApi[], metrica: MetricaDelGrafico, fecha: string): string | null {
  const texto = objetivoEnCelda(objetivo, metrica, fecha, fecha);
  return texto === null ? null : C.objetivoEnLaCelda(texto);
}
