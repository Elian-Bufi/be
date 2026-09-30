/**
 * Fechas civiles (`AAAA-MM-DD`) sin depender de la zona del proceso ni del navegador: la zona se pasa siempre.
 * Lo comparten la cartera del profesional (revisiones vencidas o próximas por días de calendario) y cualquier lectura
 * que clasifique por día local, como la evolución antropométrica.
 */

/** La fecha civil de un instante en una zona; si la zona no se reconoce, la fecha UTC del instante. */
export function fechaCivil(instante: string, zonaHoraria: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instante));
  } catch {
    return instante.slice(0, 10);
  }
}

const DIA = 86_400_000;

const utcDe = (fechaCivilAaaaMmDd: string): number => {
  const [a, m, d] = fechaCivilAaaaMmDd.split('-').map(Number);
  return Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1);
};

/** Días de calendario entre dos fechas civiles (`b − a`); negativo si `b` es anterior. Aritmética de calendario, no de milisegundos. */
export const diasEntreFechas = (a: string, b: string): number => Math.round((utcDe(b) - utcDe(a)) / DIA);

/** La fecha civil siguiente. */
export const diaSiguiente = (fechaCivilAaaaMmDd: string): string => new Date(utcDe(fechaCivilAaaaMmDd) + DIA).toISOString().slice(0, 10);
