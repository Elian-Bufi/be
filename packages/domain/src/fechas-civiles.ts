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

/** Desfase (ms) entre la hora civil de la zona y UTC en ese instante; 0 si la zona no se reconoce. */
function desfaseDeZona(instante: number, zonaHoraria: string): number {
  try {
    const partes = new Intl.DateTimeFormat('en-US', { timeZone: zonaHoraria, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(instante));
    const n = (tipo: Intl.DateTimeFormatPartTypes): number => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
    return Date.UTC(n('year'), n('month') - 1, n('day'), n('hour') % 24, n('minute'), n('second')) - Math.floor(instante / 1000) * 1000;
  } catch {
    return 0;
  }
}

/** El instante (ms) en que empieza una fecha civil en una zona. Con un cambio de horario ese mismo día, se corrige una vez más. */
export function inicioDelDia(fechaCivilAaaaMmDd: string, zonaHoraria: string): number {
  const supuesto = utcDe(fechaCivilAaaaMmDd);
  const primero = supuesto - desfaseDeZona(supuesto, zonaHoraria);
  return supuesto - desfaseDeZona(primero, zonaHoraria);
}

/** Una fecha civil válida (`AAAA-MM-DD` y existente en el calendario). */
export const esFechaCivil = (valor: unknown): valor is string => typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && new Date(utcDe(valor)).toISOString().slice(0, 10) === valor;
