/**
 * «Hace un rato», sin cruzar la medianoche de Buenos Aires (UTC−3, sin horario de verano).
 *
 * Cerca de las 00:00, «hace 30 minutos» es el día civil anterior, y la línea de tiempo lo cuenta, con razón, como cargado
 * otro día. Las pruebas que esperan una evaluación o un objetivo de hoy fallaban entre las 00:00 y la 01:00 de Argentina
 * (pasó el 2026-10-20 a las 00:18, en `analisis.int-spec.ts`). Con esto, el instante queda en el mismo día civil, conserva
 * el orden entre dos llamadas con minutos distintos (la evaluación antes que el objetivo) y nunca es futuro.
 */
const DESFASAJE_DE_BUENOS_AIRES_MS = 3 * 3_600_000;
const DIA_MS = 86_400_000;

export function haceUnRatoHoy(minutos: number, ahora: number = Date.now()): Date {
  const inicioDelDia = Math.floor((ahora - DESFASAJE_DE_BUENOS_AIRES_MS) / DIA_MS) * DIA_MS + DESFASAJE_DE_BUENOS_AIRES_MS;
  // Si «hace un rato» cae ayer, va al comienzo de hoy, corrido unos segundos según los minutos pedidos: así, la llamada
  // de 60 minutos queda antes que la de 30, como cuando no hay medianoche en el medio.
  const alComienzo = Math.min(inicioDelDia + (60 - Math.min(minutos, 60)) * 1000, ahora);
  return new Date(Math.max(ahora - minutos * 60_000, alComienzo));
}
