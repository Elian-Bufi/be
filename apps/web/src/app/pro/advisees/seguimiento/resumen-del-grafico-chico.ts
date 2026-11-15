/**
 * El resumen en texto de un gráfico chico de «Comparar dos etapas» (GR-24), para el lector de pantalla (revisión del 15/11):
 * el del dominio (`partesDelResumenTextual`) **sin** «la primera, …; la última, …», que es el encuadre de primero contra
 * último que las reglas de los gráficos no permiten (WP-GRAFICOS §5.12). Lo demás queda: cuántas observaciones con valor,
 * cuántos subtotales, lo reportado, lo calculado, la carga rápida y los días sin completar.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import { partesDelResumenTextual, type DefinicionDeMetrica, type SerieAnalitica } from '@be/domain';

const PRIMERO_O_ULTIMO = /^la (primera|última),/;

export function resumenSinPrimeroNiUltimo(serie: SerieAnalitica, definicion: DefinicionDeMetrica, desde: string, hasta: string): string {
  const { encabezado, partes } = partesDelResumenTextual(serie, definicion, desde, hasta);
  if (partes.length === 0) return `${encabezado}: no hay datos en este período.`;
  return `${encabezado}: ${partes.filter((p) => !PRIMERO_O_ULTIMO.test(p)).join('; ')}.`;
}
